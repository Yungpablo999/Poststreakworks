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
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

interface ScheduleScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenCreateIdea?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface ScheduledPost {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  platformLabel: string;
  time: string;
  title: string;
  status: 'scheduled' | 'draft' | 'published';
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
    hashtags: ['#creatortips', '#growthmindset'],
  },
  {
    id: 'post_2',
    platform: 'instagram',
    platformLabel: 'Instagram Reel',
    time: '7:30 PM',
    title: 'One thing I wish I knew before creating',
    status: 'draft',
    hashtags: ['#reelsviral', '#behindthescenes'],
  },
];

export const SCHEDULE_DATE_OPTIONS = (() => {
  const arr: string[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 45; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const month = monthNames[d.getMonth()];
    const dayNum = d.getDate();
    if (i === 0) {
      arr.push(`Today · ${month} ${dayNum}`);
    } else if (i === 1) {
      arr.push(`Tomorrow · ${month} ${dayNum}`);
    } else {
      arr.push(`${dayName} · ${month} ${dayNum}`);
    }
  }
  return arr;
})();

export const SCHEDULE_TIME_OPTIONS = [
  '7:00 AM',
  '7:30 AM',
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM (Lunch Rush 🥪)',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM (Afternoon Peak ☕)',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
  '6:30 PM',
  '7:00 PM',
  '7:30 PM (Peak Reach 🔥)',
  '8:00 PM (Prime Time ✨)',
  '8:30 PM (Prime Evening)',
  '9:00 PM',
  '9:30 PM (Late Night Scroll 🌙)',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
];

const CalendarLineIcon = ({ size = 14, color = '#6B637B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4" />
    <Path d="M8 2v4" />
    <Path d="M3 10h18" />
  </Svg>
);

const ClockLineIcon = ({ size = 14, color = '#6B637B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

interface CalendarDayPost {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  platformLabel: string;
  time: string;
  title: string;
  status: 'scheduled' | 'draft' | 'published';
}

const MONTH_POSTS_MAP: { [day: number]: CalendarDayPost[] } = {
  12: [
    { id: 'm12_1', platform: 'tiktok', platformLabel: 'TikTok', time: '11:00 AM', title: 'Why consistency beats talent in 2026', status: 'published' }
  ],
  13: [
    { id: 'm13_1', platform: 'instagram', platformLabel: 'Instagram Reel', time: '6:30 PM', title: '3 hooks that doubled my watch time', status: 'published' }
  ],
  14: [
    { id: 'm14_1', platform: 'youtube', platformLabel: 'YouTube Shorts', time: '2:00 PM', title: 'Editing faster with mobile capcut tips', status: 'published' }
  ],
  15: [
    { id: 'post_1', platform: 'tiktok', platformLabel: 'TikTok', time: '11:30 AM', title: '3 creator mistakes I stopped making…', status: 'scheduled' },
    { id: 'post_2', platform: 'instagram', platformLabel: 'Instagram Reel', time: '7:30 PM', title: 'One thing I wish I knew before…', status: 'draft' },
    { id: 'post_3', platform: 'youtube', platformLabel: 'YouTube Shorts', time: '9:00 PM', title: 'The 1 rule to 10x your views', status: 'scheduled' },
  ],
  16: [
    { id: 'm16_1', platform: 'tiktok', platformLabel: 'TikTok', time: '12:00 PM', title: 'How to batch 5 videos in 1 hour', status: 'scheduled' },
    { id: 'm16_2', platform: 'instagram', platformLabel: 'Instagram Reel', time: '6:00 PM', title: 'Behind the scenes creator workspace', status: 'scheduled' },
  ],
  19: [
    { id: 'm19_1', platform: 'tiktok', platformLabel: 'TikTok', time: '11:30 AM', title: 'The secret to viral retention graphs', status: 'scheduled' }
  ],
  22: [
    { id: 'm22_1', platform: 'youtube', platformLabel: 'YouTube Shorts', time: '4:00 PM', title: 'Top 3 audio trends this weekend', status: 'scheduled' }
  ],
  26: [
    { id: 'm26_1', platform: 'tiktok', platformLabel: 'TikTok', time: '1:00 PM', title: 'How to build your first creator squad', status: 'scheduled' }
  ],
};

const WEEK_DAYS = [
  { day: 'MON', date: 12 },
  { day: 'TUE', date: 13 },
  { day: 'WED', date: 14 },
  { day: 'THU', date: 15, isToday: true },
  { day: 'FRI', date: 16 },
  { day: 'SAT', date: 17 },
  { day: 'SUN', date: 18 },
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  onBack,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenCreateIdea,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<number>(15);
  const [posts, setPosts] = useState<ScheduledPost[]>(INITIAL_POSTS);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showViewPostModal, setShowViewPostModal] = useState(false);
  const [showFinishDraftModal, setShowFinishDraftModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Active Post Selection
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // Form State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [selectedScheduleDate, setSelectedScheduleDate] = useState('Today · Aug 29');
  const [selectedScheduleTime, setSelectedScheduleTime] = useState('7:30 PM (Peak Reach 🔥)');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Draft Editing State
  const [draftTitle, setDraftTitle] = useState('One thing I wish I knew before creating');
  const [draftTime, setDraftTime] = useState('7:30 PM');

  // Completion Modal Config
  const [completionTitle, setCompletionTitle] = useState('Post Scheduled!');
  const [completionSubtitle, setCompletionSubtitle] = useState('Your post has been locked in for optimal reach.');
  const [completionSpeech, setCompletionSpeech] = useState('Ghost says: Great consistency Amara! +35 XP awarded!');
  const [completionBadge, setCompletionBadge] = useState('SCHEDULED');
  const [completionXp, setCompletionXp] = useState(35);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [flameFloatY]);

  const triggerModalPop = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    modalPopScale.setValue(0.88);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 26,
      bounciness: 12,
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

  const handleCreatePostSubmit = () => {
    if (!newPostTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a post hook or title.');
      return;
    }

    const cleanTime = selectedScheduleTime.replace(/ \(.*$/, '');
    const scheduledTimeString = `${selectedScheduleDate.split(' · ')[0]} · ${cleanTime}`;

    const newPost: ScheduledPost = {
      id: 'post_' + Date.now(),
      platform: newPostPlatform,
      platformLabel: newPostPlatform === 'tiktok' ? 'TikTok' : newPostPlatform === 'instagram' ? 'Instagram Reel' : 'YouTube Shorts',
      time: scheduledTimeString,
      title: newPostTitle.trim(),
      status: 'scheduled',
      hashtags: ['#creatortips', '#poststreak'],
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setShowScheduleModal(false);

    setCompletionTitle('Post Scheduled!');
    setCompletionSubtitle('"' + newPost.title + '" is queued for ' + newPost.time + '.');
    setCompletionSpeech('Ghost says: Your consistency is protected Amara!');
    setCompletionBadge('SCHEDULED');
    setCompletionXp(35);
    setShowCompletionModal(true);
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

    setCompletionTitle('Draft Scheduled!');
    setCompletionSubtitle("Instagram Reel scheduled for tonight's 7:30 PM peak reach window.");
    setCompletionSpeech('Ghost says: Awesome work finishing that draft! +40 XP awarded!');
    setCompletionBadge('DRAFT LOCKED');
    setCompletionXp(40);
    setShowCompletionModal(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenMessages={() => {
            if (onOpenMessages) {
              onOpenMessages();
            } else {
              triggerModalPop();
              setShowChatModal(true);
            }
          }}
          onOpenNotifications={() => {
            triggerModalPop();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalPop();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP PILL BADGES */}
          <View style={styles.topBadgesRow}>
            <View style={styles.contentSchedulePill}>
              <Text style={styles.contentSchedulePillText}>CONTENT SCHEDULE</Text>
            </View>
          </View>

          {/* HEADLINE & SUBTITLE */}
          <Text
            style={styles.mainHeading}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Your posts, planned clearly.
          </Text>
          <Text style={styles.mainSubtitle}>
            See what’s live today, what’s next, and what needs finishing.
          </Text>

          {/* 1. TODAY HERO CARD */}
          <View style={styles.todayHeroCard}>
            <View style={styles.todayHeaderRow}>
              <Text style={styles.todayMainTitle}>Today</Text>
              <Text style={styles.todayStatusSubtle}>
                1 scheduled <Text style={styles.todayStatusDot}>·</Text> 1 draft
              </Text>
            </View>

            <Text style={styles.postsPlannedBig}>
              <Text style={{ color: '#582CDB', fontWeight: '700' }}>3 </Text>
              posts planned
            </Text>
            <Text style={styles.nextPostSub}>Next post: 11:30 AM</Text>

            {/* Posting Progress */}
            <Text style={styles.progressSubLabel}>Today&apos;s posting progress: 1 / 3 complete</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '33.3%' }]} />
            </View>

            {/* Streak Shield Banner (Compact Single Line) */}
            <View style={styles.streakBannerBox}>
              <Text style={styles.streakBannerFlame}>🔥</Text>
              <Text
                style={styles.streakBannerText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                Posting today protects your <Text style={{ fontWeight: '800', color: '#171420' }}>{userProfile?.streakCount || 47}-day streak</Text>
              </Text>
            </View>

            {/* Actions: Primary Schedule Button + Quiet Secondary Link */}
            <View style={styles.todayActionButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.scheduleNewPostBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowScheduleModal(true);
                }}
              >
                <Text style={styles.scheduleNewPostBtnText}>Schedule New Post</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.createFromIdeaQuietBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenCreateIdea) {
                    onOpenCreateIdea();
                  } else if (onNavigateTab) {
                    onNavigateTab('create');
                  }
                }}
                hitSlop={8}
              >
                <Text style={styles.createFromIdeaQuietText}>
                  ✨ <Text style={{ textDecorationLine: 'underline' }}>Create from Idea</Text> →
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 2. THIS WEEK STRIP & VIEW FULL CALENDAR */}
          <View style={styles.weekHeaderRow}>
            <Text style={styles.weekTitle} numberOfLines={1} adjustsFontSizeToFit>
              This week: 8 posts planned
            </Text>
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowCalendarModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.viewFullCalendarLink}>View Full Calendar</Text>
            </Pressable>
          </View>

          <View style={styles.calendarStrip}>
            {WEEK_DAYS.map((dayItem) => {
              const isSelected = selectedDay === dayItem.date;
              return (
                <Pressable
                  key={dayItem.date}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedDay(dayItem.date);
                  }}
                  style={[
                    styles.calendarDayPill,
                    isSelected && styles.calendarDayPillActive,
                  ]}
                >
                  <Text style={[styles.calendarDayLetter, isSelected && styles.calendarDayLetterActive]}>
                    {dayItem.day}
                  </Text>
                  <Text style={[styles.calendarDayNum, isSelected && styles.calendarDayNumActive]}>
                    {dayItem.date}
                  </Text>
                  {dayItem.isToday && <View style={[styles.todayIndicatorDot, isSelected && { backgroundColor: '#F59E0B' }]} />}
                </Pressable>
              );
            })}
          </View>

          {/* 3. TODAY'S SCHEDULE LIST */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Today&apos;s Schedule</Text>
          </View>

          <View style={styles.scheduleList}>
            {/* Post 1: Scheduled */}
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleCardLeft}>
                <View style={styles.postPlatformRow}>
                  <View style={styles.postPlatformBrandRow}>
                    <SocialBrandIcon platform="tiktok" size={13} />
                    <Text style={styles.postPlatformText}>TikTok · 11:30 AM</Text>
                  </View>
                  <View style={styles.postStatusTagPurple}>
                    <Text style={styles.postStatusTagPurpleText}>Scheduled</Text>
                  </View>
                </View>
                <Text style={styles.postItemTitle}>3 creator mistakes I stopped making this year</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.viewPostBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setSelectedPost(posts[0]);
                  triggerModalPop();
                  setShowViewPostModal(true);
                }}
              >
                <Text style={styles.viewPostBtnText}>View Post</Text>
              </Pressable>
            </View>

            {/* Post 2: Draft */}
            <View style={[styles.scheduleCard, { borderLeftWidth: 3.5, borderLeftColor: '#F59E0B' }]}>
              <View style={styles.scheduleCardLeft}>
                <View style={styles.postPlatformRow}>
                  <View style={styles.postPlatformBrandRow}>
                    <SocialBrandIcon platform="instagram" size={13} />
                    <Text style={styles.postPlatformText}>Instagram Reel · 7:30 PM</Text>
                  </View>
                  <View style={styles.postStatusTagYellow}>
                    <Text style={styles.postStatusTagYellowText}>Draft</Text>
                  </View>
                </View>
                <Text style={styles.postItemTitle}>One thing I wish I knew before creating</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.finishDraftBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowFinishDraftModal(true);
                }}
              >
                <Text style={styles.finishDraftBtnText}>Finish Draft</Text>
              </Pressable>
            </View>
          </View>

          {/* 4. PLATFORM LOAD CARD */}
          <View style={styles.platformLoadCard}>
            <Text style={styles.platformLoadTitle}>Platform Load</Text>

            {/* TikTok */}
            <View style={styles.loadRow}>
              <View style={styles.loadLabelRow}>
                <Text style={styles.loadPlatformName}>TikTok</Text>
                <Text style={styles.loadCountText}>3 posts</Text>
              </View>
              <View style={styles.loadTrack}>
                <View style={[styles.loadFill, { width: '85%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            {/* Instagram */}
            <View style={styles.loadRow}>
              <View style={styles.loadLabelRow}>
                <Text style={styles.loadPlatformName}>Instagram</Text>
                <Text style={styles.loadCountText}>2 posts</Text>
              </View>
              <View style={styles.loadTrack}>
                <View style={[styles.loadFill, { width: '58%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            {/* YouTube */}
            <View style={styles.loadRow}>
              <View style={styles.loadLabelRow}>
                <Text style={styles.loadPlatformName}>YouTube</Text>
                <Text style={styles.loadCountText}>2 posts</Text>
              </View>
              <View style={styles.loadTrack}>
                <View style={[styles.loadFill, { width: '58%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            <Text style={styles.loadFooterNote}>*TikTok is your focus this week.*</Text>
          </View>

          {/* 5. HEALTH & EFFICIENCY CARD */}
          <View style={styles.healthCard}>
            <Text style={styles.healthTitle}>Health &amp; Efficiency</Text>

            <View style={styles.healthItemsList}>
              <View style={styles.healthItem}>
                <Text style={{ color: '#582CDB', fontSize: 14 }}>✓</Text>
                <Text style={styles.healthItemText}>8 posts planned this week</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={{ fontSize: 13 }}>📁</Text>
                <Text style={styles.healthItemText}>2 drafts need finishing</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={{ fontSize: 13 }}>📅</Text>
                <Text style={styles.healthItemText}>1 open slot tomorrow</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.fillTomorrowBtn, pressed && styles.btnPressed]}
              onPress={() => {
                setNewPostTitle('3 unexpected creator hacks that work in 2026');
                triggerModalPop();
                setShowScheduleModal(true);
              }}
            >
              <Text style={styles.fillTomorrowBtnText}>Fill Tomorrow&apos;s Slot</Text>
            </Pressable>
          </View>

          {/* 6. JARVIS RECOMMENDATION: PEAK REACH WINDOW */}
          <View style={styles.jarvisRecCard}>
            <View style={styles.jarvisRecHeader}>
              <Animated.View
                style={[
                  styles.jarvisFlameCircle,
                  { transform: [{ translateY: flameFloatY }] },
                ]}
              >
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisFlameIcon}
                  resizeMode="contain"
                />
              </Animated.View>
              <View>
                <Text style={styles.jarvisRecTag}>JARVIS RECOMMENDATION</Text>
                <Text style={styles.jarvisRecTitle}>Peak Reach Window</Text>
              </View>
            </View>

            <Text style={styles.jarvisRecBody}>
              Your strongest posting window today is <Text style={{ color: '#D97706', fontWeight: '800' }}>7:30 PM</Text>. Finish your Instagram Reel draft and schedule it for tonight.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.useSuggestionBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowFinishDraftModal(true);
              }}
            >
              <Text style={styles.useSuggestionBtnText}>Use Suggestion</Text>
            </Pressable>
          </View>

          {/* Footer Pro Note */}
          <Text style={styles.footerProNote}>
            Free users can plan and track posts. <Text style={{ color: '#582CDB', fontWeight: '700' }}>Pro unlocks advanced best-time scheduling</Text> and deeper analytics.
          </Text>

          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCompletionModal}
          title={completionTitle}
          subtitle={completionSubtitle}
          speechBubble={completionSpeech}
          badgeText={completionBadge}
          xpEarned={completionXp}
          streakCount={47}
          actionText="Continue ➔"
          onDismiss={() => setShowCompletionModal(false)}
        />

        {/* MODAL 1: SCHEDULE NEW POST */}
        <Modal
          visible={showScheduleModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScheduleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Schedule New Post</Text>
                  <Text style={styles.modalSubtitle}>Queue for optimal audience reach</Text>
                </View>
                <Pressable onPress={() => setShowScheduleModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>CHOOSE PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {(['tiktok', 'instagram', 'youtube'] as const).map((plat) => {
                  const isActive = newPostPlatform === plat;
                  return (
                    <Pressable
                      key={plat}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setNewPostPlatform(plat);
                      }}
                      style={[
                        styles.platformSelectBtn,
                        isActive && styles.platformSelectBtnActive,
                      ]}
                    >
                      <SocialBrandIcon platform={plat} size={15} />
                      <Text
                        style={[
                          styles.platformSelectBtnText,
                          isActive && styles.platformSelectBtnTextActive,
                        ]}
                      >
                        {plat === 'tiktok' ? 'TikTok' : plat === 'instagram' ? 'Instagram' : 'YouTube'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.modalInputLabel}>POST TITLE / HOOK</Text>
              <TextInput
                style={styles.modalTextInput}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholder="Enter your post hook…"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalInputLabel}>WHEN TO POST</Text>
              <View style={styles.dropdownSelectorsRow}>
                {/* DATE SELECTOR BUTTON */}
                <Pressable
                  style={[styles.dropdownBtnHalf, showDateDropdown && styles.dropdownBtnActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowDateDropdown(!showDateDropdown);
                    setShowTimeDropdown(false);
                  }}
                >
                  <View style={styles.dropdownBtnIconWrap}>
                    <CalendarLineIcon size={14} color={showDateDropdown ? '#582CDB' : '#6B637B'} />
                  </View>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {selectedScheduleDate}
                  </Text>
                  <Text style={styles.dropdownChevron}>{showDateDropdown ? '▴' : '▾'}</Text>
                </Pressable>

                {/* TIME SELECTOR BUTTON */}
                <Pressable
                  style={[styles.dropdownBtnHalf, showTimeDropdown && styles.dropdownBtnActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowTimeDropdown(!showTimeDropdown);
                    setShowDateDropdown(false);
                  }}
                >
                  <View style={styles.dropdownBtnIconWrap}>
                    <ClockLineIcon size={14} color={showTimeDropdown ? '#582CDB' : '#6B637B'} />
                  </View>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {selectedScheduleTime.split(' (')[0]}
                  </Text>
                  <Text style={styles.dropdownChevron}>{showTimeDropdown ? '▴' : '▾'}</Text>
                </Pressable>
              </View>

              {/* Subtle Jarvis Recommendation */}
              {selectedScheduleTime.includes('7:30') && !showDateDropdown && !showTimeDropdown && (
                <View style={styles.jarvisSubtleRow}>
                  <Text style={styles.jarvisSubtleSparkle}>✨</Text>
                  <Text style={styles.jarvisSubtleText}>
                    Jarvis recommends <Text style={styles.jarvisSubtleBold}>7:30 PM</Text> · Best audience window
                  </Text>
                </View>
              )}

              {/* SCROLLABLE DATE DROPDOWN MENU */}
              {showDateDropdown && (
                <View style={styles.dropdownMenuBox}>
                  <Text style={styles.dropdownMenuHeader}>SCROLL TO SELECT DATE (45 DAYS)</Text>
                  <ScrollView style={styles.dropdownMenuScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {SCHEDULE_DATE_OPTIONS.map((item) => {
                      const isSelected = selectedScheduleDate === item;
                      return (
                        <Pressable
                          key={item}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSelectedScheduleDate(item);
                            setShowDateDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextActive]}>
                            {item}
                          </Text>
                          {isSelected && <Text style={styles.dropdownCheckmark}>✓</Text>}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* SCROLLABLE TIME DROPDOWN MENU */}
              {showTimeDropdown && (
                <View style={styles.dropdownMenuBox}>
                  <Text style={styles.dropdownMenuHeader}>SCROLL TO SELECT TIME</Text>
                  <ScrollView style={styles.dropdownMenuScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {SCHEDULE_TIME_OPTIONS.map((item) => {
                      const isSelected = selectedScheduleTime === item;
                      return (
                        <Pressable
                          key={item}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSelectedScheduleTime(item);
                            setShowTimeDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextActive]}>
                            {item}
                          </Text>
                          {isSelected && <Text style={styles.dropdownCheckmark}>✓</Text>}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalBtnRow}>
                <Pressable style={styles.modalSecondaryBtn} onPress={() => setShowScheduleModal(false)}>
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalPrimaryBtn} onPress={handleCreatePostSubmit}>
                  <LinearGradient
                    colors={['#6366F1', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Schedule Post</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 2: FINISH DRAFT */}
        <Modal
          visible={showFinishDraftModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFinishDraftModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Finish Instagram Reel</Text>
                  <Text style={styles.modalSubtitle}>Ready for tonight&apos;s peak window</Text>
                </View>
                <Pressable onPress={() => setShowFinishDraftModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>DRAFT HOOK / SCRIPT</Text>
              <TextInput
                style={styles.modalTextInput}
                value={draftTitle}
                onChangeText={setDraftTitle}
                multiline={true}
              />

              <Text style={styles.modalInputLabel}>POSTING TIME</Text>
              <TextInput
                style={styles.modalTextInput}
                value={draftTime}
                onChangeText={setDraftTime}
              />

              <View style={styles.modalBtnRow}>
                <Pressable style={styles.modalSecondaryBtn} onPress={() => setShowFinishDraftModal(false)}>
                  <Text style={styles.modalSecondaryBtnText} numberOfLines={1}>Keep Draft</Text>
                </Pressable>

                <Pressable style={styles.modalPrimaryBtn} onPress={handleSaveDraft}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText} numberOfLines={1}>Lock &amp; Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 3: VIEW POST */}
        <Modal
          visible={showViewPostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowViewPostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Scheduled Post</Text>
                  <Text style={styles.modalSubtitle}>Queued for 11:30 AM on TikTok</Text>
                </View>
                <Pressable onPress={() => setShowViewPostModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>&ldquo;{selectedPost?.title}&rdquo;</Text>
                <Text style={styles.previewMeta}>⚡ 94 Viral Score • 18.4k - 32k Est. Reach</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowViewPostModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 4: FULL INTERACTIVE MONTH CONTENT CALENDAR */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.fullCalendarModalCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Header Row */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>May 2026</Text>
                    <View style={styles.calMonthBadge}>
                      <Text style={styles.calMonthBadgeText} numberOfLines={1}>
                        {isNarrowScreen ? '8 POSTS' : '8 POSTS PLANNED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>Tap any date to inspect scheduled posts</Text>
                </View>
                <Pressable onPress={() => setShowCalendarModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Day-of-Week Column Headers */}
              <View style={styles.calGridHeaderRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                  <Text key={`cal_h_${idx}`} style={styles.calGridHeaderText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* 31-Day Calendar Grid (May 2026 starts on Friday = offset 4) */}
              <View style={styles.calGridBody}>
                {Array.from({ length: 35 }).map((_, cellIdx) => {
                  const startOffset = 4; // May 1st on Fri
                  const dayNum = cellIdx - startOffset + 1;
                  const isValid = dayNum >= 1 && dayNum <= 31;

                  if (!isValid) {
                    return <View key={`empty_${cellIdx}`} style={styles.calCellEmpty} />;
                  }

                  const dayPosts = MONTH_POSTS_MAP[dayNum] || [];
                  const hasPosts = dayPosts.length > 0;
                  const isSelected = calendarSelectedDay === dayNum;
                  const isToday = dayNum === 15;
                  const hasDraft = dayPosts.some((p) => p.status === 'draft');
                  const hasScheduled = dayPosts.some((p) => p.status === 'scheduled');
                  const hasPublished = dayPosts.some((p) => p.status === 'published');

                  return (
                    <Pressable
                      key={`cal_day_${dayNum}`}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setCalendarSelectedDay(dayNum);
                      }}
                      style={[
                        styles.calCell,
                        hasPosts && styles.calCellHasPosts,
                        isSelected && styles.calCellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calCellText,
                          hasPosts && styles.calCellTextHasPosts,
                          isSelected && styles.calCellTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>

                      {/* Status Dots */}
                      <View style={styles.calCellDotsRow}>
                        {hasScheduled && <View style={styles.dotScheduled} />}
                        {hasDraft && <View style={styles.dotDraft} />}
                        {hasPublished && <View style={styles.dotPublished} />}
                        {isToday && !hasPosts && <View style={styles.dotToday} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Legend Row */}
              <View style={styles.calLegendRow}>
                <View style={styles.calLegendItem}>
                  <View style={styles.dotScheduled} />
                  <Text style={styles.calLegendText}>Scheduled (5)</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={styles.dotDraft} />
                  <Text style={styles.calLegendText}>Draft (2)</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={styles.dotPublished} />
                  <Text style={styles.calLegendText}>Published (1)</Text>
                </View>
              </View>

              {/* Selected Day Posts Breakdown */}
              <View style={styles.selectedDayDetailCard}>
                <View style={styles.selectedDayHeader}>
                  <Text style={styles.selectedDayTitle}>
                    {calendarSelectedDay === 15 ? 'Today, May 15' : `May ${calendarSelectedDay}, 2026`}
                  </Text>
                  <Text style={styles.selectedDayCount}>
                    {(MONTH_POSTS_MAP[calendarSelectedDay] || []).length} posts
                  </Text>
                </View>

                {MONTH_POSTS_MAP[calendarSelectedDay] && MONTH_POSTS_MAP[calendarSelectedDay].length > 0 ? (
                  <View style={styles.compactPostList}>
                    {MONTH_POSTS_MAP[calendarSelectedDay].map((p) => {
                      const statusLabel = p.status.charAt(0).toUpperCase() + p.status.slice(1);
                      return (
                        <View key={p.id} style={styles.compactPostRow}>
                          <View style={styles.compactPostHeaderRow}>
                            <View style={styles.compactPostBrandIconWrap}>
                              <SocialBrandIcon platform={p.platform} size={13} />
                            </View>
                            <Text style={styles.compactPostTitle} numberOfLines={1} ellipsizeMode="tail">
                              {p.title}
                            </Text>
                          </View>
                          <View style={styles.compactPostMetaRow}>
                            <Text style={styles.compactPostMetaText}>
                              {p.platformLabel} · {p.time}
                            </Text>
                            <View
                              style={[
                                styles.compactPostStatusBadge,
                                p.status === 'scheduled' && styles.statusBadgeScheduled,
                                p.status === 'draft' && styles.statusBadgeDraft,
                                p.status === 'published' && styles.statusBadgePublished,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.compactPostStatusText,
                                  p.status === 'scheduled' && { color: '#6D28D9' },
                                  p.status === 'draft' && { color: '#D97706' },
                                  p.status === 'published' && { color: '#15803D' },
                                ]}
                              >
                                {statusLabel}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyDayBox}>
                    <Text style={styles.emptyDayText}>No posts scheduled for this day</Text>
                  </View>
                )}
              </View>

              {/* Single Bottom Action Button */}
              <Pressable
                style={styles.calSingleActionBtn}
                onPress={() => {
                  setShowCalendarModal(false);
                  setSelectedScheduleDate(calendarSelectedDay === 15 ? 'Today · Aug 29' : `Aug ${calendarSelectedDay}`);
                  triggerModalPop();
                  setShowScheduleModal(true);
                }}
              >
                <Text style={styles.calSingleActionBtnText}>+ Schedule Post</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* NOTIFICATION MODAL */}
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
                  <Text style={styles.modalTitle}>Schedule Alerts</Text>
                  <Text style={styles.modalSubtitle}>Today&apos;s upcoming queues</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>⏰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>TikTok Post in 2 hours</Text>
                  <Text style={styles.notifBody}>&ldquo;3 creator mistakes&rdquo; is scheduled for 11:30 AM.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* PROFILE MODAL */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* CHAT MODAL */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Squad Chat</Text>
                  <Text style={styles.modalSubtitle}>Schedule co-posting times</Text>
                </View>
                <Pressable onPress={() => setShowChatModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatCard}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#582CDB', marginBottom: 2 }}>🤖 Jarvis Assistant</Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>Your peak audience reach starts at 7:30 PM today!</Text>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowChatModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
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
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
  backChevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: 'rgba(235, 230, 248, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
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

  scrollContent: {
    paddingHorizontal: sPadding(20),
    paddingTop: 8,
  },

  // TOP PILL BADGES
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contentSchedulePill: {
    backgroundColor: '#784DF0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  contentSchedulePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  freeSchedulePill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  freeSchedulePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },

  // HEADLINE
  mainHeading: {
    fontSize: sFont(22),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. TODAY HERO CARD
  todayHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171420',
  },
  todayStatusSubtle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  todayStatusDot: {
    color: '#94A3B8',
    fontWeight: '800',
  },
  todayPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  scheduledStatusPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  scheduledStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  draftStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  draftStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  postsPlannedBig: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  nextPostSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  progressSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  streakBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  streakBannerFlame: {
    fontSize: 13,
  },
  streakBannerText: {
    fontSize: 12,
    color: '#524C62',
    flex: 1,
  },
  todayActionButtonsRow: {
    gap: 8,
    alignItems: 'center',
  },
  scheduleNewPostBtn: {
    backgroundColor: '#582CDB',
    height: 46,
    width: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  scheduleNewPostBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  createFromIdeaQuietBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createFromIdeaQuietText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },

  // 2. THIS WEEK STRIP
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  weekTitle: {
    fontSize: sFont(13),
    fontWeight: '800',
    color: '#171420',
    flexShrink: 1,
  },
  viewFullCalendarLink: {
    fontSize: sFont(11.5),
    fontWeight: '600',
    color: '#6D28D9',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 20,
    width: '100%',
  },
  calendarDayPill: {
    flex: 1,
    marginHorizontal: 1.5,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  calendarDayPillActive: {
    backgroundColor: '#582CDB',
  },
  calendarDayLetter: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'center',
  },
  calendarDayLetterActive: {
    color: '#E0E7FF',
  },
  calendarDayNum: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },
  calendarDayNumActive: {
    color: '#FFFFFF',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#582CDB',
    marginTop: 3,
  },

  // 3. TODAY'S SCHEDULE
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  scheduleList: {
    gap: 10,
    marginBottom: 20,
  },
  scheduleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  scheduleCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  postPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  postPlatformBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postPlatformText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  postItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 18,
    marginBottom: 0,
  },
  postStatusTagPurple: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  postStatusTagPurpleText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  postStatusTagYellow: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  postStatusTagYellowText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
  },
  viewPostBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#582CDB',
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  viewPostBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  finishDraftBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  finishDraftBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 4. PLATFORM LOAD
  platformLoadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
  },
  platformLoadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 14,
  },
  loadRow: {
    marginBottom: 12,
  },
  loadLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loadPlatformName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  loadCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  loadTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  loadFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadFooterNote: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 6,
  },

  // 5. HEALTH & EFFICIENCY
  healthCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 12,
  },
  healthItemsList: {
    gap: 8,
    marginBottom: 16,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthItemText: {
    fontSize: 13,
    color: '#475569',
  },
  fillTomorrowBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  fillTomorrowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },

  // 6. JARVIS RECOMMENDATION
  jarvisRecCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  jarvisRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  jarvisFlameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameIcon: {
    width: 22,
    height: 22,
  },
  jarvisRecTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.6,
  },
  jarvisRecTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  jarvisRecBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  useSuggestionBtn: {
    backgroundColor: '#582CDB',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useSuggestionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  footerProNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sPadding(14),
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: sPadding(16),
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  platformSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  platformSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  platformSelectBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformSelectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#524C62',
  },
  platformSelectBtnTextActive: {
    color: '#FFFFFF',
  },
  modalTextInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#171420',
    marginBottom: 14,
  },
  dropdownSelectorsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dropdownBtnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
  },
  dropdownBtnActive: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF5FF',
  },
  dropdownBtnIconWrap: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  dropdownChevron: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    marginLeft: 2,
  },
  jarvisSubtleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 2,
    gap: 5,
  },
  jarvisSubtleSparkle: {
    fontSize: 11,
  },
  jarvisSubtleText: {
    fontSize: 11.5,
    color: '#6B637B',
    fontWeight: '500',
  },
  jarvisSubtleBold: {
    fontWeight: '700',
    color: '#582CDB',
  },
  dropdownMenuBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 8,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownMenuHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  dropdownMenuScroll: {
    maxHeight: 180,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dropdownMenuItemActive: {
    backgroundColor: '#EDE9FE',
  },
  dropdownMenuItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownMenuItemTextActive: {
    fontWeight: '800',
    color: '#582CDB',
  },
  dropdownCheckmark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    width: '100%',
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    minWidth: 0,
  },
  modalSecondaryBtnText: {
    fontSize: sFont(12),
    fontWeight: '700',
    color: '#524C62',
    textAlign: 'center',
  },
  modalPrimaryBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 0,
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  modalPrimaryBtnText: {
    fontSize: sFont(12.5),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    marginVertical: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 20,
    marginBottom: 6,
  },
  previewMeta: {
    fontSize: 12,
    color: '#582CDB',
    fontWeight: '700',
  },
  calRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
  },
  profileRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },

  // FULL CALENDAR MODAL STYLES
  fullCalendarModalCard: {
    width: '100%',
    maxWidth: 395,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: sPadding(16),
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },
  calMonthBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    flexShrink: 0,
  },
  calMonthBadgeText: {
    fontSize: sFont(9),
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  calGridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  calGridHeaderText: {
    width: '13.5%',
    textAlign: 'center',
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#64748B',
  },
  calGridBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 6,
  },
  calCell: {
    width: '13.5%',
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
    position: 'relative',
  },
  calCellEmpty: {
    width: '13.5%',
    height: 24,
    marginVertical: 1,
  },
  calCellHasPosts: {
    backgroundColor: '#EDE9FE',
  },
  calCellSelected: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  calCellText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  calCellTextHasPosts: {
    color: '#582CDB',
    fontWeight: '800',
  },
  calCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calCellDotsRow: {
    flexDirection: 'row',
    gap: 1.5,
    position: 'absolute',
    bottom: 1.5,
  },
  dotScheduled: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#582CDB',
  },
  dotDraft: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F59E0B',
  },
  dotPublished: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#22C55E',
  },
  dotToday: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#EF4444',
  },
  calLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calLegendText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  selectedDayDetailCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 14,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedDayTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  selectedDayCount: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  compactPostList: {
    gap: 20,
  },
  compactPostRow: {},
  compactPostHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },
  compactPostBrandIconWrap: {
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPostTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
  },
  compactPostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    gap: 7,
  },
  compactPostMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  compactPostStatusBadge: {
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusBadgeScheduled: {
    backgroundColor: '#EDE9FE',
  },
  statusBadgeDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgePublished: {
    backgroundColor: '#DCFCE7',
  },
  compactPostStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyDayBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyDayText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  calSingleActionBtn: {
    width: '100%',
    height: 40,
    borderRadius: 11,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  calSingleActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
