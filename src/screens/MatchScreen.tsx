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
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 95;
const SWIPE_UP_THRESHOLD = 85;

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
    timeAgo: '2h ago',
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
    timeAgo: '5h ago',
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
    bio: 'Filming authentic travel routines & luxury getaways across West Africa. Looking for lifestyle co-creators for dynamic Reels! 🌴',
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
    role: 'Tech & AI Creator',
    followers: '156K',
    audienceCount: '156,000+',
    location: 'London, UK',
    coverImage: require('../../assets/images/tomi-avatar.jpg'),
    bio: 'Building AI-first creator workflows & reviewing next-gen tech. Let’s co-produce deep dives that get millions of views! ⚡',
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
    role: 'Fashion & Aesthetic',
    followers: '52K',
    audienceCount: '52,000+',
    location: 'Toronto, CA',
    coverImage: require('../../assets/images/zainab-avatar.jpg'),
    bio: 'Curating high-end aesthetic lookbooks, capsule wardrobes & studio vlogs. Seeking visual storytellers for collaborative shoots! ☕',
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
    role: 'Fitness & Habit Coach',
    followers: '110K',
    audienceCount: '110,000+',
    location: 'New York, US',
    coverImage: require('../../assets/images/marcus-avatar.jpg'),
    bio: 'High-performance fitness & daily creator discipline routines. Looking for accountability partners for 30-day challenge series! 💪',
    tags: ['🏋️ Fitness', '🔥 Daily Habits', '⚡ High Retention'],
    categoryTags: ['Fitness', 'Discipline', 'Daily Routine', 'Mindset'],
    streak: 60,
    availability: 'Available Daily',
    consistencyRating: 'Elite',
    whyFitsDescription:
      'Marcus thrives on ironclad daily discipline, creating an ideal accountability synergy with your 47-day streak.',
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
      title: '“Sound Design Secrets of 10M-View Reels”',
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
  const [activeSection, setActiveSection] = useState<'discover' | 'requests' | 'network'>('discover');
  const [activeFilter, setActiveFilter] = useState<'all' | 'niche' | 'streak' | 'nearby'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Incoming Connection Requests state
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(INCOMING_REQUESTS_DATA);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);

  // Tracking & Connection state
  const [matchesLeft, setMatchesLeft] = useState(5);
  const [savedCreators, setSavedCreators] = useState<CreatorProfile[]>([CREATOR_DECK[0]]);
  const [connectedCreators, setConnectedCreators] = useState<CreatorProfile[]>([
    CREATOR_DECK[1], // Tomi Adebayo
    CREATOR_DECK[2], // Zainab Okafor
  ]);

  // Deep-Dive Creator Profile Modal (from Info ⓘ button)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCreatorForDetail, setSelectedCreatorForDetail] = useState<CreatorProfile>(CREATOR_DECK[0]);

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [lastConnectedName, setLastConnectedName] = useState<string>('Creator');
  
  // SEND COLLAB PITCH MODAL
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [pitchRecipient, setPitchRecipient] = useState<CreatorProfile>(CREATOR_DECK[0]);
  const [pitchMessageDraft, setPitchMessageDraft] = useState('');
  const [showPitchSuccessModal, setShowPitchSuccessModal] = useState(false);

  // COLLAB SCHEDULE POP-UP
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

  // Animated values
  const position = useRef(new Animated.ValueXY()).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Helpers
  const isCreatorConnected = (id: string) => connectedCreators.some((c) => c.id === id);
  const isCreatorPending = (id: string) => pendingInvites.includes(id);

  // Ultra-smooth Tinder PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD || gesture.vx > 0.6) {
          swipeCard('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD || gesture.vx < -0.6) {
          swipeCard('left');
        } else if (gesture.dy < -SWIPE_UP_THRESHOLD || gesture.vy < -0.6) {
          swipeCard('up');
        } else {
          resetCardPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetCardPosition();
      },
    })
  ).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -4,
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

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
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
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const resetCardPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const swipeCard = (direction: 'left' | 'right' | 'up') => {
    const creator = CREATOR_DECK[currentIndex % CREATOR_DECK.length];
    const x = direction === 'right' ? SCREEN_WIDTH + 140 : direction === 'left' ? -SCREEN_WIDTH - 140 : 0;
    const y = direction === 'up' ? -SCREEN_WIDTH - 140 : 0;

    Animated.timing(position, {
      toValue: { x, y },
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onSwipeComplete(direction, creator);
    });
  };

  const onSwipeComplete = (direction: 'left' | 'right' | 'up', creator: CreatorProfile) => {
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);

    if (direction === 'right') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setMatchesLeft((prev) => Math.max(0, prev - 1));
      setConnectedCreators((prev) => (prev.some((c) => c.id === creator.id) ? prev : [creator, ...prev]));
      setLastConnectedName(creator.name);
      setShowConnectModal(true);
    } else if (direction === 'left') {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      showToast('Passed on ' + creator.name);
    } else if (direction === 'up') {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSavedCreators((prev) => (prev.some((c) => c.id === creator.id) ? prev : [creator, ...prev]));
      showToast('⭐ Saved & Tracking ' + creator.name);
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
      showToast('⭐ Tracking ' + creator.name + ' on Radar');
    }
  };

  const handleOpenInfo = (creator: CreatorProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCreatorForDetail(creator);
    setShowDetailModal(true);
  };

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
    setTimeout(() => {
      setShowPitchModal(true);
    }, 200);
  };

  const handleSendCollabPitch = () => {
    setShowPitchModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPendingInvites((prev) => [...prev, pitchRecipient.id]);
    setTimeout(() => {
      setShowPitchSuccessModal(true);
    }, 250);
  };

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
      whyFitsDescription: 'Great synergy and audience overlap with your creator workflow niche.',
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
      jarvisDeepInsight: 'Audience loves actionable creator tooling and design hacks. High synergy potential.',
      readinessChecks: ['Profile verified & complete', 'Active high-performance streak', 'High response likelihood'],
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

  const isDetailSaved = savedCreators.some((c) => c.id === selectedCreatorForDetail.id);
  const isDetailConnected = isCreatorConnected(selectedCreatorForDetail.id);
  const isDetailPending = isCreatorPending(selectedCreatorForDetail.id);

  // Card rotation & stamp interpolation
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const acceptStampOpacity = position.x.interpolate({
    inputRange: [15, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const declineStampOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const saveStampOpacity = position.y.interpolate({
    inputRange: [-SWIPE_UP_THRESHOLD, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={styles.container}>
        
        {/* 1. CLEAN TOP APP BAR WITH COMPACT BRANDING & PILL SWITCHER */}
        <View style={styles.headerBar}>
          {/* Left: Ghost Icon & Screen Name */}
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
            <Text style={styles.headerTitle}>Match Radar</Text>
          </View>

          {/* Center: Sleek Segmented View Switcher */}
          <View style={styles.compactSegmentSwitcher}>
            <Pressable
              style={[styles.segmentBtn, activeSection === 'discover' && styles.segmentBtnActive]}
              onPress={() => setActiveSection('discover')}
            >
              <Text style={[styles.segmentBtnText, activeSection === 'discover' && styles.segmentBtnTextActive]}>
                Discover
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, activeSection === 'requests' && styles.segmentBtnActive]}
              onPress={() => setActiveSection('requests')}
            >
              <View style={styles.segmentBadgeRow}>
                <Text style={[styles.segmentBtnText, activeSection === 'requests' && styles.segmentBtnTextActive]}>
                  Requests
                </Text>
                {incomingRequests.length > 0 && <View style={styles.segmentRedDot} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, activeSection === 'network' && styles.segmentBtnActive]}
              onPress={() => setActiveSection('network')}
            >
              <Text style={[styles.segmentBtnText, activeSection === 'network' && styles.segmentBtnTextActive]}>
                Network
              </Text>
            </Pressable>
          </View>

          {/* Right: Quick Matches Pill & Profile Avatar */}
          <View style={styles.headerRightGroup}>
            <View style={styles.matchesCounterPill}>
              <Text style={styles.matchesCounterText}>⭐ {matchesLeft}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              hitSlop={6}
              onPress={() => setShowProfileModal(true)}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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

        {/* 2. SECTION 1: DISCOVER (BREATHABLE, PHOTO-FIRST TINDER SWIPE STACK) */}
        {activeSection === 'discover' && (
          <View style={styles.discoverContainer}>
            
            {/* Minimalist Filter Tags Row */}
            <View style={styles.cleanFilterRow}>
              <Pressable
                style={[styles.cleanFilterPill, activeFilter === 'all' && styles.cleanFilterPillActive]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[styles.cleanFilterText, activeFilter === 'all' && styles.cleanFilterTextActive]}>
                  All Matches
                </Text>
              </Pressable>

              <Pressable
                style={[styles.cleanFilterPill, activeFilter === 'niche' && styles.cleanFilterPillActive]}
                onPress={() => setActiveFilter('niche')}
              >
                <Text style={[styles.cleanFilterText, activeFilter === 'niche' && styles.cleanFilterTextActive]}>
                  Same Niche
                </Text>
              </Pressable>

              <Pressable
                style={[styles.cleanFilterPill, activeFilter === 'streak' && styles.cleanFilterPillActive]}
                onPress={() => setActiveFilter('streak')}
              >
                <Text style={[styles.cleanFilterText, activeFilter === 'streak' && styles.cleanFilterTextActive]}>
                  🔥 40d+ Streaks
                </Text>
              </Pressable>

              <Pressable
                style={[styles.cleanFilterPill, activeFilter === 'nearby' && styles.cleanFilterPillActive]}
                onPress={() => setActiveFilter('nearby')}
              >
                <Text style={[styles.cleanFilterText, activeFilter === 'nearby' && styles.cleanFilterTextActive]}>
                  📍 Nearby
                </Text>
              </Pressable>
            </View>

            {/* HERO SWIPEABLE CARD STACK */}
            <View style={styles.heroCardStackWrapper}>
              
              {/* Bottom / Next Card Underneath */}
              <View style={styles.heroBottomCard} pointerEvents="none">
                <View style={styles.heroTinderCard}>
                  <Image
                    source={nextCreator.coverImage}
                    style={styles.heroCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 12, 24, 0.45)', 'rgba(15, 12, 24, 0.96)']}
                    style={styles.heroCardGradient}
                  >
                    <Text style={styles.heroCardName}>{nextCreator.name}</Text>
                    <Text style={styles.heroCardRole}>{nextCreator.role} • {nextCreator.followers}</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Active Top Swipeable Card */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[styles.heroTopCard, animatedCardStyle]}
              >
                <View style={styles.heroTinderCard}>
                  
                  {/* GESTURE STAMPS */}
                  <Animated.View
                    style={[styles.stampOverlay, styles.acceptStamp, { opacity: acceptStampOpacity }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.acceptStampText}>CONNECT 💜</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.stampOverlay, styles.declineStamp, { opacity: declineStampOpacity }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.declineStampText}>PASS ✖</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.stampOverlay, styles.saveStamp, { opacity: saveStampOpacity }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.saveStampText}>TRACKING ⭐</Text>
                  </Animated.View>

                  {/* Full Bleed Image */}
                  <Image
                    source={currentCreator.coverImage}
                    style={styles.heroCardImage}
                    resizeMode="cover"
                  />

                  {/* Top Floating Overlay Pills */}
                  <View style={styles.heroTopPillsRow}>
                    <View style={styles.heroLiveStatusPill}>
                      <Animated.View
                        style={[styles.livePulseDot, { transform: [{ scale: pulseAnim }] }]}
                      />
                      <Text style={styles.heroLiveStatusText}>Active today</Text>
                    </View>

                    {/* Top Right Action Jewels */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable
                        style={[styles.jewelTrackBtn, isCurrentSaved && styles.jewelTrackBtnActive]}
                        onPress={() => handleToggleTrack(currentCreator)}
                        hitSlop={8}
                      >
                        <Text style={{ fontSize: 13 }}>{isCurrentSaved ? '⭐' : '☆'}</Text>
                        <Text style={[styles.jewelTrackText, isCurrentSaved && styles.jewelTrackTextActive]}>
                          {isCurrentSaved ? 'Tracked' : 'Track'}
                        </Text>
                      </Pressable>

                      {/* INFO ⓘ DEEP DIVE JEWEL */}
                      <Pressable
                        style={({ pressed }) => [styles.jewelInfoBtn, pressed && styles.btnPressed]}
                        onPress={() => handleOpenInfo(currentCreator)}
                        hitSlop={8}
                      >
                        <Text style={styles.jewelInfoBtnText}>ⓘ</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Bottom Frosted Gradient Overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 12, 24, 0.45)', 'rgba(15, 12, 24, 0.96)']}
                    style={styles.heroCardGradient}
                  >
                    <View style={styles.heroCardHeaderRow}>
                      <View style={styles.heroNameGroup}>
                        <Text style={styles.heroCardName}>{currentCreator.name}</Text>
                        <View style={styles.verifiedTickCircle}>
                          <Text style={styles.verifiedTickText}>✓</Text>
                        </View>
                      </View>

                      <View style={styles.heroStreakPill}>
                        <Text style={styles.heroStreakPillText}>🔥 {currentCreator.streak}d Streak</Text>
                      </View>
                    </View>

                    <Text style={styles.heroCardRole}>
                      {currentCreator.role} • {currentCreator.followers} • 📍 {currentCreator.location}
                    </Text>

                    <Text style={styles.heroCardBio} numberOfLines={2}>
                      {currentCreator.bio}
                    </Text>

                    {/* Aesthetic Category Tags */}
                    <View style={styles.heroTagsRow}>
                      {currentCreator.tags.map((tag, idx) => (
                        <View key={idx} style={styles.heroTagPill}>
                          <Text style={styles.heroTagPillText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            </View>

            {/* 3. TACTILE FLOATING ACTION DOCK (DECLINE • TRACK • CONNECT) */}
            <View style={styles.tactileActionDock}>
              {/* Pass / Decline Button */}
              <Pressable
                style={({ pressed }) => [styles.tactileBtnDecline, pressed && styles.btnPressed]}
                onPress={() => swipeCard('left')}
                hitSlop={8}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" />
                </Svg>
              </Pressable>

              {/* Super Star / Track Button */}
              <Pressable
                style={({ pressed }) => [styles.tactileBtnStar, pressed && styles.btnPressed]}
                onPress={() => swipeCard('up')}
                hitSlop={8}
              >
                <Text style={{ fontSize: 22 }}>⭐</Text>
              </Pressable>

              {/* Match / Connect Button */}
              <Pressable
                style={({ pressed }) => [styles.tactileBtnConnect, pressed && styles.btnPressed]}
                onPress={() => swipeCard('right')}
                hitSlop={8}
              >
                <LinearGradient
                  colors={['#784DF0', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.connectGradientFill}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="#FFFFFF">
                    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </Svg>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* 3. SECTION 2: REQUESTS INBOX (CLEAN & SPACIOUS) */}
        {activeSection === 'requests' && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.cleanScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cleanSectionHeaderBox}>
              <Text style={styles.cleanSectionTitle}>Connection Requests</Text>
              <Text style={styles.cleanSectionSubtitle}>
                Review creators who pitched collaborations. Accept to unlock shared scheduling.
              </Text>
            </View>

            {incomingRequests.length === 0 ? (
              <View style={styles.cleanEmptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>✨</Text>
                <Text style={styles.cleanEmptyTitle}>Inbox Zero</Text>
                <Text style={styles.cleanEmptySub}>All connection invites have been answered.</Text>
              </View>
            ) : (
              incomingRequests.map((req) => (
                <View key={req.id} style={styles.cleanRequestCard}>
                  <View style={styles.requestAvatarRow}>
                    <Image source={req.coverImage} style={styles.cleanAvatarImg} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.requestCreatorName}>{req.name}</Text>
                        <View style={styles.streakBadgeTiny}><Text style={styles.streakBadgeTinyText}>🔥 {req.streak}d</Text></View>
                      </View>
                      <Text style={styles.requestCreatorMeta}>{req.role} • {req.followers}</Text>
                      <Text style={styles.requestSentTime}>📍 {req.location} • {req.timeAgo}</Text>
                    </View>
                  </View>

                  <View style={styles.pitchBubbleBox}>
                    <Text style={styles.pitchBubbleQuote}>“{req.pitchMessage}”</Text>
                  </View>

                  <View style={styles.requestActionRow}>
                    <Pressable
                      style={styles.requestDeclineBtn}
                      onPress={() => handleDeclineRequest(req)}
                    >
                      <Text style={styles.requestDeclineText}>Decline</Text>
                    </Pressable>

                    <Pressable
                      style={styles.requestAcceptBtn}
                      onPress={() => handleAcceptRequest(req)}
                    >
                      <LinearGradient
                        colors={['#784DF0', '#582CDB']}
                        style={styles.requestAcceptGrad}
                      >
                        <Text style={styles.requestAcceptText}>Accept (+50 XP)</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* 4. SECTION 3: NETWORK & TRACKED (CLEAN COLLAB RADAR) */}
        {activeSection === 'network' && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.cleanScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Connected Partners */}
            <View style={styles.cleanSectionHeaderBox}>
              <Text style={styles.cleanSectionTitle}>Connected Partners ({connectedCreators.length})</Text>
              <Text style={styles.cleanSectionSubtitle}>
                Collaborate and schedule joint posts with your mutual matches.
              </Text>
            </View>

            {connectedCreators.map((creator) => (
              <View key={creator.id} style={styles.cleanConnectedCard}>
                <Image source={creator.coverImage} style={styles.cleanAvatarImg} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectedCardName}>{creator.name}</Text>
                  <Text style={styles.connectedCardMeta}>{creator.role} • {creator.followers}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    style={styles.schedulePillBtn}
                    onPress={() => {
                      setCollabPostTitle('Co-created Reel with ' + creator.name);
                      setShowScheduleConfirmModal(true);
                    }}
                  >
                    <Text style={styles.schedulePillBtnText}>📅 Schedule</Text>
                  </Pressable>
                  <Pressable
                    style={styles.msgPillBtn}
                    onPress={() => {
                      setSelectedRecipient(creator.name);
                      setShowMessageModal(true);
                    }}
                  >
                    <Text style={styles.msgPillBtnText}>Chat</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Tracked Creators */}
            <View style={[styles.cleanSectionHeaderBox, { marginTop: 24 }]}>
              <Text style={styles.cleanSectionTitle}>Tracked on Radar ({savedCreators.length})</Text>
              <Text style={styles.cleanSectionSubtitle}>
                Monitored growth velocity and posting rhythm over time.
              </Text>
            </View>

            {savedCreators.map((creator) => (
              <View key={creator.id} style={styles.cleanTrackedCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Image source={creator.coverImage} style={styles.cleanAvatarImgSmall} resizeMode="cover" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.connectedCardName}>{creator.name}</Text>
                    <Text style={styles.connectedCardMeta}>{creator.role} • {creator.followers}</Text>
                  </View>
                  <Pressable
                    style={styles.trackDeepDiveBtn}
                    onPress={() => handleOpenInfo(creator)}
                  >
                    <Text style={styles.trackDeepDiveBtnText}>View ➔</Text>
                  </Pressable>
                </View>

                <View style={styles.radarMetricsPillBox}>
                  <Text style={styles.radarMetricItem}>📈 {creator.tracking.growthRate}</Text>
                  <Text style={styles.radarMetricDivider}>•</Text>
                  <Text style={styles.radarMetricItem}>⏱ {creator.tracking.postingPace}</Text>
                  <Text style={styles.radarMetricDivider}>•</Text>
                  <Text style={styles.radarMetricItem}>✨ {creator.tracking.bestCollabWindow.split('•')[0]}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* 5. TOAST OVERLAY */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* 6. FLOATING BOTTOM NAVIGATION BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (onNavigateTab) onNavigateTab(tab);
          }}
        />

        {/* 7. CELEBRATION MODAL (ON CONNECT) */}
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

        {/* 8. SEND COLLAB PITCH MODAL */}
        <Modal
          visible={showPitchModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPitchModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 340 }]}>
              <View style={styles.modalBadgePill}>
                <Text style={styles.modalBadgeText}>COLLAB PITCH • JARVIS AI</Text>
              </View>
              <Text style={styles.modalTitle}>Pitch Collab to {pitchRecipient.name.split(' ')[0]}</Text>
              <Text style={styles.modalSubtitle}>
                Send a personalized collaboration proposal to connect. Once accepted, this post unlocks in your schedule.
              </Text>

              <View style={styles.pitchIdeaPreviewBox}>
                <Text style={styles.pitchIdeaPreviewTitle}>{pitchRecipient.collabIdea.title}</Text>
                <Text style={styles.pitchIdeaPreviewMeta}>
                  {pitchRecipient.collabIdea.chips.join(' • ')}
                </Text>
              </View>

              <View style={styles.inputGroupFull}>
                <Text style={styles.inputFieldLabel}>CUSTOM COLLAB NOTE</Text>
                <TextInput
                  style={styles.pitchTextAreaInput}
                  value={pitchMessageDraft}
                  onChangeText={setPitchMessageDraft}
                  placeholder="Write your pitch message..."
                  placeholderTextColor="#A39CB5"
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowPitchModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={handleSendCollabPitch}
                >
                  <Text style={styles.modalPrimaryBtnText}>Send Pitch (+50 XP)</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 9. PITCH DELIVERED CELEBRATION */}
        <AnimatedCompletionModal
          visible={showPitchSuccessModal}
          title="Pitch Sent! 🚀"
          subtitle={'Your collab pitch was sent to ' + pitchRecipient.name + '. +50 XP awarded! Once accepted, it unlocks in your schedule.'}
          badgeText="PITCH DELIVERED"
          xpEarned={50}
          streakCount={48}
          actionText="Explore More Creators"
          onDismiss={() => setShowPitchSuccessModal(false)}
        />

        {/* 10. SCHEDULE CONFIRMATION MODAL */}
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
                Lock in your joint co-creation with your connected partner to protect your 48-day streak.
              </Text>

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

        {/* 11. SCHEDULE SUCCESS CELEBRATION */}
        <AnimatedCompletionModal
          visible={showScheduleSuccessModal}
          title="Collab Scheduled! 🚀"
          subtitle="Co-created Reel added to your posting schedule. +50 XP awarded to your streak!"
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

        {/* 12. FULL DEEP-DIVE CREATOR PROFILE MODAL */}
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <SafeAreaView style={styles.detailSafeArea}>
            <View style={styles.sheetHandleContainer}>
              <View style={styles.sheetHandleBar} />
            </View>

            <View style={styles.detailHeaderBar}>
              <Pressable
                style={({ pressed }) => [styles.detailCloseBtn, pressed && styles.btnPressed]}
                onPress={() => setShowDetailModal(false)}
                hitSlop={8}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke="#582CDB" strokeWidth="2.6" strokeLinecap="round" />
                </Svg>
              </Pressable>

              <View style={styles.detailHeaderTitleBox}>
                <Text style={styles.detailHeaderTitle}>Creator Match Deep-Dive</Text>
                <Text style={styles.detailHeaderSubTitle}>Powered by Jarvis Engine</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.detailSaveTopBtn, pressed && styles.btnPressed]}
                onPress={() => handleToggleTrack(selectedCreatorForDetail)}
                hitSlop={8}
              >
                <Text style={{ fontSize: 18 }}>{isDetailSaved ? '⭐' : '☆'}</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.detailScrollView}
              contentContainerStyle={styles.detailScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Top Hero Photo Card */}
              <View style={styles.detailHeroCard}>
                <Image
                  source={selectedCreatorForDetail.coverImage}
                  style={styles.detailCoverImage}
                  resizeMode="cover"
                />
                
                <LinearGradient
                  colors={['transparent', 'rgba(15, 12, 24, 0.7)', 'rgba(15, 12, 24, 0.95)']}
                  style={styles.detailCoverGradientOverlay}
                >
                  <View style={styles.heroNameRow}>
                    <Text style={styles.heroCoverName}>{selectedCreatorForDetail.name}</Text>
                    <View style={styles.verifiedCheckBadge}>
                      <Text style={styles.verifiedCheckText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.heroCoverRole}>
                    {selectedCreatorForDetail.role} • 📍 {selectedCreatorForDetail.location}
                  </Text>
                </LinearGradient>

                <View style={styles.detailHeroBody}>
                  <View style={styles.detailAvailabilityRow}>
                    <Animated.View
                      style={[
                        styles.greenStatusDot,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    />
                    <Text style={styles.detailAvailabilityText}>{selectedCreatorForDetail.availability}</Text>
                  </View>

                  <View style={styles.detailTwoStatRow}>
                    <View style={styles.detailTwoStatItem}>
                      <Text style={styles.detailStatValGold}>{selectedCreatorForDetail.followers}</Text>
                      <Text style={styles.detailStatLbl}>Total Audience</Text>
                    </View>
                    <View style={styles.detailTwoStatDivider} />
                    <View style={styles.detailTwoStatItem}>
                      <Text style={styles.detailStatValPurple}>{selectedCreatorForDetail.consistencyRating}</Text>
                      <Text style={styles.detailStatLbl}>Consistency Tier</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Category Pills */}
              <View style={styles.detailCategoryPillsRow}>
                {selectedCreatorForDetail.categoryTags.map((tag, idx) => (
                  <View key={idx} style={styles.detailCategoryPill}>
                    <Text style={styles.detailCategoryPillText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Card 1: Why This Match Fits */}
              <View style={styles.detailWhyFitsCard}>
                <View style={styles.detailCardTitleRow}>
                  <Text style={styles.sparkleIcon}>✨</Text>
                  <Text style={styles.detailCardTitleText}>Why This Match Fits</Text>
                </View>
                <Text style={styles.detailWhyFitsBody}>
                  {selectedCreatorForDetail.whyFitsDescription}
                </Text>
                <View style={styles.detailWhyFitsPillsRow}>
                  {selectedCreatorForDetail.whyFitsPills.map((pill, idx) => (
                    <View key={idx} style={styles.whyFitsPill}>
                      <Text style={styles.whyFitsPillText}>{pill}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Card 2: Collab Blueprint */}
              <View style={styles.detailCollabIdeaCard}>
                <View style={styles.collabIdeaTitleRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.purplePinIcon}>📍</Text>
                    <Text style={styles.detailCollabIdeaTitle}>Collab Blueprint</Text>
                  </View>
                  <View style={isDetailConnected ? styles.connectedCollabBadge : styles.potencyBadge}>
                    <Text style={isDetailConnected ? styles.connectedCollabBadgeText : styles.potencyBadgeText}>
                      {isDetailConnected ? '💜 Connected Partner' : isDetailPending ? '⏳ Pitch Sent' : '🔒 Requires Connection'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.collabIdeaName}>{selectedCreatorForDetail.collabIdea.title}</Text>

                <View style={styles.collabScriptStepsCol}>
                  <View style={styles.scriptStepItem}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>01</Text>
                    </View>
                    <View style={styles.stepContentCol}>
                      <Text style={styles.stepLabel}>HOOK (0-3s)</Text>
                      <Text style={styles.stepValText}>{selectedCreatorForDetail.collabIdea.hook}</Text>
                    </View>
                  </View>

                  <View style={styles.scriptStepItem}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>02</Text>
                    </View>
                    <View style={styles.stepContentCol}>
                      <Text style={styles.stepLabel}>BTS / VISUALS</Text>
                      <Text style={styles.stepValText}>{selectedCreatorForDetail.collabIdea.bts}</Text>
                    </View>
                  </View>

                  <View style={styles.scriptStepItem}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>03</Text>
                    </View>
                    <View style={styles.stepContentCol}>
                      <Text style={styles.stepLabel}>TAKEAWAY / LESSON</Text>
                      <Text style={styles.stepValText}>{selectedCreatorForDetail.collabIdea.lesson}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.collabIdeaChipsRow}>
                  {selectedCreatorForDetail.collabIdea.chips.map((chip, idx) => (
                    <View key={idx} style={styles.collabIdeaChip}>
                      <Text style={styles.collabIdeaChipText}>{chip}</Text>
                    </View>
                  ))}
                </View>

                {isDetailConnected ? (
                  <Pressable
                    style={({ pressed }) => [styles.buildCollabPlanBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setShowDetailModal(false);
                      setCollabPostTitle('Co-created Reel (feat. ' + selectedCreatorForDetail.name + ')');
                      setTimeout(() => {
                        setShowScheduleConfirmModal(true);
                      }, 250);
                    }}
                  >
                    <LinearGradient
                      colors={['#784DF0', '#582CDB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buildCollabPlanGradient}
                    >
                      <Text style={styles.buildCollabPlanBtnText}>⚡ Add to Content Schedule</Text>
                    </LinearGradient>
                  </Pressable>
                ) : isDetailPending ? (
                  <View style={styles.pendingIdeaBtn}>
                    <Text style={styles.pendingIdeaBtnText}>⏳ Pitch Sent (Awaiting Response)</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.buildCollabPlanBtn, pressed && styles.btnPressed]}
                    onPress={() => handleOpenPitchModal(selectedCreatorForDetail)}
                  >
                    <LinearGradient
                      colors={['#784DF0', '#582CDB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buildCollabPlanGradient}
                    >
                      <Text style={styles.buildCollabPlanBtnText}>✨ Pitch Collab & Connect (+50 XP)</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>

              {/* Dual Metric Cards */}
              <View style={styles.detailTwoCardsRow}>
                <View style={styles.detailMetricCardHalf}>
                  <Text style={styles.metricCardLabel}>AUDIENCE</Text>
                  <Text style={styles.metricCardBigValue}>{selectedCreatorForDetail.audienceCount}</Text>
                </View>

                <View style={styles.detailMetricCardHalf}>
                  <Text style={styles.metricCardLabel}>STREAK</Text>
                  <Text style={styles.metricCardGoldValue}>{selectedCreatorForDetail.streak} Days</Text>
                </View>
              </View>

              {/* Audience Correlation Venn Diagram */}
              <View style={styles.audienceCorrelationCard}>
                <Text style={styles.correlationHeading}>AUDIENCE CORRELATION</Text>

                <View style={styles.vennContainer}>
                  <Svg width={240} height={130} viewBox="0 0 240 130">
                    <Defs>
                      <RadialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                        <Stop offset="100%" stopColor="#582CDB" stopOpacity="0.12" />
                      </RadialGradient>
                      <RadialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                        <Stop offset="100%" stopColor="#D97706" stopOpacity="0.1" />
                      </RadialGradient>
                    </Defs>

                    <Circle
                      cx="90"
                      cy="65"
                      r="52"
                      fill="url(#purpleGlow)"
                      stroke="#7C3AED"
                      strokeWidth="2.2"
                    />
                    <Circle
                      cx="150"
                      cy="65"
                      r="52"
                      fill="url(#goldGlow)"
                      stroke="#D97706"
                      strokeWidth="2.2"
                    />
                  </Svg>

                  <View style={styles.vennLabelLeft}>
                    <Text style={styles.vennLabelTextPurple}>YOU</Text>
                  </View>
                  <View style={styles.vennCenterBadge}>
                    <Text style={styles.vennCenterPercent}>{selectedCreatorForDetail.correlationPercent}%</Text>
                  </View>
                  <View style={styles.vennLabelRight}>
                    <Text style={styles.vennLabelTextGold}>THEM</Text>
                  </View>
                </View>

                <View style={styles.correlationIndicatorsRow}>
                  <View style={styles.correlationIndicatorPill}>
                    <Text style={styles.indicatorName}>{selectedCreatorForDetail.primaryNiche.name}</Text>
                    <Text style={[styles.indicatorLevel, { color: selectedCreatorForDetail.primaryNiche.color }]}>
                      {selectedCreatorForDetail.primaryNiche.level} ({selectedCreatorForDetail.primaryNiche.percent})
                    </Text>
                  </View>
                  <View style={styles.correlationIndicatorPill}>
                    <Text style={styles.indicatorName}>{selectedCreatorForDetail.secondaryNiche.name}</Text>
                    <Text style={[styles.indicatorLevel, { color: selectedCreatorForDetail.secondaryNiche.color }]}>
                      {selectedCreatorForDetail.secondaryNiche.level} ({selectedCreatorForDetail.secondaryNiche.percent})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Jarvis Deep Insight */}
              <View style={styles.detailJarvisInsightCard}>
                <Image
                  source={require('../../assets/images/jarvis-ghost-clean.png')}
                  style={styles.detailJarvisGhost}
                  resizeMode="contain"
                />
                <Text style={styles.detailJarvisInsightLabel}>JARVIS INSIGHT</Text>
                <Text style={styles.detailJarvisInsightText}>
                  “{selectedCreatorForDetail.jarvisDeepInsight}”
                </Text>
              </View>

              {/* Readiness Checklist */}
              <View style={styles.detailReadinessCard}>
                <View style={styles.readinessHeaderRow}>
                  <Text style={styles.readinessTitle}>Readiness</Text>
                  <View style={styles.readinessReadyBadge}>
                    <Text style={styles.readinessReadyText}>🟢 Ready to Collab</Text>
                  </View>
                </View>

                <View style={styles.readinessChecklistCol}>
                  {selectedCreatorForDetail.readinessChecks.map((check, idx) => (
                    <View key={idx} style={styles.readinessItemRow}>
                      <View style={styles.readinessCheckCircle}>
                        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="#582CDB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </View>
                      <Text style={styles.readinessItemText}>{check}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.detailBottomActionBar}>
              <Pressable
                style={({ pressed }) => [styles.detailConnectBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (isDetailConnected) {
                    setShowDetailModal(false);
                    setCollabPostTitle('Co-created Reel (feat. ' + selectedCreatorForDetail.name + ')');
                    setTimeout(() => {
                      setShowScheduleConfirmModal(true);
                    }, 250);
                  } else {
                    handleOpenPitchModal(selectedCreatorForDetail);
                  }
                }}
              >
                <LinearGradient
                  colors={['#784DF0', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detailConnectGradient}
                >
                  <Text style={styles.detailConnectBtnText}>
                    {isDetailConnected ? '📅 Schedule Collab Post' : isDetailPending ? '⏳ Pitch Sent' : '✨ Pitch Collab & Connect (+50 XP)'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.detailBookmarkBtn,
                  isDetailSaved && styles.detailBookmarkBtnActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => handleToggleTrack(selectedCreatorForDetail)}
                hitSlop={8}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill={isDetailSaved ? '#582CDB' : 'none'}>
                  <Path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>

        {/* 13. DIRECT MESSAGE MODAL */}
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

        {/* 14. NOTIFICATIONS MODAL */}
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

        {/* 15. PROFILE MODAL */}
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
  
  // 1. CLEAN TOP APP BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FAF9F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
  },
  headerGhostLogo: {
    width: 26,
    height: 26,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },
  compactSegmentSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    borderRadius: 100,
    padding: 3,
  },
  segmentBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F7894',
  },
  segmentBtnTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  segmentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentRedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E11D48',
    marginLeft: 3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchesCounterPill: {
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  matchesCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  headerProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 2. DISCOVER CONTAINER & HERO STACK
  discoverContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 95,
  },
  cleanFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
    justifyContent: 'center',
  },
  cleanFilterPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  cleanFilterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  cleanFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  cleanFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  heroCardStackWrapper: {
    flex: 1,
    position: 'relative',
    maxHeight: 520,
    marginVertical: 4,
  },
  heroBottomCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 0,
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  heroTopCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  heroTinderCard: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 9,
    position: 'relative',
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  // Stamp Overlays
  stampOverlay: {
    position: 'absolute',
    top: 24,
    zIndex: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
  },

  // Hero Top Floating Overlays
  heroTopPillsRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  heroLiveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  heroLiveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  jewelTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
  },
  jewelTrackBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  jewelTrackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  jewelTrackTextActive: {
    color: '#D97706',
  },
  jewelInfoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  jewelInfoBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#582CDB',
  },

  // Hero Card Bottom Gradient Info
  heroCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 18,
    justifyContent: 'flex-end',
  },
  heroCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCardName: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedTickCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedTickText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStreakPill: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
  },
  heroStreakPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  heroCardRole: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroCardBio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 3. TACTILE FLOATING ACTION DOCK
  tactileActionDock: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 10,
  },
  tactileBtnDecline: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.2,
    borderColor: '#FEE2E2',
  },
  tactileBtnStar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: '#FEF3C7',
  },
  tactileBtnConnect: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  connectGradientFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 4. CLEAN SCROLL CONTENT (REQUESTS & NETWORK)
  scrollView: {
    flex: 1,
  },
  cleanScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
  },
  cleanSectionHeaderBox: {
    marginBottom: 14,
  },
  cleanSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cleanSectionSubtitle: {
    fontSize: 12.5,
    color: '#7F7894',
    lineHeight: 17,
  },
  cleanEmptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
  },
  cleanEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  cleanEmptySub: {
    fontSize: 12,
    color: '#7F7894',
    marginTop: 4,
  },

  // Request Cards
  cleanRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  requestAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cleanAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  cleanAvatarImgSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  requestCreatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  streakBadgeTiny: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 100,
  },
  streakBadgeTinyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  requestCreatorMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4360',
  },
  requestSentTime: {
    fontSize: 11,
    color: '#7F7894',
  },
  pitchBubbleBox: {
    backgroundColor: '#FAF8FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 12,
  },
  pitchBubbleQuote: {
    fontSize: 12.5,
    color: '#171420',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  requestActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  requestDeclineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestDeclineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E11D48',
  },
  requestAcceptBtn: {
    flex: 1.4,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  requestAcceptGrad: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAcceptText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Connected Cards
  cleanConnectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 10,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  connectedCardName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },
  connectedCardMeta: {
    fontSize: 11.5,
    color: '#7F7894',
  },
  schedulePillBtn: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  schedulePillBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  msgPillBtn: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  msgPillBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },

  // Tracked Cards
  cleanTrackedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 10,
  },
  trackDeepDiveBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FAF8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDE8FC',
  },
  trackDeepDiveBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  radarMetricsPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  radarMetricItem: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B4360',
  },
  radarMetricDivider: {
    color: '#DDD6FE',
  },

  // DEEP-DIVE MODAL
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
    fontSize: 15.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },
  detailHeaderSubTitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#582CDB',
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
    position: 'relative',
  },
  detailCoverImage: {
    width: '100%',
    height: 380,
  },
  detailCoverGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 240,
    height: 140,
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  heroCoverName: {
    fontSize: 22,
    fontWeight: '900',
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
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroCoverRole: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    fontWeight: '900',
    color: '#EAB308',
    letterSpacing: -0.3,
  },
  detailStatValPurple: {
    fontSize: 20,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: -0.3,
  },
  detailStatLbl: {
    fontSize: 10.5,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purplePinIcon: {
    fontSize: 13,
  },
  detailCollabIdeaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  connectedCollabBadge: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  connectedCollabBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7E22CE',
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
  collabIdeaName: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 12,
  },
  collabScriptStepsCol: {
    gap: 8,
    marginBottom: 14,
  },
  scriptStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E3FA',
    gap: 10,
  },
  stepNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  stepContentCol: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  stepValText: {
    fontSize: 12,
    color: '#171420',
    lineHeight: 16,
    fontWeight: '500',
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
  pendingIdeaBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EDE8FC',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIdeaBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
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
  metricCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricCardBigValue: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#171420',
  },
  metricCardGoldValue: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#D97706',
  },
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
    fontSize: 11.5,
    fontWeight: '900',
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
    fontSize: 13.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  vennLabelRight: {
    position: 'absolute',
    right: 44,
    top: 54,
  },
  vennLabelTextGold: {
    fontSize: 11,
    fontWeight: '900',
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
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  indicatorLevel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  detailJarvisInsightCard: {
    backgroundColor: 'rgba(245, 243, 255, 0.9)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.85)',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailJarvisGhost: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  detailJarvisInsightLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailJarvisInsightText: {
    fontSize: 12.5,
    color: '#4B4360',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
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

  // PITCH MODAL
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
    fontSize: 13.5,
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
    transform: [{ scale: 0.96 }],
  },
});
