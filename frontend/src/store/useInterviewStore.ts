import { create } from 'zustand';
import { DifficultyLevel, InterviewRound, InterviewSession, Question, ResumeAnalysis } from '@/types';
import { interviewService, progressService } from '@/services';

interface InterviewState {
  rounds: InterviewRound[];
  questions: Question[];
  activeSession: InterviewSession | null;
  history: InterviewSession[];
  resumeAnalysis: ResumeAnalysis | null;
  selectedDifficulty: DifficultyLevel | 'all';
  selectedRoundId: string;
  isEvaluatingAnswer: boolean;
  isLoading: boolean;
  sessionError: string | null;
  loadInitialData: () => Promise<void>;
  startInterview: (roundId: string, difficulty?: DifficultyLevel | 'all') => Promise<InterviewSession>;
  submitAnswer: (answerText: string) => Promise<void>;
  finishSession: () => Promise<InterviewSession>;
  analyzeResume: (fileName: string, content: string) => Promise<ResumeAnalysis>;
  setSelectedDifficulty: (difficulty: DifficultyLevel | 'all') => void;
  setSelectedRoundId: (roundId: string) => void;
  resetActiveSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  rounds: [],
  questions: [],
  activeSession: null,
  history: [],
  resumeAnalysis: null,
  selectedDifficulty: 'all',
  selectedRoundId: 'round-dsa',
  isEvaluatingAnswer: false,
  isLoading: false,
  sessionError: null,

  loadInitialData: async () => {
    set({ isLoading: true, sessionError: null });
    try {
      const rounds = await interviewService.getRounds();
      const history = await interviewService.getSessionHistory();
      const resumeAnalysis = await interviewService.getLastResumeAnalysis();
      const questions = await interviewService.getQuestionsForRound('round-dsa');

      set({
        rounds,
        history,
        resumeAnalysis,
        questions,
        isLoading: false,
      });
    } catch (err) {
      console.error('[InterviewStore] Failed to load data:', err);
      set({ isLoading: false });
    }
  },

  startInterview: async (roundId, difficulty) => {
    set({ isLoading: true, sessionError: null });
    try {
      const session = await interviewService.startSession(
        roundId,
        difficulty === 'all' ? undefined : difficulty
      );
      set({ activeSession: session, isLoading: false });
      return session;
    } catch (err: any) {
      set({ isLoading: false, sessionError: err.message || 'Unable to start interview session.' });
      throw err;
    }
  },

  submitAnswer: async (answerText: string) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const currentQuestion = activeSession.questions[activeSession.currentQuestionIndex];
    if (!currentQuestion) return;

    set({ isEvaluatingAnswer: true });
    try {
      const updatedSession = await interviewService.submitAnswer(
        activeSession.id,
        currentQuestion.id,
        answerText
      );

      // Record activity in progress
      await progressService.recordActivity({
        mode: 'interview',
        activityType: 'interview_question_answered',
        score: 100,
        metadata: { questionTitle: currentQuestion.title },
      });

      set({ activeSession: updatedSession, isEvaluatingAnswer: false });
    } catch (err) {
      console.error('[InterviewStore] Failed to submit answer:', err);
      set({ isEvaluatingAnswer: false });
    }
  },

  finishSession: async () => {
    const { activeSession } = get();
    if (!activeSession) throw new Error('No active session');

    const finished = await interviewService.finishSession(activeSession.id);
    const history = await interviewService.getSessionHistory();

    await progressService.recordActivity({
      mode: 'interview',
      activityType: 'interview_session_completed',
      score: 100,
      metadata: { roundTitle: finished.roundTitle },
    });

    set({ activeSession: finished, history });
    return finished;
  },

  analyzeResume: async (fileName, content) => {
    set({ isLoading: true });
    try {
      const analysis = await interviewService.analyzeResume(fileName, content);
      await progressService.recordActivity({
        mode: 'interview',
        activityType: 'resume_analyzed',
        score: analysis.overallFitScore,
        metadata: { fileName },
      });
      set({ resumeAnalysis: analysis, isLoading: false });
      return analysis;
    } catch (err) {
      console.error('[InterviewStore] Resume analysis failed:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  setSelectedDifficulty: (selectedDifficulty) => set({ selectedDifficulty }),
  setSelectedRoundId: (selectedRoundId) => set({ selectedRoundId }),
  resetActiveSession: () => set({ activeSession: null, sessionError: null }),
}));
