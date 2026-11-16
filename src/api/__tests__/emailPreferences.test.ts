import { ApiError } from '../authFetch';
import {
  EMAIL_PREF_MESSAGES,
  describeEmailPrefError,
  getProductEmails,
  setProductEmails,
  toProductEmails,
  type EmailPreferencesApi,
} from '../emailPreferences';

const make = (reply: unknown) => {
  const calls: { m: string; path: string; body?: unknown }[] = [];
  const client: EmailPreferencesApi = {
    get: async <T,>(path: string) => { calls.push({ m: 'GET', path }); return reply as T; },
    post: async <T,>(path: string, body?: unknown) => { calls.push({ m: 'POST', path, body }); return reply as T; },
  };
  return { client, calls };
};

describe('toProductEmails', () => {
  it('is on unless the backend clearly says opted out', () => {
    expect(toProductEmails({ marketingOptOut: true })).toBe(false);
    expect(toProductEmails({ marketingOptOut: false })).toBe(true);
    expect(toProductEmails(null)).toBe(true);
    expect(toProductEmails({})).toBe(true);
    expect(toProductEmails({ marketingOptOut: 'true' })).toBe(true);
  });
});

describe('wire contract with /api/email/preferences', () => {
  it('GETs the flag and inverts it for the toggle', async () => {
    const { client, calls } = make({ marketingOptOut: true });
    expect(await getProductEmails(client)).toBe(false);
    expect(calls).toEqual([{ m: 'GET', path: '/api/email/preferences' }]);
  });
  it('POSTs marketingOptOut as the opposite of the toggle', async () => {
    const off = make({ marketingOptOut: true });
    expect(await setProductEmails(false, off.client)).toBe(false);
    expect(off.calls[0]).toEqual({ m: 'POST', path: '/api/email/preferences', body: { marketingOptOut: true } });
    const on = make({ marketingOptOut: false });
    expect(await setProductEmails(true, on.client)).toBe(true);
    expect(on.calls[0].body).toEqual({ marketingOptOut: false });
  });
});

describe('describeEmailPrefError', () => {
  it('maps failures to one sentence', () => {
    expect(describeEmailPrefError(new ApiError(401, {}))).toBe(EMAIL_PREF_MESSAGES.signedOut);
    expect(describeEmailPrefError(new ApiError(500, {}))).toBe(EMAIL_PREF_MESSAGES.generic);
    expect(describeEmailPrefError(new Error('x'))).toBe(EMAIL_PREF_MESSAGES.network);
  });
});
