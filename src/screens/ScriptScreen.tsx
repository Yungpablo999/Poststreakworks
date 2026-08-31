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
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';

interface ScriptScreenProps {
  ideaTitle?: string;
  format?: string;
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

export const getFormatDurationLabel = (format?: string, title?: string): string => {
  const f = (format || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (f.includes('carousel') || t.includes('carousel') || t.includes('slide') || f === 'carousel') {
    return '🖼️ 6–8 slides • Carousel';
  }
  if (f.includes('long') || f.includes('youtube') || t.includes('tutorial') || t.includes('deep dive') || f === 'long_video') {
    return '🎬 3–5 min • Long-form';
  }
  if (f.includes('text') || f.includes('thread') || t.includes('thread') || t.includes('essay') || f === 'text') {
    return '📝 Text-first • Thread';
  }
  // Default to short video / reel / tiktok
  return '🎬 30–45 sec • Short-form';
};

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
    body: "Convert today's idea into a post to keep your 1-day streak.",
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
    title: 'Short & Punchy (20s)',
    tag: '⚡ Retention',
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
    title: 'More Punchy (25s)',
    tag: '⚡ Punchy',
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
    text: 'Stop waiting for perfect ideas. Share the useful lessons you learn every day.',
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

const TAKEAWAY_QUICK_ACTIONS = [
  {
    id: 'punchier',
    icon: '⚡',
    title: 'Make it punchier',
    text: 'Stop waiting for perfect ideas. Share the useful lessons you learn every day.',
    tag: 'Punchy',
  },
  {
    id: 'memorable',
    icon: '🧠',
    title: 'Make it more memorable',
    text: 'One small lesson shared daily beats 100 perfect ideas kept in your notes.',
    tag: 'Memorable',
  },
  {
    id: 'personal',
    icon: '👤',
    title: 'Make it more personal',
    text: 'The day I stopped overthinking and shared my daily progress is the day everything clicked.',
    tag: 'Personal',
  },
  {
    id: 'actionable',
    icon: '🎯',
    title: 'Make it more actionable',
    text: 'Write down 1 thing you figured out today and post it before you go to bed.',
    tag: 'Actionable',
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
  format,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onUseAsPost,
  onOpenMessages,

  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Active Script Phase Tab (HOOK | BODY | LESSON | CTA)
  const [activeScriptPhase, setActiveScriptPhase] = useState<'hook' | 'body' | 'lesson' | 'cta'>('hook');

  // Live-Editable Script Components State
  const [selectedHook, setSelectedHook] = useState(HOOK_PRESETS[0].text);
  const [editsLeft, setEditsLeft] = useState(2);
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
  const [celebrationSpeech, setCelebrationSpeech] = useState('1-day streak protected! +40 XP earned.');
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedHook((prev) => (prev === hook ? '' : hook));
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

  const handleAiRewriteCurrentPhase = () => {
    if (editsLeft <= 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      if (onOpenJarvisPro) onOpenJarvisPro();
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditsLeft((e) => Math.max(0, e - 1));

    if (activeScriptPhase === 'hook') {
      const aiHooks = [
        'Stop waiting for inspiration—here is how to post daily effortlessly.',
        'The 60-second routine that made content creation simple.',
        'How 1 simple switch completely fixed my creator burnout.',
        'The reason 90% of creators struggle to post consistently.',
      ];
      setSelectedHook(aiHooks[Math.floor(Math.random() * aiHooks.length)]);
    } else if (activeScriptPhase === 'body') {
      const aiBodies = [
        'Creators fail because they make posting too complicated. Break your idea down into 1 problem, 1 perspective shift, and 1 action. That takes 10 minutes to film and delivers 10x the clarity.',
        'I used to spend 3 hours filming 1 short video. Then I switched to raw, single-take value drops. My views doubled and my creation time dropped by 80%.',
        'Consistency comes from lowering the friction to start. Document the work you are already doing instead of brainstorming from scratch.',
      ];
      setBodyText(aiBodies[Math.floor(Math.random() * aiBodies.length)]);
    } else if (activeScriptPhase === 'lesson') {
      const aiLessons = [
        'Focus on sharing real progress rather than proving expertise.',
        'Small daily repetitions build bigger audiences than occasional viral hits.',
        'Speed beats perfection—publish today and refine tomorrow.',
      ];
      setTakeawayText(aiLessons[Math.floor(Math.random() * aiLessons.length)]);
    } else if (activeScriptPhase === 'cta') {
      const aiCtas = [
        'Which part of this resonates most with your creator journey?',
        'Share this with a creator who is struggling to stay consistent.',
        'Drop a 🔥 in the comments if you needed this reminder today!',
      ];
      setSelectedCtaText(aiCtas[Math.floor(Math.random() * aiCtas.length)]);
    }

    setCelebrationTitle('Rewrite Applied!');
    setCelebrationSubtitle(`New ${activeScriptPhase.toUpperCase()} refined for your script (1 edit used).`);
    setCelebrationSpeech('Script refined! Swap presets anytime for free.');
    setCelebrationBadge('REWRITTEN');
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
    setCelebrationSpeech('1-day streak protected! +40 XP added.');
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
                <Text style={styles.selectedIdeaDuration}>
                  {getFormatDurationLabel(format, ideaTitle)}
                </Text>
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

            {/* 2. SCRIPT PHASE TABS (SWITCHES ACTIVE STUDIO PHASE) */}
            <View style={styles.phaseTabsRow}>
              {[
                { id: 'hook', emoji: '⚓', label: 'HOOK' },
                { id: 'body', emoji: '📑', label: 'BODY' },
                { id: 'lesson', emoji: '💡', label: 'LESSON' },
                { id: 'cta', emoji: '📢', label: 'CTA' },
              ].map((tab) => {
                const isActive = activeScriptPhase === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveScriptPhase(tab.id as 'hook' | 'body' | 'lesson' | 'cta');
                    }}
                    style={({ pressed }) => [
                      styles.phaseTabBtn,
                      isActive && styles.phaseTabBtnPrimary,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <View style={styles.phaseTabInnerRow}>
                      <Text style={styles.phaseTabEmoji}>{tab.emoji}</Text>
                      <Text
                        style={[
                          styles.phaseTabBtnText,
                          isActive && styles.phaseTabBtnTextPrimary,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* 3. DYNAMIC SCRIPT STUDIO CARD (AFFECTED BY ACTIVE TAB) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Text style={styles.sectionIcon}>
                    {activeScriptPhase === 'hook' && '⚓'}
                    {activeScriptPhase === 'body' && '📑'}
                    {activeScriptPhase === 'lesson' && '💡'}
                    {activeScriptPhase === 'cta' && '📢'}
                  </Text>
                  <Text style={styles.sectionTitle}>
                    {activeScriptPhase === 'hook' && 'Hook'}
                    {activeScriptPhase === 'body' && 'Body'}
                    {activeScriptPhase === 'lesson' && 'Lesson'}
                    {activeScriptPhase === 'cta' && 'Call to Action'}
                  </Text>
                  <Text style={styles.editableHintMicro}>Editable</Text>
                </View>

                {/* Subtle Quota Badge (Doesn't Compete with Hook) */}
                <Pressable
                  onPress={() => {
                    if (onOpenJarvisPro) onOpenJarvisPro();
                  }}
                  hitSlop={8}
                >
                  <View style={styles.editsBadge}>
                    <Text style={styles.editsBadgeText}>⚡ {editsLeft} edits left</Text>
                  </View>
                </Pressable>
              </View>

              {/* Current Selected Component (Visually Clear & Distinct) */}
              <View style={styles.activePhaseContainer}>
                <Text style={styles.currentSectionLabel}>
                  CURRENT {activeScriptPhase === 'lesson' ? 'LESSON' : activeScriptPhase === 'cta' ? 'CTA' : activeScriptPhase.toUpperCase()}
                </Text>
                <View style={styles.activeHookBox}>
                  {activeScriptPhase === 'hook' && (
                    <TextInput
                      value={selectedHook}
                      onChangeText={setSelectedHook}
                      placeholder="Type your hook..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      scrollEnabled={false}
                      style={styles.hookInput}
                    />
                  )}
                  {activeScriptPhase === 'body' && (
                    <TextInput
                      value={bodyText}
                      onChangeText={setBodyText}
                      placeholder="Write or customize script body..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      scrollEnabled={false}
                      style={styles.bodyInput}
                    />
                  )}
                  {activeScriptPhase === 'lesson' && (
                    <TextInput
                      value={takeawayText}
                      onChangeText={setTakeawayText}
                      placeholder="Type takeaway lesson..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      scrollEnabled={false}
                      style={styles.takeawayInput}
                    />
                  )}
                  {activeScriptPhase === 'cta' && (
                    <TextInput
                      value={selectedCtaText}
                      onChangeText={setSelectedCtaText}
                      placeholder="Type call to action..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      scrollEnabled={false}
                      style={styles.ctaInput}
                    />
                  )}
                </View>
              </View>

              {/* Action Toolbar for Current Phase */}
              <View style={styles.studioActionRow}>
                <Pressable
                  style={({ pressed }) => [styles.aiRewriteBtn, pressed && styles.btnPressed]}
                  onPress={handleAiRewriteCurrentPhase}
                >
                  <Text style={styles.aiRewriteBtnText} numberOfLines={1} ellipsizeMode="tail">
                    ✨ Rewrite · 1 edit
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.studioModalBtn, pressed && styles.btnPressed]}
                  onPress={() => handleOpenPhaseModal(activeScriptPhase)}
                >
                  <Text style={styles.studioModalBtnText}>Studio ➔</Text>
                </Pressable>
              </View>

              {/* Alternatives Sub-header with Free Swap clarification */}
              <View style={styles.altHeaderRow}>
                <Text style={styles.alternativeHooksLabel}>
                  ALTERNATIVE {activeScriptPhase === 'body' ? 'BODY STYLES' : activeScriptPhase === 'lesson' ? 'LESSONS' : activeScriptPhase === 'cta' ? 'CTAs' : 'HOOKS'}
                </Text>
                <View style={styles.freeBadgeMicro}>
                  <Text style={styles.freeBadgeMicroText}>FREE SWAP</Text>
                </View>
              </View>

              {/* Dynamic Alternatives List based on active tab */}
              {activeScriptPhase === 'hook' && (
                <View style={styles.altListContainer}>
                  {HOOK_PRESETS.filter((h) => h.text !== selectedHook).slice(0, 3).map((hookItem, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        setSelectedHook(hookItem.text);
                      }}
                      style={styles.altHookBox}
                    >
                      <Text style={styles.altHookType}>{hookItem.type}</Text>
                      <Text style={styles.altHookText}>&ldquo;{hookItem.text}&rdquo;</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {activeScriptPhase === 'body' && (
                <View style={styles.altListContainer}>
                  {BODY_PRESETS.filter((b) => b.text !== bodyText).slice(0, 3).map((bodyItem) => (
                    <Pressable
                      key={bodyItem.id}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        handleApplyBodyFromModal(bodyItem);
                      }}
                      style={styles.altHookBox}
                    >
                      <Text style={styles.altHookType}>📑 {bodyItem.title} • {bodyItem.tag}</Text>
                      <Text style={styles.altHookText}>&ldquo;{bodyItem.text}&rdquo;</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {activeScriptPhase === 'lesson' && (
                <View style={styles.altListContainer}>
                  {LESSON_PRESETS.filter((l) => l.text !== takeawayText).map((lessonItem) => (
                    <Pressable
                      key={lessonItem.id}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        handleApplyLessonFromModal(lessonItem);
                      }}
                      style={styles.altHookBox}
                    >
                      <Text style={styles.altHookType}>💡 {lessonItem.title} • {lessonItem.tag}</Text>
                      <Text style={styles.altHookText}>&ldquo;{lessonItem.text}&rdquo;</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {activeScriptPhase === 'cta' && (
                <View style={styles.altListContainer}>
                  {CTA_PRESETS.filter((c) => c.text !== selectedCtaText).slice(0, 3).map((ctaItem) => (
                    <Pressable
                      key={ctaItem.id}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        handleApplyCtaFromModal(ctaItem);
                      }}
                      style={styles.altHookBox}
                    >
                      <Text style={styles.altHookType}>{ctaItem.type}</Text>
                      <Text style={styles.altHookText}>&ldquo;{ctaItem.text}&rdquo;</Text>
                    </Pressable>
                  ))}
                </View>
              )}
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
                  scrollEnabled={false}
                  style={styles.bodyInput}
                />
              </View>

              {/* Intentional AI Quick Edits Toolbar */}
              <View style={styles.bodyQuickActionsRow}>
                {[
                  { id: 'shorter', icon: '✨', label: 'Shorter' },
                  { id: 'personal', icon: '👤', label: 'Personal' },
                  { id: 'energetic', icon: '⚡', label: 'Punchy' },
                ].map((chip) => {
                  const isActive = selectedBodyPresetId === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        if (isActive) {
                          setSelectedBodyPresetId('original');
                          setBodyText(BODY_PRESETS[0].text);
                        } else {
                          const found = BODY_PRESETS.find((p) => p.id === chip.id);
                          if (found) {
                            handleApplyBodyFromModal(found);
                          }
                        }
                      }}
                      style={({ pressed }) => [
                        styles.bodyQuickActionChip,
                        isActive && styles.bodyQuickActionChipActive,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text style={styles.bodyQuickActionIcon}>{chip.icon}</Text>
                      <Text
                        style={[
                          styles.bodyQuickActionText,
                          isActive && styles.bodyQuickActionTextActive,
                        ]}
                        numberOfLines={1}
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
                  Keep your script focused on one clear lesson.{"\n"}Make it easy to remember — and worth saving.
                </Text>
              </View>

              <View style={styles.jarvisBannerChipsRow}>
                <Pressable
                  style={({ pressed }) => [styles.jarvisBannerChip, pressed && styles.btnPressed]}
                  onPress={() => handleOpenPhaseModal('hook')}
                >
                  <Text style={styles.jarvisBannerChipText}>Improve Hook ➔</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.jarvisBannerChip, pressed && styles.btnPressed]}
                  onPress={() => handleOpenPhaseModal('body')}
                >
                  <Text style={styles.jarvisBannerChipText}>Make More Personal ➔</Text>
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
                  scrollEnabled={false}
                  style={styles.takeawayInput}
                />
              </View>

              <View style={styles.takeawayActionRow}>
                <Pressable
                  style={({ pressed }) => [styles.improveTakeawayBtn, pressed && styles.btnPressed]}
                  onPress={() => handleOpenPhaseModal('lesson')}
                >
                  <Text style={styles.improveTakeawayBtnText}>Improve Takeaway ➔</Text>
                </Pressable>
              </View>
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
                  scrollEnabled={false}
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
                  <Text style={styles.streakImpactSub}>Helps protect your {userProfile?.streakCount || 1}-day streak</Text>
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
                        style={({ pressed }) => [
                          styles.hookModalItemCard,
                          isSelected && styles.hookModalItemCardActive,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <View style={styles.hookModalItemHeader}>
                          <Text
                            style={[styles.hookModalItemType, isSelected && styles.hookModalItemTypeActive]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {preset.type}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedCheckBadge}>
                              <Text style={styles.selectedCheckText}>✓ SELECTED</Text>
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
                          if (selectedBodyPresetId === preset.id) {
                            setSelectedBodyPresetId('');
                            setBodyText('');
                          } else {
                            setSelectedBodyPresetId(preset.id);
                            setBodyText(preset.text);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.bodyModalItemCard,
                          isSelected && styles.bodyModalItemCardActive,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <View style={styles.bodyModalItemHeader}>
                          <Text
                            style={[styles.bodyModalItemTitle, isSelected && styles.bodyModalItemTitleActive]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {preset.title}
                          </Text>
                          <View style={styles.modalTagRightGroup}>
                            <View style={[styles.bodyModalTagPill, isSelected && styles.bodyModalTagPillActive]}>
                              <Text style={[styles.bodyModalTagText, isSelected && styles.bodyModalTagTextActive]}>{preset.tag}</Text>
                            </View>
                            {isSelected && (
                              <View style={styles.selectedCheckBadge}>
                                <Text style={styles.selectedCheckText}>✓ SELECTED</Text>
                              </View>
                            )}
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
          {/* LIGHTWEIGHT TAKEAWAY IMPROVEMENT MENU */}
          {/* ========================================================================= */}
          <Modal
            visible={showLessonModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLessonModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>💡 Improve Takeaway</Text>
                    <Text style={styles.modalSubtitle}>Quick 1-tap refinements for your conclusion</Text>
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
                  {TAKEAWAY_QUICK_ACTIONS.map((item) => {
                    const isSelected = takeawayText === item.text;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          if (isSelected) {
                            setTakeawayText('');
                          } else {
                            setTakeawayText(item.text);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.takeawayMenuItemCard,
                          isSelected && styles.takeawayMenuItemCardActive,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <View style={styles.takeawayMenuItemHeader}>
                          <View style={styles.takeawayMenuItemTitleGroup}>
                            <Text style={styles.takeawayMenuIcon}>{item.icon}</Text>
                            <Text
                              style={[styles.takeawayMenuItemTitle, isSelected && styles.takeawayMenuItemTitleActive]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {item.title}
                            </Text>
                          </View>
                          <View style={styles.modalTagRightGroup}>
                            <View style={[styles.takeawayMenuTagPill, isSelected && styles.takeawayMenuTagPillActive]}>
                              <Text style={[styles.takeawayMenuTagText, isSelected && styles.takeawayMenuTagTextActive]}>{item.tag}</Text>
                            </View>
                            {isSelected && (
                              <View style={styles.selectedCheckBadge}>
                                <Text style={styles.selectedCheckText}>✓ SELECTED</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.takeawayMenuItemText}>&ldquo;{item.text}&rdquo;</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Rewrite Action in Lightweight Menu */}
                <Pressable
                  style={({ pressed }) => [styles.takeawayMenuAiBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowLessonModal(false);
                    handleAiRewriteCurrentPhase();
                  }}
                >
                  <Text style={styles.takeawayMenuAiBtnText}>✨ Rewrite · 1 edit</Text>
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
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync();
                          }
                          setSelectedCtaText(cta.text);
                          setCtaIndex(index);
                        }}
                        style={({ pressed }) => [
                          styles.ctaModalItemCard,
                          isSelected && styles.ctaModalItemCardActive,
                          pressed && styles.btnPressed,
                        ]}
                      >
                        <View style={styles.ctaModalItemHeader}>
                          <View style={styles.ctaModalHeaderTopRow}>
                            <Text
                              style={[styles.ctaModalItemType, isSelected && styles.ctaModalItemTypeActive]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {cta.type}
                            </Text>
                            {isSelected && (
                              <View style={styles.selectedCheckBadge}>
                                <Text style={styles.selectedCheckText}>✓ SELECTED</Text>
                              </View>
                            )}
                          </View>
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
            streakCount={userProfile?.streakCount || 1}
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
    fontSize: Platform.OS === 'web' ? ('clamp(18px, 4.5vw, 22px)' as any) : sFont(20),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
  },
  ideaTagPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  ideaTagPillText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#475569',
  },
  streakSaverPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  streakSaverPillText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#6D28D9',
  },

  // 2. Phase Buttons Row (4 Buttons)
  phaseTabsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 14,
  },
  phaseTabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
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
  phaseTabInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
  },
  phaseTabEmoji: {
    fontSize: 11,
  },
  phaseTabBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0,
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
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  sectionIcon: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: sFont(15),
    fontWeight: '800',
    color: '#171420',
  },
  editableHintMicro: {
    fontSize: 9.5,
    color: '#7F7894',
    fontWeight: '700',
    backgroundColor: '#F3EEFB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    overflow: 'hidden',
  },
  editsBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 0,
  },
  editsBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6D28D9',
  },
  editSectionLink: {
    fontSize: sFont(12),
    fontWeight: '800',
    color: '#582CDB',
    marginLeft: 8,
    flexShrink: 0,
  },

  // Active Phase Studio Box
  activePhaseContainer: {
    marginBottom: 10,
  },
  currentSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  studioActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  aiRewriteBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  aiRewriteBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  studioModalBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studioModalBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  altHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  freeBadgeMicro: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  freeBadgeMicroText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  altListContainer: {
    gap: 8,
  },

  // Hook Boxes
  activeHookBox: {
    backgroundColor: '#FAF8FE',
    borderLeftWidth: 3.5,
    borderLeftColor: '#582CDB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  hookInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 20,
    minHeight: 40,
    padding: 0,
    paddingLeft: 2,
    margin: 0,
  },
  alternativeHooksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  altHookBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
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
    borderColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  bodyInput: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    minHeight: 70,
    padding: 0,
    margin: 0,
  },
  bodyQuickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  bodyQuickActionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  bodyQuickActionChipActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  bodyQuickActionIcon: {
    fontSize: 11,
  },
  bodyQuickActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  bodyQuickActionTextActive: {
    color: '#FFFFFF',
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
    alignItems: 'center',
    marginBottom: 14,
  },
  jarvisBannerFlameRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  jarvisBannerFlame: {
    width: 20,
    height: 20,
  },
  jarvisBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 19,
    fontWeight: '600',
  },
  jarvisBannerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
  },
  jarvisBannerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  jarvisBannerChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Takeaway Card
  takeawayBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  takeawayInput: {
    fontSize: 13,
    color: '#171420',
    lineHeight: 19,
    minHeight: 36,
    padding: 0,
    margin: 0,
  },
  takeawayActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  improveTakeawayBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  improveTakeawayBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.2,
  },

  // Call to Action Card
  ctaContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    borderColor: '#EFECE6',
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
    padding: 13,
    marginBottom: 10,
    overflow: 'hidden',
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
    gap: 6,
    marginBottom: 6,
  },
  hookModalItemType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    flex: 1,
    marginRight: 6,
  },
  hookModalItemTypeActive: {
    color: '#582CDB',
  },
  selectedCheckBadge: {
    backgroundColor: '#582CDB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    flexShrink: 0,
    alignSelf: 'center',
  },
  selectedCheckText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalTagRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
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
    padding: 13,
    marginBottom: 10,
    overflow: 'hidden',
  },
  bodyModalItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
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
    gap: 6,
    marginBottom: 6,
  },
  bodyModalItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    flex: 1,
    marginRight: 6,
  },
  bodyModalItemTitleActive: {
    color: '#582CDB',
  },
  bodyModalTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    flexShrink: 0,
  },
  bodyModalTagPillActive: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  bodyModalTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6D28D9',
  },
  bodyModalTagTextActive: {
    color: '#582CDB',
  },
  bodyModalItemText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },

  // Lightweight Takeaway Menu Item Cards
  takeawayMenuItemCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  takeawayMenuItemCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  takeawayMenuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  takeawayMenuItemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  takeawayMenuIcon: {
    fontSize: 13,
  },
  takeawayMenuItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    flexShrink: 1,
  },
  takeawayMenuItemTitleActive: {
    color: '#582CDB',
  },
  takeawayMenuTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    flexShrink: 0,
  },
  takeawayMenuTagPillActive: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  takeawayMenuTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6D28D9',
  },
  takeawayMenuTagTextActive: {
    color: '#582CDB',
  },
  takeawayMenuItemText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  takeawayMenuAiBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  takeawayMenuAiBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // CTA Modal Item Cards
  ctaModalItemCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 13,
    marginBottom: 10,
    overflow: 'hidden',
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
    flexDirection: 'column',
    gap: 3,
    marginBottom: 6,
  },
  ctaModalHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  ctaModalItemType: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
    flex: 1,
    marginRight: 6,
  },
  ctaModalItemTypeActive: {
    color: '#582CDB',
  },
  ctaModalGoal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
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
