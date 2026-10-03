import type { TestAccount } from '../../frontend/shared/types/phase1';
import { BACKEND } from '../config/backend';
import { startSessionFromTokens, type AuthOutcome } from './session';

// Local testing: the four seeded accounts (free/Pro × new/existing) on the sign-in screen.
// The server answers only when it runs on the same machine as its database with DEV_LOGIN=true;
// anywhere else both calls come back "not found" and the screen shows nothing extra.

const TIMEOUT_MS = 10_000;

async function request(method: 'GET' | 'POST', body?: unknown): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BACKEND.apiUrl}/api/v1/dev/login`, {
      method,
      signal: controller.signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The accounts to offer, or none when this build or this server isn't set up for them. */
export async function listTestAccounts(): Promise<TestAccount[]> {
  if (!BACKEND.enabled || !BACKEND.testAccounts) return [];
  const res = await request('GET');
  if (!res?.ok) return [];
  const json = (await res.json().catch(() => null)) as { accounts?: TestAccount[] } | null;
  return Array.isArray(json?.accounts) ? json.accounts : [];
}

/** Signs in as that test account: the same real session an emailed code would give. */
export async function signInAsTestAccount(email: string): Promise<AuthOutcome> {
  const res = await request('POST', { email });
  if (!res) return { ok: false, kind: 'offline', message: 'Can’t reach PostStreak right now. Check your connection and try again.' };
  const json = (await res.json().catch(() => null)) as { access_token?: string; refresh_token?: string; message?: string } | null;
  if (!res.ok || !json?.access_token || !json.refresh_token) {
    return { ok: false, kind: 'other', message: json?.message ?? 'That test account isn’t available.' };
  }
  return startSessionFromTokens({ access_token: json.access_token, refresh_token: json.refresh_token });
}
