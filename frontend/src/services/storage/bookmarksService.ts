import { BookmarkFilter, BookmarksService, CreateBookmarkInput } from '../api/bookmarks';
import { Bookmark } from '@/types';
import { storage } from './storage';

const BOOKMARKS_STORAGE_KEY = 'anvil_bookmarks_data';

export class StorageBookmarksService implements BookmarksService {
  private async getStored(): Promise<Bookmark[]> {
    let list = await storage.get<Bookmark[]>(BOOKMARKS_STORAGE_KEY, []);
    if (!list) list = [];
    return list.filter((b) => !b.id.startsWith('bm-seed-'));
  }

  private async save(bookmarks: Bookmark[]): Promise<void> {
    await storage.set(BOOKMARKS_STORAGE_KEY, bookmarks);
  }

  async list(filter?: BookmarkFilter): Promise<Bookmark[]> {
    let list = await this.getStored();
    if (filter?.contentType) {
      list = list.filter((b) => b.contentType === filter.contentType);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.snippet && b.snippet.toLowerCase().includes(q)) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async get(id: string): Promise<Bookmark | null> {
    const list = await this.getStored();
    return list.find((b) => b.id === id) || null;
  }

  async create(input: CreateBookmarkInput): Promise<Bookmark> {
    const list = await this.getStored();
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: input.title,
      url: input.url,
      snippet: input.snippet,
      contentType: input.contentType,
      contentId: input.contentId,
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
    };

    list.unshift(newBookmark);
    await this.save(list);
    return newBookmark;
  }

  async remove(id: string): Promise<void> {
    const list = await this.getStored();
    const filtered = list.filter((b) => b.id !== id);
    await this.save(filtered);
  }

  async toggle(input: CreateBookmarkInput): Promise<{ bookmark: Bookmark | null; isBookmarked: boolean }> {
    const list = await this.getStored();
    const existingIndex = list.findIndex(
      (b) =>
        (input.contentId && b.contentId === input.contentId) ||
        (!input.contentId && b.url === input.url && b.title === input.title)
    );

    if (existingIndex !== -1) {
      list.splice(existingIndex, 1);
      await this.save(list);
      return { bookmark: null, isBookmarked: false };
    } else {
      const created = await this.create(input);
      return { bookmark: created, isBookmarked: true };
    }
  }

  async isBookmarked(contentIdOrUrl: string): Promise<boolean> {
    const list = await this.getStored();
    return list.some((b) => b.contentId === contentIdOrUrl || b.url === contentIdOrUrl);
  }
}
