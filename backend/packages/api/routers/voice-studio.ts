import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import {
  generatePreview,
  enqueueFullRender,
} from "@poststreak/ai/voice-generation";

export const voiceStudioRouter = createTRPCRouter({
  /**
   * List voice projects for the current user.
   */
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("voice_projects")
      .select("*, voice:series_voices(name, fish_audio_voice_id)")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch voice projects",
      });
    }

    return data;
  }),

  /**
   * Get a single voice project.
   */
  getProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("voice_projects")
        .select("*, voice:series_voices(*)")
        .eq("id", input.projectId)
        .eq("user_id", ctx.user.id)
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voice project not found",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch voice project",
        });
      }

      return data;
    }),

  /**
   * Create a new voice project.
   */
  createProject: protectedProcedure
    .input(
      z.object({
        script: z.string().min(1).max(10000),
        voiceId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check wallet balance
      const { data: wallet } = await ctx.supabase
        .from("voice_minutes_wallet")
        .select("included_minutes, used_minutes")
        .eq("user_id", ctx.user.id)
        .gt("period_end", new Date().toISOString())
        .limit(1)
        .single();

      if (wallet) {
        const remaining = wallet.included_minutes - wallet.used_minutes;
        if (remaining <= 0) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message:
              "No voice minutes remaining. Upgrade your plan or purchase a top-up.",
          });
        }
      }

      const { data, error } = await ctx.supabase
        .from("voice_projects")
        .insert({
          user_id: ctx.user.id,
          script: input.script,
          voice_id: input.voiceId,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create voice project",
        });
      }

      return data;
    }),

  /**
   * Generate a voice preview (synchronous, short).
   * Uses Fish Audio directly — cheap enough not to need the queue.
   */
  generatePreview: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await generatePreview({
        supabase: ctx.supabase,
        userId: ctx.user.id,
        projectId: input.projectId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Preview generation failed",
        });
      }

      return { status: "completed", projectId: input.projectId };
    }),

  /**
   * Enqueue a full voice render (async via job queue).
   * Debits wallet on confirmed successful render, not on enqueue.
   */
  generateFull: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await enqueueFullRender({
        supabase: ctx.supabase,
        userId: ctx.user.id,
        projectId: input.projectId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Failed to enqueue render",
        });
      }

      return { status: "enqueued", jobId: result.jobId };
    }),

  /**
   * List saved series voices.
   */
  getSeriesVoices: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("series_voices")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch series voices",
      });
    }

    return data;
  }),

  /**
   * Save a new series voice.
   */
  createSeriesVoice: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        fishAudioVoiceId: z.string().min(1),
        pronunciationNotes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("series_voices")
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          fish_audio_voice_id: input.fishAudioVoiceId,
          pronunciation_notes: input.pronunciationNotes,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create voice",
        });
      }

      return data;
    }),

  /**
   * Delete a series voice.
   */
  deleteSeriesVoice: protectedProcedure
    .input(z.object({ voiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("series_voices")
        .delete()
        .eq("id", input.voiceId)
        .eq("user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete voice",
        });
      }

      return { success: true };
    }),

  /**
   * Get voice minutes wallet.
   */
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("voice_minutes_wallet")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error?.code === "PGRST116") {
      return {
        included_minutes: 0,
        used_minutes: 0,
        period_start: null,
        period_end: null,
      };
    }
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch wallet",
      });
    }

    return data;
  }),

  /**
   * Get voice minutes ledger.
   */
  getLedger: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("voice_minutes_ledger")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch ledger",
      });
    }

    return data;
  }),
});
