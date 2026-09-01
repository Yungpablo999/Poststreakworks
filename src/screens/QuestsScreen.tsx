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
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, isNarrowScreen, isSmallScreen, sPadding } from '../utils/responsive';

interface QuestsScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMissionDetail?: () => void;
  onOpenCommunityChallenge?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenEarnings?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const QuestsScreen: React.FC<QuestsScreenProps> = ({
  onBackToDashboard,
  onLogout,
  onNavigateTab,
  onOpenMissionDetail,
  onOpenCommunityChallenge,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onOpenEarnings,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);

  // Modal States
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Quest Started!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your quest progress is now active.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Ghost says: You got this Amara!');
  const [celebrationBadge, setCelebrationBadge] = useState('QUEST ACTIVE');
  const [celebrationXp, setCelebrationXp] = useState(60);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReputationModal, setShowReputationModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;

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

  const handleStartTodayQuest = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenMissionDetail) {
      onOpenMissionDetail();
    } else if (onNavigateTab) {
      onNavigateTab('mission-detail' as TabType);
    }
  };

  const handleJoinCommunityChallenge = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenCommunityChallenge) {
      onOpenCommunityChallenge();
    } else if (onNavigateTab) {
      onNavigateTab('challenge-detail' as TabType);
    }
  };

  const handleStartStarterQuest = (questId: string, title: string, xp: number, routeTab?: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (routeTab && onNavigateTab) {
      onNavigateTab(routeTab);
      return;
    }

    setCelebrationTitle('Quest Started!');
    setCelebrationSubtitle(`"${title}" is now active in your studio.`);
    setCelebrationSpeech('Ghost says: Complete this quest today to level up your Creator Passport!');
    setCelebrationBadge('QUEST ACTIVE');
    setCelebrationXp(xp);
    setShowCelebrationModal(true);
  };

  const handleUnderstoodReputation = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowReputationModal(false);
    setTimeout(() => {
      setCelebrationTitle('Reputation Goal Locked!');
      setCelebrationSubtitle('Ghost is tracking your daily quests toward 100% Creator Passport rating.');
      setCelebrationSpeech(`Ghost says: Consistency is your secret weapon Amara! Keep up your ${userProfile?.streakCount || 1}-day streak!`);
      setCelebrationBadge('PASSPORT ACTIVE');
      setCelebrationXp(40);
      setShowCelebrationModal(true);
    }, 200);
  };

  const handleUnderstoodBrand = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowBrandModal(false);
    setTimeout(() => {
      setCelebrationTitle('Brand Goal Target Set!');
      setCelebrationSubtitle('Ghost will alert you as soon as you reach Level 3 requirements for sponsored campaigns.');
      setCelebrationSpeech("Ghost says: Paid opportunities unlock soon! You're on fire today!");
      setCelebrationBadge('BRAND RADAR');
      setCelebrationXp(50);
      setShowCelebrationModal(true);
    }, 200);
  };

  const handleExplorePro = () => {
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
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP PILL BADGES */}
          <View style={styles.topBadgesRow}>
            <View style={styles.questsPill}>
              <Text style={styles.questsPillText}>QUESTS</Text>
            </View>

            <View style={styles.earnRankPill}>
              <Text style={styles.earnRankPillText}>EARN RANK</Text>
            </View>
          </View>

          {/* HEADLINE & SUBTITLE */}
          <Text
            style={styles.mainHeading}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.65}
          >
            Complete quests. Build your streak.
          </Text>
          <Text style={styles.mainSubtitle}>
            Daily missions, creator challenges and reputation goals that help you stay consistent.
          </Text>

          {/* 1. TODAY'S QUEST HERO CARD */}
          <View style={styles.todayQuestCard}>
            <View style={styles.todayQuestHeaderRow}>
              <Text style={styles.todayQuestTag}>TODAY&apos;S QUEST</Text>
              <View style={styles.flameIconCircle}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
              </View>
            </View>

            <Text style={styles.todayQuestTitle}>Post once before 9 PM</Text>
            <Text style={styles.todayQuestSub}>
              Protect your {userProfile?.streakCount || 1}-day streak and keep your momentum alive.
            </Text>

            {/* Progress Row & Bar */}
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabelLeft}>PROGRESS</Text>
              <Text style={styles.progressLabelRight}>
                {completedQuests.includes('today_quest') ? '1 / 1 COMPLETED' : '0 / 1 COMPLETED'}
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: completedQuests.includes('today_quest') ? '100%' : '0%' },
                ]}
              />
            </View>

            {/* Bottom Row */}
            <View style={styles.todayQuestFooterRow}>
              <Text style={styles.todayQuestRewardsText}>
                <Text style={{ fontWeight: '800', color: completedQuests.includes('today_quest') ? '#10B981' : '#D97706' }}>
                  {completedQuests.includes('today_quest') ? '✓ +80 XP' : '+80 XP'}
                </Text>  •  Streak Protected
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.startQuestBtn,
                  completedQuests.includes('today_quest') && styles.completedQuestBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleStartTodayQuest}
              >
                <Text style={[styles.startQuestBtnText, completedQuests.includes('today_quest') && styles.completedQuestBtnText]}>
                  {completedQuests.includes('today_quest') ? '✓ Completed' : 'Start Quest'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 2. CREATOR STATS 3-COLUMN BAR & LEVEL PROGRESS */}
          <View style={styles.statsBarContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statColLabel}>ACTIVE QUESTS</Text>
                <Text style={[styles.statColValue, { color: '#582CDB' }]}>3</Text>
              </View>

              <View style={styles.statColDivider} />

              <View style={styles.statCol}>
                <Text style={styles.statColLabel}>TOTAL XP</Text>
                <Text style={styles.statColValue}>8.4k</Text>
              </View>

              <View style={styles.statColDivider} />

              <View style={styles.statCol}>
                <Text style={styles.statColLabel}>LEVEL</Text>
                <Text style={[styles.statColValue, { color: '#D97706' }]}>12</Text>
              </View>
            </View>

            {/* Level Progress Indicator */}
            <View style={styles.levelProgressContainer}>
              <Text style={styles.levelProgressLabel}>LV 12</Text>
              <View style={styles.levelTrack}>
                <LinearGradient
                  colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.levelFill, { width: '65%' }]}
                />
              </View>
              <Text style={styles.levelProgressLabel}>LV 13</Text>
            </View>
          </View>

          {/* 3. STARTER QUESTS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Starter Quests</Text>
          </View>

          <View style={styles.starterQuestsList}>
            {/* Quest 1 */}
            <Pressable
              style={({ pressed }) => [
                styles.starterQuestCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => handleStartStarterQuest('q1', 'Create your next post idea', 60, 'create')}
            >
              <View style={styles.starterQuestLeft}>
                <View style={styles.starterQuestBadgeRow}>
                  <Text style={styles.xpPillGold}>+60 XP</Text>
                  <Text style={styles.typePillDot}>·</Text>
                  <Text style={styles.typePill}>Daily</Text>
                </View>
                <Text style={styles.starterQuestTitle}>Create your next post idea</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.starterQuestActionBtn, pressed && styles.btnPressed]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleStartStarterQuest('q1', 'Create your next post idea', 60, 'create');
                }}
                hitSlop={8}
              >
                <Text style={styles.starterQuestActionText}>Start</Text>
              </Pressable>
            </Pressable>

            {/* Quest 2 */}
            <Pressable
              style={({ pressed }) => [
                styles.starterQuestCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => handleStartStarterQuest('q2', 'Connect with one creator', 90, 'match')}
            >
              <View style={styles.starterQuestLeft}>
                <View style={styles.starterQuestBadgeRow}>
                  <Text style={styles.xpPillGold}>+90 XP</Text>
                  <Text style={styles.typePillDot}>·</Text>
                  <Text style={styles.typePill}>Recommended</Text>
                </View>
                <Text style={styles.starterQuestTitle}>Connect with one creator</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.starterQuestActionBtn, pressed && styles.btnPressed]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleStartStarterQuest('q2', 'Connect with one creator', 90, 'match');
                }}
                hitSlop={8}
              >
                <Text style={styles.starterQuestActionText}>Find Match</Text>
              </Pressable>
            </Pressable>

            {/* Quest 3 */}
            <Pressable
              style={({ pressed }) => [
                styles.starterQuestCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenSchedule) {
                  onOpenSchedule();
                } else if (onNavigateTab) {
                  onNavigateTab('schedule' as TabType);
                }
              }}
            >
              <View style={styles.starterQuestLeft}>
                <View style={styles.starterQuestBadgeRow}>
                  <Text style={styles.xpPillGold}>+50 XP</Text>
                  <Text style={styles.typePillDot}>·</Text>
                  <Text style={styles.typePill}>Weekly</Text>
                </View>
                <Text style={styles.starterQuestTitle}>Schedule your next post</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.starterQuestActionBtn, pressed && styles.btnPressed]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenSchedule) {
                    onOpenSchedule();
                  } else if (onNavigateTab) {
                    onNavigateTab('schedule' as TabType);
                  }
                }}
                hitSlop={8}
              >
                <Text style={styles.starterQuestActionText}>Schedule</Text>
              </Pressable>
            </Pressable>
          </View>

          {/* 4. COMMUNITY CHALLENGE HERO CARD (ROYAL PURPLE GRADIENT) */}
          <View style={styles.communityCard}>
            <View style={styles.communityTopBanner}>
              <Text style={styles.communityTopBannerText}>COMMUNITY CHALLENGE</Text>
            </View>

            <View style={styles.communityBody}>
              <Text style={styles.communityTitle}>7-Day Consistency Challenge</Text>
              <Text style={styles.communitySub}>
                Post 3 times this week and climb the creator leaderboard.
              </Text>

              {/* Progress */}
              <View style={styles.communityProgressLabelRow}>
                <Text style={styles.communityProgressLabel}>PROGRESS</Text>
                <Text style={styles.communityProgressLabel}>1 / 3 POSTS</Text>
              </View>
              <View style={styles.communityProgressTrack}>
                <View style={[styles.communityProgressFill, { width: '33%' }]} />
              </View>

              {/* Social Proof Pill */}
              <View style={styles.socialProofPill}>
                <View style={styles.stackedAvatarsRow}>
                  <Image source={require('../../assets/images/elena-avatar.jpg')} style={[styles.miniAvatar, { zIndex: 3 }]} />
                  <Image source={require('../../assets/images/marcus-avatar.jpg')} style={[styles.miniAvatar, { marginLeft: -8, zIndex: 2 }]} />
                  <Image source={require('../../assets/images/david-avatar.jpg')} style={[styles.miniAvatar, { marginLeft: -8, zIndex: 1 }]} />
                </View>
                <Text style={styles.socialProofText}>42 creators are competing</Text>
              </View>

              {/* Bottom Row */}
              <View style={styles.communityFooterRow}>
                <View style={styles.challengeRewardBox}>
                  <Text
                    style={styles.challengeRewardTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                  >
                    🏆 Consistency Badge
                  </Text>
                  <Text style={styles.challengeRewardSub}>+250 XP Reward</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.joinChallengeBtn, pressed && styles.btnPressed]}
                  onPress={handleJoinCommunityChallenge}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#EAB308']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.joinChallengeGradient}
                  >
                    <Text style={styles.joinChallengeBtnText}>Join Challenge</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 5. CREATOR REPUTATION CARD */}
          <View style={styles.reputationCard}>
            <Text style={styles.reputationMainTitle}>Creator Reputation</Text>
            <Text style={styles.reputationSubtitle}>Your quest activity helps build your Creator Passport.</Text>

            <View style={styles.repRow}>
              <Text style={styles.repLabel}>Consistency</Text>
              <Text style={styles.repValueStrong}>Strong</Text>
            </View>

            <View style={styles.repRow}>
              <Text style={styles.repLabel}>Collaboration Proof</Text>
              <Text style={styles.repValueMuted}>Not started</Text>
            </View>

            <View style={styles.repRow}>
              <Text style={styles.repLabel}>Quest Completion</Text>
              <Text style={styles.repValueDark}>1 / 3</Text>
            </View>

            {/* Bottom Row: 35% & Build Reputation */}
            <View style={styles.reputationFooterRow}>
              <View style={styles.repPercentGroup}>
                <Text style={styles.repPercentText}>35%</Text>
                <Text style={styles.repPercentSub}>Creator Passport</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.improveRepBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowReputationModal(true);
                }}
              >
                <Text style={styles.improveRepBtnText}>Build Reputation →</Text>
              </Pressable>
            </View>
          </View>

                    {/* CREATOR EARNINGS & MONETIZATION ENTRY CARD */}
          <View style={styles.earningsHubCard}>
            <View style={styles.earningsHubHeader}>
              <View style={styles.earningsHubHeaderLeft}>
                <View style={styles.earningsHubTitleRow}>
                  <Text style={styles.earningsHubTitle}>Creator Earnings</Text>
                  <View style={styles.readinessTag}>
                    <Text style={styles.readinessTagText}>70% CAMPAIGN READY</Text>
                  </View>
                </View>
                <Text style={styles.earningsHubSub} numberOfLines={1}>Build your path to paid brand campaigns</Text>
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
                <Text style={styles.earningsHubStatLabel}>EST. POTENTIAL</Text>
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
                  triggerModalPop();
                  setShowBrandModal(true);
                }
              }}
            >
              <Text style={styles.earningsHubBtnText}>View Creator Earnings →</Text>
            </Pressable>
          </View>

          {/* 6. BRAND QUEST PREVIEW CARD */}
          <View style={styles.brandQuestCard}>
            <View style={styles.brandQuestHeaderRow}>
              <Text style={styles.brandQuestTag}>BRAND QUEST PREVIEW</Text>
              <View style={styles.stampBadge}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L15 5H19V9L22 12L19 15V19H15L12 22L9 19H5V15L2 12L5 9V5H9L12 2Z"
                    stroke="#D97706"
                    strokeWidth="1.8"
                  />
                  <Path d="M9 12L11 14L15 10" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
            </View>

            <Text style={styles.brandQuestTitle}>Starter Creator Campaigns</Text>
            <Text style={styles.brandQuestSub}>
              Complete quest requirements to qualify for future paid opportunities.
            </Text>

            {/* Requirements Checklist */}
            <View style={styles.requirementsList}>
              <View style={styles.reqItem}>
                <Text style={{ color: '#582CDB', fontSize: 13, fontWeight: '800' }}>●</Text>
                <Text style={styles.reqTextActive}>7-day streak</Text>
              </View>
              <View style={styles.reqItem}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>○</Text>
                <Text style={styles.reqText}>Complete 3 starter quests</Text>
              </View>
              <View style={styles.reqItem}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>○</Text>
                <Text style={styles.reqText}>Add creator profile</Text>
              </View>
              <View style={styles.reqItem}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>○</Text>
                <Text style={styles.reqText}>Connect one platform</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.brandQuestFooter}>
              <Text style={styles.unlocksAtLvlText} numberOfLines={1}>🔒 Unlocks at lvl 3/4</Text>
              <Pressable
                onPress={() => {
                  triggerModalPop();
                  setShowBrandModal(true);
                }}
                hitSlop={6}
              >
                <Text style={styles.viewReqsLink}>View Requirements</Text>
              </Pressable>
            </View>
          </View>

          {/* 7. UNLOCK PRO QUESTS CARD */}
          <View style={styles.unlockProCard}>
            <View style={styles.unlockProHeaderRow}>
              <Text style={styles.unlockProTitle}>Unlock Pro Quests</Text>
              <View style={styles.proGoldBadge}>
                <Text style={styles.proGoldBadgeText}>PRO</Text>
              </View>
            </View>

            <Text style={styles.unlockProSubtitle}>
              Pro gives you deeper squad missions, creator duels, and priority quests.
            </Text>

            <View style={styles.proFeaturesList}>
              <Text style={styles.proFeatureItem}>👥  Squad Quests</Text>
              <Text style={styles.proFeatureItem}>⚔️  Creator Duels</Text>
              <Text style={styles.proFeatureItem}>⭐  Priority Quest Board</Text>
            </View>

            {/* Explore Pro Metallic Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.exploreProBtn, pressed && styles.btnPressed]}
              onPress={handleExplorePro}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreProGradient}
              >
                <Text style={styles.exploreProBtnText}>Explore Pro</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 8. JARVIS FLOATING INSIGHT FOOTER */}
          <View style={styles.jarvisFooterContainer}>
            <Animated.View
              style={[
                styles.jarvisFooterFlameWrapper,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisFooterFlame}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.jarvisFooterQuote}>
              &ldquo;Start with today&apos;s quest. Completing daily quests builds reputation and unlocks better opportunities over time.&rdquo;
            </Text>

            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowNotificationModal(true);
              }}
              hitSlop={6}
            >
              <Text style={styles.jarvisFooterLink}>View Insight ➔</Text>
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
          streakCount={userProfile?.streakCount || 1}
          actionText="Continue ➔"
          onDismiss={() => setShowCelebrationModal(false)}
        />

        {/* MODAL: REPUTATION DETAILS */}
        <Modal
          visible={showReputationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowReputationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.modalTitle} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.85}>
                    Creator Passport
                  </Text>
                  <Text style={styles.modalSubtitle}>How your 35% score is calculated:</Text>
                </View>
                <Pressable onPress={() => setShowReputationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 10 }}>
                <View style={styles.repDetailRow}>
                  <Text style={styles.repDetailTitle}>🔥 Consistency Score (20%)</Text>
                  <Text style={styles.repDetailDesc}>Daily posting streak and on-time publishing (max 35%)</Text>
                </View>
                <View style={styles.repDetailRow}>
                  <Text style={styles.repDetailTitle}>⚡ Quest Completion Score (15%)</Text>
                  <Text style={styles.repDetailDesc}>1 of 3 weekly quests completed (max 25%)</Text>
                </View>
                <View style={styles.repDetailRow}>
                  <Text style={styles.repDetailTitle}>🤝 Collaboration Proof (0%)</Text>
                  <Text style={styles.repDetailDesc}>Not started · Match and squad collabs (max 25%)</Text>
                </View>
                <View style={styles.repDetailRow}>
                  <Text style={styles.repDetailTitle}>🛡️ Platform Verification (0%)</Text>
                  <Text style={styles.repDetailDesc}>Connected socials & verified creator metrics (max 15%)</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={handleUnderstoodReputation}>
                <Text style={styles.modalFullBtnText}>I Understood ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: BRAND REQUIREMENTS */}
        <Modal
          visible={showBrandModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBrandModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Brand Campaign Tiers</Text>
                  <Text style={styles.modalSubtitle}>Requirements for paid sponsorships</Text>
                </View>
                <Pressable onPress={() => setShowBrandModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19, marginVertical: 10 }}>
                Brands filter for creators who maintain a minimum 14-day streak and Level 4 Passport status. Complete your daily missions to unlock brand invites!
              </Text>

              <Pressable style={styles.modalFullBtn} onPress={handleUnderstoodBrand}>
                <Text style={styles.modalFullBtnText}>I Understood ✓</Text>
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
                  <Text style={styles.modalTitle}>Quest Notifications</Text>
                  <Text style={styles.modalSubtitle}>Today&apos;s active quest alerts</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Post once before 9 PM</Text>
                  <Text style={styles.notifBody}>Ends tonight • Streak protection ready.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
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
                  <Text style={styles.modalSubtitle}>Creator Squad active messages</Text>
                </View>
                <Pressable onPress={() => setShowChatModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatCard}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#582CDB', marginBottom: 2 }}>🤖 Jarvis Assistant</Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>42 creators are competing in the 7-Day Consistency Challenge!</Text>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowChatModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
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
    paddingHorizontal: sPadding(18),
    paddingTop: 8,
  },

  // TOP PILL BADGES
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  questsPill: {
    backgroundColor: '#784DF0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  questsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  earnRankPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  earnRankPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.4,
  },

  // HEADLINE
  mainHeading: {
    fontSize:
      Platform.OS === 'web'
        ? ('clamp(14px, 3.8vw, 18px)' as any)
        : isNarrowScreen
        ? 14
        : isSmallScreen
        ? 15.5
        : 17,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.45,
    lineHeight: 23,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#5E576E',
    lineHeight: 18,
    marginBottom: 16,
  },

  // 1. TODAY'S QUEST HERO CARD
  todayQuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  todayQuestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayQuestTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E869E',
    letterSpacing: 0.3,
  },
  flameIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayQuestTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  todayQuestSub: {
    fontSize: 13,
    color: '#5E576E',
    lineHeight: 18,
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelLeft: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  progressLabelRight: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.3,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  todayQuestFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  todayQuestRewardsText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#171420',
    flex: 1,
    minWidth: 140,
  },
  startQuestBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 100,
    flexShrink: 0,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  startQuestBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedQuestBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowOpacity: 0,
  },
  completedQuestBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
  },

  // 2. CREATOR STATS BAR & LEVEL
  statsBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  statColValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
  },
  statColDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  levelProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  levelProgressLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.2,
  },
  levelTrack: {
    flex: 1,
    maxWidth: 220,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 3,
  },

  // 3. STARTER QUESTS SECTION
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  starterQuestsList: {
    gap: 10,
    marginBottom: 20,
  },
  starterQuestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  starterQuestLeft: {
    flex: 1,
    paddingRight: 10,
  },
  starterQuestBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  xpPillGold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  typePillDot: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A39CB5',
  },
  typePill: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5E576E',
  },
  starterQuestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  starterQuestActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  starterQuestActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },

  // 4. COMMUNITY CHALLENGE HERO CARD
  communityCard: {
    backgroundColor: '#582CDB',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  communityTopBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  communityTopBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E0E7FF',
    letterSpacing: 0.4,
  },
  communityBody: {
    padding: 20,
  },
  communityTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  communitySub: {
    fontSize: 13,
    color: '#E0E7FF',
    lineHeight: 18,
    marginBottom: 14,
  },
  communityProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  communityProgressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E0E7FF',
    letterSpacing: 0.3,
  },
  communityProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  communityProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  socialProofPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  stackedAvatarsRow: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  socialProofText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  communityFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  challengeRewardBox: {
    flex: 1,
    paddingRight: 6,
    justifyContent: 'center',
  },
  challengeRewardTitle: {
    fontSize: sFont(12),
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  challengeRewardSub: {
    fontSize: sFont(10.5),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  joinChallengeBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    flexShrink: 0,
  },
  joinChallengeGradient: {
    paddingVertical: 8.5,
    paddingHorizontal: 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinChallengeBtnText: {
    fontSize: sFont(12),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // 5. CREATOR REPUTATION CARD
  reputationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  reputationMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  reputationSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
  },
  repRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  repLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  repValueStrong: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  repValueMuted: {
    fontSize: 13,
    color: '#94A3B8',
  },
  repValueDark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  reputationFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 10,
    marginTop: 14,
  },
  repPercentGroup: {
    flexShrink: 1,
  },
  repPercentText: {
    fontSize: sFont(19),
    fontWeight: '800',
    color: '#582CDB',
  },
  repPercentSub: {
    fontSize: sFont(10.5),
    color: '#64748B',
    fontWeight: '600',
  },
  improveRepBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    paddingVertical: 6.5,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexShrink: 0,
  },
  improveRepBtnText: {
    fontSize: sFont(11.5),
    fontWeight: '800',
    color: '#582CDB',
  },

  // CREATOR EARNINGS HUB CARD
  earningsHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 16,
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
    gap: 10,
    marginBottom: 12,
  },
  earningsHubHeaderLeft: {
    flex: 1,
    flexShrink: 1,
  },
  earningsHubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 4,
  },
  earningsHubTitle: {
    fontSize: sFont(15.5),
    fontWeight: '700',
    color: '#171420',
  },
  readinessTag: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    flexShrink: 0,
  },
  readinessTagText: {
    fontSize: sFont(9),
    fontWeight: '700',
    color: '#582CDB',
  },
  earningsHubSub: {
    fontSize: sFont(11.5),
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
    flexShrink: 0,
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

  // 6. BRAND QUEST PREVIEW CARD
  brandQuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  brandQuestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandQuestTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.6,
  },
  stampBadge: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandQuestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 3,
  },
  brandQuestSub: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  requirementsList: {
    gap: 8,
    marginBottom: 16,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  reqText: {
    fontSize: 13,
    color: '#64748B',
  },
  brandQuestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 4,
  },
  unlocksAtLvlText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#DC2626',
    flexShrink: 1,
  },
  viewReqsLink: {
    fontSize: sFont(12),
    fontWeight: '800',
    color: '#582CDB',
    flexShrink: 0,
  },

  // 7. UNLOCK PRO QUESTS CARD
  unlockProCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  unlockProHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  unlockProTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proGoldBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  proGoldBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
  },
  unlockProSubtitle: {
    fontSize: 13,
    color: '#A19BB0',
    lineHeight: 18,
    marginBottom: 16,
  },
  proFeaturesList: {
    gap: 8,
    marginBottom: 20,
  },
  proFeatureItem: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E1EE',
  },
  exploreProBtn: {
    height: 46,
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

  // 8. JARVIS FLOATING INSIGHT FOOTER
  jarvisFooterContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  jarvisFooterFlameWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  jarvisFooterFlame: {
    width: 22,
    height: 22,
  },
  jarvisFooterQuote: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 6,
  },
  jarvisFooterLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.4,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
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
  repDetailRow: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  repDetailTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  repDetailDesc: {
    fontSize: 12,
    color: '#64748B',
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
});
