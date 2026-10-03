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
import { classifyMeta, mapLimited, readMetaError } from "./meta";

// Facebook: a creator's Facebook PAGE, through Facebook Login. Checked against developers.facebook.com on 2026-10-03:
//   authorize   https://www.facebook.com/v25.0/dialog/oauth  (client_id, redirect_uri, state, scope, response_type=code)
//   code → user token            GET https://graph.facebook.com/v25.0/oauth/access_token
//   short → long-lived (60 days) GET …/oauth/access_token?grant_type=fb_exchange_token
//   their Pages                  GET /me/accounts  (each Page comes with its own access token, which does not expire
//                                when it was made from a long-lived user token)
//   Page                         GET /me?fields=…  (with a Page token, /me is the Page)
//   posts                        GET /me/posts?fields=…     views  GET /{post-id}/insights?metric=post_media_view
// Permissions: pages_show_list, pages_read_engagement, read_insights.
//
// Facebook retired the old impression metrics in November 2025 and moved to "media views"; views are read best-effort
// so a metric change on Meta's side leaves the likes, comments and shares working.
// The creator's Page with the most followers is the one connected. (Choosing between Pages comes later.)

export const FACEBOOK_SCOPES = ["pages_show_list", "pages_read_engagement", "read_insights"] as const;

const VERSION = "v25.0";
const DIALOG_URL = `https://www.facebook.com/${VERSION}/dialog/oauth`;
const GRAPH = `https://graph.facebook.com/${VERSION}`;
const HOSTS = ["www.facebook.com", "graph.facebook.com"] as const;

const POST_FIELDS =
  "id,message,created_time,permalink_url,full_picture,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)";
/** A Page token made from a long-lived user token doesn't expire; this is only a far-off marker for "no expiry". */
const NO_EXPIRY = null;

export function createFacebookAdapter(config: ProviderConfig, baseFetch: FetchLike = fetch): ProviderAdapter {
  const fetchImpl = fetchFor(config, HOSTS, baseFetch);
  const call = (url: string, init: RequestInit) => send("facebook", fetchImpl, url, init, readMetaError, classifyMeta);
  const withToken = (url: string, token: string) => {
    const u = new URL(url);
    u.searchParams.set("access_token", token);
    return u.toString();
  };

  const tokenUrl = (params: Record<string, string>) => {
    const url = new URL(`${GRAPH}/oauth/access_token`);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("client_secret", config.clientSecret);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  };

  return {
    id: "facebook",
    name: "Facebook",
    requiredScopes: ["pages_show_list"],
    // A Page token doesn't run out, so nothing is renewed.
    refreshWindowMs: 0,

    authorizeUrl(state) {
      const url = new URL(withMock(config, DIALOG_URL));
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("scope", FACEBOOK_SCOPES.join(","));
      url.searchParams.set("response_type", "code");
      return url.toString();
    },

    async exchangeCode(code) {
      const short = await call(tokenUrl({ redirect_uri: config.redirectUri, code }), { method: "GET" });
      const shortToken = str(short.body, "access_token");
      if (!shortToken) throw new ProviderApiError("facebook", "malformed_response", "transient", 200);
      const long = await call(tokenUrl({ grant_type: "fb_exchange_token", fb_exchange_token: shortToken }), { method: "GET" });
      const userToken = str(long.body, "access_token");
      if (!userToken) throw new ProviderApiError("facebook", "malformed_response", "transient", 200);

      // The Pages this person manages; the connection is to the Page, using the Page's own token.
      const pages = await call(withToken(`${GRAPH}/me/accounts?fields=id,name,access_token,followers_count,fan_count&limit=100`, userToken), { method: "GET" });
      const candidates = arr(pages.body, "data")
        .filter((p) => str(p, "id") && str(p, "access_token"))
        .sort((a, b) => (num(b, "followers_count") ?? num(b, "fan_count") ?? 0) - (num(a, "followers_count") ?? num(a, "fan_count") ?? 0));
      const page = candidates[0];
      if (!page) throw new ProviderApiError("facebook", "no_page", "rejected", 200);

      return { accessToken: str(page, "access_token")!, refreshToken: null, accessExpiresAt: NO_EXPIRY, refreshExpiresAt: null, scopes: [...FACEBOOK_SCOPES] } satisfies ProviderTokens;
    },

    canRefresh() {
      return false;
    },
    async refresh(tokens) {
      return tokens;
    },

    async fetchAccount(tokens): Promise<ProviderAccount> {
      const { body } = await call(withToken(`${GRAPH}/me?fields=id,name,username,followers_count,fan_count,picture.type(large){url}`, tokens.accessToken), { method: "GET" });
      const id = str(body, "id");
      if (!id) throw new ProviderApiError("facebook", "malformed_response", "transient", 200);
      return {
        externalId: id,
        name: str(body, "name") ?? null,
        handle: str(body, "username") ?? null,
        avatarUrl: str(obj(obj(body, "picture"), "data"), "url") ?? null,
        followers: num(body, "followers_count") ?? num(body, "fan_count") ?? null,
        following: null,
        likes: num(body, "fan_count") ?? null,
        posts: null,
      };
    },

    async fetchPosts(tokens, _account, page): Promise<PostPage> {
      const url = new URL(`${GRAPH}/me/posts`);
      url.searchParams.set("fields", POST_FIELDS);
      url.searchParams.set("limit", String(Math.min(page.limit, 50)));
      if (page.cursor) url.searchParams.set("after", page.cursor);
      const { body } = await call(withToken(url.toString(), tokens.accessToken), { method: "GET" });

      const items = arr(body, "data").filter((m) => typeof m === "object" && m !== null);
      const views = await mapLimited(items, 5, async (m) => {
        const id = str(m, "id");
        if (!id) return null;
        try {
          const reply = await call(withToken(`${GRAPH}/${encodeURIComponent(id)}/insights?metric=post_media_view`, tokens.accessToken), { method: "GET" });
          const entry = arr(reply.body, "data")[0];
          return num(arr(entry, "values")[0], "value") ?? null;
        } catch (err) {
          if (err instanceof ProviderApiError && (err.kind === "reauth" || err.kind === "rate_limit")) throw err;
          return null;
        }
      });

      const posts: ProviderPost[] = items
        .map((m, i) => {
          const when = str(m, "created_time");
          const message = str(m, "message") ?? "";
          return {
            id: str(m, "id") ?? "",
            title: message.split("\n")[0]?.slice(0, 200) ?? "",
            postedAt: when ? new Date(when) : null,
            coverUrl: str(m, "full_picture") ?? null,
            shareUrl: str(m, "permalink_url") ?? null,
            durationSeconds: null,
            views: views[i] ?? null,
            likes: num(obj(obj(m, "reactions"), "summary"), "total_count") ?? 0,
            comments: num(obj(obj(m, "comments"), "summary"), "total_count") ?? 0,
            shares: num(obj(m, "shares"), "count") ?? 0,
            saves: null,
          };
        })
        .filter((p) => p.id);

      const after = str(obj(obj(body, "paging"), "cursors"), "after");
      const hasNext = typeof obj(body, "paging")?.next === "string";
      return { posts, cursor: hasNext && after ? after : null, hasMore: hasNext && !!after };
    },

    // Revoking needs the person's own token, which we don't keep; they remove the app in Facebook's settings.
    async revoke() {},
  };
}
