import { getSupabase } from '../auth/supabase';

// The streak leaderboard, read from the backend's public.streak_leaderboard view (top 50 by current streak).
// The view has no names (only user_id), so everyone else is shown as an anonymous creator and the viewer's own
// row is marked 'You'. Display names need an opt-in backend change first (see the PR notes).

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  streak: number;
  longest: number;
  posts: number;
  isYou: boolean;
  /** 'You' for the viewer, 'Creator' for everyone else (no names in the view) */
  name: string;
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};

/** Rows from the view become entries, best rank first. Bad rows are dropped. */
export function toEntries(rows: unknown, viewerId: string | null): LeaderboardEntry[] {
  if (!Array.isArray(rows)) return [];
  const out: LeaderboardEntry[] = [];
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const row = r as Record<string, unknown>;
    if (typeof row.user_id !== 'string' || row.user_id === '') continue;
    const isYou = viewerId !== null && row.user_id === viewerId;
    out.push({
      rank: num(row.rank),
      userId: row.user_id,
      streak: num(row.current_streak),
      longest: num(row.longest_streak),
      posts: num(row.total_posts),
      isYou,
      name: isYou ? 'You' : 'Creator',
    });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

/** The viewer's rank, or null when they are not in the top 50 */
export function rankOf(entries: LeaderboardEntry[]): number | null {
  return entries.find((e) => e.isYou)?.rank ?? null;
}

export interface LeaderboardClient {
  from(table: string): {
    select(columns: string): {
      order(column: string, opts: { ascending: boolean }): {
        limit(n: number): PromiseLike<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
}

/** Top 50 streaks. Throws an Error with a short message when it cannot load. */
export async function fetchLeaderboard(viewerId: string | null, client?: LeaderboardClient): Promise<LeaderboardEntry[]> {
  const c = client ?? (getSupabase() as unknown as LeaderboardClient);
  const { data, error } = await c
    .from('streak_leaderboard')
    .select('rank,user_id,current_streak,longest_streak,total_posts')
    .order('rank', { ascending: true })
    .limit(50);
  if (error) throw new Error("Couldn't load the leaderboard.");
  return toEntries(data, viewerId);
}
