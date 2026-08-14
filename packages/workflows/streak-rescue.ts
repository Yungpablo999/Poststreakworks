// ============================================================================
// Workflow: Streak Rescue
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/workflows/WORKFLOWS.md
// ============================================================================
//
// 1. Cron sweep -> packages/jobs/index.ts (dispatchStreakRescueNudges)
//    finds users approaching their WAT day-end with no qualifying action
//    yet today (see WORKFLOWS.md for this stage's expanded definition of
//    "qualifying").
// 2. Jarvis emotion state shifts to an at-risk state.
// 3. Nudge sent via packages/integrations/resend.ts and/or in-app.
// 4. If a qualifying action lands before the deadline: streak continues,
//    Jarvis returns to a positive state.
// 5. If not: streak breaks, credit/milestone counters reset accordingly
//    (streak_jarvis_gamification.sql).
//
// Reused by duel-lifecycle.ts for lagging-partner nudges — same delivery
// mechanism, duel-specific copy.
// ============================================================================
