import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

// Ported from v1's src/app/api/autopilot/config/route.ts. Generation itself
// runs in packages/jobs (dispatchAutopilot, cron-triggered) — this router is
// config CRUD only, matching v1's separation of "set it up" vs. "it runs."

const autopilotConfigInput = z.object({
  topics: z.array(z.string().min(1)).max(20),
  platforms: z.array(z.enum(["linkedin", "twitter", "meta", "tiktok"])).min(1),
  frequency: z.number().min(1).max(7).default(1),
  mode: z.enum(["auto", "suggest"]).default("suggest"),
  enabled: z.boolean().default(false),
});

export const autopilotRouter = createTRPCRouter({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("autopilot_configs")
      .select("*")
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch autopilot config",
      });
    }

    return data;
  }),

  updateConfig: protectedProcedure
    .input(autopilotConfigInput)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("autopilot_configs")
        .upsert({ user_id: ctx.user.id, ...input }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update autopilot config",
        });
      }

      return data;
    }),
});
