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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

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

const XSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
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

const ThreadsSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.84 12.3c-.45 2.1-2.03 3.32-4.14 3.32-2.58 0-4.4-1.84-4.4-4.47 0-2.67 1.88-4.57 4.54-4.57 2.45 0 4.1 1.62 4.17 3.86h-1.87c-.07-1.26-.98-2.14-2.3-2.14-1.62 0-2.65 1.25-2.65 2.85 0 1.63 1.05 2.8 2.58 2.8 1.15 0 1.97-.62 2.22-1.65h1.85z"
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

const renderPlatformBrandIcon = (id: string, size = 20) => {
  switch (id) {
    case 'tiktok':
      return <TikTokSvg size={size} />;
    case 'instagram':
      return <InstagramSvg size={size} />;
    case 'youtube':
      return <YouTubeSvg size={size} />;
    case 'linkedin':
      return <LinkedInSvg size={size} />;
    case 'x':
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

interface PlatformGrowthScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenEarnings?: () => void;
  onOpenComposer?: (ideaTitle?: string) => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenContentAngle?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const PlatformGrowthScreen: React.FC<PlatformGrowthScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenEarnings,
  onOpenComposer,
  onOpenScript,
  onOpenContentAngle,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Platform Accounts State
  const [platformsList, setPlatformsList] = useState([
    { id: 'tiktok', name: 'TikTok', handle: '@your_creator', followers: '+840', impressions: '12.4K', engage: '920', connected: true, top: true },
    { id: 'instagram', name: 'Instagram', handle: '@your_handle', followers: '+390', impressions: '7.8K', engage: '560', connected: true, top: false },
    { id: 'youtube', name: 'YouTube', handle: 'Your Channel', followers: '+170', impressions: '3.9K', engage: '240', connected: true, top: false },
    { id: 'x', name: 'X (Twitter)', handle: '@not_connected', followers: '0', impressions: '0', engage: '0', connected: false, top: false },
    { id: 'threads', name: 'Threads', handle: '@not_connected', followers: '0', impressions: '0', engage: '0', connected: false, top: false },
    { id: 'linkedin', name: 'LinkedIn', handle: 'Not Connected', followers: '0', impressions: '0', engage: '0', connected: false, top: false },
  ]);
  const [customHandleInput, setCustomHandleInput] = useState('');
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState('x');

  const handleTogglePlatformConnect = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPlatformsList(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.connected;
        showToast(nextState ? `✓ ${p.name} connected & synced!` : `Removed ${p.name}`);
        return { ...p, connected: nextState };
      }
      return p;
    }));
  };

  const handleAddPlatformWithHandle = () => {
    if (!customHandleInput.trim()) {
      showToast('Please enter your username/handle');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPlatformsList(prev => prev.map(p => {
      if (p.id === selectedPlatformToAdd) {
        return { ...p, connected: true, handle: customHandleInput.trim() };
      }
      return p;
    }));
    const target = platformsList.find(p => p.id === selectedPlatformToAdd);
    showToast(`✓ ${target?.name || 'Platform'} linked to ${customHandleInput.trim()}!`);
    setCustomHandleInput('');
    setShowConnectModal(false);
  };

  // Selected bar highlight in Weekly Comparison
  const [selectedBar, setSelectedBar] = useState<'TT' | 'IG' | 'YT' | 'X' | null>(null);

  const handleToggleBar = (bar: 'TT' | 'IG' | 'YT' | 'X') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedBar((prev) => (prev === bar ? null : bar));
  };

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;

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
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* 1. TOP HEADER BAR (EXACT ICONS & BEHAVIORS AS ALL OTHER PAGES) */}
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
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>PLATFORM GROWTH PREVIEW</Text>
            </View>
          </View>
          <Text style={styles.mainTitle}>See which platforms are growing.</Text>
          <Text style={styles.mainSubtitle}>
            Track your audience expansion across all connected networks. <Text style={styles.activePlatformsHighlight}>3 of 4 platforms active.</Text>
          </Text>

          {/* CARD 1: AGGREGATE GROWTH HERO CARD */}
          <View style={styles.aggregateCard}>
            <View style={styles.aggregateTopRow}>
              <View>
                <Text style={styles.aggregateLabel}>AGGREGATE GROWTH</Text>
                <View style={styles.aggregateMetricRow}>
                  <Text style={styles.aggregateNumber}>+12.4%</Text>
                  <Text style={styles.aggregateTrend}>↗ 2.1%</Text>
                </View>
              </View>

              <View style={styles.topPlatformPill}>
                <Text style={styles.topPlatformPillText}>⭐ TOP: TIKTOK</Text>
              </View>
            </View>

            {/* Growth Distribution Bar */}
            <View style={styles.distributionHeaderRow}>
              <Text style={styles.distLabel}>GROWTH DISTRIBUTION</Text>
              <Text style={styles.distValue}>1,200 NEW FOLLOWERS</Text>
            </View>

            <View style={styles.distBarTrack}>
              <View style={[styles.distBarSegment, { width: '65%', backgroundColor: '#582CDB' }]} />
              <View style={[styles.distBarSegment, { width: '25%', backgroundColor: '#8B5CF6' }]} />
              <View style={[styles.distBarSegment, { width: '10%', backgroundColor: '#C4B5FD' }]} />
            </View>

            {/* Distribution Legend */}
            <View style={styles.distLegendRow}>
              <View style={styles.distLegendItem}>
                <View style={[styles.distLegendDot, { backgroundColor: '#582CDB' }]} />
                <Text style={styles.distLegendText}>TikTok (840)</Text>
              </View>
              <View style={styles.distLegendItem}>
                <View style={[styles.distLegendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.distLegendText}>IG (390)</Text>
              </View>
              <View style={styles.distLegendItem}>
                <View style={[styles.distLegendDot, { backgroundColor: '#C4B5FD' }]} />
                <Text style={styles.distLegendText}>YT (170)</Text>
              </View>
            </View>
          </View>

          {/* CARD 2: REDESIGNED PREMIUM WEEKLY COMPARISON */}
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyHeaderRow}>
              <View>
                <Text style={styles.weeklyTitle}>Weekly Comparison</Text>
                <Text style={styles.weeklySubtitle}>Velocity &amp; share of new audience</Text>
              </View>
              <View style={styles.weeklyPillBadge}>
                <Text style={styles.weeklyPillBadgeText}>⚡ 7-DAY VOLUME</Text>
              </View>
            </View>

            {/* Selected Platform Spotlight Banner (Click & Unclick Toggle) */}
            <Pressable
              style={({ pressed }) => [styles.weeklySpotlightBox, pressed && styles.btnPressed]}
              onPress={() => {
                if (selectedBar) {
                  handleToggleBar(selectedBar);
                }
              }}
            >
              <View style={styles.spotlightLeft}>
                <View style={[
                  styles.spotlightDot,
                  !selectedBar && { backgroundColor: '#582CDB' },
                  selectedBar === 'TT' && { backgroundColor: '#582CDB' },
                  selectedBar === 'IG' && { backgroundColor: '#E1306C' },
                  selectedBar === 'YT' && { backgroundColor: '#EF4444' },
                  selectedBar === 'X' && { backgroundColor: '#64748B' },
                ]} />
                <View>
                  <Text style={styles.spotlightPlatformName}>
                    {!selectedBar
                      ? 'All Channels Overview'
                      : selectedBar === 'TT'
                      ? 'TikTok'
                      : selectedBar === 'IG'
                      ? 'Instagram'
                      : selectedBar === 'YT'
                      ? 'YouTube'
                      : 'X (Twitter)'}
                  </Text>
                  <Text style={styles.spotlightHint}>
                    {!selectedBar ? 'Tap any bar to inspect' : 'Tap again to unclick'}
                  </Text>
                </View>
              </View>

              <View style={styles.spotlightStatsGroup}>
                <Text style={styles.spotlightGain}>
                  {!selectedBar
                    ? '+1,400 New Followers'
                    : selectedBar === 'TT'
                    ? '+840 (70% share)'
                    : selectedBar === 'IG'
                    ? '+390 (22% share)'
                    : selectedBar === 'YT'
                    ? '+170 (8% share)'
                    : '0 (Not connected)'}
                </Text>
                <Text style={styles.spotlightRate}>
                  {!selectedBar
                    ? '⚡ 3 active networks'
                    : selectedBar === 'TT'
                    ? '🔥 120/day avg'
                    : selectedBar === 'IG'
                    ? '✨ 55/day avg'
                    : selectedBar === 'YT'
                    ? '▶️ 24/day avg'
                    : '🔗 Link account'}
                </Text>
              </View>
            </Pressable>

            {/* Visual Chart with Grid Lines & Click/Unclick Bars */}
            <View style={styles.weeklyChartArea}>
              {/* Background Grid Lines */}
              <View style={styles.chartGridLineTop} />
              <View style={styles.chartGridLineMid} />
              <View style={styles.chartBaseline} />

              {/* TikTok Bar */}
              <Pressable
                style={[
                  styles.weeklyBarCol,
                  selectedBar && selectedBar !== 'TT' && styles.weeklyBarColDimmed,
                ]}
                onPress={() => handleToggleBar('TT')}
                hitSlop={6}
              >
                <View style={styles.barTopBadge}>
                  <Text style={[
                    styles.barTopBadgeText,
                    (!selectedBar || selectedBar === 'TT') && styles.barTopBadgeTextActive,
                  ]}>
                    +840
                  </Text>
                </View>
                <View style={styles.weeklyBarTrack}>
                  <LinearGradient
                    colors={
                      selectedBar === 'TT'
                        ? ['#582CDB', '#3B1A82']
                        : ['#582CDB', '#7C3AED']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      styles.weeklyBarFill,
                      { height: 110 },
                      selectedBar === 'TT' && styles.weeklyBarFillActive,
                    ]}
                  />
                </View>
                <View style={[
                  styles.platformIconMini,
                  selectedBar === 'TT' && styles.platformIconMiniActive,
                ]}>
                  <TikTokSvg size={14} />
                </View>
                <Text style={[
                  styles.weeklyBarLabel,
                  selectedBar === 'TT' && styles.weeklyBarLabelActive,
                ]}>
                  TikTok
                </Text>
              </Pressable>

              {/* Instagram Bar */}
              <Pressable
                style={[
                  styles.weeklyBarCol,
                  selectedBar && selectedBar !== 'IG' && styles.weeklyBarColDimmed,
                ]}
                onPress={() => handleToggleBar('IG')}
                hitSlop={6}
              >
                <View style={styles.barTopBadge}>
                  <Text style={[
                    styles.barTopBadgeText,
                    (!selectedBar || selectedBar === 'IG') && styles.barTopBadgeTextActive,
                  ]}>
                    +390
                  </Text>
                </View>
                <View style={styles.weeklyBarTrack}>
                  <LinearGradient
                    colors={
                      selectedBar === 'IG'
                        ? ['#582CDB', '#3B1A82']
                        : ['#8B5CF6', '#A78BFA']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      styles.weeklyBarFill,
                      { height: 72 },
                      selectedBar === 'IG' && styles.weeklyBarFillActive,
                    ]}
                  />
                </View>
                <View style={[
                  styles.platformIconMini,
                  selectedBar === 'IG' && styles.platformIconMiniActive,
                ]}>
                  <InstagramSvg size={14} />
                </View>
                <Text style={[
                  styles.weeklyBarLabel,
                  selectedBar === 'IG' && styles.weeklyBarLabelActive,
                ]}>
                  Instagram
                </Text>
              </Pressable>

              {/* YouTube Bar */}
              <Pressable
                style={[
                  styles.weeklyBarCol,
                  selectedBar && selectedBar !== 'YT' && styles.weeklyBarColDimmed,
                ]}
                onPress={() => handleToggleBar('YT')}
                hitSlop={6}
              >
                <View style={styles.barTopBadge}>
                  <Text style={[
                    styles.barTopBadgeText,
                    (!selectedBar || selectedBar === 'YT') && styles.barTopBadgeTextActive,
                  ]}>
                    +170
                  </Text>
                </View>
                <View style={styles.weeklyBarTrack}>
                  <LinearGradient
                    colors={
                      selectedBar === 'YT'
                        ? ['#582CDB', '#3B1A82']
                        : ['#C4B5FD', '#DDD6FE']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      styles.weeklyBarFill,
                      { height: 44 },
                      selectedBar === 'YT' && styles.weeklyBarFillActive,
                    ]}
                  />
                </View>
                <View style={[
                  styles.platformIconMini,
                  selectedBar === 'YT' && styles.platformIconMiniActive,
                ]}>
                  <YouTubeSvg size={14} />
                </View>
                <Text style={[
                  styles.weeklyBarLabel,
                  selectedBar === 'YT' && styles.weeklyBarLabelActive,
                ]}>
                  YouTube
                </Text>
              </Pressable>

              {/* X Bar */}
              <Pressable
                style={[
                  styles.weeklyBarCol,
                  selectedBar && selectedBar !== 'X' && styles.weeklyBarColDimmed,
                ]}
                onPress={() => handleToggleBar('X')}
                hitSlop={6}
              >
                <View style={styles.barTopBadge}>
                  <Text style={[
                    styles.barTopBadgeText,
                    selectedBar === 'X' && styles.barTopBadgeTextActive,
                  ]}>
                    0
                  </Text>
                </View>
                <View style={styles.weeklyBarTrack}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: 14, backgroundColor: '#E2E8F0' },
                      selectedBar === 'X' && { backgroundColor: '#582CDB', shadowColor: '#582CDB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
                    ]}
                  />
                </View>
                <View style={[
                  styles.platformIconMini,
                  selectedBar === 'X' && styles.platformIconMiniActive,
                ]}>
                  <XSvg size={13} />
                </View>
                <Text style={[
                  styles.weeklyBarLabel,
                  selectedBar === 'X' && styles.weeklyBarLabelActive,
                ]}>
                  X
                </Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 3: GROWTH ENGINE IDENTIFIED (ROYAL PURPLE HERO CARD) */}
          <LinearGradient
            colors={['#582CDB', '#3B1A82']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.growthEngineCard}
          >
            <View style={styles.growthEngineHeaderRow}>
              <Text style={{ fontSize: 14 }}>📈</Text>
              <Text style={styles.growthEngineTag}>GROWTH ENGINE IDENTIFIED</Text>
            </View>

            <Text style={styles.growthEngineTitle}>TikTok is your leader.</Text>
            <Text style={styles.growthEngineSubtext}>
              Short-form content is driving 53% of discovery.
            </Text>

            <View style={styles.recommendedActionBox}>
              <Text style={styles.recommendedActionLabel}>RECOMMENDED ACTION</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>🎬</Text>
                <Text style={styles.recommendedActionText}>
                  Post another TikTok-first video based on top trends.
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* CARD 4: PLATFORM BREAKDOWN LIST */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Platform Breakdown</Text>
          </View>

          <View style={styles.platformListContainer}>
            {/* TikTok Row */}
            <View style={styles.platformCardItem}>
              <View style={styles.platformItemHeader}>
                <View style={styles.platformItemIdentity}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#F1F5F9' }]}>
                    <TikTokSvg size={20} />
                  </View>
                  <View>
                    <Text style={styles.platformItemName}>TikTok</Text>
                    <Text style={styles.platformConnectedStatus}>Connected</Text>
                  </View>
                </View>

                <View style={styles.topGrowthBadge}>
                  <Text style={styles.topGrowthBadgeText}>TOP GROWTH</Text>
                </View>
              </View>

              <View style={styles.platformItemStatsRow}>
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>FOLLOWERS</Text>
                  <Text style={styles.platformStatValue}>
                    +840 <Text style={styles.platformStatGain}>22% ▲</Text>
                  </Text>
                </View>
                <View style={styles.platformStatDivider} />
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>IMPRESSIONS</Text>
                  <Text style={styles.platformStatValue}>12.4K</Text>
                </View>
                <View style={styles.platformStatDivider} />
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>ENGAGE</Text>
                  <Text style={styles.platformStatValue}>920</Text>
                </View>
              </View>
            </View>

            {/* Instagram Row */}
            <View style={styles.platformCardItem}>
              <View style={styles.platformItemHeader}>
                <View style={styles.platformItemIdentity}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#FDF2F8' }]}>
                    <InstagramSvg size={20} />
                  </View>
                  <View>
                    <Text style={styles.platformItemName}>Instagram</Text>
                    <Text style={styles.platformConnectedStatus}>Connected</Text>
                  </View>
                </View>
              </View>

              <View style={styles.platformItemStatsRow}>
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>FOLLOWERS</Text>
                  <Text style={styles.platformStatValue}>
                    +390 <Text style={styles.platformStatGain}>14% ▲</Text>
                  </Text>
                </View>
                <View style={styles.platformStatDivider} />
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>IMPRESSIONS</Text>
                  <Text style={styles.platformStatValue}>7.8K</Text>
                </View>
                <View style={styles.platformStatDivider} />
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>ENGAGE</Text>
                  <Text style={styles.platformStatValue}>560</Text>
                </View>
              </View>
            </View>

            {/* YouTube Row */}
            <View style={styles.platformCardItem}>
              <View style={styles.platformItemHeader}>
                <View style={styles.platformItemIdentity}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#FEF2F2' }]}>
                    <YouTubeSvg size={20} />
                  </View>
                  <View>
                    <Text style={styles.platformItemName}>YouTube</Text>
                    <Text style={styles.platformConnectedStatus}>Connected</Text>
                  </View>
                </View>
              </View>

              <View style={styles.platformItemStatsRow}>
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>SUBS</Text>
                  <Text style={styles.platformStatValue}>
                    +170 <Text style={styles.platformStatGain}>9% ▲</Text>
                  </Text>
                </View>
                <View style={styles.platformStatDivider} />
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>IMPRESSIONS</Text>
                  <Text style={styles.platformStatValue}>3.9K</Text>
                </View>
                <View style={styles.platformStatDivider} />
                <View style={styles.platformStatCol}>
                  <Text style={styles.platformStatLabel}>VIEWS+</Text>
                  <Text style={styles.platformStatValue}>240</Text>
                </View>
              </View>
            </View>

            {/* X (Twitter) Unconnected Row (Purple Connect Button) */}
            <View style={[styles.platformCardItem, styles.platformCardItemUnconnected]}>
              <View style={styles.platformItemHeader}>
                <View style={styles.platformItemIdentity}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#F8FAFC' }]}>
                    <XSvg size={18} />
                  </View>
                  <View>
                    <Text style={styles.platformItemName}>X (Twitter)</Text>
                    <Text style={styles.platformUnconnectedStatus}>Not connected</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.connectPillActionBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    triggerModalPop();
                    setShowConnectModal(true);
                  }}
                >
                  <Text style={styles.connectPillActionBtnText}>Connect +</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* CARD 5: JARVIS INSIGHT CARD */}
          <View style={styles.jarvisCard}>
            <View style={styles.jarvisAvatarCircle}>
              <Image
                source={require('../../assets/images/ghost-alone.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jarvisTitle}>Jarvis Insight</Text>
              <Text style={styles.jarvisBody}>
                TikTok remains your strongest growth engine. Create one TikTok-first post, then repurpose it for Instagram.
              </Text>
            </View>
          </View>

          {/* CARD 6: NEXT STEPS BUTTONS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.nextStepsHeading}>NEXT STEPS</Text>
          </View>

          <View style={styles.nextStepsContainer}>
            <Pressable
              style={({ pressed }) => [styles.nextStepRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenComposer) {
                  onOpenComposer('TikTok Growth Blueprint: 3 Hooks that 10x your views');
                } else {
                  showToast('Opening Creator Studio...');
                }
              }}
            >
              <View style={styles.nextStepLeft}>
                <Text style={{ fontSize: 18, color: '#582CDB' }}>⊕</Text>
                <Text style={styles.nextStepText}>Create TikTok Post</Text>
              </View>
              <Text style={styles.nextStepChevron}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.nextStepRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else if (onOpenContentAngle) {
                  onOpenContentAngle();
                } else {
                  showToast('🔒 Pro Feature: Upgrade to unlock auto-repurposing');
                }
              }}
            >
              <View style={styles.nextStepLeft}>
                <Text style={{ fontSize: 16, color: '#582CDB' }}>✨</Text>
                <Text style={styles.nextStepText}>Repurpose for IG</Text>
                <View style={styles.nextStepProPill}>
                  <Text style={styles.nextStepProPillText}>🔒 PRO</Text>
                </View>
              </View>
              <Text style={styles.nextStepChevron}>›</Text>
            </Pressable>
          </View>

          {/* CARD 7: PLAN INSIGHTS PRO CARD */}
          <View style={styles.planInsightsCard}>
            <View style={styles.planInsightsHeader}>
              <Text style={styles.planInsightsTitle}>Plan Insights</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>

            <View style={styles.planFeaturesList}>
              <View style={styles.planFeatureItem}>
                <Text style={styles.checkGreen}>✓</Text>
                <Text style={styles.planFeatureText}>Basic Audience Count</Text>
              </View>
              <View style={styles.planFeatureItem}>
                <Text style={styles.checkGreen}>✓</Text>
                <Text style={styles.planFeatureText}>Daily Growth Preview</Text>
              </View>
              <View style={styles.planFeatureItem}>
                <Text style={{ fontSize: 12 }}>🔒</Text>
                <Text style={styles.planFeatureLockedText}>Historical Reports</Text>
              </View>
            </View>

            {/* Signature Metallic Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.unlockProBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  showToast('Pro analytics unlocked!');
                }
              }}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockProGradient}
              >
                <Text style={styles.unlockProBtnText}>Unlock Pro Features</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

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
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Cross-platform milestones</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>📈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>+12.4% Aggregate Surge</Text>
                  <Text style={styles.notifBody}>TikTok leading cross-platform momentum with +840 followers.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* COMPREHENSIVE ALL SOCIAL MEDIA CONNECT HUB POPUP MODAL */}
        <Modal
          visible={showConnectModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
              {/* Modal Top Header */}
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
                    Manage connected channels or add more platforms to sync your audience.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowConnectModal(false)}
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
                        <View style={styles.platformRowIdentity}>
                          <View style={styles.platformLogoCircle}>
                            {renderPlatformBrandIcon(plat.id, 20)}
                          </View>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.connectedPlatformName}>{plat.name}</Text>
                              {plat.top && (
                                <View style={styles.topPlatformTag}>
                                  <Text style={styles.topPlatformTagText}>TOP GROWTH</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.connectedPlatformHandle}>{plat.handle}</Text>
                          </View>
                        </View>

                        <Pressable
                          style={({ pressed }) => [styles.disconnectBtn, pressed && styles.btnPressed]}
                          onPress={() => handleTogglePlatformConnect(plat.id)}
                          hitSlop={6}
                        >
                          <Text style={styles.disconnectBtnText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>

                {/* 2. AVAILABLE CHANNELS TO CONNECT */}
                <Text style={styles.modalSectionTitle}>ADD MORE SOCIAL PLATFORMS</Text>
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => !p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.unconnectedPlatformRow}>
                        <View style={styles.platformRowIdentity}>
                          <View style={[styles.platformLogoCircle, { backgroundColor: '#FAF8F5' }]}>
                            {renderPlatformBrandIcon(plat.id, 20)}
                          </View>
                          <View>
                            <Text style={styles.connectedPlatformName}>{plat.name}</Text>
                            <Text style={styles.unconnectedPlatformSub}>Tap to connect &amp; sync</Text>
                          </View>
                        </View>

                        <Pressable
                          style={({ pressed }) => [styles.quickConnectBtn, pressed && styles.btnPressed]}
                          onPress={() => {
                            setSelectedPlatformToAdd(plat.id);
                            handleTogglePlatformConnect(plat.id);
                          }}
                          hitSlop={6}
                        >
                          <Text style={styles.quickConnectBtnText}>+ Connect</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>

                {/* 3. LINK SPECIFIC SOCIAL HANDLE */}
                <View style={styles.customHandleCard}>
                  <Text style={styles.customHandleLabel}>LINK SOCIAL HANDLE DIRECTLY</Text>
                  <View style={styles.handleInputRow}>
                    <TextInput
                      style={styles.handleInput}
                      placeholder="@username or channel URL"
                      placeholderTextColor="#94A3B8"
                      value={customHandleInput}
                      onChangeText={setCustomHandleInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      style={({ pressed }) => [styles.handleSaveBtn, pressed && styles.btnPressed]}
                      onPress={handleAddPlatformWithHandle}
                    >
                      <Text style={styles.handleSaveBtnText}>Link ✓</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Modal Done Button */}
                <Pressable
                  style={styles.modalDoneBtn}
                  onPress={() => setShowConnectModal(false)}
                >
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
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
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
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
    borderWidth: 1.5,
    borderColor: '#582CDB',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },

  // SCROLL CONTENT
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // HERO TITLES
  badgePillRow: {
    marginBottom: 6,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },
  activePlatformsHighlight: {
    color: '#15803D',
    fontWeight: '800',
  },

  // CARD 1: AGGREGATE GROWTH HERO CARD
  aggregateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  aggregateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aggregateLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  aggregateMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  aggregateNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.8,
  },
  aggregateTrend: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  topPlatformPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  topPlatformPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
  },
  distributionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  distLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  distValue: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#171420',
  },
  distBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  distBarSegment: {
    height: '100%',
  },
  distLegendRow: {
    flexDirection: 'row',
    gap: 14,
  },
  distLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  distLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  distLegendText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },

  // CARD 2: REDESIGNED WEEKLY COMPARISON
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  weeklyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  weeklySubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  weeklyPillBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  weeklyPillBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  weeklySpotlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 16,
  },
  spotlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spotlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spotlightPlatformName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  spotlightStatsGroup: {
    alignItems: 'flex-end',
  },
  spotlightGain: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#15803D',
  },
  spotlightRate: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
  },
  weeklyChartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 16,
    position: 'relative',
  },
  chartGridLineTop: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  chartGridLineMid: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  chartBaseline: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#E2E8F0',
  },
  weeklyBarCol: {
    alignItems: 'center',
    width: '23%',
    zIndex: 2,
  },
  weeklyBarColDimmed: {
    opacity: 0.45,
  },
  spotlightHint: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 1,
  },
  barTopBadge: {
    marginBottom: 6,
    height: 18,
    justifyContent: 'center',
  },
  barTopBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  barTopBadgeTextActive: {
    color: '#582CDB',
    fontWeight: '900',
    fontSize: 11,
  },
  weeklyBarTrack: {
    height: 110,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  weeklyBarFill: {
    width: '80%',
    borderRadius: 14,
    maxWidth: 52,
  },
  weeklyBarFillActive: {
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  platformIconMini: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginTop: 8,
  },
  platformIconMiniActive: {
    borderColor: '#582CDB',
    backgroundColor: '#EDE9FE',
  },
  weeklyBarLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 4,
  },
  weeklyBarLabelActive: {
    color: '#582CDB',
    fontWeight: '900',
  },

  // CARD 3: GROWTH ENGINE IDENTIFIED
  growthEngineCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  growthEngineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  growthEngineTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#DDD6FE',
    letterSpacing: 0.5,
  },
  growthEngineTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  growthEngineSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 14,
  },
  recommendedActionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  recommendedActionLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#DDD6FE',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recommendedActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 16,
  },

  // CARD 4: PLATFORM BREAKDOWN LIST
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  platformListContainer: {
    gap: 10,
    marginBottom: 18,
  },
  platformCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  platformCardItemUnconnected: {
    borderStyle: 'dashed',
    backgroundColor: '#FAF8F5',
  },
  platformItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformItemIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  platformItemName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  platformConnectedStatus: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  platformUnconnectedStatus: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '700',
  },
  topGrowthBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  topGrowthBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  connectPillActionBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  connectPillActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalCardLarge: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 8,
  },
  activePlatformsCountBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activePlatformsCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
  },
  modalSectionTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  connectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  unconnectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformRowIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  platformLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  connectedPlatformName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  connectedPlatformHandle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  unconnectedPlatformSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  topPlatformTag: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  topPlatformTagText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#B45309',
  },
  disconnectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  disconnectBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  quickConnectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#582CDB',
  },
  quickConnectBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  customHandleCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginTop: 4,
    marginBottom: 12,
  },
  customHandleLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  handleInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  handleInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '700',
  },
  handleSaveBtn: {
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: '#582CDB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleSaveBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalDoneBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  modalDoneBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  platformItemStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  platformStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  platformStatLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  platformStatValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  platformStatGain: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '800',
  },
  platformStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // CARD 5: JARVIS INSIGHT CARD
  jarvisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 18,
  },
  jarvisAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  jarvisTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  jarvisBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  // CARD 6: NEXT STEPS
  nextStepsHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  nextStepsContainer: {
    gap: 8,
    marginBottom: 18,
  },
  nextStepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  nextStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextStepText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
  },
  nextStepProPill: {
    backgroundColor: '#FEF9C3',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  nextStepProPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#A16207',
  },
  nextStepChevron: {
    fontSize: 18,
    color: '#582CDB',
    fontWeight: '900',
  },

  // CARD 7: PLAN INSIGHTS PRO CARD
  planInsightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  planInsightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInsightsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  freeBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
  },
  planFeaturesList: {
    gap: 8,
    marginBottom: 16,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkGreen: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  planFeatureText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  planFeatureLockedText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  unlockProBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockProBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
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
    marginVertical: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 11.5,
    color: '#64748B',
  },
  customInputBox: {
    marginVertical: 12,
  },
  customInputLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  customTextInput: {
    height: 44,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#171420',
    fontWeight: '700',
  },
  modalFullBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // TOAST
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
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
