import { fetchLeaderboard, rankOf, toEntries, type LeaderboardClient } from '../leaderboard';

const rows = [
  { rank: '2', user_id: 'b', current_streak: 9, longest_streak: 12, total_posts: 30 },
  { rank: 1, user_id: 'a', current_streak: 20, longest_streak: 20, total_posts: 41 },
  { rank: 3, user_id: 'me', current_streak: 4, longest_streak: 6, total_posts: 9 },
  { rank: 4, user_id: '', current_streak: 1 },
  null,
];

describe('toEntries', () => {
  it('sorts by rank, coerces numbers, drops bad rows', () => {
    const e = toEntries(rows, null);
    expect(e.map((x) => [x.rank, x.userId])).toEqual([[1, 'a'], [2, 'b'], [3, 'me']]);
    expect(e[1]).toMatchObject({ streak: 9, longest: 12, posts: 30 });
  });
  it('marks only the viewer as You; everyone else is an anonymous Creator', () => {
    const e = toEntries(rows, 'me');
    expect(e.filter((x) => x.isYou).map((x) => x.userId)).toEqual(['me']);
    expect(e.find((x) => x.isYou)?.name).toBe('You');
    expect(e.filter((x) => !x.isYou).every((x) => x.name === 'Creator')).toBe(true);
    expect(toEntries(rows, null).some((x) => x.isYou)).toBe(false);
  });
  it('handles non-array input', () => {
    expect(toEntries(null, 'me')).toEqual([]);
    expect(toEntries({}, 'me')).toEqual([]);
  });
});

describe('rankOf', () => {
  it('is the viewer rank, or null when not in the top 50', () => {
    expect(rankOf(toEntries(rows, 'me'))).toBe(3);
    expect(rankOf(toEntries(rows, 'someone-else'))).toBeNull();
    expect(rankOf([])).toBeNull();
  });
});

describe('fetchLeaderboard', () => {
  const make = (result: { data: unknown; error: { message: string } | null }) => {
    const seen: string[] = [];
    const c: LeaderboardClient = {
      from: (t) => ({
        select: (cols) => ({
          order: (col, o) => ({
            limit: async (n) => { seen.push(`${t}|${cols}|${col}|${o.ascending}|${n}`); return result; },
          }),
        }),
      }),
    };
    return { c, seen };
  };
  it('reads the view, top 50 by rank', async () => {
    const { c, seen } = make({ data: rows, error: null });
    const e = await fetchLeaderboard('me', c);
    expect(e).toHaveLength(3);
    expect(seen).toEqual(['streak_leaderboard|rank,user_id,current_streak,longest_streak,total_posts|rank|true|50']);
  });
  it('throws a short message on error', async () => {
    await expect(fetchLeaderboard('me', make({ data: null, error: { message: 'permission denied for view' } }).c)).rejects.toThrow("Couldn't load the leaderboard.");
  });
});
