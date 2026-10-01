import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  cancelAnimation,
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
import { ds } from '../../theme/colors';
import { react, useMascot, type Emotion } from '../../mascot/mascot';

// The live mascot. Always a little alive: it floats, breathes and now and
// then leans as if looking around. When something happens it cross-fades to
// the new emotion and hops; big wins add confetti. Tap it and it wiggles and
// says something. Motion glides (no springy overshoot); Reduce Motion keeps
// it still and only swaps the emotion.

const IMAGES: Record<Emotion, number> = {
  wave: require('../../../assets/mascot/wave.png'),
  happy: require('../../../assets/mascot/happy.png'),
  excited: require('../../../assets/mascot/excited.png'),
  party: require('../../../assets/mascot/party.png'),
  love: require('../../../assets/mascot/love.png'),
  cool: require('../../../assets/mascot/cool.png'),
  thinking: require('../../../assets/mascot/thinking.png'),
  idea: require('../../../assets/mascot/idea.png'),
  working: require('../../../assets/mascot/working.png'),
  determined: require('../../../assets/mascot/determined.png'),
  sleepy: require('../../../assets/mascot/sleepy.png'),
  calm: require('../../../assets/mascot/calm.png'),
};

// Only one mascot talks at a time: the most recently shown one with a bubble
// (e.g. Home's mascot over the side-menu one). When it goes away, the
// previous one takes over again.
let speakers: number[] = [];
let speakerSeq = 0;
const speakerListeners = new Set<() => void>();
function useIsSpeaker(wants: boolean) {
  const [id] = useState(() => ++speakerSeq);
  const [, force] = useState(0);
  useEffect(() => {
    if (!wants) return;
    speakers = [...speakers, id];
    const l = () => force((n) => n + 1);
    speakerListeners.add(l);
    speakerListeners.forEach((f) => f());
    return () => {
      speakers = speakers.filter((x) => x !== id);
      speakerListeners.delete(l);
      speakerListeners.forEach((f) => f());
    };
  }, [wants, id]);
  return wants && speakers[speakers.length - 1] === id;
}

const ease = Easing.out(Easing.cubic);
const glide = Easing.inOut(Easing.sin);
const CONFETTI = ['#5B3EE8', '#A99BFF', '#F472B6', '#38BDF8', '#34D399', '#FBBF24'];

function Piece({ i, go, size }: { i: number; go: number; size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!go) return;
    t.value = 0;
    t.value = withDelay(i * 18, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  }, [go, i, t]);
  const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
  const dist = size * (0.55 + (i % 3) * 0.12);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 || t.value === 1 ? 0 : 1 - t.value * 0.9,
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      // flies out, then drifts down a little
      { translateY: Math.sin(angle) * dist * t.value + 30 * t.value * t.value },
      { rotate: `${t.value * (i % 2 ? 260 : -260)}deg` },
    ],
  }));
  return <Animated.View pointerEvents="none" style={[styles.piece, { backgroundColor: CONFETTI[i % CONFETTI.length], width: i % 3 ? 7 : 9, height: i % 3 ? 11 : 7 }, style]} />;
}

export function LiveMascot({
  size = 96,
  emotion: fixed,
  bubble = 'none',
  bubbleWidth = 200,
  interactive = true,
  confetti = true,
}: {
  size?: number;
  /** Show this emotion instead of following the app's mood */
  emotion?: Emotion;
  /** Where the speech bubble appears ('auto': left, or underneath on phones), or 'none' */
  bubble?: 'left' | 'right' | 'top' | 'bottom' | 'auto' | 'none';
  bubbleWidth?: number;
  interactive?: boolean;
  confetti?: boolean;
}) {
  const reduce = useReducedMotion();
  const mood = useMascot();
  const emotion = fixed ?? mood.emotion;

  const float = useSharedValue(0);
  const hop = useSharedValue(0);
  const pop = useSharedValue(1);
  const tilt = useSharedValue(0);
  const [hover, setHover] = useState(false);
  const seen = useRef({ seq: mood.seq, emotion });

  // Idle: float and breathe, and every few seconds lean as if looking around
  useEffect(() => {
    if (reduce) return;
    float.value = withRepeat(withTiming(1, { duration: 2600, easing: glide }), -1, true);
    let alive = true;
    const fidget = () => {
      if (!alive) return;
      const dir = Math.random() > 0.5 ? 1 : -1;
      tilt.value = withSequence(withTiming(6 * dir, { duration: 420, easing: glide }), withDelay(500, withTiming(0, { duration: 520, easing: glide })));
      timer = setTimeout(fidget, 5200 + Math.random() * 4000);
    };
    let timer = setTimeout(fidget, 3000 + Math.random() * 3000);
    return () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimation(float);
    };
  }, [reduce, float, tilt]);

  // A reaction: hop up and settle (and pop slightly), once per new reaction
  useEffect(() => {
    const changed = mood.seq !== seen.current.seq || emotion !== seen.current.emotion;
    seen.current = { seq: mood.seq, emotion };
    if (!changed || reduce) return;
    hop.value = withSequence(withTiming(-size * 0.14, { duration: 180, easing: ease }), withTiming(0, { duration: 320, easing: glide }));
    pop.value = withSequence(withTiming(0.93, { duration: 110, easing: ease }), withTiming(1, { duration: 300, easing: ease }));
  }, [mood.seq, emotion, reduce, size, hop, pop]);

  const body = useAnimatedStyle(() => ({
    transform: [
      { translateY: hop.value - size * 0.05 * float.value },
      { rotate: `${tilt.value - 2 + 4 * float.value}deg` },
      { scaleY: (1 + 0.025 * float.value) * pop.value },
      { scaleX: (1 - 0.012 * float.value) * pop.value },
    ],
  }));
  const shadow = useAnimatedStyle(() => ({
    opacity: 0.35 - 0.15 * float.value,
    transform: [{ scaleX: 1 - 0.2 * float.value + hop.value / (size * 2) }],
  }));

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduce) {
      tilt.value = withSequence(
        withTiming(-9, { duration: 90, easing: ease }),
        withTiming(9, { duration: 120, easing: glide }),
        withTiming(-5, { duration: 110, easing: glide }),
        withTiming(0, { duration: 140, easing: glide })
      );
    }
    react('tap');
  };

  const { width: screenW } = useWindowDimensions();
  const side = bubble === 'auto' ? (screenW < 560 ? 'under' : 'left') : bubble;
  const speaker = useIsSpeaker(bubble !== 'none' && !fixed);
  const showBubble = speaker && !!mood.line;
  const bubblePos =
    side === 'under'
      ? { top: size * 0.98, right: 0, width: Math.min(bubbleWidth, screenW - 64) }
      : side === 'left'
      ? { right: size + 6, top: size * 0.12 }
      : side === 'right'
        ? { left: size + 6, top: size * 0.12 }
        : side === 'top'
          ? { bottom: size + 4, left: 0 }
          : { top: size + 6, alignSelf: 'center' as const };

  const content = (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[styles.shadow, { width: size * 0.5, left: size * 0.32, top: size * 0.93 }, shadow]} />
      {confetti && !reduce && Array.from({ length: 14 }).map((_, i) => (
        <View key={i} pointerEvents="none" style={[styles.burstOrigin, { left: size / 2, top: size / 2 }]}>
          <Piece i={i} go={fixed ? 0 : mood.burst} size={size} />
        </View>
      ))}
      <Animated.View style={[StyleSheet.absoluteFill, body]}>
        <Animated.View key={emotion} entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
          <Image source={IMAGES[emotion]} style={styles.img} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
      </Animated.View>
    </View>
  );

  return (
    <View style={{ width: size, height: size }}>
      {interactive ? (
        <Pressable
          onPress={tap}
          onHoverIn={() => setHover(true)}
          onHoverOut={() => setHover(false)}
          accessibilityRole="button"
          accessibilityLabel={`PostStreak mascot, feeling ${emotion}. Tap to say hi`}
          style={[Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null, hover && { transform: [{ scale: 1.04 }] }]}
        >
          {content}
        </Pressable>
      ) : (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{content}</View>
      )}
      {showBubble && (
        <Animated.View
          key={mood.seq}
          entering={FadeInUp.duration(240).easing(ease)}
          exiting={FadeOut.duration(180)}
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.bubble, { width: bubbleWidth }, bubblePos]}
        >
          <Text style={styles.bubbleText}>{mood.line}</Text>
        </Animated.View>
      )}
    </View>
  );
}

/** Preload every emotion so the first swap doesn't flash (web) */
export function preloadMascot() {
  if (Platform.OS !== 'web') return;
  // On web a bundled image is a URL string or an object with a uri
  Object.values(IMAGES).forEach((src) => {
    const any = src as unknown as string | { uri?: string };
    const uri = typeof any === 'string' ? any : any?.uri;
    if (uri) Image.prefetch(uri).catch(() => {});
  });
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
  shadow: { position: 'absolute', height: 8, borderRadius: 999, backgroundColor: 'rgba(63, 37, 191, 0.25)' },
  burstOrigin: { position: 'absolute', width: 0, height: 0 },
  piece: { position: 'absolute', borderRadius: 2 },
  bubble: {
    position: 'absolute',
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(91, 62, 232, 0.18)',
    shadowColor: '#3F25BF',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bubbleText: { fontSize: 13.5, lineHeight: 18, fontWeight: '700', color: ds.ink },
});
