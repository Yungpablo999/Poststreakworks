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
  TextInput,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { LiquidGlassBackground } from '../components/LiquidGlassBackground';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 110;
const SWIPE_UP_THRESHOLD = 90;

interface MatchScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
}

interface TrackedMetrics {
  growthRate: string;
  postingPace: string;
  engagementScore: string;
  bestCollabWindow: string;
  statusText: string;
  lastActive: string;
}

interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  followers: string;
  location: string;
  coverImage: any;
  tags: string[];
  collabGoal: string;
  jarvisInsight: string;
  streak: number;
  tracking: TrackedMetrics;
}

const CREATOR_DECK: CreatorProfile[] = [
  {
    id: 'creator_1',
    name: 'Amara Okafor',
    role: 'Travel Vlogger',
    followers: '85k Followers',
    location: 'Lagos, NG',
    coverImage: require('../../assets/images/amara-creator-cover.jpg'),
    tags: ['Lifestyle', 'Travel', '44-Day Streak', 'High Consistency'],
    collabGoal:
      'Wants to create short-form lifestyle and travel content that focuses on authentic local stories.',
    jarvisInsight:
      'Amara matches your audience style, niche and posting rhythm. High collab synergy!',
    streak: 44,
    tracking: {
      growthRate: '+4.2k this month',
      postingPace: '4 posts/week',
      engagementScore: '94/100',
      bestCollabWindow: 'Fri & Sun • 7:30 PM',
      statusText: '🟢 Active today (Posted 2h ago)',
      lastActive: '2 hours ago',
    },
  },
  {
    id: 'creator_2',
    name: 'Tomi Adebayo',
    role: 'Tech Creator',
    followers: '156k Followers',
    location: 'London, UK',
    coverImage: require('../../assets/images/tomi-avatar.jpg'),
    tags: ['Tech', 'AI Tools', '52-Day Streak', 'Top 1% Creator'],
    collabGoal:
      'Looking to co-produce deep dives on AI creator workflows and gadget reviews.',
    jarvisInsight:
      'High overlap in productivity and workflow audience with 4.8x average viral reach.',
    streak: 52,
    tracking: {
      growthRate: '+12.8k this month',
      postingPace: '5 posts/week',
      engagementScore: '98/100',
      bestCollabWindow: 'Wed & Thu • 6:00 PM',
      statusText: '🔥 Viral breakout Reel yesterday',
      lastActive: 'Yesterday',
    },
  },
  {
    id: 'creator_3',
    name: 'Zainab Okafor',
    role: 'Lifestyle & Fashion',
    followers: '52k Followers',
    location: 'Toronto, CA',
    coverImage: require('../../assets/images/zainab-avatar.jpg'),
    tags: ['Lifestyle', 'Aesthetic', '38-Day Streak', 'High Engagement'],
    collabGoal:
      'Seeking travel and lifestyle co-creators for luxury aesthetic lookbooks and vlogs.',
    jarvisInsight:
      'Strong visual aesthetic alignment with high comment-to-view ratios.',
    streak: 38,
    tracking: {
      growthRate: '+2.1k this month',
      postingPace: '3 posts/week',
      engagementScore: '91/100',
      bestCollabWindow: 'Sat • 11:30 AM',
      statusText: '✨ Open to co-creations this week',
      lastActive: 'Today',
    },
  },
  {
    id: 'creator_4',
    name: 'Marcus Vance',
    role: 'Fitness & Routine',
    followers: '110k Followers',
    location: 'New York, US',
    coverImage: require('../../assets/images/marcus-avatar.jpg'),
    tags: ['Fitness', 'Daily Habits', '60-Day Streak', 'Elite Consistency'],
    collabGoal:
      'Wants to build daily habit & creator workout challenges with accountability partners.',
    jarvisInsight:
      'Massive streak alignment. Both of you thrive on high-discipline posting schedules.',
    streak: 60,
    tracking: {
      growthRate: '+8.5k this month',
      postingPace: '7 posts/week',
      engagementScore: '96/100',
      bestCollabWindow: 'Mon - Fri • 7:00 AM',
      statusText: '💪 100% daily posting consistency',
      lastActive: '3 hours ago',
    },
  },
  {
    id: 'creator_5',
    name: 'Elena Rostova',
    role: 'Visual Storyteller',
    followers: '94k Followers',
    location: 'Berlin, DE',
    coverImage: require('../../assets/images/elena-avatar.jpg'),
    tags: ['Cinematography', 'Editing', '41-Day Streak', 'Viral Hooks'],
    collabGoal:
      'Co-directing high-production cinematic Reels with creators pushing editing limits.',
    jarvisInsight:
      'Her pacing and visual sound design can amplify your video watch-through rates.',
    streak: 41,
    tracking: {
      growthRate: '+6.4k this month',
      postingPace: '4 posts/week',
      engagementScore: '95/100',
      bestCollabWindow: 'Tue & Sat • 8:00 PM',
      statusText: '🎬 Producing cinematic series',
      lastActive: '5 hours ago',
    },
  },
];

export const MatchScreen: React.FC<MatchScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenMessages,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [activeSection, setActiveSection] = useState<'deck' | 'tracking' | 'connected'>('deck');
  const [activeFilter, setActiveFilter] = useState<'niche' | 'streak' | 'nearby' | 'ai'>('niche');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Tracking state
  const [matchesLeft, setMatchesLeft] = useState(5);
  const [savedCreators, setSavedCreators] = useState<CreatorProfile[]>([
    CREATOR_DECK[0], // Amara Okafor tracked by default
  ]);
  const [connectedCreators, setConnectedCreators] = useState<CreatorProfile[]>([
    CREATOR_DECK[1], // Tomi Adebayo
    CREATOR_DECK[2], // Zainab Okafor
  ]);

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [lastConnectedCreator, setLastConnectedCreator] = useState<CreatorProfile | null>(null);
  const [showCollabIdeaModal, setShowCollabIdeaModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animated values for pure swipe gesture
  const position = useRef(new Animated.ValueXY()).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Pure PanResponder Swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeCard('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeCard('left');
        } else if (gesture.dy < -SWIPE_UP_THRESHOLD) {
          swipeCard('up');
        } else {
          resetCardPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    // Ghost floating loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -5,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(ghostFloatY, {
          toValue: 3,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [ghostFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const resetCardPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const swipeCard = (direction: 'left' | 'right' | 'up') => {
    const creator = CREATOR_DECK[currentIndex % CREATOR_DECK.length];
    const x = direction === 'right' ? SCREEN_WIDTH + 120 : direction === 'left' ? -SCREEN_WIDTH - 120 : 0;
    const y = direction === 'up' ? -SCREEN_WIDTH - 120 : 0;

    Animated.timing(position, {
      toValue: { x, y },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onSwipeComplete(direction, creator);
    });
  };

  const onSwipeComplete = (direction: 'left' | 'right' | 'up', creator: CreatorProfile) => {
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);

    if (direction === 'right') {
      // Accept / Match / Connect
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setMatchesLeft((prev) => Math.max(0, prev - 1));
      setConnectedCreators((prev) => (prev.some((c) => c.id === creator.id) ? prev : [creator, ...prev]));
      setLastConnectedCreator(creator);
      setShowConnectModal(true);
    } else if (direction === 'left') {
      // Decline / Pass
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      showToast(`Declined ${creator.name}`);
    } else if (direction === 'up') {
      // Save & Track
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSavedCreators((prev) => (prev.some((c) => c.id === creator.id) ? prev : [creator, ...prev]));
      showToast(`⭐ Saved & Tracking ${creator.name} over time!`);
    }
  };

  const handleToggleTrack = (creator: CreatorProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const isAlreadySaved = savedCreators.some((c) => c.id === creator.id);
    if (isAlreadySaved) {
      setSavedCreators((prev) => prev.filter((c) => c.id !== creator.id));
      showToast(`Stopped tracking ${creator.name}`);
    } else {
      setSavedCreators((prev) => [creator, ...prev]);
      showToast(`⭐ Now tracking ${creator.name} over time!`);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const rec = selectedRecipient || 'Creator';
    setShowMessageModal(false);
    setMessageText('');
    showToast(`✓ Message sent to ${rec}!`);
  };

  const currentCreator = CREATOR_DECK[currentIndex % CREATOR_DECK.length];
  const nextCreator = CREATOR_DECK[(currentIndex + 1) % CREATOR_DECK.length];
  const isCurrentSaved = savedCreators.some((c) => c.id === currentCreator.id);

  // Card rotation & stamp interpolation
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const acceptStampOpacity = position.x.interpolate({
    inputRange: [20, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const declineStampOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const saveStampOpacity = position.y.interpolate({
    inputRange: [-SWIPE_UP_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={styles.container}>
        {/* 1. TOP HEADER APP BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: ghostFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>
            <View>
              <Text style={styles.headerTitle}>Match Radar</Text>
              <Text style={styles.headerSubTitle}>47-Day Streak Active</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Message / Chat Bubble Button */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => showToast('💬 Match Messages')}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => setShowNotificationModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.unreadBadgeDot} />
            </Pressable>

            {/* Top-Right: User Profile Person Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              hitSlop={6}
              onPress={() => setShowProfileModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: MATCH HEADER & LIVE RADAR STATS */}
          <View style={styles.pageHeaderSection}>
            <View style={styles.pageBadgeRow}>
              <LinearGradient
                colors={['#784DF0', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.matchPillGradient}
              >
                <Text style={styles.matchPillText}>CREATOR RADAR</Text>
              </LinearGradient>

              <View style={styles.freeDiscoveryBadge}>
                <Text style={styles.freeDiscoveryText}>Swipe to Match</Text>
              </View>
            </View>

            <Text style={styles.pageHeadline}>Find creators worth building with.</Text>
            <Text style={styles.pageSubtitle}>
              Swipe right to accept, left to decline, or swipe up to save & track.
            </Text>

            {/* LIVE TRACKING STATS BAR */}
            <View style={styles.trackingStatsBar}>
              <View style={styles.trackingStatItem}>
                <Text style={styles.trackingStatVal}>⭐ {matchesLeft}/5</Text>
                <Text style={styles.trackingStatLbl}>Matches Left</Text>
              </View>
              <View style={styles.trackingStatDivider} />
              <View style={styles.trackingStatItem}>
                <Text style={styles.trackingStatVal}>📡 {savedCreators.length}</Text>
                <Text style={styles.trackingStatLbl}>Tracked</Text>
              </View>
              <View style={styles.trackingStatDivider} />
              <View style={styles.trackingStatItem}>
                <Text style={styles.trackingStatVal}>💜 {connectedCreators.length}</Text>
                <Text style={styles.trackingStatLbl}>Connected</Text>
              </View>
            </View>
          </View>

          {/* VIEW SWITCHER TABS: SWIPE DECK vs CREATOR TRACKER vs CONNECTED */}
          <View style={styles.sectionTabsRow}>
            <Pressable
              style={[styles.sectionTab, activeSection === 'deck' && styles.sectionTabActive]}
              onPress={() => setActiveSection('deck')}
            >
              <Text style={[styles.sectionTabText, activeSection === 'deck' && styles.sectionTabTextActive]}>
                Swipe Deck
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sectionTab, activeSection === 'tracking' && styles.sectionTabActive]}
              onPress={() => setActiveSection('tracking')}
            >
              <Text style={[styles.sectionTabText, activeSection === 'tracking' && styles.sectionTabTextActive]}>
                Tracked Radar ({savedCreators.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sectionTab, activeSection === 'connected' && styles.sectionTabActive]}
              onPress={() => setActiveSection('connected')}
            >
              <Text style={[styles.sectionTabText, activeSection === 'connected' && styles.sectionTabTextActive]}>
                Connected ({connectedCreators.length})
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: PURE GESTURE SWIPE DECK */}
          {activeSection === 'deck' && (
            <View>
              {/* FILTER PILLS */}
              <View style={styles.filterPillsRow}>
                <Pressable
                  style={[styles.filterPill, activeFilter === 'niche' && styles.filterPillActive]}
                  onPress={() => setActiveFilter('niche')}
                >
                  <Text style={[styles.filterPillText, activeFilter === 'niche' && styles.filterPillTextActive]}>
                    Same Niche
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterPill, activeFilter === 'streak' && styles.filterPillActive]}
                  onPress={() => setActiveFilter('streak')}
                >
                  <Text style={[styles.filterPillText, activeFilter === 'streak' && styles.filterPillTextActive]}>
                    Similar Streak
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterPill, activeFilter === 'nearby' && styles.filterPillActive]}
                  onPress={() => setActiveFilter('nearby')}
                >
                  <Text style={[styles.filterPillText, activeFilter === 'nearby' && styles.filterPillTextActive]}>
                    Nearby
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.filterPill, activeFilter === 'ai' && styles.filterPillActive]}
                  onPress={() => setActiveFilter('ai')}
                >
                  <Text style={[styles.filterPillText, activeFilter === 'ai' && styles.filterPillTextActive]}>
                    AI Pick
                  </Text>
                </Pressable>
              </View>

              {/* TINDER SWIPEABLE CARD STACK */}
              <View style={styles.cardStackContainer}>
                {/* BOTTOM / NEXT CARD IN STACK */}
                <View style={styles.bottomCardContainer} pointerEvents="none">
                  <LiquidGlassBackground
                    borderRadius={28}
                    light={0.92}
                    refraction={22}
                    frost={14}
                    dispersion={0.2}
                    style={styles.cardGlass}
                  >
                    <View style={styles.creatorCoverContainer}>
                      <Image
                        source={nextCreator.coverImage}
                        style={styles.creatorCoverImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(23, 20, 32, 0.85)']}
                        style={styles.creatorCoverGradient}
                      >
                        <Text style={styles.creatorHeroName}>{nextCreator.name}</Text>
                        <Text style={styles.creatorHeroMeta}>
                          {nextCreator.role} • {nextCreator.followers}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.creatorBodySection}>
                      <View style={styles.creatorTagsRow}>
                        {nextCreator.tags.map((tag, idx) => (
                          <View key={idx} style={styles.tagPill}>
                            <Text style={styles.tagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.collabGoalText}>{nextCreator.collabGoal}</Text>
                    </View>
                  </LiquidGlassBackground>
                </View>

                {/* TOP ACTIVE SWIPEABLE CARD */}
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[styles.topCardContainer, animatedCardStyle]}
                >
                  <LiquidGlassBackground
                    borderRadius={28}
                    light={0.94}
                    refraction={26}
                    frost={16}
                    dispersion={0.2}
                    style={styles.cardGlass}
                  >
                    {/* SWIPE STAMP OVERLAYS */}
                    {/* GREEN ACCEPT STAMP (SWIPE RIGHT) */}
                    <Animated.View
                      style={[
                        styles.stampOverlay,
                        styles.acceptStamp,
                        { opacity: acceptStampOpacity },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={styles.acceptStampText}>ACCEPT 💜</Text>
                    </Animated.View>

                    {/* RED DECLINE STAMP (SWIPE LEFT) */}
                    <Animated.View
                      style={[
                        styles.stampOverlay,
                        styles.declineStamp,
                        { opacity: declineStampOpacity },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={styles.declineStampText}>DECLINE ✖</Text>
                    </Animated.View>

                    {/* GOLD SAVE & TRACK STAMP (SWIPE UP) */}
                    <Animated.View
                      style={[
                        styles.stampOverlay,
                        styles.saveStamp,
                        { opacity: saveStampOpacity },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={styles.saveStampText}>TRACKING ⭐</Text>
                    </Animated.View>

                    {/* Cover Photo with Quick Save Button */}
                    <View style={styles.creatorCoverContainer}>
                      <Image
                        source={currentCreator.coverImage}
                        style={styles.creatorCoverImage}
                        resizeMode="cover"
                      />

                      {/* On-Card Save / Track Toggle Button */}
                      <Pressable
                        style={[styles.onCardSaveBtn, isCurrentSaved && styles.onCardSaveBtnActive]}
                        onPress={() => handleToggleTrack(currentCreator)}
                        hitSlop={8}
                      >
                        <Text style={{ fontSize: 16 }}>{isCurrentSaved ? '⭐' : '☆'}</Text>
                        <Text style={[styles.onCardSaveText, isCurrentSaved && styles.onCardSaveTextActive]}>
                          {isCurrentSaved ? 'Tracking' : 'Save'}
                        </Text>
                      </Pressable>

                      <LinearGradient
                        colors={['transparent', 'rgba(23, 20, 32, 0.85)']}
                        style={styles.creatorCoverGradient}
                      >
                        <View style={styles.creatorCoverInfoRow}>
                          <View style={styles.creatorCoverTextCol}>
                            <Text style={styles.creatorHeroName}>{currentCreator.name}</Text>
                            <Text style={styles.creatorHeroMeta}>
                              {currentCreator.role} • {currentCreator.followers}
                            </Text>
                          </View>
                          <View style={styles.locationPill}>
                            <Text style={styles.locationPillText}>📍 {currentCreator.location}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>

                    {/* Creator Body */}
                    <View style={styles.creatorBodySection}>
                      <View style={styles.creatorTagsRow}>
                        {currentCreator.tags.map((tag, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.tagPill,
                              tag.includes('Streak') && styles.tagPillStreak,
                              tag.includes('High') && styles.tagPillHigh,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagPillText,
                                tag.includes('Streak') && styles.tagPillTextStreak,
                                tag.includes('High') && styles.tagPillTextHigh,
                              ]}
                            >
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Live Tracking Radar Badge on Card */}
                      <View style={styles.liveTrackingCardBadge}>
                        <Text style={styles.liveTrackingCardStatus}>
                          {currentCreator.tracking.statusText}
                        </Text>
                      </View>

                      {/* Collab Goal */}
                      <View style={styles.collabGoalBox}>
                        <Text style={styles.collabGoalLabel}>COLLAB GOAL</Text>
                        <Text style={styles.collabGoalText}>{currentCreator.collabGoal}</Text>
                      </View>

                      {/* Jarvis Insight */}
                      <View style={styles.jarvisInsightBox}>
                        <Image
                          source={require('../../assets/images/jarvis-ghost-clean.png')}
                          style={styles.jarvisInsightGhost}
                          resizeMode="contain"
                        />
                        <View style={styles.jarvisInsightContent}>
                          <Text style={styles.jarvisInsightTitle}>JARVIS INSIGHT</Text>
                          <Text style={styles.jarvisInsightText}>{currentCreator.jarvisInsight}</Text>
                        </View>
                      </View>
                    </View>
                  </LiquidGlassBackground>
                </Animated.View>
              </View>

              {/* GESTURE HINT STRIP (MINIMAL & INTUITIVE) */}
              <View style={styles.gestureHintRow}>
                <Text style={styles.gestureHintText}>👈 Swipe left to decline</Text>
                <Text style={styles.gestureHintDot}>•</Text>
                <Text style={styles.gestureHintText}>👆 Up to save & track</Text>
                <Text style={styles.gestureHintDot}>•</Text>
                <Text style={styles.gestureHintText}>Right to accept 👉</Text>
              </View>

              {/* SUGGESTED COLLAB CARD */}
              <View style={styles.suggestedCollabCard}>
                <View style={styles.collabHeaderRow}>
                  <View style={styles.collabHeaderLeft}>
                    <Image
                      source={require('../../assets/images/jarvis-ghost-clean.png')}
                      style={styles.collabGhostIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.collabHeaderTitle}>JARVIS SUGGESTED COLLAB</Text>
                  </View>
                  <View style={styles.potencyBadge}>
                    <Text style={styles.potencyBadgeText}>📈 High potency</Text>
                  </View>
                </View>

                <Text style={styles.collabHeadline}>‘Day in Lagos’ co-created Reel</Text>
                <View style={styles.collabMetaRow}>
                  <View style={styles.collabMetaChip}><Text style={styles.collabMetaChipText}>Reel</Text></View>
                  <View style={styles.collabMetaChip}><Text style={styles.collabMetaChipText}>7:30 PM Peak</Text></View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.buildIdeaBtn, pressed && styles.btnPressed]}
                  onPress={() => setShowCollabIdeaModal(true)}
                >
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buildIdeaGradient}
                  >
                    <Text style={styles.buildIdeaBtnText}>⚡ Build Idea</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}

          {/* TAB 2: CREATOR GROWTH TRACKING RADAR */}
          {activeSection === 'tracking' && (
            <View style={styles.tabContentSection}>
              <View style={styles.radarHeaderBanner}>
                <Text style={styles.radarHeaderTitle}>📡 Creator Growth Radar</Text>
                <Text style={styles.radarHeaderSubtitle}>
                  Jarvis tracks your saved creators over time, monitoring posting streaks, growth surges, and peak collab windows.
                </Text>
              </View>

              {savedCreators.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Text style={styles.emptyStateEmoji}>⭐</Text>
                  <Text style={styles.emptyStateTitle}>No Creators Tracked Yet</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Swipe up on any creator card to start tracking their audience growth and consistency.
                  </Text>
                  <Pressable
                    style={styles.emptyStateBtn}
                    onPress={() => setActiveSection('deck')}
                  >
                    <Text style={styles.emptyStateBtnText}>Start Swiping</Text>
                  </Pressable>
                </View>
              ) : (
                savedCreators.map((creator) => (
                  <View key={creator.id} style={styles.trackedCreatorCard}>
                    {/* Creator Header Row */}
                    <View style={styles.trackedCardHeaderRow}>
                      <Image source={creator.coverImage} style={styles.trackedAvatarImg} resizeMode="cover" />
                      <View style={styles.trackedInfoCol}>
                        <View style={styles.trackedNameRow}>
                          <Text style={styles.trackedNameText}>{creator.name}</Text>
                          <View style={styles.streakBadgeMini}>
                            <Text style={styles.streakBadgeMiniText}>🔥 {creator.streak}d</Text>
                          </View>
                        </View>
                        <Text style={styles.trackedMetaText}>{creator.role} • {creator.followers}</Text>
                      </View>
                      <Pressable
                        style={styles.connectSmallBtn}
                        onPress={() => {
                          setConnectedCreators((prev) => [creator, ...prev]);
                          setLastConnectedCreator(creator);
                          setShowConnectModal(true);
                        }}
                      >
                        <Text style={styles.connectSmallBtnText}>Accept</Text>
                      </Pressable>
                    </View>

                    {/* Live Tracking Intelligence Box */}
                    <View style={styles.trackingMetricsBox}>
                      <View style={styles.trackingMetricRow}>
                        <Text style={styles.trackingMetricLabel}>📈 Growth Velocity:</Text>
                        <Text style={styles.trackingMetricValue}>{creator.tracking.growthRate}</Text>
                      </View>
                      <View style={styles.trackingMetricRow}>
                        <Text style={styles.trackingMetricLabel}>⏱ Posting Rhythm:</Text>
                        <Text style={styles.trackingMetricValue}>{creator.tracking.postingPace}</Text>
                      </View>
                      <View style={styles.trackingMetricRow}>
                        <Text style={styles.trackingMetricLabel}>✨ Best Collab Window:</Text>
                        <Text style={styles.trackingMetricValue}>{creator.tracking.bestCollabWindow}</Text>
                      </View>
                      <View style={styles.trackingStatusRow}>
                        <Text style={styles.trackingStatusText}>{creator.tracking.statusText}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: CONNECTED CREATORS LIST */}
          {activeSection === 'connected' && (
            <View style={styles.tabContentSection}>
              {connectedCreators.map((creator) => (
                <View key={creator.id} style={styles.matchItemCard}>
                  <Image source={creator.coverImage} style={styles.matchAvatarImg} resizeMode="cover" />
                  <View style={styles.matchInfoCol}>
                    <Text style={styles.matchNameText}>{creator.name}</Text>
                    <Text style={styles.matchMetaText}>{creator.role} • {creator.followers}</Text>
                  </View>
                  <Pressable
                    style={styles.messageBtn}
                    onPress={() => {
                      setSelectedRecipient(creator.name);
                      setShowMessageModal(true);
                    }}
                  >
                    <Text style={styles.messageBtnText}>Message</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* SECTION: CREATOR SQUADS PRO BANNER */}
          <View style={styles.squadsBannerCard}>
            <LinearGradient
              colors={['#582CDB', '#3F1AA8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.squadsGradient}
            >
              <View style={styles.squadsTitleRow}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                  <Circle cx="9" cy="7" r="4" />
                  <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <Circle cx="17" cy="11" r="3" />
                  <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </Svg>
                <Text style={styles.squadsTitleText}>Creator Squads</Text>
              </View>

              <Text style={styles.squadsDescText}>
                Collaborate at scale. Join private circles of creators in your niche to share resources, feedback, and growth hacks.
              </Text>

              <View style={styles.squadsFooterRow}>
                <Text style={styles.squadsAvailableText}>Available on Pro</Text>
                <Pressable
                  style={({ pressed }) => [styles.unlockSquadsBtn, pressed && styles.btnPressed]}
                  onPress={() => showToast('✨ Pro Squads unlocked!')}
                >
                  <LinearGradient
                    colors={['#FDE047', '#EAB308', '#CA8A04']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goldBtnGradient}
                  >
                    <Text style={styles.unlockSquadsBtnText}>Unlock Creator Squads</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* SECTION: JARVIS ENGINE WISDOM */}
          <View style={styles.wisdomCard}>
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.wisdomGhostIcon}
              resizeMode="contain"
            />
            <View style={styles.wisdomContentCol}>
              <Text style={styles.wisdomQuote}>
                “Creators with similar niches and consistent posting habits tend to collaborate better.”
              </Text>
              <Text style={styles.wisdomAuthor}>— Jarvis Engine</Text>
            </View>
          </View>
        </ScrollView>

        {/* 3. TOAST OVERLAY */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* 4. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (onNavigateTab) onNavigateTab(tab);
          }}
        />

        {/* 5. ANIMATED COMPLETION CELEBRATION MODAL (ON MATCH/CONNECT) */}
        <AnimatedCompletionModal
          visible={showConnectModal}
          title="It’s a Match! 🎉"
          subtitle={`You connected with ${lastConnectedCreator?.name || 'Creator'}. +40 XP awarded to your streak!`}
          badgeText="CREATOR MATCHED"
          xpEarned={40}
          streakCount={48}
          actionText="Continue Swiping"
          onDismiss={() => setShowConnectModal(false)}
        />

        {/* 6. BUILD COLLAB IDEA MODAL */}
        <Modal
          visible={showCollabIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCollabIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalBadgePill}>
                <Text style={styles.modalBadgeText}>COLLAB WORKSPACE</Text>
              </View>
              <Text style={styles.modalTitle}>‘Day in Lagos’ Co-created Reel</Text>
              <Text style={styles.modalSubtitle}>
                A dynamic split-screen / alternating POV short-form Reel comparing creative routines in Lagos.
              </Text>

              <View style={styles.ideaScriptBox}>
                <Text style={styles.ideaScriptHeading}>Suggested Script Blueprint:</Text>
                <Text style={styles.ideaScriptStep}>1. Hook (0-3s): “2 creators, 1 city — how we create on the go.”</Text>
                <Text style={styles.ideaScriptStep}>2. Body (4-15s): Fast cuts between your gear & Amara’s travel footage.</Text>
                <Text style={styles.ideaScriptStep}>3. CTA (16-20s): Drop top travel tips in comments.</Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCollabIdeaModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setShowCollabIdeaModal(false);
                    showToast('✓ Collab draft added to Create schedule!');
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Add to Schedule</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 7. DIRECT MESSAGE MODAL */}
        <Modal
          visible={showMessageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMessageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Message {selectedRecipient || 'Creator'}</Text>
              <Text style={styles.modalSubtitle}>Start a collaborative dialogue directly.</Text>

              <TextInput
                style={styles.modalTextAreaInput}
                placeholder="Hey, loved your latest post! Let’s collaborate on a co-created Reel..."
                placeholderTextColor="#A39CB5"
                value={messageText}
                onChangeText={setMessageText}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowMessageModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={handleSendMessage}
                >
                  <Text style={styles.modalPrimaryBtnText}>Send Message</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 8. NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Match Radar Alerts</Text>
              <Text style={styles.modalSubtitle}>Live creator recommendations</Text>

              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>✨ 2 Mutual Match Sparks</Text>
                <Text style={styles.notifBody}>
                  Amara Okafor and Tomi Adebayo are active in your creative circle today.
                </Text>
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 10 }]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* 9. PROFILE MODAL */}
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={{ width: 64, height: 64, marginBottom: 8 }}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Creator Profile</Text>
              <Text style={styles.modalSubtitle}>47-Day Streak • Free Plan</Text>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 12 }]}
                onPress={() => {
                  setShowProfileModal(false);
                  if (onLogout) onLogout();
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Log Out</Text>
              </Pressable>

              <Pressable
                style={[styles.modalCancelBtn, { width: '100%', marginTop: 8 }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  // 1. TOP HEADER APP BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
  },
  headerGhostLogo: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // 2. MAIN SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
  },

  // PAGE HEADER SECTION
  pageHeaderSection: {
    marginBottom: 16,
  },
  pageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchPillGradient: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  matchPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  freeDiscoveryBadge: {
    backgroundColor: 'rgba(240, 236, 250, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.7)',
  },
  freeDiscoveryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  pageHeadline: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7F7894',
    lineHeight: 18,
    marginBottom: 14,
  },

  // TRACKING STATS BAR
  trackingStatsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  trackingStatItem: {
    alignItems: 'center',
  },
  trackingStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  trackingStatLbl: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  trackingStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E3FA',
  },

  // SECTION TABS ROW (DECK vs TRACKING vs CONNECTED)
  sectionTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(237, 232, 252, 0.7)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
  },
  sectionTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F7894',
  },
  sectionTabTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // FILTER PILLS
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  filterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // TINDER CARD STACK CONTAINER
  cardStackContainer: {
    position: 'relative',
    height: 480,
    marginBottom: 12,
  },
  bottomCardContainer: {
    position: 'absolute',
    top: 10,
    left: 8,
    right: 8,
    bottom: 0,
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  topCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  cardGlass: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },

  // SWIPE STAMPS
  stampOverlay: {
    position: 'absolute',
    top: 20,
    zIndex: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2.5,
  },
  acceptStamp: {
    left: 20,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    transform: [{ rotate: '-12deg' }],
  },
  acceptStampText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  declineStamp: {
    right: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    transform: [{ rotate: '12deg' }],
  },
  declineStampText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 1,
  },
  saveStamp: {
    alignSelf: 'center',
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  saveStampText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
  },

  // CREATOR COVER PHOTO
  creatorCoverContainer: {
    height: 200,
    position: 'relative',
    backgroundColor: '#EDE8FC',
  },
  creatorCoverImage: {
    width: '100%',
    height: '100%',
  },
  onCardSaveBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    zIndex: 50,
  },
  onCardSaveBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  onCardSaveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  onCardSaveTextActive: {
    color: '#D97706',
  },
  creatorCoverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    justifyContent: 'flex-end',
    padding: 16,
  },
  creatorCoverInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  creatorCoverTextCol: {
    flex: 1,
  },
  creatorHeroName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  creatorHeroMeta: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  locationPill: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.9)',
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },

  // CREATOR BODY
  creatorBodySection: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  creatorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  tagPillStreak: {
    backgroundColor: '#EDE8FC',
    borderColor: '#DDD6FE',
  },
  tagPillHigh: {
    backgroundColor: '#F5F3FF',
    borderColor: '#E0E7FF',
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  tagPillTextStreak: {
    color: '#582CDB',
    fontWeight: '800',
  },
  tagPillTextHigh: {
    color: '#4338CA',
  },

  liveTrackingCardBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  liveTrackingCardStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  collabGoalBox: {
    marginBottom: 8,
  },
  collabGoalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  collabGoalText: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 17,
    fontWeight: '500',
  },

  jarvisInsightBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245, 243, 255, 0.85)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.7)',
  },
  jarvisInsightGhost: {
    width: 22,
    height: 22,
    marginTop: 2,
  },
  jarvisInsightContent: {
    flex: 1,
  },
  jarvisInsightTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  jarvisInsightText: {
    fontSize: 11.5,
    color: '#4B4360',
    lineHeight: 15,
    fontWeight: '500',
  },

  // GESTURE HINT STRIP
  gestureHintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  gestureHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  gestureHintDot: {
    color: '#DDD6FE',
    fontSize: 12,
  },

  // SUGGESTED COLLAB CARD
  suggestedCollabCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 20,
  },
  collabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collabHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collabGhostIcon: {
    width: 16,
    height: 16,
  },
  collabHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
  },
  potencyBadge: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  potencyBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  collabHeadline: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  collabMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  collabMetaChip: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  collabMetaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  buildIdeaBtn: {
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buildIdeaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildIdeaBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // TAB CONTENT SECTIONS
  tabContentSection: {
    marginBottom: 20,
  },
  radarHeaderBanner: {
    backgroundColor: 'rgba(237, 232, 252, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    marginBottom: 14,
  },
  radarHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 4,
  },
  radarHeaderSubtitle: {
    fontSize: 11.5,
    color: '#524C62',
    lineHeight: 16,
  },

  trackedCreatorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  trackedCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackedAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  trackedInfoCol: {
    flex: 1,
  },
  trackedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  trackedNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  streakBadgeMini: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 100,
  },
  streakBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  trackedMetaText: {
    fontSize: 11.5,
    color: '#7F7894',
    fontWeight: '500',
  },

  trackingMetricsBox: {
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  trackingMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackingMetricLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  trackingMetricValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },
  trackingStatusRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EDE8FC',
  },
  trackingStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  emptyStateBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  emptyStateEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12.5,
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyStateBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  matchItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 10,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  matchAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  matchInfoCol: {
    flex: 1,
  },
  matchNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  matchMetaText: {
    fontSize: 11.5,
    color: '#7F7894',
    fontWeight: '500',
  },
  messageBtn: {
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  connectSmallBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  connectSmallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // CREATOR SQUADS PRO BANNER
  squadsBannerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  squadsGradient: {
    padding: 20,
  },
  squadsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  squadsTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  squadsDescText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  squadsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadsAvailableText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  unlockSquadsBtn: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  goldBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unlockSquadsBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },

  // JARVIS ENGINE WISDOM
  wisdomCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    alignItems: 'center',
  },
  wisdomGhostIcon: {
    width: 28,
    height: 28,
  },
  wisdomContentCol: {
    flex: 1,
  },
  wisdomQuote: {
    fontSize: 11.5,
    color: '#4B4360',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 3,
  },
  wisdomAuthor: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalBadgePill: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 8,
  },
  modalBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  ideaScriptBox: {
    width: '100%',
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 16,
  },
  ideaScriptHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 6,
  },
  ideaScriptStep: {
    fontSize: 11.5,
    color: '#171420',
    lineHeight: 16,
    marginBottom: 4,
  },
  modalTextAreaInput: {
    width: '100%',
    height: 76,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E5E1F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F7894',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 20, 32, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
