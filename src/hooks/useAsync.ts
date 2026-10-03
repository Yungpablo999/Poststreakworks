import { useCallback, useEffect, useRef, useState } from 'react';

// Loads something from the server when a screen opens (and when its inputs change), and says
// whether it is still loading or failed, so a screen can show a real loading or "couldn't load" state
// instead of pretending. `load` returns null on failure.

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  failed: boolean;
  reload: () => void;
}

export function useAsync<T>(load: () => Promise<T | null>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; failed: boolean }>({ data: null, loading: true, failed: false });
  const [tick, setTick] = useState(0);
  const latest = useRef(load);
  latest.current = load;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, failed: false }));
    void latest.current().then((data) => {
      if (!alive) return;
      setState({ data, loading: false, failed: data === null });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
