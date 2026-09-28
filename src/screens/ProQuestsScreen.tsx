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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { ProNotificationsModal, ProNotificationItem, DEFAULT_PRO_NOTIFICATIONS } from '../components/ProNotificationsModal';
import { HeaderDualModePills, UserPersona } from '../components/HeaderDualModePills';
import { sFont } from '../utils/responsive';

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


interface CompletedMissionItem {
  id: string;
  title: string;
  xp: string;
  completedAt: string;
  category: string;
  icon: string;
  summary: string;
  badge: string;
  metric: string;
}

const COMPLETED_MISSIONS_DATA: CompletedMissionItem[] = [
  {
    id: 'cm-1',
    title: 'Morning Reel Lock-in',
    xp: '+150 XP',
    completedAt: 'Today at 8:45 AM',
    category: 'Daily Consistency',
    icon: '🎬',
    summary: 'Published and verified a 42-second vertical Reel before the morning lock-in window.',
    badge: '🔥 Streak Maintained',
    metric: '100% Pacing Score',
  },
  {
    id: 'cm-2',
    title: '7-Day Streak Milestone',
    xp: '+250 XP',
    completedAt: 'Yesterday at 7:15 PM',
    category: 'Milestone Achievement',
    icon: '⚡',
    summary: 'Maintained 7 consecutive days of verified creator publishing without missing a daily deadline.',
    badge: '🛡️ Streak Shield Awarded',
    metric: '7/7 Days Verified',
  },
  {
    id: 'cm-3',
    title: 'Collab Pitch to Elena',
    xp: '+100 XP',
    completedAt: '2 days ago at 3:20 PM',
    category: 'Creator Collaboration',
    icon: '🤝',
    summary: 'Split-screen duet hook pitch accepted and verified with squad partner Elena Rostova.',
    badge: '👑 Synergy Score +8%',
    metric: 'Collaborative Script Approved',
  },
];

interface ProQuestsScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMissionDetail?: () => void;
  onOpenCommunityChallenge?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string, questDraft?: any, format?: string) => void;
  onSwitchToFree?: () => void;
  onTogglePersona?: () => void;
  userPersona?: UserPersona;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const ProQuestsScreen: React.FC<ProQuestsScreenProps> = ({
  onBackToDashboard,
  onLogout,
  onNavigateTab,
  onOpenMissionDetail,
  onOpenCommunityChallenge,
  onOpenSchedule,
  onOpenJarvisPro,
  onOpenPostComposer,
  onSwitchToFree,
  onTogglePersona,
  userPersona,
  userProfile,
  onSaveProfile,
}) => {
  const isNewUser = (userPersona || userProfile?.userPersona) === 'new';
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [selectedQuestFilter, setSelectedQuestFilter] = useState<'all' | 'squad'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalSubTab, setProfileModalSubTab] = useState<'profile' | 'socials' | 'verification' | 'settings'>('profile');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBrandQuestModal, setShowBrandQuestModal] = useState(false);
  const [showSquadQuestModal, setShowSquadQuestModal] = useState(false);
  const [showDuelTasksModal, setShowDuelTasksModal] = useState(false);
  const [showDuelScoreBreakdown, setShowDuelScoreBreakdown] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showLevelPerksModal, setShowLevelPerksModal] = useState(false);
  const [showCompletedMissionModal, setShowCompletedMissionModal] = useState(false);
  const [selectedCompletedMission, setSelectedCompletedMission] = useState<CompletedMissionItem | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationXp, setCelebrationXp] = useState(350);
  const [celebrationMessage, setCelebrationMessage] = useState('Daily Quest Activated!');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPerksInfo, setShowPerksInfo] = useState(false);

  // Selected Milestone Quest details
  const [selectedBrandName, setSelectedBrandName] = useState('60-Day Consistency Milestone');
  const [selectedBrandBounty, setSelectedBrandBounty] = useState('+450 XP');

  // Dynamic Available Quest Counts (bound to live sprint & squad quest pipelines)
  const [squadQuestCount, setSquadQuestCount] = useState(2);

  // Dynamic Live Duel Scores & Tasks State
  const [squadDuelScore, setSquadDuelScore] = useState(62);
  const [oppDuelScore, setOppDuelScore] = useState(58);
  const [availableDuelTasks, setAvailableDuelTasks] = useState(1);

  // Dynamically calculated Live Duel status & action prompt
  const getDuelDynamicStatus = () => {
    const diff = squadDuelScore - oppDuelScore;
    if (diff > 0) {
      return {
        text: `🔥 ${diff} pts ahead • ${availableDuelTasks} ${availableDuelTasks === 1 ? 'task' : 'tasks'} available`,
        type: 'ahead' as const,
      };
    } else if (diff < 0) {
      const needed = Math.abs(diff);
      return {
        text: `⚡ Your squad needs ${needed} more pts to secure the lead`,
        type: 'behind' as const,
      };
    } else {
      return {
        text: `⚡ Tied at ${squadDuelScore} pts • ${availableDuelTasks} ${availableDuelTasks === 1 ? 'task' : 'tasks'} available`,
        type: 'tied' as const,
      };
    }
  };

  // Live Countdown State for Today's Pro Quest (Target: 9:00 PM today)
  const calculateInitialSeconds = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(21, 0, 0, 0); // 9:00 PM today
    const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
    // If it's already past 9 PM today, provide a dynamic countdown for testing (e.g. 4h 12m 45s)
    return diff > 0 ? diff : 4 * 3600 + 12 * 60 + 45;
  };

  const [questTimeLeft, setQuestTimeLeft] = useState<number>(calculateInitialSeconds);
  const [todayQuestStatus, setTodayQuestStatus] = useState<'active' | 'completed' | 'expired'>('active');

  useEffect(() => {
    if (todayQuestStatus !== 'active') return;
    const interval = setInterval(() => {
      setQuestTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTodayQuestStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [todayQuestStatus]);

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return '00:00:00';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Notifications
  const [notifications, setNotifications] = useState<ProNotificationItem[]>(DEFAULT_PRO_NOTIFICATIONS);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Floating mascot loop
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

  const triggerCelebration = (xp: number, message: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationXp(xp);
    setCelebrationMessage(message);
    triggerModalPop();
    setShowCelebrationModal(true);
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

            <HeaderDualModePills
              tier="pro"
              persona={isNewUser ? 'new' : 'returning'}
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
                setProfileModalSubTab('profile');
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
            <View style={styles.questsProPill}>
              <Text style={styles.questsProPillText}>QUESTS • PRO</Text>
            </View>
          </View>

          <Text
            style={styles.mainTitleText}
            numberOfLines={2}
          >
            Win missions. Build reputation.
          </Text>

          {/* FILTER PILLS: All Quests | Squad (2) (Hidden for new users) */}
          {!isNewUser && (
            <View style={styles.questFilterRow}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedQuestFilter('all');
                }}
                style={[styles.questFilterPill, selectedQuestFilter === 'all' && styles.questFilterPillActive]}
              >
                <Text
                  style={[styles.questFilterText, selectedQuestFilter === 'all' && styles.questFilterTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  ✨ All Quests
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedQuestFilter('squad');
                }}
                style={[styles.questFilterPill, selectedQuestFilter === 'squad' && styles.questFilterPillActive]}
              >
                <Text
                  style={[styles.questFilterText, selectedQuestFilter === 'squad' && styles.questFilterTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  🛡️ Squad ({squadQuestCount})
                </Text>
              </Pressable>
            </View>
          )}

          {/* ============================================================ */}
          {/* ALL QUESTS EXCLUSIVE SECTIONS                                 */}
          {/* ============================================================ */}
          {(isNewUser || selectedQuestFilter === 'all') && (
            <>
            {/* CARD 1: TODAY'S PRO QUEST */}
            <View style={styles.todayProQuestCard}>
              <View style={styles.todayQuestTagBox}>
                <Text style={styles.todayQuestTagText}>TODAY&apos;S PRO QUEST</Text>
              </View>

              <Text
                style={styles.todayQuestTitle}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.65}
              >
                Publish your Reel before 9 PM
              </Text>
              <Text style={styles.todayQuestSub}>
                {isNewUser
                  ? 'Lock in Day 1 • Earn 350 XP • Boost Creator Level.'
                  : 'Lock in Daily Streak • Earn 350 XP • Boost Creator Level.'}
              </Text>

              {/* COUNTDOWN TIMER */}
              {todayQuestStatus === 'completed' ? (
                <View style={[styles.countdownTimerBox, styles.countdownCompletedBox]}>
                  <Text style={styles.timeCompletedLabel}>✓ MISSION ACCOMPLISHED</Text>
                  <Text style={styles.countdownCompletedDigits}>+350 XP CLAIMED 🎉</Text>
                </View>
              ) : todayQuestStatus === 'expired' ? (
                <View style={[styles.countdownTimerBox, styles.countdownExpiredBox]}>
                  <Text style={styles.timeExpiredLabel}>⚠️ QUEST TIME EXPIRED</Text>
                  <Text style={styles.countdownExpiredDigits}>00:00:00</Text>
                </View>
              ) : (
                <View style={styles.countdownTimerBox}>
                  <Text style={styles.timeLeftLabel}>TIME LEFT</Text>
                  <Text style={styles.countdownBigDigits}>{formatCountdown(questTimeLeft)}</Text>
                </View>
              )}

              {/* REWARDS STRIP */}
              <View style={styles.rewardsStripRow}>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardSmallLabel}>🏆 REWARD</Text>
                  <Text style={styles.rewardValGold}>+350 XP</Text>
                </View>

                <View style={styles.rewardDivider} />

                <View style={styles.rewardItem}>
                  <Text style={styles.rewardSmallLabel}>✨ IMPACT</Text>
                  <Text style={styles.rewardValPurple}>Streak Boost</Text>
                </View>

                <View style={styles.rewardDivider} />

                <View style={styles.rewardItem}>
                  <Text style={styles.rewardSmallLabel}>🎯 GOAL</Text>
                  <Text style={styles.rewardValDark}>1 Long Reel</Text>
                </View>
              </View>

              {/* CREATOR INSIGHT / STATUS CALLOUT */}
              {todayQuestStatus === 'completed' ? (
                <View style={[styles.questSparkleCallout, styles.questSparkleCompleted]}>
                  <Text style={[styles.questSparkleText, { color: '#059669' }]}>
                    ✨ <Text style={{ fontWeight: '700' }}>Daily Streak Locked!</Text> +350 XP credited to your Creator Profile.
                  </Text>
                </View>
              ) : todayQuestStatus === 'expired' ? (
                <View style={[styles.questSparkleCallout, styles.questSparkleExpired]}>
                  <Text style={[styles.questSparkleText, { color: '#64748B' }]}>
                    ⏰ <Text style={{ fontWeight: '700' }}>Quest window closed.</Text> Next daily mission refreshes tomorrow at 6:00 AM.
                  </Text>
                </View>
              ) : (
                <View style={styles.questSparkleCallout}>
                  <Text style={styles.questSparkleText}>
                    🔥 <Text style={{ fontWeight: '700' }}>Creator insight:</Text> Creators who complete daily quests earlier maintain stronger weekly consistency.
                  </Text>
                </View>
              )}

              {/* ACTION BUTTONS */}
              <View style={styles.questActionButtonsRow}>
                <Pressable
                  style={({ pressed }) => [styles.viewIdeaOutlineBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (onOpenMissionDetail) onOpenMissionDetail();
                    else showToast('Opening Reel Hook Angles: "3 creator mistakes I stopped making"');
                  }}
                >
                  <Text style={styles.viewIdeaBtnText}>View Idea</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.startReelSolidBtn,
                    todayQuestStatus === 'completed' && styles.completedQuestSolidBtn,
                    pressed && styles.btnPressed
                  ]}
                  onPress={() => {
                    if (todayQuestStatus === 'completed') {
                      showToast('Quest already completed today! +350 XP credited.');
                      return;
                    }
                    const reelQuestDraft = {
                      title: 'Publish your strongest Reel before 9 PM',
                      badgeLabel: "TODAY'S PRO QUEST (+350 XP)",
                      hook: "3 creator mistakes that were secretly killing my reach (and how I fixed them):",
                      story: "1. Obsessing over views instead of saves & shares.\n2. Posting inconsistently and losing algorithmic trust.\n3. Overcomplicating production instead of prioritizing a razor-sharp opening hook.",
                      lesson: "Consistency and clarity beat high production value every single time.",
                      cta: "Which of these 3 mistakes have you made? Drop a comment below 👇",
                      requirements: [
                        "Format: 1 Long Reel / Short Video (<60s)",
                        "Topic: 3 Creator Mistakes I Stopped Making",
                        `Target: Publish before 9:00 PM to lock in +350 XP & Day ${isNewUser ? '1' : '48'}`
                      ],
                      xpReward: 350
                    };
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowCelebrationModal(false);
                    setShowLevelPerksModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('3 creator mistakes I stopped making this year', 'Instagram', reelQuestDraft, 'short_video');
                    }
                  }}
                >
                  <Text style={styles.startReelBtnText}>
                    {todayQuestStatus === 'completed' ? '✓ Completed' : todayQuestStatus === 'expired' ? 'Submit Late' : 'Start Reel Quest'}
                  </Text>
                </Pressable>
              </View>
            </View>

          {/* ============================================================ */}
          {/* ROW 2: DUAL METRIC CARDS (Quests Completed & Creator XP)     */}
          {/* ============================================================ */}
          <View style={styles.dualMetricsRow}>
            {/* Metric 1 */}
            <View style={styles.metricSquareCard}>
              <View style={styles.metricIconCirclePurple}>
                <Text style={{ fontSize: 16 }}>🎯</Text>
              </View>
              <Text style={styles.metricSquareNumber}>{isNewUser ? '0' : '67'}</Text>
              <Text style={styles.metricSquareLabel}>QUESTS COMPLETED</Text>
            </View>

            {/* Metric 2 */}
            <View style={styles.metricSquareCard}>
              <View style={styles.metricIconCircleGold}>
                <Text style={{ fontSize: 16 }}>🏆</Text>
              </View>
              <Text style={styles.metricSquareNumber}>{isNewUser ? '0' : '14,320'}</Text>
              <Text style={styles.metricSquareLabel}>CREATOR XP</Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 3: CREATOR LEVEL & XP PROGRESS                          */}
          {/* ============================================================ */}
          <View style={styles.levelProgressCard}>
            <View style={styles.levelHeaderRow}>
              <View>
                <Text style={styles.levelSmallLabel}>CREATOR LEVEL</Text>
                <Text style={styles.levelBigTitle}>{isNewUser ? 'Level 1' : 'Level 12'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.levelSmallLabel}>LEVEL PROGRESS</Text>
                <Text
                  style={styles.nextLevelPercentText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  {isNewUser ? '0% COMPLETE' : '82% COMPLETE'}
                </Text>
              </View>
            </View>

            <View style={styles.levelProgressTrackBg}>
              <LinearGradient
                colors={['#582CDB', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.levelProgressTrackFill, { width: isNewUser ? '0%' : '82%' }]}
              />
            </View>

            <View style={styles.levelBottomCalloutRow}>
              <Text style={styles.levelTotalXpText}>
                {isNewUser ? '0 / 500 XP' : '4,320 / 5,250 XP'}
              </Text>
              <Pressable
                onPress={() => {
                  triggerModalPop();
                  setShowLevelPerksModal(true);
                }}
                hitSlop={8}
              >
                <Text style={styles.unlockNextRewardsLink}>
                  {isNewUser ? 'Level 2 Perks ➔' : 'Level 13 Perks ➔'}
                </Text>
              </Pressable>
            </View>
          </View>

            </>
          )}

          {/* ============================================================ */}
          {/* SQUAD QUESTS SECTION (Hidden for new users)                  */}
          {/* ============================================================ */}
          {!isNewUser && (selectedQuestFilter === 'all' || selectedQuestFilter === 'squad') && (
            <>
              {/* SQUAD FILTER BANNER */}
              {selectedQuestFilter === 'squad' && (
                <View style={styles.filterActiveBanner}>
                  <Text style={styles.filterActiveBannerText}>
                    🛡️ <Text style={{ fontWeight: '700', color: '#582CDB' }}>SQUAD QUESTS & LIVE DUELS</Text> • 2 Active Challenges
                  </Text>
                </View>
              )}

              {/* CARD 4: SQUAD QUEST */}
          <View style={styles.squadQuestCard}>
            <View style={styles.squadQuestHeaderRow}>
              <View style={styles.squadQuestPill}>
                <Text style={styles.squadQuestPillText}>SQUAD QUEST</Text>
              </View>
              <View style={styles.groupRewardPill}>
                <Text style={styles.groupRewardPillText}>GROUP REWARD: +750 XP</Text>
              </View>
            </View>

            <Text
              style={styles.squadQuestTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              Momentum Makers Weekly Push
            </Text>
            <Text style={styles.squadQuestDesc}>
              Publish 8 Reels as a squad this week to claim the Squad Creator Crown.
            </Text>

            {/* SQUAD REELS PROGRESS TRACKER */}
            <View style={styles.squadQuestProgressBox}>
              <View style={styles.squadQuestProgressHeader}>
                <Text style={styles.squadQuestProgressTitle}>🔥 5 / 8 Reels Published</Text>
                <Text style={styles.squadQuestProgressRemaining}>3 to +750 XP</Text>
              </View>
              <View style={styles.squadQuestProgressBarBg}>
                <LinearGradient
                  colors={['#582CDB', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.squadQuestProgressBarFill, { width: '62.5%' }]}
                />
              </View>
            </View>

            <View style={styles.squadMembersRow}>
              <View style={styles.stackedAvatarsGroup}>
                <Image source={require('../../assets/images/elena-avatar.jpg')} style={[styles.miniSquadAvatar, { zIndex: 3 }]} />
                <Image source={require('../../assets/images/amara-avatar.jpg')} style={[styles.miniSquadAvatar, { marginLeft: -8, zIndex: 2 }]} />
                <Image source={require('../../assets/images/david-avatar.jpg')} style={[styles.miniSquadAvatar, { marginLeft: -8, zIndex: 1 }]} />
              </View>
              <View style={styles.activeMembersPill}>
                <Text style={styles.activeMembersText}>4 of 4 Active Members</Text>
              </View>
            </View>

            <View style={styles.squadActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.viewSquadOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowSquadQuestModal(true);
                }}
              >
                <Text
                  style={styles.viewSquadBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  View Quest
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.contributeSolidBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (onOpenPostComposer) {
                    onOpenPostComposer('Momentum Makers Squad Gauntlet Reel');
                  }
                }}
              >
                <Text
                  style={styles.contributeBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Contribute
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 5: LIVE DUEL                                            */}
          {/* ============================================================ */}
          <View style={styles.liveDuelCard}>
            <View style={styles.duelTopRow}>
              <View style={styles.liveDuelTagPill}>
                <Text style={styles.liveDuelTagPillText}>LIVE DUEL</Text>
              </View>
              <Text style={styles.duelEndsInText}>ENDS IN 4 HOURS</Text>
            </View>

            <Text
              style={styles.duelCardTitle}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              Momentum Makers vs Lagos Storytellers
            </Text>

            <View style={styles.duelBarGroup}>
              <View style={styles.duelBarLabelRow}>
                <Text style={styles.duelSquadNameMine}>Momentum Makers (You)</Text>
                <Text style={styles.duelScoreMine}>{squadDuelScore} pts</Text>
              </View>
              <View style={styles.duelTrackBg}>
                <View style={[styles.duelTrackFillMine, { width: `${Math.min(100, Math.round((squadDuelScore / ((squadDuelScore + oppDuelScore) || 100)) * 100))}%` }]} />
              </View>
            </View>

            <View style={styles.duelBarGroup}>
              <View style={styles.duelBarLabelRow}>
                <Text style={styles.duelSquadNameOpp}>Lagos Storytellers</Text>
                <Text style={styles.duelScoreOpp}>{oppDuelScore} pts</Text>
              </View>
              <View style={styles.duelTrackBg}>
                <View style={[styles.duelTrackFillOpp, { width: `${Math.min(100, Math.round((oppDuelScore / ((squadDuelScore + oppDuelScore) || 100)) * 100))}%` }]} />
              </View>
            </View>

            {/* DYNAMIC DUEL STATUS LINE */}
            {(() => {
              const status = getDuelDynamicStatus();
              return (
                <View
                  style={[
                    styles.duelStatusRow,
                    status.type === 'ahead'
                      ? styles.duelStatusRowAhead
                      : status.type === 'behind'
                      ? styles.duelStatusRowBehind
                      : styles.duelStatusRowTied,
                  ]}
                >
                  <Text
                    style={[
                      styles.duelStatusText,
                      status.type === 'ahead'
                        ? styles.duelStatusTextAhead
                        : status.type === 'behind'
                        ? styles.duelStatusTextBehind
                        : styles.duelStatusTextTied,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {status.text}
                  </Text>
                </View>
              );
            })()}

            <Pressable
              style={({ pressed }) => [styles.viewDuelTasksBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowDuelTasksModal(true);
              }}
            >
              <Text style={styles.viewDuelTasksBtnText}>View Duel Tasks</Text>
            </Pressable>
          </View>

            </>
          )}

          {/* ============================================================ */}
          {/* MILESTONES & CREATOR SPRINTS SECTION                         */}
          {/* ============================================================ */}
          {(isNewUser || selectedQuestFilter === 'all') && (
            <>
              {/* SECTION 6: MILESTONE & SPRINT QUESTS */}
              <Text style={styles.premiumQuestsSectionHeader}>
                {isNewUser ? 'Active Quests' : 'Milestones & Creator Sprints'}
              </Text>

          <View style={{ gap: 10, marginBottom: 16 }}>
            {/* Quest 1: Milestone */}
            <Pressable
              style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedBrandName('60-Day Consistency Milestone');
                setSelectedBrandBounty('+450 XP');
                triggerModalPop();
                setShowBrandQuestModal(true);
              }}
            >
              <View style={styles.premiumQuestTopRow}>
                <View style={styles.brandIconCirclePurple}>
                  <Text style={{ fontSize: 15 }}>🎁</Text>
                </View>
                <Text
                  style={styles.brandQuestItemTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  60-Day Consistency Milestone
                </Text>
                <Text style={styles.chevronGray}>›</Text>
              </View>

              <View style={styles.premiumQuestMetaRow}>
                <View style={styles.proPriorityBadgePill}>
                  <Text style={styles.proPriorityBadgePillText} numberOfLines={1}>
                    {isNewUser ? '🔥 0 / 60 DAYS COMPLETED' : '🔥 48 / 60 DAYS COMPLETED'}
                  </Text>
                </View>
                <View style={styles.bountyRewardPill}>
                  <Text style={styles.bountyPillAmountGold} numberOfLines={1}>+450 XP Reward</Text>
                </View>
              </View>
            </Pressable>

            {/* Quest 2: Lagos Food Festival */}
            <Pressable
              style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedBrandName('Viral Reel Hook Sprint');
                setSelectedBrandBounty('+350 XP');
                triggerModalPop();
                setShowBrandQuestModal(true);
              }}
            >
              <View style={styles.premiumQuestTopRow}>
                <View style={styles.brandIconCircleGold}>
                  <Text style={{ fontSize: 15 }}>⚡</Text>
                </View>
                <Text
                  style={styles.brandQuestItemTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  Viral Reel Hook Sprint
                </Text>
                <Text style={styles.chevronGray}>›</Text>
              </View>

              <View style={styles.premiumQuestMetaRow}>
                <View style={styles.brandQuestBadgePill}>
                  <Text style={styles.brandQuestBadgePillText} numberOfLines={1}>⚡ CREATOR SPRINT</Text>
                </View>
                <View style={styles.bountyRewardPill}>
                  <Text style={styles.bountyPillAmountGold} numberOfLines={1}>+350 XP Reward</Text>
                </View>
              </View>
            </Pressable>

            {/* Quest 3: Verified Creator profile (Hidden for new users) */}
            {!isNewUser && (
              <Pressable
                style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setProfileModalSubTab('verification');
                  triggerModalPop();
                  setShowProfileModal(true);
                }}
              >
                <View style={styles.premiumQuestTopRow}>
                  <View style={styles.brandIconCircleGray}>
                    <Text style={{ fontSize: 15 }}>🪪</Text>
                  </View>
                  <Text
                    style={styles.brandQuestItemTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    Fill out your Verified Creator profile
                  </Text>
                  <Text style={styles.chevronGray}>›</Text>
                </View>

                <View style={styles.premiumQuestMetaRow}>
                  <View style={styles.profileProgressBadgePill}>
                    <Text style={styles.profileProgressBadgePillText} numberOfLines={1}>🛡️ 4 of 5 complete</Text>
                  </View>
                  <View style={styles.passportBoostRewardPill}>
                    <Text style={styles.passportBoostRewardAmountPurple} numberOfLines={1}>✨ Level Boost</Text>
                  </View>
                </View>
              </Pressable>
            )}
          </View>
            </>
          )}

          {/* ============================================================ */}
          {/* GENERAL PROGRESS, MATCHING & REPUTATION (ALL QUESTS TAB)     */}
          {/* ============================================================ */}
          {(isNewUser || selectedQuestFilter === 'all') && (
            <>
              {/* CARD 7: PRIORITY OPPORTUNITY MATCHING (Hidden for new users) */}
              {!isNewUser && (
                <View style={styles.darkOpportunityCard}>
                  <View style={styles.darkCardHeaderRow}>
                    <Text
                      style={styles.darkCardTag}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      PRIORITY OPPORTUNITY MATCHING
                    </Text>
                    <Text style={{ fontSize: 18 }}>👑</Text>
                  </View>

                  <Text
                    style={styles.darkCardTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                  >
                    Priority Squad &amp; Collab Status
                  </Text>
                  <Text style={styles.darkCardDesc}>
                    Your Creator Profile is ranking in the top 2% for consistency and streak achievements.
                  </Text>

                  <View style={styles.darkMetricsStack}>
                    {/* Metric 1 */}
                    <View style={styles.darkMetricRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text style={{ fontSize: 14 }}>🛡️</Text>
                        <Text
                          style={styles.darkMetricLabel}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          COLLAB READINESS
                        </Text>
                      </View>
                      <Text style={styles.darkMetricValPurple}>94%</Text>
                    </View>

                    {/* Metric 2 */}
                    <View style={styles.darkMetricRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text style={{ fontSize: 14 }}>🤝</Text>
                        <Text
                          style={styles.darkMetricLabel}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          PRIORITY COLLABS
                        </Text>
                      </View>
                      <Text style={styles.darkMetricValLight}>4 Available</Text>
                    </View>

                    {/* Metric 3 */}
                    <View style={styles.darkMetricRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text style={{ fontSize: 14 }}>⚡</Text>
                        <Text
                          style={styles.darkMetricLabel}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          XP REWARD RANGE
                        </Text>
                      </View>
                      <Text style={styles.darkMetricValGreen}>+350–+1,200 XP</Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.viewOpportunitiesSolidBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      triggerModalPop();
                      setShowOpportunityModal(true);
                    }}
                  >
                    <Text
                      style={styles.viewOpportunitiesBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      View Opportunities 👑 ➔
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* CARD 8: CREATOR REPUTATION TIER */}
              <View style={styles.reputationTierCard}>
                <Text style={styles.reputationHeaderTitle}>CREATOR REPUTATION TIER</Text>

                <View style={styles.stepTrackRow}>
                  {/* Step 1: Level 1 */}
                  <View style={styles.stepItemCol}>
                    <View style={isNewUser ? styles.stepCircleCurrent : styles.stepCircleActive}>
                      {isNewUser ? (
                        <Text style={{ fontSize: 12 }}>🎯</Text>
                      ) : (
                        <Text style={styles.stepCheckIcon}>✓</Text>
                      )}
                    </View>
                    <Text style={[styles.stepLevelText, isNewUser && { color: '#582CDB', fontWeight: '800' }]}>Level 1</Text>
                    <Text style={[styles.stepBadgeName, isNewUser && { color: '#582CDB', fontWeight: '700' }]}>
                      {isNewUser ? 'Starter' : 'Verified'}
                    </Text>
                  </View>

                  <View style={isNewUser ? styles.stepConnectorInactive : styles.stepConnectorActive} />

                  {/* Step 2: Level 12 */}
                  <View style={styles.stepItemCol}>
                    <View style={isNewUser ? styles.stepCircleInactive : styles.stepCircleCurrent}>
                      <Text style={{ fontSize: 12 }}>🏆</Text>
                    </View>
                    <Text style={[styles.stepLevelText, !isNewUser && { color: '#582CDB' }]}>Level 12</Text>
                    <Text style={[styles.stepBadgeName, !isNewUser && { color: '#582CDB' }]}>Elite</Text>
                  </View>

                  <View style={styles.stepConnectorInactive} />

                  {/* Step 3: Level 25 */}
                  <View style={styles.stepItemCol}>
                    <View style={styles.stepCircleInactive}>
                      <Text style={{ fontSize: 12 }}>⚡</Text>
                    </View>
                    <Text style={styles.stepLevelText}>Level 25</Text>
                    <Text style={styles.stepBadgeName}>Pro Master</Text>
                  </View>

                  <View style={styles.stepConnectorInactive} />

                  {/* Step 4: Level 50 */}
                  <View style={styles.stepItemCol}>
                    <View style={styles.stepCircleInactive}>
                      <Text style={{ fontSize: 12 }}>👑</Text>
                    </View>
                    <Text style={styles.stepLevelText}>Level 50</Text>
                    <Text style={styles.stepBadgeName}>Icon</Text>
                  </View>
                </View>
              </View>

              {/* CARD 9: JARVIS REPUTATION RECOMMENDATION (Hidden for new users) */}
              {!isNewUser && (
                <View style={styles.jarvisRepCard}>
                  <Image
                    source={require('../../assets/images/jarvis-core-flame.png')}
                    style={{ width: 32, height: 32, alignSelf: 'center', marginBottom: 10 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.jarvisRepQuote}>
                    &ldquo;Your strongest momentum is in high-retention storytelling clips. Complete 2 more milestone sprints to level up your Creator Tier.&rdquo;
                  </Text>

                  <View style={styles.jarvisTagsColumn}>
                    <Pressable
                      style={({ pressed }) => [styles.jarvisTagItem, pressed && styles.btnPressed]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (onOpenPostComposer) {
                          onOpenPostComposer('Lifestyle Reel Draft');
                        } else {
                          showToast('Opening Lifestyle Content Recommendations...');
                        }
                      }}
                    >
                      <Text
                        style={styles.jarvisTagText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        🏷️ Focus: Lifestyle Reels
                      </Text>
                      <Text style={styles.jarvisTagChevron}>→</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.jarvisTagItem, pressed && styles.btnPressed]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (onOpenSchedule) {
                          onOpenSchedule();
                        } else {
                          showToast('7:30 PM Peak Audience Engagement Analysis');
                        }
                      }}
                    >
                      <Text
                        style={styles.jarvisTagText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        ⚡ Optimal Time: 7:30 PM
                      </Text>
                      <Text style={styles.jarvisTagChevron}>→</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.jarvisTagItem, pressed && styles.btnPressed]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        triggerModalPop();
                        setShowOpportunityModal(true);
                      }}
                    >
                      <Text
                        style={styles.jarvisTagText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        🎯 Viral Hook Sprint: +350 XP
                      </Text>
                      <Text style={styles.jarvisTagChevron}>→</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ============================================================ */}
              {/* SECTION 10: COMPLETED MISSIONS                               */}
              {/* ============================================================ */}
              <Text style={styles.completedSectionTitle}>COMPLETED MISSIONS</Text>

              <View style={styles.completedCard}>
                {isNewUser ? (
                  <View style={{ paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500', textAlign: 'center', lineHeight: 18 }}>
                      Complete your first quest to start your mission log.
                    </Text>
                  </View>
                ) : (
                  COMPLETED_MISSIONS_DATA.map((mission, idx) => (
                    <React.Fragment key={mission.id}>
                      {idx > 0 && <View style={styles.completedDivider} />}
                      <Pressable
                        style={({ pressed }) => [styles.completedItemRow, pressed && styles.btnPressed]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCompletedMission(mission);
                          triggerModalPop();
                          setShowCompletedMissionModal(true);
                        }}
                      >
                        <Text style={styles.greenCheckIcon}>✓</Text>
                        <Text
                          style={styles.completedTitleText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {mission.title}
                        </Text>
                        <View style={styles.completedRightGroup}>
                          <Text style={styles.completedXpBadge}>{mission.xp}</Text>
                          <Text style={styles.completedChevron}>→</Text>
                        </View>
                      </Pressable>
                    </React.Fragment>
                  ))
                )}
              </View>
            </>
          )}

          {/* SQUAD EMPTY / COMING SOON STATE (IF NO SQUAD QUESTS) */}
          {selectedQuestFilter === 'squad' && false && (
            <View style={styles.emptyQuestCard}>
              <View style={styles.emptyQuestIconBox}>
                <Text style={{ fontSize: 24 }}>🛡️</Text>
              </View>
              <Text style={styles.emptyQuestTitle}>Squad Quests Coming Soon</Text>
              <Text style={styles.emptyQuestDesc}>
                Check back soon! Your squad is currently between weekly sprints. New squad gauntlets unlock every Monday at 9 AM.
              </Text>
              <Pressable
                style={styles.emptyQuestBtn}
                onPress={() => setSelectedQuestFilter('all')}
              >
                <Text style={styles.emptyQuestBtnText}>Explore All Quests ➔</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL: ULTRA-LUXURY BRAND QUEST SPECIFICATION               */}
        {/* ============================================================ */}
        <Modal
          visible={showBrandQuestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowBrandQuestModal(false);
            setShowPerksInfo(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.brandModalCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Top Tag & Close Row (Pinned Header) */}
              <View style={styles.brandModalTopTagRow}>
                <View style={styles.brandModalProPill}>
                  <Text style={styles.brandModalProPillText}>✨ CREATOR MILESTONE</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setShowBrandQuestModal(false);
                    setShowPerksInfo(false);
                  }}
                  style={styles.brandModalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.brandModalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Scrollable Content (Safe when expanded/stretched out) */}
              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* Full-width Modal Title */}
                <Text
                  style={styles.brandModalTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {selectedBrandName}
                </Text>

                {/* Hero XP Header Strip */}
                <View style={styles.brandModalHeroBountyBox}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.brandModalBountyLabel}>QUEST REWARD</Text>
                    <Text style={styles.brandModalBountyValue}>{selectedBrandBounty}</Text>
                  </View>
                  <View style={styles.brandModalBountyBadge}>
                    <Text style={styles.brandModalBountyBadgeText}>✨ Level Booster</Text>
                  </View>
                </View>

                {/* Single Unified Specification Sheet Card */}
                <View style={styles.brandSpecSheet}>
                  {/* Spec Row 1: Deliverable */}
                  <View style={styles.brandSpecSheetRow}>
                    <View style={styles.brandSpecIconCircleGold}>
                      <Text style={{ fontSize: 13 }}>🎬</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.brandSpecRowHeader}>
                        <Text style={styles.brandSpecRowLabel}>DELIVERABLE</Text>
                        <View style={styles.brandSpecPlatformsRow}>
                          <View style={styles.brandSpecPlatformTag}><Text style={styles.brandSpecPlatformText}>Reels</Text></View>
                          <View style={styles.brandSpecPlatformTag}><Text style={styles.brandSpecPlatformText}>TikTok</Text></View>
                        </View>
                      </View>
                      <Text style={styles.brandSpecRowMain}>1 × 45s Dedicated Video</Text>
                      <Text style={styles.brandSpecRowSub}>Published to Instagram Reels + TikTok with streak verification</Text>
                    </View>
                  </View>

                  <View style={styles.brandSpecDivider} />

                  {/* Spec Row 2: Review Turnaround */}
                  <View style={styles.brandSpecSheetRow}>
                    <View style={styles.brandSpecIconCirclePurple}>
                      <Text style={{ fontSize: 13 }}>⚡</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.brandSpecRowHeader}>
                        <Text style={styles.brandSpecRowLabel}>XP CREDITING</Text>
                        <View style={styles.brandSpecFastTrackTag}>
                          <Text style={styles.brandSpecFastTrackText}>INSTANT</Text>
                        </View>
                      </View>
                      <Text style={styles.brandSpecRowMain}>Direct XP credit toward next Level</Text>
                    </View>
                  </View>

                  <View style={styles.brandSpecDivider} />

                  {/* Spec Row 3: Streak Milestone Progress */}
                  <View style={styles.brandSpecSheetRow}>
                    <View style={styles.brandSpecIconCircleFire}>
                      <Text style={{ fontSize: 13 }}>🔥</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.brandSpecRowHeader}>
                        <Text style={styles.brandSpecRowLabel}>STREAK MILESTONE</Text>
                        <View style={styles.brandSpecProgressTag}>
                          <Text style={styles.brandSpecProgressTagText}>
                            {isNewUser ? '0% COMPLETE' : '80% COMPLETE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.brandSpecRowMain}>
                        {isNewUser ? '0 / 60 Days' : '48 / 60 Days'}
                      </Text>
                      <Text style={styles.brandSpecRowSub}>
                        {isNewUser
                          ? `60 days remaining to claim ${selectedBrandBounty} milestone`
                          : `12 days remaining to claim ${selectedBrandBounty} milestone`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.brandSpecDivider} />

                  {/* Spec Row 4: Passport Match */}
                  <View style={styles.brandSpecSheetRow}>
                    <View style={styles.brandSpecIconCircleGreen}>
                      <Text style={{ fontSize: 13 }}>🪪</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.brandSpecRowHeader}>
                        <Text style={styles.brandSpecRowLabel}>CREATOR LEVEL FIT</Text>
                        <View style={styles.brandSpecMatchTag}>
                          <Text style={styles.brandSpecMatchTagText}>94% MATCH</Text>
                        </View>
                      </View>
                      <Text style={styles.brandSpecRowMain}>High Audience & Niche Fit</Text>
                      <Text style={styles.brandSpecRowSub}>Verified Creator Level readiness</Text>
                    </View>
                  </View>
                </View>

                {/* Expandable Quest Perks Toggle Button */}
                <Pressable
                  style={styles.brandEscrowToggleBtn}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPerksInfo(prev => !prev);
                  }}
                >
                  <Text style={styles.brandEscrowToggleText}>
                    {showPerksInfo ? '▲ Hide Quest Perks' : '▼ View Quest & Rank Rewards ⓘ'}
                  </Text>
                </Pressable>

                {/* Expandable Quest Perks Explainer */}
                {showPerksInfo && (
                  <View style={styles.brandEscrowBanner}>
                    <Text style={styles.brandEscrowBannerTitle}>⚡ CREATOR LEVEL & STREAK PERKS</Text>
                    <Text style={styles.brandEscrowBullet}>• {selectedBrandBounty} added to your Creator Level immediately upon completion</Text>
                    <Text style={styles.brandEscrowBullet}>• Unlocks exclusive Creator Badge & Profile Flair</Text>
                    <Text style={styles.brandEscrowBullet}>• Awards 1 Bonus Streak Freeze Shield to protect your streak</Text>
                  </View>
                )}
              </ScrollView>

              {/* Fixed Bottom Action Container (Never clipped) */}
              <View style={styles.brandModalBottomActions}>
                <Pressable
                  style={styles.brandModalApplyBtn}
                  onPress={() => {
                    setShowBrandQuestModal(false);
                    setShowPerksInfo(false);
                    showToast(`🎉 Quest activated! Progress is now tracking for ${selectedBrandName}.`);
                  }}
                >
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    style={styles.brandModalApplyGradient}
                  >
                    <Text
                      style={styles.brandModalApplyBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Start Quest ({selectedBrandBounty}) ➔
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Text
                  style={styles.brandModalFooterHelper}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  ⚡ XP instantly credits towards your next Level
                </Text>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: ULTRA-LUXURY SQUAD QUEST GAUNTLET DETAILS             */}
        {/* ============================================================ */}
        <Modal
          visible={showSquadQuestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSquadQuestModal(false)}
        >
          <View style={styles.squadQuestModalOverlay}>
            <Pressable style={styles.squadQuestModalBackdrop} onPress={() => setShowSquadQuestModal(false)} />
            <Animated.View style={[styles.squadQuestModalCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Top Header Row */}
              <View style={styles.sqmHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, marginRight: 6 }}>
                  <View style={styles.sqmCrownBox}>
                    <Text style={{ fontSize: 16 }}>🏆</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text
                        style={styles.sqmCategoryTag}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        WEEKLY SQUAD GAUNTLET
                      </Text>
                      <View style={styles.sqmTierPill}>
                        <Text style={styles.sqmTierPillText} numberOfLines={1}>👑 PRO TIER</Text>
                      </View>
                    </View>
                    <Text
                      style={styles.sqmMainTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      Momentum Makers Weekly Push
                    </Text>
                  </View>
                </View>

                <Pressable onPress={() => setShowSquadQuestModal(false)} style={styles.sqmCloseBtn} hitSlop={8}>
                  <Text style={styles.sqmCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.sqmContentScroll} showsVerticalScrollIndicator={false}>
                {/* Progress Overview Card */}
                <LinearGradient
                  colors={['#2A1259', '#1A0C38']}
                  style={styles.sqmProgressBanner}
                >
                  <View style={styles.sqmProgressTopRow}>
                    <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                      <Text
                        style={styles.sqmProgressLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        TOTAL SQUAD COMPLETION
                      </Text>
                      <Text
                        style={styles.sqmProgressBigText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        5 / 8 Reels (62%)
                      </Text>
                    </View>
                    <View style={styles.sqmTimerPill}>
                      <Text
                        style={styles.sqmTimerText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        ⏳ 3d 14h Left
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sqmTrackBg}>
                    <View style={[styles.sqmTrackFill, { width: '62%' }]} />
                  </View>

                  <Text style={styles.sqmRemainingHint}>
                    🔥 <Text style={{ fontWeight: '700', color: '#FDE68A' }}>3 Reels remaining</Text> to claim the shared +750 XP reward and Creator Crown!
                  </Text>
                </LinearGradient>

                {/* Rewards Vault Grid (2 Rows of 2 Side-by-Side) */}
                <View style={styles.sqmRewardsSection}>
                  <Text style={styles.sqmSectionTitle}>UNLOCKED AT 100% COMPLETION</Text>
                  <View style={styles.sqmRewardsGrid}>
                    {/* Row 1 */}
                    <View style={styles.sqmRewardsRow}>
                      <View style={styles.sqmRewardCard}>
                        <Text style={styles.sqmRewardIcon}>✨</Text>
                        <Text style={styles.sqmRewardValue}>+750 XP</Text>
                        <Text style={styles.sqmRewardLabel}>Shared Reward</Text>
                      </View>

                      <View style={styles.sqmRewardCard}>
                        <Text style={styles.sqmRewardIcon}>🛡️</Text>
                        <Text style={styles.sqmRewardValue}>7-Day Shield</Text>
                        <Text style={styles.sqmRewardLabel}>Streak Guard</Text>
                      </View>
                    </View>

                    {/* Row 2 */}
                    <View style={styles.sqmRewardsRow}>
                      <View style={styles.sqmRewardCard}>
                        <Text style={styles.sqmRewardIcon}>👑</Text>
                        <Text style={styles.sqmRewardValue}>Squad Crown</Text>
                        <Text style={styles.sqmRewardLabel}>Profile Trophy</Text>
                      </View>

                      <View style={styles.sqmRewardCard}>
                        <Text style={styles.sqmRewardIcon}>⚡</Text>
                        <Text style={styles.sqmRewardValue}>1.5× XP Boost</Text>
                        <Text style={styles.sqmRewardLabel}>14-Day Velocity</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Detailed Member Contributions */}
                <View style={styles.sqmMembersSection}>
                  <Text style={styles.sqmSectionTitle}>CREATOR CONTRIBUTIONS (4/4 ACTIVE)</Text>
                  <View style={styles.sqmMembersList}>
                    {/* Elena */}
                    <View style={styles.sqmMemberRow}>
                      <Image source={require('../../assets/images/elena-avatar.jpg')} style={styles.sqmMemberAvatar} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={styles.sqmMemberName}>Elena Rostova</Text>
                          <View style={styles.sqmHostBadge}>
                            <Text style={styles.sqmHostBadgeText}>👑 HOST</Text>
                          </View>
                        </View>
                        <Text style={styles.sqmMemberSub}>Tech & Product • 🔥 47d streak</Text>
                      </View>
                      <View style={styles.sqmScoreBadgeCompleted}>
                        <Text style={styles.sqmScoreBadgeCompletedText}>2/2 Reels ✓</Text>
                      </View>
                    </View>

                    {/* Pablo (You) */}
                    <View style={[styles.sqmMemberRow, styles.sqmMemberRowMine]}>
                      <Image source={require('../../assets/images/elena-avatar.jpg')} style={styles.sqmMemberAvatar} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={styles.sqmMemberName}>{userProfile?.name || 'Pablo'} (You)</Text>
                          <View style={styles.sqmTopBadge}>
                            <Text style={styles.sqmTopBadgeText}>⭐ TOP</Text>
                          </View>
                        </View>
                        <Text style={styles.sqmMemberSub}>Creator Growth • 🔥 47d streak</Text>
                      </View>
                      <View style={styles.sqmScoreBadgeCompleted}>
                        <Text style={styles.sqmScoreBadgeCompletedText}>2/2 Reels ✓</Text>
                      </View>
                    </View>

                    {/* Amara */}
                    <View style={styles.sqmMemberRow}>
                      <Image source={require('../../assets/images/amara-avatar.jpg')} style={styles.sqmMemberAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sqmMemberName}>Amara Okafor</Text>
                        <Text style={styles.sqmMemberSub}>Storytelling • 🔥 31d streak</Text>
                      </View>
                      <View style={styles.sqmScoreBadgePending}>
                        <Text style={styles.sqmScoreBadgePendingText}>1/2 Reels (Filming)</Text>
                      </View>
                    </View>

                    {/* David */}
                    <View style={styles.sqmMemberRow}>
                      <Image source={require('../../assets/images/david-avatar.jpg')} style={styles.sqmMemberAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sqmMemberName}>David Kim</Text>
                        <Text style={styles.sqmMemberSub}>Systems • 🔥 19d streak</Text>
                      </View>
                      <View style={styles.sqmScoreBadgeScheduled}>
                        <Text style={styles.sqmScoreBadgeScheduledText}>📅 7:30 PM</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Quest Milestones */}
                <View style={styles.sqmMilestonesSection}>
                  <Text style={styles.sqmSectionTitle}>QUEST MILESTONES</Text>
                  <View style={styles.sqmMilestoneCard}>
                    <View style={styles.sqmMilestoneRow}>
                      <Text style={styles.sqmGreenCheck}>✓</Text>
                      <Text style={styles.sqmMilestoneText}>Phase 1: Publish 4 Squad Reels (+250 XP Unlocked)</Text>
                    </View>
                    <View style={styles.sqmMilestoneRow}>
                      <Text style={styles.sqmGreenCheck}>✓</Text>
                      <Text style={styles.sqmMilestoneText}>Phase 2: Complete 1 Duo Split-Screen Duet (+250 XP Unlocked)</Text>
                    </View>
                    <View style={styles.sqmMilestoneRow}>
                      <Text style={{ fontSize: 13, color: '#F59E0B' }}>⚡</Text>
                      <Text style={[styles.sqmMilestoneText, { color: '#171420', fontWeight: '800' }]}>
                        Phase 3: Reach 8 Total Reels (3 remaining to claim +750 XP Crown!)
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.sqmActionsRow}>
                <Pressable
                  style={styles.sqmOutlineBtn}
                  onPress={() => {
                    setShowSquadQuestModal(false);
                    setSelectedQuestFilter('squad');
                  }}
                >
                  <Text
                    style={styles.sqmOutlineBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Squad Room
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.sqmSolidBtn}
                  onPress={() => {
                    setShowSquadQuestModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('Momentum Makers Squad Gauntlet Reel');
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    style={styles.sqmSolidGradient}
                  >
                    <Text
                      style={styles.sqmSolidBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      Contribute Reel ➔
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: LIVE DUEL ARENA DETAILS & SQUAD TASKS                 */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* MODAL: LIVE DUEL ARENA DETAILS & SQUAD TASKS                 */}
        {/* ============================================================ */}
        <Modal
          visible={showDuelTasksModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDuelTasksModal(false)}
        >
          <View style={styles.duelModalOverlay}>
            <Pressable style={styles.duelModalBackdrop} onPress={() => setShowDuelTasksModal(false)} />
            <Animated.View style={[styles.duelModalCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Top Header */}
              <View style={styles.duelModalTopHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, marginRight: 8 }}>
                  <View style={styles.duelModalSwordsBox}>
                    <Text style={{ fontSize: 16 }}>⚔️</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.duelModalLivePill}>
                        <View style={styles.duelModalLiveDot} />
                        <Text style={styles.duelModalLivePillText} numberOfLines={1}>ROUND 2 / 3 LIVE</Text>
                      </View>
                      <Text style={styles.duelModalTimerText} numberOfLines={1}>⏳ 03h 45m</Text>
                    </View>
                    <Text
                      style={styles.duelModalTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Momentum vs Lagos
                    </Text>
                  </View>
                </View>

                <Pressable onPress={() => setShowDuelTasksModal(false)} style={styles.sqmCloseBtn} hitSlop={8}>
                  <Text style={styles.sqmCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.sqmContentScroll} showsVerticalScrollIndicator={false}>
                {/* Head to Head Scoreboard */}
                <LinearGradient
                  colors={['#2A1259', '#1A0C38']}
                  style={styles.duelScoreboardCard}
                >
                  <View style={styles.duelScoreboardRow}>
                    {/* Your Squad */}
                    <Pressable
                      style={({ pressed }) => [{ alignItems: 'center', flex: 1, minWidth: 0 }, pressed && styles.btnPressed]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowDuelScoreBreakdown((prev) => !prev);
                      }}
                      hitSlop={6}
                    >
                      <Text style={styles.duelScoreTeamMine}>
                        Momentum Makers
                      </Text>
                      <View style={styles.duelScoreWithInfoRow}>
                        <Text style={styles.duelScoreNumberMine} numberOfLines={1}>{squadDuelScore} PTS</Text>
                        <View style={styles.duelScoreInfoPill}>
                          <Text style={styles.duelScoreInfoPillText}>ⓘ</Text>
                        </View>
                      </View>
                      {squadDuelScore >= oppDuelScore ? (
                        <View style={styles.duelLeadBadge}>
                          <Text style={styles.duelLeadBadgeText} numberOfLines={1}>
                            {squadDuelScore > oppDuelScore ? '👑 IN THE LEAD' : '⚡ TIED'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.duelTrailingBadge}>
                          <Text style={styles.duelTrailingBadgeText} numberOfLines={1}>
                            {oppDuelScore - squadDuelScore} PTS BEHIND
                          </Text>
                        </View>
                      )}
                    </Pressable>

                    {/* Center VS */}
                    <View style={styles.duelVsCenterCircle}>
                      <Text style={styles.duelVsCenterText}>VS</Text>
                    </View>

                    {/* Opponent Squad */}
                    <Pressable
                      style={({ pressed }) => [{ alignItems: 'center', flex: 1, minWidth: 0 }, pressed && styles.btnPressed]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowDuelScoreBreakdown((prev) => !prev);
                      }}
                      hitSlop={6}
                    >
                      <Text style={styles.duelScoreTeamOpp}>
                        Lagos Storytellers
                      </Text>
                      <View style={styles.duelScoreWithInfoRow}>
                        <Text style={styles.duelScoreNumberOpp} numberOfLines={1}>{oppDuelScore} PTS</Text>
                        <View style={styles.duelScoreInfoPill}>
                          <Text style={styles.duelScoreInfoPillText}>ⓘ</Text>
                        </View>
                      </View>
                      {oppDuelScore >= squadDuelScore ? (
                        <View style={styles.duelLeadBadge}>
                          <Text style={styles.duelLeadBadgeText} numberOfLines={1}>
                            {oppDuelScore > squadDuelScore ? '👑 IN THE LEAD' : '⚡ TIED'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.duelTrailingBadge}>
                          <Text style={styles.duelTrailingBadgeText} numberOfLines={1}>
                            {squadDuelScore - oppDuelScore} PTS BEHIND
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>

                  {/* Tug of war bar */}
                  <View style={styles.duelTugBar}>
                    <View style={[styles.duelTugFillMine, { width: `${Math.round((squadDuelScore / ((squadDuelScore + oppDuelScore) || 100)) * 100)}%` }]} />
                    <View style={[styles.duelTugFillOpp, { width: `${100 - Math.round((squadDuelScore / ((squadDuelScore + oppDuelScore) || 100)) * 100)}%` }]} />
                  </View>

                  <Pressable
                    style={styles.duelScoreBreakdownToggleBtn}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowDuelScoreBreakdown((prev) => !prev);
                    }}
                  >
                    <Text
                      style={styles.duelScoreBreakdownToggleText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {showDuelScoreBreakdown ? '▲ Hide Point System' : '▼ How Duel Points are earned ⓘ'}
                    </Text>
                  </Pressable>

                  {/* Expandable Transparent Scoring System Cards */}
                  {showDuelScoreBreakdown && (
                    <View style={styles.duelPointRulesContainer}>
                      <View style={styles.duelPointRulesHeaderRow}>
                        <Text style={styles.duelPointRulesTitle}>⚡ HOW DUEL POINTS ARE EARNED</Text>
                      </View>

                      <View style={styles.duelPointRulesGrid}>
                        {/* Rule 1 */}
                        <View style={styles.duelPointRuleCard}>
                          <View style={styles.duelPointRuleTop}>
                            <Text style={styles.duelPointRuleIcon}>🎬</Text>
                            <View style={styles.duelPointPill}>
                              <Text style={styles.duelPointPillText}>+15 PTS</Text>
                            </View>
                          </View>
                          <Text style={styles.duelPointRuleName}>Post Reel</Text>
                          <Text style={styles.duelPointRuleSub}>Publish verified video</Text>
                        </View>

                        {/* Rule 2 */}
                        <View style={styles.duelPointRuleCard}>
                          <View style={styles.duelPointRuleTop}>
                            <Text style={styles.duelPointRuleIcon}>🤝</Text>
                            <View style={styles.duelPointPill}>
                              <Text style={styles.duelPointPillText}>+20 PTS</Text>
                            </View>
                          </View>
                          <Text style={styles.duelPointRuleName}>Duo Collab</Text>
                          <Text style={styles.duelPointRuleSub}>Split-screen duet reel</Text>
                        </View>

                        {/* Rule 3 */}
                        <View style={styles.duelPointRuleCard}>
                          <View style={styles.duelPointRuleTop}>
                            <Text style={styles.duelPointRuleIcon}>💬</Text>
                            <View style={styles.duelPointPill}>
                              <Text style={styles.duelPointPillText}>+10 PTS</Text>
                            </View>
                          </View>
                          <Text style={styles.duelPointRuleName}>Script Review</Text>
                          <Text style={styles.duelPointRuleSub}>Squad draft feedback</Text>
                        </View>

                        {/* Rule 4 */}
                        <View style={styles.duelPointRuleCard}>
                          <View style={styles.duelPointRuleTop}>
                            <Text style={styles.duelPointRuleIcon}>🔥</Text>
                            <View style={styles.duelPointPill}>
                              <Text style={styles.duelPointPillText}>+2 PTS</Text>
                            </View>
                          </View>
                          <Text style={styles.duelPointRuleName}>Streak Bonus</Text>
                          <Text style={styles.duelPointRuleSub}>Daily squad activity</Text>
                        </View>
                      </View>

                      <View style={styles.duelPointRulesFooter}>
                        <Text style={styles.duelPointRulesFooterText}>
                          👑 Points are verified live with #PostStreakDuel
                        </Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>

                {/* What's Happening Live Activity Feed */}
                <View style={styles.duelActivitySection}>
                  <Text style={styles.sqmSectionTitle}>WHAT'S HAPPENING LIVE (ACTIVITY LOG)</Text>
                  <View style={styles.duelActivityList}>
                    <View style={styles.duelActivityItem}>
                      <View style={styles.duelActivityDotRed} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.duelActivityTitle}>
                          <Text style={{ fontWeight: '700', color: '#171420' }}>Elena Rostova</Text> published a Reel with #PostStreakDuel
                        </Text>
                        <Text style={styles.duelActivityTime}>12 minutes ago • +15 pts awarded to Momentum Makers 🔥</Text>
                      </View>
                    </View>

                    <View style={styles.duelActivityItem}>
                      <View style={styles.duelActivityDotPurple} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.duelActivityTitle}>
                          <Text style={{ fontWeight: '700', color: '#171420' }}>Amara & Tomi</Text> completed split-screen collaborative duet
                        </Text>
                        <Text style={styles.duelActivityTime}>45 minutes ago • +20 pts awarded to Momentum Makers 🎬</Text>
                      </View>
                    </View>

                    <View style={styles.duelActivityItem}>
                      <View style={styles.duelActivityDotAmber} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.duelActivityTitle}>
                          <Text style={{ fontWeight: '700', color: '#64748B' }}>Chidi (Lagos Storytellers)</Text> dropped 4k Lagos Vlog clip
                        </Text>
                        <Text style={styles.duelActivityTime}>1 hour ago • +15 pts awarded to opponents</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Active Live Duel Tasks */}
                <View style={styles.duelTasksSection}>
                  <Text style={styles.sqmSectionTitle}>YOUR LIVE DUEL TASKS</Text>
                  <View style={styles.duelTasksList}>
                    {/* Task 1: Your Turn */}
                    <View style={styles.duelTaskCardActive}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={styles.duelTaskFireBox}>
                          <Text style={{ fontSize: 15 }}>🔥</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.duelTaskCardTitle}>
                              Post Gauntlet Reel
                            </Text>
                            <View style={styles.duelTaskUrgentPill}>
                              <Text style={styles.duelTaskUrgentText}>YOUR TURN</Text>
                            </View>
                          </View>
                          <Text style={styles.duelTaskCardSub}>
                            Post & verify your video to earn +15 pts
                          </Text>
                          <Text style={styles.duelTaskCardReward}>
                            Reward: +15 Pts • +150 XP
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.duelQuickPostBtn, pressed && styles.btnPressed]}
                        onPress={() => {
                          setShowDuelTasksModal(false);
                          if (onOpenPostComposer) {
                            onOpenPostComposer('Live Squad Duel Gauntlet Reel');
                          }
                        }}
                      >
                        <Text
                          style={styles.duelQuickPostBtnText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          Post & Score 🔥
                        </Text>
                      </Pressable>
                    </View>

                    {/* Task 2: Collab */}
                    <View style={styles.duelTaskCardStandard}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <Text style={{ fontSize: 15, marginTop: 2 }}>🎬</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.duelTaskCardTitleStandard}>Co-Produce Split-Screen Duet</Text>
                          <Text style={styles.duelTaskCardSub}>Partner with Elena or Amara on a shared hook.</Text>
                          <Text style={styles.duelTaskCardRewardStandard}>Reward: +20 Pts • +200 XP</Text>
                        </View>
                      </View>
                    </View>

                    {/* Task 3: Feedback */}
                    <View style={styles.duelTaskCardStandard}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <Text style={{ fontSize: 15, marginTop: 2 }}>💬</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.duelTaskCardTitleStandard}>Review 3 Squad Script Drafts</Text>
                          <Text style={styles.duelTaskCardSub}>Leave pacing and hook feedback in Squad Chat.</Text>
                          <Text style={styles.duelTaskCardRewardStandard}>Reward: +10 Pts • +100 XP</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.duelStakesCard}>
                    <Text style={styles.duelStakesTitle}>🏆 LIVE DUEL ROUND REWARDS</Text>
                    <Text style={styles.duelStakesSub}>
                      Winning squad receives <Text style={{ fontWeight: '700', color: '#B45309' }}>+500 XP Live Duel Reward</Text>, a 7-Day Streak Shield, and the Live Duel Champion Crown!
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.sqmActionsRow}>
                <Pressable
                  style={styles.sqmOutlineBtn}
                  onPress={() => {
                    setShowDuelTasksModal(false);
                    setSelectedQuestFilter('squad');
                  }}
                >
                  <Text
                    style={styles.sqmOutlineBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Squad Room
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.sqmSolidBtn}
                  onPress={() => {
                    setShowDuelTasksModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('Live Squad Duel Gauntlet Reel');
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    style={styles.sqmSolidGradient}
                  >
                    <Text
                      style={styles.sqmSolidBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Post & Score 🔥
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: OPPORTUNITY MATCHING SELECTION (CREATORS / SQUADS / BRANDS) */}
        {/* ============================================================ */}
        <Modal
          visible={showOpportunityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOpportunityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxWidth: 440, padding: 22 }]}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 16 }}>👑</Text>
                    <Text
                      style={[styles.modalTitle, { flex: 1, minWidth: 0 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      Choose Quest Category
                    </Text>
                  </View>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    Where would you like to level up today?
                  </Text>
                </View>
                <Pressable onPress={() => setShowOpportunityModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Selectable Opportunity Cards */}
              <View style={{ gap: 10, marginVertical: 12 }}>
                {/* OPTION 1: ALL QUESTS & MISSIONS */}
                <Pressable
                  style={({ pressed }) => [styles.oppChoiceCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowOpportunityModal(false);
                    setSelectedQuestFilter('all');
                  }}
                >
                  <View style={styles.oppChoiceIconBoxGold}>
                    <Text style={{ fontSize: 20 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.oppChoiceHeaderRow}>
                      <Text style={styles.oppChoiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                        Daily Missions & Challenges
                      </Text>
                      <View style={styles.oppChoiceBadgeGold}>
                        <Text style={styles.oppChoiceBadgeGoldText} numberOfLines={1}>👑 TOP PRIORITY</Text>
                      </View>
                    </View>
                    <Text style={styles.oppChoiceDesc} numberOfLines={2}>
                      Complete your daily creator missions, maintain streak momentum & earn XP.
                    </Text>
                    <Text style={styles.oppChoiceMetaPurple} numberOfLines={1}>
                      3 Active Missions • +500 XP
                    </Text>
                  </View>
                  <Text style={styles.oppChoiceChevron}>›</Text>
                </Pressable>

                {/* OPTION 2: SQUAD RECRUITMENT & DUELS */}
                <Pressable
                  style={({ pressed }) => [styles.oppChoiceCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowOpportunityModal(false);
                    setSelectedQuestFilter('squad');
                  }}
                >
                  <View style={styles.oppChoiceIconBoxPurple}>
                    <Text style={{ fontSize: 20 }}>🛡️</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.oppChoiceHeaderRow}>
                      <Text style={styles.oppChoiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                        Squad & Duels
                      </Text>
                      <View style={styles.oppChoiceBadgePurple}>
                        <Text style={styles.oppChoiceBadgePurpleText} numberOfLines={1}>⚡ ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.oppChoiceDesc} numberOfLines={2}>
                      Join creator squads, contribute to 8-Reel goals, and battle live in squad duels.
                    </Text>
                    <Text style={styles.oppChoiceMetaPurple} numberOfLines={1}>
                      Momentum Makers (Round 2) • +750 XP
                    </Text>
                  </View>
                  <Text style={styles.oppChoiceChevron}>›</Text>
                </Pressable>

                {/* OPTION 3: CREATOR SPRINT CHALLENGES */}
                <Pressable
                  style={({ pressed }) => [styles.oppChoiceCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowOpportunityModal(false);
                    setSelectedQuestFilter('all');
                  }}
                >
                  <View style={styles.oppChoiceIconBoxGreen}>
                    <Text style={{ fontSize: 20 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.oppChoiceHeaderRow}>
                      <Text style={styles.oppChoiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                        Creator Sprint Challenges
                      </Text>
                      <View style={styles.oppChoiceBadgeGreen}>
                        <Text style={styles.oppChoiceBadgeGreenText} numberOfLines={1}>⚡ +450–+1.2k XP</Text>
                      </View>
                    </View>
                    <Text style={styles.oppChoiceDesc} numberOfLines={2}>
                      Explore high-impact creator sprints, viral hook challenges &amp; milestone quests.
                    </Text>
                    <Text style={styles.oppChoiceMetaGreen} numberOfLines={1}>
                      3 Active Sprint Quests Available
                    </Text>
                  </View>
                  <Text style={styles.oppChoiceChevron}>›</Text>
                </Pressable>
              </View>

              {/* Close Button */}
              <Pressable
                style={styles.modalOutlineCloseBtn}
                onPress={() => setShowOpportunityModal(false)}
              >
                <Text style={styles.modalOutlineCloseBtnText}>Cancel</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: LEVEL 13 PERKS & PROGRESSION UNLOCKS                  */}
        {/* ============================================================ */}
        <Modal
          visible={showLevelPerksModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLevelPerksModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxWidth: 440, padding: 22 }]}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                  <View style={styles.perksModalPill}>
                    <Text style={styles.perksModalPillText}>
                      {isNewUser ? 'LEVEL 2 MILESTONE' : 'LEVEL 13 MILESTONE'}
                    </Text>
                  </View>
                  <Text
                    style={styles.modalTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {isNewUser ? 'Level 2 Perks & Rewards' : 'Level 13 Perks & Rewards'}
                  </Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {isNewUser ? '0 / 500 XP • 500 XP to unlock' : '4,320 / 5,250 XP • 930 XP to unlock'}
                  </Text>
                </View>
                <Pressable onPress={() => setShowLevelPerksModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Progress Summary Card */}
              <View style={styles.perksProgressCard}>
                <View style={styles.perksProgressHeaderRow}>
                  <Text style={styles.perksProgressTierCurrent}>
                    {isNewUser ? 'Level 1 (Current)' : 'Level 12 (Current)'}
                  </Text>
                  <Text style={styles.perksProgressTierTarget}>
                    {isNewUser ? '➔ Level 2 (Target)' : '➔ Level 13 (Target)'}
                  </Text>
                </View>
                <View style={[styles.levelProgressTrackBg, { marginBottom: 6 }]}>
                  <LinearGradient
                    colors={['#582CDB', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.levelProgressTrackFill, { width: isNewUser ? '0%' : '82%' }]}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.perksProgressSubText}>
                    {isNewUser ? '0% Complete' : '82% Complete'}
                  </Text>
                  <Text style={styles.perksProgressSubTextPurple}>
                    {isNewUser ? '500 XP Remaining' : '930 XP Remaining'}
                  </Text>
                </View>
              </View>

              {/* 4 Unlocked Perks List */}
              <View style={{ gap: 9, marginVertical: 10 }}>
                {/* Perk 1 */}
                <View style={styles.perkRowCard}>
                  <View style={styles.perkIconBoxGold}>
                    <Text style={{ fontSize: 18 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkItemTitle}>Priority Creator Quest Hub</Text>
                    <Text style={styles.perkItemDesc}>Access high-XP creator briefs 24 hours before public release.</Text>
                  </View>
                </View>

                {/* Perk 2 */}
                <View style={styles.perkRowCard}>
                  <View style={styles.perkIconBoxPurple}>
                    <Text style={{ fontSize: 18 }}>🎁</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkItemTitle}>
                      {isNewUser ? '+250 XP Milestone Reward' : '+450 XP Milestone Reward'}
                    </Text>
                    <Text style={styles.perkItemDesc}>
                      {isNewUser
                        ? 'Receive 250 bonus XP when you reach Level 2.'
                        : 'Receive 450 bonus XP when you reach Level 13.'}
                    </Text>
                  </View>
                </View>

                {/* Perk 3 */}
                <View style={styles.perkRowCard}>
                  <View style={styles.perkIconBoxGreen}>
                    <Text style={{ fontSize: 18 }}>🛡️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkItemTitle}>Squad Captain Privileges</Text>
                    <Text style={styles.perkItemDesc}>Create custom weekly squad challenges and duel stakes.</Text>
                  </View>
                </View>

                {/* Perk 4 */}
                <View style={styles.perkRowCard}>
                  <View style={styles.perkIconBoxBlue}>
                    <Text style={{ fontSize: 18 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkItemTitle}>2× Streak Shield Regeneration</Text>
                    <Text style={styles.perkItemDesc}>Restore your Streak Shield 2× faster through daily activity.</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Pressable
                  style={styles.perksModalOutlineBtn}
                  onPress={() => setShowLevelPerksModal(false)}
                >
                  <Text style={styles.perksModalOutlineBtnText}>Got It</Text>
                </Pressable>

                <Pressable
                  style={styles.perksModalSolidBtn}
                  onPress={() => {
                    setShowLevelPerksModal(false);
                    const reelQuestDraft = {
                      title: 'Publish your Reel before 9 PM',
                      badgeLabel: "TODAY'S PRO QUEST (+350 XP)",
                      hook: "3 creator mistakes that were secretly killing my reach (and how I fixed them):",
                      story: "1. Obsessing over views instead of saves & shares.\n2. Posting inconsistently and losing algorithmic trust.\n3. Overcomplicating production instead of prioritizing a razor-sharp opening hook.",
                      lesson: "Consistency and clarity beat high production value every single time.",
                      cta: "Which of these 3 mistakes have you made? Drop a comment below 👇",
                      requirements: [
                        "Format: 1 Long Reel / Short Video (<60s)",
                        "Topic: 3 Creator Mistakes I Stopped Making",
                        `Target: Publish before 9:00 PM to lock in +350 XP & Day ${isNewUser ? '1' : '48'}`
                      ],
                      xpReward: 350
                    };
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowCelebrationModal(false);
                    setShowLevelPerksModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('3 creator mistakes I stopped making this year', 'Instagram', reelQuestDraft, 'short_video');
                    }
                  }}
                >
                  <Text style={styles.perksModalSolidBtnText}>Earn +350 XP Today ➔</Text>
                </Pressable>
              </View>

              <Text style={styles.perksModalCtaHelperText}>
                {isNewUser ? '150 XP still needed after today\'s quest' : '580 XP still needed after today\'s quest'}
              </Text>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: QUEST CELEBRATION                                     */}
        {/* ============================================================ */}
        <Modal
          visible={showCelebrationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCelebrationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 8 }}>🚀🏆</Text>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{celebrationMessage}</Text>
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginVertical: 6 }]}>
                +{celebrationXp} Creator XP earned toward {isNewUser ? 'Level 2' : 'Level 13'}!
              </Text>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowCelebrationModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Let&apos;s Crush It ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: COMPLETED MISSION INSPECTION                          */}
        {/* ============================================================ */}
        <Modal
          visible={showCompletedMissionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCompletedMissionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxWidth: 420, padding: 22 }]}>
              {/* Header Row */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                  <View style={styles.completedModalCategoryPill}>
                    <Text style={styles.completedModalCategoryText}>
                      {selectedCompletedMission?.category.toUpperCase() || 'COMPLETED MISSION'}
                    </Text>
                  </View>
                  <Text
                    style={styles.modalTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {selectedCompletedMission?.title || 'Mission Details'}
                  </Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    ✓ Completed {selectedCompletedMission?.completedAt || 'Recently'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowCompletedMissionModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Badges & Rewards Row */}
              <View style={styles.completedModalBadgesRow}>
                <View style={styles.completedModalXpPill}>
                  <Text style={styles.completedModalXpPillText}>{selectedCompletedMission?.xp || '+150 XP'}</Text>
                </View>
                {selectedCompletedMission?.badge ? (
                  <View style={styles.completedModalBadgePill}>
                    <Text style={styles.completedModalBadgePillText}>{selectedCompletedMission.badge}</Text>
                  </View>
                ) : null}
              </View>

              {/* Summary Description */}
              <View style={styles.completedModalSummaryCard}>
                <Text style={styles.completedModalSummaryLabel}>MISSION SUMMARY</Text>
                <Text style={styles.completedModalSummaryText}>
                  {selectedCompletedMission?.summary}
                </Text>
              </View>

              {/* Verified Outcome Card */}
              <View style={styles.completedModalOutcomeCard}>
                <View style={styles.completedModalOutcomeIconBox}>
                  <Text style={{ fontSize: 16 }}>{selectedCompletedMission?.icon || '🏆'}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.completedModalOutcomeLabel}>VERIFIED OUTCOME</Text>
                  <Text style={styles.completedModalOutcomeVal}>
                    {selectedCompletedMission?.metric}
                  </Text>
                </View>
              </View>

              {/* Close Action Button */}
              <Pressable
                style={[styles.modalFullBtn, { marginTop: 14 }]}
                onPress={() => setShowCompletedMissionModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* PRO ADVANCED NOTIFICATIONS MODAL */}
        <ProNotificationsModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          onToast={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />

        {/* PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          initialSubTab={profileModalSubTab}
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
    width: '100%',
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
    borderRadius: 20,
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
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
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
    borderRadius: 20,
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
    borderRadius: 20,
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
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // HERO TAGS & HEADLINE
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  questsProPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  questsProPillText: {
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
  mainSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 9,
  },

  // FILTER PILLS
  questFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 13,
  },
  questFilterPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questFilterPillActive: {
    backgroundColor: '#582CDB',
  },
  questFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  questFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // CARD 1: TODAY'S PRO QUEST
  todayProQuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  todayQuestTagBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 10,
  },
  todayQuestTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  todayQuestTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.25,
    marginBottom: 4,
  },
  todayQuestSub: {
    fontSize: 12,
    color: '#5E576E',
    lineHeight: 17,
    marginBottom: 14,
  },
  countdownTimerBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  countdownCompletedBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  timeCompletedLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  countdownCompletedDigits: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    marginTop: 1,
  },
  countdownExpiredBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  timeExpiredLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  countdownExpiredDigits: {
    fontSize: 22,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  timeLeftLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  countdownBigDigits: {
    fontSize: 22,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 1,
  },
  rewardsStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF9FD',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.04)',
    marginBottom: 12,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardSmallLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E869E',
    marginBottom: 2,
    textAlign: 'center',
  },
  rewardValGold: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
    textAlign: 'center',
  },
  rewardValPurple: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'center',
  },
  rewardValDark: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },
  rewardDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  questSparkleCallout: {
    backgroundColor: '#FAF9FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.10)',
    marginBottom: 14,
  },
  questSparkleCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  questSparkleExpired: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  questSparkleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#582CDB',
    textAlign: 'center',
  },
  questActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewIdeaOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewIdeaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  startReelSolidBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedQuestSolidBtn: {
    backgroundColor: '#059669',
  },
  startReelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ROW 2: DUAL METRIC CARDS
  dualMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricSquareCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  metricIconCirclePurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconCircleGold: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricSquareNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
    textAlign: 'center',
  },
  metricSquareLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#5E576E',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // CARD 3: CREATOR LEVEL
  levelProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelSmallLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.3,
  },
  levelBigTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
  },
  nextLevelPercentText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#582CDB',
  },
  levelProgressTrackBg: {
    height: 6,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  levelProgressTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  levelBottomCalloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
  },
  levelTotalXpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5E576E',
  },
  unlockNextRewardsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 4: SQUAD QUEST
  squadQuestCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 16,
  },
  squadQuestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  squadQuestPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  squadQuestPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  groupRewardPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  groupRewardPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  squadQuestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  squadQuestDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  squadQuestProgressBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 10,
    marginBottom: 12,
  },
  squadQuestProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  squadQuestProgressTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },
  squadQuestProgressRemaining: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  squadQuestProgressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  squadQuestProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  squadMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stackedAvatarsGroup: {
    flexDirection: 'row',
  },
  miniSquadAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  activeMembersPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeMembersText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  squadActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewSquadOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSquadBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
  },
  contributeSolidBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  // CARD 5: LIVE DUEL
  liveDuelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 20,
  },
  duelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDuelTagPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDuelTagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  duelEndsInText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  duelCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 12,
  },
  duelBarGroup: {
    marginBottom: 10,
  },
  duelBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  duelSquadNameMine: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  duelScoreMine: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  duelSquadNameOpp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  duelScoreOpp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  duelTrackBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  duelTrackFillMine: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  duelTrackFillOpp: {
    height: '100%',
    backgroundColor: '#94A3B8',
    borderRadius: 3,
  },
  duelStatusRow: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  duelStatusRowAhead: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  duelStatusRowBehind: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  duelStatusRowTied: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  duelStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  duelStatusTextAhead: {
    color: '#6D28D9',
  },
  duelStatusTextBehind: {
    color: '#B45309',
  },
  duelStatusTextTied: {
    color: '#475569',
  },
  viewDuelTasksBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  viewDuelTasksBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // SECTION 6: PREMIUM QUESTS
  premiumQuestsSectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
  },
  premiumQuestItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  premiumQuestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumQuestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandIconCirclePurple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandIconCircleGold: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandIconCircleGray: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandQuestItemTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    minWidth: 0,
  },
  proPriorityBadgePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'center',
    flexShrink: 1,
  },
  proPriorityBadgePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  brandQuestBadgePill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'center',
    flexShrink: 1,
  },
  brandQuestBadgePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C2410C',
    letterSpacing: 0.2,
  },
  profileProgressBadgePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'center',
    flexShrink: 1,
  },
  profileProgressBadgePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.2,
  },
  bountyRewardPill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bountyPillAmountGold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    lineHeight: 14,
  },
  bountyPillLabelGold: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  passportBoostRewardPill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  passportBoostRewardAmountPurple: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    lineHeight: 13,
  },
  passportBoostRewardLabelPurple: {
    fontSize: 8,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chevronGray: {
    fontSize: 18,
    fontWeight: '400',
    color: '#CBD5E1',
    marginLeft: 2,
  },

  // CARD 7: DARK OPPORTUNITY MATCHING
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

  darkOpportunityCard: {
    backgroundColor: '#13111C',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  darkCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  darkCardTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.5,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  darkCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  darkCardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 14,
  },
  darkMetricsStack: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  darkMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkMetricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.3,
  },
  darkMetricValPurple: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
  },
  darkMetricValLight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  darkMetricValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
  },
  viewOpportunitiesSolidBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOpportunitiesBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },

  // CARD 8: REPUTATION TIER
  reputationTierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 16,
  },
  reputationHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  stepTrackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItemCol: {
    alignItems: 'center',
    width: 60,
  },
  stepCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCheckIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepCircleCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepLevelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  stepBadgeName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  stepConnectorActive: {
    flex: 1,
    height: 2,
    backgroundColor: '#582CDB',
    marginTop: 15,
  },
  stepConnectorInactive: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 15,
  },

  // CARD 9: JARVIS REP RECOMMENDATION
  jarvisRepCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 18,
    marginBottom: 16,
  },
  jarvisRepQuote: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4C1D95',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  jarvisTagsColumn: {
    gap: 6,
  },
  jarvisTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  jarvisTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  jarvisTagChevron: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B5CF6',
  },

  // SECTION 10: COMPLETED MISSIONS
  completedSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
  },
  completedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  greenCheckIcon: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '700',
  },
  completedTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
  },
  completedRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedXpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  completedChevron: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  completedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },

  // COMPLETED MISSION MODAL STYLES
  completedModalCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  completedModalCategoryText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  completedModalBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  completedModalXpPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedModalXpPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  completedModalBadgePill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedModalBadgePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  completedModalSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  completedModalSummaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  completedModalSummaryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  completedModalOutcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    gap: 10,
  },
  completedModalOutcomeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedModalOutcomeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  completedModalOutcomeVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#14532D',
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
    fontWeight: '700',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalCloseCross: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
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
  proPriorityPillModal: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  proPriorityPillModalText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },

  /* BRAND MODAL ULTRA-LUXURY STYLES */
  brandModalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  brandModalTopTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandModalProPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  brandModalProPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  brandModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 10,
  },
  brandModalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandModalCloseCross: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  brandModalHeroBountyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  brandModalBountyLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  brandModalBountyValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400E',
    marginTop: 1,
  },
  brandModalBountyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
    flexShrink: 0,
  },
  brandModalBountyBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  brandSpecSheet: {
    backgroundColor: '#FAF9F6',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 10,
  },
  brandSpecSheetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  brandSpecIconCircleGold: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  brandSpecIconCirclePurple: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  brandSpecIconCircleFire: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  brandSpecIconCircleGreen: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  brandSpecRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  brandSpecRowLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  brandSpecPlatformsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  brandSpecPlatformTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandSpecPlatformText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
  },
  brandSpecRowMain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 18,
  },
  brandSpecRowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  brandSpecDivider: {
    height: 1,
    backgroundColor: '#EFECE6',
  },
  brandSpecFastTrackTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandSpecFastTrackText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#6D28D9',
  },
  brandSpecProgressTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandSpecProgressTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#B45309',
  },
  brandSpecMatchTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandSpecMatchTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803D',
  },
  brandEscrowToggleBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  brandEscrowToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  brandEscrowBanner: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginTop: 4,
  },
  brandEscrowBannerTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandEscrowBullet: {
    fontSize: 10.5,
    color: '#5B21B6',
    lineHeight: 15,
    marginVertical: 1,
  },
  brandModalBottomActions: {
    marginTop: 6,
    paddingTop: 4,
  },
  brandModalApplyBtn: {
    marginTop: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  brandModalApplyGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandModalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandModalFooterHelper: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  squadTaskItem: {
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '700',
    lineHeight: 20,
  },
  oppItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
  },
  oppTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  oppBounty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  /* OPPORTUNITY MODAL SELECTION STYLES */
  oppChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  oppChoiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  oppChoiceIconBoxGold: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexShrink: 0,
  },
  oppChoiceIconBoxPurple: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexShrink: 0,
  },
  oppChoiceIconBoxGreen: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexShrink: 0,
  },
  oppChoiceTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    flex: 1,
    minWidth: 0,
  },
  oppChoiceBadgeGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexShrink: 0,
  },
  oppChoiceBadgeGoldText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#B45309',
  },
  oppChoiceBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexShrink: 0,
  },
  oppChoiceBadgePurpleText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  oppChoiceBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexShrink: 0,
  },
  oppChoiceBadgeGreenText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#166534',
  },
  oppChoiceDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  oppChoiceMetaPurple: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    marginTop: 4,
  },
  oppChoiceMetaGreen: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
  },
  oppChoiceChevron: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 2,
    flexShrink: 0,
  },
  modalOutlineCloseBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  modalOutlineCloseBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
  },

  /* ACTIVE FILTER BANNER */
  filterActiveBanner: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  filterActiveBannerText: {
    fontSize: 12,
    color: '#4C1D95',
    fontWeight: '700',
  },

  /* EMPTY QUEST / COMING SOON CARD */
  emptyQuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyQuestIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyQuestIconBoxGold: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyQuestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
  },
  emptyQuestDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyQuestBtn: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyQuestBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* SQUAD QUEST ULTRA-LUXURY MODAL */
  squadQuestModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 16,
  },
  squadQuestModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  squadQuestModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  sqmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sqmCrownBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sqmCategoryTag: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  sqmTierPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    flexShrink: 0,
  },
  sqmTierPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6D28D9',
  },
  sqmMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  sqmCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sqmCloseCross: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  sqmContentScroll: {
    marginBottom: 12,
  },
  sqmProgressBanner: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sqmProgressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sqmProgressLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#C084FC',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  sqmProgressBigText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sqmTimerPill: {
    backgroundColor: 'rgba(253, 230, 138, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
    flexShrink: 0,
  },
  sqmTimerText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FDE68A',
  },
  sqmTrackBg: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  sqmTrackFill: {
    height: '100%',
    backgroundColor: '#C084FC',
  },
  sqmRemainingHint: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  sqmRewardsSection: {
    marginBottom: 14,
  },
  sqmSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sqmRewardsGrid: {
    gap: 8,
  },
  sqmRewardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sqmRewardCard: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  sqmRewardIcon: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  sqmRewardValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
  },
  sqmRewardLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  sqmMembersSection: {
    marginBottom: 14,
  },
  sqmMembersList: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 8,
  },
  sqmMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
  },
  sqmMemberRowMine: {
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 0,
  },
  sqmMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sqmMemberName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  sqmMemberSub: {
    fontSize: 10,
    color: '#64748B',
  },
  sqmHostBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sqmHostBadgeText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#B45309',
  },
  sqmTopBadge: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sqmTopBadgeText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sqmScoreBadgeCompleted: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sqmScoreBadgeCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  sqmScoreBadgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sqmScoreBadgePendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  sqmScoreBadgeScheduled: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sqmScoreBadgeScheduledText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  sqmMilestonesSection: {
    marginBottom: 10,
  },
  sqmMilestoneCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 6,
  },
  sqmMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sqmGreenCheck: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  sqmMilestoneText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
  sqmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 10,
  },
  sqmOutlineBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sqmOutlineBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },
  sqmSolidBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sqmSolidGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sqmSolidBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  /* DUEL TASKS ULTRA-LUXURY MODAL */
  duelModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 16,
  },
  duelModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  duelModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  duelModalTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  duelModalSwordsBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  duelModalLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    flexShrink: 0,
  },
  duelModalLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  duelModalLivePillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  duelModalTimerText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    flexShrink: 0,
  },
  duelModalTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginTop: 1,
  },
  duelScoreboardCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  duelScoreboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  duelScoreTeamMine: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    color: '#F3E8FF',
    textAlign: 'center',
  },
  duelScoreNumberMine: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  duelScoreWithInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  duelScoreInfoPill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duelScoreInfoPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDE68A',
  },
  duelScoreBreakdownToggleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginTop: 8,
  },
  duelScoreBreakdownToggleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  duelPointRulesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  duelPointRulesHeaderRow: {
    marginBottom: 8,
  },
  duelPointRulesTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  duelPointRulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  duelPointRuleCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  duelPointRuleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  duelPointRuleIcon: {
    fontSize: 16,
  },
  duelPointPill: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  duelPointPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  duelPointRuleName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  duelPointRuleSub: {
    fontSize: 9,
    color: '#CBD5E1',
    marginTop: 1,
    lineHeight: 12,
  },
  duelPointRulesFooter: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  duelPointRulesFooterText: {
    fontSize: 9,
    color: '#DDD6FE',
    fontStyle: 'italic',
    lineHeight: 12,
  },
  duelLeadBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 3,
  },
  duelLeadBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#6EE7B7',
    textAlign: 'center',
  },
  duelVsCenterCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginHorizontal: 4,
  },
  duelVsCenterText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDE68A',
  },
  duelScoreTeamOpp: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  duelScoreNumberOpp: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E8F0',
    marginTop: 2,
    textAlign: 'center',
  },
  duelTrailingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 3,
  },
  duelTrailingBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  duelTugBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  duelTugFillMine: {
    backgroundColor: '#C084FC',
    height: '100%',
  },
  duelTugFillOpp: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  duelTugSubText: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 15,
  },
  duelActivitySection: {
    marginBottom: 14,
  },
  duelActivityList: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 8,
  },
  duelActivityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  duelActivityDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 5,
  },
  duelActivityDotPurple: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 5,
  },
  duelActivityDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 5,
  },
  duelActivityTitle: {
    fontSize: 12,
    color: '#171420',
    lineHeight: 16,
  },
  duelActivityTime: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  duelTasksSection: {
    marginBottom: 14,
  },
  duelTasksList: {
    gap: 8,
  },
  duelTaskCardActive: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#C084FC',
  },
  duelTaskFireBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duelTaskCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  duelTaskUrgentPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  duelTaskUrgentText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  duelTaskCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  duelTaskCardReward: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    color: '#7C3AED',
    marginTop: 3,
  },
  duelQuickPostBtn: {
    backgroundColor: '#784DF0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  duelQuickPostBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  duelTaskCardStandard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  duelTaskCardTitleStandard: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  duelTaskCardRewardStandard: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  duelStakesCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  duelStakesTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  duelStakesSub: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
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

  // LEVEL 13 PERKS MODAL
  perksModalPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 6,
  },
  perksModalPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6B21A8',
    letterSpacing: 0.5,
  },
  perksProgressCard: {
    backgroundColor: '#FAF9FE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
    padding: 12,
    marginVertical: 10,
  },
  perksProgressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  perksProgressTierCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  perksProgressTierTarget: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  perksProgressSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  perksProgressSubTextPurple: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  perkRowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
    padding: 10,
  },
  perkIconBoxGold: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkIconBoxPurple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkIconBoxGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkIconBoxBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  perkItemDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  perksModalOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.10)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  perksModalOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  perksModalSolidBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perksModalSolidBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  perksModalCtaHelperText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});
