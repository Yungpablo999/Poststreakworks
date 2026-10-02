import { createTRPCRouter, protectedProcedure, createSupabaseServiceClient, TIER_LIMITS } from "../context";
import { TRPCError } from "@trpc/server";

// The weekly Repurpose allowance (free plan: TIER_LIMITS.free.repurposesPerWeek
// per week; Pro: unlimited). "This week" starts Monday 00:00 in the creator's
// own time zone. The count is enforced here, not in the app: repurpose_jobs is
// read-only to creators, and spend_repurpose() checks-and-spends atomically so
// two taps can't both slip under the limit.

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
   * Uses one repurpose. When a free plan has none left this is NOT an error:
   * `allowed` is false and the app shows its upgrade prompt.
   */
  spend: protectedProcedure.mutation(async ({ ctx }) => {
    const weeklyLimit = TIER_LIMITS[ctx.user.tier].repurposesPerWeek;

    const { data, error } = await createSupabaseServiceClient().rpc("spend_repurpose", {
      p_user_id: ctx.user.id,
      p_weekly_limit: weeklyLimit,
    });
    if (error || !data) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to use a repurpose" });
    }

    const result = data as { allowed: boolean; used: number; limit: number | null };
    await ctx.track(result.allowed ? "repurpose_used" : "repurpose_limit_hit", {
      used: result.used,
      limit: result.limit,
    });

    return {
      allowed: result.allowed,
      usedThisWeek: result.used,
      weeklyLimit: result.limit,
      upgradeRequired: !result.allowed,
    };
  }),
});
