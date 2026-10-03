import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PROVIDER_NAMES, type ProviderId } from "@poststreak/integrations";
import {
  SocialConnectError,
  completeConnect,
  disconnectAccount,
  listConnectedAccounts,
  loadAccountSnapshots,
  notify,
  startConnect,
  syncAccount,
} from "@poststreak/workflows";
import { createTRPCRouter, protectedProcedure, TIER_LIMITS, type Context, type User } from "../context";
import { enforceRateLimit } from "../rate-limit";
import { toAppPlatform } from "../lib/platforms";
import { socialDeps } from "../lib/social-deps";

// Connecting a creator's real social accounts: TikTok, Instagram, Threads, Facebook, YouTube.
// The flow is the same for each (packages/workflows/social-connect.ts); what differs is in the
// platform's adapter (packages/integrations/providers). See backend/PHASE1_CONTRACT.md.

/** Must list exactly the platforms in packages/integrations/providers/types.ts. */
const providerSchema = z.enum(["tiktok", "instagram", "threads", "facebook", "youtube"]) satisfies z.ZodType<ProviderId>;

/** Free plans connect up to TIER_LIMITS.free.maxConnectedPlatforms; reconnecting a platform never counts against it. */
async function assertCanConnectAnother(ctx: Context & { user: User }, provider: ProviderId): Promise<void> {
  const max = TIER_LIMITS[ctx.user.tier].maxConnectedPlatforms;
  if (max === Infinity) return;

  const { data } = await ctx.supabase
    .from("platform_connections")
    .select("platform")
    .eq("user_id", ctx.user.id)
    .is("disconnected_at", null);
  const active = data ?? [];
  if (active.some((c) => c.platform === provider) || active.length < max) return;

  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Free accounts can connect ${max} platforms.`,
    cause: {
      upgradeRequired: true,
      upsell: {
        title: "Unlock unlimited platform connections",
        features: ["Connect every platform you post on"],
        upgradeUrl: "/api/v1/billing/checkout",
      },
    },
  });
}

function connectErrorToTrpc(err: unknown): never {
  if (err instanceof SocialConnectError) {
    const code = {
      invalid_state: "BAD_REQUEST",
      provider_rejected: "BAD_GATEWAY",
      missing_scope: "BAD_REQUEST",
      no_account: "BAD_REQUEST",
      account_in_use: "CONFLICT",
    }[err.reason] as TRPCError["code"];
    throw new TRPCError({ code, message: err.message });
  }
  throw err;
}

export const platformConnectRouter = createTRPCRouter({
  /**
   * Step 1. Returns the platform's page to send the creator to. `client` says whether the creator
   * is in the web app or the phone app; the callback page uses it to decide where to hand the
   * code back.
   */
  authorize: protectedProcedure
    .input(z.object({ provider: providerSchema, client: z.enum(["web", "mobile"]).default("web") }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(`${input.provider}:authorize:${ctx.user.id}`, 10, 60 * 60);
      const deps = socialDeps(input.provider);
      await assertCanConnectAnother(ctx, input.provider);
      return startConnect(deps, ctx.user.id, input.client);
    }),

  /**
   * Step 3. The app posts the `code` and `state` the platform sent back to the callback page.
   * Must come from the same signed-in creator who started it.
   */
  callback: protectedProcedure
    .input(z.object({ provider: providerSchema, code: z.string().min(1).max(2048), state: z.string().min(20).max(200) }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(`${input.provider}:callback:${ctx.user.id}`, 20, 60 * 60);
      const deps = socialDeps(input.provider);
      try {
        const account = await completeConnect(deps, { userId: ctx.user.id, code: input.code, state: input.state });
        await ctx.track("platform_connected", { platform: input.provider, status: account.status });
        await notify(ctx.user.id, {
          key: `connected:${input.provider}`,
          type: "system",
          kind: "link",
          title: `Your ${PROVIDER_NAMES[input.provider]} is connected`,
          body: "PostStreak reads your numbers once a day.",
          action: { label: "See your growth", target: "platform-growth" },
        });
        return { connected: true as const, account };
      } catch (err) {
        connectErrorToTrpc(err);
      }
    }),

  /** Refresh the numbers now (the nightly job does it too). */
  sync: protectedProcedure.input(z.object({ provider: providerSchema })).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(`${input.provider}:sync:${ctx.user.id}`, 6, 60 * 60);
    return syncAccount(socialDeps(input.provider), ctx.user.id);
  }),

  disconnect: protectedProcedure.input(z.object({ provider: providerSchema })).mutation(async ({ ctx, input }) => {
    await disconnectAccount(socialDeps(input.provider), ctx.user.id);
    await ctx.track("platform_disconnected", { platform: input.provider });
    return { disconnected: true as const };
  }),

  /** The creator's connected accounts, as the app's Connect screens show them. */
  accounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await listConnectedAccounts(ctx.supabase, ctx.user.id);
    return accounts.flatMap((a) => {
      const platform = toAppPlatform(a.platform);
      return platform ? [{ ...a, platform }] : [];
    });
  }),

  /** `AccountSnapshot`s (src/data/index.ts) built from real synced posts. */
  growthSnapshots: protectedProcedure.query(async ({ ctx }) => {
    const { data: row } = await ctx.supabase.from("users").select("timezone").eq("id", ctx.user.id).single();
    const snapshots = await loadAccountSnapshots(ctx.supabase, ctx.user.id, (row?.timezone as string | undefined) ?? "Africa/Lagos");
    return snapshots.flatMap((s) => {
      const platform = toAppPlatform(s.platform);
      return platform ? [{ ...s, platform }] : [];
    });
  }),
});
