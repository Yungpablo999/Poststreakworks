import { useSyncExternalStore } from 'react';
import { Linking, Platform } from 'react-native';
import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type {
  ConnectedAccount,
  TikTokAuthorizeResult,
  TikTokCallbackResult,
  TikTokSyncResult,
} from '../../frontend/shared/types/phase1';
import { BACKEND } from '../config/backend';
import { api } from './api';

// The creator's connected accounts, and connecting TikTok for real.
//
// TikTok signs the creator in on TikTok's own page, so the app only ever holds
// a short-lived code, never a password and never the long-lived tokens (those
// stay on the server, sealed). The round trip:
//
//   connectTikTok()  → API makes a single-use "state" tied to this creator and
//                      returns TikTok's sign-in address
//                    → the creator approves on TikTok
//                    → TikTok redirects to <app>/auth/tiktok/callback?code=…&state=…
//   web:   the app loads on that address and calls completeTikTokConnect(code, state)
//   phone: that page hands code + state to the app (poststreak://tiktok?…) and the
//          app calls completeTikTokConnect

let accounts: ConnectedAccount[] = [];
const listeners = new Set<() => void>();
const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const get = () => accounts;

export function setAccounts(next: ConnectedAccount[]): void {
  accounts = next;
  listeners.forEach((l) => l());
}
export const getAccounts = () => accounts;
export const subscribeToAccounts = subscribe;
export function useAccounts(): ConnectedAccount[] {
  return useSyncExternalStore(subscribe, get, get);
}
export const findAccount = (platform: string) => accounts.find((a) => a.platform === platform);

export async function refreshAccounts(): Promise<void> {
  const res = await api.get<ConnectedAccount[]>(API_ROUTES.PLATFORMS.ACCOUNTS);
  if (res.ok) setAccounts(res.data);
}

export type ConnectOutcome = { ok: true } | { ok: false; message: string };

/** Starts connecting TikTok. On the web the page leaves for TikTok, so a resolved `ok` means "on its way". */
export async function connectTikTok(): Promise<ConnectOutcome> {
  const client = Platform.OS === 'web' ? 'web' : 'mobile';
  const res = await api.post<TikTokAuthorizeResult>(API_ROUTES.PLATFORMS.TIKTOK_AUTHORIZE, { client });
  if (!res.ok) {
    return {
      ok: false,
      message: res.status === 503 ? 'TikTok isn’t set up yet. Please try again later.' : res.offline ? res.message : 'Couldn’t start the TikTok connection. Please try again.',
    };
  }
  try {
    if (Platform.OS === 'web') window.location.assign(res.data.url);
    else await Linking.openURL(res.data.url);
    return { ok: true };
  } catch {
    return { ok: false, message: 'Couldn’t open TikTok. Please try again.' };
  }
}

/** What TikTok sent back, passed on as-is. The API checks the state is this creator's and unused. */
export async function completeTikTokConnect(code: string, state: string): Promise<ConnectOutcome & { name?: string | null }> {
  const res = await api.post<TikTokCallbackResult>(API_ROUTES.PLATFORMS.TIKTOK_CALLBACK, { code, state });
  if (!res.ok) {
    return {
      ok: false,
      message:
        res.status === 400
          ? 'That TikTok sign-in expired or was already used. Please connect again.'
          : res.status === 409
            ? res.message // e.g. this TikTok account is already linked to another PostStreak account
            : 'Couldn’t finish connecting TikTok. Please try again.',
    };
  }
  await refreshAccounts();
  return { ok: true, name: res.data.account.name };
}

export async function disconnectTikTok(): Promise<ConnectOutcome> {
  const res = await api.post<{ disconnected: boolean }>(API_ROUTES.PLATFORMS.TIKTOK_DISCONNECT);
  if (!res.ok) return { ok: false, message: 'Couldn’t disconnect TikTok. Please try again.' };
  await refreshAccounts();
  return { ok: true };
}

export async function syncTikTok(): Promise<TikTokSyncResult | null> {
  const res = await api.post<TikTokSyncResult>(API_ROUTES.PLATFORMS.TIKTOK_SYNC);
  if (res.ok) await refreshAccounts();
  return res.ok ? res.data : null;
}

// ─── The callback page ──────────────────────────────────────────────────────

export interface TikTokReturn {
  /** The code and state to hand on, or the reason the creator didn't finish. */
  code?: string;
  state?: string;
  /** TikTok's `error` (e.g. "access_denied" when the creator taps Cancel). */
  error?: string;
}

/** Web: is this page load TikTok sending the creator back? */
export function readTikTokReturn(): TikTokReturn | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!window.location.pathname.startsWith(BACKEND.tiktokCallbackPath)) return null;
  const q = new URLSearchParams(window.location.search);
  return { code: q.get('code') ?? undefined, state: q.get('state') ?? undefined, error: q.get('error') ?? undefined };
}

/** The link that takes the phone app back from the callback page. */
export function appReturnLink(ret: TikTokReturn): string {
  const q = new URLSearchParams();
  if (ret.code) q.set('code', ret.code);
  if (ret.state) q.set('state', ret.state);
  if (ret.error) q.set('error', ret.error);
  return `${BACKEND.appScheme}://tiktok?${q.toString()}`;
}

/** Was this sign-in started in the phone app? The API tags those states "m." (web ones "w."). */
export const startedInPhoneApp = (ret: TikTokReturn) => Boolean(ret.state?.startsWith('m.'));

/** Phone: the app was opened with poststreak://tiktok?code=…&state=… */
export function parseTikTokLink(url: string): TikTokReturn | null {
  if (!url.startsWith(`${BACKEND.appScheme}://tiktok`)) return null;
  const q = new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
  return { code: q.get('code') ?? undefined, state: q.get('state') ?? undefined, error: q.get('error') ?? undefined };
}

/** Takes the TikTok parameters off the web address so a refresh doesn't replay a used code. */
export function clearTikTokReturn(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState(null, '', '/');
}
