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
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';

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
            {/* TikTok */}
            <View style={styles.platformItemRow}>
              <SocialBrandIcon platform="tiktok" size={28} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.platformName}>TikTok</Text>
                  <Text style={styles.platformGrowthPurple}>+12.4% <Text style={{ color: '#64748B', fontSize: 11 }}>14.2k</Text></Text>
                </View>
                <View style={styles.platformTrackBg}>
                  <View style={[styles.platformTrackFill, { width: '74%' }]} />
                </View>
              </View>
            </View>

            {/* Instagram */}
            <View style={styles.platformItemRow}>
              <SocialBrandIcon platform="instagram" size={28} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.platformName}>Instagram Reels</Text>
                  <Text style={styles.platformGrowthPurple}>+8.1% <Text style={{ color: '#64748B', fontSize: 11 }}>25.6k</Text></Text>
                </View>
                <View style={styles.platformTrackBg}>
                  <View style={[styles.platformTrackFill, { width: '58%' }]} />
                </View>
              </View>
            </View>

            {/* YouTube Shorts */}
            <View style={styles.platformItemRow}>
              <SocialBrandIcon platform="youtube" size={28} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.platformName}>YouTube Shorts</Text>
                  <Text style={styles.platformGrowthPurple}>+4.2% <Text style={{ color: '#64748B', fontSize: 11 }}>22.4k</Text></Text>
                </View>
                <View style={styles.platformTrackBg}>
                  <View style={[styles.platformTrackFill, { width: '42%' }]} />
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.addPlatformOutlineBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowAddPlatformModal(true);
              }}
            >
              <Text style={styles.addPlatformBtnText}>Add Platform</Text>
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
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setGraphTimeframe(tf);
                    }}
                  >
                    <Text style={[styles.graphTimeframeText, graphTimeframe === tf && styles.graphTimeframeTextActive]}>
                      {tf}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Active Point Live Inspection Banner */}
              <View style={styles.graphActivePointCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.graphActivePointDate}>📅 May {selectedGraphDayIndex + 1}, 2024</Text>
                    <Text style={styles.graphActivePointSub}>
                      {expandedGraphType === 'growth30d' ? 'Daily Reach & Engagement Point' : 'Total Audience Baseline'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.graphActivePointValue}>
                      {expandedGraphType === 'growth30d'
                        ? `${(12.4 + (selectedGraphDayIndex * 1.1)).toFixed(1)}K Reach`
                        : `${(141840 + selectedGraphDayIndex * 85).toLocaleString()} Audience`}
                    </Text>
                    <Text style={styles.graphActivePointDelta}>
                      {expandedGraphType === 'growth30d'
                        ? `+${40 + selectedGraphDayIndex * 3} New Followers`
                        : `+${45 + Math.floor(selectedGraphDayIndex * 2.8)} Today (▲ Surge)`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Scroll Instruction Hint */}
              <View style={styles.scrollGraphHintRow}>
                <Text style={styles.scrollGraphHintText}>↔ Swipe graph horizontally to inspect all 30 days & nodes</Text>
              </View>

              {/* HORIZONTAL SCROLLABLE LIVE GRAPH */}
              <View style={styles.horizontalGraphViewport}>
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                  bounces={true}
                  contentContainerStyle={styles.horizontalGraphScrollContent}
                >
                  <View style={{ width: 950, height: 210, position: 'relative' }}>
                    {/* SVG Graphic Wave Lines & Grid */}
                    <Svg width={950} height={190} viewBox="0 0 950 190">
                      <Defs>
                        <SvgLinearGradient id="liveWaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <Stop
                            offset="0"
                            stopColor={expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED'}
                            stopOpacity="0.35"
                          />
                          <Stop
                            offset="1"
                            stopColor={expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED'}
                            stopOpacity="0.0"
                          />
                        </SvgLinearGradient>
                      </Defs>

                      {/* Horizontal Grid lines */}
                      <Path d="M0,35 L950,35" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M0,80 L950,80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M0,125 L950,125" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M0,170 L950,170" stroke="#E2E8F0" strokeWidth="1.5" />

                      {/* Area Fill */}
                      <Path
                        d={
                          expandedGraphType === 'growth30d'
                            ? 'M0,130 C120,150 220,90 320,110 C420,130 520,70 620,85 C720,100 820,40 950,55 L950,170 L0,170 Z'
                            : 'M0,150 C120,135 220,120 320,100 C420,90 520,75 620,60 C720,45 820,35 950,25 L950,170 L0,170 Z'
                        }
                        fill="url(#liveWaveGrad)"
                      />

                      {/* Line Curve */}
                      <Path
                        d={
                          expandedGraphType === 'growth30d'
                            ? 'M0,130 C120,150 220,90 320,110 C420,130 520,70 620,85 C720,100 820,40 950,55'
                            : 'M0,150 C120,135 220,120 320,100 C420,90 520,75 620,60 C720,45 820,35 950,25'
                        }
                        fill="none"
                        stroke={expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </Svg>

                    {/* Interactive 30 Day Node Touchpoints */}
                    <View style={styles.interactiveNodesOverlay}>
                      {Array.from({ length: 30 }, (_, i) => {
                        const isSelected = selectedGraphDayIndex === i;
                        // Calculate Y coordinate progression
                        const factor = i / 29;
                        const yPos =
                          expandedGraphType === 'growth30d'
                            ? 130 - factor * 75 + Math.sin(i * 0.7) * 18
                            : 150 - factor * 125 + Math.sin(i * 0.5) * 6;

                        return (
                          <Pressable
                            key={i}
                            style={[
                              styles.interactiveGraphNode,
                              {
                                left: i * 31.5 + 8,
                                top: yPos - 10,
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
                                { backgroundColor: isSelected ? '#F59E0B' : expandedGraphType === 'growth30d' ? '#582CDB' : '#7C3AED' },
                              ]}
                            />
                            {isSelected && <View style={styles.nodeSelectedGlowRing} />}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* X-Axis Date Labels */}
                    <View style={styles.xAxisLabelsRow}>
                      {[1, 5, 10, 15, 20, 25, 30].map((d) => (
                        <Text key={d} style={[styles.xAxisLabelText, { left: (d - 1) * 31.5 }]}>
                          May {d}
                        </Text>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>

              {/* Bottom 4-Week Milestone Breakdown Grid */}
              <View style={styles.modalWeeklyBreakdownGrid}>
                <View style={styles.modalWeekCol}>
                  <Text style={styles.modalWeekTitle}>WEEK 1</Text>
                  <Text style={styles.modalWeekVal}>+540 👤</Text>
                  <Text style={styles.modalWeekSub}>12.4k reach</Text>
                </View>
                <View style={styles.modalWeekCol}>
                  <Text style={styles.modalWeekTitle}>WEEK 2</Text>
                  <Text style={styles.modalWeekVal}>+680 👤</Text>
                  <Text style={styles.modalWeekSub}>28.1k reach</Text>
                </View>
                <View style={styles.modalWeekCol}>
                  <Text style={styles.modalWeekTitle}>WEEK 3 (🔥)</Text>
                  <Text style={[styles.modalWeekVal, { color: '#582CDB' }]}>+720 👤</Text>
                  <Text style={styles.modalWeekSub}>45.2k peak</Text>
                </View>
                <View style={styles.modalWeekCol}>
                  <Text style={styles.modalWeekTitle}>WEEK 4</Text>
                  <Text style={styles.modalWeekVal}>+540 👤</Text>
                  <Text style={styles.modalWeekSub}>32.8k reach</Text>
                </View>
              </View>

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
                style={styles.modalFullBtn}
                onPress={() => setShowExpandedGraphModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close Expanded View</Text>
              </Pressable>
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
        {/* MODAL: ADD PLATFORM                                          */}
        {/* ============================================================ */}
        <Modal
          visible={showAddPlatformModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddPlatformModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Connect New Platform</Text>
                  <Text style={styles.modalSubtitle}>Sync real-time creator analytics</Text>
                </View>
                <Pressable onPress={() => setShowAddPlatformModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 10 }}>
                {[
                  { name: 'YouTube Shorts (Connected ✓)', platform: 'youtube' },
                  { name: 'Instagram Reels (Connected ✓)', platform: 'instagram' },
                  { name: 'TikTok (Connected ✓)', platform: 'tiktok' },
                  { name: 'LinkedIn Articles', platform: 'linkedin' },
                  { name: 'X / Twitter', platform: 'x' },
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.platformSelectRow}
                    onPress={() => {
                      setShowAddPlatformModal(false);
                      showToast(`Synced ${item.name.split(' ')[0]} with Pro Analytics!`);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <SocialBrandIcon platform={item.platform} size={22} />
                      <Text style={styles.platformSelectText}>{item.name}</Text>
                    </View>
                    <Text style={styles.platformSyncArrow}>➔</Text>
                  </Pressable>
                ))}
              </View>
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
    maxWidth: 520,
    padding: 20,
    borderRadius: 24,
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
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    marginBottom: 8,
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
