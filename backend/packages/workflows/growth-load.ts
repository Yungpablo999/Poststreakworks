import type { SupabaseClient } from "@supabase/supabase-js";
import { buildGrowthOverview, findPostPerf, type ConnectionInput, type GrowthOverview, type PostInput, type PostPerf, type SnapshotInput } from "./growth-overview";

// Reads what Growth needs from the database and hands it to the builders in growth-overview.ts.
// `db` is the CREATOR's own client, so row-level security means they can only ever read their own
// accounts and numbers.

const HISTORY_DAYS = 230; // seven months of follower counts: six months shown, plus the one before
const POST_LIMIT = 500;

const asDate = (value: unknown) => (typeof value === "string" ? new Date(value) : null);

function check(what: string, error: { message: string } | null): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

async function load(db: SupabaseClient, userId: string, now: Date) {
  const since = new Date(now.getTime() - HISTORY_DAYS * 86_400_000).toISOString().slice(0, 10);
  const [connections, snapshots, posts] = await Promise.all([
    db
      .from("platform_connections")
      .select("platform, account_name, account_handle, avatar_url, status, last_synced_at")
      .eq("user_id", userId)
      .is("disconnected_at", null)
      .not("account_name", "is", null),
    db.from("account_stats").select("platform, day, followers").eq("user_id", userId).gte("day", since).order("day", { ascending: true }),
    db
      .from("post_stats")
      .select("platform, platform_post_id, title, posted_at, cover_url, share_url, duration_seconds, views, likes, comments, shares, saves")
      .eq("user_id", userId)
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(POST_LIMIT),
  ]);
  check("growth connections", connections.error);
  check("growth snapshots", snapshots.error);
  check("growth posts", posts.error);

  return {
    connections: (connections.data ?? []).map(
      (c): ConnectionInput => ({
        platform: c.platform as string,
        accountName: c.account_name as string | null,
        handle: c.account_handle as string | null,
        avatarUrl: c.avatar_url as string | null,
        status: c.status as ConnectionInput["status"],
        lastSyncedAt: asDate(c.last_synced_at),
      }),
    ),
    snapshots: (snapshots.data ?? []).map(
      (s): SnapshotInput => ({ platform: s.platform as string, day: s.day as string, followers: s.followers === null ? null : Number(s.followers) }),
    ),
    posts: (posts.data ?? []).map(
      (p): PostInput => ({
        platform: p.platform as string,
        id: p.platform_post_id as string,
        title: (p.title as string) ?? "",
        postedAt: asDate(p.posted_at),
        coverUrl: p.cover_url as string | null,
        shareUrl: p.share_url as string | null,
        durationSeconds: p.duration_seconds === null ? null : Number(p.duration_seconds),
        views: Number(p.views),
        likes: Number(p.likes),
        comments: Number(p.comments),
        shares: Number(p.shares),
        saves: p.saves === null ? null : Number(p.saves),
      }),
    ),
  };
}

export async function getGrowthOverview(db: SupabaseClient, userId: string, timezone: string, now: Date = new Date()): Promise<GrowthOverview> {
  return buildGrowthOverview({ ...(await load(db, userId, now)), timezone, now });
}

export async function getPostPerformance(db: SupabaseClient, userId: string, key: string, timezone: string, now: Date = new Date()): Promise<PostPerf | null> {
  const { connections, posts } = await load(db, userId, now);
  return findPostPerf({ key, connections, posts, timezone, now });
}
