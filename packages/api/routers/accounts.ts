// ============================================================================
// tRPC router: Accounts & Identity
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000001_accounts_and_identity.sql
// ============================================================================
//
// Intended procedures: profile.get, profile.update, onboarding.complete,
// account.close. Wraps the `users` / `creator_profiles` tables — neither
// client queries them directly.
//
// ADDED Stage 6: staff-gated procedures — admin.users.search,
// admin.users.history, admin.users.sanction (warn/restrict/suspend, writes
// to 20260814000011_user_sanctions.sql). Live here, not in a separate
// admin router — these are still account-domain operations, just gated by
// the staff_admin role rather than callable by the account's own owner.
// ============================================================================
