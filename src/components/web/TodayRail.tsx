import { TourTarget } from '../tour/GhostTour';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text, TextInput } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { getCalendarMonth } from '../../data';
import { openJarvis } from '../../jarvis/chat';
import { useCapabilities } from '../../backend/account';
import { loadCalendarWeek } from '../../backend/calendar';
import { loadHome, useHomeSummary } from '../../backend/home';
import { usePostsVersion } from '../../backend/posts';
import { useAsync } from '../../hooks/useAsync';
import { ds } from '../../theme/colors';

// Desktop web app: the panel on the right of the main pages, so wide screens
// get useful things instead of empty space. Ask Jarvis for an idea (the chat
// answers, on the server), see the week and tap a day, follow the weekly
// challenge, and read a few tips. Smooth, non-bouncy motion throughout.

export const RAIL_W = 340;

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);

// ─── Ask Jarvis ─────────────────────────────────────────────────────────────
const QUICK = ['Morning routine', 'A day in my life', 'Quick tip', 'Behind the scenes'];

function AskJarvis() {
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState(false);

  // The question goes to the Jarvis chat, which answers on the server
  const ask = (t: string) => {
    const q = t.trim();
    if (!q) return;
    openJarvis(`Give me post ideas about ${q}`);
    setTopic('');
  };

  return (
    <TourTarget id="ask-jarvis">
    <GlassCard strong radius={22} padding={16}>
      <View style={styles.head}>
        <JarvisOrb size={24} />
        <Text style={styles.title}>Ask Jarvis for an idea</Text>
      </View>
      <View style={[styles.inputBox, focus && styles.inputFocus]}>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onSubmitEditing={() => ask(topic)}
          placeholder="Any topic, e.g. my morning"
          placeholderTextColor={ds.text3}
          selectionColor={ds.purple}
          returnKeyType="go"
          maxLength={200}
          accessibilityLabel="Topic for an idea"
          style={styles.input}
        />
        <Pressable onPress={() => ask(topic)} disabled={!topic.trim()} accessibilityRole="button" accessibilityLabel="Ask Jarvis" style={[styles.askBtn, pointer, !topic.trim() && { opacity: 0.4 }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {QUICK.map((q) => (
          <Pressable key={q} onPress={() => ask(q)} accessibilityRole="button" style={({ pressed }) => [styles.chip, pointer, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Text style={styles.chipText}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </GlassCard>
    </TourTarget>
  );
}

// ─── Your week ──────────────────────────────────────────────────────────────
const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function YourWeek({ onPlan }: { onPlan: () => void }) {
  const version = usePostsVersion();
  const loaded = useAsync(() => loadCalendarWeek().then((ok) => (ok ? Date.now() : null)), [version]);
  const now = new Date();
  const week = useMemo(() => {
    // Monday-first week around today, possibly spanning two months
    const dow = (now.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i);
      const m = getCalendarMonth(d.getFullYear(), d.getMonth());
      days.push({ date: d, info: m.days.find((x) => x.day === d.getDate()) });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded.data]);
  const todayIdx = week.findIndex((d) => d.info?.isToday);
  const [sel, setSel] = useState(Math.max(0, todayIdx));
  const picked = week[sel];
  const posts = picked?.info?.posts ?? [];

  return (
    <GlassCard strong radius={22} padding={16}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Your week</Text>
        <Text style={styles.muted}>{week.reduce((n, d) => n + (d.info?.posts.length ?? 0), 0)} posts</Text>
      </View>
      <View style={styles.week}>
        {week.map((d, i) => {
          const on = i === sel;
          const count = d.info?.posts.length ?? 0;
          return (
            <Pressable key={i} onPress={() => setSel(i)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${DAY[i]} ${d.date.getDate()}, ${count} posts`} style={[styles.day, on && styles.dayOn, d.info?.isToday && !on && styles.dayToday, pointer]}>
              <Text style={[styles.dayName, on && styles.dayTextOn]}>{DAY[i].slice(0, 1)}</Text>
              <Text style={[styles.dayNum, on && styles.dayTextOn]}>{d.date.getDate()}</Text>
              <View style={styles.dots}>
                {Array.from({ length: Math.min(count, 3) }, (_, k) => (
                  <View key={k} style={[styles.dot, on && { backgroundColor: '#FFFFFF' }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Animated.View key={sel} entering={FadeIn.duration(240)} style={styles.dayList}>
        {posts.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.muted}>{picked?.info?.isPast ? 'Nothing posted this day.' : 'Nothing planned yet.'}</Text>
            {!picked?.info?.isPast && (
              <Pressable onPress={onPlan} accessibilityRole="button" style={pointer}>
                <Text style={styles.link}>Plan a post</Text>
              </Pressable>
            )}
          </View>
        ) : (
          posts.map((p) => (
            <View key={p.id} style={styles.post}>
              <PlatformLogo type={p.platform as PlatformLogoType} size={26} />
              <View style={styles.flex}>
                <Text style={styles.postTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.muted}>{p.time} · {p.status === 'posted' ? 'Posted' : p.status === 'scheduled' ? 'Scheduled' : 'Draft'}</Text>
              </View>
            </View>
          ))
        )}
      </Animated.View>
    </GlassCard>
  );
}

// ─── Weekly challenge ───────────────────────────────────────────────────────
function Challenge({ posted, goal, onOpen }: { posted: number; goal: number; onOpen: () => void }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  // The ring fills smoothly (driven from JS so it works the same on web)
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = offset;
    const to = c * (1 - Math.min(1, posted / Math.max(1, goal)));
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const e = 1 - Math.pow(1 - t, 3);
      setOffset(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posted]);
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Weekly challenge: ${posted} of ${goal} posted`} style={({ pressed }) => [pointer, pressed && { transform: [{ scale: 0.99 }] }]}>
      <GlassCard strong radius={22} padding={16}>
        <View style={styles.challenge}>
          <View style={styles.ring}>
            <Svg width={64} height={64} viewBox="0 0 64 64">
              <Circle cx={32} cy={32} r={r} stroke={ds.lavender} strokeWidth={6} fill="none" />
              <Circle cx={32} cy={32} r={r} stroke={ds.purple} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={offset} transform="rotate(-90 32 32)" />
            </Svg>
            <Text style={styles.ringText}>{posted}/{goal}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>THIS WEEK’S CHALLENGE</Text>
            <Text style={styles.title}>Post {goal} times this week</Text>
            <Text style={styles.muted}>Any day, any platform. At your own pace.</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

// ─── Jarvis tips ────────────────────────────────────────────────────────────
const TIPS = [
  'Your first weeks are about finding a rhythm, not going viral. Three posts a week is a great start.',
  'Make the first two seconds count: say the point, or put it on screen, before anything else.',
  'Connect your accounts and Growth shows which of your posts people liked most.',
];

/** Rotating tips (every 7s, or tap a dot) */
export function TipsCard({ tips }: { tips: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % tips.length), 7000);
    return () => clearInterval(id);
  }, [tips.length]);
  return (
    <GlassCard radius={22} padding={16}>
      <View style={styles.head}>
        <JarvisOrb size={20} />
        <Text style={styles.eyebrowPurple}>TIPS</Text>
      </View>
      <Animated.View key={i} entering={FadeIn.duration(400)}>
        <Text style={styles.tip}>{tips[i]}</Text>
      </Animated.View>
      <View style={styles.tipDots}>
        {tips.map((_, k) => (
          <Pressable key={k} onPress={() => setI(k)} accessibilityRole="button" accessibilityLabel={`Tip ${k + 1}`} hitSlop={6} style={pointer}>
            <View style={[styles.tipDot, k === i && styles.tipDotOn]} />
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

export function TodayRail({ onPlan, onOpenChallenge }: { onPlan: () => void; onOpenChallenge: () => void }) {
  const { ai } = useCapabilities();
  const home = useHomeSummary();
  useEffect(() => {
    if (!home) void loadHome();
  }, [home]);
  return (
    <View style={styles.rail}>
      <ScrollView contentContainerStyle={styles.railScroll} showsVerticalScrollIndicator={false}>
        {ai && (
          <Animated.View entering={FadeInUp.duration(450).easing(ease)}>
            <AskJarvis />
          </Animated.View>
        )}
        <Animated.View entering={FadeInUp.delay(80).duration(450).easing(ease)}>
          <YourWeek onPlan={onPlan} />
        </Animated.View>
        {home && (
          <Animated.View entering={FadeInUp.delay(160).duration(450).easing(ease)}>
            <Challenge posted={home.challenge.done} goal={home.challenge.goal} onOpen={onOpenChallenge} />
          </Animated.View>
        )}
        <Animated.View entering={FadeInUp.delay(240).duration(450).easing(ease)}>
          <TipsCard tips={TIPS} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  rail: { width: RAIL_W, borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.9)' },
  railScroll: { padding: 20, gap: 14, paddingBottom: 40 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  muted: { fontSize: 12.5, fontWeight: '600', color: ds.text3 },
  link: { fontSize: 13, fontWeight: '800', color: ds.purple },
  eyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: ds.text3 },
  eyebrowPurple: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: ds.purple },

  inputBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingLeft: 12, paddingRight: 5, height: 46, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  inputFocus: { borderColor: ds.purple },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: ds.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  askBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { paddingHorizontal: 10, height: 30, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  chipText: { fontSize: 12, fontWeight: '800', color: ds.purple },
  ideaWrap: { marginTop: 12 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  idea: { padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.95)' },
  ideaTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  ideaHook: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 4 },
  ideaMeta: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 6 },
  ideaActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  useBtn: { flex: 1, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple, shadowColor: ds.purpleLedge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
  useText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },
  anotherBtn: { paddingHorizontal: 12, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  anotherText: { fontSize: 13, fontWeight: '800', color: ds.purple },

  week: { flexDirection: 'row', gap: 4, marginTop: 12 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  dayOn: { backgroundColor: ds.purple },
  dayToday: { borderWidth: 1.5, borderColor: ds.purple },
  dayName: { fontSize: 10.5, fontWeight: '800', color: ds.text3 },
  dayNum: { fontSize: 14, fontWeight: '800', color: ds.ink, marginTop: 1 },
  dayTextOn: { color: '#FFFFFF' },
  dots: { flexDirection: 'row', gap: 2, height: 5, marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ds.purple },
  dayList: { marginTop: 12, gap: 8 },
  emptyDay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  post: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postTitle: { fontSize: 13.5, fontWeight: '800', color: ds.ink },

  challenge: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ring: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 14, fontWeight: '800', color: ds.ink },

  tip: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: ds.ink, marginTop: 10, minHeight: 60 },
  tipDots: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.lavender },
  tipDotOn: { width: 18, backgroundColor: ds.purple },
});
