import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Platform,
  BackHandler,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface EdgeSwipeBackWrapperProps {
  enabled?: boolean;
  onSwipeBack?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edgeWidth?: number; // Left edge trigger zone in pixels (default: 32px)
}

export const EdgeSwipeBackWrapper: React.FC<EdgeSwipeBackWrapperProps> = ({
  enabled = true,
  onSwipeBack,
  children,
  style,
  edgeWidth = 32,
}) => {
  const isBackTriggered = useRef(false);

  // 1. Android System & Hardware Back Button
  useEffect(() => {
    if (!enabled || !onSwipeBack) return;

    if (Platform.OS === 'android') {
      const backAction = () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onSwipeBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }
  }, [enabled, onSwipeBack]);

  // 2. Non-Intrusive Edge-Swipe Gesture Detection
  // Never intercepts on start (so buttons and scroll work 100% normally).
  // Only activates when a genuine horizontal drag from the left edge is performed.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        if (!enabled || !onSwipeBack) return false;
        const isFromEdge = gestureState.x0 <= edgeWidth;
        const isHorizontalDrag = gestureState.dx > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        return isFromEdge && isHorizontalDrag;
      },
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
        if (!enabled || !onSwipeBack) return false;
        const isFromEdge = gestureState.x0 <= edgeWidth;
        const isHorizontalDrag = gestureState.dx > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5;
        return isFromEdge && isHorizontalDrag;
      },
      onPanResponderGrant: () => {
        isBackTriggered.current = false;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (!enabled || !onSwipeBack || isBackTriggered.current) return;
        // Trigger threshold: 55px drag or fast swipe velocity
        if (gestureState.dx >= 55 || (gestureState.dx >= 28 && gestureState.vx > 0.4)) {
          isBackTriggered.current = true;
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onSwipeBack();
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (!enabled || !onSwipeBack || isBackTriggered.current) return;
        if (gestureState.dx >= 40 || gestureState.vx > 0.3) {
          isBackTriggered.current = true;
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onSwipeBack();
        }
      },
      onPanResponderTerminate: () => {
        isBackTriggered.current = false;
      },
    })
  ).current;

  return (
    <View
      style={[styles.container, style]}
      {...panResponder.panHandlers}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
