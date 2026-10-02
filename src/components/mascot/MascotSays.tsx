import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { Text } from '../ui/AppText';
import { LiveMascot } from './LiveMascot';
import { useMascot, type Emotion } from '../../mascot/mascot';
import { ds } from '../../theme/colors';

// The mascot with a speech bubble sitting next to it, in the flow of the page
// (sign-up steps, sign-in). It says the step's line, and when something
// happens (you pick a topic, connect an account) it says its reaction instead,
// then goes back to the step's line.

export function MascotSays({ text, size = 64, emotion }: { text: string; size?: number; emotion?: Emotion }) {
  const mood = useMascot();
  // A fixed emotion means a fixed line too (e.g. inside a sheet)
  const line = emotion ? text : mood.line ?? text;
  return (
    <View style={styles.row}>
      <LiveMascot size={size} bubble="none" emotion={emotion} />
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Animated.View key={line} entering={FadeIn.duration(220).easing(Easing.out(Easing.cubic))}>
          <Text style={styles.text} accessibilityLiveRegion="polite">
            {line}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', maxWidth: 460, width: '100%', marginBottom: 14 },
  bubble: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(91, 62, 232, 0.16)',
    shadowColor: '#3F25BF',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  tail: {
    position: 'absolute',
    left: -7,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(91, 62, 232, 0.16)',
    transform: [{ rotate: '45deg' }],
  },
  text: { fontSize: 14.5, lineHeight: 20, fontWeight: '700', color: ds.ink },
});
