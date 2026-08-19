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
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
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
  { dayName: 'WED', dayNum: 25, dotsCount: 1, isToday: true },
  { dayName: 'THU', dayNum: 26, dotsCount: 1 },
  { dayName: 'FRI', dayNum: 27, dotsCount: 2 },
  { dayName: 'SAT', dayNum: 28, dotsCount: 1 },
  { dayName: 'SUN', dayNum: 29, dotsCount: 2 },
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSchedulePostModal, setShowSchedulePostModal] = useState(false);
  const [showFillGapModal, setShowFillGapModal] = useState(false);
  const [postTitleInput, setPostTitleInput] = useState('');
  const [postTimeInput, setPostTimeInput] = useState('7:30 PM');
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'linkedin'>('instagram');
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

  const handleCreateScheduledPost = () => {
    if (!postTitleInput.trim()) {
      showToast('Please enter a content title or hook');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast(`Scheduled "${postTitleInput.trim()}" for ${postTimeInput}!`);
    setShowSchedulePostModal(false);
    setPostTitleInput('');
  };

  const handleAutoFillGap = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast('Auto-filled Friday 7:30 PM gap with Storytelling Reel!');
    setShowFillGapModal(false);
  };

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
                colors={['#FEF08A', '#FDE047']}
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

            {/* 2x2 METRICS GRID */}
            <View style={styles.metrics2x2Grid}>
              <View style={styles.metricGridTile}>
                <Text style={styles.metricGridLabel}>SCHEDULED</Text>
                <Text style={styles.metricGridVal}>5</Text>
              </View>
              <View style={styles.metricGridTile}>
                <Text style={styles.metricGridLabel}>DRAFTS</Text>
                <Text style={styles.metricGridVal}>2</Text>
              </View>
              <View style={styles.metricGridTile}>
                <Text style={styles.metricGridLabel}>POSTED</Text>
                <Text style={styles.metricGridVal}>1</Text>
              </View>
              <View style={styles.metricGridTile}>
                <Text style={styles.metricGridLabel}>OPEN SLOTS</Text>
                <Text style={styles.metricGridVal}>2</Text>
              </View>
            </View>

            {/* PLAN COMPLETION PROGRESS */}
            <View style={styles.planCompletionHeaderRow}>
              <Text style={styles.planCompletionLabel}>PLAN COMPLETION</Text>
              <Text style={styles.planCompletionReadyText}>65% READY</Text>
            </View>
            <View style={styles.planCompletionProgressBarTrack}>
              <LinearGradient
                colors={['#582CDB', '#8B5CF6', '#EAB308']}
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
              onPress={() => showToast('Opening expanded schedule timeline')}
              hitSlop={8}
            >
              <Text style={styles.expandViewLink}>Expand View ↗</Text>
            </Pressable>
          </View>

          <View style={{ gap: 10, marginBottom: 18 }}>
            {/* Post 1: Scheduled */}
            <View style={styles.scheduleItemCard}>
              <View style={styles.timeBoxPurple}>
                <Text style={styles.timeBoxPurpleText}>11:30</Text>
                <Text style={styles.timeBoxPurpleSub}>AM</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleItemTitle}>3 creator mistakes...</Text>
                <Text style={styles.scheduleItemPlatform}>≈ TikTok</Text>
              </View>

              <View style={styles.scheduledPillBadge}>
                <Text style={styles.scheduledPillBadgeText}>SCHEDULED</Text>
              </View>
            </View>

            {/* Post 2: Recommended */}
            <View style={[styles.scheduleItemCard, styles.scheduleItemCardGoldBorder]}>
              <View style={styles.timeBoxGold}>
                <Text style={styles.timeBoxGoldText}>07:30</Text>
                <Text style={styles.timeBoxGoldSub}>PM</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleItemTitle}>Personal lesson Reel</Text>
                <Text style={styles.scheduleItemPlatform}>📸 IG Reel</Text>
              </View>

              <View style={styles.recommendedPillBadge}>
                <Text style={styles.recommendedPillBadgeText}>RECOMMENDED</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 4: UPCOMING QUEUE                                    */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithLink}>
            <Text style={styles.sectionHeaderTitleBold}>Upcoming Queue</Text>
            <Pressable
              style={styles.viewFullQueuePillBtn}
              onPress={() => showToast('Displaying full 30-day queue')}
              hitSlop={8}
            >
              <Text style={styles.viewFullQueuePillText}>View Full Queue</Text>
            </Pressable>
          </View>

          <View style={styles.queueContainerCard}>
            {/* Item 1: LinkedIn */}
            <View style={styles.queueItemRow}>
              <View style={styles.linkedinSquareIcon}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>in</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueItemTitle}>LinkedIn Insight</Text>
                <Text style={styles.queueItemTime}>Tomorrow, 10:00 AM</Text>
              </View>
              <Pressable onPress={() => showToast('Opening options')} hitSlop={8}>
                <Text style={styles.threeDotsMenu}>⋮</Text>
              </Pressable>
            </View>

            <View style={styles.queueItemDivider} />

            {/* Item 2: Instagram */}
            <View style={styles.queueItemRow}>
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
              <Pressable onPress={() => showToast('Opening options')} hitSlop={8}>
                <Text style={styles.threeDotsMenu}>⋮</Text>
              </Pressable>
            </View>

            <View style={styles.queueItemDivider} />

            {/* Item 3: TikTok */}
            <View style={styles.queueItemRow}>
              <View style={styles.tiktokSquareIcon}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>≈</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueItemTitle}>TikTok Duet</Text>
                <Text style={styles.queueItemTime}>Saturday, 05:30 PM</Text>
              </View>
              <Pressable onPress={() => showToast('Opening options')} hitSlop={8}>
                <Text style={styles.threeDotsMenu}>⋮</Text>
              </Pressable>
            </View>
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
                  Autopilot: <Text style={{ color: '#582CDB' }}>Active</Text>
                </Text>
                <Text style={styles.autopilotSubText}>
                  Your strongest posting windows are being prioritized.
                </Text>
              </View>
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
                style={({ pressed }) => [styles.fillSlotDarkBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  handleAutoFillGap();
                }}
              >
                <Text style={styles.fillSlotDarkBtnText}>Fill Slot</Text>
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
            style={[styles.jarvisInsightCard, { marginBottom: 120 }]}
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
        {/* MODAL 1: SCHEDULE POST MODAL                                 */}
        {/* ============================================================ */}
        <Modal
          visible={showSchedulePostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSchedulePostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={styles.modalTagBadge}>
                  <Text style={styles.modalTagBadgeText}>⚡ SMART SCHEDULER</Text>
                </View>
                <Pressable onPress={() => setShowSchedulePostModal(false)} hitSlop={8}>
                  <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitleText}>Schedule New Post</Text>
              <Text style={styles.modalSubText}>Lock in your optimal 7:30 PM peak engagement window</Text>

              {/* Title / Hook Input */}
              <TextInput
                style={styles.modalInput}
                placeholder="Post title or hook (e.g. 3 creator mistakes)"
                placeholderTextColor="#94A3B8"
                value={postTitleInput}
                onChangeText={setPostTitleInput}
              />

              {/* Platform Selector */}
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 12 }}>
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

              {/* Action Button */}
              <Pressable
                style={styles.modalPrimaryActionBtn}
                onPress={handleCreateScheduledPost}
              >
                <Text style={styles.modalPrimaryActionBtnText}>Schedule at 7:30 PM ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 2: FILL GAP RECOMMENDATION MODAL                       */}
        {/* ============================================================ */}
        <Modal
          visible={showFillGapModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFillGapModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={styles.modalTagBadge}>
                  <Text style={styles.modalTagBadgeText}>🪄 JARVIS GAP DETECTOR</Text>
                </View>
                <Pressable onPress={() => setShowFillGapModal(false)} hitSlop={8}>
                  <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitleText}>Fill Friday Gap Slot</Text>
              <Text style={styles.modalSubText}>
                Jarvis prepared a 30-second storytelling Reel draft to maintain your 78-day streak momentum.
              </Text>

              <View style={styles.gapSuggestionBox}>
                <Text style={styles.gapSuggestionTitle}>&ldquo;Why 90% of creators quit by month 2&rdquo;</Text>
                <Text style={styles.gapSuggestionSub}>Estimated retention: 42s • 94% Niche Relevance</Text>
              </View>

              <Pressable
                style={styles.modalPrimaryActionBtn}
                onPress={handleAutoFillGap}
              >
                <Text style={styles.modalPrimaryActionBtnText}>Accept &amp; Schedule Slot ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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
    borderColor: '#FEF08A',
  },
  proHeaderBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#78350F',
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
    borderColor: '#EAB308',
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
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  contentScheduleTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
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
    color: '#78350F',
    fontSize: 13,
    fontWeight: '900',
  },
  metrics2x2Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricGridTile: {
    width: (SCREEN_WIDTH - 80 - 8) / 2,
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
    width: (SCREEN_WIDTH - 40 - 24) / 7,
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
    backgroundColor: '#EAB308',
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
    borderLeftColor: '#EAB308',
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
    backgroundColor: '#FEF08A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBoxGoldText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#78350F',
  },
  timeBoxGoldSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
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
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  recommendedPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#78350F',
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
    color: '#78350F',
    letterSpacing: 0.5,
  },
  gapWarningTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
    marginTop: 2,
  },
  fillSlotDarkBtn: {
    flex: 1,
    backgroundColor: '#78350F',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillSlotDarkBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
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
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
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
    marginBottom: 12,
    lineHeight: 17,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#171420',
  },
  platformPillBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
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
  modalPrimaryActionBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalPrimaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  gapSuggestionBox: {
    backgroundColor: '#FAF8F5',
    borderLeftWidth: 3,
    borderLeftColor: '#582CDB',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  gapSuggestionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  gapSuggestionSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
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
