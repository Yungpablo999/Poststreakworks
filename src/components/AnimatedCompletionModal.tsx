import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Image,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export interface AnimatedCompletionModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  xpEarned?: number;
  streakCount?: number;
  actionText?: string;
  onDismiss: () => void;
}

export const AnimatedCompletionModal: React.FC<AnimatedCompletionModalProps> = ({
  visible,
  title = 'Mission Accomplished!',
  subtitle = 'Your post has been scheduled & streak is protected.',
  badgeText = 'POST COMPLETED',
  xpEarned = 50,
  streakCount = 48,
  actionText = 'Continue',
  onDismiss,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const ghostBounceY = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const particleBurst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset values
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      checkmarkScale.setValue(0);
      particleBurst.setValue(0);

      // Entrance spring sequence
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(150),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particleBurst, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Ghost floating victory bounce loop
      const ghostLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(ghostBounceY, {
            toValue: -8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(ghostBounceY, {
            toValue: 2,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Sparkle rotation
      const spinLoop = Animated.loop(
        Animated.timing(sparkleRotate, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      );

      ghostLoop.start();
      spinLoop.start();

      return () => {
        ghostLoop.stop();
        spinLoop.stop();
      };
    }
  }, [visible, scaleAnim, opacityAnim, ghostBounceY, checkmarkScale, sparkleRotate, particleBurst]);

  if (!visible) return null;

  const spin = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const p1_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const p1_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const p2_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const p2_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const p3_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const p3_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const p4_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 70] });
  const p4_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const pOpacity = particleBurst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 85}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Confetti Particles */}
          <Animated.View
            style={[
              styles.particle,
              {
                transform: [{ translateX: p1_x }, { translateY: p1_y }],
                opacity: pOpacity,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>✨</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.particle,
              {
                transform: [{ translateX: p2_x }, { translateY: p2_y }],
                opacity: pOpacity,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>⭐</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.particle,
              {
                transform: [{ translateX: p3_x }, { translateY: p3_y }],
                opacity: pOpacity,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>🎉</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.particle,
              {
                transform: [{ translateX: p4_x }, { translateY: p4_y }],
                opacity: pOpacity,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>🔥</Text>
          </Animated.View>

          {/* Top Badge */}
          <View style={styles.completionBadge}>
            <Text style={styles.completionBadgeIcon}>🏆</Text>
            <Text style={styles.completionBadgeText}>{badgeText}</Text>
          </View>

          {/* Center Mascot & Checkmark */}
          <View style={styles.mascotArea}>
            {/* Spinning Glow Ring */}
            <Animated.View
              style={[
                styles.sparkleRing,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <Circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="rgba(253, 224, 71, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="12 12"
                  fill="none"
                />
              </Svg>
            </Animated.View>

            {/* Bouncing Celebratory Ghost */}
            <Animated.View
              style={[
                styles.ghostWrapper,
                { transform: [{ translateY: ghostBounceY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.ghostImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Glowing Checkmark Badge */}
            <Animated.View
              style={[
                styles.checkmarkBadge,
                { transform: [{ scale: checkmarkScale }] },
              ]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>

          {/* Reward Metrics Row */}
          <View style={styles.rewardsRow}>
            {xpEarned > 0 ? (
              <View style={styles.rewardChipXp}>
                <Text style={styles.rewardChipEmoji}>⚡</Text>
                <Text style={styles.rewardChipValue}>+{xpEarned} XP</Text>
              </View>
            ) : null}

            {streakCount > 0 ? (
              <View style={styles.rewardChipStreak}>
                <Text style={styles.rewardChipEmoji}>🔥</Text>
                <Text style={styles.rewardChipValue}>Day {streakCount}</Text>
              </View>
            ) : null}
          </View>

          {/* Continue Button */}
          <Pressable
            style={({ pressed }) => [styles.continueBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onDismiss();
            }}
          >
            <LinearGradient
              colors={['#7048EC', '#582CDB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueBtnText}>{actionText}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 16,
  },
  particle: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    zIndex: 100,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.8)',
  },
  completionBadgeIcon: {
    fontSize: 12,
  },
  completionBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  mascotArea: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  sparkleRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostWrapper: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostImage: {
    width: 68,
    height: 68,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 8,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  rewardChipXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE8FC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  rewardChipStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rewardChipEmoji: {
    fontSize: 12,
  },
  rewardChipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  continueBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
