import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  createSupabaseServiceClient,
  TIER_LIMITS,
} from "../context";
import { TRPCError } from "@trpc/server";
import { getCheckInSummary, getXpBalance, levelForXp } from "@poststreak/workflows";
import { saveOnboardingInput } from "../lib/onboarding";
import { toAppPlatform } from "../lib/platforms";

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
        .select("*")
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

      // users only has an RLS policy for reading your OWN row, and this
      // procedure is unauthenticated (auth.uid() is null here) — a `!inner`
      // embed on it would ALWAYS fail the join and 404 every profile,
      // public or not. Narrow service-role lookup for the two public
      // identity columns, same pattern as creator-network.ts/duels.ts.
      const { data: userRow } = await createSupabaseServiceClient()
        .from("users")
        .select("display_name, avatar_url, country")
        .eq("id", data.user_id)
        .single();

      return { ...data, users: userRow ?? null };
    }),

  /**
   * Create or update the current user's creator profile.
   */
  upsertProfile: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { displayName, platformLinks, collaborationIntent, isPublic, ...rest } = input;

      // The input is camelCase but the columns are snake_case (spreading the
      // input straight into the upsert made PostgREST reject displayName,
      // platformLinks, collaborationIntent and isPublic). display_name also
      // lives on users, not creator_profiles.
      if (displayName !== undefined) {
        const { error: nameError } = await ctx.supabase
          .from("users")
          .update({ display_name: displayName })
          .eq("id", ctx.user.id);
        if (nameError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update display name",
          });
        }
      }

      const { data, error } = await ctx.supabase
        .from("creator_profiles")
        .upsert(
          {
            user_id: ctx.user.id,
            ...rest,
            ...(platformLinks !== undefined && { platform_links: platformLinks }),
            ...(collaborationIntent !== undefined && { collaboration_intent: collaborationIntent }),
            ...(isPublic !== undefined && { is_public: isPublic }),
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
    // account_status is server-owned (creators can't write it — migration
    // …21_rls_hardening) and it is what protectedProcedure actually checks, so
    // closed_at alone never locked anything. Service role, scoped by id.
    const { data, error } = await createSupabaseServiceClient()
      .from("users")
      .update({ closed_at: new Date().toISOString(), account_status: "closed" })
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

  // ==========================================================================
  // Phase 1 — onboarding state the app used to keep in memory
  // ==========================================================================

  /**
   * Saves what the creator told us while signing up: name, handle, topics, and
   * their device time zone (which decides when "today" and "this week" start
   * for them). Every field is optional, so the app can send each step as it goes.
   */
  saveOnboarding: protectedProcedure
    .input(saveOnboardingInput)
    .mutation(async ({ ctx, input }) => {
      const userUpdate = {
        ...(input.displayName !== undefined && { display_name: input.displayName }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
      };
      if (Object.keys(userUpdate).length > 0) {
        const { error } = await ctx.supabase.from("users").update(userUpdate).eq("id", ctx.user.id);
        if (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save your details" });
        }
      }

      const profileUpdate = {
        ...(input.niches !== undefined && { niches: input.niches }),
        ...(input.handle !== undefined && { slug: input.handle }),
      };
      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await ctx.supabase
          .from("creator_profiles")
          .upsert({ user_id: ctx.user.id, ...profileUpdate }, { onConflict: "user_id" });
        if (error) {
          // 23505: creator_profiles.slug is unique.
          if (error.code === "23505") {
            throw new TRPCError({ code: "CONFLICT", message: "That handle is already taken" });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save your profile" });
        }
      }

      return { saved: true };
    }),

  /** Ghost's welcome tour was finished (or skipped). Idempotent. */
  markTourDone: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase
      .from("users")
      .update({ tour_done_at: new Date().toISOString() })
      .eq("id", ctx.user.id)
      .is("tour_done_at", null);

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save tour state" });
    }
    return { done: true };
  }),

  /** A first-visit tip was shown; don't show it again. Idempotent. */
  markTipSeen: protectedProcedure
    .input(z.object({ key: z.string().regex(/^[a-z0-9][a-z0-9:_-]{0,59}$/) }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("mark_tip_seen", { p_key: input.key });
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save tip state" });
      }
      return { tipsSeen: (data as string[] | null) ?? [] };
    }),

  /**
   * Everything the app needs at launch, in one round trip: profile, plan,
   * connected platforms, check-in streak, drafts, saved hooks, repurpose
   * allowance, and tour/tip state. The app replaces its in-memory sample data
   * with this once the creator signs in.
   */
  bootstrap: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [userRes, profileRes, platformsRes, draftsRes, hooksRes, checkIn, xp, usedRes] = await Promise.all([
      ctx.supabase
        .from("users")
        .select("display_name, email, avatar_url, timezone, tour_done_at, tips_seen, created_at")
        .eq("id", userId)
        .single(),
      ctx.supabase.from("creator_profiles").select("bio, niche, niches, slug").eq("user_id", userId).maybeSingle(),
      ctx.supabase.from("platform_connections").select("platform").eq("user_id", userId).is("disconnected_at", null),
      ctx.supabase
        .from("drafts")
        .select("client_key, title, kind, format, platform, payload, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(200),
      ctx.supabase
        .from("saved_hooks")
        .select("line, style, idea, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      getCheckInSummary(userId),
      getXpBalance(ctx.supabase, userId),
      createSupabaseServiceClient().rpc("repurpose_used_this_week", { p_user_id: userId }),
    ]);

    if (userRes.error || !userRes.data) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load your account" });
    }
    for (const res of [platformsRes, draftsRes, hooksRes, usedRes]) {
      if (res.error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load your data" });
      }
    }

    const user = userRes.data;
    const connectedPlatforms = (platformsRes.data ?? [])
      .map((p) => toAppPlatform(p.platform as string))
      .filter((p): p is NonNullable<typeof p> => p !== null);
    const drafts = (draftsRes.data ?? []).map((d) => ({
      id: d.client_key as string,
      title: d.title as string,
      kind: d.kind as "script" | "post",
      format: d.format as string,
      platform: d.platform ? toAppPlatform(d.platform as string) ?? undefined : undefined,
      payload: d.payload as Record<string, unknown>,
      savedAt: new Date(d.updated_at as string).getTime(),
    }));
    const savedHooks = (hooksRes.data ?? []).map((h) => ({
      line: h.line as string,
      style: h.style as string,
      idea: h.idea as string,
      savedAt: new Date(h.created_at as string).getTime(),
    }));
    const { level, nextLevelXp } = levelForXp(xp);

    return {
      profile: {
        id: userId,
        name: (user.display_name as string | null) ?? "",
        handle: profileRes.data?.slug ?? "",
        email: user.email as string,
        avatarUrl: (user.avatar_url as string | null) ?? undefined,
        bio: profileRes.data?.bio ?? "",
        niche: profileRes.data?.niche ?? "",
        niches: (profileRes.data?.niches as string[] | undefined) ?? [],
        tier: ctx.user.tier,
        level,
        xp,
        nextLevelXp,
        timezone: user.timezone as string,
        createdAt: user.created_at as string,
      },
      // "returning" once they've done anything real; the app uses it to choose
      // between the first-day and everyday Home.
      persona:
        checkIn.longestDays > 0 || drafts.length > 0 || savedHooks.length > 0 || connectedPlatforms.length > 0
          ? ("returning" as const)
          : ("new" as const),
      connectedPlatforms,
      checkIn,
      drafts,
      savedHooks,
      repurpose: {
        usedThisWeek: (usedRes.data as number | null) ?? 0,
        weeklyLimit: TIER_LIMITS[ctx.user.tier].repurposesPerWeek,
      },
      tour: { done: user.tour_done_at !== null },
      tipsSeen: (user.tips_seen as string[]) ?? [],
    };
  }),
});
