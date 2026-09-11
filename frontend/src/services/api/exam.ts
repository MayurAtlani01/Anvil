import { Formula, Question, RevisionNote, DifficultyLevel } from '@/types';

export interface PyqFilter {
  subject?: string;
  topic?: string;
  year?: number;
  difficulty?: DifficultyLevel;
  search?: string;
}

export interface FormulaFilter {
  subject?: string;
  topic?: string;
  search?: string;
}

export interface ExamService {
  getPYQs(filter?: PyqFilter): Promise<Question[]>;
  getPYQ(id: string): Promise<Question | null>;
  addPYQ(pyq: Question): Promise<Question>;
  getFormulas(filter?: FormulaFilter): Promise<Formula[]>;
  addFormula(formula: Formula): Promise<Formula>;
  getRevisionNotes(subject?: string, topic?: string): Promise<RevisionNote[]>;
  addRevisionNote(note: RevisionNote): Promise<RevisionNote>;
  getSubjects(): Promise<string[]>;
  getTopics(subject?: string): Promise<string[]>;
  getFrequentlyAskedTopics(): Promise<Array<{ topic: string; subject: string; count: number; weight: number }>>;
}
