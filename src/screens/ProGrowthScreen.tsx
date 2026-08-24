import { SocialBrandIcon } from '../components/SocialBrandIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';

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
    followers: '14.2k',
    growthPct: '+12.4%',
    barWidth: '74%',
    connected: true,
    color: '#000000',
    bgTint: '#F1F5F9',
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    handle: '@pablocreates',
    followers: '25.6k',
    growthPct: '+8.1%',
    barWidth: '58%',
    connected: true,
    color: '#E1306C',
    bgTint: '#FDF2F8',
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    handle: '@pablofilms',
    followers: '22.4k',
    growthPct: '+4.2%',
    barWidth: '42%',
    connected: true,
    color: '#FF0000',
    bgTint: '#FEF2F2',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    handle: '@pablo_builds',
    followers: '5.8k',
    growthPct: '+6.5%',
    barWidth: '35%',
    connected: false,
    color: '#000000',
    bgTint: '#F8FAFC',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Articles',
    handle: 'pablo-creator',
    followers: '8.4k',
    growthPct: '+9.2%',
    barWidth: '45%',
    connected: false,
    color: '#0A66C2',
    bgTint: '#EFF6FF',
  },
  {
    id: 'threads',
    name: 'Threads',
    handle: '@pablocreates',
    followers: '3.6k',
    growthPct: '+5.1%',
    barWidth: '28%',
    connected: false,
    color: '#000000',
    bgTint: '#F8FAFC',
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
      shadowColor: '#CA8A04',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
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
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenAudienceBreakdown?: () => void;
  onOpenPostPerformance?: () => void;
  onOpenPlatformGrowth?: () => void;
  onOpenEarnings?: () => void;
  onOpenSchedule?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onSwitchToFree?: () => void;
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
// Mathematically calibrated to 131.0K Total 30D Reach & +2,480 Net Followers
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
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      const days = ['Mon, May 24', 'Tue, May 25', 'Wed, May 26', 'Thu, May 27', 'Fri, May 28', 'Sat, May 29', 'Sun, May 30'];
      if (type === 'growth30d') {
        const dailyReaches = [4.2, 4.6, 4.9, 5.1, 5.8, 6.4, 3.8];
        const dailyFollowers = [78, 84, 92, 98, 114, 128, 86];
        const yCoords = [135, 125, 110, 95, 65, 40, 30];
        return {
          date: days[i] || `Day ${i + 1}`,
          reach: `${dailyReaches[i]}K Daily Reach`,
          delta: `+${dailyFollowers[i]} Followers (34.8K 7D)`,
          yPos: yCoords[i],
        };
      } else {
        const audiences = [143640, 143724, 143816, 143914, 144028, 144156, 144320];
        const dailyGains = [78, 84, 92, 98, 114, 128, 86];
        const yCoords = [140, 125, 110, 90, 65, 45, 25];
        return {
          date: days[i] || `Day ${i + 1}`,
          reach: `${audiences[i].toLocaleString()} Total Audience`,
          delta: `+${dailyGains[i]} Today (▲ Surge)`,
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
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      if (type === 'growth30d') {
        const dailyReaches = [3.8, 3.9, 4.1, 4.4, 4.3, 4.6, 4.8, 5.0, 5.2, 5.4, 5.8, 6.2, 6.4, 4.5];
        const dailyFollowers = [68, 72, 75, 82, 80, 86, 92, 96, 102, 108, 116, 124, 132, 97];
        const yPos = 140 - (i / 13) * 105 + Math.sin(i * 0.8) * 6;
        return {
          date: `May ${i + 17}, 2024`,
          reach: `${dailyReaches[i] || 4.5}K Daily Reach`,
          delta: `+${dailyFollowers[i] || 85} Followers (68.4K 14D)`,
          yPos,
        };
      } else {
        const audienceVal = (142970 + i * 104).toLocaleString();
        const dailyGain = 68 + Math.floor(i * 4.8);
        const yPos = 145 - (i / 13) * 115 + Math.sin(i * 0.5) * 5;
        return {
          date: `May ${i + 17}, 2024`,
          reach: `${audienceVal} Total Audience`,
          delta: `+${dailyGain} Today (▲ Surge)`,
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
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      if (type === 'growth30d') {
        // Generates realistic daily reach averaging ~4.36k/day summing exactly to 131.0K
        const reachVal = (3.4 + Math.sin(i * 0.7) * 1.6 + (i / 29) * 1.8).toFixed(1);
        const followers = 55 + Math.floor(Math.sin(i * 0.7) * 18 + (i / 29) * 35);
        const yPos = 135 - (i / 29) * 80 + Math.sin(i * 0.7) * 16;
        return {
          date: `May ${i + 1}, 2024`,
          reach: `${reachVal}K Daily Reach`,
          delta: `+${followers} Followers (131.0K 30D)`,
          yPos,
        };
      } else {
        const audienceVal = (141840 + Math.floor(i * 85.5)).toLocaleString();
        const deltaVal = 55 + Math.floor(Math.sin(i * 0.7) * 18 + (i / 29) * 35);
        const yPos = 145 - (i / 29) * 115 + Math.sin(i * 0.5) * 5;
        return {
          date: `May ${i + 1}, 2024`,
          reach: `${audienceVal} Total Audience`,
          delta: `+${deltaVal} Today (▲ Surge)`,
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
    getPoint: (i: number, type: 'growth30d' | 'audience') => {
      const weeks = ['Mar W1', 'Mar W2', 'Mar W3', 'Mar W4', 'Apr W1', 'Apr W2', 'Apr W3', 'Apr W4', 'May W1', 'May W2', 'May W3', 'May W4'];
      if (type === 'growth30d') {
        const weeklyReaches = [22.4, 24.8, 25.1, 26.1, 31.4, 34.2, 35.8, 37.2, 31.2, 33.6, 36.8, 29.4];
        const weeklyFollowers = [410, 440, 470, 500, 590, 630, 650, 670, 580, 620, 680, 600];
        const yPos = 150 - (i / 11) * 115;
        return {
          date: `Quarterly ${weeks[i] || `Week ${i + 1}`}`,
          reach: `${weeklyReaches[i]}K Weekly Reach`,
          delta: `+${weeklyFollowers[i]} Followers (368K 90D)`,
          yPos,
        };
      } else {
        const audiences = [137480, 137920, 138390, 138890, 139480, 140110, 140760, 141430, 142010, 142630, 143310, 144320];
        const deltas = [410, 440, 470, 500, 590, 630, 650, 670, 580, 620, 680, 600];
        const yPos = 155 - (i / 11) * 125;
        return {
          date: `Quarterly ${weeks[i] || `Week ${i + 1}`}`,
          reach: `${audiences[i].toLocaleString()} Total Audience`,
          delta: `+${deltas[i]} Followers This Week`,
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
  onOpenMessages,
  onOpenJarvisPro,
  onOpenAudienceBreakdown,
  onOpenPostPerformance,
  onOpenPlatformGrowth,
  onOpenEarnings,
  onOpenSchedule,
  onOpenPostComposer,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [platformsList, setPlatformsList] = useState<GrowthPlatformAccount[]>(INITIAL_GROWTH_PLATFORMS);
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState<string>('x');
  const [customHandleInput, setCustomHandleInput] = useState<string>('');
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [selectedPostTitle, setSelectedPostTitle] = useState('3 creator mistakes to avoid...');
  const [showExpandedGraphModal, setShowExpandedGraphModal] = useState(false);
  const [expandedGraphType, setExpandedGraphType] = useState<'growth30d' | 'audience'>('growth30d');
  const [selectedGraphDayIndex, setSelectedGraphDayIndex] = useState(29);
  const [graphTimeframe, setGraphTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Platform Connect/Disconnect Handlers
  const handleConnectSinglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: true } : p))
    );
    const target = platformsList.find((p) => p.id === id);
    showToast(`✓ ${target?.name || 'Platform'} connected & auto-synced!`);
  };

  const handleRemoveSinglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false } : p))
    );
    const target = platformsList.find((p) => p.id === id);
    showToast(`Removed ${target?.name || 'Platform'}`);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR                                            */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          {/* Top-Left: Mascot + Mode Switcher */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                {
                  transform: [
                    { translateY: ghostFloatY },
                    { scale: ghostScale },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                if (onSwitchToFree) {
                  onSwitchToFree();
                } else if (onSaveProfile && userProfile) {
                  onSaveProfile({ ...userProfile, tier: 'free' });
                }
              }}
              hitSlop={8}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proHeaderBadge}
              >
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Right Action Icons: Messages, Notification Bell & Profile Avatar */}
          <View style={styles.headerRightGroup}>
            {/* Chat Messages */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                }
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#1A1626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

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
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerCustomAvatarImage}
                resizeMode="cover"
              />
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
              <Text style={styles.growthProPillText}>GROWTH — PRO</Text>
            </View>
          </View>

          <Text style={styles.mainTitleText}>See your growth in full.</Text>
          <View style={styles.proAnalyticsActivePill}>
            <Text style={styles.proAnalyticsActiveText}>✨ Pro Analytics Active</Text>
          </View>

          <Text style={styles.mainSubtitleText}>
            Track advanced growth, platform performance, audience trends and content insights in one place.
          </Text>

          {/* ============================================================ */}
          {/* CARD 1: GROWTH THIS 30D (Hero Analytics Card with Wave Graph)*/}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.heroAnalyticsCard, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedGraphType('growth30d');
              triggerModalPop();
              setShowExpandedGraphModal(true);
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.growthThisMonthLabel}>GROWTH THIS 30D</Text>
              <View style={styles.expandHintBadge}>
                <Text style={styles.expandHintBadgeText}>Tap to Expand 🔍</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
              <Text style={styles.bigGrowthPercent}>+28.4%</Text>
              <Text style={{ fontSize: 22, color: '#582CDB', fontWeight: '900' }}>↗</Text>
            </View>

            <View style={styles.newFollowersPill}>
              <Text style={styles.newFollowersPillText}>+2.1K NEW FOLLOWERS</Text>
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

            {/* 2x2 METRICS GRID */}
            <View style={styles.metricsGrid2x2}>
              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>REACH</Text>
                <Text style={styles.gridMetricVal}>131.0K</Text>
              </View>

              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>ENGAGEMENT</Text>
                <Text style={styles.gridMetricVal}>18.0K</Text>
              </View>

              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>FOLLOWERS</Text>
                <Text style={[styles.gridMetricVal, { color: '#582CDB' }]}>+2,480</Text>
              </View>

              <View style={styles.gridMetricItem}>
                <Text style={styles.gridMetricLabel}>AVG. RETENTION</Text>
                <Text style={styles.gridMetricVal}>0:42s</Text>
              </View>
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* SECTION 2: PLATFORMS                                         */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.platformsSectionTitle}>Platforms</Text>
            <View style={styles.platformSyncPill}>
              <Text style={styles.platformSyncText}>⚡ PLATFORM SYNC</Text>
            </View>
          </View>

          <View style={styles.platformsContainerCard}>
            {platformsList
              .filter((p) => p.connected)
              .map((plat) => (
                <View key={plat.id} style={styles.platformItemRow}>
                  <SocialBrandIcon platform={plat.id} size={28} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.platformName}>{plat.name}</Text>
                      <Text style={styles.platformGrowthPurple}>
                        {plat.growthPct}{' '}
                        <Text style={{ color: '#64748B', fontSize: 11 }}>{plat.followers}</Text>
                      </Text>
                    </View>
                    <View style={styles.platformTrackBg}>
                      <View style={[styles.platformTrackFill, { width: plat.barWidth as any }]} />
                    </View>
                  </View>
                </View>
              ))}

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
          {/* CARD 3: AUDIENCE GROWTH                                      */}
          {/* ============================================================ */}
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
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.audienceGrowthTitle}>Audience Growth</Text>
                  <View style={styles.expandHintBadgePurple}>
                    <Text style={styles.expandHintBadgePurpleText}>Live Graph 🔍</Text>
                  </View>
                </View>
                <Text style={styles.audienceTotalSub}>144,320 TOTAL AUDIENCE</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
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
                <Circle cx={340} cy={35} r={4} fill="#EAB308" />
              </Svg>
            </View>

            <View style={styles.growthInsightCalloutBox}>
              <Text style={styles.growthInsightText}>
                Your audience growth spiked 3x during morning short-form posting windows.
              </Text>
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* CARD 4: CONTENT FORMAT PERFORMANCE                           */}
          {/* ============================================================ */}
          <View style={styles.contentFormatCard}>
            <Text style={styles.contentFormatTitle}>Content Format Performance</Text>

            {/* 4-Column Bar Chart */}
            <View style={styles.barsGroupRow}>
              {/* Col 1 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: 60, backgroundColor: '#DDD6FE' }]} />
                <Text style={styles.barLabelText}>REELS</Text>
              </View>

              {/* Col 2 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: 95, backgroundColor: '#582CDB' }]} />
                <Text style={[styles.barLabelText, { color: '#582CDB', fontWeight: '900' }]}>CAROUSEL</Text>
              </View>

              {/* Col 3 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: 48, backgroundColor: '#C4B5FD' }]} />
                <Text style={styles.barLabelText}>TEXT / X</Text>
              </View>

              {/* Col 4 */}
              <View style={styles.barColumn}>
                <View style={[styles.barVisualBlock, { height: 32, backgroundColor: '#EDE9FE' }]} />
                <Text style={styles.barLabelText}>SHORTS</Text>
              </View>
            </View>

            <View style={styles.formatInsightCallout}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 13 }}>🛡️</Text>
                <Text style={styles.formatInsightText}>
                  Your talk-to-camera storytelling Reels generate 32% higher retention than music-only Reels.
                </Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 5: TOP POSTS ANALYSIS                                */}
          {/* ============================================================ */}
          <Text style={styles.topPostsSectionHeader}>Top Posts Analysis</Text>

          <View style={{ gap: 12, marginBottom: 20 }}>
            {/* Post 1 */}
            <Pressable
              style={({ pressed }) => [styles.postAnalysisCard, pressed && styles.btnPressed]}
              onPress={() => {
                setSelectedPostTitle('3 creator mistakes to avoid...');
                triggerModalPop();
                setShowPostDetailModal(true);
              }}
            >
              <Image
                source={require('../../assets/images/elena-avatar.jpg')}
                style={styles.postThumbnailImage}
                resizeMode="cover"
              />
              <View style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={styles.postTypePill}>
                    <Text style={styles.postTypePillText}>REEL</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <SocialBrandIcon platform="tiktok" size={14} />
                    <Text style={styles.postPlatformLabel}>TIKTOK</Text>
                  </View>
                </View>

                <Text style={styles.postAnalysisTitle}>3 creator mistakes to avoid...</Text>
                <Text style={styles.postMetricsText}>👁️ 45.2K views • 💬 318 comments</Text>
              </View>
            </Pressable>

            {/* Post 2 */}
            <Pressable
              style={({ pressed }) => [styles.postAnalysisCard, pressed && styles.btnPressed]}
              onPress={() => {
                setSelectedPostTitle('Daily planning workflow...');
                triggerModalPop();
                setShowPostDetailModal(true);
              }}
            >
              <Image
                source={require('../../assets/images/david-avatar.jpg')}
                style={styles.postThumbnailImage}
                resizeMode="cover"
              />
              <View style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={styles.postTypePillGray}>
                    <Text style={styles.postTypePillGrayText}>CAROUSEL</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <SocialBrandIcon platform="instagram" size={14} />
                    <Text style={styles.postPlatformLabel}>INSTAGRAM</Text>
                  </View>
                </View>

                <Text style={styles.postAnalysisTitle}>Daily planning workflow...</Text>
                <Text style={styles.postMetricsText}>👁️ 18.4K views • 💬 142 comments</Text>
              </View>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 6: PEAK AUDIENCE WINDOW                                 */}
          {/* ============================================================ */}
          <View style={styles.peakWindowCard}>
            <Text style={styles.peakWindowTitle}>Peak Audience Window</Text>

            {/* 7 Heatmap day blocks */}
            <View style={styles.heatmapRow}>
              {['#F1F5F9', '#DDD6FE', '#A78BFA', '#8B5CF6', '#CA8A04', '#C4B5FD', '#F1F5F9'].map((bg, idx) => (
                <View key={idx} style={[styles.heatmapBlock, { backgroundColor: bg }]} />
              ))}
            </View>

            <View style={styles.peakTimeCallout}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>⏱️</Text>
                <View>
                  <Text style={styles.peakTimeHighlightText}>Tue &amp; Thu, 7:30 PM</Text>
                  <Text style={styles.peakTimeSub}>Optimal window this week.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 7: JARVIS INTELLIGENCE                                  */}
          {/* ============================================================ */}
          <View style={styles.jarvisIntelligenceCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.jarvisIntelligenceTag}>JARVIS INTELLIGENCE</Text>
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.jarvisIntelligenceTitle}>
              Scale your storytelling content by 25% this week.
            </Text>

            <View style={styles.jarvisBadgesRow}>
              <View style={styles.jarvisBadgeWhite}>
                <Text style={styles.jarvisBadgeWhiteText}>🏷️ Focus: Reel Retention</Text>
              </View>
              <View style={styles.jarvisBadgeWhite}>
                <Text style={styles.jarvisBadgeWhiteText}>⚡ Publish: 7:30 PM</Text>
              </View>
              <View style={styles.jarvisBadgeWhite}>
                <Text style={styles.jarvisBadgeWhiteText}>🔗 Audience Goal: 150K</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.executeRecSolidBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenPostComposer) onOpenPostComposer('Storytelling breakdown: 3 mistakes I stopped making', 'TikTok');
                else showToast('Applying optimal 7:30 PM storytelling preset to draft!');
              }}
            >
              <Text style={styles.executeRecBtnText}>Execute Recommendations</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* ROW 8: 2x2 QUICK ACTION TILES                                */}
          {/* ============================================================ */}
          <View style={styles.quickActionTilesGrid}>
            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => showToast('Preset loaded: 45s Short Reel format')}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>🔄</Text>
              <Text style={styles.tileTitleText}>Repeat best format{'\n'}(Short Reel)</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenSchedule) onOpenSchedule();
                else showToast('7:30 PM slot booked in Smart Schedule!');
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>🗓️</Text>
              <Text style={styles.tileTitleText}>Set 7:30 PM slot in{'\n'}calendar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => showToast('Streak Autopilot Shield & Momentum Guard Active!')}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>📊</Text>
              <Text style={styles.tileTitleText}>Protect growth{'\n'}momentum</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.quickActionTile, pressed && styles.btnPressed]}
              onPress={() => {
                if (onNavigateTab) onNavigateTab('create');
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>🪄</Text>
              <Text style={styles.tileTitleText}>Generate AI script</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 9: MONTHLY REPORT BANNER                                */}
          {/* ============================================================ */}
          <View style={[styles.monthlyReportCard, { marginBottom: 120 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={styles.reportIconSquare}>
                <Text style={{ fontSize: 20 }}>📑</Text>
              </View>
              <View>
                <Text style={styles.monthlyReportTitle}>Monthly Report</Text>
                <Text style={styles.monthlyReportSub}>May 01–2024 • PDF Export</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.generateReportSolidBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowReportModal(true);
              }}
            >
              <Text style={styles.generateReportBtnText}>Generate Report</Text>
            </Pressable>
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
                contentContainerStyle={{ paddingBottom: 10 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={styles.liveGreenPulseDot} />
                    <Text style={styles.modalTitle}>
                      {expandedGraphType === 'growth30d' ? '30-Day Growth Velocity & Reach' : '144.3K Total Audience Surge'}
                    </Text>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    {expandedGraphType === 'growth30d'
                      ? 'Live multi-point analytics stream • May 2024'
                      : 'Cross-platform audience expansion & subscriber velocity'}
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
                const curCfg = TIMEFRAME_CONFIGS[graphTimeframe] || TIMEFRAME_CONFIGS['30D'];
                const safeIdx = Math.min(selectedGraphDayIndex, curCfg.daysCount - 1);
                const activePt = curCfg.getPoint(safeIdx, expandedGraphType);

                return (
                  <View style={styles.graphActivePointCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.graphActivePointDate} numberOfLines={1} ellipsizeMode="tail">
                          📅 {activePt.date}
                        </Text>
                        <Text style={styles.graphActivePointSub} numberOfLines={1} ellipsizeMode="tail">
                          {expandedGraphType === 'growth30d' ? 'Daily Velocity & Reach' : 'Audience Growth Trend'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                        <Text style={styles.graphActivePointValue} numberOfLines={1}>
                          {activePt.reach}
                        </Text>
                        <Text style={styles.graphActivePointDelta} numberOfLines={1}>
                          {activePt.delta}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Scroll Instruction Hint */}
              <View style={styles.scrollGraphHintRow}>
                <Text style={styles.scrollGraphHintText}>
                  ↔ Swipe {graphTimeframe} graph horizontally to inspect all {TIMEFRAME_CONFIGS[graphTimeframe]?.daysCount || 30} live data points
                </Text>
              </View>

              {/* HORIZONTAL SCROLLABLE LIVE GRAPH */}
              {(() => {
                const curCfg = TIMEFRAME_CONFIGS[graphTimeframe] || TIMEFRAME_CONFIGS['30D'];
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
                          {curCfg.labels.map((lbl, lIdx) => (
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

              {/* Bottom Milestone Breakdown Grid */}
              {(() => {
                const curCfg = TIMEFRAME_CONFIGS[graphTimeframe] || TIMEFRAME_CONFIGS['30D'];
                return (
                  <View style={styles.modalWeeklyBreakdownGrid}>
                    {curCfg.weeklyMetrics.map((wm, wIdx) => (
                      <View key={wIdx} style={styles.modalWeekCol}>
                        <Text style={styles.modalWeekTitle}>{wm.title}</Text>
                        <Text style={[styles.modalWeekVal, wm.isPeak && { color: '#582CDB' }]}>{wm.val}</Text>
                        <Text style={styles.modalWeekSub}>{wm.sub}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}

              {/* Platform Contribution Bar */}
              <View style={styles.modalPlatformContribRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <SocialBrandIcon platform="tiktok" size={16} />
                  <Text style={styles.modalPlatContribText}>TikTok +840 (34%)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <SocialBrandIcon platform="instagram" size={16} />
                  <Text style={styles.modalPlatContribText}>IG +920 (37%)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <SocialBrandIcon platform="youtube" size={16} />
                  <Text style={styles.modalPlatContribText}>YT +720 (29%)</Text>
                </View>
              </View>

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
        {/* MODAL: MONTHLY REPORT EXPORT                                 */}
        {/* ============================================================ */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>May 2024 Growth Audit</Text>
                  <Text style={styles.modalSubtitle}>Exporting Verified Pro PDF</Text>
                </View>
                <Pressable onPress={() => setShowReportModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                <Text style={styles.reportSummaryLine}>• Overall Follower Growth: +28.4% (+2,480 new)</Text>
                <Text style={styles.reportSummaryLine}>• Total Reach: 131,000 across 3 connected platforms</Text>
                <Text style={styles.reportSummaryLine}>• Top Converting Format: Talking Storytelling Reels</Text>
                <Text style={styles.reportSummaryLine}>• Sponsorship Readiness: Tier-1 Verified (92%)</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowReportModal(false);
                  showToast('Monthly PDF report saved and ready for download!');
                }}
              >
                <Text style={styles.modalFullBtnText}>Download PDF Export 📥</Text>
              </Pressable>
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
            <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                style={{ maxHeight: Dimensions.get('window').height * 0.58 }}
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
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.platformNameText}>{plat.name}</Text>
                            <View style={styles.autoSyncBadge}>
                              <Text style={styles.autoSyncText}>🟢 Auto-Sync</Text>
                            </View>
                          </View>
                          <Text style={styles.platformSubText}>
                            {plat.handle} • ⚡ {plat.followers}
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
                    >
                      <Text style={styles.linkAccountConfirmBtnText}>Link Account ➔</Text>
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
        {/* MODAL: POST DEEP DIVE                                        */}
        {/* ============================================================ */}
        <Modal
          visible={showPostDetailModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPostDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Post Retention Breakdown</Text>
                  <Text style={styles.modalSubtitle}>{selectedPostTitle}</Text>
                </View>
                <Pressable onPress={() => setShowPostDetailModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                <Text style={styles.reportSummaryLine}>• Hook Retention (0-3s): 91% (Top 1% Benchmark)</Text>
                <Text style={styles.reportSummaryLine}>• Full Watch Completion: 68%</Text>
                <Text style={styles.reportSummaryLine}>• Shares &amp; Saves: 412 shares • 620 saves</Text>
                <Text style={styles.reportSummaryLine}>• Traffic Source: 82% For You / Explore page</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowPostDetailModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
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
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerGhostLogo: {
    width: 28,
    height: 28,
  },
  proHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  proHeaderBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePhotoBtnPro: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  headerCustomAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  addPhotoPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  addPhotoPlusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // HERO TAGS & HEADLINE
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  growthProPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  growthProPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  proAnalyticsActivePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  proAnalyticsActiveText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
  },
  mainSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
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
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7C3AED',
  },
  expandedGraphModalCard: {
    width: '92%',
    maxWidth: 480,
    maxHeight: '88%',
    padding: 18,
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
    borderColor: '#E2E8F0',
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
    fontWeight: '900',
  },
  graphActivePointCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    marginBottom: 8,
    width: '100%',
  },
  graphActivePointDate: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  graphActivePointSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  graphActivePointValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#582CDB',
  },
  graphActivePointDelta: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  scrollGraphHintRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scrollGraphHintText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  horizontalGraphViewport: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
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
    fontSize: 11.5,
    fontWeight: '900',
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
    fontSize: 10.5,
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
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  bigGrowthPercent: {
    fontSize: 32,
    fontWeight: '900',
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  svgChartContainer: {
    marginVertical: 6,
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
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gridMetricVal: {
    fontSize: 16,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#92400E',
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
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  platformGrowthPurple: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
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
    borderColor: '#E2E8F0',
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
    padding: 18,
    marginBottom: 20,
  },
  audienceGrowthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  audienceGrowthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  audienceTotalSub: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  audienceLast30dVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#582CDB',
    textAlign: 'right',
  },
  audienceLast30dLabel: {
    fontSize: 8.5,
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
    fontSize: 11.5,
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
    fontWeight: '900',
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
    width: 60,
  },
  barVisualBlock: {
    width: 42,
    borderRadius: 8,
    marginBottom: 8,
  },
  barLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  formatInsightCallout: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
  },
  formatInsightText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
  },

  // SECTION 5: TOP POSTS ANALYSIS
  topPostsSectionHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
  },
  postAnalysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
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
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  postTypePillGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postTypePillGrayText: {
    fontSize: 8.5,
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
    fontWeight: '900',
    color: '#171420',
    marginVertical: 4,
  },
  postMetricsText: {
    fontSize: 11,
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
    fontWeight: '900',
    color: '#171420',
    marginBottom: 14,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heatmapBlock: {
    width: 38,
    height: 38,
    borderRadius: 8,
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
    fontWeight: '900',
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  jarvisIntelligenceTitle: {
    fontSize: 16.5,
    fontWeight: '900',
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
    fontSize: 13.5,
    fontWeight: '900',
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
  tileTitleText: {
    fontSize: 11.5,
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
    fontWeight: '900',
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
    fontWeight: '900',
  },

  // MODALS
  btnPressed: {
    opacity: 0.85,
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
    shadowOpacity: 0.3,
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  modalSectionTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  connectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    gap: 10,
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    gap: 10,
  },
  platformIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  autoSyncBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  autoSyncText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803D',
  },
  platformSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  removePlatformBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  removePlatformBtnText: {
    fontSize: 10,
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
    fontWeight: '900',
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
    fontSize: 9.5,
    fontWeight: '900',
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
    borderColor: '#E2E8F0',
  },
  platformSelectChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  platformSelectChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  platformSelectChipTextActive: {
    color: '#582CDB',
    fontWeight: '900',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  customTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '600',
  },
  linkAccountConfirmBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkAccountConfirmBtnText: {
    fontSize: 11,
    fontWeight: '900',
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
    fontSize: 13.5,
    fontWeight: '900',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
