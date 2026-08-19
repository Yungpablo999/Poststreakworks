# PostStreak — AI Orchestration Layer (Stage 4 of 8)

Status: **Scaffolded, pending founder review.** Stub source files only — no prompts written, no implementation. Planning artifact, not a build artifact.

---

## 1. Decisions confirmed this stage (founder answers, 2026-08-14)

- **Mission recommender: hybrid.** Deterministic rules pick the mission *type*; Groq only personalizes the copy. No LLM call decides *what* to recommend.
- **AI Content Studio: a focused four, not all nine.** Idea Builder, Hook Lab, Script Builder, Caption Studio ship now. Trend-to-You, Post Doctor, Repurpose, Series Builder, and Campaign Assistant (doc3 §11) are explicitly not started.
- **Voice Studio full generation: async.** `generate.full` goes through the Stage 2 job queue, never called synchronously. `generate.preview` stays synchronous — it's short enough not to need it.
- **Moderation: AI-assisted flagging, human decides.** No automated enforcement anywhere in this pass.

## 2. Two-layer split

- **`packages/integrations/`** (Stage 2) — raw vendor clients. `groq.ts` and `fish-audio.ts` were promoted out of that package's consolidated stub this stage into their own files, since AI orchestration made them central enough to warrant it. These files know how to *talk to* the vendor — auth, request/response shape — and nothing about what PostStreak uses them for.
- **`packages/ai/`** (this stage, new) — the business logic built on top: the mission recommender, the four content-studio modules, voice generation orchestration, moderation flagging, and the prompt templates they all draw from. This is where prompt engineering and product judgment live, deliberately separate from "how do I call Groq."

## 3. File map

| File | Purpose |
|---|---|
| `packages/integrations/groq.ts` | Model-agnostic Groq wrapper, streaming-capable |
| `packages/integrations/fish-audio.ts` | Fish Audio wrapper — preview + full-render requests |
| `packages/ai/mission-recommender.ts` | Rules-based candidate selection + Groq copy personalization |
| `packages/ai/content-studio.ts` | Idea Builder, Hook Lab, Script Builder, Caption Studio |
| `packages/ai/voice-generation.ts` | Preview (sync) / full render (async job) orchestration, wallet debit timing |
| `packages/ai/moderation.ts` | AI flagging into the staff review queue — never auto-enforces |
| `packages/ai/prompts/index.ts` | Versioned prompt templates, one per consumer |

## 4. Why sync/streamed for text, async/queued for voice

Not a arbitrary split — it follows from what each vendor is actually good at. The Architecture Doc explicitly frames Groq as chosen *for* low latency, "enough to embed into core product flows rather than bolt on as a side feature" (§3) — that's a direct argument for synchronous, streamed calls sitting right inside a tRPC procedure. Fish Audio's cost is per-minute-of-output (Creator Engine Strategy §04), which means render time scales with script length in a way Groq's text generation doesn't — exactly the profile Stage 2 built the async job queue for.

## 5. Assumptions & flagged decisions

| # | Item | Status | Detail |
|---|---|---|---|
| R | Provider abstraction depth | **ASSUMED** | A light wrapper per vendor (groq.ts, fish-audio.ts), not a heavy unified multi-provider interface. Only one text provider and one voice provider exist today — a bigger abstraction would be speculative generality with nothing yet to generalize over. |
| S | Prompt storage | **IMPLEMENTED, not just assumed** | `packages/ai/prompts/` — versioned, reviewable in diffs, separate from orchestration code. |
| T | Generation caching | **ASSUMED — deliberately skipped** | No caching layer this pass. Premature before there's real usage data showing what's actually worth caching; revisit if cost data justifies it. |

## 6. Explicitly out of scope this pass

The other five AI Content Studio modules (Trend-to-You, Post Doctor, Repurpose, Series Builder, Campaign Assistant). Video Studio (Gemini/Veo) — still deferred per the Stage 1 scope decision, doesn't even have a data model entry yet. Any real prompt content, model selection, or token/cost budgets — those are implementation, not architecture.

## 7. Next

Feeds Stage 5 (WORKFLOWS — the streak-rescue nudge pipeline, the missions.today call pattern end-to-end, Voice Studio's full user journey) and Stage 6 (ADMIN DASHBOARD — the human review queue that AI-assisted moderation flags into). Open items from earlier stages (Jarvis state count and color, RLS philosophy, source-file provenance, onboarding depth, quests placement) are unaffected and still carry to OPEN_QUESTIONS (Stage 8).

**Waiting for "approved, continue" (or corrections) before starting Stage 5: WORKFLOWS.** *(Approved 2026-08-14.)*
