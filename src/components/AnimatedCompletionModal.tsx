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
  actionText = 'Awesome, Continue',
  onDismiss,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const ghostBounceY = useRef(new Animated.Value(0)).current;
  const ghostTilt = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const particleBurst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset values
      scaleAnim.setValue(0.6);
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
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(180),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            friction: 4,
            tension: 85,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particleBurst, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();

      // 3D Victory Ghost Joyful Bounce & Tilt loop
      const ghostLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ghostBounceY, {
              toValue: -10,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(ghostTilt, {
              toValue: 1,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ghostBounceY, {
              toValue: 3,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(ghostTilt, {
              toValue: -1,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
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
  }, [visible, scaleAnim, opacityAnim, ghostBounceY, ghostTilt, checkmarkScale, sparkleRotate, particleBurst]);

  if (!visible) return null;

  const spin = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tilt = ghostTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const p1_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });
  const p1_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const p2_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const p2_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const p3_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
  const p3_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const p4_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 90] });
  const p4_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const pOpacity = particleBurst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 90}
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
          {/* Confetti Explosion Particles */}
          <Animated.View
            style={[
              styles.particle,
              {
                transform: [{ translateX: p1_x }, { translateY: p1_y }],
                opacity: pOpacity,
              },
            ]}
          >
            <Text style={{ fontSize: 22 }}>✨</Text>
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
            <Text style={{ fontSize: 22 }}>⭐</Text>
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
            <Text style={{ fontSize: 20 }}>🎉</Text>
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
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </Animated.View>

          {/* Top Badge */}
          <View style={styles.completionBadge}>
            <Text style={styles.completionBadgeIcon}>🏆</Text>
            <Text style={styles.completionBadgeText}>{badgeText}</Text>
          </View>

          {/* 3D VICTORY GHOST MASCOT CONTAINER */}
          <View style={styles.mascotArea}>
            {/* Spinning Glow Ring */}
            <Animated.View
              style={[
                styles.sparkleRing,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Svg width={180} height={180} viewBox="0 0 180 180">
                <Circle
                  cx="90"
                  cy="90"
                  r="82"
                  stroke="rgba(253, 224, 71, 0.45)"
                  strokeWidth="2"
                  strokeDasharray="14 14"
                  fill="none"
                />
              </Svg>
            </Animated.View>

            {/* 3D Victory Ghost Character with Cloud & Fireworks */}
            <Animated.View
              style={[
                styles.ghost3DVictoryWrapper,
                {
                  transform: [
                    { translateY: ghostBounceY },
                    { rotate: tilt },
                  ],
                },
              ]}
            >
              <View style={styles.mascot3DVictoryPod}>
                <Image
                  source={require('../../assets/images/ghost-3d-victory.jpg')}
                  style={styles.ghost3DVictoryImg}
                  resizeMode="cover"
                />
                <View style={styles.mascotSpecularSheen} />
              </View>
            </Animated.View>

            {/* Glowing Checkmark Badge */}
            <Animated.View
              style={[
                styles.checkmarkBadge,
                { transform: [{ scale: checkmarkScale }] },
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
    maxWidth: 330,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.3,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.26,
    shadowRadius: 36,
    elevation: 18,
  },
  particle: {
    position: 'absolute',
    top: '32%',
    left: '50%',
    zIndex: 100,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
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
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  sparkleRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghost3DVictoryWrapper: {
    width: 155,
    height: 155,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot3DVictoryPod: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    backgroundColor: '#FFFFFF',
  },
  ghost3DVictoryImg: {
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
  checkmarkBadge: {
    position: 'absolute',
    bottom: 6,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 21,
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
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
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
    height: 48,
    borderRadius: 16,
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
