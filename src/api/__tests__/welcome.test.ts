import { isNewAccount, requestWelcome, NEW_ACCOUNT_WINDOW_MS } from '../welcome';

const NOW = Date.parse('2026-11-16T12:00:00Z');
const user = (ageMs: number | null) => ({ id: 'u1', created_at: ageMs === null ? undefined : new Date(NOW - ageMs).toISOString() });
const ok = (welcomed: boolean) => jest.fn(async () => ({ success: true, statusCode: 200, data: { welcomed } }));

describe('isNewAccount', () => {
  it('is true within a day and false after, or when unknown', () => {
    expect(isNewAccount(new Date(NOW - 60_000).toISOString(), NOW)).toBe(true);
    expect(isNewAccount(new Date(NOW - NEW_ACCOUNT_WINDOW_MS).toISOString(), NOW)).toBe(true);
    expect(isNewAccount(new Date(NOW - NEW_ACCOUNT_WINDOW_MS - 1).toISOString(), NOW)).toBe(false);
    for (const v of [undefined, null, '', 'not a date']) expect(isNewAccount(v, NOW)).toBe(false);
  });
});

describe('requestWelcome', () => {
  it('asks the backend for a new account and reports sent', async () => {
    const post = ok(true);
    expect(await requestWelcome(user(60_000), { post, done: new Set(), now: NOW })).toBe('sent');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('reports already when the backend had welcomed them', async () => {
    expect(await requestWelcome(user(60_000), { post: ok(false), done: new Set(), now: NOW })).toBe('already');
  });

  it('does not call the backend for an existing account or an unknown age', async () => {
    const post = ok(true);
    expect(await requestWelcome(user(NEW_ACCOUNT_WINDOW_MS + 1000), { post, done: new Set(), now: NOW })).toBe('skipped');
    expect(await requestWelcome(user(null), { post, done: new Set(), now: NOW })).toBe('skipped');
    expect(post).not.toHaveBeenCalled();
  });

  it('asks once per session: a second sign-in event does not call again', async () => {
    const post = ok(true);
    const done = new Set<string>();
    await requestWelcome(user(60_000), { post, done, now: NOW });
    expect(await requestWelcome(user(60_000), { post, done, now: NOW })).toBe('skipped');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('lets the next sign-in try again after a failure (401, 404, 500, no network, a throw)', async () => {
    for (const post of [
      jest.fn(async () => ({ success: false, statusCode: 401 })),
      jest.fn(async () => ({ success: false, statusCode: 404 })),
      jest.fn(async () => ({ success: false, statusCode: 500 })),
      jest.fn(async () => ({ success: false, statusCode: 0 })),
      jest.fn(async () => { throw new Error('offline'); }),
    ]) {
      const done = new Set<string>();
      expect(await requestWelcome(user(60_000), { post, done, now: NOW })).toBe('retry');
      expect(done.has('u1')).toBe(false);
    }
  });
});
