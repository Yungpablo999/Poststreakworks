# PostStreak — Data Model (Stage 1 of 8)

Status: **Scaffolded, pending founder review.** Stub migrations only — no implementation SQL. See `supabase/migrations/` for the 8 stub files this doc governs.

This is a planning artifact, not a build artifact. Nothing here has been run against a database; no Supabase project has been linked. Actual implementation SQL, indexes, and RLS policies come later, once this stage is approved and the team is ready to move from planning to building.

---

## 1. Scope confirmed for this rebuild (founder decisions, 2026-08-14)

Three source docs sit in the repo root and describe PostStreak at three different points in time (oldest → newest: `Post_Streak_App 2.md`, Jun 2026 → `PostStreak_Creator_Engine_Strategy 2.md`, Jul 2026 → `PostStreak Architecture Document.md`, Aug 2026). They are not three competing visions — the team scoped down from the June blueprint's full platform to what's actually live today (Aug doc), and this rebuild now pulls part of that original blueprint back in deliberately, not by accident.

- **Platform:** monorepo. React Native (mobile, primary client) + Next.js (web) + a shared backend package, all in one repo. Not a web-only rebuild.
- **Baseline (carried forward, not re-litigated):** multi-platform scheduling (LinkedIn live/API, X live/assisted-copy, Meta + TikTok planned), the streak engine and Jarvis emotion system, the credit system, Voice Studio (Fish Audio, in progress), billing via Paystack (NGN) + Stripe (USD), Resend email.
- **Pulled into scope from the June blueprint:** Matching/Discovery, Collaboration Workspace, Squads/Community, Creator Passport.
- **Explicitly deferred — not modeled in this pass:** Brand & Agency Platform, Opportunity Marketplace, Creator Services Marketplace, Payments/Contracts/Escrow. These are real parts of the long-term platform but future work; no tables, no stubs, not even placeholders yet, so this stage doesn't quietly pre-commit the team to a marketplace data shape before that gets its own plan → questions → scaffold pass.

## 2. Entity domains (→ one migration stub each)

| Domain | File | Covers |
|---|---|---|
| Accounts & Identity | `20260814000001_accounts_and_identity.sql` | users, creator_profiles, roles (creator / staff_admin only) |
| Social Scheduling | `20260814000002_social_scheduling.sql` | platform_connections, scheduled_posts, per-platform publish_mode |
| Streak, Jarvis & Gamification | `20260814000003_streak_jarvis_gamification.sql` | streak_states, streak_events, jarvis_emotion_state, streak_freezes, credits, milestones |
| Creator Network | `20260814000004_creator_network.sql` | discovery_actions, matches, conversations/messages, collaboration_briefs/tasks, squads, Creator Passport |
| Voice Studio | `20260814000005_voice_studio.sql` | voice_projects, series_voices, minutes wallet + ledger, top-ups |
| Billing & Subscriptions | `20260814000006_billing_and_subscriptions.sql` | subscription_plans, subscriptions, payment_transactions (Paystack + Stripe) |
| Safety & Moderation | `20260814000007_safety_and_moderation.sql` | blocks, reports, moderation_actions |
| Analytics Events | `20260814000008_analytics_events.sql` | generic append-only event log |
| Missions | `20260814000009_missions.sql` | daily recommendation system — *added during Stage 3, see §6* |
| Duels | `20260814000010_duels.sql` | two-person streak accountability pairing — *added during Stage 5, see §7* |
| User Sanctions | `20260814000011_user_sanctions.sql` | account status enum + staff sanction audit log — *added during Stage 6, see §8* |

Each file's header comment is the actual spec for this pass — this table is a map, not a duplicate of that content.

## 3. Assumptions & flagged decisions

Items the team raised (via founder Q&A) that don't yet have a firm answer. Where I picked a working default to avoid stalling the scaffold, it's marked **ASSUMED** — cheap to overturn, nothing built on top of it yet. Where I didn't pick one, it's marked **OPEN**.

| # | Item | Status | Detail |
|---|---|---|---|
| A | Pricing tier names/prices | **OPEN** | Architecture Doc: Free/Pro ₦2,999 ($7)/Growth ₦9,999 ($19). Creator Engine Strategy: Creator/Growth/Automation, same NGN anchors, different USD, third paid tier. `subscription_plans` structure is stubbed; no rows seeded. |
| B | Jarvis emotion-state count | **OPEN** | 9 (Architecture Doc, matches founder ground truth) vs. 8 (Creator Engine Strategy). Enum not created yet. |
| C | X publish lifecycle | **ASSUMED** | Generic `publish_mode` ('api' \| 'assisted') per platform_connection, so X's current copy-paste-assisted reality and a future true auto-post don't require a schema change either way. |
| D | Streak-freeze × credit interaction | **ASSUMED (structure only)** | Table stubbed as its own entity (`streak_freezes`) rather than folded into `credits`, since the mechanic could land as any of: spent from the credit ledger, a separate tier entitlement counter, or milestone-earned-only. Keeping it separate is the lower-regret default — cheaper to merge two tables later than to split one. |
| E | Multi-currency billing schema | **ASSUMED** | One `subscriptions` table with `processor`/`currency` discriminator columns, not separate tables per processor. |
| F | RLS policy philosophy | **RESOLVED — Stage 8** | Strict RLS everywhere; the narrow cross-user reads that legitimately need it (leaderboards, squad rosters, discovery feeds) go through explicit security-definer functions rather than a blanket exception. No policies are actually written in this stub set yet — that's real implementation, out of scope for a planning pass — but the philosophy governing them is now settled. |
| G | Voice/Video schema boundary | **ASSUMED** | Single `public` schema for now (modular monolith), not a separate Postgres schema or separate Supabase project. Revisit if/when Voice Studio actually splits into its own service. |
| H | Video Studio timing | **ASSUMED** | Not stubbed this pass. Voice Studio is in progress and has a concrete metering model to build against; Video Studio is explicitly "build after voice" per the Creator Engine Strategy. Carried to OPEN_QUESTIONS (Stage 8). |
| I | Source file provenance | **RESOLVED — Stage 8** | Confirmed canonical, no newer versions exist elsewhere. All decisions made across all 8 stages stand on the docs as read. |

Also carried forward, not data-model-blocking but worth fixing before it lands in a schema or a deck: the sibling voice-agent product is named "Joy" in the Architecture Doc and "Polykoe Voices" in the June blueprint.

## 4. Explicitly out of scope for this pass

No tables, stubs, or naming reserved for: Brand & Agency Platform, Opportunity Marketplace, Creator Services Marketplace, Payments/Contracts/Escrow, or Video Studio. These get their own plan → questions → scaffold cycle when the team decides to pull them forward — deliberately not pre-shaped by decisions made in this pass.

## 5. Next

Open items B, F, and I need answers before real implementation SQL gets written for the domains they touch — they don't block moving to Stage 2, but they shouldn't get silently resolved by default either. Full list re-surfaces in OPEN_QUESTIONS (Stage 8).

**Waiting for "approved, continue" (or corrections) before starting Stage 2: BACKEND_ARCHITECTURE.** *(Approved 2026-08-14.)*

## 6. Addendum — added during Stage 3 (2026-08-14)

Stage 3's screen inventory surfaced a real gap in this stage's original scope call: Post_Streak_App 2.md's Home screen is built around a "daily mission" recommendation system (§10-11) — a distinct doc3 concept from the four Creator Network pillars (Matching, Collaboration, Squads, Passport) confirmed in §1 above. It was never asked about here, so it was never modeled. The founders confirmed it's in scope during Stage 3's questions.

`20260814000009_missions.sql` was added to cover it. Recorded here as an addendum rather than silently folded into §1/§2 above, so this document stays an honest record of when each decision was actually made.

## 7. Addendum — added during Stage 5 (2026-08-14)

Two more decisions made during WORKFLOWS, both affecting this stage's tables directly:

- **Streak-qualifying actions expanded.** Creator Engine Strategy is explicit that only a successful publish should advance the streak. Founders chose to override that and expand it: mission completion and collaboration completion now advance the same streak counter a publish does. See `20260814000003_streak_jarvis_gamification.sql`'s updated Relationships note and `packages/workflows/WORKFLOWS.md` for the abuse-risk caveat carried forward from the source doc.
- **Duels confirmed in scope.** Like Missions, this wasn't one of the four Creator Network pillars asked about in Stage 1 — it surfaced as a gap during Stage 5. `20260814000010_duels.sql` was added to cover it; it deliberately has no separate progress table, reading the existing `streak_events` log instead.

## 8. Addendum — added during Stage 6 (2026-08-14)

Doc3's admin requirements (§23) need real suspend/restrict/warn states and an audit trail — Stage 1's `users.status` was only ever a generic placeholder field. `20260814000011_user_sanctions.sql` supersedes it via a follow-up migration (not an edit to the original file — see that migration's header for why) with a proper `account_status` enum and a `user_sanctions` log table. Staff roles stay a single flat `staff_admin` for now — founder-confirmed, matches team size today; doc3's least-privilege principle is worth revisiting once there's an actual team large enough to need it.
