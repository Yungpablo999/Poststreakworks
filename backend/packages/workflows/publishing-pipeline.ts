// ============================================================================
// Workflow: Scheduled Post Publishing
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/workflows/WORKFLOWS.md
// ============================================================================
//
// 1. User composes + schedules -> packages/api/routers/social-scheduling.ts
// 2. Vercel Cron dispatches due posts -> packages/jobs/index.ts
//    (dispatchScheduledPosts)
// 3. Platform integration publishes -> packages/integrations/{linkedin,x}.ts
//    (respects each connection's publish_mode: 'api' | 'assisted')
// 4. Status updates on scheduled_posts (social_scheduling.sql)
// 5. On confirmed publish: a streak_event is written
//    (streak_jarvis_gamification.sql) -> streak state recalculated ->
//    Jarvis emotion state updated
//
// This is the one workflow the Architecture Doc already documented
// end-to-end (§4.1) — this file formalizes it rather than redesigning it.
// ============================================================================
