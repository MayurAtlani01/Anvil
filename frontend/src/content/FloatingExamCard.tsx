import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sigma,
  ScrollText,
  Search,
  Layers,
  BarChart2,
  PieChart,
  Bookmark as BookmarkIcon,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  BookmarkCheck,
} from 'lucide-react';
import { ExamFeatureId } from './ExamCollapsedRail';
import { examService, bookmarksService, progressService, flashcardsService } from '@/services';
import { Formula, Question, RevisionNote, Bookmark, DifficultyLevel } from '@/types';

interface FloatingExamCardProps {
  feature: ExamFeatureId;
  onClose: () => void;
  onExpandToSidePanel?: () => void;
  onCreateFlashcard?: (text: string) => void;
}

export const FloatingExamCard: React.FC<FloatingExamCardProps> = ({
  feature,
  onClose,
  onExpandToSidePanel,
  onCreateFlashcard,
}) => {
  const [pyqs, setPyqs] = useState<Question[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [notes, setNotes] = useState<RevisionNote[]>([]);
  const [frequentTopics, setFrequentTopics] = useState<Array<{ topic: string; subject: string; count: number; weight: number }>>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [savedFlashcardId, setSavedFlashcardId] = useState<string | null>(null);

  useEffect(() => {
    examService.getPYQs().then((q) => setPyqs(q)).catch(() => {});
    examService.getFormulas().then((f) => setFormulas(f)).catch(() => {});
    examService.getRevisionNotes().then((n) => setNotes(n)).catch(() => {});
    examService.getFrequentlyAskedTopics().then((t) => setFrequentTopics(t)).catch(() => {});
    bookmarksService.list().then((b) => {
      setBookmarks(b.filter((bm) => bm.contentType === 'formula' || bm.contentType === 'note' || bm.tags?.includes('exam')));
    }).catch(() => {});
    progressService.getStats().then((stats) => {
      if (stats?.recentActivity) {
        setSolvedCount(stats.recentActivity.filter((a) => a.activityType === 'pyq_solved').length);
      }
    }).catch(() => {});
  }, [feature]);

  const handleMakeFormulaFlashcard = async (f: Formula) => {
    try {
      await flashcardsService.create({
        front: `Formula: ${f.name} (${f.subject})`,
        back: `${f.formula}\n\nExplanation: ${f.explanation}`,
        sourceMode: 'exam',
        contentType: 'formula',
      });
      setSavedFlashcardId(f.id);
      setTimeout(() => setSavedFlashcardId(null), 2000);
    } catch (err) {
      console.debug('[Anvil Exam] Failed to create flashcard:', err);
    }
  };

  const handleSolvePYQ = async (id: string) => {
    const q = pyqs.find((p) => p.id === id);
    await progressService.recordActivity({
      mode: 'exam',
      activityType: 'pyq_solved',
      score: 100,
      metadata: { questionId: id, questionTitle: q?.title },
    });
    setSolvedCount((prev) => prev + 1);
  };

  // Filtered lists
  const filteredPyqs = pyqs.filter((q) => {
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      return q.title.toLowerCase().includes(s) || q.prompt.toLowerCase().includes(s);
    }
    return true;
  });

  const filteredFormulas = formulas.filter((f) => {
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(s) || f.formula.toLowerCase().includes(s) || f.explanation.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div
      className="anvil-floating-card"
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      style={{ width: 380 }}
    >
      {/* 1. Header */}
      <div className="anvil-card-header">
        <div className="anvil-badge-coral">
          {feature === 'pyqs' && <FileText style={{ width: 12, height: 12 }} />}
          {feature === 'formulas' && <Sigma style={{ width: 12, height: 12 }} />}
          {feature === 'revision' && <ScrollText style={{ width: 12, height: 12 }} />}
          {feature === 'search' && <Search style={{ width: 12, height: 12 }} />}
          {feature === 'flashcards' && <Layers style={{ width: 12, height: 12 }} />}
          {feature === 'frequent' && <BarChart2 style={{ width: 12, height: 12 }} />}
          {feature === 'progress' && <PieChart style={{ width: 12, height: 12 }} />}
          {feature === 'bookmarks' && <BookmarkIcon style={{ width: 12, height: 12 }} />}
          <span>
            {feature === 'pyqs' && 'Previous Year Questions'}
            {feature === 'formulas' && 'Formula Repository'}
            {feature === 'revision' && 'Quick Revision Notes'}
            {feature === 'search' && 'Exam Search'}
            {feature === 'flashcards' && 'Exam Flashcards'}
            {feature === 'frequent' && 'Frequently Asked Topics'}
            {feature === 'progress' && 'Progress Chart'}
            {feature === 'bookmarks' && 'Exam Bookmarks'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 2 }}
          title="Close card"
        >
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* 2. Feature Specific Body */}

      {/* FEATURE 1: PYQS */}
      {feature === 'pyqs' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: '#A7A7A7', fontWeight: 600 }}>Difficulty Filter:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  style={{
                    padding: '3px 7px',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: selectedDifficulty === d ? 'var(--anvil-accent)' : '#2A2A2A',
                    background: selectedDifficulty === d ? 'var(--anvil-accent-surface)' : '#1B1B1B',
                    color: selectedDifficulty === d ? 'var(--anvil-accent)' : '#A7A7A7',
                    cursor: 'pointer',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {filteredPyqs.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '24px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No previous year questions in bank.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {filteredPyqs.map((q) => (
                <div key={q.id} style={{ padding: '10px 12px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--anvil-accent)', textTransform: 'uppercase' }}>{q.subject} {q.year ? `(${q.year})` : ''}</span>
                    <span style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase' }}>{q.difficulty}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>{q.title}</div>
                  <p style={{ fontSize: 11, color: '#A7A7A7', lineHeight: 1.35, marginBottom: 8 }}>{q.prompt}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleSolvePYQ(q.id)}
                      className="anvil-btn-secondary"
                      style={{ padding: '4px 8px', fontSize: 10 }}
                    >
                      <CheckCircle2 style={{ width: 10, height: 10 }} />
                      <span>Mark Solved</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 2: FORMULA REPOSITORY */}
      {feature === 'formulas' && (
        <div>
          {formulas.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '24px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No formulas saved in repository yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 270, overflowY: 'auto' }}>
              {formulas.map((f) => (
                <div key={f.id} style={{ padding: '10px 12px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--anvil-accent)' }}>{f.subject} • {f.topic}</span>
                    <button
                      type="button"
                      onClick={() => handleMakeFormulaFlashcard(f)}
                      className="anvil-btn-secondary"
                      style={{ padding: '3px 7px', fontSize: 10 }}
                    >
                      <Sparkles style={{ width: 10, height: 10 }} />
                      <span>{savedFlashcardId === f.id ? 'Card Saved!' : 'Flashcard'}</span>
                    </button>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>{f.name}</div>
                  <div style={{ padding: '6px 8px', background: '#111111', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: 'var(--anvil-accent)', textAlign: 'center', marginBottom: 6, border: '1px solid #242424' }}>
                    {f.formula}
                  </div>
                  <p style={{ fontSize: 10, color: '#A7A7A7', lineHeight: 1.3 }}>{f.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 3: QUICK REVISION NOTES */}
      {feature === 'revision' && (
        <div>
          {notes.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '24px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No quick revision notes saved yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 270, overflowY: 'auto' }}>
              {notes.map((n) => (
                <div key={n.id} style={{ padding: '10px 12px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--anvil-accent)' }}>{n.subject} • {n.topic}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', margin: '3px 0' }}>{n.title}</div>
                  <p style={{ fontSize: 11, color: '#A7A7A7', lineHeight: 1.35, marginBottom: 6 }}>{n.summary}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderLeft: '2px solid var(--anvil-accent)', paddingLeft: 8 }}>
                    {n.keyPoints?.slice(0, 3).map((pt, i) => (
                      <span key={i} style={{ fontSize: 10, color: '#D4D4D8' }}>• {pt}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 4: SEARCH */}
      {feature === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ width: 14, height: 14, position: 'absolute', left: 10, top: 9, color: '#737373' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PYQs, formulas, notes..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: 8,
                background: '#1B1B1B',
                border: '1px solid #2A2A2A',
                color: '#F5F5F5',
                fontSize: 11,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredPyqs.map((q) => (
              <div key={q.id} style={{ padding: '7px 10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--anvil-accent)', textTransform: 'uppercase' }}>PYQ • {q.subject}</span>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#F5F5F5' }}>{q.title}</div>
              </div>
            ))}
            {filteredFormulas.map((f) => (
              <div key={f.id} style={{ padding: '7px 10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--anvil-accent)', textTransform: 'uppercase' }}>Formula • {f.name}</span>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#F5F5F5' }}>{f.formula}</div>
              </div>
            ))}
            {!searchQuery.trim() && (
              <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '18px 0' }}>
                Type to search across exam questions and formulas.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FEATURE 5: FLASHCARDS */}
      {feature === 'flashcards' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Layers style={{ width: 28, height: 28, color: 'var(--anvil-accent)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', marginBottom: 2 }}>Exam Flashcards Deck</div>
          <p style={{ fontSize: 11, color: '#A7A7A7', marginBottom: 12 }}>
            Memorize formulas and definitions with active recall.
          </p>
          <button
            type="button"
            onClick={() => onExpandToSidePanel?.()}
            className="anvil-btn-primary"
          >
            <Layers style={{ width: 11, height: 11 }} />
            <span>Open Flashcard Review</span>
          </button>
        </div>
      )}

      {/* FEATURE 6: FREQUENTLY ASKED */}
      {feature === 'frequent' && (
        <div>
          {frequentTopics.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '24px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No topic recurrence data available yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {frequentTopics.map((t, idx) => (
                <div key={idx} style={{ padding: '8px 10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
                    <span>#{idx + 1} {t.topic}</span>
                    <span style={{ color: '#737373', fontSize: 10 }}>{t.count} questions ({t.weight}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#242424', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${t.weight}%`, height: '100%', background: 'var(--anvil-accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 7: PROGRESS CHART */}
      {feature === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--anvil-accent)' }}>{solvedCount}</div>
              <div style={{ fontSize: 10, color: '#A7A7A7', textTransform: 'uppercase', fontWeight: 600 }}>PYQs Solved</div>
            </div>
            <div style={{ padding: '10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F5F5F5' }}>{formulas.length}</div>
              <div style={{ fontSize: 10, color: '#A7A7A7', textTransform: 'uppercase', fontWeight: 600 }}>Formulas Saved</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '10px 0' }}>
            Real-time exam progress tracked across your study sessions.
          </div>
        </div>
      )}

      {/* FEATURE 8: BOOKMARKS */}
      {feature === 'bookmarks' && (
        <div>
          {bookmarks.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '24px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No exam items bookmarked yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
              {bookmarks.map((bm) => (
                <div key={bm.id} style={{ padding: '8px 10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--anvil-accent)', textTransform: 'uppercase' }}>{bm.contentType}</span>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#F5F5F5' }}>{bm.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Footer Action */}
      <div className="anvil-card-actions">
        <button
          type="button"
          onClick={() => onExpandToSidePanel?.()}
          className="anvil-btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <ExternalLink style={{ width: 11, height: 11 }} />
          <span>Open Full Exam Dashboard</span>
        </button>
      </div>
    </div>
  );
};
