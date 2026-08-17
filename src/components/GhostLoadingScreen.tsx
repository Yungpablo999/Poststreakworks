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
  message = 'PostStreak',
  subMessage = 'Loading...',
  onFinish,
}) => {
  const [activeStepText, setActiveStepText] = useState(subMessage);

  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(0.95)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;
  const progressFill = useRef(new Animated.Value(0)).current;

  // Concentric liquid ripple waves
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setActiveStepText(subMessage);

      // 1. Fade in screen smoothly
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      // 2. Ghost floating buoyancy loop
      const ghostLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: -10,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 1.05,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(glowPulse, {
              toValue: 0.85,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: 5,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 0.95,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(glowPulse, {
              toValue: 0.4,
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
          duration: 1000,
          useNativeDriver: true,
        })
      );

      // 4. Progress bar fill
      progressFill.setValue(0);
      Animated.timing(progressFill, {
        toValue: 1,
        duration: 550,
        useNativeDriver: false,
      }).start();

      // 5. Ripple wave loops
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
      r1.start();
      r2.start();

      const t1 = setTimeout(() => {
        setActiveStepText('Syncing...');
      }, 220);

      const t2 = setTimeout(() => {
        setActiveStepText('Ready');
      }, 480);

      return () => {
        ghostLoop.stop();
        shimmerLoop.stop();
        r1.stop();
        r2.stop();
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  }, [visible, containerOpacity, ghostFloatY, ghostScale, glowPulse, shimmerTranslate, progressFill, ripple1, ripple2, subMessage, onFinish]);

  if (!visible) return null;

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
      outputRange: [0.6, 0.3, 0],
    }),
  });

  const shimmerX = shimmerTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-160, 160],
  });

  const progressWidth = progressFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '100%'],
  });

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <Animated.View style={[styles.fullScreenBackdrop, { opacity: containerOpacity }]}>
        {/* Layer 1: Native Optical Backdrop Blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 90}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 2: Ambient Glowing Liquid Orbs */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.ambientOrbPurple} />
          <View style={styles.ambientOrbGold} />
        </View>

        {/* Layer 3: Central Pure Ghost Logo Stage */}
        <View style={styles.centerStage}>
          {/* Liquid Ripple Wave Rings */}
          <View style={styles.rippleContainer} pointerEvents="none">
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple1)]} />
            <Animated.View style={[styles.rippleRing, getRippleStyle(ripple2)]} />
          </View>

          {/* Glowing Aura Behind Ghost */}
          <Animated.View
            style={[
              styles.ghostGlowBackdrop,
              {
                opacity: glowPulse,
                transform: [{ scale: ghostScale }],
              },
            ]}
          />

          {/* PURE GHOST LOGO MASCOT */}
          <Animated.View
            style={[
              styles.ghostHeroFrame,
              {
                transform: [
                  { translateY: ghostFloatY },
                  { scale: ghostScale },
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.ghostLogoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Typography */}
          <View style={styles.metaContainer}>
            <Text style={styles.headlineText}>{message}</Text>
            <Text style={styles.stepText}>{activeStepText}</Text>
          </View>

          {/* Minimalist Slim Shimmer Progress Ray */}
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
    backgroundColor: 'rgba(250, 248, 245, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  ambientOrbPurple: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
    left: SCREEN_WIDTH * 0.15,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(112, 72, 236, 0.12)',
  },
  ambientOrbGold: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
    right: SCREEN_WIDTH * 0.15,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(112, 72, 236, 0.35)',
  },
  ghostGlowBackdrop: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(112, 72, 236, 0.22)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  ghostHeroFrame: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  ghostLogoImage: {
    width: 82,
    height: 82,
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  headlineText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7F7894',
    textAlign: 'center',
  },
  progressTrackWrapper: {
    width: 150,
    alignItems: 'center',
  },
  progressTrackBg: {
    width: '100%',
    height: 4.5,
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
    width: 50,
  },
});
