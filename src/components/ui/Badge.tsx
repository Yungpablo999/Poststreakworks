import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

export type BadgeVariant = 'purple' | 'gold' | 'success' | 'warning' | 'neutral' | 'pro';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'purple',
  icon,
  size = 'md',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      {icon && <View style={styles.iconMargin}>{icon}</View>}
      <Text style={[styles.baseText, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.badge, // 8px
    alignSelf: 'flex-start',
  },
  iconMargin: {
    marginRight: 4,
  },
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Variants
  purple: {
    backgroundColor: '#EDE9FE',
  },
  gold: {
    backgroundColor: '#FEF3C7',
  },
  success: {
    backgroundColor: '#DCFCE7',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  neutral: {
    backgroundColor: '#F1F5F9',
  },
  pro: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  // Text Variants
  text_purple: {
    color: '#5B3EE8',
  },
  text_gold: {
    color: '#D97706',
  },
  text_success: {
    color: '#15803D',
  },
  text_warning: {
    color: '#D97706',
  },
  text_neutral: {
    color: '#475569',
  },
  text_pro: {
    color: '#B45309',
  },

  // Sizes
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  size_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  textSize_sm: {
    fontSize: 10,
  },
  textSize_md: {
    fontSize: 11,
  },
});
