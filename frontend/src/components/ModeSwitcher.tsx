import React from 'react';
import { BookOpen, Briefcase, GraduationCap } from 'lucide-react';
import { Mode } from '@/types';
import { useModeStore } from '@/store/useModeStore';
import { cn } from '@/utils/cn';

interface ModeSwitcherProps {
  className?: string;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ className }) => {
  const { mode, setMode } = useModeStore();

  const modes: Array<{ id: Mode; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'interview', label: 'Interview', icon: Briefcase },
    { id: 'exam', label: 'Exam', icon: GraduationCap },
  ];

  return (
    <div
      className={cn(
        'grid grid-cols-3 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium',
        className
      )}
    >
      {modes.map((item) => {
        const Icon = item.icon;
        const isActive = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 select-none',
              isActive
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-subtle'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            <Icon
              className={cn(
                'w-3.5 h-3.5 transition-colors',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400'
              )}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
