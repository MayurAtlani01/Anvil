import React from 'react';
import { cn } from '@/utils/cn';

interface LoadingStateProps {
  type?: 'card' | 'list' | 'text' | 'table' | 'ai';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'card',
  count = 3,
  className,
}) => {
  if (type === 'ai') {
    return (
      <div className={cn('space-y-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 animate-pulse', className)}>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-brand-200 dark:bg-brand-900/50" />
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6" />
        </div>
        <div className="pt-2 flex gap-2">
          <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={cn('space-y-2 animate-pulse', className)}>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/5" />
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn('divide-y divide-zinc-100 dark:divide-zinc-800 animate-pulse', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="py-2.5 flex items-center justify-between">
            <div className="space-y-1.5 flex-1 mr-4">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              <div className="h-2.5 bg-zinc-100 dark:bg-zinc-850 rounded w-1/3" />
            </div>
            <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // default card
  return (
    <div className={cn('space-y-2.5 animate-pulse', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/5" />
            <div className="h-4 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-850 rounded w-4/5" />
          <div className="flex items-center gap-1.5 pt-1">
            <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-10 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
