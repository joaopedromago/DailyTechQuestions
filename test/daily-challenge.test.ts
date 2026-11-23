import {
  areDailySettingsValid,
  buildCalendarMonth,
  EMPTY_DAILY_STUDY,
  getCalendarDayStatus,
  getDailySession,
  getReminderSlots,
  localDate,
  localDayKey,
  nextLocalMidnight,
  reviewDailyQuestion,
  startDailySession,
  type DailyStudyData,
} from '@/features/daily/daily-challenge';

function finish(data: DailyStudyData, day: string) {
  let result = startDailySession(data, day);
  for (let index = 0; index < 5; index += 1) {
    result = reviewDailyQuestion(result, day, index);
  }
  return result;
}

it('keeps one ordered sample of five distinct questions and rejects out-of-order advancement', () => {
  const day = '2026-11-23';
  const started = startDailySession(EMPTY_DAILY_STUDY, day);
  const session = getDailySession(started, day)!;
  expect(session.questions).toHaveLength(5);
  expect(new Set(session.questions.map((item) => item.category + ':' + item.question)).size).toBe(
    5,
  );
  expect(startDailySession(started, day)).toBe(started);
  expect(reviewDailyQuestion(started, day, 2)).toBe(started);
  const resumed = reviewDailyQuestion(started, day, 0);
  expect(getDailySession(resumed, day)).toEqual({ ...session, reviewedCount: 1 });
  expect(reviewDailyQuestion(resumed, day, 0)).toBe(resumed);

  const following = '2026-11-24';
  expect(getDailySession(resumed, following)).toBeNull();
  expect(getDailySession(startDailySession(resumed, following), following)?.reviewedCount).toBe(0);
});

it('earns one credit per finished day and freezes across an unlimited gap', () => {
  const firstDay = '2020-02-29';
  const today = '2026-11-23';
  expect(EMPTY_DAILY_STUDY.completedDays).toHaveLength(0);
  const first = finish(EMPTY_DAILY_STUDY, firstDay);
  expect(first.completedDays).toEqual([firstDay]);
  expect(first.session).toBeNull();
  expect(finish(first, firstDay)).toBe(first);
  const second = finish(first, today);
  expect(second.completedDays).toEqual([firstDay, today]);

  const completed = new Set(second.completedDays);
  const status = (day: string) => getCalendarDayStatus(day, today, completed, firstDay);
  expect(status('2020-02-28')).toBe('neutral');
  expect(status(firstDay)).toBe('completed');
  expect(status('2021-12-31')).toBe('frozen');
  expect(status(today)).toBe('completed');
  expect(status('2026-11-24')).toBe('neutral');
  expect(getCalendarDayStatus(today, today, new Set(), undefined)).toBe('today');
});

it('uses saved category and count choices for new challenges and preserves an active challenge', () => {
  const today = '2026-11-23';
  const tomorrow = '2026-11-24';
  const active = reviewDailyQuestion(startDailySession(EMPTY_DAILY_STUDY, today), today, 0);
  const configured = {
    ...active,
    settings: { selectedCategories: ['Python'], questionCount: 1 },
  };
  expect(startDailySession(configured, today)).toBe(configured);
  expect(reviewDailyQuestion(configured, today, 1).session?.reviewedCount).toBe(2);

  const next = startDailySession(configured, tomorrow);
  expect(next.session?.questions.map(({ category }) => category)).toEqual(['Python']);
  expect(reviewDailyQuestion(next, tomorrow, 0).completedDays).toEqual([tomorrow]);
});

it('requires at least one catalog category and a whole count within the selection', () => {
  expect(areDailySettingsValid({ selectedCategories: [], questionCount: 1 })).toBe(false);
  expect(areDailySettingsValid({ selectedCategories: ['Python'], questionCount: 0 })).toBe(false);
  expect(areDailySettingsValid({ selectedCategories: ['Python'], questionCount: 1.5 })).toBe(false);
  expect(areDailySettingsValid({ selectedCategories: ['Python'], questionCount: 10_000 })).toBe(
    false,
  );
  expect(areDailySettingsValid({ selectedCategories: ['Python'], questionCount: 1 })).toBe(true);
});

it('lays out the correct dates across month, year, and leap-day boundaries', () => {
  const days = buildCalendarMonth(2028, 1);
  expect(days).toHaveLength(35);
  expect(days[0]).toBeNull();
  expect(days[1]).toBeNull();
  expect(days[2]?.getDate()).toBe(1);
  expect(days[30]?.getDate()).toBe(29);
  expect(buildCalendarMonth(2026, 12).filter(Boolean)).toHaveLength(31);
  const yearEnd = new Date(2026, 11, 31, 23, 59, 59);
  const midnight = nextLocalMidnight(yearEnd);
  expect(localDayKey(midnight)).toBe('2027-01-01');
  expect(midnight.getHours()).toBe(0);
  expect(midnight.getTime() - yearEnd.getTime()).toBe(1_000);
});

it('schedules thirty distinct future evenings at local 22:00 across DST and skips completed dates', () => {
  const now = new Date(2026, 9, 30, 22);
  const slots = getReminderSlots(now, ['2026-11-01']);
  expect(slots.size).toBe(30);
  expect([...slots.keys()][0]).toBe('2026-10-31');
  expect(slots.has('2026-11-01')).toBe(false);
  expect(new Set(slots.values()).size).toBe(30);
  for (const [day, time] of slots) {
    expect(localDayKey(new Date(time))).toBe(day);
    expect(time).toBe(localDate(day, 22).getTime());
    expect(time).toBeGreaterThan(now.getTime());
  }
  expect(getReminderSlots(localDate('2026-10-30', 21), []).has('2026-10-30')).toBe(true);
});
