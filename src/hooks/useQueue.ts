import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  buildCalendarMonth,
  buildScheduleSummary,
  buildWeekSchedule,
  cancelQueuePost,
  getQueueState,
  refreshQueue,
  subscribeToQueue,
  type CancelResult,
  type QueuePost,
} from '../api/queue';
import { getCalendarMonth, getWeekSchedule, type CalendarMonth, type Persona, type ScheduleSummary, type WeekSchedule } from '../data';

export interface UseQueue {
  posts: QueuePost[];
  loading: boolean;
  /** True once the first load has finished (success or error). */
  loaded: boolean;
  error: string | null;
  week: WeekSchedule;
  summary: ScheduleSummary;
  /** `month` is 0-based, like Date. */
  month: (year: number, month: number) => CalendarMonth;
  cancelPost: (id: string) => Promise<CancelResult>;
  refresh: () => Promise<void>;
}

/** The creator's real posts, shaped for the schedule screens. Loads on first use. */
// TODO(demo): the per-day check-in dots still come from the demo check-in store (src/data), not the queue.
const checkedInKeys = (days: { key: string; checkedIn: boolean }[]) => new Set(days.filter((d) => d.checkedIn).map((d) => d.key));

export function useQueue(persona: Persona = 'returning'): UseQueue {
  const s = useSyncExternalStore(subscribeToQueue, getQueueState, getQueueState);

  useEffect(() => {
    if (!getQueueState().loaded) void refreshQueue();
  }, []);

  // Not memoised: check-ins change outside this store (cheap to rebuild)
  const week = buildWeekSchedule(s.posts, new Date(), checkedInKeys(getWeekSchedule(persona).days));
  const summary = useMemo(() => buildScheduleSummary(s.posts), [s.posts]);
  const month = useCallback(
    (y: number, m: number) => buildCalendarMonth(s.posts, y, m, new Date(), checkedInKeys(getCalendarMonth(persona, y, m).days)),
    [s.posts, persona],
  );

  return {
    posts: s.posts,
    loading: s.loading,
    loaded: s.loaded,
    error: s.error,
    week,
    summary,
    month,
    cancelPost: cancelQueuePost,
    refresh: refreshQueue,
  };
}
