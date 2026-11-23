import { router, useNavigation } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/shared/button';
import { Checkbox } from '@/components/shared/checkbox';
import { Input } from '@/components/shared/input';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { getCategoryLabel, questionCategories } from '@/data/questions';

import { getDailyQuestionLimit, type DailyChallengeSettings } from './daily-challenge';
import { useDailyStudy } from './daily-study';

function DailySettingsForm({ settings }: { settings: DailyChallengeSettings }) {
  const { busy, saveSettings } = useDailyStudy();
  const navigation = useNavigation();
  const [selectedCategories, setSelectedCategories] = useState(settings.selectedCategories);
  const [countText, setCountText] = useState(String(settings.questionCount));
  const [saveFailed, setSaveFailed] = useState(false);
  const limit = getDailyQuestionLimit(selectedCategories);
  const questionCount = Number(countText);
  const validCount = /^\d+$/.test(countText) && questionCount >= 1 && questionCount <= limit;
  const allSelected = selectedCategories.length === questionCategories.length;

  const updateCategories = (categories: readonly string[]) => {
    setSelectedCategories(categories);
    setSaveFailed(false);
  };

  const save = async () => {
    if (!validCount) return;
    const saved = await saveSettings({ selectedCategories, questionCount });
    if (!navigation.isFocused()) return;
    if (saved) router.dismissTo('/daily');
    else setSaveFailed(true);
  };

  return (
    <>
      <Text className="text-sm text-muted-foreground">
        Changes apply the next time you start a new daily challenge.
      </Text>
      <Box className="gap-2">
        <Text className="font-semibold text-foreground">Questions per day</Text>
        <Input
          accessibilityLabel="Questions per day"
          keyboardType="number-pad"
          editable={!busy}
          value={countText}
          onChangeText={(text) => {
            setCountText(text);
            setSaveFailed(false);
          }}
        />
        {limit > 0 ? (
          <Text
            className={validCount ? 'text-sm text-muted-foreground' : 'text-sm text-destructive'}
          >
            {'Enter a whole number from 1 to ' + limit + '.'}
          </Text>
        ) : null}
      </Box>
      <Box className="gap-2">
        <Box className="flex-row items-center justify-between gap-3">
          <Text role="heading" className="font-semibold text-foreground">
            Question categories
          </Text>
          <Button
            size="sm"
            variant="outline"
            isDisabled={busy}
            onPress={() => updateCategories(allSelected ? [] : questionCategories)}
          >
            <ButtonText>{allSelected ? 'Clear all' : 'Select all'}</ButtonText>
          </Button>
        </Box>
        {questionCategories.map((category) => {
          const checked = selectedCategories.includes(category);
          return (
            <Checkbox
              key={category}
              checked={checked}
              className="w-full justify-start"
              disabled={busy}
              label={getCategoryLabel(category)}
              onChange={() =>
                updateCategories(
                  checked
                    ? selectedCategories.filter((item) => item !== category)
                    : [...selectedCategories, category],
                )
              }
            />
          );
        })}
        {selectedCategories.length === 0 ? (
          <Text role="alert" className="text-sm text-destructive">
            Select at least one category.
          </Text>
        ) : null}
      </Box>
      {saveFailed ? (
        <Text role="alert" className="text-sm text-destructive">
          Your settings could not be saved. Try again.
        </Text>
      ) : null}
      <Button isDisabled={busy || !validCount} onPress={save}>
        <ButtonText>Save settings</ButtonText>
      </Button>
    </>
  );
}

export default function DailySettingsScreen() {
  const { data, loading, loadError, reload } = useDailyStudy();

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 py-6">
        <Box className="mx-auto w-full max-w-xl gap-5">
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onPress={() => router.dismissTo('/daily')}
          >
            <ButtonText>Back to challenge</ButtonText>
          </Button>
          <Text role="heading" className="text-3xl font-bold text-foreground">
            Daily Settings
          </Text>
          {loading ? (
            <Text className="text-muted-foreground">Loading daily settings…</Text>
          ) : loadError ? (
            <Box className="gap-3">
              <Text role="alert" className="text-muted-foreground">
                Saved daily settings could not be loaded.
              </Text>
              <Button onPress={reload}>
                <ButtonText>Retry</ButtonText>
              </Button>
            </Box>
          ) : (
            <DailySettingsForm settings={data.settings} />
          )}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
