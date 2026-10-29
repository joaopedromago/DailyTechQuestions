import AsyncStorage from '@react-native-async-storage/async-storage';

import type { QuizHistoryEntry } from './quiz-session';

const QUIZ_HISTORY_KEY = 'study-experience.quiz-history';
const LEGACY_QUIZ_SESSION_KEY = 'study-experience.quiz-session';

function isQuestion(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const question = value as Record<string, unknown>;

  return (
    typeof question.question === 'string' &&
    typeof question.shortAnswer === 'string' &&
    typeof question.longAnswer === 'string' &&
    typeof question.category === 'string' &&
    Array.isArray(question.referenceUrls) &&
    question.referenceUrls.every((url) => typeof url === 'string')
  );
}

function isQuizSession(
  value: unknown,
): value is Omit<QuizHistoryEntry, 'id' | 'createdAt' | 'completedAt'> {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;

  return (
    Array.isArray(session.selectedCategories) &&
    session.selectedCategories.every((category) => typeof category === 'string') &&
    Array.isArray(session.questions) &&
    session.questions.length > 0 &&
    session.questions.every(isQuestion) &&
    Number.isInteger(session.currentPosition) &&
    (session.currentPosition as number) >= 0 &&
    (session.currentPosition as number) < session.questions.length
  );
}

function isHistoryEntry(value: unknown): value is QuizHistoryEntry {
  if (!isQuizSession(value)) return false;
  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    typeof entry.createdAt === 'string' &&
    !Number.isNaN(Date.parse(entry.createdAt)) &&
    (entry.completedAt === undefined ||
      (typeof entry.completedAt === 'string' && !Number.isNaN(Date.parse(entry.completedAt))))
  );
}

function createMigratedSessionId(timestamp: number) {
  return timestamp.toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export async function loadQuizHistory(): Promise<QuizHistoryEntry[]> {
  let history: QuizHistoryEntry[] | null = null;
  const serializedHistory = await AsyncStorage.getItem(QUIZ_HISTORY_KEY);

  if (serializedHistory) {
    try {
      const stored: unknown = JSON.parse(serializedHistory);
      if (
        stored &&
        typeof stored === 'object' &&
        (stored as Record<string, unknown>).version === 1 &&
        Array.isArray((stored as Record<string, unknown>).history)
      ) {
        history = (stored as { history: unknown[] }).history.filter(isHistoryEntry);
      } else {
        await AsyncStorage.removeItem(QUIZ_HISTORY_KEY);
      }
    } catch {
      await AsyncStorage.removeItem(QUIZ_HISTORY_KEY);
    }
  }

  const serializedLegacySession = await AsyncStorage.getItem(LEGACY_QUIZ_SESSION_KEY);
  if (!serializedLegacySession) return history ?? [];

  if (history && history.length > 0) {
    await AsyncStorage.removeItem(LEGACY_QUIZ_SESSION_KEY).catch(() => {});
    return history;
  }

  let legacySession: unknown;
  try {
    legacySession = JSON.parse(serializedLegacySession);
  } catch {
    // Treat malformed legacy data like an absent session.
  }

  if (isQuizSession(legacySession)) {
    const now = new Date();
    const migratedSession: QuizHistoryEntry = {
      ...legacySession,
      id: createMigratedSessionId(now.getTime()),
      createdAt: now.toISOString(),
    };
    const migratedHistory = [...(history ?? []), migratedSession];
    await saveQuizHistory(migratedHistory);
    await AsyncStorage.removeItem(LEGACY_QUIZ_SESSION_KEY).catch(() => {});
    return migratedHistory;
  }

  await AsyncStorage.removeItem(LEGACY_QUIZ_SESSION_KEY).catch(() => {});
  return history ?? [];
}

export function saveQuizHistory(history: QuizHistoryEntry[]) {
  return AsyncStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify({ version: 1, history }));
}
