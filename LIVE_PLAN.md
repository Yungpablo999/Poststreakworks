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
| 1 | **Branch + inspection** | The branch; a list of every hardcoded list and number, dummy generator, dead file and do-nothing button in the frontend; dead code removed | in progress |
| 2 | **Foundation** | `capabilities` from the server; 4 test users with real history; one-tap test sign-in (local only); a stand-in TikTok so connect works on localhost; one command to start everything | in progress |
| 3 | **Socials** | One connection framework (authorize → callback → sealed tokens → sync → refresh → disconnect) for **TikTok, Instagram, Threads, Facebook Pages, YouTube**; stats flow into the same tables; stand-ins for each on localhost; real connect buttons on web and phone | next |
| 4 | **Every screen real** | In your flow order: Home + notifications, Create (ideas, script, caption, hooks, Repurpose) written by the AI backend, Composer + Schedule (real scheduled posts), Quests / challenge / XP, Growth (from synced stats), Profile / plan / Pro. Hide what the server can't deliver | next |
| 5 | **Web + phone checks** | Browser walkthrough per test user on desktop and phone width; Android and iOS bundles; app-link handling | next |
| 6 | **Spin up + test** | `npm run local` starts database, sign-in, API, stand-ins and the app; automated API and database checks; the walkthrough repeated for all four users | next |
| 7 | **Hand-over** | What is real, what is hidden and why, and what only you can switch on (keys, testers, approvals) | last |

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
_(updated as the work lands)_
