import { createTRPCRouter, protectedProcedure, TIER_LIMITS } from "../context";
import { enforceRateLimit } from "../rate-limit";
import { jarvisChat, jarvisChatInputSchema } from "@poststreak/ai/jarvis-chat";

// "Ask Jarvis": the chat panel available from every page. Returns the reply
// shape the app already renders (text, ideas, caption, list, tasks, chips) so
// Ghost's job buttons keep working unchanged. See packages/ai/jarvis-chat.ts
// for how the model's output is validated and rebuilt before it gets here.
//
// Cost guards (every call is a paid model request):
//   - a short burst limit, so a script can't hammer it;
//   - a daily budget by plan (TIER_LIMITS.*.jarvisChatPerDay — placeholders
//     until product sets real numbers).
// Both fail open on infrastructure errors (see rate-limit.ts), like the rest
// of the API's limits.

export const jarvisRouter = createTRPCRouter({
  chat: protectedProcedure.input(jarvisChatInputSchema).mutation(async ({ ctx, input }) => {
    await enforceRateLimit(`jarvis:burst:${ctx.user.id}`, 8, 60);
    await enforceRateLimit(`jarvis:day:${ctx.user.id}`, TIER_LIMITS[ctx.user.tier].jarvisChatPerDay, 24 * 60 * 60);

    // The creator's saved topics beat whatever the client sends, which may be
    // from before onboarding finished saving.
    const { data: profile } = await ctx.supabase
      .from("creator_profiles")
      .select("niches")
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    const savedNiches = (profile?.niches as string[] | undefined) ?? [];

    const result = await jarvisChat({
      ...input,
      context: { ...input.context, niches: savedNiches.length ? savedNiches : input.context.niches },
    });

    await ctx.track("jarvis_chat", {
      degraded: result.degraded,
      has_ideas: Boolean(result.reply.ideas?.length),
      tasks: result.reply.tasks?.map((t) => t.job.kind) ?? [],
    });

    return { ...result.reply, degraded: result.degraded };
  }),
});
