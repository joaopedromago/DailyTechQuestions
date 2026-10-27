import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { clearQuizSession, loadQuizSession, saveQuizSession } from '../src/features/quiz/session-storage';
import { QuizSessionProvider, useQuizSession } from '../src/features/quiz/quiz-session';

jest.mock('../src/features/quiz/session-storage', () => ({
  clearQuizSession: jest.fn(() => Promise.resolve()),
  loadQuizSession: jest.fn(() => Promise.reject(new Error('temporary read failure'))),
  saveQuizSession: jest.fn(() => Promise.resolve()),
}));

function SessionStatus() {
  const { isHydrated, persistenceError, session } = useQuizSession();

  return (
    <>
      <Text testID="hydrated">{String(isHydrated)}</Text>
      <Text testID="persistence-error">{String(persistenceError)}</Text>
      <Text testID="session">{session ? 'available' : 'empty'}</Text>
    </>
  );
}

describe('quiz session provider storage failures', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  it('does not clear a saved session when the initial storage read fails', async () => {
    await render(
      <QuizSessionProvider>
        <SessionStatus />
      </QuizSessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));
    expect(screen.getByTestId('persistence-error').props.children).toBe('true');
    expect(screen.getByTestId('session').props.children).toBe('empty');
    expect(clearQuizSession).not.toHaveBeenCalled();
    expect(saveQuizSession).not.toHaveBeenCalled();
    expect(loadQuizSession).toHaveBeenCalled();
  });
});
