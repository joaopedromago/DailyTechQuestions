import { questions, type Question } from '@/data/questions';

export function getQuestionsForCategories(selectedCategories: readonly string[]) {
  const selected = new Set(selectedCategories);
  return questions
    .filter(({ category }) => selected.has(category))
    .map((question) => ({ ...question, referenceUrls: [...question.referenceUrls] }));
}

export function shuffleQuestions<T>(items: readonly T[], random = Math.random): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createQuizQuestions(
  selectedCategories: readonly string[],
  questionCount: number,
): Question[] {
  const availableQuestions = getQuestionsForCategories(selectedCategories);
  const count = Number.isFinite(questionCount)
    ? Math.max(0, Math.min(availableQuestions.length, Math.floor(questionCount)))
    : availableQuestions.length;

  return shuffleQuestions(availableQuestions).slice(0, count);
}
