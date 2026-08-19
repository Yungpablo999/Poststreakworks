import type { SupabaseClient } from "@supabase/supabase-js";

// Shared streak-advancement logic, callable from both a tRPC procedure
// (packages/api/routers/streak-gamification.ts's recordEvent) and the cron
// dispatch job (packages/jobs/index.ts), which has no tRPC context. Factored
// out so there's exactly one place this logic lives, not two copies that
// drift.
//
// WAT (Africa/Lagos, UTC+1) date handling is ported from v1's
// src/lib/streak.ts. v1 has no DST to worry about in Lagos itself, but
// deliberately avoids subtracting 86400s from Date.now() for "yesterday" —
// that arithmetic can land on the wrong calendar day if the *server's* clock
// observes DST, even though WAT itself doesn't. Same reasoning applies here.

export function todayWAT(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

export function yesterdayWAT(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);

  const todayNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const yesterdayNoon = new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000);

  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(yesterdayNoon);
}

const JARVIS_THRESHOLDS: Array<{ min: number; emotion: string }> = [
  { min: 30, emotion: "thriving" },
  { min: 14, emotion: "happy" },
  { min: 7, emotion: "content" },
  { min: 3, emotion: "neutral" },
  { min: 2, emotion: "concerned" },
  { min: 1, emotion: "worried" },
  { min: 0, emotion: "at_risk" },
];

export function calculateJarvisEmotion(
  currentStreak: number,
  lastQualifyingDay: string | null,
): string {
  const today = todayWAT();
  if (lastQualifyingDay !== today) {
    if (lastQualifyingDay === yesterdayWAT()) return "worried";
    if (!lastQualifyingDay) return "heartbroken";
    return "devastated";
  }
  for (const threshold of JARVIS_THRESHOLDS) {
    if (currentStreak >= threshold.min) return threshold.emotion;
  }
  return "neutral";
}

// ─── XP / Leveling ──────────────────────────────────────────────────────────
// The frontend (30 Expo screens) shows level/xp/nextLevelXp pervasively —
// touched by Dashboard, Quests, ChallengeDetail, CollabIdea, Messages, Match,
// JarvisPro. Rather than a parallel XP ledger, this reuses the existing
// `credits` table (already an append-only earn/redeem ledger for streak
// milestones) as the single source of truth: xp = sum(earn) - sum(redeem).
// Every gamified action that awards XP inserts a `credits` row.

const XP_PER_LEVEL = 250;

export function levelForXp(xp: number): { level: number; nextLevelXp: number } {
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  return { level, nextLevelXp: level * XP_PER_LEVEL };
}

export async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  source: string,
  description?: string,
): Promise<void> {
  if (amount <= 0) return;
  await supabase.from("credits").insert({
    user_id: userId,
    type: "earn",
    amount,
    source,
    description: description ?? source,
  });
}

export async function getXpBalance(supabase: SupabaseClient, userId: string): Promise<number> {
  const [earns, redeems] = await Promise.all([
    supabase.from("credits").select("amount").eq("user_id", userId).eq("type", "earn"),
    supabase.from("credits").select("amount").eq("user_id", userId).eq("type", "redeem"),
  ]);
  const earned = (earns.data ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
  const redeemed = (redeems.data ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
  return earned - redeemed;
}

export type StreakEventType = "publish" | "mission_completion" | "collaboration_completion";

export type RecordStreakEventResult =
  | { qualified: false; reason: string }
  | { qualified: true; newStreak: number; emotion: string; isMilestone: boolean };

const MILESTONE_THRESHOLDS = [7, 14, 30, 50, 100, 365];

/**
 * Record a qualifying streak action for a user. Idempotent per calendar day
 * (WAT) — calling this twice in one day for the same user is a no-op the
 * second time, same guarantee v1's cron idempotency guard provided.
 *
 * Never throws for a missing/errored streak_state fetch on the happy path —
 * mirrors v1's rule that a streak update must never fail the action that
 * triggered it (a publish, a mission completion). Callers that need to
 * surface a hard failure (e.g. the tRPC procedure) should still check
 * ctx.supabase errors themselves; this function reports failures via the
 * return value's `qualified: false` rather than throwing where practical.
 */
export async function recordStreakEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: StreakEventType,
  metadata?: Record<string, unknown>,
): Promise<RecordStreakEventResult> {
  const today = todayWAT();

  const { data: existingEvent } = await supabase
    .from("streak_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_date", today)
    .limit(1)
    .maybeSingle();

  if (existingEvent) {
    return { qualified: false, reason: "Already qualified today" };
  }

  const { error: eventErr } = await supabase.from("streak_events").insert({
    user_id: userId,
    event_type: eventType,
    event_date: today,
    metadata: metadata ?? {},
  });

  if (eventErr) {
    return { qualified: false, reason: `Failed to record streak event: ${eventErr.message}` };
  }

  let { data: state } = await supabase
    .from("streak_states")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!state) {
    const { data: created } = await supabase
      .from("streak_states")
      .insert({ user_id: userId })
      .select()
      .single();
    state = created;
  }

  if (!state) {
    return { qualified: false, reason: "Could not initialize streak state" };
  }

  const yesterday = yesterdayWAT();
  const isConsecutive = state.last_qualifying_day === yesterday || state.current_streak === 0;

  const newStreak = isConsecutive ? state.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, state.longest_streak);
  const emotion = calculateJarvisEmotion(newStreak, today);

  await supabase
    .from("streak_states")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_qualifying_day: today,
      jarvis_emotion: emotion,
    })
    .eq("user_id", userId);

  const isMilestone = MILESTONE_THRESHOLDS.includes(newStreak);

  if (isMilestone) {
    await supabase.from("milestones").insert({
      user_id: userId,
      milestone_type: `${newStreak}_day_streak`,
    });

    await supabase.from("credits").insert({
      user_id: userId,
      type: "earn",
      amount: newStreak * 2,
      source: "streak_milestone",
      description: `${newStreak}-day streak milestone`,
    });
  }

  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: "streak_qualified",
    properties: { event_type: eventType, new_streak: newStreak, is_milestone: isMilestone },
  });

  return { qualified: true, newStreak, emotion, isMilestone };
}
