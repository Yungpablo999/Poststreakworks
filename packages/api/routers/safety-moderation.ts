// ============================================================================
// tRPC router: Safety & Moderation
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000007_safety_and_moderation.sql
// ============================================================================
//
// Intended procedures: block.create/remove, report.submit, and a
// staff-only namespace (reports.queue, reports.resolve) gated by the
// `staff_admin` role from accounts.ts — real authorization enforcement
// TBD alongside the RLS philosophy decision (DATA_MODEL.md item F).
// ============================================================================
