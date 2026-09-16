import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ReadingContextualPopup, PopupSubView } from './ReadingContextualPopup';
import { ReadingCollapsedRail, CollapsedFeatureId } from './ReadingCollapsedRail';
import { InterviewCollapsedRail, InterviewFeatureId } from './InterviewCollapsedRail';
import { ExamCollapsedRail, ExamFeatureId } from './ExamCollapsedRail';
import { FloatingAudioPlayer } from './FloatingAudioPlayer';
import { FloatingFlashcardCreator } from './FloatingFlashcardCreator';
import { FloatingInterviewCard } from './FloatingInterviewCard';
import { FloatingExamCard } from './FloatingExamCard';
import { ModeSwitchToast, ActiveMode } from './ModeSwitchToast';
import { onRuntimeMessage } from '@/messaging/helpers';
import { annotationsService } from '@/services';
import { getAccentStyles, getAccentSurface } from '@/utils/color';
import contentStyles from './content.css?inline';

const SHADOW_HOST_ID = 'anvil-learning-shadow-root';

export interface ReadingTarget {
  text: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  };
  range?: Range;
  isSelection: boolean;
}

function highlightTextFallback(text: string, bgColor: string, borderColor: string): boolean {
  if (!text || text.length < 2) return false;
  const target = text.trim();
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.includes(target)) {
          return NodeFilter.FILTER_SKIP;
        }
        const parent = node.parentElement;
        if (!parent || parent.closest('#anvil-learning-shadow-root') || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const node = walker.nextNode();
  if (node && node.nodeValue) {
    const idx = node.nodeValue.indexOf(target);
    if (idx !== -1) {
      try {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + target.length);
        const span = document.createElement('mark');
        span.className = 'anvil-page-highlight';
        span.style.backgroundColor = bgColor;
        span.style.borderRadius = '3px';
        span.style.padding = '1px 3px';
        span.style.color = 'inherit';
        span.style.borderBottom = `1.5px solid ${borderColor}`;
        range.surroundContents(span);
        return true;
      } catch {
        return false;
      }
    }
  }
  return false;
}

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

  const [readingFocus, setReadingFocus] = useState<boolean>(true);

  // Audio / Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Flashcard Modal state
  const [flashcardText, setFlashcardText] = useState<string>('');
  const [showFlashcardModal, setShowFlashcardModal] = useState<boolean>(false);

  // Single active state for reading webpage interaction layer
  const isReadingLayerActive = activeMode === 'reading' && readingFocus;

  // Reading Focus Hover & Selection Contextual Popup state
  const [readingTarget, setReadingTarget] = useState<ReadingTarget | null>(null);
  const [popupSubView, setPopupSubView] = useState<PopupSubView>('meaning');
  const popupSubViewRef = useRef<PopupSubView>('meaning');
  const currentTargetTextRef = useRef<string>('');

  useEffect(() => {
    popupSubViewRef.current = popupSubView;
  }, [popupSubView]);

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
        'anvil_active_reading_feature',
      ], (res) => {
        if (res.anvil_mode) {
          setActiveMode(res.anvil_mode as 'reading' | 'interview' | 'exam');
        } else if (res.anvil_reading_mode !== undefined) {
          setActiveMode(res.anvil_reading_mode ? 'reading' : null);
        } else {
          setActiveMode('reading');
        }
        if (res.anvil_active_reading_feature !== undefined) {
          setActiveReadingFeature(res.anvil_active_reading_feature || null);
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
        if (changes.anvil_active_reading_feature !== undefined) {
          setActiveReadingFeature((changes.anvil_active_reading_feature.newValue as CollapsedFeatureId) || null);
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
        sendResponse({ success: true });
        return true;
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
      setReadingTarget(null);
      currentTargetTextRef.current = '';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  }, [isReadingLayerActive]);



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

  // Reading Focus: Text Selection Action Trigger
  // Strictly triggers ONLY on mouseup after user deliberately selects a word or text
  // ZERO hover popups. ZERO interruption while user is dragging or selecting text.
  useEffect(() => {
    if (!isReadingLayerActive || !activeReadingFeature) {
      setReadingTarget(null);
      currentTargetTextRef.current = '';
      return;
    }

    const isSelectingRef = { current: false };
    let selectionTimeout: number | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(`#${SHADOW_HOST_ID}`)) {
        return;
      }
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }
      isSelectingRef.current = true;
      // Starting a new selection or clicking outside immediately dismisses existing popups
      setReadingTarget(null);
      currentTargetTextRef.current = '';
    };

    const handleMouseUp = (e: MouseEvent) => {
      isSelectingRef.current = false;
      const target = e.target as HTMLElement | null;
      if (target && target.closest(`#${SHADOW_HOST_ID}`)) {
        return;
      }

      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      // 100ms debounce ensures selection is completed and prevents interfering with clicks
      selectionTimeout = window.setTimeout(() => {
        if (isSelectingRef.current) return;

        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          return;
        }

        const text = sel.toString().trim();
        // Must contain alphanumeric characters (not just spaces or symbols)
        if (!text || !/\w/.test(text)) {
          return;
        }

        try {
          const range = sel.getRangeAt(0);
          const r = range.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;

          if (activeReadingFeature === 'annotate') {
            handleAnnotateTarget(text, range);
          } else if (
            activeReadingFeature === 'meaning' ||
            activeReadingFeature === 'flashcards' ||
            activeReadingFeature === 'translate'
          ) {
            currentTargetTextRef.current = text;
            setReadingTarget({
              text,
              rect: {
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
                bottom: r.bottom,
                right: r.right,
              },
              range: range.cloneRange(),
              isSelection: true,
            });
          }
        } catch {
          // ignore
        }
      }, 100);
    };

    let scrollRaf: number | null = null;
    const handleScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        setReadingTarget((prev) => {
          if (!prev) return null;
          if (prev.range) {
            const r = prev.range.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) {
              return null;
            }
            return {
              ...prev,
              rect: {
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
                bottom: r.bottom,
                right: r.right,
              },
            };
          }
          return prev;
        });
      });
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      if (scrollRaf) {
        cancelAnimationFrame(scrollRaf);
      }
    };
  }, [isReadingLayerActive, activeReadingFeature]);


  // Visual Highlight Helper
  const applyVisualHighlight = (text: string, color: string = 'yellow', customRange?: Range) => {
    const colorBgMap: Record<string, string> = {
      yellow: getAccentSurface(accentColor, 0.28),
      green: 'rgba(53, 214, 162, 0.28)',
      blue: 'rgba(155, 124, 255, 0.28)',
    };

    const bgColor = colorBgMap[color] || colorBgMap.yellow;

    let rangeToHighlight: Range | null = null;
    if (customRange) {
      rangeToHighlight = customRange;
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        rangeToHighlight = sel.getRangeAt(0);
      }
    }

    if (rangeToHighlight) {
      try {
        const span = document.createElement('mark');
        span.className = 'anvil-page-highlight';
        span.style.backgroundColor = bgColor;
        span.style.borderRadius = '3px';
        span.style.padding = '1px 3px';
        span.style.color = 'inherit';
        span.style.borderBottom = `1.5px solid ${accentColor}`;
        rangeToHighlight.surroundContents(span);
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
        return true;
      } catch {
        return highlightTextFallback(text, bgColor, accentColor);
      }
    }

    return highlightTextFallback(text, bgColor, accentColor);
  };

  const handleAnnotateTarget = async (customText?: string, customRange?: Range) => {
    const text = customText || readingTarget?.text;
    if (!text) return;
    const range = customRange || readingTarget?.range;
    applyVisualHighlight(text, 'yellow', range);
    await annotationsService.create({
      url: window.location.href,
      text,
      color: 'yellow',
    });
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
    // Clear any active targets or popups
    setReadingTarget(null);
    currentTargetTextRef.current = '';

    const nextFeature = activeReadingFeature === id ? null : id;
    setActiveReadingFeature(nextFeature);

    if (id === 'read') {
      if (nextFeature === 'read') handleStartSpeech();
      else handleStopSpeech();
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ anvil_active_reading_feature: nextFeature });
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

          {/* Read Aloud Audio Bar with Stop/Pause controls */}
          {(activeReadingFeature === 'read' || isSpeaking) && (
            <FloatingAudioPlayer
              isSpeaking={isSpeaking}
              onPlayPause={handleToggleSpeech}
              onStop={handleStopSpeech}
              onSpeedChange={handleSpeedChange}
              currentSpeed={speechRate}
              onClose={() => {
                handleStopSpeech();
                if (activeReadingFeature === 'read') {
                  setActiveReadingFeature(null);
                }
              }}
            />
          )}

          {/* Reading Focus Contextual Popup: strictly gated to active reading features (meaning, flashcards, translate) */}
          {isReadingLayerActive &&
            activeReadingFeature &&
            activeReadingFeature !== 'annotate' &&
            activeReadingFeature !== 'read' &&
            readingTarget &&
            !showFlashcardModal && (
              <ReadingContextualPopup
                targetText={readingTarget.text}
                targetRect={readingTarget.rect}
                initialView={
                  activeReadingFeature === 'flashcards'
                    ? 'flashcard_confirm'
                    : activeReadingFeature === 'translate'
                    ? 'translate'
                    : 'meaning'
                }
                onAnnotate={() => handleAnnotateTarget()}
                onClose={() => {
                  setReadingTarget(null);
                  currentTargetTextRef.current = '';
                }}
                accentColor={accentColor}
                onViewChange={(v) => {
                  setPopupSubView(v);
                  popupSubViewRef.current = v;
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
