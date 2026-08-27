import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  Platform,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.buttonWrapper,
        disabled && styles.disabledWrapper,
        pressed && !disabled && styles.pressedWrapper,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#94A3B8', '#64748B'] : ['#673DE6', '#5426D7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Specular top highlight line */}
        <View style={styles.topHighlight} />

        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconBox}>{icon}</View>}
            <Text style={[styles.title, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 12px rgba(88, 44, 219, 0.12)',
        } as any)
      : {}),
  },
  disabledWrapper: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
    borderColor: 'transparent',
  },
  pressedWrapper: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
