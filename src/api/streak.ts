import { api } from './authFetch';
import { getSupabase } from '../auth/supabase';
import { setRealCheckInStreak } from '../data';
import { mapStreakRow, STREAK_COLUMNS, type StreakRow, type StreakSnapshot } from './streakMapping';

export * from './streakMapping';

// The creator's real streak. The backend counts a day when a post is PUBLISHED (post now, or the
// scheduler publishing one): it updates the streak itself, so the app never calls
// /api/streak/update after a post. The app only reads the row (Row Level Security limits it to the
// signed-in user) and refreshes after a post. The one POST is recordManualPost(), for a post the
// creator says they made by hand in another app.

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

export type ManualPostResult = { ok: true } | { ok: false; error: string };

/**
 * The creator confirms they posted by hand in another app. That is a post, so it counts a streak day
 * (POST /api/streak/update, the same count a published post gets). Not for check-ins: a check-in is not a post.
 */
export async function recordManualPost(): Promise<ManualPostResult> {
  try {
    await api.post('/api/streak/update', {});
    await refreshStreak();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not update your streak' };
  }
}
