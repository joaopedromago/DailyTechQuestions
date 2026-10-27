import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checkbox } from '@/components/shared/checkbox';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/shared/button';
import { Text } from '@/components/ui/text';
import { getCategoryLabel } from '@/data/questions';
import { getQuestionCategories } from '@/features/questions/question-utils';

import { createQuizQuestions } from './quiz-utils';
import { useQuizSession } from './quiz-session';

export default function QuizSetupScreen() {
  const categories = useMemo(() => getQuestionCategories(), []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const { isHydrated, persistenceError, startSession } = useQuizSession();

  const toggleCategory = (category: string) => {
    setSelectedCategories((selected) =>
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
  };

  const startQuiz = () => {
    if (!isHydrated || selectedCategories.length === 0) return;
    const quizQuestions = createQuizQuestions(selectedCategories);
    if (quizQuestions.length === 0) return;

    startSession(selectedCategories, quizQuestions);
    router.replace('/quiz/play' as Href);
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
              Choose one or more categories. Every matching question will appear once in a shuffled
              order.
            </Text>
          </Box>

          <Box className="gap-2">
            <Text className="font-semibold text-foreground">Categories</Text>
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

          {selectedCategories.length === 0 ? (
            <Text className="text-sm text-destructive">Select at least one category to start.</Text>
          ) : null}
          {persistenceError ? (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              The quiz could not be saved for continuing later.
            </Text>
          ) : null}

          <Button
            accessibilityLabel="Start quiz"
            isDisabled={!isHydrated || selectedCategories.length === 0}
            onPress={startQuiz}
          >
            <ButtonText>{isHydrated ? 'Start Quiz' : 'Loading…'}</ButtonText>
          </Button>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
