import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateIdeas,
  generateHooks,
  generateScript,
  generateCaption,
  type ContentIdea,
  type ScriptOutput,
  type CaptionOutput,
} from "@poststreak/ai/content-studio";

// Daily per-tool generation quotas — reverse-engineered from the built
// frontend, which enforces these client-side only today (ContentAngleScreen:
// "5 AI generations/day", confirmed exact; the others weren't shown with an
// explicit number in the screens studied, so these are reasonable defaults
// pending product confirmation, not ported facts). Enforced here so the
// limit can't be bypassed by calling the API directly instead of the UI.
const DAILY_QUOTAS = {
  ai_idea_builder_used: 5,
  ai_hook_lab_used: 10,
  ai_script_builder_used: 10,
  ai_caption_studio_used: 15,
} as const;

async function checkAndConsumeQuota(
  supabase: SupabaseClient,
  userId: string,
  eventName: keyof typeof DAILY_QUOTAS,
): Promise<void> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", eventName)
    .gte("created_at", todayStart.toISOString());

  if ((count ?? 0) >= DAILY_QUOTAS[eventName]) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Daily generation limit reached (${DAILY_QUOTAS[eventName]}/day). Try again tomorrow.`,
    });
  }
}

const ideaBuilderInput = z.object({
  niche: z.string().min(1).max(200),
  goal: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  platform: z.string().min(1).max(50),
  audience: z.string().min(1).max(200),
});

const hookLabInput = z.object({
  topic: z.string().min(1).max(200),
  tone: z.string().min(1).max(50),
  format: z.string().min(1).max(50),
});

const scriptBuilderInput = z.object({
  idea: z.string().min(1).max(2000),
  length: z.string().min(1).max(50),
  style: z.string().min(1).max(50),
  cta: z.string().min(1).max(200),
});

const captionStudioInput = z.object({
  contentSummary: z.string().min(1).max(2000),
  voice: z.string().min(1).max(50),
  platform: z.string().min(1).max(50),
  includeHashtags: z.boolean().default(true),
});

export const contentStudioRouter = createTRPCRouter({
  /**
   * Generate 5 content ideas based on niche, goal, and audience.
   */
  generateIdeas: protectedProcedure
    .input(ideaBuilderInput)
    .mutation(async ({ ctx, input }) => {
      await checkAndConsumeQuota(ctx.supabase, ctx.user.id, "ai_idea_builder_used");
      try {
        const ideas = await generateIdeas(input);

        // Track usage
        await ctx.supabase.from("analytics_events").insert({
          user_id: ctx.user.id,
          event_name: "ai_idea_builder_used",
          properties: { platform: input.platform, niche: input.niche },
        });

        return { ideas };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to generate ideas",
        });
      }
    }),

  /**
   * Generate 7 hooks for a given topic and tone.
   */
  generateHooks: protectedProcedure
    .input(hookLabInput)
    .mutation(async ({ ctx, input }) => {
      await checkAndConsumeQuota(ctx.supabase, ctx.user.id, "ai_hook_lab_used");
      try {
        const hooks = await generateHooks(input);

        await ctx.supabase.from("analytics_events").insert({
          user_id: ctx.user.id,
          event_name: "ai_hook_lab_used",
          properties: { tone: input.tone, format: input.format },
        });

        return { hooks };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to generate hooks",
        });
      }
    }),

  /**
   * Generate a short-form video script.
   */
  generateScript: protectedProcedure
    .input(scriptBuilderInput)
    .mutation(async ({ ctx, input }) => {
      await checkAndConsumeQuota(ctx.supabase, ctx.user.id, "ai_script_builder_used");
      try {
        const script = await generateScript(input);

        await ctx.supabase.from("analytics_events").insert({
          user_id: ctx.user.id,
          event_name: "ai_script_builder_used",
          properties: { style: input.style, length: input.length },
        });

        return { script };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to generate script",
        });
      }
    }),

  /**
   * Generate captions for a social post.
   */
  generateCaption: protectedProcedure
    .input(captionStudioInput)
    .mutation(async ({ ctx, input }) => {
      await checkAndConsumeQuota(ctx.supabase, ctx.user.id, "ai_caption_studio_used");
      try {
        const caption = await generateCaption(input);

        await ctx.supabase.from("analytics_events").insert({
          user_id: ctx.user.id,
          event_name: "ai_caption_studio_used",
          properties: {
            platform: input.platform,
            include_hashtags: input.includeHashtags,
          },
        });

        return { caption };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to generate caption",
        });
      }
    }),
});
