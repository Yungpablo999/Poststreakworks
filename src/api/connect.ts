import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { api, ApiError } from './authFetch';
import { PLATFORM_IDS, type PlatformId } from './platforms';

// Connect a social platform (see poststreak-web docs/connect-finalize.md).
//
//   1. START      GET  /api/auth/<platform>        -> { url }
//   2. AUTHORIZE  open `url`
//        phones: in-app auth session that returns to poststreak://connect/finalize?platform=&handle=
//        web:    the page navigates to `url`; the provider sends the browser back to
//                https://app.poststreak.app/connect/finalize?platform=&handle= (see handleWebFinalizeReturn)
//   3. FINALIZE   POST /api/connect/finalize { handle } -> { ok: true, platform }
//
// The account only counts as connected once finalize succeeds. All I/O goes through
// `ConnectDeps` so the logic is unit-tested with fakes (__tests__/connect.test.ts).

export const NATIVE_REDIRECT_URL = 'poststreak://connect/finalize';
export const WEB_RETURN_URL = 'https://app.poststreak.app/connect/finalize';
export const WEB_RETURN_PATH = '/connect/finalize';

export const CONNECT_MESSAGES = {
  disabled: 'Connecting is not available yet.',
  unfinished: 'Connecting did not finish. Please try again.',
  invalidHandle: 'That connection is not valid. Please try again.',
  expired: 'The connection expired. Please try again.',
  signedOut: 'Please sign in again.',
  signInToFinish: 'Sign in to finish connecting',
  connected: 'Account connected',
  generic: 'Could not connect. Please try again.',
} as const;

export type ConnectResult =
  | { status: 'connected'; platform: string }
  | { status: 'cancelled' }
  /** The backend's ENABLE_BEARER_CONNECT switch is off */
  | { status: 'disabled' }
  /** Web: the page is leaving for the provider; finalize runs when it returns */
  | { status: 'redirecting' }
  /** Finalize got a 401: nobody is signed in. On web the handle is kept and finalize is retried after sign-in. */
  | { status: 'needsSignIn' }
  | { status: 'error'; message: string };

export interface ConnectDeps {
  os: string;
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body: unknown) => Promise<T>;
  openAuthSession: (url: string, redirectUrl: string) => Promise<{ type: string; url?: string }>;
  /** Web: navigate the browser to the provider */
  assignLocation: (url: string) => void;
  /** Called after a successful finalize (refreshes the connected list) */
  onConnected?: () => void | Promise<void>;
}

export const defaultConnectDeps = (): ConnectDeps => ({
  os: Platform.OS,
  get: (path) => api.get(path),
  post: (path, body) => api.post(path, body),
  openAuthSession: (url, redirectUrl) => WebBrowser.openAuthSessionAsync(url, redirectUrl),
  assignLocation: (url) => window.location.assign(url),
});

export function isPlatformId(id: string): id is PlatformId {
  return (PLATFORM_IDS as readonly string[]).includes(id);
}

const errorCode = (e: unknown): string | null =>
  e instanceof ApiError && e.body && typeof e.body === 'object' && typeof (e.body as { error?: unknown }).error === 'string'
    ? (e.body as { error: string }).error
    : null;

/** Step 1. Returns the provider's authorize URL. Throws ApiError (e.g. 403 bearer_connect_disabled). */
export async function startConnect(platform: PlatformId, deps: Pick<ConnectDeps, 'get' | 'os'>): Promise<string> {
  const query = deps.os === 'web' ? `?return_to=${encodeURIComponent(WEB_RETURN_URL)}` : '';
  const { url } = await deps.get<{ url?: unknown }>(`/api/auth/${platform}${query}`);
  if (typeof url !== 'string' || !url) throw new Error(CONNECT_MESSAGES.generic);
  return url;
}

export interface FinalizeParams {
  platform: string | null;
  handle: string;
}

/**
 * Reads platform + handle from the redirect URL (query or #fragment).
 * Returns null when there is no usable handle.
 */
export function parseFinalizeUrl(url: string): FinalizeParams | null {
  const hashAt = url.indexOf('#');
  const beforeHash = hashAt === -1 ? url : url.slice(0, hashAt);
  const queryAt = beforeHash.indexOf('?');
  const query = new URLSearchParams(queryAt === -1 ? '' : beforeHash.slice(queryAt + 1));
  const fragment = new URLSearchParams(hashAt === -1 ? '' : url.slice(hashAt + 1));
  const get = (k: string) => query.get(k) ?? fragment.get(k);
  const handle = get('handle')?.trim();
  if (!handle) return null;
  return { platform: get('platform'), handle };
}

/** Step 3. Never throws: maps the backend's answers to a ConnectResult. */
export async function finalizeConnect(handle: string, deps: ConnectDeps): Promise<ConnectResult> {
  if (!handle) return { status: 'error', message: CONNECT_MESSAGES.unfinished };
  try {
    const res = await deps.post<{ ok?: boolean; platform?: string }>('/api/connect/finalize', { handle });
    if (!res || res.ok !== true) return { status: 'error', message: CONNECT_MESSAGES.generic };
    await Promise.resolve(deps.onConnected?.()).catch(() => undefined);
    return { status: 'connected', platform: typeof res.platform === 'string' ? res.platform : '' };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 404) return { status: 'error', message: CONNECT_MESSAGES.invalidHandle };
      if (e.status === 410) return { status: 'error', message: CONNECT_MESSAGES.expired };
      if (e.status === 401) return { status: 'needsSignIn' };
    }
    return { status: 'error', message: CONNECT_MESSAGES.generic };
  }
}

/** The whole flow for one platform, for the current OS. Never throws. */
export async function connectPlatform(platform: string, deps: ConnectDeps = defaultConnectDeps()): Promise<ConnectResult> {
  if (!isPlatformId(platform)) return { status: 'error', message: CONNECT_MESSAGES.generic };

  let url: string;
  try {
    url = await startConnect(platform, deps);
  } catch (e) {
    if (e instanceof ApiError && e.status === 403 && errorCode(e) === 'bearer_connect_disabled') return { status: 'disabled' };
    if (e instanceof ApiError && e.status === 401) return { status: 'error', message: CONNECT_MESSAGES.signedOut };
    return { status: 'error', message: CONNECT_MESSAGES.generic };
  }

  if (deps.os === 'web') {
    deps.assignLocation(url);
    return { status: 'redirecting' };
  }

  let result: { type: string; url?: string };
  try {
    result = await deps.openAuthSession(url, NATIVE_REDIRECT_URL);
  } catch {
    return { status: 'error', message: CONNECT_MESSAGES.generic };
  }
  if (result.type !== 'success' || !result.url) return { status: 'cancelled' };

  const params = parseFinalizeUrl(result.url);
  if (!params) return { status: 'error', message: CONNECT_MESSAGES.unfinished };
  const finalized = await finalizeConnect(params.handle, deps);
  // Phones: the in-app browser flow can't be resumed later, so a 401 is just an error
  return finalized.status === 'needsSignIn' ? { status: 'error', message: CONNECT_MESSAGES.signedOut } : finalized;
}

/** Where the web return keeps a handle that couldn't be finalized yet because nobody was signed in */
export interface PendingHandleStore {
  save: (handle: string) => void;
  load: () => string | null;
  clear: () => void;
}

const PENDING_KEY = 'poststreak.pendingConnectHandle';

/** sessionStorage (this tab only; a handle is single-use and expires in 10 minutes). Never throws. */
export const sessionPendingHandleStore: PendingHandleStore = {
  save: (handle) => {
    try {
      window.sessionStorage.setItem(PENDING_KEY, handle);
    } catch {}
  },
  load: () => {
    try {
      return window.sessionStorage.getItem(PENDING_KEY);
    } catch {
      return null;
    }
  },
  clear: () => {
    try {
      window.sessionStorage.removeItem(PENDING_KEY);
    } catch {}
  },
};

export interface WebLocationDeps extends ConnectDeps {
  pathname: string;
  search: string;
  hash?: string;
  /** history.replaceState(null, '', url) */
  replaceUrl: (url: string) => void;
  pending: PendingHandleStore;
}

/**
 * Web startup: if the page was opened at /connect/finalize?platform=&handle=, finalize it.
 * Returns null when this is not the finalize return (nothing was done).
 * The URL is cleaned FIRST so a reload (or a second call) can never finalize twice.
 */
export async function handleWebFinalizeReturn(deps: WebLocationDeps): Promise<ConnectResult | null> {
  if (deps.pathname.replace(/\/+$/, '') !== WEB_RETURN_PATH) return null;
  deps.replaceUrl('/');
  const params = parseFinalizeUrl(`${deps.pathname}${deps.search}${deps.hash ?? ''}`);
  if (!params) return { status: 'error', message: CONNECT_MESSAGES.unfinished };
  return finalizeKeepingHandle(params.handle, deps);
}

/**
 * Finalizes; on a 401 the handle is kept (not dropped) so it can be finished after sign-in,
 * otherwise it is cleared.
 */
async function finalizeKeepingHandle(handle: string, deps: ConnectDeps & { pending: PendingHandleStore }): Promise<ConnectResult> {
  const result = await finalizeConnect(handle, deps);
  if (result.status === 'needsSignIn') deps.pending.save(handle);
  else deps.pending.clear();
  return result;
}

/**
 * Web: after sign-in, finish a connection that was kept because finalize got a 401.
 * Returns null when nothing is waiting.
 */
export async function resumePendingFinalize(deps: ConnectDeps & { pending: PendingHandleStore }): Promise<ConnectResult | null> {
  const handle = deps.pending.load();
  if (!handle) return null;
  return finalizeKeepingHandle(handle, deps);
}

let webReturnStarted = false;
/** Runs handleWebFinalizeReturn once per page load against the real window. Resolves null off web. */
export function runWebFinalizeReturnOnce(onConnected: () => void | Promise<void>): Promise<ConnectResult | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || webReturnStarted) return Promise.resolve(null);
  webReturnStarted = true;
  return handleWebFinalizeReturn({
    ...defaultConnectDeps(),
    onConnected,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    replaceUrl: (url) => window.history.replaceState(null, '', url),
    pending: sessionPendingHandleStore,
  });
}

/** Web: finishes a kept handle once the creator is signed in. Resolves null off web or when nothing waits. */
export function resumePendingFinalizeOnWeb(onConnected: () => void | Promise<void>): Promise<ConnectResult | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return Promise.resolve(null);
  return resumePendingFinalize({ ...defaultConnectDeps(), onConnected, pending: sessionPendingHandleStore });
}

/** The toast text for a web finalize result, or null to say nothing */
export function webResultMessage(result: ConnectResult | null): string | null {
  if (!result) return null;
  if (result.status === 'needsSignIn') return CONNECT_MESSAGES.signInToFinish;
  if (result.status === 'connected') return CONNECT_MESSAGES.connected;
  if (result.status === 'error') return result.message;
  return null;
}
