import { render, screen } from '@testing-library/react-native';

import { ThemedText } from './themed-text';

describe('ThemedText', () => {
  it('renders text with its semantic heading role', async () => {
    await render(<ThemedText accessibilityRole="header">Interview practice</ThemedText>);

    expect(screen.getByRole('header', { name: 'Interview practice' })).toBeTruthy();
  });
});
