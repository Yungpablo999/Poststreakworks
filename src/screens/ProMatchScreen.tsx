import { SocialBrandIcon } from '../components/SocialBrandIcon';
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
  onOpenPostComposer?: (ideaTitle?: string) => void;
  onOpenCollabIdea?: (partnerData: {
    name: string;
    handle: string;
    niche: string;
    avatar: any;
    planIndex: number;
    title: string;
  }) => void;
  onOpenSquad?: () => void;
  onOpenFindSquad?: () => void;
  onSwitchToFree?: () => void;
  initialFilter?: 'all' | 'priority' | 'niche' | 'streak' | 'nearby' | 'ai';
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface CollabConcept {
  id: string;
  title: string;
  hook: string;
  format: string;
  timing: string;
  potentialBadge: string;
  description: string;
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
  categoryTags: string[];
  streak: number;
  platformsText: string;
  platforms?: string[];
  matchScore: number;
  activeStatus: string;
  isTracked: boolean;
  audienceFit: number;
  formatSynergy: number;
  reliability: number;
  whyMatchDesc: string;
  potentialBoostText: string;
  proposedConcept: CollabConcept;
  isPriorityCrown?: boolean;
  crownBadgeText?: string;
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
    categoryTags: ['Lifestyle', 'Travel', 'Storytelling', 'Available This Week'],
    streak: 44,
    platformsText: 'IG + YT',
    platforms: ['instagram', 'youtube'],
    matchScore: 96,
    activeStatus: 'Active today (Posted 2h ago)',
    isTracked: true,
    isPriorityCrown: true,
    crownBadgeText: '👑 TOP 2% PRIORITY MATCH',
    audienceFit: 94,
    formatSynergy: 98,
    reliability: 92,
    whyMatchDesc:
      'Your audiences overlap in lifestyle, travel and personality-led storytelling. A joint Reel could help both creators reach new viewers with strong short-form chemistry.',
    potentialBoostText: 'Potential boost: high discovery crossover for Reels.',
    proposedConcept: {
      id: 'c1',
      title: '24 Hours Creating in Lagos',
      hook: 'We traded content workflows for 24 hours in Lagos. Here is what broke first...',
      format: 'Reel (30–45 sec)',
      timing: 'Sat, 2 PM',
      potentialBadge: 'High discovery potential',
      description:
        'A fast-moving lifestyle collaboration showing how two creators work, explore and create in the city.',
    },
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
    categoryTags: ['Tech', 'AI Systems', 'Productivity', 'Available This Week'],
    streak: 52,
    platformsText: 'X + YT',
    platforms: ['x', 'youtube'],
    matchScore: 94,
    activeStatus: 'Active today (Posted 4h ago)',
    isTracked: false,
    isPriorityCrown: true,
    crownBadgeText: '👑 TOP 2% PRIORITY MATCH',
    audienceFit: 92,
    formatSynergy: 96,
    reliability: 95,
    whyMatchDesc:
      'David has an exceptionally high tech retention rate. Co-producing an AI workflow review will drive cross-pollination from high-value tech enthusiasts.',
    potentialBoostText: 'Potential boost: strong authority elevation in tech & creator tools.',
    proposedConcept: {
      id: 'cd1',
      title: 'The 3-App Stack That Replaced an Entire Production Team',
      hook: 'We tested 12 AI tools so you don’t have to. These 3 run our entire workflow.',
      format: 'Reel (45–60 sec)',
      timing: 'Sun, 6 PM',
      potentialBadge: 'High viral potential',
      description:
        'A structured breakdown of modern production tools that allow solo creators to produce like a 5-person agency.',
    },
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
    categoryTags: ['Fitness', 'Wellness', 'Daily Routine', 'Available This Week'],
    streak: 39,
    platformsText: 'IG + TT',
    platforms: ['instagram', 'tiktok'],
    matchScore: 91,
    activeStatus: 'Active today (Posted 1h ago)',
    isTracked: false,
    isPriorityCrown: true,
    crownBadgeText: '👑 PRIORITY MATCH',
    audienceFit: 88,
    formatSynergy: 94,
    reliability: 96,
    whyMatchDesc:
      'Elena provides a perfect lifestyle-wellness hook angle. A routine swap or energy management breakdown aligns seamlessly with creator sustainability.',
    potentialBoostText: 'Potential boost: cross-niche audience expansion into lifestyle & health.',
    proposedConcept: {
      id: 'ce1',
      title: 'The 5 AM Creator Energy Routine',
      hook: 'Can a non-morning creator survive an Olympic morning routine for 7 days?',
      format: 'Shorts / Reel',
      timing: 'Mon, 7 AM',
      potentialBadge: 'High engagement potential',
      description:
        'A high-energy routine challenge showing practical habit adjustments for creators building daily streaks.',
    },
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
    categoryTags: ['Business', 'Monetization', 'Growth', 'Available This Week'],
    streak: 61,
    platformsText: 'LI + X',
    platforms: ['linkedin', 'x'],
    matchScore: 95,
    activeStatus: 'Active today (Posted 5h ago)',
    isTracked: false,
    isPriorityCrown: true,
    crownBadgeText: '👑 TOP 2% PRIORITY MATCH',
    audienceFit: 96,
    formatSynergy: 95,
    reliability: 98,
    whyMatchDesc:
      'Marcus specializes in high-converting monetization hooks. Collaborating with him will elevate your authority in business and monetization spaces.',
    potentialBoostText: 'Potential boost: unlocks high-ticket creator sponsorships & revenue.',
    proposedConcept: {
      id: 'cm1',
      title: 'Turn 1,000 Views into $1,000 Monthly Revenue',
      hook: 'Most creators monetize completely backwards. Here is the low-friction playbook.',
      format: 'Carousel & Thread',
      timing: 'Wed, 11 AM',
      potentialBadge: 'High conversion potential',
      description:
        'A concrete step-by-step case study demonstrating how micro-creators generate predictable creator income.',
    },
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
  onOpenPostComposer,
  onOpenCollabIdea,
  onOpenSquad,
  onOpenFindSquad,
  onSwitchToFree,
  initialFilter = 'priority',
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [segmentTab, setSegmentTab] = useState<'deck' | 'requests' | 'tracked' | 'connected'>('deck');
  const [activeFilter, setActiveFilter] = useState<'all' | 'priority' | 'niche' | 'streak' | 'nearby' | 'ai'>(
    initialFilter || 'priority'
  );

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);
  const [matchesLeft, setMatchesLeft] = useState(5);

  // Deck & Lists
  const [deck, setDeck] = useState<CreatorCardData[]>(DECK_CREATORS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [requests, setRequests] = useState(INCOMING_REQUESTS_INITIAL);
  const [connected, setConnected] = useState(CONNECTED_CREATORS_INITIAL);
  const [trackedIds, setTrackedIds] = useState<string[]>(['amara']);

  // Touch isolation state (disables outer ScrollView while dragging cards)
  const [isSwipingCard, setIsSwipingCard] = useState(false);

  // Modals & Feedback
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorCardData | null>(DECK_CREATORS[0]);
  const [showDuelArenaModal, setShowDuelArenaModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    xpEarned: number;
    speechBubble: string;
    actionText?: string;
    onAction?: () => void;
  }>({
    title: 'Collab Match Made!',
    subtitle: 'You and Amara Okafor are matched to build together.',
    badgeText: '✨ COLLAB UNLOCKED (+150 XP)',
    xpEarned: 150,
    speechBubble: 'Boom! High-synergy match secured. Time to build viral content, Pablo! 🔥',
    actionText: 'Continue',
    onAction: undefined,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Card Swiping Animations
  const position = useRef(new Animated.ValueXY()).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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

  useEffect(() => {
    // Mascot floating animation
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

  const triggerModalPop = () => {
    modalPopScale.setValue(0.92);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // PanResponder for Interactive Deck Swiping (Horizontal Only with Vertical Scroll Passthrough)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4;
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4;
      },
      onPanResponderGrant: () => {
        setIsSwipingCard(true);
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.2 });
      },
      onPanResponderRelease: (_, gesture) => {
        setIsSwipingCard(false);
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        setIsSwipingCard(false);
        resetPosition();
      },
      onPanResponderTerminationRequest: () => true,
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
      // MATCH (Unlimited for Pro)
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
          activeCollab: creator.proposedConcept.title,
        },
        ...prev,
      ]);

      const creatorKey = `conv_${creator.name.split(' ')[0].toLowerCase()}`;

      setCompletionData({
        title: 'Collab Match Made!',
        subtitle: `You and ${creator.name} are matched to build together.`,
        badgeText: '✨ COLLAB UNLOCKED (+150 XP)',
        xpEarned: 150,
        speechBubble: `High-synergy match secured with ${creator.name}! Tap below to open chat and start filming! 🔥`,
        actionText: `Chat with ${creator.name.split(' ')[0]} 💬`,
        onAction: () => {
          setShowCompletionModal(false);
          if (onOpenMessages) onOpenMessages(creatorKey);
        },
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

    const creatorKey = req.name.toLowerCase().includes('kemi')
      ? 'conv_kemi'
      : req.name.toLowerCase().includes('tomi')
      ? 'conv_tomi'
      : `conv_${req.name.split(' ')[0].toLowerCase()}`;

    setCompletionData({
      title: 'Collaboration Accepted!',
      subtitle: `You and ${req.name} are now connected to collaborate.`,
      badgeText: '🤝 CREATOR TEAM UNLOCKED (+100 XP)',
      xpEarned: 100,
      speechBubble: `${req.name} is waiting in your inbox! Tap below to open chat and plan your collab! 🔥`,
      actionText: `Chat with ${req.name.split(' ')[0]} 💬`,
      onAction: () => {
        setShowCompletionModal(false);
        if (onOpenMessages) {
          onOpenMessages(creatorKey);
        }
      },
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

  const handleLaunchCollabPlan = (creator: CreatorCardData) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Collab Proposal Dispatched!',
      subtitle: `Your "${creator.proposedConcept.title}" plan was pitched to ${creator.name}.`,
      badgeText: '⚡ PROPOSAL DISPATCHED (+75 XP)',
      xpEarned: 75,
      speechBubble: `Awesome proposal, Pablo! ${creator.name.split(' ')[0]} will be notified. Tap below to review the full production plan! 🔥`,
      actionText: 'View Collaboration Plan ➔',
      onAction: () => {
        setShowCompletionModal(false);
        if (onOpenCollabIdea) {
          onOpenCollabIdea({
            name: creator.name,
            handle: creator.handle,
            niche: creator.role,
            avatar: creator.coverImage,
            planIndex: 0,
            title: creator.proposedConcept.title,
          });
        } else if (onOpenMessages) {
          onOpenMessages(`conv_${creator.name.split(' ')[0].toLowerCase()}`);
        }
      },
    });
    setShowCompletionModal(true);
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
        {/* 1. TOP APP HEADER (EXACT STANDARD PRO HEADER)                 */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot + Mode Switcher */}
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
                source={require('../../assets/images/jarvis-core-flame.png')}
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
              {requests.length > 0 && <View style={styles.notificationDot} />}
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
                source={userProfile?.avatarSource || require('../../assets/images/amara-avatar.jpg')}
                style={styles.headerCustomAvatarImage}
                resizeMode="cover"
              />
              <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Scrollable Container with Swipe Isolation */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSwipingCard}
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
              <Text style={styles.summaryItemText}>⭐ Unlimited</Text>
              <Text style={styles.summaryItemSub}>Pro Matches</Text>
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
          {/* TAB 1: SWIPING MATCH DECK                                    */}
          {/* ============================================================ */}
          {segmentTab === 'deck' && (
            <View style={{ marginTop: 4 }}>
              {/* FILTER PILLS ROW */}
              <View style={styles.filterPillsRow}>
                {[
                  { id: 'priority', label: '👑 Priority Matches' },
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

              {currentCreator ? (
                <>
                  {/* TINDER SWIPEABLE CARD CONTAINER */}
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
                        {/* Left: Active Today & Priority Crown Pill */}
                        <View style={{ flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          {currentCreator.isPriorityCrown && (
                            <View style={styles.priorityCrownCardPill}>
                              <Text style={styles.priorityCrownCardPillText}>
                                {currentCreator.crownBadgeText || '👑 TOP 2% PRIORITY MATCH'}
                              </Text>
                            </View>
                          )}
                          <View style={styles.activeTodayPill}>
                            <View style={styles.greenPulseDot} />
                            <Text style={styles.activeTodayText}>🟢 {currentCreator.activeStatus}</Text>
                          </View>
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
                        {/* Name & Streak Row with Priority Crown */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <Text style={styles.creatorNameText}>{currentCreator.name}</Text>
                            {currentCreator.isPriorityCrown && (
                              <View style={styles.crownEmblemBox}>
                                <Text style={{ fontSize: 14 }}>👑</Text>
                              </View>
                            )}
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

                        {/* Role, Platforms & Location */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={[styles.creatorRoleLocationText, { flex: 1 }]} numberOfLines={1}>
                            {currentCreator.role} • {currentCreator.followers} • 📍 {currentCreator.location}
                          </Text>
                          {currentCreator.platforms && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 6 }}>
                              {currentCreator.platforms.map((p, pIdx) => (
                                <SocialBrandIcon key={pIdx} platform={p} size={16} />
                              ))}
                            </View>
                          )}
                        </View>

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

                  {/* Gesture Guide Bar */}
                  <View style={styles.gestureGuideBar}>
                    <Text style={styles.gestureGuideText}>
                      👈 Swipe left to decline  •  👆 Up to track  •  Right to accept 👉
                    </Text>
                  </View>

                  {/* ============================================================ */}
                  {/* SECTION 6: AI COLLABORATION PLAN CARD                        */}
                  {/* ============================================================ */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={styles.sectionTitle}>AI Collaboration Plan</Text>
                      <View style={styles.proAiMatchPill}>
                        <Text style={styles.proAiMatchPillText}>PRO AI MATCH INSIGHT</Text>
                      </View>
                    </View>

                    <View style={styles.aiCollabPlanCard}>
                      <Text style={styles.proposedConceptSub}>PROPOSED CONCEPT</Text>
                      <Text style={styles.proposedConceptTitle}>
                        &ldquo;{currentCreator.proposedConcept.title}&rdquo;
                      </Text>
                      <Text style={styles.proposedConceptDesc}>
                        {currentCreator.proposedConcept.description}
                      </Text>

                      {/* Meta Chips */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 12 }}>
                        <View style={styles.conceptMetaChip}>
                          <Text style={styles.conceptMetaChipText}>
                            🎬 {currentCreator.proposedConcept.format}
                          </Text>
                        </View>
                        <View style={styles.conceptMetaChip}>
                          <Text style={styles.conceptMetaChipText}>
                            📅 {currentCreator.proposedConcept.timing}
                          </Text>
                        </View>
                        <View style={styles.goldenMetaChip}>
                          <Text style={styles.goldenMetaChipText}>
                            📈 {currentCreator.proposedConcept.potentialBadge}
                          </Text>
                        </View>
                      </View>

                      {/* Build Collaboration Plan Button */}
                      <Pressable
                        style={({ pressed }) => [styles.buildCollabPlanBtn, pressed && styles.btnPressed]}
                        onPress={() => handleLaunchCollabPlan(currentCreator)}
                      >
                        <Text style={styles.buildCollabPlanBtnText}>Build Collaboration Plan</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* ============================================================ */}
                  {/* SECTION 10: YOUR CREATOR SQUAD                               */}
                  {/* ============================================================ */}
                  <View style={{ marginTop: 22 }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Your Creator Squad</Text>
                    <View style={styles.squadCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={styles.squadNameText}>Momentum Makers</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <View style={styles.squadLevelPill}>
                              <Text style={styles.squadLevelPillText}>LEVEL 12</Text>
                            </View>
                            <Text style={styles.squadStreakText}>18-Day Streak</Text>
                          </View>
                        </View>

                        {/* Overlapping Avatar Stack */}
                        <View style={styles.avatarStackRow}>
                          <Image source={require('../../assets/images/elena-avatar.jpg')} style={[styles.stackAvatar, { zIndex: 3 }]} />
                          <Image source={require('../../assets/images/marcus-avatar.jpg')} style={[styles.stackAvatar, { marginLeft: -10, zIndex: 2 }]} />
                          <Image source={require('../../assets/images/david-avatar.jpg')} style={[styles.stackAvatar, { marginLeft: -10, zIndex: 1 }]} />
                          <View style={[styles.stackAvatarPlus, { marginLeft: -10 }]}>
                            <Text style={styles.stackAvatarPlusText}>+1</Text>
                          </View>
                        </View>
                      </View>

                      {/* Goals Row */}
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 10 }}>
                        <Text style={styles.squadGoalText}>✓ Goal: 5 posts this week</Text>
                        <Text style={styles.squadGoalText}>⚡ 3 of 4 active today</Text>
                      </View>

                      {/* XP Progress Bar */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.squadXpLabel}>8,450 XP</Text>
                        <Text style={styles.squadXpLabel}>LEVEL 13</Text>
                      </View>
                      <View style={styles.squadTrack}>
                        <View style={[styles.squadFill, { width: '75%' }]} />
                      </View>

                      <Text style={styles.nextUnlockText}>✨ Next unlock: Priority Match Boost</Text>

                      {/* Squad Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Pressable
                          style={({ pressed }) => [styles.openSquadBtn, pressed && styles.btnPressed]}
                          onPress={() => {
                            if (onOpenSquad) {
                              onOpenSquad();
                            } else {
                              showToast('🛡️ Opened Momentum Makers squad room');
                            }
                          }}
                        >
                          <Text style={styles.openSquadBtnText}>Open Squad</Text>
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [styles.findSquadBtn, pressed && styles.btnPressed]}
                          onPress={() => {
                            if (onOpenFindSquad) {
                              onOpenFindSquad();
                            } else {
                              showToast('🔍 Searching creator squads in your niche...');
                            }
                          }}
                        >
                          <Text style={styles.findSquadBtnText}>Find a Squad</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* ============================================================ */}
                  {/* SECTION 11: LUXURY LIVE SQUAD DUEL ARENA BANNER             */}
                  {/* ============================================================ */}
                  <View style={styles.liveDuelBanner}>
                    {/* Top Ribbon */}
                    <View style={styles.duelTopRibbon}>
                      <View style={styles.duelLivePill}>
                        <View style={styles.duelLivePulseDot} />
                        <Text style={styles.duelLivePillText}>SQUAD LIVE DUEL</Text>
                      </View>
                      <View style={styles.duelTimerBadge}>
                        <Text style={styles.duelTimerText}>⏳ Ends in 03h 45m</Text>
                      </View>
                    </View>

                    {/* Matchup VS Showcase */}
                    <View style={styles.duelMatchupRow}>
                      {/* Left Team: You */}
                      <View style={styles.duelTeamColLeft}>
                        <View style={styles.duelAvatarStackMini}>
                          <Image source={require('../../assets/images/elena-avatar.jpg')} style={[styles.duelStackImg, { zIndex: 2 }]} />
                          <Image source={require('../../assets/images/amara-avatar.jpg')} style={[styles.duelStackImg, { marginLeft: -8, zIndex: 1 }]} />
                        </View>
                        <Text style={styles.duelTeamNameMine} numberOfLines={1}>Momentum Makers</Text>
                        <View style={styles.duelScoreMinePill}>
                          <Text style={styles.duelScoreMineText}>62 PTS</Text>
                          <Text style={styles.duelLeadText}>👑 Leading</Text>
                        </View>
                      </View>

                      {/* Center VS Emblem */}
                      <View style={styles.duelVsCenterEmblem}>
                        <Text style={styles.duelVsCenterText}>VS</Text>
                      </View>

                      {/* Right Team: Opponent */}
                      <View style={styles.duelTeamColRight}>
                        <View style={styles.duelAvatarStackMiniRight}>
                          <Image source={require('../../assets/images/david-avatar.jpg')} style={[styles.duelStackImg, { zIndex: 2 }]} />
                          <Image source={require('../../assets/images/kemi-avatar.jpg')} style={[styles.duelStackImg, { marginLeft: -8, zIndex: 1 }]} />
                        </View>
                        <Text style={styles.duelTeamNameOpp} numberOfLines={1}>Lagos Storytellers</Text>
                        <View style={styles.duelScoreOppPill}>
                          <Text style={styles.duelScoreOppText}>58 PTS</Text>
                          <Text style={styles.duelTrailingText}>-4 pts</Text>
                        </View>
                      </View>
                    </View>

                    {/* Tug of War Progress Track */}
                    <View style={styles.duelTugTrackContainer}>
                      <View style={[styles.duelTugFillMine, { width: '55%' }]} />
                      <View style={[styles.duelTugFillOpp, { width: '45%' }]} />
                    </View>

                    {/* Gauntlet Mission */}
                    <View style={styles.duelMissionBox}>
                      <Text style={styles.duelMissionLabel}>🎯 ACTIVE GAUNTLET</Text>
                      <Text style={styles.duelMissionDesc}>Post 3 Collab Reels with #PostStreak • 500 XP Bounty</Text>
                    </View>

                    {/* View Duel CTA Button */}
                    <Pressable
                      style={({ pressed }) => [styles.viewDuelBtn, pressed && styles.btnPressed]}
                      onPress={() => setShowDuelArenaModal(true)}
                    >
                      <LinearGradient
                        colors={['#784DF0', '#582CDB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.viewDuelGradient}
                      >
                        <Text style={styles.viewDuelBtnText}>⚔️ Enter Live Duel Arena</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>

                  {/* ============================================================ */}
                  {/* SECTION 12: QUICK ACTIONS                                    */}
                  {/* ============================================================ */}
                  <View style={{ marginTop: 22 }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Quick Actions</Text>
                    <View style={{ gap: 8 }}>
                      {/* Row 1: Tomi Adebayo */}
                      <View style={styles.quickActionRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Image source={require('../../assets/images/tomi-avatar.jpg')} style={styles.quickActionAvatar} />
                          <View>
                            <Text style={styles.quickActionName}>Tomi Adebayo</Text>
                            <Text style={styles.quickActionSub}>Idea waiting • 2h ago</Text>
                          </View>
                        </View>
                        <Pressable
                          style={styles.openPlanBtn}
                          onPress={() => {
                            if (onOpenCollabIdea) {
                              onOpenCollabIdea({
                                name: 'Tomi Adebayo',
                                handle: '@tomi_tech',
                                niche: 'Tech & Gadgets',
                                avatar: require('../../assets/images/tomi-avatar.jpg'),
                                planIndex: 0,
                                title: 'Extreme Creator Studio Upgrades Under $100',
                              });
                            }
                          }}
                        >
                          <Text style={styles.openPlanBtnText}>Open Plan</Text>
                        </Pressable>
                      </View>

                      {/* Row 2: Zainab Okafor */}
                      <View style={styles.quickActionRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Image source={require('../../assets/images/zainab-avatar.jpg')} style={styles.quickActionAvatar} />
                          <View>
                            <Text style={styles.quickActionName}>Zainab Okafor</Text>
                            <Text style={styles.quickActionSub}>Mutual Match</Text>
                          </View>
                        </View>
                        <Pressable
                          style={styles.messageGreyBtn}
                          onPress={() => onOpenMessages && onOpenMessages('conv_zainab')}
                        >
                          <Text style={styles.messageGreyBtnText}>Message</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* ============================================================ */}
                  {/* SECTION 13: JARVIS CORE INTELLIGENCE HERO CARD               */}
                  {/* ============================================================ */}
                  <View style={styles.jarvisCoreHeroCard}>
                    <View style={styles.jarvisCoreIconCircle}>
                      <Image
                        source={require('../../assets/images/jarvis-core-flame.png')}
                        style={{ width: 26, height: 26 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.jarvisCoreQuote}>
                      &ldquo;Creators who publish on a similar rhythm are more likely to complete collaborations successfully.&rdquo;
                    </Text>
                    <Text style={styles.jarvisCoreTag}>JARVIS CORE INTELLIGENCE</Text>
                  </View>
                </>
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

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Pressable
                        style={styles.requestDeclineBtn}
                        onPress={() => handleDeclineRequest(req.id)}
                      >
                        <Text style={styles.requestDeclineBtnText}>Decline</Text>
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
                        onPress={() => {
                          const threadKey = conn.name.toLowerCase().includes('kemi')
                            ? 'conv_kemi'
                            : conn.name.toLowerCase().includes('tomi')
                            ? 'conv_tomi'
                            : `conv_${conn.name.split(' ')[0].toLowerCase()}`;
                          if (onOpenMessages) onOpenMessages(threadKey);
                        }}
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
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

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
                      <Text style={styles.modalJarvisText}>&ldquo;{selectedCreator.whyMatchDesc}&rdquo;</Text>
                    </LinearGradient>

                    {/* Collab Concept */}
                    <Text style={styles.modalSectionHeader}>PROPOSED COLLAB CONCEPT</Text>
                    <View style={styles.conceptCard}>
                      <Text style={styles.conceptCardTitle}>{selectedCreator.proposedConcept.title}</Text>
                      <Text style={styles.conceptCardHook}>Hook: &ldquo;{selectedCreator.proposedConcept.hook}&rdquo;</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Text style={styles.conceptCardFormat}>{selectedCreator.proposedConcept.format}</Text>
                        <Pressable
                          style={styles.proposeConceptBtn}
                          onPress={() => {
                            setShowDeepDiveModal(false);
                            setTimeout(() => {
                              handleLaunchCollabPlan(selectedCreator);
                            }, 150);
                          }}
                        >
                          <Text style={styles.proposeConceptBtnText}>Propose ➔</Text>
                        </Pressable>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Modal Footer Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <Pressable
                      style={styles.modalMessageBtn}
                      onPress={() => {
                        setShowDeepDiveModal(false);
                        const threadKey = selectedCreator.name.toLowerCase().includes('kemi')
                          ? 'conv_kemi'
                          : selectedCreator.name.toLowerCase().includes('tomi')
                          ? 'conv_tomi'
                          : `conv_${selectedCreator.name.split(' ')[0].toLowerCase()}`;
                        if (onOpenMessages) onOpenMessages(threadKey);
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

        {/* ============================================================ */}
        {/* SQUAD LIVE DUEL ARENA CENTERED DIALOG MODAL                  */}
        {/* ============================================================ */}
        <Modal
          visible={showDuelArenaModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDuelArenaModal(false)}
        >
          <View style={styles.arenaModalOverlay}>
            <Pressable style={styles.arenaModalBackdrop} onPress={() => setShowDuelArenaModal(false)} />
            <View style={styles.arenaModalCard}>
              {/* Top Modal Header */}
              <View style={styles.arenaTopHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.arenaSwordsIconBox}>
                    <Text style={{ fontSize: 16 }}>⚔️</Text>
                  </View>
                  <View>
                    <Text style={styles.arenaTitle}>Live Squad Duel Arena</Text>
                    <Text style={styles.arenaSubtitle}>Round 2 of 3 • Ends in 03h 45m</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.arenaCloseBtn}
                  onPress={() => setShowDuelArenaModal(false)}
                  hitSlop={8}
                >
                  <Text style={styles.arenaCloseText}>✕</Text>
                </Pressable>
              </View>

              {/* Matchup Comparison Card */}
              <LinearGradient
                colors={['#2A1259', '#1A0C38']}
                style={styles.arenaMatchupCard}
              >
                <View style={styles.arenaTeamsRow}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.arenaTeamTitleMine}>Momentum Makers</Text>
                    <Text style={styles.arenaTeamScoreMine}>62 PTS</Text>
                    <View style={styles.arenaLeadBadge}>
                      <Text style={styles.arenaLeadBadgeText}>👑 IN THE LEAD</Text>
                    </View>
                  </View>

                  <View style={styles.arenaVsCircle}>
                    <Text style={styles.arenaVsText}>VS</Text>
                  </View>

                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.arenaTeamTitleOpp}>Lagos Storytellers</Text>
                    <Text style={styles.arenaTeamScoreOpp}>58 PTS</Text>
                    <View style={styles.arenaTrailingBadge}>
                      <Text style={styles.arenaTrailingBadgeText}>4 PTS BEHIND</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.arenaTugBar}>
                  <View style={[styles.arenaTugMine, { width: '55%' }]} />
                  <View style={[styles.arenaTugOpp, { width: '45%' }]} />
                </View>
              </LinearGradient>

              {/* Duel Objectives & Tasks */}
              <View style={styles.arenaObjectivesSection}>
                <Text style={styles.arenaSectionHeading}>LIVE OBJECTIVES</Text>

                <View style={styles.arenaTasksList}>
                  <View style={styles.arenaTaskRow}>
                    <Text style={styles.arenaCheckGreen}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.arenaTaskTitle}>Elena Rostova: Posted Reel</Text>
                      <Text style={styles.arenaTaskSub}>Earned +15 pts for squad</Text>
                    </View>
                    <Text style={styles.arenaTaskPts}>+15 pts</Text>
                  </View>

                  <View style={styles.arenaTaskRow}>
                    <Text style={styles.arenaCheckGreen}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.arenaTaskTitle}>Amara & Tomi: Duet Reel Collab</Text>
                      <Text style={styles.arenaTaskSub}>Earned +20 pts for squad</Text>
                    </View>
                    <Text style={styles.arenaTaskPts}>+20 pts</Text>
                  </View>

                  <View style={styles.arenaTaskRowPending}>
                    <Text style={{ fontSize: 13, color: '#F59E0B' }}>⚡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.arenaTaskTitle, { color: '#171420', fontWeight: '900' }]}>
                        Pablo: Post Short-Form Draft
                      </Text>
                      <Text style={styles.arenaTaskSub}>Score +15 pts to extend your lead!</Text>
                    </View>
                    <Pressable
                      style={styles.arenaQuickSubmitBtn}
                      onPress={() => {
                        setShowDuelArenaModal(false);
                        if (onOpenPostComposer) {
                          onOpenPostComposer('Live Squad Duel Gauntlet Reel');
                        }
                      }}
                    >
                      <Text style={styles.arenaQuickSubmitText}>Log +15</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Bounty Reward Box */}
              <View style={styles.arenaBountyBox}>
                <Text style={styles.arenaBountyTitle}>🏆 SQUAD BOUNTY PRIZE POOL</Text>
                <Text style={styles.arenaBountyDesc}>+500 XP Shared Bounty • 7-Day Streak Shield • Arena Champion Crown</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.arenaActionsRow}>
                <Pressable
                  style={styles.arenaChatBtn}
                  onPress={() => {
                    setShowDuelArenaModal(false);
                    if (onOpenSquad) onOpenSquad();
                  }}
                >
                  <Text style={styles.arenaChatBtnText}>Squad Live Room</Text>
                </Pressable>

                <Pressable
                  style={styles.arenaScoreBtn}
                  onPress={() => {
                    setShowDuelArenaModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('Live Squad Duel Gauntlet Post');
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    style={styles.arenaScoreGradient}
                  >
                    <Text style={styles.arenaScoreBtnText}>Post to Score 🔥</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
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
          actionText={completionData.actionText || 'Continue'}
          onAction={completionData.onAction}
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
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // 1. TOP APP HEADER (EXACT STANDARD PRO HEADER)
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 12,
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
    height: SCREEN_HEIGHT * 0.54,
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
  crownEmblemBox: {
    backgroundColor: '#FEF3C7',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priorityCrownCardPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityCrownCardPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  priorityBannerRibbon: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priorityBannerText: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '700',
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

  // GESTURE GUIDE
  gestureGuideBar: {
    backgroundColor: '#FAF8F5',
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gestureGuideText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },

  // METRICS ROW (FOLLOWERS, STREAK, PLATFORM)
  creatorMetricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 12,
  },
  creatorMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  creatorMetricLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  creatorMetricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
    marginTop: 3,
  },
  creatorMetricDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // CATEGORY TAGS
  categoryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  categoryTagPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryTagPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  availableTagPill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  availableTagPillText: {
    color: '#92400E',
    fontWeight: '900',
  },

  // WHY THIS MATCH? CARD
  whyMatchCard: {
    backgroundColor: '#F8F7FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginTop: 12,
  },
  whyMatchHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  whyMatchBodyText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  potentialBoostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  potentialBoostText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  // 3 ACTION BUTTONS (PASS, SAVE, CONNECT)
  threeActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  passOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  passOutlineBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },
  saveOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveOutlineBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },
  connectPurpleBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  connectPurpleBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },

  // AI COLLABORATION PLAN
  proAiMatchPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proAiMatchPillText: {
    color: '#582CDB',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  aiCollabPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  proposedConceptSub: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  proposedConceptTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginTop: 3,
    marginBottom: 6,
  },
  proposedConceptDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  conceptMetaChip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conceptMetaChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  goldenMetaChip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goldenMetaChipText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#92400E',
  },
  buildCollabPlanBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  buildCollabPlanBtnText: {
    color: '#582CDB',
    fontSize: 12.5,
    fontWeight: '900',
  },

  // YOUR CREATOR SQUAD
  squadCard: {
    backgroundColor: '#F7F4EE',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E4DA',
  },
  squadNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  squadLevelPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  squadLevelPillText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  squadStreakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F7F4EE',
  },
  stackAvatarPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#F7F4EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackAvatarPlusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
  },
  squadGoalText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  squadXpLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
  },
  squadTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  squadFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  nextUnlockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  openSquadBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  openSquadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  findSquadBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  findSquadBtnText: {
    color: '#171420',
    fontSize: 12,
    fontWeight: '900',
  },

  // LUXURY LIVE SQUAD DUEL ARENA BANNER
  liveDuelBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  duelTopRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  duelLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  duelLivePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  duelLivePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  duelTimerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  duelTimerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  duelMatchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1EFE9',
  },
  duelTeamColLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  duelTeamColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  duelAvatarStackMini: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  duelAvatarStackMiniRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  duelStackImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  duelTeamNameMine: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },
  duelTeamNameOpp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'right',
  },
  duelScoreMinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  duelScoreMineText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  duelLeadText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  duelScoreOppPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  duelScoreOppText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
  },
  duelTrailingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  duelVsCenterEmblem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  duelVsCenterText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
  },
  duelTugTrackContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
  },
  duelTugFillMine: {
    backgroundColor: '#582CDB',
    height: '100%',
  },
  duelTugFillOpp: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  duelMissionBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1EFE9',
  },
  duelMissionLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  duelMissionDesc: {
    fontSize: 11,
    color: '#171420',
    fontWeight: '700',
  },
  viewDuelBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  viewDuelGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDuelBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* ARENA CENTERED MODAL */
  arenaModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 18,
  },
  arenaModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  arenaModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  arenaTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  arenaSwordsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
  },
  arenaSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  arenaCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaCloseText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#475569',
  },
  arenaMatchupCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  arenaTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arenaTeamTitleMine: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F3E8FF',
  },
  arenaTeamScoreMine: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  arenaLeadBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  arenaLeadBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#6EE7B7',
  },
  arenaVsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaVsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FDE68A',
  },
  arenaTeamTitleOpp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  arenaTeamScoreOpp: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E2E8F0',
    marginTop: 2,
  },
  arenaTrailingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  arenaTrailingBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  arenaTugBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  arenaTugMine: {
    backgroundColor: '#C084FC',
    height: '100%',
  },
  arenaTugOpp: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  arenaObjectivesSection: {
    marginBottom: 12,
  },
  arenaSectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  arenaTasksList: {
    gap: 8,
  },
  arenaTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  arenaTaskRowPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  arenaCheckGreen: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
  },
  arenaTaskTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  arenaTaskSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  arenaTaskPts: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#059669',
  },
  arenaQuickSubmitBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  arenaQuickSubmitText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  arenaBountyBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  arenaBountyTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  arenaBountyDesc: {
    fontSize: 11,
    color: '#171420',
    fontWeight: '700',
  },
  arenaActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  arenaChatBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  arenaChatBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
  },
  arenaScoreBtn: {
    flex: 1.2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  arenaScoreGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  arenaScoreBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // QUICK ACTIONS
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  quickActionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  quickActionName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  quickActionSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  openPlanBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  openPlanBtnText: {
    color: '#582CDB',
    fontSize: 11,
    fontWeight: '900',
  },
  messageGreyBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  messageGreyBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },

  // JARVIS CORE HERO CARD
  jarvisCoreHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  jarvisCoreIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  jarvisCoreQuote: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  jarvisCoreTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.6,
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
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestDeclineBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  requestAcceptBtn: {
    flex: 1.5,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  requestAcceptBtnText: {
    fontSize: 12,
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
