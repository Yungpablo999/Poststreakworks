export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  niche: string;
  tier: 'free' | 'pro' | 'founding';
  streakCount: number;
  streakStatus: 'active' | 'at_risk' | 'frozen';
  level: number;
  xp: number;
  nextLevelXp: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorPassportData {
  userId: string;
  passportScore: number;
  profileStrength: number;
  streakScoreDays: number;
  consistencyRating: 'Strong' | 'Moderate' | 'Growing';
  collaborationLevel: 'Beginner' | 'Intermediate' | 'Pro';
  questsCompleted: number;
  totalQuests: number;
  marketplaceReady: boolean;
  identityVerified: boolean;
  activityHistoryValid: boolean;
}

export interface GrowthMetrics {
  totalFollowers: number;
  newFollowersWeek: number;
  growthRate: number; // e.g. 12.4%
  retentionRate: number; // e.g. 84.6%
  totalViews: number;
  totalLikes: number;
  totalSaves: number;
  totalShares: number;
  channelBreakdown: {
    platformId: string;
    platformName: string;
    followers: number;
    growthPercent: number;
    color: string;
  }[];
  weeklyVelocity: {
    day: string;
    tiktok: number;
    instagram: number;
    youtube: number;
    x: number;
  }[];
}

export interface PostPerformanceMetrics {
  postId: string;
  title: string;
  platform: string;
  views: number;
  likes: number;
  saves: number;
  shares: number;
  estimatedRevenue: number;
  velocityScore: number;
  topRetentionSeconds: number;
  publishedAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'starter' | 'community' | 'brand';
  xpReward: number;
  streakProtected: boolean;
  completed: boolean;
  progress: number;
  maxProgress: number;
  expiresAt?: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  targetPosts: number;
  currentPosts: number;
  participantsCount: number;
  rewardBadge: string;
  active: boolean;
}

export interface CreatorEarningsData {
  currentBalance: number;
  pendingPayouts: number;
  lifetimeEarnings: number;
  trackedExternalEarnings: number;
  opportunityReadinessScore: number;
  activeMilestoneGoal: string;
  targetMilestoneAmount: number;
  campaignReadinessChecklist: {
    id: string;
    label: string;
    completed: boolean;
    required: boolean;
  }[];
  campaigns: {
    id: string;
    brandName: string;
    title: string;
    payout: number;
    locked: boolean;
    requirementsSummary: string;
  }[];
}

export interface PlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  connected: boolean;
  color: string;
  bgTint: string;
  lastSyncedAt?: string;
  autoSyncEnabled: boolean;
}
