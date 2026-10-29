import { Host, Picker } from '@expo/ui';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

export type DropdownOption<Value extends string = string> = {
  label: string;
  value: Value;
};

type DropdownProps<Value extends string> = {
  label: string;
  value: Value;
  options: readonly DropdownOption<Value>[];
  onValueChange: (value: Value) => void;
  isDisabled?: boolean;
  testID?: string;
};

export function Dropdown<Value extends string>({
  label,
  value,
  options,
  onValueChange,
  isDisabled = false,
  testID,
}: DropdownProps<Value>) {
  return (
    <Box className="gap-2">
      <Text className="font-semibold text-foreground">{label}</Text>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <Picker
          enabled={!isDisabled}
          selectedValue={value}
          testID={testID}
          onValueChange={onValueChange}
        >
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </Host>
    </Box>
  );
}
