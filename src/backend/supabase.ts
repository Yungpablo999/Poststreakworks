import './polyfills';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BACKEND } from '../config/backend';

// One Supabase client for the whole app. It only does sign-in and keeps the
// session; every piece of data goes through the PostStreak API (src/backend/api.ts).

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!BACKEND.enabled) throw new Error('The backend is not set up (see src/config/backend.ts).');
  if (client) return client;

  const c = createClient(BACKEND.supabaseUrl, BACKEND.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Switched off on purpose. The built-in detection treats ANY page address with
      // `error`, `error_description` or `error_code` in it as a failed sign-in and
      // clears the saved session, and that is exactly what a platform sends back when a
      // creator taps "Cancel" (/auth/instagram/callback?error=access_denied&…): it
      // would sign them out of PostStreak. session.ts reads the sign-in redirect
      // (#access_token=…) itself instead.
      detectSessionInUrl: false,
      // The browser keeps the session in localStorage by default; phones need AsyncStorage.
      ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
    },
  });

  if (Platform.OS !== 'web') {
    // Only refresh the token while the app is on screen (supabase's guidance for React Native).
    c.auth.startAutoRefresh();
    AppState.addEventListener('change', (next) => {
      if (next === 'active') c.auth.startAutoRefresh();
      else c.auth.stopAutoRefresh();
    });
  }

  client = c;
  return c;
}
