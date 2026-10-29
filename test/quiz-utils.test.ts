import { questions } from '../src/data/questions';
import { createQuizQuestions, getQuestionsForCategories } from '../src/features/quiz/quiz-utils';

describe('quiz question selection', () => {
  it('returns the requested number of unique questions from selected categories', () => {
    const selectedCategories = ['AI', 'Javascript'];
    const selectedPool = getQuestionsForCategories(selectedCategories);
    const selectedQuestions = createQuizQuestions(selectedCategories, 5);

    expect(selectedQuestions).toHaveLength(5);
    expect(new Set(selectedQuestions.map(({ question }) => question)).size).toBe(5);
    expect(selectedQuestions.every(({ category }) => selectedCategories.includes(category))).toBe(
      true,
    );
    expect(selectedPool.length).toBeGreaterThanOrEqual(5);
  });

  it('caps the requested count at the available pool without changing the catalog', () => {
    const selectedCategories = ['Node'];
    const originalQuestions = questions.map((question) => ({ ...question }));
    const selectedQuestions = createQuizQuestions(selectedCategories, 999);

    expect(selectedQuestions).toHaveLength(getQuestionsForCategories(selectedCategories).length);
    expect(questions).toEqual(originalQuestions);
  });
});
