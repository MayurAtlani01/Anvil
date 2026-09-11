import { create } from 'zustand';
import { aiService, progressService } from '@/services';

interface AISummaryData {
  summary: string;
  bulletPoints: string[];
  keyEntities: string[];
  readTimeMin: number;
}

interface ReadingState {
  pageText: string;
  pageTitle: string;
  pageUrl: string;
  summary: AISummaryData | null;
  isSummarizing: boolean;
  summaryError: string | null;
  isSpeaking: boolean;
  speechRate: number; // 0.8 to 1.5
  speechPitch: number;
  currentSpeakingText: string;
  activeSelectionText: string;
  aiExplanation: {
    text: string;
    explanation: string;
    simplified: string;
    practicalExample: string;
    relatedConcepts: string[];
  } | null;
  isExplaining: boolean;
  explanationError: string | null;
  setPageContext: (title: string, url: string, text: string) => void;
  generateSummary: () => Promise<void>;
  explainSelection: (text: string) => Promise<void>;
  clearExplanation: () => void;
  startTTS: (text?: string) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  stopTTS: () => void;
  setSpeechRate: (rate: number) => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  pageText: '',
  pageTitle: '',
  pageUrl: '',
  summary: null,
  isSummarizing: false,
  summaryError: null,
  isSpeaking: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  currentSpeakingText: '',
  activeSelectionText: '',
  aiExplanation: null,
  isExplaining: false,
  explanationError: null,

  setPageContext: (title, url, text) => {
    set({ pageTitle: title, pageUrl: url, pageText: text || get().pageText });
  },

  generateSummary: async () => {
    const { pageText, pageTitle } = get();
    if (!pageText.trim()) {
      set({ summaryError: 'No page content extracted to summarize.' });
      return;
    }

    set({ isSummarizing: true, summaryError: null });
    try {
      const summary = await aiService.summarize(pageText, pageTitle);
      await progressService.recordActivity({
        mode: 'reading',
        activityType: 'read_article',
        durationSec: summary.readTimeMin * 60,
        metadata: { title: pageTitle },
      });
      set({ summary, isSummarizing: false });
    } catch (err: any) {
      set({
        summaryError: err.message || 'AI backend endpoint not configured.',
        isSummarizing: false,
      });
    }
  },

  explainSelection: async (text) => {
    if (!text.trim()) return;
    set({ isExplaining: true, activeSelectionText: text, explanationError: null });
    try {
      const result = await aiService.explain(text);
      set({
        aiExplanation: {
          text,
          ...result,
        },
        isExplaining: false,
      });
    } catch (err: any) {
      set({
        explanationError: err.message || 'AI backend not configured.',
        isExplaining: false,
      });
    }
  },

  clearExplanation: () => {
    set({ aiExplanation: null, activeSelectionText: '', explanationError: null });
  },

  startTTS: (textToSpeak) => {
    const { pageText, speechRate, speechPitch } = get();
    const text = textToSpeak || pageText;

    if (!text || !text.trim()) {
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel existing

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      utterance.onend = () => {
        set({ isSpeaking: false, currentSpeakingText: '' });
      };

      utterance.onerror = () => {
        set({ isSpeaking: false, currentSpeakingText: '' });
      };

      window.speechSynthesis.speak(utterance);
      set({ isSpeaking: true, currentSpeakingText: text });
    }
  },

  pauseTTS: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      set({ isSpeaking: false });
    }
  },

  resumeTTS: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      set({ isSpeaking: true });
    }
  },

  stopTTS: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      set({ isSpeaking: false, currentSpeakingText: '' });
    }
  },

  setSpeechRate: (speechRate) => {
    set({ speechRate });
    const { isSpeaking, currentSpeakingText } = get();
    if (isSpeaking && currentSpeakingText) {
      get().startTTS(currentSpeakingText);
    }
  },
}));
