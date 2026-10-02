import React, { useEffect, useRef, useState } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { AppToast } from '../components/ui/AppToast';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import type { UserPersona } from '../components/HeaderDualModePills';
import { getVoiceCloneSummary } from '../data';
import { BuyMinutesSheet, VoiceAvatar, VoiceLibrarySheet, VOICES } from '../components/voice/VoiceSheets';
import { ds, goldTokens } from '../theme/colors';

// Voice Studio (Pro). New creators set up their voice first (read a short
// script aloud; mock until the voice model is connected), then everyone gets
// the same studio: write or paste a script, pick a voice and speed, make the
// voiceover, play it, and use it in a post. No audio-engineering jargon.

export interface AttachedVoiceoverData {
  title: string;
  voiceName: string;
  duration: string;
  speed: string;
}

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const SETUP_SCRIPT =
  'Hi, I’m setting up my voice for PostStreak. I make videos about the things I love, and I want my voiceovers to sound just like me.';
const DEFAULT_SCRIPT =
  'Stop making this mistake if you want to stay consistent. Consistency isn’t about working all day. It’s about a simple system that still works on slow days. Here are the three steps I use.';

const EXPRESSION = ['Steady', 'Natural', 'Lively'] as const;
const SPEEDS = [0.9, 1, 1.1, 1.2];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

// ─── Moving waveform ────────────────────────────────────────────────────────
function WaveBar({ i, active, base }: { i: number; active: boolean; base: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(base);
  useEffect(() => {
    if (active && !reduce) {
      t.value = withDelay((i % 7) * 70, withRepeat(withTiming(0.25 + ((i * 37) % 70) / 100, { duration: 360 + (i % 5) * 60, easing: Easing.inOut(Easing.sin) }), -1, true));
    } else {
      cancelAnimation(t);
      t.value = withTiming(base, smooth);
    }
  }, [active, reduce, i, base, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: t.value }] }));
  return <Animated.View style={[styles.waveBar, i % 4 === 2 && styles.waveBarGold, style]} />;
}

function Wave({ active, count = 24, height = 56 }: { active: boolean; count?: number; height?: number }) {
  return (
    <View style={[styles.wave, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }).map((_, i) => (
        <WaveBar key={i} i={i} active={active} base={0.2 + 0.6 * Math.abs(Math.sin(i * 0.55))} />
      ))}
    </View>
  );
}

// ─── Setup: read a short script aloud ───────────────────────────────────────
function VoiceSetup({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'ready' | 'recording' | 'learning'>('ready');
  const [secs, setSecs] = useState(0);
  const [tooShort, setTooShort] = useState(false);
  const pulse = useSharedValue(0);
  const learn = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('recording');
    setSecs(0);
    setTooShort(false);
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }), -1, false);
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
  };
  // Stops the moment it's tapped; too short just asks for another go
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    cancelAnimation(pulse);
    pulse.value = 0;
    if (secs < 5) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTooShort(true);
      setPhase('ready');
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('learning');
    learn.value = withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.cubic) });
    setTimeout(onDone, 2800);
  };

  const ring = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - pulse.value), transform: [{ scale: 1 + 0.5 * pulse.value }] }));
  const bar = useAnimatedStyle(() => ({ width: `${learn.value * 100}%` }));

  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.setupHead}>
        <View style={styles.proTag}>
          <Text style={styles.proTagText}>PRO</Text>
        </View>
        <Text style={styles.setupStep}>{phase === 'learning' ? 'Almost done' : 'One-time setup'}</Text>
      </View>
      <Text style={styles.cardTitle}>{phase === 'learning' ? 'Jarvis is learning your voice' : 'Read this out loud'}</Text>

      {phase !== 'learning' ? (
        <>
          <View style={styles.readBox}>
            <Text style={styles.readText}>{SETUP_SCRIPT}</Text>
          </View>
          <Wave active={phase === 'recording'} count={22} height={44} />
          <View style={styles.recRow}>
            <View style={styles.recBtnWrap}>
              {phase === 'recording' && <Animated.View pointerEvents="none" style={[styles.recRing, ring]} />}
              <Pressable
                onPress={phase === 'ready' ? start : stop}
                accessibilityRole="button"
                accessibilityLabel={phase === 'ready' ? 'Start recording' : 'Stop recording'}
                style={({ pressed }) => [styles.recBtn, phase === 'recording' && styles.recBtnOn, pressed && styles.pressed, pointer]}
              >
                {phase === 'ready' ? (
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                    <Rect x="9" y="2" width="6" height="12" rx="3" fill="#FFFFFF" />
                    <Path d="M5 11a7 7 0 0014 0M12 18v4" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
                  </Svg>
                ) : (
                  <View style={styles.stopSquare} />
                )}
              </Pressable>
            </View>
            <Text style={styles.recHint}>
              {phase === 'recording'
                ? `${clock(secs)} · tap to stop`
                : tooShort
                  ? 'That was a little short. Read the whole sentence, then stop.'
                  : 'Tap to start. Somewhere quiet works best.'}
            </Text>
          </View>
        </>
      ) : (
        <Animated.View entering={FadeIn.duration(240)}>
          <View style={styles.learnRow}>
            <JarvisOrb size={34} />
            <Text style={styles.learnText}>Picking up your tone and pace…</Text>
          </View>
          <View style={styles.learnTrack}>
            <Animated.View style={[styles.learnFill, bar]} />
          </View>
        </Animated.View>
      )}
    </GlassCard>
  );
}

// ─── Speed switch (sliding pill) ────────────────────────────────────────────
function SpeedSwitch({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [w, setW] = useState(0);
  const idx = SPEEDS.indexOf(value);
  const cell = w / SPEEDS.length;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(idx * cell, smooth);
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.switchTrack}
      accessibilityRole="radiogroup"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 6;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = idx * (nw / SPEEDS.length);
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.switchPill, { width: cell }, pill]} />}
      {SPEEDS.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            onPress={() => {
              tick();
              onChange(s);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.switchCell, pointer]}
          >
            <Text style={[styles.switchText, on && styles.switchTextOn]}>{s === 1 ? 'Normal' : `${s}×`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Player ─────────────────────────────────────────────────────────────────
function Player({ title, voice, seconds, speed }: { title: string; voice: string; seconds: number; speed: number }) {
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const p = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const toggle = () => {
    tick();
    if (playing) {
      if (timer.current) clearInterval(timer.current);
      cancelAnimation(p);
      setPlaying(false);
      return;
    }
    const from = at >= seconds ? 0 : at;
    setAt(from);
    setPlaying(true);
    p.value = from / seconds;
    p.value = withTiming(1, { duration: (seconds - from) * 1000, easing: Easing.linear });
    const started = Date.now();
    timer.current = setInterval(() => {
      const now = Math.min(seconds, from + (Date.now() - started) / 1000);
      setAt(now);
      if (now >= seconds) {
        if (timer.current) clearInterval(timer.current);
        setPlaying(false);
      }
    }, 200);
  };

  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View>
      <View style={styles.playerHead}>
        <View style={styles.flex}>
          <Text style={styles.playerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.playerMeta}>
            {voice} · {speed === 1 ? 'normal speed' : `${speed}×`}
          </Text>
        </View>
        <Text style={styles.playerTime}>
          {clock(at)} / {clock(seconds)}
        </Text>
      </View>
      <View style={styles.playerRow}>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          style={({ pressed }) => [styles.playBtn, pressed && styles.pressed, pointer]}
        >
          {playing ? (
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Rect x="6" y="5" width="4" height="14" rx="1" fill="#FFFFFF" />
              <Rect x="14" y="5" width="4" height="14" rx="1" fill="#FFFFFF" />
            </Svg>
          ) : (
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
            </Svg>
          )}
        </Pressable>
        <View style={styles.flex}>
          <Wave active={playing} count={20} height={34} />
          <View style={styles.progTrack}>
            <Animated.View style={[styles.progFill, fill]} />
          </View>
        </View>
      </View>
    </View>
  );
}

interface VoiceStudioScreenProps {
  /** Script handed over from the Script page */
  initialScript?: string;
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, attachedAudio?: AttachedVoiceoverData) => void;
  onSwitchToFree?: () => void;
  onTogglePersona?: () => void;
  userPersona?: UserPersona;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const VoiceStudioScreen: React.FC<VoiceStudioScreenProps> = ({
  initialScript,
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenPostComposer,
  onSwitchToFree,
  onTogglePersona,
  userPersona,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const pageWidth = usePageWidth();
  const isNew = (userPersona || userProfile?.userPersona || 'new') === 'new';
  const summary = getVoiceCloneSummary(isNew ? 'new' : 'returning');
  const [showProfile, setShowProfile] = useState(false);
  const [myVoice, setMyVoice] = useState<string | null>(summary.voiceName ? 'My voice' : null);
  const [used, setUsed] = useState(summary.minutesUsed);
  const [voice, setVoice] = useState<string>(summary.voiceName ? 'mine' : 'ava');
  const [expression, setExpression] = useState<(typeof EXPRESSION)[number]>('Natural');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [extra, setExtra] = useState(0);
  const [script, setScript] = useState(initialScript || DEFAULT_SCRIPT);
  const [focused, setFocused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'making' | 'ready'>('idle');
  const [take, setTake] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const included = summary.minutesIncluded;
  const left = Math.max(0, included - used) + extra;
  const words = script.trim() ? script.trim().split(/\s+/).length : 0;
  const seconds = Math.max(3, Math.round(words / 2.6 / speed));
  const libVoice = VOICES.find((v) => v.id === voice);
  const voiceName = voice === 'mine' ? 'My voice' : libVoice?.name ?? 'Narrator';
  const title = script.trim().split(/[.!?]/)[0]?.slice(0, 60) || 'Voiceover';

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2400);
  };

  const make = () => {
    if (!words) {
      showToast('Add a few words to read first');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('making');
    setTimeout(() => {
      setUsed((u) => u + Math.max(1, Math.ceil(seconds / 60)));
      setTake((t) => t + 1);
      setPhase('ready');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1800);
  };

  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));
  const meter = useSharedValue(0);
  useEffect(() => {
    meter.value = withTiming(Math.min(1, left / included), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [left, included, meter]);
  const meterStyle = useAnimatedStyle(() => ({ width: `${meter.value * 100}%` }));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onSwitchToFree={onSwitchToFree}
          onTogglePersona={onTogglePersona}
          userPersona={userPersona}
          onOpenProfile={() => setShowProfile(true)}
          userProfile={userProfile}
        />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={enter(0)} style={styles.headline}>
              <FitLines
                lines={['Your voice,', <Text key="a" style={styles.accent}>on every video</Text>]}
                textStyle={styles.headlineText}
                maxFontSize={34}
                align="left"
                accessibilityLabel="Your voice, on every video"
              />
            </Animated.View>

            {!myVoice ? (
              <Animated.View entering={enter(80)}>
                <VoiceSetup
                  onDone={() => {
                    setMyVoice('My voice');
                    setVoice('mine');
                    showToast('Your voice is ready');
                  }}
                />
                <Pressable onPress={() => setMyVoice('skip')} accessibilityRole="button" style={({ pressed }) => [styles.skip, pressed && styles.pressed, pointer]}>
                  <Text style={styles.skipText}>Use a ready-made voice for now</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                {/* Minutes */}
                <Animated.View entering={enter(80)}>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.eyebrow}>VOICE MINUTES</Text>
                      <View style={styles.proTag}>
                        <Text style={styles.proTagText}>PRO</Text>
                      </View>
                    </View>
                    <View style={styles.minutesRow}>
                      <Text style={styles.minutesBig}>{left}</Text>
                      <Text style={styles.minutesOf}>{extra > 0 ? 'minutes left' : `of ${included} minutes left this month`}</Text>
                    </View>
                    <View style={styles.meterTrack}>
                      <Animated.View style={[styles.meterFill, meterStyle]} />
                    </View>
                    {extra > 0 && <Text style={styles.extraNote}>{Math.max(0, included - used)} monthly + {extra} extra you bought</Text>}
                    <Pressable onPress={() => setShowBuy(true)} accessibilityRole="button" style={({ pressed }) => [styles.buyLink, pressed && styles.pressed, pointer]}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M12 5v14M5 12h14" stroke={goldTokens.dark} strokeWidth={2.6} strokeLinecap="round" />
                      </Svg>
                      <Text style={styles.buyLinkText}>Get more minutes</Text>
                    </Pressable>
                  </GlassCard>
                </Animated.View>

                {/* Script */}
                <Animated.View entering={enter(160)}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.section}>Your script</Text>
                    <Text style={styles.count}>
                      {words} words · about {seconds}s
                    </Text>
                  </View>
                  <View style={[styles.field, focused && styles.fieldOn]}>
                    <AutoGrowInput
                      value={script}
                      onChangeText={(t) => {
                        setScript(t);
                        if (phase === 'ready') setPhase('idle');
                      }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      minHeight={110}
                      style={styles.scriptInput}
                      accessibilityLabel="Your script"
                    />
                  </View>
                </Animated.View>

                {/* Voice + speed */}
                <Animated.View entering={enter(240)}>
                  <Text style={styles.section}>Voice</Text>
                  <Pressable
                    onPress={() => {
                      tick();
                      setShowLibrary(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Voice: ${voiceName}. Change voice`}
                    style={({ pressed }) => [styles.voiceCard, pressed && { transform: [{ scale: 0.98 }] }, pointer]}
                  >
                    {voice === 'mine' || !libVoice ? (
                      <View style={styles.mineAvatar}>
                        <JarvisOrb size={30} />
                      </View>
                    ) : (
                      <VoiceAvatar voice={libVoice} />
                    )}
                    <View style={styles.flex}>
                      <Text style={styles.voiceCardName}>{voiceName}</Text>
                      <Text style={styles.voiceCardFeel} numberOfLines={1}>
                        {voice === 'mine' ? 'Your own voice' : `${libVoice?.feel} · ${libVoice?.accent}`}
                      </Text>
                    </View>
                    <View style={styles.changePill}>
                      <Text style={styles.changeText}>Change</Text>
                    </View>
                  </Pressable>
                  {myVoice === 'skip' && (
                    <Pressable onPress={() => setMyVoice(null)} accessibilityRole="button" style={pointer}>
                      <Text style={styles.setupLink}>Set up your own voice</Text>
                    </Pressable>
                  )}
                  <Text style={styles.subSection}>Expression</Text>
                  <View style={styles.exprRow}>
                    {EXPRESSION.map((e) => {
                      const on = e === expression;
                      return (
                        <Pressable
                          key={e}
                          onPress={() => {
                            tick();
                            setExpression(e);
                            if (phase === 'ready') setPhase('idle');
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                          style={({ pressed }) => [styles.expr, on && styles.exprOn, pressed && styles.pressed, pointer]}
                        >
                          <Text style={[styles.exprText, on && styles.exprTextOn]}>{e}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.subSection}>Speed</Text>
                  <SpeedSwitch
                    value={speed}
                    onChange={(s) => {
                      setSpeed(s);
                      if (phase === 'ready') setPhase('idle');
                    }}
                  />
                </Animated.View>

                {/* Make / result */}
                <Animated.View entering={enter(320)} style={styles.makeWrap}>
                  {phase !== 'ready' ? (
                    <AppButton
                      title={phase === 'making' ? 'Making your voiceover…' : 'Make voiceover'}
                      size="lg"
                      disabled={phase === 'making'}
                      onPress={make}
                      iconRight={
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h0" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
                        </Svg>
                      }
                    />
                  ) : null}
                  {phase === 'making' && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.making}>
                      <Wave active count={26} height={48} />
                    </Animated.View>
                  )}
                  {phase === 'ready' && (
                    <Animated.View key={take} entering={FadeInUp.duration(360).easing(Easing.out(Easing.cubic))}>
                      <GlassCard strong radius={24} padding={16}>
                        <View style={styles.readyChip}>
                          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                            <Path d="M20 6L9 17l-5-5" stroke={ds.greenFill} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                          <Text style={styles.readyText}>Ready</Text>
                        </View>
                        <Player title={title} voice={voiceName} seconds={seconds} speed={speed} />
                        <View style={styles.resultActions}>
                          <AppButton
                            title="Use in a post"
                            onPress={() =>
                              onOpenPostComposer?.(title, {
                                title,
                                voiceName,
                                duration: clock(seconds),
                                speed: speed === 1 ? '1.0×' : `${speed}×`,
                              })
                            }
                          />
                          <AppButton title="Make another take" variant="glass" onPress={make} />
                        </View>
                      </GlassCard>
                    </Animated.View>
                  )}
                </Animated.View>

                {/* Jarvis tip */}
                <Animated.View entering={enter(400)}>
                  <GlassCard radius={22} padding={14} style={styles.tip}>
                    <View style={styles.tipRow}>
                      <JarvisOrb size={26} />
                      <Text style={styles.tipText}>
                        {seconds > 45
                          ? `This is about ${seconds} seconds. Under 45 keeps more people watching.`
                          : 'Say the main point in the first line. People decide in the first few seconds.'}
                      </Text>
                    </View>
                  </GlassCard>
                </Animated.View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <VoiceLibrarySheet
        visible={showLibrary}
        onClose={() => setShowLibrary(false)}
        selected={voice}
        hasMyVoice={!!myVoice && myVoice !== 'skip'}
        onPick={(id) => {
          setVoice(id);
          if (phase === 'ready') setPhase('idle');
          setTimeout(() => setShowLibrary(false), 250);
        }}
      />
      <BuyMinutesSheet
        visible={showBuy}
        onClose={() => setShowBuy(false)}
        minutesLeft={left}
        onBuy={(m) => {
          setExtra((x) => x + m);
          setShowBuy(false);
          showToast(`${m} minutes added`);
        }}
      />
      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="create" onTabPress={(t) => onNavigateTab?.(t)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.96 }] },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  accent: { color: ds.purple },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  cardTitle: { fontSize: 19, fontWeight: '800', color: ds.ink, letterSpacing: -0.3, marginTop: 8 },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  subSection: { fontSize: 13.5, fontWeight: '800', color: ds.text2, marginTop: 16, marginBottom: 8 },
  count: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },

  proTag: { alignSelf: 'flex-start', paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },

  setupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setupStep: { fontSize: 12, fontWeight: '700', color: ds.text3 },
  readBox: { marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  readText: { fontSize: 16, lineHeight: 24, fontWeight: '700', color: ds.ink },
  recRow: { alignItems: 'center', gap: 10, marginTop: 4 },
  recBtnWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  recRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: ds.purple },
  recBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: ds.purple, alignItems: 'center', justifyContent: 'center', shadowColor: ds.purple, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  recBtnOn: { backgroundColor: '#E5484D', shadowColor: '#E5484D' },
  stopSquare: { width: 20, height: 20, borderRadius: 5, backgroundColor: '#FFFFFF' },
  recHint: { fontSize: 13, fontWeight: '700', color: ds.text2, textAlign: 'center' },
  learnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  learnText: { flex: 1, fontSize: 14, fontWeight: '700', color: ds.text2 },
  learnTrack: { height: 8, borderRadius: 4, backgroundColor: ds.lavender, overflow: 'hidden', marginTop: 14 },
  learnFill: { height: 8, borderRadius: 4, backgroundColor: ds.purple },
  skip: { alignSelf: 'center', height: 44, justifyContent: 'center', paddingHorizontal: 12, marginTop: 6 },
  skipText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  setupLink: { fontSize: 13, fontWeight: '800', color: ds.purple, marginTop: 10 },

  minutesRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  minutesBig: { fontSize: 36, lineHeight: 42, fontWeight: '800', color: ds.ink, letterSpacing: -1 },
  minutesOf: { fontSize: 13.5, fontWeight: '600', color: ds.text2 },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: ds.lavender, overflow: 'hidden', marginTop: 10 },
  meterFill: { height: 8, borderRadius: 4, backgroundColor: ds.purple },

  field: { borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: 14 },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  scriptInput: { fontSize: 15.5, lineHeight: 23, fontWeight: '600' },

  voices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voiceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  mineAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  voiceCardName: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  voiceCardFeel: { fontSize: 12.5, fontWeight: '600', color: ds.text2, marginTop: 2 },
  changePill: { paddingHorizontal: 12, height: 32, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  changeText: { fontSize: 13, fontWeight: '800', color: ds.purple },
  exprRow: { flexDirection: 'row', gap: 8 },
  expr: { flex: 1, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  exprOn: { borderColor: ds.purple, backgroundColor: ds.lavenderSoft },
  exprText: { fontSize: 13.5, fontWeight: '700', color: ds.text2 },
  exprTextOn: { color: ds.purple, fontWeight: '800' },
  extraNote: { fontSize: 12, fontWeight: '700', color: goldTokens.dark, marginTop: 8 },
  buyLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, height: 34, borderRadius: 999, backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  buyLinkText: { fontSize: 13, fontWeight: '800', color: goldTokens.dark },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  voiceChipOn: { borderColor: ds.purple, backgroundColor: ds.lavenderSoft },
  voiceText: { fontSize: 13.5, fontWeight: '700', color: ds.text2 },
  voiceTextOn: { color: ds.purple, fontWeight: '800' },

  switchTrack: { flexDirection: 'row', padding: 3, height: 42, borderRadius: 999, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender },
  switchPill: { position: 'absolute', top: 3, left: 3, bottom: 3, borderRadius: 999, backgroundColor: ds.purple },
  switchCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  switchText: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  switchTextOn: { color: '#FFFFFF' },

  makeWrap: { marginTop: 24 },
  making: { marginTop: 12 },
  wave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginVertical: 8 },
  waveBar: { width: 4, height: '100%', borderRadius: 2, backgroundColor: '#8B72F5' },
  waveBarGold: { backgroundColor: ds.gold },
  readyChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: ds.greenBg, marginBottom: 10 },
  readyText: { fontSize: 11, fontWeight: '800', color: ds.greenFill },
  playerHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  playerTitle: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  playerMeta: { fontSize: 12.5, fontWeight: '700', color: ds.text3, marginTop: 2 },
  playerTime: { fontSize: 13, fontWeight: '800', color: ds.purple },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  playBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: ds.purple, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  progTrack: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, overflow: 'hidden' },
  progFill: { height: 6, borderRadius: 3, backgroundColor: ds.purple },
  resultActions: { gap: 10, marginTop: 16 },

  tip: { marginTop: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.text2, fontWeight: '600' },
});
