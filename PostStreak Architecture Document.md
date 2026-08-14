# PostStreak

**Architecture & Product Document**

The AI-powered social media scheduling & streak-tracking platform for African creators and businesses

| | |
|---|---|
| Version | 1.0 (V1 Scope) · Prepared August 2026 |
| Prepared by | Israel "Hizzy" Oyewole, Founder & Solo Builder |
| Company | Polykoe Technologies LTD · Lagos, Nigeria |

> "There are, it may be, so many kinds of voices in the world, and none of them is without signification."
> — 1 Corinthians 14:10 (KJV), Polykoe's foundational verse

---

## Table of Contents

1. Executive Summary
2. Product Vision & Positioning
3. Technology Stack
4. System Architecture
5. Core Features — V1 Scope
6. Streak & Jarvis Emotion System
7. Voice Studio (Fish Audio)
8. Integration Architecture
9. Monetization & Billing
10. Design System
11. Legal & Compliance
12. Roadmap & Success Metrics

---

## 1. Executive Summary

PostStreak is Polykoe Technologies LTD's flagship social media scheduling and streak-tracking product, positioned as the "Buffer of Africa." It gives African creators, founders, and SMBs a single place to plan, schedule, and consistently publish content across social platforms, while a gamified streak system keeps them showing up daily. PostStreak is the first product in Polykoe's long-term MakeIT vision — a unified front-office operating system covering social, voice, and email for African businesses.

This document describes the V1 architecture: the technology stack, system layers, core features, the streak/Jarvis engagement engine, third-party integrations, monetization model, design system, and the product roadmap toward the initial goal of 50 paying users in 60 days.

| | |
|---|---|
| **Product** | PostStreak — social scheduling & streak-tracking SaaS |
| **Parent company** | Polykoe Technologies LTD (registered, Nigeria) |
| **Positioning** | "Buffer of Africa" — built for African creators & SMBs |
| **Core stack** | Next.js · Supabase · Vercel · Groq |
| **Monetization** | Free / Pro ₦2,999 ($7) / Growth ₦9,999 ($19) |
| **Payments** | Paystack (NGN) + Stripe (international) |
| **Early goal** | 50 paying users in 60 days |

## 2. Product Vision & Positioning

PostStreak exists because consistency, not creativity, is the biggest blocker for most African creators and small businesses trying to build an audience. Scheduling tools built for Western markets rarely account for local pricing power, payment rails, or platform priorities. PostStreak closes that gap: local pricing in Naira, Paystack as a first-class payment method, and a product experience tuned for founders who are building in public.

### 2.1 The MakeIT Vision

PostStreak is step one of MakeIT — Polykoe's long-term platform combining social, voice (via Joy, the AI voice agent product), and email into one front-office OS for African SMBs. Each product is built independently first, proves itself with real customers, then plugs into the shared MakeIT infrastructure.

### 2.2 Guiding Principle

Polykoe's foundational verse, 1 Corinthians 14:10 — "There are, it may be, so many kinds of voices in the world, and none of them is without signification" — anchors the mission: every creator's and every business's voice deserves the infrastructure to be heard consistently.

## 3. Technology Stack

| Feature | Description | Status |
|---|---|---|
| **Next.js** | App framework — React server/client components, App Router, API routes | Live |
| **Supabase** | Postgres database, authentication, storage, row-level security | Live |
| **Vercel** | Hosting, edge network, deployments, cron jobs | Live |
| **Groq** | Low-latency LLM inference layer for AI-assisted features | Live |
| **Resend** | Transactional & drip email infrastructure (onboarding, streak nudges) | Live |
| **Fish Audio** | Voice synthesis engine powering the Voice Studio feature | In Progress |
| **Paystack** | Primary payment processor for Nigerian/African customers (NGN) | Live |
| **Stripe** | Payment processor for international customers (USD) | Live |

The stack was deliberately chosen for speed of iteration as a solo founder: Supabase collapses database, auth, and storage into one managed service; Vercel removes DevOps overhead; Groq keeps AI inference cost and latency low enough to embed into core product flows rather than bolt on as a side feature.

## 4. System Architecture

PostStreak follows a layered architecture. The client layer is a Next.js application deployed on Vercel; all business logic runs through Next.js API routes / server actions; Supabase serves as the system of record; AI and voice capabilities sit in a dedicated layer so they can be swapped or scaled independently; and integrations with social platforms, payments, and email are isolated behind their own service modules.

```
CLIENT LAYER
Next.js (App Router) · React · Vercel Edge/CDN · Responsive Web App

APPLICATION LAYER
Next.js API Routes / Server Actions · Auth Middleware · Cron Jobs (Vercel)

AI / VOICE LAYER
Groq (LLM inference) · Fish Audio (Voice Studio synthesis)

DATA LAYER
Supabase (Postgres) · Supabase Auth · Supabase Storage · Row-Level Security

INTEGRATION LAYER
X API · LinkedIn API · Meta Graph API · TikTok API (planned)

COMMERCE & COMMS
Paystack (NGN) · Stripe (Intl) · Resend (Email drips)
```

### 4.1 Request Flow (Scheduled Post Example)

1. User composes and schedules a post in the Next.js client.
2. Server action validates the request and writes it to Supabase (Postgres) with status `scheduled`.
3. A Vercel Cron job polls due posts on a fixed interval.
4. The publishing service authenticates against the relevant platform API (X, LinkedIn, Meta, or TikTok) and posts the content.
5. Post status updates in Supabase; the streak engine recalculates the user's current streak.
6. If the user is at risk of breaking a streak, the streak-rescue system (Jarvis) triggers an email via Resend and/or an in-app nudge.

## 5. Core Features — V1 Scope

| Feature | Description | Status |
|---|---|---|
| **Multi-platform scheduling** | Compose once, schedule across X and LinkedIn (live); Meta and TikTok next in integration order | Live |
| **Streak tracking** | Tracks consecutive days of consistent posting per user | Live |
| **Streak-rescue system** | Jarvis mascot with a 9-state emotion system reacts to posting behavior and nudges users back on track | Live |
| **Credit system** | Credits earned via streak milestones, redeemable within the product | Live |
| **Email drip infrastructure** | Onboarding sequences and streak-risk reminders via Resend | Live |
| **Voice Studio** | Fish Audio-based voice feature scoped into the product | In Progress |
| **Billing & subscriptions** | Free / Pro / Growth tiers via Paystack (NGN) and Stripe (international) | Live |
| **Design system** | DESIGN.md — warm cream, electric violet, warm gold token system | Live |
| **Terms of Service** | Drafted under Nigerian jurisdiction | Live |
| **Meta & TikTok scheduling** | Next platforms in the integration order after X and LinkedIn | Planned |

## 6. Streak & Jarvis Emotion System

The streak engine is PostStreak's core retention mechanic. Every consecutive day a user publishes scheduled content, their streak count increases; missing a day resets it. To make this emotionally engaging rather than punitive, streak state is represented by Jarvis, a pink (#FF6581) bear mascot with a 9-state emotion system that visually reflects the user's current streak health — from thriving to at-risk to broken — and proactively rescues users who are about to lose a streak.

### 6.1 Streak-Rescue Flow

1. System detects a user has not posted with hours remaining in their streak window.
2. Jarvis shifts to an at-risk emotion state in the UI.
3. A rescue nudge is sent via email (Resend) and/or in-app notification.
4. If the user posts before the deadline, the streak continues and Jarvis returns to a positive state.
5. If the streak breaks, Jarvis reflects that state and the credit/milestone counter resets accordingly.

A timezone bug (UTC vs. WAT / Africa/Lagos) affecting streak-day boundaries was identified and fixed, ensuring streak resets align with the user's actual local day rather than UTC midnight.

## 7. Voice Studio (Fish Audio)

Voice Studio extends PostStreak beyond text and image scheduling into voice-based content, powered by Fish Audio's synthesis engine. It is scoped as part of the broader MakeIT vision of unifying social, voice, and email — sharing infrastructure conceptually with Joy, Polykoe's dedicated AI voice agent product for voice-first use cases like pharmacy customer support.

## 8. Integration Architecture

### 8.1 Social Platform APIs

Platforms are integrated in a deliberate order — X, then LinkedIn, then Meta, then TikTok — prioritizing official APIs only. X and LinkedIn auto-posting are live end-to-end; Meta and TikTok follow the same integration pattern once developer access is finalized.

### 8.2 Payments

Paystack handles Naira-denominated billing for Nigerian and African customers; Stripe handles USD billing for international customers. Both feed the same subscription and credit logic in Supabase.

### 8.3 Email

Resend powers all transactional and drip email: onboarding sequences, streak-risk nudges, and milestone celebration emails.

## 9. Monetization & Billing

| Tier | Description | Status |
|---|---|---|
| **Free** | Core scheduling with limited platform connections and posts | Live |
| **Pro — ₦2,999 / $7** | Expanded scheduling limits, full streak & Jarvis features | Live |
| **Growth — ₦9,999 / $19** | Highest limits, Voice Studio access, priority features | Live |

Pricing is deliberately localized: Naira pricing for the Nigerian/African market via Paystack, with USD pricing via Stripe for international customers. The near-term commercial goal is 50 paying users within 60 days of launch.

## 10. Design System

PostStreak's visual identity is documented in DESIGN.md and built around a warm, human palette rather than a cold SaaS-blue default: warm cream backgrounds, electric violet as the primary brand color, and warm gold as an accent — with Jarvis's signature pink (#FF6581) reserved for the mascot and streak emotion states.

| Swatch | Color |
|---|---|
| Warm Cream | |
| Electric Violet | |
| Warm Gold | |
| Jarvis Pink | #FF6581 |

This palette carries through every touchpoint — the app UI, the Jarvis emotion illustrations, and marketing/build-in-public content — so the product feels distinctly warm and African rather than a reskinned Western tool.

## 11. Legal & Compliance

| | |
|---|---|
| **Entity** | Polykoe Technologies LTD (CAC-registered, Nigeria) |
| **Terms of Service** | Drafted under Nigerian jurisdiction |
| **Payments** | Paystack (local) + Stripe (international) for compliant, region-appropriate billing |
| **Domain / Email** | hello@poststreak.app via Cloudflare Email Routing |

## 12. Roadmap & Success Metrics

### 12.1 Near-Term Roadmap

- Ship Meta and TikTok scheduling, completing the planned integration order.
- Finish and launch Voice Studio (Fish Audio) to paying tiers.
- Grow build-in-public distribution: shareable streak milestone cards, public creator profile pages, and a streak-save social mechanic.
- Add branded Voice Studio watermarks to drive organic referral loops.
- Push toward the 50-paying-users-in-60-days milestone through direct outreach (X, beta user DMs).

### 12.2 Success Metrics

- **Paying users:** 50 within 60 days of go-to-market push.
- **Streak retention:** percentage of users maintaining a 7-day+ streak.
- **Platform coverage:** all four social integrations (X, LinkedIn, Meta, TikTok) live.
- **Voice Studio adoption** among Growth-tier subscribers.