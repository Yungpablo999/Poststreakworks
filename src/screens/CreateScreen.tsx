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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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
    hashtags: ['#creatortips', '#growthmindset'],
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
    hashtags: ['#reelsviral', '#behindthescenes'],
  },
];

const WEEK_DAYS = [
  { day: 'M', date: 12, hasPost: true },
  { day: 'T', date: 13, hasPost: true },
  { day: 'W', date: 14, hasPost: true },
  { day: 'T', date: 15, isToday: true, hasPost: true },
  { day: 'F', date: 16, hasPost: true },
  { day: 'S', date: 17, hasPost: false },
  { day: 'S', date: 18, hasPost: false },
];

const AI_VIRAL_HOOKS = [
  {
    hook: 'If you are starting content in 2026, stop doing this immediately...',
    format: '45s POV Video',
    platform: 'TikTok',
    viralScore: 96,
  },
  {
    hook: 'How I gained my first 10,000 engaged followers with 0 ad spend',
    format: '5-Slide Carousel',
    platform: 'Instagram',
    viralScore: 92,
  },
  {
    hook: '3 tools that save me 10 hours every week as a solo creator',
    format: 'Breakdown Reel',
    platform: 'Instagram',
    viralScore: 89,
  },
];

const TikTokLogoIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="#171420">
    <Path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .592.046.87.135V9.4a6.33 6.33 0 0 0-.87-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48 6.27 6.27 0 0 0 1.86-4.48V8.71a8.28 8.28 0 0 0 5.09 1.74v-3.45a4.86 4.86 0 0 1-1.18-.31z" />
  </Svg>
);

const InstagramReelIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2" />
    <Circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2" />
    <Circle cx="18" cy="6" r="1.2" fill="#E1306C" />
  </Svg>
);

const YouTubeShortsIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
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
  const [activeViewMode, setActiveViewMode] = useState<'schedule' | 'ideas'>('schedule');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showViewPostModal, setShowViewPostModal] = useState(false);
  const [showEditCaptionModal, setShowEditCaptionModal] = useState(false);
  const [showFinishDraftModal, setShowFinishDraftModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // Form Inputs
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'x'>('tiktok');
  const [newPostTime, setNewPostTime] = useState('5:00 PM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Caption Inputs
  const [editCaptionTitle, setEditCaptionTitle] = useState('');
  const [editCaptionHashtags, setEditCaptionHashtags] = useState('#creatortips #growthmindset');

  // Draft editing
  const [draftTitle, setDraftTitle] = useState('One thing I wish I knew before creating');
  const [draftTime, setDraftTime] = useState('7:30 PM');

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2400),
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

  const handleOpenEditCaption = () => {
    setShowViewPostModal(false);
    if (selectedPost) {
      setEditCaptionTitle(selectedPost.title);
      setEditCaptionHashtags(
        selectedPost.hashtags && selectedPost.hashtags.length > 0
          ? selectedPost.hashtags.join(' ')
          : '#creatortips #growthmindset'
      );
    }
    setShowEditCaptionModal(true);
  };

  const handleSaveEditedCaption = () => {
    if (!editCaptionTitle.trim()) {
      Alert.alert('Missing Caption', 'Please enter a caption or hook.');
      return;
    }
    const cleanHashtags = editCaptionHashtags
      .split(' ')
      .map((h) => h.trim())
      .filter((h) => h.length > 0)
      .map((h) => (h.startsWith('#') ? h : `#${h}`));

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === selectedPost?.id
          ? {
              ...p,
              title: editCaptionTitle.trim(),
              hashtags: cleanHashtags,
            }
          : p
      )
    );

    if (selectedPost) {
      setSelectedPost({
        ...selectedPost,
        title: editCaptionTitle.trim(),
        hashtags: cleanHashtags,
      });
    }

    setShowEditCaptionModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast('✓ Caption updated successfully!');
  };

  const handleAIPolishCaption = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditCaptionTitle(
      `🔥 ${editCaptionTitle.replace(/^[🔥✨👀\s]+/, '')} (Must watch till end)`
    );
    showToast('🪄 Jarvis AI enhanced hook!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={styles.container}>
        {/* 1. TOP AIRY APP BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
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
            <View>
              <Text style={styles.headerTitle}>Studio Flow</Text>
              <Text style={styles.headerSubTitle}>47-Day Streak Active</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Message / Chat Bubble Button */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => showToast('💬 Messages')}
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.unreadBadgeDot} />
            </Pressable>

            {/* Profile Avatar */}
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

        {/* 2. MAIN SCROLLABLE CONTENT WITH SPACIOUS PADDING */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION A: PREMIUM MINIMALIST HERO LENS */}
          <LiquidGlassBackground
            borderRadius={28}
            light={0.92}
            refraction={28}
            depth={0.65}
            dispersion={0.75}
            frost={55}
            splay={0.85}
            tint="purple-gold"
            accentColor="#582CDB"
            goldAccentColor="#F59E0B"
            hasShadow={true}
            containerStyle={styles.heroContainer}
            style={styles.heroContent}
          >
            {/* Top Row: Date & Streak Shield */}
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroDateLabel}>Thursday, May 15</Text>
                <Text style={styles.heroMainMetric}>3 Posts Planned</Text>
              </View>

              <View style={styles.heroStreakShield}>
                <Text style={styles.heroStreakFlame}>🔥</Text>
                <Text style={styles.heroStreakText}>Day 48 Safe</Text>
              </View>
            </View>

            {/* Clean Progress Bar */}
            <View style={styles.heroProgressSection}>
              <View style={styles.heroProgressTrack}>
                <LinearGradient
                  colors={['#784DF0', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.heroProgressFill, { width: '33.3%' }]}
                />
              </View>
              <View style={styles.heroProgressLabels}>
                <Text style={styles.heroProgressText}>1 published</Text>
                <Text style={styles.heroNextPostText}>Next: 11:30 AM</Text>
              </View>
            </View>

            {/* Spacious Action Buttons */}
            <View style={styles.heroActionRow}>
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

              <Pressable
                style={({ pressed }) => [styles.heroSecondaryBtn, pressed && styles.btnPressed]}
                onPress={() => setShowIdeaModal(true)}
              >
                <Text style={styles.heroSecondaryEmoji}>🪄</Text>
                <Text style={styles.heroSecondaryBtnText}>AI Hook Sparks</Text>
              </Pressable>
            </View>
          </LiquidGlassBackground>

          {/* SECTION B: SPACIOUS MINIMAL CALENDAR STRIP */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.calendarTitle}>This Week</Text>
              <Pressable onPress={() => setShowCalendarModal(true)} hitSlop={8}>
                <Text style={styles.calendarMonthLink}>View Month</Text>
              </Pressable>
            </View>

            <View style={styles.calendarStrip}>
              {WEEK_DAYS.map((dayItem) => {
                const isSelected = selectedDay === dayItem.date;
                return (
                  <Pressable
                    key={dayItem.date}
                    onPress={() => handleSelectDay(dayItem.date)}
                    style={[
                      styles.calendarDayPill,
                      isSelected && styles.calendarDayPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayLetter,
                        isSelected && styles.calendarDayLetterActive,
                      ]}
                    >
                      {dayItem.day}
                    </Text>
                    <Text
                      style={[
                        styles.calendarDayNum,
                        isSelected && styles.calendarDayNumActive,
                      ]}
                    >
                      {dayItem.date}
                    </Text>
                    {isSelected ? (
                      <View style={styles.calendarDotActive} />
                    ) : dayItem.hasPost ? (
                      <View style={styles.calendarDotPost} />
                    ) : (
                      <View style={styles.calendarDotEmpty} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* SECTION C: SEGMENTED VIEW SWITCHER (SCHEDULE vs AI LAB) */}
          <View style={styles.viewSegmentWrapper}>
            <Pressable
              style={[
                styles.viewSegmentBtn,
                activeViewMode === 'schedule' && styles.viewSegmentBtnActive,
              ]}
              onPress={() => setActiveViewMode('schedule')}
            >
              <Text
                style={[
                  styles.viewSegmentText,
                  activeViewMode === 'schedule' && styles.viewSegmentTextActive,
                ]}
              >
                Today&apos;s Schedule
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.viewSegmentBtn,
                activeViewMode === 'ideas' && styles.viewSegmentBtnActive,
              ]}
              onPress={() => setActiveViewMode('ideas')}
            >
              <Text
                style={[
                  styles.viewSegmentText,
                  activeViewMode === 'ideas' && styles.viewSegmentTextActive,
                ]}
              >
                AI Viral Sparks
              </Text>
            </Pressable>
          </View>

          {/* SECTION D: CONTENT (CLEAN SCHEDULE or AI SPARKS) */}
          {activeViewMode === 'schedule' ? (
            <View style={styles.timelineContainer}>
              {/* Node 1: TikTok Scheduled Post */}
              <View style={styles.spaciousPostCard}>
                <View style={styles.cardTopHeader}>
                  <View style={styles.platformBadgeRow}>
                    <View style={styles.platformIconCircle}>
                      <TikTokLogoIcon />
                    </View>
                    <Text style={styles.platformTimeLabel}>TikTok • 11:30 AM</Text>
                  </View>

                  <View style={styles.scheduledPill}>
                    <Text style={styles.scheduledPillText}>Scheduled</Text>
                  </View>
                </View>

                <Text style={styles.postTitleText}>
                  3 creator mistakes I stopped making this year
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.forecastTagText}>📈 Est: 18.4K - 32K views</Text>
                  <Pressable
                    style={({ pressed }) => [styles.cardActionOutlineBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setSelectedPost(posts[0]);
                      setShowViewPostModal(true);
                    }}
                  >
                    <Text style={styles.cardActionOutlineText}>Details</Text>
                  </Pressable>
                </View>
              </View>

              {/* Node 2: Golden Open Slot */}
              <View style={[styles.spaciousPostCard, styles.goldenOpenCard]}>
                <View style={styles.cardTopHeader}>
                  <View style={styles.platformBadgeRow}>
                    <View style={[styles.platformIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <YouTubeShortsIcon />
                    </View>
                    <Text style={[styles.platformTimeLabel, { color: '#92400E' }]}>
                      YouTube Shorts • 4:00 PM
                    </Text>
                  </View>

                  <View style={styles.peakSlotPill}>
                    <Text style={styles.peakSlotPillText}>Peak Window</Text>
                  </View>
                </View>

                <Text style={styles.goldenOpenTitle}>
                  Open slot: High-traffic afternoon window.
                </Text>

                <Pressable
                  style={({ pressed }) => [styles.fillGoldenSlotBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    setNewPostTitle('Behind the scenes: My creator filming setup');
                    setNewPostPlatform('youtube');
                    setShowScheduleModal(true);
                  }}
                >
                  <Text style={styles.fillGoldenSlotBtnText}>+ Fill with AI Concept</Text>
                </Pressable>
              </View>

              {/* Node 3: Instagram Reel Draft */}
              <View style={[styles.spaciousPostCard, styles.draftCardGlow]}>
                <View style={styles.cardTopHeader}>
                  <View style={styles.platformBadgeRow}>
                    <View style={[styles.platformIconCircle, { backgroundColor: '#FDF2F8' }]}>
                      <InstagramReelIcon />
                    </View>
                    <Text style={styles.platformTimeLabel}>Instagram Reel • 7:30 PM</Text>
                  </View>

                  <View style={styles.draftPill}>
                    <Text style={styles.draftPillText}>Draft</Text>
                  </View>
                </View>

                <Text style={styles.postTitleText}>
                  One thing I wish I knew before creating
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.forecastTagText}>⏳ Needs hook audio</Text>
                  <Pressable
                    style={({ pressed }) => [styles.finishDraftSolidBtn, pressed && styles.btnPressed]}
                    onPress={() => setShowFinishDraftModal(true)}
                  >
                    <Text style={styles.finishDraftSolidBtnText}>Finish Draft</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            /* AI SPARKS TAB VIEW */
            <View style={styles.aiSparksContainer}>
              {AI_VIRAL_HOOKS.map((hookItem, idx) => (
                <View key={idx} style={styles.aiSparkCard}>
                  <View style={styles.aiSparkHeaderRow}>
                    <View style={styles.aiScoreBadge}>
                      <Text style={styles.aiScoreText}>🔥 {hookItem.viralScore} Score</Text>
                    </View>
                    <Text style={styles.aiFormatText}>{hookItem.format}</Text>
                  </View>

                  <Text style={styles.aiSparkQuote}>&ldquo;{hookItem.hook}&rdquo;</Text>

                  <Pressable
                    style={({ pressed }) => [styles.useSparkBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setNewPostTitle(hookItem.hook);
                      setNewPostPlatform(hookItem.platform === 'TikTok' ? 'tiktok' : 'instagram');
                      setShowScheduleModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={['#7048EC', '#582CDB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.useSparkGradient}
                    >
                      <Text style={styles.useSparkBtnText}>Schedule This Hook</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* FOOTER NOTE */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              PostStreak Studio • Consistency &amp; Algorithm Optimization
            </Text>
          </View>
        </ScrollView>

        {/* 3. TOAST BANNER */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* 4. LIQUID GLASS FLOATING TAB BAR */}
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
                Add a new video concept to your timeline.
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
                placeholder="e.g. 3 creator habits that doubled my reach..."
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
                  <Text style={styles.modalPrimaryBtnText}>Schedule</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: AI HOOK SPARKS */}
        <Modal
          visible={showIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>AI Hook Sparks</Text>
              <Text style={styles.modalSubtitle}>
                Tap any viral concept to import into your schedule:
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
                  <Text style={styles.ideaItemTitle}>&ldquo;{hookItem.hook}&rdquo;</Text>
                  <Text style={styles.ideaFormatTag}>⚡ {hookItem.viralScore} Viral Score • {hookItem.format}</Text>
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

        {/* MODAL 3: POST DETAILS */}
        <Modal
          visible={showViewPostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowViewPostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{selectedPost?.platformLabel}</Text>
              <Text style={styles.modalSubtitle}>{selectedPost?.time} • Scheduled</Text>

              <View style={styles.postDetailsBox}>
                <Text style={styles.postDetailsTitle}>{selectedPost?.title}</Text>
                <Text style={styles.postDetailsForecast}>
                  📈 Forecast: {selectedPost?.viewsForecast || '18K views'} • Score {selectedPost?.viralScore || 94}/100
                </Text>
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
                  onPress={handleOpenEditCaption}
                >
                  <Text style={styles.modalPrimaryBtnText}>Edit Caption</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 3B: EDIT CAPTION POPUP */}
        <Modal
          visible={showEditCaptionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEditCaptionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalPillBadge}>
                <Text style={styles.modalPillBadgeText}>
                  {selectedPost?.platformLabel || 'Post'} • {selectedPost?.time || '11:30 AM'}
                </Text>
              </View>

              <Text style={styles.modalTitle}>Edit Post Caption</Text>
              <Text style={styles.modalSubtitle}>
                Refine your video hook, caption copy, and hashtags.
              </Text>

              <Text style={styles.modalInputLabel}>HOOK & CAPTION</Text>
              <TextInput
                style={styles.modalTextAreaInput}
                placeholder="Write your post hook or caption..."
                placeholderTextColor="#A39CB5"
                value={editCaptionTitle}
                onChangeText={setEditCaptionTitle}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.modalInputLabel}>HASHTAGS</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="#creatortips #growth #viral"
                placeholderTextColor="#A39CB5"
                value={editCaptionHashtags}
                onChangeText={setEditCaptionHashtags}
              />

              {/* AI Quick Polish Chip */}
              <Pressable
                style={({ pressed }) => [styles.aiPolishChipBtn, pressed && styles.btnPressed]}
                onPress={handleAIPolishCaption}
              >
                <Text style={styles.aiPolishChipText}>🪄 Jarvis AI: Enhance Hook</Text>
              </Pressable>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowEditCaptionModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={handleSaveEditedCaption}
                >
                  <Text style={styles.modalPrimaryBtnText}>Save Caption</Text>
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
                Lock in for tonight&apos;s 7:30 PM peak reach window.
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

        {/* MODAL 5: FULL CALENDAR */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>May 2026</Text>
              <Text style={styles.modalSubtitle}>32 posts planned this month</Text>

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
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 14 }]}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 6: NOTIFICATIONS */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Studio Updates</Text>
              <Text style={styles.modalSubtitle}>Live algorithm notifications</Text>

              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>⏰ Peak Window at 11:30 AM</Text>
                <Text style={styles.notifBody}>
                  TikTok engagement is peaking for your niche. Your scheduled post is primed for optimal reach.
                </Text>
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 10 }]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 7: PROFILE */}
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
                style={{ width: 64, height: 64, marginBottom: 8 }}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Creator Studio</Text>
              <Text style={styles.modalSubtitle}>47-Day Streak • Free Plan</Text>

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
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },

  // 1. TOP AIRY APP BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FAF9F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(237, 232, 252, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    overflow: 'hidden',
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileImg: {
    width: 32,
    height: 32,
  },

  // 2. SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },

  // SECTION A: HERO LENS
  heroContainer: {
    marginBottom: 20,
  },
  heroContent: {
    padding: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F7894',
    marginBottom: 2,
  },
  heroMainMetric: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
  },
  heroStreakShield: {
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
  heroStreakFlame: {
    fontSize: 12,
  },
  heroStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  heroProgressSection: {
    marginBottom: 18,
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
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroProgressText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#524C62',
  },
  heroNextPostText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#582CDB',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 13.5,
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
    fontSize: 13.5,
    fontWeight: '700',
  },

  // SECTION B: CALENDAR STRIP
  calendarSection: {
    marginBottom: 20,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  calendarMonthLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  calendarDayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  calendarDayPillActive: {
    backgroundColor: '#582CDB',
  },
  calendarDayLetter: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7F7894',
    marginBottom: 2,
  },
  calendarDayLetterActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  calendarDayNumActive: {
    color: '#FFFFFF',
  },
  calendarDotActive: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDE047',
  },
  calendarDotPost: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#784DF0',
  },
  calendarDotEmpty: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
  },

  // SECTION C: SEGMENTED VIEW SWITCHER
  viewSegmentWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(235, 230, 248, 0.65)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  viewSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  viewSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  viewSegmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7F7894',
  },
  viewSegmentTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // SECTION D: SCHEDULE POST CARDS (SPACIOUS)
  timelineContainer: {
    gap: 14,
  },
  spaciousPostCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  goldenOpenCard: {
    backgroundColor: 'rgba(255, 253, 245, 0.95)',
    borderColor: 'rgba(254, 243, 199, 0.95)',
    borderStyle: 'dashed',
  },
  draftCardGlow: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#F59E0B',
  },
  cardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FAF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
  },
  platformTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524C62',
  },
  scheduledPill: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scheduledPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  peakSlotPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  peakSlotPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },
  draftPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  draftPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  postTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 20,
    marginBottom: 12,
  },
  goldenOpenTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastTagText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7F7894',
  },
  cardActionOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#582CDB',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  cardActionOutlineText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  fillGoldenSlotBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  fillGoldenSlotBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  finishDraftSolidBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  finishDraftSolidBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // AI SPARKS TAB
  aiSparksContainer: {
    gap: 14,
  },
  aiSparkCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 16,
  },
  aiSparkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiScoreBadge: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiScoreText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  aiFormatText: {
    fontSize: 11,
    color: '#7F7894',
    fontWeight: '500',
  },
  aiSparkQuote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171420',
    lineHeight: 20,
    marginBottom: 12,
  },
  useSparkBtn: {
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
  },
  useSparkGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useSparkBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // FOOTER NOTE
  footerContainer: {
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#A39CB5',
    textAlign: 'center',
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
  ideaFormatTag: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '600',
  },
  postDetailsBox: {
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
  notifCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  modalTextAreaInput: {
    height: 76,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    marginBottom: 12,
  },
  modalPillBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 8,
  },
  modalPillBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  aiPolishChipBtn: {
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    marginBottom: 14,
  },
  aiPolishChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
