import React, { useEffect, useState } from 'react';
import { MascotSays } from '../mascot/MascotSays';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassSheet } from '../glass/GlassSheet';
import { JarvisOrb } from '../JarvisOrb';
import { ds, goldTokens } from '../../theme/colors';
import type { NoteKind, NoteTarget, NotificationItem } from '../../../frontend/shared/types/phase1';
import { useUnread } from '../../backend/account';
import { feedStore, loadNotifications, markNotificationsRead, useNotificationFeed } from '../../backend/notifications';
import { timeAgo } from '../../utils/time';

// The bell's sheet, the same on every screen. Everything in it was written by the server:
// a welcome, news about the week's challenge and quests, followers and top posts from the
// accounts they connected. Notes about something to do say where they lead and open it when
// tapped; plain news has no action. Opening the sheet counts as reading: the new ones stay
// highlighted while it's open, and are marked read (on the server too) when it closes.
// No countdowns or "don't lose your streak" messages.

export type { NoteTarget };

let handler: ((t: NoteTarget) => void) | null = null;
/** App.tsx registers how to open each target. */
export function setNotificationHandler(fn: ((t: NoteTarget) => void) | null) {
  handler = fn;
}

/** Unread count for the bell's dot. */
export function useUnreadNotifications(): number {
  return useUnread();
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function KindIcon({ kind }: { kind: NoteKind }) {
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

function NoteRow({ note, unread, index, onAction }: { note: NotificationItem; unread: boolean; index: number; onAction: () => void }) {
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
          <Text style={styles.rowTime}>{timeAgo(note.createdAt)}</Text>
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

export function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { items, loaded } = useNotificationFeed();
  const [failed, setFailed] = useState(false);

  // What was new when the sheet opened stays highlighted while it's open.
  // Opening the sheet counts as seeing them: they're marked read on close.
  const [newIds, setNewIds] = useState<string[]>([]);
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setFailed(false);
    void loadNotifications().then((ok) => {
      if (!alive) return;
      if (!ok) setFailed(true);
      else setNewIds(feedStore.get().items.filter((n) => !n.read).map((n) => n.id));
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  const close = () => {
    if (newIds.length) void markNotificationsRead(newIds);
    setNewIds([]);
    onClose();
  };

  const open = (note: NotificationItem) => {
    if (!note.action) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const target = note.action.target;
    close();
    // Let the sheet start gliding away, then go
    setTimeout(() => handler?.(target), 180);
  };

  const fresh = items.filter((n) => newIds.includes(n.id));
  const earlier = items.filter((n) => !newIds.includes(n.id));

  return (
    <GlassSheet
      visible={visible}
      onClose={close}
      title="Notifications"
      subtitle={!loaded ? (failed ? 'Couldn’t load them' : 'Loading…') : fresh.length ? `${fresh.length} new` : 'You’re all caught up'}
      maxHeight={0.86}
      footer={<AppButton title="Done" size="lg" onPress={close} />}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {!loaded ? (
          failed ? (
            <MascotSays size={52} emotion="calm" text="I couldn’t reach the server. Check your connection and open this again." />
          ) : (
            <ActivityIndicator color={ds.purple} style={{ marginVertical: 24 }} />
          )
        ) : (
          <MascotSays size={52} emotion={fresh.length ? 'excited' : 'calm'} text={fresh.length ? 'Here’s what’s new!' : items.length ? 'All caught up. Nice!' : 'Nothing yet. I’ll tell you here when there’s news.'} />
        )}
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
