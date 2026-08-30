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
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { SocialBrandIcon } from '../components/SocialBrandIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProPostComposerScreenProps {
  ideaTitle?: string;
  initialPlatform?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface PlatformOption {
  id: string;
  name: string;
  shortName: string;
  format: string;
  platformType: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'x' | 'threads';
}

const PRO_PLATFORMS: PlatformOption[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    shortName: 'TikTok',
    format: '9:16 Video / Reels',
    platformType: 'tiktok',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'Instagram',
    format: 'Reels & Carousels',
    platformType: 'instagram',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YouTube',
    format: 'Shorts & Community',
    platformType: 'youtube',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    shortName: 'X',
    format: 'Viral Thread',
    platformType: 'x',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    shortName: 'LinkedIn',
    format: 'Thought Leadership',
    platformType: 'linkedin',
  },
  {
    id: 'threads',
    name: 'Threads',
    shortName: 'Threads',
    format: 'Text & Visuals',
    platformType: 'threads',
  },
];

const SAMPLE_IDEAS = [
  '3 creator mistakes I stopped making this year',
  'How I batch-film 10 videos in 2 hours without burn out',
  'The exact iPhone camera settings I use for 4K Reels',
  'Why consistency beats motivation every single time',
  '3 habits that took me from 0 to 50K followers',
];

export const ProPostComposerScreen: React.FC<ProPostComposerScreenProps> = ({
  ideaTitle,
  initialPlatform,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onNavigateTab,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    xpEarned: number;
    speechBubble: string;
  }>({
    title: 'Post Published!',
    subtitle: 'Your 4K content has been synced and pushed to all active platforms.',
    badgeText: '👑 PRO POST PUBLISHED',
    xpEarned: 50,
    speechBubble: 'Boom! Algorithmic distribution triggered! 🚀',
  });

  // Main State
  const [currentIdea, setCurrentIdea] = useState(
    ideaTitle || '3 creator mistakes I stopped making this year'
  );
  const [captionText, setCaptionText] = useState(
    'Stop waiting for the "perfect" idea. Consistency and honest lessons outperform polished perfection every single time.\n\nSave this for when you feel stuck. 🚀\n\n#CreatorTips #ContentStrategy #GrowthHacks'
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('Personal Lesson');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('7:30 PM (Peak Reach)');
  const [showAllPlatformsModal, setShowAllPlatformsModal] = useState(false);
  const [showChangeIdeaModal, setShowChangeIdeaModal] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<{
    uri: string;
    name: string;
    size: string;
    type: 'video' | 'image';
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const togglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      } else {
        showToast('At least 1 platform must remain selected');
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const openFilePicker = (type: 'media' | 'thumbnail') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'thumbnail' ? 'image/*' : 'video/*,image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          const isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
          setUploadedMedia({
            uri: url,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: isVideo ? 'video' : 'image',
          });
          showToast(`📁 ${file.name} attached!`);
        }
      };
      input.click();
    } else {
      setUploadedMedia({
        uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        name: type === 'thumbnail' ? '4K_Thumbnail_HighCTR.png' : '4K_Reel_Master_60FPS.mp4',
        size: '18.4 MB',
        type: type === 'thumbnail' ? 'image' : 'video',
      });
      showToast('4K Media attached!');
    }
  };

  const handlePublishNow = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Post Published Successfully!',
      subtitle: `Your content is live on ${selectedPlatforms.map((p) => p.toUpperCase()).join(', ')}.`,
      badgeText: '👑 PRO INSTANT PUBLISH',
      xpEarned: 50,
      speechBubble: 'Boom! Algorithmic reach multiplier engaged! 🚀',
    });
    setShowCompletionModal(true);
  };

  const handleScheduleAutopilot = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Queued to Pro Autopilot!',
      subtitle: `Scheduled for ${selectedTimeSlot} across ${selectedPlatforms.length} platforms.`,
      badgeText: '✨ AUTOPILOT SECURED',
      xpEarned: 75,
      speechBubble: 'Peak window locked! Relax while Jarvis distributes. 🗓️',
    });
    setShowCompletionModal(true);
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
            {/* Back Button */}
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

            {/* Mode Switcher Pill */}
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

            {/* Profile Avatar with Verified Ring */}
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
          {/* TOP TAGS & TITLE */}
          <View style={styles.topTitlesSection}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <View style={styles.createPostTagBox}>
                <Text style={styles.createPostTagText}>✨ CREATE POST — PRO</Text>
              </View>
              <View style={styles.draftPill}>
                <Text style={styles.draftPillText}>AUTOPILOT READY</Text>
              </View>
            </View>

            <Text style={styles.mainTitleText}>Shape your next post.</Text>
            <Text style={styles.mainSubText}>
              Write your caption, choose platforms, add media and schedule your content.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: POST IDEA CARD                                       */}
          {/* ============================================================ */}
          <View style={styles.postIdeaCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.postIdeaTag}>Post Idea</Text>
              <Pressable
                onPress={() => {
                  triggerModalPop();
                  setShowChangeIdeaModal(true);
                }}
                hitSlop={8}
              >
                <Text style={styles.changeIdeaLink}>CHANGE IDEA ➔</Text>
              </Pressable>
            </View>

            <Text style={styles.postIdeaMainTitle}>&ldquo;{currentIdea}&rdquo;</Text>
            <Text style={styles.postIdeaSub}>
              Turn this idea into a short-form post for your selected platforms.
            </Text>

            {/* Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}
              style={{ flexGrow: 0, marginTop: 12 }}
            >
              {['Personal Lesson', 'Creator Advice', 'Streak Saver', 'Viral Reel'].map((chip) => (
                <Pressable
                  key={chip}
                  style={[
                    styles.ideaChipPill,
                    selectedCategoryChip === chip && styles.ideaChipPillActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCategoryChip(chip);
                  }}
                >
                  <Text
                    style={[
                      styles.ideaChipPillText,
                      selectedCategoryChip === chip && styles.ideaChipPillTextActive,
                    ]}
                  >
                    {chip}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* CARD 2: CHOOSE PLATFORMS                                     */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBtn}>
            <Text style={styles.sectionHeaderTitle}>CHOOSE PLATFORMS</Text>
            <Pressable
              style={styles.morePlatformsBtn}
              onPress={() => {
                triggerModalPop();
                setShowAllPlatformsModal(true);
              }}
            >
              <Text style={styles.morePlatformsBtnText}>+ More Platforms</Text>
            </Pressable>
          </View>

          <View style={styles.platformsGridRow}>
            {PRO_PLATFORMS.slice(0, 2).map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <Pressable
                  key={platform.id}
                  style={[
                    styles.platformCard,
                    isSelected && styles.platformCardSelected,
                  ]}
                  onPress={() => togglePlatform(platform.id)}
                >
                  <View style={styles.platformIconWrapper}>
                    <SocialBrandIcon platform={platform.platformType} size={24} />
                  </View>
                  <Text style={styles.platformCardName}>{platform.name}</Text>
                  <View style={[styles.platformCheckCircle, isSelected && styles.platformCheckCircleActive]}>
                    {isSelected && (
                      <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                        <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                      </Svg>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.platformDisclaimerText}>
            👑 Pro Multi-Sync active. Your content is automatically tailored to each platform&apos;s optimal algorithm format.
          </Text>

          {/* ============================================================ */}
          {/* CARD 3: MEDIA UPLOAD & ASSET STUDIO                          */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBtn}>
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>MEDIA</Text>
            {uploadedMedia && (
              <Pressable onPress={() => setUploadedMedia(null)} hitSlop={8}>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '800' }}>🗑️ Clear Media</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.mediaStudioCard}>
            {!uploadedMedia ? (
              /* Empty Dashed Upload Box */
              <Pressable
                style={({ pressed }) => [styles.mediaDashedBox, pressed && styles.btnPressed]}
                onPress={() => openFilePicker('media')}
              >
                <View style={styles.mediaPlaceholderIconCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#582CDB" strokeWidth="2" />
                    <Circle cx="8.5" cy="8.5" r="1.5" fill="#582CDB" />
                    <Path d="M21 15L16 10L5 21" stroke="#582CDB" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>

                <Text style={styles.mediaMainHeading}>Add video, image or thumbnail</Text>
                <Text style={styles.mediaSubHeading}>Video • Image • Carousel • 4K 60FPS</Text>
              </Pressable>
            ) : (
              /* Attached Media Preview Box */
              <View style={styles.mediaAttachedPreviewBox}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  {uploadedMedia.type === 'image' ? (
                    <Image
                      source={{ uri: uploadedMedia.uri }}
                      style={styles.attachedThumbnailPreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.attachedVideoIconBox}>
                      <Text style={{ fontSize: 22 }}>📹</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                      <View style={styles.mediaProBadge}>
                        <Text style={styles.mediaProBadgeText}>✓ 4K OPTIMIZED</Text>
                      </View>
                      <Text style={styles.mediaSizeText}>{uploadedMedia.size}</Text>
                    </View>
                    <Text style={styles.mediaAttachedName} numberOfLines={1}>
                      {uploadedMedia.name}
                    </Text>
                    <Text style={styles.mediaAttachedFormat}>
                      {uploadedMedia.type === 'video' ? '9:16 Video • 60 FPS • ProRes HDR' : 'High-CTR 9:16 Visual'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons: Upload Media & Add Thumbnail */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={({ pressed }) => [styles.mediaActionBtn, pressed && styles.btnPressed]}
                onPress={() => openFilePicker('media')}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 19V5M5 12l7-7 7 7" stroke="#171420" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.mediaActionBtnText}>Upload Media</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.mediaActionBtn, pressed && styles.btnPressed]}
                onPress={() => openFilePicker('thumbnail')}
              >
                <Text style={{ fontSize: 14 }}>🖼️</Text>
                <Text style={styles.mediaActionBtnText}>Add Thumbnail</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 4: CAPTION WRITING                                      */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBtn}>
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>CAPTION WRITING</Text>
            <Pressable
              style={styles.polishJarvisBtn}
              onPress={() => {
                setCaptionText(
                  'Stop waiting for the "perfect" idea.\n\nConsistency and honest execution outperform polished perfection every single time. Here are 3 habits that changed everything.\n\nSave this for your next creative sprint. 🚀\n\n#CreatorTips #ViralReels #PoststreakPro'
                );
                showToast('🪄 Polished with Jarvis AI!');
              }}
            >
              <Text style={styles.polishJarvisBtnText}>🪄 Polish with Jarvis</Text>
            </Pressable>
          </View>

          <View style={styles.captionBoxCard}>
            <TextInput
              style={styles.captionTextInput}
              multiline
              value={captionText}
              onChangeText={setCaptionText}
              placeholder="Write your high-converting caption..."
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* ============================================================ */}
          {/* ACTION BUTTONS: AUTOPILOT & PUBLISH                          */}
          {/* ============================================================ */}
          <View style={{ gap: 10, marginTop: 18 }}>
            <Pressable
              style={({ pressed }) => [styles.autopilotBtn, pressed && styles.btnPressed]}
              onPress={handleScheduleAutopilot}
            >
              <Text style={styles.autopilotBtnText}>⚡ Schedule on Autopilot (7:30 PM)</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.publishGoldBtn, pressed && styles.btnPressed]}
              onPress={handlePublishNow}
            >
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishGoldBtnGradient}
              >
                <Text style={styles.publishGoldBtnText}>
                  ✨ Publish to All Platforms Now ➔
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>

        {/* FLOATING TAB BAR */}
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

        {/* CHANGE IDEA MODAL */}
        <Modal
          visible={showChangeIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChangeIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Choose Post Idea</Text>
                <Pressable onPress={() => setShowChangeIdeaModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                {SAMPLE_IDEAS.map((idea, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.ideaOptionCard}
                    onPress={() => {
                      setCurrentIdea(idea);
                      setShowChangeIdeaModal(false);
                      showToast(`✓ Selected: "${idea}"`);
                    }}
                  >
                    <Text style={styles.ideaOptionText}>&ldquo;{idea}&rdquo;</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.modalCancelBtn} onPress={() => setShowChangeIdeaModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ALL PLATFORMS MODAL */}
        <Modal
          visible={showAllPlatformsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAllPlatformsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Select Active Platforms</Text>
                <Pressable onPress={() => setShowAllPlatformsModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                {PRO_PLATFORMS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);
                  return (
                    <Pressable
                      key={plat.id}
                      style={[styles.platformModalRow, isSelected && styles.platformModalRowSelected]}
                      onPress={() => togglePlatform(plat.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <SocialBrandIcon platform={plat.platformType} size={22} />
                        <View>
                          <Text style={styles.platformModalName}>{plat.name}</Text>
                          <Text style={styles.platformModalFormat}>{plat.format}</Text>
                        </View>
                      </View>
                      <View style={[styles.platformCheckCircle, isSelected && styles.platformCheckCircleActive]}>
                        {isSelected && (
                          <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                            <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                          </Svg>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.modalCancelBtn} onPress={() => setShowAllPlatformsModal(false)}>
                <Text style={styles.modalCancelBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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
                <Text style={styles.modalTitle}>Composer Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.ideaOptionCard}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#171420' }}>
                    ⚡ Peak Reach Approaching (7:30 PM)
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Your TikTok and Instagram audiences are active.
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
    fontSize: 10,
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
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    position: 'relative',
  },
  headerUserAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
  createPostTagBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  createPostTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  draftPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  draftPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
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

  // CARD 1: POST IDEA CARD
  postIdeaCard: {
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
    marginBottom: 16,
  },
  postIdeaTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  changeIdeaLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  postIdeaMainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    marginVertical: 4,
    lineHeight: 23,
  },
  postIdeaSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  ideaChipPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  ideaChipPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  ideaChipPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  ideaChipPillTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // SECTION 2: CHOOSE PLATFORMS
  sectionHeaderRowWithBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  morePlatformsBtn: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  morePlatformsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  platformsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformCard: {
    width: '48%',
    minHeight: 110,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  platformCardSelected: {
    borderColor: '#582CDB',
    backgroundColor: '#FFFFFF',
  },
  platformIconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformCardName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  platformCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformCheckCircleActive: {
    backgroundColor: '#582CDB',
  },
  platformDisclaimerText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 6,
  },

  // SECTION 3: MEDIA
  mediaStudioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  mediaDashedBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlaceholderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaMainHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  mediaSubHeading: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mediaAttachedPreviewBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  attachedThumbnailPreview: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  attachedVideoIconBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaProBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaProBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  mediaSizeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  mediaAttachedName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  mediaAttachedFormat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  mediaActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 10,
    borderRadius: 12,
  },
  mediaActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },

  // SECTION 4: CAPTION WRITING
  polishJarvisBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  polishJarvisBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  captionBoxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  captionTextInput: {
    fontSize: 13,
    lineHeight: 20,
    color: '#171420',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ACTIONS
  autopilotBtn: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  autopilotBtnText: {
    color: '#582CDB',
    fontSize: 13,
    fontWeight: '700',
  },
  publishGoldBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  publishGoldBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  publishGoldBtnText: {
    color: '#0C0A12',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  ideaOptionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  ideaOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  platformModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  platformModalRowSelected: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  platformModalName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  platformModalFormat: {
    fontSize: 11,
    color: '#64748B',
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
