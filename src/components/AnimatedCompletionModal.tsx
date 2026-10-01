import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Modal, Pressable, Platform } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Text } from './ui/AppText';
import { AppButton } from './ui/AppButton';
import { ds } from '../theme/colors';

// The app's celebration pop-up (post scheduled, quest started, draft saved…).
// Calm and warm: the card eases in (no spring bounce), a ring draws itself
// around the ghost, a tick appears, a few sparkles drift out once and the XP
// counts up. No gold (Pro only), no emoji, no streak-loss language.

export interface AnimatedCompletionModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  xpEarned?: number;
  streakCount?: number;
  speechBubble?: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

const EASE = Easing.out(Easing.cubic);
const RING = 132;
const RING_STROKE = 4;
const R = (RING - RING_STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const SPARKS = 10;

// Older callers pass emoji / arrows in their strings; show clean text
const clean = (t: string) =>
  t
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '')
    .replace(/[➔→]/g, '')
    .replace(/^Ghost says:\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Spark({ index, play }: { index: number; play: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!play) return;
    t.value = 0;
    t.value = withDelay(420 + (index % 3) * 60, withTiming(1, { duration: 900, easing: EASE }));
  }, [play, index, t]);
  const angle = (index / SPARKS) * Math.PI * 2 + 0.3;
  const dist = 78 + (index % 3) * 12;
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : (1 - t.value) * 0.9,
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      { translateY: Math.sin(angle) * dist * t.value },
      { scale: 1 - 0.4 * t.value },
    ],
  }));
  return <Animated.View pointerEvents="none" style={[styles.spark, index % 3 === 0 && styles.sparkLight, style]} />;
}

function CountUp({ to, play }: { to: number; play: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!play) return;
    setN(0);
    const start = Date.now() + 500;
    const id = setInterval(() => {
      const p = Math.min(1, Math.max(0, (Date.now() - start) / 700));
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to, play]);
  return <Text style={styles.chipValue}>+{n} XP</Text>;
}

export const AnimatedCompletionModal: React.FC<AnimatedCompletionModalProps> = ({
  visible,
  title = 'Nice work!',
  subtitle = 'Your post is saved.',
  badgeText = 'DONE',
  xpEarned = 50,
  streakCount = 1,
  speechBubble,
  actionText = 'Continue',
  onAction,
  onDismiss,
}) => {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [play, setPlay] = useState(0);

  const card = useSharedValue(0);
  const ring = useSharedValue(0);
  const tick = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setPlay((p) => p + 1);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      card.value = 0;
      ring.value = 0;
      tick.value = 0;
      card.value = withTiming(1, { duration: reduceMotion ? 1 : 280, easing: EASE });
      ring.value = withDelay(150, withTiming(1, { duration: reduceMotion ? 1 : 700, easing: EASE }));
      tick.value = withDelay(reduceMotion ? 0 : 650, withTiming(1, { duration: 220, easing: EASE }));
    } else if (mounted) {
      card.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: card.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ scale: 0.94 + 0.06 * card.value }, { translateY: 12 * (1 - card.value) }],
  }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - ring.value) }));
  const tickStyle = useAnimatedStyle(() => ({ opacity: tick.value, transform: [{ scale: 0.6 + 0.4 * tick.value }] }));

  if (!mounted) return null;

  const badge = clean(badgeText);
  const quote = speechBubble ? clean(speechBubble) : '';
  const buttonTitle = clean(actionText) || 'Continue';

  return (
    <Modal visible transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.card, cardStyle]} accessibilityViewIsModal>
          <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]} />
          <View style={[StyleSheet.absoluteFill, styles.cardFill]} />

          {badge ? (
            <View style={styles.badge}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path d="M20 6L9 17l-5-5" stroke={ds.purple} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}

          {/* Ghost with a ring that draws itself, a tick and a few sparkles */}
          <View style={styles.hero}>
            {Array.from({ length: SPARKS }).map((_, i) => (
              <Spark key={i} index={i} play={reduceMotion ? 0 : play} />
            ))}
            <Svg width={RING} height={RING} style={styles.ring}>
              <Circle cx={RING / 2} cy={RING / 2} r={R} stroke="rgba(91, 62, 232, 0.12)" strokeWidth={RING_STROKE} fill="none" />
              <AnimatedCircle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                stroke={ds.purple}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${CIRC} ${CIRC}`}
                animatedProps={ringProps}
              />
            </Svg>
            <View style={styles.ghostCircle}>
              <Image source={require('../../assets/images/jarvis-ghost-clean.png')} style={styles.ghost} resizeMode="contain" />
            </View>
            <Animated.View style={[styles.tick, tickStyle]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.delay(250).duration(350)}>
            <Text style={styles.title}>{clean(title)}</Text>
            <Text style={styles.subtitle}>{clean(subtitle)}</Text>
          </Animated.View>

          {quote ? (
            <Animated.View entering={FadeIn.delay(400).duration(350)} style={styles.quote}>
              <View style={styles.quoteBar} />
              <Text style={styles.quoteText}>{quote}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeIn.delay(450).duration(300)} style={styles.chips}>
            {xpEarned > 0 && (
              <View style={styles.chip}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill={ds.purple}>
                  <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </Svg>
                <CountUp to={xpEarned} play={play} />
              </View>
            )}
            {streakCount > 0 && (
              <View style={styles.chip}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2.4} />
                  <Path d="M8 12.5l2.5 2.5L16 9.5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.chipValue}>Day {streakCount}</Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.cta}>
            <AppButton
              title={buttonTitle}
              size="lg"
              onPress={() => (onAction ? onAction() : onDismiss())}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  scrim: { backgroundColor: 'rgba(23, 20, 32, 0.35)' },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 12,
  },
  cardFill: { backgroundColor: 'rgba(250, 248, 255, 0.9)' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
    backgroundColor: ds.lavender,
  },
  badgeText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  hero: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 14 },
  ring: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  ghostCircle: {
    width: RING - 26,
    height: RING - 26,
    borderRadius: (RING - 26) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  ghost: { width: 72, height: 72 },
  tick: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.greenFill,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  spark: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: ds.purple },
  sparkLight: { backgroundColor: '#A99BFF' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: ds.ink, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14.5, lineHeight: 21, color: ds.text2, textAlign: 'center', marginTop: 6 },
  quote: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(237, 233, 254, 0.6)',
  },
  quoteBar: { width: 3, borderRadius: 2, backgroundColor: '#C9BDFB' },
  quoteText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600', color: ds.purple },
  chips: { flexDirection: 'row', gap: 8, marginTop: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(91, 62, 232, 0.15)',
  },
  chipValue: { fontSize: 14, fontWeight: '800', color: ds.ink },
  cta: { alignSelf: 'stretch', marginTop: 20 },
});
