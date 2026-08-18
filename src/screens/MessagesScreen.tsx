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

interface MessagesScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
}

interface CreatorStory {
  id: string;
  name: string;
  avatar: any;
  streak: number;
  isOnline: boolean;
  statusText: string;
  isUser?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isUser: boolean;
  sharedScriptTitle?: string;
}

interface ConversationThread {
  id: string;
  creatorId: string;
  name: string;
  handle: string;
  niche: string;
  avatar: any;
  streak: number;
  isOnline: boolean;
  lastMessage: string;
  time: string;
  unread: boolean;
  category: 'buddies' | 'collabs' | 'jarvis';
  collabBadge?: string;
  messages: ChatMessage[];
}

const CREATOR_STORIES: CreatorStory[] = [
  {
    id: 'user',
    name: 'You',
    avatar: require('../../assets/images/amara-avatar.jpg'),
    streak: 47,
    isOnline: true,
    statusText: 'Filming Reel 🎬',
    isUser: true,
  },
  {
    id: 'c1',
    name: 'Elena R.',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 52,
    isOnline: true,
    statusText: 'Editing week 3 batch',
  },
  {
    id: 'c2',
    name: 'Marcus C.',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 38,
    isOnline: true,
    statusText: 'Writing 5 hooks',
  },
  {
    id: 'c3',
    name: 'Sophia T.',
    avatar: require('../../assets/images/zainab-avatar.jpg'),
    streak: 41,
    isOnline: false,
    statusText: 'Studio day!',
  },
  {
    id: 'c4',
    name: 'David K.',
    avatar: require('../../assets/images/david-avatar.jpg'),
    streak: 29,
    isOnline: true,
    statusText: 'Posted today! ⚡',
  },
];

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 't1',
    creatorId: 'c1',
    name: 'Elena Rostova',
    handle: '@elenacreates',
    niche: 'Tech & Productivity',
    avatar: require('../../assets/images/elena-avatar.jpg'),
    streak: 52,
    isOnline: true,
    lastMessage: 'Loved your lesson on batch filming! Are you free for the duo challenge tomorrow?',
    time: '2m ago',
    unread: true,
    category: 'buddies',
    collabBadge: '⚡ 14-Day Pact (Day 8/14)',
    messages: [
      {
        id: 'm1',
        senderId: 'c1',
        text: 'Hey Amara! Just saw your 47-day streak update on the leaderboard, huge congrats!',
        time: '10:14 AM',
        isUser: false,
      },
      {
        id: 'm2',
        senderId: 'user',
        text: 'Thank you Elena! Your tips on hook pacing really helped my retention on TikTok this week.',
        time: '10:16 AM',
        isUser: true,
      },
      {
        id: 'm3',
        senderId: 'c1',
        text: 'Loved your lesson on batch filming! Are you free for the duo challenge tomorrow?',
        time: '10:18 AM',
        isUser: false,
        sharedScriptTitle: 'One thing I wish I knew before I started creating',
      },
    ],
  },
  {
    id: 't2',
    creatorId: 'c2',
    name: 'Marcus Chen',
    handle: '@marcustech',
    niche: 'AI & Workflow',
    avatar: require('../../assets/images/marcus-avatar.jpg'),
    streak: 38,
    isOnline: true,
    lastMessage: 'Sent you my caption hook draft. Let me know what you think!',
    time: '18m ago',
    unread: true,
    category: 'collabs',
    collabBadge: '📑 Shared Script Draft',
    messages: [
      {
        id: 'm2_1',
        senderId: 'user',
        text: 'Marcus, how do you structure your 30s talking head scripts?',
        time: '9:30 AM',
        isUser: true,
      },
      {
        id: 'm2_2',
        senderId: 'c2',
        text: 'Sent you my caption hook draft. Let me know what you think!',
        time: '9:45 AM',
        isUser: false,
        sharedScriptTitle: '3 creator habits that made posting easier',
      },
    ],
  },
  {
    id: 't3',
    creatorId: 'c3',
    name: 'Sophia Taylor',
    handle: '@sophiastyle',
    niche: 'Lifestyle & Content',
    avatar: require('../../assets/images/zainab-avatar.jpg'),
    streak: 41,
    isOnline: false,
    lastMessage: 'Just scheduled my post for the 7:30 PM peak window! 🚀',
    time: '1h ago',
    unread: false,
    category: 'buddies',
    collabBadge: '🎯 Peak Slot Scheduled',
    messages: [
      {
        id: 'm3_1',
        senderId: 'c3',
        text: 'Just scheduled my post for the 7:30 PM peak window! 🚀',
        time: '8:45 AM',
        isUser: false,
      },
    ],
  },
  {
    id: 't4',
    creatorId: 'jarvis',
    name: 'Jarvis Creative Assistant',
    handle: '@jarvis.ai',
    niche: 'AI Co-Pilot',
    avatar: require('../../assets/images/jarvis-ghost-clean.png'),
    streak: 100,
    isOnline: true,
    lastMessage: 'Streak Alert: 1 post needed today to protect your 47-day streak and earn +50 XP.',
    time: '3h ago',
    unread: false,
    category: 'jarvis',
    collabBadge: '🤖 Streak Guardian',
    messages: [
      {
        id: 'm4_1',
        senderId: 'jarvis',
        text: 'Streak Alert: 1 post needed today to protect your 47-day streak and earn +50 XP.',
        time: '7:00 AM',
        isUser: false,
      },
    ],
  },
];

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenPostComposer,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'buddies' | 'collabs' | 'jarvis'>('all');
  const [threads, setThreads] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);

  // Active Chat Room State
  const [activeChatThread, setActiveChatThread] = useState<ConversationThread | null>(null);
  const [inputMessage, setInputMessage] = useState('');

  // Discover Creators Modal
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);

  // Celebrations & Feedback
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Message Sent!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your streak partner received your message & script.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Creator connection strengthened! +15 XP.');
  const [celebrationBadge, setCelebrationBadge] = useState('COLLAB ACTIVE');

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const chatScrollRef = useRef<ScrollView>(null);

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

  const handleOpenChat = (thread: ConversationThread) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Mark as read
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t))
    );
    setActiveChatThread({ ...thread, unread: false });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChatThread) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'user',
      text: inputMessage.trim(),
      time: 'Just now',
      isUser: true,
    };

    const updatedMessages = [...activeChatThread.messages, newMessage];
    const updatedThread = {
      ...activeChatThread,
      lastMessage: newMessage.text,
      time: 'Just now',
      messages: updatedMessages,
    };

    setActiveChatThread(updatedThread);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeChatThread.id ? updatedThread : t))
    );
    setInputMessage('');

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendHighFive = (creatorName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationTitle('⚡ Streak Boost Sent!');
    setCelebrationSubtitle(`You sent +10 Streak Energy to ${creatorName}!`);
    setCelebrationSpeech('Accountability partner energized! Keep supporting each other.');
    setCelebrationBadge('ENERGY BOOST');
    setShowCelebrationModal(true);
  };

  const filteredThreads = threads.filter((thread) => {
    const matchesCategory =
      selectedCategory === 'all' || thread.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalUnreadCount = threads.filter((t) => t.unread).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP AIRY HEADER BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (activeChatThread) {
                  setActiveChatThread(null);
                } else {
                  onBack();
                }
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

          {/* Center Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleText}>
              {activeChatThread ? activeChatThread.name : 'Creator Messages'}
            </Text>
            <Text style={styles.headerSubtitleText}>
              {activeChatThread ? (activeChatThread.isOnline ? '🟢 Active now' : '⚡ 52-Day Streak Partner') : '12 Connected Creators'}
            </Text>
          </View>

          {/* Right Action: Discover New Creators */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.newChatBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalAnim();
                setShowDiscoverModal(true);
              }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M12 5V19M5 12H19" stroke="#582CDB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN CONTENT: THREADS INBOX OR ACTIVE 1-ON-1 CHAT */}
        {!activeChatThread ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Top Badges Row */}
            <View style={styles.topBadgesRow}>
              <View style={styles.socialHubPill}>
                <Text style={styles.socialHubPillText}>SOCIAL HUB</Text>
              </View>
              <View style={styles.activePactPill}>
                <Text style={styles.activePactPillText}>⚡ 3 Active Accountability Pacts</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarBox}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 21L15.803 15.803M15.803 15.803A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  stroke="#94A3B8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search creators, handles, or scripts..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* ACTIVE CREATOR STORIES / STREAK BUDDIES ROW */}
            <Text style={styles.sectionHeaderTitle}>Streak Buddies Active Today</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesRow}
            >
              {CREATOR_STORIES.map((story) => (
                <Pressable
                  key={story.id}
                  style={styles.storyItem}
                  onPress={() => {
                    const matchedThread = threads.find((t) => t.creatorId === story.id);
                    if (matchedThread) {
                      handleOpenChat(matchedThread);
                    } else if (story.isUser) {
                      handleSendHighFive('yourself');
                    } else {
                      handleSendHighFive(story.name);
                    }
                  }}
                >
                  <View style={[styles.storyAvatarRing, story.isOnline && styles.storyAvatarRingActive]}>
                    <Image source={story.avatar} style={styles.storyAvatar} resizeMode="cover" />
                    {story.isOnline && <View style={styles.onlineDot} />}
                    {story.isUser && (
                      <View style={styles.userAddStatusBadge}>
                        <Text style={styles.userAddStatusText}>+</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {story.name}
                  </Text>
                  <View style={styles.storyStreakBadge}>
                    <Text style={styles.storyStreakText}>⚡ {story.streak}d</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* MESSAGE CATEGORY TABS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsRow}
            >
              {[
                { id: 'all', label: `🔥 All Messages (${threads.length})` },
                { id: 'buddies', label: '🤝 Streak Partners' },
                { id: 'collabs', label: '⚡ Collabs & Scripts' },
                { id: 'jarvis', label: '🤖 Jarvis AI' },
              ].map((tab) => {
                const isSelected = selectedCategory === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedCategory(tab.id as 'all' | 'buddies' | 'collabs' | 'jarvis');
                    }}
                    style={[
                      styles.categoryTabPill,
                      isSelected && styles.categoryTabPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTabPillText,
                        isSelected && styles.categoryTabPillTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* CONVERSATION THREADS LIST */}
            <View style={styles.threadsList}>
              {filteredThreads.map((thread) => (
                <Pressable
                  key={thread.id}
                  style={({ pressed }) => [
                    styles.threadCard,
                    thread.unread && styles.threadCardUnread,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleOpenChat(thread)}
                >
                  {/* Creator Avatar with Online Status */}
                  <View style={styles.threadAvatarWrapper}>
                    <Image source={thread.avatar} style={styles.threadAvatar} resizeMode="cover" />
                    {thread.isOnline && <View style={styles.threadOnlineDot} />}
                  </View>

                  {/* Thread Details */}
                  <View style={styles.threadContentCol}>
                    <View style={styles.threadTopRow}>
                      <Text style={styles.threadCreatorName} numberOfLines={1}>
                        {thread.name}
                      </Text>
                      <Text style={styles.threadTime}>{thread.time}</Text>
                    </View>

                    <View style={styles.threadMetaRow}>
                      <Text style={styles.threadHandle}>{thread.handle}</Text>
                      <View style={styles.threadStreakPill}>
                        <Text style={styles.threadStreakText}>⚡ {thread.streak}d streak</Text>
                      </View>
                    </View>

                    {thread.collabBadge && (
                      <View style={styles.collabStatusBadge}>
                        <Text style={styles.collabStatusText}>{thread.collabBadge}</Text>
                      </View>
                    )}

                    <Text
                      style={[styles.threadLastMessage, thread.unread && styles.threadLastMessageUnread]}
                      numberOfLines={1}
                    >
                      {thread.lastMessage}
                    </Text>
                  </View>

                  {/* Unread Purple Indicator */}
                  {thread.unread && <View style={styles.unreadPurpleDot} />}
                </Pressable>
              ))}
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 110 }} />
          </ScrollView>
        ) : (
          /* 3. ACTIVE 1-ON-1 CHAT CONVERSATION ROOM */
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.chatRoomContainer}>
              {/* Pinned Accountability Banner */}
              <LinearGradient
                colors={['#FAF5FF', '#EDE9FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pactBanner}
              >
                <View style={styles.pactFlameIconBox}>
                  <Text style={{ fontSize: 16 }}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pactTitle}>Accountability Pact Active</Text>
                  <Text style={styles.pactSub}>
                    You &amp; {activeChatThread.name} get +50 XP when both post today!
                  </Text>
                </View>
                <Pressable
                  style={styles.pactBoostBtn}
                  onPress={() => handleSendHighFive(activeChatThread.name)}
                >
                  <Text style={styles.pactBoostBtnText}>⚡ Boost</Text>
                </Pressable>
              </LinearGradient>

              {/* Chat Messages List */}
              <ScrollView
                ref={chatScrollRef}
                contentContainerStyle={styles.chatMessagesScroll}
                showsVerticalScrollIndicator={false}
              >
                {activeChatThread.messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleWrapper,
                      msg.isUser ? styles.msgWrapperUser : styles.msgWrapperPartner,
                    ]}
                  >
                    {/* Partner Avatar */}
                    {!msg.isUser && (
                      <Image
                        source={activeChatThread.avatar}
                        style={styles.msgAvatar}
                        resizeMode="cover"
                      />
                    )}

                    <View style={{ maxWidth: '78%' }}>
                      {/* Shared Script / Post Preview Card */}
                      {msg.sharedScriptTitle && (
                        <Pressable
                          style={styles.sharedScriptCard}
                          onPress={() => {
                            if (onOpenPostComposer) {
                              onOpenPostComposer(msg.sharedScriptTitle);
                            }
                          }}
                        >
                          <View style={styles.sharedScriptBadgeRow}>
                            <Text style={styles.sharedScriptBadgeText}>📑 SHARED SCRIPT DRAFT</Text>
                          </View>
                          <Text style={styles.sharedScriptTitle}>&ldquo;{msg.sharedScriptTitle}&rdquo;</Text>
                          <Text style={styles.sharedScriptAction}>Open in Post Composer ➔</Text>
                        </Pressable>
                      )}

                      {/* Text Bubble */}
                      <View
                        style={[
                          styles.messageBubble,
                          msg.isUser ? styles.msgBubbleUser : styles.msgBubblePartner,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            msg.isUser ? styles.msgTextUser : styles.msgTextPartner,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.messageTime,
                          msg.isUser ? styles.msgTimeUser : styles.msgTimePartner,
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Chat Input Bar */}
              <View style={styles.chatInputBar}>
                {/* Share Script Quick Action */}
                <Pressable
                  style={styles.attachScriptBtn}
                  onPress={() => {
                    setInputMessage(
                      `Hey ${activeChatThread.name}, here is the hook I'm testing: "One thing I wish I knew before I started creating"`
                    );
                  }}
                  hitSlop={8}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#582CDB" strokeWidth="2.2" />
                  </Svg>
                </Pressable>

                {/* Text Input */}
                <TextInput
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder={`Message ${activeChatThread.name}...`}
                  placeholderTextColor="#94A3B8"
                  style={styles.chatTextInput}
                  onSubmitEditing={handleSendMessage}
                />

                {/* Send Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.sendMsgBtn,
                    inputMessage.trim().length > 0 && styles.sendMsgBtnActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleSendMessage}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="#FFFFFF"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* MODAL: DISCOVER & MATCH CREATORS */}
        <Modal
          visible={showDiscoverModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDiscoverModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Find Streak Partners</Text>
                  <Text style={styles.modalSubtitle}>Creators matched with your niche &amp; schedule</Text>
                </View>
                <Pressable
                  onPress={() => setShowDiscoverModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {[
                  {
                    name: 'Zoe Martinez',
                    handle: '@zoevlogs',
                    niche: 'Daily Vlog & Lifestyle',
                    streak: 64,
                    avatar: require('../../assets/images/elena-avatar.jpg'),
                  },
                  {
                    name: 'Liam Vance',
                    handle: '@liamfilms',
                    niche: 'Shorts & Filmmaking',
                    streak: 33,
                    avatar: require('../../assets/images/david-avatar.jpg'),
                  },
                ].map((c, i) => (
                  <View key={i} style={styles.discoverCreatorCard}>
                    <Image source={c.avatar} style={styles.discoverAvatar} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.discoverName}>{c.name}</Text>
                      <Text style={styles.discoverHandle}>{c.handle} • ⚡ {c.streak}d</Text>
                      <Text style={styles.discoverNiche}>{c.niche}</Text>
                    </View>
                    <Pressable
                      style={styles.discoverConnectBtn}
                      onPress={() => {
                        setShowDiscoverModal(false);
                        handleSendHighFive(c.name);
                      }}
                    >
                      <Text style={styles.discoverConnectBtnText}>Connect</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowDiscoverModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
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
          xpEarned={15}
          streakCount={47}
          actionText="Back to Messages ➔"
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
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBF8',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
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
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 34,
    height: 34,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Top Badges
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  socialHubPill: {
    backgroundColor: '#582CDB',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  socialHubPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  activePactPill: {
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  activePactPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // Search Box
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171420',
    fontWeight: '600',
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '800',
  },

  // Stories / Streak Buddies
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 10,
  },
  storiesRow: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 12,
    marginBottom: 10,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyAvatarRing: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyAvatarRingActive: {
    borderColor: '#582CDB',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userAddStatusBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#582CDB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAddStatusText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  storyName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },
  storyStreakBadge: {
    marginTop: 2,
    backgroundColor: '#FEF3C7',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  storyStreakText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },

  // Category Tabs
  categoryTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  categoryTabPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6.5,
    paddingHorizontal: 13,
  },
  categoryTabPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  categoryTabPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Threads List
  threadsList: {
    gap: 10,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    gap: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  threadCardUnread: {
    backgroundColor: '#FDFAFF',
    borderColor: '#DDD6FE',
  },
  threadAvatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  threadOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  threadContentCol: {
    flex: 1,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  threadCreatorName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },
  threadTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  threadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  threadHandle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  threadStreakPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  threadStreakText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  collabStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    marginBottom: 4,
  },
  collabStatusText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
  },
  threadLastMessage: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  threadLastMessageUnread: {
    color: '#171420',
    fontWeight: '700',
  },
  unreadPurpleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#582CDB',
  },

  // 1-on-1 Chat Room Styles
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  pactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  pactFlameIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pactTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  pactSub: {
    fontSize: 11,
    color: '#475569',
  },
  pactBoostBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pactBoostBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  chatMessagesScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgWrapperPartner: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleUser: {
    backgroundColor: '#582CDB',
    borderBottomRightRadius: 4,
  },
  msgBubblePartner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  msgTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  msgTextPartner: {
    color: '#171420',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  msgTimeUser: {
    textAlign: 'right',
  },
  msgTimePartner: {
    textAlign: 'left',
  },
  sharedScriptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 6,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sharedScriptBadgeRow: {
    marginBottom: 4,
  },
  sharedScriptBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  sharedScriptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 18,
    marginBottom: 6,
  },
  sharedScriptAction: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEBF8',
    gap: 10,
    marginBottom: 80,
  },
  attachScriptBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#171420',
    fontWeight: '500',
  },
  sendMsgBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendMsgBtnActive: {
    backgroundColor: '#582CDB',
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
  discoverCreatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  discoverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  discoverName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  discoverHandle: {
    fontSize: 11,
    color: '#64748B',
  },
  discoverNiche: {
    fontSize: 10.5,
    color: '#582CDB',
    fontWeight: '700',
    marginTop: 2,
  },
  discoverConnectBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  discoverConnectBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
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
});
