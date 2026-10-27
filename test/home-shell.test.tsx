import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, usePreventRemove } from 'expo-router';
import { Appearance, BackHandler, Platform } from 'react-native';

import HomeScreen from '../src/app';
import { getCategoryLabel, questions, questionCategories } from '../src/data/questions';
import QuestionBrowsingScreen from '../src/features/questions/question-browsing-screen';
import {
  handleQuestionSwipe,
  QuestionDetailView,
} from '../src/features/questions/question-detail-view';
import QuizSetupScreen from '../src/features/quiz/quiz-setup-screen';
import QuizPlayScreen from '../src/features/quiz/quiz-play-screen';
import { useQuizSession } from '../src/features/quiz/quiz-session';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  usePreventRemove: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');

  return {
    SafeAreaView: ({ className: _className, ...props }: Record<string, unknown>) =>
      jest.requireActual('react').createElement(View, props),
  };
});

jest.mock('@react-native-vector-icons/material-icons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    MaterialIcons: ({ color, name, testID }: { color?: string; name: string; testID?: string }) =>
      React.createElement(Text, { color, testID }, name),
  };
});

jest.mock('@/components/ui/box', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    Box: ({ className: _className, ...props }: Record<string, unknown>) =>
      React.createElement(View, props),
  };
});

jest.mock('@/components/ui/button', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text } = jest.requireActual('react-native');

  return {
    Button: ({
      accessibilityLabel,
      accessibilityRole = 'button',
      accessibilityState,
      children,
      className: _className,
      isDisabled = false,
      onPress,
      size: _size,
      variant: _variant,
    }: Record<string, any>) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel,
          accessibilityRole,
          accessibilityState: { ...accessibilityState, disabled: isDisabled },
          disabled: isDisabled,
          onPress,
        },
        children,
      ),
    ButtonText: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
  };
});

jest.mock('@/components/shared/button', () => jest.requireMock('@/components/ui/button'));

jest.mock('@/components/ui/text', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Text: ({ className: _className, ...props }: Record<string, unknown>) =>
      React.createElement(Text, props),
  };
});

jest.mock('@/components/shared/input', () => {
  const React = jest.requireActual('react');
  const { TextInput } = jest.requireActual('react-native');

  return {
    Input: ({ className: _className, ...props }: Record<string, unknown>) =>
      React.createElement(TextInput, props),
  };
});

jest.mock('@/components/external-link', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    ExternalLink: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/features/quiz/quiz-session', () => ({
  useQuizSession: jest.fn(),
}));

const mockUseQuizSession = jest.mocked(useQuizSession);
const mockUsePreventRemove = jest.mocked(usePreventRemove);
const startSession = jest.fn();
const setPosition = jest.fn();
const completeSession = jest.fn();
const disableRemovalPrevention = jest.fn();

describe('study screens', () => {
  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePreventRemove.mockReturnValue(disableRemovalPrevention);
    mockUseQuizSession.mockReturnValue({
      isHydrated: true,
      session: null,
      persistenceError: false,
      startSession,
      setPosition,
      completeSession,
    });
  });

  it('shows the planned menu actions and enables Continue only with a restored session', async () => {
    const emptySessionView = await render(<HomeScreen />);

    expect(screen.getByRole('heading', { name: 'Interview practice' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Random Quiz' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View Questions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await emptySessionView.unmount();

    mockUseQuizSession.mockReturnValue({
      isHydrated: true,
      session: {
        selectedCategories: ['Javascript'],
        questions: [questions[0]],
        currentPosition: 0,
      },
      persistenceError: false,
      startSession,
      setPosition,
      completeSession,
    });
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(router.push).toHaveBeenCalledWith('/quiz/play');
  });

  it('toggles the appearance and shows the matching icon', async () => {
    await render(<HomeScreen />);
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

    const appearanceButton = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(screen.getByText('dark-mode')).toBeTruthy();
    await fireEvent.press(appearanceButton);

    expect(setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('navigates from the menu to quiz setup and question browsing', async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Start Random Quiz' }));
    await fireEvent.press(screen.getByRole('button', { name: 'View Questions' }));

    expect(router.push).toHaveBeenNthCalledWith(1, '/quiz/setup');
    expect(router.push).toHaveBeenNthCalledWith(2, '/questions');
  });

  it('filters browse results and keeps the search value when a result is opened', async () => {
    const target = questions[0];
    const searchTerm = target.question.split(' ')[0];
    await render(<QuestionBrowsingScreen />);

    const search = screen.getByLabelText('Search questions');
    await fireEvent.changeText(search, searchTerm);
    const result = screen.getByRole('button', {
      name: `${target.category}: ${target.question}`,
    });
    await fireEvent.press(result);

    expect(router.push).toHaveBeenCalledWith(`/questions/0`);
    expect(screen.getByLabelText('Search questions').props.value).toBe(searchTerm);
  });

  it('starts a shuffled quiz from the selected categories', async () => {
    await render(<QuizSetupScreen />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(questionCategories.length);
    await fireEvent.press(screen.getByRole('button', { name: 'Start quiz' }));

    expect(startSession).toHaveBeenCalledWith(
      questionCategories,
      expect.arrayContaining([expect.objectContaining({ question: questions[0].question })]),
    );
    expect(router.replace).toHaveBeenCalledWith('/quiz/play');
  });

  it('disables quiz start when every category is deselected', async () => {
    await render(<QuizSetupScreen />);

    for (const category of questionCategories) {
      await fireEvent.press(screen.getByRole('checkbox', { name: getCategoryLabel(category) }));
    }

    expect(screen.getByRole('button', { name: 'Start quiz' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('reveals answers progressively and gates the quiz CTA on the full answer', async () => {
    const question = {
      question: 'Example question?',
      shortAnswer: 'Quick response.',
      longAnswer: 'Full response.',
      category: 'AI',
      referenceUrls: ['https://example.com/reference'],
    };
    const onNext = jest.fn();
    const view = await render(
      <QuestionDetailView
        canGoNext
        canGoPrevious
        disclosureKey={0}
        mode="quiz"
        question={question}
        onFinish={jest.fn()}
        onNext={onNext}
        onPrevious={jest.fn()}
        onReturn={jest.fn()}
      />,
    );

    expect(view.queryByText('Quick response.')).toBeNull();
    expect(view.queryByRole('button', { name: 'Next Question' })).toBeNull();
    expect(view.getByRole('button', { name: 'See answer' }).props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(view.getByTestId('answer-disclosure-icon').props.color).toBe('#ffffff');
    await fireEvent.press(view.getByRole('button', { name: 'See answer' }));
    expect(view.getByText('Quick response.')).toBeTruthy();
    expect(view.getByText('Category: AI Tools')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Hide answer' }).props.accessibilityState).toMatchObject({
      expanded: true,
    });
    await fireEvent.press(view.getByRole('button', { name: 'See full answer' }));
    expect(view.getByText('Full response.')).toBeTruthy();
    expect(view.getByText('https://example.com/reference')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Next Question' })).toBeTruthy();

    await fireEvent.press(view.getByRole('button', { name: 'Next question' }));
    expect(onNext).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByRole('button', { name: 'Hide answer' }));
    expect(view.queryByText('Quick response.')).toBeNull();
    expect(view.queryByText('Full response.')).toBeNull();
    expect(view.queryByText('https://example.com/reference')).toBeNull();
    expect(view.queryByRole('button', { name: 'Next Question' })).toBeNull();
    expect(view.getByRole('button', { name: 'See answer' })).toBeTruthy();

    await view.rerender(
      <QuestionDetailView
        canGoNext
        disclosureKey={1}
        mode="quiz"
        question={{ ...question, question: 'Different question?' }}
        onNext={onNext}
        onReturn={jest.fn()}
      />,
    );
    expect(view.queryByText('Quick response.')).toBeNull();
  });

  it('routes left and right horizontal swipes to quiz navigation', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const onReturn = jest.fn();

    handleQuestionSwipe(-80, 5, { onPrevious, onNext, onReturn });
    handleQuestionSwipe(80, 5, { onPrevious, onNext, onReturn });
    handleQuestionSwipe(10, 40, { onPrevious, onNext, onReturn });

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('shows completion after the final full answer, clears the session, and returns home', async () => {
    mockUseQuizSession.mockReturnValue({
      isHydrated: true,
      session: { selectedCategories: ['AI'], questions: [questions[0]], currentPosition: 0 },
      persistenceError: false,
      startSession,
      setPosition,
      completeSession,
    });
    const view = await render(<QuizPlayScreen />);

    await fireEvent.press(view.getByRole('button', { name: 'See answer' }));
    await fireEvent.press(view.getByRole('button', { name: 'See full answer' }));
    await fireEvent.press(view.getByRole('button', { name: 'Finish Quiz' }));

    expect(completeSession).toHaveBeenCalledTimes(1);
    expect(view.getByRole('heading', { name: 'Quiz complete' })).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Return to menu' }));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('uses mobile system back for previous question and menu return', async () => {
    type HardwareBackHandler = Parameters<typeof BackHandler.addEventListener>[1];
    type HardwareBackEvent = Parameters<HardwareBackHandler>[0];
    let backHandler: HardwareBackHandler | undefined;
    const subscription = { remove: jest.fn() };
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      backHandler = handler;
      return subscription;
    });

    mockUseQuizSession.mockReturnValue({
      isHydrated: true,
      session: {
        selectedCategories: ['AI'],
        questions: [questions[0], questions[1]],
        currentPosition: 1,
      },
      persistenceError: false,
      startSession,
      setPosition,
      completeSession,
    });
    const laterQuestion = await render(<QuizPlayScreen />);
    await waitFor(() => expect(backHandler).toBeDefined());
    await act(async () => {
      expect(backHandler?.({} as HardwareBackEvent)).toBe(true);
    });
    expect(setPosition).toHaveBeenCalledWith(0);
    await laterQuestion.unmount();

    backHandler = undefined;
    mockUseQuizSession.mockReturnValue({
      isHydrated: true,
      session: { selectedCategories: ['AI'], questions: [questions[0]], currentPosition: 0 },
      persistenceError: false,
      startSession,
      setPosition,
      completeSession,
    });
    await render(<QuizPlayScreen />);
    await waitFor(() => expect(backHandler).toBeDefined());
    await act(async () => {
      expect(backHandler?.({} as HardwareBackEvent)).toBe(true);
    });
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('uses iOS swipe back for the previous question and allows an explicit menu return', async () => {
    const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    try {
      mockUseQuizSession.mockReturnValue({
        isHydrated: true,
        session: {
          selectedCategories: ['AI'],
          questions: [questions[0], questions[1]],
          currentPosition: 1,
        },
        persistenceError: false,
        startSession,
        setPosition,
        completeSession,
      });
      const view = await render(<QuizPlayScreen />);
      const [shouldPreventRemoval, onPreventedRemoval] = mockUsePreventRemove.mock.calls.at(-1) ?? [];

      expect(shouldPreventRemoval).toBe(true);
      await act(async () => {
        onPreventedRemoval?.({ data: { action: { type: 'GO_BACK' } }, repeat: jest.fn() });
      });
      expect(setPosition).toHaveBeenCalledWith(0);

      await fireEvent.press(view.getByRole('button', { name: 'Return to menu' }));
      expect(disableRemovalPrevention).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledWith('/');
    } finally {
      if (originalPlatformDescriptor) {
        Object.defineProperty(Platform, 'OS', originalPlatformDescriptor);
      } else {
        Reflect.deleteProperty(Platform, 'OS');
      }
    }
  });
});
