import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { dsRadius } from '../../theme/colors';

// Frosted glass surface: blurs whatever sits behind it (the GlassBackdrop glows),
// with a milky white fill and a thin bright edge. Use for cards, bars and sheets.

export const glass = {
  fill: 'rgba(255, 255, 255, 0.55)',
  fillStrong: 'rgba(255, 255, 255, 0.72)',
  edge: 'rgba(255, 255, 255, 0.85)',
  hairline: 'rgba(23, 20, 32, 0.06)',
  blur: 30,
};

interface GlassCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Slightly more opaque fill, for text-heavy cards. */
  strong?: boolean;
  radius?: number;
  padding?: number;
}

export function GlassCard({ children, style, strong = false, radius = dsRadius.lg, padding = 18 }: GlassCardProps) {
  return (
    <View style={[styles.shadow, { borderRadius: radius }, style]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        <BlurView intensity={glass.blur} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: strong ? glass.fillStrong : glass.fill }]} />
        {/* Bright top edge + faint outer hairline give the glass its rim */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: glass.edge }]}
        />
        <View style={{ padding }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 3,
  },
  clip: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.hairline,
  },
});
