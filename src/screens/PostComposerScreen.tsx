import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from '../components/ui/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';
import Reanimated, { FadeIn, FadeInUp, FadeOut, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  getStarterIdeas,
  getFilmPlan,
  getSoundIdeas,
  checkInToday,
  getDefaultFilmStyle,
  getGoalCaption,
  saveDraft as saveDraftToStore,
  IDEA_GOALS,
  type FilmStyle,
  type IdeaGoal,
} from '../data';
import { ScheduleSheet } from '../components/composer/ScheduleSheet';
import { PlatformLogo } from '../components/onboarding/PlatformLogo';
import { FilmMethodPicker, FilmPlanCard, PostedCheck, type FilmMethod } from '../components/composer/FilmBlocks';
import { handOffToPlatform, isHandoffPlatform, HANDOFF_NAMES, type HandoffPlatform } from '../utils/handoff';
import { captureWithCamera, pickFromLibrary, type PickedMedia } from '../utils/media';
import { AppState } from 'react-native';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FitLines } from '../components/ui/FitLines';
import { AppButton } from '../components/ui/AppButton';
import { JarvisOrb } from '../components/JarvisOrb';
import { STAGE_1_PLATFORMS } from '../config/features';
import {
  StepHeader,
  PlatformChip,
  RecommendedFormat,
  FormatTile,
  MediaZone,
  CyclePill,
  AiAction,
  EditsMeter,
  TagChip,
  ModeSwitch,
  ReadinessCard,
  ComposerToast,
} from '../components/composer/ComposerBlocks';
import { ds } from '../theme/colors';

interface PostComposerScreenProps {
  ideaTitle?: string;
  /** Goal picked on the Ideas page; the caption is written for it. */
  ideaGoal?: { goal?: IdeaGoal; hook?: string; caption?: string; tags?: string[] } | null;
  questDraft?: {
    title: string;
    hook: string;
    story: string;
    lesson: string;
    cta: string;
    badgeLabel?: string;
    requirements?: string[];
    xpReward?: number;
  } | null;
  initialFormat?: ContentFormatType;
  initialPlatform?: string;
  attachedAudio?: {
    title: string;
    voiceName: string;
    duration: string;
    speed: string;
  } | null;
  onClearAttachedAudio?: () => void;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
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

interface PlatformOption {
  id: string;
  name: string;
  shortName: string;
  format: string;
  multiplier: string;
  bgColor: string;
  gradient?: string[];
  iconType: 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'pinterest' | 'facebook';
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Peak Reach Window Active',
    body: '7:30 PM is your optimal viral slot on TikTok & Instagram.',
    time: '5m ago',
    unread: true,
    iconEmoji: '⚡',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'n2',
    title: 'Streak Saver Ready',
    body: "Convert today's idea into a post to kick off your creator streak.",
    time: '2h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

const SAMPLE_IDEAS = [
  'One thing I wish I knew before I started creating',
  'The #1 habit that doubled my views in 30 days',
  '3 mistakes almost every beginner creator makes',
  'How I batch-film 10 videos in 2 hours',
];

const ALL_AVAILABLE_PLATFORMS: PlatformOption[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    shortName: 'TikTok',
    format: '9:16 Video / Reels',
    multiplier: 'Best Fit',
    bgColor: '#000000',
    iconType: 'tiktok',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'IG',
    format: 'Reels & Carousel',
    multiplier: 'Recommended',
    bgColor: '#833AB4',
    gradient: ['#833AB4', '#FD1D1D', '#FCAF45'],
    iconType: 'instagram',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YT',
    format: 'Shorts & Longform',
    multiplier: 'High Retention',
    bgColor: '#FF0000',
    iconType: 'youtube',
  },
  {
    id: 'threads',
    name: 'Threads',
    shortName: 'Threads',
    format: 'Quotes & Insights',
    multiplier: 'Strong Fit',
    bgColor: '#000000',
    iconType: 'threads',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    shortName: 'Pinterest',
    format: 'Idea Pins & Saves',
    multiplier: 'Visual Saves',
    bgColor: '#E60023',
    iconType: 'pinterest',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'FB',
    format: 'Reels & Groups',
    multiplier: 'Community',
    bgColor: '#1877F2',
    iconType: 'facebook',
  },
];

export type ContentFormatType = 'short_video' | 'carousel' | 'image' | 'text' | 'long_video';

export interface ContentFormatOption {
  id: ContentFormatType;
  title: string;
  shortTitle: string;
  badge: string;
  ratio: string;
  icon: string;
  recommendedDescription: string;
  mediaLabel: string;
  mediaSub: string;
  primaryMediaActionText: string;
  supportedPlatformIds: string[];
}

export const CONTENT_FORMATS: ContentFormatOption[] = [
  {
    id: 'short_video',
    title: 'Short Video',
    shortTitle: 'Shorts / Reels',
    badge: '9:16 Vertical',
    ratio: '9:16',
    icon: '🎬',
    recommendedDescription: 'Best fit for this idea and your selected short-form channels.',
    mediaLabel: 'Add your short-form video',
    mediaSub: '9:16 vertical • Recommended 15–60s',
    primaryMediaActionText: 'Add Video',
    supportedPlatformIds: ['tiktok', 'instagram', 'youtube', 'facebook'],
  },
  {
    id: 'carousel',
    title: 'Carousel',
    shortTitle: 'Multi-Slide',
    badge: '4:5 / 1:1',
    ratio: '4:5',
    icon: '📑',
    recommendedDescription: 'Great for educational breakdowns, step-by-step swipe posts & saves.',
    mediaLabel: 'Add carousel slides',
    mediaSub: 'Up to 30 slides • 4:5 or 1:1 recommended',
    primaryMediaActionText: 'Add Slides (0/30)',
    supportedPlatformIds: ['instagram', 'tiktok', 'pinterest', 'facebook'],
  },
  {
    id: 'image',
    title: 'Single Visual',
    shortTitle: 'Photo / Visual',
    badge: '4:5 Portrait',
    ratio: '4:5',
    icon: '📸',
    recommendedDescription: 'High-impact standalone visual or aesthetic graphic for feeds.',
    mediaLabel: 'Add high-res visual',
    mediaSub: '4:5 portrait or 9:16 vertical recommended',
    primaryMediaActionText: 'Add Image',
    supportedPlatformIds: ['instagram', 'pinterest', 'facebook', 'threads'],
  },
  {
    id: 'text',
    title: 'Text / Thread',
    shortTitle: 'Written Take',
    badge: 'Text-First',
    ratio: 'Text',
    icon: '✍️',
    recommendedDescription: 'Direct text takeaway, opinion, or multi-part insight thread.',
    mediaLabel: 'Media is optional for text posts',
    mediaSub: 'Attach an optional visual or write your post below',
    primaryMediaActionText: 'Add Optional Visual',
    supportedPlatformIds: ['threads', 'facebook'],
  },
  {
    id: 'long_video',
    title: 'Long Video',
    shortTitle: '16:9 Landscape',
    badge: '16:9 HD',
    ratio: '16:9',
    icon: '▶️',
    recommendedDescription: 'In-depth tutorial, vlog, or full horizontal explanation video.',
    mediaLabel: 'Add your long-form video',
    mediaSub: '16:9 landscape • HD/4K recommended',
    primaryMediaActionText: 'Add Video',
    supportedPlatformIds: ['youtube', 'facebook'],
  },
];



// Official Real Social Media SVG Logos
const PlatformIcon = ({ iconType, size = 38 }: { iconType: string; size?: number }) => {
  if (iconType === 'tiktok') {
    return (
      <View style={[styles.officialIconContainer, { width: size, height: size, backgroundColor: '#000000' }]}>
        <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24">
          <Path
            d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
            fill="#25F4EE"
            transform="translate(-0.7, -0.7)"
          />
          <Path
            d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
            fill="#FE2C55"
            transform="translate(0.7, 0.7)"
          />
          <Path
            d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
            fill="#FFFFFF"
          />
        </Svg>
      </View>
    );
  }
  if (iconType === 'instagram') {
    return (
      <View style={[styles.officialIconContainer, { width: size, height: size, overflow: 'hidden' }]}>
        <LinearGradient
          colors={['#833AB4', '#FD1D1D', '#FCAF45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFillContainer}
        >
          <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
            <Rect x="2" y="2" width="20" height="20" rx="5.5" stroke="#FFFFFF" strokeWidth="2.2" />
            <Circle cx="12" cy="12" r="4.2" stroke="#FFFFFF" strokeWidth="2.2" />
            <Circle cx="17.5" cy="6.5" r="1.3" fill="#FFFFFF" />
          </Svg>
        </LinearGradient>
      </View>
    );
  }
  if (iconType === 'youtube') {
    return (
      <View style={[styles.officialIconContainer, { width: size, height: size, backgroundColor: '#FF0000' }]}>
        <Svg width={size * 0.62} height={size * 0.44} viewBox="0 0 28 20">
          <Path
            d="M27.4 3.1a3.5 3.5 0 0 0-2.5-2.5C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1 36.6 36.6 0 0 0 0 10a36.6 36.6 0 0 0 .6 6.9 3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5 36.6 36.6 0 0 0 .6-6.9 36.6 36.6 0 0 0-.6-6.9z"
            fill="#FF0000"
          />
          <Path d="M11.2 14.3l7.3-4.3-7.3-4.3v8.6z" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  }
  if (iconType === 'threads') {
    return (
      <View style={[styles.officialIconContainer, { width: size, height: size, backgroundColor: '#000000' }]}>
        <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="#FFFFFF">
          <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.83 0 5.39-1.18 7.21-3.08l-1.47-1.37C16.27 19.06 14.25 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c4.32 0 7.85 3.43 7.99 7.72H18c-.28-3.23-2.95-5.72-6-5.72-3.31 0-6 2.69-6 6s2.69 6 6 6c1.86 0 3.52-.85 4.63-2.19.46-.55.77-1.2.92-1.91-.71-.24-1.52-.38-2.38-.38-2.6 0-4.71 1.79-4.71 4 0 2.21 2.11 4 4.71 4 3.01 0 5.48-2.22 5.8-5.18.02-.27.03-.54.03-.82 0-5.52-4.48-10-10-10z" />
        </Svg>
      </View>
    );
  }
  if (iconType === 'pinterest') {
    return (
      <View style={[styles.officialIconContainer, { width: size, height: size, backgroundColor: '#E60023' }]}>
        <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="#FFFFFF">
          <Path d="M12 2a10 10 0 0 0-3.66 19.31c-.05-.82-.09-2.09.02-2.99l.86-3.67s-.22-.44-.22-1.09c0-1.02.59-1.78 1.33-1.78.63 0 .93.47.93 1.04 0 .63-.4 1.58-.61 2.45-.17.74.37 1.34 1.1 1.34 1.32 0 2.34-1.39 2.34-3.4 0-1.78-1.28-3.02-3.11-3.02-2.27 0-3.6 1.7-3.6 3.46 0 .69.26 1.42.59 1.82.07.08.08.15.06.23l-.22.92c-.04.14-.12.17-.28.1-1.04-.48-1.69-2-1.69-3.22 0-2.62 1.9-5.03 5.49-5.03 2.88 0 5.12 2.05 5.12 4.8 0 2.86-1.8 5.16-4.3 5.16-.84 0-1.63-.44-1.9-.95l-.52 1.98c-.19.73-.7 1.64-1.04 2.2A10 10 0 1 0 12 2z" />
        </Svg>
      </View>
    );
  }
  return (
    <View style={[styles.officialIconContainer, { width: size, height: size, backgroundColor: '#1877F2' }]}>
      <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="#FFFFFF">
        <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </Svg>
    </View>
  );
};

export const PostComposerScreen: React.FC<PostComposerScreenProps> = ({
  ideaTitle = 'One thing I wish I knew before I started creating',
  ideaGoal,
  questDraft,
  initialFormat,
  initialPlatform = '',
  attachedAudio,
  onClearAttachedAudio,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [currentIdea, setCurrentIdea] = useState(ideaTitle);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialPlatform ? [initialPlatform] : []
  );

  // Content Format State (Intelligent Content Type)
  const [selectedFormat, setSelectedFormat] = useState<ContentFormatType>(initialFormat || 'short_video');
  // Short video only: film in TikTok / Reels / Shorts, or upload a finished video
  const [filmMethod, setFilmMethod] = useState<FilmMethod>('native');

  // Media State
  const [hasMedia, setHasMedia] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'thumbnail' | null>(null);
  const [hasThumbnail, setHasThumbnail] = useState(false);

  // Caption & Tone State
  const [caption, setCaption] = useState(
    'I used to wait until everything was perfect before posting. That slowed me down more than anything. Consistency got easier when I started posting small lessons instead of waiting for perfect ideas.'
  );
  const [captionTone, setCaptionTone] = useState<'Helpful' | 'Viral' | 'Story'>('Helpful');
  const [captionCta, setCaptionCta] = useState<'Ask Question' | 'Save Post' | 'Share Thoughts'>('Ask Question');
  const [aiEditsLeft, setAiEditsLeft] = useState(3);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isCaptionFocused, setIsCaptionFocused] = useState(false);

  // Tags State
  const [tags, setTags] = useState<string[]>([
    '#CreatorTips',
    '#ContentCreation',
    '#Consistency',
  ]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTagInput, setShowAddTagInput] = useState(false);

  // Scheduling & Publishing State
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('schedule');
  const [scheduledTime, setScheduledTime] = useState('Today, 7:30 PM');

  // Modals
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [showChangeIdeaModal, setShowChangeIdeaModal] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Post Scheduled!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your post has been scheduled for Today at 7:30 PM.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Day 1 post scheduled! +50 XP added to your creator level.');

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Animations & Navigation Refs
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const mainScrollViewRef = useRef<ScrollView>(null);
  const captionInputRef = useRef<TextInput>(null);
  // Steps are measured when tapped (sections above can change height)
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  const scrollY = useRef(0);
  // Sizes used to keep jumps inside the page (scrolling past the end
  // overshoots and springs back on iPhone)
  const contentH = useRef(0);
  const viewportH = useRef(0);

  // Sync prop changes for frictionless idea adoption
  useEffect(() => {
    if (ideaTitle) {
      setCurrentIdea(ideaTitle);
      const lower = ideaTitle.toLowerCase();
      if (
        lower.includes('story') ||
        lower.includes('lesson') ||
        lower.includes('wish i knew') ||
        lower.includes('mistake') ||
        lower.includes('storyteller') ||
        lower.includes('started creating')
      ) {
        setCaption(
          'When I first started creating content, I delayed posting for months waiting for everything to be perfect.\n\nWhen I finally hit record on my phone and shared one honest lesson, my 3rd video hit 50k views.\n\nKey takeaway: Storytelling and consistency beat high production every time.\n\nWhat is one lesson you learned the hard way? Drop it below 👇'
        );
        setCaptionTone('Story');
        setCaptionCta('Ask Question');
        setTags(['#CreatorJourney', '#Storytelling', '#LessonsLearned', '#PostStreak']);
        setSelectedFormat('short_video');
      } else if (lower.includes('habits')) {
        setCaption(
          '3 simple creator habits that helped me post 5x faster:\n1. Batch recording my talking points\n2. Reusing proven hooks\n3. Focusing on 1 key takeaway per post.\n\nWhich of these are you trying next?'
        );
        setCaptionTone('Helpful');
        setCaptionCta('Ask Question');
        setTags(['#CreatorTips', '#Habits', '#Consistency']);
      } else if (lower.includes('planning')) {
        setCaption(
          'My simple 3-step content planning routine that saves me 4+ hours every week:\n1. Brainstorm 5 pain points\n2. Outline in bullet points\n3. Schedule for peak engagement windows.\n\nSave this for your next planning session!'
        );
        setCaptionTone('Helpful');
        setCaptionCta('Save Post');
        setTags(['#ContentPlanning', '#CreatorWorkflow', '#GetSaves']);
      } else if (lower.includes('viral') || lower.includes('hook')) {
        setCaption(
          'Stop scrolling if you want to grow as a creator this month.\n\nThe #1 shift that changed my reach wasn’t the algorithm—it was hooking the viewer in the first 2 seconds.\n\nSave this framework for your next post!'
        );
        setCaptionTone('Viral');
        setCaptionCta('Save Post');
        setTags(['#ViralHooks', '#CreatorGrowth', '#ContentTips']);
      }
    }
  }, [ideaTitle]);

  // Idea picked on the Ideas page with a goal: write the caption for that goal
  // …or a finished caption + tags from the Caption writer
  useEffect(() => {
    if (!ideaGoal) return;
    if (ideaGoal.caption) {
      setCaption(ideaGoal.caption);
      if (ideaGoal.tags?.length) setTags(ideaGoal.tags);
      return;
    }
    if (!ideaGoal.goal || !ideaTitle) return;
    const g = getGoalCaption(ideaTitle, ideaGoal.goal, ideaGoal.hook);
    setCaption(g.caption);
    setCaptionTone(g.tone);
    setCaptionCta(g.cta);
  }, [ideaTitle, ideaGoal]);

  // Sync incoming Quest Draft from Jarvis
  useEffect(() => {
    if (questDraft) {
      if (questDraft.title) setCurrentIdea(questDraft.title);
      setCaption(
        `${questDraft.hook}\n\n${questDraft.story}\n\nKey lesson: ${questDraft.lesson}\n\n${questDraft.cta}`
      );
      setCaptionTone('Story');
      setCaptionCta('Ask Question');
      setSelectedFormat('short_video');
      setTags(['#Storytelling', '#CreatorJourney', '#LessonsLearned', '#PostStreak']);
    }
  }, [questDraft]);

  useEffect(() => {
    if (initialFormat) {
      setSelectedFormat(initialFormat);
    }
  }, [initialFormat]);

  useEffect(() => {
    if (initialPlatform) {
      setSelectedPlatforms([initialPlatform]);
    }
  }, [initialPlatform]);

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnim.start();
    return () => floatAnim.stop();
  }, [flameFloatY]);

  const triggerModalAnim = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      tension: 65,
      friction: 8,
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

  const togglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  // AI Prompt actions
  const handleAiAction = (type: 'rewrite' | 'shorter' | 'cta') => {
    if (aiEditsLeft <= 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsAiProcessing(true);
    setAiEditsLeft((prev) => Math.max(0, prev - 1));

    setTimeout(() => {
      setIsAiProcessing(false);
      if (type === 'rewrite') {
        setCaption(
          'Stop waiting for the "perfect idea" to post. The creators winning right now focus on volume + micro-lessons. Consistency always compounds.'
        );
      } else if (type === 'shorter') {
        setCaption(
          'Done > Perfect. Posting small lessons consistently built my entire creator momentum. Keep going.'
        );
      } else if (type === 'cta') {
        setCaption((prev) =>
          prev.includes('What is one lesson')
            ? prev
            : prev + '\n\n👇 What is one lesson you learned this week? Share below!'
        );
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 450);
  };

  // Intelligent, platform- and format-aware tag resolution
  const getIntelligentTagsForContext = (
    platforms: string[],
    format: ContentFormatType,
    text: string
  ): string[] => {
    const topicPool: string[] = [];

    // Platform-specific tags
    if (platforms.includes('tiktok')) {
      topicPool.push('#TikTokGrowth', '#CreatorTips');
    }
    if (platforms.includes('instagram')) {
      topicPool.push('#ContentCreation', '#CreatorsOfInstagram');
    }
    if (platforms.includes('youtube')) {
      topicPool.push('#Shorts', '#CreatorStrategy');
    }
    if (platforms.includes('pinterest')) {
      topicPool.push('#CreativeInspiration', '#VisualTips');
    }
    if (platforms.includes('threads')) {
      topicPool.push('#BuildInPublic', '#CreatorEconomy');
    }
    if (platforms.includes('facebook')) {
      topicPool.push('#CreatorCommunity');
    }

    // Format-specific tags
    if (format === 'carousel') {
      topicPool.push('#CarouselPost', '#SwipeFiles');
    } else if (format === 'short_video') {
      topicPool.push('#ReelsTips', '#ViralReels');
    } else if (format === 'text') {
      topicPool.push('#CreatorInsights', '#ThreadPost');
    } else if (format === 'long_video') {
      topicPool.push('#FullTutorial', '#DeepDive');
    }

    // Keyword detection from caption text
    const lower = text.toLowerCase();
    if (lower.includes('habit') || lower.includes('daily') || lower.includes('routine')) {
      topicPool.push('#DailyHabits');
    }
    if (lower.includes('consistency') || lower.includes('consistent')) {
      topicPool.push('#Consistency');
    }
    if (lower.includes('grow') || lower.includes('audience') || lower.includes('reach')) {
      topicPool.push('#AudienceGrowth');
    }
    if (lower.includes('start') || lower.includes('beginner') || lower.includes('lesson')) {
      topicPool.push('#CreatorJourney');
    }

    // Default core pool
    topicPool.push('#CreatorTips', '#ContentCreation', '#Consistency');

    const unique = Array.from(new Set(topicPool));
    return unique.slice(0, 4);
  };

  const handleGenerateTags = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const smartTags = getIntelligentTagsForContext(selectedPlatforms, selectedFormat, caption);
    setTags((prev) => Array.from(new Set([...prev, ...smartTags])));
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (newTagInput.trim()) {
      let formatted = newTagInput.trim();
      if (!formatted.startsWith('#')) formatted = '#' + formatted;
      setTags([...tags, formatted]);
      setNewTagInput('');
      setShowAddTagInput(false);
    }
  };

  const handleUploadMedia = (type: 'video' | 'image' | 'thumbnail') => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (type === 'thumbnail') {
      setHasThumbnail(true);
      if (!hasMedia) {
        setHasMedia(true);
        setMediaType('image');
      }
    } else {
      setHasMedia(true);
      setMediaType(type);
    }
  };

  // Real camera / camera roll (expo-image-picker)
  const [pickedMedia, setPickedMedia] = useState<PickedMedia | null>(null);
  const wantsVideo = selectedFormat === 'short_video' || selectedFormat === 'long_video';
  const acceptMedia = (m: PickedMedia | null) => {
    if (!m) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPickedMedia(m);
    setHasMedia(true);
    setMediaType(m.kind);
  };
  const addFromLibrary = async () => acceptMedia(await pickFromLibrary(wantsVideo ? 'video' : 'image'));
  const addFromCamera = async () => acceptMedia(await captureWithCamera(wantsVideo ? 'video' : 'image'));
  const clearMedia = () => {
    setPickedMedia(null);
    setHasMedia(false);
    setHasThumbnail(false);
  };

  const [composerToast, setComposerToast] = useState<string | null>(null);

  const showToastNotice = (msg: string) => {
    setComposerToast(msg);
    setTimeout(() => {
      setComposerToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handlePublishOrSchedule = () => {
    // 1. Allow saving draft anytime without restriction
    if (publishMode === 'draft') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCelebrationTitle('Draft Saved!');
      setCelebrationSubtitle('Your post draft with full media & tags is saved in your queue.');
      setCelebrationSpeech('Great work preparing ahead!');
      setShowCelebrationModal(true);
      return;
    }

    // 2. If attempting to Post Now or Schedule Post, verify 100% readiness
    if (!isAllReady) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      if (!isPlatformsReady) {
        showToastNotice('Select at least one platform before scheduling');
        navigateToSection('platforms');
      } else if (!isMediaReady) {
        showToastNotice('Add your media before scheduling');
        navigateToSection('media');
      } else if (!isCaptionReady) {
        showToastNotice('Add a post caption (minimum 10 characters)');
        navigateToSection('caption');
      } else if (!isFormatReady) {
        showToastNotice('Select a content format');
        navigateToSection('format');
      } else if (!isScheduleReady) {
        showToastNotice('Select a schedule time');
        navigateToSection('schedule');
      }
      return;
    }

    // 3. Post is 100% Ready
    if (publishMode === 'now' && isNativeFilm) {
      if (filmApp) openPlatformToFilm(filmApp);
      else showToastNotice('Pick TikTok, Instagram or YouTube to film there');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (publishMode === 'now') {
      setCelebrationTitle('Published Live!');
      setCelebrationSubtitle('Your content is live across your connected platforms.');
      setCelebrationSpeech('Streak preserved! Great consistency today.');
    } else if (publishMode === 'schedule' && isNativeFilm) {
      setCelebrationTitle('Reminder set!');
      setCelebrationSubtitle(`We'll nudge you at ${scheduledTime} with your hook, shots and caption ready.`);
      setCelebrationSpeech('Your plan is saved. Film it when the time comes.');
    } else if (publishMode === 'schedule') {
      setCelebrationTitle('Post Scheduled!');
      setCelebrationSubtitle(`Your post is locked in for ${scheduledTime}.`);
      setCelebrationSpeech('Day 1 post scheduled! +50 XP added to your creator level.');
    }
    setShowCelebrationModal(true);
  };

  // Content Format Resolution & Intelligence
  const getRecommendedFormatId = (platforms: string[]): ContentFormatType => {
    if (platforms.length === 1 && platforms[0] === 'threads') return 'text';
    if (platforms.length === 1 && platforms[0] === 'pinterest') return 'carousel';
    return 'short_video';
  };

  const recommendedFormatId = getRecommendedFormatId(selectedPlatforms);
  const currentFormatConfig =
    CONTENT_FORMATS.find((f) => f.id === selectedFormat) || CONTENT_FORMATS[0];
  const recommendedFormatConfig =
    CONTENT_FORMATS.find((f) => f.id === recommendedFormatId) || CONTENT_FORMATS[0];
  const otherFormats = CONTENT_FORMATS.filter((f) => f.id !== recommendedFormatId);

  // Platform-Aware Dynamic Media Subtitle
  const getDynamicMediaSub = (formatId: ContentFormatType, platforms: string[]): string => {
    const activePlats = ALL_AVAILABLE_PLATFORMS.filter((p) => platforms.includes(p.id));
    const platNames = activePlats.map((p) => p.shortName).join(' + ');

    switch (formatId) {
      case 'short_video':
        return platNames
          ? `9:16 vertical • Recommended 15–60s • Optimized for ${platNames}`
          : '9:16 vertical • Recommended 15–60s';
      case 'carousel':
        return platNames
          ? `Up to 30 slides • 4:5 or 1:1 • Optimized for ${platNames}`
          : 'Up to 30 slides • 4:5 or 1:1 recommended';
      case 'image':
        return platNames
          ? `High resolution • 4:5 portrait • Optimized for ${platNames}`
          : 'High resolution • 4:5 portrait or 9:16 vertical';
      case 'long_video':
        return platNames
          ? `16:9 landscape • HD/4K • Optimized for ${platNames}`
          : '16:9 landscape • HD/4K recommended';
      case 'text':
        return 'Direct text takeaway or insight thread';
      default:
        return 'Recommended format';
    }
  };

  const dynamicMediaSub = getDynamicMediaSub(selectedFormat, selectedPlatforms);

  // Incompatibility / Adaptation Warnings
  const incompatiblePlatforms = selectedPlatforms.filter(
    (platId) => !currentFormatConfig.supportedPlatformIds.includes(platId)
  );

  // Weighted Readiness Calculation (100% total)
  // Platforms: 25%, Media: 30%, Caption: 20%, Schedule: 15%, Content Format: 10%
  const isFormatReady = Boolean(selectedFormat);
  const isCaptionReady = caption.trim().length >= 10;
  const isPlatformsReady = selectedPlatforms.length > 0;
  const isNativeFilm = selectedFormat === 'short_video' && filmMethod === 'native';
  const isCameraFilm = selectedFormat === 'short_video' && filmMethod === 'camera';
  const isMediaReady = selectedFormat === 'text' || hasMedia || isNativeFilm;
  const isScheduleReady =
    publishMode === 'now' ||
    publishMode === 'draft' ||
    (publishMode === 'schedule' && Boolean(scheduledTime));

  const readinessPercent =
    (isFormatReady ? 10 : 0) +
    (isCaptionReady ? 20 : 0) +
    (isPlatformsReady ? 25 : 0) +
    (isMediaReady ? 30 : 0) +
    (isScheduleReady ? 15 : 0);

  const isAllReady = readinessPercent === 100;

  const navigateToSection = (section: 'format' | 'caption' | 'platforms' | 'media' | 'schedule') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Measure where the step is right now inside the scroll content
    // (sections above can change height after the page first lays out)
    const target = sectionRefs.current[section];
    const sv = mainScrollViewRef.current as
      | (ScrollView & { getInnerViewRef?: () => unknown; getInnerViewNode?: () => unknown })
      | null;
    const content = sv?.getInnerViewRef?.() ?? sv?.getInnerViewNode?.();
    if (target && sv && content) {
      target.measureLayout(
        content as never,
        (_x, y) => {
          const maxY = Math.max(0, contentH.current - viewportH.current);
          sv.scrollTo({ y: Math.min(maxY, Math.max(0, y - 12)), animated: true });
        },
        () => {},
      );
    }

    // No auto-focus on the caption: opening the keyboard scrolled the page a
    // second time right after landing, which looked like a bounce.
    if (section === 'schedule') {
      setTimeout(() => {
        setShowScheduleSheet(true);
      }, 350);
    }
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  // "Another" swaps the idea in place (same as the Create tab): the icon spins,
  // Jarvis "picks" for a beat, then the next idea slides in.
  const ideaPool = React.useMemo(() => {
    const starter = getStarterIdeas(
      userProfile?.niches?.length ? userProfile.niches : ['lifestyle'],
      userProfile?.connectedPlatforms?.length ? userProfile.connectedPlatforms : ['tiktok', 'instagram'],
    ).map((i) => i.title);
    return Array.from(new Set([...starter, ...SAMPLE_IDEAS]));
  }, [userProfile?.niches, userProfile?.connectedPlatforms]);
  const [ideaThinking, setIdeaThinking] = useState(false);

  // Short video: film in TikTok / Reels / Shorts (sounds + filters) or upload
  const [pendingHandoff, setPendingHandoff] = useState<HandoffPlatform | null>(null);
  const [showPostedCheck, setShowPostedCheck] = useState(false);
  const handoffPlatforms = selectedPlatforms.filter(isHandoffPlatform);
  // With several platforms picked, the creator chooses which app to film in
  // (the one whose sound they want); the same video can go to the others after.
  const [filmAppChoice, setFilmAppChoice] = useState<HandoffPlatform | null>(null);
  const filmApp: HandoffPlatform | undefined =
    filmAppChoice && handoffPlatforms.includes(filmAppChoice) ? filmAppChoice : handoffPlatforms[0];
  // Talking / dance / skit / text-on-screen, pre-picked from the creator's niche
  const [filmStyle, setFilmStyle] = useState<FilmStyle>(() => getDefaultFilmStyle(userProfile?.niches));
  const filmPlan = React.useMemo(() => getFilmPlan(currentIdea ?? '', filmStyle), [currentIdea, filmStyle]);
  const soundIdeas = React.useMemo(() => getSoundIdeas(filmStyle), [filmStyle]);
  const [overlayText, setOverlayText] = useState('');
  // Filming a dance / trend: the trend is the idea, so the idea card fades away
  const hideIdea = (isNativeFilm || isCameraFilm) && filmStyle === 'dance';

  // When the creator comes back after filming, ask if it went out
  useEffect(() => {
    if (!pendingHandoff) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setShowPostedCheck(true);
    });
    // Web: the platform opens in a new tab, so ask shortly after
    const t = Platform.OS === 'web' ? setTimeout(() => setShowPostedCheck(true), 1500) : null;
    return () => {
      sub.remove();
      if (t) clearTimeout(t);
    };
  }, [pendingHandoff]);

  const openPlatformToFilm = async (p: HandoffPlatform) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const text = [caption.trim(), tags.join(' ')].filter(Boolean).join('\n\n');
    showToastNotice(`Caption copied. Paste it in ${HANDOFF_NAMES[p]}.`);
    setPendingHandoff(p);
    await handOffToPlatform(p, text);
  };

  const confirmPosted = () => {
    setShowPostedCheck(false);
    setPendingHandoff(null);
    checkInToday(userProfile?.userPersona === 'returning' ? 'returning' : 'new');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCelebrationTitle('Nice work!');
    setCelebrationSubtitle(`Your ${pendingHandoff ? HANDOFF_NAMES[pendingHandoff] : ''} post counts toward today's check-in.`);
    setCelebrationSpeech('Posted is better than perfect.');
    setShowCelebrationModal(true);
  };
  const ideaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ideaSpin = useSharedValue(0);
  const ideaSpinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ideaSpin.value * 360}deg` }] }));
  useEffect(
    () => () => {
      if (ideaTimer.current) clearTimeout(ideaTimer.current);
    },
    [],
  );
  const shuffleIdea = () => {
    if (ideaThinking) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ideaSpin.value = withTiming(ideaSpin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
    setIdeaThinking(true);
    ideaTimer.current = setTimeout(() => {
      const i = ideaPool.indexOf(currentIdea ?? '');
      setCurrentIdea(ideaPool[(i + 1) % ideaPool.length]);
      setIdeaThinking(false);
    }, 550);
  };

  const saveDraft = () => {
    saveDraftToStore({
      id: `post-${currentIdea}`,
      title: currentIdea ?? 'Untitled post',
      kind: 'post',
      format: currentFormatConfig.title,
      platform: selectedPlatforms[0],
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCelebrationTitle('Draft saved!');
    setCelebrationSubtitle('Your draft with media and tags is saved. Pick it up any time.');
    setCelebrationSpeech('Nice work getting ahead!');
    setShowCelebrationModal(true);
  };
  const captionTones: ('Helpful' | 'Viral' | 'Story')[] = ['Helpful', 'Viral', 'Story'];
  const captionCtas: ('Ask Question' | 'Save Post' | 'Share Thoughts')[] = ['Ask Question', 'Save Post', 'Share Thoughts'];
  const stage1Platforms = ALL_AVAILABLE_PLATFORMS.filter((p) => (STAGE_1_PLATFORMS as readonly string[]).includes(p.id));
  const readinessSteps = [
    { key: 'platforms', label: 'Platforms', done: isPlatformsReady },
    { key: 'format', label: 'Format', done: isFormatReady },
    { key: 'media', label: isNativeFilm ? 'Film plan' : isCameraFilm ? 'Video' : 'Media', done: isMediaReady },
    { key: 'caption', label: 'Caption', done: isCaptionReady },
    { key: 'schedule', label: 'Timing', done: isScheduleReady },
  ];

  // Filter the display platforms: show only what the user selected. If none selected yet, show starter placeholders.
  const displayedPlatforms =
    selectedPlatforms.length > 0
      ? ALL_AVAILABLE_PLATFORMS.filter((p) => selectedPlatforms.includes(p.id))
      : ALL_AVAILABLE_PLATFORMS.filter((p) => ['tiktok', 'instagram'].includes(p.id));

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        <GlassBackdrop />
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenNotifications={() => {
            triggerModalAnim();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalAnim();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
          unreadCount={unreadNotifCount}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          ref={mainScrollViewRef}
          onScroll={(e) => (scrollY.current = e.nativeEvent.contentOffset.y)}
          onContentSizeChange={(_w, h) => (contentH.current = h)}
          onLayout={(e) => (viewportH.current = e.nativeEvent.layout.height)}
          scrollEventThrottle={32}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headlineWrap}>
            {questDraft && (
              <View style={styles.questChip}>
                <Text style={styles.questChipText}>{(questDraft.badgeLabel || 'Quest draft').replace(/^[^A-Za-z0-9]+/, '')}</Text>
              </View>
            )}
            <FitLines
              lines={['Shape your', <Text key="n" style={styles.headlineAccent}>next post</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Shape your next post"
            />
          </Reanimated.View>

          {/* IDEA (fades away when filming a dance / trend: the trend is the idea) */}
          {!hideIdea && (
            <Reanimated.View exiting={FadeOut.duration(200)} entering={FadeIn.duration(250)}>
              <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
                <GlassCard strong radius={26} padding={20}>
                  <View style={styles.ideaTop}>
                    <JarvisOrb size={26} />
                    <Text style={styles.ideaEyebrow}>YOUR IDEA</Text>
                    <Pressable
                      onPress={shuffleIdea}
                      hitSlop={8}
                      style={({ pressed }) => [styles.changeBtn, pressed && { transform: [{ scale: 0.92 }] }]}
                      accessibilityRole="button"
                      accessibilityLabel="Show me another idea"
                    >
                      <Reanimated.View style={ideaSpinStyle}>
                        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                          <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </Reanimated.View>
                      <Text style={styles.changeBtnText}>Another</Text>
                    </Pressable>
                  </View>
                  {ideaThinking ? (
                    <Reanimated.View entering={FadeIn.duration(120)} style={styles.ideaThinking}>
                      <ActivityIndicator color={ds.purple} />
                      <Text style={styles.ideaThinkingText}>Jarvis is picking…</Text>
                    </Reanimated.View>
                  ) : (
                    <Reanimated.View key={currentIdea} entering={FadeInUp.duration(300)} style={styles.ideaTitleWrap}>
                      <Text style={styles.ideaTitle}>“{currentIdea}”</Text>
                    </Reanimated.View>
                  )}
                  <Text style={styles.ideaBody}>Shape this idea into a post your audience will want to see.</Text>
                </GlassCard>
              </Reanimated.View>
            </Reanimated.View>
          )}

          {/* QUEST REQUIREMENTS (when started from a quest) */}
          {questDraft?.requirements && questDraft.requirements.length > 0 && (
            <View style={styles.questCard}>
              <GlassCard strong radius={22} padding={16}>
                <View style={styles.questHead}>
                  <Text style={styles.questHeadText}>Quest requirements</Text>
                  {questDraft.xpReward ? <Text style={styles.questXp}>+{questDraft.xpReward} XP</Text> : null}
                </View>
                {questDraft.requirements.map((req, idx) => (
                  <View key={idx} style={styles.questReq}>
                    <View style={styles.questReqDot} />
                    <Text style={styles.questReqText}>{req}</Text>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* 1. PLATFORMS */}
          <StepHeader
            n={1}
            title="Where it goes"
            done={isPlatformsReady}
            viewRef={(v) => (sectionRefs.current.platforms = v)}
          />
          <View style={styles.chipsWrap}>
            {stage1Platforms.map((plat) => (
              <PlatformChip
                key={plat.id}
                id={plat.id}
                name={plat.name}
                selected={selectedPlatforms.includes(plat.id)}
                onPress={() => togglePlatform(plat.id)}
              />
            ))}
          </View>
          <Text style={styles.note}>Free plans prepare posts for each platform. Auto-publishing is part of Pro.</Text>

          {/* 2. FORMAT */}
          <StepHeader
            n={2}
            title="Format"
            done={isFormatReady}
            viewRef={(v) => (sectionRefs.current.format = v)}
          />
          <RecommendedFormat
            id={recommendedFormatConfig.id}
            title={recommendedFormatConfig.title}
            badge={recommendedFormatConfig.badge}
            description={recommendedFormatConfig.recommendedDescription}
            selected={selectedFormat === recommendedFormatConfig.id}
            onPress={() => setSelectedFormat(recommendedFormatConfig.id)}
          />
          <View style={styles.tilesGrid}>
            {otherFormats.map((f) => (
              <FormatTile
                key={f.id}
                id={f.id}
                title={f.title}
                badge={f.badge}
                selected={selectedFormat === f.id}
                onPress={() => setSelectedFormat(f.id)}
              />
            ))}
          </View>
          {selectedFormat === 'short_video' && <FilmMethodPicker method={filmMethod} onChange={setFilmMethod} />}
          {incompatiblePlatforms.length > 0 && (
            <Text style={styles.note}>
              {incompatiblePlatforms.map((p) => ALL_AVAILABLE_PLATFORMS.find((x) => x.id === p)?.name).join(' & ')} will adapt your{' '}
              {currentFormatConfig.title.toLowerCase()} to fit its feed.
            </Text>
          )}

          {/* 3. MEDIA */}
          <StepHeader
            n={3}
            title={isNativeFilm || isCameraFilm ? 'Film it' : 'Media'}
            done={isMediaReady}
            viewRef={(v) => (sectionRefs.current.media = v)}
          />
          {isNativeFilm || isCameraFilm ? (
            <FilmPlanCard
              plan={filmPlan}
              sounds={soundIdeas}
              platforms={handoffPlatforms}
              onOpen={openPlatformToFilm}
              onStyleChange={setFilmStyle}
              mode={isCameraFilm ? 'camera' : 'native'}
              overlayText={overlayText}
              onOverlayChange={setOverlayText}
              recording={hasMedia && pickedMedia?.kind === 'video' ? { duration: pickedMedia.duration } : null}
              onRecord={addFromCamera}
              onRemoveRecording={clearMedia}
            />
          ) : (
          <MediaZone
            isText={selectedFormat === 'text'}
            hasMedia={hasMedia}
            hasThumbnail={hasThumbnail}
            label={currentFormatConfig.mediaLabel}
            sub={dynamicMediaSub}
            addLabel={currentFormatConfig.primaryMediaActionText}
            onAdd={addFromLibrary}
            onCamera={addFromCamera}
            cameraLabel={wantsVideo ? 'Record with camera' : 'Take a photo'}
            onThumbnail={() => setHasThumbnail(!hasThumbnail)}
            onRemove={clearMedia}
          />
          )}

          {/* 4. CAPTION */}
          <StepHeader
            n={4}
            title="Caption"
            done={isCaptionReady}
            right={<EditsMeter left={aiEditsLeft} total={3} />}
            viewRef={(v) => (sectionRefs.current.caption = v)}
          />
          <View style={[styles.captionCard, isCaptionFocused && styles.captionCardFocused]}>
            <TextInput
              ref={captionInputRef}
              style={styles.captionField}
              multiline
              value={caption}
              onChangeText={setCaption}
              onFocus={() => setIsCaptionFocused(true)}
              onBlur={() => setIsCaptionFocused(false)}
              placeholder="Write your caption…"
              placeholderTextColor={ds.text3}
              selectionColor={ds.purple}
              cursorColor={ds.purple}
            />
            {isAiProcessing && (
              <View style={styles.aiWorking}>
                <JarvisOrb size={22} />
                <Text style={styles.aiWorkingText}>Jarvis is rewriting…</Text>
              </View>
            )}
            <Text style={styles.charCount}>{caption.length} characters</Text>
            <View style={styles.captionMeta}>
              <CyclePill
                label="TONE"
                value={captionTone}
                onPress={() => setCaptionTone(captionTones[(captionTones.indexOf(captionTone) + 1) % captionTones.length])}
              />
              <CyclePill
                label="ENDS WITH"
                value={captionCta === 'Ask Question' ? 'Question' : captionCta === 'Save Post' ? 'Save' : 'Share'}
                onPress={() => setCaptionCta(captionCtas[(captionCtas.indexOf(captionCta) + 1) % captionCtas.length])}
              />
            </View>
            <View style={styles.aiRow}>
              <AiAction label="Rewrite" onPress={() => handleAiAction('rewrite')} disabled={isAiProcessing || aiEditsLeft === 0} />
              <AiAction label="Shorten" onPress={() => handleAiAction('shorter')} disabled={isAiProcessing || aiEditsLeft === 0} />
              <AiAction label="Ask viewers" onPress={() => handleAiAction('cta')} disabled={isAiProcessing || aiEditsLeft === 0} />
            </View>
          </View>
          <Text style={styles.note}>
            {ideaGoal?.caption
              ? 'From the Caption writer. Edit it here any time.'
              : ideaGoal?.goal
              ? `Written to ${IDEA_GOALS.find((g) => g.id === ideaGoal.goal)?.label.toLowerCase()}. Tone and ending are set for that.`
              : 'Tip: name the exact moment or mistake, and one thing people can try.'}
          </Text>

          {/* 5. TAGS */}
          <StepHeader n={5} title="Tags" done={tags.length > 0} />
          <GlassCard strong radius={22} padding={16}>
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <TagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} />
              ))}
              {tags.length === 0 && <Text style={styles.noTags}>No tags yet</Text>}
            </View>
            {showAddTagInput && (
              <View style={styles.addTagRow}>
                <TextInput
                  style={styles.addTagField}
                  placeholder="#yourtag"
                  placeholderTextColor={ds.text3}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddCustomTag}
                  autoFocus
                  autoCapitalize="none"
                />
                <Pressable onPress={handleAddCustomTag} style={styles.addTagBtn} accessibilityRole="button">
                  <Text style={styles.addTagBtnText}>Add</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.tagActions}>
              <View style={styles.flex1}>
                <AppButton title={showAddTagInput ? 'Cancel' : 'Add tag'} variant="outline" onPress={() => setShowAddTagInput(!showAddTagInput)} />
              </View>
              <View style={styles.flex1}>
                <AppButton title="Suggest" variant="quiet" onPress={handleGenerateTags} />
              </View>
            </View>
          </GlassCard>

          {/* 6. WHEN */}
          <StepHeader
            n={6}
            title="When to post"
            done={isScheduleReady}
            viewRef={(v) => (sectionRefs.current.schedule = v)}
          />
          <GlassCard strong radius={22} padding={16}>
            <ModeSwitch mode={publishMode} onChange={setPublishMode} labels={isNativeFilm ? { now: 'Film now', schedule: 'Remind me' } : undefined} />
            {publishMode === 'schedule' && (
              <Reanimated.View entering={FadeInUp.duration(250)}>
                <Pressable
                  onPress={() => {
                    setShowScheduleSheet(true);
                  }}
                  style={styles.whenRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Scheduled for ${scheduledTime}. Change`}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.1} />
                    <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" />
                  </Svg>
                  <View style={styles.flex1}>
                    <Text style={styles.whenLabel}>{isNativeFilm ? 'Remind me at' : 'Scheduled for'}</Text>
                    <Text style={styles.whenValue}>{scheduledTime}</Text>
                  </View>
                  <Text style={styles.whenChange}>Change</Text>
                </Pressable>
              </Reanimated.View>
            )}
            <View style={styles.jarvisTime}>
              <JarvisOrb size={22} />
              <Text style={styles.jarvisTimeText}>
                Jarvis suggests <Text style={styles.jarvisTimeBold}>7:30 PM</Text>, when your audience is usually around.
              </Text>
            </View>
          </GlassCard>

          {/* READINESS + ACTIONS */}
          <View style={styles.readyWrap}>
            <ReadinessCard percent={readinessPercent} steps={readinessSteps} onStep={(k) => navigateToSection(k as 'format' | 'caption' | 'platforms' | 'media' | 'schedule')} />
          </View>
          <View style={styles.actions}>
            {isNativeFilm && publishMode === 'now' && handoffPlatforms.length > 1 && filmApp && (
              <Reanimated.View entering={FadeIn.duration(200)}>
                <Text style={styles.filmInLabel}>Film in</Text>
                <View style={styles.filmInRow}>
                  {handoffPlatforms.map((p) => {
                    const on = p === filmApp;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.selectionAsync();
                          setFilmAppChoice(p);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`Film in ${HANDOFF_NAMES[p]}`}
                        style={[styles.filmInChip, on && styles.filmInChipOn]}
                      >
                        <PlatformLogo type={p} size={22} />
                        <Text style={[styles.filmInText, on && { color: ds.purple }]} numberOfLines={1}>
                          {HANDOFF_NAMES[p]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.filmInNote}>
                  Film once where you want the sound, then share the same video to{' '}
                  {handoffPlatforms
                    .filter((p) => p !== filmApp)
                    .map((p) => HANDOFF_NAMES[p])
                    .join(' and ')}
                  .
                </Text>
              </Reanimated.View>
            )}
            <AppButton
              title={
                publishMode === 'draft'
                  ? 'Save draft'
                  : isNativeFilm
                  ? publishMode === 'now'
                    ? `Film in ${filmApp ? HANDOFF_NAMES[filmApp] : 'the app'}`
                    : 'Set reminder'
                  : publishMode === 'now'
                  ? 'Post now'
                  : 'Schedule post'
              }
              size="lg"
              onPress={handlePublishOrSchedule}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
            {publishMode !== 'draft' && (
              <View style={styles.secondaryAction}>
                <AppButton title="Save as draft" variant="glass" onPress={saveDraft} />
              </View>
            )}
          </View>

        </ScrollView>

        {composerToast && <ComposerToast message={composerToast} />}

        {showPostedCheck && pendingHandoff && (
          <PostedCheck
            platform={pendingHandoff}
            onYes={confirmPosted}
            onNotYet={() => {
              setShowPostedCheck(false);
              setPendingHandoff(null);
              showToastNotice(`No rush. It's saved here when you're ready.`);
            }}
          />
        )}

        {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* MODAL 0: CHOOSE MORE SOCIAL PLATFORMS */}
        <Modal
          visible={showPlatformsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPlatformsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Choose Social Platforms</Text>
                  <Text style={styles.modalSubtitle}>Choose where your post will be published</Text>
                </View>
                <Pressable onPress={() => setShowPlatformsModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: 285 }}
                contentContainerStyle={{ paddingBottom: 6 }}
                showsVerticalScrollIndicator={true}
              >
                {ALL_AVAILABLE_PLATFORMS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);
                  return (
                    <Pressable
                      key={plat.id}
                      onPress={() => togglePlatform(plat.id)}
                      style={[
                        styles.platformModalRow,
                        isSelected && styles.platformModalRowActive,
                      ]}
                    >
                      <PlatformIcon iconType={plat.iconType} size={36} />

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.modalPlatformName}>{plat.name}</Text>
                          <View style={styles.modalMultiplierPill}>
                            <Text style={styles.modalMultiplierText}>{plat.multiplier}</Text>
                          </View>
                        </View>
                        <Text style={styles.modalPlatformFormat}>{plat.format}</Text>
                      </View>

                      <View style={[styles.modalCheckbox, isSelected && styles.modalCheckboxActive]}>
                        {isSelected && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                disabled={selectedPlatforms.length === 0}
                style={[
                  styles.modalPrimaryActionBtn,
                  selectedPlatforms.length === 0 && styles.modalPrimaryActionBtnDisabled,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setShowPlatformsModal(false);
                }}
              >
                {selectedPlatforms.length > 0 ? (
                  <LinearGradient
                    colors={['#7C3AED', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryActionText}>
                      Apply Channels ({selectedPlatforms.length} Selected) ✓
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.modalPrimaryDisabledContainer}>
                    <Text style={styles.modalPrimaryDisabledText}>
                      Select at least 1 channel
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 1: CHANGE IDEA */}
        <Modal
          visible={showChangeIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChangeIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Choose Post Idea</Text>
                  <Text style={styles.modalSubtitle}>Choose an idea from your vault or start with a quick prompt.</Text>
                </View>
                <Pressable onPress={() => setShowChangeIdeaModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {SAMPLE_IDEAS.map((idea, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setCurrentIdea(idea);
                      setShowChangeIdeaModal(false);
                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                    }}
                    style={[
                      styles.ideaChoiceItem,
                      currentIdea === idea && styles.ideaChoiceItemActive,
                    ]}
                  >
                    <Text style={[styles.ideaChoiceText, currentIdea === idea && styles.ideaChoiceTextActive]}>
                      &ldquo;{idea}&rdquo;
                    </Text>
                    {currentIdea === idea && (
                      <View style={styles.ideaChoiceCheckmark}>
                        <Text style={styles.ideaChoiceCheckmarkText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* WHEN TO POST: Jarvis's best times + any day / time in the next two weeks */}
        <ScheduleSheet
          visible={showScheduleSheet}
          onClose={() => setShowScheduleSheet(false)}
          mode={isNativeFilm ? 'remind' : 'schedule'}
          onConfirm={(label) => {
            setScheduledTime(label);
            setPublishMode('schedule');
            setShowScheduleSheet(false);
            showToastNotice(`${isNativeFilm ? 'Reminder set for' : 'Scheduled for'} ${label}`);
          }}
        />

        {/* MODAL 3: NOTIFICATIONS CENTER */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Streak updates &amp; creator alerts</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
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

        {/* MODAL 4: CREATOR PROFILE PASSPORT */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText="POST READY"
          xpEarned={50}
          streakCount={userProfile?.streakCount || 1}
          actionText="Keep Editing ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  flex1: { flex: 1 },
  headlineWrap: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  questChip: { alignSelf: 'flex-start', paddingHorizontal: 10, height: 24, justifyContent: 'center', borderRadius: 999, backgroundColor: ds.lavender, marginBottom: 10 },
  questChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: ds.purple },
  ideaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ideaEyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  changeBtnText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  ideaTitleWrap: { minHeight: 68, justifyContent: 'center' },
  ideaTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: ds.ink, letterSpacing: -0.5, marginTop: 12 },
  ideaThinking: { minHeight: 68, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ideaThinkingText: { fontSize: 13, fontWeight: '700', color: ds.text3 },
  ideaBody: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 6 },
  questCard: { marginTop: 12 },
  questHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  questHeadText: { fontSize: 15, fontWeight: '800', color: ds.ink },
  questXp: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  questReq: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  questReqDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.purple },
  questReqText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  note: { fontSize: 12.5, lineHeight: 18, color: ds.text3, marginTop: 10 },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  captionCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
  },
  captionCardFocused: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  captionField: {
    minHeight: 120,
    maxHeight: 220,
    fontSize: 15.5,
    lineHeight: 23,
    color: ds.ink,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  aiWorking: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  aiWorkingText: { fontSize: 12.5, fontWeight: '700', color: ds.purple },
  captionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(23, 20, 32, 0.1)' },
  charCount: { alignSelf: 'flex-end', fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 6 },
  aiRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tagsWrap: { gap: 8 },
  noTags: { fontSize: 13, color: ds.text3 },
  addTagRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addTagField: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: ds.ink,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  addTagBtn: { height: 42, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple },
  addTagBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  tagActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(237, 233, 254, 0.6)',
  },
  whenLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3, letterSpacing: 0.4 },
  whenValue: { fontSize: 16, fontWeight: '800', color: ds.ink, marginTop: 1 },
  whenChange: { fontSize: 13, fontWeight: '800', color: ds.purple },
  jarvisTime: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  jarvisTimeText: { flex: 1, fontSize: 13, lineHeight: 18, color: ds.text2 },
  jarvisTimeBold: { fontWeight: '800', color: ds.ink },
  readyWrap: { marginTop: 26 },
  actions: { marginTop: 16, gap: 10 },
  filmInLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginBottom: 8 },
  filmInRow: { flexDirection: 'row', gap: 8 },
  // Logo above name so three platforms fit side by side on 320
  filmInChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  filmInChipOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  filmInText: { fontSize: 12, fontWeight: '800', color: ds.ink },
  filmInNote: { fontSize: 12.5, lineHeight: 18, color: ds.text3, marginTop: 8, marginBottom: 4 },
  secondaryAction: {},
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    // Clears the floating tab bar, no extra gap
    paddingBottom: 120,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLogoWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 40,
    height: 40,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // Badges & Titles
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  createPostPill: {
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderRadius: 100,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  createPostPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  draftPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  draftPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.4,
  },
  questDraftBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  questDraftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B21A8',
    letterSpacing: 0.4,
  },
  mainTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 4,
    marginTop: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // 1. Post Idea Card
  postIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  postIdeaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postIdeaSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  changeIdeaLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  postIdeaTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 22,
    marginBottom: 6,
  },
  postIdeaDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  ideaTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
  },
  ideaTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  ideaTagPillText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#582CDB',
  },

  // Attached Pro Quest Requirements Card
  attachedQuestRequirementsCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 14,
    marginBottom: 18,
  },
  attachedQuestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachedQuestHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B21A8',
    letterSpacing: 0.5,
  },
  attachedQuestXpBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  attachedQuestXpText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  attachedQuestRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  attachedQuestCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedQuestCheckMark: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  attachedQuestRequirementText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3B0764',
    flex: 1,
  },

  streakSaverPill: {
    backgroundColor: '#582CDB',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  streakSaverPillText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Section Labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  morePlatformsHeaderBtn: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  morePlatformsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 10,
  },
  morePlatformsHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 2. Platforms
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformCard: {
    width: '48%',
    minHeight: 116,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  platformCardSingle: {
    width: '100%',
    minHeight: 68,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  platformCardNameSingle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  platformCardFormatSingle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  platformCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF8FE',
  },
  officialIconContainer: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  gradientFillContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
    textAlign: 'center',
  },
  platformActiveBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformInactiveBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  platformsDisclaimer: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 18,
  },

  sectionHelperText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // 3. Content Format Selection Styles
  formatRecommendedSection: {
    marginBottom: 14,
  },
  otherFormatsSection: {
    marginBottom: 6,
  },
  formatGroupHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8E85A2',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  formatRecommendedCard: {
    width: '100%',
    minHeight: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formatRecommendedCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF8FE',
  },
  formatBestFitPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  formatBestFitPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formatCard: {
    width: '48%',
    minHeight: 116,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formatCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF8FE',
  },
  formatCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatIconBoxActive: {
    backgroundColor: '#EDE9FE',
  },
  formatCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  formatCardTitleActive: {
    color: '#582CDB',
  },
  formatRatioTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  formatCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  formatCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  formatCheckCircleActive: {
    borderColor: '#582CDB',
    backgroundColor: '#582CDB',
  },
  formatIncompatibleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    marginBottom: 16,
  },
  formatIncompatibleText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
    flex: 1,
  },
  textFirstFormatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  textFirstIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textFirstTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  textFirstSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  textFirstAddMediaBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textFirstAddMediaBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 4. Media Upload Zone
  mediaUploadBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  mediaDashedDropzone: {
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#FAF8FC',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mediaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaDropzoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  mediaDropzoneSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  // Attached Media Preview Styles
  mediaAttachedContainer: {
    backgroundColor: '#FAF8FC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
  },
  mediaAttachedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaAttachedThumbBox: {
    width: 52,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#1E1435',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mediaThumbDurationTag: {
    position: 'absolute',
    bottom: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  mediaThumbDurationText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mediaAttachedStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  mediaAttachedStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  mediaAttachedSizeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  mediaAttachedFileName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  mediaAttachedSpecsText: {
    fontSize: 11,
    color: '#64748B',
  },
  mediaAttachedActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    paddingTop: 10,
  },
  mediaSubActionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  mediaSubActionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  mediaSubActionRemoveBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mediaSubActionRemoveText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#EF4444',
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 4. Caption Writing
  aiBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  captionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  captionContainerFocused: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF9FE',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  captionInput: {
    minHeight: 110,
    fontSize: 14.5,
    color: '#1E293B',
    lineHeight: 22,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 12,
  },
  captionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 12,
  },
  captionMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
    minWidth: 160,
  },
  tonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  toneLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  toneDivider: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  toneValue: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
  },
  charCountText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    flexShrink: 0,
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiPillBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // 5. Tags
  platformTagsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  platformMiniTagPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  platformMiniTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tagsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  tagsContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tagsContextSparkle: {
    fontSize: 12,
  },
  tagsContextText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  tagsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  tagPillCross: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '700',
    marginTop: -1,
  },
  addTagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addTagInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#1E293B',
  },
  addTagConfirmBtn: {
    height: 38,
    paddingHorizontal: 16,
    backgroundColor: '#582CDB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagConfirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tagActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagActionCustomBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  tagActionCustomBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  tagActionGenerateBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  tagActionGenerateGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  tagActionGenerateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 6. Timing & Scheduling
  timingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  timingHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timingSuggestedLightbulb: {
    fontSize: 18,
  },
  timingSuggestedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  timingSuggestedSub: {
    fontSize: 12,
    color: '#64748B',
  },
  timingTabsRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  timingTabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timingTabBtnActive: {
    backgroundColor: '#582CDB',
  },
  timingTabBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  timingTabBtnTextActive: {
    color: '#FFFFFF',
  },
  scheduledInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
  },
  scheduledLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scheduledValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  scheduledChangeLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
  },

  // 7. Post Readiness
  readinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  readinessCardComplete: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    shadowColor: '#059669',
  },
  readinessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  readinessTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  readinessReadyBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#A7F3D0',
  },
  readinessReadyBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  readinessPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#582CDB',
  },
  readinessPercentComplete: {
    color: '#059669',
  },
  readinessProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  readinessProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistContainer: {
    gap: 8,
  },
  checklistRowInteractive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  checkIconFilled: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkWhite: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  checkIconEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  checklistTextContainer: {
    flex: 1,
  },
  checklistText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  checklistTextIncomplete: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  checklistNavChevron: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 4,
  },

  // 8. Streak Banner
  streakBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  streakBannerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBannerTitle: {
    fontSize: 12.5,
    color: '#B45309',
    lineHeight: 17,
    marginBottom: 6,
  },
  streakBannerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakXpPill: {
    backgroundColor: '#FDE68A',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  streakXpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  streakMissionFraction: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },

  // 9. Jarvis Writing Insight (Elevated Harmonious Studio Card)
  jarvisWritingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8E1F7',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  jarvisWritingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
    marginBottom: 12,
  },
  jarvisWritingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  jarvisWritingFlameIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  jarvisWritingFlame: {
    width: 17,
    height: 17,
  },
  jarvisInsightBadge: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    flexShrink: 0,
  },
  jarvisInsightTag: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  jarvisScorePill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexShrink: 0,
  },
  jarvisScoreText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  jarvisWritingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  jarvisWritingBody: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  jarvisChip: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  jarvisChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
  improveWithJarvisBtn: {
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  improveWithJarvisGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  improveWithJarvisBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Composer Toast Notice
  composerToastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  composerToastIcon: {
    fontSize: 15,
  },
  composerToastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },

  // 10. Bottom Action Row
  composerActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  primaryComposerBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryComposerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryComposerBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryComposerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryComposerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  modalTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  modalCloseCross: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 14,
    textAlign: 'center',
  },

  // Platform Modal Rows
  platformModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 8,
  },
  platformModalRowActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#7C3AED',
  },
  modalPlatformName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  modalMultiplierPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  modalMultiplierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  modalPlatformFormat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCheckboxActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  modalPrimaryActionBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  modalPrimaryActionBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryDisabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  modalPrimaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalPrimaryDisabledText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // SMART SCHEDULE SLOTS STYLES
  smartScheduleGroup: {
    marginBottom: 14,
  },
  smartScheduleGroupHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8E85A2',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  smartSlotRow: {
    gap: 8,
  },
  smartSlotCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#EFEBF8',
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smartSlotCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF5FF',
  },
  smartSlotCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  smartSlotTimeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  smartSlotTimeTextActive: {
    color: '#582CDB',
  },
  smartSlotRecBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  smartSlotRecBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  smartSlotRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  smartSlotRadioCircleActive: {
    borderColor: '#582CDB',
    backgroundColor: '#582CDB',
  },
  chooseCustomDateBtn: {
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chooseCustomDateBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  backToSmartSlotsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  backToSmartSlotsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // CALENDAR MODAL STYLES
  calMonthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  calMonthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  calMonthNavTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },
  calMonthNavBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  calWeekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  calWeekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calDayCell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  calDayCellSelected: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  calDayNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  calDayNumTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calDayNumTextToday: {
    color: '#582CDB',
    fontWeight: '700',
  },
  calTodayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#582CDB',
  },
  calPeakDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  calSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  calTimeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  calTimeSlotCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  calTimeSlotCardActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#582CDB',
  },
  calTimeSlotTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  calTimeSlotTimeActive: {
    color: '#582CDB',
  },
  calTimeSlotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  calTimeSlotLabelActive: {
    color: '#7C3AED',
  },
  calPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 4,
  },
  calPreviewIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calPreviewTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  calPreviewSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },

  ideaChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  ideaChoiceItemActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#582CDB',
  },
  ideaChoiceText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 18,
  },
  ideaChoiceTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  ideaChoiceCheckmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  ideaChoiceCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  notifCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F2EC',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileModalCardInner: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  profileModalIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  },
  profileModalNiche: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  profileModalLevelPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  profileModalLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },
  chatSpeaker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chatMsg: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 18,
  },
});
