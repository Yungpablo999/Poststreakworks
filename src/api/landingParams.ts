import { POST_PLATFORMS } from '../config/platforms';

// What the website and the backend put on the app's address when they send someone here:
//   ?ref=CODE          a referral link (poststreak.app/r/CODE): kept until the creator signs up
//   ?payment=success   back from checkout (the plan arrives through the billing webhook)
//   ?cancelled=true    left checkout without paying
//   ?connected=ID      a web connect finished (the older cookie flow)
//   ?error=CODE        a connect or sign-in failed (CODEs are the backend's own, below)
// Everything here is pure so it can be tested; App.tsx does the reading and the toast.
// Only the backend's own error codes are shown and removed: other ?error= values
// (Supabase's own OAuth errors) are left alone for the sign-in code.

export interface LandingParams {
  ref: string | null;
  payment: 'success' | null;
  cancelled: boolean;
  connected: string | null;
  /** A recognised backend error code, or null */
  error: string | null;
}

/** The keys this module owns: only these are ever removed from the address */
export const LANDING_PARAM_KEYS = ['ref', 'payment', 'cancelled', 'connected', 'error'] as const;

const REF_PATTERN = /^[A-Za-z0-9_-]{4,40}$/;
const PLATFORM_NAMES: Record<string, string> = Object.fromEntries(POST_PLATFORMS.map((p) => [p.id, p.name]));
const ERROR_PATTERN = /^(?:(linkedin|threads|facebook|instagram|youtube|tiktok)_(denied|state_invalid|token_failed|unavailable)|auth_failed)$/;

/** A referral code is letters, digits, "_" and "-" (4 to 40). Anything else is not stored. */
export function normaliseReferralCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return REF_PATTERN.test(v) ? v : null;
}

/** Reads the owned params from a query string ("?a=1" or "a=1"). Never throws. */
export function parseLandingParams(search: string): LandingParams {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const connected = q.get('connected');
  const error = q.get('error');
  return {
    ref: normaliseReferralCode(q.get('ref')),
    payment: q.get('payment') === 'success' ? 'success' : null,
    cancelled: q.get('cancelled') === 'true',
    connected: connected && connected in PLATFORM_NAMES ? connected : null,
    error: error && ERROR_PATTERN.test(error) ? error : null,
  };
}

/** True when the address carries anything this module owns (so it is worth cleaning) */
export function hasLandingParams(p: LandingParams): boolean {
  return !!(p.ref || p.payment || p.cancelled || p.connected || p.error);
}

/** The toast text for these params, or null to say nothing. One message: error, then payment, then the rest. */
export function landingNotice(p: LandingParams): string | null {
  if (p.error) return errorMessage(p.error);
  if (p.payment === 'success') return 'Payment received. Your Pro plan will show up in a moment.';
  if (p.cancelled) return 'Checkout cancelled. You were not charged.';
  if (p.connected) return `${PLATFORM_NAMES[p.connected]} connected`;
  return null;
}

function errorMessage(code: string): string {
  if (code === 'auth_failed') return 'Sign-in did not finish. Please try again.';
  const m = ERROR_PATTERN.exec(code);
  const name = m?.[1] ? PLATFORM_NAMES[m[1]] : 'That account';
  switch (m?.[2]) {
    case 'denied':
      return `You cancelled connecting ${name}.`;
    case 'state_invalid':
      return `The ${name} connection expired. Please try again.`;
    case 'token_failed':
      return `Could not connect ${name}. Please try again.`;
    case 'unavailable':
      return `${name} is not available yet.`;
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * The same address without the owned params (path, other params such as ?start= and ?tour=,
 * and the #fragment are kept). Returns the input unchanged when there is nothing to remove.
 * Only the keys whose values were recognised are removed.
 */
export function stripLandingParams(url: string, handled: LandingParams): string {
  const hashAt = url.indexOf('#');
  const hash = hashAt === -1 ? '' : url.slice(hashAt);
  const beforeHash = hashAt === -1 ? url : url.slice(0, hashAt);
  const queryAt = beforeHash.indexOf('?');
  if (queryAt === -1) return url;
  const path = beforeHash.slice(0, queryAt);
  const q = new URLSearchParams(beforeHash.slice(queryAt + 1));
  const drop: string[] = [];
  if (handled.ref) drop.push('ref');
  if (handled.payment) drop.push('payment');
  if (handled.cancelled) drop.push('cancelled');
  if (handled.connected) drop.push('connected');
  if (handled.error) drop.push('error');
  if (drop.length === 0) return url;
  drop.forEach((k) => q.delete(k));
  const rest = q.toString();
  return `${path}${rest ? `?${rest}` : ''}${hash}`;
}

// ─── Referral code: kept until signup, then claimed once ─────────────────────────────

export interface ReferralStore {
  save(code: string): void;
  load(): string | null;
  clear(): void;
}

const REF_KEY = 'poststreak.referral';

/** localStorage (it has to outlive the Google round trip and a closed tab). Never throws. */
export const localReferralStore: ReferralStore = {
  save: (code) => {
    try {
      window.localStorage.setItem(REF_KEY, code);
    } catch {}
  },
  load: () => {
    try {
      return normaliseReferralCode(window.localStorage.getItem(REF_KEY));
    } catch {
      return null;
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(REF_KEY);
    } catch {}
  },
};

/** Keeps the code from the address, unless one is already kept (the first link wins). */
export function rememberReferral(code: string | null, store: ReferralStore): void {
  if (!code || store.load()) return;
  store.save(code);
}

export type ClaimResult = 'none' | 'claimed' | 'dropped' | 'retry';

/**
 * Sends the kept code to the backend once the creator is signed in. The code is cleared when the
 * backend has answered for good (claimed, or rejected as unusable: 400 or 409) and kept to try
 * again after a 401, a 404 (the route is not deployed yet), a server error or no network. Never throws.
 */
export async function claimStoredReferral(deps: {
  store: ReferralStore;
  post: (code: string) => Promise<{ success: boolean; statusCode: number }>;
}): Promise<ClaimResult> {
  const code = deps.store.load();
  if (!code) return 'none';
  try {
    const res = await deps.post(code);
    if (res.success) {
      deps.store.clear();
      return 'claimed';
    }
    if (res.statusCode === 400 || res.statusCode === 409) {
      deps.store.clear();
      return 'dropped';
    }
    return 'retry';
  } catch {
    return 'retry';
  }
}
