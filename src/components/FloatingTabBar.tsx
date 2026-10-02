import React, { useEffect, useState } from 'react';
import { TourTarget } from './tour/GhostTour';
import { StyleSheet, View, Pressable, Platform, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Text } from './ui/AppText';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { IS_WEB_APP, useBreakpoint } from '../hooks/useBreakpoint';

// The floating glass tab bar shared by every main screen (phones and tablets;
// on desktop the side menu takes over, so it renders nothing). A purple pill springs
// to the chosen tab and its icon pops; on web, tabs brighten on hover.

export type TabType = 'home' | 'create' | 'quests' | 'growth';

export interface FloatingTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  style?: ViewStyle;
}

// Vector SVG Icons for Bottom Navigation
export const HomeNavIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2.5L2 11.5H5.5V21.5H9.5V14.5C9.5 13.67 10.17 13 11 13H13C13.83 13 14.5 13.67 14.5 14.5V21.5H18.5V11.5H22L12 2.5Z"
      fill={color}
    />
  </Svg>
);

export const CreateNavIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.4" />
    <Path d="M12 7.5V16.5M7.5 12H16.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);

export const QuestsNavIcon = ({ color }: { color: string }) => (
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

export const GrowthNavIcon = ({ color }: { color: string }) => (
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

const PAD_X = 6;
// Each screen mounts its own tab bar, so remember the last tab across mounts:
// the pill then starts where it was and slides to the new tab.
let lastIndex = 0;
const PILL_SPRING = { damping: 18, stiffness: 220, mass: 0.8 };
const INACTIVE = '#6E677F';
const HOVER = '#3F3854';

function TabSlot({
  tab,
  active,
  onPress,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(1);
  const press = useSharedValue(0);
  const [hovered, setHovered] = useState(false);

  // Icon pops when this tab becomes active
  useEffect(() => {
    if (!active || reduceMotion) return;
    pop.value = withSequence(withTiming(0.8, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 300 }));
  }, [active, reduceMotion, pop]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value * (1 - 0.08 * press.value) }] }));
  const color = active ? '#FFFFFF' : hovered ? HOVER : INACTIVE;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (press.value = withTiming(1, { duration: 80 }))}
      onPressOut={() => (press.value = withTiming(0, { duration: 160 }))}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.tabSlot, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
      hitSlop={8}
      accessibilityRole="tab"
      accessibilityLabel={`${tab.label} tab`}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.iconWrapper, iconStyle]}>{tab.icon(color)}</Animated.View>
      <Text style={[active ? styles.tabLabelActive : styles.tabLabelInactive, !active && { color }]} numberOfLines={1}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = (props) => {
  const bp = useBreakpoint();
  // In a browser the web header and menu replace the app's tab bar
  if (bp === 'desktop' || IS_WEB_APP) return null;
  return <FloatingTabBarInner {...props} />;
};

const FloatingTabBarInner: React.FC<FloatingTabBarProps> = ({ activeTab, onTabPress, style }) => {
  const [rowWidth, setRowWidth] = useState(0);
  const activeIndex = TAB_INDICES[activeTab] ?? 0;
  const tabWidth = rowWidth > 0 ? (rowWidth - PAD_X * 2) / 4 : 0;
  const pillX = useSharedValue(0);
  const stretch = useSharedValue(1);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== rowWidth) {
      setRowWidth(width);
      pillX.value = lastIndex * ((width - PAD_X * 2) / 4);
    }
  };

  useEffect(() => {
    if (tabWidth <= 0) return;
    const moved = lastIndex !== activeIndex;
    lastIndex = activeIndex;
    if (!moved) {
      pillX.value = activeIndex * tabWidth;
      return;
    }
    pillX.value = withSpring(activeIndex * tabWidth, PILL_SPRING);
    // A little squash-and-stretch while it travels
    stretch.value = withSequence(withTiming(1.12, { duration: 120 }), withSpring(1, { damping: 12, stiffness: 240 }));
  }, [activeIndex, tabWidth, pillX, stretch]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }, { scaleX: stretch.value }, { scaleY: 2 - stretch.value }],
  }));

  const handlePress = (tab: TabType) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(tab);
  };

  return (
    <View style={[styles.floatingWrapper, style]} pointerEvents="box-none">
      <TourTarget id="tab-bar" style={styles.glassBarContainer}>
        {Platform.OS !== 'web' && (
          <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]} />
        )}
        <View style={styles.tabsRow} onLayout={handleLayout}>
          {tabWidth > 0 && (
            <Animated.View style={[styles.slidingPillContainer, { width: tabWidth }, pillStyle]} pointerEvents="none">
              <LinearGradient colors={['#6A4BF0', '#5B3EE8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activeCapsule} />
            </Animated.View>
          )}
          {TABS.map((tab) => (
            <TabSlot key={tab.id} tab={tab} active={activeTab === tab.id} onPress={() => handlePress(tab.id)} />
          ))}
        </View>
      </TourTarget>
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
  },
  glassBarContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.6)',
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
    shadowColor: '#5B3EE8',
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
