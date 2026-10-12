import { ApiError, createAuthFetch, fetchJson, type AuthFetchDeps } from '../createAuthFetch';

type Call = { url: string; init: RequestInit };

function res(status: number, body: unknown = {}): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as unknown as Response;
}

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

/** A fake backend that accepts only `validToken`, and a fake session that a refresh moves to `next`. */
function setup(opts: { token?: string | null; refreshTo?: string | null; validToken?: string } = {}) {
  let token: string | null = opts.token === undefined ? 'old' : opts.token;
  const validToken = opts.validToken ?? 'new';
  const calls: Call[] = [];
  const fetchImpl = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const auth = (init?.headers as Record<string, string>)?.Authorization;
    return auth === `Bearer ${validToken}` ? res(200, { ok: true }) : res(401, { error: 'Unauthorized' });
  });
  const refreshSession = jest.fn(async () => {
    token = opts.refreshTo === undefined ? 'new' : opts.refreshTo;
    return token;
  });
  const onUnauthorized = jest.fn();
  const deps: AuthFetchDeps = {
    baseUrl: () => 'https://api.test',
    getAccessToken: async () => token,
    refreshSession,
    onUnauthorized,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  };
  return { authFetch: createAuthFetch(deps), calls, fetchImpl, refreshSession, onUnauthorized, deps };
}

const authHeader = (c: Call) => (c.init.headers as Record<string, string>).Authorization;

describe('createAuthFetch', () => {
  it('sends the Bearer token, JSON body, and never cookies', async () => {
    const { authFetch, calls, refreshSession } = setup({ token: 'new' });
    const r = await authFetch('/api/ai/compose', { method: 'POST', body: { a: 1 } });
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.test/api/ai/compose');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.credentials).toBe('omit');
    expect(calls[0].init.body).toBe('{"a":1}');
    expect(calls[0].init.headers).toMatchObject({ Authorization: 'Bearer new', 'Content-Type': 'application/json' });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('on a 401 refreshes once and retries once with the new token', async () => {
    const { authFetch, calls, refreshSession, onUnauthorized } = setup();
    const r = await authFetch('/api/streak/update', { method: 'POST', body: {} });
    expect(r.status).toBe(200);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(calls.map(authHeader)).toEqual(['Bearer old', 'Bearer new']);
    expect(calls[1].init.body).toBe('{}');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not loop: a second 401 after the refresh is returned as is', async () => {
    const { authFetch, calls, refreshSession, onUnauthorized } = setup({ validToken: 'never' });
    const r = await authFetch('/api/x');
    expect(r.status).toBe(401);
    expect(calls).toHaveLength(2);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('returns the 401 without retrying when the refresh fails', async () => {
    const { authFetch, calls, onUnauthorized } = setup({ refreshTo: null });
    const r = await authFetch('/api/x');
    expect(r.status).toBe(401);
    expect(calls).toHaveLength(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('treats a refresh that throws like a failed refresh', async () => {
    const s = setup();
    s.refreshSession.mockRejectedValueOnce(new Error('network'));
    const r = await s.authFetch('/api/x');
    expect(r.status).toBe(401);
    expect(s.calls).toHaveLength(1);
  });

  it('parallel 401s share a single refresh', async () => {
    const s = setup();
    const gate = deferred<string | null>();
    s.refreshSession.mockImplementationOnce(() => gate.promise);
    const all = Promise.all([s.authFetch('/a'), s.authFetch('/b'), s.authFetch('/c')]);
    // let all three get their 401 and wait on the refresh
    await new Promise((r) => setTimeout(r, 0));
    s.deps.getAccessToken = async () => 'new';
    gate.resolve('new');
    const results = await all;
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(s.refreshSession).toHaveBeenCalledTimes(1);
    expect(s.fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('a 401 that arrives after another refresh finished retries without refreshing again', async () => {
    const s = setup();
    const slow = deferred<Response>();
    s.fetchImpl.mockImplementationOnce(async (url, init) => {
      s.calls.push({ url: String(url), init: init ?? {} });
      return slow.promise; // request A is slow to get its 401
    });
    const a = s.authFetch('/slow');
    await new Promise((r) => setTimeout(r, 0));
    expect((await s.authFetch('/fast')).status).toBe(200); // B: 401 -> refresh -> 200
    slow.resolve(res(401, { error: 'Unauthorized' }));
    expect((await a).status).toBe(200);
    expect(s.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('signed out: no Authorization header and no refresh', async () => {
    const { authFetch, calls, refreshSession } = setup({ token: null });
    const r = await authFetch('/api/x');
    expect(r.status).toBe(401);
    expect(authHeader(calls[0])).toBeUndefined();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('refuses methods the backend CORS does not allow', async () => {
    const { authFetch } = setup();
    await expect(authFetch('/x', { method: 'DELETE' as never })).rejects.toThrow(/GET and POST only/);
  });

  it('fails loudly when the base URL is not configured', async () => {
    const s = setup();
    s.deps.baseUrl = () => {
      throw new Error('EXPO_PUBLIC_API_URL is not set');
    };
    const authFetch = createAuthFetch(s.deps);
    await expect(authFetch('/x')).rejects.toThrow('EXPO_PUBLIC_API_URL is not set');
    expect(s.fetchImpl).not.toHaveBeenCalled();
  });
});

describe('fetchJson', () => {
  it('returns the parsed body on success and ApiError with the backend message otherwise', async () => {
    const ok = createAuthFetch({ ...setup({ token: 'new' }).deps });
    await expect(fetchJson(ok, '/x')).resolves.toEqual({ ok: true });

    const bad = setup({ token: null });
    const err = (await fetchJson(bad.authFetch, '/x').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });
});
