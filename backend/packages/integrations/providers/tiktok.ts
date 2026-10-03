import {
  TikTokApiError,
  buildAuthorizeUrl,
  exchangeCode,
  fetchForConfig,
  fetchUserInfo,
  listVideos,
  refreshTokens,
  revokeToken,
  type TikTokConfig,
  type TikTokTokens,
} from "../tiktok";
import {
  ProviderApiError,
  type FetchLike,
  type PostPage,
  type ProviderAccount,
  type ProviderAdapter,
  type ProviderConfig,
  type ProviderTokens,
} from "./types";

// TikTok as a provider: the Login Kit + Display API client in ../tiktok.ts, spoken in the shape every platform shares.

const toTokens = (t: TikTokTokens): ProviderTokens => ({
  accessToken: t.accessToken,
  refreshToken: t.refreshToken,
  accessExpiresAt: t.accessExpiresAt,
  refreshExpiresAt: t.refreshExpiresAt,
  scopes: t.scopes,
});

/** TikTok's own error type becomes the shared one; anything else (a bug, not the platform) passes through. */
async function wrap<T>(job: () => Promise<T>): Promise<T> {
  try {
    return await job();
  } catch (err) {
    if (err instanceof TikTokApiError) throw new ProviderApiError("tiktok", err.code, err.kind, err.httpStatus, err.logId);
    throw err;
  }
}

export function createTikTokAdapter(config: ProviderConfig, baseFetch: FetchLike = fetch): ProviderAdapter {
  const tiktok: TikTokConfig = {
    clientKey: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    ...(config.mockOrigin && { mockOrigin: config.mockOrigin }),
  };
  // Real TikTok, unless the config points at the local stand-in (local testing only).
  const fetchImpl = fetchForConfig(tiktok, baseFetch);

  return {
    id: "tiktok",
    name: "TikTok",
    requiredScopes: ["user.info.basic"],
    refreshWindowMs: 10 * 60 * 1000,

    authorizeUrl: (state) => buildAuthorizeUrl(tiktok, state),

    exchangeCode: (code) => wrap(async () => toTokens(await exchangeCode(tiktok, code, fetchImpl))),

    canRefresh: (tokens, now) => tokens.refreshToken !== null && (tokens.refreshExpiresAt === null || tokens.refreshExpiresAt.getTime() > now.getTime()),

    refresh: (tokens) =>
      wrap(async () => {
        const fresh = toTokens(await refreshTokens(tiktok, tokens.refreshToken ?? "", fetchImpl));
        return { ...fresh, scopes: fresh.scopes.length > 0 ? fresh.scopes : tokens.scopes };
      }),

    fetchAccount: (tokens) =>
      wrap(async (): Promise<ProviderAccount> => {
        const user = await fetchUserInfo(tokens.accessToken, tokens.scopes, fetchImpl);
        if (!user.openId) throw new TikTokApiError("malformed_response", "transient", 200);
        return {
          externalId: user.openId,
          name: user.displayName,
          handle: null, // TikTok's @handle needs a fourth permission (user.info.profile)
          avatarUrl: user.avatarUrl,
          followers: user.followers,
          following: user.following,
          likes: user.likes,
          posts: user.videos,
        };
      }),

    fetchPosts: (tokens, _account, page) =>
      wrap(async (): Promise<PostPage> => {
        if (!tokens.scopes.includes("video.list")) return { posts: [], cursor: null, hasMore: false };
        const result = await listVideos(tokens.accessToken, { ...(page.cursor !== null && { cursor: Number(page.cursor) }), maxCount: page.limit }, fetchImpl);
        return {
          posts: result.videos.map((v) => ({
            id: v.id,
            title: v.title,
            postedAt: v.createdAt,
            coverUrl: v.coverUrl,
            shareUrl: v.shareUrl,
            durationSeconds: v.durationSeconds,
            views: v.views,
            likes: v.likes,
            comments: v.comments,
            shares: v.shares,
            saves: null, // the Display API doesn't report saves
          })),
          cursor: result.cursor === null ? null : String(result.cursor),
          hasMore: result.hasMore,
        };
      }),

    revoke: (tokens) => wrap(() => revokeToken(tiktok, tokens.accessToken, fetchImpl)),
  };
}
