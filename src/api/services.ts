import { apiClient } from './apiClient';
import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import {
  UserProfile,
  GrowthMetrics,
  PostPerformanceMetrics,
  CreatorPassportData,
  CreatorEarningsData,
  Quest,
} from '../types/models';

export const AuthService = {
  // Was `passwordHash` — misleading, since the backend expects the real
  // password over HTTPS (Supabase Auth hashes it server-side). A
  // client-computed hash would just become the effective password, which
  // looks safer than it is. Renamed, not re-architected — this is still a
  // plain string sent as JSON like everything else here.
  signIn: (email: string, password: string) =>
    apiClient.post<{ token: string; user: UserProfile }>(API_ROUTES.AUTH.SIGN_IN, { email, password }),
  signUp: (data: { name: string; email: string; niche: string }) =>
    apiClient.post<{ token: string; user: UserProfile }>(API_ROUTES.AUTH.SIGN_UP, data),
  getMe: () => apiClient.get<UserProfile>(API_ROUTES.AUTH.ME),
};

export const GrowthAnalyticsService = {
  getAggregateGrowth: () => apiClient.get<GrowthMetrics>(API_ROUTES.GROWTH.AGGREGATE),
  getPostPerformance: (postId: string) => apiClient.get<PostPerformanceMetrics>(API_ROUTES.GROWTH.POST_PERFORMANCE(postId)),
  getAudienceBreakdown: () => apiClient.get<any>(API_ROUTES.GROWTH.AUDIENCE_BREAKDOWN),
};

export const QuestsService = {
  getDailyMissions: () => apiClient.get<Quest[]>(API_ROUTES.QUESTS.DAILY_MISSIONS),
  completeQuest: (questId: string) =>
    apiClient.post<{ xpGained: number; totalXp: number; streakCount: number; level: number; levelUp: boolean }>(
      API_ROUTES.QUESTS.COMPLETE(questId),
    ),
  joinChallenge: (challengeId: string) => apiClient.post(API_ROUTES.QUESTS.JOIN_CHALLENGE(challengeId)),
  getStreakStatus: () =>
    apiClient.get<{
      current_streak: number;
      longest_streak: number;
      jarvis_emotion: string;
      streakStatus: 'active' | 'at_risk' | 'frozen';
      xp: number;
      level: number;
      nextLevelXp: number;
    }>(API_ROUTES.QUESTS.STREAK_STATUS),
};

export const EarningsService = {
  getEarningsSummary: () => apiClient.get<CreatorEarningsData>(API_ROUTES.EARNINGS.SUMMARY),
  getPassportData: () => apiClient.get<CreatorPassportData>(API_ROUTES.USER.PASSPORT),
  setIncomeGoal: (targetAmount: number, label: string) => apiClient.post(API_ROUTES.EARNINGS.SET_GOAL, { targetAmount, label }),
};

export const SocialPlatformsService = {
  listPlatforms: () => apiClient.get<any>(API_ROUTES.PLATFORMS.LIST),
  connectPlatform: (platformId: string, authCodeOrHandle: string) =>
    apiClient.post(API_ROUTES.PLATFORMS.CONNECT(platformId), { authCodeOrHandle }),
  disconnectPlatform: (platformId: string) => apiClient.post(API_ROUTES.PLATFORMS.DISCONNECT(platformId)),
};

export const JarvisEngineService = {
  generateIdeas: (niche: string, goal: string) =>
    apiClient.post<{ ideas: string[] }>(API_ROUTES.JARVIS.GENERATE_IDEAS, { niche, goal }),
  generateScript: (topic: string, angle: string) =>
    apiClient.post<{ hook: string; body: string; takeaway: string; cta: string }>(API_ROUTES.JARVIS.GENERATE_SCRIPT, { topic, angle }),
  generateCaption: (scriptSummary: string, platform: string) =>
    apiClient.post<{ caption: string; hashtags: string[] }>(API_ROUTES.JARVIS.GENERATE_CAPTION, { scriptSummary, platform }),
};
