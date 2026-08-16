import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnimatedSparklesIconProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export const AnimatedSparklesIcon: React.FC<AnimatedSparklesIconProps> = ({
  size = 26,
  color = '#FABD32',
  opacity = 0.95,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Twinkling sparkle animation loop
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.16,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    twinkleLoop.start();
    return () => twinkleLoop.stop();
  }, [scaleAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { rotate: rotation }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
        <Path
          d="M24.5455 10.9091L22.841 7.15911L19.091 5.45456L22.841 3.75001L24.5455 0L26.2501 3.75001L30.0001 5.45456L26.2501 7.15911L24.5455 10.9091ZM24.5455 30.0001L22.841 26.2501L19.091 24.5455L22.841 22.841L24.5455 19.091L26.2501 22.841L30.0001 24.5455L26.2501 26.2501L24.5455 30.0001ZM10.9091 25.9092L7.50002 18.4091L0 15L7.50002 11.5909L10.9091 4.09092L14.3182 11.5909L21.8182 15L14.3182 18.4091L10.9091 25.9092ZM10.9091 19.2955L12.2728 16.3637L15.2046 15L12.2728 13.6364L10.9091 10.7046L9.54548 13.6364L6.61365 15L9.54548 16.3637L10.9091 19.2955Z"
          fill={color}
          fillOpacity={opacity}
        />
      </Svg>
    </Animated.View>
  );
};
