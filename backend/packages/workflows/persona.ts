import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./service-client";
import type { Persona } from "./quests";

// "New" or "returning": which Home a creator sees and which quests they are offered. It is a
// fact about their history, decided here and nowhere in the app:
//   returning = three or more days checked in in a row at some point, OR a post they have made
//               (published through PostStreak, or read from a connected account).
// A first check-in or a first draft doesn't flip it.

export const RETURNING_MIN_STREAK_DAYS = 3;

export function personaFor(input: { longestStreakDays: number; postsMade: number }): Persona {
  return input.longestStreakDays >= RETURNING_MIN_STREAK_DAYS || input.postsMade > 0 ? "returning" : "new";
}

/** How many posts the creator has made (see creator_posts, migration …23). */
export async function countPosts(userId: string, db: SupabaseClient = getServiceClient()): Promise<number> {
  const { count, error } = await db.rpc("creator_posts", { p_user_id: userId }, { count: "exact", head: true });
  if (error) throw new Error(`countPosts: ${error.message}`);
  return count ?? 0;
}
