import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure, createSupabaseServiceClient } from "../context";
import { TRPCError } from "@trpc/server";

// users only has an RLS policy for reading/updating your OWN row
// (users_select_own / users_update_own — see supabase/migrations/
// 20260814000001). Every lookup of ANOTHER user's display_name/email here
// silently returns null via ctx.supabase, and — more seriously —
// resolveReport's account_status update on the *target* user would
// silently affect zero rows. staffProcedure has already verified the
// caller is staff_admin, so a narrow service-role client for exactly
// these operations is the correct, deliberate elevation, not a shortcut.
async function getDisplayInfo(userIds: string[]) {
  const map = new Map<string, { display_name: string | null; email: string | null; avatar_url: string | null }>();
  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueIds.length === 0) return map;
  const { data } = await createSupabaseServiceClient()
    .from("users")
    .select("id, display_name, email, avatar_url")
    .in("id", uniqueIds);
  for (const row of data ?? []) {
    map.set(row.id, { display_name: row.display_name, email: row.email, avatar_url: row.avatar_url });
  }
  return map;
}

export const safetyModerationRouter = createTRPCRouter({
  /**
   * Block a user.
   */
  block: protectedProcedure
    .input(z.object({ blockedId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.blockedId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot block yourself",
        });
      }

      const { data, error } = await ctx.supabase
        .from("blocks")
        .insert({ blocker_id: ctx.user.id, blocked_id: input.blockedId })
        .select()
        .single();

      if (error?.code === "23505") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already blocked",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to block user",
        });
      }

      return data;
    }),

  /**
   * Unblock a user.
   */
  unblock: protectedProcedure
    .input(z.object({ blockedId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", ctx.user.id)
        .eq("blocked_id", input.blockedId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unblock user",
        });
      }

      return { success: true };
    }),

  /**
   * Get blocked users.
   */
  getBlocks: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("blocks")
      .select("*")
      .eq("blocker_id", ctx.user.id);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch blocks",
      });
    }

    const displayInfo = await getDisplayInfo((data ?? []).map((b) => b.blocked_id));
    return (data ?? []).map((b) => {
      const info = displayInfo.get(b.blocked_id);
      return { ...b, blocked: info ? { display_name: info.display_name, avatar_url: info.avatar_url } : null };
    });
  }),

  /**
   * Report a user, message, or collaboration.
   */
  report: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().uuid().optional(),
        targetMessageId: z.string().uuid().optional(),
        targetType: z.enum(["user", "message", "collaboration"]),
        category: z.enum(["spam", "harassment", "inappropriate", "other"]),
        evidence: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("reports")
        .insert({ reporter_id: ctx.user.id, ...input })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit report",
        });
      }

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "report_submitted",
        properties: { target_type: input.targetType, category: input.category },
      });

      return data;
    }),

  /**
   * Get reports submitted by the current user.
   */
  getMyReports: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("reports")
      .select("*")
      .eq("reporter_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch reports",
      });
    }

    return data;
  }),

  // =========================================================================
  // Staff-only procedures
  // =========================================================================

  /**
   * Get the moderation queue (pending + reviewing reports).
   */
  getQueue: staffProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("reports")
      .select("*")
      .in("status", ["pending", "reviewing"])
      .order("created_at", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch moderation queue",
      });
    }

    const ids = (data ?? []).flatMap((r) => [r.reporter_id, r.target_user_id]);
    const displayInfo = await getDisplayInfo(ids);
    return (data ?? []).map((r) => ({
      ...r,
      reporter: displayInfo.get(r.reporter_id) ?? null,
      target_user: r.target_user_id ? (displayInfo.get(r.target_user_id) ?? null) : null,
    }));
  }),

  /**
   * Resolve a report with a staff action.
   */
  resolveReport: staffProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        action: z.enum(["warn", "restrict", "suspend", "dismiss", "resolve"]),
        reason: z.string().min(1).max(2000),
        targetUserId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Record the moderation action
      const { error: actionErr } = await ctx.supabase
        .from("moderation_actions")
        .insert({
          report_id: input.reportId,
          staff_user_id: ctx.user.id,
          action: input.action,
          reason: input.reason,
        });

      if (actionErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record action",
        });
      }

      // Update report status
      const { error: reportErr } = await ctx.supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", input.reportId);

      if (reportErr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update report",
        });
      }

      // Apply user sanction if needed
      if (["warn", "restrict", "suspend"].includes(input.action)) {
        const accountStatus =
          input.action === "warn"
            ? "warned"
            : input.action === "restrict"
              ? "restricted"
              : "suspended";

        // A regular ctx.supabase update here would be filtered to zero rows
        // by users_update_own (auth.uid() = id) — the target is never the
        // caller. staffProcedure already verified staff_admin, so this is a
        // deliberate, authorized elevation, not a bypass.
        await createSupabaseServiceClient()
          .from("users")
          .update({ account_status: accountStatus })
          .eq("id", input.targetUserId);

        await ctx.supabase.from("user_sanctions").insert({
          user_id: input.targetUserId,
          action: accountStatus,
          reason: input.reason,
          issued_by: ctx.user.id,
        });
      }

      return { success: true };
    }),

  /**
   * Get all moderation actions (audit trail).
   */
  getAuditTrail: staffProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("moderation_actions")
      .select("*, report:reports(target_user_id, category)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch audit trail",
      });
    }

    const displayInfo = await getDisplayInfo((data ?? []).map((a) => a.staff_user_id));
    return (data ?? []).map((a) => ({
      ...a,
      staff: displayInfo.get(a.staff_user_id) ? { display_name: displayInfo.get(a.staff_user_id)!.display_name } : null,
    }));
  }),
});
