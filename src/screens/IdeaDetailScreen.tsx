import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';

export type TabType = 'home' | 'create' | 'match' | 'quests' | 'growth';

interface IdeaDetailScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

const HOOK_OPTIONS = [
  'Stop making this mistake if you want to stay consistent as a creator.',
  'I wish someone told me this before I started creating.',
  'This one habit made content creation 10x easier.',
];

const PLATFORM_OPTIONS = [
  { id: 'tiktok', name: 'TikTok', multiplier: '0.8x', icon: '♪' },
  { id: 'instagram', name: 'Insta Reel', multiplier: '1.2x', icon: '📷' },
  { id: 'shorts', name: 'Shorts', multiplier: '1.0x', icon: '▶' },
  { id: 'linkedin', name: 'LinkedIn', multiplier: '1.5x', icon: 'in' },
  { id: 'x', name: 'X', multiplier: '0.9x', icon: '𝕏' },
];

export const IdeaDetailScreen: React.FC<IdeaDetailScreenProps> = ({
  ideaTitle = 'One thing I wish I knew before I started creating',
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram']);
  const [hooksList, setHooksList] = useState<string[]>(HOOK_OPTIONS);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [selectedInsightFilter, setSelectedInsightFilter] = useState<'shorter' | 'stronger' | 'script'>('stronger');

  // Modals
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Script text state
  const [scriptDraft, setScriptDraft] = useState(
    `[HOOK - 0:00-0:03]\n"${HOOK_OPTIONS[0]}"\n\n[STORY - 0:03-0:15]\nFor the first 6 months, I waited until every video had perfect lighting and editing before posting. That caused me to post once every 3 weeks instead of building consistency.\n\n[LESSON - 0:15-0:25]\nThe moment I switched to daily raw value-first videos, my views 10xed and my community grew by 40k creators.\n\n[CTA - 0:25-0:30]\nWhat\'s one thing you\'re overthinking right now? Drop it below and let\'s fix it!`
  );

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  const triggerModalAnim = () => {
    modalPopScale.setValue(0.92);
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
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const handleSelectHook = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedHookIndex(index);
    setScriptDraft((prev) => {
      return prev.replace(/^\[HOOK - 0:00-0:03\]\n".*?"/, `[HOOK - 0:00-0:03]\n"${hooksList[index]}"`);
    });
  };

  const handleGenerateMoreHooks = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsGeneratingHooks(true);
    setTimeout(() => {
      setIsGeneratingHooks(false);
      const newHooks = [
        'If I had to start over from 0 followers, this is what I would do.',
        'The #1 mistake killing 90% of beginner creator streaks.',
        'Why quality without consistency never gets you algorithmic reach.',
      ];
      setHooksList(newHooks);
      setSelectedHookIndex(0);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 450);
  };

  const handleGenerateCaption = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsGeneratingCaption(true);
    setTimeout(() => {
      setIsGeneratingCaption(false);
      setGeneratedCaption(
        'I used to wait until everything was perfect before posting. That slowed me down more than anything.\n\nThe real secret to creator momentum is volume + iteration. Done is better than perfect.\n\nSave this for your next creator session! 💾\n\n#contentcreator #creatorgrowth #poststreak #creators'
      );
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 400);
  };

  const handleTurnIntoPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSuccessMessage(`Post "${ideaTitle}" has been converted and added to your creator drafts queue!`);
    triggerModalAnim();
    setShowSuccessModal(true);
  };

  const handleOpenScript = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    triggerModalAnim();
    setShowScriptModal(true);
  };

  const handleOpenSchedule = () => {
    if (onOpenSchedule) {
      onOpenSchedule();
    } else {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      triggerModalAnim();
      setShowScheduleModal(true);
    }
  };

  return (
    <View style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
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

        <View style={styles.headerPillsGroup}>
          <View style={styles.selectedIdeaHeaderPill}>
            <Text style={styles.selectedIdeaHeaderPillText}>SELECTED IDEA</Text>
          </View>
          <View style={styles.freeCreatorToolPill}>
            <Text style={styles.freeCreatorToolPillText}>Free Creator Tool</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (onOpenJarvisPro) onOpenJarvisPro();
          }}
          style={({ pressed }) => [styles.proCrownBtn, pressed && styles.btnPressed]}
          hitSlop={8}
        >
          <Text style={{ fontSize: 16 }}>⚡</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Title & Subtitle */}
        <Text style={styles.mainTitle}>Turn this idea into your next post.</Text>
        <Text style={styles.mainSubtitle}>
          Use this streak-saving idea to create content your audience can connect with.
        </Text>

        {/* 1. SELECTED IDEA SHOWCASE CARD */}
        <View style={styles.selectedIdeaCard}>
          <View style={styles.ideaCardHeaderRow}>
            <Text style={styles.ideaCardTag}>SELECTED IDEA</Text>
            <View style={styles.lightbulbCircle}>
              <Text style={{ fontSize: 15 }}>💡</Text>
            </View>
          </View>

          <Text style={styles.ideaCardTitle}>&ldquo;{ideaTitle}&rdquo;</Text>
          <Text style={styles.ideaCardDescription}>
            Share one honest lesson that would help another creator avoid a mistake or stay consistent.
          </Text>

          {/* Goal Callout Box */}
          <View style={styles.goalCalloutBox}>
            <Text style={styles.goalCalloutText}>
              <Text style={styles.goalCalloutBold}>Goal: </Text>
              Protect your streak and create useful content your audience can save.
            </Text>
          </View>

          {/* Tags Row */}
          <View style={styles.ideaTagsRow}>
            <View style={styles.ideaTagPill}>
              <Text style={styles.ideaTagPillText}>Personal Lesson</Text>
            </View>
            <View style={styles.ideaTagPill}>
              <Text style={styles.ideaTagPillText}>Creator Advice</Text>
            </View>
            <View style={styles.ideaTagPill}>
              <Text style={styles.ideaTagPillText}>High Save Potential</Text>
            </View>
          </View>

          {/* Streak Protection Ribbon */}
          <View style={styles.streakRibbonBanner}>
            <Text style={styles.streakRibbonIcon}>🎖</Text>
            <Text style={styles.streakRibbonText}>
              Completing this today helps protect your <Text style={{ fontWeight: '800' }}>47-day streak</Text>.
            </Text>
          </View>
        </View>

        {/* 2. SUGGESTED FORMAT */}
        <Text style={styles.sectionLabel}>SUGGESTED FORMAT</Text>
        <Pressable
          style={({ pressed }) => [styles.formatCard, pressed && styles.btnPressed]}
          onPress={handleOpenScript}
        >
          <View style={styles.formatLeftGroup}>
            <View style={styles.formatIconBox}>
              <Text style={{ fontSize: 18 }}>📹</Text>
            </View>
            <View>
              <View style={styles.formatTitleRow}>
                <Text style={styles.formatTitle}>30s Reel / TikTok</Text>
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>REC</Text>
                </View>
              </View>
              <Text style={styles.formatSubtitle}>Talking head / POV</Text>
            </View>
          </View>
          <Text style={styles.formatChevron}>›</Text>
        </Pressable>

        {/* 3. PLATFORMS */}
        <Text style={styles.sectionLabel}>PLATFORMS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformsScrollRow}>
          {PLATFORM_OPTIONS.map((plat) => {
            const isSelected = selectedPlatforms.includes(plat.id);
            return (
              <Pressable
                key={plat.id}
                onPress={() => togglePlatform(plat.id)}
                style={({ pressed }) => [
                  styles.platformPill,
                  isSelected && styles.platformPillActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={{ fontSize: 12 }}>{plat.icon}</Text>
                <Text style={[styles.platformPillText, isSelected && styles.platformPillTextActive]}>
                  {plat.name}
                </Text>
                <View style={[styles.platformMultiplierBadge, isSelected && styles.platformMultiplierBadgeActive]}>
                  <Text style={[styles.platformMultiplierText, isSelected && styles.platformMultiplierTextActive]}>
                    {plat.multiplier}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. SUGGESTED HOOK */}
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>SUGGESTED HOOK</Text>
          <View style={styles.hookCounterBadge}>
            <Text style={styles.hookCounterBadgeText}>2 left today</Text>
          </View>
        </View>

        <View style={styles.hookCardContainer}>
          {hooksList.map((hook, hIdx) => {
            const isSelected = selectedHookIndex === hIdx;
            return (
              <Pressable
                key={`hook_${hIdx}`}
                onPress={() => handleSelectHook(hIdx)}
                style={[
                  styles.hookOptionBox,
                  isSelected && styles.hookOptionBoxSelected,
                ]}
              >
                {isSelected && <View style={styles.hookActiveBar} />}
                <Text style={[styles.hookOptionText, isSelected && styles.hookOptionTextSelected]}>
                  &ldquo;{hook}&rdquo;
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.hookBtnRow}>
            <Pressable
              style={({ pressed }) => [styles.useHookBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                handleOpenScript();
              }}
            >
              <Text style={styles.useHookBtnText}>Use Hook</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.generateMoreBtn, pressed && styles.btnPressed]}
              onPress={handleGenerateMoreHooks}
              disabled={isGeneratingHooks}
            >
              <Text style={styles.generateMoreBtnText}>
                {isGeneratingHooks ? 'Generating...' : 'Generate More'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 5. CAPTION DIRECTION */}
        <Text style={styles.sectionLabel}>CAPTION DIRECTION</Text>
        <View style={styles.captionCard}>
          <Text style={styles.captionAngleBold}>Angle:</Text>
          <Text style={styles.captionAngleDesc}>
            Be honest, helpful and specific. Share the mistake, what changed, and one takeaway other creators can use.
          </Text>

          <View style={styles.starterTextBox}>
            <Text style={styles.starterTextLabel}>STARTER TEXT</Text>
            <Text style={styles.starterTextContent}>
              &ldquo;I used to wait until everything was perfect before posting. That slowed me down more than anything...&rdquo;
            </Text>
          </View>

          {/* Hint Chips */}
          <View style={styles.captionHintPillsRow}>
            <View style={styles.captionHintPill}>
              <Text style={styles.captionHintPillText}>• Mistake</Text>
            </View>
            <View style={styles.captionHintPill}>
              <Text style={styles.captionHintPillText}>• Lesson</Text>
            </View>
            <View style={styles.captionHintPill}>
              <Text style={styles.captionHintPillText}>• Takeaway</Text>
            </View>
            <View style={styles.captionHintPill}>
              <Text style={styles.captionHintPillText}>• Question</Text>
            </View>
          </View>

          {generatedCaption && (
            <View style={styles.generatedCaptionOutputBox}>
              <Text style={styles.generatedCaptionOutputText}>{generatedCaption}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.generateCaptionBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateCaption}
            disabled={isGeneratingCaption}
          >
            <Text style={styles.generateCaptionBtnText}>
              {isGeneratingCaption ? '✨ Refining Caption...' : '✨ Generate Caption'}
            </Text>
          </Pressable>
        </View>

        {/* 6. POST STRUCTURE (2x2 Grid) */}
        <Text style={styles.sectionLabel}>POST STRUCTURE</Text>
        <View style={styles.structureGrid}>
          <View style={styles.structureCard}>
            <Text style={styles.structureNumber}>1.</Text>
            <Text style={styles.structureTitle}>Hook</Text>
            <Text style={styles.structureSub}>First 3 seconds</Text>
          </View>

          <View style={styles.structureCard}>
            <Text style={styles.structureNumber}>2.</Text>
            <Text style={styles.structureTitle}>Story</Text>
            <Text style={styles.structureSub}>Explain mistake</Text>
          </View>

          <View style={styles.structureCard}>
            <Text style={styles.structureNumber}>3.</Text>
            <Text style={styles.structureTitle}>Lesson</Text>
            <Text style={styles.structureSub}>Share change</Text>
          </View>

          <View style={styles.structureCard}>
            <Text style={styles.structureNumber}>4.</Text>
            <Text style={styles.structureTitle}>CTA</Text>
            <Text style={styles.structureSub}>Ask audience</Text>
          </View>
        </View>

        {/* 7. JARVIS INSIGHT CARD */}
        <LinearGradient
          colors={['#7C3AED', '#582CDB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.jarvisCard}
        >
          <View style={styles.jarvisHeaderRow}>
            <View style={styles.jarvisFlameIconBox}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisFlameImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.jarvisInsightTag}>JARVIS INSIGHT</Text>
          </View>

          <Text style={styles.jarvisBodyText}>
            This idea works because it is personal, useful, and easy for other creators to save. Keep the lesson specific.
          </Text>

          {/* Quick Filter Chips */}
          <View style={styles.jarvisChipsRow}>
            <Pressable
              onPress={() => setSelectedInsightFilter('shorter')}
              style={[
                styles.jarvisChip,
                selectedInsightFilter === 'shorter' && styles.jarvisChipActive,
              ]}
            >
              <Text style={styles.jarvisChipText}>Shorter</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedInsightFilter('stronger')}
              style={[
                styles.jarvisChip,
                selectedInsightFilter === 'stronger' && styles.jarvisChipActive,
              ]}
            >
              <Text style={styles.jarvisChipText}>Stronger Hook</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedInsightFilter('script')}
              style={[
                styles.jarvisChip,
                selectedInsightFilter === 'script' && styles.jarvisChipActive,
              ]}
            >
              <Text style={styles.jarvisChipText}>Script</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.improveIdeaBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              handleGenerateMoreHooks();
            }}
          >
            <Text style={styles.improveIdeaBtnText}>🪄 Improve Idea</Text>
          </Pressable>
        </LinearGradient>

        {/* 8. STREAK IMPACT CARD */}
        <Text style={styles.sectionLabel}>STREAK IMPACT</Text>
        <View style={styles.streakImpactCard}>
          <View style={styles.streakImpactItemRow}>
            <View style={styles.impactCheckCircle}>
              <Text style={{ fontSize: 12, color: '#582CDB' }}>✓</Text>
            </View>
            <Text style={styles.streakImpactText}>47-day streak protected</Text>
          </View>

          <View style={styles.streakImpactItemRow}>
            <View style={styles.impactGrowthCircle}>
              <Text style={{ fontSize: 12, color: '#582CDB' }}>📈</Text>
            </View>
            <Text style={styles.streakImpactText}>+40 Creator XP</Text>
          </View>

          {/* Mission Progress */}
          <View style={styles.missionProgressContainer}>
            <View style={styles.missionProgressHeader}>
              <Text style={styles.missionProgressTitle}>MISSION: POST 1 CONTENT</Text>
              <Text style={styles.missionProgressCount}>0/1</Text>
            </View>
            <View style={styles.missionProgressBarTrack}>
              <View style={[styles.missionProgressBarFill, { width: '25%' }]} />
            </View>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.stickyBottomBar}>
        <Pressable
          style={({ pressed }) => [styles.turnIntoPostBtn, pressed && styles.btnPressed]}
          onPress={handleTurnIntoPost}
        >
          <LinearGradient
            colors={['#7C3AED', '#582CDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.turnIntoPostGradient}
          >
            <Text style={styles.turnIntoPostBtnText}>Turn Into Post</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.bottomSubBtnRow}>
          <Pressable
            style={({ pressed }) => [styles.subActionBtn, pressed && styles.btnPressed]}
            onPress={handleOpenScript}
          >
            <Text style={styles.subActionBtnText}>📝 Script</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.subActionBtn, pressed && styles.btnPressed]}
            onPress={handleOpenSchedule}
          >
            <Text style={styles.subActionBtnText}>📅 Schedule</Text>
          </Pressable>
        </View>

        <Text style={styles.bottomDisclaimer}>Save as draft or schedule for later.</Text>
      </View>

      {/* MODAL 1: SCRIPT EDITOR */}
      <Modal
        visible={showScriptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScriptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Creator Script</Text>
                <Text style={styles.modalSubtitle}>30s Video Script for &ldquo;{ideaTitle}&rdquo;</Text>
              </View>
              <Pressable onPress={() => setShowScriptModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                <Text style={styles.modalCloseCross}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.scriptTextInput}
              multiline
              value={scriptDraft}
              onChangeText={setScriptDraft}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => setShowScriptModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Close</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setShowScriptModal(false);
                  setSuccessMessage('Script copied to your post drafts queue!');
                  setShowSuccessModal(true);
                }}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  style={styles.modalBtnGradient}
                >
                  <Text style={styles.modalPrimaryBtnText}>Save Script ✓</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL 2: SCHEDULE POST */}
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
                <Text style={styles.modalTitle}>Schedule Idea</Text>
                <Text style={styles.modalSubtitle}>Queued for your highest viral reach window</Text>
              </View>
              <Pressable onPress={() => setShowScheduleModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                <Text style={styles.modalCloseCross}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.schedulePeakBox}>
              <Text style={styles.schedulePeakLabel}>RECOMMENDED SLOT</Text>
              <Text style={styles.schedulePeakTime}>Today • 7:30 PM</Text>
              <Text style={styles.schedulePeakReason}>⚡ Peak 94 Viral Score on TikTok & Instagram</Text>
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setShowScheduleModal(false);
                  setSuccessMessage('Post successfully scheduled for Today at 7:30 PM!');
                  setShowSuccessModal(true);
                }}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  style={styles.modalBtnGradient}
                >
                  <Text style={styles.modalPrimaryBtnText}>Confirm Slot ➔</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL 3: SUCCESS CELEBRATION */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }], alignItems: 'center' }]}>
            <View style={styles.successCelebrationCircle}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>Idea Ready!</Text>
            <Text style={styles.successDesc}>{successMessage}</Text>

            <Pressable
              style={styles.successFullBtn}
              onPress={() => {
                setShowSuccessModal(false);
                onBack();
              }}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalPrimaryBtnText}>Done ✓</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* BOTTOM TAB BAR */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomTabBar}>
          <Pressable
            style={styles.tabItem}
            onPress={() => handleTabPress('home')}
            hitSlop={6}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                stroke={activeTab === 'home' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => handleTabPress('create')}
            hitSlop={6}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5V19M5 12H19"
                stroke={activeTab === 'create' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'create' && styles.tabLabelActive]}>
              Create
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => handleTabPress('match')}
            hitSlop={6}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21"
                stroke={activeTab === 'match' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <Circle
                cx="12"
                cy="7"
                r="4"
                stroke={activeTab === 'match' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.2"
              />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'match' && styles.tabLabelActive]}>
              Match
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => handleTabPress('quests')}
            hitSlop={6}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle
                cx="12"
                cy="12"
                r="9"
                stroke={activeTab === 'quests' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.2"
              />
              <Path
                d="M12 7V12L15 15"
                stroke={activeTab === 'quests' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'quests' && styles.tabLabelActive]}>
              Quests
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => handleTabPress('growth')}
            hitSlop={6}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 20V10M12 20V4M6 20V14"
                stroke={activeTab === 'growth' ? '#582CDB' : '#9E97AA'}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'growth' && styles.tabLabelActive]}>
              Growth
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 10,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EBFB',
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
  },
  headerPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedIdeaHeaderPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 3.5,
    paddingHorizontal: 8.5,
    borderRadius: 100,
  },
  selectedIdeaHeaderPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  freeCreatorToolPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3.5,
    paddingHorizontal: 8.5,
    borderRadius: 100,
  },
  freeCreatorToolPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  proCrownBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Main Heading
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },

  // 1. Selected Idea Showcase Card
  selectedIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  ideaCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ideaCardTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.6,
  },
  lightbulbCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideaCardTitle: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 25,
    marginBottom: 8,
  },
  ideaCardDescription: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  goalCalloutBox: {
    backgroundColor: '#F8F6FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 10,
    marginBottom: 12,
  },
  goalCalloutText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  goalCalloutBold: {
    fontWeight: '800',
    color: '#582CDB',
  },
  ideaTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  ideaTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  ideaTagPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  streakRibbonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 6,
  },
  streakRibbonIcon: {
    fontSize: 14,
  },
  streakRibbonText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },

  // Section Labels
  sectionLabel: {
    fontSize: 10.5,
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

  // 2. Suggested Format
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 18,
  },
  formatLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  recBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  recBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#B45309',
  },
  formatSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
  },
  formatChevron: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // 3. Platforms
  platformsScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 18,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  platformPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#6D28D9',
  },
  platformPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  platformPillTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },
  platformMultiplierBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  platformMultiplierBadgeActive: {
    backgroundColor: '#6D28D9',
  },
  platformMultiplierText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  platformMultiplierTextActive: {
    color: '#FFFFFF',
  },

  // 4. Suggested Hook
  hookCounterBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  hookCounterBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  hookCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 18,
  },
  hookOptionBox: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  hookOptionBoxSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#6D28D9',
  },
  hookActiveBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#6D28D9',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  hookOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
    paddingLeft: 4,
  },
  hookOptionTextSelected: {
    fontWeight: '800',
    color: '#171420',
  },
  hookBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  useHookBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  useHookBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  generateMoreBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateMoreBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 5. Caption Direction
  captionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
  },
  captionAngleBold: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  captionAngleDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  starterTextBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  starterTextLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  starterTextContent: {
    fontSize: 12.5,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  captionHintPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  captionHintPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  captionHintPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  generatedCaptionOutputBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    marginBottom: 12,
  },
  generatedCaptionOutputText: {
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 18,
  },
  generateCaptionBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateCaptionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },

  // 6. Post Structure (2x2 Grid)
  structureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  structureCard: {
    width: (Dimensions.get('window').width - 50) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
  },
  structureNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#582CDB',
    marginBottom: 4,
  },
  structureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  structureSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // 7. Jarvis Insight Card
  jarvisCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  jarvisFlameIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameImage: {
    width: 18,
    height: 18,
  },
  jarvisInsightTag: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  jarvisBodyText: {
    fontSize: 13,
    color: '#F3E8FF',
    lineHeight: 19,
    marginBottom: 14,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  jarvisChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  jarvisChipActive: {
    backgroundColor: '#FFFFFF',
  },
  jarvisChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  improveIdeaBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improveIdeaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 8. Streak Impact Card
  streakImpactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 18,
  },
  streakImpactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  impactCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactGrowthCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakImpactText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  missionProgressContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 10,
    marginTop: 4,
  },
  missionProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  missionProgressTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  missionProgressCount: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  missionProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  missionProgressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },

  // Sticky Bottom Actions
  stickyBottomBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#EFEBF8',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  turnIntoPostBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  turnIntoPostGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnIntoPostBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomSubBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  subActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  bottomDisclaimer: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    shadowOpacity: 0.2,
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
    fontSize: 11.5,
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
  scriptTextInput: {
    minHeight: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  schedulePeakBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 14,
    marginBottom: 16,
  },
  schedulePeakLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  schedulePeakTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  schedulePeakReason: {
    fontSize: 11.5,
    color: '#582CDB',
    fontWeight: '600',
  },
  successCelebrationCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  successFullBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Bottom Tab Bar
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF8F5',
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 230, 248, 0.9)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9E97AA',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
});
