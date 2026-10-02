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
  | 'voice-studio' | 'quests' | 'challenge' | 'jarvis-pro' | 'accounts';

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
  /** IANA zone; decides when the creator's day and week start. */
  timezone: string;
  createdAt: string;
}

/** GET /api/v1/me/bootstrap */
export interface Bootstrap {
  profile: BootstrapProfile;
  /** "returning" once they've done anything real (checked in, saved something, connected a platform). */
  persona: Persona;
  connectedPlatforms: AppPlatform[];
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

// ─── Errors ─────────────────────────────────────────────────────────────────

/** Every non-2xx response. A Pro-gated route also carries `code: 'UPGRADE_REQUIRED'` and an upsell. */
export interface ApiErrorBody {
  message: string;
  code?: 'UPGRADE_REQUIRED';
  upsell?: { title: string; features: string[]; upgradeUrl: string };
}
