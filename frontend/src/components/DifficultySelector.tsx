import React from 'react';
import { DifficultyLevel } from '@/types';
import { cn } from '@/utils/cn';

interface DifficultySelectorProps {
  value: DifficultyLevel | 'all';
  onChange: (diff: DifficultyLevel | 'all') => void;
  allowAll?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  allowAll = true,
  size = 'sm',
  className,
}) => {
  const options: Array<{ id: DifficultyLevel | 'all'; label: string; color: string }> = [
    ...(allowAll ? [{ id: 'all' as const, label: 'All', color: 'text-zinc-600 dark:text-zinc-400' }] : []),
    { id: 'easy', label: 'Easy', color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'medium', label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
    { id: 'hard', label: 'Hard', color: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'px-2 py-0.5 rounded text-2xs font-medium transition-all duration-120',
              size === 'md' && 'px-2.5 py-1 text-xs',
              isSelected
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-subtle font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            )}
          >
            <span className={isSelected ? opt.color : ''}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
