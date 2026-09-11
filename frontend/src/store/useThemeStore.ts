import { create } from 'zustand';
import { storage } from '@/services/storage/storage';
import { getAccentStyles } from '@/utils/color';

export type ThemeMode = 'dark' | 'light';

export interface PresetColor {
  id: string;
  name: string;
  color: string;
}

export const PRESET_ACCENT_COLORS: PresetColor[] = [
  { id: 'coral', name: 'Brand Coral (Default)', color: '#FF6845' },
  { id: 'sky', name: 'Electric Sky', color: '#38BDF8' },
  { id: 'emerald', name: 'Emerald Green', color: '#34D399' },
  { id: 'violet', name: 'Royal Violet', color: '#9B7CFF' },
  { id: 'amber', name: 'Amber Gold', color: '#F59E0B' },
  { id: 'rose', name: 'Rose Pink', color: '#F43F5E' },
  { id: 'cyan', name: 'Cyan Neon', color: '#06B6D4' },
  { id: 'silver', name: 'Minimal Silver', color: '#94A3B8' },
];

export const DEFAULT_ACCENT_COLOR = '#FF6845';

interface ThemeState {
  theme: ThemeMode;
  accentColor: string;
  isHydrated: boolean;
  setTheme: (theme: ThemeMode, persist?: boolean) => Promise<void>;
  setAccentColor: (color: string, persist?: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

export function applyThemeToDOM(theme: ThemeMode, accentColor: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    document.body.style.backgroundColor = '#0D0F10';
    document.body.style.color = '#F5F5F4';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    document.body.style.backgroundColor = '#F4F5F7';
    document.body.style.color = '#111827';
  }

  const styles = getAccentStyles(accentColor);
  for (const [prop, val] of Object.entries(styles)) {
    root.style.setProperty(prop, val);
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  accentColor: DEFAULT_ACCENT_COLOR,
  isHydrated: false,

  setTheme: async (theme: ThemeMode, persist = true) => {
    if (get().theme === theme && get().isHydrated) return;
    set({ theme });
    if (persist) {
      await storage.set('anvil_theme', theme);
    }
    applyThemeToDOM(theme, get().accentColor);
  },

  setAccentColor: async (accentColor: string, persist = true) => {
    if (get().accentColor === accentColor && get().isHydrated) return;
    set({ accentColor });
    if (persist) {
      await storage.set('anvil_accent_color', accentColor);
    }
    applyThemeToDOM(get().theme, accentColor);
  },

  hydrate: async () => {
    const savedTheme = await storage.get<ThemeMode>('anvil_theme', 'dark');
    const savedColor = await storage.get<string>('anvil_accent_color', DEFAULT_ACCENT_COLOR);
    set({ theme: savedTheme, accentColor: savedColor, isHydrated: true });
    applyThemeToDOM(savedTheme, savedColor);
  },
}));
