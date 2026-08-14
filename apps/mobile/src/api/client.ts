// ============================================================================
// Mobile tRPC client
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/api/BACKEND_ARCHITECTURE.md
// ============================================================================
//
// Intended contents: tRPC + React Query client, typed against packages/api's
// `AppRouter`, pointed at apps/web's deployed /api/trpc endpoint. Attaches
// the current Supabase session's access token as an Authorization: Bearer
// header on every request — the mobile app never talks to Supabase, Groq,
// Fish Audio, Paystack/Stripe, or any platform API directly.
//
// Session storage: Supabase's React Native auth helper, backed by
// expo-secure-store (not AsyncStorage — tokens shouldn't sit in
// unencrypted storage).
// ============================================================================
