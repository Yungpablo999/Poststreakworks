import { apiClient } from './apiClient';
import { API_ROUTES } from '../../../frontend/shared/constants/apiRoutes';
import {
  UserProfile,
  GrowthMetrics,
  PostPerformanceMetrics,
  CreatorPassportData,
  CreatorEarningsData,
  Quest,
} from '../../../src/types/models';

export const AuthService = {
  signIn: (email: string, passwordHash: string) =>
    apiClient.post<{ token: string; user: UserProfile }>(API_ROUTES.AUTH.SIGN_IN, { email, passwordHash }),
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
  completeQuest: (questId: string) => apiClient.post<{ xpGained: number; streakCount: number }>(API_ROUTES.QUESTS.COMPLETE(questId)),
  joinChallenge: (challengeId: string) => apiClient.post(API_ROUTES.QUESTS.JOIN_CHALLENGE(challengeId)),
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
