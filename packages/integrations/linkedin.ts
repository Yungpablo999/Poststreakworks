import type { SupabaseClient } from "@supabase/supabase-js";

// Ported from PostIT-web (v1) src/app/api/cron/dispatch/route.ts and
// src/app/api/post/now/route.ts — this is proven, production logic, not a
// rewrite. Only the token storage table changed (user_tokens -> platform_connections).

export class PlatformAuthError extends Error {
  isAuthError = true;
  constructor(platform: string) {
    super(`${platform} account disconnected — reconnect required`);
  }
}

/**
 * Publish to LinkedIn via the REST API (2024+ — ugcPosts is deprecated for
 * most apps). Only a 401 means the token is dead; a 403 is a scope/permission
 * issue and must NOT expire the connection (the token is still valid).
 */
export async function postToLinkedIn(
  content: string,
  accessToken: string,
): Promise<void> {
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (profileRes.status === 401) throw new PlatformAuthError("linkedin");
  if (!profileRes.ok) throw new Error("Failed to fetch LinkedIn profile");
  const profile = await profileRes.json();
  const authorUrn = `urn:li:person:${profile.sub}`;

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202604",
    },
    body: JSON.stringify({
      author: authorUrn,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (res.status === 401) throw new PlatformAuthError("linkedin");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || `LinkedIn API error ${res.status}`);
  }
}

/**
 * Proactively refresh a LinkedIn OAuth 2.0 access token using the stored
 * refresh_token. LinkedIn refresh tokens are valid for 365 days, access
 * tokens for 60 — call this within the expiry buffer, not after expiry.
 * Returns the fresh access_token, or null if refresh failed (revoked/expired),
 * in which case the connection's token_expires_at is set to the epoch so the
 * UI can show "reconnect."
 */
export async function refreshLinkedInToken(
  db: SupabaseClient,
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error(
      `LinkedIn token refresh failed for user=${userId}:`,
      data?.error,
      data?.error_description,
    );
    await db
      .from("platform_connections")
      .update({ token_expires_at: new Date(0).toISOString() })
      .eq("user_id", userId)
      .eq("platform", "linkedin");
    return null;
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  await db
    .from("platform_connections")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshToken,
      token_expires_at: expiresAt,
    })
    .eq("user_id", userId)
    .eq("platform", "linkedin");

  return data.access_token;
}
