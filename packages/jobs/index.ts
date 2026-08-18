import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type JobPayload = {
  type: string;
  data: Record<string, unknown>;
};

export async function dispatchScheduledPosts() {
  const now = new Date().toISOString();

  const { data: duePosts, error } = await supabase
    .from("scheduled_posts")
    .select("*, platform_connections!inner(*)")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(50);

  if (error) throw error;
  if (!duePosts?.length) return { processed: 0 };

  let processed = 0;
  for (const post of duePosts) {
    try {
      // Mark as publishing
      await supabase
        .from("scheduled_posts")
        .update({ status: "publishing" })
        .eq("id", post.id);

      // TODO: call platform integration (LinkedIn API / X assisted)
      // For now, mark as published
      await supabase
        .from("scheduled_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      // Write streak event
      await supabase.from("streak_events").insert({
        user_id: post.user_id,
        event_type: "publish",
        event_date: new Date().toISOString().split("T")![0],
        metadata: { post_id: post.id },
      });

      processed++;
    } catch (err) {
      await supabase
        .from("scheduled_posts")
        .update({ status: "failed" })
        .eq("id", post.id);
    }
  }

  return { processed };
}

export async function dispatchStreakRescueNudges() {
  // Find users who haven't posted today and are at risk of losing a streak
  const today = new Date().toISOString().split("T")![0];

  const { data: atRiskUsers, error } = await supabase
    .from("streak_states")
    .select("*, users!inner(id, email, display_name)")
    .gt("current_streak", 0)
    .neq("last_qualifying_day", today);

  if (error) throw error;
  if (!atRiskUsers?.length) return { nudged: 0 };

  // TODO: send Resend emails for each at-risk user
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
    } catch (err) {
      // Log failure but continue processing other jobs
    }
  }

  return { processed };
}
