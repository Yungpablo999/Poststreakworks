import { BACKEND } from '../config/backend';
import type { ApiErrorBody } from '../../frontend/shared/types/phase1';
import { accessToken, refreshAccessToken, getSessionState } from './session';

// Calls to the PostStreak API (backend/apps/web, /api/v1/*), signed with the
// creator's session token. Never throws: every call returns { ok, … } so a
// failure is something a screen decides how to show, not a crash.

export interface ApiFailure {
  ok: false;
  /** 0 = never reached the server (offline, timed out). */
  status: number;
  message: string;
  code?: ApiErrorBody['code'];
  upsell?: ApiErrorBody['upsell'];
  offline: boolean;
}
export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

const TIMEOUT_MS = 20_000;

async function call<T>(method: string, path: string, body: unknown, canRetry: boolean): Promise<ApiResult<T>> {
  const token = await accessToken();
  if (!token) return { ok: false, status: 401, message: 'Please sign in again.', offline: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND.apiUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as (Partial<ApiErrorBody> & Record<string, unknown>) | null;

    if (res.ok) return { ok: true, data: json as T };

    // A refused token is usually just an expired one: refresh once and retry.
    if (res.status === 401 && canRetry && (await refreshAccessToken())) {
      return call<T>(method, path, body, false);
    }
    return {
      ok: false,
      status: res.status,
      message: typeof json?.message === 'string' ? json.message : 'Something went wrong. Please try again.',
      code: json?.code,
      upsell: json?.upsell,
      offline: false,
    };
  } catch {
    return { ok: false, status: 0, message: 'Can’t reach PostStreak right now.', offline: true };
  } finally {
    clearTimeout(timer);
  }
}

/** For the few things a visitor with no account may ask for (the "Your plan" ideas). No token is sent. */
export async function publicGet<T>(path: string): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND.apiUrl}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const json = (await res.json().catch(() => null)) as (Partial<ApiErrorBody> & Record<string, unknown>) | null;
    if (res.ok) return { ok: true, data: json as T };
    return { ok: false, status: res.status, message: typeof json?.message === 'string' ? json.message : 'Something went wrong. Please try again.', code: json?.code, upsell: json?.upsell, offline: false };
  } catch {
    return { ok: false, status: 0, message: 'Can’t reach PostStreak right now.', offline: true };
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => call<T>('GET', path, undefined, true),
  post: <T>(path: string, body?: unknown) => call<T>('POST', path, body ?? {}, true),
  put: <T>(path: string, body?: unknown) => call<T>('PUT', path, body ?? {}, true),
  delete: <T>(path: string) => call<T>('DELETE', path, undefined, true),
};

/** True when a signed-in creator can use the API right now. */
export const backendReady = () => BACKEND.enabled && getSessionState().status === 'signedIn';
