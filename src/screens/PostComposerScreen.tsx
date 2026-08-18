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
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface PostComposerScreenProps {
  ideaTitle?: string;
  initialPlatform?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
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

const SAMPLE_IDEAS = [
  'One thing I wish I knew before I started creating',
  'The #1 habit that doubled my views in 30 days',
  '3 mistakes almost every beginner creator makes',
  'How I batch-film 10 videos in 2 hours',
];

export const PostComposerScreen: React.FC<PostComposerScreenProps> = ({
  ideaTitle = 'One thing I wish I knew before I started creating',
  initialPlatform = 'tiktok',
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [currentIdea, setCurrentIdea] = useState(ideaTitle);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram']);
  
  // Media State
  const [hasMedia, setHasMedia] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'thumbnail' | null>(null);

  // Caption & Tone State
  const [caption, setCaption] = useState(
    'I used to wait until everything was perfect before posting. That slowed me down more than anything. Consistency got easier when I started posting small lessons instead of waiting for perfect ideas.'
  );
  const [captionTone, setCaptionTone] = useState<'Helpful' | 'Viral' | 'Story'>('Helpful');
  const [captionCta, setCaptionCta] = useState<'Ask Question' | 'Save Post' | 'Share Thoughts'>('Ask Question');
  const [aiEditsLeft, setAiEditsLeft] = useState(3);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Tags State
  const [tags, setTags] = useState<string[]>([
    '#CreatorTips',
    '#ContentCreation',
    '#Consistency',
    '#CreatorJourney',
  ]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTagInput, setShowAddTagInput] = useState(false);

  // Scheduling & Publishing State
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('schedule');
  const [scheduledTime, setScheduledTime] = useState('Today, 7:30 PM');

  // Modals
  const [showChangeIdeaModal, setShowChangeIdeaModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Post Scheduled!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your post has been scheduled for Today at 7:30 PM.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('47-day streak protected! +50 XP added to your creator level.');

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
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      }
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

  const handleGenerateTags = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newSuggested = ['#ViralReels', '#PostStreak', '#DailyCreating', '#CreatorEconomy'];
    setTags((prev) => Array.from(new Set([...prev, ...newSuggested])));
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
    setHasMedia(true);
    setMediaType(type);
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
      setCelebrationSpeech('47-day streak protected! +50 XP added to your creator level.');
    } else {
      setCelebrationTitle('Draft Saved!');
      setCelebrationSubtitle('Your post draft with full media & tags is saved in your queue.');
      setCelebrationSpeech('Great work preparing ahead!');
    }
    setShowCelebrationModal(true);
  };

  // Readiness Calculation
  const readinessPercent = hasMedia ? 100 : 75;

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP AIRY HEADER BAR (UNIFIED APP-WIDE) */}
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

            {/* Mascot Logo with Floating Animation */}
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

          {/* Right Icons: Messages, Notification Bell, Profile */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalAnim();
                setShowChatModal(true);
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
            Write your caption, choose platforms, add media and schedule your content.
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
              Turn this idea into a short-form post for your selected platforms.
            </Text>

            <View style={styles.ideaTagsRow}>
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

          {/* 2. CHOOSE PLATFORMS */}
          <Text style={styles.sectionLabel}>CHOOSE PLATFORMS</Text>
          <View style={styles.platformsRow}>
            {/* TikTok Card */}
            <Pressable
              style={[
                styles.platformCard,
                selectedPlatforms.includes('tiktok') && styles.platformCardActive,
              ]}
              onPress={() => togglePlatform('tiktok')}
            >
              <View style={[styles.platformIconCircle, { backgroundColor: '#111827' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                  <Path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.67 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.33V9.05a8.16 8.16 0 0 0 4.91 1.64v-3.5a4.8 4.8 0 0 1-1-.5z" />
                </Svg>
              </View>
              <Text style={styles.platformCardName}>TikTok</Text>
              {selectedPlatforms.includes('tiktok') ? (
                <View style={styles.platformActiveBadge}>
                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '900' }}>✓</Text>
                </View>
              ) : (
                <View style={styles.platformInactiveBadge} />
              )}
            </Pressable>

            {/* Instagram Card */}
            <Pressable
              style={[
                styles.platformCard,
                selectedPlatforms.includes('instagram') && styles.platformCardActive,
              ]}
              onPress={() => togglePlatform('instagram')}
            >
              <LinearGradient
                colors={['#833AB4', '#FD1D1D', '#FCAF45']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.platformIconCircle}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#FFFFFF" strokeWidth="2.2" />
                  <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth="2.2" />
                  <Circle cx="18" cy="6" r="1.2" fill="#FFFFFF" />
                </Svg>
              </LinearGradient>
              <Text style={styles.platformCardName}>Instagram</Text>
              {selectedPlatforms.includes('instagram') ? (
                <View style={styles.platformActiveBadge}>
                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '900' }}>✓</Text>
                </View>
              ) : (
                <View style={styles.platformInactiveBadge} />
              )}
            </Pressable>

            {/* YouTube Card */}
            <Pressable
              style={[
                styles.platformCard,
                selectedPlatforms.includes('youtube') && styles.platformCardActive,
              ]}
              onPress={() => togglePlatform('youtube')}
            >
              <View style={[styles.platformIconCircle, { backgroundColor: '#EF4444' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                  <Path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
                </Svg>
              </View>
              <Text style={styles.platformCardName}>YouTube</Text>
              {selectedPlatforms.includes('youtube') ? (
                <View style={styles.platformActiveBadge}>
                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '900' }}>✓</Text>
                </View>
              ) : (
                <View style={styles.platformInactiveBadge} />
              )}
            </Pressable>
          </View>

          <Text style={styles.platformsDisclaimer}>
            Free users can prepare posts for selected platforms. Some auto-publishing options may require <Text style={{ color: '#D97706', fontWeight: '800' }}>Pro</Text> or platform approval.
          </Text>

          {/* 3. MEDIA UPLOAD ZONE */}
          <Text style={styles.sectionLabel}>MEDIA</Text>
          <View style={styles.mediaUploadBox}>
            {hasMedia ? (
              <View style={styles.mediaPreviewContainer}>
                <View style={styles.mediaPreviewThumb}>
                  <Text style={{ fontSize: 28 }}>🎬</Text>
                  <Text style={styles.mediaPreviewTitle}>ShortForm_Reel_V1.mp4</Text>
                  <Text style={styles.mediaPreviewMeta}>1080x1920 • 30s • HD</Text>
                </View>
                <Pressable
                  onPress={() => setHasMedia(false)}
                  style={styles.removeMediaBtn}
                >
                  <Text style={styles.removeMediaBtnText}>✕ Remove Media</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => handleUploadMedia('video')}
                style={styles.mediaDashedDropzone}
              >
                <View style={styles.mediaIconCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#6D28D9" strokeWidth="2" />
                    <Circle cx="8.5" cy="8.5" r="1.5" fill="#6D28D9" />
                    <Path d="M21 15L16 10L5 21" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.mediaDropzoneTitle}>Add video, image or thumbnail</Text>
                <Text style={styles.mediaDropzoneSubtitle}>Video • Image • Carousel</Text>
              </Pressable>
            )}

            <View style={styles.mediaButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.mediaActionBtn, pressed && styles.btnPressed]}
                onPress={() => handleUploadMedia('video')}
              >
                <Text style={styles.mediaActionBtnText}>⤓ Upload Media</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.mediaActionBtn, pressed && styles.btnPressed]}
                onPress={() => handleUploadMedia('thumbnail')}
              >
                <Text style={styles.mediaActionBtnText}>🖼 Add Thumbnail</Text>
              </Pressable>
            </View>
          </View>

          {/* 4. CAPTION WRITING */}
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>CAPTION WRITING</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>{aiEditsLeft} AI EDITS LEFT</Text>
            </View>
          </View>

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              multiline
              value={caption}
              onChangeText={setCaption}
              placeholder="Write your post caption..."
              placeholderTextColor="#94A3B8"
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
                  <Text style={styles.toneValue}>{captionCta}</Text>
                </Pressable>
              </View>

              <Text style={styles.charCountText}>{caption.length} Characters</Text>
            </View>

            {/* 3 AI Action Pills */}
            <View style={styles.aiButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.aiPillBtn, pressed && styles.btnPressed]}
                onPress={() => handleAiAction('rewrite')}
                disabled={isAiProcessing}
              >
                <Text style={styles.aiPillBtnText}>
                  {isAiProcessing ? '...' : 'REWRITE'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.aiPillBtn, pressed && styles.btnPressed]}
                onPress={() => handleAiAction('shorter')}
                disabled={isAiProcessing}
              >
                <Text style={styles.aiPillBtnText}>SHORTER</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.aiPillBtn, pressed && styles.btnPressed]}
                onPress={() => handleAiAction('cta')}
                disabled={isAiProcessing}
              >
                <Text style={styles.aiPillBtnText}>ADD CTA</Text>
              </Pressable>
            </View>
          </View>

          {/* 5. HASHTAGS & TAGS */}
          <Text style={styles.sectionLabel}>HASHTAGS &amp; TAGS</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tagsPillsRow}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(tag)}
                  style={styles.tagPill}
                >
                  <Text style={styles.tagPillText}>{tag}</Text>
                  <Text style={styles.tagPillCross}>✕</Text>
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
                />
                <Pressable onPress={handleAddCustomTag} style={styles.addTagConfirmBtn}>
                  <Text style={styles.addTagConfirmText}>Add</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.tagActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.tagActionBtn, pressed && styles.btnPressed]}
                onPress={() => setShowAddTagInput(!showAddTagInput)}
              >
                <Text style={styles.tagActionBtnText}>+ Add Custom Tag</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.tagActionBtn, pressed && styles.btnPressed]}
                onPress={handleGenerateTags}
              >
                <Text style={styles.tagActionBtnText}>✨ Generate Tags</Text>
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
                    setShowTimePickerModal(true);
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
              <View style={styles.checkIconFilled}>
                <Text style={styles.checkMarkWhite}>✓</Text>
              </View>
              <Text style={styles.checklistText}>
                Platforms selected ({selectedPlatforms.map((p) => p === 'tiktok' ? 'TikTok' : p === 'instagram' ? 'IG' : 'YT').join(', ')})
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
                Scheduling this post today protects your <Text style={{ fontWeight: '900' }}>47-day streak</Text>.
              </Text>
              <View style={styles.streakBannerBadgesRow}>
                <View style={styles.streakXpPill}>
                  <Text style={styles.streakXpText}>+50 CREATOR XP</Text>
                </View>
                <Text style={styles.streakMissionFraction}>STREAK MISSION: 0 / 1</Text>
              </View>
            </View>
          </View>

          {/* 9. JARVIS WRITING INSIGHT */}
          <LinearGradient
            colors={['#7C3AED', '#582CDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisWritingCard}
          >
            <View style={styles.jarvisWritingHeaderRow}>
              <View style={styles.jarvisWritingAvatarCircle}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisWritingFlame}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.jarvisWritingTitle}>Jarvis Writing Insight</Text>
            </View>

            <Text style={styles.jarvisWritingBody}>
              This caption is stronger when it stays specific. Mention the exact mistake, what changed, and one lesson other creators can use.
            </Text>

            <View style={styles.jarvisChipsRow}>
              <Pressable
                onPress={() => handleAiAction('rewrite')}
                style={styles.jarvisChip}
              >
                <Text style={styles.jarvisChipText}>IMPROVE HOOK</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAiAction('cta')}
                style={styles.jarvisChip}
              >
                <Text style={styles.jarvisChipText}>ADD CTA</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAiAction('shorter')}
                style={styles.jarvisChip}
              >
                <Text style={styles.jarvisChipText}>MAKE SHORTER</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.improveWithJarvisBtn, pressed && styles.btnPressed]}
              onPress={() => handleAiAction('rewrite')}
            >
              <Text style={styles.improveWithJarvisBtnText}>IMPROVE WITH JARVIS</Text>
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
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

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
                <View>
                  <Text style={styles.modalTitle}>Choose Post Idea</Text>
                  <Text style={styles.modalSubtitle}>Select from your Idea Vault or Quick Prompts</Text>
                </View>
                <Pressable onPress={() => setShowChangeIdeaModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
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
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowChangeIdeaModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 2: TIME PICKER */}
        <Modal
          visible={showTimePickerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Select Schedule Slot</Text>
                  <Text style={styles.modalSubtitle}>Optimized for highest creator reach</Text>
                </View>
                <Pressable onPress={() => setShowTimePickerModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {[
                'Today, 7:30 PM (⚡ Peak Viral Reach)',
                'Tomorrow, 9:00 AM (Morning Wave)',
                'Tomorrow, 6:00 PM (Evening Prime)',
                'Friday, 8:00 PM (Weekend Spike)',
              ].map((timeOption, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    setScheduledTime(timeOption.split(' (')[0]);
                    setShowTimePickerModal(false);
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                  }}
                  style={styles.timeOptionCard}
                >
                  <Text style={styles.timeOptionText}>{timeOption}</Text>
                </Pressable>
              ))}

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowTimePickerModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Cancel</Text>
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

        {/* MODAL 4: CREATOR PROFILE PASSPORT */}
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Creator Passport</Text>
                  <Text style={styles.modalSubtitle}>Your verified consistency record</Text>
                </View>
                <Pressable
                  onPress={() => setShowProfileModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.profileModalCardInner}>
                <View style={styles.profileModalIconRing}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
                  </Svg>
                </View>
                <Text style={styles.profileModalName}>Amara Okafor</Text>
                <Text style={styles.profileModalNiche}>Lifestyle &amp; Tech Creator</Text>
                <View style={styles.profileModalLevelPill}>
                  <Text style={styles.profileModalLevelText}>⚡ Level 4 Storyteller • 47-Day Streak</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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
          streakCount={47}
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
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
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
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  createPostPillText: {
    fontSize: 10.5,
    fontWeight: '900',
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
    fontSize: 23,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
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
    flexWrap: 'wrap',
    gap: 6,
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
  streakSaverPill: {
    backgroundColor: '#582CDB',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  streakSaverPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
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

  // 2. Platforms
  platformsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  platformCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  platformCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF8FE',
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
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

  // 3. Media Upload Zone
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
    fontSize: 11.5,
    color: '#64748B',
  },
  mediaPreviewContainer: {
    backgroundColor: '#FAF8FC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaPreviewThumb: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaPreviewTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginTop: 6,
  },
  mediaPreviewMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  removeMediaBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  removeMediaBtnText: {
    fontSize: 11,
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  captionContainer: {
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
  captionInput: {
    minHeight: 100,
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 20,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  captionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 12,
  },
  captionMetaLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  tonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  toneLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#94A3B8',
  },
  toneValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  charCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiPillBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },

  // 5. Tags
  tagsContainer: {
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
  tagsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  tagPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  tagPillCross: {
    fontSize: 10,
    color: '#7C3AED',
    fontWeight: '900',
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
    gap: 10,
  },
  tagActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
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
    fontSize: 11.5,
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
    fontSize: 9.5,
    fontWeight: '900',
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
    fontSize: 11.5,
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
    fontWeight: '900',
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
    fontWeight: '900',
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
    backgroundColor: '#FFFBEB',
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
    color: '#92400E',
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
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  streakMissionFraction: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },

  // 9. Jarvis Writing Insight
  jarvisWritingCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  jarvisWritingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  jarvisWritingAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisWritingFlame: {
    width: 18,
    height: 18,
  },
  jarvisWritingTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  jarvisWritingBody: {
    fontSize: 12.5,
    color: '#F3E8FF',
    lineHeight: 18,
    marginBottom: 14,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  jarvisChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  jarvisChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  improveWithJarvisBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improveWithJarvisBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#582CDB',
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
    shadowOpacity: 0.25,
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
  ideaChoiceItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  ideaChoiceItemActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#582CDB',
  },
  ideaChoiceText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  ideaChoiceTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  timeOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  timeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
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
    fontSize: 9.5,
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
    fontSize: 13.5,
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
    fontSize: 10.5,
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
    fontWeight: '900',
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
