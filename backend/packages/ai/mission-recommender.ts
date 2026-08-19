import { groqChat } from "@poststreak/integrations/groq";
import { missionPersonalizationPrompt } from "./prompts";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Mission Types (from Post_Streak_App 2.md §10)
// ============================================================================

type MissionType =
  | "ideation"
  | "production"
  | "publishing"
  | "engagement"
  | "collaboration"
  | "growth_experiment"
  | "business"
  | "recovery";

type MissionCandidate = {
  type: MissionType;
  baseInstructions: string;
  difficulty: "easy" | "medium" | "hard";
};

// ============================================================================
// Rules Engine — picks the mission type, no LLM involved
// ============================================================================

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(hour, 10);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function selectMissionType(params: {
  currentStreak: number;
  lastQualifyingDay: string | null;
  today: string;
  publishedCount: number;
  recentMissionTypes: string[];
  connectedPlatforms: number;
  collaborationCount: number;
  hasUnfinishedDrafts: boolean;
}): MissionCandidate {
  const {
    currentStreak,
    lastQualifyingDay,
    today,
    publishedCount,
    recentMissionTypes,
    connectedPlatforms,
    collaborationCount,
    hasUnfinishedDrafts,
  } = params;

  // 1. RECOVERY — streak at risk (had streak but no qualifying action today)
  if (
    currentStreak > 0 &&
    lastQualifyingDay !== today &&
    lastQualifyingDay !== null
  ) {
    return {
      type: "recovery",
      baseInstructions:
        "You haven't posted yet today. Choose one unfinished draft and move it forward — even scheduling for tomorrow counts. Protect your streak.",
      difficulty: "easy",
    };
  }

  // 2. PUBLISHING — no published posts yet
  if (publishedCount === 0) {
    return {
      type: "publishing",
      baseInstructions:
        "Create and schedule your first post. It can be anything — a thought, a lesson, or a behind-the-scenes moment. Start building the habit.",
      difficulty: "medium",
    };
  }

  // 3. PUBLISHING — has drafts but hasn't published recently
  if (hasUnfinishedDrafts) {
    return {
      type: "publishing",
      baseInstructions:
        "You have drafts waiting. Pick one, polish it, and schedule it. Finished content beats perfect content.",
      difficulty: "medium",
    };
  }

  // 4. ENGAGEMENT — every 3rd mission should focus on community
  if (recentMissionTypes.filter((t) => t === "engagement").length <
    recentMissionTypes.length / 3) {
    return {
      type: "engagement",
      baseInstructions:
        "Engage with 3 creators in your niche. Leave thoughtful comments on their latest posts. Community builds audience.",
      difficulty: "easy",
    };
  }

  // 5. COLLABORATION — if connected to matches but not collaborating
  if (collaborationCount === 0 && connectedPlatforms > 0) {
    return {
      type: "collaboration",
      baseInstructions:
        "Reach out to a creator you admire. Propose a simple collaboration — a joint post, a shoutout swap, or a shared challenge.",
      difficulty: "medium",
    };
  }

  // 6. PRODUCTION — batch content creation
  if (publishedCount < 10) {
    return {
      type: "production",
      baseInstructions:
        "Batch-create 3 post ideas. Write headlines for each — you can refine them later. Ideas compound.",
      difficulty: "medium",
    };
  }

  // 7. IDEATION — experienced creators
  if (publishedCount >= 10) {
    return {
      type: "ideation",
      baseInstructions:
        "Write down 5 content ideas your audience would find valuable. Pick the best one and outline it in detail.",
      difficulty: "easy",
    };
  }

  // 8. GROWTH_EXPERIMENT — default for active creators
  return {
    type: "growth_experiment",
    baseInstructions:
      "Try one new content format today — a carousel, a thread, or a short video. Experimentation is how you find what works.",
    difficulty: "medium",
  };
}

// ============================================================================
// Mission Recommender — public API
// ============================================================================

export type MissionRecommendation = {
  type: MissionType;
  instructions: string;
  difficulty: "easy" | "medium" | "hard";
  source: "rules" | "ai_personalized";
};

export async function recommendMission(params: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<MissionRecommendation> {
  const { supabase, userId } = params;
  const today = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })
    .split("T")[0]!;

  // Fetch context data
  const [streakState, recentPosts, recentMissions, connections, briefs] =
    await Promise.all([
      supabase
        .from("streak_states")
        .select("current_streak, last_qualifying_day")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("scheduled_posts")
        .select("status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("missions")
        .select("type, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("platform_connections")
        .select("platform")
        .eq("user_id", userId)
        .is("disconnected_at", null),
      supabase
        .from("collaboration_briefs")
        .select("id")
        .eq("created_by", userId),
    ]);

  const publishedCount =
    recentPosts.data?.filter((p) => p.status === "published").length ?? 0;
  const recentTypes =
    recentMissions.data?.map((m) => m.type).filter(Boolean) ?? [];

  // Step 1: Rules engine picks the type
  const candidate = selectMissionType({
    currentStreak: streakState.data?.current_streak ?? 0,
    lastQualifyingDay: streakState.data?.last_qualifying_day ?? null,
    today,
    publishedCount,
    recentMissionTypes: recentTypes as string[],
    connectedPlatforms: connections.data?.length ?? 0,
    collaborationCount: briefs.data?.length ?? 0,
    hasUnfinishedDrafts:
      recentPosts.data?.some((p) => p.status === "draft") ?? false,
  });

  // Step 2: Groq personalizes the copy (best-effort, fall back to base)
  try {
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("niche")
      .eq("user_id", userId)
      .single();

    const { data: user } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", userId)
      .single();

    const prompt = missionPersonalizationPrompt({
      missionType: candidate.type,
      baseInstructions: candidate.baseInstructions,
      creatorNiche: profile?.niche ?? null,
      creatorName: user?.display_name ?? "Creator",
      currentStreak: streakState.data?.current_streak ?? 0,
      timeOfDay: getTimeOfDay(),
    });

    const personalized = await groqChat({
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: prompt.temperature,
      max_tokens: 256,
    });

    if (personalized && personalized.length > 20) {
      return {
        type: candidate.type,
        instructions: personalized.trim(),
        difficulty: candidate.difficulty,
        source: "ai_personalized",
      };
    }
  } catch {
    // Groq failure — fall through to base instructions
  }

  return {
    type: candidate.type,
    instructions: candidate.baseInstructions,
    difficulty: candidate.difficulty,
    source: "rules",
  };
}
