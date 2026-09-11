import { InterviewRound, InterviewSession, Question, ResumeAnalysis, DifficultyLevel } from '@/types';

export interface InterviewService {
  getRounds(): Promise<InterviewRound[]>;
  getQuestionsForRound(roundId?: string, difficulty?: DifficultyLevel): Promise<Question[]>;
  addQuestion(question: Question): Promise<Question>;
  startSession(roundId: string, difficulty?: DifficultyLevel): Promise<InterviewSession>;
  submitAnswer(sessionId: string, questionId: string, answerText: string): Promise<InterviewSession>;
  finishSession(sessionId: string): Promise<InterviewSession>;
  getSession(sessionId: string): Promise<InterviewSession | null>;
  getSessionHistory(): Promise<InterviewSession[]>;
  analyzeResume(fileName: string, fileContent: string): Promise<ResumeAnalysis>;
  getLastResumeAnalysis(): Promise<ResumeAnalysis | null>;
}
