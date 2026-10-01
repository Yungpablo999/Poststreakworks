import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { VOICES, VoiceAvatar } from '../voice/VoiceSheets';
import { TipsCard, RAIL_W } from './TodayRail';
import { openComposer } from './webActions';
import {
  PLATFORM_FORMATS,
  getRepurposeAllowance,
  getSavedHooks,
  subscribeToRepurposes,
  subscribeToSavedHooks,
} from '../../data';
import { ds, goldTokens } from '../../theme/colors';

// Desktop web app: the panel beside each studio, with things that help with
// that tool, so the studio pages use the screen instead of leaving it empty.
//   Repurpose: this week's free use, and what each platform gets
//   Hook Studio: your saved hooks (live), and openings that work
//   Voice Studio: voices to try (tap to hear a sample), and your minutes

export type StudioKind = 'repurpose' | 'hook' | 'voice';

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);

const PLATFORM_NAMES: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', threads: 'Threads', facebook: 'Facebook' };

// ─── Repurpose ──────────────────────────────────────────────────────────────
function Allowance({ persona, tier }: { persona: 'new' | 'returning'; tier: 'free' | 'pro' }) {
  // Read just the number used (a fresh object each read would re-render forever)
  const used = useSyncExternalStore(subscribeToRepurposes, () => getRepurposeAllowance(persona, tier).usedThisWeek, () => getRepurposeAllowance(persona, tier).usedThisWeek);
  const a = { usedThisWeek: used, weeklyLimit: getRepurposeAllowance(persona, tier).weeklyLimit };
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
      <Text style={styles.muted}>{left === null ? 'Repurpose as much as you like with Pro.' : 'Each Repurpose watches your post closely, so free plans get one a week. It resets on Monday.'}</Text>
    </GlassCard>
  );
}

function WhatYouGet() {
  return (
    <GlassCard strong radius={22} padding={16}>
      <Text style={styles.title}>What each platform gets</Text>
      <Text style={styles.muted}>Switch any version’s format after it’s made.</Text>
      <View style={styles.list}>
        {Object.entries(PLATFORM_FORMATS).map(([id, formats], i) => (
          <Animated.View key={id} entering={FadeInUp.delay(i * 60).duration(380).easing(ease)} style={styles.platRow}>
            <PlatformLogo type={id as PlatformLogoType} size={28} />
            <View style={styles.flex}>
              <Text style={styles.platName}>{PLATFORM_NAMES[id] ?? id}</Text>
              <View style={styles.chips}>
                {formats.map((f) => (
                  <View key={f.id} style={styles.chip}>
                    <Text style={styles.chipText}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
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

// ─── Voice Studio ───────────────────────────────────────────────────────────
function Bars({ playing }: { playing: boolean }) {
  return (
    <View style={styles.bars}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Bar key={i} i={i} playing={playing} />
      ))}
    </View>
  );
}
function Bar({ i, playing }: { i: number; playing: boolean }) {
  const h = useSharedValue(0.3);
  useEffect(() => {
    h.value = playing ? withRepeat(withTiming(1, { duration: 300 + i * 70, easing: Easing.inOut(Easing.ease) }), -1, true) : withTiming(0.3, { duration: 200 });
  }, [playing, i, h]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: h.value }] }));
  return <Animated.View style={[styles.bar, playing && { backgroundColor: ds.purple }, style]} />;
}

function VoicesToTry() {
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setPlaying(null), 2400);
    return () => clearTimeout(id);
  }, [playing]);
  return (
    <GlassCard strong radius={22} padding={16}>
      <Text style={styles.title}>Voices to try</Text>
      <Text style={styles.muted}>Tap one to hear a short sample.</Text>
      <View style={styles.list}>
        {VOICES.slice(0, 5).map((v, i) => (
          <Animated.View key={v.id} entering={FadeInUp.delay(i * 60).duration(380).easing(ease)}>
            <Pressable onPress={() => setPlaying(playing === v.id ? null : v.id)} accessibilityRole="button" accessibilityLabel={`Hear ${v.name}`} style={({ pressed }) => [styles.voice, playing === v.id && styles.voiceOn, pointer, pressed && { transform: [{ scale: 0.98 }] }]}>
              <VoiceAvatar voice={v} size={36} />
              <View style={styles.flex}>
                <Text style={styles.platName}>{v.name}</Text>
                <Text style={styles.muted}>{v.feel}</Text>
              </View>
              <Bars playing={playing === v.id} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </GlassCard>
  );
}

function Minutes({ tier }: { tier: 'free' | 'pro' }) {
  return (
    <GlassCard strong radius={22} padding={16}>
      <Text style={styles.eyebrow}>VOICE MINUTES</Text>
      <Text style={styles.big}>{tier === 'pro' ? '150 minutes a month' : 'Included with Pro'}</Text>
      <Text style={styles.muted}>{tier === 'pro' ? 'That’s about 150 one-minute videos. You can add more any time.' : 'Pro includes 150 minutes of voiceovers a month in your own voice.'}</Text>
      {tier !== 'pro' && (
        <View style={styles.proTag}>
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      )}
    </GlassCard>
  );
}

const STUDIO_TIPS: Record<StudioKind, string[]> = {
  repurpose: [
    'Paste a link to someone else’s post and I’ll give you new ideas in the same style. I never copy it.',
    'A carousel version is great for saves; a short video is great for reach.',
    'Your own video works best: I watch it and keep what made it work.',
  ],
  hook: [
    'Dance and trend videos open with the move itself. The text on screen does the hook.',
    'Save a few hooks now and you’ll have them ready on a busy day.',
    'Openings with a mistake kept people watching longest for many creators.',
  ],
  voice: [
    'Record somewhere quiet and read naturally. One minute is enough.',
    'Steady suits tutorials; Lively suits stories and reactions.',
    'You can keep a few voices and switch per video.',
  ],
};

export function StudioRail({ kind, persona, tier }: { kind: StudioKind; persona: 'new' | 'returning'; tier: 'free' | 'pro' }) {
  return (
    <View style={styles.rail}>
      <ScrollView contentContainerStyle={styles.railScroll} showsVerticalScrollIndicator={false}>
        {kind === 'repurpose' && (
          <>
            <Animated.View entering={FadeInUp.duration(450).easing(ease)}><Allowance persona={persona} tier={tier} /></Animated.View>
            <Animated.View entering={FadeInUp.delay(80).duration(450).easing(ease)}><WhatYouGet /></Animated.View>
          </>
        )}
        {kind === 'hook' && (
          <>
            <Animated.View entering={FadeInUp.duration(450).easing(ease)}><SavedHooks /></Animated.View>
            <Animated.View entering={FadeInUp.delay(80).duration(450).easing(ease)}><Openings /></Animated.View>
          </>
        )}
        {kind === 'voice' && (
          <>
            <Animated.View entering={FadeInUp.duration(450).easing(ease)}><VoicesToTry /></Animated.View>
            <Animated.View entering={FadeInUp.delay(80).duration(450).easing(ease)}><Minutes tier={tier} /></Animated.View>
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
  flex: { flex: 1, minWidth: 0 },
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
  platRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  platName: { fontSize: 13.5, fontWeight: '800', color: ds.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  chip: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  chipText: { fontSize: 10.5, fontWeight: '800', color: ds.purple },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  hook: { padding: 10, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  hookLine: { fontSize: 13.5, fontWeight: '800', color: ds.ink },
  hookMeta: { fontSize: 11.5, fontWeight: '600', color: ds.text3, marginTop: 3 },
  opening: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  openingOn: { backgroundColor: 'rgba(245, 243, 255, 0.98)', borderWidth: 1, borderColor: ds.lavender },
  openingKind: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  openingLine: { fontSize: 13.5, fontWeight: '700', color: ds.ink, marginTop: 4 },
  voice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'transparent' },
  voiceOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  bar: { width: 3, height: 20, borderRadius: 2, backgroundColor: '#C9BEFA' },
  proTag: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
});
