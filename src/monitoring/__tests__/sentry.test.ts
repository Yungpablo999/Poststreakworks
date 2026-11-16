import { buildEvent, captureException, parseDsn, scrubEvent, scrubString, scrubUrl } from '../sentry';

const DSN = 'https://abc123key@o1.ingest.sentry.io/4507';
const mkFetch = (impl: (u: string, i: any) => any) => impl as unknown as typeof fetch;

describe('scrubbing', () => {
  it('redacts emails, bearer tokens, JWTs and secret keys', () => {
    const s = scrubString('a.b+c@example.com Bearer abc.def-123 eyJhbGciOi.eyJzdWIiOi.sigpart sk_live_ABCDEFGHIJKLMNOP');
    expect(s).not.toMatch(/example\.com|abc\.def|eyJ|sk_live/);
    expect(s).toMatch(/\[redacted-email\]/);
  });
  it('drops query strings', () => {
    expect(scrubUrl('/x?token=secret&code=1')).toBe('/x');
  });
  it('removes user, request, breadcrumbs and extra', () => {
    const ev: any = { ...buildEvent(new Error('boom me@x.io')), user: { email: 'me@x.io' }, request: { cookies: 'a=b' }, extra: { a: 1 }, breadcrumbs: [1] };
    const out: any = scrubEvent(ev);
    for (const k of ['user', 'request', 'extra', 'breadcrumbs']) expect(out[k]).toBeUndefined();
    expect(JSON.stringify(out)).not.toMatch(/me@x\.io/);
  });
});

describe('transport', () => {
  it('parses a DSN and rejects junk', () => {
    expect(parseDsn(DSN)).toEqual({ endpoint: 'https://o1.ingest.sentry.io/api/4507/envelope/', key: 'abc123key' });
    for (const bad of [undefined, '', 'nope', 'https://o1.ingest.sentry.io/x']) expect(parseDsn(bad)).toBeNull();
  });
  it('sends nothing without a DSN', async () => {
    const fetchFn = jest.fn();
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    expect(await captureException(new Error('x'), 'app', { fetchFn: fetchFn as any })).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });
  it('sends a scrubbed envelope with a DSN', async () => {
    let body = '';
    const fetchFn = mkFetch(async (_u, init) => { body = String(init.body); return { ok: true }; });
    expect(await captureException(new Error('Bearer abc123 for me@x.io'), 'app?code=1', { dsn: DSN, fetchFn })).toBe(true);
    expect(body).not.toMatch(/me@x\.io|abc123 |code=1/);
  });
  it('never throws when the network fails', async () => {
    const fetchFn = mkFetch(async () => { throw new Error('down'); });
    expect(await captureException(new Error('x'), 'app', { dsn: DSN, fetchFn })).toBe(false);
  });
});
