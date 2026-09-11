import React, { useState } from 'react';
import { Layers, X, Check, ArrowRight } from 'lucide-react';
import { flashcardsService } from '@/services';

interface FloatingFlashcardCreatorProps {
  initialText?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const FloatingFlashcardCreator: React.FC<FloatingFlashcardCreatorProps> = ({
  initialText = '',
  onClose,
  onSaved,
}) => {
  const [front, setFront] = useState(
    initialText ? `Question: What is meant by "${initialText.substring(0, 40)}..."?` : 'Core Concept'
  );
  const [back, setBack] = useState(initialText || 'Definition and key details from current reading.');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) return;

    try {
      await flashcardsService.create({
        front: front.trim(),
        back: back.trim(),
        sourceMode: 'reading',
        contentType: 'article',
      });
      setIsSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 900);
    } catch (err) {
      console.debug('[Anvil Flashcards] Error saving:', err);
    }
  };

  return (
    <div
      className="anvil-floating-card"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ width: 340 }}
      role="dialog"
    >
      <div className="anvil-card-header">
        <div className="anvil-badge-coral">
          <Layers style={{ width: 12, height: 12 }} />
          <span>New Flashcard</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 2 }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#A7A7A7', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
            Front (Prompt / Question)
          </label>
          <input
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              background: '#1D1D1D',
              border: '1px solid #2A2A2A',
              color: '#F5F5F5',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#A7A7A7', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
            Back (Answer / Details)
          </label>
          <textarea
            rows={3}
            value={back}
            onChange={(e) => setBack(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              background: '#1D1D1D',
              border: '1px solid #2A2A2A',
              color: '#F5F5F5',
              fontSize: 12,
              outline: 'none',
              resize: 'none',
            }}
          />
        </div>
      </div>

      <div className="anvil-card-actions" style={{ justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="anvil-btn-secondary">
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="anvil-btn-primary">
          {isSaved ? (
            <>
              <Check style={{ width: 12, height: 12 }} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <span>Save Card</span>
              <ArrowRight style={{ width: 12, height: 12 }} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
