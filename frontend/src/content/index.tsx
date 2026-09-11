import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { SelectionToolbar } from './SelectionToolbar';
import { HoverMeaningPopover } from './HoverMeaningPopover';
import { ReadingHoverOverlay } from './ReadingHoverOverlay';
import { ReadingCollapsedRail, CollapsedFeatureId } from './ReadingCollapsedRail';
import { InterviewCollapsedRail, InterviewFeatureId } from './InterviewCollapsedRail';
import { ExamCollapsedRail, ExamFeatureId } from './ExamCollapsedRail';
import { FloatingSummaryCard } from './FloatingSummaryCard';
import { FloatingAudioPlayer } from './FloatingAudioPlayer';
import { FloatingFlashcardCreator } from './FloatingFlashcardCreator';
import { FloatingInterviewCard } from './FloatingInterviewCard';
import { FloatingExamCard } from './FloatingExamCard';
import { ModeSwitchToast, ActiveMode } from './ModeSwitchToast';
import { AnvilAction, SelectionPayload } from '@/messaging/types';
import { sendRuntimeMessage, onRuntimeMessage } from '@/messaging/helpers';
import { annotationsService, aiService, notesService } from '@/services';
import { Annotation, DictionaryEntry, TranslationResult } from '@/types';
import { getAccentStyles, getAccentGlow, getAccentSurface } from '@/utils/color';
import contentStyles from './content.css?inline';

const SHADOW_HOST_ID = 'anvil-learning-shadow-root';

function ContentApp() {
  const [activeMode, setActiveMode] = useState<ActiveMode | null>('reading');
  const [activeReadingFeature, setActiveReadingFeature] = useState<CollapsedFeatureId | null>(null);
  const [activeInterviewFeature, setActiveInterviewFeature] = useState<InterviewFeatureId | null>(null);
  const [activeExamFeature, setActiveExamFeature] = useState<ExamFeatureId | null>(null);

  // Theme & accent color state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<string>('#FF6845');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  // Mode Switch Toast state
  const [toastState, setToastState] = useState<{
    mode: ActiveMode;
    nextMode: ActiveMode;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [selection, setSelection] = useState<SelectionPayload | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [dictionaryEntry, setDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isReadingHoverActive, setIsReadingHoverActive] = useState<boolean>(true);
  const [readingFocus, setReadingFocus] = useState<boolean>(true);

  // Audio / Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Flashcard Modal state
  const [flashcardText, setFlashcardText] = useState<string>('');
  const [showFlashcardModal, setShowFlashcardModal] = useState<boolean>(false);

  // Meaning mode hover lookup debounce
  const meaningTimerRef = useRef<number | null>(null);
  const lastLookupWordRef = useRef<string>('');

  // Single active state for reading webpage interaction layer
  const isReadingLayerActive = activeMode === 'reading' && readingFocus;

  // Keep shadow host in sync with active theme and accent color
  useEffect(() => {
    const host = document.getElementById(SHADOW_HOST_ID);
    if (host) {
      host.classList.remove('dark', 'light');
      host.classList.add(theme);
      const styles = getAccentStyles(accentColor);
      for (const [prop, val] of Object.entries(styles)) {
        host.style.setProperty(prop, val);
      }
      (host.style as any).colorScheme = theme;
    }
  }, [theme, accentColor]);

  // Restore state and listen for extension messages
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([
        'anvil_mode',
        'anvil_reading_mode',
        'anvil_reading_hover',
        'anvil_reading_focus',
        'anvil_theme',
        'anvil_accent_color',
        'anvil_sidepanel_open',
      ], (res) => {
        if (res.anvil_mode) {
          setActiveMode(res.anvil_mode as 'reading' | 'interview' | 'exam');
        } else if (res.anvil_reading_mode !== undefined) {
          setActiveMode(res.anvil_reading_mode ? 'reading' : null);
        } else {
          setActiveMode('reading');
        }
        if (res.anvil_reading_hover !== undefined) {
          setIsReadingHoverActive(Boolean(res.anvil_reading_hover));
        }
        if (res.anvil_reading_focus !== undefined) {
          setReadingFocus(Boolean(res.anvil_reading_focus));
        }
        if (res.anvil_theme) {
          setTheme(res.anvil_theme as 'dark' | 'light');
        }
        if (res.anvil_accent_color) {
          setAccentColor(res.anvil_accent_color);
        }
        if (res.anvil_sidepanel_open !== undefined) {
          setIsSidePanelOpen(Boolean(res.anvil_sidepanel_open));
        }
      });
    }

    const restoreHighlights = async () => {
      try {
        const highlights = await annotationsService.list(window.location.href);
        highlights.forEach((h) => applyVisualHighlight(h.text, h.color));
      } catch (err) {
        console.debug('[Anvil Content] Error restoring highlights:', err);
      }
    };

    restoreHighlights();

    // Storage change listener for instant cross-surface synchronization
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.anvil_mode !== undefined) {
          const newM = changes.anvil_mode.newValue as ActiveMode;
          if (newM) {
            setActiveMode(newM);
            setActiveReadingFeature(null);
            setActiveInterviewFeature(null);
            setActiveExamFeature(null);
            const afterNext = NEXT_MODE_MAP[newM] || 'reading';
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            setToastState({ mode: newM, nextMode: afterNext });
            toastTimerRef.current = window.setTimeout(() => setToastState(null), 2500);
          }
        } else if (changes.anvil_reading_mode !== undefined) {
          if (changes.anvil_reading_mode.newValue === false) {
            setActiveMode(null);
            setActiveReadingFeature(null);
            setActiveInterviewFeature(null);
            setActiveExamFeature(null);
          } else if (changes.anvil_reading_mode.newValue && !changes.anvil_mode) {
            setActiveMode('reading');
          }
        }
        if (changes.anvil_reading_hover !== undefined) {
          setIsReadingHoverActive(Boolean(changes.anvil_reading_hover.newValue));
        }
        if (changes.anvil_reading_focus !== undefined) {
          setReadingFocus(Boolean(changes.anvil_reading_focus.newValue));
        }
        if (changes.anvil_theme?.newValue) {
          setTheme(changes.anvil_theme.newValue as 'dark' | 'light');
        }
        if (changes.anvil_accent_color?.newValue) {
          setAccentColor(changes.anvil_accent_color.newValue);
        }
        if (changes.anvil_sidepanel_open !== undefined) {
          setIsSidePanelOpen(Boolean(changes.anvil_sidepanel_open.newValue));
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    const unsubscribe = onRuntimeMessage((message, sender, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ alive: true });
        return true;
      } else if (message.type === 'SET_THEME') {
        if (message.theme) setTheme(message.theme);
        if (message.accentColor) setAccentColor(message.accentColor);
        sendResponse({ success: true });
        return true;
      } else if (message.type === 'EXTRACT_PAGE_CONTENT') {
        const bodyText = document.body.innerText || '';
        const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
        sendResponse({
          title: document.title || window.location.hostname,
          text: bodyText.substring(0, 5000),
          url: window.location.href,
          wordCount,
        });
      } else if (message.type === 'SET_ACTIVE_MODE') {
        const newM = message.mode as ActiveMode;
        if (newM) {
          setActiveMode(newM);
          setActiveReadingFeature(null);
          setActiveInterviewFeature(null);
          setActiveExamFeature(null);
          const afterNext = NEXT_MODE_MAP[newM] || 'reading';
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          setToastState({ mode: newM, nextMode: afterNext });
          toastTimerRef.current = window.setTimeout(() => setToastState(null), 2500);
        }
        sendResponse({ success: true });
        return true;
      } else if (message.type === 'SET_READING_MODE') {
        if (message.enabled) {
          setActiveMode((prev) => prev || 'reading');
        } else {
          setActiveMode(null);
          setActiveReadingFeature(null);
          setActiveInterviewFeature(null);
          setActiveExamFeature(null);
        }
        sendResponse({ success: true });
        return true;
      } else if (message.type === 'SET_READING_HOVER_MODE') {
        setIsReadingHoverActive(message.enabled);
      } else if (message.type === 'SET_READING_FOCUS') {
        setReadingFocus(Boolean(message.enabled));
        sendResponse({ success: true });
        return true;
      } else if (message.type === 'NAVIGATE_MODE') {
        setActiveMode(message.mode);
        setActiveReadingFeature(null);
        setActiveInterviewFeature(null);
        setActiveExamFeature(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Teardown reading interaction overlays & speech when Reading Focus is OFF or mode is not reading
  useEffect(() => {
    if (!isReadingLayerActive) {
      setSelection(null);
      setHoverPosition(null);
      setDictionaryEntry(null);
      setTranslationResult(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  }, [isReadingLayerActive]);

  // Meaning Mode: Word detection on hover
  useEffect(() => {
    if (!isReadingLayerActive || activeReadingFeature !== 'meaning') {
      return;
    }

    const getWordAtPoint = (x: number, y: number): { word: string; range: Range } | null => {
      let range: Range | null = null;
      let textNode: Node | null = null;
      let offset = 0;

      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
        if (range) {
          textNode = range.startContainer;
          offset = range.startOffset;
        }
      } else if ((document as any).caretPositionFromPoint) {
        const pos = (document as any).caretPositionFromPoint(x, y);
        if (pos) {
          textNode = pos.offsetNode;
          offset = pos.offset;
        }
      }

      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;

      const data = textNode.nodeValue || '';
      if (!data) return null;

      // Expand left & right to find word boundaries
      let start = offset;
      while (start > 0 && /\w/.test(data[start - 1])) {
        start--;
      }

      let end = offset;
      while (end < data.length && /\w/.test(data[end])) {
        end++;
      }

      const word = data.slice(start, end).trim();
      if (word.length < 3 || !/^[a-zA-Z]+$/.test(word)) return null;

      try {
        const wordRange = document.createRange();
        wordRange.setStart(textNode, start);
        wordRange.setEnd(textNode, end);
        return { word, range: wordRange };
      } catch {
        return null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (meaningTimerRef.current) {
        clearTimeout(meaningTimerRef.current);
      }

      meaningTimerRef.current = window.setTimeout(async () => {
        const res = getWordAtPoint(e.clientX, e.clientY);
        if (res && res.word.toLowerCase() !== lastLookupWordRef.current.toLowerCase()) {
          lastLookupWordRef.current = res.word;
          const entry = await aiService.defineWord(res.word);
          if (entry) {
            setDictionaryEntry(entry);
            setTranslationResult(null);
            setHoverPosition({ x: e.clientX, y: e.clientY });
          }
        }
      }, 350);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (meaningTimerRef.current) {
        clearTimeout(meaningTimerRef.current);
      }
    };
  }, [isReadingLayerActive, activeReadingFeature]);

  // Read Aloud Mode: Click on paragraph to read
  useEffect(() => {
    if (!isReadingLayerActive || activeReadingFeature !== 'read') {
      return;
    }

    const handleClickReadable = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#anvil-learning-shadow-root')) return;

      const text = target.textContent?.trim() || '';
      if (text.length >= 15) {
        handleStartSpeech(text);
      }
    };

    document.addEventListener('click', handleClickReadable);
    return () => {
      document.removeEventListener('click', handleClickReadable);
    };
  }, [isReadingLayerActive, activeReadingFeature]);

  // Global Selection Detection — strictly active ONLY when isReadingLayerActive is true
  useEffect(() => {
    if (!isReadingLayerActive) {
      return;
    }

    const handleMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setSelection(null);
          return;
        }

        const text = sel.toString().trim();
        if (text.length < 2) {
          setSelection(null);
          return;
        }

        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          setSelection({
            text,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom,
              right: rect.right,
            },
            url: window.location.href,
            title: document.title || 'Web Article',
          });

          // If in flashcards mode, auto-open flashcard creator with selection
          if (activeMode === 'reading' && activeReadingFeature === 'flashcards') {
            setFlashcardText(text);
            setShowFlashcardModal(true);
          }

          // If in translate mode, auto-translate selection
          if (activeMode === 'reading' && activeReadingFeature === 'translate') {
            handleToolbarAction('translate');
          }

          // If in annotate mode, auto-highlight selection
          if (activeMode === 'reading' && activeReadingFeature === 'annotate') {
            applyVisualHighlight(text, 'yellow');
            annotationsService.create({
              url: window.location.href,
              text,
              color: 'yellow',
            });
          }
        } catch {
          setSelection(null);
        }
      }, 50);
    };

    const handleMouseDown = () => {
      setHoverPosition(null);
      setDictionaryEntry(null);
      setTranslationResult(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isReadingLayerActive, activeReadingFeature]);

  // Visual Highlight Helper
  const applyVisualHighlight = (text: string, color: string = 'yellow') => {
    const colorBgMap: Record<string, string> = {
      yellow: getAccentSurface(accentColor, 0.28),
      green: 'rgba(53, 214, 162, 0.28)',
      blue: 'rgba(155, 124, 255, 0.28)',
    };

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        const range = sel.getRangeAt(0);
        const span = document.createElement('mark');
        span.className = 'anvil-page-highlight';
        span.style.backgroundColor = colorBgMap[color] || colorBgMap.yellow;
        span.style.borderRadius = '3px';
        span.style.padding = '1px 3px';
        span.style.color = 'inherit';
        span.style.borderBottom = `1.5px solid ${accentColor}`;
        range.surroundContents(span);
        sel.removeAllRanges();
      } catch {
        // Fallback for complex cross-element selections
      }
    }
  };

  const handleToolbarAction = async (action: AnvilAction) => {
    if (!selection) return;

    if (action === 'highlight') {
      applyVisualHighlight(selection.text, 'yellow');
      await annotationsService.create({
        url: selection.url,
        text: selection.text,
        color: 'yellow',
      });
      setSelection(null);
      return;
    }

    if (action === 'translate') {
      const res = await aiService.translate(selection.text, 'es');
      setTranslationResult(res);
      setHoverPosition({ x: selection.rect.left + selection.rect.width / 2, y: selection.rect.top });
      setSelection(null);
      return;
    }

    if (action === 'read') {
      handleStartSpeech(selection.text);
      setSelection(null);
      return;
    }

    if (action === 'flashcard') {
      setFlashcardText(selection.text);
      setShowFlashcardModal(true);
      setSelection(null);
      return;
    }

    // For explain or note: relay to Side Panel
    await sendRuntimeMessage({
      type: 'TOOLBAR_ACTION',
      action,
      selection,
    });

    setSelection(null);
  };

  // Speech / TTS Handlers
  const handleStartSpeech = (textToSpeak?: string) => {
    const text = textToSpeak || document.body.innerText.substring(0, 3000);
    if (!text || !text.trim()) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = speechRate;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      currentUtteranceRef.current = u;
      window.speechSynthesis.speak(u);
      setIsSpeaking(true);
    }
  };

  const handleToggleSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.pause();
        setIsSpeaking(false);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsSpeaking(true);
        } else {
          handleStartSpeech();
        }
      }
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setSpeechRate(rate);
    if (isSpeaking && currentUtteranceRef.current) {
      handleStartSpeech(currentUtteranceRef.current.text);
    }
  };

  const handleToggleReadingFeature = (id: CollapsedFeatureId) => {
    if (activeReadingFeature === id) {
      setActiveReadingFeature(null);
      if (id === 'read') handleStopSpeech();
    } else {
      setActiveReadingFeature(id);
      if (id === 'read') handleStartSpeech();
    }
  };

  const handleToggleInterviewFeature = (id: InterviewFeatureId) => {
    setActiveInterviewFeature((prev) => (prev === id ? null : id));
  };

  const handleToggleExamFeature = (id: ExamFeatureId) => {
    setActiveExamFeature((prev) => (prev === id ? null : id));
  };

  const NEXT_MODE_MAP: Record<ActiveMode, ActiveMode> = {
    exam: 'reading',
    reading: 'interview',
    interview: 'exam',
  };

  const MODE_DISPLAY_NAMES: Record<ActiveMode, string> = {
    reading: 'Reading Mode',
    interview: 'Interview Mode',
    exam: 'Exam Mode',
  };

  const handleCycleMode = () => {
    const current: ActiveMode = activeMode || 'reading';
    const next: ActiveMode = NEXT_MODE_MAP[current] || 'reading';
    const afterNext: ActiveMode = NEXT_MODE_MAP[next] || 'interview';

    // 1. Immediately update active mode
    setActiveMode(next);
    setActiveReadingFeature(null);
    setActiveInterviewFeature(null);
    setActiveExamFeature(null);

    // Cancel speech synthesis if active
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // 2. Trigger floating notification toast
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastState({
      mode: next,
      nextMode: afterNext,
    });
    toastTimerRef.current = window.setTimeout(() => {
      setToastState(null);
    }, 2500);

    // 3. Persist to chrome.storage.local for sync with sidepanel, popup and options
    const defaultSubView = next === 'reading' ? 'summary' : next === 'interview' ? 'rounds' : 'pyqs';
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        anvil_mode: next,
        anvil_active_mode: { mode: next, subView: defaultSubView },
        anvil_reading_mode: true,
        anvil_reading_hover: next === 'reading' && readingFocus,
      });
    }

    // 4. Send background message to notify all extension contexts
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'ACTIVATE_MODE',
        mode: next,
      }).catch(() => {});
    }
  };

  const handleToggleDashboard = (targetMode: 'reading' | 'interview' | 'exam') => {
    console.log(`[Anvil] Toggle side panel clicked in content script for mode: ${targetMode}, current isSidePanelOpen: ${isSidePanelOpen}`);
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'TOGGLE_SIDE_PANEL', mode: targetMode }, (res) => {
        console.log('[Anvil] Background response for TOGGLE_SIDE_PANEL:', res);
      });
    }
  };

  const handleExpandDashboard = (targetMode: 'reading' | 'interview' | 'exam') => {
    console.log(`[Anvil] Expand button clicked in content script for mode: ${targetMode}, sending OPEN_SIDE_PANEL`);
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', mode: targetMode }, (res) => {
        console.log('[Anvil] Background response for OPEN_SIDE_PANEL:', res);
      });
    }
  };

  if (!activeMode) {
    return null;
  }

  return (
    <div
      id="anvil-theme-root"
      className={`anvil-theme-wrapper ${theme}`}
      style={{
        ...getAccentStyles(accentColor),
        display: 'contents',
      } as React.CSSProperties}
    >
      {/* ============================================================ */}
      {/* 1. READING MODE                                              */}
      {/* ============================================================ */}
      {activeMode === 'reading' && (
        <>
          {/* Collapsed feature rail */}
          <ReadingCollapsedRail
            activeFeature={activeReadingFeature}
            onToggleFeature={handleToggleReadingFeature}
            onExpandDashboard={() => handleToggleDashboard('reading')}
            isSidePanelOpen={isSidePanelOpen}
            onCycleMode={handleCycleMode}
            nextModeName={MODE_DISPLAY_NAMES[NEXT_MODE_MAP['reading']]}
            accentColor={accentColor}
          />

          {/* Reading focus hover overlay — strictly active only when isReadingLayerActive is true */}
          <ReadingHoverOverlay
            enabled={isReadingLayerActive && (isReadingHoverActive || activeReadingFeature === 'read' || activeReadingFeature === 'meaning')}
          />

          {/* In-page floating feature cards */}
          {activeReadingFeature === 'summary' && (
            <FloatingSummaryCard
              onClose={() => setActiveReadingFeature(null)}
              onReadAloud={(text) => handleStartSpeech(text)}
            />
          )}

          {activeReadingFeature === 'read' && (
            <FloatingAudioPlayer
              isSpeaking={isSpeaking}
              onPlayPause={handleToggleSpeech}
              onStop={handleStopSpeech}
              onSpeedChange={handleSpeedChange}
              currentSpeed={speechRate}
              onClose={() => {
                handleStopSpeech();
                setActiveReadingFeature(null);
              }}
            />
          )}

          {showFlashcardModal && (
            <FloatingFlashcardCreator
              initialText={flashcardText}
              onClose={() => setShowFlashcardModal(false)}
              onSaved={() => setShowFlashcardModal(false)}
            />
          )}

          {isReadingLayerActive && selection && !showFlashcardModal && (
            <SelectionToolbar
              selection={selection}
              onAction={handleToolbarAction}
              onClose={() => setSelection(null)}
            />
          )}

          {isReadingLayerActive && hoverPosition && (dictionaryEntry || translationResult) && (
            <HoverMeaningPopover
              position={hoverPosition}
              entry={dictionaryEntry}
              translation={translationResult}
              onLanguageChange={async (targetLang) => {
                if (translationResult) {
                  const updated = await aiService.translate(translationResult.original, targetLang);
                  setTranslationResult(updated);
                }
              }}
              onClose={() => {
                setHoverPosition(null);
                setDictionaryEntry(null);
                setTranslationResult(null);
              }}
            />
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 2. INTERVIEW MODE                                            */}
      {/* ============================================================ */}
      {activeMode === 'interview' && (
        <>
          <InterviewCollapsedRail
            activeFeature={activeInterviewFeature}
            onToggleFeature={handleToggleInterviewFeature}
            onExpandDashboard={() => handleToggleDashboard('interview')}
            isSidePanelOpen={isSidePanelOpen}
            onCycleMode={handleCycleMode}
            nextModeName={MODE_DISPLAY_NAMES[NEXT_MODE_MAP['interview']]}
            accentColor={accentColor}
          />

          {activeInterviewFeature && (
            <FloatingInterviewCard
              feature={activeInterviewFeature}
              onClose={() => setActiveInterviewFeature(null)}
              onExpandToSidePanel={() => handleExpandDashboard('interview')}
            />
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 3. EXAM MODE                                                 */}
      {/* ============================================================ */}
      {activeMode === 'exam' && (
        <>
          <ExamCollapsedRail
            activeFeature={activeExamFeature}
            onToggleFeature={handleToggleExamFeature}
            onExpandDashboard={() => handleToggleDashboard('exam')}
            isSidePanelOpen={isSidePanelOpen}
            onCycleMode={handleCycleMode}
            nextModeName={MODE_DISPLAY_NAMES[NEXT_MODE_MAP['exam']]}
            accentColor={accentColor}
          />

          {activeExamFeature && (
            <FloatingExamCard
              feature={activeExamFeature}
              onClose={() => setActiveExamFeature(null)}
              onExpandToSidePanel={() => handleExpandDashboard('exam')}
            />
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 4. MODE SWITCH TOAST NOTIFICATION                            */}
      {/* ============================================================ */}
      {toastState && (
        <ModeSwitchToast
          mode={toastState.mode}
          nextMode={toastState.nextMode}
          accentColor={accentColor}
          onClose={() => setToastState(null)}
        />
      )}
    </div>
  );
}

// Mount Shadow DOM container
function initContentScript() {
  const existingHost = document.getElementById(SHADOW_HOST_ID);
  if (existingHost) {
    existingHost.remove();
  }

  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initContentScript, { once: true });
    }
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect();
        initContentScript();
      }
    });
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true });
    }
    return;
  }

  const host = document.createElement('div');
  host.id = SHADOW_HOST_ID;
  host.style.cssText = 'display: block !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 2147483647 !important; pointer-events: none !important; margin: 0 !important; padding: 0 !important; border: none !important; background: transparent !important;';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = contentStyles;
  shadowRoot.appendChild(styleEl);

  const appRoot = document.createElement('div');
  appRoot.id = 'anvil-content-app-root';
  shadowRoot.appendChild(appRoot);

  ReactDOM.createRoot(appRoot).render(<ContentApp />);
  console.log('[Anvil Content] Successfully mounted Reading Mode to document.body');
}

// Execute immediately
initContentScript();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript, { once: true });
}
