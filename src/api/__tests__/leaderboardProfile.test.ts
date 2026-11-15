import { ApiError } from '../authFetch';
import {
  NOT_READY_MESSAGE,
  OFF_PROFILE,
  PROFILE_MESSAGES,
  describeProfileError,
  getLeaderboardProfile,
  saveLeaderboardProfile,
  toProfile,
  type ProfileApi,
} from '../leaderboardProfile';

describe('toProfile', () => {
  it('is hidden with no name by default and for bad input', () => {
    expect(toProfile(null)).toEqual(OFF_PROFILE);
    expect(toProfile({})).toEqual(OFF_PROFILE);
    expect(toProfile('x')).toEqual(OFF_PROFILE);
  });
  it('shows only when opted in AND a name is set', () => {
    expect(toProfile({ display_name: 'Ada', show_on_leaderboard: true })).toEqual({ displayName: 'Ada', show: true });
    expect(toProfile({ display_name: 'Ada', show_on_leaderboard: false })).toEqual({ displayName: 'Ada', show: false });
    expect(toProfile({ display_name: null, show_on_leaderboard: true })).toEqual({ displayName: null, show: false });
    expect(toProfile({ display_name: '  ', show_on_leaderboard: true })).toEqual({ displayName: null, show: false });
    expect(toProfile({ display_name: 'Ada', show_on_leaderboard: 'true' })).toEqual({ displayName: 'Ada', show: false });
  });
});

describe('wire contract with /api/leaderboard/profile', () => {
  const make = (reply: unknown) => {
    const calls: { m: string; path: string; body?: unknown }[] = [];
    const client: ProfileApi = {
      get: async <T,>(path: string) => { calls.push({ m: 'GET', path }); return reply as T; },
      post: async <T,>(path: string, body?: unknown) => { calls.push({ m: 'POST', path, body }); return reply as T; },
    };
    return { client, calls };
  };
  it('GETs the profile', async () => {
    const { client, calls } = make({ display_name: 'Ada', show_on_leaderboard: true });
    expect(await getLeaderboardProfile(client)).toEqual({ displayName: 'Ada', show: true });
    expect(calls).toEqual([{ m: 'GET', path: '/api/leaderboard/profile' }]);
  });
  it('POSTs only what changed, in the backend field names', async () => {
    const a = make({ display_name: 'Ada', show_on_leaderboard: false });
    await saveLeaderboardProfile({ displayName: 'Ada' }, a.client);
    expect(a.calls[0]).toEqual({ m: 'POST', path: '/api/leaderboard/profile', body: { display_name: 'Ada' } });
    const b = make({ display_name: 'Ada', show_on_leaderboard: true });
    expect(await saveLeaderboardProfile({ show: true }, b.client)).toEqual({ displayName: 'Ada', show: true });
    expect(b.calls[0].body).toEqual({ show_on_leaderboard: true });
    const c = make({ display_name: null, show_on_leaderboard: false });
    await saveLeaderboardProfile({ displayName: null }, c.client);
    expect(c.calls[0].body).toEqual({ display_name: null });
  });
});

describe('describeProfileError', () => {
  it('maps backend answers to one sentence', () => {
    expect(describeProfileError(new ApiError(401, {}))).toBe(PROFILE_MESSAGES.signedOut);
    expect(describeProfileError(new ApiError(503, { error: 'x' }))).toBe(NOT_READY_MESSAGE);
    expect(describeProfileError(new ApiError(400, { error: 'Display name cannot contain a link.' }))).toBe('Display name cannot contain a link.');
    expect(describeProfileError(new ApiError(500, {}))).toBe(PROFILE_MESSAGES.generic);
    expect(describeProfileError(new Error('Network request failed'))).toBe(PROFILE_MESSAGES.network);
  });
});
