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
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { LiquidGlassBackground } from '../components/LiquidGlassBackground';

interface CreateScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

interface ScheduledPost {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'x';
  platformLabel: string;
  time: string;
  title: string;
  status: 'scheduled' | 'draft' | 'published';
  viewsForecast?: string;
  viralScore?: number;
  hashtags?: string[];
}

const INITIAL_POSTS: ScheduledPost[] = [
  {
    id: 'post_1',
    platform: 'tiktok',
    platformLabel: 'TikTok',
    time: '11:30 AM',
    title: '3 creator mistakes I stopped making this year',
    status: 'scheduled',
    viewsForecast: '18.4K - 32K',
    viralScore: 94,
    hashtags: ['#creatortips', '#growthmindset', '#contentcreator'],
  },
  {
    id: 'post_2',
    platform: 'instagram',
    platformLabel: 'Instagram Reel',
    time: '7:30 PM',
    title: 'One thing I wish I knew before creating',
    status: 'draft',
    viewsForecast: '9.5K - 16K',
    viralScore: 88,
    hashtags: ['#reelsviral', '#behindthescenes', '#creatorhustle'],
  },
];

const WEEK_DAYS = [
  { day: 'MON', date: 12, fullDate: 'May 12', hasScheduled: true, hasDraft: false },
  { day: 'TUE', date: 13, fullDate: 'May 13', hasScheduled: true, hasDraft: false },
  { day: 'WED', date: 14, fullDate: 'May 14', hasScheduled: true, hasDraft: true },
  { day: 'THU', date: 15, fullDate: 'May 15', isToday: true, hasScheduled: true, hasDraft: true },
  { day: 'FRI', date: 16, fullDate: 'May 16', hasScheduled: false, hasDraft: true },
  { day: 'SAT', date: 17, fullDate: 'May 17', hasScheduled: true, hasDraft: false },
  { day: 'SUN', date: 18, fullDate: 'May 18', hasScheduled: false, hasDraft: false },
];

const AI_VIRAL_HOOKS = [
  {
    hook: 'If you are starting content in 2026, stop doing this immediately...',
    format: 'Short • 45s POV Video',
    platform: 'TikTok',
    viralScore: 96,
    predictedViews: '35K - 60K',
  },
  {
    hook: 'How I gained my first 10,000 engaged followers without spending  on ads',
    format: 'Carousel • 5 Slides',
    platform: 'Instagram',
    viralScore: 92,
    predictedViews: '20K - 38K',
  },
  {
    hook: '3 tools that save me 10 hours every week as a solo creator',
    format: 'Reel • Breakdown',
    platform: 'Instagram',
    viralScore: 89,
    predictedViews: '15K - 28K',
  },
];

// SVG Logos & Vector Icons
const TikTokLogoIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#000000">
    <Path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .592.046.87.135V9.4a6.33 6.33 0 0 0-.87-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48 6.27 6.27 0 0 0 1.86-4.48V8.71a8.28 8.28 0 0 0 5.09 1.74v-3.45a4.86 4.86 0 0 1-1.18-.31z" />
  </Svg>
);

const InstagramReelIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2" />
    <Circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2" />
    <Circle cx="18" cy="6" r="1.2" fill="#E1306C" />
  </Svg>
);

const YouTubeShortsIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="20" height="16" rx="4" fill="#FF0000" />
    <Path d="M10 8.5L16 12L10 15.5V8.5Z" fill="#FFFFFF" />
  </Svg>
);

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onLogout,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [posts, setPosts] = useState<ScheduledPost[]>(INITIAL_POSTS);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showViewPostModal, setShowViewPostModal] = useState(false);
  const [showFinishDraftModal, setShowFinishDraftModal] = useState(false);
  const [showFillSlotModal, setShowFillSlotModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // Form Inputs
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'x'>('tiktok');
  const [newPostTime, setNewPostTime] = useState('5:00 PM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Draft editing
  const [draftTitle, setDraftTitle] = useState('One thing I wish I knew before creating');
  const [draftTime, setDraftTime] = useState('7:30 PM');

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameFloatY, {
            toValue: -4,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(flameScale, {
            toValue: 1.05,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(flameFloatY, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(flameScale, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY, flameScale]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2600),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
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

  const handleSelectDay = (date: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedDay(date);
  };

  const handleScheduleSubmit = () => {
    if (!newPostTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a post hook or title.');
      return;
    }
    const newPost: ScheduledPost = {
      id: 'post_' + Date.now(),
      platform: newPostPlatform,
      platformLabel:
        newPostPlatform === 'tiktok'
          ? 'TikTok'
          : newPostPlatform === 'instagram'
          ? 'Instagram Reel'
          : newPostPlatform === 'youtube'
          ? 'YouTube Short'
          : 'X Post',
      time: newPostTime,
      title: newPostTitle.trim(),
      status: 'scheduled',
      viewsForecast: '15K - 30K',
      viralScore: 92,
    };
    setPosts([newPost, ...posts]);
    setShowScheduleModal(false);
    setNewPostTitle('');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast('✨ Post scheduled to timeline!');
  };

  const handleUseSuggestion = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPosts(
      posts.map((p) =>
        p.id === 'post_2'
          ? { ...p, status: 'scheduled', time: '7:30 PM' }
          : p
      )
    );
    showToast('🔥 Scheduled Reel for 7:30 PM peak window!');
  };

  const handleSaveDraft = () => {
    setPosts(
      posts.map((p) =>
        p.id === 'post_2'
          ? { ...p, title: draftTitle, status: 'scheduled', time: draftTime }
          : p
      )
    );
    setShowFinishDraftModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast('✓ Draft updated and scheduled!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP APP BAR */}
        <View style={styles.headerBar}>
          {/* Top-Left: Jarvis Animated Flame Mascot */}
          <Animated.View
            style={[
              styles.headerLogoWrapper,
              {
                transform: [
                  { translateY: flameFloatY },
                  { scale: flameScale },
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/images/jarvis-core-flame.png')}
              style={styles.headerFlameLogo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Center Pill: Studio Status */}
          <View style={styles.studioStatusPill}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.studioStatusText}>STUDIO FLOW</Text>
          </View>

          {/* Top-Right Group */}
          <View style={styles.headerRightGroup}>
            {/* Chat Bubble */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => showToast('💬 Jarvis Creator Chat is active.')}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => setShowNotificationModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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
              <View style={styles.unreadBadgeDot}>
                <Text style={styles.unreadBadgeText}>1</Text>
              </View>
            </Pressable>

            {/* User Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              hitSlop={6}
              onPress={() => setShowProfileModal(true)}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerProfileImg}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CREATOR STUDIO CONTENT */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION A: DYNAMIC STUDIO HERO LENS */}
          <LiquidGlassBackground
            borderRadius={26}
            light={0.92}
            refraction={30}
            depth={0.7}
            dispersion={0.8}
            frost={55}
            splay={0.85}
            tint="purple-gold"
            accentColor="#582CDB"
            goldAccentColor="#F59E0B"
            hasShadow={true}
            containerStyle={styles.heroLensContainer}
            style={styles.heroLensContent}
          >
            {/* Top Row: Date & Status Badges */}
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroDateLabel}>Thu, May 15 • Today</Text>
                <Text style={styles.heroTitleText}>3 Posts Planned</Text>
              </View>

              {/* Streak Protection Shield Pill */}
              <View style={styles.streakShieldBadge}>
                <Text style={styles.streakFlameIcon}>🔥</Text>
                <Text style={styles.streakShieldText}>Day 48 Safe</Text>
              </View>
            </View>

            {/* Middle Progress Row */}
            <View style={styles.heroProgressRow}>
              <View style={styles.heroProgressTrack}>
                <LinearGradient
                  colors={['#784DF0', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.heroProgressFill, { width: '33.3%' }]}
                />
              </View>
              <Text style={styles.heroProgressStatusText}>1 of 3 published • 33%</Text>
            </View>

            {/* Quick Action Dock Buttons */}
            <View style={styles.heroActionDock}>
              {/* Button 1: Plan Post */}
              <Pressable
                style={({ pressed }) => [styles.heroPrimaryBtn, pressed && styles.btnPressed]}
                onPress={() => setShowScheduleModal(true)}
              >
                <LinearGradient
                  colors={['#7048EC', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroPrimaryGradient}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
                  </Svg>
                  <Text style={styles.heroPrimaryBtnText}>Plan Post</Text>
                </LinearGradient>
              </Pressable>

              {/* Button 2: AI Hook Lab */}
              <Pressable
                style={({ pressed }) => [styles.heroSecondaryBtn, pressed && styles.btnPressed]}
                onPress={() => setShowIdeaModal(true)}
              >
                <Text style={styles.heroSecondaryEmoji}>🪄</Text>
                <Text style={styles.heroSecondaryBtnText}>AI Hook Lab</Text>
              </Pressable>
            </View>
          </LiquidGlassBackground>

          {/* SECTION B: DYNAMIC STUDIO CALENDAR STRIP */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarSectionHeader}>
              <Text style={styles.calendarSectionTitle}>This Week: 8 Planned</Text>
              <Pressable onPress={() => setShowCalendarModal(true)} hitSlop={8}>
                <Text style={styles.viewMonthLink}>View Full Month</Text>
              </Pressable>
            </View>

            <View style={styles.daysStripContainer}>
              {WEEK_DAYS.map((dayItem) => {
                const isSelected = selectedDay === dayItem.date;
                return (
                  <Pressable
                    key={dayItem.day}
                    onPress={() => handleSelectDay(dayItem.date)}
                    style={[
                      styles.dayItemBtn,
                      isSelected && styles.dayItemBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayItemName,
                        isSelected && styles.dayItemNameActive,
                      ]}
                    >
                      {dayItem.day}
                    </Text>
                    <Text
                      style={[
                        styles.dayItemDate,
                        isSelected && styles.dayItemDateActive,
                      ]}
                    >
                      {dayItem.date}
                    </Text>

                    {/* Status Dot */}
                    <View style={styles.dayDotContainer}>
                      {isSelected ? (
                        <View style={styles.activeDayDot} />
                      ) : dayItem.hasScheduled ? (
                        <View style={styles.scheduledDot} />
                      ) : dayItem.hasDraft ? (
                        <View style={styles.draftDot} />
                      ) : (
                        <View style={styles.openDot} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* SECTION C: CHRONOLOGICAL TIME-STREAM */}
          <View style={styles.timeStreamSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Today&apos;s Time-Stream</Text>
              <Text style={styles.sectionSubHeading}>Next slot in 45m</Text>
            </View>

            {/* Timeline Node 1: TikTok Scheduled */}
            <View style={styles.timelineItemWrapper}>
              <View style={styles.timelineTrackContainer}>
                <View style={styles.timelineNodePurple}>
                  <View style={styles.timelineNodeInnerDot} />
                </View>
                <View style={styles.timelineVerticalLine} />
              </View>

              <View style={styles.timelineCard}>
                <View style={styles.timelineCardHeader}>
                  <View style={styles.platformRow}>
                    <TikTokLogoIcon />
                    <Text style={styles.platformTimeText}>TikTok • 11:30 AM</Text>
                  </View>
                  <View style={styles.viralScoreBadge}>
                    <Text style={styles.viralScoreText}>🔥 94 Score</Text>
                  </View>
                </View>

                <Text style={styles.timelineCardTitle}>
                  3 creator mistakes I stopped making this year
                </Text>

                <View style={styles.timelineCardFooter}>
                  <Text style={styles.forecastViewsText}>📈 Forecast: 18.4K - 32K</Text>
                  <Pressable
                    style={({ pressed }) => [styles.viewDetailsBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setSelectedPost(posts[0]);
                      setShowViewPostModal(true);
                    }}
                  >
                    <Text style={styles.viewDetailsBtnText}>View Details</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Timeline Node 2: Golden Open Afternoon Slot */}
            <View style={styles.timelineItemWrapper}>
              <View style={styles.timelineTrackContainer}>
                <View style={styles.timelineNodeGold}>
                  <Text style={{ fontSize: 10 }}>⚡</Text>
                </View>
                <View style={styles.timelineVerticalLine} />
              </View>

              <View style={[styles.timelineCard, styles.goldenSlotCard]}>
                <View style={styles.timelineCardHeader}>
                  <View style={styles.platformRow}>
                    <YouTubeShortsIcon />
                    <Text style={styles.platformTimeText}>YouTube Shorts • 4:00 PM</Text>
                  </View>
                  <View style={styles.goldenSlotBadge}>
                    <Text style={styles.goldenSlotBadgeText}>Peak Window</Text>
                  </View>
                </View>

                <Text style={styles.goldenSlotPrompt}>
                  Open slot: Perfect time to post a quick behind-the-scenes Short.
                </Text>

                <Pressable
                  style={({ pressed }) => [styles.fillSlotActionBtn, pressed && styles.btnPressed]}
                  onPress={() => setShowFillSlotModal(true)}
                >
                  <Text style={styles.fillSlotActionBtnText}>+ Auto-Fill with AI Hook</Text>
                </Pressable>
              </View>
            </View>

            {/* Timeline Node 3: Instagram Reel Draft */}
            <View style={styles.timelineItemWrapper}>
              <View style={styles.timelineTrackContainer}>
                <View style={styles.timelineNodeAmber}>
                  <View style={styles.timelineNodeInnerDotAmber} />
                </View>
              </View>

              <View style={[styles.timelineCard, styles.draftCardBorder]}>
                <View style={styles.timelineCardHeader}>
                  <View style={styles.platformRow}>
                    <InstagramReelIcon />
                    <Text style={styles.platformTimeText}>Instagram Reel • 7:30 PM</Text>
                  </View>
                  <View style={styles.draftStatusBadge}>
                    <Text style={styles.draftStatusText}>Draft</Text>
                  </View>
                </View>

                <Text style={styles.timelineCardTitle}>
                  One thing I wish I knew before creating
                </Text>

                <View style={styles.timelineCardFooter}>
                  <Text style={styles.forecastViewsText}>⏳ Needs final hook audio</Text>
                  <Pressable
                    style={({ pressed }) => [styles.polishDraftBtn, pressed && styles.btnPressed]}
                    onPress={() => setShowFinishDraftModal(true)}
                  >
                    <Text style={styles.polishDraftBtnText}>⚡ Finish Draft</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION D: STUDIO INTELLIGENCE BENTO GRID */}
          <View style={styles.bentoSection}>
            <Text style={styles.sectionHeading}>Studio Intelligence</Text>

            <View style={styles.bentoRow}>
              {/* Bento Tile 1: Platform Load Radar */}
              <View style={styles.bentoTile}>
                <Text style={styles.bentoTileTitle}>Platform Load</Text>
                <Text style={styles.bentoTileSub}>TikTok is your weekly focus</Text>

                <View style={styles.bentoBarGroup}>
                  <View style={styles.bentoBarRow}>
                    <Text style={styles.bentoPlatformName}>TikTok</Text>
                    <Text style={styles.bentoPlatformCount}>3 posts (45%)</Text>
                  </View>
                  <View style={styles.bentoTrack}>
                    <View style={[styles.bentoFill, { width: '45%', backgroundColor: '#582CDB' }]} />
                  </View>
                </View>

                <View style={styles.bentoBarGroup}>
                  <View style={styles.bentoBarRow}>
                    <Text style={styles.bentoPlatformName}>Instagram</Text>
                    <Text style={styles.bentoPlatformCount}>2 posts (30%)</Text>
                  </View>
                  <View style={styles.bentoTrack}>
                    <View style={[styles.bentoFill, { width: '30%', backgroundColor: '#E1306C' }]} />
                  </View>
                </View>

                <View style={styles.bentoBarGroup}>
                  <View style={styles.bentoBarRow}>
                    <Text style={styles.bentoPlatformName}>YouTube</Text>
                    <Text style={styles.bentoPlatformCount}>2 posts (25%)</Text>
                  </View>
                  <View style={styles.bentoTrack}>
                    <View style={[styles.bentoFill, { width: '25%', backgroundColor: '#FF0000' }]} />
                  </View>
                </View>
              </View>

              {/* Bento Tile 2: Consistency Score */}
              <View style={styles.bentoTile}>
                <Text style={styles.bentoTileTitle}>Consistency</Text>
                <Text style={styles.bentoTileSub}>Score: 98% (Grade A+)</Text>

                <View style={styles.consistencyScoreRing}>
                  <Text style={styles.consistencyScoreBig}>A+</Text>
                  <Text style={styles.consistencyScoreSubtitle}>8 / 8 on pace</Text>
                </View>

                <View style={styles.consistencyStatRow}>
                  <Text style={styles.consistencyStatLabel}>Streak Risk:</Text>
                  <Text style={styles.consistencyStatValZero}>0% Low</Text>
                </View>

                <View style={styles.consistencyStatRow}>
                  <Text style={styles.consistencyStatLabel}>Best Window:</Text>
                  <Text style={styles.consistencyStatValHighlight}>7:30 PM</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION E: JARVIS VIRAL HOOK LAB */}
          <View style={styles.viralLabSection}>
            <LiquidGlassBackground
              borderRadius={22}
              light={0.88}
              refraction={25}
              depth={0.65}
              dispersion={0.7}
              frost={45}
              splay={0.8}
              tint="purple-gold"
              accentColor="#582CDB"
              goldAccentColor="#F59E0B"
              hasShadow={true}
              style={styles.viralLabContent}
            >
              <View style={styles.viralLabHeader}>
                <View style={styles.viralLabTitleRow}>
                  <Text style={{ fontSize: 16 }}>🪄</Text>
                  <Text style={styles.viralLabHeading}>Jarvis Viral Hook Lab</Text>
                </View>
                <View style={styles.nicheBadgePill}>
                  <Text style={styles.nicheBadgeText}>Lifestyle &amp; Comedy</Text>
                </View>
              </View>

              <Text style={styles.viralLabDescription}>
                Jarvis AI analyzed 1,400 viral videos in your niche this morning. Here is today&apos;s highest potential hook:
              </Text>

              <View style={styles.viralHookPreviewCard}>
                <Text style={styles.viralHookQuote}>
                  &ldquo;If you are starting content in 2026, stop doing this immediately...&rdquo;
                </Text>
                <View style={styles.viralHookMetaRow}>
                  <Text style={styles.viralHookScoreTag}>⚡ 96% Viral Probability</Text>
                  <Text style={styles.viralHookFormatTag}>• 45s POV TikTok</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.useViralHookBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setNewPostTitle('If you are starting content in 2026, stop doing this immediately...');
                  setNewPostPlatform('tiktok');
                  setShowScheduleModal(true);
                }}
              >
                <LinearGradient
                  colors={['#7048EC', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.useViralHookGradient}
                >
                  <Text style={styles.useViralHookBtnText}>Use Hook in Schedule</Text>
                </LinearGradient>
              </Pressable>
            </LiquidGlassBackground>
          </View>

          {/* SECTION F: FOOTER ATTRIBUTION */}
          <View style={styles.footerNoteContainer}>
            <Text style={styles.footerNoteText}>
              Free creators can plan and track up to 10 active posts.{' '}
              <Text style={styles.footerNoteLink}>Pro unlocks unlimited multi-platform auto-posting</Text>.
            </Text>
          </View>
        </ScrollView>

        {/* 3. TOAST NOTIFICATION BANNER */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* 4. APPLE-STYLE LIQUID GLASS FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* MODAL 1: SCHEDULE NEW POST */}
        <Modal
          visible={showScheduleModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScheduleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Plan New Post</Text>
              <Text style={styles.modalSubtitle}>
                Add a new hook or video prompt to your creator time-stream.
              </Text>

              <Text style={styles.modalInputLabel}>PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {(['tiktok', 'instagram', 'youtube', 'x'] as const).map((plat) => (
                  <Pressable
                    key={plat}
                    onPress={() => setNewPostPlatform(plat)}
                    style={[
                      styles.platformSelectBtn,
                      newPostPlatform === plat && styles.platformSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.platformSelectBtnText,
                        newPostPlatform === plat && styles.platformSelectBtnTextActive,
                      ]}
                    >
                      {plat === 'tiktok'
                        ? 'TikTok'
                        : plat === 'instagram'
                        ? 'Instagram'
                        : plat === 'youtube'
                        ? 'YouTube'
                        : 'X'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalInputLabel}>HOOK / TITLE</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. 5 rules that changed my creator career..."
                placeholderTextColor="#A39CB5"
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />

              <Text style={styles.modalInputLabel}>SCHEDULE TIME</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="11:30 AM"
                placeholderTextColor="#A39CB5"
                value={newPostTime}
                onChangeText={setNewPostTime}
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowScheduleModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalPrimaryBtn} onPress={handleScheduleSubmit}>
                  <Text style={styles.modalPrimaryBtnText}>Schedule Post</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: AI HOOK LAB MODAL */}
        <Modal
          visible={showIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.jarvisCoreBadge}>
                <Text style={styles.jarvisBadgeSparkle}>🔥</Text>
                <Text style={styles.jarvisBadgeText}>JARVIS VIRAL HOOKS</Text>
              </View>
              <Text style={styles.modalTitle}>AI Hook Sparks</Text>
              <Text style={styles.modalSubtitle}>
                Select a trending concept to import directly into your schedule.
              </Text>

              {AI_VIRAL_HOOKS.map((hookItem, idx) => (
                <Pressable
                  key={idx}
                  style={styles.ideaItemCard}
                  onPress={() => {
                    setNewPostTitle(hookItem.hook);
                    setShowIdeaModal(false);
                    setShowScheduleModal(true);
                  }}
                >
                  <Text style={styles.ideaItemTitle}>{hookItem.hook}</Text>
                  <View style={styles.ideaFormatRow}>
                    <Text style={styles.ideaFormatTag}>⚡ {hookItem.viralScore} Score</Text>
                    <Text style={styles.ideaPlatformTag}>• {hookItem.format}</Text>
                  </View>
                </Pressable>
              ))}

              <Pressable
                style={[styles.modalPrimaryBtn, { marginTop: 12 }]}
                onPress={() => setShowIdeaModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: VIEW SCHEDULED POST DETAILS */}
        <Modal
          visible={showViewPostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowViewPostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Scheduled Post</Text>
              <Text style={styles.modalSubtitle}>
                {selectedPost?.platformLabel} • {selectedPost?.time}
              </Text>

              <View style={styles.postDetailsCard}>
                <Text style={styles.postDetailsTitle}>{selectedPost?.title}</Text>
                <Text style={styles.postDetailsForecast}>
                  📈 Viral Score: {selectedPost?.viralScore || 94}/100 • Predicted {selectedPost?.viewsForecast || '18K views'}
                </Text>
                <View style={styles.hashtagsRow}>
                  {selectedPost?.hashtags?.map((tag, i) => (
                    <Text key={i} style={styles.hashtagPill}>
                      {tag}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowViewPostModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Done</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setShowViewPostModal(false);
                    showToast('✓ Post preview confirmed!');
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Edit Caption</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 4: FINISH DRAFT */}
        <Modal
          visible={showFinishDraftModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFinishDraftModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Finish Reel Draft</Text>
              <Text style={styles.modalSubtitle}>
                Add final hook adjustments and lock in for tonight&apos;s 7:30 PM peak reach window.
              </Text>

              <Text style={styles.modalInputLabel}>HOOK TITLE</Text>
              <TextInput
                style={styles.modalTextInput}
                value={draftTitle}
                onChangeText={setDraftTitle}
              />

              <Text style={styles.modalInputLabel}>SCHEDULE TIME</Text>
              <TextInput
                style={styles.modalTextInput}
                value={draftTime}
                onChangeText={setDraftTime}
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowFinishDraftModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalPrimaryBtn} onPress={handleSaveDraft}>
                  <Text style={styles.modalPrimaryBtnText}>Schedule Draft</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 5: FILL TOMORROW'S SLOT */}
        <Modal
          visible={showFillSlotModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFillSlotModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Fill Afternoon Peak Slot</Text>
              <Text style={styles.modalSubtitle}>
                Auto-fill 4:00 PM with a high-retention YouTube Short concept:
              </Text>

              <Pressable
                style={styles.ideaItemCard}
                onPress={() => {
                  setPosts([
                    {
                      id: 'post_' + Date.now(),
                      platform: 'youtube',
                      platformLabel: 'YouTube Short',
                      time: '4:00 PM',
                      title: 'Behind the scenes: My creator filming setup',
                      status: 'scheduled',
                      viewsForecast: '15K - 28K',
                      viralScore: 91,
                    },
                    ...posts,
                  ]);
                  setShowFillSlotModal(false);
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  showToast('🔥 Peak afternoon slot locked!');
                }}
              >
                <Text style={styles.ideaItemTitle}>
                  Behind the scenes: My creator filming setup
                </Text>
                <Text style={styles.ideaFormatTag}>⚡ 91 Score • Recommended YouTube Short</Text>
              </Pressable>

              <Pressable
                style={[styles.modalCancelBtn, { width: '100%', marginTop: 10 }]}
                onPress={() => setShowFillSlotModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 6: FULL MONTH CALENDAR MODAL */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>May 2026 Schedule</Text>
              <Text style={styles.modalSubtitle}>
                Total 32 posts planned this month • 47-Day Active Streak
              </Text>

              <View style={styles.fullCalendarGrid}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((header, hIdx) => (
                  <View key={hIdx} style={styles.calendarDayHeader}>
                    <Text style={styles.calendarDayHeaderText}>{header}</Text>
                  </View>
                ))}
                {Array.from({ length: 31 }).map((_, dIdx) => {
                  const dayNum = dIdx + 1;
                  const isCur = dayNum === 15;
                  const hasPost = [2, 5, 8, 12, 13, 14, 15, 16, 19, 22, 26].includes(dayNum);
                  return (
                    <View
                      key={dIdx}
                      style={[
                        styles.calendarCell,
                        isCur && styles.calendarCellActive,
                        hasPost && !isCur && styles.calendarCellHasPost,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          isCur && styles.calendarCellTextActive,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 16 }]}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 7: NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Studio Alerts</Text>
              <Text style={styles.modalSubtitle}>Latest updates from Jarvis AI &amp; Platform Feeds</Text>

              <View style={styles.notifItemCard}>
                <Text style={styles.notifItemTitle}>⏰ Peak Window Approaching</Text>
                <Text style={styles.notifItemBody}>
                  TikTok algorithm is currently peaking for creator advice topics. Your 11:30 AM slot is optimized.
                </Text>
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 12 }]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 8: CREATOR PROFILE MODAL */}
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={{ width: 70, height: 70, marginBottom: 8 }}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Creator Studio</Text>
              <Text style={styles.modalSubtitle}>Level 1 Starter Creator • 47-Day Streak</Text>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 12 }]}
                onPress={() => {
                  setShowProfileModal(false);
                  if (onLogout) onLogout();
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Log Out</Text>
              </Pressable>

              <Pressable
                style={[styles.modalCancelBtn, { width: '100%', marginTop: 8 }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </View>
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
    backgroundColor: '#FAF8F5',
  },

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerFlameLogo: {
    width: 32,
    height: 32,
  },
  studioStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(235, 230, 248, 0.8)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.8)',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  studioStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    position: 'relative',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  headerProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    overflow: 'hidden',
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileImg: {
    width: 30,
    height: 30,
  },

  // 2. SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 120,
  },

  // SECTION A: HERO LENS
  heroLensContainer: {
    marginBottom: 16,
  },
  heroLensContent: {
    padding: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F7894',
    marginBottom: 2,
  },
  heroTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
  },
  streakShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 251, 235, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  streakFlameIcon: {
    fontSize: 12,
  },
  streakShieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  heroProgressRow: {
    marginBottom: 16,
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(234, 229, 248, 0.85)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroProgressStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#524C62',
  },
  heroActionDock: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroPrimaryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  heroPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  heroSecondaryEmoji: {
    fontSize: 14,
  },
  heroSecondaryBtnText: {
    color: '#171420',
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION B: CALENDAR STRIP
  calendarSection: {
    marginBottom: 18,
  },
  calendarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
  },
  viewMonthLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  daysStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dayItemBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  dayItemBtnActive: {
    backgroundColor: '#582CDB',
  },
  dayItemName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7F7894',
    marginBottom: 2,
  },
  dayItemNameActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dayItemDate: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 3,
  },
  dayItemDateActive: {
    color: '#FFFFFF',
  },
  dayDotContainer: {
    height: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDE047',
  },
  scheduledDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#784DF0',
  },
  draftDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  openDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },

  // SECTION C: TIME-STREAM
  timeStreamSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#7F7894',
    fontWeight: '500',
  },
  timelineItemWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineTrackContainer: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  timelineNodePurple: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  timelineNodeGold: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeAmber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeInnerDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  timelineVerticalLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: 'rgba(221, 214, 254, 0.7)',
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 14,
  },
  goldenSlotCard: {
    backgroundColor: 'rgba(255, 253, 245, 0.92)',
    borderColor: 'rgba(254, 243, 199, 0.95)',
    borderStyle: 'dashed',
  },
  draftCardBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#F59E0B',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524C62',
  },
  viralScoreBadge: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  viralScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  goldenSlotBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  goldenSlotBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  draftStatusBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  draftStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  timelineCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 19,
    marginBottom: 8,
  },
  goldenSlotPrompt: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
    marginBottom: 10,
  },
  timelineCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastViewsText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7F7894',
  },
  viewDetailsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#582CDB',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  viewDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  fillSlotActionBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  fillSlotActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  polishDraftBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  polishDraftBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // SECTION D: BENTO GRID
  bentoSection: {
    marginBottom: 18,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  bentoTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 14,
  },
  bentoTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 1,
  },
  bentoTileSub: {
    fontSize: 10.5,
    color: '#7F7894',
    marginBottom: 10,
  },
  bentoBarGroup: {
    marginBottom: 8,
  },
  bentoBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  bentoPlatformName: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#171420',
  },
  bentoPlatformCount: {
    fontSize: 9.5,
    color: '#7F7894',
  },
  bentoTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
    overflow: 'hidden',
  },
  bentoFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  consistencyScoreRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  consistencyScoreBig: {
    fontSize: 24,
    fontWeight: '800',
    color: '#582CDB',
  },
  consistencyScoreSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#524C62',
  },
  consistencyStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  consistencyStatLabel: {
    fontSize: 10.5,
    color: '#7F7894',
  },
  consistencyStatValZero: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10B981',
  },
  consistencyStatValHighlight: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },

  // SECTION E: VIRAL HOOK LAB
  viralLabSection: {
    marginBottom: 14,
  },
  viralLabContent: {
    padding: 16,
  },
  viralLabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  viralLabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viralLabHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },
  nicheBadgePill: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nicheBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  viralLabDescription: {
    fontSize: 11.5,
    color: '#524C62',
    lineHeight: 16,
    marginBottom: 10,
  },
  viralHookPreviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    padding: 12,
    marginBottom: 10,
  },
  viralHookQuote: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#171420',
    lineHeight: 17,
    marginBottom: 6,
  },
  viralHookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viralHookScoreTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  viralHookFormatTag: {
    fontSize: 10.5,
    color: '#7F7894',
  },
  useViralHookBtn: {
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
  },
  useViralHookGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useViralHookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // FOOTER NOTE
  footerNoteContainer: {
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  footerNoteText: {
    fontSize: 10.5,
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 15,
  },
  footerNoteLink: {
    color: '#582CDB',
    fontWeight: '700',
  },

  // TOAST
  toastContainer: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 20, 32, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#7F7894',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 17,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#524C62',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 44,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    marginBottom: 12,
  },
  platformSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  platformSelectBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  platformSelectBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformSelectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#524C62',
  },
  platformSelectBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jarvisCoreBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 8,
    gap: 5,
  },
  jarvisBadgeSparkle: {
    fontSize: 12,
  },
  jarvisBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  ideaItemCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    padding: 12,
    marginBottom: 8,
  },
  ideaItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  ideaFormatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ideaFormatTag: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '600',
  },
  ideaPlatformTag: {
    fontSize: 11,
    color: '#7F7894',
  },
  postDetailsCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    marginBottom: 14,
  },
  postDetailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
  },
  postDetailsForecast: {
    fontSize: 11.5,
    color: '#524C62',
    fontWeight: '500',
    marginBottom: 8,
  },
  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hashtagPill: {
    fontSize: 11,
    color: '#582CDB',
    backgroundColor: '#EDE8FC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fullCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginVertical: 10,
  },
  calendarDayHeader: {
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F7894',
  },
  calendarCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8FF',
  },
  calendarCellActive: {
    backgroundColor: '#582CDB',
  },
  calendarCellHasPost: {
    backgroundColor: '#EDE8FC',
  },
  calendarCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#171420',
  },
  calendarCellTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  notifItemCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    marginBottom: 10,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  notifItemBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
