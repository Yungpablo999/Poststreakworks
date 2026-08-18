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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface UserProfileData {
  name: string;
  handle: string;
  bio: string;
  niche: string;
  avatarId: string;
  avatarSource: any;
  streakCount: number;
  level: number;
  xp: number;
  partnersCount: number;
  tiktokHandle?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  niches: string[];
}

export const CREATOR_AVATARS = [
  {
    id: 'ghost',
    name: 'Ghost Mascot',
    source: require('../../assets/images/jarvis-ghost-clean.png'),
    tag: 'DEFAULT',
  },
  {
    id: 'flame',
    name: 'Jarvis Core',
    source: require('../../assets/images/jarvis-core-flame.png'),
    tag: 'AI POWERED',
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    source: require('../../assets/images/elena-avatar.jpg'),
    tag: 'CREATOR',
  },
  {
    id: 'amara',
    name: 'Amara Okafor',
    source: require('../../assets/images/amara-avatar.jpg'),
    tag: 'CREATOR',
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
    tag: 'CREATOR',
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    source: require('../../assets/images/marcus-avatar.jpg'),
    tag: 'CREATOR',
  },
  {
    id: 'tomi',
    name: 'Tomiwa Kuti',
    source: require('../../assets/images/tomi-avatar.jpg'),
    tag: 'CREATOR',
  },
  {
    id: 'zainab',
    name: 'Zainab Bello',
    source: require('../../assets/images/zainab-avatar.jpg'),
    tag: 'CREATOR',
  },
  {
    id: 'hero',
    name: 'Jarvis Hero',
    source: require('../../assets/images/jarvis-hero.png'),
    tag: 'PRO',
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

export interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  initialProfile?: Partial<UserProfileData>;
  onSaveProfile?: (updatedProfile: UserProfileData) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  onLogout,
  initialProfile,
  onSaveProfile,
}) => {
  // Form State
  const [name, setName] = useState(initialProfile?.name || 'Pablo');
  const [handle, setHandle] = useState(initialProfile?.handle || '@pablocreates');
  const [niche, setNiche] = useState(initialProfile?.niche || 'Tech & Lifestyle Creator • Lagos');
  const [bio, setBio] = useState(
    initialProfile?.bio || 'Consistency is my superpower. Building a 100-day creator streak with Jarvis AI.'
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(initialProfile?.avatarId || 'ghost');
  const [selectedNiches, setSelectedNiches] = useState<string[]>(
    initialProfile?.niches || ['Lifestyle', 'Tech & AI', 'Storytelling']
  );

  // Socials
  const [tiktokHandle, setTiktokHandle] = useState(initialProfile?.tiktokHandle || '@pablo.creates');
  const [instagramHandle, setInstagramHandle] = useState(initialProfile?.instagramHandle || '@pablocreates');
  const [youtubeHandle, setYoutubeHandle] = useState(initialProfile?.youtubeHandle || 'Pablo Creates');

  // Preferences
  const [streakReminders, setStreakReminders] = useState(true);
  const [collabInvites, setCollabInvites] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // UI tabs inside profile modal
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'socials' | 'settings'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const toastFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      modalScale.setValue(0.9);
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastFade.setValue(0);
    Animated.sequence([
      Animated.timing(toastFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastFade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleSelectAvatar = (avatarId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAvatarId(avatarId);
    const found = CREATOR_AVATARS.find((a) => a.id === avatarId);
    showToast(`Profile picture set to "${found?.name}"`);
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
    const currentAvatar =
      CREATOR_AVATARS.find((a) => a.id === selectedAvatarId) || CREATOR_AVATARS[0];

    const updated: UserProfileData = {
      name: name.trim() || 'Pablo',
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      bio: bio.trim(),
      niche: niche.trim(),
      avatarId: selectedAvatarId,
      avatarSource: currentAvatar.source,
      streakCount: initialProfile?.streakCount || 47,
      level: initialProfile?.level || 5,
      xp: initialProfile?.xp || 3450,
      partnersCount: initialProfile?.partnersCount || 12,
      tiktokHandle: tiktokHandle.trim(),
      instagramHandle: instagramHandle.trim(),
      youtubeHandle: youtubeHandle.trim(),
      niches: selectedNiches,
    };

    if (onSaveProfile) {
      onSaveProfile(updated);
    }
    onClose();
  };

  const currentAvatarObj =
    CREATOR_AVATARS.find((a) => a.id === selectedAvatarId) || CREATOR_AVATARS[0];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}
        >
          {/* TOP MODAL HEADER */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.modalTitle}>Creator Passport</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.modalSubtitle}>
                Manage your public creator profile &amp; avatar
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
              >
                👤 Identity
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
              >
                🔗 Socials
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
                  <View style={styles.heroAvatarRing}>
                    <Image
                      source={currentAvatarObj.source}
                      style={styles.heroAvatarImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroCameraBadge}>
                      <Text style={{ fontSize: 13 }}>✎</Text>
                    </View>
                  </View>

                  <Text style={styles.heroNameText}>{name || 'Pablo'}</Text>
                  <Text style={styles.heroHandleText}>{handle || '@pablocreates'}</Text>

                  {/* STREAK & LEVEL PILL */}
                  <View style={styles.heroStreakPill}>
                    <Text style={styles.heroStreakPillText}>
                      ⚡ 47-Day Streak • 🏆 Level 5 Pro Creator
                    </Text>
                  </View>
                </View>

                {/* 2. STATS STRIP */}
                <View style={styles.statsStrip}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>47d</Text>
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

                {/* 3. CHOOSE PROFILE PICTURE / AVATAR */}
                <Text style={styles.sectionHeaderTitle}>CHOOSE CREATOR AVATAR</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.avatarCarousel}
                >
                  {CREATOR_AVATARS.map((av) => {
                    const isSelected = selectedAvatarId === av.id;
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

                {/* 4. EDIT DISPLAY NAME & USERNAME */}
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

                {/* 5. TOP CREATOR NICHES */}
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

            {/* TAB 2: CONNECTED SOCIALS */}
            {activeSubTab === 'socials' && (
              <View>
                <Text style={styles.sectionHeaderTitle}>CONNECTED PLATFORMS</Text>
                <Text style={styles.tabSubDescription}>
                  Link your primary creator channels to showcase verified stats to collab partners.
                </Text>

                {/* TikTok */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={styles.socialPlatformBadge}>
                      <Text style={{ fontSize: 16 }}>🎵</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>TikTok Channel</Text>
                      <Text style={styles.socialPlatformSub}>Sync video hooks &amp; streak</Text>
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

                {/* Instagram */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={[styles.socialPlatformBadge, { backgroundColor: '#FDF2F8' }]}>
                      <Text style={{ fontSize: 16 }}>📸</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>Instagram Reels</Text>
                      <Text style={styles.socialPlatformSub}>Co-posting &amp; collaboration tags</Text>
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

                {/* YouTube Shorts */}
                <View style={styles.socialCard}>
                  <View style={styles.socialHeaderRow}>
                    <View style={[styles.socialPlatformBadge, { backgroundColor: '#FEF2F2' }]}>
                      <Text style={{ fontSize: 16 }}>▶️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatformTitle}>YouTube Shorts</Text>
                      <Text style={styles.socialPlatformSub}>Audience watch-time metrics</Text>
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
              </View>
            )}

            {/* TAB 3: ACCOUNT & PREFERENCES */}
            {activeSubTab === 'settings' && (
              <View>
                <Text style={styles.sectionHeaderTitle}>ACCOUNTABILITY &amp; NOTIFICATIONS</Text>

                <View style={styles.preferenceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prefTitle}>Daily Streak Reminders</Text>
                    <Text style={styles.prefSub}>
                      Alerts 2 hours before daily streak cutoff (10:00 PM)
                    </Text>
                  </View>
                  <Switch
                    value={streakReminders}
                    onValueChange={setStreakReminders}
                    trackColor={{ false: '#CBD5E1', true: '#7C3AED' }}
                    thumbColor="#FFFFFF"
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
                  <Switch
                    value={collabInvites}
                    onValueChange={setCollabInvites}
                    trackColor={{ false: '#CBD5E1', true: '#7C3AED' }}
                    thumbColor="#FFFFFF"
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
                  <Switch
                    value={hapticFeedback}
                    onValueChange={setHapticFeedback}
                    trackColor={{ false: '#CBD5E1', true: '#7C3AED' }}
                    thumbColor="#FFFFFF"
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
                <Text style={styles.saveBtnText}>Save &amp; Update Profile ✓</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 10,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Modal Header
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    backgroundColor: '#7C3AED',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
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
    borderColor: '#E2E8F0',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 7,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#582CDB',
    fontWeight: '900',
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
    marginBottom: 16,
  },
  heroAvatarRing: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#7C3AED',
    padding: 2,
    marginBottom: 10,
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  heroCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#582CDB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroNameText: {
    fontSize: 18,
    fontWeight: '900',
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
    fontWeight: '900',
    color: '#B45309',
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
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14.5,
    fontWeight: '900',
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
    fontWeight: '900',
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
    borderColor: '#582CDB',
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
    color: '#582CDB',
    fontWeight: '900',
  },
  avatarCheckDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCheckDotText: {
    fontSize: 9.5,
    fontWeight: '900',
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
    borderColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  nicheChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  nicheChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  nicheChipTextActive: {
    color: '#582CDB',
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
    borderColor: '#E2E8F0',
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '900',
    color: '#15803D',
  },
  socialInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
    justifyContent: 'center',
  },

  // Preferences Tab
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
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
