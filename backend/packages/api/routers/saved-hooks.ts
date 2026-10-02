import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

// Hook Studio hearts ("Your saved hooks"). Creator-owned, RLS-guarded
// (saved_hooks_*_own); one row per (creator, line).

const hookInput = z.object({
  line: z.string().trim().min(1).max(500),
  style: z.enum(["talking", "dance", "skit", "text"]),
  idea: z.string().max(300).default(""),
});

type HookRow = { line: string; style: string; idea: string; created_at: string };

const toHook = (row: HookRow) => ({
  line: row.line,
  style: row.style,
  idea: row.idea,
  savedAt: new Date(row.created_at).getTime(),
});

export const savedHooksRouter = createTRPCRouter({
  /** Newest first. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("saved_hooks")
      .select("line, style, idea, created_at")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch saved hooks" });
    }
    return (data as HookRow[]).map(toHook);
  }),

  /** Saves the hook, or un-saves it if it was already saved. `saved` is the new state. */
  toggle: protectedProcedure.input(hookInput).mutation(async ({ ctx, input }) => {
    const { data: removed, error: deleteError } = await ctx.supabase
      .from("saved_hooks")
      .delete()
      .eq("user_id", ctx.user.id)
      .eq("line", input.line)
      .select("id");

    if (deleteError) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update saved hooks" });
    }
    if (removed && removed.length > 0) {
      return { saved: false as const, hook: null };
    }

    const { data, error } = await ctx.supabase
      .from("saved_hooks")
      .insert({ user_id: ctx.user.id, line: input.line, style: input.style, idea: input.idea })
      .select("line, style, idea, created_at")
      .single();

    if (error) {
      // 23505: a concurrent toggle already saved it — that's the state we wanted.
      if (error.code === "23505") return { saved: true as const, hook: null };
      if (error.message.includes("row_cap_exceeded")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You've reached the saved-hook limit. Remove a few to save more.",
        });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save hook" });
    }

    await ctx.track("hook_saved", { style: input.style });
    return { saved: true as const, hook: toHook(data as HookRow) };
  }),
});
