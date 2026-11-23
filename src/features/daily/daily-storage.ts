import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Question } from '@/data/questions';
import { getQuestionCheckKey } from '@/features/questions/question-check-utils';

import { DAILY_QUESTION_COUNT, EMPTY_DAILY_STUDY, type DailyStudyData } from './daily-challenge';

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
    value.questions.length !== DAILY_QUESTION_COUNT ||
    !value.questions.every(isQuestion) ||
    new Set(value.questions.map(getQuestionCheckKey)).size !== DAILY_QUESTION_COUNT ||
    typeof value.reviewedCount !== 'number' ||
    !Number.isInteger(value.reviewedCount) ||
    value.reviewedCount < 0 ||
    value.reviewedCount >= DAILY_QUESTION_COUNT
  ) {
    throw new Error('Invalid daily challenge session.');
  }

  return { day: value.day, questions: value.questions, reviewedCount: value.reviewedCount };
}

export async function loadDailyStudy(): Promise<DailyStudyData> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return EMPTY_DAILY_STUDY;

  const data: unknown = JSON.parse(serialized);
  if (
    !isObject(data) ||
    data.version !== 1 ||
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
  };
}

export function saveDailyStudy(data: DailyStudyData) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...data }));
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
