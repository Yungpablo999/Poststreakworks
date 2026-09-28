import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  ViewStyle,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import { Text } from './ui/AppText';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export type TabType = 'home' | 'create' | 'quests' | 'growth';

export interface FloatingTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  style?: ViewStyle;
}

// Vector SVG Icons for Bottom Navigation
const HomeNavIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2.5L2 11.5H5.5V21.5H9.5V14.5C9.5 13.67 10.17 13 11 13H13C13.83 13 14.5 13.67 14.5 14.5V21.5H18.5V11.5H22L12 2.5Z"
      fill={color}
    />
  </Svg>
);

const CreateNavIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.4" />
    <Path d="M12 7.5V16.5M7.5 12H16.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);

const QuestsNavIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M3.5 3.5L5.8 2L13.2 9.4L11.4 11.2L4 3.8V3.5Z" fill={color} />
    <Path d="M3.5 3.5L2 5.8L9.4 13.2L11.2 11.4L3.8 4H3.5Z" fill={color} />
    <Path d="M14.5 9.2L9.8 13.9L11.3 15.4L16 10.7L14.5 9.2Z" fill={color} />
    <Path d="M13.2 15.2L17.5 19.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    <Circle cx="18.5" cy="20.5" r="1.6" fill={color} />
    <Path d="M20.5 3.5L18.2 2L10.8 9.4L12.6 11.2L20 3.8V3.5Z" fill={color} />
    <Path d="M20.5 3.5L22 5.8L14.6 13.2L12.8 11.4L20.2 4H20.5Z" fill={color} />
    <Path d="M9.5 9.2L14.2 13.9L12.7 15.4L8 10.7L9.5 9.2Z" fill={color} />
    <Path d="M10.8 15.2L6.5 19.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    <Circle cx="5.5" cy="20.5" r="1.6" fill={color} />
  </Svg>
);

const GrowthNavIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 17L9 11.5L13 15L20.5 7"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 7H20.5V13"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TABS: { id: TabType; label: string; icon: (color: string) => React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: (c) => <HomeNavIcon color={c} /> },
  { id: 'create', label: 'Create', icon: (c) => <CreateNavIcon color={c} /> },
  { id: 'quests', label: 'Quests', icon: (c) => <QuestsNavIcon color={c} /> },
  { id: 'growth', label: 'Growth', icon: (c) => <GrowthNavIcon color={c} /> },
];

const TAB_INDICES: Record<TabType, number> = {
  home: 0,
  create: 1,
  quests: 2,
  growth: 3,
};

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabPress,
  style,
}) => {
  const [rowWidth, setRowWidth] = useState(0);
  const activeIndex = TAB_INDICES[activeTab] ?? 0;
  const tabWidth = rowWidth > 0 ? (rowWidth - 12) / 4 : 0;
  const pillTranslateX = useRef(new Animated.Value(0)).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== rowWidth) {
      setRowWidth(width);
      const singleWidth = (width - 12) / 4;
      pillTranslateX.setValue(activeIndex * singleWidth);
    }
  };

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.timing(pillTranslateX, {
        toValue: activeIndex * tabWidth,
        duration: 240,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [activeIndex, tabWidth]);

  const handlePress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabPress(tab);
  };

  return (
    <View style={[styles.floatingWrapper, style]}>
      {/* Refined Floating iOS Glass Bar */}
      <View style={styles.glassBarContainer}>
        <View style={styles.tabsRow} onLayout={handleLayout}>
          {/* Animated Gliding Purple Pill Indicator */}
          {tabWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingPillContainer,
                {
                  width: tabWidth,
                  transform: [{ translateX: pillTranslateX }],
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['#6A3EE6', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeCapsule}
              />
            </Animated.View>
          )}

          {/* Interactive Tab Slots */}
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => handlePress(tab.id)}
                style={({ pressed }) => [
                  styles.tabSlot,
                  pressed && styles.tabSlotPressed,
                ]}
                hitSlop={8}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label} tab`}
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.iconWrapper}>
                  {tab.icon(isActive ? '#FFFFFF' : '#6E677F')}
                </View>
                <Text
                  style={isActive ? styles.tabLabelActive : styles.tabLabelInactive}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  glassBarContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(23, 20, 32, 0.07), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        } as any)
      : {}),
  },
  tabsRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 6,
    width: '100%',
  },
  slidingPillContainer: {
    position: 'absolute',
    left: 6,
    top: 5,
    bottom: 5,
    zIndex: 1,
  },
  tabSlot: {
    flex: 1,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 2,
  },
  tabSlotPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  activeCapsule: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrapper: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 2,
  },
  tabLabelInactive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6E677F',
    letterSpacing: 0.1,
    textAlign: 'center',
    marginTop: 2,
  },
});
