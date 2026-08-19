import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

// One feed reused across Dashboard/Create/PostComposer/Schedule/Match/
// Messages — every screen studied had an identical NotificationItem shape
// and mark-read/mark-all-read actions implemented as separate local state.
// This is the single backend source of truth for all of them.

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        filter: z.enum(["all", "unread"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("notifications")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (input.filter === "unread") {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
        });
      }

      return data;
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", input.notificationId)
        .eq("user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification read",
        });
      }

      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", ctx.user.id)
      .eq("read", false);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark notifications read",
      });
    }

    return { success: true };
  }),
});
