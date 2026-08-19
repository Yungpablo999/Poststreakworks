// ============================================================================
// Workflow: Billing Lifecycle
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/workflows/WORKFLOWS.md
// ============================================================================
//
// 1. Plan selection -> packages/api/routers/billing.ts -> checkout via
//    Paystack or Stripe (packages/integrations/{paystack,stripe}.ts),
//    branched by the user's billing currency.
// 2. Processor webhook confirms payment -> subscriptions row activated
//    (billing_and_subscriptions.sql).
// 3. Entitlements applied: voice_minutes_wallet allocated for the new
//    period; streak-freeze entitlement granted if tier-based (still open —
//    DATA_MODEL.md item D).
// 4. RESOLVED Stage 8: upgrade/downgrade changes take effect at the next
//    renewal — no mid-cycle proration either direction. Simplest billing
//    logic, at the cost of a user who upgrades for an immediate need
//    (e.g. more voice minutes right now) having to wait for the next
//    cycle. Cancellation/dunning flows themselves are still NOT designed
//    — that part of this step remains open, see OPEN_QUESTIONS.md.
// ============================================================================
