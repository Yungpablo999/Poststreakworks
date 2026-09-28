import { SocialBrandIcon } from '../components/SocialBrandIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Text, TextInput } from '../components/ui/AppText';
import { BrandLogo } from '../components/BrandLogo';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { HeaderDualModePills, UserPersona } from '../components/HeaderDualModePills';
import { sFont, isNarrowScreen } from '../utils/responsive';

interface GrowthPlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  growthPct: string;
  barWidth: string;
  connected: boolean;
  color: string;
  bgTint: string;
}

const INITIAL_GROWTH_PLATFORMS: GrowthPlatformAccount[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@pablo.creates',
    followers: '14.2K',
    growthPct: '+12.4%',
    barWidth: '74%',
    connected: true,
    color: '#000000',
    bgTint: '#F1F5F9',
  },
  {
    id: 'instagram',
    name: 'Instagram · Reel',
    handle: '@pablocreates',
    followers: '25.6K',
    growthPct: '+8.1%',
    barWidth: '58%',
    connected: true,
    color: '#E1306C',
    bgTint: '#FDF2F8',
  },
  {
    id: 'youtube',
    name: 'YouTube · Short',
    handle: '@pablofilms',
    followers: '22.4K',
    growthPct: '+4.2%',
    barWidth: '42%',
    connected: true,
    color: '#FF0000',
    bgTint: '#FEF2F2',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: '@pablocreator',
    followers: '5.2K',
    growthPct: '+3.8%',
    barWidth: '32%',
    connected: false,
    color: '#1877F2',
    bgTint: '#EFF6FF',
  },
  {
    id: 'threads',
    name: 'Threads',
    handle: '@pablocreates',
    followers: '3.6K',
    growthPct: '+5.1%',
    barWidth: '28%',
    connected: false,
    color: '#000000',
    bgTint: '#F8FAFC',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    handle: '@pablopins',
    followers: '8.9K',
    growthPct: '+6.4%',
    barWidth: '36%',
    connected: false,
    color: '#E60023',
    bgTint: '#FFF1F2',
  },
];

const parseFollowerCount = (str: string): number => {
  const clean = str.replace(/[^0-9.]/g, '');
  const val = parseFloat(clean);
  if (isNaN(val)) return 0;
  if (str.toUpperCase().includes('K')) return Math.round(val * 1000);
  if (str.toUpperCase().includes('M')) return Math.round(val * 1000000);
  return Math.round(val);
};

const getPlatformApiWindow = (id: string): string => {
  switch (id) {
    case 'instagram':
      return 'Instagram (7D API)';
    case 'threads':
      return 'Threads (7D API)';
    case 'tiktok':
      return 'TikTok (28D API)';
    case 'facebook':
      return 'Facebook (28D API)';
    case 'youtube':
      return 'YouTube (30D API)';
    case 'pinterest':
      return 'Pinterest (30D API)';
    default:
      return 'Recent API';
  }
};

interface TopPostData {
  id: string;
  title: string;
  thumbnail: any;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'x';
  format: 'REEL' | 'CAROUSEL' | 'SHORTS' | 'THREAD';
  date: string;
  views: string;
  viewsNumeric: number;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  reach: string;
  newFollowers: string;
  hookRetention: string;
  completionRate: string;
  avgWatchTime: string;
  trafficExplore: string;
  trafficFeed: string;
  trafficDirect: string;
  jarvisAudit: string;
  repurposeIdea: string;
}

const TOP_POSTS_DATA: TopPostData[] = [
  {
    id: 'tp1',
    title: '3 creator mistakes to avoid when scaling from 10k to 50k',
    thumbnail: require('../../assets/images/elena-avatar.jpg'),
    platform: 'tiktok',
    format: 'REEL',
    date: 'May 18 • 7:30 PM',
    views: '45.2K',
    viewsNumeric: 45200,
    likes: '3,840',
    comments: '318',
    shares: '642',
    saves: '924',
    reach: '58.4K',
    newFollowers: '+340',
    hookRetention: '91% (Top 1% of your posts)',
    completionRate: '68% completed',
    avgWatchTime: '38s / 45s (84% viewed)',
    trafficExplore: '82%',
    trafficFeed: '12%',
    trafficDirect: '6%',
    jarvisAudit: 'Your 3-second pattern interrupt hook retained 91% of viewers, generating 3.8× more algorithmic recommendations than your average Reel.',
    repurposeIdea: 'Convert this 3-mistakes script into a 7-slide Instagram Carousel & X Thread.',
  },
  {
    id: 'tp2',
    title: 'Daily planning workflow that saved me 15 hours every week',
    thumbnail: require('../../assets/images/david-avatar.jpg'),
    platform: 'instagram',
    format: 'CAROUSEL',
    date: 'May 22 • 8:15 PM',
    views: '18.4K',
    viewsNumeric: 18400,
    likes: '1,920',
    comments: '142',
    shares: '380',
    saves: '1,420',
    reach: '29.2K',
    newFollowers: '+185',
    hookRetention: '88% Slide 1-3 (Top 3% of your posts)',
    completionRate: '74% completed',
    avgWatchTime: '1m 12s / 1m 30s (80% read)',
    trafficExplore: '68%',
    trafficFeed: '24%',
    trafficDirect: '8%',
    jarvisAudit: 'Highest save-to-reach ratio of the month (4.8%). Viewers bookmarked slide 4 & 5 templates for repeat reference, driving 4.2× higher saves than your average Carousel.',
    repurposeIdea: 'Record a 45s talking demo video explaining slide 4 step-by-step.',
  },
  {
    id: 'tp3',
    title: 'The exact camera setup I used to hit 100k views in 30 days',
    thumbnail: require('../../assets/images/marcus-avatar.jpg'),
    platform: 'youtube',
    format: 'SHORTS',
    date: 'May 26 • 6:45 PM',
    views: '28.6K',
    viewsNumeric: 28600,
    likes: '2,410',
    comments: '196',
    shares: '290',
    saves: '760',
    reach: '34.8K',
    newFollowers: '+220',
    hookRetention: '89% (Top 2% of your posts)',
    completionRate: '71% completed',
    avgWatchTime: '42s / 50s (84% viewed)',
    trafficExplore: '76%',
    trafficFeed: '16%',
    trafficDirect: '8%',
    jarvisAudit: 'Equipment breakdowns with on-screen price callouts generated 2.8× more comments and questions than your average Short.',
    repurposeIdea: 'Create a downloadable kit checklist PDF to offer as a lead magnet.',
  },
];

export const TinyGoldCheck = ({ size = 13 }: { size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#F59E0B',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6.2L4.8 8.5L9.5 3.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);


interface ProGrowthScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenAudienceBreakdown?: () => void;
  onOpenPostPerformance?: () => void;
  onOpenPlatformGrowth?: () => void;
  onOpenSchedule?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onOpenScript?: () => void;
  onSwitchToFree?: () => void;
  userPersona?: UserPersona;
  onTogglePersona?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface NotificationItem {
  id: string;
  type: 'streak' | 'collab' | 'quest' | 'level' | 'growth';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'growth',
    title: 'Retention Peak Achieved',
    body: 'Your latest Reel achieved 94% retention in first 5 seconds!',
    time: '20m ago',
    unread: true,
    iconEmoji: '📈',
  },
  {
    id: 'n2',
    type: 'streak',
    title: 'Monthly Report Ready',
    body: 'May 2024 Pro Analytics Summary compiled (+28.4% growth).',
    time: '1h ago',
    unread: true,
    iconEmoji: '📊',
  },
];

// DYNAMIC GRAPH CONFIGURATIONS ACROSS TIMEFRAMES (7D, 14D, 30D, 90D)
// Fully reactive with complete reachSummary and audienceSummary for bottom breakdown
const TIMEFRAME_CONFIGS = {
  '7D': {
    daysCount: 7,
    viewportWidth: 460,
    labels: [
      { text: 'Mon (May 24)', x: 10 },
      { text: 'Wed (May 26)', x: 140 },
      { text: 'Fri (May 28)', x: 270 },
      { text: 'Sun (May 30)', x: 380 },
    ],
    stepSpacing: 65,
    formatSummary: {
      topFormat: 'Talking Reels (35% of reach)',
      topConversion: 'Carousels (8.4% saves)',
      avgEngagement: '8.6%',
      insight: 'This week, 7-slide Carousels outperformed static posts by 3.8x in bookmarks.',
      formats: [
        { name: 'Talking Reels', icon: '🎥', reach: '18.4K', barHeight: 85, color: '#582CDB', retention: '74%', saveRate: '4.8%', delta: '+280 followers gained' },
        { name: 'Carousels', icon: '📑', reach: '14.2K', barHeight: 70, color: '#7C3AED', retention: '82%', saveRate: '8.4% (Top Saves 🔥)', delta: '+210 followers gained' },
        { name: 'Shorts', icon: '▶️', reach: '11.8K', barHeight: 55, color: '#F59E0B', retention: '70%', saveRate: '3.6%', delta: '+120 followers gained' },
        { name: 'Posts / X', icon: '💬', reach: '8.5K', barHeight: 40, color: '#64748B', retention: '65%', saveRate: '4.2%', delta: '+70 followers gained' },
      ],
    },
    reachSummary: {
      total: '34.8K',
      delta: '+12.4% vs last week',
      engagement: '4.9K',
      retention: '45s avg retention',
      igReach: '13.9K',
      igPct: '40%',
      ttReach: '12.5K',
      ttPct: '36%',
      ytReach: '8.4K',
      ytPct: '24%',
      insight: 'Weekend short-form posting drove 42% of your 7-day total reach.',
    },
    audienceSummary: {
      total: '144,320',
      delta: '+680 net this week',
      quality: '97.4%',
      qualityLabel: 'Tier-1 authentic followers',
      igGain: '+252',
      igPct: '37%',
      ttGain: '+231',
      ttPct: '34%',
      ytGain: '+197',
      ytPct: '29%',
      insight: "Friday & Saturday Reels generated 48% of this week's new followers.",
    },
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      const days = ['Mon, May 24', 'Tue, May 25', 'Wed, May 26', 'Thu, May 27', 'Fri, May 28', 'Sat, May 29', 'Sun, May 30'];
      if (type === 'growth30d') {
        const dailyReaches = ['4.2K', '4.6K', '4.9K', '5.1K', '5.8K', '6.4K', '3.8K'];
        const dailyFollowers = [78, 84, 92, 98, 114, 128, 86];
        const yCoords = [135, 125, 110, 95, 65, 40, 30];
        return {
          date: days[i] || `Day ${i + 1}`,
          reach: `${dailyReaches[i]} Daily Reach`,
          metricLabel: 'Daily Reach',
          metricValue: dailyReaches[i],
          deltaFollowers: `+${dailyFollowers[i]} Followers`,
          periodContext: '34.8K / 7D Total',
          yPos: yCoords[i],
        };
      } else {
        const audiences = [143640, 143724, 143816, 143914, 144028, 144156, 144320];
        const dailyGains = [78, 84, 92, 98, 114, 128, 86];
        const yCoords = [140, 125, 110, 90, 65, 45, 25];
        return {
          date: days[i] || `Day ${i + 1}`,
          reach: `${audiences[i].toLocaleString()} Total Audience`,
          metricLabel: 'Total Audience',
          metricValue: `${(audiences[i] / 1000).toFixed(1)}K`,
          deltaFollowers: `+${dailyGains[i]} Today`,
          periodContext: '+680 / 7D Net',
          yPos: yCoords[i],
        };
      }
    },
    svgPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,135 C80,125 160,110 240,85 C320,55 390,38 460,30'
        : 'M0,140 C80,125 160,110 240,80 C320,55 390,35 460,25',
    areaPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,135 C80,125 160,110 240,85 C320,55 390,38 460,30 L460,170 L0,170 Z'
        : 'M0,140 C80,125 160,110 240,80 C320,55 390,35 460,25 L460,170 L0,170 Z',
    weeklyMetrics: [
      { title: 'MON-TUE', val: '+162 👤', sub: '8.8k reach' },
      { title: 'WED-THU', val: '+190 👤', sub: '10.0k reach' },
      { title: 'FRI-SAT (🔥)', val: '+242 👤', sub: '12.2k peak', isPeak: true },
      { title: 'SUN', val: '+86 👤', sub: '3.8k reach' },
    ],
  },
  '14D': {
    daysCount: 14,
    viewportWidth: 640,
    labels: [
      { text: 'May 17', x: 10 },
      { text: 'May 20', x: 140 },
      { text: 'May 24', x: 300 },
      { text: 'May 27', x: 450 },
      { text: 'May 30', x: 570 },
    ],
    stepSpacing: 44,
    formatSummary: {
      topFormat: 'Talking Reels (36% of reach)',
      topConversion: 'Carousels (8.6% saves)',
      avgEngagement: '9.1%',
      insight: 'Two-week sprint shows talking storytelling clips have 91% 3-second hook retention.',
      formats: [
        { name: 'Talking Reels', icon: '🎥', reach: '22.6K', barHeight: 90, color: '#582CDB', retention: '76%', saveRate: '5.1%', delta: '+560 followers gained' },
        { name: 'Carousels', icon: '📑', reach: '16.8K', barHeight: 75, color: '#7C3AED', retention: '85%', saveRate: '8.6% (Top Saves 🔥)', delta: '+430 followers gained' },
        { name: 'Shorts', icon: '▶️', reach: '13.4K', barHeight: 58, color: '#F59E0B', retention: '72%', saveRate: '3.8%', delta: '+240 followers gained' },
        { name: 'Posts / X', icon: '💬', reach: '9.8K', barHeight: 42, color: '#64748B', retention: '68%', saveRate: '4.5%', delta: '+120 followers gained' },
      ],
    },
    reachSummary: {
      total: '68.4K',
      delta: '+18.6% vs last 14d',
      engagement: '9.4K',
      retention: '44s avg retention',
      igReach: '27.4K',
      igPct: '40%',
      ttReach: '24.6K',
      ttPct: '36%',
      ytReach: '16.4K',
      ytPct: '24%',
      insight: 'Talking hook videos maintained an 84% completion rate over the 2-week sprint.',
    },
    audienceSummary: {
      total: '144,320',
      delta: '+1,350 net in 14 days',
      quality: '97.1%',
      qualityLabel: 'Tier-1 authentic followers',
      igGain: '+500',
      igPct: '37%',
      ttGain: '+459',
      ttPct: '34%',
      ytGain: '+391',
      ytPct: '29%',
      insight: 'Storytelling breakdown formats generated 2.4x higher subscriber conversions.',
    },
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      if (type === 'growth30d') {
        const dailyReaches = [3.8, 3.9, 4.1, 4.4, 4.3, 4.6, 4.8, 5.0, 5.2, 5.4, 5.8, 6.2, 6.4, 4.5];
        const dailyFollowers = [68, 72, 75, 82, 80, 86, 92, 96, 102, 108, 116, 124, 132, 97];
        const yPos = 140 - (i / 13) * 105 + Math.sin(i * 0.8) * 6;
        return {
          date: `May ${i + 17}`,
          reach: `${dailyReaches[i] || 4.5}K Daily Reach`,
          metricLabel: 'Daily Reach',
          metricValue: `${dailyReaches[i] || 4.5}K`,
          deltaFollowers: `+${dailyFollowers[i] || 85} Followers`,
          periodContext: '68.4K / 14D Total',
          yPos,
        };
      } else {
        const audienceVal = 142970 + i * 104;
        const dailyGain = 68 + Math.floor(i * 4.8);
        const yPos = 145 - (i / 13) * 115 + Math.sin(i * 0.5) * 5;
        return {
          date: `May ${i + 17}`,
          reach: `${audienceVal.toLocaleString()} Total Audience`,
          metricLabel: 'Total Audience',
          metricValue: `${(audienceVal / 1000).toFixed(1)}K`,
          deltaFollowers: `+${dailyGain} Today`,
          periodContext: '+1,350 / 14D Net',
          yPos,
        };
      }
    },
    svgPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,140 C110,130 220,110 330,85 C440,70 540,45 640,35'
        : 'M0,145 C110,132 220,112 330,80 C440,60 540,40 640,25',
    areaPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,140 C110,130 220,110 330,85 C440,70 540,45 640,35 L640,170 L0,170 Z'
        : 'M0,145 C110,132 220,112 330,80 C440,60 540,40 640,25 L640,170 L0,170 Z',
    weeklyMetrics: [
      { title: 'DAYS 1-4', val: '+297 👤', sub: '16.2k reach' },
      { title: 'DAYS 5-8', val: '+354 👤', sub: '18.7k reach' },
      { title: 'DAYS 9-12 (🔥)', val: '+466 👤', sub: '23.6k peak', isPeak: true },
      { title: 'DAYS 13-14', val: '+229 👤', sub: '10.9k reach' },
    ],
  },
  '30D': {
    daysCount: 30,
    viewportWidth: 950,
    labels: [
      { text: 'May 1', x: 10 },
      { text: 'May 5', x: 130 },
      { text: 'May 10', x: 280 },
      { text: 'May 15', x: 440 },
      { text: 'May 20', x: 600 },
      { text: 'May 25', x: 750 },
      { text: 'May 30', x: 890 },
    ],
    stepSpacing: 31.5,
    formatSummary: {
      topFormat: 'Talking Reels (38% of reach)',
      topConversion: 'Carousels (9.2% saves)',
      avgEngagement: '9.8%',
      insight: 'Storytelling Reels + Carousel breakdowns produced 82% of all high-retention saves and new followers.',
      formats: [
        { name: 'Talking Reels', icon: '🎥', reach: '28.4K', barHeight: 95, color: '#582CDB', retention: '78%', saveRate: '5.4%', delta: '+1,120 followers gained' },
        { name: 'Carousels', icon: '📑', reach: '19.2K', barHeight: 80, color: '#7C3AED', retention: '88%', saveRate: '9.2% (Top Saves 🔥)', delta: '+840 followers gained' },
        { name: 'Shorts', icon: '▶️', reach: '15.8K', barHeight: 62, color: '#F59E0B', retention: '75%', saveRate: '4.1%', delta: '+360 followers gained' },
        { name: 'Posts / X', icon: '💬', reach: '11.2K', barHeight: 45, color: '#64748B', retention: '72%', saveRate: '4.9%', delta: '+160 followers gained' },
      ],
    },
    reachSummary: {
      total: '131.0K',
      delta: '+28.4% vs last month',
      engagement: '18.0K',
      retention: '42s avg retention',
      igReach: '52.4K',
      igPct: '40%',
      ttReach: '47.2K',
      ttPct: '36%',
      ytReach: '31.4K',
      ytPct: '24%',
      insight: 'Consistent daily posting generated a 3.4x spike in Explore page recommendations.',
    },
    audienceSummary: {
      total: '144,320',
      delta: '+2,480 net this month',
      quality: '96.8%',
      qualityLabel: 'Tier-1 authentic followers',
      igGain: '+920',
      igPct: '37%',
      ttGain: '+840',
      ttPct: '34%',
      ytGain: '+720',
      ytPct: '29%',
      insight: 'Short-form video posted between 7:00 PM – 9:00 PM drove 68% of your new followers.',
    },
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      if (type === 'growth30d') {
        const reachVal = (3.4 + Math.sin(i * 0.7) * 1.6 + (i / 29) * 1.8).toFixed(1);
        const followers = 55 + Math.floor(Math.sin(i * 0.7) * 18 + (i / 29) * 35);
        const yPos = 135 - (i / 29) * 80 + Math.sin(i * 0.7) * 16;
        return {
          date: `May ${i + 1}`,
          reach: `${reachVal}K Daily Reach`,
          metricLabel: 'Daily Reach',
          metricValue: `${reachVal}K`,
          deltaFollowers: `+${followers} Followers`,
          periodContext: '131.0K / 30D Total',
          yPos,
        };
      } else {
        const audienceVal = 141840 + Math.floor(i * 85.5);
        const deltaVal = 55 + Math.floor(Math.sin(i * 0.7) * 18 + (i / 29) * 35);
        const yPos = 145 - (i / 29) * 115 + Math.sin(i * 0.5) * 5;
        return {
          date: `May ${i + 1}`,
          reach: `${audienceVal.toLocaleString()} Total Audience`,
          metricLabel: 'Total Audience',
          metricValue: `${(audienceVal / 1000).toFixed(1)}K`,
          deltaFollowers: `+${deltaVal} Today`,
          periodContext: '+2,480 / 30D Net',
          yPos,
        };
      }
    },
    svgPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,135 C120,150 220,95 320,110 C420,125 520,75 620,85 C720,95 820,45 950,55'
        : 'M0,145 C120,135 220,115 320,95 C420,85 520,70 620,55 C720,40 820,30 950,25',
    areaPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,135 C120,150 220,95 320,110 C420,125 520,75 620,85 C720,95 820,45 950,55 L950,170 L0,170 Z'
        : 'M0,145 C120,135 220,115 320,95 C420,85 520,70 620,55 C720,40 820,30 950,25 L950,170 L0,170 Z',
    weeklyMetrics: [
      { title: 'WEEK 1', val: '+520 👤', sub: '27.4k reach' },
      { title: 'WEEK 2', val: '+610 👤', sub: '31.8k reach' },
      { title: 'WEEK 3 (🔥)', val: '+780 👤', sub: '41.2k peak', isPeak: true },
      { title: 'WEEK 4', val: '+570 👤', sub: '30.6k reach' },
    ],
  },
  '90D': {
    daysCount: 12,
    viewportWidth: 820,
    labels: [
      { text: 'Mar W1', x: 10 },
      { text: 'Mar W3', x: 140 },
      { text: 'Apr W1', x: 280 },
      { text: 'Apr W3', x: 420 },
      { text: 'May W1', x: 560 },
      { text: 'May W4', x: 740 },
    ],
    stepSpacing: 65,
    formatSummary: {
      topFormat: 'Talking Reels (37% of reach)',
      topConversion: 'Carousels (9.6% saves)',
      avgEngagement: '10.4%',
      insight: 'Quarterly macro review shows video-first portfolio generates 4.2x higher algorithm momentum.',
      formats: [
        { name: 'Talking Reels', icon: '🎥', reach: '34.8K', barHeight: 100, color: '#582CDB', retention: '82%', saveRate: '5.8%', delta: '+3,240 followers gained' },
        { name: 'Carousels', icon: '📑', reach: '24.6K', barHeight: 85, color: '#7C3AED', retention: '92%', saveRate: '9.6% (Top Saves 🔥)', delta: '+2,380 followers gained' },
        { name: 'Shorts', icon: '▶️', reach: '19.4K', barHeight: 68, color: '#F59E0B', retention: '78%', saveRate: '4.4%', delta: '+820 followers gained' },
        { name: 'Posts / X', icon: '💬', reach: '14.8K', barHeight: 48, color: '#64748B', retention: '76%', saveRate: '5.2%', delta: '+400 followers gained' },
      ],
    },
    reachSummary: {
      total: '368.0K',
      delta: '+42.1% quarterly growth',
      engagement: '52.6K',
      retention: '41s avg retention',
      igReach: '147.2K',
      igPct: '40%',
      ttReach: '132.5K',
      ttPct: '36%',
      ytReach: '88.3K',
      ytPct: '24%',
      insight: 'Quarterly momentum compound rate achieved top 1% velocity across your niche.',
    },
    audienceSummary: {
      total: '144,320',
      delta: '+6,840 net this quarter',
      quality: '96.2%',
      qualityLabel: 'Tier-1 authentic followers',
      igGain: '+2,530',
      igPct: '37%',
      ttGain: '+2,325',
      ttPct: '34%',
      ytGain: '+1,985',
      ytPct: '29%',
      insight: 'Multi-platform cross-pollination expanded your total creator audience by 6.8K followers.',
    },
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      const weeks = ['Mar W1', 'Mar W2', 'Mar W3', 'Mar W4', 'Apr W1', 'Apr W2', 'Apr W3', 'Apr W4', 'May W1', 'May W2', 'May W3', 'May W4'];
      if (type === 'growth30d') {
        const weeklyReaches = [22.4, 24.8, 25.1, 26.1, 31.4, 34.2, 35.8, 37.2, 31.2, 33.6, 36.8, 29.4];
        const weeklyFollowers = [410, 440, 470, 500, 590, 630, 650, 670, 580, 620, 680, 600];
        const yPos = 150 - (i / 11) * 115;
        return {
          date: weeks[i] || `Week ${i + 1}`,
          reach: `${weeklyReaches[i]}K Weekly Reach`,
          metricLabel: 'Weekly Reach',
          metricValue: `${weeklyReaches[i]}K`,
          deltaFollowers: `+${weeklyFollowers[i]} Followers`,
          periodContext: '368K / 90D Total',
          yPos,
        };
      } else {
        const audiences = [137480, 137920, 138390, 138890, 139480, 140110, 140760, 141430, 142010, 142630, 143310, 144320];
        const deltas = [410, 440, 470, 500, 590, 630, 650, 670, 580, 620, 680, 600];
        const yPos = 155 - (i / 11) * 125;
        return {
          date: weeks[i] || `Week ${i + 1}`,
          reach: `${audiences[i].toLocaleString()} Total Audience`,
          metricLabel: 'Total Audience',
          metricValue: `${(audiences[i] / 1000).toFixed(1)}K`,
          deltaFollowers: `+${deltas[i]} Followers`,
          periodContext: '+6,840 / 90D Net',
          yPos,
        };
      }
    },
    svgPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,150 C200,130 400,90 600,55 C700,40 760,32 820,28'
        : 'M0,155 C200,135 400,95 600,60 C700,42 760,32 820,25',
    areaPath: (type: 'growth30d' | 'audience') =>
      type === 'growth30d'
        ? 'M0,150 C200,130 400,90 600,55 C700,40 760,32 820,28 L820,170 L0,170 Z'
        : 'M0,155 C200,135 400,95 600,60 C700,42 760,32 820,25 L820,170 L0,170 Z',
    weeklyMetrics: [
      { title: 'MONTH 1 (MAR)', val: '+1,820 👤', sub: '98.4k reach' },
      { title: 'MONTH 2 (APR)', val: '+2,540 👤', sub: '138.6k reach' },
      { title: 'MONTH 3 (MAY 🔥)', val: '+2,480 👤', sub: '131.0k peak', isPeak: true },
      { title: '90D TOTAL', val: '+6,840 👤', sub: '368.0k reach' },
    ],
  },
};

export const ProGrowthScreen: React.FC<ProGrowthScreenProps> = ({
  onBackToDashboard,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenAudienceBreakdown,
  onOpenPostPerformance,
  onOpenPlatformGrowth,
  onOpenSchedule,
  onOpenPostComposer,
  onOpenScript,
  onSwitchToFree,
  userPersona,
  onTogglePersona,
  userProfile,
  onSaveProfile,
}) => {
  const isNewUser = (userPersona || userProfile?.userPersona) === 'new';
  const [newUserConnectedPlatforms, setNewUserConnectedPlatforms] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [platformsList, setPlatformsList] = useState<GrowthPlatformAccount[]>(() =>
    INITIAL_GROWTH_PLATFORMS.map((p) => ({
      ...p,
      connected: isNewUser ? false : p.connected,
    }))
  );
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState<string>('threads');
  const [customHandleInput, setCustomHandleInput] = useState<string>('');
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TopPostData>(TOP_POSTS_DATA[0]);
  const [selectedPostTitle, setSelectedPostTitle] = useState('3 creator mistakes to avoid...');
  const [showExpandedGraphModal, setShowExpandedGraphModal] = useState(false);
  const [expandedGraphType, setExpandedGraphType] = useState<'growth30d' | 'audience' | 'contentFormat'>('growth30d');
  const [selectedFormatIndex, setSelectedFormatIndex] = useState<number>(0);
  const [selectedGraphDayIndex, setSelectedGraphDayIndex] = useState(29);
  const [graphTimeframe, setGraphTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSlotSetModal, setShowSlotSetModal] = useState(false);
  const [showProtectMomentumModal, setShowProtectMomentumModal] = useState(false);
  const [streakShieldActive, setStreakShieldActive] = useState(true);
  const [bufferActive, setBufferActive] = useState(true);
  const [peakAlertsActive, setPeakAlertsActive] = useState(true);
  const [squadBoostActive, setSquadBoostActive] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Mascot floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ghostFloatY, {
          toValue: 2,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Synchronize platforms list with userProfile connectedPlatforms
  useEffect(() => {
    if (isNewUser) {
      const activeConnected = userProfile?.connectedPlatforms
        ? userProfile.connectedPlatforms
        : newUserConnectedPlatforms;
      setPlatformsList((prev) =>
        prev.map((p) => ({
          ...p,
          connected: activeConnected.includes(p.id),
          handle:
            p.id === 'tiktok' && userProfile?.tiktokHandle
              ? userProfile.tiktokHandle
              : p.id === 'instagram' && userProfile?.instagramHandle
              ? userProfile.instagramHandle
              : p.id === 'youtube' && userProfile?.youtubeHandle
              ? userProfile.youtubeHandle
              : p.id === 'facebook' && userProfile?.facebookHandle
              ? userProfile.facebookHandle
              : p.id === 'threads' && userProfile?.threadsHandle
              ? userProfile.threadsHandle
              : p.id === 'pinterest' && userProfile?.pinterestHandle
              ? userProfile.pinterestHandle
              : p.handle,
        }))
      );
    } else {
      setPlatformsList((prev) =>
        prev.map((p) => ({
          ...p,
          connected: userProfile?.connectedPlatforms
            ? userProfile.connectedPlatforms.includes(p.id)
            : (INITIAL_GROWTH_PLATFORMS.find((x) => x.id === p.id)?.connected ?? true),
          handle:
            p.id === 'tiktok' && userProfile?.tiktokHandle
              ? userProfile.tiktokHandle
              : p.id === 'instagram' && userProfile?.instagramHandle
              ? userProfile.instagramHandle
              : p.id === 'youtube' && userProfile?.youtubeHandle
              ? userProfile.youtubeHandle
              : p.id === 'facebook' && userProfile?.facebookHandle
              ? userProfile.facebookHandle
              : p.id === 'threads' && userProfile?.threadsHandle
              ? userProfile.threadsHandle
              : p.id === 'pinterest' && userProfile?.pinterestHandle
              ? userProfile.pinterestHandle
              : p.handle,
        }))
      );
    }
  }, [
    isNewUser,
    newUserConnectedPlatforms,
    userProfile?.connectedPlatforms,
    userProfile?.connectedPlatforms?.join(','),
    userProfile?.tiktokHandle,
    userProfile?.instagramHandle,
    userProfile?.youtubeHandle,
    userProfile?.facebookHandle,
    userProfile?.threadsHandle,
    userProfile?.pinterestHandle,
  ]);

  // Platform Connect/Disconnect Handlers
  const handleConnectSinglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (isNewUser) {
      setNewUserConnectedPlatforms((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: true } : p))
    );
    const target = platformsList.find((p) => p.id === id);
    showToast(`✓ ${target?.name || 'Platform'} connected & auto-synced!`);

    if (onSaveProfile && userProfile) {
      const current = userProfile.connectedPlatforms || (isNewUser ? [] : ['tiktok', 'instagram', 'youtube']);
      if (!current.includes(id)) {
        onSaveProfile({
          ...userProfile,
          connectedPlatforms: [...current, id],
        });
      }
    }
  };

  const handleRemoveSinglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isNewUser) {
      setNewUserConnectedPlatforms((prev) => prev.filter((p) => p !== id));
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false } : p))
    );
    const target = platformsList.find((p) => p.id === id);
    showToast(`Removed ${target?.name || 'Platform'}`);

    if (onSaveProfile && userProfile) {
      const current = userProfile.connectedPlatforms || (isNewUser ? [] : ['tiktok', 'instagram', 'youtube']);
      onSaveProfile({
        ...userProfile,
        connectedPlatforms: current.filter((p) => p !== id),
      });
    }
  };

  const handleAddCustomPlatform = () => {
    if (!customHandleInput.trim()) {
      showToast('Please enter a creator username');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const formatted = customHandleInput.startsWith('@') ? customHandleInput : `@${customHandleInput}`;
    setPlatformsList((prev) =>
      prev.map((p) =>
        p.id === selectedPlatformToAdd
          ? { ...p, connected: true, handle: formatted }
          : p
      )
    );
    const target = platformsList.find((p) => p.id === selectedPlatformToAdd);
    setCustomHandleInput('');
    showToast(`✓ Linked ${target?.name} account (${formatted})!`);

    if (onSaveProfile && userProfile) {
      const current = userProfile.connectedPlatforms || ['tiktok', 'instagram', 'youtube'];
      const nextConnected = current.includes(selectedPlatformToAdd)
        ? current
        : [...current, selectedPlatformToAdd];
      const handleKey =
        selectedPlatformToAdd === 'tiktok'
          ? 'tiktokHandle'
          : selectedPlatformToAdd === 'instagram'
          ? 'instagramHandle'
          : selectedPlatformToAdd === 'youtube'
          ? 'youtubeHandle'
          : selectedPlatformToAdd === 'facebook'
          ? 'facebookHandle'
          : selectedPlatformToAdd === 'threads'
          ? 'threadsHandle'
          : selectedPlatformToAdd === 'pinterest'
          ? 'pinterestHandle'
          : undefined;

      onSaveProfile({
        ...userProfile,
        connectedPlatforms: nextConnected,
        ...(handleKey ? { [handleKey]: formatted } : {}),
      });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const triggerModalPop = () => {
    modalPopScale.setValue(0.92);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Hybrid Data Model Calculations
  const connectedPlatformsList = platformsList.filter((p) => p.connected);
  const hasConnectedPlatforms = connectedPlatformsList.length > 0;

  // Total followers across connected platforms
  const totalConnectedFollowersNumeric = connectedPlatformsList.reduce(
    (acc, p) => acc + parseFollowerCount(p.followers),
    0
  );

  const formattedTotalFollowers =
    totalConnectedFollowersNumeric >= 1000000
      ? `${(totalConnectedFollowersNumeric / 1000000).toFixed(1)}M`
      : totalConnectedFollowersNumeric >= 1000
      ? `${(totalConnectedFollowersNumeric / 1000).toFixed(1)}K`
      : `${totalConnectedFollowersNumeric}`;

  // Blended recent trend percentage across connected platforms
  const blendedGrowthPct =
    totalConnectedFollowersNumeric > 0
      ? `+${(
          connectedPlatformsList.reduce((acc, p) => {
            const pct = parseFloat(p.growthPct.replace(/[+%]/g, '')) || 5.0;
            return acc + pct * parseFollowerCount(p.followers);
          }, 0) / totalConnectedFollowersNumeric
        ).toFixed(1)}%`
      : '+0.0%';

  // Recent new followers estimated from official API trends
  const recentNewFollowersEstimate = Math.round(
    connectedPlatformsList.reduce((acc, p) => {
      const pct = (parseFloat(p.growthPct.replace(/[+%]/g, '')) || 5.0) / 100;
      const count = parseFollowerCount(p.followers);
      return acc + count * (pct / (1 + pct));
    }, 0)
  );

  // Joined API window description per connected platform
  const connectedWindowLabels = connectedPlatformsList.map((p) => getPlatformApiWindow(p.id)).join(' • ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR                                            */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          {/* Top-Left: Mascot + Mode Switcher */}
          <View style={{ alignItems: 'flex-start', gap: 6, flexShrink: 1 }}>
            <BrandLogo size="sm" />

            <HeaderDualModePills
              tier="pro"
              persona={(userPersona || userProfile?.userPersona) === 'new' ? 'new' : 'returning'}
              onToggleTier={() => {
                if (onSwitchToFree) {
                  onSwitchToFree();
                } else if (onSaveProfile && userProfile) {
                  onSaveProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onTogglePersona={onTogglePersona}
              isDark={false}
            />
          </View>

          {/* Right Action Icons: Notification Bell & Profile Avatar */}
          <View style={styles.headerRightGroup}>
            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowNotificationModal(true);
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#1A1626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#1A1626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              style={({ pressed }) => [
                styles.profilePhotoBtn,
                styles.profilePhotoBtnPro,
                pressed && styles.headerIconBtnPressed,
              ]}
              hitSlop={8}
            >
              {userProfile?.customAvatarUri ? (
                <Image
                  source={{ uri: userProfile.customAvatarUri }}
                  style={styles.headerCustomAvatarImage}
                  resizeMode="cover"
                />
              ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
                <Image
                  source={userProfile.avatarSource}
                  style={styles.headerCustomAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                    stroke="#F59E0B"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="#F59E0B"
                    strokeWidth="2.3"
                  />
                </Svg>
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP TAGS & HERO HEADLINE */}
          <View style={styles.topTagsRow}>
            <View style={styles.growthProPill}>
              <Text style={styles.growthProPillText}>GROWTH • PRO</Text>
            </View>
          </View>

          <Text
            style={styles.mainTitleText}
            numberOfLines={2}
          >
            See your growth in full.
          </Text>
          <View style={styles.proAnalyticsActivePill}>
            <Text style={styles.proAnalyticsActiveText}>✨ Pro Analytics Active</Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: GROWTH THIS 30D (Hero Analytics & Hybrid Card)       */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.heroAnalyticsCard, pressed && !isNewUser && styles.btnPressed]}
            disabled={isNewUser && !hasConnectedPlatforms}
            onPress={() => {
              if (isNewUser && !hasConnectedPlatforms) return;
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedGraphType('growth30d');
              triggerModalPop();
              setShowExpandedGraphModal(true);
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.growthThisMonthLabel}>
                {isNewUser
                  ? hasConnectedPlatforms
                    ? 'GROWTH (RECENT PLATFORM API)'
                    : 'GROWTH THIS 30D'
                  : 'GROWTH THIS 30D'}
              </Text>
              {isNewUser ? (
                hasConnectedPlatforms ? (
                  <View style={styles.platformSyncPill}>
                    <Text style={styles.platformSyncText}>⚡ LIVE API SYNC</Text>
                  </View>
                ) : (
                  <View style={styles.milestoneStarterBadge}>
                    <Text style={styles.milestoneStarterBadgeText}>🎯 Day 1 Milestone</Text>
                  </View>
                )
              ) : (
                <View style={styles.expandHintBadge}>
                  <Text style={styles.expandHintBadgeText}>Expand 🔍</Text>
                </View>
              )}
            </View>

            {isNewUser ? (
              hasConnectedPlatforms ? (
                /* HYBRID STATE: AT LEAST ONE PLATFORM CONNECTED */
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
                    <Text style={styles.bigGrowthPercent}>{blendedGrowthPct}</Text>
                    <Text style={{ fontSize: 22, color: '#582CDB', fontWeight: '700' }}>↗</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 4 }}>
                      recent platform trend
                    </Text>
                  </View>

                  <View style={styles.newFollowersPill}>
                    <Text style={styles.newFollowersPillText}>
                      +{recentNewFollowersEstimate.toLocaleString()} RECENT NEW FOLLOWERS · {formattedTotalFollowers} TOTAL
                    </Text>
                  </View>

                  {/* PLATFORM-SPECIFIC API WINDOW CALLOUT */}
                  <View style={styles.apiWindowNoticeBox}>
                    <Text style={styles.apiWindowNoticeText}>
                      📡 <Text style={{ fontWeight: '700', color: '#582CDB' }}>API Windows:</Text>{' '}
                      {connectedWindowLabels}
                    </Text>
                    <Text style={styles.apiWindowNoticeSub}>
                      Recent trends pulled from official platform APIs. Reach, engagement & retention calibrate over your upcoming posts.
                    </Text>
                  </View>

                  {/* SVG CONTINUOUS WAVE GRAPH */}
                  <View style={styles.svgChartContainer}>
                    <Svg width="100%" height={90} viewBox="0 0 340 90">
                      <Defs>
                        <SvgLinearGradient id="waveGradHybrid" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#582CDB" stopOpacity="0.25" />
                          <Stop offset="1" stopColor="#582CDB" stopOpacity="0.0" />
                        </SvgLinearGradient>
                      </Defs>
                      <Path
                        d="M0,65 C40,72 80,50 120,55 C160,58 200,40 240,42 C280,45 310,25 340,28 L340,90 L0,90 Z"
                        fill="url(#waveGradHybrid)"
                      />
                      <Path
                        d="M0,65 C40,72 80,50 120,55 C160,58 200,40 240,42 C280,45 310,25 340,28"
                        fill="none"
                        stroke="#582CDB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <Circle cx={340} cy={28} r={4} fill="#582CDB" />
                    </Svg>
                  </View>
                </>
              ) : (
                /* ZERO CONNECTED STATE: PURE DAY 0 */
                <View style={styles.heroStarterBox}>
                  <Text style={styles.starterMilestoneTitle}>No growth data yet</Text>
                  <Text style={styles.starterMilestoneSub}>
                    Connect your platforms below or publish your first post to start charting your audience and momentum.
                  </Text>

                  {/* Direct Action Trigger */}
                  <Pressable
                    style={({ pressed }) => [styles.starterActionBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                      if (onOpenPostComposer) {
                        onOpenPostComposer('Day 1 creator introduction: Why I started sharing', 'TikTok');
                      } else if (onNavigateTab) {
                        onNavigateTab('create');
                      } else {
                        showToast('Opening Post Composer for Day 1 Post...');
                      }
                    }}
                  >
                    <Text style={styles.starterActionBtnText}>🚀 Create Day 1 Post →</Text>
                  </Pressable>
                </View>
              )
            ) : (
              /* RETURNING PRO CREATOR */
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
                  <Text style={styles.bigGrowthPercent}>+28.4%</Text>
                  <Text style={{ fontSize: 22, color: '#582CDB', fontWeight: '700' }}>↗</Text>
                </View>

                <View style={styles.newFollowersPill}>
                  <Text style={styles.newFollowersPillText}>+2,480 NEW FOLLOWERS</Text>
                </View>

                {/* SVG CONTINUOUS WAVE GRAPH */}
                <View style={styles.svgChartContainer}>
                  <Svg width="100%" height={90} viewBox="0 0 340 90">
                    <Defs>
                      <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#582CDB" stopOpacity="0.25" />
                        <Stop offset="1" stopColor="#582CDB" stopOpacity="0.0" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path
                      d="M0,60 C40,70 80,45 120,50 C160,55 200,35 240,40 C280,45 310,20 340,25 L340,90 L0,90 Z"
                      fill="url(#waveGrad)"
                    />
                    <Path
                      d="M0,60 C40,70 80,45 120,50 C160,55 200,35 240,40 C280,45 310,20 340,25"
                      fill="none"
                      stroke="#582CDB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <Circle cx={340} cy={25} r={4} fill="#582CDB" />
                  </Svg>
                </View>
              </>
            )}

            {/* 2x2 METRICS GRID */}
            <View style={styles.metricsGrid2x2}>
              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>REACH</Text>
                <Text style={styles.gridMetricVal}>{isNewUser ? '—' : '131.0K'}</Text>
                {isNewUser && (
                  <Text style={styles.gridMetricSub}>
                    {hasConnectedPlatforms ? 'PostStreak Metric' : 'Target: 1.0K'}
                  </Text>
                )}
              </View>

              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>ENGAGEMENT</Text>
                <Text style={styles.gridMetricVal}>{isNewUser ? '—' : '18.0K'}</Text>
                {isNewUser && (
                  <Text style={styles.gridMetricSub}>
                    {hasConnectedPlatforms ? 'PostStreak Metric' : 'Target: 100'}
                  </Text>
                )}
              </View>

              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>FOLLOWERS</Text>
                <Text style={[styles.gridMetricVal, (!isNewUser || hasConnectedPlatforms) && { color: '#582CDB' }]}>
                  {isNewUser ? (hasConnectedPlatforms ? formattedTotalFollowers : '—') : '+2,480'}
                </Text>
                {isNewUser && (
                  <Text style={styles.gridMetricSub}>
                    {hasConnectedPlatforms
                      ? `Across ${connectedPlatformsList.length} ${connectedPlatformsList.length === 1 ? 'Platform' : 'Platforms'}`
                      : 'Not Connected'}
                  </Text>
                )}
              </View>

              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>AVG. RETENTION</Text>
                <Text style={styles.gridMetricVal}>{isNewUser ? '—' : '42s'}</Text>
                {isNewUser && (
                  <Text style={styles.gridMetricSub}>
                    {hasConnectedPlatforms ? 'PostStreak Metric' : 'Target: 40s+'}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* SECTION 2: PLATFORMS                                         */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.platformsSectionTitle}>Platforms</Text>
            {platformsList.some((p) => p.connected) && (
              <Pressable
                style={({ pressed }) => [styles.platformSyncPill, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  triggerModalPop();
                  setShowAddPlatformModal(true);
                }}
              >
                <Text style={styles.platformSyncText}>⚡ LIVE PLATFORM DATA</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.platformsContainerCard}>
            {isNewUser ? (
              platformsList.slice(0, 3).map((plat) => (
                <View key={plat.id} style={styles.platformItemRow}>
                  <SocialBrandIcon platform={plat.id} size={28} />
                  {plat.connected ? (
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
                          <Text style={styles.platformName} numberOfLines={1}>
                            {plat.name}
                          </Text>
                          <View style={styles.connectedMicroDot} />
                        </View>
                        <Text style={styles.platformGrowthPurple} numberOfLines={1}>
                          {plat.growthPct}{' '}
                          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>· {plat.followers} followers</Text>
                        </Text>
                      </View>
                      <View style={styles.platformTrackBg}>
                        <View style={[styles.platformTrackFill, { width: plat.barWidth as any }]} />
                      </View>
                    </View>
                  ) : (
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.platformName} numberOfLines={1}>
                        {plat.name}
                      </Text>
                      <Pressable
                        style={({ pressed }) => [styles.connectPlatformSmallBtn, pressed && styles.btnPressed]}
                        onPress={() => handleConnectSinglePlatform(plat.id)}
                        hitSlop={6}
                      >
                        <Text style={styles.connectPlatformSmallBtnText}>Connect</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))
            ) : (
              platformsList
                .filter((p) => p.connected)
                .map((plat) => (
                  <View key={plat.id} style={styles.platformItemRow}>
                    <SocialBrandIcon platform={plat.id} size={28} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={styles.platformName} numberOfLines={1}>
                          {plat.name}
                        </Text>
                        <Text style={styles.platformGrowthPurple} numberOfLines={1}>
                          {plat.growthPct}{' '}
                          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>· {plat.followers} followers</Text>
                        </Text>
                      </View>
                      <View style={styles.platformTrackBg}>
                        <View style={[styles.platformTrackFill, { width: plat.barWidth as any }]} />
                      </View>
                    </View>
                  </View>
                ))
            )}

            <Pressable
              style={({ pressed }) => [styles.addPlatformOutlineBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowAddPlatformModal(true);
              }}
            >
              <Text style={styles.addPlatformBtnText}>+ Add / Connect Platform</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 3: AUDIENCE GROWTH (RETURNING PRO USERS)                */}
          {/* ============================================================ */}
          {!isNewUser && (
            <Pressable
              style={({ pressed }) => [styles.audienceGrowthCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setExpandedGraphType('audience');
                triggerModalPop();
                setShowExpandedGraphModal(true);
              }}
            >
              <View style={styles.audienceGrowthHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                    <Text style={styles.audienceGrowthTitle}>Audience Growth</Text>
                    <View style={styles.expandHintBadgePurple}>
                      <Text style={styles.expandHintBadgePurpleText}>Live 🔍</Text>
                    </View>
                  </View>
                  <Text style={styles.audienceTotalSub}>144,320 TOTAL AUDIENCE</Text>
                </View>
                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <Text style={styles.audienceLast30dVal}>+2,480</Text>
                  <Text style={styles.audienceLast30dLabel}>LAST 30 DAYS</Text>
                </View>
              </View>

              <View style={styles.svgChartContainer}>
                <Svg width="100%" height={90} viewBox="0 0 340 90">
                  <Defs>
                    <SvgLinearGradient id="audGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#7C3AED" stopOpacity="0.3" />
                      <Stop offset="1" stopColor="#7C3AED" stopOpacity="0.05" />
                    </SvgLinearGradient>
                  </Defs>
                  <Path
                    d="M0,70 C50,40 100,65 150,45 C200,60 250,30 340,35 L340,90 L0,90 Z"
                    fill="url(#audGrad)"
                  />
                  <Path
                    d="M0,70 C50,40 100,65 150,45 C200,60 250,30 340,35"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <Circle cx={340} cy={35} r={4} fill="#F59E0B" />
                </Svg>
              </View>

              <View style={styles.growthInsightCalloutBox}>
                <Text style={styles.growthInsightText}>
                  Your audience growth was 3× higher during morning short-form posting windows.
                </Text>
              </View>
            </Pressable>
          )}

          {/* ============================================================ */}
          {/* CARD 4: CONTENT FORMAT PERFORMANCE                           */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.contentFormatCard, pressed && !isNewUser && styles.btnPressed]}
            disabled={isNewUser}
            onPress={() => {
              if (isNewUser) return;
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedGraphType('contentFormat');
              triggerModalPop();
              setShowExpandedGraphModal(true);
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              <Text style={[styles.contentFormatTitle, { marginBottom: 0, flex: 1, minWidth: 150 }]}>Content Format Performance</Text>
              {isNewUser ? (
                <View style={styles.milestoneStarterBadge}>
                  <Text style={styles.milestoneStarterBadgeText}>🔓 Unlocks on 2 Posts</Text>
                </View>
              ) : (
                <View style={styles.expandHintBadge}>
                  <Text style={styles.expandHintBadgeText}>Compare Formats 🔍</Text>
                </View>
              )}
            </View>

            {/* 4-Column Bar Chart */}
            <View style={[styles.barsGroupRow, isNewUser && { height: 44, alignItems: 'flex-end', marginBottom: 12 }]}>
              {/* Col 1 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: isNewUser ? 6 : 60, backgroundColor: isNewUser ? '#E2E8F0' : '#DDD6FE' }]} />
                <Text style={styles.barLabelText}>REELS</Text>
              </View>

              {/* Col 2 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: isNewUser ? 6 : 95, backgroundColor: isNewUser ? '#C4B5FD' : '#582CDB' }]} />
                <Text style={[styles.barLabelText, !isNewUser && { color: '#582CDB', fontWeight: '700' }]}>CAROUSEL</Text>
              </View>

              {/* Col 3 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: isNewUser ? 6 : 48, backgroundColor: isNewUser ? '#E2E8F0' : '#C4B5FD' }]} />
                <Text style={styles.barLabelText}>POSTS / X</Text>
              </View>

              {/* Col 4 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: isNewUser ? 6 : 32, backgroundColor: isNewUser ? '#E2E8F0' : '#EDE9FE' }]} />
                <Text style={styles.barLabelText}>SHORTS</Text>
              </View>
            </View>

            <View style={styles.formatInsightCallout}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 13, marginTop: 1 }}>🎯</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#582CDB', letterSpacing: 0.4, marginBottom: 2 }}>
                    {isNewUser ? 'FORMAT UNLOCK CHALLENGE' : 'BEST REEL STRATEGY'}
                  </Text>
                  <Text style={styles.formatInsightText}>
                    {isNewUser
                      ? 'Post 1 Reel and 1 Carousel to unlock your side-by-side retention & saves comparison.'
                      : 'Your talk-to-camera storytelling Reels generate 32% higher retention than music-only Reels.'}
                  </Text>
                  {isNewUser && (
                    <Pressable
                      style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      onPress={() => {
                        if (onOpenPostComposer) onOpenPostComposer('Short storytelling Reel hook', 'Instagram');
                        else if (onNavigateTab) onNavigateTab('create');
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#582CDB' }}>Draft your first Reel →</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* SECTION 5: TOP POSTS ANALYSIS                                */}
          {/* ============================================================ */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <Text style={[styles.topPostsSectionHeader, { flex: 1, minWidth: 140 }]}>Top Posts Analysis</Text>
            {isNewUser ? (
              <View style={styles.milestoneStarterBadge}>
                <Text style={styles.milestoneStarterBadgeText}>Awaiting Post 1</Text>
              </View>
            ) : (
              <View style={styles.expandHintBadge}>
                <Text style={styles.expandHintBadgeText}>Deep Dive 🔍</Text>
              </View>
            )}
          </View>

          {isNewUser ? (
            <View style={[styles.postAnalysisCard, { padding: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }]}>
              <View style={styles.starterPostIconCircle}>
                <Text style={{ fontSize: 22 }}>✨</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#171420', textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
                Rank Your Content Momentum
              </Text>
              <Text style={{ fontSize: 12.5, fontWeight: '500', color: '#64748B', textAlign: 'center', lineHeight: 18, paddingHorizontal: 12, marginBottom: 14 }}>
                Your highest-performing posts will rank here with deep audience retention and repurposing audits.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.starterOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (onOpenPostComposer) onOpenPostComposer('My Day 1 creator perspective', 'TikTok');
                  else if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.starterOutlineBtnText}>+ Draft Post 1</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12, marginBottom: 20 }}>
              {TOP_POSTS_DATA.map((post) => (
                <Pressable
                  key={post.id}
                  style={({ pressed }) => [styles.postAnalysisCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedPost(post);
                    setSelectedPostTitle(post.title);
                    triggerModalPop();
                    setShowPostDetailModal(true);
                  }}
                >
                  <Image
                    source={post.thumbnail}
                    style={styles.postThumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <View style={post.format === 'REEL' ? styles.postTypePill : styles.postTypePillGray}>
                        <Text style={post.format === 'REEL' ? styles.postTypePillText : styles.postTypePillGrayText}>
                          {post.format}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <SocialBrandIcon platform={post.platform} size={15} />
                        <Text style={styles.postPlatformLabel}>{post.platform.toUpperCase()}</Text>
                      </View>
                    </View>

                    <Text style={styles.postAnalysisTitle} numberOfLines={2}>
                      {post.title}
                    </Text>
                    <Text
                      style={styles.postMetricsText}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.85}
                    >
                      👁️ {post.views} views • 💬 {post.comments} comments • 💾 {post.saves} saves
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* ============================================================ */}
          {/* CARD 6: PEAK AUDIENCE WINDOW                                 */}
          {/* ============================================================ */}
          <View style={styles.peakWindowCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.peakWindowTitle, { marginBottom: 0 }]}>Peak Audience Window</Text>
              {isNewUser && (
                <View style={styles.milestoneStarterBadge}>
                  <Text style={styles.milestoneStarterBadgeText}>⏱️ Calibrating</Text>
                </View>
              )}
            </View>

            {/* 7 Heatmap day blocks with M T W T F S S labels */}
            <View style={styles.heatmapRow}>
              {[
                { day: 'M', full: 'Mon', heat: '#F1F5F9' },
                { day: 'T', full: 'Tue', heat: '#DDD6FE' },
                { day: 'W', full: 'Wed', heat: '#A78BFA' },
                { day: 'T', full: 'Thu', heat: '#8B5CF6' },
                { day: 'F', full: 'Fri', heat: '#F59E0B' },
                { day: 'S', full: 'Sat', heat: '#C4B5FD' },
                { day: 'S', full: 'Sun', heat: '#F1F5F9' },
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.heatmapBlock,
                    {
                      backgroundColor: isNewUser ? '#F8FAFC' : item.heat,
                      borderWidth: isNewUser ? 1 : 0,
                      borderColor: '#E2E8F0',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 40,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color:
                        !isNewUser && (item.heat === '#8B5CF6' || item.heat === '#582CDB' || item.heat === '#F59E0B')
                          ? '#FFFFFF'
                          : '#94A3B8',
                    }}
                  >
                    {item.day}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.peakTimeCallout}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>⏱️</Text>
                <View style={{ flex: 1 }}>
                  {isNewUser ? (
                    <>
                      <Text style={styles.peakTimeHighlightText}>Calibrating Peak Window</Text>
                      <Text style={styles.peakTimeSub}>
                        Publish 2 posts across different days to calculate your highest-converting time slots.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.peakTimeHighlightText}>Tue &amp; Thu, 7:30 PM</Text>
                      <Text style={styles.peakTimeSub}>Your strongest posting window this week.</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 7: JARVIS INTELLIGENCE                                  */}
          {/* ============================================================ */}
          <View style={styles.jarvisIntelligenceCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
              <Text style={styles.jarvisIntelligenceTag}>JARVIS INTELLIGENCE</Text>
            </View>

            <Text style={styles.jarvisIntelligenceTitle}>
              {isNewUser
                ? 'Day 1 Strategy: Start with a 30s talk-to-camera intro to set your baseline retention.'
                : 'Increase your storytelling output by 25% this week.'}
            </Text>

            <View style={styles.jarvisBadgesRow}>
              <View style={styles.jarvisBadgeWhite}>
                <Text style={styles.jarvisBadgeWhiteText}>{isNewUser ? '🎯 Goal: 1st Post' : '🏷️ Focus: Reel Retention'}</Text>
              </View>
              <View style={styles.jarvisBadgeWhite}>
                <Text style={styles.jarvisBadgeWhiteText}>{isNewUser ? '⚡ Suggested: 7:30 PM' : '⚡ Publish: 7:30 PM'}</Text>
              </View>
              <View style={styles.jarvisBadgeWhite}>
                <Text style={styles.jarvisBadgeWhiteText}>{isNewUser ? '🎥 Format: Short Reel' : '🔗 Audience Goal: 150K'}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.executeRecSolidBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenPostComposer) {
                  onOpenPostComposer(
                    isNewUser
                      ? 'Why I decided to start creating: 1 lesson I learned'
                      : 'Storytelling breakdown: 3 mistakes I stopped making',
                    'TikTok'
                  );
                } else {
                  showToast('Applying optimal 7:30 PM storytelling preset to draft!');
                }
              }}
            >
              <Text style={styles.executeRecBtnText}>
                {isNewUser ? 'Use Day 1 Storytelling Prompt 🚀' : 'Execute Recommendations'}
              </Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* ROW 8: 2x2 QUICK ACTION TILES                                */}
          {/* ============================================================ */}
          <View style={styles.quickActionTilesGrid}>
            {/* Tile 1: Repeat best format or Pick Day 1 format */}
            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenPostComposer) {
                  onOpenPostComposer('Short storytelling Reel hook', 'TikTok');
                } else if (onNavigateTab) {
                  onNavigateTab('create');
                } else {
                  showToast('Opened Post Composer with 45s Short Reel formula!');
                }
              }}
            >
              <View style={styles.tileHeaderRow}>
                <Text style={{ fontSize: 18 }}>🎥</Text>
                <Text style={styles.tileArrowText}>→</Text>
              </View>
              <Text style={styles.tileTitleText}>
                {isNewUser ? 'Pick post\ntemplate' : 'Repeat best format\n(Short Reel)'}
              </Text>
            </Pressable>

            {/* Tile 2: Set 7:30 PM slot in calendar -> Animated Popup */}
            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                triggerModalPop();
                setShowSlotSetModal(true);
              }}
            >
              <View style={styles.tileHeaderRow}>
                <Text style={{ fontSize: 18 }}>🗓️</Text>
                <Text style={styles.tileArrowText}>→</Text>
              </View>
              <Text style={styles.tileTitleText}>
                {isNewUser ? 'Set daily post\nreminder' : 'Set 7:30 PM slot in\ncalendar'}
              </Text>
            </Pressable>

            {/* Tile 3: Protect growth momentum -> Options Modal */}
            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                triggerModalPop();
                setShowProtectMomentumModal(true);
              }}
            >
              <View style={styles.tileHeaderRow}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
                <Text style={styles.tileArrowText}>→</Text>
              </View>
              <Text style={styles.tileTitleText}>
                {isNewUser ? 'Activate streak\nshield' : 'Protect growth\nmomentum'}
              </Text>
            </Pressable>

            {/* Tile 4: Generate script -> Script Page */}
            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenScript) {
                  onOpenScript();
                } else if (onNavigateTab) {
                  onNavigateTab('create');
                } else {
                  showToast('Navigating to Script Studio...');
                }
              }}
            >
              <View style={styles.tileHeaderRow}>
                <Text style={{ fontSize: 18 }}>🪄</Text>
                <Text style={styles.tileArrowText}>→</Text>
              </View>
              <Text style={styles.tileTitleText}>Generate script</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 9: MONTHLY REPORT BANNER                                */}
          {/* ============================================================ */}
          <View style={styles.monthlyReportCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={styles.reportIconSquare}>
                <Text style={{ fontSize: 20 }}>📑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.monthlyReportTitle}>Monthly Report</Text>
                <Text style={styles.monthlyReportSub}>Monthly Audit • PDF Export</Text>
              </View>
              {isNewUser && (
                <View style={styles.milestoneStarterBadge}>
                  <Text style={styles.milestoneStarterBadgeText}>Day 30</Text>
                </View>
              )}
            </View>

            {isNewUser ? (
              <View style={styles.reportLockedStateBox}>
                <Text style={styles.reportLockedStateText}>
                  Your first monthly growth audit &amp; PDF report unlocks after 30 days of activity (Day 0 of 30).
                </Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.generateReportSolidBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowReportModal(true);
                }}
              >
                <Text style={styles.generateReportBtnText}>Generate Report</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL: EXPANDED INTERACTIVE HORIZONTAL LIVE GRAPH             */}
        {/* ============================================================ */}
        <Modal
          visible={showExpandedGraphModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowExpandedGraphModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, styles.expandedGraphModalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={{ paddingBottom: 12 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={styles.liveGreenPulseDot} />
                    <Text
                      style={[styles.modalTitle, { flex: 1, minWidth: 0, fontSize: 16 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {expandedGraphType === 'growth30d'
                        ? `${graphTimeframe === '30D' ? '30-Day' : graphTimeframe} Growth Velocity`
                        : expandedGraphType === 'audience'
                        ? '144.3K Total Audience'
                        : 'Content Format Performance'}
                    </Text>
                  </View>
                  <Text
                    style={styles.modalSubtitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {expandedGraphType === 'growth30d'
                      ? `Live multi-point analytics stream • ${graphTimeframe}`
                      : expandedGraphType === 'audience'
                      ? `Cross-platform audience expansion • ${graphTimeframe}`
                      : `Retention, reach & saves benchmarks • ${graphTimeframe}`}
                  </Text>
                </View>
                <Pressable onPress={() => setShowExpandedGraphModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Timeframe Filter Buttons */}
              <View style={styles.graphTimeframeRow}>
                {(['7D', '14D', '30D', '90D'] as const).map((tf) => (
                  <Pressable
                    key={tf}
                    style={[styles.graphTimeframePill, graphTimeframe === tf && styles.graphTimeframePillActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      setGraphTimeframe(tf);
                      // Reset selected node to end of range
                      const maxIndex = TIMEFRAME_CONFIGS[tf].daysCount - 1;
                      setSelectedGraphDayIndex(maxIndex);
                    }}
                  >
                    <Text style={[styles.graphTimeframeText, graphTimeframe === tf && styles.graphTimeframeTextActive]}>
                      {tf}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Active Point Live Inspection Banner */}
              {(() => {
                const curCfg = (TIMEFRAME_CONFIGS as any)[graphTimeframe] || (TIMEFRAME_CONFIGS as any)['30D'];

                if (expandedGraphType === 'contentFormat') {
                  const fmt = curCfg.formatSummary.formats[selectedFormatIndex] || curCfg.formatSummary.formats[0];
                  return (
                    <View style={styles.graphActivePointCard}>
                      {/* Top Row: Format Icon & Full Name + Gain Badge */}
                      <View style={styles.graphActivePointHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 18 }}>{fmt.icon}</Text>
                          <Text style={styles.graphActivePointTitleText} numberOfLines={1}>
                            {fmt.name}
                          </Text>
                        </View>
                        <View style={styles.graphActivePointGainBadge}>
                          <Text style={styles.graphActivePointGainBadgeText}>
                            {fmt.delta}
                          </Text>
                        </View>
                      </View>

                      {/* 3 Metric Columns with Full Words */}
                      <View style={styles.graphActivePointMetricsGrid}>
                        <View style={styles.graphActivePointMetricCell}>
                          <Text style={styles.graphActivePointCellLabel}>AVERAGE REACH</Text>
                          <Text style={[styles.graphActivePointCellVal, { color: '#582CDB' }]}>{fmt.reach}</Text>
                        </View>
                        <View style={styles.graphActivePointCellDivider} />
                        <View style={styles.graphActivePointMetricCell}>
                          <Text style={styles.graphActivePointCellLabel}>AVG WATCHED</Text>
                          <Text style={[styles.graphActivePointCellVal, { color: '#10B981' }]}>{fmt.retention}</Text>
                        </View>
                        <View style={styles.graphActivePointCellDivider} />
                        <View style={styles.graphActivePointMetricCell}>
                          <Text style={styles.graphActivePointCellLabel}>SAVE RATE</Text>
                          <Text style={[styles.graphActivePointCellVal, { color: '#F59E0B' }]}>{fmt.saveRate.split(' ')[0]}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }

                if (expandedGraphType === 'growth30d') {
                  const safeIdx = Math.min(selectedGraphDayIndex, curCfg.daysCount - 1);
                  const activePt = curCfg.getPoint(safeIdx, expandedGraphType);
                  const gainText = activePt.deltaFollowers.includes('Followers')
                    ? activePt.deltaFollowers.replace('Followers', 'followers today')
                    : activePt.deltaFollowers.includes('Today')
                    ? activePt.deltaFollowers.replace('Today', 'followers today')
                    : `${activePt.deltaFollowers} followers today`;

                  return (
                    <View style={styles.graphActivePointCard}>
                      {/* Top Row: Date + Daily Follower Gain Badge */}
                      <View style={styles.graphActivePointHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 16 }}>📅</Text>
                          <Text style={styles.graphActivePointTitleText} numberOfLines={1}>
                            {activePt.date}
                          </Text>
                        </View>
                        <View style={styles.graphActivePointGainBadge}>
                          <Text style={styles.graphActivePointGainBadgeText}>
                            {gainText}
                          </Text>
                        </View>
                      </View>

                      {/* 3 Metric Columns with Full Words */}
                      <View style={styles.graphActivePointMetricsGrid}>
                        <View style={styles.graphActivePointMetricCell}>
                          <Text style={styles.graphActivePointCellLabel}>DAILY REACH</Text>
                          <Text style={[styles.graphActivePointCellVal, { color: '#582CDB' }]}>{activePt.metricValue}</Text>
                        </View>
                        <View style={styles.graphActivePointCellDivider} />
                        <View style={styles.graphActivePointMetricCell}>
                          <Text style={styles.graphActivePointCellLabel}>{graphTimeframe} TOTAL REACH</Text>
                          <Text style={[styles.graphActivePointCellVal, { color: '#171420' }]}>{curCfg.reachSummary.total}</Text>
                        </View>
                        <View style={styles.graphActivePointCellDivider} />
                        <View style={styles.graphActivePointMetricCell}>
                          <Text style={styles.graphActivePointCellLabel}>ENGAGEMENT</Text>
                          <Text style={[styles.graphActivePointCellVal, { color: '#10B981' }]}>{curCfg.reachSummary.engagement}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }

                // Audience Expansion View
                const safeIdx = Math.min(selectedGraphDayIndex, curCfg.daysCount - 1);
                const activePt = curCfg.getPoint(safeIdx, expandedGraphType);
                const gainText = activePt.deltaFollowers.includes('Followers')
                  ? activePt.deltaFollowers.replace('Followers', 'followers today')
                  : activePt.deltaFollowers.includes('Today')
                  ? activePt.deltaFollowers.replace('Today', 'followers today')
                  : `${activePt.deltaFollowers} followers today`;

                return (
                  <View style={styles.graphActivePointCard}>
                    {/* Top Row: Date + Daily Follower Gain Badge */}
                    <View style={styles.graphActivePointHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 16 }}>📅</Text>
                        <Text style={styles.graphActivePointTitleText} numberOfLines={1}>
                          {activePt.date}
                        </Text>
                      </View>
                      <View style={styles.graphActivePointGainBadge}>
                        <Text style={styles.graphActivePointGainBadgeText}>
                          {gainText}
                        </Text>
                      </View>
                    </View>

                    {/* 3 Metric Columns with Full Words */}
                    <View style={styles.graphActivePointMetricsGrid}>
                      <View style={styles.graphActivePointMetricCell}>
                        <Text style={styles.graphActivePointCellLabel}>TOTAL AUDIENCE</Text>
                        <Text style={[styles.graphActivePointCellVal, { color: '#7C3AED' }]}>{activePt.metricValue}</Text>
                      </View>
                      <View style={styles.graphActivePointCellDivider} />
                      <View style={styles.graphActivePointMetricCell}>
                        <Text style={styles.graphActivePointCellLabel}>{graphTimeframe} NET GAIN</Text>
                        <Text style={[styles.graphActivePointCellVal, { color: '#10B981' }]}>{curCfg.audienceSummary.delta.split(' ')[0]}</Text>
                      </View>
                      <View style={styles.graphActivePointCellDivider} />
                      <View style={styles.graphActivePointMetricCell}>
                        <Text style={styles.graphActivePointCellLabel}>TIER-1 QUALITY</Text>
                        <Text style={[styles.graphActivePointCellVal, { color: '#171420' }]}>{curCfg.audienceSummary.quality}</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* HORIZONTAL SCROLLABLE LIVE GRAPH / BAR COMPARISON VIEWPORT */}
              {(() => {
                const curCfg = (TIMEFRAME_CONFIGS as any)[graphTimeframe] || (TIMEFRAME_CONFIGS as any)['30D'];

                if (expandedGraphType === 'contentFormat') {
                  const fmts = curCfg.formatSummary.formats;
                  return (
                    <View style={styles.horizontalGraphViewport}>
                      <View style={{ width: '100%', paddingVertical: 8, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textAlign: 'center', marginBottom: 12 }}>
                          📊 Tap any format bar to inspect retention &amp; reach benchmarks
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 130, paddingBottom: 6, gap: 8, paddingHorizontal: 6 }}>
                          {fmts.map((f: any, fIdx: number) => {
                            const isChosen = selectedFormatIndex === fIdx;
                            const shortLabel = f.name.startsWith('Talking') ? 'Reels' : f.name.split(' ')[0];
                            return (
                              <Pressable
                                key={fIdx}
                                style={{ alignItems: 'center', flex: 1, minWidth: 0 }}
                                onPress={() => {
                                  if (Platform.OS !== 'web') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  }
                                  setSelectedFormatIndex(fIdx);
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: '800',
                                    color: isChosen ? f.color : '#64748B',
                                    marginBottom: 4,
                                    textAlign: 'center',
                                  }}
                                  numberOfLines={1}
                                >
                                  {f.reach}
                                </Text>
                                <View
                                  style={{
                                    width: 32,
                                    height: f.barHeight,
                                    backgroundColor: isChosen ? f.color : '#E2E8F0',
                                    borderRadius: 10,
                                    borderWidth: isChosen ? 2 : 0,
                                    borderColor: '#FFFFFF',
                                    shadowColor: isChosen ? f.color : 'transparent',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 4,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: isChosen ? '900' : '700',
                                    color: isChosen ? '#171420' : '#64748B',
                                    marginTop: 8,
                                    textAlign: 'center',
                                    paddingHorizontal: 2,
                                  }}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.75}
                                >
                                  {shortLabel}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  );
                }

                const vWidth = curCfg.viewportWidth;
                const safeIdx = Math.min(selectedGraphDayIndex, curCfg.daysCount - 1);

                return (
                  <View style={styles.horizontalGraphViewport}>
                    <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={true}
                      bounces={true}
                      contentContainerStyle={styles.horizontalGraphScrollContent}
                    >
                      <View style={{ width: vWidth, height: 210, position: 'relative' }}>
                        {/* SVG Graphic Wave Lines & Grid */}
                        <Svg width={vWidth} height={190} viewBox={`0 0 ${vWidth} 190`}>
                          <Defs>
                            <SvgLinearGradient id="liveWaveGrad" x1="0" y1="0" x2="0" y2="1">
                              <Stop
                                offset="0"
                                stopColor={expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED'}
                                stopOpacity="0.38"
                              />
                              <Stop
                                offset="1"
                                stopColor={expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED'}
                                stopOpacity="0.0"
                              />
                            </SvgLinearGradient>
                          </Defs>

                          {/* Horizontal Grid lines */}
                          <Path d={`M0,35 L${vWidth},35`} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                          <Path d={`M0,80 L${vWidth},80`} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                          <Path d={`M0,125 L${vWidth},125`} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                          <Path d={`M0,170 L${vWidth},170`} stroke="#E2E8F0" strokeWidth="1.5" />

                          {/* Area Fill */}
                          <Path d={curCfg.areaPath(expandedGraphType)} fill="url(#liveWaveGrad)" />

                          {/* Line Curve */}
                          <Path
                            d={curCfg.svgPath(expandedGraphType)}
                            fill="none"
                            stroke={expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED'}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </Svg>

                        {/* Interactive Node Touchpoints */}
                        <View style={styles.interactiveNodesOverlay}>
                          {Array.from({ length: curCfg.daysCount }, (_, i) => {
                            const isSelected = safeIdx === i;
                            const pt = curCfg.getPoint(i, expandedGraphType);

                            return (
                              <Pressable
                                key={i}
                                style={[
                                  styles.interactiveGraphNode,
                                  {
                                    left: i * curCfg.stepSpacing + 6,
                                    top: pt.yPos - 10,
                                  },
                                ]}
                                onPress={() => {
                                  if (Platform.OS !== 'web') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  }
                                  setSelectedGraphDayIndex(i);
                                }}
                                hitSlop={8}
                              >
                                <View
                                  style={[
                                    styles.nodeCircleDot,
                                    isSelected && styles.nodeCircleDotSelected,
                                    {
                                      backgroundColor: isSelected
                                        ? '#F59E0B'
                                        : expandedGraphType === 'growth30d'
                                        ? '#582CDB'
                                        : '#7C3AED',
                                    },
                                  ]}
                                />
                                {isSelected && <View style={styles.nodeSelectedGlowRing} />}
                              </Pressable>
                            );
                          })}
                        </View>

                        {/* X-Axis Date Labels */}
                        <View style={styles.xAxisLabelsRow}>
                          {curCfg.labels.map((lbl: any, lIdx: number) => (
                            <Text key={lIdx} style={[styles.xAxisLabelText, { left: lbl.x }]}>
                              {lbl.text}
                            </Text>
                          ))}
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                );
              })()}

              {/* DEDICATED CLEAN AREA UNDER GRAPH (DYNAMICALLY UPDATING BY TIMEFRAME) */}
              {(() => {
                const curCfg = (TIMEFRAME_CONFIGS as any)[graphTimeframe] || (TIMEFRAME_CONFIGS as any)['30D'];

                if (expandedGraphType === 'contentFormat') {
                  const fmtSum = curCfg.formatSummary;
                  return (
                    <View style={styles.audienceCleanBottomContainer}>
                      {/* 2 Key Stats Duo */}
                      <View style={styles.audienceStatsDuoRow}>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel}>TOP REACH FORMAT</Text>
                          <Text
                            style={[styles.audienceStatDuoVal, { color: '#582CDB' }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {fmtSum.topFormat.split(' ')[0]}
                          </Text>
                          <Text
                            style={styles.audienceStatDuoSub}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {fmtSum.topFormat}
                          </Text>
                        </View>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel}>TOP SAVES &amp; BOOKMARKS</Text>
                          <Text
                            style={[styles.audienceStatDuoVal, { color: '#10B981' }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {fmtSum.topConversion.split(' ')[0]}
                          </Text>
                          <Text
                            style={styles.audienceStatDuoSub}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {fmtSum.topConversion}
                          </Text>
                        </View>
                      </View>

                      {/* Format Detail Rows */}
                      <View style={styles.audienceChannelsCard}>
                        <Text style={styles.audienceChannelsTitle}>FORMAT REACH BREAKDOWN ({graphTimeframe})</Text>

                        {fmtSum.formats.map((f: any, fIdx: number) => (
                          <View key={fIdx} style={styles.audienceChannelRow}>
                            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FAF8F5', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 16 }}>{f.icon}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={styles.audienceChannelName}>{f.name}</Text>
                                <Text style={styles.audienceChannelVal}>{f.reach}</Text>
                              </View>
                              <View style={styles.audienceChannelTrackBg}>
                                <View style={[styles.audienceChannelTrackFill, { width: `${f.barHeight}%`, backgroundColor: f.color }]} />
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Clean Insight Callout */}
                      <View style={styles.audienceInsightCallout}>
                        <Text style={styles.audienceInsightCalloutText}>
                          ⚡ <Text style={{ fontWeight: '800', color: '#582CDB' }}>Format Strategy ({graphTimeframe}):</Text> {fmtSum.insight}
                        </Text>
                      </View>
                    </View>
                  );
                } else if (expandedGraphType === 'audience') {
                  const aud = curCfg.audienceSummary;
                  return (
                    /* LUXURY CLEAN AUDIENCE EXPANSION VIEW (TIMEFRAME DYNAMIC) */
                    <View style={styles.audienceCleanBottomContainer}>
                      {/* 2 Key Stats Duo */}
                      <View style={styles.audienceStatsDuoRow}>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel}>TOTAL AUDIENCE</Text>
                          <Text style={styles.audienceStatDuoVal}>{aud.total}</Text>
                          <Text style={styles.audienceStatDuoSub}>{aud.delta}</Text>
                        </View>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel}>AUDIENCE QUALITY</Text>
                          <Text style={[styles.audienceStatDuoVal, { color: '#10B981' }]}>{aud.quality}</Text>
                          <Text style={styles.audienceStatDuoSub}>{aud.qualityLabel}</Text>
                        </View>
                      </View>

                      {/* Channel Follower Share Breakdown */}
                      <View style={styles.audienceChannelsCard}>
                        <Text style={styles.audienceChannelsTitle}>FOLLOWER SHARE ({graphTimeframe})</Text>

                        {/* Instagram */}
                        <View style={styles.audienceChannelRow}>
                          <SocialBrandIcon platform="instagram" size={20} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.audienceChannelName}>Instagram · Reel</Text>
                              <Text style={styles.audienceChannelVal}>{aud.igGain} <Text style={styles.audienceChannelPct}>{aud.igPct}</Text></Text>
                            </View>
                            <View style={styles.audienceChannelTrackBg}>
                              <View style={[styles.audienceChannelTrackFill, { width: aud.igPct as any, backgroundColor: '#E1306C' }]} />
                            </View>
                          </View>
                        </View>

                        {/* TikTok */}
                        <View style={styles.audienceChannelRow}>
                          <SocialBrandIcon platform="tiktok" size={20} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.audienceChannelName}>TikTok</Text>
                              <Text style={styles.audienceChannelVal}>{aud.ttGain} <Text style={styles.audienceChannelPct}>{aud.ttPct}</Text></Text>
                            </View>
                            <View style={styles.audienceChannelTrackBg}>
                              <View style={[styles.audienceChannelTrackFill, { width: aud.ttPct as any, backgroundColor: '#000000' }]} />
                            </View>
                          </View>
                        </View>

                        {/* YouTube */}
                        <View style={styles.audienceChannelRow}>
                          <SocialBrandIcon platform="youtube" size={20} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.audienceChannelName}>YouTube · Short</Text>
                              <Text style={styles.audienceChannelVal}>{aud.ytGain} <Text style={styles.audienceChannelPct}>{aud.ytPct}</Text></Text>
                            </View>
                            <View style={styles.audienceChannelTrackBg}>
                              <View style={[styles.audienceChannelTrackFill, { width: aud.ytPct as any, backgroundColor: '#FF0000' }]} />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Clean Insight Callout */}
                      <View style={styles.audienceInsightCallout}>
                        <Text style={styles.audienceInsightCalloutText}>
                          ⚡ <Text style={{ fontWeight: '800', color: '#7C3AED' }}>{graphTimeframe} Insight:</Text> {aud.insight}
                        </Text>
                      </View>
                    </View>
                  );
                } else {
                  const rch = curCfg.reachSummary;
                  return (
                    /* LUXURY CLEAN 30D GROWTH & REACH VIEW (TIMEFRAME DYNAMIC) */
                    <View style={styles.audienceCleanBottomContainer}>
                      {/* 2 Key Stats Duo */}
                      <View style={styles.audienceStatsDuoRow}>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel}>TOTAL REACH</Text>
                          <Text style={[styles.audienceStatDuoVal, { color: '#582CDB' }]}>{rch.total}</Text>
                          <Text style={styles.audienceStatDuoSub}>{rch.delta}</Text>
                        </View>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel}>ENGAGEMENT</Text>
                          <Text style={[styles.audienceStatDuoVal, { color: '#10B981' }]}>{rch.engagement}</Text>
                          <Text style={styles.audienceStatDuoSub}>{rch.retention}</Text>
                        </View>
                      </View>

                      {/* Channel Reach Share Breakdown */}
                      <View style={styles.audienceChannelsCard}>
                        <Text style={styles.audienceChannelsTitle}>REACH SHARE ({graphTimeframe})</Text>

                        {/* Instagram */}
                        <View style={styles.audienceChannelRow}>
                          <SocialBrandIcon platform="instagram" size={20} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.audienceChannelName}>Instagram · Reel</Text>
                              <Text style={styles.audienceChannelVal}>{rch.igReach} <Text style={styles.audienceChannelPct}>{rch.igPct}</Text></Text>
                            </View>
                            <View style={styles.audienceChannelTrackBg}>
                              <View style={[styles.audienceChannelTrackFill, { width: rch.igPct as any, backgroundColor: '#E1306C' }]} />
                            </View>
                          </View>
                        </View>

                        {/* TikTok */}
                        <View style={styles.audienceChannelRow}>
                          <SocialBrandIcon platform="tiktok" size={20} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.audienceChannelName}>TikTok</Text>
                              <Text style={styles.audienceChannelVal}>{rch.ttReach} <Text style={styles.audienceChannelPct}>{rch.ttPct}</Text></Text>
                            </View>
                            <View style={styles.audienceChannelTrackBg}>
                              <View style={[styles.audienceChannelTrackFill, { width: rch.ttPct as any, backgroundColor: '#000000' }]} />
                            </View>
                          </View>
                        </View>

                        {/* YouTube */}
                        <View style={styles.audienceChannelRow}>
                          <SocialBrandIcon platform="youtube" size={20} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.audienceChannelName}>YouTube · Short</Text>
                              <Text style={styles.audienceChannelVal}>{rch.ytReach} <Text style={styles.audienceChannelPct}>{rch.ytPct}</Text></Text>
                            </View>
                            <View style={styles.audienceChannelTrackBg}>
                              <View style={[styles.audienceChannelTrackFill, { width: rch.ytPct as any, backgroundColor: '#FF0000' }]} />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Clean Insight Callout */}
                      <View style={styles.audienceInsightCallout}>
                        <Text style={styles.audienceInsightCalloutText}>
                          ⚡ <Text style={{ fontWeight: '800', color: '#582CDB' }}>{graphTimeframe} Velocity:</Text> {rch.insight}
                        </Text>
                      </View>
                    </View>
                  );
                }
              })()}

              {/* Close / Action Button */}
              <Pressable
                style={[styles.modalFullBtn, { marginTop: 6 }]}
                onPress={() => setShowExpandedGraphModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close Expanded View</Text>
              </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: EXECUTIVE MONTHLY GROWTH REPORT & HIGHLIGHTS           */}
        {/* ============================================================ */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { maxHeight: '90%', padding: 20, transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={styles.liveGreenPulseDot} />
                      <Text style={styles.reportVerifiedBadge}>VERIFIED CREATOR AUDIT</Text>
                      <Text style={styles.reportDateBadge}>CURRENT 30D</Text>
                    </View>
                    <Text style={[styles.modalTitle, { fontSize: 17 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Executive Growth Report</Text>
                    <Text style={styles.modalSubtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Comprehensive multi-platform creator analytics &amp; momentum audit</Text>
                  </View>
                  <Pressable onPress={() => setShowReportModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                {/* 4-Grid Key Highlight Cards */}
                <View style={styles.reportVitalsGrid}>
                  <View style={styles.reportVitalCard}>
                    <Text style={styles.reportVitalLabel}>TOTAL 30D REACH</Text>
                    <Text style={[styles.reportVitalVal, { color: '#582CDB' }]}>131.0K</Text>
                    <Text style={styles.reportVitalDelta}>▲ +28.4% vs April</Text>
                  </View>
                  <View style={styles.reportVitalCard}>
                    <Text style={styles.reportVitalLabel}>NET AUDIENCE GAIN</Text>
                    <Text style={[styles.reportVitalVal, { color: '#10B981' }]}>+2,480</Text>
                    <Text style={styles.reportVitalDelta}>144.3K Total Followers</Text>
                  </View>
                  <View style={styles.reportVitalCard}>
                    <Text style={styles.reportVitalLabel}>ENGAGEMENT VOLUME</Text>
                    <Text style={styles.reportVitalVal}>18.0K</Text>
                    <Text style={styles.reportVitalDelta}>96.8% Tier-1 Quality</Text>
                  </View>
                  <View style={styles.reportVitalCard}>
                    <Text style={styles.reportVitalLabel}>CREATOR HEALTH SCORE</Text>
                    <Text style={[styles.reportVitalVal, { color: '#F59E0B' }]}>98 / 100</Text>
                    <Text style={styles.reportVitalDelta}>Top 1% Momentum</Text>
                  </View>
                </View>

                {/* MAIN THINGS THAT HAPPENED SECTION */}
                <Text style={styles.reportSectionHeading}>MAIN MILESTONES &amp; BREAKTHROUGHS</Text>

                <View style={{ gap: 10, marginBottom: 14 }}>
                  {/* Highlight 1: Viral Breakthrough */}
                  <View style={styles.reportHighlightItem}>
                    <View style={styles.reportHighlightIconCircle}>
                      <Text style={{ fontSize: 16 }}>🚀</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportHighlightTitle}>Top Viral Breakout Reel</Text>
                      <Text style={styles.reportHighlightDesc}>
                        <Text style={{ fontWeight: '700', color: '#171420' }}>"3 creator mistakes to avoid"</Text> hit 45.2K views and 924 saves with a top 1% hook retention rate (91%).
                      </Text>
                    </View>
                  </View>

                  {/* Highlight 2: Carousel Saves */}
                  <View style={styles.reportHighlightItem}>
                    <View style={[styles.reportHighlightIconCircle, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={{ fontSize: 16 }}>📑</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportHighlightTitle}>Carousel High-Intent Save Spike</Text>
                      <Text style={styles.reportHighlightDesc}>
                        Educational 7-slide Carousels outperformed static posts by 3.8x in bookmarks, converting +920 new dedicated subscribers.
                      </Text>
                    </View>
                  </View>

                  {/* Highlight 3: Peak Publishing Window */}
                  <View style={styles.reportHighlightItem}>
                    <View style={[styles.reportHighlightIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={{ fontSize: 16 }}>⚡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportHighlightTitle}>14-Day Consistency &amp; 7:30 PM Peak</Text>
                      <Text style={styles.reportHighlightDesc}>
                        Posting at exactly 7:30 PM triggered high algorithm distribution, resulting in 82% of all traffic coming from the Explore &amp; For You pages.
                      </Text>
                    </View>
                  </View>

                  {/* Highlight 4: Multi-Platform Synergy */}
                  <View style={styles.reportHighlightItem}>
                    <View style={[styles.reportHighlightIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={{ fontSize: 16 }}>🌐</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportHighlightTitle}>Multi-Platform Inbound Velocity</Text>
                      <Text style={styles.reportHighlightDesc}>
                        Active distribution across TikTok (40%), Instagram (36%), and YouTube (24%) generated 4x higher follower conversion velocity.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* AUDIENCE & BRAND READINESS CALLOUT */}
                <View style={styles.reportJarvisSummaryCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Image
                      source={require('../../assets/images/jarvis-core-flame.png')}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.reportJarvisTag}>JARVIS AUDIT VERDICT</Text>
                  </View>
                  <Text style={styles.reportJarvisText}>
                    You rank in the <Text style={{ fontWeight: '800', color: '#7C3AED' }}>Top 2.4% of creators in your niche</Text> this month. Your average watch time of 42s gives you maximum consistency and algorithmic reach across all channels.
                  </Text>
                </View>

                {/* DOWNLOAD REPORT BUTTON */}
                <Pressable
                  style={styles.modalDownloadSolidBtn}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setShowReportModal(false);
                    showToast('✓ Executive Growth PDF Report downloaded!');
                  }}
                >
                  <Text
                    style={styles.modalDownloadSolidBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    📥 Download PDF Report
                  </Text>
                </Pressable>

                {/* Close Button */}
                <Pressable
                  style={[styles.modalFullBtn, { marginTop: 8, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFECE6' }]}
                  onPress={() => setShowReportModal(false)}
                >
                  <Text style={[styles.modalFullBtnText, { color: '#64748B' }]}>Close</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: CONNECTED PLATFORMS (IDENTICAL TO PASSPORT / GROWTH)  */}
        {/* ============================================================ */}
        <Modal
          visible={showAddPlatformModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddPlatformModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { maxHeight: '88%', padding: 18, transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                    <Text style={styles.modalTitle}>Connected Platforms</Text>
                    <View style={styles.activePlatformsCountBadge}>
                      <Text style={styles.activePlatformsCountText}>
                        {platformsList.filter((p) => p.connected).length} Connected
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    Manage connected channels or add more platforms to sync your Analytics &amp; Growth.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAddPlatformModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ paddingBottom: 10 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSectionTitle}>ACTIVE CONNECTED PLATFORMS</Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.connectedPlatformRow}>
                        <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                          <SocialBrandIcon platform={plat.id} size={22} />
                        </View>
                        <View style={styles.platformMiddleCol}>
                          <View style={styles.platformNameRow}>
                            <Text style={styles.platformNameText} numberOfLines={1}>{plat.name}</Text>
                            <View style={styles.autoSyncBadge}>
                              <View style={styles.autoSyncDot} />
                              <Text style={styles.autoSyncText}>Auto-Sync</Text>
                            </View>
                          </View>
                          <Text
                            style={styles.platformSubText}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                          >
                            {plat.handle} · ⚡ {plat.followers}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.removePlatformBtn}
                          onPress={() => handleRemoveSinglePlatform(plat.id)}
                          hitSlop={6}
                        >
                          <Text style={styles.removePlatformBtnText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>

                <Text style={styles.modalSectionTitle}>
                  AVAILABLE PLATFORMS TO ADD ({platformsList.filter((p) => !p.connected).length})
                </Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => !p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.availablePlatformRow}>
                        <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                          <SocialBrandIcon platform={plat.id} size={22} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.platformNameText}>{plat.name}</Text>
                          <Text style={styles.platformSubText}>Sync verified reach &amp; growth</Text>
                        </View>
                        <Pressable
                          style={styles.addPlatformActionBtn}
                          onPress={() => handleConnectSinglePlatform(plat.id)}
                        >
                          <Text style={styles.addPlatformActionBtnText}>+ Connect</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>

                <View style={styles.customAddAccountBox}>
                  <Text style={styles.customAddTitle}>LINK CUSTOM ACCOUNT HANDLE</Text>
                  <Text style={styles.customAddSub}>
                    Select channel and enter your creator username:
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, marginVertical: 8 }}
                  >
                    {platformsList.map((p) => {
                      const isChosen = selectedPlatformToAdd === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          style={[
                            styles.platformSelectChip,
                            isChosen && styles.platformSelectChipActive,
                          ]}
                          onPress={() => setSelectedPlatformToAdd(p.id)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <SocialBrandIcon platform={p.id} size={14} />
                            <Text
                              style={[
                                styles.platformSelectChipText,
                                isChosen && styles.platformSelectChipTextActive,
                              ]}
                            >
                              {p.name.split(' ')[0]}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.customInputRow}>
                    <TextInput
                      value={customHandleInput}
                      onChangeText={setCustomHandleInput}
                      placeholder="@your_username"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.customTextInput}
                    />
                    <Pressable
                      style={styles.linkAccountConfirmBtn}
                      onPress={handleAddCustomPlatform}
                      hitSlop={6}
                    >
                      <Text style={styles.linkAccountConfirmBtnText} numberOfLines={1}>Link Account ➔</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => setShowAddPlatformModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Save &amp; Close ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: COMPREHENSIVE POST PERFORMANCE OVERVIEW               */}
        {/* ============================================================ */}
        <Modal
          visible={showPostDetailModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPostDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { maxHeight: '90%', padding: 20, transform: [{ scale: modalPopScale }] }]}>
              <ScrollView
                style={{ width: '100%' }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <SocialBrandIcon platform={selectedPost.platform} size={18} />
                      <View style={styles.activePlatformsCountBadge}>
                        <Text style={styles.activePlatformsCountText}>{selectedPost.format} AUDIT</Text>
                      </View>
                    </View>
                    <Text style={[styles.modalTitle, { fontSize: 16, lineHeight: 22 }]} numberOfLines={4}>
                      {selectedPost.title}
                    </Text>
                    <Text style={styles.modalSubtitle}>{selectedPost.date}</Text>
                  </View>
                  <Pressable onPress={() => setShowPostDetailModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                {/* 4-Grid Key Vitals */}
                <View style={styles.postDetailMetricsGrid}>
                  <View style={styles.postDetailMetricItem}>
                    <Text style={styles.postDetailMetricLabel}>TOTAL VIEWS</Text>
                    <Text style={styles.postDetailMetricVal}>👁️ {selectedPost.views}</Text>
                    <Text style={styles.postDetailMetricSub}>{selectedPost.reach} Reach</Text>
                  </View>
                  <View style={styles.postDetailMetricItem}>
                    <Text style={styles.postDetailMetricLabel}>NEW FOLLOWERS</Text>
                    <Text style={[styles.postDetailMetricVal, { color: '#582CDB' }]}>👤 {selectedPost.newFollowers}</Text>
                    <Text style={styles.postDetailMetricSub}>High conversion rate</Text>
                  </View>
                  <View style={styles.postDetailMetricItem}>
                    <Text style={styles.postDetailMetricLabel}>SAVES &amp; BOOKMARKS</Text>
                    <Text style={[styles.postDetailMetricVal, { color: '#10B981' }]}>💾 {selectedPost.saves}</Text>
                    <Text style={styles.postDetailMetricSub}>Top 1% of your posts</Text>
                  </View>
                  <View style={styles.postDetailMetricItem}>
                    <Text style={styles.postDetailMetricLabel}>SHARES</Text>
                    <Text style={styles.postDetailMetricVal}>🔁 {selectedPost.shares}</Text>
                    <Text style={styles.postDetailMetricSub}>{selectedPost.comments} comments</Text>
                  </View>
                </View>

                {/* RETENTION TIMELINE GRAPH */}
                <View style={styles.postRetentionCard}>
                  <View style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                      <Text style={styles.postRetentionTitle}>AUDIENCE RETENTION</Text>
                      <View style={styles.postRetentionBadge}>
                        <Text style={styles.postRetentionBadgeText}>
                          Hook: {selectedPost.hookRetention.split(' (')[0]}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.postRetentionSubText}>
                      🔥 Top {selectedPost.hookRetention.includes('Top ') ? selectedPost.hookRetention.split('Top ')[1].replace(')', '') : '1% of your posts'}
                    </Text>
                  </View>

                  <Svg width="100%" height={75} viewBox="0 0 340 75">
                    <Defs>
                      <SvgLinearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#582CDB" stopOpacity="0.3" />
                        <Stop offset="1" stopColor="#582CDB" stopOpacity="0.0" />
                      </SvgLinearGradient>
                    </Defs>
                    {/* Horizontal lines */}
                    <Path d="M0,15 L340,15" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                    <Path d="M0,45 L340,45" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                    <Path d="M0,65 L340,65" stroke="#E2E8F0" strokeWidth="1" />
                    {/* Area */}
                    <Path d="M0,10 C40,12 80,22 140,28 C200,32 260,38 340,42 L340,65 L0,65 Z" fill="url(#retGrad)" />
                    {/* Line */}
                    <Path d="M0,10 C40,12 80,22 140,28 C200,32 260,38 340,42" fill="none" stroke="#582CDB" strokeWidth="2.5" />
                    <Circle cx={0} cy={10} r={4} fill="#10B981" />
                    <Circle cx={340} cy={42} r={4} fill="#582CDB" />
                  </Svg>

                  {/* 3 Metric Columns with Full Words */}
                  <View style={styles.retentionMetricsGrid}>
                    <View style={styles.retentionMetricCell}>
                      <Text style={styles.retentionMetricLabel}>START</Text>
                      <Text style={styles.retentionMetricVal}>100%</Text>
                    </View>
                    <View style={styles.retentionMetricDivider} />
                    <View style={styles.retentionMetricCell}>
                      <Text style={styles.retentionMetricLabel}>AVG WATCH</Text>
                      <Text style={[styles.retentionMetricVal, { color: '#582CDB' }]}>
                        {selectedPost.avgWatchTime.split(' (')[0]}
                      </Text>
                      <Text style={styles.retentionMetricSub}>
                        {selectedPost.avgWatchTime.includes('(') ? selectedPost.avgWatchTime.split('(')[1].replace(')', '') : '84% viewed'}
                      </Text>
                    </View>
                    <View style={styles.retentionMetricDivider} />
                    <View style={styles.retentionMetricCell}>
                      <Text style={styles.retentionMetricLabel}>COMPLETION</Text>
                      <Text style={[styles.retentionMetricVal, { color: '#10B981' }]}>
                        {selectedPost.completionRate.split(' ')[0]}
                      </Text>
                      <Text style={styles.retentionMetricSub}>completed</Text>
                    </View>
                  </View>
                </View>

                {/* TRAFFIC SOURCE BREAKDOWN */}
                <View style={styles.trafficSourceCard}>
                  <Text style={styles.trafficSourceTitle}>TRAFFIC DISTRIBUTION</Text>

                  {/* Explore */}
                  <View style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                      <Text style={styles.trafficSourceName}>For You / Explore Algorithmic</Text>
                      <Text style={styles.trafficSourceVal}>{selectedPost.trafficExplore}</Text>
                    </View>
                    <View style={styles.trafficTrackBg}>
                      <View style={[styles.trafficTrackFill, { width: selectedPost.trafficExplore as any, backgroundColor: '#582CDB' }]} />
                    </View>
                  </View>

                  {/* Feed */}
                  <View style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                      <Text style={styles.trafficSourceName}>Existing Follower Feed</Text>
                      <Text style={styles.trafficSourceVal}>{selectedPost.trafficFeed}</Text>
                    </View>
                    <View style={styles.trafficTrackBg}>
                      <View style={[styles.trafficTrackFill, { width: selectedPost.trafficFeed as any, backgroundColor: '#7C3AED' }]} />
                    </View>
                  </View>

                  {/* Shares & Direct */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                      <Text style={styles.trafficSourceName}>Direct DMs &amp; External Shares</Text>
                      <Text style={styles.trafficSourceVal}>{selectedPost.trafficDirect}</Text>
                    </View>
                    <View style={styles.trafficTrackBg}>
                      <View style={[styles.trafficTrackFill, { width: selectedPost.trafficDirect as any, backgroundColor: '#F59E0B' }]} />
                    </View>
                  </View>
                </View>

                {/* JARVIS STRATEGIC AUDIT */}
                <View style={styles.postJarvisAuditCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Image
                      source={require('../../assets/images/jarvis-core-flame.png')}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.postJarvisAuditTag}>JARVIS RETENTION AUDIT</Text>
                  </View>
                  <Text style={styles.postJarvisAuditText}>{selectedPost.jarvisAudit}</Text>
                  <View style={styles.postRepurposeBox}>
                    <Text style={styles.postRepurposeText}>💡 <Text style={{ fontWeight: '800' }}>Repurpose Formula:</Text> {selectedPost.repurposeIdea}</Text>
                  </View>
                </View>

                {/* ACTION BUTTON: REPURPOSE / CLONE IN COMPOSER */}
                <Pressable
                  style={styles.modalRepurposeBtn}
                  onPress={() => {
                    setShowPostDetailModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer(selectedPost.title, selectedPost.platform === 'tiktok' ? 'TikTok' : selectedPost.platform === 'instagram' ? 'Instagram' : 'YouTube');
                    } else {
                      showToast(`Draft template copied for ${selectedPost.platform.toUpperCase()}!`);
                    }
                  }}
                >
                  <Text style={styles.modalRepurposeBtnText}>🪄 Repurpose &amp; Clone in Composer</Text>
                </Pressable>

                {/* Close Button */}
                <Pressable
                  style={[styles.modalFullBtn, { marginTop: 8, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFECE6' }]}
                  onPress={() => setShowPostDetailModal(false)}
                >
                  <Text style={[styles.modalFullBtnText, { color: '#64748B' }]}>Close Overview</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: 7:30 PM SLOT SET CONFIRMATION ANIMATION               */}
        {/* ============================================================ */}
        <Modal
          visible={showSlotSetModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSlotSetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], alignItems: 'center', padding: 24 }]}>
              <View style={styles.slotCheckCircleBig}>
                <Text style={{ fontSize: 28 }}>✓</Text>
              </View>

              <Text style={[styles.modalTitle, { fontSize: 19, textAlign: 'center', marginTop: 12 }]}>
                7:30 PM Slot Locked! 🗓️
              </Text>
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginTop: 4, marginHorizontal: 8 }]}>
                Your optimal engagement window for tomorrow is now booked and synced to your creator schedule.
              </Text>

              <View style={styles.slotConfirmedBadgeRow}>
                <View style={styles.liveGreenPulseDot} />
                <Text style={styles.slotConfirmedBadgeText}>SET &amp; SYNCED IN CALENDAR</Text>
              </View>

              <View style={{ width: '100%', gap: 10, marginTop: 16 }}>
                <Pressable
                  style={styles.modalRepurposeBtn}
                  onPress={() => {
                    setShowSlotSetModal(false);
                    if (onOpenSchedule) onOpenSchedule();
                  }}
                >
                  <Text style={styles.modalRepurposeBtnText}>🗓️ View Smart Schedule</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalFullBtn, { backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFECE6' }]}
                  onPress={() => setShowSlotSetModal(false)}
                >
                  <Text style={[styles.modalFullBtnText, { color: '#64748B' }]}>Done</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: PROTECT GROWTH MOMENTUM SAFEGUARDS                    */}
        {/* ============================================================ */}
        <Modal
          visible={showProtectMomentumModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProtectMomentumModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { maxHeight: '88%', padding: 20, transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={{ fontSize: 18 }}>🛡️</Text>
                      <Text style={styles.modalTitle}>Protect Growth Momentum</Text>
                    </View>
                    <Text style={styles.modalSubtitle}>
                      Configure autonomous safeguards to protect your streak &amp; algorithm reach
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowProtectMomentumModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                {/* Options List */}
                <View style={{ gap: 10, marginVertical: 14 }}>
                  {/* Option 1 */}
                  <Pressable
                    style={[styles.protectOptionCard, streakShieldActive && styles.protectOptionCardActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStreakShieldActive(!streakShieldActive);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Text style={{ fontSize: 20 }}>🛡️</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.protectOptionTitle}>Streak Autopilot Shield</Text>
                          <Text style={styles.protectOptionDesc}>
                            Auto-queues an emergency evergreen draft if unposted by 9:00 PM.
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.protectToggleCircle, streakShieldActive && styles.protectToggleCircleActive]}>
                        <Text style={styles.protectToggleText}>{streakShieldActive ? 'ON' : 'OFF'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Option 2 */}
                  <Pressable
                    style={[styles.protectOptionCard, bufferActive && styles.protectOptionCardActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setBufferActive(!bufferActive);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Text style={{ fontSize: 20 }}>⚡</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.protectOptionTitle}>Algorithmic Safety Buffer</Text>
                          <Text style={styles.protectOptionDesc}>
                            Maintains 3 pre-rendered drafts to prevent posting velocity drops.
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.protectToggleCircle, bufferActive && styles.protectToggleCircleActive]}>
                        <Text style={styles.protectToggleText}>{bufferActive ? 'ON' : 'OFF'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Option 3 */}
                  <Pressable
                    style={[styles.protectOptionCard, peakAlertsActive && styles.protectOptionCardActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPeakAlertsActive(!peakAlertsActive);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Text style={{ fontSize: 20 }}>🔔</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.protectOptionTitle}>Peak Window Push Reminders</Text>
                          <Text style={styles.protectOptionDesc}>
                            Sends 30-min priority notifications before optimal 7:30 PM slot.
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.protectToggleCircle, peakAlertsActive && styles.protectToggleCircleActive]}>
                        <Text style={styles.protectToggleText}>{peakAlertsActive ? 'ON' : 'OFF'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Option 4 */}
                  <Pressable
                    style={[styles.protectOptionCard, squadBoostActive && styles.protectOptionCardActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSquadBoostActive(!squadBoostActive);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Text style={{ fontSize: 20 }}>👥</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.protectOptionTitle}>Squad Engagement Alert</Text>
                          <Text style={styles.protectOptionDesc}>
                            Pings squad members to like &amp; comment in first 15 mins.
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.protectToggleCircle, squadBoostActive && styles.protectToggleCircleActive]}>
                        <Text style={styles.protectToggleText}>{squadBoostActive ? 'ON' : 'OFF'}</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>

                {/* Save Button */}
                <Pressable
                  style={styles.modalRepurposeBtn}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowProtectMomentumModal(false);
                    showToast('✓ Growth Momentum Safeguards updated & active!');
                  }}
                >
                  <Text style={styles.modalRepurposeBtnText}>Save &amp; Activate Safeguards</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => {
            if (onSaveProfile) onSaveProfile(updated);
          }}
        />

        {/* TOAST */}
        <BrandToast message={toastMessage} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF9FD',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF9FD',
  },
  headerLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
  },
  headerGhostLogo: {
    width: 26,
    height: 26,
  },
  proHeaderBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
  },
  proHeaderBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  headerIconBtnPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePhotoBtnPro: {
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  headerCustomAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  addPhotoPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  addPhotoPlusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 100,
  },

  // HERO TAGS & HEADLINE
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  growthProPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  growthProPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mainTitleText: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 4,
  },
  proAnalyticsActivePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 7,
  },
  proAnalyticsActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  mainSubtitleText: {
    fontSize: 13,
    color: '#5E576E',
    lineHeight: 17.5,
    marginBottom: 12,
  },

  // CARD 1: HERO ANALYTICS
  /* EXPANDED GRAPH MODAL STYLES */
  expandHintBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  expandHintBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  expandHintBadgePurple: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  expandHintBadgePurpleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  expandedGraphModalCard: {
    width: '95%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  liveGreenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 2,
  },
  graphTimeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  graphTimeframePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  graphTimeframePillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  graphTimeframeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  graphTimeframeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  graphActivePointCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    marginBottom: 10,
    width: '100%',
  },
  graphActivePointHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  graphActivePointTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    flexShrink: 1,
  },
  graphActivePointGainBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexShrink: 0,
  },
  graphActivePointGainBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  graphActivePointMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  graphActivePointMetricCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  graphActivePointCellLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
    textAlign: 'center',
  },
  graphActivePointCellVal: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  graphActivePointCellDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  graphActivePointTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  graphActivePointBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  graphActivePointDate: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  graphActivePointGainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  graphActivePointSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  graphActivePointHighlight: {
    fontWeight: '800',
    color: '#582CDB',
  },
  graphActivePointPeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollGraphHintRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scrollGraphHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  horizontalGraphViewport: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 12,
  },
  horizontalGraphScrollContent: {
    paddingRight: 30,
    paddingLeft: 10,
  },
  interactiveNodesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  interactiveGraphNode: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nodeCircleDotSelected: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nodeSelectedGlowRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  xAxisLabelsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  xAxisLabelText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  /* CLEAN AUDIENCE BOTTOM AREA STYLES */
  audienceCleanBottomContainer: {
    gap: 10,
    marginVertical: 4,
  },
  audienceStatsDuoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audienceStatDuoCard: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  audienceStatDuoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  audienceStatDuoVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  audienceStatDuoSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  audienceChannelsCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 10,
  },
  audienceChannelsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  audienceChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audienceChannelName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  audienceChannelVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  audienceChannelPct: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  audienceChannelTrackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  audienceChannelTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  audienceInsightCallout: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  audienceInsightCalloutText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#4B5563',
    fontWeight: '500',
  },

  modalWeeklyBreakdownGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  modalWeekCol: {
    alignItems: 'center',
    flex: 1,
  },
  modalWeekTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  modalWeekVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  modalWeekSub: {
    fontSize: 9,
    color: '#94A3B8',
  },
  modalPlatformContribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  modalPlatContribText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  heroAnalyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  growthThisMonthLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  bigGrowthPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
  },
  newFollowersPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 10,
  },
  newFollowersPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  svgChartContainer: {
    marginVertical: 6,
  },
  ghostChartOverlayPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  ghostChartOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  milestoneStarterBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  milestoneStarterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  heroStarterBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  starterMilestoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  starterMilestoneSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  starterActionBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gridMetricSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  metricsGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 10,
  },
  gridMetricItem: {
    width: '48%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
  },
  gridMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gridMetricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },

  // SECTION 2: PLATFORMS
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  platformSyncPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformSyncText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  platformsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  platformItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    flexShrink: 1,
    marginRight: 6,
  },
  platformGrowthPurple: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    flexShrink: 0,
  },
  platformTrackBg: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  platformTrackFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 2.5,
  },
  addPlatformOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addPlatformBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },

  // CARD 3: AUDIENCE GROWTH
  audienceGrowthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 20,
  },
  audienceGrowthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  audienceGrowthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  audienceTotalSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  audienceLast30dVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'right',
  },
  audienceLast30dLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  growthInsightCalloutBox: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  growthInsightText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },

  // CARD 4: CONTENT FORMAT
  contentFormatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 20,
  },
  contentFormatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 16,
  },
  barsGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    marginBottom: 14,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 72,
  },
  barVisualBlock: {
    width: '75%',
    maxWidth: 42,
    borderRadius: 8,
    marginBottom: 8,
  },
  ghostBarVisualBlock: {
    width: '75%',
    maxWidth: 42,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBarIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  formatInsightCallout: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
  },
  formatInsightText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
  },

  // SECTION 5: TOP POSTS ANALYSIS
  topPostsSectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
  },
  /* POST PERFORMANCE INTELLIGENCE MODAL STYLES */
  postDetailMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  postDetailMetricItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  postDetailMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  postDetailMetricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  postDetailMetricSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  postRetentionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 10,
  },
  postRetentionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.5,
  },
  postRetentionBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexShrink: 0,
  },
  postRetentionBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  postRetentionSubText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
    marginTop: 2,
  },
  retentionMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  retentionMetricCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  retentionMetricLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
    textAlign: 'center',
  },
  retentionMetricVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
  },
  retentionMetricSub: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  retentionMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  trafficSourceCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 10,
  },
  trafficSourceTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  trafficSourceName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  trafficSourceVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  trafficTrackBg: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  trafficTrackFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  postJarvisAuditCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 10,
  },
  postJarvisAuditTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  postJarvisAuditText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#4B5563',
    marginVertical: 4,
  },
  postRepurposeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  postRepurposeText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#582CDB',
  },
  modalRepurposeBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  modalRepurposeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* 7:30 PM & PROTECT MOMENTUM MODAL STYLES */
  slotCheckCircleBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotConfirmedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  slotConfirmedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  protectOptionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  protectOptionCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#582CDB',
  },
  protectOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  protectOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  protectToggleCircle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  protectToggleCircleActive: {
    backgroundColor: '#582CDB',
  },
  protectToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* EXECUTIVE MONTHLY REPORT MODAL STYLES */
  reportVerifiedBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  reportDateBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportVitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  reportVitalCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  reportVitalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  reportVitalVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  reportVitalDelta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  reportSectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  reportHighlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  reportHighlightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportHighlightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  reportHighlightDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  reportJarvisSummaryCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 14,
  },
  reportJarvisTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  reportJarvisText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#4B5563',
    marginTop: 2,
  },
  modalDownloadSolidBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  modalDownloadSolidBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  /* CREATOR EARNINGS HUB CARD */
  earningsHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  earningsHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsHubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  readinessTag: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    flexShrink: 0,
  },
  readinessTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7C3AED',
  },
  earningsHubSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  earningsHubIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  earningsHubStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  earningsHubStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningsHubStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
    textAlign: 'center',
  },
  earningsHubStatVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  earningsHubDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  earningsHubBtn: {
    height: 42,
    backgroundColor: '#582CDB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsHubBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  postAnalysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  starterPostIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterOutlineBtn: {
    borderWidth: 1.5,
    borderColor: '#582CDB',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  starterOutlineBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  postThumbnailImage: {
    width: '100%',
    height: 140,
  },
  postTypePill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postTypePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postTypePillGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postTypePillGrayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  postPlatformLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  postAnalysisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 19.5,
    marginVertical: 4,
  },
  postMetricsText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },

  // CARD 6: PEAK WINDOW
  peakWindowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 20,
  },
  peakWindowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 14,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  heatmapBlock: {
    flex: 1,
    height: 36,
    borderRadius: 8,
  },
  heatmapBlockGhost: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapDayLetterGhost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  peakTimeCallout: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    borderRadius: 12,
  },
  peakTimeHighlightText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  peakTimeSub: {
    fontSize: 11,
    color: '#6B21A8',
    marginTop: 1,
  },

  // CARD 7: JARVIS INTELLIGENCE
  jarvisIntelligenceCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  jarvisIntelligenceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  jarvisIntelligenceTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 12,
  },
  jarvisBadgesRow: {
    gap: 6,
    marginBottom: 14,
  },
  jarvisBadgeWhite: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  jarvisBadgeWhiteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  executeRecSolidBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  executeRecBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ROW 8: 2x2 TILES
  quickActionTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  quickActionTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
    justifyContent: 'center',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  tileArrowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tileTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 16,
  },

  // CARD 9: MONTHLY REPORT
  monthlyReportCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
  },
  reportIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthlyReportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  monthlyReportSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  generateReportSolidBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateReportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reportLockedStateBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportLockedStateText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  connectPlatformSmallBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 100,
    flexShrink: 0,
  },
  connectPlatformSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  connectedBadgePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    flexShrink: 0,
  },
  connectedBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // MODALS
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  /* CONNECTED PLATFORMS MODAL STYLES (MATCHING PASSPORT / GROWTH) */
  modalCardLarge: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
  activePlatformsCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activePlatformsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  connectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  platformIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  platformMiddleCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 4,
  },
  platformNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    rowGap: 2,
  },
  platformNameText: {
    fontSize: sFont(12.5),
    fontWeight: '800',
    color: '#171420',
  },
  autoSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    flexShrink: 0,
  },
  autoSyncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  autoSyncText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#15803D',
  },
  platformSubText: {
    fontSize: sFont(10),
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },
  removePlatformBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: '#FEE2E2',
    flexShrink: 0,
  },
  removePlatformBtnText: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#DC2626',
  },
  addPlatformActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#582CDB',
  },
  addPlatformActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customAddAccountBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginTop: 6,
    marginBottom: 10,
  },
  customAddTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  customAddSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  platformSelectChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  platformSelectChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  platformSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  platformSelectChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customTextInput: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: sFont(12),
    color: '#171420',
    fontWeight: '600',
  },
  linkAccountConfirmBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  linkAccountConfirmBtnText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalDoneBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  modalCloseCross: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '800',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  modalFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  reportSummaryLine: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
  },
  platformSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
  },
  platformSelectText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  platformSyncArrow: {
    fontSize: 14,
    color: '#582CDB',
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 20, 32, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  apiWindowNoticeBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  apiWindowNoticeText: {
    fontSize: 11,
    color: '#171420',
    fontWeight: '600',
    lineHeight: 15,
  },
  apiWindowNoticeSub: {
    fontSize: 10,
    color: '#6B21A8',
    marginTop: 3,
    lineHeight: 14,
  },
  connectedMicroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
});
