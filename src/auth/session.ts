import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

// Small helpers over the Supabase session for App.tsx.

/** The saved session (on the web this also finishes a Google redirect), or null when signed out. */
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

/** Calls `fn` whenever the creator signs in or out (including on another tab). Returns an unsubscribe. */
export function onAuthChange(fn: (session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => fn(session));
  return () => data.subscription.unsubscribe();
}

/** Signs out on this device only (Supabase's default would end every session). */
export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut({ scope: 'local' });
}
