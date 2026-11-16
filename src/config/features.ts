// Product stage flags. Stage 2 features stay in the codebase but are hidden
// until launch — wrap any Stage 2 UI in `STAGE_2_ENABLED && (...)` instead of deleting it.
//
// Stage 1 (live): Studio, analytics (LinkedIn, YouTube, Threads, Instagram, Facebook, TikTok),
//   insights, scheduling, quests, check-in streak.
// Stage 2 (hidden): Creator Match, Creator Passport, Squads / Duels, Brand campaigns.
export const STAGE_2_ENABLED = false;

// Platforms with Stage 1 analytics support.
export const STAGE_1_PLATFORMS = ['linkedin', 'youtube', 'threads', 'instagram', 'facebook', 'tiktok'] as const;
export type Stage1Platform = (typeof STAGE_1_PLATFORMS)[number];

// Free-tier limits.
// One free repurpose a week (a video breakdown costs real AI time per run).
export const FREE_REPURPOSES_PER_WEEK = 1;

export const isStage1Platform = (id: string): id is Stage1Platform =>
  (STAGE_1_PLATFORMS as readonly string[]).includes(id);

// No payment provider is wired into the app yet, so every "buy" action is off:
// the buttons stay on screen but can't be pressed, and nothing is credited.
// TODO(payments): decide web checkout vs in-app purchase before iOS submission, then wire it up and flip this.
export const PAYMENTS_ENABLED = false;

// Beta: while payments are off, every creator can post now and schedule. The Pro gate stays in
// code behind PAYMENTS_ENABLED, so flipping the flag brings it back with no other change.
export const isProTier = (tier?: string | null): boolean => tier === 'pro' || tier === 'founding';

/** Whether this creator may post for real and schedule (everyone during the beta) */
export const canAutoPost = (isPro: boolean, paymentsEnabled: boolean = PAYMENTS_ENABLED): boolean =>
  isPro || !paymentsEnabled;

/** Whether to show the "auto-posting is part of Pro" upsell copy (never during the beta) */
export const showAutoPostUpsell = (isPro: boolean, paymentsEnabled: boolean = PAYMENTS_ENABLED): boolean =>
  paymentsEnabled && !isPro;

// Screens that still run on sample data (not the creator's real numbers). While this is false they
// render exactly as before, with a "Coming soon" cover on top that blocks interaction.
// Flip to true (or remove an id from DEMO_SCREENS) to bring a screen back; nothing else changes.
export const DEMO_SCREENS_ENABLED = false;

/** Screen ids (as used by App.tsx navigation) that show sample data */
export const DEMO_SCREENS = [
  'quests',
  'challenge-detail',
  'growth',
  'audience-breakdown',
  'platform-growth',
  'post-performance',
  'voice-studio',
] as const;

export const isComingSoonScreen = (screen: string, demoEnabled: boolean = DEMO_SCREENS_ENABLED): boolean =>
  !demoEnabled && (DEMO_SCREENS as readonly string[]).includes(screen);
