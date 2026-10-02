import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/**
 * The service-role client. It BYPASSES row-level security, so it is for
 * server-authoritative writes only — streaks, credits/XP, subscriptions,
 * analytics, entitlement counters — and every query made with it must filter
 * by an explicit user id. Never hand it, or anything read with it, to a client
 * without checking ownership first.
 *
 * Lazily created and shared per server instance, so importing this module
 * never requires the env vars (tests, type-checking, build).
 */
export function getServiceClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return client;
}
