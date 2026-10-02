import React from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Text } from './AppText';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'pillTab' | 'social';

export interface ButtonProps {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean; // For pillTab
  socialProvider?: 'google' | 'apple' | 'x';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  title,
  variant = 'primary',
  size = 'md',
  isActive = false,
  socialProvider,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const renderSocialIcon = () => {
    if (socialProvider === 'google') {
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.iconMargin}>
          <Path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <Path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <Path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <Path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            fill="#EA4335"
          />
        </Svg>
      );
    }
    if (socialProvider === 'apple') {
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="#171420" style={styles.iconMargin}>
          <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.05 1.71-.92 2.73 1 .08 2.02-.51 2.62-1.23z" />
        </Svg>
      );
    }
    if (socialProvider === 'x') {
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="#171420" style={styles.iconMargin}>
          <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </Svg>
      );
    }
    return null;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        variant === 'pillTab' && isActive && styles.pillTabActive,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || (variant === 'pillTab' && isActive) ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconMargin}>{icon}</View>}
          {renderSocialIcon()}
          {title ? (
            <Text
              style={[
                styles.baseText,
                styles[`text_${variant}`],
                styles[`textSize_${size}`],
                variant === 'pillTab' && isActive && styles.pillTabTextActive,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && <View style={styles.iconMarginRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' as any } : {}),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  iconMarginRight: {
    marginLeft: 8,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' as any } : {}),
  },

  // Variants
  primary: {
    backgroundColor: colors.primary, // #5B3EE8
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border, // #ECE8E0
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  pillTab: {
    backgroundColor: '#EDE9FE',
    borderRadius: radius.pillTab, // 8px
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillTabActive: {
    backgroundColor: '#171420',
  },
  social: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border, // #ECE8E0
    borderRadius: radius.button, // 14px
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    minHeight: 52,
  },

  // Text base
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: colors.textPrimary, // #171420
  },
  text_outline: {
    color: colors.textPrimary,
  },
  text_ghost: {
    color: colors.textSecondary,
  },
  text_pillTab: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  pillTabTextActive: {
    color: '#FFFFFF',
  },
  text_social: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // Text sizes
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 16,
  },
});
