# PostStreak — Frontend Architecture (Stage 3 of 8)

Status: **Scaffolded, pending founder review.** Stub route/screen files only — no implementation, no styling, no real navigation config. Planning artifact, not a build artifact.

Governs `apps/web/`, `apps/mobile/`, and the two frontend-facing shared packages (`packages/design-tokens/`, `packages/hooks/`). Living in `apps/web/` because that's the more directly analogous continuation of the original Next.js-centric ground truth — not because mobile is secondary.

---

## 1. Decisions confirmed this stage (founder answers, 2026-08-14)

- **Daily Mission system is in scope.** This was a real gap in Stage 1/2 — see §6 below and `supabase/DATA_MODEL.md` §6 / `packages/api/BACKEND_ARCHITECTURE.md` §7 for how it was patched in.
- **Navigation: 5 tabs, no Earn tab.** Home / Create / Network / Grow / Profile. Earn-related surfaces (credit balance, milestone rewards, and eventually marketplace access) are contextual widgets embedded in Home and Grow — not a destination of their own.
- **UI code sharing: logic shared, UI separate.** `packages/hooks/` and `packages/design-tokens/` are shared; every actual component is implemented independently per platform (React DOM + Tailwind on web, React Native + StyleSheet/NativeWind on mobile).

## 2. Correction received this stage — flag for every future stage, not just this one

**Jarvis is not pink.** The Architecture Doc states `#FF6581` twice (§6, §10) as fact. The founders corrected this directly. This is the first confirmed factual error in the source doc treated as "most recent, most authoritative" since Stage 0 — worth remembering that "newest doc" doesn't mean "error-free," not just for color but for anything else in it. Real color value not yet provided; not guessed at anywhere in this scaffold (see `packages/design-tokens/index.ts`). Whether Jarvis's appearance is one constant color or varies per emotion state is also open, and connects to the still-unresolved 8-vs-9 emotion-state count from `supabase/DATA_MODEL.md` item B.

## 3. Route map

| Route (web) | Route (mobile) | Purpose |
|---|---|---|
| `app/(tabs)/layout.tsx` | `app/(tabs)/_layout.tsx` | 5-tab shell |
| `app/(tabs)/home/page.tsx` | `app/(tabs)/home/index.tsx` | Streak + Jarvis, today's mission, today's posts, contextual Earn widget |
| `app/(tabs)/create/page.tsx` | `app/(tabs)/create/index.tsx` | Compose/schedule, Voice Studio entry, calendar/queue |
| `app/(tabs)/network/page.tsx` | `app/(tabs)/network/index.tsx` | Discover/Match, Collaboration Workspace, Squads, Quests |
| `app/(tabs)/grow/page.tsx` | `app/(tabs)/grow/index.tsx` | Analytics, streak history, milestones, contextual Earn widget |
| `app/(tabs)/profile/page.tsx` | `app/(tabs)/profile/index.tsx` | Account, billing, creator profile, support |
| `app/(auth)/page.tsx` | `app/(auth)/index.tsx` | Sign in / sign up |
| `app/onboarding/page.tsx` | `app/onboarding/index.tsx` | Progressive onboarding |
| `app/passport/[handle]/page.tsx` | `app/passport/[handle].tsx` | Public Creator Passport — outside the tab shell, unauthenticated |

Plus `packages/design-tokens/index.ts`, `packages/hooks/index.ts`, `apps/web/components/index.ts`, `apps/mobile/src/components/index.ts` — see each file's header for what it's intended to hold.

## 4. Why Network holds four pillars instead of getting four routes

Matching/Discovery, Collaboration Workspace, Squads, and Creator Passport were confirmed together as one scope decision in Stage 1. Nesting them under one `Network` tab (rather than giving each a top-level route) keeps that grouping visible in the URL/screen structure, not just in a planning doc. Creator Passport is the one exception — it needs a public, unauthenticated route by definition (a brand or peer without an account has to be able to open it), so it lives at `app/passport/[handle]`, outside the tab shell, with the in-tab Network view holding only the owner's edit/preview of their own Passport.

## 5. Assumptions & flagged decisions

| # | Item | Status | Detail |
|---|---|---|---|
| N | Mobile navigation library | **ASSUMED** | Expo Router — file-based, mirrors the Next.js App Router mental model already used on web. React Navigation is the alternative if the team wants more manual control. |
| O | Component organization | **ASSUMED** | Domain-aligned folders in each app's own `components/`, plus a `components/ui/` for design-system primitives — mirrors the domain alignment used in Stages 1–2. |
| P | Auth flow mechanics | **NOTED, not a decision** | Web uses redirect-based OAuth; mobile needs a native deep-link/in-app-browser flow. Same backend session model (`packages/api/context.ts`), different client mechanics — not a tradeoff so much as an unavoidable platform difference. |
| Q | Onboarding depth | **OPEN** | A short 3–4 step flow vs. doc3's fuller 7-step progressive version (§9). Doesn't block scaffolding either way. |
| — | Jarvis color | **OPEN** | See §2. Do not fill in a guessed hex value anywhere downstream of this doc. |
| — | "Create" tab depth | **OPEN, deferred to Stage 4** | Whether doc3's full 9-module AI Content Studio (Idea Builder, Hook Lab, Script Builder, etc.) lands here, or a simpler compose flow, is an AI-orchestration scope question, not a frontend one. |
| — | Quests placement | **ASSUMED, low-confidence** | Nested under Network rather than Grow. Doc2 frames "shared quests" as part of the Creator Network pillar, which is the reasoning — but this is a softer call than the others in this table and worth double-checking once quests get designed for real. |

## 6. Addendum — the Missions gap

Post_Streak_App 2.md's Home screen concept (§10-11) — a personalized, AI-recommended "daily mission" — was never one of the four pillars asked about in Stage 1, so it was never modeled there. It surfaced only because this stage's screen inventory needed a real answer for what Home actually shows. Founders confirmed it's in scope. Patched forward rather than pretending it was always there:

- `supabase/migrations/20260814000009_missions.sql` (new)
- `packages/api/routers/missions.ts` (new)
- `supabase/DATA_MODEL.md` §6 and `packages/api/BACKEND_ARCHITECTURE.md` §7 (addenda)

The actual recommendation logic — what mission a given creator sees on a given day — is unbuilt and unscoped. Reserved for Stage 4.

## 7. Explicitly out of scope this pass

No real navigation config, no Tailwind/NativeWind setup, no actual component implementations, no `package.json`/bundler config for either app. No Earn *screen* content beyond noting it's contextual, not a route of its own yet — the actual widget design is later work.

## 8. Next

Feeds Stage 4 (AI ORCHESTRATION — Create tab depth, Missions recommendation logic, and the Voice Studio generation flow all live there) and Stage 5 (WORKFLOWS — auth flows, onboarding flow, streak-rescue nudge delivery). Stage 1's open items (Jarvis state count, RLS philosophy, source-file provenance) plus this stage's new ones (Jarvis color, onboarding depth, quests placement) all carry to OPEN_QUESTIONS (Stage 8).

**Waiting for "approved, continue" (or corrections) before starting Stage 4: AI ORCHESTRATION LAYER AND ARCHITECTURE.** *(Approved 2026-08-14.)*

## 9. Addendum — added during Stage 5 (2026-08-14)

Duels (see `supabase/DATA_MODEL.md` §7) confirmed in scope during WORKFLOWS. No new route — it lives inside the existing `Network` tab alongside Quests, per `app/(tabs)/network/page.tsx`'s updated header.
