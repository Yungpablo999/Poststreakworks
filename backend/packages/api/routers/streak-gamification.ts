import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { recordStreakEvent, calculateJarvisEmotion, todayWAT, yesterdayWAT, levelForXp, getXpBalance } from "@poststreak/workflows";

// Jarvis emotion calc and WAT date math live in packages/workflows/streak-engine.ts
// (ported from v1's src/lib/streak.ts) — shared with the cron dispatch job,
// which has no tRPC context to call this router through. Previously this
// file had its own copy of both; that duplication is what got removed here.

// ============================================================================
// Router
// ============================================================================

export const streakGamificationRouter = createTRPCRouter({
  /**
   * Get the current user's streak state.
   * Creates a default row if none exists.
   */
  getState: protectedProcedure.query(async ({ ctx }) => {
    const { data: initialData, error } = await ctx.supabase
      .from("streak_states")
      .select("*")
      .eq("user_id", ctx.user.id)
      .single();
    let data = initialData;

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

    // Simplified 3-state status the frontend actually renders (active/at_risk/
    // frozen) vs. the 9-state jarvis_emotion enum it doesn't directly consume.
    const streakStatus =
      emotion === "thriving" || emotion === "happy" || emotion === "content" || emotion === "neutral"
        ? "active"
        : emotion === "concerned" || emotion === "worried"
          ? "at_risk"
          : "frozen";

    const xp = await getXpBalance(ctx.supabase, ctx.user.id);
    const { level, nextLevelXp } = levelForXp(xp);

    return { ...data, streakStatus, xp, level, nextLevelXp };
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
    const today = todayWAT();

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
      .update({ last_qualifying_day: yesterdayWAT() })
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
      return recordStreakEvent(ctx.supabase, ctx.user.id, input.eventType, input.metadata);
    }),
});
