import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { questions } from '../src/data/questions';
import {
  QuizSessionProvider,
  useQuizSession,
  type QuizSession,
} from '../src/features/quiz/quiz-session';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const STORAGE_KEY = 'study-experience.quiz-session';

function SessionControls() {
  const {
    isHydrated,
    session,
    startSession,
    setPosition,
    completeSession,
  } = useQuizSession();

  return (
    <View>
      <Text testID="hydrated">{String(isHydrated)}</Text>
      <Text testID="session-state">{session ? JSON.stringify(session) : 'empty'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start replacement quiz"
        onPress={() => startSession(['AI'], [questions[1], questions[2]])}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Advance" onPress={() => setPosition(1)} />
      <Pressable accessibilityRole="button" accessibilityLabel="Complete" onPress={completeSession} />
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

describe('quiz session persistence', () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores the exact ordered snapshot and position after remount', async () => {
    const original: QuizSession = {
      selectedCategories: ['Javascript', 'AI'],
      questions: [questions[4], questions[0], questions[3]],
      currentPosition: 0,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(original));

    const firstMount = await renderProvider();
    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));
    expect(JSON.parse(screen.getByTestId('session-state').props.children)).toEqual(original);

    await fireEvent.press(screen.getByRole('button', { name: 'Advance' }));
    await waitFor(async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(saved ?? 'null')).toEqual({ ...original, currentPosition: 1 });
    });
    await firstMount.unmount();

    await renderProvider();
    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('session-state').props.children)).toEqual({
        ...original,
        currentPosition: 1,
      });
    });
  });

  it('replaces the saved session and clears it on completion', async () => {
    const original: QuizSession = {
      selectedCategories: ['Javascript'],
      questions: [questions[0]],
      currentPosition: 0,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(original));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));

    await fireEvent.press(screen.getByRole('button', { name: 'Start replacement quiz' }));
    await waitFor(async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(saved ?? 'null')).toEqual({
        selectedCategories: ['AI'],
        questions: [questions[1], questions[2]],
        currentPosition: 0,
      });
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Complete' }));
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull());
    expect(screen.getByTestId('session-state').props.children).toBe('empty');
  });

  it('discards malformed session data and hydrates with no Continue session', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{invalid json');
    await renderProvider();

    await waitFor(() => expect(screen.getByTestId('hydrated').props.children).toBe('true'));
    expect(screen.getByTestId('session-state').props.children).toBe('empty');
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull());
  });

});
