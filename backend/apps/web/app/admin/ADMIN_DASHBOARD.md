# PostStreak — Admin Dashboard Layer (Stage 6 of 8)

Status: **Scaffolded, pending founder review.** Stub route/router/analytics files only — no implementation, no charts, no real queries. Planning artifact, not a build artifact.

---

## 1. Decisions confirmed this stage (founder answers, 2026-08-14)

- **Integrated into apps/web**, not a separate deployable app. `apps/web/app/admin/`, gated by the `staff_admin` role, same deployment as the creator-facing product.
- **Staff roles stay flat** — one `staff_admin` role, no moderator/finance_admin/super_admin split yet. Matches team size today.
- **Full analytics dashboard, not deferred.** All nine of doc3's metric categories (§68) are in scope now, not pushed to later work — overrides my recommendation to start with operational queues only.
- **User sanctions get real schema.** Suspend/restrict/warn are now real states with an audit trail, not a placeholder status field.

## 2. Module map

| Route | Purpose |
|---|---|
| `admin/layout.tsx` | Staff-gated shell, separate nav from the creator app |
| `admin/page.tsx` | Analytics dashboard overview — all nine `packages/analytics/` categories |
| `admin/users/page.tsx` | Search, verify, history, sanctions (warn/restrict/suspend) |
| `admin/moderation/page.tsx` | The queue `moderation-flow.ts` (Stage 5) promised would exist |
| `admin/billing/page.tsx` | Subscription lookup, refunds, reconciliation |
| `admin/configuration/page.tsx` | Feature flags, generation/rate limits, mission templates |

`packages/api/routers/admin.ts` backs configuration and the analytics rollups. Domain-specific staff actions (sanctions, report resolution, refunds) stay in their own domain router — `accounts.ts`, `safety-moderation.ts`, `billing.ts` — gated by role, not duplicated into `admin.ts`. All three got a short header update this stage.

## 3. Analytics — the full nine, since that's what was confirmed

| File | Category | Source |
|---|---|---|
| `packages/analytics/acquisition.ts` | Waitlist conversion, referral share, CAC | `analytics_events.sql` |
| `packages/analytics/activation.ts` | Onboarding completion, first mission/output, time-to-value | `analytics_events.sql`, `missions.sql` |
| `packages/analytics/engagement.ts` | Weekly meaningful actions | `streak_events` (expanded definition, WORKFLOWS.md §2) |
| `packages/analytics/retention.ts` | D1/D7/D30/W8, cohort return | `streak_events`, `analytics_events.sql` |
| `packages/analytics/network.ts` | Profile availability, interest/match rates | `creator_network.sql` |
| `packages/analytics/collaboration.ts` | Briefs, completion, cancellation, review quality | `creator_network.sql` |
| `packages/analytics/safety.ts` | Report rate, severity, response time, repeat offenders | `safety_and_moderation.sql`, `user_sanctions.sql` |
| `packages/analytics/ai-quality.ts` | Save/edit rate, project use, rating, cost per user | `packages/ai/` modules |
| `packages/analytics/revenue.ts` | Paid conversion, MRR, gross margin, churn | `billing_and_subscriptions.sql`, `voice_studio.sql` |

Doc3's tenth category, Marketplace (GMV, take rate), is deliberately absent — there's no marketplace yet.

## 4. Addendum — the User Sanctions gap

Stage 1's `users` table only ever had a generic `status` field — never designed against doc3's actual admin requirement (search/verify/suspend/restrict/warn/review-history, §23). Patched forward as a **new migration**, not an edit to the original:

- `supabase/migrations/20260814000011_user_sanctions.sql` — `account_status` enum + `user_sanctions` audit log.
- `supabase/DATA_MODEL.md` §8, `packages/api/BACKEND_ARCHITECTURE.md` §9 (addenda).
- `packages/api/routers/accounts.ts`, `routers/billing.ts` (header notes on new staff-gated procedures).

Modeling this as a follow-up migration rather than editing `20260814000001_accounts_and_identity.sql` in place is deliberate: Stage 1 was already approved, so the honest way to change its output is a new migration, not a silent rewrite — the same discipline a real, already-deployed Supabase project would require.

## 5. Assumptions & flagged decisions

| # | Item | Status | Detail |
|---|---|---|---|
| X | Revenue metric join | **OPEN** | `revenue.ts`'s gross-margin calculation joins `billing_and_subscriptions.sql` against `voice_studio.sql`'s minutes ledger with only `user_id` as a shared key — worth confirming that's sufficient once this gets built for real, rather than needing a more explicit link. |
| Y | Feature-flag mechanism | **ASSUMED** | A DB-backed flags table, editable from `admin/configuration`. No third-party flag service (LaunchDarkly, GrowthBook, etc.) — consistent with Stage 2's no-new-vendor-until-justified pattern. |

## 6. Explicitly out of scope this pass

Support/ticketing tooling — doc3 itself specifies founder-led WhatsApp/email at this company stage (§54), not a built system; building one now would be scope beyond what the source doc recommends for where the company actually is. Campaign operations (marketplace is deferred). Real chart rendering, query implementation, or RBAC beyond the flat role.

## 7. Next

Feeds Stage 7 (SYSTEM_DESIGN — pulls every stage into one picture) and Stage 8 (OPEN_QUESTIONS). Open items from every prior stage (Jarvis state count and color, RLS philosophy, source-file provenance, onboarding depth, quests placement, duel end condition, billing renewal policy, plus this stage's revenue-metric join) all carry forward.

**Waiting for "approved, continue" (or corrections) before starting Stage 7: SYSTEM_DESIGN.** *(Approved 2026-08-14.)*
