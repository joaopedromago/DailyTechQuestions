import { questionCategories, questions, type Question } from '@/data/questions';
import { createQuizQuestions } from '@/features/quiz/quiz-utils';

export const REMINDER_HOUR = 22;

export type DailyChallengeSettings = {
  selectedCategories: readonly string[];
  questionCount: number;
};

export const DEFAULT_DAILY_SETTINGS: DailyChallengeSettings = {
  selectedCategories: questionCategories,
  questionCount: 5,
};

export type DailySession = {
  day: string;
  questions: Question[];
  reviewedCount: number;
};

export type DailyStudyData = {
  completedDays: string[];
  session: DailySession | null;
  remindersEnabled: boolean;
  settings: DailyChallengeSettings;
};

export const EMPTY_DAILY_STUDY: DailyStudyData = {
  completedDays: [],
  session: null,
  remindersEnabled: false,
  settings: DEFAULT_DAILY_SETTINGS,
};

export function getDailyQuestionLimit(categories: readonly string[]) {
  const selected = new Set(categories);
  return questions.filter(({ category }) => selected.has(category)).length;
}

export function areDailySettingsValid({
  selectedCategories,
  questionCount,
}: DailyChallengeSettings) {
  return (
    selectedCategories.length > 0 &&
    selectedCategories.every((category) => questionCategories.includes(category)) &&
    Number.isInteger(questionCount) &&
    questionCount >= 1 &&
    questionCount <= getDailyQuestionLimit(selectedCategories)
  );
}

export function localDayKey(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function localDate(day: string, hour = 12) {
  const [year, month, date] = day.split('-').map(Number);
  const result = new Date(0);
  result.setFullYear(year, month - 1, date);
  result.setHours(hour, 0, 0, 0);
  return result;
}

export function nextLocalMidnight(now: Date) {
  const midnight = new Date(now);
  midnight.setDate(now.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
}

export function getDailySession(data: DailyStudyData, day: string) {
  return data.session?.day === day ? data.session : null;
}

export function startDailySession(data: DailyStudyData, day: string): DailyStudyData {
  if (data.completedDays.includes(day) || getDailySession(data, day)) return data;

  const { selectedCategories, questionCount } = data.settings;
  const questions = createQuizQuestions(selectedCategories, questionCount);

  return { ...data, session: { day, questions, reviewedCount: 0 } };
}

export function reviewDailyQuestion(
  data: DailyStudyData,
  day: string,
  position: number,
): DailyStudyData {
  const session = getDailySession(data, day);
  if (!session || session.reviewedCount !== position || data.completedDays.includes(day)) {
    return data;
  }

  const reviewedCount = position + 1;
  if (reviewedCount === session.questions.length) {
    return {
      ...data,
      session: null,
      completedDays: [...data.completedDays, day].sort(),
    };
  }
  return { ...data, session: { ...session, reviewedCount } };
}

export function buildCalendarMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + days) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day < 1 || day > days ? null : new Date(year, month, day, 12);
  });
}

export function getCalendarDayStatus(
  day: string,
  today: string,
  completedDays: ReadonlySet<string>,
  firstCompletion: string | undefined,
) {
  if (completedDays.has(day)) return 'completed';
  if (day === today) return 'today';
  if (firstCompletion && day > firstCompletion && day < today) return 'frozen';
  return 'neutral';
}

export function getReminderSlots(now: Date, completedDays: readonly string[]) {
  const slots = new Map<string, number>();
  const evening = localDate(localDayKey(now), REMINDER_HOUR);

  while (slots.size < 30) {
    const day = localDayKey(evening);
    if (evening > now && !completedDays.includes(day)) {
      slots.set(day, evening.getTime());
    }
    evening.setDate(evening.getDate() + 1);
    evening.setHours(REMINDER_HOUR, 0, 0, 0);
  }

  return slots;
}
