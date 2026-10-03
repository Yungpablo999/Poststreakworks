import { useSyncExternalStore } from 'react';

// The smallest possible shared store: one value, anyone can read it, hooks re-render
// when it changes. Server-backed lists (notifications, quests, posts…) are kept in
// these so a screen never owns data that another screen also shows.

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  /** Hook: the current value, re-rendering when it changes. */
  use: () => T;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const get = () => value;
  return {
    get,
    set: (next) => {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe,
    use: () => useSyncExternalStore(subscribe, get, get),
  };
}
