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

interface PlatformGrowthScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
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

  // Selected bar highlight in Weekly Comparison
  const [selectedBar, setSelectedBar] = useState<'TT' | 'IG' | 'YT' | 'X'>('TT');

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

          {/* CARD 2: WEEKLY COMPARISON BAR CHART */}
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyTitle}>Weekly Comparison</Text>

            <View style={styles.weeklyChartArea}>
              {/* TikTok Bar */}
              <Pressable
                style={styles.weeklyBarCol}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedBar('TT');
                }}
              >
                <View style={styles.weeklyBarTrack}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: 110 },
                      selectedBar === 'TT'
                        ? { backgroundColor: '#582CDB' }
                        : { backgroundColor: '#8B5CF6' },
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyBarLabel, selectedBar === 'TT' && styles.weeklyBarLabelActive]}>
                  TT
                </Text>
              </Pressable>

              {/* Instagram Bar */}
              <Pressable
                style={styles.weeklyBarCol}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedBar('IG');
                }}
              >
                <View style={styles.weeklyBarTrack}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: 72 },
                      selectedBar === 'IG'
                        ? { backgroundColor: '#582CDB' }
                        : { backgroundColor: '#8B5CF6' },
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyBarLabel, selectedBar === 'IG' && styles.weeklyBarLabelActive]}>
                  IG
                </Text>
              </Pressable>

              {/* YouTube Bar */}
              <Pressable
                style={styles.weeklyBarCol}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedBar('YT');
                }}
              >
                <View style={styles.weeklyBarTrack}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: 44 },
                      selectedBar === 'YT'
                        ? { backgroundColor: '#582CDB' }
                        : { backgroundColor: '#C4B5FD' },
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyBarLabel, selectedBar === 'YT' && styles.weeklyBarLabelActive]}>
                  YT
                </Text>
              </Pressable>

              {/* X Bar */}
              <Pressable
                style={styles.weeklyBarCol}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedBar('X');
                }}
              >
                <View style={styles.weeklyBarTrack}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: 12 },
                      selectedBar === 'X'
                        ? { backgroundColor: '#582CDB' }
                        : { backgroundColor: '#E2E8F0' },
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyBarLabel, selectedBar === 'X' && styles.weeklyBarLabelActive]}>
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

            {/* X (Twitter) Unconnected Row */}
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
                source={require('../../assets/images/jarvis-core-flame.png')}
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
                if (onOpenContentAngle) {
                  onOpenContentAngle();
                } else if (onOpenScript) {
                  onOpenScript('Repurpose TikTok video into Instagram Reel format');
                } else {
                  showToast('Repurposing script for Instagram...');
                }
              }}
            >
              <View style={styles.nextStepLeft}>
                <Text style={{ fontSize: 16, color: '#582CDB' }}>✨</Text>
                <Text style={styles.nextStepText}>Repurpose for IG</Text>
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

        {/* CONNECT MODAL */}
        <Modal
          visible={showConnectModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Connect X (Twitter)</Text>
                  <Text style={styles.modalSubtitle}>Link your creator profile to sync analytics</Text>
                </View>
                <Pressable onPress={() => setShowConnectModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.customInputBox}>
                <Text style={styles.customInputLabel}>ENTER YOUR X HANDLE</Text>
                <TextInput
                  placeholder="@your_handle"
                  placeholderTextColor="#94A3B8"
                  style={styles.customTextInput}
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  showToast('✓ X (Twitter) linked! Syncing metrics...');
                  setShowConnectModal(false);
                }}
              >
                <Text style={styles.modalFullBtnText}>Connect &amp; Sync ✓</Text>
              </Pressable>
            </View>
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

  // CARD 2: WEEKLY COMPARISON BAR CHART
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 16,
  },
  weeklyChartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: 10,
  },
  weeklyBarCol: {
    alignItems: 'center',
    width: 60,
  },
  weeklyBarTrack: {
    height: 110,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  weeklyBarFill: {
    width: 48,
    borderRadius: 12,
  },
  weeklyBarLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 8,
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
    backgroundColor: '#171420',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  connectPillActionBtnText: {
    fontSize: 10.5,
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
