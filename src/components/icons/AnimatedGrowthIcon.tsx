import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnimatedGrowthIconProps {
  size?: number;
  color?: string;
}

export const AnimatedGrowthIcon: React.FC<AnimatedGrowthIconProps> = ({
  size = 24,
  color = '#5F3ADD',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const growthLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(driftAnim, {
            toValue: -3,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(driftAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    growthLoop.start();
    return () => growthLoop.stop();
  }, [pulseAnim, driftAnim]);

  const width = size;
  const height = size * (16 / 27);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }, { translateY: driftAnim }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={width} height={height} viewBox="0 0 27 16" fill="none">
        <Path
          d="M1.86667 16L0 14.1333L9.86667 4.2L15.2 9.53333L22.1333 2.66667H18.6667V0H26.6667V8H24V4.53333L15.2 13.3333L9.86667 8L1.86667 16Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
};
