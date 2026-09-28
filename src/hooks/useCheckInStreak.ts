import { useCallback, useSyncExternalStore } from 'react';
import { checkInToday, getCheckInStreak, subscribeToCheckIns, type Persona } from '../data';

// Shared check-in state for any screen (Home, Quests…).
export function useCheckInStreak(persona: Persona) {
  const streak = useSyncExternalStore(
    subscribeToCheckIns,
    () => getCheckInStreak(persona),
    () => getCheckInStreak(persona),
  );
  const checkIn = useCallback(() => checkInToday(persona), [persona]);
  return { streak, checkIn };
}
