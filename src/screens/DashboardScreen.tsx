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

interface DashboardScreenProps {
  onLogout?: () => void;
  onStartMission?: () => void;
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

  // Profile Photo State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [previewAvatarId, setPreviewAvatarId] = useState<string | null>('ghost');
  const [uploadToastMessage, setUploadToastMessage] = useState<string | null>(null);

  const [selectedDayInfo, setSelectedDayInfo] = useState<string | null>(null);
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
    if (month.completedDays.includes(day)) {
      setSelectedDayInfo(`🔥 ${month.monthName} ${day}: Reel Posted (Streak Maintained)`);
    } else if (month.scheduledDays.includes(day)) {
      setSelectedDayInfo(`⏰ ${month.monthName} ${day}: Scheduled Reel at 11:30 AM`);
    } else if (month.freezeDays.includes(day)) {
      setSelectedDayInfo(`❄️ ${month.monthName} ${day}: Protected with Streak Freeze`);
    } else {
      setSelectedDayInfo(`⚪ ${month.monthName} ${day}: Creator Rest Day`);
    }
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

  // Streak grid dataset matching the May 2024 reference
  const streakGrid = [
    [false, false, true, true, true, true],
    [true, true, true, true, true, true],
    [false, false, false, false, false, false],
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            >
              <View style={{ backgroundColor: '#EDE9FE', borderColor: '#C4B5FD', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#582CDB', letterSpacing: 0.5 }}>🔒 FREE (TAP FOR PRO)</Text>
              </View>
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
              <View style={styles.focusTag}>
                <View style={styles.focusLiveDot} />
                <Text style={styles.focusTagText}>TODAY&apos;S FOCUS</Text>
              </View>
              <Text style={styles.nextPostCountdown}>Next post in 2h 45m</Text>
            </View>

            <Text style={[styles.focusHeadline, isDark && styles.textWhite]}>Post 1 Reel to protect your streak</Text>

            {/* Status Pills */}
            <View style={styles.statusPillsRow}>
              <View style={styles.levelPillBadge}>
                <Text style={styles.levelPillBadgeText}>Level 42</Text>
              </View>

              <View style={styles.streakPillBadge}>
                <Animated.Text
                  style={[
                    styles.streakPillFire,
                    { transform: [{ scale: flamePulse }] },
                  ]}
                >
                  🔥
                </Animated.Text>
                <Text style={styles.streakPillBadgeText}>47-Day Streak</Text>
              </View>

              <View style={styles.nextPostPillBadge}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="2.2" />
                  <Path d="M12 6V12L16 14" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" />
                </Svg>
                <Text style={styles.nextPostPillBadgeText}>11:30 AM</Text>
              </View>
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
              <View style={styles.cardTitleGroup}>
                <Text style={[styles.cardSectionTitle, isDark && styles.textWhite]}>Your Streak</Text>
                <Text style={styles.streakSubtext}>Consistency is key 🔗 (Tap to swipe full calendar)</Text>
              </View>

              <View style={styles.streakCountBadge}>
                <Text style={styles.streakCountNumber}>47-Day Streak</Text>
                <Animated.Text
                  style={[
                    styles.streakFireEmoji,
                    { transform: [{ scale: flamePulse }] },
                  ]}
                >
                  🔥
                </Animated.Text>
              </View>
            </View>

            {/* Month Header & Days of Week */}
            <View style={styles.calendarMetaRow}>
              <Text style={styles.monthLabel}>MAY 2024  ›</Text>
              <Text style={styles.streakStatusHighlight}>96% Consistent</Text>
            </View>

            <View style={styles.daysHeaderRow}>
              {['M', '·', 'W', 'T', 'F', '·'].map((d, idx) => (
                <Text key={`day_h_${idx}`} style={styles.dayColHeader}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar Heatmap Grid */}
            <View style={styles.heatmapGrid}>
              {streakGrid.map((row, rIdx) => (
                <View key={`row_${rIdx}`} style={styles.heatmapRow}>
                  {row.map((active, cIdx) => (
                    <View
                      key={`cell_${rIdx}_${cIdx}`}
                      style={[
                        styles.heatmapCell,
                        active && styles.heatmapCellActive,
                      ]}
                    >
                      {active && (
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 6L9 17L4 12"
                            stroke="#FFFFFF"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Jarvis Insight Banner inside Streak Card */}
            <View style={styles.jarvisStreakInsight}>
              <Animated.View
                style={[
                  styles.jarvisFlameWrapper,
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
                  style={styles.jarvisFlameImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={styles.jarvisInsightText}>
                <Text style={styles.jarvisInsightBold}>Jarvis Insight: </Text>
                Your streak is strong. Tap calendar to swipe across all months.
              </Text>
            </View>
          </Pressable>

          {/* 5. CARD 2: SCHEDULED POSTS VELOCITY */}
          <View style={styles.dashboardCard}>
            <View style={styles.scheduledHeaderRow}>
              <View style={styles.scheduledLabelGroup}>
                <View style={styles.calendarIconBox}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#582CDB" strokeWidth="2.2" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.scheduledTitle}>SCHEDULED</Text>
                <View style={styles.scheduledTimePill}>
                  <Text style={styles.scheduledTimeText}>11:30 AM</Text>
                </View>
              </View>

              {/* Info / Open Schedule Details Button */}
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
                style={({ pressed }) => [styles.scheduleInfoBtn, pressed && styles.headerIconBtnPressed]}
                hitSlop={8}
              >
                <Text style={styles.scheduleInfoBtnText}>View Schedule ➔</Text>
              </Pressable>
            </View>

            <View style={styles.scheduledMetricsContainer}>
              <View style={styles.postsMetricRow}>
                <Text style={styles.postsCountBig}>03</Text>
                <Text style={styles.postsCountLabel}>Posts Ready</Text>
              </View>

              <View style={styles.weekIncreaseBadge}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke="#582CDB" strokeWidth="2.2" />
                  <Path d="M12 6V12L16 14" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" />
                </Svg>
                <Text style={styles.weekIncreaseText}>+2 this week</Text>
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

          {/* 6. CARD 3: CREATOR LEVEL & QUEST ("Elite Storyteller") */}
          <View style={styles.dashboardCard}>
            <View style={styles.levelCardHeader}>
              <View style={styles.levelBadgeGroup}>
                <View style={styles.levelGoldPill}>
                  <Text style={styles.levelGoldPillText}>LEVEL 42</Text>
                </View>
                <Text style={styles.levelNameHeading}>Elite Storyteller</Text>
              </View>
              <View style={styles.trophyIconBox}>
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>
            </View>

            <Text style={styles.levelDescription}>
              Publish 1 high impact Reel today to unlock <Text style={styles.goldTextBold}>Level 43</Text> rewards.
            </Text>

            {/* XP Progress Bar */}
            <View style={styles.xpLabelsRow}>
              <Text style={styles.xpCurrent}>2,450 XP</Text>
              <Text style={styles.xpTarget}>3,000 XP</Text>
            </View>

            <View style={styles.xpProgressBarBg}>
              <View style={[styles.xpProgressBarFill, { width: '82%' }]} />
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
              <Text style={styles.missionButtonText}>Start First Mission  🚀</Text>
            </Pressable>
          </View>

          {/* 7. CARD 3: ACTIVE BRAND QUEST ("Lagos Food Festival") */}
          <View style={styles.questCard}>
            <View style={styles.questTargetIconBox}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#582CDB" strokeWidth="2.2" />
                <Circle cx="12" cy="4.5" fill="#582CDB" />
              </Svg>
            </View>

            <View style={styles.questContentGroup}>
              <View style={styles.activeQuestTag}>
                <Text style={styles.activeQuestTagText}>ACTIVE QUEST</Text>
              </View>
              <Text style={styles.questTitle}>Lagos Food Festival</Text>
              <Text style={styles.questSubtext}>Review &amp; Vlog</Text>
            </View>

            <View style={styles.bountyPill}>
              <Text style={styles.bountyText}>$450 Bounty</Text>
            </View>
          </View>

          {/* 8. CARD 4: CREATOR MATCH VELOCITY */}
          <View style={styles.dashboardCard}>
            <View style={styles.matchHeaderRow}>
              <Text style={styles.matchSectionTitle}>Suggested Match</Text>
              <View style={styles.growthActionPill}>
                <Text style={styles.growthActionText}>GROWTH ACTION</Text>
              </View>
            </View>

            {/* Creator Profile Row */}
            <View style={styles.creatorProfileRow}>
              <View style={styles.creatorAvatarBox}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }}
                  style={styles.creatorAvatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>Elena Rostova</Text>
                <Text style={styles.creatorFollowers}>Tech &amp; Design • 42.8k Followers</Text>
              </View>
            </View>

            {/* Why This Match Box */}
            <View style={styles.whyMatchBox}>
              <Text style={styles.whyMatchSparkle}>✨</Text>
              <Text style={styles.whyMatchText}>
                <Text style={styles.whyMatchBold}>Why this match? </Text>
                94% Niche Synergy, matching daily posting pace, and open for squads.
              </Text>
            </View>

            {/* Connect & View Match Button */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onNavigateTab) {
                  onNavigateTab('match');
                }
              }}
              style={({ pressed }) => [
                styles.connectMatchGradientWrap,
                pressed && styles.connectMatchButtonPressed,
              ]}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.connectMatchGradient}
              >
                <Text style={styles.connectMatchButtonText}>Connect &amp; View Creator Card ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 9. CARD 6: UNLOCK JARVIS PRO */}
          <View style={styles.proCard}>
            <View style={styles.proHeaderRow}>
              <View style={styles.proIconBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.proIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.proTitleGroup}>
                <Text style={styles.proTitle}>Unlock Jarvis Pro</Text>
                <View style={styles.goldProPillBadge}>
                  <Text style={styles.goldProPillText}>⚡ PRO SUITE</Text>
                </View>
              </View>
            </View>

            <Text style={styles.proDescription}>
              Get AI autonomous growth strategy, viral script generator, and priority matching.
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
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metallicGoldGradient}
              >
                <Text style={styles.metallicGoldUpgradeBtnText}>Upgrade to Pro ➔</Text>
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
                    <Text style={[styles.notifFilterText, notifFilter === 'all' && styles.notifFilterTextActive]}>
                      All ({notifications.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setNotifFilter('unread')}
                    style={[styles.notifFilterPill, notifFilter === 'unread' && styles.notifFilterPillActive]}
                  >
                    <Text style={[styles.notifFilterText, notifFilter === 'unread' && styles.notifFilterTextActive]}>
                      Unread ({unreadCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setNotifFilter('quests')}
                    style={[styles.notifFilterPill, notifFilter === 'quests' && styles.notifFilterPillActive]}
                  >
                    <Text style={[styles.notifFilterText, notifFilter === 'quests' && styles.notifFilterTextActive]}>
                      Quests
                    </Text>
                  </Pressable>
                </View>

                {unreadCount > 0 && (
                  <Pressable onPress={handleMarkAllNotifsRead} hitSlop={6}>
                    <Text style={styles.markAllReadText}>Mark all read</Text>
                  </Pressable>
                )}
              </View>

              {/* Scrollable Notification List */}
              <ScrollView
                style={styles.notifScrollView}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                {filteredNotifications.length === 0 ? (
                  <View style={styles.emptyNotifBox}>
                    <Text style={styles.emptyNotifEmoji}>✨</Text>
                    <Text style={styles.emptyNotifTitle}>All Caught Up!</Text>
                    <Text style={styles.emptyNotifSubtitle}>No notifications in this filter.</Text>
                  </View>
                ) : (
                  filteredNotifications.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleNotificationPress(item.id)}
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
                          <Text style={styles.notifTitle}>{item.title}</Text>
                          <Text style={styles.notifTime}>{item.time}</Text>
                        </View>
                        <Text style={styles.notifBody}>{item.body}</Text>

                        {/* Action Link if present */}
                        {item.actionText && (
                          <View style={styles.notifActionRow}>
                            <Text style={styles.notifActionLink}>{item.actionText}  ›</Text>
                          </View>
                        )}
                      </View>

                      {/* Unread Glow Dot */}
                      {item.unread && <View style={styles.notifUnreadDot} />}
                    </Pressable>
                  ))
                )}
              </ScrollView>

              {/* Modal Footer Done Button */}
              <Pressable
                onPress={() => setShowNotificationModal(false)}
                style={({ pressed }) => [styles.savePhotoPrimaryBtn, pressed && styles.savePhotoPrimaryBtnPressed]}
              >
                <Text style={styles.savePhotoPrimaryBtnText}>Done  ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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

              {/* Quick Stats Banner */}
              <View style={styles.calendarStatsRow}>
                <View style={styles.calendarStatCard}>
                  <Text style={styles.calendarStatValue}>47 Days 🔥</Text>
                  <Text style={styles.calendarStatLabel}>Current</Text>
                </View>
                <View style={styles.calendarStatCard}>
                  <Text style={styles.calendarStatValue}>52 Days 🏆</Text>
                  <Text style={styles.calendarStatLabel}>Best</Text>
                </View>
                <View style={styles.calendarStatCard}>
                  <Text style={styles.calendarStatValue}>96% ⚡</Text>
                  <Text style={styles.calendarStatLabel}>Consistency</Text>
                </View>
              </View>

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

              {/* Selected Day Toast/Info Banner */}
              {selectedDayInfo && (
                <View style={styles.selectedDayBanner}>
                  <Text style={styles.selectedDayText}>{selectedDayInfo}</Text>
                </View>
              )}

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

                {/* Swipeable ScrollView with Real-Time Instant Natural Swipe Tracking */}
                <ScrollView
                  ref={monthPagerRef}
                  horizontal
                  pagingEnabled={true}
                  directionalLockEnabled={true}
                  nestedScrollEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  onMomentumScrollEnd={handleScroll}
                  scrollEventThrottle={16}
                  bounces={true}
                  keyboardShouldPersistTaps="handled"
                  style={{ width: pagerWidth, overflow: 'hidden' }}
                  contentContainerStyle={styles.pagerContent}
                >
                  {CALENDAR_DATA_CHRONOLOGICAL.map((month) => {
                    const totalGridCells = month.daysCount + month.startOffset;
                    const totalRows = Math.ceil(totalGridCells / 7);

                    return (
                      <View
                        key={`page_${month.id}`}
                        style={[styles.monthPageCard, { width: pagerWidth }]}
                      >
                        <View style={styles.calendarMonthGrid}>
                          {Array.from({ length: totalRows * 7 }).map((_, cellIdx) => {
                            const dayNum = cellIdx - month.startOffset + 1;
                            const isValidDay = dayNum >= 1 && dayNum <= month.daysCount;

                            if (!isValidDay) {
                              return <View key={`empty_${cellIdx}`} style={styles.calendarCellEmpty} />;
                            }

                            const isCompleted = month.completedDays.includes(dayNum);
                            const isScheduled = month.scheduledDays.includes(dayNum);
                            const isFreeze = month.freezeDays.includes(dayNum);

                            return (
                              <Pressable
                                key={`day_${dayNum}`}
                                onPress={() => handleDayPress(dayNum, month)}
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
                    );
                  })}
                </ScrollView>
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

              {/* Modal Footer Done Button */}
              <Pressable
                onPress={() => setShowCalendarModal(false)}
                style={({ pressed }) => [styles.calendarDoneButton, pressed && styles.missionButtonPressed]}
              >
                <Text style={styles.calendarDoneButtonText}>Done  ✓</Text>
              </Pressable>
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
                Create a 15-second high-energy Reel sharing your creator journey hook. Post before 11:30 AM to maintain your{' '}
                <Text style={styles.modalBold}>47-Day Streak</Text>!
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
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  addPhotoPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
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
    marginBottom: 10,
  },
  focusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#582CDB',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 5,
  },
  focusLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
  },
  focusTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  nextPostCountdown: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  focusHeadline: {
    fontSize: 23,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 14,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelPillBadge: {
    backgroundColor: 'rgba(254, 243, 199, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  levelPillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  streakPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 232, 252, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 4,
  },
  streakPillFire: {
    fontSize: 13,
  },
  streakPillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  nextPostPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 5,
  },
  nextPostPillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },

  // 3. REFINED GLASS CARDS
  dashboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 22,
    marginBottom: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  streakSubtext: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#7F7894',
    marginTop: 3,
  },
  streakCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.95)',
  },
  streakCountNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  streakFireEmoji: {
    fontSize: 15,
  },

  // 4. CALENDAR HEATMAP
  calendarMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  streakStatusHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  dayColHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E97AA',
    width: 42,
    textAlign: 'center',
  },
  heatmapGrid: {
    gap: 8,
    marginBottom: 18,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapCell: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(243, 238, 251, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapCellActive: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  jarvisStreakInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
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
    color: '#524C62',
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
    marginBottom: 16,
  },
  scheduledLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduledTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: 0.8,
  },
  scheduledTimePill: {
    backgroundColor: '#582CDB',
    borderRadius: 8,
    paddingVertical: 3.5,
    paddingHorizontal: 9,
  },
  scheduledTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleInfoBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  scheduleInfoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  scheduledMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  postsMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  postsCountBig: {
    fontSize: 36,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -1,
  },
  postsCountLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  weekIncreaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    borderRadius: 8,
    paddingVertical: 4.5,
    paddingHorizontal: 9,
    gap: 5,
  },
  weekIncreaseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  nextUpBox: {
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    marginBottom: 16,
  },
  nextUpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E97AA',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  nextUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextUpDay: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '800',
    color: '#9E97AA',
    letterSpacing: 0.6,
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
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
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
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    borderRadius: 6,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.9)',
  },
  levelGoldPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  levelNameHeading: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
  },
  trophyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 16,
  },
  levelDescription: {
    fontSize: 13,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 16,
  },
  goldTextBold: {
    fontWeight: '700',
    color: '#B45309',
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
    fontWeight: '600',
    color: '#9E97AA',
  },
  xpProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
    overflow: 'hidden',
    marginBottom: 18,
  },
  xpProgressBarFill: {
    height: '100%',
    backgroundColor: '#7C5CFC',
    borderRadius: 4,
  },
  missionButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  missionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  missionButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },

  // 7. ACTIVE BRAND QUEST CARD
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 18,
    marginBottom: 20,
    gap: 12,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  questTargetIconBox: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questContentGroup: {
    flex: 1,
  },
  activeQuestTag: {
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.8)',
  },
  activeQuestTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  questSubtext: {
    fontSize: 12,
    color: '#7F7894',
  },
  bountyPill: {
    backgroundColor: 'rgba(255, 251, 235, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.8)',
  },
  bountyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },

  // 8. CREATOR MATCH COLLABORATION
  matchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  matchSectionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
  },
  growthActionPill: {
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  growthActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  creatorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  creatorAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
  },
  creatorAvatarImage: {
    width: 46,
    height: 46,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  creatorFollowers: {
    fontSize: 12,
    color: '#7F7894',
  },
  whyMatchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    gap: 8,
    marginBottom: 14,
  },
  whyMatchSparkle: {
    fontSize: 14,
  },
  whyMatchText: {
    flex: 1,
    fontSize: 12,
    color: '#524C62',
    lineHeight: 17,
  },
  whyMatchBold: {
    fontWeight: '700',
    color: '#582CDB',
  },
  connectMatchButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  connectMatchGradientWrap: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  connectMatchGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  connectMatchButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // 9. PRO UPGRADE CARD
  goldProPillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 2,
  },
  goldProPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  metallicGoldUpgradeBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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
    color: '#171420',
    letterSpacing: -0.2,
  },
  proCard: {
    backgroundColor: 'rgba(247, 244, 253, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 20,
    marginBottom: 10,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  proIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  proIconImage: {
    width: 30,
    height: 30,
  },
  proTitleGroup: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
  },
  proSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  proDescription: {
    fontSize: 12.5,
    color: '#524C62',
    lineHeight: 18,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#D4A038',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A038',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
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
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
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
    fontSize: 20,
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
  },
  notifFiltersRow: {
    flexDirection: 'row',
    gap: 6,
  },
  notifFilterPill: {
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
  },
  notifFilterPillActive: {
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderColor: '#582CDB',
  },
  notifFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  notifFilterTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  markAllReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  notifScrollView: {
    maxHeight: 360,
    marginBottom: 14,
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
    padding: 16,
  },
  calendarModalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarModalTitleGroup: {
    flex: 1,
  },
  calendarModalMainTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
  },
  calendarModalSubtitle: {
    fontSize: 12,
    color: '#7F7894',
    marginTop: 2,
  },
  calendarCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  calendarStatCard: {
    flex: 1,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  calendarStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  calendarStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  monthChipsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  monthChipPill: {
    position: 'relative',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(243, 238, 251, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
  },
  monthChipPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  monthChipPillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  monthChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
  },
  selectedDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'center',
  },
  pagerOuterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  monthNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  monthNavChevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
    gap: 8,
  },
  focusedMonthTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
  },
  currentMonthBadge: {
    backgroundColor: '#582CDB',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  currentMonthBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  calendarDayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  calendarDayNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E97AA',
    width: '14.28%',
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
    rowGap: 6,
  },
  calendarCell: {
    width: '13.4%',
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: '0.44%',
  },
  calendarCellEmpty: {
    width: '13.4%',
    height: 42,
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
    fontSize: 12,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  cellMiniIconScheduled: {
    fontSize: 8,
    marginTop: 1,
  },
  cellMiniIconFreeze: {
    fontSize: 8,
    marginTop: 1,
  },
  calendarLegendBox: {
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.85)',
    marginBottom: 12,
  },
  legendItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '46%',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#524C62',
  },
  calendarDoneButton: {
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
  calendarDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    backgroundColor: '#D4A038',
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
