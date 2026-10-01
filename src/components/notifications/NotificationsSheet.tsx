import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { MascotSays } from '../mascot/MascotSays';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
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
// Notes about something to do say where they lead and open it when tapped.
// Plain news has no action. Opening the sheet counts as reading: the new
// ones stay highlighted while it's open, then the bell's dot clears.

type Kind = 'jarvis' | 'growth' | 'star' | 'clock' | 'flag' | 'link' | 'mic' | 'calendar' | 'pro';
/** Where a note can take the creator. App.tsx decides how to get there. */
export type NoteTarget = 'create' | 'accounts' | 'challenge' | 'jarvis-pro' | 'voice-studio' | 'platform-growth' | 'post-performance' | 'schedule' | 'home';
interface Note {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  time: string;
  /** Notes about something to do open it; plain news has no action. */
  action?: { label: string; target: NoteTarget };
}

let handler: ((t: NoteTarget) => void) | null = null;
/** App.tsx registers how to open each target. */
export function setNotificationHandler(fn: ((t: NoteTarget) => void) | null) {
  handler = fn;
}

type Persona = 'new' | 'returning';
type Tier = 'free' | 'pro';

const JARVIS_HI: Note = { id: 'hi', kind: 'jarvis', title: 'Hi, I’m Jarvis', body: 'Whenever you have an idea, I’ll help you shape it into a post.', time: 'Just now', action: { label: 'Start a post', target: 'create' } };
const CONNECT: Note = { id: 'connect', kind: 'link', title: 'Connect where you post', body: 'Link TikTok, Instagram or YouTube to see your stats here.', time: '1h ago', action: { label: 'Connect an account', target: 'accounts' } };
const CHALLENGE: Note = { id: 'challenge', kind: 'flag', title: 'This week’s challenge is open', body: 'Post 3 times this week, at your own pace.', time: 'Today', action: { label: 'See the challenge', target: 'challenge' } };

const FEEDS: Record<`${Persona}-${Tier}`, Note[]> = {
  'new-free': [JARVIS_HI, CONNECT, CHALLENGE],
  'new-pro': [
    { id: 'pro', kind: 'pro', title: 'Welcome to Pro', body: 'Unlimited ideas, repurposing and Voice Studio are ready for you.', time: 'Just now', action: { label: 'See what’s in Pro', target: 'jarvis-pro' } },
    { id: 'voice', kind: 'mic', title: 'Set up your voice', body: 'Record a short clip and Jarvis can read your scripts in your voice.', time: 'Just now', action: { label: 'Open Voice Studio', target: 'voice-studio' } },
    CONNECT,
    CHALLENGE,
  ],
  'returning-free': [
    { id: 'followers', kind: 'growth', title: '1,280 new followers this week', body: 'Across TikTok, Instagram and YouTube.', time: '2h ago', action: { label: 'See your growth', target: 'platform-growth' } },
    { id: 'best', kind: 'star', title: 'Your best post passed 14.2K views', body: '“3 creator mistakes I stopped making this year” has 84 shares so far.', time: '5h ago', action: { label: 'See how it did', target: 'post-performance' } },
    { id: 'time', kind: 'clock', title: 'Your audience is online tonight', body: 'Most of them are on between 7 and 9 PM.', time: 'Today' },
    { id: 'challenge', kind: 'flag', title: 'New weekly challenge', body: 'Post 3 times this week, at your own pace.', time: 'Yesterday', action: { label: 'See the challenge', target: 'challenge' } },
  ],
  'returning-pro': [
    { id: 'brief', kind: 'jarvis', title: 'Today’s brief is ready', body: 'Jarvis has 3 ideas for today, based on what worked for you last week.', time: '1h ago', action: { label: 'Read the brief', target: 'home' } },
    { id: 'followers', kind: 'growth', title: '1,280 new followers this week', body: 'Across TikTok, Instagram and YouTube.', time: '2h ago', action: { label: 'See your growth', target: 'platform-growth' } },
    { id: 'best', kind: 'star', title: 'Your best post passed 14.2K views', body: '“3 creator mistakes I stopped making this year” has 84 shares so far.', time: '5h ago', action: { label: 'See how it did', target: 'post-performance' } },
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

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

function NoteRow({ note, unread, index, onAction }: { note: Note; unread: boolean; index: number; onAction: () => void }) {
  const content = (
    <>
      {unread ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.rowUnread]} /> : null}
      <KindIcon kind={note.kind} />
      <View style={styles.flex}>
        <View style={styles.rowHead}>
          <Text style={styles.rowTitle}>{note.title}</Text>
          {unread ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.rowBody}>{note.body}</Text>
        <View style={styles.rowFoot}>
          <Text style={styles.rowTime}>{note.time}</Text>
          {note.action ? (
            <View style={styles.go}>
              <Text style={styles.goText}>{note.action.label}</Text>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
  return (
    <Animated.View entering={FadeInUp.delay(80 + index * 60).duration(280).easing(Easing.out(Easing.cubic))}>
      {note.action ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${unread ? 'New. ' : ''}${note.title}. ${note.body} ${note.action.label}`}
          style={({ pressed }) => [styles.row, pointer, pressed && { transform: [{ scale: 0.98 }] }]}
        >
          {content}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={`${unread ? 'New. ' : ''}${note.title}. ${note.body}`} style={styles.row}>
          {content}
        </View>
      )}
    </Animated.View>
  );
}

export function NotificationsSheet({ visible, onClose, persona, tier }: { visible: boolean; onClose: () => void; persona?: string; tier?: string }) {
  useSyncExternalStore(subscribe, getRead, getRead);
  const feed = feedKey(persona, tier);
  const notes = FEEDS[feed];

  // What was new when the sheet opened stays highlighted while it's open.
  // Opening the sheet counts as seeing them: they're marked read on close.
  const [newIds, setNewIds] = useState<string[]>([]);
  useEffect(() => {
    if (visible) setNewIds(notes.filter((n, i) => isUnread(feed, i, n.id, getRead())).map((n) => n.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, feed]);

  const close = () => {
    if (newIds.length) markRead(feed, newIds);
    onClose();
  };

  const open = (note: Note) => {
    if (!note.action) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const target = note.action.target;
    close();
    // Let the sheet start gliding away, then go
    setTimeout(() => handler?.(target), 180);
  };

  const fresh = notes.filter((n) => newIds.includes(n.id));
  const earlier = notes.filter((n) => !newIds.includes(n.id));
  
  return (
    <GlassSheet
      visible={visible}
      onClose={close}
      title="Notifications"
      subtitle={fresh.length ? `${fresh.length} new` : 'You’re all caught up'}
      maxHeight={0.86}
      footer={<AppButton title="Done" size="lg" onPress={close} />}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <MascotSays size={52} emotion={fresh.length ? 'excited' : 'calm'} text={fresh.length ? 'Here’s what’s new!' : 'All caught up. Nice!'} />
        {fresh.length > 0 ? (
          <>
            <Text style={styles.section}>New</Text>
            <View style={styles.rows}>
              {fresh.map((n, i) => (
                <NoteRow key={n.id} note={n} unread index={i} onAction={() => open(n)} />
              ))}
            </View>
          </>
        ) : null}
        {earlier.length > 0 ? (
          <>
            <Text style={[styles.section, fresh.length > 0 && { marginTop: 18 }]}>Earlier</Text>
            <View style={styles.rows}>
              {earlier.map((n, i) => (
                <NoteRow key={n.id} note={n} unread={false} index={fresh.length + i} onAction={() => open(n)} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  rowFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  rowTime: { fontSize: 11.5, fontWeight: '700', color: ds.text3 },
  go: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: ds.lavender },
  goText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  section: { fontSize: 13, fontWeight: '800', color: ds.text3, letterSpacing: 0.3, marginBottom: 8 },
});
