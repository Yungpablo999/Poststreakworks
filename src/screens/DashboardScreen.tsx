import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { CreatorProfileModal, DEFAULT_ELENA_PROFILE } from '../components/CreatorProfileModal';
import { BrandToast } from '../components/BrandToast';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

interface DashboardScreenProps {
  onLogout?: () => void;
  onStartMission?: () => void;
  onOpenQuest?: (questId?: string) => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onSwitchToPro?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}
type NotificationFilter = 'all' | 'unread' | 'quests';

interface MonthData {
  id: string;
  monthName: string;
  year: number;
  daysCount: number;
  startOffset: number; // 0 for Mon, 1 for Tue, etc.
  completedDays: number[];
  scheduledDays: number[];
  freezeDays: number[];
  isCurrent?: boolean;
}

interface NotificationItem {
  id: string;
  type: 'streak' | 'collab' | 'quest' | 'level' | 'growth';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
  badgeBg: string;
  badgeBorder: string;
  actionText?: string;
  priority?: 'high' | 'normal';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'streak',
    title: 'Streak Lock Reminder 🔥',
    body: 'Post 1 Reel before 11:30 AM today to lock in Day 48 and protect your consistency score.',
    time: '15m ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
    actionText: 'Post Now',
    priority: 'high',
  },
  {
    id: 'n2',
    type: 'quest',
    title: 'New Brand Quest Available',
    body: 'Lagos Food Festival ($450 Bounty) is looking for creators in your niche. Tap to review brief.',
    time: '1h ago',
    unread: true,
    iconEmoji: '🎯',
    badgeBg: '#EDE8FC',
    badgeBorder: '#DDD6FE',
    actionText: 'View Quest',
    priority: 'high',
  },
  {
    id: 'n3',
    type: 'collab',
    title: 'Collab Match Suggested',
    body: 'Amara Okafor (85k followers) is active in Travel & Food and open to co-creating this weekend.',
    time: '3h ago',
    unread: true,
    iconEmoji: '🤝',
    badgeBg: '#E0F2FE',
    badgeBorder: '#BAE6FD',
    actionText: 'Connect',
    priority: 'high',
  },
  {
    id: 'n4',
    type: 'level',
    title: 'XP Milestone Unlocked 🏆',
    body: 'You earned +350 XP this week! You are now 550 XP away from Level 43 Master Storyteller.',
    time: 'Yesterday',
    unread: false,
    iconEmoji: '⚡',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
    priority: 'normal',
  },
  {
    id: 'n5',
    type: 'growth',
    title: 'Top 5% Consistency Tier',
    body: 'Your 96% posting consistency ranks you in the top 5% of creator accounts on Jarvis this month.',
    time: '2d ago',
    unread: false,
    iconEmoji: '📈',
    badgeBg: '#ECFDF5',
    badgeBorder: '#A7F3D0',
    priority: 'normal',
  },
  {
    id: 'n6',
    type: 'level',
    title: 'Weekly Level Report',
    body: 'Streak milestone reached: 47 consecutive days recorded in your creator log.',
    time: '3d ago',
    unread: false,
    iconEmoji: '📊',
    badgeBg: '#F1F5F9',
    badgeBorder: '#E2E8F0',
    priority: 'normal',
  },
];

const CALENDAR_DATA_CHRONOLOGICAL: MonthData[] = [
  {
    id: 'jan',
    monthName: 'January',
    year: 2024,
    daysCount: 31,
    startOffset: 0,
    completedDays: [10, 11, 12, 17, 18, 19, 24, 25, 26, 31],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'feb',
    monthName: 'February',
    year: 2024,
    daysCount: 29,
    startOffset: 3,
    completedDays: [1, 2, 7, 8, 9, 14, 15, 16, 21, 22, 23, 28, 29],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'mar',
    monthName: 'March',
    year: 2024,
    daysCount: 31,
    startOffset: 4,
    completedDays: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'apr',
    monthName: 'April',
    year: 2024,
    daysCount: 30,
    startOffset: 0,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'may',
    monthName: 'May',
    year: 2024,
    daysCount: 31,
    startOffset: 2,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    scheduledDays: [17, 18, 19, 21, 23, 25, 28],
    freezeDays: [20],
    isCurrent: true,
  },
  {
    id: 'jun',
    monthName: 'June',
    year: 2024,
    daysCount: 30,
    startOffset: 5,
    completedDays: [],
    scheduledDays: [1, 3, 5, 7, 10, 12, 14, 17, 19, 21, 24, 26],
    freezeDays: [],
  },
  {
    id: 'jul',
    monthName: 'July',
    year: 2024,
    daysCount: 31,
    startOffset: 0,
    completedDays: [],
    scheduledDays: [2, 4, 8, 11, 15, 18, 22, 25, 29],
    freezeDays: [],
  },
  {
    id: 'aug',
    monthName: 'August',
    year: 2024,
    daysCount: 31,
    startOffset: 3,
    completedDays: [],
    scheduledDays: [1, 5, 8, 12, 15, 19, 22, 26, 29],
    freezeDays: [],
  },
  {
    id: 'sep',
    monthName: 'September',
    year: 2024,
    daysCount: 30,
    startOffset: 6,
    completedDays: [],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'oct',
    monthName: 'October',
    year: 2024,
    daysCount: 31,
    startOffset: 1,
    completedDays: [],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'nov',
    monthName: 'November',
    year: 2024,
    daysCount: 30,
    startOffset: 4,
    completedDays: [],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'dec',
    monthName: 'December',
    year: 2024,
    daysCount: 31,
    startOffset: 6,
    completedDays: [],
    scheduledDays: [],
    freezeDays: [],
  },
];

interface DayInsightData {
  date: string;
  headline: string;
  description: string;
  type: 'completed' | 'scheduled' | 'freeze' | 'rest';
}

const getJarvisDayInsight = (day: number, month: MonthData): DayInsightData => {
  const date = `${month.monthName} ${day}`;

  if (month.completedDays.includes(day)) {
    if (day === 1) {
      return {
        date,
        headline: 'Month Opener Momentum',
        description: `You set the foundation for ${month.monthName} with a verified Reel hook.`,
        type: 'completed',
      };
    }
    if (day === 15 || day === 16 || day === 30 || day === 31) {
      return {
        date,
        headline: 'Milestone Streak Verified',
        description: `Delivered +150 XP and protected your active creator streak on schedule.`,
        type: 'completed',
      };
    }
    if (day % 7 === 0 || day % 7 === 6) {
      return {
        date,
        headline: 'Weekend Audience Surge',
        description: `Weekend posting captured peak viewer retention across connected platforms.`,
        type: 'completed',
      };
    }
    if (day % 3 === 0) {
      return {
        date,
        headline: 'Prime Window Published',
        description: `Reel went live in the optimal 11:30 AM slot with high algorithmic delivery.`,
        type: 'completed',
      };
    }
    return {
      date,
      headline: 'Streak Posted & Verified',
      description: `Content published on schedule to protect your streak.`,
      type: 'completed',
    };
  }

  if (month.scheduledDays.includes(day)) {
    if (day === 17 || day === 18) {
      return {
        date,
        headline: 'Queued for 11:30 AM',
        description: `Content queued for automatic publishing. Jarvis will verify reach once live.`,
        type: 'scheduled',
      };
    }
    if (day % 7 === 0 || day % 7 === 6) {
      return {
        date,
        headline: 'Weekend Drop Scheduled',
        description: `High traffic expected. Draft audio and tags are locked in for maximum reach.`,
        type: 'scheduled',
      };
    }
    return {
      date,
      headline: 'Scheduled Reel Ready',
      description: `Draft scheduled with optimized caption and hashtags to protect your streak.`,
      type: 'scheduled',
    };
  }

  if (month.freezeDays.includes(day)) {
    return {
      date,
      headline: 'Protected with Streak Freeze',
      description: `Streak Freeze shield kept your streak progress safe without penalty.`,
      type: 'freeze',
    };
  }

  if (month.isCurrent && day > 16) {
    return {
      date,
      headline: 'Upcoming Open Slot',
      description: `Ready for a new draft or collab reel. Tap create to build next week's buffer.`,
      type: 'rest',
    };
  }

  return {
    date,
    headline: 'Creator Rest Day',
    description: `Planned recovery day. Balanced pacing keeps your consistency sustainable.`,
    type: 'rest',
  };
};

const PRESET_AVATARS = [
  {
    id: 'ghost',
    name: 'Ghost Mascot',
    source: require('../../assets/images/jarvis-core-flame.png'),
  },
  {
    id: 'flame',
    name: 'Jarvis Core',
    source: require('../../assets/images/jarvis-core-flame.png'),
  },
  {
    id: 'hero',
    name: 'Jarvis Hero',
    source: require('../../assets/images/jarvis-hero.png'),
  },
  {
    id: 'mascot',
    name: 'Creator Glow',
    source: require('../../assets/images/jarvis-mascot-clean.png'),
  },
];

// Exact Custom Figma Vector Icons for Bottom Navigation Bar
const HomeNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2.5L2 11.5H5.5V21.5H9.5V14.5C9.5 13.67 10.17 13 11 13H13C13.83 13 14.5 13.67 14.5 14.5V21.5H18.5V11.5H22L12 2.5Z"
      fill={color}
    />
  </Svg>
);

const CreateNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.8" />
    <Path d="M12 7.5V16.5M7.5 12H16.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
  </Svg>
);

const MatchNavIcon = ({ color }: { color: string }) => (
  <Svg width={28} height={26} viewBox="0 0 28 24" fill={color}>
    {/* Center Leader Avatar */}
    <Circle cx="14" cy="5.8" r="3.6" fill={color} />
    <Path
      d="M8.2 18.2C8.2 15 10.8 12.2 14 12.2C17.2 12.2 19.8 15 19.8 18.2V20.5H8.2V18.2Z"
      fill={color}
    />
    {/* Left Flanking Avatar */}
    <Circle cx="5.2" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M1.2 19.2C1.2 17 3 15 5.2 15C6.1 15 6.9 15.3 7.5 15.7C7.3 16.5 7.2 17.4 7.2 18.2V20.5H1.2V19.2Z"
      fill={color}
    />
    {/* Right Flanking Avatar */}
    <Circle cx="22.8" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M26.8 19.2C26.8 17 25 15 22.8 15C21.9 15 21.1 15.3 20.5 15.7C20.7 16.5 20.8 17.4 20.8 18.2V20.5H26.8V19.2Z"
      fill={color}
    />
  </Svg>
);

const QuestsNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    {/* Sword 1: Top-Left to Bottom-Right */}
    <Path
      d="M3.5 3.5L5.8 2L13.2 9.4L11.4 11.2L4 3.8V3.5Z"
      fill={color}
    />
    <Path
      d="M3.5 3.5L2 5.8L9.4 13.2L11.2 11.4L3.8 4H3.5Z"
      fill={color}
    />
    {/* Guard 1 */}
    <Path
      d="M14.5 9.2L9.8 13.9L11.3 15.4L16 10.7L14.5 9.2Z"
      fill={color}
    />
    {/* Grip 1 */}
    <Path
      d="M13.2 15.2L17.5 19.5"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Pommel 1 */}
    <Circle cx="18.5" cy="20.5" r="1.8" fill={color} />

    {/* Sword 2: Top-Right to Bottom-Left */}
    <Path
      d="M20.5 3.5L18.2 2L10.8 9.4L12.6 11.2L20 3.8V3.5Z"
      fill={color}
    />
    <Path
      d="M20.5 3.5L22 5.8L14.6 13.2L12.8 11.4L20.2 4H20.5Z"
      fill={color}
    />
    {/* Guard 2 */}
    <Path
      d="M9.5 9.2L14.2 13.9L12.7 15.4L8 10.7L9.5 9.2Z"
      fill={color}
    />
    {/* Grip 2 */}
    <Path
      d="M10.8 15.2L6.5 19.5"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Pommel 2 */}
    <Circle cx="5.5" cy="20.5" r="1.8" fill={color} />
  </Svg>
);

const GrowthNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 17L9 11.5L13 15L20.5 7"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 7H20.5V13"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onLogout,
  onStartMission,
  onOpenQuest,
  onNavigateTab,
  onOpenJarvisPro,
  onSwitchToPro,
  onOpenSchedule,
  onOpenMessages,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [matchConnected, setMatchConnected] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCreatorLevelModal, setShowCreatorLevelModal] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<NotificationFilter>('all');
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const [showBrandQuestBriefModal, setShowBrandQuestBriefModal] = useState(false);
  const [isBrandQuestAccepted, setIsBrandQuestAccepted] = useState(false);
  const [showMatchedCreatorModal, setShowMatchedCreatorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Profile Photo State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [previewAvatarId, setPreviewAvatarId] = useState<string | null>('ghost');
  const [uploadToastMessage, setUploadToastMessage] = useState<string | null>(null);

  const [selectedDayInfo, setSelectedDayInfo] = useState<DayInsightData | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(4); // Default to May (index 4)
  const [pagerWidth, setPagerWidth] = useState(Dimensions.get('window').width - 68);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const flamePulse = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;
  const calendarModalScale = useRef(new Animated.Value(0.9)).current;
  const photoModalScale = useRef(new Animated.Value(0.85)).current;
  const notifModalScale = useRef(new Animated.Value(0.85)).current;

  // Refs for auto-scrolling
  const monthPagerRef = useRef<ScrollView>(null);
  const monthChipsScrollRef = useRef<ScrollView>(null);
  const lastHapticIndex = useRef<number>(4);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    // 1. Ghost Mascot Floating Buoyancy
    const ghostLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: -5,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(ghostScale, {
            toValue: 1.06,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: 3,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(ghostScale, {
            toValue: 0.96,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // 2. Flame Pulse Loop
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, {
          toValue: 1.16,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(flamePulse, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    ghostLoop.start();
    flameLoop.start();

    return () => {
      ghostLoop.stop();
      flameLoop.stop();
    };
  }, [ghostFloatY, ghostScale, flamePulse]);

  // Center and highlight active month chip
  const centerMonthChip = useCallback((index: number) => {
    const chipWidthWithGap = 70;
    const targetScrollX = Math.max(0, index * chipWidthWithGap - 110);
    monthChipsScrollRef.current?.scrollTo({
      x: targetScrollX,
      animated: true,
    });
  }, []);

  // Sync scroll position when chip is clicked or button pressed
  const scrollToMonth = (index: number, animated = true) => {
    if (index >= 0 && index < CALENDAR_DATA_CHRONOLOGICAL.length) {
      setSelectedMonthIndex(index);
      setSelectedDayInfo(null);
      lastHapticIndex.current = index;
      monthPagerRef.current?.scrollTo({
        x: index * pagerWidth,
        animated,
      });
      centerMonthChip(index);
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

  const handleToggleMatch = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        matchConnected
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
    }
    setMatchConnected(!matchConnected);
  };

  const openMissionModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowMissionModal(true);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const openProModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onNavigateTab) {
      onNavigateTab('growth');
      return;
    }
    setShowProModal(true);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const openCalendarModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowCalendarModal(true);
    setSelectedDayInfo(null);
    Animated.spring(calendarModalScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();

    setTimeout(() => {
      scrollToMonth(4, false);
    }, 80);
  };

  const openPhotoModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPreviewAvatarId(selectedAvatarId || 'ghost');
    setUploadToastMessage(null);
    setShowPhotoModal(true);
    Animated.spring(photoModalScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const openNotificationModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowNotificationModal(true);
    Animated.spring(notifModalScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const handleMarkAllNotifsRead = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        unread: false,
      }))
    );
  };

  const handleNotificationPress = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    setExpandedNotifId((prev) => (prev === id ? null : id));
  };

  const handleNotifAction = (item: NotificationItem) => {
    setShowNotificationModal(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (item.type === 'streak') {
      onStartMission?.();
    } else if (item.type === 'quest') {
      // Directly open the Brand Quest Brief Modal!
      setShowBrandQuestBriefModal(true);
    } else if (item.type === 'collab') {
      onOpenMessages?.();
    }
  };

  const handleSelectPreset = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPreviewAvatarId(id);
    setUploadToastMessage(null);
  };

  const handleSimulateGalleryUpload = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPreviewAvatarId('ghost');
    setUploadToastMessage('✓ Photo loaded from Photo Library');
  };

  const handleSimulateCamera = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPreviewAvatarId('mascot');
    setUploadToastMessage('✓ Photo captured from Camera');
  };

  const handleSaveProfilePhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedAvatarId(previewAvatarId);
    setShowPhotoModal(false);
  };

  const handleRemovePhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedAvatarId(null);
    setPreviewAvatarId('ghost');
    setShowPhotoModal(false);
  };

  const handleDayPress = (day: number, month: MonthData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const insight = getJarvisDayInsight(day, month);
    setSelectedDayInfo(insight);
  };

  // Real-time instantaneous swipe tracking
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    if (pagerWidth > 0) {
      const newIdx = Math.round(offsetX / pagerWidth);
      if (
        newIdx >= 0 &&
        newIdx < CALENDAR_DATA_CHRONOLOGICAL.length &&
        newIdx !== selectedMonthIndex
      ) {
        setSelectedMonthIndex(newIdx);
        setSelectedDayInfo(null);
        centerMonthChip(newIdx);

        if (lastHapticIndex.current !== newIdx) {
          lastHapticIndex.current = newIdx;
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonthIndex > 0) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      scrollToMonth(selectedMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex < CALENDAR_DATA_CHRONOLOGICAL.length - 1) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      scrollToMonth(selectedMonthIndex + 1);
    }
  };

  // 7-day week streak grid dataset matching the May 2024 reference (M, T, W, T, F, S, S)
  const streakGrid: ('completed' | 'scheduled' | 'freeze' | 'empty')[][] = [
    ['empty', 'empty', 'completed', 'completed', 'completed', 'completed', 'completed'],
    ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'empty'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ];

  const currentSelectedAvatar = PRESET_AVATARS.find((a) => a.id === selectedAvatarId);
  const currentPreviewAvatar = PRESET_AVATARS.find((a) => a.id === previewAvatarId) || PRESET_AVATARS[0];

  // Filtered Notifications
  const filteredNotifications = notifications.filter((item) => {
    if (notifFilter === 'unread') return item.unread;
    if (notifFilter === 'quests') return item.type === 'quest';
    return true;
  });

  const getTabColor = (tab: TabType) => (activeTab === tab ? '#582CDB' : '#1A1626');

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP APP BAR: Ghost Mascot on Left & Notification/Profile on Right */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot + Mode Switcher */}
          <View style={styles.headerLeftGroup}>
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
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                if (onSwitchToPro) {
                  onSwitchToPro();
                } else if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                }
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.proPillBtn, pressed && styles.headerIconBtnPressed]}
            >
              <Text style={styles.proPillBtnText} numberOfLines={1}>
                {isNarrowScreen ? '🔒 PRO' : '🔒 FREE (PRO)'}
              </Text>
            </Pressable>
          </View>

          {/* Right: Message, Notification & Person Profile Photo Upload */}
          <View style={styles.headerRightGroup}>
            {/* Chat Bubble Button */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, isDark && styles.headerIconBtnDark, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
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

            {/* Notification Bell with Glowing Badge -> Opens Notification Modal */}
            <Pressable
              onPress={openNotificationModal}
              style={({ pressed }) => [styles.headerIconBtn, isDark && styles.headerIconBtnDark, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
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
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>

            {/* Top-Right: Person Icon Placeholder where users add their profile picture */}
            <Pressable
              onPress={openPhotoModal}
              style={({ pressed }) => [
                styles.profilePhotoBtn,
                currentSelectedAvatar && styles.profilePhotoBtnActive,
                pressed && styles.headerIconBtnPressed,
              ]}
              hitSlop={8}
            >
              {currentSelectedAvatar ? (
                <Image
                  source={currentSelectedAvatar.source}
                  style={styles.headerCustomAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                    stroke="#582CDB"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="#582CDB"
                    strokeWidth="2.3"
                  />
                </Svg>
              )}

              {/* Small "+" Add Photo Badge */}
              <View style={styles.addPhotoPlusBadge}>
                <Text style={styles.addPhotoPlusText}>
                  {currentSelectedAvatar ? '✎' : '+'}
                </Text>
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
          {/* 3. TODAY'S FOCUS HERO BANNER */}
          <View style={styles.focusHeroSection}>
            <View style={styles.focusPillRow}>
              <View style={styles.focusLabelGroup}>
                <View style={[styles.focusLiveDot, isDark && styles.focusLiveDotDark]} />
                <Text style={[styles.focusTagText, isDark && styles.focusTagTextDark]}>TODAY’S FOCUS</Text>
              </View>
              <Text style={[styles.nextPostCountdown, isDark && styles.nextPostCountdownDark]}>Next post · 11:30 AM</Text>
            </View>

            <Text style={[styles.focusHeadline, isDark && styles.textWhite]}>
              Post 1 Reel to protect your streak
            </Text>

            {/* Streak Motivation Typography */}
            <View style={styles.streakMotivationRow}>
              <Animated.Text
                style={[
                  styles.streakMotivationFlame,
                  { transform: [{ scale: flamePulse }] },
                ]}
              >
                🔥
              </Animated.Text>
              <Text style={[styles.streakMotivationText, isDark && styles.streakMotivationTextDark]}>
                <Text style={styles.streakMotivationHighlight}>1-day streak</Text> · Keep it alive today
              </Text>
            </View>
          </View>

          {/* 4. CARD 1: YOUR STREAK HEATMAP */}
          <Pressable
            onPress={openCalendarModal}
            style={({ pressed }) => [
              styles.dashboardCard, isDark && styles.dashboardCardDark,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardSectionTitle, isDark && styles.textWhite]}>Your Streak</Text>
              <View style={[styles.streakStatusPill, isDark && styles.streakStatusPillDark]}>
                <Text style={[styles.streakStatusHighlight, isDark && styles.streakStatusHighlightDark]}>96% consistent</Text>
              </View>
            </View>

            {/* Month Header */}
            <View style={styles.calendarMetaRow}>
              <Text style={[styles.monthLabel, isDark && styles.monthLabelDark]}>May 2024 →</Text>
            </View>

            <View style={styles.daysHeaderRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                <Text key={`day_h_${idx}`} style={styles.dayColHeader}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar Heatmap Grid - Apple Health Style Quiet Cells */}
            <View style={styles.heatmapGrid}>
              {streakGrid.map((row, rIdx) => (
                <View key={`row_${rIdx}`} style={styles.heatmapRow}>
                  {row.map((state, cIdx) => (
                    <View
                      key={`cell_${rIdx}_${cIdx}`}
                      style={[
                        styles.heatmapCell,
                        state === 'completed' && styles.heatmapCellCompleted,
                        state === 'scheduled' && styles.heatmapCellScheduled,
                        state === 'freeze' && styles.heatmapCellFreeze,
                        state === 'empty' && styles.heatmapCellEmpty,
                      ]}
                    >
                      {state === 'completed' && (
                        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 6L9 17L4 12"
                            stroke="#FFFFFF"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                      {state === 'scheduled' && (
                        <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                          <Circle cx="12" cy="12" r="9" stroke="#7C3AED" strokeWidth="2.4" strokeDasharray="3,2" />
                          <Path d="M12 7V12L15 14" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
                        </Svg>
                      )}
                      {state === 'freeze' && (
                        <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                          <Path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
                        </Svg>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </Pressable>

          {/* 5. CARD 2: SCHEDULED POSTS VELOCITY */}
          <View style={[styles.dashboardCard, isDark && styles.dashboardCardDark]}>
            <View style={styles.scheduledHeaderRow}>
              <View style={styles.scheduledLabelGroup}>
                <View style={styles.calendarIconBox}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#582CDB" strokeWidth="2.2" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={[styles.scheduledTitle, isDark && styles.textWhite]}>SCHEDULED</Text>
              </View>

              {/* View Schedule Text Action */}
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenSchedule) {
                    onOpenSchedule();
                  } else if (onNavigateTab) {
                    onNavigateTab('create');
                  }
                }}
                style={({ pressed }) => [styles.scheduleInfoBtn, pressed && styles.scheduleInfoBtnPressed]}
                hitSlop={8}
              >
                <Text style={[styles.scheduleInfoBtnText, isDark && styles.scheduleInfoBtnTextDark]}>View Schedule ›</Text>
              </Pressable>
            </View>

            <View style={styles.scheduledMetricsContainer}>
              <View style={styles.postsMetricRow}>
                <Text style={[styles.postsCountBig, isDark && styles.textWhite]}>03</Text>
                <Text style={[styles.postsCountLabel, isDark && styles.textMutedDark]}>Posts Ready</Text>
              </View>

              <View style={styles.weekIncreaseBadge}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke="#582CDB" strokeWidth="2.2" />
                  <Path d="M12 6V12L16 14" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" />
                </Svg>
                <Text style={[styles.weekIncreaseText, isDark && styles.weekIncreaseTextDark]}>+2 this week</Text>
              </View>
            </View>

            {/* Next Up Box */}
            <View style={styles.nextUpBox}>
              <Text style={styles.nextUpLabel}>NEXT UP</Text>
              <View style={styles.nextUpRow}>
                <Text style={styles.nextUpDay}>Tomorrow</Text>
                <Text style={styles.nextUpTime}>11:30 AM</Text>
              </View>
            </View>

            {/* Weekly Progress Bar */}
            <View style={styles.weeklyProgressHeader}>
              <Text style={styles.weeklyProgressLabel}>WEEKLY PROGRESS</Text>
              <Text style={styles.weeklyProgressPercent}>42% Complete</Text>
            </View>

            <View style={styles.weeklySegmentsRow}>
              <View style={[styles.weeklySegment, styles.weeklySegmentFilled]} />
              <View style={[styles.weeklySegment, styles.weeklySegmentFilled]} />
              <View style={[styles.weeklySegment, styles.weeklySegmentFilled]} />
              <View style={styles.weeklySegment} />
              <View style={styles.weeklySegment} />
              <View style={styles.weeklySegment} />
              <View style={styles.weeklySegment} />
            </View>
          </View>

          {/* 6. CARD 3: CREATOR LEVEL & QUEST (Level 1) */}
          <View style={styles.dashboardCard}>
            <View style={styles.levelCardHeader}>
              <View style={styles.levelBadgeGroup}>
                <View style={styles.levelGoldPill}>
                  <Text style={styles.levelGoldPillText}>LEVEL 1</Text>
                </View>
                <Text style={styles.levelNameHeading}>Storyteller</Text>
              </View>
              <View style={styles.trophyIconBox}>
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>
            </View>

            <Text style={styles.levelDescription}>
              Publish 1 high-impact Reel today to unlock <Text style={styles.goldTextBold}>Level 2</Text>.
            </Text>

            {/* XP Progress Bar */}
            <View style={styles.xpLabelsRow}>
              <Text style={styles.xpCurrent}>100 XP</Text>
              <Text style={styles.xpTarget}>300 XP</Text>
            </View>

            <View style={styles.xpProgressBarBg}>
              <View style={[styles.xpProgressBarFill, { width: '33%' }]} />
            </View>

            {/* Start First Mission Action Button */}
            <Pressable
              onPress={() => {
                if (onStartMission) {
                  onStartMission();
                } else {
                  openMissionModal();
                }
              }}
              style={({ pressed }) => [
                styles.missionButton,
                pressed && styles.missionButtonPressed,
              ]}
            >
              <Text style={styles.missionButtonText}>Start First Mission →</Text>
            </Pressable>
          </View>

          {/* 7. CARD 3: ACTIVE BRAND QUEST ("Lagos Food Festival") */}
          <Pressable
            style={({ pressed }) => [
              styles.questCard,
              isDark && styles.questCardDark,
              isBrandQuestAccepted && styles.questCardAccepted,
              pressed && styles.missionButtonPressed,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowBrandQuestBriefModal(true);
            }}
          >
            <View style={styles.questThumbnailBox}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=160&auto=format&fit=crop&q=80' }}
                style={styles.questThumbnailImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.questContentGroup}>
              <Text
                style={[
                  styles.activeQuestTagText,
                  isBrandQuestAccepted && styles.activeQuestTagTextAccepted,
                ]}
                numberOfLines={1}
              >
                {isBrandQuestAccepted ? '● ACTIVE CAMPAIGN' : 'BRAND QUEST'}
              </Text>
              <Text style={[styles.questTitle, isDark && styles.textWhite]} numberOfLines={1}>
                Lagos Food Festival
              </Text>
              <Text style={[styles.questSubtext, isDark && styles.textMutedDark]} numberOfLines={1}>
                Review &amp; Vlog
              </Text>
            </View>

            <View style={styles.bountyRewardBox}>
              <Text style={styles.bountyAmountText}>$450</Text>
              <Text style={styles.bountySubLabel}>Bounty</Text>
            </View>
          </Pressable>

          {/* 8. CARD 4: CREATOR MATCH VELOCITY */}
          <View style={[styles.dashboardCard, isDark && styles.dashboardCardDark]}>
            <View style={styles.matchHeaderRow}>
              <Text style={[styles.matchSectionTitle, isDark && styles.textWhite]}>Suggested Match</Text>
            </View>

            {/* Creator Profile Row */}
            <Pressable
              style={({ pressed }) => [styles.creatorProfileRow, pressed && styles.headerIconBtnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowMatchedCreatorModal(true);
              }}
            >
              <View style={styles.creatorAvatarBox}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }}
                  style={styles.creatorAvatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.creatorDetails}>
                <View style={styles.creatorNameRow}>
                  <Text style={[styles.creatorName, isDark && styles.textWhite]}>Elena Rostova</Text>
                  <View style={styles.creatorPlatformBadge}>
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                      <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2.2" />
                      <Circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2.2" />
                      <Circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
                    </Svg>
                  </View>
                </View>
                <Text style={[styles.creatorFollowers, isDark && styles.textMutedDark]}>
                  Tech &amp; Design · 42.8K followers
                </Text>
              </View>
            </Pressable>

            {/* Why This Match Box */}
            <View style={[styles.whyMatchBox, isDark && styles.whyMatchBoxDark]}>
              <Text style={styles.whyMatchPercent}>94% match</Text>
              <Text style={[styles.whyMatchText, isDark && styles.textMutedDark]}>
                Strong niche overlap, similar posting pace, and open to creator squads.
              </Text>
            </View>

            {/* View Creator Button */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setShowMatchedCreatorModal(true);
              }}
              style={({ pressed }) => [
                styles.connectMatchButton,
                pressed && styles.missionButtonPressed,
              ]}
            >
              <Text style={styles.connectMatchButtonText}>View Creator →</Text>
            </Pressable>
          </View>

          {/* 9. CARD 6: UNLOCK JARVIS PRO */}
          <View style={[styles.proCard, isDark && styles.proCardDark]}>
            <View style={styles.proHeaderRow}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.proIconImage}
                resizeMode="contain"
              />
              <View style={styles.proTitleGroup}>
                <Text style={[styles.proTitle, isDark && styles.textWhite]}>Unlock Jarvis Pro</Text>
              </View>
            </View>

            <Text style={[styles.proDescription, isDark && styles.textMutedDark]}>
              Get autonomous growth strategy, viral script generation, and priority matching.
            </Text>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  openProModal();
                }
              }}
              style={({ pressed }) => [
                styles.metallicGoldUpgradeBtn,
                pressed && styles.upgradeButtonPressed,
              ]}
            >
              <LinearGradient
                colors={['#F4B52B', '#D8920F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.metallicGoldGradient}
              >
                <Text style={styles.metallicGoldUpgradeBtnText}>Upgrade to Pro →</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* 11. NOTIFICATION CENTER POP-UP MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.notifModalCard,
                { transform: [{ scale: notifModalScale }] },
              ]}
            >
              {/* Notification Header */}
              <View style={styles.notifModalHeader}>
                <View style={styles.notifHeaderTitleRow}>
                  <Text style={styles.notifModalMainTitle}>Notifications</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountBadgeText}>{unreadCount} NEW</Text>
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={({ pressed }) => [styles.calendarCloseButton, pressed && styles.headerIconBtnPressed]}
                  hitSlop={8}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6L18 18" stroke="#1A1626" strokeWidth="2.4" strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* Top Controls: Filter Pills & "Mark all read" */}
              <View style={styles.notifFilterBar}>
                <View style={styles.notifFiltersRow}>
                  <Pressable
                    onPress={() => setNotifFilter('all')}
                    style={[styles.notifFilterPill, notifFilter === 'all' && styles.notifFilterPillActive]}
                  >
                    <Text style={[styles.notifFilterText, notifFilter === 'all' && styles.notifFilterTextActive]} numberOfLines={1}>
                      All ({notifications.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setNotifFilter('unread')}
                    style={[styles.notifFilterPill, notifFilter === 'unread' && styles.notifFilterPillActive]}
                  >
                    <Text style={[styles.notifFilterText, notifFilter === 'unread' && styles.notifFilterTextActive]} numberOfLines={1}>
                      Unread ({unreadCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setNotifFilter('quests')}
                    style={[styles.notifFilterPill, notifFilter === 'quests' && styles.notifFilterPillActive]}
                  >
                    <Text style={[styles.notifFilterText, notifFilter === 'quests' && styles.notifFilterTextActive]} numberOfLines={1}>
                      Quests
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Scrollable Notification List */}
              <ScrollView
                style={styles.notifScrollView}
                contentContainerStyle={styles.notifScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {filteredNotifications.length === 0 ? (
                  <View style={styles.emptyNotifBox}>
                    <Text style={styles.emptyNotifEmoji}>✨</Text>
                    <Text style={styles.emptyNotifTitle}>All Caught Up!</Text>
                    <Text style={styles.emptyNotifSubtitle}>No notifications in this filter.</Text>
                  </View>
                ) : (
                  filteredNotifications.map((item) => {
                    const isHighPriority = item.priority === 'high' || !!item.actionText;

                    if (isHighPriority) {
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            handleNotificationPress(item.id);
                            if (item.actionText) {
                              handleNotifAction(item);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.notifCard,
                            item.unread && styles.notifCardUnread,
                            pressed && styles.notifCardPressed,
                          ]}
                        >
                          {/* Left Icon Badge */}
                          <View
                            style={[
                              styles.notifIconBadge,
                              { backgroundColor: item.badgeBg, borderColor: item.badgeBorder },
                            ]}
                          >
                            <Text style={styles.notifIconEmoji}>{item.iconEmoji}</Text>
                          </View>

                          {/* Content */}
                          <View style={styles.notifContent}>
                            <View style={styles.notifTitleRow}>
                              <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                              <Text style={styles.notifTime}>{item.time}</Text>
                            </View>
                            <Text style={styles.notifBody}>{item.body}</Text>

                            {/* Action Link if present */}
                            {item.actionText && (
                              <Pressable
                                onPress={() => handleNotifAction(item)}
                                style={styles.notifActionRow}
                                hitSlop={6}
                              >
                                <Text style={styles.notifActionLink}>{item.actionText}  ›</Text>
                              </Pressable>
                            )}
                          </View>

                          {/* Unread Glow Dot */}
                          {item.unread && <View style={styles.notifUnreadDot} />}
                        </Pressable>
                      );
                    }

                    const isExpanded = expandedNotifId === item.id;

                    // Compact Card for Lower-Priority / Informational Notifications (Expandable on Tap)
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleNotificationPress(item.id)}
                        style={({ pressed }) => [
                          styles.notifCardCompact,
                          isExpanded && styles.notifCardCompactExpanded,
                          item.unread && styles.notifCardCompactUnread,
                          pressed && styles.notifCardPressed,
                        ]}
                      >
                        {/* Compact Left Icon Badge */}
                        <View
                          style={[
                            styles.notifIconBadgeCompact,
                            { backgroundColor: item.badgeBg, borderColor: item.badgeBorder },
                            isExpanded && { width: 32, height: 32, borderRadius: 10 },
                          ]}
                        >
                          <Text style={[styles.notifIconEmojiCompact, isExpanded && { fontSize: 15 }]}>
                            {item.iconEmoji}
                          </Text>
                        </View>

                        {/* Compact Content */}
                        <View style={styles.notifContentCompact}>
                          <View style={styles.notifTitleRowCompact}>
                            <Text
                              style={[
                                styles.notifTitleCompact,
                                isExpanded && { fontSize: 13.5, color: '#171420' },
                              ]}
                              numberOfLines={isExpanded ? undefined : 1}
                            >
                              {item.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={styles.notifTimeCompact}>{item.time}</Text>
                              <Text style={{ fontSize: 9, color: isExpanded ? '#7C3AED' : '#9E97AA', fontWeight: '800' }}>
                                {isExpanded ? '▴' : '▾'}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.notifBodyCompact,
                              isExpanded && styles.notifBodyCompactExpanded,
                            ]}
                            numberOfLines={isExpanded ? undefined : 2}
                          >
                            {item.body}
                          </Text>
                          {isExpanded && (
                            <View style={styles.notifExpandedFooter}>
                              <Text style={styles.notifExpandedHint}>Tap to collapse ▴</Text>
                            </View>
                          )}
                        </View>

                        {/* Unread Glow Dot */}
                        {item.unread && <View style={styles.notifUnreadDotCompact} />}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              {/* Modal Footer Mark All as Read Button */}
              <Pressable
                onPress={() => {
                  handleMarkAllNotifsRead();
                  setShowNotificationModal(false);
                }}
                style={({ pressed }) => [styles.savePhotoPrimaryBtn, pressed && styles.savePhotoPrimaryBtnPressed]}
              >
                <Text style={styles.savePhotoPrimaryBtnText}>Mark all as read ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* BRAND QUEST BRIEF MODAL */}
        <Modal
          visible={showBrandQuestBriefModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBrandQuestBriefModal(false)}
        >
          <View style={styles.calendarModalOverlay}>
            <Animated.View
              style={[
                styles.brandBriefModalCard,
                isDark && { backgroundColor: '#171420', borderColor: '#2D2845' },
              ]}
            >
              {/* Header */}
              <View style={styles.brandBriefHeader}>
                <View style={styles.brandBriefHeaderLeft}>
                  <View style={styles.brandBriefTagRow}>
                    <View style={styles.brandVerifiedPill}>
                      <Text style={styles.brandVerifiedText}>✓ VERIFIED BRAND</Text>
                    </View>
                    <View style={styles.escrowBadge}>
                      <Text style={styles.escrowBadgeText}>🔒 Escrow Locked</Text>
                    </View>
                  </View>
                  <Text style={[styles.brandBriefMainTitle, isDark && styles.textWhite]} numberOfLines={1}>
                    Lagos Food Festival 2026
                  </Text>
                  <Text style={[styles.brandBriefSubTitle, isDark && styles.textMutedDark]} numberOfLines={1}>
                    Campaign Brief & Deliverables
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowBrandQuestBriefModal(false)}
                  style={({ pressed }) => [styles.calendarCloseButton, styles.brandBriefCloseBtn, pressed && styles.headerIconBtnPressed]}
                  hitSlop={8}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6L18 18" stroke="#1A1626" strokeWidth="2.4" strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: 380 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {/* Bounty & Reward Banner */}
                <LinearGradient
                  colors={['#582CDB', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.brandBriefBountyBanner}
                >
                  <View>
                    <Text style={styles.brandBriefBountyLabel}>TOTAL BOUNTY REWARD</Text>
                    <Text style={styles.brandBriefBountyAmount}>$450.00 USD</Text>
                    <Text style={styles.brandBriefBountySub}>+200 XP upon submission approval</Text>
                  </View>
                  <View style={styles.brandBriefBountyIconBox}>
                    <Text style={{ fontSize: 26 }}>💰</Text>
                  </View>
                </LinearGradient>

                {/* Campaign Overview */}
                <View style={[styles.brandBriefSectionBox, isDark && { backgroundColor: '#211D30', borderColor: '#363150' }]}>
                  <Text style={[styles.brandBriefSectionHeading, isDark && styles.textWhite]}>
                    Campaign Summary
                  </Text>
                  <Text style={[styles.brandBriefBodyText, isDark && styles.textMutedDark]}>
                    Lagos Food Festival is looking for food, travel & lifestyle creators to review local food stalls, hidden culinary gems, and the live festival experience.
                  </Text>
                </View>

                {/* Deliverables Checklist */}
                <View style={[styles.brandBriefSectionBox, isDark && { backgroundColor: '#211D30', borderColor: '#363150' }]}>
                  <Text style={[styles.brandBriefSectionHeading, isDark && styles.textWhite]}>
                    Required Deliverables
                  </Text>
                  <View style={styles.brandDeliverablesList}>
                    <View style={styles.brandDeliverableItem}>
                      <Text style={styles.deliverableCheckIcon}>✓</Text>
                      <Text style={[styles.deliverableText, isDark && styles.textWhite]}>
                        1x Dedicated Reel/TikTok (45-60s) reviewing 3 food vendors
                      </Text>
                    </View>
                    <View style={styles.brandDeliverableItem}>
                      <Text style={styles.deliverableCheckIcon}>✓</Text>
                      <Text style={[styles.deliverableText, isDark && styles.textWhite]}>
                        Tag <Text style={{ fontWeight: '800', color: '#582CDB' }}>@lagosfoodfest</Text> & use #PostStreakPartner
                      </Text>
                    </View>
                    <View style={styles.brandDeliverableItem}>
                      <Text style={styles.deliverableCheckIcon}>✓</Text>
                      <Text style={[styles.deliverableText, isDark && styles.textWhite]}>
                        Submit post link within 7 days of accepting
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Suggested Hook */}
                <View style={styles.brandBriefHookBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13 }}>💡</Text>
                    <Text style={styles.brandBriefHookLabel}>AI Hook Suggestion</Text>
                  </View>
                  <Text style={styles.brandBriefHookQuote}>
                    "The 3 best food spots under $10 you cannot miss at Lagos Food Fest..."
                  </Text>
                </View>

                {/* Success Banner when Accepted */}
                {isBrandQuestAccepted && (
                  <View style={styles.brandBriefSuccessBox}>
                    <Text style={{ fontSize: 18 }}>🎉</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.brandBriefSuccessTitle}>Campaign Active & Escrow Locked</Text>
                      <Text style={styles.brandBriefSuccessSubtitle}>
                        Your $450 bounty is secured. Tag @lagosfoodfest and submit your link to claim payout.
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.brandBriefFooter}>
                <Pressable
                  style={({ pressed }) => [
                    styles.acceptBrandQuestBtn,
                    isBrandQuestAccepted && styles.startCampaignActiveBtn,
                    pressed && styles.missionButtonPressed,
                  ]}
                  onPress={() => {
                    if (isBrandQuestAccepted) {
                      setShowBrandQuestBriefModal(false);
                      if (onStartMission) onStartMission();
                      return;
                    }
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setIsBrandQuestAccepted(true);
                    showToast('🎉 Campaign Active! $450 Bounty escrow locked.');
                  }}
                >
                  <Text
                    style={styles.acceptBrandQuestBtnText}
                    numberOfLines={1}
                  >
                    {isBrandQuestAccepted ? 'Start Campaign ➔' : 'Accept $450 Bounty ➔'}
                  </Text>
                </Pressable>

                {isBrandQuestAccepted && (
                  <Pressable
                    style={({ pressed }) => [styles.closeBriefSecondaryBtn, pressed && styles.headerIconBtnPressed]}
                    onPress={() => setShowBrandQuestBriefModal(false)}
                    hitSlop={8}
                  >
                    <Text style={styles.closeBriefSecondaryText}>Close Brief</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* CREATOR PROFILE DEEP DIVE MODAL */}
        <CreatorProfileModal
          visible={showMatchedCreatorModal}
          onClose={() => setShowMatchedCreatorModal(false)}
          creator={DEFAULT_ELENA_PROFILE}
          onConnect={() => {
            setShowMatchedCreatorModal(false);
            if (onOpenMessages) {
              onOpenMessages();
            } else if (onNavigateTab) {
              onNavigateTab('match');
            }
          }}
          onBuildCollabPlan={() => {
            setShowMatchedCreatorModal(false);
            if (onOpenMessages) {
              onOpenMessages();
            } else if (onNavigateTab) {
              onNavigateTab('match');
            }
          }}
        />

        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => {
            if (onSaveProfile) onSaveProfile(updated);
            setSelectedAvatarId(updated.avatarId);
          }}
        />

        {/* 13. SWIPEABLE STREAK CALENDAR MODAL */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.calendarModalOverlay}>
            <Animated.View
              style={[
                styles.calendarModalCard,
                { transform: [{ scale: calendarModalScale }] },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.calendarModalHeader}>
                <View style={styles.calendarModalTitleGroup}>
                  <Text style={styles.calendarModalMainTitle}>Streak Calendar 2024</Text>
                  <Text style={styles.calendarModalSubtitle}>Swipe naturally to browse across months</Text>
                </View>

                <Pressable
                  onPress={() => setShowCalendarModal(false)}
                  style={({ pressed }) => [styles.calendarCloseButton, pressed && styles.headerIconBtnPressed]}
                  hitSlop={8}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6L18 18" stroke="#1A1626" strokeWidth="2.4" strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* Scrollable Calendar Body */}
              <ScrollView
                style={styles.calendarModalScroll}
                contentContainerStyle={styles.calendarModalScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {/* Horizontal Month Chips (Jan -> Dec) - Synchronized with Swipe */}
                <ScrollView
                  ref={monthChipsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthChipsContainer}
                >
                  {CALENDAR_DATA_CHRONOLOGICAL.map((m, idx) => {
                    const isSelected = selectedMonthIndex === idx;
                    return (
                      <Pressable
                        key={`chip_${m.id}`}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          scrollToMonth(idx);
                        }}
                        style={({ pressed }) => [
                          styles.monthChipPill,
                          isSelected && styles.monthChipPillActive,
                          pressed && styles.monthChipPillPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthChipText,
                            isSelected && styles.monthChipTextActive,
                          ]}
                        >
                          {m.monthName.slice(0, 3)}
                        </Text>
                        {m.isCurrent && (
                          <View style={[styles.monthChipCurrentDot, isSelected && styles.monthChipCurrentDotActive]} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* SWIPEABLE HORIZONTAL PAGER FOR ALL MONTHS */}
                <View
                  style={styles.pagerOuterContainer}
                  onLayout={(e) => {
                    const measuredWidth = Math.floor(e.nativeEvent.layout.width - 16);
                    if (measuredWidth > 0 && Math.abs(measuredWidth - pagerWidth) > 1) {
                      setPagerWidth(measuredWidth);
                    }
                  }}
                >
                  {/* Month Navigator Header with ‹ and › buttons */}
                  <View style={styles.monthNavHeader}>
                    <Pressable
                      onPress={handlePrevMonth}
                      disabled={selectedMonthIndex === 0}
                      style={({ pressed }) => [
                        styles.monthNavChevronBtn,
                        selectedMonthIndex === 0 && styles.monthNavChevronDisabled,
                        pressed && styles.headerIconBtnPressed,
                      ]}
                      hitSlop={8}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M15 18L9 12L15 6" stroke={selectedMonthIndex === 0 ? '#C4B5FD' : '#582CDB'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </Pressable>

                    <View style={styles.monthNameTitleGroup}>
                      <Text style={styles.focusedMonthTitle}>
                        {CALENDAR_DATA_CHRONOLOGICAL[selectedMonthIndex].monthName} 2024
                      </Text>
                      {CALENDAR_DATA_CHRONOLOGICAL[selectedMonthIndex].isCurrent && (
                        <View style={styles.currentMonthBadge}>
                          <Text style={styles.currentMonthBadgeText}>CURRENT 🔥</Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={handleNextMonth}
                      disabled={selectedMonthIndex === CALENDAR_DATA_CHRONOLOGICAL.length - 1}
                      style={({ pressed }) => [
                        styles.monthNavChevronBtn,
                        selectedMonthIndex === CALENDAR_DATA_CHRONOLOGICAL.length - 1 && styles.monthNavChevronDisabled,
                        pressed && styles.headerIconBtnPressed,
                      ]}
                      hitSlop={8}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M9 18L15 12L9 6" stroke={selectedMonthIndex === CALENDAR_DATA_CHRONOLOGICAL.length - 1 ? '#C4B5FD' : '#582CDB'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </Pressable>
                  </View>

                  {/* Day of Week Headers */}
                  <View style={[styles.calendarDayNamesRow, { width: pagerWidth }]}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, dIdx) => (
                      <Text key={`dn_${dIdx}`} style={styles.calendarDayNameText}>
                        {dayName}
                      </Text>
                    ))}
                  </View>

                  {/* Active Month Calendar Grid */}
                  <View style={[styles.monthPageCard, { width: '100%' }]}>
                    <View style={styles.calendarMonthGrid}>
                      {Array.from({ length: Math.ceil((CALENDAR_DATA_CHRONOLOGICAL[selectedMonthIndex].daysCount + CALENDAR_DATA_CHRONOLOGICAL[selectedMonthIndex].startOffset) / 7) * 7 }).map((_, cellIdx) => {
                        const currentMonth = CALENDAR_DATA_CHRONOLOGICAL[selectedMonthIndex];
                        const dayNum = cellIdx - currentMonth.startOffset + 1;
                        const isValidDay = dayNum >= 1 && dayNum <= currentMonth.daysCount;

                        if (!isValidDay) {
                          return <View key={`empty_${cellIdx}`} style={styles.calendarCellEmpty} />;
                        }

                        const isCompleted = currentMonth.completedDays.includes(dayNum);
                        const isScheduled = currentMonth.scheduledDays.includes(dayNum);
                        const isFreeze = currentMonth.freezeDays.includes(dayNum);

                        return (
                          <Pressable
                            key={`day_${dayNum}`}
                            onPress={() => handleDayPress(dayNum, currentMonth)}
                            style={({ pressed }) => [
                              styles.calendarCell,
                              isCompleted && styles.calendarCellCompleted,
                              isScheduled && styles.calendarCellScheduled,
                              isFreeze && styles.calendarCellFreeze,
                              pressed && styles.calendarCellPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.calendarCellDayNumber,
                                isCompleted && styles.calendarCellTextCompleted,
                                isScheduled && styles.calendarCellTextScheduled,
                                isFreeze && styles.calendarCellTextFreeze,
                              ]}
                            >
                              {dayNum}
                            </Text>

                            {isCompleted && (
                              <Text style={styles.cellMiniIcon}>✓</Text>
                            )}
                            {isScheduled && (
                              <Text style={styles.cellMiniIconScheduled}>⏰</Text>
                            )}
                            {isFreeze && (
                              <Text style={styles.cellMiniIconFreeze}>❄️</Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Calendar Legend */}
                <View style={styles.calendarLegendBox}>
                  <View style={styles.legendItemsGrid}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#582CDB' }]} />
                      <Text style={styles.legendLabel}>Streak Posted (✓)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#DDD6FE' }]} />
                      <Text style={styles.legendLabel}>Scheduled (⏰)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#93C5FD' }]} />
                      <Text style={styles.legendLabel}>Streak Freeze (❄️)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#FAF8FF', borderWidth: 1, borderColor: '#ECE6F6' }]} />
                      <Text style={styles.legendLabel}>Rest Day</Text>
                    </View>
                  </View>
                </View>

                {/* Compact Apple-style Jarvis Contextual Intelligence Panel */}
                {selectedDayInfo && (
                  <View style={styles.jarvisContextCard}>
                    <View style={styles.jarvisContextHeader}>
                      <Text style={styles.jarvisContextFlame}>🔥</Text>
                      <Text style={styles.jarvisContextTitle}>Jarvis Intelligence</Text>
                    </View>
                    <Text style={styles.jarvisContextDateLine}>
                      {selectedDayInfo.date} · <Text style={styles.jarvisContextStatusHighlight}>{selectedDayInfo.headline}</Text>
                    </Text>
                    <Text style={styles.jarvisContextDescription}>
                      {selectedDayInfo.description}
                    </Text>
                  </View>
                )}

                {/* Modal Footer Done Button */}
                <Pressable
                  onPress={() => setShowCalendarModal(false)}
                  style={({ pressed }) => [
                    styles.calendarDoneButton,
                    { marginTop: selectedDayInfo ? 12 : 16 },
                    pressed && styles.missionButtonPressed,
                  ]}
                >
                  <Text style={styles.calendarDoneButtonText}>Done  ✓</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* 14. MISSION DETAILS MODAL */}
        <Modal
          visible={showMissionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMissionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalCard,
                { transform: [{ scale: modalPopScale }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.modalPureStarWrapper,
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
                  style={styles.modalPureStarImage}
                  resizeMode="contain"
                />
              </Animated.View>

              <Text style={styles.modalTitle}>Mission 1: The Reel Hook 🚀</Text>
              <Text style={styles.modalText}>
                Create a 15-second high-energy Reel sharing your creator journey hook. Post before 11:30 AM to build your{' '}
                <Text style={styles.modalBold}>1-Day Streak</Text>!
              </Text>

              <Pressable
                onPress={() => setShowMissionModal(false)}
                style={({ pressed }) => [styles.modalActionButton, pressed && styles.modalActionButtonPressed]}
              >
                <Text style={styles.modalActionButtonText}>Let&apos;s Create  ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* 15. JARVIS PRO UPGRADE MODAL */}
        <Modal
          visible={showProModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalCard,
                { transform: [{ scale: modalPopScale }] },
              ]}
            >
              <Text style={styles.proBadgeModal}>⚡ JARVIS PRO</Text>
              <Text style={styles.modalTitle}>Unlock Creator Superpowers</Text>
              <Text style={styles.modalText}>
                Includes AI voice cloning, smart scheduling algorithms, automated collaboration matching, and access to $500+ brand bounties.
              </Text>

              <Pressable
                onPress={() => {
                  setShowProModal(false);
                  if (onOpenJarvisPro) onOpenJarvisPro();
                }}
                style={({ pressed }) => [styles.modalGoldButton, pressed && styles.modalGoldButtonPressed]}
              >
                <Text style={styles.modalGoldButtonText}>Explore Pro Suite ➔</Text>
              </Pressable>

              <Pressable onPress={() => setShowProModal(false)} hitSlop={8}>
                <Text style={styles.modalDismissText}>Maybe Later</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* Dynamic Toast Popup Notification */}
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

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sPadding(14),
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FAF8F5',
    width: '100%',
    maxWidth: '100%',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  headerLogoWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    flexShrink: 0,
  },
  headerGhostLogo: {
    width: 24,
    height: 24,
  },
  proPillBtn: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 1,
  },
  proPillBtnText: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  notificationDot: {
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
  profilePhotoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  profilePhotoBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#582CDB',
  },
  headerCustomAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  addPhotoPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#582CDB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoPlusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 11,
  },

  // 2. SCROLL CONTENT & HERO
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 135,
  },
  focusHeroSection: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  focusPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  focusLiveDotDark: {
    backgroundColor: '#A78BFA',
  },
  focusTagText: {
    color: '#582CDB',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  focusTagTextDark: {
    color: '#A78BFA',
  },
  nextPostCountdown: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F7894',
    letterSpacing: -0.1,
  },
  nextPostCountdownDark: {
    color: '#A39BB5',
  },
  focusHeadline: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 4.5vw, 19px)' as any) : 17.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' as any } : {}),
  },
  streakMotivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -2,
  },
  streakMotivationFlame: {
    fontSize: 14,
  },
  streakMotivationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5E576E',
    letterSpacing: -0.1,
  },
  streakMotivationTextDark: {
    color: '#A39BB5',
  },
  streakMotivationHighlight: {
    fontWeight: '700',
    color: '#582CDB',
  },

  // 3. REFINED GLASS CARDS
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  streakStatusPill: {
    backgroundColor: 'rgba(88, 44, 219, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
    paddingVertical: 2.5,
    paddingHorizontal: 7.5,
    borderRadius: 6,
  },
  streakStatusPillDark: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  streakStatusHighlight: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#582CDB',
    letterSpacing: -0.1,
  },
  streakStatusHighlightDark: {
    color: '#A78BFA',
  },

  // 4. CALENDAR HEATMAP (APPLE HEALTH STYLE)
  calendarMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F7894',
    letterSpacing: -0.1,
  },
  monthLabelDark: {
    color: '#9CA3AF',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 6,
    width: '100%',
  },
  dayColHeader: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8E869E',
    flex: 1,
    maxWidth: 32,
    textAlign: 'center',
  },
  heatmapGrid: {
    gap: 5,
    width: '100%',
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  heatmapCell: {
    flex: 1,
    maxWidth: 32,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1.5,
  },
  heatmapCellCompleted: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  heatmapCellScheduled: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.22)',
  },
  heatmapCellFreeze: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  heatmapCellEmpty: {
    backgroundColor: 'rgba(23, 20, 32, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.04)',
  },
  jarvisContextCard: {
    backgroundColor: 'rgba(88, 44, 219, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  jarvisContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  jarvisContextFlame: {
    fontSize: 12,
  },
  jarvisContextTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.2,
  },
  jarvisContextDateLine: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  jarvisContextStatusHighlight: {
    fontWeight: '600',
    color: '#582CDB',
  },
  jarvisContextDescription: {
    fontSize: 11.5,
    color: '#5E576E',
    lineHeight: 16,
  },
  jarvisStreakInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
    gap: 10,
  },
  jarvisFlameWrapper: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameImage: {
    width: 28,
    height: 28,
  },
  jarvisInsightText: {
    flex: 1,
    fontSize: 12.5,
    color: '#5E576E',
    lineHeight: 18,
  },
  jarvisInsightBold: {
    fontWeight: '700',
    color: '#171420',
  },

  // 5. SCHEDULED POSTS VELOCITY
  scheduledHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduledLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  calendarIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(88, 44, 219, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduledTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: 0.6,
  },
  scheduleInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  scheduleInfoBtnPressed: {
    opacity: 0.5,
  },
  scheduleInfoBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#582CDB',
    letterSpacing: -0.1,
  },
  scheduleInfoBtnTextDark: {
    color: '#A78BFA',
  },
  scheduledMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  postsMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  postsCountBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.8,
  },
  postsCountLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5E576E',
  },
  weekIncreaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekIncreaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#582CDB',
    letterSpacing: -0.1,
  },
  weekIncreaseTextDark: {
    color: '#A78BFA',
  },
  nextUpBox: {
    backgroundColor: '#FAF9FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
    marginBottom: 16,
  },
  nextUpLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nextUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextUpDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171420',
  },
  nextUpTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  weeklyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyProgressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.5,
  },
  weeklyProgressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  weeklySegmentsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weeklySegment: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  weeklySegmentFilled: {
    backgroundColor: '#582CDB',
  },

  // 6. CREATOR LEVEL & QUEST
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelGoldPill: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  levelGoldPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  levelNameHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  trophyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 16,
  },
  levelDescription: {
    fontSize: 13,
    color: '#5E576E',
    lineHeight: 19,
    marginBottom: 16,
  },
  goldTextBold: {
    fontWeight: '700',
    color: '#D97706',
  },
  xpLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  xpTarget: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E869E',
  },
  xpProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
    overflow: 'hidden',
    marginBottom: 18,
  },
  xpProgressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  missionButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  missionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  missionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  // 7. ACTIVE BRAND QUEST CARD
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  questCardDark: {
    backgroundColor: '#1C1924',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  questThumbnailBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFBEB',
  },
  questThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  questContentGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  activeQuestTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activeQuestTagTextAccepted: {
    color: '#059669',
  },
  questTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },
  questSubtext: {
    fontSize: 12,
    color: '#5E576E',
    marginTop: 1,
  },
  bountyRewardBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  bountyAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  bountySubLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  questCardAccepted: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: '#FAFFFD',
  },
  activeCampaignLivePill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeCampaignLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.2,
  },
  cardCampaignActionBtn: {
    backgroundColor: '#EDE8FC',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginTop: 2,
  },
  cardCampaignActionBtnActive: {
    backgroundColor: '#ECFDF5',
  },
  cardCampaignActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  cardCampaignActionTextActive: {
    color: '#059669',
  },

  // 8. CREATOR MATCH COLLABORATION
  matchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },
  creatorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  creatorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F4F0FF',
  },
  creatorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  creatorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  creatorPlatformBadge: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorFollowers: {
    fontSize: 12,
    color: '#5E576E',
    fontWeight: '500',
  },
  whyMatchBox: {
    backgroundColor: '#FAF9FF',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
    marginBottom: 14,
  },
  whyMatchBoxDark: {
    backgroundColor: '#1C1924',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  whyMatchPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  whyMatchText: {
    fontSize: 12,
    color: '#5E576E',
    lineHeight: 16.5,
  },
  connectMatchButton: {
    backgroundColor: '#582CDB',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
  },
  connectMatchButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  // 9. PRO UPGRADE CARD
  proCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
  },
  proCardDark: {
    backgroundColor: '#1C1924',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  proIconImage: {
    width: 32,
    height: 32,
  },
  proTitleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  proTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },
  proDescription: {
    fontSize: 13,
    color: '#5E576E',
    lineHeight: 18.5,
    marginBottom: 16,
  },
  metallicGoldUpgradeBtn: {
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#D8920F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  metallicGoldGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metallicGoldUpgradeBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  upgradeButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  // 10. GLASS BOTTOM NAVIGATION BAR
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconWrapper: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // 11. NOTIFICATION CENTER MODAL
  notifModalCard: {
    width: '100%',
    maxWidth: 345,
    maxHeight: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    paddingTop: sPadding(18),
    paddingHorizontal: sPadding(14),
    paddingBottom: sPadding(14),
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  notifHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifModalMainTitle: {
    fontSize: sFont(18),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
  },
  unreadCountBadge: {
    backgroundColor: '#582CDB',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  unreadCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  notifFilterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243, 238, 251, 0.8)',
    width: '100%',
  },
  notifFiltersRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    flexShrink: 1,
  },
  notifFilterPill: {
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    flexShrink: 0,
  },
  notifFilterPillActive: {
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderColor: '#582CDB',
  },
  notifFilterText: {
    fontSize: sFont(10),
    fontWeight: '600',
    color: '#7F7894',
  },
  notifFilterTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  markAllReadText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#582CDB',
    flexShrink: 0,
  },
  notifScrollView: {
    maxHeight: 360,
    marginBottom: 14,
  },
  notifScrollContent: {
    paddingBottom: 4,
    paddingRight: 1,
  },
  emptyNotifBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 4,
  },
  emptyNotifEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyNotifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  emptyNotifSubtitle: {
    fontSize: 12,
    color: '#7F7894',
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(250, 248, 255, 0.75)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.8)',
    gap: 10,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(221, 214, 254, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  notifIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIconEmoji: {
    fontSize: 16,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    marginRight: 6,
  },
  notifTime: {
    fontSize: 11,
    color: '#9E97AA',
    fontWeight: '500',
  },
  notifBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifActionRow: {
    marginTop: 2,
  },
  notifActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  notifUnreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },

  // Compact Notification Cards (for Lower-Priority / Informational Updates)
  notifCardCompact: {
    flexDirection: 'row',
    backgroundColor: 'rgba(250, 248, 255, 0.6)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.7)',
    gap: 9,
    alignItems: 'center',
    position: 'relative',
  },
  notifCardCompactUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(221, 214, 254, 0.8)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notifIconBadgeCompact: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifIconEmojiCompact: {
    fontSize: 13,
  },
  notifContentCompact: {
    flex: 1,
  },
  notifTitleRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitleCompact: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    marginRight: 6,
  },
  notifTimeCompact: {
    fontSize: 10.5,
    color: '#9E97AA',
    fontWeight: '500',
  },
  notifBodyCompact: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14.5,
  },
  notifUnreadDotCompact: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#582CDB',
  },
  notifCardCompactExpanded: {
    backgroundColor: '#FFFFFF',
    borderColor: '#7C3AED',
    paddingVertical: 11,
    paddingHorizontal: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'flex-start',
  },
  notifBodyCompactExpanded: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
    marginTop: 4,
  },
  notifExpandedFooter: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  notifExpandedHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },

  // BRAND QUEST BRIEF MODAL STYLES
  brandBriefModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  brandBriefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  brandBriefHeaderLeft: {
    flex: 1,
    paddingRight: 6,
  },
  brandBriefCloseBtn: {
    marginLeft: 6,
    alignSelf: 'flex-start',
  },
  brandBriefTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  brandVerifiedPill: {
    backgroundColor: '#EDE8FC',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  brandVerifiedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  escrowBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  escrowBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  brandBriefMainTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  brandBriefSubTitle: {
    fontSize: 11.5,
    color: '#7F7894',
    marginTop: 2,
  },
  brandBriefBountyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  brandBriefBountyLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  brandBriefBountyAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
    letterSpacing: -0.5,
  },
  brandBriefBountySub: {
    fontSize: 10.5,
    color: '#FDE68A',
    fontWeight: '700',
    marginTop: 2,
  },
  brandBriefBountyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBriefSectionBox: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 8,
  },
  brandBriefSectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  brandBriefBodyText: {
    fontSize: 11.5,
    color: '#524C62',
    lineHeight: 16,
  },
  brandDeliverablesList: {
    gap: 6,
  },
  brandDeliverableItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  deliverableCheckIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    marginTop: 1,
  },
  deliverableText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
    lineHeight: 15.5,
  },
  brandBriefHookBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 11,
    marginBottom: 8,
  },
  brandBriefHookLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  brandBriefHookQuote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#78350F',
    lineHeight: 15.5,
  },
  brandBriefSuccessBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBriefSuccessTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  brandBriefSuccessSubtitle: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 15,
  },
  brandBriefFooter: {
    marginTop: 6,
  },
  acceptBrandQuestBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  acceptBrandQuestBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    borderColor: '#34D399',
    borderWidth: 1,
  },
  startCampaignActiveBtn: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
  },
  acceptBrandQuestBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  acceptBrandQuestBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  closeBriefSecondaryBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBriefSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7F7894',
  },

  // ELENA ROSTOVA CREATOR PROFILE MODAL STYLES
  creatorDetailModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  creatorModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  creatorHeaderAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  creatorModalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  creatorOnlineDot: {
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
  creatorHeaderInfo: {
    flex: 1,
  },
  creatorHeaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  creatorModalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  verifiedCheckBadge: {
    backgroundColor: '#582CDB',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  creatorModalHandle: {
    fontSize: 11,
    color: '#7F7894',
    marginTop: 1,
  },
  creatorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  creatorLocationEmoji: {
    fontSize: 10,
  },
  creatorLocationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  matchSynergyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  matchScoreCol: {
    flex: 1,
  },
  matchScoreLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  matchScoreValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
    letterSpacing: -0.5,
  },
  matchScoreSub: {
    fontSize: 10.5,
    color: '#EDE8FC',
    fontWeight: '600',
    marginTop: 2,
  },
  matchScoreBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  creatorStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  creatorStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  creatorStatLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7F7894',
    marginTop: 1,
  },
  creatorStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2DBF2',
  },
  creatorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  creatorTagPill: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  creatorTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  collabIdeaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 2,
  },
  creatorModalFooter: {
    marginTop: 6,
  },

  // 12. PROFILE PHOTO UPLOAD MODAL
  photoModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoModalTitleGroup: {
    flex: 1,
  },
  photoModalMainTitle: {
    fontSize: 18.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
  },
  photoModalSubtitle: {
    fontSize: 12,
    color: '#7F7894',
    marginTop: 2,
  },
  largeAvatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  largeAvatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  largeAvatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#582CDB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorProfilePreviewName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#171420',
  },
  creatorProfilePreviewHandle: {
    fontSize: 12,
    color: '#7F7894',
    marginTop: 2,
  },
  uploadToastBanner: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
  },
  uploadToastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'center',
  },
  uploadActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  uploadActionCard: {
    flex: 1,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.85)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  uploadActionCardPressed: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderColor: '#582CDB',
    transform: [{ scale: 0.98 }],
  },
  uploadActionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadActionCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  uploadActionCardSubtext: {
    fontSize: 11,
    color: '#7F7894',
    textAlign: 'center',
  },
  presetAvatarsSection: {
    marginBottom: 16,
  },
  presetSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E97AA',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetAvatarTile: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  presetAvatarTileActive: {
    borderColor: '#582CDB',
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  presetAvatarTilePressed: {
    transform: [{ scale: 0.94 }],
  },
  presetAvatarThumb: {
    width: 44,
    height: 44,
  },
  presetCheckBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#582CDB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetCheckText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 11,
  },
  photoModalFooter: {
    gap: 8,
  },
  savePhotoPrimaryBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  savePhotoPrimaryBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  savePhotoPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  removePhotoBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  removePhotoBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#EF4444',
  },

  // 13. CALENDAR MODAL
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sPadding(14),
  },
  calendarModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    paddingTop: sPadding(16),
    paddingHorizontal: sPadding(14),
    paddingBottom: sPadding(12),
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    overflow: 'hidden',
  },
  calendarModalScroll: {
    flexGrow: 0,
  },
  calendarModalScrollContent: {
    paddingBottom: 4,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarModalTitleGroup: {
    flex: 1,
  },
  calendarModalMainTitle: {
    fontSize: sFont(18),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
  },
  calendarModalSubtitle: {
    fontSize: sFont(11),
    color: '#7F7894',
    marginTop: 1,
  },
  calendarCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
    width: '100%',
  },
  calendarStatCard: {
    flex: 1,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 3,
    alignItems: 'center',
    minWidth: 0,
  },
  calendarStatValue: {
    fontSize: sFont(11.5),
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
    textAlign: 'center',
  },
  calendarStatLabel: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'center',
  },
  monthChipsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  monthChipPill: {
    position: 'relative',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(243, 238, 251, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
  },
  monthChipPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  monthChipPillPressed: {
    opacity: 0.8,
  },
  monthChipText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#7F7894',
  },
  monthChipTextActive: {
    color: '#FFFFFF',
  },
  monthChipCurrentDot: {
    position: 'absolute',
    top: 4,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  monthChipCurrentDotActive: {
    backgroundColor: '#FBBF24',
    borderWidth: 0.8,
    borderColor: '#FFFFFF',
  },
  selectedDayBanner: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
  },
  selectedDayText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'center',
  },
  pagerOuterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  monthNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  monthNavChevronBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavChevronDisabled: {
    opacity: 0.35,
  },
  monthNameTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusedMonthTitle: {
    fontSize: sFont(14.5),
    fontWeight: '700',
    color: '#171420',
  },
  currentMonthBadge: {
    backgroundColor: '#582CDB',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  currentMonthBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  calendarDayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 0,
  },
  calendarDayNameText: {
    width: '14.28%',
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  pagerContent: {
    flexDirection: 'row',
  },
  monthPageCard: {
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  calendarMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 4,
  },
  calendarCell: {
    width: '13.4%',
    height: sPadding(36),
    borderRadius: 9,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: '0.44%',
  },
  calendarCellEmpty: {
    width: '13.4%',
    height: sPadding(36),
    marginHorizontal: '0.44%',
  },
  calendarCellCompleted: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarCellScheduled: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderColor: 'rgba(221, 214, 254, 0.9)',
  },
  calendarCellFreeze: {
    backgroundColor: 'rgba(224, 242, 254, 0.9)',
    borderColor: 'rgba(186, 230, 253, 0.9)',
  },
  calendarCellPressed: {
    transform: [{ scale: 0.92 }],
  },
  calendarCellDayNumber: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#171420',
  },
  calendarCellTextCompleted: {
    color: '#FFFFFF',
  },
  calendarCellTextScheduled: {
    color: '#582CDB',
  },
  calendarCellTextFreeze: {
    color: '#0284C7',
  },
  cellMiniIcon: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  cellMiniIconScheduled: {
    fontSize: 7.5,
    marginTop: 1,
  },
  cellMiniIconFreeze: {
    fontSize: 7.5,
    marginTop: 1,
  },
  calendarLegendBox: {
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 14,
    padding: sPadding(8),
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.85)',
    marginBottom: 10,
  },
  legendItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '47%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: sFont(9.5),
    fontWeight: '600',
    color: '#524C62',
  },
  calendarDoneButton: {
    backgroundColor: '#582CDB',
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 2,
  },
  calendarDoneButtonText: {
    color: '#FFFFFF',
    fontSize: sFont(13.5),
    fontWeight: '700',
  },

  // 14. PRO MODAL & GENERAL MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  modalPureStarWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPureStarImage: {
    width: 56,
    height: 56,
  },
  proBadgeModal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4A038',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  modalText: {
    fontSize: 13,
    color: '#524C62',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalBold: {
    fontWeight: '700',
    color: '#582CDB',
  },
  modalActionButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalGoldButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E5A51C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalGoldButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  modalGoldButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalDismissText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7F7894',
    marginTop: 4,
  },

  dashboardCardDark: {
    backgroundColor: '#161224',
    borderColor: '#2B2342',
    shadowColor: '#000000',
  },
  headerIconBtnDark: {
    backgroundColor: '#1C172C',
    borderColor: '#2B2342',
  },
  textWhite: {
    color: '#F8FAFC',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
