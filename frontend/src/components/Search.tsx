import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Search: React.FC<SearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}) => {
  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <SearchIcon className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
