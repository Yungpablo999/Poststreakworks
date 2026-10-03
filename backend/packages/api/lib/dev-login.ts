import { createClient } from "@supabase/supabase-js";
import { getServiceClient } from "@poststreak/workflows";
import { devLoginEnabled } from "./capabilities";

// One-tap sign-in for the local test accounts (backend/scripts/seed-test-users.mjs).
//
// It signs in through Supabase Auth exactly as the emailed code would: the server asks
// Supabase for a one-time code for that address and exchanges it right away, returning
// the real session. So everything after it (tokens, row-level security, the lot) is the
// real thing; only the "open your email" step is skipped.
//
// devLoginEnabled() is the lock: it is off unless DEV_LOGIN=true, off in production builds
// and off for any Supabase that isn't on this machine.

export class DevLoginDisabledError extends Error {}
export class DevLoginFailedError extends Error {}

export type DevSession = { access_token: string; refresh_token: string };

export async function devLogin(email: string, env: Record<string, string | undefined> = process.env): Promise<DevSession> {
  if (!devLoginEnabled(env)) throw new DevLoginDisabledError();

  const { data, error } = await getServiceClient().auth.admin.generateLink({ type: "magiclink", email });
  const otp = data?.properties?.email_otp;
  if (error || !otp) throw new DevLoginFailedError("No such test account");

  // A fresh anonymous client, so the session is the user's and not the service role's.
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({ email, token: otp, type: "email" });
  if (verifyError || !verified.session) throw new DevLoginFailedError("Could not sign in");
  return { access_token: verified.session.access_token, refresh_token: verified.session.refresh_token };
}
