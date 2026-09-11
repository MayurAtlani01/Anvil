import { create } from 'zustand';
import { Bookmark, ContentType } from '@/types';
import { bookmarksService } from '@/services';

interface BookmarksState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  filterType: ContentType | 'all';
  searchQuery: string;
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (input: { title: string; url: string; snippet?: string; contentType: ContentType; contentId?: string; tags?: string[] }) => Promise<boolean>;
  deleteBookmark: (id: string) => Promise<void>;
  setFilterType: (type: ContentType | 'all') => void;
  setSearchQuery: (query: string) => void;
  isBookmarked: (contentIdOrUrl: string) => boolean;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  filterType: 'all',
  searchQuery: '',

  loadBookmarks: async () => {
    set({ isLoading: true });
    try {
      const bookmarks = await bookmarksService.list();
      set({ bookmarks, isLoading: false });
    } catch (err) {
      console.error('[BookmarksStore] Failed to load bookmarks:', err);
      set({ isLoading: false });
    }
  },

  toggleBookmark: async (input) => {
    const { isBookmarked, bookmark } = await bookmarksService.toggle(input);
    if (isBookmarked && bookmark) {
      set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }));
    } else {
      set((state) => ({
        bookmarks: state.bookmarks.filter(
          (b) =>
            (input.contentId && b.contentId !== input.contentId) ||
            (!input.contentId && (b.url !== input.url || b.title !== input.title))
        ),
      }));
    }
    return isBookmarked;
  },

  deleteBookmark: async (id) => {
    await bookmarksService.remove(id);
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },

  setFilterType: (filterType) => set({ filterType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  isBookmarked: (contentIdOrUrl) => {
    const { bookmarks } = get();
    return bookmarks.some((b) => b.contentId === contentIdOrUrl || b.url === contentIdOrUrl);
  },
}));
