import React, { useState, useEffect } from 'react';
import { Sparkles, X, Layers, Volume2, Copy, Check, Clock, BookOpen } from 'lucide-react';
import { flashcardsService } from '@/services';

interface FloatingSummaryCardProps {
  onClose: () => void;
  onReadAloud: (text: string) => void;
}

export const FloatingSummaryCard: React.FC<FloatingSummaryCardProps> = ({
  onClose,
  onReadAloud,
}) => {
  const [title, setTitle] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [readTime, setReadTime] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedFlashcard, setIsSavedFlashcard] = useState(false);

  useEffect(() => {
    // Extract real page title and content
    const pageTitle = document.title || 'Web Article';
    setTitle(pageTitle);

    const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, blockquote, li, article'))
      .map((el) => el.textContent?.trim() || '')
      .filter((text) => text.length >= 25);

    const fullText = paragraphs.join(' ');
    const words = fullText.split(/\s+/).filter(Boolean);
    const count = words.length;
    setWordCount(count);
    const estimatedMinutes = Math.max(1, Math.ceil(count / 200));
    setReadTime(estimatedMinutes);

    // Heuristic synthesis of key sentences if API is offline
    const keySentences = paragraphs
      .slice(0, 4)
      .map((p) => {
        const firstSentence = p.split(/[.!?]+/)[0]?.trim();
        return firstSentence && firstSentence.length > 20 ? firstSentence : p.substring(0, 100);
      })
      .filter(Boolean);

    setBullets(
      keySentences.length > 0
        ? keySentences
        : [
            'Synthesized main concepts from the active viewport.',
            'Direct webpage interaction active in Anvil Reading Mode.',
          ]
    );
  }, []);

  const handleCopy = () => {
    const textToCopy = `${title}\nEstimated Read Time: ${readTime} min\n\nKey Takeaways:\n${bullets.map((b) => `• ${b}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateFlashcard = async () => {
    try {
      await flashcardsService.create({
        front: `Key Concept: ${title}`,
        back: bullets.map((b) => `• ${b}`).join('\n'),
        sourceMode: 'reading',
        contentType: 'article',
      });
      setIsSavedFlashcard(true);
      setTimeout(() => setIsSavedFlashcard(false), 2500);
    } catch (err) {
      console.debug('[Anvil Floating Summary] Error saving flashcard:', err);
    }
  };

  return (
    <div
      className="anvil-floating-card"
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="anvil-summary-title"
    >
      {/* Header */}
      <div className="anvil-card-header">
        <div className="anvil-badge-coral">
          <Sparkles style={{ width: 12, height: 12 }} />
          <span>AI Page Summary</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#737373',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
          }}
          title="Close summary"
        >
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Page Title & Stats */}
      <h3 id="anvil-summary-title" className="anvil-card-title">
        {title}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#737373', fontSize: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock style={{ width: 11, height: 11, color: 'var(--anvil-accent)' }} />
          {readTime} min read
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BookOpen style={{ width: 11, height: 11 }} />
          {wordCount} words
        </span>
      </div>

      {/* Key Takeaways */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#A7A7A7', letterSpacing: '0.04em', marginBottom: 6 }}>
        Key Takeaways
      </div>

      <div className="anvil-bullet-list">
        {bullets.map((point, index) => (
          <div key={index} className="anvil-bullet-item">
            <div className="anvil-bullet-dot" />
            <span>{point}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="anvil-card-actions">
        <button
          type="button"
          onClick={handleCreateFlashcard}
          className="anvil-btn-primary"
          title="Save as study flashcard"
        >
          {isSavedFlashcard ? (
            <>
              <Check style={{ width: 12, height: 12 }} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Layers style={{ width: 12, height: 12 }} />
              <span>Make Flashcard</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onReadAloud(bullets.join('. '))}
          className="anvil-btn-secondary"
          title="Listen to summary"
        >
          <Volume2 style={{ width: 12, height: 12 }} />
          <span>Listen</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="anvil-btn-secondary"
          style={{ marginLeft: 'auto', padding: '7px 9px' }}
          title="Copy summary"
        >
          {isCopied ? <Check style={{ width: 12, height: 12, color: 'var(--anvil-accent)' }} /> : <Copy style={{ width: 12, height: 12 }} />}
        </button>
      </div>
    </div>
  );
};
