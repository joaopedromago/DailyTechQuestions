import { router, type Href } from 'expo-router';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/shared/button';
import { Text } from '@/components/ui/text';
import { getCategoryLabel } from '@/data/questions';

import { useQuizSession, type QuizHistoryEntry } from './quiz-session';

function formatCreatedAt(createdAt: string) {
  return new Date(createdAt).toLocaleString();
}

function HistoryCard({ entry }: { entry: QuizHistoryEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorScheme = useColorScheme();
  const explicitWebTheme =
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? document.documentElement.dataset.theme
      : undefined;
  const isDark = explicitWebTheme ? explicitWebTheme === 'dark' : colorScheme === 'dark';
  const createdAt = formatCreatedAt(entry.createdAt);
  const questionProgress = 'Questions ' + (entry.currentPosition + 1) + '/' + entry.questions.length;

  return (
    <Box className='rounded-xl border border-border bg-background p-3'>
      <Box className='h-16 flex-row items-center gap-2'>
        <Button
          accessibilityLabel={'Open quiz created ' + createdAt + ', ' + questionProgress}
          className='h-full min-w-0 flex-1 justify-center'
          variant='ghost'
          onPress={() => router.push(('/quiz/play?quizId=' + encodeURIComponent(entry.id)) as Href)}
        >
          <Box className='w-full gap-1'>
            <Text numberOfLines={1} className='text-sm text-muted-foreground'>
              Created {createdAt}
            </Text>
            <Text className='font-semibold text-foreground'>{questionProgress}</Text>
          </Box>
        </Button>
        <Button
          accessibilityLabel={(isExpanded ? 'Hide' : 'Show') + ' categories for quiz created ' + createdAt}
          accessibilityState={{ expanded: isExpanded }}
          className='min-h-11 min-w-11'
          size='icon'
          variant='outline'
          onPress={() => setIsExpanded((expanded) => !expanded)}
        >
          <MaterialIcons
            color={isDark ? '#e2e8f0' : '#334155'}
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={22}
          />
        </Button>
      </Box>
      {isExpanded ? (
        <Box className='mt-3 flex-row flex-wrap gap-2'>
          {entry.selectedCategories.map((category) => (
            <Box key={category} className='rounded-full bg-secondary px-3 py-1'>
              <Text className='text-xs font-medium text-secondary-foreground'>
                {getCategoryLabel(category)}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

export default function QuizHistoryScreen() {
  const { isHydrated, history, persistenceError } = useQuizSession();
  const orderedHistory = useMemo(
    () =>
      history
        .map((entry, index) => ({ entry, index }))
        .sort(
          (left, right) =>
            Date.parse(right.entry.createdAt) - Date.parse(left.entry.createdAt) ||
            right.index - left.index,
        )
        .map(({ entry }) => entry),
    [history],
  );

  return (
    <SafeAreaView className='flex-1' style={{ flex: 1 }}>
      <Box className='flex-1 bg-background'>
        <ScrollView contentContainerClassName='gap-5 px-5 py-6'>
          <Box className='mx-auto w-full max-w-xl gap-5'>
            <Box className='gap-3'>
              <Button
                accessibilityLabel='Back to menu'
                className='self-start'
                size='sm'
                variant='ghost'
                onPress={() => router.replace('/')}
              >
                <ButtonText>Back to menu</ButtonText>
              </Button>
              <Text role='heading' className='text-2xl font-bold text-foreground'>
                Quiz History
              </Text>
            </Box>

            {persistenceError ? (
              <Text accessibilityRole='alert' className='text-sm text-destructive'>
                Quiz history could not be read or saved.
              </Text>
            ) : null}

            {!isHydrated ? (
              <Text className='text-base text-muted-foreground'>Loading quiz history…</Text>
            ) : orderedHistory.length === 0 ? (
              <Text className='text-base text-muted-foreground'>Your quizzes will appear here.</Text>
            ) : (
              <Box className='gap-3'>
                {orderedHistory.map((entry) => (
                  <HistoryCard key={entry.id} entry={entry} />
                ))}
              </Box>
            )}
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
