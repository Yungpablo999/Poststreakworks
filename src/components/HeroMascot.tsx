import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Animated,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export const HeroMascot: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isCompact = height < 750;
  
  // Natural Prominent Hero Dimensions
  const ghostSize = isCompact ? 215 : Math.min(width * 0.66, 265);

  // 1. Character Living Physics (Squash, Stretch, Float, Tilt)
  const hoverY = useRef(new Animated.Value(0)).current;
  const bodyStretchY = useRef(new Animated.Value(1)).current;
  const bodySquishX = useRef(new Animated.Value(1)).current;
  const bodyTilt = useRef(new Animated.Value(0)).current;

  // 2. Interactive Tap Spring Dynamics
  const tapScale = useRef(new Animated.Value(1)).current;
  const tapBounceY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Natural Living Float & Breathing Loop (Squash-and-Stretch)
    const floatLoop = Animated.loop(
      Animated.sequence([
        // Float upward with vertical stretch & left tilt
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: -13,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 1.05,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(bodySquishX, {
            toValue: 0.96,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),

        // Hover hang at peak
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: -9,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 1.02,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),

        // Descent into cushion landing (Squash) & right tilt
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: 7,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 0.95,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(bodySquishX, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: -1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),

        // Rebound to resting position
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 1.0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(bodySquishX, {
            toValue: 1.0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, [hoverY, bodyStretchY, bodySquishX, bodyTilt]);

  // Interactive Tap Reaction (Anticipation Squash -> Spring Leap -> Joyful Air Wobble)
  const handleMascotTap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      // 1. Anticipation Squash Down
      Animated.parallel([
        Animated.timing(tapScale, {
          toValue: 0.88,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(tapBounceY, {
          toValue: 10,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bodySquishX, {
          toValue: 1.18,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bodyStretchY, {
          toValue: 0.82,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),

      // 2. High-Energy Elastic Spring Leap
      Animated.parallel([
        Animated.spring(tapScale, {
          toValue: 1.14,
          useNativeDriver: true,
          speed: 28,
          bounciness: 12,
        }),
        Animated.spring(tapBounceY, {
          toValue: -30,
          useNativeDriver: true,
          speed: 24,
          bounciness: 12,
        }),
        Animated.spring(bodyStretchY, {
          toValue: 1.22,
          useNativeDriver: true,
          speed: 26,
          bounciness: 8,
        }),
        Animated.spring(bodySquishX, {
          toValue: 0.86,
          useNativeDriver: true,
          speed: 26,
          bounciness: 8,
        }),
        Animated.timing(bodyTilt, {
          toValue: -1.6,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),

      // 3. Playful Joyful Wobble in Air
      Animated.sequence([
        Animated.timing(bodyTilt, {
          toValue: 1.8,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(bodyTilt, {
          toValue: -1.0,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.timing(bodyTilt, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
      ]),

      // 4. Soft Cushioned Rebound Landing
      Animated.parallel([
        Animated.spring(tapScale, {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }),
        Animated.spring(tapBounceY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.spring(bodyStretchY, {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.spring(bodySquishX, {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
      ]),
    ]).start();
  };

  const rotation = bodyTilt.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: ['-7deg', '-3.5deg', '0deg', '3.5deg', '7deg'],
  });

  return (
    <View style={styles.container}>
      {/* Soft Ambient Radial Light Aura */}
      <View style={styles.ambientAuraOuter} />
      <View style={styles.ambientAuraInner} />

      <Pressable onPress={handleMascotTap} style={styles.pressable}>
        <Animated.View
          style={[
            styles.mascotTransformWrapper,
            {
              transform: [
                { translateY: hoverY },
                { translateY: tapBounceY },
                { scale: tapScale },
                { scaleY: bodyStretchY },
                { scaleX: bodySquishX },
                { rotate: rotation },
              ],
            },
          ]}
        >
          {/* PROMINENT STANDALONE 3D GHOST FLAME MASCOT */}
          <Image
            source={require('../../assets/images/jarvis-ghost-clean.png')}
            style={{
              width: ghostSize,
              height: ghostSize,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  ambientAuraOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(88, 44, 219, 0.06)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 36,
  },
  ambientAuraInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(251, 191, 36, 0.04)',
    shadowColor: '#FABD32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotTransformWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
