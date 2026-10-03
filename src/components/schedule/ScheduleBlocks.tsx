import React, { useEffect, useState } from 'react';
import { LiveMascot } from '../mascot/LiveMascot';
import { View, Pressable, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds, goldTokens } from '../../theme/colors';
import { whenLabel, type CalendarDay, type CalendarPost } from '../../data';
import type { Post } from '../../../frontend/shared/types/phase1';

// Building blocks for the Schedule screen. Calm by design: no streak-protection
// warnings, drafts are neutral (not alarm-coloured), empty days are fine.

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};
const WEEKDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Arrow = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Today ──────────────────────────────────────────────────────────────────
function Segments({ total, done }: { total: number; done: number }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }).map((_, i) => (
        <Animated.View key={i} entering={FadeInUp.delay(300 + i * 90).duration(300)} style={[styles.segment, i < done && styles.segmentOn]} />
      ))}
    </View>
  );
}

export function TodayCard({
  today,
  onSchedule,
  onIdea,
}: {
  today: CalendarDay;
  onSchedule: () => void;
  onIdea: () => void;
}) {
  const posts = today.posts;
  const posted = posts.filter((p) => p.status === 'posted').length;
  const next = posts.find((p) => p.status === 'scheduled');
  const ready = posts.filter((p) => p.status === 'ready').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;
  const empty = posts.length === 0;
  const label = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <GlassCard strong radius={26} padding={20}>
      <Text style={styles.eyebrow}>TODAY · {label.toUpperCase()}</Text>
      {empty ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Nothing planned yet</Text>
              <Text style={styles.heroBody}>Pick an idea, choose a time, and it lines up here.</Text>
            </View>
            <LiveMascot size={72} emotion="calm" />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.heroTitle}>
            <Text style={{ color: ds.purple }}>{posts.length}</Text> post{posts.length === 1 ? '' : 's'} today
          </Text>
          <Text style={styles.heroBody}>
            {[
              ready > 0 ? `${ready} ready to post` : null,
              next ? `Next up at ${next.time}` : null,
              posted > 0 ? `${posted} posted` : null,
              drafts > 0 ? `${drafts} draft${drafts === 1 ? '' : 's'} to finish` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'All done for today'}
          </Text>
          <Segments total={posts.length} done={posted} />
        </>
      )}
      <View style={styles.cta}>
        <AppButton title={empty ? 'Schedule a post' : 'Schedule another'} size="lg" onPress={onSchedule} iconRight={<Arrow />} />
      </View>
      <Pressable onPress={onIdea} hitSlop={8} style={styles.ideaLink} accessibilityRole="button">
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
        </Svg>
        <Text style={styles.ideaLinkText}>Start from an idea</Text>
      </Pressable>
    </GlassCard>
  );
}

// ─── Week strip with a sliding highlight ────────────────────────────────────
export function WeekStrip({
  days,
  selected,
  onSelect,
}: {
  days: CalendarDay[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const [w, setW] = useState(0);
  const cell = w / 7;
  const x = useSharedValue(0);
  useEffect(() => {
    // Smooth glide, no overshoot
    if (cell > 0) x.value = withTiming(selected * cell, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [selected, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GlassCard strong radius={22} padding={6}>
      <View
        style={styles.week}
        onLayout={(e: LayoutChangeEvent) => {
          const nw = e.nativeEvent.layout.width;
          if (Math.abs(nw - w) > 1) {
            setW(nw);
            x.value = selected * (nw / 7);
          }
        }}
      >
        {cell > 0 && <Animated.View pointerEvents="none" style={[styles.weekPill, { width: cell }, pill]} />}
        {days.map((d, i) => {
          const on = i === selected;
          const has = d.posts.length > 0;
          return (
            <Pressable
              key={d.key}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onSelect(i);
              }}
              style={[styles.weekCell, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${WEEKDAY[i]} ${d.day}${d.isToday ? ', today' : ''}${has ? `, ${d.posts.length} planned` : ''}`}
            >
              <Text style={[styles.weekDay, on && styles.weekOn, !on && d.isToday && styles.weekToday]}>{WEEKDAY[i]}</Text>
              <Text style={[styles.weekNum, on && styles.weekOn, !on && d.isPast && styles.weekPast]}>{d.day}</Text>
              <View style={styles.weekDots}>
                {d.posts.slice(0, 3).map((p) => (
                  <View key={p.id} style={[styles.weekDot, on && styles.weekDotOn, p.status === 'posted' && !on && styles.weekDotPosted]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ─── Post row ───────────────────────────────────────────────────────────────
export function PostRow({ post, onPress }: { post: CalendarPost; onPress: () => void }) {
  const chip =
    post.status === 'posted'
      ? { label: 'Posted', bg: ds.greenBg, fg: ds.greenFill }
      : post.status === 'draft'
      ? { label: 'Draft', bg: ds.cream, fg: ds.text2 }
      : post.status === 'ready'
        ? { label: 'Ready to post', bg: goldTokens.light, fg: goldTokens.dark }
        : { label: 'Scheduled', bg: ds.lavender, fg: ds.purple };
  const action = post.status === 'draft' ? 'Finish' : post.status === 'posted' ? (post.url ? 'View' : 'Posted') : post.status === 'ready' ? 'Post it' : 'Open';
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`${post.title}. ${PLATFORM_NAMES[post.platform]} at ${post.time}. ${chip.label}. ${action}`}>
      <GlassCard strong radius={20} padding={14}>
        <View style={styles.row}>
          <PlatformLogo type={post.platform as PlatformLogoType} size={36} />
          <View style={styles.flex}>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTime}>{post.time}</Text>
              <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
              </View>
            </View>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {post.title}
            </Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={ds.text3} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </GlassCard>
    </PressableCard>
  );
}

export function EmptyDay({ label, isPast, onPlan }: { label: string; isPast: boolean; onPlan: () => void }) {
  return (
    <GlassCard radius={20} padding={18}>
      <Text style={styles.emptyTitle}>{isPast ? `Nothing went out ${label}` : `Nothing planned for ${label}`}</Text>
      <Text style={styles.emptyBody}>{isPast ? 'Rest days are part of the rhythm.' : 'A quiet day, or a good slot for your next post.'}</Text>
      {!isPast && (
        <View style={styles.emptyBtn}>
          <AppButton title="Plan a post" variant="quiet" onPress={onPlan} />
        </View>
      )}
    </GlassCard>
  );
}

// ─── Platform mix (animated bars) ───────────────────────────────────────────
function MixBar({ index, ratio }: { index: number; ratio: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(200 + index * 120, withTiming(ratio, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [ratio, index, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.mixTrack}>
      <Animated.View style={[styles.mixFill, style]} />
    </View>
  );
}

export function PlatformMixCard({ mix }: { mix: { platform: string; count: number }[] }) {
  const max = Math.max(1, ...mix.map((m) => m.count));
  const top = mix[0];
  return (
    <GlassCard strong radius={24} padding={18}>
      <Text style={styles.cardTitle}>Platform mix</Text>
      <View style={styles.mixList}>
        {mix.map((m, i) => (
          <View key={m.platform}>
            <View style={styles.mixHead}>
              <PlatformLogo type={m.platform as PlatformLogoType} size={20} />
              <Text style={styles.mixName}>{PLATFORM_NAMES[m.platform]}</Text>
              <Text style={styles.mixCount}>
                {m.count} post{m.count === 1 ? '' : 's'}
              </Text>
            </View>
            <MixBar index={i} ratio={m.count / max} />
          </View>
        ))}
      </View>
      {top && <Text style={styles.mixNote}>{PLATFORM_NAMES[top.platform]} is your focus this week.</Text>}
    </GlassCard>
  );
}

// ─── Ready to post ──────────────────────────────────────────────────────────
// Posts whose time has come. They stay here, whatever week it is, until the creator posts them.
export function ReadyCard({ posts, onOpen }: { posts: Post[]; onOpen: (id: string) => void }) {
  const shown = posts.slice(0, 4);
  return (
    <GlassCard strong radius={26} padding={18}>
      <Text style={[styles.eyebrow, { color: goldTokens.dark }]}>READY TO POST</Text>
      <Text style={styles.cardTitle}>
        {posts.length === 1 ? '1 post is waiting for you' : `${posts.length} posts are waiting for you`}
      </Text>
      <Text style={styles.readySub}>Open the app, post it, then tap “I posted it” so it counts.</Text>
      <View style={styles.readyList}>
        {shown.map((p) => (
          <Pressable key={p.id} onPress={() => onOpen(p.id)} style={({ pressed }) => [styles.readyRow, pressed && { transform: [{ scale: 0.98 }] }]} accessibilityRole="button" accessibilityLabel={`${p.caption.split('\n')[0]}. Ready to post`}>
            <View style={styles.readyLogos}>
              {p.platforms.slice(0, 3).map((s, i) => (
                <View key={s.platform} style={[styles.readyLogo, i > 0 && { marginLeft: -8 }]}>
                  <PlatformLogo type={s.platform as PlatformLogoType} size={28} />
                </View>
              ))}
            </View>
            <View style={styles.flex}>
              <Text style={styles.readyTitle} numberOfLines={1}>
                {p.caption.split('\n')[0]}
              </Text>
              <Text style={styles.readyWhen}>Due {whenLabel(Date.parse(p.at))}</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M9 6l6 6-6 6" stroke={ds.text3} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        ))}
      </View>
      {posts.length > shown.length ? <Text style={styles.readyMore}>and {posts.length - shown.length} more</Text> : null}
    </GlassCard>
  );
}

// ─── Best time ──────────────────────────────────────────────────────────────
// Only shown once the creator's own posts say when they do best (never a guess).
export function BestTimeCard({ orb, time, onUse }: { orb: React.ReactNode; time: string; onUse: () => void }) {
  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.row}>
        {orb}
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>JARVIS SUGGESTS</Text>
          <Text style={styles.cardTitle}>Your best time</Text>
        </View>
      </View>
      <View style={styles.timeBox}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2.2} />
          <Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.timeBig}>{time}</Text>
        <Text style={styles.timeSub}>When your recent posts have done best</Text>
      </View>
      <AppButton title="Plan a post" variant="quiet" onPress={onUse} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  readySub: { fontSize: 13, lineHeight: 19, color: ds.text2, marginTop: 4 },
  readyList: { gap: 8, marginTop: 14 },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  readyLogos: { flexDirection: 'row', alignItems: 'center' },
  readyLogo: { borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden' },
  readyTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  readyWhen: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 1 },
  readyMore: { fontSize: 12.5, fontWeight: '700', color: ds.text3, marginTop: 10, textAlign: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  heroTitle: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: ds.ink, letterSpacing: -0.8, marginTop: 8 },
  heroBody: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 4 },
  segments: { flexDirection: 'row', gap: 6, marginTop: 14 },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(91, 62, 232, 0.14)' },
  segmentOn: { backgroundColor: ds.purple },
  cta: { marginTop: 18 },
  ideaLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  ideaLinkText: { fontSize: 14, fontWeight: '800', color: ds.purple },
  week: { flexDirection: 'row' },
  weekPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    backgroundColor: ds.purple,
    shadowColor: ds.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  weekDay: { fontSize: 11, fontWeight: '800', color: ds.text3, letterSpacing: 0.3 },
  weekToday: { color: ds.purple },
  weekNum: { fontSize: 17, fontWeight: '800', color: ds.ink },
  weekPast: { color: ds.text3 },
  weekOn: { color: '#FFFFFF' },
  weekDots: { flexDirection: 'row', gap: 3, height: 6, alignItems: 'center', marginTop: 2 },
  weekDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#A99BFF' },
  weekDotPosted: { backgroundColor: ds.purple },
  weekDotOn: { backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTime: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  chip: { paddingHorizontal: 8, height: 20, justifyContent: 'center', borderRadius: 999 },
  chipText: { fontSize: 10.5, fontWeight: '800' },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: ds.ink, marginTop: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  emptyBody: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2 },
  emptyBtn: { marginTop: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  mixList: { gap: 14, marginTop: 14 },
  mixHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  mixName: { flex: 1, fontSize: 14, fontWeight: '800', color: ds.ink },
  mixCount: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },
  mixTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(91, 62, 232, 0.12)', overflow: 'hidden' },
  mixFill: { height: '100%', borderRadius: 4, backgroundColor: ds.purple },
  mixNote: { fontSize: 13, color: ds.text2, marginTop: 14, fontWeight: '600' },
  timeBox: {
    alignItems: 'center',
    paddingVertical: 16,
    marginVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(237, 233, 254, 0.6)',
    gap: 2,
  },
  timeBig: { fontSize: 30, fontWeight: '800', color: ds.ink, letterSpacing: -1, marginTop: 4 },
  timeSub: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },
});

