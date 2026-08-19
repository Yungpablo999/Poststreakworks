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
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProScheduleScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenCreateIdea?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface CalendarDay {
  dayName: string;
  dayNum: number;
  dotsCount: number;
  isToday?: boolean;
}

const CALENDAR_DAYS: CalendarDay[] = [
  { dayName: 'SUN', dayNum: 23, dotsCount: 1 },
  { dayName: 'TUE', dayNum: 24, dotsCount: 2 },
  { dayName: 'WED', dayNum: 25, dotsCount: 2, isToday: true },
  { dayName: 'THU', dayNum: 26, dotsCount: 1 },
  { dayName: 'FRI', dayNum: 27, dotsCount: 2 },
  { dayName: 'SAT', dayNum: 28, dotsCount: 1 },
  { dayName: 'SUN', dayNum: 29, dotsCount: 2 },
];

interface ScheduleItem {
  id: string;
  time: string;
  period: string;
  title: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin';
  platformLabel: string;
  badgeType: 'scheduled' | 'recommended' | 'draft';
  dayIndex: number;
}

const INITIAL_SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    id: 'sch_1',
    time: '11:30',
    period: 'AM',
    title: '3 creator mistakes I stopped making this year',
    platform: 'tiktok',
    platformLabel: '≈ TikTok',
    badgeType: 'scheduled',
    dayIndex: 2, // WED 25
  },
  {
    id: 'sch_2',
    time: '07:30',
    period: 'PM',
    title: 'Personal lesson Reel • Behind the scenes studio',
    platform: 'instagram',
    platformLabel: '📸 IG Reel',
    badgeType: 'recommended',
    dayIndex: 2, // WED 25
  },
  {
    id: 'sch_3',
    time: '10:00',
    period: 'AM',
    title: '5 retention rules that 10x watch time',
    platform: 'linkedin',
    platformLabel: 'in LinkedIn',
    badgeType: 'scheduled',
    dayIndex: 3, // THU 26
  },
  {
    id: 'sch_4',
    time: '06:00',
    period: 'PM',
    title: 'Step-by-step editing workflow in CapCut',
    platform: 'instagram',
    platformLabel: '📸 IG Reel',
    badgeType: 'scheduled',
    dayIndex: 4, // FRI 27
  },
];

const GAP_SUGGESTIONS = [
  {
    id: 'gap_1',
    title: 'Why 90% of creators quit by month 2',
    format: '📸 Storytelling Reel • 42s Retention',
    score: '96% Match',
    hashtags: '#creatortips #mindset #consistency',
  },
  {
    id: 'gap_2',
    title: 'The exact equipment I use to record 4K content on iPhone',
    format: '📊 Breakdown Carousel • High Saves',
    score: '92% Match',
    hashtags: '#creatorsetup #iphonetips #cinematography',
  },
  {
    id: 'gap_3',
    title: 'Unpopular truth about algorithmic reach in 2026',
    format: '≈ Contrarian Short • High Comments',
    score: '89% Match',
    hashtags: '#viralgrowth #socialmediatips #algorithm',
  },
];

export const ProScheduleScreen: React.FC<ProScheduleScreenProps> = ({
  onBack,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenCreateIdea,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(2); // WED 25
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(INITIAL_SCHEDULE_ITEMS);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSchedulePostModal, setShowSchedulePostModal] = useState(false);
  const [showFillGapModal, setShowFillGapModal] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<ScheduleItem | null>(null);
  const [autopilotEnabled, setAutopilotEnabled] = useState<boolean>(true);

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
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'linkedin'>('instagram');
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
          : 'in LinkedIn',
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

  // Filter items for selected day
  const displayedItems = scheduleList.filter(
    (item) => item.dayIndex === selectedDayIndex
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR                                            */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onBack();
                }}
                style={({ pressed }) => [styles.backBtnCircle, pressed && styles.btnPressed]}
                hitSlop={8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            )}

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
                triggerModalPop();
                setShowSchedulePostModal(true);
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
            <Text style={styles.mainTitleText}>Plan your content with precision.</Text>
            <Text style={styles.mainSubText}>
              Manage your schedule, find content gaps and post during your strongest windows.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: WEEKLY OUTLOOK (HERO CARD)                           */}
          {/* ============================================================ */}
          <View style={styles.weeklyOutlookCard}>
            <Text style={styles.weeklyOutlookTitle}>Weekly Outlook</Text>
            <Text style={styles.weeklyOutlookRange}>October 23 – October 29</Text>

            {/* Top Action Buttons: Schedule Post & Fill Gaps */}
            <View style={styles.outlookButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.schedulePostPrimaryBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  triggerModalPop();
                  setShowSchedulePostModal(true);
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
                  onPress={() => showToast(`${scheduleList.length} posts scheduled in queue`)}
                >
                  <Text style={styles.metricGridLabel}>SCHEDULED</Text>
                  <Text style={styles.metricGridVal}>{scheduleList.length}</Text>
                </Pressable>

                <Pressable
                  style={styles.metricGridTile}
                  onPress={() => showToast('2 drafts ready for publishing')}
                >
                  <Text style={styles.metricGridLabel}>DRAFTS</Text>
                  <Text style={styles.metricGridVal}>2</Text>
                </Pressable>
              </View>

              {/* Row 2 */}
              <View style={styles.metricsGridRow}>
                <Pressable
                  style={styles.metricGridTile}
                  onPress={() => showToast('1 post successfully published today')}
                >
                  <Text style={styles.metricGridLabel}>POSTED</Text>
                  <Text style={styles.metricGridVal}>1</Text>
                </Pressable>

                <Pressable
                  style={styles.metricGridTile}
                  onPress={() => {
                    triggerModalPop();
                    setShowFillGapModal(true);
                  }}
                >
                  <Text style={styles.metricGridLabel}>OPEN SLOTS</Text>
                  <Text style={styles.metricGridVal}>2</Text>
                </Pressable>
              </View>
            </View>

            {/* PLAN COMPLETION PROGRESS */}
            <View style={styles.planCompletionHeaderRow}>
              <Text style={styles.planCompletionLabel}>PLAN COMPLETION</Text>
              <Text style={styles.planCompletionReadyText}>65% READY</Text>
            </View>
            <View style={styles.planCompletionProgressBarTrack}>
              <LinearGradient
                colors={['#582CDB', '#8B5CF6', '#C59B27']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.planCompletionProgressBarFill, { width: '65%' }]}
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 2: CALENDAR VIEW (7-DAY STRIP)                       */}
          {/* ============================================================ */}
          <Text style={styles.sectionSmallHeading}>CALENDAR VIEW</Text>
          <View style={styles.calendarViewStrip}>
            {CALENDAR_DAYS.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <Pressable
                  key={idx}
                  style={[
                    styles.dayPillCard,
                    isSelected && styles.dayPillCardSelected,
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
          {/* SECTION 3: TODAY'S SCHEDULE                                  */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithLink}>
            <Text style={styles.sectionHeaderTitleBold}>Today&apos;s Schedule</Text>
            <Pressable
              onPress={() => showToast('Opening expanded schedule view')}
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
                  onPress={() => setSelectedPostDetail(item)}
                >
                  <View style={item.badgeType === 'recommended' ? styles.timeBoxGold : styles.timeBoxPurple}>
                    <Text style={item.badgeType === 'recommended' ? styles.timeBoxGoldText : styles.timeBoxPurpleText}>
                      {item.time}
                    </Text>
                    <Text style={item.badgeType === 'recommended' ? styles.timeBoxGoldSub : styles.timeBoxPurpleSub}>
                      {item.period}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.scheduleItemPlatform}>{item.platformLabel}</Text>
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
                    triggerModalPop();
                    setShowSchedulePostModal(true);
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
              onPress={() => showToast('Displaying full queue')}
              hitSlop={8}
            >
              <Text style={styles.viewFullQueuePillText}>View Full Queue</Text>
            </Pressable>
          </View>

          <View style={styles.queueContainerCard}>
            {/* Item 1: LinkedIn */}
            <Pressable
              style={styles.queueItemRow}
              onPress={() => showToast('LinkedIn Insight scheduled for Tomorrow 10:00 AM')}
            >
              <View style={styles.linkedinSquareIcon}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>in</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueItemTitle}>LinkedIn Insight</Text>
                <Text style={styles.queueItemTime}>Tomorrow, 10:00 AM</Text>
              </View>
              <Text style={styles.threeDotsMenu}>⋮</Text>
            </Pressable>

            <View style={styles.queueItemDivider} />

            {/* Item 2: Instagram */}
            <Pressable
              style={styles.queueItemRow}
              onPress={() => showToast('Instagram Carousel scheduled for Friday 06:00 PM')}
            >
              <LinearGradient
                colors={['#833AB4', '#FD1D1D', '#FCAF45']}
                style={styles.instagramSquareIcon}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>📸</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueItemTitle}>Instagram Carousel</Text>
                <Text style={styles.queueItemTime}>Friday, 06:00 PM</Text>
              </View>
              <Text style={styles.threeDotsMenu}>⋮</Text>
            </Pressable>

            <View style={styles.queueItemDivider} />

            {/* Item 3: TikTok */}
            <Pressable
              style={styles.queueItemRow}
              onPress={() => showToast('TikTok Duet scheduled for Saturday 05:30 PM')}
            >
              <View style={styles.tiktokSquareIcon}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>≈</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueItemTitle}>TikTok Duet</Text>
                <Text style={styles.queueItemTime}>Saturday, 05:30 PM</Text>
              </View>
              <Text style={styles.threeDotsMenu}>⋮</Text>
            </Pressable>
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
              <Switch
                value={autopilotEnabled}
                onValueChange={(val) => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setAutopilotEnabled(val);
                  showToast(val ? 'Autopilot activated' : 'Autopilot paused');
                }}
                trackColor={{ false: '#CBD5E1', true: '#8B5CF6' }}
                thumbColor={autopilotEnabled ? '#582CDB' : '#F8FAFC'}
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
                <View style={[styles.legendDot, { backgroundColor: '#0A66C2' }]} />
                <Text style={styles.legendText}>LINKEDIN</Text>
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
                  if (onOpenJarvisPro) onOpenJarvisPro();
                  else showToast('Opening Jarvis AI Strategy...');
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
              style={({ pressed }) => [styles.moreStrategyBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) onOpenJarvisPro();
                else showToast('Opening Jarvis Pro Strategy Roadmap');
              }}
            >
              <Text style={styles.moreStrategyBtnText}>More Strategy</Text>
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
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
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
                    { id: 'linkedin', label: 'in LinkedIn' },
                  ].map((p) => {
                    const isSelected = selectedPlatform === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        style={[styles.platformPillBtn, isSelected && styles.platformPillBtnActive]}
                        onPress={() => setSelectedPlatform(p.id as any)}
                      >
                        <Text style={[styles.platformPillText, isSelected && styles.platformPillTextActive]}>
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
                  onPress={handleConfirmSchedulePost}
                >
                  <Text style={styles.modalPrimaryActionBtnText}>
                    🚀 Schedule to Autopilot Queue (+50 XP) ➔
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
        {/* MODAL 2: IN-DEPTH PRO FILL GAP RESOLVER MODAL                */}
        {/* ============================================================ */}
        <Modal
          visible={showFillGapModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFillGapModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={styles.modalGoldTagBadge}>
                    <Text style={styles.modalGoldTagBadgeText}>🪄 JARVIS GAP RESOLVER — PRO</Text>
                  </View>
                  <Pressable onPress={() => setShowFillGapModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitleText}>Auto-Fill Detected Schedule Gaps</Text>
                <Text style={styles.modalSubText}>
                  Jarvis detected open slots in your weekly schedule. Select an AI-tailored hook or edit your own to protect your streak.
                </Text>

                {/* Detected Slot Banner */}
                <View style={styles.gapSlotDetectedBanner}>
                  <Text style={styles.gapSlotDetectedTitle}>⚠️ FRIDAY OCT 27 • 7:30 PM</Text>
                  <Text style={styles.gapSlotDetectedSub}>High traffic window without scheduled content</Text>
                </View>

                {/* 3 Selectable Gap Hooks */}
                <Text style={styles.inputLabel}>CHOOSE AI-RECOMMENDED HOOK</Text>
                {GAP_SUGGESTIONS.map((sug, sIdx) => {
                  const isSelected = selectedGapIndex === sIdx;
                  return (
                    <Pressable
                      key={sug.id}
                      style={[
                        styles.gapSuggestionCard,
                        isSelected && styles.gapSuggestionCardSelected,
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedGapIndex(sIdx);
                        setEditableGapTitle(sug.title);
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={styles.gapSugFormatText}>{sug.format}</Text>
                        <View style={styles.gapSugScoreBadge}>
                          <Text style={styles.gapSugScoreText}>{sug.score}</Text>
                        </View>
                      </View>
                      <Text style={[styles.gapSugTitleText, isSelected && { color: '#582CDB' }]}>
                        &ldquo;{sug.title}&rdquo;
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Editable Hook Input */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>EDIT SELECTED HOOK / NOTES</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editableGapTitle}
                  onChangeText={setEditableGapTitle}
                  placeholder="Edit content hook..."
                  placeholderTextColor="#94A3B8"
                />

                {/* Peak Time */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>LOCK IN TIME</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {['7:30 PM (Peak)', '12:00 PM (Mid)'].map((t, tIdx) => {
                    const isSelected = editableGapTime === t;
                    return (
                      <Pressable
                        key={tIdx}
                        style={[styles.timeChipBtn, isSelected && styles.timeChipBtnActive]}
                        onPress={() => setEditableGapTime(t)}
                      >
                        <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Action Buttons */}
                <Pressable
                  style={styles.modalGoldActionBtnWrapper}
                  onPress={handleConfirmFillGap}
                >
                  <LinearGradient
                    colors={['#FDE68A', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGoldBtnGradient}
                  >
                    <Text style={styles.modalGoldActionBtnText}>
                      ✨ Accept &amp; Fill Schedule Slot (+75 XP) ➔
                    </Text>
                  </LinearGradient>
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
        {/* MODAL 3: POST DETAIL PREVIEW MODAL                           */}
        {/* ============================================================ */}
        <Modal
          visible={selectedPostDetail !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPostDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              {selectedPostDetail && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <View style={styles.modalTagBadge}>
                      <Text style={styles.modalTagBadgeText}>📌 SCHEDULED CONTENT</Text>
                    </View>
                    <Pressable onPress={() => setSelectedPostDetail(null)} hitSlop={8}>
                      <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.modalTitleText}>{selectedPostDetail.title}</Text>
                  <Text style={styles.modalSubText}>
                    Platform: {selectedPostDetail.platformLabel} • Time: {selectedPostDetail.time} {selectedPostDetail.period}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <Pressable
                      style={styles.postDetailPrimaryBtn}
                      onPress={() => {
                        showToast('Publishing post now!');
                        setSelectedPostDetail(null);
                      }}
                    >
                      <Text style={styles.postDetailPrimaryBtnText}>🚀 Post Now</Text>
                    </Pressable>
                    <Pressable
                      style={styles.postDetailSecondaryBtn}
                      onPress={() => {
                        showToast('Post rescheduled to next peak window');
                        setSelectedPostDetail(null);
                      }}
                    >
                      <Text style={styles.postDetailSecondaryBtnText}>✏️ Edit Time</Text>
                    </Pressable>
                  </View>
                </>
              )}
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
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
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
    borderRadius: 19,
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
    fontSize: 8.5,
    fontWeight: '900',
    color: '#171420',
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
    shadowOpacity: 0.2,
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
    borderRadius: 19,
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
    paddingBottom: 40,
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.6,
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.4,
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
    fontWeight: '900',
    color: '#171420',
  },
  weeklyOutlookRange: {
    fontSize: 11.5,
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
    fontWeight: '900',
  },
  fillGapsOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillGapsOutlineBtnText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
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
  metricGridLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricGridVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#171420',
  },
  planCompletionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planCompletionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  planCompletionReadyText: {
    fontSize: 10.5,
    fontWeight: '900',
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
    fontWeight: '900',
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
  dayPillCardSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    borderWidth: 1.5,
  },
  dayNameText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  dayNameTextSelected: {
    color: '#582CDB',
    fontWeight: '900',
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#171420',
  },
  expandViewLink: {
    fontSize: 11.5,
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
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#92400E',
  },
  timeBoxGoldSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  scheduleItemTitle: {
    fontSize: 14,
    fontWeight: '900',
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
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  scheduledPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
  },
  recommendedPillBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  recommendedPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
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
    fontSize: 13.5,
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
    fontWeight: '900',
  },

  // SECTION 4: UPCOMING QUEUE
  viewFullQueuePillBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewFullQueuePillText: {
    fontSize: 10.5,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#171420',
  },
  autopilotSubText: {
    fontSize: 11.5,
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
    fontWeight: '900',
    color: '#171420',
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
    fontWeight: '900',
    color: '#171420',
  },
  windowDayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  windowPeakLabel: {
    fontSize: 10.5,
    fontWeight: '900',
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
    fontSize: 13.5,
    fontWeight: '900',
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
    fontSize: 9.5,
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
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  gapWarningTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
    marginTop: 2,
  },
  fillSlotGoldBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
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
    fontWeight: '900',
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
    fontWeight: '900',
  },

  // SECTION 8: JARVIS INSIGHT
  jarvisInsightCard: {
    borderRadius: 24,
    padding: 20,
  },
  jarvisInsightHeader: {
    fontSize: 16,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#92400E',
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
    fontWeight: '900',
    color: '#582CDB',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 4,
  },
  modalSubText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#171420',
  },
  modalTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  platformPillBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  platformPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  timeChipBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontWeight: '900',
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
    fontSize: 11.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  jarvisPredictionSub: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
  },
  modalPrimaryActionBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalPrimaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  modalGoldActionBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  modalGoldBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
  },
  modalGoldActionBtnText: {
    color: '#0C0A12',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
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

  // GAP MODAL SPECIFIC
  gapSlotDetectedBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  gapSlotDetectedTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
  },
  gapSlotDetectedSub: {
    fontSize: 10.5,
    color: '#B45309',
    marginTop: 2,
  },
  gapSuggestionCard: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  gapSuggestionCardSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    borderWidth: 1.5,
  },
  gapSugFormatText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  gapSugScoreBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gapSugScoreText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803D',
  },
  gapSugTitleText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
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
    fontWeight: '900',
  },
  postDetailSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  postDetailSecondaryBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },

  // COMMON
  btnPressed: {
    opacity: 0.85,
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
    fontSize: 12,
    fontWeight: '800',
  },
});
