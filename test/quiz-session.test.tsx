import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { questions } from '../src/data/questions';
import {
  QuizSessionProvider,
  useQuizSession,
  type QuizHistoryEntry,
} from '../src/features/quiz/quiz-session';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const HISTORY_KEY = 'study-experience.quiz-history';
const LEGACY_SESSION_KEY = 'study-experience.quiz-session';

function SessionControls() {
  const {
    isHydrated,
    history,
    session,
    startSession,
    setPosition,
    completeSession,
  } = useQuizSession();

  return (
    <View>
      <Text testID='hydrated'>{String(isHydrated)}</Text>
      <Text testID='history-state'>{JSON.stringify(history)}</Text>
      <Text testID='latest-session'>{session ? JSON.stringify(session) : 'empty'}</Text>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Start another quiz'
        onPress={() => startSession(['AI'], [questions[1], questions[2]])}
      />
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Advance'
        onPress={() => {
          if (session) setPosition(session.id, 1);
        }}
      />
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Complete latest'
        onPress={() => {
          if (session) completeSession(session.id);
        }}
      />
    </View>
  );
}

function renderProvider() {
  return render(
    <QuizSessionProvider>
      <SessionControls />
    </QuizSessionProvider>,
  );
}

describe('quiz history persistence', () => {
  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('migrates and restores the old quiz snapshot with its order and position', async () => {
    const legacySession = {
      selectedCategories: ['Javascript', 'AI'],
      questions: [questions[4], questions[0], questions[3]],
      currentPosition: 0,
    };
    await AsyncStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(legacySession));

    const firstMount = await renderProvider();
    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));

    const migrated = JSON.parse(screen.getByTestId('latest-session').props.children);
    expect(migrated).toMatchObject(legacySession);
    expect(migrated.id).toEqual(expect.any(String));
    expect(migrated.createdAt).toEqual(expect.any(String));
    expect(JSON.parse(screen.getByTestId('history-state').props.children)).toHaveLength(1);
    expect(await AsyncStorage.getItem(LEGACY_SESSION_KEY)).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Advance' }));
    await waitFor(async () => {
      const saved = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) ?? 'null');
      expect(saved.history[0].currentPosition).toBe(1);
      expect(saved.history[0].questions).toEqual(legacySession.questions);
    });
    await firstMount.unmount();

    await renderProvider();
    await waitFor(() => {
      const restored = JSON.parse(screen.getByTestId('latest-session').props.children);
      expect(restored.currentPosition).toBe(1);
      expect(restored.questions).toEqual(legacySession.questions);
    });
  });

  it('preserves the legacy quiz when writing migrated history fails', async () => {
    const legacySession = {
      selectedCategories: ['Javascript'],
      questions: [questions[0]],
      currentPosition: 0,
    };
    const serializedLegacySession = JSON.stringify(legacySession);
    await AsyncStorage.setItem(LEGACY_SESSION_KEY, serializedLegacySession);
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('temporary write failure'));

    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));

    expect(await AsyncStorage.getItem(LEGACY_SESSION_KEY)).toBe(serializedLegacySession);
  });

  it('appends new quizzes and retains completed quizzes with their saved progress', async () => {
    const legacySession = {
      selectedCategories: ['Javascript'],
      questions: [questions[0]],
      currentPosition: 0,
    };
    await AsyncStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(legacySession));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));

    await fireEvent.press(screen.getByRole('button', { name: 'Start another quiz' }));
    await waitFor(async () => {
      const saved = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) ?? 'null');
      expect(saved.history).toHaveLength(2);
      expect(saved.history[0]).toMatchObject(legacySession);
      expect(saved.history[1].questions).toEqual([questions[1], questions[2]]);
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Advance' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Complete latest' }));
    await waitFor(async () => {
      const saved = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) ?? 'null');
      expect(saved.history).toHaveLength(2);
      expect(saved.history[0]).toMatchObject(legacySession);
      expect(saved.history[1].currentPosition).toBe(1);
      expect(saved.history[1].completedAt).toEqual(expect.any(String));
    });
    expect(screen.getByTestId('history-state').props.children).not.toBe('empty');
  });

  it('discards malformed legacy data and hydrates with empty history', async () => {
    await AsyncStorage.setItem(LEGACY_SESSION_KEY, '{invalid json');
    await renderProvider();

    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));
    expect(JSON.parse(screen.getByTestId('history-state').props.children)).toEqual([]);
    await waitFor(async () => expect(await AsyncStorage.getItem(LEGACY_SESSION_KEY)).toBeNull());
  });
});
