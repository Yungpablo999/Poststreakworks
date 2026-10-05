import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useMascotThinking } from '../mascot/mascot';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInUp, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { FILM_STYLES, getDefaultFilmStyle, getSavedHooks, subscribeToSavedHooks, toggleSavedHook, type FilmStyle } from '../data';
import { AppToast } from '../components/ui/AppToast';
import { NeedsJarvis, Problem, StandInNote, UsageLine } from '../components/studio/StudioBits';
import { useCapabilities } from '../backend/account';
import { requestHooks, studioProblem } from '../backend/studio';
import { ds, goldTokens } from '../theme/colors';

// Hook Studio (Pro): the first 3 seconds. Pick the kind of video and the kind
// of opening, get 3 hooks, preview each one playing out over 3 seconds, and
// send the one you like to your post. For dance, skits and silent videos the
// hook is on-screen text (they already know their moves); for talking videos
// it's the first line said to camera. Jarvis writes the hooks on the server; Hook Studio is Pro there.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

type Angle = 'question' | 'mistake' | 'story' | 'bold' | 'result';
const ANGLES: { id: Angle; label: string }[] = [
  { id: 'question', label: 'A question' },
  { id: 'mistake', label: 'A mistake' },
  { id: 'story', label: 'A story' },
  { id: 'bold', label: 'A bold take' },
  { id: 'result', label: 'A result' },
];

const CUE: Record<FilmStyle, string> = {
  talking: 'Say it straight to camera in the first second. No hello first.',
  text: 'Put it as big text on the very first frame.',
  dance: 'Show it as text while you’re already moving on the first beat.',
  skit: 'Flash it as text, then open mid-scene.',
};

interface Hook {
  id: string;
  line: string;
  angle: Angle;
}

// ─── 3-second preview: the hook plays out word by word in a phone frame ─────
function Preview({ line, style }: { line: string; style: FilmStyle }) {
  const words = line.split(' ');
  const [shown, setShown] = useState(0);
  const bar = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const play = () => {
    timers.current.forEach(clearTimeout);
    setShown(0);
    cancelAnimation(bar);
    bar.value = 0;
    bar.value = withTiming(1, { duration: 3000, easing: Easing.linear });
    const step = Math.min(420, 2400 / words.length);
    timers.current = words.map((_, i) => setTimeout(() => setShown(i + 1), 150 + i * step));
  };
  useEffect(() => {
    play();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  return (
    <Pressable onPress={play} accessibilityRole="button" accessibilityLabel="Replay preview" style={[styles.phone, pointer]}>
      <LinearGradient colors={['#2A1F66', '#5B3EE8', '#8B7CF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.phoneTrack}>
        <Animated.View style={[styles.phoneFill, barStyle]} />
      </View>
      <View style={styles.phoneTag}>
        <Text style={styles.phoneTagText}>{style === 'talking' ? 'Said to camera' : 'On-screen text'}</Text>
      </View>
      <View style={style === 'talking' ? styles.subtitleWrap : styles.bigTextWrap}>
        <Text style={style === 'talking' ? styles.subtitle : styles.bigText}>
          {words.map((w, i) => (
            <Text key={i} style={{ opacity: i < shown ? 1 : 0 }}>
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </Text>
          ))}
        </Text>
      </View>
      <Text style={styles.replay}>Tap to replay</Text>
    </Pressable>
  );
}

function HookCard({
  hook,
  index,
  style,
  open,
  liked,
  onToggle,
  onLike,
  onUse,
}: {
  hook: Hook;
  index: number;
  style: FilmStyle;
  open: boolean;
  liked: boolean;
  onToggle: () => void;
  onLike: () => void;
  onUse: () => void;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 90).duration(340).easing(Easing.out(Easing.cubic))}>
      <GlassCard strong radius={22} padding={14}>
        <View style={styles.hookTop}>
          <View style={styles.hookTag}>
            <Text style={styles.hookTagText}>{ANGLES.find((a) => a.id === hook.angle)?.label}</Text>
          </View>
          <Pressable
            onPress={() => {
              tick();
              onLike();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Remove from saved hooks' : 'Save hook'}
            accessibilityState={{ selected: liked }}
            style={pointer}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill={liked ? '#E5484D' : 'none'}>
              <Path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0112 6.6 5.2 5.2 0 0121.3 12C19 16.6 12 21 12 21z" stroke={liked ? '#E5484D' : ds.text3} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
        <Text style={styles.hookLine}>“{hook.line}”</Text>
        {open && (
          <Animated.View entering={FadeIn.duration(220)}>
            <Preview line={hook.line} style={style} />
          </Animated.View>
        )}
        <View style={styles.hookActions}>
          <Pressable onPress={() => { tick(); onToggle(); }} accessibilityRole="button" style={({ pressed }) => [styles.previewBtn, open && styles.previewBtnOn, pressed && styles.pressed, pointer]}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d={open ? 'M6 6h12v12H6z' : 'M8 5v14l11-7z'} fill={open ? '#FFFFFF' : ds.purple} />
            </Svg>
            <Text style={[styles.previewText, open && { color: '#FFFFFF' }]}>{open ? 'Close' : 'Preview'}</Text>
          </Pressable>
          <View style={styles.flex}>
            <AppButton title="Use this" onPress={onUse} />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

interface HookStudioScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onUseHook?: (title: string, hook: string, style: FilmStyle) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const HookStudioScreen: React.FC<HookStudioScreenProps> = ({
  ideaTitle = '',
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onUseHook,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const pageWidth = usePageWidth();
  const [showProfile, setShowProfile] = useState(false);
  const [idea, setIdea] = useState(ideaTitle);
  const [focused, setFocused] = useState(false);
  const [style, setStyle] = useState<FilmStyle>(() => getDefaultFilmStyle(userProfile?.niches));
  const [angle, setAngle] = useState<Angle>('mistake');
  const { ai } = useCapabilities();
  const [hooks, setHooks] = useState<Hook[] | null>(null);
  // The kind of video the hooks on show were written for
  const [hooksStyle, setHooksStyle] = useState<FilmStyle>(style);
  const [thinking, setThinking] = useState(false);
  const [problem, setProblem] = useState<{ message: string; upgrade: boolean } | null>(null);
  // Lines already shown, so "New hooks" brings new ones
  const shown = useRef<string[]>([]);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  useMascotThinking(thinking);
  const [open, setOpen] = useState<string | null>(null);
  const saved = useSyncExternalStore(subscribeToSavedHooks, getSavedHooks);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2200);
  };
  const toggleSave = (line: string) => {
    const now = toggleSavedHook({ line, style, idea: idea.trim() });
    showToast(now ? 'Saved to your hooks' : 'Removed from your hooks');
  };
  const pickHook = (line: string, st: FilmStyle) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUseHook?.(idea.trim(), line, st);
  };

  const write = async (more: boolean) => {
    if (thinking) return;
    if (!idea.trim()) {
      setProblem({ message: 'Say what the video is about first.', upgrade: false });
      return;
    }
    tick();
    setProblem(null);
    setOpen(null);
    setThinking(true);
    if (!more) shown.current = [];
    const res = await requestHooks({ idea: idea.trim(), style, angle, avoid: shown.current.slice(-9) });
    if (!mounted.current) return;
    setThinking(false);
    if (!res.ok) {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setProblem(studioProblem(res));
      return;
    }
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const stamp = Date.now().toString(36);
    shown.current = [...shown.current, ...res.data.hooks].slice(-9);
    setHooksStyle(style);
    setHooksStyle(style);
    setHooks(res.data.hooks.map((line, i) => ({ id: `${stamp}-${i}`, line, angle })));
  };
  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={enter(0)} style={styles.headline}>
              <FitLines lines={['The first', <Text key="a" style={styles.accent}>3 seconds</Text>]} textStyle={styles.headlineText} maxFontSize={38} align="left" accessibilityLabel="The first 3 seconds" />
              <Text style={styles.sub}>Openings that make people stop scrolling.</Text>
            </Animated.View>

            {!ai ? (
              <NeedsJarvis tool="Hook Studio" />
            ) : (
            <>
            <StandInNote />

            {/* Idea */}
            <Animated.View entering={enter(60)} style={styles.ideaBlock}>
              <GlassCard strong radius={24} padding={16}>
                <View style={styles.ideaHead}>
                  <JarvisOrb size={24} />
                  <Text style={styles.eyebrow}>YOUR IDEA</Text>
                  <View style={styles.proTag}>
                    <Text style={styles.proTagText}>PRO</Text>
                  </View>
                </View>
                <View style={[styles.field, focused && styles.fieldOn]}>
                  <AutoGrowInput value={idea} onChangeText={setIdea} maxLength={300} placeholder="e.g. 3 mistakes new creators make" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} minHeight={26} style={styles.ideaInput} accessibilityLabel="Your idea" />
                </View>
              </GlassCard>
            </Animated.View>

            {/* Video type + angle */}
            <Animated.View entering={enter(120)}>
              <Text style={styles.section}>What kind of video?</Text>
              <View style={styles.chips}>
                {FILM_STYLES.map((s) => {
                  const on = s.id === style;
                  return (
                    <Pressable key={s.id} onPress={() => { tick(); setStyle(s.id); }} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed, pointer]}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Animated.View key={style} entering={FadeIn.duration(220)} style={styles.cue}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
                </Svg>
                <Text style={styles.cueText}>{CUE[style]}</Text>
              </Animated.View>

              <Text style={styles.section}>Open with…</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.angleBar} contentContainerStyle={styles.angles}>
                {ANGLES.map((a) => {
                  const on = a.id === angle;
                  return (
                    <Pressable key={a.id} onPress={() => { tick(); setAngle(a.id); }} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed, pointer]}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{a.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            <View style={styles.writeRow}>
              <AppButton title={thinking ? 'Jarvis is writing…' : 'Write 3 hooks'} size="lg" disabled={thinking || !idea.trim()} onPress={() => void write(false)} />
              <View style={styles.usage}>
                <UsageLine kind="generate" />
              </View>
            </View>

            {problem && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.problem}>
                <Problem message={problem.message} upgrade={problem.upgrade} onUpgrade={onOpenJarvisPro} />
              </Animated.View>
            )}

            {/* Hooks */}
            {(hooks || thinking) && (
            <View style={styles.hooksHead}>
              <Text style={[styles.section, styles.sectionInline]}>3 hooks to try</Text>
              {hooks && (
                <Pressable onPress={() => void write(true)} disabled={thinking} accessibilityRole="button" style={({ pressed }) => [styles.newBtn, thinking && { opacity: 0.5 }, pressed && styles.pressed, pointer]}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.newText}>New hooks</Text>
                </Pressable>
              )}
            </View>
            )}
            {thinking ? (
              <Animated.View entering={FadeIn.duration(150)} style={styles.thinking}>
                <JarvisOrb size={26} />
                <Text style={styles.thinkingText}>Jarvis is writing…</Text>
              </Animated.View>
            ) : hooks && (
              <View style={styles.stack}>
                {hooks.map((h, i) => (
                  <HookCard
                    key={h.id}
                    hook={h}
                    index={i}
                    style={hooksStyle}
                    open={open === h.id}
                    liked={saved.some((x) => x.line === h.line)}
                    onToggle={() => setOpen(open === h.id ? null : h.id)}
                    onLike={() => toggleSave(h.line)}
                    onUse={() => pickHook(h.line, hooksStyle)}
                  />
                ))}
              </View>
            )}

            {/* Saved hooks: hearts land here */}
            {saved.length > 0 && (
              <Animated.View entering={FadeInUp.duration(320)}>
                <Text style={styles.section}>Your saved hooks</Text>
                <GlassCard radius={22} padding={0}>
                  {saved.map((h, i) => (
                    <Animated.View key={h.line} entering={FadeIn.duration(220)} style={[styles.savedRow, i < saved.length - 1 && styles.savedLine]}>
                      <View style={styles.flex}>
                        <Text style={styles.savedText}>“{h.line}”</Text>
                        <Text style={styles.savedMeta} numberOfLines={1}>
                          {FILM_STYLES.find((f) => f.id === h.style)?.label ?? 'Talking'} · {h.idea}
                        </Text>
                      </View>
                      <Pressable onPress={() => pickHook(h.line, h.style as FilmStyle)} hitSlop={6} accessibilityRole="button" style={({ pressed }) => [styles.savedUse, pressed && styles.pressed, pointer]}>
                        <Text style={styles.savedUseText}>Use</Text>
                      </Pressable>
                      <Pressable onPress={() => { tick(); toggleSave(h.line); }} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove from saved hooks" style={pointer}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="#E5484D">
                          <Path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0112 6.6 5.2 5.2 0 0121.3 12C19 16.6 12 21 12 21z" stroke="#E5484D" strokeWidth={2} strokeLinejoin="round" />
                        </Svg>
                      </Pressable>
                    </Animated.View>
                  ))}
                </GlassCard>
              </Animated.View>
            )}
            </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="create" onTabPress={(t) => onNavigateTab?.(t)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  ideaBlock: { marginTop: 4 },
  writeRow: { marginTop: 18, gap: 8 },
  usage: { alignItems: 'center' },
  problem: { marginTop: 14 },
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.96 }] },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.9, color: ds.ink },
  accent: { color: ds.purple },
  sub: { fontSize: 14.5, lineHeight: 20, color: ds.text2, marginTop: 6 },
  eyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  proTag: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  ideaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  field: { borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 12 },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  ideaInput: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 22, marginBottom: 10 },
  sectionInline: { marginTop: 0, marginBottom: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  chipOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  chipText: { fontSize: 13.5, fontWeight: '800', color: ds.text2 },
  chipTextOn: { color: '#FFFFFF' },
  cue: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  cueText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600', color: ds.text2 },
  angleBar: { flexGrow: 0, marginHorizontal: -20 },
  angles: { gap: 8, paddingHorizontal: 20 },
  hooksHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: ds.lavender },
  newText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  thinkingText: { fontSize: 14, fontWeight: '700', color: ds.purple },
  stack: { gap: 10 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  savedLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  savedText: { fontSize: 14.5, lineHeight: 20, fontWeight: '800', color: ds.ink },
  savedMeta: { fontSize: 12, fontWeight: '600', color: ds.text3, marginTop: 2 },
  savedUse: { paddingHorizontal: 12, height: 32, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  savedUseText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },

  hookTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hookTag: { paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  hookTagText: { fontSize: 11, fontWeight: '800', color: ds.purple },
  hookLine: { fontSize: 17, lineHeight: 23, fontWeight: '800', color: ds.ink, marginTop: 10 },
  hookActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: ds.lavender },
  previewBtnOn: { backgroundColor: ds.purple },
  previewText: { fontSize: 14, fontWeight: '800', color: ds.purple },

  phone: { alignSelf: 'center', width: 170, height: 300, borderRadius: 22, overflow: 'hidden', marginTop: 12, justifyContent: 'center' },
  phoneTrack: { position: 'absolute', top: 10, left: 12, right: 12, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  phoneFill: { height: 3, backgroundColor: '#FFFFFF' },
  phoneTag: { position: 'absolute', top: 20, left: 12, paddingHorizontal: 8, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  phoneTagText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  bigTextWrap: { paddingHorizontal: 14 },
  bigText: { fontSize: 22, lineHeight: 27, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  subtitleWrap: { position: 'absolute', bottom: 40, left: 10, right: 10 },
  subtitle: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  replay: { position: 'absolute', bottom: 12, alignSelf: 'center', fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
});
