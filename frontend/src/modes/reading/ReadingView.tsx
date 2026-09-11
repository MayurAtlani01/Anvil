import React, { useState } from 'react';
import { Volume2, Sparkles, Bookmark, Pause, Square, Sliders, AlertCircle, Settings } from 'lucide-react';
import { useReadingStore } from '@/store/useReadingStore';
import { useBookmarksStore } from '@/store/useBookmarksStore';
import { useFlashcardsStore } from '@/store/useFlashcardsStore';
import { useToastStore } from '@/store/useToastStore';
import { AIResponse } from '@/components/AIResponse';
import { Notes } from '@/components/Notes';
import { Filters } from '@/components/Filters';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/utils/cn';

export const ReadingView: React.FC = () => {
  const {
    pageTitle,
    pageUrl,
    pageText,
    summary,
    summaryError,
    isSummarizing,
    isSpeaking,
    speechRate,
    aiExplanation,
    explanationError,
    generateSummary,
    startTTS,
    pauseTTS,
    stopTTS,
    setSpeechRate,
  } = useReadingStore();

  const { createFlashcard } = useFlashcardsStore();
  const { toggleBookmark, isBookmarked } = useBookmarksStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'explanation'>('summary');
  const [showSpeedControls, setShowSpeedControls] = useState(false);

  const bookmarked = isBookmarked(pageUrl);

  const handleToggleBookmark = async () => {
    if (!pageUrl) {
      addToast({ type: 'warning', message: 'No active web page detected.' });
      return;
    }

    const isNowBookmarked = await toggleBookmark({
      title: pageTitle || 'Web Page',
      url: pageUrl,
      contentType: 'article',
      snippet: pageText ? pageText.substring(0, 140) + '...' : undefined,
      tags: ['Reading', 'Web'],
    });

    addToast({
      type: isNowBookmarked ? 'success' : 'info',
      message: isNowBookmarked ? 'Article bookmarked' : 'Bookmark removed',
    });
  };

  const handleGenerateFlashcardFromSummary = async () => {
    if (!summary) return;
    await createFlashcard({
      front: `Summary: ${pageTitle || 'Study Article'}`,
      back: `${summary.summary}\n\nKey Takeaways:\n${summary.bulletPoints.map((b) => `• ${b}`).join('\n')}`,
      sourceMode: 'reading',
      contentType: 'article',
    });
    addToast({
      type: 'success',
      message: 'Created flashcard from article summary',
    });
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Top Action Audio & Bookmark Bar */}
      <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                pageUrl ? 'bg-emerald-500' : 'bg-zinc-400'
              )}
            />
            <span className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">
              {pageTitle || 'Open a web page to begin reading'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={!pageUrl}
            className={cn(
              'p-1.5 rounded-md transition-colors shrink-0 disabled:opacity-30',
              bookmarked
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title={bookmarked ? 'Remove Bookmark' : 'Bookmark Page'}
          >
            <Bookmark className={cn('w-4 h-4', bookmarked && 'fill-current')} />
          </button>
        </div>

        {/* Text To Speech Control Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            {isSpeaking ? (
              <>
                <button
                  type="button"
                  onClick={pauseTTS}
                  className="px-2.5 py-1 text-2xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-subtle flex items-center gap-1 transition-colors"
                >
                  <Pause className="w-3 h-3" />
                  Pause TTS
                </button>
                <button
                  type="button"
                  onClick={stopTTS}
                  className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Stop audio"
                >
                  <Square className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!pageText.trim()) {
                    addToast({ type: 'warning', message: 'No text extracted on this page to read.' });
                    return;
                  }
                  startTTS();
                }}
                disabled={!pageText.trim()}
                className="px-2.5 py-1 text-2xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded shadow-subtle flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3 h-3" />
                Listen (TTS)
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSpeedControls(!showSpeedControls)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Adjust Speech Speed"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-2xs font-mono text-zinc-400">
            {speechRate}x speed
          </span>
        </div>

        {/* Speed Controls Slider Drawer */}
        {showSpeedControls && (
          <div className="p-2 bg-zinc-50 dark:bg-zinc-850 rounded border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2 text-2xs">
            <span className="text-zinc-500 font-medium">Rate:</span>
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeechRate(rate)}
                className={cn(
                  'px-2 py-0.5 rounded font-mono transition-colors',
                  speechRate === rate
                    ? 'bg-brand-600 text-white font-bold'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                )}
              >
                {rate}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sub navigation filters */}
      <Filters
        options={[
          { id: 'summary', label: 'AI Summary' },
          { id: 'notes', label: 'Page Notes' },
          ...(aiExplanation ? [{ id: 'explanation', label: 'Selection Explanation' }] : []),
        ]}
        selectedId={aiExplanation && activeTab !== 'notes' ? 'explanation' : activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* View: Selection Explanation */}
      {aiExplanation && activeTab === 'explanation' && (
        <div className="space-y-2.5">
          <AIResponse
            title={`Analysis: "${aiExplanation.text}"`}
            badgeText="Selection Breakdown"
            summaryText={aiExplanation.explanation}
            simplified={aiExplanation.simplified}
            practicalExample={aiExplanation.practicalExample}
            relatedConcepts={aiExplanation.relatedConcepts}
            onAction={{
              label: 'Make Flashcard from Concept',
              onClick: async () => {
                await createFlashcard({
                  front: `Explain: ${aiExplanation.text}`,
                  back: `${aiExplanation.simplified}\n\nExample:\n${aiExplanation.practicalExample}`,
                  sourceMode: 'reading',
                  contentType: 'note',
                });
                addToast({ type: 'success', message: 'Flashcard created' });
              },
            }}
          />
        </div>
      )}

      {/* View: AI Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          {summary ? (
            <AIResponse
              title={`Key Takeaways (${summary.readTimeMin} min read)`}
              badgeText="Article Synthesized"
              summaryText={summary.summary}
              bulletPoints={summary.bulletPoints}
              relatedConcepts={summary.keyEntities}
              onAction={{
                label: 'Turn Summary into Flashcard',
                onClick: handleGenerateFlashcardFromSummary,
              }}
            />
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Article Summary
                </h4>
                <p className="text-2xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Generate synthesized takeaways, core concepts, and key terms from this page.
                </p>
              </div>

              {summaryError && (
                <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-2xs text-zinc-600 dark:text-zinc-400 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                      Backend AI Service Note:
                    </span>
                    <span>{summaryError}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={generateSummary}
                disabled={isSummarizing || !pageText.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-md shadow-subtle inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSummarizing ? 'Synthesizing article...' : 'Generate AI Summary'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* View: Notes */}
      {activeTab === 'notes' && <Notes currentUrl={pageUrl} />}
    </div>
  );
};
