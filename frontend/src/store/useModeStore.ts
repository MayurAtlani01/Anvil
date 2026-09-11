import { create } from 'zustand';
import { Mode } from '@/types';
import { storage } from '@/services/storage/storage';

interface ActiveTabContext {
  id?: number;
  url: string;
  title: string;
  extractedText?: string;
  wordCount?: number;
}

interface ModeState {
  mode: Mode;
  subView: string;
  tabContext: ActiveTabContext;
  isHydrated: boolean;
  setMode: (mode: Mode, subView?: string) => void;
  setSubView: (subView: string) => void;
  setTabContext: (context: Partial<ActiveTabContext>) => void;
  hydrate: () => Promise<void>;
}

export const useModeStore = create<ModeState>((set, get) => ({
  mode: 'reading',
  subView: 'summary',
  tabContext: {
    url: '',
    title: '',
    extractedText: '',
    wordCount: 0,
  },
  isHydrated: false,

  setMode: (mode, subView) => {
    const defaultSubView = mode === 'reading' ? 'summary' : mode === 'interview' ? 'rounds' : 'pyqs';
    const activeSubView = subView || defaultSubView;
    set({ mode, subView: activeSubView });
    storage.set('anvil_active_mode', { mode, subView: activeSubView });
    storage.set('anvil_mode', mode);
  },

  setSubView: (subView) => {
    set({ subView });
    const { mode } = get();
    storage.set('anvil_active_mode', { mode, subView });
  },

  setTabContext: (context) => {
    set((state) => ({
      tabContext: { ...state.tabContext, ...context },
    }));
  },

  hydrate: async () => {
    const rawMode = await storage.get<string>('anvil_mode', 'reading');
    const saved = await storage.get<{ mode: Mode; subView: string }>('anvil_active_mode', {
      mode: (rawMode as Mode) || 'reading',
      subView: rawMode === 'interview' ? 'rounds' : rawMode === 'exam' ? 'pyqs' : 'summary',
    });
    const effectiveMode = (rawMode as Mode) || saved.mode || 'reading';
    const effectiveSubView = saved.subView || (effectiveMode === 'reading' ? 'summary' : effectiveMode === 'interview' ? 'rounds' : 'pyqs');
    set({ mode: effectiveMode, subView: effectiveSubView, isHydrated: true });
  },
}));
