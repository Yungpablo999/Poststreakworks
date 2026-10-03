import { createTRPCRouter } from "./context";
import { accountsRouter } from "./routers/accounts";
import { socialSchedulingRouter } from "./routers/social-scheduling";
import { streakGamificationRouter } from "./routers/streak-gamification";
import { creatorNetworkRouter } from "./routers/creator-network";
import { voiceStudioRouter } from "./routers/voice-studio";
import { billingRouter } from "./routers/billing";
import { safetyModerationRouter } from "./routers/safety-moderation";
import { analyticsRouter } from "./routers/analytics";
import { missionsRouter } from "./routers/missions";
import { duelsRouter } from "./routers/duels";
import { adminRouter } from "./routers/admin";
import { contentStudioRouter } from "./routers/content-studio";
import { referralsRouter } from "./routers/referrals";
import { autopilotRouter } from "./routers/autopilot";
import { agentRouter } from "./routers/agent";
import { notificationsRouter } from "./routers/notifications";
import { passportRouter } from "./routers/passport";
import { earningsRouter } from "./routers/earnings";
import { questsRouter } from "./routers/quests";
import { draftsRouter } from "./routers/drafts";
import { savedHooksRouter } from "./routers/saved-hooks";
import { repurposeRouter } from "./routers/repurpose";
import { jarvisRouter } from "./routers/jarvis";
import { platformConnectRouter } from "./routers/platform-connect";
import { homeRouter } from "./routers/home";
import { ideasRouter } from "./routers/ideas";
import { calendarRouter } from "./routers/calendar";
import { growthRouter } from "./routers/growth";

export const appRouter = createTRPCRouter({
  accounts: accountsRouter,
  socialScheduling: socialSchedulingRouter,
  streakGamification: streakGamificationRouter,
  creatorNetwork: creatorNetworkRouter,
  voiceStudio: voiceStudioRouter,
  billing: billingRouter,
  safetyModeration: safetyModerationRouter,
  analytics: analyticsRouter,
  missions: missionsRouter,
  duels: duelsRouter,
  admin: adminRouter,
  contentStudio: contentStudioRouter,
  // Carried-over v1 domains — see supabase/migrations/20260814000013
  referrals: referralsRouter,
  autopilot: autopilotRouter,
  agent: agentRouter,
  // Reverse-engineered from the built frontend — see supabase/migrations/
  // 20260814000014_notifications_quests_creator_economy.sql
  notifications: notificationsRouter,
  passport: passportRouter,
  earnings: earningsRouter,
  quests: questsRouter,
  // Phase 1 (October 2026): what the finished app kept in memory — see
  // backend/PHASE1_CONTRACT.md and supabase/migrations/20260814000020
  drafts: draftsRouter,
  savedHooks: savedHooksRouter,
  repurpose: repurposeRouter,
  jarvis: jarvisRouter,
  // Real social-account connections (TikTok first) — see routers/platform-connect.ts
  platformConnect: platformConnectRouter,
  // Home for creators who post — see routers/home.ts
  home: homeRouter,
  // Post ideas — see routers/ideas.ts
  ideas: ideasRouter,
  // What is planned and what was posted, in one list — see routers/calendar.ts
  calendar: calendarRouter,
  // Growth from the numbers the connected accounts report — see routers/growth.ts
  growth: growthRouter,
});

export type AppRouter = typeof appRouter;
