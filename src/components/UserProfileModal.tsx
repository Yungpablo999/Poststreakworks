import { SocialBrandIcon } from './SocialBrandIcon';
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
  TextInput,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

export interface UserProfileData {
  name: string;
  handle: string;
  bio: string;
  niche: string;
  tier?: 'free' | 'pro' | 'founding';
  avatarId?: string;
  avatarSource?: any;
  customAvatarUri?: string;
  streakCount: number;
  level: number;
  xp: number;
  partnersCount: number;
  tiktokHandle?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  xHandle?: string;
  niches: string[];
  isVerified?: boolean;
  portfolioUrl?: string;
}

export const CREATOR_AVATARS = [
  {
    id: 'ghost',
    name: 'Ghost Mascot',
    source: require('../../assets/images/jarvis-ghost-clean.png'),
    tag: 'MASCOT',
  },
  {
    id: 'flame',
    name: 'Jarvis Flame',
    source: require('../../assets/images/jarvis-core-flame.png'),
    tag: 'AI',
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    source: require('../../assets/images/elena-avatar.jpg'),
    tag: 'LIFESTYLE',
  },
  {
    id: 'amara',
    name: 'Amara Okafor',
    source: require('../../assets/images/amara-avatar.jpg'),
    tag: 'TECH',
  },
  {
    id: 'david',
    name: 'David Adebayo',
    source: require('../../assets/images/david-avatar.jpg'),
    tag: 'CREATOR',
  },
  {
    id: 'kemi',
    name: 'Kemi Alabi',
    source: require('../../assets/images/kemi-avatar.jpg'),
    tag: 'STORY',
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    source: require('../../assets/images/marcus-avatar.jpg'),
    tag: 'FITNESS',
  },
  {
    id: 'tomi',
    name: 'Tomiwa Kuti',
    source: require('../../assets/images/tomi-avatar.jpg'),
    tag: 'COMEDY',
  },
  {
    id: 'zainab',
    name: 'Zainab Bello',
    source: require('../../assets/images/zainab-avatar.jpg'),
    tag: 'BEAUTY',
  },
  {
    id: 'hero',
    name: 'Jarvis Hero',
    source: require('../../assets/images/jarvis-hero.png'),
    tag: 'HERO',
  },
  {
    id: 'mascot',
    name: 'Creator Glow',
    source: require('../../assets/images/jarvis-mascot-clean.png'),
    tag: 'GLOW',
  },
];

export const ALL_NICHES = [
  'Lifestyle',
  'Tech & AI',
  'Comedy & Relatable',
  'Storytelling',
  'Fitness & Health',
  'Business & Wealth',
  'Travel & Vlogs',
  'Fashion & Beauty',
  'Education',
];

// AUTHENTIC BRAND VECTOR SVG ICONS
export const TikTokRealIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.446 5.14 5.14 0 0 1-1.486-3.616H10.5v15.025a3.25 3.25 0 1 1-3.25-3.25 3.2 3.2 0 0 1 1.25.253V8.75a6.975 6.975 0 0 0-1.25-.113 7 7 0 1 0 7 7V9.22a8.775 8.775 0 0 0 5.071 1.595V7.065a5.16 5.16 0 0 1-2.45-.653 5.13 5.13 0 0 1-1.3-.85z"
      fill="#000000"
    />
  </Svg>
);

export const InstagramRealIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
  </Svg>
);

export const YouTubeRealIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.582 6.186a2.75 2.75 0 0 0-1.934-1.946C17.942 3.75 12 3.75 12 3.75s-5.942 0-7.648.49a2.75 2.75 0 0 0-1.934 1.946C1.928 7.892 1.928 12 1.928 12s0 4.108.49 5.814a2.75 2.75 0 0 0 1.934 1.946c1.706.49 7.648.49 7.648.49s5.942 0 7.648-.49a2.75 2.75 0 0 0 1.934-1.946c.49-1.706.49-5.814.49-5.814s0-4.108-.49-5.814z"
      fill="#FF0000"
    />
    <Path d="M9.75 15.02V8.98L15 12l-5.25 3.02z" fill="#FFFFFF" />
  </Svg>
);

export const XTwitterRealIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </Svg>
);

// CLEAN LUXURY PURPLE TOGGLE SWITCH COMPONENT
const HarmoniousSwitch: React.FC<{
  value: boolean;
  onValueChange: (val: boolean) => void;
}> = ({ value, onValueChange }) => {
  const switchTranslate = useRef(new Animated.Value(value ? 22 : 2)).current;

  useEffect(() => {
    Animated.spring(switchTranslate, {
      toValue: value ? 22 : 2,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  }, [value]);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={[
        switchStyles.switchTrack,
        value ? switchStyles.switchTrackActive : switchStyles.switchTrackInactive,
      ]}
      hitSlop={8}
    >
      <Animated.View
        style={[
          switchStyles.switchThumb,
          { transform: [{ translateX: switchTranslate }] },
        ]}
      />
    </Pressable>
  );
};

const switchStyles = StyleSheet.create({
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#582CDB', // Clean Royal Purple (No tacky border)
  },
  switchTrackInactive: {
    backgroundColor: '#E2E8F0', // Clean Neutral Light Slate
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF', // Clean Pure White Thumb
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
});

export interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  initialProfile?: Partial<UserProfileData>;
  initialSubTab?: 'profile' | 'socials' | 'verification' | 'settings';
  onSaveProfile?: (updatedProfile: UserProfileData) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  onLogout,
  initialProfile,
  initialSubTab,
  onSaveProfile,
}) => {
  // Form State
  const [name, setName] = useState(initialProfile?.name || 'Pablo');
  const [handle, setHandle] = useState(initialProfile?.handle || '@pablocreates');
  const [niche, setNiche] = useState(initialProfile?.niche || 'Tech & Lifestyle Creator • Lagos');
  const [bio, setBio] = useState(
    initialProfile?.bio || 'Consistency is my superpower. Building a 100-day creator streak with Jarvis AI.'
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(
    initialProfile?.avatarId || null
  );
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(
    initialProfile?.customAvatarUri || null
  );
  const [selectedNiches, setSelectedNiches] = useState<string[]>(
    initialProfile?.niches || ['Lifestyle', 'Tech & AI', 'Storytelling']
  );

  // Socials
  const [tiktokHandle, setTiktokHandle] = useState(initialProfile?.tiktokHandle || '@pablo.creates');
  const [instagramHandle, setInstagramHandle] = useState(initialProfile?.instagramHandle || '@pablocreates');
  const [youtubeHandle, setYoutubeHandle] = useState(initialProfile?.youtubeHandle || 'Pablo Creates');
  const [xHandle, setXHandle] = useState(initialProfile?.xHandle || '@pablocreates');

  // Preferences & Accountability
  const [streakReminders, setStreakReminders] = useState(true);
  const [collabInvites, setCollabInvites] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // Verification state
  const [isVerified, setIsVerified] = useState(
    initialProfile?.isVerified !== undefined ? initialProfile.isVerified : true
  );
  const [portfolioUrl, setPortfolioUrl] = useState(
    initialProfile?.portfolioUrl || 'https://instagram.com/reel/pablo_viral_1'
  );

  // UI tabs inside profile modal
  const isPro = initialProfile?.tier === 'pro' || initialProfile?.tier === 'founding';
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'socials' | 'verification' | 'settings'>(
    initialSubTab || 'profile'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const toastFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (initialSubTab) {
        setActiveSubTab(initialSubTab);
      }
      if (initialProfile) {
        setName(initialProfile.name || 'Pablo');
        setHandle(initialProfile.handle || '@pablocreates');
        setBio(initialProfile.bio || '');
        setNiche(initialProfile.niche || '');
        setSelectedAvatarId(initialProfile.avatarId || null);
        setCustomAvatarUri(initialProfile.customAvatarUri || null);
      }
      modalScale.setValue(0.9);
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialSubTab, initialProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastFade.setValue(0);
    Animated.sequence([
      Animated.timing(toastFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastFade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleSelectAvatar = (avatarId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAvatarId(avatarId);
    setCustomAvatarUri(null);
    const found = CREATOR_AVATARS.find((a) => a.id === avatarId);
    showToast(`Profile picture set to "${found?.name}"`);
  };

  // Upload Picture Handler (Device File Picker on Web / Simulated on Mobile)
  const handleUploadPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            const dataUrl = event.target.result;
            setCustomAvatarUri(dataUrl);
            setSelectedAvatarId('custom');
            showToast('✓ Photo uploaded successfully!');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      setSelectedAvatarId('custom_device');
      setCustomAvatarUri('custom_device');
      showToast('✓ Custom photo loaded from Device Gallery!');
    }
  };

  const handleToggleNiche = (item: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedNiches.includes(item)) {
      if (selectedNiches.length > 1) {
        setSelectedNiches(selectedNiches.filter((n) => n !== item));
      }
    } else {
      setSelectedNiches([...selectedNiches, item]);
    }
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const currentAvatar = selectedAvatarId
      ? CREATOR_AVATARS.find((a) => a.id === selectedAvatarId)
      : null;

    const sourceToSave = customAvatarUri
      ? customAvatarUri.startsWith('data:') || customAvatarUri.startsWith('http')
        ? { uri: customAvatarUri }
        : currentAvatar?.source
      : currentAvatar?.source;

    const updated: UserProfileData = {
      name: name.trim() || 'Pablo',
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      bio: bio.trim(),
      niche: niche.trim(),
      tier: initialProfile?.tier || 'pro',
      avatarId: selectedAvatarId || undefined,
      avatarSource: sourceToSave || undefined,
      customAvatarUri: customAvatarUri || undefined,
      streakCount: initialProfile?.streakCount || 1,
      level: initialProfile?.level || 5,
      xp: initialProfile?.xp || 3450,
      partnersCount: initialProfile?.partnersCount || 12,
      tiktokHandle: tiktokHandle.trim(),
      instagramHandle: instagramHandle.trim(),
      youtubeHandle: youtubeHandle.trim(),
      xHandle: xHandle.trim(),
      niches: selectedNiches,
      isVerified,
      portfolioUrl: portfolioUrl.trim(),
    };

    if (onSaveProfile) {
      onSaveProfile(updated);
    }
    onClose();
  };

  const getBottomActionText = () => {
    switch (activeSubTab) {
      case 'socials':
        return 'Save Connections ✓';
      case 'verification':
        return 'Save Verification ✓';
      case 'settings':
        return 'Save Preferences ✓';
      case 'profile':
      default:
        return 'Save Profile ✓';
    }
  };

  const currentAvatarObj = selectedAvatarId
    ? CREATOR_AVATARS.find((a) => a.id === selectedAvatarId)
    : null;

  const currentDisplayAvatarSource = customAvatarUri
    ? customAvatarUri.startsWith('data:') || customAvatarUri.startsWith('http')
      ? { uri: customAvatarUri }
      : currentAvatarObj?.source
    : currentAvatarObj?.source || null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        Keyboard.dismiss();
        onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          {/* Tap backdrop to dismiss */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          />
          <Animated.View
            style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}
          >
            {/* TOP MODAL HEADER: PRO / FREE BADGE NEAR CREATOR PASSPORT */}
            <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.modalTitle}>Creator Passport</Text>
                {isPro ? (
                  <LinearGradient
                    colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.proBadgePill}
                  >
                    <Text style={styles.proBadgeText}>👑 PRO</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.freeBadgePill}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.modalSubtitle}>
                {isPro
                  ? 'Manage your Pro Creator Passport, verified badge & socials'
                  : 'Manage your free creator profile, picture & socials'}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onClose();
              }}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Text style={styles.closeBtnCross}>✕</Text>
            </Pressable>
          </View>

          {/* SUB TABS NAVIGATION */}
          <View style={styles.subTabsRow}>
            <Pressable
              style={[styles.subTabItem, activeSubTab === 'profile' && styles.subTabItemActive]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveSubTab('profile');
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeSubTab === 'profile' && styles.subTabTextActive,
                ]}
                numberOfLines={1}
              >
                👤 Profile
              </Text>
            </Pressable>

            <Pressable
              style={[styles.subTabItem, activeSubTab === 'socials' && styles.subTabItemActive]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveSubTab('socials');
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeSubTab === 'socials' && styles.subTabTextActive,
                ]}
                numberOfLines={1}
              >
                🔗 Socials
              </Text>
            </Pressable>

            <Pressable
              style={[styles.subTabItem, activeSubTab === 'verification' && styles.subTabItemActive]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveSubTab('verification');
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeSubTab === 'verification' && styles.subTabTextActive,
                ]}
                numberOfLines={1}
              >
                🪪 Verify
              </Text>
            </Pressable>

            <Pressable
              style={[styles.subTabItem, activeSubTab === 'settings' && styles.subTabItemActive]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveSubTab('settings');
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeSubTab === 'settings' && styles.subTabTextActive,
                ]}
                numberOfLines={1}
              >
                ⚙️ Settings
              </Text>
            </Pressable>
          </View>

          {/* MAIN SCROLLABLE BODY */}
          <ScrollView
            style={styles.scrollBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* FLOATING TOAST BANNER */}
            {toastMessage && (
              <Animated.View style={[styles.toastBanner, { opacity: toastFade }]}>
                <Text style={styles.toastText}>✨ {toastMessage}</Text>
              </Animated.View>
            )}

            {/* TAB 1: PROFILE IDENTITY & AVATAR PICKER */}
            {activeSubTab === 'profile' && (
              <View>
                {/* 1. LARGE HERO AVATAR SECTION */}
                <View style={styles.heroAvatarSection}>
                  <Pressable
                    onPress={handleUploadPhoto}
                    style={styles.heroAvatarRing}
                    hitSlop={6}
                  >
                    {currentDisplayAvatarSource ? (
                      <Image
                        source={currentDisplayAvatarSource}
                        style={styles.heroAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.heroAvatarEmptyPlaceholder}>
                        <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                            stroke="#582CDB"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <Circle
                            cx="12"
                            cy="7"
                            r="4"
                            stroke="#582CDB"
                            strokeWidth="2.2"
                          />
                        </Svg>
                      </View>
                    )}
                    <View style={styles.heroCameraBadge}>
                      <Text style={styles.heroPlusBadgeText}>+</Text>
                    </View>
                  </Pressable>

                  <Text style={styles.heroNameText}>{name || 'Pablo'}</Text>
                  <Text style={styles.heroHandleText}>{handle || '@pablocreates'}</Text>

                  {/* CREATOR PASSPORT TIER LABEL */}
                  <View style={isPro ? styles.heroStreakPillPro : styles.heroStreakPill}>
                    <Text style={isPro ? styles.heroStreakPillTextPro : styles.heroStreakPillText}>
                      {isPro
                        ? `⚡ ${initialProfile?.streakCount || 1}-Day Streak • 👑 Pro Creator Passport`
                        : `⚡ ${initialProfile?.streakCount || 1}-Day Streak • 🆓 Free Creator Passport`}
                    </Text>
                  </View>
                </View>

                {/* 2. UPLOAD PHOTO FROM DEVICE ACTION */}
                <View style={styles.uploadButtonsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.uploadDeviceBtn, pressed && styles.btnPressed]}
                    onPress={handleUploadPhoto}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#7C3AED" strokeWidth="2.2" />
                      <Circle cx="8.5" cy="8.5" r="1.5" fill="#7C3AED" />
                      <Path d="M21 15L16 10L5 21" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.uploadDeviceBtnText}>Upload Photo from Device</Text>
                  </Pressable>
                </View>

                {/* 3. STATS STRIP */}
                <View style={styles.statsStrip}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{initialProfile?.streakCount || 1}d</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>12</Text>
                    <Text style={styles.statLabel}>Partners</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>3.4k</Text>
                    <Text style={styles.statLabel}>Collab XP</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>98%</Text>
                    <Text style={styles.statLabel}>Consistency</Text>
                  </View>
                </View>

                {/* 4. CHOOSE CREATOR AVATAR */}
                <Text style={styles.sectionHeaderTitle}>OR SELECT A CREATOR AVATAR</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.avatarCarousel}
                >
                  {CREATOR_AVATARS.map((av) => {
                    const isSelected = selectedAvatarId === av.id && !customAvatarUri;
                    return (
                      <Pressable
                        key={av.id}
                        style={[
                          styles.avatarItemCard,
                          isSelected && styles.avatarItemCardSelected,
                        ]}
                        onPress={() => handleSelectAvatar(av.id)}
                      >
                        <Image
                          source={av.source}
                          style={styles.avatarThumb}
                          resizeMode="cover"
                        />
                        <Text
                          style={[
                            styles.avatarItemName,
                            isSelected && styles.avatarItemNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {av.name.split(' ')[0]}
                        </Text>
                        {isSelected && (
                          <View style={styles.avatarCheckDot}>
                            <Text style={styles.avatarCheckDotText}>✓</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* 5. EDIT DISPLAY NAME & USERNAME */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DISPLAY NAME</Text>
                  <View style={styles.textInputBox}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Your creator name"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputField}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>USERNAME / HANDLE</Text>
                  <View style={styles.textInputBox}>
                    <TextInput
                      value={handle}
                      onChangeText={setHandle}
                      placeholder="@handle"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.textInputField}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NICHE &amp; LOCATION</Text>
                  <View style={styles.textInputBox}>
                    <TextInput
                      value={niche}
                      onChangeText={setNiche}
                      placeholder="e.g. Tech & Lifestyle Creator • Lagos"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputField}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CREATOR BIO / MOTTO</Text>
                  <View style={[styles.textInputBox, { height: 72 }]}>
                    <TextInput
                      value={bio}
                      onChangeText={setBio}
                      placeholder="Share what you create..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      style={[styles.textInputField, { height: 60, textAlignVertical: 'top' }]}
                    />
                  </View>
                </View>

                {/* 6. TOP CREATOR NICHES */}
                <Text style={styles.sectionHeaderTitle}>CREATOR CATEGORIES &amp; NICHES</Text>
                <View style={styles.nichesWrapRow}>
                  {ALL_NICHES.map((n) => {
                    const isChecked = selectedNiches.includes(n);
                    return (
                      <Pressable
                        key={n}
                        onPress={() => handleToggleNiche(n)}
                        style={[
                          styles.nicheChip,
                          isChecked && styles.nicheChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.nicheChipText,
                            isChecked && styles.nicheChipTextActive,
                          ]}
                        >
                          {isChecked ? `✓ ${n}` : `+ ${n}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB 2: CONNECTED SOCIALS (WITH AUTHENTIC REAL BRAND ICONS) */}
            {activeSubTab === 'socials' && (
              <View>
                <Text style={styles.sectionHeaderTitle}>CONNECTED PLATFORMS</Text>
                <Text style={styles.tabSubDescription}>
                  Link your creator handles to verify stats for collaborations and challenges.
                </Text>

                {/* 1. TikTok (Official Icon) */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={[styles.socialPlatformBadge, { backgroundColor: '#F1F5F9' }]}>
                      <TikTokRealIcon size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>TikTok</Text>
                      <Text style={styles.socialPlatformSub}>Sync video hooks &amp; viral reach</Text>
                    </View>
                    <View style={styles.connectedPill}>
                      <Text style={styles.connectedPillText}>CONNECTED</Text>
                    </View>
                  </View>
                  <View style={styles.socialInputBox}>
                    <TextInput
                      value={tiktokHandle}
                      onChangeText={setTiktokHandle}
                      placeholder="@tiktok_handle"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.textInputField}
                    />
                  </View>
                </View>

                {/* 2. Instagram (Official Gradient Icon) */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={[styles.socialPlatformBadge, { backgroundColor: '#FDF2F8' }]}>
                      <InstagramRealIcon size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>Instagram</Text>
                      <Text style={styles.socialPlatformSub}>Co-authoring &amp; collaboration tags</Text>
                    </View>
                    <View style={styles.connectedPill}>
                      <Text style={styles.connectedPillText}>CONNECTED</Text>
                    </View>
                  </View>
                  <View style={styles.socialInputBox}>
                    <TextInput
                      value={instagramHandle}
                      onChangeText={setInstagramHandle}
                      placeholder="@ig_handle"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.textInputField}
                    />
                  </View>
                </View>

                {/* 3. YouTube Shorts (Official Red Play Icon) */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={[styles.socialPlatformBadge, { backgroundColor: '#FEF2F2' }]}>
                      <YouTubeRealIcon size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>YouTube</Text>
                      <Text style={styles.socialPlatformSub}>Watch time &amp; subscriber growth</Text>
                    </View>
                    <View style={styles.connectedPill}>
                      <Text style={styles.connectedPillText}>CONNECTED</Text>
                    </View>
                  </View>
                  <View style={styles.socialInputBox}>
                    <TextInput
                      value={youtubeHandle}
                      onChangeText={setYoutubeHandle}
                      placeholder="Channel Name"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInputField}
                    />
                  </View>
                </View>

                {/* 4. X / Twitter (Official Brand Icon) */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={[styles.socialPlatformBadge, { backgroundColor: '#F8FAFC' }]}>
                      <XTwitterRealIcon size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>X (Twitter)</Text>
                      <Text style={styles.socialPlatformSub}>Creator thoughts &amp; daily updates</Text>
                    </View>
                    <View style={styles.connectedPill}>
                      <Text style={styles.connectedPillText}>CONNECTED</Text>
                    </View>
                  </View>
                  <View style={styles.socialInputBox}>
                    <TextInput
                      value={xHandle}
                      onChangeText={setXHandle}
                      placeholder="@x_handle"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.textInputField}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: CREATOR PASSPORT & INSTANT VERIFICATION */}
            {activeSubTab === 'verification' && (
              <View>
                {/* 1. HERO VERIFICATION PASSPORT BANNER */}
                <LinearGradient
                  colors={isPro ? ['#2A1259', '#1A0C38'] : ['#2D1B4E', '#1A0B2E']}
                  style={styles.verifHeroCard}
                >
                  <View style={styles.verifHeroTopRow}>
                    <View style={styles.verifAvatarWrap}>
                      {currentDisplayAvatarSource ? (
                        <Image source={currentDisplayAvatarSource} style={styles.verifAvatarImg} />
                      ) : (
                        <View style={[styles.verifAvatarImg, styles.verifAvatarEmpty]}>
                          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                              stroke="#582CDB"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <Circle
                              cx="12"
                              cy="7"
                              r="4"
                              stroke="#582CDB"
                              strokeWidth="2.2"
                            />
                          </Svg>
                        </View>
                      )}
                      <View style={[styles.verifBadgeGold, isPro ? styles.verifBadgePro : styles.verifBadgeFree]}>
                        <Text style={styles.verifBadgeText}>
                          {isPro ? '✓' : '4/5'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifMainHeroTitle}>
                        {isPro ? 'Your creator identity is 100% verified.' : 'Your creator identity is almost verified.'}
                      </Text>
                      <Text style={styles.verifMainHeroSub}>
                        {isPro ? '5 of 5 requirements complete · Verified Badge Active' : '4 of 5 requirements complete · 1 step remaining'}
                      </Text>
                    </View>
                  </View>

                  {/* Verification Progress Bar */}
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.verifProgressHeaderRow}>
                      <Text style={styles.verifProgressLabel}>VERIFICATION PROGRESS</Text>
                      <Text style={styles.verifProgressValText}>
                        {isPro ? '5/5 Complete (100%)' : '4/5 Complete (80%)'}
                      </Text>
                    </View>
                    <View style={styles.verifMeterTrack}>
                      <LinearGradient
                        colors={isPro ? ['#10B981', '#059669'] : ['#784DF0', '#582CDB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.verifMeterFill,
                          { width: isPro ? '100%' : '80%' },
                        ]}
                      />
                    </View>
                  </View>
                </LinearGradient>

                {/* 2. CREATOR VERIFICATION CHECKLIST (5 ITEMS) */}
                <Text style={styles.sectionHeaderTitle}>
                  {isPro ? 'VERIFICATION CHECKLIST (5 OF 5 COMPLETE)' : 'VERIFICATION CHECKLIST (4 OF 5 COMPLETE)'}
                </Text>
                <View style={styles.verifChecklistCard}>
                  {/* Item 1: Socials */}
                  <View style={styles.verifCheckItem}>
                    <View style={styles.verifCheckIconCircle}>
                      <Text style={styles.verifCheckMark}>✓</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.verifCheckTitle}>Connected Creator Platforms</Text>
                        <Pressable onPress={() => setActiveSubTab('socials')}>
                          <Text style={styles.verifEditLink}>Edit ›</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.verifCheckSub}>
                        TikTok ({tiktokHandle || '@pablo.creates'}), IG ({instagramHandle || '@pablocreates'}), YT, X
                      </Text>
                    </View>
                  </View>

                  <View style={styles.verifCheckDivider} />

                  {/* Item 2: Streak */}
                  <View style={styles.verifCheckItem}>
                    <View style={styles.verifCheckIconCircle}>
                      <Text style={styles.verifCheckMark}>✓</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifCheckTitle}>7-Day Consistency Threshold</Text>
                      <Text style={styles.verifCheckSub}>
                        Active {initialProfile?.streakCount || 1}-Day Posting Streak • Verified by Jarvis AI 🔥
                      </Text>
                    </View>
                  </View>

                  <View style={styles.verifCheckDivider} />

                  {/* Item 3: Bio & Niche */}
                  <View style={styles.verifCheckItem}>
                    <View style={styles.verifCheckIconCircle}>
                      <Text style={styles.verifCheckMark}>✓</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.verifCheckTitle}>Niche &amp; Bio Authenticity</Text>
                        <Pressable onPress={() => setActiveSubTab('profile')}>
                          <Text style={styles.verifEditLink}>Edit ›</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.verifCheckSub}>
                        {niche || 'Tech & Lifestyle Creator • Lagos'} • 3 Target Niches
                      </Text>
                    </View>
                  </View>

                  <View style={styles.verifCheckDivider} />

                  {/* Item 4: Verified Portfolio Link */}
                  <View style={styles.verifCheckItem}>
                    <View style={styles.verifCheckIconCircle}>
                      <Text style={styles.verifCheckMark}>✓</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifCheckTitle}>Verified Portfolio Reel Link</Text>
                      <View style={styles.portfolioInputRow}>
                        <TextInput
                          value={portfolioUrl}
                          onChangeText={setPortfolioUrl}
                          placeholder="https://instagram.com/reel/your_reel"
                          placeholderTextColor="#94A3B8"
                          style={styles.portfolioInput}
                          autoCapitalize="none"
                        />
                        <Pressable
                          style={styles.portfolioSavePill}
                          onPress={() => showToast('✓ Portfolio link updated & verified!')}
                        >
                          <Text style={styles.portfolioSavePillText}>Saved</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  <View style={styles.verifCheckDivider} />

                  {/* Item 5: Pro Membership (LOCKED ON FREE) */}
                  <View style={styles.verifCheckItem}>
                    <View style={[styles.verifCheckIconCircle, !isPro && { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.verifCheckMark, !isPro && { color: '#D97706' }]}>
                        {isPro ? '✓' : '🔒'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifCheckTitle}>Pro Creator Membership</Text>
                      <Text style={[styles.verifCheckSub, !isPro && { color: '#D97706', fontWeight: '700' }]}>
                        {isPro
                          ? 'Active Pro Creator • Verified Passport & Deal Escrow Active 👑'
                          : 'Pro Membership Required • Upgrade to claim verified badge 🔒'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. WHAT VERIFICATION UNLOCKS (4 VALUE CARDS) */}
                <Text style={styles.sectionHeaderTitle}>WHAT YOUR VERIFIED PASSPORT UNLOCKS</Text>
                <View style={styles.verifPerksGrid}>
                  <View style={styles.verifPerkCard}>
                    <Text style={styles.verifPerkIcon}>💰</Text>
                    <Text style={styles.verifPerkTitle}>Brand Bounties</Text>
                    <Text style={styles.verifPerkSub}>$450 - $1,200 priority sponsorship deals</Text>
                  </View>

                  <View style={styles.verifPerkCard}>
                    <Text style={styles.verifPerkIcon}>🚀</Text>
                    <Text style={styles.verifPerkTitle}>2x Discovery</Text>
                    <Text style={styles.verifPerkSub}>Top 2% ranking in Pro Match deck</Text>
                  </View>

                  <View style={styles.verifPerkCard}>
                    <Text style={styles.verifPerkIcon}>🛡️</Text>
                    <Text style={styles.verifPerkTitle}>Streak Shield</Text>
                    <Text style={styles.verifPerkSub}>Automatic 7-day missed day protection</Text>
                  </View>

                  <View style={styles.verifPerkCard}>
                    <Text style={styles.verifPerkIcon}>👑</Text>
                    <Text style={styles.verifPerkTitle}>Gold Badge</Text>
                    <Text style={styles.verifPerkSub}>Official verified checkmark on profile</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 4: SETTINGS */}
            {activeSubTab === 'settings' && (
              <View>
                <Text style={styles.sectionHeaderTitle}>
                  ACCOUNTABILITY &amp; NOTIFICATIONS
                </Text>

                <View style={styles.preferenceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prefTitle}>Daily Streak Reminders</Text>
                    <Text style={styles.prefSub}>
                      Alerts 2 hours before daily streak cutoff (10:00 PM)
                    </Text>
                  </View>
                  <HarmoniousSwitch
                    value={streakReminders}
                    onValueChange={setStreakReminders}
                  />
                </View>

                <View style={styles.preferenceDivider} />

                <View style={styles.preferenceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prefTitle}>Creator Collab Invitations</Text>
                    <Text style={styles.prefSub}>
                      Allow verified partners to pitch duo challenges &amp; Reels
                    </Text>
                  </View>
                  <HarmoniousSwitch
                    value={collabInvites}
                    onValueChange={setCollabInvites}
                  />
                </View>

                <View style={styles.preferenceDivider} />

                <View style={styles.preferenceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prefTitle}>Haptic &amp; Sound Feedback</Text>
                    <Text style={styles.prefSub}>
                      Feel tactile clicks on buttons, streak meters &amp; quests
                    </Text>
                  </View>
                  <HarmoniousSwitch
                    value={hapticFeedback}
                    onValueChange={setHapticFeedback}
                  />
                </View>

                {/* SIGN OUT BUTTON */}
                {onLogout && (
                  <Pressable
                    style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      onClose();
                      onLogout();
                    }}
                  >
                    <Text style={styles.logoutBtnText}>Sign Out of PostStreak ➔</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* PRIMARY SAVE & UPDATE BUTTON */}
          <View style={styles.modalFooter}>
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
              onPress={handleSave}
            >
              <LinearGradient
                colors={['#7C3AED', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <Text style={styles.saveBtnText}>{getBottomActionText()}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sPadding(14),
    paddingVertical: Platform.OS === 'ios' ? 40 : 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: sPadding(16),
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 10,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Modal Header: FREE BADGE
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  freeBadgePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  proBadgePill: {
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  proBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  heroStreakPillPro: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
  },
  heroStreakPillTextPro: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnCross: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },

  // Sub Tabs
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    width: '100%',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  subTabText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },

  scrollBody: {
    maxHeight: Dimensions.get('window').height * 0.54,
  },

  // Toast
  toastBanner: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // Hero Avatar Section
  heroAvatarSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  heroAvatarRing: {
    position: 'relative',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  heroAvatarEmptyPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  heroPlusBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
    marginTop: -1,
  },
  heroNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  heroHandleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  heroStreakPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginTop: 8,
  },
  heroStreakPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },

  // Upload Buttons Row
  uploadButtonsRow: {
    marginBottom: 14,
    alignItems: 'center',
  },
  uploadDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  uploadDeviceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // Stats Strip
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
  },

  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },

  // Avatar Carousel
  avatarCarousel: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 10,
  },
  avatarItemCard: {
    alignItems: 'center',
    width: 60,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarItemCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  avatarThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  avatarItemName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  avatarItemNameSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  avatarCheckDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCheckDotText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Inputs
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    height: 42,
    justifyContent: 'center',
  },
  textInputField: {
    fontSize: 13,
    color: '#171420',
    fontWeight: '600',
  },

  // Niches Wrap
  nichesWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  nicheChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  nicheChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  nicheChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  nicheChipTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },

  // Socials Tab
  tabSubDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  socialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 10,
  },
  socialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  socialPlatformBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  socialPlatformTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  socialPlatformSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  connectedPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  connectedPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#15803D',
  },
  socialInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    height: 38,
    justifyContent: 'center',
  },

  // Preferences Tab (Harmonious Theme & Switch Colors)
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  prefSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    paddingRight: 10,
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutBtn: {
    marginTop: 20,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },

  // Verification Tab Styles
  verifHeroCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  verifHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifAvatarWrap: {
    position: 'relative',
  },
  verifAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  verifAvatarEmpty: {
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifBadgeGold: {
    position: 'absolute',
    bottom: -3,
    right: -4,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1A0C38',
  },
  verifBadgePro: {
    width: 18,
    backgroundColor: '#582CDB',
  },
  verifBadgeFree: {
    minWidth: 26,
    paddingHorizontal: 4,
    backgroundColor: '#F59E0B',
  },
  verifBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  verifMainHeroTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  verifMainHeroSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D8B4FE',
    marginTop: 2,
  },
  verifProgressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  verifProgressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C084FC',
    letterSpacing: 0.5,
  },
  verifProgressValText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
  },
  verifHeroName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifStatusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  verifStatusPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  verifHeroSub: {
    fontSize: 11,
    color: '#D8B4FE',
    marginTop: 2,
  },
  verifMeterLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C084FC',
    letterSpacing: 0.5,
  },
  verifMeterVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE68A',
  },
  verifMeterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  verifMeterFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  verifChecklistCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: sPadding(12),
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    width: '100%',
  },
  verifCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
    width: '100%',
  },
  verifCheckIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  verifCheckMark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  verifCheckTitle: {
    fontSize: sFont(12),
    fontWeight: '800',
    color: '#171420',
  },
  verifEditLink: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  verifCheckSub: {
    fontSize: sFont(10),
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  verifCheckDivider: {
    height: 1,
    backgroundColor: '#F1EFE9',
    marginVertical: 8,
  },
  portfolioInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    width: '100%',
  },
  portfolioInput: {
    flex: 1,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 6,
    fontSize: sFont(10.5),
    color: '#171420',
    minWidth: 0,
  },
  portfolioSavePill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    flexShrink: 0,
  },
  portfolioSavePillText: {
    fontSize: sFont(9.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifPerksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  verifPerkCard: {
    width: '48%',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  verifPerkIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  verifPerkTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
  },
  verifPerkSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 13,
  },
  verifActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  verifActionGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  verifActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  // Footer Save Button
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
