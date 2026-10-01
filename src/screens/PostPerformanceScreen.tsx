import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { WhoAudienceCard } from '../components/growth/ProInsights';
import type { StudioVideo } from '../data';
import { ds } from '../theme/colors';

// "See why it worked" for the creator's best post (opened from Growth).
// Sample numbers that match the Growth card (14.2K views, 42s, 84 shares).
// It describes what stands out; it never claims to know exactly why a post
// took off. Who watched is Pro; free sees a calm gold upgrade card.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};
const AnimatedPath = Animated.createAnimatedComponent(Path);

const POST = {
  title: '3 creator mistakes I stopped making this year',
  hook: 'Stop making these 3 mistakes if you want to grow this year.',
  seconds: 42,
};

const STATS = [
  { label: 'Views', value: 14200, fmt: (n: number) => `${(n / 1000).toFixed(1)}K` },
  { label: 'Likes', value: 1800, fmt: (n: number) => `${(n / 1000).toFixed(1)}K` },
  { label: 'Shares', value: 84, fmt: (n: number) => `${Math.round(n)}` },
];

const VS_USUAL = [
  { label: 'Views', value: '14.2K', note: '42% more than usual' },
  { label: 'Watch time', value: '42s', note: '35% longer than usual' },
  { label: 'New followers', value: '+320', note: 'Your most from one post' },
  { label: 'Saves', value: '610', note: 'About 3× your usual' },
];

// Share of viewers still watching at each second
const CURVE = [
  { t: 0, p: 100, note: 'Everyone who saw it started watching.' },
  { t: 3, p: 84, note: '84% were still watching after 3 seconds. Your opening did its job.' },
  { t: 10, p: 71, note: 'Most stayed through the first mistake. Getting to the point fast helped.' },
  { t: 20, p: 62, note: 'A small dip around the middle. A quicker cut here could keep a few more.' },
  { t: 30, p: 55, note: 'Over half were still watching at 30 seconds.' },
  { t: 42, p: 48, note: 'Almost half watched to the end, which is strong for a 42-second video.' },
];

const STANDS_OUT = [
  { id: 'open', title: 'The opening', body: 'It named the problem in the first line, with no intro.' },
  { id: 'pace', title: 'The pace', body: 'A new shot about every 2 seconds kept it moving.' },
  { id: 'end', title: 'The ending', body: 'It asked which mistake people make. 248 people answered.' },
];

function CountUp({ to, fmt, style }: { to: number; fmt: (n: number) => string; style: object }) {
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
  return <Text style={style}>{fmt(n)}</Text>;
}

// ─── How long people watched ────────────────────────────────────────────────
const CH = 130;
function WatchCurve() {
  const [w, setW] = useState(0);
  const [sel, setSel] = useState(1);
  const draw = useSharedValue(0);
  useEffect(() => {
    if (w > 0) draw.value = withDelay(200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, [w, draw]);
  const pad = 10;
  const x = (t: number) => pad + (t / POST.seconds) * (w - pad * 2);
  const y = (p: number) => 8 + (1 - p / 100) * (CH - 16);
  const d = CURVE.map((c, i) => `${i === 0 ? 'M' : 'L'} ${x(c.t)} ${y(c.p)}`).join(' ');
  const len = w * 1.3;
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - draw.value) }));
  const c = CURVE[sel];
  return (
    <GlassCard strong radius={24} padding={16}>
      <Text style={styles.cardTitle}>How long people watched</Text>
      <Text style={styles.cardSub}>Tap a point on the line</Text>
      <View style={styles.curveBox} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <>
            <Svg width={w} height={CH}>
              <Defs>
                <SvgGradient id="watchArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={ds.purple} stopOpacity={0.18} />
                  <Stop offset="1" stopColor={ds.purple} stopOpacity={0} />
                </SvgGradient>
              </Defs>
              <Path d={`${d} L ${x(POST.seconds)} ${CH} L ${x(0)} ${CH} Z`} fill="url(#watchArea)" />
              <AnimatedPath d={d} stroke={ds.purple} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len} ${len}`} animatedProps={lineProps} />
              <Rect x={x(c.t) - 0.75} y={0} width={1.5} height={CH} fill="rgba(91,62,232,0.25)" />
              {CURVE.map((p, i) => (
                <Circle key={p.t} cx={x(p.t)} cy={y(p.p)} r={i === sel ? 7 : 4.5} fill={i === sel ? ds.purple : '#FFFFFF'} stroke={ds.purple} strokeWidth={2.5} />
              ))}
            </Svg>
            {CURVE.map((p, i) => (
              <Pressable
                key={`h-${p.t}`}
                onPress={() => {
                  tick();
                  setSel(i);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${p.t} seconds, ${p.p}% still watching`}
                style={[styles.curveHit, { left: x(p.t) - 18, top: y(p.p) - 18 }, pointer]}
              />
            ))}
          </>
        )}
      </View>
      <View style={styles.curveAxis}>
        <Text style={styles.axisText}>0s</Text>
        <Text style={styles.axisText}>{POST.seconds}s</Text>
      </View>
      <Animated.View key={sel} entering={FadeIn.duration(220)} style={styles.note}>
        <View style={styles.rowBetween}>
          <Text style={styles.noteTitle}>At {c.t}s</Text>
          <Text style={styles.notePct}>{c.p}% still watching</Text>
        </View>
        <Text style={styles.noteText}>{c.note}</Text>
      </Animated.View>
    </GlassCard>
  );
}

interface PostPerformanceScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenSchedule?: () => void;
  onOpenAudienceBreakdown?: () => void;
  onOpenComposer?: (ideaTitle?: string) => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenContentAngle?: () => void;
  /** Pro members see who watched instead of the upgrade card. */
  tier?: 'free' | 'pro';
  onMakeMoreLikeThis?: (video: StudioVideo) => void;
  onReuseOpening?: (title: string, hook: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const PostPerformanceScreen: React.FC<PostPerformanceScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  tier = 'free',
  onMakeMoreLikeThis,
  onReuseOpening,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [open, setOpen] = useState<string>('open');
  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} style={styles.headline}>
            <FitLines lines={['Why it', <Text key="a" style={styles.accent}>worked</Text>]} textStyle={styles.headlineText} maxFontSize={38} align="left" accessibilityLabel="Why it worked" />
            <Text style={styles.sub}>A closer look at your best post lately.</Text>
          </Animated.View>

          {/* The post */}
          <Animated.View entering={enter(60)}>
            <GlassCard strong radius={26} padding={12}>
              <View style={styles.cover}>
                <Image source={require('../../assets/images/amara-portrait.jpg')} style={styles.coverImg} resizeMode="cover" />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill} />
                <View style={styles.coverChip}>
                  <Text style={styles.coverChipText}>TikTok · Video · 0:42</Text>
                </View>
                <View style={styles.playBtn}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
                  </Svg>
                </View>
                <Text style={styles.coverTitle}>{POST.title}</Text>
              </View>
              <View style={styles.stats}>
                {STATS.map((s) => (
                  <View key={s.label} style={styles.stat}>
                    <CountUp to={s.value} fmt={s.fmt} style={styles.statValue} />
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Compared with usual */}
          <Animated.View entering={enter(120)}>
            <Text style={styles.section}>Compared with your usual</Text>
            <View style={styles.grid}>
              {VS_USUAL.map((v, i) => (
                <Animated.View key={v.label} entering={FadeInUp.delay(160 + i * 70).duration(380)} style={styles.tile}>
                  <Text style={styles.tileLabel}>{v.label}</Text>
                  <Text style={styles.tileValue}>{v.value}</Text>
                  <Text style={styles.tileNote}>{v.note}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Watch curve */}
          <Animated.View entering={enter(200)} style={styles.section2}>
            <WatchCurve />
          </Animated.View>

          {/* What stands out */}
          <Animated.View entering={enter(260)}>
            <Text style={styles.section}>What stands out</Text>
            <GlassCard radius={24} padding={6}>
              {STANDS_OUT.map((s, i) => {
                const on = open === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      tick();
                      setOpen(on ? '' : s.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: on }}
                    style={[styles.stand, i < STANDS_OUT.length - 1 && styles.standLine, pointer]}
                  >
                    <View style={[styles.standNum, on && styles.standNumOn]}>
                      <Text style={[styles.standNumText, on && { color: '#FFFFFF' }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.standTitle}>{s.title}</Text>
                      {on && (
                        <Animated.View entering={FadeIn.duration(200)}>
                          <Text style={styles.standBody}>{s.body}</Text>
                          {s.id === 'open' && <Text style={styles.quote}>“{POST.hook}”</Text>}
                        </Animated.View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </GlassCard>
          </Animated.View>

          {/* Jarvis: what next */}
          <Animated.View entering={enter(320)}>
            <GlassCard strong radius={24} padding={16} style={styles.jarvis}>
              <View style={styles.jarvisHead}>
                <JarvisOrb size={32} />
                <Text style={styles.jarvisTitle}>Make another like it</Text>
              </View>
              <Text style={styles.jarvisBody}>Keep the same shape: a problem in the first line, quick cuts, and a question at the end.</Text>
              <View style={styles.actions}>
                <AppButton
                  title="Make more like this"
                  onPress={() => onMakeMoreLikeThis?.({ name: POST.title, seconds: POST.seconds, source: 'post', platform: 'tiktok' })}
                />
                <AppButton title="Reuse the opening" variant="glass" onPress={() => onReuseOpening?.(POST.title, POST.hook)} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Who watched */}
          <Animated.View entering={enter(380)}>
            <Text style={styles.section}>Who watched</Text>
            {tier === 'pro' ? (
              <WhoAudienceCard />
            ) : (
              <ProUpsellCard title="See who watched this post" benefits={['Ages and places', 'When they were online', 'Who followed you after']} buttonTitle="Explore Pro" onUpgrade={() => onOpenJarvisPro?.()} />
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <FloatingTabBar activeTab="growth" onTabPress={(t) => onNavigateTab?.(t)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const glass = { backgroundColor: 'rgba(255, 255, 255, 0.82)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.9, color: ds.ink },
  accent: { color: ds.purple },
  sub: { fontSize: 14.5, lineHeight: 20, color: ds.text2, marginTop: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  section2: { marginTop: 24 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },

  cover: { height: 220, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end', padding: 14 },
  coverImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  coverChip: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, height: 24, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  coverChipText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  playBtn: { position: 'absolute', top: '40%', alignSelf: 'center', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  coverTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: '#FFFFFF' },
  stats: { flexDirection: 'row', marginTop: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: ds.ink },
  statLabel: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { width: '48.5%', padding: 12, borderRadius: 18, ...glass },
  tileLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3 },
  tileValue: { fontSize: 20, fontWeight: '800', color: ds.ink, marginTop: 2 },
  tileNote: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: ds.greenFill, marginTop: 4 },

  curveBox: { height: CH, marginTop: 14 },
  curveHit: { position: 'absolute', width: 36, height: 36 },
  curveAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { fontSize: 11, fontWeight: '700', color: ds.text3 },
  note: { marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  noteTitle: { fontSize: 14, fontWeight: '800', color: ds.ink },
  notePct: { fontSize: 13, fontWeight: '800', color: ds.purple },
  noteText: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 4 },

  stand: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, paddingVertical: 14 },
  standLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  standNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  standNumOn: { backgroundColor: ds.purple },
  standNumText: { fontSize: 13, fontWeight: '800', color: ds.purple },
  standTitle: { fontSize: 15.5, fontWeight: '800', color: ds.ink, marginTop: 4 },
  standBody: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 4 },
  quote: { fontSize: 14, lineHeight: 20, fontWeight: '700', fontStyle: 'italic', color: ds.purple, marginTop: 8 },

  jarvis: { marginTop: 24 },
  jarvisHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jarvisTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  jarvisBody: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 10 },
  actions: { gap: 10, marginTop: 14 },
});
