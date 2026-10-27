import { questionCategories, questions, type Question } from '@/data/questions';

export type IndexedQuestion = { question: Question; index: number };

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function filterQuestions(query: string, selectedCategories: readonly string[]) {
  const normalizedQuery = normalizeSearchText(query.trim());
  const selected = new Set(selectedCategories);

  return questions.reduce<IndexedQuestion[]>((matches, question, index) => {
    const matchesCategory = selected.has(question.category);
    const searchableText = normalizeSearchText(`${question.question} ${question.shortAnswer}`);
    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

    if (matchesCategory && matchesQuery) matches.push({ question, index });
    return matches;
  }, []);
}

export function getQuestionCategories() {
  return questionCategories;
}
