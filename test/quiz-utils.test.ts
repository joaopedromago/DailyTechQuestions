import { questions } from '../src/data/questions';
import { getQuestionCheckKey } from '../src/features/questions/question-check-utils';
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

  it('filters the selected-category pool by checked, unchecked, or all status before sampling', () => {
    const category = [...new Set(questions.map(({ category }) => category))].find(
      (candidate) =>
        questions.filter(({ category: questionCategory }) => questionCategory === candidate)
          .length >= 2,
    );
    expect(category).toBeDefined();
    const categoryQuestions = questions.filter(
      ({ category: questionCategory }) => questionCategory === category,
    );
    const differentCategoryQuestion = questions.find(
      ({ category: questionCategory }) => questionCategory !== category,
    );
    expect(differentCategoryQuestion).toBeDefined();

    const checkedQuestionKeys = new Set([
      getQuestionCheckKey(categoryQuestions[0]),
      getQuestionCheckKey(differentCategoryQuestion!),
    ]);
    const checkedQuestions = getQuestionsForCategories([category!], {
      checkFilter: 'checked',
      checkedQuestionKeys,
    });
    const uncheckedQuestions = getQuestionsForCategories([category!], {
      checkFilter: 'unchecked',
      checkedQuestionKeys,
    });
    const allQuestions = getQuestionsForCategories([category!], {
      checkFilter: 'all',
      checkedQuestionKeys,
    });

    expect(checkedQuestions.map(getQuestionCheckKey)).toEqual([
      getQuestionCheckKey(categoryQuestions[0]),
    ]);
    expect(uncheckedQuestions.map(getQuestionCheckKey)).toEqual(
      categoryQuestions.slice(1).map(getQuestionCheckKey),
    );
    expect(allQuestions).toHaveLength(categoryQuestions.length);
    expect(
      createQuizQuestions([category!], 10, { checkFilter: 'checked', checkedQuestionKeys }).map(
        getQuestionCheckKey,
      ),
    ).toEqual([getQuestionCheckKey(categoryQuestions[0])]);
  });
});
