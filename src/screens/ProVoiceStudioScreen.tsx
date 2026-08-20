import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProVoiceStudioScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: (threadId?: string) => void;
  onOpenSchedule?: () => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

const VOICE_STYLES = [
  { id: 'energetic', name: 'Energetic Storyteller', tone: 'Confident', pace: 'Medium-fast', desc: 'Warm, clear and confident — designed for creator content.' },
  { id: 'deep', name: 'Deep Narrator', tone: 'Authoritative', pace: 'Steady', desc: 'Resonant and cinematic — perfect for long-form tutorials & essays.' },
  { id: 'casual', name: 'Casual Vlogger', tone: 'Conversational', pace: 'Dynamic', desc: 'Upbeat and relatable — optimal for behind-the-scenes & daily vlogs.' },
  { id: 'tech', name: 'Tech Explainer', tone: 'Analytical', pace: 'Precise', desc: 'Crisp and articulate — engineered for breakdowns & SaaS walkthroughs.' },
];

export const ProVoiceStudioScreen: React.FC<ProVoiceStudioScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenPostComposer,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showManageMinutesModal, setShowManageMinutesModal] = useState(false);
  const [showVoiceStyleModal, setShowVoiceStyleModal] = useState(false);

  // Script & Audio State
  const [scriptText, setScriptText] = useState(
    "Stop making this mistake if you want to stay consistent as a creator. Consistency isn't about working 24/7—it's about building a system that works even when you're not in the mood. Let me show you my 3-step 'Streak Engine' that has kept me posting for 42 days straight without burn out."
  );
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState(VOICE_STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0.35);

  // 3D Ghost Celebration Modal State
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: 'Voiceover Generated!',
    subtitle: 'Ultra-realistic 4K AI audio synced with your video script draft.',
    badgeText: '🎙️ PRO AUDIO RENDERED',
    xpEarned: 50,
    speechBubble: 'Sounds clean and punchy, Pablo! Ready for Reels & TikTok! 🎧',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const waveformAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 4,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  useEffect(() => {
    if (isPlayingAudio) {
      const waveLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(waveformAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      waveLoop.start();
      return () => waveLoop.stop();
    }
  }, [isPlayingAudio, waveformAnim]);

  const showToast = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
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

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleGenerateVoice = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsPlayingAudio(true);
      setCelebrationData({
        title: 'Studio Voiceover Rendered!',
        subtitle: `Generated with "${selectedVoiceStyle.name}" (42 seconds • 1 min usage).`,
        badgeText: '🎙️ 4K STUDIO AUDIO READY',
        xpEarned: 50,
        speechBubble: 'Sounds clean and punchy, Pablo! Ready for Reels & TikTok! 🎧',
      });
      setShowCelebrationModal(true);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* 1. TOP HEADER BAR */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onBack();
              }}
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

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

          <View style={styles.headerRight}>
            {/* Pro Switch Badge */}
            {onSwitchToFree && (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onSwitchToFree();
                }}
                style={styles.proPillBadge}
              >
                <Text style={styles.proPillBadgeText}>⚡ PRO ACTIVE</Text>
              </Pressable>
            )}

            {/* Message Bubble Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                } else if (onNavigateTab) {
                  onNavigateTab('match');
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

            {/* Notification Bell Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
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
              <View style={styles.notificationDot} />
            </Pressable>

            {/* User Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerProfileImg}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* BADGES HEADER ROW */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPillGold}>
              <Text style={styles.heroPillGoldText}>VOICE STUDIO — PRO</Text>
            </View>
            <View style={styles.heroPillPurple}>
              <Text style={styles.heroPillPurpleText}>Pro Voice Active</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Turn scripts into voiceovers.</Text>

          {/* ============================================================ */}
          {/* CARD 1: VOICE MINUTES CARD                                   */}
          {/* ============================================================ */}
          <View style={styles.dashboardCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.minutesCardLabel}>Voice Minutes</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={styles.minutesBigNumber}>118</Text>
                  <Text style={styles.minutesTotalText}> / 150 min remaining</Text>
                </View>
                <Text style={styles.minutesResetText}>Resets in 19 days</Text>

                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  <View style={styles.minuteTagPill}>
                    <Text style={styles.minuteTagText}>PRO INCLUDED</Text>
                  </View>
                  <View style={styles.minuteTagPill}>
                    <Text style={styles.minuteTagText}>EXPORT READY</Text>
                  </View>
                </View>
              </View>

              {/* Stopwatch Icon Circle */}
              <View style={styles.stopwatchCircle}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="13" r="8" stroke="#582CDB" strokeWidth="2.2" />
                  <Path d="M12 9v4l2.5 2.5" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
                  <Path d="M12 5V2M10 2h4" stroke="#582CDB" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.manageMinutesBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowManageMinutesModal(true);
              }}
            >
              <Text style={styles.manageMinutesBtnText}>Manage Minutes</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION: SCRIPT TO VOICE                                      */}
          {/* ============================================================ */}
          <Text style={styles.sectionHeaderTitle}>Script to Voice</Text>

          <View style={styles.scriptEditorCard}>
            <TextInput
              style={styles.scriptTextInput}
              multiline
              value={scriptText}
              onChangeText={setScriptText}
              placeholder="Paste or type your video script here..."
              placeholderTextColor="#94A3B8"
            />

            {/* Editor Footer Row */}
            <View style={styles.scriptFooterRow}>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <View>
                  <Text style={styles.metaKeyLabel}>LENGTH</Text>
                  <Text style={styles.metaValText}>0:42</Text>
                </View>
                <View>
                  <Text style={styles.metaKeyLabel}>USAGE</Text>
                  <Text style={styles.metaValText}>1 min</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={styles.toolIconBtn}
                  onPress={() => {
                    setScriptText(
                      "Stop scrolling if you're a creator. Consistency isn't about hustle 24/7—it's about the 'Streak Engine' system that keeps you posting effortlessly."
                    );
                    showToast('🪄 Enhanced 3-second viral hook applied!');
                  }}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 14 }}>🪄</Text>
                </Pressable>
                <Pressable
                  style={styles.toolIconBtn}
                  onPress={() => {
                    triggerModalPop();
                    setShowVoiceStyleModal(true);
                  }}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 14 }}>🎚️</Text>
                </Pressable>
                <Pressable
                  style={styles.toolIconBtn}
                  onPress={() => showToast('📄 Template loaded')}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 14 }}>📥</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Generate Voice Button */}
          <Pressable
            style={({ pressed }) => [styles.generateVoiceBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateVoice}
          >
            <LinearGradient
              colors={['#582CDB', '#6D28D9', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateVoiceGradient}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M12 2v20M17 5v14M7 9v6M22 10v4M2 10v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
              <Text style={styles.generateVoiceBtnText}>
                {isGenerating ? 'Generating AI Voice...' : 'Generate Voice'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* ============================================================ */}
          {/* SECTION: VOICE PREVIEW                                       */}
          {/* ============================================================ */}
          <View style={styles.previewContainerBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 18 }}>🎧</Text>
              <Text style={styles.sectionHeaderTitle}>Voice Preview</Text>
            </View>

            <View style={styles.audioPlayerCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.audioTrackTitle}>Creator Mistake Reel Voiceover</Text>
                <Text style={styles.audioTrackDuration}>0:42</Text>
              </View>

              {/* Scrubber & Controls */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Pressable
                  style={styles.playPauseCircle}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setIsPlayingAudio(!isPlayingAudio);
                  }}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    {isPlayingAudio ? (
                      <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#FFFFFF" />
                    ) : (
                      <Path d="M8 5v14l11-7L8 5z" fill="#FFFFFF" />
                    )}
                  </Svg>
                </Pressable>

                {/* Scrubber Bar */}
                <View style={styles.scrubberTrackBg}>
                  <View style={[styles.scrubberTrackFill, { width: `${audioPlaybackProgress * 100}%` }]} />
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <Pressable
                  style={({ pressed }) => [styles.audioSecondaryBtn, pressed && styles.btnPressed]}
                  onPress={handleGenerateVoice}
                >
                  <Text style={styles.audioSecondaryBtnText}>🔄 Regenerate</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.audioSecondaryBtn, pressed && styles.btnPressed]}
                  onPress={() => showToast('📥 4K Voiceover exported (.WAV)')}
                >
                  <Text style={styles.audioSecondaryBtnText}>📥 Export</Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [styles.useInPostBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (onOpenPostComposer) {
                    onOpenPostComposer('Creator Mistake Reel (Voiceover Attached)');
                  }
                }}
              >
                <Text style={styles.useInPostBtnText}>Use in Post</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.saveLibraryBtn, pressed && styles.btnPressed]}
                onPress={() => showToast('✓ Saved to Studio Library')}
              >
                <Text style={styles.saveLibraryBtnText}>Save to Library</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION: RECENT VOICE PROJECTS                               */}
          {/* ============================================================ */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 }}>
            <Text style={styles.sectionHeaderTitle}>Recent Voice Projects</Text>
            <Pressable onPress={() => showToast('Showing all voice projects')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <View style={styles.projectItemCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.projectIconBox}>
                  <Text style={{ fontSize: 16 }}>📈</Text>
                </View>
                <View>
                  <Text style={styles.projectNameText}>Creator Mistake Reel</Text>
                  <Text style={styles.projectSubText}>0:42 • Exported</Text>
                </View>
              </View>
              <Pressable
                style={styles.projectReuseBtn}
                onPress={() => showToast('Re-loaded script to editor')}
              >
                <Text style={styles.projectReuseBtnText}>Reuse</Text>
              </Pressable>
            </View>

            <View style={styles.projectItemCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.projectIconBox}>
                  <Text style={{ fontSize: 16 }}>📑</Text>
                </View>
                <View>
                  <Text style={styles.projectNameText}>Morning Routine Mini</Text>
                  <Text style={styles.projectSubText}>0:58 • Saved</Text>
                </View>
              </View>
              <Pressable
                style={styles.projectOpenBtn}
                onPress={() => showToast('Opened Morning Routine project')}
              >
                <Text style={styles.projectOpenBtnText}>Open</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD: SAVED VOICE STYLE                                      */}
          {/* ============================================================ */}
          <View style={[styles.dashboardCard, { marginTop: 16 }]}>
            <Text style={styles.savedVoiceHeaderLabel}>SAVED VOICE STYLE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <View style={styles.voiceAvatarBox}>
                <Text style={{ fontSize: 20 }}>🎙️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceStyleNameText}>{selectedVoiceStyle.name}</Text>
                <Text style={styles.voiceStyleDescText}>{selectedVoiceStyle.desc}</Text>
              </View>
            </View>

            {/* Tone & Pace Chips */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={styles.toneChipBox}>
                <Text style={styles.toneChipLabel}>TONE</Text>
                <Text style={styles.toneChipValue}>{selectedVoiceStyle.tone}</Text>
              </View>
              <View style={styles.toneChipBox}>
                <Text style={styles.toneChipLabel}>PACE</Text>
                <Text style={styles.toneChipValue}>{selectedVoiceStyle.pace}</Text>
              </View>
            </View>

            {/* Animated Waveform Visualizer */}
            <View style={styles.waveformContainerRow}>
              {[12, 28, 48, 20, 56, 32, 16, 44, 26, 14, 38, 22].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: h, backgroundColor: i % 2 === 0 ? '#582CDB' : '#F59E0B' },
                  ]}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={({ pressed }) => [styles.voicePreviewBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setIsPlayingAudio(true);
                  showToast(`Playing sample preview for ${selectedVoiceStyle.name}`);
                }}
              >
                <Text style={styles.voicePreviewBtnText}>Preview</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.voiceChangeBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowVoiceStyleModal(true);
                }}
              >
                <Text style={styles.voiceChangeBtnText}>Change</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD: JARVIS INSIGHT                                         */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#FAF8F5', '#F5F3FF', '#EDE9FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisInsightGradientCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
              <Text style={styles.jarvisInsightTitle}>Jarvis Insight</Text>
            </View>
            <Text style={styles.jarvisInsightBody}>
              Keep this voiceover under 45 seconds. Shorter voiceovers with a clear hook tend to score better for Reels.
            </Text>
          </LinearGradient>

          {/* ============================================================ */}
          {/* CARD: NEED MORE MINUTES (GOLDEN AMBER CARD)                  */}
          {/* ============================================================ */}
          <View style={styles.needMinutesCard}>
            <Text style={styles.needMinutesTitle}>Need more minutes?</Text>
            <Text style={styles.needMinutesSub}>
              Buy extra voice minutes when your included Pro minutes run low.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.buyMoreBtn, pressed && styles.btnPressed]}
              onPress={() => showToast('Extra Voice Minute Packs coming soon in Pro v2!')}
            >
              <Text style={styles.buyMoreBtnText}>Buy More (Coming soon)</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* FLOATING BOTTOM TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL 1: VOICE STYLE SELECTOR MODAL                          */}
        {/* ============================================================ */}
        <Modal
          visible={showVoiceStyleModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceStyleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <View style={styles.heroPillPurple}>
                  <Text style={styles.heroPillPurpleText}>🎙️ PRO VOICE STYLES</Text>
                </View>
                <Pressable onPress={() => setShowVoiceStyleModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>Select Voice Tone &amp; Style</Text>
              <Text style={styles.modalSub}>
                Trained on high-retention creator formats for Reels, TikTok &amp; YouTube Shorts.
              </Text>

              <View style={{ gap: 8, marginVertical: 14 }}>
                {VOICE_STYLES.map((v) => {
                  const isSelected = selectedVoiceStyle.id === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      style={[
                        styles.voiceOptionCard,
                        isSelected && styles.voiceOptionCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedVoiceStyle(v);
                        setShowVoiceStyleModal(false);
                        showToast(`✓ Switched to ${v.name}`);
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.voiceOptionName}>{v.name}</Text>
                        {isSelected && <Text style={styles.voiceOptionCheck}>✓ ACTIVE</Text>}
                      </View>
                      <Text style={styles.voiceOptionDesc}>{v.desc}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <View style={styles.minuteTagPill}>
                          <Text style={styles.minuteTagText}>{v.tone}</Text>
                        </View>
                        <View style={styles.minuteTagPill}>
                          <Text style={styles.minuteTagText}>{v.pace}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowVoiceStyleModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 2: MANAGE MINUTES MODAL                                */}
        {/* ============================================================ */}
        <Modal
          visible={showManageMinutesModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowManageMinutesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <View style={styles.heroPillGold}>
                  <Text style={styles.heroPillGoldText}>👑 VOICE MINUTES QUOTA</Text>
                </View>
                <Pressable onPress={() => setShowManageMinutesModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>Voice Minutes &amp; Allocation</Text>
              <Text style={styles.modalSub}>
                118 of 150 minutes remaining for this billing cycle. Resets on Aug 1st.
              </Text>

              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.transferRow}>
                  <View>
                    <Text style={styles.transferDate}>Creator Mistake Reel</Text>
                    <Text style={styles.transferStatus}>Jul 18 • 1 min deducted</Text>
                  </View>
                  <Text style={styles.transferAmount}>-1 min</Text>
                </View>
                <View style={styles.transferRow}>
                  <View>
                    <Text style={styles.transferDate}>Morning Routine Mini</Text>
                    <Text style={styles.transferStatus}>Jul 14 • 1 min deducted</Text>
                  </View>
                  <Text style={styles.transferAmount}>-1 min</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowManageMinutesModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* PROFILE MODAL */}
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
                <Text style={styles.modalTitle}>Voice Studio Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.transferRow}>
                  <Text style={{ fontSize: 20 }}>🎙️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transferDate}>Pro Voice Minutes Refreshed</Text>
                    <Text style={styles.transferStatus}>150 Ultra HD voice minutes credited</Text>
                  </View>
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
          visible={showCelebrationModal}
          onDismiss={() => setShowCelebrationModal(false)}
          title={celebrationData.title}
          subtitle={celebrationData.subtitle}
          badgeText={celebrationData.badgeText}
          xpEarned={celebrationData.xpEarned}
          speechBubble={celebrationData.speechBubble}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proPillBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  headerProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  heroPillGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  heroPillGoldText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  heroPillPurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  heroPillPurpleText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  mainTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 16,
  },

  // CARD 1: MINUTES
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  minutesCardLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  minutesBigNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#582CDB',
  },
  minutesTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  minutesResetText: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
    fontWeight: '700',
  },
  minuteTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  minuteTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  stopwatchCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageMinutesBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  manageMinutesBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#171420',
  },

  // SCRIPT TO VOICE
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 8,
  },
  scriptEditorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  scriptTextInput: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#171420',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  scriptFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
    marginTop: 10,
  },
  metaKeyLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
  },
  metaValText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  toolIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateVoiceBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  generateVoiceGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // PREVIEW CONTAINER
  previewContainerBox: {
    marginTop: 22,
  },
  audioPlayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  audioTrackTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  audioTrackDuration: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  playPauseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  scrubberTrackBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubberTrackFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  audioSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  audioSecondaryBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  useInPostBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  useInPostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  saveLibraryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveLibraryBtnText: {
    color: '#171420',
    fontSize: 12.5,
    fontWeight: '900',
  },

  // RECENT PROJECTS
  viewAllLink: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  projectItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  projectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  projectSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  projectReuseBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  projectReuseBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  projectOpenBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  projectOpenBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },

  // SAVED VOICE STYLE
  savedVoiceHeaderLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  voiceAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceStyleNameText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  voiceStyleDescText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  toneChipBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  toneChipLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
  },
  toneChipValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
    marginTop: 2,
  },
  waveformContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  voicePreviewBtn: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  voicePreviewBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  voiceChangeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  voiceChangeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },

  // JARVIS INSIGHT GRADIENT CARD
  jarvisInsightGradientCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 14,
  },
  jarvisInsightTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
  },
  jarvisInsightBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  // NEED MINUTES CARD
  needMinutesCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 14,
  },
  needMinutesTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E',
  },
  needMinutesSub: {
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  buyMoreBtn: {
    backgroundColor: '#171420',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buyMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
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
    marginBottom: 12,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '900',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  voiceOptionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  voiceOptionCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  voiceOptionName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
  },
  voiceOptionCheck: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  voiceOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  transferDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  transferStatus: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
  },
  transferAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
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
    fontSize: 12,
    fontWeight: '800',
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
});
