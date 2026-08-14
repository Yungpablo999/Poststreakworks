// ============================================================================
// Voice Studio generation orchestration
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/ai/AI_ORCHESTRATION.md
// ============================================================================
//
// Backs packages/api/routers/voice-studio.ts's generate.preview and
// generate.full.
//
// generate.preview: short (~30s), synchronous, direct call to
// packages/integrations/fish-audio.ts. Cheap enough not to need the queue.
//
// generate.full: async (founder-confirmed, Stage 4) — enqueued via
// packages/jobs/index.ts, not called directly from the tRPC procedure.
// Debits voice_minutes_ledger (see the voice_studio.sql migration) only on
// confirmed successful render, not on enqueue — a failed or retried job
// must not double-charge or charge for nothing.
// ============================================================================
