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
  { id: 'home', label: 'HOME', icon: (c) => <HomeNavIcon color={c} /> },
  { id: 'create', label: 'CREATE', icon: (c) => <CreateNavIcon color={c} /> },
  { id: 'match', label: 'MATCH', icon: (c) => <MatchNavIcon color={c} /> },
  { id: 'quests', label: 'QUESTS', icon: (c) => <QuestsNavIcon color={c} /> },
  { id: 'growth', label: 'GROWTH', icon: (c) => <GrowthNavIcon color={c} /> },
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
      {/* Authentic Frosted Glassmorphism Container */}
      <LiquidGlassBackground
        borderRadius={36}
        tint="purple-gold"
        accentColor="#582CDB"
        hasShadow={true}
        style={styles.tabsRow}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          if (isActive) {
            return (
              <Pressable
                key={tab.id}
                onPress={() => handlePress(tab.id)}
                style={styles.activePillTouchable}
                hitSlop={6}
              >
                {/* Active Royal Purple Capsule */}
                <LinearGradient
                  colors={['#784DF0', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.activeLiquidPill}
                >
                  <View style={styles.pillTopGloss} />
                  <View style={styles.iconWrapper}>
                    {tab.icon('#FFFFFF')}
                  </View>
                  <Text style={styles.tabLabelActive} numberOfLines={1}>
                    {tab.label}
                  </Text>
                  <View style={styles.activeGoldDot} />
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
                {tab.icon('#4A4458')}
              </View>
              <Text style={styles.tabLabelInactive} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </LiquidGlassBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 16,
    left: 14,
    right: 14,
    zIndex: 999,
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  inactiveTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 22,
  },
  inactiveTabPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ scale: 0.96 }],
  },
  tabLabelInactive: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4458',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  activePillTouchable: {
    flex: 1,
  },
  activeLiquidPill: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  pillTopGloss: {
    position: 'absolute',
    top: 1,
    left: 8,
    right: 8,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1,
  },
  iconWrapper: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  activeGoldDot: {
    position: 'absolute',
    bottom: 2.5,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FDE047',
  },
});
