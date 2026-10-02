import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./service-client";

// Shared streak / XP logic, callable from tRPC procedures and from the cron
// dispatch job (packages/jobs), which has no tRPC context.
//
// The streak itself is advanced by ONE database function,
// record_qualifying_action() (migration 20260814000020). It is atomic and
// idempotent per local day, which the previous TypeScript version (a
// read-then-insert across several statements) was not: two concurrent
// requests could both pass the "already qualified today?" check and double
// count. The function reads the creator's time zone, so "today" is their
// local day rather than always Lagos.
//
// Product direction (October 2026): a gentle daily check-in. Missing a day
// quietly starts a new run — no freezes, no countdowns, no loss states — so the
// old Jarvis "worried / devastated / heartbroken" emotion ladder is gone.

// ─── XP / Leveling ──────────────────────────────────────────────────────────
// The app shows level / xp / nextLevelXp throughout. Rather than a parallel XP
// ledger, this reuses the `credits` table (an append-only earn/redeem ledger)
// as the single source of truth: xp = sum(earn) - sum(redeem). Every gamified
// action that awards XP inserts a `credits` row.

const XP_PER_LEVEL = 250;

export function levelForXp(xp: number): { level: number; nextLevelXp: number } {
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  return { level, nextLevelXp: level * XP_PER_LEVEL };
}

/**
 * Awards XP. Always written with the service role: `credits` is a ledger, so
 * creators must not be able to write it (see migration …21_rls_hardening).
 */
export async function awardXp(
  userId: string,
  amount: number,
  source: string,
  description?: string,
): Promise<void> {
  if (amount <= 0) return;
  const { error } = await getServiceClient().from("credits").insert({
    user_id: userId,
    type: "earn",
    amount,
    source,
    description: description ?? source,
  });
  if (error) {
    // An XP award must never fail the action that triggered it.
    console.error(`awardXp failed (${source}):`, error.message);
  }
}

export async function getXpBalance(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase.from("credits").select("type, amount").eq("user_id", userId);
  return (data ?? []).reduce(
    (sum: number, r: { type: string; amount: number }) =>
      r.type === "earn" ? sum + r.amount : sum - r.amount,
    0,
  );
}

// ─── Streak ─────────────────────────────────────────────────────────────────

export type StreakEventType =
  | "check_in"
  | "publish"
  | "mission_completion"
  | "collaboration_completion";

export type RecordStreakEventResult =
  /** `already_qualified_today` is normal; `error` means nothing was saved. */
  | { qualified: false; reason: "already_qualified_today" | "error" }
  | { qualified: true; newStreak: number; longestStreak: number; isMilestone: boolean };

type RecordFunctionResult = {
  qualified: boolean;
  reason?: string;
  current_streak: number;
  longest_streak: number;
  is_milestone?: boolean;
};

/**
 * Record a qualifying action (check-in, publish, mission, collaboration) for a
 * user's local today. Idempotent per local day: a second call the same day is
 * a no-op that reports `qualified: false`.
 *
 * Never throws — a streak update must never fail the action that triggered it
 * (a publish, a mission completion). Failures come back as
 * `{ qualified: false, reason: "error" }`.
 */
export async function recordStreakEvent(
  userId: string,
  eventType: StreakEventType,
  metadata?: Record<string, unknown>,
): Promise<RecordStreakEventResult> {
  const { data, error } = await getServiceClient().rpc("record_qualifying_action", {
    p_user_id: userId,
    p_event_type: eventType,
    p_metadata: metadata ?? {},
  });

  if (error || !data) {
    console.error("recordStreakEvent failed:", error?.message);
    return { qualified: false, reason: "error" };
  }

  const result = data as RecordFunctionResult;
  if (!result.qualified) {
    return { qualified: false, reason: "already_qualified_today" };
  }
  return {
    qualified: true,
    newStreak: result.current_streak,
    longestStreak: result.longest_streak,
    isMilestone: result.is_milestone ?? false,
  };
}

export type CheckInSummary = {
  /** Consecutive days checked in, counting today if already checked in. */
  currentDays: number;
  /** This week, Monday → Sunday. true = checked in that day. */
  week: boolean[];
  /** Index of the creator's local today within `week` (0 = Monday). */
  todayIndex: number;
  checkedInToday: boolean;
  longestDays: number;
  /** The creator's local date, YYYY-MM-DD. */
  localDate: string;
};

/** The streak as Home / Quests show it, computed from the check-in log. */
export async function getCheckInSummary(userId: string): Promise<CheckInSummary> {
  const { data, error } = await getServiceClient().rpc("get_check_in_summary", {
    p_user_id: userId,
  });
  if (error || !data) {
    throw new Error(`get_check_in_summary failed: ${error?.message ?? "no data"}`);
  }
  return data as CheckInSummary;
}
