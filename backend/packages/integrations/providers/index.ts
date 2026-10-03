import { assertLocalOrigin, assertValidRedirectUri } from "./http";
import { createFacebookAdapter } from "./facebook";
import { createInstagramAdapter } from "./instagram";
import { createThreadsAdapter } from "./threads";
import { createTikTokAdapter } from "./tiktok";
import { createYouTubeAdapter } from "./youtube";
import type { FetchLike, ProviderAdapter, ProviderConfig, ProviderId } from "./types";

export { ProviderApiError, PROVIDER_IDS, PROVIDER_NAMES, isProviderId } from "./types";
export type { PostPage, ProviderAccount, ProviderAdapter, ProviderConfig, ProviderId, ProviderPost, ProviderTokens, ProviderErrorKind } from "./types";
export { ProviderConfigError, assertLocalOrigin, assertValidRedirectUri } from "./http";

type Env = Record<string, string | undefined>;

/** The settings each platform needs, by the names the server's environment uses. */
const ENV: Record<ProviderId, { id: string; secret: string; redirect: string; mock: string }> = {
  tiktok: { id: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET", redirect: "TIKTOK_REDIRECT_URI", mock: "TIKTOK_MOCK_ORIGIN" },
  instagram: { id: "INSTAGRAM_APP_ID", secret: "INSTAGRAM_APP_SECRET", redirect: "INSTAGRAM_REDIRECT_URI", mock: "INSTAGRAM_MOCK_ORIGIN" },
  threads: { id: "THREADS_APP_ID", secret: "THREADS_APP_SECRET", redirect: "THREADS_REDIRECT_URI", mock: "THREADS_MOCK_ORIGIN" },
  facebook: { id: "FACEBOOK_APP_ID", secret: "FACEBOOK_APP_SECRET", redirect: "FACEBOOK_REDIRECT_URI", mock: "FACEBOOK_MOCK_ORIGIN" },
  youtube: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET", redirect: "YOUTUBE_REDIRECT_URI", mock: "YOUTUBE_MOCK_ORIGIN" },
};

/** The environment variables a platform needs, for the "not set up" message and the runbook. */
export const providerEnvNames = (id: ProviderId) => ENV[id];

/**
 * Reads one platform's settings from the environment. null = this server isn't set up for it (so the app can say so
 * rather than crash); throws ProviderConfigError when it is set up wrongly. The redirect address is, by default,
 * `<APP_WEB_URL>/auth/<platform>/callback` (the web app's own page), or the platform's *_REDIRECT_URI when given.
 */
export function providerConfigFromEnv(id: ProviderId, env: Env = process.env): ProviderConfig | null {
  const names = ENV[id];
  const clientId = env[names.id]?.trim();
  const clientSecret = env[names.secret]?.trim();
  if (!clientId || !clientSecret) return null;

  const web = env.APP_WEB_URL?.trim().replace(/\/+$/, "");
  const redirectUri = env[names.redirect]?.trim() || (web ? `${web}/auth/${id}/callback` : "");
  if (!redirectUri) return null;

  const mockRaw = env[names.mock]?.trim();
  const mockOrigin = mockRaw ? assertLocalOrigin(mockRaw, names.mock) : undefined;
  // A stand-in on this machine can't use https, so its redirect may be http://localhost too.
  assertValidRedirectUri(redirectUri, names.redirect, { allowLocalHttp: mockOrigin !== undefined });
  return { clientId, clientSecret, redirectUri, ...(mockOrigin && { mockOrigin }) };
}

export function createProviderAdapter(id: ProviderId, config: ProviderConfig, fetchImpl?: FetchLike, now?: () => Date): ProviderAdapter {
  switch (id) {
    case "tiktok":
      return createTikTokAdapter(config, fetchImpl);
    case "instagram":
      return createInstagramAdapter(config, fetchImpl, now);
    case "threads":
      return createThreadsAdapter(config, fetchImpl, now);
    case "facebook":
      return createFacebookAdapter(config, fetchImpl);
    case "youtube":
      return createYouTubeAdapter(config, fetchImpl, now);
  }
}
