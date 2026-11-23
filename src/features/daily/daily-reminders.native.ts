import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { getReminderSlots, localDate, localDayKey, REMINDER_HOUR } from './daily-challenge';

const PREFIX = 'daily-study:';
const CHANNEL_ID = 'daily-study';

function isDailyReminder(request: Notifications.NotificationRequest) {
  return request.identifier.startsWith(PREFIX);
}

async function canShowReminders(permissions: Notifications.NotificationPermissionsStatus) {
  if (Platform.OS === 'ios') {
    return permissions.ios?.status === IosAuthorizationStatus.AUTHORIZED;
  }
  const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
  return permissions.granted && channel?.importance !== AndroidImportance.NONE;
}

export async function requestReminderPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily study reminder',
      importance: AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (await canShowReminders(current)) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return canShowReminders(requested);
}

export async function syncDailyReminders(
  enabled: boolean,
  completedDays: readonly string[],
  isCurrent: () => boolean,
): Promise<'ready' | 'blocked'> {
  const permitted = enabled && (await canShowReminders(await Notifications.getPermissionsAsync()));
  const now = new Date();
  const today = localDayKey(now);
  const slots = permitted ? getReminderSlots(now, completedDays) : new Map<string, number>();
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const tonight = localDate(today, REMINDER_HOUR).getTime();

  if (
    permitted &&
    Platform.OS === 'android' &&
    tonight <= now.getTime() &&
    !completedDays.includes(today) &&
    pending.some(
      (request) =>
        request.identifier === PREFIX + today &&
        request.content.data?.studyReminderTime === tonight,
    )
  ) {
    // Keep today's delayed alarm and leave its slot in the 30-reminder budget.
    const lastDay = [...slots.keys()].at(-1);
    if (lastDay) slots.delete(lastDay);
    slots.set(today, tonight);
  }

  for (const request of pending.filter(isDailyReminder)) {
    if (!isCurrent()) return 'ready';

    const day = request.identifier.slice(PREFIX.length);
    const scheduledTime = request.content.data?.studyReminderTime;
    const expectedTime = slots.get(day);
    if (expectedTime !== undefined && scheduledTime === expectedTime) {
      slots.delete(day);
    } else {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }

  for (const [day, time] of slots) {
    if (!isCurrent()) return 'ready';
    if (time <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: PREFIX + day,
      content: {
        title: 'Daily Challenge',
        body: 'Your daily study challenge is still open.',
        data: { studyReminderTime: time },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: time,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  }

  return enabled && !permitted ? 'blocked' : 'ready';
}

export async function cancelDailyReminders(day?: string) {
  if (day) {
    await Notifications.cancelScheduledNotificationAsync(PREFIX + day);
    return;
  }
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter(isDailyReminder)
      .map(({ identifier }) => Notifications.cancelScheduledNotificationAsync(identifier)),
  );
}

export function watchReminderTaps(onOpen: () => void) {
  let handledResponse: string | undefined;

  const handle = (response: Notifications.NotificationResponse) => {
    const key = response.notification.request.identifier + ':' + response.notification.date;
    if (
      key === handledResponse ||
      response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER ||
      !isDailyReminder(response.notification.request)
    ) {
      return;
    }
    handledResponse = key;
    Notifications.clearLastNotificationResponse();
    onOpen();
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  const last = Notifications.getLastNotificationResponse();
  if (last) handle(last);

  return () => subscription.remove();
}
