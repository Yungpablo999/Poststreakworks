# PostStreak: the live branch (real backend, no fakes)

**Branch:** `live/real-backend`, cut from `master`. `main` (the frontend team's showcase with sample data) is not touched.
**Goal:** run the whole app, web and phone, from sign-in to every button, against the real backend on your own machine,
with nothing hardcoded, no sample data, no preview switches, no dead code and no button that does nothing.

Web and phone are one Expo codebase, so this one branch serves both. Web is driven in a browser (desktop and phone width);
the phone builds are bundled for Android and iOS and the phone-only paths (app links, device storage) are tested as far as
a machine without a phone allows (what isn't testable is listed at the end of each phase).

## Ground rules
- **No secret ever goes in a file, a commit, a chat message or a screenshot.** Keys are read from environment variables only.
  Put them in `backend/apps/web/.env.local` (gitignored) or the host's settings. Any key that has been in a screenshot is
  treated as exposed: reset it once setup is done.
- Nothing is faked. If the server can't deliver a feature (no AI key, no payments, a platform not approved), the app **hides it**
  (the server tells the app what it can do: `capabilities`), and it appears by itself once the server can.
- Test users replace the preview switches: Free/Pro × New/Existing, each with real rows in the local database.
- The frontend team's code on `main` stays as it is; this branch merges `main` in regularly.

## The plan

| # | Phase | What you get | State |
|---|---|---|---|
| 1 | **Branch + inspection** | The branch; a list of every hardcoded list and number, dummy generator, dead file and do-nothing button in the frontend; dead code removed | done |
| 2 | **Foundation** | `capabilities` from the server; 4 test users with real history; one-tap test sign-in (local only); a stand-in TikTok so connect works on localhost; one command to start everything | done |
| 3 | **Socials** | One connection framework (authorize → callback → sealed tokens → sync → refresh → disconnect) for **TikTok, Instagram, Threads, Facebook Pages, YouTube**; stats flow into the same tables; stand-ins for each on localhost; real connect buttons on web and phone | done |
| 4 | **Every screen real** | In your flow order: Home + notifications, Create (ideas, script, caption, hooks, Repurpose) written by the AI backend, Composer + Schedule (real scheduled posts), Quests / challenge / XP, Growth (from synced stats), Profile / plan / Pro. Hide what the server can't deliver | done |
| 5 | **Web + phone checks** | Browser walkthrough per test user on desktop and phone width; Android and iOS bundles; app-link handling | done (on this machine; a real device is yours) |
| 6 | **Spin up + test** | `npm run local` starts database, sign-in, API, stand-ins and the app; automated API and database checks; the walkthrough repeated for all four users | done |
| 7 | **Hand-over** | What is real, what is hidden and why, and what only you can switch on (keys, testers, approvals) | below |

## Socials: what each needs

| Platform | Login used | Permissions asked | Redirect address (register it in the provider's dashboard) |
|---|---|---|---|
| TikTok | Login Kit | `user.info.basic`, `user.info.stats`, `video.list` | `https://<app>/auth/tiktok/callback` |
| Instagram | Instagram API with Instagram login (the "PostStreak-IG" app id and secret, **not** the Facebook app's) | `instagram_business_basic`, `instagram_business_manage_insights` | `https://<app>/auth/instagram/callback` |
| Threads | Threads API | `threads_basic`, `threads_manage_insights` | `https://<app>/auth/threads/callback` |
| Facebook | Facebook Login (Pages) | `pages_show_list`, `pages_read_engagement`, `read_insights` | `https://<app>/auth/facebook/callback` |
| YouTube | Google OAuth | `youtube.readonly`, `yt-analytics.readonly` | `https://<app>/auth/youtube/callback` |

Environment variables (names only; values go in `.env.local` / the host, never in the repo):
`TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `THREADS_APP_ID`, `THREADS_APP_SECRET`,
`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, plus `TOKEN_ENCRYPTION_KEY`.

Things the providers require that no code can skip:
- Until each app passes review, only accounts added as **testers** can connect (Instagram Testers, Threads Testers, Google test users,
  TikTok Target users). Instagram needs a Business or Creator account. A Facebook connection needs a Page the creator manages.
- Every provider needs an **https** redirect address, so localhost uses the stand-in providers and the real ones are tried on staging
  (or through a tunnel such as ngrok).
- Google apps left in "Testing" issue refresh tokens that expire after 7 days.
- Going public later: Meta App Review + business verification, Google verification, TikTok production review (each wants a screen recording).

## Status log

| Commit | What landed |
|---|---|
| `cb94a7b`…`ef6607d` | Steps 1–4: what the server can do (`capabilities`), four seeded test accounts, one-tap test sign-in, a stand-in TikTok, 48 unused files removed, the app backend-only |
| `b7bf92f`, `68290bd` | Home, the bell, Quests, the challenge and the calendar read the creator's account; the plan preview's ideas come from the idea library |
| `d590d08`…`0f17e02` | One connection engine, five platforms (TikTok, Instagram, Threads, Facebook, YouTube), each with a stand-in |
| `4f83b46` | Growth from what the connected accounts report |
| `ac02115`, `017c519` | Posts are planned, ready and posted by the server alone; Compose and Schedule on them |
| `c4036ef`, `7c1afc2` | The writing tools (scripts, captions, hooks, Repurpose, ideas, Jarvis chat): checked replies, counted allowance, Pro gates; every screen on them, nothing canned |
| `7309109` | Web and phone alike: PATCH allowed by CORS (moving a post failed on the web), sheets take turns (iOS), cut-off replies fail honestly |
| `cbf496f` | Pro bought at Stripe, granted by its signed webhook, cancelled at Stripe, over when the month is; a stand-in Stripe for local testing |
| `2a98901`, `a75baff`, `85f513e` | Real Terms / Privacy links; no accept-any-code path; dead cards removed; no Pro claim the server can't keep |

How it's checked: 696 backend tests; five e2e scripts on a real local stack (`e2e-local` 55, `e2e-social` 171, `e2e-posts` 89,
`e2e-studio` 63, `e2e-billing` 36); headless-browser walkthroughs of every page as all four test accounts at desktop and phone
width; Android and iOS bundles build.

## Hand-over: what only you can switch on

Everything below is real code that runs; it needs an account, a key or an approval that only the owner can get.

| What | Until you do it | Where |
|---|---|---|
| **AI key** (`GROQ_API_KEY`, `GEMINI_API_KEY` fallback) | Scripts, captions, hooks, Repurpose and Jarvis are hidden (locally a stand-in answers, marked "test mode") | API settings |
| **Platform apps** (keys above; testers; redirect addresses) | That platform isn't offered; until app review only testers can connect | each provider's dashboard |
| **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, the webhook endpoint and its four events) | The Pro page says payments aren't switched on | `backend/STAGING_RUNBOOK.md` §3a |
| **Selling Pro inside the phone apps** | The phone apps say Pro is bought on the web (Apple/Google require their own in-app purchase for that) | a product decision: App Store / Play billing or RevenueCat |
| **Hosted staging** (Supabase project + two Vercel projects) | Nothing is deployed; everything runs on this machine | `backend/STAGING_RUNBOOK.md` §1–6 |
| **Migrations `…19`–`…27` on the live database** | The live database is on the old schema | runbook §7: backup first, staging first, a second reviewer |
| **Reset exposed secrets** | The keys shown in screenshots and the demo password once committed stay exposed | each provider; the team vault |
| **Real email** (Resend SMTP in Supabase) | Codes arrive only in the local mail catcher | Supabase → Auth → SMTP |

Known limits, by design: PostStreak reminds creators to post and they confirm "I posted it" (no auto-posting: each platform's
posting approval would be needed); reminders are in-app (no push or email yet); audience ages/places aren't offered (no
connected platform gives them to us); `aiEditsPerDay: 10` and the Jarvis chat limits are placeholders until product sets them.
