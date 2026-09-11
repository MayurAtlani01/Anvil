import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCw, X } from 'lucide-react';
import { useFlashcardsStore } from '@/store/useFlashcardsStore';
import { useToastStore } from '@/store/useToastStore';
import { EmptyState } from './EmptyState';
import { cn } from '@/utils/cn';

export const FlashcardReview: React.FC = () => {
  const {
    reviewQueue,
    activeReviewIndex,
    submitReviewRating,
    nextCard,
    prevCard,
    endReview,
  } = useFlashcardsStore();

  const [isFlipped, setIsFlipped] = useState(false);
  const { addToast } = useToastStore();

  if (reviewQueue.length === 0) {
    return (
      <EmptyState
        title="All caught up!"
        description="No flashcards due for review right now. Check back tomorrow or add new cards."
        actionLabel="Back to Deck"
        onAction={endReview}
      />
    );
  }

  const currentCard = reviewQueue[activeReviewIndex];
  const progressPercent = Math.round(((activeReviewIndex + 1) / reviewQueue.length) * 100);

  const handleRate = async (rating: 1 | 2 | 3 | 4 | 5) => {
    setIsFlipped(false);
    await submitReviewRating(rating);
    addToast({
      type: 'info',
      message: `Recorded review score (${rating}/5). Spaced interval adjusted.`,
    });
  };

  return (
    <div className="space-y-3 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Spaced Review Session</span>
          <span className="text-2xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800/60">
            {activeReviewIndex + 1} / {reviewQueue.length}
          </span>
        </div>

        <button
          onClick={endReview}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className={cn(
          'cursor-pointer min-h-[180px] p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-elevated flex flex-col justify-between text-center select-none transition-all duration-200',
          isFlipped && 'bg-zinc-50 dark:bg-zinc-850/80 border-brand-300 dark:border-brand-700'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {isFlipped ? 'Answer' : 'Question / Prompt'}
          </span>
          <span className="text-2xs text-zinc-400 flex items-center gap-1">
            <RotateCw className="w-3 h-3" />
            Click to reveal
          </span>
        </div>

        <div className="my-4">
          <p className="text-sm font-medium leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-100">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <div className="text-2xs text-zinc-400">
          Repetitions: {currentCard.repetition} • Ease: {currentCard.easeFactor}x
        </div>
      </div>

      {/* Rating Buttons (SuperMemo SM-2 Quality Scores 1..5) */}
      {isFlipped ? (
        <div className="space-y-1.5 pt-1">
          <span className="text-2xs text-zinc-500 block text-center font-medium">
            How well did you recall this?
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => handleRate(1)}
              className="py-1.5 px-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-medium hover:bg-rose-100 transition-colors"
            >
              1. Forgot
            </button>
            <button
              onClick={() => handleRate(3)}
              className="py-1.5 px-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              3. Hard
            </button>
            <button
              onClick={() => handleRate(4)}
              className="py-1.5 px-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              4. Good
            </button>
            <button
              onClick={() => handleRate(5)}
              className="py-1.5 px-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              5. Easy
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={prevCard}
            disabled={activeReviewIndex === 0}
            className="px-3 py-1.5 rounded text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <button
            onClick={() => setIsFlipped(true)}
            className="px-4 py-1.5 rounded text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-subtle transition-colors flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Show Answer
          </button>

          <button
            onClick={nextCard}
            disabled={activeReviewIndex === reviewQueue.length - 1}
            className="px-3 py-1.5 rounded text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
