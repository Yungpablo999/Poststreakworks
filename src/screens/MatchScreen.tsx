import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { LiquidGlassBackground } from '../components/LiquidGlassBackground';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
}

interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  followers: string;
  location: string;
  coverImage: any;
  tags: string[];
  collabGoal: string;
  jarvisInsight: string;
  connected?: boolean;
  saved?: boolean;
}

const INITIAL_CREATORS: CreatorProfile[] = [
  {
    id: 'creator_1',
    name: 'Amara Okafor',
    role: 'Travel Vlogger',
    followers: '85k Followers',
    location: 'Lagos, NG',
    coverImage: require('../../assets/images/amara-creator-cover.jpg'),
    tags: ['Lifestyle', 'Travel', '44-Day Streak', 'High Consistency'],
    collabGoal:
      'Wants to create short-form lifestyle and travel content that focuses on authentic local stories.',
    jarvisInsight:
      'Amara matches your audience style, niche and posting rhythm. This could be a strong collab fit.',
  },
  {
    id: 'creator_2',
    name: 'Tomi Adebayo',
    role: 'Tech Creator',
    followers: '156k Followers',
    location: 'London, UK',
    coverImage: require('../../assets/images/tomi-avatar.jpg'),
    tags: ['Tech', 'AI Tools', '52-Day Streak', 'Top 1% Creator'],
    collabGoal:
      'Looking to co-produce deep dives on AI creator workflows and gadget reviews.',
    jarvisInsight:
      'High overlap in productivity and workflow audience with 4.8x average engagement.',
  },
];

export const MatchScreen: React.FC<MatchScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenMessages,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [activeFilter, setActiveFilter] = useState<'niche' | 'streak' | 'nearby' | 'ai'>('niche');
  const [creatorIndex, setCreatorIndex] = useState(0);
  const [creators, setCreators] = useState<CreatorProfile[]>(INITIAL_CREATORS);
  const currentCreator = creators[creatorIndex] || creators[0];

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCollabIdeaModal, setShowCollabIdeaModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ghost floating loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -5,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(ghostFloatY, {
          toValue: 3,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [ghostFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleConnect = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCreators((prev) =>
      prev.map((c, i) => (i === creatorIndex ? { ...c, connected: true } : c))
    );
    setShowConnectModal(true);
  };

  const handlePass = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setCreatorIndex((prev) => (prev + 1) % creators.length);
    showToast('Skipped creator match.');
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCreators((prev) =>
      prev.map((c, i) => (i === creatorIndex ? { ...c, saved: !c.saved } : c))
    );
    showToast(currentCreator.saved ? 'Removed from saved creators' : '⭐ Creator saved to bookmarks!');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const recipient = selectedMatch || 'Creator';
    setShowMessageModal(false);
    setMessageText('');
    showToast(`✓ Message sent to ${recipient}!`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={styles.container}>
        {/* 1. TOP HEADER APP BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: ghostFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>
            <View>
              <Text style={styles.headerTitle}>Match Radar</Text>
              <Text style={styles.headerSubTitle}>47-Day Streak Active</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Message / Chat Bubble Button */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => showToast('💬 Match Messages')}
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

            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => setShowNotificationModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.unreadBadgeDot} />
            </Pressable>

            {/* Top-Right: User Profile Person Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              hitSlop={6}
              onPress={() => setShowProfileModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT WITH GENEROUS BREATHING ROOM */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: MATCH HEADER & BADGE */}
          <View style={styles.pageHeaderSection}>
            <View style={styles.pageBadgeRow}>
              <LinearGradient
                colors={['#784DF0', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.matchPillGradient}
              >
                <Text style={styles.matchPillText}>MATCH</Text>
              </LinearGradient>

              <View style={styles.freeDiscoveryBadge}>
                <Text style={styles.freeDiscoveryText}>Free Discovery</Text>
              </View>
            </View>

            <Text style={styles.pageHeadline}>Find creators worth building with.</Text>
            <Text style={styles.pageSubtitle}>
              Discover creators who match your niche, style and growth goals.
            </Text>

            {/* Match Allowance Strip */}
            <View style={styles.allowanceCard}>
              <View style={styles.allowanceRow}>
                <Text style={styles.allowanceItem}>⭐ 5 free matches left today</Text>
                <Text style={styles.allowanceItem}>👥 2 mutual matches</Text>
              </View>
              <View style={styles.allowanceTagsRow}>
                <View style={styles.allowanceChip}><Text style={styles.allowanceChipText}>Lifestyle</Text></View>
                <View style={styles.allowanceChip}><Text style={styles.allowanceChipText}>Nearby</Text></View>
                <View style={[styles.allowanceChip, styles.allowanceChipGold]}>
                  <Text style={styles.allowanceChipTextGold}>⚡ 47-Day Streak</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: SEGMENTED FILTER PILLS */}
          <View style={styles.filterPillsRow}>
            <Pressable
              style={[styles.filterPill, activeFilter === 'niche' && styles.filterPillActive]}
              onPress={() => setActiveFilter('niche')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'niche' && styles.filterPillTextActive]}>
                Same Niche
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterPill, activeFilter === 'streak' && styles.filterPillActive]}
              onPress={() => setActiveFilter('streak')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'streak' && styles.filterPillTextActive]}>
                Similar Streak
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterPill, activeFilter === 'nearby' && styles.filterPillActive]}
              onPress={() => setActiveFilter('nearby')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'nearby' && styles.filterPillTextActive]}>
                Nearby
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterPill, activeFilter === 'ai' && styles.filterPillActive]}
              onPress={() => setActiveFilter('ai')}
            >
              <Text style={[styles.filterPillText, activeFilter === 'ai' && styles.filterPillTextActive]}>
                AI Pick
              </Text>
            </Pressable>
          </View>

          {/* SECTION 3: HERO CREATOR MATCH CARD (AMARA OKAFOR) */}
          <Animated.View style={[{ transform: [{ scale: cardScale }] }, styles.creatorCardWrapper]}>
            <LiquidGlassBackground
              borderRadius={28}
              light={0.94}
              refraction={26}
              frost={16}
              dispersion={0.2}
              style={styles.creatorCardGlass}
            >
              {/* Creator Photo Header with Overlay */}
              <View style={styles.creatorCoverContainer}>
                <Image
                  source={currentCreator.coverImage}
                  style={styles.creatorCoverImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(23, 20, 32, 0.85)']}
                  style={styles.creatorCoverGradient}
                >
                  <View style={styles.creatorCoverInfoRow}>
                    <View style={styles.creatorCoverTextCol}>
                      <Text style={styles.creatorHeroName}>{currentCreator.name}</Text>
                      <Text style={styles.creatorHeroMeta}>
                        {currentCreator.role} • {currentCreator.followers}
                      </Text>
                    </View>
                    <View style={styles.locationPill}>
                      <Text style={styles.locationPillText}>📍 {currentCreator.location}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Creator Tags */}
              <View style={styles.creatorBodySection}>
                <View style={styles.creatorTagsRow}>
                  {currentCreator.tags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tagPill,
                        tag.includes('Streak') && styles.tagPillStreak,
                        tag.includes('High') && styles.tagPillHigh,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagPillText,
                          tag.includes('Streak') && styles.tagPillTextStreak,
                          tag.includes('High') && styles.tagPillTextHigh,
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Collab Goal */}
                <View style={styles.collabGoalBox}>
                  <Text style={styles.collabGoalLabel}>COLLAB GOAL</Text>
                  <Text style={styles.collabGoalText}>{currentCreator.collabGoal}</Text>
                </View>

                {/* Jarvis Insight Box */}
                <View style={styles.jarvisInsightBox}>
                  <Image
                    source={require('../../assets/images/jarvis-ghost-clean.png')}
                    style={styles.jarvisInsightGhost}
                    resizeMode="contain"
                  />
                  <View style={styles.jarvisInsightContent}>
                    <Text style={styles.jarvisInsightTitle}>JARVIS INSIGHT</Text>
                    <Text style={styles.jarvisInsightText}>{currentCreator.jarvisInsight}</Text>
                  </View>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.creatorActionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.passBtn, pressed && styles.btnPressed]}
                    onPress={handlePass}
                  >
                    <Text style={styles.passBtnText}>Pass</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveBtnText}>{currentCreator.saved ? 'Saved' : 'Save'}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.connectPrimaryBtn, pressed && styles.btnPressed]}
                    onPress={handleConnect}
                  >
                    <LinearGradient
                      colors={['#7048EC', '#582CDB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.connectBtnGradient}
                    >
                      <Text style={styles.connectBtnText}>
                        {currentCreator.connected ? '✓ Connected' : 'Connect'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </LiquidGlassBackground>
          </Animated.View>

          {/* SECTION 4: JARVIS SUGGESTED COLLAB CARD */}
          <View style={styles.suggestedCollabCard}>
            <View style={styles.collabHeaderRow}>
              <View style={styles.collabHeaderLeft}>
                <Image
                  source={require('../../assets/images/jarvis-ghost-clean.png')}
                  style={styles.collabGhostIcon}
                  resizeMode="contain"
                />
                <Text style={styles.collabHeaderTitle}>JARVIS SUGGESTED COLLAB</Text>
              </View>
              <View style={styles.potencyBadge}>
                <Text style={styles.potencyBadgeText}>📈 High potency</Text>
              </View>
            </View>

            <Text style={styles.collabHeadline}>‘Day in Lagos’ co-created Reel</Text>
            <View style={styles.collabMetaRow}>
              <View style={styles.collabMetaChip}><Text style={styles.collabMetaChipText}>Reel</Text></View>
              <View style={styles.collabMetaChip}><Text style={styles.collabMetaChipText}>7:30 PM Peak</Text></View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.buildIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => setShowCollabIdeaModal(true)}
            >
              <LinearGradient
                colors={['#784DF0', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buildIdeaGradient}
              >
                <Text style={styles.buildIdeaBtnText}>⚡ Build Idea</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* SECTION 5: YOUR MATCHES */}
          <View style={styles.yourMatchesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Your Matches</Text>
              <Pressable onPress={() => showToast('Viewing all 14 matches')}>
                <Text style={styles.viewAllText}>View all</Text>
              </Pressable>
            </View>

            {/* Match 1: Tomi Adebayo */}
            <View style={styles.matchItemCard}>
              <Image
                source={require('../../assets/images/tomi-avatar.jpg')}
                style={styles.matchAvatarImg}
                resizeMode="cover"
              />
              <View style={styles.matchInfoCol}>
                <Text style={styles.matchNameText}>Tomi Adebayo</Text>
                <Text style={styles.matchMetaText}>Tech • 156K followers</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.messageBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setSelectedMatch('Tomi Adebayo');
                  setShowMessageModal(true);
                }}
              >
                <Text style={styles.messageBtnText}>Message</Text>
              </Pressable>
            </View>

            {/* Match 2: Zainab Okafor */}
            <View style={styles.matchItemCard}>
              <Image
                source={require('../../assets/images/zainab-avatar.jpg')}
                style={styles.matchAvatarImg}
                resizeMode="cover"
              />
              <View style={styles.matchInfoCol}>
                <Text style={styles.matchNameText}>Zainab Okafor</Text>
                <Text style={styles.matchMetaText}>Lifestyle • 52K followers</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.messageBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setSelectedMatch('Zainab Okafor');
                  setShowMessageModal(true);
                }}
              >
                <Text style={styles.messageBtnText}>Message</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 6: CREATOR SQUADS PRO BANNER */}
          <View style={styles.squadsBannerCard}>
            <LinearGradient
              colors={['#582CDB', '#3F1AA8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.squadsGradient}
            >
              <View style={styles.squadsTitleRow}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                  <Circle cx="9" cy="7" r="4" />
                  <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <Circle cx="17" cy="11" r="3" />
                  <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </Svg>
                <Text style={styles.squadsTitleText}>Creator Squads</Text>
              </View>

              <Text style={styles.squadsDescText}>
                Collaborate at scale. Join private circles of creators in your niche to share resources, feedback, and growth hacks.
              </Text>

              <View style={styles.squadsFooterRow}>
                <Text style={styles.squadsAvailableText}>Available on Pro</Text>
                <Pressable
                  style={({ pressed }) => [styles.unlockSquadsBtn, pressed && styles.btnPressed]}
                  onPress={() => showToast('✨ Pro Squads unlocked!')}
                >
                  <LinearGradient
                    colors={['#FDE047', '#EAB308', '#CA8A04']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goldBtnGradient}
                  >
                    <Text style={styles.unlockSquadsBtnText}>Unlock Creator Squads</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* SECTION 7: JARVIS ENGINE WISDOM CARD */}
          <View style={styles.wisdomCard}>
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.wisdomGhostIcon}
              resizeMode="contain"
            />
            <View style={styles.wisdomContentCol}>
              <Text style={styles.wisdomQuote}>
                “Creators with similar niches and consistent posting habits tend to collaborate better.”
              </Text>
              <Text style={styles.wisdomAuthor}>— Jarvis Engine</Text>
            </View>
          </View>
        </ScrollView>

        {/* 3. TOAST OVERLAY */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* 4. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* 5. ANIMATED COMPLETION CELEBRATION MODAL (ON CONNECT) */}
        <AnimatedCompletionModal
          visible={showConnectModal}
          title="Connection Request Sent!"
          subtitle={`You connected with ${currentCreator.name}. +40 XP awarded to your streak!`}
          badgeText="CREATOR CONNECTED"
          xpEarned={40}
          streakCount={48}
          actionText="Continue Exploring"
          onDismiss={() => setShowConnectModal(false)}
        />

        {/* 6. BUILD COLLAB IDEA MODAL */}
        <Modal
          visible={showCollabIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCollabIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalBadgePill}>
                <Text style={styles.modalBadgeText}>COLLAB WORKSPACE</Text>
              </View>
              <Text style={styles.modalTitle}>‘Day in Lagos’ Co-created Reel</Text>
              <Text style={styles.modalSubtitle}>
                A dynamic split-screen / alternating POV short-form Reel comparing creative routines in Lagos.
              </Text>

              <View style={styles.ideaScriptBox}>
                <Text style={styles.ideaScriptHeading}>Suggested Script Blueprint:</Text>
                <Text style={styles.ideaScriptStep}>1. Hook (0-3s): “2 creators, 1 city — how we create on the go.”</Text>
                <Text style={styles.ideaScriptStep}>2. Body (4-15s): Fast cuts between your gear & Amara’s travel footage.</Text>
                <Text style={styles.ideaScriptStep}>3. CTA (16-20s): Drop top travel tips in comments.</Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCollabIdeaModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setShowCollabIdeaModal(false);
                    showToast('✓ Collab draft added to Create schedule!');
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Add to Schedule</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 7. DIRECT MESSAGE MODAL */}
        <Modal
          visible={showMessageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMessageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Message {selectedMatch || 'Creator'}</Text>
              <Text style={styles.modalSubtitle}>Start a collaborative dialogue directly.</Text>

              <TextInput
                style={styles.modalTextAreaInput}
                placeholder="Hey, loved your latest post! Let’s collaborate on a co-created Reel..."
                placeholderTextColor="#A39CB5"
                value={messageText}
                onChangeText={setMessageText}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowMessageModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={handleSendMessage}
                >
                  <Text style={styles.modalPrimaryBtnText}>Send Message</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 8. NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Match Radar Alerts</Text>
              <Text style={styles.modalSubtitle}>Live creator recommendations</Text>

              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>✨ 2 Mutual Match Sparks</Text>
                <Text style={styles.notifBody}>
                  Amara Okafor and Tomi Adebayo are active in your creative circle today.
                </Text>
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 10 }]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* 9. PROFILE MODAL */}
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={{ width: 64, height: 64, marginBottom: 8 }}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Creator Profile</Text>
              <Text style={styles.modalSubtitle}>47-Day Streak • Free Plan</Text>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 12 }]}
                onPress={() => {
                  setShowProfileModal(false);
                  if (onLogout) onLogout();
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Log Out</Text>
              </Pressable>

              <Pressable
                style={[styles.modalCancelBtn, { width: '100%', marginTop: 8 }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
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
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  // 1. TOP HEADER APP BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
  },
  headerGhostLogo: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // 2. MAIN SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
  },

  // PAGE HEADER SECTION
  pageHeaderSection: {
    marginBottom: 16,
  },
  pageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchPillGradient: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  matchPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  freeDiscoveryBadge: {
    backgroundColor: 'rgba(240, 236, 250, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.7)',
  },
  freeDiscoveryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  pageHeadline: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7F7894',
    lineHeight: 18,
    marginBottom: 14,
  },

  // Match Allowance Strip
  allowanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  allowanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  allowanceItem: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  allowanceTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  allowanceChip: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  allowanceChipGold: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  allowanceChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  allowanceChipTextGold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // SECTION 2: FILTER PILLS
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  filterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F7894',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // SECTION 3: HERO CREATOR CARD
  creatorCardWrapper: {
    marginBottom: 20,
  },
  creatorCardGlass: {
    overflow: 'hidden',
  },
  creatorCoverContainer: {
    height: 190,
    position: 'relative',
    backgroundColor: '#EDE8FC',
  },
  creatorCoverImage: {
    width: '100%',
    height: '100%',
  },
  creatorCoverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    justifyContent: 'flex-end',
    padding: 16,
  },
  creatorCoverInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  creatorCoverTextCol: {
    flex: 1,
  },
  creatorHeroName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  creatorHeroMeta: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  locationPill: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.9)',
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },

  creatorBodySection: {
    padding: 16,
  },
  creatorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  tagPillStreak: {
    backgroundColor: '#EDE8FC',
    borderColor: '#DDD6FE',
  },
  tagPillHigh: {
    backgroundColor: '#F5F3FF',
    borderColor: '#E0E7FF',
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  tagPillTextStreak: {
    color: '#582CDB',
    fontWeight: '800',
  },
  tagPillTextHigh: {
    color: '#4338CA',
  },

  collabGoalBox: {
    marginBottom: 14,
  },
  collabGoalLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  collabGoalText: {
    fontSize: 13,
    color: '#171420',
    lineHeight: 18,
    fontWeight: '500',
  },

  jarvisInsightBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245, 243, 255, 0.85)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.7)',
    marginBottom: 16,
  },
  jarvisInsightGhost: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  jarvisInsightContent: {
    flex: 1,
  },
  jarvisInsightTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  jarvisInsightText: {
    fontSize: 12,
    color: '#4B4360',
    lineHeight: 16,
    fontWeight: '500',
  },

  creatorActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  passBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E5E1F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  passBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7F7894',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  connectPrimaryBtn: {
    flex: 2,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  connectBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // SECTION 4: JARVIS SUGGESTED COLLAB CARD
  suggestedCollabCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 20,
  },
  collabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collabHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collabGhostIcon: {
    width: 16,
    height: 16,
  },
  collabHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
  },
  potencyBadge: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  potencyBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  collabHeadline: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  collabMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  collabMetaChip: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  collabMetaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  buildIdeaBtn: {
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buildIdeaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildIdeaBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // SECTION 5: YOUR MATCHES
  yourMatchesSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  matchItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 10,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  matchAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  matchInfoCol: {
    flex: 1,
  },
  matchNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  matchMetaText: {
    fontSize: 11.5,
    color: '#7F7894',
    fontWeight: '500',
  },
  messageBtn: {
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // SECTION 6: CREATOR SQUADS PRO
  squadsBannerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  squadsGradient: {
    padding: 20,
  },
  squadsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  squadsTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  squadsDescText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  squadsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadsAvailableText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  unlockSquadsBtn: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  goldBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unlockSquadsBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },

  // SECTION 7: JARVIS ENGINE WISDOM
  wisdomCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    alignItems: 'center',
  },
  wisdomGhostIcon: {
    width: 28,
    height: 28,
  },
  wisdomContentCol: {
    flex: 1,
  },
  wisdomQuote: {
    fontSize: 11.5,
    color: '#4B4360',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 3,
  },
  wisdomAuthor: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalBadgePill: {
    backgroundColor: '#EDE8FC',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 8,
  },
  modalBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  ideaScriptBox: {
    width: '100%',
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 16,
  },
  ideaScriptHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 6,
  },
  ideaScriptStep: {
    fontSize: 11.5,
    color: '#171420',
    lineHeight: 16,
    marginBottom: 4,
  },
  modalTextAreaInput: {
    width: '100%',
    height: 76,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#171420',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E5E1F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F7894',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 20, 32, 0.92)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
