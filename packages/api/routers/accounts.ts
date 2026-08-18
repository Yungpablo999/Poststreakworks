import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../context";
import { TRPCError } from "@trpc/server";

const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  languages: z.array(z.string()).optional(),
  platformLinks: z.record(z.string()).optional(),
  collaborationIntent: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export const accountsRouter = createTRPCRouter({
  /**
   * Get the current user's account.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select("*")
      .eq("id", ctx.user.id)
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user",
      });
    }

    return data;
  }),

  /**
   * Get the current user's creator profile.
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", ctx.user.id)
      .single();

    // Profile may not exist yet during onboarding
    if (error?.code === "PGRST116") return null;
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch profile",
      });
    }

    return data;
  }),

  /**
   * Get a public profile by handle (for Creator Passport).
   */
  getPublicProfile: publicProcedure
    .input(z.object({ handle: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("creator_profiles")
        .select("*, users!inner(display_name, avatar_url, country)")
        .eq("slug", input.handle)
        .eq("is_public", true)
        .single();

      if (error?.code === "PGRST116") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch profile",
        });
      }

      return data;
    }),

  /**
   * Create or update the current user's creator profile.
   */
  upsertProfile: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("creator_profiles")
        .upsert(
          {
            user_id: ctx.user.id,
            ...input,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }

      return data;
    }),

  /**
   * Generate a slug from display name for Creator Passport.
   */
  generateSlug: protectedProcedure.mutation(async ({ ctx }) => {
    const { data: user } = await ctx.supabase
      .from("users")
      .select("display_name")
      .eq("id", ctx.user.id)
      .single();

    const baseSlug = (user?.display_name ?? "creator")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check uniqueness and append suffix if needed
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existing } = await ctx.supabase
        .from("creator_profiles")
        .select("id")
        .eq("slug", slug)
        .neq("user_id", ctx.user.id)
        .single();

      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Upslug the slug
    const { data, error } = await ctx.supabase
      .from("creator_profiles")
      .upsert(
        { user_id: ctx.user.id, slug },
        { onConflict: "user_id" },
      )
      .select("slug")
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate slug",
      });
    }

    return { slug: data.slug };
  }),

  /**
   * Mark onboarding as complete.
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete onboarding",
      });
    }

    return data;
  }),

  /**
   * Soft-close the account.
   */
  closeAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to close account",
      });
    }

    return data;
  }),

  /**
   * Get connected platforms for the current user.
   */
  getConnectedPlatforms: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("platform_connections")
      .select("platform, connected_at")
      .eq("user_id", ctx.user.id)
      .is("disconnected_at", null);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch platforms",
      });
    }

    return data;
  }),
});
