import {
  ProviderApiError,
  type FetchLike,
  type PostPage,
  type ProviderAccount,
  type ProviderAdapter,
  type ProviderConfig,
  type ProviderPost,
  type ProviderTokens,
} from "./types";
import { arr, fetchFor, num, obj, send, str, withMock } from "./http";
import { SIXTY_DAYS_MS, classifyMeta, mapLimited, readMetaError } from "./meta";

// Threads API. Endpoints, parameters and scopes checked against developers.facebook.com/docs/threads on 2026-10-03:
//   authorize   https://threads.com/oauth/authorize          (client_id, redirect_uri, scope, response_type=code, state)
//   code → short-lived token     POST https://graph.threads.com/oauth/access_token
//   short → long-lived (60 days) GET  https://graph.threads.com/access_token?grant_type=th_exchange_token
//   renew a long-lived token     GET  https://graph.threads.com/refresh_access_token?grant_type=th_refresh_token
//                                (the token must be at least 24 hours old and not expired)
//   posts     GET /me/threads?fields=…       insights  GET /{id}/insights?metric=views,likes,replies,reposts,quotes,shares
//   followers GET /{user-id}/threads_insights?metric=followers_count
// Permissions: threads_basic, threads_manage_insights.
// While the Meta app is in development only people given a Threads Tester role on it can connect.

export const THREADS_SCOPES = ["threads_basic", "threads_manage_insights"] as const;

const AUTHORIZE_URL = "https://threads.com/oauth/authorize";
const TOKEN_URL = "https://graph.threads.com/oauth/access_token";
const GRAPH = "https://graph.threads.com";
const VERSION = "v1.0";
const HOSTS = ["threads.com", "graph.threads.com"] as const;

const POST_FIELDS = "id,text,media_type,permalink,timestamp,thumbnail_url,media_url";
const INSIGHT_METRICS = "views,likes,replies,reposts,quotes,shares";

export function createThreadsAdapter(config: ProviderConfig, baseFetch: FetchLike = fetch, now: () => Date = () => new Date()): ProviderAdapter {
  const fetchImpl = fetchFor(config, HOSTS, baseFetch);
  const call = (url: string, init: RequestInit) => send("threads", fetchImpl, url, init, readMetaError, classifyMeta);
  const withToken = (url: string, token: string) => {
    const u = new URL(url);
    u.searchParams.set("access_token", token);
    return u.toString();
  };

  const longLived = (body: unknown, scopes: string[]): ProviderTokens => {
    const accessToken = str(body, "access_token");
    if (!accessToken) throw new ProviderApiError("threads", "malformed_response", "transient", 200);
    const seconds = num(body, "expires_in");
    return {
      accessToken,
      refreshToken: null,
      accessExpiresAt: new Date(now().getTime() + (seconds ? seconds * 1000 : SIXTY_DAYS_MS)),
      refreshExpiresAt: null,
      scopes,
    };
  };

  return {
    id: "threads",
    name: "Threads",
    requiredScopes: ["threads_basic"],
    refreshWindowMs: 14 * 24 * 3600 * 1000,

    authorizeUrl(state) {
      const url = new URL(withMock(config, AUTHORIZE_URL));
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("scope", THREADS_SCOPES.join(","));
      url.searchParams.set("response_type", "code");
      url.searchParams.set("state", state);
      return url.toString();
    },

    async exchangeCode(code) {
      const form = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      });
      const short = await call(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
      const shortToken = str(short.body, "access_token");
      if (!shortToken) throw new ProviderApiError("threads", "malformed_response", "transient", 200);

      const exchange = new URL(`${GRAPH}/access_token`);
      exchange.searchParams.set("grant_type", "th_exchange_token");
      exchange.searchParams.set("client_secret", config.clientSecret);
      const long = await call(withToken(exchange.toString(), shortToken), { method: "GET" });
      return longLived(long.body, [...THREADS_SCOPES]);
    },

    canRefresh(tokens, at) {
      return tokens.accessExpiresAt !== null && tokens.accessExpiresAt.getTime() > at.getTime();
    },

    async refresh(tokens) {
      const url = new URL(`${GRAPH}/refresh_access_token`);
      url.searchParams.set("grant_type", "th_refresh_token");
      const reply = await call(withToken(url.toString(), tokens.accessToken), { method: "GET" });
      return longLived(reply.body, tokens.scopes);
    },

    async fetchAccount(tokens): Promise<ProviderAccount> {
      const { body } = await call(withToken(`${GRAPH}/${VERSION}/me?fields=id,username,name,threads_profile_picture_url`, tokens.accessToken), { method: "GET" });
      const id = str(body, "id");
      if (!id) throw new ProviderApiError("threads", "malformed_response", "transient", 200);

      // The follower count is an insight. Without its permission the rest of the profile still reads.
      let followers: number | null = null;
      try {
        const reply = await call(withToken(`${GRAPH}/${VERSION}/${encodeURIComponent(id)}/threads_insights?metric=followers_count`, tokens.accessToken), { method: "GET" });
        const entry = arr(reply.body, "data").find((e) => str(e, "name") === "followers_count");
        followers = num(obj(entry, "total_value"), "value") ?? null;
      } catch (err) {
        if (err instanceof ProviderApiError && err.kind === "reauth") throw err;
      }

      const username = str(body, "username") ?? null;
      return {
        externalId: id,
        name: str(body, "name") ?? username,
        handle: username,
        avatarUrl: str(body, "threads_profile_picture_url") ?? null,
        followers,
        following: null,
        likes: null,
        posts: null,
      };
    },

    async fetchPosts(tokens, _account, page): Promise<PostPage> {
      const url = new URL(`${GRAPH}/${VERSION}/me/threads`);
      url.searchParams.set("fields", POST_FIELDS);
      url.searchParams.set("limit", String(Math.min(page.limit, 50)));
      if (page.cursor) url.searchParams.set("after", page.cursor);
      const { body } = await call(withToken(url.toString(), tokens.accessToken), { method: "GET" });

      const items = arr(body, "data").filter((m) => typeof m === "object" && m !== null);
      const insights = await mapLimited(items, 5, async (m) => {
        const id = str(m, "id");
        if (!id) return null;
        try {
          const reply = await call(withToken(`${GRAPH}/${VERSION}/${encodeURIComponent(id)}/insights?metric=${INSIGHT_METRICS}`, tokens.accessToken), { method: "GET" });
          const values = new Map<string, number>();
          for (const entry of arr(reply.body, "data")) {
            const name = str(entry, "name");
            const value = num(arr(entry, "values")[0], "value") ?? num(obj(entry, "total_value"), "value");
            if (name && value !== undefined) values.set(name, value);
          }
          return values;
        } catch (err) {
          if (err instanceof ProviderApiError && (err.kind === "reauth" || err.kind === "rate_limit")) throw err;
          return null;
        }
      });

      const posts: ProviderPost[] = items
        .map((m, i) => {
          const values = insights[i];
          const text = str(m, "text") ?? "";
          const when = str(m, "timestamp");
          return {
            id: str(m, "id") ?? "",
            title: text.split("\n")[0]?.slice(0, 200) ?? "",
            postedAt: when ? new Date(when) : null,
            coverUrl: str(m, "thumbnail_url") ?? str(m, "media_url") ?? null,
            shareUrl: str(m, "permalink") ?? null,
            durationSeconds: null,
            views: values?.get("views") ?? null,
            likes: values?.get("likes") ?? 0,
            comments: values?.get("replies") ?? 0,
            shares: values ? (values.get("shares") ?? 0) + (values.get("reposts") ?? 0) + (values.get("quotes") ?? 0) : null,
            saves: null,
          };
        })
        .filter((p) => p.id);

      const after = str(obj(obj(body, "paging"), "cursors"), "after");
      const hasNext = typeof obj(body, "paging")?.next === "string";
      return { posts, cursor: hasNext && after ? after : null, hasMore: hasNext && !!after };
    },

    // Threads has no endpoint to revoke a token; the creator removes the app in their Threads settings.
    async revoke() {},
  };
}
