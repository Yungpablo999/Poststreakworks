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

interface ProDashboardScreenProps {
  onLogout?: () => void;
  onStartMission?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenEarnings?: () => void;
  onOpenQuests?: () => void;
  onOpenGrowth?: () => void;
  onOpenMatch?: () => void;
  onOpenCreate?: () => void;
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
  badgeBg: string;
  badgeBorder: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'streak',
    title: 'Streak Lock Reminder 🔥',
    body: 'Post 1 Reel before 11:30 AM today to lock in Day 48 and protect your consistency score.',
    time: '15m ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
  {
    id: 'n2',
    type: 'quest',
    title: 'GlowUp Skincare Launch ($450 Bounty)',
    body: 'Brand deal application unlocked for Pro Creators. Tap to review submission brief.',
    time: '1h ago',
    unread: true,
    iconEmoji: '🎯',
    badgeBg: '#EDE8FC',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'n3',
    type: 'collab',
    title: 'Collab Match Suggested',
    body: 'Amara Okafor (94% Audience Overlap) is active and open for squad collab.',
    time: '3h ago',
    unread: true,
    iconEmoji: '🤝',
    badgeBg: '#E0F2FE',
    badgeBorder: '#BAE6FD',
  },
];

export const ProDashboardScreen: React.FC<ProDashboardScreenProps> = ({
  onLogout,
  onStartMission,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenSchedule,
  onOpenMessages,
  onOpenEarnings,
  onOpenQuests,
  onOpenGrowth,
  onOpenMatch,
  onOpenCreate,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showVoiceStudioModal, setShowVoiceStudioModal] = useState(false);
  const [showBrandQuestModal, setShowBrandQuestModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Voice Studio State
  const [selectedVoiceTone, setSelectedVoiceTone] = useState('Energetic Narrator');
  const [voiceScriptInput, setVoiceScriptInput] = useState('Here are the 3 mistakes beginner creators make with their short-form hook...');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  // Animation Refs
  const flamePulse = useRef(new Animated.Value(1)).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0.4)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, {
          toValue: 1.14,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(flamePulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(waveformAnim, {
          toValue: 0.3,
          duration: 600,
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
        {/* 1. TOP HEADER BAR */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot + Tap to Switch to Free Mode */}
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
                <Text style={styles.proHeaderBadgeText}>👑 PRO (TAP FOR FREE)</Text>
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
                } else if (onNavigateTab) {
                  onNavigateTab('match');
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
              <View style={styles.addPhotoPlusBadge}>
                <Text style={styles.addPhotoPlusText}>👑</Text>
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
          {/* CARD 1: TODAY'S PRO PLAN HERO */}
          <View style={styles.proPlanHeroCard}>
            <View style={styles.proPlanHeaderRow}>
              <View style={styles.proPlanTagBox}>
                <Text style={styles.proPlanTagText}>TODAY&apos;S PRO PLAN</Text>
              </View>
            </View>

            <Text style={styles.proPlanHeadline}>
              Publish your Reel, then turn your next script into a voiceover.
            </Text>

            <View style={styles.proPlanBadgesRow}>
              <View style={styles.proPillPurple}>
                <Text style={styles.proPillPurpleText}>Level 42</Text>
              </View>

              <View style={styles.proPillGold}>
                <Text style={styles.proPillGoldText}>47-Day Streak</Text>
              </View>

              <View style={styles.proPillGray}>
                <Text style={styles.proPillGrayText}>5 Platforms Connected</Text>
              </View>

              <View style={styles.proPillActiveGold}>
                <Text style={styles.proPillActiveGoldText}>✨ Pro Active</Text>
              </View>
            </View>
          </View>

          {/* CARD 2: YOUR STREAK HEATMAP */}
          <View style={styles.dashboardCard}>
            <View style={styles.streakCardHeader}>
              <Text style={styles.streakLabel}>YOUR STREAK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={styles.streakBigCount}>47-Day Streak</Text>
                <Animated.Text style={{ fontSize: 20, transform: [{ scale: flamePulse }] }}>
                  🔥
                </Animated.Text>
              </View>
            </View>

            <View style={styles.monthHeaderRow}>
              <Text style={styles.monthLabelText}>MAY 2024</Text>
            </View>

            <View style={styles.daysHeaderRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                <Text key={`pro_day_col_${idx}`} style={styles.dayColHeaderText}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.heatmapGridContainer}>
              <View style={styles.heatmapRow}>
                <View style={styles.heatmapCellInactive} />
                <View style={styles.heatmapCellInactive} />
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <View key={`pro_r1_${i}`} style={styles.heatmapCellActive}>
                    <Text style={styles.checkMarkText}>✓</Text>
                  </View>
                ))}
              </View>

              <View style={styles.heatmapRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                  <View key={`pro_r2_${i}`} style={styles.heatmapCellActive}>
                    <Text style={styles.checkMarkText}>✓</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.topCreatorCalloutBanner}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
              <Text style={styles.topCreatorText}>Top 1% of creators this month.</Text>
            </View>
          </View>

          {/* CARD 3: POSTS SCHEDULED & AUTOPILOT */}
          <Pressable
            onPress={() => {
              if (onOpenSchedule) {
                onOpenSchedule();
              } else if (onNavigateTab) {
                onNavigateTab('growth');
              }
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.scheduledLabel}>POSTS SCHEDULED</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <Text style={styles.scheduledBigNumber}>8</Text>
                  <Text style={styles.scheduledThisWeek}>+4 this week</Text>
                </View>
              </View>

              <View style={styles.calendarIconSquare}>
                <Text style={{ fontSize: 18 }}>🗓️</Text>
              </View>
            </View>

            <View style={styles.scheduledDivider} />

            <View style={styles.scheduledBottomRow}>
              <Text style={styles.nextPostTimeText}>Next: 11:30 AM</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12 }}>⚡</Text>
                <Text style={styles.autopilotActiveText}>Autopilot Active</Text>
              </View>
            </View>
          </Pressable>

          {/* CARD 4: PERFORMANCE INSIGHT & HOURLY PEAK CHART */}
          <Pressable
            onPress={() => {
              if (onOpenGrowth) {
                onOpenGrowth();
              } else if (onNavigateTab) {
                onNavigateTab('growth');
              }
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={styles.insightHeaderRow}>
              <View style={styles.trendingIconBox}>
                <Text style={{ fontSize: 14 }}>📈</Text>
              </View>
              <Text style={styles.insightBodyText}>
                Your Reels perform <Text style={styles.highlightGreen}>31% better</Text> between 7:00 PM and 9:00 PM.
              </Text>
            </View>

            <View style={styles.hourlyChartContainer}>
              <View style={[styles.hourlyBar, { height: 10, backgroundColor: '#F1F5F9' }]} />
              <View style={[styles.hourlyBar, { height: 16, backgroundColor: '#E2E8F0' }]} />
              <View style={[styles.hourlyBar, { height: 38, backgroundColor: '#6366F1' }]} />
              <View style={[styles.hourlyBar, { height: 44, backgroundColor: '#582CDB' }]} />
              <View style={[styles.hourlyBar, { height: 34, backgroundColor: '#6366F1' }]} />
              <View style={[styles.hourlyBar, { height: 12, backgroundColor: '#F1F5F9' }]} />
            </View>
          </Pressable>

          {/* CARD 5: CREATOR LEVEL & XP PROGRESS */}
          <Pressable
            onPress={() => {
              if (onStartMission) {
                onStartMission();
              } else if (onOpenQuests) {
                onOpenQuests();
              }
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#A855F7']}
                style={styles.levelCircleBadge}
              >
                <Text style={styles.levelCircleNumber}>42</Text>
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={styles.levelTitleText}>Elite Storyteller</Text>
                <Text style={styles.levelXpText}>2,450 / 3,000 XP</Text>
              </View>
            </View>

            <View style={styles.xpTrackBg}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#EAB308', '#FDE047']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpTrackFill, { width: '82%' }]}
              />
            </View>
          </Pressable>

          {/* CARD 6: BRAND QUEST ("GlowUp Skincare Launch") */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              triggerModalPop();
              setShowBrandQuestModal(true);
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={styles.brandIconSquare}>
                <Text style={{ fontSize: 20 }}>🎁</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.proPriorityPill}>
                    <Text style={styles.proPriorityText}>PRO PRIORITY</Text>
                  </View>
                  <Text style={styles.brandQuestSubLabel}>BRAND QUEST</Text>
                </View>
                <Text style={styles.brandQuestTitle}>GlowUp Skincare Launch</Text>
              </View>

              <Text style={styles.chevronRight}>›</Text>
            </View>
          </Pressable>

          {/* CARD 7: MONTHLY EARNINGS ($4,250.00) */}
          <View style={styles.dashboardCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.earningsCardLabel}>MONTHLY EARNINGS</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.earningsMonthText}>MAY 2024</Text>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            </View>

            <View style={{ marginVertical: 10 }}>
              <Text style={styles.earningsBigAmount}>$4,250.00</Text>
              <Text style={styles.earningsGrowthRate}>+18% vs last month</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.viewEarningsBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenEarnings) {
                  onOpenEarnings();
                } else if (onNavigateTab) {
                  onNavigateTab('growth');
                }
              }}
            >
              <Text style={styles.viewEarningsBtnText}>View Earnings</Text>
            </Pressable>
          </View>

          {/* CARD 8: VOICE STUDIO PRO */}
          <View style={styles.dashboardCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.voiceStudioLabel}>VOICE STUDIO PRO</Text>
              <View style={styles.proUnlockedPill}>
                <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
              </View>
            </View>

            <View style={styles.waveformContainerBox}>
              <View style={styles.waveformBarsRow}>
                {[14, 28, 46, 20, 52, 34, 18, 48, 30, 16].map((h, i) => (
                  <Animated.View
                    key={`wf_${i}`}
                    style={[
                      styles.waveformBarItem,
                      {
                        height: h,
                        opacity: waveformAnim,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14 }}>
              <View>
                <Text style={styles.voiceMinsCount}>118 <Text style={styles.voiceMinsTotal}>/ 150 mins</Text></Text>
                <Text style={styles.savedVoiceSub}>Saved Voice — Energetic Narrator</Text>
              </View>

              <View style={styles.voiceProgressCircle}>
                <Text style={styles.voiceProgressText}>78%</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.createVoiceBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  triggerModalPop();
                  setShowVoiceStudioModal(true);
                }}
              >
                <Text style={styles.createVoiceBtnText}>✨ Create Voice</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.openStudioOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  triggerModalPop();
                  setShowVoiceStudioModal(true);
                }}
              >
                <Text style={styles.openStudioBtnText}>Open Studio</Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 9: CREATOR MATCH */}
          <View style={[styles.dashboardCard, { marginBottom: 120 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Image
                source={require('../../assets/images/amara-avatar.jpg')}
                style={styles.matchAvatarImage}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.matchCreatorName}>Amara Okafor</Text>
                <Text style={styles.matchOverlapTag}>94% Audience overlap</Text>
              </View>
            </View>

            <View style={styles.whyMatchCalloutRow}>
              <Text style={{ fontSize: 13 }}>✨</Text>
              <Text style={styles.whyMatchInlineText}>
                <Text style={{ fontWeight: '900', color: '#582CDB' }}>Why this match? </Text>
                Similar niche, active streak, open to collab.
              </Text>
            </View>

            <View style={styles.matchRecommendationBox}>
              <Text style={styles.matchRecommendationText}>
                Recommended for a collaborative &lsquo;Behind the Scenes&rsquo; series based on your audience.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.connectMatchOutlineBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                } else if (onNavigateTab) {
                  onNavigateTab('match');
                }
              }}
            >
              <Text style={styles.connectMatchBtnText}>Connect</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* MODAL: VOICE STUDIO PRO */}
        <Modal
          visible={showVoiceStudioModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceStudioModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalTitle}>AI Voice Studio Pro</Text>
                    <View style={styles.proUnlockedPill}>
                      <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>Turn scripts into high-converting studio voiceovers</Text>
                </View>
                <Pressable onPress={() => setShowVoiceStudioModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.inputSectionHeader}>SELECT AI CREATOR VOICE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 8 }}>
                {['Energetic Narrator', 'Deep Storyteller', 'Tech Explainer', 'Casual Vlogger'].map((voice, idx) => {
                  const isSelected = selectedVoiceTone === voice;
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.voiceToneChip, isSelected && styles.voiceToneChipActive]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedVoiceTone(voice);
                      }}
                    >
                      <Text style={[styles.voiceToneChipText, isSelected && styles.voiceToneChipTextActive]}>
                        🎙️ {voice}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputSectionHeader}>SCRIPT INPUT</Text>
              <TextInput
                style={styles.voiceTextInput}
                multiline
                numberOfLines={4}
                value={voiceScriptInput}
                onChangeText={setVoiceScriptInput}
                placeholder="Paste or type your video script here..."
                placeholderTextColor="#94A3B8"
              />

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setIsGeneratingVoice(true);
                  setTimeout(() => {
                    setIsGeneratingVoice(false);
                    setShowVoiceStudioModal(false);
                    showToast('Voiceover audio generated & synced with Reel draft!');
                  }, 1200);
                }}
              >
                <Text style={styles.modalFullBtnText}>
                  {isGeneratingVoice ? 'Generating AI Audio...' : 'Generate Studio Voiceover ➔'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: BRAND QUEST DETAILS */}
        <Modal
          visible={showBrandQuestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBrandQuestModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <View style={styles.proPriorityPill}>
                    <Text style={styles.proPriorityText}>PRO PRIORITY MATCH</Text>
                  </View>
                  <Text style={[styles.modalTitle, { marginTop: 4 }]}>GlowUp Skincare Launch</Text>
                  <Text style={styles.modalSubtitle}>Sponsored Campaign Brief • $450 Bounty</Text>
                </View>
                <Pressable onPress={() => setShowBrandQuestModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <Text style={styles.reqDetailLine}>• Target: 1 Dedicated 45s Reel &amp; TikTok Review</Text>
                <Text style={styles.reqDetailLine}>• Deliverable: Organic creator testimonial format</Text>
                <Text style={styles.reqDetailLine}>• Payout: $450 direct bank transfer upon approval</Text>
                <Text style={styles.reqDetailLine}>• Pro Status: Fast-Track Guaranteed Review (24h)</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowBrandQuestModal(false);
                  showToast('Application submitted directly to brand team!');
                }}
              >
                <Text style={styles.modalFullBtnText}>Apply for $450 Bounty ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: NOTIFICATIONS */}
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
                  <Text style={styles.modalTitle}>Activity &amp; Alerts</Text>
                  <Text style={styles.modalSubtitle}>Autonomous co-pilot notifications</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
                {notifications.map((n) => (
                  <View key={n.id} style={styles.notifCard}>
                    <Text style={{ fontSize: 20 }}>{n.iconEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifBody}>{n.body}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
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
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
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
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  proHeaderBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
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
    borderColor: '#EAB308',
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
  proPlanHeroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  proPlanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  proPlanTagBox: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proPlanTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.4,
  },
  proPlanHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 22,
    marginBottom: 14,
  },
  proPlanBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  proPillPurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  proPillPurpleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  proPillGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  proPillGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  proPillGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  proPillGrayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  proPillActiveGold: {
    backgroundColor: '#EAB308',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  proPillActiveGoldText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  streakCardHeader: {
    marginBottom: 12,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  streakBigCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
  },
  monthHeaderRow: {
    marginBottom: 8,
  },
  monthLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dayColHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    width: 32,
    textAlign: 'center',
  },
  heatmapGridContainer: {
    gap: 6,
    marginBottom: 14,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapCellInactive: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  heatmapCellActive: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  topCreatorCalloutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  topCreatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  scheduledLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  scheduledBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#582CDB',
  },
  scheduledThisWeek: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  calendarIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduledDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  scheduledBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPostTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  autopilotActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  trendingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightBodyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#171420',
    lineHeight: 19,
  },
  highlightGreen: {
    color: '#15803D',
    fontWeight: '900',
  },
  hourlyChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 48,
    paddingHorizontal: 8,
  },
  hourlyBar: {
    width: 44,
    borderRadius: 8,
  },
  levelCircleBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  levelCircleNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  levelTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  levelXpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  xpTrackBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  brandIconSquare: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proPriorityPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proPriorityText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#78350F',
  },
  brandQuestSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  brandQuestTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    marginTop: 4,
  },
  chevronRight: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: '400',
  },
  earningsCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  earningsMonthText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    backgroundColor: '#582CDB',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  earningsBigAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#171420',
  },
  earningsGrowthRate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  viewEarningsBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  viewEarningsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  voiceStudioLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: 0.5,
  },
  proUnlockedPill: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proUnlockedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#A16207',
  },
  waveformContainerBox: {
    backgroundColor: '#F5F3FF',
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveformBarItem: {
    width: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  voiceMinsCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
  },
  voiceMinsTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  savedVoiceSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  voiceProgressCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceProgressText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171420',
  },
  createVoiceBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  createVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  openStudioOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openStudioBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },
  matchAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#582CDB',
  },
  matchCreatorName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  matchOverlapTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },
  whyMatchCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  whyMatchInlineText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  matchRecommendationBox: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  matchRecommendationText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '600',
  },
  connectMatchOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectMatchBtnText: {
    color: '#582CDB',
    fontSize: 13.5,
    fontWeight: '900',
  },
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
    marginTop: 14,
  },
  modalFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  inputSectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  voiceToneChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voiceToneChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  voiceToneChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  voiceToneChipTextActive: {
    color: '#582CDB',
    fontWeight: '900',
  },
  voiceTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#171420',
    height: 80,
    textAlignVertical: 'top',
  },
  reqDetailLine: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '600',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  notifBody: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
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
    fontSize: 12,
    fontWeight: '800',
  },
});
