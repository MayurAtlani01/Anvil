import { CreateFlashcardInput, FlashcardFilter, FlashcardService } from '../api/flashcards';
import { Flashcard } from '@/types';
import { storage } from './storage';

const FLASHCARDS_STORAGE_KEY = 'anvil_flashcards_data';

export class StorageFlashcardsService implements FlashcardService {
  private async getStored(): Promise<Flashcard[]> {
    let cards = await storage.get<Flashcard[]>(FLASHCARDS_STORAGE_KEY, []);
    if (!cards) cards = [];
    return cards.filter((c) => !c.id.startsWith('fc-seed-'));
  }

  private async save(cards: Flashcard[]): Promise<void> {
    await storage.set(FLASHCARDS_STORAGE_KEY, cards);
  }

  async list(filter?: FlashcardFilter): Promise<Flashcard[]> {
    let cards = await this.getStored();
    if (filter?.deckId) {
      cards = cards.filter((c) => c.deckId === filter.deckId);
    }
    if (filter?.sourceMode) {
      cards = cards.filter((c) => c.sourceMode === filter.sourceMode);
    }
    if (filter?.dueOnly) {
      const now = new Date().toISOString();
      cards = cards.filter((c) => c.nextReviewDate <= now);
    }
    return cards.sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
  }

  async get(id: string): Promise<Flashcard | null> {
    const cards = await this.getStored();
    return cards.find((c) => c.id === id) || null;
  }

  async create(input: CreateFlashcardInput): Promise<Flashcard> {
    const cards = await this.getStored();
    const newCard: Flashcard = {
      id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      front: input.front,
      back: input.back,
      deckId: input.deckId || 'default',
      sourceUrl: input.sourceUrl,
      sourceMode: input.sourceMode || 'reading',
      contentType: input.contentType || 'note',
      difficulty: input.difficulty || 'medium',
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cards.unshift(newCard);
    await this.save(cards);
    return newCard;
  }

  async update(id: string, patch: Partial<Flashcard>): Promise<Flashcard> {
    const cards = await this.getStored();
    const index = cards.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Flashcard ${id} not found`);
    }

    const updated = {
      ...cards[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    cards[index] = updated;
    await this.save(cards);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const cards = await this.getStored();
    const filtered = cards.filter((c) => c.id !== id);
    await this.save(filtered);
  }

  async reviewQueue(deckId?: string): Promise<Flashcard[]> {
    const cards = await this.list({ deckId });
    const now = new Date().toISOString();
    return cards.filter((c) => c.nextReviewDate <= now);
  }

  /**
   * SuperMemo SM-2 Spaced Repetition calculation
   */
  async recordReview(id: string, rating: 1 | 2 | 3 | 4 | 5): Promise<Flashcard> {
    const cards = await this.getStored();
    const index = cards.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Flashcard ${id} not found`);
    }

    const card = cards[index];
    let { repetition, interval, easeFactor } = card;

    if (rating >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    // Adjust ease factor
    easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate next review date in days
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    const updated: Flashcard = {
      ...card,
      repetition,
      interval,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReviewDate: nextDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cards[index] = updated;
    await this.save(cards);
    return updated;
  }
}
