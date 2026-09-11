import { Bookmark, ContentType } from '@/types';

export interface CreateBookmarkInput {
  title: string;
  url: string;
  snippet?: string;
  contentType: ContentType;
  contentId?: string;
  tags?: string[];
}

export interface BookmarkFilter {
  contentType?: ContentType;
  search?: string;
}

export interface BookmarksService {
  list(filter?: BookmarkFilter): Promise<Bookmark[]>;
  get(id: string): Promise<Bookmark | null>;
  create(input: CreateBookmarkInput): Promise<Bookmark>;
  remove(id: string): Promise<void>;
  toggle(input: CreateBookmarkInput): Promise<{ bookmark: Bookmark | null; isBookmarked: boolean }>;
  isBookmarked(contentIdOrUrl: string): Promise<boolean>;
}
