import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import { compactCount, shortDay } from '../../utils/format';
import type { GrowthDay } from '../../../frontend/shared/types/phase1';

// Followers over time, drawn from the days the server has a count for. With one day there is no
// line to draw, so it says so instead of drawing a made-up one.

interface FollowerChartProps {
  points: GrowthDay[];
  width: number;
  height?: number;
  color?: string;
  /** Show "Oct 4 · 15.6K" under the left end and "Today · 15.9K" under the right. */
  labels?: boolean;
}

export function FollowerChart({ points, width, height = 96, color = ds.purple, labels = true }: FollowerChartProps) {
  const reduceMotion = useReducedMotion();
  const appear = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    appear.value = reduceMotion ? 1 : withDelay(120, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [reduceMotion, appear, points.length]);
  const fade = useAnimatedStyle(() => ({ opacity: appear.value }));

  const shape = useMemo(() => {
    if (points.length < 2 || width <= 0) return null;
    const values = points.map((p) => p.followers);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const padY = 8;
    const x = (i: number) => (i / (points.length - 1)) * width;
    const y = (v: number) => (max === min ? height / 2 : padY + (1 - (v - min) / span) * (height - padY * 2));
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.followers).toFixed(1)}`).join(' ');
    return { line, area: `${line} L${width} ${height} L0 ${height} Z`, end: { x: x(points.length - 1), y: y(points[points.length - 1]!.followers) } };
  }, [points, width, height]);

  if (points.length === 0) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;

  return (
    <View accessible accessibilityLabel={points.length < 2 ? `${compactCount(last.followers)} followers so far` : `Followers went from ${compactCount(first.followers)} on ${shortDay(first.day)} to ${compactCount(last.followers)}`}>
      <Animated.View style={[{ width, height }, fade]}>
        {shape ? (
          <Svg width={width} height={height}>
            <Defs>
              <SvgGradient id="followerArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.16} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </SvgGradient>
            </Defs>
            <Path d={shape.area} fill="url(#followerArea)" />
            <Path d={shape.line} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={shape.end.x} cy={shape.end.y} r={5} fill="#FFFFFF" stroke={color} strokeWidth={3} />
          </Svg>
        ) : (
          <View style={styles.single}>
            <View style={[styles.dot, { borderColor: color }]} />
            <Text style={styles.singleText}>First reading today. The line appears as the days go by.</Text>
          </View>
        )}
      </Animated.View>
      {labels && points.length >= 2 && (
        <View style={styles.labels}>
          <Text style={styles.label}>
            {shortDay(first.day)} · {compactCount(first.followers)}
          </Text>
          <Text style={styles.label}>Today · {compactCount(last.followers)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  single: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, backgroundColor: '#FFFFFF' },
  singleText: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: ds.text3, textAlign: 'center', maxWidth: 260 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 11.5, fontWeight: '700', color: ds.text3 },
});
