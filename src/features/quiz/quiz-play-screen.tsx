import { router, useLocalSearchParams, usePreventRemove, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/shared/button';
import { Text } from '@/components/ui/text';
import { QuestionDetailView } from '@/features/questions/question-detail-view';

import { useQuizSession } from './quiz-session';

export default function QuizPlayScreen() {
  const { quizId, completed } = useLocalSearchParams<{ quizId?: string; completed?: string }>();
  const {
    isHydrated,
    persistenceError,
    history,
    session: latestSession,
    setPosition,
    completeSession,
  } = useQuizSession();
  const session = quizId ? (history.find((item) => item.id === quizId) ?? null) : latestSession;
  const sessionId = session?.id;
  const [isReturning, setIsReturning] = useState(false);
  const isComplete = completed === 'true';
  const currentPosition = session?.currentPosition ?? 0;
  const preventRemove =
    Platform.OS === 'ios' && !isComplete && !isReturning && Boolean(session) && currentPosition > 0;
  const disableRemovalPrevention = usePreventRemove(preventRemove, () => {
    if (sessionId && currentPosition > 0) setPosition(sessionId, currentPosition - 1);
  });

  const returnToMenu = () => {
    if (preventRemove) {
      setIsReturning(true);
      disableRemovalPrevention();
    }
    router.replace('/');
  };

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isComplete) {
        router.replace('/');
        return true;
      }
      if (!session) {
        router.replace('/');
        return true;
      }
      if (currentPosition > 0) {
        setPosition(session.id, currentPosition - 1);
        return true;
      }

      router.replace('/');
      return true;
    });

    return () => subscription.remove();
  }, [currentPosition, isComplete, session, setPosition]);

  if (!isHydrated) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6" style={{ flex: 1 }}>
        <Text className="text-base text-muted-foreground">Loading quiz…</Text>
      </Box>
    );
  }

  if (isComplete) {
    return (
      <Box className="flex-1 justify-center gap-5 bg-background px-6" style={{ flex: 1 }}>
        <Text role="heading" className="text-3xl font-bold text-foreground">
          Quiz complete
        </Text>
        <Text className="text-base text-muted-foreground">
          You have reached the end of this quiz.
        </Text>
        {persistenceError ? (
          <Text accessibilityRole="alert" className="text-sm text-destructive">
            Completed quiz history could not be saved.
          </Text>
        ) : null}
        <Button accessibilityLabel="Return to menu" onPress={returnToMenu}>
          <ButtonText>Return to menu</ButtonText>
        </Button>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box className="flex-1 justify-center gap-5 bg-background px-6" style={{ flex: 1 }}>
        <Text role="heading" className="text-2xl font-bold text-foreground">
          {quizId ? 'Quiz not found' : 'No quiz to continue'}
        </Text>
        <Button onPress={() => router.replace((quizId ? '/quiz/history' : '/') as Href)}>
          <ButtonText>{quizId ? 'Return to history' : 'Return to menu'}</ButtonText>
        </Button>
      </Box>
    );
  }

  const question = session.questions[currentPosition];
  const isLastQuestion = currentPosition === session.questions.length - 1;

  return (
    <>
      {persistenceError ? (
        <Box className="bg-background px-5 pt-2">
          <Text accessibilityRole="alert" className="text-sm text-destructive">
            Quiz progress is available in this session but could not be saved.
          </Text>
        </Box>
      ) : null}
      <QuestionDetailView
        key={session.id + '-' + currentPosition}
        canGoNext={!isLastQuestion}
        canGoPrevious={currentPosition > 0}
        disclosureKey={session.id + '-' + currentPosition}
        isLastQuestion={isLastQuestion}
        mode="quiz"
        positionLabel={'Question ' + (currentPosition + 1) + ' of ' + session.questions.length}
        question={question}
        onFinish={() => {
          completeSession(session.id);
          router.setParams({ completed: 'true' });
        }}
        onNext={() => {
          if (!isLastQuestion) setPosition(session.id, currentPosition + 1);
        }}
        onPrevious={() => {
          if (currentPosition > 0) setPosition(session.id, currentPosition - 1);
          else router.replace('/');
        }}
        onReturn={returnToMenu}
      />
    </>
  );
}
