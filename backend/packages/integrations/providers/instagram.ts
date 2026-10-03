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

// Instagram: "Instagram API with Instagram Login" (Business and Creator accounts).
// Endpoints, parameters and scopes checked against developers.facebook.com/docs/instagram-platform on 2026-10-03:
//   authorize   https://www.instagram.com/oauth/authorize   (client_id, redirect_uri, response_type=code, scope, state)
//   code → short-lived token     POST https://api.instagram.com/oauth/access_token  (valid 1 hour)
//   short → long-lived (60 days) GET  https://graph.instagram.com/access_token?grant_type=ig_exchange_token
//   renew a long-lived token     GET  https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token
//                                (the token must be at least 24 hours old and not expired)
//   profile   GET /me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count
//   posts     GET /me/media?fields=…   insights  GET /{media-id}/insights?metric=views,reach,saved,shares
// Permissions: instagram_business_basic, instagram_business_manage_insights.
//
// Personal Instagram accounts can't connect (the API only serves Business and Creator accounts); the reply says so.
// While the Meta app is in development only people given a role on it (tester) can connect.

export const INSTAGRAM_SCOPES = ["instagram_business_basic", "instagram_business_manage_insights"] as const;

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH = "https://graph.instagram.com";
const VERSION = "v25.0";
const HOSTS = ["www.instagram.com", "api.instagram.com", "graph.instagram.com"] as const;

const MEDIA_FIELDS = "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count";
const INSIGHT_METRICS = "views,reach,saved,shares";

export function createInstagramAdapter(config: ProviderConfig, baseFetch: FetchLike = fetch, now: () => Date = () => new Date()): ProviderAdapter {
  const fetchImpl = fetchFor(config, HOSTS, baseFetch);
  const call = (url: string, init: RequestInit) => send("instagram", fetchImpl, url, init, readMetaError, classifyMeta);
  // Meta's documented form: the token travels as the access_token parameter. (Nothing here logs a URL.)
  const withToken = (url: string, token: string) => {
    const u = new URL(url);
    u.searchParams.set("access_token", token);
    return u.toString();
  };

  /** Reads { access_token, user_id, permissions } from either of the shapes the code-exchange endpoint has used. */
  const readShortLived = (body: unknown) => {
    const first = arr(body, "data")[0];
    const source = first ?? body;
    const accessToken = str(source, "access_token");
    const rawUserId = (source as Record<string, unknown> | null)?.user_id;
    if (!accessToken) throw new ProviderApiError("instagram", "malformed_response", "transient", 200);
    const permissions = str(source, "permissions") ?? "";
    return { accessToken, userId: rawUserId === undefined ? null : String(rawUserId), scopes: permissions.split(",").map((s) => s.trim()).filter(Boolean) };
  };

  const longLived = (body: unknown, scopes: string[]): ProviderTokens => {
    const accessToken = str(body, "access_token");
    if (!accessToken) throw new ProviderApiError("instagram", "malformed_response", "transient", 200);
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
    id: "instagram",
    name: "Instagram",
    requiredScopes: ["instagram_business_basic"],
    // Renew with two weeks to spare; a long-lived token that goes unused for 60 days can't be renewed at all.
    refreshWindowMs: 14 * 24 * 3600 * 1000,

    authorizeUrl(state) {
      const url = new URL(withMock(config, AUTHORIZE_URL));
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", INSTAGRAM_SCOPES.join(","));
      url.searchParams.set("state", state);
      return url.toString();
    },

    async exchangeCode(code) {
      const form = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
        code,
      });
      const short = await call(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
      const { accessToken, scopes } = readShortLived(short.body);

      // The short-lived token lasts an hour; trade it for the 60-day one straight away.
      const exchange = new URL(`${GRAPH}/access_token`);
      exchange.searchParams.set("grant_type", "ig_exchange_token");
      exchange.searchParams.set("client_secret", config.clientSecret);
      const long = await call(withToken(exchange.toString(), accessToken), { method: "GET" });
      return longLived(long.body, scopes.length ? scopes : [...INSTAGRAM_SCOPES]);
    },

    canRefresh(tokens, at) {
      return tokens.accessExpiresAt !== null && tokens.accessExpiresAt.getTime() > at.getTime();
    },

    async refresh(tokens) {
      const url = new URL(`${GRAPH}/refresh_access_token`);
      url.searchParams.set("grant_type", "ig_refresh_token");
      const reply = await call(withToken(url.toString(), tokens.accessToken), { method: "GET" });
      return longLived(reply.body, tokens.scopes);
    },

    async fetchAccount(tokens): Promise<ProviderAccount> {
      const fields = "user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";
      const { body } = await call(withToken(`${GRAPH}/${VERSION}/me?fields=${fields}`, tokens.accessToken), { method: "GET" });
      const rawId = (body as Record<string, unknown> | null)?.user_id ?? (body as Record<string, unknown> | null)?.id;
      if (rawId === undefined || rawId === null) throw new ProviderApiError("instagram", "malformed_response", "transient", 200);
      const username = str(body, "username") ?? null;
      return {
        externalId: String(rawId),
        name: str(body, "name") ?? username,
        handle: username,
        avatarUrl: str(body, "profile_picture_url") ?? null,
        followers: num(body, "followers_count") ?? null,
        following: num(body, "follows_count") ?? null,
        likes: null,
        posts: num(body, "media_count") ?? null,
      };
    },

    async fetchPosts(tokens, _account, page): Promise<PostPage> {
      const url = new URL(`${GRAPH}/${VERSION}/me/media`);
      url.searchParams.set("fields", MEDIA_FIELDS);
      url.searchParams.set("limit", String(Math.min(page.limit, 50)));
      if (page.cursor) url.searchParams.set("after", page.cursor);
      const { body } = await call(withToken(url.toString(), tokens.accessToken), { method: "GET" });

      const media = arr(body, "data").filter((m) => typeof m === "object" && m !== null);
      // Numbers that need a separate request each (a few at a time); one odd post doesn't lose the rest
      const insights = await mapLimited(media, 5, async (m) => {
        const id = str(m, "id");
        if (!id) return null;
        try {
          const reply = await call(withToken(`${GRAPH}/${VERSION}/${encodeURIComponent(id)}/insights?metric=${INSIGHT_METRICS}`, tokens.accessToken), { method: "GET" });
          const values = new Map<string, number>();
          for (const entry of arr(reply.body, "data")) {
            const name = str(entry, "name");
            const first = arr(entry, "values")[0];
            const value = num(first, "value") ?? num(obj(entry, "total_value"), "value");
            if (name && value !== undefined) values.set(name, value);
          }
          return values;
        } catch (err) {
          // A token problem should surface; a post the platform won't give insights for (too old, a carousel
          // child…) is simply left without them.
          if (err instanceof ProviderApiError && (err.kind === "reauth" || err.kind === "rate_limit")) throw err;
          return null;
        }
      });

      const posts: ProviderPost[] = media.map((m, i) => {
        const type = str(m, "media_type");
        const values = insights[i];
        const postedAt = str(m, "timestamp");
        const caption = str(m, "caption") ?? "";
        return {
          id: str(m, "id") ?? "",
          title: caption.split("\n")[0]?.slice(0, 200) ?? "",
          postedAt: postedAt ? new Date(postedAt) : null,
          coverUrl: str(m, "thumbnail_url") ?? (type === "IMAGE" || type === "CAROUSEL_ALBUM" ? (str(m, "media_url") ?? null) : null),
          shareUrl: str(m, "permalink") ?? null,
          durationSeconds: null,
          views: values?.get("views") ?? null,
          likes: num(m, "like_count") ?? 0,
          comments: num(m, "comments_count") ?? 0,
          shares: values?.get("shares") ?? null,
          saves: values?.get("saved") ?? null,
        };
      }).filter((p) => p.id);

      const after = str(obj(obj(body, "paging"), "cursors"), "after");
      const hasNext = typeof obj(body, "paging")?.next === "string";
      return { posts, cursor: hasNext && after ? after : null, hasMore: hasNext && !!after };
    },

    // Instagram has no endpoint to revoke a token; the creator removes the app in their Instagram settings.
    async revoke() {},
  };
}
