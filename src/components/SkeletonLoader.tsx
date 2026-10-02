import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';

interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonStatCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.statCardContainer, style]}>
    <SkeletonBox width={40} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonBox width={65} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
    <SkeletonBox width={45} height={10} borderRadius={4} />
  </View>
);

export const SkeletonPostItem: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.postItemContainer, style]}>
    <SkeletonBox width={56} height={56} borderRadius={10} style={{ marginRight: 12 }} />
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <SkeletonBox width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width="50%" height={11} borderRadius={4} />
    </View>
    <SkeletonBox width={50} height={20} borderRadius={10} />
  </View>
);

export const SkeletonCalendarMonth: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.calendarContainer, style]}>
    <View style={styles.calendarHeaderRow}>
      <SkeletonBox width={120} height={18} borderRadius={6} />
      <SkeletonBox width={60} height={22} borderRadius={12} />
    </View>
    <View style={styles.calendarGrid}>
      {Array.from({ length: 28 }).map((_, i) => (
        <SkeletonBox
          key={i}
          width="12%"
          height={38}
          borderRadius={8}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  </View>
);

export const SkeletonCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.cardContainer, style]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <SkeletonBox width={32} height={32} borderRadius={16} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="60%" height={14} borderRadius={4} style={{ marginBottom: 5 }} />
        <SkeletonBox width="35%" height={10} borderRadius={4} />
      </View>
    </View>
    <SkeletonBox width="100%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonBox width="85%" height={12} borderRadius={4} style={{ marginBottom: 14 }} />
    <SkeletonBox width="100%" height={40} borderRadius={12} />
  </View>
);

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#EAE5DF',
  },
  statCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    flex: 1,
  },
  postItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    marginBottom: 16,
  },
});
