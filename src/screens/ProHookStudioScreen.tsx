import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  Image,
  Dimensions,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { sFont } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HookFormula {
  id: string;
  title: string;
  category: 'CONTRARIAN' | 'CURIOSITY' | 'MISTAKE' | 'STORY' | 'PROOF' | 'FOMO';
  categoryLabel: string;
  categoryBg: string;
  categoryTextColor: string;
  formulaTemplate: string;
  variables: { key: string; label: string; placeholder: string; defaultValue: string }[];
  exampleText: string;
  retentionScore: number;
  stopRate: string;
  platformFits: ('tiktok' | 'instagram' | 'youtube' | 'threads')[];
  explanation: string;
  psychologyTrigger: string;
}

export const HOOK_CATEGORIES = [
  { id: 'ALL', label: '🔥 All', count: '200+' },
  { id: 'SAVED', label: '⭐ Saved', count: '0' },
] as const;

export const CURATED_HOOK_FORMULAS: HookFormula[] = [
  // CONTRARIAN
  {
    id: 'hook-1',
    title: 'The Counter-Intuitive Trap',
    category: 'CONTRARIAN',
    categoryLabel: 'CONTRARIAN',
    categoryBg: '#FEE2E2',
    categoryTextColor: '#DC2626',
    formulaTemplate: 'Stop doing [Common Advice] if you want [Desired Outcome]. Here is what actually works.',
    variables: [
      { key: 'Common Advice', label: 'Common Advice', placeholder: 'posting 3x a day', defaultValue: 'posting 3x a day' },
      { key: 'Desired Outcome', label: 'Desired Outcome', placeholder: 'to grow past 10k followers', defaultValue: 'to grow past 10k followers' },
    ],
    exampleText: 'Stop posting 3x a day if you want to grow past 10k followers. Here is what actually works instead.',
    retentionScore: 98,
    stopRate: 'AI Estimate · 98.4%',
    platformFits: ['tiktok', 'instagram', 'youtube'],
    explanation: 'Disrupts autopilot scrolling by attacking widespread standard advice.',
    psychologyTrigger: 'Belief Disruption & Cognitive Dissonance',
  },
  {
    id: 'hook-2',
    title: 'The Uncomfortable Truth',
    category: 'CONTRARIAN',
    categoryLabel: 'CONTRARIAN',
    categoryBg: '#FEE2E2',
    categoryTextColor: '#DC2626',
    formulaTemplate: 'Nobody wants to admit this about [Industry/Topic], but [Harsh Reality].',
    variables: [
      { key: 'Industry/Topic', label: 'Industry/Topic', placeholder: 'content creation', defaultValue: 'content creation' },
      { key: 'Harsh Reality', label: 'Harsh Reality', placeholder: 'quality without a distribution system is useless', defaultValue: 'quality without a distribution system is useless' },
    ],
    exampleText: 'Nobody wants to admit this about content creation, but quality without a distribution system is useless.',
    retentionScore: 96,
    stopRate: 'AI Estimate · 96.2%',
    platformFits: ['tiktok', 'instagram', 'threads'],
    explanation: 'Positions you as the brave truth-teller willing to say what others hide.',
    psychologyTrigger: 'Insider Authority & Taboo Breaking',
  },
  {
    id: 'hook-3',
    title: 'The "Waste of Time" Callout',
    category: 'CONTRARIAN',
    categoryLabel: 'CONTRARIAN',
    categoryBg: '#FEE2E2',
    categoryTextColor: '#DC2626',
    formulaTemplate: '[Skill/Tactic] is officially dead. If you are still doing it in 2026, you are wasting [Time/Money].',
    variables: [
      { key: 'Skill/Tactic', label: 'Skill or Tactic', placeholder: 'Manual hashtag research', defaultValue: 'Manual hashtag research' },
      { key: 'Time/Money', label: 'Time or Money', placeholder: '5 hours every week', defaultValue: '5 hours every week' },
    ],
    exampleText: 'Manual hashtag research is officially dead. If you are still doing it in 2026, you are wasting 5 hours every week.',
    retentionScore: 97,
    stopRate: 'AI Estimate · 97.1%',
    platformFits: ['tiktok', 'instagram', 'youtube'],
    explanation: 'Creates urgent fear of obsolescence and wasted effort.',
    psychologyTrigger: 'Loss Aversion & Modernization Panic',
  },

  // CURIOSITY GAP
  {
    id: 'hook-4',
    title: 'The 1% Micro Habit',
    category: 'CURIOSITY',
    categoryLabel: 'CURIOSITY GAP',
    categoryBg: '#F5F3FF',
    categoryTextColor: '#7C3AED',
    formulaTemplate: 'The weird thing that happened when I started [Small Habit] for [Timeframe]...',
    variables: [
      { key: 'Small Habit', label: 'Small Habit', placeholder: 'batching 10 video hooks on Sunday', defaultValue: 'batching 10 video hooks on Sunday' },
      { key: 'Timeframe', label: 'Timeframe', placeholder: '30 straight days', defaultValue: '30 straight days' },
    ],
    exampleText: 'The weird thing that happened when I started batching 10 video hooks on Sunday for 30 straight days...',
    retentionScore: 99,
    stopRate: 'AI Estimate · 99.1%',
    platformFits: ['tiktok', 'instagram', 'youtube'],
    explanation: 'Opens an unresolved narrative loop that demands watching till the payoff.',
    psychologyTrigger: 'Information Gap Theory',
  },
  {
    id: 'hook-5',
    title: 'The Secret Nobody Tells You',
    category: 'CURIOSITY',
    categoryLabel: 'CURIOSITY GAP',
    categoryBg: '#F5F3FF',
    categoryTextColor: '#7C3AED',
    formulaTemplate: 'Here is the one rule about [Topic] that top creators gatekeep from everyone else.',
    variables: [
      { key: 'Topic', label: 'Topic / Niche', placeholder: 'algorithmic retention', defaultValue: 'algorithmic retention' },
    ],
    exampleText: 'Here is the one rule about algorithmic retention that top creators gatekeep from everyone else.',
    retentionScore: 95,
    stopRate: 'AI Estimate · 95.8%',
    platformFits: ['tiktok', 'instagram', 'youtube'],
    explanation: 'Triggers the desire for privileged, exclusive knowledge.',
    psychologyTrigger: 'Gatekept Secrets & Exclusivity',
  },
  {
    id: 'hook-6',
    title: 'The "Watch Before" Warning',
    category: 'CURIOSITY',
    categoryLabel: 'CURIOSITY GAP',
    categoryBg: '#F5F3FF',
    categoryTextColor: '#7C3AED',
    formulaTemplate: 'Watch this before you [Take Action] on [Platform/Niche] today.',
    variables: [
      { key: 'Take Action', label: 'Action', placeholder: 'post your next Reel', defaultValue: 'post your next Reel' },
      { key: 'Platform/Niche', label: 'Platform / Niche', placeholder: 'Instagram', defaultValue: 'Instagram' },
    ],
    exampleText: 'Watch this before you post your next Reel on Instagram today.',
    retentionScore: 96,
    stopRate: 'AI Estimate · 96.5%',
    platformFits: ['instagram', 'tiktok', 'youtube'],
    explanation: 'Interrupts action with a protective caution imperative.',
    psychologyTrigger: 'Preemptive Protection & Action Pausing',
  },

  // BIG MISTAKES
  {
    id: 'hook-7',
    title: 'The 3 Costly Mistakes',
    category: 'MISTAKE',
    categoryLabel: 'BIG MISTAKES',
    categoryBg: '#FEF3C7',
    categoryTextColor: '#D97706',
    formulaTemplate: '3 mistakes that cost me [Pain Point] and how to fix them in 60 seconds.',
    variables: [
      { key: 'Pain Point', label: 'Pain Point / Lost Resource', placeholder: '6 months of creator burnout', defaultValue: '6 months of creator burnout' },
    ],
    exampleText: '3 mistakes that cost me 6 months of creator burnout and how to fix them in 60 seconds.',
    retentionScore: 97,
    stopRate: 'AI Estimate · 97.8%',
    platformFits: ['tiktok', 'instagram', 'youtube', 'threads'],
    explanation: 'Quantifies pain and promises ultra-fast, structured resolution.',
    psychologyTrigger: 'Pain Avoidance & Instant Relief',
  },
  {
    id: 'hook-8',
    title: 'The "If You Get 0 Views" Diagnostic',
    category: 'MISTAKE',
    categoryLabel: 'BIG MISTAKES',
    categoryBg: '#FEF3C7',
    categoryTextColor: '#D97706',
    formulaTemplate: 'If your [Content Type] is stuck at [Low Metric], you are probably making this fatal error.',
    variables: [
      { key: 'Content Type', label: 'Content Type', placeholder: 'TikTok videos', defaultValue: 'TikTok videos' },
      { key: 'Low Metric', label: 'Low Metric', placeholder: '200 views', defaultValue: '200 views' },
    ],
    exampleText: 'If your TikTok videos are stuck at 200 views, you are probably making this fatal error.',
    retentionScore: 99,
    stopRate: 'AI Estimate · 98.9%',
    platformFits: ['tiktok', 'instagram', 'youtube'],
    explanation: 'Directly mirrors the exact real-time frustration of the viewer.',
    psychologyTrigger: 'Hyper-Specific Self-Identification',
  },

  // STORY & DRAMA
  {
    id: 'hook-9',
    title: 'The "I Almost Quit" Transformation',
    category: 'STORY',
    categoryLabel: 'STORY & DRAMA',
    categoryBg: '#FCE7F3',
    categoryTextColor: '#DB2777',
    formulaTemplate: 'I was ready to quit [Endeavor] last [Time Period]. Then I changed one single habit.',
    variables: [
      { key: 'Endeavor', label: 'Endeavor / Goal', placeholder: 'making short-form videos', defaultValue: 'making short-form videos' },
      { key: 'Time Period', label: 'Time Period', placeholder: 'November', defaultValue: 'November' },
    ],
    exampleText: 'I was ready to quit making short-form videos last November. Then I changed one single habit.',
    retentionScore: 94,
    stopRate: 'AI Estimate · 94.6%',
    platformFits: ['tiktok', 'instagram', 'threads'],
    explanation: 'Vulnerability hooks build immediate emotional resonance and empathy.',
    psychologyTrigger: 'Vulnerability & Hero Journey',
  },
  {
    id: 'hook-10',
    title: 'The Zero-to-Scale Milestone',
    category: 'STORY',
    categoryLabel: 'STORY & DRAMA',
    categoryBg: '#FCE7F3',
    categoryTextColor: '#DB2777',
    formulaTemplate: 'How I went from [Starting Point] to [Impressive Result] with 0 budget and no followers.',
    variables: [
      { key: 'Starting Point', label: 'Starting Point', placeholder: '0 views and self-doubt', defaultValue: '0 views and self-doubt' },
      { key: 'Impressive Result', label: 'Impressive Result', placeholder: '150,000 monthly impressions', defaultValue: '150,000 monthly impressions' },
    ],
    exampleText: 'How I went from 0 views and self-doubt to 150,000 monthly impressions with 0 budget and no followers.',
    retentionScore: 96,
    stopRate: 'AI Estimate · 96.8%',
    platformFits: ['tiktok', 'instagram', 'youtube', 'threads'],
    explanation: 'Underdog narrative establishes high aspirational credibility.',
    psychologyTrigger: 'Underdog Aspiration & Social Proof',
  },

  // DATA & PROOF
  {
    id: 'hook-11',
    title: 'The 1,000 Video Dissection',
    category: 'PROOF',
    categoryLabel: 'DATA & PROOF',
    categoryBg: '#E0F2FE',
    categoryTextColor: '#0284C7',
    formulaTemplate: 'I analyzed [High Number] [Items] so you don\'t have to. Here are the [Number] patterns that matter.',
    variables: [
      { key: 'High Number', label: 'Sample Size', placeholder: '100 creator workflows', defaultValue: '100 creator workflows' },
      { key: 'Items', label: 'Topic / Niche', placeholder: 'in short-form video', defaultValue: 'in short-form video' },
      { key: 'Number', label: 'Key Count', placeholder: '3', defaultValue: '3' },
    ],
    exampleText: 'I reviewed 100 creator workflows in short-form video so you don\'t have to. Here are the 3 patterns that matter.',
    retentionScore: 98,
    stopRate: 'AI Estimate · 98.5%',
    platformFits: ['youtube', 'tiktok', 'instagram', 'threads'],
    explanation: 'Offers maximum leverage by condensing hundreds of hours of work into seconds.',
    psychologyTrigger: 'High-Leverage Data Curation',
  },
  {
    id: 'hook-12',
    title: 'The Measured Lift Stat',
    category: 'PROOF',
    categoryLabel: 'DATA & PROOF',
    categoryBg: '#E0F2FE',
    categoryTextColor: '#0284C7',
    formulaTemplate: 'This [Small Tweak] increased my [Metric] by [Specific Percentage]% in just [Days/Hours].',
    variables: [
      { key: 'Small Tweak', label: 'Small Tweak', placeholder: '2-second visual reset', defaultValue: '2-second visual reset' },
      { key: 'Metric', label: 'Metric', placeholder: 'watch time', defaultValue: 'watch time' },
      { key: 'Specific Percentage', label: 'Specific Percentage', placeholder: '47.2', defaultValue: '47.2' },
      { key: 'Days/Hours', label: 'Timeframe', placeholder: '7 days', defaultValue: '7 days' },
    ],
    exampleText: 'This 2-second visual reset increased my watch time by 47.2% in just 7 days.',
    retentionScore: 97,
    stopRate: 'AI Estimate · 97.3%',
    platformFits: ['tiktok', 'instagram', 'youtube'],
    explanation: 'Exact decimals and non-rounded percentages carry irresistible mathematical trust.',
    psychologyTrigger: 'Precision Effect & Concrete Proof',
  },

  // FOMO & URGENT
  {
    id: 'hook-13',
    title: 'The Algorithm Shift Window',
    category: 'FOMO',
    categoryLabel: 'URGENT & FOMO',
    categoryBg: '#DCFCE7',
    categoryTextColor: '#15803D',
    formulaTemplate: 'The [Platform] algorithm just shifted in [Month/Year]. If you don\'t adapt [Strategy] right now, you\'ll fall behind.',
    variables: [
      { key: 'Platform', label: 'Platform', placeholder: 'Instagram', defaultValue: 'Instagram' },
      { key: 'Month/Year', label: 'Month/Year', placeholder: 'this month', defaultValue: 'this month' },
      { key: 'Strategy', label: 'Strategy', placeholder: 'your retention hook rhythm', defaultValue: 'your retention hook rhythm' },
    ],
    exampleText: 'The Instagram algorithm just shifted in this month. If you don\'t adapt your retention hook rhythm right now, you\'ll fall behind.',
    retentionScore: 96,
    stopRate: 'AI Estimate · 96.1%',
    platformFits: ['instagram', 'tiktok', 'threads'],
    explanation: 'Triggers the urgency of early-mover advantage vs falling into obscurity.',
    psychologyTrigger: 'Time-Sensitivity & Competitive Edge',
  },
];

interface ProHookStudioScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenIdeaAngle?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const ProHookStudioScreen: React.FC<ProHookStudioScreenProps> = ({
  ideaTitle,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenPostComposer,
  onOpenScript,
  onOpenIdeaAngle,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const titleFontSize = Math.min(22, Math.max(16, (windowWidth - 44) / 19));
  const modalListMaxHeight = Math.min(280, Math.max(160, windowHeight - 340));

  // Navigation & Profile State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Idea context
  const [currentIdeaTitle, setCurrentIdeaTitle] = useState(
    ideaTitle || '3 creator mistakes that slow down new creators'
  );

  // Selected Recommended Hook
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [recommendedHooks, setRecommendedHooks] = useState([
    {
      badge: 'BEST PERFORMING',
      text: 'Most new creators do not fail because they lack ideas. They fail because they wait too long to post.',
      type: 'Direct • 98.4% Retention',
    },
    {
      badge: 'CURIOSITY GAP',
      text: 'Stop making these 3 mistakes if you want to grow consistently in 2026.',
      type: 'Curiosity • 96% Stop Rate',
    },
    {
      badge: 'CONTRARIAN',
      text: 'Your problem is not the algorithm, it’s your posting distribution system.',
      type: 'Contrarian • 97% Stop Rate',
    },
  ]);

  // Explore 5 Formulas Modal State
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [exploreCategory, setExploreCategory] = useState<string>('ALL');
  const [exploreFormulasBatch, setExploreFormulasBatch] = useState<HookFormula[]>(() => {
    const initialBatch = [...CURATED_HOOK_FORMULAS].slice(0, 3);
    return initialBatch;
  });
  const [bookmarkedHookIds, setBookmarkedHookIds] = useState<string[]>(['hook-1', 'hook-4']);
  const [isAccelerated, setIsAccelerated] = useState(false);

  // Hook Customizer Modal
  const [activeCustomizingHook, setActiveCustomizingHook] = useState<HookFormula | null>(null);
  const [customVariableValues, setCustomVariableValues] = useState<Record<string, string>>({});
  const [customizedLiveText, setCustomizedLiveText] = useState<string>('');

  // Celebration modal data
  const [completionData, setCompletionData] = useState({
    title: 'Hook Applied & Saved!',
    subtitle: `"${currentIdeaTitle}" optimized with viral 3-second opening hook (+50 XP).`,
    badgeText: '⚡ VIRAL HOOK LOCKED IN (+50 XP)',
    xpEarned: 50,
    speechBubble: 'Hook calibrated for peak thumbstop retention, Pablo! 🔥',
  });

  // Mascot Float Animation & Modal Scale
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;

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

  // Toast Helper
  const showToast = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

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

  // Toggle Bookmark
  const toggleBookmark = (hookId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setBookmarkedHookIds((prev) => {
      const exists = prev.includes(hookId);
      const updated = exists ? prev.filter((id) => id !== hookId) : [...prev, hookId];
      showToast(exists ? 'Removed from saved hooks' : '⭐ Hook saved to library!');
      return updated;
    });
  };

  // Open Customizer
  const openCustomizer = (hook: HookFormula) => {
    triggerModalPop();
    const initVals: Record<string, string> = {};
    hook.variables.forEach((v) => {
      initVals[v.key] = v.defaultValue;
    });
    setCustomVariableValues(initVals);
    setActiveCustomizingHook(hook);
  };

  // Update Live Customized Text
  useEffect(() => {
    if (!activeCustomizingHook) return;
    let text = activeCustomizingHook.formulaTemplate;
    activeCustomizingHook.variables.forEach((v) => {
      const val = customVariableValues[v.key] || `[${v.label}]`;
      text = text.replace(`[${v.key}]`, val);
    });
    setCustomizedLiveText(text);
  }, [activeCustomizingHook, customVariableValues]);

  // Generate More AI Recommended Hooks
  const handleGenerateMoreHooks = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRecommendedHooks([
      {
        badge: 'VIRAL HOOK',
        text: 'The #1 reason creator accounts stay stuck under 1,000 views is this single mistake.',
        type: 'Urgent • 99% Stop Rate',
      },
      {
        badge: 'STORY HOOK',
        text: 'I used to spend 5 hours editing one reel until I learned this 10-minute hook rule.',
        type: 'Story • 97% Stop Rate',
      },
      {
        badge: 'CONTRARIAN',
        text: 'Consistency isn’t about posting daily. It’s about not letting 3 days pass without data.',
        type: 'Authority • 96% Stop Rate',
      },
    ]);
    showToast('✨ Jarvis generated 3 new viral hooks!');
  };

  const handleApplyRecommendedHook = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedHookIndex(index);
    showToast(`✓ Applied Hook #${index + 1}`);
  };

  // Regenerate / Shuffle 5 Formulas from Curated Library
  const handleRegenerateExploreBatch = (cat = exploreCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    let source = [...CURATED_HOOK_FORMULAS];
    if (cat === 'SAVED') {
      source = source.filter((h) => bookmarkedHookIds.includes(h.id));
      if (source.length === 0) {
        setExploreFormulasBatch([]);
        showToast('No saved formulas found');
        return;
      }
    } else if (cat !== 'ALL') {
      source = source.filter((h) => h.category === cat);
    }
    const shuffled = [...source].sort(() => 0.5 - Math.random());
    const batch = shuffled.slice(0, 3);
    setExploreFormulasBatch(batch);
    showToast('✨ Loaded 3 fresh viral formulas!');
  };

  const handleOpenExploreModal = () => {
    triggerModalPop();
    handleRegenerateExploreBatch(exploreCategory);
    setShowExploreModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST NOTIFICATION BANNER */}
        <BrandToast message={toastMessage} />

        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR (EXACT PRO HEADER)                         */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="#171420"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Mascot */}
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

            {/* Pro Badge Pill */}
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
                colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proHeaderBadge}
              >
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Right Header */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalPop();
                setShowNotificationModal(true);
              }}
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
              <View style={styles.notificationDot} />
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowProfileModal(true);
              }}
              style={styles.profileAvatarWrapper}
              hitSlop={8}
            >
              {userProfile?.customAvatarUri ? (
                <Image
                  source={{ uri: userProfile.customAvatarUri }}
                  style={styles.headerUserAvatar}
                  resizeMode="cover"
                />
              ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
                <Image
                  source={userProfile.avatarSource}
                  style={styles.headerUserAvatar}
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
              <View style={styles.avatarTinyGoldCheckPos}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 2. SCROLLABLE CONTENT                                        */}
        {/* ============================================================ */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HERO TITLES & BADGES */}
          <View style={styles.topTitlesSection}>
            <View style={styles.goldScriptBadge}>
              <Text style={styles.goldScriptBadgeText}>PRO HOOK ENGINE</Text>
            </View>

            <Text
              style={styles.mainTitleText}
              numberOfLines={2}
            >
              Stop the scroll in 3 seconds.
            </Text>
            <Text style={styles.mainSubText}>
              Test 3-second video openers that hold attention and lift view duration.
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Pro Hook Engine</Text>
              </View>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>200+ Formulas</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: SELECTED IDEA CONTEXT                                */}
          {/* ============================================================ */}
          <View style={styles.selectedIdeaCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.selectedIdeaTag}>SELECTED IDEA</Text>
              <Pressable
                onPress={() => {
                  if (onOpenIdeaAngle) onOpenIdeaAngle();
                  else showToast('Re-selecting idea...');
                }}
                hitSlop={8}
              >
                <Text style={styles.reSelectIdeaText}>RE-SELECT IDEA</Text>
              </Pressable>
            </View>

            <Text style={styles.selectedIdeaTitle}>&ldquo;{currentIdeaTitle}&rdquo;</Text>
            <Text style={styles.selectedIdeaSub}>
              A short-form creator advice post explaining common mistakes that stop creators from posting consistently.
            </Text>

            <View style={styles.tagsPillsRow}>
              {['Creator Advice', 'High-Reach Potential', 'Short-form Video', 'Mistake Breakdown'].map((tag) => (
                <View key={tag} style={styles.ideaTagPill}>
                  <Text style={styles.ideaTagPillText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ideaBottomActionRow}>
              <Text style={styles.retentionOptText} numberOfLines={1}>
                Retention Optimization
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.proAccelerateBtn,
                  isAccelerated && styles.proAccelerateBtnActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  const nextState = !isAccelerated;
                  setIsAccelerated(nextState);
                  if (nextState) {
                    setCompletionData({
                      title: 'Viral Hooks Accelerated!',
                      subtitle: `"${currentIdeaTitle}" optimized with AI retention pacing & viral hook multiplier.`,
                      badgeText: '⚡ PRO HOOK ACCELERATED',
                      xpEarned: 50,
                      speechBubble: 'Maximum thumbstop rate unlocked, Pablo! Pacing & retention boosted to 98%! 🔥',
                    });
                    setShowCompletionModal(true);
                  } else {
                    showToast('Pro Acceleration paused');
                  }
                }}
              >
                <Text
                  style={[
                    styles.proAccelerateBtnText,
                    isAccelerated && styles.proAccelerateBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {isAccelerated ? '⚡ ACCELERATED ✓' : '⚡ Accelerate Hooks'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 2: HOOK QUALITY SCORE                                   */}
          {/* ============================================================ */}
          <View style={styles.scoreHighlightCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.scoreCardLabel} numberOfLines={1}>HOOK RETENTION SCORE</Text>
              <View style={styles.aiEvaluatedBadge}>
                <Text style={styles.aiEvaluatedBadgeText} numberOfLines={1}>AI EVALUATED</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
              {/* Circular Gauge */}
              <View style={styles.scoreGaugeCircle}>
                <Text style={styles.scoreGaugeNum}>96</Text>
                <Text style={styles.scoreGaugeDenom}>/100</Text>
              </View>

              {/* Dual Meters */}
              <View style={{ flex: 1, gap: 10 }}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={styles.meterLabel} numberOfLines={1}>3-SEC STOP RATE</Text>
                    <Text style={styles.meterVal} numberOfLines={1}>98%</Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: '98%', backgroundColor: '#582CDB' }]} />
                  </View>
                </View>

                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={styles.meterLabel} numberOfLines={1}>CURIOSITY GAP</Text>
                    <Text style={styles.meterVal} numberOfLines={1}>94%</Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: '94%', backgroundColor: '#10B981' }]} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.insightCalloutBox}>
              <Text style={{ fontSize: 13, marginRight: 6 }}>💡</Text>
              <Text style={styles.insightCalloutText}>
                Insight: Contrarian framing and specific outcome metrics are strong signals for 3-second retention.
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 3: RECOMMENDED HOOKS FOR THIS IDEA                      */}
          {/* ============================================================ */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeaderRowBetween}>
              <Text
                style={styles.sectionHeaderTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                RECOMMENDED HOOKS
              </Text>
              <Pressable onPress={handleGenerateMoreHooks} hitSlop={8}>
                <Text style={styles.generateMoreLink} numberOfLines={1}>✨ GENERATE MORE</Text>
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              {recommendedHooks.map((h, idx) => {
                const isSelected = selectedHookIndex === idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.hookOptionCard,
                      isSelected && styles.hookOptionCardActive,
                    ]}
                  >
                    <View style={styles.hookOptionTopRow}>
                      <View style={[styles.hookBadge, isSelected && styles.hookBadgeActive]}>
                        <Text
                          style={[styles.hookBadgeText, isSelected && styles.hookBadgeTextActive]}
                          numberOfLines={1}
                        >
                          {h.badge}
                        </Text>
                      </View>
                      <Text
                        style={styles.hookTypeLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {h.type}
                      </Text>
                    </View>

                    <Text style={styles.hookOptionText}>“{h.text}”</Text>

                    <View style={styles.hookOptionActionRow}>
                      <Pressable
                        style={[styles.applyHookBtn, isSelected && styles.applyHookBtnActive]}
                        onPress={() => handleApplyRecommendedHook(idx)}
                      >
                        <Text
                          style={[styles.applyHookBtnText, isSelected && styles.applyHookBtnTextActive]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {isSelected ? '✓ ACTIVE HOOK' : 'APPLY HOOK'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.useInComposerBtn}
                        onPress={() => {
                          if (onOpenPostComposer) {
                            onOpenPostComposer(h.text, 'TikTok');
                          } else {
                            showToast('Ready for Post Composer');
                          }
                        }}
                      >
                        <Text
                          style={styles.useInComposerBtnText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          🎨 USE IN COMPOSER
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 4: WANT MORE? EXPLORE 5 FORMULAS VAULT CARD             */}
          {/* ============================================================ */}
          <View style={styles.exploreVaultCard}>
            <View style={styles.exploreVaultTopRow}>
              <View style={styles.exploreVaultIconCircle}>
                <Text style={{ fontSize: 20 }}>📚</Text>
              </View>
              <View style={styles.exploreVaultCountBadge}>
                <Text style={styles.exploreVaultCountText}>200+ VAULT</Text>
              </View>
            </View>

            <Text style={styles.exploreVaultTitle}>
              Want More Formulas?
            </Text>

            <Text style={styles.exploreVaultSub}>
              Pop up 3 formulas matched to your idea & regenerate fresh viral hooks anytime.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.exploreVaultActionBtn, pressed && styles.btnPressed]}
              onPress={handleOpenExploreModal}
              accessibilityRole="button"
              accessibilityLabel="Explore 3 Formulas"
            >
              <Text style={styles.exploreVaultActionBtnText}>
                ✨ Explore 3 Formulas ➔
              </Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 5: BOTTOM PRIMARY ACTION BUTTONS                        */}
          {/* ============================================================ */}
          <View style={styles.bottomActionsStack}>
            <Pressable
              style={({ pressed }) => [styles.bottomPrimaryBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenScript) {
                  onOpenScript(recommendedHooks[selectedHookIndex]?.text);
                } else if (onOpenPostComposer) {
                  onOpenPostComposer(recommendedHooks[selectedHookIndex]?.text, 'TikTok');
                }
              }}
            >
              <LinearGradient
                colors={['#582CDB', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomPrimaryBtnGrad}
              >
                <Text
                  style={styles.bottomPrimaryBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  📝 Open in Script Engine ➔
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.bottomSecondaryBtn, pressed && styles.btnPressed]}
              onPress={handleGenerateMoreHooks}
            >
              <Text
                style={styles.bottomSecondaryBtnText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                ✨ Generate More Hooks
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* ============================================================ */}
        {/* MODAL: EXPLORE 5 FORMULAS POP-UP                             */}
        {/* ============================================================ */}
        <Modal
          visible={showExploreModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowExploreModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.exploreModalCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.modalTitle}>Hook Vault</Text>
                  <View style={styles.exploreVaultCountBadge}>
                    <Text style={styles.exploreVaultCountText}>200+ LIBRARY</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setShowExploreModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                3 formulas matched to your idea • Regenerate anytime
              </Text>

              {/* Category Filter Tabs (All & Saved) */}
              <View style={styles.modalCategoryChipsWrapper}>
                <View style={styles.modalCategoryTabsRow}>
                  {HOOK_CATEGORIES.map((cat) => {
                    const isActive = exploreCategory === cat.id;
                    const count = cat.id === 'SAVED' ? bookmarkedHookIds.length : cat.count;
                    return (
                      <Pressable
                        key={cat.id}
                        style={[styles.modalCatChip, isActive && styles.modalCatChipActive]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setExploreCategory(cat.id);
                          handleRegenerateExploreBatch(cat.id);
                        }}
                      >
                        <Text
                          style={[styles.modalCatChipText, isActive && styles.modalCatChipTextActive]}
                          numberOfLines={1}
                        >
                          {cat.label}
                        </Text>
                        <View style={[styles.modalCatCountBadge, isActive && styles.modalCatCountBadgeActive]}>
                          <Text
                            style={[styles.modalCatCountText, isActive && styles.modalCatCountTextActive]}
                            numberOfLines={1}
                          >
                            {count}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Scrollable 5 Formulas List */}
              <ScrollView
                style={[styles.modalFormulasScrollView, { maxHeight: modalListMaxHeight }]}
                contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
              >
                {exploreFormulasBatch.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>⭐</Text>
                    <Text style={styles.emptyStateTitle}>No saved formulas found</Text>
                    <Text style={styles.emptyStateSub}>
                      Tap the star icon on any formula to save it to your library.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {exploreFormulasBatch.map((hook, hIdx) => {
                      const isBookmarked = bookmarkedHookIds.includes(hook.id);
                      return (
                        <View key={`${hook.id}-${hIdx}`} style={styles.formulaCard}>
                          {/* Card Top Row */}
                          <View style={styles.cardHeaderRow}>
                            <View style={styles.cardHeaderBadges}>
                              <View style={[styles.categoryTag, { backgroundColor: hook.categoryBg }]}>
                                <Text
                                  style={[styles.categoryTagText, { color: hook.categoryTextColor }]}
                                  numberOfLines={1}
                                >
                                  {hook.categoryLabel}
                                </Text>
                              </View>
                              <View style={styles.retentionPill}>
                                <Text style={styles.retentionPillText} numberOfLines={1}>
                                  {hook.stopRate}
                                </Text>
                              </View>
                            </View>

                            {/* Bookmark Icon */}
                            <Pressable
                              onPress={() => toggleBookmark(hook.id)}
                              style={styles.cardBookmarkBtn}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={isBookmarked ? "Remove bookmark" : "Bookmark formula"}
                            >
                              <Text style={{ fontSize: 15, color: isBookmarked ? '#F59E0B' : '#CBD5E1' }}>
                                {isBookmarked ? '★' : '☆'}
                              </Text>
                            </Pressable>
                          </View>

                          {/* Title */}
                          <Text style={styles.formulaHookTitle}>{hook.title}</Text>

                          {/* Blueprint */}
                          <View style={styles.blueprintBox}>
                            <Text style={styles.blueprintLabel}>FORMULA BLUEPRINT</Text>
                            <Text style={styles.blueprintText}>{hook.formulaTemplate}</Text>
                          </View>

                          {/* Example */}
                          <View style={styles.exampleBox}>
                            <Text style={styles.exampleLabel}>EXAMPLE PREVIEW</Text>
                            <Text style={styles.exampleText}>“{hook.exampleText}”</Text>
                          </View>

                          {/* Psychology Trigger */}
                          <View style={styles.psychologyRow}>
                            <Text style={styles.psychologyLabel} numberOfLines={1}>🧠 Trigger:</Text>
                            <Text style={styles.psychologyVal}>{hook.psychologyTrigger}</Text>
                          </View>

                          {/* Actions */}
                          <View style={styles.cardActionsBar}>
                            <Pressable
                              style={({ pressed }) => [styles.cardBtn, styles.cardBtnSecondary, pressed && styles.btnPressed]}
                              onPress={() => {
                                showToast(`📋 Copied: "${hook.exampleText.slice(0, 30)}..."`);
                              }}
                            >
                              <Text style={styles.cardBtnSecondaryText} numberOfLines={1}>
                                📋 Copy
                              </Text>
                            </Pressable>

                            <Pressable
                              style={({ pressed }) => [styles.cardBtn, styles.cardBtnCustomize, pressed && styles.btnPressed]}
                              onPress={() => openCustomizer(hook)}
                            >
                              <Text style={styles.cardBtnCustomizeText} numberOfLines={1}>
                                ✏️ Customize
                              </Text>
                            </Pressable>

                            <Pressable
                              style={({ pressed }) => [styles.cardBtn, styles.cardBtnPrimary, pressed && styles.btnPressed]}
                              onPress={() => {
                                setShowExploreModal(false);
                                if (onOpenPostComposer) {
                                  onOpenPostComposer(hook.exampleText, 'TikTok');
                                } else {
                                  showToast('Ready for Post Composer');
                                }
                              }}
                            >
                              <Text style={styles.cardBtnPrimaryText} numberOfLines={1}>
                                🎨 Composer
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              {/* Bottom Sticky Modal Actions */}
              <View style={styles.exploreModalBottomRow}>
                <Pressable
                  style={styles.modalRegenerateFullBtn}
                  onPress={() => handleRegenerateExploreBatch(exploreCategory)}
                >
                  <LinearGradient
                    colors={['#582CDB', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalRegenGrad}
                  >
                    <Text
                      style={styles.modalRegenGradText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      🔄 Regenerate 3 More
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.modalDoneBtn}
                  onPress={() => setShowExploreModal(false)}
                >
                  <Text style={styles.modalDoneBtnText} numberOfLines={1}>Done</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: HOOK FILL-IN-THE-BLANK CUSTOMIZER                     */}
        {/* ============================================================ */}
        <Modal
          visible={!!activeCustomizingHook}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveCustomizingHook(null)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalSheetCard, { transform: [{ scale: modalPopScale }] }]}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Customize Hook Formula</Text>
                <Pressable
                  onPress={() => setActiveCustomizingHook(null)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>{activeCustomizingHook?.title}</Text>

              <ScrollView style={{ maxHeight: modalListMaxHeight }} showsVerticalScrollIndicator={false}>
                {/* Live Output Preview */}
                <View style={styles.livePreviewCard}>
                  <Text style={styles.livePreviewLabel}>LIVE GENERATED HOOK</Text>
                  <Text style={styles.livePreviewText}>“{customizedLiveText}”</Text>
                  <View style={styles.charCountRow}>
                    <Text style={styles.charCountText}>{customizedLiveText.length} characters</Text>
                    <Text style={styles.stopRatePill}>🔥 Optimal Hook Length</Text>
                  </View>
                </View>

                {/* Variable Inputs */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.variableSectionTitle}>Fill In The Formula Variables</Text>
                  {activeCustomizingHook?.variables.map((variable) => (
                    <View key={variable.key} style={{ marginBottom: 12 }}>
                      <Text style={styles.inputFieldLabel}>[{variable.label}]</Text>
                      <TextInput
                        style={styles.inputFieldText}
                        placeholder={variable.placeholder}
                        placeholderTextColor="#94A3B8"
                        value={customVariableValues[variable.key] || ''}
                        onChangeText={(txt) => {
                          setCustomVariableValues((prev) => ({
                            ...prev,
                            [variable.key]: txt,
                          }));
                        }}
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pressable
                  style={styles.modalBtnCopy}
                  onPress={() => {
                    setActiveCustomizingHook(null);
                    showToast('📋 Customized hook copied!');
                  }}
                >
                  <Text style={styles.modalBtnCopyText}>📋 Copy</Text>
                </Pressable>

                <Pressable
                  style={styles.modalBtnExportComposer}
                  onPress={() => {
                    const text = customizedLiveText;
                    setActiveCustomizingHook(null);
                    if (onOpenPostComposer) {
                      onOpenPostComposer(text, 'TikTok');
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#582CDB', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGrad}
                  >
                    <Text style={styles.modalBtnGradText}>🎨 Send to Post Composer</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              <Pressable
                style={{ paddingVertical: 10, alignItems: 'center' }}
                onPress={() => {
                  const text = customizedLiveText;
                  setActiveCustomizingHook(null);
                  if (onOpenScript) {
                    onOpenScript(text);
                  }
                }}
              >
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '700' }}>
                  📝 Open in Script Generator
                </Text>
              </Pressable>
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

        {/* User Profile Modal */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => {
            if (onSaveProfile) onSaveProfile(updated);
          }}
        />

        {/* Floating Bottom Tab Bar */}
        <FloatingTabBar
          activeTab="create"
          onTabPress={(tab) => {
            if (onNavigateTab) onNavigateTab(tab);
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
    backgroundColor: '#FAF8F5',
  },

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: sFont(10),
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileAvatarWrapper: {
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
  headerUserAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  avatarTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 112,
  },

  // HERO SECTION
  topTitlesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  goldScriptBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  goldScriptBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  mainTitleText: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 4,
  },
  mainSubText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  purplePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  purplePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  goldPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goldPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // SEGMENTED TAB SWITCHER
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 13,
    padding: 3.5,
    marginBottom: 16,
    gap: 4,
  },
  tabSwitcherBtn: {
    flex: 1,
    paddingVertical: 9.5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabSwitcherBtnActive: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  tabSwitcherBtnText: {
    fontSize: sFont(12),
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  tabSwitcherBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // LIBRARY PROMO CARD
  libraryPromoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  libraryPromoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  libraryPromoSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  libraryPromoBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  libraryPromoBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // CARD 1: SELECTED IDEA
  selectedIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    marginBottom: 16,
  },
  selectedIdeaTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  selectedIdeaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginVertical: 4,
    lineHeight: 22,
  },
  selectedIdeaSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  tagsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  ideaTagPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ideaTagPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  ideaBottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
    gap: 8,
  },
  retentionOptText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flexShrink: 0,
  },
  reSelectIdeaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  proAccelerateBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  proAccelerateBtnActive: {
    backgroundColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  proAccelerateBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  proAccelerateBtnTextActive: {
    color: '#FFFFFF',
  },

  // CARD 2: HOOK QUALITY SCORE
  scoreHighlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    marginBottom: 16,
  },
  scoreCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  aiEvaluatedBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  aiEvaluatedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  scoreGaugeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreGaugeNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 24,
  },
  scoreGaugeDenom: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  meterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  meterVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
  },
  meterTrack: {
    height: 6,
    backgroundColor: '#F1EFE9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 6,
  },
  insightCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  insightCalloutText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
    fontStyle: 'italic',
  },

  // CARD 3: HOOK OPTIONS
  sectionHeaderRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  generateMoreLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  hookOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  hookOptionCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
  },
  hookOptionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  hookBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    flexShrink: 0,
  },
  hookBadgeActive: {
    backgroundColor: '#582CDB',
  },
  hookBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#582CDB',
  },
  hookBadgeTextActive: {
    color: '#FFFFFF',
  },
  hookTypeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    flexShrink: 1,
    textAlign: 'right',
  },
  hookOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#171420',
    lineHeight: 19,
    marginBottom: 12,
  },
  hookOptionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyHookBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyHookBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  applyHookBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  applyHookBtnTextActive: {
    color: '#FFFFFF',
  },
  useInComposerBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  useInComposerBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 4: 200+ LIBRARY
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    color: '#171420',
    fontSize: 13,
    marginLeft: 8,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  platformChipActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  platformChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  platformChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  categoryCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: '#F1EFE9',
  },
  categoryCountPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  categoryCountText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  categoryCountTextActive: {
    color: '#FFFFFF',
  },

  // Formula Cards
  formulaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 5,
    flexShrink: 1,
  },
  categoryTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  retentionPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  retentionPillText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
  cardBookmarkBtn: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  formulaHookTitle: {
    color: '#171420',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  blueprintBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 8,
  },
  blueprintLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  blueprintText: {
    color: '#582CDB',
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  exampleLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  exampleText: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  psychologyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  psychologyLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 0,
    lineHeight: 16,
  },
  psychologyVal: {
    color: '#171420',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    lineHeight: 16,
  },
  platformBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  platformMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformMiniBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  cardActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
    paddingTop: 10,
  },
  cardBtn: {
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnSecondary: {
    flex: 0.7,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  cardBtnSecondaryText: {
    color: '#171420',
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardBtnCustomize: {
    flex: 1.15,
    backgroundColor: '#EDE9FE',
  },
  cardBtnCustomizeText: {
    color: '#582CDB',
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardBtnPrimary: {
    flex: 1.25,
    backgroundColor: '#582CDB',
  },
  cardBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },

  // Empty state
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyStateTitle: {
    color: '#171420',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal Customizer
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 48 : 20,
    paddingBottom: Platform.OS === 'web' ? 48 : 20,
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexShrink: 0,
  },
  modalTitle: {
    color: '#171420',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 14,
    flexShrink: 0,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    color: '#171420',
    fontSize: 14,
    fontWeight: '700',
  },
  livePreviewCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 14,
    marginBottom: 16,
  },
  livePreviewLabel: {
    color: '#582CDB',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  livePreviewText: {
    color: '#171420',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCountText: {
    color: '#64748B',
    fontSize: 11,
  },
  stopRatePill: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  variableSectionTitle: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputFieldLabel: {
    color: '#582CDB',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputFieldText: {
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#171420',
    fontSize: 13,
  },
  modalBtnCopy: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCopyText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnExportComposer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalBtnGrad: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnGradText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // EXPLORE 5 FORMULAS VAULT CARD
  exploreVaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  exploreVaultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exploreVaultIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreVaultCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  exploreVaultCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  exploreVaultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  exploreVaultSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },
  exploreVaultActionBtn: {
    width: '100%',
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreVaultActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },

  // BOTTOM PRIMARY ACTIONS
  bottomActionsStack: {
    gap: 10,
    marginTop: 6,
    marginBottom: 0,
  },
  bottomPrimaryBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomPrimaryBtnGrad: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  bottomSecondaryBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  bottomSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },

  // EXPLORE MODAL SPECIFIC STYLES
  exploreModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
  },
  modalCategoryChipsWrapper: {
    marginBottom: 12,
    flexShrink: 0,
    width: '100%',
  },
  modalCategoryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  modalFormulasScrollView: {
    flexShrink: 1,
    width: '100%',
  },
  modalCatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 6,
  },
  modalCatChipActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  modalCatChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalCatChipTextActive: {
    color: '#FFFFFF',
  },
  modalCatCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: '#F1EFE9',
  },
  modalCatCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  modalCatCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  modalCatCountTextActive: {
    color: '#FFFFFF',
  },
  exploreHeaderActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
  },
  exploreCountLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  quickRegenBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickRegenBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  exploreModalBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
    flexShrink: 0,
  },
  modalRegenerateFullBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalRegenGrad: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRegenGradText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalDoneBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },

  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
