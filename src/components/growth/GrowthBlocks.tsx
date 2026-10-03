import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { ds, goldTokens } from '../../theme/colors';

// Building blocks for the Growth tab when there is nothing to show yet. No sample numbers and no
// stand-in chart: every empty state says plainly what is missing and what will appear.

// ─── Before there is an account (or any reading) ────────────────────────────
export function AudienceEmptyHero({
  state,
  connectedCount,
  onConnect,
  onReconnect,
}: {
  /** none: nothing connected. reading: connected, nothing read yet. reconnect: the only account needs approving again. */
  state: 'none' | 'reading' | 'reconnect';
  connectedCount: number;
  onConnect: () => void;
  onReconnect?: () => void;
}) {
  const title = state === 'none' ? 'No data yet' : state === 'reconnect' ? 'Reconnect to see your numbers' : 'Getting your stats';
  const body =
    state === 'none'
      ? 'Connect an account and your first numbers show up within a minute or two.'
      : state === 'reconnect'
        ? 'The platform needs you to approve PostStreak again before it will share your numbers.'
        : `Reading ${connectedCount} account${connectedCount === 1 ? '' : 's'}. This can take a minute. Pull to refresh in a little while.`;
  return (
    <GlassCard strong radius={26} padding={20}>
      <Text style={styles.eyebrow}>TOTAL AUDIENCE</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroBody}>{body}</Text>
      {state !== 'reading' && (
        <View style={styles.heroAction}>
          <AppButton
            title={state === 'none' ? 'Connect an account' : 'Reconnect'}
            size="lg"
            onPress={state === 'none' ? onConnect : (onReconnect ?? onConnect)}
            iconRight={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
          />
        </View>
      )}
    </GlassCard>
  );
}

// ─── What's coming (before the first numbers) ───────────────────────────────
const COMING = [
  {
    key: 'audience',
    title: 'Your audience',
    body: 'Followers across your accounts, and how they move.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: 'top',
    title: 'Top posts',
    body: 'Your strongest posts, and how they compare with the rest.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: 'time',
    title: 'Best time to post',
    body: 'The hour your posts do best, once you have a few.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2} />
        <Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
  },
];

// Extra row Pro members get (gold tag = Pro)
const COMING_PRO = [
  {
    key: 'history',
    title: 'Growth month by month',
    body: 'New followers each month, for all your accounts.',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2} />
        <Path d="M7 16l3-3 3 2 4-5" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
];

export function ComingUpCard({ pro = false }: { pro?: boolean }) {
  const rows: { key: string; title: string; body: string; icon: React.ReactNode; pro?: boolean }[] = pro ? [...COMING, ...COMING_PRO.map((r) => ({ ...r, pro: true }))] : COMING;
  return (
    <GlassCard radius={26} padding={0}>
      <View style={styles.comingHeader}>
        <Text style={styles.cardTitle}>What you'll see here</Text>
        <Text style={styles.cardSub}>Fills in after you connect and post</Text>
      </View>
      {rows.map((c, i) => (
        <View key={c.key} style={[styles.comingRow, i > 0 && styles.divider]}>
          <View style={styles.iconBox}>{c.icon}</View>
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <Text style={styles.rowTitle}>{c.title}</Text>
              {c.pro && (
                <View style={styles.proTag}>
                  <Text style={styles.proTagText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.rowBody}>{c.body}</Text>
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

// ─── This week's plan ───────────────────────────────────────────────────────
export function JarvisStrategyCard({
  orb,
  title,
  quote,
  buttonTitle,
  onOpen,
}: {
  orb: React.ReactNode;
  title: string;
  /** One true sentence drawn from the creator's own numbers (or what Jarvis is waiting for). */
  quote: string;
  buttonTitle: string;
  onOpen: () => void;
}) {
  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.jarvisTop}>
        {orb}
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>JARVIS STRATEGY</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.quote}>
        <View style={styles.quoteBar} />
        <Text style={styles.quoteText}>{quote}</Text>
      </View>
      <AppButton title={buttonTitle} variant="quiet" onPress={onOpen} />
    </GlassCard>
  );
}

// ─── Weekly report: days until the first one ────────────────────────────────
function DayDot({ index, filled }: { index: number; filled: boolean }) {
  const reduceMotion = useReducedMotion();
  const s = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    s.value = withDelay(200 + index * 70, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
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
        <Text style={styles.dayLabel}>{days} of 7 days</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  proTag: { paddingHorizontal: 6, height: 18, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: goldTokens.dark },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  heroTitle: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: ds.ink, letterSpacing: -0.8, marginTop: 8 },
  heroBody: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 4 },
  heroAction: { marginTop: 16 },
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
