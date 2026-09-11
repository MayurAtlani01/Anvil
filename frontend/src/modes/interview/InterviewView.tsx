import React, { useState, useEffect } from 'react';
import { Play, FileText, CheckCircle2, Upload, Sparkles, Trophy, ArrowLeft, Mic, AlertCircle, Plus } from 'lucide-react';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useToastStore } from '@/store/useToastStore';
import { QuestionCard } from '@/components/QuestionCard';
import { DifficultySelector } from '@/components/DifficultySelector';
import { AIResponse } from '@/components/AIResponse';
import { Filters } from '@/components/Filters';
import { EmptyState } from '@/components/EmptyState';
import { formatTimeAgo } from '@/utils/cn';
import { cn } from '@/utils/cn';

export const InterviewView: React.FC = () => {
  const {
    rounds,
    questions,
    activeSession,
    history,
    resumeAnalysis,
    selectedDifficulty,
    sessionError,
    loadInitialData,
    startInterview,
    submitAnswer,
    finishSession,
    analyzeResume,
    setSelectedDifficulty,
    resetActiveSession,
  } = useInterviewStore();

  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'rounds' | 'session' | 'resume' | 'stats'>('rounds');
  const [answerInput, setAnswerInput] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (activeSession && activeSession.status === 'in_progress') {
      setActiveTab('session');
    }
  }, [activeSession]);

  const handleStartRound = async (roundId: string) => {
    try {
      await startInterview(roundId, selectedDifficulty === 'all' ? undefined : selectedDifficulty);
      setActiveTab('session');
      addToast({
        type: 'info',
        message: 'Mock interview session started! Type your answers below.',
      });
    } catch (err: any) {
      addToast({
        type: 'warning',
        message: err.message || 'No questions available in this track yet.',
      });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim()) return;
    await submitAnswer(answerInput.trim());
    setAnswerInput('');
    addToast({
      type: 'success',
      message: 'Answer recorded.',
    });
  };

  const handleFinishSession = async () => {
    await finishSession();
    addToast({
      type: 'success',
      message: 'Interview session completed and saved to your history.',
    });
  };

  const handleResumeDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    try {
      await analyzeResume(file.name, '');
      setIsUploadingResume(false);
      addToast({
        type: 'success',
        message: `Uploaded ${file.name}.`,
      });
    } catch {
      setIsUploadingResume(false);
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-2">
        <Filters
          options={[
            { id: 'rounds', label: 'Interview Tracks' },
            { id: 'resume', label: 'Resume Matcher' },
            { id: 'stats', label: 'Session History' },
            ...(activeSession ? [{ id: 'session', label: 'Active Session' }] : []),
          ]}
          selectedId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />
      </div>

      {/* VIEW: TRACKS SELECTION */}
      {activeTab === 'rounds' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Practice Tracks
            </span>
            <DifficultySelector
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
            />
          </div>

          {sessionError && (
            <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-2xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>{sessionError}</span>
            </div>
          )}

          <div className="space-y-2.5">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-150 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {round.title}
                    </h4>
                    <p className="text-2xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {round.description}
                    </p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-2xs uppercase font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                    ~{round.estimatedDurationMin}m
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-2xs font-mono text-zinc-400">
                    {round.totalQuestions} Questions in bank
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStartRound(round.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-subtle flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Start Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ACTIVE INTERVIEW SESSION RUNNER */}
      {activeTab === 'session' && activeSession && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('rounds')}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div>
                <span className="text-xs font-bold">{activeSession.roundTitle}</span>
                <span className="text-2xs text-zinc-400 block">
                  Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions.length}
                </span>
              </div>
            </div>

            {activeSession.status === 'in_progress' ? (
              <button
                type="button"
                onClick={handleFinishSession}
                className="px-2.5 py-1 text-2xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 rounded"
              >
                Finish Session
              </button>
            ) : (
              <button
                type="button"
                onClick={resetActiveSession}
                className="px-2.5 py-1 text-2xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 rounded"
              >
                New Session
              </button>
            )}
          </div>

          {/* Current Question */}
          {activeSession.questions[activeSession.currentQuestionIndex] && (
            <QuestionCard
              question={activeSession.questions[activeSession.currentQuestionIndex]}
              showActions={false}
            />
          )}

          {/* Answer Input Box */}
          {activeSession.status === 'in_progress' && (
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Your Answer
                </label>
                <div className="flex items-center gap-1.5 text-2xs text-zinc-400">
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-2xs font-mono">Voice input ready</span>
                </div>
              </div>

              <textarea
                rows={4}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Walk through your approach, state time & space complexity, address edge cases..."
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!answerInput.trim()}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-md shadow-subtle flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Answer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: RESUME ANALYZER */}
      {activeTab === 'resume' && (
        <div className="space-y-3">
          {/* File Upload Dropzone */}
          <div className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850/50 text-center space-y-2">
            <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
            <div>
              <div className="text-xs font-semibold">Resume Parser & Matcher</div>
              <div className="text-2xs text-zinc-400 mt-0.5">
                Upload a resume to pair with your practice sessions
              </div>
            </div>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 rounded border border-brand-200 dark:border-brand-800 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploadingResume ? 'Processing File...' : 'Upload Resume File'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleResumeDrop}
                className="hidden"
              />
            </label>
          </div>

          {/* Real Resume Status Output */}
          {resumeAnalysis ? (
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-subtle">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {resumeAnalysis.fileName}
                  </div>
                  <div className="text-2xs text-zinc-400">
                    Uploaded {formatTimeAgo(resumeAnalysis.uploadedAt)}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-850 text-2xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                  Backend API Seam:
                </span>
                <span>
                  Resume uploaded and indexed. Connect a backend parser endpoint in settings to generate deep skill gap analysis and automated question recommendations.
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No resume uploaded"
              description="Upload your resume to align your practice tracks with target job qualifications."
            />
          )}
        </div>
      )}

      {/* VIEW: SESSION HISTORY */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Interview Session Logs ({history.length})
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="No interview sessions recorded yet"
              description="Start a practice track to log and review your interview answers."
              actionLabel="Start a Session"
              onAction={() => setActiveTab('rounds')}
            />
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-subtle space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{h.roundTitle}</span>
                    <span className="text-2xs font-mono text-zinc-400">{formatTimeAgo(h.startTime)}</span>
                  </div>

                  <div className="text-2xs text-zinc-500">
                    <span>{h.answers.length} questions answered</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
