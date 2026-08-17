import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;
  const progressFill = useRef(new Animated.Value(0)).current;

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
              duration: 1100,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 1.05,
              duration: 1100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: 5,
              duration: 1100,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 0.95,
              duration: 1100,
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

      ghostLoop.start();
      shimmerLoop.start();

      const t1 = setTimeout(() => {
        setActiveStepText('Syncing...');
      }, 220);

      const t2 = setTimeout(() => {
        setActiveStepText('Ready');
      }, 480);

      return () => {
        ghostLoop.stop();
        shimmerLoop.stop();
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
  }, [visible, containerOpacity, ghostFloatY, ghostScale, shimmerTranslate, progressFill, subMessage, onFinish]);

  if (!visible) return null;

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
        {/* Native Optical Backdrop Blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 90}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* Central Stage: Pure Ghost Logo ONLY */}
        <View style={styles.centerStage}>
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
    backgroundColor: 'rgba(250, 248, 245, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostHeroFrame: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ghostLogoImage: {
    width: 90,
    height: 90,
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
