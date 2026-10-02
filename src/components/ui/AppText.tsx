import React, { createContext, useContext } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { isBrandSansFamily, jakartaFamily } from '../../theme/fonts';

// Drop-in replacements for React Native's Text and TextInput that render in
// Plus Jakarta Sans at the requested fontWeight. Screens import these instead of
// the react-native versions, so existing `fontWeight: '700'` styles keep working.

type FontInherit = { weight?: TextStyle['fontWeight']; italic?: boolean };

// Nested <Text> inherits weight/italic from its parent, like it does natively.
const FontInheritContext = createContext<FontInherit | null>(null);

const resolveFont = (style: TextProps['style'], inherited: FontInherit | null) => {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const weight = flat.fontWeight ?? inherited?.weight;
  const italic = flat.fontStyle ? flat.fontStyle === 'italic' : inherited?.italic;

  // Respect deliberate non-brand families (e.g. Playfair Display for "Earn.").
  if (!isBrandSansFamily(flat.fontFamily)) {
    return { override: null, next: { weight, italic } };
  }

  return {
    // The family already encodes weight + style, so reset them to avoid faux bold/italic.
    override: { fontFamily: jakartaFamily(weight, italic), fontWeight: 'normal', fontStyle: 'normal' } as TextStyle,
    next: { weight, italic },
  };
};

export function Text({ style, children, ...rest }: TextProps & { ref?: React.Ref<Text> }) {
  const inherited = useContext(FontInheritContext);
  const { override, next } = resolveFont(style, inherited);
  return (
    <RNText {...rest} style={override ? [style, override] : style}>
      <FontInheritContext.Provider value={next}>{children}</FontInheritContext.Provider>
    </RNText>
  );
}

export function TextInput({ style, ...rest }: TextInputProps & { ref?: React.Ref<TextInput> }) {
  const { override } = resolveFont(style, null);
  return <RNTextInput {...rest} style={override ? [style, override] : style} />;
}

// Let `useRef<TextInput>(null)` / `useRef<Text>(null)` keep typing as the native instances.
export type Text = React.ComponentRef<typeof RNText>;
export type TextInput = React.ComponentRef<typeof RNTextInput>;
