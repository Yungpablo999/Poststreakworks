import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds, goldTokens } from '../../theme/colors';

// Pro: the caption reshaped for each platform's habits and limits.
// TikTok: short and punchy, a few tags. Instagram: full caption, tags at the
// end. YouTube Shorts: a title plus a description. Threads: no tags, talky.

type Plat = 'tiktok' | 'instagram' | 'youtube' | 'threads';
const PLATS: { id: Plat; name: string; limit: number; note: string }[] = [
  { id: 'tiktok', name: 'TikTok', limit: 4000, note: 'Short first line, 3 to 5 hashtags.' },
  { id: 'instagram', name: 'Instagram', limit: 2200, note: 'Full caption. Only the first line shows before “more”.' },
  { id: 'youtube', name: 'YouTube', limit: 100, note: 'Shorts title (100 max), with the rest as the description.' },
  { id: 'threads', name: 'Threads', limit: 500, note: 'No hashtags. Reads like a chat.' },
];

// The opening: whole sentences until it says something (a lone "Honestly?"
// isn't enough). Returns the opening and whatever is left.
const splitOpening = (t: string) => {
  const parts = t.match(/[^.!?\n]+[.!?]?/g)?.map((p) => p.trim()).filter(Boolean) ?? [t];
  const used: string[] = [];
  for (const p of parts) {
    used.push(p);
    if (used.join(' ').length >= 40) break;
  }
  return { opening: used.join(' ') || t, rest: parts.slice(used.length).join(' ') };
};
const firstSentence = (t: string) => splitOpening(t).opening;

function fit(p: Plat, body: string, ending: string, tags: string) {
  const tagList = tags.split(/\s+/).filter((x) => x.startsWith('#'));
  switch (p) {
    case 'tiktok':
      return { main: [firstSentence(body), ending, tagList.slice(0, 4).join(' ')].filter(Boolean).join('\n\n'), extra: null as string | null };
    case 'instagram':
      return { main: [body, ending, tagList.join(' ')].filter(Boolean).join('\n\n'), extra: null };
    case 'youtube': {
      const { opening, rest } = splitOpening(body);
      const title = opening.slice(0, 100);
      return { main: title, extra: [rest, ending, tagList.slice(0, 3).join(' ')].filter(Boolean).join('\n\n') };
    }
    case 'threads':
      return { main: [body, ending].filter(Boolean).join('\n\n').slice(0, 500), extra: null };
  }
}

function Tabs({ value, onChange }: { value: Plat; onChange: (p: Plat) => void }) {
  const [w, setW] = useState(0);
  const idx = PLATS.findIndex((p) => p.id === value);
  const cell = w / PLATS.length;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(idx * cell, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.tabs}
      accessibilityRole="tablist"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 8;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = idx * (nw / PLATS.length);
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.tabPill, { width: cell }, pill]} />}
      {PLATS.map((p) => {
        const on = p.id === value;
        return (
          <Pressable
            key={p.id}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(p.id);
            }}
            accessibilityRole="tab"
            accessibilityLabel={p.name}
            accessibilityState={{ selected: on }}
            style={[styles.tab, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
          >
            <View style={{ opacity: on ? 1 : 0.55 }}>
              <PlatformLogo type={p.id as PlatformLogoType} size={26} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PlatformFitCard({ body, ending, tags, onCopied }: { body: string; ending: string; tags: string; onCopied: (msg: string) => void }) {
  const [plat, setPlat] = useState<Plat>('tiktok');
  const meta = PLATS.find((p) => p.id === plat)!;
  const out = fit(plat, body.trim(), ending.trim(), tags);
  const len = out.main.length;
  const over = len > meta.limit;
  const bar = useSharedValue(0);
  useEffect(() => {
    bar.value = withTiming(Math.min(1, len / meta.limit), { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [len, meta.limit, bar]);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(out.extra ? `${out.main}\n\n${out.extra}` : out.main);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCopied(`${meta.name} caption copied`);
    } catch {
      onCopied('Couldn’t copy. Try again.');
    }
  };

  return (
    <GlassCard strong radius={24} padding={16}>
      <View style={styles.head}>
        <Text style={styles.title}>Fit for each platform</Text>
        <View style={styles.proTag}>
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      </View>
      <Text style={styles.sub}>Your caption, reshaped for where it’s going</Text>
      <Tabs value={plat} onChange={setPlat} />

      <Animated.View key={plat} entering={FadeIn.duration(220)}>
        <Text style={styles.note}>{meta.note}</Text>
        {plat === 'youtube' && <Text style={styles.part}>TITLE</Text>}
        <View style={styles.preview}>
          <Text style={styles.previewText}>{out.main}</Text>
        </View>
        {out.extra ? (
          <>
            <Text style={styles.part}>DESCRIPTION</Text>
            <View style={styles.preview}>
              <Text style={styles.previewText}>{out.extra}</Text>
            </View>
          </>
        ) : null}
        <View style={styles.meter}>
          <View style={styles.meterTrack}>
            <Animated.View style={[styles.meterFill, over && styles.meterOver, barStyle]} />
          </View>
          <Text style={[styles.meterText, over && { color: '#DC2626' }]}>
            {len.toLocaleString('en-US')} / {meta.limit.toLocaleString('en-US')}
          </Text>
        </View>
      </Animated.View>

      <Pressable onPress={copy} accessibilityRole="button" style={({ pressed }) => [styles.copy, pressed && { transform: [{ scale: 0.97 }] }]}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
          <Rect x="8" y="8" width="12" height="12" rx="2.5" stroke={ds.purple} strokeWidth={2.2} />
          <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke={ds.purple} strokeWidth={2.2} />
        </Svg>
        <Text style={styles.copyText}>Copy for {meta.name}</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16.5, fontWeight: '800', color: ds.ink },
  sub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2, marginBottom: 12 },
  proTag: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  tabs: { flexDirection: 'row', padding: 4, height: 50, borderRadius: 16, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender },
  tabPill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 12, backgroundColor: '#FFFFFF', shadowColor: ds.purple, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 12.5, lineHeight: 17, fontWeight: '700', color: ds.text2, marginTop: 12 },
  part: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: ds.purple, marginTop: 10 },
  preview: { marginTop: 6, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  previewText: { fontSize: 14, lineHeight: 20, color: ds.ink },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  meterTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: ds.lavender, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: ds.purple },
  meterOver: { backgroundColor: '#DC2626' },
  meterText: { fontSize: 11.5, fontWeight: '800', color: ds.text3 },
  copy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, marginTop: 12, borderRadius: 14, backgroundColor: ds.lavender },
  copyText: { fontSize: 14, fontWeight: '800', color: ds.purple },
});
