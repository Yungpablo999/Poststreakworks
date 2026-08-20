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
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProSquadScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onOpenCreate?: () => void;
  onOpenMatch?: () => void;
  onOpenCollabIdea?: (partnerData: { name: string; handle: string; niche: string; avatar: any; planIndex?: number; title?: string }) => void;
  onOpenMessages?: (threadId?: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface SquadMember {
  id: string;
  name: string;
  role: string;
  avatar: any;
  streak: number;
  isHost?: boolean;
  isPro?: boolean;
}

interface OpenCollab {
  id: string;
  category: string;
  categoryType: 'visual' | 'knowledge' | 'routine';
  slotText: string;
  title: string;
  description: string;
  partnerName: string;
  partnerHandle: string;
  partnerAvatar: any;
  joined?: boolean;
}

interface SquadChatMessage {
  id: string;
  senderName: string;
  senderAvatar: any;
  text: string;
  time: string;
  isUser: boolean;
}

const INITIAL_MEMBERS: SquadMember[] = [
  {
    id: 'user',
    name: 'You',
    role: 'Action Strategist',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 47,
    isHost: true,
    isPro: true,
  },
  {
    id: 'amara',
    name: 'Amara Okafor',
    role: 'Visual Designer',
    avatar: require('../../assets/images/amara-avatar.jpg'),
    streak: 31,
    isPro: true,
  },
  {
    id: 'tomi',
    name: 'Tomi Adebayo',
    role: 'Video Specialist',
    avatar: require('../../assets/images/tomi-avatar.jpg'),
    streak: 14,
    isPro: true,
  },
];

const INITIAL_OPEN_COLLABS: OpenCollab[] = [
  {
    id: 'collab_1',
    category: 'Visual Collab',
    categoryType: 'visual',
    slotText: '1/2 Slot',
    title: '24 Hours Creating in Lagos',
    description: 'A montage-style short form highlighting local vibes and creator workflow.',
    partnerName: 'Amara Okafor',
    partnerHandle: '@amara.creates',
    partnerAvatar: require('../../assets/images/amara-avatar.jpg'),
  },
  {
    id: 'collab_2',
    category: 'Knowledge',
    categoryType: 'knowledge',
    slotText: '2/3 Slot',
    title: 'Creator Tech Stacks 2026',
    description: 'Sharing top 3 productivity tools with cross-pollinated hooks and b-roll.',
    partnerName: 'Tomi Adebayo',
    partnerHandle: '@tomi_tech',
    partnerAvatar: require('../../assets/images/tomi-avatar.jpg'),
  },
  {
    id: 'collab_3',
    category: 'Dual Routine',
    categoryType: 'routine',
    slotText: '1/2 Slot',
    title: 'Morning Creator Sprint Challenge',
    description: 'Comparing 5 AM vs 9 AM creator routines with live split-screen hooks.',
    partnerName: 'Elena Rostova',
    partnerHandle: '@elena_fit',
    partnerAvatar: require('../../assets/images/elena-avatar.jpg'),
  },
];

const INITIAL_SQUAD_CHAT: SquadChatMessage[] = [
  {
    id: 'msg_1',
    senderName: 'Tomi Adebayo',
    senderAvatar: require('../../assets/images/tomi-avatar.jpg'),
    text: "Just uploaded the base edit for the Lagos collab. Who's in next? 🚀",
    time: '11:15 AM',
    isUser: false,
  },
  {
    id: 'msg_2',
    senderName: 'Amara Okafor',
    senderAvatar: require('../../assets/images/amara-avatar.jpg'),
    text: "I'll handle the color grading tonight. Overlaying the brand fonts too.",
    time: '11:22 AM',
    isUser: false,
  },
  {
    id: 'msg_3',
    senderName: 'You',
    senderAvatar: require('../../assets/images/elena-avatar.jpg'),
    text: "Looks great team. I'm finishing the caption strategy. ⚡",
    time: '11:28 AM',
    isUser: true,
  },
];

export const ProSquadScreen: React.FC<ProSquadScreenProps> = ({
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenPostComposer,
  onOpenCreate,
  onOpenMatch,
  onOpenCollabIdea,
  onOpenMessages,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [members, setMembers] = useState<SquadMember[]>(INITIAL_MEMBERS);
  const [openCollabs, setOpenCollabs] = useState<OpenCollab[]>(INITIAL_OPEN_COLLABS);
  const [chatMessages, setChatMessages] = useState<SquadChatMessage[]>(INITIAL_SQUAD_CHAT);
  const [chatInputText, setChatInputText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // 3D Ghost Celebration Modal State
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    xpEarned: number;
    speechBubble: string;
    actionText?: string;
    onAction?: () => void;
  }>({
    title: 'Squad Quest Activated!',
    subtitle: 'Momentum Makers launched a new weekly sprint.',
    badgeText: '🛡️ SQUAD QUEST ACTIVE (+150 XP)',
    xpEarned: 150,
    speechBubble: 'Squad momentum is surging! Post together this week to unlock the +220 XP bounty! 🔥',
    actionText: 'Open Squad Chat 💬',
  });

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleSendMessage = () => {
    if (!chatInputText.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newMsg: SquadChatMessage = {
      id: `msg_${Date.now()}`,
      senderName: 'You',
      senderAvatar: require('../../assets/images/elena-avatar.jpg'),
      text: chatInputText.trim(),
      time: 'Just now',
      isUser: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInputText('');
    showToast('Sent message to Momentum Makers 💬');
  };

  const handleJoinCollab = (collab: OpenCollab) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setOpenCollabs((prev) =>
      prev.map((c) => (c.id === collab.id ? { ...c, joined: true, slotText: 'Full (2/2)' } : c))
    );
    setCelebrationData({
      title: 'Collab Slot Claimed!',
      subtitle: `You joined "${collab.title}" with ${collab.partnerName}.`,
      badgeText: '🤝 COLLAB TEAM FORMED (+100 XP)',
      xpEarned: 100,
      speechBubble: `You and ${collab.partnerName.split(' ')[0]} are paired up! Tap below to start co-scripting your concept. 🔥`,
      actionText: 'Build Storyboard 🎬',
      onAction: () => {
        setShowCelebrationModal(false);
        if (onOpenCollabIdea) {
          onOpenCollabIdea({
            name: collab.partnerName,
            handle: collab.partnerHandle,
            niche: 'Squad Partner',
            avatar: collab.partnerAvatar,
            planIndex: 0,
            title: collab.title,
          });
        }
      },
    });
    setShowCelebrationModal(true);
  };

  const handleStartSquadQuest = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationData({
      title: 'Squad Quest Activated!',
      subtitle: 'Momentum Makers launched a 5-day collaborative sprint.',
      badgeText: '🚀 SQUAD SPRINT ACTIVE (+150 XP)',
      xpEarned: 150,
      speechBubble: 'Epic! Everyone in Momentum Makers receives the quest notification. Ready to crush the challenge, Pablo! 🔥',
      actionText: 'Open Squad Chat 💬',
      onAction: () => {
        setShowCelebrationModal(false);
        if (onOpenMessages) {
          onOpenMessages('conv_squad');
        }
      },
    });
    setShowCelebrationModal(true);
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* TOP HEADER BAR                                               */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              style={({ pressed }) => [styles.backCircleBtn, pressed && styles.btnPressed]}
              onPress={onBack}
              hitSlop={8}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>

            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerMascot}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Right Action Icons */}
          <View style={styles.headerRightActions}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              onPress={() => onOpenMessages && onOpenMessages('conv_squad')}
              hitSlop={6}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.unreadDot} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              onPress={() => showToast('🔔 Squad alerts: Weekly challenge 73% complete')}
              hitSlop={6}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.unreadDot} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.profileAvatarBtn, pressed && styles.btnPressed]}
              onPress={() => setShowProfileModal(true)}
              hitSlop={6}
            >
              <Image
                source={require('../../assets/images/elena-avatar.jpg')}
                style={styles.profileAvatarImg}
              />
              <View style={styles.avatarGoldBorderRing} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================================ */}
          {/* 1. HERO SQUAD OVERVIEW CARD                                  */}
          {/* ============================================================ */}
          <View style={styles.squadHeroCard}>
            <View style={styles.squadHeroHeaderRow}>
              <Text style={styles.squadHeroTitle}>Momentum Makers</Text>
              <View style={styles.proSquadPill}>
                <Text style={styles.proSquadPillText}>PRO SQUAD</Text>
              </View>
            </View>

            <Text style={styles.squadHeroDescription}>
              A Pro squad for creators building consistent short-form growth through weekly collabs, challenges and shared momentum.
            </Text>

            {/* Status Tags Row */}
            <View style={styles.statusTagsRow}>
              <View style={styles.openWeekPill}>
                <Text style={styles.openWeekPillText}>Open This Week</Text>
              </View>
              <View style={styles.highActivityPill}>
                <Text style={styles.highActivityPillText}>High Activity</Text>
              </View>
            </View>

            {/* 3-Column Metrics Container */}
            <View style={styles.metricsBox}>
              {/* Members Stack */}
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Members</Text>
                <View style={styles.avatarStackRow}>
                  <Image source={require('../../assets/images/elena-avatar.jpg')} style={[styles.miniAvatar, { zIndex: 4 }]} />
                  <Image source={require('../../assets/images/amara-avatar.jpg')} style={[styles.miniAvatar, { marginLeft: -8, zIndex: 3 }]} />
                  <Image source={require('../../assets/images/tomi-avatar.jpg')} style={[styles.miniAvatar, { marginLeft: -8, zIndex: 2 }]} />
                  <View style={[styles.miniAvatarPlus, { marginLeft: -8, zIndex: 1 }]}>
                    <Text style={styles.miniAvatarPlusText}>+2</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricDivider} />

              {/* Squad Streak */}
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Squad Streak</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 15 }}>🔥</Text>
                  <Text style={styles.metricValBold}>12d</Text>
                </View>
              </View>

              <View style={styles.metricDivider} />

              {/* Active Collabs */}
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Active Collabs</Text>
                <Text style={styles.metricValBold}>3</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 2. JARVIS SQUAD STRATEGY CARD                                */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#F5EFFF', '#FAF5FF', '#FFFFFF']}
            style={styles.jarvisStrategyCard}
          >
            <View style={styles.jarvisAccentLeftBar} />
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={styles.jarvisIconCircle}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.jarvisStrategyTitle}>Jarvis Squad Strategy</Text>
                <Text style={styles.jarvisStrategyBody}>
                  &ldquo;Momentum Makers is strong, but engagement dips after posting. Start with one lightweight collab today.&rdquo;
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ============================================================ */}
          {/* 3. WEEKLY CHALLENGE CARD                                     */}
          {/* ============================================================ */}
          <View style={styles.weeklyChallengeCard}>
            <View style={styles.weeklyChallengeHeaderRow}>
              <View>
                <Text style={styles.weeklyChallengeTitle}>Weekly Challenge</Text>
                <Text style={styles.weeklyChallengeDeadline}>Deadline: Sun 9:00 PM</Text>
              </View>
              <View style={styles.xpBountyBadge}>
                <Text style={styles.xpBountyBadgeText}>+220 XP</Text>
              </View>
            </View>

            {/* Personal Progress */}
            <View style={{ marginTop: 14 }}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressTypeLabel}>Personal</Text>
                <Text style={styles.progressValuePurple}>2/3</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillPurple, { width: '66%' }]} />
              </View>
            </View>

            {/* Squad Progress */}
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressTypeLabel}>Squad</Text>
                <Text style={styles.progressValueGold}>11/15</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillGold, { width: '73%' }]} />
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 4. SQUAD MEMBERS SECTION                                     */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Squad Members</Text>
              <Pressable
                onPress={() => setShowManageModal(true)}
                hitSlop={8}
              >
                <Text style={styles.sectionActionLink}>Manage Squad</Text>
              </Pressable>
            </View>

            <View style={{ gap: 8, marginTop: 10 }}>
              {members.map((member) => {
                const threadId =
                  member.id === 'amara'
                    ? 'conv_amara'
                    : member.id === 'tomi'
                    ? 'conv_tomi'
                    : `conv_${member.id}`;

                return (
                  <View key={member.id} style={styles.memberRowCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={styles.memberAvatarContainer}>
                        <Image source={member.avatar} style={styles.memberAvatar} />
                        {member.isHost && (
                          <View style={styles.hostVerifiedDot}>
                            <Text style={{ fontSize: 8 }}>👑</Text>
                          </View>
                        )}
                      </View>

                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          {member.isHost && (
                            <View style={styles.hostPill}>
                              <Text style={styles.hostPillText}>HOST</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberRole}>{member.role}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.memberStreakPill}>
                        <Text style={{ fontSize: 13 }}>🔥</Text>
                        <Text style={styles.memberStreakText}>{member.streak}</Text>
                      </View>

                      {member.id !== 'user' && (
                        <Pressable
                          style={({ pressed }) => [styles.memberChatIconBtn, pressed && styles.btnPressed]}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            if (onOpenMessages) {
                              onOpenMessages(threadId);
                            }
                          }}
                          hitSlop={6}
                        >
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                              stroke="#582CDB"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ============================================================ */}
          {/* 5. OPEN COLLABS SECTION (CAROUSEL)                           */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Open Collabs</Text>
              <Pressable
                style={styles.addCollabPlusBtn}
                onPress={() => {
                  if (onOpenCollabIdea) {
                    onOpenCollabIdea({
                      name: 'Momentum Squad',
                      handle: '@momentum.squad',
                      niche: 'Squad Collab',
                      avatar: require('../../assets/images/elena-avatar.jpg'),
                      planIndex: 0,
                      title: 'Squad Co-Creation Reel',
                    });
                  }
                }}
                hitSlop={8}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" />
                </Svg>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
            >
              {openCollabs.map((collab) => {
                const isVisual = collab.categoryType === 'visual';
                const isKnowledge = collab.categoryType === 'knowledge';
                return (
                  <View key={collab.id} style={styles.collabCard}>
                    <View style={styles.collabCardTopRow}>
                      <View
                        style={[
                          styles.collabCategoryPill,
                          isVisual && styles.collabCategoryVisual,
                          isKnowledge && styles.collabCategoryKnowledge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.collabCategoryText,
                            isVisual && styles.collabCategoryTextVisual,
                            isKnowledge && styles.collabCategoryTextKnowledge,
                          ]}
                        >
                          {collab.category}
                        </Text>
                      </View>
                      <Text style={styles.collabSlotText}>{collab.slotText}</Text>
                    </View>

                    <Text style={styles.collabCardTitle}>{collab.title}</Text>
                    <Text style={styles.collabCardDesc} numberOfLines={2}>
                      {collab.description}
                    </Text>

                    <View style={styles.collabCardFooterRow}>
                      <Pressable
                        style={styles.collabPlanOutlineBtn}
                        onPress={() => {
                          if (onOpenCollabIdea) {
                            onOpenCollabIdea({
                              name: collab.partnerName,
                              handle: collab.partnerHandle,
                              niche: 'Squad Partner',
                              avatar: collab.partnerAvatar,
                              planIndex: 0,
                              title: collab.title,
                            });
                          }
                        }}
                      >
                        <Text style={styles.collabPlanOutlineBtnText}>Plan</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.collabJoinBtn, collab.joined && styles.collabJoinedBtn]}
                        onPress={() => handleJoinCollab(collab)}
                        disabled={collab.joined}
                      >
                        <Text style={styles.collabJoinBtnText}>
                          {collab.joined ? 'Joined ✓' : 'Join'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* 6. SQUAD CHAT SECTION (PREMIUM REDESIGN)                     */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>Squad Live Chat</Text>
                <View style={styles.liveOnlinePill}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.liveOnlinePillText}>3 Online</Text>
                </View>
              </View>

              <Pressable
                onPress={() => onOpenMessages && onOpenMessages('conv_squad')}
                hitSlop={8}
                style={styles.viewAllChatBtn}
              >
                <Text style={styles.sectionActionLink}>Full Channel ➔</Text>
              </Pressable>
            </View>

            <View style={styles.squadChatContainer}>
              {/* Squad Channel Header Ribbon */}
              <View style={styles.chatChannelRibbon}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>🛡️</Text>
                  <Text style={styles.chatChannelName}>#momentum-creators</Text>
                </View>
                <Text style={styles.chatChannelTopic}>⚡ 78-Day Streak Active</Text>
              </View>

              {/* Quick AI & Squad Action Prompts */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPromptScroll}
              >
                <Pressable
                  style={styles.quickPromptChip}
                  onPress={() => setChatInputText('Just scheduled my 7:30 PM Reel! Momentum high today team! 🔥')}
                >
                  <Text style={styles.quickPromptChipText}>🔥 Post Milestone</Text>
                </Pressable>
                <Pressable
                  style={styles.quickPromptChip}
                  onPress={() => setChatInputText('Who wants to film a 30s split-screen duet on creator tech stacks? 🎥')}
                >
                  <Text style={styles.quickPromptChipText}>🎬 Pitch Collab</Text>
                </Pressable>
                <Pressable
                  style={styles.quickPromptChip}
                  onPress={() => setChatInputText('Drafting the 3-second hook format from Jarvis. Reviewing now! 📄')}
                >
                  <Text style={styles.quickPromptChipText}>📄 Share Draft</Text>
                </Pressable>
              </ScrollView>

              {/* Message Feed */}
              <View style={{ gap: 12, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 }}>
                {chatMessages.map((msg) => {
                  if (msg.isUser) {
                    return (
                      <View key={msg.id} style={styles.chatRowRight}>
                        <View style={{ alignItems: 'flex-end', flex: 1, maxWidth: '84%' }}>
                          <LinearGradient
                            colors={['#784DF0', '#582CDB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.chatBubbleRight}
                          >
                            <Text style={styles.chatBubbleRightText}>{msg.text}</Text>
                          </LinearGradient>
                          <Text style={styles.chatTimeRight}>{msg.time} • ✓✓ Sent</Text>
                        </View>
                        <View style={styles.chatUserAvatarWrapper}>
                          <Image source={msg.senderAvatar} style={styles.chatMiniAvatar} />
                          <View style={styles.chatAvatarGoldRing} />
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View key={msg.id} style={styles.chatRowLeft}>
                      <Image source={msg.senderAvatar} style={styles.chatMiniAvatar} />
                      <View style={{ flex: 1, maxWidth: '84%' }}>
                        <View style={styles.chatBubbleLeft}>
                          <View style={styles.chatAuthorHeaderRow}>
                            <Text style={styles.chatAuthorName}>{msg.senderName}</Text>
                            <Text style={styles.chatAuthorRole}>
                              {msg.senderName.includes('Tomi') ? 'Video Specialist' : 'Visual Designer'}
                            </Text>
                            <Text style={styles.chatTimeLeft}>{msg.time}</Text>
                          </View>
                          <Text style={styles.chatBubbleLeftText}>{msg.text}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Ergonomic Input Capsule */}
              <View style={styles.chatInputBar}>
                <Pressable
                  style={styles.chatAttachBtn}
                  onPress={() => showToast('📎 Attach script, audio note, or video draft')}
                  hitSlop={6}
                >
                  <Text style={styles.chatAttachBtnText}>+</Text>
                </Pressable>

                <TextInput
                  style={styles.chatTextInput}
                  placeholder="Message Momentum Makers..."
                  placeholderTextColor="#94A3B8"
                  value={chatInputText}
                  onChangeText={setChatInputText}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.chatSendBtn,
                    chatInputText.trim().length > 0 && styles.chatSendBtnActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleSendMessage}
                >
                  <LinearGradient
                    colors={
                      chatInputText.trim().length > 0
                        ? ['#784DF0', '#582CDB']
                        : ['#E2E8F0', '#CBD5E1']
                    }
                    style={styles.chatSendGradient}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                        stroke="#FFFFFF"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 7. BOTTOM ACTION BUTTON                                      */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22, marginBottom: 120 }}>
            <Pressable
              style={({ pressed }) => [styles.startQuestBtnContainer, pressed && styles.btnPressed]}
              onPress={handleStartSquadQuest}
            >
              <LinearGradient
                colors={['#784DF0', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startQuestGradient}
              >
                <Text style={styles.startQuestBtnText}>🚀 Start Squad Quest</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>

        {/* FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* MANAGE SQUAD MODAL */}
        <Modal
          visible={showManageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowManageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.manageModalCard}>
              <View style={styles.manageModalHeader}>
                <Text style={styles.manageModalTitle}>Manage Momentum Makers</Text>
                <Pressable onPress={() => setShowManageModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.manageModalSub}>
                You are the Squad Host. Invite creators, schedule live sprints, and set weekly XP targets.
              </Text>

              <View style={{ gap: 8, marginVertical: 14 }}>
                <Pressable
                  style={styles.manageOptionRow}
                  onPress={() => {
                    setShowManageModal(false);
                    showToast('🔗 Invite link copied to clipboard!');
                  }}
                >
                  <Text style={styles.manageOptionText}>🔗 Copy Squad Invite Link</Text>
                </Pressable>
                <Pressable
                  style={styles.manageOptionRow}
                  onPress={() => {
                    setShowManageModal(false);
                    showToast('🎯 Weekly goal updated to 7 posts!');
                  }}
                >
                  <Text style={styles.manageOptionText}>🎯 Adjust Weekly Goal Targets</Text>
                </Pressable>
                <Pressable
                  style={styles.manageOptionRow}
                  onPress={() => {
                    setShowManageModal(false);
                    if (onOpenMessages) onOpenMessages('conv_squad');
                  }}
                >
                  <Text style={styles.manageOptionText}>💬 Open Squad Channel</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.manageDoneBtn}
                onPress={() => setShowManageModal(false)}
              >
                <Text style={styles.manageDoneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* 3D GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationData.title}
          subtitle={celebrationData.subtitle}
          badgeText={celebrationData.badgeText}
          xpEarned={celebrationData.xpEarned}
          speechBubble={celebrationData.speechBubble}
          actionText={celebrationData.actionText || 'Continue'}
          onAction={celebrationData.onAction}
          onDismiss={() => setShowCelebrationModal(false)}
        />

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

        {/* TOAST */}
        <BrandToast message={toastMessage} />
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },

  /* HEADER */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerMascot: {
    width: 28,
    height: 28,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  profileAvatarBtn: {
    position: 'relative',
  },
  profileAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarGoldBorderRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },

  /* HERO SQUAD CARD */
  squadHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  squadHeroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  squadHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  proSquadPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proSquadPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  squadHeroDescription: {
    fontSize: 13,
    lineHeight: 18.5,
    color: '#475569',
    marginBottom: 12,
  },
  statusTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  openWeekPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  openWeekPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  highActivityPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  highActivityPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  metricValBold: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  miniAvatarPlus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarPlusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },

  /* JARVIS STRATEGY CARD */
  jarvisStrategyCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  jarvisAccentLeftBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: '#582CDB',
  },
  jarvisIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarvisStrategyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#582CDB',
    marginBottom: 4,
  },
  jarvisStrategyBody: {
    fontSize: 12.5,
    lineHeight: 17.5,
    color: '#334155',
    fontStyle: 'italic',
  },

  /* WEEKLY CHALLENGE CARD */
  weeklyChallengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  weeklyChallengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weeklyChallengeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  weeklyChallengeDeadline: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  xpBountyBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xpBountyBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  progressValuePurple: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  progressValueGold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFillPurple: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#582CDB',
  },
  progressFillGold: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },

  /* SQUAD MEMBERS */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },
  sectionActionLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  memberRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  hostVerifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  hostPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
  },
  memberRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  memberStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberStreakText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },
  memberChatIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  /* OPEN COLLABS */
  addCollabPlusBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collabCard: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  collabCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collabCategoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#EDE9FE',
  },
  collabCategoryVisual: {
    backgroundColor: '#EDE9FE',
  },
  collabCategoryKnowledge: {
    backgroundColor: '#FEF3C7',
  },
  collabCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  collabCategoryTextVisual: {
    color: '#6D28D9',
  },
  collabCategoryTextKnowledge: {
    color: '#B45309',
  },
  collabSlotText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  collabCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
    lineHeight: 18,
  },
  collabCardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  collabCardFooterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  collabPlanOutlineBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  collabPlanOutlineBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  collabJoinBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  collabJoinedBtn: {
    backgroundColor: '#059669',
  },
  collabJoinBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* SQUAD CHAT PREVIEW (PREMIUM STYLING) */
  liveOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulsingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveOnlinePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  viewAllChatBtn: {
    paddingVertical: 2,
  },
  squadChatContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  chatChannelRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chatChannelName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  chatChannelTopic: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  quickPromptScroll: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  quickPromptChip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quickPromptChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  chatRowLeft: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  chatRowRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    maxWidth: '100%',
  },
  chatMiniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  chatUserAvatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  chatAvatarGoldRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: '#F59E0B',
  },
  chatBubbleLeft: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  chatAuthorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chatAuthorName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  chatAuthorRole: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  chatTimeLeft: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  chatBubbleLeftText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#1E293B',
  },
  chatBubbleRight: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  chatBubbleRightText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  chatTimeRight: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 3,
    marginRight: 4,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatAttachBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chatAttachBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#582CDB',
    lineHeight: 18,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#171420',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chatSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  chatSendBtnActive: {
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  chatSendGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* START QUEST BUTTON */
  startQuestBtnContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  startQuestGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startQuestBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* MANAGE MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manageModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  manageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
    padding: 4,
  },
  manageModalSub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
  },
  manageOptionRow: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  manageOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  manageDoneBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  manageDoneBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
