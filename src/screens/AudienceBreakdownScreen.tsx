import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// REAL AUTHENTIC BRAND SVG ICONS
export const TikTokSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.446 5.14 5.14 0 0 1-1.486-3.616H10.5v15.025a3.25 3.25 0 1 1-3.25-3.25 3.2 3.2 0 0 1 1.25.253V8.75a6.975 6.975 0 0 0-1.25-.113 7 7 0 1 0 7 7V9.22a8.775 8.775 0 0 0 5.071 1.595V7.065a5.16 5.16 0 0 1-2.45-.653 5.13 5.13 0 0 1-1.3-.85z"
      fill="#000000"
    />
  </Svg>
);

export const InstagramSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
  </Svg>
);

export const YouTubeSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.582 6.186a2.75 2.75 0 0 0-1.934-1.946C17.942 3.75 12 3.75 12 3.75s-5.942 0-7.648.49a2.75 2.75 0 0 0-1.934 1.946C1.928 7.892 1.928 12 1.928 12s0 4.108.49 5.814a2.75 2.75 0 0 0 1.934 1.946c1.706.49 7.648.49 7.648.49s5.942 0 7.648-.49a2.75 2.75 0 0 0 1.934-1.946c.49-1.706.49-5.814.49-5.814s0-4.108-.49-5.814z"
      fill="#FF0000"
    />
    <Path d="M9.75 15.02V8.98L15 12l-5.25 3.02z" fill="#FFFFFF" />
  </Svg>
);

export const LinkedInSvg = ({ size = 20 }: { size?: number }) => (
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

export const XSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </Svg>
);

export const SnapchatSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" fill="#FFFC00" />
    <Path
      d="M12 5.5c-2.4 0-3.8 1.8-3.8 3.5 0 .8.3 1.5.3 1.5s-.6.2-.8.5c-.2.3 0 .7.3.7.6.1 1.1-.3 1.1-.3s.5 1.5 1.5 1.7c.3.1.5.3.5.5s-.8.6-1.7.9c-.8.3-1.2.9-.6 1.3.6.4 1.8.3 2.5-.2.4-.3.7-.3.7-.3s.3 0 .7.3c.7.5 1.9.6 2.5.2.6-.4.2-1-.6-1.3-.9-.3-1.7-.7-1.7-.9s.2-.4.5-.5c1-.2 1.5-1.7 1.5-1.7s.5.4 1.1.3c.3 0 .5-.4.3-.7-.2-.3-.8-.5-.8-.5s.3-.7.3-1.5c0-1.7-1.4-3.5-3.8-3.5z"
      fill="#000000"
    />
  </Svg>
);

export const ThreadsSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.84 12.3c-.45 2.1-2.03 3.32-4.14 3.32-2.58 0-4.4-1.84-4.4-4.47 0-2.67 1.88-4.57 4.54-4.57 2.45 0 4.1 1.62 4.17 3.86h-1.87c-.07-1.26-.98-2.14-2.3-2.14-1.62 0-2.65 1.25-2.65 2.85 0 1.63 1.05 2.8 2.58 2.8 1.15 0 1.97-.62 2.22-1.65h1.85z"
      fill="#000000"
    />
  </Svg>
);

export const renderPlatformBrandIcon = (id: string, size = 20) => {
  switch (id) {
    case 'tiktok':
      return <TikTokSvg size={size} />;
    case 'instagram':
      return <InstagramSvg size={size} />;
    case 'youtube':
      return <YouTubeSvg size={size} />;
    case 'linkedin':
      return <LinkedInSvg size={size} />;
    case 'x_twitter':
      return <XSvg size={size} />;
    case 'snapchat':
      return <SnapchatSvg size={size} />;
    case 'threads':
      return <ThreadsSvg size={size} />;
    default:
      return <TikTokSvg size={size} />;
  }
};

interface PlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  countNumeric: number;
  bgTint: string;
  connected: boolean;
  canAdd: boolean;
}

const INITIAL_PLATFORMS: PlatformAccount[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@pablo.creates',
    followers: '12.4K',
    countNumeric: 12400,
    bgTint: '#F1F5F9',
    connected: true,
    canAdd: false,
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    handle: '@pablocreates',
    followers: '7.8K',
    countNumeric: 7800,
    bgTint: '#FDF2F8',
    connected: true,
    canAdd: false,
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    handle: 'Pablo Creates',
    followers: '4.6K',
    countNumeric: 4600,
    bgTint: '#FEF2F2',
    connected: false,
    canAdd: true,
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

// TIMEFRAME DATASETS FOR 7D, 1M, 3M
export type TimeframeMode = '7d' | '1m' | '3m';

export interface VelocityItem {
  id: string;
  label: string;
  fullDate: string;
  gain: number;
  displayGain: string;
  barHeightRatio: number;
  highlightText: string;
}

const TIMEFRAME_DATA: Record<TimeframeMode, VelocityItem[]> = {
  '7d': [
    { id: 'mon', label: 'Mon', fullDate: 'Monday, Aug 12', gain: 120, displayGain: '+120', barHeightRatio: 0.35, highlightText: 'Routine morning story post' },
    { id: 'tue', label: 'Tue', fullDate: 'Tuesday, Aug 13', gain: 160, displayGain: '+160', barHeightRatio: 0.47, highlightText: 'Reel carousel reach boost' },
    { id: 'wed', label: 'Wed', fullDate: 'Wednesday, Aug 14', gain: 140, displayGain: '+140', barHeightRatio: 0.41, highlightText: 'Collab comment exchange' },
    { id: 'thu', label: 'Thu', fullDate: 'Thursday, Aug 15', gain: 340, displayGain: '+340', barHeightRatio: 1.0, highlightText: '⚡ Viral TikTok educational breakdown' },
    { id: 'fri', label: 'Fri', fullDate: 'Friday, Aug 16', gain: 210, displayGain: '+210', barHeightRatio: 0.62, highlightText: 'High saves from Thursday surge' },
    { id: 'sat', label: 'Sat', fullDate: 'Saturday, Aug 17', gain: 180, displayGain: '+180', barHeightRatio: 0.53, highlightText: 'Weekend creator Q&A' },
    { id: 'sun', label: 'Sun', fullDate: 'Sunday, Aug 18', gain: 130, displayGain: '+130', barHeightRatio: 0.38, highlightText: 'Weekly summary reel' },
  ],
  '1m': [
    { id: 'w1', label: 'W1', fullDate: 'Jul 21 - Jul 27', gain: 680, displayGain: '+680', barHeightRatio: 0.53, highlightText: 'Initial hook optimization experiment' },
    { id: 'w2', label: 'W2', fullDate: 'Jul 28 - Aug 03', gain: 840, displayGain: '+840', barHeightRatio: 0.65, highlightText: 'Instagram Reels reach expanded' },
    { id: 'w3', label: 'W3', fullDate: 'Aug 04 - Aug 10', gain: 1060, displayGain: '+1,060', barHeightRatio: 0.83, highlightText: 'Double posting schedule initiated' },
    { id: 'w4', label: 'W4 (Now)', fullDate: 'Aug 11 - Aug 18', gain: 1280, displayGain: '+1,280', barHeightRatio: 1.0, highlightText: '⚡ Best month week recorded!' },
  ],
  '3m': [
    { id: 'm1', label: 'Jun', fullDate: 'June 2026', gain: 2840, displayGain: '+2.8K', barHeightRatio: 0.54, highlightText: 'Foundational audience establishment' },
    { id: 'm2', label: 'Jul', fullDate: 'July 2026', gain: 3950, displayGain: '+3.9K', barHeightRatio: 0.76, highlightText: 'Viral education series started' },
    { id: 'm3', label: 'Aug (MTD)', fullDate: 'August 2026', gain: 5210, displayGain: '+5.2K', barHeightRatio: 1.0, highlightText: '⚡ Record multi-channel surge (+32%)' },
  ],
};

interface AudienceBreakdownScreenProps {
  onBack: () => void;
  onOpenPostPerformance?: () => void;
  onOpenPlatformGrowth?: () => void;
  onOpenEarnings?: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenCreate?: (prefillTopic?: string) => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onOpenPlatformConnect?: () => void;
  onOpenMessages?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const AudienceBreakdownScreen: React.FC<AudienceBreakdownScreenProps> = ({
  onBack,
  onOpenPostPerformance,
  onOpenPlatformGrowth,
  onOpenEarnings,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenCreate,
  onOpenPostComposer,
  onOpenPlatformConnect,
  onOpenMessages,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeSegmentTab, setActiveSegmentTab] = useState<'overview' | 'posts'>('overview');
  const [activeTab, setActiveTab] = useState<TabType>('growth');

  // Timeline mode (7d, 1m, 3m)
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeMode>('7d');
  const [selectedItemId, setSelectedItemId] = useState<string>('thu'); // default peak Thursday

  // Platform state list
  const [platformsList, setPlatformsList] = useState<PlatformAccount[]>(INITIAL_PLATFORMS);
  const [customHandleInput, setCustomHandleInput] = useState('');
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState('youtube');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showJarvisExplanationModal, setShowJarvisExplanationModal] = useState(false);
  const [showConnectPlatformModal, setShowConnectPlatformModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Pro Unlock
  const [isProUnlocked, setIsProUnlocked] = useState(false);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const toastFade = useRef(new Animated.Value(0)).current;

  // Active dataset
  const currentDataset = TIMEFRAME_DATA[selectedTimeframe];
  const activeItem = currentDataset.find((i) => i.id === selectedItemId) || currentDataset[currentDataset.length - 1];

  // Calculate live dynamic total audience based on connected platforms
  const totalAudienceCount = platformsList
    .filter((p) => p.connected)
    .reduce((acc, curr) => acc + curr.countNumeric, 4600);

  const formattedTotalAudience = (totalAudienceCount / 1000).toFixed(1) + 'K';

  useEffect(() => {
    // Floating jarvis icon animation
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    loopAnim.start();

    return () => loopAnim.stop();
  }, []);

  const triggerModalAnim = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      tension: 65,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastFade.setValue(0);
    Animated.sequence([
      Animated.timing(toastFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastFade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleTimeframeChange = (mode: TimeframeMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTimeframe(mode);
    const newDataset = TIMEFRAME_DATA[mode];
    // Select peak or latest in that timeframe
    if (mode === '7d') {
      setSelectedItemId('thu');
      showToast('Showing 7-day daily traffic breakdown');
    } else if (mode === '1m') {
      setSelectedItemId('w4');
      showToast('Showing 1-month weekly velocity trend');
    } else {
      setSelectedItemId('m3');
      showToast('Showing 3-month growth trajectory');
    }
  };

  const handleOpenConnectPlatforms = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    triggerModalAnim();
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
    showToast(`✓ ${targetPlat?.name || 'Platform'} connected! +${targetPlat?.followers} synced.`);
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

  const handleCreateSimilarPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const topic = '3 systems that help creators stay consistent';
    if (onOpenPostComposer) {
      onOpenPostComposer(topic);
    } else if (onOpenCreate) {
      onOpenCreate(topic);
    } else if (onNavigateTab) {
      onNavigateTab('create');
    }
  };

  const handleUnlockPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsProUnlocked(true);
    setShowCelebrationModal(true);
  };

  const connectedCount = platformsList.filter((p) => p.connected).length;
  const availableToAdd = platformsList.filter((p) => !p.connected);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP HEADER */}
        <View style={styles.header}>
          {/* Back Button */}
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
                  d="M15 18L9 12L15 6"
                  stroke="#171420"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Mascot */}
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/ghost-alone.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Center Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleText}>Audience Growth</Text>
            <Text style={styles.headerSubtitleText}>⚡ +1,280 Weekly Velocity</Text>
          </View>

          {/* Right Header Icons: Messages & Profile */}
          <View style={styles.headerRight}>
            {/* Messages Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
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
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.headerNotifDot} />
            </Pressable>

            {/* Profile Avatar Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalAnim();
                setShowProfileModal(true);
              }}
              hitSlop={8}
            >
              <Image
                source={
                  userProfile?.avatarSource ||
                  require('../../assets/images/jarvis-ghost-clean.png')
                }
                style={styles.headerPartnerMiniAvatar}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOAST BANNER */}
          {toastMessage && (
            <Animated.View style={[styles.toastBanner, { opacity: toastFade }]}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}

          {/* SEGMENT TABS PILLS: AUDIENCE OVERVIEW | POST ANALYTICS */}
          <View style={styles.segmentPillContainer}>
            <Pressable
              style={[
                styles.segmentPill,
                activeSegmentTab === 'overview' && styles.segmentPillActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveSegmentTab('overview');
              }}
            >
              <Text
                style={[
                  styles.segmentPillText,
                  activeSegmentTab === 'overview' && styles.segmentPillTextActive,
                ]}
              >
                AUDIENCE OVERVIEW
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentPill,
                activeSegmentTab === 'posts' && styles.segmentPillActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveSegmentTab('posts');
                showToast('Viewing individual post retention curves');
              }}
            >
              <Text
                style={[
                  styles.segmentPillText,
                  activeSegmentTab === 'posts' && styles.segmentPillTextActive,
                ]}
              >
                POST ANALYTICS
              </Text>
            </Pressable>
          </View>

          {/* HERO SECTION TITLE */}
          <Text style={styles.mainTitle}>Understand your audience growth</Text>
          <Text style={styles.mainSubtitle}>
            See your total audience, weekly growth, platform split and fastest growing channel.
          </Text>

          {/* CARD 1: TOTAL AUDIENCE HERO CARD */}
          <View style={styles.audienceCard}>
            <View style={styles.audienceCardTopRow}>
              <Text style={styles.cardHeaderLabel}>TOTAL AUDIENCE</Text>
              <View style={styles.growthBadgePill}>
                <Text style={styles.growthBadgeText}>📈 +1,280</Text>
                <Text style={styles.growthBadgeSub}>(+5.4% THIS WK)</Text>
              </View>
            </View>

            <Text style={styles.totalAudienceBigNumber}>{formattedTotalAudience}</Text>

            {/* MULTI-SEGMENT PLATFORM DISTRIBUTION BAR */}
            <View style={styles.multiSegmentBar}>
              <View style={[styles.segmentPortion, { flex: 50, backgroundColor: '#582CDB' }]} />
              <View style={[styles.segmentPortion, { flex: 30, backgroundColor: '#8B5CF6' }]} />
              <View style={[styles.segmentPortion, { flex: 15, backgroundColor: '#F59E0B' }]} />
              <View style={[styles.segmentPortion, { flex: 5, backgroundColor: '#CBD5E1' }]} />
            </View>

            {/* DISTRIBUTION LEGEND */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#582CDB' }]} />
                <Text style={styles.legendLabel}>TT</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendLabel}>IG</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendLabel}>YT</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
                <Text style={styles.legendLabel}>Other</Text>
              </View>
            </View>

            {/* ACTION BUTTON: CONNECT PLATFORM */}
            <View style={styles.cardActionsCol}>
              <Pressable
                style={({ pressed }) => [styles.purpleActionBtn, pressed && styles.btnPressed]}
                onPress={handleOpenConnectPlatforms}
              >
                <LinearGradient
                  colors={['#582CDB', '#4318FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.purpleActionGradient}
                >
                  <Text style={styles.purpleActionBtnText}>
                    CONNECT PLATFORM ({connectedCount} ACTIVE)
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* CARD 2: ELEVATED TIMELINE GRAPH (7D, 1M, 3M) WITH SINGLE-SELECT PURPLE    */}
          {/* ========================================================================= */}
          <View style={styles.velocityCard}>
            {/* Top Bar with Live Indicator & Timeframe Toggle: 7d | 1m | 3m */}
            <View style={styles.velocityCardTopRow}>
              <View style={styles.velocityTitleGroup}>
                <View style={styles.velocityPulseDot} />
                <Text style={styles.cardHeaderLabel}>AUDIENCE VELOCITY &amp; TRAFFIC</Text>
              </View>

              {/* TIMEFRAME TOGGLE CHIPS: 7D | 1M | 3M */}
              <View style={styles.timeframeChipsRow}>
                <Pressable
                  style={[
                    styles.timeframeChip,
                    selectedTimeframe === '7d' && styles.timeframeChipActive,
                  ]}
                  onPress={() => handleTimeframeChange('7d')}
                >
                  <Text
                    style={[
                      styles.timeframeChipText,
                      selectedTimeframe === '7d' && styles.timeframeChipTextActive,
                    ]}
                  >
                    7d
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.timeframeChip,
                    selectedTimeframe === '1m' && styles.timeframeChipActive,
                  ]}
                  onPress={() => handleTimeframeChange('1m')}
                >
                  <Text
                    style={[
                      styles.timeframeChipText,
                      selectedTimeframe === '1m' && styles.timeframeChipTextActive,
                    ]}
                  >
                    1m
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.timeframeChip,
                    selectedTimeframe === '3m' && styles.timeframeChipActive,
                  ]}
                  onPress={() => handleTimeframeChange('3m')}
                >
                  <Text
                    style={[
                      styles.timeframeChipText,
                      selectedTimeframe === '3m' && styles.timeframeChipTextActive,
                    ]}
                  >
                    3m
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Big Metric Display for Selected Bar */}
            <View style={styles.velocityHeroBlock}>
              <View style={styles.velocityMetricRow}>
                <Text style={styles.velocityNumber}>{activeItem.displayGain}</Text>
                <Text style={styles.velocitySubtext}>
                  {selectedTimeframe === '7d' ? 'DAILY GAIN' : selectedTimeframe === '1m' ? 'WEEKLY GAIN' : 'MONTHLY GAIN'}
                </Text>
              </View>

              {/* Surge Badge */}
              <View style={styles.velocitySurgeBadge}>
                <Text style={styles.velocitySurgeText}>
                  {selectedTimeframe === '7d' ? '🔥 Top Surge Day' : selectedTimeframe === '1m' ? '⚡ +43.8% vs W1' : '🚀 +83.4% QoQ'}
                </Text>
              </View>
            </View>

            {/* Interactive Selected Detail Row */}
            <View style={styles.velocityContextRow}>
              <Text style={styles.velocityContextDate}>{activeItem.fullDate}</Text>
              <Text style={styles.velocityContextHighlight}>{activeItem.highlightText}</Text>
            </View>

            {/* INTERACTIVE TIMELINE BARS (SINGLE-SELECT PURPLE GRADIENT) */}
            <View style={styles.velocityBarsVisualizerContainer}>
              <View style={styles.velocityBarsGrid}>
                {currentDataset.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const heightPx = Math.max(32, item.barHeightRatio * 96);

                  return (
                    <Pressable
                      key={item.id}
                      style={styles.velocityBarColumn}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedItemId(item.id);
                      }}
                    >
                      {/* Gain Number Above Bar */}
                      <View
                        style={[
                          styles.barGainBadge,
                          isSelected && styles.barGainBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.barGainBadgeText,
                            isSelected && styles.barGainBadgeTextActive,
                          ]}
                        >
                          {item.displayGain}
                        </Text>
                      </View>

                      {/* Bar Track & Fill: PURPLE IF AND ONLY IF SELECTED */}
                      <View style={styles.barPillTrack}>
                        <View
                          style={[
                            styles.barPillFill,
                            { height: heightPx },
                            isSelected
                              ? styles.barPillFillActive
                              : styles.barPillFillInactive,
                          ]}
                        >
                          {isSelected && (
                            <LinearGradient
                              colors={['#8B5CF6', '#582CDB', '#4318FF']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={StyleSheet.absoluteFill}
                            />
                          )}
                        </View>
                      </View>

                      {/* Timeframe Label Below Bar */}
                      <Text
                        style={[
                          styles.barWeekLabel,
                          isSelected && styles.barWeekLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* GOAL TARGET TRACKER */}
            <View style={styles.velocityGoalBox}>
              <View style={styles.velocityGoalTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>🎯</Text>
                  <Text style={styles.velocityGoalTitle}>
                    {selectedTimeframe === '7d' ? '7-Day Target' : selectedTimeframe === '1m' ? 'Monthly Creator Target' : 'Quarterly Milestone'}
                  </Text>
                </View>
                <Text style={styles.velocityGoalScore}>
                  {selectedTimeframe === '7d' ? '1,280 / 1,500 (85.3%)' : selectedTimeframe === '1m' ? '3,860 / 4,000 (96.5%)' : '12.0K / 15.0K (80.0%)'}
                </Text>
              </View>

              {/* Progress Line */}
              <View style={styles.velocityGoalTrack}>
                <LinearGradient
                  colors={['#582CDB', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.velocityGoalFill,
                    {
                      width:
                        selectedTimeframe === '7d'
                          ? '85.3%'
                          : selectedTimeframe === '1m'
                          ? '96.5%'
                          : '80.0%',
                    },
                  ]}
                />
              </View>
              <Text style={styles.velocityGoalSub}>
                {selectedTimeframe === '7d'
                  ? '⚡ Only 220 followers to reach your 7-day streak target!'
                  : selectedTimeframe === '1m'
                  ? '🚀 140 followers away from achieving your monthly creator record!'
                  : '👑 On track to exceed your Q3 creator milestone!'}
              </Text>
            </View>

            {/* 3 QUICK VELOCITY INSIGHT PILLS */}
            <View style={styles.velocityStatsGrid}>
              <View style={styles.velocityMiniStatBox}>
                <Text style={styles.velocityMiniLabel}>AVG RUN-RATE</Text>
                <Text style={styles.velocityMiniValue}>
                  {selectedTimeframe === '7d' ? '+183 / day' : selectedTimeframe === '1m' ? '+965 / wk' : '+4.0K / mo'}
                </Text>
                <Text style={styles.velocityMiniSub}>📈 +34% pace</Text>
              </View>

              <View style={styles.velocityMiniStatBox}>
                <Text style={styles.velocityMiniLabel}>PEAK MOMENTUM</Text>
                <Text style={styles.velocityMiniValue}>
                  {selectedTimeframe === '7d' ? 'Thu (+340)' : selectedTimeframe === '1m' ? 'W4 (+1.28K)' : 'Aug (+5.2K)'}
                </Text>
                <Text style={styles.velocityMiniSub}>🎬 Viral Series</Text>
              </View>

              <View style={styles.velocityMiniStatBox}>
                <Text style={styles.velocityMiniLabel}>ENGAGEMENT</Text>
                <Text style={styles.velocityMiniValue}>
                  {selectedTimeframe === '7d' ? '8.4%' : selectedTimeframe === '1m' ? '9.1%' : '11.3%'}
                </Text>
                <Text style={styles.velocityMiniSub}>🟢 Top 5%</Text>
              </View>
            </View>
          </View>

          {/* SECTION: PLATFORM SPLIT */}
          <Text style={styles.sectionHeaderTitle}>Platform Split</Text>

          <View style={styles.platformSplitCard}>
            {/* TikTok Row */}
            <View style={styles.splitItem}>
              <View style={styles.splitHeaderRow}>
                <View style={styles.splitNameRow}>
                  <View style={[styles.platformIndicatorDot, { backgroundColor: '#582CDB' }]} />
                  <Text style={styles.splitPlatformName}>TikTok</Text>
                </View>
                <Text style={styles.splitPercentage}>65%</Text>
              </View>
              <View style={styles.splitProgressTrack}>
                <View style={[styles.splitProgressFill, { width: '65%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            {/* Instagram Row */}
            <View style={styles.splitItem}>
              <View style={styles.splitHeaderRow}>
                <View style={styles.splitNameRow}>
                  <View style={[styles.platformIndicatorDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.splitPlatformName}>Instagram</Text>
                </View>
                <Text style={styles.splitPercentage}>25%</Text>
              </View>
              <View style={styles.splitProgressTrack}>
                <View style={[styles.splitProgressFill, { width: '25%', backgroundColor: '#8B5CF6' }]} />
              </View>
            </View>

            {/* YouTube Shorts Row */}
            <View style={styles.splitItem}>
              <View style={styles.splitHeaderRow}>
                <View style={styles.splitNameRow}>
                  <View style={[styles.platformIndicatorDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.splitPlatformName}>YouTube Shorts</Text>
                </View>
                <Text style={styles.splitPercentage}>10%</Text>
              </View>
              <View style={styles.splitProgressTrack}>
                <View style={[styles.splitProgressFill, { width: '10%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>

          {/* CARD 3: FASTEST GROWING PLATFORM SPOTLIGHT (PREMIUM PURPLE/IVORY STYLING) */}
          <View style={styles.spotlightCard}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.fastestBadge}>
                <Text style={{ fontSize: 12 }}>⚡</Text>
                <Text style={styles.fastestBadgeText}>FASTEST GROWING PLATFORM</Text>
              </View>
              <View style={styles.spotlightSurgePill}>
                <Text style={styles.spotlightSurgePillText}>📈 +22% VELOCITY</Text>
              </View>
            </View>

            <View style={styles.spotlightPlatformRow}>
              <View style={styles.spotlightIconBadge}>
                <TikTokSvg size={22} />
              </View>
              <View>
                <Text style={styles.spotlightPlatformTitle}>TikTok</Text>
                <Text style={styles.spotlightPlatformSubtitle}>+840 new followers this week</Text>
              </View>
            </View>

            <View style={styles.bestContentBox}>
              <Text style={styles.bestContentLabel}>TOP PERFORMING NICHE &amp; ANGLE</Text>
              <Text style={styles.bestContentTitle}>Creator advice &amp; educational breakdowns</Text>
              <Text style={styles.bestContentSub}>Drives 3.4x more saves &amp; 68% longer average retention</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.createSimilarBtn, pressed && styles.btnPressed]}
              onPress={handleCreateSimilarPost}
            >
              <LinearGradient
                colors={['#582CDB', '#4318FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createSimilarGradient}
              >
                <Text style={styles.createSimilarBtnText}>✨ CREATE SIMILAR POST ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 4 PLATFORM STATS GRID (2x2) WITH AUTHENTIC BRAND SVG ICONS */}
          <View style={styles.platformGrid2x2}>
            {platformsList.slice(0, 4).map((plat) => (
              <View key={plat.id} style={styles.platformGridBox}>
                <View style={styles.platformGridHeader}>
                  <View style={[styles.platformMiniIconBadge, { backgroundColor: plat.bgTint }]}>
                    {renderPlatformBrandIcon(plat.id, 18)}
                  </View>
                  {plat.connected ? (
                    <View style={styles.connectedTag}>
                      <Text style={styles.connectedTagText}>CONNECTED</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleConnectSinglePlatform(plat.id)}
                      hitSlop={6}
                    >
                      <Text style={styles.connectLinkText}>+ CONNECT</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.platformGridLabel}>{plat.name.split(' ')[0]}</Text>
                <Text style={styles.platformGridMetric}>
                  {plat.connected ? plat.followers : '—'}
                </Text>
              </View>
            ))}
          </View>

          {/* CARD 5: AUDIENCE INSIGHT CALLOUT */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeaderRow}>
              <View style={styles.insightBulbCircle}>
                <Text style={{ fontSize: 14 }}>💡</Text>
              </View>
              <Text style={styles.insightTitleText}>Audience Insight</Text>
            </View>

            <Text style={styles.insightBodyText}>
              Your audience responds most to practical creator education. This content drives 3x more shares than lifestyle posts.
            </Text>

            <View style={styles.recommendedNextPostBox}>
              <Text style={styles.recommendedLabel}>RECOMMENDED NEXT POST</Text>
              <Text style={styles.recommendedTitle}>"3 systems that help creators stay consistent"</Text>
            </View>
          </View>

          {/* CARD 6: QUALITY SIGNALS */}
          <View style={styles.qualitySignalsCard}>
            <Text style={styles.cardHeaderLabel}>QUALITY SIGNALS</Text>

            <View style={styles.qualityRow}>
              <View style={styles.qualityRowLeft}>
                <Text style={{ fontSize: 16 }}>💾</Text>
                <Text style={styles.qualityName}>Saves</Text>
              </View>
              <View style={styles.qualityBadgeStrong}>
                <Text style={styles.qualityBadgeStrongText}>STRONG</Text>
              </View>
            </View>

            <View style={styles.qualityDivider} />

            <View style={styles.qualityRow}>
              <View style={styles.qualityRowLeft}>
                <Text style={{ fontSize: 16 }}>💬</Text>
                <Text style={styles.qualityName}>Comments</Text>
              </View>
              <View style={styles.qualityBadgeSteady}>
                <Text style={styles.qualityBadgeSteadyText}>STEADY</Text>
              </View>
            </View>

            <View style={styles.qualityDivider} />

            <View style={styles.qualityRow}>
              <View style={styles.qualityRowLeft}>
                <Text style={{ fontSize: 16 }}>↗️</Text>
                <Text style={styles.qualityName}>Shares</Text>
              </View>
              <View style={styles.qualityBadgeVeryHigh}>
                <Text style={styles.qualityBadgeVeryHighText}>VERY HIGH</Text>
              </View>
            </View>
          </View>

          {/* CARD 7: LOCKED IN PRO - ADVANCED DEMOGRAPHICS */}
          <View style={styles.lockedProCard}>
            <View style={styles.lockedPillRow}>
              <View style={styles.lockedPill}>
                <Text style={styles.lockedPillText}>🔒 LOCKED IN PRO</Text>
              </View>
            </View>

            <Text style={styles.lockedTitle}>Advanced Demographics</Text>
            <Text style={styles.lockedSubtitle}>
              Get deep insights into who is following you and when they are active.
            </Text>

            <View style={styles.lockedList}>
              <View style={styles.lockedItemRow}>
                <Text style={styles.lockedItemText}>Audience Age &amp; Gender</Text>
                <Text style={styles.lockedItemIcon}>
                  {isProUnlocked ? '18-24 (62%)' : '🔒'}
                </Text>
              </View>
              <View style={styles.lockedDivider} />
              <View style={styles.lockedItemRow}>
                <Text style={styles.lockedItemText}>Top Locations &amp; Cities</Text>
                <Text style={styles.lockedItemIcon}>
                  {isProUnlocked ? 'Lagos, London, NYC' : '🔒'}
                </Text>
              </View>
              <View style={styles.lockedDivider} />
              <View style={styles.lockedItemRow}>
                <Text style={styles.lockedItemText}>Peak Active Times</Text>
                <Text style={styles.lockedItemIcon}>
                  {isProUnlocked ? '7:30 PM - 9:00 PM' : '🔒'}
                </Text>
              </View>
              <View style={styles.lockedDivider} />
              <View style={styles.lockedItemRow}>
                <Text style={styles.lockedItemText}>Audience Interest Cloud</Text>
                <Text style={styles.lockedItemIcon}>
                  {isProUnlocked ? 'AI, Creator Tools' : '🔒'}
                </Text>
              </View>
            </View>

            {/* LUXURY GOLD UNLOCK PRO BUTTON */}
            <Pressable
              style={({ pressed }) => [styles.unlockAnalyticsBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  handleUnlockPro();
                }
              }}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockGradient}
              >
                <Text style={styles.unlockAnalyticsBtnText}>
                  Unlock Audience Analytics (Pro) ➔
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 8: JARVIS CORE INSIGHT CARD */}
          <View style={styles.jarvisCoreCard}>
            <View style={styles.jarvisCoreAvatarBox}>
              <Image
                source={require('../../assets/images/ghost-alone.png')}
                style={styles.jarvisCoreFlameImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.jarvisCoreLabel}>JARVIS CORE INSIGHT 4</Text>
            <Text style={styles.jarvisCoreText}>
              Your strongest audience signal is TikTok. Create more creator education posts there, then repurpose the best ones to Instagram and YouTube Shorts.
            </Text>

            <View style={styles.jarvisActionLinksRow}>
              <Pressable
                onPress={() => setShowJarvisExplanationModal(true)}
                hitSlop={6}
              >
                <Text style={styles.jarvisLinkText}>How did you calculate this?</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            if (onNavigateTab) {
              onNavigateTab(tab);
            }
          }}
        />

        {/* ========================================================================= */}
        {/* COMPREHENSIVE CONNECT PLATFORMS & SYNC HUB POPUP MODAL                     */}
        {/* ========================================================================= */}
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
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalTitle}>Connected Platforms</Text>
                    <View style={styles.activePlatformsCountBadge}>
                      <Text style={styles.activePlatformsCountText}>
                        {connectedCount} Connected
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
                          {renderPlatformBrandIcon(plat.id, 20)}
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
                  AVAILABLE PLATFORMS TO ADD ({availableToAdd.length})
                </Text>
                <Text style={styles.modalSubDescription}>
                  Connect more platforms to aggregate your cross-channel creator reach:
                </Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {availableToAdd.map((plat) => (
                    <View key={plat.id} style={styles.availablePlatformRow}>
                      <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                        {renderPlatformBrandIcon(plat.id, 20)}
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
                            {renderPlatformBrandIcon(p.id, 14)}
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

        {/* MODAL: JARVIS CALCULATION EXPLANATION */}
        <Modal
          visible={showJarvisExplanationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJarvisExplanationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardLarge}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Jarvis Intelligence Model</Text>
                  <Text style={styles.modalSubtitle}>How your audience signal was calculated</Text>
                </View>
                <Pressable
                  onPress={() => setShowJarvisExplanationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
                <View style={styles.modalCalcCard}>
                  <Text style={styles.modalCalcTitle}>1. Retention Ratio</Text>
                  <Text style={styles.modalCalcBody}>
                    Your TikTok videos average 64.2% completion rate on educational topics vs 32.1% on lifestyle vlogs.
                  </Text>
                </View>
                <View style={styles.modalCalcCard}>
                  <Text style={styles.modalCalcTitle}>2. High-Intent Saves</Text>
                  <Text style={styles.modalCalcBody}>
                    Every 100 views on educational advice generate 14.8 saves, signaling strong evergreen authority.
                  </Text>
                </View>
                <View style={styles.modalCalcCard}>
                  <Text style={styles.modalCalcTitle}>3. Cross-Platform Growth</Text>
                  <Text style={styles.modalCalcBody}>
                    Repurposing to Instagram Reels captures a 2.4x higher non-follower reach when using the same 3-second hook.
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => setShowJarvisExplanationModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Got it, thanks! 🚀</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title="Audience Analytics Unlocked! 🚀"
          subtitle="You now have unrestricted access to Audience Age, Top Locations, and Peak Active Times."
          badgeText="PRO UNLOCKED"
          xpEarned={100}
          streakCount={47}
          actionText="Explore Demographics ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
          }}
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
    backgroundColor: '#FAF8F5',
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFEA',
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerLogoWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 28,
    height: 28,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerNotifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  headerProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#582CDB',
  },
  headerPartnerMiniAvatar: {
    width: '100%',
    height: '100%',
  },

  // SCROLL BODY
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Toast
  toastBanner: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // Segment Tabs Pills
  segmentPillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  segmentPillActive: {
    backgroundColor: '#582CDB',
  },
  segmentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  segmentPillTextActive: {
    color: '#FFFFFF',
  },

  // Main Titles
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },

  // Card 1: Total Audience Card
  audienceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  audienceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  growthBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
  },
  growthBadgeSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  totalAudienceBigNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -1,
    marginBottom: 14,
  },
  multiSegmentBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  segmentPortion: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cardActionsCol: {
    gap: 8,
  },
  purpleActionBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  purpleActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purpleActionBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // =========================================================================
  // CARD 2: ELEVATED TIMELINE GRAPH STYLES (7D, 1M, 3M)
  // =========================================================================
  velocityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  velocityCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  velocityTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  velocityPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  timeframeChipsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  timeframeChip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  timeframeChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  timeframeChipTextActive: {
    color: '#582CDB',
    fontWeight: '900',
  },

  // Velocity Hero Block
  velocityHeroBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  velocityMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  velocityNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.6,
  },
  velocitySubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  velocitySurgeBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  velocitySurgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#059669',
  },

  // Velocity Context Row
  velocityContextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  velocityContextDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  velocityContextHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Velocity Bars Visualizer Container
  velocityBarsVisualizerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  velocityBarsGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
  },
  velocityBarColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
  },
  barGainBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  barGainBadgeActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  barGainBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
  },
  barGainBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  barPillTrack: {
    width: '100%',
    maxWidth: 24,
    height: 96,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barPillFill: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  barPillFillActive: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  barPillFillInactive: {
    backgroundColor: '#CBD5E1',
  },
  barWeekLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
  },
  barWeekLabelActive: {
    color: '#582CDB',
    fontWeight: '900',
  },

  // Goal Box
  velocityGoalBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 14,
  },
  velocityGoalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  velocityGoalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  velocityGoalScore: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },
  velocityGoalTrack: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  velocityGoalFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  velocityGoalSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B21A8',
  },

  // 3 Mini Stat Pills
  velocityStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  velocityMiniStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  velocityMiniLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  velocityMiniValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  velocityMiniSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 2,
  },

  // Section: Platform Split
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  platformSplitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    gap: 16,
    marginBottom: 16,
  },
  splitItem: {},
  splitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splitPlatformName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  splitPercentage: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  splitProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  splitProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Card 3: Spotlight Card (Premium Purple & Soft Ivory)
  spotlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  spotlightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  fastestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5FF',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  fastestBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  spotlightSurgePill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  spotlightSurgePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.3,
  },
  spotlightPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  spotlightIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  spotlightPlatformTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  spotlightPlatformSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  bestContentBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 3.5,
    borderLeftColor: '#582CDB',
    borderWidth: 1,
    borderColor: '#F1EFEA',
  },
  bestContentLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  bestContentTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 3,
  },
  bestContentSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  createSimilarBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  createSimilarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createSimilarBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // 4 Platform Stats Grid (2x2)
  platformGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  platformGridBox: {
    width: (SCREEN_WIDTH - 50) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
  },
  platformGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformMiniIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectedTag: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  connectedTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#15803D',
  },
  connectLinkText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  platformGridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  platformGridMetric: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    marginTop: 2,
  },

  // Card 5: Audience Insight Callout
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 16,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightBulbCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTitleText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  insightBodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 12,
  },
  recommendedNextPostBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#582CDB',
  },
  recommendedLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recommendedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },

  // Card 6: Quality Signals
  qualitySignalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 16,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  qualityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  qualityBadgeStrong: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityBadgeStrongText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  qualityBadgeSteady: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityBadgeSteadyText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
  },
  qualityBadgeVeryHigh: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityBadgeVeryHighText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  qualityDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Card 7: Locked in Pro (Signature Gold Luxury Theme)
  lockedProCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  lockedPillRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  lockedPill: {
    backgroundColor: '#FEF9C3',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  lockedPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#A16207',
    letterSpacing: 0.5,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  lockedList: {
    gap: 8,
    marginBottom: 16,
  },
  lockedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lockedItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  lockedItemIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  lockedDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  unlockAnalyticsBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockAnalyticsBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // Card 8: Jarvis Core Insight
  jarvisCoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 20,
  },
  jarvisCoreAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  jarvisCoreFlameImg: {
    width: 32,
    height: 32,
  },
  jarvisCoreLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  jarvisCoreText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 12,
  },
  jarvisActionLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  jarvisLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    textDecorationLine: 'underline',
  },

  // Bottom Actions Container
  bottomActionsContainer: {
    gap: 10,
    alignItems: 'center',
  },
  bottomActionPrimary: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bottomGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPrimaryText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomActionSecondary: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSecondaryText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: 0.5,
  },
  bottomActionUpgrade: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomUpgradeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  backToGrowthBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backToGrowthText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: 0.6,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 40 : 20,
  },
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
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  activePlatformsCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  activePlatformsCountText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  modalSubtitle: {
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  modalSectionTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  modalSubDescription: {
    fontSize: 11.5,
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
    borderColor: '#E2E8F0',
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  autoSyncBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  autoSyncText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#059669',
  },
  platformSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  removePlatformBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removePlatformBtnText: {
    fontSize: 10.5,
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
    fontWeight: '900',
    color: '#582CDB',
  },

  // Custom Account Linker
  customAddAccountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  customAddTitle: {
    fontSize: 10,
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

  modalCalcCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCalcTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 3,
  },
  modalCalcBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
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
});
