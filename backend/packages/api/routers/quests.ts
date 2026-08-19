import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { awardXp } from "@poststreak/workflows";

// Distinct from missions.ts (one AI-recommended task per day). Quests are a
// catalog: starter/onboarding quests and individual challenge instances with
// multi-step, dependency-lockable requirement checklists (ChallengeDetailScreen).
// community_challenges is the separate cohort-shared-progress concept
// (QuestsScreen's "42 creators competing" card) — different enough (progress
// counted across all participants, not per-user) that it's not the same table.

export const questsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ category: z.enum(["daily", "starter", "community", "brand"]).optional() }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase.from("quests").select("*").eq("is_active", true);
      if (input.category) query = query.eq("category", input.category);

      const { data: quests, error } = await query;
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch quests" });
      }

      const questIds = (quests ?? []).map((q) => q.id);
      const { data: progress } = await ctx.supabase
        .from("quest_progress")
        .select("*")
        .eq("user_id", ctx.user.id)
        .in("quest_id", questIds.length > 0 ? questIds : ["00000000-0000-0000-0000-000000000000"]);

      const progressByQuest = new Map((progress ?? []).map((p) => [p.quest_id, p]));

      return (quests ?? []).map((q) => {
        const p = progressByQuest.get(q.id);
        const requirements = (q.requirements ?? []) as { id: string; title: string }[];
        const requirementStatus = (p?.requirement_status ?? {}) as Record<string, boolean>;
        const completedCount = requirements.filter((r) => requirementStatus[r.id]).length;

        return {
          ...q,
          status: p?.status ?? "not_started",
          progress: completedCount,
          maxProgress: requirements.length || 1,
          completed: p?.status === "completed",
        };
      });
    }),

  get: protectedProcedure
    .input(z.object({ questId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: quest, error } = await ctx.supabase
        .from("quests")
        .select("*")
        .eq("id", input.questId)
        .single();

      if (error || !quest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });
      }

      const { data: progress } = await ctx.supabase
        .from("quest_progress")
        .select("*")
        .eq("user_id", ctx.user.id)
        .eq("quest_id", input.questId)
        .maybeSingle();

      return { ...quest, progress: progress ?? null };
    }),

  start: protectedProcedure
    .input(z.object({ questId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("quest_progress")
        .upsert(
          { user_id: ctx.user.id, quest_id: input.questId, status: "in_progress", started_at: new Date().toISOString() },
          { onConflict: "user_id,quest_id" },
        )
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to start quest" });
      }

      return data;
    }),

  /**
   * Toggle one requirement step. Requirements can declare `dependsOn` (an
   * array of other requirement ids) — a step can't be completed until its
   * dependencies are, matching ChallengeDetailScreen's locked step 4.
   */
  completeRequirement: protectedProcedure
    .input(z.object({ questId: z.string().uuid(), requirementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: quest } = await ctx.supabase
        .from("quests")
        .select("requirements")
        .eq("id", input.questId)
        .single();

      const requirements = (quest?.requirements ?? []) as
        { id: string; dependsOn?: string[] }[];
      const target = requirements.find((r) => r.id === input.requirementId);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Requirement not found" });
      }

      const { data: progress } = await ctx.supabase
        .from("quest_progress")
        .select("requirement_status")
        .eq("user_id", ctx.user.id)
        .eq("quest_id", input.questId)
        .maybeSingle();

      const currentStatus = (progress?.requirement_status ?? {}) as Record<string, boolean>;

      const unmetDependency = (target.dependsOn ?? []).find((depId) => !currentStatus[depId]);
      if (unmetDependency) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Requirement '${unmetDependency}' must be completed first`,
        });
      }

      const nextStatus = { ...currentStatus, [input.requirementId]: true };

      const { error } = await ctx.supabase.from("quest_progress").upsert(
        {
          user_id: ctx.user.id,
          quest_id: input.questId,
          status: "in_progress",
          requirement_status: nextStatus,
          started_at: new Date().toISOString(),
        },
        { onConflict: "user_id,quest_id" },
      );

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update requirement" });
      }

      const allComplete = requirements.every((r) => nextStatus[r.id]);
      return { allRequirementsComplete: allComplete, requirementStatus: nextStatus };
    }),

  complete: protectedProcedure
    .input(z.object({ questId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: quest } = await ctx.supabase
        .from("quests")
        .select("xp_reward, title")
        .eq("id", input.questId)
        .single();

      if (!quest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });
      }

      const { error } = await ctx.supabase.from("quest_progress").upsert(
        {
          user_id: ctx.user.id,
          quest_id: input.questId,
          status: "completed",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,quest_id" },
      );

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete quest" });
      }

      await awardXp(ctx.supabase, ctx.user.id, quest.xp_reward, "quest_completed", quest.title);

      return { xpGained: quest.xp_reward };
    }),

  listChallenges: protectedProcedure.query(async ({ ctx }) => {
    const { data: challenges, error } = await ctx.supabase
      .from("community_challenges")
      .select("*, challenge_participants(user_id, current_posts)")
      .eq("is_active", true);

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch challenges" });
    }

    return (challenges ?? []).map((c) => {
      const participants = (c.challenge_participants ?? []) as { user_id: string; current_posts: number }[];
      const currentPosts = participants.reduce((sum, p) => sum + p.current_posts, 0);
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        targetPosts: c.target_posts,
        currentPosts,
        participantsCount: participants.length,
        rewardBadge: c.reward_badge,
        active: c.is_active,
        isJoined: participants.some((p) => p.user_id === ctx.user.id),
      };
    });
  }),

  joinChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("challenge_participants")
        .insert({ challenge_id: input.challengeId, user_id: ctx.user.id });

      if (error) {
        throw new TRPCError({
          code: error.code === "23505" ? "CONFLICT" : "INTERNAL_SERVER_ERROR",
          message: error.code === "23505" ? "Already joined this challenge" : "Failed to join challenge",
        });
      }

      return { success: true };
    }),
});
