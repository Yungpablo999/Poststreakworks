# PostStreak — Accounts & Credentials Checklist

**Purpose**: every account and credential the app touches, end to end, for a complete production
launch — not just what's blocking today. Organized so you can work through it at your own pace.
✅ = already have it and it's working. ⬜ = still needed.

---

## ✅ Already have — nothing to do here

| Service | What it's for |
|---|---|
| Supabase | Database, auth, everything — URL, publishable/secret keys, DB password |
| Groq | Primary AI for Jarvis content (ideas, scripts, captions, hooks) |
| Gemini | Fallback AI, kicks in only if Groq errors |
| Google OAuth | "Sign in with Google" client ID/secret |
| X (Twitter) OAuth | Platform connect — identity link |
| LinkedIn OAuth | Platform connect + actual publishing |
| Resend | Transactional email |
| PostHog | Product analytics |
| `CRON_SECRET` | Secures the scheduled-post dispatcher |

---

## ⬜ Payments — pick at least one processor

You designed for both (Paystack for NGN/African cards, Stripe for USD/international) — you don't
strictly need both to launch, but you need **at least one real one** before real users can pay.
Until then, real users hitting "Upgrade to Pro" get a payment error (dummy/mock mode is the
stopgap for internal testing, not a launch state).

- **Paystack** — [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys &
  Webhooks. Need: **Secret Key**. Also set your webhook URL there once deployed
  (`https://yourdomain.com/api/payments/paystack/webhook`).
- **Stripe** — [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API Keys. Need:
  **Secret Key**, plus a **Webhook Signing Secret** (Developers → Webhooks → add endpoint →
  `https://yourdomain.com/api/payments/stripe/webhook`).

---

## ⬜ Sign-in providers beyond Google

Only needed if you want these specific sign-in options live. Google already works.

- **Apple** — requires an **Apple Developer Program membership** ($99/year) at
  [developer.apple.com](https://developer.apple.com). From there: create an **App ID**, a
  **Services ID** (this is your client ID), a **Sign in with Apple Key** (generates a `.p8` private
  key file — download it immediately, Apple only shows it once), and note your **Team ID**. Four
  values needed: Services ID, Team ID, Key ID, the `.p8` file contents.
- **Microsoft** — free. [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App
  registrations → New registration. Need: **Application (client) ID**, **Client Secret** (Certificates
  & secrets → new client secret), **Directory (tenant) ID**.

---

## ⬜ Social platform publishing — beyond LinkedIn/X identity

LinkedIn and X OAuth already work for connecting an account. Two more platforms are in the schema
(`meta`, `tiktok`) with no credentials yet:

- **Meta (Facebook/Instagram)** — [developers.facebook.com](https://developers.facebook.com) → create
  an app → add "Facebook Login" + "Instagram Graph API" products. Need: **App ID**, **App Secret**.
  Note: publishing to Instagram requires the account be a Business/Creator account linked to a
  Facebook Page, and Meta requires app review for most publishing permissions before they work for
  anyone other than your own test accounts — budget real time for this, it's not instant.
- **TikTok** — [developers.tiktok.com](https://developers.tiktok.com) → register an app → apply for
  the **Content Posting API**. Need: **Client Key**, **Client Secret**. TikTok's review process is
  notoriously slow and selective — apply early if this matters for launch, don't assume same-day
  approval.

Also worth a real decision: **X's API now has paid tiers** (Free/Basic/Pro) — confirm which tier your
existing X developer account is on, since posting via API (not just OAuth identity) may need a paid
tier depending on volume.

---

## ⬜ Hosting & domain

- **Vercel** — [vercel.com](https://vercel.com), free to start. Create an account/project if you don't
  have one; the codebase already assumes Vercel (the cron-job convention matches it directly). If you
  want me deploying directly, add me as a project collaborator or hand me a scoped CLI token —
  otherwise I can hand you the exact deploy commands to run yourself.
- **Domain** — a registered domain (e.g. via Namecheap, Google Domains successor, Cloudflare
  Registrar) pointed at Vercel via DNS. If you already own `poststreak.app` or similar, just need DNS
  access to configure it.

---

## ⬜ Optional, not blocking launch

- **Sentry** — [sentry.io](https://sentry.io), free tier available. Error tracking/crash reporting.
  Need: **DSN**. Recommended before real users hit the app, not strictly required day one.
- **Fish Audio** — voice generation for the Voice Studio feature. **Deferred by your own decision**
  (voice is future work) — only get this when you actually pick that feature back up.
- **Supabase Personal Access Token** — Account (top-right avatar) → Access Tokens. Only needed if you
  want me configuring the sign-in providers above via API instead of you clicking through the
  Supabase dashboard yourself. Not the same as the service-role key you already gave me.

---

## Later, only if going to native app stores

Not needed for a web launch. Relevant only if/when you want PostStreak installable from the App
Store / Play Store (the app is built with Expo, which supports this later without a rewrite):

- **Apple Developer Program** ($99/year — same account as Apple Sign-In above, if you get that)
- **Google Play Console** ($25 one-time) — [play.google.com/console](https://play.google.com/console)

---

## Suggested order, if you want to move through this efficiently

1. Pick and set up **one** payment processor (Paystack or Stripe) — this is the biggest real gap.
2. Vercel account + domain — get something real deployed.
3. Sentry — cheap insurance once real users show up.
4. Apple/Microsoft sign-in, Meta/TikTok publishing — only when those specific features become a
   priority; none of them block getting a working product live.
