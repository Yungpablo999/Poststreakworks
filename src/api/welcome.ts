// The welcome email and the start of the email sequence for a brand-new creator.
//
// The website used to do this itself when someone signed in through it. The app signs people in on its
// own (email code or Google), so after sign-up it asks the backend: POST /api/onboarding/welcome.
// The backend sends it at most once per person, so asking again is harmless; this only avoids asking for
// accounts that cannot qualify (it welcomes accounts under a day old) and avoids repeats in one session.

export const NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** True for an account created within the last day. An unknown creation time counts as not new. */
export function isNewAccount(createdAt: string | undefined | null, now: number = Date.now()): boolean {
  const created = createdAt ? Date.parse(createdAt) : NaN;
  return Number.isFinite(created) && now - created <= NEW_ACCOUNT_WINDOW_MS;
}

export type WelcomeResult = 'skipped' | 'sent' | 'already' | 'retry';

export interface WelcomeDeps {
  post: () => Promise<{ success: boolean; statusCode: number; data?: { welcomed?: boolean } }>;
  /** Users already handled in this session (so a token refresh or a second sign-in event does not ask again) */
  done?: Set<string>;
  now?: number;
}

const sessionDone = new Set<string>();

/**
 * Asks the backend to welcome a new creator. Never throws.
 *  'skipped'  not a new account, or already handled in this session: nothing was sent
 *  'sent'     the backend sent the welcome now
 *  'already'  the backend had already welcomed them
 *  'retry'    it did not work (signed out, offline, server error): asked again at the next sign-in
 */
export async function requestWelcome(user: { id: string; created_at?: string }, deps: WelcomeDeps): Promise<WelcomeResult> {
  const done = deps.done ?? sessionDone;
  if (done.has(user.id) || !isNewAccount(user.created_at, deps.now)) return 'skipped';
  done.add(user.id);
  try {
    const res = await deps.post();
    if (res.success) return res.data?.welcomed === true ? 'sent' : 'already';
  } catch {
    // fall through to retry
  }
  done.delete(user.id);
  return 'retry';
}
