import { useSyncExternalStore } from 'react';
import { Linking, Platform } from 'react-native';
import type { AuthError, Session } from '@supabase/supabase-js';
import { BACKEND, type SocialProvider } from '../config/backend';
import { supabase } from './supabase';

// Who is signed in. The app signs in with a 6-digit code emailed by Supabase Auth
// (or Google / Apple, when those are switched on), keeps the session on the device,
// and sends its access token with every API call (src/backend/api.ts).

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface SessionState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
}

let state: SessionState = { status: BACKEND.enabled ? 'loading' : 'signedOut', userId: null, email: null };
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  if (next.status === state.status && next.userId === state.userId && next.email === state.email) return;
  state = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getSessionState = () => state;
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSessionState, getSessionState);
}

function apply(session: Session | null) {
  setState(
    session
      ? { status: 'signedIn', userId: session.user.id, email: session.user.email ?? null }
      : { status: 'signedOut', userId: null, email: null },
  );
}

const lostListeners = new Set<() => void>();
/** Called when the creator is signed out (here, on another tab, or because the session was revoked). */
export function onSessionLost(fn: () => void): () => void {
  lostListeners.add(fn);
  return () => lostListeners.delete(fn);
}

let starting: Promise<SessionState> | null = null;
/** Restores the saved session. Call at launch, before reading the session state; calling again waits for the same work. */
export function initSession(): Promise<SessionState> {
  if (!BACKEND.enabled) return Promise.resolve(state);
  if (!starting) starting = start();
  return starting;
}

async function start(): Promise<SessionState> {
  const sb = supabase();
  try {
    await consumeSignInRedirect();
    const { data } = await sb.auth.getSession();
    apply(data.session);
  } catch {
    apply(null);
  }
  // Keep the state in step with refreshes, sign-outs on other tabs, and so on.
  // (Only record the new state in here; calling the client again from this
  // callback can deadlock it.)
  sb.auth.onAuthStateChange((event, session) => {
    apply(session);
    if (event === 'SIGNED_OUT') lostListeners.forEach((l) => l());
  });
  return state;
}

/** The token to put on API calls, refreshed first if it has run out. null = signed out. */
export async function accessToken(): Promise<string | null> {
  if (!BACKEND.enabled) return null;
  try {
    const { data } = await supabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** One forced refresh, for when the API says the token was refused. */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const { data, error } = await supabase().auth.refreshSession();
    return !error && !!data.session;
  } catch {
    return false;
  }
}

// ─── Email code ─────────────────────────────────────────────────────────────

export type AuthFailureKind = 'rate_limit' | 'no_account' | 'bad_code' | 'bad_email' | 'offline' | 'other';
export type AuthOutcome = { ok: true } | { ok: false; kind: AuthFailureKind; message: string };

const MESSAGES: Record<AuthFailureKind, string> = {
  rate_limit: 'Too many tries. Give it a minute, then try again.',
  no_account: 'We couldn’t find an account with that email. Want to create one?',
  bad_code: 'That code didn’t work. Check it, or ask for a new one.',
  bad_email: 'That email doesn’t look right.',
  offline: 'Can’t reach PostStreak right now. Check your connection and try again.',
  other: 'Something went wrong. Please try again.',
};

function fail(kind: AuthFailureKind): AuthOutcome {
  return { ok: false, kind, message: MESSAGES[kind] };
}

function classify(error: AuthError, step: 'send' | 'verify'): AuthFailureKind {
  const code = (error as { code?: string }).code ?? '';
  const status = (error as { status?: number }).status ?? 0;
  const msg = (error.message ?? '').toLowerCase();
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429) return 'rate_limit';
  if (error.name === 'AuthRetryableFetchError' || status === 0 || msg.includes('failed to fetch') || msg.includes('network')) return 'offline';
  if (code === 'otp_disabled' || msg.includes('signups not allowed')) return 'no_account';
  if (code === 'email_address_invalid' || msg.includes('email address') || code === 'validation_failed') return 'bad_email';
  if (step === 'verify') return 'bad_code'; // expired, wrong or already used: the creator's next step is the same
  return 'other';
}

/**
 * Emails a 6-digit code. `createAccount` is true on the sign-up path (a new address
 * gets an account) and false on sign-in (an unknown address is told so instead of
 * quietly getting an account they didn't mean to make).
 */
export async function sendEmailCode(email: string, createAccount: boolean): Promise<AuthOutcome> {
  try {
    const { error } = await supabase().auth.signInWithOtp({ email, options: { shouldCreateUser: createAccount } });
    return error ? fail(classify(error, 'send')) : { ok: true };
  } catch {
    return fail('offline');
  }
}

/** Checks the 6-digit code. On success the session starts and the state changes to signedIn. */
export async function verifyEmailCode(email: string, code: string): Promise<AuthOutcome> {
  try {
    const { data, error } = await supabase().auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) return fail(classify(error, 'verify'));
    if (!data.session) return fail('other');
    apply(data.session);
    return { ok: true };
  } catch {
    return fail('offline');
  }
}

// ─── Google / Apple ─────────────────────────────────────────────────────────
// Dormant until EXPO_PUBLIC_AUTH_PROVIDERS lists the provider (and the provider is
// switched on in Supabase). Not exercised in testing yet: it needs real Google /
// Apple credentials.

// A sign-in link carries the session in its address, so anyone could hand someone a link
// that signs them in to THEIR account. We only take one back if this device started a
// provider sign-in in the last 10 minutes (noted here, in the tab's session storage on the web).
const OAUTH_KEY = 'ps.oauth.started';
const OAUTH_WINDOW_MS = 10 * 60 * 1000;
let oauthStartedAt = 0;

function markOAuthStarted() {
  oauthStartedAt = Date.now();
  try {
    if (Platform.OS === 'web') sessionStorage.setItem(OAUTH_KEY, String(oauthStartedAt));
  } catch {
    // private mode: the in-memory note still covers phones; on the web the sign-in just won't complete
  }
}

/** Was a provider sign-in started here recently? Using it up: a second link can't reuse it. */
function takeOAuthStarted(): boolean {
  let at = oauthStartedAt;
  try {
    if (Platform.OS === 'web') {
      at = Number(sessionStorage.getItem(OAUTH_KEY) ?? 0);
      sessionStorage.removeItem(OAUTH_KEY);
    }
  } catch {
    // treated as "not started"
  }
  oauthStartedAt = 0;
  return at > 0 && Date.now() - at < OAUTH_WINDOW_MS;
}

export async function signInWithProvider(provider: SocialProvider): Promise<AuthOutcome> {
  if (!BACKEND.socialProviders.includes(provider)) return fail('other');
  try {
    if (Platform.OS === 'web') {
      markOAuthStarted();
      const { error } = await supabase().auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/` },
      });
      return error ? fail('other') : { ok: true }; // the page is leaving for the provider
    }
    markOAuthStarted();
    const { data, error } = await supabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${BACKEND.appScheme}://auth/callback`, skipBrowserRedirect: true },
    });
    if (error || !data.url) return fail('other');
    await Linking.openURL(data.url);
    return { ok: true }; // the session arrives through the app link (handleAuthLink)
  } catch {
    return fail('offline');
  }
}

function readTokens(fragment: string): { access_token: string; refresh_token: string } | null {
  const params = new URLSearchParams(fragment.replace(/^[#?]/, ''));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

/** Web: the provider sends the creator back to "/#access_token=…". Takes the session and cleans the address. */
async function consumeSignInRedirect() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const hash = window.location.hash;
  if (!hash.includes('access_token=') && !hash.includes('error_description=')) return;
  const tokens = readTokens(hash);
  // Only a sign-in this tab started may set the session (see OAUTH_KEY above)
  if (tokens && takeOAuthStarted()) await supabase().auth.setSession(tokens);
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** Phone: the app was opened with poststreak://auth/callback#access_token=… Returns true if it was a sign-in link. */
export async function handleAuthLink(url: string): Promise<boolean> {
  if (!url.startsWith(`${BACKEND.appScheme}://auth/`)) return false;
  const tokens = readTokens(url.slice(url.indexOf('#') + 1));
  // A link nobody here asked for is ignored (see OAUTH_KEY above)
  if (!tokens || !takeOAuthStarted()) return true;
  try {
    const { data } = await supabase().auth.setSession(tokens);
    apply(data.session);
  } catch {
    // stays signed out; the sign-in screen is still there
  }
  return true;
}

// ─── Sign out ───────────────────────────────────────────────────────────────

/** Signs out of this device only (Supabase's default would sign the creator out everywhere). */
export async function signOut(): Promise<void> {
  if (!BACKEND.enabled) return;
  try {
    await supabase().auth.signOut({ scope: 'local' });
  } catch {
    // nothing more to do: the state below is cleared either way
  }
  apply(null);
}
