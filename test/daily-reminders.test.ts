import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  cancelDailyReminders,
  requestReminderPermission,
  syncDailyReminders,
  watchReminderTaps,
} from '@/features/daily/daily-reminders.native';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, NONE: 0 },
  IosAuthorizationStatus: { AUTHORIZED: 2 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  DEFAULT_ACTION_IDENTIFIER: 'default',
  getNotificationChannelAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}));

const permissions = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissions = jest.mocked(Notifications.requestPermissionsAsync);
const getChannel = jest.mocked(Notifications.getNotificationChannelAsync);
const getPending = jest.mocked(Notifications.getAllScheduledNotificationsAsync);
const schedule = jest.mocked(Notifications.scheduleNotificationAsync);
const cancel = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const subscribe = jest.mocked(Notifications.addNotificationResponseReceivedListener);
const getLastResponse = jest.mocked(Notifications.getLastNotificationResponse);
const isCurrent = () => true;
const day = '2026-11-23';
const tonight = new Date(2026, 10, 23, 22);
const todayId = 'daily-study:' + day;
const platform = Platform.OS;

function pending(id: string, time: number) {
  return {
    identifier: id,
    content: { data: { studyReminderTime: time } },
    trigger: null,
  } as unknown as Notifications.NotificationRequest;
}

function permission(
  granted: boolean,
  canAskAgain = true,
): Notifications.NotificationPermissionsStatus {
  return {
    granted,
    canAskAgain,
    status: granted ? 'granted' : 'denied',
    expires: 'never',
    ios: { status: granted ? 2 : 1 },
  } as Notifications.NotificationPermissionsStatus;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 23, 12));
  Platform.OS = 'android';
  permissions.mockResolvedValue(permission(true));
  getChannel.mockResolvedValue(null);
  getPending.mockResolvedValue([]);
});

afterEach(() => {
  Platform.OS = platform;
  jest.useRealTimers();
});

it('creates the Android channel before prompting and reports denied permission', async () => {
  permissions.mockResolvedValue(permission(false));
  requestPermissions.mockResolvedValue(permission(false, false));
  expect(await requestReminderPermission()).toBe(false);
  expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('daily-study', {
    name: 'Daily study reminder',
    importance: 3,
  });
  expect(requestPermissions).toHaveBeenCalledTimes(1);
  expect(await syncDailyReminders(true, [], isCurrent)).toBe('blocked');
  expect(schedule).not.toHaveBeenCalled();
});

it('schedules 30 local requests and reconciles the same queue without duplicates', async () => {
  expect(await syncDailyReminders(true, [], isCurrent)).toBe('ready');
  expect(schedule).toHaveBeenCalledTimes(30);
  expect(schedule).toHaveBeenCalledWith(
    expect.objectContaining({
      identifier: todayId,
      trigger: { type: 'date', date: tonight.getTime(), channelId: 'daily-study' },
    }),
  );

  const scheduled = schedule.mock.calls.map(([item]) =>
    pending(item.identifier!, item.content.data!.studyReminderTime as number),
  );
  getPending.mockResolvedValue(scheduled);
  schedule.mockClear();
  await syncDailyReminders(true, [], isCurrent);
  expect(schedule).not.toHaveBeenCalled();
  expect(cancel).not.toHaveBeenCalled();

  await syncDailyReminders(true, [day], isCurrent);
  expect(cancel).toHaveBeenCalledWith(todayId);
  expect(schedule).toHaveBeenCalledTimes(1);
  expect(schedule.mock.calls[0][0].identifier).not.toBe(todayId);
});

it('cancels only the targeted challenge reminders', async () => {
  const followingId = 'daily-study:2026-11-24';
  getPending.mockResolvedValue([
    pending(todayId, tonight.getTime()),
    pending(followingId, 1),
    pending('unrelated-reminder', 2),
  ]);

  await cancelDailyReminders(day);
  expect(cancel.mock.calls).toEqual([[todayId]]);
  cancel.mockClear();
  await cancelDailyReminders();
  expect(cancel.mock.calls).toEqual([[todayId], [followingId]]);
});

it('opens the daily challenge on a cold reminder tap and ignores unrelated responses', () => {
  const response = {
    actionIdentifier: 'default',
    notification: { request: pending(todayId, tonight.getTime()) },
  } as Notifications.NotificationResponse;
  const remove = jest.fn();
  subscribe.mockReturnValue({ remove });
  getLastResponse.mockReturnValue(response);
  const open = jest.fn();
  const cleanup = watchReminderTaps(open);
  const callback = subscribe.mock.calls[0][0];
  callback(response);
  callback({
    ...response,
    notification: { ...response.notification, request: pending('unrelated', 2) },
  });

  expect(open).toHaveBeenCalledTimes(1);
  expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  cleanup();
  expect(remove).toHaveBeenCalledTimes(1);
});
