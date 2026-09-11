// Central Service Hub - Clean interfaces backed by persistent Chrome Extension storage and Real API clients.
// Zero mock/dummy data.

import { NotesService } from './api/notes';
import { AnnotationsService } from './api/annotations';
import { FlashcardService } from './api/flashcards';
import { BookmarksService } from './api/bookmarks';
import { InterviewService } from './api/interview';
import { ExamService } from './api/exam';
import { ProgressService } from './api/progress';
import { AIService } from './api/ai';

import { StorageNotesService } from './storage/notesService';
import { StorageAnnotationsService } from './storage/annotationsService';
import { StorageFlashcardsService } from './storage/flashcardsService';
import { StorageBookmarksService } from './storage/bookmarksService';
import { StorageInterviewService } from './storage/interviewService';
import { StorageExamService } from './storage/examService';
import { StorageProgressService } from './storage/progressService';
import { RealAIService } from './api/aiService';

export const notesService: NotesService = new StorageNotesService();
export const annotationsService: AnnotationsService = new StorageAnnotationsService();
export const flashcardsService: FlashcardService = new StorageFlashcardsService();
export const bookmarksService: BookmarksService = new StorageBookmarksService();
export const interviewService: InterviewService = new StorageInterviewService();
export const examService: ExamService = new StorageExamService();
export const progressService: ProgressService = new StorageProgressService();
export const aiService: AIService = new RealAIService();

export * from './api/notes';
export * from './api/annotations';
export * from './api/flashcards';
export * from './api/bookmarks';
export * from './api/interview';
export * from './api/exam';
export * from './api/progress';
export * from './api/ai';
export * from './api/aiService';
export * from './storage/storage';
