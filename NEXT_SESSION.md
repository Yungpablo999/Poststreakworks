# PostStreak: hand-over for the next session (2026-10-05)

Read this, then `LIVE_PLAN.md` (status log + hand-over table) and `backend/STAGING_RUNBOOK.md` (settings, payments, prod
migrations). This file is the short version: where things stand, what's left before real testing, what blocks it, and what to
improve.

## Where the work is

- **Repo:** `C:\Users\Trucksoft IT\dev\poststreak` (GitHub `Yungpablo999/Poststreakworks`). The OneDrive `Poststreakworks`
  folder is an old scaffold: don't use it.
- **Branch:** `live/real-backend`, 20 commits ahead of `master`, **local only, not pushed** (ask the owner before pushing).
  Last commit: `af46de1`. Working tree clean.
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
