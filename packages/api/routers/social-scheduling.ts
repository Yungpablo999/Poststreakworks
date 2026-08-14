// ============================================================================
// tRPC router: Social Scheduling
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000002_social_scheduling.sql
// ============================================================================
//
// Intended procedures: connections.list/connect/disconnect,
// posts.schedule/update/cancel, posts.list. The publish action itself is
// cron-triggered (packages/jobs/index.ts), not a user-invoked procedure —
// scheduling and publishing are separate concerns.
// ============================================================================
