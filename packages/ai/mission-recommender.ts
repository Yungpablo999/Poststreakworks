// ============================================================================
// Mission recommender
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/ai/AI_ORCHESTRATION.md
// ============================================================================
//
// Backs packages/api/routers/missions.ts's `missions.today` procedure.
//
// Design (founder-confirmed, Stage 4): hybrid, not fully-LLM and not
// fully-rules.
//   1. A deterministic candidate step picks WHICH mission type fits today
//      (streak state, time of day, recent activity, backlog — category
//      list from Post_Streak_App 2.md §10: ideation | production |
//      publishing | engagement | collaboration | growth_experiment |
//      business | recovery). No Groq call in this step.
//   2. Only the copy/wording is personalized via a Groq call
//      (packages/integrations/groq.ts), using a template from
//      packages/ai/prompts/.
//
// Deliberately NOT: asking Groq to decide what to recommend. Doc3's own
// risk register warns directly against generic, ungrounded AI generation.
// ============================================================================
