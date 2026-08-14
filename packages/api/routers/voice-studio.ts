// ============================================================================
// tRPC router: Voice Studio
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000005_voice_studio.sql
// ============================================================================
//
// Intended procedures: projects.create/list, seriesVoices.save,
// generate.preview (30s, cheap), generate.full (debits the minutes
// ledger), wallet.balance, topups.purchase. `generate.full` is the
// clearest current candidate for the async job queue
// (packages/jobs/index.ts) rather than a synchronous procedure, depending
// on real Fish Audio latency.
//
// This router — along with packages/integrations' Fish Audio client — is
// the "isolated internal module" referenced in BACKEND_ARCHITECTURE.md:
// kept behind a narrow interface so it can be extracted into its own
// service later without reshaping the rest of the backend.
// ============================================================================
