import {
  ProviderApiError,
  type FetchLike,
  type PostPage,
  type ProviderAccount,
  type ProviderAdapter,
  type ProviderConfig,
  type ProviderErrorKind,
  type ProviderPost,
  type ProviderTokens,
} from "./types";
import { arr, fetchFor, num, obj, send, str, withMock } from "./http";

// YouTube, through Google sign-in (OAuth 2.0, offline access). Checked against developers.google.com on 2026-10-03:
//   authorize   https://accounts.google.com/o/oauth2/v2/auth  (access_type=offline&prompt=consent so Google sends a refresh token)
//   code / refresh   POST https://oauth2.googleapis.com/token      revoke  POST https://oauth2.googleapis.com/revoke
//   channel     GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true
//   uploads     GET …/playlistItems?part=contentDetails&playlistId=UU…   (a channel's uploads playlist is its id with "UC" → "UU")
//   numbers     GET …/videos?part=snippet,statistics,contentDetails&id=…  (up to 50 ids)
// Permission: youtube.readonly (the least that reads channel and video numbers).
//
// While the Google consent screen is in "Testing", only listed test users can connect and Google ends their grant after
// 7 days: the connection then shows "Reconnect" (needs_reauth). Publishing the consent screen lifts that.

export const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"] as const;

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const API = "https://www.googleapis.com/youtube/v3";
const HOSTS = ["accounts.google.com", "oauth2.googleapis.com", "www.googleapis.com"] as const;

/** Google's errors: { error: "invalid_grant" } from the token endpoint, { error: { code, status, errors: [{ reason }] } } from the APIs. */
function readGoogleError(body: unknown): { code: string } | null {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const error = (body as { error: unknown }).error;
  if (typeof error === "string") return { code: error };
  const reason = str(arr(error, "errors")[0], "reason");
  const status = str(error, "status");
  const code = num(error, "code");
  return { code: reason ?? status ?? (code !== undefined ? String(code) : "error") };
}

function classifyGoogle(code: string, httpStatus: number): ProviderErrorKind {
  if (code === "invalid_grant" || code === "UNAUTHENTICATED" || code === "authError" || httpStatus === 401) return "reauth";
  if (code === "quotaExceeded" || code === "rateLimitExceeded" || code === "RESOURCE_EXHAUSTED" || httpStatus === 429) return "rate_limit";
  if (code === "insufficientPermissions" || code === "forbidden" || code === "PERMISSION_DENIED" || code === "access_denied") return "scope";
  if (httpStatus >= 500 || code === "network_error" || code === "malformed_response" || code === "backendError") return "transient";
  return "rejected";
}

/** ISO 8601 durations ("PT1M3S") in seconds. */
export function parseIsoDuration(text: string | undefined): number | null {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(text ?? "");
  if (!m) return null;
  return Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
}

const count = (value: unknown): number | null => {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : null;
};

export function createYouTubeAdapter(config: ProviderConfig, baseFetch: FetchLike = fetch, now: () => Date = () => new Date()): ProviderAdapter {
  const fetchImpl = fetchFor(config, HOSTS, baseFetch);
  const call = (url: string, init: RequestInit) => send("youtube", fetchImpl, url, init, readGoogleError, classifyGoogle);
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
  const form = (params: Record<string, string>) => ({
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  const readTokens = (body: unknown, previous?: ProviderTokens): ProviderTokens => {
    const accessToken = str(body, "access_token");
    const seconds = num(body, "expires_in");
    if (!accessToken || !seconds) throw new ProviderApiError("youtube", "malformed_response", "transient", 200);
    // On a refresh Google usually sends no new refresh token: the old one keeps working.
    const refreshToken = str(body, "refresh_token") ?? previous?.refreshToken ?? null;
    const scope = str(body, "scope");
    return {
      accessToken,
      refreshToken,
      accessExpiresAt: new Date(now().getTime() + seconds * 1000),
      refreshExpiresAt: null,
      scopes: scope ? scope.split(/\s+/).filter(Boolean) : (previous?.scopes ?? [...YOUTUBE_SCOPES]),
    };
  };

  return {
    id: "youtube",
    name: "YouTube",
    requiredScopes: [...YOUTUBE_SCOPES],
    // Access tokens last an hour: renew when there is under five minutes left.
    refreshWindowMs: 5 * 60 * 1000,

    authorizeUrl(state) {
      const url = new URL(withMock(config, AUTHORIZE_URL));
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", YOUTUBE_SCOPES.join(" "));
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      url.searchParams.set("include_granted_scopes", "true");
      url.searchParams.set("state", state);
      return url.toString();
    },

    async exchangeCode(code) {
      const { body } = await call(
        TOKEN_URL,
        form({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
      );
      const tokens = readTokens(body);
      // Without a refresh token the connection would die within the hour.
      if (!tokens.refreshToken) throw new ProviderApiError("youtube", "no_refresh_token", "rejected", 200);
      return tokens;
    },

    canRefresh(tokens) {
      return tokens.refreshToken !== null;
    },

    async refresh(tokens) {
      const { body } = await call(
        TOKEN_URL,
        form({ refresh_token: tokens.refreshToken ?? "", client_id: config.clientId, client_secret: config.clientSecret, grant_type: "refresh_token" }),
      );
      return readTokens(body, tokens);
    },

    async fetchAccount(tokens): Promise<ProviderAccount> {
      const { body } = await call(`${API}/channels?part=snippet,statistics&mine=true`, { method: "GET", headers: bearer(tokens.accessToken) });
      const channel = arr(body, "items")[0];
      const id = str(channel, "id");
      if (!id) throw new ProviderApiError("youtube", "no_channel", "rejected", 200);
      const snippet = obj(channel, "snippet");
      const stats = obj(channel, "statistics");
      const thumbs = obj(snippet, "thumbnails");
      return {
        externalId: id,
        name: str(snippet, "title") ?? null,
        handle: str(snippet, "customUrl")?.replace(/^@/, "") ?? null,
        avatarUrl: str(obj(thumbs, "high"), "url") ?? str(obj(thumbs, "default"), "url") ?? null,
        followers: stats?.hiddenSubscriberCount === true ? null : count(stats?.subscriberCount),
        following: null,
        likes: null,
        posts: count(stats?.videoCount),
      };
    },

    async fetchPosts(tokens, account, page): Promise<PostPage> {
      // A channel's uploads sit in a playlist whose id is the channel id with "UC" replaced by "UU"
      const playlist = account.externalId.replace(/^UC/, "UU");
      const list = new URL(`${API}/playlistItems`);
      list.searchParams.set("part", "contentDetails");
      list.searchParams.set("playlistId", playlist);
      list.searchParams.set("maxResults", String(Math.min(page.limit, 50)));
      if (page.cursor) list.searchParams.set("pageToken", page.cursor);
      const listed = await call(list.toString(), { method: "GET", headers: bearer(tokens.accessToken) });

      const ids = arr(listed.body, "items").map((i) => str(obj(i, "contentDetails"), "videoId")).filter((id): id is string => !!id);
      const nextPage = str(listed.body, "nextPageToken") ?? null;
      if (ids.length === 0) return { posts: [], cursor: null, hasMore: false };

      const videos = new URL(`${API}/videos`);
      videos.searchParams.set("part", "snippet,statistics,contentDetails");
      videos.searchParams.set("id", ids.join(","));
      const details = await call(videos.toString(), { method: "GET", headers: bearer(tokens.accessToken) });

      const posts: ProviderPost[] = arr(details.body, "items")
        .map((v) => {
          const id = str(v, "id") ?? "";
          const snippet = obj(v, "snippet");
          const stats = obj(v, "statistics");
          const thumbs = obj(snippet, "thumbnails");
          const published = str(snippet, "publishedAt");
          return {
            id,
            title: (str(snippet, "title") ?? "").slice(0, 200),
            postedAt: published ? new Date(published) : null,
            coverUrl: str(obj(thumbs, "high"), "url") ?? str(obj(thumbs, "medium"), "url") ?? str(obj(thumbs, "default"), "url") ?? null,
            shareUrl: id ? `https://www.youtube.com/watch?v=${id}` : null,
            durationSeconds: parseIsoDuration(str(obj(v, "contentDetails"), "duration")),
            views: count(stats?.viewCount) ?? 0,
            likes: count(stats?.likeCount) ?? 0,
            comments: count(stats?.commentCount) ?? 0,
            // YouTube doesn't report shares or saves to the Data API
            shares: null,
            saves: null,
          };
        })
        .filter((p) => p.id)
        // the playlist is newest first; "videos" is not ordered
        .sort((a, b) => (b.postedAt?.getTime() ?? 0) - (a.postedAt?.getTime() ?? 0));

      return { posts, cursor: nextPage, hasMore: nextPage !== null };
    },

    async revoke(tokens) {
      // Revoking the refresh token ends the whole grant
      await call(REVOKE_URL, form({ token: tokens.refreshToken ?? tokens.accessToken }));
    },
  };
}
