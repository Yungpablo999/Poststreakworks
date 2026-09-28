import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text, TextInput } from '../components/ui/AppText';
import { BrandLogo } from '../components/BrandLogo';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { CreatorStoryModal, CreatorStoryData } from '../components/CreatorStoryModal';
import { ProNotificationsModal, ProNotificationItem, DEFAULT_PRO_NOTIFICATIONS } from '../components/ProNotificationsModal';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

export const TinyGoldCheck = ({ size = 13 }: { size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#F59E0B',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6.2L4.8 8.5L9.5 3.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);


import { HeaderDualModePills, UserPersona } from '../components/HeaderDualModePills';

interface ProDashboardScreenProps {
  onLogout?: () => void;
  onStartMission?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenSchedule?: () => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onOpenQuests?: () => void;
  onOpenGrowth?: () => void;
  onOpenCreate?: () => void;
  onOpenVoiceStudio?: () => void;
  onSwitchToFree?: () => void;
  onTogglePersona?: () => void;
  userPersona?: UserPersona;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

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

const FULL_YEAR_CALENDAR: MonthData[] = [
  {
    id: 'jan',
    monthName: 'January',
    year: 2026,
    daysCount: 31,
    startOffset: 3,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'feb',
    monthName: 'February',
    year: 2026,
    daysCount: 28,
    startOffset: 6,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    scheduledDays: [],
    freezeDays: [14],
  },
  {
    id: 'mar',
    monthName: 'March',
    year: 2026,
    daysCount: 31,
    startOffset: 6,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'apr',
    monthName: 'April',
    year: 2026,
    daysCount: 30,
    startOffset: 2,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    scheduledDays: [],
    freezeDays: [8],
  },
  {
    id: 'may',
    monthName: 'May',
    year: 2026,
    daysCount: 31,
    startOffset: 4,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    scheduledDays: [],
    freezeDays: [11],
  },
  {
    id: 'jun',
    monthName: 'June',
    year: 2026,
    daysCount: 30,
    startOffset: 0,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'jul',
    monthName: 'July',
    year: 2026,
    daysCount: 31,
    startOffset: 2,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    scheduledDays: [],
    freezeDays: [18],
  },
  {
    id: 'aug',
    monthName: 'August',
    year: 2026,
    daysCount: 31,
    startOffset: 5,
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'sep',
    monthName: 'September',
    year: 2026,
    daysCount: 30,
    startOffset: 1,
    completedDays: [1, 2, 3, 4],
    scheduledDays: [8, 11, 15, 18, 22, 25, 29],
    freezeDays: [],
    isCurrent: true,
  },
  {
    id: 'oct',
    monthName: 'October',
    year: 2026,
    daysCount: 31,
    startOffset: 3,
    completedDays: [],
    scheduledDays: [2, 6, 9, 13, 16, 20, 23, 27, 30],
    freezeDays: [],
  },
  {
    id: 'nov',
    monthName: 'November',
    year: 2026,
    daysCount: 30,
    startOffset: 6,
    completedDays: [],
    scheduledDays: [],
    freezeDays: [],
  },
  {
    id: 'dec',
    monthName: 'December',
    year: 2026,
    daysCount: 31,
    startOffset: 1,
    completedDays: [],
    scheduledDays: [],
    freezeDays: [],
  },
];

export const ProDashboardScreen: React.FC<ProDashboardScreenProps> = ({
  onLogout,
  onStartMission,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenSchedule,
  onOpenPostComposer,
  onOpenQuests,
  onOpenGrowth,
  onOpenCreate,
  onOpenVoiceStudio,
  onSwitchToFree,
  onTogglePersona,
  userPersona,
  userProfile,
  onSaveProfile,
}) => {
  const isNewUser = (userPersona || userProfile?.userPersona) === 'new';
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showVoiceStudioModal, setShowVoiceStudioModal] = useState(false);
  const [showBrandQuestModal, setShowBrandQuestModal] = useState(false);
  const [showCreatorLevelModal, setShowCreatorLevelModal] = useState(false);
  const [dashboardMonthOffset, setDashboardMonthOffset] = useState(0);
  
  const currentDashboardDate = new Date();
  currentDashboardDate.setMonth(currentDashboardDate.getMonth() + dashboardMonthOffset);
  const monthNamesList = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const displayedMonthName = monthNamesList[currentDashboardDate.getMonth()];
  const displayedYear = currentDashboardDate.getFullYear();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedStoryData, setSelectedStoryData] = useState<CreatorStoryData | null>(null);

  const openCreatorStory = (creatorId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (creatorId === 'amara') {
      setSelectedStoryData({
        id: 'amara',
        name: 'Amara Okafor',
        handle: '@amara.creates',
        niche: 'Travel & Lifestyle',
        avatar: require('../../assets/images/amara-avatar.jpg'),
        streak: 44,
        isOnline: true,
        isPro: true,
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
            ],
          },
        ],
      });
    }
  };

  // Calendar State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(8); // September
  const [selectedDayInfo, setSelectedDayInfo] = useState<string | null>(null);
  const [calendarWidth, setCalendarWidth] = useState(Dimensions.get('window').width - 56);
  const calendarFlatListRef = useRef<FlatList<MonthData>>(null);
  const monthChipsScrollRef = useRef<ScrollView>(null);

  // Notifications
  const [notifications, setNotifications] = useState<ProNotificationItem[]>(DEFAULT_PRO_NOTIFICATIONS);

  // Voice Studio State
  const [selectedVoiceTone, setSelectedVoiceTone] = useState('Energetic Narrator');
  const [voiceScriptInput, setVoiceScriptInput] = useState('Here are the 3 mistakes beginner creators make with their short-form hook...');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  // Animation Refs
  const flamePulse = useRef(new Animated.Value(1)).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0.4)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (showCalendarModal) {
      setSelectedMonthIndex(8);
      selectedMonthIndexRef.current = 8;
      setSelectedDayInfo(null);
      setTimeout(() => {
        try {
          calendarFlatListRef.current?.scrollToIndex({
            index: 8,
            animated: false,
          });
        } catch (e) {}
        monthChipsScrollRef.current?.scrollTo({
          x: Math.max(0, 8 * 68 - 100),
          animated: false,
        });
      }, 60);
    }
  }, [showCalendarModal]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, {
          toValue: 1.14,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(flamePulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ghostFloatY, {
          toValue: 2,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(waveformAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const proCalendarMonthsData: MonthData[] = useMemo(() => {
    if (isNewUser) {
      return FULL_YEAR_CALENDAR.map((m) => ({
        ...m,
        completedDays: [],
        scheduledDays: [],
        freezeDays: [],
      }));
    }
    return FULL_YEAR_CALENDAR;
  }, [isNewUser]);

  const proStreakGrid: ('completed' | 'scheduled' | 'freeze' | 'empty')[][] = isNewUser
    ? [
        ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
      ]
    : [
        ['empty', 'empty', 'completed', 'completed', 'completed', 'completed', 'completed'],
        ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'empty'],
        ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
      ];

  const selectedMonthIndexRef = useRef(selectedMonthIndex);
  useEffect(() => {
    selectedMonthIndexRef.current = selectedMonthIndex;
  }, [selectedMonthIndex]);

  const scrollToMonth = (index: number, animated = true) => {
    if (index >= 0 && index < proCalendarMonthsData.length) {
      setSelectedMonthIndex(index);
      selectedMonthIndexRef.current = index;
      setSelectedDayInfo(null);
      if (monthChipsScrollRef.current) {
        monthChipsScrollRef.current.scrollTo({
          x: Math.max(0, index * 68 - 100),
          animated: true,
        });
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      try {
        calendarFlatListRef.current?.scrollToIndex({
          index,
          animated,
        });
      } catch (e) {
        // fallback
      }
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonthIndexRef.current > 0) {
      scrollToMonth(selectedMonthIndexRef.current - 1, true);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndexRef.current < proCalendarMonthsData.length - 1) {
      scrollToMonth(selectedMonthIndexRef.current + 1, true);
    }
  };

  const handleDayPress = (day: number, month: MonthData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const isCompleted = month.completedDays.includes(day);
    const isScheduled = month.scheduledDays.includes(day);
    const isFreeze = month.freezeDays.includes(day);
    const isToday = month.isCurrent && day === 5;

    let info = '';
    if (isNewUser) {
      if (isToday) {
        info = `⚡ Today, September 5, 2026: Day 1 Habit Launch 🚀 • Ready to post your first Pro Reel!`;
      } else {
        info = `🗓️ ${month.monthName} ${day}, 2026 • Post daily to log verified streaks`;
      }
    } else {
      if (isToday) {
        info = `⚡ Today, September 5, 2026: 🔥 Daily Streak Locked In! Next Post: 7:30 PM`;
      } else if (isCompleted) {
        info = `🔥 ${month.monthName} ${day}, 2026: Posted 2 Reels • 94% Retention • +1,420 Views ✓`;
      } else if (isScheduled) {
        info = `⚡ ${month.monthName} ${day}, 2026: Autopilot Post Queued (Instagram & TikTok)`;
      } else if (isFreeze) {
        info = `🛡️ ${month.monthName} ${day}, 2026: Pro Streak Shield Used • Streak Protected!`;
      } else {
        info = `🗓️ ${month.monthName} ${day}, 2026 • Target: 1 Reel to advance Streak`;
      }
    }
    setSelectedDayInfo(info);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotifAction = (actionKey: string, notif: ProNotificationItem) => {
    switch (actionKey) {
      case 'open_voice_studio':
      case 'open_script':
      case 'open_hook_studio':
      case 'open_repurpose':
        if (onOpenVoiceStudio) onOpenVoiceStudio();
        else if (onOpenCreate) onOpenCreate();
        else if (onNavigateTab) onNavigateTab('create');
        break;
      case 'create_reel':
        if (onOpenPostComposer) onOpenPostComposer();
        else if (onOpenCreate) onOpenCreate();
        else if (onNavigateTab) onNavigateTab('create');
        break;
      case 'open_growth':
        if (onOpenGrowth) onOpenGrowth();
        else if (onNavigateTab) onNavigateTab('growth');
        break;
      case 'open_schedule':
        if (onOpenSchedule) onOpenSchedule();
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP HEADER BAR */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot + Mode Switcher */}
          <View style={{ alignItems: 'flex-start', gap: 6, flexShrink: 1 }}>
            <BrandLogo size="sm" />

            <HeaderDualModePills
              tier="pro"
              persona={isNewUser ? 'new' : 'returning'}
              onToggleTier={() => {
                if (onSwitchToFree) {
                  onSwitchToFree();
                } else if (onSaveProfile && userProfile) {
                  onSaveProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onTogglePersona={onTogglePersona}
              isDark={false}
            />
          </View>

          {/* Right Action Icons: Notification Bell & Profile Avatar */}
          <View style={styles.headerRightGroup}>
            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
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
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              style={({ pressed }) => [
                styles.profilePhotoBtn,
                styles.profilePhotoBtnPro,
                pressed && styles.headerIconBtnPressed,
              ]}
              hitSlop={8}
            >
              {userProfile?.customAvatarUri ? (
                <Image
                  source={{ uri: userProfile.customAvatarUri }}
                  style={styles.headerCustomAvatarImage}
                  resizeMode="cover"
                />
              ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
                <Image
                  source={userProfile.avatarSource}
                  style={styles.headerCustomAvatarImage}
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
                  />
                </Svg>
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
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
          {/* CARD 1: TODAY'S PRO PLAN HERO */}
          <View style={styles.proPlanHeroCard}>
            <View style={styles.proPlanHeaderRow}>
              <View style={styles.proPlanTagBox}>
                <Text style={styles.proPlanTagText}>
                  {isNewUser ? "JARVIS PRO DAY 1 LAUNCH 🚀" : "TODAY'S PRO PLAN"}
                </Text>
              </View>
            </View>

            {isNewUser ? (
              <>
                <Text
                  style={styles.proPlanHeadline}
                  numberOfLines={2}
                >
                  Welcome to Jarvis Pro Suite!
                </Text>
                <Text style={styles.proPlanSubheadline}>
                  Calibrate your AI voice studio and generate your first 3 viral hooks.
                </Text>
              </>
            ) : (
              <Text
                style={styles.proPlanHeadline}
                numberOfLines={2}
              >
                Publish your Reel. Record your voiceover.
              </Text>
            )}

            <View style={styles.proPlanBadgesRow}>
              <View style={styles.proPillPurple}>
                <Text style={styles.proPillPurpleText}>
                  {isNewUser ? "Level 1" : "Level 4"}
                </Text>
              </View>

              <View style={styles.proPillGold}>
                <Text style={styles.proPillGoldText}>
                  {isNewUser ? "Start Streak 🔥" : "30-Day Streak"}
                </Text>
              </View>

              <View style={styles.proPillGray}>
                <Text style={styles.proPillGrayText}>
                  {isNewUser ? "0 Platforms Connected" : "2 Platforms Connected"}
                </Text>
              </View>

              <View style={styles.proPillActiveGold}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, lineHeight: 16 }}>✨</Text>
                  </View>
                  <Text style={styles.proPillActiveGoldText}>Pro Active</Text>
                </View>
              </View>
            </View>
          </View>

          {/* PRO DAY 1 QUICKSTART ACCELERATOR CARD */}
          {isNewUser && (
            <View style={[styles.dashboardCard, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Text style={{ fontSize: 13, lineHeight: 16 }}>⚡</Text>
                  </View>
                  <Text
                    style={styles.acceleratorEyebrowText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    JARVIS PRO DAY 1 ACCELERATOR
                  </Text>
                </View>
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, flexShrink: 0 }}>
                  <Text style={styles.acceleratorBadgeEyebrowText}>
                    1 OF 4 COMPLETED
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#16A34A', fontWeight: '800', fontSize: 14, flexShrink: 0, lineHeight: 16 }}>✓</Text>
                  <Text style={styles.acceleratorActivatedText} numberOfLines={1}>
                    Jarvis AI Pro Suite Activated
                  </Text>
                </View>
                <Pressable
                  onPress={() => (onOpenVoiceStudio ? onOpenVoiceStudio() : undefined)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      paddingVertical: 9,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FDE68A',
                      gap: 8,
                      overflow: 'hidden',
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 12, flexShrink: 0, lineHeight: 14 }}>●</Text>
                    <Text
                      style={{ flex: 1, fontSize: sFont(11.5), color: '#1F2937', fontWeight: '700' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Calibrate AI Voice Studio (Record sample)
                    </Text>
                  </View>
                  <Text style={{ fontSize: sFont(10.5), color: '#B45309', fontWeight: '800', letterSpacing: 0.3, flexShrink: 0 }} numberOfLines={1}>OPEN ›</Text>
                </Pressable>
                <Pressable
                  onPress={() => (onOpenCreate ? onOpenCreate() : undefined)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      paddingVertical: 9,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FDE68A',
                      gap: 8,
                      overflow: 'hidden',
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 12, flexShrink: 0, lineHeight: 14 }}>○</Text>
                    <Text
                      style={{ flex: 1, fontSize: sFont(11.5), color: '#4B5563', fontWeight: '600' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Generate 3 AI Hook Variations in Studio
                    </Text>
                  </View>
                  <Text style={{ fontSize: sFont(10.5), color: '#6B7280', fontWeight: '700', letterSpacing: 0.3, flexShrink: 0 }} numberOfLines={1}>STUDIO ›</Text>
                </Pressable>
                <Pressable
                  onPress={() => (onOpenSchedule ? onOpenSchedule() : undefined)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      paddingVertical: 9,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FDE68A',
                      gap: 8,
                      overflow: 'hidden',
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 12, flexShrink: 0, lineHeight: 14 }}>○</Text>
                    <Text
                      style={{ flex: 1, fontSize: sFont(11.5), color: '#4B5563', fontWeight: '600' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Auto-Schedule 7-Day Content Plan
                    </Text>
                  </View>
                  <Text style={{ fontSize: sFont(10.5), color: '#6B7280', fontWeight: '700', letterSpacing: 0.3, flexShrink: 0 }} numberOfLines={1}>PLAN ›</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* CARD 2: YOUR STREAK HEATMAP */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              triggerModalPop();
              setShowCalendarModal(true);
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            {/* 1. Header: YOUR STREAK, 48-Day Streak 🔥, 96% Consistent */}
            <Text style={styles.streakLabel}>YOUR STREAK</Text>

            <View style={[styles.cardHeaderRow, { gap: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Text style={styles.streakBigHeadline}>
                  {isNewUser ? 'Start Your Streak' : ((userProfile?.streakCount && userProfile.streakCount > 1) ? userProfile.streakCount : 48) + '-Day Streak'}
                </Text>
                <Animated.Text style={{ fontSize: 16, transform: [{ scale: flamePulse }] }}>
                  🔥
                </Animated.Text>
              </View>
              <View style={[styles.streakStatusPill, { flexShrink: 1, minWidth: 0 }]}>
                <Text
                  style={styles.streakStatusHighlight}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {isNewUser ? 'Ready to Post' : '96% Consistent'}
                </Text>
              </View>
            </View>

            {/* 2. Dynamic Month Header with Navigation */}
            <View style={styles.calendarMetaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDashboardMonthOffset((prev) => prev - 1);
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.monthNavArrow}>‹</Text>
                </Pressable>
                <Text style={styles.monthLabel}>{displayedMonthName} {displayedYear}</Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDashboardMonthOffset((prev) => prev + 1);
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.monthNavArrow}>›</Text>
                </Pressable>
              </View>
            </View>

            {/* 3. Weekday Columns */}
            <View style={styles.daysHeaderRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                <Text key={`pro_day_col_${idx}`} style={styles.dayColHeader}>
                  {d}
                </Text>
              ))}
            </View>

            {/* 4. Compact Apple Health-Style 3-Row Grid */}
            <View style={styles.heatmapGrid}>
              {proStreakGrid.map((row, rIdx) => (
                <View key={`pro_row_${rIdx}`} style={styles.heatmapRow}>
                  {row.map((cellState, cIdx) => (
                    <View
                      key={`pro_cell_${rIdx}_${cIdx}`}
                      style={[
                        styles.heatmapCell,
                        cellState === 'completed' && styles.heatmapCellCompleted,
                        cellState === 'scheduled' && styles.heatmapCellScheduled,
                        cellState === 'freeze' && styles.heatmapCellFreeze,
                        cellState === 'empty' && styles.heatmapCellEmpty,
                      ]}
                    >
                      {cellState === 'completed' && (
                        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17L4 12" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                      {cellState === 'scheduled' && (
                        <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                          <Circle cx="12" cy="12" r="9" stroke="#7C3AED" strokeWidth="2.4" strokeDasharray="3,2" />
                          <Path d="M12 7V12L15 14" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
                        </Svg>
                      )}
                      {cellState === 'freeze' && (
                        <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                          <Path d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
                        </Svg>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* 5. Subtle Jarvis Momentum Line */}
            <View style={styles.subtleJarvisRow}>
              <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: 14, lineHeight: 17 }}>🔥</Text>
              </View>
              <Text style={styles.subtleJarvisText}>
                <Text style={styles.subtleJarvisBold}>Jarvis:</Text> You’re building momentum. Keep it going tomorrow.
              </Text>
            </View>
          </Pressable>

          {/* CARD 3: POSTS SCHEDULED & AUTOPILOT */}
          <Pressable
            onPress={() => {
              if (onOpenSchedule) {
                onOpenSchedule();
              } else if (onNavigateTab) {
                onNavigateTab('growth');
              }
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.scheduledLabel}>POSTS SCHEDULED</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <Text style={styles.scheduledBigNumber}>{isNewUser ? '0' : '1'}</Text>
                  <Text style={styles.scheduledThisWeek}>{isNewUser ? '0 this week' : '+1 this week'}</Text>
                </View>
              </View>

              <View style={styles.calendarIconSquare}>
                <Text style={styles.calendarIconText}>🗓️</Text>
              </View>
            </View>

            <View style={styles.scheduledDivider} />

            <View style={styles.scheduledBottomRow}>
              <Text style={styles.nextPostTimeText}>{isNewUser ? 'Next: None scheduled' : 'Next: Today 7:30 PM'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, lineHeight: 16 }}>⚡</Text>
                </View>
                <Text style={styles.autopilotActiveText}>Autopilot Ready</Text>
              </View>
            </View>
          </Pressable>

          {/* CARD 4: PERFORMANCE INSIGHT & HOURLY PEAK CHART */}
          <Pressable
            onPress={() => {
              if (onOpenGrowth) {
                onOpenGrowth();
              } else if (onNavigateTab) {
                onNavigateTab('growth');
              }
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={styles.insightHeaderRow}>
              <View style={styles.trendingIconBox}>
                <Text style={styles.trendingIconText}>📈</Text>
              </View>
              <Text style={styles.insightBodyText}>
                {isNewUser ? (
                  <>
                    Optimal posting window: <Text style={styles.highlightGreen}>7:00 PM – 9:00 PM</Text>. Jarvis personalizes this after your first Reels.
                  </>
                ) : (
                  <>
                    Your Reels perform <Text style={styles.highlightGreen}>31% better</Text> between 7:00 PM and 9:00 PM.
                  </>
                )}
              </Text>
            </View>

            {/* 5-Hour Performance Bar Chart with Peak Window Highlight */}
            <View style={styles.hourlyChartSection}>
              <View style={styles.hourlyChartContainer}>
                {/* 6 PM */}
                <View style={styles.hourlyColumn}>
                  <View style={[styles.hourlyBar, { height: 14, backgroundColor: '#E2E8F0' }]} />
                  <Text style={styles.hourLabel}>6 PM</Text>
                </View>

                {/* 7 PM (Peak Window Start) */}
                <View style={styles.hourlyColumn}>
                  <View style={[styles.hourlyBar, { height: 40, backgroundColor: '#6366F1' }]} />
                  <Text style={[styles.hourLabel, styles.hourLabelPeak]}>7 PM</Text>
                </View>

                {/* 8 PM (Highest Peak) */}
                <View style={styles.hourlyColumn}>
                  <View style={[styles.hourlyBar, { height: 48, backgroundColor: '#582CDB', shadowColor: '#582CDB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 }]} />
                  <Text style={[styles.hourLabel, styles.hourLabelPeak]}>8 PM</Text>
                </View>

                {/* 9 PM (Peak Window End) */}
                <View style={styles.hourlyColumn}>
                  <View style={[styles.hourlyBar, { height: 36, backgroundColor: '#6366F1' }]} />
                  <Text style={[styles.hourLabel, styles.hourLabelPeak]}>9 PM</Text>
                </View>

                {/* 10 PM */}
                <View style={styles.hourlyColumn}>
                  <View style={[styles.hourlyBar, { height: 16, backgroundColor: '#E2E8F0' }]} />
                  <Text style={styles.hourLabel}>10 PM</Text>
                </View>
              </View>

              {/* Data Transparency Footer Line */}
              <View style={styles.peakWindowNoteRow}>
                <Text style={styles.dataTransparencyText}>
                  {isNewUser ? 'Benchmark data · Calibrates as you post' : 'Based on your last 20 Reels'}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* CARD 5: CREATOR LEVEL & XP PROGRESS */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              triggerModalPop();
              setShowCreatorLevelModal(true);
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#A855F7']}
                style={styles.levelCircleBadge}
              >
                <Text style={styles.levelCircleNumber}>1</Text>
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={styles.levelTitleText}>Starter</Text>
                <Text style={styles.levelXpText}>0 / 100 XP</Text>
              </View>
            </View>

            <View style={styles.xpTrackBg}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#F59E0B', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpTrackFill, { width: '0%' }]}
              />
            </View>
          </Pressable>

          {/* CARD 6: AVAILABLE PRO SPRINT QUEST */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              triggerModalPop();
              setShowBrandQuestModal(true);
            }}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={styles.brandIconSquare}>
                <Text style={{ fontSize: 22 }}>⚡</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 3 }}>
                  <View style={styles.proPriorityPill}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, lineHeight: 16 }}>👑</Text>
                      </View>
                      <Text style={styles.proPriorityText}>AVAILABLE PRO SPRINT</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.brandQuestTitle}>Viral Hook Sprint Challenge</Text>
                <Text style={styles.brandQuestSubText}>
                  3-Hook Storytelling Challenge • +350 XP &amp; Streak Shield
                </Text>
              </View>

              <Text style={styles.chevronRight}>›</Text>
            </View>
          </Pressable>


          {/* CARD 8: VOICE STUDIO PRO */}
          <View style={styles.dashboardCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.voiceStudioLabel}>VOICE STUDIO PRO</Text>
              <View style={styles.proUnlockedPill}>
                <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
              </View>
            </View>

            <View style={styles.waveformContainerBox}>
              <View style={styles.waveformBarsRow}>
                {[14, 28, 46, 20, 52, 34, 18, 48, 30, 16].map((h, i) => (
                  <Animated.View
                    key={`wf_${i}`}
                    style={[
                      styles.waveformBarItem,
                      {
                        height: h,
                        opacity: waveformAnim,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.voiceMinsCount}>{isNewUser ? '0' : '118'} <Text style={styles.voiceMinsTotal}>/ 150 min used</Text></Text>
                <Text style={styles.savedVoiceSub}>{isNewUser ? 'Ready to clone your voice' : 'Saved Voice — Energetic Narrator'}</Text>
              </View>

              <View style={styles.voiceProgressCircle}>
                <Text style={styles.voiceProgressText}>{isNewUser ? '0%' : '78%'}</Text>
                <Text style={styles.voiceProgressSub}>{isNewUser ? 'READY' : 'MATCH'}</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.createVoiceBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenVoiceStudio) {
                    onOpenVoiceStudio();
                  } else {
                    triggerModalPop();
                    setShowVoiceStudioModal(true);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, lineHeight: 16 }}>✨</Text>
                  </View>
                  <Text style={styles.createVoiceBtnText}>Create Voice</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.openStudioOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenVoiceStudio) {
                    onOpenVoiceStudio();
                  } else {
                    triggerModalPop();
                    setShowVoiceStudioModal(true);
                  }
                }}
              >
                <Text style={styles.openStudioBtnText}>Open Studio</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL: ULTRA-PREMIUM PRO STREAK CALENDAR MODAL               */}
        {/* ============================================================ */}
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
                { transform: [{ scale: modalPopScale }] },
              ]}
            >
              {/* Pro Modal Header */}
              <View style={styles.calendarModalHeader}>
                <View style={styles.calendarModalTitleGroup}>
                  <Text
                    style={styles.calendarModalMainTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Streak & Activity Calendar 2026
                  </Text>
                  <Text style={styles.calendarModalSubtitle} numberOfLines={1}>
                    Swipe or tap to browse across months
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowCalendarModal(false)}
                  style={({ pressed }) => [styles.calendarCloseButton, pressed && styles.btnPressed]}
                  hitSlop={8}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6L18 18" stroke="#171420" strokeWidth="2.2" strokeLinecap="round" />
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
                {/* Pro Quick Stats Banner */}
                <View style={styles.calendarStatsRow}>
                  <View style={styles.calendarStatCard}>
                    <Text
                      style={styles.calendarStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {isNewUser ? 'Day 1 🔥' : ((userProfile?.streakCount && userProfile.streakCount > 1) ? userProfile.streakCount : 48) + ' Days 🔥'}
                    </Text>
                    <Text style={styles.calendarStatLabel} numberOfLines={1}>
                      Streak
                    </Text>
                  </View>
                  <View style={[styles.calendarStatCard, { backgroundColor: '#FEF9C3', borderColor: '#F59E0B' }]}>
                    <Text
                      style={[styles.calendarStatValue, { color: '#B45309' }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {isNewUser ? 'Starter 🚀' : 'Top 1% 👑'}
                    </Text>
                    <Text style={[styles.calendarStatLabel, { color: '#A16207' }]} numberOfLines={1}>
                      {isNewUser ? 'Rank Tier' : 'Worldwide'}
                    </Text>
                  </View>
                  <View style={styles.calendarStatCard}>
                    <Text
                      style={styles.calendarStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {isNewUser ? 'Ready ⚡' : '99.2% ⚡'}
                    </Text>
                    <Text style={styles.calendarStatLabel} numberOfLines={1}>
                      Consistency
                    </Text>
                  </View>
                  <View style={[styles.calendarStatCard, { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' }]}>
                    <Text
                      style={[styles.calendarStatValue, { color: '#582CDB' }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      2 Freezes 🛡️
                    </Text>
                    <Text style={[styles.calendarStatLabel, { color: '#6D28D9' }]} numberOfLines={1}>
                      Available
                    </Text>
                  </View>
                </View>

                {/* Horizontal Month Chips (Jan -> Dec) */}
                <ScrollView
                  ref={monthChipsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthChipsContainer}
                >
                  {proCalendarMonthsData.map((m, idx) => {
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
                        style={[
                          styles.monthChipPill,
                          isSelected && styles.monthChipPillActive,
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

                {/* Active Month Calendar Container with Smooth Swiping */}
                <View
                  style={styles.pagerOuterContainer}
                  onLayout={(e) => {
                    const measuredWidth = Math.floor(e.nativeEvent.layout.width);
                    if (measuredWidth > 0 && Math.abs(measuredWidth - calendarWidth) > 1) {
                      setCalendarWidth(measuredWidth);
                    }
                  }}
                >
                  {/* Month Navigator Header with ‹ and › */}
                  <View style={styles.monthNavHeader}>
                    <Pressable
                      onPress={handlePrevMonth}
                      disabled={selectedMonthIndex === 0}
                      style={[
                        styles.monthNavChevronBtn,
                        selectedMonthIndex === 0 && styles.monthNavChevronDisabled,
                      ]}
                      hitSlop={8}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M15 18L9 12L15 6" stroke={selectedMonthIndex === 0 ? '#CBD5E1' : '#582CDB'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </Pressable>

                    <View style={styles.monthNameTitleGroup}>
                      <Text style={styles.focusedMonthTitle}>
                        {proCalendarMonthsData[selectedMonthIndex].monthName} 2026
                      </Text>
                      {proCalendarMonthsData[selectedMonthIndex].isCurrent && (
                        <View style={styles.currentMonthBadge}>
                          <Text style={styles.currentMonthBadgeText}>CURRENT 🔥</Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={handleNextMonth}
                      disabled={selectedMonthIndex === proCalendarMonthsData.length - 1}
                      style={[
                        styles.monthNavChevronBtn,
                        selectedMonthIndex === proCalendarMonthsData.length - 1 && styles.monthNavChevronDisabled,
                      ]}
                      hitSlop={8}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M9 18L15 12L9 6" stroke={selectedMonthIndex === proCalendarMonthsData.length - 1 ? '#CBD5E1' : '#582CDB'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </Pressable>
                  </View>

                  {/* Day-of-Week Column Headers */}
                  <View style={styles.calendarDayNamesRow}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayHeader, dIdx) => (
                      <Text key={`pro_cal_col_${dIdx}`} style={styles.calendarDayNameText}>
                        {dayHeader}
                      </Text>
                    ))}
                  </View>

                  {/* High-Performance 120fps Native Paging Carousel */}
                  <FlatList
                    ref={calendarFlatListRef}
                    data={proCalendarMonthsData}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    directionalLockEnabled={true}
                    decelerationRate="fast"
                    snapToInterval={calendarWidth}
                    snapToAlignment="center"
                    scrollEventThrottle={16}
                    getItemLayout={(_, index) => ({
                      length: calendarWidth,
                      offset: calendarWidth * index,
                      index,
                    })}
                    initialScrollIndex={8}
                    onScrollToIndexFailed={(info) => {
                      setTimeout(() => {
                        try {
                          calendarFlatListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: false,
                          });
                        } catch (e) {}
                      }, 80);
                    }}
                    onScroll={(e) => {
                      const offsetX = e.nativeEvent.contentOffset.x;
                      if (calendarWidth > 0) {
                        const activeIdx = Math.round(offsetX / calendarWidth);
                        if (
                          activeIdx >= 0 &&
                          activeIdx < proCalendarMonthsData.length &&
                          activeIdx !== selectedMonthIndexRef.current
                        ) {
                          selectedMonthIndexRef.current = activeIdx;
                          setSelectedMonthIndex(activeIdx);
                          setSelectedDayInfo(null);
                          monthChipsScrollRef.current?.scrollTo({
                            x: Math.max(0, activeIdx * 68 - 100),
                            animated: true,
                          });
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }
                      }
                    }}
                    renderItem={({ item: currentMonth }) => (
                      <View style={{ width: calendarWidth, paddingHorizontal: 1 }}>
                        <View style={styles.calendarMonthGrid}>
                          {Array.from({
                            length:
                              Math.ceil((currentMonth.daysCount + currentMonth.startOffset) / 7) * 7,
                          }).map((_, cellIdx) => {
                            const dayNumber = cellIdx - currentMonth.startOffset + 1;
                            const isValidDay = dayNumber >= 1 && dayNumber <= currentMonth.daysCount;

                            if (!isValidDay) {
                              return <View key={`pro_empty_${currentMonth.id}_${cellIdx}`} style={styles.calendarCellEmpty} />;
                            }

                            const isCompleted = currentMonth.completedDays.includes(dayNumber);
                            const isScheduled = currentMonth.scheduledDays.includes(dayNumber);
                            const isFreeze = currentMonth.freezeDays.includes(dayNumber);
                            const isToday = currentMonth.isCurrent && dayNumber === 5;

                            return (
                              <Pressable
                                key={`pro_day_${currentMonth.id}_${dayNumber}`}
                                onPress={() => handleDayPress(dayNumber, currentMonth)}
                                style={({ pressed }) => [
                                  styles.calendarCell,
                                  isCompleted && styles.calendarCellCompleted,
                                  isScheduled && styles.calendarCellScheduled,
                                  isFreeze && styles.calendarCellFreeze,
                                  isToday && styles.calendarCellToday,
                                  pressed && styles.calendarCellPressed,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.calendarCellDayNumber,
                                    isCompleted && styles.calendarCellTextCompleted,
                                    isScheduled && styles.calendarCellTextScheduled,
                                    isFreeze && styles.calendarCellTextFreeze,
                                    isToday && styles.calendarCellTextToday,
                                  ]}
                                >
                                  {dayNumber}
                                </Text>

                                {isCompleted && <Text style={styles.cellMiniIcon}>✓</Text>}
                                {isScheduled && <Text style={styles.cellMiniIconScheduled}>⚡</Text>}
                                {isFreeze && <Text style={styles.cellMiniIconFreeze}>🛡️</Text>}
                                {isToday && <View style={styles.dayCellTodayDot} />}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  />
                </View>

                {/* Legend & Pro Autopilot Shield Footer */}
                <View style={styles.calendarLegendBox}>
                  <View style={styles.legendItemsGrid}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#582CDB' }]} />
                      <Text style={styles.legendLabel}>Completed (✓)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.legendLabel}>Autopilot (⚡)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
                      <Text style={styles.legendLabel}>Pro Shield (🛡️)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={styles.legendLabel}>Today (🔴)</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <Pressable
                style={({ pressed }) => [styles.donePrimaryBtn, pressed && styles.btnPressed]}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.donePrimaryBtnText}>Done ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: VOICE STUDIO PRO */}
        <Modal
          visible={showVoiceStudioModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceStudioModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.modalTitle}>AI Voice Studio Pro</Text>
                    <View style={styles.proUnlockedPill}>
                      <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>Turn scripts into high-converting studio voiceovers</Text>
                </View>
                <Pressable onPress={() => setShowVoiceStudioModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.inputSectionHeader}>SELECT AI CREATOR VOICE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 8 }}>
                {['Energetic Narrator', 'Deep Storyteller', 'Tech Explainer', 'Casual Vlogger'].map((voice, idx) => {
                  const isSelected = selectedVoiceTone === voice;
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.voiceToneChip, isSelected && styles.voiceToneChipActive]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedVoiceTone(voice);
                      }}
                    >
                      <Text style={[styles.voiceToneChipText, isSelected && styles.voiceToneChipTextActive]}>
                        🎙️ {voice}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputSectionHeader}>SCRIPT INPUT</Text>
              <TextInput
                style={styles.voiceTextInput}
                multiline
                numberOfLines={4}
                value={voiceScriptInput}
                onChangeText={setVoiceScriptInput}
                placeholder="Paste or type your video script here..."
                placeholderTextColor="#94A3B8"
              />

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setIsGeneratingVoice(true);
                  setTimeout(() => {
                    setIsGeneratingVoice(false);
                    setShowVoiceStudioModal(false);
                    showToast('Voiceover audio generated & synced with Reel draft!');
                  }, 1200);
                }}
              >
                <Text style={styles.modalFullBtnText}>
                  {isGeneratingVoice ? 'Generating AI Audio...' : 'Generate Studio Voiceover ➔'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>



                        {/* ============================================================ */}
        {/* MODAL: ACTIVE PRO SPRINT QUEST MODAL                         */}
        {/* ============================================================ */}
        <Modal
          visible={showBrandQuestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBrandQuestModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.proPriorityPill}>
                    <Text style={styles.proPriorityText}>👑 AVAILABLE CREATOR SPRINT</Text>
                  </View>
                  <Pressable onPress={() => setShowBrandQuestModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                {/* Hero Quest Banner */}
                <LinearGradient
                  colors={['#1E1B4B', '#312E81', '#4338CA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 18, padding: 16, marginBottom: 14 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 22 }}>⚡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>Viral Hook Sprint Challenge</Text>
                      <Text style={{ fontSize: 11, color: '#C7D2FE', marginTop: 1, fontWeight: '700' }}>Creator Milestone Sprint • 2 Days Remaining</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(245, 158, 11, 0.25)',
                        borderWidth: 1,
                        borderColor: '#F59E0B',
                        paddingHorizontal: 6,
                        paddingVertical: 5,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{ fontSize: sFont(11), fontWeight: '700', color: '#FDE68A', textAlign: 'center' }}
                        numberOfLines={1}
                      >
                        🛡️ 7-Day Shield
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(139, 92, 246, 0.25)',
                        borderWidth: 1,
                        borderColor: '#8B5CF6',
                        paddingHorizontal: 6,
                        paddingVertical: 5,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{ fontSize: sFont(11), fontWeight: '700', color: '#EDE9FE', textAlign: 'center' }}
                        numberOfLines={1}
                      >
                        ⚡ +350 XP Reward
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Deliverables & Brief */}
                <Text style={styles.modalSubheadingTitle}>SPRINT OBJECTIVES</Text>
                <View style={{ gap: 8, marginTop: 8 }}>
                  <View style={styles.xpActivityRow}>
                    <View style={styles.deliverableIconBox}>
                      <Text style={{ fontSize: 18 }}>🎬</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.xpActivityTitle}>1x 9:16 Storytelling Hook Reel</Text>
                      <Text style={styles.xpActivityTime}>Include 3-second contrarian hook &amp; core lesson</Text>
                    </View>
                  </View>
                  <View style={styles.xpActivityRow}>
                    <View style={styles.deliverableIconBox}>
                      <Text style={{ fontSize: 18 }}>📑</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.xpActivityTitle}>Pin High-Value Carousel Breakdown</Text>
                      <Text style={styles.xpActivityTime}>Share step-by-step checklist to drive bookmarks &amp; saves</Text>
                    </View>
                  </View>
                </View>

                {/* Jarvis AI Recommendation */}
                <View style={[styles.nextLevelPreviewBox, { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD', marginTop: 12 }]}>
                  <Text style={[styles.nextLevelPreviewTitle, { color: '#582CDB' }]}>🪄 JARVIS SPRINT INSIGHT</Text>
                  <Text style={[styles.nextLevelPreviewBody, { color: '#4338CA' }]}>
                    Strong audience alignment with high-retention formats. Completing this sprint challenge awards +350 XP and unlocks Level 2 Creator status!
                  </Text>
                </View>

                {/* Action Buttons */}
                <Pressable
                  style={({ pressed }) => [styles.modalGoldActionBtnWrapper, { marginTop: 14 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowBrandQuestModal(false);
                    if (onOpenPostComposer) {
                      onOpenPostComposer('3 Creator Mistakes I Stopped Making');
                    } else if (onStartMission) {
                      onStartMission();
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGoldBtnGradient}
                  >
                    <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                      ✨ Accept &amp; Start Sprint (+350 XP) ➔
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowBrandQuestModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Sprint</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: CREATOR LEVEL & XP MILESTONE BADGES MODAL             */}
        {/* ============================================================ */}
        <Modal
          visible={showCreatorLevelModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreatorLevelModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.proPriorityPill}>
                    <Text style={styles.proPriorityText}>👑 LEVEL &amp; BADGE PROGRESSION</Text>
                  </View>
                  <Pressable onPress={() => setShowCreatorLevelModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                {/* Hero Level & Rank Card */}
                <LinearGradient
                  colors={['#3B14A7', '#582CDB', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.levelHeroRankCard}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.heroLevelNumberCircle}>
                      <Text style={styles.heroLevelNumberText}>1</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroLevelTitle}>Starter</Text>
                      <Text style={styles.heroLevelSub}>Novice Tier Creator • Day 1 Active</Text>
                    </View>
                  </View>

                  {/* XP Progress Bar */}
                  <View style={{ marginTop: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.heroXpCurrentText}>0 XP</Text>
                      <Text style={styles.heroXpTargetText}>100 XP (Level 2)</Text>
                    </View>
                    <View style={styles.heroXpTrackBg}>
                      <LinearGradient
                        colors={['#FDE68A', '#F59E0B', '#D97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.heroXpTrackFill, { width: '0%' }]}
                      />
                    </View>
                    <Text style={styles.heroXpRemainingSub}>
                      🔥 Only 100 XP needed to unlock <Text style={{ fontWeight: '700', color: '#FDE68A' }}>Level 2 Content Creator</Text>
                    </Text>
                  </View>
                </LinearGradient>

                {/* BADGE SHOWCASE GRID */}
                <Text style={[styles.modalSubheadingTitle, { marginTop: 16 }]}>EARNED CREATOR BADGES (2/8)</Text>
                <View style={styles.badgeShowcaseGrid}>
                  {/* Badge 1 */}
                  <View style={styles.badgeShowcaseItem}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>✨</Text>
                    <Text style={styles.badgeShowcaseName}>Pro Pioneer</Text>
                    <Text style={styles.badgeShowcaseDesc}>Upgraded to PostStreak Pro</Text>
                  </View>

                  {/* Badge 2 */}
                  <View style={styles.badgeShowcaseItem}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>🔥</Text>
                    <Text style={styles.badgeShowcaseName}>Streak Starter</Text>
                    <Text style={styles.badgeShowcaseDesc}>Started daily posting streak</Text>
                  </View>

                  {/* Badge 3 */}
                  <View style={[styles.badgeShowcaseItem, { opacity: 0.6 }]}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>🔒</Text>
                    <Text style={styles.badgeShowcaseName}>Voice Studio Pro</Text>
                    <Text style={styles.badgeShowcaseDesc}>Generate first AI voiceover</Text>
                  </View>

                  {/* Badge 4 */}
                  <View style={[styles.badgeShowcaseItem, { opacity: 0.6 }]}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>🔒</Text>
                    <Text style={styles.badgeShowcaseName}>Quest Master</Text>
                    <Text style={styles.badgeShowcaseDesc}>Complete first brand quest</Text>
                  </View>
                </View>

                {/* RECENT XP GAINS */}
                <Text style={[styles.modalSubheadingTitle, { marginTop: 16 }]}>RECENT XP ACTIVITY</Text>
                <View style={{ gap: 8, marginTop: 6 }}>
                  {[
                    { title: 'Upgraded to PostStreak Pro', time: 'Today', xp: '+0 XP' },
                    { title: 'Streak Kickoff Active', time: 'Today', xp: '+0 XP' },
                    { title: isNewUser ? 'Ready to Connect Channels' : 'Connected 2 Channels', time: 'Today', xp: '+0 XP' },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.xpActivityRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.xpActivityTitle}>{item.title}</Text>
                        <Text style={styles.xpActivityTime}>{item.time}</Text>
                      </View>
                      <View style={styles.xpActivityBadge}>
                        <Text style={styles.xpActivityBadgeText}>{item.xp}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* NEXT LEVEL UNLOCKS (LEVEL 2 PREVIEW) */}
                <View style={styles.nextLevelPreviewBox}>
                  <Text style={styles.nextLevelPreviewTitle}>🌟 LEVEL 2 MILESTONE UNLOCKS</Text>
                  <Text style={styles.nextLevelPreviewBody}>
                    • Custom Reel Stencils &amp; Templates{"\n"}
                    • Unlocks Squad Live Duels &amp; Collabs{"\n"}
                    • +50 Daily XP Multiplier Boost
                  </Text>
                </View>

                {/* Action Buttons */}
                <Pressable
                  style={({ pressed }) => [styles.modalGoldActionBtnWrapper, { marginTop: 12 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowCreatorLevelModal(false);
                    if (onStartMission) onStartMission();
                    else if (onOpenQuests) onOpenQuests();
                  }}
                >
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGoldBtnGradient}
                  >
                    <Text style={styles.modalGoldActionBtnText} numberOfLines={1}>
                      ⚡ Start Today&apos;s Mission (+150 XP) ➔
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.modalSecondaryOutlineBtn}
                  onPress={() => {
                    setShowCreatorLevelModal(false);
                    if (onOpenQuests) onOpenQuests();
                  }}
                >
                  <Text style={styles.modalSecondaryOutlineBtnText} numberOfLines={1}>
                    📜 View Complete Creator Passport ➔
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCreatorLevelModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Level Overview</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: PRO ADVANCED NOTIFICATIONS */}
        <ProNotificationsModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          onActionPress={handleNotifAction}
          onToast={showToast}
        />

        {/* CREATOR STORY MODAL */}
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
            showToast(`Collab request sent to ${creator.name}!`);
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
    backgroundColor: '#FAF9FD',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF9FD',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FAF9FD',
  },
  headerLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
  },
  headerGhostLogo: {
    width: 26,
    height: 26,
  },
  proHeaderBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
  },
  proHeaderBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  headerIconBtnPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePhotoBtnPro: {
    borderColor: '#D97706',
    borderWidth: 1.5,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  addPhotoPlusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 88 : 80,
  },
  proPlanHeroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  proPlanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  proPlanTagBox: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  proPlanTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.66,
    lineHeight: 14,
  },
  proPlanHeadline: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 8,
  },
  proPlanSubheadline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5E576E',
    letterSpacing: 0,
    lineHeight: 20.3,
    marginBottom: 14,
  },
  proPlanBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  proPillPurple: {
    backgroundColor: '#F4F0FF',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proPillPurpleText: {
    fontSize: sFont(10.5),
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: -0.1,
    lineHeight: 14,
  },
  proPillGold: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proPillGoldText: {
    fontSize: sFont(10.5),
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: -0.1,
    lineHeight: 14,
  },
  proPillGray: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proPillGrayText: {
    fontSize: sFont(10.5),
    fontWeight: '600',
    color: '#5E576E',
    letterSpacing: -0.1,
    lineHeight: 14,
  },
  proPillActiveGold: {
    backgroundColor: '#D97706',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proPillActiveGoldText: {
    fontSize: sFont(10.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
    lineHeight: 14,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  acceleratorEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.66,
    flex: 1,
  },
  acceleratorBadgeEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.66,
  },
  acceleratorActivatedText: {
    fontSize: 14,
    lineHeight: 20.3,
    letterSpacing: 0,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.66,
    marginBottom: 6,
  },
  streakBigHeadline: {
    fontSize: sFont(17),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  streakStatusPill: {
    backgroundColor: 'rgba(88, 44, 219, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  streakStatusHighlight: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: -0.1,
  },
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
  monthNavArrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
    paddingHorizontal: 2,
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
    maxWidth: 34,
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
    maxWidth: 34,
    height: 23,
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
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  heatmapCellFreeze: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  heatmapCellEmpty: {
    backgroundColor: 'rgba(23, 20, 32, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.04)',
  },
  subtleJarvisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 20, 32, 0.05)',
    gap: 8,
  },
  subtleJarvisText: {
    fontSize: 14,
    lineHeight: 20.3,
    letterSpacing: 0,
    color: '#64748B',
    flex: 1,
  },
  subtleJarvisBold: {
    fontWeight: '700',
    color: '#582CDB',
  },
  scheduledLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.66,
  },
  scheduledBigNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: -0.5,
  },
  scheduledThisWeek: {
    fontSize: sFont(13.5),
    fontWeight: '600',
    color: '#171420',
    letterSpacing: -0.1,
  },
  calendarIconSquare: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 20,
    lineHeight: 24,
  },
  scheduledDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  scheduledBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPostTimeText: {
    fontSize: sFont(12.5),
    fontWeight: '600',
    color: '#171420',
    letterSpacing: -0.1,
  },
  autopilotActiveText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: -0.1,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  trendingIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingIconText: {
    fontSize: 14,
    lineHeight: 18,
  },
  insightBodyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#171420',
    lineHeight: 20.3,
    letterSpacing: 0,
  },
  highlightGreen: {
    color: '#15803D',
    fontWeight: '700',
  },
  hourlyChartSection: {
    marginTop: 6,
  },
  hourlyChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    paddingHorizontal: 6,
  },
  hourlyColumn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  hourlyBar: {
    width: 36,
    borderRadius: 8,
    maxWidth: '85%',
  },
  hourLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  hourLabelPeak: {
    color: '#582CDB',
    fontWeight: '700',
  },
  peakWindowNoteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 20, 32, 0.04)',
  },
  dataTransparencyText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  levelCircleBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  levelCircleNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  levelTitleText: {
    fontSize: sFont(15.5),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },
  levelXpText: {
    fontSize: sFont(11),
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  xpTrackBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  brandIconSquare: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proPriorityPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  proPriorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.66,
  },
  brandQuestSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    flexShrink: 0,
  },
  brandQuestTitle: {
    fontSize: sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  brandQuestSubText: {
    fontSize: 14,
    lineHeight: 20.3,
    letterSpacing: 0,
    color: '#64748B',
    marginTop: 2,
  },
  chevronRight: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: '400',
  },
  earningsCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  earningsMonthText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    backgroundColor: '#582CDB',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  earningsBigAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
  },
  earningsGrowthRate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  viewEarningsBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  viewEarningsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceStudioLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.66,
  },
  proUnlockedPill: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proUnlockedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A16207',
    letterSpacing: 0.66,
  },
  waveformContainerBox: {
    backgroundColor: '#F5F3FF',
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveformBarItem: {
    width: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  voiceMinsCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  voiceMinsTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  savedVoiceSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 20.3,
    letterSpacing: 0,
    marginTop: 2,
  },
  voiceProgressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#EDE9FE',
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
    lineHeight: 14,
  },
  voiceProgressSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  createVoiceBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  createVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  openStudioOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openStudioBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },
  matchAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#582CDB',
  },
  matchCreatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  matchOverlapTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },
  whyMatchCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  whyMatchInlineText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  matchRecommendationBox: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  matchRecommendationText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '600',
  },
  connectMatchOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectMatchBtnText: {
    color: '#582CDB',
    fontSize: 14,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // ULTRA-PREMIUM PRO CALENDAR MODAL STYLES
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sPadding(14),
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 420,
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
    minWidth: 0,
    marginRight: 8,
  },
  calendarModalMainTitle: {
    fontSize: sFont(16),
    fontWeight: '800',
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
    flexShrink: 0,
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
    paddingHorizontal: 2,
    alignItems: 'center',
    minWidth: 0,
  },
  calendarStatValue: {
    fontSize: sFont(10.5),
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
    textAlign: 'center',
  },
  calendarStatLabel: {
    fontSize: sFont(9),
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthChipPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    paddingHorizontal: 0,
    marginBottom: 8,
    overflow: 'hidden',
  },
  monthNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
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
    paddingHorizontal: 6,
  },
  calendarDayNameText: {
    width: '14.28%',
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  monthPageCard: {
    paddingHorizontal: 6,
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
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE68A',
  },
  calendarCellFreeze: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
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
    color: '#B45309',
  },
  calendarCellTextFreeze: {
    color: '#0284C7',
  },
  calendarCellTextToday: {
    color: '#DC2626',
    fontWeight: '800',
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
    fontSize: 7,
    marginTop: 1,
  },
  dayCellTodayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
    position: 'absolute',
    bottom: 2,
  },
  calendarLegendBox: {
    backgroundColor: 'rgba(250, 248, 255, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  legendItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: sFont(10),
    fontWeight: '600',
    color: '#5E576E',
  },
  donePrimaryBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  donePrimaryBtnText: {
    fontSize: sFont(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // COMMON MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalCloseCross: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  voiceToneChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  voiceToneChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  voiceToneChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  voiceToneChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  voiceTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#171420',
    height: 80,
    textAlignVertical: 'top',
  },
  reqDetailLine: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '600',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  notifBody: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  // LEVEL MODAL STYLES
  levelHeroRankCard: {
    borderRadius: 20,
    padding: 18,
    marginVertical: 6,
  },
  heroLevelNumberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLevelNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroLevelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroLevelSub: {
    fontSize: 11,
    color: '#E9D5FF',
    marginTop: 2,
    fontWeight: '700',
  },
  heroXpCurrentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
  },
  heroXpTargetText: {
    fontSize: 11,
    color: '#EDE9FE',
    fontWeight: '700',
  },
  heroXpTrackBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroXpTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroXpRemainingSub: {
    fontSize: 11,
    color: '#E9D5FF',
    marginTop: 6,
    fontWeight: '600',
  },
  modalSubheadingTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  badgeShowcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badgeShowcaseItem: {
    width: '48%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
  },
  badgeShowcaseName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },
  badgeShowcaseDesc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  deliverableIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  xpActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  xpActivityTitle: {
    fontSize: sFont(12.5),
    fontWeight: '800',
    color: '#171420',
  },
  xpActivityTime: {
    fontSize: sFont(11),
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  xpActivityBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpActivityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  nextLevelPreviewBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 12,
  },
  nextLevelPreviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 4,
  },
  nextLevelPreviewBody: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
    fontWeight: '600',
  },
  modalGoldActionBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalGoldBtnGradient: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalGoldActionBtnText: {
    color: '#0C0A12',
    fontSize: sFont(13),
    fontWeight: '700',
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
    marginTop: 8,
  },
  modalSecondaryOutlineBtnText: {
    color: '#582CDB',
    fontSize: sFont(13),
    fontWeight: '700',
    textAlign: 'center',
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
