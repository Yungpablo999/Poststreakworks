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
