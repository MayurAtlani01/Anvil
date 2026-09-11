import React from 'react';
import { cn } from '@/utils/cn';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FiltersProps {
  options: FilterOption[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'xs';
}

export const Filters: React.FC<FiltersProps> = ({
  options,
  selectedId,
  onChange,
  className,
  size = 'sm',
}) => {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5', className)}>
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'whitespace-nowrap rounded-md font-medium transition-colors flex items-center gap-1.5',
              size === 'xs' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
              isSelected
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-subtle'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'text-2xs rounded-full px-1',
                  isSelected
                    ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
