import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Calculator, FileCheck, Sparkles, TrendingUp, Plus, ExternalLink } from 'lucide-react';
import { useExamStore } from '@/store/useExamStore';
import { useFlashcardsStore } from '@/store/useFlashcardsStore';
import { useToastStore } from '@/store/useToastStore';
import { QuestionCard } from '@/components/QuestionCard';
import { DifficultySelector } from '@/components/DifficultySelector';
import { Filters } from '@/components/Filters';
import { Search as SearchInput } from '@/components/Search';
import { EmptyState } from '@/components/EmptyState';
import { BookmarkButton } from '@/components/BookmarkButton';
import { cn } from '@/utils/cn';

export const ExamView: React.FC = () => {
  const {
    pyqs,
    formulas,
    revisionNotes,
    subjects,
    rankedTopics,
    selectedSubject,
    selectedDifficulty,
    searchQuery,
    loadExamData,
    setSelectedSubject,
    setSelectedDifficulty,
    setSearchQuery,
    solvePYQ,
  } = useExamStore();

  const { createFlashcard } = useFlashcardsStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'pyqs' | 'formulas' | 'revision' | 'radar'>('pyqs');

  useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  const handleMakeFormulaFlashcard = async (f: typeof formulas[0]) => {
    await createFlashcard({
      front: `Formula: ${f.name} (${f.subject})`,
      back: `${f.formula}\n\nExplanation: ${f.explanation}\n\nExample:\n${f.example}`,
      sourceMode: 'exam',
      contentType: 'formula',
      difficulty: f.difficulty || 'medium',
    });
    addToast({
      type: 'success',
      message: `Created flashcard for formula: ${f.name}`,
    });
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Search Input Bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search your questions, formulas, topics..."
      />

      {/* Main Sub Navigation */}
      <Filters
        options={[
          { id: 'pyqs', label: 'Previous Year (PYQ)' },
          { id: 'formulas', label: 'Formula Bank' },
          { id: 'revision', label: 'Revision Notes' },
          { id: 'radar', label: 'Exam Topic Radar' },
        ]}
        selectedId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Secondary Subject Filter Chips */}
      {(activeTab === 'pyqs' || activeTab === 'formulas' || activeTab === 'revision') && subjects.length > 0 && (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedSubject('all')}
              className={cn(
                'px-2 py-0.5 text-2xs font-medium rounded-full transition-colors whitespace-nowrap',
                selectedSubject === 'all'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              )}
            >
              All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={cn(
                  'px-2 py-0.5 text-2xs font-medium rounded-full transition-colors whitespace-nowrap',
                  selectedSubject === sub
                    ? 'bg-brand-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                )}
              >
                {sub}
              </button>
            ))}
          </div>

          {activeTab === 'pyqs' && (
            <DifficultySelector
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
              size="sm"
            />
          )}
        </div>
      )}

      {/* VIEW: PREVIOUS YEAR QUESTIONS (PYQS) */}
      {activeTab === 'pyqs' && (
        <div className="space-y-3">
          {pyqs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No previous year questions in bank"
              description="Your exam question bank is empty. Import or connect an exam repository to practice previous year questions."
            />
          ) : (
            <div className="space-y-2.5">
              {pyqs.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onSolve={() => solvePYQ(q.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: FORMULA REPOSITORY */}
      {activeTab === 'formulas' && (
        <div className="space-y-3">
          {formulas.length === 0 ? (
            <EmptyState
              icon={Calculator}
              title="No formulas saved yet"
              description="Your formula bank is empty. Save formulas from web pages or connect a formula repository."
            />
          ) : (
            <div className="space-y-2.5">
              {formulas.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                        {f.subject} • {f.topic}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {f.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMakeFormulaFlashcard(f)}
                        title="Turn into Flashcard"
                        className="p-1 rounded text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <BookmarkButton
                        contentId={f.id}
                        url={`anvil://exam/formula/${f.id}`}
                        title={f.name}
                        snippet={f.formula}
                        contentType="formula"
                        tags={[f.subject, f.topic]}
                      />
                    </div>
                  </div>

                  {/* Formula Box */}
                  <div className="p-2.5 rounded bg-zinc-900 text-zinc-100 font-mono text-xs font-semibold text-center tracking-wide overflow-x-auto">
                    <code>{f.formula}</code>
                  </div>

                  <p className="text-2xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {f.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: QUICK REVISION NOTES */}
      {activeTab === 'revision' && (
        <div className="space-y-3">
          {revisionNotes.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No revision notes in repository"
              description="Connect a revision notes feed or create personal study notes in Reading Mode."
            />
          ) : (
            <div className="space-y-2.5">
              {revisionNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                        {note.subject} • {note.topic}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {note.title}
                      </h4>
                    </div>

                    <BookmarkButton
                      contentId={note.id}
                      url={`anvil://exam/revision/${note.id}`}
                      title={note.title}
                      snippet={note.summary}
                      contentType="note"
                      tags={[note.subject, note.topic]}
                    />
                  </div>

                  <p className="text-2xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {note.summary}
                  </p>

                  <ul className="space-y-1.5 pl-3 border-l-2 border-brand-500 my-2 text-2xs text-zinc-700 dark:text-zinc-300">
                    {note.keyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: TOP EXAM TOPICS RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-3">
          {rankedTopics.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No topic frequency data"
              description="Topic radar statistics will generate automatically once questions are added to your exam library."
            />
          ) : (
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    High-Yield Exam Topics
                  </h4>
                  <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                    Ranked by question recurrence frequency.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {rankedTopics.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span className="font-mono text-brand-600 font-bold">#{i + 1}</span>
                        {item.topic}
                      </span>
                      <span className="text-zinc-400 font-mono">
                        {item.count} Questions ({item.weight}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
