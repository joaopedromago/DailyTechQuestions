import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/shared/button';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

import { DAILY_QUESTION_COUNT, getDailySession } from './daily-challenge';
import { useDailyStudy } from './daily-study';
import { StreakCalendar } from './streak-calendar';

export default function DailyOverviewScreen() {
  const {
    data,
    today,
    busy,
    loading,
    loadError,
    saveError,
    reload,
    start,
    reminderStatus,
    setReminders,
  } = useDailyStudy();
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, []),
  );
  const session = getDailySession(data, today);
  const completed = data.completedDays.includes(today);
  const reviewed = completed ? DAILY_QUESTION_COUNT : (session?.reviewedCount ?? 0);
  const statusMessage = {
    ready: null,
    blocked: 'Allow study notifications in your device settings to receive reminders.',
    error: 'Study reminders could not be updated. Tap retry to try again.',
  }[reminderStatus];

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <ScrollView contentContainerClassName="px-5 py-6">
        <Box className="mx-auto w-full max-w-xl gap-5">
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onPress={() => router.dismissTo('/')}
          >
            <ButtonText>Return to menu</ButtonText>
          </Button>
          <Text role="heading" className="text-3xl font-bold text-foreground">
            Daily Challenge
          </Text>
          {loading || loadError ? (
            <Box className="gap-3">
              <Text role={loadError ? 'alert' : undefined} className="text-muted-foreground">
                {loading ? 'Loading daily progress…' : 'Saved daily progress could not be loaded.'}
              </Text>
              {loadError ? (
                <Button onPress={reload}>
                  <ButtonText>Retry</ButtonText>
                </Button>
              ) : null}
            </Box>
          ) : (
            <>
              <Box className="gap-1">
                <Text className="text-2xl font-bold text-foreground">
                  {data.completedDays.length + '-day streak'}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Missed days freeze your streak.
                </Text>
              </Box>
              <Box className="gap-3 rounded-2xl border border-border bg-card p-4">
                <Box className="flex-row flex-wrap items-center justify-between gap-2">
                  <Text className="text-base font-bold text-foreground">
                    {completed ? 'Completed today' : 'Today’s challenge'}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {reviewed + ' of ' + DAILY_QUESTION_COUNT + ' reviewed'}
                  </Text>
                </Box>
                <Box className="flex-row gap-1.5" aria-hidden>
                  {Array.from({ length: DAILY_QUESTION_COUNT }, (_, position) => (
                    <Box
                      key={position}
                      className={
                        'h-1.5 flex-1 rounded-full ' +
                        (position < reviewed ? 'bg-primary' : 'bg-secondary')
                      }
                    />
                  ))}
                </Box>
                {!completed ? (
                  <Button
                    isDisabled={busy}
                    onPress={async () => {
                      if ((await start(today)) && focused.current) router.push('/daily/play');
                    }}
                  >
                    <ButtonText>{session ? 'Continue' : 'Start'}</ButtonText>
                  </Button>
                ) : null}
                {saveError ? (
                  <Text role="alert" className="text-sm text-destructive">
                    Your change could not be saved. Try again.
                  </Text>
                ) : null}
              </Box>
              <StreakCalendar today={today} completedDays={data.completedDays} />
              {Platform.OS !== 'web' ? (
                <Box className="gap-2">
                  <Button
                    variant="outline"
                    accessibilityLabel="10 p.m. study reminder"
                    role="switch"
                    accessibilityState={{ checked: data.remindersEnabled }}
                    isDisabled={busy}
                    onPress={() => void setReminders(!data.remindersEnabled)}
                  >
                    <ButtonText>
                      10 p.m. study reminder · {data.remindersEnabled ? 'On' : 'Off'}
                    </ButtonText>
                  </Button>
                  {statusMessage ? (
                    <Text role="alert" className="text-sm text-muted-foreground">
                      {statusMessage}
                    </Text>
                  ) : null}
                  {reminderStatus === 'error' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      isDisabled={busy}
                      onPress={() => void setReminders(data.remindersEnabled)}
                    >
                      <ButtonText>Retry reminders</ButtonText>
                    </Button>
                  ) : null}
                </Box>
              ) : null}
            </>
          )}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
