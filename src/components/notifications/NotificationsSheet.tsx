import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassSheet } from '../glass/GlassSheet';
import { JarvisOrb } from '../JarvisOrb';
import { ds, goldTokens } from '../../theme/colors';

// The bell's sheet, the same on every screen. What's in it depends on the
// creator: new creators get a few getting-started notes; returning creators
// get real updates (numbers match the Growth page). Pro adds Jarvis's daily
// brief. No countdowns or "don't lose your streak" messages.
// Tap a note to mark it read; "Mark all as read" clears the dots.

type Kind = 'jarvis' | 'growth' | 'star' | 'clock' | 'flag' | 'link' | 'mic' | 'calendar' | 'pro';
interface Note {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  time: string;
}

type Persona = 'new' | 'returning';
type Tier = 'free' | 'pro';

const JARVIS_HI: Note = { id: 'hi', kind: 'jarvis', title: 'Hi, I’m Jarvis', body: 'Tap Create whenever you have an idea and I’ll help you shape it into a post.', time: 'Just now' };
const CONNECT: Note = { id: 'connect', kind: 'link', title: 'Connect where you post', body: 'Link TikTok, Instagram or YouTube to see your stats here.', time: '1h ago' };
const CHALLENGE: Note = { id: 'challenge', kind: 'flag', title: 'This week’s challenge is open', body: 'Post 3 times this week, at your own pace.', time: 'Today' };

const FEEDS: Record<`${Persona}-${Tier}`, Note[]> = {
  'new-free': [JARVIS_HI, CONNECT, CHALLENGE],
  'new-pro': [
    { id: 'pro', kind: 'pro', title: 'Welcome to Pro', body: 'Unlimited ideas, repurposing and Voice Studio are ready for you.', time: 'Just now' },
    { id: 'voice', kind: 'mic', title: 'Set up your voice', body: 'Record a short clip in Voice Studio and Jarvis can read your scripts in your voice.', time: 'Just now' },
    CONNECT,
    CHALLENGE,
  ],
  'returning-free': [
    { id: 'followers', kind: 'growth', title: '1,280 new followers this week', body: 'Across TikTok, Instagram and YouTube.', time: '2h ago' },
    { id: 'best', kind: 'star', title: 'Your best post passed 14.2K views', body: '“3 creator mistakes I stopped making this year” has 84 shares so far.', time: '5h ago' },
    { id: 'time', kind: 'clock', title: 'Your audience is online tonight', body: 'Most of them are on between 7 and 9 PM.', time: 'Today' },
    { id: 'challenge', kind: 'flag', title: 'New weekly challenge', body: 'Post 3 times this week, at your own pace.', time: 'Yesterday' },
  ],
  'returning-pro': [
    { id: 'brief', kind: 'jarvis', title: 'Today’s brief is ready', body: 'Jarvis has 3 ideas for today, based on what worked for you last week.', time: '1h ago' },
    { id: 'followers', kind: 'growth', title: '1,280 new followers this week', body: 'Across TikTok, Instagram and YouTube.', time: '2h ago' },
    { id: 'best', kind: 'star', title: 'Your best post passed 14.2K views', body: '“3 creator mistakes I stopped making this year” has 84 shares so far.', time: '5h ago' },
    { id: 'posted', kind: 'calendar', title: 'Your TikTok went out', body: 'Scheduled for 7:30 PM and posted on time.', time: 'Yesterday' },
    { id: 'time', kind: 'clock', title: 'Your audience is online tonight', body: 'Most of them are on between 7 and 9 PM.', time: 'Yesterday' },
  ],
};
// Which notes start unread
const START_UNREAD: Record<string, number> = { 'new-free': 2, 'new-pro': 2, 'returning-free': 2, 'returning-pro': 3 };

// ─── Read state (in memory for the session) ─────────────────────────────────
let read: Record<string, true> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getRead = () => read;
const keyOf = (feed: string, id: string) => `${feed}:${id}`;
const markRead = (feed: string, ids: string[]) => {
  read = { ...read };
  ids.forEach((id) => (read[keyOf(feed, id)] = true));
  emit();
};

const feedKey = (persona?: string, tier?: string) => `${persona === 'returning' ? 'returning' : 'new'}-${tier === 'pro' || tier === 'founding' ? 'pro' : 'free'}` as `${Persona}-${Tier}`;
const isUnread = (feed: string, idx: number, id: string, r: Record<string, true>) => idx < START_UNREAD[feed] && !r[keyOf(feed, id)];

/** Unread count for the bell's dot. */
export function useUnreadNotifications(persona?: string, tier?: string) {
  const r = useSyncExternalStore(subscribe, getRead, getRead);
  const feed = feedKey(persona, tier);
  return FEEDS[feed].filter((n, i) => isUnread(feed, i, n.id, r)).length;
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function KindIcon({ kind }: { kind: Kind }) {
  if (kind === 'jarvis') {
    return (
      <View style={styles.icon}>
        <JarvisOrb size={26} />
      </View>
    );
  }
  const pro = kind === 'pro';
  const c = pro ? goldTokens.dark : ds.purple;
  const p = { stroke: c, strokeWidth: 2.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View style={[styles.icon, pro ? styles.iconPro : styles.iconPurple]}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        {kind === 'growth' && <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" {...p} />}
        {kind === 'star' && <Path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.3 9.3l6.1-.7L12 3z" {...p} />}
        {kind === 'pro' && <Path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.3 9.3l6.1-.7L12 3z" fill={goldTokens.primary} {...p} />}
        {kind === 'clock' && (
          <>
            <Circle cx="12" cy="12" r="8.5" {...p} />
            <Path d="M12 7.5V12l3 2" {...p} />
          </>
        )}
        {kind === 'flag' && <Path d="M5 21V4M5 4h11l-2 4 2 4H5" {...p} />}
        {kind === 'link' && <Path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" {...p} />}
        {kind === 'mic' && (
          <>
            <Rect x="9" y="3" width="6" height="11" rx="3" {...p} />
            <Path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" {...p} />
          </>
        )}
        {kind === 'calendar' && (
          <>
            <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...p} />
            <Path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" {...p} />
          </>
        )}
      </Svg>
    </View>
  );
}

function NoteRow({ note, unread, index, onPress }: { note: Note; unread: boolean; index: number; onPress: () => void }) {
  const dot = useSharedValue(unread ? 1 : 0);
  useEffect(() => {
    dot.value = withTiming(unread ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [unread, dot]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value, transform: [{ scale: 0.5 + dot.value * 0.5 }] }));
  const tint = useAnimatedStyle(() => ({ opacity: dot.value }));
  return (
    <Animated.View entering={FadeInUp.delay(80 + index * 60).duration(280).easing(Easing.out(Easing.cubic))}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${unread ? 'Unread. ' : ''}${note.title}. ${note.body}`}
        style={({ pressed }) => [styles.row, Platform.OS === 'web' && ({ cursor: 'pointer' } as object), pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.rowUnread, tint]} />
        <KindIcon kind={note.kind} />
        <View style={styles.flex}>
          <View style={styles.rowHead}>
            <Text style={styles.rowTitle}>{note.title}</Text>
            <Animated.View style={[styles.dot, dotStyle]} />
          </View>
          <Text style={styles.rowBody}>{note.body}</Text>
          <Text style={styles.rowTime}>{note.time}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Filter({ value, onChange, unread }: { value: 'all' | 'unread'; onChange: (v: 'all' | 'unread') => void; unread: number }) {
  const [w, setW] = useState(0);
  const cell = w / 2;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(value === 'all' ? 0 : cell, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [value, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.tabs}
      accessibilityRole="tablist"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 8;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = value === 'all' ? 0 : nw / 2;
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.tabPill, { width: cell }, pill]} />}
      {(['all', 'unread'] as const).map((t) => (
        <Pressable
          key={t}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            onChange(t);
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === t }}
          style={[styles.tab, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
        >
          <Text style={[styles.tabText, value === t && styles.tabTextOn]}>{t === 'all' ? 'All' : unread > 0 ? `Unread (${unread})` : 'Unread'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function NotificationsSheet({ visible, onClose, persona, tier }: { visible: boolean; onClose: () => void; persona?: string; tier?: string }) {
  const r = useSyncExternalStore(subscribe, getRead, getRead);
  const feed = feedKey(persona, tier);
  const notes = FEEDS[feed];
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  useEffect(() => {
    if (visible) setFilter('all');
  }, [visible]);

  const unreadIds = notes.filter((n, i) => isUnread(feed, i, n.id, r)).map((n) => n.id);
  const shown = notes.map((n, i) => ({ n, unread: isUnread(feed, i, n.id, r) })).filter((x) => filter === 'all' || x.unread);

  return (
    <GlassSheet
      visible={visible}
      onClose={onClose}
      title="Notifications"
      subtitle={unreadIds.length ? `${unreadIds.length} new` : 'You’re all caught up'}
      maxHeight={0.86}
      footer={<AppButton title="Done" size="lg" onPress={onClose} />}
    >
      <View style={styles.top}>
        <View style={styles.flex}>
          <Filter value={filter} onChange={setFilter} unread={unreadIds.length} />
        </View>
        {unreadIds.length > 0 ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                markRead(feed, unreadIds);
              }}
              hitSlop={8}
              accessibilityRole="button"
              style={[styles.markAll, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M2 13l4 4 8-9M10 17l1 0 9-10" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? (
          <Animated.View entering={FadeIn.duration(260)} style={styles.empty}>
            <JarvisOrb size={56} />
            <Text style={styles.emptyTitle}>Nothing unread</Text>
            <Text style={styles.emptyBody}>New updates will show up here.</Text>
          </Animated.View>
        ) : (
          <View key={filter} style={styles.rows}>
            {shown.map(({ n, unread }, i) => (
              <NoteRow
                key={n.id}
                note={n}
                unread={unread}
                index={i}
                onPress={() => {
                  if (unread) {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    markRead(feed, [n.id]);
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  tabs: { flexDirection: 'row', padding: 4, height: 40, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)', maxWidth: 220 },
  tabPill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 999, backgroundColor: ds.purple },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  tabTextOn: { color: '#FFFFFF' },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40 },
  markAllText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  scroll: { flexShrink: 1 },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  rows: { gap: 10 },
  row: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.72)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  rowUnread: { backgroundColor: 'rgba(245, 243, 255, 0.95)' },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  iconPurple: { backgroundColor: ds.lavender },
  iconPro: { backgroundColor: goldTokens.light },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', color: ds.ink, lineHeight: 19 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ds.purple, marginTop: 5 },
  rowBody: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 3 },
  rowTime: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: ds.ink, marginTop: 10 },
  emptyBody: { fontSize: 13, color: ds.text3, fontWeight: '600' },
});
