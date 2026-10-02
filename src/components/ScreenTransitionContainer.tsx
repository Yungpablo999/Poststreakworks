import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  ViewStyle,
  Platform,
  Easing,
  StyleProp,
  View,
} from 'react-native';

export type ScreenTransitionType = 'tab' | 'modal' | 'push' | 'fade';

interface ScreenTransitionContainerProps {
  screenKey: string;
  previousScreenKey?: string;
  transitionType?: ScreenTransitionType;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const TAB_INDEX_MAP: Record<string, number> = {
  dashboard: 0,
  home: 0,
  create: 1,
  quests: 2,
  growth: 3,
  schedule: 4,
};

export const ScreenTransitionContainer: React.FC<ScreenTransitionContainerProps> = ({
  screenKey,
  previousScreenKey,
  transitionType = 'tab',
  children,
  style,
}) => {
  const animFade = useRef(new Animated.Value(1)).current;
  const animTranslateX = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(0)).current;

  // Web GPU state for 120fps hardware-composited transitions
  const [webTransform, setWebTransform] = useState('translate3d(0, 0, 0)');
  const [webOpacity, setWebOpacity] = useState(1);
  const [webTransition, setWebTransition] = useState('none');

  useEffect(() => {
    let initialX = 0;
    let initialY = 0;
    let initialOpacity = 1;
    const duration = 240;
    const easing = Easing.bezier(0.16, 1, 0.3, 1); // Apple fluid momentum curve

    if (transitionType === 'tab') {
      const prevIdx =
        previousScreenKey && previousScreenKey in TAB_INDEX_MAP
          ? TAB_INDEX_MAP[previousScreenKey]
          : 0;
      const currIdx =
        screenKey in TAB_INDEX_MAP ? TAB_INDEX_MAP[screenKey] : 0;

      if (currIdx > prevIdx) {
        initialX = 54; // Smooth horizontal slide from right
      } else if (currIdx < prevIdx) {
        initialX = -54; // Smooth horizontal slide from left
      } else {
        initialX = 0;
      }
      initialY = 0;
      initialOpacity = 0.96; // Zero white flash, velvety soft entry
    } else if (transitionType === 'push') {
      initialX = 40;
      initialY = 0;
      initialOpacity = 0.94;
    } else if (transitionType === 'modal') {
      initialX = 0;
      initialY = 18;
      initialOpacity = 0.94;
    } else {
      initialX = 0;
      initialY = 0;
      initialOpacity = 0.96;
    }

    if (Platform.OS === 'web') {
      // Step 1: Set initial offset with no transition
      setWebTransition('none');
      setWebTransform(`translate3d(${initialX}px, ${initialY}px, 0)`);
      setWebOpacity(initialOpacity);

      // Step 2: Next frame -> trigger GPU hardware animation at 120fps
      const raf = requestAnimationFrame(() => {
        setWebTransition('transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)');
        setWebTransform('translate3d(0, 0, 0)');
        setWebOpacity(1);
      });

      return () => cancelAnimationFrame(raf);
    } else {
      // Native iOS / Android direct UI thread driver
      animTranslateX.setValue(initialX);
      animTranslateY.setValue(initialY);
      animFade.setValue(initialOpacity);

      Animated.parallel([
        Animated.timing(animTranslateX, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(animFade, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [screenKey, previousScreenKey, transitionType]);

  if (Platform.OS === 'web') {
    return (
      <View
        key={screenKey}
        style={[
          styles.container,
          {
            opacity: webOpacity,
            transform: [{ translateX: 0 }], // fallback
            ...(Platform.OS === 'web'
              ? ({
                  transform: webTransform,
                  transition: webTransition,
                  willChange: 'transform, opacity',
                } as any)
              : {}),
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      key={screenKey}
      style={[
        styles.container,
        {
          opacity: animFade,
          transform: [
            { translateX: animTranslateX },
            { translateY: animTranslateY },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF8F5',
    ...(Platform.OS === 'web'
      ? ({
          willChange: 'transform, opacity',
        } as any)
      : {}),
  },
});
