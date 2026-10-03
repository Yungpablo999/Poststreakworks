import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { creatorCalendar, getQuestBoard, joinWeeklyChallenge, setChallengeReminders } from "@poststreak/workflows";
import { creatorContext } from "../lib/creator-context";

// Quests, XP and the weekly challenge. The board is computed from what the creator has really
// done and finished quests are paid by the server (workflows/quests.ts); there is no
// "complete this quest" call for the app to make, so there is nothing to call twice.

export const questsRouter = createTRPCRouter({
  /** The Quests screen: level, today's quest, the list, the challenge. Also pays anything just finished. */
  board: protectedProcedure.query(async ({ ctx }) => {
    const who = await creatorContext(ctx.user);
    return getQuestBoard(ctx.user.id, who);
  }),

  /** "Join the challenge". Idempotent. */
  joinChallenge: protectedProcedure.mutation(async ({ ctx }) => {
    await joinWeeklyChallenge(ctx.user.id);
    return { joined: true };
  }),

  /** The days of this week (0 = Monday) the creator wants to be reminded to post on. Empty clears them. */
  setReminders: protectedProcedure
    .input(z.object({ days: z.array(z.number().int().min(0).max(6)).max(7) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const calendar = await creatorCalendar(ctx.user.id);
        const days = await setChallengeReminders(ctx.user.id, input.days, calendar);
        return { days };
      } catch (err) {
        console.error("setReminders failed:", err instanceof Error ? err.message : err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't save your reminders" });
      }
    }),
});
