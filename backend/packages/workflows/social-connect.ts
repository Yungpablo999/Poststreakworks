import { randomBytes } from "node:crypto";
import {
  ProviderApiError,
  openToken,
  sealToken,
  type ProviderAccount,
  type ProviderAdapter,
  type ProviderId,
  type ProviderPost,
  type ProviderTokens,
} from "@poststreak/integrations";

// Connecting a creator's account on a social platform, keeping its numbers fresh, and
// disconnecting it. One flow for TikTok, Instagram, Threads, Facebook and YouTube: what differs
// between them lives in the platform's adapter (packages/integrations/providers).
//
// The flow (web and mobile share it):
//   1. startConnect    — we mint a single-use `state`, tied to this creator and stored
//                        server-side, and return the platform's sign-in address.
//   2. The platform sends the creator back to the app's callback page with ?code&state.
//   3. completeConnect — the signed-in app posts code + state to us. We check the state was
//                        issued to THIS creator and hasn't been used or expired, exchange the
//                        code, seal the tokens, and save the connection.
//
// Everything that touches the outside world comes in through `SocialDeps`, so the logic below
// is tested with in-memory fakes (social-connect.test.ts); social-store.ts is the Supabase side.

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
  /** null where the platform renews the access token with itself, or never expires it. */
  refreshTokenSealed: string | null;
  tokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scopes: string[];
  accountName: string | null;
  accountHandle: string | null;
  avatarUrl: string | null;
};

export type TokenUpdate = Pick<NewConnection, "accessTokenSealed" | "refreshTokenSealed" | "tokenExpiresAt" | "refreshTokenExpiresAt" | "scopes">;

/** Thrown by the store when a platform account is already linked to another PostStreak account. */
export class AccountInUseError extends Error {}

/** The database side, for ONE platform (the store is made for it). */
export interface SocialStore {
  /** Remembers a state we issued to this creator. */
  createState(userId: string, state: string): Promise<void>;
  /** Single use: true only if this creator was issued this state and it hasn't expired. The state is gone afterwards. */
  consumeState(userId: string, state: string): Promise<boolean>;

  getConnection(userId: string): Promise<StoredConnection | null>;
  saveConnection(userId: string, connection: NewConnection): Promise<void>;
  updateTokens(userId: string, tokens: TokenUpdate): Promise<void>;
  updateAccount(userId: string, account: { name: string | null; handle: string | null; avatarUrl: string | null }): Promise<void>;

  /** Stops two syncs refreshing the same tokens at once. */
  tryLock(userId: string): Promise<boolean>;
  unlock(userId: string): Promise<void>;

  recordSnapshot(userId: string, account: ProviderAccount): Promise<void>;
  upsertPosts(userId: string, posts: ProviderPost[]): Promise<void>;
  markSynced(userId: string): Promise<void>;
  markProblem(userId: string, status: Exclude<ConnectionStatus, "connected">, message: string): Promise<void>;

  /** Disconnect: clears tokens and the data pulled from the platform. */
  wipeConnection(userId: string): Promise<void>;
  /** Creators whose last successful sync is older than `staleBefore` (or never). */
  listDueForSync(limit: number, staleBefore: Date): Promise<string[]>;
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

export type ClientKind = "web" | "mobile";

export type SocialDeps = {
  store: SocialStore;
  adapter: ProviderAdapter;
  vault: TokenVault;
  now?: () => Date;
  newState?: (client: ClientKind) => string;
  /** Called when a sync finds this connection can no longer be used, so the creator can be told. */
  onNeedsReauth?: (userId: string) => Promise<void>;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Ties a sealed token to one creator, platform and purpose, so it can't be swapped between rows. */
const tokenContext = (userId: string, platform: ProviderId, kind: "access" | "refresh") => `${userId}:${platform}:${kind}`;

/** `w.` for the web app, `m.` for the phone app: the callback page uses it to decide where to hand the code. */
const STATE_PATTERN = /^[wm]\.[A-Za-z0-9_-]{32,150}$/;

function defaultState(client: ClientKind): string {
  return `${client === "mobile" ? "m" : "w"}.${randomBytes(32).toString("base64url")}`;
}

const nowOf = (deps: SocialDeps) => (deps.now ?? (() => new Date()))();

const PAGE_SIZE = 20;
const MAX_PAGES = 5;
const INITIAL_PAGES = 3;

export type ConnectedAccount = {
  platform: ProviderId;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  followers: number | null;
  status: ConnectionStatus;
  scopes: string[];
};

export class SocialConnectError extends Error {
  constructor(
    readonly reason: "invalid_state" | "provider_rejected" | "missing_scope" | "no_account" | "account_in_use",
    message: string,
  ) {
    super(message);
    this.name = "SocialConnectError";
  }
}

/** What to tell the creator when the platform says no. Only what the creator can act on. */
function explainRejection(adapter: ProviderAdapter, err: ProviderApiError): SocialConnectError {
  const name = adapter.name;
  switch (err.code) {
    case "no_page":
      return new SocialConnectError("no_account", "We couldn’t find a Facebook Page that you manage. PostStreak connects Pages, not personal profiles.");
    case "no_channel":
      return new SocialConnectError("no_account", "That Google account doesn’t have a YouTube channel yet.");
    case "no_refresh_token":
      return new SocialConnectError("provider_rejected", `${name} didn’t give PostStreak lasting access. Please try again and allow it.`);
    default:
      if (err.kind === "scope") return new SocialConnectError("missing_scope", `PostStreak needs permission to see your ${name} profile. Please try again and allow it.`);
      return new SocialConnectError("provider_rejected", `${name} didn’t accept the connection. Please try again.`);
  }
}

// ─── Connect ────────────────────────────────────────────────────────────────

/** Step 1: where to send the creator. */
export async function startConnect(deps: SocialDeps, userId: string, client: ClientKind): Promise<{ url: string }> {
  const state = (deps.newState ?? defaultState)(client);
  await deps.store.createState(userId, state);
  return { url: deps.adapter.authorizeUrl(state) };
}

/** Step 3: finish the connection with the code the platform sent back. */
export async function completeConnect(deps: SocialDeps, input: { userId: string; code: string; state: string }): Promise<ConnectedAccount> {
  const { userId, code, state } = input;
  const { adapter, vault, store } = deps;
  const now = nowOf(deps);

  const expired = new SocialConnectError("invalid_state", "This connection link has expired. Please try connecting again.");
  if (!STATE_PATTERN.test(state) || !code) throw expired;
  // Consumed before anything else: a state works once, for the creator it was issued to.
  if (!(await store.consumeState(userId, state))) throw expired;

  let tokens: ProviderTokens;
  let account: ProviderAccount;
  try {
    tokens = await adapter.exchangeCode(code);
    if (!adapter.requiredScopes.every((scope) => tokens.scopes.includes(scope))) {
      throw new SocialConnectError("missing_scope", `PostStreak needs permission to see your ${adapter.name} profile. Please try again and allow it.`);
    }
    account = await adapter.fetchAccount(tokens);
  } catch (err) {
    if (err instanceof SocialConnectError) throw err;
    if (err instanceof ProviderApiError) throw explainRejection(adapter, err);
    throw err;
  }

  try {
    await store.saveConnection(userId, {
      platformUserId: account.externalId,
      accessTokenSealed: vault.seal(tokens.accessToken, tokenContext(userId, adapter.id, "access")),
      refreshTokenSealed: tokens.refreshToken ? vault.seal(tokens.refreshToken, tokenContext(userId, adapter.id, "refresh")) : null,
      tokenExpiresAt: tokens.accessExpiresAt,
      refreshTokenExpiresAt: tokens.refreshExpiresAt,
      scopes: tokens.scopes,
      accountName: account.name,
      accountHandle: account.handle,
      avatarUrl: account.avatarUrl,
    });
  } catch (err) {
    if (err instanceof AccountInUseError) {
      throw new SocialConnectError("account_in_use", `That ${adapter.name} account is already connected to another PostStreak account.`);
    }
    throw err;
  }

  // Pull the first numbers straight away so Growth isn't empty. A failure here must not undo a
  // connection that worked; the next sync will catch up.
  const synced = await syncAccount({ ...deps, now: () => now }, userId, { maxPages: INITIAL_PAGES });

  return {
    platform: adapter.id,
    name: account.name,
    handle: account.handle,
    avatarUrl: account.avatarUrl,
    followers: synced.status === "synced" ? synced.followers : account.followers,
    status: synced.status === "needs_reauth" ? "needs_reauth" : synced.status === "error" ? "error" : "connected",
    scopes: tokens.scopes,
  };
}

// ─── Sync ───────────────────────────────────────────────────────────────────

export type SyncResult =
  | { status: "synced"; posts: number; followers: number | null }
  | { status: "busy" | "not_connected" | "needs_reauth" | "error" };

/**
 * Refreshes the creator's numbers on this platform: the account snapshot and their latest
 * posts' stats. Safe to call from a request or the nightly job; never throws for a platform
 * problem — it records it on the connection and returns a status.
 */
export async function syncAccount(deps: SocialDeps, userId: string, opts: { maxPages?: number } = {}): Promise<SyncResult> {
  const now = nowOf(deps);
  const { store, adapter, vault } = deps;
  const platform = adapter.id;

  const connection = await store.getConnection(userId);
  if (!connection || connection.disconnectedAt || !connection.accessTokenSealed) return { status: "not_connected" };
  if (!(await store.tryLock(userId))) return { status: "busy" };

  const reconnect = async (): Promise<SyncResult> => {
    await store.markProblem(userId, "needs_reauth", `Reconnect ${adapter.name} to keep your stats up to date.`);
    await deps.onNeedsReauth?.(userId);
    return { status: "needs_reauth" };
  };

  try {
    let tokens: ProviderTokens = {
      accessToken: vault.open(connection.accessTokenSealed, tokenContext(userId, platform, "access")),
      refreshToken: connection.refreshTokenSealed ? vault.open(connection.refreshTokenSealed, tokenContext(userId, platform, "refresh")) : null,
      accessExpiresAt: connection.tokenExpiresAt,
      refreshExpiresAt: connection.refreshTokenExpiresAt,
      scopes: connection.scopes,
    };

    // Renew a little before the access token runs out, and save the new tokens BEFORE using them:
    // if a refresh token rotates and we lost it, the creator would have to reconnect.
    // (No expiry on record = the platform doesn't expire it.)
    const expiresSoon = tokens.accessExpiresAt !== null && tokens.accessExpiresAt.getTime() - now.getTime() < adapter.refreshWindowMs;
    if (expiresSoon) {
      if (!adapter.canRefresh(tokens, now)) return await reconnect();
      const fresh = await adapter.refresh(tokens);
      tokens = { ...fresh, scopes: fresh.scopes.length > 0 ? fresh.scopes : tokens.scopes };
      await store.updateTokens(userId, {
        accessTokenSealed: vault.seal(tokens.accessToken, tokenContext(userId, platform, "access")),
        refreshTokenSealed: tokens.refreshToken ? vault.seal(tokens.refreshToken, tokenContext(userId, platform, "refresh")) : null,
        tokenExpiresAt: tokens.accessExpiresAt,
        refreshTokenExpiresAt: tokens.refreshExpiresAt,
        scopes: tokens.scopes,
      });
    }

    const account = await adapter.fetchAccount(tokens);
    await store.updateAccount(userId, { name: account.name, handle: account.handle, avatarUrl: account.avatarUrl });
    await store.recordSnapshot(userId, account);

    let posts = 0;
    let cursor: string | null = null;
    for (let page = 0; page < (opts.maxPages ?? MAX_PAGES); page++) {
      const result = await adapter.fetchPosts(tokens, account, { cursor, limit: PAGE_SIZE });
      if (result.posts.length > 0) await store.upsertPosts(userId, result.posts);
      posts += result.posts.length;
      if (!result.hasMore || result.cursor === null) break;
      cursor = result.cursor;
    }

    await store.markSynced(userId);
    return { status: "synced", posts, followers: account.followers };
  } catch (err) {
    if (err instanceof ProviderApiError && err.kind === "reauth") return await reconnect();
    // Only the platform's error code is kept — never anything that could hold a token.
    const detail = err instanceof ProviderApiError ? `${adapter.name}: ${err.code}` : "Sync failed";
    await store.markProblem(userId, "error", detail);
    return { status: "error" };
  } finally {
    await store.unlock(userId);
  }
}

export type SyncBatchResult = { attempted: number; synced: number; needsReauth: number; errors: number; busy: number };

/** The nightly job: refreshes every connected creator on this platform whose numbers are stale. */
export async function syncDueAccounts(
  deps: SocialDeps,
  opts: { limit?: number; staleAfterHours?: number; concurrency?: number } = {},
): Promise<SyncBatchResult> {
  const now = nowOf(deps);
  const staleBefore = new Date(now.getTime() - (opts.staleAfterHours ?? 20) * 60 * 60 * 1000);
  const userIds = await deps.store.listDueForSync(opts.limit ?? 50, staleBefore);

  const totals: SyncBatchResult = { attempted: userIds.length, synced: 0, needsReauth: 0, errors: 0, busy: 0 };
  const concurrency = opts.concurrency ?? 3;
  for (let i = 0; i < userIds.length; i += concurrency) {
    const results = await Promise.allSettled(userIds.slice(i, i + concurrency).map((id) => syncAccount(deps, id)));
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
 * Disconnects the creator's account. Tells the platform to forget the grant (best effort — an
 * outage there must never trap a creator in a connection they want gone), then clears the
 * tokens and the data we pulled from the platform.
 */
export async function disconnectAccount(deps: SocialDeps, userId: string): Promise<void> {
  const { store, adapter, vault } = deps;
  const connection = await store.getConnection(userId);
  if (!connection || connection.disconnectedAt) return;

  if (connection.accessTokenSealed) {
    try {
      await adapter.revoke({
        accessToken: vault.open(connection.accessTokenSealed, tokenContext(userId, adapter.id, "access")),
        refreshToken: connection.refreshTokenSealed ? vault.open(connection.refreshTokenSealed, tokenContext(userId, adapter.id, "refresh")) : null,
        accessExpiresAt: connection.tokenExpiresAt,
        refreshExpiresAt: connection.refreshTokenExpiresAt,
        scopes: connection.scopes,
      });
    } catch {
      // Already expired, or the platform is down. The tokens are dropped below either way.
    }
  }
  await store.wipeConnection(userId);
}
