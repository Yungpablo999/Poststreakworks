import { api } from './authFetch';
import { getSupabase } from '../auth/supabase';
import { mapRows, QUEUE_COLUMNS, type QueuePost, type QueueRow } from './queueMapping';

export * from './queueMapping';

// The creator's real post queue: one shared store (so every screen and the
// calendar sheet see the same posts, and a cancel shows up everywhere at once).
// Reads `posts` with the app's Supabase client; Row Level Security limits it to
// the signed-in user. Cancelling goes through the backend (POST /api/post/cancel).

/** Window: posts dated in the last 90 days or later (plus undated-by-schedule rows via posted_at). */
const WINDOW_DAYS = 90;
const ROW_LIMIT = 500;

export interface QueueState {
  posts: QueuePost[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

let state: QueueState = { posts: [], loading: false, loaded: false, error: null };
const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

const setState = (patch: Partial<QueueState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const getQueueState = () => state;
export function subscribeToQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test helper / sign-out: forget everything. */
export function resetQueue() {
  inFlight = null;
  setState({ posts: [], loading: false, loaded: false, error: null });
}

export async function fetchQueueRows(now: Date = new Date()): Promise<QueueRow[]> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86400000).toISOString();
  const { data, error } = await getSupabase()
    .from('posts')
    .select(QUEUE_COLUMNS)
    .or(`scheduled_at.gte.${since},posted_at.gte.${since}`)
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .limit(ROW_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []) as QueueRow[];
}

export function refreshQueue(): Promise<void> {
  if (inFlight) return inFlight;
  setState({ loading: true });
  inFlight = (async () => {
    try {
      const rows = await fetchQueueRows();
      setState({ posts: mapRows(rows), loaded: true, loading: false, error: null });
    } catch (e) {
      setState({ loading: false, loaded: true, error: e instanceof Error ? e.message : 'Could not load your queue' });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export type CancelResult = { ok: true } | { ok: false; error: string };

/** Cancels a scheduled post. Only `scheduled` posts can be cancelled; the server deletes the row. */
export async function cancelQueuePost(id: string): Promise<CancelResult> {
  const post = state.posts.find((p) => p.id === id);
  if (post && !post.cancellable) return { ok: false, error: 'Only scheduled posts can be cancelled' };
  try {
    const res = await api.post<{ success?: boolean }>('/api/post/cancel', { postId: id });
    if (res && res.success === false) return { ok: false, error: 'Could not cancel this post' };
    setState({ posts: state.posts.filter((p) => p.id !== id) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not cancel this post' };
  }
}
