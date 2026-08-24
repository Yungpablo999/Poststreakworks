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


interface ProQuestsScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMissionDetail?: () => void;
  onOpenCommunityChallenge?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenEarnings?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onOpenSquad?: () => void;
  onOpenPassport?: () => void;
  onOpenOpportunities?: () => void;
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
    type: 'quest',
    title: '60-Day Consistency Milestone Unlocked',
    body: 'Pro Priority sponsor application ready ($450 bounty).',
    time: '15m ago',
    unread: true,
    iconEmoji: '🎁',
  },
  {
    id: 'n2',
    type: 'streak',
    title: 'Squad Quest 4/8 Complete',
    body: 'Momentum Makers is 50% toward the Weekly Push crown!',
    time: '45m ago',
    unread: true,
    iconEmoji: '⚡',
  },
];

export const ProQuestsScreen: React.FC<ProQuestsScreenProps> = ({
  onBackToDashboard,
  onLogout,
  onNavigateTab,
  onOpenMissionDetail,
  onOpenCommunityChallenge,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onOpenEarnings,
  onOpenPostComposer,
  onOpenSquad,
  onOpenPassport,
  onOpenOpportunities,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [selectedQuestFilter, setSelectedQuestFilter] = useState<'all' | 'squad' | 'brand'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalSubTab, setProfileModalSubTab] = useState<'profile' | 'socials' | 'verification' | 'settings'>('profile');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBrandQuestModal, setShowBrandQuestModal] = useState(false);
  const [showSquadQuestModal, setShowSquadQuestModal] = useState(false);
  const [showDuelTasksModal, setShowDuelTasksModal] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationXp, setCelebrationXp] = useState(350);
  const [celebrationMessage, setCelebrationMessage] = useState('Daily Quest Activated!');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Brand Quest details
  const [selectedBrandName, setSelectedBrandName] = useState('60-Day Consistency Milestone');
  const [selectedBrandBounty, setSelectedBrandBounty] = useState('$450');

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

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
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-core-flame.png')}
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
            <View style={styles.questsProPill}>
              <Text style={styles.questsProPillText}>QUESTS — PRO</Text>
            </View>
          </View>

          <Text style={styles.mainTitleText}>Win missions. Build reputation.</Text>
          <Text style={styles.mainSubtitleText}>
            Complete Pro missions to level up your Creator Passport, unlock brand deals, and lead your squad.
          </Text>

          {/* FILTER PILLS: All Quests | Squad (2) | Brand (4) */}
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
              <Text style={[styles.questFilterText, selectedQuestFilter === 'all' && styles.questFilterTextActive]}>
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
              <Text style={[styles.questFilterText, selectedQuestFilter === 'squad' && styles.questFilterTextActive]}>
                🛡️ Squad (2)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedQuestFilter('brand');
              }}
              style={[styles.questFilterPill, selectedQuestFilter === 'brand' && styles.questFilterPillActive]}
            >
              <Text style={[styles.questFilterText, selectedQuestFilter === 'brand' && styles.questFilterTextActive]}>
                💼 Brand (3)
              </Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* ALL QUESTS EXCLUSIVE SECTIONS                                 */}
          {/* ============================================================ */}
          {selectedQuestFilter === 'all' && (
            <>
              {/* CARD 1: TODAY'S PRO QUEST */}
              <View style={styles.todayProQuestCard}>
            <View style={styles.todayQuestTagBox}>
              <Text style={styles.todayQuestTagText}>TODAY&apos;S PRO QUEST</Text>
            </View>

            <Text style={styles.todayQuestTitle}>Publish your strongest Reel before 9 PM</Text>
            <Text style={styles.todayQuestSub}>
              Lock in Day 48 • Earn 350 XP • Boost Creator Passport Credibility.
            </Text>

            {/* COUNTDOWN TIMER */}
            <View style={styles.countdownTimerBox}>
              <Text style={styles.timeLeftLabel}>TIME LEFT</Text>
              <Text style={styles.countdownBigDigits}>04:12:45</Text>
            </View>

            {/* REWARDS STRIP */}
            <View style={styles.rewardsStripRow}>
              <View style={styles.rewardItem}>
                <Text style={styles.rewardSmallLabel}>🏆 REWARD</Text>
                <Text style={styles.rewardValGold}>+350 XP</Text>
              </View>

              <View style={styles.rewardDivider} />

              <View style={styles.rewardItem}>
                <Text style={styles.rewardSmallLabel}>✨ PASSPORT IMPACT</Text>
                <Text style={styles.rewardValPurple}>Streak Boost</Text>
              </View>

              <View style={styles.rewardDivider} />

              <View style={styles.rewardItem}>
                <Text style={styles.rewardSmallLabel}>🎯 GOAL</Text>
                <Text style={styles.rewardValDark}>1 Long-form Reel</Text>
              </View>
            </View>

            {/* SPARKLE CALLOUT */}
            <View style={styles.questSparkleCallout}>
              <Text style={styles.questSparkleText}>
                🔥 Top 1% of creators finish daily quests before 8 PM.
              </Text>
            </View>

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
                style={({ pressed }) => [styles.startReelSolidBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerCelebration(350, 'Reel Quest Active! Complete before 9 PM to lock in +350 XP.');
                  if (onOpenPostComposer) onOpenPostComposer('3 creator mistakes I stopped making this year', 'Instagram');
                }}
              >
                <Text style={styles.startReelBtnText}>Start Reel Quest</Text>
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
              <Text style={styles.metricSquareNumber}>67</Text>
              <Text style={styles.metricSquareLabel}>QUESTS COMPLETED</Text>
            </View>

            {/* Metric 2 */}
            <View style={styles.metricSquareCard}>
              <View style={styles.metricIconCircleGold}>
                <Text style={{ fontSize: 16 }}>🏆</Text>
              </View>
              <Text style={styles.metricSquareNumber}>14,320</Text>
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
                <Text style={styles.levelBigTitle}>Level 12</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.levelSmallLabel}>NEXT LEVEL IN</Text>
                <Text style={styles.nextLevelPercentText}>82%</Text>
              </View>
            </View>

            <View style={styles.levelProgressTrackBg}>
              <LinearGradient
                colors={['#582CDB', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.levelProgressTrackFill, { width: '82%' }]}
              />
            </View>

            <View style={styles.levelBottomCalloutRow}>
              <Text style={styles.levelTotalXpText}>✓ 14,320 Total XP</Text>
              <Pressable onPress={() => showToast('Level 13 Unlocks: +450 XP & Priority Collab Badge')}>
                <Text style={styles.unlockNextRewardsLink}>Unlock Level 13 Rewards (+450 XP)</Text>
              </Pressable>
            </View>
          </View>

            </>
          )}

          {/* ============================================================ */}
          {/* SQUAD QUESTS SECTION                                         */}
          {/* ============================================================ */}
          {(selectedQuestFilter === 'all' || selectedQuestFilter === 'squad') && (
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

            <Text style={styles.squadQuestTitle}>Momentum Makers Weekly Push</Text>
            <Text style={styles.squadQuestDesc}>
              Publish 8 collective Reels with your squad this week to claim the Squad Creator Crown.
            </Text>

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
                <Text style={styles.viewSquadBtnText}>View Squad Quest</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.contributeSolidBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (onOpenPostComposer) {
                    onOpenPostComposer('Momentum Makers Squad Gauntlet Reel');
                  }
                }}
              >
                <Text style={styles.contributeBtnText}>Contribute</Text>
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

            <Text style={styles.duelCardTitle}>Momentum Makers vs Lagos Storytellers</Text>

            <View style={styles.duelBarGroup}>
              <View style={styles.duelBarLabelRow}>
                <Text style={styles.duelSquadNameMine}>Momentum Makers (You)</Text>
                <Text style={styles.duelScoreMine}>62 pts</Text>
              </View>
              <View style={styles.duelTrackBg}>
                <View style={[styles.duelTrackFillMine, { width: '62%' }]} />
              </View>
            </View>

            <View style={styles.duelBarGroup}>
              <View style={styles.duelBarLabelRow}>
                <Text style={styles.duelSquadNameOpp}>Lagos Storytellers</Text>
                <Text style={styles.duelScoreOpp}>58 pts</Text>
              </View>
              <View style={styles.duelTrackBg}>
                <View style={[styles.duelTrackFillOpp, { width: '58%' }]} />
              </View>
            </View>

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
          {/* BRAND OPPORTUNITIES & SPONSORSHIPS SECTION                   */}
          {/* ============================================================ */}
          {(selectedQuestFilter === 'all' || selectedQuestFilter === 'brand') && (
            <>
              {/* BRAND FILTER BANNER */}
              {selectedQuestFilter === 'brand' && (
                <View style={styles.filterActiveBanner}>
                  <Text style={styles.filterActiveBannerText}>
                    💼 <Text style={{ fontWeight: '700', color: '#B45309' }}>VERIFIED BRAND BOUNTIES</Text> • 3 Active Campaigns
                  </Text>
                </View>
              )}

              {/* SECTION 6: PREMIUM BRAND QUESTS */}
              <Text style={styles.premiumQuestsSectionHeader}>
                {selectedQuestFilter === 'brand' ? 'Active Brand Campaigns & Quests' : 'Premium Quests'}
              </Text>

          <View style={{ gap: 8, marginBottom: 16 }}>
            {/* Quest 1: Milestone */}
            <Pressable
              style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                setSelectedBrandName('60-Day Consistency Milestone');
                setSelectedBrandBounty('$450');
                triggerModalPop();
                setShowBrandQuestModal(true);
              }}
            >
              <View style={styles.brandIconCirclePurple}>
                <Text style={{ fontSize: 18 }}>🎁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandQuestItemTitle}>60-Day Consistency Milestone</Text>
                <Text style={styles.proPriorityBadgeText}>PRO PRIORITY</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bountyAmountGold}>+$450</Text>
                <Text style={styles.bountyLabelSmall}>Bounty</Text>
              </View>
              <Text style={styles.chevronGray}>›</Text>
            </Pressable>

            {/* Quest 2: Lagos Food Festival */}
            <Pressable
              style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                setSelectedBrandName('Lagos Food Festival Review');
                setSelectedBrandBounty('$350');
                triggerModalPop();
                setShowBrandQuestModal(true);
              }}
            >
              <View style={styles.brandIconCircleGold}>
                <Text style={{ fontSize: 18 }}>🍔</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandQuestItemTitle}>Lagos Food Festival Review</Text>
                <Text style={styles.brandQuestBadgeText}>BRAND QUEST</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bountyAmountGold}>+$350</Text>
                <Text style={styles.bountyLabelSmall}>Bounty</Text>
              </View>
              <Text style={styles.chevronGray}>›</Text>
            </Pressable>

            {/* Quest 3: Verified Creator profile */}
            <Pressable
              style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                setProfileModalSubTab('verification');
                triggerModalPop();
                setShowProfileModal(true);
              }}
            >
              <View style={styles.brandIconCircleGray}>
                <Text style={{ fontSize: 18 }}>🪪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandQuestItemTitle}>Fill out your Verified Creator profile</Text>
                <Text style={styles.profileProgressText}>4 of 5 complete</Text>
              </View>
              <Text style={styles.passportBoostLinkText}>Passport Boost</Text>
              <Text style={styles.chevronGray}>›</Text>
            </Pressable>
          </View>
            </>
          )}

          {/* ============================================================ */}
          {/* GENERAL PROGRESS, MATCHING & REPUTATION (ALL QUESTS TAB)     */}
          {/* ============================================================ */}
          {selectedQuestFilter === 'all' && (
            <>
                        {/* CREATOR EARNINGS & MONETIZATION ENTRY CARD */}
          <View style={styles.earningsHubCard}>
            <View style={styles.earningsHubHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.earningsHubTitle}>Creator Earnings</Text>
                  <View style={styles.readinessTag}>
                    <Text style={styles.readinessTagText}>94% SPONSOR READY</Text>
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
                <Text style={styles.earningsHubStatVal}>$2,450.00</Text>
              </View>
              <View style={styles.earningsHubDivider} />
              <View style={styles.earningsHubStatCol}>
                <Text style={styles.earningsHubStatLabel}>EST. TRACKED</Text>
                <Text style={[styles.earningsHubStatVal, { color: '#582CDB' }]}>$5,800.00</Text>
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

              {/* CARD 7: PRIORITY OPPORTUNITY MATCHING (Dark Pro Card) */}
              <View style={styles.darkOpportunityCard}>
                <View style={styles.darkCardHeaderRow}>
                  <Text style={styles.darkCardTag}>PRIORITY COLLAB & OPPORTUNITY MATCHING</Text>
                  <Text style={{ fontSize: 18 }}>👑</Text>
                </View>

                <Text style={styles.darkCardTitle}>Priority Opportunity Matching</Text>
                <Text style={styles.darkCardDesc}>
                  Your Creator Passport is ranking in the top 2% for priority creator collabs and sponsorship opportunities.
                </Text>

                <View style={styles.darkMetricsStack}>
                  {/* Metric 1 */}
                  <View style={styles.darkMetricRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 14 }}>🛡️</Text>
                      <Text style={styles.darkMetricLabel}>MATCH SCORE READINESS</Text>
                    </View>
                    <Text style={styles.darkMetricValPurple}>92%</Text>
                  </View>

                  {/* Metric 2 */}
                  <View style={styles.darkMetricRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 14 }}>🤝</Text>
                      <Text style={styles.darkMetricLabel}>PRIORITY CREATOR MATCHES</Text>
                    </View>
                    <Text style={styles.darkMetricValLight}>4 Crowned Available</Text>
                  </View>

                  {/* Metric 3 */}
                  <View style={styles.darkMetricRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 14 }}>💰</Text>
                      <Text style={styles.darkMetricLabel}>AVG. BOUNTY FIT</Text>
                    </View>
                    <Text style={styles.darkMetricValGreen}>$450–$1,200</Text>
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
                  <Text style={styles.viewOpportunitiesBtnText}>View Matching Opportunities 👑 ➔</Text>
                </Pressable>
              </View>

              {/* CARD 8: CREATOR REPUTATION TIER */}
              <View style={styles.reputationTierCard}>
            <Text style={styles.reputationHeaderTitle}>CREATOR REPUTATION TIER</Text>

            <View style={styles.stepTrackRow}>
              {/* Step 1: Level 1 */}
              <View style={styles.stepItemCol}>
                <View style={styles.stepCircleActive}>
                  <Text style={styles.stepCheckIcon}>✓</Text>
                </View>
                <Text style={styles.stepLevelText}>Level 1</Text>
                <Text style={styles.stepBadgeName}>Verified</Text>
              </View>

              <View style={styles.stepConnectorActive} />

              {/* Step 2: Level 12 */}
              <View style={styles.stepItemCol}>
                <View style={styles.stepCircleCurrent}>
                  <Text style={{ fontSize: 12 }}>🏆</Text>
                </View>
                <Text style={[styles.stepLevelText, { color: '#582CDB' }]}>Level 12</Text>
                <Text style={[styles.stepBadgeName, { color: '#582CDB' }]}>Elite</Text>
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

          {/* ============================================================ */}
          {/* CARD 9: JARVIS REPUTATION RECOMMENDATION                     */}
          {/* ============================================================ */}
          <View style={styles.jarvisRepCard}>
            <Image
              source={require('../../assets/images/jarvis-core-flame.png')}
              style={{ width: 32, height: 32, alignSelf: 'center', marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text style={styles.jarvisRepQuote}>
              &ldquo;Your strongest opportunity is in the Travel &amp; Lifestyle niche. Complete 2 more brand quests to unlock Tier-1 sponsorships.&rdquo;
            </Text>

            <View style={styles.jarvisTagsColumn}>
              <View style={styles.jarvisTagItem}>
                <Text style={styles.jarvisTagText}>🏷️ Focus: Lifestyle Reels</Text>
              </View>
              <View style={styles.jarvisTagItem}>
                <Text style={styles.jarvisTagText}>⚡ Optimal Time: 7:30 PM</Text>
              </View>
              <View style={styles.jarvisTagItem}>
                <Text style={styles.jarvisTagText}>🔗 Collab Opportunity: Amara Okafor</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 10: COMPLETED MISSIONS                               */}
          {/* ============================================================ */}
          <Text style={styles.completedSectionTitle}>COMPLETED MISSIONS</Text>

          <View style={[styles.completedCard, { marginBottom: 120 }]}>
            <View style={styles.completedItemRow}>
              <Text style={styles.greenCheckIcon}>✓</Text>
              <Text style={styles.completedTitleText}>Morning Reel Lock-in</Text>
              <Text style={styles.completedXpBadge}>+150 XP</Text>
            </View>

            <View style={styles.completedDivider} />

            <View style={styles.completedItemRow}>
              <Text style={styles.greenCheckIcon}>✓</Text>
              <Text style={styles.completedTitleText}>7-Day Streak Milestone</Text>
              <Text style={styles.completedXpBadge}>+250 XP</Text>
            </View>

            <View style={styles.completedDivider} />

            <View style={styles.completedItemRow}>
              <Text style={styles.greenCheckIcon}>✓</Text>
              <Text style={styles.completedTitleText}>Collab Pitch to Elena</Text>
              <Text style={styles.completedXpBadge}>+100 XP</Text>
            </View>
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

          {/* BRAND EMPTY / COMING SOON STATE (IF NO BRAND QUESTS) */}
          {selectedQuestFilter === 'brand' && false && (
            <View style={styles.emptyQuestCard}>
              <View style={styles.emptyQuestIconBoxGold}>
                <Text style={{ fontSize: 24 }}>💼</Text>
              </View>
              <Text style={styles.emptyQuestTitle}>Brand Quests Coming Soon</Text>
              <Text style={styles.emptyQuestDesc}>
                Check back soon! Jarvis AI is matching fresh high-bounty brand sponsorships for your verified Creator Passport.
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
        {/* MODAL: BRAND QUEST SUBMISSION                                */}
        {/* ============================================================ */}
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
                  <View style={styles.proPriorityPillModal}>
                    <Text style={styles.proPriorityPillModalText}>PRO PRIORITY APPLICATION</Text>
                  </View>
                  <Text style={[styles.modalTitle, { marginTop: 4 }]}>{selectedBrandName}</Text>
                  <Text style={styles.modalSubtitle}>Sponsorship Bounty: {selectedBrandBounty}</Text>
                </View>
                <Pressable onPress={() => setShowBrandQuestModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                <Text style={styles.briefDetailLine}>• Deliverable: 1 Dedicated 45s Reel &amp; TikTok</Text>
                <Text style={styles.briefDetailLine}>• Payout: {selectedBrandBounty} guaranteed upon approval</Text>
                <Text style={styles.briefDetailLine}>• Review Time: 24h fast-track priority for Pro creators</Text>
                <Text style={styles.briefDetailLine}>• Creator Passport Score: 94% match readiness</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowBrandQuestModal(false);
                  showToast(`Application for ${selectedBrandName} submitted to brand team!`);
                }}
              >
                <Text style={styles.modalFullBtnText}>Apply for {selectedBrandBounty} Bounty ➔</Text>
              </Pressable>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={styles.sqmCrownBox}>
                    <Text style={{ fontSize: 16 }}>🏆</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.sqmCategoryTag}>WEEKLY SQUAD GAUNTLET</Text>
                      <View style={styles.sqmTierPill}>
                        <Text style={styles.sqmTierPillText}>👑 PRO TIER</Text>
                      </View>
                    </View>
                    <Text style={styles.sqmMainTitle}>Momentum Makers Weekly Push</Text>
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
                    <View>
                      <Text style={styles.sqmProgressLabel}>TOTAL SQUAD COMPLETION</Text>
                      <Text style={styles.sqmProgressBigText}>5 / 8 Reels (62%)</Text>
                    </View>
                    <View style={styles.sqmTimerPill}>
                      <Text style={styles.sqmTimerText}>⏳ 3d 14h Left</Text>
                    </View>
                  </View>

                  <View style={styles.sqmTrackBg}>
                    <View style={[styles.sqmTrackFill, { width: '62%' }]} />
                  </View>

                  <Text style={styles.sqmRemainingHint}>
                    🔥 <Text style={{ fontWeight: '700', color: '#FDE68A' }}>3 Reels remaining</Text> to unlock the shared vault and claim the Creator Crown!
                  </Text>
                </LinearGradient>

                {/* Rewards Vault Grid */}
                <View style={styles.sqmRewardsSection}>
                  <Text style={styles.sqmSectionTitle}>UNLOCKED AT 100% COMPLETION</Text>
                  <View style={styles.sqmRewardsGrid}>
                    <View style={styles.sqmRewardCard}>
                      <Text style={styles.sqmRewardIcon}>✨</Text>
                      <Text style={styles.sqmRewardValue}>+750 XP</Text>
                      <Text style={styles.sqmRewardLabel}>Shared Bounty</Text>
                    </View>

                    <View style={styles.sqmRewardCard}>
                      <Text style={styles.sqmRewardIcon}>🛡️</Text>
                      <Text style={styles.sqmRewardValue}>7-Day</Text>
                      <Text style={styles.sqmRewardLabel}>Streak Shield</Text>
                    </View>

                    <View style={styles.sqmRewardCard}>
                      <Text style={styles.sqmRewardIcon}>👑</Text>
                      <Text style={styles.sqmRewardValue}>Squad Crown</Text>
                      <Text style={styles.sqmRewardLabel}>Profile Trophy</Text>
                    </View>

                    <View style={styles.sqmRewardCard}>
                      <Text style={styles.sqmRewardIcon}>⚡</Text>
                      <Text style={styles.sqmRewardValue}>1.5x Boost</Text>
                      <Text style={styles.sqmRewardLabel}>14-Day Velocity</Text>
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
                    if (onOpenSquad) onOpenSquad();
                  }}
                >
                  <Text style={styles.sqmOutlineBtnText}>Squad Room 💬</Text>
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
                    <Text style={styles.sqmSolidBtnText}>Contribute Reel 🔥</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={styles.duelModalSwordsBox}>
                    <Text style={{ fontSize: 16 }}>⚔️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.duelModalLivePill}>
                        <View style={styles.duelModalLiveDot} />
                        <Text style={styles.duelModalLivePillText}>ROUND 2 / 3 LIVE</Text>
                      </View>
                      <Text style={styles.duelModalTimerText}>⏳ 03h 45m left</Text>
                    </View>
                    <Text style={styles.duelModalTitle}>Momentum Makers vs Lagos Storytellers</Text>
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
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.duelScoreTeamMine}>Momentum Makers</Text>
                      <Text style={styles.duelScoreNumberMine}>62 PTS</Text>
                      <View style={styles.duelLeadBadge}>
                        <Text style={styles.duelLeadBadgeText}>👑 IN THE LEAD (+4)</Text>
                      </View>
                    </View>

                    {/* Center VS */}
                    <View style={styles.duelVsCenterCircle}>
                      <Text style={styles.duelVsCenterText}>VS</Text>
                    </View>

                    {/* Opponent Squad */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={styles.duelScoreTeamOpp}>Lagos Storytellers</Text>
                      <Text style={styles.duelScoreNumberOpp}>58 PTS</Text>
                      <View style={styles.duelTrailingBadge}>
                        <Text style={styles.duelTrailingBadgeText}>4 PTS BEHIND</Text>
                      </View>
                    </View>
                  </View>

                  {/* Tug of war bar */}
                  <View style={styles.duelTugBar}>
                    <View style={[styles.duelTugFillMine, { width: '55%' }]} />
                    <View style={[styles.duelTugFillOpp, { width: '45%' }]} />
                  </View>
                  <Text style={styles.duelTugSubText}>
                    ⚡ Momentum Makers is leading by <Text style={{ color: '#FDE68A', fontWeight: '700' }}>4 points</Text>. Next Reel post locks the round victory!
                  </Text>
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
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <View style={styles.duelTaskFireBox}>
                          <Text style={{ fontSize: 15 }}>🔥</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.duelTaskCardTitle}>Post Short-Form Gauntlet Reel</Text>
                            <View style={styles.duelTaskUrgentPill}>
                              <Text style={styles.duelTaskUrgentText}>YOUR TURN</Text>
                            </View>
                          </View>
                          <Text style={styles.duelTaskCardSub}>Post with #PostStreakDuel to extend your squad lead.</Text>
                          <Text style={styles.duelTaskCardReward}>Reward: +15 Duel Pts • +150 XP</Text>
                        </View>
                      </View>
                    </View>

                    {/* Task 2: Collab */}
                    <View style={styles.duelTaskCardStandard}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <Text style={{ fontSize: 15, marginTop: 2 }}>🎬</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.duelTaskCardTitleStandard}>Co-Produce Split-Screen Duet</Text>
                          <Text style={styles.duelTaskCardSub}>Partner with Elena or Amara on a shared hook.</Text>
                          <Text style={styles.duelTaskCardRewardStandard}>Reward: +20 Duel Pts • +200 XP</Text>
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
                          <Text style={styles.duelTaskCardRewardStandard}>Reward: +10 Duel Pts • +100 XP</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Stakes & Vault Reward */}
                <View style={styles.duelStakesCard}>
                  <Text style={styles.duelStakesTitle}>🏆 ROUND VICTORY REWARDS</Text>
                  <Text style={styles.duelStakesSub}>
                    Winning squad receives <Text style={{ fontWeight: '700', color: '#B45309' }}>+500 XP Shared Bounty</Text>, a 7-Day Streak Shield, and the Live Duel Champion Crown!
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.sqmActionsRow}>
                <Pressable
                  style={styles.sqmOutlineBtn}
                  onPress={() => {
                    setShowDuelTasksModal(false);
                    if (onOpenSquad) onOpenSquad();
                  }}
                >
                  <Text style={styles.sqmOutlineBtnText}>Squad Room 💬</Text>
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
                    <Text style={styles.sqmSolidBtnText}>Post to Score +15 pts 🔥</Text>
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
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 16 }}>👑</Text>
                    <Text style={styles.modalTitle}>Choose Opportunity Type</Text>
                  </View>
                  <Text style={styles.modalSubtitle}>Where would you like to explore priority matches?</Text>
                </View>
                <Pressable onPress={() => setShowOpportunityModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* 3 Selectable Opportunity Cards */}
              <View style={{ gap: 12, marginVertical: 14 }}>
                {/* OPTION 1: CREATOR COLLAB MATCHING */}
                <Pressable
                  style={({ pressed }) => [styles.oppChoiceCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowOpportunityModal(false);
                    if (onOpenOpportunities) {
                      onOpenOpportunities();
                    } else if (onNavigateTab) {
                      onNavigateTab('match');
                    }
                  }}
                >
                  <View style={styles.oppChoiceIconBoxGold}>
                    <Text style={{ fontSize: 22 }}>👥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.oppChoiceTitle}>Creator Collabs</Text>
                      <View style={styles.oppChoiceBadgeGold}>
                        <Text style={styles.oppChoiceBadgeGoldText}>👑 TOP 2%</Text>
                      </View>
                    </View>
                    <Text style={styles.oppChoiceDesc}>
                      Match with crowned verified creators for joint Reels, series & split-screen duets.
                    </Text>
                    <Text style={styles.oppChoiceMetaPurple}>4 Crowned Matches • 96% Synergy</Text>
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
                    if (onOpenSquad) {
                      onOpenSquad();
                    } else {
                      setSelectedQuestFilter('squad');
                    }
                  }}
                >
                  <View style={styles.oppChoiceIconBoxPurple}>
                    <Text style={{ fontSize: 22 }}>🛡️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.oppChoiceTitle}>Squad Sprints & Duels</Text>
                      <View style={styles.oppChoiceBadgePurple}>
                        <Text style={styles.oppChoiceBadgePurpleText}>⚡ ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.oppChoiceDesc}>
                      Join creator squads, contribute to 8-Reel goals, and battle live in squad duels.
                    </Text>
                    <Text style={styles.oppChoiceMetaPurple}>Momentum Makers (Round 2 Live) • +750 XP</Text>
                  </View>
                  <Text style={styles.oppChoiceChevron}>›</Text>
                </Pressable>

                {/* OPTION 3: BRAND SPONSORSHIP DEALS */}
                <Pressable
                  style={({ pressed }) => [styles.oppChoiceCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowOpportunityModal(false);
                    setSelectedQuestFilter('brand');
                  }}
                >
                  <View style={styles.oppChoiceIconBoxGreen}>
                    <Text style={{ fontSize: 22 }}>💼</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.oppChoiceTitle}>Brand Sponsorship Deals</Text>
                      <View style={styles.oppChoiceBadgeGreen}>
                        <Text style={styles.oppChoiceBadgeGreenText}>💰 $450–$1,200</Text>
                      </View>
                    </View>
                    <Text style={styles.oppChoiceDesc}>
                      Explore verified brand campaigns, food festival reviews & milestone bounties.
                    </Text>
                    <Text style={styles.oppChoiceMetaGreen}>3 Active Brand Quests Available</Text>
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
                +{celebrationXp} Creator XP earned toward Level 13!
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
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 96,
  },

  // HERO TAGS & HEADLINE
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  mainSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },

  // FILTER PILLS
  questFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  questFilterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  questFilterPillActive: {
    backgroundColor: '#582CDB',
  },
  questFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  questFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // CARD 1: TODAY'S PRO QUEST
  todayProQuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  todayQuestTagBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  todayQuestTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  todayQuestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  todayQuestSub: {
    fontSize: 12,
    color: '#64748B',
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
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  rewardValGold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  rewardValPurple: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  rewardValDark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  rewardDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  questSparkleCallout: {
    backgroundColor: '#F5F3FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  questSparkleText: {
    fontSize: 12,
    fontWeight: '700',
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
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewIdeaBtnText: {
    fontSize: 13,
    fontWeight: '800',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    alignItems: 'center',
  },
  metricIconCirclePurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconCircleGold: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricSquareNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  metricSquareLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  // CARD 3: CREATOR LEVEL
  levelProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 16,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  levelBigTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  nextLevelPercentText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#582CDB',
  },
  levelProgressTrackBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  levelProgressTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelBottomCalloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTotalXpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  unlockNextRewardsLink: {
    fontSize: 12,
    fontWeight: '800',
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
    marginBottom: 10,
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
    marginBottom: 12,
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
    borderColor: '#E2E8F0',
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
    gap: 8,
  },
  viewSquadOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewSquadBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  contributeSolidBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  contributeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
    gap: 12,
  },
  brandIconCirclePurple: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIconCircleGold: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIconCircleGray: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandQuestItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  proPriorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 1,
  },
  brandQuestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 1,
  },
  profileProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 1,
  },
  bountyAmountGold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  bountyLabelSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  passportBoostLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  chevronGray: {
    fontSize: 20,
    color: '#94A3B8',
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
  },
  readinessTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7C3AED',
  },
  earningsHubSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  earningsHubIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 9,
    fontWeight: '800',
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
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
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
    borderRadius: 14,
    alignItems: 'center',
  },
  viewOpportunitiesBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  jarvisTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
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
  completedXpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  completedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
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
  briefDetailLine: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
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
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  oppChoiceIconBoxGold: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  oppChoiceIconBoxPurple: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  oppChoiceIconBoxGreen: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  oppChoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  oppChoiceBadgeGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  oppChoiceBadgeGoldText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  oppChoiceBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  oppChoiceBadgePurpleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  oppChoiceBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  oppChoiceBadgeGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  oppChoiceDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  oppChoiceMetaPurple: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 4,
  },
  oppChoiceMetaGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 4,
  },
  oppChoiceChevron: {
    fontSize: 22,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 4,
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
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  sqmTierPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  sqmTierPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
  },
  sqmMainTitle: {
    fontSize: 16.5,
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sqmProgressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sqmProgressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C084FC',
    letterSpacing: 0.5,
  },
  sqmProgressBigText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sqmTimerPill: {
    backgroundColor: 'rgba(253, 230, 138, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.3)',
  },
  sqmTimerText: {
    fontSize: 10,
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
    flexDirection: 'row',
    gap: 8,
  },
  sqmRewardCard: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  sqmRewardIcon: {
    fontSize: 15,
    marginBottom: 2,
  },
  sqmRewardValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  sqmRewardLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
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
  },
  sqmOutlineBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sqmOutlineBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
  },
  sqmSolidBtn: {
    flex: 1.3,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sqmSolidGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sqmSolidBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  duelModalLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  duelModalLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  duelModalLivePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B91C1C',
  },
  duelModalTimerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  duelModalTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#171420',
    marginTop: 2,
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
    marginBottom: 12,
  },
  duelScoreTeamMine: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3E8FF',
  },
  duelScoreNumberMine: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  duelLeadBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  duelLeadBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  duelVsCenterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duelVsCenterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE68A',
  },
  duelScoreTeamOpp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  duelScoreNumberOpp: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 2,
  },
  duelTrailingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  duelTrailingBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#CBD5E1',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
    marginTop: 3,
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
});
