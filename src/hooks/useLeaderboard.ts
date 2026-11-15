import { useCallback, useEffect, useState } from 'react';
import { getCurrentSession } from '../auth/session';
import { fetchLeaderboard, rankOf, type LeaderboardEntry } from '../api/leaderboard';

/** The top streaks plus the signed-in creator's own rank (null when not in the top 50). */
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getCurrentSession();
      setEntries(await fetchLeaderboard(session?.user.id ?? null));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, myRank: rankOf(entries), loading, error, refresh };
}
