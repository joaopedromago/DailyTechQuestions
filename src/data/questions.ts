import questionData from './db.json';

export type Question = {
  question: string;
  shortAnswer: string;
  longAnswer: string;
  category: string;
  referenceUrls: string[];
};

export const JAVASCRIPT_CODE_CATEGORY = 'JavascriptCode';
export const JAVASCRIPT_CODE_PROMPT = 'What this code do?';

export const questions = questionData as Question[];

export const questionCategories = [...new Set(questions.map(({ category }) => category))];

export function isJavascriptCodeQuestion(question: Pick<Question, 'category'>) {
  return question.category === JAVASCRIPT_CODE_CATEGORY;
}

export function getQuestionPrompt(question: Pick<Question, 'category' | 'question'>) {
  return isJavascriptCodeQuestion(question) ? JAVASCRIPT_CODE_PROMPT : question.question;
}

export function getCategoryLabel(category: string) {
  switch (category) {
    case 'ComputerScience':
      return 'Computer Science';
    case 'AI':
      return 'AI Tools';
    case 'SystemDesign':
      return 'System Design';
    case JAVASCRIPT_CODE_CATEGORY:
      return 'JavaScript Code';
    default:
      return category;
  }
}
