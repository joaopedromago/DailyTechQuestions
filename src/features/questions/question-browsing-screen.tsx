import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checkbox } from '@/components/shared/checkbox';
import { Input } from '@/components/shared/input';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/shared/button';
import { Text } from '@/components/ui/text';
import { getCategoryLabel } from '@/data/questions';

import { filterQuestions, getQuestionCategories } from './question-utils';

export default function QuestionBrowsingScreen() {
  const categories = useMemo(() => getQuestionCategories(), []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [searchText, setSearchText] = useState('');
  const rows = useMemo(
    () => filterQuestions(searchText, selectedCategories),
    [searchText, selectedCategories],
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((selected) =>
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
  };

  const listHeader = (
    <Box className="gap-4 px-5 pb-4 pt-5">
      <Box className="gap-2">
        <Button
          accessibilityLabel="Back to menu"
          className="self-start"
          size="sm"
          variant="ghost"
          onPress={() => router.replace('/')}
        >
          <ButtonText>Back to menu</ButtonText>
        </Button>
        <Text role="heading" className="text-2xl font-bold text-foreground">
          View Questions
        </Text>
      </Box>
      <Input
        accessibilityLabel="Search questions"
        autoCapitalize="none"
        placeholder="Search questions and quick answers"
        returnKeyType="search"
        value={searchText}
        onChangeText={setSearchText}
      />
      <Box className="gap-2">
        <Text className="font-semibold text-foreground">Categories</Text>
        <Box className="flex-row flex-wrap gap-2">
          {categories.map((category) => (
            <Checkbox
              key={category}
              checked={selectedCategories.includes(category)}
              className="self-start"
              label={getCategoryLabel(category)}
              onChange={() => toggleCategory(category)}
            />
          ))}
        </Box>
      </Box>
      <Text className="text-sm text-muted-foreground">
        {rows.length} {rows.length === 1 ? 'question' : 'questions'}
      </Text>
    </Box>
  );

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1 }}>
      <Box className="flex-1 bg-background">
        <FlatList
          contentContainerClassName="gap-3 pb-8"
          data={rows}
          keyExtractor={(item) => String(item.index)}
          ListEmptyComponent={
            <Box className="px-5 py-8">
              <Text className="text-base text-muted-foreground">
                No questions match these filters.
              </Text>
            </Box>
          }
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <Box className="px-5">
              <Button
                accessibilityLabel={`${getCategoryLabel(item.question.category)}: ${item.question.question}`}
                className="w-full items-start justify-start"
                variant="outline"
                onPress={() => router.push(`/questions/${item.index}` as Href)}
              >
                <Box className="gap-1">
                  <Text className="text-xs font-medium text-muted-foreground">
                    {getCategoryLabel(item.question.category)}
                  </Text>
                  <ButtonText className="text-left text-base font-medium">
                    {item.question.question}
                  </ButtonText>
                </Box>
              </Button>
            </Box>
          )}
        />
      </Box>
    </SafeAreaView>
  );
}
