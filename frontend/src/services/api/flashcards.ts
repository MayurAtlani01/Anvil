import { Flashcard, DifficultyLevel, Mode, ContentType } from '@/types';

export interface CreateFlashcardInput {
  front: string;
  back: string;
  deckId?: string;
  sourceUrl?: string;
  sourceMode?: Mode;
  contentType?: ContentType;
  difficulty?: DifficultyLevel;
}

export interface FlashcardFilter {
  deckId?: string;
  sourceMode?: Mode;
  dueOnly?: boolean;
}

export interface FlashcardService {
  list(filter?: FlashcardFilter): Promise<Flashcard[]>;
  get(id: string): Promise<Flashcard | null>;
  create(input: CreateFlashcardInput): Promise<Flashcard>;
  update(id: string, patch: Partial<Flashcard>): Promise<Flashcard>;
  remove(id: string): Promise<void>;
  reviewQueue(deckId?: string): Promise<Flashcard[]>;
  recordReview(id: string, rating: 1 | 2 | 3 | 4 | 5): Promise<Flashcard>;
}
