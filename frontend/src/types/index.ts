// Domain Types for Anvil Learning Assistant

export type SurfaceType = 'sidepanel' | 'popup' | 'content';

export type Mode = 'reading' | 'interview' | 'exam';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type ContentType = 'question' | 'article' | 'note' | 'formula';

export interface Note {
  id: string;
  url: string;
  pageTitle?: string;
  selectionText?: string;
  content: string;
  color?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  url: string;
  text: string;
  noteId?: string;
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
  createdAt: string;
  rangeInfo?: {
    startOffset: number;
    endOffset: number;
    textSnippet: string;
  };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId?: string;
  sourceUrl?: string;
  sourceMode: Mode;
  contentType?: ContentType;
  difficulty: DifficultyLevel;
  interval: number; // in days
  repetition: number;
  easeFactor: number; // default 2.5
  nextReviewDate: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  contentType: ContentType;
  contentId?: string;
  tags: string[];
  createdAt: string;
}

export interface Question {
  id: string;
  title: string;
  prompt: string;
  description?: string;
  mode: 'interview' | 'exam';
  category: 'dsa' | 'technical' | 'hr' | 'system_design' | 'math' | 'physics' | 'cs' | 'general';
  subject?: string;
  topic?: string;
  year?: number;
  difficulty: DifficultyLevel;
  tags: string[];
  hints?: string[];
  sampleAnswer?: string;
  rubrics?: string[];
  formulas?: string[];
  frequencyRank?: number; // 1 (highest) to 10
  options?: string[]; // for multiple choice PYQs
  correctAnswer?: string;
  codeSnippet?: string;
}

export interface InterviewRound {
  id: string;
  title: string;
  category: 'dsa' | 'technical' | 'hr' | 'system_design';
  description: string;
  estimatedDurationMin: number;
  totalQuestions: number;
  difficulty: DifficultyLevel;
  iconName?: string;
}

export interface AnswerFeedback {
  score: number; // 0 to 100
  strengths: string[];
  improvements: string[];
  keyTakeaway: string;
  suggestedAnswerSnippet?: string;
}

export interface InterviewSession {
  id: string;
  roundId: string;
  roundTitle: string;
  status: 'in_progress' | 'completed';
  startTime: string;
  endTime?: string;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Array<{
    questionId: string;
    answerText: string;
    feedback?: AnswerFeedback;
  }>;
  overallFeedback?: {
    totalScore: number;
    summary: string;
    strengths: string[];
    focusAreas: string[];
    recommendation: string;
  };
}

export interface ResumeAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  overallFitScore: number;
  targetRole: string;
  keyStrengths: string[];
  skillGaps: string[];
  recommendedRounds: string[];
  matchingKeywords: string[];
  suggestedActionItems: string[];
  sampleQuestions: string[];
}

export interface Formula {
  id: string;
  name: string;
  subject: string;
  topic: string;
  formula: string;
  explanation: string;
  variables: Array<{
    symbol: string;
    meaning: string;
  }>;
  example: string;
  difficulty?: DifficultyLevel;
}

export interface RevisionNote {
  id: string;
  title: string;
  subject: string;
  topic: string;
  summary: string;
  keyPoints: string[];
  codeOrSnippet?: string;
  importantFormulas?: string[];
}

export interface ProgressEntry {
  id: string;
  date: string;
  mode: Mode;
  activityType:
    | 'read_article'
    | 'highlight_created'
    | 'note_created'
    | 'flashcard_reviewed'
    | 'flashcard_created'
    | 'interview_question_answered'
    | 'interview_session_completed'
    | 'pyq_solved'
    | 'formula_reviewed'
    | 'resume_analyzed';
  score?: number;
  durationSec?: number;
  metadata?: Record<string, any>;
}

export interface ProgressStats {
  totalStudyTimeMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  cardsReviewed: number;
  cardsDueToday: number;
  questionsSolved: number;
  interviewsCompleted: number;
  accuracyRate: number;
  recentActivity: ProgressEntry[];
  topicPerformance: Array<{
    topic: string;
    category: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  synonyms?: string[];
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
}
