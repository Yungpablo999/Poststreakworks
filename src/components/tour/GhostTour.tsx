import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { MASCOT_IMAGES } from '../mascot/LiveMascot';
import { ds } from '../../theme/colors';
import { express, react } from '../../mascot/mascot';
import {
  IN_PAGE,
  endTour,
  getTourTarget,
  goToTourPage,
  nextStep,
  prevStep,
  registerTourScroller,
  registerTourTarget,
  currentTourScroller,
  tourTargetTapped,
  unregisterTourScroller,
  unregisterTourTarget,
  useTour,
  type TourTargetId,
} from '../../tour/tour';

// The tour on screen: the page dims except for a spotlight on the real thing
// Ghost is talking about, and Ghost's card sits beside it. The spotlight
// glides from one spot to the next (no bounce). On "try it" steps you can tap
// the real thing through the spotlight. Skip any time (Esc on a keyboard).

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);
const PAD = 8;
const GUTTER = 16;
const DIM = 'rgba(23, 20, 32, 0.58)';

/** Wrap a part of the screen so the tour can spotlight it */
export function TourTarget({ id, children, style }: { id: TourTargetId; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  useEffect(() => {
    const view = ref.current;
    if (!view) return;
    registerTourTarget(id, view);
    return () => unregisterTourTarget(id, view);
  }, [id]);
  return (
    <View
      ref={ref}
      collapsable={false}
      style={style}
      onStartShouldSetResponderCapture={() => {
        tourTargetTapped(id);
        return false;
      }}
    >
      {children}
    </View>
  );
}

/** Give a page's main ScrollView to the tour so it can scroll things into view: <ScrollView {...useTourScroll()}> */
export function useTourScroll() {
  const ref = useRef<ScrollView>(null);
  const y = useRef(0);
  useEffect(() => {
    const scroller = {
      scrollBy: (dy: number) => ref.current?.scrollTo({ y: Math.max(0, y.current + dy), animated: true }),
      viewport: (cb: (top: number, bottom: number) => void) => {
        const view = ref.current as unknown as { measureInWindow?: (f: (x: number, y: number, w: number, h: number) => void) => void } | null;
        if (view?.measureInWindow) view.measureInWindow((_x, top, _w, h) => cb(top, top + h));
        else cb(0, Number.MAX_SAFE_INTEGER);
      },
    };
    registerTourScroller(scroller);
    return () => unregisterTourScroller(scroller);
  }, []);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    y.current = e.nativeEvent.contentOffset.y;
  }, []);
  return { ref, onScroll, scrollEventThrottle: 16 };
}

type Rect = { x: number; y: number; w: number; h: number };

export function GhostTour() {
  const { active, steps, index, tried } = useTour();
  const { width, height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const step = steps[index];
  const [rect, setRect] = useState<Rect | null>(null);
  const [targetId, setTargetId] = useState<TourTargetId | null>(null);
  const [cardH, setCardH] = useState(220);

  // Spotlight position, gliding between steps
  const sx = useSharedValue(width / 2);
  const sy = useSharedValue(height / 2);
  const sw = useSharedValue(0);
  const sh = useSharedValue(0);

  const measure = useCallback(() => {
    if (!step?.targets) {
      setRect(null);
      setTargetId(null);
      return;
    }
    const id = step.targets.find((t) => getTourTarget(t));
    const view = id ? getTourTarget(id) : null;
    if (!id || !view) {
      // Not on this screen: Ghost explains it in the middle instead
      setRect(null);
      setTargetId(null);
      return;
    }
    view.measureInWindow((x, y, w, h) => {
      if (!w || !h) return;
      setTargetId(id);
      setRect({ x: x - PAD, y: y - PAD, w: w + PAD * 2, h: h + PAD * 2 });
    });
  }, [step]);
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const settling = useRef(false);
  const page = useRef<string | null>(null);

  // New step: go to its page, scroll its part clear of the bars, then spotlight it
  useEffect(() => {
    if (!active || !step) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(() => !cancelled && fn(), ms));
    settling.current = true;
    express(step.emotion, '', 2400);

    const moved = page.current !== null && page.current !== step.page;
    if (page.current !== step.page) goToTourPage(step.page);
    page.current = step.page;

    const place = () => {
      const id = step.targets?.find((t) => getTourTarget(t));
      const view = id ? getTourTarget(id) : null;
      if (!id || !view || !IN_PAGE.includes(id)) {
        settling.current = false;
        return measureRef.current();
      }
      // The visible part of the page: below the header, above the tab bar
      const scroller = currentTourScroller();
      const visibleArea = (cb: (top: number, bottom: number) => void) => {
        const withTabBar = (top: number, bottom: number) => {
          const bar = getTourTarget('tab-bar');
          if (!bar) return cb(top, bottom);
          bar.measureInWindow((_x, barTop, _w, barH) => cb(top, barH ? Math.min(bottom, barTop) : bottom));
        };
        if (scroller) scroller.viewport((t, b) => withTabBar(t, Math.min(b, height)));
        else withTabBar(0, height);
      };
      visibleArea((top, bottom) => {
        view.measureInWindow((_x, y, _w, h) => {
          // Already clear of the bars? Leave the page where it is.
          if (y >= top + 8 && y + h <= bottom - 8) {
            settling.current = false;
            return measureRef.current();
          }
          // Otherwise bring it to just under the header
          const dy = y - (top + 20);
          if (scroller) scroller.scrollBy(dy);
          else (view as unknown as { scrollIntoView?: (o: object) => void }).scrollIntoView?.({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
          // Measure once the scroll has settled (and again, in case it was slow)
          later(() => measureRef.current(), reduce ? 30 : 450);
          later(() => {
            settling.current = false;
            measureRef.current();
          }, reduce ? 60 : 850);
        });
      });
    };
    later(place, moved ? 650 : 40);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active, step, width, height, reduce]);

  // When the tour ends, forget which page it was on
  useEffect(() => {
    if (!active) page.current = null;
  }, [active]);

  // Keep the spotlight on target when the page scrolls (web)
  useEffect(() => {
    if (!active || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onScroll = () => !settling.current && measureRef.current();
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [active]);

  // Glide the spotlight
  useEffect(() => {
    const d = reduce ? 0 : 380;
    const to = rect ?? { x: width / 2, y: height / 2, w: 0, h: 0 };
    sx.value = withTiming(to.x, { duration: d, easing: ease });
    sy.value = withTiming(to.y, { duration: d, easing: ease });
    sw.value = withTiming(to.w, { duration: d, easing: ease });
    sh.value = withTiming(to.h, { duration: d, easing: ease });
  }, [rect, width, height, reduce, sx, sy, sw, sh]);

  // Keyboard: Esc skips, arrows / Enter move
  useEffect(() => {
    if (!active || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  // Trying it: Ghost cheers
  useEffect(() => {
    if (tried && step?.tryIt) express(step.tryIt.doneEmotion, '', 1600, true);
  }, [tried, step]);

  const top = useAnimatedStyle(() => ({ left: 0, right: 0, top: 0, height: Math.max(0, sy.value) }));
  const bottom = useAnimatedStyle(() => ({ left: 0, right: 0, top: sy.value + sh.value, bottom: 0 }));
  const left = useAnimatedStyle(() => ({ left: 0, top: sy.value, width: Math.max(0, sx.value), height: sh.value }));
  const right = useAnimatedStyle(() => ({ left: sx.value + sw.value, right: 0, top: sy.value, height: sh.value }));
  const ring = useAnimatedStyle(() => ({ left: sx.value, top: sy.value, width: sw.value, height: sh.value, opacity: sw.value > 4 ? 1 : 0 }));

  // A soft pulse on the spotlight ring
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, pulse]);
  const ringGlow = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.5, transform: [{ scale: 1 + pulse.value * 0.015 }] }));

  if (!active || !step) return null;

  // Card: under the spotlight if it fits, otherwise above; centred when there's no spotlight
  const cardW = Math.min(360, width - GUTTER * 2);
  let cardX = (width - cardW) / 2;
  let cardY = (height - cardH) / 2;
  if (rect) {
    cardX = Math.min(Math.max(GUTTER, rect.x + rect.w / 2 - cardW / 2), width - cardW - GUTTER);
    const below = rect.y + rect.h + 14;
    const above = rect.y - 14 - cardH;
    // Room to the side (e.g. the side menu on desktop)? Sit beside it.
    const besideRight = rect.x + rect.w + 14;
    if (rect.h > height * 0.5 && besideRight + cardW + GUTTER <= width) {
      cardX = besideRight;
      cardY = Math.min(Math.max(GUTTER, rect.y + rect.h / 2 - cardH / 2), height - cardH - GUTTER);
    } else if (below + cardH <= height - GUTTER) cardY = below;
    else if (above >= GUTTER) cardY = above;
    else cardY = height - cardH - GUTTER;
  }

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const body = (targetId && step.bodyFor?.[targetId]) || step.body;
  const faceEmotion = tried && step.tryIt ? step.tryIt.doneEmotion : step.emotion;
  const counted = steps.length - 2; // the hello and done cards aren't numbered

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer]} pointerEvents="box-none" accessibilityViewIsModal>
      {/* The dim, with a hole for the spotlight */}
      <Animated.View style={[styles.dim, top]} />
      <Animated.View style={[styles.dim, bottom]} />
      <Animated.View style={[styles.dim, left]} />
      <Animated.View style={[styles.dim, right]} />
      {/* Taps in the hole only go through on "try it" steps */}
      <Animated.View pointerEvents={step.tryIt && !tried ? 'none' : 'auto'} style={[styles.hole, ring]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, ringGlow]} />
      </Animated.View>

      <Animated.View
        key={step.key}
        entering={FadeIn.duration(reduce ? 0 : 260).easing(ease)}
        exiting={FadeOut.duration(140)}
        onLayout={(e) => setCardH(Math.round(e.nativeEvent.layout.height))}
        style={[styles.card, { width: cardW, left: cardX, top: cardY }]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.cardHead}>
          <TourGhost emotion={faceEmotion} hopKey={`${step.key}-${tried}`} burst={isLast || tried} />
          <View style={styles.flex}>
            {!isFirst && !isLast && (
              <Text style={styles.count}>
                {index} of {counted}
              </Text>
            )}
            <Text style={styles.title}>{step.title}</Text>
          </View>
        </View>
        <Text style={styles.body}>{body}</Text>
        {step.tryIt && (
          <Animated.View key={String(tried)} entering={FadeIn.duration(220)} style={[styles.tryIt, tried && styles.tryItDone]}>
            <Text style={[styles.tryItText, tried && { color: ds.green }]}>{tried ? step.tryIt.done : step.tryIt.hint}</Text>
          </Animated.View>
        )}

        {!isFirst && !isLast && (
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {Array.from({ length: counted }).map((_, i) => (
              <View key={i} style={[styles.dot, i + 1 === index && styles.dotOn, i + 1 < index && styles.dotPast]} />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          {isFirst ? (
            <>
              <TextButton label="Skip tour" onPress={skip} />
              <View style={styles.flex} />
              <MainButton label="Show me around" onPress={nextStep} />
            </>
          ) : isLast ? (
            <>
              <View style={styles.flex} />
              <MainButton label="Let’s go!" onPress={finish} />
            </>
          ) : (
            <>
              <TextButton label="Skip tour" onPress={skip} />
              <View style={styles.flex} />
              <TextButton label="Back" onPress={prevStep} />
              <MainButton label="Next" onPress={nextStep} />
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

function skip() {
  endTour();
  setTimeout(() => express('wave', 'No worries! Tap me if you ever need me.', 3200), 250);
}
function finish() {
  endTour();
  setTimeout(() => react('celebrate'), 200);
}

function MainButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.main, pointer, pressed && { transform: [{ translateY: 2 }], shadowOffset: { width: 0, height: 1 } }]}
    >
      <Text style={styles.mainText}>{label}</Text>
    </Pressable>
  );
}
function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.textBtn, pointer, pressed && { opacity: 0.6 }]}>
      <Text style={styles.textBtnText}>{label}</Text>
    </Pressable>
  );
}

// Ghost on the card: floats, hops on every new step, confetti for wins
const CONFETTI = ['#5B3EE8', '#A99BFF', '#F472B6', '#38BDF8', '#34D399', '#FBBF24'];
function TourGhost({ emotion, hopKey, burst }: { emotion: keyof typeof MASCOT_IMAGES; hopKey: string; burst: boolean }) {
  const reduce = useReducedMotion();
  const float = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    float.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, float]);
  useEffect(() => {
    if (reduce) return;
    hop.value = withSequence(withTiming(-10, { duration: 180, easing: ease }), withTiming(0, { duration: 320, easing: Easing.inOut(Easing.sin) }));
  }, [hopKey, reduce, hop]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value - 4 * float.value }, { rotate: `${-3 + 6 * float.value}deg` }] }));
  return (
    <View style={styles.ghostBox}>
      {burst && !reduce && Array.from({ length: 12 }).map((_, i) => <Bit key={`${hopKey}-${i}`} i={i} />)}
      <Animated.View style={[styles.ghostBox, s]}>
        <Animated.View key={emotion} entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
          <Image source={MASCOT_IMAGES[emotion]} style={styles.ghostImg} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
function Bit({ i }: { i: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(i * 20, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
  }, [i, t]);
  const a = (i / 12) * Math.PI * 2;
  const st = useAnimatedStyle(() => ({
    opacity: t.value >= 1 ? 0 : 1 - t.value * 0.8,
    transform: [{ translateX: Math.cos(a) * 46 * t.value }, { translateY: Math.sin(a) * 46 * t.value + 18 * t.value * t.value }, { rotate: `${t.value * 240}deg` }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.bit, { backgroundColor: CONFETTI[i % CONFETTI.length] }, st]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  // Above everything else, including the Ask Jarvis button
  layer: { zIndex: 200 },
  dim: { position: 'absolute', backgroundColor: DIM },
  hole: { position: 'absolute', borderRadius: 18 },
  ring: { borderRadius: 18, borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#A99BFF', shadowOpacity: 0.9, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  card: {
    position: 'absolute',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#170F3A',
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ghostBox: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  ghostImg: { width: '100%', height: '100%' },
  bit: { position: 'absolute', left: 28, top: 28, width: 7, height: 10, borderRadius: 2 },
  count: { fontSize: 12, fontWeight: '800', color: ds.purple, letterSpacing: 0.4, marginBottom: 2 },
  title: { fontSize: 19, lineHeight: 24, fontWeight: '800', color: ds.ink, letterSpacing: -0.3 },
  body: { marginTop: 10, fontSize: 15, lineHeight: 21, color: ds.text2, fontWeight: '500' },
  tryIt: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: ds.lavender },
  tryItDone: { backgroundColor: ds.greenBg },
  tryItText: { fontSize: 14.5, fontWeight: '800', color: ds.purple },
  dots: { flexDirection: 'row', gap: 6, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ds.line },
  dotPast: { backgroundColor: '#C9BFFF' },
  dotOn: { width: 20, backgroundColor: ds.purple },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  textBtn: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  textBtnText: { fontSize: 15, fontWeight: '700', color: ds.text2 },
  main: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: ds.purple,
    shadowColor: ds.purpleLedge,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
  },
  mainText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
