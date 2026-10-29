import { questions, type Question } from '@/data/questions';
import {
  matchesQuestionCheckFilter,
  type QuestionCheckFilter,
} from '@/features/questions/question-check-utils';

type QuestionSelectionOptions = {
  checkFilter?: QuestionCheckFilter;
  checkedQuestionKeys?: ReadonlySet<string>;
};

const EMPTY_CHECKED_QUESTION_KEYS: ReadonlySet<string> = new Set();

export function getQuestionsForCategories(
  selectedCategories: readonly string[],
  {
    checkFilter = 'all',
    checkedQuestionKeys = EMPTY_CHECKED_QUESTION_KEYS,
  }: QuestionSelectionOptions = {},
) {
  const selected = new Set(selectedCategories);
  return questions
    .filter(
      (question) =>
        selected.has(question.category) &&
        matchesQuestionCheckFilter(question, checkFilter, checkedQuestionKeys),
    )
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
  selectionOptions: QuestionSelectionOptions = {},
): Question[] {
  const availableQuestions = getQuestionsForCategories(selectedCategories, selectionOptions);
  const count = Number.isFinite(questionCount)
    ? Math.max(0, Math.min(availableQuestions.length, Math.floor(questionCount)))
    : availableQuestions.length;

  return shuffleQuestions(availableQuestions).slice(0, count);
}
