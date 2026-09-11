import { z } from "zod";
import { createTRPCRouter, protectedProcedure, createSupabaseServiceClient } from "../context";
import { TRPCError } from "@trpc/server";

// users only has an RLS policy for reading your OWN row (users_select_own —
// see supabase/migrations/20260814000001), so ctx.supabase (RLS-scoped to
// the caller) can never see another user's display_name/avatar_url — an
// embedded `users!fk(...)` select on it silently returns null, not an
// error. Fetching those two public-identity fields is a narrow, deliberate
// use of the service-role client, same pattern as rate-limit.ts and the
// admin auth gate — everything else here still goes through ctx.supabase
// so RLS keeps governing which rows (matches/conversations/messages) the
// caller can see at all.
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

export const creatorNetworkRouter = createTRPCRouter({
  /**
   * Record a discovery action (view, pass, save, interest).
   */
  discover: protectedProcedure
    .input(
      z.object({
        targetId: z.string().uuid(),
        action: z.enum([
          "viewed",
          "passed",
          "saved",
          "interested",
          "priority_requested",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the user's creator profile
      const { data: profile } = await ctx.supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", ctx.user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete your profile before discovering creators",
        });
      }

      const { data, error } = await ctx.supabase
        .from("discovery_actions")
        .upsert(
          {
            actor_id: profile.id,
            target_id: input.targetId,
            action: input.action,
          },
          { onConflict: "actor_id,target_id,action" },
        )
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record action",
        });
      }

      // If both sides expressed interest, create a match
      if (
        input.action === "interested" ||
        input.action === "priority_requested"
      ) {
        const { data: reverseAction } = await ctx.supabase
          .from("discovery_actions")
          .select("id")
          .eq("actor_id", input.targetId)
          .eq("target_id", profile.id)
          .in("action", ["interested", "priority_requested"])
          .limit(1)
          .single();

        if (reverseAction) {
          // Check if match already exists
          const { data: existingMatch } = await ctx.supabase
            .from("matches")
            .select("id")
            .or(
              `user_a_id.eq.${profile.id},user_b_id.eq.${input.targetId},user_a_id.eq.${input.targetId},user_b_id.eq.${profile.id}`,
            )
            .limit(1)
            .single();

          if (!existingMatch) {
            const { data: newMatch } = await ctx.supabase
              .from("matches")
              .insert({
                user_a_id: profile.id,
                user_b_id: input.targetId,
                status: "active",
              })
              .select()
              .single();

            if (newMatch) {
              // Create conversation for the match
              await ctx.supabase
                .from("conversations")
                .insert({ match_id: newMatch.id });
            }
          }
        }
      }

      return data;
    }),

  /**
   * Get a swipeable deck of discoverable creator profiles — public
   * profiles the current user hasn't already acted on (viewed/passed/
   * saved/interested), excluding their own. MatchScreen's CREATOR_DECK
   * needed this and nothing in this router produced a browsable feed
   * before, only per-target action logging.
   */
  getDiscoveryFeed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const { data: profile } = await ctx.supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", ctx.user.id)
        .single();

      if (!profile) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete your profile before discovering creators",
        });
      }

      const { data: actedOn } = await ctx.supabase
        .from("discovery_actions")
        .select("target_id")
        .eq("actor_id", profile.id);

      // PostgREST's `in` filter takes a raw "(v1,v2,...)" string, not a
      // parameterized array — that's inherent to the API, not a shortcut
      // taken here. Every value in this list is already a UUID we generated
      // ourselves (profile.id, or target_id from rows this same procedure's
      // own Zod-validated `discover` mutation inserted), so this isn't
      // reachable with attacker-controlled content today — but asserting
      // the UUID shape before interpolating is a one-line defense against
      // this pattern becoming unsafe later if it's ever reused with a less
      // trusted source.
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const excludeIds = [profile.id, ...(actedOn ?? []).map((a) => a.target_id)].filter((id) =>
        uuidPattern.test(id),
      );

      const { data, error } = await ctx.supabase
        .from("creator_profiles")
        .select("id, user_id, bio, niche, city, languages, platform_links, slug")
        .eq("is_public", true)
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch discovery feed",
        });
      }

      return data;
    }),

  /**
   * Get the user's active matches.
   */
  getMatches: protectedProcedure.query(async ({ ctx }) => {
    const { data: profile } = await ctx.supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!profile) return [];

    const { data, error } = await ctx.supabase
      .from("matches")
      .select("*, user_a:creator_profiles!user_a_id(*), user_b:creator_profiles!user_b_id(*)")
      .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
      .eq("status", "active");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch matches",
      });
    }

    return data;
  }),

  /**
   * Get conversations for the current user.
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const { data: profile } = await ctx.supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!profile) return [];

    // matches_select_own already scopes this to rows where the caller is
    // user_a or user_b, so no extra .or() filter is needed (and one on an
    // embedded resource here would need the embed to be !inner to behave
    // predictably) — just embed matches directly via the FK on conversations.
    const { data, error } = await ctx.supabase
      .from("conversations")
      .select(`
        *,
        match:matches(
          id, status, matched_at,
          user_a:creator_profiles!user_a_id(id, user_id, niche, slug),
          user_b:creator_profiles!user_b_id(id, user_id, niche, slug)
        )
      `);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch conversations",
      });
    }

    const otherUserIds = (data ?? [])
      .map((c) => {
        const match = c.match as unknown as {
          user_a: { user_id: string } | null;
          user_b: { user_id: string } | null;
        } | null;
        const a = match?.user_a?.user_id;
        const b = match?.user_b?.user_id;
        return a === ctx.user.id ? b : a;
      })
      .filter((id): id is string => !!id);
    const displayInfo = await getDisplayInfo(otherUserIds);

    return (data ?? []).map((c) => {
      const match = c.match as unknown as {
        user_a: { user_id: string } | null;
        user_b: { user_id: string } | null;
      } | null;
      const otherId = match?.user_a?.user_id === ctx.user.id ? match?.user_b?.user_id : match?.user_a?.user_id;
      return { ...c, otherCreator: otherId ? { userId: otherId, ...displayInfo.get(otherId) } : null };
    });
  }),

  /**
   * Get messages in a conversation.
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        before: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", input.conversationId)
        .order("created_at", { ascending: true })
        .limit(input.limit);

      if (input.before) {
        query = query.lt("created_at", input.before);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }

      const displayInfo = await getDisplayInfo((data ?? []).map((m) => m.sender_id));
      return (data ?? []).map((m) => ({ ...m, sender: displayInfo.get(m.sender_id) ?? null }));
    }),

  /**
   * Send a message in a conversation.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is part of the conversation
      const { data: conversation } = await ctx.supabase
        .from("conversations")
        .select("*, match:matches(user_a_id, user_b_id)")
        .eq("id", input.conversationId)
        .single();

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const { data: profile } = await ctx.supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", ctx.user.id)
        .single();

      if (
        !profile ||
        (conversation.match as any).user_a_id !== profile.id &&
          (conversation.match as any).user_b_id !== profile.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not part of this conversation",
        });
      }

      const { data, error } = await ctx.supabase
        .from("messages")
        .insert({
          conversation_id: input.conversationId,
          sender_id: ctx.user.id,
          content: input.content,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }

      return data;
    }),

  /**
   * Get available squads.
   */
  getSquads: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("squads")
      .select("*, squad_members(count)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch squads",
      });
    }

    return data;
  }),

  /**
   * Join a squad.
   */
  joinSquad: protectedProcedure
    .input(z.object({ squadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("squad_members")
        .insert({ squad_id: input.squadId, user_id: ctx.user.id })
        .select()
        .single();

      if (error?.code === "23505") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already a member of this squad",
        });
      }
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join squad",
        });
      }

      return data;
    }),

  /**
   * Get collaboration briefs for the current user.
   */
  getBriefs: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("collaboration_briefs")
      .select("*, match:matches(*)")
      .eq("created_by", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch briefs",
      });
    }

    return data;
  }),

  /**
   * Create a collaboration brief.
   */
  createBrief: protectedProcedure
    .input(
      z.object({
        matchId: z.string().uuid().optional(),
        concept: z.string().min(1).max(2000),
        roles: z.array(z.record(z.any())).optional(),
        deliverables: z.array(z.record(z.any())).optional(),
        startDate: z.string().date().optional(),
        endDate: z.string().date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("collaboration_briefs")
        .insert({
          created_by: ctx.user.id,
          match_id: input.matchId,
          concept: input.concept,
          roles: input.roles ?? [],
          deliverables: input.deliverables ?? [],
          start_date: input.startDate,
          end_date: input.endDate,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create brief",
        });
      }

      return data;
    }),
});
