import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Lays a screen's cards out for the screen size. Phones and tablets: one
// column, exactly as before. Desktop: two columns side by side; the first
// `split` cards go on the left, the rest on the right (so each screen
// decides what sits next to what, and the order still reads top to bottom).

export function ResponsiveColumns({ children, split, gap = 16, leftFlex = 1, rightFlex = 1 }: {
  children: React.ReactNode;
  split: number;
  gap?: number;
  leftFlex?: number;
  rightFlex?: number;
}) {
  const desktop = useBreakpoint() === 'desktop';
  const items = React.Children.toArray(children).filter(Boolean);
  if (!desktop) return <>{items}</>;
  return (
    <View style={[styles.row, { gap: gap + 4 }]}>
      <View style={[styles.col, { flex: leftFlex, gap }]}>{items.slice(0, split)}</View>
      <View style={[styles.col, { flex: rightFlex, gap }]}>{items.slice(split)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { minWidth: 0 },
});
