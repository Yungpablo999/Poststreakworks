import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { recommendMission } from "@poststreak/ai/mission-recommender";
import { awardXp, recordStreakEvent } from "@poststreak/workflows";

export const missionsRouter = createTRPCRouter({
  /**
   * Get today's mission for the current user.
   * Uses the hybrid AI recommender: rules engine picks type, Groq personalizes copy.
   * Missions are cached for the rest of the WAT day.
   */
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date()
      .toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
      .split("T")[0]!;

    // Check for existing mission today
    const { data: existing } = await ctx.supabase
      .from("missions")
      .select("*")
      .eq("user_id", ctx.user.id)
      .eq("target_date", today)
      .in("status", ["pending", "started"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) return existing;

    // Generate a new mission via the AI recommender
    const recommendation = await recommendMission({
      supabase: ctx.supabase,
      userId: ctx.user.id,
    });

    // Insert the mission
    const { data: mission, error } = await ctx.supabase
      .from("missions")
      .insert({
        user_id: ctx.user.id,
        type: recommendation.type,
        instructions: recommendation.instructions,
        difficulty: recommendation.difficulty,
        source: recommendation.source,
        target_date: today,
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create mission",
      });
    }

    return mission;
  }),

  /**
   * Get mission history.
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("missions")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("target_date", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch mission history",
        });
      }

      return data;
    }),

  /**
   * Start working on a mission.
   */
  start: protectedProcedure
    .input(z.object({ missionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("missions")
        .update({ status: "started" })
        .eq("id", input.missionId)
        .eq("user_id", ctx.user.id)
        .eq("status", "pending")
        .select()
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mission not found or already started",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start mission",
        });
      }

      return data;
    }),

  /**
   * Complete a mission. Advances the streak.
   */
  complete: protectedProcedure
    .input(z.object({ missionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: mission, error: fetchErr } = await ctx.supabase
        .from("missions")
        .select("*")
        .eq("id", input.missionId)
        .eq("user_id", ctx.user.id)
        .in("status", ["pending", "started"])
        .single();

      if (fetchErr?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mission not found or already completed",
        });
      }
      if (fetchErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch mission",
        });
      }

      // Mark as completed
      const { error: updateErr } = await ctx.supabase
        .from("missions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.missionId);

      if (updateErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete mission",
        });
      }

      // Mission completion advances the streak (atomic, idempotent per local
      // day) and awards XP. Both write with the service role — creators can't
      // write streaks or credits directly (migration …21_rls_hardening).
      await recordStreakEvent(ctx.user.id, "mission_completion", {
        mission_id: input.missionId,
        mission_type: mission.type,
      });

      const creditAmount =
        mission.difficulty === "hard"
          ? 15
          : mission.difficulty === "medium"
            ? 10
            : 5;

      await awardXp(ctx.user.id, creditAmount, "mission_completion", `Completed ${mission.type} mission`);

      await ctx.track("mission_completed", {
        mission_type: mission.type,
        difficulty: mission.difficulty,
        credits_earned: creditAmount,
      });

      return { success: true, creditsEarned: creditAmount };
    }),

  /**
   * Replace/skip a mission.
   */
  replace: protectedProcedure
    .input(z.object({ missionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("missions")
        .update({ status: "replaced" })
        .eq("id", input.missionId)
        .eq("user_id", ctx.user.id)
        .in("status", ["pending", "started"])
        .select()
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mission not found or cannot be replaced",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to replace mission",
        });
      }

      return data;
    }),
});
