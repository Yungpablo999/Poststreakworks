import { describe, expect, it } from "vitest";
import {
  TIKTOK_SCOPES,
  TikTokApiError,
  TikTokConfigError,
  buildAuthorizeUrl,
  exchangeCode,
  fetchUserInfo,
  listVideos,
  refreshTokens,
  revokeToken,
  tiktokConfigFromEnv,
  userFieldsForScopes,
  type TikTokConfig,
} from "./tiktok";

// Fake values only. The real client key and secret live in the deployment's
// environment, never in the repository.
const config: TikTokConfig = {
  clientKey: "test-client-key",
  clientSecret: "test-client-secret-DO-NOT-LEAK",
  redirectUri: "https://app.example.test/auth/tiktok/callback",
};
const NOW = new Date("2026-10-02T12:00:00Z");

type Reply = { status?: number; body?: unknown; raw?: string } | Error;
function fakeFetch(...replies: Reply[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: unknown, init: RequestInit) => {
    calls.push({ url: String(url), init });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)]!;
    if (reply instanceof Error) throw reply;
    return new Response(reply.raw ?? JSON.stringify(reply.body ?? {}), { status: reply.status ?? 200 });
  }) as typeof fetch;
  return { fn, calls };
}
const form = (init: RequestInit) => Object.fromEntries(new URLSearchParams(String(init.body)));

const goodTokens = {
  access_token: "act.new",
  refresh_token: "rft.new",
  open_id: "open-123",
  expires_in: 86400,
  refresh_expires_in: 31536000,
  scope: "user.info.basic,user.info.stats,video.list",
  token_type: "Bearer",
};

describe("configuration", () => {
  const env = {
    TIKTOK_CLIENT_KEY: "k",
    TIKTOK_CLIENT_SECRET: "s",
    TIKTOK_REDIRECT_URI: "https://app.example.test/auth/tiktok/callback",
  };

  it("reads the three settings", () => {
    expect(tiktokConfigFromEnv(env)).toEqual({ clientKey: "k", clientSecret: "s", redirectUri: env.TIKTOK_REDIRECT_URI });
  });

  it("is null (not an error) when TikTok isn't set up on this server", () => {
    expect(tiktokConfigFromEnv({})).toBeNull();
    expect(tiktokConfigFromEnv({ ...env, TIKTOK_CLIENT_SECRET: "" })).toBeNull();
    expect(tiktokConfigFromEnv({ ...env, TIKTOK_CLIENT_KEY: "   " })).toBeNull();
  });

  it("refuses a redirect URI TikTok would reject", () => {
    for (const bad of [
      "http://app.example.test/cb",
      "https://app.example.test/cb?x=1",
      "https://app.example.test/cb#frag",
      "not a url",
      "https://app.example.test/" + "x".repeat(520),
    ]) {
      expect(() => tiktokConfigFromEnv({ ...env, TIKTOK_REDIRECT_URI: bad }), bad.slice(0, 40)).toThrow(TikTokConfigError);
    }
  });
});

describe("buildAuthorizeUrl", () => {
  const url = new URL(buildAuthorizeUrl(config, "w.state123"));

  it("goes to TikTok's v2 authorize page", () => {
    expect(`${url.origin}${url.pathname}`).toBe("https://www.tiktok.com/v2/auth/authorize/");
  });

  it("asks for exactly the three approved scopes, as a code flow", () => {
    expect(url.searchParams.get("scope")).toBe("user.info.basic,user.info.stats,video.list");
    expect([...TIKTOK_SCOPES]).toEqual(["user.info.basic", "user.info.stats", "video.list"]);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_key")).toBe(config.clientKey);
    expect(url.searchParams.get("redirect_uri")).toBe(config.redirectUri);
    expect(url.searchParams.get("state")).toBe("w.state123");
  });

  it("never puts the client secret in a URL", () => {
    expect(url.toString()).not.toContain(config.clientSecret);
  });
});

describe("exchangeCode", () => {
  it("posts the code to the token endpoint as a form, with the redirect URI it was issued for", async () => {
    const { fn, calls } = fakeFetch({ body: goodTokens });
    await exchangeCode(config, "the-code", fn, NOW);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://open.tiktokapis.com/v2/oauth/token/");
    expect(calls[0]!.init.method).toBe("POST");
    expect((calls[0]!.init.headers as Record<string, string>)["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(form(calls[0]!.init)).toEqual({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      code: "the-code",
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    });
    // the secret travels in the body, not the URL
    expect(calls[0]!.url).not.toContain(config.clientSecret);
  });

  it("returns tokens with absolute expiry times and the granted scopes", async () => {
    const { fn } = fakeFetch({ body: goodTokens });
    const tokens = await exchangeCode(config, "c", fn, NOW);
    expect(tokens).toEqual({
      accessToken: "act.new",
      refreshToken: "rft.new",
      openId: "open-123",
      scopes: ["user.info.basic", "user.info.stats", "video.list"],
      accessExpiresAt: new Date("2026-10-03T12:00:00Z"),
      refreshExpiresAt: new Date("2027-10-02T12:00:00Z"),
    });
  });

  it("reports an expired or reused code as needing a fresh connection", async () => {
    const { fn } = fakeFetch({ status: 400, body: { error: "invalid_grant", error_description: "Authorization code expired", log_id: "L1" } });
    const err = await exchangeCode(config, "old", fn, NOW).catch((e) => e);
    expect(err).toBeInstanceOf(TikTokApiError);
    expect(err).toMatchObject({ code: "invalid_grant", kind: "reauth", httpStatus: 400, logId: "L1" });
  });

  it("treats a 200 that carries an error as an error (TikTok does this)", async () => {
    const { fn } = fakeFetch({ status: 200, body: { error: "invalid_client", log_id: "L2" } });
    await expect(exchangeCode(config, "c", fn, NOW)).rejects.toMatchObject({ code: "invalid_client", kind: "rejected" });
  });

  it("calls a malformed success body a provider problem, not a crash", async () => {
    const { fn } = fakeFetch({ body: { access_token: "only-this" } });
    await expect(exchangeCode(config, "c", fn, NOW)).rejects.toMatchObject({ code: "malformed_response", kind: "transient" });
  });

  it("survives an HTML error page from a proxy, and a dead network", async () => {
    await expect(exchangeCode(config, "c", fakeFetch({ status: 502, raw: "<html>Bad gateway</html>" }).fn, NOW)).rejects.toMatchObject({
      kind: "transient",
      httpStatus: 502,
    });
    await expect(exchangeCode(config, "c", fakeFetch(new Error("ECONNRESET")).fn, NOW)).rejects.toMatchObject({
      code: "network_error",
      kind: "transient",
    });
  });

  it("never lets the client secret or a token into an error message", async () => {
    const { fn } = fakeFetch({
      status: 400,
      body: { error: "invalid_request", error_description: `bad secret ${config.clientSecret}`, log_id: "L3" },
    });
    const err = (await exchangeCode(config, "c", fn, NOW).catch((e) => e)) as Error;
    expect(err.message).not.toContain(config.clientSecret);
    expect(JSON.stringify(err)).not.toContain(config.clientSecret);
  });
});

describe("refreshTokens", () => {
  it("posts a refresh_token grant", async () => {
    const { fn, calls } = fakeFetch({ body: { ...goodTokens, access_token: "act.refreshed" } });
    const tokens = await refreshTokens(config, "rft.old", fn, NOW);
    expect(form(calls[0]!.init)).toEqual({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: "rft.old",
    });
    expect(tokens.accessToken).toBe("act.refreshed");
  });

  it("flags a dead refresh token as needing the creator to reconnect", async () => {
    const { fn } = fakeFetch({ status: 400, body: { error: "invalid_grant" } });
    await expect(refreshTokens(config, "rft.dead", fn, NOW)).rejects.toMatchObject({ kind: "reauth" });
  });
});

describe("revokeToken", () => {
  it("posts the token to the revoke endpoint", async () => {
    const { fn, calls } = fakeFetch({ body: {} });
    await revokeToken(config, "act.bye", fn);
    expect(calls[0]!.url).toBe("https://open.tiktokapis.com/v2/oauth/revoke/");
    expect(form(calls[0]!.init)).toEqual({ client_key: config.clientKey, client_secret: config.clientSecret, token: "act.bye" });
  });

  it("surfaces a failure so the caller can decide to carry on", async () => {
    await expect(revokeToken(config, "t", fakeFetch({ status: 500, raw: "oops" }).fn)).rejects.toBeInstanceOf(TikTokApiError);
  });
});

describe("fetchUserInfo", () => {
  const userBody = {
    data: {
      user: {
        open_id: "open-123",
        display_name: "Amara",
        avatar_url: "https://p16.example/a.jpg",
        follower_count: 1200,
        following_count: 80,
        likes_count: 9000,
        video_count: 45,
      },
    },
    error: { code: "ok", message: "", log_id: "L" },
  };

  it("asks only for fields the granted scopes allow", () => {
    expect(userFieldsForScopes(["user.info.basic"])).toEqual(["open_id", "display_name", "avatar_url"]);
    expect(userFieldsForScopes(["user.info.basic", "user.info.stats"])).toEqual([
      "open_id", "display_name", "avatar_url", "follower_count", "following_count", "likes_count", "video_count",
    ]);
    expect(userFieldsForScopes(["video.list"])).toEqual([]);
  });

  it("calls the user info endpoint with the bearer token and those fields", async () => {
    const { fn, calls } = fakeFetch({ body: userBody });
    await fetchUserInfo("act.1", ["user.info.basic", "user.info.stats"], fn);
    const url = new URL(calls[0]!.url);
    expect(`${url.origin}${url.pathname}`).toBe("https://open.tiktokapis.com/v2/user/info/");
    expect(url.searchParams.get("fields")).toBe("open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count");
    expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe("Bearer act.1");
  });

  it("maps the account and its counts", async () => {
    const user = await fetchUserInfo("t", ["user.info.basic", "user.info.stats"], fakeFetch({ body: userBody }).fn);
    expect(user).toEqual({
      openId: "open-123",
      displayName: "Amara",
      avatarUrl: "https://p16.example/a.jpg",
      followers: 1200,
      following: 80,
      likes: 9000,
      videos: 45,
    });
  });

  it("leaves counts null when the stats scope wasn't granted", async () => {
    const basicOnly = { data: { user: { open_id: "open-123", display_name: "Amara" } } };
    const user = await fetchUserInfo("t", ["user.info.basic"], fakeFetch({ body: basicOnly }).fn);
    expect(user).toMatchObject({ displayName: "Amara", followers: null, videos: null, avatarUrl: null });
  });

  it("won't call TikTok at all with no usable scope", async () => {
    const { fn, calls } = fakeFetch({ body: userBody });
    await expect(fetchUserInfo("t", ["video.list"], fn)).rejects.toMatchObject({ kind: "scope" });
    expect(calls).toHaveLength(0);
  });

  it("maps TikTok's error object, including an expired access token", async () => {
    const { fn } = fakeFetch({ status: 401, body: { data: {}, error: { code: "access_token_invalid", message: "x", log_id: "L9" } } });
    await expect(fetchUserInfo("t", ["user.info.basic"], fn)).rejects.toMatchObject({ code: "access_token_invalid", kind: "reauth", logId: "L9" });
  });

  it("maps rate limiting", async () => {
    const { fn } = fakeFetch({ status: 429, body: { error: { code: "rate_limit_exceeded", message: "", log_id: "L" } } });
    await expect(fetchUserInfo("t", ["user.info.basic"], fn)).rejects.toMatchObject({ kind: "rate_limit" });
  });
});

describe("listVideos", () => {
  const page = {
    data: {
      videos: [
        { id: "v1", title: "First", create_time: 1_759_400_000, cover_image_url: "https://c/1.jpg", share_url: "https://tiktok.com/v1", duration: 21, view_count: 1500, like_count: 120, comment_count: 8, share_count: 4 },
        { id: "v2", create_time: 1_759_300_000 },
        { title: "no id, skipped" },
        "garbage",
      ],
      cursor: 1_759_300_000_000,
      has_more: true,
    },
    error: { code: "ok", message: "", log_id: "L" },
  };

  it("posts the page size and cursor, and asks for the stats fields", async () => {
    const { fn, calls } = fakeFetch({ body: page });
    await listVideos("act.1", { cursor: 123, maxCount: 50 }, fn);
    const url = new URL(calls[0]!.url);
    expect(`${url.origin}${url.pathname}`).toBe("https://open.tiktokapis.com/v2/video/list/");
    expect(url.searchParams.get("fields")).toContain("view_count");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ max_count: 20, cursor: 123 }); // capped at TikTok's 20
  });

  it("omits the cursor on the first page", async () => {
    const { fn, calls } = fakeFetch({ body: page });
    await listVideos("t", {}, fn);
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ max_count: 20 });
  });

  it("maps videos, defaults missing counts to 0, and skips entries it can't use", async () => {
    const result = await listVideos("t", {}, fakeFetch({ body: page }).fn);
    expect(result.videos).toHaveLength(2);
    expect(result.videos[0]).toEqual({
      id: "v1",
      title: "First",
      createdAt: new Date(1_759_400_000 * 1000),
      coverUrl: "https://c/1.jpg",
      shareUrl: "https://tiktok.com/v1",
      durationSeconds: 21,
      views: 1500,
      likes: 120,
      comments: 8,
      shares: 4,
    });
    expect(result.videos[1]).toMatchObject({ id: "v2", title: "", views: 0, likes: 0, coverUrl: null });
    expect(result).toMatchObject({ cursor: 1_759_300_000_000, hasMore: true });
  });

  it("handles an account with no videos", async () => {
    const result = await listVideos("t", {}, fakeFetch({ body: { data: {}, error: { code: "ok" } } }).fn);
    expect(result).toEqual({ videos: [], cursor: null, hasMore: false });
  });

  it("reports a missing scope", async () => {
    const { fn } = fakeFetch({ status: 403, body: { error: { code: "scope_not_authorized", message: "", log_id: "L" } } });
    await expect(listVideos("t", {}, fn)).rejects.toMatchObject({ kind: "scope" });
  });
});
