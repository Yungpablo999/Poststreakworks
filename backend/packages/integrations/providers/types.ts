// What every social platform connection has in common. Each platform (TikTok, Instagram, Threads,
// Facebook, YouTube) is an adapter that speaks this shape; the connect / sync / disconnect logic
// (packages/workflows/social-connect.ts) is written once against it and tested without any network.
//
// Nothing here logs. Errors carry the platform's error code only, never a token or a secret.

export type ProviderId = "tiktok" | "instagram" | "threads" | "facebook" | "youtube";

export const PROVIDER_IDS: readonly ProviderId[] = ["tiktok", "instagram", "threads", "facebook", "youtube"];
export const isProviderId = (value: string): value is ProviderId => (PROVIDER_IDS as readonly string[]).includes(value);

/** How a platform is named to a creator. */
export const PROVIDER_NAMES: Record<ProviderId, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  threads: "Threads",
  facebook: "Facebook",
  youtube: "YouTube",
};

export type FetchLike = typeof fetch;

/** The tokens of a connection, as they come from the platform (readable: sealed before they are stored). */
export type ProviderTokens = {
  accessToken: string;
  /** null where the platform refreshes the access token with itself (Instagram, Threads) or never expires it (Facebook Pages). */
  refreshToken: string | null;
  /** null = the platform says it doesn't expire (a Facebook Page token). */
  accessExpiresAt: Date | null;
  refreshExpiresAt: Date | null;
  scopes: string[];
};

/** What the platform tells us about the creator's account. */
export type ProviderAccount = {
  /** The platform's own id for the account: TikTok open_id, Instagram user id, YouTube channel id, Facebook Page id… */
  externalId: string;
  name: string | null;
  /** The @handle, where the platform gives one. */
  handle: string | null;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  likes: number | null;
  posts: number | null;
};

export type ProviderPost = {
  id: string;
  title: string;
  postedAt: Date | null;
  coverUrl: string | null;
  shareUrl: string | null;
  durationSeconds: number | null;
  /** null = the platform didn't tell us this time (the number we already hold stays). */
  views: number | null;
  likes: number;
  comments: number;
  shares: number | null;
  /** Not every platform reports saves. */
  saves: number | null;
};

export type PostPage = { posts: ProviderPost[]; cursor: string | null; hasMore: boolean };

export type ProviderErrorKind =
  /** The connection can't be used any more; the creator must connect again. */
  | "reauth"
  /** A permission we need wasn't granted. */
  | "scope"
  | "rate_limit"
  /** The platform (or the network) had a problem; try again later. */
  | "transient"
  /** The platform refused the request (bad code, bad params…). */
  | "rejected";

export class ProviderApiError extends Error {
  constructor(
    readonly provider: ProviderId,
    readonly code: string,
    readonly kind: ProviderErrorKind,
    readonly httpStatus: number,
    readonly logId?: string,
  ) {
    super(`${provider} API error: ${code}${logId ? ` (log ${logId})` : ""}`);
    this.name = "ProviderApiError";
  }
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  /** For messages to the creator: "Instagram". */
  readonly name: string;
  /** Without these the connection is no use (e.g. the profile). */
  readonly requiredScopes: readonly string[];
  /** How long before a token runs out we renew it. */
  readonly refreshWindowMs: number;
  /** Where to send the creator to approve. `state` is single-use and bound to them. */
  authorizeUrl(state: string): string;
  /** Turns the one-time code the platform sent back into tokens (long-lived ones where there's a longer-lived kind). */
  exchangeCode(code: string): Promise<ProviderTokens>;
  /** Can this connection renew its token right now? false = the creator has to connect again. */
  canRefresh(tokens: ProviderTokens, now: Date): boolean;
  /** Renews the token. Must return a complete set (including a rotated refresh token). */
  refresh(tokens: ProviderTokens): Promise<ProviderTokens>;
  fetchAccount(tokens: ProviderTokens): Promise<ProviderAccount>;
  /** One page of the creator's posts, newest first, with their numbers. */
  fetchPosts(tokens: ProviderTokens, account: ProviderAccount, page: { cursor: string | null; limit: number }): Promise<PostPage>;
  /** Tells the platform to forget the grant. Best effort. */
  revoke(tokens: ProviderTokens): Promise<void>;
}

/** What the server needs to talk to one platform. */
export type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  /** Exactly as registered with the platform: https://<app>/auth/<provider>/callback */
  redirectUri: string;
  /**
   * Local testing only. When set, every call that would go to the platform goes to a stand-in on this machine
   * (backend/scripts/mock-providers.mjs) instead, so connect → sync → disconnect can be tried on localhost,
   * where the real platforms can't call back (they need an https address). Only a localhost address is accepted.
   */
  mockOrigin?: string;
};
