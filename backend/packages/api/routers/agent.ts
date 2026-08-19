import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

// Ported from v1's src/app/api/agent/memory/route.ts — the persistent
// preference memory behind v1's chat agent (e.g. "no hashtags", "always
// casual"). Carried-over domain: live in v1, not in the original 8-stage
// architecture. The agent's chat/generation endpoint itself is a separate,
// not-yet-ported piece — this router is memory storage only.

export const agentRouter = createTRPCRouter({
  getMemory: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("agent_memory")
      .select("key, value")
      .eq("user_id", ctx.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch agent memory",
      });
    }

    return data;
  }),

  setMemory: protectedProcedure
    .input(z.object({ key: z.string().min(1).max(100), value: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from("agent_memory").upsert(
        { user_id: ctx.user.id, key: input.key, value: input.value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" },
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save agent memory",
        });
      }

      return { ok: true };
    }),
});
