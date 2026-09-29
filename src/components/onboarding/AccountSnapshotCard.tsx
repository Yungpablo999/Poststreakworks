import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { PlatformLogo, type PlatformLogoType } from './PlatformLogo';
import { ds } from '../../theme/colors';
import type { AccountSnapshot } from '../../data';

// "Your account right now": the creator's own recent numbers from the platform
// they connected, the opportunity they're missing (from their data, not a
// scare stat), their last 30 days vs. 30 days with the plan, and deeper
// insights locked until they save the plan. Shows a "Sample data" tag while
// the app runs on mock data.

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
};

// 3 posts a week, spread over the next 30 days
const PLANNED_DAYS = Array.from({ length: 30 }, (_, i) => i % 7 === 0 || i % 7 === 2 || i % 7 === 4);

// 30 days as two even rows of 15; dots stretch to fit any screen width
function DotRow({ days, planned = false, delay }: { days: boolean[]; planned?: boolean; delay: number }) {
  const rows = [days.slice(0, 15), days.slice(15, 30)];
  return (
    <View style={styles.dotGrid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.dotRow}>
          {row.map((on, c) => {
            const i = r * 15 + c;
            return (
              <Animated.View
                key={i}
                entering={on ? ZoomIn.delay(delay + i * 18).duration(220) : FadeIn.delay(delay).duration(200)}
                style={[styles.dot, on && (planned ? styles.dotPlanned : styles.dotPosted)]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function AccountSnapshotCard({ snapshot }: { snapshot: AccountSnapshot }) {
  const name = PLATFORM_NAMES[snapshot.platform] ?? snapshot.platform;
  const plannedCount = PLANNED_DAYS.filter(Boolean).length;
  const missed =
    snapshot.postsAtBestTime < snapshot.recentPosts
      ? `Your posts do best around ${snapshot.bestTime}, but only ${snapshot.postsAtBestTime} of your last ${snapshot.recentPosts} went out then.`
      : `Your posts do best around ${snapshot.bestTime}. Posting there more often is the easiest win.`;

  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.headerRow}>
        <PlatformLogo type={snapshot.platform as PlatformLogoType} size={26} />
        <Text style={styles.eyebrow}>YOUR {name.toUpperCase()} RIGHT NOW</Text>
        {snapshot.isSample && (
          <View style={styles.sampleTag}>
            <Text style={styles.sampleTagText}>Sample data</Text>
          </View>
        )}
      </View>

      {/* Their numbers */}
      <View style={styles.statsRow}>
        {[
          { label: 'Days posted', value: `${snapshot.postingDaysLast30}/30` },
          { label: 'Avg views', value: snapshot.avgViews },
          { label: 'Best time', value: snapshot.bestTime },
        ].map((s, i) => (
          <Animated.View key={s.label} entering={FadeIn.delay(150 + i * 90).duration(400)} style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* What they're missing, from their own data */}
      <View style={styles.missedBox}>
        <Text style={styles.missedLabel}>WHAT YOU'RE MISSING</Text>
        <Text style={styles.missedText}>{missed}</Text>
      </View>

      {/* Last 30 days vs. the plan */}
      <View style={styles.compare}>
        <View style={styles.compareHead}>
          <Text style={styles.compareTitle}>Last 30 days</Text>
          <Text style={styles.compareCount}>{snapshot.postingDaysLast30} posts</Text>
        </View>
        <DotRow days={snapshot.postedDays} delay={350} />
        <View style={[styles.compareHead, { marginTop: 12 }]}>
          <Text style={[styles.compareTitle, { color: ds.purple }]}>Next 30 days, with your plan</Text>
          <Text style={[styles.compareCount, { color: ds.purple }]}>{plannedCount} posts</Text>
        </View>
        <DotRow days={PLANNED_DAYS} planned delay={700} />
      </View>

      {/* Deeper insights, locked until they save */}
      <View style={styles.locked}>
        <Svg width="100%" height={70} viewBox="0 0 300 70" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="lockedFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ds.purple} stopOpacity={0.35} />
              <Stop offset="1" stopColor={ds.purple} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d="M0 58 C40 50 60 54 90 40 C120 26 150 36 180 24 C210 12 240 20 300 8 L300 70 L0 70 Z" fill="url(#lockedFill)" />
          <Path d="M0 58 C40 50 60 54 90 40 C120 26 150 36 180 24 C210 12 240 20 300 8" stroke={ds.purple} strokeWidth={2.5} fill="none" />
          {[20, 70, 120, 170, 220, 270].map((x, i) => (
            <Rect key={x} x={x} y={62 - (i % 3) * 6} width={14} height={8 + (i % 3) * 6} rx={3} fill="#A78BFA" opacity={0.5} />
          ))}
        </Svg>
        <BlurView intensity={22} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.lockOverlay}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Rect x="5" y="11" width="14" height="10" rx="2" stroke={ds.ink} strokeWidth={2.2} />
            <Path d="M8 11V8a4 4 0 118 0v3" stroke={ds.ink} strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.lockText}>Audience, top formats and trends unlock when you save your plan</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: ds.purple, flexShrink: 1 },
  sampleTag: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  sampleTagText: { fontSize: 10.5, fontWeight: '700', color: ds.text2 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: ds.line,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: ds.ink, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', color: ds.text2, marginTop: 2 },
  missedBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 243, 255, 0.9)',
    borderLeftWidth: 3,
    borderLeftColor: ds.purple,
  },
  missedLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  missedText: { fontSize: 14, lineHeight: 20, color: ds.ink, marginTop: 4, fontWeight: '600' },
  compare: { marginTop: 14 },
  compareHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  compareTitle: { fontSize: 12.5, fontWeight: '800', color: ds.text2, flexShrink: 1 },
  compareCount: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  dotGrid: { gap: 4 },
  dotRow: { flexDirection: 'row', gap: 4 },
  dot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 20, 32, 0.08)',
  },
  dotPosted: { backgroundColor: ds.text2 },
  dotPlanned: { backgroundColor: ds.purple },
  locked: {
    marginTop: 16,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  lockText: { flexShrink: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '700', color: ds.ink, textAlign: 'center' },
});
