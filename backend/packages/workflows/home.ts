import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./service-client";
import { buildAccountSnapshot } from "./growth";
import type { Place, QuestFacts } from "./quests";

// What Home shows for a creator who has been posting: the next post, how the week looks, how
// the audience moved, and (Pro) today's brief. Every figure is read from their own rows; a
// figure there is nothing to show for (no account connected, no posts yet) comes back null so
// the app leaves the row out instead of inventing a number.

const DAY_MS = 86_400_000;

export type NextPost = { id: string; at: string; platforms: string[]; title: string };

export type AudienceSummary = {
  followers: number;
  /** Followers gained (or lost) over the last 7 days, when there is a reading that old. */
  delta7d: number | null;
  platforms: number;
};

export type BriefStep = {
  id: "hook" | "film" | "post";
  title: string;
  body: string;
  action: { label: string; place: Place } | null;
  /** Ticked by what the creator has really done today. */
  done: boolean;
};

export type Brief = { lead: string; steps: BriefStep[] };

export type HomeSummary = {
  nextPost: NextPost | null;
  /** Posts that were due and are waiting for the creator to confirm they went out. */
  waiting: number;
  /** Posts planned or published in the creator's current week. */
  weekPlanned: number;
  audience: AudienceSummary | null;
};

const firstLine = (text: string, max = 60): string => {
  const line = text.split("\n")[0]?.trim() ?? "";
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line || "Untitled post";
};

/** Followers now, and how they moved over the week, from the daily account readings. */
export async function audienceSummary(userId: string, db: SupabaseClient, now: Date = new Date()): Promise<AudienceSummary | null> {
  const since = new Date(now.getTime() - 40 * DAY_MS).toISOString().slice(0, 10);
  const { data, error } = await db
    .from("account_stats")
    .select("platform, day, followers")
    .eq("user_id", userId)
    .gte("day", since)
    .not("followers", "is", null)
    .order("day", { ascending: false });
  if (error) throw new Error(`audienceSummary: ${error.message}`);

  const byPlatform = new Map<string, { day: string; followers: number }[]>();
  for (const row of (data ?? []) as { platform: string; day: string; followers: number | string }[]) {
    const list = byPlatform.get(row.platform) ?? [];
    list.push({ day: row.day, followers: Number(row.followers) });
    byPlatform.set(row.platform, list);
  }
  if (byPlatform.size === 0) return null;

  let followers = 0;
  let delta = 0;
  let hasDelta = false;
  for (const readings of byPlatform.values()) {
    const latest = readings[0];
    if (!latest) continue;
    followers += latest.followers;
    // the newest reading that is at least a week older than the latest one
    const cutoff = new Date(Date.parse(`${latest.day}T00:00:00Z`) - 7 * DAY_MS).toISOString().slice(0, 10);
    const weekAgo = readings.find((r) => r.day <= cutoff);
    if (weekAgo) {
      delta += latest.followers - weekAgo.followers;
      hasDelta = true;
    }
  }
  return { followers, delta7d: hasDelta ? delta : null, platforms: byPlatform.size };
}

export async function getHomeSummary(userId: string, facts: QuestFacts, db: SupabaseClient = getServiceClient(), now: Date = new Date()): Promise<HomeSummary> {
  const weekStart = new Date(facts.weekStartAt);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

  const [nextRes, waitingRes, weekRes, audience] = await Promise.all([
    db
      .from("scheduled_posts")
      .select("id, content, target_platforms, scheduled_at")
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    db.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending_confirmation"),
    db
      .from("scheduled_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["scheduled", "publishing", "pending_confirmation", "published"])
      .gte("scheduled_at", weekStart.toISOString())
      .lt("scheduled_at", weekEnd.toISOString()),
    audienceSummary(userId, db, now),
  ]);
  if (nextRes.error) throw new Error(`getHomeSummary next: ${nextRes.error.message}`);

  const next = nextRes.data as { id: string; content: string; target_platforms: string[]; scheduled_at: string } | null;
  return {
    nextPost: next ? { id: next.id, at: next.scheduled_at, platforms: next.target_platforms, title: firstLine(next.content) } : null,
    waiting: waitingRes.count ?? 0,
    weekPlanned: weekRes.count ?? 0,
    audience,
  };
}

// ─── Pro: today's brief ─────────────────────────────────────────────────────

const PLATFORM_NAME: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", facebook: "Facebook", threads: "Threads" };

const compact = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K` : String(Math.round(n)));

/**
 * The brief is arithmetic over the creator's own posts, not a guess: the platform their posts do
 * best on, and the hour they do best at (only once there are enough posts to say). A step ticks
 * itself when the creator does the thing.
 */
export async function getBrief(
  userId: string,
  facts: QuestFacts,
  timezone: string,
  db: SupabaseClient = getServiceClient(),
  now: Date = new Date(),
): Promise<Brief> {
  const since = new Date(now.getTime() - 30 * DAY_MS).toISOString();
  const { data, error } = await db
    .from("post_stats")
    .select("platform, posted_at, views")
    .eq("user_id", userId)
    .gte("posted_at", since)
    .order("posted_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`getBrief: ${error.message}`);

  const posts = (data ?? []) as { platform: string; posted_at: string; views: number | string }[];
  const byPlatform = new Map<string, { n: number; views: number }>();
  for (const p of posts) {
    const agg = byPlatform.get(p.platform) ?? { n: 0, views: 0 };
    agg.n += 1;
    agg.views += Number(p.views);
    byPlatform.set(p.platform, agg);
  }
  const top = [...byPlatform.entries()].sort((a, b) => b[1].views / b[1].n - a[1].views / a[1].n)[0];

  // best time on the platform with the most posts (needs enough posts to be meaningful)
  const busiest = [...byPlatform.entries()].sort((a, b) => b[1].n - a[1].n)[0];
  const snapshot = busiest
    ? buildAccountSnapshot({
        platform: busiest[0],
        posts: posts.filter((p) => p.platform === busiest[0]).map((p) => ({ postedAt: new Date(p.posted_at), views: Number(p.views) })),
        timezone,
        now,
        topFormat: "Short videos",
      })
    : null;

  const topName = top ? PLATFORM_NAME[top[0]] ?? top[0] : null;
  const filmBody =
    top && topName
      ? `About 30 seconds. ${topName} first: your posts there average ${compact(top[1].views / top[1].n)} views.`
      : "About 30 seconds, talking to camera.";

  const made = facts.postDraftsToday + facts.scheduledToday + facts.postsToday > 0;
  return {
    lead: snapshot ? `Your best move today: one short video, posted around ${snapshot.bestTime}.` : "Your best move today: one short video.",
    steps: [
      {
        id: "hook",
        title: "Start with the hook",
        body: "The first line decides whether people keep watching. Write a few and keep the best.",
        action: { label: "Write the hook", place: "hook-studio" },
        done: facts.hooksToday > 0,
      },
      { id: "film", title: "Film one short video", body: filmBody, action: { label: "Plan it", place: "composer" }, done: made },
      snapshot
        ? { id: "post", title: `Post around ${snapshot.bestTime}`, body: "When your posts have done best.", action: null, done: facts.postsToday > 0 }
        : { id: "post", title: "Post it", body: "Whenever suits you. One post keeps your rhythm going.", action: null, done: facts.postsToday > 0 },
    ],
  };
}
