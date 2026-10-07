# PostStreak: hand-over for the next session (updated 2026-10-07)

Read this, then `LIVE_PLAN.md` (status log + hand-over table) and `backend/STAGING_RUNBOOK.md` (settings, payments, prod
migrations). This file is the short version: where things stand, what's left before real testing, what blocks it, and what to
improve.

## Pick up here (2026-10-07)

- **Waiting on the team** for Vercel access and the right to create a Supabase project (the owner is already a Supabase org
  member). When they land: create the staging project, apply migrations, deploy the API and app to two Vercel projects,
  `staging.poststreak.app` + `api-staging.poststreak.app`, then the owner signs up and connects their own socials. The plan,
  step by step, is in the team doc "PostStreak: go-live report and access requests" (section "Next: a stable staging").
- **Platform keys** for all five are in `backend/apps/web/.env.local` (git-ignored); four proven valid, Instagram's only
  provable on a real sign-in. Details: `LIVE_PLAN.md` → Platform keys check.
- **The frontend team's work isn't in this repo.** The live landing page `www.poststreak.app` (Next.js, waitlist "Get early
  access", dark mode) comes from a repo we can't see; `app.poststreak.app` still serves the old sample-data app. Ask the owner
  for access to that repo before merging or touching the landing page, and reconcile its dark mode with this branch's app.
- **Team docs:** go-live report https://claude.ai/code/artifact/2b92cee9-1c60-498f-8ba6-ec981d80b17c (offline copies in
  `Documents\PostStreak team docs`).

## Where the work is

- **Repo:** `C:\Users\Trucksoft IT\dev\poststreak` (GitHub `Yungpablo999/Poststreakworks`). The OneDrive `Poststreakworks`
  folder is an old scaffold: don't use it.
- **Branch:** `live/real-backend` (pushed to GitHub on 2026-10-07 at the owner's request; see `git log` for the latest
  commit). Open a pull request to `master` only after the security review of the payments and sign-in changes.
- **Run it:** `npm run local` from the repo root (Docker Desktop must be running). App http://localhost:8081, API :3000,
  mail catcher :54324, stand-ins :4010 (five platforms, Stripe, the model). `npm run local -- --reseed` resets the four test
  accounts; `npm run local -- --stop` stops everything.
- **Working method (the owner's request):** top-down, one module at a time: build → unit/DB tests → e2e script on the local
  stack → headless-browser walkthrough at 1280 and 390 px → Android/iOS bundles build → one commit saying what was checked.

## Done (all real, all tested)

| Area | State |
|---|---|
| Sign-in | Email code (real), Google/Apple via Supabase (needs provider setup), one-tap test accounts (local only) |
| Socials | TikTok, Instagram, Threads, Facebook, YouTube: connect → sealed tokens → daily sync → disconnect. Free plan: 2 accounts |
| Home, bell, quests, challenge, XP, calendar | From the creator's own rows |
| Growth | From what connected accounts report; Pro: growth month by month |
| Posts | Planned → ready (cron + bell note) → "I posted it" per platform; remind me later; edit; delete. No auto-posting |
| Writing tools | Script, captions, hooks (Pro), Repurpose (1 free/week), ideas (Pro topic ideas), Jarvis chat. Server-checked replies, daily allowance counted atomically and refunded on failure. Hidden when the server has no AI |
| Drafts, saved hooks | Saved to the account; drafts reopen where they were left |
| Pro & billing | Stripe checkout; Pro only via Stripe's signed webhook; each event once; cancel/keep at Stripe; ends when the paid month does (cron, migration …27). Phone apps don't sell Pro (store rules) |
| Honesty sweep | No mock data, canned AI, fake delays, dead buttons, or Pro promises the server can't keep |
| Checks | 696 backend tests; e2e: local 55, social 171, posts 89, studio 63, billing 36; browser tours of every page × 4 accounts; Android/iOS bundles build |

## To do before real (non-local) testing

1. **Security review of the branch** (owner's rule for payments/auth diffs) — then push `live/real-backend` and open a PR to
   `master` with a reviewer.
2. **Hosted staging:** a Supabase project + two Vercel projects (API at `backend/apps/web`, app at the root). Settings:
   `backend/STAGING_RUNBOOK.md` §1–4.
3. **Apply migrations `…19`–`…27` to staging**, then run the smoke test (§6).
4. **Keys on staging:** `GROQ_API_KEY` (+ `GEMINI_API_KEY`), the five platforms' app keys + redirect addresses + tester
   accounts, Stripe test keys + webhook endpoint (§3a), Resend SMTP in Supabase for real email, `CORS_ALLOWED_ORIGINS`,
   `APP_WEB_URL`, a new `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`.
5. **Real-device test:** a development build (`expo run:android` / `expo run:ios` or EAS) on a phone: platform hand-back
   links (`poststreak://…`), keyboard, safe areas, sign-in persistence.
6. **Production** only after staging passes: backup, migrations `…19`–`…27` with a second reviewer, then the env switch
   (runbook §7). `git push origin master:main` is the owner's to run (the permission layer blocks it for Claude).

## Blockers and how to clear them

| Blocker | Who | How |
|---|---|---|
| No hosted environment exists | Owner (account owner) | Create the Supabase + Vercel projects (runbook §1–4) |
| No AI key → writing tools hidden off this machine | Owner | Groq key (Gemini as fallback) in the API settings |
| Platforms only work for testers until app review | Owner | Add tester accounts now; submit Meta / Google / TikTok reviews with screen recordings from staging |
| Platform keys (2026-10-06) | Owner | TikTok, Threads, Facebook and Google keys are in `.env.local` and valid; Google's production return address is registered. Instagram's full secret was pasted later the same day (proven only by a real sign-in). Full connections need staging (https): waiting on Vercel access and Supabase project rights; the owner is a Supabase org member. Details: `LIVE_PLAN.md` → Platform keys check |
| Stripe not set up | Owner | Test keys + webhook (§3a); later live keys |
| Selling Pro in the phone apps | Owner (product decision) | Keep "buy on the web", or add App Store / Play billing (RevenueCat is the quick route) |
| Exposed secrets (screenshots, old demo password in git history) | Owner | Reset each at the provider; keep new ones only in the vault / host settings |
| Live DB on the old schema | Owner + a reviewer | Backup, staging first, apply `…19`–`…27`, check the subscriptions query in runbook §7 before `…27` |
| This machine: ~600 MB free RAM | — | Close other apps when testing; first requests after a restart are slow (dev compile), so warm up |
| Stray `C:\TRUCKS~1\` folder (earlier session's typo) | Owner | Safe to delete by hand |

## Way forward (suggested order)

1. Security review → push branch → PR to `master`.
2. Staging up with keys → smoke test → record platform connections for app reviews.
3. Phone dev build on real devices (Android first; iOS needs a Mac/EAS).
4. Product numbers: `aiEditsPerDay` (10) and Jarvis chat limits are placeholders; the naira price for Paystack.
5. Production rollout per runbook §7.

## Areas to improve

- **Notifications beyond the app:** reminders are in-app only; add push (Expo notifications) and/or email for "time to post".
- **Phone purchases:** App Store / Play billing if Pro should be sold in the apps.
- **App tests:** the Expo app has no test runner; add Jest + React Native Testing Library for the backend clients
  (`src/backend/*`) and key screens. The CDP browser walkthroughs used here live in a temporary folder — turn them into a
  committed Playwright suite in CI.
- **CI:** run the e2e scripts in CI against a Supabase container (today they run by hand).
- **Lint for the app:** only the backend is linted; add ESLint (with unused-imports) to the Expo app.
- **Leftovers:** a few unused styles in the sign-in screens; small unused helper exports (`getCapabilities`, `findAccount`,
  theme tokens); the old `frontend/mobile` and `frontend/web` scaffolds and `backend/scripts/seed-dummy-data.js` (targets the
  live DB) can be removed.
- **Request timeout:** the app gives up after 20 s; fine in production, but cold dev routes can exceed it.
- **Observability:** add error reporting (Sentry) and per-user AI cost logging before real users.
- **Audience details** (ages/places) stay hidden until a platform gives them; auto-posting needs each platform's posting approval.
