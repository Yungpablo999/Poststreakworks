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
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { LiquidGlassBackground } from '../components/LiquidGlassBackground';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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

interface IncomingRequest {
  id: string;
  name: string;
  role: string;
  followers: string;
  location: string;
  coverImage: any;
  streak: number;
  pitchMessage: string;
  matchScore: string;
  timeAgo: string;
  tags: string[];
}

interface CollabIdeaBlueprint {
  title: string;
  hook: string;
  bts: string;
  lesson: string;
  format: string;
  duration: string;
  peakTime: string;
}

interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  followers: string;
  followersCount: string;
  reliability: string;
  location: string;
  coverImage: any;
  tags: string[];
  whyFitsText: string;
  whyFitsBadges: string[];
  collabIdea: CollabIdeaBlueprint;
  overlapPercent: number;
  nicheBreakdowns: { label: string; level: string; color: string }[];
  jarvisInsight: string;
  streak: number;
  tracking: TrackedMetrics;
}

const INCOMING_REQUESTS_DATA: IncomingRequest[] = [
  {
    id: 'req_1',
    name: 'Kemi Adeleke',
    role: 'UI/UX & Product Design',
    followers: '68k Followers',
    location: 'Lagos, NG',
    coverImage: require('../../assets/images/kemi-avatar.jpg'),
    streak: 39,
    pitchMessage:
      'Hey! Loved your recent video on creator workflows. Would love to co-host a live Q&A session on design systems for creators!',
    matchScore: '96% Match Synergy • Shared Tech Audience',
    timeAgo: '2 hours ago',
    tags: ['Design', 'Figma', '39-Day Streak'],
  },
  {
    id: 'req_2',
    name: 'David Osei',
    role: 'Finance & Tech Educator',
    followers: '120k Followers',
    location: 'Accra, GH',
    coverImage: require('../../assets/images/david-avatar.jpg'),
    streak: 55,
    pitchMessage:
      'I saw your daily posting consistency! Let’s collaborate on a split-screen Reel breaking down monetization for modern creators.',
    matchScore: '94% Match Synergy • High Engagement Overlap',
    timeAgo: '5 hours ago',
    tags: ['Finance', 'Creator Economy', '55-Day Streak'],
  },
];

const CREATOR_DECK: CreatorProfile[] = [
  {
    id: 'creator_1',
    name: 'Amara Okafor',
    role: 'Travel Vlogger',
    followers: '85k Followers',
    followersCount: '85,000+',
    reliability: 'High',
    location: 'Lagos, NG',
    coverImage: require('../../assets/images/amara-creator-cover.jpg'),
    tags: ['Lifestyle', 'Travel', 'Storytelling', 'Short-form Video'],
    whyFitsText:
      'Amara’s audience overlaps with your lifestyle and creator journey content. This match could support a strong short-form collaboration.',
    whyFitsBadges: ['Audience Overlap', 'Similar Content Style', 'Strong Posting Rhythm'],
    collabIdea: {
      title: '“24 Hours Creating in Lagos”',
      hook: 'Two creators, one city, zero sleep.',
      bts: 'iPhone and natural lighting.',
      lesson: 'how we both built our streaks today.',
      format: 'Reel',
      duration: '30-45 Sec',
      peakTime: 'Sat 2 PM',
    },
    overlapPercent: 76,
    nicheBreakdowns: [
      { label: 'LIFESTYLE', level: 'High', color: '#10B981' },
      { label: 'TRAVEL', level: 'Medium', color: '#582CDB' },
    ],
    jarvisInsight:
      'Amara’s content style matches your creator journey niche. A simple day-in-the-life collab could work well for both audiences.',
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
    followersCount: '156,000+',
    reliability: 'Top 1%',
    location: 'London, UK',
    coverImage: require('../../assets/images/tomi-avatar.jpg'),
    tags: ['Tech', 'AI Tools', 'Workflow', 'Productivity'],
    whyFitsText:
      'Tomi shares a tech-forward creator audience passionate about productivity tools and fast-paced editing breakdowns.',
    whyFitsBadges: ['High Reach', 'Tech Synergy', 'Daily Poster'],
    collabIdea: {
      title: '“AI Stacks That Save 10h/Week”',
      hook: 'The 3 tools top creators never talk about.',
      bts: 'Screen recording & side-by-side commentary.',
      lesson: 'Automate repetitive editing with AI.',
      format: 'Shorts',
      duration: '45-60 Sec',
      peakTime: 'Wed 6 PM',
    },
    overlapPercent: 84,
    nicheBreakdowns: [
      { label: 'TECH', level: 'High', color: '#10B981' },
      { label: 'AI TOOLS', level: 'High', color: '#10B981' },
    ],
    jarvisInsight:
      'Tomi’s audience has 4.8x higher viral share potential. A gadget workflow collab would maximize reach.',
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
    followersCount: '52,000+',
    reliability: 'High',
    location: 'Toronto, CA',
    coverImage: require('../../assets/images/zainab-avatar.jpg'),
    tags: ['Lifestyle', 'Aesthetic', 'Lookbooks', 'Vlog'],
    whyFitsText:
      'Zainab has exceptional visual engagement with high bookmark and save ratios on short-form aesthetic reels.',
    whyFitsBadges: ['Aesthetic Fit', 'High Saves', 'Consistent'],
    collabIdea: {
      title: '“Creator Studio Tour & Outfit Check”',
      hook: 'What you wear vs. where you build.',
      bts: 'Cinematic slider transitions & chill lo-fi.',
      lesson: 'Creating aesthetic spaces on a budget.',
      format: 'Reel',
      duration: '30-40 Sec',
      peakTime: 'Sat 11:30 AM',
    },
    overlapPercent: 71,
    nicheBreakdowns: [
      { label: 'LIFESTYLE', level: 'High', color: '#10B981' },
      { label: 'AESTHETIC', level: 'Medium', color: '#582CDB' },
    ],
    jarvisInsight:
      'Strong visual aesthetic alignment. Ideal for co-branded split screen aesthetic reels.',
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
    followersCount: '110,000+',
    reliability: 'Elite',
    location: 'New York, US',
    coverImage: require('../../assets/images/marcus-avatar.jpg'),
    tags: ['Fitness', 'Daily Habits', 'Discipline', 'Health'],
    whyFitsText:
      'Marcus has an uncompromising daily habit rhythm. Perfect partner for streak challenges and morning routine splits.',
    whyFitsBadges: ['Discipline Fit', 'High Energy', '60-Day Streak'],
    collabIdea: {
      title: '“Morning Routine vs Evening Creation”',
      hook: '5 AM workout meets 10 PM editing.',
      bts: 'Fast energetic montage cuts.',
      lesson: 'Discipline beats motivation every day.',
      format: 'Shorts',
      duration: '30 Sec',
      peakTime: 'Mon 7 AM',
    },
    overlapPercent: 79,
    nicheBreakdowns: [
      { label: 'FITNESS', level: 'High', color: '#10B981' },
      { label: 'HABITS', level: 'High', color: '#10B981' },
    ],
    jarvisInsight:
      'Both of you thrive on high-discipline posting schedules. Great for collaborative 30-day streak challenges.',
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
    followersCount: '94,000+',
    reliability: 'High',
    location: 'Berlin, DE',
    coverImage: require('../../assets/images/elena-avatar.jpg'),
    tags: ['Cinematography', 'Editing', 'Sound Design', 'Film'],
    whyFitsText:
      'Elena pushes the boundaries of camera work, pacing, and visual storytelling on short-form platforms.',
    whyFitsBadges: ['Film Quality', 'Viral Hooks', 'Editing Pro'],
    collabIdea: {
      title: '“How to Shoot Cinematic B-Roll in 60s”',
      hook: 'Stop zooming like an amateur.',
      bts: 'Handheld camera angles and shutter tricks.',
      lesson: 'Light placement transforms any mobile shot.',
      format: 'Reel',
      duration: '40 Sec',
      peakTime: 'Tue 8 PM',
    },
    overlapPercent: 82,
    nicheBreakdowns: [
      { label: 'CINEMA', level: 'High', color: '#10B981' },
      { label: 'EDITING', level: 'High', color: '#10B981' },
    ],
    jarvisInsight:
      'Her sound design techniques can amplify your retention rate by 35%. Highly recommended collab.',
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
  const [activeSection, setActiveSection] = useState<'deck' | 'requests' | 'tracking' | 'connected'>('deck');
  const [activeFilter, setActiveFilter] = useState<'niche' | 'streak' | 'nearby' | 'ai'>('niche');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Deep Creator Detail Profile Modal (Opened by tapping the creator card)
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState<CreatorProfile | null>(null);
  const [showCreatorDetailModal, setShowCreatorDetailModal] = useState(false);

  // Incoming Connection Requests state
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(INCOMING_REQUESTS_DATA);

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
  const [lastConnectedName, setLastConnectedName] = useState<string>('Creator');
  const [showCollabIdeaModal, setShowCollabIdeaModal] = useState(false);
  
  // Collab Schedule Pop-up States
  const [showScheduleConfirmModal, setShowScheduleConfirmModal] = useState(false);
  const [showScheduleSuccessModal, setShowScheduleSuccessModal] = useState(false);
  const [selectedCollabPlatform, setSelectedCollabPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram');
  const [collabPostTitle, setCollabPostTitle] = useState('‘Day in Lagos’ Co-created Reel (feat. Amara Okafor)');

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
      setLastConnectedName(creator.name);
      setShowConnectModal(true);
    } else if (direction === 'left') {
      // Decline / Pass
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      showToast('Declined ' + creator.name);
    } else if (direction === 'up') {
      // Save & Track
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSavedCreators((prev) => (prev.some((c) => c.id === creator.id) ? prev : [creator, ...prev]));
      showToast('⭐ Saved & Tracking ' + creator.name + ' over time!');
    }
  };

  const handleToggleTrack = (creator: CreatorProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const isAlreadySaved = savedCreators.some((c) => c.id === creator.id);
    if (isAlreadySaved) {
      setSavedCreators((prev) => prev.filter((c) => c.id !== creator.id));
      showToast('Stopped tracking ' + creator.name);
    } else {
      setSavedCreators((prev) => [creator, ...prev]);
      showToast('⭐ Now tracking ' + creator.name + ' over time!');
    }
  };

  const handleOpenCreatorDetail = (creator: CreatorProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCreatorProfile(creator);
    setShowCreatorDetailModal(true);
  };

  // INCOMING REQUEST ACTIONS: ACCEPT & DECLINE
  const handleAcceptRequest = (req: IncomingRequest) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));

    const newConnectedCreator: CreatorProfile = {
      id: req.id,
      name: req.name,
      role: req.role,
      followers: req.followers,
      followersCount: req.followers,
      reliability: 'High',
      location: req.location,
      coverImage: req.coverImage,
      tags: req.tags,
      whyFitsText: 'Shared niche synergy and high audience compatibility.',
      whyFitsBadges: ['Audience Overlap', 'High Energy'],
      collabIdea: {
        title: 'Co-created Split Screen',
        hook: req.pitchMessage,
        bts: 'Natural lighting & quick cuts.',
        lesson: 'Key creator insights.',
        format: 'Reel',
        duration: '30s',
        peakTime: '7:30 PM',
      },
      overlapPercent: 88,
      nicheBreakdowns: [
        { label: 'NICHE', level: 'High', color: '#10B981' },
        { label: 'WORKFLOW', level: 'High', color: '#10B981' },
      ],
      jarvisInsight: req.matchScore,
      streak: req.streak,
      tracking: {
        growthRate: '+5.5k this month',
        postingPace: '4 posts/week',
        engagementScore: '96/100',
        bestCollabWindow: 'Weekdays 7:00 PM',
        statusText: '🟢 Connected & available',
        lastActive: 'Active today',
      },
    };
    setConnectedCreators((prev) => [newConnectedCreator, ...prev]);
    setLastConnectedName(req.name);
    setShowConnectModal(true);
  };

  const handleDeclineRequest = (req: IncomingRequest) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
    showToast('Declined request from ' + req.name);
  };

  const handleConfirmSchedule = () => {
    setShowScheduleConfirmModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => {
      setShowScheduleSuccessModal(true);
    }, 250);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const rec = selectedRecipient || 'Creator';
    setShowMessageModal(false);
    setMessageText('');
    showToast('✓ Message sent to ' + rec + '!');
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
              Swipe to match. Tap any creator card for deep collaboration intel.
            </Text>

            {/* LIVE TRACKING STATS BAR */}
            <View style={styles.trackingStatsBar}>
              <View style={styles.trackingStatItem}>
                <Text style={styles.trackingStatVal}>⭐ {matchesLeft}/5</Text>
                <Text style={styles.trackingStatLbl}>Matches Left</Text>
              </View>
              <View style={styles.trackingStatDivider} />
              <View style={styles.trackingStatItem}>
                <Text style={styles.trackingStatVal}>📩 {incomingRequests.length}</Text>
                <Text style={styles.trackingStatLbl}>Requests</Text>
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

          {/* VIEW SWITCHER TABS */}
          <View style={styles.sectionTabsRow}>
            <Pressable
              style={[styles.sectionTab, activeSection === 'deck' && styles.sectionTabActive]}
              onPress={() => setActiveSection('deck')}
            >
              <Text style={[styles.sectionTabText, activeSection === 'deck' && styles.sectionTabTextActive]}>
                Deck
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sectionTab, activeSection === 'requests' && styles.sectionTabActive]}
              onPress={() => setActiveSection('requests')}
            >
              <View style={styles.tabBadgeWrapper}>
                <Text style={[styles.sectionTabText, activeSection === 'requests' && styles.sectionTabTextActive]}>
                  Requests ({incomingRequests.length})
                </Text>
                {incomingRequests.length > 0 && <View style={styles.tabBadgeDot} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.sectionTab, activeSection === 'tracking' && styles.sectionTabActive]}
              onPress={() => setActiveSection('tracking')}
            >
              <Text style={[styles.sectionTabText, activeSection === 'tracking' && styles.sectionTabTextActive]}>
                Tracked ({savedCreators.length})
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

          {/* TAB 1: PREMIUM, VISUAL, CLEAN SWIPE DECK */}
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

              {/* TINDER SWIPEABLE CARD STACK - ULTRA CLEAN & AESTHETIC */}
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
                    <Image
                      source={nextCreator.coverImage}
                      style={styles.cleanCoverImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(23, 20, 32, 0.4)', 'rgba(23, 20, 32, 0.95)']}
                      style={styles.cleanCoverGradient}
                    >
                      <Text style={styles.cleanHeroName}>{nextCreator.name}</Text>
                      <Text style={styles.cleanHeroMeta}>
                        {nextCreator.role} • {nextCreator.followers}
                      </Text>
                    </LinearGradient>
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

                    {/* IMMERSIVE COVER PHOTO WITH OVERLAYS */}
                    <Pressable
                      style={styles.cardPressableArea}
                      onPress={() => handleOpenCreatorDetail(currentCreator)}
                    >
                      <Image
                        source={currentCreator.coverImage}
                        style={styles.cleanCoverImage}
                        resizeMode="cover"
                      />

                      {/* Top Badges: Availability & Streak & Save */}
                      <View style={styles.cardTopBadgeRow}>
                        <View style={styles.cardAvailableBadge}>
                          <View style={styles.greenPulseDot} />
                          <Text style={styles.cardAvailableText}>Available This Week</Text>
                        </View>

                        <Pressable
                          style={[styles.cardBookmarkBtn, isCurrentSaved && styles.cardBookmarkBtnActive]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleTrack(currentCreator);
                          }}
                          hitSlop={10}
                        >
                          <Text style={{ fontSize: 16 }}>{isCurrentSaved ? '⭐' : '☆'}</Text>
                        </Pressable>
                      </View>

                      {/* Bottom Gradient with Creator Information & Tap Prompt */}
                      <LinearGradient
                        colors={['transparent', 'rgba(23, 20, 32, 0.45)', 'rgba(23, 20, 32, 0.96)']}
                        style={styles.cleanCoverGradient}
                      >
                        {/* Name & Location Row */}
                        <View style={styles.cleanNameRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cleanHeroName}>{currentCreator.name}</Text>
                            <Text style={styles.cleanHeroMeta}>
                              {currentCreator.role} • {currentCreator.followers}
                            </Text>
                          </View>
                          <View style={styles.cleanLocationPill}>
                            <Text style={styles.cleanLocationText}>📍 {currentCreator.location}</Text>
                          </View>
                        </View>

                        {/* Niche Pills */}
                        <View style={styles.cleanNicheRow}>
                          {currentCreator.tags.slice(0, 3).map((tag, idx) => (
                            <View key={idx} style={styles.cleanTagPill}>
                              <Text style={styles.cleanTagPillText}>{tag}</Text>
                            </View>
                          ))}
                          <View style={styles.cleanStreakPill}>
                            <Text style={styles.cleanStreakPillText}>🔥 {currentCreator.streak}d Streak</Text>
                          </View>
                        </View>

                        {/* Interactive Tap Prompt Banner */}
                        <View style={styles.tapPromptStrip}>
                          <View style={styles.tapPromptLeft}>
                            <Text style={styles.tapPromptEmoji}>⚡</Text>
                            <Text style={styles.tapPromptText}>Tap to view full collab blueprint & stats</Text>
                          </View>
                          <Text style={styles.tapPromptArrow}>➔</Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </LiquidGlassBackground>
                </Animated.View>
              </View>

              {/* GESTURE HINT STRIP */}
              <View style={styles.gestureHintRow}>
                <Text style={styles.gestureHintText}>👈 Swipe left to decline</Text>
                <Text style={styles.gestureHintDot}>•</Text>
                <Text style={styles.gestureHintText}>👆 Up to save</Text>
                <Text style={styles.gestureHintDot}>•</Text>
                <Text style={styles.gestureHintText}>Right to accept 👉</Text>
              </View>
            </View>
          )}

          {/* TAB 2: INCOMING CONNECTION REQUESTS */}
          {activeSection === 'requests' && (
            <View style={styles.tabContentSection}>
              <View style={styles.requestsHeaderBanner}>
                <View style={styles.requestsHeaderIconRow}>
                  <Text style={styles.requestsHeaderTitle}>📩 Connection Requests</Text>
                  <View style={styles.requestsCountPill}>
                    <Text style={styles.requestsCountPillText}>{incomingRequests.length} Pending</Text>
                  </View>
                </View>
                <Text style={styles.requestsHeaderSubtitle}>
                  Creators who reached out to collaborate with you. Accept to connect and unlock direct messaging.
                </Text>
              </View>

              {incomingRequests.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Text style={styles.emptyStateEmoji}>✨</Text>
                  <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    You have responded to all incoming connection requests. Keep your streak active to appear on more creator radars!
                  </Text>
                  <Pressable
                    style={styles.emptyStateBtn}
                    onPress={() => setActiveSection('deck')}
                  >
                    <Text style={styles.emptyStateBtnText}>Discover More Creators</Text>
                  </Pressable>
                </View>
              ) : (
                incomingRequests.map((req) => (
                  <View key={req.id} style={styles.requestCard}>
                    {/* Top Row: Avatar & Details */}
                    <View style={styles.requestTopRow}>
                      <Image source={req.coverImage} style={styles.requestAvatarImg} resizeMode="cover" />
                      <View style={styles.requestInfoCol}>
                        <View style={styles.requestNameRow}>
                          <Text style={styles.requestNameText}>{req.name}</Text>
                          <View style={styles.requestStreakBadge}>
                            <Text style={styles.requestStreakBadgeText}>🔥 {req.streak}d</Text>
                          </View>
                        </View>
                        <Text style={styles.requestRoleText}>{req.role} • {req.followers}</Text>
                        <Text style={styles.requestTimeText}>📍 {req.location} • Sent {req.timeAgo}</Text>
                      </View>
                    </View>

                    {/* Pitch Message Bubble */}
                    <View style={styles.pitchMessageBubble}>
                      <Text style={styles.pitchMessageLabel}>COLLAB PITCH:</Text>
                      <Text style={styles.pitchMessageText}>“{req.pitchMessage}”</Text>
                    </View>

                    {/* Jarvis Compatibility Insight */}
                    <View style={styles.requestCompatibilityRow}>
                      <Image
                        source={require('../../assets/images/jarvis-ghost-clean.png')}
                        style={styles.requestGhostMini}
                        resizeMode="contain"
                      />
                      <Text style={styles.requestCompatibilityText}>{req.matchScore}</Text>
                    </View>

                    {/* Action Buttons: Decline & Accept */}
                    <View style={styles.requestActionBtnRow}>
                      <Pressable
                        style={({ pressed }) => [styles.requestDeclineBtn, pressed && styles.btnPressed]}
                        onPress={() => handleDeclineRequest(req)}
                      >
                        <Text style={styles.requestDeclineBtnText}>✖ Decline</Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [styles.requestAcceptBtn, pressed && styles.btnPressed]}
                        onPress={() => handleAcceptRequest(req)}
                      >
                        <LinearGradient
                          colors={['#784DF0', '#582CDB']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.requestAcceptGradient}
                        >
                          <Text style={styles.requestAcceptBtnText}>💜 Accept (+50 XP)</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: CREATOR GROWTH TRACKING RADAR */}
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
                  <Pressable
                    key={creator.id}
                    style={styles.trackedCreatorCard}
                    onPress={() => handleOpenCreatorDetail(creator)}
                  >
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
                        onPress={(e) => {
                          e.stopPropagation();
                          setConnectedCreators((prev) => [creator, ...prev]);
                          setLastConnectedName(creator.name);
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
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* TAB 4: CONNECTED CREATORS LIST */}
          {activeSection === 'connected' && (
            <View style={styles.tabContentSection}>
              {connectedCreators.map((creator) => (
                <Pressable
                  key={creator.id}
                  style={styles.matchItemCard}
                  onPress={() => handleOpenCreatorDetail(creator)}
                >
                  <Image source={creator.coverImage} style={styles.matchAvatarImg} resizeMode="cover" />
                  <View style={styles.matchInfoCol}>
                    <Text style={styles.matchNameText}>{creator.name}</Text>
                    <Text style={styles.matchMetaText}>{creator.role} • {creator.followers}</Text>
                  </View>
                  <Pressable
                    style={styles.messageBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedRecipient(creator.name);
                      setShowMessageModal(true);
                    }}
                  >
                    <Text style={styles.messageBtnText}>Message</Text>
                  </Pressable>
                </Pressable>
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

        {/* 5. DEEP CREATOR DETAIL PROFILE MODAL (EXACT MEDIA_1787000399594 DESIGN) */}
        {selectedCreatorProfile && (
          <Modal
            visible={showCreatorDetailModal}
            transparent={false}
            animationType="slide"
            onRequestClose={() => setShowCreatorDetailModal(false)}
          >
            <SafeAreaView style={styles.detailSafeArea}>
              <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
              {/* Detail Header Bar */}
              <View style={styles.detailHeaderBar}>
                <Pressable
                  style={styles.detailBackBtn}
                  onPress={() => setShowCreatorDetailModal(false)}
                  hitSlop={10}
                >
                  <Text style={styles.detailBackBtnText}>✕ Close</Text>
                </Pressable>
                <Text style={styles.detailHeaderTitle}>Creator Collab Intel</Text>
                <Pressable
                  style={styles.detailBookmarkBtn}
                  onPress={() => handleToggleTrack(selectedCreatorProfile)}
                  hitSlop={10}
                >
                  <Text style={{ fontSize: 18 }}>
                    {savedCreators.some((c) => c.id === selectedCreatorProfile.id) ? '⭐' : '☆'}
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.detailScrollView}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. HERO COVER & PROFILE CARD */}
                <View style={styles.detailHeroCard}>
                  <Image
                    source={selectedCreatorProfile.coverImage}
                    style={styles.detailCoverImage}
                    resizeMode="cover"
                  />
                  <View style={styles.detailAvailabilityBar}>
                    <View style={styles.detailStatusRow}>
                      <View style={styles.greenPulseDot} />
                      <Text style={styles.detailAvailableText}>Available This Week</Text>
                    </View>
                    <View style={styles.detailStatsRow}>
                      <View style={styles.detailStatCol}>
                        <Text style={styles.detailStatValGold}>{selectedCreatorProfile.followersCount}</Text>
                        <Text style={styles.detailStatLbl}>Followers</Text>
                      </View>
                      <View style={styles.detailStatDivider} />
                      <View style={styles.detailStatCol}>
                        <Text style={styles.detailStatValPurple}>{selectedCreatorProfile.reliability}</Text>
                        <Text style={styles.detailStatLbl}>Reliability</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. NICHE & CATEGORY TAG PILLS */}
                <View style={styles.detailTagsRow}>
                  {selectedCreatorProfile.tags.map((tag, idx) => (
                    <View key={idx} style={styles.detailTagPill}>
                      <Text style={styles.detailTagPillText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* 3. WHY THIS MATCH FITS */}
                <View style={styles.detailSectionCard}>
                  <View style={styles.detailCardHeader}>
                    <Text style={styles.detailSparkleIcon}>✨</Text>
                    <Text style={styles.detailCardTitle}>Why This Match Fits</Text>
                  </View>
                  <Text style={styles.detailWhyFitsText}>
                    {selectedCreatorProfile.whyFitsText}
                  </Text>
                  <View style={styles.detailFitBadgesRow}>
                    {selectedCreatorProfile.whyFitsBadges.map((badge, idx) => (
                      <View key={idx} style={styles.detailFitBadge}>
                        <Text style={styles.detailFitBadgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 4. COLLAB IDEA BLUEPRINT */}
                <View style={styles.collabBlueprintCard}>
                  <View style={styles.collabIdeaHeader}>
                    <Text style={{ fontSize: 16 }}>💡</Text>
                    <Text style={styles.collabIdeaHeading}>Collab Idea</Text>
                  </View>
                  <Text style={styles.collabIdeaTitle}>{selectedCreatorProfile.collabIdea.title}</Text>

                  <View style={styles.collabIdeaBody}>
                    <Text style={styles.collabIdeaItem}>
                      <Text style={styles.collabIdeaBold}>Hook  </Text>
                      {selectedCreatorProfile.collabIdea.hook}
                    </Text>
                    <Text style={styles.collabIdeaItem}>
                      <Text style={styles.collabIdeaBold}>BTS  </Text>
                      {selectedCreatorProfile.collabIdea.bts}
                    </Text>
                    <Text style={styles.collabIdeaItem}>
                      <Text style={styles.collabIdeaBold}>Lesson  </Text>
                      {selectedCreatorProfile.collabIdea.lesson}
                    </Text>
                  </View>

                  <View style={styles.collabFormatRow}>
                    <View style={styles.collabFormatChip}>
                      <Text style={styles.collabFormatText}>{selectedCreatorProfile.collabIdea.format}</Text>
                    </View>
                    <View style={styles.collabFormatChip}>
                      <Text style={styles.collabFormatText}>{selectedCreatorProfile.collabIdea.duration}</Text>
                    </View>
                    <View style={styles.collabFormatChip}>
                      <Text style={styles.collabFormatText}>{selectedCreatorProfile.collabIdea.peakTime}</Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.buildCollabPlanBtn}
                    onPress={() => {
                      setShowCreatorDetailModal(false);
                      setTimeout(() => {
                        setShowScheduleConfirmModal(true);
                      }, 200);
                    }}
                  >
                    <Text style={styles.buildCollabPlanBtnText}>Build Collab Plan</Text>
                  </Pressable>
                </View>

                {/* 5. AUDIENCE & STREAK 2-COLUMN METRICS */}
                <View style={styles.detailTwoColRow}>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricIcon}>👥</Text>
                    <Text style={styles.detailMetricLabel}>AUDIENCE</Text>
                    <Text style={styles.detailMetricValue}>{selectedCreatorProfile.followersCount}</Text>
                  </View>
                  <View style={styles.detailMetricBox}>
                    <Text style={styles.detailMetricIcon}>🔥</Text>
                    <Text style={styles.detailMetricLabel}>STREAK</Text>
                    <Text style={[styles.detailMetricValue, { color: '#EAB308' }]}>
                      {selectedCreatorProfile.streak} Days
                    </Text>
                  </View>
                </View>

                {/* 6. AUDIENCE CORRELATION VENN DIAGRAM */}
                <View style={styles.detailSectionCard}>
                  <Text style={styles.audienceCorrTitle}>AUDIENCE CORRELATION</Text>
                  <View style={styles.vennContainer}>
                    <Svg height={100} width={200} viewBox="0 0 200 100">
                      {/* Left Circle (You) */}
                      <Circle
                        cx={75}
                        cy={50}
                        r={42}
                        fill="rgba(120, 77, 240, 0.25)"
                        stroke="#784DF0"
                        strokeWidth={2}
                      />
                      {/* Right Circle (Match) */}
                      <Circle
                        cx={125}
                        cy={50}
                        r={42}
                        fill="rgba(234, 179, 8, 0.25)"
                        stroke="#EAB308"
                        strokeWidth={2}
                      />
                      {/* Labels */}
                      <SvgText x={50} y={54} fill="#582CDB" fontSize={10} fontWeight="bold" textAnchor="middle">
                        YOU
                      </SvgText>
                      <SvgText x={100} y={55} fill="#171420" fontSize={13} fontWeight="900" textAnchor="middle">
                        {selectedCreatorProfile.overlapPercent}%
                      </SvgText>
                      <SvgText x={150} y={54} fill="#92400E" fontSize={10} fontWeight="bold" textAnchor="middle">
                        CREATOR
                      </SvgText>
                    </Svg>
                  </View>

                  <View style={styles.nicheLevelRow}>
                    {selectedCreatorProfile.nicheBreakdowns.map((nb, idx) => (
                      <View key={idx} style={styles.nicheLevelBox}>
                        <Text style={styles.nicheLevelLbl}>{nb.label}</Text>
                        <Text style={[styles.nicheLevelVal, { color: nb.color }]}>{nb.level}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 7. JARVIS INSIGHT */}
                <View style={styles.detailJarvisCard}>
                  <Image
                    source={require('../../assets/images/jarvis-ghost-clean.png')}
                    style={styles.detailJarvisGhost}
                    resizeMode="contain"
                  />
                  <Text style={styles.detailJarvisLabel}>JARVIS INSIGHT</Text>
                  <Text style={styles.detailJarvisText}>{selectedCreatorProfile.jarvisInsight}</Text>
                </View>

                {/* 8. READINESS CHECKLIST */}
                <View style={styles.readinessCard}>
                  <View style={styles.readinessHeader}>
                    <Text style={styles.readinessTitle}>Readiness</Text>
                    <View style={styles.readinessBadge}>
                      <Text style={styles.readinessBadgeText}>✓ Ready</Text>
                    </View>
                  </View>
                  <View style={styles.readinessItemRow}>
                    <Text style={styles.readinessCheckIcon}>👤</Text>
                    <Text style={styles.readinessItemText}>Profile verified & complete</Text>
                  </View>
                  <View style={styles.readinessItemRow}>
                    <Text style={styles.readinessCheckIcon}>⏱</Text>
                    <Text style={styles.readinessItemText}>Active high-performance streak</Text>
                  </View>
                  <View style={styles.readinessItemRow}>
                    <Text style={styles.readinessCheckIcon}>💬</Text>
                    <Text style={styles.readinessItemText}>High response likelihood</Text>
                  </View>
                </View>

                {/* 9. BOTTOM ACTION ROW */}
                <View style={styles.detailBottomActionRow}>
                  <Pressable
                    style={styles.detailConnectBtn}
                    onPress={() => {
                      setShowCreatorDetailModal(false);
                      setConnectedCreators((prev) =>
                        prev.some((c) => c.id === selectedCreatorProfile.id)
                          ? prev
                          : [selectedCreatorProfile, ...prev]
                      );
                      setLastConnectedName(selectedCreatorProfile.name);
                      setShowConnectModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={['#784DF0', '#582CDB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.detailConnectGradient}
                    >
                      <Text style={styles.detailConnectBtnText}>Connect (+50 XP)</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    style={styles.detailSaveSquareBtn}
                    onPress={() => handleToggleTrack(selectedCreatorProfile)}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {savedCreators.some((c) => c.id === selectedCreatorProfile.id) ? '⭐' : '☆'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* 6. ANIMATED COMPLETION CELEBRATION MODAL (ON MATCH/CONNECT) */}
        <AnimatedCompletionModal
          visible={showConnectModal}
          title="It’s a Match! 🎉"
          subtitle={'You connected with ' + lastConnectedName + '. +50 XP awarded to your streak!'}
          badgeText="CREATOR CONNECTED"
          xpEarned={50}
          streakCount={48}
          actionText="Continue Exploring"
          onDismiss={() => setShowConnectModal(false)}
        />

        {/* 6B. COLLAB SCHEDULE POP-UP MODAL (STEP 2: CUSTOMIZE & CONFIRM) */}
        <Modal
          visible={showScheduleConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScheduleConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 340 }]}>
              <View style={styles.modalBadgePill}>
                <Text style={styles.modalBadgeText}>COLLAB SCHEDULE • JARVIS AI</Text>
              </View>
              <Text style={styles.modalTitle}>Schedule Collab Post</Text>
              <Text style={styles.modalSubtitle}>
                Lock in your joint co-creation with Amara Okafor to protect your 48-day streak.
              </Text>

              {/* Title / Hook input */}
              <View style={styles.inputGroupFull}>
                <Text style={styles.inputFieldLabel}>POST HOOK / TITLE</Text>
                <TextInput
                  style={styles.singleLineInput}
                  value={collabPostTitle}
                  onChangeText={setCollabPostTitle}
                  placeholder="Enter post hook..."
                  placeholderTextColor="#A39CB5"
                />
              </View>

              {/* Platform Selector */}
              <View style={styles.inputGroupFull}>
                <Text style={styles.inputFieldLabel}>SELECT PLATFORM</Text>
                <View style={styles.platformPillRow}>
                  <Pressable
                    style={[styles.platformPill, selectedCollabPlatform === 'instagram' && styles.platformPillActive]}
                    onPress={() => setSelectedCollabPlatform('instagram')}
                  >
                    <Text style={[styles.platformPillText, selectedCollabPlatform === 'instagram' && styles.platformPillTextActive]}>
                      Instagram
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.platformPill, selectedCollabPlatform === 'tiktok' && styles.platformPillActive]}
                    onPress={() => setSelectedCollabPlatform('tiktok')}
                  >
                    <Text style={[styles.platformPillText, selectedCollabPlatform === 'tiktok' && styles.platformPillTextActive]}>
                      TikTok
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.platformPill, selectedCollabPlatform === 'youtube' && styles.platformPillActive]}
                    onPress={() => setSelectedCollabPlatform('youtube')}
                  >
                    <Text style={[styles.platformPillText, selectedCollabPlatform === 'youtube' && styles.platformPillTextActive]}>
                      Shorts
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Projected Reach & Peak Time */}
              <View style={styles.collabScheduleInfoBox}>
                <View style={styles.scheduleInfoRow}>
                  <Text style={styles.scheduleInfoLabel}>📅 Target Slot:</Text>
                  <Text style={styles.scheduleInfoValue}>Friday • 7:30 PM Peak</Text>
                </View>
                <View style={styles.scheduleInfoRow}>
                  <Text style={styles.scheduleInfoLabel}>⚡ Projected Reach:</Text>
                  <Text style={styles.scheduleInfoValue}>18.5K - 34.0K Views</Text>
                </View>
                <View style={styles.scheduleInfoRow}>
                  <Text style={styles.scheduleInfoLabel}>🔥 Streak Protection:</Text>
                  <Text style={[styles.scheduleInfoValue, { color: '#E11D48' }]}>Active (+50 XP)</Text>
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowScheduleConfirmModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={handleConfirmSchedule}
                >
                  <Text style={styles.modalPrimaryBtnText}>Confirm & Schedule</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 6C. ANIMATED COMPLETION CELEBRATION MODAL (ON SCHEDULE SUCCESS) */}
        <AnimatedCompletionModal
          visible={showScheduleSuccessModal}
          title="Collab Scheduled! 🚀"
          subtitle="‘Day in Lagos’ added to your posting schedule. +50 XP awarded to your streak!"
          badgeText="COLLAB SCHEDULED"
          xpEarned={50}
          streakCount={48}
          actionText="View in Schedule"
          onDismiss={() => {
            setShowScheduleSuccessModal(false);
            if (onNavigateTab) {
              onNavigateTab('create');
            }
          }}
        />

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
                <Text style={styles.notifTitle}>✨ 2 Connection Requests</Text>
                <Text style={styles.notifBody}>
                  Kemi Adeleke and David Osei sent you collaboration connection requests.
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
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  trackingStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  trackingStatVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  trackingStatLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7F7894',
  },
  trackingStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E8E3FA',
  },

  // SECTION TABS ROW
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7F7894',
  },
  sectionTabTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  tabBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
    marginLeft: 3,
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

  // TINDER CARD STACK CONTAINER (CLEAN & IMMERSIVE)
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
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  cardPressableArea: {
    flex: 1,
    position: 'relative',
  },
  cleanCoverImage: {
    width: '100%',
    height: '100%',
  },
  cardTopBadgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  cardAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  cardAvailableText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cardBookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardBookmarkBtnActive: {
    backgroundColor: '#FEF3C7',
  },
  cleanCoverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 40,
  },
  cleanNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  cleanHeroName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cleanHeroMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
  },
  cleanLocationPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cleanLocationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cleanNicheRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  cleanTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  cleanTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cleanStreakPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.6)',
  },
  cleanStreakPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE047',
  },
  tapPromptStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tapPromptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tapPromptEmoji: {
    fontSize: 13,
  },
  tapPromptText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tapPromptArrow: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FDE047',
  },

  // SWIPE STAMPS
  stampOverlay: {
    position: 'absolute',
    top: 24,
    zIndex: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2.5,
  },
  acceptStamp: {
    left: 20,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
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
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  saveStampText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
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

  // INCOMING REQUESTS SECTION
  requestsHeaderBanner: {
    backgroundColor: 'rgba(254, 242, 242, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(254, 205, 211, 0.9)',
    marginBottom: 14,
  },
  requestsHeaderIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E11D48',
  },
  requestsCountPill: {
    backgroundColor: '#E11D48',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  requestsCountPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestsHeaderSubtitle: {
    fontSize: 11.5,
    color: '#881337',
    lineHeight: 16,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  requestInfoCol: {
    flex: 1,
  },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  requestNameText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#171420',
  },
  requestStreakBadge: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 100,
  },
  requestStreakBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  requestRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4360',
    marginBottom: 2,
  },
  requestTimeText: {
    fontSize: 11,
    color: '#7F7894',
    fontWeight: '500',
  },
  pitchMessageBubble: {
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 10,
  },
  pitchMessageLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  pitchMessageText: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 17,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  requestCompatibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 253, 244, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.9)',
    marginBottom: 14,
  },
  requestGhostMini: {
    width: 14,
    height: 14,
  },
  requestCompatibilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  requestActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  requestDeclineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestDeclineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  requestAcceptBtn: {
    flex: 1.4,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
  },
  requestAcceptGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAcceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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

  // 5. DEEP CREATOR DETAIL MODAL STYLES (MEDIA_1787000399594)
  detailSafeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3FA',
    backgroundColor: '#FAF9F6',
  },
  detailBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
  },
  detailBackBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  detailHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  detailBookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  detailHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  detailCoverImage: {
    width: '100%',
    height: 240,
  },
  detailAvailabilityBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  detailAvailableText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  detailStatCol: {
    alignItems: 'flex-start',
  },
  detailStatValGold: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
  },
  detailStatValPurple: {
    fontSize: 18,
    fontWeight: '900',
    color: '#582CDB',
  },
  detailStatLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
    marginTop: 1,
  },
  detailStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E8E3FA',
  },
  detailTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  detailTagPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4360',
  },
  detailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailSparkleIcon: {
    fontSize: 16,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  detailWhyFitsText: {
    fontSize: 13,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 14,
    fontWeight: '500',
  },
  detailFitBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailFitBadge: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  detailFitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // COLLAB BLUEPRINT CARD
  collabBlueprintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  collabIdeaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  collabIdeaHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#582CDB',
  },
  collabIdeaTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 12,
  },
  collabIdeaBody: {
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 14,
    gap: 6,
  },
  collabIdeaItem: {
    fontSize: 12.5,
    color: '#4B4360',
    lineHeight: 18,
  },
  collabIdeaBold: {
    fontWeight: '800',
    color: '#582CDB',
  },
  collabFormatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  collabFormatChip: {
    backgroundColor: '#F5F3FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  collabFormatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  buildCollabPlanBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildCollabPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // 2-COLUMN METRICS
  detailTwoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailMetricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  detailMetricIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  detailMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailMetricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },

  // AUDIENCE CORRELATION
  audienceCorrTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 10,
  },
  vennContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  nicheLevelRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  nicheLevelBox: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8FC',
  },
  nicheLevelLbl: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    marginBottom: 2,
  },
  nicheLevelVal: {
    fontSize: 12.5,
    fontWeight: '800',
  },

  // DETAIL JARVIS CARD
  detailJarvisCard: {
    backgroundColor: 'rgba(245, 243, 255, 0.95)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailJarvisGhost: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  detailJarvisLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailJarvisText: {
    fontSize: 12.5,
    color: '#4B4360',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },

  // READINESS CARD
  readinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 20,
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readinessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  readinessBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  readinessBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  readinessItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  readinessCheckIcon: {
    fontSize: 14,
  },
  readinessItemText: {
    fontSize: 12.5,
    color: '#4B4360',
    fontWeight: '500',
  },

  // DETAIL BOTTOM ACTION ROW
  detailBottomActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  detailConnectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailConnectGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailConnectBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailSaveSquareBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputGroupFull: {
    width: '100%',
    marginBottom: 12,
  },
  inputFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  singleLineInput: {
    width: '100%',
    height: 40,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
  },
  platformPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  platformPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 243, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#EDE8FC',
  },
  platformPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7F7894',
  },
  platformPillTextActive: {
    color: '#FFFFFF',
  },
  collabScheduleInfoBox: {
    width: '100%',
    backgroundColor: '#FAF8FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 14,
  },
  scheduleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scheduleInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  scheduleInfoValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
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
