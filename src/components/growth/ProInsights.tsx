import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { ds, goldTokens } from '../../theme/colors';
import { monthName } from '../../utils/format';

// Pro: how the audience grew, month by month, from the follower counts the connected accounts have
// reported. A month appears once there is a reading in it; with a single month there is nothing to
// compare yet, and it says so.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

export const ProTag = () => (
  <View style={styles.proTag}>
    <Text style={styles.proTagText}>PRO</Text>
  </View>
);

const CHART_H = 110;
const thisMonth = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

function MonthBar({ gain, max, index, on, label, onPress }: { gain: number; max: number; index: number; on: boolean; label: string; onPress: () => void }) {
  const h = useSharedValue(0);
  const sel = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    h.value = withDelay(100 + index * 70, withTiming(Math.max(4, (Math.max(0, gain) / max) * CHART_H), { duration: 560, easing: Easing.out(Easing.cubic) }));
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

export function MonthlyHistoryCard({ months }: { months: { month: string; gain: number }[] }) {
  const [sel, setSel] = useState(Math.max(0, months.length - 1));
  useEffect(() => setSel(Math.max(0, months.length - 1)), [months.length]);
  if (months.length === 0) return null;

  const max = Math.max(1, ...months.map((m) => Math.max(0, m.gain)));
  const m = months[Math.min(sel, months.length - 1)]!;
  const prev = months[sel - 1];
  const change = prev && prev.gain > 0 ? Math.round(((m.gain - prev.gain) / prev.gain) * 100) : null;
  const sign = (n: number) => (n > 0 ? `+${n.toLocaleString('en-US')}` : n < 0 ? `−${Math.abs(n).toLocaleString('en-US')}` : '0');

  return (
    <GlassCard strong radius={26} padding={16}>
      <View style={styles.head}>
        <Text style={styles.title}>Growth month by month</Text>
        <ProTag />
      </View>
      <Text style={styles.sub}>New followers each month, all your accounts</Text>
      <View style={styles.mChart}>
        {months.map((x, i) => (
          <MonthBar
            key={x.month}
            gain={x.gain}
            max={max}
            index={i}
            on={i === sel}
            label={monthName(x.month)}
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
            {monthName(m.month)}
            {m.month === thisMonth() ? ' (so far)' : ''}
          </Text>
          <Text style={[styles.mDetailGain, m.gain < 0 && { color: ds.text2 }]}>{sign(m.gain)}</Text>
        </View>
        <Text style={styles.noteText}>
          {m.month === thisMonth() && months.length > 1
            ? 'The month isn’t over yet, so it isn’t compared with the last one.'
            : months.length === 1
              ? 'This is the first month we’ve been tracking. Next month you’ll see how it compares.'
              : !prev
                ? 'The first month in your history.'
                : change === null
                  ? `${monthName(prev.month)} had ${sign(prev.gain)}.`
                  : change >= 0
                    ? `Up ${change}% on ${monthName(prev.month)}.`
                    : `Down ${Math.abs(change)}% on ${monthName(prev.month)}.`}
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
