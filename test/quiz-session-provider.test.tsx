import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { questions } from '../src/data/questions';
import { loadQuizHistory, saveQuizHistory } from '../src/features/quiz/session-storage';
import { QuizSessionProvider, useQuizSession } from '../src/features/quiz/quiz-session';

jest.mock('../src/features/quiz/session-storage', () => ({
  loadQuizHistory: jest.fn(() => Promise.reject(new Error('temporary read failure'))),
  saveQuizHistory: jest.fn(() => Promise.resolve()),
}));

function SessionStatus() {
  const { isHydrated, persistenceError, history, session, startSession } = useQuizSession();

  return (
    <>
      <Text testID="hydrated">{String(isHydrated)}</Text>
      <Text testID="persistence-error">{String(persistenceError)}</Text>
      <Text testID="history">{JSON.stringify(history)}</Text>
      <Text testID="latest-session">{session ? 'available' : 'empty'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start after read failure"
        onPress={() => startSession(['AI'], [questions[0]])}
      />
    </>
  );
}

describe('quiz history provider storage failures', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  it('does not overwrite saved history when the initial storage read fails', async () => {
    await render(
      <QuizSessionProvider>
        <SessionStatus />
      </QuizSessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));
    expect(screen.getByTestId('persistence-error').props.children).toBe('true');
    expect(screen.getByTestId('history').props.children).toBe('[]');
    expect(screen.getByTestId('latest-session').props.children).toBe('empty');
    expect(saveQuizHistory).not.toHaveBeenCalled();
    expect(loadQuizHistory).toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Start after read failure' }));
    await waitFor(() =>
      expect(screen.getByTestId('latest-session').props.children).toBe('available'),
    );
    expect(saveQuizHistory).not.toHaveBeenCalled();
  });
});
