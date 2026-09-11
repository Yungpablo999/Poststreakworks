# PostStreak — Backend Engineering State

**Read this first, every session.** This file exists because chat history is not durable — accounts
get reset, new chats start cold. This is the actual source of truth for what's been built, what's
real vs. stub, and what to do next. Keep it updated as work progresses; don't let it go stale.

Last updated: 2026-09-11.

### Dummy test accounts (2026-09-11) — use these for any manual/frontend testing

Two real, fully-seeded accounts exist in the live Supabase project so every wired screen has
something real to render:
- **Primary**: `demo@poststreak.app` / `DemoUser2026!` — "Amara Demo", pro tier, 12-day streak,
  level 4, connected LinkedIn+Twitter, 8 posts (published/scheduled/draft), an active subscription,
  earnings history, an active duel + squad + match + conversation with the counterparty below,
  quest progress, notifications, milestones, referral history.
- **Counterparty**: `demo-creator-2@poststreak.app` / `DemoUser2026!` — "Kwame Creates", exists purely
  so Amara's matches/duels/squad/messages have a real counterpart — deliberately NOT a reused real v1
  user (don't attach fake social data to a real founder's account).
- Seed script: `backend/scripts/seed-dummy-data.js` (run once already; not idempotent — see its header
  before re-running). Also seeded the global `quests`, `community_challenges`, and `brand_campaigns`
  catalogs, which were completely empty project-wide before this.

**A real, systemic bug was found and fixed while verifying this end to end**: `ctx.supabase` in tRPC
context is request-scoped to the caller's own JWT, so RLS applies — and `users` only has a
`users_select_own` policy. Every router embedding another user's `display_name`/`avatar_url` via
`users!fk(...)` was silently returning null (or, with `!inner`, dropping the row entirely) for anyone
but the caller. Fixed in `creator-network.ts` (conversations/messages), `duels.ts`,
`accounts.ts.getPublicProfile` (this one was **completely broken for every profile, always** — it's a
`publicProcedure` with `!inner`, so `auth.uid()` is null and the join can never succeed),
`safety-moderation.ts`, and `admin.ts`. The `admin.ts`/`safety-moderation.ts` `sanctionUser`/
`resolveReport` mutations had a worse variant: `users.update({account_status})` on a target user
would be silently filtered to zero rows by RLS (not an error), so staff warn/restrict/suspend actions
never actually took effect. All fixed the same way: a narrow `createSupabaseServiceClient()` lookup/
write for exactly the fields that need cross-user access, everything else stays on `ctx.supabase` so
RLS keeps governing row visibility normally. Verified live post-fix (see git log for the commit).

### Scope decisions locked in on 2026-09-10 (apply, don't relitigate)

- **Postiz: dropped entirely.** Not using it for multi-channel or anything else. Ignore every earlier
  note about Postiz being the multi-channel engine. Direct-API integrations only (LinkedIn/X are
  ported; other channels are unscoped for now, not Postiz).
- **Auth for now: plain JWT via email+password.** Sign-up/sign-in auto-confirm the email server-side
  (gated on `AUTH_DEV_AUTOCONFIRM=true`, which MUST be off in production) and always return a real
  Supabase session token, so the frontend team can wire authenticated screens without the
  email-verification round trip. Google/Apple/Microsoft OAuth sign-in: deferred.
- **Payments: dummy/mock flow.** No real Paystack/Stripe integration or keys for now — billing
  screens get wired against a stubbed payment path.
- **Voice Studio / Fish Audio: future work.** Don't wire Voice screens or build the Fish Audio
  integration yet.
- **GitHub repo is temporary.** An org repo comes later; don't over-invest in repo-specific CI or
  settings on `Yungpablo999/Poststreakworks`.

## 1. Your role here

You are the **backend engineer** on PostStreak, an AI-powered social scheduling / streak-tracking app
for African creators. A **separate frontend team** builds the actual screens (root-level Expo app).
Your job is backend APIs, database, security, and — now — wiring already-built frontend screens to
real endpoints. Don't rewrite frontend screen internals beyond the minimal plumbing needed to connect
them to real data (add a prop, add a fetch call in `App.tsx`) — the visual/UX work isn't yours.

**Standard bar: production grade.** Not hacky. The user has caught and reacted strongly to real bugs
(CORS gaps, config-clobbering, broken lint) — "production grade" is a real, enforced standard here,
not a throwaway phrase. Before every push: `pnpm typecheck` **and** `pnpm lint` from `backend/`, every
time, both, not just one.

## 2. Repo structure

One GitHub repo: `https://github.com/Yungpablo999/Poststreakworks` (owner: Yungpablo999).

```
/                           repo root — the ACTUAL, actively-developed frontend
  App.tsx                   ~1800 lines. THE integration point — owns all data-fetching state
                             (useAuth, service calls) and passes results down to screens as props.
                             Screens are mostly presentational; almost none import services directly.
  src/
    screens/                44 screen components (DashboardScreen.tsx, QuestsScreen.tsx, etc.)
    context/AuthContext.tsx real, wired: signIn/signUp/signOut, session persisted via AsyncStorage
    context/SubscriptionContext.tsx
    api/apiClient.ts        thin fetch wrapper, bearer token injection
    api/services.ts         typed service methods (AuthService, QuestsService, EarningsService,
                             GrowthAnalyticsService, SocialPlatformsService, JarvisEngineService)
    types/models.ts         UserProfile, GrowthMetrics, etc.
  frontend/                 SCAFFOLDING ONLY — mobile/web/shared subfolders, early-stage, not the
                             active app. Do not confuse with root App.tsx/src/. Contains
                             frontend/shared/constants/apiRoutes.ts — the REST contract both sides
                             already agree on (verified 1:1 against backend routes, zero drift).
  backend/                  Turborepo/pnpm workspace — everything you build lives here
    apps/web/                 Next.js 15 (Turbopack) — hosts tRPC, REST wrapper, webhooks, cron, admin
      app/api/trpc/[trpc]/     tRPC endpoint
      app/api/v1/*/            REST wrapper routes the frontend actually calls (40 routes)
      app/api/payments/*/webhook/  Paystack, Stripe webhook handlers
      app/api/cron/dispatch/    scheduled post dispatcher (real, ported from v1)
      app/admin/                 staff-only dashboard, real auth gate, placeholder page bodies
      middleware.ts              CORS (reflects Origin, explicit OPTIONS handling)
      next.config.ts              turbopack.root fix (workspace-root misdetection otherwise)
      .env.local                 REAL CREDENTIALS — gitignored, DOES NOT PERSIST, see §5
    packages/
      api/                       tRPC routers (19), context.ts (auth+tier resolution), rate-limit.ts
      workflows/                 streak-engine.ts (real) + 9 *-lifecycle.ts files (STUBS)
      integrations/              linkedin, x, paystack, stripe, groq, fish-audio — ported from v1
      analytics/                 9 files, ALL STUBS (acquisition, activation, engagement, retention,
                                  network, collaboration, safety, ai-quality, revenue)
      ai/                        content-studio, mission-recommender, moderation, voice-generation
      jobs/                      cron dispatch logic — real, ported from v1 production code
      hooks/, design-tokens/, shared-types/, validation/  smaller support packages
    supabase/migrations/         18 files, see §4
  .env                       root — EXPO_PUBLIC_API_URL etc. for the Expo app. Gitignored.
  BACKEND_BUILD_PLAN.md, FRONTEND_BUILD_PLAN.md, OPEN_QUESTIONS.md, ROADMAP.md, SYSTEM_DESIGN.md,
  PostStreak Architecture Document.md, PostStreak_Creator_Engine_Strategy 2.md, Post_Streak_App 2.md
                             pre-existing founder/architecture docs — static plans, not living state.
  architecture/              an OLDER, generic Express/Prisma/Redis/JWT reference doc set — NOT the
                             adopted stack. Only route contracts/entitlement numbers were extracted
                             from it; the actual stack is tRPC + Supabase (founder-approved).
```

## 3. Branching & workflow (established, don't relitigate)

Exactly two branches on GitHub: **`master` = staging**, **`main` = production**.
- All work lands on `master` first (direct commits are fine — this is the working branch).
- Only promote `master` → `main` after staging has been validated (CI green **and**, ideally, a real
  deploy smoke-tested — CI alone is code-correctness, not a live-environment check).
- CI (`.github/workflows/ci.yml`) runs typecheck + lint on push/PR to both branches.
- No other long-lived branches — feature branches get merged into `master` and deleted, not kept
  around (this was a deliberate cleanup; `wire-auth-dashboard` / PR #2 was merged then deleted).

## 4. Database — Supabase

Project: `ngcbxdnbkxthvzximaez` (URL: `https://ngcbxdnbkxthvzximaez.supabase.co`, region
`eu-west-1`, pooler host `aws-1-eu-west-1.pooler.supabase.com:6543`).

**Critical context: this is v1's live production database, not an empty project.** It already held
real user data (28 users, 66 posts, 12 platform tokens, 18 streak rows, etc.) under v1's old schema
(`posts`, `user_streaks`, `user_tokens`, `user_plans`, `referrals`, `autopilot_configs`,
`email_sequences`, `voice_profiles`, `user_preferences`, `streak_events`→renamed
`streak_events_v1_legacy`) when this backend build started.

**Schema alignment already done** (commits `62211b0`, `1011a06` on `master`): all 18 migrations ran
successfully against the live project. Result verified: 53 public tables, RLS enabled on every one,
**zero data loss** — every old row carried forward 1:1 into the new schema (`users`, `scheduled_posts`,
`platform_connections`, `streak_states`, `subscriptions`, `rate_limit_buckets`, etc.) while the old
v1 tables were left intact and untouched, not deleted.

Two real bugs were found and fixed by actually running the migrations (not caught by review):
1. v1 already had an `on_auth_user_created` trigger on `auth.users` bootstrapping
   `user_plans`/`user_streaks`/`referrals` on signup. The new migration's `CREATE OR REPLACE FUNCTION`
   would have silently replaced it, breaking that bootstrap for all future signups. Fixed: both
   behaviors now run from one merged `handle_new_user()`, trigger uses `CREATE OR REPLACE TRIGGER`.
2. 10 of 66 live `posts` rows had a null `scheduled_at` (published immediately, never pre-scheduled),
   but `scheduled_posts.scheduled_at` is `NOT NULL`. Fixed with `coalesce(scheduled_at, posted_at,
   created_at)` — verified no row is null on all three source columns.

`streak_states` rows are created **lazily** (first streak-qualifying action, e.g. a publish), not
eagerly at signup — this is intentional design in `packages/workflows/streak-engine.ts`, confirmed
correct, not a bug.

Migration files are idempotent — safe to re-run the combined SQL if ever needed.

## 5. Credentials — what exists, and the part that WILL NOT survive a reset

The user provided real credentials directly in chat (not files) on ~2026-08-21/22. They currently
live **only** in two gitignored, uncommitted local files:
- `backend/apps/web/.env.local`
- root `.env`

**These files do not persist across a scratchpad reset, a machine change, or (almost certainly) a
Claude account reset.** They were never committed to git (correctly — never commit secrets), which
means a fresh session has to get them again. If you're starting fresh and these files don't exist:
**ask the user to re-paste the credentials** rather than guessing or leaving features silently broken.

What's been provided and confirmed working: Supabase (URL, anon/publishable key, service role/secret
key, **and the DB password** — `aws-1-eu-west-1` pooler shard, not `aws-0`), Groq, Gemini (wired as
fallback to Groq, not primary), Google OAuth client id/secret, X OAuth client id/secret, LinkedIn
OAuth client id/secret, `CRON_SECRET`, Resend, PostHog.

`AUTH_DEV_AUTOCONFIRM=true` also belongs in `backend/apps/web/.env.local` — see the 2026-09-10 auth
decision at the top of this file. It has no secret value, just set it.

Not needed anymore per the 2026-09-10 decisions: Paystack/Stripe keys (dummy payments), Fish Audio
key (voice deferred), Apple/Microsoft Sign-In credentials (OAuth sign-in deferred), Postiz. `SENTRY_DSN`
is still optional and not blocking.

A Supabase **Personal Access Token** (account-level, different from the keys above) was never
provided — only needed if the user wants Claude configuring Auth providers via the Management API
instead of doing it in the Supabase dashboard themselves.

## 6. Backend build status (as of last full audit)

19 tRPC routers, all mounted in `packages/api/root.ts`. 40 REST `/api/v1/*` routes, 2 payment
webhooks, 1 cron dispatcher. Typecheck + lint clean.

**Real:** auth (rate-limited), all 19 routers' core logic, cron dispatch (ported from v1 production),
LinkedIn/X/Paystack/Stripe/Groq/Fish Audio integration files, RLS deny-by-default everywhere, DB-backed
rate limiting (fixed-window, atomic Postgres RPC, fails open on infra errors), admin dashboard's
server-side `staff_admin` auth gate.

**Explicit stubs (marked in code, not hidden):**
- `packages/analytics/*` (9 files) — no data pipeline behind them
- `GET /api/v1/growth/*` (4 routes), `POST /api/v1/jarvis/rate-card` — honest 501s, need a
  per-creator/per-platform metrics pipeline that doesn't exist yet. OPEN DECISION (asked the user
  2026-09-10, not yet answered): serve **dummy analytics data** so growth screens can be wired now
  (consistent with the dummy-payments call), or leave them until a real pipeline exists.
- `packages/workflows/*-lifecycle.ts` + `*-journey.ts`/`*-flow.ts` (9 files) — structural stubs.
  Separate from `streak-engine.ts`, which is real and in active use.
- `packages/hooks/index.ts` — 6 frontend-facing React hooks, all `TODO`, arguably frontend team's
  territory not ours
- **Platform OAuth connect** (`POST /api/v1/platforms/[id]/connect`) stores whatever token it's handed
  directly — the real authorize+callback code exchange from v1 was never ported. The publish/refresh
  half in `integrations/{linkedin,x}.ts` IS real; only the auth half is missing.
- **Zero automated tests** anywhere in `backend/`. CI only runs typecheck + lint. For a "production
  grade" bar this is a real gap, not a nice-to-have — at minimum rate-limiting, entitlements, and the
  cron dispatcher deserve coverage.

## 7. Architecture decisions made mid-project (don't re-derive, just apply)

- **Gemini** is a fallback to Groq, not primary — not yet actually wired in code as of this writing,
  just credentialed. Check `packages/integrations/groq.ts` / wherever Groq is called before assuming
  this is done.
- **Sign-in with Google, Apple, and Microsoft** are all wanted. Google has credentials; Apple/Microsoft
  don't yet (§5). None of the three OAuth sign-in flows are built in the backend yet — current auth is
  email/password + Supabase OTP only.
- **Postiz: dropped** (2026-09-10). The earlier plan to use it for multi-channel publishing is dead.
  Note for context only: v1's live `posts` table has a `postiz_id` column, so v1 *was* publishing
  through Postiz — but we're not carrying that forward. Direct-API for LinkedIn/X; other channels
  unscoped.

## 8. Frontend wiring status — the current active work

**Verified live and working** (commit `bd383fd` on `master`):
- Sign-up and sign-in, full round trip against the real Supabase project, tested in-browser via the
  Expo web build at `localhost:8081` against the backend at `localhost:3000`. As of 2026-09-10 both
  routes auto-confirm the email server-side (gated on `AUTH_DEV_AUTOCONFIRM`) and always return a real
  JWT + `refreshToken`; sign-up with no password generates one and returns it as `generatedPassword`.
- `DashboardScreen`'s level/streak/XP display — this was **hardcoded mock text** (`"Level 42"`,
  `"47-Day Streak"`, `"2,450 XP"` as literal JSX strings, not bound to any prop) until commit
  `bd383fd`. Now reads from `userProfile` (which `App.tsx` already populated correctly from real API
  responses — the bug was purely that `DashboardScreen` never consumed it). Verified live: fresh test
  account correctly shows "Level 1", "0-Day Streak", "0 XP", "250 XP".

**The pattern to replicate for every other screen** (confirmed by checking Quests, Earnings,
PlatformConnect, CreatorPassport — 1,000–2,300 lines each): every screen's props interface is just
navigation callbacks + `userProfile`. **None of the other 43 screens receive real domain data as
props yet**, and most don't even have their mock content in a data array to swap out — it's
individually hand-coded JSX cards. Wiring each one means: (1) add a fetch in `App.tsx` mirroring the
existing `QuestsService.getStreakStatus()` pattern, (2) add a prop to the screen, (3) restructure that
screen's relevant JSX from hardcoded literals to prop-driven rendering. This is a genuinely large,
multi-session effort — treat each screen as its own real task, verify each one live in-browser before
moving to the next, exactly like the Dashboard fix.

**Suggested next target** (a judgment call, not a directive — confirm with the user): the
Create/Post/Schedule flow (`PostComposerScreen`, `ScheduleScreen`), since it's the core action loop,
vs. purely informational screens like Quests/Earnings/Growth. Growth-related screens should wait
until §6's analytics pipeline gap is closed — wiring them now would just surface 501s.

## 9. Local dev environment — practical notes

- **This session's actual working copy lives in a scratchpad temp directory, not the folder shown as
  the "working directory."** The scratchpad has been evicted (contents wiped, empty directory shells
  left behind) multiple times across this project's history — always `git status`/`ls` to check for
  emptiness before trusting a path, and re-clone fresh from `origin/master` if anything looks hollow.
  Everything important is pushed to GitHub immediately after it's verified, specifically so eviction
  is never real data loss, just a re-clone.
- To run both sides locally: `pnpm install` in `backend/`, `npm install` at repo root, recreate the
  two `.env`/`.env.local` files (§5), then `pnpm dev` in `backend/apps/web` (port 3000) and
  `npx expo start --web --port 8081` at repo root (port 8081) — **not** `CI=1`, that disables file
  watching/hot reload, which silently makes edits invisible until you notice nothing's updating.
- Turbopack workspace-root misdetection is already fixed (`next.config.ts`'s `turbopack.root`) — if
  dev server startup is suddenly slow again (30s+), check that fix hasn't been reverted.
- Before every push: `pnpm typecheck && pnpm lint` from `backend/`, both, every time.

## 10. If you're a fresh session reading this cold

1. Confirm you're working against `https://github.com/Yungpablo999/Poststreakworks`, branch `master`.
   `git log --oneline -10` should show this file's commit near the top — if not, you're stale, pull.
2. Ask the user for credentials (§5) before attempting anything that needs a live backend — don't
   assume old `.env` files survived.
3. Read `git log --oneline -30` and `git diff` against the previous few commits to see exactly what's
   landed since this doc was last updated — this file is a snapshot, not a replacement for git history.
4. Ask the user what to work on next rather than assuming — the honest answer as of this writing is
   "continue wiring screens one at a time," but priorities may have shifted.
