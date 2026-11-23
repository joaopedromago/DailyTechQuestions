import { router } from 'expo-router';

import { Button, ButtonText } from '@/components/shared/button';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

import { getDailySession } from './daily-challenge';
import { useDailyStudy } from './daily-study';

export function DailyChallengeCard() {
  const { data, today, loading, loadError } = useDailyStudy();
  const streak = data.completedDays.length;
  const completed = data.completedDays.includes(today);
  const session = getDailySession(data, today);
  const reviewed = session?.reviewedCount ?? 0;
  const questionCount = session?.questions.length ?? data.settings.questionCount;

  return (
    <Box className="gap-3 rounded-2xl border border-border bg-card p-4">
      <Box className="flex-row flex-wrap items-center justify-between gap-2">
        <Text role="heading" className="text-lg font-bold text-foreground">
          Daily Challenge
        </Text>
        {!loading && !loadError ? (
          <Text className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            {streak + '-day streak'}
          </Text>
        ) : null}
      </Box>
      <Text className="text-sm text-muted-foreground">
        {loading
          ? 'Loading daily progress…'
          : loadError
            ? 'Daily progress is unavailable.'
            : completed
              ? 'Completed today'
              : reviewed + ' of ' + questionCount + ' questions reviewed today'}
      </Text>
      <Button size="sm" variant="outline" onPress={() => router.push('/daily')}>
        <ButtonText>Open daily challenge</ButtonText>
      </Button>
    </Box>
  );
}
