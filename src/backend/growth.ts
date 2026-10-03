import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { AccountSnapshotDto, GrowthOverview, GrowthPost } from '../../frontend/shared/types/phase1';
import { api } from './api';
import { syncAccount } from './accounts';
import { createStore } from './store';

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

// ─── The Growth screens ─────────────────────────────────────────────────────

/** What Growth shows, as of the last time it was loaded. null = not loaded yet (or signed out). */
export const growthStore = createStore<GrowthOverview | null>(null);
export const useGrowth = growthStore.use;

export async function loadGrowth(): Promise<GrowthOverview | null> {
  const res = await api.get<GrowthOverview>(API_ROUTES.GROWTH.OVERVIEW);
  if (!res.ok) return null;
  growthStore.set(res.data);
  return res.data;
}

/** One post's numbers by its key (`tiktok:7012…`). null = couldn't be loaded. */
export async function loadGrowthPost(key: string): Promise<GrowthPost | null> {
  const res = await api.get<GrowthPost>(API_ROUTES.GROWTH.POST(key));
  return res.ok ? res.data : null;
}

export function clearGrowth(): void {
  growthStore.set(null);
}

export type RefreshOutcome = { ok: true } | { ok: false; message: string };

/**
 * Asks each connected account's platform for fresh numbers right now (the nightly job does this too),
 * then reloads Growth. An account that needs approving again, or that the platform wouldn't answer,
 * is named in the message.
 */
export async function refreshGrowth(overview: GrowthOverview): Promise<RefreshOutcome> {
  const working = overview.platforms.filter((p) => p.status !== 'needs_reauth');
  const results = await Promise.all(working.map(async (p) => ({ platform: p.platform, result: await syncAccount(p.platform) })));
  await loadGrowth();
  const trouble = results.filter((r) => r.result === null || r.result.status === 'error' || r.result.status === 'needs_reauth' || r.result.status === 'busy');
  if (trouble.length === 0) return { ok: true };
  const names = trouble.map((r) => PLATFORM_NAME[r.platform] ?? r.platform).join(' and ');
  const reconnect = trouble.some((r) => r.result?.status === 'needs_reauth');
  return { ok: false, message: reconnect ? `${names} needs you to connect again.` : `Couldn’t refresh ${names} just now. Try again in a little while.` };
}
