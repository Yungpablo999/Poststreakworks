// ============================================================================
// Background jobs & scheduling
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/api/BACKEND_ARCHITECTURE.md
// ============================================================================
//
// Intended contents:
//   - dispatchScheduledPosts: Vercel Cron target, polls due scheduled_posts,
//     calls the relevant platform integration (already-live behavior,
//     being formalized here).
//   - dispatchStreakRescueNudges: Vercel Cron target, finds users
//     approaching their WAT day-end without a qualifying action, triggers
//     a Resend email and/or in-app nudge.
//   - queue: a minimal DB-backed job table + polling worker for anything
//     that doesn't fit Vercel Cron's interval/timeout limits (candidate:
//     Voice Studio's `generate.full`). Assumed default
//     (BACKEND_ARCHITECTURE.md item J) — no new vendor yet; first thing to
//     swap for a managed queue (Inngest/Trigger.dev) if this becomes a
//     bottleneck.
// ============================================================================
