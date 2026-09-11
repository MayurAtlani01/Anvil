import { Note } from '@/types';

export interface CreateNoteInput {
  url: string;
  pageTitle?: string;
  selectionText?: string;
  content: string;
  color?: string;
  tags?: string[];
}

export interface NotesService {
  list(url?: string): Promise<Note[]>;
  get(id: string): Promise<Note | null>;
  create(input: CreateNoteInput): Promise<Note>;
  update(id: string, patch: Partial<Note>): Promise<Note>;
  remove(id: string): Promise<void>;
  search(query: string): Promise<Note[]>;
}
