import { router, useLocalSearchParams } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { questions } from '@/data/questions';
import { QuestionDetailView } from '@/features/questions/question-detail-view';

export default function QuestionDetailRoute() {
  const { questionIndex } = useLocalSearchParams<{ questionIndex: string }>();
  const index = Number(questionIndex);
  const question = Number.isInteger(index) && index >= 0 ? questions[index] : undefined;

  if (!question) {
    return (
      <Box className="flex-1 justify-center gap-4 bg-background px-6" style={{ flex: 1 }}>
        <Text role="heading" className="text-xl font-bold text-foreground">
          Question not found
        </Text>
        <Button onPress={() => router.replace('/questions')}>
          <ButtonText>Return to list</ButtonText>
        </Button>
      </Box>
    );
  }

  return (
    <QuestionDetailView
      disclosureKey={index}
      mode="browse"
      question={question}
      onReturn={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/questions');
      }}
    />
  );
}
