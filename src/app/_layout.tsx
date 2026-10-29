import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { QuizSessionProvider } from '@/features/quiz/quiz-session';

import '@/global.css';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigationTheme =
    Platform.OS !== 'web' && colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={navigationTheme}>
      <GluestackUIProvider mode="system">
        <SafeAreaProvider>
          <QuizSessionProvider>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="questions" />
              <Stack.Screen name="questions/[questionIndex]" />
              <Stack.Screen name="quiz/setup" />
              <Stack.Screen name="quiz/history" />
              <Stack.Screen name="quiz/play" />
            </Stack>
          </QuizSessionProvider>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </ThemeProvider>
  );
}
