import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, Image } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { FILM_STYLES, type FilmStyle, type LikeThisIdea, type StudioVideo, type VideoMoment, type VideoRecipePart } from '../../data';
import { ds } from '../../theme/colors';

// The "A video I made" side of Repurpose. Jarvis watches the video (frame by
// frame, then a second pass), shows what stands out as things to tap rather
// than a wall of text, then deals out new video ideas with the same shape.

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };

export const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

// ─── Source switch ──────────────────────────────────────────────────────────
export type StudioSource = 'idea' | 'video' | 'link';
const SOURCES: { id: StudioSource; label: string }[] = [
  { id: 'idea', label: 'An idea' },
  { id: 'video', label: 'My post' },
  { id: 'link', label: 'A link' },
];

export function SourceSwitch({ value, onChange }: { value: StudioSource; onChange: (v: StudioSource) => void }) {
  const [w, setW] = useState(0);
  const idx = SOURCES.findIndex((s) => s.id === value);
  const cell = w / SOURCES.length;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(idx * cell, smooth);
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.switchTrack}
      accessibilityRole="tablist"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 8;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = idx * (nw / SOURCES.length);
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.switchPill, { width: cell }, pill]} />}
      {SOURCES.map((s) => {
        const on = s.id === value;
        return (
          <Pressable
            key={s.id}
            onPress={() => {
              tick();
              onChange(s.id);
            }}
            style={[styles.switchCell, pointer]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.switchText, on && styles.switchTextOn]} numberOfLines={1}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Video thumb (9:16) ─────────────────────────────────────────────────────
function Thumb({ video, width = 64 }: { video: StudioVideo; width?: number }) {
  const h = Math.round((width * 16) / 9);
  return (
    <View style={[styles.thumb, { width, height: h }]}>
      {video.source === 'post' ? (
        <Image source={require('../../../assets/images/amara-portrait.jpg')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#2A1F66', '#5B3EE8', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.thumbPlay}>
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
        </Svg>
      </View>
      <View style={styles.thumbTime}>
        <Text style={styles.thumbTimeText}>{clock(video.seconds)}</Text>
      </View>
    </View>
  );
}

// ─── Add a video ────────────────────────────────────────────────────────────
export function VideoPicker({
  video,
  style,
  onChoose,
  onFilm,
  onClear,
  onStyle,
}: {
  video: StudioVideo | null;
  style: FilmStyle;
  onChoose: () => void;
  onFilm: () => void;
  onClear: () => void;
  onStyle: (s: FilmStyle) => void;
}) {
  if (!video) {
    return (
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.drop}>
          <View style={styles.dropIcon}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path d="M15 10l5-3v10l-5-3M4 6h11v12H4z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.dropTitle}>Add a video you made</Text>
          <Text style={styles.dropBody}>Jarvis watches it and helps you make the next one.</Text>
        </View>
        <View style={styles.dropActions}>
          <AppButton title="Choose a video" onPress={onChoose} />
          <AppButton title="Film one now" variant="glass" onPress={onFilm} />
        </View>
      </GlassCard>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(260)}>
      <GlassCard strong radius={24} padding={14}>
        <View style={styles.pickedRow}>
          <Thumb video={video} />
          <View style={styles.flex}>
            <Text style={styles.pickedName} numberOfLines={3}>
              {video.name}
            </Text>
            <Text style={styles.pickedMeta}>
              {clock(video.seconds)} ·{' '}
              {video.source === 'post' ? `Your ${PLATFORM_NAMES[video.platform ?? 'tiktok']} post` : video.source === 'camera' ? 'Just filmed' : 'From your phone'}
            </Text>
            <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" style={pointer}>
              <Text style={styles.change}>Change video</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.kindLabel}>What kind of video is it?</Text>
        <View style={styles.kindRow}>
          {FILM_STYLES.map((s) => {
            const on = s.id === style;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  tick();
                  onStyle(s.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [styles.kind, on && styles.kindOn, pressed && styles.pressed, pointer]}
              >
                <Text style={[styles.kindText, on && styles.kindTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Watching (two passes) ──────────────────────────────────────────────────
const STEPS = ['Watching frame by frame', 'Listening to the sound', 'Rewatching for anything missed', 'Finding what stands out'];
const STEP_MS = 1300;
const FRAMES = 7;

export function WatchingCard({ video, onDone }: { video: StudioVideo; onDone: () => void }) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const done = useRef(false);
  const total = STEP_MS * STEPS.length;
  const scan = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: total, easing: Easing.linear });
    const start = Date.now();
    const id = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      if (e >= total && !done.current) {
        done.current = true;
        clearInterval(id);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDone();
      }
    }, 90);
    return () => clearInterval(id);
  }, [onDone, progress, total]);

  useEffect(() => {
    if (w > 0 && !reduced) scan.value = withRepeat(withTiming(w, { duration: STEP_MS, easing: Easing.linear }), -1, false);
  }, [w, reduced, scan]);

  const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateX: scan.value }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const step = Math.min(STEPS.length - 1, Math.floor(elapsed / STEP_MS));
  const frames = video.seconds * 3;
  // Pass 1 over the first two steps, pass 2 over the last two
  const half = total / 2;
  const pass = elapsed < half ? 1 : 2;
  const frame = Math.min(frames, Math.max(1, Math.round(((elapsed % half) / half) * frames)));

  return (
    <GlassCard strong radius={24} padding={16}>
      <View style={styles.watchHead}>
        <JarvisOrb size={30} />
        <View style={styles.flex}>
          <Text style={styles.watchTitle}>Jarvis is watching</Text>
          <Text style={styles.watchMeta}>
            Pass {pass} of 2 · frame {frame} of {frames}
          </Text>
        </View>
      </View>

      <View style={styles.strip} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {Array.from({ length: FRAMES }).map((_, i) => (
          <View key={i} style={[styles.frame, { opacity: 0.35 + ((i * 37) % 60) / 100 }]} />
        ))}
        {w > 0 && (
          <Animated.View pointerEvents="none" style={[styles.scanner, scanStyle]}>
            <LinearGradient colors={['rgba(91,62,232,0)', 'rgba(91,62,232,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanTrail} />
            <View style={styles.scanLine} />
          </Animated.View>
        )}
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, barStyle]} />
      </View>

      <View style={styles.steps}>
        {STEPS.map((s, i) => {
          const state = i < step || elapsed >= total ? 'done' : i === step ? 'now' : 'next';
          return (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepDot, state === 'done' && styles.stepDotDone, state === 'now' && styles.stepDotNow]}>
                {state === 'done' && (
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.stepText, state === 'next' && styles.stepTextNext, state === 'now' && styles.stepTextNow]}>{s}</Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ─── Moments timeline ───────────────────────────────────────────────────────
export function MomentTimeline({ seconds, moments }: { seconds: number; moments: VideoMoment[] }) {
  const [sel, setSel] = useState(0);
  const [w, setW] = useState(0);
  const DOT = 22;
  const usable = Math.max(0, w - DOT);
  const pos = (m: VideoMoment) => (Math.min(m.at, seconds) / Math.max(1, seconds)) * usable;
  const fill = useSharedValue(0);
  useEffect(() => {
    if (w > 0) fill.value = withTiming(pos(moments[sel]) + DOT / 2, smooth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, w]);
  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));
  const m = moments[sel];

  return (
    <GlassCard strong radius={24} padding={16}>
      <Text style={styles.cardEyebrow}>TAP A MOMENT</Text>
      <View style={styles.timeline} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={styles.tlTrack} />
        <Animated.View style={[styles.tlFill, fillStyle]} />
        {w > 0 &&
          moments.map((mo, i) => {
            const on = i === sel;
            return (
              <Pressable
                key={`${mo.at}-${i}`}
                onPress={() => {
                  tick();
                  setSel(i);
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`${clock(mo.at)}, ${mo.label}`}
                accessibilityState={{ selected: on }}
                style={[styles.tlDotWrap, { left: pos(mo) }, pointer]}
              >
                <View style={[styles.tlDot, i <= sel && styles.tlDotPast, on && styles.tlDotOn]} />
              </Pressable>
            );
          })}
      </View>
      <View style={styles.tlEnds}>
        <Text style={styles.tlEndText}>0:00</Text>
        <Text style={styles.tlEndText}>{clock(seconds)}</Text>
      </View>
      <Animated.View key={sel} entering={FadeIn.duration(220)} style={styles.momentCard}>
        <View style={styles.momentTop}>
          <View style={styles.momentTime}>
            <Text style={styles.momentTimeText}>{clock(m.at)}</Text>
          </View>
          <Text style={styles.momentLabel}>{m.label}</Text>
        </View>
        <Text style={styles.momentNote}>{m.note}</Text>
      </Animated.View>
    </GlassCard>
  );
}

// ─── What stands out ────────────────────────────────────────────────────────
function RecipeIcon({ id }: { id: VideoRecipePart['id'] }) {
  const c = ds.purple;
  const paths: Record<VideoRecipePart['id'], React.ReactNode> = {
    opening: <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={c} strokeWidth={2} strokeLinejoin="round" />,
    sound: <Path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" stroke={c} strokeWidth={2} strokeLinejoin="round" />,
    pace: (
      <>
        <Circle cx="12" cy="13" r="8" stroke={c} strokeWidth={2} />
        <Path d="M12 9v4l2.5 2.5M10 2h4" stroke={c} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    tone: <Path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0112 6.6 5.2 5.2 0 0121.3 12C19 16.6 12 21 12 21z" stroke={c} strokeWidth={2} strokeLinejoin="round" />,
  };
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      {paths[id]}
    </Svg>
  );
}

export function RecipeGrid({ recipe }: { recipe: VideoRecipePart[] }) {
  return (
    <View style={styles.recipe}>
      {recipe.map((r, i) => (
        <Animated.View key={r.id} entering={FadeInUp.delay(80 * i).duration(320).easing(Easing.out(Easing.cubic))} style={styles.recipeTile}>
          <View style={styles.recipeIcon}>
            <RecipeIcon id={r.id} />
          </View>
          <Text style={styles.recipeLabel}>{r.label}</Text>
          <Text style={styles.recipeValue}>{r.value}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

// ─── Idea deck ──────────────────────────────────────────────────────────────
export function IdeaDeck({
  ideas,
  platforms,
  savedIds,
  onFilm,
  onToggleSave,
  onMore,
}: {
  ideas: LikeThisIdea[];
  platforms: string[];
  savedIds: string[];
  onFilm: (idea: LikeThisIdea) => void;
  onToggleSave: (idea: LikeThisIdea) => void;
  onMore: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [plat, setPlat] = useState(platforms[0]);
  useEffect(() => setIdx(0), [ideas]);
  useEffect(() => {
    if (!platforms.includes(plat)) setPlat(platforms[0]);
  }, [platforms, plat]);

  const idea = ideas[idx];
  if (!idea) return null;
  const saved = savedIds.includes(idea.id);
  const go = (d: 1 | -1) => {
    const n = idx + d;
    if (n < 0 || n >= ideas.length) return;
    tick();
    setDir(d);
    setIdx(n);
  };
  const enter = (dir === 1 ? FadeInRight : FadeInLeft).duration(280).easing(Easing.out(Easing.cubic));
  const tweakPlatforms = platforms.filter((p) => idea.tweaks[p]);

  return (
    <View>
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.deckTop}>
          <Text style={styles.cardEyebrow}>
            IDEA {idx + 1} OF {ideas.length}
          </Text>
          <View style={styles.deckNav}>
            <NavButton dir={-1} disabled={idx === 0} onPress={() => go(-1)} />
            <NavButton dir={1} disabled={idx === ideas.length - 1} onPress={() => go(1)} />
          </View>
        </View>

        <Animated.View key={idea.id} entering={enter}>
          <Text style={styles.ideaTitle}>{idea.title}</Text>
          <Text style={styles.keepsLabel}>Keeps from your video</Text>
          <View style={styles.keeps}>
            {idea.keeps.map((k) => (
              <View key={k} style={styles.keep}>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 6L9 17l-5-5" stroke={ds.purple} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.keepText}>{k}</Text>
              </View>
            ))}
          </View>

          {tweakPlatforms.length > 0 && (
            <>
              <Text style={styles.keepsLabel}>Small change for each platform</Text>
              <View style={styles.platRow}>
                {tweakPlatforms.map((p) => {
                  const on = p === plat;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => {
                        tick();
                        setPlat(p);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={PLATFORM_NAMES[p]}
                      accessibilityState={{ selected: on }}
                      style={({ pressed }) => [styles.platBtn, on && styles.platBtnOn, pressed && styles.pressed, pointer]}
                    >
                      <PlatformLogo type={p as PlatformLogoType} size={26} />
                    </Pressable>
                  );
                })}
              </View>
              {idea.tweaks[plat] && (
                <Animated.View key={`${idea.id}-${plat}`} entering={FadeIn.duration(200)} style={styles.tweak}>
                  <Text style={styles.tweakText}>
                    <Text style={styles.tweakName}>{PLATFORM_NAMES[plat]}: </Text>
                    {idea.tweaks[plat]}
                  </Text>
                </Animated.View>
              )}
            </>
          )}
        </Animated.View>

        <View style={styles.deckActions}>
          <View style={styles.flex}>
            <AppButton title="Film this" onPress={() => onFilm(idea)} />
          </View>
          <Pressable
            onPress={() => {
              tick();
              onToggleSave(idea);
            }}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from drafts' : 'Save to drafts'}
            accessibilityState={{ selected: saved }}
            style={({ pressed }) => [styles.saveBtn, saved && styles.saveBtnOn, pressed && styles.pressed, pointer]}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill={saved ? '#FFFFFF' : 'none'}>
              <Path d="M6 3h12v18l-6-4-6 4z" stroke={saved ? '#FFFFFF' : ds.purple} strokeWidth={2.1} strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </GlassCard>

      <View style={styles.dots}>
        {ideas.map((it, i) => (
          <View key={it.id} style={[styles.dot, i === idx && styles.dotOn]} />
        ))}
      </View>

      <Pressable onPress={onMore} accessibilityRole="button" style={({ pressed }) => [styles.more, pressed && styles.pressed, pointer]}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={styles.moreText}>Show 3 different ideas</Text>
      </Pressable>
    </View>
  );
}

function NavButton({ dir, disabled, onPress }: { dir: 1 | -1; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={dir === 1 ? 'Next idea' : 'Previous idea'}
      style={({ pressed }) => [styles.navBtn, disabled && styles.navBtnOff, pressed && styles.pressed, !disabled && pointer]}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d={dir === 1 ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} stroke={disabled ? ds.text3 : ds.purple} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

const glassFill = {
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.95)',
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.96 }] },

  switchTrack: { flexDirection: 'row', padding: 4, borderRadius: 999, height: 48, ...glassFill },
  switchPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: ds.purple,
    shadowColor: ds.purpleLedge,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  switchCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  switchText: { fontSize: 14, fontWeight: '800', color: ds.text2 },
  switchTextOn: { color: '#FFFFFF' },

  thumb: { borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purpleLedge },
  thumbPlay: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  thumbTime: { position: 'absolute', bottom: 6, right: 6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)' },
  thumbTimeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  drop: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(91, 62, 232, 0.35)',
    backgroundColor: 'rgba(245, 243, 255, 0.7)',
  },
  dropIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  dropTitle: { fontSize: 16.5, fontWeight: '800', color: ds.ink, textAlign: 'center' },
  dropBody: { fontSize: 13.5, lineHeight: 19, color: ds.text2, textAlign: 'center', marginTop: 4 },
  dropActions: { gap: 10, marginTop: 14 },

  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pickedName: { fontSize: 15.5, lineHeight: 21, fontWeight: '800', color: ds.ink },
  pickedMeta: { fontSize: 12.5, fontWeight: '700', color: ds.text3, marginTop: 3 },
  change: { fontSize: 13, fontWeight: '800', color: ds.purple, marginTop: 8 },
  kindLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginTop: 16, marginBottom: 8 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kind: { paddingHorizontal: 12, height: 36, borderRadius: 999, justifyContent: 'center', ...glassFill },
  kindOn: { backgroundColor: ds.lavender, borderColor: ds.purple },
  kindText: { fontSize: 13, fontWeight: '700', color: ds.text2 },
  kindTextOn: { color: ds.purple, fontWeight: '800' },

  watchHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  watchTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  watchMeta: { fontSize: 12.5, fontWeight: '700', color: ds.purple, marginTop: 2 },
  strip: { flexDirection: 'row', gap: 4, height: 64, marginTop: 14, borderRadius: 12, overflow: 'hidden' },
  frame: { flex: 1, borderRadius: 6, backgroundColor: '#8B7CF0' },
  scanner: { position: 'absolute', top: 0, bottom: 0, left: -40, width: 42, flexDirection: 'row' },
  scanTrail: { flex: 1 },
  scanLine: { width: 2, backgroundColor: '#FFFFFF', shadowColor: ds.purple, shadowOpacity: 0.8, shadowRadius: 6 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: ds.purple },
  steps: { marginTop: 14, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  stepDotNow: { borderColor: ds.purple },
  stepDotDone: { backgroundColor: ds.greenFill, borderColor: ds.greenFill },
  stepText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: ds.ink },
  stepTextNow: { color: ds.purple, fontWeight: '800' },
  stepTextNext: { color: ds.text3 },

  cardEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  timeline: { height: 30, marginTop: 14, justifyContent: 'center' },
  tlTrack: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: ds.lavender },
  tlFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: ds.purple },
  tlDotWrap: { position: 'absolute', width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  tlDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: '#C4B5FD' },
  tlDotPast: { borderColor: ds.purple },
  tlDotOn: { width: 22, height: 22, borderRadius: 11, borderWidth: 5, borderColor: ds.purple },
  tlEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tlEndText: { fontSize: 11, fontWeight: '700', color: ds.text3 },
  momentCard: { marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  momentTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  momentTime: { paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: ds.purple, justifyContent: 'center' },
  momentTimeText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  momentLabel: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  momentNote: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 6 },

  recipe: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  recipeTile: { width: '48.5%', padding: 12, borderRadius: 18, ...glassFill },
  recipeIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recipeLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3, letterSpacing: 0.3 },
  recipeValue: { fontSize: 13.5, lineHeight: 18, fontWeight: '800', color: ds.ink, marginTop: 2 },

  deckTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deckNav: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  navBtnOff: { backgroundColor: 'rgba(237, 233, 254, 0.5)' },
  ideaTitle: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: ds.ink, letterSpacing: -0.3, marginTop: 10 },
  keepsLabel: { fontSize: 12.5, fontWeight: '800', color: ds.text3, marginTop: 14, marginBottom: 8 },
  keeps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  keep: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 999, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender },
  keepText: { fontSize: 12.5, fontWeight: '700', color: ds.purple },
  platRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', ...{ backgroundColor: 'rgba(255,255,255,0.8)' } },
  platBtnOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  tweak: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  tweakText: { fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  tweakName: { fontWeight: '800', color: ds.ink },
  deckActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  saveBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  saveBtnOn: { backgroundColor: ds.purple },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C4B5FD' },
  dotOn: { width: 18, backgroundColor: ds.purple },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'center', height: 44, paddingHorizontal: 16, marginTop: 6 },
  moreText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
});
