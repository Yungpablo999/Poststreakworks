import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export interface GhostLoadingScreenProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  transparent?: boolean;
}

export const GhostLoadingScreen: React.FC<GhostLoadingScreenProps> = ({
  visible,
  message = 'Loading Studio...',
  subMessage = 'Jarvis AI is optimizing your workflow',
  transparent = true,
}) => {
  // Animation refs
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const spinnerRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Ghost floating buoyancy + breathing
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ghostFloatY, {
              toValue: -8,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 1.06,
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
              toValue: 4,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(ghostScale, {
              toValue: 0.96,
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

      // Spinner rotation
      const spinLoop = Animated.loop(
        Animated.timing(spinnerRotate, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        })
      );

      floatLoop.start();
      spinLoop.start();

      return () => {
        floatLoop.stop();
        spinLoop.stop();
      };
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, ghostFloatY, ghostScale, glowPulse, spinnerRotate, fadeAnim]);

  if (!visible) return null;

  const spin = spinnerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent={transparent} animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 85}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
          {/* Glowing Aura Ring */}
          <Animated.View
            style={[
              styles.glowingAura,
              {
                opacity: glowPulse,
                transform: [{ scale: ghostScale }],
              },
            ]}
          />

          {/* Orbiting Spinner Ring */}
          <Animated.View
            style={[
              styles.spinnerWrapper,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Svg width={110} height={110} viewBox="0 0 110 110">
              <Circle
                cx="55"
                cy="55"
                r="48"
                stroke="rgba(221, 214, 254, 0.4)"
                strokeWidth="3"
                fill="none"
              />
              <Circle
                cx="55"
                cy="55"
                r="48"
                stroke="#582CDB"
                strokeWidth="3.5"
                strokeDasharray="70 200"
                strokeLinecap="round"
                fill="none"
              />
              <Circle cx="55" cy="7" r="3.5" fill="#FDE047" />
            </Svg>
          </Animated.View>

          {/* Animated Ghost Mascot */}
          <Animated.View
            style={[
              styles.ghostWrapper,
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
              style={styles.ghostImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Animated Text */}
          <View style={styles.textContainer}>
            <Text style={styles.loadingTitle}>{message}</Text>
            {subMessage ? (
              <Text style={styles.loadingSubTitle}>{subMessage}</Text>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  contentCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
    width: 260,
  },
  glowingAura: {
    position: 'absolute',
    top: 36,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(112, 72, 236, 0.25)',
  },
  spinnerWrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ghostWrapper: {
    position: 'absolute',
    top: 48,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostImage: {
    width: 54,
    height: 54,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  loadingSubTitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
  },
});
