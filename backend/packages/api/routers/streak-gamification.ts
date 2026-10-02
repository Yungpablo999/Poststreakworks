import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { getCheckInSummary, levelForXp, getXpBalance, recordStreakEvent } from "@poststreak/workflows";

// The streak is read from the check-in log and advanced by ONE database
// function (record_qualifying_action) — see packages/workflows/streak-engine.ts.
//
// Removed in the October 2026 realignment, on purpose:
//   - recordEvent: let any signed-in user advance their own streak on demand.
//     Streaks advance only from real actions (check-in, publish, missions).
//   - getFreezes / useFreeze: the freeze mechanic never worked (it deleted rows
//     RLS didn't allow) and the product is now "never guilt for a missed day".
//   - the Jarvis emotion ladder (worried / devastated / heartbroken): Jarvis has
//     no emotions any more; Ghost's mood is decided by the app from what the
//     creator does.

export const streakGamificationRouter = createTRPCRouter({
  /**
   * Streak + level summary. Shape kept compatible with the earlier
   * GET /quests/streak response, plus the new `checkIn` block.
   */
  getState: protectedProcedure.query(async ({ ctx }) => {
    const [checkIn, xp, { data: state }] = await Promise.all([
      getCheckInSummary(ctx.user.id),
      getXpBalance(ctx.supabase, ctx.user.id),
      ctx.supabase
        .from("streak_states")
        .select("last_qualifying_day")
        .eq("user_id", ctx.user.id)
        .maybeSingle(),
    ]);
    const { level, nextLevelXp } = levelForXp(xp);

    return {
      current_streak: checkIn.currentDays,
      longest_streak: checkIn.longestDays,
      last_qualifying_day: (state?.last_qualifying_day as string | null | undefined) ?? null,
      // The earlier 'at_risk' / 'frozen' states are gone; kept so existing
      // clients that read the field keep working.
      streakStatus: "active" as const,
      xp,
      level,
      nextLevelXp,
      checkIn,
    };
  }),

  /** The check-in streak as Home / Quests show it. */
  getCheckIn: protectedProcedure.query(({ ctx }) => getCheckInSummary(ctx.user.id)),

  /**
   * Check in for the creator's local today. Idempotent: checking in twice in a
   * day returns the same summary with `newlyCheckedIn: false`.
   */
  checkIn: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await recordStreakEvent(ctx.user.id, "check_in");
    if (!result.qualified && result.reason === "error") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Couldn't save your check-in. Please try again.",
      });
    }
    const summary = await getCheckInSummary(ctx.user.id);

    if (result.qualified) {
      await ctx.track("check_in", { streak: result.newStreak, is_milestone: result.isMilestone });
    }

    return {
      newlyCheckedIn: result.qualified,
      isMilestone: result.qualified ? result.isMilestone : false,
      summary,
    };
  }),

  /** Days with a check-in in one calendar month (for the calendar pop-up). */
  getCheckInMonth: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2100), month: z.number().int().min(0).max(11) }))
    .query(async ({ ctx, input }) => {
      // `month` is 0-based like JavaScript's Date. Pure date arithmetic, no
      // time zone involved: event_date is already the creator's local date.
      const from = new Date(Date.UTC(input.year, input.month, 1));
      const to = new Date(Date.UTC(input.year, input.month + 1, 0));
      const iso = (d: Date) => d.toISOString().slice(0, 10);

      const { data, error } = await ctx.supabase
        .from("streak_events")
        .select("event_date")
        .eq("user_id", ctx.user.id)
        .gte("event_date", iso(from))
        .lte("event_date", iso(to))
        .order("event_date");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch check-ins",
        });
      }

      return {
        year: input.year,
        month: input.month,
        days: (data ?? []).map((r) => r.event_date as string),
      };
    }),

  /**
   * Get recent streak events.
   */
  getEvents: protectedProcedure
    .input(
      z.object({
        since: z.string().date().optional(),
        limit: z.number().min(1).max(100).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("streak_events")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("event_date", { ascending: false })
        .limit(input.limit);

      if (input.since) {
        query = query.gte("event_date", input.since);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch streak events",
        });
      }

      return data;
    }),

  /**
   * Get credit transaction history.
   */
  getCreditHistory: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("credits")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch credits",
      });
    }

    return data;
  }),

  /**
   * Get the user's current credit balance.
   */
  getCreditBalance: protectedProcedure.query(async ({ ctx }) => {
    const [earns, redeems] = await Promise.all([
      ctx.supabase
        .from("credits")
        .select("amount")
        .eq("user_id", ctx.user.id)
        .eq("type", "earn"),
      ctx.supabase
        .from("credits")
        .select("amount")
        .eq("user_id", ctx.user.id)
        .eq("type", "redeem"),
    ]);

    const earned =
      earns.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const redeemed =
      redeems.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

    return { balance: earned - redeemed, earned, redeemed };
  }),

  /**
   * Get all milestones achieved.
   */
  getMilestones: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("milestones")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("achieved_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch milestones",
      });
    }

    return data;
  }),
});
