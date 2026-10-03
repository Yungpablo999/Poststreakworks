import { PROVIDER_NAMES, isProviderId, type ProviderId } from "@poststreak/integrations";
import { addDays, buildAccountSnapshot, formatCompactCount, hourGap, localParts, safeTimezone } from "./growth";

// What the Growth screens show, worked out from what the connected accounts have really told us:
// a follower count for each account each day (account_stats), and every post's own numbers as of
// the last sync (post_stats). Pure: no database, no clock of its own, so growth-overview.test.ts
// can pin every rule.
//
// Honesty rules the screens rely on:
//   - A number we don't have is null, never a zero or a guess. "Followers up 5%" needs a follower
//     count from that long ago; before that, the answer is "tracking since <day>".
//   - Post numbers are lifetime totals as of the last sync, so "views" are views on posts published in
//     a period, not views that happened in that period. The screens say so.
//   - Comparisons ("42% more than your usual") are made against the same account's other posts, and
//     only when there are enough of them to mean something.
//   - Nothing here needs a number the platforms don't give (watch time, profile visits, age, places).

export type ConnectionInput = {
  platform: string;
  accountName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  status: "connected" | "needs_reauth" | "error";
  lastSyncedAt: Date | null;
};
export type SnapshotInput = { platform: string; day: string; followers: number | null };
export type PostInput = {
  platform: string;
  id: string;
  title: string;
  postedAt: Date | null;
  coverUrl: string | null;
  shareUrl: string | null;
  durationSeconds: number | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number | null;
};

export type PostPerf = {
  /** `${platform}:${id}`, the address of this post in the API. */
  key: string;
  platform: ProviderId;
  platformName: string;
  title: string;
  postedAt: string | null;
  coverUrl: string | null;
  shareUrl: string | null;
  durationSeconds: number | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number | null;
  /** Against this account's other posts of the last 90 days; null with fewer than 3 others. */
  comparison: { averageViews: number; percent: number } | null;
  /** (likes + comments + shares) / views; null without views. */
  engagementRate: number | null;
  /** Plain statements that are true of this post (compared with the account's other posts). */
  insights: string[];
};

export type PlatformGrowth = {
  platform: ProviderId;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  status: ConnectionInput["status"];
  lastSyncedAt: string | null;
  followers: number | null;
  /** Followers gained (or lost) over the last 7 / 30 days; null until there is that much history. */
  change7: number | null;
  change30: number | null;
  /** The first day we have a follower count for. */
  trackedSince: string | null;
  /** This account's followers per day, today and the 30 days before it (from the first day it was tracked). */
  series: { day: string; followers: number }[];
  posts30: number;
  views30: number;
  avgViews30: number | null;
  likes30: number;
  comments30: number;
  shares30: number;
  postsTotal: number;
  /** This account's newest posts (at most five). */
  recentPosts: PostPerf[];
};

export type Milestone = { platform: ProviderId; label: string; current: number; target: number; ratio: number; note: string };

export type GrowthOverview = {
  /** Any connected account at all. */
  hasAccounts: boolean;
  /** Any follower count or post has been read yet. */
  hasData: boolean;
  /** Accounts that work, and the ones that need the creator to approve again. */
  connected: number;
  needsReconnect: ProviderId[];
  /** When the numbers were last refreshed (the most recent sync). */
  updatedAt: string | null;
  totals: {
    followers: number | null;
    change7: number | null;
    change30: number | null;
    /** true: not every account has that much history, so the change covers only those that do. */
    partial: boolean;
    posts30: number;
    postsPrev30: number;
    views30: number;
    likes30: number;
    comments30: number;
    shares30: number;
  };
  platforms: PlatformGrowth[];
  /** Total followers per day, today and the 30 days before it (so the first and last points are exactly "30 days apart"), from the first day every account was tracked. */
  series: { day: string; followers: number }[];
  /** New followers per month, newest last (at most six). */
  months: { month: string; gain: number }[];
  bestPost: PostPerf | null;
  /** Newest first. */
  recentPosts: PostPerf[];
  /** The hour of day their posts do best across accounts (needs a few posts). */
  bestTime: { label: string; hour: number; postsAtBestTime: number } | null;
  week: { followersChange: number | null; postsThisWeek: number; postsLastWeek: number };
  milestones: Milestone[];
};

// ─── Small helpers ──────────────────────────────────────────────────────────

const FOLLOWER_MILESTONES = [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];
const MIN_OTHERS_FOR_COMPARISON = 3;
const COMPARISON_DAYS = 90;
const RECENT_POSTS = 8;
const PLATFORM_POSTS = 5;
const MONTHS_SHOWN = 6;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const isConnectable = (platform: string): platform is ProviderId => isProviderId(platform);

type Dated<T> = T & { day: string };

/** Last value on or before `day` in an ascending list, or null if the list starts later. */
function followersOnOrBefore(series: { day: string; followers: number }[], day: string): number | null {
  let found: number | null = null;
  for (const point of series) {
    if (point.day > day) break;
    found = point.followers;
  }
  return found;
}

/** One reading per day for the last `days` days, carried forward over days nothing was read, from the first reading on. */
function dailySeries(series: { day: string; followers: number }[], today: string, days: number): { day: string; followers: number }[] {
  const out: { day: string; followers: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const followers = followersOnOrBefore(series, day);
    if (followers !== null) out.push({ day, followers });
  }
  return out;
}

/** The change between the latest reading and the one `days` days before it (the same rule Home uses). */
function changeOver(series: { day: string; followers: number }[], days: number): number | null {
  const latest = series[series.length - 1];
  if (!latest) return null;
  const before = followersOnOrBefore(series, addDays(latest.day, -days));
  return before === null ? null : latest.followers - before;
}

const groupBy = <T>(rows: T[], key: (row: T) => string): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
};

// ─── One post ───────────────────────────────────────────────────────────────

function perfOf(post: Dated<PostInput> & { platform: ProviderId }, others: Dated<PostInput>[], bestHour: number | null, timeZone: string, bestTimeLabel: string | null): PostPerf {
  const reference = others.filter((o) => o.id !== post.id);
  const enough = reference.length >= MIN_OTHERS_FOR_COMPARISON;
  const avgViews = enough ? sum(reference.map((o) => o.views)) / reference.length : null;
  const percent = avgViews !== null && avgViews > 0 ? Math.round((post.views / avgViews - 1) * 100) : null;
  const rate = (p: { views: number; likes: number; comments: number; shares: number }) => (p.views > 0 ? (p.likes + p.comments + p.shares) / p.views : null);
  const engagement = rate(post);

  const insights: string[] = [];
  if (enough && avgViews !== null && avgViews > 0) {
    const ratio = post.views / avgViews;
    const name = PROVIDER_NAMES[post.platform];
    if (ratio >= 2) insights.push(`Got ${String(Math.round(ratio * 10) / 10)}× the views of your usual ${name} post.`);
    else if (ratio >= 1.25) insights.push(`Got ${Math.round((ratio - 1) * 100)}% more views than your usual ${name} post.`);
    const otherRates = reference.map(rate).filter((r): r is number => r !== null);
    if (engagement !== null && otherRates.length >= MIN_OTHERS_FOR_COMPARISON) {
      const avgRate = sum(otherRates) / otherRates.length;
      if (avgRate > 0 && engagement >= avgRate * 1.25) insights.push("People reacted more than usual: more likes, comments and shares for every view.");
    }
    const withShares = reference.filter((o) => o.views > 0);
    const avgShareRate = withShares.length >= MIN_OTHERS_FOR_COMPARISON ? sum(withShares.map((o) => o.shares / o.views)) / withShares.length : null;
    if (avgShareRate !== null && avgShareRate > 0 && post.views > 0 && post.shares / post.views >= avgShareRate * 1.5) insights.push("It was shared more than your usual posts.");
    const avgCommentRate = withShares.length >= MIN_OTHERS_FOR_COMPARISON ? sum(withShares.map((o) => o.comments / o.views)) / withShares.length : null;
    if (avgCommentRate !== null && avgCommentRate > 0 && post.views > 0 && post.comments / post.views >= avgCommentRate * 1.5) insights.push("It got more comments than usual, so people had something to say.");
  }
  if (post.postedAt && bestHour !== null && bestTimeLabel) {
    const hour = localParts(post.postedAt, timeZone).hour;
    if (hourGap(hour, bestHour) <= 1) insights.push(`You posted around ${bestTimeLabel}, when your posts do best.`);
  }

  return {
    key: `${post.platform}:${post.id}`,
    platform: post.platform,
    platformName: PROVIDER_NAMES[post.platform],
    title: post.title,
    postedAt: post.postedAt ? post.postedAt.toISOString() : null,
    coverUrl: post.coverUrl,
    shareUrl: post.shareUrl,
    durationSeconds: post.durationSeconds,
    views: post.views,
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    saves: post.saves,
    comparison: avgViews !== null && percent !== null ? { averageViews: Math.round(avgViews), percent } : null,
    engagementRate: engagement,
    insights,
  };
}

// ─── The whole picture ──────────────────────────────────────────────────────

export function buildGrowthOverview(input: {
  connections: ConnectionInput[];
  snapshots: SnapshotInput[];
  posts: PostInput[];
  timezone: string;
  now: Date;
}): GrowthOverview {
  const timeZone = safeTimezone(input.timezone);
  const today = localParts(input.now, timeZone).day;
  const connections = input.connections.filter((c): c is ConnectionInput & { platform: ProviderId } => isConnectable(c.platform));
  const platformsOn = new Set(connections.map((c) => c.platform));

  const snapshotsBy = groupBy(
    input.snapshots.filter((s) => platformsOn.has(s.platform as ProviderId) && s.followers !== null) as { platform: string; day: string; followers: number }[],
    (s) => s.platform,
  );
  for (const list of snapshotsBy.values()) list.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));

  const posts: Dated<PostInput & { platform: ProviderId }>[] = input.posts
    .filter((p): p is PostInput & { platform: ProviderId } => platformsOn.has(p.platform as ProviderId))
    .map((p) => ({ ...p, day: p.postedAt ? localParts(p.postedAt, timeZone).day : "" }));
  const dated = posts.filter((p) => p.postedAt !== null);
  const postsBy = groupBy(posts, (p) => p.platform);

  const start30 = addDays(today, -29);
  const startPrev30 = addDays(today, -59);
  const inWindow = (p: Dated<PostInput>, from: string, to: string) => p.postedAt !== null && p.day >= from && p.day <= to;

  // Each account
  const platforms: PlatformGrowth[] = connections.map((c) => {
    const series = snapshotsBy.get(c.platform) ?? [];
    const mine = postsBy.get(c.platform) ?? [];
    const recent = mine.filter((p) => inWindow(p, start30, today));
    const views30 = sum(recent.map((p) => p.views));
    return {
      platform: c.platform,
      name: c.accountName,
      handle: c.handle,
      avatarUrl: c.avatarUrl,
      status: c.status,
      lastSyncedAt: c.lastSyncedAt ? c.lastSyncedAt.toISOString() : null,
      followers: series.length ? series[series.length - 1]!.followers : null,
      change7: changeOver(series, 7),
      change30: changeOver(series, 30),
      trackedSince: series[0]?.day ?? null,
      series: dailySeries(series, today, 31),
      posts30: recent.length,
      views30,
      avgViews30: recent.length ? Math.round(views30 / recent.length) : null,
      likes30: sum(recent.map((p) => p.likes)),
      comments30: sum(recent.map((p) => p.comments)),
      shares30: sum(recent.map((p) => p.shares)),
      postsTotal: mine.length,
      recentPosts: [], // filled in below, once posts can be put in context
    };
  });

  // Totals
  const withFollowers = platforms.filter((p) => p.followers !== null);
  const change = (pick: (p: PlatformGrowth) => number | null) => {
    const known = withFollowers.map(pick).filter((x): x is number => x !== null);
    return { value: known.length ? sum(known) : null, partial: known.length > 0 && known.length < withFollowers.length };
  };
  const c7 = change((p) => p.change7);
  const c30 = change((p) => p.change30);

  // Total followers per day: only from the first day every account with a count was being tracked
  const tracked = [...snapshotsBy.entries()];
  const firstAll = tracked.length ? tracked.map(([, list]) => list[0]!.day).reduce((a, b) => (a > b ? a : b)) : null;
  const series: { day: string; followers: number }[] = [];
  if (firstAll) {
    for (let i = 30; i >= 0; i--) {
      const day = addDays(today, -i);
      if (day < firstAll) continue;
      series.push({ day, followers: sum(tracked.map(([, list]) => followersOnOrBefore(list, day) ?? 0)) });
    }
  }

  // Month by month: the gain between the last count of the month before and the last of this one
  const monthGain = new Map<string, number>();
  for (const [, list] of tracked) {
    const byMonth = groupBy(list, (s) => s.day.slice(0, 7));
    let previousEnd: number | null = null;
    for (const month of [...byMonth.keys()].sort()) {
      const points = byMonth.get(month)!;
      const end = points[points.length - 1]!.followers;
      const baseline = previousEnd ?? points[0]!.followers;
      monthGain.set(month, (monthGain.get(month) ?? 0) + (end - baseline));
      previousEnd = end;
    }
  }
  const months = [...monthGain.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-MONTHS_SHOWN)
    .map(([month, gain]) => ({ month, gain }));

  // Best time, across accounts: each post counts relative to its own account's average, so a big account doesn't drown a small one
  const averageByPlatform = new Map<string, number>();
  for (const [platform, list] of postsBy) {
    const withViews = list.filter((p) => p.postedAt);
    if (withViews.length) averageByPlatform.set(platform, sum(withViews.map((p) => p.views)) / withViews.length);
  }
  const found = buildAccountSnapshot({
    platform: "all",
    posts: dated.map((p) => {
      const avg = averageByPlatform.get(p.platform) ?? 0;
      return { postedAt: p.postedAt, views: avg > 0 ? (p.views / avg) * 100 : 0 };
    }),
    timezone: input.timezone,
    now: input.now,
    topFormat: "",
  });
  // One lucky post doesn't make a best time: it takes at least two near that hour
  const snapshot = found && found.postsAtBestTime >= 2 ? found : null;
  const bestHour = snapshot ? snapshot.bestHour : null;

  // Posts in context
  const ninetyAgo = addDays(today, -(COMPARISON_DAYS - 1));
  const perf = (post: Dated<PostInput & { platform: ProviderId }>): PostPerf => {
    const peers = (postsBy.get(post.platform) ?? []).filter((o) => o.postedAt !== null && o.day >= ninetyAgo) as Dated<PostInput>[];
    return perfOf(post, peers, bestHour, timeZone, snapshot?.bestTime ?? null);
  };
  const newestFirst = [...dated].sort((a, b) => b.postedAt!.getTime() - a.postedAt!.getTime());
  for (const p of platforms) {
    p.recentPosts = newestFirst.filter((x) => x.platform === p.platform).slice(0, PLATFORM_POSTS).map(perf);
  }
  const pool = (() => {
    const last30 = dated.filter((p) => inWindow(p, start30, today));
    if (last30.length) return last30;
    const last90 = dated.filter((p) => inWindow(p, ninetyAgo, today));
    return last90.length ? last90 : dated;
  })();
  const best = [...pool].sort((a, b) => b.views - a.views || b.postedAt!.getTime() - a.postedAt!.getTime())[0];

  // The week
  const weekStart = addDays(today, -6);
  const lastWeekStart = addDays(today, -13);
  const lastWeekEnd = addDays(today, -7);

  // Milestones: the next round number for each account, the closest ones first
  const milestones: Milestone[] = withFollowers
    .map((p): Milestone | null => {
      const followers = p.followers!;
      const target = FOLLOWER_MILESTONES.find((m) => m > followers);
      if (!target) return null;
      return {
        platform: p.platform,
        label: `${formatCompactCount(target)} followers on ${PROVIDER_NAMES[p.platform]}`,
        current: followers,
        target,
        ratio: followers / target,
        note: `${formatCompactCount(followers)} now · ${formatCompactCount(target - followers)} to go`,
      };
    })
    .filter((m): m is Milestone => m !== null)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 2);

  const synced = connections.map((c) => c.lastSyncedAt).filter((d): d is Date => d !== null);
  const totalFollowers = withFollowers.length ? sum(withFollowers.map((p) => p.followers!)) : null;

  return {
    hasAccounts: connections.length > 0,
    hasData: input.snapshots.some((s) => s.followers !== null && platformsOn.has(s.platform as ProviderId)) || posts.length > 0,
    connected: connections.filter((c) => c.status !== "needs_reauth").length,
    needsReconnect: connections.filter((c) => c.status === "needs_reauth").map((c) => c.platform),
    updatedAt: synced.length ? new Date(Math.max(...synced.map((d) => d.getTime()))).toISOString() : null,
    totals: {
      followers: totalFollowers,
      change7: c7.value,
      change30: c30.value,
      partial: c7.partial || c30.partial,
      posts30: sum(platforms.map((p) => p.posts30)),
      postsPrev30: dated.filter((p) => inWindow(p, startPrev30, addDays(today, -30))).length,
      views30: sum(platforms.map((p) => p.views30)),
      likes30: sum(platforms.map((p) => p.likes30)),
      comments30: sum(platforms.map((p) => p.comments30)),
      shares30: sum(platforms.map((p) => p.shares30)),
    },
    platforms,
    series,
    months,
    bestPost: best ? perf(best) : null,
    recentPosts: newestFirst.slice(0, RECENT_POSTS).map(perf),
    bestTime: snapshot ? { label: snapshot.bestTime, hour: snapshot.bestHour, postsAtBestTime: snapshot.postsAtBestTime } : null,
    week: {
      followersChange: c7.value,
      postsThisWeek: dated.filter((p) => inWindow(p, weekStart, today)).length,
      postsLastWeek: dated.filter((p) => inWindow(p, lastWeekStart, lastWeekEnd)).length,
    },
    milestones,
  };
}

/** One post by its key (`tiktok:7012…`), with the same comparisons the overview makes. */
export function findPostPerf(input: {
  key: string;
  connections: ConnectionInput[];
  posts: PostInput[];
  timezone: string;
  now: Date;
}): PostPerf | null {
  const overview = buildGrowthOverview({ connections: input.connections, snapshots: [], posts: input.posts, timezone: input.timezone, now: input.now });
  const separator = input.key.indexOf(":");
  if (separator < 1) return null;
  const platform = input.key.slice(0, separator);
  const id = input.key.slice(separator + 1);
  if (!isConnectable(platform)) return null;
  const known = [overview.bestPost, ...overview.recentPosts].find((p) => p?.key === input.key);
  if (known) return known;
  const timeZone = safeTimezone(input.timezone);
  const post = input.posts.find((p) => p.platform === platform && p.id === id);
  if (!post) return null;
  const today = localParts(input.now, timeZone).day;
  const ninetyAgo = addDays(today, -(COMPARISON_DAYS - 1));
  const withDay = (p: PostInput): Dated<PostInput> => ({ ...p, day: p.postedAt ? localParts(p.postedAt, timeZone).day : "" });
  const peers = input.posts.filter((p) => p.platform === platform && p.postedAt).map(withDay).filter((p) => p.day >= ninetyAgo);
  return perfOf({ ...withDay(post), platform }, peers, overview.bestTime?.hour ?? null, timeZone, overview.bestTime?.label ?? null);
}
