import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Platform, useColorScheme, type KeyDownEvent } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';

type CheckboxProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
  className?: string;
  disabled?: boolean;
};

export function Checkbox({ checked, label, onChange, className, disabled }: CheckboxProps) {
  const colorScheme = useColorScheme();
  const explicitWebTheme =
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? document.documentElement.dataset.theme
      : undefined;
  const isDark = explicitWebTheme ? explicitWebTheme === 'dark' : colorScheme === 'dark';
  const webKeyboardProps =
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: KeyDownEvent) => {
            // React Native Web's Pressable handles Space only for button roles.
            if (event.nativeEvent.key !== ' ') return;
            event.preventDefault();
            if (!disabled && !event.nativeEvent.repeat) onChange();
          },
        }
      : undefined;

  return (
    <Button
      {...webKeyboardProps}
      accessibilityLabel={label}
      role="checkbox"
      aria-checked={checked}
      className={className}
      size="sm"
      isDisabled={disabled}
      variant={checked ? 'secondary' : 'outline'}
      onPress={onChange}
    >
      <MaterialIcons
        color={isDark ? '#ffffff' : '#1f2937'}
        name={checked ? 'check-box' : 'check-box-outline-blank'}
        size={18}
      />
      <ButtonText>{label}</ButtonText>
    </Button>
  );
}
