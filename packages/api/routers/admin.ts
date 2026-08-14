// ============================================================================
// tRPC router: Admin
// STUB — structural placeholder only. No implementation yet.
// Governed by: apps/web/app/admin/ADMIN_DASHBOARD.md
// ============================================================================
//
// Everything admin-specific that doesn't belong to a single existing
// domain: feature flags, configuration (mission templates, generation/rate
// limits), and the cross-domain analytics rollups in packages/analytics/.
//
// Domain-specific staff actions stay in their own router, just gated by
// the staff_admin role, rather than duplicated here:
//   - user search/sanction/history -> routers/accounts.ts
//   - report queue/resolution -> routers/safety-moderation.ts
//   - refunds/reconciliation -> routers/billing.ts
//
// Staff role model (founder-confirmed, Stage 6): stays a single flat
// staff_admin role for now — no moderator/finance_admin/super_admin split
// yet, matches team size today.
// ============================================================================
