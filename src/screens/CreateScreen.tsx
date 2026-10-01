import React, { useState, useRef, useEffect } from 'react';
import { ResponsiveColumns } from '../components/ui/ResponsiveColumns';
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
} from 'react-native';
import { Text, TextInput } from '../components/ui/AppText';
import { getVoiceCloneSummary, getRepurposeAllowance, getScheduleSummary, getDrafts, subscribeToDrafts, draftAgo } from '../data';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { UserPersona } from '../components/HeaderDualModePills';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { FitLines } from '../components/ui/FitLines';
import { IdeaHeroCard } from '../components/create/IdeaHeroCard';
import { ToolTile, GlassRow, AllowanceMeter, DraftRow, DraftsEmpty, VoiceStudioProCard, VoiceStudioCard, UnlimitedChip, ProTag } from '../components/create/CreateBlocks';
import { ds } from '../theme/colors';

const SCHEDULE_DATE_OPTIONS = (() => {
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

const SCHEDULE_TIME_OPTIONS = [
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

interface CreateScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenIdeaDetail?: (ideaTitle?: string) => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onOpenIdeaAngle?: () => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenCaption?: (ideaTitle?: string) => void;
  onOpenRepurpose?: (ideaTitle?: string) => void;
  onOpenMessages?: () => void;
  userPersona?: UserPersona;
  onTogglePersona?: () => void;
  onSwitchToPro?: () => void;
  onSwitchToFree?: () => void;
  /** Pro members: Voice Studio unlocked, Hook Studio, unlimited Repurpose. */
  tier?: 'free' | 'pro';
  onOpenVoiceStudio?: () => void;
  onOpenHookStudio?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface DraftItem {
  id: string;
  title: string;
  platform: string;
  editedTime: string;
  imageSource: any;
  /** Saved from the Script page: reopens there instead of the composer */
  isScript?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
  badgeBg: string;
  badgeBorder: string;
}

const RETURNING_DRAFTS: DraftItem[] = [
  {
    id: 'draft_1',
    title: '3 mistakes new creators make',
    platform: 'TikTok',
    editedTime: 'Edited 2h ago',
    imageSource: require('../../assets/images/elena-avatar.jpg'),
  },
  {
    id: 'draft_2',
    title: 'Behind the scenes: my creator setup',
    platform: 'Instagram',
    editedTime: 'Edited 1d ago',
    imageSource: require('../../assets/images/marcus-avatar.jpg'),
  },
];

const INITIAL_DRAFTS: DraftItem[] = [];

const TRENDING_IDEAS = [
  'One thing I wish I knew before I started creating.',
  '3 creator tools that saved me 10 hours this week.',
  'Why consistency beats motivation every single time.',
  'How I script 60-second viral Reels in 5 minutes.',
];

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: '🔥 Daily Habit Active',
    body: 'Kick off your daily creator streak today.',
    time: '10m ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: 'rgba(254, 243, 199, 0.9)',
    badgeBorder: '#FDE68A',
  },
  {
    id: 'notif_2',
    title: '🏆 Storyteller Challenge',
    body: 'Complete 1 more step to earn +150 XP and unlock your badge.',
    time: '2h ago',
    unread: true,
    iconEmoji: '🏆',
    badgeBg: 'rgba(237, 233, 254, 0.9)',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'notif_3',
    title: '✨ Studio Draft Autosaved',
    body: 'Your draft "3 creator mistakes I stopped making" is saved and ready.',
    time: '5h ago',
    unread: false,
    iconEmoji: '📝',
    badgeBg: 'rgba(241, 245, 249, 0.9)',
    badgeBorder: '#E2E8F0',
  },
];

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenSchedule,
  onOpenJarvisPro,
  onOpenIdeaDetail,
  onOpenPostComposer,
  onOpenIdeaAngle,
  onOpenScript,
  onOpenCaption,
  onOpenRepurpose,
  onOpenMessages,
  userPersona,
  onTogglePersona,
  onSwitchToPro,
  onSwitchToFree,
  tier = 'free',
  onOpenVoiceStudio,
  onOpenHookStudio,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const isNewUser = (userPersona || userProfile?.userPersona || 'new') === 'new';
  const schedule = getScheduleSummary(isNewUser ? 'new' : 'returning');
  const isPro = tier === 'pro';
  const repurpose = getRepurposeAllowance(isNewUser ? 'new' : 'returning', 'free');
  const voice = getVoiceCloneSummary(isNewUser ? 'new' : 'returning');
  const repurposesLeft = Math.max(0, (repurpose.weeklyLimit ?? 0) - repurpose.usedThisWeek);
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [drafts, setDrafts] = useState<DraftItem[]>(INITIAL_DRAFTS);
  // Drafts saved from Script / the composer (shared store) come first
  const storeDrafts = React.useSyncExternalStore(subscribeToDrafts, getDrafts, getDrafts);
  const localDrafts = isNewUser ? drafts : drafts.length > 0 ? drafts : RETURNING_DRAFTS;
  const displayedDrafts = [
    ...storeDrafts.map((d) => ({
      id: d.id,
      title: d.title,
      platform: d.platform ? d.platform.charAt(0).toUpperCase() + d.platform.slice(1) : d.format,
      editedTime: draftAgo(d.savedAt),
      imageSource: undefined,
      isScript: d.kind === 'script',
    })),
    ...localDrafts,
  ];
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Modal Visibility States
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showAllDraftsModal, setShowAllDraftsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Mission Accomplished!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your post has been scheduled & streak is protected.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Great job staying consistent today!');
  const [celebrationBadge, setCelebrationBadge] = useState('POST SCHEDULED');
  const [celebrationXp, setCelebrationXp] = useState(50);

  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postPlatform, setPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [selectedCreateDate, setSelectedCreateDate] = useState('Today · Aug 29');
  const [selectedCreateTime, setSelectedCreateTime] = useState('7:30 PM (Peak Reach 🔥)');
  const [showCreateDateDropdown, setShowCreateDateDropdown] = useState(false);
  const [showCreateTimeDropdown, setShowCreateTimeDropdown] = useState(false);

  // Script Generator Form State
  const [scriptHook, setScriptHook] = useState('Stop scrolling if you are a creator in 2026.');
  const [scriptStory, setScriptStory] = useState('I used to spend 4 hours editing one 30-second video until I discovered batch filming.');
  const [scriptLesson, setScriptLesson] = useState('Systems create consistency. Consistency creates leverage.');
  const [scriptCta, setScriptCta] = useState('Comment "GROWTH" and I will send you my workflow!');

  // Caption Generator State
  const [captionTone, setCaptionTone] = useState<'authentic' | 'viral' | 'educational'>('authentic');
  const [generatedCaption, setGeneratedCaption] = useState(
    'One thing I wish I knew before I started creating: perfection is the enemy of consistency. Post the video, learn from the data, repeat. 🔥 #creatortips #creatorgrowth #poststreak'
  );

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;


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

  const openNewPost = (prefillTitle?: string, prefillPlatform?: 'tiktok' | 'instagram' | 'youtube') => {
    if (onOpenPostComposer) {
      onOpenPostComposer(prefillTitle, prefillPlatform);
    } else {
      if (prefillTitle) setPostTitle(prefillTitle);
      if (prefillPlatform) setPostPlatform(prefillPlatform);
      triggerModalPop();
      setShowNewPostModal(true);
    }
  };

  const openIdeas = () => {
    if (onOpenIdeaAngle) {
      onOpenIdeaAngle();
    } else {
      triggerModalPop();
      setShowIdeasModal(true);
    }
  };

  const openScript = () => {
    if (onOpenScript) {
      onOpenScript('One thing I wish I knew before I started creating');
    } else {
      triggerModalPop();
      setShowScriptModal(true);
    }
  };

  const openCaption = () => {
    if (onOpenCaption) {
      onOpenCaption('One thing I wish I knew before I started creating');
    } else {
      triggerModalPop();
      setShowCaptionModal(true);
    }
  };

  const openRepurpose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenRepurpose) {
      onOpenRepurpose('3 mistakes new creators make');
    }
  };

  const openDraft = (draft: DraftItem) => {
    setSelectedDraft(draft);
    if (draft.isScript && onOpenScript) {
      onOpenScript(draft.title);
    } else if (onOpenPostComposer) {
      onOpenPostComposer(draft.title, draft.platform.toLowerCase());
    } else if (onOpenIdeaDetail) {
      onOpenIdeaDetail(draft.title);
    } else {
      triggerModalPop();
      setShowDraftModal(true);
    }
  };

  const openAllDrafts = () => {
    triggerModalPop();
    setShowAllDraftsModal(true);
  };

  const openNotifications = () => {
    triggerModalPop();
    setShowNotificationModal(true);
  };

  const openProfile = () => {
    triggerModalPop();
    setShowProfileModal(true);
  };

  const openChat = () => {
    if (onOpenMessages) {
      onOpenMessages();
    } else {
      triggerModalPop();
      setShowChatModal(true);
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

  const handleCreatePostSubmit = () => {
    if (!postTitle.trim()) {
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newDraft: DraftItem = {
      id: `draft_${Date.now()}`,
      title: postTitle,
      platform: postPlatform === 'tiktok' ? 'TikTok' : postPlatform === 'instagram' ? 'Instagram' : 'YouTube',
      editedTime: 'Just now',
      imageSource: require('../../assets/images/elena-avatar.jpg'),
    };

    setDrafts([newDraft, ...drafts]);
    setShowNewPostModal(false);
    setPostTitle('');

    // Trigger Animated Ghost Celebration Modal
    setCelebrationTitle('Post Draft Scheduled!');
    setCelebrationSubtitle('Your draft is stored and scheduled for tomorrow at 11:30 AM.');
    setCelebrationSpeech(`Ghost says: You are on fire today Amara! ${userProfile?.streakCount || 1} day and counting!`);
    setCelebrationBadge('STREAK PROTECTED');
    setCelebrationXp(50);
    setShowCelebrationModal(true);
  };

  const handleOpenScheduleView = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenSchedule) {
      onOpenSchedule();
    } else if (onNavigateTab) {
      onNavigateTab('schedule' as TabType);
    }
  };

  const handleOpenVoiceStudioPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenJarvisPro) {
      onOpenJarvisPro();
    } else if (onNavigateTab) {
      onNavigateTab('growth');
    }
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        <GlassBackdrop />
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          backgroundColor="transparent"
          onSwitchToPro={onSwitchToPro}
          onSwitchToFree={onSwitchToFree}
          onTogglePersona={onTogglePersona}
          userPersona={userPersona || userProfile?.userPersona}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenNotifications={openNotifications}
          onOpenProfile={openProfile}
          userProfile={userProfile}
          unreadCount={unreadNotifCount}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['Create your', <Text key="n" style={styles.headlineAccent}>next post</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Create your next post"
            />
          </Reanimated.View>

          {/* Desktop: idea and tools on the left, the rest beside them */}
          <ResponsiveColumns split={2} gap={16}>
          {/* 1. TODAY'S IDEA (with Jarvis shuffle) */}
          <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
            <IdeaHeroCard
              isNewUser={isNewUser}
              niches={userProfile?.niches?.length ? userProfile.niches : ['lifestyle']}
              platforms={userProfile?.connectedPlatforms?.length ? userProfile.connectedPlatforms : ['tiktok', 'instagram']}
              onUseIdea={(idea) => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (onOpenPostComposer) onOpenPostComposer(idea.title);
                else if (onOpenIdeaDetail) onOpenIdeaDetail(idea.title);
                else openNewPost(idea.title);
              }}
            />
          </Reanimated.View>

          {/* 2. TOOLS */}
          <Reanimated.View entering={FadeInUp.delay(200).duration(550)}>
            <Text style={styles.sectionLabel}>Tools</Text>
            <View style={styles.toolRow}>
              <ToolTile
                featured
                title="New post"
                subtitle="Start from scratch"
                onPress={() => openNewPost()}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
                  </Svg>
                }
              />
              <ToolTile
                title="Ideas"
                subtitle="Find your next angle"
                onPress={openIdeas}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z" fill={ds.purple} />
                    <Path d="M19 16l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1 1-2.3z" fill={ds.purple} />
                  </Svg>
                }
              />
            </View>
            <View style={styles.toolRow}>
              <ToolTile
                title="Script"
                subtitle="Build a story"
                onPress={openScript}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="3" width="18" height="18" rx="3" stroke={ds.purple} strokeWidth={2.1} />
                    <Path d="M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5" stroke={ds.purple} strokeWidth={2.1} />
                  </Svg>
                }
              />
              <ToolTile
                title="Caption"
                subtitle="Write in your voice"
                onPress={openCaption}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                }
              />
            </View>
          </Reanimated.View>

          {/* 3. REPURPOSE + SCHEDULE */}
          <Reanimated.View entering={FadeInUp.delay(300).duration(550)} style={styles.stack}>
            <GlassRow
              title="Repurpose"
              subtitle="Turn an idea, a video or a link into more posts"
              onPress={openRepurpose}
              extra={isPro ? <UnlimitedChip /> : <AllowanceMeter left={repurposesLeft} limit={repurpose.weeklyLimit ?? 0} />}
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
            {isPro && (
              <GlassRow
                title="Hook Studio"
                subtitle="Strong first lines for your next video"
                onPress={() => onOpenHookStudio?.()}
                extra={<View style={{ marginTop: 8 }}><ProTag /></View>}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={ds.purple} strokeWidth={2.1} strokeLinejoin="round" />
                  </Svg>
                }
              />
            )}
            <GlassRow
              title={
                schedule.scheduledCount === 0
                  ? 'Nothing scheduled yet'
                  : `${schedule.scheduledCount} post${schedule.scheduledCount === 1 ? '' : 's'} scheduled`
              }
              subtitle={schedule.nextPostLabel ? `Next up: ${schedule.nextPostLabel}` : 'Pick an idea above, then choose a time'}
              onPress={handleOpenScheduleView}
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.1} />
                  <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" />
                </Svg>
              }
            />
          </Reanimated.View>

          {/* 4. DRAFTS */}
          <Reanimated.View entering={FadeInUp.delay(400).duration(550)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, styles.sectionLabelInline]}>Your drafts</Text>
              {displayedDrafts.length > 0 && (
                <Pressable onPress={openAllDrafts} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.sectionLink}>See all</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.stack}>
              {displayedDrafts.length === 0 ? (
                <DraftsEmpty onStart={() => openNewPost()} />
              ) : (
                displayedDrafts.slice(0, 3).map((draft) => (
                  <DraftRow
                    key={draft.id}
                    title={draft.title}
                    platform={draft.platform}
                    edited={draft.editedTime}
                    image={draft.imageSource}
                    onPress={() => openDraft(draft)}
                  />
                ))
              )}
            </View>
          </Reanimated.View>

          {/* 5. VOICE STUDIO (Pro only) */}
          <Reanimated.View entering={FadeInUp.delay(500).duration(550)} style={styles.voiceStudio}>
            {isPro ? (
              <VoiceStudioCard
                isNew={isNewUser}
                voiceName={voice.voiceName}
                minutesUsed={voice.minutesUsed}
                minutesIncluded={voice.minutesIncluded}
                onOpen={() => onOpenVoiceStudio?.()}
              />
            ) : (
              <VoiceStudioProCard onUnlock={handleOpenVoiceStudioPro} />
            )}
          </Reanimated.View>

          </ResponsiveColumns>
          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* FROSTED LIQUID GLASS MODALS (POSTSTREAK LUXURY STYLE) */}
        {/* ============================================================ */}

        {/* MODAL 1: NEW POST */}
        <Modal
          visible={showNewPostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNewPostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>New Post</Text>
                  <Text style={styles.modalSubtitle}>Create from scratch and protect your streak.</Text>
                </View>

                <Pressable
                  onPress={() => setShowNewPostModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>CHOOSE PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {/* TikTok */}
                <Pressable
                  onPress={() => setPostPlatform('tiktok')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'tiktok' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                      fill={postPlatform === 'tiktok' ? '#FFFFFF' : '#000000'}
                    />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'tiktok' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    TikTok
                  </Text>
                </Pressable>

                {/* Instagram */}
                <Pressable
                  onPress={() => setPostPlatform('instagram')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'instagram' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="2" width="20" height="20" rx="5" stroke={postPlatform === 'instagram' ? '#FFFFFF' : '#E1306C'} strokeWidth="2.2" />
                    <Circle cx="12" cy="12" r="4" stroke={postPlatform === 'instagram' ? '#FFFFFF' : '#E1306C'} strokeWidth="2.2" />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'instagram' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    Instagram
                  </Text>
                </Pressable>

                {/* YouTube */}
                <Pressable
                  onPress={() => setPostPlatform('youtube')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'youtube' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81z"
                      fill={postPlatform === 'youtube' ? '#FFFFFF' : '#FF0000'}
                    />
                    <Path d="M10 15.5l5.5-3.5L10 8.5v7z" fill={postPlatform === 'youtube' ? '#582CDB' : '#FFFFFF'} />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'youtube' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    YouTube
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>POST TITLE / HOOK</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="Enter your post hook…"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalInputLabel}>WHEN TO POST</Text>
              <View style={styles.dropdownSelectorsRow}>
                {/* DATE SELECTOR BUTTON */}
                <Pressable
                  style={[styles.dropdownBtnHalf, showCreateDateDropdown && styles.dropdownBtnActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowCreateDateDropdown(!showCreateDateDropdown);
                    setShowCreateTimeDropdown(false);
                  }}
                >
                  <View style={styles.dropdownBtnIconWrap}>
                    <CalendarLineIcon size={14} color={showCreateDateDropdown ? '#582CDB' : '#6B637B'} />
                  </View>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {selectedCreateDate}
                  </Text>
                  <Text style={styles.dropdownChevron}>{showCreateDateDropdown ? '▴' : '▾'}</Text>
                </Pressable>

                {/* TIME SELECTOR BUTTON */}
                <Pressable
                  style={[styles.dropdownBtnHalf, showCreateTimeDropdown && styles.dropdownBtnActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowCreateTimeDropdown(!showCreateTimeDropdown);
                    setShowCreateDateDropdown(false);
                  }}
                >
                  <View style={styles.dropdownBtnIconWrap}>
                    <ClockLineIcon size={14} color={showCreateTimeDropdown ? '#582CDB' : '#6B637B'} />
                  </View>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {selectedCreateTime.split(' (')[0]}
                  </Text>
                  <Text style={styles.dropdownChevron}>{showCreateTimeDropdown ? '▴' : '▾'}</Text>
                </Pressable>
              </View>

              {/* Subtle Jarvis Recommendation */}
              {selectedCreateTime.includes('7:30') && !showCreateDateDropdown && !showCreateTimeDropdown && (
                <View style={styles.jarvisSubtleRow}>
                  <Text style={styles.jarvisSubtleSparkle}>✨</Text>
                  <Text style={styles.jarvisSubtleText}>
                    Jarvis recommends <Text style={styles.jarvisSubtleBold}>7:30 PM</Text> · Best audience window
                  </Text>
                </View>
              )}

              {/* SCROLLABLE DATE DROPDOWN MENU */}
              {showCreateDateDropdown && (
                <View style={styles.dropdownMenuBox}>
                  <Text style={styles.dropdownMenuHeader}>SCROLL TO SELECT DATE (45 DAYS)</Text>
                  <ScrollView style={styles.dropdownMenuScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {SCHEDULE_DATE_OPTIONS.map((item) => {
                      const isSelected = selectedCreateDate === item;
                      return (
                        <Pressable
                          key={item}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSelectedCreateDate(item);
                            setShowCreateDateDropdown(false);
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
              {showCreateTimeDropdown && (
                <View style={styles.dropdownMenuBox}>
                  <Text style={styles.dropdownMenuHeader}>SCROLL TO SELECT TIME</Text>
                  <ScrollView style={styles.dropdownMenuScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {SCHEDULE_TIME_OPTIONS.map((item) => {
                      const isSelected = selectedCreateTime === item;
                      return (
                        <Pressable
                          key={item}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSelectedCreateTime(item);
                            setShowCreateTimeDropdown(false);
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
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowNewPostModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalPrimaryBtn} onPress={handleCreatePostSubmit}>
                  <View style={[styles.modalPrimaryGradient, { backgroundColor: '#5B3EE8' }]}>
                    <Text style={styles.modalPrimaryBtnText}>Save &amp; Schedule</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 2: TRENDING IDEAS */}
        <Modal
          visible={showIdeasModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIdeasModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>AI Hook Sparks</Text>
                  <Text style={styles.modalSubtitle}>Trending angles customized for your niche:</Text>
                </View>

                <Pressable
                  onPress={() => setShowIdeasModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {TRENDING_IDEAS.map((idea, idx) => (
                <Pressable
                  key={idx}
                  style={styles.ideaItemCard}
                  onPress={() => {
                    setPostTitle(idea);
                    setShowIdeasModal(false);
                    openNewPost(idea);
                  }}
                >
                  <Text style={styles.ideaItemText}>&ldquo;{idea}&rdquo;</Text>
                  <Text style={styles.ideaItemTag}>⚡ 94 Viral Score • High Retention</Text>
                </Pressable>
              ))}

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowIdeasModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 3: SCRIPT BUILDER */}
        <Modal
          visible={showScriptModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowScriptModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>Script Builder</Text>
                  <Text style={styles.modalSubtitle}>Hook ➔ Story ➔ Lesson ➔ CTA formula:</Text>
                </View>

                <Pressable
                  onPress={() => setShowScriptModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 290 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalInputLabel}>🎣 HOOK (0 - 3s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptHook}
                  onChangeText={setScriptHook}
                  multiline
                />

                <Text style={styles.modalInputLabel}>📖 STORY (3 - 25s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptStory}
                  onChangeText={setScriptStory}
                  multiline
                />

                <Text style={styles.modalInputLabel}>💡 LESSON (25 - 45s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptLesson}
                  onChangeText={setScriptLesson}
                  multiline
                />

                <Text style={styles.modalInputLabel}>📣 CALL TO ACTION (45 - 60s)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={scriptCta}
                  onChangeText={setScriptCta}
                />
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowScriptModal(false);
                  openNewPost(scriptHook);
                }}
              >
                <Text style={styles.modalFullBtnText}>Use in Next Post ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 4: CAPTION GENERATOR */}
        <Modal
          visible={showCaptionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCaptionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>Caption Generator</Text>
                  <Text style={styles.modalSubtitle}>Craft high-engagement captions in your voice:</Text>
                </View>
                <Pressable
                  onPress={() => setShowCaptionModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.platformSelectRow}>
                {(['authentic', 'viral', 'educational'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setCaptionTone(t)}
                    style={[
                      styles.platformSelectBtn,
                      captionTone === t && styles.platformSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.platformSelectBtnText,
                        captionTone === t && styles.platformSelectBtnTextActive,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.modalTextInput, { height: 100 }]}
                value={generatedCaption}
                onChangeText={setGeneratedCaption}
                multiline
              />

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowCaptionModal(false);
                  setCelebrationTitle('Caption Copied!');
                  setCelebrationSubtitle('Your caption and viral creator hashtags are copied to your clipboard.');
                  setCelebrationSpeech('Ghost says: Captions with clear takeaways get 40% more saves & shares!');
                  setCelebrationBadge('VIRAL COPY READY');
                  setCelebrationXp(25);
                  setShowCelebrationModal(true);
                }}
              >
                <Text style={styles.modalFullBtnText}>Copy Caption &amp; Hashtags ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 5: DRAFT DETAIL */}
        <Modal
          visible={showDraftModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDraftModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>{selectedDraft?.platform} Draft</Text>
                  <Text style={styles.modalSubtitle}>{selectedDraft?.editedTime}</Text>
                </View>
                <Pressable
                  onPress={() => setShowDraftModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.promptInnerBox}>
                <Text style={styles.promptText}>{selectedDraft?.title}</Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowDraftModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Close</Text>
                </Pressable>

                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setShowDraftModal(false);
                    handleOpenScheduleView();
                  }}
                >
                  <View style={[styles.modalPrimaryGradient, { backgroundColor: '#5B3EE8' }]}>
                    <Text style={styles.modalPrimaryBtnText}>Open in Schedule</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 6: ALL DRAFTS LIST */}
        <Modal
          visible={showAllDraftsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAllDraftsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>All Creator Drafts</Text>
                  <Text style={styles.modalSubtitle}>Pick up where you left off</Text>
                </View>
                <Pressable
                  onPress={() => setShowAllDraftsModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 8 }}>
                  {drafts.map((draft) => (
                    <Pressable
                      key={draft.id}
                      style={({ pressed }) => [styles.draftCard, pressed && styles.btnPressed]}
                      onPress={() => {
                        setShowAllDraftsModal(false);
                        openDraft(draft);
                      }}
                    >
                      <Image source={draft.imageSource} style={styles.draftThumbnail} resizeMode="cover" />
                      <View style={styles.draftContentCol}>
                        <Text style={styles.draftTitle} numberOfLines={2}>{draft.title}</Text>
                        <Text style={styles.draftMeta}>{draft.platform} • {draft.editedTime}</Text>
                      </View>
                      <View style={styles.draftChevronBox}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowAllDraftsModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 7: NOTIFICATION CENTER */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Streak updates &amp; squad activity</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {notificationsList.map((notif) => (
                  <View key={notif.id} style={[styles.notifCard, notif.unread && styles.notifCardUnread]}>
                    <View style={[styles.notifBadge, { backgroundColor: notif.badgeBg, borderColor: notif.badgeBorder }]}>
                      <Text style={{ fontSize: 16 }}>{notif.iconEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifBody}>{notif.body}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setNotificationsList(notificationsList.map((n) => ({ ...n, unread: false })));
                  setShowNotificationModal(false);
                }}
              >
                <Text style={styles.modalFullBtnText}>Mark All Read &amp; Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* MODAL 9: CREATOR CHAT */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <Text style={styles.modalTitle}>Creator Squad Chat</Text>
                  <Text style={styles.modalSubtitle}>Connect &amp; collaborate with matched creators</Text>
                </View>
                <Pressable
                  onPress={() => setShowChatModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatMessageBubble}>
                <Text style={styles.chatSender}>🤖 Jarvis Growth AI</Text>
                <Text style={styles.chatBody}>Your morning creator brief is ready. 3 trending hook angles were matched to your audience.</Text>
              </View>

              <View style={styles.chatMessageBubble}>
                <Text style={styles.chatSender}>📷 Elena Vance</Text>
                <Text style={styles.chatBody}>Loved your latest Reel! Let us batch film tomorrow around 2 PM.</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowChatModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close Chat</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText={celebrationBadge}
          xpEarned={celebrationXp}
          streakCount={userProfile?.streakCount || 1}
          actionText="Continue ➔"
          onDismiss={() => setShowCelebrationModal(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ds.bg,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 10 },
  sectionLabelInline: { marginTop: 0, marginBottom: 0 },
  sectionLink: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  toolRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stack: { gap: 12 },
  voiceStudio: { marginTop: 24 },
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
    gap: 7,
    marginBottom: 10,
  },
  createPill: {
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 100,
    overflow: 'hidden',
  },
  createPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  freeToolsPill: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 100,
  },
  freeToolsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5B3EE8',
    letterSpacing: 0.2,
  },

  // HEADLINE
  mainHeading: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 16,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#524C62',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. HERO STREAK SAVER CARD
  streakSaverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: sPadding(14),
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  streakLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  flameIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  flameEmoji: {
    fontSize: 15,
  },
  streakTitlesContainer: {
    flex: 1,
    minWidth: 0,
  },
  streakSaverTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#5B3EE8',
    letterSpacing: 0.4,
  },
  streakDaysTitle: {
    fontSize: sFont(14.5),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  promptInnerBox: {
    backgroundColor: '#FAF9FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.05)',
    padding: 12,
    marginBottom: 10,
  },
  promptLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 3,
  },
  promptText: {
    fontSize: 13.5,
    color: '#474154',
    lineHeight: 19,
    fontWeight: '500',
  },
  streakMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%',
  },
  streakPlatformsBadge: {
    backgroundColor: '#F4F0FF',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 1,
  },
  streakPlatformsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: -0.2,
  },
  bestTimeBadge: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 0,
  },
  bestTimeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5B3EE8',
    letterSpacing: -0.2,
  },
  useIdeaBtn: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  useIdeaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useIdeaBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  // 2. JARVIS SUGGESTION CARD (ROYAL PURPLE & GOLD)
  jarvisSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF9FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
  },
  jarvisFlameCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  jarvisFlameIcon: {
    width: 24,
    height: 24,
  },
  jarvisSuggestionContent: {
    flex: 1,
  },
  jarvisSuggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
    marginBottom: 2,
  },
  jarvisSuggestionText: {
    fontSize: 12,
    color: '#5E576E',
    lineHeight: 17,
    fontWeight: '500',
  },

  // 3. 2x2 CREATION TOOLS GRID
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 14,
    width: '100%',
  },
  toolGridCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: sPadding(12),
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#582CDB',
  },
  toolTitle: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: sFont(11),
    color: '#5E576E',
    fontWeight: '400',
  },

  // 3.5 REPURPOSE SPOTLIGHT BANNER
  repurposeBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.12)',
    padding: sPadding(14),
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  repurposeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  repurposeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
  },
  repurposeBannerContent: {
    flex: 1,
    minWidth: 0,
  },
  repurposeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  repurposeBannerTitle: {
    fontSize: sFont(14),
    fontWeight: '700',
    color: '#171420',
  },
  repurposeLimitBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#34D399',
  },
  repurposeLimitBadgeText: {
    fontWeight: '800',
    fontSize: sFont(9),
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  repurposeBannerSubtitle: {
    fontSize: sFont(11.5),
    color: '#5E576E',
    lineHeight: 16,
    fontWeight: '400',
  },
  repurposeActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.15)',
  },
  repurposeActionText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#582CDB',
  },

  // 4. SCHEDULED POSTS BANNER
  scheduledBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: sPadding(14),
    marginBottom: 24,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  scheduledLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
    minWidth: 0,
  },
  calendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  scheduledTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  scheduledTitle: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#171420',
  },
  scheduledSub: {
    fontSize: sFont(11),
    color: '#5E576E',
    marginTop: 1,
    fontWeight: '400',
  },
  scheduledOpenBtn: {
    paddingLeft: 8,
    flexShrink: 0,
  },
  scheduledOpenLink: {
    fontSize: sFont(13),
    fontWeight: '700',
    color: '#582CDB',
  },

  // 5. YOUR DRAFTS SECTION
  draftsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  draftsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  viewAllDraftsLink: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#582CDB',
  },
  draftsList: {
    gap: 10,
    marginBottom: 24,
  },
  draftsEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  draftsEmptyText: {
    fontSize: sFont(12.5),
    color: '#6B637B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    paddingVertical: 9.5,
    paddingHorizontal: 11,
    gap: 11,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  draftThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
  },
  draftContentCol: {
    flex: 1,
    minWidth: 0,
  },
  draftTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#171420',
    marginBottom: 2,
    lineHeight: 18,
  },
  draftMeta: {
    fontSize: 11.5,
    color: '#5E576E',
    fontWeight: '400',
  },
  draftMoreDots: {
    fontSize: 18,
    color: '#582CDB',
    paddingHorizontal: 6,
  },
  draftChevronBox: {
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 6. VOICE STUDIO PRO CARD (METALLIC GOLD & PURPLE DASHED)
  voiceStudioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  voiceStudioProPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 2.5,
    paddingHorizontal: 9,
    borderRadius: 100,
    marginBottom: 6,
  },
  voiceStudioProPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  voiceStudioTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  voiceStudioSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '500',
  },
  waveformWrapper: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
    width: '100%',
  },
  waveformAura: {
    position: 'absolute',
    width: 120,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(234, 179, 8, 0.16)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
  },
  waveBar: {
    width: 5,
    borderRadius: 10,
  },
  unlockVoiceBtn: {
    width: '100%',
    maxWidth: 220,
    height: 38,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  unlockVoiceGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockVoiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // ============================================================
  // POSTSTREAK LUXURY FROSTED MODAL STYLING
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Ghost Speech Header inside Modals
  modalGhostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    marginBottom: 14,
  },
  modalGhostImgWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGhostImg: {
    width: 28,
    height: 28,
  },
  modalGhostSpeechBubble: {
    flex: 1,
  },
  modalGhostSpeechText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 22,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
    gap: 6,
    marginBottom: 14,
  },
  platformSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  platformSelectBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformSelectBtnText: {
    fontSize: 11,
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
    gap: 10,
    marginTop: 6,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#524C62',
  },
  modalPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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

  ideaItemCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 10,
  },
  ideaItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  ideaItemTag: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '600',
  },

  // Notification Modal Styles
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Profile Modal Styles
  profileModalCardInner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileModalIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  profileModalNiche: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  profileModalLevelPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  profileModalLevelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // Chat Modal Styles
  chatMessageBubble: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },
  chatSender: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 3,
  },
  chatBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },

  // Success Modal Styles
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
    marginBottom: 6,
  },
  successModalBody: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
});
