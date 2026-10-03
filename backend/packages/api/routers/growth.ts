import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getGrowthOverview, getPostPerformance } from "@poststreak/workflows";
import { createTRPCRouter, protectedProcedure } from "../context";

// What Growth shows, worked out from the numbers the creator's connected accounts have really
// reported (packages/workflows/growth-overview.ts). Nothing here is estimated or sample data: with no
// account connected, or nothing read yet, the answer says so.

export const growthRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const { data: row } = await ctx.supabase.from("users").select("timezone").eq("id", ctx.user.id).single();
    try {
      return await getGrowthOverview(ctx.supabase, ctx.user.id, (row?.timezone as string | undefined) ?? "Africa/Lagos");
    } catch (err) {
      console.error("growth.overview failed:", err instanceof Error ? err.message : err);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't load your growth" });
    }
  }),

  /** One post's numbers, by the key the overview gave it (`tiktok:7012…`). */
  post: protectedProcedure.input(z.object({ key: z.string().min(3).max(200) })).query(async ({ ctx, input }) => {
    const { data: row } = await ctx.supabase.from("users").select("timezone").eq("id", ctx.user.id).single();
    const post = await getPostPerformance(ctx.supabase, ctx.user.id, input.key, (row?.timezone as string | undefined) ?? "Africa/Lagos");
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post isn't in your synced posts" });
    return post;
  }),
});
