import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { IDEA_GOALS, ideaFeed, normalizeNiches, starterIdeas, topicIdeas } from "@poststreak/ai/idea-library";

// Post ideas from the PostStreak idea library (packages/ai/idea-library.ts): real, hand-written
// ideas for each topic, needing no AI. When an AI key is set, Jarvis writes fresh ones on top
// (content-studio) and this stays the starting point and the fallback.

const goal = z.enum(IDEA_GOALS as [string, ...string[]]);
type Goal = (typeof IDEA_GOALS)[number];

export const ideasRouter = createTRPCRouter({
  /** Before there is an account: ideas for the topics and platforms picked so far. */
  starter: publicProcedure
    .input(z.object({ niches: z.array(z.string().max(40)).max(12), platforms: z.array(z.string().max(20)).max(8) }))
    .query(({ input }) => ({ source: "library" as const, ideas: starterIdeas(input.niches, input.platforms) })),

  /** Ideas for the signed-in creator's own topics and connected platforms, shaped by their goal. */
  feed: protectedProcedure.input(z.object({ goal: goal.default("followers") })).query(async ({ ctx, input }) => {
    const [profile, connections] = await Promise.all([
      ctx.supabase.from("creator_profiles").select("niches").eq("user_id", ctx.user.id).maybeSingle(),
      ctx.supabase.from("platform_connections").select("platform").eq("user_id", ctx.user.id).is("disconnected_at", null),
    ]);
    if (profile.error || connections.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't load your ideas" });
    const niches = normalizeNiches((profile.data?.niches as string[] | undefined) ?? []);
    const platforms = (connections.data ?? []).map((c) => c.platform as string);
    return { source: "library" as const, ideas: ideaFeed(niches, input.goal as Goal, platforms) };
  }),

  /** Three ideas about a topic the creator typed. `round` moves on to the next three. */
  topic: protectedProcedure
    .input(z.object({ topic: z.string().trim().min(1).max(200), goal: goal.default("followers"), format: z.string().max(60).optional(), round: z.number().int().min(0).max(50).default(0) }))
    .query(({ input }) => ({ source: "library" as const, ideas: topicIdeas(input.topic, input.goal as Goal, input.format, input.round) })),
});
