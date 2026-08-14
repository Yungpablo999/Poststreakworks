// ============================================================================
// Workflow: Duel Lifecycle
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/workflows/WORKFLOWS.md
// ============================================================================
//
// ADDED DURING STAGE 5 — duels weren't one of the four Creator Network
// pillars asked about in Stage 1 (Matching, Collaboration Workspace,
// Squads, Passport). Founders confirmed separately they're in scope.
// Patched forward: supabase/migrations/20260814000010_duels.sql,
// packages/api/routers/duels.ts.
//
// 1. One creator proposes a duel to another -> packages/api/routers/
//    duels.ts. Accept/decline.
// 2. For the duel's active window, each day checks both partners' own
//    streak_events for a qualifying action (no separate progress table —
//    reuses the same qualifying-action log the main streak uses).
// 3. If one partner is lagging near the WAT day-end: that partner gets a
//    nudge (reuses streak-rescue.ts's delivery mechanism, duel-specific
//    copy).
// 4. Reward issued only if BOTH partners had a qualifying action that day
//    (Creator Engine Strategy: "both receive a reward only when they both
//    complete"). One partner succeeding alone earns nothing.
// 5. RESOLVED Stage 8: a missed shared-completion day skips only that
//    day's reward — it does not fail or end the duel. The duel runs its
//    full window regardless of individual missed days; it only ends on
//    window expiry (completed) or explicit cancellation.
// ============================================================================
