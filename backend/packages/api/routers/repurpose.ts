import { createTRPCRouter, protectedProcedure, createSupabaseServiceClient, TIER_LIMITS } from "../context";
import { TRPCError } from "@trpc/server";
import { repurposeInput, repurposeText } from "@poststreak/ai/studio";
import { requireAi, toTrpc } from "./studio";

// Repurpose: one idea or post, written for each platform. The weekly allowance (free plan:
// TIER_LIMITS.free.repurposesPerWeek per week; Pro: unlimited; "this week" starts Monday 00:00 in the
// creator's own time zone) is spent by the writing itself, here, not by the app: repurpose_jobs is
// read-only to creators, and spend_repurpose() checks-and-spends atomically so two taps can't both
// slip under the limit. If Jarvis fails, the run is given back.

export type RepurposeAllowance = {
  usedThisWeek: number;
  /** null = unlimited (Pro). */
  weeklyLimit: number | null;
};

export const repurposeRouter = createTRPCRouter({
  allowance: protectedProcedure.query(async ({ ctx }): Promise<RepurposeAllowance> => {
    const { data, error } = await createSupabaseServiceClient().rpc("repurpose_used_this_week", {
      p_user_id: ctx.user.id,
    });
    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to read your allowance" });
    }
    return {
      usedThisWeek: (data as number | null) ?? 0,
      weeklyLimit: TIER_LIMITS[ctx.user.tier].repurposesPerWeek,
    };
  }),

  /**
   * Writes a version for each platform and uses one of the week's repurposes. A free plan with none
   * left gets a 429 that says so (the app shows its upgrade prompt); nothing is spent when Jarvis fails.
   */
  generate: protectedProcedure.input(repurposeInput).mutation(async ({ ctx, input }) => {
    requireAi();
    const weeklyLimit = TIER_LIMITS[ctx.user.tier].repurposesPerWeek;
    const db = createSupabaseServiceClient();

    const { data, error } = await db.rpc("spend_repurpose", { p_user_id: ctx.user.id, p_weekly_limit: weeklyLimit });
    if (error || !data) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to use a repurpose" });
    }
    const spent = data as { allowed: boolean; used: number; limit: number | null; job_id?: string };
    if (!spent.allowed) {
      await ctx.track("repurpose_limit_hit", { used: spent.used, limit: spent.limit });
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "You've used this week's free Repurpose. It comes back on Monday, or Pro has no limit.",
        cause: {
          upgradeRequired: true,
          upsell: { title: "Unlock unlimited Repurpose", features: ["Repurpose as often as you like"], upgradeUrl: "/api/v1/billing/checkout" },
        },
      });
    }

    try {
      const { versions } = await repurposeText(input);
      // Keep what was made with the run, so the count and the work can't drift apart
      const { error: saveError } = await db
        .from("repurpose_jobs")
        .update({ source: { kind: "text", text: input.text, platforms: input.platforms, prefer: input.prefer }, versions })
        .eq("id", spent.job_id);
      if (saveError) console.error("repurpose: could not keep the versions:", saveError.message);
      await ctx.track("repurpose_used", { used: spent.used, limit: spent.limit, platforms: input.platforms.length });
      return { versions, usedThisWeek: spent.used, weeklyLimit: spent.limit };
    } catch (err) {
      // Jarvis didn't deliver: the run doesn't count
      const { error: refundError } = await db.from("repurpose_jobs").delete().eq("id", spent.job_id).eq("user_id", ctx.user.id);
      if (refundError) console.error("repurpose: could not give the run back:", refundError.message);
      return toTrpc(err);
    }
  }),
});
