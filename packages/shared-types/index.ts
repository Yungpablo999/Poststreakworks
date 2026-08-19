export type UserRole = "creator" | "staff_admin";
export type AccountStatus = "active" | "warned" | "restricted" | "suspended" | "closed";
export type Platform = "linkedin" | "twitter" | "meta" | "tiktok";
export type PublishMode = "api" | "assisted";
export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export type User = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string;
  locale: string;
  role: UserRole;
  account_status: AccountStatus;
  onboarding_completed: boolean;
  consent_marketing: boolean;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatorProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  niche: string | null;
  city: string | null;
  languages: string[];
  platform_links: Record<string, string>;
  collaboration_intent: boolean;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformConnection = {
  id: string;
  user_id: string;
  platform: Platform;
  publish_mode: PublishMode;
  platform_user_id: string | null;
  connected_at: string;
  disconnected_at: string | null;
  created_at: string;
};

export type ScheduledPost = {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  target_platforms: Platform[];
  scheduled_at: string;
  status: PostStatus;
  published_at: string | null;
  platform_post_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type JarvisEmotion =
  | "thriving"
  | "happy"
  | "content"
  | "neutral"
  | "concerned"
  | "worried"
  | "at_risk"
  | "devastated"
  | "heartbroken";

export type StreakState = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_qualifying_day: string | null;
  weekly_target: number | null;
  jarvis_emotion: JarvisEmotion;
  created_at: string;
  updated_at: string;
};

export type StreakEventType = "publish" | "mission_completion" | "collaboration_completion";

export type StreakEvent = {
  id: string;
  user_id: string;
  event_type: StreakEventType;
  event_date: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  price_ngn: number | null;
  price_usd: number | null;
  features: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

export type Processor = "paystack" | "stripe";
export type Currency = "NGN" | "USD";
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  processor: Processor;
  processor_subscription_id: string | null;
  currency: Currency;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type DuelStatus = "active" | "completed" | "cancelled";

export type Duel = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  start_date: string;
  end_date: string;
  status: DuelStatus;
  reward_type: string | null;
  reward_amount: number | null;
  created_at: string;
};

export type MissionStatusType = "pending" | "started" | "completed" | "replaced" | "rescheduled" | "simplified";
export type MissionDifficulty = "easy" | "medium" | "hard";

export type Mission = {
  id: string;
  user_id: string;
  type: string;
  instructions: string;
  difficulty: MissionDifficulty;
  status: MissionStatusType;
  source: string;
  target_date: string;
  linked_post_id: string | null;
  linked_brief_id: string | null;
  created_at: string;
  completed_at: string | null;
};
