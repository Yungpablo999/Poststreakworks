import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { COLLAB_PLANS } from './CollabIdeaScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MessagesScreenProps {
  onBack: () => void;
  initialConversationId?: string;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onOpenCreate?: () => void;
  onOpenMatch?: () => void;
  onOpenCollabIdea?: (partnerData: { name: string; handle: string; niche: string; avatar: any; planIndex?: number }) => void;
  onSwitchToPro?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface StorySlide {
  id: string;
  type: 'daily_story' | 'highlights' | 'milestone';
  title: string;
  subtitle: string;
  timeAgo: string;
  quote?: string;
  badge?: string;
  highlights?: {
    title: string;
    platform: string;
    views: string;
    saves: string;
  }[];
  milestoneTitle?: string;
  milestoneXp?: string;
}

interface CreatorStory {
  id: string;
  name: string;
  handle: string;
  niche: string;
  avatar: any;
  streak: number;
  isOnline: boolean;
  statusText: string;
  isUser?: boolean;
  slides: StorySlide[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  time: string;
  isUser: boolean;
  sharedScriptTitle?: string;
  isAudioNote?: boolean;
  audioDuration?: string;
  reactionEmoji?: string;
}

interface ConversationThread {
  id: string;
  creatorId: string;
  name: string;
  handle: string;
  niche: string;
  avatar: any;
  streak: number;
  isOnline: boolean;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  category: 'buddies' | 'collabs' | 'jarvis';
  collabBadge?: string;
  messages: ChatMessage[];
}

const CREATOR_STORIES: CreatorStory[] = [
  {
    id: 'user',
    name: 'You',
    handle: '@amara.creates',
    niche: 'Lifestyle & Tech',
    avatar: require('../../assets/images/amara-avatar.jpg'),
    streak: 47,
    isOnline: true,
    statusText: 'Filming Reel 🎬',
    isUser: true,
    slides: [
      {
        id: 's_user_1',
        type: 'daily_story',
        title: 'Today\'s Filming Session',
        subtitle: 'Behind the scenes with PostStreak',
        timeAgo: 'Just now',
        quote: 'Filming day 47! Testing a 3-part curiosity hook on batch productivity.',
        badge: '⚡ 47-DAY STREAK ACTIVE',
      },
      {
        id: 's_user_2',
        type: 'highlights',
        title: 'Your Top Viral Hooks This Week',
        subtitle: 'High retention performances',
        timeAgo: '1d ago',
        highlights: [
          { title: 'One thing I wish I knew before creating', platform: 'TikTok', views: '42.8k', saves: '3.9k' },
          { title: 'Why 90% of creators quit by month 2', platform: 'Reels', views: '58.1k', saves: '6.4k' },
          { title: 'My 15-minute daily batching routine', platform: 'Shorts', views: '29.3k', saves: '2.8k' },
        ],
      },
    ],
  },
  {
    id: 'c1',
    name: 'Elena Rostova',
    handle: '@elenacreates',
    niche: 'Tech & Productivity',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 52,
    isOnline: true,
    statusText: 'Editing week 3 batch',
    slides: [
      {
        id: 's_elena_1',
        type: 'daily_story',
        title: 'Daily Studio Flow 🎬',
        subtitle: 'Batch recording 4 video hooks',
        timeAgo: '2h ago',
        quote: 'Consistency feels 10x easier when you have an accountability partner. Finished today\'s script in 8 mins!',
        badge: '⚡ 52-DAY STREAK',
      },
      {
        id: 's_elena_2',
        type: 'highlights',
        title: 'Recent Viral Posts & Hooks',
        subtitle: 'Top performing content lately',
        timeAgo: '1d ago',
        highlights: [
          { title: 'The secret to never running out of video ideas', platform: 'TikTok', views: '84.2k', saves: '9.3k' },
          { title: 'How I script 30-second shorts in 5 minutes', platform: 'Reels', views: '61.5k', saves: '7.1k' },
          { title: 'Stop overthinking your camera setup', platform: 'TikTok', views: '39.0k', saves: '4.5k' },
        ],
      },
      {
        id: 's_elena_3',
        type: 'milestone',
        title: 'Streak Milestone Unlocked!',
        subtitle: 'Level 5 Master Creator',
        timeAgo: '3d ago',
        milestoneTitle: '🏆 50-Day Consistency Club',
        milestoneXp: '+250 XP Earned with Duo Partner',
      },
    ],
  },
  {
    id: 'c2',
    name: 'Marcus Chen',
    handle: '@marcustech',
    niche: 'AI & Workflow',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 38,
    isOnline: true,
    statusText: 'Writing 5 hooks',
    slides: [
      {
        id: 's_marcus_1',
        type: 'daily_story',
        title: 'Coding & Content Sprint ⚡',
        subtitle: 'Morning routine done',
        timeAgo: '4h ago',
        quote: 'Tested 3 new hooks with Jarvis AI this morning. Script 2 had the strongest retention!',
        badge: '🔥 38-DAY STREAK',
      },
      {
        id: 's_marcus_2',
        type: 'highlights',
        title: 'Recent Post Highlights',
        subtitle: 'Tech & creator tool reviews',
        timeAgo: '2d ago',
        highlights: [
          { title: '3 AI tools I use every single day to post', platform: 'TikTok', views: '92.1k', saves: '12.4k' },
          { title: 'How to automate your content schedule', platform: 'LinkedIn', views: '45.7k', saves: '5.2k' },
        ],
      },
    ],
  },
  {
    id: 'c3',
    name: 'Sophia Taylor',
    handle: '@sophiastyle',
    niche: 'Lifestyle & Fashion',
    avatar: require('../../assets/images/zainab-avatar.jpg'),
    streak: 41,
    isOnline: false,
    statusText: 'Studio day!',
    slides: [
      {
        id: 's_sophia_1',
        type: 'daily_story',
        title: 'Outfit & Studio Lighting ✨',
        subtitle: 'Prepping week 4 visuals',
        timeAgo: '6h ago',
        quote: 'Scheduled all posts for the 7:30 PM peak reach window. Loving this streak challenge!',
        badge: '⚡ 41-DAY STREAK',
      },
      {
        id: 's_sophia_2',
        type: 'highlights',
        title: 'Top Creator Highlights',
        subtitle: 'Lifestyle & storytelling shorts',
        timeAgo: '3d ago',
        highlights: [
          { title: 'My morning creator routine in 30 seconds', platform: 'Reels', views: '110k', saves: '14.2k' },
          { title: '3 aesthetic filming spots in my apartment', platform: 'TikTok', views: '73.4k', saves: '8.6k' },
        ],
      },
    ],
  },
  {
    id: 'c4',
    name: 'David Kim',
    handle: '@davidbuilds',
    niche: 'Fitness & Mindset',
    avatar: require('../../assets/images/david-avatar.jpg'),
    streak: 29,
    isOnline: true,
    statusText: 'Posted today! ⚡',
    slides: [
      {
        id: 's_david_1',
        type: 'daily_story',
        title: 'Workout & Mindset Reel 🏋️‍♂️',
        subtitle: 'Streak day 29 complete',
        timeAgo: '1h ago',
        quote: 'Showing up even when you don\'t feel like it is the whole game.',
        badge: '🔥 29-DAY STREAK',
      },
    ],
  },
  {
    id: 'jarvis_story',
    name: 'Jarvis AI',
    handle: '@jarvis.ai',
    niche: 'AI Assistant',
    avatar: require('../../assets/images/jarvis-core-flame.png'),
    streak: 100,
    isOnline: true,
    statusText: 'AI Active ⚡',
    slides: [
      {
        id: 's_jarvis_1',
        type: 'daily_story',
        title: 'Jarvis Daily Creator Intel ⚡',
        subtitle: 'Algorithm analysis for today',
        timeAgo: 'Just now',
        quote: 'Today\'s top retention pattern: 3-part curiosity hooks with instant payoff retain 78% more viewers at 15 seconds.',
        badge: '⚡ JARVIS CREATOR ASSISTANT',
      },
      {
        id: 's_jarvis_2',
        type: 'highlights',
        title: 'Top AI Viral Blueprints',
        subtitle: 'High retention collab formats',
        timeAgo: '1h ago',
        highlights: [
          { title: 'The 3-Second Retention Hook Formula', platform: 'TikTok', views: '142k', saves: '18.4k' },
          { title: 'Behind-the-Scenes Creator Setup Swap', platform: 'Reels', views: '98.5k', saves: '12.1k' },
          { title: '14-Day Accountability Duo Challenge', platform: 'Shorts', views: '76.8k', saves: '9.3k' },
        ],
      },
    ],
  },
];

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv_jarvis',
    creatorId: 'jarvis',
    name: 'Jarvis AI Co-Pilot',
    handle: '@jarvis.ai',
    niche: 'AI Content Director & Strategist',
    avatar: require('../../assets/images/jarvis-core-flame.png'),
    streak: 99,
    isOnline: true,
    lastMessage: 'Hey Pablo! I analyzed your schedule gaps. Want me to draft a high-retention 7:30 PM Reel?',
    time: 'Just now',
    unread: true,
    unreadCount: 1,
    category: 'jarvis',
    collabBadge: '⚡ AI Content Director Active',
    messages: [
      {
        id: 'jm1',
        senderId: 'jarvis',
        text: 'Hey Pablo! ⚡ I noticed an opening in your schedule for today at 7:30 PM.',
        time: '11:25 AM',
        isUser: false,
      },
      {
        id: 'jm2',
        senderId: 'jarvis',
        text: 'I can help you write a viral hook, draft a 45-second script, or generate high-CTR thumbnail ideas right now. What would you like to build?',
        time: '11:26 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 't1',
    creatorId: 'c1',
    name: 'Elena Rostova',
    handle: '@elenacreates',
    niche: 'Tech & Productivity',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 52,
    isOnline: true,
    lastMessage: 'Loved your lesson on batch filming! Are you free for the duo challenge tomorrow?',
    time: '2m ago',
    unread: true,
    category: 'buddies',
    collabBadge: '⚡ 14-Day Pact (Day 8/14)',
    messages: [
      {
        id: 'm1',
        senderId: 'c1',
        text: 'Hey Amara! Just saw your 47-day streak update on the leaderboard, huge congrats!',
        time: '10:14 AM',
        isUser: false,
      },
      {
        id: 'm2',
        senderId: 'user',
        text: 'Thank you Elena! Your tips on hook pacing really helped my retention on TikTok this week.',
        time: '10:16 AM',
        isUser: true,
      },
      {
        id: 'm3',
        senderId: 'c1',
        text: 'Loved your lesson on batch filming! Are you free for the duo challenge tomorrow?',
        time: '10:18 AM',
        isUser: false,
        sharedScriptTitle: 'One thing I wish I knew before I started creating',
      },
      {
        id: 'm4',
        senderId: 'c1',
        isAudioNote: true,
        audioDuration: '0:18',
        time: '10:20 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 't2',
    creatorId: 'c2',
    name: 'Marcus Chen',
    handle: '@marcustech',
    niche: 'AI & Workflow',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 38,
    isOnline: true,
    lastMessage: 'Sent you my caption hook draft. Let me know what you think!',
    time: '18m ago',
    unread: true,
    category: 'collabs',
    collabBadge: '📑 Shared Script Draft',
    messages: [
      {
        id: 'm2_1',
        senderId: 'user',
        text: 'Marcus, how do you structure your 30s talking head scripts?',
        time: '9:30 AM',
        isUser: true,
      },
      {
        id: 'm2_2',
        senderId: 'c2',
        text: 'Sent you my caption hook draft. Let me know what you think!',
        time: '9:45 AM',
        isUser: false,
        sharedScriptTitle: '3 creator habits that made posting easier',
      },
    ],
  },
  {
    id: 't3',
    creatorId: 'c3',
    name: 'Sophia Taylor',
    handle: '@sophiastyle',
    niche: 'Lifestyle & Content',
    avatar: require('../../assets/images/zainab-avatar.jpg'),
    streak: 41,
    isOnline: false,
    lastMessage: 'Just scheduled my post for the 7:30 PM peak window! 🚀',
    time: '1h ago',
    unread: false,
    category: 'buddies',
    collabBadge: '🎯 Peak Slot Scheduled',
    messages: [
      {
        id: 'm3_1',
        senderId: 'c3',
        text: 'Just scheduled my post for the 7:30 PM peak window! 🚀',
        time: '8:45 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 't4',
    creatorId: 'jarvis',
    name: 'Jarvis Creative Assistant',
    handle: '@jarvis.ai',
    niche: 'AI Co-Pilot',
    avatar: require('../../assets/images/jarvis-core-flame.png'),
    streak: 100,
    isOnline: true,
    lastMessage: 'Streak Alert: 1 post needed today to protect your 47-day streak and earn +50 XP.',
    time: '3h ago',
    unread: false,
    category: 'jarvis',
    collabBadge: '🤖 Streak Guardian',
    messages: [
      {
        id: 'm4_1',
        senderId: 'jarvis',
        text: 'Streak Alert: 1 post needed today to protect your 47-day streak and earn +50 XP.',
        time: '7:00 AM',
        isUser: false,
      },
    ],
  },
];

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onBack,
  initialConversationId,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenPostComposer,
  onOpenCreate,
  onOpenMatch,
  onOpenCollabIdea,
  onSwitchToPro,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'buddies' | 'collabs' | 'jarvis'>('all');
  const [threads, setThreads] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [chatPlanIndex, setChatPlanIndex] = useState(0);
  const reloadSpinAnim = useRef(new Animated.Value(0)).current;
  const currentChatPlan = COLLAB_PLANS[chatPlanIndex];
  const reloadSpinInterpolate = reloadSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleShuffleChatPlan = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    reloadSpinAnim.setValue(0);
    Animated.timing(reloadSpinAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    const nextIdx = (chatPlanIndex + 1) % COLLAB_PLANS.length;
    setChatPlanIndex(nextIdx);
  };

  // Active 1-on-1 Chat State
  const [activeChatThread, setActiveChatThread] = useState<ConversationThread | null>(() => {
    if (initialConversationId) {
      return INITIAL_CONVERSATIONS.find((c) => c.id === initialConversationId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (initialConversationId) {
      const found = INITIAL_CONVERSATIONS.find((c) => c.id === initialConversationId);
      if (found) {
        setActiveChatThread(found);
      }
    }
  }, [initialConversationId]);
  const [inputMessage, setInputMessage] = useState('');

  // Snapchat / Social-Style Story & Highlights Player State
  const [activeStoryCreator, setActiveStoryCreator] = useState<CreatorStory | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [storyReplyText, setStoryReplyText] = useState('');

  // Plus Icon (+) "Connect with More Creators" Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Celebration & Feedback Modal
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Message Sent!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your streak partner received your message.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Accountability connection strengthened! +15 XP.');
  const [celebrationBadge, setCelebrationBadge] = useState('COLLAB ACTIVE');

  // Floating Emoji Animations
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const storyFadeAnim = useRef(new Animated.Value(0)).current;
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnim.start();
    return () => floatAnim.stop();
  }, [flameFloatY]);

  const triggerModalAnim = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      tension: 65,
      friction: 8,
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

  // Open Story & Highlights Viewer
  const handleOpenStory = (story: CreatorStory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActiveStoryCreator(story);
    setActiveSlideIndex(0);
    setStoryReplyText('');
    storyFadeAnim.setValue(0);
    Animated.timing(storyFadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleNextSlide = () => {
    if (!activeStoryCreator) return;
    if (activeSlideIndex < activeStoryCreator.slides.length - 1) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveSlideIndex(activeSlideIndex + 1);
    } else {
      setActiveStoryCreator(null);
    }
  };

  const handlePrevSlide = () => {
    if (!activeStoryCreator) return;
    if (activeSlideIndex > 0) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  };

  const handleSendStoryReaction = (emoji: string) => {
    if (!activeStoryCreator) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Add floating emoji animation
    const emojiId = `e_${Date.now()}`;
    setFloatingEmojis((prev) => [...prev, { id: emojiId, emoji, x: Math.random() * (SCREEN_WIDTH - 80) + 40 }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== emojiId));
    }, 1800);

    // Also send reaction to their message thread
    const matchedThread = threads.find((t) => t.creatorId === activeStoryCreator.id);
    if (matchedThread) {
      const reactionMsg: ChatMessage = {
        id: `msg_react_${Date.now()}`,
        senderId: 'user',
        text: `Reacted ${emoji} to your story "${activeStoryCreator.slides[activeSlideIndex].title}"`,
        reactionEmoji: emoji,
        time: 'Just now',
        isUser: true,
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === matchedThread.id
            ? { ...t, lastMessage: `Reacted ${emoji}`, time: 'Just now', messages: [...t.messages, reactionMsg] }
            : t
        )
      );
    }
  };

  const handleSendStoryReply = () => {
    if (!storyReplyText.trim() || !activeStoryCreator) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const matchedThread = threads.find((t) => t.creatorId === activeStoryCreator.id);
    const replyMsg: ChatMessage = {
      id: `msg_reply_${Date.now()}`,
      senderId: 'user',
      text: storyReplyText.trim(),
      time: 'Just now',
      isUser: true,
    };

    if (matchedThread) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === matchedThread.id
            ? { ...t, lastMessage: replyMsg.text || '', time: 'Just now', messages: [...t.messages, replyMsg] }
            : t
        )
      );
    }

    setActiveStoryCreator(null);
    setCelebrationTitle('Reply Sent!');
    setCelebrationSubtitle(`Your message was sent to ${activeStoryCreator.name}'s inbox.`);
    setCelebrationSpeech('Story conversation started! +15 XP.');
    setCelebrationBadge('REPLY SENT');
    setShowCelebrationModal(true);
  };

  const handleOpenChat = (thread: ConversationThread) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t))
    );
    setActiveChatThread({ ...thread, unread: false });
  };

  const handleSendMessage = (customText?: string) => {
    const messageToSend = (customText || inputMessage).trim();
    if (!messageToSend || !activeChatThread) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'user',
      text: messageToSend,
      time: 'Just now',
      isUser: true,
    };

    const updatedMessages = [...activeChatThread.messages, newMessage];
    const updatedThread = {
      ...activeChatThread,
      lastMessage: newMessage.text || '',
      time: 'Just now',
      messages: updatedMessages,
    };

    setActiveChatThread(updatedThread);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeChatThread.id ? updatedThread : t))
    );
    setInputMessage('');

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendVoiceNote = () => {
    if (!activeChatThread) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const audioMsg: ChatMessage = {
      id: `msg_audio_${Date.now()}`,
      senderId: 'user',
      isAudioNote: true,
      audioDuration: '0:14',
      time: 'Just now',
      isUser: true,
    };

    const updatedMessages = [...activeChatThread.messages, audioMsg];
    const updatedThread = {
      ...activeChatThread,
      lastMessage: '🎙️ Voice note (0:14)',
      time: 'Just now',
      messages: updatedMessages,
    };

    setActiveChatThread(updatedThread);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeChatThread.id ? updatedThread : t))
    );

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendHighFive = (creatorName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationTitle('⚡ Streak Boost Sent!');
    setCelebrationSubtitle(`You sent +10 Streak Energy to ${creatorName}!`);
    setCelebrationSpeech('Accountability partner energized! Keep supporting each other.');
    setCelebrationBadge('ENERGY BOOST');
    setShowCelebrationModal(true);
  };

  const filteredThreads = threads.filter((thread) => {
    const matchesCategory =
      selectedCategory === 'all' || thread.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (activeChatThread) {
                  setActiveChatThread(null);
                } else {
                  onBack();
                }
              }}
              style={({ pressed }) => [styles.backCircleBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>

            {/* Mascot Logo */}
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Switch to Pro mode pill */}
            {!activeChatThread && (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  if (onSwitchToPro) {
                    onSwitchToPro();
                  } else if (onSaveProfile && userProfile) {
                    onSaveProfile({ ...userProfile, tier: 'pro' });
                  }
                }}
                hitSlop={8}
              >
                <LinearGradient
                  colors={['#EDE9FE', '#DDD6FE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.freeHeaderBadge}
                >
                  <Text style={styles.freeHeaderBadgeText}>✨ PRO</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {/* Active Chat Header or Empty Space in Inbox */}
          {activeChatThread ? (
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitleText}>
                {activeChatThread.name}
              </Text>
              <Text style={styles.headerSubtitleText}>
                {activeChatThread.isOnline
                  ? '🟢 Active now • ⚡ 52d streak'
                  : '⚡ Streak Partner'}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {/* Right Action: Plus Button (+) & Profile Icon */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.newChatBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalAnim();
                setShowConnectModal(true);
              }}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                style={styles.plusIconGradient}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </LinearGradient>
            </Pressable>

            {/* Top-Right: Profile Icon after Plus button */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, isDark && styles.headerIconBtnDark, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalAnim();
                setShowProfileModal(true);
              }}
            >
              {activeChatThread ? (
                <Image
                  source={activeChatThread.avatar}
                  style={styles.headerPartnerMiniAvatar}
                  resizeMode="cover"
                />
              ) : (
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="#171420"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="#171420"
                    strokeWidth="2.2"
                  />
                </Svg>
              )}
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN CONTENT: INBOX OR ACTIVE CHAT */}
        {!activeChatThread ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Top Badges Row */}
            <View style={styles.topBadgesRow}>
              <View style={styles.socialHubPill}>
                <Text style={styles.socialHubPillText}>SOCIAL HUB</Text>
              </View>
              <View style={styles.activePactPill}>
                <Text style={styles.activePactPillText}>⚡ 3 Active Accountability Pacts</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarBox}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 21L15.803 15.803M15.803 15.803A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  stroke="#94A3B8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search creators, stories, or posts..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* SNAPCHAT-STYLE STORIES & HIGHLIGHTS ROW */}
            <View style={styles.storiesHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Stories &amp; Post Highlights</Text>
              <Text style={styles.storiesSubHint}>Tap to view daily posts</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesRow}
            >
              {CREATOR_STORIES.map((story) => (
                <Pressable
                  key={story.id}
                  style={styles.storyItem}
                  onPress={() => handleOpenStory(story)}
                >
                  <LinearGradient
                    colors={story.isOnline ? ['#EC4899', '#8B5CF6', '#F59E0B'] : ['#CBD5E1', '#E2E8F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.storyAvatarRingGradient}
                  >
                    <View style={styles.storyAvatarInnerWhite}>
                      <Image source={story.avatar} style={styles.storyAvatar} resizeMode="cover" />
                      {story.isOnline && <View style={styles.onlineDot} />}
                      {story.isUser && (
                        <View style={styles.userAddStatusBadge}>
                          <Text style={styles.userAddStatusText}>+</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {story.name}
                  </Text>
                  <View style={styles.storyStreakBadge}>
                    <Text style={styles.storyStreakText}>⚡ {story.streak}d</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* MESSAGE CATEGORY TABS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsRow}
            >
              {[
                { id: 'all', label: `🔥 All Messages (${threads.length})` },
                { id: 'buddies', label: '🤝 Streak Partners' },
                { id: 'collabs', label: '⚡ Collabs & Scripts' },
                { id: 'jarvis', label: '🤖 Jarvis AI' },
              ].map((tab) => {
                const isSelected = selectedCategory === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedCategory(tab.id as 'all' | 'buddies' | 'collabs' | 'jarvis');
                    }}
                    style={[
                      styles.categoryTabPill,
                      isSelected && styles.categoryTabPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTabPillText,
                        isSelected && styles.categoryTabPillTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* CONVERSATION THREADS LIST */}
            <View style={styles.threadsList}>
              {filteredThreads.map((thread) => (
                <Pressable
                  key={thread.id}
                  style={({ pressed }) => [
                    styles.threadCard,
                    thread.unread && styles.threadCardUnread,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleOpenChat(thread)}
                >
                  {/* Creator Avatar with Story Border */}
                  <Pressable
                    onPress={() => {
                      const matchedStory = CREATOR_STORIES.find((s) => s.id === thread.creatorId);
                      if (matchedStory) {
                        handleOpenStory(matchedStory);
                      } else {
                        handleOpenChat(thread);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={thread.isOnline ? ['#EC4899', '#8B5CF6'] : ['#E2E8F0', '#CBD5E1']}
                      style={styles.threadAvatarRing}
                    >
                      <Image source={thread.avatar} style={styles.threadAvatar} resizeMode="cover" />
                      {thread.isOnline && <View style={styles.threadOnlineDot} />}
                    </LinearGradient>
                  </Pressable>

                  {/* Thread Content */}
                  <View style={styles.threadContentCol}>
                    <View style={styles.threadTopRow}>
                      <Text style={styles.threadCreatorName} numberOfLines={1}>
                        {thread.name}
                      </Text>
                      <Text style={styles.threadTime}>{thread.time}</Text>
                    </View>

                    <View style={styles.threadMetaRow}>
                      <Text style={styles.threadHandle}>{thread.handle}</Text>
                      <View style={styles.threadStreakPill}>
                        <Text style={styles.threadStreakText}>⚡ {thread.streak}d streak</Text>
                      </View>
                    </View>

                    {thread.collabBadge && (
                      <View style={styles.collabStatusBadge}>
                        <Text style={styles.collabStatusText}>{thread.collabBadge}</Text>
                      </View>
                    )}

                    <Text
                      style={[styles.threadLastMessage, thread.unread && styles.threadLastMessageUnread]}
                      numberOfLines={1}
                    >
                      {thread.lastMessage}
                    </Text>
                  </View>

                  {/* Unread Purple Indicator */}
                  {thread.unread && <View style={styles.unreadPurpleDot} />}
                </Pressable>
              ))}
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 110 }} />
          </ScrollView>
        ) : (
          /* 3. PREMIUM INTERACTIVE 1-ON-1 CHAT ROOM */
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.chatRoomContainer}>
              {/* Pinned Accountability Banner */}
              <LinearGradient
                colors={['#FAF5FF', '#EDE9FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pactBanner}
              >
                <View style={styles.pactFlameIconBox}>
                  <Text style={{ fontSize: 16 }}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pactTitle}>Accountability Pact Active</Text>
                  <Text style={styles.pactSub}>
                    You &amp; {activeChatThread.name} get +50 XP when both post today!
                  </Text>
                </View>
                <Pressable
                  style={styles.pactBoostBtn}
                  onPress={() => handleSendHighFive(activeChatThread.name)}
                >
                  <Text style={styles.pactBoostBtnText}>⚡ Boost</Text>
                </Pressable>
              </LinearGradient>

              {/* COLLAB IDEA SECTION BANNER */}
              <View style={styles.collabIdeaBanner}>
                <Pressable
                  style={styles.collabIdeaBannerLeft}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    if (onOpenCollabIdea) {
                      onOpenCollabIdea({
                        name: activeChatThread.name,
                        handle: activeChatThread.handle,
                        niche: activeChatThread.niche,
                        avatar: activeChatThread.avatar,
                        planIndex: chatPlanIndex,
                      });
                    }
                  }}
                >
                  <View style={styles.collabIdeaIconBox}>
                    <Text style={{ fontSize: 16 }}>🤝</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.collabIdeaBannerTitle}>Collab Idea</Text>
                      <View style={styles.collabIdeaPillMini}>
                        <Text style={styles.collabIdeaPillMiniText}>{currentChatPlan.pillTag}</Text>
                      </View>
                    </View>
                    <Text style={styles.collabIdeaBannerSub} numberOfLines={1}>
                      {currentChatPlan.title}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.collabIdeaActionsRight}>
                  {/* RELOAD ICON BUTTON */}
                  <Pressable
                    style={({ pressed }) => [styles.collabIdeaReloadBtn, pressed && styles.btnPressed]}
                    onPress={handleShuffleChatPlan}
                    hitSlop={8}
                  >
                    <Animated.View style={{ transform: [{ rotate: reloadSpinInterpolate }] }}>
                      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                          stroke="#6D28D9"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M3 3v5h5"
                          stroke="#6D28D9"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                          stroke="#6D28D9"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M16 21h5v-5"
                          stroke="#6D28D9"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </Animated.View>
                  </Pressable>

                  {/* OPEN IDEA BUTTON */}
                  <Pressable
                    style={({ pressed }) => [styles.collabIdeaOpenBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      if (onOpenCollabIdea) {
                        onOpenCollabIdea({
                          name: activeChatThread.name,
                          handle: activeChatThread.handle,
                          niche: activeChatThread.niche,
                          avatar: activeChatThread.avatar,
                          planIndex: chatPlanIndex,
                        });
                      }
                    }}
                    hitSlop={6}
                  >
                    <Text style={styles.collabIdeaOpenBtnText}>Open Idea ›</Text>
                  </Pressable>
                </View>
              </View>

              {/* Chat Messages List */}
              <ScrollView
                ref={chatScrollRef}
                contentContainerStyle={styles.chatMessagesScroll}
                showsVerticalScrollIndicator={false}
              >
                {activeChatThread.messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleWrapper,
                      msg.isUser ? styles.msgWrapperUser : styles.msgWrapperPartner,
                    ]}
                  >
                    {!msg.isUser && (
                      <Pressable
                        onPress={() => {
                          const matchedStory = CREATOR_STORIES.find((s) => s.id === activeChatThread.creatorId);
                          if (matchedStory) handleOpenStory(matchedStory);
                        }}
                      >
                        <Image
                          source={activeChatThread.avatar}
                          style={styles.msgAvatar}
                          resizeMode="cover"
                        />
                      </Pressable>
                    )}

                    <View style={{ maxWidth: '78%' }}>
                      {/* Shared Script / Post Draft Card */}
                      {msg.sharedScriptTitle && (
                        <Pressable
                          style={styles.sharedScriptCard}
                          onPress={() => {
                            if (onOpenPostComposer) {
                              onOpenPostComposer(msg.sharedScriptTitle);
                            }
                          }}
                        >
                          <View style={styles.sharedScriptBadgeRow}>
                            <Text style={styles.sharedScriptBadgeText}>📑 SHARED SCRIPT DRAFT</Text>
                          </View>
                          <Text style={styles.sharedScriptTitle}>&ldquo;{msg.sharedScriptTitle}&rdquo;</Text>
                          <Text style={styles.sharedScriptAction}>Open in Post Composer ➔</Text>
                        </Pressable>
                      )}

                      {/* Audio Note Bubble */}
                      {msg.isAudioNote ? (
                        <View
                          style={[
                            styles.audioNoteBubble,
                            msg.isUser ? styles.msgBubbleUser : styles.msgBubblePartner,
                          ]}
                        >
                          <Pressable
                            style={styles.audioPlayCircle}
                            onPress={() => {
                              if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                            }}
                          >
                            <Text style={styles.audioPlayIcon}>▶</Text>
                          </Pressable>
                          <View style={styles.waveformContainer}>
                            <View style={[styles.waveBar, { height: 12 }]} />
                            <View style={[styles.waveBar, { height: 20 }]} />
                            <View style={[styles.waveBar, { height: 16 }]} />
                            <View style={[styles.waveBar, { height: 24 }]} />
                            <View style={[styles.waveBar, { height: 18 }]} />
                            <View style={[styles.waveBar, { height: 10 }]} />
                            <View style={[styles.waveBar, { height: 22 }]} />
                            <View style={[styles.waveBar, { height: 14 }]} />
                          </View>
                          <Text style={[styles.audioDurationText, msg.isUser && { color: '#FFFFFF' }]}>
                            {msg.audioDuration}
                          </Text>
                        </View>
                      ) : (
                        /* Text Bubble */
                        <View
                          style={[
                            styles.messageBubble,
                            msg.isUser ? styles.msgBubbleUser : styles.msgBubblePartner,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              msg.isUser ? styles.msgTextUser : styles.msgTextPartner,
                            ]}
                          >
                            {msg.text}
                          </Text>
                        </View>
                      )}

                      <Text
                        style={[
                          styles.messageTime,
                          msg.isUser ? styles.msgTimeUser : styles.msgTimePartner,
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* QUICK REACTION FLOATING BAR */}
              <View style={styles.quickReactionsRow}>
                {['🔥', '⚡', '👏', '🚀', '🎯', '❤️'].map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => handleSendMessage(emoji)}
                    style={styles.reactionPillBtn}
                  >
                    <Text style={{ fontSize: 16 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              {/* CHAT INPUT BAR */}
              <View style={styles.chatInputBar}>
                {/* Share Script Quick Action */}
                <Pressable
                  style={styles.attachScriptBtn}
                  onPress={() => {
                    setInputMessage(
                      `Hey ${activeChatThread.name}, here is the hook I'm testing: "One thing I wish I knew before I started creating"`
                    );
                  }}
                  hitSlop={8}
                >
                  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#582CDB" strokeWidth="2.2" />
                  </Svg>
                </Pressable>

                {/* Text Input */}
                <TextInput
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder={`Message ${activeChatThread.name}...`}
                  placeholderTextColor="#94A3B8"
                  style={styles.chatTextInput}
                  onSubmitEditing={() => handleSendMessage()}
                />

                {/* Voice Note or Send Button */}
                {inputMessage.trim().length === 0 ? (
                  <Pressable
                    style={styles.voiceNoteBtn}
                    onPress={handleSendVoiceNote}
                    hitSlop={8}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                        stroke="#582CDB"
                        strokeWidth="2.2"
                      />
                      <Path
                        d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                        stroke="#582CDB"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.sendMsgBtnActive}
                    onPress={() => handleSendMessage()}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                        stroke="#FFFFFF"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Pressable>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ========================================================================= */}
        {/* SNAPCHAT / INSTAGRAM STYLE IMMERSIVE STORY & HIGHLIGHTS VIEWER MODAL */}
        {/* ========================================================================= */}
        <Modal
          visible={activeStoryCreator !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveStoryCreator(null)}
        >
          {activeStoryCreator && (
            <View style={styles.storyViewerContainer}>
              <StatusBar barStyle="light-content" />

              {/* Top Segmented Story Progress Bars */}
              <View style={styles.storyProgressBarContainer}>
                {activeStoryCreator.slides.map((_, idx) => (
                  <View key={idx} style={styles.storyProgressBarTrack}>
                    <View
                      style={[
                        styles.storyProgressBarFill,
                        idx < activeSlideIndex && { width: '100%' },
                        idx === activeSlideIndex && { width: '100%' },
                        idx > activeSlideIndex && { width: '0%' },
                      ]}
                    />
                  </View>
                ))}
              </View>

              {/* Creator Profile Top Bar */}
              <View style={styles.storyTopProfileBar}>
                <View style={styles.storyProfileLeft}>
                  <Image source={activeStoryCreator.avatar} style={styles.storyTopAvatar} resizeMode="cover" />
                  <View>
                    <Text style={styles.storyTopCreatorName}>{activeStoryCreator.name}</Text>
                    <Text style={styles.storyTopTimeAgo}>
                      {activeStoryCreator.slides[activeSlideIndex]?.timeAgo || 'Just now'} • {activeStoryCreator.niche}
                    </Text>
                  </View>
                  <View style={styles.storyTopStreakBadge}>
                    <Text style={styles.storyTopStreakText}>⚡ {activeStoryCreator.streak}d</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setActiveStoryCreator(null)}
                  style={styles.storyCloseBtn}
                  hitSlop={12}
                >
                  <Text style={styles.storyCloseBtnText}>✕</Text>
                </Pressable>
              </View>

              {/* Main Immersive Story Content Area */}
              <View style={styles.storyMainBody}>
                {/* Left and Right Tap Zones for Navigation */}
                <Pressable style={styles.storyTapZoneLeft} onPress={handlePrevSlide} />
                <Pressable style={styles.storyTapZoneRight} onPress={handleNextSlide} />

                {/* Slide Type 1: Daily Creation Story */}
                {activeStoryCreator.slides[activeSlideIndex]?.type === 'daily_story' && (
                  <View style={styles.storyCardContent}>
                    {activeStoryCreator.slides[activeSlideIndex].badge && (
                      <View style={styles.storySlidePillBadge}>
                        <Text style={styles.storySlidePillText}>
                          {activeStoryCreator.slides[activeSlideIndex].badge}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.storySlideTitle}>
                      {activeStoryCreator.slides[activeSlideIndex].title}
                    </Text>
                    <Text style={styles.storySlideSubtitle}>
                      {activeStoryCreator.slides[activeSlideIndex].subtitle}
                    </Text>

                    <View style={styles.storyQuoteCard}>
                      <Text style={styles.storyQuoteIcon}>“</Text>
                      <Text style={styles.storyQuoteText}>
                        {activeStoryCreator.slides[activeSlideIndex].quote}
                      </Text>
                    </View>

                    <View style={styles.storyStatsRow}>
                      <View style={styles.storyStatBox}>
                        <Text style={styles.storyStatVal}>30s</Text>
                        <Text style={styles.storyStatLabel}>Length</Text>
                      </View>
                      <View style={styles.storyStatBox}>
                        <Text style={styles.storyStatVal}>TikTok + Reels</Text>
                        <Text style={styles.storyStatLabel}>Format</Text>
                      </View>
                      <View style={styles.storyStatBox}>
                        <Text style={styles.storyStatVal}>+40 XP</Text>
                        <Text style={styles.storyStatLabel}>Impact</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Slide Type 2: Recent Highlights Carousel */}
                {activeStoryCreator.slides[activeSlideIndex]?.type === 'highlights' && (
                  <View style={styles.storyCardContent}>
                    <View style={styles.storySlidePillBadge}>
                      <Text style={styles.storySlidePillText}>⭐ TOP RECENT HIGHLIGHTS</Text>
                    </View>

                    <Text style={styles.storySlideTitle}>
                      {activeStoryCreator.slides[activeSlideIndex].title}
                    </Text>
                    <Text style={styles.storySlideSubtitle}>
                      {activeStoryCreator.slides[activeSlideIndex].subtitle}
                    </Text>

                    <View style={styles.highlightsList}>
                      {activeStoryCreator.slides[activeSlideIndex].highlights?.map((post, idx) => (
                        <View key={idx} style={styles.highlightItemCard}>
                          <View style={styles.highlightItemTop}>
                            <Text style={styles.highlightItemPlatform}>{post.platform === 'TikTok' ? '♪' : '📷'} {post.platform}</Text>
                            <Text style={styles.highlightItemViews}>👁 {post.views} • 💾 {post.saves}</Text>
                          </View>
                          <Text style={styles.highlightItemTitle}>&ldquo;{post.title}&rdquo;</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Slide Type 3: Milestone Achievement */}
                {activeStoryCreator.slides[activeSlideIndex]?.type === 'milestone' && (
                  <View style={styles.storyCardContent}>
                    <View style={styles.milestoneTrophyCircle}>
                      <Text style={{ fontSize: 40 }}>🏆</Text>
                    </View>
                    <Text style={styles.storySlideTitle}>
                      {activeStoryCreator.slides[activeSlideIndex].milestoneTitle}
                    </Text>
                    <Text style={styles.storySlideSubtitle}>
                      {activeStoryCreator.slides[activeSlideIndex].subtitle}
                    </Text>
                    <View style={styles.milestoneXpPill}>
                      <Text style={styles.milestoneXpText}>
                        {activeStoryCreator.slides[activeSlideIndex].milestoneXp}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Story Bottom Reaction & Reply Bar */}
              <View style={styles.storyBottomBar}>
                {/* Floating Emojis */}
                {floatingEmojis.map((e) => (
                  <Animated.Text
                    key={e.id}
                    style={[
                      styles.floatingEmojiText,
                      { left: e.x },
                    ]}
                  >
                    {e.emoji}
                  </Animated.Text>
                ))}

                {/* Quick Emoji Reaction Pills */}
                <View style={styles.storyReactionPillsRow}>
                  {['🔥', '⚡', '👏', '❤️', '🚀'].map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => handleSendStoryReaction(emoji)}
                      style={styles.storyReactionCircle}
                    >
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Send a Direct Reply Input */}
                <View style={styles.storyReplyInputRow}>
                  <TextInput
                    value={storyReplyText}
                    onChangeText={setStoryReplyText}
                    placeholder={`Reply to ${activeStoryCreator.name}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    style={styles.storyReplyInput}
                    onSubmitEditing={handleSendStoryReply}
                  />
                  <Pressable
                    style={styles.storyReplySendBtn}
                    onPress={handleSendStoryReply}
                  >
                    <Text style={styles.storyReplySendBtnText}>Send</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: TOP RIGHT PLUS (+) "CONNECT WITH MORE CREATORS" */}
        {/* ========================================================================= */}
        <Modal
          visible={showConnectModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Connect with More Creators</Text>
                  <Text style={styles.modalSubtitle}>Build 2x longer streaks with accountability partners</Text>
                </View>
                <Pressable
                  onPress={() => setShowConnectModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Matched Creator Previews */}
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {[
                  {
                    name: 'Zoe Martinez',
                    handle: '@zoevlogs',
                    niche: 'Daily Vlog & Lifestyle',
                    streak: 64,
                    avatar: require('../../assets/images/elena-avatar.jpg'),
                  },
                  {
                    name: 'Liam Vance',
                    handle: '@liamfilms',
                    niche: 'Shorts & Filmmaking',
                    streak: 33,
                    avatar: require('../../assets/images/david-avatar.jpg'),
                  },
                  {
                    name: 'Kemi Adebayo',
                    handle: '@kemistories',
                    niche: 'Creator Education',
                    streak: 58,
                    avatar: require('../../assets/images/zainab-avatar.jpg'),
                  },
                ].map((c, i) => (
                  <View key={i} style={styles.discoverCreatorCard}>
                    <Image source={c.avatar} style={styles.discoverAvatar} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.discoverName}>{c.name}</Text>
                      <Text style={styles.discoverHandle}>{c.handle} • ⚡ {c.streak}d streak</Text>
                      <Text style={styles.discoverNiche}>{c.niche}</Text>
                    </View>
                    <Pressable
                      style={styles.discoverConnectBtn}
                      onPress={() => {
                        handleSendHighFive(c.name);
                      }}
                    >
                      <Text style={styles.discoverConnectBtnText}>Boost ⚡</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              {/* Connect Button Navigates directly to the Main Match page */}
              <Pressable
                style={styles.connectToCreateBtn}
                onPress={() => {
                  setShowConnectModal(false);
                  if (onOpenMatch) {
                    onOpenMatch();
                  } else if (onNavigateTab) {
                    onNavigateTab('match');
                  }
                }}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.connectGradient}
                >
                  <Text style={styles.connectBtnText}>Find More Creators (Match Hub) ➔</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText={celebrationBadge}
          xpEarned={15}
          streakCount={47}
          actionText="Keep Chatting ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
          }}
        />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 96,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBF8',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  freeHeaderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  headerGhostLogo: {
    width: 34,
    height: 34,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  plusIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerPartnerMiniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  profileModalInner: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileModalAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#582CDB',
    marginBottom: 10,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
  },
  profileModalHandle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  profileModalNiche: {
    fontSize: 12,
    color: '#582CDB',
    fontWeight: '700',
    marginTop: 4,
  },
  profileStreakBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginTop: 10,
    marginBottom: 14,
  },
  profileStreakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  profileStatLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },

  // Top Badges
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  socialHubPill: {
    backgroundColor: '#582CDB',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  socialHubPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  activePactPill: {
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  activePactPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // Search Box
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171420',
    fontWeight: '600',
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '800',
  },

  // Stories Header
  storiesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  storiesSubHint: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '700',
  },

  // Stories Row
  storiesRow: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 12,
    marginBottom: 10,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyAvatarRingGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyAvatarInnerWhite: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 29,
    backgroundColor: '#FAF8F5',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userAddStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#582CDB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAddStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  storyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },
  storyStreakBadge: {
    marginTop: 2,
    backgroundColor: '#FEF3C7',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  storyStreakText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },

  // Category Tabs
  categoryTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  categoryTabPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6.5,
    paddingHorizontal: 13,
  },
  categoryTabPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  categoryTabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Threads List
  threadsList: {
    gap: 10,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    gap: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  threadCardUnread: {
    backgroundColor: '#FDFAFF',
    borderColor: '#DDD6FE',
  },
  threadAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  threadOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  threadContentCol: {
    flex: 1,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  threadCreatorName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },
  threadTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  threadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  threadHandle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  threadStreakPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  threadStreakText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  collabStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    marginBottom: 4,
  },
  collabStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
  },
  threadLastMessage: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  threadLastMessageUnread: {
    color: '#171420',
    fontWeight: '700',
  },
  unreadPurpleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#582CDB',
  },

  // 1-on-1 Chat Room Styles
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  pactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  pactFlameIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pactTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  pactSub: {
    fontSize: 11,
    color: '#475569',
  },
  pactBoostBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pactBoostBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collabIdeaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  collabIdeaBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collabIdeaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collabIdeaBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  collabIdeaPillMini: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  collabIdeaPillMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  collabIdeaBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  collabIdeaActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collabIdeaReloadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collabIdeaOpenBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  collabIdeaOpenBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  chatMessagesScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgWrapperPartner: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginBottom: 16,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleUser: {
    backgroundColor: '#582CDB',
    borderBottomRightRadius: 4,
  },
  msgBubblePartner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  msgTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  msgTextPartner: {
    color: '#171420',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  msgTimeUser: {
    textAlign: 'right',
  },
  msgTimePartner: {
    textAlign: 'left',
  },
  sharedScriptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 6,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sharedScriptBadgeRow: {
    marginBottom: 4,
  },
  sharedScriptBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  sharedScriptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 18,
    marginBottom: 6,
  },
  sharedScriptAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // Audio Note Styles
  audioNoteBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minWidth: 160,
  },
  audioPlayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlayIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#DDD6FE',
    borderRadius: 2,
  },
  audioDurationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  // Quick Reactions Row
  quickReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(250, 248, 245, 0.95)',
  },
  reactionPillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // Chat Input Bar
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEBF8',
    gap: 10,
    marginBottom: 80,
  },
  attachScriptBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#171420',
    fontWeight: '500',
  },
  voiceNoteBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendMsgBtnActive: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // =========================================================================
  // SNAPCHAT / IMMERSIVE STORY VIEWER STYLES
  // =========================================================================
  storyViewerContainer: {
    flex: 1,
    backgroundColor: '#0F0E17',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 20,
  },
  storyProgressBarContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  storyProgressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  storyProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  storyTopProfileBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  storyProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyTopAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyTopCreatorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storyTopTimeAgo: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  storyTopStreakBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  storyTopStreakText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  storyCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storyMainBody: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  storyTapZoneLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '35%',
    zIndex: 10,
  },
  storyTapZoneRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '65%',
    zIndex: 10,
  },
  storyCardContent: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    alignItems: 'center',
  },
  storySlidePillBadge: {
    backgroundColor: '#582CDB',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 14,
  },
  storySlidePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  storySlideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  storySlideSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
  storyQuoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  storyQuoteIcon: {
    fontSize: 28,
    color: '#A78BFA',
    lineHeight: 28,
  },
  storyQuoteText: {
    fontSize: 14.5,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '500',
  },
  storyStatsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  storyStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  storyStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storyStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },

  // Highlights in Story
  highlightsList: {
    width: '100%',
    gap: 8,
  },
  highlightItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 12,
  },
  highlightItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  highlightItemPlatform: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DDD6FE',
  },
  highlightItemViews: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  highlightItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },

  // Milestone in Story
  milestoneTrophyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  milestoneXpPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    marginTop: 10,
  },
  milestoneXpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },

  // Story Bottom Bar
  storyBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  floatingEmojiText: {
    position: 'absolute',
    bottom: 80,
    fontSize: 32,
    zIndex: 100,
  },
  storyReactionPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  storyReactionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyReplyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyReplyInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  storyReplySendBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  storyReplySendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // =========================================================================
  // MODAL STYLES (PLUS BUTTON: CONNECT WITH MORE CREATORS)
  // =========================================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  discoverCreatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  discoverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  discoverName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  discoverHandle: {
    fontSize: 11,
    color: '#64748B',
  },
  discoverNiche: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '700',
    marginTop: 2,
  },
  discoverConnectBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  discoverConnectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  connectToCreateBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  connectGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  messageCardDark: {
    backgroundColor: '#161224',
    borderColor: '#2B2342',
    shadowColor: '#000000',
  },
  headerIconBtnDark: {
    backgroundColor: '#1C172C',
    borderColor: '#2B2342',
  },
  searchBarDark: {
    backgroundColor: '#161224',
    borderColor: '#2B2342',
  },
  textWhite: {
    color: '#F8FAFC',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
