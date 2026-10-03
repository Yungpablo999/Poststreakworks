import { z } from "zod";

// TikTok Login Kit (web flow) + Display API v2.
// Endpoints, parameters and fields verified against developers.tiktok.com on
// 2026-10-02 (Login Kit for Web; Manage User Access Tokens; Get User Info;
// List Videos).
//
// Notes that shaped this file:
//   - The web flow needs no PKCE (code_verifier is for mobile/desktop SDK flows
//     only). The anti-CSRF protection is a single-use `state` bound to the
//     signed-in user server-side — see packages/workflows/tiktok-connect.ts.
//   - Redirect URIs must be https, static (no query string), no fragment, and
//     registered in the TikTok app. We take ours from TIKTOK_REDIRECT_URI and
//     never from the request.
//   - Access tokens last 24 h; refresh tokens 365 days.
//   - `username` (the @handle) needs the user.info.profile scope, which is not
//     among the three we request, so only display_name is available for now.
//
// Nothing here logs. Errors carry TikTok's error code and log id only — never
// the client secret or any token.

export const TIKTOK_SCOPES = ["user.info.basic", "user.info.stats", "video.list"] as const;

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const API_BASE = "https://open.tiktokapis.com/v2";
const TIMEOUT_MS = 15_000;

type FetchLike = typeof fetch;

// ─── Configuration ──────────────────────────────────────────────────────────

export type TikTokConfig = {
  clientKey: string;
  clientSecret: string;
  /** Exactly as registered in the TikTok app, e.g. https://app.poststreak.app/auth/tiktok/callback */
  redirectUri: string;
  /**
   * Local testing only. When set, every call that would go to TikTok goes to a stand-in
   * TikTok running on this machine instead (backend/scripts/mock-tiktok.mjs), so the whole
   * connect → sync → disconnect flow can be tried on localhost, where real TikTok can't
   * reach us (it needs an https redirect address). Only a localhost address is accepted.
   */
  mockOrigin?: string;
};

export class TikTokConfigError extends Error {}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * A `http://localhost:PORT[/prefix]` address (no trailing slash), or a TikTokConfigError. Anything
 * else could send tokens somewhere they shouldn't go.
 */
export function assertLocalOrigin(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new TikTokConfigError("TIKTOK_MOCK_ORIGIN is not a valid URL");
  }
  if (url.protocol !== "http:" || !LOCAL_HOSTS.has(url.hostname)) {
    throw new TikTokConfigError("TIKTOK_MOCK_ORIGIN must be an http://localhost address");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TikTokConfigError("TIKTOK_MOCK_ORIGIN must be a plain address");
  }
  return url.origin + url.pathname.replace(/\/+$/, "");
}

export function assertValidRedirectUri(uri: string, opts: { allowLocalHttp?: boolean } = {}): void {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new TikTokConfigError("TIKTOK_REDIRECT_URI is not a valid URL");
  }
  const localHttp = opts.allowLocalHttp === true && url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !localHttp) throw new TikTokConfigError("TIKTOK_REDIRECT_URI must be https");
  if (uri.includes("?")) throw new TikTokConfigError("TIKTOK_REDIRECT_URI must not contain query parameters");
  if (uri.includes("#")) throw new TikTokConfigError("TIKTOK_REDIRECT_URI must not contain a fragment");
  if (uri.length > 512) throw new TikTokConfigError("TIKTOK_REDIRECT_URI must be under 512 characters");
}

/**
 * Reads the TikTok app settings from the environment. Returns null when TikTok
 * isn't configured on this server (so the app can say so, rather than crash);
 * throws TikTokConfigError when it is configured wrongly.
 */
export function tiktokConfigFromEnv(env: Record<string, string | undefined> = process.env): TikTokConfig | null {
  const clientKey = env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = env.TIKTOK_CLIENT_SECRET?.trim();
  const redirectUri = env.TIKTOK_REDIRECT_URI?.trim();
  if (!clientKey || !clientSecret || !redirectUri) return null;
  const mockRaw = env.TIKTOK_MOCK_ORIGIN?.trim();
  const mockOrigin = mockRaw ? assertLocalOrigin(mockRaw) : undefined;
  // A stand-in TikTok on this machine can't use https, so its redirect may be http://localhost too.
  assertValidRedirectUri(redirectUri, { allowLocalHttp: mockOrigin !== undefined });
  return { clientKey, clientSecret, redirectUri, ...(mockOrigin && { mockOrigin }) };
}

const REAL_API_ORIGIN = "https://open.tiktokapis.com";

/** `fetch` for this config: real TikTok normally; the local stand-in when `mockOrigin` is set. */
export function fetchForConfig(config: TikTokConfig, fetchImpl: FetchLike = fetch): FetchLike {
  const mock = config.mockOrigin;
  if (!mock) return fetchImpl;
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const target = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    return fetchImpl(target.startsWith(REAL_API_ORIGIN) ? mock + target.slice(REAL_API_ORIGIN.length) : target, init);
  }) as FetchLike;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export type TikTokErrorKind =
  /** The connection can't be used any more; the creator must connect again. */
  | "reauth"
  /** A permission we need wasn't granted. */
  | "scope"
  | "rate_limit"
  /** TikTok (or the network) had a problem; try again later. */
  | "transient"
  /** TikTok refused the request (bad code, bad params…). */
  | "rejected";

export class TikTokApiError extends Error {
  constructor(
    readonly code: string,
    readonly kind: TikTokErrorKind,
    readonly httpStatus: number,
    readonly logId?: string,
  ) {
    super(`TikTok API error: ${code}${logId ? ` (log ${logId})` : ""}`);
    this.name = "TikTokApiError";
  }
}

const REAUTH_CODES = new Set(["invalid_grant", "access_token_invalid", "invalid_token", "refresh_token_expired", "token_expired"]);

function classify(code: string, httpStatus: number): TikTokErrorKind {
  if (REAUTH_CODES.has(code) || httpStatus === 401) return "reauth";
  if (code.includes("scope")) return "scope";
  if (code === "rate_limit_exceeded" || httpStatus === 429) return "rate_limit";
  if (httpStatus >= 500 || code === "internal_error" || code === "network_error" || code === "malformed_response") {
    return "transient";
  }
  return "rejected";
}

/** TikTok reports failures as {error: "code"} (token endpoint) or {error: {code, message, log_id}} (APIs). */
function readError(body: unknown): { code: string; logId?: string } | null {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const error = (body as { error: unknown }).error;
  if (typeof error === "string") {
    return error && error !== "ok" ? { code: error, logId: stringField(body, "log_id") } : null;
  }
  if (typeof error === "object" && error !== null) {
    const code = stringField(error, "code");
    if (!code || code === "ok") return null;
    return { code, logId: stringField(error, "log_id") };
  }
  return null;
}

function stringField(value: unknown, key: string): string | undefined {
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : undefined;
}

async function send(fetchImpl: FetchLike, url: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new TikTokApiError("network_error", "transient", 0);
  }
  let body: unknown = null;
  try {
    body = JSON.parse(await response.text());
  } catch {
    // A 5xx from an edge proxy is often HTML. The status code is enough.
  }
  const error = readError(body);
  if (error || response.status >= 400) {
    const code = error?.code ?? `http_${response.status}`;
    throw new TikTokApiError(code, classify(code, response.status), response.status, error?.logId);
  }
  return { status: response.status, body };
}

// ─── Authorize ──────────────────────────────────────────────────────────────

/** The TikTok page the creator is sent to. `state` must be single-use and bound to them. */
export function buildAuthorizeUrl(config: TikTokConfig, state: string): string {
  const url = new URL(config.mockOrigin ? `${config.mockOrigin}/v2/auth/authorize/` : AUTHORIZE_URL);
  url.searchParams.set("client_key", config.clientKey);
  url.searchParams.set("scope", TIKTOK_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

// ─── Tokens ─────────────────────────────────────────────────────────────────

export type TikTokTokens = {
  accessToken: string;
  refreshToken: string;
  openId: string;
  scopes: string[];
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
};

const tokenResponse = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  open_id: z.string().min(1),
  expires_in: z.number().positive(),
  refresh_expires_in: z.number().positive(),
  scope: z.string().default(""),
});

async function tokenRequest(
  config: TikTokConfig,
  params: Record<string, string>,
  fetchImpl: FetchLike,
  now: Date,
): Promise<TikTokTokens> {
  const form = new URLSearchParams({ client_key: config.clientKey, client_secret: config.clientSecret, ...params });
  const { body } = await send(fetchImpl, `${API_BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: form.toString(),
  });
  const parsed = tokenResponse.safeParse(body);
  if (!parsed.success) throw new TikTokApiError("malformed_response", "transient", 200);
  const t = parsed.data;
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    openId: t.open_id,
    scopes: t.scope.split(",").map((s) => s.trim()).filter(Boolean),
    accessExpiresAt: new Date(now.getTime() + t.expires_in * 1000),
    refreshExpiresAt: new Date(now.getTime() + t.refresh_expires_in * 1000),
  };
}

/** Exchanges the one-time `code` TikTok sent back to the redirect URI. */
export function exchangeCode(config: TikTokConfig, code: string, fetchImpl: FetchLike = fetch, now = new Date()) {
  return tokenRequest(
    config,
    { code, grant_type: "authorization_code", redirect_uri: config.redirectUri },
    fetchImpl,
    now,
  );
}

export function refreshTokens(config: TikTokConfig, refreshToken: string, fetchImpl: FetchLike = fetch, now = new Date()) {
  return tokenRequest(config, { grant_type: "refresh_token", refresh_token: refreshToken }, fetchImpl, now);
}

/** Tells TikTok to invalidate the access token (used when a creator disconnects). */
export async function revokeToken(config: TikTokConfig, accessToken: string, fetchImpl: FetchLike = fetch): Promise<void> {
  const form = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    token: accessToken,
  });
  await send(fetchImpl, `${API_BASE}/oauth/revoke/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: form.toString(),
  });
}

// ─── Account ────────────────────────────────────────────────────────────────

export type TikTokUser = {
  openId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  likes: number | null;
  videos: number | null;
};

/** Asking for a field outside the granted scopes fails the whole request, so ask only for what we may. */
export function userFieldsForScopes(scopes: readonly string[]): string[] {
  const fields: string[] = [];
  if (scopes.includes("user.info.basic")) fields.push("open_id", "display_name", "avatar_url");
  if (scopes.includes("user.info.stats")) fields.push("follower_count", "following_count", "likes_count", "video_count");
  return fields;
}

const userResponse = z.object({
  data: z.object({
    user: z.object({
      open_id: z.string().optional(),
      display_name: z.string().optional(),
      avatar_url: z.string().optional(),
      follower_count: z.number().optional(),
      following_count: z.number().optional(),
      likes_count: z.number().optional(),
      video_count: z.number().optional(),
    }),
  }),
});

export async function fetchUserInfo(accessToken: string, scopes: readonly string[], fetchImpl: FetchLike = fetch): Promise<TikTokUser> {
  const fields = userFieldsForScopes(scopes);
  if (fields.length === 0) throw new TikTokApiError("scope_not_authorized", "scope", 403);

  const { body } = await send(fetchImpl, `${API_BASE}/user/info/?fields=${fields.join(",")}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const parsed = userResponse.safeParse(body);
  if (!parsed.success) throw new TikTokApiError("malformed_response", "transient", 200);
  const u = parsed.data.data.user;
  return {
    openId: u.open_id ?? null,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    followers: u.follower_count ?? null,
    following: u.following_count ?? null,
    likes: u.likes_count ?? null,
    videos: u.video_count ?? null,
  };
}

// ─── Videos ─────────────────────────────────────────────────────────────────

export type TikTokVideo = {
  id: string;
  title: string;
  createdAt: Date | null;
  coverUrl: string | null;
  shareUrl: string | null;
  durationSeconds: number | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

const VIDEO_FIELDS = [
  "id",
  "title",
  "create_time",
  "cover_image_url",
  "share_url",
  "duration",
  "view_count",
  "like_count",
  "comment_count",
  "share_count",
];

const videoSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  create_time: z.number().optional(),
  cover_image_url: z.string().optional(),
  share_url: z.string().optional(),
  duration: z.number().optional(),
  view_count: z.number().optional(),
  like_count: z.number().optional(),
  comment_count: z.number().optional(),
  share_count: z.number().optional(),
});

const videoListResponse = z.object({
  data: z.object({
    videos: z.array(z.unknown()).default([]),
    cursor: z.number().optional(),
    has_more: z.boolean().optional(),
  }),
});

/** One page of the creator's videos, newest first. TikTok allows at most 20 per page. */
export async function listVideos(
  accessToken: string,
  opts: { cursor?: number; maxCount?: number } = {},
  fetchImpl: FetchLike = fetch,
): Promise<{ videos: TikTokVideo[]; cursor: number | null; hasMore: boolean }> {
  const { body } = await send(fetchImpl, `${API_BASE}/video/list/?fields=${VIDEO_FIELDS.join(",")}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      max_count: Math.min(opts.maxCount ?? 20, 20),
      ...(opts.cursor !== undefined && { cursor: opts.cursor }),
    }),
  });
  const parsed = videoListResponse.safeParse(body);
  if (!parsed.success) throw new TikTokApiError("malformed_response", "transient", 200);

  const videos: TikTokVideo[] = [];
  for (const raw of parsed.data.data.videos) {
    const v = videoSchema.safeParse(raw);
    if (!v.success) continue; // one odd entry shouldn't lose the page
    videos.push({
      id: v.data.id,
      title: v.data.title ?? "",
      createdAt: v.data.create_time ? new Date(v.data.create_time * 1000) : null,
      coverUrl: v.data.cover_image_url ?? null,
      shareUrl: v.data.share_url ?? null,
      durationSeconds: v.data.duration ?? null,
      views: v.data.view_count ?? 0,
      likes: v.data.like_count ?? 0,
      comments: v.data.comment_count ?? 0,
      shares: v.data.share_count ?? 0,
    });
  }
  return {
    videos,
    cursor: parsed.data.data.cursor ?? null,
    hasMore: parsed.data.data.has_more ?? false,
  };
}
