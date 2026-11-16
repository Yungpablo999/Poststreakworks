import { ApiError, api } from './authFetch';

// Autopilot: topics + platforms + mode, saved on the backend, and a "run now" button.
//
//   GET  /api/autopilot/config -> { topics, platforms, frequency, mode, enabled, last_run_at }  (defaults if none saved)
//   POST /api/autopilot/config { topics, platforms, frequency, mode, enabled } -> { success, config }
//   POST /api/autopilot/run    -> { success, topic, generated[], errors[], mode, message }
//
// mode is 'suggest' (drafts to review in the queue) or 'auto' (scheduled a few minutes out).
// The run route is limited per IP and counts against the daily AI allowance, so 429 is expected sometimes.

/** Autopilot writes text-only posts, so only the platforms that can take them (poststreak-web AUTOPILOT_PLATFORMS) */
export const AUTOPILOT_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'threads', label: 'Threads' },
  { id: 'facebook', label: 'Facebook' },
] as const;

export type AutopilotMode = 'suggest' | 'auto';

export const MAX_TOPICS = 10;
export const MAX_TOPIC_LENGTH = 80;

export interface AutopilotConfig {
  topics: string[];
  platforms: string[];
  frequency: number;
  mode: AutopilotMode;
  enabled: boolean;
  last_run_at: string | null;
}

export interface AutopilotResult {
  success: boolean;
  topic: string;
  generated: { platform: string; content: string; status: string }[];
  errors: { platform: string; error: string }[];
  mode: AutopilotMode;
  message: string;
}

export interface AutopilotApi {
  getConfig: () => Promise<AutopilotConfig>;
  saveConfig: (config: AutopilotConfig) => Promise<AutopilotConfig>;
  run: () => Promise<AutopilotResult>;
}

const offered = (id: string) => AUTOPILOT_PLATFORMS.some((p) => p.id === id);

/** Anything the server sent, made safe to render */
export function normalizeConfig(raw: Partial<AutopilotConfig> | null | undefined): AutopilotConfig {
  const r = raw ?? {};
  return {
    topics: Array.isArray(r.topics) ? r.topics.filter((t): t is string => typeof t === 'string' && !!t.trim()) : [],
    platforms: Array.isArray(r.platforms) ? r.platforms.filter((p): p is string => typeof p === 'string' && offered(p)) : [],
    frequency: typeof r.frequency === 'number' ? r.frequency : 1,
    mode: r.mode === 'auto' ? 'auto' : 'suggest',
    enabled: r.enabled === true,
    last_run_at: typeof r.last_run_at === 'string' ? r.last_run_at : null,
  };
}

/** A topic as stored: trimmed, one line, not too long. Empty means "don't add" */
export function cleanTopic(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, MAX_TOPIC_LENGTH);
}

/** Adds a topic unless it is empty, a repeat (any case) or the list is full */
export function addTopic(topics: string[], input: string): string[] {
  const t = cleanTopic(input);
  if (!t || topics.length >= MAX_TOPICS) return topics;
  if (topics.some((x) => x.toLowerCase() === t.toLowerCase())) return topics;
  return [...topics, t];
}

export function toggleItem(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** What stops Run now / turning autopilot on, or null when the setup is ready */
export function setupProblem(c: Pick<AutopilotConfig, 'topics' | 'platforms'>): string | null {
  if (!c.topics.length) return 'Add at least one topic first.';
  if (!c.platforms.length) return 'Pick at least one platform first.';
  return null;
}

export const AUTOPILOT_MESSAGES = {
  signedOut: 'Your session has expired. Sign in again.',
  tooFast: 'Too many tries. Wait a minute and try again.',
  capReached: "You've used today's AI allowance. It resets at midnight (WAT).",
  unavailable: "Couldn't check your AI allowance. Try again in a moment.",
  network: "Couldn't reach PostStreak. Check your connection and try again.",
  generic: "Couldn't do that. Try again in a moment.",
} as const;

/** One short sentence for a toast when loading, saving or running autopilot fails */
export function describeAutopilotError(e: unknown): string {
  if (e instanceof ApiError) {
    const body = (e.body ?? {}) as { error?: unknown; code?: unknown };
    if (e.status === 401) return AUTOPILOT_MESSAGES.signedOut;
    if (e.status === 429) return body.code === 'ai_daily_cap' ? AUTOPILOT_MESSAGES.capReached : AUTOPILOT_MESSAGES.tooFast;
    if (e.status === 503 && body.code === 'ai_quota_unavailable') return AUTOPILOT_MESSAGES.unavailable;
    if (e.status === 400 && typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    return AUTOPILOT_MESSAGES.generic;
  }
  return AUTOPILOT_MESSAGES.network;
}

export const autopilotApi: AutopilotApi = {
  getConfig: async () => normalizeConfig(await api.get<AutopilotConfig>('/api/autopilot/config')),
  saveConfig: async (config) => {
    const res = await api.post<{ config: AutopilotConfig }>('/api/autopilot/config', {
      topics: config.topics,
      platforms: config.platforms,
      frequency: config.frequency,
      mode: config.mode,
      enabled: config.enabled,
    });
    return normalizeConfig(res.config);
  },
  run: () => api.post<AutopilotResult>('/api/autopilot/run'),
};
