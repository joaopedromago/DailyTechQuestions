import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checkbox } from '@/components/shared/checkbox';
import { Dropdown, type DropdownOption } from '@/components/shared/dropdown';
import { Input } from '@/components/shared/input';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/shared/button';
import { Text } from '@/components/ui/text';
import { getCategoryLabel } from '@/data/questions';
import { getQuestionCategories } from '@/features/questions/question-utils';
import { type QuestionCheckFilter } from '@/features/questions/question-check-utils';
import { useQuestionChecks } from '@/features/questions/question-checks';

import { createQuizQuestions, getQuestionsForCategories } from './quiz-utils';
import { useQuizSession } from './quiz-session';

function clampQuestionCount(value: number, maximum: number) {
  return Math.max(1, Math.min(Math.floor(value), maximum));
}

const CHECK_FILTER_OPTIONS: readonly DropdownOption<QuestionCheckFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Only checked', value: 'checked' },
  { label: 'Only unchecked', value: 'unchecked' },
];

export default function QuizSetupScreen() {
  const categories = useMemo(() => getQuestionCategories(), []);
  const initialMaximumQuestions = useMemo(
    () => getQuestionsForCategories(categories).length,
    [categories],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [questionCheckFilter, setQuestionCheckFilter] = useState<QuestionCheckFilter>('all');
  const [questionCountText, setQuestionCountText] = useState(String(initialMaximumQuestions));
  const [lastValidQuestionCount, setLastValidQuestionCount] = useState(initialMaximumQuestions);
  const [hasEditedQuestionCount, setHasEditedQuestionCount] = useState(false);
  const {
    isHydrated: areQuestionChecksHydrated,
    loadError: questionChecksLoadError,
    persistenceError: questionChecksPersistenceError,
    checkedQuestionKeySet,
  } = useQuestionChecks();
  const getMaximumForSelection = (
    nextCategories: readonly string[],
    checkFilter: QuestionCheckFilter = questionCheckFilter,
  ) =>
    getQuestionsForCategories(nextCategories, {
      checkFilter,
      checkedQuestionKeys: checkedQuestionKeySet,
    }).length;
  const maximumQuestions = getMaximumForSelection(selectedCategories);
  const { isHydrated, persistenceError, startSession } = useQuizSession();

  const updateQuestionCountForMaximum = (nextMaximum: number) => {
    if (nextMaximum === 0) {
      setQuestionCountText('');
      return;
    }

    const currentValue = !hasEditedQuestionCount
      ? nextMaximum
      : questionCountText.length === 0
        ? lastValidQuestionCount
        : Number.parseInt(questionCountText, 10);
    const clampedValue = clampQuestionCount(
      Number.isNaN(currentValue) ? 1 : currentValue,
      nextMaximum,
    );
    setQuestionCountText(String(clampedValue));
    setLastValidQuestionCount(clampedValue);
  };

  const updateCategories = (nextCategories: string[]) => {
    setSelectedCategories(nextCategories);
    updateQuestionCountForMaximum(getMaximumForSelection(nextCategories));
  };

  const toggleCategory = (category: string) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    updateCategories(nextCategories);
  };

  const bulkSelectionLabel =
    selectedCategories.length === 0
      ? 'Select all'
      : selectedCategories.length === categories.length
        ? 'Unselect all'
        : 'Select remaining';

  const toggleBulkSelection = () => {
    updateCategories(selectedCategories.length === categories.length ? [] : [...categories]);
  };

  const updateQuestionCheckFilter = (nextFilter: QuestionCheckFilter) => {
    setQuestionCheckFilter(nextFilter);
    updateQuestionCountForMaximum(getMaximumForSelection(selectedCategories, nextFilter));
  };

  const handleQuestionCountChange = (text: string) => {
    setHasEditedQuestionCount(true);
    if (text.length === 0) {
      setQuestionCountText('');
      return;
    }

    const digits = text.replace(/[^0-9]/g, '');
    const parsedValue = Number.parseInt(digits, 10);
    const clampedValue = clampQuestionCount(
      Number.isNaN(parsedValue) ? 1 : parsedValue,
      maximumQuestions,
    );
    setQuestionCountText(String(clampedValue));
    setLastValidQuestionCount(clampedValue);
  };

  const parsedQuestionCount = Number.parseInt(questionCountText, 10);
  const hasValidQuestionCount =
    maximumQuestions > 0 &&
    Number.isInteger(parsedQuestionCount) &&
    parsedQuestionCount >= 1 &&
    parsedQuestionCount <= maximumQuestions;

  const startQuiz = () => {
    if (
      !isHydrated ||
      !areQuestionChecksHydrated ||
      (questionChecksLoadError && questionCheckFilter !== 'all') ||
      selectedCategories.length === 0 ||
      !hasValidQuestionCount
    ) {
      return;
    }
    const selectionOptions = {
      checkFilter: questionCheckFilter,
      checkedQuestionKeys: checkedQuestionKeySet,
    };
    const quizQuestions = createQuizQuestions(
      selectedCategories,
      parsedQuestionCount,
      selectionOptions,
    );
    if (quizQuestions.length === 0) return;

    const quizId = startSession(selectedCategories, quizQuestions);
    router.replace(('/quiz/play?quizId=' + encodeURIComponent(quizId)) as Href);
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1 }}>
      <Box className="flex-1 bg-background">
        <ScrollView contentContainerClassName="gap-5 px-5 py-6">
          <Box className="gap-3">
            <Button
              accessibilityLabel="Back to menu"
              className="self-start"
              size="sm"
              variant="ghost"
              onPress={() => router.back()}
            >
              <ButtonText>Back to menu</ButtonText>
            </Button>
            <Text role="heading" className="text-2xl font-bold text-foreground">
              Start Random Quiz
            </Text>
            <Text className="text-base text-muted-foreground">
              Choose one or more categories and set the maximum number of questions for this quiz.
            </Text>
          </Box>

          <Box className="gap-2">
            <Box className="flex-row items-center justify-between gap-3">
              <Text className="font-semibold text-foreground">Categories</Text>
              <Button
                accessibilityLabel={bulkSelectionLabel}
                size="sm"
                variant="outline"
                onPress={toggleBulkSelection}
              >
                <ButtonText>{bulkSelectionLabel}</ButtonText>
              </Button>
            </Box>
            {categories.map((category) => (
              <Checkbox
                key={category}
                checked={selectedCategories.includes(category)}
                className="w-full justify-start"
                label={getCategoryLabel(category)}
                onChange={() => toggleCategory(category)}
              />
            ))}
          </Box>

          <Dropdown
            isDisabled={!areQuestionChecksHydrated || questionChecksLoadError}
            label="Question status"
            options={CHECK_FILTER_OPTIONS}
            testID="question-check-filter"
            value={questionCheckFilter}
            onValueChange={updateQuestionCheckFilter}
          />

          <Box className="gap-2">
            <Text className="font-semibold text-foreground">Max questions</Text>
            <Input
              accessibilityLabel="Max questions"
              accessibilityState={{ disabled: maximumQuestions === 0 }}
              className={maximumQuestions === 0 ? 'opacity-50' : undefined}
              editable={maximumQuestions > 0}
              keyboardType="number-pad"
              value={questionCountText}
              onBlur={() => {
                if (maximumQuestions > 0 && questionCountText.length === 0) {
                  const fallback = lastValidQuestionCount ?? 1;
                  const clampedValue = clampQuestionCount(fallback, maximumQuestions);
                  setQuestionCountText(String(clampedValue));
                  setLastValidQuestionCount(clampedValue);
                  setHasEditedQuestionCount(true);
                }
              }}
              onChangeText={handleQuestionCountChange}
            />
            <Text className="text-sm text-muted-foreground">
              Maximum: {maximumQuestions} questions across selected categories.
            </Text>
          </Box>

          {maximumQuestions === 0 && selectedCategories.length > 0 ? (
            <Text className="text-sm text-muted-foreground">
              No questions match the selected categories and question status.
            </Text>
          ) : null}
          {selectedCategories.length === 0 ? (
            <Text className="text-sm text-destructive">Select at least one category to start.</Text>
          ) : null}
          {questionChecksLoadError ? (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              Saved question check status could not be loaded. Question status filtering is
              unavailable.
            </Text>
          ) : questionChecksPersistenceError ? (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              Question check status could not be saved.
            </Text>
          ) : null}
          {persistenceError ? (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              Quiz history could not be saved.
            </Text>
          ) : null}

          <Button
            accessibilityLabel="Start quiz"
            isDisabled={
              !isHydrated ||
              !areQuestionChecksHydrated ||
              (questionChecksLoadError && questionCheckFilter !== 'all') ||
              selectedCategories.length === 0 ||
              !hasValidQuestionCount
            }
            onPress={startQuiz}
          >
            <ButtonText>
              {isHydrated && areQuestionChecksHydrated ? 'Start Quiz' : 'Loading…'}
            </ButtonText>
          </Button>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
