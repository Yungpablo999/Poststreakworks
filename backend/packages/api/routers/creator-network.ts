import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

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

    const { data, error } = await ctx.supabase
      .from("conversations")
      .select(`
        *,
        match:matches(
          *,
          user_a:creator_profiles!user_a_id(user_id, display_name, avatar_url),
          user_b:creator_profiles!user_b_id(user_id, display_name, avatar_url)
        )
      `)
      .or(
        `match.user_a_id.eq.${profile.id},match.user_b_id.eq.${profile.id}`,
      );

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch conversations",
      });
    }

    return data;
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
        .select("*, sender:users!sender_id(display_name, avatar_url)")
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

      return data;
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
