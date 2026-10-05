import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { TipsCard, RAIL_W } from './TodayRail';
import { openComposer } from './webActions';
import {
  getRepurposeAllowance,
  getSavedHooks,
  subscribeToRepurposes,
  subscribeToSavedHooks,
} from '../../data';
import { ds } from '../../theme/colors';

// Desktop web app: the panel beside each studio, with things that help with
// that tool, so the studio pages use the screen instead of leaving it empty.
//   Repurpose: this week's free use
//   Hook Studio: your saved hooks (live), and kinds of opening to try

export type StudioKind = 'repurpose' | 'hook';

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);

// ─── Repurpose ──────────────────────────────────────────────────────────────
function Allowance() {
  // The server's count and the plan's limit (read as one value so the store can compare it)
  const a = useSyncExternalStore(subscribeToRepurposes, getRepurposeAllowance, getRepurposeAllowance);
  const left = a.weeklyLimit === null ? null : Math.max(0, a.weeklyLimit - a.usedThisWeek);
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(a.weeklyLimit === null ? 1 : (left ?? 0) / a.weeklyLimit, { duration: 600, easing: ease });
  }, [left, a.weeklyLimit, w]);
  const bar = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <GlassCard strong radius={22} padding={16}>
      <Text style={styles.eyebrow}>THIS WEEK</Text>
      <Text style={styles.big}>{left === null ? 'Unlimited' : `${left} of ${a.weeklyLimit} free left`}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.trackFill, left === null && { backgroundColor: ds.gold }, bar]} />
      </View>
      <Text style={styles.muted}>{left === null ? 'Repurpose as much as you like with Pro.' : 'Free plans get one Repurpose a week, and a new one each week. If Jarvis can’t finish, it isn’t used up.'}</Text>
    </GlassCard>
  );
}

// ─── Hook Studio ────────────────────────────────────────────────────────────
function SavedHooks() {
  const hooks = useSyncExternalStore(subscribeToSavedHooks, getSavedHooks, getSavedHooks);
  return (
    <GlassCard strong radius={22} padding={16}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Your saved hooks</Text>
        <Text style={styles.muted}>{hooks.length}</Text>
      </View>
      {hooks.length === 0 ? (
        <View style={styles.empty}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
          </Svg>
          <Text style={styles.muted}>Tap the heart on a hook and it stays here, ready for your next video.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {hooks.slice(0, 6).map((h) => (
            <Animated.View key={h.line} entering={FadeInUp.duration(320).easing(ease)}>
              <Pressable onPress={() => openComposer(h.idea)} accessibilityRole="button" accessibilityLabel={`Start a post with: ${h.line}`} style={({ pressed }) => [styles.hook, pointer, pressed && { transform: [{ scale: 0.98 }] }]}>
                <Text style={styles.hookLine}>“{h.line}”</Text>
                <Text style={styles.hookMeta} numberOfLines={1}>For: {h.idea}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const OPENINGS = [
  { kind: 'A question', line: 'Why does nobody talk about this?' },
  { kind: 'A mistake', line: 'I did this wrong for a whole year.' },
  { kind: 'A story', line: 'Last Tuesday, something changed.' },
  { kind: 'A bold take', line: 'Posting every day is overrated. Here’s why.' },
  { kind: 'A result', line: 'This got me 1,000 followers in a week.' },
];

function Openings() {
  const [open, setOpen] = useState(1);
  return (
    <GlassCard strong radius={22} padding={16}>
      <Text style={styles.title}>Openings, at a glance</Text>
      <View style={styles.list}>
        {OPENINGS.map((o, i) => (
          <Pressable key={o.kind} onPress={() => setOpen(i)} accessibilityRole="button" accessibilityState={{ expanded: open === i }} style={[styles.opening, open === i && styles.openingOn, pointer]}>
            <Text style={[styles.openingKind, open === i && { color: ds.purple }]}>{o.kind}</Text>
            {open === i && (
              <Animated.View entering={FadeIn.duration(220)}>
                <Text style={styles.openingLine}>“{o.line}”</Text>
              </Animated.View>
            )}
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

const STUDIO_TIPS: Record<StudioKind, string[]> = {
  repurpose: [
    'A carousel version is great for saves; a short video is great for reach.',
    'Paste the caption of a post that did well and get a version for each platform.',
    'Every version can be edited before you use it. Make it sound like you.',
  ],
  hook: [
    'Dance and trend videos open with the move itself. The text on screen does the hook.',
    'Save a few hooks now and you’ll have them ready on a busy day.',
    'A mistake you made is a strong opening: people stay to hear how it ended.',
  ],
};

export function StudioRail({ kind }: { kind: StudioKind }) {
  return (
    <View style={styles.rail}>
      <ScrollView contentContainerStyle={styles.railScroll} showsVerticalScrollIndicator={false}>
        {kind === 'repurpose' && (
          <>
            <Animated.View entering={FadeInUp.duration(450).easing(ease)}><Allowance /></Animated.View>
          </>
        )}
        {kind === 'hook' && (
          <>
            <Animated.View entering={FadeInUp.duration(450).easing(ease)}><SavedHooks /></Animated.View>
            <Animated.View entering={FadeInUp.delay(80).duration(450).easing(ease)}><Openings /></Animated.View>
          </>
        )}
        <Animated.View entering={FadeInUp.delay(160).duration(450).easing(ease)}>
          <TipsCard tips={STUDIO_TIPS[kind]} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { width: RAIL_W, borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.9)' },
  railScroll: { padding: 20, gap: 14, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  big: { fontSize: 18, fontWeight: '800', color: ds.ink, marginTop: 4 },
  muted: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: ds.text3, marginTop: 2 },
  eyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: ds.text3 },
  track: { height: 8, borderRadius: 4, backgroundColor: ds.lavender, overflow: 'hidden', marginVertical: 10 },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: ds.purple },
  list: { gap: 8, marginTop: 12 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  hook: { padding: 10, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  hookLine: { fontSize: 13.5, fontWeight: '800', color: ds.ink },
  hookMeta: { fontSize: 11.5, fontWeight: '600', color: ds.text3, marginTop: 3 },
  opening: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  openingOn: { backgroundColor: 'rgba(245, 243, 255, 0.98)', borderWidth: 1, borderColor: ds.lavender },
  openingKind: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  openingLine: { fontSize: 13.5, fontWeight: '700', color: ds.ink, marginTop: 4 },
});
