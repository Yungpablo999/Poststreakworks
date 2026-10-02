# PostStreak — staging runbook, and the road to production

**Who this is for:** whoever holds the Supabase, Vercel, TikTok and Resend accounts.
**What it gets you:** a staging copy of the whole product — sign-in with email codes, saved drafts and check-ins, Ask Jarvis, and a real TikTok connection — that you can test on a phone and in a browser, then promote to production.

Everything in the repo is ready for this. What's left are the steps that need an account only you have. They are in dependency order; each ends with a check, so you know it worked before moving on.

> **Never paste a secret into chat, a ticket, a screenshot or the repo.** Keys go in the team password vault and in Vercel's environment settings. (A TikTok client secret was shared in a screenshot while this was being written; if the TikTok portal lets you regenerate it, do — see step 6.)

---

## 0. The three environments

| | Local | **Staging** | Production |
|---|---|---|---|
| Git branch | any | `master` | `main` |
| Database | `supabase start` (Docker) | new Supabase project `poststreak-staging` | v1's live project |
| API (`backend/apps/web`) | `pnpm dev` | Vercel project `poststreak-api-staging` | Vercel project `poststreak-api` |
| App (Expo web build) | `npm run web` | Vercel project `poststreak-app-staging` | the existing `app.poststreak.app` project |
| TikTok app keys | sandbox | **sandbox** | production (after TikTok approves the app) |

The app only talks to the backend when it's given the backend's address (step 5). With no address it keeps running on its built-in sample data, exactly as it does today. That means **merging the code to production changes nothing for users until you set those variables there** — and removing them switches it back instantly.

---

## 1. Staging database (Supabase)

1. Create a Supabase project: name `poststreak-staging`, **EU region** (closest to West Africa), a strong database password (vault).
2. From **Project settings → API**, copy into the vault: the project URL, the `anon` key, the `service_role` key. From **Project settings → Database**, copy the **pooled** connection string (port 6543).
3. Apply the migrations — all 23 files in `backend/supabase/migrations`, in order. They work on an empty project (the first migration creates empty copies of the v1 tables that later ones read; on the live project it leaves v1's tables alone).

   ```bash
   cd backend
   npx supabase login
   npx supabase link --project-ref <the staging project ref>
   npx supabase db push
   ```

   If you'd rather not use the CLI: open the SQL editor and run each file in filename order.
4. **Check:** run the audit queries in `PHASE1_CONTRACT.md` §10. No table should have row-level security off, and the `anon`/`authenticated` roles should have no write access to `credits`, `subscriptions`, `streak_events`, `platform_connections` token columns, etc.

## 2. Sign-in (Supabase Auth)

Authentication → URL Configuration:
- **Site URL:** the staging app's address (step 5), e.g. `https://staging.poststreak.app`
- **Redirect URLs:** `https://staging.poststreak.app/**`, `http://localhost:8081/**`, `poststreak://**`

Authentication → Providers → **Email:** enabled. Leave "Confirm email" on.

**Email code (the 6-digit code the app asks for).** Authentication → Email Templates. Both **Magic Link** and **Confirm signup** must show the code, or creators get a link the app can't use. Replace the body of each with:

```html
<h2>Your PostStreak code</h2>
<p>Enter this code in the app:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>It expires in an hour. If you didn't ask for it, ignore this email.</p>
```

**Real email delivery.** Supabase's built-in sender allows only a couple of emails an hour and only to your own team, so staging can't be tested with it. Authentication → SMTP Settings → enable custom SMTP with Resend: host `smtp.resend.com`, port `465`, username `resend`, password = a Resend API key (vault), sender = an address on a domain you've verified in Resend.

Google and Apple sign-in: enable the provider (Authentication → Providers) with the credentials from Google Cloud / Apple Developer, and add Supabase's callback `https://<project-ref>.supabase.co/auth/v1/callback` to the provider's allowed redirects. Until they're enabled the app shows "not set up yet" on those buttons; email code works without them.

- **Check:** Authentication → Users → "Invite user"/sign up with your own email in the app later (step 7) and confirm the code arrives.

## 3. The API (Vercel)

Create a new Vercel project from the GitHub repo:
- **Root Directory:** `backend/apps/web`; tick **"Include source files outside of the Root Directory"** (it's a pnpm workspace — the packages live in `backend/packages`).
- **Framework:** Next.js. **Install command:** `pnpm install` run from the workspace (Vercel detects `backend/pnpm-lock.yaml`).
- **Production Branch:** `master` (for the staging project). Domain: e.g. `api-staging.poststreak.app`.

Environment variables (Settings → Environment Variables; all in the vault too). Names only here — values are yours:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | staging project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging `service_role` key — **server only, never in the app** |
| `TOKEN_ENCRYPTION_KEY` | 32 random bytes, base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Different per environment. Losing it means every creator must reconnect their accounts |
| `CRON_SECRET` | any long random string |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | the TikTok **sandbox** app's (step 6) |
| `TIKTOK_REDIRECT_URI` | `https://staging.poststreak.app/auth/tiktok/callback` — exactly as registered in TikTok |
| `GROQ_API_KEY` (and `GEMINI_API_KEY` as fallback) | for Ask Jarvis. Without them Jarvis shows its gentle "having trouble" reply |
| `CORS_ALLOWED_ORIGINS` | the app's address(es) from step 4, comma-separated, no trailing slash, e.g. `https://staging.poststreak.app`. Only these websites can call the API from a browser. **Set it on every deployed environment**; left unset, any website is allowed (local development only) |
| `AUTH_DEV_AUTOCONFIRM` | **leave unset** (it skips email verification) |

Cron jobs come from `backend/apps/web/vercel.json`: the post dispatcher every 15 minutes and the TikTok stats refresh daily at 04:00 UTC. (Sub-daily crons need Vercel's Pro plan.)

- **Check:** `https://api-staging.poststreak.app/api/v1/me/bootstrap` (open it in a browser) should answer **401** with a JSON message. A 404 or a build error means the project settings above are off.

## 4. Give the app the backend's address — staging

The existing project deploys the production app from `main`. For staging, create a **second Vercel project from the same repo**: root directory `/`, **Production Branch `master`**, domain `staging.poststreak.app`. (The root `vercel.json` already builds the web app with `expo export -p web`.) Environment variables:

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_API_URL` | the staging API's address, e.g. `https://api-staging.poststreak.app` |
| `EXPO_PUBLIC_SUPABASE_URL` | staging project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | staging `anon` key (public by design) |
| `EXPO_PUBLIC_AUTH_PROVIDERS` | *(optional)* which one-tap buttons to show: `google`, `apple`, or `google,apple`. Only list a provider once it is switched on in Supabase (step 2). Left unset, those buttons are hidden and email code is the only way in |

All `EXPO_PUBLIC_*` values ship inside the app, so they must be safe to publish: the `anon` key is; the `service_role` key never is.

- **Check:** open the staging app. It should open on sign-in (not the old sample Home).

## 5. TikTok (sandbox)

In the TikTok developer portal, on the app's **Sandbox** page:
1. **Redirect URI:** add `https://staging.poststreak.app/auth/tiktok/callback`. Keep `https://app.poststreak.app/auth/tiktok/callback` too (production, for later). Must be https, no query string, no `#`. TikTok won't take `localhost`.
2. **Scopes / products:** Login Kit and Display API, with exactly `user.info.basic`, `user.info.stats`, `video.list`. (The creator's `@handle` needs `user.info.profile` as well; add it to both the portal and `TIKTOK_SCOPES` in `backend/packages/integrations/tiktok.ts` if you want it.)
3. **Target users:** add the TikTok accounts of everyone who will test (a sandbox app only works for them).
4. Copy the **sandbox** client key and secret into the staging API's environment (step 3), nowhere else. If the portal offers to regenerate the secret that was shared in the screenshot, regenerate it first and use the new one.

## 6. Smoke test — staging

On a browser, then on a phone (open the staging address; the app is responsive, and add it to the home screen if you like):

| # | Do this | Expect |
|---|---|---|
| 1 | Sign up with your email, enter the 6-digit code | You land on Home; the welcome tour starts |
| 2 | Close the tab, reopen | Still signed in; the tour doesn't come back |
| 3 | Check in; save a draft from Create; save a hook in Hook Studio | Each shows up. Reload, or sign in on a second device: all still there |
| 4 | Use Repurpose twice as a free user | The first works; the second shows the Pro prompt |
| 5 | Ask Jarvis for ideas | Ideas come back; "Ghost, save it to drafts" works |
| 6 | Connect TikTok (with a Target-user account) | TikTok's page → Allow → back in the app showing your account name and follower count |
| 7 | Growth / onboarding account card | Your real posting days and best time (needs ≥ 3 TikTok posts) |
| 8 | Disconnect TikTok | The account disappears; it's gone from TikTok's "authorised apps" too |
| 9 | Try to reach another test user's data (their drafts, check-ins) with a second account | You can't |

## 7. Promote to production

Only after the staging checks pass. In this order:

1. **Back up the live database** (Supabase → Database → Backups, or `pg_dump`). Two of the new migrations change existing data.
2. **Apply only the new migrations — `20260814000019` to `…22`, in order — to the live project** (SQL editor or `psql -f`). Don't run `supabase db push` there; the earlier files were applied some other way and aren't recorded. `…20` removes duplicate-day rows from `streak_events` and writes check-ins for existing streaks; `…21` removes creator write access to server-owned tables; `…22` retires any placeholder TikTok rows. Re-read the audit queries (`PHASE1_CONTRACT.md` §10) afterwards.
3. Get a second person to review migration `…21` (the team plan asks for a second pair of eyes on every security change).
4. Create the production API project (like step 3, Production Branch `main`) with the **production** Supabase keys, a **new** `TOKEN_ENCRYPTION_KEY`, and the **production** TikTok keys once TikTok approves the app (until then production TikTok connect will only work for Target users).
5. Merge `master` into `main`. The existing app project redeploys. Nothing changes for users yet.
6. Set `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` on the production app project and redeploy. This is the switch.
7. Watch Vercel's function logs and Supabase's logs for the first hour.

**To switch it off:** remove those three variables and redeploy; the app returns to sample data. Database migrations aren't automatically reversible, but none of them removes a column or table creators were using.

**Before TikTok approval:** TikTok's reviewers need a short screen recording of the connection working. Record it on staging (steps 6.6–6.8), then submit the Production app for review.

---

## Check it all on your machine (no accounts needed)

Docker Desktop is the only requirement. This runs a real Supabase (database, sign-in, the REST layer and a mail catcher), the real API and the real app, so you can try everything before any of the cloud steps above.

```bash
cd backend
npx supabase start -x studio,imgproxy,vector,logflare,edge-runtime,storage-api,realtime,postgres-meta,supavisor
npx supabase status -o env        # the URL and keys to copy below
```

The first start downloads the images (about 4 GB on disk; on a slow connection that can take an hour or more) and after that it takes a few seconds. It applies all 23 migrations to the empty database itself.

1. **API:** in `backend/apps/web` copy `../../.env.example` to `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the status output, plus a `TOKEN_ENCRYPTION_KEY` and `CRON_SECRET`. The TikTok values can be made up locally. Then `node_modules/.bin/next dev -p 3000` (or `pnpm dev`).
2. **App:** from the repo root, with the same URL and the anon key:
   `EXPO_PUBLIC_API_URL=http://localhost:3000 EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> npm run web`
   (Expo remembers these values between runs: add `--clear` when you change them.)
3. Sign up in the browser. The 6-digit code arrives in the mail catcher at <http://127.0.0.1:54324>.
4. **Automated pass:** `ANON=<anon key> SERVICE=<service_role key> node scripts/e2e-local.mjs` in `backend` signs two creators in with real codes and runs 55 checks against the API and the database (their data, the free limits, TikTok's sign-in address, and that one creator cannot reach or forge another's data).

`npx supabase stop` shuts it down.

## What has and hasn't been verified

**Verified by automated tests** (`pnpm test` in `backend`, 253 tests): every migration on an empty database and on a v1-shaped one with data in it; row-level security as the real roles; the attacks that used to work (admin takeover, free Pro, minted XP, reading tokens) now refused; the TikTok flow against a faked TikTok (forged callbacks, expired and reused states, token refresh and rotation, failures); Ask Jarvis's reply handling; the browser-origin rules.

**Verified on a real local Supabase** (steps above, 2026-10-03): all 23 migrations applying to an empty project through the Supabase CLI; sign-up and sign-in with real emailed codes (wrong code, unknown email, expired session); the 55 API checks; and a browser walkthrough of the connected app on desktop and phone width: sign-up from the topic picker to Home, the welcome tour once, check-in, saved hooks, drafts saved by Ghost, the free Repurpose limit, profile edits, sign-out and back in with everything still there, TikTok's sign-in redirect, a cancelled TikTok sign-in (the creator stays signed in), a rejected one, a connected account shown with its followers, and disconnecting it (tokens and saved numbers deleted). The sample-data app (no backend settings) was checked unchanged. The API (`next build`) and the web, Android and iOS app bundles all build.

**Not** verified until you do the steps above: real email delivery (Resend), Google/Apple sign-in, a real TikTok account connecting (needs a Target user on the sandbox app), the nightly cron job, Ask Jarvis with a real AI key, and behaviour on a real phone (the phone-only paths are the TikTok hand-back link `poststreak://tiktok…`, session storage on the device and the in-app keyboard). The smoke test in step 6 is what proves the deployed system.
