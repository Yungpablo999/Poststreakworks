// ============================================================================
// Workflow: Moderation
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/workflows/WORKFLOWS.md
// ============================================================================
//
// 1. Content produced (message, discovery profile, brief) -> flagged by
//    packages/ai/moderation.ts (AI-assisted, no auto-enforcement) and/or
//    a user-submitted report -> packages/api/routers/safety-moderation.ts.
// 2. Enters the staff review queue (Stage 6, ADMIN DASHBOARD LAYER).
// 3. Staff resolves -> moderation_actions recorded
//    (safety_and_moderation.sql) -> reporter/affected user notified of
//    the outcome.
// ============================================================================
