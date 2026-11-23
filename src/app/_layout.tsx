import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { DailyReminderNavigation, DailyStudyProvider } from '@/features/daily/daily-study';
import { QuestionChecksProvider } from '@/features/questions/question-checks';
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
            <QuestionChecksProvider>
              <DailyStudyProvider>
                <AnimatedSplashOverlay />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="daily/index" />
                  <Stack.Screen name="daily/play" />
                  <Stack.Screen name="questions" />
                  <Stack.Screen name="questions/[questionIndex]" />
                  <Stack.Screen name="quiz/setup" />
                  <Stack.Screen name="quiz/history" />
                  <Stack.Screen name="quiz/play" />
                </Stack>
                <DailyReminderNavigation />
              </DailyStudyProvider>
            </QuestionChecksProvider>
          </QuizSessionProvider>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </ThemeProvider>
  );
}
