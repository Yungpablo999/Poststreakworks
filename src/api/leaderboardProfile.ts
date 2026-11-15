import { ApiError, api } from './authFetch';

// The creator's leaderboard name and opt-in, from the backend (names are opt-in, default off).
//
//   GET  /api/leaderboard/profile -> { display_name: string | null, show_on_leaderboard: boolean }
//   POST /api/leaderboard/profile    body { display_name?, show_on_leaderboard? } -> the saved profile
//
// POST is the same save as the backend's PUT (the app's client sends only GET and POST).
// Until the backend migration is applied both return 503; that surfaces as NOT_READY_MESSAGE.
// No screen uses this yet: the settings control needs a design first.

export interface LeaderboardProfile {
  displayName: string | null;
  show: boolean;
}

export const OFF_PROFILE: LeaderboardProfile = { displayName: null, show: false };
export const NOT_READY_MESSAGE = 'Leaderboard names are not available yet.';
export const PROFILE_MESSAGES = {
  signedOut: 'Your session has expired. Sign in again.',
  network: "Couldn't reach PostStreak. Check your connection and try again.",
  generic: "Couldn't save that. Try again in a moment.",
} as const;

interface WireProfile {
  display_name?: unknown;
  show_on_leaderboard?: unknown;
}

/** Anything the backend sends becomes a safe profile (hidden, no name unless clearly set) */
export function toProfile(raw: unknown): LeaderboardProfile {
  if (!raw || typeof raw !== 'object') return OFF_PROFILE;
  const w = raw as WireProfile;
  const name = typeof w.display_name === 'string' && w.display_name.trim() !== '' ? w.display_name.trim() : null;
  return { displayName: name, show: name !== null && w.show_on_leaderboard === true };
}

/** One short sentence for a toast. Validation messages are written for people by the backend. */
export function describeProfileError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return PROFILE_MESSAGES.signedOut;
    if (e.status === 503) return NOT_READY_MESSAGE;
    const body = (e.body ?? {}) as { error?: unknown };
    if (e.status === 400 && typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    return PROFILE_MESSAGES.generic;
  }
  return PROFILE_MESSAGES.network;
}

export interface ProfileApi {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
}

const PATH = '/api/leaderboard/profile';

export async function getLeaderboardProfile(client: ProfileApi = api): Promise<LeaderboardProfile> {
  return toProfile(await client.get<unknown>(PATH));
}

/** Saves a name and/or the opt-in. Send only what changed. Returns the saved profile. */
export async function saveLeaderboardProfile(
  change: { displayName?: string | null; show?: boolean },
  client: ProfileApi = api,
): Promise<LeaderboardProfile> {
  const body: Record<string, unknown> = {};
  if (change.displayName !== undefined) body.display_name = change.displayName;
  if (change.show !== undefined) body.show_on_leaderboard = change.show;
  return toProfile(await client.post<unknown>(PATH, body));
}
