import { router } from 'expo-router';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  const systemColorScheme = useColorScheme();
  const [webColorScheme, setWebColorScheme] = useState<'light' | 'dark' | null>(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

    const selectedScheme = document.documentElement.dataset.theme;
    return selectedScheme === 'light' || selectedScheme === 'dark' ? selectedScheme : null;
  });
  const isDark =
    (Platform.OS === 'web' ? (webColorScheme ?? systemColorScheme) : systemColorScheme) === 'dark';
  const targetColorScheme = isDark ? 'light' : 'dark';

  return (
    <SafeAreaView className="flex-1">
      <Box className="flex-1 justify-center bg-background px-6 py-8">
        <Box className="mx-auto w-full max-w-xl gap-8">
          <Box className="gap-2">
            <Text role="heading" className="text-3xl font-bold leading-tight text-foreground">
              Interview practice
            </Text>
            <Text className="text-base text-muted-foreground">Choose how you want to study.</Text>
          </Box>

          <Button
            accessibilityLabel={`Switch to ${targetColorScheme} mode`}
            className="self-start"
            size="sm"
            variant="outline"
            onPress={() => {
              if (Platform.OS === 'web') {
                document.documentElement.dataset.theme = targetColorScheme;
                setWebColorScheme(targetColorScheme);
              } else {
                Appearance.setColorScheme(targetColorScheme);
              }
            }}
          >
            <MaterialIcons
              color={isDark ? '#ffffff' : '#000000'}
              name={isDark ? 'light-mode' : 'dark-mode'}
              size={18}
            />
            <ButtonText className="font-medium">
              Switch to {targetColorScheme === 'dark' ? 'Dark' : 'Light'} mode
            </ButtonText>
          </Button>

          <Box className="gap-3">
            <Button
              accessibilityLabel="Start Random Quiz"
              className="w-full"
              size="lg"
              onPress={() => router.push('/quiz/setup')}
            >
              <ButtonText>Start Random Quiz</ButtonText>
            </Button>

            <Button
              accessibilityLabel="View Questions"
              className="w-full"
              size="lg"
              variant="secondary"
              onPress={() => router.push('/questions')}
            >
              <ButtonText>View Questions</ButtonText>
            </Button>

            <Button
              accessibilityLabel="Continue"
              className="w-full"
              isDisabled
              size="lg"
              variant="outline"
            >
              <ButtonText>Continue</ButtonText>
            </Button>
          </Box>
        </Box>
      </Box>
    </SafeAreaView>
  );
}
