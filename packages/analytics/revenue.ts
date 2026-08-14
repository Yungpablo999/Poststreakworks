// ============================================================================
// Analytics: Revenue
// STUB — structural placeholder only. No implementation yet.
// Governed by: apps/web/app/admin/ADMIN_DASHBOARD.md
// ============================================================================
//
// Metrics: paid conversion, MRR, gross margin, churn, contribution. Reads
// billing_and_subscriptions.sql. Gross margin specifically needs Voice
// Studio's per-minute Fish Audio cost (voice_minutes_ledger) netted
// against subscription revenue — the two tables this file joins across
// don't share a natural key beyond user_id, worth confirming that's
// enough once this gets built for real.
//
// Marketplace revenue (take rate, GMV) is NOT here — no marketplace
// exists yet, deferred per Stage 1.
// ============================================================================
