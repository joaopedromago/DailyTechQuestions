export async function requestReminderPermission(): Promise<boolean> {
  return false;
}

export async function cancelDailyReminders(_day?: string): Promise<void> {}

export async function syncDailyReminders(
  _enabled: boolean,
  _completedDays: readonly string[],
  _isCurrent: () => boolean,
): Promise<'ready' | 'blocked'> {
  return 'ready';
}

export function watchReminderTaps(_onOpen: () => void): () => void {
  return () => {};
}
