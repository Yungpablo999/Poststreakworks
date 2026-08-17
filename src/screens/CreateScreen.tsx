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

export type TabType = 'home' | 'create' | 'match' | 'quests' | 'growth';

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
    viewsForecast: '15.4K - 28K',
    hashtags: ['#creatortips', '#growthmindset', '#contentcreator'],
  },
  {
    id: 'post_2',
    platform: 'instagram',
    platformLabel: 'Instagram Reel',
    time: '7:30 PM',
    title: 'One thing I wish I knew before creating',
    status: 'draft',
    viewsForecast: '8.2K - 14K',
    hashtags: ['#reelsviral', '#behindthescenes', '#creatorhustle'],
  },
];

const WEEK_DAYS = [
  { day: 'MON', date: 12, fullDate: 'May 12' },
  { day: 'TUE', date: 13, fullDate: 'May 13' },
  { day: 'WED', date: 14, fullDate: 'May 14' },
  { day: 'THU', date: 15, fullDate: 'May 15', isToday: true },
  { day: 'FRI', date: 16, fullDate: 'May 16' },
  { day: 'SAT', date: 17, fullDate: 'May 17' },
  { day: 'SUN', date: 18, fullDate: 'May 18' },
];

const PRESET_IDEAS = [
  {
    title: 'How I gained my first 1,000 engaged followers without ads',
    format: 'Carousel • 5 Slides',
    platform: 'Instagram',
  },
  {
    title: '3 tools that save me 10 hours every week as a solo creator',
    format: 'Short • 45s Video',
    platform: 'TikTok',
  },
  {
    title: 'The brutal truth about full-time content creation in 2026',
    format: 'Reel • POV Hook',
    platform: 'Instagram',
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

// Bottom Nav Bar Icons
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
    <Circle cx="14" cy="5.8" r="3.6" fill={color} />
    <Path
      d="M8.2 18.2C8.2 15 10.8 12.2 14 12.2C17.2 12.2 19.8 15 19.8 18.2V20.5H8.2V18.2Z"
      fill={color}
    />
    <Circle cx="5.2" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M1.2 19.2C1.2 17 3 15 5.2 15C6.1 15 6.9 15.3 7.5 15.7C7.3 16.5 7.2 17.4 7.2 18.2V20.5H1.2V19.2Z"
      fill={color}
    />
    <Circle cx="22.8" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M26.8 19.2C26.8 17 25 15 22.8 15C21.9 15 21.1 15.3 20.5 15.7C20.7 16.5 20.8 17.4 20.8 18.2V20.5H26.8V19.2Z"
      fill={color}
    />
  </Svg>
);

const QuestsNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M3.5 3.5L5.8 2L13.2 9.4L11.4 11.2L4 3.8V3.5Z" fill={color} />
    <Path d="M3.5 3.5L2 5.8L9.4 13.2L11.2 11.4L3.8 4H3.5Z" fill={color} />
    <Path d="M14.5 9.2L9.8 13.9L11.3 15.4L16 10.7L14.5 9.2Z" fill={color} />
    <Path d="M13.2 15.2L17.5 19.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    <Circle cx="18.5" cy="20.5" r="1.8" fill={color} />
    <Path d="M20.5 3.5L18.2 2L10.8 9.4L12.6 11.2L20 3.8V3.5Z" fill={color} />
    <Path d="M20.5 3.5L22 5.8L14.6 13.2L12.8 11.4L20.2 4H20.5Z" fill={color} />
    <Path d="M9.5 9.2L14.2 13.9L12.7 15.4L8 10.7L9.5 9.2Z" fill={color} />
    <Path d="M10.8 15.2L6.5 19.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
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
            toValue: -5,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(flameScale, {
            toValue: 1.04,
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
      viewsForecast: '10K - 20K',
    };
    setPosts([newPost, ...posts]);
    setShowScheduleModal(false);
    setNewPostTitle('');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast('✨ Post scheduled successfully!');
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

  const getTabColor = (tab: TabType) => (activeTab === tab ? '#582CDB' : '#171420');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP APP BAR */}
        <View style={styles.headerBar}>
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

          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => showToast('💬 Creator Chat connected.')}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => setShowNotificationModal(true)}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.headerProfileBtnPressed]}
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

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* A. CONTENT SCHEDULE BADGE & TITLE */}
          <View style={styles.headlineSection}>
            <View style={styles.topBadgesRow}>
              <LinearGradient
                colors={['#7048EC', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contentSchedulePill}
              >
                <Text style={styles.contentScheduleText}>CONTENT SCHEDULE</Text>
              </LinearGradient>

              <View style={styles.freeScheduleBadge}>
                <Text style={styles.freeScheduleText}>Free Schedule</Text>
              </View>
            </View>

            <Text style={styles.mainTitle}>Your posts, planned clearly.</Text>
            <Text style={styles.subTitle}>
              See what is going live today, what is coming next, and what still needs to be finished.
            </Text>
          </View>

          {/* B. HERO TODAY CARD */}
          <View style={styles.todayCard}>
            <View style={styles.todayHeaderRow}>
              <Text style={styles.todayTitle}>Today</Text>
              <View style={styles.todayBadgesGroup}>
                <View style={styles.scheduledPill}>
                  <Text style={styles.scheduledPillText}>1 Scheduled</Text>
                </View>
                <View style={styles.draftPill}>
                  <Text style={styles.draftPillText}>1 Draft</Text>
                </View>
              </View>
            </View>

            <View style={styles.plannedCountRow}>
              <Text style={styles.plannedBigNumber}>3</Text>
              <Text style={styles.plannedText}>posts planned</Text>
            </View>

            <Text style={styles.nextPostTimeText}>Next post: 11:30 AM</Text>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Today&apos;s posting progress • 1 / 3 complete</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '33.3%' }]} />
              </View>
            </View>

            <View style={styles.streakProtectionBanner}>
              <Text style={styles.streakFlameEmoji}>🔥</Text>
              <Text style={styles.streakProtectionText}>
                Posting today protects your{' '}
                <Text style={styles.streakDaysBold}>47-day streak</Text>.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.scheduleNewPostBtn, pressed && styles.btnPressed]}
              onPress={() => setShowScheduleModal(true)}
            >
              <Text style={styles.scheduleNewPostBtnText}>Schedule New Post</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.createFromIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => setShowIdeaModal(true)}
            >
              <Text style={styles.createFromIdeaBtnText}>Create From Idea</Text>
            </Pressable>
          </View>

          {/* C. WEEKLY CALENDAR STRIP */}
          <View style={styles.calendarStripSection}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.thisWeekCountText}>This week: 8 posts planned</Text>
              <Pressable onPress={() => setShowCalendarModal(true)} hitSlop={6}>
                <Text style={styles.viewFullCalendarText}>View Full Calendar</Text>
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
                    {isSelected && <View style={styles.activeDayDot} />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* D. TODAY'S SCHEDULE SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Today&apos;s Schedule</Text>
          </View>

          {/* Post Card 1: TikTok Scheduled */}
          <View style={styles.postCard}>
            <View style={styles.postCardHeader}>
              <View style={styles.platformBadgeRow}>
                <TikTokLogoIcon />
                <Text style={styles.platformTimeText}>TikTok • 11:30 AM</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.viewPostBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setSelectedPost(posts[0]);
                  setShowViewPostModal(true);
                }}
              >
                <Text style={styles.viewPostBtnText}>View Post</Text>
              </Pressable>
            </View>

            <Text style={styles.postTitleText}>
              3 creator mistakes I stopped making this year
            </Text>

            <View style={styles.postCardFooter}>
              <View style={styles.statusScheduledPill}>
                <Text style={styles.statusScheduledText}>Scheduled</Text>
              </View>
            </View>
          </View>

          {/* Post Card 2: Instagram Reel Draft */}
          <View style={[styles.postCard, styles.postCardDraftAccent]}>
            <View style={styles.postCardHeader}>
              <View style={styles.platformBadgeRow}>
                <InstagramReelIcon />
                <Text style={styles.platformTimeText}>Instagram Reel • 7:30 PM</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.finishDraftBtn, pressed && styles.btnPressed]}
                onPress={() => setShowFinishDraftModal(true)}
              >
                <Text style={styles.finishDraftBtnText}>Finish Draft</Text>
              </Pressable>
            </View>

            <Text style={styles.postTitleText}>
              One thing I wish I knew before creating
            </Text>

            <View style={styles.postCardFooter}>
              <View style={styles.statusDraftPill}>
                <Text style={styles.statusDraftText}>Draft</Text>
              </View>
            </View>
          </View>

          {/* E. PLATFORM LOAD CARD */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Platform Load</Text>

            <View style={styles.platformLoadRow}>
              <View style={styles.platformLoadLabelRow}>
                <Text style={styles.platformLoadName}>TikTok</Text>
                <Text style={styles.platformLoadCount}>3 posts</Text>
              </View>
              <View style={styles.platformTrack}>
                <View style={[styles.platformFill, { width: '100%' }]} />
              </View>
            </View>

            <View style={styles.platformLoadRow}>
              <View style={styles.platformLoadLabelRow}>
                <Text style={styles.platformLoadName}>Instagram</Text>
                <Text style={styles.platformLoadCount}>2 posts</Text>
              </View>
              <View style={styles.platformTrack}>
                <View style={[styles.platformFill, { width: '66.6%' }]} />
              </View>
            </View>

            <View style={styles.platformLoadRow}>
              <View style={styles.platformLoadLabelRow}>
                <Text style={styles.platformLoadName}>YouTube</Text>
                <Text style={styles.platformLoadCount}>2 posts</Text>
              </View>
              <View style={styles.platformTrack}>
                <View style={[styles.platformFill, { width: '66.6%' }]} />
              </View>
            </View>

            <Text style={styles.platformFocusFootnote}>
              &ldquo;TikTok is your focus this week.&rdquo;
            </Text>
          </View>

          {/* F. HEALTH & EFFICIENCY CARD */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Health &amp; Efficiency</Text>

            <View style={styles.healthItemRow}>
              <View style={styles.healthIconPurpleCircle}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17L4 12"
                    stroke="#582CDB"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.healthItemText}>8 posts planned this week</Text>
            </View>

            <View style={styles.healthItemRow}>
              <View style={styles.healthIconAmberCircle}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 8V21H3V8"
                    stroke="#D97706"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M23 3H1V8H23V3Z"
                    stroke="#D97706"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M10 12H14" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.healthItemText}>2 drafts need finishing</Text>
            </View>

            <View style={styles.healthItemRow}>
              <View style={styles.healthIconAmberCircle}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="#D97706"
                    strokeWidth="2.2"
                  />
                  <Path d="M16 2V6M8 2V6M3 10H21" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.healthItemText}>1 open slot tomorrow</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.fillSlotBtn, pressed && styles.btnPressed]}
              onPress={() => setShowFillSlotModal(true)}
            >
              <Text style={styles.fillSlotBtnText}>Fill Tomorrow&apos;s Slot</Text>
            </Pressable>
          </View>

          {/* G. JARVIS RECOMMENDATION CARD */}
          <View style={styles.jarvisCard}>
            <View style={styles.jarvisHeaderRow}>
              <View style={styles.jarvisFlameCircle}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisSmallFlame}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.jarvisHeaderTextWrapper}>
                <Text style={styles.jarvisTagText}>JARVIS RECOMMENDATION</Text>
                <Text style={styles.jarvisRecommendationTitle}>Peak Reach Window</Text>
              </View>
            </View>

            <Text style={styles.jarvisAdviceBody}>
              Your strongest posting window today is{' '}
              <Text style={styles.peakTimeHighlight}>7:30 PM</Text>. Finish your Instagram Reel draft
              and schedule it for tonight.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.useSuggestionBtn, pressed && styles.btnPressed]}
              onPress={handleUseSuggestion}
            >
              <Text style={styles.useSuggestionBtnText}>Use Suggestion</Text>
            </Pressable>
          </View>

          {/* H. FOOTER ATTRIBUTION */}
          <View style={styles.footerNoteContainer}>
            <Text style={styles.footerNoteText}>
              Free users can plan and track posts.{' '}
              <Text style={styles.footerNoteLink}>Pro unlocks advanced best-time scheduling</Text> and
              deeper analytics.
            </Text>
          </View>
        </ScrollView>

        {/* 3. TOAST ALERT NOTIFICATION */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* 4. EXACT FIGMA BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomTabBar}>
          <Pressable
            onPress={() => handleTabPress('home')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <HomeNavIcon color={getTabColor('home')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              HOME
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('create')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <CreateNavIcon color={getTabColor('create')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'create' && styles.tabLabelActive]}>
              CREATE
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('match')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <MatchNavIcon color={getTabColor('match')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'match' && styles.tabLabelActive]}>
              MATCH
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('quests')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <QuestsNavIcon color={getTabColor('quests')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'quests' && styles.tabLabelActive]}>
              QUESTS
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress('growth')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <GrowthNavIcon color={getTabColor('growth')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'growth' && styles.tabLabelActive]}>
              GROWTH
            </Text>
          </Pressable>
        </View>

        {/* MODAL 1: SCHEDULE NEW POST */}
        <Modal
          visible={showScheduleModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScheduleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Schedule New Post</Text>
              <Text style={styles.modalSubtitle}>
                Add a new hook or video prompt to your creator calendar.
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

        {/* MODAL 2: CREATE FROM IDEA */}
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
                <Text style={styles.jarvisBadgeText}>JARVIS CORE IDEAS</Text>
              </View>
              <Text style={styles.modalTitle}>AI Hook Sparks</Text>
              <Text style={styles.modalSubtitle}>
                Select an idea to instantly import into your schedule.
              </Text>

              {PRESET_IDEAS.map((idea, idx) => (
                <Pressable
                  key={idx}
                  style={styles.ideaItemCard}
                  onPress={() => {
                    setNewPostTitle(idea.title);
                    setShowIdeaModal(false);
                    setShowScheduleModal(true);
                  }}
                >
                  <Text style={styles.ideaItemTitle}>{idea.title}</Text>
                  <View style={styles.ideaFormatRow}>
                    <Text style={styles.ideaFormatTag}>{idea.format}</Text>
                    <Text style={styles.ideaPlatformTag}>• {idea.platform}</Text>
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
                  📈 Forecast: {selectedPost?.viewsForecast || '15K views'}
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
                Add final touches and set for today&apos;s peak reach window.
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
              <Text style={styles.modalTitle}>Fill Tomorrow&apos;s Slot</Text>
              <Text style={styles.modalSubtitle}>
                Keep your 47-day streak protected by locking in Friday&apos;s post!
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
                      viewsForecast: '12K - 22K',
                    },
                    ...posts,
                  ]);
                  setShowFillSlotModal(false);
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  showToast('🔥 Friday slot filled & scheduled!');
                }}
              >
                <Text style={styles.ideaItemTitle}>
                  Behind the scenes: My creator filming setup
                </Text>
                <Text style={styles.ideaFormatTag}>⚡ Recommended YouTube Short</Text>
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

        {/* MODAL 6: FULL CALENDAR MODAL */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>May 2026 Calendar</Text>
              <Text style={styles.modalSubtitle}>
                Total 32 posts scheduled this month. 47-day active streak.
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
              <Text style={styles.modalTitle}>Notifications</Text>
              <Text style={styles.modalSubtitle}>Latest updates from Jarvis AI &amp; Collabs</Text>

              <View style={styles.notifItemCard}>
                <Text style={styles.notifItemTitle}>⏰ Best Posting Time Approaching</Text>
                <Text style={styles.notifItemBody}>
                  Your Instagram Reel is ready for 7:30 PM peak reach.
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

        {/* MODAL 8: USER PROFILE MODAL */}
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
              <Text style={styles.modalTitle}>Creator Profile</Text>
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
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnPressed: {
    opacity: 0.6,
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
  headerProfileBtnPressed: {
    opacity: 0.6,
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
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
  },

  // A. HEADLINE SECTION
  headlineSection: {
    marginBottom: 16,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contentSchedulePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contentScheduleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  freeScheduleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: 'rgba(235, 230, 248, 0.8)',
  },
  freeScheduleText: {
    color: '#171420',
    fontSize: 10.5,
    fontWeight: '700',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#7F7894',
    lineHeight: 19,
  },

  // B. HERO TODAY CARD
  todayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
  },
  todayBadgesGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  scheduledPill: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scheduledPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  draftPill: {
    backgroundColor: 'rgba(255, 247, 237, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  draftPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  plannedCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  plannedBigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: -0.6,
  },
  plannedText: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#524C62',
  },
  nextPostTimeText: {
    fontSize: 12.5,
    color: '#7F7894',
    marginBottom: 14,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#524C62',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3.5,
  },
  streakProtectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 251, 235, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  streakFlameEmoji: {
    fontSize: 14,
  },
  streakProtectionText: {
    flex: 1,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  streakDaysBold: {
    fontWeight: '700',
    color: '#92400E',
  },
  scheduleNewPostBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  scheduleNewPostBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  createFromIdeaBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFromIdeaBtnText: {
    color: '#171420',
    fontSize: 15,
    fontWeight: '700',
  },

  // C. CALENDAR STRIP SECTION
  calendarStripSection: {
    marginBottom: 20,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  thisWeekCountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
  },
  viewFullCalendarText: {
    fontSize: 12.5,
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
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  dayItemBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayItemBtnActive: {
    backgroundColor: '#582CDB',
  },
  dayItemName: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7F7894',
    marginBottom: 3,
  },
  dayItemNameActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dayItemDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  dayItemDateActive: {
    color: '#FFFFFF',
  },
  activeDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDE047',
    marginTop: 3,
  },

  // D. TODAY'S SCHEDULE SECTION
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  postCardDraftAccent: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524C62',
  },
  viewPostBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#582CDB',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  viewPostBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  finishDraftBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  finishDraftBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 20,
    marginBottom: 10,
  },
  postCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusScheduledPill: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  statusScheduledText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  statusDraftPill: {
    backgroundColor: 'rgba(255, 247, 237, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  statusDraftText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },

  // E. PLATFORM LOAD & HEALTH CARDS
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 14,
  },
  platformLoadRow: {
    marginBottom: 12,
  },
  platformLoadLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  platformLoadName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#171420',
  },
  platformLoadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524C62',
  },
  platformTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
    overflow: 'hidden',
  },
  platformFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  platformFocusFootnote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#7F7894',
    marginTop: 4,
  },

  // F. HEALTH & EFFICIENCY
  healthItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  healthIconPurpleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthIconAmberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 247, 237, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171420',
  },
  fillSlotBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: 44,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  fillSlotBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#D97706',
  },

  // G. JARVIS RECOMMENDATION CARD
  jarvisCard: {
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    padding: 18,
    marginBottom: 16,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  jarvisFlameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisSmallFlame: {
    width: 26,
    height: 26,
  },
  jarvisHeaderTextWrapper: {
    flex: 1,
  },
  jarvisTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  jarvisRecommendationTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  jarvisAdviceBody: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#524C62',
    lineHeight: 18,
    marginBottom: 14,
  },
  peakTimeHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  useSuggestionBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  useSuggestionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // H. FOOTER NOTE
  footerNoteContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // BOTTOM NAVIGATION BAR
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 66,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 230, 245, 0.9)',
    paddingBottom: Platform.OS === 'ios' ? 6 : 0,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.6,
  },
  tabLabelActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
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
    fontSize: 12.5,
    color: '#7F7894',
    textAlign: 'center',
    marginBottom: 16,
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
    height: 46,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    marginBottom: 14,
  },
  platformSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  platformSelectBtn: {
    flex: 1,
    paddingVertical: 7,
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
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F7894',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
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
    fontSize: 10.5,
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
    fontSize: 13.5,
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
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
  },
  postDetailsForecast: {
    fontSize: 12,
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
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
