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
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';

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
    title: 'GlowUp Skincare Launch Unlocked',
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
  onOpenPassport,
  onOpenOpportunities,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [selectedQuestFilter, setSelectedQuestFilter] = useState<'all' | 'squad' | 'brand'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBrandQuestModal, setShowBrandQuestModal] = useState(false);
  const [showSquadQuestModal, setShowSquadQuestModal] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationXp, setCelebrationXp] = useState(350);
  const [celebrationMessage, setCelebrationMessage] = useState('Daily Quest Activated!');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Brand Quest details
  const [selectedBrandName, setSelectedBrandName] = useState('GlowUp Skincare Launch');
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

          {/* FILTER PILLS: All Quests | Squad | Brand */}
          <View style={styles.questFilterRow}>
            <Pressable
              onPress={() => setSelectedQuestFilter('all')}
              style={[styles.questFilterPill, selectedQuestFilter === 'all' && styles.questFilterPillActive]}
            >
              <Text style={[styles.questFilterText, selectedQuestFilter === 'all' && styles.questFilterTextActive]}>
                All Quests
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedQuestFilter('squad')}
              style={[styles.questFilterPill, selectedQuestFilter === 'squad' && styles.questFilterPillActive]}
            >
              <Text style={[styles.questFilterText, selectedQuestFilter === 'squad' && styles.questFilterTextActive]}>
                Squad
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedQuestFilter('brand')}
              style={[styles.questFilterPill, selectedQuestFilter === 'brand' && styles.questFilterPillActive]}
            >
              <Text style={[styles.questFilterText, selectedQuestFilter === 'brand' && styles.questFilterTextActive]}>
                Brand
              </Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: TODAY'S PRO QUEST                                    */}
          {/* ============================================================ */}
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

          {/* ============================================================ */}
          {/* CARD 4: SQUAD QUEST                                          */}
          {/* ============================================================ */}
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
                  showToast('Added your Reel draft to the Momentum Makers weekly target (+250 XP)!');
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
                setShowSquadQuestModal(true);
              }}
            >
              <Text style={styles.viewDuelTasksBtnText}>View Duel Tasks</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION 6: PREMIUM QUESTS                                    */}
          {/* ============================================================ */}
          <Text style={styles.premiumQuestsSectionHeader}>Premium Quests</Text>

          <View style={{ gap: 8, marginBottom: 16 }}>
            {/* Quest 1: GlowUp */}
            <Pressable
              style={({ pressed }) => [styles.premiumQuestItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                setSelectedBrandName('GlowUp Skincare Launch');
                setSelectedBrandBounty('$450');
                triggerModalPop();
                setShowBrandQuestModal(true);
              }}
            >
              <View style={styles.brandIconCirclePurple}>
                <Text style={{ fontSize: 18 }}>🎁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandQuestItemTitle}>GlowUp Skincare Launch</Text>
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
                if (onOpenPassport) onOpenPassport();
                else {
                  triggerModalPop();
                  setShowProfileModal(true);
                }
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

          {/* ============================================================ */}
          {/* CARD 7: PRIORITY OPPORTUNITY MATCHING (Dark Pro Card)        */}
          {/* ============================================================ */}
          <View style={styles.darkOpportunityCard}>
            <View style={styles.darkCardHeaderRow}>
              <Text style={styles.darkCardTag}>PRIORITY OPPORTUNITY MATCHING</Text>
              <Text style={{ fontSize: 18 }}>👑</Text>
            </View>

            <Text style={styles.darkCardTitle}>Priority Opportunity Matching</Text>
            <Text style={styles.darkCardDesc}>
              Your Creator Passport is ranking in the top 2% for lifestyle brand opportunities in West Africa.
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
                  <Text style={styles.darkMetricLabel}>COLLAB MATCHES</Text>
                </View>
                <Text style={styles.darkMetricValLight}>4 Available</Text>
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
                if (onOpenOpportunities) onOpenOpportunities();
                else {
                  triggerModalPop();
                  setShowOpportunityModal(true);
                }
              }}
            >
              <Text style={styles.viewOpportunitiesBtnText}>View Matching Opportunities</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 8: CREATOR REPUTATION TIER (Milestone Step Track)       */}
          {/* ============================================================ */}
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
        {/* MODAL: SQUAD QUEST & DUEL TASKS                              */}
        {/* ============================================================ */}
        <Modal
          visible={showSquadQuestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSquadQuestModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Momentum Makers Weekly Tasks</Text>
                  <Text style={styles.modalSubtitle}>Squad Target: 8 Reels • Live Duel Active</Text>
                </View>
                <Pressable onPress={() => setShowSquadQuestModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 10 }}>
                <Text style={styles.squadTaskItem}>• {userProfile?.name || 'Pablo'} — Published 2 Reels (Active 🔥)</Text>
                <Text style={styles.squadTaskItem}>• Amara Okafor — Published 1 Reel (Active 🔥)</Text>
                <Text style={styles.squadTaskItem}>• Elena Rostova — Published 1 Reel (Active 🔥)</Text>
                <Text style={styles.squadTaskItem}>• David Adebayo — 1 Reel Scheduled for 7:30 PM</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowSquadQuestModal(false);
                  showToast('Contributed to squad weekly score!');
                }}
              >
                <Text style={styles.modalFullBtnText}>Contribute Reel (+100 XP)</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: OPPORTUNITY MATCHING READINESS                        */}
        {/* ============================================================ */}
        <Modal
          visible={showOpportunityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOpportunityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Top 2% Brand Match Catalog</Text>
                  <Text style={styles.modalSubtitle}>Verified sponsorship pipeline</Text>
                </View>
                <Pressable onPress={() => setShowOpportunityModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 10 }}>
                <View style={styles.oppItemRow}>
                  <Text style={styles.oppTitle}>GlowUp Skincare</Text>
                  <Text style={styles.oppBounty}>$450 Bounty</Text>
                </View>
                <View style={styles.oppItemRow}>
                  <Text style={styles.oppTitle}>Lagos Food Festival</Text>
                  <Text style={styles.oppBounty}>$350 Bounty</Text>
                </View>
                <View style={styles.oppItemRow}>
                  <Text style={styles.oppTitle}>Creator Tech Summit</Text>
                  <Text style={styles.oppBounty}>$1,200 Bounty</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowOpportunityModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close</Text>
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  questFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
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
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  todayQuestTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  todayQuestTitle: {
    fontSize: 17,
    fontWeight: '900',
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
    fontSize: 8.5,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  countdownBigDigits: {
    fontSize: 22,
    fontWeight: '900',
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
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  rewardValGold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#D97706',
  },
  rewardValPurple: {
    fontSize: 13,
    fontWeight: '900',
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
    fontSize: 11.5,
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
    fontSize: 13.5,
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  metricSquareLabel: {
    fontSize: 8.5,
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
    fontWeight: '900',
    color: '#171420',
  },
  nextLevelPercentText: {
    fontSize: 18,
    fontWeight: '900',
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  unlockNextRewardsLink: {
    fontSize: 11.5,
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  groupRewardPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  groupRewardPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
  },
  squadQuestTitle: {
    fontSize: 16,
    fontWeight: '900',
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
    fontSize: 10.5,
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
    fontWeight: '900',
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#DC2626',
  },
  duelEndsInText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  duelCardTitle: {
    fontSize: 15,
    fontWeight: '900',
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
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  duelScoreMine: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  duelSquadNameOpp: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  duelScoreOpp: {
    fontSize: 11.5,
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
    fontWeight: '900',
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
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  proPriorityBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    marginTop: 1,
  },
  brandQuestBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#D97706',
    marginTop: 1,
  },
  profileProgressText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 1,
  },
  bountyAmountGold: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#D97706',
  },
  bountyLabelSmall: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  passportBoostLinkText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  chevronGray: {
    fontSize: 20,
    color: '#94A3B8',
  },

  // CARD 7: DARK OPPORTUNITY MATCHING
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
    fontWeight: '900',
    color: '#EAB308',
    letterSpacing: 0.5,
  },
  darkCardTitle: {
    fontSize: 17,
    fontWeight: '900',
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
  },
  darkMetricValPurple: {
    fontSize: 13,
    fontWeight: '900',
    color: '#A78BFA',
  },
  darkMetricValLight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  darkMetricValGreen: {
    fontSize: 13,
    fontWeight: '900',
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
    fontSize: 13.5,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontSize: 8.5,
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
    fontWeight: '900',
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
    fontWeight: '900',
  },
  completedTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
  },
  completedXpBadge: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#D97706',
  },
  completedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
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
  proPriorityPillModal: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  proPriorityPillModalText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#78350F',
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
    fontWeight: '900',
    color: '#D97706',
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
