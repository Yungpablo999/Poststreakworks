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
  speechBubble?: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export const AnimatedCompletionModal: React.FC<AnimatedCompletionModalProps> = ({
  visible,
  title = 'Mission Accomplished!',
  subtitle = 'Your post has been scheduled & streak is protected.',
  badgeText = 'POST COMPLETED',
  xpEarned = 50,
  streakCount = 48,
  speechBubble,
  actionText = 'Continue',
  onAction,
  onDismiss,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.65)).current;
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
      scaleAnim.setValue(0.65);
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
          Animated.delay(160),
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

      // Ghost Joyful Bounce loop
      const ghostLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(ghostBounceY, {
            toValue: -8,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(ghostBounceY, {
            toValue: 2,
            duration: 750,
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

  const p1_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const p1_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const p2_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 70] });
  const p2_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const p3_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });
  const p3_y = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const p4_x = particleBurst.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
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
            <Text style={{ fontSize: 20 }}>✨</Text>
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
            <Text style={{ fontSize: 20 }}>⭐</Text>
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
            <Text style={{ fontSize: 18 }}>🎉</Text>
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
            <Text style={{ fontSize: 18 }}>🔥</Text>
          </Animated.View>

          {/* Top Badge */}
          <View style={styles.completionBadge}>
            <Text style={styles.completionBadgeIcon}>🏆</Text>
            <Text style={styles.completionBadgeText}>{badgeText}</Text>
          </View>

          {/* Pure Ghost Logo Mascot Container */}
          <View style={styles.mascotArea}>
            {/* Spinning Glow Ring */}
            <Animated.View
              style={[
                styles.sparkleRing,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Svg width={130} height={130} viewBox="0 0 130 130">
                <Circle
                  cx="65"
                  cy="65"
                  r="58"
                  stroke="rgba(253, 224, 71, 0.45)"
                  strokeWidth="2"
                  strokeDasharray="12 12"
                  fill="none"
                />
              </Svg>
            </Animated.View>

            {/* Glowing Backdrop */}
            <View style={styles.ghostAuraBackdrop} />

            {/* Ghost Logo */}
            <Animated.View
              style={[
                styles.ghostWrapper,
                { transform: [{ translateY: ghostBounceY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.ghostLogoImg}
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

          {/* Optional Ghost Speech Bubble */}
          {speechBubble ? (
            <View style={styles.speechBubbleContainer}>
              <View style={styles.speechBubblePointer} />
              <Text style={styles.speechBubbleText}>&ldquo;{speechBubble}&rdquo;</Text>
            </View>
          ) : null}
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

          {/* Continue / Action Button */}
          <Pressable
            style={({ pressed }) => [styles.continueBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (onAction) {
                onAction();
              } else {
                onDismiss();
              }
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
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  sparkleRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostAuraBackdrop: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(112, 72, 236, 0.2)',
  },
  ghostWrapper: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostLogoImg: {
    width: 72,
    height: 72,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 6,
    right: 14,
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
  speechBubbleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    maxWidth: 290,
    alignSelf: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  speechBubblePointer: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#E9D5FF',
  },
  speechBubbleText: {
    fontSize: 13,
    color: '#582CDB',
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
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
