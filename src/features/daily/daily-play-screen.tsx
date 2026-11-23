import { router } from 'expo-router';
import { useState } from 'react';

import { Button, ButtonText } from '@/components/shared/button';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { QuestionDetailView } from '@/features/questions/question-detail-view';

import { getDailySession } from './daily-challenge';
import { useDailyStudy } from './daily-study';

export default function DailyPlayScreen() {
  const { data, today, loading, loadError, saveError, busy, reminderStatus, review } =
    useDailyStudy();
  const session = getDailySession(data, today);
  const completed = data.completedDays.includes(today);
  const [openedOn] = useState(today);
  const goBack = () => router.dismissTo('/daily');

  if (loading || !session || completed || openedOn !== today) {
    const heading = loading
      ? 'Loading daily progress…'
      : loadError
        ? 'Daily progress unavailable'
        : openedOn !== today
          ? 'A new challenge is ready'
          : completed
            ? 'Completed today'
            : 'Start today’s challenge';

    return (
      <Box className="flex-1 justify-center gap-4 bg-background px-6" style={{ flex: 1 }}>
        <Text role="heading" className="text-3xl font-bold text-foreground">
          {heading}
        </Text>
        {completed && openedOn === today ? (
          <Text className="text-muted-foreground">{data.completedDays.length + '-day streak'}</Text>
        ) : null}
        {completed && reminderStatus === 'error' ? (
          <Text role="alert" className="text-sm text-destructive">
            Study reminders could not be updated. You can retry from the challenge overview.
          </Text>
        ) : null}
        {!loading ? (
          <Button onPress={goBack}>
            <ButtonText>Back to challenge</ButtonText>
          </Button>
        ) : null}
      </Box>
    );
  }

  const position = session.reviewedCount;
  const questionCount = session.questions.length;
  const advance = () => void review(session.day, position);
  const questionKey = session.day + '-' + position;

  return (
    <QuestionDetailView
      key={questionKey}
      disclosureKey={questionKey}
      mode="daily"
      positionLabel={'Question ' + (position + 1) + ' of ' + questionCount}
      question={session.questions[position]}
      isAdvancing={busy}
      isLastQuestion={position === questionCount - 1}
      progressSaveError={saveError}
      onNext={advance}
      onFinish={advance}
      onReturn={goBack}
    />
  );
}
