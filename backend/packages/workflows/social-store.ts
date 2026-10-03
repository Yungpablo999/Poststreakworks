import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderAccount, ProviderId, ProviderPost } from "@poststreak/integrations";
import {
  AccountInUseError,
  type ConnectionStatus,
  type NewConnection,
  type SocialStore,
  type StoredConnection,
  type TokenUpdate,
} from "./social-connect";
import { buildAccountSnapshot, type AccountSnapshot } from "./growth";

// The Supabase side of social-connect.ts. It is deliberately thin: the rules live in the
// orchestration (and are tested there), the guarantees live in the database (migrations …22
// and …24, tested in supabase/tests). This file only moves data.
//
// `db` must be the SERVICE-ROLE client for createSupabaseSocialStore — the connection, its
// tokens and every stat are written only by the server. Every query filters by user id
// explicitly, because the service role bypasses RLS.

const LOCK_MS = 2 * 60 * 1000;
const POST_CHUNK = 100;

const nowIso = () => new Date().toISOString();
const asDate = (value: unknown) => (typeof value === "string" ? new Date(value) : null);

function check(what: string, error: { message: string } | null): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export function createSupabaseSocialStore(db: SupabaseClient, platform: ProviderId): SocialStore {
  const mine = (userId: string) => ({ user_id: userId, platform });

  return {
    async createState(userId, state) {
      // Tidy this creator's expired states as we go, so the table doesn't grow.
      await db.from("oauth_states").delete().eq("user_id", userId).lt("expires_at", nowIso());
      const { error } = await db.from("oauth_states").insert({ state, user_id: userId, platform });
      check("createState", error);
    },

    async consumeState(userId, state) {
      // One statement: it either deletes the row (and we have it) or it doesn't — so a state
      // can never be used twice, even by two requests at once.
      const { data, error } = await db
        .from("oauth_states")
        .delete()
        .eq("state", state)
        .eq("user_id", userId)
        .eq("platform", platform)
        .gt("expires_at", nowIso())
        .select("state");
      check("consumeState", error);
      return (data?.length ?? 0) === 1;
    },

    async getConnection(userId): Promise<StoredConnection | null> {
      const { data, error } = await db
        .from("platform_connections")
        .select("platform_user_id, access_token, refresh_token, token_expires_at, refresh_token_expires_at, scopes, status, disconnected_at")
        .match(mine(userId))
        .maybeSingle();
      check("getConnection", error);
      if (!data) return null;
      return {
        platformUserId: data.platform_user_id as string | null,
        accessTokenSealed: data.access_token as string | null,
        refreshTokenSealed: data.refresh_token as string | null,
        tokenExpiresAt: asDate(data.token_expires_at),
        refreshTokenExpiresAt: asDate(data.refresh_token_expires_at),
        scopes: (data.scopes as string[] | null) ?? [],
        status: data.status as ConnectionStatus,
        disconnectedAt: asDate(data.disconnected_at),
      };
    },

    async saveConnection(userId, c: NewConnection) {
      const { error } = await db.from("platform_connections").upsert(
        {
          ...mine(userId),
          publish_mode: "assisted",
          platform_user_id: c.platformUserId,
          access_token: c.accessTokenSealed,
          refresh_token: c.refreshTokenSealed,
          token_expires_at: c.tokenExpiresAt?.toISOString() ?? null,
          refresh_token_expires_at: c.refreshTokenExpiresAt?.toISOString() ?? null,
          scopes: c.scopes,
          account_name: c.accountName,
          account_handle: c.accountHandle,
          avatar_url: c.avatarUrl,
          status: "connected",
          connected_at: nowIso(),
          disconnected_at: null,
          last_sync_error: null,
          sync_locked_until: null,
        },
        { onConflict: "user_id,platform" },
      );
      // 23505: uq_platform_connections_account — someone else has this account.
      if (error?.code === "23505") throw new AccountInUseError();
      check("saveConnection", error);
    },

    async updateTokens(userId, t: TokenUpdate) {
      const { error } = await db
        .from("platform_connections")
        .update({
          access_token: t.accessTokenSealed,
          refresh_token: t.refreshTokenSealed,
          token_expires_at: t.tokenExpiresAt?.toISOString() ?? null,
          refresh_token_expires_at: t.refreshTokenExpiresAt?.toISOString() ?? null,
          scopes: t.scopes,
        })
        .match(mine(userId));
      check("updateTokens", error);
    },

    async updateAccount(userId, account) {
      const { error } = await db
        .from("platform_connections")
        .update({ account_name: account.name, account_handle: account.handle, avatar_url: account.avatarUrl })
        .match(mine(userId));
      check("updateAccount", error);
    },

    async tryLock(userId) {
      const now = new Date();
      // Take the lock only if nobody holds it (or it has run out) — in one statement.
      const { data, error } = await db
        .from("platform_connections")
        .update({ sync_locked_until: new Date(now.getTime() + LOCK_MS).toISOString() })
        .match(mine(userId))
        .is("disconnected_at", null)
        .or(`sync_locked_until.is.null,sync_locked_until.lt.${now.toISOString()}`)
        .select("user_id");
      check("tryLock", error);
      return (data?.length ?? 0) === 1;
    },

    async unlock(userId) {
      const { error } = await db.from("platform_connections").update({ sync_locked_until: null }).match(mine(userId));
      check("unlock", error);
    },

    async recordSnapshot(userId, account: ProviderAccount) {
      const { error } = await db.rpc("record_account_snapshot", {
        p_user_id: userId,
        p_platform: platform,
        p_followers: account.followers,
        p_following: account.following,
        p_likes: account.likes,
        p_videos: account.posts,
      });
      check("recordSnapshot", error);
    },

    async upsertPosts(userId, posts: ProviderPost[]) {
      for (let i = 0; i < posts.length; i += POST_CHUNK) {
        const { error } = await db.rpc("record_post_stats", {
          p_user_id: userId,
          p_platform: platform,
          p_posts: posts.slice(i, i + POST_CHUNK).map((p) => ({
            id: p.id,
            title: p.title,
            postedAt: p.postedAt?.toISOString() ?? null,
            coverUrl: p.coverUrl,
            shareUrl: p.shareUrl,
            durationSeconds: p.durationSeconds,
            views: p.views,
            likes: p.likes,
            comments: p.comments,
            shares: p.shares,
            saves: p.saves,
          })),
        });
        check("upsertPosts", error);
      }
    },

    async markSynced(userId) {
      const { error } = await db
        .from("platform_connections")
        .update({ last_synced_at: nowIso(), status: "connected", last_sync_error: null })
        .match(mine(userId));
      check("markSynced", error);
    },

    async markProblem(userId, status, message) {
      const { error } = await db
        .from("platform_connections")
        .update({ status, last_sync_error: message.slice(0, 300) })
        .match(mine(userId));
      check("markProblem", error);
    },

    async wipeConnection(userId) {
      // The tokens, and who the account was: a creator who disconnects expects it gone.
      const { error } = await db
        .from("platform_connections")
        .update({
          disconnected_at: nowIso(),
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          refresh_token_expires_at: null,
          scopes: [],
          platform_user_id: null,
          account_name: null,
          account_handle: null,
          avatar_url: null,
          status: "needs_reauth",
          last_sync_error: null,
          sync_locked_until: null,
        })
        .match(mine(userId));
      check("wipeConnection", error);
      check("wipe account_stats", (await db.from("account_stats").delete().match(mine(userId))).error);
      check("wipe post_stats", (await db.from("post_stats").delete().match(mine(userId))).error);
    },

    async listDueForSync(limit, staleBefore) {
      const { data, error } = await db
        .from("platform_connections")
        .select("user_id")
        .eq("platform", platform)
        .is("disconnected_at", null)
        .in("status", ["connected", "error"])
        .or(`last_synced_at.is.null,last_synced_at.lt.${staleBefore.toISOString()}`)
        .order("last_synced_at", { ascending: true, nullsFirst: true })
        .limit(limit);
      check("listDueForSync", error);
      return (data ?? []).map((row) => row.user_id as string);
    },
  };
}

// ─── Reading: what the app shows ────────────────────────────────────────────
// These take the CREATOR's own client (row-level security applies), not the service role:
// a creator can only ever read their own accounts and stats.

export type ConnectedAccountSummary = {
  /** The database's platform name ('tiktok'…). */
  platform: string;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  followers: number | null;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  scopes: string[];
};

export async function listConnectedAccounts(db: SupabaseClient, userId: string): Promise<ConnectedAccountSummary[]> {
  const { data: connections, error } = await db
    .from("platform_connections")
    .select("platform, account_name, account_handle, avatar_url, status, last_synced_at, scopes")
    .eq("user_id", userId)
    .is("disconnected_at", null)
    .not("account_name", "is", null);
  check("listConnectedAccounts", error);

  const accounts: ConnectedAccountSummary[] = [];
  for (const c of connections ?? []) {
    const { data: latest } = await db
      .from("account_stats")
      .select("followers")
      .eq("user_id", userId)
      .eq("platform", c.platform)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle();
    accounts.push({
      platform: c.platform as string,
      name: c.account_name as string | null,
      handle: c.account_handle as string | null,
      avatarUrl: c.avatar_url as string | null,
      followers: latest?.followers === null || latest?.followers === undefined ? null : Number(latest.followers),
      status: c.status as ConnectionStatus,
      lastSyncedAt: c.last_synced_at as string | null,
      scopes: (c.scopes as string[] | null) ?? [],
    });
  }
  return accounts;
}

/** What each platform's posts are called, for the one line the Growth card says about them. */
const FORMAT_OF: Record<string, string> = {
  tiktok: "Short videos",
  instagram: "Posts",
  youtube: "Videos",
  threads: "Threads",
  facebook: "Page posts",
};

/** Account snapshots for the platforms with enough synced posts to say something true. */
export async function loadAccountSnapshots(
  db: SupabaseClient,
  userId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<AccountSnapshot[]> {
  const { data: connections, error } = await db
    .from("platform_connections")
    .select("platform")
    .eq("user_id", userId)
    .is("disconnected_at", null);
  check("loadAccountSnapshots", error);

  const snapshots: AccountSnapshot[] = [];
  for (const { platform } of connections ?? []) {
    const format = FORMAT_OF[platform as string];
    if (!format) continue; // platforms without synced posts
    const { data: posts, error: postsError } = await db
      .from("post_stats")
      .select("posted_at, views")
      .eq("user_id", userId)
      .eq("platform", platform)
      .order("posted_at", { ascending: false })
      .limit(200);
    check("loadAccountSnapshots posts", postsError);

    const snapshot = buildAccountSnapshot({
      platform: platform as string,
      posts: (posts ?? []).map((p) => ({ postedAt: asDate(p.posted_at), views: Number(p.views) })),
      timezone,
      now,
      topFormat: format,
    });
    if (snapshot) snapshots.push(snapshot);
  }
  return snapshots;
}
