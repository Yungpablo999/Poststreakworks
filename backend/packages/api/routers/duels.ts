import { z } from "zod";
import { createTRPCRouter, protectedProcedure, createSupabaseServiceClient } from "../context";
import { TRPCError } from "@trpc/server";

// users only has an RLS policy for reading your OWN row (users_select_own
// — see supabase/migrations/20260814000001), so ctx.supabase (RLS-scoped
// to the caller) silently returns null for the opponent's embedded
// users!fk(display_name, avatar_url) — not an error, just missing data.
// Same fix as creator-network.ts: a narrow service-role lookup for just
// these two public-identity columns.
async function getDisplayInfo(userIds: string[]): Promise<Map<string, { display_name: string | null; avatar_url: string | null }>> {
  const map = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueIds.length === 0) return map;
  const { data } = await createSupabaseServiceClient()
    .from("users")
    .select("id, display_name, avatar_url")
    .in("id", uniqueIds);
  for (const row of data ?? []) {
    map.set(row.id, { display_name: row.display_name, avatar_url: row.avatar_url });
  }
  return map;
}

async function withOpponentInfo(duels: { user_a_id: string; user_b_id: string }[]) {
  const displayInfo = await getDisplayInfo(duels.flatMap((d) => [d.user_a_id, d.user_b_id]));
  return duels.map((d) => ({
    ...d,
    user_a: displayInfo.get(d.user_a_id) ?? null,
    user_b: displayInfo.get(d.user_b_id) ?? null,
  }));
}

export const duelsRouter = createTRPCRouter({
  /**
   * Get active duels for the current user.
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("duels")
      .select("*")
      .or(`user_a_id.eq.${ctx.user.id},user_b_id.eq.${ctx.user.id}`)
      .eq("status", "active");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch active duels",
      });
    }

    return withOpponentInfo(data ?? []);
  }),

  /**
   * Get duel history.
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("duels")
      .select("*")
      .or(`user_a_id.eq.${ctx.user.id},user_b_id.eq.${ctx.user.id}`)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch duel history",
      });
    }

    return withOpponentInfo(data ?? []);
  }),

  /**
   * Propose a new duel.
   */
  propose: protectedProcedure
    .input(
      z.object({
        partnerId: z.string().uuid(),
        startDate: z.string().date(),
        endDate: z.string().date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.partnerId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot duel yourself",
        });
      }

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (end <= start) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      // Check for existing active duel with this partner
      const { data: existing } = await ctx.supabase
        .from("duels")
        .select("id")
        .or(
          `and(user_a_id.eq.${ctx.user.id},user_b_id.eq.${input.partnerId}),and(user_a_id.eq.${input.partnerId},user_b_id.eq.${ctx.user.id})`,
        )
        .eq("status", "active")
        .limit(1)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Active duel already exists with this partner",
        });
      }

      const { data, error } = await ctx.supabase
        .from("duels")
        .insert({
          user_a_id: ctx.user.id,
          user_b_id: input.partnerId,
          start_date: input.startDate,
          end_date: input.endDate,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to propose duel",
        });
      }

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "duel_proposed",
        properties: { partner_id: input.partnerId },
      });

      return data;
    }),

  /**
   * Accept a pending duel.
   */
  accept: protectedProcedure
    .input(z.object({ duelId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("duels")
        .update({ status: "active" })
        .eq("id", input.duelId)
        .eq("user_b_id", ctx.user.id)
        .select()
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Duel not found or not for you to accept",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to accept duel",
        });
      }

      return data;
    }),

  /**
   * Cancel an active duel.
   */
  cancel: protectedProcedure
    .input(z.object({ duelId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("duels")
        .update({ status: "cancelled" })
        .eq("id", input.duelId)
        .or(`user_a_id.eq.${ctx.user.id},user_b_id.eq.${ctx.user.id}`)
        .eq("status", "active")
        .select()
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Duel not found or already ended",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel duel",
        });
      }

      return data;
    }),

  /**
   * Get duel progress — reads streak_events directly (no separate progress table).
   */
  getProgress: protectedProcedure
    .input(z.object({ duelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: duel, error: duelErr } = await ctx.supabase
        .from("duels")
        .select("*")
        .eq("id", input.duelId)
        .or(`user_a_id.eq.${ctx.user.id},user_b_id.eq.${ctx.user.id}`)
        .single();

      if (duelErr?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Duel not found",
        });
      }
      if (duelErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch duel",
        });
      }

      // Calculate total days
      const start = new Date(duel.start_date);
      const end = new Date(duel.end_date);
      const totalDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Get qualifying events for both users in the duel period
      const { data: events } = await ctx.supabase
        .from("streak_events")
        .select("user_id, event_date, event_type")
        .in("user_id", [duel.user_a_id, duel.user_b_id])
        .gte("event_date", duel.start_date)
        .lte("event_date", duel.end_date);

      // Group events by user and date
      const eventsByUser = new Map<string, Set<string>>();
      for (const event of events ?? []) {
        if (!eventsByUser.has(event.user_id)) {
          eventsByUser.set(event.user_id, new Set());
        }
        eventsByUser.get(event.user_id)!.add(event.event_date);
      }

      const userADays = eventsByUser.get(duel.user_a_id)?.size ?? 0;
      const userBDays = eventsByUser.get(duel.user_b_id)?.size ?? 0;

      // Calculate mutual completion days (both users qualified)
      const userADates = eventsByUser.get(duel.user_a_id) ?? new Set();
      const userBDates = eventsByUser.get(duel.user_b_id) ?? new Set();
      let mutualDays = 0;
      for (const date of userADates) {
        if (userBDates.has(date)) mutualDays++;
      }

      return {
        duel,
        totalDays,
        userA: { userId: duel.user_a_id, qualifiedDays: userADays },
        userB: { userId: duel.user_b_id, qualifiedDays: userBDays },
        mutualDays,
      };
    }),
});
