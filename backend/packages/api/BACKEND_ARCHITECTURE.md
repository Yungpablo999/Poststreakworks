# PostStreak — Backend Architecture (Stage 2 of 8)

Status: **Scaffolded, pending founder review.** Stub source files only — no implementation, no `package.json`/`turbo.json`/framework config. Planning artifact, not a build artifact.

---

## 1. Decisions confirmed this stage (founder answers, 2026-08-14)

- **Monorepo tool:** Turborepo.
- **API paradigm:** tRPC. One HTTP surface (`apps/web/app/api/trpc/[trpc]/route.ts`) serves both clients — no separate REST layer alongside it.
- **Service layer:** domain-aligned, one router per Stage 1 DATA_MODEL domain (`packages/api/routers/`), plus a separate `packages/integrations/` for third-party vendor clients so they're reusable across domains instead of duplicated per-router.
- **Voice/Video Studio isolation:** stays inside the monolith (one deployment), but its router + integration client are treated as a narrow-interface internal module — cheap to extract into its own service later if usage or cost ever justifies it. Nothing else gets this treatment yet.

## 2. Settled principles (carried forward, not open decisions)

- **Server Actions can't be the shared backend surface.** They're Next.js-only RPC — React Native can't call them. Anything both clients need is a tRPC procedure. Server Actions may still be used *inside* `apps/web` for genuinely web-only mutations.
- **No secret ever ships in the mobile bundle.** RN binaries are effectively public. Every privileged Supabase query, and every call to Groq / Fish Audio / Paystack / Stripe / Resend / platform posting APIs, stays server-side and is proxied through the backend. (Post_Streak_App 2.md §32 already states this; nothing to resolve, just enforcing it structurally.)

## 3. File map

| File | Purpose | Data model |
|---|---|---|
| `apps/web/app/api/trpc/[trpc]/route.ts` | tRPC HTTP entrypoint (Next.js Route Handler) | — |
| `apps/mobile/src/api/client.ts` | Mobile tRPC + React Query client, bearer-token auth | — |
| `packages/api/context.ts` | Request context, dual cookie/bearer auth resolution | — |
| `packages/api/root.ts` | Merges all routers into `appRouter`, exports `AppRouter` type | — |
| `packages/api/routers/accounts.ts` | Profile, onboarding, account closure | `20260814000001_accounts_and_identity.sql` |
| `packages/api/routers/social-scheduling.ts` | Platform connections, scheduled posts | `20260814000002_social_scheduling.sql` |
| `packages/api/routers/streak-gamification.ts` | Streak, Jarvis, freezes, credits, milestones | `20260814000003_streak_jarvis_gamification.sql` |
| `packages/api/routers/creator-network.ts` | Discovery, matches, messages, briefs, squads | `20260814000004_creator_network.sql` |
| `packages/api/routers/voice-studio.ts` | Voice projects, series voices, minutes wallet | `20260814000005_voice_studio.sql` |
| `packages/api/routers/billing.ts` | Plans, subscriptions, checkout | `20260814000006_billing_and_subscriptions.sql` |
| `packages/api/routers/safety-moderation.ts` | Block, report, staff moderation queue | `20260814000007_safety_and_moderation.sql` |
| `packages/api/routers/analytics.ts` | Generic event ingestion | `20260814000008_analytics_events.sql` |
| `packages/api/routers/missions.ts` | Daily mission recommendation surface — *added during Stage 3, see §7* | `20260814000009_missions.sql` |
| `packages/api/routers/duels.ts` | Two-person streak accountability pairing — *added during Stage 5, see §8* | `20260814000010_duels.sql` |
| `packages/api/routers/admin.ts` | Feature flags, configuration, cross-domain analytics — *added during Stage 6, see §9* | — |
| `packages/integrations/index.ts` | Vendor clients: Paystack, Stripe, Groq, Fish Audio, Resend, LinkedIn, X | — |
| `packages/shared-types/index.ts` | Types needed outside the tRPC type-safety boundary | — |
| `packages/validation/index.ts` | Zod schemas shared by API input validation and client forms | — |
| `packages/jobs/index.ts` | Cron dispatch targets + a minimal async job queue | — |

## 4. Assumptions & flagged decisions

Lower-stakes than Stage 1's blocking questions — picked a working default for each rather than opening a third round of questions. All **ASSUMED**, all cheap to overturn since nothing real is built on top yet.

| # | Item | Default picked | Why |
|---|---|---|---|
| J | Background jobs | Minimal DB-backed job table + polling worker, no new vendor | Vercel Cron alone doesn't fit streak-rescue's finer-than-daily timing or a potentially slow Voice Studio render. A managed queue (Inngest/Trigger.dev) is the natural upgrade if this becomes a bottleneck — not needed on day one. |
| K | Realtime transport (chat, live match/leaderboard updates) | Supabase Realtime | Already paying for Supabase, RLS-aware, no new vendor. Pusher/Ably stay on the table if scale ever demands more headroom. |
| L | Rate limiting / abuse control | DB-backed counters, checked in `packages/api/context.ts` | No new vendor before real traffic justifies one. Upstash Redis is the natural upgrade path if latency or DB load becomes a problem. |
| M | Auth session model | Dual-mode: cookie session (web) or bearer token (mobile), one resolution path in `context.ts` | Necessary once mobile is a first-class client — not really a close call. |

## 5. Explicitly out of scope this pass

No `package.json`, `turbo.json`, `tsconfig.json`, or any real workspace/tooling config — that's build-time setup, not planning. No stub files for Meta/TikTok integrations (planned, not in progress — stubbing them now would overstate where they stand). No `packages/config/` (shared lint/tsconfig) yet.

## 6. Next

Feeds Stage 3 (FRONTEND_ARCHITECTURE — `apps/web` routes, `apps/mobile` screens, `components/`) and Stage 4 (AI ORCHESTRATION — the Groq client in `packages/integrations/` gets its own deeper pass there, this stage only reserves its place). Open items from Stage 1 (Jarvis state count, RLS philosophy, source-file provenance) are unaffected by this stage and still carry to OPEN_QUESTIONS (Stage 8).

**Waiting for "approved, continue" (or corrections) before starting Stage 3: FRONTEND_ARCHITECTURE.** *(Approved 2026-08-14.)*

## 7. Addendum — added during Stage 3 (2026-08-14)

The Missions domain (see `supabase/DATA_MODEL.md` §6) was confirmed in scope during Stage 3, after this stage had already been approved. `packages/api/routers/missions.ts` was added to keep the router set matching the data model 1:1. The recommendation logic itself is still unbuilt and unscoped — reserved for Stage 4 (AI ORCHESTRATION).

## 8. Addendum — added during Stage 5 (2026-08-14)

Duels (see `supabase/DATA_MODEL.md` §7) confirmed in scope during WORKFLOWS. `packages/api/routers/duels.ts` added to match. Reward issuance and nudge delivery are workflow/cron-triggered, not exposed as user-invoked procedures — see `packages/workflows/duel-lifecycle.ts`.

## 9. Addendum — added during Stage 6 (2026-08-14)

`packages/api/routers/admin.ts` added — everything admin-specific that doesn't belong to an existing domain router (feature flags, configuration, cross-domain analytics rollups in `packages/analytics/`). Domain-specific staff actions stay in their own domain router, just gated by role, rather than duplicated into `admin.ts`: user sanctions in `routers/accounts.ts`, report resolution in `routers/safety-moderation.ts`, refunds/reconciliation in `routers/billing.ts` — each updated this stage with a short note.
