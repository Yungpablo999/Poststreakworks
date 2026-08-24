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
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface ScriptScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onUseAsPost?: (scriptData: { hook: string; body: string; takeaway: string; cta: string }) => void;
  onOpenMessages?: () => void;
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
    body: "Convert today's idea into a post to keep your 47-day streak.",
    time: '2h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

const HOOK_PRESETS = [
  {
    type: '🔥 Negative Hook',
    text: 'Stop making this mistake if you want to stay consistent as a creator.',
    desc: 'Triggers loss aversion & immediate scroll stopping.',
  },
  {
    type: '❓ Curiosity Gap',
    text: "If you're struggling to post daily, read this.",
    desc: 'Creates an open loop that viewers need to resolve.',
  },
  {
    type: '💡 Unpopular Truth',
    text: 'The truth about consistency that nobody tells you.',
    desc: 'Positions you as a candid, trusted insider.',
  },
  {
    type: '⚡ High Urgency',
    text: 'Why 90% of creators quit before month 2 (and how to avoid it).',
    desc: 'High retention stat hook for talking-head videos.',
  },
  {
    type: '🎯 Relatable Story',
    text: 'I almost gave up posting until I discovered this 1 simple rule.',
    desc: 'Builds empathy and vulnerability right away.',
  },
];

const BODY_PRESETS = [
  {
    id: 'original',
    title: 'Standard Pacing (30s)',
    tag: 'Balanced',
    text: "We always think we need a massive content plan to start. But in reality, all you need is a lesson you learned yesterday. Most creators overthink the 'Big Idea' and miss the daily progress...",
  },
  {
    id: 'shorter',
    title: 'Short & Punchy (15-20s)',
    tag: '⚡ High Retention',
    text: 'Stop overthinking massive content plans. All you need is one small lesson you learned yesterday. Consistency comes from daily sharing, not waiting for perfection.',
  },
  {
    id: 'personal',
    title: 'Personal Story (35-45s)',
    tag: '🎙 Relatable',
    text: "When I first started, I used to wait days for the 'perfect idea'. That held me back for months. Once I switched to sharing raw lessons from my daily work, everything unlocked.",
  },
  {
    id: 'energetic',
    title: 'High Energy (25-30s)',
    tag: '🔥 Inspiring',
    text: 'Here is the secret top creators do not tell you: massive content plans are a trap! Share the real lesson you figured out yesterday. Speed beats perfection every single time!',
  },
  {
    id: 'stepbystep',
    title: '3-Step Framework (45s)',
    tag: '📑 High Saves',
    text: 'Step 1: Document what worked today. Step 2: Extract the single most useful takeaway. Step 3: Record in one raw take. That is how you never run out of ideas.',
  },
];

const LESSON_PRESETS = [
  {
    id: 'lesson_1',
    title: 'Actionable Rule',
    tag: '⭐ Recommended',
    text: 'Consistency gets easier when you stop waiting for perfect ideas and start sharing useful lessons.',
  },
  {
    id: 'lesson_2',
    title: 'Mindset Shift',
    tag: '🧠 Perspective',
    text: "You don't need 100k followers to give value—you just need to share what helped you yesterday.",
  },
  {
    id: 'lesson_3',
    title: 'Execution Golden Rule',
    tag: '⚡ Speed First',
    text: 'Done and posted beats perfect and unpublished every single day.',
  },
];

const CTA_PRESETS = [
  {
    id: 'cta_1',
    type: '💬 Conversation Starter',
    text: 'What is one creator habit that helped you stay consistent?',
    goal: 'Boosts comments & algorithm rank',
  },
  {
    id: 'cta_2',
    type: '💾 High Saves Prompt',
    text: 'Save this post so you have it ready for your next filming session.',
    goal: 'Maximizes saves & bookmarks',
  },
  {
    id: 'cta_3',
    type: '📥 Lead Magnet / DM',
    text: 'Comment "GROWTH" and I will send you my daily batch-filming checklist!',
    goal: 'Drives direct inbound leads',
  },
  {
    id: 'cta_4',
    type: '🔥 Quick Choice',
    text: 'Which of these 3 tips are you trying first this week?',
    goal: 'Low friction comment barrier',
  },
  {
    id: 'cta_5',
    type: '👥 Share Trigger',
    text: 'Send this to a creator friend who needs to hear this today.',
    goal: 'Expands virality via DMs',
  },
];

export const ScriptScreen: React.FC<ScriptScreenProps> = ({
  ideaTitle = 'One thing I wish I knew before I started creating',
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onUseAsPost,
  onOpenMessages,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Live-Editable Script Components State
  const [selectedHook, setSelectedHook] = useState(HOOK_PRESETS[0].text);
  const [generationsLeft, setGenerationsLeft] = useState(2);
  const [bodyText, setBodyText] = useState(BODY_PRESETS[0].text);
  const [selectedBodyPresetId, setSelectedBodyPresetId] = useState('original');
  const [takeawayText, setTakeawayText] = useState(LESSON_PRESETS[0].text);
  const [selectedLessonId, setSelectedLessonId] = useState('lesson_1');
  const [ctaIndex, setCtaIndex] = useState(0);
  const [selectedCtaText, setSelectedCtaText] = useState(CTA_PRESETS[0].text);

  // Popups for each of the 4 Phase Buttons
  const [showHookModal, setShowHookModal] = useState(false);
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showCtaModal, setShowCtaModal] = useState(false);

  // General App Modals & Celebrations
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Script Ready!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your full video script is formatted and ready for filming.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('47-day streak protected! +40 XP earned.');
  const [celebrationBadge, setCelebrationBadge] = useState('SCRIPT CRAFTED');

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

  const handleOpenPhaseModal = (phase: 'hook' | 'body' | 'lesson' | 'cta') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    triggerModalAnim();
    if (phase === 'hook') setShowHookModal(true);
    else if (phase === 'body') setShowBodyModal(true);
    else if (phase === 'lesson') setShowLessonModal(true);
    else if (phase === 'cta') setShowCtaModal(true);
  };

  const handleSelectHook = (hook: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedHook(hook);
  };

  const handleApplyHookFromModal = (hook: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedHook(hook);
    setShowHookModal(false);
    setCelebrationTitle('Hook Applied!');
    setCelebrationSubtitle(`"${hook}" is now set as your video opener.`);
    setCelebrationSpeech('First 3 seconds optimized for max retention!');
    setCelebrationBadge('HOOK READY');
    setShowCelebrationModal(true);
  };

  const handleApplyBodyFromModal = (preset: typeof BODY_PRESETS[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedBodyPresetId(preset.id);
    setBodyText(preset.text);
    setShowBodyModal(false);
    setCelebrationTitle('Script Body Updated!');
    setCelebrationSubtitle(`Applied ${preset.title} style to your script.`);
    setCelebrationSpeech('Structure formatted for smooth delivery!');
    setCelebrationBadge('BODY FORMATTED');
    setShowCelebrationModal(true);
  };

  const handleApplyLessonFromModal = (lesson: typeof LESSON_PRESETS[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedLessonId(lesson.id);
    setTakeawayText(lesson.text);
    setShowLessonModal(false);
    setCelebrationTitle('Takeaway Applied!');
    setCelebrationSubtitle(`"${lesson.text}" will make your post memorable.`);
    setCelebrationSpeech('Core value locked in for high saves!');
    setCelebrationBadge('TAKEAWAY SET');
    setShowCelebrationModal(true);
  };

  const handleApplyCtaFromModal = (cta: typeof CTA_PRESETS[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedCtaText(cta.text);
    const idx = CTA_PRESETS.findIndex((c) => c.text === c.text);
    if (idx !== -1) setCtaIndex(idx);
    setShowCtaModal(false);
    setCelebrationTitle('Call to Action Set!');
    setCelebrationSubtitle(`"${cta.text}" ready to drive engagement.`);
    setCelebrationSpeech('Viewer conversion trigger activated!');
    setCelebrationBadge('CTA ACTIVE');
    setShowCelebrationModal(true);
  };

  const handleShuffleCta = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const nextIdx = (ctaIndex + 1) % CTA_PRESETS.length;
    setCtaIndex(nextIdx);
    setSelectedCtaText(CTA_PRESETS[nextIdx].text);
  };

  const handleCopyFullScript = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const fullScript = `HOOK:
${selectedHook}

BODY:
${bodyText}

TAKEAWAY:
${takeawayText}

CTA:
${selectedCtaText}`;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullScript);
      }
    } catch (_e) {
      // Graceful fallback
    }

    setCelebrationTitle('Script Copied!');
    setCelebrationSubtitle('Full script copied to clipboard and ready for your teleprompter or notes.');
    setCelebrationSpeech('47-day streak protected! +40 XP added.');
    setCelebrationBadge('COPIED TO CLIPBOARD');
    setShowCelebrationModal(true);
  };

  const handleUseAsPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onUseAsPost) {
      onUseAsPost({
        hook: selectedHook,
        body: bodyText,
        takeaway: takeawayText,
        cta: selectedCtaText,
      });
    }
  };

  const handleSaveDraft = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationTitle('Draft Saved!');
    setCelebrationSubtitle('Your video script has been preserved in your creator drafts.');
    setCelebrationSpeech('Momentum protected! Ready whenever you film.');
    setCelebrationBadge('DRAFT SAVED');
    setShowCelebrationModal(true);
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
          {/* 1. TOP AIRY HEADER BAR */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeftGroup}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onBack();
                }}
                style={({ pressed }) => [styles.backCircleBtn, pressed && styles.btnPressed]}
                hitSlop={8}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>

              {/* Mascot Logo */}
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
            </View>

            {/* Right Icons */}
            <View style={styles.headerRightGroup}>
              <Pressable
                style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
                hitSlop={8}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenMessages) {
                    onOpenMessages();
                  } else {
                    triggerModalAnim();
                    setShowChatModal(true);
                  }
                }}
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
                style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
                hitSlop={8}
                onPress={() => {
                  triggerModalAnim();
                  setShowNotificationModal(true);
                }}
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
                {unreadNotifCount > 0 && <View style={styles.notificationDot} />}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
                hitSlop={8}
                onPress={() => {
                  triggerModalAnim();
                  setShowProfileModal(true);
                }}
              >
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="#171420"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="12" cy="7" r="4" stroke="#171420" strokeWidth="2.2" />
                </Svg>
              </Pressable>
            </View>
          </View>

          {/* 2. MAIN SCROLLABLE CONTENT */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Pill Badge */}
            <View style={styles.topBadgesRow}>
              <View style={styles.freeScriptPill}>
                <Text style={styles.freeScriptPillText}>Free Script Tool</Text>
              </View>
            </View>

            {/* Main Title */}
            <Text style={styles.mainTitle}>Turn your idea into a script.</Text>

            {/* 1. SELECTED IDEA CARD */}
            <View style={styles.selectedIdeaCard}>
              <View style={styles.selectedIdeaHeaderRow}>
                <Text style={styles.selectedIdeaLabel}>SELECTED IDEA</Text>
                <Text style={styles.selectedIdeaDuration}>30-45 sec</Text>
              </View>

              <Text style={styles.selectedIdeaTitle}>&ldquo;{ideaTitle}&rdquo;</Text>

              <View style={styles.selectedIdeaTagsRow}>
                <View style={styles.ideaTagPill}>
                  <Text style={styles.ideaTagPillText}>Personal Lesson</Text>
                </View>
                <View style={styles.ideaTagPill}>
                  <Text style={styles.ideaTagPillText}>Creator Advice</Text>
                </View>
                <View style={styles.streakSaverPill}>
                  <Text style={styles.streakSaverPillText}>Streak Saver</Text>
                </View>
              </View>
            </View>

            {/* 2. SCRIPT PHASE BUTTONS (EACH OPENS A FULL DEDICATED POP-UP MODAL) */}
            <View style={styles.phaseTabsRow}>
              {[
                { id: 'hook', label: '⚓ HOOK' },
                { id: 'body', label: '📑 BODY' },
                { id: 'lesson', label: '💡 LESSON' },
                { id: 'cta', label: '📢 CTA' },
              ].map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => handleOpenPhaseModal(tab.id as 'hook' | 'body' | 'lesson' | 'cta')}
                  style={({ pressed }) => [
                    styles.phaseTabBtn,
                    tab.id === 'hook' && styles.phaseTabBtnPrimary,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.phaseTabBtnText,
                      tab.id === 'hook' && styles.phaseTabBtnTextPrimary,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 3. HOOK CARD (LIVE-EDITABLE INPUT) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionIcon}>⚓</Text>
                  <Text style={styles.sectionTitle}>Hook</Text>
                  <Text style={styles.editableHintMicro}>Editable</Text>
                </View>
                <Pressable
                  onPress={() => handleOpenPhaseModal('hook')}
                  hitSlop={8}
                >
                  <View style={styles.generationsBadge}>
                    <Text style={styles.generationsBadgeText}>{generationsLeft} generations left ⚡</Text>
                  </View>
                </Pressable>
              </View>

              {/* Active Selected Hook Box */}
              <View style={styles.activeHookBox}>
                <TextInput
                  value={selectedHook}
                  onChangeText={setSelectedHook}
                  placeholder="Type your hook..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.hookInput}
                />
              </View>

              <Text style={styles.alternativeHooksLabel}>ALTERNATIVE HOOKS (TAP TO SWAP)</Text>

              {/* Alternative Hooks List */}
              {HOOK_PRESETS.filter((h) => h.text !== selectedHook).slice(0, 2).map((hookItem, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSelectHook(hookItem.text)}
                  style={styles.altHookBox}
                >
                  <Text style={styles.altHookType}>{hookItem.type}</Text>
                  <Text style={styles.altHookText}>&ldquo;{hookItem.text}&rdquo;</Text>
                </Pressable>
              ))}
            </View>

            {/* 4. BODY CARD (LIVE-EDITABLE MULTILINE) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionIcon}>📑</Text>
                  <Text style={styles.sectionTitle}>Body</Text>
                  <Text style={styles.editableHintMicro}>Editable</Text>
                </View>
                <Pressable onPress={() => handleOpenPhaseModal('body')} hitSlop={8}>
                  <Text style={styles.editSectionLink}>Studio ➔</Text>
                </Pressable>
              </View>

              {/* Body Content Box */}
              <View style={styles.bodyContentBox}>
                <TextInput
                  value={bodyText}
                  onChangeText={setBodyText}
                  placeholder="Write or customize script body..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.bodyInput}
                />
              </View>

              {/* Body Refinement Chips */}
              <View style={styles.bodyChipsRow}>
                {[
                  { id: 'shorter', label: 'Make Shorter' },
                  { id: 'personal', label: 'More Personal' },
                  { id: 'energetic', label: 'More Energetic' },
                ].map((chip) => {
                  const isActive = selectedBodyPresetId === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => {
                        const found = BODY_PRESETS.find((p) => p.id === chip.id);
                        if (found) {
                          handleApplyBodyFromModal(found);
                        }
                      }}
                      style={[
                        styles.bodyFilterChip,
                        isActive && styles.bodyFilterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bodyFilterChipText,
                          isActive && styles.bodyFilterChipTextActive,
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 5. JARVIS CREATIVE ASSISTANT BANNER */}
            <LinearGradient
              colors={['#582CDB', '#431FA8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.jarvisBannerCard}
            >
              <View style={styles.jarvisBannerHeaderRow}>
                <View style={styles.jarvisBannerFlameRing}>
                  <Image
                    source={require('../../assets/images/jarvis-core-flame.png')}
                    style={styles.jarvisBannerFlame}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.jarvisBannerText}>
                  Keep your script focused on one clear lesson so it\'s easier for viewers to remember and save.
                </Text>
              </View>

              <View style={styles.jarvisBannerChipsRow}>
                <Pressable
                  style={styles.jarvisBannerChip}
                  onPress={() => handleOpenPhaseModal('hook')}
                >
                  <Text style={styles.jarvisBannerChipText}>Improve Hook</Text>
                </Pressable>
                <Pressable
                  style={styles.jarvisBannerChip}
                  onPress={() => handleOpenPhaseModal('body')}
                >
                  <Text style={styles.jarvisBannerChipText}>Make More Personal</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* 6. TAKEAWAY CARD (LIVE-EDITABLE) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionIcon}>💡</Text>
                  <Text style={styles.sectionTitle}>Takeaway</Text>
                  <Text style={styles.editableHintMicro}>Editable</Text>
                </View>
              </View>

              <View style={styles.takeawayBox}>
                <TextInput
                  value={takeawayText}
                  onChangeText={setTakeawayText}
                  placeholder="Type takeaway lesson..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.takeawayInput}
                />
              </View>

              <Pressable
                onPress={() => handleOpenPhaseModal('lesson')}
                hitSlop={8}
              >
                <Text style={styles.improveTakeawayLink}>IMPROVE TAKEAWAY ➔</Text>
              </Pressable>
            </View>

            {/* 7. CALL TO ACTION CARD (LIVE-EDITABLE) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionIcon}>📢</Text>
                  <Text style={styles.sectionTitle}>Call to Action</Text>
                  <Text style={styles.editableHintMicro}>Editable</Text>
                </View>
                <Pressable onPress={() => handleOpenPhaseModal('cta')} hitSlop={8}>
                  <Text style={styles.editSectionLink}>Browse All ➔</Text>
                </Pressable>
              </View>

              <View style={styles.ctaContentBox}>
                <TextInput
                  value={selectedCtaText}
                  onChangeText={setSelectedCtaText}
                  placeholder="Type call to action..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.ctaInput}
                />
              </View>

              <View style={styles.ctaActionRow}>
                <Pressable
                  style={({ pressed }) => [styles.useCtaBtn, pressed && styles.btnPressed]}
                  onPress={() => handleOpenPhaseModal('cta')}
                >
                  <Text style={styles.useCtaBtnText}>USE CTA</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.shuffleCtaBtn, pressed && styles.btnPressed]}
                  onPress={handleShuffleCta}
                  hitSlop={8}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              </View>
            </View>

            {/* 8. STREAK IMPACT CARD */}
            <View style={styles.streakImpactCard}>
              <View style={styles.streakImpactHeaderRow}>
                <View>
                  <Text style={styles.streakImpactLabel}>STREAK IMPACT</Text>
                  <Text style={styles.streakImpactSub}>Helps protect 47-day streak</Text>
                </View>
                <Text style={styles.streakImpactXp}>+40 XP</Text>
              </View>

              <View style={styles.streakProgressBarTrack}>
                <View style={styles.streakProgressBarFill} />
              </View>
            </View>

            {/* 9. SCRIPT PREVIEW CONTAINER */}
            <View style={styles.scriptPreviewCard}>
              <View style={styles.scriptPreviewHeaderRow}>
                <Text style={styles.scriptPreviewLabel}>SCRIPT PREVIEW</Text>
                <View style={styles.scriptPreviewPillsRow}>
                  <Text style={styles.scriptPreviewPillText}>⏱ Short-form</Text>
                  <Text style={styles.scriptPreviewPillText}>💡 Helpful</Text>
                </View>
              </View>

              {/* Inner Preview Box */}
              <View style={styles.scriptPreviewInnerBox}>
                <Text style={styles.previewLineText}>
                  <Text style={styles.previewLineBold}>Hook: </Text>
                  {selectedHook}
                </Text>
                <Text style={[styles.previewLineText, { marginTop: 8 }]}>
                  <Text style={styles.previewLineBold}>Body: </Text>
                  {bodyText}
                </Text>
                <Text style={[styles.previewLineText, { marginTop: 8 }]}>
                  <Text style={styles.previewLineBold}>Takeaway: </Text>
                  {takeawayText}
                </Text>
                <Text style={[styles.previewLineText, { marginTop: 8 }]}>
                  <Text style={styles.previewLineBold}>CTA: </Text>
                  {selectedCtaText}
                </Text>
              </View>

              {/* Dashed Copy Full Script Button */}
              <Pressable
                style={({ pressed }) => [styles.copyScriptBtn, pressed && styles.btnPressed]}
                onPress={handleCopyFullScript}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Rect x="9" y="9" width="13" height="13" rx="2" stroke="#582CDB" strokeWidth="2.2" />
                  <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#582CDB" strokeWidth="2.2" />
                </Svg>
                <Text style={styles.copyScriptBtnText}>COPY FULL SCRIPT</Text>
              </Pressable>
            </View>

            {/* 10. PRIMARY BOTTOM ACTIONS */}
            <Pressable
              style={({ pressed }) => [styles.useAsPostBtn, pressed && styles.btnPressed]}
              onPress={handleUseAsPost}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.useAsPostGradient}
              >
                <Text style={styles.useAsPostBtnText}>USE AS POST</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.secondaryActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                onPress={() => handleOpenPhaseModal('body')}
              >
                <Text style={styles.secondaryBtnText}>IMPROVE SCRIPT</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                onPress={handleSaveDraft}
              >
                <Text style={styles.secondaryBtnText}>SAVE DRAFT</Text>
              </Pressable>
            </View>

            {/* Bottom spacing to clear floating tab bar */}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
          <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

          {/* ========================================================================= */}
          {/* MODAL 1: FULL HOOK STUDIO POP-UP MODAL */}
          {/* ========================================================================= */}
          <Modal
            visible={showHookModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowHookModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>⚓ Viral Hook Studio</Text>
                    <Text style={styles.modalSubtitle}>First 3 seconds that stop the scroll</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowHookModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {HOOK_PRESETS.map((preset, index) => {
                    const isSelected = selectedHook === preset.text;
                    return (
                      <Pressable
                        key={index}
                        onPress={() => handleSelectHook(preset.text)}
                        style={[
                          styles.hookModalItemCard,
                          isSelected && styles.hookModalItemCardActive,
                        ]}
                      >
                        <View style={styles.hookModalItemHeader}>
                          <Text style={[styles.hookModalItemType, isSelected && styles.hookModalItemTypeActive]}>
                            {preset.type}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedCheckBadge}>
                              <Text style={styles.selectedCheckText}>✓ ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.hookModalItemText}>&ldquo;{preset.text}&rdquo;</Text>
                        <Text style={styles.hookModalItemDesc}>{preset.desc}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={styles.modalFullBtn}
                  onPress={() => handleApplyHookFromModal(selectedHook)}
                >
                  <Text style={styles.modalFullBtnText}>Apply Hook to Script ➔</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Modal>

          {/* ========================================================================= */}
          {/* MODAL 2: FULL SCRIPT BODY STUDIO POP-UP MODAL */}
          {/* ========================================================================= */}
          <Modal
            visible={showBodyModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBodyModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>📑 Script Body Studio</Text>
                    <Text style={styles.modalSubtitle}>Pacing, storytelling &amp; high retention</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowBodyModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {BODY_PRESETS.map((preset) => {
                    const isSelected = selectedBodyPresetId === preset.id;
                    return (
                      <Pressable
                        key={preset.id}
                        onPress={() => {
                          setSelectedBodyPresetId(preset.id);
                          setBodyText(preset.text);
                        }}
                        style={[
                          styles.bodyModalItemCard,
                          isSelected && styles.bodyModalItemCardActive,
                        ]}
                      >
                        <View style={styles.bodyModalItemHeader}>
                          <Text style={styles.bodyModalItemTitle}>{preset.title}</Text>
                          <View style={styles.bodyModalTagPill}>
                            <Text style={styles.bodyModalTagText}>{preset.tag}</Text>
                          </View>
                        </View>
                        <Text style={styles.bodyModalItemText}>{preset.text}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={styles.modalFullBtn}
                  onPress={() => {
                    const found = BODY_PRESETS.find((p) => p.id === selectedBodyPresetId) || BODY_PRESETS[0];
                    handleApplyBodyFromModal(found);
                  }}
                >
                  <Text style={styles.modalFullBtnText}>Apply Body to Script ➔</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Modal>

          {/* ========================================================================= */}
          {/* MODAL 3: FULL LESSON / TAKEAWAY POP-UP MODAL */}
          {/* ========================================================================= */}
          <Modal
            visible={showLessonModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLessonModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>💡 Core Lesson Studio</Text>
                    <Text style={styles.modalSubtitle}>The memorable takeaway that gets saved</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowLessonModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {LESSON_PRESETS.map((lesson) => {
                    const isSelected = selectedLessonId === lesson.id;
                    return (
                      <Pressable
                        key={lesson.id}
                        onPress={() => {
                          setSelectedLessonId(lesson.id);
                          setTakeawayText(lesson.text);
                        }}
                        style={[
                          styles.lessonModalItemCard,
                          isSelected && styles.lessonModalItemCardActive,
                        ]}
                      >
                        <View style={styles.lessonModalItemHeader}>
                          <Text style={styles.lessonModalItemTitle}>{lesson.title}</Text>
                          <View style={styles.lessonModalTagPill}>
                            <Text style={styles.lessonModalTagText}>{lesson.tag}</Text>
                          </View>
                        </View>
                        <Text style={styles.lessonModalItemText}>&ldquo;{lesson.text}&rdquo;</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={styles.modalFullBtn}
                  onPress={() => {
                    const found = LESSON_PRESETS.find((l) => l.id === selectedLessonId) || LESSON_PRESETS[0];
                    handleApplyLessonFromModal(found);
                  }}
                >
                  <Text style={styles.modalFullBtnText}>Apply Takeaway ➔</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Modal>

          {/* ========================================================================= */}
          {/* MODAL 4: FULL CALL TO ACTION (CTA) POP-UP MODAL */}
          {/* ========================================================================= */}
          <Modal
            visible={showCtaModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCtaModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>📢 Call to Action Studio</Text>
                    <Text style={styles.modalSubtitle}>Drive comments, saves &amp; viral shares</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowCtaModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {CTA_PRESETS.map((cta, index) => {
                    const isSelected = selectedCtaText === cta.text;
                    return (
                      <Pressable
                        key={cta.id}
                        onPress={() => {
                          setSelectedCtaText(cta.text);
                          setCtaIndex(index);
                        }}
                        style={[
                          styles.ctaModalItemCard,
                          isSelected && styles.ctaModalItemCardActive,
                        ]}
                      >
                        <View style={styles.ctaModalItemHeader}>
                          <Text style={[styles.ctaModalItemType, isSelected && styles.ctaModalItemTypeActive]}>
                            {cta.type}
                          </Text>
                          <Text style={styles.ctaModalGoal}>{cta.goal}</Text>
                        </View>
                        <Text style={styles.ctaModalItemText}>&ldquo;{cta.text}&rdquo;</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={styles.modalFullBtn}
                  onPress={() => {
                    const found = CTA_PRESETS.find((c) => c.text === selectedCtaText) || CTA_PRESETS[0];
                    handleApplyCtaFromModal(found);
                  }}
                >
                  <Text style={styles.modalFullBtnText}>Apply CTA to Script ➔</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Modal>

          {/* MODAL: NOTIFICATIONS CENTER */}
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

          {/* MODAL: CREATOR PROFILE PASSPORT */}
          {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

          {/* MODAL: CREATOR CHAT */}
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
                    I optimized this 30-second script for TikTok &amp; Reels retention! The first 3 seconds hook audience attention.
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
            badgeText={celebrationBadge}
            xpEarned={40}
            streakCount={47}
            actionText="Keep Editing ➔"
            onDismiss={() => {
              setShowCelebrationModal(false);
            }}
          />
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 96,
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

  // Top Pill Badges
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  freeScriptPill: {
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  freeScriptPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },

  mainTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 14,
    marginTop: 4,
  },

  // Selected Idea Card
  selectedIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedIdeaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIdeaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.6,
  },
  selectedIdeaDuration: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  selectedIdeaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 22,
    marginBottom: 12,
  },
  selectedIdeaTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ideaTagPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  ideaTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  streakSaverPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  streakSaverPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // 2. Phase Buttons Row (4 Buttons)
  phaseTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  phaseTabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  phaseTabBtnPrimary: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  phaseTabBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  phaseTabBtnTextPrimary: {
    color: '#FFFFFF',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  editableHintMicro: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  generationsBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  generationsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  editSectionLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Hook Boxes
  activeHookBox: {
    backgroundColor: '#FAF8FE',
    borderLeftWidth: 3.5,
    borderLeftColor: '#582CDB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 12,
  },
  hookInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 19,
    minHeight: 36,
  },
  alternativeHooksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  altHookBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  altHookType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 2,
  },
  altHookText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  // Body Content
  bodyContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  bodyInput: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    minHeight: 70,
  },
  bodyChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bodyFilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  bodyFilterChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  bodyFilterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  bodyFilterChipTextActive: {
    color: '#582CDB',
  },

  // Jarvis Creative Assistant Banner
  jarvisBannerCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  jarvisBannerHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  jarvisBannerFlameRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisBannerFlame: {
    width: 20,
    height: 20,
  },
  jarvisBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '600',
  },
  jarvisBannerChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  jarvisBannerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  jarvisBannerChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Takeaway Card
  takeawayBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  takeawayInput: {
    fontSize: 13,
    color: '#171420',
    lineHeight: 18,
    minHeight: 36,
  },
  improveTakeawayLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
  },

  // Call to Action Card
  ctaContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  ctaInput: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    minHeight: 36,
  },
  ctaActionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  useCtaBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  useCtaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  shuffleCtaBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Streak Impact Card
  streakImpactCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 14,
  },
  streakImpactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakImpactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  streakImpactSub: {
    fontSize: 12.5,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  streakImpactXp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  streakProgressBarTrack: {
    height: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  streakProgressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },

  // Script Preview Container
  scriptPreviewCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  scriptPreviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scriptPreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  scriptPreviewPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scriptPreviewPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  scriptPreviewInnerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  previewLineText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  previewLineBold: {
    fontWeight: '800',
    color: '#171420',
  },
  copyScriptBtn: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyScriptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },

  // Primary Bottom Actions
  useAsPostBtn: {
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 10,
  },
  useAsPostGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useAsPostBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.4,
  },

  // Large Modal Containers
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
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
  modalCardLarge: {
    width: '100%',
    maxWidth: 400,
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
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
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },

  // Hook Modal Item Cards
  hookModalItemCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 14,
    marginBottom: 10,
  },
  hookModalItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hookModalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hookModalItemType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  hookModalItemTypeActive: {
    color: '#582CDB',
  },
  selectedCheckBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectedCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  hookModalItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 19,
    marginBottom: 4,
  },
  hookModalItemDesc: {
    fontSize: 11,
    color: '#64748B',
  },

  // Body Modal Item Cards
  bodyModalItemCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 14,
    marginBottom: 10,
  },
  bodyModalItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bodyModalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bodyModalItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  bodyModalTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  bodyModalTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  bodyModalItemText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },

  // Lesson Modal Item Cards
  lessonModalItemCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 14,
    marginBottom: 10,
  },
  lessonModalItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonModalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lessonModalItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  lessonModalTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  lessonModalTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  lessonModalItemText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  // CTA Modal Item Cards
  ctaModalItemCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 14,
    marginBottom: 10,
  },
  ctaModalItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaModalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ctaModalItemType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  ctaModalItemTypeActive: {
    color: '#582CDB',
  },
  ctaModalGoal: {
    fontSize: 11,
    color: '#64748B',
  },
  ctaModalItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 18,
  },

  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  notifCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
