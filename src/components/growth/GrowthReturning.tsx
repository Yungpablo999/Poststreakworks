import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { PreviewChart } from './GrowthBlocks';
import { ds } from '../../theme/colors';

// Growth for creators who've been posting: the same glass cards as day 0,
// filled with their numbers (sample data until accounts sync). Plain words,
// no "viral" or "top 5%" hype, gold only for Pro.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

function Bar({ ratio, delay = 0, color = ds.purple }: { ratio: number; delay?: number; color?: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(250 + delay, withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [ratio, delay, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

function CountUp({ to, format, style }: { to: number; format: (n: number) => string; style: object }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / 900);
      setN(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <Text style={style}>{format(n)}</Text>;
}

const UpChip = ({ label }: { label: string }) => (
  <View style={styles.upChip}>
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M5 12l7-7 7 7" stroke={ds.greenFill} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
    <Text style={styles.upChipText}>{label}</Text>
  </View>
);

const Chevron = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Total audience ─────────────────────────────────────────────────────────
export function AudienceHero({ onOpen }: { onOpen: () => void }) {
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 520) - 40 - 40;
  const stats = [
    { label: 'New followers', value: '1.2K' },
    { label: 'Profile visits', value: '1.9K' },
    { label: 'Comments', value: '600' },
  ];
  return (
    <PressableCard onPress={onOpen} accessibilityLabel="Total audience 24.8K. See the full breakdown">
      <GlassCard strong radius={26} padding={20}>
        <View style={styles.rowBetween}>
          <Text style={styles.eyebrow}>TOTAL AUDIENCE</Text>
          <Text style={styles.muted}>Last 30 days</Text>
        </View>
        <View style={styles.bigRow}>
          <CountUp to={24.8} format={(n) => `${n.toFixed(1)}K`} style={styles.big} />
          <UpChip label="12.4%" />
        </View>
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chart} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PreviewChart width={chartW} height={96} color={ds.purple} />
        </View>
        <View style={styles.seeMore}>
          <Text style={styles.seeMoreText}>See full breakdown</Text>
          <Chevron />
        </View>
      </GlassCard>
    </PressableCard>
  );
}

// ─── Best post ──────────────────────────────────────────────────────────────
export function BestPostCard({ onWhy, onMore }: { onWhy: () => void; onMore: () => void }) {
  const metrics = [
    { label: 'Views', value: '14.2K', note: '42% more than usual', ratio: 0.85 },
    { label: 'Watch time', value: '42s', note: '35% longer than usual', ratio: 0.7 },
    { label: 'Shares', value: '84', note: 'Your most shared this month', ratio: 0.92 },
  ];
  return (
    <GlassCard strong radius={26} padding={18}>
      <View style={styles.postTop}>
        <Image source={require('../../../assets/images/amara-portrait.jpg')} style={styles.thumb} resizeMode="cover" />
        <View style={styles.flex}>
          <View style={styles.platChip}>
            <Text style={styles.platChipText}>TikTok · Video</Text>
          </View>
          <Text style={styles.postTitle}>“3 creator mistakes I stopped making this year”</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        {metrics.map((m, i) => (
          <View key={m.label}>
            <View style={styles.rowBetween}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
            <Bar ratio={m.ratio} delay={i * 120} />
            <Text style={styles.metricNote}>{m.note}</Text>
          </View>
        ))}
      </View>
      <View style={styles.postActions}>
        <AppButton title="See why it worked" onPress={onWhy} />
        <AppButton title="Make more like this" variant="glass" onPress={onMore} />
      </View>
    </GlassCard>
  );
}

// ─── What's working (formats) ───────────────────────────────────────────────
const FORMATS = [
  { id: 'video', name: 'Short videos', score: 0.78, note: 'People watched most of the way through. Keep these as your main format.' },
  { id: 'text', name: 'Text posts', score: 0.54, note: 'Good for starting conversations. Questions got the most replies.' },
  { id: 'carousel', name: 'Carousels', score: 0.32, note: 'People swiped less this week. Try a stronger first slide.' },
];

export function FormatsCard() {
  const [sel, setSel] = useState('video');
  const f = FORMATS.find((x) => x.id === sel)!;
  return (
    <GlassCard strong radius={26} padding={18}>
      <Text style={styles.cardTitle}>What’s working</Text>
      <Text style={styles.cardSub}>How much of each post people watched or read</Text>
      <View style={styles.formats}>
        {FORMATS.map((x, i) => {
          const on = x.id === sel;
          return (
            <Pressable
              key={x.id}
              onPress={() => {
                tick();
                setSel(x.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.formatRow, on && styles.formatRowOn, pointer]}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.formatName, on && { color: ds.purple }]}>{x.name}</Text>
                <Text style={styles.formatScore}>{Math.round(x.score * 100)}%</Text>
              </View>
              <Bar ratio={x.score} delay={i * 120} color={on ? ds.purple : '#C4B5FD'} />
            </Pressable>
          );
        })}
      </View>
      <Animated.View key={sel} entering={FadeIn.duration(220)} style={styles.note}>
        <Text style={styles.noteText}>
          <Text style={styles.noteBold}>{f.name}: </Text>
          {f.note}
        </Text>
      </Animated.View>
    </GlassCard>
  );
}

// ─── Milestones ─────────────────────────────────────────────────────────────
export function MilestonesCard({ onChallenge }: { onChallenge: () => void }) {
  return (
    <GlassCard radius={26} padding={0}>
      <View style={styles.msHeader}>
        <Text style={styles.cardTitle}>Milestones</Text>
        <Text style={styles.cardSub}>Goals you’re close to</Text>
      </View>

      <View style={[styles.ms, styles.msLine]}>
        <View style={styles.msIcon}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={styles.flex}>
          <Text style={styles.msTitle}>15K followers on TikTok</Text>
          <Bar ratio={14.2 / 15} />
          <Text style={styles.msSub}>14.2K now · 800 to go</Text>
        </View>
      </View>

      <PressableCard onPress={onChallenge} accessibilityLabel="Post 3 times this week, 1 of 3 done" haptic>
        <View style={[styles.ms, styles.msLine]}>
          <View style={styles.msIcon}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2} />
              <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={styles.flex}>
            <Text style={styles.msTitle}>Post 3 times this week</Text>
            <Bar ratio={1 / 3} />
            <Text style={styles.msSub}>1 of 3 posted · see the challenge</Text>
          </View>
          <Chevron />
        </View>
      </PressableCard>

      <View style={styles.ms}>
        <View style={[styles.msIcon, styles.msIconDone]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={styles.flex}>
          <Text style={styles.msTitle}>Checked in 7 days in a row</Text>
          <Text style={[styles.msSub, { color: ds.greenFill }]}>Done last week</Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ─── Weekly report ──────────────────────────────────────────────────────────
export function WeeklyReportCard() {
  const rows = [
    { label: 'Views', value: 'up 22%', icon: <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" /> },
    { label: 'Followers', value: 'up 14%', icon: <Path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" /> },
    { label: 'Best format', value: 'Short videos', icon: <Path d="M15 10l5-3v10l-5-3M4 6h11v12H4z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" /> },
    { label: 'Best time', value: 'Wed, 7:30 PM', icon: <><Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2} /><Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" /></> },
  ];
  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.reportTop}>
        <View style={styles.msIcon}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="3" stroke={ds.purple} strokeWidth={2} />
            <Path d="M7 14l3-3 3 2 4-5" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={styles.flex}>
          <Text style={styles.msTitle}>Last week’s report</Text>
          <Text style={styles.msSub}>A quick look at how it went</Text>
        </View>
      </View>
      <View style={styles.reportGrid}>
        {rows.map((r) => (
          <View key={r.label} style={styles.reportTile}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              {r.icon}
            </Svg>
            <Text style={styles.reportLabel}>{r.label}</Text>
            <Text style={styles.reportValue}>{r.value}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const glass = { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  muted: { fontSize: 12, fontWeight: '700', color: ds.text3 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },

  bigRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  big: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: ds.ink, letterSpacing: -1.2 },
  upChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 999, backgroundColor: ds.greenBg },
  upChipText: { fontSize: 12, fontWeight: '800', color: ds.greenFill },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', ...glass },
  statValue: { fontSize: 17, fontWeight: '800', color: ds.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: ds.text3, marginTop: 2, textAlign: 'center' },
  chart: { marginTop: 14 },
  seeMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  seeMoreText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },

  barTrack: { height: 8, borderRadius: 4, backgroundColor: ds.lavender, overflow: 'hidden', marginTop: 6 },
  barFill: { height: 8, borderRadius: 4 },

  postTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 64, height: 80, borderRadius: 14 },
  platChip: { alignSelf: 'flex-start', paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  platChipText: { fontSize: 11, fontWeight: '800', color: ds.purple },
  postTitle: { fontSize: 15.5, lineHeight: 21, fontWeight: '800', color: ds.ink, marginTop: 6 },
  metrics: { gap: 12, marginTop: 16 },
  metricLabel: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  metricValue: { fontSize: 14, fontWeight: '800', color: ds.ink },
  metricNote: { fontSize: 12, fontWeight: '600', color: ds.greenFill, marginTop: 4 },
  postActions: { gap: 10, marginTop: 16 },

  formats: { gap: 8, marginTop: 14 },
  formatRow: { padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent' },
  formatRowOn: { backgroundColor: ds.lavenderSoft, borderColor: ds.lavender },
  formatName: { fontSize: 14, fontWeight: '800', color: ds.ink },
  formatScore: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  note: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  noteText: { fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  noteBold: { fontWeight: '800', color: ds.ink },

  msHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  ms: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  msLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  msIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  msIconDone: { backgroundColor: ds.greenFill },
  msTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  msSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 4 },

  reportTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 14 },
  reportTile: { width: '48.5%', padding: 12, borderRadius: 16, ...glass },
  reportLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3, marginTop: 6 },
  reportValue: { fontSize: 14, fontWeight: '800', color: ds.ink, marginTop: 1 },
});
