import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { CalendarItem } from '../../frontend/shared/types/phase1';
import { hydrateCalendarPosts, type CalendarPlatform } from '../data';
import { api } from './api';

// What the creator planned and what they posted, read from the server for a window of time
// and put into the calendar the screens share (src/data).

const SHOWN: readonly string[] = ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'];

// The windows shown so far, so that when a post changes they can be read again.
const shown = new Map<string, [Date, Date]>();
const MAX_SHOWN = 6;

export async function loadCalendarRange(from: Date, to: Date): Promise<boolean> {
  const res = await api.get<{ items: CalendarItem[] }>(
    `${API_ROUTES.CALENDAR}?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
  );
  if (!res.ok) return false;
  const key = `${from.getTime()}-${to.getTime()}`;
  shown.delete(key);
  shown.set(key, [from, to]);
  if (shown.size > MAX_SHOWN) shown.delete(shown.keys().next().value as string);
  hydrateCalendarPosts(
    from.getTime(),
    to.getTime(),
    res.data.items
      .filter((i) => SHOWN.includes(i.platform))
      .map((i) => ({
        id: `${i.kind}:${i.id}:${i.platform}`,
        title: i.title,
        platform: i.platform as CalendarPlatform,
        at: Date.parse(i.at),
        status: i.status,
        url: i.url,
        postId: i.kind === 'scheduled' ? i.id : undefined,
      })),
  );
  return true;
}

/** Reads the windows that are showing again: a post was planned, moved, posted or removed. */
export async function refreshCalendar(): Promise<void> {
  await Promise.all([...shown.values()].map(([from, to]) => loadCalendarRange(from, to)));
}

export function clearCalendarWindows(): void {
  shown.clear();
}

/** One calendar month (month is 0-based, like Date). */
export const loadCalendarMonth = (year: number, month: number) => loadCalendarRange(new Date(year, month, 1), new Date(year, month + 1, 1));

/** The seven days of the week that contains `day`, Monday first. */
export function loadCalendarWeek(day: Date = new Date()): Promise<boolean> {
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7));
  return loadCalendarRange(monday, new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7));
}
