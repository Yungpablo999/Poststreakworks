import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./service-client";
import { notify } from "./notify";
import { audienceSummary, getBrief, type AudienceSummary, type Brief } from "./home";
import type { PlanTier, QuestFacts } from "./quests";

// The notes a creator finds in the bell that aren't caused by one request: a welcome, the week's
// challenge, news about their audience. They're made when the app next asks (at launch and when
// the bell opens), each with a key so it exists once, and each says only what their data says.

const compact = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K` : String(Math.round(n)));

/** The biggest round view count a post has passed: 1,000, 10,000, 100,000… */
export function viewsMilestone(views: number): number | null {
  if (views < 1_000) return null;
  return 10 ** Math.floor(Math.log10(views));
}

export type EverydayInput = {
  tier: PlanTier;
  hasConnection: boolean;
  weekStart: string;
  today: string;
  audience: AudienceSummary | null;
  /** Pro creators: today's brief, when there is one. */
  brief: Brief | null;
};

export async function ensureEverydayNotes(userId: string, input: EverydayInput, db: SupabaseClient = getServiceClient()): Promise<void> {
  const pro = input.tier === "pro" || input.tier === "founding";
  const jobs: Promise<void>[] = [];

  jobs.push(
    notify(userId, {
      key: "welcome",
      type: "system",
      kind: "jarvis",
      title: "Hi, I’m Jarvis",
      body: "Whenever you have an idea, I’ll help you shape it into a post.",
      action: { label: "Start a post", target: "create" },
    }),
  );

  if (!input.hasConnection) {
    jobs.push(
      notify(userId, {
        key: "connect",
        type: "system",
        kind: "link",
        title: "Connect where you post",
        body: "Link an account to see your stats here.",
        action: { label: "Connect an account", target: "accounts" },
      }),
    );
  }

  jobs.push(
    notify(userId, {
      key: `challenge:${input.weekStart}`,
      type: "quest",
      kind: "flag",
      title: "This week’s challenge is open",
      body: "Post 3 times this week, at your own pace.",
      action: { label: "See the challenge", target: "challenge" },
    }),
  );

  if (pro) {
    jobs.push(
      notify(userId, {
        key: "pro-welcome",
        type: "system",
        kind: "pro",
        title: "Welcome to Pro",
        body: "Unlimited ideas and Repurpose, and a daily brief from Jarvis, are ready for you.",
        action: { label: "See what’s in Pro", target: "jarvis-pro" },
      }),
    );
    if (input.brief) {
      jobs.push(
        notify(userId, {
          key: `brief:${input.today}`,
          type: "system",
          kind: "jarvis",
          title: "Today’s brief is ready",
          body: input.brief.lead,
          action: { label: "Read the brief", target: "home" },
        }),
      );
    }
  }

  if (input.audience && input.audience.delta7d !== null && input.audience.delta7d > 0) {
    const n = input.audience.delta7d;
    jobs.push(
      notify(userId, {
        key: `followers:${input.weekStart}`,
        type: "growth",
        kind: "growth",
        title: `${n.toLocaleString("en-US")} new ${n === 1 ? "follower" : "followers"} this week`,
        body: input.audience.platforms > 1 ? `Across ${input.audience.platforms} connected accounts.` : "On your connected account.",
        action: { label: "See your growth", target: "platform-growth" },
      }),
    );
  }

  // The best post so far, once it has passed a round number of views
  const { data: best } = await db
    .from("post_stats")
    .select("platform, platform_post_id, title, views")
    .eq("user_id", userId)
    .order("views", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (best) {
    const views = Number(best.views);
    const milestone = viewsMilestone(views);
    if (milestone) {
      const title = String(best.title ?? "").trim();
      jobs.push(
        notify(userId, {
          key: `views:${best.platform}:${best.platform_post_id}:${milestone}`,
          type: "growth",
          kind: "star",
          title: `Your best post passed ${compact(milestone)} views`,
          body: title ? `“${title.length > 70 ? `${title.slice(0, 69).trimEnd()}…` : title}” has ${compact(views)} views so far.` : `It has ${compact(views)} views so far.`,
          action: { label: "See how it did", target: "post-performance" },
        }),
      );
    }
  }

  await Promise.all(jobs);
}

/** Gathers what the notes depend on and makes them. Best effort: the caller never fails because of it. */
export async function refreshEverydayNotes(userId: string, tier: PlanTier, db: SupabaseClient = getServiceClient()): Promise<void> {
  try {
    const factsRes = await db.rpc("quest_facts", { p_user_id: userId });
    if (factsRes.error || !factsRes.data) throw new Error(factsRes.error?.message ?? "no facts");
    const facts = factsRes.data as QuestFacts;
    const pro = tier === "pro" || tier === "founding";
    const zone = pro ? await db.rpc("user_timezone", { p_user_id: userId }) : null;
    const [audience, brief] = await Promise.all([
      audienceSummary(userId, db),
      pro ? getBrief(userId, facts, (zone?.data as string | null) ?? "Africa/Lagos", db) : Promise.resolve(null),
    ]);
    await ensureEverydayNotes(
      userId,
      { tier, hasConnection: facts.connections > 0, weekStart: facts.weekStart, today: facts.today, audience, brief },
      db,
    );
  } catch (err) {
    console.error("refreshEverydayNotes failed:", err instanceof Error ? err.message : err);
  }
}
