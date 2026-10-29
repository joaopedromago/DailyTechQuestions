import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { getQuestionCheckKey } from '../src/features/questions/question-check-utils';
import {
  loadCheckedQuestionKeys,
  saveCheckedQuestionKeys,
} from '../src/features/questions/question-check-storage';
import {
  QuestionChecksProvider,
  useQuestionChecks,
} from '../src/features/questions/question-checks';

jest.mock('../src/features/questions/question-check-storage', () => ({
  loadCheckedQuestionKeys: jest.fn(),
  saveCheckedQuestionKeys: jest.fn(),
}));

const question = { category: 'AI', question: 'How does this example work?' };
const mockLoadCheckedQuestionKeys = jest.mocked(loadCheckedQuestionKeys);
const mockSaveCheckedQuestionKeys = jest.mocked(saveCheckedQuestionKeys);

function CheckStatus() {
  const { isHydrated, loadError, isQuestionChecked, persistenceError, toggleQuestion } =
    useQuestionChecks();
  const isChecked = isQuestionChecked(question);

  return (
    <>
      <Text testID="hydrated">{String(isHydrated)}</Text>
      <Text testID="load-error">{String(loadError)}</Text>
      <Text testID="persistence-error">{String(persistenceError)}</Text>
      <Text testID="check-status">{isChecked ? 'checked' : 'unchecked'}</Text>
      <Pressable
        accessibilityLabel={isChecked ? 'Mark question unchecked' : 'Mark question checked'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        onPress={() => toggleQuestion(question)}
      />
    </>
  );
}

describe('question check provider storage', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  it('hydrates saved checks and persists toggles in both directions', async () => {
    const questionKey = getQuestionCheckKey(question);
    mockLoadCheckedQuestionKeys.mockResolvedValue([questionKey]);
    mockSaveCheckedQuestionKeys.mockResolvedValue();

    await render(
      <QuestionChecksProvider>
        <CheckStatus />
      </QuestionChecksProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('check-status').props.children).toBe('checked'));
    expect(screen.getByTestId('hydrated').props.children).toBe('true');

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Mark question unchecked' }));
    await waitFor(() =>
      expect(screen.getByTestId('check-status').props.children).toBe('unchecked'),
    );
    await waitFor(() => expect(mockSaveCheckedQuestionKeys).toHaveBeenLastCalledWith([]));

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Mark question checked' }));
    await waitFor(() => expect(screen.getByTestId('check-status').props.children).toBe('checked'));
    await waitFor(() =>
      expect(mockSaveCheckedQuestionKeys).toHaveBeenLastCalledWith([questionKey]),
    );
  });

  it('keeps checks unavailable and does not overwrite storage after a read failure', async () => {
    mockLoadCheckedQuestionKeys.mockRejectedValue(new Error('temporary read failure'));
    mockSaveCheckedQuestionKeys.mockResolvedValue();

    await render(
      <QuestionChecksProvider>
        <CheckStatus />
      </QuestionChecksProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('load-error').props.children).toBe('true'));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Mark question checked' }));

    expect(screen.getByTestId('check-status').props.children).toBe('unchecked');
    expect(mockSaveCheckedQuestionKeys).not.toHaveBeenCalled();
  });
});
