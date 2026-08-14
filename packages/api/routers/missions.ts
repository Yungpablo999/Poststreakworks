// ============================================================================
// tRPC router: Missions
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000009_missions.sql
// ============================================================================
//
// ADDED DURING STAGE 3 — see that migration's header for why this wasn't
// part of the original Stage 1/2 passes.
//
// Intended procedures: missions.today (the recommendation call — thin
// wrapper here; the real recommendation logic lives in an AI-orchestration
// service built at Stage 4, this router just calls it), missions.complete /
// missions.replace / missions.reschedule / missions.simplify.
// ============================================================================
