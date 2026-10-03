// Turns a creator's synced posts into the "account snapshot" the app shows
// (onboarding's "Your account" card, and the start of Growth): how often they
// post, how it's going, and when their posts do best.
//
// Pure — no database, no clock of its own — so it is tested thoroughly in
// growth.test.ts. The shape is `AccountSnapshot` from src/data/index.ts, with
// `isSample: false`.
//
// Everything is in the CREATOR's time zone: a 23:30 UTC post is "tomorrow
// morning" to a creator in Lagos, and "best time" must be a time they recognise.

export type PostForSnapshot = { postedAt: Date | null; views: number };

export type AccountSnapshot = {
  platform: string;
  isSample: false;
  /** Days with at least one post in the last 30 days. */
  postingDaysLast30: number;
  /** Which of the last 30 days had a post (index 0 = 29 days ago, index 29 = today). */
  postedDays: boolean[];
  /** Average views of the last 30 days' posts, e.g. "1.2K". */
  avgViews: string;
  /** The hour their posts do best, e.g. "7 PM". */
  bestTime: string;
  /** The same hour as a number, 0–23. */
  bestHour: number;
  /** How many of the last 30 days' posts went out within an hour of that time. */
  postsAtBestTime: number;
  recentPosts: number;
  topFormat: string;
};

/** Below this many posts there isn't enough to say when someone's best time is. */
export const MIN_POSTS_FOR_SNAPSHOT = 3;
const WINDOW_DAYS = 30;
const BEST_TIME_LOOKBACK_DAYS = 90;
const FALLBACK_TIMEZONE = "Africa/Lagos";

/** 1234 -> "1.2K", 15000 -> "15K", 1_500_000 -> "1.5M", 640 -> "640". */
export function formatCompactCount(n: number): string {
  const value = Math.max(0, Math.round(n));
  const compact = (divisor: number, suffix: string) => {
    const scaled = value / divisor;
    return `${scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10}${suffix}`.replace(/\.0(?=[KM])/, "");
  };
  if (value >= 1_000_000) return compact(1_000_000, "M");
  if (value >= 1_000) return compact(1_000, "K");
  return String(value);
}

/** 0 -> "12 AM", 13 -> "1 PM". */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

export function safeTimezone(zone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** The creator's calendar date (YYYY-MM-DD) and hour (0–23) for an instant. */
export function localParts(date: Date, timeZone: string): { day: string; hour: number } {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const hourText = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" })
    .formatToParts(date)
    .find((p) => p.type === "hour")?.value;
  return { day, hour: Number(hourText) % 24 };
}

export function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Circular distance between two hours of the day. */
export const hourGap = (a: number, b: number) => Math.min(Math.abs(a - b), 24 - Math.abs(a - b));

export function buildAccountSnapshot(input: {
  platform: string;
  posts: PostForSnapshot[];
  timezone: string;
  now: Date;
  topFormat: string;
}): AccountSnapshot | null {
  const timeZone = safeTimezone(input.timezone);
  const dated = input.posts
    .filter((p): p is { postedAt: Date; views: number } => p.postedAt instanceof Date && !Number.isNaN(p.postedAt.getTime()))
    .map((p) => ({ ...localParts(p.postedAt, timeZone), views: p.views }));
  if (dated.length < MIN_POSTS_FOR_SNAPSHOT) return null;

  const today = localParts(input.now, timeZone).day;
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, i - (WINDOW_DAYS - 1)));
  const windowStart = days[0]!;
  const bestTimeStart = addDays(today, -(BEST_TIME_LOOKBACK_DAYS - 1));

  const recent = dated.filter((p) => p.day >= windowStart && p.day <= today);
  const postedOn = new Set(recent.map((p) => p.day));
  const postedDays = days.map((d) => postedOn.has(d));

  const avgViews = recent.length > 0 ? recent.reduce((sum, p) => sum + p.views, 0) / recent.length : 0;

  // Best hour: highest average views. With enough data ignore hours that have a
  // single post, so one lucky video doesn't decide it.
  const byHour = new Map<number, { count: number; views: number }>();
  for (const p of dated.filter((p) => p.day >= bestTimeStart && p.day <= today)) {
    const slot = byHour.get(p.hour) ?? { count: 0, views: 0 };
    slot.count++;
    slot.views += p.views;
    byHour.set(p.hour, slot);
  }
  const minPosts = [...byHour.values()].some((s) => s.count >= 2) ? 2 : 1;
  const ranked = [...byHour.entries()]
    .filter(([, s]) => s.count >= minPosts)
    .map(([hour, s]) => ({ hour, avg: s.views / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count || a.hour - b.hour);
  const bestHour = ranked[0]?.hour;
  if (bestHour === undefined) return null;

  return {
    platform: input.platform,
    isSample: false,
    postingDaysLast30: postedOn.size,
    postedDays,
    avgViews: formatCompactCount(avgViews),
    bestTime: formatHour(bestHour),
    bestHour,
    postsAtBestTime: recent.filter((p) => hourGap(p.hour, bestHour) <= 1).length,
    recentPosts: recent.length,
    topFormat: input.topFormat,
  };
}
