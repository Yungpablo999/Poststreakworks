import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { ds } from '../../theme/colors';

// Building blocks for the Growth tab. Day 0 shows no fake numbers: the chart
// is a clearly-labelled preview line, and every empty state says what's coming.

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── A preview line that draws itself (no real data) ───────────────────────
function PreviewChart({ width, height }: { width: number; height: number }) {
  const reduceMotion = useReducedMotion();
  const draw = useSharedValue(reduceMotion ? 1 : 0);
  const shimmer = useSharedValue(0);
  const len = width * 1.4;

  useEffect(() => {
    if (reduceMotion) return;
    draw.value = withDelay(250, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    shimmer.value = withDelay(1700, withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1, false));
  }, [reduceMotion, draw, shimmer]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - draw.value) }));
  const areaStyle = useAnimatedStyle(() => ({ opacity: draw.value * (0.7 + 0.3 * shimmer.value) }));

  const w = width;
  const h = height;
  const d = `M0 ${h * 0.82} C ${w * 0.18} ${h * 0.78}, ${w * 0.28} ${h * 0.6}, ${w * 0.42} ${h * 0.62} S ${w * 0.66} ${h * 0.4}, ${w * 0.78} ${h * 0.34} S ${w * 0.94} ${h * 0.14}, ${w} ${h * 0.1}`;

  return (
    <View style={{ width: w, height: h }}>
      <Animated.View style={[StyleSheet.absoluteFill, areaStyle]}>
        <Svg width={w} height={h}>
          <Defs>
            <SvgGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ds.purple} stopOpacity={0.16} />
              <Stop offset="1" stopColor={ds.purple} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <Path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#gArea)" />
        </Svg>
      </Animated.View>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <AnimatedPath
          d={d}
          stroke="#A99BFF"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${len} ${len}`}
          animatedProps={lineProps}
        />
      </Svg>
    </View>
  );
}

export function AudienceEmptyHero({ connectedCount, onConnect }: { connectedCount: number; onConnect: () => void }) {
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 520) - 40 - 40;
  const syncing = connectedCount > 0;
  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.heroTop}>
        <Text style={styles.eyebrow}>TOTAL AUDIENCE</Text>
        <View style={styles.previewTag}>
          <Text style={styles.previewTagText}>Preview</Text>
        </View>
      </View>
      <Text style={styles.heroTitle}>{syncing ? 'Getting your stats' : 'No data yet'}</Text>
      <Text style={styles.heroBody}>
        {syncing
          ? `Syncing ${connectedCount} account${connectedCount === 1 ? '' : 's'}. Your first numbers show up within minutes.`
          : 'Connect an account and your first stats show up within minutes.'}
      </Text>
      <View style={styles.chart} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PreviewChart width={chartW} height={96} />
      </View>
      {!syncing && (
        <AppButton
          title="Connect an account"
          size="lg"
          onPress={onConnect}
          iconRight={
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          }
        />
      )}
    </GlassCard>
  );
}

// ─── What's coming (day 0) ──────────────────────────────────────────────────
const COMING = [
  {
    key: 'formats',
    title: 'Best formats',
    body: 'Reels, carousels or Shorts: which works for you.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Rect x="4" y="12" width="4" height="8" rx="1" stroke={ds.purple} strokeWidth={2} />
        <Rect x="10" y="6" width="4" height="14" rx="1" stroke={ds.purple} strokeWidth={2} />
        <Rect x="16" y="9" width="4" height="11" rx="1" stroke={ds.purple} strokeWidth={2} />
      </Svg>
    ),
  },
  {
    key: 'top',
    title: 'Top posts',
    body: 'Your strongest posts, and why they worked.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: 'time',
    title: 'Best time to post',
    body: 'When your audience is most active.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2} />
        <Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
  },
];

export function ComingUpCard() {
  return (
    <GlassCard radius={26} padding={0}>
      <View style={styles.comingHeader}>
        <Text style={styles.cardTitle}>What you'll see here</Text>
        <Text style={styles.cardSub}>Fills in after your first posts</Text>
      </View>
      {COMING.map((c, i) => (
        <View key={c.key} style={[styles.comingRow, i > 0 && styles.divider]}>
          <View style={styles.iconBox}>{c.icon}</View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{c.title}</Text>
            <Text style={styles.rowBody}>{c.body}</Text>
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

// ─── Jarvis strategy ────────────────────────────────────────────────────────
export function JarvisStrategyCard({
  orb,
  isNewUser,
  onOpen,
}: {
  orb: React.ReactNode;
  isNewUser: boolean;
  onOpen: () => void;
}) {
  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.jarvisTop}>
        {orb}
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>JARVIS STRATEGY</Text>
          <Text style={styles.cardTitle}>{isNewUser ? 'Learning your style' : 'Your growth strategy'}</Text>
        </View>
      </View>
      <View style={styles.quote}>
        <View style={styles.quoteBar} />
        <Text style={styles.quoteText}>
          {isNewUser
            ? 'Jarvis learns your patterns as you post. Your first strategy tip shows up after a few posts.'
            : 'Posts that deliver their main value within 4 seconds keep people watching longest. Lean into mistake-based hooks.'}
        </Text>
      </View>
      <AppButton title="See the breakdown" variant="quiet" onPress={onOpen} />
    </GlassCard>
  );
}

// ─── Weekly report: days until the first one ────────────────────────────────
function DayDot({ index, filled }: { index: number; filled: boolean }) {
  const reduceMotion = useReducedMotion();
  const s = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    s.value = withDelay(200 + index * 70, withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }));
  }, [reduceMotion, index, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: s.value }));
  return <Animated.View style={[styles.dayDot, filled && styles.dayDotOn, style]} />;
}

export function FirstReportCard({ daysOfData }: { daysOfData: number }) {
  const days = Math.max(0, Math.min(7, daysOfData));
  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.reportTop}>
        <View style={styles.iconBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="3" stroke={ds.purple} strokeWidth={2} />
            <Path d="M7 14l3-3 3 2 4-5" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>Weekly growth report</Text>
          <Text style={styles.rowBody}>Your first report arrives after 7 days of data.</Text>
        </View>
      </View>
      <View style={styles.dayRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <DayDot key={i} index={i} filled={i < days} />
        ))}
        <Text style={styles.dayLabel}>
          {days} of 7 days
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  previewTag: { paddingHorizontal: 8, height: 20, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(23, 20, 32, 0.05)' },
  previewTagText: { fontSize: 10.5, fontWeight: '700', color: ds.text3 },
  heroTitle: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: ds.ink, letterSpacing: -0.8, marginTop: 8 },
  heroBody: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 4 },
  chart: { marginTop: 14, marginBottom: 16 },
  comingHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
  comingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 20 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(23, 20, 32, 0.08)' },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  rowTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  rowBody: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2 },
  jarvisTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quote: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 16 },
  quoteBar: { width: 3, borderRadius: 2, backgroundColor: '#C9BDFB' },
  quoteText: { flex: 1, fontSize: 14.5, lineHeight: 21, color: ds.text2, fontStyle: 'italic' },
  reportTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  dayDot: { width: 18, height: 8, borderRadius: 4, backgroundColor: 'rgba(91, 62, 232, 0.14)' },
  dayDotOn: { backgroundColor: ds.purple },
  dayLabel: { fontSize: 12, fontWeight: '700', color: ds.text3, marginLeft: 6 },
});
