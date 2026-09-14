import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { BrandToast } from '../components/BrandToast';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { sFont } from '../utils/responsive';

interface ProRepurposeScreenProps {
  userProfile?: UserProfileData;
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
  initialIdeaTitle?: string;
}

const { width } = Dimensions.get('window');

export interface CaptionVariationItem {
  id: string;
  type: string;
  shortLabel: string;
  text: string;
}

export interface GeneratedVersionItem {
  id: string;
  platform: string;
  platformType: 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook' | 'pinterest';
  badge: string;
  badgeColor: string;
  badgeTextColor: string;
  title: string;
  body: string;
}

export interface QueueItem {
  id: string;
  platform: string;
  platformName: string;
  formatName: string;
  platformType: 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook' | 'pinterest';
  time: string;
  tag: string;
  title: string;
}

export interface PostStreakPlatform {
  id: string;
  name: string;
  platformType: 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook' | 'pinterest';
  desc: string;
}

export const CORE_POSTSTREAK_PLATFORMS: PostStreakPlatform[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    platformType: 'tiktok',
    desc: 'Short videos & viral trend discovery',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    platformType: 'instagram',
    desc: 'Reels, carousels, stories, and posts',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    platformType: 'youtube',
    desc: 'Shorts & long-form video reach',
  },
  {
    id: 'threads',
    name: 'Threads',
    platformType: 'threads',
    desc: 'Text notes & real-time discussions',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    platformType: 'facebook',
    desc: 'Creator posts, reels & communities',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    platformType: 'pinterest',
    desc: 'Idea pins & visual infographics',
  },
];

const PLATFORM_TEMPLATES: Record<
  string,
  { platform: string; platformType: 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook' | 'pinterest'; title: string; body: string }
> = {
  tiktok: {
    platform: 'TikTok',
    platformType: 'tiktok',
    title: 'The Slow-Mo Creator Trap',
    body: 'Stop doing these 3 things if you want to grow past 1,000 followers: over-editing without a clear hook, waiting days between uploads, and ignoring your retention drop-offs.',
  },
  instagram: {
    platform: 'Instagram',
    platformType: 'instagram',
    title: 'The Slow-Mo Creator Trap',
    body: 'Breakdown of 3 simple shifts to optimize your daily creation workflow and double your reel engagement.',
  },
  youtube: {
    platform: 'YouTube',
    platformType: 'youtube',
    title: 'How I Batch-Film 10 Videos in 2 Hours',
    body: 'Breakdown of workflow systems that help you increase your output without burnout: batch scripting, 1-hour recording sprints, and reusable templates.',
  },
  threads: {
    platform: 'Threads',
    platformType: 'threads',
    title: 'Stop waiting for the "perfect" idea to start posting.',
    body: 'Consistency and honest lessons outperform polished perfection every single time.',
  },
  facebook: {
    platform: 'Facebook',
    platformType: 'facebook',
    title: '3 systems to double creator output',
    body: 'How to build a sustainable daily posting workflow without burning out: simplify your formats, batch your production, and protect your streak.',
  },
  pinterest: {
    platform: 'Pinterest',
    platformType: 'pinterest',
    title: 'Creator Workflow Infographic',
    body: 'Step-by-step visual blueprint for batching content, optimizing your workflow, and protecting your creator streak.',
  },
};

const PLATFORM_CAPTION_VARIATIONS: Record<string, CaptionVariationItem[]> = {
  tiktok: [
    {
      id: 'direct',
      type: 'TIKTOK · PUNCHY HOOK',
      shortLabel: 'Direct',
      text: '3 mistakes slowing your growth: 1. Over-editing, 2. No 3-sec hook, 3. Inconsistent schedule. Which one are you fixing first?',
    },
    {
      id: 'story',
      type: 'TIKTOK · STORY LESSON',
      shortLabel: 'Story',
      text: 'I spent 6 months stuck at 0 views until I stopped overthinking video production. Save this for your next batch filming day.',
    },
    {
      id: 'question',
      type: 'TIKTOK · VIRAL CTA',
      shortLabel: 'Conversation',
      text: 'Drop your current streak below — let’s audit your 3-second hook structure together in the comments.',
    },
  ],
  instagram: [
    {
      id: 'direct',
      type: 'IG REEL · DIRECT LIST',
      shortLabel: 'Direct',
      text: '3 mistakes slowing you down: 1. Lack of routine, 2. Bad lighting, 3. Long intros. Fixed.',
    },
    {
      id: 'story',
      type: 'IG REEL · SAVE ANGLE',
      shortLabel: 'Story',
      text: 'Save this for when you need a reminder. These 3 lessons transformed my creation journey...',
    },
    {
      id: 'question',
      type: 'IG REEL · CONVERSATION',
      shortLabel: 'Conversation',
      text: 'Which of these 3 creator traps took you the longest to unlearn? Drop your number below.',
    },
  ],
  ig_reel: [
    {
      id: 'direct',
      type: 'IG REEL · DIRECT LIST',
      shortLabel: 'Direct',
      text: '3 mistakes slowing you down: 1. Lack of routine, 2. Bad lighting, 3. Long intros. Fixed.',
    },
    {
      id: 'story',
      type: 'IG REEL · SAVE ANGLE',
      shortLabel: 'Story',
      text: 'Save this for when you need a reminder. These 3 lessons transformed my creation journey...',
    },
    {
      id: 'question',
      type: 'IG REEL · CONVERSATION',
      shortLabel: 'Conversation',
      text: 'Which of these 3 creator traps took you the longest to unlearn? Drop your number below.',
    },
  ],
  youtube: [
    {
      id: 'direct',
      type: 'SHORTS · RETENTION HOOK',
      shortLabel: 'Direct',
      text: 'Stop making these 3 video mistakes if you want viewers to stay past the first 3 seconds. Full breakdown in this Short.',
    },
    {
      id: 'story',
      type: 'SHORTS · SYSTEM LESSON',
      shortLabel: 'Story',
      text: 'How to batch 10 Shorts in 2 hours: build an idea vault and record in 1-hour sprints. Subscribe for daily creator systems.',
    },
    {
      id: 'question',
      type: 'SHORTS · ENGAGEMENT LOOP',
      shortLabel: 'Conversation',
      text: 'What is the #1 thing holding your channel back right now? Let’s break it down in the comments.',
    },
  ],
  shorts: [
    {
      id: 'direct',
      type: 'SHORTS · RETENTION HOOK',
      shortLabel: 'Direct',
      text: 'Stop making these 3 video mistakes if you want viewers to stay past the first 3 seconds. Full breakdown in this Short.',
    },
    {
      id: 'story',
      type: 'SHORTS · SYSTEM LESSON',
      shortLabel: 'Story',
      text: 'How to batch 10 Shorts in 2 hours: build an idea vault and record in 1-hour sprints. Subscribe for daily creator systems.',
    },
    {
      id: 'question',
      type: 'SHORTS · ENGAGEMENT LOOP',
      shortLabel: 'Conversation',
      text: 'What is the #1 thing holding your channel back right now? Let’s break it down in the comments.',
    },
  ],
  threads: [
    {
      id: 'direct',
      type: 'THREADS · CONTRARIAN',
      shortLabel: 'Direct',
      text: 'Hot take: You don’t need more ideas. You need a frictionless habit loop that turns 1 thought into 4 reps every week.',
    },
    {
      id: 'story',
      type: 'THREADS · AUTHENTIC LESSON',
      shortLabel: 'Story',
      text: 'The biggest mistake I made starting out was waiting for perfection. 1 honest, raw post daily beats a polished draft sitting on your desktop.',
    },
    {
      id: 'question',
      type: 'THREADS · OPEN THREAD',
      shortLabel: 'Conversation',
      text: 'Creators on Threads: What’s one piece of advice you’d give your Day-1 self? Sharing my top 3 below.',
    },
  ],
  facebook: [
    {
      id: 'direct',
      type: 'FACEBOOK · COMMUNITY LESSON',
      shortLabel: 'Direct',
      text: '3 common workflow traps that slow down creators — and the simple shift that fixes each one. Share this with your creator circle!',
    },
    {
      id: 'story',
      type: 'FACEBOOK · CREATOR STORY',
      shortLabel: 'Story',
      text: 'When I started batching content, everything changed. Here is the exact routine that helped me double my consistency.',
    },
    {
      id: 'question',
      type: 'FACEBOOK · DISCUSSION',
      shortLabel: 'Conversation',
      text: 'Fellow creators: what part of content creation takes up the most time in your week? Let’s share tips below.',
    },
  ],
  pinterest: [
    {
      id: 'direct',
      type: 'PINTEREST · ACTIONABLE PIN',
      shortLabel: 'Direct',
      text: '3 Creator Mistakes You Need to Avoid (And How to Fix Them Today). Save this pin to your Creator Strategy board!',
    },
    {
      id: 'story',
      type: 'PINTEREST · STEP-BY-STEP',
      shortLabel: 'Story',
      text: 'How to build a sustainable daily posting routine without burnout. Pin this guide for your next planning session.',
    },
    {
      id: 'question',
      type: 'PINTEREST · CHECKLIST PIN',
      shortLabel: 'Conversation',
      text: 'The Ultimate Content Batching Checklist for Creators. Save this and comment which workflow tip you’re trying first!',
    },
  ],
};

export const ProRepurposeScreen: React.FC<ProRepurposeScreenProps> = ({
  userProfile,
  onNavigate,
  onBack,
  initialIdeaTitle = '3 mistakes that slow down new creators',
}) => {
  // Core State
  const [originalIdea, setOriginalIdea] = useState(initialIdeaTitle);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'tiktok',
    'instagram',
    'youtube',
    'threads',
  ]);
  const [selectedCaptionVariation, setSelectedCaptionVariation] = useState('direct');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active platform for tailored captions (defaults to first selected platform or 'tiktok')
  const activeCaptionPlatform = selectedPlatforms[0] || 'tiktok';
  const currentCaptions = PLATFORM_CAPTION_VARIATIONS[activeCaptionPlatform] || PLATFORM_CAPTION_VARIATIONS.tiktok;

  // Carousel ref & dimensions for Caption Variations
  const captionScrollRef = useRef<ScrollView>(null);
  const captionCardWidth = width - 40;

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  // Edit Modals
  const [showEditIdeaModal, setShowEditIdeaModal] = useState(false);
  const [showMorePlatformsModal, setShowMorePlatformsModal] = useState(false);
  const [showScoreInfoModal, setShowScoreInfoModal] = useState(false);
  const [showReviewScheduleModal, setShowReviewScheduleModal] = useState(false);
  const [editIdeaText, setEditIdeaText] = useState(originalIdea);
  const [editingVersion, setEditingVersion] = useState<{ id: string; platform: string; title: string; body: string } | null>(null);
  const [editingQueueItem, setEditingQueueItem] = useState<QueueItem | null>(null);

  // Review & Schedule Queue State (Platform · Format architecture)
  const [queueItems, setQueueItems] = useState<QueueItem[]>([
    {
      id: 'tiktok',
      platform: 'TikTok · Video',
      platformName: 'TikTok',
      formatName: 'Video',
      platformType: 'tiktok',
      time: '7:30 PM',
      tag: 'PEAK DISCOVERY',
      title: 'The Slow-Mo Creator Trap',
    },
    {
      id: 'instagram',
      platform: 'Instagram · Reel',
      platformName: 'Instagram',
      formatName: 'Reel',
      platformType: 'instagram',
      time: '8:00 PM',
      tag: 'OPTIMAL EXPLORE',
      title: 'The Slow-Mo Creator Trap',
    },
    {
      id: 'threads',
      platform: 'Threads · Text',
      platformName: 'Threads',
      formatName: 'Text',
      platformType: 'threads',
      time: '8:30 PM',
      tag: 'EVENING CONVO',
      title: 'Stop waiting for the "perfect" idea to start posting.',
    },
    {
      id: 'youtube',
      platform: 'YouTube · Short',
      platformName: 'YouTube',
      formatName: 'Short',
      platformType: 'youtube',
      time: '9:00 PM',
      tag: 'LATE SURGE',
      title: 'How I Batch-Film 10 Videos in 2 Hours',
    },
  ]);

  // Generated Versions Data (Platform first)
  const [versions, setVersions] = useState<GeneratedVersionItem[]>([
    {
      id: 'tiktok',
      platform: 'TikTok',
      platformType: 'tiktok' as const,
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'The Slow-Mo Creator Trap',
      body: 'Stop doing these 3 things if you want to grow past 1,000 followers: over-editing without a clear hook, waiting days between uploads, and ignoring your retention drop-offs.',
    },
    {
      id: 'instagram',
      platform: 'Instagram',
      platformType: 'instagram' as const,
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'The Slow-Mo Creator Trap',
      body: 'Breakdown of 3 simple shifts to optimize your daily creation workflow and double your reel engagement.',
    },
    {
      id: 'youtube',
      platform: 'YouTube',
      platformType: 'youtube' as const,
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'How I Batch-Film 10 Videos in 2 Hours',
      body: 'Breakdown of workflow systems that help you increase your output without burnout: batch scripting, 1-hour recording sprints, and reusable templates.',
    },
    {
      id: 'threads',
      platform: 'Threads',
      platformType: 'threads' as const,
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'Stop waiting for the "perfect" idea to start posting.',
      body: 'Consistency and honest lessons outperform polished perfection every single time.',
    },
  ]);

  // Completion / Celebration Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    title: 'Content Repurposed!',
    subtitle: '1 idea converted into 4 platform-optimized posts (+150 XP)',
    badgeText: '✨ 4-PLATFORM MULTI-REPURPOSE (+150 XP)',
    xpEarned: 150,
    speechBubble: 'All 4 versions are calibrated for peak algorithmic retention, Pablo! 🔥',
  });

  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const triggerModalPop = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  // Platform Selection Toggles
  const handleTogglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const pltName = CORE_POSTSTREAK_PLATFORMS.find((p) => p.id === platformId)?.name || platformId;
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter((f) => f !== platformId));
      showToast(`Deselected ${pltName}`);
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
      showToast(`✓ Added ${pltName}`);
    }
  };

  const handleToggleSelectAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const allIds = CORE_POSTSTREAK_PLATFORMS.map((p) => p.id);
    if (selectedPlatforms.length === allIds.length) {
      setSelectedPlatforms([]);
      showToast('Deselected all platforms');
    } else {
      setSelectedPlatforms(allIds);
      showToast('✓ Selected all 6 platforms');
    }
  };

  const handleDoneMorePlatforms = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowMorePlatformsModal(false);

    const formatMap: Record<string, string> = {
      tiktok: 'Video',
      instagram: 'Reel',
      youtube: 'Short',
      threads: 'Text',
      facebook: 'Video',
      pinterest: 'Pin',
    };
    const timeMap: Record<string, string> = {
      tiktok: '7:30 PM',
      instagram: '8:00 PM',
      threads: '8:30 PM',
      youtube: '9:00 PM',
      facebook: '9:15 PM',
      pinterest: '9:30 PM',
    };
    const tagMap: Record<string, string> = {
      tiktok: 'PEAK DISCOVERY',
      instagram: 'OPTIMAL EXPLORE',
      threads: 'EVENING CONVO',
      youtube: 'LATE SURGE',
      facebook: 'COMMUNITY FEED',
      pinterest: 'EVERGREEN SEARCH',
    };

    // Synchronize generated versions with current selected platforms
    const newVersions = selectedPlatforms.map((pid) => {
      const tpl = PLATFORM_TEMPLATES[pid] || PLATFORM_TEMPLATES.tiktok;
      return {
        id: pid,
        platform: tpl.platform,
        platformType: tpl.platformType,
        badge: 'READY',
        badgeColor: '#DCFCE7',
        badgeTextColor: '#15803D',
        title: tpl.title,
        body: tpl.body,
      };
    });
    setVersions(newVersions);

    const newQueue: QueueItem[] = selectedPlatforms.map((pid) => {
      const tpl = PLATFORM_TEMPLATES[pid] || PLATFORM_TEMPLATES.tiktok;
      const fmt = formatMap[pid] || 'Post';
      return {
        id: pid,
        platform: `${tpl.platform} · ${fmt}`,
        platformName: tpl.platform,
        formatName: fmt,
        platformType: tpl.platformType,
        time: timeMap[pid] || '8:00 PM',
        tag: tagMap[pid] || 'OPTIMAL REACH',
        title: tpl.title,
      };
    });
    setQueueItems(newQueue);

    if (selectedPlatforms.length > 0) {
      setCompletionData({
        title: 'Platforms Synchronized!',
        subtitle: `${selectedPlatforms.length} PostStreak platforms calibrated for multi-channel reach.`,
        badgeText: `✨ ${selectedPlatforms.length}-PLATFORM SYNC (+50 XP)`,
        xpEarned: 50,
        speechBubble: 'Platform versions are ready to adapt your idea, Pablo! 🔥',
      });

      setTimeout(() => {
        setShowCompletionModal(true);
      }, 200);
    }
  };

  // Generate Action
  const handleGenerateVersions = () => {
    if (selectedPlatforms.length === 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      showToast('Select at least 1 platform to generate versions');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsGenerating(true);
    showToast('✨ Adapting idea for selected PostStreak platforms...');
    setTimeout(() => {
      setIsGenerating(false);

      const formatMap: Record<string, string> = {
        tiktok: 'Video',
        instagram: 'Reel',
        youtube: 'Short',
        threads: 'Text',
        facebook: 'Video',
        pinterest: 'Pin',
      };
      const timeMap: Record<string, string> = {
        tiktok: '7:30 PM',
        instagram: '8:00 PM',
        threads: '8:30 PM',
        youtube: '9:00 PM',
        facebook: '9:15 PM',
        pinterest: '9:30 PM',
      };
      const tagMap: Record<string, string> = {
        tiktok: 'PEAK DISCOVERY',
        instagram: 'OPTIMAL EXPLORE',
        threads: 'EVENING CONVO',
        youtube: 'LATE SURGE',
        facebook: 'COMMUNITY FEED',
        pinterest: 'EVERGREEN SEARCH',
      };

      const newVersions = selectedPlatforms.map((pid) => {
        const tpl = PLATFORM_TEMPLATES[pid] || PLATFORM_TEMPLATES.tiktok;
        return {
          id: pid,
          platform: tpl.platform,
          platformType: tpl.platformType,
          badge: 'READY',
          badgeColor: '#DCFCE7',
          badgeTextColor: '#15803D',
          title: tpl.title,
          body: tpl.body,
        };
      });
      setVersions(newVersions);

      const newQueue: QueueItem[] = selectedPlatforms.map((pid) => {
        const tpl = PLATFORM_TEMPLATES[pid] || PLATFORM_TEMPLATES.tiktok;
        const fmt = formatMap[pid] || 'Post';
        return {
          id: pid,
          platform: `${tpl.platform} · ${fmt}`,
          platformName: tpl.platform,
          formatName: fmt,
          platformType: tpl.platformType,
          time: timeMap[pid] || '8:00 PM',
          tag: tagMap[pid] || 'OPTIMAL REACH',
          title: tpl.title,
        };
      });
      setQueueItems(newQueue);

      setCompletionData({
        title: 'Platform Versions Generated!',
        subtitle: `Created tailored scripts for ${selectedPlatforms.length} PostStreak platforms.`,
        badgeText: `✨ ${selectedPlatforms.length}-PLATFORM SYNC (+50 XP)`,
        xpEarned: 50,
        speechBubble: 'Platform versions calibrated for peak reach, Pablo! 🚀',
      });
      setShowCompletionModal(true);
    }, 900);
  };

  // Use Version Handler
  const handleUseVersion = (version: typeof versions[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast(`✓ Loaded "${version.title}" to Post Composer`);
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('composer');
      }
    }, 400);
  };

  // Schedule All Handler
  const handleScheduleAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const count = queueItems.length;
    const summaryList = queueItems
      .slice(0, 2)
      .map((q) => `${q.platform} at ${q.time}`)
      .join(' • ');

    setCompletionData({
      title: 'Smart Multi-Post Scheduled!',
      subtitle: summaryList || `${count} platform posts queued across optimal peak hours`,
      badgeText: `📅 ${count}-CHANNEL QUEUED (+${count * 35} XP)`,
      xpEarned: count * 35,
      speechBubble: 'Strategic schedule locked in at peak engagement windows! 🔥',
    });
    setShowCompletionModal(true);
  };

  // Save Edited Idea
  const handleSaveEditedIdea = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setOriginalIdea(editIdeaText);
    setShowEditIdeaModal(false);
    showToast('✓ Original Idea updated');
  };

  // Save Edited Version
  const handleSaveEditedVersion = () => {
    if (!editingVersion) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setVersions(
      versions.map((v) =>
        v.id === editingVersion.id
          ? { ...v, title: editingVersion.title, body: editingVersion.body }
          : v
      )
    );
    setEditingVersion(null);
    showToast('✓ Version updated');
  };

  return (
    <View style={styles.container}>
      {/* BRAND TOAST */}
      <BrandToast message={toastMessage} />

      {/* TOP APP BAR */}
      <View style={styles.topAppBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            style={({ pressed }) => [styles.topGhostLogoBtn, pressed && styles.btnPressed]}
            onPress={() => (onBack ? onBack() : onNavigate ? onNavigate('dashboard') : null)}
            hitSlop={8}
          >
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.topGhostLogo}
              resizeMode="contain"
            />
          </Pressable>

          {/* Pro Badge Pill */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
            hitSlop={8}
          >
            <LinearGradient
              colors={['#F59E0B', '#F59E0B', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proHeaderBadge}
            >
              <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.topRightRow}>
          <Pressable
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.btnPressed]}
            onPress={() => onNavigate && onNavigate('messages')}
            hitSlop={8}
          >
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
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
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.btnPressed]}
            onPress={() => showToast('🔔 2 new platform suggestions')}
            hitSlop={8}
          >
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
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
            <View style={styles.topNotifBadge} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.topAvatarBox, pressed && styles.btnPressed]}
            onPress={() => onNavigate && onNavigate('creator-passport')}
            hitSlop={8}
          >
            {userProfile?.customAvatarUri ? (
              <Image
                source={{ uri: userProfile.customAvatarUri }}
                style={styles.topAvatarImg}
                resizeMode="cover"
              />
            ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
              <Image
                source={userProfile.avatarSource}
                style={styles.topAvatarImg}
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

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.repurposeStudioBadge}>
            <Text style={styles.repurposeStudioBadgeText}>REPURPOSE STUDIO</Text>
          </View>

          <Text
            style={styles.heroTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Turn one idea into platform-ready posts.
          </Text>
          <Text style={styles.heroSubtitle}>
            Turn one content idea into platform-native versions for TikTok · Video, Instagram · Reel, YouTube · Short, and Threads · Text.
          </Text>
        </View>

        {/* ============================================================ */}
        {/* CARD 1: ORIGINAL IDEA                                       */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 15 }}>💡</Text>
            <Text style={styles.sectionHeaderTitle}>Original Idea</Text>
          </View>

          <View style={styles.originalIdeaCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={styles.originalIdeaTitle}>&ldquo;{originalIdea}&rdquo;</Text>
              <View style={styles.shortVideoBadge}>
                <Text style={styles.shortVideoBadgeText}>SHORT VIDEO</Text>
              </View>
            </View>

            <Text style={styles.originalIdeaGoal}>🎯 Goal: Saves, comments, authority</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.retentionBadge}>
                <Text style={styles.retentionBadgeText}>RETENTION READY</Text>
              </View>
              <View style={styles.savePotentialBadge}>
                <Text style={styles.savePotentialBadgeText}>SAVE-FOCUSED</Text>
              </View>
            </View>

            {/* Edit Original Idea Button */}
            <Pressable
              style={({ pressed }) => [styles.editOriginalIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onNavigate) {
                  onNavigate('idea-detail');
                }
              }}
            >
              <Text style={styles.editOriginalIdeaBtnText}>✏️ Edit in Idea Engine</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 2: SELECT PLATFORMS                                     */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sectionHeaderTitle}>Select Platforms</Text>
              <Text style={styles.sectionHeaderSub}>Choose PostStreak platforms to adapt this idea for</Text>
            </View>
            <Pressable onPress={handleToggleSelectAll} hitSlop={8} style={{ flexShrink: 0 }}>
              <Text style={styles.selectAllLinkText}>
                {selectedPlatforms.length === 6 ? 'Deselect All' : 'Select All (6)'}
              </Text>
            </Pressable>
          </View>

          {/* Platforms Grid (6 Core Platforms) */}
          <View style={styles.platformsGrid}>
            {CORE_POSTSTREAK_PLATFORMS.map((plt) => {
              const isSelected = selectedPlatforms.includes(plt.id);
              return (
                <Pressable
                  key={plt.id}
                  style={({ pressed }) => [
                    styles.platformCard,
                    isSelected && styles.platformCardActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleTogglePlatform(plt.id)}
                >
                  <View style={{ height: 26, justifyContent: 'center', alignItems: 'center' }}>
                    <SocialBrandIcon platform={plt.platformType} size={22} />
                  </View>
                  <Text
                    style={[styles.platformCardName, isSelected && styles.platformCardNameActive]}
                    numberOfLines={1}
                  >
                    {plt.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.platformCheckDot}>
                      <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Generate Versions Action Button */}
          <Pressable
            style={({ pressed }) => [styles.generateVersionsBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateVersions}
          >
            <LinearGradient
              colors={['#582CDB', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateVersionsGradient}
            >
              <Text style={styles.generateVersionsBtnText}>
                {isGenerating ? '⏳ Adapting Across Platforms...' : '✨ Generate Versions'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* CARD 3: GENERATED VERSIONS                                   */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Generated Versions</Text>

          <View style={{ gap: 12, marginTop: 10 }}>
            {versions.map((ver) => (
              <View key={ver.id} style={styles.versionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <View style={styles.versionIconBox}>
                      <SocialBrandIcon platform={ver.platformType} size={18} />
                    </View>
                    <Text style={styles.versionPlatformText}>{ver.platform}</Text>
                  </View>
                  <View style={[styles.versionBadge, { backgroundColor: ver.badgeColor }]}>
                    <Text style={[styles.versionBadgeText, { color: ver.badgeTextColor }]}>
                      {ver.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.versionTitle}>{ver.title}</Text>
                <Text style={styles.versionBodyText}>&ldquo;{ver.body}&rdquo;</Text>

                {/* Edit & Use Buttons */}
                <View style={styles.versionActionsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.versionEditBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setEditingVersion({ id: ver.id, platform: ver.platform, title: ver.title, body: ver.body });
                      triggerModalPop();
                    }}
                  >
                    <Text style={styles.versionEditBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.versionUseBtn, pressed && styles.btnPressed]}
                    onPress={() => handleUseVersion(ver)}
                  >
                    <Text style={styles.versionUseBtnText}>Use Version</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 4: CAPTION VARIATIONS                                   */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionHeaderTitle}>
              Caption Variations · {currentCaptions.length}
            </Text>
            <View style={styles.captionPlatformBadge}>
              <Text style={styles.captionPlatformBadgeText}>
                {activeCaptionPlatform === 'tiktok'
                  ? '📱 TikTok Tailored'
                  : activeCaptionPlatform === 'youtube'
                  ? '▶ YouTube · Short Tailored'
                  : activeCaptionPlatform === 'threads'
                  ? '🧵 Threads Tailored'
                  : activeCaptionPlatform === 'facebook'
                  ? '👥 Facebook Tailored'
                  : activeCaptionPlatform === 'pinterest'
                  ? '📌 Pinterest Tailored'
                  : '📸 Instagram Tailored'}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={captionScrollRef}
            horizontal
            pagingEnabled={Platform.OS !== 'web'}
            snapToInterval={captionCardWidth}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.captionVariationsScroll}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / captionCardWidth);
              if (currentCaptions[idx]) {
                setSelectedCaptionVariation(currentCaptions[idx].id);
              }
            }}
          >
            {currentCaptions.map((cap) => {
              const isSelected = selectedCaptionVariation === cap.id;
              return (
                <Pressable
                  key={cap.id}
                  style={({ pressed }) => [
                    styles.captionVarCard,
                    { width: captionCardWidth },
                    isSelected && styles.captionVarCardActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCaptionVariation(cap.id);
                    showToast(`✓ Applied ${cap.shortLabel} angle`);
                  }}
                >
                  <View style={styles.captionVarTypeBadge}>
                    <Text style={styles.captionVarTypeBadgeText}>{cap.type}</Text>
                  </View>
                  <Text style={styles.captionVarText} numberOfLines={5}>
                    {cap.text}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Carousel Pagination & Indicator Row */}
          <View style={styles.captionIndicatorRow}>
            {currentCaptions.map((cap, idx) => {
              const isSelected = selectedCaptionVariation === cap.id;
              return (
                <Pressable
                  key={cap.id}
                  style={[styles.captionIndicatorPill, isSelected && styles.captionIndicatorPillActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCaptionVariation(cap.id);
                    captionScrollRef.current?.scrollTo({ x: idx * captionCardWidth, animated: true });
                    showToast(`✓ Selected ${cap.shortLabel} angle`);
                  }}
                  hitSlop={6}
                >
                  <View style={[styles.captionIndicatorDot, isSelected && styles.captionIndicatorDotActive]} />
                  <Text style={[styles.captionIndicatorLabel, isSelected && styles.captionIndicatorLabelActive]}>
                    {cap.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 5: REPURPOSE SCORE GAUGE                                */}
        {/* ============================================================ */}
        <View style={styles.repurposeScoreCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.repurposeScoreTitle}>Repurpose Score</Text>
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowScoreInfoModal(true);
                  }}
                  hitSlop={8}
                  style={styles.scoreInfoBtn}
                >
                  <Text style={styles.scoreInfoBtnText}>ⓘ</Text>
                </Pressable>
              </View>
              <Text style={styles.repurposeScoreSub}>Strategic readiness factor</Text>
            </View>

            {/* Circular Gauge 88 */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowScoreInfoModal(true);
              }}
              hitSlop={6}
              style={styles.gaugeCircle}
            >
              <Text style={styles.gaugeScoreVal}>88</Text>
            </Pressable>
          </View>

          {/* Metric Progress Bars */}
          <View style={{ gap: 10, marginTop: 16 }}>
            {/* Short-form */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.metricBarLabel}>SHORT-FORM</Text>
                <Text style={styles.metricBarVal}>92%</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: '92%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            {/* Long-form */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.metricBarLabel}>LONG-FORM</Text>
                <Text style={styles.metricBarVal}>84%</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: '84%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 6: JARVIS INSIGHT HERO CARD                             */}
        {/* ============================================================ */}
        <LinearGradient
          colors={['#2A1454', '#1E0C3E', '#14072C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.jarvisHeroCard}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.jarvisIconHaloBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 26, height: 26 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.jarvisHeroTitle}>Jarvis Insight</Text>
                <Text style={styles.jarvisHeroSub}>PRO AI STRATEGY</Text>
              </View>
            </View>
            <View style={styles.jarvisActivePill}>
              <Text style={styles.jarvisActivePillText}>⚡ ACTIVE</Text>
            </View>
          </View>

          <View style={styles.jarvisQuoteBox}>
            <Text style={styles.jarvisQuoteText}>
              &ldquo;Your strongest repurposed version shows the best retention potential. Recommend scheduling TikTok first.&rdquo;
            </Text>
          </View>

          {/* Strategy 3-Tier Hierarchy */}
          <View style={{ gap: 8, marginTop: 4, marginBottom: 12 }}>
            {/* Tier 1: Jarvis Top Recommendation */}
            <Pressable
              style={({ pressed }) => [styles.jarvisPrimaryStrategyBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                showToast('✓ Opening Schedule Queue with TikTok Priority');
                setShowReviewScheduleModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 4 }}>
                <Text style={styles.jarvisPrimaryStar}>⭐</Text>
                <Text
                  style={styles.jarvisPrimaryStrategyText}
                  numberOfLines={1}
                >
                  SCHEDULE TIKTOK FIRST
                </Text>
              </View>
              <Text style={styles.jarvisPrimaryArrow}>➔</Text>
            </Pressable>

            {/* Tier 2: Secondary Alternatives */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.jarvisSecondaryStrategyBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  const igVer = versions.find((v) => v.platformType === 'instagram') || versions[0];
                  handleUseVersion(igVer);
                }}
              >
                <Text
                  style={styles.jarvisSecondaryStrategyText}
                  numberOfLines={1}
                >
                  CROSS-POST REEL
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.jarvisSecondaryStrategyBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  const threadsVer = versions.find((v) => v.platformType === 'threads') || versions[0];
                  handleUseVersion(threadsVer);
                }}
              >
                <Text
                  style={styles.jarvisSecondaryStrategyText}
                  numberOfLines={1}
                >
                  EXTRACT THREAD
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Tier 3: Automation CTA */}
          <Pressable
            style={({ pressed }) => [styles.jarvisScheduleBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setShowReviewScheduleModal(true);
            }}
          >
            <Text style={styles.jarvisScheduleBtnText}>✨ Review & Schedule via Jarvis →</Text>
          </Pressable>
        </LinearGradient>

        {/* ============================================================ */}
        {/* CARD 7: STRATEGIC SCHEDULE                                   */}
        {/* ============================================================ */}
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleHeaderTitle}>Strategic Schedule</Text>

          <View style={{ gap: 8, marginTop: 10 }}>
            <Pressable
              style={({ pressed }) => [styles.scheduleSlotRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                const tiktokItem = queueItems.find((q) => q.id === 'tiktok') || queueItems[0];
                if (tiktokItem) {
                  setEditingQueueItem({ ...tiktokItem });
                  triggerModalPop();
                } else {
                  setShowReviewScheduleModal(true);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, marginRight: 6 }}>
                <SocialBrandIcon platform="tiktok" size={18} />
                <Text style={styles.scheduleSlotName}>TikTok · Video</Text>
                <View style={styles.jarvisPickBadge}>
                  <Text style={styles.jarvisPickBadgeText}>✨ JARVIS PICK</Text>
                </View>
              </View>
              <View style={styles.scheduleTimePill}>
                <Text style={styles.scheduleTimePillText}>
                  {queueItems.find((q) => q.id === 'tiktok')?.time || '7:30 PM'}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.scheduleSlotRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                const igItem = queueItems.find((q) => q.id === 'instagram') || queueItems[1];
                if (igItem) {
                  setEditingQueueItem({ ...igItem });
                  triggerModalPop();
                } else {
                  setShowReviewScheduleModal(true);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SocialBrandIcon platform="instagram" size={18} />
                <Text style={styles.scheduleSlotName}>Instagram · Reel</Text>
              </View>
              <View style={styles.scheduleTimePill}>
                <Text style={styles.scheduleTimePillText}>
                  {queueItems.find((q) => q.id === 'instagram')?.time || '8:00 PM'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Schedule All Amber Action Button */}
          <Pressable
            style={({ pressed }) => [styles.amberScheduleAllBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setShowReviewScheduleModal(true);
            }}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.amberScheduleAllGradient}
            >
              <Text style={styles.amberScheduleAllBtnText}>📅  Review & Schedule All</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* CARD 8: PROGRESS & SAFETY                                    */}
        {/* ============================================================ */}
        <View style={styles.progressSafetyRow}>
          <View style={styles.metricCardBox}>
            <Text
              style={styles.metricCardLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              REPURPOSE READINESS
            </Text>
            <Text style={styles.metricCardValue}>86%</Text>
          </View>

          <View style={styles.metricCardBox}>
            <Text
              style={styles.metricCardLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              STREAK SAFETY
            </Text>
            <Text style={[styles.metricCardValue, { color: '#F59E0B' }]}>47D</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* BOTTOM ACTION BUTTON: REGENERATE                             */}
        {/* ============================================================ */}
        <View style={{ marginTop: 20 }}>
          <Pressable
            style={({ pressed }) => [styles.bottomRegenerateFullBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              showToast('↻ Regenerating all platform versions...');
              handleGenerateVersions();
            }}
          >
            <Text style={styles.bottomRegenerateFullBtnText}>↻  Regenerate All Versions</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* EDIT ORIGINAL IDEA MODAL */}
      <Modal
        visible={showEditIdeaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditIdeaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Edit Original Idea</Text>
              <Pressable onPress={() => setShowEditIdeaModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.modalTextInput}
              value={editIdeaText}
              onChangeText={setEditIdeaText}
              placeholder="Enter original idea..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowEditIdeaModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedIdea}
              >
                <Text style={styles.modalSaveBtnText}>Save Idea</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* EDIT VERSION MODAL */}
      <Modal
        visible={editingVersion !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingVersion(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>
                {editingVersion?.platform ? `Edit ${editingVersion.platform} Version` : 'Edit Platform Version'}
              </Text>
              <Pressable onPress={() => setEditingVersion(null)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalInputLabel}>TITLE / HOOK</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 50 }]}
              value={editingVersion?.title}
              onChangeText={(text) =>
                setEditingVersion((prev) => (prev ? { ...prev, title: text } : null))
              }
              placeholder="Version title..."
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.modalInputLabel, { marginTop: 10 }]}>BODY CONTENT</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 90 }]}
              value={editingVersion?.body}
              onChangeText={(text) =>
                setEditingVersion((prev) => (prev ? { ...prev, body: text } : null))
              }
              placeholder="Version body content..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEditingVersion(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedVersion}
              >
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ADD MORE PLATFORMS MODAL */}
      <Modal
        visible={showMorePlatformsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMorePlatformsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle}>Add More Platforms</Text>
                <Text style={styles.modalSubTitle}>Choose additional PostStreak platforms to adapt this idea for.</Text>
              </View>
              <Pressable onPress={() => setShowMorePlatformsModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {CORE_POSTSTREAK_PLATFORMS.map((item) => {
                const isSelected = selectedPlatforms.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.extraPlatformRow,
                      isSelected && styles.extraPlatformRowActive,
                    ]}
                    onPress={() => handleTogglePlatform(item.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={styles.extraPlatformIconBox}>
                        <SocialBrandIcon platform={item.platformType} size={20} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.extraPlatformName}>{item.name}</Text>
                        <Text style={styles.extraPlatformDesc}>{item.desc}</Text>
                      </View>
                    </View>

                    <View style={[styles.extraPlatformCheckRing, isSelected && styles.extraPlatformCheckRingActive]}>
                      {isSelected && (
                        <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowMorePlatformsModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleDoneMorePlatforms}
              >
                <Text style={styles.modalSaveBtnText}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* REPURPOSE SCORE BREAKDOWN MODAL */}
      <Modal
        visible={showScoreInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScoreInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.scoreInfoBadge}>
                  <Text style={styles.scoreInfoBadgeText}>88 / 100</Text>
                </View>
                <Text style={styles.modalTitle}>Repurpose Score</Text>
              </View>
              <Pressable onPress={() => setShowScoreInfoModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.scoreModalExplanation}>
              Measures how ready your idea is to be adapted across formats based on structure, hook strength, platform fit and content depth.
            </Text>

            {/* Factor Breakdown */}
            <View style={{ gap: 9, marginTop: 14 }}>
              {[
                {
                  name: 'Structure & Flow',
                  val: '94%',
                  color: '#10B981',
                  desc: 'Clear narrative arc & logical segment transitions',
                },
                {
                  name: 'Hook Strength',
                  val: '91%',
                  color: '#582CDB',
                  desc: 'High-retention opening framing that stops scrolling',
                },
                {
                  name: 'Platform Versatility',
                  val: '88%',
                  color: '#F59E0B',
                  desc: 'Fits vertical short-form video & text conversations',
                },
                {
                  name: 'Depth & Resonance',
                  val: '82%',
                  color: '#6366F1',
                  desc: 'Practical takeaways encouraging saves & shares',
                },
              ].map((factor) => (
                <View key={factor.name} style={styles.scoreFactorCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.scoreFactorTitle}>{factor.name}</Text>
                    <Text style={[styles.scoreFactorVal, { color: factor.color }]}>{factor.val}</Text>
                  </View>
                  <View style={styles.scoreFactorBarTrack}>
                    <View style={[styles.scoreFactorBarFill, { width: factor.val as any, backgroundColor: factor.color }]} />
                  </View>
                  <Text style={styles.scoreFactorDesc}>{factor.desc}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.modalSaveBtn, { marginTop: 16, width: '100%', alignItems: 'center' }]}
              onPress={() => setShowScoreInfoModal(false)}
            >
              <Text style={styles.modalSaveBtnText}>Got it</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* EDIT QUEUE ITEM SCHEDULE MODAL */}
      <Modal
        visible={editingQueueItem !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingQueueItem(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {editingQueueItem && (
                  <View style={styles.queueIconBox}>
                    <SocialBrandIcon platform={editingQueueItem.platformType} size={18} />
                  </View>
                )}
                <View>
                  <Text style={styles.modalTitle}>
                    {editingQueueItem ? `Edit ${editingQueueItem.platform}` : 'Edit Schedule'}
                  </Text>
                  <Text style={styles.modalSubTitle}>Adjust scheduled time & post hook</Text>
                </View>
              </View>
              <Pressable onPress={() => setEditingQueueItem(null)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Scheduled Release Time Section */}
            <Text style={styles.modalInputLabel}>SCHEDULED RELEASE TIME</Text>
            <View style={styles.queueTimePickerRow}>
              {['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'].map((t) => {
                const isSelected = editingQueueItem?.time === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.queueTimePickerPill, isSelected && styles.queueTimePickerPillActive]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setEditingQueueItem((prev) => (prev ? { ...prev, time: t } : null));
                    }}
                  >
                    <Text style={[styles.queueTimePickerPillText, isSelected && styles.queueTimePickerPillTextActive]}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Post Title / Hook Section */}
            <Text style={[styles.modalInputLabel, { marginTop: 14 }]}>POST TITLE / HOOK</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 60 }]}
              value={editingQueueItem?.title}
              onChangeText={(text) =>
                setEditingQueueItem((prev) => (prev ? { ...prev, title: text } : null))
              }
              placeholder="Post title or hook..."
              placeholderTextColor="#94A3B8"
            />

            {/* Actions: Remove, Save */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={styles.modalDeleteBtn}
                onPress={() => {
                  if (!editingQueueItem) return;
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  const removedPlatform = editingQueueItem.platform;
                  setQueueItems((prev) => prev.filter((item) => item.id !== editingQueueItem.id));
                  setEditingQueueItem(null);
                  showToast(`✓ Removed ${removedPlatform} from queue`);
                }}
              >
                <Text style={styles.modalDeleteBtnText}>Remove</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={() => {
                  if (!editingQueueItem) return;
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setQueueItems((prev) =>
                    prev.map((item) => (item.id === editingQueueItem.id ? editingQueueItem : item))
                  );
                  const updatedName = editingQueueItem.platform;
                  const updatedTime = editingQueueItem.time;
                  setEditingQueueItem(null);
                  showToast(`✓ Updated ${updatedName} to ${updatedTime}`);
                }}
              >
                <Text style={styles.modalSaveBtnText}>Save Schedule</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* REVIEW & SCHEDULE QUEUE CONFIRMATION MODAL */}
      <Modal
        visible={showReviewScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReviewScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View>
                <Text style={styles.modalTitle}>Review & Schedule Queue</Text>
                <Text style={styles.modalSubTitle}>Confirm automated multi-platform release</Text>
              </View>
              <Pressable onPress={() => setShowReviewScheduleModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Queue items */}
            <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {queueItems.length === 0 ? (
                <View style={styles.emptyQueueNotice}>
                  <Text style={styles.emptyQueueNoticeText}>
                    No posts in queue. Tap Regenerate or choose platforms to refill.
                  </Text>
                </View>
              ) : (
                queueItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.queueItemRow,
                      pressed && styles.queueItemRowPressed,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setEditingQueueItem({ ...item });
                      triggerModalPop();
                    }}
                  >
                    {/* Top Row: Icon + Platform Name & Time Pill */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <View style={styles.queueIconBox}>
                          <SocialBrandIcon platform={item.platformType} size={16} />
                        </View>
                        <Text
                          style={styles.queuePlatformName}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {item.platform}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.queueTimeBox}>
                          <Text style={styles.queueTimeText}>{item.time}</Text>
                        </View>
                        <View style={styles.queueEditPencilBadge}>
                          <Text style={{ fontSize: 10 }}>✏️</Text>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Row: Post Title (left) & Strategy Tag Badge (right) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>
                        &ldquo;{item.title}&rdquo;
                      </Text>
                      <View style={styles.queueTagBadge}>
                        <Text style={styles.queueTagBadgeText}>{item.tag}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>

            {/* Safety Notice */}
            <View style={styles.queueSafetyNotice}>
              <Text style={styles.queueSafetyNoticeText}>
                🔒 Tap any card to adjust scheduled time or hook. Posts will be queued in your Jarvis schedule.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewScheduleModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSaveBtn, { flex: 2 }]}
                onPress={() => {
                  setShowReviewScheduleModal(false);
                  handleScheduleAll();
                }}
              >
                <Text style={styles.modalSaveBtnText}>Confirm & Queue All</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 3D GHOST CELEBRATION MODAL */}
      <AnimatedCompletionModal
        visible={showCompletionModal}
        onDismiss={() => setShowCompletionModal(false)}
        title={completionData.title}
        subtitle={completionData.subtitle}
        badgeText={completionData.badgeText}
        xpEarned={completionData.xpEarned}
        speechBubble={completionData.speechBubble}
      />

      {/* FLOATING TAB BAR */}
      <FloatingTabBar
        activeTab="create"
        onTabPress={(tab: TabType) => {
          if (onNavigate) {
            if (tab === 'home') onNavigate('dashboard');
            else if (tab === 'create') onNavigate('create');
            else if (tab === 'match') onNavigate('match');
            else if (tab === 'quests') onNavigate('quests');
            else if (tab === 'growth') onNavigate('growth');
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F7F5F0',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // TOP APP BAR
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 14,
    backgroundColor: '#F7F5F0',
  },
  topGhostLogoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  topGhostLogo: {
    width: 26,
    height: 26,
  },
  proHeaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    position: 'relative',
  },
  topNotifBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  topAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  topAvatarGoldBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // SCROLL CONTENT
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 135,
  },

  // HERO SECTION
  heroSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  repurposeStudioBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  repurposeStudioBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(16px, 3.8vw, 19px)' as any) : sFont(17.5),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.35,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },

  // SECTION HEADERS
  cardSectionContainer: {
    marginTop: 18,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },

  // CARD 1: ORIGINAL IDEA
  originalIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  originalIdeaTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    lineHeight: 20,
    paddingRight: 8,
  },
  shortVideoBadge: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  shortVideoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  originalIdeaGoal: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 12,
  },
  retentionBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  retentionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  savePotentialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  savePotentialBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  editOriginalIdeaBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editOriginalIdeaBtnText: {
    color: '#582CDB',
    fontSize: 12,
    fontWeight: '700',
  },

  // CARD 2: SELECT PLATFORMS
  sectionHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  selectAllLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformCard: {
    width: (width - 40 - 16) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    position: 'relative',
    gap: 6,
  },
  platformCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  platformCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  platformCardNameActive: {
    fontWeight: '800',
    color: '#171420',
  },
  platformCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateVersionsBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  generateVersionsGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  generateVersionsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // CARD 3: GENERATED VERSIONS
  versionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  versionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  versionPlatformText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  versionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  versionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginTop: 8,
    marginBottom: 4,
  },
  versionBodyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  versionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  versionEditBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  versionUseBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionUseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // CARD 4: CAPTION VARIATIONS
  captionVariationsScroll: {
    marginTop: 10,
  },
  captionVarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  captionVarCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  captionVarTypeBadge: {
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  captionVarTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  captionVarText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
  },
  captionPlatformBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  captionPlatformBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  captionIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  captionIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  captionIndicatorPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  captionIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  captionIndicatorDotActive: {
    backgroundColor: '#582CDB',
  },
  captionIndicatorLabel: {
    fontSize: sFont(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  captionIndicatorLabelActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // CARD 5: REPURPOSE SCORE
  repurposeScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 18,
  },
  repurposeScoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  repurposeScoreSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  gaugeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
  },
  gaugeScoreVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  metricBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  metricBarVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
  },
  metricBarTrack: {
    height: 6,
    backgroundColor: '#F1EFE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // CARD 6: JARVIS HERO CARD
  jarvisHeroCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.45)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  jarvisIconHaloBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(88, 44, 219, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisHeroTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  jarvisHeroSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  jarvisActivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  jarvisActivePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.3,
  },
  jarvisQuoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  jarvisQuoteText: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 18,
    fontWeight: '600',
  },
  jarvisGoldStrategyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  jarvisGoldStrategyPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  jarvisScheduleBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  jarvisScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // CARD 7: STRATEGIC SCHEDULE
  scheduleCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 18,
  },
  scheduleHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  scheduleSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  scheduleSlotName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  jarvisPickBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  jarvisPickBadgeText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  scheduleTimePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleTimePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  amberScheduleAllBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  amberScheduleAllGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  amberScheduleAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // CARD 8: PROGRESS & SAFETY
  progressSafetyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  metricCardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  metricCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 4,
  },

  // BOTTOM ACTION BUTTON
  bottomRegenerateFullBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bottomRegenerateFullBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // EXTRA PLATFORMS MODAL
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  extraPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  extraPlatformRowActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  extraPlatformIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  extraPlatformName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  extraPlatformDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  extraPlatformCheckRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  extraPlatformCheckRingActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    padding: 4,
  },
  modalInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    fontSize: 13,
    color: '#171420',
    minHeight: 60,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // SCORE INFO MODAL & BUTTONS
  scoreInfoBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInfoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 13,
  },
  scoreInfoBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scoreInfoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  scoreModalExplanation: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  scoreFactorCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  scoreFactorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  scoreFactorVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  scoreFactorBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginVertical: 4,
  },
  scoreFactorBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  scoreFactorDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  // JARVIS 3-TIER HIERARCHY
  jarvisPrimaryStrategyBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    paddingVertical: 9.5,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  jarvisPrimaryStar: {
    fontSize: 11,
  },
  jarvisPrimaryStrategyText: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  jarvisPrimaryArrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  jarvisSecondaryStrategyBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  jarvisSecondaryStrategyText: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },

  // QUEUE CONFIRMATION MODAL & EDIT MODAL
  queueItemRow: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  queueItemRowPressed: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
    transform: [{ scale: 0.99 }],
  },
  queueEditPencilBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueTimePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  queueTimePickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  queueTimePickerPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  queueTimePickerPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  queueTimePickerPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyQueueNotice: {
    padding: 16,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
  },
  emptyQueueNoticeText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  queueIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  queuePlatformName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  queueTagBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexShrink: 0,
  },
  queueTagBadgeText: {
    fontSize: sFont(8),
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  queueItemTitle: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    fontStyle: 'italic',
  },
  queueTimeBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexShrink: 0,
  },
  queueTimeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  queueSafetyNotice: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueSafetyNoticeText: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 15,
  },
});
