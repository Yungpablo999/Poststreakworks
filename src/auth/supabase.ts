import './polyfills';
import { AppState, Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../config/env';
import { authStorage } from './storage';

// One Supabase client for the whole app. It only signs in and keeps the session;
// data goes through the PostStreak backend with the session's access token
// (src/api/authFetch.ts).
//
// Created on first use: if EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY
// is missing, getSupabase() throws a MissingEnvError naming the variable.

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const { url, anonKey } = getSupabaseConfig();
  const c = createClient(url, anonKey, {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      // PKCE: the provider sends back a one-time ?code= that only this device
      // (which holds the code verifier) can exchange for a session.
      flowType: 'pkce',
      // Web: pick up ?code= when Google sends the browser back to the app.
      // Phones: the code arrives through the deep link instead (src/auth/google.ts).
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  if (Platform.OS !== 'web') {
    // Supabase's guidance for React Native: only refresh while the app is on screen.
    if (AppState.currentState === 'active') c.auth.startAutoRefresh();
    AppState.addEventListener('change', (next) => {
      if (next === 'active') c.auth.startAutoRefresh();
      else c.auth.stopAutoRefresh();
    });
  }

  client = c;
  return c;
}
