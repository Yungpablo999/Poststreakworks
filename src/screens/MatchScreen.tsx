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
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { CreatorProfileModal } from '../components/CreatorProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 95;
const SWIPE_UP_THRESHOLD = 85;

interface MatchScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
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

interface CollabIdeaDetail {
  title: string;
  hook: string;
  bts: string;
  lesson: string;
  chips: string[];
}

interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  followers: string;
  audienceCount: string;
  location: string;
  coverImage: any;
  bio: string;
  tags: string[];
  categoryTags: string[];
  streak: number;
  availability: string;
  consistencyRating: string;
  whyFitsDescription: string;
  whyFitsPills: string[];
  collabIdea: CollabIdeaDetail;
  correlationPercent: number;
  primaryNiche: { name: string; level: string; percent: string; color: string };
  secondaryNiche: { name: string; level: string; percent: string; color: string };
  jarvisDeepInsight: string;
  readinessChecks: string[];
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
    role: 'Travel & Lifestyle Vlogger',
    followers: '85K',
    audienceCount: '85,000+',
    location: 'Lagos, NG',
    coverImage: require('../../assets/images/amara-creator-cover.jpg'),
    bio: 'Filming authentic travel routines across West Africa. Looking for creators to co-create luxury travel content.',
    tags: ['🌿 Travel', '✨ Lifestyle', '🎥 4K Vlogs'],
    categoryTags: ['Lifestyle', 'Travel', 'Storytelling', 'Short-form Video'],
    streak: 44,
    availability: 'Available This Week',
    consistencyRating: 'High',
    whyFitsDescription:
      'Amara’s audience overlaps with your lifestyle and creator journey content. This match could support a strong short-form collaboration.',
    whyFitsPills: ['Audience Overlap', 'Similar Content Style', 'Strong Posting Rhythm'],
    collabIdea: {
      title: '“24 Hours Creating in Lagos”',
      hook: 'Two creators, one city, zero sleep.',
      bts: 'iPhone and natural lighting.',
      lesson: 'How we both built our streaks today.',
      chips: ['🎥 Reel', '⏱ 30-45 Sec', '📅 Sat 2 PM'],
    },
    correlationPercent: 76,
    primaryNiche: { name: 'LIFESTYLE', level: 'High', percent: '94%', color: '#10B981' },
    secondaryNiche: { name: 'TRAVEL', level: 'Medium', percent: '68%', color: '#6366F1' },
    jarvisDeepInsight:
      'Amara’s content style matches your creator journey niche. A simple day-in-the-life collab could work well for both audiences.',
    readinessChecks: [
      'Profile verified & complete',
      'Active high-performance streak',
      'High response likelihood',
    ],
    tracking: {
      growthRate: '+4.2K followers',
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
    role: 'Tech & AI Creator',
    followers: '156K',
    audienceCount: '156,000+',
    location: 'London, UK',
    coverImage: require('../../assets/images/tomi-avatar.jpg'),
    bio: 'Building AI-first creator workflows & tech reviews. Looking for creators to co-host product launch deep-dives.',
    tags: ['🤖 AI Tools', '📱 Tech Reviews', '📈 Viral Reach'],
    categoryTags: ['Tech', 'AI Workflows', 'Hardware', 'Productivity'],
    streak: 52,
    availability: 'Available This Week',
    consistencyRating: 'Elite',
    whyFitsDescription:
      'Tomi produces cutting-edge AI workflow content that aligns with your high-efficiency creator systems.',
    whyFitsPills: ['Workflow Tech', 'High Retention', 'Elite Posting Streak'],
    collabIdea: {
      title: '“AI vs Manual: 1-Hour Video Challenge”',
      hook: 'Can AI cut video editing time by 80%? We tested it live.',
      bts: 'Screen recordings & live timer.',
      lesson: 'Top 3 automations every creator needs.',
      chips: ['🎥 Short', '⏱ 45 Sec', '📅 Thu 6 PM'],
    },
    correlationPercent: 88,
    primaryNiche: { name: 'AI & TECH', level: 'High', percent: '96%', color: '#10B981' },
    secondaryNiche: { name: 'WORKFLOW', level: 'High', percent: '91%', color: '#6366F1' },
    jarvisDeepInsight:
      'High overlap in productivity and workflow audience with 4.8x average viral reach across tech reels.',
    readinessChecks: [
      'Profile verified & complete',
      'Active high-performance streak',
      'High response likelihood',
    ],
    tracking: {
      growthRate: '+12.8K followers',
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
    role: 'Fashion & Aesthetic',
    followers: '52K',
    audienceCount: '52,000+',
    location: 'Toronto, CA',
    coverImage: require('../../assets/images/zainab-avatar.jpg'),
    bio: 'Curating high-end aesthetic lookbooks & studio vlogs. Looking for creators to co-produce visual shoots.',
    tags: ['👗 Fashion', '✨ Aesthetic', '☕ Lifestyle'],
    categoryTags: ['Fashion', 'Minimalism', 'Studio Vlogs', 'Lookbooks'],
    streak: 38,
    availability: 'Available Weekend',
    consistencyRating: 'High',
    whyFitsDescription:
      'Zainab’s minimalist aesthetic and storytelling resonate strongly with lifestyle and visual branding audiences.',
    whyFitsPills: ['Visual Style', 'Aesthetic Overlap', 'Engaged Audience'],
    collabIdea: {
      title: '“Capsule Wardrobe for Nomadic Creators”',
      hook: '5 essential pieces to film in 10 different cities.',
      bts: 'Studio lighting & color graded edits.',
      lesson: 'Visual minimalism in creator production.',
      chips: ['🎥 Reel', '⏱ 30 Sec', '📅 Sat 11 AM'],
    },
    correlationPercent: 72,
    primaryNiche: { name: 'FASHION', level: 'High', percent: '89%', color: '#10B981' },
    secondaryNiche: { name: 'AESTHETIC', level: 'Medium', percent: '71%', color: '#6366F1' },
    jarvisDeepInsight:
      'Strong visual aesthetic alignment with top-tier comment-to-view ratios on aesthetic reels.',
    readinessChecks: [
      'Profile verified & complete',
      'Active high-performance streak',
      'High response likelihood',
    ],
    tracking: {
      growthRate: '+2.1K followers',
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
    role: 'Fitness & Habit Coach',
    followers: '110K',
    audienceCount: '110,000+',
    location: 'New York, US',
    coverImage: require('../../assets/images/marcus-avatar.jpg'),
    bio: 'High-performance fitness & daily discipline routines. Looking for creators to partner on 30-day challenge series.',
    tags: ['🏋️ Fitness', '🔥 Daily Habits', '⚡ High Retention'],
    categoryTags: ['Fitness', 'Discipline', 'Daily Routine', 'Mindset'],
    streak: 60,
    availability: 'Available Daily',
    consistencyRating: 'Elite',
    whyFitsDescription:
      'Marcus thrives on ironclad daily discipline, creating an ideal accountability synergy with your daily streak.',
    whyFitsPills: ['Discipline Synergy', 'Streak Alignment', 'High Energy'],
    collabIdea: {
      title: '“The 5 AM Creator Morning Routine”',
      hook: 'What happens when 2 creators optimize their mornings for 30 days?',
      bts: 'Split screen sunrise gym vs studio sessions.',
      lesson: 'Daily habit architecture for mental stamina.',
      chips: ['🎥 Short', '⏱ 45 Sec', '📅 Mon 7 AM'],
    },
    correlationPercent: 84,
    primaryNiche: { name: 'FITNESS', level: 'High', percent: '95%', color: '#10B981' },
    secondaryNiche: { name: 'HABITS', level: 'High', percent: '88%', color: '#6366F1' },
    jarvisDeepInsight:
      'Massive streak alignment. Both of you thrive on high-discipline posting schedules.',
    readinessChecks: [
      'Profile verified & complete',
      'Active high-performance streak',
      'High response likelihood',
    ],
    tracking: {
      growthRate: '+8.5K followers',
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
    followers: '94K',
    audienceCount: '94,000+',
    location: 'Berlin, DE',
    coverImage: require('../../assets/images/elena-avatar.jpg'),
    bio: 'Cinematographer & visual director crafting short films. Let’s co-direct high-production Reels that blow minds! 🎬',
    tags: ['🎥 Filmmaking', '🎬 Editing', '✨ Viral Hooks'],
    categoryTags: ['Cinematography', 'Sound Design', 'Short Film', 'Grading'],
    streak: 41,
    availability: 'Available This Week',
    consistencyRating: 'High',
    whyFitsDescription:
      'Elena’s cinematic editing and sound design elevate short-form videos into viral visual spectacles.',
    whyFitsPills: ['Production Value', 'Cinematic Edits', 'Story Pacing'],
    collabIdea: {
      title: '“Sound Secrets of 10M Reels”',
      hook: 'The 3 hidden audio layers that keep viewers hooked till the end.',
      bts: 'Timeline zoom-ins & foley sound breakdown.',
      lesson: 'Auditory psychology for retention.',
      chips: ['🎥 Reel', '⏱ 40 Sec', '📅 Tue 8 PM'],
    },
    correlationPercent: 81,
    primaryNiche: { name: 'CINEMA', level: 'High', percent: '93%', color: '#10B981' },
    secondaryNiche: { name: 'EDITING', level: 'High', percent: '86%', color: '#6366F1' },
    jarvisDeepInsight:
      'Her pacing and visual sound design can amplify your video watch-through rates significantly.',
    readinessChecks: [
      'Profile verified & complete',
      'Active high-performance streak',
      'High response likelihood',
    ],
    tracking: {
      growthRate: '+6.4K followers',
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
  onOpenJarvisPro,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [activeSection, setActiveSection] = useState<'deck' | 'requests' | 'tracking' | 'connected'>('deck');
  const [activeFilter, setActiveFilter] = useState<'niche' | 'streak' | 'nearby' | 'ai'>('niche');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Incoming Connection Requests state
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(INCOMING_REQUESTS_DATA);
  const [pendingPitches, setPendingPitches] = useState<string[]>([]);

  // Tracking state
  const [matchesLeft, setMatchesLeft] = useState(5);
  const [savedCreators, setSavedCreators] = useState<CreatorProfile[]>([
    CREATOR_DECK[0], // Amara Okafor tracked by default
  ]);
  const [connectedCreators, setConnectedCreators] = useState<CreatorProfile[]>([
    CREATOR_DECK[1], // Tomi Adebayo
    CREATOR_DECK[2], // Zainab Okafor
  ]);

  // Touch isolation state (disables outer ScrollView while dragging cards)
  const [isSwipingCard, setIsSwipingCard] = useState(false);

  // Deep-Dive Creator Profile Modal (from Info ⓘ button)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCreatorForDetail, setSelectedCreatorForDetail] = useState<CreatorProfile>(CREATOR_DECK[0]);

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [lastConnectedName, setLastConnectedName] = useState<string>('Creator');
  const [showCollabIdeaModal, setShowCollabIdeaModal] = useState(false);
  
  // Pitch & Collab Plan Modal
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [pitchRecipient, setPitchRecipient] = useState<CreatorProfile>(CREATOR_DECK[0]);
  const [pitchMessageDraft, setPitchMessageDraft] = useState('');
  const [selectedPitchPlatform, setSelectedPitchPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram');
  const [showPitchSuccessModal, setShowPitchSuccessModal] = useState(false);

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ultra-responsive, effortless Tinder PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 4;
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        return Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.75;
      },
      onPanResponderGrant: () => {
        position.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.25 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 45 || gesture.vx > 0.18) {
          swipeCard('right');
        } else if (gesture.dx < -45 || gesture.vx < -0.18) {
          swipeCard('left');
        } else {
          resetCardPosition();
        }
      },
      onPanResponderTerminate: (_, gesture) => {
        if (gesture.dx > 45 || gesture.vx > 0.18) {
          swipeCard('right');
        } else if (gesture.dx < -45 || gesture.vx < -0.18) {
          swipeCard('left');
        } else {
          resetCardPosition();
        }
      },
      onPanResponderTerminationRequest: () => false,
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

    // Pulse animation for live status dot
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [ghostFloatY, pulseAnim]);

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
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const swipeCard = (direction: 'left' | 'right' | 'up') => {
    const creator = CREATOR_DECK[currentIndex % CREATOR_DECK.length];
    const targetX = direction === 'right' ? SCREEN_WIDTH + 160 : direction === 'left' ? -SCREEN_WIDTH - 160 : 0;
    const targetY = direction === 'up' ? -SCREEN_WIDTH - 160 : 0;

    Animated.timing(position, {
      toValue: { x: targetX, y: targetY },
      duration: 190,
      easing: Easing.out(Easing.cubic),
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

  const handleOpenInfo = (creator: CreatorProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCreatorForDetail(creator);
    setShowDetailModal(true);
  };

  // OPEN PITCH & COLLAB PLAN MODAL
  const handleOpenPitchModal = (creator: CreatorProfile) => {
    setPitchRecipient(creator);
    setPitchMessageDraft(
      'Hey ' +
        creator.name.split(' ')[0] +
        '! Loved your ' +
        creator.role +
        ' content. Jarvis suggested we co-create ' +
        creator.collabIdea.title +
        '. Would love to connect and film this together!'
    );
    setShowDetailModal(false);
    setShowCollabIdeaModal(false);
    setTimeout(() => {
      setShowPitchModal(true);
    }, 200);
  };

  const handleSendPitchConfirm = () => {
    setShowPitchModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPendingPitches((prev) => [...prev, pitchRecipient.id]);
    setTimeout(() => {
      setShowPitchSuccessModal(true);
    }, 250);
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
      audienceCount: req.followers,
      location: req.location,
      coverImage: req.coverImage,
      bio: req.pitchMessage,
      tags: req.tags,
      categoryTags: ['Design', 'Workflows', 'Creative'],
      streak: req.streak,
      availability: 'Available This Week',
      consistencyRating: 'High',
      whyFitsDescription:
        'Great synergy and audience overlap with your creator workflow niche.',
      whyFitsPills: ['Audience Overlap', 'Shared Style', 'High Consistency'],
      collabIdea: {
        title: '“Creator Design Systems Workshop”',
        hook: 'How to build reusable creator assets that save 10 hours a week.',
        bts: 'Live Figma screen share.',
        lesson: 'Designing for viral readability.',
        chips: ['🎥 Reel', '⏱ 30 Sec', '📅 Sat 2 PM'],
      },
      correlationPercent: 82,
      primaryNiche: { name: 'DESIGN', level: 'High', percent: '92%', color: '#10B981' },
      secondaryNiche: { name: 'SYSTEMS', level: 'Medium', percent: '74%', color: '#6366F1' },
      jarvisDeepInsight:
        'Audience loves actionable creator tooling and design hacks. High synergy potential.',
      readinessChecks: [
        'Profile verified & complete',
        'Active high-performance streak',
        'High response likelihood',
      ],
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
  const isDetailSaved = savedCreators.some((c) => c.id === selectedCreatorForDetail.id);

  // Card rotation & stamp interpolation with natural physical dynamics
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.8, 0, SCREEN_WIDTH * 0.8],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const nextCardScale = position.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: [1, 0.88, 1],
    extrapolate: 'clamp',
  });

  const acceptStampOpacity = position.x.interpolate({
    inputRange: [20, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const declineStampOpacity = position.x.interpolate({
    inputRange: [-80, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const saveStampOpacity = position.y.interpolate({
    inputRange: [-80, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP HEADER APP BAR */}
        <FreeAppHeader
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenMessages={() => {
            if (onOpenMessages) {
              onOpenMessages();
            } else {
              showToast('💬 Match Messages');
            }
          }}
          onOpenNotifications={() => setShowNotificationModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          userProfile={userProfile}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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

            <Text style={styles.pageHeadline} numberOfLines={1} adjustsFontSizeToFit={true}>
              Find creators worth building with.
            </Text>
            <Text style={styles.pageSubtitle}>
              Swipe right to match, left to skip, or tap ⓘ for deep-dive match intelligence.
            </Text>

            {/* LIVE TRACKING STATS BAR (INFORMATION & QUICK DESTINATION JUMPS) */}
            <View style={styles.trackingStatsBar}>
              <Pressable style={styles.trackingStatItem} onPress={() => setActiveSection('deck')}>
                <Text style={styles.trackingStatVal}>⭐ {matchesLeft}/5</Text>
                <Text style={styles.trackingStatLbl} numberOfLines={1}>Matches</Text>
              </Pressable>
              <View style={styles.trackingStatDivider} />
              <Pressable style={styles.trackingStatItem} onPress={() => setActiveSection('requests')}>
                <Text style={styles.trackingStatVal}>📩 {incomingRequests.length}</Text>
                <Text style={styles.trackingStatLbl} numberOfLines={1}>Requests</Text>
              </Pressable>
              <View style={styles.trackingStatDivider} />
              <Pressable style={styles.trackingStatItem} onPress={() => setActiveSection('tracking')}>
                <Text style={styles.trackingStatVal}>📡 {savedCreators.length}</Text>
                <Text style={styles.trackingStatLbl} numberOfLines={1}>Tracked</Text>
              </Pressable>
              <View style={styles.trackingStatDivider} />
              <Pressable style={styles.trackingStatItem} onPress={() => setActiveSection('connected')}>
                <Text style={styles.trackingStatVal}>💜 {connectedCreators.length}</Text>
                <Text style={styles.trackingStatLbl} numberOfLines={1}>Connected</Text>
              </Pressable>
            </View>
          </View>

          {/* VIEW SWITCHER TABS: SWIPE DECK vs INCOMING REQUESTS vs TRACKED RADAR vs CONNECTED */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionTabsRow}
            style={{ flexGrow: 0, marginBottom: 14 }}
          >
            <Pressable
              style={[styles.sectionTab, activeSection === 'deck' && styles.sectionTabActive]}
              onPress={() => setActiveSection('deck')}
            >
              <Text style={[styles.sectionTabText, activeSection === 'deck' && styles.sectionTabTextActive]}>
                Deck
              </Text>
            </Pressable>

            {/* REQUESTS TAB WITH BADGE DOT */}
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
          </ScrollView>

          {/* TAB 1: PURE GESTURE SWIPE DECK (CLEAN TINDER-STYLE PHOTO CARD WITH ⓘ INFO BUTTON) */}
          {activeSection === 'deck' && (
            <View>
              {/* FILTER PILLS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow} style={{ flexGrow: 0, marginBottom: 12 }}>
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
            </ScrollView>

              {/* TINDER SWIPEABLE CARD STACK */}
              <View style={styles.cardStackContainer}>
                {/* BOTTOM / NEXT CARD IN STACK */}
                <Animated.View
                  style={[
                    styles.bottomCardContainer,
                    {
                      transform: [{ scale: nextCardScale }],
                      opacity: nextCardOpacity,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <View style={styles.tinderCardOuter}>
                    <Image
                      source={nextCreator.coverImage}
                      style={styles.tinderCardCover}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(12, 10, 20, 0.4)', 'rgba(12, 10, 20, 0.95)']}
                      style={styles.tinderCardGradient}
                    >
                      <View style={styles.tinderCardHeaderRow}>
                        <View style={styles.nameVerifiedRow}>
                          <Text style={styles.tinderCreatorName}>
                            {nextCreator.name.split(' ')[0]}
                          </Text>
                          <View style={styles.verifiedCheckBadge}>
                            <Text style={styles.verifiedCheckText}>✓</Text>
                          </View>
                          <View style={styles.tinderStreakBadge}>
                            <Text style={styles.tinderStreakBadgeText}>🔥 {nextCreator.streak}d</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.tinderCreatorRole}>
                        {nextCreator.role} • {nextCreator.followers} • 📍 {nextCreator.location}
                      </Text>
                      <Text style={styles.tinderCreatorBio} numberOfLines={2}>
                        {nextCreator.bio}
                      </Text>
                      <View style={styles.tinderTagsRow}>
                        {nextCreator.tags.map((tag, idx) => (
                          <View key={idx} style={styles.tinderTagPill}>
                            <Text style={styles.tinderTagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </LinearGradient>
                  </View>
                </Animated.View>

                {/* TOP ACTIVE SWIPEABLE CARD */}
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[styles.topCardContainer, animatedCardStyle]}
                >
                  <View style={styles.tinderCardOuter}>
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

                    {/* Full-bleed Photo */}
                    <Image
                      source={currentCreator.coverImage}
                      style={styles.tinderCardCover}
                      resizeMode="cover"
                    />

                    {/* Top Overlay Badges */}
                    <View style={styles.tinderTopOverlayRow}>
                      <View style={styles.tinderLiveRadarPill}>
                        <Animated.View
                          style={[
                            styles.pulseDotInner,
                            { transform: [{ scale: pulseAnim }] },
                          ]}
                        />
                        <Text style={styles.tinderLiveRadarText} numberOfLines={1}>
                          {currentCreator.tracking.statusText}
                        </Text>
                      </View>

                      {/* Top Right Group: Track Button + INFO ⓘ Button */}
                      <View style={styles.tinderTopRightGroup}>
                        <Pressable
                          style={[styles.onCardSaveBtn, isCurrentSaved && styles.onCardSaveBtnActive]}
                          onPress={() => handleToggleTrack(currentCreator)}
                          hitSlop={8}
                        >
                          <Text style={{ fontSize: 13 }}>{isCurrentSaved ? '⭐' : '☆'}</Text>
                          <Text style={[styles.onCardSaveText, isCurrentSaved && styles.onCardSaveTextActive]}>
                            {isCurrentSaved ? 'Tracking' : 'Save'}
                          </Text>
                        </Pressable>

                        {/* INFO ⓘ JEWEL BUTTON OVERLAY */}
                        <Pressable
                          style={({ pressed }) => [styles.onCardInfoBtn, pressed && styles.btnPressed]}
                          onPress={() => handleOpenInfo(currentCreator)}
                          hitSlop={8}
                        >
                          <Text style={styles.onCardInfoBtnText}>ⓘ</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Bottom Frosted Dark Glass Gradient Over Photo */}
                    <LinearGradient
                      colors={['transparent', 'rgba(12, 10, 20, 0.45)', 'rgba(12, 10, 20, 0.96)']}
                      style={styles.tinderCardGradient}
                    >
                      <View style={styles.tinderCardHeaderRow}>
                        <View style={styles.nameVerifiedRow}>
                          <Text style={styles.tinderCreatorName}>
                            {currentCreator.name.split(' ')[0]}
                          </Text>
                          <View style={styles.verifiedCheckBadge}>
                            <Text style={styles.verifiedCheckText}>✓</Text>
                          </View>
                          <View style={styles.tinderStreakBadge}>
                            <Text style={styles.tinderStreakBadgeText}>🔥 {currentCreator.streak}d</Text>
                          </View>
                        </View>

                        {/* Info Button on Card Bottom */}
                        <Pressable
                          style={styles.cardBottomInfoPill}
                          onPress={() => handleOpenInfo(currentCreator)}
                          hitSlop={8}
                        >
                          <Text style={styles.cardBottomInfoPillText}>Deep Dive ➔</Text>
                        </Pressable>
                      </View>

                      <Text style={styles.tinderCreatorRole}>
                        {currentCreator.role} • {currentCreator.followers} • 📍 {currentCreator.location}
                      </Text>

                      {/* Clean 2-Line Punchy Intro Bio */}
                      <Text style={styles.tinderCreatorBio} numberOfLines={2}>
                        {currentCreator.bio}
                      </Text>

                      {/* Aesthetic Tag Pills */}
                      <View style={styles.tinderTagsRow}>
                        {currentCreator.tags.map((tag, idx) => (
                          <View key={idx} style={styles.tinderTagPill}>
                            <Text style={styles.tinderTagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </LinearGradient>
                  </View>
                </Animated.View>
              </View>

              {/* GESTURE HINT STRIP */}
              <View style={styles.gestureHintRow}>
                <Text style={styles.gestureHintText}>👈 Left to skip</Text>
                <Text style={styles.gestureHintDot}>•</Text>
                <Text style={styles.gestureHintText}>Right to match 👉</Text>
              </View>

              {/* SUGGESTED COLLAB CARD */}
              <View style={styles.suggestedCollabCard}>
                <View style={styles.collabHeaderRow}>
                  <View style={styles.collabHeaderLeft}>
                    <Image
                      source={require('../../assets/images/jarvis-core-flame.png')}
                      style={styles.collabGhostIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.collabHeaderTitle} numberOfLines={1} adjustsFontSizeToFit={true}>
                      JARVIS SUGGESTED COLLAB
                    </Text>
                  </View>
                  <View style={styles.potencyBadge}>
                    <Text style={styles.potencyBadgeText}>📈 High Potential</Text>
                  </View>
                </View>

                <Text style={styles.collabHeadline}>‘Day in Lagos’ co-created Reel</Text>
                
                <View style={styles.collabMetaRow}>
                  <View style={styles.collabMetaChip}>
                    <Text style={styles.collabMetaChipText}>Reel  •  7:30 PM Peak</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.buildIdeaBtn, pressed && styles.btnPressed]}
                  onPress={() => handleOpenPitchModal(currentCreator)}
                >
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buildIdeaGradient}
                  >
                    <Text style={styles.buildIdeaBtnText}>⚡ Build & Pitch Collab Plan</Text>
                  </LinearGradient>
                </Pressable>
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
                  Creators who want to collaborate with you. Accept to connect and unlock direct messaging.
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
                        source={require('../../assets/images/jarvis-core-flame.png')}
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
                  <View key={creator.id} style={styles.trackedCreatorCard}>
                    {/* Creator Header Row */}
                    <View style={styles.trackedCardHeaderRow}>
                      <Image source={creator.coverImage} style={styles.trackedAvatarImg} resizeMode="cover" />
                      <View style={styles.trackedInfoCol}>
                        <View style={styles.trackedNameRow}>
                          <Text style={styles.trackedNameText} numberOfLines={1} adjustsFontSizeToFit={true}>
                            {creator.name}
                          </Text>
                          <View style={styles.streakBadgeMini}>
                            <Text style={styles.streakBadgeMiniText}>🔥 {creator.streak}d</Text>
                          </View>
                        </View>
                        <Text style={styles.trackedMetaText} numberOfLines={1}>
                          {creator.role} • {creator.followers}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.connectSmallBtn, pressed && styles.btnPressed]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }
                          handleOpenPitchModal(creator);
                        }}
                      >
                        <Text style={styles.connectSmallBtnText}>Match →</Text>
                      </Pressable>
                    </View>

                    {/* Live Tracking Intelligence Box (Interactive & Clean Alignment) */}
                    <View style={styles.trackingMetricsBox}>
                      <Pressable
                        style={({ pressed }) => [styles.trackingMetricRow, pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          showToast(`📈 Growth Velocity: ${creator.name.split(' ')[0]} gained ${creator.tracking.growthRate} over the last 30 days.`);
                        }}
                        hitSlop={4}
                      >
                        <Text style={styles.trackingMetricLabel} numberOfLines={1}>📈 Growth Velocity</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Text style={styles.trackingMetricValue} numberOfLines={1}>{creator.tracking.growthRate}</Text>
                          <Text style={{ fontSize: 10, color: '#A78BFA' }}>ⓘ</Text>
                        </View>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [styles.trackingMetricRow, pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          showToast(`⏱ Posting Rhythm: ${creator.name.split(' ')[0]} posts ${creator.tracking.postingPace} with a ${creator.streak}-day streak.`);
                        }}
                        hitSlop={4}
                      >
                        <Text style={styles.trackingMetricLabel} numberOfLines={1}>⏱ Posting Rhythm</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Text style={styles.trackingMetricValue} numberOfLines={1}>{creator.tracking.postingPace}</Text>
                          <Text style={{ fontSize: 10, color: '#A78BFA' }}>ⓘ</Text>
                        </View>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [styles.trackingMetricRow, pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          showToast(`✨ Collab Window: ${creator.name.split(' ')[0]}’s audience engagement peaks on ${creator.tracking.bestCollabWindow}.`);
                        }}
                        hitSlop={4}
                      >
                        <Text style={styles.trackingMetricLabel} numberOfLines={1}>✨ Best Collab Window</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Text style={styles.trackingMetricValue} numberOfLines={1}>{creator.tracking.bestCollabWindow}</Text>
                          <Text style={{ fontSize: 10, color: '#A78BFA' }}>ⓘ</Text>
                        </View>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [styles.trackingStatusRow, pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          showToast(`🟢 Activity: ${creator.name.split(' ')[0]} posted ${creator.tracking.lastActive}.`);
                        }}
                        hitSlop={4}
                      >
                        <Text style={styles.trackingStatusText} numberOfLines={1}>{creator.tracking.statusText}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 4: CONNECTED CREATORS LIST */}
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
          {/* BANNER: CREATOR SQUADS */}
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
                Join private creator circles in your niche to collaborate, share feedback, and grow together.
              </Text>

              <View style={styles.squadsFooterRow}>
                <View style={styles.squadsProBadge}>
                  <Text style={styles.squadsProBadgeText}>⚡ PRO FEATURE</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.unlockSquadsBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    if (onOpenJarvisPro) {
                      onOpenJarvisPro();
                    } else if (onNavigateTab) {
                      onNavigateTab('growth');
                    } else {
                      showToast('✨ Pro Squads unlocked!');
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goldBtnGradient}
                  >
                    <Text style={styles.unlockSquadsBtnText}>Unlock Creator Squads →</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* SECTION: JARVIS ENGINE WISDOM */}
          <View style={styles.wisdomCard}>
            <Image
              source={require('../../assets/images/jarvis-core-flame.png')}
              style={styles.wisdomGhostIcon}
              resizeMode="contain"
            />
            <View style={styles.wisdomContentCol}>
              <Text style={styles.wisdomQuote}>
                “Jarvis finds creators who match your niche, posting habits, and growth goals—so your next collaboration has a better chance of working.”
              </Text>
              <Text style={styles.wisdomAuthor}>— Jarvis Engine</Text>
            </View>
          </View>
        </ScrollView>

        {/* 3. TOAST OVERLAY */}
        <BrandToast message={toastMessage} />

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
          subtitle={'You connected with ' + lastConnectedName + '. +50 XP awarded to your streak!'}
          badgeText="CREATOR CONNECTED"
          xpEarned={50}
          streakCount={userProfile?.streakCount || 1}
          actionText="Continue Exploring"
          onDismiss={() => setShowConnectModal(false)}
        />

        {/* 6. PITCH COLLAB PLAN & CONNECT MODAL */}
        <Modal
          visible={showPitchModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowPitchModal(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              {/* Tap backdrop outside card to dismiss keyboard / modal */}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowPitchModal(false);
                }}
              />
              <View style={[styles.modalCard, { maxWidth: 356 }]}>
                <View style={styles.modalBadgePill}>
                  <Text style={styles.modalBadgeText}>COLLAB PITCH • JARVIS AI</Text>
                </View>
                <Text style={styles.modalTitle}>Pitch Plan to {pitchRecipient.name.split(' ')[0]}</Text>
                <Text style={styles.modalSubtitle}>
                  Send this co-creation blueprint as your connection invite.
                </Text>

                {/* Idea Preview Card */}
                <View style={styles.pitchIdeaPreviewBox}>
                  <Text style={styles.pitchIdeaPreviewTitle}>{pitchRecipient.collabIdea.title}</Text>
                  <Text style={styles.pitchIdeaPreviewMeta}>
                    {pitchRecipient.collabIdea.chips.join(' • ')}
                  </Text>
                </View>

                {/* Platform Selector */}
                <View style={styles.inputGroupFull}>
                  <Text style={styles.inputFieldLabel}>TARGET PLATFORM</Text>
                  <View style={styles.platformPillRow}>
                    <Pressable
                      style={[styles.platformPill, selectedPitchPlatform === 'instagram' && styles.platformPillActive]}
                      onPress={() => setSelectedPitchPlatform('instagram')}
                    >
                      <Text style={[styles.platformPillText, selectedPitchPlatform === 'instagram' && styles.platformPillTextActive]}>
                        Instagram
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.platformPill, selectedPitchPlatform === 'tiktok' && styles.platformPillActive]}
                      onPress={() => setSelectedPitchPlatform('tiktok')}
                    >
                      <Text style={[styles.platformPillText, selectedPitchPlatform === 'tiktok' && styles.platformPillTextActive]}>
                        TikTok
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.platformPill, selectedPitchPlatform === 'youtube' && styles.platformPillActive]}
                      onPress={() => setSelectedPitchPlatform('youtube')}
                    >
                      <Text style={[styles.platformPillText, selectedPitchPlatform === 'youtube' && styles.platformPillTextActive]}>
                        Shorts
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Pitch note textarea */}
                <View style={styles.inputGroupFull}>
                  <Text style={styles.inputFieldLabel}>PERSONALIZED COLLAB PITCH</Text>
                  <TextInput
                    style={styles.pitchTextAreaInput}
                    value={pitchMessageDraft}
                    onChangeText={setPitchMessageDraft}
                    placeholder="Write your pitch message..."
                    placeholderTextColor="#A39CB5"
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={true}
                  />
                </View>

                <View style={styles.modalBtnRow}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowPitchModal(false);
                    }}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalPrimaryBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSendPitchConfirm();
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText} numberOfLines={1} adjustsFontSizeToFit={true}>
                      Send Pitch (+50 XP)
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* 6B. ANIMATED COMPLETION CELEBRATION (ON PITCH SENT SUCCESS) */}
        <AnimatedCompletionModal
          visible={showPitchSuccessModal}
          title="Collab Pitch Sent! 🚀"
          subtitle={'Your proposal for ' + pitchRecipient.collabIdea.title + ' was delivered to ' + pitchRecipient.name + '. +50 XP awarded!'}
          badgeText="PITCH DELIVERED"
          xpEarned={50}
          streakCount={userProfile?.streakCount || 1}
          actionText="Explore More Creators"
          onDismiss={() => setShowPitchSuccessModal(false)}
        />

        {/* 7. FULL DEEP-DIVE CREATOR PROFILE MODAL */}
        <CreatorProfileModal
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          creator={selectedCreatorForDetail as any}
          onConnect={(creator) => {
            setShowDetailModal(false);
            handleOpenPitchModal(creator as any);
          }}
          onBuildCollabPlan={(creator) => {
            setShowDetailModal(false);
            handleOpenPitchModal(creator as any);
          }}
        />

        {/* 8. DIRECT MESSAGE MODAL */}
        <Modal
          visible={showMessageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowMessageModal(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              {/* Tap backdrop to dismiss */}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowMessageModal(false);
                }}
              />
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
                  editable={true}
                />

                <View style={styles.modalBtnRow}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowMessageModal(false);
                    }}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalPrimaryBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSendMessage();
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Send Message</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* 9. NOTIFICATIONS MODAL */}
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

        {/* 10. PROFILE MODAL */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF9FD',
  },
  // 1. TOP HEADER APP BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF9FD',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
  },
  headerGhostLogo: {
    width: 26,
    height: 26,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F0FF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // 2. MAIN SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
    width: '100%',
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
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  matchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  freeDiscoveryBadge: {
    backgroundColor: '#F4F0FF',
    paddingVertical: 3.5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
  },
  freeDiscoveryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  pageHeadline: {
    fontSize: Platform.OS === 'web' ? ('clamp(17px, 4.5vw, 20px)' as any) : sFont(19),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    lineHeight: 26,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#5E576E',
    lineHeight: 18,
    marginBottom: 14,
  },

  // TRACKING STATS BAR
  trackingStatsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  trackingStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackingStatVal: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
    textAlign: 'center',
  },
  trackingStatLbl: {
    fontSize: sFont(10),
    fontWeight: '500',
    color: '#5E576E',
    textAlign: 'center',
  },
  trackingStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },

  // SECTION TABS ROW
  sectionTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  sectionTab: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
  },
  sectionTabActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5E576E',
  },
  sectionTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    backgroundColor: '#EF4444',
    marginLeft: 3,
  },

  // FILTER PILLS
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  filterPill: {
    paddingVertical: 5.5,
    paddingHorizontal: 13,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5EE',
  },
  filterPillActive: {
    backgroundColor: '#F3EEFB',
    borderColor: '#7C3AED',
    borderWidth: 1.2,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#7C3AED',
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
  tinderCardOuter: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  tinderCardCover: {
    width: '100%',
    height: '100%',
    position: 'absolute',
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
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    transform: [{ rotate: '-12deg' }],
  },
  acceptStampText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1,
  },
  declineStamp: {
    right: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    transform: [{ rotate: '12deg' }],
  },
  declineStampText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },
  saveStamp: {
    alignSelf: 'center',
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
  },
  saveStampText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 1,
  },

  // TOP OVERLAYS ON CARD
  tinderTopOverlayRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    zIndex: 50,
  },
  tinderLiveRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flex: 1,
    flexShrink: 1,
    maxWidth: '56%',
    marginRight: 4,
  },
  pulseDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    flexShrink: 0,
  },
  tinderLiveRadarText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#34D399',
    flexShrink: 1,
  },
  tinderTopRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  onCardSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    flexShrink: 0,
  },
  onCardSaveBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  onCardSaveText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#582CDB',
  },
  onCardSaveTextActive: {
    color: '#D97706',
  },

  // INFO ⓘ BUTTONS
  onCardInfoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  onCardInfoBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  cardBottomInfoPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  cardBottomInfoPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // BOTTOM GRADIENT OVER PHOTO
  tinderCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 18,
    justifyContent: 'flex-end',
  },
  tinderCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tinderCreatorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedCheckBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tinderStreakBadge: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  tinderStreakBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  tinderCreatorRole: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tinderCreatorBio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tinderTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tinderTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  tinderTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // GESTURE HINT STRIP
  gestureHintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
    width: '100%',
  },
  gestureHintText: {
    fontSize: 10.5,
    fontWeight: '700',
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
    gap: 8,
  },
  collabHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexShrink: 1,
  },
  collabGhostIcon: {
    width: 14,
    height: 14,
    flexShrink: 0,
  },
  collabHeaderTitle: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  potencyBadge: {
    backgroundColor: '#F3EEFB',
    paddingVertical: 2,
    paddingHorizontal: 6.5,
    borderRadius: 100,
    flexShrink: 0,
  },
  potencyBadgeText: {
    fontSize: sFont(9),
    fontWeight: '700',
    color: '#7C3AED',
  },
  collabHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  collabMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  collabMetaChip: {
    backgroundColor: '#F8F6FD',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#EDE8F8',
  },
  collabMetaChipText: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '800',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestsHeaderSubtitle: {
    fontSize: 12,
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
    fontSize: 12,
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
    gap: 10,
  },
  trackedAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    flexShrink: 0,
  },
  trackedInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  trackedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  trackedNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
    flexShrink: 1,
  },
  streakBadgeMini: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 100,
    flexShrink: 0,
  },
  streakBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  trackedMetaText: {
    fontSize: 12,
    color: '#7F7894',
    fontWeight: '500',
  },

  trackingMetricsBox: {
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E3FA',
    gap: 7,
  },
  trackingMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trackingMetricLabel: {
    fontSize: sFont(11.5),
    fontWeight: '600',
    color: '#7F7894',
    flexShrink: 1,
  },
  trackingMetricValue: {
    fontSize: sFont(12),
    fontWeight: '800',
    color: '#171420',
  },
  trackingStatusRow: {
    marginTop: 3,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#EDE8FC',
  },
  trackingStatusText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#10B981',
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
    fontSize: 12,
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
    borderRadius: 100,
    paddingVertical: 6.5,
    paddingHorizontal: 13,
    flexShrink: 0,
    marginLeft: 6,
  },
  connectSmallBtnText: {
    fontSize: 11.5,
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
    padding: 16,
  },
  squadsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  squadsTitleText: {
    fontSize: sFont(17),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  squadsDescText: {
    fontSize: sFont(12),
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 14,
  },
  squadsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
  },
  squadsProBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    flexShrink: 0,
  },
  squadsProBadgeText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#FEF3C7',
    letterSpacing: 0.5,
  },
  unlockSquadsBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    flexShrink: 0,
  },
  goldBtnGradient: {
    paddingVertical: 7.5,
    paddingHorizontal: 14,
  },
  unlockSquadsBtnText: {
    fontSize: sFont(11.5),
    fontWeight: '800',
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
    fontSize: 12,
    color: '#4B4360',
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 4,
  },
  wisdomAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },

  // DEEP-DIVE CREATOR PROFILE MODAL (EXACT DESIGN MATCH)
  detailSafeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FAF9F6',
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3FA',
    backgroundColor: '#FAF9F6',
  },
  detailHeaderTitleBox: {
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  detailCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSaveTopBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // Top Photo & Two-Stat Hero Card
  detailHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 12,
  },
  detailCoverImage: {
    width: '100%',
    height: 360,
  },
  detailHeroBody: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  detailAvailabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  detailAvailabilityText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  detailTwoStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTwoStatItem: {
    flex: 1,
  },
  detailStatValGold: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: -0.3,
  },
  detailStatValPurple: {
    fontSize: 20,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: -0.3,
  },
  detailStatLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
    marginTop: 2,
  },
  detailTwoStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8E3FA',
    marginHorizontal: 16,
  },

  // Category Pills Row
  detailCategoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  detailCategoryPill: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  detailCategoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // Card 1: Why This Match Fits
  detailWhyFitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  detailCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sparkleIcon: {
    fontSize: 14,
    color: '#582CDB',
  },
  detailCardTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  detailWhyFitsBody: {
    fontSize: 12.5,
    color: '#4B4360',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  detailWhyFitsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  whyFitsPill: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  whyFitsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // Card 2: Collab Idea Blueprint
  detailCollabIdeaCard: {
    backgroundColor: '#FAF8FF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#EDE8FC',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  collabIdeaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  purplePinIcon: {
    fontSize: 13,
  },
  detailCollabIdeaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  collabIdeaName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  collabScriptStepsCol: {
    gap: 8,
    marginBottom: 14,
  },
  scriptStepItem: {
    flexDirection: 'row',
    gap: 8,
  },
  scriptStepKey: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    width: 52,
  },
  scriptStepVal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#171420',
    flex: 1,
    lineHeight: 16,
  },
  collabIdeaChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  collabIdeaChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  collabIdeaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F7894',
  },
  buildCollabPlanBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buildCollabPlanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildCollabPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Row of 2 Metric Cards
  detailTwoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  detailMetricCardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricCardIconRow: {
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricCardBigValue: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#171420',
  },
  metricCardGoldValue: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#D97706',
  },

  // Card 3: Audience Correlation Venn Diagram
  audienceCorrelationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  correlationHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  vennContainer: {
    width: 240,
    height: 130,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  vennLabelLeft: {
    position: 'absolute',
    left: 48,
    top: 54,
  },
  vennLabelTextPurple: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  vennCenterBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDE8FC',
  },
  vennCenterPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  vennLabelRight: {
    position: 'absolute',
    right: 44,
    top: 54,
  },
  vennLabelTextGold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  correlationIndicatorsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  correlationIndicatorPill: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E3FA',
    alignItems: 'center',
  },
  indicatorName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  indicatorLevel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
  },

  // Card 4: Jarvis Deep Insight Frosted Box
  detailJarvisInsightCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    marginBottom: 14,
  },
  detailJarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailJarvisIcon: {
    width: 18,
    height: 18,
  },
  detailJarvisInsightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  detailJarvisInsightText: {
    fontSize: 12.5,
    color: '#3730A3',
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Card 5: Readiness Checklist
  detailReadinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  readinessHeaderRow: {
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
  readinessReadyBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  readinessReadyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  readinessChecklistCol: {
    gap: 10,
  },
  readinessItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readinessCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  readinessItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B4360',
  },

  // Floating Bottom Action Bar
  detailBottomActionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FAF9F6',
    borderTopWidth: 1,
    borderTopColor: '#E8E3FA',
  },
  detailConnectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailConnectGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  detailBookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBookmarkBtnActive: {
    backgroundColor: '#EDE8FC',
    borderColor: '#582CDB',
  },

  // PITCH MODAL STYLES
  pitchIdeaPreviewBox: {
    width: '100%',
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 12,
  },
  pitchIdeaPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 2,
  },
  pitchIdeaPreviewMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  pitchTextAreaInput: {
    width: '100%',
    height: 80,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    lineHeight: 18,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#7F7894',
  },
  platformPillTextActive: {
    color: '#FFFFFF',
  },
  modalTextAreaInput: {
    width: '100%',
    height: 76,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 12,
  },
  modalPrimaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
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
    bottom: 95,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#582CDB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
