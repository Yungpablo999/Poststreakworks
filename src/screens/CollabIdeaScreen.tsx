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
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface CollabIdeaScreenProps {
  partnerName?: string;
  partnerHandle?: string;
  partnerNiche?: string;
  partnerAvatar?: any;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onStartCollaboration?: (collabData: { title: string; caption: string; partnerName: string }) => void;
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
    title: 'Collab Partner Ready',
    body: 'Elena accepted your 14-day consistency challenge.',
    time: '5m ago',
    unread: true,
    iconEmoji: '⚡',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'n2',
    title: 'Peak Reach Window',
    body: 'Optimal viral co-post time is 7:30 PM today.',
    time: '1h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

export const CollabIdeaScreen: React.FC<CollabIdeaScreenProps> = ({
  partnerName = 'Elena Rostova',
  partnerHandle = '@elenacreates',
  partnerNiche = 'Tech & Lifestyle, Lagos',
  partnerAvatar = require('../../assets/images/elena-avatar.jpg'),
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onStartCollaboration,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');

  // Interactive Collab State
  const [collabTitle, setCollabTitle] = useState('Day in Lagos: Creator Edition');
  const [collabDesc, setCollabDesc] = useState(
    'A short lifestyle collaboration where two creators show how they plan, film and publish content in one day.'
  );
  const [captionText, setCaptionText] = useState(
    `"Spent the day creating with @${partnerHandle.replace('@', '')}. We realized that the hardest part of growth isn't the work, it's the plan. Here's how we filmed 3 hooks in under 30 minutes..."`
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'reels']);
  const [isSaved, setIsSaved] = useState(false);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Collab Started!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Collab draft created and synced with your partner.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Duo momentum protected! +50 XP on completion.');
  const [celebrationBadge, setCelebrationBadge] = useState('COLLAB ACTIVE');

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

  const handleTogglePlatform = (plat: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedPlatforms.includes(plat)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, plat]);
    }
  };

  const handleToggleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaved(!isSaved);
    setCelebrationTitle(!isSaved ? 'Idea Saved!' : 'Idea Removed');
    setCelebrationSubtitle(!isSaved ? 'Saved to your creator collaboration vault.' : 'Removed from your saved ideas.');
    setCelebrationSpeech(!isSaved ? 'Ready to film anytime you and your partner connect.' : 'Vault updated.');
    setCelebrationBadge(!isSaved ? 'SAVED' : 'UPDATED');
    setShowCelebrationModal(true);
  };

  const handleUseCaption = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onStartCollaboration) {
      onStartCollaboration({
        title: collabTitle,
        caption: captionText,
        partnerName: partnerName,
      });
    }
  };

  const handleStartCollab = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onStartCollaboration) {
      onStartCollaboration({
        title: collabTitle,
        caption: captionText,
        partnerName: partnerName,
      });
    }
  };

  const handleSendInvite = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationTitle('Invitation Sent!');
    setCelebrationSubtitle(`Collab pitch & script sent to ${partnerName}'s inbox.`);
    setCelebrationSpeech('Accountability invite active! +20 XP.');
    setCelebrationBadge('INVITE SENT');
    setShowCelebrationModal(true);
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
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
                onPress={onBack}
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
                <Image
                  source={partnerAvatar}
                  style={styles.headerPartnerMiniAvatar}
                  resizeMode="cover"
                />
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
            {/* Top Pill Badges */}
            <View style={styles.topBadgesRow}>
              <View style={styles.collabIdeaPill}>
                <Text style={styles.collabIdeaPillText}>COLLAB IDEA</Text>
              </View>
              <View style={styles.freeCollabPill}>
                <Text style={styles.freeCollabPillText}>FREE COLLAB IDEA</Text>
              </View>
            </View>

            {/* Main Title & Subtitle */}
            <Text style={styles.mainTitle}>Build a simple creator collaboration.</Text>
            <Text style={styles.mainSubtitle}>
              Use this idea to create content with a matched creator and turn it into a post.
            </Text>

            {/* CARD 1: MAIN COLLAB IDEA OVERVIEW */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewTitle}>{collabTitle}</Text>
              <Text style={styles.overviewDesc}>{collabDesc}</Text>

              {/* Tags Row */}
              <View style={styles.overviewTagsRow}>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>Lifestyle</Text>
                </View>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>Behind the Scenes</Text>
                </View>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>Short-form Video</Text>
                </View>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>Easy to Film</Text>
                </View>
              </View>

              {/* Purple Goal Highlight Box */}
              <View style={styles.goalHighlightBox}>
                <Text style={styles.goalHighlightText}>
                  Goal: Create a simple first collab that builds trust and is easy to execute.
                </Text>
              </View>
            </View>

            {/* CARD 2: CONTENT OUTLINE */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardHeaderTitle}>CONTENT OUTLINE</Text>

              <View style={styles.stepperContainer}>
                {[
                  '1. Meet up and greet on camera',
                  '2. Plan the collaborative post',
                  '3. Film both creators together',
                  '4. Share one key creator lesson',
                  '5. Post and tag each other',
                ].map((step, idx, arr) => (
                  <View key={idx} style={styles.stepperRow}>
                    {/* Stepper Dot and Line */}
                    <View style={styles.stepperLineCol}>
                      <View style={styles.stepperDot} />
                      {idx < arr.length - 1 && <View style={styles.stepperVerticalLine} />}
                    </View>

                    {/* Stepper Text */}
                    <View style={styles.stepperTextCol}>
                      <Text style={styles.stepperStepText}>{step}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CARD 3: COLLABORATION ROLES */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardHeaderTitle}>COLLABORATION ROLES</Text>

              <View style={styles.rolesGrid}>
                {/* Column 1: You */}
                <View style={styles.roleCol}>
                  <View style={styles.roleColHeader}>
                    <Text style={styles.roleUserIcon}>👤</Text>
                    <Text style={styles.roleUserTitle}>You</Text>
                  </View>
                  <Text style={styles.roleBulletText}>• Introduce concept</Text>
                  <Text style={styles.roleBulletText}>• Share creator lesson</Text>
                  <Text style={styles.roleBulletText}>• Edit final footage</Text>
                  <Text style={styles.roleBulletText}>• Write caption copy</Text>
                </View>

                {/* Column 2: Partner */}
                <View style={styles.roleCol}>
                  <View style={styles.roleColHeader}>
                    <Text style={styles.roleUserIcon}>👤</Text>
                    <Text style={styles.roleUserTitle}>{partnerName.split(' ')[0]}</Text>
                  </View>
                  <Text style={styles.roleBulletText}>• Choose locations</Text>
                  <Text style={styles.roleBulletText}>• Film key scenes</Text>
                  <Text style={styles.roleBulletText}>• Add her perspective</Text>
                  <Text style={styles.roleBulletText}>• Share first to story</Text>
                </View>
              </View>
            </View>

            {/* CARD 4: CAPTION STARTER */}
            <View style={styles.sectionCard}>
              <View style={styles.captionStarterHeaderRow}>
                <Text style={styles.sectionCardHeaderTitle}>CAPTION STARTER</Text>
                <Pressable onPress={handleToggleSave} hitSlop={8}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill={isSaved ? '#582CDB' : 'none'}>
                    <Path
                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              </View>

              {/* Editable Caption Box */}
              <View style={styles.captionQuoteBox}>
                <TextInput
                  value={captionText}
                  onChangeText={setCaptionText}
                  multiline
                  placeholder="Write or customize caption..."
                  placeholderTextColor="#94A3B8"
                  style={styles.captionInput}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.useCaptionBtn, pressed && styles.btnPressed]}
                onPress={handleUseCaption}
              >
                <Text style={styles.useCaptionBtnText}>Use Caption</Text>
              </Pressable>
            </View>

            {/* CARD 5: JARVIS AI SUGGESTION */}
            <LinearGradient
              colors={['#FAF5FF', '#EDE9FE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.jarvisSuggestionCard}
            >
              <View style={styles.jarvisSuggestionHeader}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisSuggestionFlame}
                  resizeMode="contain"
                />
                <Text style={styles.jarvisSuggestionTitle}>Jarvis AI Suggestion</Text>
              </View>

              <Text style={styles.jarvisSuggestionBody}>
                Keep this first collaboration simple. A short behind-the-scenes Reel is <Text style={{ fontWeight: '800' }}>much easier</Text> to finish and publish today, ensuring you don\'t lose your 47-day momentum while exploring this new partnership.
              </Text>

              <View style={styles.jarvisChipsRow}>
                <Pressable
                  style={styles.jarvisActionChip}
                  onPress={handleStartCollab}
                >
                  <Text style={styles.jarvisActionChipText}>Turn into Post</Text>
                </Pressable>

                <Pressable
                  style={styles.jarvisActionChip}
                  onPress={handleSendInvite}
                >
                  <Text style={styles.jarvisActionChipText}>Invite Creator</Text>
                </Pressable>

                <Pressable
                  style={styles.jarvisActionChip}
                  onPress={handleToggleSave}
                >
                  <Text style={styles.jarvisActionChipText}>Save Idea</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* CARD 6: CREATOR INVOLVED */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardHeaderTitle}>CREATOR INVOLVED</Text>

              <View style={styles.creatorInvolvedRow}>
                <Image source={partnerAvatar} style={styles.creatorInvolvedAvatar} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.creatorInvolvedName}>{partnerName}</Text>
                    <View style={styles.verifiedCheckPill}>
                      <Text style={styles.verifiedCheckText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.creatorInvolvedNiche}>{partnerNiche}</Text>
                  <View style={styles.creatorInvolvedBadges}>
                    <Text style={styles.creatorInvolvedBadgeText}>⚡ 52d streak</Text>
                    <Text style={styles.creatorInvolvedBadgeText}>• ⭐ 110k reach</Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.viewProfileBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalAnim();
                  setShowProfileModal(true);
                }}
              >
                <Text style={styles.viewProfileBtnText}>View Profile</Text>
              </Pressable>
            </View>

            {/* CARD 7: FORMAT & PLATFORMS (TWO COLUMNS) */}
            <View style={styles.twoColRow}>
              {/* Format Box */}
              <View style={styles.halfColBox}>
                <Text style={styles.halfColLabel}>FORMAT</Text>
                <Text style={styles.halfColMainText}>Short Reel</Text>
                <Text style={styles.halfColSubText}>Vertical 9:16, under 45s</Text>
                <View style={styles.recommendedPill}>
                  <Text style={styles.recommendedPillText}>RECOMMENDED</Text>
                </View>
              </View>

              {/* Platforms Box */}
              <View style={styles.halfColBox}>
                <Text style={styles.halfColLabel}>PLATFORMS</Text>
                {[
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'reels', label: 'IG Reel' },
                  { id: 'shorts', label: 'YT Shorts' },
                ].map((plat) => {
                  const isChecked = selectedPlatforms.includes(plat.id);
                  return (
                    <Pressable
                      key={plat.id}
                      style={styles.platCheckboxRow}
                      onPress={() => handleTogglePlatform(plat.id)}
                    >
                      <View style={[styles.platRadioCircle, isChecked && styles.platRadioCircleActive]}>
                        {isChecked && <View style={styles.platRadioDot} />}
                      </View>
                      <Text style={styles.platLabelText}>{plat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* CARD 8: SUGGESTED SCHEDULE (PREMIUM PALETTE) */}
            <LinearGradient
              colors={['#FAF8FE', '#F5F0FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scheduleCard}
            >
              <View style={styles.scheduleHeaderRow}>
                <Text style={styles.scheduleHeaderTitle}>SUGGESTED SCHEDULE</Text>
                <View style={styles.scheduleCalendarIconBadge}>
                  <Text style={{ fontSize: 13 }}>📅</Text>
                </View>
              </View>

              <View style={styles.scheduleItemRow}>
                <Text style={styles.scheduleItemLabel}>Planning</Text>
                <Text style={styles.scheduleItemTime}>11:00 - 12:00 PM</Text>
              </View>

              <View style={styles.scheduleItemDivider} />

              <View style={styles.scheduleItemRow}>
                <Text style={styles.scheduleItemLabel}>Filming</Text>
                <Text style={styles.scheduleItemTime}>2:00 - 3:30 PM</Text>
              </View>

              <View style={styles.scheduleItemDivider} />

              <View style={styles.scheduleItemRow}>
                <Text style={[styles.scheduleItemLabel, { color: '#582CDB', fontWeight: '800' }]}>Publishing</Text>
                <View style={styles.peakSlotBadge}>
                  <Text style={styles.peakSlotBadgeText}>⚡ Peak 7:30 PM</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.adjustScheduleBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalAnim();
                  setShowScheduleModal(true);
                }}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.adjustScheduleGradient}
                >
                  <Text style={styles.adjustScheduleBtnText}>Adjust Schedule ›</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>

            {/* CARD 9: IMPACT SCORE */}
            <View style={styles.impactCard}>
              <View style={styles.impactHeaderRow}>
                <Text style={styles.impactHeaderTitle}>IMPACT SCORE</Text>
                <Text style={styles.impactHighBadge}>⚡ High</Text>
              </View>

              <View style={styles.impactItemRow}>
                <Text style={styles.impactGreenCheck}>🟢</Text>
                <Text style={styles.impactItemText}>Protects 47-day streak</Text>
              </View>

              <View style={styles.impactItemRow}>
                <Text style={styles.impactPurpleCheck}>🟣</Text>
                <Text style={styles.impactItemText}>Earns Creator Passport XP</Text>
              </View>

              <View style={styles.impactProgressHeader}>
                <Text style={styles.impactProgressLabel}>Goal Completion</Text>
                <Text style={styles.impactProgressVal}>85%</Text>
              </View>

              <View style={styles.impactProgressTrack}>
                <View style={styles.impactProgressFill} />
              </View>
            </View>

            {/* 10. PRIMARY BOTTOM ACTIONS */}
            <View style={styles.bottomActionBar}>
              <Pressable
                style={({ pressed }) => [styles.startCollabBtn, pressed && styles.btnPressed]}
                onPress={handleStartCollab}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startCollabGradient}
                >
                  <Text style={styles.startCollabBtnText}>Start Collaboration</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.inviteBtn, pressed && styles.btnPressed]}
                onPress={handleSendInvite}
              >
                <Text style={styles.inviteBtnText}>Invite</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveBookmarkBtn,
                  isSaved && styles.saveBookmarkBtnActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleToggleSave}
                hitSlop={8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill={isSaved ? '#582CDB' : 'none'}>
                  <Path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    stroke="#582CDB"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>

            {/* Spacing for floating tab bar */}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
          <FloatingTabBar
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />

          {/* MODAL: ADJUST SCHEDULE */}
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
                    <Text style={styles.modalTitle}>Collab Schedule</Text>
                    <Text style={styles.modalSubtitle}>Sync optimal hours with {partnerName}</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowScheduleModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.scheduleSlotBox}>
                  <Text style={styles.scheduleSlotLabel}>📅 Filming Window</Text>
                  <Text style={styles.scheduleSlotTime}>Today • 2:00 PM - 3:30 PM (Lagos GMT+1)</Text>
                </View>

                <View style={styles.scheduleSlotBox}>
                  <Text style={styles.scheduleSlotLabel}>⚡ Optimal Viral Publishing</Text>
                  <Text style={styles.scheduleSlotTime}>Today • 7:30 PM (Peak Audience Activity)</Text>
                </View>

                <Pressable
                  style={styles.modalFullBtn}
                  onPress={() => {
                    setShowScheduleModal(false);
                    setCelebrationTitle('Schedule Synced!');
                    setCelebrationSubtitle(`Collab timeline set for 7:30 PM with ${partnerName}.`);
                    setCelebrationSpeech('Calendar reminder created! You are ready to film.');
                    setCelebrationBadge('SCHEDULED');
                    setShowCelebrationModal(true);
                  }}
                >
                  <Text style={styles.modalFullBtnText}>Confirm Schedule ➔</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Modal>

          {/* MODAL: PARTNER PROFILE */}
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
                    <Text style={styles.modalSubtitle}>Verified creator partner</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowProfileModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.profileModalInner}>
                  <Image source={partnerAvatar} style={styles.profileModalAvatar} resizeMode="cover" />
                  <Text style={styles.profileModalName}>{partnerName}</Text>
                  <Text style={styles.profileModalHandle}>{partnerHandle}</Text>
                  <Text style={styles.profileModalNiche}>{partnerNiche}</Text>
                  <View style={styles.profileStreakBadge}>
                    <Text style={styles.profileStreakBadgeText}>⚡ 52-Day Streak • Level 5 Creator</Text>
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
                    <Text style={styles.modalSubtitle}>Collab updates &amp; creator alerts</Text>
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

          {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
          <AnimatedCompletionModal
            visible={showCelebrationModal}
            title={celebrationTitle}
            subtitle={celebrationSubtitle}
            speechBubble={celebrationSpeech}
            badgeText={celebrationBadge}
            xpEarned={50}
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
  headerPartnerMiniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  collabIdeaPill: {
    backgroundColor: '#7C3AED',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  collabIdeaPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  freeCollabPill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  freeCollabPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.5,
  },

  mainTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 6,
    marginTop: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // Card 1: Overview Card
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 6,
  },
  overviewDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 12,
  },
  overviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  goalHighlightBox: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 3.5,
    borderLeftColor: '#7C3AED',
    borderRadius: 12,
    padding: 12,
  },
  goalHighlightText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
    lineHeight: 18,
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
  sectionCardHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Stepper Styles
  stepperContainer: {
    paddingLeft: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    minHeight: 34,
  },
  stepperLineCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  stepperDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#582CDB',
    marginTop: 3,
  },
  stepperVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD6FE',
    marginVertical: 2,
  },
  stepperTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  stepperStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 18,
  },

  // Roles Grid
  rolesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roleUserIcon: {
    fontSize: 14,
  },
  roleUserTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  roleBulletText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 3,
  },

  // Caption Starter
  captionStarterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  captionQuoteBox: {
    backgroundColor: '#FAF8FE',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  captionInput: {
    fontSize: 13,
    color: '#171420',
    lineHeight: 19,
    minHeight: 60,
  },
  useCaptionBtn: {
    height: 40,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useCaptionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Jarvis Suggestion Card
  jarvisSuggestionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  jarvisSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jarvisSuggestionFlame: {
    width: 20,
    height: 20,
  },
  jarvisSuggestionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#582CDB',
  },
  jarvisSuggestionBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  jarvisActionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  jarvisActionChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Creator Involved
  creatorInvolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  creatorInvolvedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  creatorInvolvedName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
  },
  verifiedCheckPill: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  creatorInvolvedNiche: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  creatorInvolvedBadges: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  creatorInvolvedBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D97706',
  },
  viewProfileBtn: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Two Column Format & Platforms
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  halfColBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    justifyContent: 'space-between',
  },
  halfColLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  halfColMainText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#171420',
  },
  halfColSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 8,
  },
  recommendedPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendedPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803D',
  },
  platCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  platRadioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platRadioCircleActive: {
    borderColor: '#582CDB',
  },
  platRadioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  platLabelText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
  },

  // Suggested Schedule Card (Premium Royal Lavender & Purple Palette)
  scheduleCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#6D28D9',
    letterSpacing: 0.8,
  },
  scheduleCalendarIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  scheduleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  scheduleItemDivider: {
    height: 1,
    backgroundColor: 'rgba(221, 214, 254, 0.4)',
    marginVertical: 2,
  },
  scheduleItemLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  scheduleItemTime: {
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '700',
  },
  peakSlotBadge: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  peakSlotBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6D28D9',
  },
  adjustScheduleBtn: {
    height: 42,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  adjustScheduleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustScheduleBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Impact Score Card
  impactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  impactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  impactHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  impactHighBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
  },
  impactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  impactGreenCheck: {
    fontSize: 10,
  },
  impactPurpleCheck: {
    fontSize: 10,
  },
  impactItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  impactProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  impactProgressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  impactProgressVal: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#D97706',
  },
  impactProgressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  impactProgressFill: {
    width: '85%',
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },

  // Bottom Floating Action Bar
  bottomActionBar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  startCollabBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  startCollabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startCollabBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  inviteBtn: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  saveBookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBookmarkBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
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
  scheduleSlotBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  scheduleSlotLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 2,
  },
  scheduleSlotTime: {
    fontSize: 12.5,
    color: '#334155',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileModalInner: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileModalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#582CDB',
    marginBottom: 10,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
  },
  profileModalHandle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  profileModalNiche: {
    fontSize: 12,
    color: '#582CDB',
    fontWeight: '700',
    marginTop: 4,
  },
  profileStreakBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginTop: 10,
  },
  profileStreakBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
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
});
