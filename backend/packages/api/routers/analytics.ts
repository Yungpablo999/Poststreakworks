import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure } from "../context";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = createTRPCRouter({
  /**
   * Track a custom analytics event.
   */
  track: protectedProcedure
    .input(
      z.object({
        eventName: z.string().min(1).max(100),
        properties: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: input.eventName,
        properties: input.properties ?? {},
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to track event",
        });
      }

      return { success: true };
    }),

  /**
   * Get the current user's events.
   */
  getMyEvents: protectedProcedure
    .input(
      z.object({
        eventName: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("analytics_events")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (input.eventName) {
        query = query.eq("event_name", input.eventName);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch events",
        });
      }

      return data;
    }),

  /**
   * Get the current user's growth metrics (personal scope).
   * Different from staff getAggregates — this is the creator's own numbers.
   */
  getMyGrowth: protectedProcedure.query(async ({ ctx }) => {
    const [posts, streak, credits, milestones, missions] = await Promise.all([
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("status", "published"),
      ctx.supabase
        .from("streak_states")
        .select("current_streak, longest_streak")
        .eq("user_id", ctx.user.id)
        .single(),
      ctx.supabase
        .from("credits")
        .select("amount")
        .eq("user_id", ctx.user.id)
        .eq("type", "earn"),
      ctx.supabase
        .from("milestones")
        .select("milestone_type")
        .eq("user_id", ctx.user.id),
      ctx.supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("status", "completed"),
    ]);

    return {
      totalPublishedPosts: posts.count ?? 0,
      currentStreak: streak.data?.current_streak ?? 0,
      longestStreak: streak.data?.longest_streak ?? 0,
      totalCreditsEarned:
        credits.data?.reduce((s, r) => s + r.amount, 0) ?? 0,
      milestonesCount: milestones.data?.length ?? 0,
      completedMissions: missions.count ?? 0,
    };
  }),

  // =========================================================================
  // Staff-only aggregate analytics
  // =========================================================================

  /**
   * Get system-wide aggregate stats.
   */
  getAggregates: staffProcedure.query(async ({ ctx }) => {
    const [users, posts, streaks, subs, reports] = await Promise.all([
      ctx.supabase
        .from("users")
        .select("id", { count: "exact", head: true }),
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      ctx.supabase
        .from("streak_states")
        .select("current_streak"),
      ctx.supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      ctx.supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return {
      totalUsers: users.count ?? 0,
      totalPublishedPosts: posts.count ?? 0,
      averageStreak:
        (streaks.data?.reduce((s, r) => s + r.current_streak, 0) ?? 0) /
        Math.max(streaks.data?.length ?? 1, 1),
      usersWith7PlusStreak:
        streaks.data?.filter((s) => s.current_streak >= 7).length ?? 0,
      activeSubscriptions: subs.count ?? 0,
      pendingReports: reports.count ?? 0,
    };
  }),
});
