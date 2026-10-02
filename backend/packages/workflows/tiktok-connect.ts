import { randomBytes } from "node:crypto";
import {
  TikTokApiError,
  buildTikTokAuthorizeUrl,
  exchangeTikTokCode,
  fetchTikTokUserInfo,
  listTikTokVideos,
  openToken,
  refreshTikTokTokens,
  revokeTikTokToken,
  sealToken,
  type TikTokConfig,
  type TikTokTokens,
  type TikTokUser,
  type TikTokVideo,
} from "@poststreak/integrations";

// Connecting a creator's TikTok account, keeping its numbers fresh, and
// disconnecting it.
//
// The flow (web and mobile share it):
//   1. startTikTokConnect   — we mint a single-use `state`, tied to this creator
//                             and stored server-side, and return TikTok's URL.
//   2. TikTok sends the creator back to the app's callback page with ?code&state.
//   3. completeTikTokConnect — the signed-in app posts code + state to us. We
//                             check the state was issued to THIS creator and
//                             hasn't been used or expired, exchange the code,
//                             seal the tokens, and save the connection.
//
// Everything that touches the outside world comes in through `TikTokDeps`, so
// the logic below is tested with in-memory fakes (tiktok-connect.test.ts);
// tiktok-store.ts is the Supabase implementation.

// ─── Ports ──────────────────────────────────────────────────────────────────

export type ConnectionStatus = "connected" | "needs_reauth" | "error";

export type StoredConnection = {
  platformUserId: string | null;
  accessTokenSealed: string | null;
  refreshTokenSealed: string | null;
  tokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scopes: string[];
  status: ConnectionStatus;
  disconnectedAt: Date | null;
};

export type NewConnection = {
  platformUserId: string;
  accessTokenSealed: string;
  refreshTokenSealed: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  scopes: string[];
  accountName: string | null;
  avatarUrl: string | null;
};

export type TokenUpdate = Pick<NewConnection, "accessTokenSealed" | "refreshTokenSealed" | "tokenExpiresAt" | "refreshTokenExpiresAt" | "scopes">;

/** Thrown by the store when a TikTok account is already linked to another PostStreak account. */
export class AccountInUseError extends Error {}

export interface TikTokStore {
  /** Remembers a state we issued to this creator. */
  createState(userId: string, state: string): Promise<void>;
  /** Single use: true only if this creator was issued this state and it hasn't expired. The state is gone afterwards. */
  consumeState(userId: string, state: string): Promise<boolean>;

  getConnection(userId: string): Promise<StoredConnection | null>;
  saveConnection(userId: string, connection: NewConnection): Promise<void>;
  updateTokens(userId: string, tokens: TokenUpdate): Promise<void>;
  updateAccount(userId: string, account: { name: string | null; avatarUrl: string | null }): Promise<void>;

  /** Stops two syncs refreshing the same tokens at once. */
  tryLock(userId: string): Promise<boolean>;
  unlock(userId: string): Promise<void>;

  recordSnapshot(userId: string, user: TikTokUser): Promise<void>;
  upsertPosts(userId: string, videos: TikTokVideo[]): Promise<void>;
  markSynced(userId: string): Promise<void>;
  markProblem(userId: string, status: Exclude<ConnectionStatus, "connected">, message: string): Promise<void>;

  /** Disconnect: clears tokens and the data pulled from TikTok. */
  wipeConnection(userId: string): Promise<void>;
  /** Creators whose last successful sync is older than `staleBefore` (or never). */
  listDueForSync(limit: number, staleBefore: Date): Promise<string[]>;
}

export interface TikTokApi {
  exchangeCode(code: string): Promise<TikTokTokens>;
  refreshTokens(refreshToken: string): Promise<TikTokTokens>;
  revokeToken(accessToken: string): Promise<void>;
  fetchUserInfo(accessToken: string, scopes: readonly string[]): Promise<TikTokUser>;
  listVideos(accessToken: string, opts: { cursor?: number }): ReturnType<typeof listTikTokVideos>;
}

export function createTikTokApi(config: TikTokConfig, fetchImpl: typeof fetch = fetch): TikTokApi {
  return {
    exchangeCode: (code) => exchangeTikTokCode(config, code, fetchImpl),
    refreshTokens: (refreshToken) => refreshTikTokTokens(config, refreshToken, fetchImpl),
    revokeToken: (accessToken) => revokeTikTokToken(config, accessToken, fetchImpl),
    fetchUserInfo: (accessToken, scopes) => fetchTikTokUserInfo(accessToken, scopes, fetchImpl),
    listVideos: (accessToken, opts) => listTikTokVideos(accessToken, opts, fetchImpl),
  };
}

export interface TokenVault {
  seal(plain: string, context: string): string;
  open(sealed: string, context: string): string;
}

/** Uses TOKEN_ENCRYPTION_KEY from the environment. */
export const envTokenVault: TokenVault = {
  seal: (plain, context) => sealToken(plain, context),
  open: (sealed, context) => openToken(sealed, context),
};

export type TikTokDeps = {
  store: TikTokStore;
  api: TikTokApi;
  vault: TokenVault;
  config: TikTokConfig;
  now?: () => Date;
  newState?: (client: ClientKind) => string;
};

export type ClientKind = "web" | "mobile";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Ties a sealed token to one creator, platform and purpose, so it can't be swapped between rows. */
const tokenContext = (userId: string, kind: "access" | "refresh") => `${userId}:tiktok:${kind}`;

/** `w.` for the web app, `m.` for the phone app: the callback page uses it to decide where to hand the code. */
const STATE_PATTERN = /^[wm]\.[A-Za-z0-9_-]{32,150}$/;

function defaultState(client: ClientKind): string {
  return `${client === "mobile" ? "m" : "w"}.${randomBytes(32).toString("base64url")}`;
}

const REFRESH_WINDOW_MS = 10 * 60 * 1000;
const MAX_VIDEO_PAGES = 5;
const INITIAL_VIDEO_PAGES = 3;

export type ConnectedAccount = {
  platform: "tiktok";
  name: string | null;
  avatarUrl: string | null;
  followers: number | null;
  status: ConnectionStatus;
  scopes: string[];
};

export class TikTokConnectError extends Error {
  constructor(
    readonly reason: "invalid_state" | "provider_rejected" | "missing_scope" | "account_in_use",
    message: string,
  ) {
    super(message);
    this.name = "TikTokConnectError";
  }
}

// ─── Connect ────────────────────────────────────────────────────────────────

/** Step 1: where to send the creator. */
export async function startTikTokConnect(deps: TikTokDeps, userId: string, client: ClientKind): Promise<{ url: string }> {
  const state = (deps.newState ?? defaultState)(client);
  await deps.store.createState(userId, state);
  return { url: buildTikTokAuthorizeUrl(deps.config, state) };
}

/** Step 3: finish the connection with the code TikTok sent back. */
export async function completeTikTokConnect(
  deps: TikTokDeps,
  input: { userId: string; code: string; state: string },
): Promise<ConnectedAccount> {
  const { userId, code, state } = input;
  const now = (deps.now ?? (() => new Date()))();

  const expired = new TikTokConnectError("invalid_state", "This connection link has expired. Please try connecting again.");
  if (!STATE_PATTERN.test(state) || !code) throw expired;
  // Consumed before anything else: a state works once, for the creator it was issued to.
  if (!(await deps.store.consumeState(userId, state))) throw expired;

  let tokens: TikTokTokens;
  let user: TikTokUser;
  try {
    tokens = await deps.api.exchangeCode(code);
    if (!tokens.scopes.includes("user.info.basic")) {
      throw new TikTokConnectError("missing_scope", "PostStreak needs permission to see your TikTok profile. Please try again and allow it.");
    }
    user = await deps.api.fetchUserInfo(tokens.accessToken, tokens.scopes);
  } catch (err) {
    if (err instanceof TikTokConnectError) throw err;
    if (err instanceof TikTokApiError) {
      throw new TikTokConnectError("provider_rejected", "TikTok didn't accept the connection. Please try again.");
    }
    throw err;
  }

  try {
    await deps.store.saveConnection(userId, {
      platformUserId: user.openId ?? tokens.openId,
      accessTokenSealed: deps.vault.seal(tokens.accessToken, tokenContext(userId, "access")),
      refreshTokenSealed: deps.vault.seal(tokens.refreshToken, tokenContext(userId, "refresh")),
      tokenExpiresAt: tokens.accessExpiresAt,
      refreshTokenExpiresAt: tokens.refreshExpiresAt,
      scopes: tokens.scopes,
      accountName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    if (err instanceof AccountInUseError) {
      throw new TikTokConnectError("account_in_use", "That TikTok account is already connected to another PostStreak account.");
    }
    throw err;
  }

  // Pull the first numbers straight away so Growth isn't empty. A failure here
  // must not undo a connection that worked; the next sync will catch up.
  const synced = await syncTikTok({ ...deps, now: () => now }, userId, { maxPages: INITIAL_VIDEO_PAGES });

  return {
    platform: "tiktok",
    name: user.displayName,
    avatarUrl: user.avatarUrl,
    followers: synced.status === "synced" ? synced.followers : user.followers,
    status: synced.status === "needs_reauth" ? "needs_reauth" : synced.status === "error" ? "error" : "connected",
    scopes: tokens.scopes,
  };
}

// ─── Sync ───────────────────────────────────────────────────────────────────

export type SyncResult =
  | { status: "synced"; posts: number; followers: number | null }
  | { status: "busy" | "not_connected" | "needs_reauth" | "error" };

/**
 * Refreshes the creator's TikTok numbers: the account snapshot and their latest
 * videos' stats. Safe to call from a request or the nightly job; never throws
 * for a provider problem — it records it on the connection and returns a status.
 */
export async function syncTikTok(deps: TikTokDeps, userId: string, opts: { maxPages?: number } = {}): Promise<SyncResult> {
  const now = (deps.now ?? (() => new Date()))();
  const { store, api, vault } = deps;

  const connection = await store.getConnection(userId);
  if (!connection || connection.disconnectedAt || !connection.accessTokenSealed) return { status: "not_connected" };
  if (!(await store.tryLock(userId))) return { status: "busy" };

  try {
    let accessToken = vault.open(connection.accessTokenSealed, tokenContext(userId, "access"));
    let scopes = connection.scopes;

    // Access tokens last 24 h. Refresh a little early, and save the new tokens
    // BEFORE using them: if the refresh token rotates and we lost it, the creator
    // would have to reconnect.
    const expiresSoon = !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() - now.getTime() < REFRESH_WINDOW_MS;
    if (expiresSoon) {
      const refreshExpired = connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt.getTime() <= now.getTime();
      if (!connection.refreshTokenSealed || refreshExpired) {
        await store.markProblem(userId, "needs_reauth", "Reconnect TikTok to keep your stats up to date.");
        return { status: "needs_reauth" };
      }
      const fresh = await api.refreshTokens(vault.open(connection.refreshTokenSealed, tokenContext(userId, "refresh")));
      scopes = fresh.scopes.length > 0 ? fresh.scopes : scopes;
      await store.updateTokens(userId, {
        accessTokenSealed: vault.seal(fresh.accessToken, tokenContext(userId, "access")),
        refreshTokenSealed: vault.seal(fresh.refreshToken, tokenContext(userId, "refresh")),
        tokenExpiresAt: fresh.accessExpiresAt,
        refreshTokenExpiresAt: fresh.refreshExpiresAt,
        scopes,
      });
      accessToken = fresh.accessToken;
    }

    const user = await api.fetchUserInfo(accessToken, scopes);
    await store.updateAccount(userId, { name: user.displayName, avatarUrl: user.avatarUrl });
    await store.recordSnapshot(userId, user);

    let posts = 0;
    if (scopes.includes("video.list")) {
      let cursor: number | undefined;
      for (let page = 0; page < (opts.maxPages ?? MAX_VIDEO_PAGES); page++) {
        const result = await api.listVideos(accessToken, { cursor });
        if (result.videos.length > 0) await store.upsertPosts(userId, result.videos);
        posts += result.videos.length;
        if (!result.hasMore || result.cursor === null) break;
        cursor = result.cursor;
      }
    }

    await store.markSynced(userId);
    return { status: "synced", posts, followers: user.followers };
  } catch (err) {
    if (err instanceof TikTokApiError && err.kind === "reauth") {
      await store.markProblem(userId, "needs_reauth", "Reconnect TikTok to keep your stats up to date.");
      return { status: "needs_reauth" };
    }
    // Only the provider's error code is kept — never anything that could hold a token.
    const detail = err instanceof TikTokApiError ? `TikTok: ${err.code}` : "Sync failed";
    await store.markProblem(userId, "error", detail);
    return { status: "error" };
  } finally {
    await store.unlock(userId);
  }
}

export type SyncBatchResult = { attempted: number; synced: number; needsReauth: number; errors: number; busy: number };

/** The nightly job: refreshes every connected creator whose numbers are stale. */
export async function syncDueTikTokAccounts(
  deps: TikTokDeps,
  opts: { limit?: number; staleAfterHours?: number; concurrency?: number } = {},
): Promise<SyncBatchResult> {
  const now = (deps.now ?? (() => new Date()))();
  const staleBefore = new Date(now.getTime() - (opts.staleAfterHours ?? 20) * 60 * 60 * 1000);
  const userIds = await deps.store.listDueForSync(opts.limit ?? 50, staleBefore);

  const totals: SyncBatchResult = { attempted: userIds.length, synced: 0, needsReauth: 0, errors: 0, busy: 0 };
  const concurrency = opts.concurrency ?? 3;
  for (let i = 0; i < userIds.length; i += concurrency) {
    const results = await Promise.allSettled(userIds.slice(i, i + concurrency).map((id) => syncTikTok(deps, id)));
    for (const result of results) {
      if (result.status === "rejected") totals.errors++;
      else if (result.value.status === "synced") totals.synced++;
      else if (result.value.status === "needs_reauth") totals.needsReauth++;
      else if (result.value.status === "busy") totals.busy++;
      else if (result.value.status === "error") totals.errors++;
    }
  }
  return totals;
}

// ─── Disconnect ─────────────────────────────────────────────────────────────

/**
 * Disconnects the creator's TikTok. Tells TikTok to invalidate the token (best
 * effort — a TikTok outage must never trap a creator in a connection they want
 * gone), then clears the tokens and the data we pulled from TikTok.
 */
export async function disconnectTikTok(deps: TikTokDeps, userId: string): Promise<void> {
  const connection = await deps.store.getConnection(userId);
  if (!connection || connection.disconnectedAt) return;

  if (connection.accessTokenSealed) {
    try {
      await deps.api.revokeToken(deps.vault.open(connection.accessTokenSealed, tokenContext(userId, "access")));
    } catch {
      // Already expired, or TikTok is down. The token is dropped below either way.
    }
  }
  await deps.store.wipeConnection(userId);
}
