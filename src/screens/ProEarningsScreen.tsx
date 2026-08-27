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
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { sFont, isNarrowScreen } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProEarningsScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: (threadId?: string) => void;
  onOpenSchedule?: () => void;
  onOpenQuests?: () => void;
  onOpenReadiness?: () => void;
  onOpenCreatorPassport?: () => void;
  onOpenPlatforms?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

const INCOME_SOURCES: IncomeSource[] = [
  { id: 'brand', name: 'Brand Deals', amount: 1200, percentage: 49, color: '#F59E0B' },
  { id: 'collab', name: 'Collaborations', amount: 540, percentage: 22, color: '#582CDB' },
  { id: 'affiliate', name: 'Affiliate Revenue', amount: 320, percentage: 13, color: '#A78BFA' },
  { id: 'ugc', name: 'UGC Content', amount: 390, percentage: 16, color: '#7C3AED' },
];

interface PlatformEarning {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'x';
  name: string;
  badgeText: string;
  badgeType: 'purple' | 'gold' | 'gray' | 'red';
  progress: number;
  amount: number;
}


// DYNAMIC EARNINGS TIMEFRAME CONFIGURATIONS (7D, 14D, 30D, 90D)
// Mathematically calibrated to $2,450 Current Month Net Rate
const EARNINGS_TIMEFRAME_CONFIGS = {
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
    netRateSummary: {
      total: '$620',
      delta: '+$180 (▲ +40.9%)',
      gross: '$660',
      margin: '94.0% Take-home',
      dailyAvg: '$88.50/day',
      topDay: 'Fri, May 28 ($220 Brand Sprint)',
      insight: 'Weekend sponsored storytelling Reels generated 65% of your 7-day net revenue.',
    },
    sourcesSummary: [
      { name: 'Brand Deals', icon: '💼', amount: '$310', pct: '50%', color: '#F59E0B', avgDeal: '$310 / deal', clients: '2 Brands' },
      { name: 'Collaborations', icon: '🤝', amount: '$140', pct: '23%', color: '#582CDB', avgDeal: '$140 / split', clients: '1 Squad Collab' },
      { name: 'Affiliates', icon: '🔗', amount: '$80', pct: '13%', color: '#A78BFA', avgDeal: '$8.00 / conv', clients: '10 Clicks' },
      { name: 'UGC Content', icon: '📱', amount: '$90', pct: '14%', color: '#7C3AED', avgDeal: '$90 / asset', clients: '1 Video Deliverable' },
    ],
    platformSummary: [
      { name: 'TikTok', icon: 'tiktok', amount: '$240', pct: '39%', rpm: '$4.10 RPM', deals: '2 Campaigns', color: '#000000' },
      { name: 'Instagram', icon: 'instagram', amount: '$210', pct: '34%', rpm: '$8.80 RPM', deals: '1 Story + Reel', color: '#E1306C' },
      { name: 'YouTube Shorts', icon: 'youtube', amount: '$110', pct: '18%', rpm: '$3.70 RPM', deals: 'Ad Share', color: '#FF0000' },
      { name: 'X / Twitter', icon: 'x', amount: '$60', pct: '9%', rpm: '$6.20 RPM', deals: 'Sponsored Thread', color: '#171420' },
    ],
    monthlyForecast: {
      annualRunRate: '$32,240',
      pacing: '112% of Monthly Target',
      forecastJun: '$3,100',
    },
    getPoint: (i: number) => {
      const days = ['Mon, May 24', 'Tue, May 25', 'Wed, May 26', 'Thu, May 27', 'Fri, May 28', 'Sat, May 29', 'Sun, May 30'];
      const dailyEarns = [60, 75, 80, 95, 220, 50, 40];
      const yCoords = [130, 115, 110, 90, 30, 140, 150];
      return {
        date: days[i] || `Day ${i + 1}`,
        amount: `$${dailyEarns[i]} Net Earned`,
        sub: `Day ${i + 1} payout volume ($620 7D Total)`,
        yPos: yCoords[i],
      };
    },
    svgPath: 'M0,130 C80,115 160,110 240,90 C300,50 360,25 460,40',
    areaPath: 'M0,130 C80,115 160,110 240,90 C300,50 360,25 460,40 L460,170 L0,170 Z',
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
    netRateSummary: {
      total: '$1,180',
      delta: '+$340 (▲ +40.5%)',
      gross: '$1,250',
      margin: '94.4% Take-home',
      dailyAvg: '$84.20/day',
      topDay: 'Wed, May 19 ($350 Campaign)',
      insight: 'Sponsorship sprint across TikTok and Instagram generated 2 repeat brand contract renewals.',
    },
    sourcesSummary: [
      { name: 'Brand Deals', icon: '💼', amount: '$590', pct: '50%', color: '#F59E0B', avgDeal: '$295 / deal', clients: '2 Brands' },
      { name: 'Collaborations', icon: '🤝', amount: '$260', pct: '22%', color: '#582CDB', avgDeal: '$130 / split', clients: '2 Squad Collabs' },
      { name: 'Affiliates', icon: '🔗', amount: '$150', pct: '13%', color: '#A78BFA', avgDeal: '$7.50 / conv', clients: '20 Clicks' },
      { name: 'UGC Content', icon: '📱', amount: '$180', pct: '15%', color: '#7C3AED', avgDeal: '$90 / asset', clients: '2 Video Deliverables' },
    ],
    platformSummary: [
      { name: 'TikTok', icon: 'tiktok', amount: '$450', pct: '38%', rpm: '$4.15 RPM', deals: '3 Campaigns', color: '#000000' },
      { name: 'Instagram', icon: 'instagram', amount: '$410', pct: '35%', rpm: '$8.90 RPM', deals: '3 Deliverables', color: '#E1306C' },
      { name: 'YouTube Shorts', icon: 'youtube', amount: '$210', pct: '18%', rpm: '$3.75 RPM', deals: 'Ad Share', color: '#FF0000' },
      { name: 'X / Twitter', icon: 'x', amount: '$110', pct: '9%', rpm: '$6.30 RPM', deals: 'Sponsored Threads', color: '#171420' },
    ],
    monthlyForecast: {
      annualRunRate: '$30,680',
      pacing: '108% of Monthly Target',
      forecastJun: '$3,150',
    },
    getPoint: (i: number) => {
      const dailyEarns = [60, 80, 350, 70, 65, 85, 90, 60, 75, 80, 95, 220, 50, 40];
      const yPos = 140 - (i / 13) * 90 + Math.sin(i * 0.8) * 8;
      return {
        date: `May ${i + 17}, 2024`,
        amount: `$${dailyEarns[i] || 80} Net Earned`,
        sub: `Day ${i + 1} sprint volume ($1,180 14D Total)`,
        yPos,
      };
    },
    svgPath: 'M0,140 C110,120 220,95 330,80 C440,65 540,40 640,30',
    areaPath: 'M0,140 C110,120 220,95 330,80 C440,65 540,40 640,30 L640,170 L0,170 Z',
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
    netRateSummary: {
      total: '$2,450',
      delta: '+$540 (▲ +28.3%)',
      gross: '$2,600',
      margin: '94.2% Take-home',
      dailyAvg: '$81.67/day',
      topDay: 'May 12 ($450 Brand Package)',
      insight: 'Consistent daily posting generated a 3.4x spike in inbound brand sponsorship inquiries.',
    },
    sourcesSummary: [
      { name: 'Brand Deals', icon: '💼', amount: '$1,200', pct: '49%', color: '#F59E0B', avgDeal: '$400 / deal', clients: '3 Key Brands' },
      { name: 'Collaborations', icon: '🤝', amount: '$540', pct: '22%', color: '#582CDB', avgDeal: '$180 / split', clients: '3 Squad Collabs' },
      { name: 'Affiliates', icon: '🔗', amount: '$320', pct: '13%', color: '#A78BFA', avgDeal: '$8.20 / conv', clients: '39 Clicks' },
      { name: 'UGC Content', icon: '📱', amount: '$390', pct: '16%', color: '#7C3AED', avgDeal: '$130 / asset', clients: '3 Video Deliverables' },
    ],
    platformSummary: [
      { name: 'TikTok', icon: 'tiktok', amount: '$920', pct: '38%', rpm: '$4.20 RPM', deals: '4 Paid Campaigns', color: '#000000' },
      { name: 'Instagram', icon: 'instagram', amount: '$840', pct: '34%', rpm: '$8.90 RPM', deals: 'Highest Story/Reel Rate', color: '#E1306C' },
      { name: 'YouTube Shorts', icon: 'youtube', amount: '$580', pct: '24%', rpm: '$3.80 RPM', deals: 'Long-Tail Ad Share', color: '#FF0000' },
      { name: 'X / Twitter', icon: 'x', amount: '$330', pct: '14%', rpm: '$6.50 RPM', deals: 'Sponsored Threads', color: '#171420' },
    ],
    monthlyForecast: {
      annualRunRate: '$29,400',
      pacing: '100% of Milestone Goal',
      forecastJun: '$3,200',
    },
    getPoint: (i: number) => {
      const dailyEarn = 60 + Math.floor(Math.sin(i * 0.7) * 25 + (i / 29) * 45);
      const yPos = 135 - (i / 29) * 80 + Math.sin(i * 0.7) * 14;
      return {
        date: `May ${i + 1}, 2024`,
        amount: `$${dailyEarn} Daily Net`,
        sub: `Day ${i + 1} creator payout volume ($2,450 30D Total)`,
        yPos,
      };
    },
    svgPath: 'M0,135 C120,150 220,95 320,110 C420,125 520,75 620,85 C720,95 820,45 950,55',
    areaPath: 'M0,135 C120,150 220,95 320,110 C420,125 520,75 620,85 C720,95 820,45 950,55 L950,170 L0,170 Z',
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
    netRateSummary: {
      total: '$6,840',
      delta: '+$1,820 (▲ +36.2%)',
      gross: '$7,250',
      margin: '94.3% Take-home',
      dailyAvg: '$76.00/day',
      topDay: 'Month 3 ($2,450 May Record 🔥)',
      insight: 'Quarterly momentum puts you in the top 2.4% tier of creators by monetization velocity.',
    },
    sourcesSummary: [
      { name: 'Brand Deals', icon: '💼', amount: '$3,350', pct: '49%', color: '#F59E0B', avgDeal: '$418 / deal', clients: '8 Brands' },
      { name: 'Collaborations', icon: '🤝', amount: '$1,500', pct: '22%', color: '#582CDB', avgDeal: '$187 / split', clients: '8 Squad Collabs' },
      { name: 'Affiliates', icon: '🔗', amount: '$890', pct: '13%', color: '#A78BFA', avgDeal: '$8.40 / conv', clients: '106 Clicks' },
      { name: 'UGC Content', icon: '📱', amount: '$1,100', pct: '16%', color: '#7C3AED', avgDeal: '$137 / asset', clients: '8 Video Deliverables' },
    ],
    platformSummary: [
      { name: 'TikTok', icon: 'tiktok', amount: '$2,580', pct: '38%', rpm: '$4.22 RPM', deals: '11 Campaigns', color: '#000000' },
      { name: 'Instagram', icon: 'instagram', amount: '$2,360', pct: '35%', rpm: '$8.95 RPM', deals: 'Premium Retainers', color: '#E1306C' },
      { name: 'YouTube Shorts', icon: 'youtube', amount: '$1,220', pct: '18%', rpm: '$3.82 RPM', deals: 'Ad Rev Share', color: '#FF0000' },
      { name: 'X / Twitter', icon: 'x', amount: '$680', pct: '9%', rpm: '$6.40 RPM', deals: 'Newsletter & Thread Sponsors', color: '#171420' },
    ],
    monthlyForecast: {
      annualRunRate: '$27,360',
      pacing: '124% of Quarterly Benchmark',
      forecastJun: '$3,300',
    },
    getPoint: (i: number) => {
      const weeks = ['Mar W1', 'Mar W2', 'Mar W3', 'Mar W4', 'Apr W1', 'Apr W2', 'Apr W3', 'Apr W4', 'May W1', 'May W2', 'May W3', 'May W4'];
      const weeklyEarns = [420, 460, 480, 520, 560, 600, 620, 650, 580, 620, 680, 650];
      const yPos = 150 - (i / 11) * 110;
      return {
        date: `Quarterly ${weeks[i] || `Week ${i + 1}`}`,
        amount: `$${weeklyEarns[i]} Weekly Net`,
        sub: `Quarterly pacing ($6,840 90D Total)`,
        yPos,
      };
    },
    svgPath: 'M0,150 C200,130 400,90 600,55 C700,40 760,32 820,28',
    areaPath: 'M0,150 C200,130 400,90 600,55 C700,40 760,32 820,28 L820,170 L0,170 Z',
  },
};

const PLATFORM_EARNINGS: PlatformEarning[] = [
  { id: 'p_tt', platform: 'tiktok', name: 'TikTok', badgeText: '+14%', badgeType: 'purple', progress: 0.78, amount: 920 },
  { id: 'p_ig', platform: 'instagram', name: 'Instagram', badgeText: 'Top Earner', badgeType: 'gold', progress: 0.71, amount: 840 },
  { id: 'p_yt', platform: 'youtube', name: 'YouTube Shorts', badgeText: 'Growing', badgeType: 'gray', progress: 0.49, amount: 580 },
  { id: 'p_x', platform: 'x', name: 'X', badgeText: 'Emerging', badgeType: 'red', progress: 0.28, amount: 330 },
];

export const ProEarningsScreen: React.FC<ProEarningsScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenQuests,
  onOpenReadiness,
  onOpenCreatorPassport,
  onOpenPlatforms,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPayoutsModal, setShowPayoutsModal] = useState(false);
  const [showEarningsPassModal, setShowEarningsPassModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<'all' | 'collabs' | 'brands' | 'affiliate'>('all');
  const [showExpandedEarningsModal, setShowExpandedEarningsModal] = useState(false);
  const [expandedEarningsType, setExpandedEarningsType] = useState<'netRate' | 'incomeSource' | 'platformComp' | 'monthlyTrend'>('netRate');
  const [earningsTimeframe, setEarningsTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [selectedEarningsDayIndex, setSelectedEarningsDayIndex] = useState(29);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [selectedPlatformIndex, setSelectedPlatformIndex] = useState(0);

  // Celebration Modal State
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: 'Payout Initiated!',
    subtitle: '$420.00 fast-transfer processing to Bank ...3421.',
    badgeText: '👑 PAYOUT PROCESSING',
    xpEarned: 100,
    speechBubble: 'Cha-ching! Hard work paying off, Pablo! 💰',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 4,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const triggerModalPop = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    modalPopScale.setValue(0.88);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 26,
      bounciness: 12,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />

        {/* 1. TOP HEADER BAR */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onBack();
              }}
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Pro Badge Pill */}
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
                colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proHeaderBadge}
              >
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.headerRight}>
            {/* Message Bubble Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                } else if (onNavigateTab) {
                  onNavigateTab('match');
                }
              }}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Notification Bell Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowNotificationModal(true);
              }}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.notificationDot} />
            </Pressable>

            {/* User Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerProfileImg}
                resizeMode="cover"
              />
              <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Pro Revenue</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Your creator income breakdown.</Text>
          <Text style={styles.subTitle}>
            Track what you earned, where it came from, and what gets paid next.
          </Text>

          {/* ============================================================ */}
          {/* CARD 1: CURRENT MONTH NET RATE HERO CARD (TAP TO EXPAND)      */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.heroIncomeCard, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedEarningsType('netRate');
              triggerModalPop();
              setShowExpandedEarningsModal(true);
            }}
          >
            <View style={styles.heroTopRow}>
              <Text style={styles.heroCardLabel} numberOfLines={1}>CURRENT NET RATE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <View style={styles.growthBadgePill}>
                  <Text style={styles.growthBadgeText} numberOfLines={1}>📈 +18% vs prev</Text>
                </View>
                <View style={styles.expandHintBadgeSmall}>
                  <Text style={styles.expandHintBadgeText} numberOfLines={1}>Expand 🔍</Text>
                </View>
              </View>
            </View>

            <Text style={styles.heroBigAmount}>$2,450</Text>

            {/* 3 Period Metric Chips */}
            <View style={styles.metricChipsRow}>
              <View style={styles.metricChipBox}>
                <Text style={styles.metricChipLabel}>APR 2024</Text>
                <Text style={styles.metricChipValue}>$780</Text>
              </View>
              <View style={styles.metricChipBox}>
                <Text style={styles.metricChipLabel}>MAY 2024</Text>
                <Text style={styles.metricChipValue}>$420</Text>
              </View>
              <View style={styles.metricChipBox}>
                <Text style={styles.metricChipLabel}>LTM</Text>
                <Text style={styles.metricChipValue}>$1,250</Text>
              </View>
            </View>

            {/* Goal Progress Bar */}
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>GOAL: $4,000</Text>
              <Text style={styles.goalPercent}>61%</Text>
            </View>
            <View style={styles.goalTrackBg}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.goalTrackFill, { width: '61%' }]}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 8, marginTop: 16 }}>
              <Pressable
                style={({ pressed }) => [styles.viewPayoutsBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  triggerModalPop();
                  setShowPayoutsModal(true);
                }}
              >
                <Text style={styles.viewPayoutsBtnText}>VIEW PAYOUTS</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.openPassBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  triggerModalPop();
                  setShowEarningsPassModal(true);
                }}
              >
                <Text style={styles.openPassBtnText}>OPEN EARNINGS PASS</Text>
              </Pressable>
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* CARD 2: INCOME SOURCES BREAKDOWN (TAP TO EXPAND)             */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedEarningsType('incomeSource');
              triggerModalPop();
              setShowExpandedEarningsModal(true);
            }}
          >
            <View style={styles.cardHeaderBetween}>
              <Text style={styles.cardHeaderTitle} numberOfLines={1}>Income Sources</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <View style={styles.syncStatusPill}>
                  <Text style={styles.syncStatusText} numberOfLines={1}>• Multi-Sync</Text>
                </View>
                <View style={styles.expandHintBadgeSmall}>
                  <Text style={styles.expandHintBadgeText} numberOfLines={1}>Expand 🔍</Text>
                </View>
              </View>
            </View>

            {/* Stacked Multi-Color Segment Bar */}
            <View style={styles.stackedSegmentBar}>
              <View style={[styles.segmentPart, { width: '49%', backgroundColor: '#F59E0B' }]} />
              <View style={[styles.segmentPart, { width: '22%', backgroundColor: '#582CDB' }]} />
              <View style={[styles.segmentPart, { width: '13%', backgroundColor: '#A78BFA' }]} />
              <View style={[styles.segmentPart, { width: '16%', backgroundColor: '#7C3AED' }]} />
            </View>

            {/* Breakdown List */}
            <View style={{ gap: 8, marginTop: 14 }}>
              {INCOME_SOURCES.map((source) => (
                <View key={source.id} style={styles.incomeSourceItemRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.sourceColorDot, { backgroundColor: source.color }]} />
                    <Text style={styles.sourceItemName}>{source.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sourceItemAmount}>${source.amount.toLocaleString()}</Text>
                    <Text style={styles.sourceItemPercent}>({source.percentage}%)</Text>
                  </View>
                </View>
              ))}
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* CARD 3: PLATFORM COMPARISON (TAP TO EXPAND)                  */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedEarningsType('platformComp');
              triggerModalPop();
              setShowExpandedEarningsModal(true);
            }}
          >
            <View style={styles.cardHeaderBetween}>
              <Text style={styles.cardHeaderTitle} numberOfLines={1}>Platform Comparison</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <View style={styles.expandHintBadgeSmall}>
                  <Text style={styles.expandHintBadgeText} numberOfLines={1}>Expand 🔍</Text>
                </View>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 20V10M12 20V4M6 20v-6" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </View>

            <View style={{ gap: 14, marginTop: 14 }}>
              {PLATFORM_EARNINGS.map((plat) => (
                <View key={plat.id}>
                  <View style={styles.platformRowHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <SocialBrandIcon platform={plat.platform} size={20} />
                      <Text style={styles.platformNameText}>{plat.name}</Text>
                      <View
                        style={[
                          styles.platBadgePill,
                          plat.badgeType === 'gold' && styles.platBadgeGold,
                          plat.badgeType === 'purple' && styles.platBadgePurple,
                          plat.badgeType === 'gray' && styles.platBadgeGray,
                          plat.badgeType === 'red' && styles.platBadgeRed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.platBadgeText,
                            plat.badgeType === 'gold' && styles.platBadgeTextGold,
                            plat.badgeType === 'purple' && styles.platBadgeTextPurple,
                            plat.badgeType === 'gray' && styles.platBadgeTextGray,
                            plat.badgeType === 'red' && styles.platBadgeTextRed,
                          ]}
                        >
                          {plat.badgeText}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.platformAmountText}>${plat.amount}</Text>
                  </View>

                  {/* Horizontal Bar */}
                  <View style={styles.platTrackBg}>
                    <LinearGradient
                      colors={['#7C3AED', '#582CDB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.platTrackFill, { width: `${plat.progress * 100}%` }]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* CARD 4: PAYOUT STATUS                                        */}
          {/* ============================================================ */}
          <View style={styles.dashboardCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#582CDB" strokeWidth="2.2" />
                <Path d="M2 10h20" stroke="#582CDB" strokeWidth="2.2" />
              </Svg>
              <Text style={styles.cardHeaderTitle} numberOfLines={1}>Payout Status</Text>
            </View>

            <View style={styles.payoutDetailRowsWrap}>
              <View style={styles.payoutRowItem}>
                <Text style={styles.payoutRowLabel}>Next Payout</Text>
                <Text style={styles.payoutRowValBold}>Jul 12</Text>
              </View>
              <View style={styles.payoutRowItem}>
                <Text style={styles.payoutRowLabel}>Estimated Amount</Text>
                <Text style={styles.payoutRowValBold}>$420</Text>
              </View>
              <View style={styles.payoutRowItem}>
                <Text style={styles.payoutRowLabel}>Method</Text>
                <Text style={styles.payoutRowValDim}>Bank ...3421</Text>
              </View>
              <View style={styles.payoutRowItem}>
                <Text style={styles.payoutRowLabel}>Status</Text>
                <View style={styles.processingBadgePill}>
                  <Text style={styles.processingBadgeText}>PROCESSING</Text>
                </View>
              </View>
            </View>

            {/* Note Box */}
            <View style={styles.payoutNoteCallout}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth="2" />
                <Path d="M12 8v4M12 16h.01" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.payoutNoteText}>
                Pending payouts release automatically once campaign approval conditions are finalized.
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 5: MONTHLY EARNINGS TREND (TAP TO EXPAND)               */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.trendGradientCard, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setExpandedEarningsType('monthlyTrend');
              triggerModalPop();
              setShowExpandedEarningsModal(true);
            }}
          >
            <LinearGradient
              colors={['#3B14A7', '#582CDB', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, borderRadius: 20 }}
            >
            <View style={styles.trendHeaderRow}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.trendTitleText} numberOfLines={1}>Monthly Earnings Trend</Text>
                  <Text style={{ fontSize: 14 }}>📈</Text>
                </View>
                <Text style={styles.trendSubText} numberOfLines={1}>4-month historical revenue growth</Text>
              </View>
              <View style={styles.trendYtdPill}>
                <Text style={styles.trendYtdPillText} numberOfLines={1}>YTD</Text>
              </View>
            </View>

            {/* 4-Bar Chart */}
            <View style={styles.barChartContainer}>
              {[
                { month: 'Feb', height: '48%', amount: '$1.2K' },
                { month: 'Mar', height: '64%', amount: '$1.65K' },
                { month: 'Apr', height: '82%', amount: '$2.1K' },
                { month: 'May', height: '100%', amount: '$2.45K', isCurrent: true },
              ].map((bar, idx) => (
                <View key={idx} style={styles.barColWrapper}>
                  <Text style={styles.barAmountTop}>{bar.amount}</Text>
                  <View style={styles.barTrackArea}>
                    <View
                      style={[
                        styles.barFillSegment,
                        { height: bar.height as any },
                        bar.isCurrent && styles.barFillSegmentCurrent,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barMonthLabel, bar.isCurrent && styles.barMonthLabelCurrent]}>
                    {bar.month}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.trendFooterNote}>
              Earnings are trending upward by 18% this month. Brand Deals are now 49% of your total platform income!
            </Text>
          </LinearGradient>
          </Pressable>

          {/* ============================================================ */}
          {/* CARD 6: JARVIS STRATEGY INSIGHT                              */}
          {/* ============================================================ */}
          <View style={styles.jarvisStrategyCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
              <Text style={styles.jarvisStrategyTitle}>JARVIS STRATEGY INSIGHT</Text>
            </View>

            <Text style={styles.jarvisStrategyBody}>
              &ldquo;Your income is diversifying well. Shifting 15% more effort to TikTok UGC could maximize current platform bonuses.&rdquo;
            </Text>

            <Pressable
              style={({ pressed }) => [styles.askJarvisIncomeBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenMessages) {
                  onOpenMessages('conv_jarvis');
                } else if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                }
              }}
            >
              <Text style={styles.askJarvisIncomeBtnText} numberOfLines={1}>✨ ASK JARVIS FOR ADVICE ➔</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* DOWNLOAD SUMMARY BUTTON                                      */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.downloadPdfBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              setCelebrationData({
                title: 'Monthly Summary Exported!',
                subtitle: 'Your July 2024 Revenue Breakdown & Payout Audit PDF is ready.',
                badgeText: '📄 PDF REPORT DOWNLOADED',
                xpEarned: 50,
                speechBubble: 'Monthly summary ready! Keep stacking those creator wins! 📈',
              });
              setShowCelebrationModal(true);
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#171420" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.downloadPdfBtnText} numberOfLines={1}>DOWNLOAD JULY SUMMARY (PDF)</Text>
          </Pressable>

          {/* ============================================================ */}
          {/* CARD 7: RECENT BRAND EARNINGS                                */}
          {/* ============================================================ */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeaderBetween}>
              <Text style={styles.cardHeaderTitle} numberOfLines={1}>Recent Brand Earnings</Text>
              <Text style={styles.totalGoldHeader}>$1,010</Text>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              {[
                { name: 'GlowUp Skincare', status: 'PAID', amount: '$450', icon: '🧴' },
                { name: 'Lagos Food Fest', status: 'PAID', amount: '$360', icon: '🍽️' },
                { name: 'Momentum Boost Bounty', status: 'PENDING', amount: '$200', icon: '⚡' },
              ].map((brand, idx) => (
                <View key={idx} style={styles.brandEarningRow}>
                  <View style={styles.brandLeftGroup}>
                    <View style={styles.brandIconBox}>
                      <Text style={{ fontSize: 17 }}>{brand.icon}</Text>
                    </View>
                    <View style={styles.brandInfoCol}>
                      <Text style={styles.brandNameText} numberOfLines={1}>{brand.name}</Text>
                      <View style={[styles.brandStatusPill, brand.status === 'PENDING' && styles.brandStatusPending]}>
                        <Text style={[styles.brandStatusText, brand.status === 'PENDING' && styles.brandStatusTextPending]}>
                          {brand.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.brandEarnedAmount} numberOfLines={1}>{brand.amount}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 8: COLLAB REVENUE                                       */}
          {/* ============================================================ */}
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeaderBetween}>
              <Text style={styles.cardHeaderTitle} numberOfLines={1}>Collab Revenue</Text>
              <Text style={styles.totalPurpleHeader}>$540</Text>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              {[
                { name: 'Amara Okafor collab', amount: '$220' },
                { name: 'Squad challenge', amount: '$180' },
                { name: 'Referral rewards', amount: '$140' },
              ].map((collab, idx) => (
                <View key={idx} style={styles.collabRow}>
                  <Text style={styles.collabNameText} numberOfLines={1}>{collab.name}</Text>
                  <Text style={styles.collabAmountText} numberOfLines={1}>{collab.amount}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={({ pressed }) => [styles.outlineActionBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowBreakdownModal(true);
                }}
              >
                <Text style={styles.outlineActionBtnText}>View Breakdown</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.outlineActionBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowPayoutsModal(true);
                }}
              >
                <Text style={styles.outlineActionBtnText}>Past Payouts</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL: EXPANDED LIVE EARNINGS & MONETIZATION INTELLIGENCE     */}
        {/* ============================================================ */}
        <Modal
          visible={showExpandedEarningsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowExpandedEarningsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { maxHeight: '90%', padding: 20, transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 135 }}>
                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.liveGreenPulseDot} />
                      <Text style={styles.modalTitle} numberOfLines={1}>
                        {expandedEarningsType === 'netRate'
                          ? 'Net Revenue & Payouts'
                          : expandedEarningsType === 'incomeSource'
                          ? 'Income Sources Breakdown'
                          : expandedEarningsType === 'platformComp'
                          ? 'Platform Monetization'
                          : 'Monthly Trend & Forecast'}
                      </Text>
                    </View>
                    <Text style={styles.modalSubtitle} numberOfLines={1}>
                      {expandedEarningsType === 'netRate'
                        ? 'Live daily creator payout stream • May 2024'
                        : expandedEarningsType === 'incomeSource'
                        ? 'Contract allocation, deal sizes & client volume'
                        : expandedEarningsType === 'platformComp'
                        ? 'Monetization yield & deliverable volume by channel'
                        : 'Historical trajectory & annualized run-rate forecast'}
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowExpandedEarningsModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                {/* TIMEFRAME PILL SELECTOR */}
                <View style={styles.timeframePillRow}>
                  {(['7D', '14D', '30D', '90D'] as const).map((tf) => {
                    const isActive = earningsTimeframe === tf;
                    return (
                      <Pressable
                        key={tf}
                        style={[styles.timeframePill, isActive && styles.timeframePillActive]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setEarningsTimeframe(tf);
                          setSelectedEarningsDayIndex(
                            tf === '7D' ? 6 : tf === '14D' ? 13 : tf === '90D' ? 11 : 29
                          );
                        }}
                      >
                        <Text style={[styles.timeframePillText, isActive && styles.timeframePillTextActive]}>
                          {tf}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* ACTIVE LIVE INSPECTION BANNER */}
                {(() => {
                  const curCfg = (EARNINGS_TIMEFRAME_CONFIGS as any)[earningsTimeframe] || (EARNINGS_TIMEFRAME_CONFIGS as any)['30D'];

                  if (expandedEarningsType === 'incomeSource') {
                    const src = curCfg.sourcesSummary[selectedSourceIndex] || curCfg.sourcesSummary[0];
                    return (
                      <View style={styles.graphActivePointCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.graphActivePointDate} numberOfLines={1}>
                              {src.icon} {src.name}
                            </Text>
                            <Text style={styles.graphActivePointSub} numberOfLines={1}>
                              {src.avgDeal} • {src.clients}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                            <Text style={[styles.graphActivePointValue, { color: src.color }]} numberOfLines={1}>
                              {src.amount} Net
                            </Text>
                            <Text style={styles.graphActivePointDelta} numberOfLines={1}>
                              {src.pct} of {earningsTimeframe} Revenue
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  if (expandedEarningsType === 'platformComp') {
                    const plat = curCfg.platformSummary[selectedPlatformIndex] || curCfg.platformSummary[0];
                    return (
                      <View style={styles.graphActivePointCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.graphActivePointDate} numberOfLines={1}>
                              {plat.name} Yield
                            </Text>
                            <Text style={styles.graphActivePointSub} numberOfLines={1}>
                              {plat.rpm} • {plat.deals}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                            <Text style={[styles.graphActivePointValue, { color: '#582CDB' }]} numberOfLines={1}>
                              {plat.amount} Net
                            </Text>
                            <Text style={styles.graphActivePointDelta} numberOfLines={1}>
                              {plat.pct} Share ({earningsTimeframe})
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  if (expandedEarningsType === 'monthlyTrend') {
                    return (
                      <View style={styles.graphActivePointCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.graphActivePointDate} numberOfLines={1}>
                              🚀 Trajectory: {curCfg.monthlyForecast.pacing}
                            </Text>
                            <Text style={styles.graphActivePointSub} numberOfLines={1}>
                              Next Month Proj: {curCfg.monthlyForecast.forecastJun}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                            <Text style={[styles.graphActivePointValue, { color: '#10B981' }]} numberOfLines={1}>
                              {curCfg.monthlyForecast.annualRunRate}
                            </Text>
                            <Text style={styles.graphActivePointDelta} numberOfLines={1}>
                              Annualized Run-Rate
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  // Default Net Rate
                  const safeIdx = Math.min(selectedEarningsDayIndex, curCfg.daysCount - 1);
                  const activePt = curCfg.getPoint(safeIdx);

                  return (
                    <View style={styles.graphActivePointCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.graphActivePointDate} numberOfLines={1}>
                            📅 {activePt.date}
                          </Text>
                          <Text style={styles.graphActivePointSub} numberOfLines={1}>
                            {activePt.sub}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                          <Text style={[styles.graphActivePointValue, { color: '#582CDB' }]} numberOfLines={1}>
                            {activePt.amount}
                          </Text>
                          <Text style={styles.graphActivePointDelta} numberOfLines={1}>
                            {curCfg.netRateSummary.margin}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* CUSTOM VIEWPORT: DEDICATED PLATFORM COMPARISON BARS OR LIVE WAVE GRAPH */}
                {(() => {
                  const curCfg = (EARNINGS_TIMEFRAME_CONFIGS as any)[earningsTimeframe] || (EARNINGS_TIMEFRAME_CONFIGS as any)['30D'];

                  // 🌟 DEDICATED PLATFORM COMPARISON MULTI-BAR CHART VIEW
                  if (expandedEarningsType === 'platformComp') {
                    const maxPlatAmt = Math.max(...curCfg.platformSummary.map((p: any) => parseInt(p.amount.replace(/[^0-9]/g, '')) || 100));

                    return (
                      <View style={styles.platformCompChartContainer}>
                        <View style={styles.platformChartHeaderRow}>
                          <Text style={styles.platformChartHeaderTitle} numberOfLines={1}>
                            PLATFORM REVENUE ({earningsTimeframe})
                          </Text>
                          <View style={styles.platformTapBadgePill}>
                            <Text style={styles.platformChartHeaderSub} numberOfLines={1}>Inspect 🔍</Text>
                          </View>
                        </View>

                        {/* 4 Comparative Vertical Platform Columns */}
                        <View style={styles.platformBarsRow}>
                          {curCfg.platformSummary.map((plat: any, pIdx: number) => {
                            const isSelected = selectedPlatformIndex === pIdx;
                            const amtNum = parseInt(plat.amount.replace(/[^0-9]/g, '')) || 100;
                            const barHeight = Math.max(26, Math.min(100, (amtNum / maxPlatAmt) * 96));

                            return (
                              <Pressable
                                key={pIdx}
                                style={[styles.platformBarCol, isSelected && styles.platformBarColSelected]}
                                onPress={() => {
                                  if (Platform.OS !== 'web') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  }
                                  setSelectedPlatformIndex(pIdx);
                                }}
                              >
                                <Text style={[styles.platformBarAmtText, isSelected && { color: '#582CDB', fontWeight: '700' }]}>
                                  {plat.amount}
                                </Text>

                                <View style={styles.platformBarTrack}>
                                  <View
                                    style={[
                                      styles.platformBarFill,
                                      {
                                        height: barHeight,
                                        backgroundColor: isSelected ? '#582CDB' : '#C4B5FD',
                                      },
                                    ]}
                                  />
                                </View>

                                <View style={{ alignItems: 'center', marginTop: 6, width: '100%' }}>
                                  <SocialBrandIcon platform={plat.icon} size={16} />
                                  <Text
                                    style={[styles.platformBarLabel, isSelected && styles.platformBarLabelActive]}
                                    numberOfLines={1}
                                  >
                                    {plat.name === 'Instagram' ? 'Insta' : plat.name.split(' ')[0]}
                                  </Text>
                                  <Text style={styles.platformBarPctText} numberOfLines={1}>{plat.pct}</Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }

                  // DEFAULT SCROLLABLE WAVE GRAPH FOR NET RATE, INCOME SOURCES & MONTHLY TREND
                  const vWidth = curCfg.viewportWidth;
                  const safeIdx = Math.min(selectedEarningsDayIndex, curCfg.daysCount - 1);

                  return (
                    <View style={styles.horizontalGraphViewport}>
                      <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={true}
                        bounces={true}
                        contentContainerStyle={styles.horizontalGraphScrollContent}
                      >
                        <View style={{ width: vWidth, height: 210, position: 'relative' }}>
                          <Svg width={vWidth} height={190} viewBox={`0 0 ${vWidth} 190`}>
                            <Defs>
                              <SvgLinearGradient id="earnWaveGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#582CDB" stopOpacity="0.38" />
                                <Stop offset="1" stopColor="#582CDB" stopOpacity="0.0" />
                              </SvgLinearGradient>
                            </Defs>

                            {/* Grid Lines */}
                            <Path d={`M0,35 L${vWidth},35`} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                            <Path d={`M0,80 L${vWidth},80`} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                            <Path d={`M0,125 L${vWidth},125`} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                            <Path d={`M0,170 L${vWidth},170`} stroke="#E2E8F0" strokeWidth="1.5" />

                            {/* Area Fill */}
                            <Path d={curCfg.areaPath} fill="url(#earnWaveGrad)" />

                            {/* Line Curve */}
                            <Path d={curCfg.svgPath} fill="none" stroke="#582CDB" strokeWidth="3.5" strokeLinecap="round" />
                          </Svg>

                          {/* Touchpoints */}
                          <View style={styles.interactiveNodesOverlay}>
                            {Array.from({ length: curCfg.daysCount }, (_, i) => {
                              const isSelected = safeIdx === i;
                              const pt = curCfg.getPoint(i);

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
                                    setSelectedEarningsDayIndex(i);
                                  }}
                                  hitSlop={8}
                                >
                                  <View
                                    style={[
                                      styles.nodeCircleDot,
                                      isSelected && styles.nodeCircleDotSelected,
                                      { backgroundColor: isSelected ? '#F59E0B' : '#582CDB' },
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

                {/* DYNAMIC TIMEFRAME-REACTIVE BREAKDOWN UNDER GRAPH */}
                {(() => {
                  const curCfg = (EARNINGS_TIMEFRAME_CONFIGS as any)[earningsTimeframe] || (EARNINGS_TIMEFRAME_CONFIGS as any)['30D'];

                  // 🌟 PLATFORM COMPARISON DEDICATED BOTTOM BREAKDOWN
                  if (expandedEarningsType === 'platformComp') {
                    const selectedPlat = curCfg.platformSummary[selectedPlatformIndex] || curCfg.platformSummary[0];

                    return (
                      <View style={styles.audienceCleanBottomContainer}>
                        {/* 2-Card Platform Vitals */}
                        <View style={styles.audienceStatsDuoRow}>
                          <View style={styles.audienceStatDuoCard}>
                            <Text style={styles.audienceStatDuoLabel} numberOfLines={1}>{selectedPlat.name.toUpperCase()} REVENUE</Text>
                            <Text style={[styles.audienceStatDuoVal, { color: '#582CDB' }]} numberOfLines={1}>
                              {selectedPlat.amount}
                            </Text>
                            <Text style={styles.audienceStatDuoSub} numberOfLines={1}>{selectedPlat.pct} of all income</Text>
                          </View>
                          <View style={styles.audienceStatDuoCard}>
                            <Text style={styles.audienceStatDuoLabel} numberOfLines={1}>MONETIZATION YIELD</Text>
                            <Text style={[styles.audienceStatDuoVal, { color: '#10B981' }]} numberOfLines={1}>
                              {selectedPlat.rpm}
                            </Text>
                            <Text style={styles.audienceStatDuoSub} numberOfLines={1}>{selectedPlat.deals}</Text>
                          </View>
                        </View>

                        {/* All 4 Platforms Detailed List */}
                        <View style={styles.audienceChannelsCard}>
                          <Text style={styles.audienceChannelsTitle}>PLATFORM EARNINGS BREAKDOWN ({earningsTimeframe})</Text>

                          {curCfg.platformSummary.map((plat: any, pIdx: number) => {
                            const isSelected = selectedPlatformIndex === pIdx;
                            return (
                              <Pressable
                                key={pIdx}
                                style={[
                                  styles.audienceChannelRow,
                                  { paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10 },
                                  isSelected && { backgroundColor: '#F5F3FF' },
                                ]}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setSelectedPlatformIndex(pIdx);
                                }}
                              >
                                <SocialBrandIcon platform={plat.icon} size={22} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={[styles.audienceChannelName, isSelected && { color: '#582CDB', fontWeight: '700' }]}>
                                      {plat.name}
                                    </Text>
                                    <Text style={styles.audienceChannelVal}>
                                      {plat.amount} <Text style={styles.audienceChannelPct}>({plat.pct})</Text>
                                    </Text>
                                  </View>
                                  <View style={styles.audienceChannelTrackBg}>
                                    <View
                                      style={[
                                        styles.audienceChannelTrackFill,
                                        { width: plat.pct, backgroundColor: isSelected ? '#582CDB' : '#A78BFA' },
                                      ]}
                                    />
                                  </View>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>

                        {/* Jarvis Platform Arbitrage Insight */}
                        <View style={styles.audienceInsightCallout}>
                          <Text style={styles.audienceInsightCalloutText}>
                            🎯 <Text style={{ fontWeight: '800', color: '#582CDB' }}>Platform Arbitrage Insight ({earningsTimeframe}):</Text> Instagram delivers your highest rate per viewer ($8.90 RPM). Re-allocating 1 short-form slot to an Instagram carousel package can lift monthly revenue by +$420.
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  // DEFAULT BREAKDOWN (Net Rate, Income Sources, Monthly Trend)
                  return (
                    <View style={styles.audienceCleanBottomContainer}>
                      {/* Key Stats Duo */}
                      <View style={styles.audienceStatsDuoRow}>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel} numberOfLines={1}>NET EARNINGS</Text>
                          <Text style={[styles.audienceStatDuoVal, { color: '#582CDB' }]} numberOfLines={1}>
                            {curCfg.netRateSummary.total}
                          </Text>
                          <Text style={styles.audienceStatDuoSub} numberOfLines={1}>{curCfg.netRateSummary.delta}</Text>
                        </View>
                        <View style={styles.audienceStatDuoCard}>
                          <Text style={styles.audienceStatDuoLabel} numberOfLines={1}>DAILY AVERAGE</Text>
                          <Text style={[styles.audienceStatDuoVal, { color: '#10B981' }]} numberOfLines={1}>
                            {curCfg.netRateSummary.dailyAvg}
                          </Text>
                          <Text style={styles.audienceStatDuoSub} numberOfLines={1}>{curCfg.netRateSummary.margin}</Text>
                        </View>
                      </View>

                      {/* Sources / Platform Rows */}
                      <View style={styles.audienceChannelsCard}>
                        <Text style={styles.audienceChannelsTitle}>REVENUE STREAMS ({earningsTimeframe})</Text>

                        {curCfg.sourcesSummary.map((s: any, sIdx: number) => (
                          <Pressable
                            key={sIdx}
                            style={[styles.audienceChannelRow, { paddingVertical: 4 }]}
                            onPress={() => {
                              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedSourceIndex(sIdx);
                            }}
                          >
                            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FAF8F5', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={styles.audienceChannelName}>{s.name}</Text>
                                <Text style={styles.audienceChannelVal}>{s.amount} <Text style={styles.audienceChannelPct}>({s.pct})</Text></Text>
                              </View>
                              <View style={styles.audienceChannelTrackBg}>
                                <View style={[styles.audienceChannelTrackFill, { width: s.pct, backgroundColor: s.color }]} />
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </View>

                      {/* Clean Insight Callout */}
                      <View style={styles.audienceInsightCallout}>
                        <Text style={styles.audienceInsightCalloutText}>
                          ⚡ <Text style={{ fontWeight: '800', color: '#582CDB' }}>Monetization Insight ({earningsTimeframe}):</Text> {curCfg.netRateSummary.insight}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Close Button */}
                <Pressable
                  style={[styles.modalFullBtn, { marginTop: 12, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFECE6' }]}
                  onPress={() => setShowExpandedEarningsModal(false)}
                >
                  <Text style={[styles.modalFullBtnText, { color: '#64748B' }]}>Close Expanded View</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>


        {/* ============================================================ */}
        {/* MODAL 1: VIEW PAYOUTS MODAL                                  */}
        {/* ============================================================ */}
        <Modal
          visible={showPayoutsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPayoutsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHeaderBetween}>
                  <View style={styles.proTagPill}>
                    <Text style={styles.proTagPillText}>💳 CREATOR PAYOUT HUB</Text>
                  </View>
                  <Pressable onPress={() => setShowPayoutsModal(false)} hitSlop={8}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitle}>Payouts &amp; Bank Transfer</Text>
                <Text style={styles.modalSub}>
                  Direct deposit via Stripe Express • Auto-payouts scheduled every 14 days.
                </Text>

                {/* Bank Card Info */}
                <View style={styles.bankCardBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.bankCardType}>CHASE PREMIER CHECKING</Text>
                    <Text style={styles.bankVerifiedTag}>✓ VERIFIED</Text>
                  </View>
                  <Text style={styles.bankCardNumber}>•••• •••• •••• 3421</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.bankHolderName}>Pablo (Poststreak Creator)</Text>
                    <Text style={styles.bankCurrencyTag}>USD ($)</Text>
                  </View>
                </View>

                {/* Payout History */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>RECENT TRANSFERS</Text>
                <View style={{ gap: 8, marginTop: 6 }}>
                  {[
                    { id: 't1', date: 'Jun 28, 2024', amount: '$780.00', status: 'DEPOSITED' },
                    { id: 't2', date: 'Jun 14, 2024', amount: '$420.00', status: 'DEPOSITED' },
                    { id: 't3', date: 'May 31, 2024', amount: '$1,250.00', status: 'DEPOSITED' },
                  ].map((t) => (
                    <View key={t.id} style={styles.transferRow}>
                      <View>
                        <Text style={styles.transferDate}>{t.date}</Text>
                        <Text style={styles.transferStatus}>{t.status}</Text>
                      </View>
                      <Text style={styles.transferAmount}>{t.amount}</Text>
                    </View>
                  ))}
                </View>

                {/* Claim Payout Button */}
                <Pressable
                  style={({ pressed }) => [styles.modalPrimaryActionBtn, { marginTop: 16 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowPayoutsModal(false);
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setCelebrationData({
                      title: 'Payout Request Sent!',
                      subtitle: '$420.00 fast-transfer processing to Bank ...3421.',
                      badgeText: '👑 FAST PAYOUT INITIATED',
                      xpEarned: 100,
                      speechBubble: 'Cha-ching! Hard work paying off, Pablo! 💰',
                    });
                    setTimeout(() => {
                      setShowCelebrationModal(true);
                    }, 200);
                  }}
                >
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGoldBtnGradient}
                  >
                    <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                      ✨ Instant Payout ($420.00) ➔
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowPayoutsModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Hub</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 2: EARNINGS PASS / MEDIA KIT MODAL                     */}
        {/* ============================================================ */}
        <Modal
          visible={showEarningsPassModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEarningsPassModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHeaderBetween}>
                  <View style={styles.proTagPill}>
                    <Text style={styles.proTagPillText}>👑 CREATOR EARNINGS PASS</Text>
                  </View>
                  <Pressable onPress={() => setShowEarningsPassModal(false)} hitSlop={8}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitle}>Creator Passport &amp; Rate Card</Text>
                <Text style={styles.modalSub}>
                  Share your verified analytics and standardized campaign pricing with sponsors.
                </Text>

                <View style={styles.rateCardBox}>
                  <Text style={styles.rateCardHeader}>STANDARD SPONSOR RATES</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <View style={styles.rateRow}>
                      <Text style={styles.rateItem}>1x 9:16 Video Integration (Reels/TikTok)</Text>
                      <Text style={styles.ratePrice}>$450</Text>
                    </View>
                    <View style={styles.rateRow}>
                      <Text style={styles.rateItem}>2x Multi-Platform Sprint (IG + YT Shorts)</Text>
                      <Text style={styles.ratePrice}>$750</Text>
                    </View>
                    <View style={styles.rateRow}>
                      <Text style={styles.rateItem}>Monthly Brand Ambassador (4 Posts)</Text>
                      <Text style={styles.ratePrice}>$1,600</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.modalPrimaryActionBtn, { marginTop: 14 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowEarningsPassModal(false);
                    showToast('✓ Creator Passport link copied to clipboard!');
                  }}
                >
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGoldBtnGradient}
                  >
                    <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                      🔗 Copy Verified Media Kit Link
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowEarningsPassModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Pass</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 3: CLEAN UNCLUTTERED EARNINGS BREAKDOWN LEDGER         */}
        {/* ============================================================ */}
        <Modal
          visible={showBreakdownModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBreakdownModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { maxHeight: '88%', padding: 22, transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 135 }}>
                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 16 }}>💰</Text>
                      <Text style={styles.modalTitle}>Earnings Breakdown</Text>
                    </View>
                    <Text style={styles.modalSubtitle}>
                      Itemized payouts across brand deals, collabs, and creator bounties.
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowBreakdownModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                {/* 2-Stat Summary Duo */}
                <View style={[styles.audienceStatsDuoRow, { marginVertical: 12 }]}>
                  <View style={styles.audienceStatDuoCard}>
                    <Text style={styles.audienceStatDuoLabel} numberOfLines={1}>TOTAL SETTLED</Text>
                    <Text style={[styles.audienceStatDuoVal, { color: '#582CDB', fontSize: sFont(16) }]} numberOfLines={1}>$2,450.00</Text>
                    <Text style={styles.audienceStatDuoSub} numberOfLines={1}>May 2024 Net</Text>
                  </View>
                  <View style={styles.audienceStatDuoCard}>
                    <Text style={styles.audienceStatDuoLabel} numberOfLines={1}>PENDING PAYOUTS</Text>
                    <Text style={[styles.audienceStatDuoVal, { color: '#10B981', fontSize: sFont(16) }]} numberOfLines={1}>$1,200.00</Text>
                    <Text style={styles.audienceStatDuoSub} numberOfLines={1}>3 In Review</Text>
                  </View>
                </View>

                {/* Concise Category Filter Pills */}
                <View style={[styles.timeframePillRow, { marginVertical: 8 }]}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'brands', label: 'Brands' },
                    { id: 'collabs', label: 'Collabs' },
                    { id: 'affiliate', label: 'Affiliate' },
                  ].map((filter) => {
                    const isActive = ledgerCategoryFilter === filter.id;
                    return (
                      <Pressable
                        key={filter.id}
                        style={[styles.timeframePill, isActive && styles.timeframePillActive]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setLedgerCategoryFilter(filter.id as any);
                        }}
                      >
                        <Text
                          style={[
                            styles.timeframePillText,
                            isActive && styles.timeframePillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Clean Itemized Transaction List */}
                <View style={styles.cleanTransactionsCard}>
                  {[
                    {
                      id: 't1',
                      category: 'collabs',
                      title: 'Amara Okafor Collab',
                      subtitle: 'TikTok Reel (45s) • May 28',
                      amount: '+$220.00',
                      status: 'PAID',
                      icon: '🤝',
                      color: '#582CDB',
                    },
                    {
                      id: 't2',
                      category: 'brands',
                      title: 'GlowUp Skincare',
                      subtitle: 'Instagram Carousel • May 24',
                      amount: '+$450.00',
                      status: 'PAID',
                      icon: '💼',
                      color: '#F59E0B',
                    },
                    {
                      id: 't3',
                      category: 'collabs',
                      title: 'Momentum Squad Bounty',
                      subtitle: 'YouTube Short • May 20',
                      amount: '+$180.00',
                      status: 'PAID',
                      icon: '🏆',
                      color: '#582CDB',
                    },
                    {
                      id: 't4',
                      category: 'brands',
                      title: 'Lagos Food Festival',
                      subtitle: 'TikTok Review • May 16',
                      amount: '+$360.00',
                      status: 'PAID',
                      icon: '🍽️',
                      color: '#F59E0B',
                    },
                    {
                      id: 't5',
                      category: 'affiliate',
                      title: 'Notion Creator Affiliate',
                      subtitle: '39 Referral Signups • May 12',
                      amount: '+$320.00',
                      status: 'PAID',
                      icon: '🔗',
                      color: '#A78BFA',
                    },
                    {
                      id: 't6',
                      category: 'brands',
                      title: 'Momentum Boost Sponsor',
                      subtitle: 'Instagram Story • May 06',
                      amount: '+$390.00',
                      status: 'PAID',
                      icon: '📱',
                      color: '#7C3AED',
                    },
                    {
                      id: 't7',
                      category: 'collabs',
                      title: 'Peer Creator Referral',
                      subtitle: 'X / Twitter Onboardings • May 02',
                      amount: '+$140.00',
                      status: 'PAID',
                      icon: '⚡',
                      color: '#582CDB',
                    },
                    {
                      id: 't8',
                      category: 'brands',
                      title: 'TechGear Sprint Bounty',
                      subtitle: 'YouTube Unboxing • Processing',
                      amount: '$350.00',
                      status: 'PENDING',
                      icon: '📦',
                      color: '#94A3B8',
                    },
                  ]
                    .filter(
                      (item) =>
                        ledgerCategoryFilter === 'all' || item.category === ledgerCategoryFilter
                    )
                    .map((item, idx, arr) => (
                      <View
                        key={item.id}
                        style={[
                          styles.cleanTransactionRow,
                          idx !== arr.length - 1 && styles.cleanTransactionBorder,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View style={[styles.cleanIconSquare, { backgroundColor: item.color + '15' }]}>
                            <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cleanTxTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.cleanTxSub} numberOfLines={1}>{item.subtitle}</Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                          <Text style={[styles.cleanTxAmt, { color: item.status === 'PENDING' ? '#64748B' : '#582CDB' }]}>
                            {item.amount}
                          </Text>
                          <Text style={[styles.cleanTxStatus, item.status === 'PENDING' ? { color: '#D97706' } : { color: '#15803D' }]}>
                            {item.status === 'PENDING' ? '• Pending' : '✓ Paid'}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>

                {/* Single Summary Strip */}
                <View style={styles.cleanSummaryStrip}>
                  <Text style={styles.cleanSummaryStripText}>
                    Gross $2,600 • 0% Platform Fee • <Text style={{ color: '#582CDB', fontWeight: '800' }}>Net $2,450</Text>
                  </Text>
                </View>

                {/* Primary Export Button */}
                <Pressable
                  style={({ pressed }) => [styles.modalFullBtn, { marginTop: 14 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setShowBreakdownModal(false);
                    setCelebrationData({
                      title: 'Statement Downloaded!',
                      subtitle: 'Your complete itemized earnings ledger has been exported to PDF.',
                      badgeText: '📄 PDF STATEMENT SAVED',
                      xpEarned: 50,
                      speechBubble: 'Itemized earnings summary exported successfully! 📈',
                    });
                    setShowCelebrationModal(true);
                  }}
                >
                  <Text style={styles.modalFullBtnText}>📥 Download PDF Statement</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

                {/* NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Earnings Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.transferRow}>
                  <Text style={{ fontSize: 20 }}>💰</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transferDate}>$450.00 from GlowUp Skincare</Text>
                    <Text style={styles.transferStatus}>Campaign brief approved • Processing deposit</Text>
                  </View>
                </View>
              </View>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
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

        {/* 3D GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          onDismiss={() => setShowCelebrationModal(false)}
          title={celebrationData.title}
          subtitle={celebrationData.subtitle}
          badgeText={celebrationData.badgeText}
          xpEarned={celebrationData.xpEarned}
          speechBubble={celebrationData.speechBubble}
        />
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
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  headerLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 24,
    height: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proHeaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proHeaderBadgeText: {
    fontSize: sFont(10),
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerProfileImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgePillRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 6,
  },
  heroPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  mainTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },

  // CARD 1: HERO INCOME
  /* EXPANDED EARNINGS MODAL & HINT BADGES */
  expandHintBadgeSmall: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  expandHintBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  timeframePillRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 4,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 4,
  },
  timeframePill: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframePillActive: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  timeframePillText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  timeframePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  graphActivePointCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 10,
  },
  graphActivePointDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  graphActivePointSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  graphActivePointValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  graphActivePointDelta: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  horizontalGraphViewport: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 10,
    overflow: 'hidden',
  },
  horizontalGraphScrollContent: {
    paddingRight: 30,
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nodeCircleDotSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  nodeSelectedGlowRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#F59E0B',
    opacity: 0.8,
  },
  xAxisLabelsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  xAxisLabelText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  audienceCleanBottomContainer: {
    gap: 10,
    marginTop: 4,
  },
  audienceStatsDuoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  audienceStatDuoCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  audienceStatDuoLabel: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  audienceStatDuoVal: {
    fontSize: sFont(15),
    fontWeight: '700',
    color: '#171420',
  },
  audienceStatDuoSub: {
    fontSize: sFont(9.5),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  audienceChannelsCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  audienceChannelsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  audienceChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  audienceChannelName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  audienceChannelVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  audienceChannelPct: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  audienceChannelTrackBg: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  audienceChannelTrackFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  audienceInsightCallout: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  audienceInsightCalloutText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  liveGreenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    flexShrink: 0,
  },
  /* PLATFORM COMPARISON DEDICATED BAR CHART */
  platformCompChartContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 14,
  },
  platformChartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformChartHeaderTitle: {
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  platformTapBadgePill: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    flexShrink: 0,
  },
  platformChartHeaderSub: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#582CDB',
  },
  platformBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  platformBarCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 14,
  },
  platformBarColSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  platformBarAmtText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#171420',
    marginBottom: 6,
    textAlign: 'center',
  },
  platformBarTrack: {
    width: 24,
    height: 100,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  platformBarFill: {
    width: '100%',
    borderRadius: 12,
  },
  platformBarLabel: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  platformBarLabelActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  platformBarPctText: {
    fontSize: sFont(9),
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },

  /* EXPANDED LEDGER BREAKDOWN STYLES */
  ledgerItemCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  ledgerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerSourceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  ledgerSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  ledgerAmountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ledgerStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  ledgerStatusPaid: {
    backgroundColor: '#DCFCE7',
  },
  ledgerStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  ledgerStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  ledgerStatusTextPaid: {
    color: '#15803D',
  },
  ledgerStatusTextPending: {
    color: '#D97706',
  },
  ledgerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 6,
  },
  ledgerDateText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  ledgerIdText: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ledgerTaxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 6,
  },
  ledgerTaxTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  ledgerTaxId: {
    fontSize: 9,
    color: '#94A3B8',
  },
  ledgerTaxLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  ledgerTaxVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },

  /* CLEAN TRANSACTION LEDGER STYLES */
  cleanTransactionsCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginVertical: 6,
  },
  cleanTransactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cleanTransactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  cleanIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanTxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  cleanTxSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cleanTxAmt: {
    fontSize: 14,
    fontWeight: '700',
  },
  cleanTxStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  cleanSummaryStrip: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: 8,
  },
  cleanSummaryStripText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  modalCardLarge: {
    width: '92%',
    
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: sFont(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  modalCloseCross: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalFullBtn: {
    height: 44,
    backgroundColor: '#582CDB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFullBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  heroIncomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCardLabel: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  growthBadgePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  growthBadgeText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#582CDB',
  },
  heroBigAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: '#F59E0B',
    marginVertical: 8,
    letterSpacing: -0.5,
  },
  metricChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricChipBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
  },
  metricChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  metricChipValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  goalPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  goalTrackBg: {
    height: 8,
    backgroundColor: '#F1EFE9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  viewPayoutsBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  viewPayoutsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  openPassBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  openPassBtnText: {
    color: '#171420',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // COMMON DASHBOARD CARD
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: sFont(14),
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  syncStatusPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  syncStatusText: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#582CDB',
  },

  // STACKED SEGMENT BAR
  stackedSegmentBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginTop: 14,
    gap: 2,
  },
  segmentPart: {
    height: '100%',
    borderRadius: 3,
  },
  incomeSourceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sourceColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sourceItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  sourceItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  sourceItemPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // PLATFORM COMPARISON
  platformRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  platBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platBadgeGold: { backgroundColor: '#FEF3C7' },
  platBadgePurple: { backgroundColor: '#EDE9FE' },
  platBadgeGray: { backgroundColor: '#F1F5F9' },
  platBadgeRed: { backgroundColor: '#FEE2E2' },
  platBadgeText: { fontSize: 9, fontWeight: '700' },
  platBadgeTextGold: { color: '#B45309' },
  platBadgeTextPurple: { color: '#582CDB' },
  platBadgeTextGray: { color: '#64748B' },
  platBadgeTextRed: { color: '#DC2626' },
  platformAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  platTrackBg: {
    height: 7,
    backgroundColor: '#F1EFE9',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  platTrackFill: {
    height: '100%',
    borderRadius: 3.5,
  },

  // PAYOUT STATUS
  payoutDetailRowsWrap: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  payoutRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutRowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  payoutRowValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  payoutRowValDim: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '800',
  },
  processingBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  processingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  payoutNoteCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  payoutNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // TREND GRADIENT CARD
  trendGradientCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trendTitleText: {
    fontSize: sFont(14),
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  trendSubText: {
    fontSize: sFont(11),
    color: '#E9D5FF',
    marginTop: 2,
  },
  trendYtdPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  trendYtdPillText: {
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#FDE68A',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  barColWrapper: {
    alignItems: 'center',
    width: 48,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barAmountTop: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E9D5FF',
    marginBottom: 4,
  },
  barTrackArea: {
    width: 32,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillSegment: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 8,
  },
  barFillSegmentCurrent: {
    backgroundColor: '#F59E0B',
  },
  barMonthLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E9D5FF',
    marginTop: 6,
  },
  barMonthLabelCurrent: {
    color: '#FDE68A',
    fontWeight: '700',
  },
  trendFooterNote: {
    fontSize: 12,
    color: '#EDE9FE',
    lineHeight: 17,
  },

  // JARVIS STRATEGY CARD
  jarvisStrategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  jarvisFlameImg: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  jarvisStrategyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
  },
  jarvisStrategyBody: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  askJarvisIncomeBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askJarvisIncomeBtnText: {
    color: '#FFFFFF',
    fontSize: sFont(12),
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // DOWNLOAD SUMMARY
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  downloadPdfBtnText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  // RECENT BRAND EARNINGS
  totalGoldHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
  },
  brandEarningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  brandLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  brandNameText: {
    fontSize: sFont(13),
    fontWeight: '700',
    color: '#171420',
  },
  brandStatusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  brandStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  brandStatusText: {
    fontSize: sFont(9),
    fontWeight: '700',
    color: '#15803D',
  },
  brandStatusTextPending: {
    color: '#B45309',
  },
  brandEarnedAmount: {
    fontSize: sFont(14),
    fontWeight: '700',
    color: '#171420',
    flexShrink: 0,
  },

  // COLLAB REVENUE
  totalPurpleHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#582CDB',
  },
  collabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
  },
  collabNameText: {
    fontSize: sFont(13),
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  collabAmountText: {
    fontSize: sFont(14),
    fontWeight: '700',
    color: '#171420',
    flexShrink: 0,
  },
  outlineActionBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  proTagPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proTagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  bankCardBox: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  bankCardType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  bankVerifiedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  bankCardNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginVertical: 14,
  },
  bankHolderName: {
    fontSize: 11,
    color: '#C7D2FE',
    fontWeight: '700',
  },
  bankCurrencyTag: {
    fontSize: 11,
    color: '#FDE68A',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  transferDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  transferStatus: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '800',
    marginTop: 1,
  },
  transferAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  rateCardBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 14,
  },
  rateCardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  rateItem: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
    flex: 1,
  },
  ratePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  modalPrimaryActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalGoldBtnGradient: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalGoldActionBtnText: {
    color: '#0C0A12',
    fontSize: sFont(13),
    fontWeight: '700',
    textAlign: 'center',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
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
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
