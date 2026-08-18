import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

const connectPlatformSchema = z.object({
  platform: z.enum(["linkedin", "twitter", "meta", "tiktok"]),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  platformUserId: z.string().min(1),
});

const schedulePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  targetPlatforms: z
    .array(z.enum(["linkedin", "twitter", "meta", "tiktok"]))
    .min(1)
    .max(4),
  scheduledAt: z.string().datetime(),
});

const updatePostSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(5000).optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  targetPlatforms: z
    .array(z.enum(["linkedin", "twitter", "meta", "tiktok"]))
    .min(1)
    .max(4)
    .optional(),
  scheduledAt: z.string().datetime().optional(),
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

      const { data, error } = await ctx.supabase
        .from("platform_connections")
        .insert({
          user_id: ctx.user.id,
          platform: input.platform,
          platform_user_id: input.platformUserId,
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect platform",
        });
      }

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "platform_connected",
        properties: { platform: input.platform },
      });

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
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disconnect platform",
        });
      }

      return data;
    }),

  /**
   * List scheduled posts with optional status filter.
   */
  getPosts: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["draft", "scheduled", "publishing", "published", "failed"])
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("scheduled_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch posts",
        });
      }

      return data;
    }),

  /**
   * Get a single post by ID.
   */
  getPost: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("scheduled_posts")
        .select("*")
        .eq("id", input.postId)
        .eq("user_id", ctx.user.id)
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch post",
        });
      }

      return data;
    }),

  /**
   * Create a new scheduled post.
   */
  create: protectedProcedure
    .input(schedulePostSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has connected all target platforms
      const { data: connections } = await ctx.supabase
        .from("platform_connections")
        .select("platform")
        .eq("user_id", ctx.user.id)
        .is("disconnected_at", null);

      const connectedPlatforms = new Set(
        connections?.map((c) => c.platform) ?? [],
      );
      const missingPlatforms = input.targetPlatforms.filter(
        (p) => !connectedPlatforms.has(p),
      );

      if (missingPlatforms.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Missing platform connections: ${missingPlatforms.join(", ")}`,
        });
      }

      // Validate scheduled time is in the future
      const scheduledAt = new Date(input.scheduledAt);
      if (scheduledAt <= new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scheduled time must be in the future",
        });
      }

      const { data, error } = await ctx.supabase
        .from("scheduled_posts")
        .insert({
          user_id: ctx.user.id,
          content: input.content,
          media_urls: input.mediaUrls ?? [],
          target_platforms: input.targetPlatforms,
          scheduled_at: input.scheduledAt,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "post_created",
        properties: {
          platforms: input.targetPlatforms,
          has_media: (input.mediaUrls?.length ?? 0) > 0,
        },
      });

      return data;
    }),

  /**
   * Update an existing draft or scheduled post.
   */
  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const { postId, ...updates } = input;

      const { data, error } = await ctx.supabase
        .from("scheduled_posts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", postId)
        .eq("user_id", ctx.user.id)
        .in("status", ["draft", "scheduled"])
        .select()
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found or cannot be edited",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update post",
        });
      }

      return data;
    }),

  /**
   * Cancel/delete a post (sets status to failed, soft-delete).
   */
  cancel: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("scheduled_posts")
        .update({ status: "failed" })
        .eq("id", input.postId)
        .eq("user_id", ctx.user.id)
        .in("status", ["draft", "scheduled"])
        .select()
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found or cannot be cancelled",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel post",
        });
      }

      return data;
    }),

  /**
   * Get post counts by status for the dashboard.
   */
  getPostCounts: protectedProcedure.query(async ({ ctx }) => {
    const [drafts, scheduled, published, failed] = await Promise.all([
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("status", "draft"),
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("status", "scheduled"),
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("status", "published"),
      ctx.supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("status", "failed"),
    ]);

    return {
      drafts: drafts.count ?? 0,
      scheduled: scheduled.count ?? 0,
      published: published.count ?? 0,
      failed: failed.count ?? 0,
    };
  }),
});
