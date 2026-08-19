import type { SupabaseClient } from "@supabase/supabase-js";
import { PlatformAuthError } from "./linkedin";

// Ported from PostIT-web (v1). X is the platform's publish_mode='assisted'
// case: the API tier that allows posting costs $100/mo, so v1 never auto-posts
// to X — it hands the user a copy-ready draft and waits for manual confirm.
// That decision is a founder call already made in v1's commit history
// ("Copy & Post flow — manual confirm replaces X auto-posting"), not something
// to silently reverse here. The postToX function below exists for the day a
// connection is upgraded to publish_mode='api', not for current dispatch.

export async function postToX(
  content: string,
  accessToken: string,
): Promise<string> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content }),
  });
  const data = await res.json();
  if (res.status === 401 || res.status === 403) throw new PlatformAuthError("x");
  if (!res.ok) throw new Error(data?.detail || data?.title || JSON.stringify(data));
  return data.data?.id as string;
}

/**
 * Post a thread as a chain of replies. Returns the posted tweet IDs in order.
 */
export async function postXThread(
  tweets: string[],
  accessToken: string,
): Promise<string[]> {
  let lastTweetId: string | null = null;
  const postedIds: string[] = [];

  for (const text of tweets) {
    const body: Record<string, unknown> = { text };
    if (lastTweetId) body.reply = { in_reply_to_tweet_id: lastTweetId };

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.status === 401 || res.status === 403) throw new PlatformAuthError("x");
    if (!res.ok) throw new Error(data?.detail || data?.title || JSON.stringify(data));

    lastTweetId = data.data?.id;
    postedIds.push(lastTweetId!);
  }

  return postedIds;
}

/**
 * Proactively refresh an X OAuth 2.0 access token. X rotates the refresh
 * token on every use — always persist the new one, never reuse the old.
 * Returns the fresh access_token, or null if refresh failed.
 */
export async function refreshXToken(
  db: SupabaseClient,
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.X_CLIENT_ID!,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error(`X token refresh failed for user=${userId}:`, data?.error, data?.error_description);
    await db
      .from("platform_connections")
      .update({ token_expires_at: new Date(0).toISOString() })
      .eq("user_id", userId)
      .eq("platform", "twitter");
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
    .eq("platform", "twitter");

  return data.access_token;
}
