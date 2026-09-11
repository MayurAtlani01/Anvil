import { Annotation, DictionaryEntry, TranslationResult } from '@/types';

export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface SelectionPayload {
  text: string;
  rect: SelectionRect;
  url: string;
  title: string;
}

export type AnvilAction = 'explain' | 'translate' | 'highlight' | 'note' | 'flashcard' | 'read';

export type AnvilMessage =
  | {
      type: 'TOOLBAR_ACTION';
      action: AnvilAction;
      selection: SelectionPayload;
    }
  | {
      type: 'OPEN_SIDE_PANEL';
      tabId?: number;
      mode?: 'reading' | 'interview' | 'exam';
    }
  | {
      type: 'TOGGLE_SIDE_PANEL';
      tabId?: number;
      mode?: 'reading' | 'interview' | 'exam';
    }
  | {
      type: 'CLOSE_SIDE_PANEL';
    }
  | {
      type: 'SIDE_PANEL_READY';
    }
  | {
      type: 'SYNC_STATE';
      slice: 'bookmarks' | 'flashcards' | 'notes' | 'progress' | 'annotations';
    }
  | {
      type: 'EXTRACT_PAGE_CONTENT';
      tabId?: number;
    }
  | {
      type: 'PAGE_CONTENT_RESPONSE';
      content: {
        title: string;
        text: string;
        url: string;
        wordCount: number;
      };
    }
  | {
      type: 'HOVER_MEANING_QUERY';
      word: string;
    }
  | {
      type: 'HOVER_MEANING_RESPONSE';
      result: DictionaryEntry | null;
    }
  | {
      type: 'HOVER_TRANSLATE_QUERY';
      text: string;
      targetLang: string;
    }
  | {
      type: 'HOVER_TRANSLATE_RESPONSE';
      result: TranslationResult;
    }
  | {
      type: 'APPLY_HIGHLIGHTS';
      url: string;
      highlights: Annotation[];
    }
  | {
      type: 'NAVIGATE_MODE';
      mode: 'reading' | 'interview' | 'exam';
      subView?: string;
    }
  | {
      type: 'SPEAK_TEXT';
      text: string;
    }
  | {
      type: 'STOP_SPEECH';
    }
  | {
      type: 'SCREEN_CAPTURE';
      tabId?: number;
    }
  | {
      type: 'SCREEN_CAPTURE_READY';
      dataUrl: string;
    }
  | {
      type: 'SET_READING_HOVER_MODE';
      enabled: boolean;
    }
  | {
      type: 'SET_READING_MODE';
      enabled: boolean;
    }
  | {
      type: 'ACTIVATE_READING_MODE';
      tabId: number;
    }
  | {
      type: 'ACTIVATE_MODE';
      mode: 'reading' | 'interview' | 'exam';
      tabId: number;
    }
  | {
      type: 'SET_ACTIVE_MODE';
      mode: 'reading' | 'interview' | 'exam';
    }
  | {
      type: 'SET_READING_FOCUS';
      enabled: boolean;
    }
  | {
      type: 'SET_THEME';
      theme?: 'dark' | 'light';
      accentColor?: string;
    }
  | {
      type: 'PING';
    };


