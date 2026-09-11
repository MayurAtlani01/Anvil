import React, { useState } from 'react';
import { Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LoadingState } from './LoadingState';
import { useToastStore } from '@/store/useToastStore';

interface AIResponseProps {
  title?: string;
  badgeText?: string;
  summaryText?: string;
  bulletPoints?: string[];
  simplified?: string;
  practicalExample?: string;
  relatedConcepts?: string[];
  score?: number;
  isLoading?: boolean;
  onAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const AIResponse: React.FC<AIResponseProps> = ({
  title,
  badgeText = 'Anvil AI Synthesis',
  summaryText,
  bulletPoints,
  simplified,
  practicalExample,
  relatedConcepts,
  score,
  isLoading,
  onAction,
  className,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { addToast } = useToastStore();

  if (isLoading) {
    return <LoadingState type="ai" className={className} />;
  }

  const handleCopy = () => {
    const fullText = [
      title,
      summaryText,
      bulletPoints ? bulletPoints.map((b) => `• ${b}`).join('\n') : '',
      simplified ? `Simplified: ${simplified}` : '',
      practicalExample ? `Example: ${practicalExample}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    addToast({ type: 'success', message: 'Copied AI response to clipboard' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle overflow-hidden text-zinc-900 dark:text-zinc-100 animate-fade-in',
        className
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50/70 dark:bg-zinc-850/50 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-2xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            {badgeText}
          </span>
          {score !== undefined && (
            <span
              className={cn(
                'text-2xs font-bold px-1.5 py-0.5 rounded border',
                score >= 85
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : score >= 70
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              )}
            >
              Score: {score}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy summary"
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 text-xs leading-relaxed">
          {title && <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{title}</h4>}

          {summaryText && (
            <p className="text-zinc-700 dark:text-zinc-300 leading-normal">{summaryText}</p>
          )}

          {bulletPoints && bulletPoints.length > 0 && (
            <ul className="space-y-1.5 pl-3 border-l-2 border-brand-200 dark:border-brand-800/80 my-2">
              {bulletPoints.map((pt, i) => (
                <li key={i} className="text-zinc-700 dark:text-zinc-300 text-xs">
                  {pt}
                </li>
              ))}
            </ul>
          )}

          {simplified && (
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                Plain English intuition
              </span>
              <p className="text-zinc-700 dark:text-zinc-300">{simplified}</p>
            </div>
          )}

          {practicalExample && (
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                Practical Application
              </span>
              <p className="text-zinc-700 dark:text-zinc-300 font-mono text-2xs">{practicalExample}</p>
            </div>
          )}

          {relatedConcepts && relatedConcepts.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-2xs text-zinc-400 font-medium">Related:</span>
              {relatedConcepts.map((concept, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-2xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}

          {onAction && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onAction.onClick}
                className="w-full py-1.5 px-3 text-xs font-medium rounded-md bg-brand-600 hover:bg-brand-700 text-white shadow-subtle transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {onAction.label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
