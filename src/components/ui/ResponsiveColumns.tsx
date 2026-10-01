import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ColumnTipCard } from '../web/ColumnTipCard';

// Lays a screen's cards out for the screen size. Phones and tablets: one
// column, exactly as before. Desktop: two balanced columns. Each card is
// measured, then the cards are split between the columns in the most even
// way, so one side never ends early and leaves a big empty gap. `split` is only the
// first guess, used until the cards have been measured.

export function ResponsiveColumns({ children, split, gap = 16, fullFirst = false }: {
  children: React.ReactNode;
  /** First guess: how many cards start on the left (before measuring) */
  split: number;
  gap?: number;
  /** Kept for older callers; columns are always equal width so they can balance */
  leftFlex?: number;
  rightFlex?: number;
  /** Desktop: the first card spans the whole width above the two columns */
  fullFirst?: boolean;
}) {
  const desktop = useBreakpoint() === 'desktop';
  const items = React.Children.toArray(children).filter(Boolean);
  const top = fullFirst ? items[0] : null;
  const rest = fullFirst ? items.slice(1) : items;

  const heights = useRef<number[]>([]);
  const [placement, setPlacement] = useState<number[] | null>(null);
  // Which column is short by enough to need the tip card (-1 = neither)
  const [shortCol, setShortCol] = useState(-1);

  const measure = useCallback(
    (i: number, h: number) => {
      if (Math.abs((heights.current[i] ?? -1) - h) < 1) return;
      heights.current[i] = h;
      if (heights.current.filter((x) => x !== undefined).length < rest.length) return;
      // Try every way of splitting the cards between the two columns (order
      // within each column is kept) and keep the most even one. The first
      // card always stays top-left so the page still starts where it should.
      const hs = heights.current.slice(0, rest.length);
      const n = hs.length;
      let best = 0;
      let bestDiff = Infinity;
      for (let mask = 0; mask < 1 << n; mask++) {
        if (mask & 1) continue;
        let l = 0;
        let r = 0;
        for (let k = 0; k < n; k++) {
          if (mask & (1 << k)) r += hs[k] + gap;
          else l += hs[k] + gap;
        }
        const diff = Math.abs(l - r);
        if (diff < bestDiff - 0.5) {
          bestDiff = diff;
          best = mask;
        }
      }
      const next = hs.map((_, k) => (best & (1 << k) ? 1 : 0));
      let lh = 0;
      let rh = 0;
      hs.forEach((h, k) => (next[k] ? (rh += h + gap) : (lh += h + gap)));
      setShortCol(Math.abs(lh - rh) > 100 ? (lh < rh ? 0 : 1) : -1);
      setPlacement((prev) => (prev && prev.join() === next.join() ? prev : next));
    },
    [rest.length, gap]
  );

  if (!desktop) return <>{items}</>;

  const colOf = (i: number) => (placement && placement.length === rest.length ? placement[i] : i < split ? 0 : 1);
  const wrap = (child: React.ReactNode, i: number) => (
    <View key={i} onLayout={(e) => measure(i, e.nativeEvent.layout.height)}>
      {child}
    </View>
  );
  const left = rest.map((c, i) => (colOf(i) === 0 ? wrap(c, i) : null)).filter(Boolean);
  const right = rest.map((c, i) => (colOf(i) === 1 ? wrap(c, i) : null)).filter(Boolean);

  const columns = (
    <View style={[styles.row, { gap: gap + 4 }]}>
      <View style={[styles.col, { gap }]}>
        {left}
        {shortCol === 0 && <ColumnTipCard />}
      </View>
      <View style={[styles.col, { gap }]}>
        {right}
        {shortCol === 1 && <ColumnTipCard />}
      </View>
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
  // Columns stretch to the same height so the tip card can fill the gap
  row: { flexDirection: 'row', alignItems: 'stretch' },
  col: { flex: 1, minWidth: 0 },
});
