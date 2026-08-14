# PostStreak — Open Questions (Stage 8 of 8)

Status: **Final synthesis.** Every unresolved item from Stages 1–7, in one place. This is the closing document of the pre-build architecture session that started 2026-08-14 — not a new scaffolding pass.

---

## Session map

| Stage | Doc |
|---|---|
| 1. Data Model | [supabase/DATA_MODEL.md](supabase/DATA_MODEL.md) |
| 2. Backend Architecture | [packages/api/BACKEND_ARCHITECTURE.md](packages/api/BACKEND_ARCHITECTURE.md) |
| 3. Frontend Architecture | [apps/web/FRONTEND_ARCHITECTURE.md](apps/web/FRONTEND_ARCHITECTURE.md) |
| 4. AI Orchestration | [packages/ai/AI_ORCHESTRATION.md](packages/ai/AI_ORCHESTRATION.md) |
| 5. Workflows | [packages/workflows/WORKFLOWS.md](packages/workflows/WORKFLOWS.md) |
| 6. Admin Dashboard | [apps/web/app/admin/ADMIN_DASHBOARD.md](apps/web/app/admin/ADMIN_DASHBOARD.md) |
| 7. System Design | [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) |
| 8. Open Questions | this file |

Three real gaps were caught and patched forward during this session rather than left silent: **Missions** (Stage 3), **Duels** (Stage 5), and **User Sanctions** (Stage 6) — none were part of Stage 1's original approved scope, all surfaced when a later stage's questions needed a real answer Stage 1 didn't have. Each is recorded as an addendum in the stage doc that added it, not folded in as if it had always been there.

## 1. Resolved this stage

Four items had been sitting open since as early as Stage 1 (source docs) and Stage 5 (billing, duels) — closed out now since there's no later checkpoint to catch them:

| Item | Resolution | Recorded in |
|---|---|---|
| RLS policy philosophy | Strict RLS everywhere; narrow cross-user reads (leaderboards, discovery, duel status) via security-definer functions | DATA_MODEL.md item F, SYSTEM_DESIGN.md §6 |
| Duel end condition | A missed shared-completion day skips only that day's reward — doesn't fail or end the duel | duel-lifecycle.ts, duels.sql |
| Billing renewal/proration | Upgrade/downgrade takes effect at the next renewal — no mid-cycle proration | billing-lifecycle.ts |
| Source-doc provenance | The three docs in this repo are canonical — no newer versions exist elsewhere | DATA_MODEL.md item I |

## 2. Still open — needs a product/brand answer, not an architectural one

These don't have clean multiple-choice options because the answer is a fact or a creative decision, not a tradeoff:

- **Jarvis's real emotion-state count.** Architecture Doc says 9, Creator Engine Strategy says 8. The `jarvis_emotion_state` enum in `streak_jarvis_gamification.sql` is still unwritten pending this.
- **Jarvis's real color.** Confirmed *not* `#FF6581`/pink, contrary to the Architecture Doc (stated twice, §6 and §10). No replacement value provided yet — `packages/design-tokens/index.ts` has this flagged, not guessed at.
- **Onboarding step depth.** Stage 5 resolved *when* onboarding ends (first mission or first post, whichever comes first) but not the actual step count — a short 3–4 step flow vs. doc3's fuller 7-step progressive version (§9).

## 3. Lower-priority — assumed defaults, listed for correction rather than left silent

Everything below got a reasonable default rather than a blocking question, because getting it wrong costs little to fix later. Flagging them here so "assumed" doesn't quietly become "decided" by default.

| Item | Assumed default | From |
|---|---|---|
| Mobile navigation library | Expo Router | Stage 3 |
| Component organization | Domain-aligned, mirroring the data model | Stage 3 |
| Quests tab placement | Nested under Network, not Grow — lowest-confidence assumption in the whole session | Stage 3 |
| AI provider abstraction depth | Light per-vendor wrapper, not a unified multi-provider interface | Stage 4 |
| Generation caching | Skipped entirely for now | Stage 4 |
| Feature-flag mechanism | DB-backed table, no third-party flag service | Stage 6 |
| Revenue metric join | `user_id` as the only shared key between billing and voice-minutes data | Stage 6 |

## 4. Not designed at all — deliberately deferred, not forgotten

- **Payment webhook signature verification** (Paystack, Stripe). Flagged in Stage 7 as a real security gap — this needs a real answer before billing ever goes live, not an indefinite "later."
- **Cancellation/dunning flows.** Stage 8 resolved upgrade/downgrade timing but not what happens when a payment fails or a user cancels.
- **CI/CD pipeline detail.** Stage 7 named the deployment targets (Vercel, EAS); what runs on PR vs. merge vs. release tag was deliberately left for whoever sets up the actual tooling.
- **Support/ticketing system.** Not a gap — doc3 itself specifies founder-led WhatsApp/email at this company stage (§54). Revisit once that guidance stops applying, not before.

## 5. Long-term, explicitly out of this build

Confirmed out of scope in Stage 1, still out of scope now — the four doc3 pillars deliberately not modeled anywhere in this session:

- Brand & Agency Platform
- Opportunity Marketplace
- Creator Services Marketplace
- Payments, Contracts & Escrow

Video Studio (Gemini/Veo) sits alongside these — scoped in Creator Engine Strategy as "build after voice," never given a data model entry.

## 6. What this session did not do

No code was written. No tooling was installed or initialized — no `git init` beyond what the founders explicitly authorized, no `package.json`, no `turbo.json`, no framework config, no cloud project provisioning. Every file created across all 8 stages is either a markdown planning document or a source-file stub containing only a header comment describing intended contents. That boundary held for the entire session, per the founders' own framing at Stage 1: planning and scaffolding, not building.

---

**End of the 8-stage session. No further stage to start — this document is the handoff point for whoever picks up implementation.**
