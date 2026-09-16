import React, { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  BookOpen,
  Languages,
  Layers,
  X,
  Check,
  Volume2,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { aiService, flashcardsService } from '@/services';
import { DictionaryEntry, TranslationResult } from '@/types';

export const POPULAR_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pt', name: 'Portuguese' },
];

export type PopupSubView = 'meaning' | 'translate' | 'flashcard_confirm';

interface ReadingContextualPopupProps {
  targetText: string;
  targetRect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  };
  onAnnotate: () => Promise<void>;
  onClose: () => void;
  accentColor?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onViewChange?: (view: PopupSubView) => void;
  initialView?: PopupSubView;
}

export const ReadingContextualPopup: React.FC<ReadingContextualPopupProps> = ({
  targetText,
  targetRect,
  onAnnotate,
  onClose,
  accentColor = '#FF6845',
  onMouseEnter,
  onMouseLeave,
  onViewChange,
  initialView = 'meaning',
}) => {
  const [view, setViewInternal] = useState<PopupSubView>(initialView);
  const setView = (v: PopupSubView) => {
    setViewInternal(v);
    onViewChange?.(v);
  };
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
  const [annotateSuccess, setAnnotateSuccess] = useState<boolean>(false);

  // Meaning State
  const [isLoadingMeaning, setIsLoadingMeaning] = useState<boolean>(false);
  const [dictionaryEntry, setDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [meaningError, setMeaningError] = useState<string | null>(null);

  // Translation State
  const [selectedLang, setSelectedLang] = useState<string>('es');
  const [isLoadingTranslate, setIsLoadingTranslate] = useState<boolean>(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Flashcard State
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState<boolean>(false);
  const [flashcardSuccess, setFlashcardSuccess] = useState<boolean>(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate position: cleanly place below the selection, or if near bottom of viewport, place above
  // Guaranteed clearance: NEVER comes in between the selection and the user
  const popupWidth = 340;
  const margin = 12;

  const leftPosition = Math.max(
    margin,
    Math.min(window.innerWidth - popupWidth - margin, targetRect.left + targetRect.width / 2 - popupWidth / 2)
  );

  const spaceBelow = window.innerHeight - targetRect.bottom;
  const spaceAbove = targetRect.top;
  const placeBelow = spaceBelow >= 210 || spaceBelow >= spaceAbove;

  const verticalPlacementStyle: React.CSSProperties = placeBelow
    ? {
        top: `${Math.max(margin, targetRect.bottom + 8)}px`,
        maxHeight: `${Math.max(140, spaceBelow - 20)}px`,
      }
    : {
        bottom: `${Math.max(margin, window.innerHeight - targetRect.top + 8)}px`,
        maxHeight: `${Math.max(140, spaceAbove - 20)}px`,
      };



  // 1. ANNOTATE ACTION
  const handleAnnotateClick = async () => {
    if (isAnnotating || annotateSuccess) return;
    setIsAnnotating(true);
    try {
      await onAnnotate();
      setAnnotateSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('[Anvil] Annotation error:', err);
    } finally {
      setIsAnnotating(false);
    }
  };

  // 2. MEANING ACTION
  const handleMeaningClick = async () => {
    setView('meaning');
    setIsLoadingMeaning(true);
    setMeaningError(null);
    setDictionaryEntry(null);
    setExplanationText(null);

    const cleanText = targetText.trim();
    const cleanWord = cleanText.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    const words = cleanWord.split(/\s+/).filter(Boolean);

    try {
      if (words.length === 1 && cleanWord.length < 40) {
        const entry = await aiService.defineWord(cleanWord);
        if (entry && entry.definition) {
          setDictionaryEntry(entry);
          setIsLoadingMeaning(false);
          return;
        }
      }

      // If not in dictionary or multi-word phrase, use AI explanation
      const exp = await aiService.explain(cleanText);
      setExplanationText(exp.explanation || exp.simplified);
    } catch (err: any) {
      setMeaningError(err.message || 'Could not look up meaning. Please ensure backend AI is running.');
    } finally {
      setIsLoadingMeaning(false);
    }
  };

  // 3. TRANSLATE ACTION
  const fetchTranslation = async (lang: string) => {
    setIsLoadingTranslate(true);
    setTranslateError(null);
    try {
      const res = await aiService.translate(targetText, lang);
      setTranslationResult(res);
    } catch (err: any) {
      setTranslateError(err.message || 'Translation service not configured.');
    } finally {
      setIsLoadingTranslate(false);
    }
  };

  const handleTranslateClick = () => {
    setView('translate');
    fetchTranslation(selectedLang);
  };

  // 4. FLASHCARD CONFIRMATION & CREATION
  const handleFlashcardClick = () => {
    setView('flashcard_confirm');
    setFlashcardError(null);
    setFlashcardSuccess(false);
  };

  const handleConfirmCreateFlashcard = async () => {
    if (isCreatingFlashcard || flashcardSuccess) return;
    setIsCreatingFlashcard(true);
    setFlashcardError(null);

    try {
      const cleanSnippet = targetText.trim().replace(/\s+/g, ' ');
      const promptTitle = cleanSnippet.length > 50
        ? `What is the core concept of: "${cleanSnippet.substring(0, 48)}..."?`
        : `What is meant by "${cleanSnippet}"?`;

      await flashcardsService.create({
        front: promptTitle,
        back: cleanSnippet,
        sourceMode: 'reading',
        contentType: 'article',
        sourceUrl: window.location.href,
        difficulty: 'medium',
      });

      setFlashcardSuccess(true);
      setTimeout(() => {
        onClose();
      }, 850);
    } catch (err: any) {
      console.error('[Anvil] Error creating flashcard:', err);
      setFlashcardError(err.message || 'Unable to save flashcard.');
      setIsCreatingFlashcard(false);
    }
  };

  useEffect(() => {
    setViewInternal(initialView);
    if (initialView === 'meaning') {
      handleMeaningClick();
    } else if (initialView === 'translate') {
      fetchTranslation(selectedLang);
    }
  }, [initialView, targetText]);

  const handlePronounce = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      ref={containerRef}
      className="anvil-reading-contextual-popup"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        left: `${leftPosition}px`,
        width: `${popupWidth}px`,
        zIndex: 2147483647,
        pointerEvents: 'auto',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        ...verticalPlacementStyle,
      }}
    >
      {/* ============================================================ */}
      {/* 1. MEANING VIEW                                              */}
      {/* ============================================================ */}
      {view === 'meaning' && (
        <div
          style={{
            background: 'var(--anvil-card-bg, #151515)',
            border: '1px solid var(--anvil-border, #2A2A2A)',
            borderRadius: 14,
            padding: 14,
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.1)',
            color: 'var(--anvil-text, #F5F5F5)',
            overflowY: 'auto',
            maxHeight: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '1px solid var(--anvil-border-subtle, #242424)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: accentColor,
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <BookOpen style={{ width: 12, height: 12 }} />
                Meaning
              </span>
            </div>


            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--anvil-text-subtle, #737373)',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>

          {/* Loading */}
          {isLoadingMeaning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--anvil-text-muted, #A7A7A7)', fontSize: 12 }}>
              <Loader2 className="animate-spin" style={{ width: 15, height: 15, color: accentColor }} />
              <span>Looking up definition...</span>
            </div>
          )}

          {/* Error */}
          {meaningError && (
            <div style={{ fontSize: 11.5, color: '#FF7D7D', lineHeight: 1.4, padding: '6px 0' }}>
              {meaningError}
            </div>
          )}

          {/* Dictionary Entry */}
          {dictionaryEntry && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--anvil-text, #F5F5F5)' }}>
                  {dictionaryEntry.word}
                </span>
                {dictionaryEntry.phonetic && (
                  <span style={{ fontSize: 11, color: 'var(--anvil-text-muted, #A7A7A7)', fontStyle: 'italic' }}>
                    {dictionaryEntry.phonetic}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handlePronounce(dictionaryEntry.word)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: accentColor,
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                  title="Pronounce"
                >
                  <Volume2 style={{ width: 13, height: 13 }} />
                </button>
              </div>

              <div style={{ fontSize: 10, color: accentColor, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {dictionaryEntry.partOfSpeech}
              </div>

              <p style={{ fontSize: 12, color: 'var(--anvil-text, #D4D4D8)', margin: '0 0 6px 0', lineHeight: 1.45 }}>
                {dictionaryEntry.definition}
              </p>

              {dictionaryEntry.example && (
                <p style={{ fontSize: 11, color: 'var(--anvil-text-muted, #A7A7A7)', fontStyle: 'italic', margin: 0 }}>
                  "{dictionaryEntry.example}"
                </p>
              )}
            </div>
          )}

          {/* AI Explanation fallback */}
          {!dictionaryEntry && explanationText && !isLoadingMeaning && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--anvil-text-muted, #A7A7A7)', marginBottom: 4, fontStyle: 'italic' }}>
                "{targetText.substring(0, 60)}{targetText.length > 60 ? '...' : ''}"
              </div>
              <p style={{ fontSize: 12, color: 'var(--anvil-text, #D4D4D8)', lineHeight: 1.45, margin: 0 }}>
                {explanationText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TRANSLATE VIEW                                            */}
      {/* ============================================================ */}
      {view === 'translate' && (
        <div
          style={{
            background: 'var(--anvil-card-bg, #151515)',
            border: '1px solid var(--anvil-border, #2A2A2A)',
            borderRadius: 14,
            padding: 14,
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.1)',
            color: 'var(--anvil-text, #F5F5F5)',
            overflowY: 'auto',
            maxHeight: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '1px solid var(--anvil-border-subtle, #242424)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: accentColor,
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Languages style={{ width: 12, height: 12 }} />
                Translate
              </span>
            </div>


            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Language Selector */}
              <select
                value={selectedLang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLang(newLang);
                  fetchTranslation(newLang);
                }}
                style={{
                  background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
                  color: 'var(--anvil-text, #F5F5F5)',
                  border: '1px solid var(--anvil-border, #2A2A2A)',
                  borderRadius: 6,
                  fontSize: 11,
                  padding: '2px 6px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {POPULAR_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--anvil-text-subtle, #737373)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          </div>

          {/* Original preview */}
          <div style={{ fontSize: 11, color: 'var(--anvil-text-muted, #A7A7A7)', marginBottom: 6, fontStyle: 'italic' }}>
            "{targetText.length > 70 ? `${targetText.substring(0, 68)}...` : targetText}"
          </div>

          {/* Loading */}
          {isLoadingTranslate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--anvil-text-muted, #A7A7A7)', fontSize: 12 }}>
              <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: accentColor }} />
              <span>Translating...</span>
            </div>
          )}

          {/* Error */}
          {translateError && (
            <div style={{ fontSize: 11.5, color: '#FF7D7D', lineHeight: 1.4, padding: '4px 0' }}>
              {translateError}
            </div>
          )}

          {/* Result */}
          {translationResult && !isLoadingTranslate && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: accentColor,
                lineHeight: 1.4,
                paddingTop: 4,
              }}
            >
              {translationResult.translated}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. FLASHCARD CONFIRMATION MODAL                             */}
      {/* ============================================================ */}
      {view === 'flashcard_confirm' && (
        <div
          style={{
            background: 'var(--anvil-card-bg, #151515)',
            border: '1px solid var(--anvil-border, #2A2A2A)',
            borderRadius: 14,
            padding: 14,
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.1)',
            color: 'var(--anvil-text, #F5F5F5)',
            overflowY: 'auto',
            maxHeight: 'inherit',
          }}
        >
          {/* Header Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: '1px solid var(--anvil-border-subtle, #242424)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: accentColor,
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Layers style={{ width: 12, height: 12 }} />
                Flashcard
              </span>
            </div>


            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--anvil-text-subtle, #737373)',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>

          {/* Prompt Question */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--anvil-text, #F5F5F5)',
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            Create flashcard from this text?
          </div>

          {/* Exact Target Text Preview */}
          <div
            style={{
              maxHeight: 90,
              overflowY: 'auto',
              background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
              border: '1px solid var(--anvil-border-subtle, #242424)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 11.5,
              lineHeight: 1.45,
              color: 'var(--anvil-text, #D4D4D8)',
              marginBottom: 12,
              fontStyle: 'italic',
            }}
          >
            "{targetText}"
          </div>

          {flashcardError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#FF7D7D', marginBottom: 10 }}>
              <AlertCircle style={{ width: 13, height: 13 }} />
              <span>{flashcardError}</span>
            </div>
          )}

          {/* Confirmation Actions: Cancel and Create Flashcard */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreatingFlashcard || flashcardSuccess}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
                color: 'var(--anvil-text-muted, #A7A7A7)',
                border: '1px solid var(--anvil-border, #2A2A2A)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmCreateFlashcard}
              disabled={isCreatingFlashcard || flashcardSuccess}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: flashcardSuccess ? '#35D6A2' : accentColor,
                color: '#FFFFFF',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 150ms ease',
              }}
            >
              {flashcardSuccess ? (
                <>
                  <Check style={{ width: 13, height: 13 }} />
                  <span>Flashcard Created!</span>
                </>
              ) : isCreatingFlashcard ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Layers style={{ width: 13, height: 13 }} />
                  <span>Create Flashcard</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
