import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { parseAuthCallback } from './callbackUrl';
import { getSupabase } from './supabase';

// Google sign-in through Supabase Auth (PKCE).
//
// Web:    signInWithOAuth sends the page to Google; Google -> Supabase -> back to
//         this origin with ?code=, which the Supabase client exchanges on load
//         (detectSessionInUrl, src/auth/supabase.ts).
// Phones: the Google page opens in an in-app browser (expo-web-browser), which
//         closes when Supabase redirects to poststreak://auth/callback?code=…;
//         the code is exchanged for a session here.
//
// A missing EXPO_PUBLIC_SUPABASE_* setting throws (MissingEnvError) rather than
// being reported as an ordinary failure.

// Web: if this page is the redirect target of a popup sign-in, close the popup.
WebBrowser.maybeCompleteAuthSession();

export const AUTH_CALLBACK_PATH = 'auth/callback';

export type GoogleSignInResult =
  | { status: 'signedIn' }
  /** Web: the page is leaving for Google; the session is picked up when it comes back. */
  | { status: 'redirecting' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/** Where Supabase sends the creator back to. Must be in Supabase's Redirect URLs list. */
export function googleRedirectUrl(): string {
  if (Platform.OS === 'web') return `${window.location.origin}/`;
  // poststreak://auth/callback in dev-client and store builds (app.json "scheme")
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const supabase = getSupabase();
  const redirectTo = googleRedirectUrl();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    return error ? { status: 'error', message: error.message } : { status: 'redirecting' };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { status: 'error', message: error?.message ?? 'Could not start Google sign-in.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { status: 'cancelled' };

  const callback = parseAuthCallback(result.url);
  if (!callback) return { status: 'error', message: 'Google sign-in did not return a code.' };
  if ('error' in callback) return { status: 'error', message: callback.error };

  const exchanged = await supabase.auth.exchangeCodeForSession(callback.code);
  if (exchanged.error || !exchanged.data.session) {
    return { status: 'error', message: exchanged.error?.message ?? 'Google sign-in failed.' };
  }
  return { status: 'signedIn' };
}
