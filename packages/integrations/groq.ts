// ============================================================================
// Groq client
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/ai/AI_ORCHESTRATION.md
// ============================================================================
//
// Promoted out of packages/integrations/index.ts during Stage 4 — AI
// orchestration made this central enough to deserve its own file.
//
// Intended contents: a thin, model-agnostic wrapper around the Groq SDK —
// auth, base request/response shape, streaming support. Deliberately NOT
// where prompts or business logic live (see packages/ai/) — this file only
// knows how to talk to Groq, not what PostStreak uses it for.
//
// Groq is positioned for low latency (Architecture Doc §3: "keeps AI
// inference cost and latency low enough to embed into core product flows")
// — callers should default to synchronous, streamed responses rather than
// routing text generation through the async job queue.
// ============================================================================
