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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont } from '../utils/responsive';

export interface CollabPlan {
  id: string;
  title: string;
  pillTag: string;
  desc: string;
  tags: string[];
  goal: string;
  outline: string[];
  yourRoles: string[];
  partnerRoles: string[];
  caption: string;
  jarvisAdvice: string;
  format: string;
  formatSub: string;
}

export const COLLAB_PLANS: CollabPlan[] = [
  {
    id: 'plan_1',
    title: 'Day in Lagos: Creator Edition',
    pillTag: 'DAY IN LAGOS',
    desc: 'A short lifestyle collaboration where two creators show how they plan, film and publish content in one day.',
    tags: ['Lifestyle', 'Behind the Scenes', 'Short-form Video', 'Easy to Film'],
    goal: 'Create a simple first collab that builds trust and is easy to execute.',
    outline: [
      '1. Meet up and greet on camera',
      '2. Plan the collaborative post',
      '3. Film both creators together',
      '4. Share one key creator lesson',
      '5. Post and tag each other',
    ],
    yourRoles: [
      '• Introduce concept',
      '• Share creator lesson',
      '• Edit final footage',
      '• Write caption copy',
    ],
    partnerRoles: [
      '• Choose locations',
      '• Film key scenes',
      '• Add her perspective',
      '• Share first to story',
    ],
    caption:
      '"Spent the day creating with @{partner}. We realized that the hardest part of growth is not the work, it is the plan. Here is how we filmed 3 hooks in under 30 minutes..."',
    jarvisAdvice:
      "Keep this first collaboration simple. A short behind-the-scenes Reel is much easier to finish and publish today, ensuring you do not lose your 47-day momentum while exploring this new partnership.",
    format: 'Short Reel',
    formatSub: 'Vertical 9:16, under 45s',
  },
  {
    id: 'plan_2',
    title: '2 Creators, 1 Viral Hook Challenge',
    pillTag: 'VIRAL CHALLENGE',
    desc: 'Two creators compete to write the most unskippable 3-second hook for the same viral topic, then react to each other.',
    tags: ['Hook Challenge', 'Split-Screen', 'High Retention', 'Interactive'],
    goal: 'Drive high comment engagement and debate by letting audience vote for best hook.',
    outline: [
      '1. State the 3-second hook challenge rule',
      '2. Film Take A: Your punchy opening hook',
      '3. Film Take B: Partner unexpected reverse angle',
      '4. React to each other hooks live on camera',
      '5. Ask audience in caption: Drop 1 or 2 in comments',
    ],
    yourRoles: [
      '• Present topic constraint',
      '• Deliver Hook #1 on camera',
      '• Edit split-screen reaction',
      '• Pin the top voting comment',
    ],
    partnerRoles: [
      '• Deliver Hook #2 on camera',
      '• Record surprise reaction',
      '• Add sound effects & captions',
      '• Engage with comment votes',
    ],
    caption:
      '"We challenged each other to write the most unskippable hook in 60 seconds with @{partner}. Who delivered the better opening? Drop 1 or 2 in the comments 👇"',
    jarvisAdvice:
      'Hook challenges generate 3.2x more comments than standard videos. Pin a comment asking "Who won this round?" within the first 10 minutes of posting.',
    format: 'Split Reel / Duo',
    formatSub: 'Vertical 9:16, 30-45s',
  },
  {
    id: 'plan_3',
    title: 'Creator Tech & Gear Setup Swap',
    pillTag: 'TECH SWAP',
    desc: 'Swap one piece of filming equipment or an editing app for 1 hour and test if expensive gear actually makes better content.',
    tags: ['Tech & Gear', 'Honest Review', 'Studio BTS', 'Budget Tips'],
    goal: 'Showcase authentic creator workflow and provide budget-friendly production hacks.',
    outline: [
      '1. Show our current filming gear side-by-side',
      '2. Swap primary lighting/mic setup with partner',
      '3. Film identical test scenes in low and high light',
      '4. Reveal side-by-side video quality results',
      '5. Give final honest verdict on budget vs pro gear',
    ],
    yourRoles: [
      '• Demo audio & mic differences',
      '• Film side-by-side test cut',
      '• Create comparison overlays',
      '• Draft tech breakdown caption',
    ],
    partnerRoles: [
      '• Demo lighting & focal length',
      '• Provide camera settings tips',
      '• Edit color grade comparison',
      '• Share gear links on Stories',
    ],
    caption:
      '"I swapped filming gear with @{partner} for 24 hours. The results proved that good lighting beats an expensive camera every single time. Here is what we found..."',
    jarvisAdvice:
      'Gear comparisons perform exceptionally well in save-rate metrics. Make sure to list the exact lighting settings in the caption to maximize bookmarks.',
    format: 'Side-by-Side Video',
    formatSub: 'Vertical 9:16, 50s',
  },
  {
    id: 'plan_4',
    title: 'Creator Routine Roast & React',
    pillTag: 'COMEDIC ROAST',
    desc: 'A hilarious and relatable breakdown where creators expose each others chaotic filming schedules and fix one bad habit.',
    tags: ['Humor', 'Relatable BTS', 'Productivity', 'Blooper Reel'],
    goal: 'Humanize your brand and build deep community rapport through relatable humor.',
    outline: [
      '1. Confess your most embarrassing creator habit',
      '2. Partner reacts with genuine disbelief on camera',
      '3. Partner shares their 10-minute fix for that habit',
      '4. Test the new habit live and show bloopers',
      '5. Tag each other and challenge creators to confess theirs',
    ],
    yourRoles: [
      '• Expose weekly planning chaos',
      '• Deliver comedic reaction takes',
      '• Edit funny zoom-ins and sound effects',
      '• Write lighthearted caption',
    ],
    partnerRoles: [
      '• Critique with tough creator love',
      '• Demonstrate productivity fix',
      '• Capture blooper outtakes',
      '• Reply to relatable comments',
    ],
    caption:
      '"I showed @{partner} how I actually plan my weekly posts and they were horrified 😂 But this one tip they gave me saved 2 hours of editing today..."',
    jarvisAdvice:
      'Relatable bloopers retain 88% of viewers past the 15-second mark. Keep the opening candid without an over-polished intro.',
    format: 'Comedy Short',
    formatSub: 'Vertical 9:16, 35s',
  },
  {
    id: 'plan_5',
    title: '14-Day Accountability Duo Pact',
    pillTag: 'DUO PACT',
    desc: 'Two creators commit to a joint 14-day posting streak with a friendly forfeit punishment if either creator breaks momentum.',
    tags: ['Streak Pact', 'Motivation', 'Community Quest', 'High Viral Multiplier'],
    goal: 'Protect both creators active streaks while giving audience a compelling 14-day narrative to follow.',
    outline: [
      '1. Announce official duo accountability challenge on camera',
      '2. Agree on the hilarious penalty for whoever misses a post',
      '3. Shake hands / high-five to seal the consistency pact',
      '4. Show Day 1 consistency proof and streak counter',
      '5. Invite audience to hold both creators accountable in comments',
    ],
    yourRoles: [
      '• Kick off pact announcement video',
      '• Track the duo consistency counter',
      '• Post Day 1 proof to main feed',
      '• Coordinate daily check-ins',
    ],
    partnerRoles: [
      '• Reveal the forfeit penalty',
      '• Confirm agreement on camera',
      '• Tag community for accountability',
      '• Share daily check-in to story',
    ],
    caption:
      '"Official duo pact: @{partner} and I are posting every single day for 14 days straight. If either of us breaks the streak, we have to film the loser punishment. Hold us accountable!"',
    jarvisAdvice:
      'Accountability pacts create a multi-part series effect. Users who follow Day 1 are 60% more likely to watch subsequent videos to see if the streak holds.',
    format: 'Series Kickoff Reel',
    formatSub: 'Vertical 9:16, 40s',
  },
];

interface CollabIdeaScreenProps {
  partnerName?: string;
  partnerHandle?: string;
  partnerNiche?: string;
  partnerAvatar?: any;
  initialPlanIndex?: number;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onStartCollaboration?: (collabData: { title: string; caption: string; partnerName: string }) => void;
  onOpenMessages?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
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

interface PublishingSlot {
  id: string;
  time: string;
  score: number;
  level: string;
  multiplier: string;
  tag: string;
  desc: string;
}

const PUBLISHING_SLOTS: PublishingSlot[] = [
  {
    id: 's1',
    time: '9:00 AM',
    score: 62,
    level: 'Moderate',
    multiplier: '1.0x',
    tag: 'Morning Scroll',
    desc: 'Audience is commuting. Good for short educational tips.',
  },
  {
    id: 's2',
    time: '12:30 PM',
    score: 78,
    level: 'Good Spurt',
    multiplier: '1.4x',
    tag: 'Lunch Spike',
    desc: 'Strong midday break traffic across Instagram & TikTok.',
  },
  {
    id: 's3',
    time: '3:30 PM',
    score: 70,
    level: 'Moderate',
    multiplier: '1.2x',
    tag: 'Afternoon Wave',
    desc: 'Steady baseline engagement before evening surge.',
  },
  {
    id: 's4',
    time: '5:30 PM',
    score: 86,
    level: 'High Reach',
    multiplier: '1.8x',
    tag: 'Evening Prime',
    desc: 'Creators & followers finishing work. High comment velocity.',
  },
  {
    id: 's5',
    time: '7:30 PM',
    score: 98,
    level: '🔥 Viral Window',
    multiplier: '2.5x',
    tag: 'Peak Viral Slot',
    desc: 'Highest algorithm retention and watch time in Lagos & Global.',
  },
  {
    id: 's6',
    time: '9:30 PM',
    score: 82,
    level: 'High Engagement',
    multiplier: '1.6x',
    tag: 'Night Wind-Down',
    desc: 'Great for casual storytelling and relatable lifestyle Reels.',
  },
];

const PLANNING_OPTIONS = ['10:00 - 11:00 AM', '11:00 - 12:00 PM', '1:00 - 2:00 PM'];
const FILMING_OPTIONS = ['1:00 - 2:30 PM', '2:00 - 3:30 PM', '4:00 - 5:30 PM'];

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Collab Partner Ready',
    body: 'Elena accepted your 14-day consistency challenge.',
    time: '5m ago',
    unread: true,
    iconEmoji: '⚡',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'n2',
    title: 'Peak Reach Window',
    body: 'Optimal viral co-post time is 7:30 PM today.',
    time: '1h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

export const CollabIdeaScreen: React.FC<CollabIdeaScreenProps> = ({
  partnerName = 'Elena Rostova',
  partnerHandle = '@elenacreates',
  partnerNiche = 'Tech & Lifestyle, Lagos',
  partnerAvatar = require('../../assets/images/elena-avatar.jpg'),
  initialPlanIndex = 0,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onStartCollaboration,
  onOpenMessages,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('match');

  // Dynamic Collab Plan Index
  const [planIndex, setPlanIndex] = useState(initialPlanIndex % COLLAB_PLANS.length);
  const currentPlan = COLLAB_PLANS[planIndex];

  // Interactive Collab State (Loaded from currentPlan)
  const [collabTitle, setCollabTitle] = useState(currentPlan.title);
  const [collabDesc, setCollabDesc] = useState(currentPlan.desc);
  const [captionText, setCaptionText] = useState(
    currentPlan.caption.replace('{partner}', partnerHandle.replace('@', ''))
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'reels']);
  const [isSaved, setIsSaved] = useState(false);

  // When planIndex changes, sync local form
  useEffect(() => {
    const plan = COLLAB_PLANS[planIndex];
    setCollabTitle(plan.title);
    setCollabDesc(plan.desc);
    setCaptionText(plan.caption.replace('{partner}', partnerHandle.replace('@', '')));
  }, [planIndex, partnerHandle]);

  // Dynamic Interactive Schedule State
  const [selectedPlanningTime, setSelectedPlanningTime] = useState(PLANNING_OPTIONS[1]);
  const [selectedFilmingTime, setSelectedFilmingTime] = useState(FILMING_OPTIONS[1]);
  const [selectedPublishingSlotId, setSelectedPublishingSlotId] = useState('s5'); // default 7:30 PM (98%)

  // Temporary state inside the modal before confirming
  const [modalPlanningTime, setModalPlanningTime] = useState(PLANNING_OPTIONS[1]);
  const [modalFilmingTime, setModalFilmingTime] = useState(FILMING_OPTIONS[1]);
  const [modalSlotId, setModalSlotId] = useState('s5');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Collab Started!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Collab draft created and synced with your partner.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Duo momentum protected! +50 XP on completion.');
  const [celebrationBadge, setCelebrationBadge] = useState('COLLAB ACTIVE');

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const rateMeterWidthAnim = useRef(new Animated.Value(98)).current;
  const planShuffleAnim = useRef(new Animated.Value(1)).current;
  const reloadSpinAnim = useRef(new Animated.Value(0)).current;

  const reloadSpinInterpolate = reloadSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentPublishingSlot =
    PUBLISHING_SLOTS.find((s) => s.id === selectedPublishingSlotId) || PUBLISHING_SLOTS[4];
  const activeModalSlot =
    PUBLISHING_SLOTS.find((s) => s.id === modalSlotId) || PUBLISHING_SLOTS[4];

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

  // Handler to cycle to the next plan!
  const handleShuffleAnotherPlan = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    reloadSpinAnim.setValue(0);
    Animated.timing(reloadSpinAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(planShuffleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(planShuffleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const nextIdx = (planIndex + 1) % COLLAB_PLANS.length;
    setPlanIndex(nextIdx);
  };

  const handleOpenScheduleModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalPlanningTime(selectedPlanningTime);
    setModalFilmingTime(selectedFilmingTime);
    setModalSlotId(selectedPublishingSlotId);
    rateMeterWidthAnim.setValue(activeModalSlot.score);
    triggerModalAnim();
    setShowScheduleModal(true);
  };

  const handleSelectModalSlot = (slot: PublishingSlot) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setModalSlotId(slot.id);
    Animated.spring(rateMeterWidthAnim, {
      toValue: slot.score,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  const handleConfirmSchedule = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedPlanningTime(modalPlanningTime);
    setSelectedFilmingTime(modalFilmingTime);
    setSelectedPublishingSlotId(modalSlotId);
    setShowScheduleModal(false);

    setCelebrationTitle('Schedule Updated!');
    setCelebrationSubtitle(`Publishing set to ${activeModalSlot.time} (${activeModalSlot.multiplier} viral reach).`);
    setCelebrationSpeech('Optimal posting slot locked in! Syncing with partner.');
    setCelebrationBadge('SCHEDULE SYNCED');
    setShowCelebrationModal(true);
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

  const handleTogglePlatform = (plat: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedPlatforms.includes(plat)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, plat]);
    }
  };

  const handleToggleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaved(!isSaved);
    setCelebrationTitle(!isSaved ? 'Idea Saved!' : 'Idea Removed');
    setCelebrationSubtitle(!isSaved ? 'Saved to your creator collaboration vault.' : 'Removed from your saved ideas.');
    setCelebrationSpeech(!isSaved ? 'Ready to film anytime you and your partner connect.' : 'Vault updated.');
    setCelebrationBadge(!isSaved ? 'SAVED' : 'UPDATED');
    setShowCelebrationModal(true);
  };

  const handleUseCaption = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onStartCollaboration) {
      onStartCollaboration({
        title: collabTitle,
        caption: captionText,
        partnerName: partnerName,
      });
    }
  };

  const handleStartCollab = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onStartCollaboration) {
      onStartCollaboration({
        title: collabTitle,
        caption: captionText,
        partnerName: partnerName,
      });
    }
  };

  const handleSendInvite = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationTitle('Invitation Sent!');
    setCelebrationSubtitle(`Collab pitch & script sent to ${partnerName}'s inbox.`);
    setCelebrationSpeech('Accountability invite active! +20 XP.');
    setCelebrationBadge('INVITE SENT');
    setShowCelebrationModal(true);
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
          {/* 1. TOP AIRY HEADER BAR */}
          <FreeAppHeader
            onBack={onBack}
            onOpenJarvisPro={onOpenJarvisPro}
            onOpenMessages={() => {
              if (onOpenMessages) {
                onOpenMessages();
              } else {
                onBack();
              }
            }}
            onOpenNotifications={() => {
              triggerModalAnim();
              setShowNotificationModal(true);
            }}
            onOpenProfile={() => {
              triggerModalAnim();
              setShowProfileModal(true);
            }}
            userProfile={userProfile}
            unreadCount={unreadNotifCount}
            isDark={isDark}
          />

          {/* 2. MAIN SCROLLABLE CONTENT */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Pill Badges & DO ANOTHER PLAN BUTTON */}
            <View style={styles.topBadgesRow}>
              <View style={styles.badgesLeft}>
                <View style={styles.collabIdeaPill}>
                  <Text style={styles.collabIdeaPillText}>{currentPlan.pillTag}</Text>
                </View>
                <View style={styles.planCounterPill}>
                  <Text style={styles.planCounterPillText}>Plan {planIndex + 1}/{COLLAB_PLANS.length}</Text>
                </View>
              </View>

              {/* PRIMARY RELOAD PLAN BUTTON */}
              <Pressable
                style={({ pressed }) => [styles.doAnotherPlanTopBtn, pressed && styles.btnPressed]}
                onPress={handleShuffleAnotherPlan}
                hitSlop={8}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.doAnotherPlanGradient}
                >
                  <Animated.View style={{ transform: [{ rotate: reloadSpinInterpolate }] }}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M3 3v5h5"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M16 21h5v-5"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Animated.View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Main Title & Subtitle */}
            <Text style={styles.mainTitle}>Build a simple creator collaboration.</Text>
            <Text style={styles.mainSubtitle}>
              Keep rolling until you find the perfect concept for you and {partnerName.split(' ')[0]}.
            </Text>

            {/* ANIMATED WRAPPER FOR CURRENT PLAN */}
            <Animated.View style={{ transform: [{ scale: planShuffleAnim }] }}>
              {/* CARD 1: MAIN COLLAB IDEA OVERVIEW */}
              <View style={styles.overviewCard}>
                <View style={styles.overviewTopRow}>
                  <Text style={styles.overviewTitle}>{collabTitle}</Text>
                  <Pressable
                    style={styles.cardCycleBtn}
                    onPress={handleShuffleAnotherPlan}
                    hitSlop={8}
                  >
                    <Animated.View style={{ transform: [{ rotate: reloadSpinInterpolate }] }}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                          stroke="#582CDB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M3 3v5h5"
                          stroke="#582CDB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                          stroke="#582CDB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M16 21h5v-5"
                          stroke="#582CDB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </Animated.View>
                  </Pressable>
                </View>
                <Text style={styles.overviewDesc}>{collabDesc}</Text>

                {/* Tags Row */}
                <View style={styles.overviewTagsRow}>
                  {currentPlan.tags.map((t, idx) => (
                    <View key={idx} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{t}</Text>
                    </View>
                  ))}
                </View>

                {/* Purple Goal Highlight Box */}
                <View style={styles.goalHighlightBox}>
                  <Text style={styles.goalHighlightText}>
                    Goal: {currentPlan.goal}
                  </Text>
                </View>
              </View>

              {/* CARD 2: CONTENT OUTLINE */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardHeaderTitle}>CONTENT OUTLINE</Text>

                <View style={styles.stepperContainer}>
                  {currentPlan.outline.map((step, idx, arr) => (
                    <View key={idx} style={styles.stepperRow}>
                      {/* Stepper Dot and Line */}
                      <View style={styles.stepperLineCol}>
                        <View style={styles.stepperDot} />
                        {idx < arr.length - 1 && <View style={styles.stepperVerticalLine} />}
                      </View>

                      {/* Stepper Text */}
                      <View style={styles.stepperTextCol}>
                        <Text style={styles.stepperStepText}>{step}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* CARD 3: COLLABORATION ROLES */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardHeaderTitle}>COLLABORATION ROLES</Text>

                <View style={styles.rolesGrid}>
                  {/* Column 1: You */}
                  <View style={styles.roleCol}>
                    <View style={styles.roleColHeader}>
                      <Text style={styles.roleUserIcon}>👤</Text>
                      <Text style={styles.roleUserTitle}>You</Text>
                    </View>
                    {currentPlan.yourRoles.map((r, idx) => (
                      <Text key={idx} style={styles.roleBulletText}>{r}</Text>
                    ))}
                  </View>

                  {/* Column 2: Partner */}
                  <View style={styles.roleCol}>
                    <View style={styles.roleColHeader}>
                      <Text style={styles.roleUserIcon}>👤</Text>
                      <Text style={styles.roleUserTitle}>{partnerName.split(' ')[0]}</Text>
                    </View>
                    {currentPlan.partnerRoles.map((r, idx) => (
                      <Text key={idx} style={styles.roleBulletText}>{r}</Text>
                    ))}
                  </View>
                </View>
              </View>

              {/* CARD 4: CAPTION STARTER */}
              <View style={styles.sectionCard}>
                <View style={styles.captionStarterHeaderRow}>
                  <Text style={styles.sectionCardHeaderTitle}>CAPTION STARTER</Text>
                  <Pressable onPress={handleToggleSave} hitSlop={8}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill={isSaved ? '#582CDB' : 'none'}>
                      <Path
                        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                        stroke="#582CDB"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Pressable>
                </View>

                {/* Editable Caption Box */}
                <View style={styles.captionQuoteBox}>
                  <TextInput
                    value={captionText}
                    onChangeText={setCaptionText}
                    multiline
                    placeholder="Write or customize caption..."
                    placeholderTextColor="#94A3B8"
                    style={styles.captionInput}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.useCaptionBtn, pressed && styles.btnPressed]}
                  onPress={handleUseCaption}
                >
                  <Text style={styles.useCaptionBtnText}>Use Caption</Text>
                </Pressable>
              </View>

              {/* CARD 5: JARVIS AI SUGGESTION */}
              <LinearGradient
                colors={['#FAF5FF', '#EDE9FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.jarvisSuggestionCard}
              >
                <View style={styles.jarvisSuggestionHeader}>
                  <Image
                    source={require('../../assets/images/jarvis-core-flame.png')}
                    style={styles.jarvisSuggestionFlame}
                    resizeMode="contain"
                  />
                  <Text style={styles.jarvisSuggestionTitle}>Jarvis AI Suggestion</Text>
                </View>

                <Text style={styles.jarvisSuggestionBody}>
                  {currentPlan.jarvisAdvice}
                </Text>

                <View style={styles.jarvisChipsRow}>
                  <Pressable
                    style={styles.jarvisActionChip}
                    onPress={handleStartCollab}
                  >
                    <Text style={styles.jarvisActionChipText}>Turn into Post</Text>
                  </Pressable>

                  <Pressable
                    style={styles.jarvisActionChip}
                    onPress={handleSendInvite}
                  >
                    <Text style={styles.jarvisActionChipText}>Invite Creator</Text>
                  </Pressable>

                  <Pressable
                    style={styles.jarvisActionChip}
                    onPress={handleShuffleAnotherPlan}
                  >
                    <Text style={styles.jarvisActionChipText}>🎲 Next Plan</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* CARD 6: CREATOR INVOLVED */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardHeaderTitle}>CREATOR INVOLVED</Text>

              <View style={styles.creatorInvolvedRow}>
                <Image source={partnerAvatar} style={styles.creatorInvolvedAvatar} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.creatorInvolvedName}>{partnerName}</Text>
                    <View style={styles.verifiedCheckPill}>
                      <Text style={styles.verifiedCheckText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.creatorInvolvedNiche}>{partnerNiche}</Text>
                  <View style={styles.creatorInvolvedBadges}>
                    <Text style={styles.creatorInvolvedBadgeText}>⚡ 52d streak</Text>
                    <Text style={styles.creatorInvolvedBadgeText}>• ⭐ 110k reach</Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.viewProfileBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalAnim();
                  setShowProfileModal(true);
                }}
              >
                <Text style={styles.viewProfileBtnText}>View Profile</Text>
              </Pressable>
            </View>

            {/* CARD 7: FORMAT & PLATFORMS (TWO COLUMNS) */}
            <View style={styles.twoColRow}>
              {/* Format Box */}
              <View style={styles.halfColBox}>
                <Text style={styles.halfColLabel}>FORMAT</Text>
                <Text style={styles.halfColMainText}>{currentPlan.format}</Text>
                <Text style={styles.halfColSubText}>{currentPlan.formatSub}</Text>
                <View style={styles.recommendedPill}>
                  <Text style={styles.recommendedPillText}>RECOMMENDED</Text>
                </View>
              </View>

              {/* Platforms Box */}
              <View style={styles.halfColBox}>
                <Text style={styles.halfColLabel}>PLATFORMS</Text>
                {[
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'reels', label: 'IG Reel' },
                  { id: 'shorts', label: 'YT Shorts' },
                ].map((plat) => {
                  const isChecked = selectedPlatforms.includes(plat.id);
                  return (
                    <Pressable
                      key={plat.id}
                      style={styles.platCheckboxRow}
                      onPress={() => handleTogglePlatform(plat.id)}
                    >
                      <View style={[styles.platRadioCircle, isChecked && styles.platRadioCircleActive]}>
                        {isChecked && <View style={styles.platRadioDot} />}
                      </View>
                      <Text style={styles.platLabelText}>{plat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* CARD 8: SUGGESTED SCHEDULE (DYNAMIC PALETTE & SYNCED TIMES) */}
            <LinearGradient
              colors={['#FAF8FE', '#F5F0FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scheduleCard}
            >
              <View style={styles.scheduleHeaderRow}>
                <Text style={styles.scheduleHeaderTitle}>SUGGESTED SCHEDULE</Text>
                <View style={styles.scheduleCalendarIconBadge}>
                  <Text style={{ fontSize: 13 }}>📅</Text>
                </View>
              </View>

              <View style={styles.scheduleItemRow}>
                <Text style={styles.scheduleItemLabel}>Planning</Text>
                <Text style={styles.scheduleItemTime}>{selectedPlanningTime}</Text>
              </View>

              <View style={styles.scheduleItemDivider} />

              <View style={styles.scheduleItemRow}>
                <Text style={styles.scheduleItemLabel}>Filming</Text>
                <Text style={styles.scheduleItemTime}>{selectedFilmingTime}</Text>
              </View>

              <View style={styles.scheduleItemDivider} />

              <View style={styles.scheduleItemRow}>
                <Text style={[styles.scheduleItemLabel, { color: '#582CDB', fontWeight: '800' }]}>Publishing</Text>
                <View style={styles.peakSlotBadge}>
                  <Text style={styles.peakSlotBadgeText}>
                    ⚡ {currentPublishingSlot.time} ({currentPublishingSlot.multiplier} Peak)
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.adjustScheduleBtn, pressed && styles.btnPressed]}
                onPress={handleOpenScheduleModal}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.adjustScheduleGradient}
                >
                  <Text style={styles.adjustScheduleBtnText}>Adjust Schedule &amp; Rate Meter ›</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>

            {/* CARD 9: IMPACT SCORE */}
            <View style={styles.impactCard}>
              <View style={styles.impactHeaderRow}>
                <Text style={styles.impactHeaderTitle}>IMPACT SCORE</Text>
                <Text style={styles.impactHighBadge}>⚡ High</Text>
              </View>

              <View style={styles.impactItemRow}>
                <Text style={styles.impactGreenCheck}>🟢</Text>
                <Text style={styles.impactItemText}>Protects 47-day streak</Text>
              </View>

              <View style={styles.impactItemRow}>
                <Text style={styles.impactPurpleCheck}>🟣</Text>
                <Text style={styles.impactItemText}>Earns Creator Passport XP</Text>
              </View>

              <View style={styles.impactProgressHeader}>
                <Text style={styles.impactProgressLabel}>Goal Completion</Text>
                <Text style={styles.impactProgressVal}>85%</Text>
              </View>

              <View style={styles.impactProgressTrack}>
                <View style={styles.impactProgressFill} />
              </View>
            </View>

            {/* 10. PRIMARY BOTTOM ACTIONS */}
            <View style={styles.bottomActionBar}>
              <Pressable
                style={({ pressed }) => [styles.startCollabBtn, pressed && styles.btnPressed]}
                onPress={handleStartCollab}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startCollabGradient}
                >
                  <Text
                    numberOfLines={1}
                    style={styles.startCollabBtnText}
                  >
                    Start Collaboration
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.inviteBtn, pressed && styles.btnPressed]}
                onPress={handleSendInvite}
              >
                <Text style={styles.inviteBtnText} numberOfLines={1}>Invite</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveBookmarkBtn,
                  isSaved && styles.saveBookmarkBtnActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleToggleSave}
                hitSlop={8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill={isSaved ? '#582CDB' : 'none'}>
                  <Path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    stroke="#582CDB"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>

            {/* Spacing for floating tab bar */}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
          <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

          {/* ========================================================================= */}
          {/* MODAL: INTERACTIVE SCHEDULE ADJUSTER & REAL-TIME VIRAL RATE METER */}
          {/* ========================================================================= */}
          <Modal
            visible={showScheduleModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowScheduleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>Collab Schedule &amp; Rate Meter</Text>
                    <Text style={styles.modalSubtitle}>Adjust filming &amp; find your optimal viral window</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowScheduleModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                  {/* REAL-TIME VIRAL REACH RATE METER */}
                  <LinearGradient
                    colors={['#FAF5FF', '#EDE9FE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rateMeterCard}
                  >
                    <View style={styles.rateMeterHeader}>
                      <View>
                        <Text style={styles.rateMeterLabel}>AUDIENCE VIRAL RATE</Text>
                        <Text style={styles.rateMeterLevelText}>{activeModalSlot.level}</Text>
                      </View>
                      <View style={styles.rateScoreBadge}>
                        <Text style={styles.rateScoreNum}>{activeModalSlot.score}%</Text>
                        <Text style={styles.rateMultiplierText}>{activeModalSlot.multiplier} Reach</Text>
                      </View>
                    </View>

                    {/* Animated Progress Gauge Bar */}
                    <View style={styles.gaugeTrack}>
                      <View
                        style={[
                          styles.gaugeFill,
                          {
                            width: `${activeModalSlot.score}%`,
                            backgroundColor:
                              activeModalSlot.score >= 90
                                ? '#7C3AED'
                                : activeModalSlot.score >= 75
                                ? '#3B82F6'
                                : '#F59E0B',
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.gaugeLabelsRow}>
                      <Text style={styles.gaugeMicroLabel}>50% Quiet</Text>
                      <Text style={styles.gaugeMicroLabel}>75% Active</Text>
                      <Text style={[styles.gaugeMicroLabel, { color: '#6D28D9', fontWeight: '800' }]}>
                        98% Viral Peak 🔥
                      </Text>
                    </View>

                    <Text style={styles.gaugeInsightText}>
                      💡 {activeModalSlot.desc}
                    </Text>
                  </LinearGradient>

                  {/* 1. SELECT PUBLISHING TIME (AFFECTS RATE METER) */}
                  <Text style={styles.slotGroupTitle}>1. CHOOSE CO-POST PUBLISHING TIME</Text>
                  <View style={styles.slotsGrid}>
                    {PUBLISHING_SLOTS.map((slot) => {
                      const isSelected = modalSlotId === slot.id;
                      const isPeak = slot.score >= 90;
                      return (
                        <Pressable
                          key={slot.id}
                          onPress={() => handleSelectModalSlot(slot)}
                          style={[
                            styles.slotItemBox,
                            isSelected && styles.slotItemBoxSelected,
                            isPeak && !isSelected && styles.slotItemBoxPeak,
                          ]}
                        >
                          <View style={styles.slotItemTop}>
                            <Text
                              style={[
                                styles.slotItemTimeText,
                                isSelected && styles.slotItemTimeTextSelected,
                              ]}
                            >
                              {slot.time}
                            </Text>
                            {isPeak && (
                              <View style={styles.peakFireBadge}>
                                <Text style={styles.peakFireBadgeText}>🔥 PEAK</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.slotItemTagText, isSelected && { color: '#FFFFFF' }]}>
                            {slot.score}% • {slot.multiplier}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* 2. PLANNING TIME SELECTOR */}
                  <Text style={styles.slotGroupTitle}>2. PLANNING SLOT (TODAY)</Text>
                  <View style={styles.horizontalChipsRow}>
                    {PLANNING_OPTIONS.map((time) => {
                      const isSelected = modalPlanningTime === time;
                      return (
                        <Pressable
                          key={time}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setModalPlanningTime(time);
                          }}
                          style={[
                            styles.scheduleSelectChip,
                            isSelected && styles.scheduleSelectChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.scheduleSelectChipText,
                              isSelected && styles.scheduleSelectChipTextActive,
                            ]}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* 3. FILMING WINDOW (LAGOS GMT+1) */}
                  <Text style={styles.slotGroupTitle}>3. FILMING WINDOW (LAGOS GMT+1)</Text>
                  <View style={styles.horizontalChipsRow}>
                    {FILMING_OPTIONS.map((time) => {
                      const isSelected = modalFilmingTime === time;
                      return (
                        <Pressable
                          key={time}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setModalFilmingTime(time);
                          }}
                          style={[
                            styles.scheduleSelectChip,
                            isSelected && styles.scheduleSelectChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.scheduleSelectChipText,
                              isSelected && styles.scheduleSelectChipTextActive,
                            ]}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Confirm Button */}
                <Pressable
                  style={styles.modalFullBtn}
                  onPress={handleConfirmSchedule}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalFullBtnGradient}
                  >
                    <Text style={styles.modalFullBtnText}>
                      Apply {activeModalSlot.time} Schedule ({activeModalSlot.multiplier}) ➔
                    </Text>
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

          {/* MODAL: NOTIFICATIONS CENTER */}
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
                    <Text style={styles.modalSubtitle}>Collab updates &amp; creator alerts</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowNotificationModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
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
                  <LinearGradient
                    colors={['#7C3AED', '#582CDB']}
                    style={styles.modalFullBtnGradient}
                  >
                    <Text style={styles.modalFullBtnText}>Mark All Read &amp; Close</Text>
                  </LinearGradient>
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
            xpEarned={50}
            streakCount={47}
            actionText="Keep Editing ➔"
            onDismiss={() => {
              setShowCelebrationModal(false);
            }}
          />
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 135,
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
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 40,
    height: 40,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // Top Pill Badges & Another Plan Button
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  badgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collabIdeaPill: {
    backgroundColor: '#7C3AED',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  collabIdeaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planCounterPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4.5,
    paddingHorizontal: 9,
    borderRadius: 100,
  },
  planCounterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  doAnotherPlanTopBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  doAnotherPlanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 4,
    marginTop: 4,
  },
  mainSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },

  // Card 1: Overview Card
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  overviewTitle: {
    flex: 1,
    fontSize: 17.5,
    fontWeight: '700',
    color: '#171420',
  },
  cardCycleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 12,
  },
  overviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  goalHighlightBox: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 3.5,
    borderLeftColor: '#7C3AED',
    borderRadius: 12,
    padding: 12,
  },
  goalHighlightText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
    lineHeight: 18,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionCardHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Stepper Styles
  stepperContainer: {
    paddingLeft: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    minHeight: 34,
  },
  stepperLineCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  stepperDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#582CDB',
    marginTop: 3,
  },
  stepperVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD6FE',
    marginVertical: 2,
  },
  stepperTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  stepperStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 18,
  },

  // Roles Grid
  rolesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  roleColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roleUserIcon: {
    fontSize: 14,
  },
  roleUserTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  roleBulletText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 3,
  },

  // Caption Starter
  captionStarterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  captionQuoteBox: {
    backgroundColor: '#FAF8FE',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  captionInput: {
    fontSize: 13,
    color: '#171420',
    lineHeight: 19,
    minHeight: 60,
  },
  useCaptionBtn: {
    height: 40,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useCaptionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Jarvis Suggestion Card
  jarvisSuggestionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  jarvisSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jarvisSuggestionFlame: {
    width: 20,
    height: 20,
  },
  jarvisSuggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  jarvisSuggestionBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  jarvisActionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  jarvisActionChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Creator Involved
  creatorInvolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  creatorInvolvedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  creatorInvolvedName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  verifiedCheckPill: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorInvolvedNiche: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  creatorInvolvedBadges: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  creatorInvolvedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  viewProfileBtn: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Two Column Format & Platforms
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  halfColBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    justifyContent: 'space-between',
  },
  halfColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  halfColMainText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  halfColSubText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  recommendedPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  platCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  platRadioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platRadioCircleActive: {
    borderColor: '#582CDB',
  },
  platRadioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  platLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },

  // Suggested Schedule Card (Premium Royal Lavender & Purple Palette)
  scheduleCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.8,
  },
  scheduleCalendarIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  scheduleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  scheduleItemDivider: {
    height: 1,
    backgroundColor: 'rgba(221, 214, 254, 0.4)',
    marginVertical: 2,
  },
  scheduleItemLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  scheduleItemTime: {
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '700',
  },
  peakSlotBadge: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  peakSlotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  adjustScheduleBtn: {
    height: 42,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  adjustScheduleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustScheduleBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Impact Score Card
  impactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 16,
  },
  impactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  impactHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  impactHighBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  impactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  impactGreenCheck: {
    fontSize: 10,
  },
  impactPurpleCheck: {
    fontSize: 10,
  },
  impactItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  impactProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  impactProgressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  impactProgressVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  impactProgressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  impactProgressFill: {
    width: '85%',
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },

  // Bottom Floating Action Bar
  bottomActionBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    width: '100%',
  },
  startCollabBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  startCollabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  startCollabBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  inviteBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#582CDB',
    textAlign: 'center',
  },
  saveBookmarkBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  saveBookmarkBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },

  // Modals & Rate Meter
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
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
  modalCardLarge: {
    width: '100%',
    maxWidth: 400,
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
    fontSize: 16.5,
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

  rateMeterCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    padding: 14,
    marginBottom: 16,
  },
  rateMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  rateMeterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.6,
  },
  rateMeterLevelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginTop: 2,
  },
  rateScoreBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'flex-end',
  },
  rateScoreNum: {
    fontSize: 17,
    fontWeight: '700',
    color: '#582CDB',
  },
  rateMultiplierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gaugeMicroLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  gaugeInsightText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },

  slotGroupTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 2,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  slotItemBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 10,
  },
  slotItemBoxSelected: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  slotItemBoxPeak: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  slotItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slotItemTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  slotItemTimeTextSelected: {
    color: '#FFFFFF',
  },
  peakFireBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  peakFireBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  slotItemTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  horizontalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  scheduleSelectChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  scheduleSelectChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  scheduleSelectChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scheduleSelectChipTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  modalFullBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  modalFullBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  profileModalInner: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileModalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
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
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginTop: 10,
  },
  profileStreakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  notifCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F2EC',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  notifBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});
