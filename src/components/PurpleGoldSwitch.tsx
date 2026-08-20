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
        <View
          style={[
            styles.thumbInner,
            { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  trackBase: {
    justifyContent: 'center',
  },
  trackActive: {
    backgroundColor: '#F59E0B', // Radiant 24K Gold (Clean iOS Apple style)
  },
  trackInactive: {
    backgroundColor: '#E2E8F0', // Minimal Slate
  },
  thumbBase: {
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3.5,
    elevation: 3,
  },
  thumbInner: {
    backgroundColor: '#FFFFFF', // Crisp Pure White
  },
});
