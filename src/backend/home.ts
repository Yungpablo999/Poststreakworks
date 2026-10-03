import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { HomeSummary } from '../../frontend/shared/types/phase1';
import { api } from './api';
import { notify } from './notice';
import { createStore } from './store';

// What Home shows for a creator who posts. Read from the server each time Home opens.

export const homeStore = createStore<HomeSummary | null>(null);
export const useHomeSummary = homeStore.use;

export async function loadHome(): Promise<HomeSummary | null> {
  const res = await api.get<HomeSummary>(API_ROUTES.HOME);
  if (!res.ok) return null;
  homeStore.set(res.data);
  for (const q of res.data.justCompleted) notify(`Quest done: ${q.title}  +${q.xp} XP`, 4800);
  return res.data;
}

export function clearHome(): void {
  homeStore.set(null);
}
