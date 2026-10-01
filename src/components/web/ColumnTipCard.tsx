import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '../ui/AppText';
import { JarvisOrb } from '../JarvisOrb';
import { ds } from '../../theme/colors';

// Fills the leftover space at the foot of the shorter column on desktop, so
// both columns end level. It stretches to whatever height is left and shows
// short, rotating tips from Jarvis (tap a dot to switch).

const TIPS = [
  'Film two or three posts in one go on a good day. Future you will thank you.',
  'Reply to a few comments after you post. It brings people back.',
  'Reuse what worked: a new angle on your best post is still a new post.',
  'Trends move fast. Add your own twist instead of copying it exactly.',
  'A clear first second matters more than a perfect edit.',
];

export function ColumnTipCard() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TIPS.length), 7000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <JarvisOrb size={22} />
        <Text style={styles.eyebrow}>A TIP FROM JARVIS</Text>
      </View>
      <Animated.View key={i} entering={FadeIn.duration(400)} style={styles.body}>
        <Text style={styles.tip}>{TIPS[i]}</Text>
      </Animated.View>
      <View style={styles.dots}>
        {TIPS.map((_, k) => (
          <Pressable key={k} onPress={() => setI(k)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Tip ${k + 1}`} style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null}>
            <View style={[styles.dot, k === i && styles.dotOn]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 96, padding: 16, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: ds.purple },
  body: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  tip: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: ds.ink },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.lavender },
  dotOn: { width: 18, backgroundColor: ds.purple },
});
