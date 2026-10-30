import { ExternalLink } from '@/components/external-link';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/shared/button';
import { JavaScriptCodeBlock } from '@/components/shared/javascript-code-block';
import { Text } from '@/components/ui/text';
import {
  getCategoryLabel,
  getQuestionPrompt,
  isJavascriptCodeQuestion,
  type Question,
} from '@/data/questions';
import { useQuestionChecks } from '@/features/questions/question-checks';

import * as Clipboard from 'expo-clipboard';
import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  ScrollView,
  useColorScheme,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';

type QuestionDetailViewProps = {
  question: Question;
  disclosureKey: string | number;
  mode: 'browse' | 'quiz';
  positionLabel?: string;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isLastQuestion?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onReturn: () => void;
};

export function isHorizontalSwipe(dx: number, dy: number) {
  return Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.25;
}

export function handleQuestionSwipe(
  dx: number,
  dy: number,
  actions: { onPrevious?: () => void; onNext?: () => void; onReturn: () => void },
) {
  if (!isHorizontalSwipe(dx, dy) || Math.abs(dx) < 60) return;
  if (dx < 0) actions.onNext?.();
  else if (actions.onPrevious) actions.onPrevious();
  else actions.onReturn();
}

export function QuestionDetailView({
  question,
  disclosureKey,
  mode,
  positionLabel,
  canGoPrevious = false,
  canGoNext = false,
  isLastQuestion = false,
  onPrevious,
  onNext,
  onFinish,
  onReturn,
}: QuestionDetailViewProps) {
  const [revealState, setRevealState] = useState({
    disclosureKey,
    shortAnswerVisible: false,
    fullAnswerVisible: false,
  });
  const disclosureMatches = Object.is(revealState.disclosureKey, disclosureKey);
  const shortAnswerVisible = disclosureMatches && revealState.shortAnswerVisible;
  const fullAnswerVisible = disclosureMatches && revealState.fullAnswerVisible;
  const colorScheme = useColorScheme();
  const disclosureIconColor = colorScheme === 'dark' ? '#000000' : '#ffffff';
  const webColorScheme =
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? document.documentElement.dataset.theme
      : undefined;
  const effectiveColorScheme =
    webColorScheme === 'light' || webColorScheme === 'dark' ? webColorScheme : colorScheme;
  const questionActionIconColor = effectiveColorScheme === 'dark' ? '#ffffff' : '#000000';
  const {
    isHydrated: areQuestionChecksHydrated,
    loadError: questionChecksLoadError,
    persistenceError: questionChecksPersistenceError,
    isQuestionChecked,
    toggleQuestion,
  } = useQuestionChecks();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isCodeQuestion = isJavascriptCodeQuestion(question);
  const questionIsChecked = isQuestionChecked(question);
  const canToggleQuestionCheck = areQuestionChecksHydrated && !questionChecksLoadError;
  const [copyFailure, setCopyFailure] = useState<{ disclosureKey: string | number } | null>(null);
  const copyFailed = copyFailure !== null && Object.is(copyFailure.disclosureKey, disclosureKey);

  const toggleAnswer = () => {
    setRevealState(
      shortAnswerVisible
        ? { disclosureKey, shortAnswerVisible: false, fullAnswerVisible: false }
        : { disclosureKey, shortAnswerVisible: true, fullAnswerVisible: false },
    );
  };

  const copyQuestion = async () => {
    try {
      const didCopy = await Clipboard.setStringAsync(question.question);
      setCopyFailure(didCopy ? null : { disclosureKey });
    } catch {
      setCopyFailure({ disclosureKey });
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => isHorizontalSwipe(gesture.dx, gesture.dy),
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          isHorizontalSwipe(gesture.dx, gesture.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_event, gesture) => {
          handleQuestionSwipe(gesture.dx, gesture.dy, { onPrevious, onNext, onReturn });
        },
      }),
    [onNext, onPrevious, onReturn],
  );
  const swipeHandlers =
    Platform.OS === 'web'
      ? {
          onTouchStart: (event: GestureResponderEvent) => {
            const touch = event.nativeEvent.changedTouches[0] ?? event.nativeEvent;
            touchStart.current = { x: touch.pageX, y: touch.pageY };
          },
          onTouchEnd: (event: GestureResponderEvent) => {
            const start = touchStart.current;
            const touch = event.nativeEvent.changedTouches[0] ?? event.nativeEvent;
            touchStart.current = null;
            if (start) {
              handleQuestionSwipe(touch.pageX - start.x, touch.pageY - start.y, {
                onPrevious,
                onNext,
                onReturn,
              });
            }
          },
        }
      : panResponder.panHandlers;

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1 }}>
      <Box className="flex-1 bg-background" {...swipeHandlers}>
        <ScrollView contentContainerClassName="gap-5 px-5 py-6">
          <Box className="gap-3">
            <Button
              accessibilityLabel={mode === 'browse' ? 'Return to list' : 'Return to menu'}
              className="self-start"
              size="sm"
              variant="ghost"
              onPress={onReturn}
            >
              <ButtonText>{mode === 'browse' ? 'Return to list' : 'Return to menu'}</ButtonText>
            </Button>
            {positionLabel ? (
              mode === 'quiz' ? (
                <Box className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-sm text-muted-foreground">{positionLabel}</Text>
                  <Button
                    accessibilityLabel={
                      !areQuestionChecksHydrated
                        ? 'Loading question check status'
                        : questionChecksLoadError
                          ? 'Question check status unavailable'
                          : questionIsChecked
                            ? 'Mark question unchecked'
                            : 'Mark question checked'
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={
                      canToggleQuestionCheck ? { checked: questionIsChecked } : { disabled: true }
                    }
                    className="shrink-0"
                    isDisabled={!canToggleQuestionCheck}
                    size="icon"
                    testID="question-check-toggle"
                    variant="ghost"
                    onPress={() => toggleQuestion(question)}
                  >
                    <MaterialIcons
                      accessible={false}
                      color={questionActionIconColor}
                      name={
                        !areQuestionChecksHydrated
                          ? 'hourglass-empty'
                          : questionChecksLoadError
                            ? 'error-outline'
                            : questionIsChecked
                              ? 'check-box'
                              : 'check-box-outline-blank'
                      }
                      size={20}
                      testID="question-check-icon"
                    />
                  </Button>
                </Box>
              ) : (
                <Text className="text-sm text-muted-foreground">{positionLabel}</Text>
              )
            ) : null}
            {mode === 'quiz' && questionChecksPersistenceError ? (
              <Text accessibilityRole="alert" className="text-sm text-destructive">
                {questionChecksLoadError
                  ? 'Saved question check status could not be loaded.'
                  : 'Question check status could not be saved.'}
              </Text>
            ) : null}
            <Text className="text-sm font-medium text-muted-foreground">
              {getCategoryLabel(question.category)}
            </Text>
            <Box className="flex-row items-start gap-2">
              <Text
                role="heading"
                className="flex-1 text-2xl font-bold leading-tight text-foreground"
              >
                {getQuestionPrompt(question)}
              </Text>
              <Button
                accessibilityLabel={
                  copyFailed
                    ? isCodeQuestion
                      ? 'Could not copy code'
                      : 'Could not copy question'
                    : isCodeQuestion
                      ? 'Copy code'
                      : 'Copy question'
                }
                accessibilityHint={
                  copyFailed
                    ? 'Clipboard access failed. Try selecting and copying the text manually.'
                    : 'Copies this text to the clipboard.'
                }
                className="shrink-0"
                size="icon"
                variant="ghost"
                onPress={copyQuestion}
              >
                <MaterialIcons
                  accessible={false}
                  color={questionActionIconColor}
                  name={copyFailed ? 'error-outline' : 'content-copy'}
                  size={18}
                />
              </Button>
            </Box>
            {isCodeQuestion ? (
              <JavaScriptCodeBlock code={question.question} colorScheme={effectiveColorScheme} />
            ) : null}
          </Box>

          <Button
            accessibilityLabel={shortAnswerVisible ? 'Hide answer' : 'See answer'}
            accessibilityState={{ expanded: shortAnswerVisible }}
            className="self-start"
            onPress={toggleAnswer}
          >
            <MaterialIcons
              accessible={false}
              color={disclosureIconColor}
              name={shortAnswerVisible ? 'expand-less' : 'expand-more'}
              size={20}
              testID="answer-disclosure-icon"
            />
            <ButtonText>{shortAnswerVisible ? 'Hide answer' : 'See answer'}</ButtonText>
          </Button>

          {shortAnswerVisible ? (
            <Box className="gap-3 rounded-lg border border-border bg-card p-4">
              <Text className="text-sm font-medium text-muted-foreground">
                Category: {getCategoryLabel(question.category)}
              </Text>
              <Text className="text-lg font-semibold text-foreground">Quick answer</Text>
              <Text className="text-base leading-6 text-foreground">{question.shortAnswer}</Text>
              {!fullAnswerVisible ? (
                <Button
                  accessibilityLabel="See full answer"
                  className="self-start"
                  variant="outline"
                  onPress={() =>
                    setRevealState({
                      disclosureKey,
                      shortAnswerVisible: true,
                      fullAnswerVisible: true,
                    })
                  }
                >
                  <ButtonText>See full answer</ButtonText>
                </Button>
              ) : (
                <Box className="gap-3 border-t border-border pt-3">
                  <Text className="text-lg font-semibold text-foreground">Full answer</Text>
                  <Text className="text-base leading-6 text-foreground">{question.longAnswer}</Text>
                  {question.referenceUrls.length > 0 ? (
                    <Box className="gap-2">
                      <Text className="font-semibold text-foreground">References</Text>
                      {question.referenceUrls.map((url) => (
                        <ExternalLink key={url} href={url as Href & string}>
                          <Text className="text-primary underline">{url}</Text>
                        </ExternalLink>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              )}
            </Box>
          ) : null}

          {mode === 'quiz' ? (
            <Box className="gap-3">
              <Box className="flex-row justify-between gap-3">
                <Button
                  accessibilityLabel="Previous question"
                  className="flex-1"
                  isDisabled={!canGoPrevious}
                  variant="outline"
                  onPress={onPrevious}
                >
                  <ButtonText>Previous</ButtonText>
                </Button>
                <Button
                  accessibilityLabel="Next question"
                  className="flex-1"
                  isDisabled={!canGoNext}
                  variant="outline"
                  onPress={onNext}
                >
                  <ButtonText>Next</ButtonText>
                </Button>
              </Box>
              {fullAnswerVisible ? (
                <Button
                  accessibilityLabel={isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                  onPress={isLastQuestion ? onFinish : onNext}
                >
                  <ButtonText>{isLastQuestion ? 'Finish Quiz' : 'Next Question'}</ButtonText>
                </Button>
              ) : null}
            </Box>
          ) : null}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
