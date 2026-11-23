import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_DAILY_SETTINGS,
  EMPTY_DAILY_STUDY,
  reviewDailyQuestion,
  startDailySession,
} from '@/features/daily/daily-challenge';
import { loadDailyStudy, saveDailyStudy } from '@/features/daily/daily-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const read = jest.mocked(AsyncStorage.getItem);
const write = jest.mocked(AsyncStorage.setItem);

it('loads version 1 progress and reminders with default categories and count', async () => {
  const day = '2026-11-23';
  const { session } = reviewDailyQuestion(startDailySession(EMPTY_DAILY_STUDY, day), day, 0);
  read.mockResolvedValueOnce(
    JSON.stringify({
      version: 1,
      session,
      remindersEnabled: true,
      completedDays: ['2026-11-22'],
    }),
  );

  expect(await loadDailyStudy()).toEqual({
    session,
    remindersEnabled: true,
    completedDays: ['2026-11-22'],
    settings: DEFAULT_DAILY_SETTINGS,
  });
});

it('saves and reloads settings and a variable-length challenge snapshot', async () => {
  const data = startDailySession(
    {
      ...EMPTY_DAILY_STUDY,
      settings: { selectedCategories: ['Node'], questionCount: 1 },
    },
    '2026-11-23',
  );
  await saveDailyStudy(data);
  const [, saved] = write.mock.calls.at(-1)!;
  expect(JSON.parse(saved).version).toBe(2);
  read.mockResolvedValueOnce(saved);

  expect(await loadDailyStudy()).toEqual(data);
});
