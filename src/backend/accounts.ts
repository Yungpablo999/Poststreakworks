import { useSyncExternalStore } from 'react';
import { Linking, Platform } from 'react-native';
import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import {
  CONNECTABLE_PLATFORMS,
  type ConnectAuthorizeResult,
  type ConnectCallbackResult,
  type ConnectSyncResult,
  type ConnectablePlatform,
  type ConnectedAccount,
} from '../../frontend/shared/types/phase1';
import { BACKEND } from '../config/backend';
import { useCapabilities } from './account';
import { api } from './api';

// The creator's connected accounts, and connecting them for real: TikTok, Instagram, Threads,
// Facebook and YouTube.
//
// Each platform signs the creator in on its own page, so the app only ever holds a short-lived
// code, never a password and never the long-lived tokens (those stay on the server, sealed).
// The round trip, the same for every platform:
//
//   connectAccount('instagram') → the API makes a single-use "state" tied to this creator and
//                                 returns the platform's sign-in address
//                               → the creator approves on the platform
//                               → the platform redirects to <app>/auth/instagram/callback?code=…&state=…
//   web:   the app loads on that address and calls completeConnect(provider, code, state)
//   phone: that page hands provider + code + state to the app (poststreak://connect?…) and the
//          app calls completeConnect

export const PLATFORM_NAMES: Record<ConnectablePlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  threads: 'Threads',
  facebook: 'Facebook',
  youtube: 'YouTube',
};
export const platformName = (id: string): string => PLATFORM_NAMES[id as ConnectablePlatform] ?? id;
export const isConnectable = (id: string): id is ConnectablePlatform => (CONNECTABLE_PLATFORMS as readonly string[]).includes(id);

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

/** The platforms to list: the ones this server can connect, plus any already connected (so they can be managed). */
export function useConnectablePlatforms(): ConnectablePlatform[] {
  const capabilities = useCapabilities();
  const connected = useAccounts();
  return CONNECTABLE_PLATFORMS.filter((p) => capabilities.platforms[p] || connected.some((a) => a.platform === p));
}

export async function refreshAccounts(): Promise<void> {
  const res = await api.get<ConnectedAccount[]>(API_ROUTES.PLATFORMS.ACCOUNTS);
  if (res.ok) setAccounts(res.data);
}

/** `upgrade`: the free plan's limit on connected platforms was reached. */
export type ConnectOutcome = { ok: true } | { ok: false; message: string; upgrade?: boolean };

/** Starts connecting. On the web the page leaves for the platform, so a resolved `ok` means "on its way". */
export async function connectAccount(provider: ConnectablePlatform): Promise<ConnectOutcome> {
  const name = platformName(provider);
  const client = Platform.OS === 'web' ? 'web' : 'mobile';
  const res = await api.post<ConnectAuthorizeResult>(API_ROUTES.PLATFORMS.AUTHORIZE(provider), { client });
  if (!res.ok) {
    if (res.status === 403 && res.code === 'UPGRADE_REQUIRED') return { ok: false, message: res.message, upgrade: true };
    return {
      ok: false,
      message: res.status === 503 ? `${name} isn’t set up yet. Please try again later.` : res.offline ? res.message : `Couldn’t start the ${name} connection. Please try again.`,
    };
  }
  try {
    if (Platform.OS === 'web') window.location.assign(res.data.url);
    else await Linking.openURL(res.data.url);
    return { ok: true };
  } catch {
    return { ok: false, message: `Couldn’t open ${name}. Please try again.` };
  }
}

/** What the platform sent back, passed on as-is. The API checks the state is this creator's and unused. */
export async function completeConnect(provider: ConnectablePlatform, code: string, state: string): Promise<ConnectOutcome & { name?: string | null }> {
  const name = platformName(provider);
  const res = await api.post<ConnectCallbackResult>(API_ROUTES.PLATFORMS.CALLBACK(provider), { code, state });
  if (!res.ok) {
    return {
      ok: false,
      // The server words these for the creator: the link expired, the account is already linked to
      // someone else, there's no Facebook Page, the platform said no.
      message: res.status === 400 || res.status === 409 || res.status === 502 ? res.message : `Couldn’t finish connecting ${name}. Please try again.`,
    };
  }
  await refreshAccounts();
  return { ok: true, name: res.data.account.handle ? `@${res.data.account.handle}` : res.data.account.name };
}

export async function disconnectAccount(provider: ConnectablePlatform): Promise<ConnectOutcome> {
  const res = await api.post<{ disconnected: boolean }>(API_ROUTES.PLATFORMS.DISCONNECT(provider));
  if (!res.ok) return { ok: false, message: `Couldn’t disconnect ${platformName(provider)}. Please try again.` };
  await refreshAccounts();
  return { ok: true };
}

export async function syncAccount(provider: ConnectablePlatform): Promise<ConnectSyncResult | null> {
  const res = await api.post<ConnectSyncResult>(API_ROUTES.PLATFORMS.SYNC(provider));
  if (res.ok) await refreshAccounts();
  return res.ok ? res.data : null;
}

// ─── The callback page ──────────────────────────────────────────────────────

export interface ConnectReturn {
  provider: ConnectablePlatform;
  /** The code and state to hand on, or the reason the creator didn't finish. */
  code?: string;
  state?: string;
  /** The platform's `error` (e.g. "access_denied" when the creator taps Cancel). */
  error?: string;
}

/** The platform named in an address like /auth/instagram/callback, if it is one of ours. */
function providerOfPath(pathname: string): ConnectablePlatform | null {
  const m = /^\/auth\/([a-z]+)\/callback\/?$/.exec(pathname);
  return m && isConnectable(m[1]!) ? m[1]! : null;
}

/** Web: is this page load a platform sending the creator back? */
export function readConnectReturn(): ConnectReturn | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const provider = providerOfPath(window.location.pathname);
  if (!provider) return null;
  const q = new URLSearchParams(window.location.search);
  return { provider, code: q.get('code') ?? undefined, state: q.get('state') ?? undefined, error: q.get('error') ?? undefined };
}

/** The link that takes the phone app back from the callback page. */
export function appReturnLink(ret: ConnectReturn): string {
  const q = new URLSearchParams({ provider: ret.provider });
  if (ret.code) q.set('code', ret.code);
  if (ret.state) q.set('state', ret.state);
  if (ret.error) q.set('error', ret.error);
  return `${BACKEND.appScheme}://connect?${q.toString()}`;
}

/** Was this sign-in started in the phone app? The API tags those states "m." (web ones "w."). */
export const startedInPhoneApp = (ret: ConnectReturn) => Boolean(ret.state?.startsWith('m.'));

/** Phone: the app was opened with poststreak://connect?provider=…&code=…&state=… */
export function parseConnectLink(url: string): ConnectReturn | null {
  if (!url.startsWith(`${BACKEND.appScheme}://connect`)) return null;
  const q = new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
  const provider = q.get('provider');
  if (!provider || !isConnectable(provider)) return null;
  return { provider, code: q.get('code') ?? undefined, state: q.get('state') ?? undefined, error: q.get('error') ?? undefined };
}

/** Takes the parameters off the web address so a refresh doesn't replay a used code. */
export function clearConnectReturn(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState(null, '', '/');
}
