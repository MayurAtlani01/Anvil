import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  FileText,
  BarChart3,
  Bookmark as BookmarkIcon,
  User,
  X,
  Upload,
  Play,
  CheckCircle2,
  Mic,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { InterviewFeatureId } from './InterviewCollapsedRail';
import { interviewService, bookmarksService } from '@/services';
import { InterviewRound, InterviewSession, Bookmark, DifficultyLevel } from '@/types';
import { DEFAULT_INTERVIEW_ROUNDS } from '@/services/storage/interviewService';

interface FloatingInterviewCardProps {
  feature: InterviewFeatureId;
  onClose: () => void;
  onExpandToSidePanel?: () => void;
}

export const FloatingInterviewCard: React.FC<FloatingInterviewCardProps> = ({
  feature,
  onClose,
  onExpandToSidePanel,
}) => {
  const [rounds, setRounds] = useState<InterviewRound[]>(DEFAULT_INTERVIEW_ROUNDS);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isAnswerSaved, setIsAnswerSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load real data from services
    interviewService.getRounds().then((r) => setRounds(r)).catch(() => {});
    interviewService.getSessionHistory().then((h) => setHistory(h)).catch(() => {});
    interviewService.getLastResumeAnalysis().then((res) => {
      if (res?.fileName) setResumeName(res.fileName);
    }).catch(() => {});
    bookmarksService.list({ contentType: 'question' }).then((bms) => {
      setBookmarks(bms);
    }).catch(() => {});
  }, [feature]);

  const handleStartRound = async (roundId: string) => {
    setErrorMessage(null);
    try {
      const session = await interviewService.startSession(
        roundId,
        selectedDifficulty === 'all' ? undefined : selectedDifficulty
      );
      setActiveSession(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'No questions available in this track yet.');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession || !answerInput.trim()) return;
    const currentQ = activeSession.questions[activeSession.currentQuestionIndex];
    if (!currentQ) return;

    try {
      const updated = await interviewService.submitAnswer(
        activeSession.id,
        currentQ.id,
        answerInput.trim()
      );
      setActiveSession(updated);
      setAnswerInput('');
      setIsAnswerSaved(true);
      setTimeout(() => setIsAnswerSaved(false), 2000);
    } catch (err) {
      console.debug('[Anvil Interview] submitAnswer error:', err);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await interviewService.analyzeResume(file.name, '');
      setResumeName(file.name);
      setIsUploading(false);
    } catch {
      setIsUploading(false);
    }
  };

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
          {feature === 'rounds' && <ListOrdered style={{ width: 12, height: 12 }} />}
          {feature === 'resume' && <FileText style={{ width: 12, height: 12 }} />}
          {feature === 'stats' && <BarChart3 style={{ width: 12, height: 12 }} />}
          {feature === 'bookmarks' && <BookmarkIcon style={{ width: 12, height: 12 }} />}
          {feature === 'mock' && <User style={{ width: 12, height: 12 }} />}
          <span>
            {feature === 'rounds' && 'Interview Rounds'}
            {feature === 'resume' && 'Resume Analyzer'}
            {feature === 'stats' && 'Improvement Stats'}
            {feature === 'bookmarks' && 'Bookmarked Questions'}
            {feature === 'mock' && 'Mock Interview'}
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

      {/* 2. Content Sections */}

      {/* FEATURE 1: INTERVIEW ROUNDS */}
      {feature === 'rounds' && (
        <div>
          {/* Difficulty Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: '#A7A7A7', fontWeight: 600 }}>Difficulty:</span>
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

          {errorMessage && (
            <div style={{ padding: '8px 10px', background: 'var(--anvil-accent-surface)', border: '1px solid var(--anvil-accent)', borderRadius: 8, fontSize: 11, color: 'var(--anvil-accent)', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Rounds List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {rounds.map((round) => (
              <div
                key={round.id}
                style={{
                  padding: '10px 12px',
                  background: '#1B1B1B',
                  border: '1px solid #242424',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5' }}>{round.title}</span>
                  <span style={{ fontSize: 10, color: '#737373', fontFamily: 'monospace' }}>~{round.estimatedDurationMin}m</span>
                </div>
                <p style={{ fontSize: 11, color: '#A7A7A7', lineHeight: 1.35 }}>{round.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTop: '1px solid #222' }}>
                  <span style={{ fontSize: 10, color: '#737373' }}>{round.totalQuestions} questions</span>
                  <button
                    type="button"
                    onClick={() => handleStartRound(round.id)}
                    className="anvil-btn-primary"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                  >
                    <Play style={{ width: 10, height: 10 }} />
                    <span>Start Track</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEATURE 2: RESUME ANALYZER */}
      {feature === 'resume' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              padding: 16,
              border: '1.5px dashed #2A2A2A',
              borderRadius: 12,
              textAlign: 'center',
              background: '#1B1B1B',
            }}
          >
            <Upload style={{ width: 24, height: 24, color: 'var(--anvil-accent)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', marginBottom: 2 }}>Resume Parser & Matcher</div>
            <p style={{ fontSize: 11, color: '#A7A7A7', marginBottom: 10 }}>Upload your resume to align interview questions with your background.</p>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--anvil-accent-surface)',
                border: '1px solid var(--anvil-accent)',
                color: 'var(--anvil-accent)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Upload style={{ width: 12, height: 12 }} />
              <span>{isUploading ? 'Analyzing File...' : 'Upload Resume (.pdf, .txt)'}</span>
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {resumeName ? (
            <div style={{ padding: '10px 12px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--anvil-accent)', marginBottom: 2 }}>Current Active Resume</div>
              <div style={{ fontSize: 12, color: '#F5F5F5', fontWeight: 600 }}>{resumeName}</div>
              <div style={{ fontSize: 10, color: '#737373', marginTop: 2 }}>Indexed for question customization.</div>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '12px 0' }}>
              No resume uploaded yet.
            </div>
          )}
        </div>
      )}

      {/* FEATURE 3: IMPROVEMENT STATS */}
      {feature === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--anvil-accent)' }}>{history.length}</div>
              <div style={{ fontSize: 10, color: '#A7A7A7', textTransform: 'uppercase', fontWeight: 600 }}>Sessions Run</div>
            </div>
            <div style={{ padding: '10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F5F5F5' }}>
                {history.reduce((acc, h) => acc + (h.answers?.length || 0), 0)}
              </div>
              <div style={{ fontSize: 10, color: '#A7A7A7', textTransform: 'uppercase', fontWeight: 600 }}>Answers Saved</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#A7A7A7', marginTop: 4 }}>Recent Sessions</div>

          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '18px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No interview sessions recorded yet. Start a track to record your answers.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {history.map((h) => (
                <div key={h.id} style={{ padding: '8px 10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#F5F5F5' }}>{h.roundTitle}</span>
                  <span style={{ fontSize: 10, color: '#737373' }}>{h.answers?.length || 0} answered</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 4: BOOKMARKED QUESTIONS */}
      {feature === 'bookmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookmarks.length === 0 ? (
            <div style={{ fontSize: 11, color: '#737373', textAlign: 'center', padding: '24px 0', border: '1px solid #242424', borderRadius: 10 }}>
              No interview questions bookmarked yet. Bookmark key questions during practice.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
              {bookmarks.map((bm) => (
                <div key={bm.id} style={{ padding: '8px 10px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#F5F5F5' }}>{bm.title}</div>
                  {bm.snippet && <p style={{ fontSize: 10, color: '#A7A7A7', marginTop: 2 }}>{bm.snippet}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 5: MOCK INTERVIEW */}
      {feature === 'mock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeSession && activeSession.questions[activeSession.currentQuestionIndex] ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--anvil-accent)' }}>{activeSession.roundTitle}</span>
                <span style={{ fontSize: 10, color: '#737373', fontFamily: 'monospace' }}>
                  Q{activeSession.currentQuestionIndex + 1} of {activeSession.questions.length}
                </span>
              </div>

              <div style={{ padding: '10px 12px', background: '#1B1B1B', border: '1px solid #242424', borderRadius: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>
                  {activeSession.questions[activeSession.currentQuestionIndex].title}
                </div>
                <p style={{ fontSize: 11, color: '#A7A7A7', lineHeight: 1.4 }}>
                  {activeSession.questions[activeSession.currentQuestionIndex].prompt}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#A7A7A7', textTransform: 'uppercase' }}>Your Solution / Approach</label>
                <span style={{ fontSize: 10, color: '#737373', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Mic style={{ width: 10, height: 10 }} /> Voice input (Coming soon)
                </span>
              </div>

              <textarea
                rows={3}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Walk through time/space complexity and your thought process..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#1B1B1B',
                  border: '1px solid #2A2A2A',
                  color: '#F5F5F5',
                  fontSize: 11,
                  outline: 'none',
                  resize: 'none',
                  marginBottom: 8,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!answerInput.trim()}
                  className="anvil-btn-primary"
                  style={{ opacity: answerInput.trim() ? 1 : 0.5 }}
                >
                  <CheckCircle2 style={{ width: 11, height: 11 }} />
                  <span>{isAnswerSaved ? 'Answer Recorded!' : 'Save & Analyze Answer'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <User style={{ width: 28, height: 28, color: 'var(--anvil-accent)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F5', marginBottom: 2 }}>Interactive Mock Interview</div>
              <p style={{ fontSize: 11, color: '#A7A7A7', marginBottom: 12 }}>
                Run realistic rounds, record answers, and get AI feedback.
              </p>
              <button
                type="button"
                onClick={() => handleStartRound('round-dsa')}
                className="anvil-btn-primary"
              >
                <Play style={{ width: 11, height: 11 }} />
                <span>Start Rapid DSA Mock</span>
              </button>
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
          <span>Open Full Interview Dashboard</span>
        </button>
      </div>
    </div>
  );
};
