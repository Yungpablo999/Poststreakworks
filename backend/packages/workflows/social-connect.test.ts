import { describe, expect, it } from "vitest";
import { PROVIDER_NAMES, ProviderApiError, type ProviderAccount, type ProviderAdapter, type ProviderId, type ProviderPost, type ProviderTokens } from "@poststreak/integrations";
import {
  AccountInUseError,
  SocialConnectError,
  completeConnect,
  disconnectAccount,
  startConnect,
  syncAccount,
  syncDueAccounts,
  type NewConnection,
  type SocialDeps,
  type SocialStore,
  type StoredConnection,
  type TokenUpdate,
  type TokenVault,
} from "./social-connect";

// The orchestration, tested against in-memory fakes of the database, the platform and the
// token vault. The Supabase store itself is thin glue (social-store.ts); the rules that
// matter — who may finish a connection, when tokens renew, what a failure does — live here,
// and they are the same for every platform.

const NOW = new Date("2026-10-02T12:00:00Z");
const DAY = 24 * 3600 * 1000;
const ALICE = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";

/** A "vault" that is visibly not plaintext and refuses a token sealed for another context. */
const vault: TokenVault = {
  seal: (plain, context) => `sealed(${context})[${plain}]`,
  open: (sealed, context) => {
    const prefix = `sealed(${context})[`;
    if (!sealed.startsWith(prefix) || !sealed.endsWith("]")) throw new Error("wrong context");
    return sealed.slice(prefix.length, -1);
  },
};

const tokens = (over: Partial<ProviderTokens> = {}): ProviderTokens => ({
  accessToken: "access-1",
  refreshToken: "refresh-1",
  scopes: ["user.info.basic", "user.info.stats", "video.list"],
  accessExpiresAt: new Date(NOW.getTime() + DAY),
  refreshExpiresAt: new Date(NOW.getTime() + 365 * DAY),
  ...over,
});
const account = (over: Partial<ProviderAccount> = {}): ProviderAccount => ({
  externalId: "open-alice",
  name: "Amara",
  handle: null,
  avatarUrl: "https://p16.example/a.jpg",
  followers: 1200,
  following: 80,
  likes: 9000,
  posts: 45,
  ...over,
});
const post = (id: string, views: number | null = 100): ProviderPost => ({
  id, title: id, postedAt: NOW, coverUrl: null, shareUrl: null, durationSeconds: 20, views, likes: 1, comments: 1, shares: 1, saves: null,
});

class MemoryStore implements SocialStore {
  states = new Map<string, string>(); // state -> userId
  connections = new Map<string, StoredConnection & { name?: string | null; handle?: string | null; lastError?: string; synced?: boolean; locked?: boolean }>();
  snapshots: { userId: string; account: ProviderAccount }[] = [];
  posts: { userId: string; posts: ProviderPost[] }[] = [];
  wiped: string[] = [];
  accountOwner = new Map<string, string>();

  async createState(userId: string, state: string) { this.states.set(state, userId); }
  async consumeState(userId: string, state: string) {
    if (this.states.get(state) !== userId) return false;
    this.states.delete(state);
    return true;
  }
  async getConnection(userId: string) { return this.connections.get(userId) ?? null; }
  async saveConnection(userId: string, c: NewConnection) {
    const owner = this.accountOwner.get(c.platformUserId);
    if (owner && owner !== userId) throw new AccountInUseError();
    this.accountOwner.set(c.platformUserId, userId);
    this.connections.set(userId, { ...c, status: "connected", disconnectedAt: null, name: c.accountName, handle: c.accountHandle });
  }
  async updateTokens(userId: string, t: TokenUpdate) { Object.assign(this.connections.get(userId)!, t); }
  async updateAccount(userId: string, a: { name: string | null; handle: string | null }) {
    Object.assign(this.connections.get(userId)!, { name: a.name, handle: a.handle });
  }
  async tryLock(userId: string) {
    const c = this.connections.get(userId)!;
    if (c.locked) return false;
    c.locked = true;
    return true;
  }
  async unlock(userId: string) { this.connections.get(userId)!.locked = false; }
  async recordSnapshot(userId: string, a: ProviderAccount) { this.snapshots.push({ userId, account: a }); }
  async upsertPosts(userId: string, posts: ProviderPost[]) { this.posts.push({ userId, posts }); }
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

/** TikTok-shaped by default: refresh token that rotates, 24 h access token. */
function fakeAdapter(calls: string[], over: Partial<ProviderAdapter> = {}): ProviderAdapter {
  return {
    id: "tiktok",
    name: "TikTok",
    requiredScopes: ["user.info.basic"],
    refreshWindowMs: 10 * 60 * 1000,
    authorizeUrl: (state) => `https://www.tiktok.com/v2/auth/authorize/?state=${state}`,
    exchangeCode: async (code) => { calls.push(`exchange:${code}`); return tokens(); },
    canRefresh: (t, now) => t.refreshToken !== null && (t.refreshExpiresAt === null || t.refreshExpiresAt.getTime() > now.getTime()),
    refresh: async (t) => { calls.push(`refresh:${t.refreshToken}`); return tokens({ accessToken: "access-2", refreshToken: "refresh-2" }); },
    fetchAccount: async () => { calls.push("account"); return account(); },
    fetchPosts: async () => { calls.push("posts"); return { posts: [post("v1"), post("v2")], cursor: null, hasMore: false }; },
    revoke: async (t) => { calls.push(`revoke:${t.accessToken}`); },
    ...over,
  };
}

function setup(over: Partial<ProviderAdapter> = {}, id: ProviderId = "tiktok") {
  const store = new MemoryStore();
  const calls: string[] = [];
  const adapter = fakeAdapter(calls, { id, name: PROVIDER_NAMES[id], ...over });
  const deps: SocialDeps = { store, adapter, vault, now: () => NOW, newState: (client) => `${client === "mobile" ? "m" : "w"}.${"a".repeat(43)}` };
  return { store, adapter, deps, calls };
}

/** Starts a connection the way the app does and returns the state the platform will echo back. */
async function begin(deps: SocialDeps, userId = ALICE, client: "web" | "mobile" = "web") {
  const { url } = await startConnect(deps, userId, client);
  return { url, state: new URL(url).searchParams.get("state")! };
}

describe("starting a connection", () => {
  it("sends the creator to the platform with a state only they were issued", async () => {
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
    const a = await startConnect({ ...deps, newState: undefined }, ALICE, "web");
    const b = await startConnect({ ...deps, newState: undefined }, ALICE, "web");
    const [sa, sb] = [a, b].map((r) => new URL(r.url).searchParams.get("state")!);
    expect(sa).not.toBe(sb);
    expect(sa).toMatch(/^w\.[A-Za-z0-9_-]{43}$/);
  });
});

describe("completing a connection", () => {
  it("connects, stores sealed tokens, and pulls the first numbers", async () => {
    const { deps, store, calls } = setup();
    const { state } = await begin(deps);

    const connected = await completeConnect(deps, { userId: ALICE, code: "code-1", state });

    expect(connected).toEqual({
      platform: "tiktok",
      name: "Amara",
      handle: null,
      avatarUrl: "https://p16.example/a.jpg",
      followers: 1200,
      status: "connected",
      scopes: ["user.info.basic", "user.info.stats", "video.list"],
    });
    const saved = store.connections.get(ALICE)!;
    expect(saved.platformUserId).toBe("open-alice");
    // never stored readable, and sealed for this creator + platform + purpose
    expect(saved.accessTokenSealed).toBe(`sealed(${ALICE}:tiktok:access)[access-1]`);
    expect(saved.refreshTokenSealed).toBe(`sealed(${ALICE}:tiktok:refresh)[refresh-1]`);
    expect(store.snapshots).toHaveLength(1);
    expect(store.posts[0]!.posts.map((p) => p.id)).toEqual(["v1", "v2"]);
    expect(calls).toContain("exchange:code-1");
  });

  it("keeps the @handle when the platform gives one", async () => {
    const { deps, store } = setup({ fetchAccount: async () => account({ handle: "amara.makes" }) }, "instagram");
    const { state } = await begin(deps);
    expect(await completeConnect(deps, { userId: ALICE, code: "c", state })).toMatchObject({ platform: "instagram", handle: "amara.makes" });
    expect(store.connections.get(ALICE)!.handle).toBe("amara.makes");
  });

  describe("refuses", () => {
    it("a state that was never issued", async () => {
      const { deps, calls } = setup();
      await expect(completeConnect(deps, { userId: ALICE, code: "c", state: "w." + "x".repeat(43) })).rejects.toMatchObject({ reason: "invalid_state" });
      expect(calls).toEqual([]); // the platform is never contacted
    });

    it("someone else's state — a forged callback can't connect the attacker's account to the victim", async () => {
      const { deps, store, calls } = setup();
      const { state } = await begin(deps, ALICE);
      await expect(completeConnect(deps, { userId: BOB, code: "c", state })).rejects.toMatchObject({ reason: "invalid_state" });
      expect(calls).toEqual([]);
      expect(store.connections.size).toBe(0);
      expect(store.states.has(state)).toBe(true); // Alice's state is still hers
    });

    it("a state used before", async () => {
      const { deps } = setup();
      const { state } = await begin(deps);
      await completeConnect(deps, { userId: ALICE, code: "c", state });
      await expect(completeConnect(deps, { userId: ALICE, code: "c", state })).rejects.toMatchObject({ reason: "invalid_state" });
    });

    it("malformed states and empty codes, without touching the database", async () => {
      const { deps, store } = setup();
      for (const state of ["", "short", "x.".padEnd(60, "y"), "w.has spaces in it ".padEnd(60, "z")]) {
        await expect(completeConnect(deps, { userId: ALICE, code: "c", state })).rejects.toBeInstanceOf(SocialConnectError);
      }
      const { state } = await begin(deps);
      await expect(completeConnect(deps, { userId: ALICE, code: "", state })).rejects.toBeInstanceOf(SocialConnectError);
      expect(store.connections.size).toBe(0);
    });
  });

  it("explains a code the platform rejected, and keeps the connection out", async () => {
    const { deps, store } = setup({
      exchangeCode: async () => { throw new ProviderApiError("tiktok", "invalid_grant", "reauth", 400, "L1"); },
    });
    const { state } = await begin(deps);
    await expect(completeConnect(deps, { userId: ALICE, code: "stale", state })).rejects.toMatchObject({
      reason: "provider_rejected",
      message: "TikTok didn’t accept the connection. Please try again.",
    });
    expect(store.connections.size).toBe(0);
  });

  it("names the platform in what it tells the creator", async () => {
    const { deps } = setup({ exchangeCode: async () => { throw new ProviderApiError("threads", "100", "rejected", 400); } }, "threads");
    const { state } = await begin(deps);
    await expect(completeConnect(deps, { userId: ALICE, code: "c", state })).rejects.toMatchObject({ message: "Threads didn’t accept the connection. Please try again." });
  });

  it("needs the profile permission", async () => {
    const { deps, store } = setup({ exchangeCode: async () => tokens({ scopes: ["video.list"] }) });
    const { state } = await begin(deps);
    await expect(completeConnect(deps, { userId: ALICE, code: "c", state })).rejects.toMatchObject({ reason: "missing_scope" });
    expect(store.connections.size).toBe(0);
  });

  it("treats a permission the platform refuses at the profile as a missing permission", async () => {
    const { deps } = setup({ fetchAccount: async () => { throw new ProviderApiError("instagram", "10", "scope", 400); } }, "instagram");
    const { state } = await begin(deps);
    await expect(completeConnect(deps, { userId: ALICE, code: "c", state })).rejects.toMatchObject({ reason: "missing_scope" });
  });

  it("tells a creator with no Facebook Page, or no YouTube channel, exactly that", async () => {
    const facebook = setup({ exchangeCode: async () => { throw new ProviderApiError("facebook", "no_page", "rejected", 200); } }, "facebook");
    await expect(completeConnect(facebook.deps, { userId: ALICE, code: "c", state: (await begin(facebook.deps)).state })).rejects.toMatchObject({
      reason: "no_account",
      message: expect.stringContaining("Page"),
    });

    const youtube = setup({ fetchAccount: async () => { throw new ProviderApiError("youtube", "no_channel", "rejected", 200); } }, "youtube");
    await expect(completeConnect(youtube.deps, { userId: ALICE, code: "c", state: (await begin(youtube.deps)).state })).rejects.toMatchObject({
      reason: "no_account",
      message: expect.stringContaining("YouTube channel"),
    });
  });

  it("won't link an account that already belongs to another creator", async () => {
    const { deps, store } = setup();
    const first = await begin(deps, ALICE);
    await completeConnect(deps, { userId: ALICE, code: "c", state: first.state });

    const second = await begin(deps, BOB);
    await expect(completeConnect(deps, { userId: BOB, code: "c", state: second.state })).rejects.toMatchObject({
      reason: "account_in_use",
      message: "That TikTok account is already connected to another PostStreak account.",
    });
    expect(store.connections.has(BOB)).toBe(false);
  });

  it("still connects when the first sync fails, and reports it", async () => {
    const { deps, store } = setup({
      fetchPosts: async () => { throw new ProviderApiError("tiktok", "internal_error", "transient", 500); },
    });
    const { state } = await begin(deps);
    const connected = await completeConnect(deps, { userId: ALICE, code: "c", state });
    expect(connected.status).toBe("error");
    expect(store.connections.get(ALICE)!.lastError).toBe("TikTok: internal_error");
  });

  describe("on platforms whose tokens work differently", () => {
    it("stores no refresh token when the platform renews the access token with itself (Instagram, Threads)", async () => {
      const { deps, store } = setup({
        exchangeCode: async () => tokens({ refreshToken: null, refreshExpiresAt: null, accessExpiresAt: new Date(NOW.getTime() + 60 * DAY), scopes: ["instagram_business_basic"] }),
        requiredScopes: ["instagram_business_basic"],
      }, "instagram");
      const { state } = await begin(deps);
      await completeConnect(deps, { userId: ALICE, code: "c", state });
      const saved = store.connections.get(ALICE)!;
      expect(saved.refreshTokenSealed).toBeNull();
      expect(saved.accessTokenSealed).toBe(`sealed(${ALICE}:instagram:access)[access-1]`);
    });

    it("stores a token that never expires without an expiry (a Facebook Page)", async () => {
      const { deps, store } = setup({
        exchangeCode: async () => tokens({ refreshToken: null, refreshExpiresAt: null, accessExpiresAt: null, scopes: ["pages_show_list"] }),
        requiredScopes: ["pages_show_list"],
      }, "facebook");
      const { state } = await begin(deps);
      await completeConnect(deps, { userId: ALICE, code: "c", state });
      expect(store.connections.get(ALICE)!.tokenExpiresAt).toBeNull();
    });
  });
});

describe("syncing", () => {
  /** Connects with a healthy platform, then applies the scenario's behaviour to everything after. */
  async function connected(over: Partial<ProviderAdapter> = {}, id: ProviderId = "tiktok", base: Partial<ProviderAdapter> = {}) {
    const s = setup(base, id);
    const { state } = await begin(s.deps);
    await completeConnect(s.deps, { userId: ALICE, code: "c", state });
    Object.assign(s.adapter, over);
    s.calls.length = 0;
    s.store.snapshots.length = 0;
    s.store.posts.length = 0;
    return s;
  }

  it("records the account snapshot and the posts' numbers", async () => {
    const { deps, store } = await connected();
    expect(await syncAccount(deps, ALICE)).toEqual({ status: "synced", posts: 2, followers: 1200 });
    expect(store.snapshots).toHaveLength(1);
    expect(store.connections.get(ALICE)!.synced).toBe(true);
  });

  it("keeps the name, handle and picture current", async () => {
    const { deps, store } = await connected({ fetchAccount: async () => account({ name: "Amara O.", handle: "amara" }) });
    await syncAccount(deps, ALICE);
    expect(store.connections.get(ALICE)).toMatchObject({ name: "Amara O.", handle: "amara" });
  });

  it("reads every page, up to the limit", async () => {
    let page = 0;
    const { deps, store } = await connected({
      fetchPosts: async () => {
        page++;
        return { posts: [post(`p${page}`)], cursor: String(page), hasMore: true };
      },
    });
    const result = await syncAccount(deps, ALICE, { maxPages: 3 });
    expect(result).toMatchObject({ status: "synced", posts: 3 });
    expect(store.posts).toHaveLength(3);
  });

  it("asks for each next page where the last one left off", async () => {
    const asked: (string | null)[] = [];
    const { deps } = await connected({
      fetchPosts: async (_t, _a, p) => {
        asked.push(p.cursor);
        return p.cursor === null ? { posts: [post("a")], cursor: "next-1", hasMore: true } : { posts: [post("b")], cursor: null, hasMore: false };
      },
    });
    await syncAccount(deps, ALICE);
    expect(asked).toEqual([null, "next-1"]);
  });

  describe("tokens", () => {
    it("are left alone while fresh", async () => {
      const { deps, calls } = await connected();
      await syncAccount(deps, ALICE);
      expect(calls.some((c) => c.startsWith("refresh:"))).toBe(false);
    });

    it("are refreshed shortly before they expire, and the new ones are saved before use", async () => {
      const order: string[] = [];
      const { deps, store } = await connected({
        refresh: async () => { order.push("refresh"); return tokens({ accessToken: "access-2", refreshToken: "refresh-2" }); },
        fetchAccount: async (t) => { order.push(`account:${t.accessToken}:saved=${store.connections.get(ALICE)!.accessTokenSealed}`); return account(); },
      });
      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() + 5 * 60 * 1000); // 5 minutes left

      await syncAccount(deps, ALICE);

      expect(order[0]).toBe("refresh");
      expect(order[1]).toBe(`account:access-2:saved=sealed(${ALICE}:tiktok:access)[access-2]`);
      expect(store.connections.get(ALICE)!.refreshTokenSealed).toBe(`sealed(${ALICE}:tiktok:refresh)[refresh-2]`);
    });

    it("send the creator back to reconnect when the refresh token has expired", async () => {
      const { deps, store, calls } = await connected();
      const c = store.connections.get(ALICE)!;
      c.tokenExpiresAt = new Date(NOW.getTime() - 1000);
      c.refreshTokenExpiresAt = new Date(NOW.getTime() - 1000);
      expect(await syncAccount(deps, ALICE)).toEqual({ status: "needs_reauth" });
      expect(c.status).toBe("needs_reauth");
      expect(c.lastError).toBe("Reconnect TikTok to keep your stats up to date.");
      expect(calls).toEqual([]);
    });

    it("send the creator back to reconnect when the platform says the grant is dead", async () => {
      const { deps, store } = await connected({
        refresh: async () => { throw new ProviderApiError("tiktok", "invalid_grant", "reauth", 400); },
      });
      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() - 1000);
      expect(await syncAccount(deps, ALICE)).toEqual({ status: "needs_reauth" });
    });

    it("tell the app to let the creator know, once, only when it is the creator who must act", async () => {
      const told: string[] = [];
      const { deps, store } = await connected();
      const withHook = { ...deps, onNeedsReauth: async (id: string) => { told.push(id); } };

      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() - 1000);
      store.connections.get(ALICE)!.refreshTokenExpiresAt = new Date(NOW.getTime() - 1000);
      await syncAccount(withHook, ALICE);
      expect(told).toEqual([ALICE]);

      // a platform hiccup is not something the creator can fix
      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() + DAY);
      withHook.adapter.fetchAccount = async () => { throw new ProviderApiError("tiktok", "internal_error", "transient", 500); };
      await syncAccount(withHook, ALICE);
      expect(told).toEqual([ALICE]);
    });

    it("renew themselves where the platform has no refresh token (Instagram)", async () => {
      const renewed: string[] = [];
      const { deps, store } = await connected(
        {
          refresh: async (t) => { renewed.push(`renew:${t.accessToken}`); return tokens({ accessToken: "access-renewed", refreshToken: null, refreshExpiresAt: null, accessExpiresAt: new Date(NOW.getTime() + 60 * DAY) }); },
          canRefresh: (t, now) => t.accessExpiresAt !== null && t.accessExpiresAt.getTime() > now.getTime(),
          refreshWindowMs: 14 * DAY,
        },
        "instagram",
        {
          exchangeCode: async () => tokens({ refreshToken: null, refreshExpiresAt: null, accessExpiresAt: new Date(NOW.getTime() + 60 * DAY) }),
        },
      );

      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() + 9 * DAY); // inside the two-week window
      expect(await syncAccount(deps, ALICE)).toMatchObject({ status: "synced" });

      expect(renewed).toEqual(["renew:access-1"]);
      expect(store.connections.get(ALICE)).toMatchObject({
        accessTokenSealed: `sealed(${ALICE}:instagram:access)[access-renewed]`,
        refreshTokenSealed: null,
      });
    });

    it("ask the creator to reconnect when an Instagram token has already run out", async () => {
      const { deps, store } = await connected(
        { canRefresh: (t, now) => t.accessExpiresAt !== null && t.accessExpiresAt.getTime() > now.getTime(), refreshWindowMs: 14 * DAY },
        "instagram",
        { exchangeCode: async () => tokens({ refreshToken: null, refreshExpiresAt: null }) },
      );
      store.connections.get(ALICE)!.tokenExpiresAt = new Date(NOW.getTime() - 1000);
      expect(await syncAccount(deps, ALICE)).toEqual({ status: "needs_reauth" });
      expect(store.connections.get(ALICE)!.lastError).toBe("Reconnect Instagram to keep your stats up to date.");
    });

    it("are never renewed when the platform says they don't expire (a Facebook Page)", async () => {
      const { deps, store, calls } = await connected(
        { refreshWindowMs: 0, canRefresh: () => false },
        "facebook",
        { exchangeCode: async () => tokens({ refreshToken: null, refreshExpiresAt: null, accessExpiresAt: null }) },
      );
      expect(store.connections.get(ALICE)!.tokenExpiresAt).toBeNull();
      expect(await syncAccount(deps, ALICE)).toMatchObject({ status: "synced" });
      expect(calls.some((c) => c.startsWith("refresh:"))).toBe(false);
    });

    it("can't be opened by a different platform's connection (they are sealed per platform)", async () => {
      const { deps, store } = await connected();
      const row = store.connections.get(ALICE)!;
      row.accessTokenSealed = vault.seal("access-1", `${ALICE}:instagram:access`); // sealed for another platform
      expect(await syncAccount(deps, ALICE)).toEqual({ status: "error" });
      expect(row.lastError).toBe("Sync failed");
    });
  });

  it("records a platform hiccup without exposing anything but the error code", async () => {
    const { deps, store } = await connected({
      fetchAccount: async () => { throw new ProviderApiError("tiktok", "rate_limit_exceeded", "rate_limit", 429, "L7"); },
    });
    expect(await syncAccount(deps, ALICE)).toEqual({ status: "error" });
    const c = store.connections.get(ALICE)!;
    expect(c.status).toBe("error");
    expect(c.lastError).toBe("TikTok: rate_limit_exceeded");
    expect(c.lastError).not.toContain("access-1");
  });

  it("recovers on the next successful sync", async () => {
    let fail = true;
    const { deps, store } = await connected({
      fetchAccount: async () => { if (fail) throw new ProviderApiError("tiktok", "internal_error", "transient", 500); return account(); },
    });
    await syncAccount(deps, ALICE);
    expect(store.connections.get(ALICE)!.status).toBe("error");
    fail = false;
    await syncAccount(deps, ALICE);
    expect(store.connections.get(ALICE)).toMatchObject({ status: "connected", lastError: undefined });
  });

  it("does nothing for a creator who isn't connected", async () => {
    const { deps } = setup();
    expect(await syncAccount(deps, ALICE)).toEqual({ status: "not_connected" });
  });

  it("does not run twice at once, and always lets go of the lock", async () => {
    const { deps, store } = await connected();
    store.connections.get(ALICE)!.locked = true; // a sync is already running
    expect(await syncAccount(deps, ALICE)).toEqual({ status: "busy" });

    store.connections.get(ALICE)!.locked = false;
    await syncAccount(deps, ALICE);
    expect(store.connections.get(ALICE)!.locked).toBe(false);

    const failing = await connected({ fetchAccount: async () => { throw new Error("boom"); } });
    await syncAccount(failing.deps, ALICE);
    expect(failing.store.connections.get(ALICE)!.locked).toBe(false);
  });
});

describe("the nightly job", () => {
  it("syncs everyone due and tallies what happened", async () => {
    const s = setup({
      fetchAccount: async (t) => {
        if (t.accessToken === "access-bob") throw new ProviderApiError("tiktok", "internal_error", "transient", 500);
        return account();
      },
    });
    for (const [id, token] of [[ALICE, "access-1"], [BOB, "access-bob"]] as const) {
      s.store.connections.set(id, {
        platformUserId: id, accessTokenSealed: vault.seal(token, `${id}:tiktok:access`), refreshTokenSealed: vault.seal("r", `${id}:tiktok:refresh`),
        tokenExpiresAt: new Date(NOW.getTime() + 3600_000), refreshTokenExpiresAt: new Date(NOW.getTime() + 9e9),
        scopes: ["user.info.basic", "user.info.stats", "video.list"], status: "connected", disconnectedAt: null,
      });
    }
    expect(await syncDueAccounts(s.deps)).toEqual({ attempted: 2, synced: 1, needsReauth: 0, errors: 1, busy: 0 });
  });
});

describe("disconnecting", () => {
  it("revokes at the platform, then clears tokens and data", async () => {
    const s = setup();
    const { state } = await begin(s.deps);
    await completeConnect(s.deps, { userId: ALICE, code: "c", state });
    s.calls.length = 0;

    await disconnectAccount(s.deps, ALICE);

    expect(s.calls).toEqual(["revoke:access-1"]);
    expect(s.store.wiped).toEqual([ALICE]);
    expect(s.store.connections.get(ALICE)).toMatchObject({ accessTokenSealed: null, refreshTokenSealed: null });
  });

  it("gives the platform the refresh token too, for those that revoke by it (YouTube)", async () => {
    let seen: ProviderTokens | undefined;
    const s = setup({ revoke: async (t) => { seen = t; } }, "youtube");
    const { state } = await begin(s.deps);
    await completeConnect(s.deps, { userId: ALICE, code: "c", state });
    await disconnectAccount(s.deps, ALICE);
    expect(seen).toMatchObject({ accessToken: "access-1", refreshToken: "refresh-1" });
  });

  it("carries on when the platform can't be reached", async () => {
    const s = setup({ revoke: async () => { throw new ProviderApiError("tiktok", "network_error", "transient", 0); } });
    const { state } = await begin(s.deps);
    await completeConnect(s.deps, { userId: ALICE, code: "c", state });
    await disconnectAccount(s.deps, ALICE);
    expect(s.store.wiped).toEqual([ALICE]);
  });

  it("is harmless when nothing is connected, or when called twice", async () => {
    const s = setup();
    await disconnectAccount(s.deps, ALICE);
    expect(s.store.wiped).toEqual([]);

    const { state } = await begin(s.deps);
    await completeConnect(s.deps, { userId: ALICE, code: "c", state });
    await disconnectAccount(s.deps, ALICE);
    await disconnectAccount(s.deps, ALICE);
    expect(s.store.wiped).toEqual([ALICE]);
  });
});
