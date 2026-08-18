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
