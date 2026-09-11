import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle, Sparkles, BookOpen } from 'lucide-react';
import { Question } from '@/types';
import { BookmarkButton } from './BookmarkButton';
import { useFlashcardsStore } from '@/store/useFlashcardsStore';
import { useToastStore } from '@/store/useToastStore';
import { cn } from '@/utils/cn';

interface QuestionCardProps {
  question: Question;
  onSolve?: () => void;
  showActions?: boolean;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onSolve,
  showActions = true,
  className,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  const { createFlashcard } = useFlashcardsStore();
  const { addToast } = useToastStore();

  const handleCreateFlashcard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await createFlashcard({
      front: question.prompt,
      back: question.sampleAnswer || question.description || 'See question solution in Anvil.',
      difficulty: question.difficulty,
      sourceMode: question.mode === 'interview' ? 'interview' : 'exam',
      contentType: 'question',
    });
    addToast({
      type: 'success',
      message: 'Created flashcard from question',
    });
  };

  const handleMarkSolved = () => {
    setIsSolved(true);
    if (onSolve) onSolve();
    addToast({
      type: 'success',
      message: 'Marked as completed & recorded to study progress',
    });
  };

  const difficultyColors = {
    easy: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    medium: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    hard: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
  };

  return (
    <div
      className={cn(
        'p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-subtle transition-all duration-150',
        isSolved && 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/10',
        className
      )}
    >
      {/* Header info */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-2xs font-semibold uppercase tracking-wider border',
              difficultyColors[question.difficulty]
            )}
          >
            {question.difficulty}
          </span>

          {question.subject && (
            <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {question.subject}
            </span>
          )}

          {question.topic && (
            <span className="text-2xs text-zinc-500 dark:text-zinc-400">
              • {question.topic}
            </span>
          )}

          {question.year && (
            <span className="text-2xs font-mono text-zinc-400">
              ({question.year})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCreateFlashcard}
            title="Create Flashcard"
            className="p-1 rounded text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <BookmarkButton
            contentId={question.id}
            url={`anvil://${question.mode}/question/${question.id}`}
            title={question.title}
            snippet={question.prompt}
            contentType="question"
            tags={question.tags}
          />
        </div>
      </div>

      {/* Title & Prompt */}
      <h4 className="text-xs font-semibold leading-snug text-zinc-900 dark:text-zinc-100 mb-1">
        {question.title}
      </h4>
      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-2.5">
        {question.prompt}
      </p>

      {/* Code Snippet if any */}
      {question.codeSnippet && (
        <pre className="p-2.5 mb-2.5 rounded bg-zinc-900 text-zinc-100 font-mono text-2xs overflow-x-auto">
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {question.tags.map((tag, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded text-2xs bg-zinc-50 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Hints toggle */}
      {question.hints && question.hints.length > 0 && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className="inline-flex items-center gap-1 text-2xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            <Lightbulb className="w-3 h-3" />
            {showHints ? 'Hide Hints' : `Show Hints (${question.hints.length})`}
          </button>

          {showHints && (
            <ul className="mt-1.5 p-2 rounded bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1 text-2xs text-amber-900 dark:text-amber-200">
              {question.hints.map((hint, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Solution reveal */}
      {question.sampleAnswer && (
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="w-full flex items-center justify-between text-2xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <span>{showAnswer ? 'Hide Solution & Rubrics' : 'Reveal Solution & Rubrics'}</span>
            {showAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAnswer && (
            <div className="mt-2 space-y-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-2xs font-semibold uppercase text-zinc-500 block mb-0.5">
                  Model Answer:
                </span>
                <p className="text-zinc-800 dark:text-zinc-200 text-2xs leading-relaxed font-sans">
                  {question.sampleAnswer}
                </p>
              </div>

              {question.rubrics && question.rubrics.length > 0 && (
                <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="text-2xs font-semibold uppercase text-zinc-500 block mb-1">
                    Evaluation Rubrics:
                  </span>
                  <ul className="space-y-0.5">
                    {question.rubrics.map((r, i) => (
                      <li key={i} className="flex items-start gap-1 text-2xs text-zinc-600 dark:text-zinc-400">
                        <CheckCircle className="w-3 h-3 text-brand-500 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {showActions && (
        <div className="mt-3 pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleMarkSolved}
            className={cn(
              'px-2.5 py-1 text-2xs font-medium rounded transition-colors flex items-center gap-1',
              isSolved
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            )}
          >
            <CheckCircle className="w-3 h-3" />
            {isSolved ? 'Completed' : 'Mark Completed'}
          </button>
        </div>
      )}
    </div>
  );
};
