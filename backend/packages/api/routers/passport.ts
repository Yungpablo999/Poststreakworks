import { createTRPCRouter, protectedProcedure } from "../context";
import type { SupabaseClient } from "@supabase/supabase-js";

// Creator Passport, Opportunity Readiness, and (indirectly) Earnings'
// "readiness" figure all read from the same underlying signals in the built
// frontend, but the three screens currently show three different,
// inconsistent hardcoded percentages (35%, 70%, 70%). That's a symptom of
// having no single backend source of truth — this file is that source of
// truth. Every screen's real query should end up calling one of the two
// procedures below, never compute its own score client-side.
//
// Scope note: this whole domain (Creator Passport / Opportunity Readiness /
// Earnings) maps onto the Brand & Agency Platform / Opportunity Marketplace
// pillars OPEN_QUESTIONS.md listed as explicitly deferred. Confirmed to
// build anyway — the frontend already committed real screens to it.

type PassportSignals = {
  profileStrengthPct: number; // 0-100, filled-in creator_profiles fields
  streakDays: number;
  platformsConnected: number;
  questsCompleted: number;
  totalQuests: number;
  collaborationsCompleted: number;
  isProSubscriber: boolean;
  identityVerified: boolean;
  marketplaceReadyOverride: boolean | null;
};

async function computeSignals(supabase: SupabaseClient, userId: string): Promise<PassportSignals> {
  const [profile, streakState, connections, questProgress, questTotal, briefs, subscription, facts] =
    await Promise.all([
      supabase.from("creator_profiles").select("bio, niche, platform_links").eq("user_id", userId).maybeSingle(),
      supabase.from("streak_states").select("current_streak").eq("user_id", userId).maybeSingle(),
      supabase
        .from("platform_connections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("disconnected_at", null),
      supabase
        .from("quest_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      supabase.from("quests").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("collaboration_briefs")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId)
        .eq("status", "completed"),
      supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .maybeSingle(),
      supabase
        .from("creator_passport_facts")
        .select("identity_verified, marketplace_ready_override")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const profileFields = [profile.data?.bio, profile.data?.niche, profile.data?.platform_links];
  const filledCount = profileFields.filter(
    (f) => f !== null && f !== undefined && (typeof f !== "object" || Object.keys(f).length > 0),
  ).length;
  const profileStrengthPct = Math.round((filledCount / profileFields.length) * 100);

  return {
    profileStrengthPct,
    streakDays: streakState.data?.current_streak ?? 0,
    platformsConnected: connections.count ?? 0,
    questsCompleted: questProgress.count ?? 0,
    totalQuests: questTotal.count ?? 0,
    collaborationsCompleted: briefs.count ?? 0,
    isProSubscriber: !!subscription.data,
    identityVerified: facts.data?.identity_verified ?? false,
    marketplaceReadyOverride: facts.data?.marketplace_ready_override ?? null,
  };
}

// Weighted composite: profile 25%, streak 25% (capped at 30 days), platforms
// 20% (capped at 3), quests 20%, collaboration 10%. Pro subscribers get a
// flat +15 point boost, matching CreatorPassportScreen's "Unlock Premium
// Analytics (+15%)" Pro-gated line — arbitrary but documented weights,
// intentionally adjustable in one place now that there's one place.
function computeScore(signals: PassportSignals): number {
  const streakPct = Math.min(100, (signals.streakDays / 30) * 100);
  const platformsPct = Math.min(100, (signals.platformsConnected / 3) * 100);
  const questsPct = signals.totalQuests > 0 ? (signals.questsCompleted / signals.totalQuests) * 100 : 0;
  const collabPct = Math.min(100, signals.collaborationsCompleted * 25);

  const base =
    signals.profileStrengthPct * 0.25 +
    streakPct * 0.25 +
    platformsPct * 0.2 +
    questsPct * 0.2 +
    collabPct * 0.1;

  const withProBoost = signals.isProSubscriber ? base + 15 : base;
  return Math.round(Math.min(100, withProBoost));
}

function consistencyRating(streakDays: number): "Strong" | "Moderate" | "Growing" {
  if (streakDays >= 30) return "Strong";
  if (streakDays >= 7) return "Moderate";
  return "Growing";
}

function collaborationLevel(count: number): "Beginner" | "Intermediate" | "Pro" {
  if (count >= 4) return "Pro";
  if (count >= 1) return "Intermediate";
  return "Beginner";
}

const MARKETPLACE_READY_THRESHOLD = 85;

export const passportRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const signals = await computeSignals(ctx.supabase, ctx.user.id);
    const score = computeScore(signals);

    return {
      userId: ctx.user.id,
      passportScore: score,
      profileStrength: signals.profileStrengthPct,
      streakScoreDays: signals.streakDays,
      consistencyRating: consistencyRating(signals.streakDays),
      collaborationLevel: collaborationLevel(signals.collaborationsCompleted),
      questsCompleted: signals.questsCompleted,
      totalQuests: signals.totalQuests,
      marketplaceReady: signals.marketplaceReadyOverride ?? score >= MARKETPLACE_READY_THRESHOLD,
      identityVerified: signals.identityVerified,
      activityHistoryValid: signals.streakDays >= 7,
    };
  }),

  getOpportunityReadiness: protectedProcedure.query(async ({ ctx }) => {
    const signals = await computeSignals(ctx.supabase, ctx.user.id);
    const score = computeScore(signals);

    return {
      score,
      profilePct: signals.profileStrengthPct,
      platformsConnected: signals.platformsConnected,
      streakRating: consistencyRating(signals.streakDays),
      questsCompleted: signals.questsCompleted,
      totalQuests: signals.totalQuests,
      checklist: [
        { id: "profile", label: "Profile Completion", completed: signals.profileStrengthPct >= 100 },
        { id: "platforms", label: "2+ Platforms Connected", completed: signals.platformsConnected >= 2 },
        { id: "passport", label: "Creator Passport", completed: score >= MARKETPLACE_READY_THRESHOLD },
        { id: "streak", label: "7-day Streak", completed: signals.streakDays >= 7 },
      ],
    };
  }),
});
