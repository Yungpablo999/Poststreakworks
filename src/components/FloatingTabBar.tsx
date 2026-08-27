import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassBackground } from './LiquidGlassBackground';

export type TabType = 'home' | 'create' | 'match' | 'quests' | 'growth';

export interface FloatingTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  style?: ViewStyle;
}

// Vector SVG Icons for Bottom Navigation
const HomeNavIcon = ({ color }: { color: string }) => (
  <Svg width={21} height={21} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2.5L2 11.5H5.5V21.5H9.5V14.5C9.5 13.67 10.17 13 11 13H13C13.83 13 14.5 13.67 14.5 14.5V21.5H18.5V11.5H22L12 2.5Z"
      fill={color}
    />
  </Svg>
);

const CreateNavIcon = ({ color }: { color: string }) => (
  <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.4" />
    <Path d="M12 7.5V16.5M7.5 12H16.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);

const MatchNavIcon = ({ color }: { color: string }) => (
  <Svg width={23} height={21} viewBox="0 0 28 24" fill={color}>
    <Circle cx="14" cy="5.8" r="3.6" fill={color} />
    <Path
      d="M8.2 18.2C8.2 15 10.8 12.2 14 12.2C17.2 12.2 19.8 15 19.8 18.2V20.5H8.2V18.2Z"
      fill={color}
    />
    <Circle cx="5.2" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M1.2 19.2C1.2 17 3 15 5.2 15C6.1 15 6.9 15.3 7.5 15.7C7.3 16.5 7.2 17.4 7.2 18.2V20.5H1.2V19.2Z"
      fill={color}
    />
    <Circle cx="22.8" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M26.8 19.2C26.8 17 25 15 22.8 15C21.9 15 21.1 15.3 20.5 15.7C20.7 16.5 20.8 17.4 20.8 18.2V20.5H26.8V19.2Z"
      fill={color}
    />
  </Svg>
);

const QuestsNavIcon = ({ color }: { color: string }) => (
  <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
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
  <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
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
  { id: 'match', label: 'Match', icon: (c) => <MatchNavIcon color={c} /> },
  { id: 'quests', label: 'Quests', icon: (c) => <QuestsNavIcon color={c} /> },
  { id: 'growth', label: 'Growth', icon: (c) => <GrowthNavIcon color={c} /> },
];

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabPress,
  style,
}) => {
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
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            if (isActive) {
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => handlePress(tab.id)}
                  style={styles.activeTabTouchable}
                  hitSlop={6}
                >
                  <LinearGradient
                    colors={['#6A3EE6', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeCapsule}
                  >
                    <View style={styles.iconWrapper}>
                      {tab.icon('#FFFFFF')}
                    </View>
                    <Text style={styles.tabLabelActive} numberOfLines={1}>
                      {tab.label}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={tab.id}
                onPress={() => handlePress(tab.id)}
                style={({ pressed }) => [
                  styles.inactiveTabItem,
                  pressed && styles.inactiveTabPressed,
                ]}
                hitSlop={6}
              >
                <View style={styles.iconWrapper}>
                  {tab.icon('#6E677F')}
                </View>
                <Text style={styles.tabLabelInactive} numberOfLines={1}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: 6,
    width: '100%',
  },
  inactiveTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: 18,
  },
  inactiveTabPressed: {
    backgroundColor: 'rgba(23, 20, 32, 0.04)',
    transform: [{ scale: 0.96 }],
  },
  tabLabelInactive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6E677F',
    letterSpacing: 0.1,
    textAlign: 'center',
    marginTop: 2,
  },
  activeTabTouchable: {
    flex: 1.1,
    paddingHorizontal: 2,
  },
  activeCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrapper: {
    height: 22,
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
});
