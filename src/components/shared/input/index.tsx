import React from 'react';
import { Platform, TextInput, useColorScheme, type TextInputProps } from 'react-native';

import { getColorTokenHex } from '@/theme/color-tokens';

type InputProps = TextInputProps & { className?: string };

export const Input = React.forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(
  function Input({ className, ...props }, ref) {
    const colorScheme = useColorScheme();
    const placeholderTextColor =
      Platform.OS === 'web'
        ? undefined
        : getColorTokenHex(colorScheme === 'dark' ? 'dark' : 'light', '--muted-foreground');

    return (
      <TextInput
        ref={ref}
        className={`min-h-11 rounded-md border border-border bg-background px-3 text-base text-foreground ${className ?? ''}`}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
    );
  },
);
