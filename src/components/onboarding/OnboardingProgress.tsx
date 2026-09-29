import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { ds } from '../../theme/colors';

// Sign-up progress: frosted card with a smoothly filling bar and step dots
// (done = purple tick, current = pulsing ring, upcoming = soft lavender).

export const ONBOARDING_STEPS = ['Niche', 'Platforms', 'Account', 'Verify', 'Done'] as const;

interface OnboardingProgressProps {
  /** Index of the step the user is on (0 = Niche). */
  current: number;
  steps?: readonly string[];
}

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

function StepDot({ state, index, dot }: { state: 'done' | 'current' | 'next'; index: number; dot: number }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (state !== 'current' || reduceMotion) return;
    pulse.value = withDelay(
      900,
      withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, false),
    );
  }, [state, reduceMotion, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(250 + index * 70).duration(400)} style={[styles.dotWrap, { width: dot, height: dot }]}>
      {state === 'current' && <Animated.View style={[styles.halo, { width: dot, height: dot, borderRadius: dot / 2 }, haloStyle]} />}
      {state === 'done' && (
        <Animated.View entering={ZoomIn.delay(300 + index * 70).springify().damping(14)} style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }, styles.dotDone]}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      )}
      {state === 'current' && (
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }, styles.dotCurrent]}>
          <View style={styles.dotCurrentCore} />
        </View>
      )}
      {state === 'next' && (
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }, styles.dotNext]}>
          <View style={styles.dotNextRing} />
        </View>
      )}
    </Animated.View>
  );
}

export function OnboardingProgress({ current, steps = ONBOARDING_STEPS }: OnboardingProgressProps) {
  const total = steps.length;
  // Narrow phones (e.g. 320 pt): smaller dots and labels so all steps fit
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const dot = compact ? 24 : 30;
  const percent = Math.round(((current + 1) / total) * 100);

  // Bar fills from where the previous step left off to this step
  const fill = useSharedValue(current / total);
  useEffect(() => {
    fill.value = withDelay(200, withTiming((current + 1) / total, { duration: 900, easing: EASE }));
  }, [current, total, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <GlassCard strong padding={16} radius={22}>
      <View
        style={styles.headerRow}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${current + 1} of ${total}: ${steps[current]}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View>
          <Text style={styles.eyebrow}>STEP {current + 1} OF {total}</Text>
          <Text style={styles.title}>Your progress</Text>
        </View>
        <Text style={styles.percent}>{percent}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>

      <View style={styles.stepsRow}>
        {steps.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'next';
          return (
            <View key={label} style={styles.stepCol}>
              <StepDot state={state} index={i} dot={dot} />
              <Text
                style={[
                  styles.stepLabel,
                  compact && styles.stepLabelCompact,
                  state === 'current' && styles.stepLabelCurrent,
                  state === 'done' && styles.stepLabelDone,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: ds.purple,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: ds.ink,
    marginTop: 2,
  },
  percent: {
    fontSize: 20,
    fontWeight: '800',
    color: ds.purple,
    letterSpacing: -0.4,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(91, 62, 232, 0.12)',
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ds.purple,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  stepCol: {
    flex: 1, // steps share the card width evenly on every screen size
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  dotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: ds.purple,
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: ds.purple,
  },
  dotCurrent: {
    backgroundColor: ds.purple,
    shadowColor: ds.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  dotCurrentCore: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  dotNext: {
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  dotNextRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#A99BFF',
  },
  stepLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: ds.text3,
  },
  stepLabelCompact: {
    fontSize: 10,
  },
  stepLabelCurrent: {
    color: ds.ink,
    fontWeight: '800',
  },
  stepLabelDone: {
    color: ds.purple,
  },
});
