import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { CalendarItem } from '../../frontend/shared/types/phase1';
import { hydrateCalendarPosts, type CalendarPlatform } from '../data';
import { api } from './api';

// What the creator planned and what they posted, read from the server for a window of time
// and put into the calendar the screens share (src/data).

const SHOWN: readonly string[] = ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'];

export async function loadCalendarRange(from: Date, to: Date): Promise<boolean> {
  const res = await api.get<{ items: CalendarItem[] }>(
    `${API_ROUTES.CALENDAR}?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
  );
  if (!res.ok) return false;
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
      })),
  );
  return true;
}

/** One calendar month (month is 0-based, like Date). */
export const loadCalendarMonth = (year: number, month: number) => loadCalendarRange(new Date(year, month, 1), new Date(year, month + 1, 1));

/** The seven days of the week that contains `day`, Monday first. */
export function loadCalendarWeek(day: Date = new Date()): Promise<boolean> {
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7));
  return loadCalendarRange(monday, new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7));
}
