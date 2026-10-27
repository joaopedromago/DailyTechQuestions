import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
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
