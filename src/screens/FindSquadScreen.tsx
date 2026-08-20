import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileData, UserProfileModal } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface FindSquadScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenPostComposer?: (title?: string) => void;
  onOpenCreate?: () => void;
  onOpenMatch?: () => void;
  onOpenSquad?: () => void;
  onOpenCollabIdea?: (creator?: any) => void;
  onOpenMessages?: (threadId?: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface SquadItem {
  id: string;
  category: string;
  categoryType: 'growth' | 'education' | 'lifestyle' | 'brand';
  fitScore: number;
  name: string;
  memberCount: number;
  streak: number;
  avatars: any[];
  statusText: string;
  statusType: 'open' | 'request' | 'limited';
  description: string;
  squadGoal: string;
  isSaved?: boolean;
}

const INITIAL_RECOMMENDED_SQUADS: SquadItem[] = [
  {
    id: 'sq_1',
    category: 'GROWTH',
    categoryType: 'growth',
    fitScore: 94,
    name: 'Momentum Makers',
    memberCount: 5,
    streak: 12,
    avatars: [
      require('../../assets/images/elena-avatar.jpg'),
      require('../../assets/images/amara-avatar.jpg'),
      require('../../assets/images/tomi-avatar.jpg'),
    ],
    statusText: 'Open this week',
    statusType: 'open',
    description: 'Daily accountability sprints, split-screen Reel duets, and viral hook breakdown workshops.',
    squadGoal: 'Grow short-form reach & post daily',
  },
  {
    id: 'sq_2',
    category: 'EDUCATION',
    categoryType: 'education',
    fitScore: 89,
    name: 'Creator Systems Club',
    memberCount: 8,
    streak: 21,
    avatars: [
      require('../../assets/images/david-avatar.jpg'),
      require('../../assets/images/marcus-avatar.jpg'),
      require('../../assets/images/kemi-avatar.jpg'),
    ],
    statusText: 'Request required',
    statusType: 'request',
    description: 'High-leverage batch scripting workflows, voice studios, and YouTube Shorts pacing analysis.',
    squadGoal: 'Systematize weekly content batches',
  },
  {
    id: 'sq_3',
    category: 'LIFESTYLE',
    categoryType: 'lifestyle',
    fitScore: 86,
    name: 'Lifestyle Builders',
    memberCount: 6,
    streak: 9,
    avatars: [
      require('../../assets/images/amara-avatar.jpg'),
      require('../../assets/images/elena-avatar.jpg'),
      require('../../assets/images/zainab-avatar.jpg'),
    ],
    statusText: 'Open Now',
    statusType: 'open',
    description: 'Aesthetic B-roll exchanges, Lagos creator meetups, and cross-platform storytelling format experiments.',
    squadGoal: 'Weekly collaborative challenges',
  },
  {
    id: 'sq_4',
    category: 'BRAND-READY',
    categoryType: 'brand',
    fitScore: 82,
    name: 'UGC Starter Circle',
    memberCount: 10,
    streak: 15,
    avatars: [
      require('../../assets/images/kemi-avatar.jpg'),
      require('../../assets/images/tomi-avatar.jpg'),
      require('../../assets/images/david-avatar.jpg'),
    ],
    statusText: 'Limited spots',
    statusType: 'limited',
    description: 'Brand deal pitch feedback, media kit rate audits, and sponsor video blueprint reviews.',
    squadGoal: 'Land first 3 paid brand partnerships',
  },
  {
    id: 'sq_5',
    category: 'GROWTH',
    categoryType: 'growth',
    fitScore: 80,
    name: 'Peak Systems',
    memberCount: 4,
    streak: 33,
    avatars: [
      require('../../assets/images/marcus-avatar.jpg'),
      require('../../assets/images/elena-avatar.jpg'),
      require('../../assets/images/amara-avatar.jpg'),
    ],
    statusText: 'Open this week',
    statusType: 'open',
    description: 'Hyper-focused 14-day posting gauntlets with live analytics check-ins.',
    squadGoal: 'Unlock 100k views milestone',
  },
];

export const FindSquadScreen: React.FC<FindSquadScreenProps> = ({
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenPostComposer,
  onOpenCreate,
  onOpenMatch,
  onOpenSquad,
  onOpenCollabIdea,
  onOpenMessages,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<SquadItem>(INITIAL_RECOMMENDED_SQUADS[0]);
  const [previewModalSquad, setPreviewModalSquad] = useState<SquadItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter States
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('growth');
  const [activeGoals, setActiveGoals] = useState<string[]>(['Grow short-form']);
  const [selectedStreakLevel, setSelectedStreakLevel] = useState<string>('similar');
  const [proFilterOnly, setProFilterOnly] = useState<boolean>(true);
  const [aiRecommendedOnly, setAiRecommendedOnly] = useState<boolean>(true);

  // Saved Squads list
  const [savedSquadNames, setSavedSquadNames] = useState<string[]>([
    'Peak Systems',
    'The Elite Hub',
    'Content Masters',
  ]);

  // Celebration pop-up state
  const [celebrationState, setCelebrationState] = useState<{
    visible: boolean;
    title: string;
    description: string;
    xpAmount: number;
    actionLabel?: string;
    onAction?: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    xpAmount: 0,
  });

  // Mascot float animation
  const flameFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -5,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleToggleGoal = (goal: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (activeGoals.includes(goal)) {
      setActiveGoals(activeGoals.filter((g) => g !== goal));
    } else {
      setActiveGoals([...activeGoals, goal]);
    }
  };

  const handleRequestToJoin = (squad: SquadItem) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPreviewModalSquad(null);
    setCelebrationState({
      visible: true,
      title: 'Squad Application Dispatched!',
      description: `Your profile, 47-day streak proof, and creator portfolio were sent to the hosts of ${squad.name}.`,
      xpAmount: 100,
      actionLabel: 'Enter Squad Room ➔',
      onAction: () => {
        setCelebrationState((prev) => ({ ...prev, visible: false }));
        if (onOpenSquad) onOpenSquad();
      },
    });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  // Filtered Squads
  const filteredSquads = INITIAL_RECOMMENDED_SQUADS.filter((sq) => {
    if (selectedNiche !== 'all') {
      if (selectedNiche === 'growth' && sq.categoryType !== 'growth') return false;
      if (selectedNiche === 'education' && sq.categoryType !== 'education') return false;
      if (selectedNiche === 'lifestyle' && sq.categoryType !== 'lifestyle') return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* BACKGROUND GRADIENTS */}
      <LinearGradient
        colors={['#FAF8F5', '#F5F2EB', '#FAF8F5']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgGlowPurple} pointerEvents="none" />
      <View style={styles.bgGlowGold} pointerEvents="none" />

      {/* TOP APP HEADER */}
      <View style={styles.topHeaderBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtnCircle, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Text style={styles.backBtnArrow}>‹</Text>
          </Pressable>

          <Pressable
            onPress={onOpenJarvisPro}
            style={styles.headerMascotTouch}
            hitSlop={6}
          >
            <Animated.View style={{ transform: [{ translateY: flameFloatY }] }}>
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostMascot}
                resizeMode="contain"
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Right Header Actions */}
        <View style={styles.headerRightGroup}>
          <Pressable
            style={({ pressed }) => [styles.headerIconCircle, pressed && styles.btnPressed]}
            onPress={() => onOpenMessages && onOpenMessages()}
            hitSlop={6}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                stroke="#171420"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={styles.activeMsgDot} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.headerIconCircle, pressed && styles.btnPressed]}
            onPress={() => showToast('🔔 1 notification: Momentum Makers opened a new collab slot!')}
            hitSlop={6}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke="#171420"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>1</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.headerProfileBtn}
            onPress={() => setShowProfileModal(true)}
            hitSlop={6}
          >
            <Image
              source={require('../../assets/images/elena-avatar.jpg')}
              style={styles.headerProfileAvatar}
            />
            <View style={styles.headerProfileGoldRing} />
          </Pressable>
        </View>
      </View>

      {/* MAIN SCROLL VIEW */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* 1. HERO TITLE & DISCOVERY BADGE                              */}
        {/* ============================================================ */}
        <View style={styles.heroSection}>
          <View style={styles.discoveryPill}>
            <Text style={styles.discoveryPillText}>SQUAD DISCOVERY</Text>
          </View>

          <Text style={styles.heroTitle}>Find creators to build with.</Text>
          <Text style={styles.heroSubtitle}>
            Discover squads based on niche, streak level, activity and shared creator goals. Level up together.
          </Text>

          {/* Quick Filter Badges */}
          <View style={styles.topFilterPillsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.proSquadPill,
                proFilterOnly && styles.proSquadPillActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setProFilterOnly(!proFilterOnly)}
            >
              <Text style={styles.proSquadPillText}>👑 Pro Squads</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.aiRecPill,
                aiRecommendedOnly && styles.aiRecPillActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setAiRecommendedOnly(!aiRecommendedOnly)}
            >
              <Text style={styles.aiRecPillText}>✨ AI Recommended</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 2. RECOMMENDED FOR YOU METRIC CARD                           */}
        {/* ============================================================ */}
        <View style={styles.recommendedMetricsCard}>
          <Text style={styles.recommendedCardTitle}>RECOMMENDED FOR YOU</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNumberPurple}>12</Text>
              <Text style={styles.metricLabel}>MATCH GOALS</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricNumberPurple}>4</Text>
              <Text style={styles.metricLabel}>HIGH-FIT</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricNumberPurple}>3</Text>
              <Text style={styles.metricLabel}>OPEN THIS WEEK</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricNumberPurple}>2</Text>
              <Text style={styles.metricLabel}>SIMILAR STREAK</Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. NICHE CATEGORY HORIZONTAL FILTER PILLS                    */}
        {/* ============================================================ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nicheFilterScroll}
        >
          {[
            { id: 'all', label: 'Creator Education' },
            { id: 'growth', label: 'Growth' },
            { id: 'lifestyle', label: 'Lifestyle' },
            { id: 'tech', label: 'Tech' },
            { id: 'ugc', label: 'Brand & UGC' },
          ].map((item) => {
            const isSelected = selectedNiche === item.id;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.nicheFilterPill,
                  isSelected && styles.nicheFilterPillActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedNiche(item.id);
                }}
              >
                <Text
                  style={[
                    styles.nicheFilterPillText,
                    isSelected && styles.nicheFilterPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ============================================================ */}
        {/* 4. SQUAD TYPES DUAL CARDS (GROWTH / COLLAB)                  */}
        {/* ============================================================ */}
        <View style={styles.squadTypesRow}>
          <Pressable
            style={({ pressed }) => [
              styles.squadTypeCard,
              styles.growthTypeCard,
              selectedTypeFilter === 'growth' && styles.typeCardSelectedGrowth,
              pressed && styles.btnPressed,
            ]}
            onPress={() => setSelectedTypeFilter('growth')}
          >
            <Text style={{ fontSize: 20, marginBottom: 12 }}>📈</Text>
            <Text style={styles.growthTypeCardTitle}>Growth Squads</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.squadTypeCard,
              styles.collabTypeCard,
              selectedTypeFilter === 'collab' && styles.typeCardSelectedCollab,
              pressed && styles.btnPressed,
            ]}
            onPress={() => setSelectedTypeFilter('collab')}
          >
            <Text style={{ fontSize: 20, marginBottom: 12 }}>💎</Text>
            <Text style={styles.collabTypeCardTitle}>Collab Squads</Text>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* 5. SQUAD GOALS SECTION                                       */}
        {/* ============================================================ */}
        <View style={{ marginTop: 22 }}>
          <Text style={styles.sectionHeading}>Squad Goals</Text>

          <View style={styles.goalsWrapRow}>
            <Pressable
              style={({ pressed }) => [
                styles.goalPill,
                activeGoals.includes('Post consistently') && styles.goalPillActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => handleToggleGoal('Post consistently')}
            >
              <Text
                style={[
                  styles.goalPillText,
                  activeGoals.includes('Post consistently') && styles.goalPillTextActive,
                ]}
              >
                Post consistently
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.goalPill,
                activeGoals.includes('Weekly collabs') && styles.goalPillActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => handleToggleGoal('Weekly collabs')}
            >
              <Text
                style={[
                  styles.goalPillText,
                  activeGoals.includes('Weekly collabs') && styles.goalPillTextActive,
                ]}
              >
                Weekly collabs
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.goalPill,
                activeGoals.includes('Grow short-form') && styles.goalPillActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => handleToggleGoal('Grow short-form')}
            >
              <Text
                style={[
                  styles.goalPillText,
                  activeGoals.includes('Grow short-form') && styles.goalPillTextActive,
                ]}
              >
                Grow short-form {activeGoals.includes('Grow short-form') ? '✕' : ''}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 6. STREAK LEVEL FILTER SECTION                               */}
        {/* ============================================================ */}
        <View style={{ marginTop: 22 }}>
          <View style={styles.streakHeaderRow}>
            <Text style={styles.sectionHeading}>Streak Level</Text>
            <View style={styles.userStreakBadge}>
              <Text style={styles.userStreakBadgeText}>Your streak: 47 days</Text>
            </View>
          </View>

          <View style={styles.streakGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.streakOptionBtn,
                selectedStreakLevel === 'any' && styles.streakOptionBtnActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setSelectedStreakLevel('any')}
            >
              <Text
                style={[
                  styles.streakOptionText,
                  selectedStreakLevel === 'any' && styles.streakOptionTextActive,
                ]}
              >
                Any Squad
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.streakOptionBtn,
                selectedStreakLevel === 'similar' && styles.streakOptionBtnActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setSelectedStreakLevel('similar')}
            >
              <Text
                style={[
                  styles.streakOptionText,
                  selectedStreakLevel === 'similar' && styles.streakOptionTextActive,
                ]}
              >
                Similar streak 🗹
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.streakOptionBtn,
                selectedStreakLevel === 'strong' && styles.streakOptionBtnActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setSelectedStreakLevel('strong')}
            >
              <Text
                style={[
                  styles.streakOptionText,
                  selectedStreakLevel === 'strong' && styles.streakOptionTextActive,
                ]}
              >
                Strong Streak
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.streakOptionBtn,
                selectedStreakLevel === 'elite' && styles.streakOptionBtnActive,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setSelectedStreakLevel('elite')}
            >
              <Text
                style={[
                  styles.streakOptionText,
                  selectedStreakLevel === 'elite' && styles.streakOptionTextActive,
                ]}
              >
                Elite Streak
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 7. RECOMMENDED SQUADS LIST                                   */}
        {/* ============================================================ */}
        <View style={{ marginTop: 26 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Recommended Squads</Text>
            <Pressable
              onPress={() => showToast('Showing all 14 active creator squads')}
              hitSlop={8}
            >
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </Pressable>
          </View>

          <View style={{ gap: 12, marginTop: 12 }}>
            {filteredSquads.map((squad) => {
              const isSelected = selectedSquad.id === squad.id;

              return (
                <Pressable
                  key={squad.id}
                  style={({ pressed }) => [
                    styles.squadCard,
                    isSelected && styles.squadCardSelected,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedSquad(squad);
                    setPreviewModalSquad(squad);
                  }}
                >
                  {/* Category Pill & Fit Score */}
                  <View style={styles.squadCardTopRow}>
                    <View
                      style={[
                        styles.squadCatPill,
                        squad.categoryType === 'growth' && styles.squadCatGrowth,
                        squad.categoryType === 'education' && styles.squadCatEdu,
                        squad.categoryType === 'lifestyle' && styles.squadCatLife,
                        squad.categoryType === 'brand' && styles.squadCatBrand,
                      ]}
                    >
                      <Text
                        style={[
                          styles.squadCatText,
                          squad.categoryType === 'growth' && styles.squadCatTextGrowth,
                          squad.categoryType === 'education' && styles.squadCatTextEdu,
                          squad.categoryType === 'lifestyle' && styles.squadCatTextLife,
                          squad.categoryType === 'brand' && styles.squadCatTextBrand,
                        ]}
                      >
                        {squad.category}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.fitScoreNumber}>{squad.fitScore}%</Text>
                      <Text style={styles.fitScoreLabel}>FIT SCORE</Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.squadName}>{squad.name}</Text>

                  {/* Members & Streak info */}
                  <View style={styles.squadMetaRow}>
                    <View>
                      <Text style={styles.metaMembersText}>{squad.memberCount} Members</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Text style={{ fontSize: 11 }}>⚡</Text>
                        <Text style={styles.metaStreakText}>{squad.streak}-day streak</Text>
                      </View>
                    </View>

                    {/* Avatar Stack */}
                    <View style={styles.avatarStackRow}>
                      {squad.avatars.map((av, i) => (
                        <Image
                          key={i}
                          source={av}
                          style={[
                            styles.stackAvatarImg,
                            { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i },
                          ]}
                        />
                      ))}
                      <View style={[styles.stackAvatarPlus, { marginLeft: -8, zIndex: 0 }]}>
                        <Text style={styles.stackAvatarPlusText}>+2</Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Footer */}
                  <View style={styles.squadStatusFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {squad.statusType === 'open' ? (
                        <View style={styles.statusDotGreen} />
                      ) : squad.statusType === 'limited' ? (
                        <View style={styles.statusDotRed} />
                      ) : (
                        <Text style={{ fontSize: 11 }}>🔒</Text>
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          squad.statusType === 'open' && styles.statusTextOpen,
                          squad.statusType === 'limited' && styles.statusTextLimited,
                        ]}
                      >
                        {squad.statusText}
                      </Text>
                    </View>

                    <Text style={styles.cardArrow}>➔</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ============================================================ */}
        {/* 8. SAVED SQUADS (3) HORIZONTAL PILLS                         */}
        {/* ============================================================ */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.savedSquadsHeading}>SAVED SQUADS ({savedSquadNames.length})</Text>

          <View style={styles.savedSquadsRow}>
            {savedSquadNames.map((name, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.savedSquadPill, pressed && styles.btnPressed]}
                onPress={() => showToast(`Opening saved squad: ${name}`)}
              >
                <Text style={styles.savedSquadPillText}>{name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* 9. JARVIS CORE AI STRATEGIC RECOMMENDATION CARD             */}
        {/* ============================================================ */}
        <View style={styles.jarvisRecCard}>
          <View style={styles.jarvisRecHeaderRow}>
            <View style={styles.jarvisIconBox}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisFlameImg}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jarvisRecTag}>JARVIS CORE AI</Text>
              <Text style={styles.jarvisRecTitle}>Strategic Recommendation</Text>
            </View>
          </View>

          <Text style={styles.jarvisRecBodyText}>
            <Text style={{ fontWeight: '800', color: '#582CDB' }}>Momentum Makers</Text> is your strongest squad fit based on your streak level, niche and weekly collaboration goals.
          </Text>

          <View style={styles.jarvisRecActionsRow}>
            <Pressable
              style={({ pressed }) => [styles.jarvisOutlineBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenSquad) onOpenSquad();
              }}
            >
              <Text style={styles.jarvisOutlineBtnText}>View Squad</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.jarvisJoinBtn, pressed && styles.btnPressed]}
              onPress={() => handleRequestToJoin(selectedSquad)}
            >
              <Text style={styles.jarvisJoinBtnText}>Request to Join</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 10. PRIMARY STICKY CTA BUTTON                                */}
        {/* ============================================================ */}
        <View style={{ marginTop: 24, marginBottom: 120 }}>
          <Pressable
            style={({ pressed }) => [styles.primaryCtaBtn, pressed && styles.btnPressed]}
            onPress={() => handleRequestToJoin(selectedSquad)}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryCtaGradient}
            >
              <Text style={styles.primaryCtaBtnText}>Request to Join</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {/* SQUAD PREVIEW MODAL */}
      <Modal
        visible={previewModalSquad !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewModalSquad(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPreviewModalSquad(null)} />
          {previewModalSquad && (
            <View style={styles.modalContentCard}>
              <View style={styles.modalDragHandle} />

              <View style={styles.squadCardTopRow}>
                <View style={[styles.squadCatPill, styles.squadCatGrowth]}>
                  <Text style={[styles.squadCatText, styles.squadCatTextGrowth]}>
                    {previewModalSquad.category}
                  </Text>
                </View>
                <Text style={styles.fitScoreNumber}>{previewModalSquad.fitScore}% FIT</Text>
              </View>

              <Text style={styles.modalSquadTitle}>{previewModalSquad.name}</Text>
              <Text style={styles.modalSquadDesc}>{previewModalSquad.description}</Text>

              <View style={styles.modalInfoBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.modalInfoLabel}>Squad Goal</Text>
                  <Text style={styles.modalInfoVal}>{previewModalSquad.squadGoal}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.modalInfoLabel}>Streak Level</Text>
                  <Text style={styles.modalInfoVal}>⚡ {previewModalSquad.streak} Days</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Pressable
                  style={styles.modalOutlineBtn}
                  onPress={() => {
                    setPreviewModalSquad(null);
                    if (onOpenSquad) onOpenSquad();
                  }}
                >
                  <Text style={styles.modalOutlineBtnText}>Open Squad Room</Text>
                </Pressable>

                <Pressable
                  style={styles.modalSolidBtn}
                  onPress={() => handleRequestToJoin(previewModalSquad)}
                >
                  <Text style={styles.modalSolidBtnText}>Apply Now 🚀</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onLogout={onLogout}
        initialProfile={userProfile}
        onSaveProfile={(updated) => {
          if (onSaveProfile) onSaveProfile(updated);
        }}
      />

      {/* ANIMATED CELEBRATION MODAL */}
      <AnimatedCompletionModal
        visible={celebrationState.visible}
        title={celebrationState.title}
        subtitle={celebrationState.description}
        xpEarned={celebrationState.xpAmount}
        actionText={celebrationState.actionLabel}
        onAction={celebrationState.onAction}
        onDismiss={() => setCelebrationState((prev) => ({ ...prev, visible: false }))}
      />

      {/* FLOATING TAB BAR */}
      <FloatingTabBar
        activeTab={activeTab}
        onTabPress={handleTabChange}
      />

      {/* TOAST */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  bgGlowPurple: {
    position: 'absolute',
    top: 60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(147, 51, 234, 0.05)',
  },
  bgGlowGold: {
    position: 'absolute',
    top: 300,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },

  /* HEADER */
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
    backgroundColor: '#FAF8F5',
  },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171420',
    marginTop: -2,
  },
  headerMascotTouch: {
    padding: 2,
  },
  headerGhostMascot: {
    width: 32,
    height: 32,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeMsgDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  notifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerProfileBtn: {
    position: 'relative',
  },
  headerProfileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerProfileGoldRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },

  /* SCROLL */
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* HERO SECTION */
  heroSection: {
    marginBottom: 16,
  },
  discoveryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#582CDB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  discoveryPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 14,
  },
  topFilterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  proSquadPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  proSquadPillActive: {
    backgroundColor: '#FDE68A',
    borderColor: '#F59E0B',
  },
  proSquadPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  aiRecPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  aiRecPillActive: {
    backgroundColor: '#FED7AA',
    borderColor: '#FB923C',
  },
  aiRecPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#C2410C',
  },

  /* RECOMMENDED METRICS */
  recommendedMetricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  recommendedCardTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    width: '46%',
  },
  metricNumberPurple: {
    fontSize: 26,
    fontWeight: '900',
    color: '#582CDB',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },

  /* NICHE FILTER */
  nicheFilterScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  nicheFilterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#582CDB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  nicheFilterPillActive: {
    backgroundColor: '#582CDB',
  },
  nicheFilterPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  nicheFilterPillTextActive: {
    color: '#FFFFFF',
  },

  /* SQUAD TYPES ROW */
  squadTypesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  squadTypeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  growthTypeCard: {
    backgroundColor: '#FDE68A',
    borderColor: '#FCD34D',
  },
  typeCardSelectedGrowth: {
    borderWidth: 2,
    borderColor: '#D97706',
  },
  growthTypeCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#78350F',
  },
  collabTypeCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFECE6',
  },
  typeCardSelectedCollab: {
    borderColor: '#582CDB',
    borderWidth: 1.5,
  },
  collabTypeCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#171420',
  },

  /* SQUAD GOALS */
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
  },
  goalsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#582CDB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  goalPillActive: {
    backgroundColor: '#582CDB',
  },
  goalPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  goalPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* STREAK LEVEL */
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userStreakBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  userStreakBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  streakGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  streakOptionBtn: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  streakOptionBtnActive: {
    borderColor: '#582CDB',
    borderWidth: 1.5,
    backgroundColor: '#F5F3FF',
  },
  streakOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  streakOptionTextActive: {
    color: '#582CDB',
  },

  /* RECOMMENDED SQUADS LIST */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  squadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  squadCardSelected: {
    borderColor: '#582CDB',
    borderWidth: 1.5,
  },
  squadCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  squadCatPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  squadCatGrowth: {
    backgroundColor: '#FEF3C7',
  },
  squadCatEdu: {
    backgroundColor: '#EDE9FE',
  },
  squadCatLife: {
    backgroundColor: '#F1F5F9',
  },
  squadCatBrand: {
    backgroundColor: '#FEE2E2',
  },
  squadCatText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  squadCatTextGrowth: {
    color: '#B45309',
  },
  squadCatTextEdu: {
    color: '#6D28D9',
  },
  squadCatTextLife: {
    color: '#475569',
  },
  squadCatTextBrand: {
    color: '#B91C1C',
  },
  fitScoreNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#582CDB',
  },
  fitScoreLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  squadName: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
  },
  squadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaMembersText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  metaStreakText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatarImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  stackAvatarPlus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarPlusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  squadStatusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statusTextOpen: {
    color: '#059669',
  },
  statusTextLimited: {
    color: '#DC2626',
  },
  cardArrow: {
    fontSize: 13,
    color: '#582CDB',
    fontWeight: '900',
  },

  /* SAVED SQUADS */
  savedSquadsHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  savedSquadsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  savedSquadPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  savedSquadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },

  /* JARVIS REC CARD */
  jarvisRecCard: {
    marginTop: 22,
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  jarvisRecHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  jarvisIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#582CDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarvisFlameImg: {
    width: 22,
    height: 22,
  },
  jarvisRecTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#7E22CE',
    letterSpacing: 0.6,
  },
  jarvisRecTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  jarvisRecBodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 14,
  },
  jarvisRecActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  jarvisOutlineBtn: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  jarvisOutlineBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  jarvisJoinBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  jarvisJoinBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* PRIMARY CTA */
  primaryCtaBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryCtaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* SQUAD PREVIEW MODAL */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalSquadTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 6,
  },
  modalSquadDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInfoBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  modalInfoLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  modalInfoVal: {
    fontSize: 11.5,
    color: '#171420',
    fontWeight: '800',
  },
  modalOutlineBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalOutlineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  modalSolidBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSolidBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* TOAST */
  toastContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
