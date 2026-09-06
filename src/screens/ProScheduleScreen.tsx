import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Image,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { ProNotificationsModal, ProNotificationItem, DEFAULT_PRO_NOTIFICATIONS } from '../components/ProNotificationsModal';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { PurpleGoldSwitch } from '../components/PurpleGoldSwitch';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProScheduleScreenProps {
  onBack?: () => void;
  onStartMission?: () => void;
  onOpenPostComposer?: (title?: string, platform?: string) => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: (threadId?: string) => void;
  onOpenCreateIdea?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface CalendarDay {
  dayName: string;
  dayNum: number;
  monthName: string;
  fullDateStr: string;
  dotsCount: number;
  isToday?: boolean;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const getDynamicWeekData = () => {
  const now = new Date();
  const baseDate = new Date(now.getFullYear() === 2026 ? now : new Date(2026, 8, 5));
  const currentDayOfWeek = baseDate.getDay(); // 0 = Sun ... 6 = Sat

  // 7-day week starting on Sunday
  const sunday = new Date(baseDate);
  sunday.setDate(baseDate.getDate() - currentDayOfWeek);

  const days: CalendarDay[] = [];
  let todayIndex = currentDayOfWeek;

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const isToday =
      d.getDate() === baseDate.getDate() &&
      d.getMonth() === baseDate.getMonth() &&
      d.getFullYear() === baseDate.getFullYear();

    if (isToday) {
      todayIndex = i;
    }

    days.push({
      dayName: DAY_NAMES_SHORT[d.getDay()],
      dayNum: d.getDate(),
      monthName: MONTH_NAMES_SHORT[d.getMonth()],
      fullDateStr: `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`,
      dotsCount: isToday ? 2 : (i % 2 === 0 ? 1 : 2),
      isToday,
    });
  }

  const startDay = days[0];
  const endDay = days[6];
  let rangeLabel = '';
  if (startDay.monthName === endDay.monthName) {
    const monthFull = MONTH_NAMES_FULL[MONTH_NAMES_SHORT.indexOf(startDay.monthName)];
    rangeLabel = `${monthFull} ${startDay.dayNum} – ${endDay.dayNum}`;
  } else {
    const startFull = MONTH_NAMES_FULL[MONTH_NAMES_SHORT.indexOf(startDay.monthName)];
    const endFull = MONTH_NAMES_FULL[MONTH_NAMES_SHORT.indexOf(endDay.monthName)];
    rangeLabel = `${startFull} ${startDay.dayNum} – ${endFull} ${endDay.dayNum}`;
  }

  return { days, rangeLabel, todayIndex, baseDate };
};

interface StrategyItem {
  id: string;
  icon: string;
  title: string;
  tag: string;
  body: string;
}

const JARVIS_STRATEGIES: StrategyItem[] = [
  {
    id: 'strat_1',
    icon: '⚡',
    title: 'Peak Velocity Window (7:15 – 7:45 PM)',
    tag: 'ALGORITHM TIMING • +2.4X REACH',
    body: 'Wednesday and Friday evening algorithms favor early watch-time velocity. Schedule your 45-second Reels at 7:30 PM to trigger the discovery explore page.',
  },
  {
    id: 'strat_2',
    icon: '🎬',
    title: 'Contrarian Hook Architecture',
    tag: 'RETENTION RETENTION • 96% AUDIENCE FIT',
    body: 'Start with "Why 90% of creators fail by Month 2" rather than an intro. Cuts initial 3-second dropoff by 42% on TikTok and Instagram Reels.',
  },
  {
    id: 'strat_3',
    icon: '🚀',
    title: 'Multi-Sync Cascade Pacing',
    tag: 'DISTRIBUTION MULTIPLIER',
    body: 'Publish your 9:16 video to Instagram and TikTok simultaneously, then release the YouTube Shorts breakdown 2 hours later to maximize multi-channel reach.',
  },
  {
    id: 'strat_4',
    icon: '🤝',
    title: 'Pre-Release Squad Engagement',
    tag: 'DUEL BOOST • +750 XP',
    body: 'Notify your squad (Elena & Amara) 15 minutes before your post goes live to secure initial high-retention comments and fuel viral reach.',
  },
];

interface FullQueueItem {
  id: string;
  title: string;
  platformLabel: string;
  time: string;
  period: string;
  dayLabel: string;
  status: 'AUTOPILOT' | 'READY' | 'QUEUED';
  score: string;
  iconType: 'tiktok' | 'instagram' | 'youtube' | 'threads';
}

const generateInitialFullQueue = (baseDate: Date): FullQueueItem[] => {
  const getRelativeDayLabel = (offsetDays: number) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offsetDays);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    const shortMonth = MONTH_NAMES_SHORT[d.getMonth()];
    if (offsetDays === 1) {
      return `Tomorrow (${dayOfWeek.slice(0, 3)}, ${shortMonth} ${d.getDate()})`;
    }
    return `${dayOfWeek} (${shortMonth} ${d.getDate()})`;
  };

  return [
    {
      id: 'q1',
      title: 'Shorts Insight: Why 90% of creators fail by Month 2',
      platformLabel: '▶ Shorts',
      time: '10:00',
      period: 'AM',
      dayLabel: getRelativeDayLabel(1),
      status: 'AUTOPILOT',
      score: '96% Audience Fit',
      iconType: 'youtube',
    },
    {
      id: 'q2',
      title: 'Instagram Carousel: The 1 iPhone 4K Recording Setup',
      platformLabel: '📸 IG Reel',
      time: '06:00',
      period: 'PM',
      dayLabel: getRelativeDayLabel(2),
      status: 'READY',
      score: '94% Audience Fit',
      iconType: 'instagram',
    },
    {
      id: 'q3',
      title: 'TikTok Duet: Unpopular truth about the 2026 algorithm',
      platformLabel: '≈ TikTok',
      time: '05:30',
      period: 'PM',
      dayLabel: getRelativeDayLabel(3),
      status: 'AUTOPILOT',
      score: '98% Audience Fit',
      iconType: 'tiktok',
    },
    {
      id: 'q4',
      title: 'YouTube Short: How I batch-film 10 videos in 2 hours',
      platformLabel: '▶ Shorts',
      time: '02:00',
      period: 'PM',
      dayLabel: getRelativeDayLabel(4),
      status: 'QUEUED',
      score: '91% Audience Fit',
      iconType: 'youtube',
    },
    {
      id: 'q5',
      title: 'Threads Take: 5 tools that automate my content pipeline',
      platformLabel: '🧵 Threads',
      time: '09:30',
      period: 'AM',
      dayLabel: getRelativeDayLabel(5),
      status: 'AUTOPILOT',
      score: '95% Audience Fit',
      iconType: 'threads',
    },
    {
      id: 'q6',
      title: 'Instagram Reel: Behind the scenes of my video workflow',
      platformLabel: '📸 IG Reel',
      time: '07:30',
      period: 'PM',
      dayLabel: getRelativeDayLabel(6),
      status: 'READY',
      score: '96% Audience Fit',
      iconType: 'instagram',
    },
  ];
};

interface ScheduleItem {
  id: string;
  time: string;
  period: string;
  title: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'threads';
  platformLabel: string;
  badgeType: 'scheduled' | 'recommended' | 'draft';
  dayIndex: number;
}

const parseTimeToMinutes = (timeStr: string, period: string): number => {
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  const p = (period || '').toUpperCase().trim();

  if (p === 'PM' && hours < 12) {
    hours += 12;
  } else if (p === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const sortScheduleItemsChronologically = (items: ScheduleItem[]): ScheduleItem[] => {
  return [...items].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) {
      return a.dayIndex - b.dayIndex;
    }
    const minA = parseTimeToMinutes(a.time, a.period);
    const minB = parseTimeToMinutes(b.time, b.period);
    return minA - minB;
  });
};

const generateInitialScheduleItems = (todayIndex: number): ScheduleItem[] => {
  return [
    {
      id: 'sch_1',
      time: '10:00',
      period: 'AM',
      title: '5 retention rules that 10x watch time',
      platform: 'youtube',
      platformLabel: '▶ Shorts',
      badgeType: 'scheduled',
      dayIndex: todayIndex,
    },
    {
      id: 'sch_2',
      time: '11:30',
      period: 'AM',
      title: '3 creator mistakes I stopped making this year',
      platform: 'tiktok',
      platformLabel: '≈ TikTok',
      badgeType: 'scheduled',
      dayIndex: todayIndex,
    },
    {
      id: 'sch_3',
      time: '6:00',
      period: 'PM',
      title: 'Step-by-step editing workflow in CapCut',
      platform: 'instagram',
      platformLabel: '📸 IG Reel',
      badgeType: 'scheduled',
      dayIndex: todayIndex,
    },
    {
      id: 'sch_4',
      time: '7:30',
      period: 'PM',
      title: 'Personal lesson Reel • Behind the scenes studio',
      platform: 'instagram',
      platformLabel: '📸 IG Reel',
      badgeType: 'recommended',
      dayIndex: todayIndex,
    },
  ];
};

const GAP_SUGGESTIONS = [
  {
    id: 'gap_1',
    angle: 'Contrarian Take',
    angleIcon: '🔥',
    score: '⚡ 98% Fit',
    title: 'Most creators fail at X because they optimize for reach before retention',
    format: 'Short Reel • High Comment Velocity',
    platform: 'instagram',
    platformLabel: 'Instagram Reel',
    hashtags: '#creatortips #mindset #consistency',
  },
  {
    id: 'gap_2',
    angle: 'Behind-the-Scenes',
    angleIcon: '🎬',
    score: '⚡ 95% Fit',
    title: 'How I built my production workflow in 48 hours without burning out',
    format: 'Breakdown Carousel • High Saves & Shares',
    platform: 'instagram',
    platformLabel: 'Instagram Carousel',
    hashtags: '#creatorsetup #workflow #efficiency',
  },
  {
    id: 'gap_3',
    angle: 'Actionable Framework',
    angleIcon: '🛠️',
    score: '⚡ 92% Fit',
    title: '3 metrics you must track daily if you want consistent inbound growth',
    format: 'Step-by-Step Thread • High Bookmarks',
    platform: 'x',
    platformLabel: 'X Thread',
    hashtags: '#growthstrategy #analytics #scaling',
  },
];

export const ProScheduleScreen: React.FC<ProScheduleScreenProps> = ({
  onBack,
  onStartMission,
  onOpenPostComposer,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenCreateIdea,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const weekData = useMemo(() => getDynamicWeekData(), []);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(weekData.todayIndex);
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(() =>
    generateInitialScheduleItems(weekData.todayIndex)
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<ProNotificationItem[]>(DEFAULT_PRO_NOTIFICATIONS);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const [showSchedulePostModal, setShowSchedulePostModal] = useState(false);
  const [showExpandViewModal, setShowExpandViewModal] = useState(false);
  const [showFullQueueModal, setShowFullQueueModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showAudienceFitModal, setShowAudienceFitModal] = useState(false);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>(['strat_1', 'strat_2']);
  const [fullQueueList, setFullQueueList] = useState<FullQueueItem[]>(() =>
    generateInitialFullQueue(weekData.baseDate)
  );
  const [selectedQueueFilter, setSelectedQueueFilter] = useState('ALL');
  const [showFillGapModal, setShowFillGapModal] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<ScheduleItem | null>(null);
  // Advanced Edit Modal States
  const [editingPostTitle, setEditingPostTitle] = useState('');
  const [editingPostPlatform, setEditingPostPlatform] = useState('📸 IG Reel');
  const [editingPostTime, setEditingPostTime] = useState('07:30');
  const [editingPostPeriod, setEditingPostPeriod] = useState('PM');
  const [editingPostHashtags, setEditingPostHashtags] = useState('#CreatorGrowth #ViralReels #PostStreak');
  const [autopilotEnabled, setAutopilotEnabled] = useState<boolean>(true);
  const [showAutopilotModal, setShowAutopilotModal] = useState<boolean>(false);
  const [savedAutopilotMode, setSavedAutopilotMode] = useState<'recommend' | 'schedule' | 'autopost'>('schedule');
  const [autopilotMode, setAutopilotMode] = useState<'recommend' | 'schedule' | 'autopost'>('schedule');

  // Dynamic Operating Dashboard Calculations
  const TARGET_WEEKLY_SLOTS = 7;
  const scheduledCount = scheduleList.length;
  const draftsCount = 2;
  const postedCount = 1;
  const openSlotsCount = Math.max(0, TARGET_WEEKLY_SLOTS - (scheduledCount + postedCount));
  const planCompletionPct = Math.min(
    100,
    Math.round(((postedCount + scheduledCount) / TARGET_WEEKLY_SLOTS) * 100)
  );

  // Completion Animation State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    title: 'Post Scheduled!',
    subtitle: 'Locked into your 7:30 PM peak window. 52-Day Streak protected!',
    badgeText: 'SCHEDULED',
    xpEarned: 50,
    speechBubble: 'Boom! Peak window secured!',
  });

  // Form states: Schedule Post
  const [postTitleInput, setPostTitleInput] = useState('');
  const [postTimeInput, setPostTimeInput] = useState('7:30 PM (Peak)');
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'threads'>('instagram');
  const [hashtagsInput, setHashtagsInput] = useState('#creatortips #growth #buildinpublic');

  // Form states: Fill Gap
  const [selectedGapIndex, setSelectedGapIndex] = useState<number>(0);
  const [editableGapTitle, setEditableGapTitle] = useState(GAP_SUGGESTIONS[0].title);
  const [editableGapTime, setEditableGapTime] = useState('7:30 PM (Peak)');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

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

  const triggerModalPop = () => {
    modalPopScale.setValue(0.92);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmSchedulePost = () => {
    if (!postTitleInput.trim()) {
      showToast('Please enter a content title or hook');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newItem: ScheduleItem = {
      id: `sch_${Date.now()}`,
      time: postTimeInput.split(' ')[0] || '7:30',
      period: postTimeInput.includes('AM') ? 'AM' : 'PM',
      title: postTitleInput.trim(),
      platform: selectedPlatform,
      platformLabel:
        selectedPlatform === 'instagram'
          ? '📸 IG Reel'
          : selectedPlatform === 'tiktok'
          ? '≈ TikTok'
          : selectedPlatform === 'youtube'
          ? '▶ Shorts'
          : '🧵 Threads',
      badgeType: 'scheduled',
      dayIndex: selectedDayIndex,
    };

    setScheduleList((prev) => [newItem, ...prev]);
    setShowSchedulePostModal(false);
    setPostTitleInput('');

    // Trigger 3D Ghost Celebration Animation
    setCompletionData({
      title: 'Post Scheduled on Autopilot!',
      subtitle: `Locked into ${newItem.platformLabel} at ${newItem.time} ${newItem.period}. 52-Day Streak protected!`,
      badgeText: 'SCHEDULED',
      xpEarned: 50,
      speechBubble: 'Boom! Peak window secured!',
    });
    setTimeout(() => {
      setShowCompletionModal(true);
    }, 300);
  };

  const handleConfirmFillGap = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newItem: ScheduleItem = {
      id: `sch_gap_${Date.now()}`,
      time: editableGapTime.split(' ')[0] || '7:30',
      period: 'PM',
      title: editableGapTitle,
      platform: 'instagram',
      platformLabel: '📸 IG Reel',
      badgeType: 'recommended',
      dayIndex: selectedDayIndex,
    };

    setScheduleList((prev) => [newItem, ...prev]);
    setShowFillGapModal(false);

    // Trigger 3D Ghost Celebration Animation
    setCompletionData({
      title: 'Content Gap Resolved!',
      subtitle: 'Your Friday 7:30 PM slot is filled with high-retention storytelling.',
      badgeText: 'GAP FILLED',
      xpEarned: 75,
      speechBubble: 'Your streak momentum is unstoppable!',
    });
    setTimeout(() => {
      setShowCompletionModal(true);
    }, 300);
  };

  // Filter items for selected day, strictly sorted chronologically
  const displayedItems = useMemo(() => {
    const filtered = scheduleList.filter(
      (item) => item.dayIndex === selectedDayIndex
    );
    return sortScheduleItemsChronologically(filtered);
  }, [scheduleList, selectedDayIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR                                            */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          {/* Top-Left: Mascot + Mode Switcher */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                colors={['#F59E0B', '#F59E0B', '#F59E0B']}
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
              {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
            </Pressable>

            {/* User Profile Avatar with Tiny Gold Check Badge */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowProfileModal(true);
              }}
              style={styles.profileAvatarWrapper}
              hitSlop={8}
            >
              {userProfile?.customAvatarUri ? (
                <Image
                  source={{ uri: userProfile.customAvatarUri }}
                  style={styles.headerUserAvatar}
                  resizeMode="cover"
                />
              ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
                <Image
                  source={userProfile.avatarSource}
                  style={styles.headerUserAvatar}
                  resizeMode="cover"
                />
              ) : (
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                    stroke="#F59E0B"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="#F59E0B"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
              <View style={styles.avatarTinyGoldCheckPos}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HEADER TAG & TITLES */}
          <View style={styles.topTitlesSection}>
            <View style={styles.contentScheduleTagBox}>
              <Text style={styles.contentScheduleTagText}>CONTENT SCHEDULE — PRO</Text>
            </View>
            <Text
              style={styles.mainTitleText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Plan your content with precision.
            </Text>
            <Text style={styles.mainSubText}>
              Manage your schedule, find content gaps, and post at your strongest times.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: WEEKLY OUTLOOK (HERO CARD)                           */}
          {/* ============================================================ */}
          <View style={styles.weeklyOutlookCard}>
            <Text style={styles.weeklyOutlookTitle}>Weekly Outlook</Text>
            <Text style={styles.weeklyOutlookRange}>{weekData.rangeLabel}</Text>

            {/* Top Action Buttons: Schedule Post & Fill Gaps */}
            <View style={styles.outlookButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.schedulePostPrimaryBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenPostComposer) {
                    onOpenPostComposer();
                  } else {
                    triggerModalPop();
                    setShowSchedulePostModal(true);
                  }
                }}
              >
                <Text style={styles.schedulePostPrimaryBtnText}>Schedule Post</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.fillGapsOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  triggerModalPop();
                  setShowFillGapModal(true);
                }}
              >
                <Text style={styles.fillGapsOutlineBtnText}>Fill Gaps</Text>
              </Pressable>
            </View>

            {/* 2x2 METRICS GRID: 2 EXPLICIT ROWS (NO WEIRD STACKING) */}
            <View style={styles.metrics2x2Container}>
              {/* Row 1 */}
              <View style={styles.metricsGridRow}>
                <Pressable
                  style={styles.metricGridTile}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    triggerModalPop();
                    setShowExpandViewModal(true);
                  }}
                >
                  <Text style={styles.metricGridLabel}>SCHEDULED</Text>
                  <Text style={styles.metricGridVal}>{scheduledCount}</Text>
                </Pressable>

                <Pressable
                  style={styles.metricGridTile}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    if (onOpenPostComposer) {
                      onOpenPostComposer('Personal lesson Reel • Behind the scenes studio', 'instagram');
                    } else {
                      showToast(`${draftsCount} drafts ready for publishing`);
                    }
                  }}
                >
                  <Text style={styles.metricGridLabel}>DRAFTS</Text>
                  <Text style={styles.metricGridVal}>{draftsCount}</Text>
                </Pressable>
              </View>

              {/* Row 2 */}
              <View style={styles.metricsGridRow}>
                <Pressable
                  style={styles.metricGridTile}
                  onPress={() => showToast(`${postedCount} post successfully published this week`)}
                >
                  <Text style={styles.metricGridLabel}>POSTED</Text>
                  <Text style={styles.metricGridVal}>{postedCount}</Text>
                </Pressable>

                <Pressable
                  style={[styles.metricGridTile, styles.metricGridTileOpenSlots]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    triggerModalPop();
                    setShowFillGapModal(true);
                  }}
                >
                  <Text style={[styles.metricGridLabel, styles.metricGridLabelOpenSlots]}>OPEN SLOTS</Text>
                  <Text style={[styles.metricGridVal, styles.metricGridValOpenSlots]}>{openSlotsCount}</Text>
                </Pressable>
              </View>
            </View>

            {/* PLAN COMPLETION PROGRESS */}
            <View style={styles.planCompletionHeaderRow}>
              <Text style={styles.planCompletionLabel}>PLAN COMPLETION</Text>
              <Text style={styles.planCompletionReadyText}>{planCompletionPct}% READY</Text>
            </View>
            <View style={styles.planCompletionProgressBarTrack}>
              <LinearGradient
                colors={['#582CDB', '#8B5CF6', '#C59B27']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.planCompletionProgressBarFill, { width: `${planCompletionPct}%` }]}
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 2: CALENDAR VIEW (7-DAY STRIP)                       */}
          {/* ============================================================ */}
          <Text style={styles.sectionSmallHeading}>CALENDAR VIEW</Text>
          <View style={styles.calendarViewStrip}>
            {weekData.days.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.dayPillCard,
                    isSelected && styles.dayPillCardSelected,
                    day.isToday && !isSelected && styles.dayPillCardToday,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedDayIndex(idx);
                  }}
                >
                  <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>
                    {day.dayNum}
                  </Text>

                  {/* Indicator Dots */}
                  <View style={styles.dayDotsRow}>
                    {isSelected ? (
                      <View style={styles.goldActiveDot} />
                    ) : (
                      Array.from({ length: day.dotsCount }).map((_, dIdx) => (
                        <View key={dIdx} style={styles.blueDot} />
                      ))
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ============================================================ */}
          {/* SECTION 3: TODAY'S / SELECTED DAY'S SCHEDULE                 */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithLink}>
            <Text style={styles.sectionHeaderTitleBold}>
              {weekData.days[selectedDayIndex]?.isToday
                ? "Today's Schedule"
                : `${weekData.days[selectedDayIndex]?.dayName}'s Schedule (${weekData.days[selectedDayIndex]?.monthName} ${weekData.days[selectedDayIndex]?.dayNum})`}
            </Text>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                triggerModalPop();
                setShowExpandViewModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.expandViewLink}>Expand View ↗</Text>
            </Pressable>
          </View>

          <View style={{ gap: 10, marginBottom: 18 }}>
            {displayedItems.length > 0 ? (
              displayedItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.scheduleItemCard,
                    item.badgeType === 'recommended' && styles.scheduleItemCardGoldBorder,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    if (onOpenPostComposer) {
                      onOpenPostComposer(item.title, item.platform);
                    } else {
                      setSelectedPostDetail(item);
                    }
                  }}
                >
                  <View style={item.badgeType === 'recommended' ? styles.timeBoxGold : styles.timeBoxPurple}>
                    <Text style={item.badgeType === 'recommended' ? styles.timeBoxGoldText : styles.timeBoxPurpleText}>
                      {item.time}
                    </Text>
                    <Text style={item.badgeType === 'recommended' ? styles.timeBoxGoldSub : styles.timeBoxPurpleSub}>
                      {item.period}
                    </Text>
                  </View>

                  <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                    <Text style={styles.scheduleItemTitle} numberOfLines={2} ellipsizeMode="tail">
                      {item.title}
                    </Text>
                    <Text style={styles.scheduleItemPlatform} numberOfLines={1}>{item.platformLabel}</Text>
                  </View>

                  <View style={item.badgeType === 'recommended' ? styles.recommendedPillBadge : styles.scheduledPillBadge}>
                    <Text style={item.badgeType === 'recommended' ? styles.recommendedPillBadgeText : styles.scheduledPillBadgeText}>
                      {item.badgeType.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyScheduleBox}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>☕</Text>
                <Text style={styles.emptyScheduleTitle}>No posts scheduled for this day</Text>
                <Pressable
                  style={styles.emptyAddPostBtn}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    if (onOpenPostComposer) {
                      onOpenPostComposer();
                    } else {
                      triggerModalPop();
                      setShowSchedulePostModal(true);
                    }
                  }}
                >
                  <Text style={styles.emptyAddPostBtnText}>+ Schedule Post</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* ============================================================ */}
          {/* SECTION 4: UPCOMING QUEUE                                    */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithLink}>
            <Text style={styles.sectionHeaderTitleBold}>Upcoming Queue</Text>
            <Pressable
              style={styles.viewFullQueuePillBtn}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                triggerModalPop();
                setShowFullQueueModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.viewFullQueuePillText}>View Full Queue</Text>
            </Pressable>
          </View>

          <View style={styles.queueContainerCard}>
            {fullQueueList.slice(0, 3).map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <View style={styles.queueItemDivider} />}
                <Pressable
                  style={styles.queueItemRow}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    if (onOpenPostComposer) {
                      onOpenPostComposer(item.title, item.iconType);
                    } else {
                      showToast(`${item.title} • ${item.time} ${item.period}`);
                    }
                  }}
                >
                  <SocialBrandIcon platform={item.iconType} size={28} />
                  <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                    <Text style={styles.queueItemTitle} numberOfLines={2} ellipsizeMode="tail">
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 3, gap: 4 }}>
                      <Text style={styles.queueItemTime}>
                        {item.dayLabel.split(' (')[0]}, {item.time} {item.period} •
                      </Text>
                      <Pressable
                        style={styles.audienceFitInlinePill}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          triggerModalPop();
                          setShowAudienceFitModal(true);
                        }}
                        hitSlop={6}
                      >
                        <Text style={styles.audienceFitInlinePillText}>
                          ⚡ {item.score} <Text style={{ fontSize: 9.5, color: '#92400E' }}>ⓘ</Text>
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.threeDotsMenu}>⋮</Text>
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          {/* ============================================================ */}
          {/* SECTION 5: AUTOPILOT: ACTIVE BANNER CARD                     */}
          {/* ============================================================ */}
          <View style={styles.autopilotBannerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={styles.autopilotSparkleSquare}>
                <Text style={{ fontSize: 16 }}>✨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.autopilotTitleText}>
                  Autopilot:{' '}
                  <Text style={{ color: autopilotEnabled ? '#582CDB' : '#64748B' }}>
                    {autopilotEnabled ? 'Active' : 'Paused'}
                  </Text>
                </Text>
                <Text style={styles.autopilotSubText}>
                  Your strongest posting windows are being prioritized.
                </Text>
              </View>
              <PurpleGoldSwitch
                value={autopilotEnabled}
                onValueChange={(val) => {
                  setAutopilotEnabled(val);
                  showToast(val ? 'Autopilot activated' : 'Autopilot paused');
                }}
              />
            </View>

            {/* 2-Column Sub Stats */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.autopilotSubTile}>
                <Text style={styles.autopilotSubTileLabel}>Scheduled</Text>
                <Text style={styles.autopilotSubTileVal}>3 Posts</Text>
              </View>
              <View style={styles.autopilotSubTile}>
                <Text style={styles.autopilotSubTileLabel}>Drafts</Text>
                <Text style={styles.autopilotSubTileVal}>2 Drafts</Text>
              </View>
            </View>

            {/* Subtle Action Link: What Autopilot manages → */}
            <Pressable
              style={({ pressed }) => [styles.autopilotManageLinkBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAutopilotMode(savedAutopilotMode);
                triggerModalPop();
                setShowAutopilotModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.autopilotManageLinkText}>What Autopilot manages →</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION 6: OPTIMAL WINDOWS & PLATFORM MIX                    */}
          {/* ============================================================ */}
          <View style={styles.analyticsSectionCard}>
            <Text style={styles.analyticsSectionTitle}>Optimal Windows</Text>

            {/* TODAY */}
            <View style={{ marginTop: 10, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.windowDayLabel}>TODAY</Text>
                <Text style={styles.windowPeakLabel}>7:30 PM • Peak</Text>
              </View>
              <View style={styles.timelineBarTrack}>
                <View style={[styles.timelinePeakBlock, { left: '70%' }]} />
              </View>
            </View>

            {/* TOMORROW */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.windowDayLabel}>TOMORROW</Text>
                <Text style={styles.windowPeakLabel}>12:00 PM • Mid</Text>
              </View>
              <View style={styles.timelineBarTrack}>
                <View style={[styles.timelinePeakBlock, { left: '45%', backgroundColor: '#A78BFA' }]} />
              </View>
            </View>

            {/* PLATFORM MIX */}
            <Text style={styles.platformMixTitle}>Platform Mix</Text>
            <View style={styles.platformMixBarContainer}>
              <View style={[styles.mixBarSegment, { flex: 35, backgroundColor: '#000000', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
              <View style={[styles.mixBarSegment, { flex: 30, backgroundColor: '#7C3AED' }]} />
              <View style={[styles.mixBarSegment, { flex: 20, backgroundColor: '#EF4444' }]} />
              <View style={[styles.mixBarSegment, { flex: 15, backgroundColor: '#0A66C2', borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
            </View>

            {/* LEGEND */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#000000' }]} />
                <Text style={styles.legendText}>TIKTOK</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                <Text style={styles.legendText}>INSTA</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>YOUTUBE</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#000000' }]} />
                <Text style={styles.legendText}>THREADS</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 7: DETECTED GAPS                                     */}
          {/* ============================================================ */}
          <Text style={styles.sectionHeaderTitleBold}>Detected Gaps</Text>
          <View style={styles.gapWarningCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={styles.gapWarningSub}>WED EVENING</Text>
                <Text style={styles.gapWarningTitle}>7:30 PM • Short Reel</Text>
              </View>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
            </View>

            {/* Action Buttons: Fill Slot & Ask Jarvis */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={({ pressed }) => [styles.fillSlotGoldBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  triggerModalPop();
                  setShowFillGapModal(true);
                }}
              >
                <LinearGradient
                  colors={['#FDE68A', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goldBtnGradient}
                >
                  <Text style={styles.fillSlotGoldBtnText}>✨ Fill Slot</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.askJarvisOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenMessages) {
                    onOpenMessages('conv_jarvis');
                  } else if (onOpenJarvisPro) {
                    onOpenJarvisPro();
                  } else {
                    showToast('Opening Jarvis AI Chatbot...');
                  }
                }}
              >
                <Text style={styles.askJarvisOutlineBtnText}>Ask Jarvis</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 8: JARVIS INSIGHT (DEEP PURPLE CARD)                 */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#3B14A7', '#582CDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.jarvisInsightCard, { marginBottom: 140 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text style={styles.jarvisInsightHeader}>Jarvis Insight</Text>
            </View>

            <Text style={styles.jarvisInsightBody}>
              Your current rhythm is strong. Fill Friday&apos;s open slot with a short personal lesson Reel to protect momentum.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.modalGoldActionBtnWrapper, { marginTop: 12 }, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                triggerModalPop();
                setShowStrategyModal(true);
              }}
            >
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGoldBtnGradient}
              >
                <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                  ✨ More Strategy Ideas ➔
                </Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </ScrollView>

        {/* ============================================================ */}
        {/* FLOATING BOTTOM TAB BAR                                      */}
        {/* ============================================================ */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (onNavigateTab) {
              onNavigateTab(tab);
            }
          }}
        />

        {/* ============================================================ */}
        {/* MODAL 1: IN-DEPTH PRO SCHEDULE POST MODAL                    */}
        {/* ============================================================ */}
        <Modal
          visible={showSchedulePostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSchedulePostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalProTagBadge}>
                    <Text style={styles.modalProTagBadgeText}>👑 PRO AUTOPILOT SCHEDULER</Text>
                  </View>
                  <Pressable onPress={() => setShowSchedulePostModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText}>Schedule High-Impact Post</Text>
                <Text style={styles.modalSubText}>
                  Tune your viral hook, select target platform, and lock in your peak audience window.
                </Text>

                {/* Viral Hook / Title Input */}
                <Text style={styles.inputLabel}>CONTENT TITLE &amp; VIRAL HOOK</Text>
                <TextInput
                  style={styles.modalTextArea}
                  placeholder="e.g. 3 creator mistakes that cost me 50k views..."
                  placeholderTextColor="#94A3B8"
                  value={postTitleInput}
                  onChangeText={setPostTitleInput}
                  multiline={true}
                  numberOfLines={2}
                />

                {/* Hook Inspiration Chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                  {[
                    '💡 "3 mistakes I stopped..."',
                    '🚀 "The 1 tool every creator..."',
                    '🔥 "Why I quit doing..."',
                  ].map((chip, cIdx) => (
                    <Pressable
                      key={cIdx}
                      style={styles.hookChip}
                      onPress={() => setPostTitleInput(chip.replace(/^[^\"]*\"|\"[^\"]*$/g, ''))}
                    >
                      <Text style={styles.hookChipText}>{chip}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Target Platform Selector */}
                <Text style={[styles.inputLabel, { marginTop: 8 }]}>TARGET PLATFORM</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {[
                    { id: 'instagram', label: '📸 IG Reel' },
                    { id: 'tiktok', label: '≈ TikTok' },
                    { id: 'youtube', label: '▶ Shorts' },
                    { id: 'threads', label: '🧵 Threads' },
                  ].map((p) => {
                    const isSelected = selectedPlatform === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        style={[styles.platformPillBtn, isSelected && styles.platformPillBtnActive]}
                        onPress={() => setSelectedPlatform(p.id as any)}
                      >
                        <Text
                          style={[styles.platformPillText, isSelected && styles.platformPillTextActive]}
                          numberOfLines={1}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Peak Time Selection */}
                <Text style={styles.inputLabel}>OPTIMAL POSTING WINDOW</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {['7:30 PM (Peak)', '12:00 PM (Mid)', '8:00 AM (Morning)'].map((t, tIdx) => {
                    const isSelected = postTimeInput === t;
                    return (
                      <Pressable
                        key={tIdx}
                        style={[styles.timeChipBtn, isSelected && styles.timeChipBtnActive]}
                        onPress={() => setPostTimeInput(t)}
                      >
                        <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Caption / Hashtags */}
                <Text style={styles.inputLabel}>HASHTAGS &amp; TOPICS</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="#creatortips #growth #buildinpublic"
                  placeholderTextColor="#94A3B8"
                  value={hashtagsInput}
                  onChangeText={setHashtagsInput}
                />

                {/* Jarvis Intelligence Banner */}
                <View style={styles.jarvisPredictionBox}>
                  <Text style={styles.jarvisPredictionTitle}>⚡ Jarvis Intelligence Score</Text>
                  <Text style={styles.jarvisPredictionSub}>
                    94% Retention Probability • Optimal 42s Duration • Expected +1.8K Organic Reach
                  </Text>
                </View>

                {/* Primary Action Button */}
                <Pressable
                  style={styles.modalPrimaryActionBtn}
                  onPress={() => {
                    setShowSchedulePostModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer(postTitleInput || 'Plan your next viral hook', selectedPlatform);
                    } else {
                      handleConfirmSchedulePost();
                    }
                  }}
                >
                  <Text style={styles.modalPrimaryActionBtnText} numberOfLines={1}>
                    🚀 Open in Post Composer (+50 XP) ➔
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowSchedulePostModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 2: JARVIS 3-HOOK STRATEGY PICKER SHEET (PRO GAP)       */}
        {/* ============================================================ */}
        <Modal
          visible={showFillGapModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFillGapModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalGoldTagBadge}>
                    <Text style={styles.modalGoldTagBadgeText}>🪄 JARVIS GAP STRATEGIST — PRO</Text>
                  </View>
                  <Pressable onPress={() => setShowFillGapModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText}>Auto-Fill Content Gap</Text>
                <Text style={styles.modalSubText}>
                  Jarvis analyzed your performance history and generated 3 high-impact pitches for this open slot. Tap any pitch to start composing immediately:
                </Text>

                {/* Detected Slot Alert Banner */}
                <View style={styles.gapSlotDetectedBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={styles.gapSlotDetectedTitle}>
                      ⚠️ {weekData.days[5]?.dayName || 'Friday'} • 7:30 PM
                    </Text>
                    <View style={styles.gapSlotAudienceBadge}>
                      <Text style={styles.gapSlotAudienceBadgeText}>🔥 Peak Window</Text>
                    </View>
                  </View>
                  <Text style={styles.gapSlotDetectedSub}>
                    High traffic slot with 0 scheduled posts. Plugging this gap protects your streak & boosts reach.
                  </Text>
                </View>

                {/* 3 Interactive AI Strategy Cards */}
                <Text style={styles.inputLabel}>CHOOSE AI STRATEGY (1-TAP TO COMPOSE)</Text>
                {GAP_SUGGESTIONS.map((sug) => {
                  return (
                    <Pressable
                      key={sug.id}
                      style={({ pressed }) => [
                        styles.gapSuggestionCard,
                        pressed && styles.gapSuggestionCardPressed,
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                        setShowFillGapModal(false);
                        if (onOpenPostComposer) {
                          onOpenPostComposer(sug.title, sug.platform);
                        }
                      }}
                    >
                      {/* Top Row: Angle & Audience Fit */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={styles.gapSugAngleBadge}>
                          <Text style={styles.gapSugAngleText}>
                            {sug.angleIcon} {sug.angle}
                          </Text>
                        </View>
                        <View style={styles.gapSugScoreBadge}>
                          <Text style={styles.gapSugScoreText}>{sug.score}</Text>
                        </View>
                      </View>

                      {/* Hook Headline */}
                      <Text style={styles.gapSugTitleText} numberOfLines={2}>
                        &ldquo;{sug.title}&rdquo;
                      </Text>

                      {/* Bottom Row: Format & Action CTA */}
                      <View style={styles.gapSugBottomRow}>
                        <Text style={styles.gapSugFormatText}>
                          {sug.platformLabel} • {sug.format}
                        </Text>
                        <Text style={styles.gapSugActionTag}>Draft Now ➔</Text>
                      </View>
                    </Pressable>
                  );
                })}

                {/* Secondary Option: Blank Post Composer */}
                <Pressable
                  style={({ pressed }) => [styles.gapBlankComposerBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowFillGapModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('', 'instagram');
                    }
                  }}
                >
                  <Text style={styles.gapBlankComposerBtnText}>✍️ Start with Blank Composer</Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowFillGapModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Dismiss</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 3: IN-DEPTH ADVANCED PRO POST EDITOR MODAL             */}
        {/* ============================================================ */}
        <Modal
          visible={selectedPostDetail !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPostDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              {selectedPostDetail && (
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={styles.modalProTagBadge}>
                      <Text style={styles.modalProTagBadgeText}>👑 ADVANCED PRO POST EDITOR</Text>
                    </View>
                    <Pressable onPress={() => setSelectedPostDetail(null)} hitSlop={8}>
                      <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.modalTitleText}>Edit Scheduled Post</Text>
                  <Text style={styles.modalSubText}>
                    Refine your content title, change platforms, adjust exact peak timing, and customize AI retention hooks.
                  </Text>

                  {/* 1. CONTENT TITLE / VIRAL HOOK */}
                  <Text style={styles.inputLabel}>CONTENT TITLE / VIRAL HOOK</Text>
                  <TextInput
                    style={styles.modalTextArea}
                    placeholder="Enter post hook..."
                    placeholderTextColor="#94A3B8"
                    value={editingPostTitle}
                    onChangeText={setEditingPostTitle}
                    multiline={true}
                    numberOfLines={3}
                  />

                  {/* Quick Hook Suggestions */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                    {[
                      '💡 "Why 90% fail at..."',
                      '🚀 "The 1 tool every..."',
                      '🔥 "Stop doing this..."',
                      '📈 "How I scaled to..."',
                    ].map((hook, hIdx) => (
                      <Pressable
                        key={hIdx}
                        style={styles.hookChip}
                        onPress={() => setEditingPostTitle(hook.replace(/^[^\w"]+/, '').replace(/"/g, ''))}
                      >
                        <Text style={styles.hookChipText}>{hook}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* 2. TARGET PLATFORM */}
                  <Text style={styles.inputLabel}>TARGET PLATFORM</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    {['📸 IG Reel', '≈ TikTok', '▶ Shorts', '🧵 Threads'].map((plat) => (
                      <Pressable
                        key={plat}
                        style={[
                          styles.platformPillBtn,
                          editingPostPlatform === plat && styles.platformPillBtnActive,
                        ]}
                        onPress={() => setEditingPostPlatform(plat)}
                      >
                        <Text
                          style={[
                            styles.platformPillText,
                            editingPostPlatform === plat && styles.platformPillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {plat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* 3. OPTIMAL POSTING TIME */}
                  <Text style={styles.inputLabel}>PEAK TIME WINDOW</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {[
                      { time: '07:30', period: 'PM', label: '7:30 PM (Peak)' },
                      { time: '12:00', period: 'PM', label: '12:00 PM (Mid)' },
                      { time: '08:00', period: 'AM', label: '8:00 AM (Morning)' },
                    ].map((slot) => {
                      const isSelected = editingPostTime === slot.time && editingPostPeriod === slot.period;
                      return (
                        <Pressable
                          key={slot.label}
                          style={[styles.platformPillBtn, isSelected && styles.platformPillBtnActive]}
                          onPress={() => {
                            setEditingPostTime(slot.time);
                            setEditingPostPeriod(slot.period);
                          }}
                        >
                          <Text style={[styles.platformPillText, isSelected && styles.platformPillTextActive]}>
                            {slot.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* 4. HASHTAGS & CAPTION TAGS */}
                  <Text style={styles.inputLabel}>HASHTAGS & TAGS</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter hashtags..."
                    placeholderTextColor="#94A3B8"
                    value={editingPostHashtags}
                    onChangeText={setEditingPostHashtags}
                  />

                  {/* 5. JARVIS INTELLIGENCE RATING */}
                  <View style={styles.jarvisPredictionBox}>
                    <Text style={styles.jarvisPredictionTitle}>⚡ JARVIS RETENTION SCORE: 96%</Text>
                    <Text style={styles.jarvisPredictionSub}>
                      Optimized for evening algorithm velocity • Expected +2.4K Organic Reach
                    </Text>
                  </View>

                  {/* 6. SAVE & ACTIONS */}
                  <View style={{ gap: 8, marginTop: 14 }}>
                    {/* Primary Save Button */}
                    <Pressable
                      style={({ pressed }) => [styles.modalGoldActionBtnWrapper, pressed && styles.btnPressed]}
                      onPress={() => {
                        const updatedTitle = editingPostTitle.trim() || selectedPostDetail.title;
                        // Update in scheduleList
                        setScheduleList((prev) =>
                          prev.map((item) =>
                            item.id === selectedPostDetail.id
                              ? {
                                  ...item,
                                  title: updatedTitle,
                                  platformLabel: editingPostPlatform,
                                  time: editingPostTime,
                                  period: editingPostPeriod,
                                }
                              : item
                          )
                        );
                        setSelectedPostDetail(null);

                        if (Platform.OS !== 'web') {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        setCompletionData({
                          title: 'Post Details Updated!',
                          subtitle: `"${updatedTitle}" scheduled for ${editingPostTime} ${editingPostPeriod} on ${editingPostPlatform}.`,
                          badgeText: '👑 PRO SCHEDULE UPDATED',
                          xpEarned: 25,
                          speechBubble: 'All changes synchronized to your Autopilot queue!',
                        });
                        setTimeout(() => {
                          setShowCompletionModal(true);
                        }, 200);
                      }}
                    >
                      <LinearGradient
                        colors={['#FDE68A', '#F59E0B', '#D97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalGoldBtnGradient}
                      >
                        <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                          ✨ Save Changes (+25 XP) ➔
                        </Text>
                      </LinearGradient>
                    </Pressable>

                    {/* Secondary: Open in Full Post Composer */}
                    <Pressable
                      style={({ pressed }) => [styles.modalSecondaryOutlineBtn, pressed && styles.btnPressed]}
                      onPress={() => {
                        const titleToOpen = editingPostTitle.trim() || selectedPostDetail.title;
                        setSelectedPostDetail(null);
                        if (onOpenPostComposer) {
                          onOpenPostComposer(titleToOpen);
                        } else if (onStartMission) {
                          onStartMission();
                        }
                      }}
                    >
                      <Text style={styles.modalSecondaryOutlineBtnText} numberOfLines={1}>
                        🚀 Open in Full Post Composer ➔
                      </Text>
                    </Pressable>

                    {/* Danger / Dismiss: Delete Button */}
                    <Pressable
                      style={styles.modalDeleteBtn}
                      onPress={() => {
                        setScheduleList((prev) => prev.filter((item) => item.id !== selectedPostDetail.id));
                        setSelectedPostDetail(null);
                        showToast('Post removed from schedule');
                      }}
                    >
                      <Text style={styles.modalDeleteBtnText}>🗑️ Remove from Schedule</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </Animated.View>
          </View>
        </Modal>

                {/* ============================================================ */}
        {/* MODAL 4: EXPANDED DAY SCHEDULE TIMELINE MODAL               */}
        {/* ============================================================ */}
        <Modal
          visible={showExpandViewModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowExpandViewModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalProTagBadge}>
                    <Text style={styles.modalProTagBadgeText}>
                      📅 {weekData.days[selectedDayIndex]?.dayName} {weekData.days[selectedDayIndex]?.monthName?.toUpperCase()} {weekData.days[selectedDayIndex]?.dayNum} TIMELINE
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowExpandViewModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text
                  style={styles.modalTitleText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {weekData.days[selectedDayIndex]?.dayName} ({weekData.days[selectedDayIndex]?.monthName} {weekData.days[selectedDayIndex]?.dayNum}) Detailed Schedule
                </Text>
                <Text style={styles.modalSubText}>
                  Complete chronological breakdown of posts, predicted retention windows, and status for this day.
                </Text>

                {/* Day Posts List */}
                <View style={{ gap: 10, marginVertical: 10 }}>
                  {displayedItems.length > 0 ? (
                    displayedItems.map((item, idx) => (
                      <View key={item.id} style={styles.expandedPostCard}>
                        <View style={styles.expandedPostTopRow}>
                          <View style={item.badgeType === 'recommended' ? styles.timeBoxGold : styles.timeBoxPurple}>
                            <Text style={item.badgeType === 'recommended' ? styles.timeBoxGoldText : styles.timeBoxPurpleText}>
                              {item.time}
                            </Text>
                            <Text style={item.badgeType === 'recommended' ? styles.timeBoxGoldSub : styles.timeBoxPurpleSub}>
                              {item.period}
                            </Text>
                          </View>

                          <View style={styles.expandedPostContentCol}>
                            <View style={styles.expandedPostTitleRow}>
                              <Text style={styles.expandedPostTitle} numberOfLines={2} ellipsizeMode="tail">
                                {item.title}
                              </Text>
                              <View style={item.badgeType === 'recommended' ? styles.recommendedPillBadge : styles.scheduledPillBadge}>
                                <Text style={item.badgeType === 'recommended' ? styles.recommendedPillBadgeText : styles.scheduledPillBadgeText}>
                                  {item.badgeType.toUpperCase()}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.expandedPostPlatformText} numberOfLines={1} ellipsizeMode="tail">
                              {item.platformLabel} • ⚡ 94% Retention
                            </Text>
                          </View>
                        </View>

                        {/* Actions for this post */}
                        <View style={styles.expandedPostActionsRow}>
                          <Pressable
                            style={styles.expandedPostActionBtn}
                            onPress={() => {
                              if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              }
                              setShowExpandViewModal(false);
                              if (onOpenPostComposer) {
                                onOpenPostComposer(item.title, item.platform);
                              } else if (onStartMission) {
                                onStartMission();
                              } else {
                                showToast('Opening Post Composer...');
                              }
                            }}
                          >
                            <Text style={styles.expandedPostActionBtnText}>🚀 Post Now</Text>
                          </Pressable>

                          <Pressable
                            style={styles.expandedPostActionBtnSecondary}
                            onPress={() => {
                              if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                              setShowExpandViewModal(false);
                              if (onOpenPostComposer) {
                                onOpenPostComposer(item.title, item.platform);
                              } else {
                                setEditingPostTitle(item.title);
                                setEditingPostPlatform(item.platformLabel);
                                setEditingPostTime(item.time);
                                setEditingPostPeriod(item.period);
                                triggerModalPop();
                                setSelectedPostDetail(item);
                              }
                            }}
                          >
                            <Text style={styles.expandedPostActionBtnSecondaryText}>✏️ Edit Details</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyScheduleBox}>
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>☕</Text>
                      <Text style={styles.emptyScheduleTitle}>No posts scheduled for {weekData.days[selectedDayIndex]?.dayName}</Text>
                      <Text style={styles.emptyScheduleSub}>Lock in a peak engagement slot to maintain your streak momentum.</Text>
                    </View>
                  )}
                </View>

                {/* Prominent + Schedule Post Button */}
                <Pressable
                  style={styles.modalPrimaryActionBtn}
                  onPress={() => {
                    setShowExpandViewModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer();
                    } else {
                      setTimeout(() => {
                        triggerModalPop();
                        setShowSchedulePostModal(true);
                      }, 200);
                    }
                  }}
                >
                  <Text style={styles.modalPrimaryActionBtnText} numberOfLines={1}>
                    + Schedule Post for {weekData.days[selectedDayIndex]?.dayName} ➔
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowExpandViewModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Timeline</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

                {/* ============================================================ */}
        {/* MODAL 5: ADVANCED PRO AUTOPILOT QUEUE MODAL                  */}
        {/* ============================================================ */}
        <Modal
          visible={showFullQueueModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullQueueModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalProTagBadge}>
                    <Text style={styles.modalProTagBadgeText}>👑 PRO AUTOPILOT QUEUE</Text>
                  </View>
                  <Pressable onPress={() => setShowFullQueueModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText}>All Scheduled Content</Text>
                <Text style={styles.modalSubText}>
                  {fullQueueList.length} active queue slots configured across all connected social channels. Tap any slot to view or edit details.
                </Text>

                {/* Filter Chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 }}>
                  {['ALL', 'IG Reel', 'TikTok', 'Shorts', 'Threads'].map((filter) => (
                    <Pressable
                      key={filter}
                      style={[
                        styles.queueFilterChip,
                        selectedQueueFilter === filter && styles.queueFilterChipActive,
                      ]}
                      onPress={() => setSelectedQueueFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.queueFilterChipText,
                          selectedQueueFilter === filter && styles.queueFilterChipTextActive,
                        ]}
                      >
                        {filter === 'ALL' ? '🌟 All Channels' : filter}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Queue Items List */}
                <View style={{ gap: 10, marginVertical: 6 }}>
                  {fullQueueList
                    .filter((q) => selectedQueueFilter === 'ALL' || q.platformLabel.includes(selectedQueueFilter))
                    .map((item) => (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [styles.fullQueueItemCard, pressed && styles.btnPressed]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setShowFullQueueModal(false);
                          if (onOpenPostComposer) {
                            onOpenPostComposer(item.title, item.iconType);
                          } else {
                            // Fallback
                            setEditingPostTitle(item.title);
                            setEditingPostPlatform(item.platformLabel);
                            setEditingPostTime(item.time);
                            setEditingPostPeriod(item.period);
                            triggerModalPop();
                            setSelectedPostDetail({
                              id: item.id,
                              time: item.time,
                              period: item.period,
                              title: item.title,
                              platform: item.iconType,
                              platformLabel: item.platformLabel,
                              badgeType: 'scheduled',
                              dayIndex: selectedDayIndex,
                            });
                          }
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flexDirection: 'row', gap: 10, flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
                            <View style={{ marginTop: 2 }}>
                              <SocialBrandIcon platform={item.iconType} size={32} />
                            </View>

                            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                              <Text style={styles.scheduleItemTitle} numberOfLines={2} ellipsizeMode="tail">
                                {item.title}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 3, gap: 4 }}>
                                <Text style={styles.scheduleItemPlatform}>
                                  {item.dayLabel} • {item.time} {item.period} •
                                </Text>
                                <Pressable
                                  style={styles.audienceFitInlinePill}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    if (Platform.OS !== 'web') {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    triggerModalPop();
                                    setShowAudienceFitModal(true);
                                  }}
                                  hitSlop={6}
                                >
                                  <Text style={styles.audienceFitInlinePillText}>
                                    ⚡ {item.score} <Text style={{ fontSize: 9.5, color: '#92400E' }}>ⓘ</Text>
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          </View>

                          <View style={styles.queueStatusBadge}>
                            <Text style={styles.queueStatusBadgeText}>{item.status}</Text>
                          </View>
                        </View>

                        <View style={styles.queueCardFooterRow}>
                          <Text style={styles.queueCardActionHint}>✏️ Tap to edit in Post Composer</Text>
                          <Text style={{ fontSize: 13, color: '#582CDB', fontWeight: '700' }}>➔</Text>
                        </View>
                      </Pressable>
                    ))}
                </View>

                {/* + Schedule New Post Button */}
                <Pressable
                  style={[styles.modalPrimaryActionBtn, { marginTop: 14 }]}
                  onPress={() => {
                    setShowFullQueueModal(false);
                    setTimeout(() => {
                      triggerModalPop();
                      setShowSchedulePostModal(true);
                    }, 200);
                  }}
                >
                  <Text style={styles.modalPrimaryActionBtnText} numberOfLines={1}>
                    + Add New Post to Queue ➔
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowFullQueueModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Queue</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 6: AUDIENCE FIT EXPLANATION & METHODOLOGY              */}
        {/* ============================================================ */}
        <Modal
          visible={showAudienceFitModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAudienceFitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxWidth: 420 }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalGoldTagBadge}>
                    <Text style={styles.modalGoldTagBadgeText}>⚡ JARVIS PREDICTIVE INTEL</Text>
                  </View>
                  <Pressable onPress={() => setShowAudienceFitModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText} numberOfLines={1} adjustsFontSizeToFit>
                  What is Audience Fit?
                </Text>

                {/* Core Definition Banner */}
                <View style={styles.audienceFitDefinitionBanner}>
                  <Text style={styles.audienceFitDefinitionText}>
                    How closely this content matches your audience’s interests, past engagement patterns, and content preferences.
                  </Text>
                </View>

                {/* Breakdown Pillars */}
                <Text style={styles.inputLabel}>HOW JARVIS CALCULATES THIS SCORE</Text>

                <View style={styles.audienceFitPillarRow}>
                  <View style={styles.audienceFitPillarIconBox}>
                    <Text style={{ fontSize: 16 }}>🎯</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audienceFitPillarTitle}>Topic &amp; Interest Alignment</Text>
                    <Text style={styles.audienceFitPillarSub}>
                      Measures semantic overlap with topics your audience bookmarks, saves, and shares most frequently.
                    </Text>
                  </View>
                </View>

                <View style={styles.audienceFitPillarRow}>
                  <View style={styles.audienceFitPillarIconBox}>
                    <Text style={{ fontSize: 16 }}>🕒</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audienceFitPillarTitle}>Peak Attention Timing</Text>
                    <Text style={styles.audienceFitPillarSub}>
                      Scores whether the scheduled slot matches your followers' highest historical active hours.
                    </Text>
                  </View>
                </View>

                <View style={styles.audienceFitPillarRow}>
                  <View style={styles.audienceFitPillarIconBox}>
                    <Text style={{ fontSize: 16 }}>📈</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audienceFitPillarTitle}>Retention &amp; Format Fit</Text>
                    <Text style={styles.audienceFitPillarSub}>
                      Evaluates video pacing and format against your top-performing 10% highest-retention posts.
                    </Text>
                  </View>
                </View>

                {/* Action Button */}
                <Pressable
                  style={[styles.modalPrimaryActionBtn, { marginTop: 14 }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAudienceFitModal(false);
                  }}
                >
                  <Text style={styles.modalPrimaryActionBtnText}>Got it ➔</Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAudienceFitModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Dismiss</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 7: AUTOPILOT ENGINE CONTROLS & GOVERNANCE MODAL        */}
        {/* ============================================================ */}
        <Modal
          visible={showAutopilotModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAutopilotModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalGoldTagBadge}>
                    <Text style={styles.modalGoldTagBadgeText}>🤖 PRO AUTOPILOT GOVERNANCE</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setAutopilotMode(savedAutopilotMode);
                      setShowAutopilotModal(false);
                    }}
                    hitSlop={8}
                  >
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText} numberOfLines={1} adjustsFontSizeToFit>
                  What Autopilot Manages
                </Text>
                <Text style={styles.modalSubText}>
                  Jarvis coordinates your posting consistency, queue timing, and streak protection behind the scenes.
                </Text>

                {/* 3 Clear Automation Modes (Trust Levels) */}
                <Text style={styles.inputLabel}>AUTOMATION MODE (SELECT TRUST LEVEL)</Text>

                <Pressable
                  style={[
                    styles.autopilotModeCard,
                    autopilotMode === 'recommend' && styles.autopilotModeCardActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutopilotMode('recommend');
                  }}
                >
                  <View style={styles.autopilotModeTitleRow}>
                    <Text style={styles.autopilotModeName}>💡 Recommend</Text>
                    <View style={[styles.autopilotModeBadge, autopilotMode === 'recommend' && styles.autopilotModeBadgeActive]}>
                      <Text style={[styles.autopilotModeBadgeText, autopilotMode === 'recommend' && styles.autopilotModeBadgeTextActive]}>
                        MANUAL APPROVAL
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.autopilotModeDesc}>
                    Jarvis suggests peak windows &amp; draft hooks. Zero changes are committed to schedule without your review.
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.autopilotModeCard,
                    autopilotMode === 'schedule' && styles.autopilotModeCardActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutopilotMode('schedule');
                  }}
                >
                  <View style={styles.autopilotModeTitleRow}>
                    <Text style={styles.autopilotModeName}>📅 Schedule (Default)</Text>
                    <View style={[styles.autopilotModeBadge, autopilotMode === 'schedule' && styles.autopilotModeBadgeActive]}>
                      <Text style={[styles.autopilotModeBadgeText, autopilotMode === 'schedule' && styles.autopilotModeBadgeTextActive]}>
                        SMART QUEUE
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.autopilotModeDesc}>
                    PostStreak locks open slots into your weekly calendar. You give quick 1-tap confirmation before publishing.
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.autopilotModeCard,
                    autopilotMode === 'autopost' && styles.autopilotModeCardActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutopilotMode('autopost');
                  }}
                >
                  <View style={styles.autopilotModeTitleRow}>
                    <Text style={styles.autopilotModeName}>⚡ Auto-Post</Text>
                    <View style={[styles.autopilotModeBadge, autopilotMode === 'autopost' && styles.autopilotModeBadgeActive]}>
                      <Text style={[styles.autopilotModeBadgeText, autopilotMode === 'autopost' && styles.autopilotModeBadgeTextActive]}>
                        FULL AUTOPILOT
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.autopilotModeDesc}>
                    PostStreak publishes approved queue items automatically to connected social accounts at peak traffic windows.
                  </Text>
                  <View style={styles.autoPostTrustBadge}>
                    <Text style={styles.autoPostTrustBadgeText}>
                      🛡️ Only content you’ve approved can be published automatically.
                    </Text>
                  </View>
                </Pressable>

                {/* What Autopilot Manages Breakdown */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>ACTIVE CAPABILITIES &amp; CONTROLS</Text>
                <View style={styles.autopilotCapabilitiesCard}>
                  <View style={styles.autopilotCapabilityRow}>
                    <Text style={styles.autopilotCapIcon}>🕒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autopilotCapTitle}>Best Posting Times</Text>
                      <Text style={styles.autopilotCapSub}>Calculated daily from follower active-hour analytics.</Text>
                    </View>
                  </View>

                  <View style={styles.autopilotCapabilityRow}>
                    <Text style={styles.autopilotCapIcon}>📊</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autopilotCapTitle}>Queue Prioritization</Text>
                      <Text style={styles.autopilotCapSub}>Slots high-retention concepts into highest-traffic days.</Text>
                    </View>
                  </View>

                  <View style={styles.autopilotCapabilityRow}>
                    <Text style={styles.autopilotCapIcon}>🎯</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autopilotCapTitle}>Platform Selection &amp; Gaps</Text>
                      <Text style={styles.autopilotCapSub}>Identifies empty slots 48h early to preserve streak health.</Text>
                    </View>
                  </View>

                  <View style={styles.autopilotCapabilityRow}>
                    <Text style={styles.autopilotCapIcon}>💡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autopilotCapTitle}>Draft Recommendations</Text>
                      <Text style={styles.autopilotCapSub}>Generates 3 curated hooks for any detected open gap.</Text>
                    </View>
                  </View>

                  <View style={[styles.autopilotCapabilityRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.autopilotCapIcon}>⏱️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autopilotCapTitle}>Timing Adjustments</Text>
                      <Text style={styles.autopilotCapSub}>Auto-shifts slots if your audience peak shifts on weekends.</Text>
                    </View>
                  </View>
                </View>

                {/* Action Button */}
                <Pressable
                  style={[styles.modalPrimaryActionBtn, { marginTop: 14 }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setSavedAutopilotMode(autopilotMode);
                    setShowAutopilotModal(false);
                    showToast(`Autopilot set to ${autopilotMode.toUpperCase()} mode`);
                  }}
                >
                  <Text style={styles.modalPrimaryActionBtnText}>Save Autopilot Settings ➔</Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setAutopilotMode(savedAutopilotMode);
                    setShowAutopilotModal(false);
                  }}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

                {/* ============================================================ */}
        {/* MODAL 6: JARVIS PRO STRATEGY ROADMAP MODAL                  */}
        {/* ============================================================ */}
        <Modal
          visible={showStrategyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStrategyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalProTagBadge}>
                    <Text style={styles.modalProTagBadgeText}>👑 JARVIS PRO STRATEGY BLUEPRINT</Text>
                  </View>
                  <Pressable onPress={() => setShowStrategyModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText}>Algorithmic Strategy Blueprint</Text>
                <Text style={styles.modalSubText}>
                  High-velocity tactics calculated for your 52-day streak momentum and current multi-platform reach.
                </Text>

                {/* Selectable Strategy Cards */}
                <View style={{ gap: 10, marginVertical: 12 }}>
                  {JARVIS_STRATEGIES.map((strat) => {
                    const isSelected = selectedStrategyIds.includes(strat.id);
                    return (
                      <Pressable
                        key={strat.id}
                        style={({ pressed }) => [
                          styles.strategyIdeaCard,
                          isSelected && styles.strategyIdeaCardSelected,
                          pressed && styles.btnPressed,
                        ]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          if (selectedStrategyIds.includes(strat.id)) {
                            if (selectedStrategyIds.length > 1) {
                              setSelectedStrategyIds(selectedStrategyIds.filter((s) => s !== strat.id));
                            } else {
                              showToast('Select at least 1 strategy');
                            }
                          } else {
                            setSelectedStrategyIds([...selectedStrategyIds, strat.id]);
                          }
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 }}>
                            <Text style={{ fontSize: 20 }}>{strat.icon}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.strategyIdeaTitle}>{strat.title}</Text>
                              <Text style={styles.strategyIdeaTag}>{strat.tag}</Text>
                            </View>
                          </View>

                          <View style={[styles.strategyCheckCircle, isSelected && styles.strategyCheckCircleActive]}>
                            {isSelected && (
                              <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                                <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                              </Svg>
                            )}
                          </View>
                        </View>

                        <Text style={styles.strategyIdeaBody}>{strat.body}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Primary Action Button: Apply Selected Strategies */}
                <Pressable
                  style={({ pressed }) => [styles.modalGoldActionBtnWrapper, { marginTop: 6 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowStrategyModal(false);
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    const xpCount = selectedStrategyIds.length * 25;
                    setCompletionData({
                      title: `${selectedStrategyIds.length} Strategies Activated!`,
                      subtitle: 'Pacing, timing windows, and multi-sync cascade rules synchronized to your queue.',
                      badgeText: '👑 STRATEGY BLUEPRINT LIVE',
                      xpEarned: xpCount,
                      speechBubble: 'Algorithmic multiplier active! Pacing optimized for maximum reach.',
                    });
                    setTimeout(() => {
                      setShowCompletionModal(true);
                    }, 200);
                  }}
                >
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGoldBtnGradient}
                  >
                    <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                      ✨ Apply {selectedStrategyIds.length} Strategies (+{selectedStrategyIds.length * 25} XP) ➔
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Secondary Action: Chat with Jarvis */}
                <Pressable
                  style={({ pressed }) => [styles.modalSecondaryOutlineBtn, { marginTop: 8 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowStrategyModal(false);
                    if (onOpenMessages) {
                      onOpenMessages('conv_jarvis');
                    } else if (onOpenJarvisPro) {
                      onOpenJarvisPro();
                    }
                  }}
                >
                  <Text style={styles.modalSecondaryOutlineBtnText} numberOfLines={1}>
                    💬 Chat with Jarvis for Plan ➔
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowStrategyModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Dismiss Strategy</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* 👻 GHOST CELEBRATION COMPLETION MODAL                        */}
        {/* ============================================================ */}
        <AnimatedCompletionModal
          visible={showCompletionModal}
          title={completionData.title}
          subtitle={completionData.subtitle}
          badgeText={completionData.badgeText}
          xpEarned={completionData.xpEarned}
          streakCount={52}
          speechBubble={completionData.speechBubble}
          actionText="Awesome ➔"
          onDismiss={() => setShowCompletionModal(false)}
        />

        {/* PRO NOTIFICATIONS MODAL */}
        <ProNotificationsModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          onActionPress={(actionKey) => {
            setShowNotificationModal(false);
            if (actionKey === 'open_messages' && onOpenMessages) {
              onOpenMessages();
            } else if (actionKey === 'open_create' && onOpenCreateIdea) {
              onOpenCreateIdea();
            } else if (onNavigateTab) {
              onNavigateTab('match');
            }
          }}
          onToast={showToast}
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
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.6)',
    position: 'relative',
  },
  headerIconBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
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

  // TITLES SECTION
  topTitlesSection: {
    marginBottom: 16,
  },
  contentScheduleTagBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  contentScheduleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  mainTitleText: {
    fontSize: 18.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    marginBottom: 6,
  },
  mainSubText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // CARD 1: WEEKLY OUTLOOK
  weeklyOutlookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  weeklyOutlookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  weeklyOutlookRange: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  outlookButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  schedulePostPrimaryBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schedulePostPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fillGapsOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillGapsOutlineBtnText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },

  // 2X2 METRICS GRID: 2 ROWS
  metrics2x2Container: {
    gap: 8,
    marginBottom: 16,
  },
  metricsGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricGridTile: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1EFE9',
  },
  metricGridTileOpenSlots: {
    backgroundColor: '#FFFDF7',
    borderColor: '#FDE68A',
  },
  metricGridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricGridLabelOpenSlots: {
    color: '#B45309',
  },
  metricGridVal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
  },
  metricGridValOpenSlots: {
    color: '#B45309',
  },
  planCompletionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planCompletionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  planCompletionReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  planCompletionProgressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  planCompletionProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // SECTION 2: CALENDAR VIEW STRIP
  sectionSmallHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  calendarViewStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayPillCard: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  dayPillCardToday: {
    borderColor: '#F59E0B',
    borderWidth: 1.2,
  },
  dayPillCardSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    borderWidth: 1.5,
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  dayNameTextSelected: {
    color: '#582CDB',
    fontWeight: '700',
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  dayNumTextSelected: {
    color: '#582CDB',
  },
  dayDotsRow: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
    alignItems: 'center',
  },
  blueDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
  goldActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },

  // SECTION 3: TODAY'S SCHEDULE
  sectionHeaderRowWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitleBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  expandViewLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  scheduleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  scheduleItemCardGoldBorder: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  timeBoxPurple: {
    width: 52,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBoxPurpleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  timeBoxPurpleSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6D28D9',
  },
  timeBoxGold: {
    width: 52,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBoxGoldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  timeBoxGoldSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  scheduleItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  scheduleItemPlatform: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  scheduledPillBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  scheduledPillBadgeText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.2,
  },
  recommendedPillBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FBBF24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  recommendedPillBadgeText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  emptyScheduleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderStyle: 'dashed',
  },
  emptyScheduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
  },
  emptyAddPostBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  emptyAddPostBtnText: {
    color: '#582CDB',
    fontSize: 12,
    fontWeight: '700',
  },

  // SECTION 4: UPCOMING QUEUE
  viewFullQueuePillBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewFullQueuePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  queueContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 18,
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queueItemDivider: {
    height: 1,
    backgroundColor: '#F1EFE9',
    marginVertical: 12,
  },
  linkedinSquareIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramSquareIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokSquareIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  queueItemTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  threeDotsMenu: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },

  // SECTION 5: AUTOPILOT ACTIVE BANNER
  autopilotBannerCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 18,
  },
  autopilotSparkleSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autopilotTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  autopilotSubText: {
    fontSize: 12,
    color: '#4C1D95',
    marginTop: 1,
  },
  autopilotSubTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
  },
  autopilotSubTileLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  autopilotSubTileVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  autopilotManageLinkBtn: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autopilotManageLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // AUTOPILOT MODAL STYLES
  autopilotModeCard: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  autopilotModeCardActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  autopilotModeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autopilotModeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  autopilotModeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autopilotModeBadgeActive: {
    backgroundColor: '#8B5CF6',
  },
  autopilotModeBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#475569',
  },
  autopilotModeBadgeTextActive: {
    color: '#FFFFFF',
  },
  autopilotModeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  autoPostTrustBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  autoPostTrustBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    lineHeight: 14,
  },
  autopilotCapabilitiesCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  autopilotCapabilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  autopilotCapIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  autopilotCapTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 1,
  },
  autopilotCapSub: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },

  // SECTION 6: ANALYTICS OPTIMAL WINDOWS
  analyticsSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 18,
  },
  analyticsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  windowDayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  windowPeakLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  timelineBarTrack: {
    height: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1EFE9',
    position: 'relative',
    justifyContent: 'center',
  },
  timelinePeakBlock: {
    position: 'absolute',
    width: 28,
    height: 10,
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  platformMixTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 8,
  },
  platformMixBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mixBarSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },

  // SECTION 7: DETECTED GAPS
  gapWarningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 18,
    marginTop: 8,
  },
  gapWarningSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  gapWarningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginTop: 2,
  },
  fillSlotGoldBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  goldBtnGradient: {
    flex: 1,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
  },
  fillSlotGoldBtnText: {
    color: '#0C0A12',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  askJarvisOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askJarvisOutlineBtnText: {
    color: '#582CDB',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // SECTION 8: JARVIS INSIGHT
  jarvisInsightCard: {
    borderRadius: 24,
    padding: 20,
  },
  jarvisInsightHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jarvisInsightBody: {
    fontSize: 13,
    color: '#EDE9FE',
    lineHeight: 19,
    marginBottom: 16,
  },
  moreStrategyBtn: {
    backgroundColor: '#4C1D95',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  moreStrategyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalProTagBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  modalProTagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  modalGoldTagBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  modalGoldTagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  modalTagBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  modalTagBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalTitleText: {
    fontSize: sFont(16),
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  modalSubText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#171420',
  },
  modalTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#171420',
    minHeight: 56,
  },
  hookChip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hookChipText: {
    fontSize: 10,
    color: '#582CDB',
    fontWeight: '800',
  },
  platformPillBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformPillBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformPillText: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  platformPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeChipBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  timeChipBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  timeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  timeChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  jarvisPredictionBox: {
    backgroundColor: '#FAF8F5',
    borderLeftWidth: 3,
    borderLeftColor: '#582CDB',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
  },
  jarvisPredictionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  jarvisPredictionSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  modalPrimaryActionBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalPrimaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: sFont(13),
    fontWeight: '700',
    textAlign: 'center',
  },
  modalGoldActionBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  modalGoldBtnGradient: {
    paddingVertical: 13,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
  },
  modalGoldActionBtnText: {
    color: '#0C0A12',
    fontSize: sFont(13),
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  modalSecondaryOutlineBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryOutlineBtnText: {
    color: '#582CDB',
    fontSize: sFont(13),
    fontWeight: '700',
    textAlign: 'center',
  },
  modalDeleteBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalDeleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },

  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },

  // GAP MODAL SPECIFIC (JARVIS 3-HOOK PICKER SHEET)
  gapSlotDetectedBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  gapSlotDetectedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  gapSlotAudienceBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gapSlotAudienceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  gapSlotDetectedSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  gapSuggestionCard: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  gapSuggestionCardPressed: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    transform: [{ scale: 0.985 }],
  },
  gapSugAngleBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gapSugAngleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  gapSugScoreBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gapSugScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  gapSugTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 19,
    marginVertical: 4,
  },
  gapSugBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  gapSugFormatText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  gapSugActionTag: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  gapBlankComposerBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    marginBottom: 6,
  },
  gapBlankComposerBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },

  // AUDIENCE FIT MODAL & PILL STYLES
  audienceFitInlinePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  audienceFitInlinePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  audienceFitDefinitionBanner: {
    backgroundColor: '#EDE9FE',
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  audienceFitDefinitionText: {
    fontSize: 12.5,
    color: '#1E1B4B',
    lineHeight: 18,
    fontWeight: '600',
  },
  audienceFitPillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 8,
  },
  audienceFitPillarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audienceFitPillarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  audienceFitPillarSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  // POST DETAIL MODAL
  postDetailPrimaryBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  postDetailPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  postDetailSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  postDetailSecondaryBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },

  expandedPostCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  expandedPostTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  expandedPostContentCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  expandedPostTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
  },
  expandedPostTitle: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 18,
  },
  expandedPostPlatformText: {
    fontSize: sFont(11),
    color: '#64748B',
    fontWeight: '700',
  },
  expandedPostActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  expandedPostActionBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  expandedPostActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedPostActionBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  expandedPostActionBtnSecondaryText: {
    color: '#171420',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyScheduleSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },

  // FULL QUEUE MODAL STYLES
  queueFilterChip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  queueFilterChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  queueFilterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  queueFilterChipTextActive: {
    color: '#582CDB',
  },
  fullQueueItemCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  queueStatusBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  queueStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  queueCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  queueCardActionHint: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '800',
  },

  // STRATEGY MODAL STYLES
  strategyIdeaCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  strategyCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyCheckCircleActive: {
    borderColor: '#582CDB',
    backgroundColor: '#582CDB',
  },
  strategyIdeaCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  strategyIdeaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  strategyIdeaTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  strategyIdeaBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
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
