// Calls to the PostStreak backend with the creator's Supabase access token.
//
// - Every request carries `Authorization: Bearer <access token>` and never cookies
//   (the backend's CORS allows no credentials).
// - Only GET and POST: the backend's CORS allows no other methods.
// - On a 401 the session is refreshed ONCE and the request retried ONCE.
//   The refresh is single-flight: when several requests get a 401 at the same
//   time they all wait for the same refresh instead of each starting their own.
//   A request whose 401 arrives after another request's refresh has finished
//   simply retries with the new token.
//
// This file has no app imports so it can be unit-tested with fakes
// (see __tests__/createAuthFetch.test.ts); src/api/authFetch.ts wires it to Supabase.

export type ApiMethod = 'GET' | 'POST';

export interface AuthFetchDeps {
  /** Backend base URL with no trailing slash. Called per request; may throw if unconfigured. */
  baseUrl: () => string;
  /** The current access token, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** Refreshes the session; resolves to the new access token, or null if it could not refresh. */
  refreshSession: () => Promise<string | null>;
  /** Called when the backend still refuses the request after a refresh (or the refresh failed). */
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export interface AuthFetchOptions {
  method?: ApiMethod;
  /** Sent as JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export type AuthFetch = (path: string, options?: AuthFetchOptions) => Promise<Response>;

export function createAuthFetch(deps: AuthFetchDeps): AuthFetch {
  const doFetch: typeof fetch = deps.fetchImpl ?? ((...args) => fetch(...args));
  let inFlightRefresh: Promise<string | null> | null = null;
  // Bumped each time a refresh finishes, so a request can tell whether the session
  // was refreshed after it was sent (and then retry without refreshing again).
  let refreshCount = 0;

  function refreshOnce(): Promise<string | null> {
    if (!inFlightRefresh) {
      inFlightRefresh = deps
        .refreshSession()
        .catch(() => null)
        .finally(() => {
          refreshCount++;
          inFlightRefresh = null;
        });
    }
    return inFlightRefresh;
  }

  return async function authFetch(path, options = {}) {
    const method = options.method ?? 'GET';
    if (method !== 'GET' && method !== 'POST') {
      throw new Error(`authFetch: ${method as string} is not allowed by the backend (GET and POST only)`);
    }
    const url = `${deps.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);

    const send = (token: string | null) => {
      const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (token) headers.Authorization = `Bearer ${token}`;
      return doFetch(url, { method, headers, body, credentials: 'omit', signal: options.signal });
    };

    const refreshCountAtSend = refreshCount;
    const sentToken = await deps.getAccessToken();
    const first = await send(sentToken);
    if (first.status !== 401) return first;
    if (!sentToken) return first; // signed out: there is no session to refresh

    // No await between these checks and refreshOnce(), so parallel 401s share one refresh.
    let token: string | null;
    if (inFlightRefresh) {
      token = await inFlightRefresh; // join the refresh already running
    } else if (refreshCount !== refreshCountAtSend) {
      token = await deps.getAccessToken(); // refreshed after this was sent: just retry
    } else {
      token = await refreshOnce();
    }
    if (!token) {
      deps.onUnauthorized?.();
      return first;
    }

    const retry = await send(token);
    if (retry.status === 401) deps.onUnauthorized?.();
    return retry;
  };
}

/** A non-2xx reply from the backend. `body` is the parsed JSON, if any (e.g. {"error":"Unauthorized"}). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    const msg =
      body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed with status ${status}`;
    super(msg);
    this.name = 'ApiError';
  }
}

/** authFetch + JSON parsing: resolves to the parsed body, rejects with ApiError on a non-2xx status. */
export async function fetchJson<T>(authFetch: AuthFetch, path: string, options?: AuthFetchOptions): Promise<T> {
  const res = await authFetch(path, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
