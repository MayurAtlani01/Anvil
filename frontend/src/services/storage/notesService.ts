import { CreateNoteInput, NotesService } from '../api/notes';
import { Note } from '@/types';
import { storage } from './storage';

const NOTES_STORAGE_KEY = 'anvil_notes_data';

export class StorageNotesService implements NotesService {
  private async getStoredNotes(): Promise<Note[]> {
    let notes = await storage.get<Note[]>(NOTES_STORAGE_KEY, []);
    if (!notes) notes = [];
    return notes.filter((n) => n.id !== 'note-welcome-01');
  }

  private async saveNotes(notes: Note[]): Promise<void> {
    await storage.set(NOTES_STORAGE_KEY, notes);
  }

  async list(url?: string): Promise<Note[]> {
    const notes = await this.getStoredNotes();
    if (url) {
      const cleanUrl = url.split('#')[0].split('?')[0];
      return notes.filter((n) => n.url.includes(cleanUrl) || cleanUrl.includes(n.url));
    }
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async get(id: string): Promise<Note | null> {
    const notes = await this.getStoredNotes();
    return notes.find((n) => n.id === id) || null;
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const notes = await this.getStoredNotes();
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: input.url,
      pageTitle: input.pageTitle || 'Web Page Note',
      selectionText: input.selectionText,
      content: input.content,
      color: input.color || '#e0e7ff',
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notes.unshift(newNote);
    await this.saveNotes(notes);
    return newNote;
  }

  async update(id: string, patch: Partial<Note>): Promise<Note> {
    const notes = await this.getStoredNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Note with id ${id} not found`);
    }

    const updated = {
      ...notes[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    notes[index] = updated;
    await this.saveNotes(notes);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const notes = await this.getStoredNotes();
    const filtered = notes.filter((n) => n.id !== id);
    await this.saveNotes(filtered);
  }

  async search(query: string): Promise<Note[]> {
    const notes = await this.getStoredNotes();
    const q = query.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        (n.pageTitle && n.pageTitle.toLowerCase().includes(q)) ||
        (n.selectionText && n.selectionText.toLowerCase().includes(q)) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
}
