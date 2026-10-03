import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./service-client";
import { levelForXp } from "./streak-engine";
import { notify } from "./notify";

// Quests: small goals that pay XP. Each one is a rule over what the creator has really done
// (drafts saved, posts scheduled, accounts connected, posts made…), counted in THEIR day and
// week by the database (quest_facts, migration …23). Nothing is ticked by the app: the app
// asks, the server looks at the rows, and a finished quest is paid exactly once per period
// (complete_quest records the finish and the XP in one statement).
//
// The rules are here, in code, because each one is logic. `evaluate*` are pure (facts in,
// states out) so they are tested without a database; `getQuestBoard` does the reading and paying.

export type Persona = "new" | "returning";
export type PlanTier = "free" | "pro" | "founding";

/** Where tapping a quest takes the creator. The app maps these names to its pages. */
export type Place = "create" | "ideas" | "script" | "composer" | "schedule" | "growth" | "repurpose" | "hook-studio" | "accounts" | "challenge";

export type QuestIcon = "idea" | "audience" | "calendar" | "hook" | "repurpose";

/** What the database knows about the creator right now (quest_facts). */
export type QuestFacts = {
  today: string; // YYYY-MM-DD, the creator's own date
  weekStart: string; // the Monday of the creator's week
  /** The exact instants those two days began, in the creator's time zone. */
  dayStartAt: string;
  weekStartAt: string;
  draftsToday: number;
  scriptDraftsToday: number;
  postDraftsToday: number;
  draftsEver: number;
  hooksToday: number;
  hooksEver: number;
  hooksSameIdeaThisWeek: number;
  ideaPicksToday: number;
  scheduledToday: number;
  scheduledThisWeek: number;
  scheduledEver: number;
  postsToday: number;
  postsThisWeek: number;
  postsEver: number;
  connections: number;
  repurposesThisWeek: number;
};

const min = Math.min;

// ─── Today's quest ──────────────────────────────────────────────────────────

export const TODAY_QUEST_KEY = "daily.today";
export const TODAY_QUEST_XP = 80;

export type TodayStep = {
  id: "idea" | "make" | "post";
  title: string;
  body: string;
  /** A button for the step; none = it is ticked off by doing the thing (or by the card below). */
  action?: { label: string; place: Place };
  done: boolean;
};

const ideaDone = (f: QuestFacts) => f.ideaPicksToday + f.hooksToday + f.draftsToday > 0;

/** Three steps. New creators get an idea ready; creators who post, post. */
export function todaySteps(f: QuestFacts, persona: Persona): TodayStep[] {
  const idea: TodayStep = {
    id: "idea",
    title: "Pick an idea",
    body: persona === "new" ? "Use Jarvis’s pick below, or look through more ideas." : "Use Jarvis’s pick below, or find one that fits today.",
    action: { label: "Find ideas", place: "ideas" },
    done: ideaDone(f),
  };
  if (persona === "new") {
    return [
      idea,
      {
        id: "make",
        title: "Write the script",
        body: "Tap “Use this idea” below and Jarvis helps you turn it into a short script.",
        done: f.scriptDraftsToday > 0,
      },
      {
        id: "post",
        title: "Save it",
        body: "We tick this off when you save a draft or schedule it.",
        done: f.postDraftsToday + f.scheduledToday + f.postsToday > 0,
      },
    ];
  }
  return [
    idea,
    {
      id: "make",
      title: "Make your post",
      body: "Tap “Use this idea” below to film, write or design it.",
      done: f.postDraftsToday + f.scheduledToday + f.postsToday > 0,
    },
    {
      id: "post",
      title: "Post it",
      body: "We tick this off when your post goes live. Whenever suits you.",
      done: f.postsToday > 0,
    },
  ];
}

// ─── The quest list ─────────────────────────────────────────────────────────

type Cadence = "daily" | "weekly" | "once";

type ListDef = {
  key: string;
  title: string;
  xp: number;
  cadence: Cadence;
  place: Place;
  action: string;
  icon: QuestIcon;
  /** On whose board it appears. */
  audience: Persona | "any";
  pro?: boolean;
  progress: (f: QuestFacts) => { done: number; of: number };
};

const LIST: ListDef[] = [
  // Starter quests: the first time for each thing, for creators who are just beginning
  { key: "starter.connect", title: "Connect your first account", xp: 100, cadence: "once", place: "accounts", action: "Connect", icon: "audience", audience: "new", progress: (f) => ({ done: min(f.connections, 1), of: 1 }) },
  { key: "starter.first_idea", title: "Create your first post idea", xp: 60, cadence: "once", place: "create", action: "Start", icon: "idea", audience: "new", progress: (f) => ({ done: min(f.draftsEver + f.hooksEver, 1), of: 1 }) },
  { key: "starter.first_schedule", title: "Schedule your first post", xp: 50, cadence: "once", place: "schedule", action: "Plan", icon: "calendar", audience: "new", progress: (f) => ({ done: min(f.scheduledEver, 1), of: 1 }) },
  { key: "starter.first_post", title: "Share your first post", xp: 120, cadence: "once", place: "composer", action: "Start", icon: "idea", audience: "new", progress: (f) => ({ done: min(f.postsEver, 1), of: 1 }) },
  // Creators with a rhythm: a few small things each day or week
  { key: "daily.idea", title: "Create your next post idea", xp: 60, cadence: "daily", place: "create", action: "Start", icon: "idea", audience: "returning", progress: (f) => ({ done: min(f.draftsToday + f.hooksToday + f.ideaPicksToday, 1), of: 1 }) },
  { key: "weekly.schedule", title: "Schedule your next post", xp: 50, cadence: "weekly", place: "schedule", action: "Plan", icon: "calendar", audience: "returning", progress: (f) => ({ done: min(f.scheduledThisWeek, 1), of: 1 }) },
  { key: "weekly.repurpose", title: "Repurpose one post", xp: 60, cadence: "weekly", place: "repurpose", action: "Start", icon: "repurpose", audience: "returning", progress: (f) => ({ done: min(f.repurposesThisWeek, 1), of: 1 }) },
  // Pro
  { key: "pro.openings", title: "Try 3 openings for one idea", xp: 80, cadence: "weekly", place: "hook-studio", action: "Start", icon: "hook", audience: "any", pro: true, progress: (f) => ({ done: min(f.hooksSameIdeaThisWeek, 3), of: 3 }) },
];

export const periodKey = (cadence: Cadence, f: Pick<QuestFacts, "today" | "weekStart">): string =>
  cadence === "daily" ? `D:${f.today}` : cadence === "weekly" ? `W:${f.weekStart}` : "O";

export type QuestItem = {
  key: string;
  title: string;
  xp: number;
  cadence: "Daily" | "Weekly" | "One time";
  place: Place;
  action: string;
  icon: QuestIcon;
  pro: boolean;
  done: boolean;
  progress: { done: number; of: number };
};

const CADENCE_LABEL = { daily: "Daily", weekly: "Weekly", once: "One time" } as const;

export type Evaluated = QuestItem & { period: string };

/** The quests on a creator's board, with their progress as of `facts`. */
export function evaluateList(facts: QuestFacts, persona: Persona, tier: PlanTier): { list: Evaluated[]; pro: Evaluated[] | null } {
  const isPro = tier === "pro" || tier === "founding";
  const make = (d: ListDef): Evaluated => {
    const p = d.progress(facts);
    return {
      key: d.key,
      title: d.title,
      xp: d.xp,
      cadence: CADENCE_LABEL[d.cadence],
      place: d.place,
      action: d.action,
      icon: d.icon,
      pro: Boolean(d.pro),
      done: p.done >= p.of,
      progress: p,
      period: periodKey(d.cadence, facts),
    };
  };
  const list = LIST.filter((d) => !d.pro && (d.audience === persona || d.audience === "any")).map(make);
  const pro = isPro ? LIST.filter((d) => d.pro).map(make) : null;
  return { list, pro };
}

// ─── The weekly challenge ───────────────────────────────────────────────────

export const CHALLENGE_KEY = "weekly.challenge";
export const CHALLENGE_GOAL = 3;
export const CHALLENGE_XP = 250;

export type ChallengePost = { platform: string; at: string };

export type ChallengeState = {
  title: string;
  weekStart: string;
  goal: number;
  /** Posts counted this week, capped at the goal. */
  done: number;
  xp: number;
  joined: boolean;
  completed: boolean;
  /** Other creators in this week's challenge (not counting you). */
  others: number;
  /** The creator's posts this week, earliest first. */
  posts: ChallengePost[];
  /** Days (0 = Monday) they asked to be reminded on, or null. */
  reminderDays: number[] | null;
};

// ─── The board ──────────────────────────────────────────────────────────────

export type TodayQuest = {
  key: string;
  xp: number;
  done: boolean;
  steps: TodayStep[];
};

export type JustCompleted = { key: string; title: string; xp: number };

export type QuestBoard = {
  level: number;
  xp: number;
  /** XP earned since this level began, and what a whole level takes. */
  xpIntoLevel: number;
  xpPerLevel: number;
  /** Quests started but not finished (for the "Active" figure). */
  active: number;
  today: TodayQuest;
  list: QuestItem[];
  pro: QuestItem[] | null;
  challenge: ChallengeState;
  /** Quests this very call finished and paid, so the app can celebrate them once. */
  justCompleted: JustCompleted[];
};

type Context = { persona: Persona; tier: PlanTier };

const XP_PER_LEVEL = 250;

async function xpBalance(db: SupabaseClient, userId: string): Promise<number> {
  const { data } = await db.from("credits").select("type, amount").eq("user_id", userId);
  return (data ?? []).reduce((sum: number, r: { type: string; amount: number }) => (r.type === "earn" ? sum + r.amount : sum - r.amount), 0);
}

function must<T>(what: string, res: { data: T | null; error: { message: string } | null }): T {
  if (res.error || res.data === null) throw new Error(`${what}: ${res.error?.message ?? "no data"}`);
  return res.data;
}

/** What the database knows the creator has done so far today and this week. */
export async function loadQuestFacts(userId: string, db: SupabaseClient = getServiceClient()): Promise<QuestFacts> {
  return must("quest_facts", await db.rpc("quest_facts", { p_user_id: userId })) as QuestFacts;
}

/**
 * Reads the creator's rows, pays every quest they have just finished (once), and returns the
 * board the Quests and Home screens show. Safe to call as often as the app likes. Pass `facts`
 * when the caller has already loaded them.
 */
export async function getQuestBoard(
  userId: string,
  ctx: Context,
  db: SupabaseClient = getServiceClient(),
  loaded?: QuestFacts,
): Promise<QuestBoard> {
  const facts = loaded ?? (await loadQuestFacts(userId, db));
  const xpBefore = await xpBalance(db, userId);

  const today = todaySteps(facts, ctx.persona);
  const { list, pro } = evaluateList(facts, ctx.persona, ctx.tier);

  // The challenge: this week's row, who is in, and the creator's posts this week
  const challengeId = must("ensure_weekly_challenge", await db.rpc("ensure_weekly_challenge", { p_user_id: userId })) as string;
  const [participantsRes, postsRes, remindersRes, doneRes] = await Promise.all([
    db.from("challenge_participants").select("user_id").eq("challenge_id", challengeId),
    db
      .rpc("creator_posts", { p_user_id: userId })
      .gte("posted_at", facts.weekStartAt)
      .lt("posted_at", new Date(Date.parse(facts.weekStartAt) + 7 * 86_400_000).toISOString())
      .order("posted_at", { ascending: true }),
    db.from("challenge_reminders").select("days").eq("user_id", userId).eq("week_start", facts.weekStart).maybeSingle(),
    db
      .from("quest_completions")
      .select("quest_key, period_key")
      .eq("user_id", userId)
      .in("period_key", [`D:${facts.today}`, `W:${facts.weekStart}`, "O"]),
  ]);
  const participants = (participantsRes.data ?? []) as { user_id: string }[];
  const joined = participants.some((p) => p.user_id === userId);
  const posts = ((postsRes.data ?? []) as { platform: string; posted_at: string }[]).slice(0, 50).map((p) => ({ platform: p.platform, at: p.posted_at }));
  const completed = new Set(((doneRes.data ?? []) as { quest_key: string; period_key: string }[]).map((c) => `${c.quest_key}|${c.period_key}`));
  const challengeDone = joined && facts.postsThisWeek >= CHALLENGE_GOAL;

  // Pay what has just been finished. complete_quest is atomic and returns false if it was already paid.
  const justCompleted: JustCompleted[] = [];
  const pay = async (key: string, period: string, xp: number, title: string, finished: boolean) => {
    if (!finished || completed.has(`${key}|${period}`)) return;
    const { data, error } = await db.rpc("complete_quest", { p_user_id: userId, p_quest_key: key, p_period_key: period, p_xp: xp, p_title: title });
    completed.add(`${key}|${period}`);
    if (error) {
      console.error(`complete_quest failed (${key}):`, error.message);
      return;
    }
    if (data === true) {
      justCompleted.push({ key, title, xp });
      await notify(userId, {
        key: `quest:${key}:${period}`,
        type: "quest",
        kind: "star",
        title: key === CHALLENGE_KEY ? "You finished this week’s challenge" : `Quest done: ${title}`,
        body: `+${xp} XP`,
      });
    }
  };

  const todayDone = today.every((s) => s.done);
  await pay(TODAY_QUEST_KEY, `D:${facts.today}`, TODAY_QUEST_XP, ctx.persona === "new" ? "Your first Studio session" : "Share one post today", todayDone);
  for (const q of [...list, ...(pro ?? [])]) await pay(q.key, q.period, q.xp, q.title, q.done);
  await pay(CHALLENGE_KEY, `W:${facts.weekStart}`, CHALLENGE_XP, "Post 3 times this week", challengeDone);

  // A paid quest stays done for its period even if the rows that proved it are later deleted
  const stays = (key: string, period: string, now: boolean) => now || completed.has(`${key}|${period}`);

  // (A new level is announced by the database when the XP lands: credits_level_up, migration …23.)
  const xp = justCompleted.length ? await xpBalance(db, userId) : xpBefore;
  const after = levelForXp(xp);

  const board = (q: Evaluated): QuestItem => {
    const { period, ...item } = q;
    return { ...item, done: stays(q.key, period, q.done) };
  };
  const boardList = list.map(board);
  const boardPro = pro ? pro.map(board) : null;
  const todayFinished = stays(TODAY_QUEST_KEY, `D:${facts.today}`, todayDone);

  return {
    level: after.level,
    xp,
    xpIntoLevel: xp - (after.level - 1) * XP_PER_LEVEL,
    xpPerLevel: XP_PER_LEVEL,
    // quests on the board that aren't finished yet
    active: [...boardList, ...(boardPro ?? [])].filter((q) => !q.done).length + (todayFinished ? 0 : 1) + (joined && !stays(CHALLENGE_KEY, `W:${facts.weekStart}`, challengeDone) ? 1 : 0),
    today: { key: TODAY_QUEST_KEY, xp: TODAY_QUEST_XP, done: todayFinished, steps: today },
    list: boardList,
    pro: boardPro,
    challenge: {
      title: "Post 3 times this week",
      weekStart: facts.weekStart,
      goal: CHALLENGE_GOAL,
      done: min(facts.postsThisWeek, CHALLENGE_GOAL),
      xp: CHALLENGE_XP,
      joined,
      completed: stays(CHALLENGE_KEY, `W:${facts.weekStart}`, challengeDone),
      others: Math.max(0, participants.length - (joined ? 1 : 0)),
      posts,
      reminderDays: (remindersRes.data as { days: number[] } | null)?.days ?? null,
    },
    justCompleted,
  };
}

/** Joins this week's challenge (idempotent). */
export async function joinWeeklyChallenge(userId: string, db: SupabaseClient = getServiceClient()): Promise<void> {
  const { error } = await db.rpc("join_weekly_challenge", { p_user_id: userId });
  if (error) throw new Error(`join_weekly_challenge: ${error.message}`);
}

/**
 * Sets the days (0 = Monday … 6 = Sunday) the creator wants a reminder on this week. An empty list
 * clears them. Only days that haven't passed are accepted.
 */
export async function setChallengeReminders(
  userId: string,
  days: number[],
  facts: Pick<QuestFacts, "weekStart" | "today">,
  db: SupabaseClient = getServiceClient(),
): Promise<number[]> {
  const todayIndex = Math.round((Date.parse(`${facts.today}T00:00:00Z`) - Date.parse(`${facts.weekStart}T00:00:00Z`)) / 86_400_000);
  const clean = Array.from(new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6 && d >= todayIndex))).sort((a, b) => a - b);
  if (clean.length === 0) {
    const { error } = await db.from("challenge_reminders").delete().eq("user_id", userId).eq("week_start", facts.weekStart);
    if (error) throw new Error(`setChallengeReminders: ${error.message}`);
    return [];
  }
  const { error } = await db
    .from("challenge_reminders")
    .upsert({ user_id: userId, week_start: facts.weekStart, days: clean }, { onConflict: "user_id,week_start" });
  if (error) throw new Error(`setChallengeReminders: ${error.message}`);
  return clean;
}

/** Today and the start of the week, in the creator's own calendar. */
export async function creatorCalendar(userId: string, db: SupabaseClient = getServiceClient()): Promise<Pick<QuestFacts, "today" | "weekStart">> {
  const facts = await loadQuestFacts(userId, db);
  return { today: facts.today, weekStart: facts.weekStart };
}
