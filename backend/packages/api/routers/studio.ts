import { TRPCError } from "@trpc/server";
import { aiMode } from "@poststreak/integrations";
import {
  StudioError,
  captionEditInput,
  captionsInput,
  editCaption,
  hooksInput,
  rewriteScriptPart,
  scriptInput,
  scriptPartInput,
  writeCaptions,
  writeHooks,
  writeScript,
} from "@poststreak/ai/studio";
import { TIER_LIMITS, createSupabaseServiceClient, createTRPCRouter, protectedProcedure, requirePro, type Context, type User } from "../context";

// The writing tools: script, hooks, captions and small caption edits (Repurpose is in routers/repurpose.ts).
// Jarvis only SUGGESTS: packages/ai/studio.ts checks every reply before it gets here.
//
// What a creator may have is decided here, not in the app:
//   * a new piece of writing (a script, three captions, three hooks) counts against the day's
//     "generate" allowance, a small change to something already written (rewrite a part, shorten a
//     caption, suggest tags) against the day's "edit" allowance; the free plan has a few of each, Pro has no limit;
//   * the count is taken BEFORE the model is asked, atomically (spend_ai, migration …26), and given back
//     if the model fails, so two taps can't both slip under the limit and a failure costs nothing.

type Kind = "generate" | "edit";
export type Usage = { used: number; limit: number | null };

const LIMIT_KEY = { generate: "aiGenerationsPerDay", edit: "aiEditsPerDay" } as const;

/** The plan's daily number for this kind of write; null = no limit. */
export function limitFor(tier: User["tier"], kind: Kind): number | null {
  const n = TIER_LIMITS[tier][LIMIT_KEY[kind]];
  return n === Infinity ? null : n;
}

/** Nothing here works without a model; the app hides these tools when the server says so (capabilities.ai). */
export function requireAi(): void {
  if (aiMode() === "off") throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Jarvis isn't switched on for PostStreak yet." });
}

/** A model failure as the error the app is told: it couldn't be reached (503) or it answered badly twice (502). */
export function toTrpc(err: unknown): never {
  if (err instanceof TRPCError) throw err;
  if (err instanceof StudioError) {
    throw new TRPCError({ code: err.kind === "unavailable" ? "SERVICE_UNAVAILABLE" : "BAD_GATEWAY", message: err.message });
  }
  console.error("studio:", err instanceof Error ? err.message : err);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong. Try again." });
}

type Ctx = { user: User; track: Context["track"] };

/** Runs `work` with one write of `kind` counted for the creator; gives it back if `work` fails. */
async function metered<T extends object>(ctx: Ctx, kind: Kind, tool: string, work: () => Promise<T>): Promise<T & { usage: Usage }> {
  requireAi();
  const limit = limitFor(ctx.user.tier, kind);
  const db = createSupabaseServiceClient();
  const { data, error } = await db.rpc("spend_ai", { p_user_id: ctx.user.id, p_kind: kind, p_tool: tool, p_daily_limit: limit });
  if (error || !data) {
    console.error("spend_ai failed:", error?.message);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong. Try again." });
  }
  const spent = data as { allowed: boolean; used: number; limit: number | null; id?: string };
  if (!spent.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        kind === "generate"
          ? `You've used today's ${spent.limit} writes with Jarvis. They come back tomorrow, or Pro has no limit.`
          : `You've used today's ${spent.limit} quick edits. They come back tomorrow, or Pro has no limit.`,
      cause: {
        upgradeRequired: true,
        upsell: { title: "Unlock unlimited Jarvis", features: ["No daily limit on scripts, captions, hooks and edits"], upgradeUrl: "/api/v1/billing/checkout" },
      },
    });
  }
  try {
    const result = await work();
    await ctx.track(`ai_${tool.replace(/-/g, "_")}_used`, { kind });
    return { ...result, usage: { used: spent.used, limit: spent.limit } };
  } catch (err) {
    const { error: refundError } = await db.rpc("refund_ai", { p_user_id: ctx.user.id, p_id: spent.id });
    if (refundError) console.error("refund_ai failed:", refundError.message);
    return toTrpc(err);
  }
}

export const studioRouter = createTRPCRouter({
  /** How many of today's writes and edits the creator has used, for the little "2 left today" on each tool. */
  usage: protectedProcedure.query(async ({ ctx }) => {
    const db = createSupabaseServiceClient();
    const [generate, edit] = await Promise.all([
      db.rpc("ai_used_today", { p_user_id: ctx.user.id, p_kind: "generate" }),
      db.rpc("ai_used_today", { p_user_id: ctx.user.id, p_kind: "edit" }),
    ]);
    if (generate.error || edit.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't read your usage" });
    return {
      generate: { used: (generate.data as number | null) ?? 0, limit: limitFor(ctx.user.tier, "generate") },
      edit: { used: (edit.data as number | null) ?? 0, limit: limitFor(ctx.user.tier, "edit") },
    };
  }),

  /** A script in four parts for an idea. */
  script: protectedProcedure
    .input(scriptInput)
    .mutation(({ ctx, input }) => metered(ctx, "generate", "script", async () => ({ script: await writeScript(input) }))),

  /** One part of a script, written again. */
  scriptPart: protectedProcedure.input(scriptPartInput).mutation(({ ctx, input }) => metered(ctx, "edit", "script-part", () => rewriteScriptPart(input))),

  /** Three opening lines (Hook Studio is a Pro tool). */
  hooks: protectedProcedure.input(hooksInput).mutation(({ ctx, input }) => {
    requirePro(ctx.user, ["Hook Studio: three strong opening lines for any idea"]);
    return metered(ctx, "generate", "hooks", () => writeHooks(input));
  }),

  /** Three caption options for a post. */
  captions: protectedProcedure.input(captionsInput).mutation(({ ctx, input }) => metered(ctx, "generate", "captions", () => writeCaptions(input))),

  /** Rewrite, shorten, end with a question, or suggest hashtags, for a caption the creator already has. */
  captionEdit: protectedProcedure.input(captionEditInput).mutation(({ ctx, input }) => metered(ctx, "edit", "caption-edit", () => editCaption(input))),
});
