import React, { useEffect } from 'react';
import { Appearance, type ViewProps, View, useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';

import { colorTokens } from '@/theme/color-tokens';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  mode = 'system',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const systemColorScheme = useColorScheme();
  const colorScheme = mode === 'system' ? systemColorScheme : mode;
  const themeVariables = vars(colorTokens[colorScheme === 'dark' ? 'dark' : 'light']);

  useEffect(() => {
    if (mode !== 'system') {
      Appearance.setColorScheme(mode);
    }
  }, [mode]);

  return (
    <View
      className="will-change-variable"
      style={[{ flex: 1, height: '100%', width: '100%' }, themeVariables, props.style]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
