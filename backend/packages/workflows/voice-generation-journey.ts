// ============================================================================
// Workflow: Voice Studio Generation Journey
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/workflows/WORKFLOWS.md
// ============================================================================
//
// 1. Script + voice selection -> packages/api/routers/voice-studio.ts
// 2. Preview: synchronous -> packages/ai/voice-generation.ts ->
//    packages/integrations/fish-audio.ts
// 3. Full render: enqueued -> packages/jobs/index.ts -> Fish Audio ->
//    voice_minutes_ledger debited only on confirmed success
// 4. Attach rendered audio to a scheduled_post
// 5. On that post's confirmed publish: streak credit fires — generating
//    audio alone still doesn't qualify on its own, only the publish (or,
//    per this stage's broader rule, completing it as part of a mission or
//    collaboration) does.
// ============================================================================
