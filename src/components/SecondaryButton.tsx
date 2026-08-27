import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  Platform,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconBox}>{icon}</View>}
        <Text style={[styles.title, textStyle]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.985 }],
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
    fontSize: 14.5,
    fontWeight: '600',
    color: '#5E576E',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
