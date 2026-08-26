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
  TextInput,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';


// AUTHENTIC BRAND SVG ICONS
const TikTokSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.446 5.14 5.14 0 0 1-1.486-3.616H10.5v15.025a3.25 3.25 0 1 1-3.25-3.25 3.2 3.2 0 0 1 1.25.253V8.75a6.975 6.975 0 0 0-1.25-.113 7 7 0 1 0 7 7V9.22a8.775 8.775 0 0 0 5.071 1.595V7.065a5.16 5.16 0 0 1-2.45-.653 5.13 5.13 0 0 1-1.3-.85z"
      fill="#000000"
    />
  </Svg>
);

const InstagramSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
  </Svg>
);

const YouTubeSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.582 6.186a2.75 2.75 0 0 0-1.934-1.946C17.942 3.75 12 3.75 12 3.75s-5.942 0-7.648.49a2.75 2.75 0 0 0-1.934 1.946C1.928 7.892 1.928 12 1.928 12s0 4.108.49 5.814a2.75 2.75 0 0 0 1.934 1.946c1.706.49 7.648.49 7.648.49s5.942 0 7.648-.49a2.75 2.75 0 0 0 1.934-1.946c.49-1.706.49-5.814.49-5.814s0-4.108-.49-5.814z"
      fill="#FF0000"
    />
    <Path d="M9.75 15.02V8.98L15 12l-5.25 3.02z" fill="#FFFFFF" />
  </Svg>
);

const LinkedInSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
    <Circle cx="7" cy="7.5" r="1.5" fill="#FFFFFF" />
    <Rect x="5.5" y="10" width="3" height="9" fill="#FFFFFF" />
    <Path
      d="M11 10h2.8v1.3h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V19h-3v-4.1c0-1-.1-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V19h-3V10z"
      fill="#FFFFFF"
    />
  </Svg>
);

const XSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </Svg>
);

const SnapchatSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" fill="#FFFC00" />
    <Path
      d="M12 5.5c-2.4 0-3.8 1.8-3.8 3.5 0 .8.3 1.5.3 1.5s-.6.2-.8.5c-.2.3 0 .7.3.7.6.1 1.1-.3 1.1-.3s.5 1.5 1.5 1.7c.3.1.5.3.5.5s-.8.6-1.7.9c-.8.3-1.2.9-.6 1.3.6.4 1.8.3 2.5-.2.4-.3.7-.3.7-.3s.3 0 .7.3c.7.5 1.9.6 2.5.2.6-.4.2-1-.6-1.3-.9-.3-1.7-.7-1.7-.9s.2-.4.5-.5c1-.2 1.5-1.7 1.5-1.7s.5.4 1.1.3c.3 0 .5-.4.3-.7-.2-.3-.8-.5-.8-.5s.3-.7.3-1.5c0-1.7-1.4-3.5-3.8-3.5z"
      fill="#000000"
    />
  </Svg>
);

const ThreadsSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.84 12.3c-.45 2.1-2.03 3.32-4.14 3.32-2.58 0-4.4-1.84-4.4-4.47 0-2.67 1.88-4.57 4.54-4.57 2.45 0 4.1 1.62 4.17 3.86h-1.87c-.07-1.26-.98-2.14-2.3-2.14-1.62 0-2.65 1.25-2.65 2.85 0 1.63 1.05 2.8 2.58 2.8 1.15 0 1.97-.62 2.22-1.65h1.85z"
      fill="#000000"
    />
  </Svg>
);

const renderGrowthPlatformBrandIcon = (id: string, size = 20) => {
  const platKey = id === 'x_twitter' ? 'x' : id;
  return <SocialBrandIcon platform={platKey} size={size} />;
};

interface GrowthPlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  countNumeric: number;
  bgTint: string;
  connected: boolean;
  canAdd: boolean;
}

const INITIAL_GROWTH_PLATFORMS: GrowthPlatformAccount[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@pablo.creates',
    followers: '14.2k followers',
    countNumeric: 14200,
    bgTint: '#F1F5F9',
    connected: true,
    canAdd: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@pablocreates',
    followers: '7.8k followers',
    countNumeric: 7800,
    bgTint: '#FDF2F8',
    connected: true,
    canAdd: false,
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    handle: 'Pablo Creates',
    followers: '2.8k subs',
    countNumeric: 2800,
    bgTint: '#FEF2F2',
    connected: true,
    canAdd: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'Pablo (Tech & Creator)',
    followers: '1.2K',
    countNumeric: 1200,
    bgTint: '#EFF6FF',
    connected: false,
    canAdd: true,
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    handle: '@pablocreates',
    followers: '3.1K',
    countNumeric: 3100,
    bgTint: '#F8FAFC',
    connected: false,
    canAdd: true,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    handle: 'pablo.snaps',
    followers: '1.8K',
    countNumeric: 1800,
    bgTint: '#FEF9C3',
    connected: false,
    canAdd: true,
  },
  {
    id: 'threads',
    name: 'Threads',
    handle: '@pablocreates',
    followers: '2.2K',
    countNumeric: 2200,
    bgTint: '#F5F3FF',
    connected: false,
    canAdd: true,
  },
];

interface GrowthScreenProps {
  onBackToDashboard?: () => void;
  onOpenPostPerformance?: () => void;
  onOpenPlatformGrowth?: () => void;
  onOpenEarnings?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenAudienceBreakdown?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const GrowthScreen: React.FC<GrowthScreenProps> = ({
  onBackToDashboard,
  onOpenPostPerformance,
  onOpenPlatformGrowth,
  onOpenEarnings,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenAudienceBreakdown,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('growth');

  // Modal States
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Growth Insight Unlocked!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your 30-day analytics report has been generated.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Ghost says: You gained 1,200 new followers this month Amara!');
  const [celebrationBadge, setCelebrationBadge] = useState('+12.4% AUDIENCE');
  const [celebrationXp, setCelebrationXp] = useState(50);

  const [showPostAnalysisModal, setShowPostAnalysisModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConnectPlatformModal, setShowConnectPlatformModal] = useState(false);
  const [platformsList, setPlatformsList] = useState<GrowthPlatformAccount[]>(INITIAL_GROWTH_PLATFORMS);
  const [customHandleInput, setCustomHandleInput] = useState('');
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState('linkedin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleOpenConnectPlatforms = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    triggerModalPop();
    setShowConnectPlatformModal(true);
  };

  const handleConnectSinglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: true } : p))
    );
    const targetPlat = platformsList.find((p) => p.id === platformId);
    showToast(`✓ ${targetPlat?.name || 'Platform'} connected! Sync active.`);
  };

  const handleRemoveSinglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p))
    );
    const targetPlat = platformsList.find((p) => p.id === platformId);
    showToast(`Removed ${targetPlat?.name || 'account'}`);
  };

  const handleAddCustomPlatform = () => {
    if (!customHandleInput.trim()) {
      showToast('Please enter your handle');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPlatformsList((prev) =>
      prev.map((p) =>
        p.id === selectedPlatformToAdd
          ? { ...p, connected: true, handle: customHandleInput.trim() }
          : p
      )
    );
    const targetPlat = platformsList.find((p) => p.id === selectedPlatformToAdd);
    showToast(`✓ ${targetPlat?.name} linked to ${customHandleInput.trim()}!`);
    setCustomHandleInput('');
  };

  const [showChatModal, setShowChatModal] = useState(false);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const graphAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();

    Animated.timing(graphAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    return () => flameLoop.stop();
  }, [flameFloatY, graphAnim]);

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

  const handleOpenPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenJarvisPro) {
      onOpenJarvisPro();
    } else if (onNavigateTab) {
      onNavigateTab('growth');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenMessages={() => {
            if (onOpenMessages) {
              onOpenMessages();
            } else {
              triggerModalPop();
              setShowChatModal(true);
            }
          }}
          onOpenNotifications={() => {
            triggerModalPop();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalPop();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP PILL BADGES */}
          <View style={styles.topBadgesRow}>
            <View style={styles.growthPill}>
              <Text style={styles.growthPillText}>GROWTH</Text>
            </View>

            <View style={styles.analyticsPill}>
              <Text style={styles.analyticsPillText}>ANALYTICS HUB</Text>
            </View>
          </View>

          {/* HEADLINE & SUBTITLE */}
          <Text style={styles.mainHeading}>See your growth clearly.</Text>
          <Text style={styles.mainSubtitle}>
            Track your weekly growth, top content and audience signals.
          </Text>

          {/* 1. TOTAL AUDIENCE GROWTH HERO CARD */}
          <View style={styles.audienceHeroCard}>
            <View style={styles.audienceHeaderRow}>
              <View>
                <Text style={styles.audienceLabel}>TOTAL AUDIENCE</Text>
                <Text style={styles.audiencePercentText}>+12.4%</Text>
              </View>
              <View style={styles.vs30DaysPill}>
                <Text style={styles.vs30DaysPillText}>VS LAST 30 DAYS</Text>
              </View>
            </View>

            {/* 3 Metric Stat Boxes */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>NEW FOLLOWERS</Text>
                <Text style={styles.statValue}>1.2k</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>PROFILE VISITS</Text>
                <Text style={styles.statValue}>1.9k</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ENGAGEMENT</Text>
                <Text style={styles.statValue}>600</Text>
              </View>
            </View>

            {/* Interactive Smooth Curve Graph */}
            <View style={styles.graphContainer}>
              <Svg width="100%" height={110} viewBox="0 0 320 110" preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.22" />
                    <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Area Fill */}
                <Path
                  d="M0,75 C45,75 75,55 120,30 C160,8 190,85 240,65 C270,48 290,15 320,18 L320,110 L0,110 Z"
                  fill="url(#curveGrad)"
                />

                {/* Smooth Curve Line */}
                <Path
                  d="M0,75 C45,75 75,55 120,30 C160,8 190,85 240,65 C270,48 290,15 320,18"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Benchmark Peak Dot */}
                <Circle cx="320" cy="18" r="5" fill="#6366F1" />
                <Circle cx="320" cy="18" r="9" stroke="#6366F1" strokeWidth="1.5" fill="none" opacity="0.4" />
              </Svg>

              <View style={styles.graphDateRow}>
                <Text style={styles.graphDateText}>OCT 01</Text>
                <Text style={styles.graphDateText}>OCT 28</Text>
              </View>
            </View>

            {/* Bottom Link */}
            <Pressable
              style={styles.viewFullAudienceLink}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenAudienceBreakdown) {
                  onOpenAudienceBreakdown();
                } else {
                  triggerModalPop();
                  setShowAudienceModal(true);
                }
              }}
              hitSlop={8}
            >
              <Text style={styles.viewFullAudienceText}>View Full Audience Breakdown ➔</Text>
            </Pressable>
          </View>

          {/* 2. CONNECTED PLATFORMS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>CONNECTED PLATFORMS</Text>
          </View>

          <View style={styles.platformsCard}>
            {/* TikTok - Authentic 3D Chromatic Icon */}
            <View style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#000000' }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Path
                      d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                      fill="#25F4EE"
                      transform="translate(-0.8, -0.8)"
                    />
                    <Path
                      d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                      fill="#FE2C55"
                      transform="translate(0.8, 0.8)"
                    />
                    <Path
                      d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.platformName}>TikTok</Text>
                  <Text style={styles.platformFollowers}>14.2k followers</Text>
                </View>
              </View>
              <Text style={styles.platformGrowthGreen}>+8.2%  ▲</Text>
            </View>

            {/* Instagram - Official Instagram Gradient Camera Icon */}
            <View style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <LinearGradient
                  colors={['#833AB4', '#FD1D1D', '#F77737']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.platformIconBox}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="2" width="20" height="20" rx="6" stroke="#FFFFFF" strokeWidth="2.2" />
                    <Circle cx="12" cy="12" r="4.5" stroke="#FFFFFF" strokeWidth="2.2" />
                    <Circle cx="17.5" cy="6.5" r="1.2" fill="#FFFFFF" />
                  </Svg>
                </LinearGradient>
                <View>
                  <Text style={styles.platformName}>Instagram</Text>
                  <Text style={styles.platformFollowers}>7.8k followers</Text>
                </View>
              </View>
              <Text style={styles.platformGrowthGreen}>+3.4%  ▲</Text>
            </View>

            {/* YouTube Shorts - Official YouTube Red Icon */}
            <View style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#FF0000' }]}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81z"
                      fill="#FFFFFF"
                    />
                    <Path d="M10 15.5l5.5-3.5L10 8.5v7z" fill="#FF0000" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.platformName}>YouTube Shorts</Text>
                  <Text style={styles.platformFollowers}>2.8k subs</Text>
                </View>
              </View>
              <Text style={styles.platformGrowthGreen}>+1.1%  ▲</Text>
            </View>

            {/* LinkedIn - Official In Brand Icon */}
            <View style={[styles.platformRow, { borderBottomWidth: 0 }]}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#0A66C2' }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.54a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.platformName, { flexShrink: 1 }]} numberOfLines={1}>Unlock multi-platform sync</Text>
                  <Text style={styles.platformFollowers}>Connect YouTube &amp; X</Text>
                </View>
              </View>
              <Pressable
                style={styles.connectPillBtn}
                onPress={handleOpenConnectPlatforms}
              >
                <Text style={styles.connectPillBtnText}>Connect</Text>
              </Pressable>
            </View>
          </View>

          {/* 3. BEST PERFORMING POST HERO CARD */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>BEST PERFORMING POST</Text>
          </View>

          <View style={styles.bestPostCard}>
            <View style={styles.bestPostTopRow}>
              <Image
                source={require('../../assets/images/amara-portrait.jpg')}
                style={styles.bestPostThumbnail}
                resizeMode="cover"
              />
              <View style={styles.bestPostContent}>
                <Text style={styles.bestPostTitle}>
                  &ldquo;3 creator mistakes I stopped making this year&rdquo;
                </Text>
                <Text style={styles.bestPostStatsMeta}>
                  14.2k views • 1.8k likes • 84 shares
                </Text>
              </View>
            </View>

            {/* Multi-Metric Performance Bars */}
            <View style={styles.perfBarsList}>
              <View style={styles.perfBarRow}>
                <View style={styles.perfBarLabelRow}>
                  <Text style={styles.perfBarLabel}>VIEWS</Text>
                  <Text style={styles.perfBarValue}>14.2k</Text>
                </View>
                <View style={styles.perfBarTrack}>
                  <View style={[styles.perfBarFill, { width: '85%', backgroundColor: '#6366F1' }]} />
                </View>
              </View>

              <View style={styles.perfBarRow}>
                <View style={styles.perfBarLabelRow}>
                  <Text style={styles.perfBarLabel}>WATCH TIME</Text>
                  <Text style={styles.perfBarValue}>42s</Text>
                </View>
                <View style={styles.perfBarTrack}>
                  <View style={[styles.perfBarFill, { width: '70%', backgroundColor: '#8B5CF6' }]} />
                </View>
              </View>

              <View style={styles.perfBarRow}>
                <View style={styles.perfBarLabelRow}>
                  <Text style={styles.perfBarLabel}>SHARES</Text>
                  <Text style={styles.perfBarValue}>84 (Top 5%)</Text>
                </View>
                <View style={styles.perfBarTrack}>
                  <View style={[styles.perfBarFill, { width: '92%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <Pressable
              style={({ pressed }) => [styles.analyzeBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenPostPerformance) {
                  onOpenPostPerformance();
                } else {
                  triggerModalPop();
                  setShowPostAnalysisModal(true);
                }
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.analyzeGradient}
              >
                <Text style={styles.analyzeBtnText}>Analyze Why It Worked</Text>
              </LinearGradient>
            </Pressable>
          </View>

          
          {/* CREATOR EARNINGS & MONETIZATION ENTRY CARD */}
          <View style={styles.earningsHubCard}>
            <View style={styles.earningsHubHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.earningsHubTitle}>Creator Earnings</Text>
                  <View style={styles.readinessTag}>
                    <Text style={styles.readinessTagText}>35% READINESS</Text>
                  </View>
                </View>
                <Text style={styles.earningsHubSub}>Build your path to paid brand campaigns</Text>
              </View>
              <View style={styles.earningsHubIconCircle}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
            </View>

            <View style={styles.earningsHubStatsRow}>
              <View style={styles.earningsHubStatCol}>
                <Text style={styles.earningsHubStatLabel}>CURRENT BALANCE</Text>
                <Text style={styles.earningsHubStatVal}>$0.00</Text>
              </View>
              <View style={styles.earningsHubDivider} />
              <View style={styles.earningsHubStatCol}>
                <Text style={styles.earningsHubStatLabel}>EST. TRACKED</Text>
                <Text style={[styles.earningsHubStatVal, { color: '#582CDB' }]}>$1,420.50</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.earningsHubBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenEarnings) {
                  onOpenEarnings();
                } else {
                  showToast('Opening Creator Earnings...');
                }
              }}
            >
              <Text style={styles.earningsHubBtnText}>View Creator Earnings ➔</Text>
            </Pressable>
          </View>

          {/* 4. TOTAL POST REACH BREAKDOWN CARD */}
          <View style={styles.reachCard}>
            <View style={styles.reachHeaderRow}>
              <View>
                <Text style={styles.reachHeaderLabel}>TOTAL POST REACH</Text>
                <Text style={styles.reachNumber}>24,850</Text>
              </View>
              <View style={styles.reachPercentPill}>
                <Text style={styles.reachPercentPillText}>+18%</Text>
              </View>
            </View>

            {/* Multi-Segment Distribution Bar */}
            <View style={styles.distBarTrack}>
              <View style={[styles.distBarSeg, { width: '65%', backgroundColor: '#171420' }]} />
              <View style={[styles.distBarSeg, { width: '25%', backgroundColor: '#6366F1' }]} />
              <View style={[styles.distBarSeg, { width: '10%', backgroundColor: '#EF4444' }]} />
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#171420' }]} />
                <Text style={styles.legendText}>TikTok</Text>
                <Text style={styles.legendValue}>+65%</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
                <Text style={styles.legendText}>Instagram</Text>
                <Text style={styles.legendValue}>+25%</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>YouTube</Text>
                <Text style={styles.legendValue}>+10%</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.seeAllReachLink, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenPlatformGrowth) {
                  onOpenPlatformGrowth();
                } else {
                  triggerModalPop();
                  setShowAudienceModal(true);
                }
              }}
              hitSlop={6}
            >
              <Text style={styles.seeAllReachText}>See All Post Analytics ➔</Text>
            </Pressable>
          </View>

          {/* 5. FORMAT PERFORMANCE BAR CHART */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>FORMAT PERFORMANCE</Text>
          </View>

          <View style={styles.formatCard}>
            <View style={styles.formatBarsContainer}>
              {/* Short Video */}
              <View style={styles.formatBarCol}>
                <Text style={styles.formatPercentLabel}>78%</Text>
                <View style={[styles.formatBarPillar, { height: 110, backgroundColor: '#6366F1' }]} />
                <Text style={styles.formatBarTitle}>Short Video</Text>
              </View>

              {/* Text/Thread */}
              <View style={styles.formatBarCol}>
                <Text style={styles.formatPercentLabel}>54%</Text>
                <View style={[styles.formatBarPillar, { height: 75, backgroundColor: '#C7D2FE' }]} />
                <Text style={styles.formatBarTitle}>Text/Thread</Text>
              </View>

              {/* Carousel */}
              <View style={styles.formatBarCol}>
                <Text style={styles.formatPercentLabel}>32%</Text>
                <View style={[styles.formatBarPillar, { height: 45, backgroundColor: '#E2E8F0' }]} />
                <Text style={styles.formatBarTitle}>Carousel</Text>
              </View>
            </View>

            {/* Insight Callout Box */}
            <View style={styles.formatInsightBox}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={styles.formatInsightText}>
                Short Videos scored <Text style={{ fontWeight: '800', color: '#171420' }}>2.4x higher retention</Text> than static posts this week.
              </Text>
            </View>
          </View>

          {/* 6. JARVIS GROWTH STRATEGY (LUXURY DARK NAVY) */}
          <View style={styles.jarvisStrategyCard}>
            <View style={styles.jarvisHeaderRow}>
              <Animated.View
                style={[
                  styles.jarvisFlameCircle,
                  { transform: [{ translateY: flameFloatY }] },
                ]}
              >
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisFlameIcon}
                  resizeMode="contain"
                />
              </Animated.View>
              <View style={styles.jarvisTitleCol}>
                <Text style={styles.jarvisTagText}>JARVIS AI STRATEGY</Text>
                <Text style={styles.jarvisTitle}>Growth Strategy</Text>
              </View>
            </View>

            <Text style={styles.jarvisBodyQuote}>
              &ldquo;Your audience retention spikes when you deliver your main value within the first 4 seconds. Double down on mistake-based hooks.&rdquo;
            </Text>

            <Pressable
              style={({ pressed }) => [styles.viewStrategyBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowStrategyModal(true);
              }}
            >
              <Text style={styles.viewStrategyBtnText}>View Insight ➔</Text>
            </Pressable>
          </View>

          {/* 7. MILESTONES SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>MILESTONES</Text>
          </View>

          <View style={styles.milestonesList}>
            {/* Milestone 1 */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.milestoneTitle} numberOfLines={1}>Reach 15k TikTok Followers</Text>
                  <Text style={styles.milestoneSub}>14.2k / 15k</Text>
                </View>
              </View>
              <View style={styles.milestoneBadgePurple}>
                <Text style={styles.milestoneBadgePurpleText}>800 to go</Text>
              </View>
            </View>

            {/* Milestone 2 */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={{ fontSize: 14 }}>🏆</Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.milestoneTitle} numberOfLines={1}>7-Day Consistency Streak</Text>
                  <Text style={styles.milestoneSub}>Day 7 of 7</Text>
                </View>
              </View>
              <Text style={styles.completedGoldText}>Completed ✓</Text>
            </View>

            {/* Milestone 3 */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={{ fontSize: 14 }}>🎯</Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.milestoneTitle} numberOfLines={1}>Post 3 Videos This Week</Text>
                  <Text style={styles.milestoneSub}>2 / 3 posted</Text>
                </View>
              </View>
              <Pressable
                style={styles.postNowBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.postNowBtnText}>Post 1</Text>
              </Pressable>
            </View>
          </View>

          {/* 8. WEEKLY GROWTH REPORT */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>WEEKLY GROWTH REPORT</Text>
          </View>

          <View style={styles.reportCard}>
            <View style={styles.reportTopRow}>
              <View style={styles.reportIconBox}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="18" height="18" rx="3" stroke="#582CDB" strokeWidth="2" />
                  <Path d="M7 14l3-3 3 2 4-5" stroke="#582CDB" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>October 14 - 20 Report</Text>
                <Text style={styles.reportSummary}>
                  Your total impressions jumped 22%. Best day was Wednesday at 7:30 PM.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.downloadReportLink}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setCelebrationTitle('Report Exported!');
                setCelebrationSubtitle('Your weekly PDF growth breakdown is ready to review.');
                setCelebrationSpeech('Ghost says: You have maintained top 5% retention all week!');
                setCelebrationBadge('PDF DOWNLOADED');
                setCelebrationXp(30);
                setShowCelebrationModal(true);
              }}
              hitSlop={6}
            >
              <Text style={styles.downloadReportText}>Download Weekly Report PDF ➔</Text>
            </Pressable>
          </View>

          {/* 9. UNLOCK DEEPER GROWTH ANALYTICS PRO CARD */}
          <View style={styles.unlockProCard}>
            <Text style={styles.unlockProTitle}>Unlock deeper growth analytics</Text>

            <View style={styles.proPillarsList}>
              <View style={styles.proPillarItem}>
                <Text style={styles.proPillarCheck}>🔒</Text>
                <Text style={styles.proPillarText}>Real-time retention curve tracking</Text>
              </View>
              <View style={styles.proPillarItem}>
                <Text style={styles.proPillarCheck}>🔒</Text>
                <Text style={styles.proPillarText}>AI script performance scorer</Text>
              </View>
              <View style={styles.proPillarItem}>
                <Text style={styles.proPillarCheck}>🔒</Text>
                <Text style={styles.proPillarText}>Multi-creator audience overlap data</Text>
              </View>
            </View>

            {/* Glowing Equalizer Graphic with Lock */}
            <View style={styles.proWaveGraphicBox}>
              <View style={styles.proGraphicBarWrapper}>
                <View style={[styles.proGraphicBar, { height: 28 }]} />
                <View style={[styles.proGraphicBar, { height: 42 }]} />
                <View style={styles.proGraphicCenterLock}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect x="4" y="11" width="16" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2" />
                    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={[styles.proGraphicBar, { height: 42 }]} />
                <View style={[styles.proGraphicBar, { height: 28 }]} />
              </View>
            </View>

            {/* Explore Pro Plans Metallic Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.exploreProBtn, pressed && styles.btnPressed]}
              onPress={handleOpenPro}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreProGradient}
              >
                <Text style={styles.exploreProBtnText}>Explore Pro Plans</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText={celebrationBadge}
          xpEarned={celebrationXp}
          streakCount={47}
          actionText="Continue ➔"
          onDismiss={() => setShowCelebrationModal(false)}
        />

        {/* MODAL: POST RETENTION BREAKDOWN */}
        <Modal
          visible={showPostAnalysisModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPostAnalysisModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Viral Post Retention</Text>
                  <Text style={styles.modalSubtitle}>Hook Retention: 88% at 3 seconds</Text>
                </View>
                <Pressable onPress={() => setShowPostAnalysisModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.modalDetailCard}>
                <Text style={styles.modalDetailTitle}>🔥 Why It Succeeded</Text>
                <Text style={styles.modalDetailBody}>
                  Starting with &ldquo;3 creator mistakes&rdquo; created immediate curiosity. 42% of viewers replayed the video twice.
                </Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowPostAnalysisModal(false);
                  if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.modalFullBtnText}>Make Another Post Like This ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: AUDIENCE BREAKDOWN */}
        <Modal
          visible={showAudienceModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAudienceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Audience Demographics</Text>
                  <Text style={styles.modalSubtitle}>Your primary viewer signals</Text>
                </View>
                <Pressable onPress={() => setShowAudienceModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 10 }}>
                <View style={styles.modalDetailCard}>
                  <Text style={styles.modalDetailTitle}>📍 Top Locations</Text>
                  <Text style={styles.modalDetailBody}>United States (48%), UK (24%), Canada (14%)</Text>
                </View>
                <View style={styles.modalDetailCard}>
                  <Text style={styles.modalDetailTitle}>🕒 Peak Active Time</Text>
                  <Text style={styles.modalDetailBody}>7:30 PM - 9:00 PM EST daily</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowAudienceModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: JARVIS AI STRATEGY */}
        <Modal
          visible={showStrategyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStrategyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Jarvis Weekly Action Plan</Text>
                  <Text style={styles.modalSubtitle}>Recommended next steps for Amara</Text>
                </View>
                <Pressable onPress={() => setShowStrategyModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.modalDetailCard}>
                <Text style={styles.modalDetailTitle}>⚡ Action 1: Batch 2 Shorts</Text>
                <Text style={styles.modalDetailBody}>Schedule them for 7:30 PM Wednesday and Friday.</Text>
              </View>

              <View style={[styles.modalDetailCard, { marginTop: 8 }]}>
                <Text style={styles.modalDetailTitle}>🤝 Action 2: Squad Collab</Text>
                <Text style={styles.modalDetailBody}>Join the 7-Day Consistency Challenge with Elena.</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowStrategyModal(false);
                  if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.modalFullBtnText}>Apply Strategy Now ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* NOTIFICATION MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Growth Alerts</Text>
                  <Text style={styles.modalSubtitle}>Recent follower spikes</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>📈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>+12.4% Audience Spike</Text>
                  <Text style={styles.notifBody}>Your consistency is paying off this month!</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        
        {/* COMPREHENSIVE CONNECT PLATFORMS & SYNC HUB POPUP MODAL */}
        <Modal
          visible={showConnectPlatformModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectPlatformModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardLarge}>
              {/* Modal Top Header */}
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
                    Manage connected channels or add more platforms to sync your audience.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowConnectPlatformModal(false)}
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
                {/* 1. ACTIVE CONNECTED ACCOUNTS */}
                <Text style={styles.modalSectionTitle}>ACTIVE CONNECTED PLATFORMS</Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.connectedPlatformRow}>
                        <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                          {renderGrowthPlatformBrandIcon(plat.id, 20)}
                        </View>
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.platformNameText} numberOfLines={1}>{plat.name}</Text>
                            <View style={styles.autoSyncBadge}>
                              <Text style={styles.autoSyncText}>🟢 Sync</Text>
                            </View>
                          </View>
                          <Text style={styles.platformSubText} numberOfLines={1}>
                            {plat.handle} • ⚡ {plat.followers}
                          </Text>
                        </View>
                        {/* REMOVE BUTTON */}
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

                {/* 2. AVAILABLE PLATFORMS TO ADD MORE */}
                <Text style={styles.modalSectionTitle}>
                  AVAILABLE PLATFORMS TO ADD ({platformsList.filter((p) => !p.connected).length})
                </Text>
                <Text style={styles.modalSubDescription}>
                  Connect more platforms to aggregate your cross-channel creator reach:
                </Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => !p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.availablePlatformRow}>
                        <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                          {renderGrowthPlatformBrandIcon(plat.id, 20)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.platformNameText}>{plat.name}</Text>
                          <Text style={styles.platformSubText}>
                            Sync video metrics &amp; audience velocity
                          </Text>
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

                {/* 3. CUSTOM ACCOUNT LINKER BOX */}
                <View style={styles.customAddAccountBox}>
                  <Text style={styles.customAddTitle}>LINK CUSTOM ACCOUNT HANDLE</Text>
                  <Text style={styles.customAddSub}>
                    Select channel and enter your creator username:
                  </Text>

                  {/* Channel Chips with Real Icons */}
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {renderGrowthPlatformBrandIcon(p.id, 14)}
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

                  {/* Input and Add Button */}
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

              {/* Done Button */}
              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => setShowConnectPlatformModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Save &amp; Close ✓</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* PROFILE MODAL */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* CHAT MODAL */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Squad Chat</Text>
                  <Text style={styles.modalSubtitle}>Collaborate with your creator squad</Text>
                </View>
                <Pressable onPress={() => setShowChatModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatCard}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#582CDB', marginBottom: 2 }}>🤖 Jarvis Assistant</Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>Your engagement scored in the top 5% among tech creators!</Text>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowChatModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
        {/* TOAST BANNER */}
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
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerGhostLogo: {
    width: 36,
    height: 36,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // TOP PILL BADGES
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  growthPill: {
    backgroundColor: '#784DF0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  growthPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  analyticsPill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  analyticsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },

  // HEADLINE
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. TOTAL AUDIENCE HERO CARD
  audienceHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  audienceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  audienceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  audiencePercentText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.8,
  },
  vs30DaysPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  vs30DaysPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.4,
    marginBottom: 3,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  graphContainer: {
    marginBottom: 12,
  },
  graphDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  graphDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  viewFullAudienceLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewFullAudienceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },

  // 2. CONNECTED PLATFORMS
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  platformsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 140,
    marginRight: 8,
  },
  platformIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  platformName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  platformFollowers: {
    fontSize: 11.5,
    color: '#64748B',
  },
  platformGrowthGreen: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
  },
  connectPillBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    flexShrink: 0,
  },
  connectPillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3. BEST PERFORMING POST
  bestPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  bestPostTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  bestPostThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
  },
  bestPostContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bestPostTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 19,
    marginBottom: 4,
  },
  bestPostStatsMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  perfBarsList: {
    gap: 10,
    marginBottom: 16,
  },
  perfBarRow: {},
  perfBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  perfBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  perfBarValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  perfBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  perfBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  analyzeBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  analyzeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 4. TOTAL POST REACH CARD
  reachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
  },
  reachHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reachHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  reachNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171420',
  },
  reachPercentPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  reachPercentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  distBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  distBarSeg: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  legendValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },
  seeAllReachLink: {
    alignItems: 'center',
  },
  seeAllReachText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 5. FORMAT PERFORMANCE
  formatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
  },
  formatBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
    paddingTop: 10,
  },
  formatBarCol: {
    alignItems: 'center',
    width: 70,
  },
  formatPercentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 6,
  },
  formatBarPillar: {
    width: 44,
    borderRadius: 8,
    marginBottom: 8,
  },
  formatBarTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  formatInsightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  formatInsightText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  // 6. JARVIS GROWTH STRATEGY
  jarvisStrategyCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  jarvisFlameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameIcon: {
    width: 22,
    height: 22,
  },
  jarvisTitleCol: {
    flex: 1,
  },
  jarvisTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.6,
  },
  jarvisTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  jarvisBodyQuote: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  viewStrategyBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewStrategyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 7. MILESTONES
  milestonesList: {
    gap: 10,
    marginBottom: 20,
  },
  milestoneCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  milestoneIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  milestoneTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  milestoneSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  milestoneBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  milestoneBadgePurpleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6D28D9',
  },
  completedGoldText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D97706',
    flexShrink: 0,
  },
  postNowBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexShrink: 0,
  },
  postNowBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 8. WEEKLY GROWTH REPORT
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 20,
  },
  reportTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 3,
  },
  reportSummary: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  downloadReportLink: {
    alignItems: 'flex-start',
  },
  downloadReportText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 9. UNLOCK PRO CARD
  unlockProCard: {
    backgroundColor: '#582CDB',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  unlockProTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  proPillarsList: {
    gap: 8,
    marginBottom: 16,
  },
  proPillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proPillarCheck: {
    fontSize: 12,
  },
  proPillarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0E7FF',
  },
  proWaveGraphicBox: {
    alignItems: 'center',
    marginVertical: 14,
  },
  proGraphicBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proGraphicBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  proGraphicCenterLock: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  exploreProBtn: {
    height: 48,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  exploreProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreProBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 22,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
  },
  modalDetailCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  modalDetailTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  modalDetailBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
  },
  profileRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },

  // CONNECT PLATFORM MODAL STYLES
  modalCardLarge: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 10,
  },
  activePlatformsCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  activePlatformsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  modalSubDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  connectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  platformNameText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  autoSyncBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    flexShrink: 0,
  },
  autoSyncText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#059669',
  },
  platformSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  removePlatformBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    flexShrink: 0,
  },
  removePlatformBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  addPlatformActionBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  addPlatformActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  customAddAccountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
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
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 30,
    left: 20,
    right: 20,
    backgroundColor: '#171420',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // CREATOR EARNINGS HUB CARD
  earningsHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  readinessTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  earningsHubSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  earningsHubIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  earningsHubStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 12,
  },
  earningsHubStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningsHubStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  earningsHubStatVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  earningsHubDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  earningsHubBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsHubBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
