// ============================================================================
// Shared types
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/api/BACKEND_ARCHITECTURE.md
// ============================================================================
//
// Intended contents: generated/derived DB row types (from the eventual
// real Supabase schema) re-exported for both apps to consume, plus
// hand-written domain types that aren't 1:1 with a table (e.g. the Jarvis
// emotion state, once DATA_MODEL.md item B is resolved). tRPC already
// gives end-to-end type safety for API calls — this package is for types
// needed outside that boundary (e.g. client-side-only UI state shaped
// around the same domain concepts).
// ============================================================================
