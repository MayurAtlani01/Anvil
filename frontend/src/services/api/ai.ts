import { AnswerFeedback, DictionaryEntry, Flashcard, TranslationResult } from '@/types';

export interface AIService {
  summarize(text: string, title?: string): Promise<{ summary: string; bulletPoints: string[]; keyEntities: string[]; readTimeMin: number }>;
  explain(text: string, context?: string): Promise<{ explanation: string; simplified: string; practicalExample: string; relatedConcepts: string[] }>;
  translate(text: string, targetLang: string): Promise<TranslationResult>;
  defineWord(word: string): Promise<DictionaryEntry | null>;
  generateFlashcards(text: string, count?: number): Promise<Array<{ front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' }>>;
  evaluateAnswer(questionTitle: string, questionPrompt: string, answerText: string, rubrics?: string[]): Promise<AnswerFeedback>;
}
