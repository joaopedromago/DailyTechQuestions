import questionData from './db.json';

export type Question = {
  question: string;
  shortAnswer: string;
  longAnswer: string;
  category: string;
  referenceUrls: string[];
};

export const questions = questionData as Question[];

export const questionCategories = [...new Set(questions.map(({ category }) => category))];

export function getCategoryLabel(category: string) {
  switch (category) {
    case 'ComputerScience':
      return 'Computer Science';
    case 'AI':
      return 'AI Tools';
    default:
      return category;
  }
}
