import { create } from 'zustand';
import { ProgressStats } from '@/types';
import { progressService } from '@/services';

interface ProgressStoreState {
  stats: ProgressStats | null;
  isLoading: boolean;
  loadStats: () => Promise<void>;
  resetStats: () => Promise<void>;
}

export const useProgressStore = create<ProgressStoreState>((set) => ({
  stats: null,
  isLoading: false,

  loadStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await progressService.getStats();
      set({ stats, isLoading: false });
    } catch (err) {
      console.error('[ProgressStore] Failed to load stats:', err);
      set({ isLoading: false });
    }
  },

  resetStats: async () => {
    await progressService.resetStats();
    const stats = await progressService.getStats();
    set({ stats });
  },
}));
