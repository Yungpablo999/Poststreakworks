import { countPosts, getCheckInSummary, personaFor, type Persona, type PlanTier } from "@poststreak/workflows";

// What the server knows about a creator that decides which Home, quests and notes they get.
// One definition (workflows/persona.ts), used by the launch payload, Home and Quests alike.

export type CreatorContext = { persona: Persona; tier: PlanTier; longestStreakDays: number; postsMade: number };

export async function creatorContext(user: { id: string; tier: PlanTier }): Promise<CreatorContext> {
  const [checkIn, postsMade] = await Promise.all([getCheckInSummary(user.id), countPosts(user.id)]);
  return {
    persona: personaFor({ longestStreakDays: checkIn.longestDays, postsMade }),
    tier: user.tier,
    longestStreakDays: checkIn.longestDays,
    postsMade,
  };
}
