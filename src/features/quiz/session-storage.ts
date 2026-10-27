import AsyncStorage from '@react-native-async-storage/async-storage';

import type { QuizSession } from './quiz-session';

const QUIZ_SESSION_KEY = 'study-experience.quiz-session';

function isQuestion(value: unknown): value is QuizSession['questions'][number] {
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

export function isQuizSession(value: unknown): value is QuizSession {
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

export async function loadQuizSession(): Promise<QuizSession | null> {
  const serializedSession = await AsyncStorage.getItem(QUIZ_SESSION_KEY);
  if (!serializedSession) return null;

  try {
    const session: unknown = JSON.parse(serializedSession);
    if (isQuizSession(session)) return session;
  } catch {
    // Treat malformed data like an absent session.
  }

  await AsyncStorage.removeItem(QUIZ_SESSION_KEY);
  return null;
}

export function saveQuizSession(session: QuizSession) {
  return AsyncStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
}

export function clearQuizSession() {
  return AsyncStorage.removeItem(QUIZ_SESSION_KEY);
}
