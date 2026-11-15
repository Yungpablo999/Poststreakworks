import {
  buildCalendarMonth,
  buildScheduleSummary,
  buildWeekSchedule,
  groupByDay,
  mapRows,
  rowToPost,
  scheduledDaysInMonth,
  toProQueueItems,
  toProScheduleItems,
  withRealScheduledDays,
  type QueueRow,
} from '../queueMapping';

// Fixtures are built from LOCAL date parts, so the tests hold in any device timezone.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
// "Now" = Wed 12 Nov 2025, 10:00 local
const NOW = new Date(2025, 10, 12, 10, 0);

const row = (over: Partial<QueueRow>): QueueRow => ({
  id: 'id',
  content: 'Hello world',
  platform: 'linkedin',
  status: 'scheduled',
  scheduled_at: local(2025, 11, 12, 19, 30),
  posted_at: null,
  error: null,
  created_at: local(2025, 11, 1, 9, 0),
  ...over,
});

describe('rowToPost', () => {
  it('maps a scheduled row to the UI shape', () => {
    expect(rowToPost(row({ id: 'a' }))).toMatchObject({
      id: 'a',
      title: 'Hello world',
      platform: 'linkedin',
      time: '7:30 PM',
      status: 'scheduled',
      dayKey: '2025-11-12',
      cancellable: true,
      error: null,
    });
  });

  it('maps statuses: published -> posted, failed keeps its error, draft, unknown -> scheduled', () => {
    expect(rowToPost(row({ status: 'published', posted_at: local(2025, 11, 10, 8, 5) }))).toMatchObject({ status: 'posted', time: '8:05 AM', cancellable: false });
    expect(rowToPost(row({ status: 'failed', error: 'Token expired' }))).toMatchObject({ status: 'failed', error: 'Token expired', cancellable: false });
    expect(rowToPost(row({ status: 'draft' }))).toMatchObject({ status: 'draft', cancellable: false });
    expect(rowToPost(row({ status: 'publishing' }))).toMatchObject({ status: 'scheduled', cancellable: false });
  });

  it('handles 12 AM / 12 PM', () => {
    expect(rowToPost(row({ scheduled_at: local(2025, 11, 12, 0, 0) }))?.time).toBe('12:00 AM');
    expect(rowToPost(row({ scheduled_at: local(2025, 11, 12, 12, 15) }))?.time).toBe('12:15 PM');
  });

  it('falls back to posted_at then created_at for the date', () => {
    expect(rowToPost(row({ scheduled_at: null, posted_at: local(2025, 11, 9, 7, 0) }))?.dayKey).toBe('2025-11-09');
    expect(rowToPost(row({ scheduled_at: null, posted_at: null, created_at: local(2025, 11, 3, 7, 0) }))?.dayKey).toBe('2025-11-03');
  });

  it('uses the first line of content, trimmed to 80 chars; empty content gets a placeholder', () => {
    expect(rowToPost(row({ content: 'Line one\nLine two' }))?.title).toBe('Line one');
    expect(rowToPost(row({ content: 'x'.repeat(200) }))?.title).toHaveLength(80);
    expect(rowToPost(row({ content: '  ' }))?.title).toBe('Untitled post');
    expect(rowToPost(row({ content: null }))?.title).toBe('Untitled post');
  });

  it('maps all six real platforms and skips legacy/unknown ones and bad dates', () => {
    for (const p of ['linkedin', 'threads', 'facebook', 'instagram', 'youtube', 'tiktok']) {
      expect(rowToPost(row({ platform: p }))?.platform).toBe(p);
    }
    expect(rowToPost(row({ platform: 'x' }))).toBeNull();
    expect(rowToPost(row({ platform: 'reddit' }))).toBeNull();
    expect(rowToPost(row({ scheduled_at: 'nope' }))).toBeNull();
    expect(rowToPost(row({ scheduled_at: null, posted_at: null, created_at: null }))).toBeNull();
  });
});

describe('local-day grouping', () => {
  it('puts 11:30 PM and 12:30 AM local on different days and sorts within a day', () => {
    const posts = mapRows([
      row({ id: 'late', scheduled_at: local(2025, 11, 12, 23, 30) }),
      row({ id: 'early', scheduled_at: local(2025, 11, 12, 6, 0) }),
      row({ id: 'next', scheduled_at: local(2025, 11, 13, 0, 30) }),
    ]);
    const g = groupByDay(posts);
    expect(Object.keys(g).sort()).toEqual(['2025-11-12', '2025-11-13']);
    expect(g['2025-11-12'].map((p) => p.id)).toEqual(['early', 'late']);
    expect(g['2025-11-13'].map((p) => p.id)).toEqual(['next']);
  });

  it('mapRows drops unmappable rows and sorts by time', () => {
    const posts = mapRows([row({ id: 'b', scheduled_at: local(2025, 11, 14, 9) }), row({ id: 'x', platform: 'x' }), row({ id: 'a', scheduled_at: local(2025, 11, 13, 9) })]);
    expect(posts.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('buildWeekSchedule (Monday-first)', () => {
  const posts = mapRows([
    row({ id: 'mon', scheduled_at: local(2025, 11, 10, 9), platform: 'tiktok', status: 'published' }),
    row({ id: 'wed1', scheduled_at: local(2025, 11, 12, 19), platform: 'linkedin' }),
    row({ id: 'wed2', scheduled_at: local(2025, 11, 12, 20), platform: 'linkedin' }),
    row({ id: 'fri', scheduled_at: local(2025, 11, 14, 8), platform: 'threads', status: 'draft' }),
    row({ id: 'nextweek', scheduled_at: local(2025, 11, 17, 8) }),
  ]);
  const week = buildWeekSchedule(posts, NOW);

  it('covers Monday to Sunday with today flagged', () => {
    expect(week.days.map((d) => d.key)).toEqual(['2025-11-10', '2025-11-11', '2025-11-12', '2025-11-13', '2025-11-14', '2025-11-15', '2025-11-16']);
    expect(week.todayIndex).toBe(2);
    expect(week.days[2].isToday).toBe(true);
    expect(week.days[0].isPast).toBe(true);
  });

  it('counts planned, drafts, open future days and platform mix', () => {
    expect(week.plannedCount).toBe(4);
    expect(week.draftCount).toBe(1);
    // Thu, Sat, Sun are future days with nothing planned (Fri has a draft)
    expect(week.openDays).toBe(3);
    expect(week.platformMix).toEqual([
      { platform: 'linkedin', count: 2 },
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 1 }),
    ]);
  });

  it('empty queue: no posts, nothing planned, no platform mix', () => {
    const empty = buildWeekSchedule([], NOW);
    expect(empty.plannedCount).toBe(0);
    expect(empty.platformMix).toEqual([]);
    expect(empty.days.every((d) => d.posts.length === 0)).toBe(true);
    expect(empty.openDays).toBe(4);
  });

  it('marks check-in days from the supplied set', () => {
    const w = buildWeekSchedule([], NOW, new Set(['2025-11-11']));
    expect(w.days[1].checkedIn).toBe(true);
    expect(w.days[0].checkedIn).toBe(false);
  });
});

describe('buildCalendarMonth', () => {
  const posts = mapRows([
    row({ id: 'p', scheduled_at: local(2025, 11, 3, 9), status: 'published' }),
    row({ id: 's', scheduled_at: local(2025, 11, 20, 9) }),
    row({ id: 'f', scheduled_at: local(2025, 11, 21, 9), status: 'failed' }),
    row({ id: 'other', scheduled_at: local(2025, 12, 1, 9) }),
  ]);

  it('lays out November 2025 (starts Saturday -> offset 5) with only that month\'s posts', () => {
    const m = buildCalendarMonth(posts, 2025, 10, NOW);
    expect(m.label).toBe('November 2025');
    expect(m.days).toHaveLength(30);
    expect(m.startOffset).toBe(5);
    expect(m.postedCount).toBe(1);
    expect(m.scheduledCount).toBe(2);
    expect(m.days[2].posts.map((p) => p.id)).toEqual(['p']);
    expect(m.days[11].isToday).toBe(true);
    expect(m.days.flatMap((d) => d.posts).map((p) => p.id)).not.toContain('other');
  });

  it('empty month', () => {
    const m = buildCalendarMonth([], 2025, 10, NOW);
    expect(m.postedCount + m.scheduledCount).toBe(0);
  });
});

describe('buildScheduleSummary', () => {
  it('counts scheduled posts and labels the next one', () => {
    const posts = mapRows([
      row({ id: 'past', scheduled_at: local(2025, 11, 1, 9), status: 'published' }),
      row({ id: 'today', scheduled_at: local(2025, 11, 12, 19, 30) }),
      row({ id: 'later', scheduled_at: local(2025, 11, 20, 9) }),
    ]);
    expect(buildScheduleSummary(posts, NOW)).toEqual({ scheduledCount: 2, nextPostLabel: 'Today · 7:30 PM' });
  });

  it('labels tomorrow, this week and later dates', () => {
    const at = (d: number) => mapRows([row({ scheduled_at: local(2025, 11, d, 9) })]);
    expect(buildScheduleSummary(at(13), NOW).nextPostLabel).toBe('Tomorrow · 9:00 AM');
    expect(buildScheduleSummary(at(15), NOW).nextPostLabel).toBe('Sat · 9:00 AM');
    expect(buildScheduleSummary(at(25), NOW).nextPostLabel).toBe('Nov 25 · 9:00 AM');
  });

  it('empty queue', () => {
    expect(buildScheduleSummary([], NOW)).toEqual({ scheduledCount: 0, nextPostLabel: null });
  });
});

describe('dashboard calendars', () => {
  const posts = mapRows([
    row({ scheduled_at: local(2025, 11, 20, 9) }),
    row({ id: '2', scheduled_at: local(2025, 11, 20, 18) }),
    row({ id: '3', scheduled_at: local(2025, 11, 22, 9) }),
    row({ id: '4', scheduled_at: local(2025, 11, 5, 9), status: 'published' }),
  ]);
  it('lists scheduled local days of a month (published ones excluded)', () => {
    expect(scheduledDaysInMonth(posts, 2025, 10)).toEqual([20, 22]);
    expect(scheduledDaysInMonth(posts, 2025, 9)).toEqual([]);
  });
  it('overlays scheduledDays onto demo months by name and year, keeping the rest', () => {
    const months = [
      { monthName: 'November', year: 2025, scheduledDays: [1], completedDays: [2] },
      { monthName: 'December', year: 2025, scheduledDays: [9], completedDays: [3] },
    ];
    expect(withRealScheduledDays(months, posts)).toEqual([
      { monthName: 'November', year: 2025, scheduledDays: [20, 22], completedDays: [2] },
      { monthName: 'December', year: 2025, scheduledDays: [], completedDays: [3] },
    ]);
  });
});

describe('Pro screen shapes', () => {
  const posts = mapRows([
    row({ id: 'a', scheduled_at: local(2025, 11, 13, 10, 0), platform: 'youtube' }),
    row({ id: 'b', scheduled_at: local(2025, 11, 12, 18, 5), platform: 'instagram', status: 'failed' }),
    row({ id: 'c', scheduled_at: local(2025, 11, 12, 8, 0), platform: 'tiktok', status: 'published' }),
    row({ id: 'old', scheduled_at: local(2025, 11, 1, 8, 0) }),
  ]);

  it('maps the visible week to schedule items with a day index', () => {
    const keys = ['2025-11-09', '2025-11-10', '2025-11-11', '2025-11-12', '2025-11-13'];
    const items = toProScheduleItems(posts, keys);
    expect(items.map((i) => [i.id, i.dayIndex, i.time, i.period, i.badgeType, i.cancellable])).toEqual([
      ['c', 3, '8:00', 'AM', 'posted', false],
      ['b', 3, '6:05', 'PM', 'failed', false],
      ['a', 4, '10:00', 'AM', 'scheduled', true],
    ]);
    expect(items[2].platformLabel).toBe('▶ Shorts');
  });

  it('builds the upcoming queue: only future scheduled posts, padded times, day labels', () => {
    const q = toProQueueItems(posts, NOW);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ id: 'a', time: '10:00', period: 'AM', dayLabel: 'Tomorrow (Thu, Nov 13)', status: 'QUEUED', iconType: 'youtube' });
  });

  it('empty queue', () => {
    expect(toProQueueItems([], NOW)).toEqual([]);
    expect(toProScheduleItems([], ['2025-11-12'])).toEqual([]);
  });
});
