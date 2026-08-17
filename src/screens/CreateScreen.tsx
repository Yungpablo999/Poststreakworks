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
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';

interface CreateScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenSchedule?: () => void;
}

interface DraftItem {
  id: string;
  title: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  editedTime: string;
  imageSource: any;
}

const INITIAL_DRAFTS: DraftItem[] = [
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

const TRENDING_IDEAS = [
  'One thing I wish I knew before I started creating.',
  '3 creator tools that saved me 10 hours this week.',
  'Why consistency beats motivation every single time.',
  'How I script 60-second viral Reels in 5 minutes.',
];

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [drafts, setDrafts] = useState<DraftItem[]>(INITIAL_DRAFTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null);

  // New Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postPlatform, setPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [postTime, setPostTime] = useState('7:30 PM');

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
  const flameFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
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
      showToast('⚠️ Please enter a title or hook for your post');
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
    showToast('✨ Post draft saved! Streak momentum protected.');
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
    if (onNavigateTab) {
      onNavigateTab('growth');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Toast Notification Banner */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastBannerText}>{toastMessage}</Text>
            </View>
          )}

          {/* TOP PILL BADGES */}
          <View style={styles.topBadgesRow}>
            <View style={styles.createPill}>
              <Text style={styles.createPillText}>Create</Text>
            </View>

            <View style={styles.freeToolsPill}>
              <Text style={styles.freeToolsPillText}>✨ FREE CREATE TOOLS</Text>
            </View>
          </View>

          {/* HEADLINE & SUBTITLE */}
          <Text style={styles.mainHeading}>Create your next post.</Text>
          <Text style={styles.mainSubtitle}>
            Turn one idea into a post your audience wants to watch.
          </Text>

          {/* 1. HERO STREAK SAVER CARD */}
          <View style={styles.streakSaverCard}>
            <View style={styles.streakHeaderRow}>
              <View style={styles.streakLeftGroup}>
                <View style={styles.flameIconCircle}>
                  <Text style={styles.flameEmoji}>🔥</Text>
                </View>
                <View>
                  <Text style={styles.streakSaverTag}>STREAK SAVER</Text>
                  <Text style={styles.streakDaysTitle}>47-day streak</Text>
                </View>
              </View>

              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>

            {/* Prompt Inner Box */}
            <View style={styles.promptInnerBox}>
              <Text style={styles.promptText}>
                Create a 30-second Reel: &ldquo;One thing I wish I knew before I started creating.&rdquo;
              </Text>
            </View>

            {/* Platform & Suggested Time Row */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPillGray}>
                <Text style={styles.tagPillGrayText}>TikTok</Text>
              </View>
              <View style={styles.tagPillGray}>
                <Text style={styles.tagPillGrayText}>Instagram Reel</Text>
              </View>
              <View style={styles.suggestedTimePill}>
                <Text style={styles.suggestedTimePillText}>Suggested: 7:30 PM</Text>
              </View>
            </View>

            {/* Primary Action Button: Use This Idea */}
            <Pressable
              style={({ pressed }) => [styles.useIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => {
                setPostTitle('One thing I wish I knew before I started creating');
                setPostPlatform('instagram');
                setShowNewPostModal(true);
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.useIdeaGradient}
              >
                <Text style={styles.useIdeaBtnText}>Use This Idea ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 2. JARVIS SUGGESTION CARD */}
          <View style={styles.jarvisSuggestionCard}>
            <Animated.View
              style={[
                styles.jarvisFlameCircle,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisFlameIcon}
                resizeMode="contain"
              />
            </Animated.View>
            <View style={styles.jarvisSuggestionContent}>
              <Text style={styles.jarvisSuggestionTitle}>Jarvis Suggestion</Text>
              <Text style={styles.jarvisSuggestionText}>
                Your streak is active. One finished post today keeps your momentum strong.
              </Text>
            </View>
          </View>

          {/* 3. 2x2 CREATION TOOLS GRID */}
          <View style={styles.toolsGrid}>
            {/* Tool 1: New Post */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => setShowNewPostModal(true)}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#582CDB' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.toolTitle}>New Post</Text>
              <Text style={styles.toolSubtitle}>Start from scratch</Text>
            </Pressable>

            {/* Tool 2: Ideas */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => setShowIdeasModal(true)}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
                    fill="#D97706"
                  />
                  <Path
                    d="M19 16L20.2 18.8L23 20L20.2 21.2L19 24L17.8 21.2L15 20L17.8 18.8L19 16Z"
                    fill="#D97706"
                  />
                </Svg>
              </View>
              <Text style={styles.toolTitle}>Ideas</Text>
              <Text style={styles.toolSubtitle}>Find your next angle</Text>
            </Pressable>

            {/* Tool 3: Script */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => setShowScriptModal(true)}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19.82 2H4.18C2.97 2 2 2.97 2 4.18v15.64C2 21.03 2.97 22 4.18 22h15.64c1.21 0 2.18-.97 2.18-2.18V4.18C22 2.97 21.03 2 19.82 2z"
                    stroke="#171420"
                    strokeWidth="2"
                  />
                  <Path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" stroke="#171420" strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.toolTitle}>Script</Text>
              <Text style={styles.toolSubtitle}>Build a story</Text>
            </Pressable>

            {/* Tool 4: Caption */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => setShowCaptionModal(true)}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Text style={styles.quoteIconText}>99</Text>
              </View>
              <Text style={styles.toolTitle}>Caption</Text>
              <Text style={styles.toolSubtitle}>Write in your voice</Text>
            </Pressable>
          </View>

          {/* 4. SCHEDULED POSTS CARD (3 posts scheduled) */}
          <Pressable
            style={({ pressed }) => [styles.scheduledBannerCard, pressed && styles.btnPressed]}
            onPress={handleOpenScheduleView}
          >
            <View style={styles.scheduledLeft}>
              <View style={styles.calendarIconBox}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#171420" strokeWidth="2" />
                  <Path d="M16 2v4M8 2v4M3 10h18" stroke="#171420" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <View>
                <Text style={styles.scheduledTitle}>3 posts scheduled</Text>
                <Text style={styles.scheduledSub}>Next: Tomorrow at 11:30 AM</Text>
              </View>
            </View>

            <Pressable onPress={handleOpenScheduleView} hitSlop={10}>
              <Text style={styles.scheduledOpenLink}>Open</Text>
            </Pressable>
          </Pressable>

          {/* 5. YOUR DRAFTS SECTION */}
          <View style={styles.draftsHeaderRow}>
            <Text style={styles.draftsSectionTitle}>Your Drafts</Text>
            <Pressable onPress={() => showToast('📁 Showing all active creator drafts')}>
              <Text style={styles.viewAllDraftsLink}>View all drafts</Text>
            </Pressable>
          </View>

          <View style={styles.draftsList}>
            {drafts.map((draft) => (
              <Pressable
                key={draft.id}
                style={({ pressed }) => [styles.draftCard, pressed && styles.btnPressed]}
                onPress={() => {
                  setSelectedDraft(draft);
                  setShowDraftModal(true);
                }}
              >
                <Image source={draft.imageSource} style={styles.draftThumbnail} resizeMode="cover" />
                <View style={styles.draftContentCol}>
                  <Text style={styles.draftTitle} numberOfLines={1}>
                    {draft.title}
                  </Text>
                  <Text style={styles.draftMeta}>
                    {draft.platform === 'TikTok' ? '💬' : '📷'} {draft.platform} • {draft.editedTime}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setSelectedDraft(draft);
                    setShowDraftModal(true);
                  }}
                >
                  <Text style={styles.draftMoreDots}>⋮</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>

          {/* 6. VOICE STUDIO PRO CARD */}
          <View style={styles.voiceStudioCard}>
            <View style={styles.voiceStudioProPill}>
              <Text style={styles.voiceStudioProPillText}>🔒 PRO FEATURE</Text>
            </View>

            <Text style={styles.voiceStudioTitle}>Voice Studio</Text>
            <Text style={styles.voiceStudioSubtitle}>
              Turn scripts into voiceovers with Pro.
            </Text>

            {/* Audio Waveform Graphic */}
            <View style={styles.waveformContainer}>
              <View style={[styles.waveBar, { height: 16, backgroundColor: '#6366F1' }]} />
              <View style={[styles.waveBar, { height: 26, backgroundColor: '#8B5CF6' }]} />
              <View style={[styles.waveBar, { height: 40, backgroundColor: '#FBBF24' }]} />
              <View style={[styles.waveBar, { height: 22, backgroundColor: '#F59E0B' }]} />
              <View style={[styles.waveBar, { height: 34, backgroundColor: '#8B5CF6' }]} />
              <View style={[styles.waveBar, { height: 18, backgroundColor: '#6366F1' }]} />
            </View>

            {/* Unlock Voice Studio Metallic Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.unlockVoiceBtn, pressed && styles.btnPressed]}
              onPress={handleOpenVoiceStudioPro}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockVoiceGradient}
              >
                <Text style={styles.unlockVoiceBtnText}>Unlock Voice Studio</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* MODAL 1: NEW POST */}
        <Modal
          visible={showNewPostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNewPostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>New Post</Text>
                <Pressable onPress={() => setShowNewPostModal(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Create from scratch and protect your streak.</Text>

              <Text style={styles.modalInputLabel}>CHOOSE PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {(['tiktok', 'instagram', 'youtube'] as const).map((plat) => (
                  <Pressable
                    key={plat}
                    onPress={() => setPostPlatform(plat)}
                    style={[
                      styles.platformSelectBtn,
                      postPlatform === plat && styles.platformSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.platformSelectBtnText,
                        postPlatform === plat && styles.platformSelectBtnTextActive,
                      ]}
                    >
                      {plat === 'tiktok'
                        ? 'TikTok'
                        : plat === 'instagram'
                        ? 'Instagram Reel'
                        : 'YouTube Shorts'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalInputLabel}>POST TITLE / HOOK</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="e.g. 3 creator habits that changed my reach..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalInputLabel}>SCHEDULE TIME</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTime}
                onChangeText={setPostTime}
                placeholder="e.g. 7:30 PM"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowNewPostModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalPrimaryBtn} onPress={handleCreatePostSubmit}>
                  <LinearGradient
                    colors={['#6366F1', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Save Draft &amp; Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
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
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>AI Hook Sparks</Text>
                <Pressable onPress={() => setShowIdeasModal(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Trending angles customized for your niche:</Text>

              {TRENDING_IDEAS.map((idea, idx) => (
                <Pressable
                  key={idx}
                  style={styles.ideaItemCard}
                  onPress={() => {
                    setPostTitle(idea);
                    setShowIdeasModal(false);
                    setShowNewPostModal(true);
                  }}
                >
                  <Text style={styles.ideaItemText}>&ldquo;{idea}&rdquo;</Text>
                  <Text style={styles.ideaItemTag}>⚡ 94 Viral Score • High Retention</Text>
                </Pressable>
              ))}

              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowIdeasModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </Pressable>
            </View>
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
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Script Builder</Text>
                <Pressable onPress={() => setShowScriptModal(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Hook ➔ Story ➔ Lesson ➔ CTA formula:</Text>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
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
                style={styles.modalCloseBtn}
                onPress={() => {
                  setPostTitle(scriptHook);
                  setShowScriptModal(false);
                  setShowNewPostModal(true);
                }}
              >
                <Text style={styles.modalCloseBtnText}>Use in Next Post</Text>
              </Pressable>
            </View>
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
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Caption Generator</Text>
                <Pressable onPress={() => setShowCaptionModal(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Craft high-engagement captions in your voice:</Text>

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
                style={[styles.modalTextInput, { height: 110 }]}
                value={generatedCaption}
                onChangeText={setGeneratedCaption}
                multiline
              />

              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowCaptionModal(false);
                  showToast('✓ Caption copied to clipboard!');
                }}
              >
                <Text style={styles.modalCloseBtnText}>Copy Caption &amp; Hashtags</Text>
              </Pressable>
            </View>
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
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{selectedDraft?.platform} Draft</Text>
                <Pressable onPress={() => setShowDraftModal(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>{selectedDraft?.editedTime}</Text>

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
                  <LinearGradient
                    colors={['#6366F1', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Open in Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  toastBanner: {
    backgroundColor: '#171420',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },

  // TOP PILL BADGES
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  createPill: {
    backgroundColor: '#784DF0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  createPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  freeToolsPill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  freeToolsPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },

  // HEADLINE
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  streakLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameEmoji: {
    fontSize: 18,
  },
  streakSaverTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  streakDaysTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  promptInnerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  promptText: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tagPillGray: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagPillGrayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  suggestedTimePill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  suggestedTimePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  useIdeaBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  useIdeaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useIdeaBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // 2. JARVIS SUGGESTION CARD
  jarvisSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  jarvisFlameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameIcon: {
    width: 24,
    height: 24,
  },
  jarvisSuggestionContent: {
    flex: 1,
  },
  jarvisSuggestionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 2,
  },
  jarvisSuggestionText: {
    fontSize: 12,
    color: '#6D28D9',
    lineHeight: 17,
  },

  // 3. 2x2 CREATION TOOLS GRID
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  toolGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  toolIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#475569',
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },

  // 4. SCHEDULED POSTS BANNER
  scheduledBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  scheduledLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  scheduledSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scheduledOpenLink: {
    fontSize: 13.5,
    fontWeight: '800',
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
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  viewAllDraftsLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  draftsList: {
    gap: 10,
    marginBottom: 24,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  draftThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  draftContentCol: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 3,
  },
  draftMeta: {
    fontSize: 11.5,
    color: '#64748B',
  },
  draftMoreDots: {
    fontSize: 18,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },

  // 6. VOICE STUDIO PRO CARD
  voiceStudioCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 22,
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceStudioProPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 10,
  },
  voiceStudioProPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  voiceStudioTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  voiceStudioSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    marginBottom: 18,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  unlockVoiceBtn: {
    width: '100%',
    maxWidth: 240,
    height: 44,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockVoiceGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockVoiceBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#6B637B',
    fontWeight: '700',
    padding: 4,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 10.5,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    alignItems: 'center',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#171420',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#524C62',
  },
  modalPrimaryBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ideaItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 10,
  },
  ideaItemText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  ideaItemTag: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '600',
  },
  modalCloseBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
