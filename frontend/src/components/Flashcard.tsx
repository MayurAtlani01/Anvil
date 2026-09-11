import React, { useState } from 'react';
import { RotateCw, Trash2, Edit3, Calendar, Sparkles } from 'lucide-react';
import { Flashcard as FlashcardType } from '@/types';
import { formatDate } from '@/utils/cn';
import { cn } from '@/utils/cn';

interface FlashcardProps {
  card: FlashcardType;
  onDelete?: (id: string) => void;
  onEdit?: (card: FlashcardType) => void;
  className?: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  card,
  onDelete,
  onEdit,
  className,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className={cn(
        'cursor-pointer group relative min-h-[140px] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-subtle hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150 flex flex-col justify-between select-none',
        isFlipped && 'bg-zinc-50/70 dark:bg-zinc-850/50 border-brand-200 dark:border-brand-900/40',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-2xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {isFlipped ? 'Answer / Back' : 'Question / Front'}
          </span>
          <span className="text-2xs px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
            {card.sourceMode}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center my-1 text-center">
        <p className="text-xs font-medium leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-200">
          {isFlipped ? card.back : card.front}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-2xs text-zinc-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Next: {formatDate(card.nextReviewDate)}</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400 group-hover:text-brand-500 transition-colors">
          <RotateCw className="w-3 h-3" />
          <span>Click to flip</span>
        </div>
      </div>
    </div>
  );
};
