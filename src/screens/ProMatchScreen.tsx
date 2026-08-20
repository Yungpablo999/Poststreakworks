import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  PanResponder,
  Modal,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 95;
const SWIPE_UP_THRESHOLD = 85;

interface ProMatchScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: (threadId?: string) => void;
  onOpenJarvisPro?: () => void;
  onOpenCollabIdea?: (partnerData: {
    name: string;
    handle: string;
    niche: string;
    avatar: any;
    planIndex: number;
    title: string;
  }) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface CollabConcept {
  id: string;
  title: string;
  hook: string;
  format: string;
  expectedReach: string;
}

interface CreatorCardData {
  id: string;
  name: string;
  handle: string;
  role: string;
  followers: string;
  location: string;
  coverImage: any;
  bio: string;
  tags: string[];
  streak: number;
  matchScore: number;
  activeStatus: string;
  isTracked: boolean;
  audienceFit: number;
  formatSynergy: number;
  reliability: number;
  jarvisRationale: string;
  collabConcepts: CollabConcept[];
}

const DECK_CREATORS: CreatorCardData[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    handle: '@amara_travels',
    role: 'Travel & Lifestyle Vlogger',
    followers: '85K',
    location: 'Lagos, NG',
    coverImage: require('../../assets/images/amara-avatar.jpg'),
    bio: 'Filming authentic travel routines & luxury getaways across West Africa. Looking for lifestyle co-creators for dynamic storytelling.',
    tags: ['🌿 Travel', '✨ Lifestyle', '🎥 4K Vlogs'],
    streak: 44,
    matchScore: 96,
    activeStatus: 'Active today (Posted 2h ago)',
    isTracked: true,
    audienceFit: 94,
    formatSynergy: 98,
    reliability: 92,
    jarvisRationale:
      'Your audiences overlap in lifestyle, travel and personality-led storytelling. A joint Reel could help both creators reach new viewers with strong short-form chemistry.',
    collabConcepts: [
      {
        id: 'c1',
        title: 'The 24-Hour Creator Swap & Lagos Hidden Gems',
        hook: 'We traded content workflows for 24 hours in Lagos. Here is what broke first...',
        format: '9:16 Instagram Reel & TikTok (Joint Collab)',
        expectedReach: '140K+ combined impressions',
      },
      {
        id: 'c2',
        title: 'Luxury Getaway vs Street Routine: The Contrast Experiment',
        hook: 'Why high-production travel content is shifting to raw handheld storytelling in 2024.',
        format: 'YouTube Shorts + Carousel Deck',
        expectedReach: '95K+ impressions',
      },
      {
        id: 'c3',
        title: 'Creator Habits Breakdown: Maintaining 40+ Day Streaks',
        hook: 'How 2 full-time creators film, edit, and post daily without burning out.',
        format: 'Podcast Audio Clip & X Thread',
        expectedReach: '80K+ views',
      },
    ],
  },
  {
    id: 'david',
    name: 'David Kim',
    handle: '@davidkim_tech',
    role: 'Tech & Productivity Systems',
    followers: '120K',
    location: 'San Francisco, CA',
    coverImage: require('../../assets/images/david-avatar.jpg'),
    bio: 'Breaking down creator tools, AI automation workflows, and desk setups that maximize high-output focus.',
    tags: ['⚡ AI Systems', '💻 Tech Reviews', '📈 Productivity'],
    streak: 52,
    matchScore: 94,
    activeStatus: 'Active today (Posted 4h ago)',
    isTracked: false,
    audienceFit: 92,
    formatSynergy: 96,
    reliability: 95,
    jarvisRationale:
      'David has an exceptionally high tech retention rate. Co-producing an AI workflow review will drive cross-pollination from high-value tech enthusiasts.',
    collabConcepts: [
      {
        id: 'cd1',
        title: 'The 3-App Stack That Replaced an Entire Production Team',
        hook: 'We tested 12 AI tools so you don’t have to. These 3 run our entire workflow.',
        format: 'TikTok & Reel Carousel (Multi-slide)',
        expectedReach: '180K+ impressions',
      },
      {
        id: 'cd2',
        title: 'Tech Showdown: Automated Publishing vs Organic Posting',
        hook: 'Does posting manually actually boost algorithm reach? We ran a 14-day test.',
        format: 'Joint 60s Reel',
        expectedReach: '110K+ impressions',
      },
    ],
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    handle: '@elena_fit',
    role: 'High-Performance & Fitness',
    followers: '64K',
    location: 'London, UK',
    coverImage: require('../../assets/images/elena-avatar.jpg'),
    bio: 'Daily morning routines, disciplined training, and nutrition for creators who want boundless energy.',
    tags: ['💪 Fitness', '🥑 Wellness', '⏰ Routine'],
    streak: 39,
    matchScore: 91,
    activeStatus: 'Active today (Posted 1h ago)',
    isTracked: false,
    audienceFit: 88,
    formatSynergy: 94,
    reliability: 96,
    jarvisRationale:
      'Elena provides a perfect lifestyle-wellness hook angle. A routine swap or energy management breakdown aligns seamlessly with creator sustainability.',
    collabConcepts: [
      {
        id: 'ce1',
        title: 'The 5 AM Creator Energy Challenge',
        hook: 'Can a non-morning creator survive an Olympic morning routine for 7 days?',
        format: 'Mini-Doc Vlog (9:16 Video Series)',
        expectedReach: '125K+ impressions',
      },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    handle: '@marcus_vance',
    role: 'B2B SaaS & Growth Hacker',
    followers: '98K',
    location: 'Austin, TX',
    coverImage: require('../../assets/images/marcus-avatar.jpg'),
    bio: 'Building in public. Sharing organic growth systems that convert followers into monthly recurring revenue.',
    tags: ['🚀 Monetization', '📊 Case Studies', '💡 SaaS'],
    streak: 61,
    matchScore: 95,
    activeStatus: 'Active today (Posted 5h ago)',
    isTracked: false,
    audienceFit: 96,
    formatSynergy: 95,
    reliability: 98,
    jarvisRationale:
      'Marcus specializes in high-converting monetization hooks. Collaborating with him will elevate your authority in business and monetization spaces.',
    collabConcepts: [
      {
        id: 'cm1',
        title: 'How to Turn 1,000 Views into $1,000 Monthly Revenue',
        hook: 'Most creators monetize completely backwards. Here is the low-friction playbook.',
        format: 'LinkedIn Carousel & X Thread',
        expectedReach: '210K+ impressions',
      },
    ],
  },
  {
    id: 'zainab',
    name: 'Zainab Al-Hassan',
    handle: '@zainab_eats',
    role: 'Culinary & Culture Explorer',
    followers: '72K',
    location: 'Dubai, UAE',
    coverImage: require('../../assets/images/zainab-avatar.jpg'),
    bio: 'Street food journeys, Middle Eastern fusion recipes, and visual food aesthetic guides.',
    tags: ['🍳 Culinary', '🌍 Culture', '📸 Aesthetic'],
    streak: 48,
    matchScore: 93,
    activeStatus: 'Active today (Posted 3h ago)',
    isTracked: false,
    audienceFit: 91,
    formatSynergy: 94,
    reliability: 94,
    jarvisRationale:
      'Zainab has top-tier visual food aesthetic production. Cross-niche collaboration creates unmatched visual engagement.',
    collabConcepts: [
      {
        id: 'cz1',
        title: 'Rating the Best Creator Cafes in the World',
        hook: 'We visited the top 5 creator-friendly cafes. Number 3 shocked us.',
        format: '9:16 Cinematic Food Reel',
        expectedReach: '130K+ impressions',
      },
    ],
  },
];

const INCOMING_REQUESTS_INITIAL = [
  {
    id: 'req_1',
    name: 'Kemi Adeleke',
    handle: '@kemi_designs',
    role: 'UI/UX & Brand Designer',
    followers: '68K',
    location: 'London, UK',
    avatar: require('../../assets/images/kemi-avatar.jpg'),
    streak: 42,
    matchScore: 95,
    pitch: 'Hey! Loved your recent breakdown on creator systems. I drafted a joint design concept for an interactive carousel swap!',
    conceptTitle: 'The Anatomy of a High-Converting Carousel Slide',
    timeAgo: '2h ago',
  },
  {
    id: 'req_2',
    name: 'Tomi Adebayo',
    handle: '@tomi_tech',
    role: 'Tech & Gadget Reviewer',
    followers: '115K',
    location: 'Toronto, CA',
    avatar: require('../../assets/images/tomi-avatar.jpg'),
    streak: 55,
    matchScore: 92,
    pitch: 'Would love to do a 60s creator desk setup critique video with you! Let me know if you are open to filming next Tuesday.',
    conceptTitle: 'Extreme Creator Studio Upgrades Under $100',
    timeAgo: '5h ago',
  },
];

const CONNECTED_CREATORS_INITIAL = [
  {
    id: 'conn_1',
    name: 'Elena Rostova',
    handle: '@elena_fit',
    role: 'Fitness & Wellness',
    followers: '64K',
    location: 'London, UK',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 39,
    status: 'Matched 2 days ago',
    activeCollab: 'The 5 AM Creator Energy Routine',
  },
  {
    id: 'conn_2',
    name: 'Marcus Vance',
    handle: '@marcus_vance',
    role: 'B2B SaaS Growth',
    followers: '98K',
    location: 'Austin, TX',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 61,
    status: 'Matched 4 days ago',
    activeCollab: 'Monetizing Short-Form Content Playbook',
  },
];

export const ProMatchScreen: React.FC<ProMatchScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenMessages,
  onOpenJarvisPro,
  onOpenCollabIdea,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [segmentTab, setSegmentTab] = useState<'deck' | 'requests' | 'tracked' | 'connected'>('deck');
  const [activeFilter, setActiveFilter] = useState<'all' | 'niche' | 'streak' | 'nearby' | 'ai'>('niche');
  const [matchesLeft, setMatchesLeft] = useState(5);

  // Deck & Lists
  const [deck, setDeck] = useState<CreatorCardData[]>(DECK_CREATORS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [requests, setRequests] = useState(INCOMING_REQUESTS_INITIAL);
  const [connected, setConnected] = useState(CONNECTED_CREATORS_INITIAL);
  const [trackedIds, setTrackedIds] = useState<string[]>(['amara']);

  // Modals & Feedback
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorCardData | null>(DECK_CREATORS[0]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    title: 'Collab Match Made!',
    subtitle: 'You and Amara Okafor are matched to build together.',
    badgeText: '✨ COLLAB UNLOCKED (+150 XP)',
    xpEarned: 150,
    speechBubble: 'Boom! High-synergy match secured. Time to build viral content, Pablo! 🔥',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Card Swiping Animations
  const position = useRef(new Animated.ValueXY()).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const triggerModalPop = () => {
    modalPopScale.setValue(0.92);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // PanResponder for Interactive Deck Swiping
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else if (gesture.dy < -SWIPE_UP_THRESHOLD) {
          swipeUp();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const swipeRight = (creatorParam?: CreatorCardData) => {
    const creator = creatorParam || deck[currentIndex];
    if (!creator) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 150, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onSwipeComplete('right', creator);
    });
  };

  const swipeLeft = (creatorParam?: CreatorCardData) => {
    const creator = creatorParam || deck[currentIndex];
    if (!creator) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 150, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onSwipeComplete('left', creator);
    });
  };

  const swipeUp = (creatorParam?: CreatorCardData) => {
    const creator = creatorParam || deck[currentIndex];
    if (!creator) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.timing(position, {
      toValue: { x: 0, y: -SCREEN_HEIGHT },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onSwipeComplete('up', creator);
    });
  };

  const onSwipeComplete = (direction: 'right' | 'left' | 'up', creator: CreatorCardData) => {
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);

    if (direction === 'right') {
      // MATCH
      setMatchesLeft((prev) => Math.max(0, prev - 1));
      setConnected((prev) => [
        {
          id: `conn_${creator.id}`,
          name: creator.name,
          handle: creator.handle,
          role: creator.role,
          followers: creator.followers,
          location: creator.location,
          avatar: creator.coverImage,
          streak: creator.streak,
          status: 'Matched just now',
          activeCollab: creator.collabConcepts[0]?.title || 'Joint Content Series',
        },
        ...prev,
      ]);

      setCompletionData({
        title: 'Collab Match Made!',
        subtitle: `You and ${creator.name} are matched to build together.`,
        badgeText: '✨ COLLAB UNLOCKED (+150 XP)',
        xpEarned: 150,
        speechBubble: `High-synergy match secured with ${creator.name}! Time to build viral content, Pablo! 🔥`,
      });

      setTimeout(() => {
        setShowCompletionModal(true);
      }, 150);
    } else if (direction === 'up') {
      // TRACK
      if (!trackedIds.includes(creator.id)) {
        setTrackedIds((prev) => [...prev, creator.id]);
      }
      showToast(`📡 Added ${creator.name} to Tracked radar!`);
    } else {
      // PASS
      showToast(`Passed on ${creator.name}`);
    }
  };

  const handleToggleTrackCurrent = (creator: CreatorCardData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (trackedIds.includes(creator.id)) {
      setTrackedIds((prev) => prev.filter((id) => id !== creator.id));
      showToast(`Untracked ${creator.name}`);
    } else {
      setTrackedIds((prev) => [...prev, creator.id]);
      showToast(`⭐ Tracking ${creator.name}`);
    }
  };

  const handleOpenDeepDive = (creator: CreatorCardData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCreator(creator);
    triggerModalPop();
    setShowDeepDiveModal(true);
  };

  const handleAcceptRequest = (req: typeof requests[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setConnected((prev) => [
      {
        id: `conn_${req.id}`,
        name: req.name,
        handle: req.handle,
        role: req.role,
        followers: req.followers,
        location: req.location,
        avatar: req.avatar,
        streak: req.streak,
        status: 'Accepted request',
        activeCollab: req.conceptTitle,
      },
      ...prev,
    ]);

    setCompletionData({
      title: 'Collaboration Accepted!',
      subtitle: `You accepted ${req.name}'s collab request.`,
      badgeText: '🤝 CREATOR TEAM UNLOCKED (+100 XP)',
      xpEarned: 100,
      speechBubble: `${req.name} is ready to create with you! Check your messages to start filming! 🔥`,
    });
    setShowCompletionModal(true);
  };

  const handleDeclineRequest = (reqId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    showToast('Declined collab request');
  };

  const handleLaunchCollabConcept = (creator: CreatorCardData, concept: CollabConcept) => {
    setShowDeepDiveModal(false);
    if (onOpenCollabIdea) {
      onOpenCollabIdea({
        name: creator.name,
        handle: creator.handle,
        niche: creator.role,
        avatar: creator.coverImage,
        planIndex: 0,
        title: concept.title,
      });
    } else if (onOpenMessages) {
      onOpenMessages();
    }
  };

  // Interpolated Swiping Transforms
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [20, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const trackOpacity = position.y.interpolate({
    inputRange: [-SWIPE_UP_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const currentCreator = deck[currentIndex];
  const nextCreator = deck[currentIndex + 1];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP APP HEADER                                            */}
        {/* ============================================================ */}
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <View style={styles.flameHaloBox}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>Match Radar</Text>
              <Text style={styles.headerStreakText}>47-Day Streak Active</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Messages */}
            <Pressable
              style={({ pressed }) => [styles.headerRoundBtn, pressed && styles.btnPressed]}
              onPress={() => onOpenMessages && onOpenMessages()}
            >
              <Text style={{ fontSize: 16 }}>💬</Text>
            </Pressable>

            {/* Notifications */}
            <Pressable
              style={({ pressed }) => [styles.headerRoundBtn, pressed && styles.btnPressed]}
              onPress={() => setShowNotificationModal(true)}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
              {requests.length > 0 && <View style={styles.unreadDot} />}
            </Pressable>

            {/* Profile */}
            <Pressable
              style={({ pressed }) => [styles.profileAvatarBtn, pressed && styles.btnPressed]}
              onPress={() => setShowProfileModal(true)}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/amara-avatar.jpg')}
                style={styles.profileAvatarImg}
              />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Container */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================================ */}
          {/* 2. PILL BADGES ROW                                           */}
          {/* ============================================================ */}
          <View style={styles.badgesRow}>
            <View style={styles.creatorRadarBadge}>
              <Text style={styles.creatorRadarBadgeText}>CREATOR RADAR</Text>
            </View>
            <View style={styles.swipeToMatchBadge}>
              <Text style={styles.swipeToMatchBadgeText}>Swipe to Match</Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 3. HEADLINE & SUBTITLE                                       */}
          {/* ============================================================ */}
          <Text style={styles.mainHeadline}>Find creators worth building with.</Text>
          <Text style={styles.subHeadline}>
            Swipe right to accept, left to decline, or tap ⓘ for deep-dive match intelligence.
          </Text>

          {/* ============================================================ */}
          {/* 4. SUMMARY STATS DECK                                        */}
          {/* ============================================================ */}
          <View style={styles.summaryStatsDeck}>
            <Pressable
              style={styles.summaryCol}
              onPress={() => setSegmentTab('deck')}
            >
              <Text style={styles.summaryItemText}>⭐ {matchesLeft}/5</Text>
              <Text style={styles.summaryItemSub}>Matches Left</Text>
            </Pressable>

            <View style={styles.summaryDivider} />

            <Pressable
              style={styles.summaryCol}
              onPress={() => setSegmentTab('requests')}
            >
              <Text style={styles.summaryItemText}>📩 {requests.length}</Text>
              <Text style={styles.summaryItemSub}>Requests</Text>
            </Pressable>

            <View style={styles.summaryDivider} />

            <Pressable
              style={styles.summaryCol}
              onPress={() => setSegmentTab('tracked')}
            >
              <Text style={styles.summaryItemText}>📡 {trackedIds.length}</Text>
              <Text style={styles.summaryItemSub}>Tracked</Text>
            </Pressable>

            <View style={styles.summaryDivider} />

            <Pressable
              style={styles.summaryCol}
              onPress={() => setSegmentTab('connected')}
            >
              <Text style={styles.summaryItemText}>💜 {connected.length}</Text>
              <Text style={styles.summaryItemSub}>Connected</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* 5. SEGMENTED TABS BAR                                        */}
          {/* ============================================================ */}
          <View style={styles.segmentedTabBar}>
            <Pressable
              style={[styles.segmentBtn, segmentTab === 'deck' && styles.segmentBtnActive]}
              onPress={() => setSegmentTab('deck')}
            >
              <Text style={[styles.segmentBtnText, segmentTab === 'deck' && styles.segmentBtnTextActive]}>
                Deck
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, segmentTab === 'requests' && styles.segmentBtnActive]}
              onPress={() => setSegmentTab('requests')}
            >
              <Text style={[styles.segmentBtnText, segmentTab === 'requests' && styles.segmentBtnTextActive]}>
                Requests ({requests.length})
              </Text>
              {requests.length > 0 && <View style={styles.segmentRedDot} />}
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, segmentTab === 'tracked' && styles.segmentBtnActive]}
              onPress={() => setSegmentTab('tracked')}
            >
              <Text style={[styles.segmentBtnText, segmentTab === 'tracked' && styles.segmentBtnTextActive]}>
                Tracked ({trackedIds.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, segmentTab === 'connected' && styles.segmentBtnActive]}
              onPress={() => setSegmentTab('connected')}
            >
              <Text style={[styles.segmentBtnText, segmentTab === 'connected' && styles.segmentBtnTextActive]}>
                Connected ({connected.length})
              </Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* 6. FILTER PILLS ROW (Visible on Deck)                        */}
          {/* ============================================================ */}
          {segmentTab === 'deck' && (
            <View style={styles.filterPillsRow}>
              {[
                { id: 'niche', label: 'Same Niche' },
                { id: 'streak', label: 'Similar Streak' },
                { id: 'nearby', label: 'Nearby' },
                { id: 'ai', label: 'AI Pick' },
              ].map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveFilter(f.id as any);
                    }}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 1: SWIPING MATCH DECK                                    */}
          {/* ============================================================ */}
          {segmentTab === 'deck' && (
            <View style={{ marginTop: 14 }}>
              {currentCreator ? (
                <View style={styles.deckContainer}>
                  {/* Underneath Card (3D Stack Depth) */}
                  {nextCreator && (
                    <View style={[styles.cardWrapper, styles.underneathCard]}>
                      <Image source={nextCreator.coverImage} style={styles.cardImage} resizeMode="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
                        style={styles.cardGradientOverlay}
                      />
                      <View style={styles.cardBottomContent}>
                        <Text style={styles.creatorNameText}>{nextCreator.name}</Text>
                        <Text style={styles.creatorRoleLocationText}>{nextCreator.role}</Text>
                      </View>
                    </View>
                  )}

                  {/* Top Swiping Card */}
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.cardWrapper,
                      {
                        transform: [
                          { translateX: position.x },
                          { translateY: position.y },
                          { rotate: rotate },
                        ],
                      },
                    ]}
                  >
                    <Image source={currentCreator.coverImage} style={styles.cardImage} resizeMode="cover" />

                    {/* Gradient Overlay */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.96)']}
                      style={styles.cardGradientOverlay}
                    />

                    {/* Stamp Overlays */}
                    <Animated.View style={[styles.stampBox, styles.stampMatch, { opacity: likeOpacity }]}>
                      <Text style={styles.stampMatchText}>COLLAB MATCH</Text>
                    </Animated.View>

                    <Animated.View style={[styles.stampBox, styles.stampPass, { opacity: nopeOpacity }]}>
                      <Text style={styles.stampPassText}>PASS</Text>
                    </Animated.View>

                    <Animated.View style={[styles.stampBox, styles.stampTrack, { opacity: trackOpacity }]}>
                      <Text style={styles.stampTrackText}>TRACKED</Text>
                    </Animated.View>

                    {/* Top Badges Overlay */}
                    <View style={styles.cardTopOverlay}>
                      {/* Left: Active Today */}
                      <View style={styles.activeTodayPill}>
                        <View style={styles.greenPulseDot} />
                        <Text style={styles.activeTodayText}>🟢 {currentCreator.activeStatus}</Text>
                      </View>

                      {/* Right: Track + Info Buttons */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable
                          style={[
                            styles.trackingBadgeBtn,
                            trackedIds.includes(currentCreator.id) && styles.trackingBadgeBtnActive,
                          ]}
                          onPress={() => handleToggleTrackCurrent(currentCreator)}
                        >
                          <Text
                            style={[
                              styles.trackingBadgeText,
                              trackedIds.includes(currentCreator.id) && styles.trackingBadgeTextActive,
                            ]}
                          >
                            ⭐ {trackedIds.includes(currentCreator.id) ? 'Tracking' : '+ Track'}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.infoRoundBtn}
                          onPress={() => handleOpenDeepDive(currentCreator)}
                          hitSlop={8}
                        >
                          <Text style={styles.infoRoundBtnText}>ⓘ</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Bottom Content Overlay */}
                    <View style={styles.cardBottomContent}>
                      {/* Name & Streak Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={styles.creatorNameText}>{currentCreator.name}</Text>
                          <View style={styles.verifiedCheckCircle}>
                            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '900' }}>✓</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {/* Streak Pill */}
                          <View style={styles.streakPill}>
                            <Text style={styles.streakPillText}>🔥 {currentCreator.streak}d</Text>
                          </View>

                          {/* Deep Dive Button */}
                          <Pressable
                            style={styles.deepDivePillBtn}
                            onPress={() => handleOpenDeepDive(currentCreator)}
                          >
                            <Text style={styles.deepDivePillBtnText}>Deep Dive ➔</Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* Role & Location */}
                      <Text style={styles.creatorRoleLocationText}>
                        {currentCreator.role} • {currentCreator.followers} • 📍 {currentCreator.location}
                      </Text>

                      {/* Bio */}
                      <Text style={styles.creatorBioText} numberOfLines={2}>
                        {currentCreator.bio}
                      </Text>

                      {/* Tags */}
                      <View style={styles.creatorTagsRow}>
                        {currentCreator.tags.map((tag, tIdx) => (
                          <View key={tIdx} style={styles.creatorTagPill}>
                            <Text style={styles.creatorTagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Animated.View>
                </View>
              ) : (
                <View style={styles.emptyDeckCard}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>🎉</Text>
                  <Text style={styles.emptyDeckTitle}>You’ve cleared your Radar!</Text>
                  <Text style={styles.emptyDeckSub}>
                    Check back tomorrow or refresh to discover new creators in your niche.
                  </Text>
                  <Pressable
                    style={styles.reloadDeckBtn}
                    onPress={() => {
                      setCurrentIndex(0);
                      showToast('🔄 Refreshed Creator Radar deck!');
                    }}
                  >
                    <Text style={styles.reloadDeckBtnText}>🔄 Refresh Radar</Text>
                  </Pressable>
                </View>
              )}

              {/* Gesture Guide Bar */}
              <View style={styles.gestureGuideBar}>
                <Text style={styles.gestureGuideText}>
                  👈 Swipe left to decline  •  👆 Up to track  •  Right to accept 👉
                </Text>
              </View>

              {/* Fast Action Buttons Bar */}
              <View style={styles.fastActionRow}>
                {/* Pass Button */}
                <Pressable
                  style={({ pressed }) => [styles.actionCircleBtn, styles.passActionBtn, pressed && styles.btnPressed]}
                  onPress={() => currentCreator && swipeLeft(currentCreator)}
                >
                  <Text style={{ fontSize: 20 }}>✕</Text>
                </Pressable>

                {/* Track Button */}
                <Pressable
                  style={({ pressed }) => [styles.actionCircleBtn, styles.trackActionBtn, pressed && styles.btnPressed]}
                  onPress={() => currentCreator && swipeUp(currentCreator)}
                >
                  <Text style={{ fontSize: 18 }}>📡</Text>
                </Pressable>

                {/* Jarvis Super Match */}
                <Pressable
                  style={({ pressed }) => [styles.actionCircleBtn, styles.superActionBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (currentCreator) {
                      showToast('⚡ Jarvis Super Match activated (+50% synergy)');
                      swipeRight(currentCreator);
                    }
                  }}
                >
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                </Pressable>

                {/* Collab Match Button */}
                <Pressable
                  style={({ pressed }) => [styles.actionCircleBtn, styles.matchActionBtn, pressed && styles.btnPressed]}
                  onPress={() => currentCreator && swipeRight(currentCreator)}
                >
                  <Text style={{ fontSize: 22 }}>💜</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 2: REQUESTS VIEW                                         */}
          {/* ============================================================ */}
          {segmentTab === 'requests' && (
            <View style={{ gap: 12, marginTop: 14 }}>
              {requests.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📬</Text>
                  <Text style={styles.emptyTabTitle}>No pending collab requests</Text>
                  <Text style={styles.emptyTabSub}>New collaboration requests from creators will appear here.</Text>
                </View>
              ) : (
                requests.map((req) => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Image source={req.avatar} style={styles.requestAvatar} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.requestName}>{req.name}</Text>
                          <View style={styles.requestScorePill}>
                            <Text style={styles.requestScoreText}>{req.matchScore}% Match</Text>
                          </View>
                        </View>
                        <Text style={styles.requestRoleLocation}>
                          {req.role} • {req.followers} • {req.location}
                        </Text>
                        <Text style={styles.requestTimeText}>{req.timeAgo}</Text>
                      </View>
                    </View>

                    <View style={styles.requestPitchBox}>
                      <Text style={styles.requestPitchText}>&ldquo;{req.pitch}&rdquo;</Text>
                      <View style={styles.requestConceptPill}>
                        <Text style={styles.requestConceptPillText}>💡 Proposed: {req.conceptTitle}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Pressable
                        style={styles.requestDeclineBtn}
                        onPress={() => handleDeclineRequest(req.id)}
                      >
                        <Text style={styles.requestDeclineBtnText}>Decline</Text>
                      </Pressable>

                      <Pressable
                        style={styles.requestMessageBtn}
                        onPress={() => onOpenMessages && onOpenMessages()}
                      >
                        <Text style={styles.requestMessageBtnText}>Chat 💬</Text>
                      </Pressable>

                      <Pressable
                        style={styles.requestAcceptBtn}
                        onPress={() => handleAcceptRequest(req)}
                      >
                        <Text style={styles.requestAcceptBtnText}>Accept 💜</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 3: TRACKED RADAR VIEW                                    */}
          {/* ============================================================ */}
          {segmentTab === 'tracked' && (
            <View style={{ gap: 12, marginTop: 14 }}>
              {trackedIds.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📡</Text>
                  <Text style={styles.emptyTabTitle}>No tracked creators yet</Text>
                  <Text style={styles.emptyTabSub}>Swipe UP on any card in the deck to track their posting pace.</Text>
                </View>
              ) : (
                DECK_CREATORS.filter((c) => trackedIds.includes(c.id)).map((cr) => (
                  <View key={cr.id} style={styles.trackedCard}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <Image source={cr.coverImage} style={styles.trackedAvatar} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.trackedName}>{cr.name}</Text>
                          <Text style={styles.trackedStreakText}>🔥 {cr.streak}d streak</Text>
                        </View>
                        <Text style={styles.trackedRoleText}>{cr.role} • {cr.followers}</Text>
                        <Text style={styles.trackedStatusText}>🟢 {cr.activeStatus}</Text>
                      </View>
                    </View>

                    <View style={styles.trackedMetricsRow}>
                      <View style={styles.trackedMetricCol}>
                        <Text style={styles.trackedMetricVal}>{cr.audienceFit}%</Text>
                        <Text style={styles.trackedMetricLabel}>Audience Fit</Text>
                      </View>
                      <View style={styles.trackedMetricCol}>
                        <Text style={styles.trackedMetricVal}>{cr.formatSynergy}%</Text>
                        <Text style={styles.trackedMetricLabel}>Synergy</Text>
                      </View>
                      <View style={styles.trackedMetricCol}>
                        <Text style={styles.trackedMetricVal}>{cr.reliability}%</Text>
                        <Text style={styles.trackedMetricLabel}>Reliability</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Pressable
                        style={styles.trackedDeepDiveBtn}
                        onPress={() => handleOpenDeepDive(cr)}
                      >
                        <Text style={styles.trackedDeepDiveBtnText}>Deep Dive ➔</Text>
                      </Pressable>

                      <Pressable
                        style={styles.trackedMatchBtn}
                        onPress={() => {
                          swipeRight(cr);
                          setSegmentTab('deck');
                        }}
                      >
                        <Text style={styles.trackedMatchBtnText}>Match Now 💜</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 4: CONNECTED NETWORK                                      */}
          {/* ============================================================ */}
          {segmentTab === 'connected' && (
            <View style={{ gap: 12, marginTop: 14 }}>
              {connected.length === 0 ? (
                <View style={styles.emptyTabCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💜</Text>
                  <Text style={styles.emptyTabTitle}>No connected creators yet</Text>
                  <Text style={styles.emptyTabSub}>Swipe right on cards to connect with creators and start collaborating.</Text>
                </View>
              ) : (
                connected.map((conn) => (
                  <View key={conn.id} style={styles.connectedCard}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <Image source={conn.avatar} style={styles.connectedAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.connectedName}>{conn.name}</Text>
                        <Text style={styles.connectedRole}>{conn.role} • {conn.followers}</Text>
                        <Text style={styles.connectedStatusText}>✨ {conn.status}</Text>
                      </View>
                    </View>

                    <View style={styles.connectedCollabBox}>
                      <Text style={styles.connectedCollabLabel}>ACTIVE COLLAB CONCEPT</Text>
                      <Text style={styles.connectedCollabTitle}>{conn.activeCollab}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Pressable
                        style={styles.connectedMessageBtn}
                        onPress={() => onOpenMessages && onOpenMessages()}
                      >
                        <Text style={styles.connectedMessageBtnText}>Message 💬</Text>
                      </Pressable>

                      <Pressable
                        style={styles.connectedStartCollabBtn}
                        onPress={() => {
                          if (onOpenCollabIdea) {
                            onOpenCollabIdea({
                              name: conn.name,
                              handle: conn.handle,
                              niche: conn.role,
                              avatar: conn.avatar,
                              planIndex: 0,
                              title: conn.activeCollab,
                            });
                          } else if (onOpenMessages) {
                            onOpenMessages();
                          }
                        }}
                      >
                        <Text style={styles.connectedStartCollabBtnText}>Start Collab 🚀</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={(tab) => {
          setActiveTab(tab);
          if (onNavigateTab) onNavigateTab(tab);
        }} />

        {/* ============================================================ */}
        {/* MODAL 1: COLLAB DEEP DIVE INTELLIGENCE                       */}
        {/* ============================================================ */}
        <Modal
          visible={showDeepDiveModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeepDiveModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              {selectedCreator && (
                <>
                  <View style={styles.modalHeaderBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Image source={selectedCreator.coverImage} style={styles.modalHeaderAvatar} />
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.modalTitle}>{selectedCreator.name}</Text>
                          <TinyGoldCheck size={14} />
                        </View>
                        <Text style={styles.modalSubTitle}>{selectedCreator.role} • 🔥 {selectedCreator.streak}d</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setShowDeepDiveModal(false)} hitSlop={8}>
                      <Text style={styles.modalCloseText}>✕</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                    {/* Match Compatibility Gauge */}
                    <View style={styles.modalGaugeBox}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.modalGaugeTitle}>MATCH COMPATIBILITY</Text>
                        <Text style={styles.modalGaugeScore}>{selectedCreator.matchScore}%</Text>
                      </View>

                      <View style={styles.gaugeMetricsRow}>
                        <View style={styles.gaugeCol}>
                          <Text style={styles.gaugeVal}>{selectedCreator.audienceFit}%</Text>
                          <Text style={styles.gaugeLabel}>Audience Fit</Text>
                        </View>
                        <View style={styles.gaugeCol}>
                          <Text style={styles.gaugeVal}>{selectedCreator.formatSynergy}%</Text>
                          <Text style={styles.gaugeLabel}>Format Harmony</Text>
                        </View>
                        <View style={styles.gaugeCol}>
                          <Text style={styles.gaugeVal}>{selectedCreator.reliability}%</Text>
                          <Text style={styles.gaugeLabel}>Reliability</Text>
                        </View>
                      </View>
                    </View>

                    {/* Jarvis AI Rationale */}
                    <LinearGradient
                      colors={['#2A1454', '#1E0C3E', '#14072C']}
                      style={styles.modalJarvisCard}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Image
                          source={require('../../assets/images/jarvis-core-flame.png')}
                          style={{ width: 18, height: 18 }}
                          resizeMode="contain"
                        />
                        <Text style={styles.modalJarvisTitle}>Jarvis Match Intelligence</Text>
                      </View>
                      <Text style={styles.modalJarvisText}>&ldquo;{selectedCreator.jarvisRationale}&rdquo;</Text>
                    </LinearGradient>

                    {/* 3 AI Collab Concepts */}
                    <Text style={styles.modalSectionHeader}>PROPOSED COLLAB CONCEPTS</Text>
                    <View style={{ gap: 8, marginTop: 6 }}>
                      {selectedCreator.collabConcepts.map((concept) => (
                        <View key={concept.id} style={styles.conceptCard}>
                          <Text style={styles.conceptCardTitle}>{concept.title}</Text>
                          <Text style={styles.conceptCardHook}>Hook: &ldquo;{concept.hook}&rdquo;</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <Text style={styles.conceptCardFormat}>{concept.format}</Text>
                            <Pressable
                              style={styles.proposeConceptBtn}
                              onPress={() => handleLaunchCollabConcept(selectedCreator, concept)}
                            >
                              <Text style={styles.proposeConceptBtnText}>Propose ➔</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Modal Footer Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <Pressable
                      style={styles.modalMessageBtn}
                      onPress={() => {
                        setShowDeepDiveModal(false);
                        if (onOpenMessages) onOpenMessages();
                      }}
                    >
                      <Text style={styles.modalMessageBtnText}>Message 💬</Text>
                    </Pressable>

                    <Pressable
                      style={styles.modalMatchBtn}
                      onPress={() => {
                        setShowDeepDiveModal(false);
                        swipeRight(selectedCreator);
                      }}
                    >
                      <Text style={styles.modalMatchBtnText}>Collab Match 💜</Text>
                    </Pressable>
                  </View>
                </>
              )}
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

        {/* 3D GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCompletionModal}
          title={completionData.title}
          subtitle={completionData.subtitle}
          badgeText={completionData.badgeText}
          xpEarned={completionData.xpEarned}
          speechBubble={completionData.speechBubble}
          onDismiss={() => setShowCompletionModal(false)}
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
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },

  // 1. TOP HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameHaloBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },
  headerStreakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },

  // 2. PILL BADGES ROW
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  creatorRadarBadge: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  creatorRadarBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  swipeToMatchBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  swipeToMatchBadgeText: {
    color: '#582CDB',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // 3. HEADLINE
  mainHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 6,
  },
  subHeadline: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },

  // 4. SUMMARY STATS DECK
  summaryStatsDeck: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  summaryItemSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // 5. SEGMENTED TABS BAR
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: '#EFECE6',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#171420',
    fontWeight: '900',
  },
  segmentRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },

  // 6. FILTER PILLS ROW
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  filterPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // 7. SWIPING DECK & HERO CARD
  deckContainer: {
    height: SCREEN_HEIGHT * 0.58,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  underneathCard: {
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.85,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // STAMPS
  stampBox: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 3,
    zIndex: 10,
  },
  stampMatch: {
    right: 30,
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    transform: [{ rotate: '15deg' }],
  },
  stampMatchText: {
    color: '#22C55E',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stampPass: {
    left: 30,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    transform: [{ rotate: '-15deg' }],
  },
  stampPassText: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stampTrack: {
    alignSelf: 'center',
    top: '40%',
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  stampTrackText: {
    color: '#F59E0B',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // TOP CARD OVERLAY
  cardTopOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  activeTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  activeTodayText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
  },
  trackingBadgeBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  trackingBadgeBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  trackingBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#92400E',
  },
  trackingBadgeTextActive: {
    color: '#FFFFFF',
  },
  infoRoundBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRoundBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },

  // BOTTOM CARD OVERLAY
  cardBottomContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 5,
  },
  creatorNameText: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  verifiedCheckCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  streakPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FDE68A',
  },
  deepDivePillBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  deepDivePillBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  creatorRoleLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 2,
    marginBottom: 6,
  },
  creatorBioText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 10,
  },
  creatorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  creatorTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  creatorTagPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // EMPTY DECK
  emptyDeckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginVertical: 20,
  },
  emptyDeckTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  emptyDeckSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  reloadDeckBtn: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  reloadDeckBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // GESTURE GUIDE
  gestureGuideBar: {
    backgroundColor: '#FAF8F5',
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gestureGuideText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },

  // FAST ACTION BUTTONS ROW
  fastActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  actionCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
  },
  passActionBtn: {
    borderColor: '#FCA5A5',
  },
  trackActionBtn: {
    borderColor: '#FDE68A',
  },
  superActionBtn: {
    borderColor: '#A78BFA',
    backgroundColor: '#F5F3FF',
  },
  matchActionBtn: {
    borderColor: '#C084FC',
    backgroundColor: '#FAF5FF',
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  // TAB CONTENT STYLES
  emptyTabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  emptyTabTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#171420',
  },
  emptyTabSub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
  },

  // REQUESTS CARD
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  requestScorePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  requestScoreText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  requestRoleLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  requestTimeText: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  requestPitchBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestPitchText: {
    fontSize: 11.5,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  requestConceptPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  requestConceptPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  requestDeclineBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestDeclineBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  requestMessageBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestMessageBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  requestAcceptBtn: {
    flex: 1.2,
    backgroundColor: '#582CDB',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestAcceptBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // TRACKED CARD
  trackedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  trackedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  trackedName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
  },
  trackedStreakText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D97706',
  },
  trackedRoleText: {
    fontSize: 11,
    color: '#64748B',
  },
  trackedStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  trackedMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackedMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  trackedMetricVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  trackedMetricLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  trackedDeepDiveBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  trackedDeepDiveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  trackedMatchBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  trackedMatchBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CONNECTED CARD
  connectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  connectedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  connectedName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
  },
  connectedRole: {
    fontSize: 11,
    color: '#64748B',
  },
  connectedStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    marginTop: 2,
  },
  connectedCollabBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectedCollabLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  connectedCollabTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
    marginTop: 2,
  },
  connectedMessageBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectedMessageBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  connectedStartCollabBtn: {
    flex: 1.2,
    backgroundColor: '#582CDB',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectedStartCollabBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
  },
  modalSubTitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#94A3B8',
  },
  modalGaugeBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  modalGaugeTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  modalGaugeScore: {
    fontSize: 16,
    fontWeight: '900',
    color: '#582CDB',
  },
  gaugeMetricsRow: {
    flexDirection: 'row',
  },
  gaugeCol: {
    flex: 1,
    alignItems: 'center',
  },
  gaugeVal: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#171420',
  },
  gaugeLabel: {
    fontSize: 8.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalJarvisCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  modalJarvisTitle: {
    color: '#A78BFA',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  modalJarvisText: {
    color: '#F1F5F9',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  modalSectionHeader: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  conceptCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conceptCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },
  conceptCardHook: {
    fontSize: 10.5,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 3,
    lineHeight: 14,
  },
  conceptCardFormat: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
    paddingRight: 6,
  },
  proposeConceptBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proposeConceptBtnText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  modalMessageBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalMessageBtnText: {
    color: '#171420',
    fontSize: 12,
    fontWeight: '800',
  },
  modalMatchBtn: {
    flex: 1.5,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalMatchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
