import React, { useState } from 'react';
import { Lightbulb, Languages, Volume2, X } from 'lucide-react';
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

interface HoverMeaningPopoverProps {
  position: { x: number; y: number };
  entry?: DictionaryEntry | null;
  translation?: TranslationResult | null;
  onLanguageChange?: (lang: string) => void;
  onClose: () => void;
}

export const HoverMeaningPopover: React.FC<HoverMeaningPopoverProps> = ({
  position,
  entry,
  translation,
  onLanguageChange,
  onClose,
}) => {
  const [selectedLang, setSelectedLang] = useState('es');

  const handleSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
  };

  const popoverTop = Math.max(10, position.y - 130);
  const popoverLeft = Math.max(10, Math.min(window.innerWidth - 310, position.x - 140));

  return (
    <div
      className="anvil-popover"
      style={{
        top: `${popoverTop + window.scrollY}px`,
        left: `${popoverLeft + window.scrollX}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #242424' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {entry ? (
            <>
              <Lightbulb style={{ width: 13, height: 13, color: 'var(--anvil-accent)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--anvil-accent)', letterSpacing: '0.04em' }}>
                Definition
              </span>
            </>
          ) : (
            <>
              <Languages style={{ width: 13, height: 13, color: 'var(--anvil-accent)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--anvil-accent)', letterSpacing: '0.04em' }}>
                Translation
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 2, display: 'flex' }}
        >
          <X style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Dictionary Definition Content */}
      {entry && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F5F5F5' }}>{entry.word}</span>
            {entry.phonetic && (
              <span style={{ fontSize: 11, color: '#A7A7A7', fontStyle: 'italic' }}>{entry.phonetic}</span>
            )}
            <button
              type="button"
              onClick={() => handleSpeech(entry.word)}
              style={{ background: 'none', border: 'none', color: 'var(--anvil-accent)', cursor: 'pointer', padding: 2, display: 'flex' }}
              title="Pronounce"
            >
              <Volume2 style={{ width: 13, height: 13 }} />
            </button>
          </div>

          <div style={{ fontSize: 10, color: 'var(--anvil-accent)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
            {entry.partOfSpeech}
          </div>

          <p style={{ fontSize: 12, color: '#D4D4D8', margin: '0 0 6px 0', lineHeight: 1.4 }}>
            {entry.definition}
          </p>

          {entry.example && (
            <p style={{ fontSize: 11, color: '#A7A7A7', fontStyle: 'italic', margin: 0 }}>
              "{entry.example}"
            </p>
          )}
        </div>
      )}

      {/* Translation Content */}
      {translation && (
        <div>
          <div style={{ fontSize: 11, color: '#A7A7A7', marginBottom: 2 }}>Original:</div>
          <div style={{ fontSize: 12, color: '#F5F5F5', marginBottom: 8, fontStyle: 'italic' }}>
            "{translation.original}"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#A7A7A7' }}>Target Language:</span>
            {onLanguageChange && (
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value);
                  onLanguageChange(e.target.value);
                }}
                style={{
                  background: '#1D1D1D',
                  color: '#F5F5F5',
                  border: '1px solid #2A2A2A',
                  borderRadius: 4,
                  fontSize: 10,
                  padding: '2px 6px',
                  outline: 'none',
                }}
              >
                {POPULAR_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--anvil-accent)', lineHeight: 1.4 }}>
            {translation.translated}
          </div>
        </div>
      )}
    </div>
  );
};
