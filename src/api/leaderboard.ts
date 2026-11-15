import { getSupabase } from '../auth/supabase';

// The streak leaderboard, read from the backend's public.streak_leaderboard view (top 50 by current streak).
// Names are opt-in: once the backend's leaderboard_profiles migration is applied, the view has a display_name
// column ('Anonymous' unless the creator opted in). Before that the column does not exist, so the read falls back
// to the old columns and everyone else is a 'Creator'. The viewer's own row is always marked 'You'.

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  streak: number;
  longest: number;
  posts: number;
  isYou: boolean;
  /** 'You' for the viewer; else the opted-in display name, 'Anonymous' (opted out) or 'Creator' (no names in the view yet) */
  name: string;
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};

/** The name to show for someone else: their opted-in name, else Anonymous, or Creator when the view has no names */
function otherName(displayName: unknown): string {
  if (typeof displayName !== 'string') return 'Creator';
  const t = displayName.trim();
  return t === '' ? 'Anonymous' : t;
}

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
      name: isYou ? 'You' : otherName(row.display_name),
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

const BASE_COLUMNS = 'rank,user_id,current_streak,longest_streak,total_posts';

/** Top 50 streaks. Throws an Error with a short message when it cannot load. */
export async function fetchLeaderboard(viewerId: string | null, client?: LeaderboardClient): Promise<LeaderboardEntry[]> {
  const c = client ?? (getSupabase() as unknown as LeaderboardClient);
  const read = (columns: string) => c.from('streak_leaderboard').select(columns).order('rank', { ascending: true }).limit(50);
  let { data, error } = await read(`${BASE_COLUMNS},display_name`);
  // Before the names migration the column does not exist: read the old columns instead
  if (error) ({ data, error } = await read(BASE_COLUMNS));
  if (error) throw new Error("Couldn't load the leaderboard.");
  return toEntries(data, viewerId);
}
