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
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
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
  subMessage = 'Optimizing algorithm flow...',
  onFinish,
}) => {
  const [activeStepText, setActiveStepText] = useState(subMessage);

  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(0.92)).current;
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;
  const progressFill = useRef(new Animated.Value(0)).current;

  // Liquid ripple rings
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;

  // Ambient orbs
  const orbFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 1. Fade in screen smoothly
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // 2. Ghost floating buoyancy loop
      const ghostLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: -10,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 1.04,
              duration: 1400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: 6,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 0.96,
              duration: 1400,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // 3. Shimmer loop for progress ray
      const shimmerLoop = Animated.loop(
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );

      // 4. Progress bar fill
      progressFill.setValue(0);
      Animated.timing(progressFill, {
        toValue: 1,
        duration: 650,
        useNativeDriver: false,
      }).start();

      // 5. Ripple wave loops (staggered)
      const createRippleLoop = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1800,
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
      const r2 = createRippleLoop(ripple2, 600);
      const r3 = createRippleLoop(ripple3, 1200);

      // 6. Ambient orb drift loop
      const orbLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(orbFloat, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(orbFloat, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );

      ghostLoop.start();
      shimmerLoop.start();
      r1.start();
      r2.start();
      r3.start();
      orbLoop.start();

      // Sub-message progression
      const t1 = setTimeout(() => {
        setActiveStepText('Syncing creator feed...');
      }, 250);

      const t2 = setTimeout(() => {
        setActiveStepText('Ready');
      }, 550);

      return () => {
        ghostLoop.stop();
        shimmerLoop.stop();
        r1.stop();
        r2.stop();
        r3.stop();
        orbLoop.stop();
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      // Fade out smoothly
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  }, [visible, containerOpacity, ghostFloatY, ghostScale, shimmerTranslate, progressFill, ripple1, ripple2, ripple3, orbFloat, onFinish]);

  if (!visible) return null;

  // Ripple interpolation
  const getRippleStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 2.2],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.8, 0.4, 0],
    }),
  });

  const shimmerX = shimmerTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-180, 180],
  });

  const progressWidth = progressFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '100%'],
  });

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <Animated.View style={[styles.fullScreenBackdrop, { opacity: containerOpacity }]}>
        {/* Layer 1: Native Optical Backdrop Blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 85 : 95}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 2: Ambient Glowing Liquid Orbs */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.ambientOrbPurple,
              {
                transform: [
                  {
                    translateY: orbFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 20],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ambientOrbGold,
              {
                transform: [
                  {
                    translateY: orbFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, -20],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Layer 3: Central Liquid Glass Stage */}
        <View style={styles.centerStage}>
          {/* Liquid Ripple Wave Rings */}
          <View style={styles.rippleContainer} pointerEvents="none">
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple1)]} />
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple2)]} />
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple3)]} />
          </View>

          {/* Central Floating Ghost Mascot with 3D Specular Shadow */}
          <Animated.View
            style={[
              styles.ghostHeroContainer,
              {
                transform: [
                  { translateY: ghostFloatY },
                  { scale: ghostScale },
                ],
              },
            ]}
          >
            {/* Ambient Aura Glow behind Ghost */}
            <View style={styles.ghostGlowBackdrop} />

            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.ghostHeroImage}
              resizeMode="contain"
            />

            {/* Specular Sparkle Accents */}
            <View style={styles.sparkleTopRight}>
              <Text style={{ fontSize: 13 }}>✨</Text>
            </View>
            <View style={styles.sparkleBottomLeft}>
              <Text style={{ fontSize: 11 }}>⚡</Text>
            </View>
          </Animated.View>

          {/* Typography & Luxury Status */}
          <View style={styles.metaContainer}>
            <Text style={styles.headlineText}>{message}</Text>
            <Text style={styles.stepText}>{activeStepText}</Text>
          </View>

          {/* Luxury Slim Shimmer Progress Ray */}
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
                    'rgba(255, 255, 255, 0.85)',
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
    backgroundColor: 'rgba(250, 248, 245, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  // Ambient Soft Floating Light Orbs
  ambientOrbPurple: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
    left: SCREEN_WIDTH * 0.15,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(112, 72, 236, 0.14)',
  },
  ambientOrbGold: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
    right: SCREEN_WIDTH * 0.12,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
  },
  // Central Stage
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(112, 72, 236, 0.45)',
  },
  ghostHeroContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ghostGlowBackdrop: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  ghostHeroImage: {
    width: 86,
    height: 86,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: 4,
    left: 4,
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  headlineText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 5,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7F7894',
    textAlign: 'center',
  },
  // Luxury Slim Shimmer Progress Ray
  progressTrackWrapper: {
    width: 170,
    alignItems: 'center',
  },
  progressTrackBg: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(235, 230, 248, 0.85)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFillBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  shimmerRay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
});
