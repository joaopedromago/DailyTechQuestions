import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

/** Keep server and hydration renders deterministic, then subscribe to the system preference. */
function subscribe(callback: () => void) {
  const subscription = Appearance.addChangeListener(callback);
  return () => subscription.remove();
}

function getServerSnapshot() {
  return 'light' as const;
}

export function useColorScheme() {
  return useSyncExternalStore(subscribe, Appearance.getColorScheme, getServerSnapshot);
}
