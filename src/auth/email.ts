import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

// Email sign-in / sign-up with a one-time code through Supabase Auth.
//
// 1. sendEmailOtp(email): Supabase emails a code (signInWithOtp). New emails get
//    an account (shouldCreateUser), so the same call serves sign-up and sign-in.
// 2. verifyEmailOtp(email, code): exchanges the code for a session
//    (verifyOtp, type 'email'). supabase-js saves the session itself, exactly as
//    after Google sign-in, so session.ts / authFetch pick it up.
//
// Supabase dashboard: the "Magic Link" email template must contain {{ .Token }}
// (otherwise a link is sent instead of a code), and the OTP length must be 6 to
// match the code screen.
//
// The code and any tokens are never logged. A missing EXPO_PUBLIC_SUPABASE_*
// setting throws (MissingEnvError) rather than being reported as an ordinary
// failure, like Google sign-in.

export type SendEmailOtpResult = { status: 'sent' } | { status: 'error'; message: string };
export type VerifyEmailOtpResult = { status: 'signedIn' } | { status: 'error'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Supabase's default is 6 digits; projects can be configured for 6 to 10.
const CODE_RE = /^\d{6,10}$/;

export const EMAIL_OTP_MESSAGES = {
  invalidEmail: 'Enter a valid email address.',
  invalidCode: 'Enter the code from your email.',
  rateLimited: 'Too many codes requested. Wait a minute and try again.',
  wrongOrExpired: 'That code is wrong or has expired. Check it, or request a new one.',
  network: "Couldn't reach the server. Check your connection and try again.",
  emailDisabled: 'Email sign-in is not available right now.',
  sendFailed: "Couldn't send the code. Try again.",
  verifyFailed: "Couldn't check the code. Try again.",
} as const;

/** Trimmed, lower-cased email, or null if it doesn't look like an email. */
export function normalizeEmail(email: string): string | null {
  const e = (email ?? '').trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

/** Digits only (spaces/dashes from paste removed), or null if not 6–10 digits. */
export function normalizeCode(code: string): string | null {
  const c = (code ?? '').replace(/[\s-]/g, '');
  return CODE_RE.test(c) ? c : null;
}

function isNetworkError(err: unknown): boolean {
  if (isAuthRetryableFetchError(err)) return true;
  // fetch itself failing (offline, DNS) surfaces as a TypeError
  return err instanceof TypeError;
}

function mapError(err: unknown, fallback: string): string {
  if (isNetworkError(err)) return EMAIL_OTP_MESSAGES.network;
  if (isAuthError(err)) {
    const code = err.code;
    if (err.status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
      return EMAIL_OTP_MESSAGES.rateLimited;
    }
    // Supabase reports a wrong code and an expired one the same way
    if (code === 'otp_expired' || code === 'invalid_credentials') return EMAIL_OTP_MESSAGES.wrongOrExpired;
    if (code === 'email_address_invalid' || code === 'validation_failed') return EMAIL_OTP_MESSAGES.invalidEmail;
    if (code === 'otp_disabled' || code === 'email_provider_disabled' || code === 'signup_disabled') {
      return EMAIL_OTP_MESSAGES.emailDisabled;
    }
  }
  return fallback;
}

/** Emails a one-time sign-in code. `username` is saved on the account when it is created. */
export async function sendEmailOtp(email: string, opts: { username?: string } = {}): Promise<SendEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { status: 'error', message: EMAIL_OTP_MESSAGES.invalidEmail };

  const supabase = getSupabase();
  const username = opts.username?.trim();
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: true, ...(username ? { data: { username } } : {}) },
    });
    if (error) return { status: 'error', message: mapError(error, EMAIL_OTP_MESSAGES.sendFailed) };
    return { status: 'sent' };
  } catch (err) {
    return { status: 'error', message: mapError(err, EMAIL_OTP_MESSAGES.sendFailed) };
  }
}

/** Checks the emailed code; on success the Supabase session is saved on this device. */
export async function verifyEmailOtp(email: string, code: string): Promise<VerifyEmailOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { status: 'error', message: EMAIL_OTP_MESSAGES.invalidEmail };
  const token = normalizeCode(code);
  if (!token) return { status: 'error', message: EMAIL_OTP_MESSAGES.invalidCode };

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.auth.verifyOtp({ email: normalized, token, type: 'email' });
    if (error) return { status: 'error', message: mapError(error, EMAIL_OTP_MESSAGES.verifyFailed) };
    if (!data?.session) return { status: 'error', message: EMAIL_OTP_MESSAGES.verifyFailed };
    return { status: 'signedIn' };
  } catch (err) {
    return { status: 'error', message: mapError(err, EMAIL_OTP_MESSAGES.verifyFailed) };
  }
}
