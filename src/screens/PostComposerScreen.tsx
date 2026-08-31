import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  TextInput,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';

interface PostComposerScreenProps {
  ideaTitle?: string;
  initialPlatform?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
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
    body: "Convert today's idea into a post to keep your 1-day streak.",
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const TIME_SLOTS = [
  { id: 't1', time: '7:30 PM', label: '⚡ Peak Reach', peak: true },
  { id: 't2', time: '9:00 AM', label: 'Morning Wave', peak: false },
  { id: 't3', time: '12:30 PM', label: 'Lunch Break', peak: false },
  { id: 't4', time: '6:00 PM', label: 'Evening Prime', peak: false },
  { id: 't5', time: '8:30 PM', label: 'Night Spike', peak: false },
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
  initialPlatform = '',
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onNavigateTab,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [currentIdea, setCurrentIdea] = useState(ideaTitle);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialPlatform ? [initialPlatform] : []
  );

  // Content Format State (Intelligent Content Type)
  const [selectedFormat, setSelectedFormat] = useState<ContentFormatType>('short_video');

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

  // Calendar State
  const [calMonthIndex, setCalMonthIndex] = useState(7); // August (0-indexed)
  const [calYear, setCalYear] = useState(2026);
  const [selectedCalDay, setSelectedCalDay] = useState(18); // Today = 18th
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('7:30 PM');

  // Modals
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [showChangeIdeaModal, setShowChangeIdeaModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Post Scheduled!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your post has been scheduled for Today at 7:30 PM.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('1-day streak protected! +50 XP added to your creator level.');

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;

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

  const handlePublishOrSchedule = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (publishMode === 'now') {
      setCelebrationTitle('Published Live!');
      setCelebrationSubtitle('Your content is live across your connected platforms.');
      setCelebrationSpeech('Streak preserved! Great consistency today.');
    } else if (publishMode === 'schedule') {
      setCelebrationTitle('Post Scheduled!');
      setCelebrationSubtitle(`Your post is locked in for ${scheduledTime}.`);
      setCelebrationSpeech('1-day streak protected! +50 XP added to your creator level.');
    } else {
      setCelebrationTitle('Draft Saved!');
      setCelebrationSubtitle('Your post draft with full media & tags is saved in your queue.');
      setCelebrationSpeech('Great work preparing ahead!');
    }
    setShowCelebrationModal(true);
  };

  // Calendar calculations
  const daysInMonth = new Date(calYear, calMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonthIndex, 1).getDay() + 6) % 7; // Monday-first
  
  const handlePrevMonth = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (calMonthIndex === 0) {
      setCalMonthIndex(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (calMonthIndex === 11) {
      setCalMonthIndex(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonthIndex((m) => m + 1);
    }
  };

  const handleConfirmCalendarSchedule = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const isToday = selectedCalDay === 18 && calMonthIndex === 7 && calYear === 2026;
    const isTomorrow = selectedCalDay === 19 && calMonthIndex === 7 && calYear === 2026;
    
    let formattedStr = '';
    if (isToday) {
      formattedStr = `Today, ${selectedTimeSlot}`;
    } else if (isTomorrow) {
      formattedStr = `Tomorrow, ${selectedTimeSlot}`;
    } else {
      const monthShort = MONTH_NAMES[calMonthIndex].substring(0, 3);
      formattedStr = `${monthShort} ${selectedCalDay}, ${selectedTimeSlot}`;
    }

    setScheduledTime(formattedStr);
    setPublishMode('schedule');
    setShowCalendarModal(false);

    // Trigger celebration animation popup
    setCelebrationTitle('Post Scheduled!');
    setCelebrationSubtitle(`Your post has been locked in for ${formattedStr}.`);
    setCelebrationSpeech('1-day streak protected! +50 XP added to your creator level.');
    setTimeout(() => {
      setShowCelebrationModal(true);
    }, 250);
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

  // Readiness Calculation
  const hasMediaOrTextOnly = selectedFormat === 'text' || hasMedia;
  const readinessPercent = 50 + (selectedPlatforms.length > 0 ? 25 : 0) + (hasMediaOrTextOnly ? 25 : 0);

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  // Filter the display platforms: show only what the user selected. If none selected yet, show starter placeholders.
  const displayedPlatforms =
    selectedPlatforms.length > 0
      ? ALL_AVAILABLE_PLATFORMS.filter((p) => selectedPlatforms.includes(p.id))
      : ALL_AVAILABLE_PLATFORMS.filter((p) => ['tiktok', 'instagram'].includes(p.id));

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
              triggerModalAnim();
              setShowChatModal(true);
            }
          }}
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Top Pill Badges (Gold Gradient & Draft) */}
          <View style={styles.topBadgesRow}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createPostPill}
            >
              <Text style={styles.createPostPillText}>CREATE POST</Text>
            </LinearGradient>

            <View style={styles.draftPill}>
              <Text style={styles.draftPillText}>DRAFT</Text>
            </View>
          </View>

          {/* Main Headline & Subtitle */}
          <Text style={styles.mainTitle}>Shape your next post.</Text>
          <Text style={styles.mainSubtitle}>
            Write your caption, choose platforms, add media, and schedule.
          </Text>

          {/* 1. POST IDEA CARD */}
          <View style={styles.postIdeaCard}>
            <View style={styles.postIdeaHeaderRow}>
              <Text style={styles.postIdeaSectionTitle}>Post Idea</Text>
              <Pressable
                onPress={() => {
                  triggerModalAnim();
                  setShowChangeIdeaModal(true);
                }}
                hitSlop={8}
              >
                <Text style={styles.changeIdeaLink}>CHANGE IDEA</Text>
              </Pressable>
            </View>

            <Text style={styles.postIdeaTitle}>&ldquo;{currentIdea}&rdquo;</Text>
            <Text style={styles.postIdeaDesc}>
              Shape this idea into a post your audience will want to see.
            </Text>

            <View style={styles.ideaTagsRow}>
              <View style={styles.ideaTagPill}>
                <Text style={styles.ideaTagPillText}>Personal Lesson</Text>
              </View>
              <View style={styles.ideaTagPill}>
                <Text style={styles.ideaTagPillText}>Creator Advice</Text>
              </View>
              <View style={styles.ideaTagPill}>
                <Text style={styles.ideaTagPillText}>Consistency</Text>
              </View>
            </View>
          </View>

          {/* 2. CHOOSE PLATFORMS WITH MORE PLATFORMS TRIGGER */}
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>CHOOSE PLATFORMS</Text>
            <Pressable
              style={({ pressed }) => [styles.morePlatformsHeaderBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalAnim();
                setShowPlatformsModal(true);
              }}
              hitSlop={8}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.morePlatformsHeaderGradient}
              >
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
                </Svg>
                <Text style={styles.morePlatformsHeaderText}>More Platforms</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Clean Platforms Row / Grid */}
          <View style={styles.platformsRow}>
            {displayedPlatforms.map((plat) => {
              const isSelected = selectedPlatforms.includes(plat.id);
              const isSingle = displayedPlatforms.length === 1;

              if (isSingle) {
                return (
                  <Pressable
                    key={plat.id}
                    style={[
                      styles.platformCardSingle,
                      isSelected && styles.platformCardActive,
                    ]}
                    onPress={() => togglePlatform(plat.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <PlatformIcon iconType={plat.iconType} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.platformCardNameSingle}>{plat.name}</Text>
                        <Text style={styles.platformCardFormatSingle}>{plat.format}</Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={styles.platformActiveBadge}>
                        <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.platformInactiveBadge} />
                    )}
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={plat.id}
                  style={[
                    styles.platformCard,
                    isSelected && styles.platformCardActive,
                  ]}
                  onPress={() => togglePlatform(plat.id)}
                >
                  <PlatformIcon iconType={plat.iconType} size={38} />
                  <Text style={styles.platformCardName} numberOfLines={1}>{plat.name}</Text>
                  {isSelected ? (
                    <View style={styles.platformActiveBadge}>
                      <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                    </View>
                  ) : (
                    <View style={styles.platformInactiveBadge} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.platformsDisclaimer}>
            Free users can prepare posts for selected platforms. Auto-publishing may require <Text style={{ color: '#D97706', fontWeight: '800' }}>Pro</Text>.
          </Text>

          {/* 3. CONTENT FORMAT (RECOMMENDED + OTHER FORMATS) */}
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>CONTENT FORMAT</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>SMART RECOMMENDATION</Text>
            </View>
          </View>

          {/* 1. Recommended Format Spotlight */}
          <View style={styles.formatRecommendedSection}>
            <Text style={styles.formatGroupHeaderLabel}>RECOMMENDED</Text>
            <Pressable
              style={[
                styles.formatRecommendedCard,
                selectedFormat === recommendedFormatConfig.id && styles.formatRecommendedCardActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                setSelectedFormat(recommendedFormatConfig.id);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={[
                    styles.formatIconBox,
                    selectedFormat === recommendedFormatConfig.id && styles.formatIconBoxActive,
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{recommendedFormatConfig.icon}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text
                      style={[
                        styles.formatCardTitle,
                        selectedFormat === recommendedFormatConfig.id && styles.formatCardTitleActive,
                      ]}
                    >
                      {recommendedFormatConfig.title}
                    </Text>
                    <View style={styles.formatBestFitPill}>
                      <Text style={styles.formatBestFitPillText}>★ Best Fit</Text>
                    </View>
                  </View>
                  <Text style={styles.formatRatioTag}>{recommendedFormatConfig.badge}</Text>
                  <Text style={styles.formatCardDesc}>{recommendedFormatConfig.recommendedDescription}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.formatCheckCircle,
                  selectedFormat === recommendedFormatConfig.id && styles.formatCheckCircleActive,
                ]}
              >
                {selectedFormat === recommendedFormatConfig.id && (
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>✓</Text>
                )}
              </View>
            </Pressable>
          </View>

          {/* 2. Other Formats Section (2x2 Grid) */}
          <View style={styles.otherFormatsSection}>
            <Text style={styles.formatGroupHeaderLabel}>OTHER FORMATS</Text>
            <View style={styles.formatsGrid}>
              {otherFormats.map((fmt) => {
                const isFmtSelected = selectedFormat === fmt.id;

                return (
                  <Pressable
                    key={fmt.id}
                    style={[
                      styles.formatCard,
                      isFmtSelected && styles.formatCardActive,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setSelectedFormat(fmt.id);
                    }}
                  >
                    <View style={styles.formatCardTop}>
                      <View style={[styles.formatIconBox, isFmtSelected && styles.formatIconBoxActive]}>
                        <Text style={{ fontSize: 18 }}>{fmt.icon}</Text>
                      </View>
                      <View style={[styles.formatCheckCircle, isFmtSelected && styles.formatCheckCircleActive]}>
                        {isFmtSelected && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                      </View>
                    </View>

                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.formatCardTitle, isFmtSelected && styles.formatCardTitleActive]}>
                        {fmt.title}
                      </Text>
                      <Text style={styles.formatRatioTag}>{fmt.badge}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Smart Compatibility Adaption Note */}
          {incompatiblePlatforms.length > 0 && (
            <View style={styles.formatIncompatibleNotice}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#D97706" strokeWidth="2" />
                <Path d="M12 8v4M12 16h.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.formatIncompatibleText}>
                {incompatiblePlatforms
                  .map((p) => ALL_AVAILABLE_PLATFORMS.find((x) => x.id === p)?.name)
                  .join(' & ')}{' '}
                will adapt your {currentFormatConfig.title.toLowerCase()} for optimal feed display.
              </Text>
            </View>
          )}

          {/* 4. MEDIA / ATTACHMENT ZONE (CONTEXTUAL TO SELECTED FORMAT) */}
          <Text style={styles.sectionLabel}>MEDIA</Text>
          <View style={styles.mediaUploadBox}>
            {selectedFormat === 'text' && !hasMedia ? (
              /* Text Post Active (No mandatory media required) */
              <View style={styles.textFirstFormatBanner}>
                <View style={styles.textFirstIconCircle}>
                  <Text style={{ fontSize: 20 }}>✍️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.textFirstTitle}>Text-First Format Active</Text>
                  <Text style={styles.textFirstSubtitle}>
                    No media upload is required for text takes & insights. Write your post below!
                  </Text>
                </View>
                <Pressable
                  style={styles.textFirstAddMediaBtn}
                  onPress={() => handleUploadMedia('image')}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 5v14M5 12h14" stroke="#582CDB" strokeWidth="2.5" strokeLinecap="round" />
                  </Svg>
                  <Text style={styles.textFirstAddMediaBtnText}>Add Visual</Text>
                </Pressable>
              </View>
            ) : hasMedia ? (
              /* Attached Media Preview Box */
              <View style={styles.mediaAttachedContainer}>
                <View style={styles.mediaAttachedHeaderRow}>
                  {/* Thumbnail / Video Icon Box */}
                  <View style={styles.mediaAttachedThumbBox}>
                    {selectedFormat === 'carousel' ? (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Rect x="4" y="4" width="16" height="16" rx="3" stroke="#FFFFFF" strokeWidth="2" />
                        <Path d="M9 4v16" stroke="#FFFFFF" strokeWidth="2" />
                      </Svg>
                    ) : selectedFormat === 'image' ? (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#FFFFFF" strokeWidth="2" />
                        <Circle cx="8.5" cy="8.5" r="1.5" fill="#FFFFFF" />
                        <Path d="M21 15l-5-5L5 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      </Svg>
                    ) : (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
                      </Svg>
                    )}
                    <View style={styles.mediaThumbDurationTag}>
                      <Text style={styles.mediaThumbDurationText}>
                        {selectedFormat === 'carousel' ? '5 Slides' : selectedFormat === 'image' ? '1 Visual' : '0:30'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <View style={styles.mediaAttachedStatusBadge}>
                        <Text style={styles.mediaAttachedStatusText}>✓ ATTACHED</Text>
                      </View>
                      <Text style={styles.mediaAttachedSizeText}>
                        {selectedFormat === 'carousel' ? '12.8 MB (5 slides)' : '24.5 MB'}
                      </Text>
                    </View>
                    <Text style={styles.mediaAttachedFileName} numberOfLines={1}>
                      {selectedFormat === 'carousel'
                        ? 'Swipe_Carousel_Deck_V1'
                        : selectedFormat === 'image'
                        ? 'Creative_Visual_V1.jpg'
                        : selectedFormat === 'long_video'
                        ? 'Longform_Tutorial_16x9.mp4'
                        : 'ShortForm_Reel_V1.mp4'}
                    </Text>
                    <Text style={styles.mediaAttachedSpecsText}>
                      {selectedFormat === 'carousel'
                        ? '4:5 Aspect • 5 High-Res Slides • Optimized'
                        : selectedFormat === 'image'
                        ? '1080×1350 • 4:5 Portrait • High Quality'
                        : selectedFormat === 'long_video'
                        ? '1920×1080 • 16:9 Landscape • 4K 60FPS'
                        : '1080×1920 • 9:16 Vertical • 30s • 4K HDR'}
                    </Text>
                  </View>
                </View>

                {/* Sub-actions Row: Replace, Thumbnail, Remove */}
                <View style={styles.mediaAttachedActionsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.mediaSubActionBtn, pressed && styles.btnPressed]}
                    onPress={() => handleUploadMedia(mediaType === 'image' ? 'image' : 'video')}
                  >
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="#582CDB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.mediaSubActionBtnText}>Replace</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.mediaSubActionBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setHasThumbnail(!hasThumbnail);
                    }}
                  >
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={hasThumbnail ? '#15803D' : '#582CDB'} strokeWidth="2" />
                      <Circle cx="8.5" cy="8.5" r="1.5" fill={hasThumbnail ? '#15803D' : '#582CDB'} />
                      <Path d="M21 15L16 10L5 21" stroke={hasThumbnail ? '#15803D' : '#582CDB'} strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                    <Text style={[styles.mediaSubActionBtnText, hasThumbnail && { color: '#15803D' }]}>
                      {hasThumbnail ? 'Thumbnail Added ✓' : 'Add Thumbnail'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.mediaSubActionRemoveBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      setHasMedia(false);
                      setHasThumbnail(false);
                    }}
                  >
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.mediaSubActionRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Empty Media Dropzone Contextual to Content Format */
              <View>
                <Pressable
                  onPress={() => handleUploadMedia(selectedFormat === 'image' ? 'image' : 'video')}
                  style={styles.mediaDashedDropzone}
                >
                  <View style={styles.mediaIconCircle}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#6D28D9" strokeWidth="2" />
                      <Circle cx="8.5" cy="8.5" r="1.5" fill="#6D28D9" />
                      <Path d="M21 15L16 10L5 21" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                  </View>
                  <Text style={styles.mediaDropzoneTitle}>{currentFormatConfig.mediaLabel}</Text>
                  <Text style={styles.mediaDropzoneSubtitle}>{dynamicMediaSub}</Text>
                </Pressable>

                <View style={styles.mediaButtonsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.mediaActionBtn, pressed && styles.btnPressed]}
                    onPress={() => handleUploadMedia(selectedFormat === 'image' ? 'image' : 'video')}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                        stroke="#582CDB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.mediaActionBtnText}>{currentFormatConfig.primaryMediaActionText}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.mediaActionBtn, pressed && styles.btnPressed]}
                    onPress={() => handleUploadMedia('thumbnail')}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#582CDB" strokeWidth="2" />
                      <Circle cx="8.5" cy="8.5" r="1.5" fill="#582CDB" />
                      <Path d="M21 15L16 10L5 21" stroke="#582CDB" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.mediaActionBtnText}>Add Thumbnail</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* 4. CAPTION WRITING */}
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>CAPTION WRITING</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>{aiEditsLeft} AI EDITS LEFT</Text>
            </View>
          </View>

          <View style={[styles.captionContainer, isCaptionFocused && styles.captionContainerFocused]}>
            <TextInput
              style={styles.captionInput}
              multiline
              value={caption}
              onChangeText={setCaption}
              onFocus={() => setIsCaptionFocused(true)}
              onBlur={() => setIsCaptionFocused(false)}
              placeholder="Write or tap to edit your post caption..."
              placeholderTextColor="#94A3B8"
              selectionColor="#7C3AED"
              cursorColor="#7C3AED"
            />

            <View style={styles.captionMetaRow}>
              <View style={styles.captionMetaLeft}>
                <Pressable
                  onPress={() => {
                    const tones: ('Helpful' | 'Viral' | 'Story')[] = ['Helpful', 'Viral', 'Story'];
                    const next = tones[(tones.indexOf(captionTone) + 1) % tones.length];
                    setCaptionTone(next);
                  }}
                  style={styles.tonePill}
                >
                  <Text style={styles.toneLabel}>TONE</Text>
                  <Text style={styles.toneDivider}>·</Text>
                  <Text style={styles.toneValue}>💡 {captionTone}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const ctas: ('Ask Question' | 'Save Post' | 'Share Thoughts')[] = [
                      'Ask Question',
                      'Save Post',
                      'Share Thoughts',
                    ];
                    const next = ctas[(ctas.indexOf(captionCta) + 1) % ctas.length];
                    setCaptionCta(next);
                  }}
                  style={styles.tonePill}
                >
                  <Text style={styles.toneLabel}>CTA</Text>
                  <Text style={styles.toneDivider}>·</Text>
                  <Text style={styles.toneValue}>
                    {captionCta === 'Ask Question' ? 'Question' : captionCta === 'Save Post' ? 'Save' : 'Share'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.charCountText}>{caption.length} chars</Text>
            </View>

            {/* 3 AI Action Pills */}
            <View style={styles.aiButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.aiPillBtn, pressed && styles.btnPressed]}
                onPress={() => handleAiAction('rewrite')}
                disabled={isAiProcessing}
              >
                <Text style={styles.aiPillBtnText}>
                  {isAiProcessing ? '...' : 'Rewrite'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.aiPillBtn, pressed && styles.btnPressed]}
                onPress={() => handleAiAction('shorter')}
                disabled={isAiProcessing}
              >
                <Text style={styles.aiPillBtnText}>Shorten</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.aiPillBtn, pressed && styles.btnPressed]}
                onPress={() => handleAiAction('cta')}
                disabled={isAiProcessing}
              >
                <Text style={styles.aiPillBtnText}>Add CTA</Text>
              </Pressable>
            </View>
          </View>

          {/* 5. HASHTAGS & TAGS */}
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>HASHTAGS &amp; TAGS</Text>
            {selectedPlatforms.length > 0 && (
              <View style={styles.platformTagsBadgeRow}>
                {selectedPlatforms.map((platId) => {
                  const plat = ALL_AVAILABLE_PLATFORMS.find((p) => p.id === platId);
                  if (!plat) return null;
                  return (
                    <View key={plat.id} style={[styles.platformMiniTagPill, { backgroundColor: plat.bgColor }]}>
                      <Text style={styles.platformMiniTagText}>{plat.name}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.tagsContainer}>
            <View style={styles.tagsContextRow}>
              <Text style={styles.tagsContextSparkle}>✨</Text>
              <Text style={styles.tagsContextText}>
                Jarvis selected these based on your post &amp; {selectedPlatforms.length > 0 ? selectedPlatforms.map(p => ALL_AVAILABLE_PLATFORMS.find(x => x.id === p)?.name).join(' + ') : 'channels'}
              </Text>
            </View>

            <View style={styles.tagsPillsRow}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(tag)}
                  style={styles.tagPill}
                >
                  <Text style={styles.tagPillText}>{tag}</Text>
                  <Text style={styles.tagPillCross}>×</Text>
                </Pressable>
              ))}
            </View>

            {showAddTagInput && (
              <View style={styles.addTagInputRow}>
                <TextInput
                  style={styles.addTagInput}
                  placeholder="Enter tag (e.g. #growth)"
                  placeholderTextColor="#94A3B8"
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddCustomTag}
                  autoFocus
                />
                <Pressable onPress={handleAddCustomTag} style={styles.addTagConfirmBtn}>
                  <Text style={styles.addTagConfirmText}>Add</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.tagActionsRow}>
              {/* Secondary Outlined Custom Tag Button */}
              <Pressable
                style={({ pressed }) => [styles.tagActionCustomBtn, pressed && styles.btnPressed]}
                onPress={() => setShowAddTagInput(!showAddTagInput)}
              >
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#582CDB" strokeWidth="2.4" strokeLinecap="round" />
                </Svg>
                <Text style={styles.tagActionCustomBtnText} numberOfLines={1}>Add Custom Tag</Text>
              </Pressable>

              {/* Stronger Primary Purple Filled Generate Tags Button */}
              <Pressable
                style={({ pressed }) => [styles.tagActionGenerateBtn, pressed && styles.btnPressed]}
                onPress={handleGenerateTags}
              >
                <LinearGradient
                  colors={['#582CDB', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tagActionGenerateGradient}
                >
                  <Text style={{ fontSize: 12 }}>✨</Text>
                  <Text style={styles.tagActionGenerateBtnText} numberOfLines={1}>Generate Tags</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* 6. PUBLISHING & SCHEDULE TIMING */}
          <View style={styles.timingCard}>
            <View style={styles.timingHeaderRow}>
              <Text style={styles.timingSuggestedLightbulb}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timingSuggestedTitle}>Suggested time: Today • 7:30 PM</Text>
                <Text style={styles.timingSuggestedSub}>Your audience is usually more active in this window.</Text>
              </View>
            </View>

            {/* 3 Timing Tabs */}
            <View style={styles.timingTabsRow}>
              {(['now', 'schedule', 'draft'] as const).map((m) => {
                const isActive = publishMode === m;
                const label = m === 'now' ? 'POST NOW' : m === 'schedule' ? 'SCHEDULE' : 'DRAFT';
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setPublishMode(m);
                    }}
                    style={[
                      styles.timingTabBtn,
                      isActive && styles.timingTabBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timingTabBtnText,
                        isActive && styles.timingTabBtnTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {publishMode === 'schedule' && (
              <View style={styles.scheduledInfoBox}>
                <View>
                  <Text style={styles.scheduledLabel}>SCHEDULED FOR</Text>
                  <Text style={styles.scheduledValue}>{scheduledTime}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    triggerModalAnim();
                    setShowCalendarModal(true);
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.scheduledChangeLink}>CHANGE</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 7. POST READINESS CHECKLIST */}
          <View style={styles.readinessCard}>
            <View style={styles.readinessHeaderRow}>
              <Text style={styles.readinessTitle}>POST READINESS</Text>
              <Text style={styles.readinessPercent}>{readinessPercent}%</Text>
            </View>

            <View style={styles.readinessProgressBarTrack}>
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.readinessProgressBarFill, { width: `${readinessPercent}%` }]}
              />
            </View>

            <View style={styles.checklistRow}>
              <View style={styles.checkIconFilled}>
                <Text style={styles.checkMarkWhite}>✓</Text>
              </View>
              <Text style={styles.checklistText}>Caption added and optimized</Text>
            </View>

            <View style={styles.checklistRow}>
              {selectedPlatforms.length > 0 ? (
                <View style={styles.checkIconFilled}>
                  <Text style={styles.checkMarkWhite}>✓</Text>
                </View>
              ) : (
                <View style={styles.checkIconEmpty} />
              )}
              <Text style={[styles.checklistText, selectedPlatforms.length === 0 && { color: '#94A3B8' }]}>
                {selectedPlatforms.length > 0
                  ? `Platforms selected (${selectedPlatforms.map((p) => {
                      const match = ALL_AVAILABLE_PLATFORMS.find((item) => item.id === p);
                      return match ? match.shortName : p;
                    }).join(', ')})`
                  : 'Platforms not selected'}
              </Text>
            </View>

            <View style={styles.checklistRow}>
              {hasMedia ? (
                <View style={styles.checkIconFilled}>
                  <Text style={styles.checkMarkWhite}>✓</Text>
                </View>
              ) : (
                <View style={styles.checkIconEmpty} />
              )}
              <Text style={[styles.checklistText, !hasMedia && { color: '#94A3B8' }]}>
                {hasMedia ? 'Media uploaded and attached' : 'Media not added'}
              </Text>
            </View>

            <View style={styles.checklistRow}>
              <View style={styles.checkIconFilled}>
                <Text style={styles.checkMarkWhite}>✓</Text>
              </View>
              <Text style={styles.checklistText}>Schedule time selected</Text>
            </View>
          </View>

          {/* 8. STREAK IMPACT BANNER */}
          <View style={styles.streakBannerCard}>
            <View style={styles.streakBannerIconCircle}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakBannerTitle}>
                Scheduling this post today protects your <Text style={{ fontWeight: '700' }}>{userProfile?.streakCount || 1}-day streak</Text>.
              </Text>
              <View style={styles.streakBannerBadgesRow}>
                <View style={styles.streakXpPill}>
                  <Text style={styles.streakXpText}>+50 CREATOR XP</Text>
                </View>
                <Text style={styles.streakMissionFraction}>STREAK MISSION: 0 / 1</Text>
              </View>
            </View>
          </View>

          {/* 9. JARVIS WRITING INSIGHT (LUXURY LAVENDER-CREAM DESIGN) */}
          <LinearGradient
            colors={['#FFFFFF', '#F8F5FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.jarvisWritingCard}
          >
            <View style={styles.jarvisWritingHeaderRow}>
              <View style={styles.jarvisWritingHeaderLeft}>
                <Animated.View
                  style={[
                    styles.jarvisWritingFlameIconBox,
                    { transform: [{ translateY: flameFloatY }] },
                  ]}
                >
                  <Image
                    source={require('../../assets/images/jarvis-core-flame.png')}
                    style={styles.jarvisWritingFlame}
                    resizeMode="contain"
                  />
                </Animated.View>
                <View style={styles.jarvisInsightBadge}>
                  <Text style={styles.jarvisInsightTag}>⚡ WRITING INSIGHT</Text>
                </View>
              </View>

              <View style={styles.jarvisScorePill}>
                <Text style={styles.jarvisScoreText}>95% Retention</Text>
              </View>
            </View>

            <Text style={styles.jarvisWritingTitle}>Hook Polish &amp; Audience Retention</Text>
            <Text style={styles.jarvisWritingBody}>
              This caption is stronger when it stays specific. Mention the exact mistake, what changed, and one actionable lesson other creators can bookmark.
            </Text>

            {/* Interactive Quick Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jarvisChipsRow}
              style={{ flexGrow: 0, marginBottom: 14 }}
            >
              {[
                { id: 'rewrite', label: '🔥 Stronger Hook' },
                { id: 'cta', label: '🎯 Add Viral CTA' },
                { id: 'shorter', label: '⚡ Make Shorter' },
              ].map((chip) => (
                <Pressable
                  key={chip.id}
                  onPress={() => handleAiAction(chip.id as 'rewrite' | 'cta' | 'shorter')}
                  style={styles.jarvisChip}
                >
                  <Text style={styles.jarvisChipText}>{chip.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.improveWithJarvisBtn, pressed && styles.btnPressed]}
              onPress={() => handleAiAction('rewrite')}
              disabled={isAiProcessing}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.improveWithJarvisGradient}
              >
                <Text style={styles.improveWithJarvisBtnText}>
                  {isAiProcessing ? 'Refining with AI...' : '🪄 Improve Caption with Jarvis AI'}
                </Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>

          {/* 10. PRIMARY & SECONDARY ACTION BUTTONS */}
          <View style={styles.composerActionRow}>
            <Pressable
              style={({ pressed }) => [styles.primaryComposerBtn, pressed && styles.btnPressed]}
              onPress={handlePublishOrSchedule}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryComposerGradient}
              >
                <Text style={styles.primaryComposerBtnText}>
                  {publishMode === 'now' ? 'Post Now ➔' : publishMode === 'schedule' ? 'Schedule Post' : 'Save as Draft'}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryComposerBtn, pressed && styles.btnPressed]}
              onPress={() => {
                setPublishMode('draft');
                handlePublishOrSchedule();
              }}
            >
              <Text style={styles.secondaryComposerBtnText}>Save Draft</Text>
            </Pressable>
          </View>

          {/* Bottom spacing to clear floating tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

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

        {/* MODAL 2: FULL INTERACTIVE CALENDAR & TIME SCHEDULER */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.calendarModalCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Schedule Post</Text>
                  <Text style={styles.modalSubtitle}>Pick a date &amp; peak audience window</Text>
                </View>
                <Pressable onPress={() => setShowCalendarModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {/* Month Selector Bar */}
                <View style={styles.calMonthNavRow}>
                  <Pressable
                    onPress={handlePrevMonth}
                    style={({ pressed }) => [styles.calMonthNavBtn, pressed && styles.btnPressed]}
                    hitSlop={8}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.5" strokeLinecap="round" />
                    </Svg>
                  </Pressable>

                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.calMonthNavTitle}>
                      {MONTH_NAMES[calMonthIndex]} {calYear}
                    </Text>
                    {calMonthIndex === 7 && calYear === 2026 && (
                      <Text style={styles.calMonthNavBadge}>CURRENT MONTH</Text>
                    )}
                  </View>

                  <Pressable
                    onPress={handleNextMonth}
                    style={({ pressed }) => [styles.calMonthNavBtn, pressed && styles.btnPressed]}
                    hitSlop={8}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M9 18L15 12L9 6" stroke="#171420" strokeWidth="2.5" strokeLinecap="round" />
                    </Svg>
                  </Pressable>
                </View>

                {/* Day of Week Headers */}
                <View style={styles.calWeekDaysRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, dIdx) => (
                    <Text key={dIdx} style={styles.calWeekDayText}>
                      {dayChar}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calDaysGrid}>
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayOfWeek }).map((_, emptyIdx) => (
                    <View key={`empty_${emptyIdx}`} style={styles.calDayCell} />
                  ))}

                  {/* Day numbers */}
                  {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    const isSelected = selectedCalDay === dayNum;
                    const isToday = dayNum === 18 && calMonthIndex === 7 && calYear === 2026;
                    const isPeakDay = dayNum % 3 === 0 || dayNum === 18 || dayNum === 19;

                    return (
                      <Pressable
                        key={`day_${dayNum}`}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedCalDay(dayNum);
                        }}
                        style={[
                          styles.calDayCell,
                          isSelected && styles.calDayCellSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calDayNumText,
                            isSelected && styles.calDayNumTextSelected,
                            isToday && !isSelected && styles.calDayNumTextToday,
                          ]}
                        >
                          {dayNum}
                        </Text>
                        {isToday && !isSelected && <View style={styles.calTodayDot} />}
                        {isPeakDay && !isSelected && !isToday && (
                          <View style={styles.calPeakDot} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Time Slots Section */}
                <Text style={styles.calSectionHeader}>SELECT TIME SLOT</Text>
                <View style={styles.calTimeSlotsGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSlotSelected = selectedTimeSlot === slot.time;
                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedTimeSlot(slot.time);
                        }}
                        style={[
                          styles.calTimeSlotCard,
                          isSlotSelected && styles.calTimeSlotCardActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calTimeSlotTime,
                            isSlotSelected && styles.calTimeSlotTimeActive,
                          ]}
                        >
                          {slot.time}
                        </Text>
                        <Text
                          style={[
                            styles.calTimeSlotLabel,
                            isSlotSelected && styles.calTimeSlotLabelActive,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Selected Slot Preview Callout */}
                <View style={styles.calPreviewBox}>
                  <View style={styles.calPreviewIconCircle}>
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calPreviewTitle}>
                      {MONTH_NAMES[calMonthIndex].substring(0, 3)} {selectedCalDay}, {calYear} at {selectedTimeSlot}
                    </Text>
                    <Text style={styles.calPreviewSub}>
                      Peak audience active window • Streak protection preserved
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Schedule Confirmation CTA */}
              <Pressable
                style={styles.modalPrimaryActionBtn}
                onPress={handleConfirmCalendarSchedule}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalPrimaryGradient}
                >
                  <Text style={styles.modalPrimaryActionText}>
                    Schedule Post ({MONTH_NAMES[calMonthIndex].substring(0, 3)} {selectedCalDay}, {selectedTimeSlot}) ✓
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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

        {/* MODAL 5: CREATOR CHAT */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Jarvis AI Chat</Text>
                  <Text style={styles.modalSubtitle}>Real-time creative assistant</Text>
                </View>
                <Pressable
                  onPress={() => setShowChatModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatCard}>
                <Text style={styles.chatSpeaker}>Jarvis AI</Text>
                <Text style={styles.chatMsg}>
                  I reviewed your draft! Adding a clear question at the end boosts comment engagement by 3.2x.
                </Text>
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
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 135,
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
  mainTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(18px, 4.5vw, 22px)' as any) : sFont(20),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
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
    color: '#6D28D9',
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
  readinessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readinessTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  readinessPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
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
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    fontWeight: '700',
  },
  checkIconEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  checklistText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
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
