import { z } from "zod";

// ============================================================================
// Accounts & Identity
// ============================================================================
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  languages: z.array(z.string()).optional(),
  platformLinks: z.record(z.string()).optional(),
  collaborationIntent: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ============================================================================
// Social Scheduling
// ============================================================================
export const connectPlatformSchema = z.object({
  platform: z.enum(["linkedin", "twitter", "meta", "tiktok"]),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  platformUserId: z.string().min(1),
});
export type ConnectPlatformInput = z.infer<typeof connectPlatformSchema>;

export const schedulePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  targetPlatforms: z.array(z.enum(["linkedin", "twitter", "meta", "tiktok"])).min(1).max(4),
  scheduledAt: z.string().datetime(),
});
export type SchedulePostInput = z.infer<typeof schedulePostSchema>;

// ============================================================================
// Streak & Gamification
// ============================================================================
export const streakEventQuerySchema = z.object({
  since: z.string().date().optional(),
  limit: z.number().min(1).max(100).default(30),
});
export type StreakEventQuery = z.infer<typeof streakEventQuerySchema>;

// ============================================================================
// Creator Network
// ============================================================================
export const discoveryActionSchema = z.object({
  targetId: z.string().uuid(),
  action: z.enum(["viewed", "passed", "saved", "interested", "priority_requested"]),
});
export type DiscoveryActionInput = z.infer<typeof discoveryActionSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const createBriefSchema = z.object({
  matchId: z.string().uuid().optional(),
  concept: z.string().min(1).max(2000),
  roles: z.array(z.record(z.any())).optional(),
  deliverables: z.array(z.record(z.any())).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});
export type CreateBriefInput = z.infer<typeof createBriefSchema>;

// ============================================================================
// Voice Studio
// ============================================================================
export const createVoiceProjectSchema = z.object({
  script: z.string().min(1).max(10000),
  voiceId: z.string().uuid().optional(),
});
export type CreateVoiceProjectInput = z.infer<typeof createVoiceProjectSchema>;

export const createSeriesVoiceSchema = z.object({
  name: z.string().min(1).max(100),
  fishAudioVoiceId: z.string().min(1),
  pronunciationNotes: z.string().max(1000).optional(),
});
export type CreateSeriesVoiceInput = z.infer<typeof createSeriesVoiceSchema>;

// ============================================================================
// Billing
// ============================================================================
export const createCheckoutSchema = z.object({
  planId: z.string().uuid(),
  processor: z.enum(["paystack", "stripe"]),
});
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

// ============================================================================
// Safety & Moderation
// ============================================================================
export const reportSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  targetMessageId: z.string().uuid().optional(),
  targetType: z.enum(["user", "message", "collaboration"]),
  category: z.enum(["spam", "harassment", "inappropriate", "other"]),
  evidence: z.string().max(5000).optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const resolveReportSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["warn", "restrict", "suspend", "dismiss", "resolve"]),
  reason: z.string().min(1).max(2000),
  targetUserId: z.string().uuid(),
});
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

// ============================================================================
// Analytics
// ============================================================================
export const trackEventSchema = z.object({
  eventName: z.string().min(1).max(100),
  properties: z.record(z.any()).optional(),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;

// ============================================================================
// Missions
// ============================================================================
export const missionTypeEnum = z.enum([
  "ideation",
  "production",
  "publishing",
  "engagement",
  "collaboration",
  "growth_experiment",
  "business",
  "recovery",
]);
export type MissionType = z.infer<typeof missionTypeEnum>;

export const missionStatusEnum = z.enum([
  "pending",
  "started",
  "completed",
  "replaced",
  "rescheduled",
  "simplified",
]);
export type MissionStatus = z.infer<typeof missionStatusEnum>;

// ============================================================================
// Duels
// ============================================================================
export const proposeDuelSchema = z.object({
  partnerId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
});
export type ProposeDuelInput = z.infer<typeof proposeDuelSchema>;

// ============================================================================
// Admin
// ============================================================================
export const setFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
});
export type SetFeatureFlagInput = z.infer<typeof setFeatureFlagSchema>;
