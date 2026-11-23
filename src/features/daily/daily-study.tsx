import { router, useRootNavigationState } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';

import {
  EMPTY_DAILY_STUDY,
  getDailySession,
  localDayKey,
  nextLocalMidnight,
  reviewDailyQuestion,
  startDailySession,
  type DailyStudyData,
} from './daily-challenge';
import {
  cancelDailyReminders,
  requestReminderPermission,
  syncDailyReminders,
  watchReminderTaps,
} from './daily-reminders';
import {
  loadDailyStudy,
  saveDailyStudy,
  watchDailyStudyChanges,
  withDailyStudyLock,
} from './daily-storage';

type ReminderStatus = 'ready' | 'blocked' | 'error';

const DailyStudyContext = createContext<{
  data: DailyStudyData;
  today: string;
  loading: boolean;
  busy: boolean;
  loadError: boolean;
  saveError: boolean;
  reminderStatus: ReminderStatus;
  reload: () => void;
  start: (day: string) => Promise<boolean>;
  review: (day: string, position: number) => Promise<boolean>;
  setReminders: (enabled: boolean) => Promise<void>;
} | null>(null);

function clockInfo(now: Date) {
  return (
    localDayKey(now) +
    ':' +
    now.getTimezoneOffset() +
    ':' +
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

function useDailyClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let clock = clockInfo(new Date());
    let timer: ReturnType<typeof setTimeout>;
    const refresh = (force = false) => {
      clearTimeout(timer);
      const current = new Date();
      const nextClock = clockInfo(current);
      if (force || clock !== nextClock) setNow(current);
      clock = nextClock;
      const untilMidnight = nextLocalMidnight(current).getTime() - current.getTime();
      timer = setTimeout(refresh, Math.min(60_000, untilMidnight));
    };

    refresh(true);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh(true);
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return { now, refresh: setNow };
}

export function DailyStudyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(EMPTY_DAILY_STUDY);
  const dataRef = useRef(data);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const expiredSession = useRef<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>('ready');
  const syncQueue = useRef(Promise.resolve());
  const { now, refresh } = useDailyClock();
  const today = localDayKey(now);

  const showData = useCallback((loaded: DailyStudyData) => {
    dataRef.current = loaded;
    setData(loaded);
  }, []);

  const reload = useCallback(() => {
    if (locked.current) return;
    locked.current = true;
    setLoading(true);
    setLoadError(false);
    void withDailyStudyLock(async () => showData(await loadDailyStudy()))
      .catch(() => setLoadError(true))
      .finally(() => {
        locked.current = false;
        setLoading(false);
      });
  }, [showData]);

  useEffect(reload, [reload]);
  useEffect(
    () =>
      watchDailyStudyChanges(() => {
        void withDailyStudyLock(async () => {
          showData(await loadDailyStudy());
          setLoadError(false);
        }).catch(() => setLoadError(true));
      }),
    [showData],
  );

  const enqueueReminderWork = useCallback((work: () => Promise<void>) => {
    const pending = syncQueue.current.then(work);
    syncQueue.current = pending.catch(() => {});
    return pending;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || loading || loadError) return;

    let active = true;
    const isCurrent = () =>
      active &&
      dataRef.current.completedDays === data.completedDays &&
      dataRef.current.remindersEnabled === data.remindersEnabled;
    void enqueueReminderWork(async () => {
      if (!isCurrent()) return;
      try {
        const status = await syncDailyReminders(
          data.remindersEnabled,
          data.completedDays,
          isCurrent,
        );
        if (isCurrent()) setReminderStatus(status);
      } catch {
        if (isCurrent()) setReminderStatus('error');
      }
    });

    return () => {
      active = false;
    };
  }, [data.completedDays, data.remindersEnabled, enqueueReminderWork, loadError, loading, now]);

  const update = useCallback(
    async (
      change: (current: DailyStudyData) => Promise<DailyStudyData> | DailyStudyData,
      afterSave?: (current: DailyStudyData, next: DailyStudyData) => Promise<void>,
    ) => {
      if (loading || loadError || locked.current) return false;
      locked.current = true;
      setBusy(true);
      setSaveError(false);
      try {
        return await withDailyStudyLock(async () => {
          const current = Platform.OS === 'web' ? await loadDailyStudy() : dataRef.current;
          const next = await change(current);
          if (next !== current) {
            await saveDailyStudy(next);
            dataRef.current = next;
            if (afterSave) {
              await afterSave(current, next).catch(() => setReminderStatus('error'));
            }
          }
          if (next !== dataRef.current || next !== current) showData(next);
          return next !== current;
        });
      } catch {
        setSaveError(true);
        return false;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [loadError, loading, showData],
  );

  const sessionDay = data.session?.day;
  useEffect(() => {
    if (loading || loadError || busy || !sessionDay || sessionDay === today) return;
    const expiry = sessionDay + ':' + today;
    if (expiredSession.current === expiry) return;
    const timer = setTimeout(() => {
      expiredSession.current = expiry;
      void update((current) =>
        current.session?.day === sessionDay ? { ...current, session: null } : current,
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [busy, loadError, loading, sessionDay, today, update]);

  const refreshIfExpired = (day: string) => {
    const current = new Date();
    if (day === localDayKey(current)) return false;
    refresh(current);
    return true;
  };

  const start = async (day: string) => {
    if (loading || loadError || locked.current || refreshIfExpired(day)) return false;
    await update((current) => (refreshIfExpired(day) ? current : startDailySession(current, day)));
    return !refreshIfExpired(day) && Boolean(getDailySession(dataRef.current, day));
  };

  const review = async (day: string, position: number) => {
    if (refreshIfExpired(day)) return false;
    return update(
      (current) => (refreshIfExpired(day) ? current : reviewDailyQuestion(current, day, position)),
      (current, next) =>
        Platform.OS !== 'web' &&
        current.remindersEnabled &&
        current.completedDays !== next.completedDays
          ? enqueueReminderWork(() => cancelDailyReminders(day))
          : Promise.resolve(),
    );
  };

  const setReminders = async (enabled: boolean) => {
    await update(
      async (current) => {
        if (enabled) {
          try {
            if (!(await requestReminderPermission())) {
              setReminderStatus('blocked');
              return current;
            }
          } catch {
            setReminderStatus('error');
            return current;
          }
        }

        const remindersChanged = enabled !== current.remindersEnabled;
        if (!remindersChanged) refresh(new Date());
        return remindersChanged ? { ...current, remindersEnabled: enabled } : current;
      },
      (_current, next) =>
        next.remindersEnabled
          ? Promise.resolve()
          : enqueueReminderWork(() => cancelDailyReminders()),
    );
  };

  return (
    <DailyStudyContext.Provider
      value={{
        data,
        today,
        loading,
        busy,
        loadError,
        saveError,
        reminderStatus,
        reload,
        start,
        review,
        setReminders,
      }}
    >
      {children}
    </DailyStudyContext.Provider>
  );
}

export function useDailyStudy() {
  const value = useContext(DailyStudyContext);
  if (!value) throw new Error('useDailyStudy must be used within DailyStudyProvider');
  return value;
}

export function DailyReminderNavigation() {
  const navigationKey = useRootNavigationState()?.key;
  useEffect(() => {
    if (Platform.OS === 'web' || !navigationKey) return;
    return watchReminderTaps(() => router.navigate('/daily'));
  }, [navigationKey]);

  return null;
}
