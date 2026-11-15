# PostStreak app → backend feature map

Written 2026-11-14 from a read of `poststreak-web` (`cloudflare-migration`, incl. #46) and this app (`feat/email-otp`, #8 + #9).
Screens were read for where their data comes from (imports, hard-coded arrays, local state), not run on a device, so a few "Today" entries are from code only.

**Reading the table**
- *Today*: **demo** = `src/data/index.ts` or arrays hard-coded in the screen. **local** = real logic, but state lives on the device only. **real** = already calls the backend.
- *Backend exists?*: **yes** = a route or table does the job as is. **partial** = something exists but needs a change. **no** = nothing yet.
- *Size*: S = under a day, M = 1–3 days, L = a week or more.

## Backend today (poststreak-web)

Routes (all JSON; "Bearer" = Supabase access token, accepted as well as the cookie):

| Route | Method | Auth | What it does |
|---|---|---|---|
| `/api/auth/<platform>` (linkedin, threads, facebook, instagram, youtube, tiktok) | GET | Bearer or cookie | Start connect. Bearer gets `{url}` (needs `ENABLE_BEARER_CONNECT=true`, **off**); `?return_to=` allowlisted https (#46) |
| `/api/auth/<platform>/callback` | GET | signed state | OAuth return; app flows park tokens as pending and redirect with a handle |
| `/api/connect/finalize` | POST `{handle}` | Bearer | Attaches the pending account to the user |
| `/api/platforms` | GET | Bearer | Connected `{platform, expires_at}` only (#46) |
| `/api/auth/disconnect` | POST `{platform}` | Bearer | Removes a connection |
| `/api/media/upload-url` | POST | Bearer | Presigned R2 upload; returns the `mediaKey` |
| `/api/post/now` | POST `{content, platform, mediaKey, publishOptions}` | Bearer | Publish now to one platform |
| `/api/post/schedule` | POST `{content, platform, scheduledAt, mediaKey, publishOptions}` | Bearer | Schedule one post |
| `/api/schedule` | POST `{content, platforms[], scheduledAt, mediaKey, publishOptions}` | Bearer | Schedule one post to several platforms |
| `/api/post/cancel` | POST `{postId}` | Bearer | Cancel a scheduled post |
| `/api/tiktok/creator-info` | GET | Bearer | TikTok nickname and the options TikTok lets this creator choose |
| `/api/streak/update` | POST | Bearer | Moves the streak; returns `current_streak, longest_streak, total_posts` |
| `/api/ai/hooks` | POST `{topic…}` | Bearer | Returns `{hooks}` |
| `/api/ai/compose` | POST `{topic…}` | Bearer | Returns `{content}` |
| `/api/agent` | POST | Bearer | Streaming chat (Groq) with saved preferences |
| `/api/agent/memory` | GET, POST `{key,value}` | Bearer | User preferences |
| `/api/autopilot/config` | GET, POST | Bearer | Topics, platforms, frequency (1–5), mode (auto/suggest) |
| `/api/autopilot/run` | POST | Bearer | Writes and queues posts from the config |
| `/api/referral` | GET | Bearer | Referral code and stats |
| `/api/payments/{paystack,stripe}/initiate` | POST | Bearer | Start a Pro payment |
| `/api/payments/*/webhook`, `/api/cron/*`, `/api/admin/*`, `/api/waitlist*`, `/api/health`, Meta `uninstall`/`delete` | various | secret / signature / public | Server-side only; the app doesn't call them |

Platforms enabled: LinkedIn, Threads, Facebook, Instagram, YouTube, TikTok (X is not).

Tables: `posts`, `user_tokens` (encrypted), `pending_connections`, `media_uploads`, `user_streaks`, `streak_events`, view `streak_leaderboard` (readable by signed-in users), `user_plans`, `user_preferences`, `autopilot_configs`, `voice_profiles` (text style), `referrals`, `email_sequences`, `weekly_recaps_sent`, `waitlist_entries`, `data_deletion_requests`, `processed_webhook_events`.
The app can read its own rows from `posts`, `user_streaks`, `user_plans`, `user_preferences` and the leaderboard view with the signed-in session (RLS). It must **not** read `user_tokens`; use `/api/platforms`.

## Feature table

| Feature | Screen(s) | Today | Backend exists? | What's needed | Size |
|---|---|---|---|---|---|
| **Group A: wire now** | | | | | |
| Sign-in: Google + email code | Welcome, SignIn, SignUp, VerifyCode, ResetPassword | real (#8/#9); web Google redirect fixed in #11 | yes | Merge #8/#9/#11 after Supabase redirect list is set. ResetPassword is for passwords; email sign-in is code-based, so confirm it's still reachable | S |
| Session, sign-out, username | App.tsx, profile modals | real | yes | Username lives in auth metadata; show it | S |
| Connect platforms (6) | PlatformConnectScreen, ConnectAccountsSheet | local toggle | yes | Build the flow in docs/connect-finalize.md: `GET /api/auth/<p>` → open URL → finalize. `return_to=https://app.poststreak.app/connect/finalize` on web, `poststreak://connect/finalize` on native. Needs `ENABLE_BEARER_CONNECT=true` (your go) | M |
| Which platforms are connected | composer, schedule, growth, connect screens | local list | yes | `GET /api/platforms` into one shared hook; replaces the local lists | S |
| Disconnect | ConnectAccountsSheet | local toggle | yes | `POST /api/auth/disconnect` | S |
| Media upload (image/video) | PostComposerScreen, ProPostComposerScreen | local pick only | yes | `POST /api/media/upload-url`, PUT to R2, send `mediaKey` | M |
| Post now / schedule | PostComposerScreen, ProPostComposerScreen, ScheduleSheet | celebration only | yes | `post/now` (one call per platform) or `/api/schedule` for several; map errors to the existing toast | M |
| TikTok post settings | Composer (not shown today) | not present | yes | `GET /api/tiktok/creator-info`, send `publishOptions.tiktok`. **Needs new UI, which you approve first** (privacy level, comments/duet/stitch, commercial disclosure) | M |
| Queue and calendar | ScheduleScreen, ProScheduleScreen, Dashboard calendar | demo (`getWeekSchedule`, `getCalendarMonth`, arrays) | yes | Read `posts` (RLS); cancel via `post/cancel` | M |
| Drafts | CreateScreen, CaptionScreen, ScriptScreen | local (`saveDraft`) | partial | `posts.status = 'draft'` exists; needs a save/list route or direct RLS write | S |
| Streak and check-in | Dashboard, CheckInCard, Quests | local (`useCheckInStreak`) | partial | Read `user_streaks`; `streak/update` is what moves it. Confirm it counts a check-in and not only a post | M |
| Leaderboard | Dashboard / Growth | demo | yes | Read `streak_leaderboard` | S |
| Plan (Free / Pro) | SubscriptionContext, upgrade modals | local tier | yes | Read `user_plans`. Taking payment from the app is in Group C | S |
| AI hooks | HookStudio, ProHookStudio, IdeaDetail | demo (`ANGLES`, `HOOK_OPTIONS`) | yes | `POST /api/ai/hooks` | S |
| AI captions / compose | CaptionScreen, ProCaption, ProScript, ScriptScreen | demo (`getCaptionOptions`) | yes | `POST /api/ai/compose` | M |
| Jarvis chat | JarvisOrb, jarvis/chat.ts, JarvisProScreen | local canned replies | yes | Stream `POST /api/agent`; save preferences via `agent/memory`. Ghost's jobs (navigate, check in) stay local | M |
| Autopilot | not in the app | none | yes | New screen: **new UI, needs your approval.** Routes ready | M |
| Referral | not in the app | none | yes | Optional; new UI | S |
| **Group B: build backend, then wire** | | | | | |
| Quests, missions, challenges | QuestsScreen, ProQuests, MissionDetail, ChallengeDetail | demo (`getStarterIdeas`, `COMPLETED_MISSIONS_DATA`) | no | Definitions in code; `user_quests` table for progress; progress computed from `posts` and `streak_events` | L |
| Post performance | PostPerformanceScreen | demo (`STATS`, `CURVE`) | no | Table `post_metrics` (post_id, metric, value, fetched_at); cron pulls from each platform's insights API for posts PostStreak published | L |
| Growth analytics | GrowthScreen, ProGrowth, PlatformGrowth | demo (`INITIAL_GROWTH_PLATFORMS`) | no | Table `account_snapshots` (platform, followers, date) filled by cron from the platforms; chart reads it | L |
| Audience breakdown | AudienceBreakdownScreen | demo | no | Same sources; some platforms don't expose it. Show only what each does, hide the rest | L |
| Repurpose | RepurposeScreen, ProRepurpose | demo (`getRepurposeVersions`) | no | `/api/ai/repurpose` in the style of `ai/compose`; allowance in `user_preferences` | M |
| Film plans, content angles, idea feed | ContentAngle, IdeaDetail, HookStudio | demo (`getFilmPlan`, `getIdeaFeed`) | no | AI route from niche and goal; save ideas in `user_preferences` | M |
| Niche / goal / weekly goal | NicheSelection, AdjustWeeklyGoalModal | local | partial | Store in `user_preferences` | S |
| Notifications | NOTIFICATIONS arrays on many screens | demo | no | Derive from post results and streak events (new `notifications` table) | M |
| **Group C: later or cut** | | | | | |
| Sound ideas (trending sounds) | HookStudio | demo (`getSoundIdeas`) | no | No public TikTok trending-sounds API. Cut, or label as AI suggestions | cut |
| Voice studio, voice clone | VoiceStudio, ProVoiceStudio | demo | no | Needs a third-party voice service, plus consent handling. The existing `voice_profiles` table is text style only (example posts, tone, summary), not audio | L, later |
| Earnings, brand deals, creator matches | Dashboard / Pro screens | demo | no | Needs real brand data and payments. Keep demo, label it | later |
| Paying for Pro inside the app | upgrade modals | local | yes (web) | Routes exist for the web. iOS/Android in-app purchase rules apply; decide web-only checkout | decide |
| Link preview (`readLink`) | CaptionScreen / ContentAngle | demo | no | Low value | cut |
| X (Twitter) | n/a | n/a | disabled | Not enabled in the backend | cut |

Unwired screens that stay demo until their wave: everything marked demo above. Each gets a `// TODO(demo): …` comment, with no visual change.

## Build waves

**Wave 1: platform review videos.** Every PR is independent except where noted.
1. Merge-ready auth: #8, #9, #11 (after the Supabase redirect list is set and a device test). Nothing else starts on `main` until these are in.
2. Shared `usePlatforms` hook (`GET /api/platforms`) and disconnect (S). Everything below uses it.
3. Connect flow for all 6 platforms, web and native, with finalize (M). Needs your go for `ENABLE_BEARER_CONNECT`.
4. Media upload through R2 (M).
5. Post now / schedule with media (M, after 2 and 4).
6. TikTok settings UI: design first, you approve, then build (M).
7. Queue: real `posts` list and cancel (M, after 2).
Backend changes are likely not needed in Wave 1 (everything exists); any that turn up go to `cloudflare-migration`.

**Wave 2: daily-use data.** Streak and check-in, leaderboard, plan, drafts, hooks, captions, Jarvis chat (all A, mostly S/M, all parallel).

**Wave 2 also: image posting for LinkedIn, Threads and Facebook.** Needs poststreak-web first (`PLATFORM_META` media rules in the web app plus the adapters for each platform), then the app: set `image: true` for those three in `PLATFORM_RULES` (`src/api/posts.ts`) and remove the text-only handling (`isTextOnlySelection`, the "Images coming soon" notes) in `src/config/platforms.ts` and the two composers. Until then the composer posts text only for these three.

**Wave 3: backend plus wiring.** Repurpose and idea AI routes, quests, notifications, preferences (B, M).

**Wave 4: analytics.** `post_metrics` and `account_snapshots` with their crons, then Post performance, Growth, Audience (B, L). Depends on each platform's insights permissions, which may need app review.

**Later / cut:** Group C, plus Autopilot and Referral screens when you want them.

## Needs your decision
- Supabase redirect URLs (Phase 0, below).
- `ENABLE_BEARER_CONNECT=true` for Wave 1, item 3.
- Pro payment from the app: web checkout only, or in-app purchase.
- Approve the TikTok settings UI and any Autopilot / Referral UI before they're built.

## Phase 0: sign-in redirect (done in #11)
Web Google sign-in used `redirectTo = <origin>/`. Supabase only honors a `redirectTo` that matches its **Redirect URLs** list and otherwise falls back to the **Site URL** (the waitlist). It now sends `<origin>/auth/callback`; native sends `poststreak://auth/callback`; email codes send no redirect.
Supabase dashboard → Authentication → URL Configuration → **Redirect URLs** must include:
`https://app.poststreak.app/**`, `poststreak://**`, and, only while testing, `http://localhost:8081/**` and `https://poststreak-app.tonlover247.workers.dev/**`.
Leave **Site URL** as it is: the web dashboard's own emails use it.
