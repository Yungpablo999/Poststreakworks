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

// Authentic Social SVG Icons
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

const XSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </Svg>
);

interface PlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  countNumeric: number;
  iconEmoji: string;
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
    iconEmoji: '🎬',
    bgTint: '#EDE9FE',
    connected: true,
    canAdd: false,
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    handle: '@pablocreates',
    followers: '7.8K',
    countNumeric: 7800,
    iconEmoji: '📷',
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
    iconEmoji: '📺',
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
    iconEmoji: '💼',
    bgTint: '#F0FDF4',
    connected: false,
    canAdd: true,
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    handle: '@pablocreates',
    followers: '3.1K',
    countNumeric: 3100,
    iconEmoji: '🐦',
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
    iconEmoji: '👻',
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
    iconEmoji: '🧵',
    bgTint: '#F5F3FF',
    connected: false,
    canAdd: true,
  },
];

interface AudienceBreakdownScreenProps {
  onBack: () => void;
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
  const barAnim1 = useRef(new Animated.Value(0)).current;
  const barAnim2 = useRef(new Animated.Value(0)).current;
  const barAnim3 = useRef(new Animated.Value(0)).current;

  // Calculate live dynamic total audience based on connected platforms
  const totalAudienceCount = platformsList
    .filter((p) => p.connected)
    .reduce((acc, curr) => acc + curr.countNumeric, 4600); // 4.6k other base

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

    // Bar progress animations
    Animated.parallel([
      Animated.timing(barAnim1, { toValue: 0.65, duration: 900, useNativeDriver: false }),
      Animated.timing(barAnim2, { toValue: 0.25, duration: 900, useNativeDriver: false }),
      Animated.timing(barAnim3, { toValue: 0.10, duration: 900, useNativeDriver: false }),
    ]).start();

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

  const handleDisconnectSinglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p))
    );
    const targetPlat = platformsList.find((p) => p.id === platformId);
    showToast(`Disconnected ${targetPlat?.name}`);
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
                source={require('../../assets/images/jarvis-core-flame.png')}
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

          {/* CARD 1: TOTAL AUDIENCE HERO CARD (UNLOCK PRO REMOVED AS REQUESTED) */}
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

            {/* ACTION BUTTON INSIDE CARD: CONNECT PLATFORM (POPS UP FULL CONNECTOR) */}
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

          {/* CARD 2: WEEKLY VELOCITY CARD */}
          <View style={styles.velocityCard}>
            <Text style={styles.cardHeaderLabel}>WEEKLY VELOCITY</Text>
            <View style={styles.velocityMetricRow}>
              <Text style={styles.velocityNumber}>+1,280</Text>
              <Text style={styles.velocitySubtext}>NEW FOLLOWERS</Text>
            </View>

            {/* 5 VELOCITY PILL BARS */}
            <View style={styles.velocityPillsRow}>
              <View style={[styles.velocityBar, { height: 20 }]} />
              <View style={[styles.velocityBar, { height: 20 }]} />
              <View style={[styles.velocityBar, { height: 20 }]} />
              <View style={[styles.velocityBar, { height: 20 }]} />
              <View style={[styles.velocityBar, styles.velocityBarActive, { height: 28 }]} />
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

          {/* CARD 3: FASTEST GROWING PLATFORM SPOTLIGHT (WARM AMBER AESTHETIC) */}
          <View style={styles.spotlightCard}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.fastestBadge}>
                <Text style={styles.fastestBadgeText}>FASTEST GROWING PLATFORM</Text>
              </View>
              <Text style={{ fontSize: 18 }}>⚡</Text>
            </View>

            <Text style={styles.spotlightPlatformTitle}>TikTok</Text>
            <Text style={styles.spotlightPlatformSubtitle}>+840 (+22% this week)</Text>

            <View style={styles.bestContentBox}>
              <Text style={styles.bestContentLabel}>BEST CONTENT TYPE</Text>
              <Text style={styles.bestContentTitle}>Creator advice videos</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.createSimilarBtn, pressed && styles.btnPressed]}
              onPress={handleCreateSimilarPost}
            >
              <Text style={styles.createSimilarBtnText}>CREATE SIMILAR POST</Text>
            </Pressable>
          </View>

          {/* 4 PLATFORM STATS GRID (2x2) */}
          <View style={styles.platformGrid2x2}>
            {platformsList.slice(0, 4).map((plat) => (
              <View key={plat.id} style={styles.platformGridBox}>
                <View style={styles.platformGridHeader}>
                  <View style={[styles.platformMiniIconBadge, { backgroundColor: plat.bgTint }]}>
                    <Text style={{ fontSize: 14 }}>{plat.iconEmoji}</Text>
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

            <Pressable
              style={({ pressed }) => [styles.unlockAnalyticsBtn, pressed && styles.btnPressed]}
              onPress={handleUnlockPro}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unlockGradient}
              >
                <Text style={styles.unlockAnalyticsBtnText}>
                  {isProUnlocked ? '✓ Audience Analytics Unlocked' : 'Unlock Audience Analytics'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 8: JARVIS CORE INSIGHT CARD */}
          <View style={styles.jarvisCoreCard}>
            <View style={styles.jarvisCoreAvatarBox}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
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
              <Pressable
                onPress={() => {
                  showToast('Jarvis generating 3 more audience insights...');
                }}
                hitSlop={6}
              >
                <Text style={styles.jarvisLinkText}>Draw more like this</Text>
              </Pressable>
            </View>
          </View>

          {/* 3. BOTTOM ACTION STACK */}
          <View style={styles.bottomActionsContainer}>
            {/* 1. Connect Platform */}
            <Pressable
              style={({ pressed }) => [styles.bottomActionPrimary, pressed && styles.btnPressed]}
              onPress={handleOpenConnectPlatforms}
            >
              <LinearGradient
                colors={['#582CDB', '#4318FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomGradient}
              >
                <Text style={styles.bottomPrimaryText}>
                  CONNECT PLATFORM ({connectedCount} ACTIVE)
                </Text>
              </LinearGradient>
            </Pressable>

            {/* 2. Create Post */}
            <Pressable
              style={({ pressed }) => [styles.bottomActionSecondary, pressed && styles.btnPressed]}
              onPress={handleCreateSimilarPost}
            >
              <Text style={styles.bottomSecondaryText}>CREATE POST</Text>
            </Pressable>

            {/* 3. Upgrade Plan */}
            <Pressable
              style={({ pressed }) => [styles.bottomActionUpgrade, pressed && styles.btnPressed]}
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
              <Text style={styles.bottomUpgradeText}>UPGRADE PLAN</Text>
            </Pressable>

            {/* 4. Back to Growth Center */}
            <Pressable
              style={({ pressed }) => [styles.backToGrowthBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onBack();
              }}
              hitSlop={8}
            >
              <Text style={styles.backToGrowthText}>BACK TO GROWTH CENTER</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
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
                          <Text style={{ fontSize: 18 }}>{plat.iconEmoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.platformNameText}>{plat.name}</Text>
                            <View style={styles.autoSyncBadge}>
                              <Text style={styles.autoSyncText}>🟢 Auto-Sync</Text>
                            </View>
                          </View>
                          <Text style={styles.platformSubText}>
                            {plat.handle} • ⚡ {plat.followers} Followers
                          </Text>
                        </View>
                        <Pressable
                          style={styles.disconnectBtn}
                          onPress={() => handleDisconnectSinglePlatform(plat.id)}
                          hitSlop={6}
                        >
                          <Text style={styles.disconnectBtnText}>Manage</Text>
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
                        <Text style={{ fontSize: 18 }}>{plat.iconEmoji}</Text>
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

                  {/* Channel Chips */}
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
                          <Text
                            style={[
                              styles.platformSelectChipText,
                              isChosen && styles.platformSelectChipTextActive,
                            ]}
                          >
                            {p.iconEmoji} {p.name.split(' ')[0]}
                          </Text>
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

  // Card 1: Total Audience Card (Clean without Unlock Pro)
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

  // Card 2: Weekly Velocity Card
  velocityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 20,
  },
  velocityMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
    marginBottom: 14,
  },
  velocityNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
  },
  velocitySubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  velocityPillsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  velocityBar: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: '#E2E8F0',
  },
  velocityBarActive: {
    backgroundColor: '#582CDB',
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

  // Card 3: Spotlight Card (Warm Amber)
  spotlightCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 18,
    marginBottom: 16,
  },
  spotlightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fastestBadge: {
    backgroundColor: '#171420',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  fastestBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  spotlightPlatformTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#171420',
  },
  spotlightPlatformSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2,
    marginBottom: 12,
  },
  bestContentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  bestContentLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  bestContentTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  createSimilarBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#171420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createSimilarBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Card 7: Locked in Pro (Luxury Amber Glow)
  lockedProCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 18,
    marginBottom: 16,
  },
  lockedPillRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  lockedPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  lockedPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#B45309',
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
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  unlockGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockAnalyticsBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
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
  disconnectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  disconnectBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
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
    paddingVertical: 4,
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
