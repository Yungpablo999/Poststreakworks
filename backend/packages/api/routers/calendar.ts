import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { mergeCalendar, SAME_POST_WINDOW_MS, type ScheduledRow, type SyncedRow } from "../lib/calendar";

// The calendar the app shows. The rules for merging what was planned with what was posted are in
// lib/calendar.ts.

export const calendarRouter = createTRPCRouter({
  /** Everything planned or posted between two instants (from inclusive, to exclusive; at most 62 days). */
  items: protectedProcedure
    .input(z.object({ from: z.string().datetime(), to: z.string().datetime() }))
    .query(async ({ ctx, input }) => {
      const span = Date.parse(input.to) - Date.parse(input.from);
      if (!(span > 0) || span > 62 * 86_400_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Ask for at most two months at a time" });

      // Reach a little past the edges so a post and its synced twin land together
      const from = new Date(Date.parse(input.from) - SAME_POST_WINDOW_MS).toISOString();
      const to = new Date(Date.parse(input.to) + SAME_POST_WINDOW_MS).toISOString();

      const [scheduled, synced] = await Promise.all([
        ctx.supabase
          .from("scheduled_posts")
          .select("id, content, target_platforms, scheduled_at, status, published_at, platform_post_ids")
          .eq("user_id", ctx.user.id)
          .gte("scheduled_at", from)
          .lt("scheduled_at", to)
          .in("status", ["draft", "scheduled", "publishing", "pending_confirmation", "published"])
          .limit(500),
        ctx.supabase
          .from("post_stats")
          .select("platform, platform_post_id, title, posted_at, share_url")
          .eq("user_id", ctx.user.id)
          .not("posted_at", "is", null)
          .gte("posted_at", from)
          .lt("posted_at", to)
          .limit(500),
      ]);
      if (scheduled.error || synced.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't load your calendar" });

      const lo = Date.parse(input.from);
      const hi = Date.parse(input.to);
      const items = mergeCalendar((scheduled.data ?? []) as ScheduledRow[], (synced.data ?? []) as SyncedRow[]).filter((i) => {
        const t = Date.parse(i.at);
        return t >= lo && t < hi;
      });
      return { items };
    }),
});
