import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { awardXp } from "@poststreak/workflows";

// EarningsScreen's $0.00 / $1,420.50 figures are static strings in the
// frontend today — no real payment processor is wired to this domain yet
// (confirmed by the screen audit: no Stripe/IAP fields anywhere on this
// screen). Modeled as a "tracked" ledger, not real money movement — matches
// the frontend's own "trackedExternalEarnings" naming.

export const earningsRouter = createTRPCRouter({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const [events, goal, campaigns] = await Promise.all([
      ctx.supabase
        .from("earnings_events")
        .select("type, amount, status")
        .eq("user_id", ctx.user.id),
      ctx.supabase
        .from("income_goals")
        .select("*")
        .eq("user_id", ctx.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      ctx.supabase
        .from("brand_campaigns")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const rows = events.data ?? [];
    const currentBalance = rows
      .filter((r) => r.type === "campaign_payout" && r.status === "confirmed")
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingPayouts = rows
      .filter((r) => r.type === "payout_requested")
      .reduce((sum, r) => sum + r.amount, 0);
    const lifetimeEarnings = rows
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + r.amount, 0);
    const trackedExternalEarnings = rows
      .filter((r) => r.type === "external_tracked")
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      currentBalance,
      pendingPayouts,
      lifetimeEarnings,
      trackedExternalEarnings,
      activeMilestoneGoal: goal.data?.label ?? null,
      targetMilestoneAmount: goal.data?.target_amount ?? null,
      campaigns: (campaigns.data ?? []).map((c) => ({
        id: c.id,
        brandName: c.brand_name,
        title: c.title,
        payout: c.payout,
        requirementsSummary: c.requirements_summary,
        minReadinessScore: c.min_readiness_score,
      })),
    };
  }),

  setGoal: protectedProcedure
    .input(z.object({ targetAmount: z.number().int().positive(), label: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // XP only on a user's first-ever goal (matches API_SPECIFICATION.md's
      // xpAwarded: 100 alongside QUESTS.md's "Set your $50 income goal"
      // starter quest) — not on every edit, or changing your mind about the
      // target would farm XP indefinitely.
      const { count: existingGoalCount } = await ctx.supabase
        .from("income_goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id);
      const isFirstGoal = (existingGoalCount ?? 0) === 0;

      // One active goal at a time — deactivate any existing before inserting.
      await ctx.supabase
        .from("income_goals")
        .update({ is_active: false })
        .eq("user_id", ctx.user.id)
        .eq("is_active", true);

      const { data, error } = await ctx.supabase
        .from("income_goals")
        .insert({ user_id: ctx.user.id, label: input.label, target_amount: input.targetAmount })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set income goal",
        });
      }

      const xpAwarded = isFirstGoal ? 100 : 0;
      if (xpAwarded > 0) {
        await awardXp(ctx.supabase, ctx.user.id, xpAwarded, "income_goal_set", input.label);
      }

      return { ...data, xpAwarded };
    }),

  requestPayout: protectedProcedure
    .input(z.object({ amount: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from("earnings_events").insert({
        user_id: ctx.user.id,
        type: "payout_requested",
        amount: input.amount,
        status: "pending",
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to request payout",
        });
      }

      return { success: true };
    }),
});
