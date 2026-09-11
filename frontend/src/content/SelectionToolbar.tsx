import React from 'react';
import { Sparkles, Languages, Pencil, FileEdit, Layers, Volume2, X } from 'lucide-react';
import { AnvilAction, SelectionPayload } from '@/messaging/types';

interface SelectionToolbarProps {
  selection: SelectionPayload;
  onAction: (action: AnvilAction) => void;
  onClose: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selection,
  onAction,
  onClose,
}) => {
  const { rect } = selection;

  // Position 8px above selection or below if top is cramped
  const toolbarTop = rect.top > 45 ? rect.top - 42 : rect.bottom + 8;
  const toolbarLeft = Math.max(10, Math.min(window.innerWidth - 390, rect.left + rect.width / 2 - 170));

  return (
    <div
      className="anvil-selection-toolbar"
      style={{
        top: `${toolbarTop + window.scrollY}px`,
        left: `${toolbarLeft + window.scrollX}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onAction('explain')}
        className="anvil-toolbar-btn anvil-toolbar-btn-brand"
        title="Explain concept with AI"
      >
        <Sparkles style={{ width: 13, height: 13 }} />
        <span>Explain</span>
      </button>

      <button
        type="button"
        onClick={() => onAction('translate')}
        className="anvil-toolbar-btn"
        title="Translate selection"
      >
        <Languages style={{ width: 13, height: 13 }} />
        <span>Translate</span>
      </button>

      <div className="anvil-toolbar-divider" />

      <button
        type="button"
        onClick={() => onAction('highlight')}
        className="anvil-toolbar-btn"
        title="Highlight on page"
      >
        <Pencil style={{ width: 13, height: 13 }} />
        <span>Highlight</span>
      </button>

      <button
        type="button"
        onClick={() => onAction('note')}
        className="anvil-toolbar-btn"
        title="Attach study note"
      >
        <FileEdit style={{ width: 13, height: 13 }} />
        <span>Note</span>
      </button>

      <button
        type="button"
        onClick={() => onAction('flashcard')}
        className="anvil-toolbar-btn"
        title="Turn into Flashcard"
      >
        <Layers style={{ width: 13, height: 13 }} />
        <span>Flashcard</span>
      </button>

      <div className="anvil-toolbar-divider" />

      <button
        type="button"
        onClick={() => onAction('read')}
        className="anvil-toolbar-btn"
        title="Read selection aloud (TTS)"
      >
        <Volume2 style={{ width: 13, height: 13 }} />
        <span>Read</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        className="anvil-toolbar-btn"
        style={{ padding: '4px', color: '#737373' }}
        title="Close toolbar"
      >
        <X style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );
};
