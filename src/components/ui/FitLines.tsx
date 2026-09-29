import React, { useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { Text } from './AppText';

// Headline that keeps an exact line structure on every screen size.
// Each entry in `lines` is always exactly one line; all lines share one font
// size, chosen so the longest line fills the available width. It shrinks on
// small phones and grows on bigger screens (up to maxFontSize).
//
// How: each line is measured once at a fixed reference size in a hidden,
// unconstrained layer, then the visible size is scaled from that.

const REFERENCE_SIZE = 100;

interface FitLinesProps {
  lines: React.ReactNode[];
  textStyle?: StyleProp<TextStyle>;
  maxFontSize?: number;
  minFontSize?: number;
  lineHeightRatio?: number;
  align?: 'center' | 'left';
  /** How much of the width the longest line may use (leaves breathing room). */
  fill?: number;
  accessibilityLabel?: string;
}

export function FitLines({
  lines,
  textStyle,
  maxFontSize = 40,
  minFontSize = 18,
  lineHeightRatio = 1.18,
  align = 'center',
  fill = 0.96,
  accessibilityLabel,
}: FitLinesProps) {
  const [available, setAvailable] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);

  const measured = widths.length === lines.length && widths.every((w) => w > 0);
  const longest = measured ? Math.max(...widths) : 0;
  const fitted = measured && available > 0 ? (REFERENCE_SIZE * available * fill) / longest : maxFontSize;
  const fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.floor(fitted)));
  const lineHeight = Math.round(fontSize * lineHeightRatio);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Hidden measuring layer: wide enough that nothing wraps */}
      <View style={styles.measureLayer} pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants">
        {lines.map((line, i) => (
          <Text
            key={i}
            style={[textStyle, styles.noShrink, { fontSize: REFERENCE_SIZE, lineHeight: REFERENCE_SIZE * lineHeightRatio }]}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              setWidths((prev) => {
                if (prev[i] === w) return prev;
                const next = [...prev];
                next[i] = w;
                return next;
              });
            }}
          >
            {line}
          </Text>
        ))}
      </View>

      {/* Visible lines, hidden until measured so there's no size jump */}
      <View style={{ opacity: measured && available > 0 ? 1 : 0 }}>
        {lines.map((line, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={[textStyle, { fontSize, lineHeight, textAlign: align }]}
          >
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden', // the wide hidden measuring layer must never cause sideways scroll
  },
  measureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4000,
    opacity: 0,
    alignItems: 'flex-start',
  },
  noShrink: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
});
