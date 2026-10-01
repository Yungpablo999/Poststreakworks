import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { getTheme } from '../../theme/colors';

// Day-0 Growth: explains what will appear once a platform is connected,
// without placeholder charts, zeroed stats or fake numbers.

interface GrowthDayZeroPreviewProps {
  isDark?: boolean;
}

export function GrowthDayZeroPreview({ isDark = false }: GrowthDayZeroPreviewProps) {
  const t = getTheme(isDark);
  const items = [
    {
      key: 'formats',
      title: 'Best formats',
      body: 'See whether Reels, carousels or Shorts work best for you.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="12" width="4" height="8" rx="1" stroke={t.primary} strokeWidth={2} />
          <Rect x="10" y="6" width="4" height="14" rx="1" stroke={t.primary} strokeWidth={2} />
          <Rect x="16" y="9" width="4" height="11" rx="1" stroke={t.primary} strokeWidth={2} />
        </Svg>
      ),
    },
    {
      key: 'top-posts',
      title: 'Top posts',
      body: 'Your strongest posts, and why they worked.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3z" stroke={t.primary} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      ),
    },
    {
      key: 'timing',
      title: 'Best time to post',
      body: 'When your audience is most active each week.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={t.primary} strokeWidth={2} />
          <Path d="M12 7v5l3 2" stroke={t.primary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ),
    },
    {
      key: 'insights',
      title: 'Jarvis insights',
      body: 'Personal tips once Jarvis has seen a few posts.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke={t.primary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ),
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[styles.title, { color: t.text }]}>What you'll see here</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>
        Connect a platform above and your insights start filling in after your first posts.
      </Text>
      {items.map((item, i) => (
        <View
          key={item.key}
          style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}
        >
          <View style={[styles.icon, { backgroundColor: t.primaryLight }]}>{item.icon}</View>
          <View style={styles.text}>
            <Text style={[styles.rowTitle, { color: t.text }]}>{item.title}</Text>
            <Text style={[styles.rowBody, { color: t.textSecondary }]}>{item.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
