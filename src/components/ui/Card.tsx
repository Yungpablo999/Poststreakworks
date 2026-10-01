import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

export interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderRadius?: number;
  bordered?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = spacing.cardPadding, // 20px
  borderRadius = radius.card, // 20px
  bordered = true,
  elevated = false,
  onPress,
  disabled = false,
}) => {
  const customStyle: ViewStyle = {
    padding,
    borderRadius,
    borderWidth: bordered ? 1 : 0,
    borderColor: colors.border, // #ECE8E0
    backgroundColor: '#FFFFFF', // Solid white
  };

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          if (disabled) return;
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          customStyle,
          elevated && styles.elevated,
          pressed && !disabled && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, customStyle, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(23, 20, 32, 0.04)',
      } as any,
    }),
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
});
