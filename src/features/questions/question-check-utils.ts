import type { Question } from '@/data/questions';

export type QuestionCheckFilter = 'all' | 'checked' | 'unchecked';

export function getQuestionCheckKey(question: Pick<Question, 'category' | 'question'>) {
  return JSON.stringify([question.category, question.question]);
}

export function matchesQuestionCheckFilter(
  question: Pick<Question, 'category' | 'question'>,
  filter: QuestionCheckFilter,
  checkedQuestionKeys: ReadonlySet<string>,
) {
  if (filter === 'all') return true;

  const isChecked = checkedQuestionKeys.has(getQuestionCheckKey(question));
  return filter === 'checked' ? isChecked : !isChecked;
}
