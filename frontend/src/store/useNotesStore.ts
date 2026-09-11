import { create } from 'zustand';
import { Note } from '@/types';
import { notesService } from '@/services';

interface NotesState {
  notes: Note[];
  currentUrlNotes: Note[];
  isLoading: boolean;
  searchQuery: string;
  selectedNote: Note | null;
  loadNotes: (url?: string) => Promise<void>;
  createNote: (input: { url: string; pageTitle?: string; selectionText?: string; content: string; color?: string; tags?: string[] }) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedNote: (note: Note | null) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentUrlNotes: [],
  isLoading: false,
  searchQuery: '',
  selectedNote: null,

  loadNotes: async (url?: string) => {
    set({ isLoading: true });
    try {
      const allNotes = await notesService.list();
      const currentUrlNotes = url ? await notesService.list(url) : allNotes;
      set({ notes: allNotes, currentUrlNotes, isLoading: false });
    } catch (err) {
      console.error('[NotesStore] Failed to load notes:', err);
      set({ isLoading: false });
    }
  },

  createNote: async (input) => {
    const created = await notesService.create(input);
    set((state) => ({
      notes: [created, ...state.notes],
      currentUrlNotes: [created, ...state.currentUrlNotes],
    }));
    return created;
  },

  updateNote: async (id, patch) => {
    const updated = await notesService.update(id, patch);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? updated : n)),
      currentUrlNotes: state.currentUrlNotes.map((n) => (n.id === id ? updated : n)),
      selectedNote: state.selectedNote?.id === id ? updated : state.selectedNote,
    }));
    return updated;
  },

  deleteNote: async (id) => {
    await notesService.remove(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      currentUrlNotes: state.currentUrlNotes.filter((n) => n.id !== id),
      selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
    }));
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),
}));
