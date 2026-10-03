import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { AccountSnapshotDto } from '../../frontend/shared/types/phase1';
import { api } from './api';

// What the creator's connected accounts say about how they're doing. The server reads their own
// posts and works the figures out; the app only asks.

export const PLATFORM_NAME: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
  x: 'X',
  linkedin: 'LinkedIn',
};

/** One snapshot per connected platform that has enough posts to say something true. null = couldn't be loaded. */
export async function loadSnapshots(): Promise<AccountSnapshotDto[] | null> {
  const res = await api.get<AccountSnapshotDto[]>(API_ROUTES.GROWTH.SNAPSHOTS);
  return res.ok ? res.data : null;
}

/** The hour their posts do best on the platform they post on most. null = not enough posts yet (or couldn't be loaded). */
export async function loadBestTime(): Promise<{ time: string; platformName: string } | null> {
  const snaps = await loadSnapshots();
  const top = [...(snaps ?? [])].sort((a, b) => b.recentPosts - a.recentPosts)[0];
  return top ? { time: top.bestTime, platformName: PLATFORM_NAME[top.platform] ?? top.platform } : null;
}
