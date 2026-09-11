import { create } from 'zustand';
import { Flashcard, Mode } from '@/types';
import { flashcardsService, CreateFlashcardInput } from '@/services';

interface FlashcardsState {
  flashcards: Flashcard[];
  reviewQueue: Flashcard[];
  activeReviewIndex: number;
  isReviewing: boolean;
  isLoading: boolean;
  selectedModeFilter: Mode | 'all';
  loadFlashcards: () => Promise<void>;
  createFlashcard: (input: CreateFlashcardInput) => Promise<Flashcard>;
  updateFlashcard: (id: string, patch: Partial<Flashcard>) => Promise<Flashcard>;
  deleteFlashcard: (id: string) => Promise<void>;
  startReview: (deckId?: string) => Promise<void>;
  submitReviewRating: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  nextCard: () => void;
  prevCard: () => void;
  endReview: () => void;
  setSelectedModeFilter: (mode: Mode | 'all') => void;
}

export const useFlashcardsStore = create<FlashcardsState>((set, get) => ({
  flashcards: [],
  reviewQueue: [],
  activeReviewIndex: 0,
  isReviewing: false,
  isLoading: false,
  selectedModeFilter: 'all',

  loadFlashcards: async () => {
    set({ isLoading: true });
    try {
      const flashcards = await flashcardsService.list();
      const reviewQueue = await flashcardsService.reviewQueue();
      set({ flashcards, reviewQueue, isLoading: false });
    } catch (err) {
      console.error('[FlashcardsStore] Failed to load flashcards:', err);
      set({ isLoading: false });
    }
  },

  createFlashcard: async (input) => {
    const created = await flashcardsService.create(input);
    set((state) => ({
      flashcards: [created, ...state.flashcards],
      reviewQueue: [created, ...state.reviewQueue],
    }));
    return created;
  },

  updateFlashcard: async (id, patch) => {
    const updated = await flashcardsService.update(id, patch);
    set((state) => ({
      flashcards: state.flashcards.map((f) => (f.id === id ? updated : f)),
      reviewQueue: state.reviewQueue.map((f) => (f.id === id ? updated : f)),
    }));
    return updated;
  },

  deleteFlashcard: async (id) => {
    await flashcardsService.remove(id);
    set((state) => ({
      flashcards: state.flashcards.filter((f) => f.id !== id),
      reviewQueue: state.reviewQueue.filter((f) => f.id !== id),
    }));
  },

  startReview: async (deckId) => {
    const { flashcards } = get();
    const queue = flashcards.length > 0 ? flashcards : await flashcardsService.reviewQueue(deckId);
    set({
      reviewQueue: queue,
      activeReviewIndex: 0,
      isReviewing: true,
    });
  },

  submitReviewRating: async (rating) => {
    const { reviewQueue, activeReviewIndex } = get();
    if (!reviewQueue[activeReviewIndex]) return;

    const currentCard = reviewQueue[activeReviewIndex];
    const updatedCard = await flashcardsService.recordReview(currentCard.id, rating);

    set((state) => ({
      flashcards: state.flashcards.map((f) => (f.id === currentCard.id ? updatedCard : f)),
    }));

    if (activeReviewIndex < reviewQueue.length - 1) {
      set({ activeReviewIndex: activeReviewIndex + 1 });
    } else {
      set({ isReviewing: false, activeReviewIndex: 0 });
    }
  },

  nextCard: () => {
    const { activeReviewIndex, reviewQueue } = get();
    if (activeReviewIndex < reviewQueue.length - 1) {
      set({ activeReviewIndex: activeReviewIndex + 1 });
    }
  },

  prevCard: () => {
    const { activeReviewIndex } = get();
    if (activeReviewIndex > 0) {
      set({ activeReviewIndex: activeReviewIndex - 1 });
    }
  },

  endReview: () => {
    set({ isReviewing: false, activeReviewIndex: 0 });
  },

  setSelectedModeFilter: (selectedModeFilter) => set({ selectedModeFilter }),
}));
