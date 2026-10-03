import { describe, expect, it } from "vitest";
import { ProviderApiError, type ProviderConfig, type ProviderTokens } from "./types";
import { createFacebookAdapter, FACEBOOK_SCOPES } from "./facebook";
import { createInstagramAdapter, INSTAGRAM_SCOPES } from "./instagram";
import { createThreadsAdapter, THREADS_SCOPES } from "./threads";
import { createTikTokAdapter } from "./tiktok";
import { createYouTubeAdapter, parseIsoDuration, YOUTUBE_SCOPES } from "./youtube";

// Each adapter, against a fake `fetch` that answers the way the platform's documentation says it does
// (Instagram Login, Threads API, Facebook Login + Pages, Google OAuth + YouTube Data API, TikTok Login Kit).
// Nothing here touches the network. Fake values only: real keys live in the deployment's environment.

const NOW = new Date("2026-10-03T12:00:00Z");
const DAY = 24 * 3600 * 1000;
const SECRET = "app-secret-DO-NOT-LEAK";
const config = (over: Partial<ProviderConfig> = {}): ProviderConfig => ({
  clientId: "app-id",
  clientSecret: SECRET,
  redirectUri: "https://app.example.test/auth/x/callback",
  ...over,
});

type Call = { method: string; url: URL; body: string; headers: Record<string, string> };
type Reply = { status?: number; body?: unknown } | Error;

/** A fake `fetch`: records every request and answers with whatever `handler` returns for it. */
function stub(handler: (call: Call) => Reply) {
  const calls: Call[] = [];
  const fn = (async (input: unknown, init?: RequestInit) => {
    const call: Call = {
      method: init?.method ?? "GET",
      url: new URL(String(input)),
      body: String(init?.body ?? ""),
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
    };
    calls.push(call);
    const reply = handler(call);
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status ?? 200 });
  }) as typeof fetch;
  return { fn, calls };
}
const form = (call: Call) => Object.fromEntries(new URLSearchParams(call.body));
const param = (call: Call, name: string) => call.url.searchParams.get(name);

const tokens = (over: Partial<ProviderTokens> = {}): ProviderTokens => ({
  accessToken: "access-1",
  refreshToken: null,
  accessExpiresAt: new Date(NOW.getTime() + 30 * DAY),
  refreshExpiresAt: null,
  scopes: ["s"],
  ...over,
});
const metaError = (code: number, extra: Record<string, unknown> = {}) => ({
  status: 400,
  body: { error: { message: "do not expose", type: "OAuthException", code, fbtrace_id: "TRACE", ...extra } },
});

// ─── Instagram ──────────────────────────────────────────────────────────────

describe("Instagram", () => {
  const make = (fn: typeof fetch, over: Partial<ProviderConfig> = {}) => createInstagramAdapter(config(over), fn, () => NOW);

  it("sends the creator to Instagram's sign-in for exactly the two permissions", () => {
    const url = new URL(make(stub(() => ({})).fn).authorizeUrl("w.state1"));
    expect(`${url.origin}${url.pathname}`).toBe("https://www.instagram.com/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("app-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.example.test/auth/x/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("instagram_business_basic,instagram_business_manage_insights");
    expect(url.searchParams.get("state")).toBe("w.state1");
    expect([...INSTAGRAM_SCOPES]).toEqual(["instagram_business_basic", "instagram_business_manage_insights"]);
  });

  describe("exchanging the code", () => {
    const reply = (shortBody: unknown) =>
      stub((c) => {
        if (c.url.host === "api.instagram.com") return { body: shortBody };
        if (c.url.host === "graph.instagram.com" && c.url.pathname === "/access_token") return { body: { access_token: "long-token", token_type: "bearer", expires_in: 5183944 } };
        return { status: 404 };
      });

    it("trades the code for a short-lived token, then that for the 60-day one", async () => {
      const { fn, calls } = reply({ data: [{ access_token: "short-token", user_id: 1789, permissions: "instagram_business_basic,instagram_business_manage_insights" }] });
      const result = await make(fn).exchangeCode("the-code");

      expect(calls).toHaveLength(2);
      expect(calls[0]!.method).toBe("POST");
      expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://api.instagram.com/oauth/access_token");
      expect(form(calls[0]!)).toEqual({
        client_id: "app-id",
        client_secret: SECRET,
        grant_type: "authorization_code",
        redirect_uri: "https://app.example.test/auth/x/callback",
        code: "the-code",
      });
      expect(`${calls[1]!.url.origin}${calls[1]!.url.pathname}`).toBe("https://graph.instagram.com/access_token");
      expect(param(calls[1]!, "grant_type")).toBe("ig_exchange_token");
      expect(param(calls[1]!, "client_secret")).toBe(SECRET);
      expect(param(calls[1]!, "access_token")).toBe("short-token");

      expect(result).toEqual({
        accessToken: "long-token",
        refreshToken: null,
        accessExpiresAt: new Date(NOW.getTime() + 5183944 * 1000),
        refreshExpiresAt: null,
        scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      });
    });

    it("reads the older, flatter reply too, and keeps only the permissions that were granted", async () => {
      const { fn } = reply({ access_token: "short-token", user_id: 1789, permissions: "instagram_business_basic" });
      expect((await make(fn).exchangeCode("c")).scopes).toEqual(["instagram_business_basic"]);
    });

    it("says so when Instagram refuses the code", async () => {
      const { fn } = stub(() => ({ status: 400, body: { error_type: "OAuthException", code: 400, error_message: "Invalid authorization code" } }));
      await expect(make(fn).exchangeCode("stale")).rejects.toMatchObject({ provider: "instagram", code: "400", kind: "rejected" });
    });

    it("never puts the app secret in an error", async () => {
      const { fn } = stub(() => ({ status: 400, body: { error_type: "OAuthException", code: 400, error_message: `bad secret ${SECRET}` } }));
      const err = await make(fn).exchangeCode("c").catch((e: Error) => e);
      expect(String(err)).not.toContain(SECRET);
    });
  });

  describe("renewing", () => {
    it("asks Instagram to extend the 60-day token with itself", async () => {
      const { fn, calls } = stub(() => ({ body: { access_token: "renewed", token_type: "bearer", expires_in: 5184000 } }));
      const old = tokens({ accessToken: "old-token", scopes: ["instagram_business_basic"] });
      const fresh = await make(fn).refresh(old);
      expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://graph.instagram.com/refresh_access_token");
      expect(param(calls[0]!, "grant_type")).toBe("ig_refresh_token");
      expect(param(calls[0]!, "access_token")).toBe("old-token");
      expect(fresh).toMatchObject({ accessToken: "renewed", refreshToken: null, scopes: ["instagram_business_basic"] });
      expect(fresh.accessExpiresAt).toEqual(new Date(NOW.getTime() + 5184000 * 1000));
    });

    it("can renew only while the token hasn't run out", () => {
      const a = make(stub(() => ({})).fn);
      expect(a.canRefresh(tokens({ accessExpiresAt: new Date(NOW.getTime() + 5 * DAY) }), NOW)).toBe(true);
      expect(a.canRefresh(tokens({ accessExpiresAt: new Date(NOW.getTime() - 1000) }), NOW)).toBe(false);
      expect(a.canRefresh(tokens({ accessExpiresAt: null }), NOW)).toBe(false);
    });
  });

  it("reads the profile", async () => {
    const { fn, calls } = stub(() => ({
      body: { user_id: "1789", username: "amara.makes", name: "Amara", account_type: "CREATOR", profile_picture_url: "https://p/a.jpg", followers_count: 1200, follows_count: 80, media_count: 45 },
    }));
    const account = await make(fn).fetchAccount(tokens());
    expect(calls[0]!.url.pathname).toBe("/v25.0/me");
    expect(param(calls[0]!, "access_token")).toBe("access-1");
    expect(param(calls[0]!, "fields")).toContain("followers_count");
    expect(account).toEqual({ externalId: "1789", name: "Amara", handle: "amara.makes", avatarUrl: "https://p/a.jpg", followers: 1200, following: 80, likes: null, posts: 45 });
  });

  it("falls back to the username when there is no display name, and doesn't invent counts", async () => {
    const { fn } = stub(() => ({ body: { user_id: 5, username: "just.a.handle" } }));
    expect(await make(fn).fetchAccount(tokens())).toMatchObject({ externalId: "5", name: "just.a.handle", followers: null, posts: null });
  });

  describe("reading posts", () => {
    const media = {
      data: [
        { id: "m1", caption: "First line\nsecond line", media_type: "VIDEO", media_product_type: "REELS", permalink: "https://www.instagram.com/reel/abc/", thumbnail_url: "https://t/1.jpg", timestamp: "2026-10-01T10:00:00+0000", like_count: 50, comments_count: 4 },
        { id: "m2", media_type: "IMAGE", media_url: "https://m/2.jpg", timestamp: "2026-09-30T10:00:00+0000", like_count: 5, comments_count: 0 },
      ],
      paging: { cursors: { before: "B", after: "CUR2" }, next: "https://graph.instagram.com/v25.0/me/media?after=CUR2" },
    };
    const insights = (views: number) => ({
      data: [
        { name: "views", period: "lifetime", values: [{ value: views }] },
        { name: "reach", period: "lifetime", values: [{ value: 800 }] },
        { name: "saved", period: "lifetime", values: [{ value: 7 }] },
        { name: "shares", period: "lifetime", values: [{ value: 3 }] },
      ],
    });

    it("maps each post with the numbers Instagram gives", async () => {
      const { fn, calls } = stub((c) => {
        if (c.url.pathname === "/v25.0/me/media") return { body: media };
        if (c.url.pathname === "/v25.0/m1/insights") return { body: insights(1000) };
        // an image Instagram won't give insights for: that post just has none
        if (c.url.pathname === "/v25.0/m2/insights") return metaError(100);
        return { status: 404 };
      });
      const page = await make(fn).fetchPosts(tokens(), { externalId: "1789" } as never, { cursor: null, limit: 20 });

      expect(param(calls[0]!, "limit")).toBe("20");
      expect(param(calls[0]!, "after")).toBeNull();
      expect(page.posts).toEqual([
        {
          id: "m1", title: "First line", postedAt: new Date("2026-10-01T10:00:00Z"), coverUrl: "https://t/1.jpg",
          shareUrl: "https://www.instagram.com/reel/abc/", durationSeconds: null, views: 1000, likes: 50, comments: 4, shares: 3, saves: 7,
        },
        {
          id: "m2", title: "", postedAt: new Date("2026-09-30T10:00:00Z"), coverUrl: "https://m/2.jpg",
          shareUrl: null, durationSeconds: null, views: null, likes: 5, comments: 0, shares: null, saves: null,
        },
      ]);
      expect(page).toMatchObject({ cursor: "CUR2", hasMore: true });
    });

    it("continues from the cursor it was given, and stops at the last page", async () => {
      const { fn, calls } = stub((c) => (c.url.pathname.endsWith("/me/media") ? { body: { data: [], paging: { cursors: { after: "X" } } } } : { body: {} }));
      const page = await make(fn).fetchPosts(tokens(), { externalId: "1" } as never, { cursor: "CUR2", limit: 20 });
      expect(param(calls[0]!, "after")).toBe("CUR2");
      expect(page).toEqual({ posts: [], cursor: null, hasMore: false });
    });

    it("lets a dead token through (the creator must reconnect) instead of hiding it as a missing number", async () => {
      const { fn } = stub((c) => (c.url.pathname.endsWith("/me/media") ? { body: media } : metaError(190, { error_subcode: 463 })));
      await expect(make(fn).fetchPosts(tokens(), { externalId: "1" } as never, { cursor: null, limit: 20 })).rejects.toMatchObject({ kind: "reauth", code: "190" });
    });
  });

  it("classifies Meta's errors by what the creator or the server can do about them", async () => {
    const kind = async (reply: Reply) => ((await make(stub(() => reply).fn).fetchAccount(tokens()).catch((e: ProviderApiError) => e)) as ProviderApiError).kind;
    expect(await kind(metaError(190))).toBe("reauth");
    expect(await kind(metaError(10))).toBe("scope");
    expect(await kind(metaError(200))).toBe("scope");
    expect(await kind(metaError(4))).toBe("rate_limit");
    expect(await kind(metaError(80002))).toBe("rate_limit");
    expect(await kind(metaError(2))).toBe("transient");
    expect(await kind({ status: 503, body: null })).toBe("transient");
    expect(await kind(new Error("socket hang up"))).toBe("transient");
    expect(await kind(metaError(100))).toBe("rejected");
  });

  it("keeps only the error code and Meta's trace id", async () => {
    const err = (await make(stub(() => metaError(190)).fn).fetchAccount(tokens()).catch((e: ProviderApiError) => e)) as ProviderApiError;
    expect(err).toBeInstanceOf(ProviderApiError);
    expect(err).toMatchObject({ provider: "instagram", code: "190", logId: "TRACE", httpStatus: 400 });
    expect(err.message).not.toContain("do not expose");
  });

  it("can't revoke (Instagram has no endpoint for it) and says nothing", async () => {
    const { fn, calls } = stub(() => ({}));
    await make(fn).revoke(tokens());
    expect(calls).toEqual([]);
  });

  describe("through the local stand-in", () => {
    const local = { mockOrigin: "http://127.0.0.1:4010/instagram" };

    it("sends the creator to the stand-in's sign-in page, under Instagram's own host name", () => {
      const url = new URL(make(stub(() => ({})).fn, local).authorizeUrl("w.s"));
      expect(`${url.origin}${url.pathname}`).toBe("http://127.0.0.1:4010/instagram/www.instagram.com/oauth/authorize");
    });

    it("sends every call that would go to Instagram to the stand-in, and only those", async () => {
      const seen: string[] = [];
      const { fn } = stub((c) => {
        seen.push(c.url.href);
        return c.url.pathname.endsWith("/oauth/access_token") ? { body: { access_token: "s", user_id: 1, permissions: "instagram_business_basic" } } : { body: { access_token: "l", expires_in: 100 } };
      });
      await make(fn, local).exchangeCode("c");
      expect(seen[0]).toBe("http://127.0.0.1:4010/instagram/api.instagram.com/oauth/access_token");
      expect(seen[1]!.startsWith("http://127.0.0.1:4010/instagram/graph.instagram.com/access_token?")).toBe(true);
    });
  });
});

// ─── Threads ────────────────────────────────────────────────────────────────

describe("Threads", () => {
  const make = (fn: typeof fetch, over: Partial<ProviderConfig> = {}) => createThreadsAdapter(config(over), fn, () => NOW);

  it("sends the creator to Threads' sign-in for exactly the two permissions", () => {
    const url = new URL(make(stub(() => ({})).fn).authorizeUrl("w.state1"));
    expect(`${url.origin}${url.pathname}`).toBe("https://threads.com/oauth/authorize");
    expect(url.searchParams.get("scope")).toBe("threads_basic,threads_manage_insights");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("w.state1");
    expect([...THREADS_SCOPES]).toEqual(["threads_basic", "threads_manage_insights"]);
  });

  it("trades the code for a short-lived token, then that for the 60-day one", async () => {
    const { fn, calls } = stub((c) =>
      c.url.pathname === "/oauth/access_token"
        ? { body: { access_token: "short", user_id: 99 } }
        : { body: { access_token: "long", token_type: "bearer", expires_in: 5184000 } },
    );
    const result = await make(fn).exchangeCode("the-code");

    expect(calls[0]!.method).toBe("POST");
    expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://graph.threads.com/oauth/access_token");
    expect(form(calls[0]!)).toEqual({
      client_id: "app-id", client_secret: SECRET, code: "the-code", grant_type: "authorization_code", redirect_uri: "https://app.example.test/auth/x/callback",
    });
    expect(`${calls[1]!.url.origin}${calls[1]!.url.pathname}`).toBe("https://graph.threads.com/access_token");
    expect(param(calls[1]!, "grant_type")).toBe("th_exchange_token");
    expect(param(calls[1]!, "access_token")).toBe("short");
    expect(result).toMatchObject({ accessToken: "long", refreshToken: null, scopes: ["threads_basic", "threads_manage_insights"] });
    expect(result.accessExpiresAt).toEqual(new Date(NOW.getTime() + 5184000 * 1000));
  });

  it("extends the long-lived token with itself", async () => {
    const { fn, calls } = stub(() => ({ body: { access_token: "renewed", expires_in: 5184000 } }));
    const fresh = await make(fn).refresh(tokens({ accessToken: "old", scopes: ["threads_basic"] }));
    expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://graph.threads.com/refresh_access_token");
    expect(param(calls[0]!, "grant_type")).toBe("th_refresh_token");
    expect(param(calls[0]!, "access_token")).toBe("old");
    expect(fresh).toMatchObject({ accessToken: "renewed", scopes: ["threads_basic"] });
  });

  describe("the profile", () => {
    const profile = { id: "99", username: "amara", name: "Amara", threads_profile_picture_url: "https://t/p.jpg" };

    it("reads the profile and the follower count", async () => {
      const { fn, calls } = stub((c) =>
        c.url.pathname === "/v1.0/me" ? { body: profile } : { body: { data: [{ name: "followers_count", period: "lifetime", total_value: { value: 321 } }] } },
      );
      expect(await make(fn).fetchAccount(tokens())).toEqual({
        externalId: "99", name: "Amara", handle: "amara", avatarUrl: "https://t/p.jpg", followers: 321, following: null, likes: null, posts: null,
      });
      expect(calls[1]!.url.pathname).toBe("/v1.0/99/threads_insights");
      expect(param(calls[1]!, "metric")).toBe("followers_count");
    });

    it("still reads the profile when the insights permission wasn't granted", async () => {
      const { fn } = stub((c) => (c.url.pathname === "/v1.0/me" ? { body: profile } : metaError(10)));
      expect(await make(fn).fetchAccount(tokens())).toMatchObject({ externalId: "99", followers: null });
    });

    it("does not hide a dead token behind a missing follower count", async () => {
      const { fn } = stub((c) => (c.url.pathname === "/v1.0/me" ? { body: profile } : metaError(190)));
      await expect(make(fn).fetchAccount(tokens())).rejects.toMatchObject({ kind: "reauth" });
    });
  });

  it("reads posts with their insights; shares count reposts and quotes too", async () => {
    const { fn } = stub((c) => {
      if (c.url.pathname === "/v1.0/me/threads") {
        return { body: { data: [{ id: "t1", text: "Hello threads\nmore", media_type: "TEXT_POST", permalink: "https://www.threads.com/@amara/post/abc", timestamp: "2026-10-02T09:00:00+0000" }], paging: { cursors: { after: "A" } } } };
      }
      return {
        body: {
          data: ["views:500", "likes:40", "replies:6", "reposts:2", "quotes:1", "shares:3"].map((s) => ({ name: s.split(":")[0], period: "lifetime", values: [{ value: Number(s.split(":")[1]) }] })),
        },
      };
    });
    const page = await make(fn).fetchPosts(tokens(), { externalId: "99" } as never, { cursor: null, limit: 20 });
    expect(page.posts).toEqual([
      {
        id: "t1", title: "Hello threads", postedAt: new Date("2026-10-02T09:00:00Z"), coverUrl: null,
        shareUrl: "https://www.threads.com/@amara/post/abc", durationSeconds: null, views: 500, likes: 40, comments: 6, shares: 6, saves: null,
      },
    ]);
    expect(page).toMatchObject({ cursor: null, hasMore: false });
  });

  it("through the stand-in: authorize and API calls go to it under Threads' own host names", async () => {
    const local = { mockOrigin: "http://127.0.0.1:4010/threads" };
    const url = new URL(make(stub(() => ({})).fn, local).authorizeUrl("w.s"));
    expect(`${url.origin}${url.pathname}`).toBe("http://127.0.0.1:4010/threads/threads.com/oauth/authorize");
    const { fn, calls } = stub(() => ({ body: { id: "1", username: "u" } }));
    await make(fn, local).fetchAccount(tokens());
    expect(calls[0]!.url.href.startsWith("http://127.0.0.1:4010/threads/graph.threads.com/v1.0/me?")).toBe(true);
  });
});

// ─── Facebook ───────────────────────────────────────────────────────────────

describe("Facebook", () => {
  const make = (fn: typeof fetch, over: Partial<ProviderConfig> = {}) => createFacebookAdapter(config(over), fn);

  it("sends the creator to Facebook Login for the three Page permissions", () => {
    const url = new URL(make(stub(() => ({})).fn).authorizeUrl("w.state1"));
    expect(`${url.origin}${url.pathname}`).toBe("https://www.facebook.com/v25.0/dialog/oauth");
    expect(url.searchParams.get("scope")).toBe("pages_show_list,pages_read_engagement,read_insights");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect([...FACEBOOK_SCOPES]).toEqual(["pages_show_list", "pages_read_engagement", "read_insights"]);
  });

  describe("exchanging the code", () => {
    const reply = (pages: unknown[]) =>
      stub((c) => {
        if (c.url.pathname === "/v25.0/oauth/access_token") {
          return param(c, "grant_type") === "fb_exchange_token"
            ? { body: { access_token: "user-long", token_type: "bearer", expires_in: 5184000 } }
            : { body: { access_token: "user-short", token_type: "bearer", expires_in: 5000 } };
        }
        if (c.url.pathname === "/v25.0/me/accounts") return { body: { data: pages } };
        return { status: 404 };
      });

    it("trades the code for the person's long-lived token, then connects their biggest Page with that Page's own token", async () => {
      const { fn, calls } = reply([
        { id: "P1", name: "Small Page", access_token: "page-token-1", followers_count: 50 },
        { id: "P2", name: "Big Page", access_token: "page-token-2", followers_count: 5000 },
        { id: "P3", name: "No token, so no use" },
      ]);
      const result = await make(fn).exchangeCode("the-code");

      expect(calls[0]!.method).toBe("GET");
      expect(param(calls[0]!, "code")).toBe("the-code");
      expect(param(calls[0]!, "client_id")).toBe("app-id");
      expect(param(calls[0]!, "client_secret")).toBe(SECRET);
      expect(param(calls[0]!, "redirect_uri")).toBe("https://app.example.test/auth/x/callback");
      expect(param(calls[1]!, "grant_type")).toBe("fb_exchange_token");
      expect(param(calls[1]!, "fb_exchange_token")).toBe("user-short");
      expect(calls[2]!.url.pathname).toBe("/v25.0/me/accounts");
      expect(param(calls[2]!, "access_token")).toBe("user-long");

      // the person's own token is not kept: only the Page's
      expect(result).toEqual({ accessToken: "page-token-2", refreshToken: null, accessExpiresAt: null, refreshExpiresAt: null, scopes: [...FACEBOOK_SCOPES] });
    });

    it("says so when the person manages no Page", async () => {
      await expect(make(reply([]).fn).exchangeCode("c")).rejects.toMatchObject({ provider: "facebook", code: "no_page", kind: "rejected" });
    });

    it("says so when none of their Pages can be read", async () => {
      await expect(make(reply([{ id: "P3", name: "No token" }]).fn).exchangeCode("c")).rejects.toMatchObject({ code: "no_page" });
    });
  });

  it("never renews: a Page token made from a long-lived token doesn't run out", async () => {
    const a = make(stub(() => ({})).fn);
    expect(a.canRefresh(tokens({ accessExpiresAt: null }), NOW)).toBe(false);
    expect(a.refreshWindowMs).toBe(0);
    const same = tokens();
    expect(await a.refresh(same)).toBe(same);
  });

  it("reads the Page: followers (not just likes), picture, handle", async () => {
    const { fn, calls } = stub(() => ({
      body: { id: "P2", name: "Big Page", username: "bigpage", followers_count: 5000, fan_count: 4900, picture: { data: { url: "https://p/pic.jpg" } } },
    }));
    expect(await make(fn).fetchAccount(tokens({ accessToken: "page-token-2" }))).toEqual({
      externalId: "P2", name: "Big Page", handle: "bigpage", avatarUrl: "https://p/pic.jpg", followers: 5000, following: null, likes: 4900, posts: null,
    });
    expect(calls[0]!.url.pathname).toBe("/v25.0/me");
    expect(param(calls[0]!, "access_token")).toBe("page-token-2");
  });

  it("reads posts: reactions, comments, shares, and views from the media-views metric", async () => {
    const { fn, calls } = stub((c) => {
      if (c.url.pathname === "/v25.0/me/posts") {
        return {
          body: {
            data: [{
              id: "P2_1", message: "Big news\nmore", created_time: "2026-10-01T10:00:00+0000", permalink_url: "https://www.facebook.com/P2/posts/1", full_picture: "https://i/1.jpg",
              shares: { count: 9 }, reactions: { summary: { total_count: 120 } }, comments: { summary: { total_count: 12 } },
            }],
            paging: { cursors: { before: "B", after: "A" }, next: "https://graph.facebook.com/…" },
          },
        };
      }
      return { body: { data: [{ name: "post_media_view", period: "lifetime", values: [{ value: 4321 }] }] } };
    });
    const page = await make(fn).fetchPosts(tokens(), { externalId: "P2" } as never, { cursor: null, limit: 20 });
    expect(page.posts).toEqual([
      {
        id: "P2_1", title: "Big news", postedAt: new Date("2026-10-01T10:00:00Z"), coverUrl: "https://i/1.jpg", shareUrl: "https://www.facebook.com/P2/posts/1",
        durationSeconds: null, views: 4321, likes: 120, comments: 12, shares: 9, saves: null,
      },
    ]);
    expect(page).toMatchObject({ cursor: "A", hasMore: true });
    expect(param(calls[1]!, "metric")).toBe("post_media_view");
  });

  it("keeps the likes and comments when Meta changes the views metric again", async () => {
    const { fn } = stub((c) =>
      c.url.pathname === "/v25.0/me/posts"
        ? { body: { data: [{ id: "P2_1", message: "x", reactions: { summary: { total_count: 3 } }, comments: { summary: { total_count: 1 } } }] } }
        : metaError(100),
    );
    const page = await make(fn).fetchPosts(tokens(), { externalId: "P2" } as never, { cursor: null, limit: 20 });
    expect(page.posts[0]).toMatchObject({ views: null, likes: 3, comments: 1, shares: 0 });
  });

  it("through the stand-in: Facebook's dialog and Graph hosts both go to it", async () => {
    const local = { mockOrigin: "http://127.0.0.1:4010/facebook" };
    const url = new URL(make(stub(() => ({})).fn, local).authorizeUrl("w.s"));
    expect(`${url.origin}${url.pathname}`).toBe("http://127.0.0.1:4010/facebook/www.facebook.com/v25.0/dialog/oauth");
    const { fn, calls } = stub(() => ({ body: { id: "P" } }));
    await make(fn, local).fetchAccount(tokens());
    expect(calls[0]!.url.href.startsWith("http://127.0.0.1:4010/facebook/graph.facebook.com/v25.0/me?")).toBe(true);
  });
});

// ─── YouTube (Google) ───────────────────────────────────────────────────────

describe("YouTube", () => {
  const make = (fn: typeof fetch, over: Partial<ProviderConfig> = {}) => createYouTubeAdapter(config(over), fn, () => NOW);
  const SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
  const googleTokens = { access_token: "ya29.a", expires_in: 3599, refresh_token: "1//refresh", scope: SCOPE, token_type: "Bearer" };

  it("sends the creator to Google for read-only YouTube access, asking for a refresh token", () => {
    const url = new URL(make(stub(() => ({})).fn).authorizeUrl("w.state1"));
    expect(`${url.origin}${url.pathname}`).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("scope")).toBe(SCOPE);
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("w.state1");
    expect([...YOUTUBE_SCOPES]).toEqual([SCOPE]);
  });

  describe("exchanging the code", () => {
    it("gets an access token and a refresh token", async () => {
      const { fn, calls } = stub(() => ({ body: googleTokens }));
      const result = await make(fn).exchangeCode("the-code");
      expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://oauth2.googleapis.com/token");
      expect(form(calls[0]!)).toEqual({
        code: "the-code", client_id: "app-id", client_secret: SECRET, redirect_uri: "https://app.example.test/auth/x/callback", grant_type: "authorization_code",
      });
      expect(result).toEqual({
        accessToken: "ya29.a", refreshToken: "1//refresh", accessExpiresAt: new Date(NOW.getTime() + 3599 * 1000), refreshExpiresAt: null, scopes: [SCOPE],
      });
    });

    it("refuses a grant that came without a refresh token (it would die within the hour)", async () => {
      const { fn } = stub(() => ({ body: { ...googleTokens, refresh_token: undefined } }));
      await expect(make(fn).exchangeCode("c")).rejects.toMatchObject({ provider: "youtube", code: "no_refresh_token" });
    });

    it("reports the permissions the person actually granted", async () => {
      const { fn } = stub(() => ({ body: { ...googleTokens, scope: "openid" } }));
      expect((await make(fn).exchangeCode("c")).scopes).toEqual(["openid"]);
    });
  });

  describe("renewing", () => {
    it("uses the refresh token, and keeps it when Google sends no new one", async () => {
      const { fn, calls } = stub(() => ({ body: { access_token: "ya29.b", expires_in: 3599, scope: SCOPE, token_type: "Bearer" } }));
      const fresh = await make(fn).refresh(tokens({ refreshToken: "1//refresh", scopes: [SCOPE] }));
      expect(form(calls[0]!)).toEqual({ refresh_token: "1//refresh", client_id: "app-id", client_secret: SECRET, grant_type: "refresh_token" });
      expect(fresh).toMatchObject({ accessToken: "ya29.b", refreshToken: "1//refresh", scopes: [SCOPE] });
      expect(fresh.accessExpiresAt).toEqual(new Date(NOW.getTime() + 3599 * 1000));
    });

    it("can renew whenever it holds a refresh token", () => {
      const a = make(stub(() => ({})).fn);
      expect(a.canRefresh(tokens({ refreshToken: "1//r" }), NOW)).toBe(true);
      expect(a.canRefresh(tokens({ refreshToken: null }), NOW)).toBe(false);
    });

    it("asks for the connection to be remade when Google says the grant is gone (a Testing-mode week is up, or access was removed)", async () => {
      const { fn } = stub(() => ({ status: 400, body: { error: "invalid_grant", error_description: "Token has been expired or revoked." } }));
      await expect(make(fn).refresh(tokens({ refreshToken: "1//old" }))).rejects.toMatchObject({ provider: "youtube", code: "invalid_grant", kind: "reauth" });
    });
  });

  describe("the channel", () => {
    const channel = {
      items: [{
        id: "UCabc",
        snippet: { title: "Amara Makes", customUrl: "@amaramakes", thumbnails: { default: { url: "https://yt/d.jpg" }, high: { url: "https://yt/h.jpg" } } },
        statistics: { viewCount: "1000", subscriberCount: "2500", hiddenSubscriberCount: false, videoCount: "12" },
      }],
    };

    it("reads it with the creator's own token", async () => {
      const { fn, calls } = stub(() => ({ body: channel }));
      expect(await make(fn).fetchAccount(tokens({ accessToken: "ya29.a" }))).toEqual({
        externalId: "UCabc", name: "Amara Makes", handle: "amaramakes", avatarUrl: "https://yt/h.jpg", followers: 2500, following: null, likes: null, posts: 12,
      });
      expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://www.googleapis.com/youtube/v3/channels");
      expect(param(calls[0]!, "mine")).toBe("true");
      expect(param(calls[0]!, "part")).toBe("snippet,statistics");
      expect(calls[0]!.headers.authorization).toBe("Bearer ya29.a");
    });

    it("doesn't invent a subscriber count the creator has hidden", async () => {
      const hidden = { items: [{ ...channel.items[0]!, statistics: { subscriberCount: "0", hiddenSubscriberCount: true, videoCount: "3" } }] };
      expect(await make(stub(() => ({ body: hidden })).fn).fetchAccount(tokens())).toMatchObject({ followers: null, posts: 3 });
    });

    it("says so when the Google account has no channel", async () => {
      await expect(make(stub(() => ({ body: { items: [] } })).fn).fetchAccount(tokens())).rejects.toMatchObject({ code: "no_channel" });
    });
  });

  describe("videos", () => {
    const video = (id: string, published: string, duration: string, views: string) => ({
      id,
      snippet: { title: `Video ${id}`, publishedAt: published, thumbnails: { medium: { url: `https://yt/${id}.jpg` } } },
      statistics: { viewCount: views, likeCount: "10", commentCount: "1" },
      contentDetails: { duration },
    });

    it("lists the uploads playlist, then reads each video's numbers, newest first", async () => {
      const { fn, calls } = stub((c) => {
        if (c.url.pathname.endsWith("/playlistItems")) return { body: { items: [{ contentDetails: { videoId: "v2" } }, { contentDetails: { videoId: "v1" } }], nextPageToken: "NEXT" } };
        return { body: { items: [video("v2", "2026-09-01T10:00:00Z", "PT1M3S", "100"), video("v1", "2026-10-01T10:00:00Z", "PT45S", "2500")] } };
      });
      const page = await make(fn).fetchPosts(tokens(), { externalId: "UCabc" } as never, { cursor: null, limit: 20 });

      expect(param(calls[0]!, "playlistId")).toBe("UUabc"); // the channel's uploads playlist: UC… becomes UU…
      expect(param(calls[0]!, "maxResults")).toBe("20");
      expect(param(calls[1]!, "id")).toBe("v2,v1");
      expect(param(calls[1]!, "part")).toBe("snippet,statistics,contentDetails");
      expect(page.posts.map((p) => p.id)).toEqual(["v1", "v2"]);
      expect(page.posts[0]).toEqual({
        id: "v1", title: "Video v1", postedAt: new Date("2026-10-01T10:00:00Z"), coverUrl: "https://yt/v1.jpg", shareUrl: "https://www.youtube.com/watch?v=v1",
        durationSeconds: 45, views: 2500, likes: 10, comments: 1, shares: null, saves: null,
      });
      expect(page.posts[1]!.durationSeconds).toBe(63);
      expect(page).toMatchObject({ cursor: "NEXT", hasMore: true });
    });

    it("continues from the page token it was given", async () => {
      const { fn, calls } = stub(() => ({ body: { items: [] } }));
      await make(fn).fetchPosts(tokens(), { externalId: "UCabc" } as never, { cursor: "NEXT", limit: 20 });
      expect(param(calls[0]!, "pageToken")).toBe("NEXT");
    });

    it("does not ask about videos when there are none", async () => {
      const { fn, calls } = stub(() => ({ body: { items: [] } }));
      expect(await make(fn).fetchPosts(tokens(), { externalId: "UCabc" } as never, { cursor: null, limit: 20 })).toEqual({ posts: [], cursor: null, hasMore: false });
      expect(calls).toHaveLength(1);
    });
  });

  it("classifies Google's errors", async () => {
    const kind = async (reply: Reply) => ((await make(stub(() => reply).fn).fetchAccount(tokens()).catch((e: ProviderApiError) => e)) as ProviderApiError).kind;
    const api = (status: number, reason: string, googleStatus = "ERR") => ({ status, body: { error: { code: status, message: "x", errors: [{ reason }], status: googleStatus } } });
    expect(await kind(api(401, "authError", "UNAUTHENTICATED"))).toBe("reauth");
    expect(await kind(api(403, "quotaExceeded"))).toBe("rate_limit");
    expect(await kind(api(429, "rateLimitExceeded"))).toBe("rate_limit");
    expect(await kind(api(403, "insufficientPermissions"))).toBe("scope");
    expect(await kind(api(500, "backendError"))).toBe("transient");
    expect(await kind(api(400, "badRequest"))).toBe("rejected");
    expect(await kind(new Error("offline"))).toBe("transient");
  });

  it("revokes by the refresh token, which ends the whole grant", async () => {
    const { fn, calls } = stub(() => ({ body: {} }));
    await make(fn).revoke(tokens({ accessToken: "ya29.a", refreshToken: "1//refresh" }));
    expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://oauth2.googleapis.com/revoke");
    expect(form(calls[0]!)).toEqual({ token: "1//refresh" });
  });

  it("through the stand-in: Google's three hosts all go to it", async () => {
    const local = { mockOrigin: "http://127.0.0.1:4010/youtube" };
    const url = new URL(make(stub(() => ({})).fn, local).authorizeUrl("w.s"));
    expect(`${url.origin}${url.pathname}`).toBe("http://127.0.0.1:4010/youtube/accounts.google.com/o/oauth2/v2/auth");
    const { fn, calls } = stub(() => ({ body: googleTokens }));
    await make(fn, local).exchangeCode("c");
    expect(calls[0]!.url.href).toBe("http://127.0.0.1:4010/youtube/oauth2.googleapis.com/token");
  });
});

describe("ISO 8601 durations", () => {
  it("reads what YouTube sends", () => {
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("PT1M3S")).toBe(63);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("P1DT2H")).toBe(93600);
    expect(parseIsoDuration("PT0S")).toBe(0);
  });
  it("doesn't guess at anything else", () => {
    expect(parseIsoDuration("a minute")).toBeNull();
    expect(parseIsoDuration(undefined)).toBeNull();
  });
});

// ─── TikTok ─────────────────────────────────────────────────────────────────

describe("TikTok", () => {
  const make = (fn: typeof fetch, over: Partial<ProviderConfig> = {}) => createTikTokAdapter(config(over), fn);
  const ok = { code: "ok", message: "", log_id: "L" };

  it("sends the creator to TikTok's authorize page", () => {
    const url = new URL(make(stub(() => ({})).fn).authorizeUrl("w.state1"));
    expect(`${url.origin}${url.pathname}`).toBe("https://www.tiktok.com/v2/auth/authorize/");
    expect(url.searchParams.get("client_key")).toBe("app-id");
    expect(url.searchParams.get("scope")).toBe("user.info.basic,user.info.stats,video.list");
  });

  it("turns TikTok's token reply into the shared shape", async () => {
    const { fn } = stub(() => ({
      body: { access_token: "act.new", refresh_token: "rft.new", open_id: "open-123", expires_in: 86400, refresh_expires_in: 31536000, scope: "user.info.basic,user.info.stats,video.list", token_type: "Bearer" },
    }));
    const t = await make(fn).exchangeCode("c");
    expect(t).toMatchObject({ accessToken: "act.new", refreshToken: "rft.new", scopes: ["user.info.basic", "user.info.stats", "video.list"] });
    expect(Math.abs(t.accessExpiresAt!.getTime() - (Date.now() + DAY))).toBeLessThan(10_000);
    expect(Math.abs(t.refreshExpiresAt!.getTime() - (Date.now() + 365 * DAY))).toBeLessThan(10_000);
  });

  it("speaks the shared error type, with TikTok's own code", async () => {
    const { fn } = stub(() => ({ status: 400, body: { error: "invalid_grant", error_description: "Authorization code is expired or invalid." } }));
    const err = (await make(fn).exchangeCode("stale").catch((e: unknown) => e)) as ProviderApiError;
    expect(err).toBeInstanceOf(ProviderApiError);
    expect(err).toMatchObject({ provider: "tiktok", code: "invalid_grant", kind: "reauth" });
  });

  it("renews with the rotating refresh token", () => {
    const a = make(stub(() => ({})).fn);
    expect(a.canRefresh(tokens({ refreshToken: "rft", refreshExpiresAt: new Date(NOW.getTime() + DAY) }), NOW)).toBe(true);
    expect(a.canRefresh(tokens({ refreshToken: "rft", refreshExpiresAt: new Date(NOW.getTime() - 1) }), NOW)).toBe(false);
    expect(a.canRefresh(tokens({ refreshToken: null }), NOW)).toBe(false);
  });

  it("reads the profile and the counts", async () => {
    const { fn } = stub(() => ({
      body: { data: { user: { open_id: "open-123", display_name: "Amara", avatar_url: "https://p/a.jpg", follower_count: 1200, following_count: 80, likes_count: 9000, video_count: 45 } }, error: ok },
    }));
    expect(await make(fn).fetchAccount(tokens({ scopes: ["user.info.basic", "user.info.stats"] }))).toEqual({
      externalId: "open-123", name: "Amara", handle: null, avatarUrl: "https://p/a.jpg", followers: 1200, following: 80, likes: 9000, posts: 45,
    });
  });

  it("reads videos when that permission was granted, and doesn't ask when it wasn't", async () => {
    const { fn, calls } = stub(() => ({
      body: {
        data: { videos: [{ id: "v1", title: "Clip", create_time: 1790000000, cover_image_url: "https://c/1.jpg", share_url: "https://www.tiktok.com/@a/video/1", duration: 20, view_count: 100, like_count: 10, comment_count: 2, share_count: 3 }], cursor: 1790000000, has_more: true },
        error: ok,
      },
    }));
    const a = make(fn);
    const page = await a.fetchPosts(tokens({ scopes: ["user.info.basic", "video.list"] }), { externalId: "o" } as never, { cursor: null, limit: 20 });
    expect(page.posts[0]).toEqual({
      id: "v1", title: "Clip", postedAt: new Date(1790000000 * 1000), coverUrl: "https://c/1.jpg", shareUrl: "https://www.tiktok.com/@a/video/1",
      durationSeconds: 20, views: 100, likes: 10, comments: 2, shares: 3, saves: null,
    });
    expect(page).toMatchObject({ cursor: "1790000000", hasMore: true });

    calls.length = 0;
    expect(await a.fetchPosts(tokens({ scopes: ["user.info.basic"] }), { externalId: "o" } as never, { cursor: null, limit: 20 })).toEqual({ posts: [], cursor: null, hasMore: false });
    expect(calls).toEqual([]);
  });

  it("revokes the access token", async () => {
    const { fn, calls } = stub(() => ({ body: {} }));
    await make(fn).revoke(tokens({ accessToken: "act.x" }));
    expect(`${calls[0]!.url.origin}${calls[0]!.url.pathname}`).toBe("https://open.tiktokapis.com/v2/oauth/revoke/");
    expect(form(calls[0]!).token).toBe("act.x");
  });

  it("through the stand-in: the old path scheme keeps working", async () => {
    const local = { mockOrigin: "http://127.0.0.1:4010/tiktok" };
    const url = new URL(make(stub(() => ({})).fn, local).authorizeUrl("w.s"));
    expect(`${url.origin}${url.pathname}`).toBe("http://127.0.0.1:4010/tiktok/v2/auth/authorize/");
    const { fn, calls } = stub(() => ({ status: 400, body: { error: "invalid_grant" } }));
    await make(fn, local).exchangeCode("c").catch(() => {});
    expect(calls[0]!.url.href).toBe("http://127.0.0.1:4010/tiktok/v2/oauth/token/");
  });
});
