import { InterviewService } from '../api/interview';
import { DifficultyLevel, InterviewRound, InterviewSession, Question, ResumeAnalysis } from '@/types';
import { storage } from './storage';

const SESSIONS_STORAGE_KEY = 'anvil_interview_sessions_data';
const RESUME_STORAGE_KEY = 'anvil_resume_analysis_data';
const INTERVIEW_QUESTIONS_KEY = 'anvil_interview_questions_data';

// Standard Practice Tracks definitions
export const DEFAULT_INTERVIEW_ROUNDS: InterviewRound[] = [
  {
    id: 'round-dsa',
    title: 'Data Structures & Algorithms',
    category: 'dsa',
    description: 'Algorithmic problem-solving, complexity analysis, and edge-case handling.',
    estimatedDurationMin: 35,
    totalQuestions: 0,
    difficulty: 'medium',
  },
  {
    id: 'round-system-design',
    title: 'System Design & Architecture',
    category: 'system_design',
    description: 'Architecture, scalability, caching, load balancing, and data consistency.',
    estimatedDurationMin: 45,
    totalQuestions: 0,
    difficulty: 'hard',
  },
  {
    id: 'round-tech-depth',
    title: 'Core Technical & Concurrency',
    category: 'technical',
    description: 'Operating systems, concurrency, database indexing, and networking protocols.',
    estimatedDurationMin: 30,
    totalQuestions: 0,
    difficulty: 'medium',
  },
  {
    id: 'round-behavioral',
    title: 'Behavioral & Leadership (STAR)',
    category: 'hr',
    description: 'Conflict resolution, leadership, ownership, and engineering collaboration.',
    estimatedDurationMin: 25,
    totalQuestions: 0,
    difficulty: 'easy',
  },
];

export const DEFAULT_INTERVIEW_QUESTIONS: Question[] = [];
export const DEFAULT_INTERVIEW_SESSIONS: InterviewSession[] = [];
export const DEFAULT_RESUME_ANALYSIS: ResumeAnalysis | null = null;

const MOCK_QUESTION_IDS = new Set([
  'q-dsa-1', 'q-dsa-2', 'q-dsa-3', 'q-dsa-4',
  'q-sys-1', 'q-sys-2', 'q-sys-3',
  'q-tech-1', 'q-tech-2', 'q-tech-3',
  'q-hr-1', 'q-hr-2',
]);

export class StorageInterviewService implements InterviewService {
  async getRounds(): Promise<InterviewRound[]> {
    const questions = await this.getAllQuestions();
    return DEFAULT_INTERVIEW_ROUNDS.map((round) => ({
      ...round,
      totalQuestions: questions.filter((q) => q.category === round.category).length,
    }));
  }

  async getAllQuestions(): Promise<Question[]> {
    let questions = await storage.get<Question[]>(INTERVIEW_QUESTIONS_KEY, []);
    if (!questions) questions = [];
    return questions.filter((q) => !MOCK_QUESTION_IDS.has(q.id));
  }

  async addQuestion(question: Question): Promise<Question> {
    const questions = await this.getAllQuestions();
    questions.unshift(question);
    await storage.set(INTERVIEW_QUESTIONS_KEY, questions);
    return question;
  }

  async getQuestionsForRound(roundId?: string, difficulty?: DifficultyLevel): Promise<Question[]> {
    let questions = await this.getAllQuestions();
    const round = DEFAULT_INTERVIEW_ROUNDS.find((r) => r.id === roundId);

    if (round) {
      questions = questions.filter((q) => q.category === round.category);
    }
    if (difficulty) {
      questions = questions.filter((q) => q.difficulty === difficulty);
    }
    return questions;
  }

  async startSession(roundId: string, difficulty?: DifficultyLevel): Promise<InterviewSession> {
    const round = DEFAULT_INTERVIEW_ROUNDS.find((r) => r.id === roundId) || DEFAULT_INTERVIEW_ROUNDS[0];
    let questions = await this.getQuestionsForRound(round.id, difficulty);

    if (questions.length === 0) {
      questions = await this.getAllQuestions();
    }

    if (questions.length === 0) {
      // Provide an interactive live question so user can practice even before saving questions
      questions = [
        {
          id: `q-live-${Date.now()}`,
          title: `${round.title} Live Practice Prompt`,
          prompt: `Please explain your systematic approach to solving a core ${round.title} challenge. Outline your architecture or algorithm, complexity tradeoffs, and edge-case handling.`,
          description: 'Live interactive practice prompt',
          mode: 'interview',
          category: round.category,
          difficulty: difficulty || 'medium',
          tags: [round.category, 'practice'],
        },
      ];
    }

    const newSession: InterviewSession = {
      id: `session-${Date.now()}`,
      roundId: round.id,
      roundTitle: round.title,
      status: 'in_progress',
      startTime: new Date().toISOString(),
      currentQuestionIndex: 0,
      questions: questions.slice(0, 5),
      answers: [],
    };

    const sessions = await this.getSessionHistory();
    sessions.unshift(newSession);
    await storage.set(SESSIONS_STORAGE_KEY, sessions);

    return newSession;
  }

  async submitAnswer(sessionId: string, questionId: string, answerText: string): Promise<InterviewSession> {
    const sessions = await this.getSessionHistory();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const existingAnswerIdx = session.answers.findIndex((a) => a.questionId === questionId);
    
    // Simulate high-yield instant AI evaluation feedback
    const wordCount = answerText.trim().split(/\s+/).length;
    const feedbackScore = Math.min(96, Math.max(65, 70 + Math.floor(wordCount * 1.5)));
    const feedback = {
      score: feedbackScore,
      strengths: [
        'Structured analytical response covering core technical requirements',
        'Direct identification of optimal algorithmic / system tradeoffs',
      ],
      improvements: [
        'Include concrete edge cases (e.g. null inputs, network timeouts, concurrency contention)',
      ],
      keyTakeaway: 'Solid technical depth and clear articulation.',
    };

    const answerEntry = {
      questionId,
      answerText,
      feedback,
    };

    if (existingAnswerIdx !== -1) {
      session.answers[existingAnswerIdx] = answerEntry;
    } else {
      session.answers.push(answerEntry);
    }

    if (session.currentQuestionIndex < session.questions.length - 1) {
      session.currentQuestionIndex += 1;
    }

    await storage.set(SESSIONS_STORAGE_KEY, sessions);
    return session;
  }

  async finishSession(sessionId: string): Promise<InterviewSession> {
    const sessions = await this.getSessionHistory();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'completed';
    session.endTime = new Date().toISOString();

    const totalScore = session.answers.length > 0
      ? Math.round(session.answers.reduce((acc, a) => acc + (a.feedback?.score || 75), 0) / session.answers.length)
      : 85;

    session.overallFeedback = {
      totalScore,
      summary: `Completed ${session.roundTitle} with overall readiness score of ${totalScore}%.`,
      strengths: [
        'Consistent problem decomposition and structured communication',
        'Demonstrated strong grasp of core domain patterns and invariants',
      ],
      focusAreas: [
        'Double-check edge cases before submitting final response',
        'Pace solutions within standard 35-minute interview target',
      ],
      recommendation: totalScore >= 80 ? 'Ready for onsite technical round.' : 'Recommend 2 more practice sessions.',
    };

    await storage.set(SESSIONS_STORAGE_KEY, sessions);
    return session;
  }

  async getSession(sessionId: string): Promise<InterviewSession | null> {
    const sessions = await this.getSessionHistory();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  async getSessionHistory(): Promise<InterviewSession[]> {
    let sessions = await storage.get<InterviewSession[]>(SESSIONS_STORAGE_KEY, []);
    if (!sessions) sessions = [];
    return sessions.filter((s) => s.id !== 'session-seed-1');
  }

  async analyzeResume(fileName: string, fileContent: string): Promise<ResumeAnalysis> {
    const analysis: ResumeAnalysis = {
      id: `resume-${Date.now()}`,
      fileName: fileName || 'Candidate_Resume.pdf',
      uploadedAt: new Date().toISOString(),
      overallFitScore: 88,
      targetRole: 'Full-Stack & Systems Software Engineer',
      keyStrengths: [
        'Algorithms & Data Structures (DSA)',
        'TypeScript / React / Modern Frontend Architecture',
        'Distributed Caching & Redis Optimization',
        'Database Schema Indexing & Query Tuning',
      ],
      skillGaps: [
        'Kubernetes Production Ingress & Service Mesh',
        'gRPC Microservices Architecture',
      ],
      recommendedRounds: ['Data Structures & Algorithms', 'System Design & Architecture'],
      matchingKeywords: [
        'TypeScript',
        'React',
        'PostgreSQL',
        'Redis',
        'Docker',
        'RESTful APIs',
        'System Design',
      ],
      suggestedActionItems: [
        'Practice System Design: URL Shortener & Rate Limiting',
        'Review Concurrency: Mutex vs Semaphore & TCP Handshake',
      ],
      sampleQuestions: [
        'How does Redis handle single-threaded concurrency?',
        'Explain the difference between optimistic and pessimistic locking.',
      ],
    };

    await storage.set(RESUME_STORAGE_KEY, analysis);
    return analysis;
  }

  async getLastResumeAnalysis(): Promise<ResumeAnalysis | null> {
    const resume = await storage.get<ResumeAnalysis | null>(RESUME_STORAGE_KEY, null);
    if (resume && (resume.id === 'resume-demo-01' || resume.id === 'resume-mock-01')) {
      return null;
    }
    return resume || null;
  }
}
