const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('../authFetch', () => ({
  ApiError: jest.requireActual('../createAuthFetch').ApiError,
  api: { get: (...a: unknown[]) => mockGet(...a), post: (...a: unknown[]) => mockPost(...a) },
}));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));

import { ApiError } from '../authFetch';
import {
  CONNECT_MESSAGES,
  NATIVE_REDIRECT_URL,
  WEB_RETURN_URL,
  connectPlatform,
  finalizeConnect,
  handleWebFinalizeReturn,
  parseFinalizeUrl,
  startConnect,
  type ConnectDeps,
  type WebLocationDeps,
} from '../connect';

function makeDeps(over: Partial<ConnectDeps> = {}): ConnectDeps & { onConnected: jest.Mock; assignLocation: jest.Mock; openAuthSession: jest.Mock } {
  return {
    os: 'ios',
    get: mockGet,
    post: mockPost,
    openAuthSession: jest.fn(),
    assignLocation: jest.fn(),
    onConnected: jest.fn(),
    ...over,
  } as never;
}

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('parseFinalizeUrl', () => {
  it('reads platform and handle from the query', () => {
    expect(parseFinalizeUrl('poststreak://connect/finalize?platform=threads&handle=abc123')).toEqual({ platform: 'threads', handle: 'abc123' });
    expect(parseFinalizeUrl('https://app.poststreak.app/connect/finalize?handle=h1&platform=youtube')).toEqual({ platform: 'youtube', handle: 'h1' });
  });
  it('also reads a #fragment', () => {
    expect(parseFinalizeUrl('poststreak://connect/finalize#platform=tiktok&handle=zz')).toEqual({ platform: 'tiktok', handle: 'zz' });
  });
  it('returns null when the handle is missing or blank', () => {
    expect(parseFinalizeUrl('poststreak://connect/finalize?platform=threads')).toBeNull();
    expect(parseFinalizeUrl('poststreak://connect/finalize?platform=threads&handle=')).toBeNull();
    expect(parseFinalizeUrl('poststreak://connect/finalize?handle=%20')).toBeNull();
    expect(parseFinalizeUrl('')).toBeNull();
  });
});

describe('startConnect', () => {
  it('sends no return_to on phones', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    await expect(startConnect('linkedin', { os: 'ios', get: mockGet })).resolves.toBe('https://p.test/auth');
    expect(mockGet).toHaveBeenCalledWith('/api/auth/linkedin');
  });
  it('sends the exact return_to on web', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    await startConnect('facebook', { os: 'web', get: mockGet });
    expect(mockGet).toHaveBeenCalledWith(`/api/auth/facebook?return_to=${encodeURIComponent(WEB_RETURN_URL)}`);
    expect(WEB_RETURN_URL).toBe('https://app.poststreak.app/connect/finalize');
  });
  it('rejects a reply without a url', async () => {
    mockGet.mockResolvedValue({});
    await expect(startConnect('threads', { os: 'ios', get: mockGet })).rejects.toThrow();
  });
});

describe('finalizeConnect', () => {
  it('connects on 200 and then calls onConnected', async () => {
    mockPost.mockResolvedValue({ ok: true, platform: 'threads' });
    const deps = makeDeps();
    await expect(finalizeConnect('h', deps)).resolves.toEqual({ status: 'connected', platform: 'threads' });
    expect(mockPost).toHaveBeenCalledWith('/api/connect/finalize', { handle: 'h' });
    expect(deps.onConnected).toHaveBeenCalledTimes(1);
  });
  it.each([
    [404, { error: 'invalid_handle' }, CONNECT_MESSAGES.invalidHandle],
    [410, { error: 'expired' }, CONNECT_MESSAGES.expired],
    [401, { error: 'Unauthorized' }, CONNECT_MESSAGES.signedOut],
    [500, {}, CONNECT_MESSAGES.generic],
  ])('maps %s to a message', async (status, body, message) => {
    mockPost.mockRejectedValue(new ApiError(status, body));
    const deps = makeDeps();
    await expect(finalizeConnect('h', deps)).resolves.toEqual({ status: 'error', message });
    expect(deps.onConnected).not.toHaveBeenCalled();
  });
  it('treats a network failure and an empty handle as errors without throwing', async () => {
    mockPost.mockRejectedValue(new Error('offline'));
    await expect(finalizeConnect('h', makeDeps())).resolves.toEqual({ status: 'error', message: CONNECT_MESSAGES.generic });
    mockPost.mockClear();
    await expect(finalizeConnect('', makeDeps())).resolves.toEqual({ status: 'error', message: CONNECT_MESSAGES.unfinished });
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('does not report a connect when ok is not true', async () => {
    mockPost.mockResolvedValue({ ok: false });
    await expect(finalizeConnect('h', makeDeps())).resolves.toMatchObject({ status: 'error' });
  });
});

describe('connectPlatform (phone)', () => {
  it('runs start, auth session, finalize', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    mockPost.mockResolvedValue({ ok: true, platform: 'instagram' });
    const deps = makeDeps();
    deps.openAuthSession.mockResolvedValue({ type: 'success', url: 'poststreak://connect/finalize?platform=instagram&handle=hh' });
    await expect(connectPlatform('instagram', deps)).resolves.toEqual({ status: 'connected', platform: 'instagram' });
    expect(deps.openAuthSession).toHaveBeenCalledWith('https://p.test/auth', NATIVE_REDIRECT_URL);
    expect(mockPost).toHaveBeenCalledWith('/api/connect/finalize', { handle: 'hh' });
    expect(deps.assignLocation).not.toHaveBeenCalled();
  });
  it.each(['cancel', 'dismiss', 'locked'])('reports %s as cancelled and finalizes nothing', async (type) => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    const deps = makeDeps();
    deps.openAuthSession.mockResolvedValue({ type });
    await expect(connectPlatform('threads', deps)).resolves.toEqual({ status: 'cancelled' });
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('errors when the redirect has no handle', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    const deps = makeDeps();
    deps.openAuthSession.mockResolvedValue({ type: 'success', url: 'poststreak://connect/finalize?platform=threads' });
    await expect(connectPlatform('threads', deps)).resolves.toEqual({ status: 'error', message: CONNECT_MESSAGES.unfinished });
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('reports bearer_connect_disabled (403) as disabled and opens nothing', async () => {
    mockGet.mockRejectedValue(new ApiError(403, { error: 'bearer_connect_disabled' }));
    const deps = makeDeps();
    await expect(connectPlatform('tiktok', deps)).resolves.toEqual({ status: 'disabled' });
    expect(deps.openAuthSession).not.toHaveBeenCalled();
  });
  it('does not mistake another 403 for disabled', async () => {
    mockGet.mockRejectedValue(new ApiError(403, { error: 'platform_disabled' }));
    await expect(connectPlatform('tiktok', makeDeps())).resolves.toMatchObject({ status: 'error' });
  });
  it('maps a 410 from finalize to the expired message', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    mockPost.mockRejectedValue(new ApiError(410, { error: 'expired' }));
    const deps = makeDeps();
    deps.openAuthSession.mockResolvedValue({ type: 'success', url: 'poststreak://connect/finalize?handle=old' });
    await expect(connectPlatform('youtube', deps)).resolves.toEqual({ status: 'error', message: CONNECT_MESSAGES.expired });
  });
  it('turns a thrown auth session into an error', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    const deps = makeDeps();
    deps.openAuthSession.mockRejectedValue(new Error('boom'));
    await expect(connectPlatform('youtube', deps)).resolves.toMatchObject({ status: 'error' });
  });
  it('rejects an unknown platform id without any request', async () => {
    await expect(connectPlatform('x', makeDeps())).resolves.toMatchObject({ status: 'error' });
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('connectPlatform (web)', () => {
  it('starts with return_to and navigates the browser instead of opening an auth session', async () => {
    mockGet.mockResolvedValue({ url: 'https://p.test/auth' });
    const deps = makeDeps({ os: 'web' });
    await expect(connectPlatform('linkedin', deps)).resolves.toEqual({ status: 'redirecting' });
    expect(mockGet).toHaveBeenCalledWith(`/api/auth/linkedin?return_to=${encodeURIComponent(WEB_RETURN_URL)}`);
    expect(deps.assignLocation).toHaveBeenCalledWith('https://p.test/auth');
    expect(deps.openAuthSession).not.toHaveBeenCalled();
  });
  it('also reports disabled on web without navigating', async () => {
    mockGet.mockRejectedValue(new ApiError(403, { error: 'bearer_connect_disabled' }));
    const deps = makeDeps({ os: 'web' });
    await expect(connectPlatform('linkedin', deps)).resolves.toEqual({ status: 'disabled' });
    expect(deps.assignLocation).not.toHaveBeenCalled();
  });
});

describe('handleWebFinalizeReturn', () => {
  function webDeps(pathname: string, search: string, hash = ''): WebLocationDeps & { order: string[]; replaceUrl: jest.Mock } {
    const order: string[] = [];
    const base = makeDeps({ os: 'web' });
    const replaceUrl = jest.fn(() => order.push('replace'));
    mockPost.mockImplementation(async () => {
      order.push('finalize');
      return { ok: true, platform: 'threads' };
    });
    return { ...base, pathname, search, hash, replaceUrl, order };
  }

  it('ignores any other path and touches nothing', async () => {
    const deps = webDeps('/', '?handle=h');
    await expect(handleWebFinalizeReturn(deps)).resolves.toBeNull();
    expect(deps.replaceUrl).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('cleans the URL BEFORE finalizing, so a reload cannot finalize twice', async () => {
    const deps = webDeps('/connect/finalize', '?platform=threads&handle=h1');
    await expect(handleWebFinalizeReturn(deps)).resolves.toEqual({ status: 'connected', platform: 'threads' });
    expect(deps.order).toEqual(['replace', 'finalize']);
    expect(deps.replaceUrl).toHaveBeenCalledWith('/');
    expect(mockPost).toHaveBeenCalledWith('/api/connect/finalize', { handle: 'h1' });
    expect(deps.onConnected).toHaveBeenCalled();
  });
  it('still cleans the URL when finalize fails (expired), without retrying', async () => {
    const deps = webDeps('/connect/finalize', '?platform=threads&handle=h1');
    mockPost.mockReset();
    mockPost.mockRejectedValue(new ApiError(410, { error: 'expired' }));
    await expect(handleWebFinalizeReturn(deps)).resolves.toEqual({ status: 'error', message: CONNECT_MESSAGES.expired });
    expect(deps.replaceUrl).toHaveBeenCalledWith('/');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
  it('errors (and cleans the URL) when the handle is missing', async () => {
    const deps = webDeps('/connect/finalize/', '?platform=threads');
    await expect(handleWebFinalizeReturn(deps)).resolves.toEqual({ status: 'error', message: CONNECT_MESSAGES.unfinished });
    expect(deps.replaceUrl).toHaveBeenCalledWith('/');
    expect(mockPost).not.toHaveBeenCalled();
  });
  it('accepts params in the #fragment', async () => {
    const deps = webDeps('/connect/finalize', '', '#platform=threads&handle=h9');
    await handleWebFinalizeReturn(deps);
    expect(mockPost).toHaveBeenCalledWith('/api/connect/finalize', { handle: 'h9' });
  });
});
