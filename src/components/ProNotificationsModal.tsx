import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { sFont } from '../utils/responsive';

export type ProNotifCategory = 'all' | 'ai' | 'deals' | 'collabs' | 'streaks' | 'unread';

export interface ProNotificationItem {
  id: string;
  priority: 'high' | 'normal';
  category: 'ai' | 'deals' | 'collabs' | 'streaks' | 'growth' | 'squad';
  categoryTag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
  badgeBg: string;
  badgeBorder: string;
  metaPills?: { label: string; isHighlight?: boolean }[];
  actionText?: string;
  actionKey?:
    | 'open_script'
    | 'open_voice_studio'
    | 'open_deal'
    | 'open_collab'
    | 'create_reel'
    | 'open_growth'
    | 'open_squad'
    | 'open_schedule'
    | 'open_messages';
}

export const DEFAULT_PRO_NOTIFICATIONS: ProNotificationItem[] = [
  {
    id: 'pn_1',
    priority: 'high',
    category: 'ai',
    categoryTag: '✨ JARVIS CO-PILOT',
    tagColor: '#582CDB',
    tagBg: '#EDE9FE',
    title: 'Optimal Post Window Detected (7:30 PM)',
    body: 'Audience engagement velocity peaks at 7:30 PM (+38% reach). Draft script "3 Creator Mistakes" is ready in Voice Studio.',
    time: '12m ago',
    unread: true,
    iconEmoji: '⚡',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
    metaPills: [
      { label: '🎯 +38% Reach Est.', isHighlight: true },
      { label: '🎬 Script Ready' },
    ],
    actionText: 'Review Script in Voice Studio',
    actionKey: 'open_voice_studio',
  },
  {
    id: 'pn_2',
    priority: 'high',
    category: 'deals',
    categoryTag: '💎 VERIFIED SPONSOR',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    title: 'Nordic Tech Pro Sponsorship ($1,200 Bounty)',
    body: 'Exclusive direct invitation for Pablo. 60s integrated product spotlight for AI tools. Escrow pre-funded and insured.',
    time: '45m ago',
    unread: true,
    iconEmoji: '💰',
    badgeBg: '#ECFDF5',
    badgeBorder: '#A7F3D0',
    metaPills: [
      { label: '💵 $1,200 Escrow Locked', isHighlight: true },
      { label: '⚡ 98% Niche Fit' },
    ],
    actionText: 'Review Offer & Claim Bounty',
    actionKey: 'open_deal',
  },
  {
    id: 'pn_3',
    priority: 'high',
    category: 'collabs',
    categoryTag: '🤝 95% AUDIENCE FIT',
    tagColor: '#0284C7',
    tagBg: '#E0F2FE',
    title: 'Amara Okafor sent a Split-Screen Reel Pitch',
    body: '"The 3-Tool Creator Stack for 2026" • Both channels cross-promoting this Saturday at 2:00 PM.',
    time: '2h ago',
    unread: true,
    iconEmoji: '🤝',
    badgeBg: '#E0F2FE',
    badgeBorder: '#BAE6FD',
    metaPills: [
      { label: '👥 85K Travel/Lifestyle' },
      { label: '🔥 44-Day Streak' },
    ],
    actionText: 'Accept Pitch & Open Chat',
    actionKey: 'open_collab',
  },
  {
    id: 'pn_4',
    priority: 'normal',
    category: 'collabs',
    categoryTag: '💬 MESSAGE',
    tagColor: '#582CDB',
    tagBg: '#EDE9FE',
    title: 'David Kim sent you a message',
    body: 'Pacing on the 3-app stack looks incredible! Let\'s lock in the audio.',
    time: '1h ago',
    unread: true,
    iconEmoji: '💬',
    badgeBg: '#FAF5FF',
    badgeBorder: '#DDD6FE',
    actionKey: 'open_messages',
  },
  {
    id: 'pn_5',
    priority: 'normal',
    category: 'streaks',
    categoryTag: '🔥 STREAK',
    tagColor: '#D97706',
    tagBg: '#FEF3C7',
    title: 'Day 48 Streak Locked & Protected',
    body: 'Post 1 Reel before 11:30 PM to maintain top 1% global rank.',
    time: '3h ago',
    unread: false,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
    actionKey: 'create_reel',
  },
  {
    id: 'pn_6',
    priority: 'normal',
    category: 'ai',
    categoryTag: '📈 ANALYTICS',
    tagColor: '#9333EA',
    tagBg: '#FAF5FF',
    title: 'Reel #47 Outperforming Benchmark (+142%)',
    body: 'High 18.4% save rate detected. Jarvis recommends a follow-up carousel.',
    time: '5h ago',
    unread: false,
    iconEmoji: '🚀',
    badgeBg: '#FAF5FF',
    badgeBorder: '#E9D5FF',
    actionKey: 'open_growth',
  },
  {
    id: 'pn_7',
    priority: 'normal',
    category: 'collabs',
    categoryTag: '👑 SQUAD',
    tagColor: '#B45309',
    tagBg: '#FFFBEB',
    title: 'Creators Club reached 100-Day Sync',
    body: '2.5x XP Boost activated for all squad members for the next 48 hours.',
    time: '1d ago',
    unread: false,
    iconEmoji: '👑',
    badgeBg: '#FFFBEB',
    badgeBorder: '#FDE68A',
    actionKey: 'open_squad',
  },
  {
    id: 'pn_8',
    priority: 'normal',
    category: 'collabs',
    categoryTag: '✨ COLLAB',
    tagColor: '#582CDB',
    tagBg: '#EDE9FE',
    title: 'Kemi Adeleke saved your joint concept',
    body: 'Added slide notes to "High-Converting Carousel Slide".',
    time: '1d ago',
    unread: false,
    iconEmoji: '✨',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
    actionKey: 'open_collab',
  },
];

interface ProNotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications?: ProNotificationItem[];
  onNotificationsChange?: (notifications: ProNotificationItem[]) => void;
  onActionPress?: (actionKey: string, notif: ProNotificationItem) => void;
  onToast?: (message: string) => void;
}

export const ProNotificationsModal: React.FC<ProNotificationsModalProps> = ({
  visible,
  onClose,
  notifications = DEFAULT_PRO_NOTIFICATIONS,
  onNotificationsChange,
  onActionPress,
  onToast,
}) => {
  const [activeFilter, setActiveFilter] = useState<ProNotifCategory>('all');
  const [notifsList, setNotifsList] = useState<ProNotificationItem[]>(notifications);
  const modalScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    setNotifsList(notifications);
  }, [notifications]);

  useEffect(() => {
    if (visible) {
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else {
      modalScale.setValue(0.88);
    }
  }, [visible]);

  const unreadCount = notifsList.filter((n) => n.unread).length;
  const aiCount = notifsList.filter((n) => n.category === 'ai').length;
  const dealCount = notifsList.filter((n) => n.category === 'deals').length;
  const collabCount = notifsList.filter((n) => n.category === 'collabs').length;
  const streakCount = notifsList.filter((n) => n.category === 'streaks').length;

  const filteredNotifs = notifsList.filter((item) => {
    if (activeFilter === 'unread') return item.unread;
    if (activeFilter === 'ai') return item.category === 'ai';
    if (activeFilter === 'deals') return item.category === 'deals';
    if (activeFilter === 'collabs') return item.category === 'collabs';
    if (activeFilter === 'streaks') return item.category === 'streaks';
    return true;
  });

  const handleMarkAllRead = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const updated = notifsList.map((n) => ({ ...n, unread: false }));
    setNotifsList(updated);
    if (onNotificationsChange) {
      onNotificationsChange(updated);
    }
    if (onToast) {
      onToast('All notifications marked as read ✓');
    }
  };

  const handleCardPress = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = notifsList.map((n) => (n.id === id ? { ...n, unread: false } : n));
    setNotifsList(updated);
    if (onNotificationsChange) {
      onNotificationsChange(updated);
    }
  };

  const handleAction = (item: ProNotificationItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    handleCardPress(item.id);
    onClose();
    if (onActionPress && item.actionKey) {
      onActionPress(item.actionKey, item);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}>
          {/* 1. NOTIFICATIONS HEADER */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.modalMainTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadgePill}>
                  <Text style={styles.unreadBadgePillText}>{unreadCount} NEW</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeCircleBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6L18 18" stroke="#171420" strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          {/* 2. FILTER PILLS BAR */}
          <View style={styles.filterBarContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {[
                { key: 'all', label: `All (${notifsList.length})` },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'ai', label: `⚡ AI Co-Pilot (${aiCount})` },
                { key: 'deals', label: `💰 Deals (${dealCount})` },
                { key: 'collabs', label: `🤝 Collabs (${collabCount})` },
                { key: 'streaks', label: `🔥 Streaks (${streakCount})` },
              ].map((tab) => {
                const isSelected = activeFilter === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveFilter(tab.key as ProNotifCategory);
                    }}
                    style={[styles.filterPill, isSelected && styles.filterPillActive]}
                  >
                    <Text
                      style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. SCROLLABLE PRO NOTIFICATIONS LIST */}
          <ScrollView
            style={styles.notifsScrollView}
            contentContainerStyle={styles.notifsScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {filteredNotifs.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptySubtitle}>No alerts in this category right now.</Text>
              </View>
            ) : (
              filteredNotifs.map((item) => {
                const isHighPriority = item.priority === 'high';

                if (isHighPriority) {
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleCardPress(item.id)}
                      style={({ pressed }) => [
                        styles.notifCard,
                        item.unread && styles.notifCardUnread,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.cardHeaderRow}>
                        {/* Icon Badge */}
                        <View
                          style={[
                            styles.iconBadge,
                            { backgroundColor: item.badgeBg, borderColor: item.badgeBorder },
                          ]}
                        >
                          <Text style={styles.iconEmoji}>{item.iconEmoji}</Text>
                        </View>

                        {/* Content Top Header */}
                        <View style={styles.cardTextCol}>
                          <View style={styles.cardMetaRow}>
                            <View
                              style={[
                                styles.categoryTagPill,
                                { backgroundColor: item.tagBg },
                              ]}
                            >
                              <Text style={[styles.categoryTagText, { color: item.tagColor }]}>
                                {item.categoryTag}
                              </Text>
                            </View>
                            <Text style={styles.timeAgoText}>{item.time}</Text>
                          </View>

                          <Text style={styles.notifTitleText} numberOfLines={2}>
                            {item.title}
                          </Text>
                        </View>

                        {/* Unread Glow Dot */}
                        {item.unread && <View style={styles.unreadDot} />}
                      </View>

                      {/* Body Text */}
                      <Text style={styles.notifBodyText}>{item.body}</Text>

                      {/* Pro Metrics Pills */}
                      {item.metaPills && item.metaPills.length > 0 && (
                        <View style={styles.metaPillsRow}>
                          {item.metaPills.map((pill, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.metaPill,
                                pill.isHighlight && styles.metaPillHighlight,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.metaPillText,
                                  pill.isHighlight && styles.metaPillTextHighlight,
                                ]}
                              >
                                {pill.label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* 1-Tap Action Link */}
                      {item.actionText && (
                        <Pressable
                          onPress={() => handleAction(item)}
                          style={({ pressed }) => [
                            styles.actionLinkRow,
                            pressed && { opacity: 0.75 },
                          ]}
                          hitSlop={6}
                        >
                          <Text style={styles.actionLinkText}>{item.actionText}</Text>
                          <Text style={styles.actionLinkArrow}>➔</Text>
                        </Pressable>
                      )}
                    </Pressable>
                  );
                }

                // COMPACT CARD FOR LOWER-PRIORITY / ACTIVITY NOTIFICATIONS
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      handleCardPress(item.id);
                      if (item.actionKey) {
                        handleAction(item);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.compactNotifCard,
                      item.unread && styles.compactNotifCardUnread,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.compactIconBadge,
                        { backgroundColor: item.badgeBg, borderColor: item.badgeBorder },
                      ]}
                    >
                      <Text style={styles.compactIconEmoji}>{item.iconEmoji}</Text>
                    </View>

                    <View style={styles.compactContentCol}>
                      <View style={styles.compactTitleRow}>
                        <Text style={styles.compactTitleText} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.compactTimeText}>{item.time}</Text>
                      </View>
                      <Text style={styles.compactBodyText} numberOfLines={1} ellipsizeMode="tail">
                        {item.body}
                      </Text>
                    </View>

                    {item.unread && <View style={styles.compactUnreadDot} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* 4. MARK ALL AS READ BOTTOM CTA BUTTON */}
          <Pressable
            onPress={handleMarkAllRead}
            style={({ pressed }) => [styles.markAllReadBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.markAllReadBtnText}>Mark all as read ✓</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '84%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalMainTitle: {
    fontSize: sFont(19),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  unreadBadgePill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  unreadBadgePillText: {
    fontSize: sFont(9),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  // FILTER PILLS
  filterBarContainer: {
    marginBottom: 12,
  },
  filterScrollContent: {
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  filterPillActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#582CDB',
    borderWidth: 1.5,
  },
  filterPillText: {
    fontSize: sFont(11),
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },

  // NOTIFICATION LIST & CARDS
  notifsScrollView: {
    maxHeight: 390,
  },
  notifsScrollContent: {
    paddingBottom: 8,
    gap: 10,
  },
  emptyStateBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: sFont(15),
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: sFont(12),
    color: '#94A3B8',
  },

  // HIGH PRIORITY RICH CARD
  notifCard: {
    backgroundColor: '#FAF9FC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 13,
  },
  notifCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDD6FE',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 18,
  },
  cardTextCol: {
    flex: 1,
    minWidth: 0,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  categoryTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryTagText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timeAgoText: {
    fontSize: sFont(10),
    color: '#94A3B8',
    fontWeight: '600',
  },
  notifTitleText: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#171420',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#582CDB',
    marginTop: 4,
    flexShrink: 0,
  },
  notifBodyText: {
    fontSize: sFont(11.5),
    color: '#5E576E',
    lineHeight: 16.5,
    marginTop: 6,
  },

  // META PILLS
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  metaPillHighlight: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  metaPillText: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#475569',
  },
  metaPillTextHighlight: {
    color: '#582CDB',
  },

  // ACTION LINK
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  actionLinkText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#582CDB',
  },
  actionLinkArrow: {
    fontSize: sFont(10.5),
    color: '#582CDB',
    fontWeight: '800',
  },

  // COMPACT CARD (LOWER PRIORITY / ACTIVITY)
  compactNotifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  compactNotifCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDD6FE',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  compactIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  compactIconEmoji: {
    fontSize: 16,
  },
  compactContentCol: {
    flex: 1,
    minWidth: 0,
  },
  compactTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  compactTitleText: {
    fontSize: sFont(13),
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    minWidth: 0,
  },
  compactTimeText: {
    fontSize: sFont(10),
    color: '#94A3B8',
    fontWeight: '600',
    flexShrink: 0,
  },
  compactBodyText: {
    fontSize: sFont(11.5),
    color: '#5E576E',
  },
  compactUnreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#582CDB',
    flexShrink: 0,
  },

  // BOTTOM MARK ALL READ BUTTON
  markAllReadBtn: {
    marginTop: 14,
    backgroundColor: '#582CDB',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  markAllReadBtnText: {
    fontSize: sFont(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
