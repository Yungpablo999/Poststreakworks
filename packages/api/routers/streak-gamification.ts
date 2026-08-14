// ============================================================================
// tRPC router: Streak, Jarvis & Gamification
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000003_streak_jarvis_gamification.sql
// ============================================================================
//
// Intended procedures: streak.get, streak.setWeeklyTarget, freeze.apply
// (mechanic still undecided — DATA_MODEL.md item D), credits.balance,
// milestones.list. Streak state is never written directly by a client
// procedure — only derived from streak_events, which are written by
// whichever domain produced the qualifying action (a publish today,
// eventually a completed collaboration).
// ============================================================================
