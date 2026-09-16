import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, Layers, Loader2 } from 'lucide-react';
import { flashcardsService } from '@/services';

interface FloatingSelectionSummaryProps {
  selectedText: string;
  targetRect: DOMRect;
  onClose: () => void;
  accentColor?: string;
}

export const FloatingSelectionSummary: React.FC<FloatingSelectionSummaryProps> = ({
  selectedText,
  targetRect,
  onClose,
  accentColor = '#FF6845',
}) => {
  const [bullets, setBullets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isFlashcardSaved, setIsFlashcardSaved] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const clean = selectedText.trim();
    if (!clean) {
      setBullets([]);
      setIsLoading(false);
      return;
    }

    // Heuristic synthesis for selected text
    const sentences = clean
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    const generatedBullets: string[] = [];

    if (sentences.length <= 1) {
      // Single sentence or phrase: break into key clause and core takeaway
      generatedBullets.push(clean);
      if (clean.length > 60) {
        const clauses = clean.split(/[,;:]+/).map((c) => c.trim()).filter((c) => c.length > 15);
        if (clauses.length > 1) {
          generatedBullets.push(`Focus: ${clauses[0]}`);
          generatedBullets.push(`Detail: ${clauses.slice(1).join(', ')}`);
        }
      }
    } else {
      // Multiple sentences: synthesize up to 3 concise bullet points
      for (let i = 0; i < Math.min(sentences.length, 3); i++) {
        generatedBullets.push(sentences[i]);
      }
    }

    setBullets(generatedBullets.length > 0 ? generatedBullets : [clean]);
    setIsLoading(false);
  }, [selectedText]);

  // Calculate position within viewport bounds: guaranteed clearance from selection
  const popupWidth = 320;
  const margin = 12;

  let left = targetRect.left + (targetRect.width / 2) - (popupWidth / 2);
  // Clamp horizontally
  if (left < margin) left = margin;
  if (left + popupWidth > window.innerWidth - margin) {
    left = window.innerWidth - popupWidth - margin;
  }

  const spaceBelow = window.innerHeight - targetRect.bottom;
  const spaceAbove = targetRect.top;
  const placeBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;

  const verticalPlacementStyle: React.CSSProperties = placeBelow
    ? {
        top: `${Math.max(margin, targetRect.bottom + 8)}px`,
        maxHeight: `${Math.max(140, spaceBelow - 20)}px`,
      }
    : {
        bottom: `${Math.max(margin, window.innerHeight - targetRect.top + 8)}px`,
        maxHeight: `${Math.max(140, spaceAbove - 20)}px`,
      };

  const handleCopy = () => {
    const textToCopy = `AI Selection Summary:\n${bullets.map((b) => `• ${b}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateFlashcard = async () => {
    try {
      await flashcardsService.create({
        front: `What is the key idea behind:\n"${selectedText.slice(0, 100)}${selectedText.length > 100 ? '...' : ''}"?`,
        back: bullets.map((b) => `• ${b}`).join('\n'),
        sourceMode: 'reading',
      });
      setIsFlashcardSaved(true);
      setTimeout(() => setIsFlashcardSaved(false), 2500);
    } catch (err) {
      console.debug('[FloatingSelectionSummary] Error saving flashcard:', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        width: `${popupWidth}px`,
        backgroundColor: '#151515',
        border: '1px solid #2A2A2A',
        overflowY: 'auto',
        ...verticalPlacementStyle,
        borderRadius: '12px',
        boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.1)',
        zIndex: 2147483645,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#F5F5F5',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '12px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #242424',
          backgroundColor: '#1A1A1A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles style={{ width: 11, height: 11 }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '11px', color: '#F5F5F5' }}>AI Selection Summary</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: 2,
            borderRadius: 4,
            display: 'flex',
          }}
          title="Close summary"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Selected Text Preview */}
      <div
        style={{
          padding: '8px 12px 6px 12px',
          backgroundColor: '#171717',
          borderBottom: '1px solid #222',
          fontSize: '11px',
          color: '#A0A0A0',
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={selectedText}
      >
        "{selectedText.slice(0, 80)}{selectedText.length > 80 ? '...' : ''}"
      </div>

      {/* Summary Content Body */}
      <div
        style={{
          padding: '10px 12px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 6, color: '#888' }}>
            <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: '11px' }}>Synthesizing text...</span>
          </div>
        ) : (
          bullets.map((point, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                lineHeight: 1.4,
                color: '#E5E5E5',
              }}
            >
              <span style={{ color: accentColor, fontWeight: 700, marginTop: 1 }}>•</span>
              <span style={{ flex: 1 }}>{point}</span>
            </div>
          ))
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #242424',
          backgroundColor: '#1A1A1A',
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 6,
            background: '#242424',
            border: '1px solid #333',
            color: isCopied ? '#34D399' : '#DDD',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isCopied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          type="button"
          onClick={handleCreateFlashcard}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 6,
            background: isFlashcardSaved ? '#34D39918' : `${accentColor}18`,
            border: `1px solid ${isFlashcardSaved ? '#34D39950' : `${accentColor}50`}`,
            color: isFlashcardSaved ? '#34D399' : accentColor,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isFlashcardSaved ? <Check style={{ width: 12, height: 12 }} /> : <Layers style={{ width: 12, height: 12 }} />}
          <span>{isFlashcardSaved ? 'Saved Card!' : 'Save Flashcard'}</span>
        </button>
      </div>
    </div>
  );
};
