// Product stage flags. Stage 2 features stay in the codebase but are hidden
// until launch — wrap any Stage 2 UI in `STAGE_2_ENABLED && (...)` instead of deleting it.
//
// Stage 1 (live): Studio, analytics (YouTube, Threads, Instagram, Facebook, TikTok),
//   insights, scheduling, quests, check-in streak.
// Stage 2 (hidden): Creator Match, Creator Passport, Squads / Duels, Brand campaigns.
export const STAGE_2_ENABLED = false;

// Platforms with Stage 1 analytics support.
export const STAGE_1_PLATFORMS = ['youtube', 'threads', 'instagram', 'facebook', 'tiktok'] as const;
export type Stage1Platform = (typeof STAGE_1_PLATFORMS)[number];

// Free-tier limits.
// One free repurpose a week (a video breakdown costs real AI time per run).
export const FREE_REPURPOSES_PER_WEEK = 1;

export const isStage1Platform = (id: string): id is Stage1Platform =>
  (STAGE_1_PLATFORMS as readonly string[]).includes(id);
