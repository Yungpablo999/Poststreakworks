import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface PurpleGoldSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  trackWidth?: number;
  trackHeight?: number;
}

export const PurpleGoldSwitch: React.FC<PurpleGoldSwitchProps> = ({
  value,
  onValueChange,
  trackWidth = 50,
  trackHeight = 28,
}) => {
  const thumbSize = trackHeight - 4; // 24
  const travelDistance = trackWidth - thumbSize - 4; // 50 - 24 - 4 = 22

  const switchTranslate = useRef(new Animated.Value(value ? travelDistance : 2)).current;

  useEffect(() => {
    Animated.spring(switchTranslate, {
      toValue: value ? travelDistance : 2,
      useNativeDriver: true,
      bounciness: 8,
      speed: 20,
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
          <LinearGradient
            colors={['#FDE68A', '#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.goldThumbGradient,
              { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 },
            ]}
          />
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
    backgroundColor: '#582CDB', // Royal Purple
    borderWidth: 1.5,
    borderColor: '#F59E0B', // Radiant Gold Border
  },
  trackInactive: {
    backgroundColor: '#E2E8F0', // Neutral Slate
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  thumbBase: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  goldThumbGradient: {
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  inactiveThumb: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
});
