import type { SupabaseClient } from "@supabase/supabase-js";

// Assembles frontend/shared/types/user.ts's UserProfile shape from across
// users/creator_profiles/streak_states/credits — no single table has all of
// it. Shared by sign-in, sign-up, and GET /user/profile.
export async function assembleUserProfile(supabase: SupabaseClient, userId: string) {
  const [userRow, profileRow, streakRow, subscriptionRow] = await Promise.all([
    supabase.from("users").select("id, email, display_name, avatar_url, created_at, updated_at").eq("id", userId).single(),
    supabase.from("creator_profiles").select("bio, niche, slug").eq("user_id", userId).maybeSingle(),
    supabase.from("streak_states").select("current_streak, last_qualifying_day, jarvis_emotion").eq("user_id", userId).maybeSingle(),
    supabase.from("subscriptions").select("id").eq("user_id", userId).in("status", ["active", "trialing"]).maybeSingle(),
  ]);

  if (userRow.error || !userRow.data) return null;

  const [earns, redeems] = await Promise.all([
    supabase.from("credits").select("amount").eq("user_id", userId).eq("type", "earn"),
    supabase.from("credits").select("amount").eq("user_id", userId).eq("type", "redeem"),
  ]);
  const xp =
    (earns.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0) -
    (redeems.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const level = Math.max(1, Math.floor(xp / 250) + 1);

  const emotion = streakRow.data?.jarvis_emotion;
  const streakStatus =
    emotion === "thriving" || emotion === "happy" || emotion === "content" || emotion === "neutral"
      ? "active"
      : emotion === "concerned" || emotion === "worried"
        ? "at_risk"
        : "frozen";

  return {
    id: userRow.data.id,
    name: userRow.data.display_name ?? "",
    handle: profileRow.data?.slug ?? "",
    email: userRow.data.email,
    avatarUrl: userRow.data.avatar_url ?? undefined,
    bio: profileRow.data?.bio ?? undefined,
    niche: profileRow.data?.niche ?? "",
    tier: subscriptionRow.data ? "pro" : "free",
    streakCount: streakRow.data?.current_streak ?? 0,
    streakStatus,
    level,
    xp,
    nextLevelXp: level * 250,
    createdAt: userRow.data.created_at,
    updatedAt: userRow.data.updated_at,
  };
}
