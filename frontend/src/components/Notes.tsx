import React, { useState } from 'react';
import { Plus, Trash2, Tag, Calendar, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { Note } from '@/types';
import { useNotesStore } from '@/store/useNotesStore';
import { useFlashcardsStore } from '@/store/useFlashcardsStore';
import { useToastStore } from '@/store/useToastStore';
import { formatDate, truncate } from '@/utils/cn';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { cn } from '@/utils/cn';

interface NotesProps {
  currentUrl?: string;
  className?: string;
}

export const Notes: React.FC<NotesProps> = ({ currentUrl, className }) => {
  const { notes, createNote, deleteNote, updateNote } = useNotesStore();
  const { createFlashcard } = useFlashcardsStore();
  const { addToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('Study, Concept');
  const [selectedColor, setSelectedColor] = useState('#eef2ff');

  const displayNotes =
    filterScope === 'current' && currentUrl
      ? notes.filter((n) => n.url.includes(currentUrl) || currentUrl.includes(n.url))
      : notes;

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    await createNote({
      url: currentUrl || window.location.href,
      pageTitle: document.title || 'Page Notes',
      content: noteContent.trim(),
      tags: noteTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      color: selectedColor,
    });

    addToast({ type: 'success', message: 'Note saved' });
    setNoteContent('');
    setIsCreating(false);
  };

  const handleCreateFlashcardFromNote = async (note: Note) => {
    await createFlashcard({
      front: note.selectionText || `Key insight from: ${note.pageTitle || 'Study Note'}`,
      back: note.content,
      sourceMode: 'reading',
      contentType: 'note',
    });
    addToast({ type: 'success', message: 'Turned note into flashcard' });
  };

  const colors = ['#eef2ff', '#fef3c7', '#ecfdf5', '#fdf2f8', '#f4f4f5'];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Scope filter & New Note Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setFilterScope('current')}
            className={cn(
              'px-2 py-0.5 rounded text-2xs font-medium transition-colors',
              filterScope === 'current'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-subtle'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            )}
          >
            Current Page ({notes.filter((n) => currentUrl && n.url.includes(currentUrl)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('all')}
            className={cn(
              'px-2 py-0.5 rounded text-2xs font-medium transition-colors',
              filterScope === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-subtle'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            )}
          >
            All Notes ({notes.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-2.5 py-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-subtle flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Note
        </button>
      </div>

      {/* Notes List */}
      {displayNotes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Annotate any text on the page or write down quick study notes here."
          actionLabel="Create First Note"
          onAction={() => setIsCreating(true)}
        />
      ) : (
        <div className="space-y-2">
          {displayNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-subtle space-y-2 group"
            >
              {note.selectionText && (
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-850 border-l-2 border-brand-500 text-2xs italic text-zinc-600 dark:text-zinc-300">
                  "{truncate(note.selectionText, 140)}"
                </div>
              )}

              <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                {note.content}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-2xs text-zinc-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(note.createdAt)}
                  </span>
                  {note.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleCreateFlashcardFromNote(note)}
                    title="Make Flashcard"
                    className="p-1 rounded text-zinc-400 hover:text-brand-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    title="Delete Note"
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create Study Note"
        description="Attach notes to this page or record personal explanations."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!noteContent.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 rounded shadow-subtle"
            >
              Save Note
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Note Content
            </label>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your study notes, insights, or formulas..."
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              placeholder="DSA, System Design, GATE"
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
