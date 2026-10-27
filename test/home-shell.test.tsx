import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Appearance } from 'react-native';

import HomeScreen from '../src/app';
import QuestionBrowsingScreen from '../src/features/questions/question-browsing-screen';
import QuizSetupScreen from '../src/features/quiz/quiz-setup-screen';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
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
    MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name),
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
      children,
      className: _className,
      isDisabled = false,
      onPress,
      size: _size,
      variant: _variant,
    }: Record<string, unknown>) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel,
          accessibilityRole: 'button',
          accessibilityState: { disabled: isDisabled },
          disabled: isDisabled,
          onPress,
        },
        children,
      ),
    ButtonText: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
  };
});

jest.mock('@/components/ui/text', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Text: ({ className: _className, ...props }: Record<string, unknown>) =>
      React.createElement(Text, props),
  };
});

describe('home shell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the planned actions and keeps Continue disabled', async () => {
    await render(<HomeScreen />);

    expect(screen.getByRole('heading', { name: 'Interview practice' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Random Quiz' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View Questions' })).toBeTruthy();

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('toggles the appearance and shows the matching icon', async () => {
    await render(<HomeScreen />);
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

    const appearanceButton = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(screen.getByText('dark-mode')).toBeTruthy();
    await fireEvent.press(appearanceButton);

    expect(setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('navigates to the quiz and question placeholders', async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Start Random Quiz' }));
    await fireEvent.press(screen.getByRole('button', { name: 'View Questions' }));

    expect(router.push).toHaveBeenNthCalledWith(1, '/quiz/setup');
    expect(router.push).toHaveBeenNthCalledWith(2, '/questions');
  });

  it('provides a return action from the question placeholder', async () => {
    const view = await render(<QuestionBrowsingScreen />);

    expect(view.getByText('Question browsing is coming soon.')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Back to menu' }));

    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('provides a return action from the quiz placeholder', async () => {
    const view = await render(<QuizSetupScreen />);

    expect(view.getByText('Random quiz setup is coming soon.')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Back to menu' }));

    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
