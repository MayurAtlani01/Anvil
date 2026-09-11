import { create } from 'zustand';
import { DifficultyLevel, Formula, Question, RevisionNote } from '@/types';
import { examService, progressService } from '@/services';

interface ExamState {
  pyqs: Question[];
  formulas: Formula[];
  revisionNotes: RevisionNote[];
  subjects: string[];
  topics: string[];
  rankedTopics: Array<{ topic: string; subject: string; count: number; weight: number }>;
  selectedSubject: string;
  selectedTopic: string;
  selectedDifficulty: DifficultyLevel | 'all';
  searchQuery: string;
  selectedPYQ: Question | null;
  selectedFormula: Formula | null;
  isLoading: boolean;
  loadExamData: () => Promise<void>;
  filterPYQs: () => Promise<void>;
  filterFormulas: () => Promise<void>;
  setSelectedSubject: (subject: string) => void;
  setSelectedTopic: (topic: string) => void;
  setSelectedDifficulty: (difficulty: DifficultyLevel | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedPYQ: (pyq: Question | null) => void;
  setSelectedFormula: (formula: Formula | null) => void;
  solvePYQ: (questionId: string) => Promise<void>;
}

export const useExamStore = create<ExamState>((set, get) => ({
  pyqs: [],
  formulas: [],
  revisionNotes: [],
  subjects: [],
  topics: [],
  rankedTopics: [],
  selectedSubject: 'all',
  selectedTopic: 'all',
  selectedDifficulty: 'all',
  searchQuery: '',
  selectedPYQ: null,
  selectedFormula: null,
  isLoading: false,

  loadExamData: async () => {
    set({ isLoading: true });
    try {
      const [pyqs, formulas, revisionNotes, subjects, topics, rankedTopics] = await Promise.all([
        examService.getPYQs(),
        examService.getFormulas(),
        examService.getRevisionNotes(),
        examService.getSubjects(),
        examService.getTopics(),
        examService.getFrequentlyAskedTopics(),
      ]);

      set({
        pyqs,
        formulas,
        revisionNotes,
        subjects,
        topics,
        rankedTopics,
        isLoading: false,
      });
    } catch (err) {
      console.error('[ExamStore] Failed to load exam data:', err);
      set({ isLoading: false });
    }
  },

  filterPYQs: async () => {
    const { selectedSubject, selectedTopic, selectedDifficulty, searchQuery } = get();
    const pyqs = await examService.getPYQs({
      subject: selectedSubject === 'all' ? undefined : selectedSubject,
      topic: selectedTopic === 'all' ? undefined : selectedTopic,
      difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
      search: searchQuery || undefined,
    });
    set({ pyqs });
  },

  filterFormulas: async () => {
    const { selectedSubject, selectedTopic, searchQuery } = get();
    const formulas = await examService.getFormulas({
      subject: selectedSubject === 'all' ? undefined : selectedSubject,
      topic: selectedTopic === 'all' ? undefined : selectedTopic,
      search: searchQuery || undefined,
    });
    set({ formulas });
  },

  setSelectedSubject: (selectedSubject) => {
    set({ selectedSubject, selectedTopic: 'all' });
    get().filterPYQs();
    get().filterFormulas();
  },

  setSelectedTopic: (selectedTopic) => {
    set({ selectedTopic });
    get().filterPYQs();
    get().filterFormulas();
  },

  setSelectedDifficulty: (selectedDifficulty) => {
    set({ selectedDifficulty });
    get().filterPYQs();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().filterPYQs();
    get().filterFormulas();
  },

  setSelectedPYQ: (selectedPYQ) => set({ selectedPYQ }),
  setSelectedFormula: (selectedFormula) => set({ selectedFormula }),

  solvePYQ: async (questionId) => {
    const { pyqs } = get();
    const q = pyqs.find((p) => p.id === questionId);
    if (q) {
      await progressService.recordActivity({
        mode: 'exam',
        activityType: 'pyq_solved',
        score: 100,
        metadata: { questionTitle: q.title, subject: q.subject, topic: q.topic },
      });
    }
  },
}));
