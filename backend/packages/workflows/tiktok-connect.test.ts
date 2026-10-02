import { describe, expect, it } from "vitest";
import { TikTokApiError, type TikTokTokens, type TikTokUser, type TikTokVideo } from "@poststreak/integrations";
import {
  AccountInUseError,
  TikTokConnectError,
  completeTikTokConnect,
  disconnectTikTok,
  startTikTokConnect,
  syncDueTikTokAccounts,
  syncTikTok,
  type NewConnection,
  type StoredConnection,
  type TikTokApi,
  type TikTokDeps,
  type TikTokStore,
  type TokenUpdate,
  type TokenVault,
} from "./tiktok-connect";

// The orchestration, tested against in-memory fakes of the database, TikTok and
// the token vault. The Supabase store itself is thin glue (tiktok-store.ts); the
// rules that matter — who may finish a connection, when tokens refresh, what a
// failure does — live here.

const NOW = new Date("2026-10-02T12:00:00Z");
const ALICE = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";
const config = { clientKey: "key", clientSecret: "secret", redirectUri: "https://app.example.test/auth/tiktok/callback" };

/** A "vault" that is visibly not plaintext and refuses a token sealed for another context. */
const vault: TokenVault = {
  seal: (plain, context) => `sealed(${context})[${plain}]`,
  open: (sealed, context) => {
    const prefix = `sealed(${context})[`;
    if (!sealed.startsWith(prefix) || !sealed.endsWith("]")) throw new Error("wrong context");
    return sealed.slice(prefix.length, -1);
  },
};

const tokens = (over: Partial<TikTokTokens> = {}): TikTokTokens => ({
  accessToken: "access-1",
  refreshToken: "refresh-1",
  openId: "open-alice",
  scopes: ["user.info.basic", "user.info.stats", "video.list"],
  accessExpiresAt: new Date(NOW.getTime() + 24 * 3600 * 1000),
  refreshExpiresAt: new Date(NOW.getTime() + 365 * 24 * 3600 * 1000),
  ...over,
});
const user = (over: Partial<TikTokUser> = {}): TikTokUser => ({
  openId: "open-alice",
  displayName: "Amara",
  avatarUrl: "https://p16.example/a.jpg",
  followers: 1200,
  following: 80,
  likes: 9000,
  videos: 45,
  ...over,
});
const video = (id: string, views = 100): TikTokVideo => ({
  id, title: id, createdAt: NOW, coverUrl: null, shareUrl: null, durationSeconds: 20, views, likes: 1, comments: 1, shares: 1,
});

class MemoryStore implements TikTokStore {
  states = new Map<string, string>(); // state -> userId
  connections = new Map<string, StoredConnection & { name?: string | null; lastError?: string; synced?: boolean; locked?: boolean }>();
  snapshots: { userId: string; user: TikTokUser }[] = [];
  posts: { userId: string; videos: TikTokVideo[] }[] = [];
  wiped: string[] = [];
  openIdOwner = new Map<string, string>();

  async createState(userId: string, state: string) { this.states.set(state, userId); }
  async consumeState(userId: string, state: string) {
    if (this.states.get(state) !== userId) return false;
    this.states.delete(state);
    return true;
  }
  async getConnection(userId: string) { return this.connections.get(userId) ?? null; }
  async saveConnection(userId: string, c: NewConnection) {
    const owner = this.openIdOwner.get(c.platformUserId);
    if (owner && owner !== userId) throw new AccountInUseError();
    this.openIdOwner.set(c.platformUserId, userId);
    this.connections.set(userId, { ...c, status: "connected", disconnectedAt: null, name: c.accountName });
  }
  async updateTokens(userId: string, t: TokenUpdate) { Object.assign(this.connections.get(userId)!, t); }
  async updateAccount(userId: string, a: { name: string | null }) { this.connections.get(userId)!.name = a.name; }
  async tryLock(userId: string) {
    const c = this.connections.get(userId)!;
    if (c.locked) return false;
    c.locked = true;
    return true;
  }
  async unlock(userId: string) { this.connections.get(userId)!.locked = false; }
  async recordSnapshot(userId: string, u: TikTokUser) { this.snapshots.push({ userId, user: u }); }
  async upsertPosts(userId: string, videos: TikTokVideo[]) { this.posts.push({ userId, videos }); }
  async markSynced(userId: string) { const c = this.connections.get(userId)!; c.synced = true; c.status = "connected"; c.lastError = undefined; }
  async markProblem(userId: string, status: "needs_reauth" | "error", message: string) {
    const c = this.connections.get(userId)!;
    c.status = status;
    c.lastError = message;
  }
  async wipeConnection(userId: string) {
    this.wiped.push(userId);
    const c = this.connections.get(userId)!;
    c.disconnectedAt = NOW;
    c.accessTokenSealed = null;
    c.refreshTokenSealed = null;
  }
  async listDueForSync() { return [...this.connections.keys()]; }
}

function setup(over: Partial<TikTokApi> = {}) {
  const store = new MemoryStore();
  const calls: string[] = [];
  const api: TikTokApi = {
    exchangeCode: async (code) => { calls.push(`exchange:${code}`); return tokens(); },
    refreshTokens: async (rt) => { calls.push(`refresh:${rt}`); return tokens({ accessToken: "access-2", refreshToken: "refresh-2" }); },
    revokeToken: async (t) => { calls.push(`revoke:${t}`); },
    fetchUserInfo: async () => { calls.push("userinfo"); return user(); },
    listVideos: async () => { calls.push("videos"); return { videos: [video("v1"), video("v2")], cursor: null, hasMore: false }; },
    ...over,
  };
  const deps: TikTokDeps = { store, api, vault, config, now: () => NOW, newState: (client) => `${client === "mobile" ? "m" : "w"}.${"a".repeat(43)}` };
  return { store, api, deps, calls };
}

/** Starts a connection the way the app does and returns the state TikTok will echo back. */
async function begin(deps: TikTokDeps, userId = ALICE, client: "web" | "mobile" = "web") {
  const { url } = await startTikTokConnect(deps, userId, client);
  return { url, state: new URL(url).searchParams.get("state")! };
}

describe("starting a connection", () => {
  it("sends the creator to TikTok with a state only they were issued", async () => {
    const { deps, store } = setup();
    const { url, state } = await begin(deps);
    expect(url).toContain("https://www.tiktok.com/v2/auth/authorize/");
    expect(store.states.get(state)).toBe(ALICE);
  });

  it("marks the phone app's states so the callback page knows to hand the code back to the app", async () => {
    const { deps } = setup();
    expect((await begin(deps, ALICE, "mobile")).state.startsWith("m.")).toBe(true);
    expect((await begin(deps, ALICE, "web")).state.startsWith("w.")).toBe(true);
  });

  it("makes unguessable states by default", async () => {
    const { deps } = setup();
    const a = await startTikTokConnect({ ...deps, newState: undefined }, ALICE, "web");
    const b = await startTikTokConnect({ ...deps, newState: undefined }, ALICE, "web");
    const [sa, sb] = [a, b].map((r) => new URL(r.url).searchParams.get("state")!);
    expect(sa).not.toBe(sb);
    expect(sa).toMatch(/^w\.[A-Za-z0-9_-]{43}$/);
  });
});

describe("completing a connection", () => {
  it("connects, stores sealed tokens, and pulls the first numbers", async () => {
    const { deps, store, calls } = setup();
    const { state } = await begin(deps);

    const account = await completeTikTokConnect(deps, { userId: ALICE, code: "code-1", state });

    expect(account).toEqual({
      platform: "tiktok",
      name: "Amara",
      avatarUrl: "https://p16.example/a.jpg",
      followers: 1200,
      status: "connected",
      scopes: ["user.info.basic", "user.info.stats", "video.list"],
    });
    const saved = store.connections.get(ALICE)!;
    expect(saved.platformUserId).toBe("open-alice");
    // never stored readable, and sealed for this creator + purpose
    expect(saved.accessTokenSealed).toBe(`sealed(${ALICE}:tiktok:access)[access-1]`);
    expect(saved.refreshTokenSealed).toBe(`sealed(${ALICE}:tiktok:refresh)[refresh-1]`);
    expect(store.snapshots).toHaveLength(1);
    expect(store.posts[0]!.videos.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(calls).toContain("exchange:code-1");
  });

  describe("refuses", () => {
    it("a state that was never issued", async () => {
      const { deps, calls } = setup();
      await expect(completeTikTokConnect(deps, { userId: ALICE, code: "c", state: "w." + "x".repeat(43) })).rejects.toMatchObject({ reason: "invalid_state" });
      expect(calls).toEqual([]); // TikTok is never contacted
    });

    it("someone else's state — a forged callback can't connect the attacker's TikTok to the victim", async () => {
      const { deps, store, calls } = setup();
      const { state } = await begin(deps, ALICE);
      await expect(completeTikTokConnect(deps, { userId: BOB, code: "c", state })).rejects.toMatchObject({ reason: "invalid_state" });
      expect(calls).toEqual([]);
      expect(store.connections.size).toBe(0);
      expect(store.states.has(state)).toBe(true); // Alice's state is still hers
    });

    it("a state used before", async () => {
      const { deps } = setup();
      const { state } = await begin(deps);
      await completeTikTokConnect(deps, { userId: ALICE, code: "c", state });
      await expect(completeTikTokConnect(deps, { userId: ALICE, code: "c", state })).rejects.toMatchObject({ reason: "invalid_state" });
    });

    it("malformed states and empty codes, without touching the database", async () => {
      const { deps, store } = setup();
      for (const state of ["", "short", "x.".padEnd(60, "y"), "w.has spaces in it ".padEnd(60, "z")]) {
        await expect(completeTikTokConnect(deps, { userId: ALICE, code: "c", state })).rejects.toBeInstanceOf(TikTokConnectError);
      }
      const { state } = await begin(deps);
      await expect(completeTikTokConnect(deps, { userId: ALICE, code: "", state })).rejects.toBeInstanceOf(TikTokConnectError);
      expect(store.connections.size).toBe(0);
    });
  });

  it("explains a code TikTok rejected, and keeps the connection out", async () => {
    const { deps, store } = setup({
      exchangeCode: async () => { throw new TikTokApiError("invalid_grant", "reauth", 400, "L1"); },
    });
    const { state } = await begin(deps);
    await expect(completeTikTokConnect(deps, { userId: ALICE, code: "stale", state })).rejects.toMatchObject({
      reason: "provider_rejected",
      message: "TikTok didn't accept the connection. Please try again.",
    });
    expect(store.connections.size).toBe(0);
  });

  it("needs the profile permission", async () => {
    const { deps, store } = setup({ exchangeCode: async () => tokens({ scopes: ["video.list"] }) });
    const { state } = await begin(deps);
    await expect(completeTikTokConnect(deps, { userId: ALICE, code: "c", state })).rejects.toMatchObject({ reason: "missing_scope" });
    expect(store.connections.size).toBe(0);
  });

  it("won't link a TikTok account that already belongs to another creator", async () => {
    const { deps, store } = setup();
    const first = await begin(deps, ALICE);
    await completeTikTokConnect(deps, { userId: ALICE, code: "c", state: first.state });

    const second = await begin(deps, BOB);
    await expect(completeTikTokConnect(deps, { userId: BOB, code: "c", state: second.state })).rejects.toMatchObject({ reason: "account_in_use" });
    expect(store.connections.has(BOB)).toBe(false);
  });

  it("still connects when the first sync fails, and reports it", async () => {
    const { deps, store } = setup({
      listVideos: async () => { throw new TikTokApiError("internal_error", "transient", 500); },
    });
    const { state } = await begin(deps);
    const account = await completeTikTokConnect(deps, { userId: ALICE, code: "c", state });
    expect(account.status).toBe("error");
    expect(store.connections.get(ALICE)!.lastError).toBe("TikTok: internal_error");
  });
});

describe("syncing", () => {
  /** Connects with a healthy TikTok, then applies the scenario's behaviour to everything after. */
  async function connected(over: Partial<TikTokApi> = {}) {
    const s = setup();
    const { state } = await begin(s.deps);
    await completeTikTokConnect(s.deps, { userId: ALICE, code: "c", state });
    Object.assign(s.api, over);
    s.calls.length = 0;
    s.store.snapshots.length = 0;
    s.store.posts.length = 0;
    return s;
  }

  it("records the account snapshot and the videos' numbers", async () => {
    const { deps, store } = await connected();
    expect(await syncTikTok(deps, ALICE)).toEqual({ status: "synced", posts: 2, followers: 1200 });
    expect(store.snapshots).toHaveLength(1);
    expect(store.connections.get(ALICE)!.synced).toBe(true);
  });

  it("reads every page, up to the limit", async () => {
    let page = 0;
    const { deps, store } = await connected({
      listVideos: async () => {
        page++;
        return { videos: [video(`p${page}`)], cursor: page, hasMore: true };
      },
    });
    const result = await syncTikTok(deps, ALICE, { maxPages: 3 });
    expect(result).toMatchObject({ status: "synced", posts: 3 });
    expect(store.posts).toHaveLength(3);
  });

  it("skips videos when that permission wasn't granted", async () => {
    const { deps, calls, store } = await connected();
    store.connections.get(ALICE)!.scopes = ["user.info.basic"];
    await syncTikTok(deps, ALICE);
    expect(calls).not.toContain("videos");
  });

  describe("tokens", () => {
    it("are left alone while fresh", async () => {
      const { deps, calls } = await connected();
      await syncTikTok(deps, ALICE);
      expect(calls.some((c) => c.startsWith("refresh:"))).toBe(false);
    });

    it("are refreshed shortly before they expire, and the new ones are saved before use", async () => {
      const order: string[] = [];
      const { deps, store } = await connected({
        refreshTokens: async () => { order.push("refresh"); return tokens({ accessToken: "access-2", refreshToken: "refresh-2" }); },
        fetchUserInfo: async (accessToken) => { order.push(`userinfo:${accessToken}:saved=${store.connections.get(ALICE)!.accessTokenSealed}`); return user(); },
      });
      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() + 5 * 60 * 1000); // 5 minutes left

      await syncTikTok(deps, ALICE);

      expect(order[0]).toBe("refresh");
      expect(order[1]).toBe(`userinfo:access-2:saved=sealed(${ALICE}:tiktok:access)[access-2]`);
      expect(store.connections.get(ALICE)!.refreshTokenSealed).toBe(`sealed(${ALICE}:tiktok:refresh)[refresh-2]`);
    });

    it("send the creator back to reconnect when the refresh token has expired", async () => {
      const { deps, store, calls } = await connected();
      const c = store.connections.get(ALICE)!;
      c.tokenExpiresAt = new Date(NOW.getTime() - 1000);
      c.refreshTokenExpiresAt = new Date(NOW.getTime() - 1000);
      expect(await syncTikTok(deps, ALICE)).toEqual({ status: "needs_reauth" });
      expect(c.status).toBe("needs_reauth");
      expect(calls).toEqual([]);
    });

    it("send the creator back to reconnect when TikTok says the grant is dead", async () => {
      const { deps, store } = await connected({
        refreshTokens: async () => { throw new TikTokApiError("invalid_grant", "reauth", 400); },
      });
      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() - 1000);
      expect(await syncTikTok(deps, ALICE)).toEqual({ status: "needs_reauth" });
    });
  });

  it("records a provider hiccup without exposing anything but the error code", async () => {
    const { deps, store } = await connected({
      fetchUserInfo: async () => { throw new TikTokApiError("rate_limit_exceeded", "rate_limit", 429, "L7"); },
    });
    expect(await syncTikTok(deps, ALICE)).toEqual({ status: "error" });
    const c = store.connections.get(ALICE)!;
    expect(c.status).toBe("error");
    expect(c.lastError).toBe("TikTok: rate_limit_exceeded");
    expect(c.lastError).not.toContain("access-1");
  });

  it("recovers on the next successful sync", async () => {
    let fail = true;
    const { deps, store } = await connected({
      fetchUserInfo: async () => { if (fail) throw new TikTokApiError("internal_error", "transient", 500); return user(); },
    });
    await syncTikTok(deps, ALICE);
    expect(store.connections.get(ALICE)!.status).toBe("error");
    fail = false;
    await syncTikTok(deps, ALICE);
    expect(store.connections.get(ALICE)).toMatchObject({ status: "connected", lastError: undefined });
  });

  it("does nothing for a creator who isn't connected", async () => {
    const { deps } = setup();
    expect(await syncTikTok(deps, ALICE)).toEqual({ status: "not_connected" });
  });

  it("does not run twice at once, and always lets go of the lock", async () => {
    const { deps, store } = await connected();
    store.connections.get(ALICE)!.locked = true; // a sync is already running
    expect(await syncTikTok(deps, ALICE)).toEqual({ status: "busy" });

    store.connections.get(ALICE)!.locked = false;
    await syncTikTok(deps, ALICE);
    expect(store.connections.get(ALICE)!.locked).toBe(false);

    const failing = await connected({ fetchUserInfo: async () => { throw new Error("boom"); } });
    await syncTikTok(failing.deps, ALICE);
    expect(failing.store.connections.get(ALICE)!.locked).toBe(false);
  });
});

describe("the nightly job", () => {
  it("syncs everyone due and tallies what happened", async () => {
    const s = setup({
      fetchUserInfo: async (token) => {
        if (token === "access-bob") throw new TikTokApiError("internal_error", "transient", 500);
        return user();
      },
    });
    for (const [id, token] of [[ALICE, "access-1"], [BOB, "access-bob"]] as const) {
      s.store.connections.set(id, {
        platformUserId: id, accessTokenSealed: vault.seal(token, `${id}:tiktok:access`), refreshTokenSealed: vault.seal("r", `${id}:tiktok:refresh`),
        tokenExpiresAt: new Date(NOW.getTime() + 3600_000), refreshTokenExpiresAt: new Date(NOW.getTime() + 9e9),
        scopes: ["user.info.basic", "user.info.stats", "video.list"], status: "connected", disconnectedAt: null,
      });
    }
    expect(await syncDueTikTokAccounts(s.deps)).toEqual({ attempted: 2, synced: 1, needsReauth: 0, errors: 1, busy: 0 });
  });
});

describe("disconnecting", () => {
  it("revokes at TikTok, then clears tokens and data", async () => {
    const s = setup();
    const { state } = await begin(s.deps);
    await completeTikTokConnect(s.deps, { userId: ALICE, code: "c", state });
    s.calls.length = 0;

    await disconnectTikTok(s.deps, ALICE);

    expect(s.calls).toEqual(["revoke:access-1"]);
    expect(s.store.wiped).toEqual([ALICE]);
    expect(s.store.connections.get(ALICE)).toMatchObject({ accessTokenSealed: null, refreshTokenSealed: null });
  });

  it("carries on when TikTok can't be reached", async () => {
    const s = setup({ revokeToken: async () => { throw new TikTokApiError("network_error", "transient", 0); } });
    const { state } = await begin(s.deps);
    await completeTikTokConnect(s.deps, { userId: ALICE, code: "c", state });
    await disconnectTikTok(s.deps, ALICE);
    expect(s.store.wiped).toEqual([ALICE]);
  });

  it("is harmless when nothing is connected, or when called twice", async () => {
    const s = setup();
    await disconnectTikTok(s.deps, ALICE);
    expect(s.store.wiped).toEqual([]);

    const { state } = await begin(s.deps);
    await completeTikTokConnect(s.deps, { userId: ALICE, code: "c", state });
    await disconnectTikTok(s.deps, ALICE);
    await disconnectTikTok(s.deps, ALICE);
    expect(s.store.wiped).toEqual([ALICE]);
  });
});
