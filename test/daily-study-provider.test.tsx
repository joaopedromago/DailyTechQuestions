import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { EMPTY_DAILY_STUDY, startDailySession } from '@/features/daily/daily-challenge';
import { loadDailyStudy, saveDailyStudy } from '@/features/daily/daily-storage';
import { DailyStudyProvider, useDailyStudy } from '@/features/daily/daily-study';

jest.mock('@/features/daily/daily-storage', () => ({
  loadDailyStudy: jest.fn(),
  saveDailyStudy: jest.fn(),
  watchDailyStudyChanges: jest.fn(),
  withDailyStudyLock: (work: () => Promise<unknown>) => work(),
}));
jest.mock('@/features/daily/daily-reminders', () => ({
  cancelDailyReminders: jest.fn().mockResolvedValue(undefined),
  syncDailyReminders: jest.fn().mockResolvedValue('ready'),
  requestReminderPermission: jest.fn().mockResolvedValue(true),
  watchReminderTaps: jest.fn(),
}));
jest.mock('expo-router', () => ({}));

const load = jest.mocked(loadDailyStudy);
const save = jest.mocked(saveDailyStudy);
const day = '2026-11-23';
const tomorrow = '2026-11-24';

function wrapper({ children }: { children: ReactNode }) {
  return <DailyStudyProvider>{children}</DailyStudyProvider>;
}

async function setup() {
  const view = await renderHook(useDailyStudy, { wrapper });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 23, 23, 59, 55));
  load.mockResolvedValue(EMPTY_DAILY_STUDY);
  save.mockReset().mockResolvedValue(undefined);
});

afterEach(() => jest.useRealTimers());

it('shows only durably saved progress and can retry failed writes without awarding the day twice', async () => {
  const { result } = await setup();
  await act(async () => {
    expect(await result.current.start(day)).toBe(true);
  });
  expect(result.current.data.session?.reviewedCount).toBe(0);
  for (let position = 0; position < 4; position += 1) {
    await act(async () => {
      expect(await result.current.review(day, position)).toBe(true);
    });
  }

  save.mockRejectedValueOnce(new Error('write failed'));
  await act(async () => {
    expect(await result.current.review(day, 4)).toBe(false);
  });
  expect(result.current.saveError).toBe(true);
  expect(result.current.data.session?.reviewedCount).toBe(4);
  expect(result.current.data.completedDays).toEqual([]);

  await act(async () => {
    const review = result.current.review;
    expect(await Promise.all([review(day, 4), review(day, 4)])).toEqual([true, false]);
  });
  expect(result.current.saveError).toBe(false);
  expect(result.current.data.completedDays).toEqual([day]);
});

it('refreshes at midnight while open and rejects actions for the expired challenge', async () => {
  const { result } = await setup();
  await act(async () => {
    expect(await result.current.start(day)).toBe(true);
    jest.advanceTimersByTime(5_000);
  });
  expect(result.current.today).toBe(tomorrow);
  await act(async () => {
    expect(await result.current.review(day, 0)).toBe(false);
    expect(await result.current.start(tomorrow)).toBe(true);
  });
  expect(result.current.data.session).toMatchObject({ day: tomorrow, reviewedCount: 0 });
});

it('opens on the current date after spending midnight closed', async () => {
  load.mockResolvedValue(startDailySession(EMPTY_DAILY_STUDY, day));
  jest.setSystemTime(new Date(2026, 10, 24, 8));
  const { result } = await setup();
  expect(result.current.today).toBe(tomorrow);
  await act(async () => {
    expect(await result.current.start(tomorrow)).toBe(true);
  });
  expect(result.current.data.session).toMatchObject({ day: tomorrow, reviewedCount: 0 });
});
