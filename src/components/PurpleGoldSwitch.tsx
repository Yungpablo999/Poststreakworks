import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PurpleGoldSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  trackWidth?: number;
  trackHeight?: number;
}

export const PurpleGoldSwitch: React.FC<PurpleGoldSwitchProps> = ({
  value,
  onValueChange,
  trackWidth = 48,
  trackHeight = 28,
}) => {
  const thumbSize = trackHeight - 4; // 24
  const travelDistance = trackWidth - thumbSize - 4; // 48 - 24 - 4 = 20

  const switchTranslate = useRef(new Animated.Value(value ? travelDistance : 2)).current;

  useEffect(() => {
    Animated.spring(switchTranslate, {
      toValue: value ? travelDistance : 2,
      useNativeDriver: true,
      bounciness: 6,
      speed: 18,
    }).start();
  }, [value, travelDistance]);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={[
        styles.trackBase,
        { width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2 },
        value ? styles.trackActive : styles.trackInactive,
      ]}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.thumbBase,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            transform: [{ translateX: switchTranslate }],
          },
        ]}
      >
        {value ? (
          <View
            style={[
              styles.goldThumb,
              { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 },
            ]}
          >
            {/* Subtle inner gold accent core */}
            <View style={styles.goldCoreDot} />
          </View>
        ) : (
          <View
            style={[
              styles.inactiveThumb,
              { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 },
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  trackBase: {
    justifyContent: 'center',
  },
  trackActive: {
    backgroundColor: '#582CDB', // Deep Royal Violet/Purple
  },
  trackInactive: {
    backgroundColor: '#E2E8F0', // Minimal Slate
  },
  thumbBase: {
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  goldThumb: {
    backgroundColor: '#F59E0B', // Rich Warm 24K Gold
    borderWidth: 1.5,
    borderColor: '#FDE68A', // Luminous Light Gold Rim
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldCoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  inactiveThumb: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
