import { z } from "zod";
import { createTRPCRouter, protectedProcedure, TIER_LIMITS, type User } from "../context";
import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateIdeas,
  generateHooks,
  generateScript,
  generateCaption,
} from "@poststreak/ai/content-studio";

const AI_EVENT_NAMES = [
  "ai_idea_builder_used",
  "ai_hook_lab_used",
  "ai_script_builder_used",
  "ai_caption_studio_used",
] as const;

/**
 * One combined daily quota across all four Jarvis tools, not per-tool —
 * architecture/SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md's entitlement matrix is
 * explicit: "Jarvis AI Generation: 3 Scripts/Ideas per day (free) |
 * Unlimited (pro)", a single number covering ideas/hooks/scripts/captions
 * together, not four separate per-tool budgets. Enforced server-side so it
 * can't be bypassed by calling the API directly instead of the UI.
 */
async function checkAndConsumeQuota(supabase: SupabaseClient, user: User): Promise<void> {
  const limit = TIER_LIMITS[user.tier].aiGenerationsPerDay;
  if (limit === Infinity) return;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("event_name", AI_EVENT_NAMES)
    .gte("created_at", todayStart.toISOString());

  if ((count ?? 0) >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Daily AI generation limit reached (${limit}/day on the free tier). Upgrade to Jarvis Pro for unlimited generations.`,
      cause: {
        upgradeRequired: true,
        upsell: {
          title: "Unlock unlimited Jarvis AI",
          features: ["Unlimited AI Ideation, Scriptwriting & Hook Optimization"],
          upgradeUrl: "/api/v1/billing/checkout",
        },
      },
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
      await checkAndConsumeQuota(ctx.supabase, ctx.user);
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
      await checkAndConsumeQuota(ctx.supabase, ctx.user);
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
      await checkAndConsumeQuota(ctx.supabase, ctx.user);
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
      await checkAndConsumeQuota(ctx.supabase, ctx.user);
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
