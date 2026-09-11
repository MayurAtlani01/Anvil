import React from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useBookmarksStore } from '@/store/useBookmarksStore';
import { useToastStore } from '@/store/useToastStore';
import { ContentType } from '@/types';
import { cn } from '@/utils/cn';

interface BookmarkButtonProps {
  contentId?: string;
  url: string;
  title: string;
  snippet?: string;
  contentType: ContentType;
  tags?: string[];
  size?: 'sm' | 'md';
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  contentId,
  url,
  title,
  snippet,
  contentType,
  tags,
  size = 'sm',
  className,
}) => {
  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const { addToast } = useToastStore();

  const bookmarked = isBookmarked(contentId || url);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await toggleBookmark({
      contentId,
      url,
      title,
      snippet,
      contentType,
      tags,
    });

    addToast({
      type: result ? 'success' : 'info',
      message: result ? `Saved to bookmarks` : `Removed from bookmarks`,
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark item'}
      className={cn(
        'inline-flex items-center justify-center rounded p-1 transition-colors',
        size === 'md' ? 'w-7 h-7' : 'w-5 h-5',
        bookmarked
          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
        className
      )}
    >
      <BookmarkIcon
        className={cn(
          size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5',
          bookmarked && 'fill-current'
        )}
      />
    </button>
  );
};
