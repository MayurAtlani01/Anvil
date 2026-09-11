import React, { useEffect } from 'react';
import { Flame, Clock, Brain, CheckCircle2, TrendingUp, Target, BarChart2, BookOpen, Play } from 'lucide-react';
import { useProgressStore } from '@/store/useProgressStore';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { formatTimeAgo } from '@/utils/cn';
import { cn } from '@/utils/cn';

interface ProgressProps {
  className?: string;
  onNavigateMode?: (mode: 'reading' | 'interview' | 'exam') => void;
}

export const Progress: React.FC<ProgressProps> = ({ className, onNavigateMode }) => {
  const { stats, isLoading, loadStats } = useProgressStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading || !stats) {
    return <LoadingState type="card" count={2} className={className} />;
  }

  const hasActivity =
    stats.totalStudyTimeMinutes > 0 ||
    stats.cardsReviewed > 0 ||
    stats.questionsSolved > 0 ||
    stats.interviewsCompleted > 0 ||
    stats.recentActivity.length > 0;

  if (!hasActivity) {
    return (
      <div className={cn('space-y-4 animate-fade-in text-zinc-900 dark:text-zinc-100', className)}>
        <EmptyState
          icon={BarChart2}
          title="No study progress recorded yet"
          description="Start reading articles, solving interview questions, or reviewing flashcards to build your personal analytics."
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-1">
            <span className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Study Streak
            </span>
            <div className="text-sm font-bold text-zinc-600 dark:text-zinc-400">0 Days</div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-1">
            <span className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Cards Mastered
            </span>
            <div className="text-sm font-bold text-zinc-600 dark:text-zinc-400">0 Cards</div>
          </div>
        </div>
      </div>
    );
  }

  const hours = Math.floor(stats.totalStudyTimeMinutes / 60);
  const minutes = stats.totalStudyTimeMinutes % 60;

  return (
    <div className={cn('space-y-3.5 animate-fade-in text-zinc-900 dark:text-zinc-100', className)}>
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Streak */}
        <div className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-base font-bold leading-none text-zinc-900 dark:text-zinc-100">
              {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'}
            </div>
            <div className="text-2xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
              Daily Streak
            </div>
          </div>
        </div>

        {/* Study Time */}
        <div className="p-3 rounded-lg border border-brand-200/80 dark:border-brand-900/40 bg-brand-50/40 dark:bg-brand-950/20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-brand-100 dark:bg-brand-900/60 flex items-center justify-center text-brand-600 dark:text-brand-300 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold leading-none text-zinc-900 dark:text-zinc-100">
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </div>
            <div className="text-2xs text-brand-700 dark:text-brand-400 font-medium mt-0.5">
              Study Time
            </div>
          </div>
        </div>

        {/* Cards Reviewed */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2.5 shadow-subtle">
          <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold leading-none text-zinc-900 dark:text-zinc-100">
              {stats.cardsReviewed}
            </div>
            <div className="text-2xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Cards Mastered
            </div>
          </div>
        </div>

        {/* Questions Solved */}
        <div className="p-3 rounded-lg border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold leading-none text-zinc-900 dark:text-zinc-100">
              {stats.questionsSolved}
            </div>
            <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              Questions Solved
            </div>
          </div>
        </div>
      </div>

      {/* Topic Accuracy Breakdown (if any topics solved) */}
      {stats.topicPerformance && stats.topicPerformance.length > 0 && (
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-brand-500" />
              Topic Performance
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {stats.topicPerformance.map((topic, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                    {topic.topic}
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    {topic.accuracy}% ({topic.correct}/{topic.total})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      topic.accuracy >= 85
                        ? 'bg-emerald-500'
                        : topic.accuracy >= 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    )}
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Log */}
      {stats.recentActivity.length > 0 && (
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shadow-subtle">
          <span className="text-xs font-semibold block mb-2">Recent Study Activity</span>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stats.recentActivity.slice(0, 5).map((act) => (
              <div key={act.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-medium text-2xs text-zinc-800 dark:text-zinc-200 capitalize">
                      {act.activityType.replace(/_/g, ' ')}
                    </div>
                    <div className="text-2xs text-zinc-400">
                      {act.metadata?.title || act.metadata?.roundTitle || act.metadata?.questionTitle || act.mode}
                    </div>
                  </div>
                </div>
                <span className="text-2xs font-mono text-zinc-400">
                  {formatTimeAgo(act.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
