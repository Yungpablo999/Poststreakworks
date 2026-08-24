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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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

export interface SquadMember {
  id: string;
  name: string;
  avatar: any;
  role: string;
  isHost?: boolean;
  streak: number;
  niche: string;
  threadId?: string;
}

export interface SquadItem {
  id: string;
  category: string;
  categoryType: 'growth' | 'education' | 'lifestyle' | 'brand';
  fitScore: number;
  name: string;
  hostName: string;
  hostAvatar: any;
  memberCount: number;
  maxMembers: number;
  streak: number;
  avatars: any[];
  statusText: string;
  statusType: 'open' | 'request' | 'limited';
  description: string;
  squadGoal: string;
  weeklyQuest: string;
  xpReward: number;
  requirements: string;
  members: SquadMember[];
}

const ALL_SQUADS: SquadItem[] = [
  {
    id: 'sq_1',
    category: 'GROWTH SQUAD',
    categoryType: 'growth',
    fitScore: 94,
    name: 'Momentum Makers',
    hostName: 'Elena Rostova',
    hostAvatar: require('../../assets/images/elena-avatar.jpg'),
    memberCount: 5,
    maxMembers: 8,
    streak: 12,
    avatars: [
      require('../../assets/images/elena-avatar.jpg'),
      require('../../assets/images/amara-avatar.jpg'),
      require('../../assets/images/tomi-avatar.jpg'),
    ],
    statusText: '2 spots open • Instant entry',
    statusType: 'open',
    description: 'Daily accountability sprints, split-screen Reel duets, and viral hook breakdown workshops.',
    squadGoal: 'Grow short-form reach & post daily',
    weeklyQuest: '3 Duo Reel Collaborations & 14-Day Streak',
    xpReward: 250,
    requirements: 'Post at least 5x/week • 7+ Day Streak',
    members: [
      { id: 'm1', name: 'Elena Rostova', avatar: require('../../assets/images/elena-avatar.jpg'), role: 'Host & Lead', isHost: true, streak: 47, niche: 'Tech & Product', threadId: 'conv_elena' },
      { id: 'm2', name: 'Amara Okafor', avatar: require('../../assets/images/amara-avatar.jpg'), role: 'Member', streak: 31, niche: 'Visual Storytelling', threadId: 'conv_amara' },
      { id: 'm3', name: 'Tomi Adebayo', avatar: require('../../assets/images/tomi-avatar.jpg'), role: 'Member', streak: 22, niche: 'Growth & Short-Form', threadId: 'conv_tomi' },
      { id: 'm4', name: 'David Kim', avatar: require('../../assets/images/david-avatar.jpg'), role: 'Member', streak: 19, niche: 'Systems & Code', threadId: 'conv_david' },
      { id: 'm5', name: 'Kemi Adeleke', avatar: require('../../assets/images/kemi-avatar.jpg'), role: 'Member', streak: 15, niche: 'Brand & UGC', threadId: 'conv_kemi' },
    ],
  },
  {
    id: 'sq_2',
    category: 'EDUCATION SQUAD',
    categoryType: 'education',
    fitScore: 89,
    name: 'Creator Systems Club',
    hostName: 'David Kim',
    hostAvatar: require('../../assets/images/david-avatar.jpg'),
    memberCount: 6,
    maxMembers: 8,
    streak: 21,
    avatars: [
      require('../../assets/images/david-avatar.jpg'),
      require('../../assets/images/marcus-avatar.jpg'),
      require('../../assets/images/kemi-avatar.jpg'),
    ],
    statusText: 'Review required (< 2h response)',
    statusType: 'request',
    description: 'High-leverage batch scripting workflows, voice studios, and YouTube Shorts pacing analysis.',
    squadGoal: 'Systematize weekly content batches',
    weeklyQuest: 'Batch 5 Script Drafts in Jarvis Voice Studio',
    xpReward: 300,
    requirements: 'Share weekly script drafts • 14+ Day Streak',
    members: [
      { id: 'm1', name: 'David Kim', avatar: require('../../assets/images/david-avatar.jpg'), role: 'Host & Lead', isHost: true, streak: 38, niche: 'Systems & Code', threadId: 'conv_david' },
      { id: 'm2', name: 'Marcus Vance', avatar: require('../../assets/images/marcus-avatar.jpg'), role: 'Member', streak: 33, niche: 'Analytics & Scaling', threadId: 'conv_marcus' },
      { id: 'm3', name: 'Kemi Adeleke', avatar: require('../../assets/images/kemi-avatar.jpg'), role: 'Member', streak: 24, niche: 'Creator Economy', threadId: 'conv_kemi' },
      { id: 'm4', name: 'Elena Rostova', avatar: require('../../assets/images/elena-avatar.jpg'), role: 'Member', streak: 47, niche: 'Design Systems', threadId: 'conv_elena' },
      { id: 'm5', name: 'Tomi Adebayo', avatar: require('../../assets/images/tomi-avatar.jpg'), role: 'Member', streak: 18, niche: 'Production', threadId: 'conv_tomi' },
      { id: 'm6', name: 'Amara Okafor', avatar: require('../../assets/images/amara-avatar.jpg'), role: 'Member', streak: 14, niche: 'Audio & Voice', threadId: 'conv_amara' },
    ],
  },
  {
    id: 'sq_3',
    category: 'LIFESTYLE SQUAD',
    categoryType: 'lifestyle',
    fitScore: 86,
    name: 'Lifestyle Builders',
    hostName: 'Amara Okafor',
    hostAvatar: require('../../assets/images/amara-avatar.jpg'),
    memberCount: 4,
    maxMembers: 6,
    streak: 9,
    avatars: [
      require('../../assets/images/amara-avatar.jpg'),
      require('../../assets/images/elena-avatar.jpg'),
      require('../../assets/images/zainab-avatar.jpg'),
    ],
    statusText: 'Open now • 2 spots left',
    statusType: 'open',
    description: 'Aesthetic B-roll exchanges, Lagos creator meetups, and cross-platform storytelling format experiments.',
    squadGoal: 'Weekly collaborative challenges',
    weeklyQuest: '4 Cross-Platform Story Posts & B-Roll Swap',
    xpReward: 200,
    requirements: 'Lifestyle/Visual creators • 5+ Day Streak',
    members: [
      { id: 'm1', name: 'Amara Okafor', avatar: require('../../assets/images/amara-avatar.jpg'), role: 'Host & Lead', isHost: true, streak: 31, niche: 'Lifestyle & Vlogs', threadId: 'conv_amara' },
      { id: 'm2', name: 'Elena Rostova', avatar: require('../../assets/images/elena-avatar.jpg'), role: 'Member', streak: 47, niche: 'Aesthetic B-Roll', threadId: 'conv_elena' },
      { id: 'm3', name: 'Zainab Balogun', avatar: require('../../assets/images/zainab-avatar.jpg'), role: 'Member', streak: 16, niche: 'Fashion & Culture', threadId: 'conv_zainab' },
      { id: 'm4', name: 'Kemi Adeleke', avatar: require('../../assets/images/kemi-avatar.jpg'), role: 'Member', streak: 12, niche: 'Short Stories', threadId: 'conv_kemi' },
    ],
  },
  {
    id: 'sq_4',
    category: 'BRAND & UGC',
    categoryType: 'brand',
    fitScore: 82,
    name: 'UGC Starter Circle',
    hostName: 'Kemi Adeleke',
    hostAvatar: require('../../assets/images/kemi-avatar.jpg'),
    memberCount: 5,
    maxMembers: 8,
    streak: 15,
    avatars: [
      require('../../assets/images/kemi-avatar.jpg'),
      require('../../assets/images/tomi-avatar.jpg'),
      require('../../assets/images/david-avatar.jpg'),
    ],
    statusText: '3 spots remaining • Fast filling',
    statusType: 'limited',
    description: 'Brand deal pitch feedback, media kit rate audits, and sponsor video blueprint reviews.',
    squadGoal: 'Land first 3 paid brand partnerships',
    weeklyQuest: 'Pitch 5 Verified Brands with UGC Blueprints',
    xpReward: 350,
    requirements: 'Active UGC portfolio • Media kit ready',
    members: [
      { id: 'm1', name: 'Kemi Adeleke', avatar: require('../../assets/images/kemi-avatar.jpg'), role: 'Host & Lead', isHost: true, streak: 28, niche: 'UGC & Brands', threadId: 'conv_kemi' },
      { id: 'm2', name: 'Tomi Adebayo', avatar: require('../../assets/images/tomi-avatar.jpg'), role: 'Member', streak: 22, niche: 'Tech Sponsorships', threadId: 'conv_tomi' },
      { id: 'm3', name: 'David Kim', avatar: require('../../assets/images/david-avatar.jpg'), role: 'Member', streak: 19, niche: 'SaaS Affiliates', threadId: 'conv_david' },
      { id: 'm4', name: 'Elena Rostova', avatar: require('../../assets/images/elena-avatar.jpg'), role: 'Member', streak: 47, niche: 'Design Retainers', threadId: 'conv_elena' },
      { id: 'm5', name: 'Marcus Vance', avatar: require('../../assets/images/marcus-avatar.jpg'), role: 'Member', streak: 15, niche: 'Paid Ads Creator', threadId: 'conv_marcus' },
    ],
  },
  {
    id: 'sq_5',
    category: 'GROWTH SQUAD',
    categoryType: 'growth',
    fitScore: 80,
    name: 'Peak Systems Gauntlet',
    hostName: 'Marcus Vance',
    hostAvatar: require('../../assets/images/marcus-avatar.jpg'),
    memberCount: 3,
    maxMembers: 5,
    streak: 33,
    avatars: [
      require('../../assets/images/marcus-avatar.jpg'),
      require('../../assets/images/elena-avatar.jpg'),
      require('../../assets/images/amara-avatar.jpg'),
    ],
    statusText: 'Elite squad • Open this week',
    statusType: 'open',
    description: 'Hyper-focused 14-day posting gauntlets with live analytics check-ins and script sprints.',
    squadGoal: 'Unlock 100k views milestone',
    weeklyQuest: 'Complete 14 Consecutive Day Posting Gauntlet',
    xpReward: 400,
    requirements: '20+ Day Streak required to apply',
    members: [
      { id: 'm1', name: 'Marcus Vance', avatar: require('../../assets/images/marcus-avatar.jpg'), role: 'Host & Lead', isHost: true, streak: 55, niche: 'High-Volume Pacing', threadId: 'conv_marcus' },
      { id: 'm2', name: 'Elena Rostova', avatar: require('../../assets/images/elena-avatar.jpg'), role: 'Member', streak: 47, niche: 'Hooks & Audio', threadId: 'conv_elena' },
      { id: 'm3', name: 'Amara Okafor', avatar: require('../../assets/images/amara-avatar.jpg'), role: 'Member', streak: 31, niche: 'Story Reels', threadId: 'conv_amara' },
    ],
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'for_you' | 'top_streaks' | 'collabs' | 'pro'>('for_you');
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [selectedSquad, setSelectedSquad] = useState<SquadItem>(ALL_SQUADS[0]);
  const [previewModalSquad, setPreviewModalSquad] = useState<SquadItem | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'members'>('details');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appliedSquadIds, setAppliedSquadIds] = useState<string[]>([]);

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
          toValue: -4,
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

  const handleRequestToJoin = (squad: SquadItem) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (!appliedSquadIds.includes(squad.id)) {
      setAppliedSquadIds((prev) => [...prev, squad.id]);
    }
    setPreviewModalSquad(null);
    setCelebrationState({
      visible: true,
      title: 'Application Submitted!',
      description: `Your verified creator profile and 47-day streak record were sent to the hosts of ${squad.name}. Applications are reviewed within 2 hours. You\'ll get a notification once accepted!`,
      xpAmount: 50,
      actionLabel: 'Explore More Squads 👍',
      onAction: () => {
        setCelebrationState((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  // Filter Squads based on Search and Tabs
  const filteredSquads = ALL_SQUADS.filter((sq) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = sq.name.toLowerCase().includes(q);
      const matchGoal = sq.squadGoal.toLowerCase().includes(q);
      const matchCat = sq.category.toLowerCase().includes(q);
      if (!matchName && !matchGoal && !matchCat) return false;
    }

    if (selectedNiche !== 'all') {
      if (selectedNiche === 'growth' && sq.categoryType !== 'growth') return false;
      if (selectedNiche === 'education' && sq.categoryType !== 'education') return false;
      if (selectedNiche === 'lifestyle' && sq.categoryType !== 'lifestyle') return false;
      if (selectedNiche === 'ugc' && sq.categoryType !== 'brand') return false;
    }

    if (selectedCategoryTab === 'top_streaks') {
      return sq.streak >= 15;
    }
    if (selectedCategoryTab === 'collabs') {
      return sq.categoryType === 'lifestyle' || sq.categoryType === 'growth';
    }
    if (selectedCategoryTab === 'pro') {
      return sq.fitScore >= 85;
    }

    return true;
  });

  const featuredSquad = ALL_SQUADS[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* LUXURY BACKGROUND */}
      <LinearGradient
        colors={['#FAF8F5', '#F5F0E8', '#FAF8F5']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgGlowPurple} pointerEvents="none" />
      <View style={styles.bgGlowGold} pointerEvents="none" />

      {/* 1. TOP APP HEADER */}
      <View style={styles.topHeaderBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtnCircle, pressed && styles.btnPressed]}
            hitSlop={8}
          >
            <Text style={styles.backBtnArrow}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>Find a Squad</Text>
            <Text style={styles.headerSubtitle}>Discover your creator team</Text>
          </View>
        </View>

        {/* Right Header Actions */}
        <View style={styles.headerRightGroup}>
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
        {/* 2. HERO TITLE & SQUAD DISCOVERY BADGES                       */}
        {/* ============================================================ */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#784DF0', '#582CDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.discoveryPillGradient}
          >
            <View style={styles.sparkleWhiteDot} />
            <Text style={styles.discoveryPillText}>SQUAD DISCOVERY</Text>
          </LinearGradient>

          <Text style={styles.heroTitle}>Find creators to build with.</Text>
          <Text style={styles.heroSubtitle}>
            Discover squads based on niche, streak level, activity and shared creator goals.
          </Text>

          {/* Search Input Bar */}
          <View style={styles.searchBarContainer}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2.2" />
              <Path d="M20 20L16.5 16.5" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
            </Svg>

            <TextInput
              style={styles.searchInput}
              placeholder="Search squads by name, niche or goal..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. SPACIOUS DISCOVERY TABS (SMOOTH HORIZONTAL SCROLL)        */}
        {/* ============================================================ */}
        <View style={{ marginBottom: 14 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentTabsScroll}
          >
            {[
              { id: 'for_you', label: '✨ For You' },
              { id: 'top_streaks', label: '🔥 Top Streaks' },
              { id: 'collabs', label: '🎬 Active Collabs' },
              { id: 'pro', label: '👑 Pro Squads' },
            ].map((tab) => {
              const isSelected = selectedCategoryTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={({ pressed }) => [
                    styles.segmentTabBtn,
                    isSelected && styles.segmentTabBtnActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCategoryTab(tab.id as any);
                  }}
                >
                  <Text
                    style={[
                      styles.segmentTabText,
                      isSelected && styles.segmentTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* 4. FEATURED HERO SPOTLIGHT SQUAD (TOP AI MATCH)              */}
        {/* ============================================================ */}
        {selectedCategoryTab === 'for_you' && searchQuery === '' && (
          <View style={styles.featuredSpotlightCard}>
            <LinearGradient
              colors={['#2A1259', '#1A0C38']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredGradientContainer}
            >
              {/* Top Banner Row */}
              <View style={styles.featuredTopRow}>
                <View style={styles.spotlightBadge}>
                  <Text style={styles.spotlightBadgeText}>👑 TOP RECOMMENDED SQUAD</Text>
                </View>

                <View style={styles.matchScoreAiPill}>
                  <Text style={styles.matchScoreAiPillText}>94% FIT</Text>
                </View>
              </View>

              {/* Title & Host */}
              <View style={{ marginTop: 10 }}>
                <Text style={styles.featuredTitle}>{featuredSquad.name}</Text>
                <Text style={styles.featuredGoalText}>🎯 Goal: {featuredSquad.squadGoal}</Text>
              </View>

              {/* Jarvis AI Sync Note */}
              <View style={styles.jarvisSyncNoteBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisSyncFlame}
                  resizeMode="contain"
                />
                <Text style={styles.jarvisSyncText}>
                  Matches your 47-day streak and daily short-form pacing goals.
                </Text>
              </View>

              {/* Stats & Avatars Row (Clickable) */}
              <Pressable
                style={styles.featuredStatsRow}
                onPress={() => {
                  setSelectedSquad(featuredSquad);
                  setModalTab('members');
                  setPreviewModalSquad(featuredSquad);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.avatarStackRow}>
                    {featuredSquad.avatars.map((av, i) => (
                      <Image
                        key={i}
                        source={av}
                        style={[
                          styles.featuredAvatarImg,
                          { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i },
                        ]}
                      />
                    ))}
                    <View style={[styles.featuredAvatarPlus, { marginLeft: -8, zIndex: 0 }]}>
                      <Text style={styles.featuredAvatarPlusText}>+2</Text>
                    </View>
                  </View>

                  <Text style={styles.featuredMemberCount}>
                    5/8 Creators <Text style={{ color: '#C084FC', fontSize: 11 }}>➔</Text>
                  </Text>
                </View>

                <View style={styles.streakPillGold}>
                  <Text style={styles.streakPillGoldText}>🔥 12d Streak</Text>
                </View>
              </Pressable>

              {/* Action Buttons */}
              <View style={styles.featuredActionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.featuredPreviewBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    setSelectedSquad(featuredSquad);
                    setModalTab('details');
                    setPreviewModalSquad(featuredSquad);
                  }}
                >
                  <Text style={styles.featuredPreviewBtnText}>View Details</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.featuredJoinBtn, pressed && styles.btnPressed]}
                  onPress={() => handleRequestToJoin(featuredSquad)}
                >
                  <LinearGradient
                    colors={appliedSquadIds.includes(featuredSquad.id) ? ['#D97706', '#B45309'] : ['#9333EA', '#7E22CE']}
                    style={styles.featuredJoinGradient}
                  >
                    <Text style={styles.featuredJoinBtnText}>
                      {appliedSquadIds.includes(featuredSquad.id) ? '⏳ Pending Review' : 'Apply to Join 🚀'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ============================================================ */}
        {/* 5. NICHE FILTER PILLS                                        */}
        {/* ============================================================ */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionHeading}>Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nicheFilterScroll}
          >
            {[
              { id: 'all', label: '🌟 All Squads' },
              { id: 'growth', label: '📈 Growth' },
              { id: 'education', label: '🎓 Education' },
              { id: 'lifestyle', label: '🌿 Lifestyle' },
              { id: 'ugc', label: '✨ Brand & UGC' },
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
        </View>

        {/* ============================================================ */}
        {/* 6. SQUADS FEED LIST                                          */}
        {/* ============================================================ */}
        <View style={{ marginTop: 18 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>
              Available Squads ({filteredSquads.length})
            </Text>
            <View style={styles.verifiedCountBadge}>
              <Text style={styles.verifiedCountText}>⚡ Verified Creators</Text>
            </View>
          </View>

          <View style={{ gap: 14, marginTop: 12 }}>
            {filteredSquads.map((squad) => {
              return (
                <Pressable
                  key={squad.id}
                  style={({ pressed }) => [
                    styles.squadCard,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedSquad(squad);
                    setModalTab('details');
                    setPreviewModalSquad(squad);
                  }}
                >
                  {/* Card Header: Category & Fit */}
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

                    <LinearGradient
                      colors={['#EDE9FE', '#DDD6FE']}
                      style={styles.fitScorePill}
                    >
                      <Text style={styles.fitScoreNumber}>{squad.fitScore}%</Text>
                      <Text style={styles.fitScoreLabel}>FIT</Text>
                    </LinearGradient>
                  </View>

                  {/* Title & Goal */}
                  <Text style={styles.squadName}>{squad.name}</Text>
                  <Text style={styles.squadGoalLine}>🎯 {squad.squadGoal}</Text>

                  {/* Meta Bar (Clickable Members) */}
                  <View style={styles.squadMetaRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13 }}>🔥</Text>
                      <Text style={styles.metaStreakText}>{squad.streak}d Streak Avg</Text>
                    </View>

                    {/* Member Avatars */}
                    <Pressable
                      style={styles.avatarStackTouch}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedSquad(squad);
                        setModalTab('members');
                        setPreviewModalSquad(squad);
                      }}
                      hitSlop={6}
                    >
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
                          <Text style={styles.stackAvatarPlusText}>+{squad.memberCount - 3 > 0 ? squad.memberCount - 3 : 2}</Text>
                        </View>
                      </View>
                      <Text style={styles.tapRosterHint}>Roster ➔</Text>
                    </Pressable>
                  </View>

                  {/* Status & CTA Row */}
                  <View style={styles.squadCardFooterRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View
                        style={[
                          styles.statusDot,
                          squad.statusType === 'open' && styles.statusDotGreen,
                          squad.statusType === 'limited' && styles.statusDotRed,
                          squad.statusType === 'request' && styles.statusDotPurple,
                        ]}
                      />
                      <Text style={styles.statusText}>{squad.statusText}</Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.cardQuickJoinBtn,
                        appliedSquadIds.includes(squad.id) && styles.cardQuickJoinBtnPending,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => {
                        if (appliedSquadIds.includes(squad.id)) {
                          showToast(`Your application for ${squad.name} is currently under review.`);
                        } else {
                          handleRequestToJoin(squad);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.cardQuickJoinBtnText,
                          appliedSquadIds.includes(squad.id) && styles.cardQuickJoinBtnTextPending,
                        ]}
                      >
                        {appliedSquadIds.includes(squad.id) ? '⏳ Pending' : 'Apply ➔'}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BOTTOM SPACER */}
        <View style={{ height: 130 }} />
      </ScrollView>

      {/* SQUAD PREVIEW CENTERED LUXURY DIALOG MODAL (WITH TABS FOR DETAILS VS ROSTER) */}
      <Modal
        visible={previewModalSquad !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalSquad(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPreviewModalSquad(null)} />
          {previewModalSquad && (
            <View style={styles.modalContentCard}>
              {/* Top Modal Header with Close Button & Segment Switcher */}
              <View style={styles.modalTopHeaderRow}>
                <View style={styles.modalSegmentToggle}>
                  <Pressable
                    style={[styles.modalSegmentBtn, modalTab === 'details' && styles.modalSegmentBtnActive]}
                    onPress={() => setModalTab('details')}
                  >
                    <Text style={[styles.modalSegmentText, modalTab === 'details' && styles.modalSegmentTextActive]}>
                      Overview
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalSegmentBtn, modalTab === 'members' && styles.modalSegmentBtnActive]}
                    onPress={() => setModalTab('members')}
                  >
                    <Text style={[styles.modalSegmentText, modalTab === 'members' && styles.modalSegmentTextActive]}>
                      Roster ({previewModalSquad.memberCount}/{previewModalSquad.maxMembers})
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.modalCloseCircleBtn}
                  onPress={() => setPreviewModalSquad(null)}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCircleText}>✕</Text>
                </Pressable>
              </View>

              {/* ---------------- DETAILS VIEW ---------------- */}
              {modalTab === 'details' ? (
                <View>
                  {/* Host Profile Bar */}
                  <View style={styles.modalHostProfileRow}>
                    <Image source={previewModalSquad.hostAvatar} style={styles.modalHostAvatar} />
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={styles.modalHostName}>{previewModalSquad.hostName}</Text>
                        <View style={styles.modalHostCrownPill}>
                          <Text style={styles.modalHostCrownText}>👑 HOST</Text>
                        </View>
                      </View>
                      <Text style={styles.modalHostSub}>Verified Squad Creator</Text>
                    </View>
                  </View>

                  {/* Squad Badge & Fit Score */}
                  <View style={styles.modalSquadMetaRow}>
                    <View style={[styles.squadCatPill, styles.squadCatGrowth]}>
                      <Text style={[styles.squadCatText, styles.squadCatTextGrowth]}>
                        {previewModalSquad.category}
                      </Text>
                    </View>
                    <View style={styles.fitScorePill}>
                      <Text style={styles.fitScoreNumber}>{previewModalSquad.fitScore}%</Text>
                      <Text style={styles.fitScoreLabel}>FIT SCORE</Text>
                    </View>
                  </View>

                  {/* Title & Description */}
                  <Text style={styles.modalSquadTitle}>{previewModalSquad.name}</Text>
                  <Text style={styles.modalSquadDesc}>{previewModalSquad.description}</Text>

                  {/* Info Details Grid */}
                  <View style={styles.modalInfoBox}>
                    <View style={styles.modalInfoRowItem}>
                      <Text style={styles.modalInfoLabel}>🎯 Squad Goal</Text>
                      <Text style={styles.modalInfoVal}>{previewModalSquad.squadGoal}</Text>
                    </View>
                    <View style={styles.modalInfoRowItem}>
                      <Text style={styles.modalInfoLabel}>⚡ Streak Record</Text>
                      <Text style={styles.modalInfoVal}>🔥 {previewModalSquad.streak} Days Streak Avg</Text>
                    </View>
                    <View style={styles.modalInfoRowItem}>
                      <Text style={styles.modalInfoLabel}>🏆 Weekly Quest</Text>
                      <Text style={[styles.modalInfoVal, { color: '#582CDB', fontWeight: '700' }]}>
                        {previewModalSquad.weeklyQuest}
                      </Text>
                    </View>
                    <View style={[styles.modalInfoRowItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={styles.modalInfoLabel}>📋 Requirement</Text>
                      <Text style={styles.modalInfoVal}>{previewModalSquad.requirements}</Text>
                    </View>
                  </View>

                  {/* Member Capacity & Interactive Avatars Trigger */}
                  <Pressable
                    style={styles.modalMembersPreviewRow}
                    onPress={() => setModalTab('members')}
                  >
                    <View style={styles.avatarStackRow}>
                      {previewModalSquad.avatars.map((av, i) => (
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

                    <Text style={styles.modalCapacityText}>
                      {previewModalSquad.memberCount}/{previewModalSquad.maxMembers} Members • <Text style={{ color: '#582CDB', fontWeight: '800' }}>View Roster ➔</Text>
                    </Text>
                  </Pressable>
                </View>
              ) : (
                /* ---------------- ROSTER VIEW ---------------- */
                <View>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.rosterHeaderTitle}>Squad Creator Roster</Text>
                    <Text style={styles.rosterHeaderSub}>
                      {previewModalSquad.members.length} creators collaborating in {previewModalSquad.name}
                    </Text>
                  </View>

                  <ScrollView style={styles.rosterListScroll} showsVerticalScrollIndicator={false}>
                    {previewModalSquad.members.map((member) => (
                      <View key={member.id} style={styles.rosterMemberRow}>
                        <Image source={member.avatar} style={styles.rosterMemberAvatar} />

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.rosterMemberName}>{member.name}</Text>
                            {member.isHost && (
                              <View style={styles.modalHostCrownPill}>
                                <Text style={styles.modalHostCrownText}>👑 HOST</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.rosterMemberNiche}>{member.niche} • 🔥 {member.streak}d streak</Text>
                        </View>

                        <Pressable
                          style={styles.rosterChatBtn}
                          onPress={() => {
                            setPreviewModalSquad(null);
                            if (onOpenMessages && member.threadId) {
                              onOpenMessages(member.threadId);
                            } else if (onOpenMessages) {
                              onOpenMessages();
                            }
                          }}
                          hitSlop={6}
                        >
                          <Text style={{ fontSize: 13 }}>💬</Text>
                        </Pressable>
                      </View>
                    ))}

                    {/* Open Slots */}
                    {Array.from({ length: previewModalSquad.maxMembers - previewModalSquad.memberCount }).map((_, idx) => (
                      <View key={`slot_${idx}`} style={styles.rosterOpenSlotRow}>
                        <View style={styles.rosterOpenSlotCircle}>
                          <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '700' }}>+</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rosterOpenSlotTitle}>Open Member Slot {previewModalSquad.memberCount + idx + 1}</Text>
                          <Text style={styles.rosterOpenSlotSub}>Available for new verified applicants</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Action Button */}
              <View style={styles.modalActionsRow}>
                {appliedSquadIds.includes(previewModalSquad.id) ? (
                  <View style={styles.modalPendingBox}>
                    <Text style={styles.modalPendingText}>⏳ Application Under Review</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.modalSolidBtnFull, pressed && styles.btnPressed]}
                    onPress={() => handleRequestToJoin(previewModalSquad)}
                  >
                    <LinearGradient
                      colors={['#784DF0', '#582CDB']}
                      style={styles.modalSolidGradient}
                    >
                      <Text style={styles.modalSolidBtnText}>Apply to Join {previewModalSquad.name} 🚀</Text>
                    </LinearGradient>
                  </Pressable>
                )}
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
    top: 50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(147, 51, 234, 0.06)',
  },
  bgGlowGold: {
    position: 'absolute',
    top: 300,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  backBtnArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171420',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerMascotTouch: {
    padding: 2,
  },
  headerGhostMascot: {
    width: 32,
    height: 32,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    paddingTop: 14,
  },

  /* HERO SECTION */
  heroSection: {
    marginBottom: 12,
  },
  discoveryPillGradient: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  sparkleWhiteDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  discoveryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    lineHeight: 31,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },

  /* SEARCH BAR */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171420',
    paddingVertical: 2,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '800',
  },

  /* SPACIOUS SEGMENT TABS */
  segmentTabsScroll: {
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  segmentTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentTabBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
  },
  segmentTabTextActive: {
    color: '#FFFFFF',
  },

  /* FEATURED SPOTLIGHT */
  featuredSpotlightCard: {
    marginTop: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  featuredGradientContainer: {
    padding: 18,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightBadge: {
    backgroundColor: 'rgba(253, 230, 138, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.4)',
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  matchScoreAiPill: {
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  matchScoreAiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F3E8FF',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featuredGoalText: {
    fontSize: 12.5,
    color: '#E2E8F0',
    marginTop: 2,
  },
  jarvisSyncNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  jarvisSyncFlame: {
    width: 18,
    height: 18,
  },
  jarvisSyncText: {
    fontSize: 12,
    color: '#F1F5F9',
    flex: 1,
    lineHeight: 16,
  },
  featuredStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
    borderRadius: 12,
  },
  featuredMemberCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  streakPillGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  streakPillGoldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  featuredActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  featuredPreviewBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  featuredPreviewBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuredJoinBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredJoinGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  featuredJoinBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* NICHE FILTER */
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  nicheFilterScroll: {
    gap: 8,
    paddingVertical: 8,
  },
  nicheFilterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  nicheFilterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  nicheFilterPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  nicheFilterPillTextActive: {
    color: '#FFFFFF',
  },

  /* FEED */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
  },
  squadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#ECFDF5',
  },
  squadCatBrand: {
    backgroundColor: '#FEE2E2',
  },
  squadCatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  squadCatTextGrowth: {
    color: '#B45309',
  },
  squadCatTextEdu: {
    color: '#6D28D9',
  },
  squadCatTextLife: {
    color: '#059669',
  },
  squadCatTextBrand: {
    color: '#B91C1C',
  },
  fitScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fitScoreNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  fitScoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6D28D9',
  },
  squadName: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
  },
  squadGoalLine: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  squadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  metaStreakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  avatarStackTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  stackAvatarPlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarPlusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  tapRosterHint: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  featuredAvatarImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#2A1259',
  },
  featuredAvatarPlus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: '#2A1259',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredAvatarPlusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  squadCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotGreen: {
    backgroundColor: '#10B981',
  },
  statusDotRed: {
    backgroundColor: '#EF4444',
  },
  statusDotPurple: {
    backgroundColor: '#8B5CF6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cardQuickJoinBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardQuickJoinBtnPending: {
    backgroundColor: '#FEF3C7',
  },
  cardQuickJoinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  cardQuickJoinBtnTextPending: {
    color: '#B45309',
  },

  /* SQUAD PREVIEW CENTERED MODAL */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 420,
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
  modalTopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalSegmentToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  modalSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modalSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  modalSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSegmentTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  modalHostProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  modalHostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  modalHostName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  modalHostCrownPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  modalHostCrownText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  modalHostSub: {
    fontSize: 11,
    color: '#64748B',
  },
  modalCloseCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseCircleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSquadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSquadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  modalSquadDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInfoBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 12,
  },
  modalInfoRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  modalInfoVal: {
    fontSize: 12,
    color: '#171420',
    fontWeight: '800',
    maxWidth: '62%',
    textAlign: 'right',
  },
  modalMembersPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalCapacityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  /* ROSTER VIEW */
  rosterHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  rosterHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rosterListScroll: {
    maxHeight: 230,
    marginBottom: 16,
  },
  rosterMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rosterMemberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  rosterMemberName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  rosterMemberNiche: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rosterChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterOpenSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    opacity: 0.8,
  },
  rosterOpenSlotCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  rosterOpenSlotTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  rosterOpenSlotSub: {
    fontSize: 11,
    color: '#64748B',
  },

  /* ACTIONS */
  modalActionsRow: {
    flexDirection: 'row',
  },
  modalSolidBtnFull: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSolidGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSolidBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalPendingBox: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPendingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
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
    shadowOpacity: 0.08,
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
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
