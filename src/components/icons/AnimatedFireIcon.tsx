import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnimatedFireIconProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export const AnimatedFireIcon: React.FC<AnimatedFireIconProps> = ({
  size = 28,
  color = '#FABD32',
  opacity = 0.95,
}) => {
  // High-energy fire physics: aggressive vertical flame leaps, crackling horizontal squish, turbulent sway, and fiery intensity flicker
  const leapY = useRef(new Animated.Value(1)).current;
  const flameWidthX = useRef(new Animated.Value(1)).current;
  const driftY = useRef(new Animated.Value(0)).current;
  const swayAngle = useRef(new Animated.Value(0)).current;
  const flameOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. High-Energy Rapid Flame Leaps & Crackle (Bold, snappy vertical tongue flares)
    const fireLeapAnimation = Animated.loop(
      Animated.sequence([
        // Explosive flare up (flame shoots tall and narrow)
        Animated.parallel([
          Animated.timing(leapY, {
            toValue: 1.32,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.timing(flameWidthX, {
            toValue: 0.85,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.timing(driftY, {
            toValue: -4,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.timing(flameOpacity, {
            toValue: 1.0,
            duration: 140,
            useNativeDriver: true,
          }),
        ]),
        // Snap down & crackle expand
        Animated.parallel([
          Animated.timing(leapY, {
            toValue: 0.88,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(flameWidthX, {
            toValue: 1.16,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(driftY, {
            toValue: 2,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(flameOpacity, {
            toValue: 0.82,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        // Second quick upward lick
        Animated.parallel([
          Animated.timing(leapY, {
            toValue: 1.24,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flameWidthX, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(driftY, {
            toValue: -3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flameOpacity, {
            toValue: 0.96,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Micro flicker
        Animated.parallel([
          Animated.timing(leapY, {
            toValue: 0.94,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(flameWidthX, {
            toValue: 1.08,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(driftY, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(flameOpacity, {
            toValue: 0.88,
            duration: 110,
            useNativeDriver: true,
          }),
        ]),
        // Major blaze burst
        Animated.parallel([
          Animated.timing(leapY, {
            toValue: 1.28,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(flameWidthX, {
            toValue: 0.88,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(driftY, {
            toValue: -4,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(flameOpacity, {
            toValue: 1.0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        // Return to baseline
        Animated.parallel([
          Animated.timing(leapY, {
            toValue: 1.0,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(flameWidthX, {
            toValue: 1.0,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(driftY, {
            toValue: 0,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(flameOpacity, {
            toValue: 0.92,
            duration: 130,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // 2. High-Frequency Turbulent Wind Flutter & Sway
    const windFlutterAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAngle, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(swayAngle, {
          toValue: -0.9,
          duration: 210,
          useNativeDriver: true,
        }),
        Animated.timing(swayAngle, {
          toValue: 0.7,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(swayAngle, {
          toValue: -0.6,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.timing(swayAngle, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ])
    );

    fireLeapAnimation.start();
    windFlutterAnimation.start();

    return () => {
      fireLeapAnimation.stop();
      windFlutterAnimation.stop();
    };
  }, [leapY, flameWidthX, driftY, swayAngle, flameOpacity]);

  const rotation = swayAngle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const width = size * (22 / 26);
  const height = size;

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [
            { translateY: driftY },
            { scaleY: leapY },
            { scaleX: flameWidthX },
            { rotate: rotation },
          ],
          opacity: flameOpacity,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={width} height={height} viewBox="0 0 22 26" fill="none">
          <Path
            d="M2.73685 15.0527C2.73685 16.2386 2.97633 17.3619 3.45527 18.4224C3.93422 19.483 4.61844 20.4123 5.50791 21.2106C5.48511 21.0966 5.4737 20.9939 5.4737 20.9027C5.4737 20.8115 5.4737 20.7088 5.4737 20.5948C5.4737 19.865 5.61054 19.1808 5.88423 18.5422C6.15791 17.9036 6.55704 17.322 7.0816 16.7974L10.9474 13L14.8132 16.7974C15.3378 17.322 15.7369 17.9036 16.0106 18.5422C16.2843 19.1808 16.4211 19.865 16.4211 20.5948C16.4211 20.7088 16.4211 20.8115 16.4211 20.9027C16.4211 20.9939 16.4097 21.0966 16.3869 21.2106C17.2764 20.4123 17.9606 19.483 18.4395 18.4224C18.9185 17.3619 19.158 16.2386 19.158 15.0527C19.158 13.9123 18.947 12.8347 18.5251 11.8198C18.1031 10.8049 17.493 9.89828 16.6948 9.10003C16.2386 9.39652 15.7597 9.61889 15.2579 9.76714C14.7562 9.91538 14.243 9.98951 13.7185 9.98951C12.3044 9.98951 11.0785 9.52196 10.0408 8.58687C9.0031 7.65178 8.40441 6.50002 8.24476 5.1316C7.35529 5.88423 6.56844 6.66537 5.88423 7.47502C5.20002 8.28468 4.62414 9.10573 4.15659 9.93819C3.68905 10.7706 3.33554 11.6202 3.09606 12.4869C2.85659 13.3536 2.73685 14.2088 2.73685 15.0527ZM10.9474 16.8316L8.9974 18.7474C8.74652 18.9983 8.55266 19.2834 8.41582 19.6027C8.27897 19.922 8.21055 20.2527 8.21055 20.5948C8.21055 21.3246 8.47854 21.9518 9.0145 22.4764C9.55047 23.0009 10.1948 23.2632 10.9474 23.2632C11.7 23.2632 12.3443 23.0009 12.8803 22.4764C13.4163 21.9518 13.6843 21.3246 13.6843 20.5948C13.6843 20.2299 13.6158 19.8935 13.479 19.5856C13.3421 19.2777 13.1483 18.9983 12.8974 18.7474L10.9474 16.8316ZM10.9474 0V4.5158C10.9474 5.29125 11.2154 5.94125 11.7514 6.46581C12.2873 6.99037 12.943 7.25265 13.7185 7.25265C14.129 7.25265 14.511 7.16713 14.8645 6.99608C15.218 6.82502 15.5316 6.56844 15.8053 6.22634L16.4211 5.4737C18.1088 6.4316 19.443 7.76581 20.4237 9.47635C21.4045 11.1869 21.8948 13.0457 21.8948 15.0527C21.8948 18.1088 20.8343 20.6974 18.7132 22.8185C16.5922 24.9396 14.0036 26.0001 10.9474 26.0001C7.89125 26.0001 5.30265 24.9396 3.18159 22.8185C1.06053 20.6974 0 18.1088 0 15.0527C0 12.1106 0.986407 9.3167 2.95922 6.67107C4.93203 4.02545 7.59476 1.80176 10.9474 0Z"
            fill={color}
            fillOpacity={opacity}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
