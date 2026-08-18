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
