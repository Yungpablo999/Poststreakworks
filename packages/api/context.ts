// ============================================================================
// tRPC request context & auth resolution
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/api/BACKEND_ARCHITECTURE.md
// ============================================================================
//
// Intended contents: builds the context object every router procedure
// receives — resolved user (or null), a Supabase server client scoped to
// the request, and role/permission flags.
//
// Dual auth mode: accepts EITHER a Supabase cookie session (web requests,
// same-origin) OR an Authorization: Bearer <token> header (mobile). One
// resolution path, two accepted credential shapes — not two separate auth
// systems.
//
// Also owns: the rate-limit check hook (see packages/jobs/index.ts — abuse
// control is assumed DB-backed counters for now, not yet built).
// ============================================================================
