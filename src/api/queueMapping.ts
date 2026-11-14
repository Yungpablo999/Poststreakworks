import type {
  CalendarDay,
  CalendarMonth,
  CalendarPlatform,
  CalendarPost,
  ScheduleSummary,
  WeekSchedule,
} from '../data';

// Pure mapping from `posts` table rows to the shapes the schedule screens already
// render (CalendarPost / CalendarDay / CalendarMonth / WeekSchedule / ScheduleSummary).
// No I/O here. All "days" are the device's LOCAL days, never UTC.

/** The columns we read from `posts` (never `user_tokens`). */
export const QUEUE_COLUMNS = 'id, content, platform, status, scheduled_at, posted_at, error, created_at';

export interface QueueRow {
  id: string;
  content: string | null;
  platform: string;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  error: string | null;
  created_at: string | null;
}

export type QueuePostStatus = 'posted' | 'scheduled' | 'draft' | 'failed';

/** A CalendarPost plus what the queue needs (only `scheduled` rows can be cancelled). */
export interface QueuePost extends Omit<CalendarPost, 'status'> {
  status: QueuePostStatus;
  /** Local day, YYYY-MM-DD */
  dayKey: string;
  /** Epoch ms of scheduled_at, else posted_at, else created_at */
  at: number;
  error: string | null;
  cancellable: boolean;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Real platform ids -> the app's CalendarPlatform. Legacy rows ('x', 'reddit') have no app icon and are skipped. */
const PLATFORMS: Record<string, CalendarPlatform> = {
  linkedin: 'linkedin',
  threads: 'threads',
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  tiktok: 'tiktok',
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const mondayFirstIndex = (d: Date) => (d.getDay() + 6) % 7;

export function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function mapStatus(status: string): QueuePostStatus {
  if (status === 'published') return 'posted';
  if (status === 'failed') return 'failed';
  if (status === 'draft') return 'draft';
  return 'scheduled'; // 'scheduled' and any in-flight status
}

export function titleFromContent(content: string | null): string {
  const first = (content ?? '').trim().split('\n')[0].trim();
  if (!first) return 'Untitled post';
  return first.length > 80 ? `${first.slice(0, 79).trimEnd()}…` : first;
}

/** One row -> one post, or null when the row has no usable date or an unsupported platform. */
export function rowToPost(row: QueueRow): QueuePost | null {
  const platform = PLATFORMS[(row.platform ?? '').toLowerCase()];
  if (!platform) return null;
  // Published posts sit on the day they actually went out
  const iso = row.status === 'published' ? (row.posted_at ?? row.scheduled_at ?? row.created_at) : (row.scheduled_at ?? row.posted_at ?? row.created_at);
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const status = mapStatus(row.status);
  return {
    id: row.id,
    title: titleFromContent(row.content),
    platform,
    time: formatTime(date),
    status,
    dayKey: dayKey(date),
    at: date.getTime(),
    error: row.error ?? null,
    cancellable: row.status === 'scheduled',
  };
}

export function mapRows(rows: QueueRow[]): QueuePost[] {
  return rows
    .map(rowToPost)
    .filter((p): p is QueuePost => p !== null)
    .sort((a, b) => a.at - b.at);
}

/** Groups by local day; each day's posts stay in time order. */
export function groupByDay(posts: QueuePost[]): Record<string, QueuePost[]> {
  const out: Record<string, QueuePost[]> = {};
  for (const p of [...posts].sort((a, b) => a.at - b.at)) (out[p.dayKey] ??= []).push(p);
  return out;
}

function buildDay(date: Date, today: Date, byDay: Record<string, QueuePost[]>, checkedIn: Set<string> | undefined): CalendarDay {
  const key = dayKey(date);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  return {
    key,
    day: date.getDate(),
    isToday: diff === 0,
    isPast: diff < 0,
    checkedIn: checkedIn?.has(key) ?? false,
    posts: (byDay[key] ?? []) as unknown as CalendarPost[],
  };
}

export function buildCalendarMonth(
  posts: QueuePost[],
  year: number,
  month: number,
  now: Date = new Date(),
  checkedIn?: Set<string>,
): CalendarMonth {
  const today = startOfDay(now);
  const byDay = groupByDay(posts);
  const daysCount = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysCount; d++) days.push(buildDay(new Date(year, month, d), today, byDay, checkedIn));
  const all = days.flatMap((x) => x.posts);
  return {
    year,
    month,
    label: `${MONTH_NAMES[month]} ${year}`,
    startOffset: mondayFirstIndex(new Date(year, month, 1)),
    days,
    postedCount: all.filter((p) => p.status === 'posted').length,
    scheduledCount: all.filter((p) => p.status !== 'posted').length,
    checkInCount: days.filter((x) => x.checkedIn).length,
  };
}

export function buildWeekSchedule(posts: QueuePost[], now: Date = new Date(), checkedIn?: Set<string>): WeekSchedule {
  const today = startOfDay(now);
  const todayIndex = mondayFirstIndex(today);
  const byDay = groupByDay(posts);
  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(buildDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayIndex + i), today, byDay, checkedIn));
  }
  const all = days.flatMap((d) => d.posts);
  const counts: Partial<Record<CalendarPlatform, number>> = {};
  all.forEach((p) => (counts[p.platform] = (counts[p.platform] ?? 0) + 1));
  return {
    days,
    todayIndex,
    plannedCount: all.length,
    draftCount: all.filter((p) => p.status === 'draft').length,
    openDays: days.filter((d) => !d.isPast && !d.isToday && d.posts.length === 0).length,
    platformMix: (Object.keys(counts) as CalendarPlatform[])
      .map((platform) => ({ platform, count: counts[platform]! }))
      .sort((a, b) => b.count - a.count),
    // TODO(demo): suggested best time is mock until real audience data exists
    bestTime: '7:30 PM',
  };
}

/** "Today · 7:30 PM", "Tomorrow · 9:00 AM", "Wed · 6:00 PM" (within a week) or "Nov 20 · 6:00 PM". */
export function nextPostLabel(at: number, now: Date = new Date()): string {
  const d = new Date(at);
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000);
  const when =
    diff <= 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff < 7 ? WEEKDAY_SHORT[d.getDay()] : `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  return `${when} · ${formatTime(d)}`;
}

export function buildScheduleSummary(posts: QueuePost[], now: Date = new Date()): ScheduleSummary {
  const scheduled = posts.filter((p) => p.status === 'scheduled').sort((a, b) => a.at - b.at);
  const upcoming = scheduled.find((p) => p.at >= now.getTime()) ?? scheduled[0];
  return {
    scheduledCount: scheduled.length,
    nextPostLabel: upcoming ? nextPostLabel(upcoming.at, now) : null,
  };
}

/** Local-day numbers (1..31) that have a scheduled post in the given month (for the dashboard calendars). */
export function scheduledDaysInMonth(posts: QueuePost[], year: number, month: number): number[] {
  const set = new Set<number>();
  for (const p of posts) {
    if (p.status !== 'scheduled') continue;
    const d = new Date(p.at);
    if (d.getFullYear() === year && d.getMonth() === month) set.add(d.getDate());
  }
  return [...set].sort((a, b) => a - b);
}

export function monthIndexFromName(name: string): number {
  return MONTH_NAMES.findIndex((m) => m.toLowerCase() === name.toLowerCase());
}

/**
 * Dashboard month grids: keep the demo check-in days (TODO(demo): streak history) but take
 * `scheduledDays` from the real queue.
 */
export function withRealScheduledDays<M extends { monthName: string; year: number; scheduledDays: number[] }>(
  months: M[],
  posts: QueuePost[],
): M[] {
  return months.map((m) => ({ ...m, scheduledDays: scheduledDaysInMonth(posts, m.year, monthIndexFromName(m.monthName)) }));
}

// ---------------------------------------------------------------------------
// Pro schedule screen shapes (ScheduleItem / FullQueueItem live inside that screen;
// these return the same fields so it can render them unchanged).
// ---------------------------------------------------------------------------

export const PRO_PLATFORM_LABEL: Record<CalendarPlatform, string> = {
  instagram: '📸 IG Reel',
  tiktok: '≈ TikTok',
  youtube: '▶ Shorts',
  threads: '🧵 Threads',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

export interface ProScheduleItemShape {
  id: string;
  time: string;
  period: string;
  title: string;
  platform: CalendarPlatform;
  platformLabel: string;
  badgeType: 'scheduled' | 'recommended' | 'draft' | 'posted' | 'failed';
  dayIndex: number;
  cancellable: boolean;
}

export interface ProQueueItemShape {
  id: string;
  title: string;
  platformLabel: string;
  time: string;
  period: string;
  dayLabel: string;
  status: 'AUTOPILOT' | 'READY' | 'QUEUED';
  score: string;
  iconType: CalendarPlatform;
}

const splitTime = (at: number, pad: boolean) => {
  const [t, period] = formatTime(new Date(at)).split(' ');
  return { time: pad && t.length < 5 ? `0${t}` : t, period };
};

/** Posts that fall on one of `dayKeys` (the screen's visible days, in order) -> ScheduleItems with that day's index. */
export function toProScheduleItems(posts: QueuePost[], dayKeys: string[]): ProScheduleItemShape[] {
  const out: ProScheduleItemShape[] = [];
  for (const p of [...posts].sort((a, b) => a.at - b.at)) {
    const dayIndex = dayKeys.indexOf(p.dayKey);
    if (dayIndex < 0) continue;
    const { time, period } = splitTime(p.at, false);
    out.push({
      id: p.id,
      time,
      period,
      title: p.title,
      platform: p.platform,
      platformLabel: PRO_PLATFORM_LABEL[p.platform],
      badgeType: p.status === 'posted' ? 'posted' : p.status,
      dayIndex,
      cancellable: p.cancellable,
    });
  }
  return out;
}

/** "Tomorrow (Sat, Nov 15)" / "Monday (Nov 17)" */
export function proDayLabel(at: number, now: Date = new Date()): string {
  const d = new Date(at);
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000);
  const full = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  const md = `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  return diff === 1 ? `Tomorrow (${WEEKDAY_SHORT[d.getDay()]}, ${md})` : diff === 0 ? `Today (${md})` : `${full} (${md})`;
}

/** Upcoming (still scheduled) posts, soonest first. */
export function toProQueueItems(posts: QueuePost[], now: Date = new Date()): ProQueueItemShape[] {
  return posts
    .filter((p) => p.status === 'scheduled' && p.at >= now.getTime())
    .sort((a, b) => a.at - b.at)
    .map((p) => {
      const { time, period } = splitTime(p.at, true);
      return {
        id: p.id,
        title: p.title,
        platformLabel: PRO_PLATFORM_LABEL[p.platform],
        time,
        period,
        dayLabel: proDayLabel(p.at, now),
        status: 'QUEUED' as const,
        // TODO(demo): audience-fit score is mock until Jarvis scoring is real
        score: '95% Audience Fit',
        iconType: p.platform,
      };
    });
}
