// Phase 1 API shapes — what the finished app used to keep in memory
// (src/data/index.ts, src/jarvis/chat.ts, src/tour, src/mascot) and now gets
// from the backend. Mirrors the server's responses exactly; see
// backend/PHASE1_CONTRACT.md for the endpoint list and the wiring recipe.
//
// The names deliberately match the app's own (SavedDraft, SavedHook,
// CheckInStreak, RepurposeAllowance, ChatMessage…) so a screen's imports can
// move here without the screen changing.

export type AppPlatform = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'threads' | 'x' | 'linkedin';
export type Tier = 'free' | 'pro' | 'founding';
export type Persona = 'new' | 'returning';

/** Ghost's 12 expressions — one image each in assets/mascot/. Same list as the ghost_emotion database enum. */
export type GhostEmotion =
  | 'wave' | 'happy' | 'excited' | 'party' | 'love' | 'cool'
  | 'thinking' | 'idea' | 'working' | 'determined' | 'sleepy' | 'calm';

/** Pages Ghost can take the creator to. Same list as `GhostPlace` in src/jarvis/chat.ts. */
export type GhostPlace =
  | 'create' | 'schedule' | 'growth' | 'repurpose' | 'hook-studio'
  | 'quests' | 'challenge' | 'jarvis-pro' | 'accounts';

// ─── Check-ins ──────────────────────────────────────────────────────────────

/** `CheckInStreak` in src/data/index.ts, plus two extra fields. */
export interface CheckInSummary {
  /** Consecutive days checked in, counting today if already checked in. 0 after a missed day. */
  currentDays: number;
  /** This week, Monday → Sunday. true = checked in that day. */
  week: boolean[];
  /** Index of the creator's local today within `week` (0 = Monday). */
  todayIndex: number;
  checkedInToday: boolean;
  longestDays: number;
  /** The creator's local date, YYYY-MM-DD. */
  localDate: string;
}

export interface CheckInResult {
  /** false when they had already checked in today (not an error). */
  newlyCheckedIn: boolean;
  /** true when this check-in reached a streak milestone (7, 14, 30, 50, 100, 365 days). */
  isMilestone: boolean;
  summary: CheckInSummary;
}

/** Days with a check-in in one calendar month. `month` is 0-based, like JavaScript's Date. */
export interface CheckInMonth {
  year: number;
  month: number;
  /** YYYY-MM-DD */
  days: string[];
}

// ─── Saved work ─────────────────────────────────────────────────────────────

/** `SavedDraft` in src/data/index.ts. `id` is the app's own string id. */
export interface SavedDraft {
  id: string;
  title: string;
  kind: 'script' | 'post';
  /** e.g. "Script", "30-second Reel" */
  format: string;
  platform?: AppPlatform;
  /** Room for the script / caption / slides when the composer saves them. */
  payload: Record<string, unknown>;
  /** Milliseconds since the epoch (when it was last saved). */
  savedAt: number;
}

export type SaveDraftBody = Pick<SavedDraft, 'title' | 'kind' | 'format'> &
  Partial<Pick<SavedDraft, 'platform' | 'payload'>>;

/** `SavedHook` in src/data/index.ts. */
export interface SavedHook {
  line: string;
  style: 'talking' | 'dance' | 'skit' | 'text';
  idea: string;
  savedAt: number;
}

export type ToggleHookBody = Pick<SavedHook, 'line' | 'style'> & Partial<Pick<SavedHook, 'idea'>>;

/** `saved` is the NEW state; `hook` is null when it was just removed. */
export interface ToggleHookResult {
  saved: boolean;
  hook: SavedHook | null;
}

// ─── Repurpose allowance ────────────────────────────────────────────────────

/** `RepurposeAllowance` in src/data/index.ts. */
export interface RepurposeAllowance {
  usedThisWeek: number;
  /** null = unlimited (Pro). */
  weeklyLimit: number | null;
}

/** A free plan with none left is a normal 200 with `allowed: false`, not an error. */
export interface SpendRepurposeResult extends RepurposeAllowance {
  allowed: boolean;
  upgradeRequired: boolean;
}

// ─── Sign-up ────────────────────────────────────────────────────────────────

/**
 * PUT /api/v1/user/onboarding. Every field is optional, so send each sign-up
 * step as it happens. A taken handle comes back as 409 "That handle is already taken".
 */
export interface SaveOnboardingBody {
  displayName?: string;
  /** 3–30 letters, numbers or underscores, without the "@". */
  handle?: string;
  /** Topic ids from the niche screen, e.g. ["lifestyle", "tech"]. */
  niches?: string[];
  /** The device's IANA zone — Intl.DateTimeFormat().resolvedOptions().timeZone */
  timezone?: string;
}

// ─── Connected accounts (TikTok first) ──────────────────────────────────────

export type ConnectionStatus = 'connected' | 'needs_reauth' | 'error';

/** GET /api/v1/platforms/accounts, and `bootstrap.accounts`. */
export interface ConnectedAccount {
  platform: AppPlatform;
  /** The account's display name on that platform. */
  name: string | null;
  /** The @handle, when the platform gives it to us (TikTok needs an extra permission for it). */
  handle: string | null;
  avatarUrl: string | null;
  followers: number | null;
  /** `needs_reauth`: show "Reconnect"; `error`: a sync hiccup, nothing for the creator to do. */
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  scopes: string[];
}

export interface TikTokAuthorizeBody {
  /** Which app the creator is in; the callback page uses it to decide where to hand the code back. */
  client?: 'web' | 'mobile';
}

/** Send the creator here (web: `window.location.assign`; phone: an in-app browser session). */
export interface TikTokAuthorizeResult {
  url: string;
}

/** What TikTok sends to the callback page, passed straight on. */
export interface TikTokCallbackBody {
  code: string;
  state: string;
}

export interface TikTokCallbackResult {
  connected: true;
  account: Pick<ConnectedAccount, 'name' | 'avatarUrl' | 'followers' | 'status' | 'scopes'> & { platform: 'tiktok' };
}

export type TikTokSyncResult =
  | { status: 'synced'; posts: number; followers: number | null }
  | { status: 'busy' | 'not_connected' | 'needs_reauth' | 'error' };

/** `AccountSnapshot` in src/data/index.ts, built from real synced posts (`isSample` is always false). */
export interface AccountSnapshotDto {
  platform: AppPlatform;
  isSample: false;
  postingDaysLast30: number;
  /** 30 entries; index 0 = 29 days ago, index 29 = today. */
  postedDays: boolean[];
  avgViews: string;
  bestTime: string;
  postsAtBestTime: number;
  recentPosts: number;
  topFormat: string;
}

// ─── Launch payload ─────────────────────────────────────────────────────────

export interface BootstrapProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  bio: string;
  niche: string;
  /** Topic ids chosen in onboarding, e.g. ["lifestyle", "tech"]. */
  niches: string[];
  /** Always from the server (subscriptions) — never trust a locally-held tier. */
  tier: Tier;
  level: number;
  xp: number;
  nextLevelXp: number;
  /** Posts made: published through PostStreak, or read from a connected account. */
  postsCount: number;
  /** IANA zone; decides when the creator's day and week start. */
  timezone: string;
  createdAt: string;
}

/**
 * What this server can really do, decided by the keys and approvals it has. The app shows only what
 * works: a feature the server can't deliver is hidden (never faked with sample data) and appears by
 * itself once the server is set up for it.
 */
export interface Capabilities {
  /** Ideas, hooks, scripts, captions, Repurpose and Ask Jarvis are written by a real model. */
  ai: boolean;
  /** Connecting a TikTok account. */
  tiktok: boolean;
  /** A purchase can really unlock Pro. */
  payments: boolean;
  /** Voice Studio can really make audio. */
  voice: boolean;
  /** Local testing only: the sign-in screen offers one-tap test accounts. */
  devLogin: boolean;
  /** Connections for Instagram, YouTube, Facebook and Threads. */
  otherPlatforms: boolean;
  /** Posting for the creator at the best time. */
  autoPost: boolean;
  /** Age / place / online-time breakdowns of an audience. */
  audienceDemographics: boolean;
}

/** GET /api/v1/dev/login (local stack only): the seeded accounts the sign-in screen offers. */
export interface TestAccount {
  email: string;
  label: string;
  plan: 'free' | 'pro';
  stage: 'new' | 'existing';
  displayName: string;
  blurb: string;
}

/** The paid plan, when there is one. `Bootstrap.profile.tier` is what to gate on. */
export interface PlanInfo {
  status: string;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
  processor: string;
}

/** GET /api/v1/me/bootstrap */
export interface Bootstrap {
  profile: BootstrapProfile;
  /** "returning" once they have a rhythm: 3 check-in days, a published post, or posts read from a connected account. */
  persona: Persona;
  capabilities: Capabilities;
  /** Notifications not yet read (the bell's dot). */
  unreadNotifications: number;
  plan: PlanInfo | null;
  connectedPlatforms: AppPlatform[];
  /** Real connections with details and health. A subset of `connectedPlatforms`. */
  accounts: ConnectedAccount[];
  checkIn: CheckInSummary;
  drafts: SavedDraft[];
  savedHooks: SavedHook[];
  repurpose: RepurposeAllowance;
  tour: { done: boolean };
  /** First-visit tip keys already shown (the keys passed to tipOnce). */
  tipsSeen: string[];
}

// ─── Ask Jarvis ─────────────────────────────────────────────────────────────

/** `GhostJob` in src/jarvis/chat.ts. */
export type GhostJob =
  | { kind: 'compose'; title: string }
  | { kind: 'draft'; title: string; format: string }
  | { kind: 'open'; place: GhostPlace }
  | { kind: 'copy'; text: string }
  | { kind: 'checkIn' };

/** `GhostTask` in src/jarvis/chat.ts. Ids and wording are made by the server. */
export interface GhostTask {
  id: string;
  /** What the creator taps, e.g. "Ghost, save it to drafts" */
  label: string;
  /** What Ghost says when it's done, e.g. "Saved to your drafts" */
  done: string;
  job: GhostJob;
}

/** `FeedIdea` in src/data/index.ts. */
export interface FeedIdea {
  id: string;
  niche: string;
  title: string;
  hook: string;
  format: string;
  bestTime: string;
  why: string;
}

/** What the idea endpoints return. `source` says who wrote them: the idea library, or Jarvis (AI). */
export interface IdeaList {
  source: 'library' | 'ai';
  ideas: FeedIdea[];
}

/** POST /api/v1/jarvis/chat body. */
export interface JarvisChatRequest {
  message: string;
  /** The last few turns, oldest first (at most 8). */
  history?: { from: 'me' | 'jarvis'; text: string }[];
  context?: {
    persona?: Persona;
    niches?: string[];
    platforms?: string[];
    lastTopic?: string;
  };
}

/**
 * The reply — a `ChatMessage` from src/jarvis/chat.ts without `id` and `from`
 * (the app adds those). `degraded` is true when Jarvis couldn't reach his AI and
 * this is a gentle stand-in reply.
 */
export interface JarvisChatReply {
  text: string;
  ideas?: FeedIdea[];
  caption?: string;
  list?: string[];
  tasks?: GhostTask[];
  chips?: string[];
  emotion?: GhostEmotion;
  degraded: boolean;
}

// ─── Notifications (the bell) ───────────────────────────────────────────────

/** The icon the bell draws. */
export type NoteKind = 'jarvis' | 'growth' | 'star' | 'clock' | 'flag' | 'link' | 'mic' | 'calendar' | 'pro';

/** Where a note's button takes the creator. */
export type NoteTarget =
  | 'create'
  | 'accounts'
  | 'challenge'
  | 'jarvis-pro'
  | 'platform-growth'
  | 'post-performance'
  | 'schedule'
  | 'quests'
  | 'home';

export interface NotificationItem {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  /** ISO time. */
  createdAt: string;
  read: boolean;
  action: { label: string; target: NoteTarget } | null;
}

/** GET /api/v1/notifications */
export interface NotificationFeed {
  items: NotificationItem[];
  unread: number;
}

// ─── Quests ─────────────────────────────────────────────────────────────────

/** Where tapping a quest takes the creator. */
export type QuestPlace = 'create' | 'ideas' | 'script' | 'composer' | 'schedule' | 'growth' | 'repurpose' | 'hook-studio' | 'accounts' | 'challenge';

export type QuestIcon = 'idea' | 'audience' | 'calendar' | 'hook' | 'repurpose';

export interface TodayStep {
  id: 'idea' | 'make' | 'post';
  title: string;
  body: string;
  /** A button for the step; none = ticked off by doing the thing. */
  action?: { label: string; place: QuestPlace };
  done: boolean;
}

export interface QuestItem {
  key: string;
  title: string;
  xp: number;
  cadence: 'Daily' | 'Weekly' | 'One time';
  place: QuestPlace;
  action: string;
  icon: QuestIcon;
  pro: boolean;
  done: boolean;
  progress: { done: number; of: number };
}

export interface ChallengeState {
  title: string;
  /** The Monday of the creator's week, YYYY-MM-DD. */
  weekStart: string;
  goal: number;
  /** Posts counted this week, capped at the goal. */
  done: number;
  xp: number;
  joined: boolean;
  completed: boolean;
  /** Other creators in this week's challenge. */
  others: number;
  /** The creator's posts this week, earliest first. */
  posts: { platform: AppPlatform; at: string }[];
  /** Days (0 = Monday) they asked to be reminded on, or null. */
  reminderDays: number[] | null;
}

/** GET /api/v1/quests */
export interface QuestBoard {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpPerLevel: number;
  active: number;
  today: { key: string; xp: number; done: boolean; steps: TodayStep[] };
  list: QuestItem[];
  pro: QuestItem[] | null;
  challenge: ChallengeState;
  /** Quests this very call finished and paid. Show each once. */
  justCompleted: { key: string; title: string; xp: number }[];
}

// ─── Home ───────────────────────────────────────────────────────────────────

export interface BriefStep {
  id: 'hook' | 'film' | 'post';
  title: string;
  body: string;
  action: { label: string; place: QuestPlace } | null;
  /** Ticked by what the creator has really done today. */
  done: boolean;
}

/** Pro: today's brief, worked out from the creator's own posts. */
export interface Brief {
  lead: string;
  steps: BriefStep[];
}

/** GET /api/v1/home */
export interface HomeSummary {
  nextPost: { id: string; at: string; platforms: AppPlatform[]; title: string } | null;
  /** Posts that were due and wait for the creator to confirm they went out. */
  waiting: number;
  weekPlanned: number;
  /** null until an account is connected and read. */
  audience: { followers: number; delta7d: number | null; platforms: number } | null;
  brief: Brief | null;
  level: { level: number; xp: number; xpIntoLevel: number; xpPerLevel: number };
  today: { xp: number; done: boolean; stepsDone: number; stepsTotal: number };
  challenge: { done: number; goal: number; joined: boolean };
  justCompleted: { key: string; title: string; xp: number }[];
}

// ─── Calendar ───────────────────────────────────────────────────────────────

/** "ready" = it is time and the creator needs to post it and confirm. */
export type CalendarStatus = 'draft' | 'scheduled' | 'ready' | 'posted';

export interface CalendarItem {
  id: string;
  /** Planned in PostStreak, or read from the creator's account. */
  kind: 'scheduled' | 'synced';
  title: string;
  platform: AppPlatform;
  /** ISO time it goes (or went) out. */
  at: string;
  status: CalendarStatus;
  /** A link to the live post, when the platform gave one. */
  url?: string;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

/** Every non-2xx response. A Pro-gated route also carries `code: 'UPGRADE_REQUIRED'` and an upsell. */
export interface ApiErrorBody {
  message: string;
  code?: 'UPGRADE_REQUIRED';
  upsell?: { title: string; features: string[]; upgradeUrl: string };
}
