import { useSyncExternalStore } from 'react';

// A one-line message for the creator ("Couldn't save that…"), shown by App.tsx as
// the app's frosted toast. Backend problems are reported here instead of crashing
// or being swallowed.

let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => message;

export function notify(text: string, ms = 3800): void {
  message = text;
  listeners.forEach((l) => l());
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    message = null;
    listeners.forEach((l) => l());
  }, ms);
}

export function useNotice(): string | null {
  return useSyncExternalStore(subscribe, get, get);
}
