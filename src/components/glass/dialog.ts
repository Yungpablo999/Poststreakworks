import { StyleSheet } from 'react-native';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Pop-ups are bottom sheets on phones and tablets. On desktop they become
// centred windows: rounded on every corner, no drag handle, and they fade
// and rise in a little (no slide from the bottom of a big screen, no bounce).

export function useDialogMode(): boolean {
  return useBreakpoint() === 'desktop';
}

export const dialogStyles = StyleSheet.create({
  root: { justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  sheet: { borderRadius: 28, borderBottomWidth: 1, paddingBottom: 18 },
  round: { borderRadius: 28 },
  hidden: { display: 'none' },
});
