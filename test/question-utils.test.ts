import { getCategoryLabel, questionCategories, questions } from '../src/data/questions';
import { filterQuestions, normalizeSearchText } from '../src/features/questions/question-utils';
import { getQuestionsForCategories, shuffleQuestions } from '../src/features/quiz/quiz-utils';

describe('question catalog helpers', () => {
  it('derives unique categories and displays the planned labels', () => {
    expect(new Set(questionCategories).size).toBe(questionCategories.length);
    expect(questionCategories).toEqual(expect.arrayContaining(['ComputerScience', 'AI']));
    expect(getCategoryLabel('ComputerScience')).toBe('Computer Science');
    expect(getCategoryLabel('AI')).toBe('AI Tools');
  });

  it('normalizes case and accents for substring searches', () => {
    expect(normalizeSearchText('Árvore CAFÉ')).toBe('arvore cafe');
  });

  it('matches question and quick-answer text while applying categories', () => {
    const question = questions[0];
    expect(filterQuestions(question.question, [question.category]).map(({ question: item }) => item)).toContainEqual(
      question,
    );
    expect(filterQuestions(question.shortAnswer, [question.category]).map(({ question: item }) => item)).toContainEqual(
      question,
    );
    expect(filterQuestions(question.question, ['missing-category'])).toEqual([]);
    expect(filterQuestions('', [])).toEqual([]);
  });

  it('shuffles a copy and includes each selected catalog question once', () => {
    const source = questions.slice(0, 5);
    const before = JSON.stringify(source);
    const randomValues = [0, 0, 0, 0];
    const shuffled = shuffleQuestions(source, () => randomValues.shift() ?? 0);

    expect(shuffled).not.toBe(source);
    expect([...shuffled].sort((a, b) => a.question.localeCompare(b.question))).toEqual(
      [...source].sort((a, b) => a.question.localeCompare(b.question)),
    );
    expect(JSON.stringify(source)).toBe(before);

    const category = source[0].category;
    const selected = getQuestionsForCategories([category]);
    expect(selected.every((item) => item.category === category)).toBe(true);
    expect(selected).toHaveLength(questions.filter((item) => item.category === category).length);
  });
});
