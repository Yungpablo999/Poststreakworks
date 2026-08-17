import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Image,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GhostLoadingScreenProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  onFinish?: () => void;
}

export const GhostLoadingScreen: React.FC<GhostLoadingScreenProps> = ({
  visible,
  message = 'PostStreak Studio',
  subMessage = 'Juggling creator hooks & algorithms...',
  onFinish,
}) => {
  const [activeStepText, setActiveStepText] = useState(subMessage);

  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostTilt = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(0.92)).current;
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;
  const progressFill = useRef(new Animated.Value(0)).current;
  const sparkSpin = useRef(new Animated.Value(0)).current;

  // Concentric liquid ripple waves
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setActiveStepText(subMessage);

      // 1. Fade in screen smoothly
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      // 2. 3D Ghost Floating & Playful Tilt Physics
      const ghostLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: -12,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostTilt, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 1.05,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: 6,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostTilt, {
              toValue: -1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 0.96,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // 3. Shimmer loop for progress ray
      const shimmerLoop = Animated.loop(
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        })
      );

      // 4. Spark spin loop
      const sparkLoop = Animated.loop(
        Animated.timing(sparkSpin, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        })
      );

      // 5. Progress bar fill from 0 to 100%
      progressFill.setValue(0);
      Animated.timing(progressFill, {
        toValue: 1,
        duration: 650,
        useNativeDriver: false,
      }).start();

      // 6. Ripple wave loops
      const createRippleLoop = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const r1 = createRippleLoop(ripple1, 0);
      const r2 = createRippleLoop(ripple2, 800);

      ghostLoop.start();
      shimmerLoop.start();
      sparkLoop.start();
      r1.start();
      r2.start();

      // Dynamic Step Progression
      const t1 = setTimeout(() => {
        setActiveStepText('Syncing TikTok, IG & YouTube feeds...');
      }, 250);

      const t2 = setTimeout(() => {
        setActiveStepText('Ready ✨');
      }, 550);

      return () => {
        ghostLoop.stop();
        shimmerLoop.stop();
        sparkLoop.stop();
        r1.stop();
        r2.stop();
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  }, [visible, containerOpacity, ghostFloatY, ghostTilt, ghostScale, shimmerTranslate, sparkSpin, progressFill, ripple1, ripple2, subMessage, onFinish]);

  if (!visible) return null;

  const tiltAngle = ghostTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '4deg'],
  });

  const spinAngle = sparkSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getRippleStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 2.0],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.7, 0.35, 0],
    }),
  });

  const shimmerX = shimmerTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-180, 180],
  });

  const progressWidth = progressFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', '100%'],
  });

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <Animated.View style={[styles.fullScreenBackdrop, { opacity: containerOpacity }]}>
        {/* Layer 1: Native Full-Screen Optical Blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 85 : 95}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 2: Ambient Glowing Liquid Orbs */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.ambientOrbPurple} />
          <View style={styles.ambientOrbGold} />
        </View>

        {/* Layer 3: Central 3D Ghost Stage */}
        <View style={styles.centerStage}>
          {/* Liquid Ripple Wave Rings */}
          <View style={styles.rippleContainer} pointerEvents="none">
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple1)]} />
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple2)]} />
          </View>

          {/* Orbiting Sparkles Circle */}
          <Animated.View
            style={[
              styles.sparkleOrbitWrapper,
              { transform: [{ rotate: spinAngle }] },
            ]}
            pointerEvents="none"
          >
            <View style={styles.orbitSparkle1}><Text style={{ fontSize: 16 }}>✨</Text></View>
            <View style={styles.orbitSparkle2}><Text style={{ fontSize: 14 }}>🔥</Text></View>
            <View style={styles.orbitSparkle3}><Text style={{ fontSize: 14 }}>⭐</Text></View>
          </Animated.View>

          {/* 3D JUGGLING GHOST MASCOT CONTAINER */}
          <Animated.View
            style={[
              styles.ghostHeroFrame,
              {
                transform: [
                  { translateY: ghostFloatY },
                  { rotate: tiltAngle },
                  { scale: ghostScale },
                ],
              },
            ]}
          >
            {/* Specular Liquid Glass Pod around 3D Mascot */}
            <View style={styles.mascot3DContainer}>
              <Image
                source={require('../../assets/images/ghost-3d-juggling.jpg')}
                style={styles.ghost3DImage}
                resizeMode="cover"
              />
              {/* Top Specular Sheen Arc */}
              <View style={styles.mascotSpecularSheen} />
            </View>
          </Animated.View>

          {/* Typography & Status */}
          <View style={styles.metaContainer}>
            <Text style={styles.headlineText}>{message}</Text>
            <Text style={styles.stepText}>{activeStepText}</Text>
          </View>

          {/* Luxury Shimmer Progress Ray */}
          <View style={styles.progressTrackWrapper}>
            <View style={styles.progressTrackBg}>
              <Animated.View style={[styles.progressFillBar, { width: progressWidth }]}>
                <LinearGradient
                  colors={['#784DF0', '#582CDB', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Shimmer Light Ray */}
              <Animated.View
                style={[
                  styles.shimmerRay,
                  { transform: [{ translateX: shimmerX }] },
                ]}
              >
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.9)',
                    'rgba(255, 255, 255, 0)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 248, 245, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  ambientOrbPurple: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.24,
    left: SCREEN_WIDTH * 0.1,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(112, 72, 236, 0.16)',
  },
  ambientOrbGold: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.36,
    right: SCREEN_WIDTH * 0.1,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleContainer: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    borderColor: 'rgba(112, 72, 236, 0.45)',
  },
  sparkleOrbitWrapper: {
    position: 'absolute',
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitSparkle1: {
    position: 'absolute',
    top: 10,
    right: 40,
  },
  orbitSparkle2: {
    position: 'absolute',
    bottom: 20,
    left: 30,
  },
  orbitSparkle3: {
    position: 'absolute',
    top: 70,
    left: 5,
  },
  ghostHeroFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mascot3DContainer: {
    width: 175,
    height: 175,
    borderRadius: 88,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 14,
    backgroundColor: '#FFFFFF',
  },
  ghost3DImage: {
    width: '100%',
    height: '100%',
  },
  mascotSpecularSheen: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 1,
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headlineText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F7894',
    textAlign: 'center',
  },
  progressTrackWrapper: {
    width: 180,
    alignItems: 'center',
  },
  progressTrackBg: {
    width: '100%',
    height: 5.5,
    borderRadius: 3,
    backgroundColor: 'rgba(235, 230, 248, 0.88)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFillBar: {
    height: '100%',
    borderRadius: 3,
  },
  shimmerRay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
});
