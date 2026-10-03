import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { NotificationFeed, NotificationItem } from '../../frontend/shared/types/phase1';
import { unreadStore } from './account';
import { api } from './api';
import { createStore } from './store';

// The bell. The server writes the notifications; the app reads them when it opens the bell
// and says which ones were read. Nothing here is generated on the device.

export const feedStore = createStore<{ items: NotificationItem[]; loaded: boolean }>({ items: [], loaded: false });
export const useNotificationFeed = feedStore.use;

export async function loadNotifications(): Promise<boolean> {
  const res = await api.get<NotificationFeed>(API_ROUTES.NOTIFICATIONS.LIST);
  if (!res.ok) return false;
  feedStore.set({ items: res.data.items, loaded: true });
  unreadStore.set(res.data.unread);
  return true;
}

/** Marks notifications read (all of them when no ids are given). Shown at once, then told to the server. */
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const { items, loaded } = feedStore.get();
  const mark = new Set(ids ?? items.filter((i) => !i.read).map((i) => i.id));
  if (mark.size === 0) return;
  const next = items.map((i) => (mark.has(i.id) ? { ...i, read: true } : i));
  feedStore.set({ items: next, loaded });
  unreadStore.set(next.filter((i) => !i.read).length);
  const res = await api.post<{ unread: number }>(API_ROUTES.NOTIFICATIONS.READ, ids ? { ids } : {});
  if (res.ok) unreadStore.set(res.data.unread);
}

export function clearNotifications(): void {
  feedStore.set({ items: [], loaded: false });
}
