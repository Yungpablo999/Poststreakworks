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
});

export type AppRouter = typeof appRouter;
