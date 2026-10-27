import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Platform, useColorScheme } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';

type CheckboxProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
  className?: string;
};

export function Checkbox({ checked, label, onChange, className }: CheckboxProps) {
  const colorScheme = useColorScheme();
  const explicitWebTheme =
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? document.documentElement.dataset.theme
      : undefined;
  const isDark = explicitWebTheme ? explicitWebTheme === 'dark' : colorScheme === 'dark';

  return (
    <Button
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={className}
      size="sm"
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
