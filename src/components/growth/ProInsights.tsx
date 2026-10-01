import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { ds, goldTokens } from '../../theme/colors';

// Pro insights (sample data until accounts sync): who the audience is, and
// growth month by month. Plain words, tap to explore, gentle animations.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const ProTag = () => (
  <View style={styles.proTag}>
    <Text style={styles.proTagText}>PRO</Text>
  </View>
);

function HBar({ label, pct, index, top }: { label: string; pct: number; index: number; top: boolean }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(index * 70, withTiming(pct / 100, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [pct, index, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.hRow}>
      <Text style={[styles.hLabel, top && styles.hLabelTop]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.hTrack}>
        <Animated.View style={[styles.hFill, top && styles.hFillTop, style]} />
      </View>
      <Text style={[styles.hPct, top && styles.hLabelTop]}>{pct}%</Text>
    </View>
  );
}

// ─── Who your audience is ───────────────────────────────────────────────────
type WhoTab = 'ages' | 'places' | 'times';
const WHO: Record<WhoTab, { label: string; rows: { label: string; pct: number }[]; note: string }> = {
  ages: {
    label: 'Ages',
    rows: [
      { label: '13–17', pct: 4 },
      { label: '18–24', pct: 38 },
      { label: '25–34', pct: 41 },
      { label: '35–44', pct: 12 },
      { label: '45+', pct: 5 },
    ],
    note: 'Most of your audience is 18 to 34, so everyday creator struggles land well.',
  },
  places: {
    label: 'Places',
    rows: [
      { label: 'Nigeria', pct: 34 },
      { label: 'United States', pct: 22 },
      { label: 'United Kingdom', pct: 14 },
      { label: 'Ghana', pct: 9 },
      { label: 'Canada', pct: 6 },
    ],
    note: 'Your audience spans time zones. Evenings in Lagos and London overlap best.',
  },
  times: {
    label: 'Online',
    rows: [
      { label: 'Morning', pct: 18 },
      { label: 'Afternoon', pct: 22 },
      { label: 'Evening', pct: 44 },
      { label: 'Late night', pct: 16 },
    ],
    note: 'Most people are online between 7 and 9 PM. That’s your best time to post.',
  },
};

export function WhoAudienceCard() {
  const [tab, setTab] = useState<WhoTab>('ages');
  const [w, setW] = useState(0);
  const keys = Object.keys(WHO) as WhoTab[];
  const idx = keys.indexOf(tab);
  const cell = w / keys.length;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(idx * cell, smooth);
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const data = WHO[tab];
  const max = Math.max(...data.rows.map((r) => r.pct));

  return (
    <GlassCard strong radius={26} padding={16}>
      <View style={styles.head}>
        <Text style={styles.title}>Who your audience is</Text>
        <ProTag />
      </View>
      <View
        style={styles.tabs}
        accessibilityRole="tablist"
        onLayout={(e) => {
          const nw = e.nativeEvent.layout.width - 6;
          if (Math.abs(nw - w) > 1) {
            setW(nw);
            x.value = idx * (nw / keys.length);
          }
        }}
      >
        {cell > 0 && <Animated.View pointerEvents="none" style={[styles.tabPill, { width: cell }, pill]} />}
        {keys.map((k) => {
          const on = k === tab;
          return (
            <Pressable
              key={k}
              onPress={() => {
                tick();
                setTab(k);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.tab, pointer]}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                {WHO[k].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View key={tab} style={styles.bars}>
        {data.rows.map((r, i) => (
          <HBar key={r.label} label={r.label} pct={r.pct} index={i} top={r.pct === max} />
        ))}
      </View>
      <Animated.View key={`n-${tab}`} entering={FadeIn.duration(220)} style={styles.note}>
        <Text style={styles.noteText}>{data.note}</Text>
      </Animated.View>
    </GlassCard>
  );
}

// ─── Growth month by month ──────────────────────────────────────────────────
const MONTHS = [
  { m: 'May', gain: 1240 },
  { m: 'Jun', gain: 1610 },
  { m: 'Jul', gain: 2080 },
  { m: 'Aug', gain: 2840 },
  { m: 'Sep', gain: 3950 },
  { m: 'Oct', gain: 5210, note: 'so far' },
];
const CHART_H = 110;

function MonthBar({ gain, max, index, on, label, onPress }: { gain: number; max: number; index: number; on: boolean; label: string; onPress: () => void }) {
  const h = useSharedValue(0);
  const sel = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    h.value = withDelay(100 + index * 70, withTiming((gain / max) * CHART_H, { duration: 560, easing: Easing.out(Easing.cubic) }));
  }, [gain, max, index, h]);
  useEffect(() => {
    sel.value = withTiming(on ? 1 : 0, smooth);
  }, [on, sel]);
  const fill = useAnimatedStyle(() => ({ height: h.value }));
  const onStyle = useAnimatedStyle(() => ({ opacity: sel.value }));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${label}, ${gain} new followers`} style={[styles.mCol, pointer]}>
      <View style={styles.mTrack}>
        <Animated.View style={[styles.mFill, fill]}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.mFillOn, onStyle]} />
        </Animated.View>
      </View>
      <Text style={[styles.mLabel, on && styles.mLabelOn]}>{label}</Text>
    </Pressable>
  );
}

export function MonthlyHistoryCard() {
  const [sel, setSel] = useState(MONTHS.length - 1);
  const max = Math.max(...MONTHS.map((m) => m.gain));
  const m = MONTHS[sel];
  const prev = MONTHS[sel - 1];
  const change = prev ? Math.round(((m.gain - prev.gain) / prev.gain) * 100) : null;
  return (
    <GlassCard strong radius={26} padding={16}>
      <View style={styles.head}>
        <Text style={styles.title}>Growth month by month</Text>
        <ProTag />
      </View>
      <Text style={styles.sub}>New followers each month, all platforms</Text>
      <View style={styles.mChart}>
        {MONTHS.map((x, i) => (
          <MonthBar
            key={x.m}
            gain={x.gain}
            max={max}
            index={i}
            on={i === sel}
            label={x.m}
            onPress={() => {
              tick();
              setSel(i);
            }}
          />
        ))}
      </View>
      <Animated.View key={sel} entering={FadeIn.duration(220)} style={styles.note}>
        <View style={styles.mDetailRow}>
          <Text style={styles.mDetailMonth}>
            {m.m}
            {m.note ? ` (${m.note})` : ''}
          </Text>
          <Text style={styles.mDetailGain}>+{m.gain.toLocaleString('en-US')}</Text>
        </View>
        <Text style={styles.noteText}>
          {change === null ? 'The first month in your history.' : change >= 0 ? `Up ${change}% on ${prev!.m}.` : `Down ${Math.abs(change)}% on ${prev!.m}.`}
        </Text>
      </Animated.View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 17, fontWeight: '800', color: ds.ink, flexShrink: 1 },
  sub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
  proTag: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  tabs: { flexDirection: 'row', padding: 3, height: 40, borderRadius: 999, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender, marginTop: 12 },
  tabPill: { position: 'absolute', top: 3, left: 3, bottom: 3, borderRadius: 999, backgroundColor: ds.purple },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  tabTextOn: { color: '#FFFFFF' },
  bars: { gap: 10, marginTop: 16 },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hLabel: { width: 92, fontSize: 12.5, fontWeight: '700', color: ds.text2 },
  hLabelTop: { color: ds.ink, fontWeight: '800' },
  hTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: ds.lavender, overflow: 'hidden' },
  hFill: { height: 10, borderRadius: 5, backgroundColor: '#A99BFF' },
  hFillTop: { backgroundColor: ds.purple },
  hPct: { width: 34, textAlign: 'right', fontSize: 12.5, fontWeight: '700', color: ds.text2 },
  note: { marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  noteText: { fontSize: 13, lineHeight: 18, color: ds.text2 },
  mChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 },
  mCol: { flex: 1, alignItems: 'center' },
  mTrack: { width: '100%', height: CHART_H, justifyContent: 'flex-end' },
  mFill: { width: '100%', borderRadius: 8, backgroundColor: ds.lavender, overflow: 'hidden' },
  mFillOn: { backgroundColor: ds.purple },
  mLabel: { fontSize: 11, fontWeight: '700', color: ds.text3, marginTop: 6 },
  mLabelOn: { color: ds.purple, fontWeight: '800' },
  mDetailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mDetailMonth: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  mDetailGain: { fontSize: 14.5, fontWeight: '800', color: ds.greenFill },
});
