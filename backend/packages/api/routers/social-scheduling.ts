import { z } from "zod";
import { createTRPCRouter, protectedProcedure, TIER_LIMITS } from "../context";
import { TRPCError } from "@trpc/server";
import { PROVIDER_NAMES, isProviderId } from "@poststreak/integrations";

// Every platform the database knows (platform_type). The app's "x" is stored as "twitter".
const platformSchema = z.enum(["linkedin", "twitter", "meta", "tiktok", "instagram", "youtube", "threads", "facebook"]);

const connectPlatformSchema = z.object({
  platform: platformSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  platformUserId: z.string().min(1),
});

export const socialSchedulingRouter = createTRPCRouter({
  /**
   * List connected platforms for the current user.
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("platform_connections")
      .select("id, platform, publish_mode, platform_user_id, connected_at")
      .eq("user_id", ctx.user.id)
      .is("disconnected_at", null)
      .order("connected_at", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch connections",
      });
    }

    return data;
  }),

  /**
   * Connect a social platform.
   */
  connect: protectedProcedure
    .input(connectPlatformSchema)
    .mutation(async ({ ctx, input }) => {
      // TikTok, Instagram, Threads, Facebook and YouTube connect through their own sign-in
      // (platformConnect.authorize). This path stores whatever string the caller sends as the
      // token, which for a platform with real OAuth would be a fake connection.
      if (isProviderId(input.platform)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${PROVIDER_NAMES[input.platform]} connects through its own sign-in. Use the Connect ${PROVIDER_NAMES[input.platform]} button.`,
        });
      }

      // Check if already connected
      const { data: existing } = await ctx.supabase
        .from("platform_connections")
        .select("id")
        .eq("user_id", ctx.user.id)
        .eq("platform", input.platform)
        .is("disconnected_at", null)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Platform ${input.platform} is already connected`,
        });
      }

      // Free tier: max 2 connected platforms (architecture/
      // SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md's entitlement matrix).
      const maxPlatforms = TIER_LIMITS[ctx.user.tier].maxConnectedPlatforms;
      if (maxPlatforms !== Infinity) {
        const { count } = await ctx.supabase
          .from("platform_connections")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ctx.user.id)
          .is("disconnected_at", null);

        if ((count ?? 0) >= maxPlatforms) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Free tier is limited to ${maxPlatforms} connected platforms.`,
            cause: {
              upgradeRequired: true,
              upsell: {
                title: "Unlock unlimited platform connections",
                features: ["Unlimited Connected Platforms (TikTok, IG, YT, X, LinkedIn, Threads, Snap)"],
                upgradeUrl: "/api/v1/billing/checkout",
              },
            },
          });
        }
      }

      const { data, error } = await ctx.supabase
        .from("platform_connections")
        .insert({
          user_id: ctx.user.id,
          platform: input.platform,
          platform_user_id: input.platformUserId,
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
        })
        // Never echo OAuth tokens back to the client; creators can't read the
        // token columns at all (migration …21_rls_hardening).
        .select("id, platform, publish_mode, platform_user_id, connected_at")
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect platform",
        });
      }

      // Track analytics
      await ctx.track("platform_connected", { platform: input.platform });

      return data;
    }),

  /**
   * Disconnect a social platform.
   */
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("platform_connections")
        .update({ disconnected_at: new Date().toISOString() })
        .eq("id", input.connectionId)
        .eq("user_id", ctx.user.id)
        .select("id, platform, disconnected_at")
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disconnect platform",
        });
      }

      return data;
    }),
});
