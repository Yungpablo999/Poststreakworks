import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AnimatedAudioWaveIconProps {
  size?: number;
  color?: string;
}

export const AnimatedAudioWaveIcon: React.FC<AnimatedAudioWaveIconProps> = ({
  size = 26,
  color = '#5F3ADD',
}) => {
  // 5 individual sound equalizer bars
  const bar1 = useRef(new Animated.Value(0.4)).current;
  const bar2 = useRef(new Animated.Value(0.7)).current;
  const bar3 = useRef(new Animated.Value(1.0)).current;
  const bar4 = useRef(new Animated.Value(0.7)).current;
  const bar5 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const createEqualizerLoop = (
      anim: Animated.Value,
      minScale: number,
      maxScale: number,
      speed: number,
      delay: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxScale,
            duration: speed,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: minScale,
            duration: speed * 0.9,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: (minScale + maxScale) * 0.5,
            duration: speed * 0.7,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const loop1 = createEqualizerLoop(bar1, 0.25, 0.7, 450, 0);
    const loop2 = createEqualizerLoop(bar2, 0.4, 0.95, 380, 100);
    const loop3 = createEqualizerLoop(bar3, 0.55, 1.0, 420, 200);
    const loop4 = createEqualizerLoop(bar4, 0.35, 0.9, 360, 150);
    const loop5 = createEqualizerLoop(bar5, 0.2, 0.65, 480, 50);

    loop1.start();
    loop2.start();
    loop3.start();
    loop4.start();
    loop5.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
      loop4.stop();
      loop5.stop();
    };
  }, [bar1, bar2, bar3, bar4, bar5]);

  const barWidth = Math.round(size * 0.12);
  const gap = Math.round(size * 0.08);
  const totalHeight = size;

  return (
    <View style={[styles.container, { height: totalHeight, width: size * 0.9 }]}>
      {/* Bar 1 (Outer Left) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: totalHeight,
            backgroundColor: color,
            marginRight: gap,
            transform: [{ scaleY: bar1 }],
          },
        ]}
      />

      {/* Bar 2 (Mid Left) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: totalHeight,
            backgroundColor: color,
            marginRight: gap,
            transform: [{ scaleY: bar2 }],
          },
        ]}
      />

      {/* Bar 3 (Center Tall) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: totalHeight,
            backgroundColor: color,
            marginRight: gap,
            transform: [{ scaleY: bar3 }],
          },
        ]}
      />

      {/* Bar 4 (Mid Right) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: totalHeight,
            backgroundColor: color,
            marginRight: gap,
            transform: [{ scaleY: bar4 }],
          },
        ]}
      />

      {/* Bar 5 (Outer Right) */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: totalHeight,
            backgroundColor: color,
            transform: [{ scaleY: bar5 }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
  },
});
