# PostStreak — Phase 1 backend: contract and alignment

**For:** the whole team (frontend, backend, and the agents working in each repo).
**Status:** built and tested on branch `backend/phase1-saved-work`; **not applied to any database yet**.
**Written:** 2026-10-02, in response to the product brief *PostStreak: New Direction, Current Build and
Plan* and the team's *PostStreak Backend: Step-by-Step Build Plan* (both 2026-10-02).

This does three jobs: (1) says how our backend lines up with the team's plan and where it deliberately
differs, (2) is the contract the app wires to, and (3) lists the security findings that matter
whichever architecture we end up with.

---

## 1. In one page

- The app is finished against in-memory sample data. Phase 1 gives each in-memory thing a real home
  (accounts state, drafts, saved hooks, check-ins, the weekly Repurpose count) plus a real **Ask Jarvis**
  endpoint that returns the exact reply shape `src/jarvis/chat.ts` already renders.
- **We keep our pattern:** Supabase for the database and sign-in, and a TypeScript API (tRPC + the REST
  routes under `/api/v1`, in `backend/apps/web`) in front of it. We take the team plan's **table names,
  phases, gates and working agreements**. See §2.
- **The one rule that holds in either architecture:** "people read and write only their own rows" is
  *not* enough for any table that carries a limit or an entitlement. Today, through the database
  directly, any signed-in creator can make themselves an admin, grant themselves Pro, or mint XP.
  Fixed in this branch and proven by tests that run each attack before and after. See §3 and §7.
- **What's done:** 4 migrations, 22 new endpoints, the Jarvis chat, a real TikTok connection (sign-in, sync, nightly refresh), 260+ automated tests, CI job.
  **What isn't:** nothing here is deployed; the app isn't wired yet; platform connections, payments,
  push, stats and real AI quality are the team's later phases (§6).
- **Needs a decision this week:** §8.

---

## 2. Aligning with the team's backend plan

### 2.1 What we adopt as written

| From the team plan | How it shows up here |
|---|---|
| The 14 tables and which screens use them | Mapped one-to-one in §4 — same names where they exist, a note where we differ |
| Phases 0–6 and their "done when" checks | Gate-by-gate in §6 |
| Free limits: Repurpose **1 per week**, a **daily cap on Jarvis messages** for free users | Enforced on the server, never in the app. One place to change: `TIER_LIMITS` in `backend/packages/api/context.ts` |
| "Every Pro check reads the tier from the server, never from the app" | The tier is derived from `subscriptions`, which creators can no longer write |
| Tokens "encrypted and hidden from the app" | Hidden now (creators can't read the token columns). Encryption at rest is still open — §7.2 |
| Database changes only as migration files, tried on dev first | Done as migrations; **a dev project doesn't exist yet** (the only project is v1's live one) — §8 |
| Branch per task, PR with one reviewer, a second pair of eyes on every RLS change | Adopted below; the RLS migration in this branch needs that review |
| Secrets in the vault and Supabase secrets, never in code or chat | We found a committed password and removed it — §7.3 |
| RevenueCat for iPhone subscriptions, Stripe/Paystack on web only | Agreed. Our webhooks already verify signatures; RevenueCat would be one more webhook route |
| Test the AI options on 20 real creator prompts and log cost | Our chat is model-agnostic (§5.3). We can build the 20-prompt comparison — offered in §8 |
| Tracking events: first post in week 1, day-7 return, shares | `analytics_events` (the plan's `events`). **By the code and migrations it recorded nothing** before this branch — §7.1 (check on the live project with the query in §10) |

### 2.2 Where we deliberately differ — and why

The team plan recommends the app talk to Supabase directly under row-level security, with Edge Functions
for anything secret. We are keeping **Supabase Auth in the app, and everything else through our API**:

```
App (phone + web) ──sign in──▶ Supabase Auth        (email code · Google · Apple)
App ──Bearer <access_token>──▶ /api/v1/*  (Next.js on Vercel) ──▶ Supabase Postgres (RLS is the backstop)
                                   └─▶ AI · platform APIs · payment webhooks · cron
```

Why we are not switching, in order of weight:

1. **Limits and entitlements are code, not row-ownership.** "1 Repurpose per week", "30 Jarvis messages
   a day", "tier comes from a verified purchase", "one check-in per local day" need atomic server logic.
   Behind an API they live in one place and RLS is a second lock. Direct-from-app, every one of them
   has to be encoded in a table policy, and one missed policy is free Pro (§3).
2. **It's already built and verified:** 19 routers, 40+ REST routes, the cron publisher, signature-checked
   Paystack/Stripe webhooks, and now tests. Moving it to Edge Functions is a rebuild, not a tweak; our
   shared TypeScript (`workflows`, `ai`, `integrations`) doesn't run on Deno without porting.
3. **The app barely changes either way.** It keeps calling functions with the same names (`saveDraft`,
   `checkInToday`, …); only their insides change (§5).

What it costs (honestly): the API needs hosting — a second Vercel project rooted at `backend/apps/web`
that **no one owns yet** — and the app needs its base URL. If hosting becomes a burden before Phase 3,
the table design below ports to the direct-from-app model unchanged; only the access path moves. That is
the revisit trigger.

What we take from their architecture anyway: Supabase Auth directly from the app, Expo push, a nightly
stats job (a Vercel cron route instead of Supabase cron), and RevenueCat webhooks.

### 2.3 Coordination risk to avoid

**Two sets of migrations for the same tables.** The team plan says to add a `supabase/` folder to the app
repo for migrations. One already exists: `backend/supabase/migrations` (21 files). Please write all
schema changes there (run the Supabase CLI from `backend/`, where it finds `supabase/migrations`). If a parallel
`supabase/` folder appears at the repo root, `drafts`, `check_ins` etc. will be defined twice and the two
will drift.

---

## 3. The rule: who may write what

The plan says every table's rule is "people read and write only their own rows". That is right for
things a creator **authors** and wrong for anything that **gates something**. If the app can write a
row that a limit counts, the app can delete the limit.

| Write authority | Tables | Why |
|---|---|---|
| **Creator, own rows** (RLS is the guard) | `drafts`, `saved_hooks`, `push_tokens`, profile fields (name, avatar, locale, timezone, tour, tips, niches) | It's their content; nothing is gated on it |
| **Server only; creator may read their own** | `check_ins`/streak (`streak_events`, `streak_states`), `repurpose_jobs`, `jarvis_messages`, `subscriptions`, `payment_transactions`, `credits`/XP, `milestones`, `quest_progress`, `post_stats`, `analytics_events`, `notifications` (creator may only mark read) | Each feeds a limit, a tier, XP, or a metric the team will make decisions from |
| **Server only; creator may not read** | OAuth token columns of `platform_connections` | Long-lived credentials to a creator's social accounts |

Two consequences for the plan as written:

- **Don't put "Free or Pro" on `profiles`.** If the creator can edit their profile row, they can set Pro.
  Our tier is derived from `subscriptions`, which only the server writes.
- **`quest_progress`, `repurpose_jobs` and `jarvis_messages` must be server-written**, or "1 per week" and
  "daily cap" can be reset by deleting rows.

---

## 4. The team's 14 tables ↔ ours

| Team plan table | Ours | State | Notes |
|---|---|---|---|
| `profiles` | `users` + `creator_profiles` | **Extended** | New: `timezone`, `tour_done_at`, `tips_seen` on `users`; `niches` on `creator_profiles`. Returned whole by `GET /me/bootstrap`. *"goal"* in the plan has no source in the app we can find — see §8 |
| `check_ins` | `streak_events` (+ `streak_states` as a cache) | **Built** | One row per creator per **local** day; `check_in`, publish, mission or collaboration all count (one streak, not two). Missing a day quietly starts a new run |
| `drafts` | `drafts` | **Built** | `payload` (JSON) carries caption / script / slides. The app's string id is stored as `client_key` |
| `scheduled_posts` | `scheduled_posts` | **Exists; extended** | Platforms now include Instagram, YouTube, Threads, Facebook. `GET /schedule/posts` takes `from`/`to`. Status mapping: plan `posted` = our `published`; plan `missed` ≈ `failed` / stale `pending_confirmation` |
| `saved_hooks` | `saved_hooks` | **Built** | |
| `quest_progress` | `quest_progress` | **Exists** | ⚠ still creator-writable — §7.2 |
| `jarvis_messages` | — | **Not built** (Phase 3) | The daily cap works today via rate-limit buckets; history + per-reply cost logging come with this table |
| `repurpose_jobs` | `repurpose_jobs` | **Built** | Each allowed Repurpose is a row; **the weekly count is the number of rows this week**, so the count can't drift from the work. `source`/`versions` fill in when the AI lands |
| `platform_connections` | `platform_connections` | **Extended; token columns unreadable** | New: account name/avatar/scopes, `status` (`connected` / `needs_reauth` / `error`), last sync + error. **TikTok is now a real server-side OAuth connection** (§5.4), its tokens sealed at rest, and creators can't write TikTok rows at all. LinkedIn/X still take a token string from the app until their OAuth is built |
| `post_stats` | `post_stats` (+ `account_stats`) | **Built for TikTok** | Per-video views/likes/comments/shares, plus a daily account snapshot (followers…). Server-written, owner-read. Instagram/YouTube fill the same tables |
| `subscriptions` | `subscriptions` | **Exists; creators can no longer write it** | Needs `apple`/`google` added to `processor_type` for RevenueCat (Track C) |
| `notifications` | `notifications` | **Exists** | Ours has `read` (boolean) and `action_text`/`metadata`; the plan wants `read_at` and a target. Track C to reconcile |
| `push_tokens` | — | **Not built** (Track C) | |
| `events` | `analytics_events` | **Exists; now actually written** | Same thing, different name. App-sent events are stored as `client.<name>` so they can't impersonate server events |

Not in the plan but in the app: **XP and level** (shown everywhere). They are `sum(credits)`, as before.

---

## 5. Wiring the app (Track A's Phase 2 task)

### 5.1 Sign-in

The app signs in with the **Supabase client** (email code, Google, Apple) and keeps the session. After
that, every call to our API carries the access token:

```ts
// after any sign-in / token refresh
apiClient.setToken(session.access_token);
```

`backend/packages/api/context.ts` already accepts `Authorization: Bearer <token>`. A `users` row is
created by a database trigger at sign-up. As the sign-up steps complete, call
`PUT /user/onboarding { displayName, handle, niches, timezone }` (any subset, any order). **Send the
device time zone** (`Intl.DateTimeFormat().resolvedOptions().timeZone`) — it decides when a creator's day
and week start. A taken handle returns `409`.

The existing `POST /auth/sign-up` / `sign-in` (email + password, with `AUTH_DEV_AUTOCONFIRM`) stay for
local testing only; that flag **must be off in production**.

### 5.2 `src/data/index.ts` — keep the names, change the insides

These functions are synchronous and use `subscribeTo…` listeners. Keep the in-memory store as a **cache**:
fill it once from `GET /me/bootstrap` after sign-in, apply changes **optimistically**, and send the API
call in the background; on failure keep the change on the device and show the "saved on this device"
note the plan asks for.

| App function | API call | Notes |
|---|---|---|
| (launch) | `GET /me/bootstrap` | One call fills profile, drafts, hooks, check-ins, allowance, tour, tips |
| `getCheckInStreak` / `checkInToday` | `GET /check-ins` · `POST /check-ins` | The response is the app's `CheckInStreak` shape plus `longestDays`, `localDate`. A second tap the same day is a normal `newlyCheckedIn: false` |
| `getCalendarMonth` | `GET /check-ins/month?year=&month=` **and** `GET /schedule/posts?from=&to=` | Month is 0-based like `Date`. Build `CalendarDay`s from both |
| `getWeekSchedule`, `getScheduleSummary` | `GET /schedule/posts?from=&to=` | Derive the counts in the app |
| `getDrafts` / `saveDraft` / `removeDraft` | `GET /drafts` · `PUT /drafts/{id}` · `DELETE /drafts/{id}` | `id` is your string id; URL-encode it (`API_ROUTES.DRAFTS.ITEM(id)` does) |
| `getSavedHooks` / `toggleSavedHook` | `GET /hooks` · `POST /hooks` | `saved` in the response is the **new** state |
| `getRepurposeAllowance` / `spendRepurpose` | `GET /repurpose` · `POST /repurpose/spend` | Out of free uses is `200 { allowed: false, upgradeRequired: true }` — show the Pro prompt, not an error |
| `tipOnce` (the "seen" set) | `POST /user/tips { key }` | Keys are screen names; seed the set from `bootstrap.tipsSeen` |
| tour finished or skipped | `POST /user/tour` | `bootstrap.tour.done` replaces the `finishedOnce` flag |
| `think()` in `src/jarvis/chat.ts` | `POST /jarvis/chat` | §5.3 |
| `getVoiceCloneSummary`, `getAccountSnapshot(s)`, `readLink`, ideas/captions/hooks helpers | — | Voice (later), platform stats (Track C), AI helpers (Track B: `POST /jarvis/ideas|caption|script|optimize-hook` exist today) |

Types for all of this are in `frontend/shared/types/phase1.ts`; route paths are in
`frontend/shared/constants/apiRoutes.ts`. Two automated tests fail if either drifts from the server.

A sketch for one function (the others follow the same shape):

```ts
export function saveDraft(d: Omit<SavedDraft, 'savedAt'>): SavedDraft {
  const saved = { ...d, savedAt: Date.now() };
  draftStore = [saved, ...draftStore.filter((x) => x.id !== d.id)]; // optimistic — unchanged
  draftListeners.forEach((l) => l());
  void apiClient
    .put(API_ROUTES.DRAFTS.ITEM(d.id), { title: d.title, kind: d.kind, format: d.format, platform: d.platform })
    .then((res) => { if (!res.success) markUnsynced(d.id); });       // keep it on the device, retry later
  return saved;
}

export async function hydrate() {                                    // call once after sign-in
  const res = await apiClient.get<Bootstrap>(API_ROUTES.ME.BOOTSTRAP);
  if (!res.success || !res.data) return;                             // stay on device data; show the offline note
  draftStore = res.data.drafts;
  savedHooks = res.data.savedHooks;
  /* …check-ins, allowance, tour, tips the same way, then notify each listener set */
}
```

(`apiClient.get/put/post` return `{ success, data, error, statusCode }`, not the raw body.)

### 5.3 Ask Jarvis (`POST /jarvis/chat`)

Request: `{ message, history?: [{ from: 'me' | 'jarvis', text }] (last ≤ 8), context?: { persona, niches, platforms, lastTopic } }`.
Reply: `{ text, ideas?, caption?, list?, tasks?, chips?, emotion?, degraded }` — the app's `ChatMessage`
without `id` and `from`. `ideaTasks(idea)` stays in the app. The 650 ms fake "thinking" pause goes away;
show Ghost thinking while the request is in flight.

What the server guarantees about the reply (so the app can trust it): ids are generated by the server,
button labels come from templates (never from model text), only the 5 job kinds and 10 pages the app
knows can come back (a made-up page is dropped), lists and lengths are capped, and one malformed part
doesn't lose the whole answer. If the AI is down the creator gets a kind fallback with `degraded: true` —
never an error screen. Limits: 8 messages a minute, then a daily cap by plan (**placeholders** — §8).

The model sits behind one function (`complete` in `packages/ai/jarvis-chat.ts`); Groq with a Gemini
fallback today. Switching to Claude Haiku/Sonnet is one function, which is what makes the plan's
20-prompt comparison cheap to run.

### 5.4 Connecting TikTok (Login Kit + Display API)

```
App ── POST /platforms/tiktok/authorize {client} ──▶ API: mints a single-use state tied to THIS creator
App ◀── { url } ───────────────────────────────────  (stored server-side, 10 min)
App ── sends the creator to TikTok ───────────────▶ TikTok: "Allow PostStreak?"
TikTok ── redirects to  <app>/auth/tiktok/callback?code=…&state=… ──▶ the app's callback page
App ── POST /platforms/tiktok/callback {code,state} ▶ API: checks the state is theirs and unused,
                                                      exchanges the code, seals + stores the tokens,
                                                      pulls the first stats
```

- **Scopes** (exactly these three; they must match what's approved on the TikTok app):
  `user.info.basic` (name, photo), `user.info.stats` (followers, likes), `video.list` (videos + their views/likes/comments/shares).
  The creator's **@handle** needs a fourth scope, `user.info.profile`; until it's added to the TikTok app and
  the list above, the app shows the display name.
- **Redirect URI:** TikTok requires https, no query string, no fragment, ≤ 10 per app, each registered in the
  TikTok portal. Ours is the app's own page, `https://app.poststreak.app/auth/tiktok/callback` (already served by
  the web app's rewrite). **Register a second one for staging** — TikTok doesn't take `localhost`.
- **Web vs phone:** the state starts `w.` (web) or `m.` (phone app). On `m.` the callback page hands `code` and
  `state` to the phone app (`poststreak://tiktok…`), because only the app holds the creator's session; on `w.`
  the page posts them itself. Either way the `/callback` call must come from the same signed-in creator.
- **Security:** the state is unguessable, single-use, expires in 10 minutes, and is bound to the creator who started
  it, so a forged callback can't attach someone else's TikTok to a victim. Tokens are sealed with AES-256-GCM
  (`TOKEN_ENCRYPTION_KEY`), bound to creator + platform, and creators can't read them. One TikTok account can be
  linked to one PostStreak account. Disconnecting revokes the token at TikTok and deletes the data we pulled.
- **Sync:** on connect, on `POST /platforms/tiktok/sync` (6/hour), and nightly (`/api/cron/sync-platforms`,
  04:00 UTC). Access tokens last 24 h and are refreshed early; a dead grant marks the connection
  `needs_reauth` so the app can show "Reconnect". Syncs of one creator never overlap (token refresh can rotate
  the refresh token, so two at once could lock a creator out).
- **What the app gets:** `GET /platforms/accounts` (and `bootstrap.accounts`) for the Connect screens;
  `GET /growth/snapshots` for the onboarding "Your account" card (best posting time, posting days, average
  views — in the creator's time zone). The richer Growth screens are still sample data.
- **Sandbox vs production:** the sandbox keys only work for TikTok accounts added as "Target users". For any
  creator to connect, TikTok must approve the Production app, which needs a screen recording of this flow working
  — so build and demo it on staging first. Posting stays "assisted" (copy + open TikTok); direct posting needs a
  separate TikTok audit.
- **Setup:** see [STAGING_RUNBOOK.md](STAGING_RUNBOOK.md). Env vars: `TIKTOK_CLIENT_KEY`,
  `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`.

---

## 6. Phase gates — what the backend provides and what's left

| Team plan gate | Backend (this branch) | Still needed |
|---|---|---|
| **0** — app writes a test row and reads it back; a function answers | `GET /me/bootstrap` with a real token returns the creator | A dev Supabase project; the API deployed somewhere (owner?); `EXPO_PUBLIC_API_URL` |
| **1** — sign up, close the app, reopen: still signed in with name and niches; the tour doesn't return | Sign-up trigger, `PUT /user/onboarding`, `POST /user/tour`, `bootstrap` | App: Supabase Auth screens + session persistence; apply bootstrap on launch |
| **2** — everything a creator makes survives a reload and appears on a second phone | Drafts, hooks, check-ins, calendar range, Repurpose count | App: swap `src/data/index.ts` insides (§5.2), add loading/offline messages |
| **3** — three real creators say Jarvis feels made for them | Chat endpoint, prompt, safety (§5.3) | Model choice + the 20-prompt test; history table; stats-aware advice (Phase 4) |
| **4** — real views on Growth, daily | TikTok connect, sync, nightly job, `post_stats`/`account_stats`, snapshots (§5.4) | Instagram + YouTube; wire the Growth screens beyond the onboarding card; TikTok production approval |
| **5** — a purchase unlocks Pro, cancelling locks it | `subscriptions` is server-only and the tier is derived from it; signature-checked Stripe/Paystack webhooks exist | RevenueCat + the web checkout; restore/cancel/expiry |
| **6** — beta with no lost data | Migrations are tested on fresh *and* on populated databases | Prod project, backup-restore test, TestFlight/Play |

---

## 7. Security

### 7.1 Fixed in this branch (each has a test)

The Supabase public key is public by design, and sign-in hands every creator a real session token. So
**any creator can call the database directly, bypassing the API**; row-level security is the actual
security boundary — and it is the *only* one in the team plan's architecture. Before this branch, a
signed-in creator could, with a single request each:

| Attack | Result before | Now |
|---|---|---|
| Set `role = 'staff_admin'` on their own `users` row | Succeeds — admin takeover | Refused (column-level privileges) |
| Insert an `active` row into `subscriptions` | Succeeds — **free Pro** | Refused |
| Insert into `credits` / `milestones` / `streak_events`, edit `streak_states` | Succeeds — mint XP, set any streak | Refused; streaks only advance through one atomic server function |
| Insert `voice_minutes_ledger` / `voice_topups` / `payment_transactions` | Succeeds | Refused |
| Read their own stored social-account OAuth tokens | Succeeds | Refused (server only) |
| Post into any conversation; join any squad as `leader` | Succeeds | Refused unless a participant / the squad's creator |
| Clear their own suspension (`account_status`) | Succeeds | Refused |

`supabase/tests/migrations.test.ts` runs four of these — admin takeover, free Pro, minted credits and
milestones, and reading stored tokens — **against the database as it stood before the migration (they
succeed) and after (they're refused)**; the rest have after-only tests. That shows the tests would catch
a regression and that the holes were real — in an in-process Postgres built from these migrations, not
observed on the live project.

Also fixed, found along the way:

- **Analytics were not being recorded, so the free-tier AI limit could never trip.** (Inferred from the
  code and migrations; confirm on the live project — §10.) The routers wrote events with the creator's own
  client, which row-level security rejects without an insert policy — and the errors were ignored; the daily
  quota counts those rows. Events are now written by the server (`ctx.track`). **Consequence: free creators will start
  hitting the 3-generations-a-day limit the architecture doc always specified.** The app's Create screen
  lets them tap "Another" freely, so this needs a product decision before the screens are wired (§8).
- **Streaks**: advanced by two copies of read-then-write code (the shared engine and an inline duplicate
  in `missions.complete`) that could double-count under concurrent requests; now one atomic function with
  a database-enforced "one day per creator".
- `closeAccount` never actually closed anything (it set a date but not the status the API checks);
  `upsertProfile` failed whenever the request included `displayName`, `platformLinks`,
  `collaborationIntent` or `isPublic`; `connect` echoed OAuth tokens back to the client.

### 7.2 Found, not fixed (needs a decision or belongs to a later track)

| Item | Risk | Suggested fix |
|---|---|---|
| `quests.complete` awards XP on **every** call and never checks the quest's requirements; `quest_progress` and `challenge_participants` are creator-writable | Unlimited XP | One atomic `complete_quest()` function; make both tables server-written |
| `missions` and `duels` insert/update policies; `referrals_insert_own` | XP farming (replace → complete loop); forced duels; fake referrals once rewards exist | Same pattern as §3 |
| **TikTok** tokens are now sealed at rest and connected through a real server-side OAuth callback (§5.4). **LinkedIn and X** tokens are still stored in plaintext and `connect` still accepts any string the app sends for them | A leaked database dump leaks those creators' social access; a creator can fake a LinkedIn/X connection | Give LinkedIn/X the same treatment: server-side OAuth callback + `sealToken` (the pieces exist in `packages/integrations/token-vault.ts`) |
| CORS reflects any `Origin` with credentials allowed | Low today (Bearer tokens aren't sent automatically), but wrong for production | Allowlist `poststreak.app`, `app.poststreak.app`, localhost in dev |
| Admin feature flags are stored in (and read back from) `analytics_events` with the staff member's own client — they don't persist, and the reader keeps the oldest value | Dead feature | A real `feature_flags` table |
| `scheduled_posts` status/`platform_post_ids` are creator-editable | A creator can fake a "published" post (skews stats) | Server-only status transitions when Growth ships |
| **v1's own tables** (`user_tokens` — OAuth tokens, `user_plans`, `posts`, `user_streaks`, …) predate these migrations and their policies aren't in the repo | Unknown | Run the audit in §10 against the live project |

### 7.3 Operational

- `PROJECT_STATE.md` contained the demo accounts' password in plain text. Removed in this branch; it
  remains in git history, so **rotate it** and keep credentials in the vault.
- `AUTH_DEV_AUTOCONFIRM` must be unset in production (it skips email verification).
- Never run these migrations on the live project first — see §9.

---

## 8. Decisions we need

Suggested default in *italics*. Owner column left for the team.

| # | Decision | Suggested default | Owner |
|---|---|---|---|
| 1 | Create `poststreak-dev` and rehearse migrations there. The only project today is v1's live one | *Yes — before anything else* | |
| 2 | Who deploys the API (a Vercel project rooted at `backend/apps/web`)? | *Whoever holds the Vercel account; it's a 15-minute job* | |
| 3 | Existing paying users move over? The earlier migrations adopt v1's database in place (they were run against the live project); Phase 1's are tested on a populated database. A fresh prod project would skip the v1 backfill | *Adopt in place (ROADMAP.md's assumption); confirm* | |
| 4 | Free **Jarvis chat** daily cap (placeholders are 30 free / 300 Pro) and the **AI generation** cap for ideas/hooks/captions/scripts (architecture doc says 3/day, now actually enforced) | *Decide with the Create screen's "Another" button in mind* | |
| 5 | Free Repurpose limit | *1 per week, as in the plan* | |
| 6 | Does a **publish** or **mission** also count as a check-in? (Today: yes, one streak.) | *Yes* | |
| 7 | What is `profiles.goal` in the plan, and where is it chosen? | *Not found in the app; skip until someone points to a screen* | |
| 8 | AI for Jarvis: Groq (+Gemini fallback) vs Claude Haiku/Sonnet | *Run the 20-prompt comparison; we can build the harness* | |
| 9 | First two platforms for real connections (TikTok / Instagram / YouTube vs LinkedIn / X) | *Track C's call — it gates their approvals* | |
| 10 | `main` (frontend) and `master` (backend) have been separate since Aug 21. One trunk? | *Yes. Trial merge conflicts in 5 frontend files only* | |

---

## 9. Verify and apply

```bash
cd backend
pnpm install
pnpm typecheck     # also type-checks the test files
pnpm lint
pnpm test          # 260+ tests, ~40 s, no database or network needed
```

The tests apply every migration to an in-process Postgres (PGlite) with Supabase's roles, check
row-level security as the real `authenticated` and `service_role` roles, and — separately — upgrade a
database that already has creators in it. **They are not a substitute for a real Supabase project**
(no PostgREST, no JWT verification): do the plan's "try to read another test user's rows" check on dev.

Applying (dev first, in order `…19` → `…20` → `…21`; the Supabase CLI runs each file in its own
transaction):

- `…19_phase1_enum_additions` — adds platforms and the `check_in` event type. Harmless.
- `…20_phase1_saved_work` — new tables and functions, **plus two data steps on `streak_events`**:
  it deletes duplicate-day rows (keeping the earliest) and writes `check_in` rows for each existing
  streak so nobody loses theirs. Take a backup first; the upgrade-path test shows exactly what it does.
- `…21_rls_hardening` — drops creator write access listed in §7.1. It only touches tables this schema
  created, **not** v1's own — but confirm v1's web app doesn't write `users`, `credits`, `subscriptions`
  or `streak_*` (it shouldn't; they didn't exist in v1).

---

## 10. Audit the live database

Run in the Supabase SQL editor against the live project (read-only) and review anything that lets a
creator write a table in §3's "server only" row, or read `user_tokens`:

```sql
-- Policies that allow writes, by table
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
order by tablename, policyname;

-- Tables with row-level security OFF (should be none)
select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- What the API roles can do to each table
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee order by table_name, grantee;

-- Was analytics ever recorded? Expect almost nothing from the app before this change.
select event_name, count(*) from analytics_events group by 1 order by 2 desc;

-- Columns where an API role holds its own privilege (the exceptions to the table-level grants)
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and table_name in ('users', 'platform_connections', 'notifications')
order by table_name, column_name, grantee;
```

---

## Appendix — what changed in this branch

- **Database** (`backend/supabase/migrations`): `…19` enum additions · `…20` saved work, check-ins,
  Repurpose, timezone-aware day/week · `…21` RLS hardening.
- **API**: `drafts`, `savedHooks`, `repurpose`, `jarvis` routers; `accounts` (bootstrap, onboarding,
  tour, tips; fixed `upsertProfile` and `closeAccount`); `streakGamification` (check-ins; removed the
  user-callable `recordEvent`, the non-functional streak freeze, and the shaming emotion ladder);
  `ctx.track()`; plan limits in `TIER_LIMITS`; 13 new REST route files (16 endpoints).
- **Shared contract**: `frontend/shared/types/phase1.ts`, route constants in `apiRoutes.ts`.
- **Tests and CI**: `pnpm test` (vitest + PGlite), a `Test` job in `.github/workflows/ci.yml`.
- **Docs**: this file; `PROJECT_STATE.md` updated.
