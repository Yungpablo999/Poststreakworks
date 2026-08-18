import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

// ============================================================================
// Streak Engine Constants
// ============================================================================

const JARVIS_THRESHOLDS = {
  thriving: { min: 30, emotion: "thriving" as const },
  happy: { min: 14, emotion: "happy" as const },
  content: { min: 7, emotion: "content" as const },
  neutral: { min: 3, emotion: "neutral" as const },
  concerned: { min: 2, emotion: "concerned" as const },
  worried: { min: 1, emotion: "worried" as const },
  at_risk: { min: 0, emotion: "at_risk" as const },
};

function calculateJarvisEmotion(
  currentStreak: number,
  lastQualifyingDay: string | null,
): string {
  // If no qualifying action today, shift down
  const today = getWATDate();
  if (lastQualifyingDay !== today) {
    if (lastQualifyingDay === getYesterdayWAT()) {
      return "worried"; // Missed today but had yesterday
    }
    if (!lastQualifyingDay) return "heartbroken";
    return "devastated"; // Streak broken
  }

  for (const [, threshold] of Object.entries(JARVIS_THRESHOLDS)) {
    if (currentStreak >= threshold.min) return threshold.emotion;
  }
  return "neutral";
}

function getWATDate(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
    .split("T")[0]!;
}

function getYesterdayWAT(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d
    .toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
    .split("T")[0]!;
}

// ============================================================================
// Router
// ============================================================================

export const streakGamificationRouter = createTRPCRouter({
  /**
   * Get the current user's streak state.
   * Creates a default row if none exists.
   */
  getState: protectedProcedure.query(async ({ ctx }) => {
    let { data, error } = await ctx.supabase
      .from("streak_states")
      .select("*")
      .eq("user_id", ctx.user.id)
      .single();

    // Auto-create on first access
    if (error?.code === "PGRST116") {
      const { data: created, error: createErr } = await ctx.supabase
        .from("streak_states")
        .insert({ user_id: ctx.user.id })
        .select()
        .single();

      if (createErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize streak state",
        });
      }
      data = created;
    } else if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch streak state",
      });
    }

    // Update Jarvis emotion based on current state
    const today = getWATDate();
    const emotion = calculateJarvisEmotion(
      data!.current_streak,
      data!.last_qualifying_day,
    );

    if (emotion !== data!.jarvis_emotion) {
      await ctx.supabase
        .from("streak_states")
        .update({ jarvis_emotion: emotion })
        .eq("user_id", ctx.user.id);
      data!.jarvis_emotion = emotion;
    }

    return data;
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

  /**
   * Get available streak freezes.
   */
  getFreezes: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("streak_freezes")
      .select("*")
      .eq("user_id", ctx.user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch freezes",
      });
    }

    return data;
  }),

  /**
   * Use a streak freeze to protect today's streak.
   */
  useFreeze: protectedProcedure.mutation(async ({ ctx }) => {
    const today = getWATDate();

    // Check if already qualified today
    const { data: existingEvent } = await ctx.supabase
      .from("streak_events")
      .select("id")
      .eq("user_id", ctx.user.id)
      .eq("event_date", today)
      .limit(1)
      .single();

    if (existingEvent) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Already qualified today, no need to use a freeze",
      });
    }

    // Find an available freeze
    const { data: freeze } = await ctx.supabase
      .from("streak_freezes")
      .select("id")
      .eq("user_id", ctx.user.id)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .single();

    if (!freeze) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No streak freezes available",
      });
    }

    // Consume the freeze
    const { error: deleteErr } = await ctx.supabase
      .from("streak_freezes")
      .delete()
      .eq("id", freeze.id);

    if (deleteErr) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to use freeze",
      });
    }

    // Update last_qualifying_day to yesterday to keep streak alive
    await ctx.supabase
      .from("streak_states")
      .update({ last_qualifying_day: getYesterdayWAT() })
      .eq("user_id", ctx.user.id);

    // Track analytics
    await ctx.supabase.from("analytics_events").insert({
      user_id: ctx.user.id,
      event_name: "streak_freeze_used",
    });

    return { success: true };
  }),

  /**
   * Record a qualifying streak event (called by workflows, not directly by users).
   * This is the core streak advancement logic.
   */
  recordEvent: protectedProcedure
    .input(
      z.object({
        eventType: z.enum([
          "publish",
          "mission_completion",
          "collaboration_completion",
        ]),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const today = getWATDate();

      // Check if already qualified today
      const { data: existingEvent } = await ctx.supabase
        .from("streak_events")
        .select("id")
        .eq("user_id", ctx.user.id)
        .eq("event_date", today)
        .limit(1)
        .single();

      if (existingEvent) {
        return { qualified: false, reason: "Already qualified today" };
      }

      // Write the event
      const { error: eventErr } = await ctx.supabase
        .from("streak_events")
        .insert({
          user_id: ctx.user.id,
          event_type: input.eventType,
          event_date: today,
          metadata: input.metadata ?? {},
        });

      if (eventErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record streak event",
        });
      }

      // Update streak state
      const { data: state } = await ctx.supabase
        .from("streak_states")
        .select("*")
        .eq("user_id", ctx.user.id)
        .single();

      if (!state) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Streak state not found",
        });
      }

      const yesterday = getYesterdayWAT();
      const isConsecutive =
        state.last_qualifying_day === yesterday || state.current_streak === 0;

      const newStreak = isConsecutive ? state.current_streak + 1 : 1;
      const newLongest = Math.max(newStreak, state.longest_streak);
      const emotion = calculateJarvisEmotion(newStreak, today);

      const { error: updateErr } = await ctx.supabase
        .from("streak_states")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_qualifying_day: today,
          jarvis_emotion: emotion,
        })
        .eq("user_id", ctx.user.id);

      if (updateErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update streak",
        });
      }

      // Check for milestone achievements
      const milestoneChecks = [7, 14, 30, 50, 100, 365];
      for (const threshold of milestoneChecks) {
        if (newStreak === threshold) {
          await ctx.supabase.from("milestones").insert({
            user_id: ctx.user.id,
            milestone_type: `${threshold}_day_streak`,
          });

          // Award credits for milestone
          const creditAmount = threshold * 2;
          await ctx.supabase.from("credits").insert({
            user_id: ctx.user.id,
            type: "earn",
            amount: creditAmount,
            source: "streak_milestone",
            description: `${threshold}-day streak milestone`,
          });
        }
      }

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "streak_qualified",
        properties: {
          event_type: input.eventType,
          new_streak: newStreak,
          is_milestone: milestoneChecks.includes(newStreak),
        },
      });

      return { qualified: true, newStreak, emotion, isMilestone: milestoneChecks.includes(newStreak) };
    }),
});
