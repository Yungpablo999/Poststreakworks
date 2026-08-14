// ============================================================================
// tRPC router: Billing & Subscriptions
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000006_billing_and_subscriptions.sql
// ============================================================================
//
// Intended procedures: plans.list, subscription.current,
// subscription.checkout (branches to Paystack or Stripe by the user's
// billing currency). Webhook handling is separate (platform webhook
// endpoints, not tRPC procedures — Paystack/Stripe call those directly,
// unauthenticated by user session, verified by signature instead).
// Plan names/prices are not seeded yet — DATA_MODEL.md item A is
// unresolved.
//
// ADDED Stage 6: staff-gated procedures — admin.billing.lookup,
// admin.billing.refund, admin.billing.reconcile. Renewal/proration/dunning
// policy is still undecided (WORKFLOWS.md item V); these procedures act on
// individual subscriptions regardless of that open policy question.
// ============================================================================
