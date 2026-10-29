import AsyncStorage from '@react-native-async-storage/async-storage';

const QUESTION_CHECKS_KEY = 'study-experience.question-checks';

export async function loadCheckedQuestionKeys(): Promise<string[]> {
  const serializedChecks = await AsyncStorage.getItem(QUESTION_CHECKS_KEY);
  if (!serializedChecks) return [];

  let stored: unknown;
  try {
    stored = JSON.parse(serializedChecks);
  } catch {
    await AsyncStorage.removeItem(QUESTION_CHECKS_KEY);
    return [];
  }

  if (
    !stored ||
    typeof stored !== 'object' ||
    (stored as Record<string, unknown>).version !== 1 ||
    !Array.isArray((stored as Record<string, unknown>).checkedQuestionKeys)
  ) {
    await AsyncStorage.removeItem(QUESTION_CHECKS_KEY);
    return [];
  }

  return [
    ...new Set(
      (stored as { checkedQuestionKeys: unknown[] }).checkedQuestionKeys.filter(
        (key): key is string => typeof key === 'string',
      ),
    ),
  ];
}

export function saveCheckedQuestionKeys(checkedQuestionKeys: readonly string[]) {
  return AsyncStorage.setItem(
    QUESTION_CHECKS_KEY,
    JSON.stringify({ version: 1, checkedQuestionKeys }),
  );
}
