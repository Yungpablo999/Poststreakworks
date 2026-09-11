# PostStreak — Go-Live Plan

**Last updated: 2026-09-11.** This is the honest, verified state of the project — not a wishlist.
Everything marked "done" was tested live against the real Supabase project this session, not just
reviewed by reading code. Everything marked "left" is a real, scoped gap. Update this file as work
lands; don't let it go stale. See [PROJECT_STATE.md](PROJECT_STATE.md) for the deeper technical
history behind each item here.

## How to read this

- ✅ = verified working end-to-end (real data, real auth, tested live)
- ⚠️ = built but with a known gap, documented below
- ❌ = not built yet
- Each item names **who owns it** (Backend / Frontend / Infra / Product) so this can be split across
  the team directly.

---

## 1. What's actually done (verified this session, not assumed)

- ✅ **Auth** — sign-up and sign-in both return a real JWT immediately (temp/staging mode:
  email auto-confirmed server-side, see PROJECT_STATE.md §"Scope decisions"). Rate limiting
  confirmed working (it rate-limited *me* during this session's testing).
- ✅ **Database** — v1's live production data (28 users, 66 posts, etc.) fully aligned into the new
  53-table schema, zero data loss, RLS enabled everywhere.
- ✅ **Dashboard & Pro Dashboard** — level/streak/XP now reads real data (was hardcoded mock in both
  screens independently until this session).
- ✅ **All core GET endpoints** — auth/me, earnings (summary + campaigns), matches/creators,
  messages/conversations, platforms, quests (challenges/daily/streak), schedule/posts, user
  (profile/passport/opportunity-readiness) — swept with a real token, all return 200 with correct
  data.
- ✅ **Jarvis AI content engine** (ideas, script, caption, optimize-hook) — **was completely down**
  (both the primary and fallback AI model names had been retired by their providers) until this
  session. Verified with real generated content now.
- ✅ **Match/Discovery/Pitch flow** — **was completely broken for every user, always** (a bad RLS
  policy compared the wrong two UUIDs). Fixed and verified: swiping, saving, and sending a pitch to
  another creator all work now.
- ✅ **Creator Passport public view** (`accounts.getPublicProfile`) — **was completely broken for
  every profile, always** (unauthenticated request + an `!inner` join that could never succeed).
  Fixed and verified.
- ✅ **Staff moderation actions** (`sanctionUser`, `resolveReport`) — were silently no-ops (RLS
  filtered the account-status update to zero rows with no error). Fixed.
- ✅ **Platform connect/disconnect** — works (see §4 for the real-OAuth gap this doesn't cover).
- ✅ Two fully-seeded dummy accounts exist for any manual testing — see PROJECT_STATE.md for
  credentials. `backend/scripts/seed-dummy-data.js` can reseed if needed.

**The pattern behind most of the fixes above**: every one of them was found by actually running the
seeded dummy data through the real API with a real token — not by reading the code. That's worth
keeping in mind for what's *not yet* been round-trip tested (§3, §4).

---

## 2. Backend — remaining work

| Item | Owner | Priority | Notes |
|---|---|---|---|
| Dummy/mock payment flow | Backend | **Blocking** | Decided (no real Paystack/Stripe) but **not built** — `billing.createCheckout` still calls the real Paystack/Stripe integrations directly and will fail with no real keys. Needs a mock path: e.g. an env flag that skips the processor call and directly creates an `active` `subscriptions` row + a `payment_transactions` row with a fake processor ID, mirroring what the webhook handlers do today. |
| Growth/analytics data pipeline | Backend + Product | Blocking for Growth screens only | `packages/analytics/*` (9 modules) and 4 REST routes are honest 501 stubs — no per-creator/per-platform metrics pipeline exists. Real fix needs either (a) a lightweight pipeline pulling basic metrics from connected platforms, or (b) a product decision to ship v1 without real growth analytics and show a "coming soon" state instead of blocking the screens entirely. |
| Real OAuth for platform connect | Backend | Non-blocking for demo, blocking for real users | `POST /api/v1/platforms/[id]/connect` stores whatever token it's handed directly — no real LinkedIn/X authorize+callback flow exists. Fine for internal testing (already works with any string as a "token"); a real user cannot actually connect their real LinkedIn/X account yet. |
| Voice Studio | Backend | Deferred (product decision) | Not building yet — explicitly out of scope for this launch. |
| Apple / Microsoft Sign-In | Backend | Deferred (product decision) | Auth is email+password JWT for now. Needs real credentials from Apple/Azure when this becomes a priority. |
| RLS audit of remaining tables | Backend | Should-do before launch | Two systemic RLS bugs were found and fixed this session (`users` cross-read gap, `discovery_actions` wrong-column comparison) purely by testing. `collaboration_tasks` has the same `assigned_to = auth.uid()` shape as the broken `discovery_actions` policy and has **not** been verified — no router queries it yet, but whoever wires it up next should check its RLS before assuming it works. |
| Automated tests | Backend | Should-do before launch | Zero automated tests exist anywhere in `backend/`. CI only runs typecheck + lint. At minimum: rate limiting, tier entitlements, the cron dispatcher, and now the RLS policies that broke silently twice. |
| Full REST route sweep | Backend | Should-do before launch | This session swept all GET routes and the most important POST routes. Not yet individually tested: `auth/reset-password`, `schedule/posts/[id]` (PUT/DELETE), `quests/[questId]/complete`, `earnings/payout`, cron dispatch, both payment webhooks. None have a *known* issue — they just haven't been round-trip tested yet the way everything above was. |

---

## 3. Frontend — remaining work (the big one)

**The honest scope**: of 47 screens, only `DashboardScreen` and `ProDashboardScreen` receive any
real backend data as props (both fixed this session). Every other screen's `Props` interface takes
only navigation callbacks and `userProfile` — confirmed by inspecting every single screen's props,
not by sampling. `App.tsx` makes exactly one data-fetching call anywhere in the app
(`QuestsService.getStreakStatus`). This is not a criticism of the frontend work — the screens
themselves are built, polished, and match the design — it's simply that the backend-connection pass
hasn't started for them yet.

**The pattern to replicate for each one** (proven twice now, on Dashboard and ProDashboard): add a
fetch in `App.tsx`, add a prop to the screen, replace the screen's hardcoded literals with that prop,
verify live with the seeded dummy account. Each screen below is grouped by the backend feature area
it needs, with that area's readiness noted.

| Screens | Needs | Backend readiness |
|---|---|---|
| `CreateScreen`, `ProCreateScreen`, `PostComposerScreen`, `ProPostComposerScreen`, `ScheduleScreen`, `ProScheduleScreen` | `schedule/posts` CRUD + `platforms` list | ✅ Ready |
| `CaptionScreen`, `ProCaptionScreen`, `ScriptScreen`, `ProScriptScreen`, `ContentAngleScreen`, `IdeaDetailScreen`, `JarvisProScreen`, `ProIdeaStrategyScreen`, `ProRepurposeScreen` | `jarvis/*` (ideas, script, caption, optimize-hook) | ✅ Ready (just fixed this session) |
| `QuestsScreen`, `ProQuestsScreen`, `MissionDetailScreen`, `ProMissionDetailScreen`, `ChallengeDetailScreen` | `quests/*` (daily, streak, challenges, complete, join) | ✅ Ready |
| `EarningsScreen`, `ProEarningsScreen` | `earnings/*` (summary, campaigns, goal, payout) | ✅ Ready |
| `MatchScreen`, `ProMatchScreen`, `FindSquadScreen`, `ProSquadScreen`, `CollabIdeaScreen` | `matches/creators`, `matches/pitch`, discovery actions | ✅ Ready (just fixed a completely-broken flow this session) |
| `MessagesScreen`, `ProMessagesScreen` | `messages/conversations`, `messages/send` | ✅ Ready (just fixed a hard 500 this session) |
| `CreatorPassportScreen` | `user/passport`, public profile lookup | ✅ Ready (just fixed a completely-broken feature this session) |
| `PlatformConnectScreen` | `platforms` (list/connect/disconnect/sync-all) | ✅ Ready for the "any string works as a token" version; real OAuth is a backend gap (§2) |
| `GrowthScreen`, `ProGrowthScreen`, `AudienceBreakdownScreen`, `PlatformGrowthScreen`, `PostPerformanceScreen` | `growth/*` | ❌ **Blocked** — backend returns honest 501s, see §2 |
| `OpportunityReadinessScreen` | `user/opportunity-readiness` | ✅ Ready |
| `ProVoiceStudioScreen` | voice generation | ❌ Deferred — not in scope for this launch |
| `SplashScreen`, `WelcomeScreen`, `SignInScreen`, `SignUpScreen`, `ResetPasswordScreen`, `NicheSelectionScreen`, `OnboardingCompleteScreen` | Auth actions only | ✅ Already functional (these are action-driven, not data-display screens) |

**Suggested sequencing** (not a mandate — confirm with the team): Create/Compose first (the core
action loop), then Jarvis AI screens (highest "wow factor," backend just got fixed), then
Quests/Earnings, then Match/Messages/Passport (already backend-verified, just needs the plumbing),
then Platform Connect. Leave Growth screens for last since they're backend-blocked regardless.

---

## 4. Known gaps that are fine to launch with, if the team agrees

- **Platform connect stores any string as a token** — fine for internal/demo use; real users
  connecting real accounts needs the OAuth work in §2 first.
- **"5 Platforms Connected" is still hardcoded** on `ProDashboardScreen` — `UserProfileData` has no
  platform-count field yet, small follow-up once `PlatformConnectScreen` is wired.
- **Growth screens have nothing to show** — either ship with a "coming soon" state or build the
  minimum pipeline (§2), a product call either way.

---

## 5. Infra / Deployment — Owner: Infra + whoever has Vercel/hosting access

- ❌ **Nothing is deployed anywhere.** `master` (staging) and `main` (prod) both exist as branches
  only — there is no running staging or production environment yet. All verification this session
  was against `localhost` with the real Supabase project.
- The code assumes Vercel (the `CRON_SECRET` convention matches Vercel Cron's auth header pattern) —
  confirm that's still the plan, and get a project created if not.
- Once a real deploy exists: re-run this session's REST route sweep against the real deployed URL,
  not just localhost — CORS, environment variable propagation, and cold-start behavior are all things
  that can differ between local dev and a real deployment.
- Environment variables needed on the deployed backend: everything currently in
  `backend/apps/web/.env.local` (see PROJECT_STATE.md §5 for the list — not the values, those aren't
  committed anywhere and need to be re-entered), **with `AUTH_DEV_AUTOCONFIRM` explicitly unset or
  `false` in the production environment** — it must never ship live email auto-confirmation.
- GitHub repo is temporary (`Yungpablo999/Poststreakworks`) — org repo migration is a separate,
  later task per product decision; don't block launch on it.

---

## 6. Security / pre-launch checklist — Owner: Backend + whoever signs off on launch

- [ ] Confirm `AUTH_DEV_AUTOCONFIRM` is off in the production environment (see §5 — this is the
  single most important item on this list; shipping it on in prod means anyone can sign up with any
  email, confirmed, no verification, ever).
- [ ] Real email verification or an OAuth provider needs to replace the dev auto-confirm flow before
  real users sign up in production.
- [ ] Rotate/regenerate the Supabase DB password and service-role key if they were ever shared
  outside a secure channel during development.
- [ ] Run the full RLS audit mentioned in §2 — two policies were already found silently broken this
  session; a systematic pass (not just the tables that happened to get exercised) is warranted before
  trusting RLS as the security boundary it's designed to be.
- [ ] Add automated tests for anything security-relevant before launch, not after (§2).
- [ ] Webhook endpoints (Paystack/Stripe) are deliberately unrated-limited — confirm their signature
  verification is real and tested once real payment keys exist.

---

## 7. Go / No-Go

**Ready to demo internally today**: Auth, Dashboard/Pro Dashboard, and — once wired — Create/Compose,
Jarvis AI, Quests, Earnings, Match/Messages/Passport. All backend-ready, all verified this session.

**Not ready for real users yet, regardless of frontend wiring progress**:
- Dummy payment flow doesn't exist yet (§2) — anyone hitting "Upgrade to Pro" today gets a real
  Paystack/Stripe error.
- `AUTH_DEV_AUTOCONFIRM` must be off before any real user signs up (§6).
- Nothing is deployed (§5) — this whole plan describes localhost-verified state.
- Growth screens have no real data behind them (§2/§3) — ship with a placeholder state or wait.

**Suggested next milestone**: wire Create/Compose + Jarvis AI screens (both backend-ready, highest
product value), build the dummy payment path, and get a real staging deployment up — those three
things together would make "internal team can use the real app end to end" true, which is the
natural checkpoint before opening it to real users.
