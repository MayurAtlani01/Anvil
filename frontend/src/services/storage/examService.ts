import { ExamService, FormulaFilter, PyqFilter } from '../api/exam';
import { Formula, Question, RevisionNote } from '@/types';
import { storage } from './storage';

const EXAM_PYQS_KEY = 'anvil_exam_pyqs_data';
const EXAM_FORMULAS_KEY = 'anvil_exam_formulas_data';
const EXAM_REVISION_NOTES_KEY = 'anvil_exam_revision_notes_data';

export const DEFAULT_EXAM_PYQS: Question[] = [];
export const DEFAULT_EXAM_FORMULAS: Formula[] = [];
export const DEFAULT_EXAM_REVISION_NOTES: RevisionNote[] = [];

const MOCK_EXAM_PYQ_IDS = new Set(['pyq-1', 'pyq-2', 'pyq-3', 'pyq-4', 'pyq-5']);
const MOCK_EXAM_FORMULA_IDS = new Set(['f-bayes', 'f-master', 'f-entropy', 'f-amdahl', 'f-littles-law']);
const MOCK_EXAM_REVISION_IDS = new Set(['note-os-sync', 'note-db-acid', 'note-dist-cap', 'note-net-osi']);

export class StorageExamService implements ExamService {
  async getPYQs(filter?: PyqFilter): Promise<Question[]> {
    let pyqs = await storage.get<Question[]>(EXAM_PYQS_KEY, []);
    if (!pyqs) pyqs = [];
    pyqs = pyqs.filter((q) => !MOCK_EXAM_PYQ_IDS.has(q.id));

    if (filter?.subject) {
      pyqs = pyqs.filter((q) => q.subject?.toLowerCase() === filter.subject?.toLowerCase());
    }
    if (filter?.topic) {
      pyqs = pyqs.filter((q) => q.topic?.toLowerCase() === filter.topic?.toLowerCase());
    }
    if (filter?.year) {
      pyqs = pyqs.filter((q) => q.year === filter.year);
    }
    if (filter?.difficulty) {
      pyqs = pyqs.filter((q) => q.difficulty === filter.difficulty);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      pyqs = pyqs.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.prompt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.topic && p.topic.toLowerCase().includes(q))
      );
    }

    return pyqs;
  }

  async getPYQ(id: string): Promise<Question | null> {
    const pyqs = await this.getPYQs();
    return pyqs.find((q) => q.id === id) || null;
  }

  async addPYQ(pyq: Question): Promise<Question> {
    const pyqs = await this.getPYQs();
    pyqs.unshift(pyq);
    await storage.set(EXAM_PYQS_KEY, pyqs);
    return pyq;
  }

  async getFormulas(filter?: FormulaFilter): Promise<Formula[]> {
    let formulas = await storage.get<Formula[]>(EXAM_FORMULAS_KEY, []);
    if (!formulas) formulas = [];
    formulas = formulas.filter((f) => !MOCK_EXAM_FORMULA_IDS.has(f.id));

    if (filter?.subject) {
      formulas = formulas.filter((f) => f.subject.toLowerCase() === filter.subject?.toLowerCase());
    }
    if (filter?.topic) {
      formulas = formulas.filter((f) => f.topic.toLowerCase() === filter.topic?.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      formulas = formulas.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.formula.toLowerCase().includes(q) ||
          f.explanation.toLowerCase().includes(q) ||
          f.topic.toLowerCase().includes(q)
      );
    }

    return formulas;
  }

  async addFormula(formula: Formula): Promise<Formula> {
    const formulas = await this.getFormulas();
    formulas.unshift(formula);
    await storage.set(EXAM_FORMULAS_KEY, formulas);
    return formula;
  }

  async getRevisionNotes(subject?: string, topic?: string): Promise<RevisionNote[]> {
    let notes = await storage.get<RevisionNote[]>(EXAM_REVISION_NOTES_KEY, []);
    if (!notes) notes = [];
    notes = notes.filter((n) => !MOCK_EXAM_REVISION_IDS.has(n.id));

    if (subject) {
      notes = notes.filter((n) => n.subject.toLowerCase() === subject.toLowerCase());
    }
    if (topic) {
      notes = notes.filter((n) => n.topic.toLowerCase() === topic.toLowerCase());
    }
    return notes;
  }

  async addRevisionNote(note: RevisionNote): Promise<RevisionNote> {
    const notes = await this.getRevisionNotes();
    notes.unshift(note);
    await storage.set(EXAM_REVISION_NOTES_KEY, notes);
    return note;
  }

  async getSubjects(): Promise<string[]> {
    const pyqs = await this.getPYQs();
    const formulas = await this.getFormulas();
    const subjects = new Set<string>();
    pyqs.forEach((p) => p.subject && subjects.add(p.subject));
    formulas.forEach((f) => subjects.add(f.subject));
    return Array.from(subjects);
  }

  async getTopics(subject?: string): Promise<string[]> {
    const pyqs = await this.getPYQs();
    const formulas = await this.getFormulas();
    const topics = new Set<string>();
    pyqs.forEach((p) => {
      if (!subject || p.subject?.toLowerCase() === subject.toLowerCase()) {
        if (p.topic) topics.add(p.topic);
      }
    });
    formulas.forEach((f) => {
      if (!subject || f.subject.toLowerCase() === subject.toLowerCase()) {
        topics.add(f.topic);
      }
    });
    return Array.from(topics);
  }

  async getFrequentlyAskedTopics(): Promise<Array<{ topic: string; subject: string; count: number; weight: number }>> {
    const pyqs = await this.getPYQs();
    const topicCounts = new Map<string, { subject: string; count: number }>();

    pyqs.forEach((p) => {
      if (p.topic) {
        const current = topicCounts.get(p.topic) || { subject: p.subject || 'General', count: 0 };
        topicCounts.set(p.topic, { subject: current.subject, count: current.count + 1 });
      }
    });

    const total = pyqs.length;
    return Array.from(topicCounts.entries()).map(([topic, data]) => ({
      topic,
      subject: data.subject,
      count: data.count,
      weight: total > 0 ? Math.round((data.count / total) * 100) : 0,
    }));
  }
}
