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
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { CreatorStoryModal, CreatorStoryData, StorySlide, TinyGoldCheck } from '../components/CreatorStoryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProMessagesScreenProps {
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
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  time: string;
  isUser: boolean;
  isCollabProposal?: boolean;
  collabTitle?: string;
  collabBounty?: string;
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
  isPro: boolean;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  category: 'buddies' | 'collabs' | 'squad' | 'deals' | 'jarvis';
  collabBadge?: string;
  messages: ChatMessage[];
  storySlides?: StorySlide[];
}

const CREATOR_STORIES_DATA: CreatorStoryData[] = [
  {
    id: 'jarvis',
    name: 'Jarvis AI Co-Pilot',
    handle: '@jarvis.ai',
    niche: 'AI Content Director',
    avatar: require('../../assets/images/jarvis-core-flame.png'),
    streak: 99,
    isOnline: true,
    isPro: true,
    statusText: 'Autopilot Active ⚡',
    slides: [
      {
        id: 's_jarvis_1',
        type: 'daily_story',
        title: 'Jarvis Daily Intelligence ⚡',
        subtitle: 'Optimal reach & content pacing algorithm',
        timeAgo: 'Just now',
        quote: 'Peak posting window calculated for 7:30 PM today. Voice Studio draft has 32% higher estimated retention!',
        badge: '🪄 JARVIS CO-PILOT 2.0',
      },
      {
        id: 's_jarvis_2',
        type: 'highlights',
        title: 'Real-Time Content Insights',
        subtitle: 'AI strategy recommendations',
        timeAgo: '1h ago',
        highlights: [
          { title: 'Scale storytelling format by +25%', platform: 'Reels', views: '94% fit', saves: 'Peak slot' },
          { title: 'Duo collab match: Amara Okafor', platform: 'Lagos BTS', views: '94% overlap', saves: 'High growth' },
        ],
      },
    ],
  },
  {
    id: 'amara',
    name: 'Amara Okafor',
    handle: '@amara.creates',
    niche: 'Travel & Lifestyle',
    avatar: require('../../assets/images/amara-avatar.jpg'),
    streak: 44,
    isOnline: true,
    isPro: true,
    statusText: 'Filming in Lagos 🎬',
    slides: [
      {
        id: 's_amara_1',
        type: 'daily_story',
        title: '24h Lagos Creation Sprint 🎬',
        subtitle: 'Filming behind the scenes in Victoria Island',
        timeAgo: '15m ago',
        quote: 'Testing the 3-second hook format from Jarvis. Retention already up 35% across the morning batch!',
        badge: '⚡ 44-DAY STREAK ACTIVE',
      },
      {
        id: 's_amara_2',
        type: 'highlights',
        title: 'Top Performing Reels This Week',
        subtitle: 'Highest audience retention videos',
        timeAgo: '1d ago',
        highlights: [
          { title: 'Hidden culinary spots in Lagos', platform: 'Instagram', views: '98.4K', saves: '12.1K' },
          { title: '3 storytelling mistakes creators make', platform: 'TikTok', views: '64.2K', saves: '8.4K' },
          { title: 'My 15-minute morning editing setup', platform: 'Reels', views: '41.0K', saves: '5.2K' },
        ],
      },
      {
        id: 's_amara_3',
        type: 'milestone',
        title: 'Streak Milestone Unlocked!',
        subtitle: 'Level 12 Master Creator',
        timeAgo: '3d ago',
        milestoneTitle: '🏆 40-Day Consistency Club',
        milestoneXp: '+250 XP Earned with Squad',
      },
    ],
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    handle: '@elenacreates',
    niche: 'Design & Visual AI',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 52,
    isOnline: true,
    isPro: true,
    statusText: 'Editing week 3 batch',
    slides: [
      {
        id: 's_elena_1',
        type: 'daily_story',
        title: 'Daily Studio Flow 🎨',
        subtitle: 'Batch recording 4 UI micro-interaction hooks',
        timeAgo: '2h ago',
        quote: 'Consistency feels 10x easier when you have an accountability squad! Finished today’s script in 8 mins.',
        badge: '👑 52-DAY STREAK ACTIVE',
      },
      {
        id: 's_elena_2',
        type: 'highlights',
        title: 'Top Design & AI Highlights',
        subtitle: 'High viral save rate tutorials',
        timeAgo: '2d ago',
        highlights: [
          { title: '3 UI interaction tools for 2024', platform: 'TikTok', views: '112.5K', saves: '18.9K' },
          { title: 'How to design split-screen Reels fast', platform: 'Reels', views: '73.2K', saves: '9.4K' },
        ],
      },
    ],
  },
  {
    id: 'david',
    name: 'David Adebayo',
    handle: '@davidbuilds',
    niche: 'Tech & Productivity',
    avatar: require('../../assets/images/david-avatar.jpg'),
    streak: 61,
    isOnline: true,
    isPro: true,
    statusText: 'Scripting Reel at 7:30 PM',
    slides: [
      {
        id: 's_david_1',
        type: 'daily_story',
        title: 'Deep Work & Morning Batching ⚡',
        subtitle: 'Prepping content for peak 7:30 PM window',
        timeAgo: '4h ago',
        quote: 'Locking in day 61 before noon. Let’s crush the squad live duel today!',
        badge: '🔥 61-DAY STREAK',
      },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Chen',
    handle: '@marcustech',
    niche: 'AI & Workflow',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 38,
    isOnline: false,
    isPro: true,
    statusText: 'Studio recording',
    slides: [
      {
        id: 's_marcus_1',
        type: 'daily_story',
        title: '3 AI Tools I Use Daily',
        subtitle: 'Creator tool stack sprint',
        timeAgo: '6h ago',
        quote: 'Voice Studio speed is incredible. Saved 2 hours of editing time this week.',
        badge: '⚡ 38-DAY STREAK',
      },
    ],
  },
];

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv_kemi',
    creatorId: 'kemi',
    name: 'Kemi Adeleke',
    handle: '@kemi_designs',
    niche: 'UI/UX & Brand Designer',
    avatar: require('../../assets/images/kemi-avatar.jpg'),
    streak: 42,
    isOnline: true,
    isPro: true,
    lastMessage: 'Hey! Loved your recent breakdown on creator systems. I drafted a joint design concept for an interactive carousel swap!',
    time: 'Just now',
    unread: true,
    unreadCount: 1,
    category: 'collabs',
    collabBadge: '🤝 Collab Accepted (95% Match)',
    messages: [
      {
        id: 'km1',
        senderId: 'kemi',
        text: 'Hey Pablo! So excited we connected! I love your creator workflows.',
        time: '11:30 AM',
        isUser: false,
      },
      {
        id: 'km2',
        senderId: 'kemi',
        isCollabProposal: true,
        collabTitle: 'The Anatomy of a High-Converting Carousel Slide',
        collabBounty: 'Joint 7-Slide Carousel & Co-authored Reel',
        time: '11:31 AM',
        isUser: false,
      },
      {
        id: 'km3',
        senderId: 'kemi',
        text: 'Let me know what you think of the concept! When are you free to film or review the storyboard?',
        time: '11:32 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_tomi',
    creatorId: 'tomi',
    name: 'Tomi Adebayo',
    handle: '@tomi_tech',
    niche: 'Tech & Gadget Reviewer',
    avatar: require('../../assets/images/tomi-avatar.jpg'),
    streak: 55,
    isOnline: true,
    isPro: true,
    lastMessage: 'Would love to do a 60s creator desk setup critique video with you! Let me know if you are open to filming next Tuesday.',
    time: '2h ago',
    unread: true,
    unreadCount: 1,
    category: 'collabs',
    collabBadge: '🤝 Collab Idea Waiting',
    messages: [
      {
        id: 'tm1',
        senderId: 'tomi',
        text: 'Hey Pablo! Jarvis recommended our channels for a high-retention tech crossover.',
        time: '9:15 AM',
        isUser: false,
      },
      {
        id: 'tm2',
        senderId: 'tomi',
        isCollabProposal: true,
        collabTitle: 'Extreme Creator Studio Upgrades Under $100',
        collabBounty: '60s Dual-Camera Reel / Short • High Retention',
        time: '9:16 AM',
        isUser: false,
      },
      {
        id: 'tm3',
        senderId: 'tomi',
        text: 'Would love to do a 60s creator desk setup critique video with you! Let me know if you are open to filming next Tuesday.',
        time: '9:18 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_amara',
    creatorId: 'amara',
    name: 'Amara Okafor',
    handle: '@amara.creates',
    niche: 'Travel & Lifestyle',
    avatar: require('../../assets/images/amara-avatar.jpg'),
    streak: 44,
    isOnline: true,
    isPro: true,
    lastMessage: 'Hey! Loved your 3 mistakes Reel. Want to film the "24h in Lagos" collab on Saturday?',
    time: '5m ago',
    unread: true,
    unreadCount: 2,
    category: 'collabs',
    collabBadge: '🤝 Collab Proposal (96% Match)',
    messages: [
      {
        id: 'm1',
        senderId: 'amara',
        text: 'Hey Pablo! Jarvis flagged our channels as a 96% fit for lifestyle storytelling.',
        time: '11:20 AM',
        isUser: false,
      },
      {
        id: 'm2',
        senderId: 'amara',
        isCollabProposal: true,
        collabTitle: '24 Hours Creating in Lagos',
        collabBounty: 'Joint Reel (30–45s) • High Discovery Potential',
        time: '11:21 AM',
        isUser: false,
      },
      {
        id: 'm3',
        senderId: 'amara',
        text: 'Hey! Loved your 3 mistakes Reel. Want to film the "24h in Lagos" collab on Saturday?',
        time: '11:22 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_david',
    creatorId: 'david',
    name: 'David Kim',
    handle: '@davidkim_tech',
    niche: 'Tech & AI Systems',
    avatar: require('../../assets/images/david-avatar.jpg'),
    streak: 52,
    isOnline: true,
    isPro: true,
    lastMessage: 'Just checked out the 3-App stack script draft in Jarvis. Pacing looks incredible!',
    time: '1h ago',
    unread: false,
    category: 'collabs',
    collabBadge: '⚡ AI Systems Partner',
    messages: [
      {
        id: 'dm1',
        senderId: 'david',
        text: 'Hey Pablo! Looking forward to co-producing the AI tool review Reel.',
        time: '10:00 AM',
        isUser: false,
      },
      {
        id: 'dm2',
        senderId: 'david',
        text: 'Just checked out the 3-App stack script draft in Jarvis. Pacing looks incredible!',
        time: '10:05 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_elena',
    creatorId: 'elena',
    name: 'Elena Rostova',
    handle: '@elena_fit',
    niche: 'High-Performance & Fitness',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 39,
    isOnline: true,
    isPro: true,
    lastMessage: 'Elena sent a voice note (0:42s): "Let’s test the 5 AM energy routine challenge..."',
    time: '3h ago',
    unread: false,
    category: 'buddies',
    collabBadge: '🎙️ Voice Note Shared',
    messages: [
      {
        id: 'em1',
        senderId: 'elena',
        isAudioNote: true,
        audioDuration: '0:42s',
        time: '7:40 AM',
        isUser: false,
      },
      {
        id: 'em2',
        senderId: 'elena',
        text: 'Let’s film the routine swap on Wednesday morning!',
        time: '7:42 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_marcus',
    creatorId: 'marcus',
    name: 'Marcus Vance',
    handle: '@marcus_vance',
    niche: 'B2B SaaS Growth',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 61,
    isOnline: true,
    isPro: true,
    lastMessage: 'Here is the revenue monetization breakdown slide deck we can co-publish.',
    time: '4h ago',
    unread: false,
    category: 'deals',
    collabBadge: '🚀 Monetization Partner',
    messages: [
      {
        id: 'mm1',
        senderId: 'marcus',
        text: 'Hey Pablo! The creator economy monetization guide is ready.',
        time: '6:30 AM',
        isUser: false,
      },
      {
        id: 'mm2',
        senderId: 'marcus',
        text: 'Here is the revenue monetization breakdown slide deck we can co-publish.',
        time: '6:32 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_zainab',
    creatorId: 'zainab',
    name: 'Zainab Okafor',
    handle: '@zainab_okafor',
    niche: 'Lifestyle & Wellness',
    avatar: require('../../assets/images/zainab-avatar.jpg'),
    streak: 41,
    isOnline: true,
    isPro: true,
    lastMessage: 'Loved your latest Reel! Let’s co-create a mindful creator routine video.',
    time: '5h ago',
    unread: false,
    category: 'buddies',
    collabBadge: '✨ Mutual Match',
    messages: [
      {
        id: 'zm1',
        senderId: 'zainab',
        text: 'Loved your latest Reel! Let’s co-create a mindful creator routine video.',
        time: '5:45 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_squad',
    creatorId: 'squad',
    name: 'Momentum Makers Squad',
    handle: '@momentum.squad',
    niche: 'Level 12 • 18-Day Streak',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 18,
    isOnline: true,
    isPro: true,
    lastMessage: 'Elena: We just took the lead in the Live Duel (62 pts vs 58 pts)! Keep posting! 🔥',
    time: '22m ago',
    unread: true,
    unreadCount: 1,
    category: 'squad',
    collabBadge: '⚔️ Live Duel Active (+750 XP)',
    messages: [
      {
        id: 'sm1',
        senderId: 'david',
        text: 'Just scheduled my 7:30 PM Reel for today!',
        time: '10:45 AM',
        isUser: false,
      },
      {
        id: 'sm2',
        senderId: 'elena',
        text: 'Elena: We just took the lead in the Live Duel (62 pts vs 58 pts)! Keep posting! 🔥',
        time: '11:02 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 'conv_jarvis',
    creatorId: 'jarvis',
    name: 'Jarvis AI Co-Pilot',
    handle: '@jarvis.ai',
    niche: 'AI Content Director',
    avatar: require('../../assets/images/jarvis-core-flame.png'),
    streak: 99,
    isOnline: true,
    isPro: true,
    lastMessage: '⚡ Best posting window today is 7:30 PM. Your draft script is ready in Voice Studio.',
    time: '2h ago',
    unread: false,
    category: 'jarvis',
    collabBadge: '🪄 Co-Pilot Autopilot Active',
    messages: [
      {
        id: 'jm1',
        senderId: 'jarvis',
        text: '⚡ Best posting window today is 7:30 PM. Your draft script is ready in Voice Studio.',
        time: '8:00 AM',
        isUser: false,
      },
    ],
  },
];

export const ProMessagesScreen: React.FC<ProMessagesScreenProps> = ({
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
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'collabs' | 'squad' | 'deals' | 'jarvis'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
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
  const [chatInputText, setChatInputText] = useState('');
  const [selectedStoryData, setSelectedStoryData] = useState<CreatorStoryData | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const flameFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const openCreatorStory = (creatorId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const story = CREATOR_STORIES_DATA.find((s) => s.id === creatorId);
    if (story) {
      setSelectedStoryData(story);
    } else {
      const conv = conversations.find((c) => c.creatorId === creatorId);
      if (conv) {
        setSelectedStoryData({
          id: conv.creatorId,
          name: conv.name,
          handle: conv.handle,
          niche: conv.niche,
          avatar: conv.avatar,
          streak: conv.streak,
          isOnline: conv.isOnline,
          isPro: conv.isPro,
          slides: [
            {
              id: `s_${conv.creatorId}_1`,
              type: 'daily_story',
              title: `${conv.name}'s Daily Story`,
              subtitle: 'Active creator streak update',
              timeAgo: '20m ago',
              quote: 'Consistently posting every day with PostStreak Autopilot!',
              badge: `🔥 ${conv.streak}-DAY STREAK`,
            },
          ],
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (!chatInputText.trim() || !activeChatThread) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newMessage: ChatMessage = {
      id: `user_m_${Date.now()}`,
      senderId: 'user',
      text: chatInputText.trim(),
      time: 'Just now',
      isUser: true,
    };

    const updatedThread = {
      ...activeChatThread,
      lastMessage: `You: ${chatInputText.trim()}`,
      time: 'Just now',
      messages: [...activeChatThread.messages, newMessage],
    };

    setActiveChatThread(updatedThread);
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedThread.id ? updatedThread : c))
    );
    setChatInputText('');

    // Simulated quick response
    setTimeout(() => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const replyMessage: ChatMessage = {
        id: `reply_m_${Date.now()}`,
        senderId: updatedThread.creatorId,
        text: 'Sounds perfect! Let’s lock this into our Smart Schedule 🔥',
        time: 'Just now',
        isUser: false,
      };

      const threadWithReply = {
        ...updatedThread,
        lastMessage: replyMessage.text!,
        time: 'Just now',
        messages: [...updatedThread.messages, replyMessage],
      };

      setActiveChatThread(threadWithReply);
      setConversations((prev) =>
        prev.map((c) => (c.id === threadWithReply.id ? threadWithReply : c))
      );
    }, 1400);
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesFilter = selectedFilter === 'all' || c.category === selectedFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.niche.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR WITH PRO MODE SWITCHER                    */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backBtnCircle, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Text style={{ fontSize: 18, color: '#171420', fontWeight: '700' }}>‹</Text>
            </Pressable>

            {/* PostStreak 3D Ghost Mascot */}
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

            {/* Mode Switcher */}
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
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proHeaderBadge}
              >
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Right Action: Plus Button (+) & Profile Icon with Tiny Gold Check */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.newChatBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenMatch) {
                  onOpenMatch();
                } else if (onNavigateTab) {
                  onNavigateTab('match');
                }
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

            {/* User Profile Avatar with Tiny Gold Check Badge */}
            <Pressable
              onPress={() => {
                setShowProfileModal(true);
              }}
              style={styles.profileAvatarWrapper}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerUserAvatar}
                resizeMode="cover"
              />
              <View style={styles.avatarTinyGoldCheckPos}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE MESSAGES INBOX */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* SEARCH BAR */}
          <View style={styles.searchBarBox}>
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search creators, collab pitches, squads..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* FILTER TABS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
            {[
              { key: 'all', label: 'All' },
              { key: 'collabs', label: '🤝 Collabs' },
              { key: 'squad', label: '🔥 Squad' },
              { key: 'deals', label: '💰 Brand Deals' },
              { key: 'jarvis', label: '🪄 Jarvis AI' },
            ].map((tab) => {
              const isSelected = selectedFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedFilter(tab.key as any);
                  }}
                  style={[styles.filterTabPill, isSelected && styles.filterTabPillActive]}
                >
                  <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ============================================================ */}
          {/* 3. ACTIVE CREATOR STATUSES & STORIES CAROUSEL                */}
          {/* ============================================================ */}
          <View style={styles.storiesSectionBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 4 }}>
              {CREATOR_STORIES_DATA.map((creator) => (
                <Pressable
                  key={creator.id}
                  style={styles.storyItemCol}
                  onPress={() => openCreatorStory(creator.id)}
                >
                  <View style={styles.storyAvatarOuterRing}>
                    <Image
                      source={creator.avatar}
                      style={[
                        styles.storyAvatarImg,
                        creator.id === 'jarvis' && { backgroundColor: '#EDE9FE', padding: 4 },
                      ]}
                      resizeMode={creator.id === 'jarvis' ? 'contain' : 'cover'}
                    />
                    {/* TINY GOLD CHECK BADGE FOR PRO CREATORS */}
                    {creator.isPro && (
                      <View style={styles.storyTinyGoldCheckPos}>
                        <TinyGoldCheck size={14} />
                      </View>
                    )}
                    {creator.isOnline && <View style={styles.storyOnlineDot} />}
                  </View>
                  <Text style={styles.storyCreatorName} numberOfLines={1}>
                    {creator.name.split(' ')[0]}
                  </Text>
                  <View style={styles.storyStreakPill}>
                    <Text style={styles.storyStreakText}>🔥 {creator.streak}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* 4. PINNED PRO COLLAB BANNER                                  */}
          {/* ============================================================ */}
          <Pressable
            style={({ pressed }) => [styles.pinnedCollabBanner, pressed && styles.btnPressed]}
            onPress={() => {
              const amaraConv = conversations.find((c) => c.id === 'conv_amara');
              if (amaraConv) {
                setActiveChatThread(amaraConv);
              }
            }}
          >
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Pressable
                onPress={() => openCreatorStory('amara')}
                style={{ position: 'relative' }}
              >
                <View style={styles.bannerIconSquare}>
                  <Image source={require('../../assets/images/amara-avatar.jpg')} style={styles.bannerAvatar} />
                  <View style={styles.bannerTinyGoldCheckPos}>
                    <TinyGoldCheck size={12} />
                  </View>
                </View>
              </Pressable>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.bannerTagText}>PRO COLLAB INVITATION</Text>
                  <View style={styles.bannerMatchPill}>
                    <Text style={styles.bannerMatchPillText}>94% FIT</Text>
                  </View>
                </View>
                <Text style={styles.bannerTitleText}>Amara Okafor wants to collaborate</Text>
                <Text style={styles.bannerSubText}>&ldquo;24 Hours Creating in Lagos&rdquo; • Sat, 2 PM</Text>
              </View>
              <Text style={styles.bannerArrowText}>➔</Text>
            </View>
          </Pressable>

          {/* ============================================================ */}
          {/* 5. CONVERSATION THREADS LIST                                 */}
          {/* ============================================================ */}
          <Text style={styles.conversationsHeaderTitle}>Recent Conversations</Text>

          <View style={{ gap: 10, marginBottom: 120 }}>
            {filteredConversations.map((thread) => {
              return (
                <Pressable
                  key={thread.id}
                  style={({ pressed }) => [styles.conversationCard, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setActiveChatThread(thread);
                  }}
                >
                  {/* Tapping Creator Avatar opens their Story or Highlights! */}
                  <Pressable
                    onPress={() => openCreatorStory(thread.creatorId)}
                    style={styles.convAvatarContainer}
                  >
                    <Image
                      source={thread.avatar}
                      style={[
                        styles.convAvatarImg,
                        thread.creatorId === 'jarvis' && { backgroundColor: '#EDE9FE', padding: 4 },
                      ]}
                      resizeMode={thread.creatorId === 'jarvis' ? 'contain' : 'cover'}
                    />
                    {thread.isPro && (
                      <View style={styles.convTinyGoldCheckPos}>
                        <TinyGoldCheck size={14} />
                      </View>
                    )}
                    {thread.isOnline && <View style={styles.convOnlineDot} />}
                  </Pressable>

                  {/* Middle Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.convCreatorName}>{thread.name}</Text>
                        {thread.isPro && (
                          <View style={styles.proMicroPill}>
                            <Text style={styles.proMicroPillText}>👑 PRO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.convTimeText}>{thread.time}</Text>
                    </View>

                    {/* Collab / Status Tag */}
                    {thread.collabBadge && (
                      <View style={styles.convBadgeBox}>
                        <Text style={styles.convBadgeText}>{thread.collabBadge}</Text>
                      </View>
                    )}

                    {/* Message Preview */}
                    <Text
                      style={[styles.convLastMessageText, thread.unread && styles.convLastMessageUnread]}
                      numberOfLines={1}
                    >
                      {thread.lastMessage}
                    </Text>
                  </View>

                  {/* Unread Bubble */}
                  {thread.unread && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>{thread.unreadCount || 1}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* ============================================================ */}
        {/* 6. INTERACTIVE FULL-SCREEN CHAT THREAD MODAL                 */}
        {/* ============================================================ */}
        <Modal
          visible={activeChatThread !== null}
          animationType="slide"
          onRequestClose={() => setActiveChatThread(null)}
        >
          {activeChatThread && (
            <SafeAreaView style={styles.chatModalSafeArea}>
              <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
              >
                {/* CHAT HEADER */}
                <View style={styles.chatRoomHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Pressable
                      onPress={() => setActiveChatThread(null)}
                      style={styles.chatBackBtn}
                      hitSlop={8}
                    >
                      <Text style={{ fontSize: 20, fontWeight: '700', color: '#171420' }}>‹</Text>
                    </Pressable>

                    {/* Tapping Chat Header Avatar opens their Story/Highlight! */}
                    <Pressable
                      onPress={() => openCreatorStory(activeChatThread.creatorId)}
                      style={styles.chatHeaderAvatarWrapper}
                    >
                      <Image
                        source={activeChatThread.avatar}
                        style={[
                          styles.chatHeaderAvatar,
                          activeChatThread.creatorId === 'jarvis' && { backgroundColor: '#EDE9FE', padding: 4 },
                        ]}
                        resizeMode={activeChatThread.creatorId === 'jarvis' ? 'contain' : 'cover'}
                      />
                      {activeChatThread.isPro && (
                        <View style={styles.chatTinyGoldCheckPos}>
                          <TinyGoldCheck size={13} />
                        </View>
                      )}
                    </Pressable>

                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.chatHeaderName}>{activeChatThread.name}</Text>
                        <View style={styles.proMicroPill}>
                          <Text style={styles.proMicroPillText}>PRO</Text>
                        </View>
                      </View>
                      <Text style={styles.chatHeaderStatus}>
                        {activeChatThread.isOnline ? '● Active now' : 'Offline'} • {activeChatThread.niche}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      style={styles.chatActionCircle}
                      onPress={() => showToast(`Starting audio call with ${activeChatThread.name}...`)}
                    >
                      <Text style={{ fontSize: 14 }}>📞</Text>
                    </Pressable>
                    <Pressable
                      style={styles.chatActionCircle}
                      onPress={() => openCreatorStory(activeChatThread.creatorId)}
                    >
                      <Text style={{ fontSize: 14 }}>🌟</Text>
                    </Pressable>
                  </View>
                </View>

                {/* QUICK AI ACTION PILLS */}
                <View style={styles.quickAiActionsRow}>
                  <Pressable
                    style={styles.quickAiActionPill}
                    onPress={() => {
                      setChatInputText('Hey! Let’s lock in our 30s split-screen Reel collaboration for this Saturday at 2 PM 🎬');
                    }}
                  >
                    <Text style={styles.quickAiActionText}>⚡ 1-Tap Collab Pitch</Text>
                  </Pressable>

                  <Pressable
                    style={styles.quickAiActionPill}
                    onPress={() => {
                      setChatInputText('Does 7:30 PM work for our post schedule today? 🗓️');
                    }}
                  >
                    <Text style={styles.quickAiActionText}>🗓️ Propose 7:30 PM Shoot</Text>
                  </Pressable>

                  <Pressable
                    style={styles.quickAiActionPill}
                    onPress={() => {
                      setChatInputText('Here is my script hook draft: "3 creator mistakes I stopped making" 📄');
                    }}
                  >
                    <Text style={styles.quickAiActionText}>📄 Share Script Draft</Text>
                  </Pressable>
                </View>

                {/* CHAT MESSAGES SCROLL */}
                <ScrollView
                  style={styles.chatMessagesContainer}
                  contentContainerStyle={{ paddingVertical: 14, gap: 10 }}
                  showsVerticalScrollIndicator={false}
                >
                  {activeChatThread.messages.map((msg) => {
                    const isMine = msg.isUser;
                    return (
                      <View
                        key={msg.id}
                        style={[
                          styles.messageRow,
                          isMine ? styles.messageRowMine : styles.messageRowTheirs,
                        ]}
                      >
                        {!isMine && (
                          <Image
                            source={activeChatThread.avatar}
                            style={styles.chatMessageSenderAvatar}
                            resizeMode="contain"
                          />
                        )}
                        {/* EMBEDDED COLLAB PROPOSAL CARD */}
                        {msg.isCollabProposal ? (
                          <View style={styles.collabProposalCardBubble}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <View style={styles.proposalTagBox}>
                                <Text style={styles.proposalTagText}>PROPOSED COLLABORATION</Text>
                              </View>
                              <Text style={{ fontSize: 16 }}>🤝</Text>
                            </View>

                            <Text style={styles.proposalTitleText}>&ldquo;{msg.collabTitle}&rdquo;</Text>
                            <Text style={styles.proposalDescText}>{msg.collabBounty}</Text>

                            <Pressable
                              style={styles.acceptProposalBtn}
                              onPress={() => {
                                showToast(`Collab Accepted! Added to both Smart Schedules.`);
                              }}
                            >
                              <Text style={styles.acceptProposalBtnText}>Accept Collab Blueprint ➔</Text>
                            </Pressable>
                          </View>
                        ) : msg.isAudioNote ? (
                          /* EMBEDDED AUDIO MEMO BUBBLE */
                          <View style={styles.audioNoteBubble}>
                            <Pressable
                              style={styles.audioPlayCircle}
                              onPress={() => showToast('Playing voice memo (0:42s)...')}
                            >
                              <Text style={{ fontSize: 12, color: '#FFFFFF' }}>▶</Text>
                            </Pressable>
                            <View style={{ flex: 1 }}>
                              <View style={styles.audioWaveformMini}>
                                {[14, 28, 42, 20, 36, 18, 48, 22, 34, 16, 30].map((h, i) => (
                                  <View key={i} style={[styles.audioBarMini, { height: h / 2 }]} />
                                ))}
                              </View>
                              <Text style={styles.audioDurationText}>Voice Memo • {msg.audioDuration}</Text>
                            </View>
                          </View>
                        ) : (
                          /* REGULAR TEXT BUBBLE */
                          <View style={[styles.chatBubble, isMine ? styles.chatBubbleMine : styles.chatBubbleTheirs]}>
                            <Text style={[styles.chatBubbleText, isMine && styles.chatBubbleTextMine]}>
                              {msg.text}
                            </Text>
                            <Text style={[styles.chatMessageTime, isMine && styles.chatMessageTimeMine]}>
                              {msg.time} {isMine && '✓✓'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>

                {/* CHAT INPUT BAR */}
                <View style={styles.chatInputBar}>
                  <Pressable
                    style={styles.attachBtn}
                    onPress={() => showToast('Attach Script, Reel draft, or Audio note')}
                  >
                    <Text style={{ fontSize: 18, color: '#582CDB', fontWeight: '700' }}>+</Text>
                  </Pressable>

                  <TextInput
                    style={styles.chatTextInput}
                    placeholder="Type a message or AI pitch..."
                    placeholderTextColor="#94A3B8"
                    value={chatInputText}
                    onChangeText={setChatInputText}
                    onSubmitEditing={handleSendMessage}
                  />

                  <Pressable
                    style={[
                      styles.sendBtn,
                      chatInputText.trim().length > 0 && styles.sendBtnActive,
                    ]}
                    onPress={handleSendMessage}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
                        stroke="#FFFFFF"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          )}
        </Modal>

        {/* ============================================================ */}
        {/* 7. FULL-SCREEN CREATOR STORY & HIGHLIGHT MODAL               */}
        {/* ============================================================ */}
        <CreatorStoryModal
          visible={selectedStoryData !== null}
          onClose={() => setSelectedStoryData(null)}
          storyData={selectedStoryData}
          onReply={(creator, text) => {
            setSelectedStoryData(null);
            showToast(`Replied to ${creator.name}: "${text.slice(0, 25)}..."`);
          }}
          onSendCollabPitch={(creator) => {
            setSelectedStoryData(null);
            const matchConv = conversations.find((c) => c.creatorId === creator.id);
            if (matchConv) {
              setActiveChatThread(matchConv);
            } else {
              showToast(`Collab Pitch sent to ${creator.name}!`);
            }
          }}
        />

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
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 20,
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
    width: 34,
    height: 34,
  },
  proHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  proHeaderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
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
  profileAvatarWrapper: {
    position: 'relative',
  },
  headerUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 135,
  },

  // SEARCH BAR
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171420',
  },

  // FILTER TABS
  filterTabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterTabPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterTabPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // STORIES SECTION
  storiesSectionBox: {
    marginBottom: 16,
  },
  storyItemCol: {
    alignItems: 'center',
    width: 68,
  },
  storyAvatarOuterRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#8B5CF6',
    padding: 2,
    position: 'relative',
    marginBottom: 4,
  },
  storyAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  storyTinyGoldCheckPos: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  storyOnlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyCreatorName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  storyStreakPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  storyStreakText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },

  // PINNED COLLAB BANNER
  pinnedCollabBanner: {
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  bannerIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  bannerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  bannerTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  bannerTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  bannerMatchPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerMatchPillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    marginTop: 2,
  },
  bannerSubText: {
    fontSize: 12,
    color: '#4C1D95',
    marginTop: 1,
  },
  bannerArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CONVERSATIONS LIST
  conversationsHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  convAvatarContainer: {
    position: 'relative',
  },
  convAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  convTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  convOnlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  convCreatorName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  proMicroPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  proMicroPillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B45309',
  },
  convTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  convBadgeBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 2,
  },
  convBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  convLastMessageText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  convLastMessageUnread: {
    color: '#171420',
    fontWeight: '800',
  },
  unreadCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // CHAT ROOM MODAL
  chatModalSafeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  chatRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  chatBackBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderAvatarWrapper: {
    position: 'relative',
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 20,
  },
  chatTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: '#64748B',
  },
  chatActionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAiActionsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAF8F5',
  },
  quickAiActionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickAiActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  chatMessagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#FAF8F5',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  chatMessageSenderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  chatBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  chatBubbleMine: {
    backgroundColor: '#582CDB',
    borderBottomRightRadius: 4,
  },
  chatBubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    color: '#171420',
    lineHeight: 18,
  },
  chatBubbleTextMine: {
    color: '#FFFFFF',
  },
  chatMessageTime: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatMessageTimeMine: {
    color: '#E0E7FF',
  },
  collabProposalCardBubble: {
    width: '85%',
    backgroundColor: '#EDE9FE',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  proposalTagBox: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proposalTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proposalTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    marginTop: 4,
  },
  proposalDescText: {
    fontSize: 12,
    color: '#4C1D95',
    marginVertical: 4,
  },
  acceptProposalBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  acceptProposalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  audioNoteBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 18,
    padding: 10,
    gap: 10,
    width: 220,
  },
  audioPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveformMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  audioBarMini: {
    width: 3,
    backgroundColor: '#582CDB',
    borderRadius: 1.5,
  },
  audioDurationText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },

  // CHAT INPUT
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#171420',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#582CDB',
  },

  // COMMON
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 20, 32, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
