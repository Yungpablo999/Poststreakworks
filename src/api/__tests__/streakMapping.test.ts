import { addDays, mapStreakRow, watDate } from '../streakMapping';

// 2026-11-18 is a Wednesday (WAT). 12:00 UTC is 13:00 in Lagos.
const NOW = new Date('2026-11-18T12:00:00Z');
const row = (last: string | null, cur = 3, longest = 9, total = 20) => ({
  current_streak: cur,
  longest_streak: longest,
  last_post_date: last,
  total_posts: total,
});

describe('watDate', () => {
  it('uses the Lagos calendar day, not UTC', () => {
    expect(watDate(new Date('2026-11-17T23:30:00Z'))).toBe('2026-11-18'); // 00:30 in Lagos
    expect(watDate(new Date('2026-11-18T22:59:00Z'))).toBe('2026-11-18');
    expect(watDate(new Date('2026-11-18T23:00:00Z'))).toBe('2026-11-19');
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('mapStreakRow', () => {
  it('no row: a new creator starts at zero', () => {
    const s = mapStreakRow(null, NOW);
    expect(s).toMatchObject({ currentDays: 0, checkedInToday: false, countedToday: false, longestDays: 0, totalPosts: 0, todayIndex: 2 });
    expect(s.week).toEqual(Array(7).fill(false));
  });
  it('posted today: the run includes today and today counts', () => {
    const s = mapStreakRow(row('2026-11-18', 3), NOW);
    expect(s.currentDays).toBe(3);
    expect(s.checkedInToday).toBe(true);
    expect(s.countedToday).toBe(true);
    expect(s.week).toEqual([true, true, true, false, false, false, false]); // Mon, Tue, Wed
  });
  it('last post yesterday: the streak is still alive but today is open', () => {
    const s = mapStreakRow(row('2026-11-17', 2), NOW);
    expect(s.currentDays).toBe(2);
    expect(s.checkedInToday).toBe(false);
    expect(s.week).toEqual([true, true, false, false, false, false, false]); // Mon and Tue
  });
  it('a run that started last week shows only this week\'s days', () => {
    const s = mapStreakRow(row('2026-11-18', 5), NOW); // Sat..Wed
    expect(s.week).toEqual([true, true, true, false, false, false, false]);
    expect(s.currentDays).toBe(5);
  });
  it('last post before yesterday: the stored number is stale, show 0', () => {
    const s = mapStreakRow(row('2026-11-15', 7, 12, 40), NOW);
    expect(s.currentDays).toBe(0);
    expect(s.checkedInToday).toBe(false);
    expect(s.week).toEqual(Array(7).fill(false));
    expect(s.longestDays).toBe(12);
    expect(s.totalPosts).toBe(40);
  });
  it('accepts a timestamp-shaped date and ignores bad numbers', () => {
    const s = mapStreakRow({ current_streak: -2, longest_streak: null, last_post_date: '2026-11-18T00:00:00', total_posts: NaN }, NOW);
    expect(s.checkedInToday).toBe(true);
    expect(s.currentDays).toBe(0);
    expect(s.totalPosts).toBe(0);
  });
  it('week starts on Monday, also on a Sunday', () => {
    const sunday = new Date('2026-11-22T12:00:00Z');
    const s = mapStreakRow(row('2026-11-22', 2), sunday);
    expect(s.todayIndex).toBe(6);
    expect(s.week).toEqual([false, false, false, false, false, true, true]);
  });
});
