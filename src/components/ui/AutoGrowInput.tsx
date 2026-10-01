import React, { useState } from 'react';
import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { TextInput } from './AppText';
import { ds } from '../../theme/colors';

// A multiline text box that grows to fit its text on every platform.
// Web textareas don't grow on their own, so they're sized from their
// content; iPhone / Android multiline inputs grow by themselves (forcing a
// height there stops the text wrapping).

interface AutoGrowInputProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  minHeight?: number;
  style?: StyleProp<TextStyle>;
  onFocus?: () => void;
  onBlur?: () => void;
  maxLength?: number;
  accessibilityLabel?: string;
}

export function AutoGrowInput({ value, onChangeText, placeholder, minHeight = 50, style, onFocus, onBlur, maxLength, accessibilityLabel }: AutoGrowInputProps) {
  const [h, setH] = useState(minHeight);
  const web = Platform.OS === 'web';
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline
      placeholder={placeholder}
      placeholderTextColor={ds.text3}
      selectionColor={ds.purple}
      onFocus={onFocus}
      onBlur={onBlur}
      maxLength={maxLength}
      accessibilityLabel={accessibilityLabel}
      onContentSizeChange={web ? (e) => setH(Math.max(minHeight, Math.ceil(e.nativeEvent.contentSize.height))) : undefined}
      scrollEnabled={!web}
      style={[styles.input, { minHeight }, style, web && { height: h }]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    color: ds.ink,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
});
