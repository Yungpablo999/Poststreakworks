import React from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Animated, { ZoomIn, ZoomOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import { NicheIcon, type NicheIconType } from './NicheIcon';

// A selectable glass tile: springs down on press, turns purple when picked,
// and pops a tick into the corner.

interface NicheTileProps {
  title: string;
  subtitle: string;
  icon: NicheIconType;
  selected: boolean;
  onPress: () => void;
}

const SPRING = { damping: 15, stiffness: 320 };

export function NicheTile({ title, subtitle, icon, selected, onPress }: NicheTileProps) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => (scale.value = withSpring(0.95, SPRING))}
      onPressOut={() => (scale.value = withSpring(1, SPRING))}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={styles.pressable}
    >
      <Animated.View style={[styles.tile, selected && styles.tileSelected, pressStyle]}>
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: selected ? 'rgba(237, 233, 254, 0.78)' : 'rgba(255, 255, 255, 0.58)' }]} />

        <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
          <NicheIcon type={icon} color={selected ? '#FFFFFF' : ds.purple} />
        </View>
        <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        {selected && (
          <Animated.View entering={ZoomIn.springify().damping(12)} exiting={ZoomOut.duration(150)} style={styles.check}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    flex: 1, // fill the row height so tiles side by side match
  },
  tile: {
    flex: 1,
    minHeight: 132,
    borderRadius: 22,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  tileSelected: {
    borderColor: ds.purple,
    shadowOpacity: 0.2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconBoxSelected: {
    backgroundColor: ds.purple,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: ds.ink,
    letterSpacing: -0.2,
  },
  titleSelected: {
    color: ds.purple,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: ds.text2,
    marginTop: 3,
  },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ds.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
