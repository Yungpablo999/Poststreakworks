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

interface StructureStepItem {
  step: number;
  title: string;
  timing: string;
  focus: string;
  snippet: string;
  visualCue: string;
  voicePacing: string;
  editingCue: string;
}

const STRUCTURE_STEPS: StructureStepItem[] = [
  {
    step: 1,
    title: 'Hook',
    timing: '0–3s',
    focus: '3-sec thumbstopper',
    snippet: '“Most new creators do not fail because they lack ideas. They fail because they wait too long to post.”',
    visualCue: 'Direct-to-camera punch-in (1.1x) in the first 0.8s to create an immediate visual interruption.',
    voicePacing: 'High urgency, confident assertive cadence with zero pre-intro silence.',
    editingCue: 'Kinetic text overlay on screen with subtle sound pop on the first 3 words.',
  },
  {
    step: 2,
    title: 'Mistake 1',
    timing: '3–14s',
    focus: 'Problem #1 reveal',
    snippet: '“Waiting for the perfect idea. It doesn’t exist. Good ideas come from publishing through the average ones.”',
    visualCue: 'Direct-to-camera crop shift with on-screen bold keyword callout.',
    voicePacing: 'Assertive, conversational tempo; keep transitions tight without dead air.',
    editingCue: 'Quick jump cut on “Mistake 1”, followed by a subtle woosh transition.',
  },
  {
    step: 3,
    title: 'Mistake 2',
    timing: '14–25s',
    focus: 'Friction point',
    snippet: '“Over-editing for 6 hours. If you’re spending six hours editing every post, you’re making consistency much harder than it needs to be.”',
    visualCue: 'Angle switch or quick b-roll cut to editing timeline / screen capture.',
    voicePacing: 'Relatable tone, slight cadence drop to deliver the reality check with impact.',
    editingCue: 'Speed ramp or split-screen highlight at the 18-second retention check.',
  },
  {
    step: 4,
    title: 'Mistake 3',
    timing: '25–36s',
    focus: 'Systems bottleneck',
    snippet: '“Zero system. Re-inventing the wheel every morning leads directly to creator burnout.”',
    visualCue: 'Medium close-up framing with side-panel graphic showing workflow steps.',
    voicePacing: 'Grounded, authoritative cadence; emphasize the word “System” for weight.',
    editingCue: 'Highlight pill animation on screen to visually lock in the main takeaway.',
  },
  {
    step: 5,
    title: 'CTA',
    timing: '36–42s',
    focus: 'Engagement question',
    snippet: '“Which of these three is slowing you down the most? Let me know in the comments.”',
    visualCue: 'Direct eye contact, natural hand gesture pointing toward the comment section below.',
    voicePacing: 'Warm, inviting, open-ended question designed to encourage comments.',
    editingCue: 'Animated comment prompt sticker + clean sound chime.',
  },
];

interface ScriptSectionBlock {
  id: string;
  tag: string;
  timing: string;
  content: string;
  placeholder?: string;
}

const INITIAL_SCRIPT_SECTIONS: ScriptSectionBlock[] = [
  {
    id: 'hook',
    tag: 'HOOK',
    timing: '0–3s',
    content: 'Most new creators do not fail because they lack ideas. They fail because they wait too long to post.',
    placeholder: 'Hook script...',
  },
  {
    id: 'mistake1',
    tag: 'MISTAKE 1',
    timing: '3–14s',
    content: 'Waiting for the "Perfect Idea". It doesn\'t exist. Good ideas come from publishing through the average ones.',
    placeholder: 'Mistake 1 breakdown...',
  },
  {
    id: 'mistake2',
    tag: 'MISTAKE 2',
    timing: '14–25s',
    content: 'Over-editing for 6 hours. If you’re spending six hours editing every post, you’re making consistency much harder than it needs to be.',
    placeholder: 'Mistake 2 breakdown...',
  },
  {
    id: 'mistake3',
    tag: 'MISTAKE 3',
    timing: '25–36s',
    content: 'Zero system. Starting from scratch every single time leads directly to creator burnout.',
    placeholder: 'Mistake 3 breakdown...',
  },
  {
    id: 'cta',
    tag: 'CTA',
    timing: '36–42s',
    content: 'Which of these three is slowing you down the most? Let me know in the comments.',
    placeholder: 'Call to action...',
  },
];

interface ProScriptScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenVoiceStudio?: (scriptText?: string, scriptTitle?: string) => void;
  onOpenPostComposer?: (scriptTitle?: string, platform?: string) => void;
  onOpenIdeaAngle?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const ProScriptScreen: React.FC<ProScriptScreenProps> = ({
  ideaTitle,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenVoiceStudio,
  onOpenPostComposer,
  onOpenIdeaAngle,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  // Dynamically compute font size so 38 characters fit on a single line on any device screen without truncation
  const titleFontSize = Math.min(19, Math.max(14, (windowWidth - 44) / 21));

  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Script State
  const [currentIdeaTitle, setCurrentIdeaTitle] = useState(
    ideaTitle || '3 mistakes that slow down new creators'
  );

  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [hookOptions, setHookOptions] = useState([
    {
      badge: 'BEST PERFORMING',
      text: 'Most new creators do not fail because they lack ideas. They fail because they wait too long to post.',
      type: 'Direct • High Hook Potential',
    },
    {
      badge: 'CURIOSITY GAP',
      text: 'Stop making these 3 mistakes if you want to grow consistently.',
      type: 'Curiosity • Loss Aversion',
    },
    {
      badge: 'AUTHORITY',
      text: 'Your problem is not the algorithm, it’s your posting system.',
      type: 'Contrarian • High Authority',
    },
  ]);

  const [scriptSections, setScriptSections] = useState<ScriptSectionBlock[]>(INITIAL_SCRIPT_SECTIONS);

  // Computes unified script text for Voice Studio and Draft exports
  const getFullScriptText = () => {
    return scriptSections.map(s => `[${s.tag}] ${s.content}`).join('\n\n');
  };

  const handleUpdateSectionContent = (id: string, newContent: string) => {
    setScriptSections(prev =>
      prev.map(section => (section.id === id ? { ...section, content: newContent } : section))
    );
  };

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isAccelerated, setIsAccelerated] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('9:16 (42s)');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [expandedStructureIndex, setExpandedStructureIndex] = useState<number | null>(null);
  const [completionData, setCompletionData] = useState({
    title: 'Script Saved to Drafts!',
    subtitle: `"${currentIdeaTitle}" is ready for Voice Studio or immediate posting.`,
    badgeText: '✨ SCRIPT READY (+50 XP)',
    xpEarned: 50,
    speechBubble: 'Script polished to perfection, Pablo! Ready to record! 🎙️',
  });

  const handleToggleStructureRow = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedStructureIndex(prev => (prev === index ? null : index));
  };

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

  const handleApplyHook = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedHookIndex(index);
    const chosenHook = hookOptions[index].text;
    setScriptSections(prev =>
      prev.map(section => (section.id === 'hook' ? { ...section, content: chosenHook } : section))
    );
    showToast(`✓ Applied Hook #${index + 1}`);
  };

  const handleGenerateMoreHooks = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setHookOptions([
      {
        badge: 'VIRAL HOOK',
        text: 'The #1 reason creator accounts stay stuck under 1,000 views is this single mistake.',
        type: 'High Urgency • Hook Potential',
      },
      {
        badge: 'STORY HOOK',
        text: 'I used to spend 5 hours editing one reel until I learned this 10-minute rule.',
        type: 'Relatable • Case Study',
      },
      {
        badge: 'CONTRARIAN',
        text: 'Consistency isn’t about posting daily. It’s about not letting 3 days pass without data.',
        type: 'Thought Leadership',
      },
    ]);
    showToast('✨ Jarvis generated 3 new viral hooks!');
  };

  const handleMakeShorter = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScriptSections(prev =>
      prev.map(s => {
        if (s.id === 'hook') return { ...s, content: 'Most new creators fail because they wait too long to post.' };
        if (s.id === 'mistake1') return { ...s, content: 'Waiting for the "Perfect Idea". Good ideas come from shipping through average ones.' };
        if (s.id === 'mistake2') return { ...s, content: 'Over-editing for 6 hours. High volume beats overthinking every time.' };
        if (s.id === 'mistake3') return { ...s, content: 'Zero system. Starting from scratch every morning creates burnout.' };
        if (s.id === 'cta') return { ...s, content: 'Which one is slowing you down? Drop 1, 2, or 3 below.' };
        return s;
      })
    );
    showToast('✂️ Trimmed script duration to 30s');
  };

  const handleMakePunchier = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScriptSections(prev =>
      prev.map(s => {
        if (s.id === 'hook') return { ...s, content: 'You are not failing because you lack ideas. You are failing because you hesitate to post.' };
        if (s.id === 'mistake1') return { ...s, content: 'Waiting for perfection. The only way to find great ideas is publishing through average ones.' };
        if (s.id === 'mistake2') return { ...s, content: 'Spending 6 hours on an edit. Stop over-tweaking and start shipping.' };
        if (s.id === 'mistake3') return { ...s, content: 'No repeatable workflow. If you rebuild the wheel daily, you burn out.' };
        if (s.id === 'cta') return { ...s, content: 'Which mistake is holding you back? Comment 1, 2, or 3.' };
        return s;
      })
    );
    showToast('💥 Boosted hook and delivery cadence');
  };

  const handleAddHumor = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScriptSections(prev =>
      prev.map(s => {
        if (s.id === 'mistake1') return { ...s, content: 'Waiting for the "perfect idea"—while your drafts folder has 47 unfinished reels and your ego protects them like state secrets.' };
        if (s.id === 'cta') return { ...s, content: 'Be honest—are you guilty of 1, 2, or all 3? Drop your confession below.' };
        return s;
      })
    );
    showToast('😄 Injected relatable creator punchline');
  };

  const handleImproveFlow = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScriptSections(prev =>
      prev.map(s => {
        if (s.id === 'mistake1') return { ...s, content: 'Waiting for the "Perfect Idea". Here’s the truth: good ideas come from publishing through average ones.' };
        if (s.id === 'mistake2') return { ...s, content: 'Over-editing for 6 hours. Spending six hours editing every post makes consistency impossible.' };
        return s;
      })
    );
    showToast('🌊 Smoothed transitions between scenes');
  };

  const handlePolishWithJarvis = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setScriptSections(INITIAL_SCRIPT_SECTIONS);
    showToast('🪄 Script polished with Jarvis AI!');
  };

  const handleSaveDraft = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Script Saved to Drafts!',
      subtitle: `"${currentIdeaTitle}" is secured in your production pipeline.`,
      badgeText: '✨ SCRIPT SECURED (+50 XP)',
      xpEarned: 50,
      speechBubble: 'Draft locked in, Pablo! Ready to record whenever you are! 🎙️',
    });
    setShowCompletionModal(true);
  };

  const handleSendToVoiceStudio = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onOpenVoiceStudio) {
      onOpenVoiceStudio(getFullScriptText(), currentIdeaTitle);
    } else {
      showToast('🎙️ Loaded script into Pro Voice Studio');
    }
  };

  const handleUseAsPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onOpenPostComposer) {
      onOpenPostComposer(currentIdeaTitle, 'Instagram');
    } else {
      showToast('✨ Opened in Post Composer');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />

        {/* 1. TOP HEADER BAR */}
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
                if (onOpenMessages) onOpenMessages();
                else if (onNavigateTab) onNavigateTab('match');
              }}
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

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HERO TITLES & BADGES */}
          <View style={styles.topTitlesSection}>
            <View style={styles.goldScriptBadge}>
              <Text style={styles.goldScriptBadgeText}>PRO SCRIPT ENGINE</Text>
            </View>

            <Text
              style={[
                styles.mainTitleText,
                { fontSize: titleFontSize, letterSpacing: -0.3 },
              ]}
            >
              Build a script that holds attention.
            </Text>
            <Text style={styles.mainSubText}>
              Build stronger Hooks, Bodies and CTAs with pacing and retention strategy.
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Pro Script Generator</Text>
              </View>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>Pacing Ready</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: SELECTED IDEA                                        */}
          {/* ============================================================ */}
          <View style={styles.selectedIdeaCard}>
            <Text style={styles.selectedIdeaTag}>SELECTED IDEA</Text>
            <Text style={styles.selectedIdeaTitle}>&ldquo;{currentIdeaTitle}&rdquo;</Text>
            <Text style={styles.selectedIdeaSub}>
              A short-form creator advice post explaining common mistakes that stop creators from posting consistently.
            </Text>

            <View style={styles.tagsPillsRow}>
              {['Creator Advice', 'High-Reach Reel', 'Short-form Video', 'Mistake Breakdown'].map((tag) => (
                <View key={tag} style={styles.ideaTagPill}>
                  <Text style={styles.ideaTagPillText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ideaBottomActionRow}>
              <Pressable
                onPress={() => {
                  if (onOpenIdeaAngle) onOpenIdeaAngle();
                  else showToast('Re-selecting idea...');
                }}
                hitSlop={8}
              >
                <Text style={styles.reSelectIdeaText}>RE-SELECT IDEA</Text>
              </Pressable>

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
                      title: 'Pro Script Accelerated!',
                      subtitle: `"${currentIdeaTitle}" optimized with AI retention pacing & viral hook multiplier.`,
                      badgeText: '⚡ PRO SCRIPT ACCELERATED',
                      xpEarned: 50,
                      speechBubble: 'Maximum velocity unlocked, Pablo! Pacing & retention boosted to 94%! 🔥',
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
                >
                  {isAccelerated ? '⚡ ACCELERATED ✓' : 'PRO ACCELERATE'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 2: SCRIPT QUALITY SCORE                                 */}
          {/* ============================================================ */}
          <View style={styles.scoreHighlightCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.scoreCardLabel}>SCRIPT QUALITY SCORE</Text>
              <View style={styles.aiEvaluatedBadge}>
                <Text style={styles.aiEvaluatedBadgeText}>AI EVALUATED</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
              {/* Circular Gauge */}
              <View style={styles.scoreGaugeCircle}>
                <Text style={styles.scoreGaugeNum}>88</Text>
                <Text style={styles.scoreGaugeDenom}>/100</Text>
              </View>

              {/* Dual Meters */}
              <View style={{ flex: 1, gap: 10 }}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={styles.meterLabel}>HOOK STRENGTH</Text>
                    <Text style={styles.meterVal}>92%</Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: '92%', backgroundColor: '#582CDB' }]} />
                  </View>
                </View>

                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={styles.meterLabel}>PACING SCORE</Text>
                    <Text style={styles.meterVal}>84%</Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: '84%', backgroundColor: '#582CDB' }]} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.insightCalloutBox}>
              <Text style={{ fontSize: 13, marginRight: 6 }}>📍</Text>
              <Text style={styles.insightCalloutText}>
                &ldquo;First hook is strong, but the CTA can be sharper to drive more comments.&rdquo;
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 3: HOOK OPTIONS                                         */}
          {/* ============================================================ */}
          <View style={[styles.sectionHeaderRowBetween, { marginTop: 20 }]}>
            <Text style={styles.sectionHeaderTitle}>HOOK OPTIONS</Text>
          </View>

          <View style={{ gap: 8, marginTop: 6 }}>
            {hookOptions.map((hook, index) => {
              const isSelected = selectedHookIndex === index;
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.hookOptionCard,
                    isSelected && styles.hookOptionCardSelected,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleApplyHook(index)}
                >
                  {isSelected && (
                    <View style={styles.bestPerformingBadge}>
                      <Text style={styles.bestPerformingBadgeText}>{hook.badge}</Text>
                    </View>
                  )}
                  <Text style={[styles.hookOptionText, isSelected && styles.hookOptionTextSelected]}>
                    &ldquo;{hook.text}&rdquo;
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={styles.hookOptionType}>{hook.type}</Text>
                    {isSelected ? (
                      <View style={styles.activeHookPill}>
                        <Text style={styles.activeHookPillText}>Active Hook ✓</Text>
                      </View>
                    ) : (
                      <Text style={styles.tapToUseText}>Tap to use →</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              style={({ pressed }) => [styles.generateMoreHooksBtn, pressed && styles.btnPressed]}
              onPress={handleGenerateMoreHooks}
            >
              <Text style={styles.generateMoreHooksBtnText}>GENERATE MORE</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 4: SCRIPT STRUCTURE TIMELINE                            */}
          {/* ============================================================ */}
          <View style={[styles.sectionHeaderRowBetween, { marginTop: 22 }]}>
            <Text style={styles.sectionHeaderTitle}>SCRIPT STRUCTURE</Text>
            <View style={styles.durationOptimalPill}>
              <Text style={styles.durationOptimalPillText}>⏱ 42 SECONDS • OPTIMIZED</Text>
            </View>
          </View>

          <View style={styles.structureTimelineCard}>
            {STRUCTURE_STEPS.map((item, idx) => {
              const isExpanded = expandedStructureIndex === idx;
              const isLast = idx === STRUCTURE_STEPS.length - 1;

              return (
                <View
                  key={item.step}
                  style={[
                    styles.timelineItemWrapper,
                    isExpanded && styles.timelineItemWrapperExpanded,
                    !isLast && !isExpanded && styles.timelineItemBorderBottom,
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.timelineRowItem,
                      pressed && styles.timelineRowItemPressed,
                    ]}
                    onPress={() => handleToggleStructureRow(idx)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    accessibilityLabel={`${item.title}, ${item.timing}, ${item.focus}. ${
                      isExpanded ? 'Tap to collapse' : 'Tap to expand production cues'
                    }`}
                  >
                    <View
                      style={[
                        styles.timelineNumCircle,
                        (isExpanded || item.step === 1) && styles.timelineNumCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timelineNumText,
                          (isExpanded || item.step === 1) && styles.timelineNumTextActive,
                        ]}
                      >
                        {item.step}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.timelineItemTitle}>{item.title}</Text>
                        <View style={styles.timelineTimingBadge}>
                          <Text style={styles.timelineTimingBadgeText}>{item.timing}</Text>
                        </View>
                      </View>
                      <Text style={styles.timelineItemTiming}>{item.focus}</Text>
                    </View>

                    <View style={styles.timelineChevronContainer}>
                      <Text style={styles.timelineChevronText}>{isExpanded ? '⌄' : '›'}</Text>
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.timelineExpandedContent}>
                      {/* Spoken Snippet Box */}
                      <View style={styles.timelineSnippetBox}>
                        <Text style={styles.timelineSnippetLabel}>SPOKEN FOCUS</Text>
                        <Text style={styles.timelineSnippetText}>{item.snippet}</Text>
                      </View>

                      {/* Production Cues Card */}
                      <View style={styles.timelineCuesBox}>
                        <View style={styles.timelineCueRow}>
                          <View style={styles.timelineCueIconBadge}>
                            <Text style={styles.timelineCueIcon}>🎥</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.timelineCueTitle}>Visual Direction</Text>
                            <Text style={styles.timelineCueBody}>{item.visualCue}</Text>
                          </View>
                        </View>

                        <View style={styles.timelineCueDivider} />

                        <View style={styles.timelineCueRow}>
                          <View style={styles.timelineCueIconBadge}>
                            <Text style={styles.timelineCueIcon}>🎙️</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.timelineCueTitle}>Voice Pacing</Text>
                            <Text style={styles.timelineCueBody}>{item.voicePacing}</Text>
                          </View>
                        </View>

                        <View style={styles.timelineCueDivider} />

                        <View style={styles.timelineCueRow}>
                          <View style={styles.timelineCueIconBadge}>
                            <Text style={styles.timelineCueIcon}>✂️</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.timelineCueTitle}>Editing Cue</Text>
                            <Text style={styles.timelineCueBody}>{item.editingCue}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ============================================================ */}
          {/* CARD 5: SCRIPT BODY (Interactive Section Editor)             */}
          {/* ============================================================ */}
          <View style={[styles.sectionHeaderRowBetween, { marginTop: 22 }]}>
            <Text style={styles.sectionHeaderTitle}>SCRIPT BODY</Text>
            <View style={styles.editorCountBadge}>
              <Text style={styles.editorCountBadgeText}>6 SECTIONS</Text>
            </View>
          </View>

          <View style={styles.scriptBodyCard}>
            {scriptSections.map((section, index) => {
              const isLast = index === scriptSections.length - 1;
              return (
                <View
                  key={section.id}
                  style={[
                    styles.editorSectionBlock,
                    !isLast && styles.editorSectionDivider,
                  ]}
                >
                  <View style={styles.editorSectionHeaderRow}>
                    <View style={styles.editorSectionTagBadge}>
                      <Text style={styles.editorSectionTagText}>[{section.tag}]</Text>
                    </View>
                    <Text style={styles.editorSectionTimingText}>{section.timing}</Text>
                  </View>

                  <TextInput
                    style={styles.editorSectionTextInput}
                    multiline
                    scrollEnabled={false}
                    value={section.content}
                    onChangeText={(text) => handleUpdateSectionContent(section.id, text)}
                    placeholder={section.placeholder || `Enter ${section.tag.toLowerCase()}...`}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              );
            })}

            {/* AI Rewriters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.editorRewritersScroll}
            >
              {[
                { label: 'Make Shorter', action: handleMakeShorter },
                { label: 'Make Punchier', action: handleMakePunchier },
                { label: 'Add Humor', action: handleAddHumor },
                { label: 'Improve Flow', action: handleImproveFlow },
              ].map((pill, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [styles.quickRewritePill, pressed && styles.btnPressed]}
                  onPress={pill.action}
                >
                  <Text style={styles.quickRewritePillText}>{pill.label}</Text>
                </Pressable>
              ))}

              <Pressable
                style={({ pressed }) => [styles.aiPolishPillBtn, pressed && styles.btnPressed]}
                onPress={handlePolishWithJarvis}
              >
                <Text style={styles.aiPolishPillBtnText}>🪄 AI Polish with Jarvis</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* CARD 6: ESTIMATE METRICS                                     */}
          {/* ============================================================ */}
          <View style={styles.estimateCard}>
            <Text style={styles.estimateCardHeaderLabel}>ESTIMATE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
              <Text style={styles.estimateBigNum}>42s</Text>
              <Text style={styles.estimateUnitText}> Est. Duration</Text>
            </View>
            <Text style={styles.estimateSubText}>
              {scriptSections.reduce(
                (acc, s) => acc + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0),
                0
              )}{' '}
              WORDS • 2.9 W/S
            </Text>

            <View style={styles.estimateMetricsRow}>
              <Text style={styles.estimateMetricLabel}>Pacing: <Text style={styles.estimateMetricVal}>91%</Text></Text>
              <Text style={styles.estimateMetricLabel}>Clarity: <Text style={styles.estimateMetricVal}>High</Text></Text>
              <Text style={styles.estimateMetricLabel}>CTA: <Text style={styles.estimateMetricVal}>87%</Text></Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 7: MULTI-PLATFORM READY                                 */}
          {/* ============================================================ */}
          <View style={styles.formatAdaptCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.formatAdaptHeaderLabel}>MULTI-PLATFORM READY</Text>
              <View style={styles.formatActiveBadge}>
                <Text style={styles.formatActiveBadgeText}>👑 9:16 HD</Text>
              </View>
            </View>

            {/* Platform Selection Row */}
            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
              {[
                { id: 'tiktok', name: 'TikTok', icon: 'tiktok' as const },
                { id: 'instagram', name: 'Instagram', icon: 'instagram' as const },
                { id: 'youtube', name: 'YouTube', icon: 'youtube' as const },
              ].map((plat) => {
                const isSelected = selectedPlatforms.includes(plat.id);
                return (
                  <Pressable
                    key={plat.id}
                    style={({ pressed }) => [
                      styles.platformFormatPillCard,
                      isSelected ? styles.platformFormatPillCardSelected : styles.platformFormatPillCardUnselected,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      if (isSelected) {
                        if (selectedPlatforms.length > 1) {
                          setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat.id));
                          showToast(`Removed ${plat.name} from publishing destinations`);
                        } else {
                          showToast('At least 1 publishing destination must remain selected');
                        }
                      } else {
                        setSelectedPlatforms([...selectedPlatforms, plat.id]);
                        showToast(`✓ Selected ${plat.name} as destination`);
                      }
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${plat.name}, connected account. ${
                      isSelected ? 'Selected destination for this script' : 'Tap to select as destination'
                    }`}
                  >
                    <View style={styles.platCardTopRow}>
                      <View style={styles.platIconWrapper}>
                        <SocialBrandIcon platform={plat.icon} size={17} />
                        <View style={styles.platConnectedDot} />
                      </View>
                      <View style={[styles.platCheckCircle, isSelected && styles.platCheckCircleActive]}>
                        {isSelected && (
                          <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                            <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </View>
                    </View>

                    <Text style={styles.platFormatName} numberOfLines={1}>
                      {plat.name}
                    </Text>

                    <View
                      style={[
                        styles.platStatusBadge,
                        isSelected ? styles.platStatusBadgeSelected : styles.platStatusBadgeUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.platStatusBadgeText,
                          isSelected ? styles.platStatusBadgeTextSelected : styles.platStatusBadgeTextUnselected,
                        ]}
                        numberOfLines={1}
                      >
                        {isSelected ? 'Selected' : 'Connected'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Format Style Selector Chips */}
            <Text style={styles.formatPresetsLabel}>SCRIPT PACING PRESET</Text>
            <View style={styles.formatPresetsRow}>
              {[
                { id: '9:16 (42s)', label: '9:16 (42s)' },
                { id: 'Carousel (6p)', label: 'Carousel (6p)' },
                { id: 'X Thread', label: 'X Thread' },
              ].map((fmt) => (
                <Pressable
                  key={fmt.id}
                  style={[
                    styles.formatPresetChip,
                    selectedFormat === fmt.id && styles.formatPresetChipActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedFormat(fmt.id);
                    showToast(`✓ Switched preset: ${fmt.label}`);
                  }}
                >
                  <Text
                    style={[
                      styles.formatPresetChipText,
                      selectedFormat === fmt.id && styles.formatPresetChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {fmt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Dynamic Adapt Action Button */}
            <Pressable
              style={({ pressed }) => [styles.adaptBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                showToast(`✨ Script adapted for ${selectedPlatforms.map(p => p.toUpperCase()).join(' + ')}!`);
              }}
            >
              <Text style={styles.adaptBtnText} numberOfLines={1}>✨ Adapt &amp; Optimize Format ➔</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 8: RETENTION NOTES                                      */}
          {/* ============================================================ */}
          <View style={styles.retentionNotesCard}>
            <Text style={styles.retentionNotesHeaderLabel}>RETENTION NOTES</Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {[
                { icon: '✓', text: 'First 3s hook designed to strengthen early retention' },
                { icon: '⚡', text: 'Pattern interrupts placed at 14s & 25s transitions' },
                { icon: '💡', text: 'Duration optimized for a smoother loop' },
                { icon: '💬', text: 'Question CTA designed to encourage comments' },
              ].map((note, nIdx) => (
                <View key={nIdx} style={styles.retentionRow}>
                  <View style={styles.retentionIconBox}>
                    <Text style={styles.retentionIconText}>{note.icon}</Text>
                  </View>
                  <Text style={styles.retentionNoteText}>
                    {note.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 9: VOICE PREVIEW (WAVELENGTH VISUALIZER)                */}
          {/* ============================================================ */}
          <View style={styles.voicePreviewCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.voicePreviewHeaderLabel}>VOICE PREVIEW</Text>
              <Text style={styles.voicePreviewSubLabel}>124 WORDS • 42s</Text>
            </View>
            <Text style={styles.voicePreviewSubDetail}>READY FOR ONE-CLICK SYNTHESIS</Text>

            <View style={styles.voicePreviewBox}>
              <Text style={styles.voicePreviewBoxTitle}>Energetic Studio Voice • 1.0x</Text>

              {/* Continuous Acoustic Sound Wavelength */}
              <View style={styles.previewWavelengthRow}>
                {[
                  8, 14, 24, 18, 32, 44, 36, 22, 48, 58, 46, 30, 62, 50, 34, 56,
                  42, 26, 48, 60, 46, 32, 52, 42, 28, 46, 56, 44, 30, 42, 50, 36,
                  24, 40, 52, 38, 24, 34, 26, 16, 28, 18, 12, 18, 12, 8,
                ].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.previewWavelengthBar,
                      {
                        height: isPlayingPreview
                          ? Math.max(6, Math.min(42, h * (0.6 + Math.sin(i * 0.4) * 0.4)))
                          : Math.max(6, h * 0.6),
                        backgroundColor: i % 3 === 0 ? '#F59E0B' : '#582CDB',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.applyVoiceStudioBtn, pressed && styles.btnPressed]}
              onPress={handleSendToVoiceStudio}
            >
              <Text style={styles.applyVoiceStudioBtnText}>🎙️ SEND TO VOICE STUDIO</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 10: STREAK & XP IMPACT                                  */}
          {/* ============================================================ */}
          <View style={styles.streakCard}>
            <Text style={styles.streakCardHeaderLabel}>STREAK &amp; XP IMPACT</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={styles.streakValText}>🔥 {userProfile?.streakCount || 1} Day{userProfile?.streakCount === 1 ? '' : 's'} Streak</Text>
              <Text style={styles.xpValText}>⚡ +50 XP on Publish</Text>
            </View>

            <View style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.postProgressLabel}>TODAY’S POST PROGRESS</Text>
                <Text style={styles.postProgressVal}>75%</Text>
              </View>
              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: '75%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 11: JARVIS CREATOR COACH CARD                           */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#EDE9FE', '#DDD6FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisCoachCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.jarvisCoachIconBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.jarvisCoachTitle}>JARVIS CREATOR COACH</Text>
            </View>

            <Text style={styles.jarvisCoachQuote}>
              &ldquo;The script is strong, but the CTA should be sharper. Ask a question to encourage viewers to comment exactly how to respond.&rdquo;
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['SHORTEN CTA', 'CHANGE HOOK', 'ALTERNATIVE SCENE'].map((chip) => (
                <Pressable
                  key={chip}
                  style={styles.coachChip}
                  onPress={() => showToast(`✓ Applied: ${chip}`)}
                >
                  <Text style={styles.coachChipText}>{chip}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.improveScriptBtn, pressed && styles.btnPressed]}
              onPress={handlePolishWithJarvis}
            >
              <Text style={styles.improveScriptBtnText}>IMPROVE SCRIPT</Text>
            </Pressable>
          </LinearGradient>

          {/* ============================================================ */}
          {/* BOTTOM ACTION BUTTONS                                        */}
          {/* ============================================================ */}
          <View style={{ gap: 10, marginTop: 20 }}>
            {/* Primary: SEND TO VOICE STUDIO */}
            <Pressable
              style={({ pressed }) => [styles.sendToVoiceBtn, pressed && styles.btnPressed]}
              onPress={handleSendToVoiceStudio}
            >
              <Text style={styles.sendToVoiceBtnText}>🎙️ SEND TO VOICE STUDIO</Text>
            </Pressable>

            {/* Dual Row: USE AS POST & SAVE DRAFT */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={({ pressed }) => [styles.secondaryDeckBtn, pressed && styles.btnPressed]}
                onPress={handleUseAsPost}
              >
                <Text style={styles.secondaryDeckBtnText}>USE AS POST</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryDeckBtn, pressed && styles.btnPressed]}
                onPress={handleSaveDraft}
              >
                <Text style={styles.secondaryDeckBtnText}>SAVE DRAFT</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* 3. FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setActiveTab(tab);
            if (onNavigateTab) onNavigateTab(tab);
          }}
        />

        {/* USER PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => {
            if (onSaveProfile) onSaveProfile(updated);
          }}
        />

        {/* NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Script Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.modalAlertItem}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#171420' }}>
                    ⚡ 3-Second Hook Retention Spike
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Your first line is optimized for 90%+ TikTok completion.
                  </Text>
                </View>
              </View>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
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
    fontSize: 23,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
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
  },
  reSelectIdeaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  proAccelerateBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
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

  // CARD 2: SCRIPT QUALITY SCORE
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
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
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
  hookOptionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  hookOptionCardSelected: {
    backgroundColor: '#FEFCE8',
    borderColor: '#F59E0B',
  },
  bestPerformingBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  bestPerformingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  hookOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 18,
  },
  hookOptionTextSelected: {
    fontWeight: '700',
  },
  hookOptionType: {
    fontSize: 11,
    color: '#64748B',
  },
  activeHookPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  activeHookPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
  },
  tapToUseText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  generateMoreHooksBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  generateMoreHooksBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 4: SCRIPT STRUCTURE TIMELINE
  durationOptimalPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  durationOptimalPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  structureTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  timelineItemWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  timelineItemWrapperExpanded: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    marginVertical: 4,
  },
  timelineItemBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F2EC',
  },
  timelineRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  timelineRowItemPressed: {
    opacity: 0.75,
  },
  timelineNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1EFE9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNumCircleActive: {
    backgroundColor: '#582CDB',
  },
  timelineNumText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineNumTextActive: {
    color: '#FFFFFF',
  },
  timelineItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
  },
  timelineTimingBadge: {
    backgroundColor: '#F1EFE9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  timelineTimingBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.2,
  },
  timelineItemTiming: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1.5,
  },
  timelineChevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineChevronText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineExpandedContent: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 2,
  },
  timelineSnippetBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#582CDB',
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 8,
  },
  timelineSnippetLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  timelineSnippetText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 17,
  },
  timelineCuesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  timelineCueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  timelineCueIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F8F6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  timelineCueIcon: {
    fontSize: 12,
  },
  timelineCueTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  timelineCueBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  timelineCueDivider: {
    height: 1,
    backgroundColor: '#F4F2EC',
    marginVertical: 8,
  },

  // CARD 5: SCRIPT BODY (Structured Editor)
  editorCountBadge: {
    backgroundColor: '#F1EFE9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  editorCountBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  scriptBodyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  editorSectionBlock: {
    paddingVertical: 8,
  },
  editorSectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0E9',
    paddingBottom: 10,
    marginBottom: 4,
  },
  editorSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  editorSectionTagBadge: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  editorSectionTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  editorSectionTimingText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  editorSectionTextInput: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    color: '#171420',
    padding: 0,
    margin: 0,
  },
  editorRewritersScroll: {
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  quickRewritePill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  quickRewritePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  aiPolishPillBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 7,
  },
  aiPolishPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 6: ESTIMATE
  estimateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 16,
  },
  estimateCardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  estimateBigNum: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171420',
  },
  estimateUnitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  estimateSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  estimateMetricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  estimateMetricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  estimateMetricVal: {
    fontWeight: '700',
    color: '#171420',
  },

  // CARD 7: FORMAT ADAPT
  formatAdaptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    marginTop: 14,
  },
  formatAdaptHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  formatActiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  formatActiveBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  platformFormatPillCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  platformFormatPillCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#582CDB',
  },
  platformFormatPillCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFECE6',
  },
  platCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  platIconWrapper: {
    position: 'relative',
  },
  platConnectedDot: {
    position: 'absolute',
    bottom: -1,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  platCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platCheckCircleActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platFormatName: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  platStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  platStatusBadgeSelected: {
    backgroundColor: '#EDE9FE',
  },
  platStatusBadgeUnselected: {
    backgroundColor: '#F1F5F9',
  },
  platStatusBadgeText: {
    fontSize: sFont(8.5),
    fontWeight: '700',
  },
  platStatusBadgeTextSelected: {
    color: '#582CDB',
  },
  platStatusBadgeTextUnselected: {
    color: '#64748B',
  },
  formatPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  formatPresetsLabel: {
    fontSize: sFont(9),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  formatPresetChip: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 4,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatPresetChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  formatPresetChipText: {
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },
  formatPresetChipTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  adaptBtn: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  adaptBtnText: {
    fontSize: sFont(12),
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 8: RETENTION NOTES
  retentionNotesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 12,
  },
  retentionNotesHeaderLabel: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  retentionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  retentionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  retentionIconText: {
    fontSize: sFont(11.5),
    fontWeight: '800',
    color: '#582CDB',
  },
  retentionNoteText: {
    fontSize: sFont(12),
    fontWeight: '600',
    lineHeight: 18,
    color: '#171420',
    flex: 1,
  },

  // CARD 9: VOICE PREVIEW
  voicePreviewCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 14,
  },
  voicePreviewHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.4,
  },
  voicePreviewSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  voicePreviewSubDetail: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 1,
  },
  voicePreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  voicePreviewBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 8,
  },
  previewWavelengthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    gap: 2,
  },
  previewWavelengthBar: {
    flex: 1,
    maxWidth: 3.5,
    minWidth: 2,
    borderRadius: 1.5,
  },
  applyVoiceStudioBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  applyVoiceStudioBtnText: {
    color: '#FFFFFF',
    fontSize: sFont(11.5),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // CARD 10: STREAK & XP IMPACT
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 14,
  },
  streakCardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  streakValText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  xpValText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  postProgressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  postProgressVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
  },

  // CARD 11: JARVIS CREATOR COACH
  jarvisCoachCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
  jarvisCoachIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisCoachTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  jarvisCoachQuote: {
    fontSize: 12,
    color: '#171420',
    lineHeight: 18,
    marginVertical: 12,
  },
  coachChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coachChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  improveScriptBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  improveScriptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // BOTTOM ACTION BUTTONS
  sendToVoiceBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sendToVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryDeckBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryDeckBtnText: {
    color: '#171420',
    fontSize: 12,
    fontWeight: '700',
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
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalAlertItem: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
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
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
