# PostStreak — Backend Build Plan

For: **2 backend engineers**. Runs parallel to [FRONTEND_BUILD_PLAN.md](FRONTEND_BUILD_PLAN.md) — phases are numbered to match; Phase *N* here hands the frontend's Phase *N* what it needs, roughly one phase ahead. This plan turns [BACKEND_ARCHITECTURE.md](packages/api/BACKEND_ARCHITECTURE.md), [AI_ORCHESTRATION.md](packages/ai/AI_ORCHESTRATION.md), and [WORKFLOWS.md](packages/workflows/WORKFLOWS.md)'s stubs into real code.

## The split

- **Person A — Core track.** Accounts, social scheduling, billing. This is the closest thing to a rebuild of what's already live in production today — the standard to hold this work to is "does not regress what paying users already have," not "build something new."
- **Person B — Expansion track.** Streak/Jarvis/gamification, missions, creator network, duels, voice studio, AI orchestration. This is genuinely new — the doc3 pillars pulled into scope during this architecture session.
- Infra (Phase 0) and the late-stage convergence (Phase 6–7) are both-of-you work, not split.

## Ship shapes before logic

Every router gets its Zod input/output shape defined and merged into `root.ts` **before** its real implementation lands, returning realistic mock data in the meantime. This is what lets frontend build in parallel instead of waiting on you — a broken promise here (shape defined, but frontend still blocked because nothing's merged into `root.ts`) breaks the whole parallel structure, not just one screen.

---

## Phase 0 — Infrastructure (Week 1, both)

- Three Supabase projects — dev / staging / prod, EU region (SYSTEM_DESIGN.md §4).
- Turn all 11 stub migrations into real SQL: `CREATE TABLE` statements, indexes, and RLS policies. **RLS philosophy is resolved** (OPEN_QUESTIONS.md §1): strict RLS on every table, with security-definer functions for the specific cross-user reads that legitimately need them (leaderboards, discovery feeds, duel status, squad rosters). Review each other's policies before merging — an RLS mistake is a data leak, not a bug ticket.
- `packages/api/context.ts` for real: dual auth resolution (Supabase cookie session for web, `Authorization: Bearer` for mobile), one code path.
- `packages/api/root.ts` merging placeholder routers (even empty ones) so the tRPC endpoint is real and frontend's Phase 0 isn't blocked.
- Supabase's pooled connection string (Supavisor) wired into Vercel env vars for every serverless function — not the direct connection string. This is a correctness requirement, not a preference (SYSTEM_DESIGN.md §5).
- Sentry project, wired into `apps/web` and the API layer now; mobile SDK gets added once `apps/mobile` exists.
- CI skeleton: typecheck + lint on every PR at minimum.

## Phase 1 (Week 2)

**Person A** — `routers/accounts.ts`: profile CRUD, onboarding completion, account closure. Backs Supabase Auth records with `users`/`creator_profiles`.

**Person B** — `routers/streak-gamification.ts` (streak state, streak events, credits, milestones) and `routers/missions.ts` + `packages/ai/mission-recommender.ts`. Build the rules-based candidate step first (no Groq call) — it's the part frontend's mock data depends on structurally. Wire the Groq copy-personalization step in once `packages/integrations/groq.ts` exists.

**Hands off to frontend Phase 1:** `profile.get`, `streak.get`, `missions.today` — real shapes, mock-acceptable data.

## Phase 2 (Week 3)

**Person A** — `routers/social-scheduling.ts` + `packages/jobs/index.ts`'s `dispatchScheduledPosts`. Build LinkedIn's true API-publish path first (it's `publish_mode: 'api'`), then X's `'assisted'` path — these are genuinely different code paths per DATA_MODEL.md item C, don't try to unify them into one.

**Person B** — `packages/integrations/{groq,fish-audio}.ts`, `packages/ai/voice-generation.ts`, `packages/ai/content-studio.ts` (the four confirmed modules), `routers/voice-studio.ts`. `generate.preview` is synchronous; `generate.full` goes through the async job queue you're about to build in Phase 3 — build preview first, it's usable on its own.

**Hands off to frontend Phase 2:** `posts.schedule`, `voice-studio` procedure shapes, the four content-studio module shapes.

## Phase 3 (Weeks 4–5, biggest phase)

**Person A** — `routers/billing.ts`, `packages/integrations/{paystack,stripe}.ts`, `packages/workflows/billing-lifecycle.ts` (upgrade/downgrade takes effect at next renewal, no proration — resolved, OPEN_QUESTIONS.md §1). **Priority inside this phase, don't let it slip to Phase 7: webhook signature verification.** It was flagged in SYSTEM_DESIGN.md as a real gap nobody had designed — verify Paystack/Stripe payloads before trusting them, from the first webhook handler you write, not as a retrofit.

**Person B** — `routers/creator-network.ts` (discovery, matches, messages, briefs, squads, quests), `routers/duels.ts`, `packages/workflows/{collaboration-lifecycle,duel-lifecycle}.ts`. Duel end condition is resolved: a missed shared-completion day skips that day's reward only, never fails the duel (OPEN_QUESTIONS.md §1) — the `duels` table has no `failed` status for this reason, don't reintroduce one.

**Hands off to frontend Phase 3:** the full `creator-network` and `duels` procedure set.

## Phase 4 (Week 6, both)

- Resolve the Grow-tab gap frontend will flag: `packages/analytics/` is admin/aggregate-scoped: add personal-scope procedures (likely on `streak-gamification.ts` or `routers/analytics.ts`) for a creator's own growth numbers — a different query shape, not a re-export of the admin rollups.
- `packages/workflows/{streak-rescue,publishing-pipeline}.ts` real cron-triggered implementation.
- Remember the expanded streak-qualifying-action rule (WORKFLOWS.md §2): mission completion and collaboration completion write `streak_events` too, not just publish. Test all three paths, not just the original one.

## Phase 5 (Week 7)

**Person A** — Billing entitlement grants: voice-minutes-wallet allocation tied to the active plan, streak-freeze entitlement if the plan grants one.

**Person B** — `packages/workflows/onboarding-flow.ts` real implementation — ends on whichever comes first, first mission or first scheduled post (resolved, WORKFLOWS.md).

## Phase 6 (Week 8, both)

`routers/admin.ts`, `routers/safety-moderation.ts` staff procedures, `packages/ai/moderation.ts` real AI-assisted flagging (flag-only, no auto-enforcement — resolved, Stage 4), the `user_sanctions` procedures in `accounts.ts`, and all nine `packages/analytics/` categories for real.

## Phase 7 — Integration, Security, Load (Weeks 9–10, both)

- Integration-test against frontend as it swaps mocks for real calls.
- Actually attempt to read another user's data through each RLS-protected table and confirm it's denied — don't just trust the policy compiled.
- Test a real backup restore, not just confirm backups are enabled (SYSTEM_DESIGN.md §5).
- Load-test with Supavisor pooling under realistic concurrent serverless invocations.
- Cancellation/dunning billing flows are still genuinely undesigned (OPEN_QUESTIONS.md §4) — this phase is where that has to get resolved, not slip past launch.

## Definition of done, per phase

Real Supabase queries, not mocks. RLS policy written and tested, not just planned. Every external call (Groq, Fish Audio, Paystack, Stripe, platform APIs) has a handled failure path, not just a happy path.
