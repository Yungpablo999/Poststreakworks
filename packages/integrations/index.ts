// ============================================================================
// Third-party integration clients
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/api/BACKEND_ARCHITECTURE.md
// ============================================================================
//
// One typed client module intended per vendor, all server-only (never
// imported by apps/mobile, never bundled client-side in apps/web):
//   - paystack.ts, stripe.ts   (billing router)
//   - resend.ts                (streak-rescue nudges, billing receipts —
//                                shared across multiple domains, which is
//                                why this lives here rather than inside a
//                                single domain router)
//   - linkedin.ts, x.ts        (social-scheduling router; x.ts also carries
//                                the 'assisted' publish_mode logic — see
//                                DATA_MODEL.md item C)
//
// groq.ts and fish-audio.ts were promoted OUT of this consolidated stub
// during Stage 4 — see packages/integrations/groq.ts and
// packages/integrations/fish-audio.ts directly. AI orchestration made them
// central enough to deserve their own files rather than a shared one-liner
// here.
//
// Meta and TikTok clients are NOT stubbed yet — those integrations are
// "planned," not in progress; adding empty files for them now would imply
// work that hasn't started.
// ============================================================================
