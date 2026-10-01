import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Lays a screen's cards out for the screen size. Phones and tablets: one
// column, exactly as before. Desktop: two columns side by side; the first
// `split` cards go on the left, the rest on the right (so each screen
// decides what sits next to what, and the order still reads top to bottom).

export function ResponsiveColumns({ children, split, gap = 16, leftFlex = 1, rightFlex = 1, fullFirst = false }: {
  children: React.ReactNode;
  /** How many cards go in the left column (after the full-width first card, if any) */
  split: number;
  gap?: number;
  leftFlex?: number;
  rightFlex?: number;
  /** Desktop: the first card spans the whole width above the two columns */
  fullFirst?: boolean;
}) {
  const desktop = useBreakpoint() === 'desktop';
  const items = React.Children.toArray(children).filter(Boolean);
  if (!desktop) return <>{items}</>;
  const top = fullFirst ? items[0] : null;
  const rest = fullFirst ? items.slice(1) : items;
  const columns = (
    <View style={[styles.row, { gap: gap + 4 }]}>
      <View style={[styles.col, { flex: leftFlex, gap }]}>{rest.slice(0, split)}</View>
      <View style={[styles.col, { flex: rightFlex, gap }]}>{rest.slice(split)}</View>
    </View>
  );
  if (!top) return columns;
  return (
    <View style={{ gap }}>
      {top}
      {columns}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { minWidth: 0 },
});
