import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { questionCategories, type Question } from '@/data/questions';
import { getQuestionCheckKey } from '@/features/questions/question-check-utils';

import {
  DEFAULT_DAILY_SETTINGS,
  EMPTY_DAILY_STUDY,
  getDailyQuestionLimit,
  type DailyChallengeSettings,
  type DailyStudyData,
} from './daily-challenge';

const STORAGE_KEY = 'study-experience.daily-challenge';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDayKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(value);
}

function isQuestion(value: unknown): value is Question {
  return (
    isObject(value) &&
    typeof value.question === 'string' &&
    typeof value.category === 'string' &&
    typeof value.shortAnswer === 'string' &&
    typeof value.longAnswer === 'string' &&
    Array.isArray(value.referenceUrls) &&
    value.referenceUrls.every((url) => typeof url === 'string')
  );
}

function parseSession(value: unknown): DailyStudyData['session'] {
  if (value === null) return null;
  if (
    !isObject(value) ||
    !isDayKey(value.day) ||
    !Array.isArray(value.questions) ||
    value.questions.length < 1 ||
    !value.questions.every(isQuestion) ||
    new Set(value.questions.map(getQuestionCheckKey)).size !== value.questions.length ||
    typeof value.reviewedCount !== 'number' ||
    !Number.isInteger(value.reviewedCount) ||
    value.reviewedCount < 0 ||
    value.reviewedCount >= value.questions.length
  ) {
    throw new Error('Invalid daily challenge session.');
  }

  return { day: value.day, questions: value.questions, reviewedCount: value.reviewedCount };
}

function parseSettings(value: unknown): DailyChallengeSettings {
  if (!isObject(value) || !Array.isArray(value.selectedCategories)) return DEFAULT_DAILY_SETTINGS;

  const savedCategories = new Set(value.selectedCategories);
  const selectedCategories = questionCategories.filter((category) => savedCategories.has(category));
  if (!selectedCategories.length) return DEFAULT_DAILY_SETTINGS;

  const count =
    Number.isInteger(value.questionCount) && typeof value.questionCount === 'number'
      ? value.questionCount
      : DEFAULT_DAILY_SETTINGS.questionCount;
  return {
    selectedCategories,
    questionCount: Math.max(1, Math.min(count, getDailyQuestionLimit(selectedCategories))),
  };
}

export async function loadDailyStudy(): Promise<DailyStudyData> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return EMPTY_DAILY_STUDY;

  const data: unknown = JSON.parse(serialized);
  if (
    !isObject(data) ||
    (data.version !== 1 && data.version !== 2) ||
    !Array.isArray(data.completedDays) ||
    !data.completedDays.every(isDayKey) ||
    typeof data.remindersEnabled !== 'boolean'
  ) {
    throw new Error('Invalid daily challenge data.');
  }

  const completedDays = [...new Set(data.completedDays)].sort();
  const session = parseSession(data.session);
  return {
    completedDays,
    session: session && !completedDays.includes(session.day) ? session : null,
    remindersEnabled: data.remindersEnabled,
    settings: data.version === 1 ? DEFAULT_DAILY_SETTINGS : parseSettings(data.settings),
  };
}

export function saveDailyStudy(data: DailyStudyData) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, ...data }));
}

export function withDailyStudyLock<T>(work: () => Promise<T>): Promise<T> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(STORAGE_KEY, work);
  }
  return work();
}

export function watchDailyStudyChanges(onChange: () => void) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
