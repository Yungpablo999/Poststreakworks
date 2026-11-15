const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockGetSession = jest.fn();
const mockPost = jest.fn();

jest.mock('../../auth/supabase', () => ({
  getSupabase: () => ({ from: mockFrom, auth: { getSession: mockGetSession } }),
}));
jest.mock('../authFetch', () => ({
  api: { post: (...args: unknown[]) => mockPost(...args) },
}));
jest.mock('../../mascot/mascot', () => ({ react: jest.fn() }));

import { getCheckInStreak, checkInToday, hasRealCheckInStreak } from '../../data';
import { checkInAndSync, getStreakState, sendCheckIn, refreshStreak, refreshStreakIfStale, resetStreak, watDate } from '../streak';

function mockRow(data: unknown, error: { message: string } | null = null) {
  mockMaybeSingle.mockResolvedValue({ data, error });
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}
const todayRow = (cur: number) => ({ current_streak: cur, longest_streak: cur, last_post_date: watDate(new Date()), total_posts: cur });
const yesterdayRow = (cur: number) => ({
  current_streak: cur,
  longest_streak: cur,
  last_post_date: watDate(new Date(Date.now() - 86400000)),
  total_posts: cur,
});

beforeEach(() => {
  jest.clearAllMocks();
  resetStreak();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
});

describe('refreshStreak', () => {
  it('reads only the signed-in creator\'s own row and shows it on the check-in card', async () => {
    mockRow(todayRow(4));
    await refreshStreak();
    expect(mockFrom).toHaveBeenCalledWith('user_streaks');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
    expect(getStreakState()).toMatchObject({ loaded: true, loading: false, error: null });
    expect(hasRealCheckInStreak()).toBe(true);
    const s = getCheckInStreak('new');
    expect(s.currentDays).toBe(4);
    expect(s.checkedInToday).toBe(true);
  });

  it('a creator with no row yet starts at zero (not the sample 17 days)', async () => {
    mockRow(null);
    await refreshStreak();
    expect(getCheckInStreak('returning').currentDays).toBe(0);
  });

  it('keeps the sample check-in and reports an error when the read fails', async () => {
    mockRow(null, { message: 'permission denied' });
    await refreshStreak();
    expect(getStreakState().error).toBe('permission denied');
    expect(hasRealCheckInStreak()).toBe(false);
  });

  it('does not read when signed out', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await refreshStreak();
    expect(mockFrom).not.toHaveBeenCalled();
    expect(getStreakState().error).toMatch(/sign in/i);
  });

  it('resetStreak (sign-out) forgets the previous creator', async () => {
    mockRow(todayRow(6));
    await refreshStreak();
    resetStreak();
    expect(hasRealCheckInStreak()).toBe(false);
    expect(getStreakState().snapshot).toBeNull();
  });

  it('refreshStreakIfStale skips a fresh load', async () => {
    mockRow(todayRow(1));
    await refreshStreak();
    await refreshStreakIfStale(60_000);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

describe('check-in without a post', () => {
  it('fills today and cheers but never adds a streak day', async () => {
    mockRow(yesterdayRow(5));
    await refreshStreak();
    expect(getCheckInStreak('new')).toMatchObject({ currentDays: 5, checkedInToday: false });
    const after = checkInToday('new');
    expect(after.checkedInToday).toBe(true);
    expect(after.currentDays).toBe(5);
    expect(after.countedToday).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('a real post later the same day takes over from the local tap', async () => {
    mockRow(yesterdayRow(5));
    await refreshStreak();
    checkInToday('new');
    mockRow(todayRow(6));
    await refreshStreak();
    const s = getCheckInStreak('new');
    expect(s.currentDays).toBe(6);
    expect(s.countedToday).toBe(true);
  });
});

describe('check-in (separate from a post day)', () => {
  it('sendCheckIn posts to /api/checkin and never to /api/streak/update', async () => {
    mockPost.mockResolvedValue({ success: true });
    expect(await sendCheckIn()).toEqual({ ok: true });
    expect(mockPost).toHaveBeenCalledWith('/api/checkin', {});
    expect(mockPost).not.toHaveBeenCalledWith('/api/streak/update', expect.anything());
  });

  it('sendCheckIn never throws: an older backend (404) or an offline phone keeps the local cheer', async () => {
    mockPost.mockRejectedValue(new Error('Request failed with status 404'));
    expect(await sendCheckIn()).toEqual({ ok: false, error: 'Request failed with status 404' });
  });

  it('a signed-in tap cheers locally, sends the check-in once, and adds no streak day', async () => {
    mockRow(yesterdayRow(5));
    await refreshStreak();
    mockPost.mockResolvedValue({ success: true });
    checkInAndSync('new');
    checkInAndSync('new'); // second tap the same day: nothing more is sent
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/api/checkin', {});
    const s = getCheckInStreak('new');
    expect(s.checkedInToday).toBe(true);
    expect(s.countedToday).toBe(false);
    expect(s.currentDays).toBe(5);
  });

  it('signed out or demo mode stays fully local', () => {
    checkInAndSync('new');
    expect(mockPost).not.toHaveBeenCalled();
    expect(getCheckInStreak('new').checkedInToday).toBe(true);
  });

  it('a failed backend call does not throw at the tap', async () => {
    mockRow(yesterdayRow(2));
    await refreshStreak();
    mockPost.mockRejectedValue(new Error('offline'));
    expect(() => checkInAndSync('new')).not.toThrow();
    await Promise.resolve();
  });
});
