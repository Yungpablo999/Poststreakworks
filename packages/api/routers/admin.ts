import { z } from "zod";
import { createTRPCRouter, staffProcedure } from "../context";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  /**
   * Get all feature flags.
   */
  getFeatureFlags: staffProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("analytics_events")
      .select("properties, created_at")
      .eq("event_name", "feature_flag")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch feature flags",
      });
    }

    // Deduplicate by key, keeping latest
    const flags = new Map<string, { enabled: boolean; updatedAt: string }>();
    for (const row of data ?? []) {
      const props = row.properties as { key: string; enabled: boolean };
      if (props.key) {
        flags.set(props.key, {
          enabled: props.enabled,
          updatedAt: row.created_at,
        });
      }
    }

    return Array.from(flags.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }),

  /**
   * Set a feature flag.
   */
  setFeatureFlag: staffProcedure
    .input(
      z.object({
        key: z.string().min(1).max(100),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from("analytics_events").insert({
        event_name: "feature_flag",
        properties: { key: input.key, enabled: input.enabled },
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set feature flag",
        });
      }

      return { success: true };
    }),

  /**
   * Search and list users.
   */
  getUsers: staffProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum(["active", "warned", "restricted", "suspended", "closed"])
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("users")
        .select("*, creator_profiles(niche, city, slug)")
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.search) {
        query = query.ilike("email", `%${input.search}%`);
      }
      if (input.status) {
        query = query.eq("account_status", input.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }

      return data;
    }),

  /**
   * Get system-wide stats for the admin dashboard.
   */
  getSystemStats: staffProcedure.query(async ({ ctx }) => {
    const [users, posts, streaks, subs, reports, revenue] = await Promise.all([
      ctx.supabase
        .from("users")
        .select("id", { count: "exact", head: true }),
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true }),
      ctx.supabase
        .from("streak_states")
        .select("current_streak"),
      ctx.supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      ctx.supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      ctx.supabase
        .from("payment_transactions")
        .select("amount, currency")
        .eq("status", "success"),
    ]);

    const totalRevenue =
      revenue.data?.reduce((sum, t) => {
        // Simple conversion for display: treat USD as 1500 NGN
        const multiplier = t.currency === "USD" ? 1500 : 1;
        return sum + t.amount * multiplier;
      }, 0) ?? 0;

    return {
      totalUsers: users.count ?? 0,
      totalPosts: posts.count ?? 0,
      averageStreak:
        (streaks.data?.reduce((s, r) => s + r.current_streak, 0) ?? 0) /
        Math.max(streaks.data?.length ?? 1, 1),
      usersWith7PlusStreak:
        streaks.data?.filter((s) => s.current_streak >= 7).length ?? 0,
      activeSubscriptions: subs.count ?? 0,
      pendingReports: reports.count ?? 0,
      totalRevenueNGN: totalRevenue,
    };
  }),

  /**
   * Sanction a user (warn, restrict, suspend).
   */
  sanctionUser: staffProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        action: z.enum(["warn", "restrict", "suspend", "reactivate"]),
        reason: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accountStatus =
        input.action === "reactivate"
          ? "active"
          : input.action === "warn"
            ? "warned"
            : input.action === "restrict"
              ? "restricted"
              : "suspended";

      const [statusErr, sanctionErr] = await Promise.all([
        ctx.supabase
          .from("users")
          .update({ account_status: accountStatus })
          .eq("id", input.userId),
        ctx.supabase.from("user_sanctions").insert({
          user_id: input.userId,
          action: accountStatus,
          reason: input.reason,
          issued_by: ctx.user.id,
        }),
      ]);

      if (statusErr.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user status",
        });
      }
      if (sanctionErr.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record sanction",
        });
      }

      return { success: true };
    }),

  /**
   * Get sanctions for a user (audit trail).
   */
  getUserSanctions: staffProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("user_sanctions")
        .select("*, staff:users!issued_by(display_name)")
        .eq("user_id", input.userId)
        .order("issued_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch sanctions",
        });
      }

      return data;
    }),
});
