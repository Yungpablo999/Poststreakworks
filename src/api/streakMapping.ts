import type { CheckInStreak } from '../data';

// Pure mapping from the backend's `user_streaks` row to what the check-in card shows.
//
// What the backend counts (poststreak-web src/lib/streak.ts): a streak day is a day with a
// PUBLISHED post, not a check-in. `last_post_date` is the last such day, in WAT (Africa/Lagos),
// and `current_streak` is the run of consecutive days ending there. The stored number goes
// stale if no post happens: the backend only resets it on the next post, so a run whose
// last day is before yesterday is shown as 0 here.

export const STREAK_COLUMNS = 'current_streak, longest_streak, last_post_date, total_posts';

export interface StreakRow {
  current_streak: number | null;
  longest_streak: number | null;
  last_post_date: string | null;
  total_posts: number | null;
}

export interface StreakSnapshot extends CheckInStreak {
  longestDays: number;
  totalPosts: number;
  /** The WAT date (YYYY-MM-DD) this snapshot is for */
  today: string;
}

/** A date as the backend counts it: YYYY-MM-DD in Africa/Lagos */
export function watDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(now);
}

const toUtc = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (ymd: string, n: number) => fromUtc(toUtc(ymd) + n * 86400000);
const mondayFirst = (ymd: string) => (new Date(toUtc(ymd)).getUTCDay() + 6) % 7;

const count = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export function mapStreakRow(row: StreakRow | null, now: Date = new Date()): StreakSnapshot {
  const today = watDate(now);
  const todayIndex = mondayFirst(today);
  const last = row?.last_post_date ? row.last_post_date.slice(0, 10) : null;
  const postedToday = last === today;
  const live = last !== null && (postedToday || last === addDays(today, -1));
  const currentDays = live ? count(row?.current_streak) : 0;

  const monday = addDays(today, -todayIndex);
  const week = Array.from({ length: 7 }, (_, i) => {
    if (!live || currentDays === 0 || !last) return false;
    const day = addDays(monday, i);
    return day <= last && day > addDays(last, -currentDays);
  });

  return {
    currentDays,
    week,
    todayIndex,
    checkedInToday: postedToday,
    countedToday: postedToday,
    longestDays: Math.max(count(row?.longest_streak), currentDays),
    totalPosts: count(row?.total_posts),
    today,
  };
}
