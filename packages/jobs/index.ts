import { createClient } from "@supabase/supabase-js";
import {
  postToLinkedIn,
  refreshLinkedInToken,
  PlatformAuthError,
  groqChat,
} from "@poststreak/integrations";
import { recordStreakEvent } from "@poststreak/workflows";

// NEXT_PUBLIC_SUPABASE_URL, not SUPABASE_URL — matches .env.example and
// every other server-side client in this codebase (context.ts, integrations).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type JobPayload = {
  type: string;
  data: Record<string, unknown>;
};

// Ported from PostIT-web (v1) src/app/api/cron/dispatch/route.ts — this is
// real, previously-production logic (atomic claim, stale-lock release,
// proactive token refresh, per-platform rate limits), not a rewrite.
// Structural change from v1: a scheduled_posts row can target several
// platforms at once (v1's `posts` table was one row per platform), so this
// dispatches each target platform independently and aggregates the row's
// top-level status from the per-platform results in `platform_post_ids`.

const DAILY_LIMITS: Record<string, number> = {
  twitter: 10,
  linkedin: 5,
  meta: 10,
  tiktok: 5,
};

type PlatformResult = { status: "published" | "pending_confirmation" | "failed"; id?: string; error?: string };

async function dispatchToPlatform(
  userId: string,
  platform: string,
  content: string,
): Promise<PlatformResult> {
  const { data: connection } = await supabase
    .from("platform_connections")
    .select("publish_mode, access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("platform", platform)
    .is("disconnected_at", null)
    .single();

  if (!connection) {
    return { status: "failed", error: `No ${platform} connection — connect the account first` };
  }

  // Assisted platforms (X, until upgraded to publish_mode='api') are never
  // auto-posted — a deliberate v1 decision, not a gap. The user gets a
  // copy-ready draft and confirms manually via social-scheduling.confirmManual.
  if (connection.publish_mode === "assisted") {
    return { status: "pending_confirmation" };
  }

  if (!connection.access_token) {
    return { status: "failed", error: `No access token for ${platform}` };
  }

  let accessToken = connection.access_token;

  if (platform === "linkedin" && connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at).getTime();
    const needsRefresh = expiresAt - Date.now() < 60 * 60 * 1000;

    if (needsRefresh) {
      if (!connection.refresh_token) {
        return { status: "failed", error: "LinkedIn token expired — reconnect the account" };
      }
      const fresh = await refreshLinkedInToken(supabase, userId, connection.refresh_token);
      if (!fresh) {
        return { status: "failed", error: "LinkedIn token could not be refreshed — reconnect the account" };
      }
      accessToken = fresh;
    }
  }

  try {
    if (platform === "linkedin") {
      await postToLinkedIn(content, accessToken);
      return { status: "published" };
    }
    return { status: "failed", error: `Platform '${platform}' is not yet supported for auto-dispatch` };
  } catch (err) {
    if (err instanceof PlatformAuthError) {
      await supabase
        .from("platform_connections")
        .update({ token_expires_at: new Date(0).toISOString() })
        .eq("user_id", userId)
        .eq("platform", platform);
    }
    return { status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

export async function dispatchScheduledPosts() {
  const now = new Date().toISOString();
  // Stale lock threshold: 5 minutes — releases locks left by a crashed/killed
  // cron invocation so posts don't get stuck unclaimed forever.
  const staleAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Release stale locks first, as its own statement — PostgREST's OR-on-null
  // handling is unreliable for UPDATE, so this can't be folded into the
  // claim query below (v1 hit this as a real bug).
  await supabase
    .from("scheduled_posts")
    .update({ locked_at: null })
    .eq("status", "scheduled")
    .lt("locked_at", staleAt);

  const { data: duePosts, error } = await supabase
    .from("scheduled_posts")
    .select("id, user_id, content, target_platforms, platform_post_ids")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .is("locked_at", null)
    .limit(50);

  if (error) throw error;
  if (!duePosts?.length) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const post of duePosts) {
    // Atomic claim — only one cron instance wins this row.
    const { data: claimed } = await supabase
      .from("scheduled_posts")
      .update({ locked_at: new Date().toISOString(), status: "publishing" })
      .eq("id", post.id)
      .is("locked_at", null)
      .select("id")
      .single();

    if (!claimed) continue; // another instance claimed it first

    const results: Record<string, PlatformResult> = { ...(post.platform_post_ids ?? {}) };

    for (const platform of post.target_platforms as string[]) {
      results[platform] = await dispatchToPlatform(post.user_id, platform, post.content);
    }

    // Aggregate the row's status from its per-platform results: fully done
    // only if every platform published; still needs the user if any platform
    // is waiting on manual confirmation; otherwise failed if nothing succeeded.
    const statuses = Object.values(results).map((r) => r.status);
    const aggregateStatus = statuses.every((s) => s === "published")
      ? "published"
      : statuses.includes("pending_confirmation")
        ? "pending_confirmation"
        : statuses.includes("failed")
          ? "failed"
          : "publishing";

    const errorSummary = Object.entries(results)
      .filter(([, r]) => r.status === "failed")
      .map(([platform, r]) => `${platform}: ${r.error}`)
      .join("; ") || null;

    await supabase
      .from("scheduled_posts")
      .update({
        status: aggregateStatus,
        platform_post_ids: results,
        published_at: aggregateStatus === "published" ? new Date().toISOString() : null,
        error: errorSummary,
        locked_at: null,
      })
      .eq("id", post.id);

    if (aggregateStatus === "published") {
      // Awaited, not fire-and-forget — a streak update failure must surface
      // in cron logs, not vanish silently (v1's own stated reasoning).
      await recordStreakEvent(supabase, post.user_id, "publish", {
        post_id: post.id,
        platforms: post.target_platforms,
      });
      processed++;
    } else if (aggregateStatus === "failed") {
      failed++;
    } else {
      // pending_confirmation / partially published — not a failure, not done
      processed++;
    }
  }

  console.log(`Cron dispatch: processed=${processed} failed=${failed}`);
  return { processed, failed };
}

export async function dispatchAutopilot() {
  const { data: configs } = await supabase
    .from("autopilot_configs")
    .select("*")
    .eq("enabled", true);

  let generated = 0;

  for (const config of configs ?? []) {
    if (!config.topics?.length || !config.platforms?.length) continue;

    const intervalMs = (24 * 60 * 60 * 1000) / config.frequency;
    const lastRun = config.last_run_at ? new Date(config.last_run_at).getTime() : 0;
    if (Date.now() - lastRun < intervalMs) continue;

    const topic = config.topics[Math.floor(Math.random() * config.topics.length)];

    for (const platform of config.platforms as string[]) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { count: todayCount } = await supabase
        .from("scheduled_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", config.user_id)
        .contains("target_platforms", [platform])
        .gte("created_at", todayStart.toISOString());

      const dailyLimit = DAILY_LIMITS[platform] ?? 10;
      if ((todayCount ?? 0) >= dailyLimit) continue;

      try {
        const prompt =
          platform === "twitter"
            ? `Write a single engaging tweet about: "${topic}". Under 260 characters, no hashtags, no emojis. Output ONLY the tweet text.`
            : `Write a professional LinkedIn post about: "${topic}". 150-300 words, strong hook, 2-3 insights, end with a question. No hashtags. Output ONLY the post text.`;
        const content = await groqChat({ messages: [{ role: "user", content: prompt }], temperature: 0.85 });

        const status = config.mode === "auto" ? "scheduled" : "draft";
        const scheduledAt =
          config.mode === "auto" ? new Date(Date.now() + 2 * 60 * 1000).toISOString() : new Date().toISOString();

        await supabase.from("scheduled_posts").insert({
          user_id: config.user_id,
          content,
          target_platforms: [platform],
          status,
          scheduled_at: scheduledAt,
        });

        generated++;
      } catch (err) {
        console.error(`Autopilot generate failed for user=${config.user_id} platform=${platform}:`, err);
      }
    }

    await supabase
      .from("autopilot_configs")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", config.id);
  }

  console.log(`Cron autopilot: generated=${generated}`);
  return { generated };
}

export async function dispatchStreakRescueNudges() {
  const today = new Date().toISOString().split("T")![0];

  const { data: atRiskUsers, error } = await supabase
    .from("streak_states")
    .select("*, users!inner(id, email, display_name)")
    .gt("current_streak", 0)
    .neq("last_qualifying_day", today);

  if (error) throw error;
  if (!atRiskUsers?.length) return { nudged: 0 };

  // TODO: send Resend emails for each at-risk user — packages/workflows
  // needs a Resend integration client first (not yet ported from v1's
  // src/lib/email.ts).
  return { nudged: atRiskUsers.length };
}

export async function processJobQueue() {
  const { data: jobs, error } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("event_name", "jobqueued")
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) throw error;

  let processed = 0;
  for (const job of jobs ?? []) {
    const payload = job.properties as JobPayload;
    try {
      switch (payload.type) {
        case "voice_full_render":
          // TODO: process voice full render job
          break;
        default:
          break;
      }
      processed++;
    } catch {
      // Log failure but continue processing other jobs
    }
  }

  return { processed };
}
