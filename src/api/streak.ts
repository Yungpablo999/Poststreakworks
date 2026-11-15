import { api } from './authFetch';
import { getSupabase } from '../auth/supabase';
import { checkInToday, getCheckInStreak, hasRealCheckInStreak, setRealCheckInStreak, type CheckInStreak, type Persona } from '../data';
import { mapStreakRow, STREAK_COLUMNS, type StreakRow, type StreakSnapshot } from './streakMapping';

export * from './streakMapping';

// The creator's real streak. The backend counts a day when a post is PUBLISHED (post now, or the
// scheduler publishing one): it updates the streak itself, so the app never calls
// /api/streak/update after a post. The app only reads the row (Row Level Security limits it to the
// signed-in user) and refreshes after a post. The app never adds a streak day itself: a check-in is a
// separate record (sendCheckIn) and does not count as a post day.

export interface StreakState {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  snapshot: StreakSnapshot | null;
}

let state: StreakState = { loaded: false, loading: false, error: null, snapshot: null };
let inFlight: Promise<void> | null = null;
let lastLoadedAt = 0;
const listeners = new Set<() => void>();

const setState = (patch: Partial<StreakState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const getStreakState = () => state;
export function subscribeToStreak(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Sign-out / test helper: forget everything, back to the sample check-in */
export function resetStreak() {
  inFlight = null;
  lastLoadedAt = 0;
  setState({ loaded: false, loading: false, error: null, snapshot: null });
  setRealCheckInStreak(null);
}

export async function fetchStreakRow(): Promise<StreakRow | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Sign in to see your streak');
  const { data, error } = await supabase.from('user_streaks').select(STREAK_COLUMNS).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as StreakRow | null;
}

export function refreshStreak(): Promise<void> {
  if (inFlight) return inFlight;
  setState({ loading: true });
  inFlight = (async () => {
    try {
      const snapshot = mapStreakRow(await fetchStreakRow());
      lastLoadedAt = Date.now();
      setState({ snapshot, loaded: true, loading: false, error: null });
      setRealCheckInStreak(snapshot);
    } catch (e) {
      setState({ loading: false, loaded: true, error: e instanceof Error ? e.message : 'Could not load your streak' });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Refreshes unless it was loaded in the last `maxAgeMs` (screens call this on mount) */
export function refreshStreakIfStale(maxAgeMs = 60_000): Promise<void> {
  if (state.loaded && !state.error && Date.now() - lastLoadedAt < maxAgeMs) return Promise.resolve();
  return refreshStreak();
}

export type CheckInSyncResult = { ok: true } | { ok: false; error: string };

/**
 * Tells the backend the creator checked in today (POST /api/checkin). A check-in is NOT a post: the
 * backend records it separately and it never adds a streak day. Never throws: an older backend
 * without the route (404) or a dropped connection just leaves the local cheer as it is.
 */
export async function sendCheckIn(): Promise<CheckInSyncResult> {
  try {
    await api.post('/api/checkin', {});
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not save your check-in' };
  }
}

/**
 * The check-in tap: the local cheer first (instant), then the backend record for a signed-in creator
 * with real data. Signed-out and demo mode stay fully local. Already checked in today does nothing.
 */
export function checkInAndSync(persona: Persona): CheckInStreak {
  const alreadyDone = getCheckInStreak(persona).checkedInToday;
  const result = checkInToday(persona);
  if (!alreadyDone && hasRealCheckInStreak()) void sendCheckIn();
  return result;
}
