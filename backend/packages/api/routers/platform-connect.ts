import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  TikTokConnectError,
  completeTikTokConnect,
  disconnectTikTok,
  listConnectedAccounts,
  loadAccountSnapshots,
  startTikTokConnect,
  syncTikTok,
} from "@poststreak/workflows";
import { createTRPCRouter, protectedProcedure, TIER_LIMITS, type Context, type User } from "../context";
import { enforceRateLimit } from "../rate-limit";
import { toAppPlatform } from "../lib/platforms";
import { tiktokDeps } from "../lib/tiktok-deps";

// Connecting a creator's real social accounts. TikTok first; each platform
// joins this router as its OAuth goes live. See backend/PHASE1_CONTRACT.md and
// packages/workflows/tiktok-connect.ts for how the flow works.

/** Free plans connect up to TIER_LIMITS.free.maxConnectedPlatforms; reconnecting TikTok never counts against it. */
async function assertCanConnectAnother(ctx: Context & { user: User }): Promise<void> {
  const max = TIER_LIMITS[ctx.user.tier].maxConnectedPlatforms;
  if (max === Infinity) return;

  const { data } = await ctx.supabase
    .from("platform_connections")
    .select("platform")
    .eq("user_id", ctx.user.id)
    .is("disconnected_at", null);
  const active = data ?? [];
  if (active.some((c) => c.platform === "tiktok") || active.length < max) return;

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
  if (err instanceof TikTokConnectError) {
    const code = {
      invalid_state: "BAD_REQUEST",
      provider_rejected: "BAD_GATEWAY",
      missing_scope: "BAD_REQUEST",
      account_in_use: "CONFLICT",
    }[err.reason] as TRPCError["code"];
    throw new TRPCError({ code, message: err.message });
  }
  throw err;
}

export const platformConnectRouter = createTRPCRouter({
  /**
   * Step 1. Returns the TikTok page to send the creator to. `client` says
   * whether the creator is in the web app or the phone app; the callback page
   * uses it to decide where to hand the code back.
   */
  tiktokAuthorize: protectedProcedure
    .input(z.object({ client: z.enum(["web", "mobile"]).default("web") }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(`tiktok:authorize:${ctx.user.id}`, 10, 60 * 60);
      const deps = tiktokDeps();
      await assertCanConnectAnother(ctx);
      return startTikTokConnect(deps, ctx.user.id, input.client);
    }),

  /**
   * Step 3. The app posts the `code` and `state` TikTok sent back to the
   * callback page. Must come from the same signed-in creator who started it.
   */
  tiktokCallback: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(2048), state: z.string().min(20).max(200) }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(`tiktok:callback:${ctx.user.id}`, 20, 60 * 60);
      const deps = tiktokDeps();
      try {
        const account = await completeTikTokConnect(deps, { userId: ctx.user.id, code: input.code, state: input.state });
        await ctx.track("platform_connected", { platform: "tiktok", status: account.status });
        return { connected: true as const, account };
      } catch (err) {
        connectErrorToTrpc(err);
      }
    }),

  /** Refresh the numbers now (the nightly job does it too). */
  tiktokSync: protectedProcedure.mutation(async ({ ctx }) => {
    await enforceRateLimit(`tiktok:sync:${ctx.user.id}`, 6, 60 * 60);
    return syncTikTok(tiktokDeps(), ctx.user.id);
  }),

  tiktokDisconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await disconnectTikTok(tiktokDeps(), ctx.user.id);
    await ctx.track("platform_disconnected", { platform: "tiktok" });
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
