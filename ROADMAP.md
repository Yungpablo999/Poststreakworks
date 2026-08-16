# PostStreak — Roadmap

Synthesizes [FRONTEND_BUILD_PLAN.md](FRONTEND_BUILD_PLAN.md) and [BACKEND_BUILD_PLAN.md](BACKEND_BUILD_PLAN.md) (1 frontend + 2 backend engineers, ~10 weeks) with the business milestones in the source docs. This is execution planning, not architecture — it doesn't reopen anything in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), it schedules around it.

## A gap this roadmap surfaces that the architecture stages didn't need to answer

Every stage from DATA_MODEL through OPEN_QUESTIONS designed the *target* system. None of them had to ask what happens to the **already-live product and its paying users** during the transition — that question doesn't affect schema or API shape, but it entirely determines the launch plan. "We are revamping and rebuilding... not iterating" doesn't say whether existing accounts, streaks, and subscriptions migrate into the new system or whether this is effectively a fresh launch under the same brand. This roadmap assumes **migration** — existing users keep their streaks, credits, and subscriptions — because abandoning paying users' data is a real business cost, not a neutral default. If that assumption is wrong, the launch phase below (Week 11) changes substantially; flag it back before that week arrives, not during it.

## Timeline

| Week | Frontend | Backend (A: core / B: expansion) | Milestone |
|---|---|---|---|
| 1 | Foundation | Infra: environments, real migrations + RLS, Sentry | Both tracks can build against a real (if empty) system |
| 2 | Shell + Home | A: accounts · B: streak/missions | Home renders against real auth + mock data |
| 3 | Create | A: scheduling + publish dispatch · B: voice + AI studio | A creator can compose, schedule, and generate voice against mock-shaped real endpoints |
| 4–5 | Network (largest phase) | A: billing + **webhook verification** · B: creator network + duels | Feature-complete on the doc3 pillars pulled into scope this session |
| 6 | Grow | Both: per-creator analytics gap, streak-rescue + publish cron | Growth tab shows real numbers, not mocks |
| 7 | Profile + billing UI | A: entitlement grants · B: onboarding flow | A user can subscribe and receive the right entitlements |
| 8 | Admin dashboard | Both: admin, moderation, safety, full analytics | Staff can moderate and see the real dashboard |
| 9–10 | Integration + QA + polish | Integration, RLS security testing, backup restore test, load test | Everything talks to everything for real |
| 11 | — | — | **Migration + staged rollout** (see below) |

Ten build weeks matches what two build plans of this size actually take for a team this size — treat any pressure to compress it as pressure to cut Phase 4–5's scope (Network), not the integration/security weeks at the end. Doc3's own principle applies directly here: *"Experiment priorities: safety before wider discovery."* Cutting Phase 7 to hit a date is how the webhook-verification gap or an untested RLS policy ships to production.

## Launch: staged, not a flip

Because this replaces a live product with real paying users, not a greenfield launch:

1. **Shadow period.** Deploy the new system to production infrastructure but behind a feature flag (`packages/api/routers/admin.ts`'s configuration surface, Stage 6) — real traffic still hits the old product.
2. **Internal dogfood.** Founders and staff accounts flip first. Doc3's own "founder proof" instinct (§ Current Foundation: *"@hizzystudio should be the first documented customer case study"*) applies directly to the rebuild too — run your own streak on the new system before anyone else does.
3. **Cohort rollout.** Flip a small percentage of existing users, watch retention and error rates (Sentry, the analytics categories built in Phase 8) before widening. This is where a wrong assumption about data migration would surface fastest — watch for it explicitly, not just generically.
4. **Full cutover.** Old product decommissioned only after a cohort has run a full week on the new system without a regression in publish success rate or streak accuracy — the two things that would most visibly break trust with existing paying users.

## Business milestones this build should be measured against

Pulled from the Architecture Doc and Creator Engine Strategy, not invented for this roadmap:

- **Platform coverage:** LinkedIn (API) and X (assisted) at parity with today by end of Week 3; Meta and TikTok remain explicitly out of this build (Stage 2 decision — not stubbed, not started).
- **The 50-paying-users-in-60-days goal** (Architecture Doc §12) predates this rebuild — post-launch, the question isn't reaching 50 for the first time, it's not *losing* whoever's already there during migration, then resuming growth on the expanded product.
- **Streak retention** (7-day+ streak percentage) is the one metric to watch most closely through the staged rollout — it's the most sensitive indicator that migration preserved what mattered.

## After Week 11 — deliberately not in this build

Everything Stage 1 through 8 confirmed out of scope stays out of scope here too: Brand & Agency Platform, Opportunity Marketplace, Creator Services Marketplace, Payments/Contracts/Escrow, Video Studio. This roadmap doesn't sequence them — that's a future session's Stage 1 question (which doc3 pillars come in next), not a date to pencil in now.
