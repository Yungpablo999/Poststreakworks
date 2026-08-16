# PostStreak — Frontend Build Plan

For: **1 frontend engineer**, building `apps/web` and `apps/mobile` together. Runs parallel to [BACKEND_BUILD_PLAN.md](BACKEND_BUILD_PLAN.md) — see that doc's mirrored phases for exactly where the two tracks have to sync. This plan turns [FRONTEND_ARCHITECTURE.md](apps/web/FRONTEND_ARCHITECTURE.md)'s stubs into real, working screens; it doesn't revisit decisions already made there.

## How one person covers two platforms

Every phase below has a **Web** pass and a **Mobile port** pass, in that order — build and prove the interaction on web first (hot reload, no simulator, fastest iteration), then port the proven pattern to React Native. Don't build both simultaneously feature-by-feature; you'll redo work every time a flow changes mid-build. Per the "logic shared, UI separate" decision, `packages/hooks/` is genuinely shared — write the data-fetching hook once, consume it from both UIs.

## How frontend doesn't wait on backend

The backend track defines tRPC router **shapes** (input/output types via Zod) before it finishes real logic — see BACKEND_BUILD_PLAN.md Phase 0. That means:
- Once a router's shape exists, you get full type safety and can build the real UI against a resolver that returns realistic mock data.
- You are never blocked waiting for real business logic — only blocked if a router's *shape* doesn't exist yet at all. Each phase below names exactly which router shapes it needs.
- When backend swaps a mock resolver for real logic, nothing on the frontend should need to change — if it does, the shape changed and that's a conversation, not a silent break.

---

## Phase 0 — Foundation (Week 1)

- Turborepo workspace: `apps/web` (Next.js App Router), `apps/mobile` (Expo, Expo Router).
- Tailwind config in `apps/web`, NativeWind config in `apps/mobile`, both reading from `packages/design-tokens`.
- Supabase Auth wiring — web via `@supabase/ssr` (cookie session), mobile via `expo-secure-store`-backed session. Implements `apps/web/app/(auth)/page.tsx` and `apps/mobile/app/(auth)/index.tsx`.
- tRPC client setup in both apps (`apps/web/app/api/trpc/[trpc]/route.ts`, `apps/mobile/src/api/client.ts` already have header-comment stubs — this is where they get real).

**Needs from backend:** `packages/api/context.ts` and `root.ts` existing with at least an empty merged router, so the tRPC client has something real to point at.

**Known blocker, don't wait on it:** `packages/design-tokens` has no real color values yet — Jarvis's actual color and the warm cream / electric violet / warm gold hex codes are unresolved (OPEN_QUESTIONS.md §2). Use clearly-labeled placeholder tokens now (e.g. a neutral violet you'd be unembarrassed to demo, explicitly not final) and swap once the real palette lands. Don't let brand-asset delay stall Phase 0.

## Phase 1 — Shell + Home (Week 2)

- **Web:** `app/(tabs)/layout.tsx` — 5-tab shell (Home, Create, Network, Grow, Profile), no Earn tab. `app/(tabs)/home/page.tsx` — streak count + Jarvis widget, today's mission card, today's scheduled posts, contextual Earn widget.
- **Mobile port:** `app/(tabs)/_layout.tsx`, `app/(tabs)/home/index.tsx`.

**Needs from backend (shapes, not full logic):** `routers/accounts.ts` (`profile.get`), `routers/streak-gamification.ts` (`streak.get`), `routers/missions.ts` (`missions.today`).

**Flagging a real gap, not guessing past it:** the Jarvis widget needs actual emotion-state art or at minimum a defined state count (8 vs. 9, still open) before it can be more than a placeholder. Build the component to accept an emotion-state prop generically now; don't hardcode a count.

## Phase 2 — Create (Week 3)

- **Web:** `app/(tabs)/create/page.tsx` — compose/schedule form (platform picker respects each connection's `publish_mode`), calendar/queue view. Voice Studio entry: script input, voice picker, 30-second preview button, full-generate button with async "we'll notify you" UX (generation is queued, not instant — don't build a blocking spinner for it). The four AI Content Studio modules (Idea Builder, Hook Lab, Script Builder, Caption Studio) as forms with streamed output.
- **Mobile port.**

**Needs from backend:** `routers/social-scheduling.ts`, `routers/voice-studio.ts`, `packages/ai/content-studio.ts`'s procedure shapes.

## Phase 3 — Network (Weeks 4–5, the largest phase)

- **Web:** Discover/Match (swipe-style actions: pass/interested/save/priority-request), Collaboration Workspace (brief + chat once matched), Squads, Quests, Duels, and the creator's own Passport edit/preview view. Separately: `app/passport/[handle]/page.tsx` — the **public, unauthenticated** route, genuinely different auth context from everything else in this phase.
- **Mobile port** — note `apps/mobile/app/passport/[handle].tsx`'s own header flags that a public unauthenticated route is an odd fit for a native app; treat the mobile version as "view another creator's passport in-app," not the shareable link (that's the web route).

**Needs from backend:** `routers/creator-network.ts`, `routers/duels.ts`.

## Phase 4 — Grow (Week 6)

- **Web:** analytics/insights, streak history, milestones/badges, contextual Earn widget. This is the one screen with a real design reference — the "Growth" Free/Pro Figma frames found during the architecture session (momentum %, followers/impressions/engagement cards, best-time-to-post, audience/platform breakdown) are the actual spec here, not a guess.
- **Mobile port.**

**Real gap worth naming before you build this:** `packages/analytics/` (Stage 6) was scoped for the **admin dashboard** — staff-facing, aggregate, cross-user numbers. This tab needs **per-creator** metrics (this user's own growth), which is a different, lighter query path that was never separately specified. Don't assume `packages/analytics/` serves this tab directly — flag it back to backend as a small addition to `routers/streak-gamification.ts` or `routers/analytics.ts` (personal-scope procedures) before building against it.

## Phase 5 — Profile + Billing (Week 7)

- **Web:** account settings, subscription/billing UI (plan picker, Paystack/Stripe checkout initiation), creator profile editing.
- **Mobile port.**

**Known blocker, use placeholders:** real plan names and prices are still unresolved (DATA_MODEL.md item A — Pro/Growth vs. Creator/Growth/Automation, different numbers in each source doc). Build the plan-picker UI data-driven off whatever `plans.list` returns rather than hardcoding tier names into components — whichever pricing table wins, the UI shouldn't need a rewrite.

## Phase 6 — Admin Dashboard (Week 8, web only)

`app/admin/` — overview/analytics (all 9 categories per ADMIN_DASHBOARD.md), users, moderation queue, billing ops, configuration. No mobile equivalent (integrated-into-web decision, Stage 6). Lower priority than Phases 1–5 — this is staff-facing, not creator-facing; slip it if the schedule is tight.

## Phase 7 — Integration, QA, Polish (Weeks 9–10)

- Swap every mock resolver dependency for real backend logic; re-test each phase's flows end to end.
- Accessibility pass against doc3's baseline (§25): readable contrast, screen-reader labels, logical focus order, no color-only signaling, large touch targets.
- Low-data / low-end-device performance pass — this product is explicitly Africa/Lagos-first; test on a mid/low-range Android device and a throttled connection, not just your dev machine.
- Resolve or explicitly punt (with a tracked follow-up) every still-open item from OPEN_QUESTIONS.md that touches a screen you built: Jarvis's real state count and color, onboarding step depth, Quests tab placement.

## Definition of done, per phase

A phase isn't done when the screen renders — it's done when: the flow works on both web and mobile, it's driven by real (not mock) backend data, it degrades reasonably on a slow connection, and it doesn't silently swallow errors (every mutation has a visible failure state).
