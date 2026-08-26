import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

interface CreateScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenIdeaDetail?: (ideaTitle?: string) => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onOpenIdeaAngle?: () => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenCaption?: (ideaTitle?: string) => void;
  onOpenRepurpose?: (ideaTitle?: string) => void;
  onOpenMessages?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface DraftItem {
  id: string;
  title: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  editedTime: string;
  imageSource: any;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
  badgeBg: string;
  badgeBorder: string;
}

const INITIAL_DRAFTS: DraftItem[] = [
  {
    id: 'draft_1',
    title: '3 mistakes new creators make',
    platform: 'TikTok',
    editedTime: 'Edited 2h ago',
    imageSource: require('../../assets/images/elena-avatar.jpg'),
  },
  {
    id: 'draft_2',
    title: 'Behind the scenes: my creator setup',
    platform: 'Instagram',
    editedTime: 'Edited 1d ago',
    imageSource: require('../../assets/images/marcus-avatar.jpg'),
  },
];

const TRENDING_IDEAS = [
  'One thing I wish I knew before I started creating.',
  '3 creator tools that saved me 10 hours this week.',
  'Why consistency beats motivation every single time.',
  'How I script 60-second viral Reels in 5 minutes.',
];

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: '🔥 Streak Protected!',
    body: 'Your 47-day creator streak is safe for today.',
    time: '10m ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: 'rgba(254, 243, 199, 0.9)',
    badgeBorder: '#FDE68A',
  },
  {
    id: 'notif_2',
    title: '🏆 Storyteller Challenge',
    body: 'Complete 1 more step to earn +150 XP and unlock your badge.',
    time: '2h ago',
    unread: true,
    iconEmoji: '🏆',
    badgeBg: 'rgba(237, 233, 254, 0.9)',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'notif_3',
    title: '🤝 Elena liked your draft',
    body: 'Elena left feedback on "3 creator mistakes I stopped making".',
    time: '5h ago',
    unread: false,
    iconEmoji: '💬',
    badgeBg: 'rgba(241, 245, 249, 0.9)',
    badgeBorder: '#E2E8F0',
  },
];

// Live Animated Studio Audio Waveform Visualizer
const LiveVoiceWaveform: React.FC = () => {
  const bar0 = useRef(new Animated.Value(0.35)).current;
  const bar1 = useRef(new Animated.Value(0.55)).current;
  const bar2 = useRef(new Animated.Value(0.75)).current;
  const bar3 = useRef(new Animated.Value(0.95)).current;
  const bar4 = useRef(new Animated.Value(1.0)).current;
  const bar5 = useRef(new Animated.Value(0.85)).current;
  const bar6 = useRef(new Animated.Value(0.65)).current;
  const bar7 = useRef(new Animated.Value(0.45)).current;
  const bar8 = useRef(new Animated.Value(0.3)).current;

  const auraOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const createWaveLoop = (
      anim: Animated.Value,
      minVal: number,
      maxVal: number,
      midVal: number,
      duration: number,
      delay: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxVal,
            duration: duration * 0.4,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: minVal,
            duration: duration * 0.35,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: midVal,
            duration: duration * 0.25,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const l0 = createWaveLoop(bar0, 0.2, 0.65, 0.35, 620, 0);
    const l1 = createWaveLoop(bar1, 0.28, 0.85, 0.5, 540, 60);
    const l2 = createWaveLoop(bar2, 0.38, 0.95, 0.65, 480, 120);
    const l3 = createWaveLoop(bar3, 0.42, 1.0, 0.72, 430, 80);
    const l4 = createWaveLoop(bar4, 0.52, 1.0, 0.82, 390, 40); // Center gold peak
    const l5 = createWaveLoop(bar5, 0.4, 0.95, 0.7, 460, 100);
    const l6 = createWaveLoop(bar6, 0.32, 0.88, 0.58, 520, 140);
    const l7 = createWaveLoop(bar7, 0.25, 0.75, 0.42, 580, 80);
    const l8 = createWaveLoop(bar8, 0.18, 0.58, 0.3, 640, 20);

    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraOpacity, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(auraOpacity, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    l0.start();
    l1.start();
    l2.start();
    l3.start();
    l4.start();
    l5.start();
    l6.start();
    l7.start();
    l8.start();
    auraLoop.start();

    return () => {
      l0.stop();
      l1.stop();
      l2.stop();
      l3.stop();
      l4.stop();
      l5.stop();
      l6.stop();
      l7.stop();
      l8.stop();
      auraLoop.stop();
    };
  }, [bar0, bar1, bar2, bar3, bar4, bar5, bar6, bar7, bar8, auraOpacity]);

  const barsData = [
    { anim: bar0, color: '#6366F1', baseHeight: 36 }, // Purple
    { anim: bar1, color: '#8B5CF6', baseHeight: 42 }, // Violet Purple
    { anim: bar2, color: '#FBBF24', baseHeight: 48 }, // Rich Gold
    { anim: bar3, color: '#F59E0B', baseHeight: 46 }, // Amber Gold
    { anim: bar4, color: '#8B5CF6', baseHeight: 50 }, // Center Purple Peak
    { anim: bar5, color: '#FBBF24', baseHeight: 48 }, // Rich Gold
    { anim: bar6, color: '#F59E0B', baseHeight: 46 }, // Amber Gold
    { anim: bar7, color: '#8B5CF6', baseHeight: 42 }, // Violet Purple
    { anim: bar8, color: '#6366F1', baseHeight: 36 }, // Purple
  ];

  return (
    <View style={styles.waveformWrapper}>
      {/* Glowing Backdrop Aura */}
      <Animated.View style={[styles.waveformAura, { opacity: auraOpacity }]} />

      <View style={styles.waveformContainer}>
        {barsData.map((b, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              {
                backgroundColor: b.color,
                height: b.baseHeight,
                transform: [{ scaleY: b.anim }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenSchedule,
  onOpenJarvisPro,
  onOpenIdeaDetail,
  onOpenPostComposer,
  onOpenIdeaAngle,
  onOpenScript,
  onOpenCaption,
  onOpenMessages,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [drafts, setDrafts] = useState<DraftItem[]>(INITIAL_DRAFTS);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Modal Visibility States
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showAllDraftsModal, setShowAllDraftsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Mission Accomplished!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your post has been scheduled & streak is protected.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Great job staying consistent today!');
  const [celebrationBadge, setCelebrationBadge] = useState('POST SCHEDULED');
  const [celebrationXp, setCelebrationXp] = useState(50);

  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postPlatform, setPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [postTime, setPostTime] = useState('7:30 PM');

  // Script Generator Form State
  const [scriptHook, setScriptHook] = useState('Stop scrolling if you are a creator in 2026.');
  const [scriptStory, setScriptStory] = useState('I used to spend 4 hours editing one 30-second video until I discovered batch filming.');
  const [scriptLesson, setScriptLesson] = useState('Systems create consistency. Consistency creates leverage.');
  const [scriptCta, setScriptCta] = useState('Comment "GROWTH" and I will send you my workflow!');

  // Caption Generator State
  const [captionTone, setCaptionTone] = useState<'authentic' | 'viral' | 'educational'>('authentic');
  const [generatedCaption, setGeneratedCaption] = useState(
    'One thing I wish I knew before I started creating: perfection is the enemy of consistency. Post the video, learn from the data, repeat. 🔥 #creatortips #creatorgrowth #poststreak'
  );

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  const triggerModalPop = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    modalPopScale.setValue(0.88);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 26,
      bounciness: 12,
    }).start();
  };

  const openNewPost = (prefillTitle?: string, prefillPlatform?: 'tiktok' | 'instagram' | 'youtube') => {
    if (onOpenPostComposer) {
      onOpenPostComposer(prefillTitle, prefillPlatform);
    } else {
      if (prefillTitle) setPostTitle(prefillTitle);
      if (prefillPlatform) setPostPlatform(prefillPlatform);
      triggerModalPop();
      setShowNewPostModal(true);
    }
  };

  const openIdeas = () => {
    if (onOpenIdeaAngle) {
      onOpenIdeaAngle();
    } else {
      triggerModalPop();
      setShowIdeasModal(true);
    }
  };

  const openScript = () => {
    if (onOpenScript) {
      onOpenScript('One thing I wish I knew before I started creating');
    } else {
      triggerModalPop();
      setShowScriptModal(true);
    }
  };

  const openCaption = () => {
    if (onOpenCaption) {
      onOpenCaption('One thing I wish I knew before I started creating');
    } else {
      triggerModalPop();
      setShowCaptionModal(true);
    }
  };

  const openDraft = (draft: DraftItem) => {
    setSelectedDraft(draft);
    if (onOpenIdeaDetail) {
      onOpenIdeaDetail(draft.title);
    } else {
      triggerModalPop();
      setShowDraftModal(true);
    }
  };

  const openAllDrafts = () => {
    triggerModalPop();
    setShowAllDraftsModal(true);
  };

  const openNotifications = () => {
    triggerModalPop();
    setShowNotificationModal(true);
  };

  const openProfile = () => {
    triggerModalPop();
    setShowProfileModal(true);
  };

  const openChat = () => {
    if (onOpenMessages) {
      onOpenMessages();
    } else {
      triggerModalPop();
      setShowChatModal(true);
    }
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

  const handleCreatePostSubmit = () => {
    if (!postTitle.trim()) {
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newDraft: DraftItem = {
      id: `draft_${Date.now()}`,
      title: postTitle,
      platform: postPlatform === 'tiktok' ? 'TikTok' : postPlatform === 'instagram' ? 'Instagram' : 'YouTube',
      editedTime: 'Just now',
      imageSource: require('../../assets/images/elena-avatar.jpg'),
    };

    setDrafts([newDraft, ...drafts]);
    setShowNewPostModal(false);
    setPostTitle('');

    // Trigger Animated Ghost Celebration Modal
    setCelebrationTitle('Post Draft Scheduled!');
    setCelebrationSubtitle('Your draft is stored and scheduled for tomorrow at 11:30 AM.');
    setCelebrationSpeech('Ghost says: You are on fire today Amara! 47 days and counting!');
    setCelebrationBadge('STREAK PROTECTED');
    setCelebrationXp(50);
    setShowCelebrationModal(true);
  };

  const handleOpenScheduleView = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenSchedule) {
      onOpenSchedule();
    } else if (onNavigateTab) {
      onNavigateTab('schedule' as TabType);
    }
  };

  const handleOpenVoiceStudioPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenJarvisPro) {
      onOpenJarvisPro();
    } else if (onNavigateTab) {
      onNavigateTab('growth');
    }
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot */}
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

          {/* Right Icons: Messages, Notification Bell, Profile */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={openChat}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={openNotifications}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              {unreadNotifCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={openProfile}
            >
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
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP PILL BADGES (ROYAL PURPLE & METALLIC GOLD) */}
          <View style={styles.topBadgesRow}>
            <LinearGradient
              colors={['#7C3AED', '#582CDB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createPill}
            >
              <Text style={styles.createPillText}>Create</Text>
            </LinearGradient>

            <View style={styles.freeToolsPill}>
              <Text style={styles.freeToolsPillText}>✨ FREE CREATE TOOLS</Text>
            </View>
          </View>

          {/* HEADLINE & SUBTITLE */}
          <Text style={styles.mainHeading}>Create your next post.</Text>
          <Text style={styles.mainSubtitle}>
            Turn one idea into a post your audience wants to watch.
          </Text>

          {/* 1. HERO STREAK SAVER CARD */}
          <View style={styles.streakSaverCard}>
            <View style={styles.streakHeaderRow}>
              <View style={styles.streakLeftGroup}>
                <View style={styles.flameIconCircle}>
                  <Text style={styles.flameEmoji}>🔥</Text>
                </View>
                <View style={styles.streakTitlesContainer}>
                  <Text style={styles.streakSaverTag} numberOfLines={1}>STREAK SAVER</Text>
                  <Text style={styles.streakDaysTitle} numberOfLines={1}>47-day streak</Text>
                </View>
              </View>

              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText} numberOfLines={1}>Active</Text>
              </View>
            </View>

            {/* Prompt Inner Box */}
            <View style={styles.promptInnerBox}>
              <Text style={styles.promptText}>
                Create a 30-second Reel: &ldquo;One thing I wish I knew before I started creating.&rdquo;
              </Text>
            </View>

            {/* Platform & Suggested Time Row (Purple & Gold Accents) */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPillPurple}>
                <Text style={styles.tagPillPurpleText}>TikTok</Text>
              </View>
              <View style={styles.tagPillPurple}>
                <Text style={styles.tagPillPurpleText}>Instagram Reel</Text>
              </View>
              <View style={styles.suggestedTimePillGold}>
                <Text style={styles.suggestedTimePillGoldText}>⚡ Suggested: 7:30 PM</Text>
              </View>
            </View>

            {/* Primary Action Button: Use This Idea */}
            <Pressable
              style={({ pressed }) => [styles.useIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenIdeaDetail) {
                  onOpenIdeaDetail('One thing I wish I knew before I started creating');
                } else {
                  openNewPost('One thing I wish I knew before I started creating', 'instagram');
                }
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.useIdeaGradient}
              >
                <Text style={styles.useIdeaBtnText}>Use This Idea ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 2. JARVIS SUGGESTION CARD */}
          <View style={styles.jarvisSuggestionCard}>
            <Animated.View
              style={[
                styles.jarvisFlameCircle,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisFlameIcon}
                resizeMode="contain"
              />
            </Animated.View>
            <View style={styles.jarvisSuggestionContent}>
              <Text style={styles.jarvisSuggestionTitle}>Jarvis Suggestion</Text>
              <Text style={styles.jarvisSuggestionText}>
                Your streak is active. One finished post today keeps your momentum strong.
              </Text>
            </View>
          </View>

          {/* 3. 2x2 CREATION TOOLS GRID */}
          <View style={styles.toolsGrid}>
            {/* Tool 1: New Post */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => openNewPost()}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#582CDB' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.toolTitle} numberOfLines={1}>New Post</Text>
              <Text style={styles.toolSubtitle} numberOfLines={1}>Start from scratch</Text>
            </Pressable>

            {/* Tool 2: Ideas */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={openIdeas}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
                    fill="#D97706"
                  />
                  <Path
                    d="M19 16L20.2 18.8L23 20L20.2 21.2L19 24L17.8 21.2L15 20L17.8 18.8L19 16Z"
                    fill="#D97706"
                  />
                </Svg>
              </View>
              <Text style={styles.toolTitle} numberOfLines={1}>Ideas</Text>
              <Text style={styles.toolSubtitle} numberOfLines={1}>Find your next angle</Text>
            </Pressable>

            {/* Tool 3: Script */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={openScript}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19.82 2H4.18C2.97 2 2 2.97 2 4.18v15.64C2 21.03 2.97 22 4.18 22h15.64c1.21 0 2.18-.97 2.18-2.18V4.18C22 2.97 21.03 2 19.82 2z"
                    stroke="#582CDB"
                    strokeWidth="2.2"
                  />
                  <Path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" stroke="#582CDB" strokeWidth="2.2" />
                </Svg>
              </View>
              <Text style={styles.toolTitle} numberOfLines={1}>Script</Text>
              <Text style={styles.toolSubtitle} numberOfLines={1}>Build a story</Text>
            </Pressable>

            {/* Tool 4: Caption */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={openCaption}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.quoteIconText, { color: '#582CDB' }]}>99</Text>
              </View>
              <Text style={styles.toolTitle} numberOfLines={1}>Caption</Text>
              <Text style={styles.toolSubtitle} numberOfLines={1}>Write in your voice</Text>
            </Pressable>
          </View>

          {/* 4. SCHEDULED POSTS CARD (3 posts scheduled) */}
          <Pressable
            style={({ pressed }) => [styles.scheduledBannerCard, pressed && styles.btnPressed]}
            onPress={handleOpenScheduleView}
          >
            <View style={styles.scheduledLeft}>
              <View style={[styles.calendarIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#582CDB" strokeWidth="2.2" />
                  <Path d="M16 2v4M8 2v4M3 10h18" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.scheduledTextGroup}>
                <Text style={styles.scheduledTitle} numberOfLines={1}>3 posts scheduled</Text>
                <Text style={styles.scheduledSub} numberOfLines={1}>Next: Tomorrow at 11:30 AM</Text>
              </View>
            </View>

            <Pressable onPress={handleOpenScheduleView} hitSlop={10} style={styles.scheduledOpenBtn}>
              <Text style={styles.scheduledOpenLink}>Open</Text>
            </Pressable>
          </Pressable>

          {/* 5. YOUR DRAFTS SECTION */}
          <View style={styles.draftsHeaderRow}>
            <Text style={styles.draftsSectionTitle}>Your Drafts</Text>
            <Pressable onPress={openAllDrafts} hitSlop={6}>
              <Text style={styles.viewAllDraftsLink}>View all drafts</Text>
            </Pressable>
          </View>

          <View style={styles.draftsList}>
            {drafts.map((draft) => (
              <Pressable
                key={draft.id}
                style={({ pressed }) => [styles.draftCard, pressed && styles.btnPressed]}
                onPress={() => openDraft(draft)}
              >
                <Image source={draft.imageSource} style={styles.draftThumbnail} resizeMode="cover" />
                <View style={styles.draftContentCol}>
                  <Text style={styles.draftTitle} numberOfLines={1}>
                    {draft.title}
                  </Text>
                  <Text style={styles.draftMeta}>
                    {draft.platform === 'TikTok' ? '💬' : '📷'} {draft.platform} • {draft.editedTime}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => openDraft(draft)}
                >
                  <Text style={styles.draftMoreDots}>⋮</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>

          {/* 6. VOICE STUDIO PRO CARD */}
          <View style={styles.voiceStudioCard}>
            <View style={styles.voiceStudioProPill}>
              <Text style={styles.voiceStudioProPillText}>🔒 PRO FEATURE</Text>
            </View>

            <Text style={styles.voiceStudioTitle}>Voice Studio</Text>
            <Text style={styles.voiceStudioSubtitle}>
              Turn scripts into voiceovers with Pro.
            </Text>

            {/* Live Animated Audio Waveform Graphic */}
            <LiveVoiceWaveform />

            {/* Unlock Voice Studio Metallic Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.unlockVoiceBtn, pressed && styles.btnPressed]}
              onPress={handleOpenVoiceStudioPro}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockVoiceGradient}
              >
                <Text style={styles.unlockVoiceBtnText}>Unlock Voice Studio</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* FROSTED LIQUID GLASS MODALS (POSTSTREAK LUXURY STYLE) */}
        {/* ============================================================ */}

        {/* MODAL 1: NEW POST */}
        <Modal
          visible={showNewPostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNewPostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>New Post</Text>
                  <Text style={styles.modalSubtitle}>Create from scratch and protect your streak.</Text>
                </View>

                <Pressable
                  onPress={() => setShowNewPostModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>CHOOSE PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {/* TikTok */}
                <Pressable
                  onPress={() => setPostPlatform('tiktok')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'tiktok' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                      fill={postPlatform === 'tiktok' ? '#FFFFFF' : '#000000'}
                    />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'tiktok' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    TikTok
                  </Text>
                </Pressable>

                {/* Instagram */}
                <Pressable
                  onPress={() => setPostPlatform('instagram')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'instagram' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="2" width="20" height="20" rx="5" stroke={postPlatform === 'instagram' ? '#FFFFFF' : '#E1306C'} strokeWidth="2.2" />
                    <Circle cx="12" cy="12" r="4" stroke={postPlatform === 'instagram' ? '#FFFFFF' : '#E1306C'} strokeWidth="2.2" />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'instagram' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    Instagram
                  </Text>
                </Pressable>

                {/* YouTube */}
                <Pressable
                  onPress={() => setPostPlatform('youtube')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'youtube' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81z"
                      fill={postPlatform === 'youtube' ? '#FFFFFF' : '#FF0000'}
                    />
                    <Path d="M10 15.5l5.5-3.5L10 8.5v7z" fill={postPlatform === 'youtube' ? '#582CDB' : '#FFFFFF'} />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'youtube' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    YouTube
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>POST TITLE / HOOK</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="e.g. 3 creator habits that changed my reach..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalInputLabel}>SCHEDULE TIME</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTime}
                onChangeText={setPostTime}
                placeholder="e.g. 7:30 PM"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowNewPostModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalPrimaryBtn} onPress={handleCreatePostSubmit}>
                  <LinearGradient
                    colors={['#6366F1', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Save &amp; Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 2: TRENDING IDEAS */}
        <Modal
          visible={showIdeasModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIdeasModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>AI Hook Sparks</Text>
                  <Text style={styles.modalSubtitle}>Trending angles customized for your niche:</Text>
                </View>

                <Pressable
                  onPress={() => setShowIdeasModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {TRENDING_IDEAS.map((idea, idx) => (
                <Pressable
                  key={idx}
                  style={styles.ideaItemCard}
                  onPress={() => {
                    setPostTitle(idea);
                    setShowIdeasModal(false);
                    openNewPost(idea);
                  }}
                >
                  <Text style={styles.ideaItemText}>&ldquo;{idea}&rdquo;</Text>
                  <Text style={styles.ideaItemTag}>⚡ 94 Viral Score • High Retention</Text>
                </Pressable>
              ))}

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowIdeasModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 3: SCRIPT BUILDER */}
        <Modal
          visible={showScriptModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScriptModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Script Builder</Text>
                  <Text style={styles.modalSubtitle}>Hook ➔ Story ➔ Lesson ➔ CTA formula:</Text>
                </View>

                <Pressable
                  onPress={() => setShowScriptModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 290 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalInputLabel}>🎣 HOOK (0 - 3s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptHook}
                  onChangeText={setScriptHook}
                  multiline
                />

                <Text style={styles.modalInputLabel}>📖 STORY (3 - 25s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptStory}
                  onChangeText={setScriptStory}
                  multiline
                />

                <Text style={styles.modalInputLabel}>💡 LESSON (25 - 45s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptLesson}
                  onChangeText={setScriptLesson}
                  multiline
                />

                <Text style={styles.modalInputLabel}>📣 CALL TO ACTION (45 - 60s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptCta}
                  onChangeText={setScriptCta}
                />
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowScriptModal(false);
                  openNewPost(scriptHook);
                }}
              >
                <Text style={styles.modalFullBtnText}>Use in Next Post ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 4: CAPTION GENERATOR */}
        <Modal
          visible={showCaptionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCaptionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Caption Generator</Text>
                  <Text style={styles.modalSubtitle}>Craft high-engagement captions in your voice:</Text>
                </View>
                <Pressable
                  onPress={() => setShowCaptionModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.platformSelectRow}>
                {(['authentic', 'viral', 'educational'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setCaptionTone(t)}
                    style={[
                      styles.platformSelectBtn,
                      captionTone === t && styles.platformSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.platformSelectBtnText,
                        captionTone === t && styles.platformSelectBtnTextActive,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.modalTextInput, { height: 100 }]}
                value={generatedCaption}
                onChangeText={setGeneratedCaption}
                multiline
              />

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowCaptionModal(false);
                  setCelebrationTitle('Caption Copied!');
                  setCelebrationSubtitle('Your caption and viral creator hashtags are copied to your clipboard.');
                  setCelebrationSpeech('Ghost says: Captions with clear takeaways get 40% more saves & shares!');
                  setCelebrationBadge('VIRAL COPY READY');
                  setCelebrationXp(25);
                  setShowCelebrationModal(true);
                }}
              >
                <Text style={styles.modalFullBtnText}>Copy Caption &amp; Hashtags ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 5: DRAFT DETAIL */}
        <Modal
          visible={showDraftModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDraftModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>{selectedDraft?.platform} Draft</Text>
                  <Text style={styles.modalSubtitle}>{selectedDraft?.editedTime}</Text>
                </View>
                <Pressable
                  onPress={() => setShowDraftModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.promptInnerBox}>
                <Text style={styles.promptText}>{selectedDraft?.title}</Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowDraftModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Close</Text>
                </Pressable>

                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setShowDraftModal(false);
                    handleOpenScheduleView();
                  }}
                >
                  <LinearGradient
                    colors={['#6366F1', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Open in Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 6: ALL DRAFTS LIST */}
        <Modal
          visible={showAllDraftsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAllDraftsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>All Creator Drafts</Text>
                  <Text style={styles.modalSubtitle}>Manage your active video concepts</Text>
                </View>
                <Pressable
                  onPress={() => setShowAllDraftsModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {drafts.map((draft) => (
                  <Pressable
                    key={draft.id}
                    style={styles.draftCard}
                    onPress={() => {
                      setShowAllDraftsModal(false);
                      openDraft(draft);
                    }}
                  >
                    <Image source={draft.imageSource} style={styles.draftThumbnail} resizeMode="cover" />
                    <View style={styles.draftContentCol}>
                      <Text style={styles.draftTitle} numberOfLines={1}>{draft.title}</Text>
                      <Text style={styles.draftMeta}>{draft.platform} • {draft.editedTime}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowAllDraftsModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 7: NOTIFICATION CENTER */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Streak updates &amp; squad activity</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {notificationsList.map((notif) => (
                  <View key={notif.id} style={[styles.notifCard, notif.unread && styles.notifCardUnread]}>
                    <View style={[styles.notifBadge, { backgroundColor: notif.badgeBg, borderColor: notif.badgeBorder }]}>
                      <Text style={{ fontSize: 16 }}>{notif.iconEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifBody}>{notif.body}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setNotificationsList(notificationsList.map((n) => ({ ...n, unread: false })));
                  setShowNotificationModal(false);
                }}
              >
                <Text style={styles.modalFullBtnText}>Mark All Read &amp; Close</Text>
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

        {/* MODAL 9: CREATOR CHAT */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Creator Squad Chat</Text>
                  <Text style={styles.modalSubtitle}>Connect &amp; collaborate with matched creators</Text>
                </View>
                <Pressable
                  onPress={() => setShowChatModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatMessageBubble}>
                <Text style={styles.chatSender}>🤖 Jarvis Growth AI</Text>
                <Text style={styles.chatBody}>Your morning creator brief is ready. 3 trending hook angles were matched to your audience.</Text>
              </View>

              <View style={styles.chatMessageBubble}>
                <Text style={styles.chatSender}>📷 Elena Vance</Text>
                <Text style={styles.chatBody}>Loved your latest Reel! Let us batch film tomorrow around 2 PM.</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowChatModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close Chat</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText={celebrationBadge}
          xpEarned={celebrationXp}
          streakCount={47}
          actionText="Continue ➔"
          onDismiss={() => setShowCelebrationModal(false)}
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
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerGhostLogo: {
    width: 36,
    height: 36,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: sPadding(20),
    paddingTop: 8,
  },

  // TOP PILL BADGES (ROYAL PURPLE & GOLD)
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  createPill: {
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 100,
    overflow: 'hidden',
  },
  createPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  freeToolsPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  freeToolsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },

  // HEADLINE
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#524C62',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. HERO STREAK SAVER CARD (PURPLE & GOLD ACCENTS)
  streakSaverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: sPadding(16),
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  streakLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  flameIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  flameEmoji: {
    fontSize: 16,
  },
  streakTitlesContainer: {
    flex: 1,
    minWidth: 0,
  },
  streakSaverTag: {
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  streakDaysTitle: {
    fontSize: sFont(16.5),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 100,
    flexShrink: 0,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#582CDB',
  },
  activePillText: {
    fontSize: sFont(10.5),
    fontWeight: '800',
    color: '#582CDB',
  },
  promptInnerBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 14,
    marginBottom: 14,
  },
  promptText: {
    fontSize: 14,
    color: '#1E1B4B',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tagPillPurple: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagPillPurpleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  suggestedTimePillGold: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  suggestedTimePillGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  useIdeaBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  useIdeaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useIdeaBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // 2. JARVIS SUGGESTION CARD (ROYAL PURPLE & GOLD)
  jarvisSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
  },
  jarvisFlameCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  jarvisFlameIcon: {
    width: 24,
    height: 24,
  },
  jarvisSuggestionContent: {
    flex: 1,
  },
  jarvisSuggestionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 2,
  },
  jarvisSuggestionText: {
    fontSize: 12,
    color: '#6D28D9',
    lineHeight: 17,
    fontWeight: '500',
  },

  // 3. 2x2 CREATION TOOLS GRID
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
    width: '100%',
  },
  toolGridCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: sPadding(12),
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteIconText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#582CDB',
  },
  toolTitle: {
    fontSize: sFont(13.5),
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: sFont(11),
    color: '#6B7280',
    fontWeight: '500',
  },

  // 4. SCHEDULED POSTS BANNER
  scheduledBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: sPadding(14),
    marginBottom: 24,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  scheduledLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
    minWidth: 0,
  },
  calendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  scheduledTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  scheduledTitle: {
    fontSize: sFont(13.5),
    fontWeight: '800',
    color: '#171420',
  },
  scheduledSub: {
    fontSize: sFont(11),
    color: '#6D28D9',
    marginTop: 1,
    fontWeight: '500',
  },
  scheduledOpenBtn: {
    paddingLeft: 8,
    flexShrink: 0,
  },
  scheduledOpenLink: {
    fontSize: sFont(13),
    fontWeight: '800',
    color: '#582CDB',
  },

  // 5. YOUR DRAFTS SECTION
  draftsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  draftsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  viewAllDraftsLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  draftsList: {
    gap: 10,
    marginBottom: 24,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    gap: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  draftThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  draftContentCol: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 3,
  },
  draftMeta: {
    fontSize: 12,
    color: '#6D28D9',
    fontWeight: '500',
  },
  draftMoreDots: {
    fontSize: 18,
    color: '#582CDB',
    paddingHorizontal: 6,
  },

  // 6. VOICE STUDIO PRO CARD (METALLIC GOLD & PURPLE DASHED)
  voiceStudioCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    padding: 22,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  voiceStudioProPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 3.5,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 10,
  },
  voiceStudioProPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  voiceStudioTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  voiceStudioSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '500',
  },
  waveformWrapper: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    width: '100%',
  },
  waveformAura: {
    position: 'absolute',
    width: 150,
    height: 42,
    borderRadius: 22,
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
  },
  waveBar: {
    width: 6.5,
    borderRadius: 10,
  },
  unlockVoiceBtn: {
    width: '100%',
    maxWidth: 240,
    height: 44,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockVoiceGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockVoiceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // ============================================================
  // POSTSTREAK LUXURY FROSTED MODAL STYLING
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Ghost Speech Header inside Modals
  modalGhostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    marginBottom: 14,
  },
  modalGhostImgWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGhostImg: {
    width: 28,
    height: 28,
  },
  modalGhostSpeechBubble: {
    flex: 1,
  },
  modalGhostSpeechText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 22,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  platformSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  platformSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  platformSelectBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformSelectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#524C62',
  },
  platformSelectBtnTextActive: {
    color: '#FFFFFF',
  },
  modalTextInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#171420',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#524C62',
  },
  modalPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  ideaItemCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 10,
  },
  ideaItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  ideaItemTag: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '600',
  },

  // Notification Modal Styles
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Profile Modal Styles
  profileModalCardInner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileModalIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  profileModalNiche: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  profileModalLevelPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  profileModalLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // Chat Modal Styles
  chatMessageBubble: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },
  chatSender: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 3,
  },
  chatBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },

  // Success Modal Styles
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
    marginBottom: 6,
  },
  successModalBody: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
});
