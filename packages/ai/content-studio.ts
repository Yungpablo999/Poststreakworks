// ============================================================================
// AI Content Studio (Create tab)
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/ai/AI_ORCHESTRATION.md
// ============================================================================
//
// Scope confirmed for this build (founder answer, Stage 4): four modules
// only, out of doc3's full nine (§11) —
//   - Idea Builder    (niche/goal/topic/platform/audience -> concepts)
//   - Hook Lab         (topic/tone/format -> multiple openings)
//   - Script Builder   (idea/length/style/CTA -> short-form script)
//   - Caption Studio   (content summary/voice/platform -> captions)
//
// Explicitly NOT built this pass: Trend-to-You, Post Doctor, Repurpose,
// Series Builder, Campaign Assistant (doc3 §11) — no stub files for these,
// same reasoning as Stage 2's Meta/TikTok omission: stubbing implies work
// that hasn't started.
//
// Each module is a synchronous, streamed Groq call (packages/integrations/
// groq.ts) using a prompt template from packages/ai/prompts/ — none of
// this needs the async job queue.
// ============================================================================
