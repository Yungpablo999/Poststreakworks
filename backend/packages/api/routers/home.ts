import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { getBrief, getHomeSummary, getQuestBoard, loadQuestFacts } from "@poststreak/workflows";
import { creatorContext } from "../lib/creator-context";

// Home for creators who post: the next post, how the week looks, how the audience moved, today's
// quest and level, and (Pro) the daily brief. All of it from the creator's own rows.

export const homeRouter = createTRPCRouter({
  summary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [who, facts] = await Promise.all([creatorContext(ctx.user), loadQuestFacts(ctx.user.id)]);
      const board = await getQuestBoard(ctx.user.id, who, undefined, facts);
      const pro = ctx.user.tier === "pro" || ctx.user.tier === "founding";
      const [summary, brief] = await Promise.all([
        getHomeSummary(ctx.user.id, facts),
        pro ? ctx.supabase.from("users").select("timezone").eq("id", ctx.user.id).single().then((r) => getBrief(ctx.user.id, facts, (r.data?.timezone as string | undefined) ?? "Africa/Lagos")) : Promise.resolve(null),
      ]);
      return {
        ...summary,
        brief,
        level: { level: board.level, xp: board.xp, xpIntoLevel: board.xpIntoLevel, xpPerLevel: board.xpPerLevel },
        today: {
          xp: board.today.xp,
          done: board.today.done,
          stepsDone: board.today.steps.filter((s) => s.done).length,
          stepsTotal: board.today.steps.length,
        },
        challenge: { done: board.challenge.done, goal: board.challenge.goal, joined: board.challenge.joined },
        justCompleted: board.justCompleted,
      };
    } catch (err) {
      console.error("home.summary failed:", err instanceof Error ? err.message : err);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't load your Home" });
    }
  }),
});
