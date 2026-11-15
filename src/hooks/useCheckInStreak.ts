import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { checkInAndSync, refreshStreakIfStale } from '../api/streak';
import { getCheckInStreak, subscribeToCheckIns, type Persona } from '../data';

// Shared check-in state for any screen (Home, Quests…).
export function useCheckInStreak(persona: Persona) {
  const streak = useSyncExternalStore(
    subscribeToCheckIns,
    () => getCheckInStreak(persona),
    () => getCheckInStreak(persona),
  );
  // The real streak loads when a signed-in creator opens a screen with the card (at most once a minute)
  useEffect(() => {
    void refreshStreakIfStale();
  }, []);
  const checkIn = useCallback(() => checkInAndSync(persona), [persona]);
  return { streak, checkIn };
}
