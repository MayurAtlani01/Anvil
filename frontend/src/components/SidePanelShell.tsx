import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Pin,
  Minus,
  X,
  BookOpen,
  GraduationCap,
  Briefcase,
  Search,
  Zap,
  ArrowRight,
  FileText,
  Calculator,
  FileCheck,
  PlusCircle,
  Plus,
  BarChart2,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  ExternalLink,
  BookMarked,
  Bookmark as BookmarkIcon,
  User,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Copy,
  Lightbulb,
  Award,
  Send,
  Upload,
  Flame,
  Code2,
  RefreshCw,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useModeStore } from '@/store/useModeStore';
import { useToastStore } from '@/store/useToastStore';
import { useThemeStore, PRESET_ACCENT_COLORS, ThemeMode } from '@/store/useThemeStore';
import { Modal } from './Modal';
import { Progress } from './Progress';
import { storage } from '@/services/storage/storage';
import { APIConfig } from '@/services/api/aiService';
import { notesService, examService, interviewService, bookmarksService, flashcardsService } from '@/services';
import { Note, Question, Formula, RevisionNote, Bookmark, Flashcard, InterviewSession, ResumeAnalysis, Mode, DifficultyLevel } from '@/types';

function getContrastTextColor(hex: string): string {
  try {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? '#0D0F10' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

export const SidePanelShell: React.FC = () => {
  const { mode, setMode } = useModeStore();
  const { addToast } = useToastStore();
  const { theme, accentColor, setTheme, setAccentColor, hydrate: hydrateTheme } = useThemeStore();

  const isDark = theme === 'dark';
  const contrastText = getContrastTextColor(accentColor);

  // Mode switcher popover state
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);
  const modeSwitcherRef = useRef<HTMLDivElement>(null);

  // Reading Focus toggle state (controls webpage interaction layer)
  const [readingFocus, setReadingFocus] = useState<boolean>(true);

  // Close Mode Switcher on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeSwitcherRef.current && !modeSwitcherRef.current.contains(e.target as Node)) {
        setShowModeSwitcher(false);
      }
    };
    if (showModeSwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeSwitcher]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Window utility states
  const [isPinned, setIsPinned] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Profile state
  const [userName, setUserName] = useState('Anvil Scholar');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempUserName, setTempUserName] = useState('');

  // Modals state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);

  // Mode-Specific Repositories Data
  const [examData, setExamData] = useState<{
    pyqs: Question[];
    formulas: Formula[];
    revisionNotes: RevisionNote[];
  }>({ pyqs: [], formulas: [], revisionNotes: [] });

  const [readingData, setReadingData] = useState<{
    notes: Note[];
    bookmarks: Bookmark[];
    flashcards: Flashcard[];
  }>({ notes: [], bookmarks: [], flashcards: [] });

  const [interviewData, setInterviewData] = useState<{
    sessions: InterviewSession[];
    questions: Question[];
    resume: ResumeAnalysis | null;
  }>({ sessions: [], questions: [], resume: null });

  // Interactive Interview Mode State
  const [interviewSubTab, setInterviewSubTab] = useState<'questions' | 'mock' | 'resume' | 'history'>('questions');
  const [selectedInterviewCategory, setSelectedInterviewCategory] = useState<'all' | 'dsa' | 'system_design' | 'technical' | 'hr'>('all');
  const [selectedInterviewDifficulty, setSelectedInterviewDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [revealedHintId, setRevealedHintId] = useState<string | null>(null);
  const [revealedSolutionId, setRevealedSolutionId] = useState<string | null>(null);

  // Live Mock Interview Session Runner
  const [activeMockSession, setActiveMockSession] = useState<InterviewSession | null>(null);
  const [mockAnswerInput, setMockAnswerInput] = useState('');
  const [isEvaluatingMock, setIsEvaluatingMock] = useState(false);
  const [selectedMockTrackId, setSelectedMockTrackId] = useState('round-dsa');

  // Interactive Exam Mode State
  const [examSubTab, setExamSubTab] = useState<'all' | 'pyqs' | 'formulas' | 'revision'>('all');
  const [selectedExamSubject, setSelectedExamSubject] = useState<string>('all');
  const [expandedPyqId, setExpandedPyqId] = useState<string | null>(null);
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // Interactive Reading Mode State
  const [readingSubTab, setReadingSubTab] = useState<'all' | 'notes' | 'bookmarks' | 'flashcards'>('all');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Resource creation state
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('General');
  const [newNoteTopic, setNewNoteTopic] = useState('');
  const [newNoteSummary, setNewNoteSummary] = useState('');
  const [newNotePoints, setNewNotePoints] = useState('');
  const [remoteFeedUrl, setRemoteFeedUrl] = useState('');
  const [activeNotesTab, setActiveNotesTab] = useState<'create' | 'feed'>('create');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Settings state
  const [apiConfig, setApiConfig] = useState<APIConfig>({ backendUrl: '', apiKey: '' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Mode-Specific Data Loader
  const loadModeData = async (targetMode: Mode = mode) => {
    try {
      if (targetMode === 'exam') {
        const [pyqs, formulas, revisionNotes] = await Promise.all([
          examService.getPYQs(),
          examService.getFormulas(),
          examService.getRevisionNotes(),
        ]);
        setExamData({ pyqs, formulas, revisionNotes });
      } else if (targetMode === 'reading') {
        const [notes, bookmarks, flashcards] = await Promise.all([
          notesService.list(),
          bookmarksService.list(),
          flashcardsService.list({ sourceMode: 'reading' }),
        ]);
        setReadingData({ notes, bookmarks, flashcards });
      } else if (targetMode === 'interview') {
        const [sessions, questions, resume] = await Promise.all([
          interviewService.getSessionHistory(),
          interviewService.getQuestionsForRound(),
          interviewService.getLastResumeAnalysis(),
        ]);
        setInterviewData({ sessions, questions, resume });
      }
    } catch (err) {
      console.error(`[SidePanelShell] Error loading ${targetMode} data:`, err);
    }
  };

  // Load initial settings, theme, profile, active mode data, and reading focus state
  useEffect(() => {
    hydrateTheme();

    // Establish liveness port connection to background
    let port: chrome.runtime.Port | null = null;
    if (typeof chrome !== 'undefined' && chrome.runtime?.connect) {
      try {
        port = chrome.runtime.connect({ name: 'anvil_sidepanel_port' });
      } catch (err) {
        console.debug('[SidePanelShell] port connect error:', err);
      }
    }

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ anvil_sidepanel_open: true });
    }

    // Listen for CLOSE_SIDE_PANEL message to cleanly close window
    const handleRuntimeMessage = (message: any) => {
      if (message?.type === 'CLOSE_SIDE_PANEL') {
        window.close();
      }
    };
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    }

    const handleUnload = () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ anvil_sidepanel_open: false });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    storage.get<APIConfig>('anvil_api_config', {}).then((cfg) => {
      if (cfg) setApiConfig(cfg);
    });

    storage.get<string>('anvil_user_name', 'Anvil Scholar').then((name) => {
      if (name) setUserName(name);
    });

    storage.get<boolean>('anvil_reading_focus', true).then((focus) => {
      if (focus !== undefined) setReadingFocus(focus);
    });

    loadModeData(mode);

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      }
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
      if (port) {
        try { port.disconnect(); } catch {}
      }
    };
  }, []);

  // Reactivity: Reload data immediately on mode change
  useEffect(() => {
    loadModeData(mode);
  }, [mode]);

  // Real-time Chrome storage sync across components/background/content scripts
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const changedKeys = Object.keys(changes);
      if (changes.anvil_mode?.newValue && changes.anvil_mode.newValue !== mode) {
        setMode(changes.anvil_mode.newValue as Mode);
      }
      if (changes.anvil_theme?.newValue && changes.anvil_theme.newValue !== theme) {
        setTheme(changes.anvil_theme.newValue as ThemeMode, false);
      }
      if (changes.anvil_accent_color?.newValue && changes.anvil_accent_color.newValue !== accentColor) {
        setAccentColor(changes.anvil_accent_color.newValue, false);
      }
      if (
        changedKeys.some((k) =>
          k.startsWith('anvil_exam_') ||
          k.startsWith('anvil_notes_') ||
          k.startsWith('anvil_bookmarks_') ||
          k.startsWith('anvil_flashcards_') ||
          k.startsWith('anvil_interview_') ||
          k.startsWith('anvil_resume_') ||
          k === 'anvil_mode'
        )
      ) {
        loadModeData((changes.anvil_mode?.newValue as Mode) || mode);
      }
      if (changes.anvil_reading_focus !== undefined) {
        setReadingFocus(Boolean(changes.anvil_reading_focus.newValue));
      }
    };
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, [mode, theme, accentColor, setMode, setTheme, setAccentColor]);

  // Compute total stored items for active mode
  const totalModeItemsCount = useMemo(() => {
    if (mode === 'exam') {
      return examData.pyqs.length + examData.formulas.length + examData.revisionNotes.length;
    }
    if (mode === 'reading') {
      return readingData.notes.length + readingData.bookmarks.length + readingData.flashcards.length;
    }
    if (mode === 'interview') {
      return interviewData.sessions.length + interviewData.questions.length + (interviewData.resume ? 1 : 0);
    }
    return 0;
  }, [mode, examData, readingData, interviewData]);

  // Keyboard shortcut: Ctrl + K focuses search field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mode change handler
  const handleSelectMode = (newMode: Mode) => {
    setMode(newMode);
    storage.set('anvil_mode', newMode);
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'ACTIVATE_MODE', mode: newMode }).catch(() => {});
    }
    addToast({
      type: 'info',
      message: `Switched to ${newMode.charAt(0).toUpperCase() + newMode.slice(1)} Mode`,
    });
  };

  // Toggle Reading Focus state
  const handleToggleReadingFocus = async (newFocus: boolean) => {
    setReadingFocus(newFocus);
    await storage.set('anvil_reading_focus', newFocus);
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: 'SET_READING_FOCUS',
            enabled: newFocus,
          }).catch(() => {});
        }
      });
    }
    addToast({
      type: 'info',
      message: newFocus ? 'Reading Focus Enabled' : 'Reading Focus Paused',
    });
  };

  // Mock interview actions
  const handleStartMockRound = async (roundId: string) => {
    try {
      const session = await interviewService.startSession(
        roundId,
        selectedInterviewDifficulty === 'all' ? undefined : selectedInterviewDifficulty
      );
      setActiveMockSession(session);
      setInterviewSubTab('mock');
      setMockAnswerInput('');
      addToast({
        type: 'info',
        message: `Started ${session.roundTitle} mock round! Type your response below.`,
      });
    } catch (err: any) {
      addToast({
        type: 'warning',
        message: err.message || 'Failed to start interview session.',
      });
    }
  };

  const handleSubmitMockAnswer = async () => {
    if (!activeMockSession || !mockAnswerInput.trim()) return;
    setIsEvaluatingMock(true);
    try {
      const currentQ = activeMockSession.questions[activeMockSession.currentQuestionIndex];
      const updated = await interviewService.submitAnswer(
        activeMockSession.id,
        currentQ.id,
        mockAnswerInput.trim()
      );
      setActiveMockSession(updated);
      setMockAnswerInput('');
      setIsEvaluatingMock(false);
      loadModeData('interview');
      addToast({
        type: 'success',
        message: 'Answer evaluated with instant scoring!',
      });
    } catch {
      setIsEvaluatingMock(false);
      addToast({
        type: 'error',
        message: 'Failed to record answer.',
      });
    }
  };

  const handleFinishMockSession = async () => {
    if (!activeMockSession) return;
    try {
      const completed = await interviewService.finishSession(activeMockSession.id);
      setActiveMockSession(null);
      setInterviewSubTab('history');
      loadModeData('interview');
      addToast({
        type: 'success',
        message: `Round Completed! Readiness Score: ${completed.overallFeedback?.totalScore}%`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Error finalizing interview session.',
      });
    }
  };

  // Formula utilities
  const handleCopyFormula = (formula: Formula) => {
    navigator.clipboard.writeText(formula.formula);
    setCopiedFormulaId(formula.id);
    setTimeout(() => setCopiedFormulaId(null), 2000);
    addToast({
      type: 'success',
      message: `Copied ${formula.name} formula to clipboard!`,
    });
  };

  const handleCreateFlashcardFromFormula = async (formula: Formula) => {
    try {
      await flashcardsService.create({
        front: `What is the formula and meaning of ${formula.name}?`,
        back: `${formula.formula}\n\n${formula.explanation}`,
        sourceMode: 'reading',
        difficulty: formula.difficulty || 'medium',
        deckId: formula.subject,
      });
      loadModeData('reading');
      addToast({
        type: 'success',
        message: `Added "${formula.name}" to Flashcard Deck!`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to create flashcard.',
      });
    }
  };

  // Profile Save
  const handleSaveProfile = async () => {
    if (!tempUserName.trim()) return;
    setUserName(tempUserName.trim());
    await storage.set('anvil_user_name', tempUserName.trim());
    setShowProfileModal(false);
    addToast({
      type: 'success',
      message: 'Profile name updated.',
    });
  };

  // Settings Save
  const handleSaveSettings = async () => {
    setIsSavingConfig(true);
    await Promise.all([
      storage.set('anvil_api_config', apiConfig),
      storage.set('anvil_theme', theme),
      storage.set('anvil_accent_color', accentColor),
    ]);
    setIsSavingConfig(false);
    setShowSettingsModal(false);
    addToast({
      type: 'success',
      message: 'Extension settings and appearance saved.',
    });
  };

  // Create Note Source / Question
  const handleCreateNoteSource = async () => {
    if (!newNoteTitle.trim()) return;
    setIsSavingNote(true);
    try {
      if (mode === 'reading') {
        await notesService.create({
          url: 'https://anvil.study/manual-entry',
          pageTitle: newNoteTitle.trim(),
          content: newNoteSummary.trim() || newNoteTitle.trim(),
          tags: [newNoteSubject, newNoteTopic].filter(Boolean),
        });
      } else if (mode === 'exam') {
        await examService.addRevisionNote({
          id: `rev-${Date.now()}`,
          title: newNoteTitle.trim(),
          subject: newNoteSubject.trim() || 'General',
          topic: newNoteTopic.trim() || 'Core',
          summary: newNoteSummary.trim(),
          keyPoints: newNotePoints.split('\n').filter((p) => p.trim().length > 0),
        });
      } else if (mode === 'interview') {
        await interviewService.addQuestion({
          id: `q-user-${Date.now()}`,
          title: newNoteTitle.trim(),
          prompt: newNoteSummary.trim() || newNoteTitle.trim(),
          mode: 'interview',
          category: 'technical',
          difficulty: 'medium',
          tags: [newNoteSubject, newNoteTopic].filter(Boolean),
          hints: newNotePoints ? [newNotePoints] : [],
        });
      }
      setIsSavingNote(false);
      setShowAddNotesModal(false);
      setNewNoteTitle('');
      setNewNoteSummary('');
      setNewNotePoints('');
      loadModeData(mode);
      addToast({
        type: 'success',
        message: 'Saved to repository.',
      });
    } catch {
      setIsSavingNote(false);
      addToast({
        type: 'error',
        message: 'Failed to save item.',
      });
    }
  };

  const handleSaveFeed = () => {
    if (!remoteFeedUrl.trim()) return;
    setShowAddNotesModal(false);
    setRemoteFeedUrl('');
    addToast({
      type: 'success',
      message: 'Feed connected.',
    });
  };

  return (
    <div
      className={`flex flex-col h-screen w-full select-none font-sans overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0D0F10] text-[#F5F5F4]' : 'bg-[#F4F5F7] text-[#111827]'
      }`}
    >
      {/* ============================================================ */}
      {/* 1. TOP BAR & COMPANION HERO HEADER                           */}
      {/* ============================================================ */}
      <header className="p-4 pb-0 z-20">
        {/* Top bar row: Title dropdown + Window controls */}
        <div className="flex items-center justify-between">
          {/* Logo, Brand & Dropdown Switcher */}
          <div className="relative" ref={modeSwitcherRef}>
            <button
              type="button"
              onClick={() => setShowModeSwitcher(!showModeSwitcher)}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              title="Click to switch study mode"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 shadow-xs"
                style={{
                  backgroundColor: `${accentColor}18`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                {mode === 'interview' && <Briefcase className="w-4 h-4" />}
                {mode === 'exam' && <GraduationCap className="w-4 h-4" />}
                {mode === 'reading' && <BookOpen className="w-4 h-4" />}
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-[15px] tracking-tight ${
                    isDark ? 'text-[#F5F5F4] group-hover:text-white' : 'text-[#111827] group-hover:text-black'
                  }`}
                >
                  Anvil
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showModeSwitcher ? 'rotate-180' : ''
                  } ${isDark ? 'text-[#A7A9AD] group-hover:text-[#F5F5F4]' : 'text-[#6B7280] group-hover:text-[#111827]'}`}
                  style={showModeSwitcher ? { color: accentColor } : undefined}
                />
                <span className={isDark ? 'text-[#292C30]' : 'text-[#D1D5DB]'}>|</span>
                <span className="text-xs font-bold capitalize" style={{ color: accentColor }}>
                  {mode}
                </span>
              </div>
            </button>

            {/* Mode Switcher Popover */}
            {showModeSwitcher && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-48 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.4)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md border ${
                  isDark ? 'bg-[#16181B] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB]'
                }`}
              >
                <div
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: isDark ? '#73767C' : '#9CA3AF' }}
                >
                  Switch Mode
                </div>
                <div className="space-y-1 mt-0.5">
                  {[
                    { id: 'reading', label: 'Reading', icon: BookOpen },
                    { id: 'exam', label: 'Exam', icon: GraduationCap },
                    { id: 'interview', label: 'Interview', icon: Briefcase },
                  ].map((item) => {
                    const isCurrent = mode === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleSelectMode(item.id as Mode);
                          setShowModeSwitcher(false);
                        }}
                        style={isCurrent ? { backgroundColor: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}40` } : undefined}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer border ${
                          isCurrent
                            ? 'border'
                            : isDark
                            ? 'text-[#A7A9AD] hover:bg-[#1D2024] hover:text-[#F5F5F4] border-transparent'
                            : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-3.5 h-3.5" style={{ color: isCurrent ? accentColor : undefined }} />
                          <span>{item.label}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5" style={{ color: accentColor }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top Right Window Controls */}
          <div className="flex items-center gap-1 z-30">
            <button
              type="button"
              onClick={() => {
                setIsPinned(!isPinned);
                addToast({
                  type: 'info',
                  message: !isPinned ? 'Side panel pinned.' : 'Side panel unpinned.',
                });
              }}
              title={isPinned ? 'Unpin' : 'Pin side panel'}
              style={isPinned ? { color: accentColor, backgroundColor: `${accentColor}18` } : undefined}
              className={`p-1.5 rounded-md transition-colors ${
                isPinned
                  ? ''
                  : isDark
                  ? 'text-[#73767C] hover:text-[#F5F5F4] hover:bg-[#17191C]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]'
              }`}
            >
              <Pin className="w-3.5 h-3.5 rotate-45" />
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              title="Minimize"
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? 'text-[#73767C] hover:text-[#F5F5F4] hover:bg-[#17191C]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => window.close()}
              title="Close side panel"
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? 'text-[#73767C] hover:text-[#F5F5F4] hover:bg-[#17191C]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. THREE-OPTION MODE NAVIGATION SELECTOR                      */}
      {/* ============================================================ */}
      <section className="px-4 mt-2.5 z-10">
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Reading */}
          <button
            type="button"
            onClick={() => handleSelectMode('reading')}
            style={
              mode === 'reading'
                ? {
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: `${accentColor}18`,
                    boxShadow: `0 0 12px ${accentColor}25`,
                  }
                : undefined
            }
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'reading'
                ? 'border-[1.5px]'
                : isDark
                ? 'bg-[#17191C] border border-[#292C30] text-[#A7A9AD] hover:bg-[#1D2024] hover:text-[#F5F5F4]'
                : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] shadow-xs'
            }`}
          >
            <BookOpen
              className="w-3.5 h-3.5"
              style={{ color: mode === 'reading' ? accentColor : undefined }}
            />
            <span>Reading</span>
          </button>

          {/* 2. Exam */}
          <button
            type="button"
            onClick={() => handleSelectMode('exam')}
            style={
              mode === 'exam'
                ? {
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: `${accentColor}18`,
                    boxShadow: `0 0 12px ${accentColor}25`,
                  }
                : undefined
            }
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'exam'
                ? 'border-[1.5px]'
                : isDark
                ? 'bg-[#17191C] border border-[#292C30] text-[#A7A9AD] hover:bg-[#1D2024] hover:text-[#F5F5F4]'
                : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] shadow-xs'
            }`}
          >
            <GraduationCap
              className="w-3.5 h-3.5"
              style={{ color: mode === 'exam' ? accentColor : undefined }}
            />
            <span>Exam</span>
          </button>

          {/* 3. Interview */}
          <button
            type="button"
            onClick={() => handleSelectMode('interview')}
            style={
              mode === 'interview'
                ? {
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: `${accentColor}18`,
                    boxShadow: `0 0 12px ${accentColor}25`,
                  }
                : undefined
            }
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'interview'
                ? 'border-[1.5px]'
                : isDark
                ? 'bg-[#17191C] border border-[#292C30] text-[#A7A9AD] hover:bg-[#1D2024] hover:text-[#F5F5F4]'
                : 'bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] shadow-xs'
            }`}
          >
            <Briefcase
              className="w-3.5 h-3.5"
              style={{ color: mode === 'interview' ? accentColor : undefined }}
            />
            <span>Interview</span>
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SEARCH FIELD WITH REAL-TIME CLEAR & CTRL + K               */}
      {/* ============================================================ */}
      <section className="px-4 mt-2.5 z-10">
        <div
          onClick={() => searchInputRef.current?.focus()}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-text ${
            isDark
              ? 'bg-[#17191C] border-[#292C30] focus-within:border-[#383C42]'
              : 'bg-[#FFFFFF] border-[#E5E7EB] focus-within:border-[#D1D5DB] shadow-xs'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#73767C] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, formulas, topics..."
            className={`w-full bg-transparent text-xs focus:outline-none ${
              isDark ? 'text-[#F5F5F4] placeholder:text-[#73767C]' : 'text-[#111827] placeholder:text-[#9CA3AF]'
            }`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="text-[#73767C] hover:text-[#F5F5F4] p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <div className="flex items-center gap-1 shrink-0 select-none pointer-events-none">
              <kbd
                className={`px-1.5 py-0.5 text-[10px] font-mono border rounded ${
                  isDark
                    ? 'text-[#73767C] bg-[#111315] border-[#292C30]'
                    : 'text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]'
                }`}
              >
                Ctrl
              </kbd>
              <kbd
                className={`px-1.5 py-0.5 text-[10px] font-mono border rounded ${
                  isDark
                    ? 'text-[#73767C] bg-[#111315] border-[#292C30]'
                    : 'text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]'
                }`}
              >
                K
              </kbd>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* READING MODE: FOCUS TOGGLE                                   */}
      {/* ============================================================ */}
      {mode === 'reading' && (
        <section className="px-4 mt-2.5 z-10">
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
              isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300 shrink-0"
                style={{
                  backgroundColor: readingFocus ? accentColor : '#73767C',
                  boxShadow: readingFocus ? `0 0 8px ${accentColor}` : 'none',
                }}
              />
              <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                Reading Focus
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  readingFocus
                    ? ''
                    : isDark ? 'bg-[#111315] text-[#73767C]' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                }`}
                style={
                  readingFocus
                    ? {
                        backgroundColor: `${accentColor}18`,
                        color: accentColor,
                        border: `1px solid ${accentColor}30`,
                      }
                    : undefined
                }
              >
                {readingFocus ? 'Active' : 'Paused'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={readingFocus}
              onClick={() => handleToggleReadingFocus(!readingFocus)}
              style={{
                backgroundColor: readingFocus ? accentColor : isDark ? '#292C30' : '#D1D5DB',
              }}
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none p-0.5 select-none"
              title={readingFocus ? 'Turn Reading Focus OFF' : 'Turn Reading Focus ON'}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out pointer-events-none"
                style={{
                  transform: readingFocus ? 'translateX(16px)' : 'translateX(0px)',
                }}
              />
            </button>
          </div>
        </section>
      )}



      {/* ============================================================ */}
      {/* 5. INTERACTIVE WORKSPACE & REPOSITORY (BY MODE)              */}
      {/* ============================================================ */}
      <main className="px-4 mt-3 flex-1 flex flex-col z-10 min-h-0 overflow-y-auto">
        {/* ========================================================== */}
        {/* INTERVIEW MODE WORKSPACE                                   */}
        {/* ========================================================== */}
        {mode === 'interview' && (
          <div
            className={`rounded-2xl border p-3.5 flex flex-col flex-1 overflow-y-auto ${
              isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-xs'
            }`}
          >
            {/* Sub-Navigation Tabs */}
            <div className={`flex items-center justify-between pb-2 mb-3 border-b ${isDark ? 'border-[#292C30]' : 'border-[#E5E7EB]'}`}>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'questions', label: `Questions (${interviewData.questions.length})` },
                  { id: 'mock', label: 'Live Mock' },
                  { id: 'resume', label: 'Resume ATS' },
                  { id: 'history', label: `History (${interviewData.sessions.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInterviewSubTab(t.id as any)}
                    style={
                      interviewSubTab === t.id
                        ? {
                            backgroundColor: `${accentColor}18`,
                            color: accentColor,
                            borderColor: `${accentColor}40`,
                          }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      interviewSubTab === t.id
                        ? 'border shadow-xs'
                        : isDark
                        ? 'text-[#A7A9AD] hover:text-[#F5F5F4] hover:bg-[#111315]'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddNotesModal(true)}
                style={{ color: accentColor }}
                className="text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer ml-2 hover:opacity-80"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* TAB 1: QUESTION BANK */}
            {interviewSubTab === 'questions' && (
              <div className="space-y-2.5 overflow-y-auto flex-1">
                {/* Track Selector Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  {[
                    { id: 'all', label: 'All Tracks' },
                    { id: 'dsa', label: 'DSA' },
                    { id: 'system_design', label: 'System Design' },
                    { id: 'technical', label: 'Core Tech' },
                    { id: 'hr', label: 'Behavioral' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedInterviewCategory(cat.id as any)}
                      style={
                        selectedInterviewCategory === cat.id
                          ? {
                              backgroundColor: `${accentColor}20`,
                              borderColor: accentColor,
                              color: accentColor,
                            }
                          : undefined
                      }
                      className={`px-2 py-0.5 rounded-full border transition-colors shrink-0 cursor-pointer ${
                        selectedInterviewCategory === cat.id
                          ? 'font-bold'
                          : isDark
                          ? 'bg-[#111315] border-[#292C30] text-[#A7A9AD] hover:text-[#F5F5F4]'
                          : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Question List */}
                <div className="space-y-2">
                  {(() => {
                    const filtered = interviewData.questions.filter((q) => {
                      if (selectedInterviewCategory !== 'all' && q.category !== selectedInterviewCategory) return false;
                      if (selectedInterviewDifficulty !== 'all' && q.difficulty !== selectedInterviewDifficulty) return false;
                      if (searchQuery) {
                        const sq = searchQuery.toLowerCase();
                        return (
                          q.title.toLowerCase().includes(sq) ||
                          q.prompt.toLowerCase().includes(sq) ||
                          q.tags.some((t) => t.toLowerCase().includes(sq))
                        );
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className={`p-5 rounded-2xl border text-center space-y-2.5 my-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                          <div
                            className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                            style={{
                              backgroundColor: `${accentColor}18`,
                              borderColor: `${accentColor}35`,
                              color: accentColor,
                            }}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>No Questions Saved Yet</div>
                          <p className={`text-[11px] max-w-[260px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                            Click <span className="font-semibold" style={{ color: accentColor }}>+ Add</span> above to save interview questions, or practice with a <span className="font-semibold" style={{ color: accentColor }}>Live Mock</span> round.
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((q) => {
                      const isExpanded = expandedQuestionId === q.id;
                      const isHintRevealed = revealedHintId === q.id;
                      const isSolutionRevealed = revealedSolutionId === q.id;

                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            isDark
                              ? 'bg-[#111315] border-[#292C30] hover:border-[#383C42]'
                              : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                          }`}
                        >
                          <div
                            className="flex items-start justify-between gap-2 cursor-pointer"
                            onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border"
                                  style={{
                                    backgroundColor: `${accentColor}18`,
                                    borderColor: `${accentColor}35`,
                                    color: accentColor,
                                  }}
                                >
                                  {q.category.replace('_', ' ')}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                    q.difficulty === 'easy'
                                      ? 'bg-[#12241C] text-[#34D399] border border-[#34D399]/25'
                                      : q.difficulty === 'medium'
                                      ? 'bg-[#261E14] text-[#FBBF24] border border-[#FBBF24]/25'
                                      : 'bg-[#2A1614] text-[#F87171] border border-[#F87171]/25'
                                  }`}
                                >
                                  {q.difficulty}
                                </span>
                                {q.frequencyRank && q.frequencyRank <= 3 && (
                                  <span
                                    className="text-[9px] px-1.5 py-0.2 rounded font-bold border flex items-center gap-0.5"
                                    style={{
                                      backgroundColor: `${accentColor}18`,
                                      borderColor: `${accentColor}35`,
                                      color: accentColor,
                                    }}
                                  >
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>Top {q.frequencyRank * 20}</span>
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-xs font-bold leading-snug ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                                {q.title}
                              </h4>
                            </div>
                            <button
                              type="button"
                              className="text-[#73767C] hover:text-[#F5F5F4] p-1"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'} ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {q.prompt}
                          </p>

                          {/* Expanded Content: Hints, Rubrics & Sample Answer */}
                          {isExpanded && (
                            <div className={`pt-2 border-t space-y-2 text-[11px] ${isDark ? 'border-[#202327]' : 'border-[#E5E7EB]'}`}>
                              {/* Hints Toggle */}
                              {q.hints && q.hints.length > 0 && (
                                <div className={`rounded-lg border p-2 ${isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB]'}`}>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedHintId(isHintRevealed ? null : q.id)}
                                    className="flex items-center justify-between w-full font-semibold text-[#FBBF24] text-[10px] cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Lightbulb className="w-3 h-3" />
                                      <span>Interview Hint</span>
                                    </div>
                                    <span>{isHintRevealed ? 'Hide' : 'Reveal'}</span>
                                  </button>
                                  {isHintRevealed && (
                                    <div className={`mt-1.5 text-[10px] space-y-1 pl-4 border-l border-[#FBBF24]/30 ${isDark ? 'text-[#D1D5DB]' : 'text-[#374151]'}`}>
                                      {q.hints.map((h, i) => (
                                        <div key={i}>• {h}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Rubrics */}
                              {q.rubrics && q.rubrics.length > 0 && (
                                <div className="space-y-1">
                                  <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                                    Evaluation Rubrics:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {q.rubrics.map((r, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#12241C] text-[#34D399] border border-[#34D399]/20"
                                      >
                                        ✓ {r}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Sample Solution Toggle */}
                              {q.sampleAnswer && (
                                <div className={`rounded-lg border p-2 ${isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB]'}`}>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedSolutionId(isSolutionRevealed ? null : q.id)}
                                    style={{ color: accentColor }}
                                    className="flex items-center justify-between w-full font-semibold text-[10px] cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Code2 className="w-3 h-3" />
                                      <span>Sample Solution / Architecture</span>
                                    </div>
                                    <span>{isSolutionRevealed ? 'Hide' : 'Show Code'}</span>
                                  </button>
                                  {isSolutionRevealed && (
                                    <pre className={`mt-1.5 p-2 rounded text-[10px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border ${
                                      isDark ? 'bg-[#0D0F10] text-[#E5E7EB] border-[#202327]' : 'bg-[#F9FAFB] text-[#111827] border-[#E5E7EB]'
                                    }`}>
                                      {q.sampleAnswer}
                                    </pre>
                                  )}
                                </div>
                              )}

                              {/* Action: Practice in Mock Round */}
                              <div className="pt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleStartMockRound(q.category === 'dsa' ? 'round-dsa' : q.category === 'system_design' ? 'round-system-design' : 'round-tech-depth')}
                                  style={{
                                    backgroundColor: `${accentColor}18`,
                                    borderColor: `${accentColor}40`,
                                    color: accentColor,
                                  }}
                                  className="px-3 py-1.5 rounded-lg font-bold text-[10px] border flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Practice in Live Mock Round</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE MOCK SESSION RUNNER */}
            {interviewSubTab === 'mock' && (
              <div className="space-y-3 overflow-y-auto flex-1">
                {activeMockSession ? (
                  /* Active Live Mock Session in progress */
                  <div className="space-y-3">
                    <div
                      className="p-3 rounded-xl border flex items-center justify-between"
                      style={{
                        backgroundColor: `${accentColor}18`,
                        borderColor: `${accentColor}40`,
                      }}
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                          {activeMockSession.roundTitle}
                        </div>
                        <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                          Question {activeMockSession.currentQuestionIndex + 1} of {activeMockSession.questions.length}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: accentColor }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Progress</span>
                      </div>
                    </div>

                    {/* Active Question Box */}
                    {activeMockSession.questions[activeMockSession.currentQuestionIndex] && (
                      <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border"
                            style={{
                              backgroundColor: `${accentColor}18`,
                              borderColor: `${accentColor}35`,
                              color: accentColor,
                            }}
                          >
                            {activeMockSession.questions[activeMockSession.currentQuestionIndex].category.toUpperCase()}
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                            Difficulty: {activeMockSession.questions[activeMockSession.currentQuestionIndex].difficulty}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                          {activeMockSession.questions[activeMockSession.currentQuestionIndex].title}
                        </h4>
                        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                          {activeMockSession.questions[activeMockSession.currentQuestionIndex].prompt}
                        </p>
                      </div>
                    )}

                    {/* Answer Input Area */}
                    <div className="space-y-1.5">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                        Your Technical Answer / Solution Approach:
                      </label>
                      <textarea
                        value={mockAnswerInput}
                        onChange={(e) => setMockAnswerInput(e.target.value)}
                        placeholder="Explain your approach, time/space complexity tradeoffs, code snippet, or architectural components..."
                        rows={5}
                        className={`w-full p-2.5 rounded-xl text-xs focus:outline-none resize-none leading-relaxed font-sans border ${
                          isDark
                            ? 'bg-[#111315] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                            : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF]'
                        }`}
                        style={{ outlineColor: accentColor }}
                      />
                    </div>

                    {/* Submit and Control Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleFinishMockSession}
                        className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                          isDark ? 'text-[#A7A9AD] hover:text-[#F5F5F4] hover:bg-[#17191C]' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        Finish Round
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitMockAnswer}
                        disabled={isEvaluatingMock || !mockAnswerInput.trim()}
                        style={{
                          backgroundColor: accentColor,
                          color: contrastText,
                        }}
                        className="px-4 py-2 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isEvaluatingMock ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Evaluating...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit & Evaluate</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Past Answers Feedback within Session */}
                    {activeMockSession.answers.length > 0 && (
                      <div className={`mt-3 pt-3 border-t space-y-2 ${isDark ? 'border-[#292C30]' : 'border-[#E5E7EB]'}`}>
                        <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                          Recent Evaluations in this Session:
                        </div>
                        {activeMockSession.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border space-y-1 ${
                              isDark ? 'bg-[#111315] border-[#202327]' : 'bg-[#FFFFFF] border-[#E5E7EB]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-semibold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                                Question {idx + 1}
                              </span>
                              <span className="text-[10px] font-bold text-[#34D399]">
                                Score: {ans.feedback?.score}/100
                              </span>
                            </div>
                            <p className={`text-[10px] line-clamp-1 italic ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                              "{ans.answerText}"
                            </p>
                            {ans.feedback && (
                              <div className="text-[9px] text-[#34D399]">
                                ✓ {ans.feedback.strengths[0]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mock Launcher Screen */
                  <div className="space-y-3 py-1">
                    <div className={`p-4 rounded-xl border space-y-2 text-center ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                      <div
                        className="w-10 h-10 rounded-full border flex items-center justify-center mx-auto"
                        style={{
                          backgroundColor: `${accentColor}18`,
                          borderColor: `${accentColor}40`,
                          color: accentColor,
                        }}
                      >
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                        Simulate Real Technical & Behavioral Rounds
                      </h3>
                      <p className={`text-[11px] max-w-[280px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                        Answer live interview prompts with automated instant scoring, strength analysis, and rubric evaluation.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                        Select Practice Track:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'round-dsa', title: 'DSA & Algorithms', duration: '35m', count: 5 },
                          { id: 'round-system-design', title: 'System Design', duration: '45m', count: 4 },
                          { id: 'round-tech-depth', title: 'Core Concurrency', duration: '30m', count: 4 },
                          { id: 'round-behavioral', title: 'Behavioral (STAR)', duration: '25m', count: 3 },
                        ].map((track) => {
                          const isSelected = selectedMockTrackId === track.id;
                          return (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => setSelectedMockTrackId(track.id)}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: `${accentColor}18`,
                                      borderColor: accentColor,
                                      color: accentColor,
                                    }
                                  : undefined
                              }
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? 'border shadow-xs'
                                  : isDark
                                  ? 'bg-[#111315] border-[#292C30] text-[#A7A9AD] hover:text-[#F5F5F4] hover:bg-[#17191C]'
                                  : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                              }`}
                            >
                              <div className={`text-[11px] font-bold leading-tight ${isSelected ? '' : isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                                {track.title}
                              </div>
                              <div className={`text-[9px] mt-0.5 ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                                {track.duration} • {track.count} questions
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartMockRound(selectedMockTrackId)}
                      style={{
                        backgroundColor: accentColor,
                        color: contrastText,
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Live Mock Interview Round ⚡</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RESUME ATS MATCHER */}
            {interviewSubTab === 'resume' && (
              <div className="space-y-3 overflow-y-auto flex-1">
                {interviewData.resume && (
                  <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-[#12241C] text-[#34D399] border border-[#34D399]/30">
                          ATS Analyzed
                        </span>
                        <h4 className={`text-xs font-bold mt-1 ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                          {interviewData.resume.targetRole}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black" style={{ color: accentColor }}>
                          {interviewData.resume.overallFitScore}%
                        </div>
                        <div className={`text-[9px] ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>Fit Score</div>
                      </div>
                    </div>

                    {/* Key Strengths */}
                    <div className="space-y-1">
                      <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                        Matched Engineering Strengths:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {interviewData.resume.keyStrengths.map((s, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#12241C] text-[#34D399] border border-[#34D399]/20"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skill Gaps */}
                    <div className="space-y-1">
                      <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                        Identified Gaps & Focus Areas:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {interviewData.resume.skillGaps.map((g, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A1614] text-[#F87171] border border-[#F87171]/20"
                          >
                            ! {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Practice Rounds */}
                    <div className="space-y-1 pt-1">
                      <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                        Recommended Practice Tracks:
                      </div>
                      <div className="space-y-1">
                        {interviewData.resume.recommendedRounds.map((r, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              isDark ? 'bg-[#17191C] border-[#202327]' : 'bg-[#FFFFFF] border-[#E5E7EB]'
                            }`}
                          >
                            <span className={`text-[10px] font-semibold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>{r}</span>
                            <button
                              type="button"
                              onClick={() => handleStartMockRound('round-dsa')}
                              style={{ color: accentColor }}
                              className="text-[9px] font-bold hover:underline cursor-pointer"
                            >
                              Launch Track →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload or Re-upload Resume Button */}
                <div
                  className={`p-3 rounded-xl border border-dashed text-center space-y-1.5 ${
                    isDark ? 'border-[#292C30] bg-[#111315]/50' : 'border-[#D1D5DB] bg-[#F9FAFB]'
                  }`}
                >
                  <Upload className="w-4 h-4 text-[#73767C] mx-auto" />
                  <div className={`text-[11px] font-semibold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                    Upload Updated Resume (.pdf, .docx)
                  </div>
                  <p className={`text-[10px] ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                    Extract keywords, match job rubrics, and calibrate interview tracks.
                  </p>
                  <label
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-[#17191C] hover:bg-[#1D2024] border-[#292C30] text-[#F5F5F4]'
                        : 'bg-[#FFFFFF] hover:bg-[#F3F4F6] border-[#D1D5DB] text-[#111827] shadow-xs'
                    }`}
                  >
                    <span>Select File</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          interviewService.analyzeResume(f.name, '').then(() => {
                            loadModeData('interview');
                            addToast({ type: 'success', message: `Analyzed ${f.name}` });
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: MOCK SESSIONS HISTORY */}
            {interviewSubTab === 'history' && (
              <div className="space-y-2 overflow-y-auto flex-1">
                {interviewData.sessions.length === 0 ? (
                  <div className={`p-5 rounded-2xl border text-center space-y-2.5 my-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                    <div
                      className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                      style={{
                        backgroundColor: `${accentColor}18`,
                        borderColor: `${accentColor}35`,
                        color: accentColor,
                      }}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>No Interview Sessions Yet</div>
                    <p className={`text-[11px] max-w-[260px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                      Head to the <span className="font-semibold" style={{ color: accentColor }}>Live Mock</span> tab to run your first timed interview practice round!
                    </p>
                  </div>
                ) : (
                  interviewData.sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border space-y-2 ${
                        isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                            {s.roundTitle}
                          </h4>
                          <div className={`text-[10px] ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                            {new Date(s.startTime).toLocaleDateString()} • {s.questions.length} questions
                          </div>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border"
                          style={{
                            backgroundColor: `${accentColor}18`,
                            borderColor: `${accentColor}35`,
                            color: accentColor,
                          }}
                        >
                          {s.status === 'completed' ? `Score: ${s.overallFeedback?.totalScore || 85}%` : s.status}
                        </span>
                      </div>

                      {s.overallFeedback && (
                        <p
                          className={`text-[11px] leading-relaxed p-2 rounded-lg border ${
                            isDark ? 'text-[#A7A9AD] bg-[#17191C] border-[#202327]' : 'text-[#4B5563] bg-[#FFFFFF] border-[#E5E7EB]'
                          }`}
                        >
                          {s.overallFeedback.summary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* EXAM MODE WORKSPACE                                        */}
        {/* ========================================================== */}
        {mode === 'exam' && (
          <div
            className={`rounded-2xl border p-3.5 flex flex-col flex-1 overflow-y-auto ${
              isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-xs'
            }`}
          >
            {/* Sub-Navigation Tabs */}
            <div className={`flex items-center justify-between pb-2 mb-3 border-b ${isDark ? 'border-[#292C30]' : 'border-[#E5E7EB]'}`}>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${totalModeItemsCount})` },
                  { id: 'pyqs', label: `PYQs (${examData.pyqs.length})` },
                  { id: 'formulas', label: `Formulas (${examData.formulas.length})` },
                  { id: 'revision', label: `Revision (${examData.revisionNotes.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExamSubTab(t.id as any)}
                    style={
                      examSubTab === t.id
                        ? {
                            backgroundColor: `${accentColor}18`,
                            color: accentColor,
                            borderColor: `${accentColor}40`,
                          }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      examSubTab === t.id
                        ? 'border shadow-xs'
                        : isDark
                        ? 'text-[#A7A9AD] hover:text-[#F5F5F4] hover:bg-[#111315]'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddNotesModal(true)}
                style={{ color: accentColor }}
                className="text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer ml-2 hover:opacity-80"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1">
              {examSubTab === 'all' && totalModeItemsCount === 0 && (
                <div className={`p-5 rounded-2xl border text-center space-y-2.5 my-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                  <div
                    className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      borderColor: `${accentColor}35`,
                      color: accentColor,
                    }}
                  >
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>No Exam Resources Stored Yet</div>
                  <p className={`text-[11px] max-w-[260px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                    Click <span className="font-semibold" style={{ color: accentColor }}>+ Add</span> above to store formulas, previous year questions, or revision notes.
                  </p>
                </div>
              )}

              {/* FORMULAS */}
              {(examSubTab === 'all' || examSubTab === 'formulas') && (
                <div className="space-y-2">
                  {examSubTab === 'formulas' && examData.formulas.length === 0 ? (
                    <div className={`p-5 rounded-2xl border text-center space-y-2.5 my-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                      <div
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                        style={{
                          backgroundColor: `${accentColor}18`,
                          borderColor: `${accentColor}35`,
                          color: accentColor,
                        }}
                      >
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>No Formulas Saved Yet</div>
                      <p className={`text-[11px] max-w-[260px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                        Click <span className="font-semibold" style={{ color: accentColor }}>+ Add</span> above to build your high-yield formula bank.
                      </p>
                    </div>
                  ) : (
                    examData.formulas
                      .filter(
                        (f) =>
                          !searchQuery ||
                          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.formula.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((f) => (
                        <div
                          key={f.id}
                          className={`p-3 rounded-xl border transition-colors space-y-2 ${
                            isDark ? 'bg-[#111315] border-[#292C30] hover:border-[#383C42]' : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>{f.name}</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-semibold border"
                              style={{
                                backgroundColor: `${accentColor}18`,
                                borderColor: `${accentColor}35`,
                                color: accentColor,
                              }}
                            >
                              {f.subject} • {f.topic}
                            </span>
                          </div>

                          {/* Formula Math Box */}
                          <div
                            className={`p-2.5 rounded-lg font-mono text-xs border flex items-center justify-between ${
                              isDark ? 'bg-[#0D0F10] border-[#202327]' : 'bg-[#FFFFFF] border-[#E5E7EB]'
                            }`}
                            style={{ color: accentColor }}
                          >
                            <span className="truncate pr-2">{f.formula}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyFormula(f)}
                              title="Copy formula"
                              className="p-1 cursor-pointer hover:opacity-80"
                              style={{ color: accentColor }}
                            >
                              {copiedFormulaId === f.id ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                            {f.explanation}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className={`text-[10px] ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>
                              Ex: {f.example}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCreateFlashcardFromFormula(f)}
                              style={{ color: accentColor }}
                              className="text-[10px] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Flashcard</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* PYQS */}
              {(examSubTab === 'all' || examSubTab === 'pyqs') && (
                <div className="space-y-2">
                  {examSubTab === 'pyqs' && examData.pyqs.length === 0 ? (
                    <div className={`p-5 rounded-2xl border text-center space-y-2.5 my-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                      <div
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                        style={{
                          backgroundColor: `${accentColor}18`,
                          borderColor: `${accentColor}35`,
                          color: accentColor,
                        }}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>No Previous Year Questions Yet</div>
                      <p className={`text-[11px] max-w-[260px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                        Click <span className="font-semibold" style={{ color: accentColor }}>+ Add</span> above to save previous year questions and model solutions.
                      </p>
                    </div>
                  ) : (
                    examData.pyqs
                      .filter(
                        (q) =>
                          !searchQuery ||
                          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.prompt.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((q) => {
                        const isExpanded = expandedPyqId === q.id;
                        return (
                          <div
                            key={q.id}
                            className={`p-3 rounded-xl border transition-colors space-y-2 cursor-pointer ${
                              isDark ? 'bg-[#111315] border-[#292C30] hover:border-[#383C42]' : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                            }`}
                            onClick={() => setExpandedPyqId(isExpanded ? null : q.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>{q.title}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-semibold border"
                                style={{
                                  backgroundColor: `${accentColor}18`,
                                  borderColor: `${accentColor}35`,
                                  color: accentColor,
                                }}
                              >
                                {q.year || 'Exam'} • {q.difficulty?.toUpperCase()}
                              </span>
                            </div>
                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'} ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {q.prompt}
                            </p>
                            {isExpanded && q.sampleAnswer && (
                              <div
                                className={`mt-2 p-2 rounded-lg border text-[10px] leading-relaxed ${
                                  isDark ? 'bg-[#0D0F10] border-[#202327] text-[#D1D5DB]' : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#374151]'
                                }`}
                              >
                                <span className="font-bold text-[#34D399]">Model Solution: </span>
                                {q.sampleAnswer}
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* REVISION NOTES */}
              {(examSubTab === 'all' || examSubTab === 'revision') && (
                <div className="space-y-2">
                  {examSubTab === 'revision' && examData.revisionNotes.length === 0 ? (
                    <div className={`p-5 rounded-2xl border text-center space-y-2.5 my-2 ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                      <div
                        className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border"
                        style={{
                          backgroundColor: `${accentColor}18`,
                          borderColor: `${accentColor}35`,
                          color: accentColor,
                        }}
                      >
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>No Revision Notes Saved Yet</div>
                      <p className={`text-[11px] max-w-[260px] mx-auto leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                        Click <span className="font-semibold" style={{ color: accentColor }}>+ Add</span> above to record key topic summaries and cheat sheets.
                      </p>
                    </div>
                  ) : (
                    examData.revisionNotes
                      .filter(
                        (n) =>
                          !searchQuery ||
                          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.summary.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border transition-colors space-y-2 ${
                            isDark ? 'bg-[#111315] border-[#292C30] hover:border-[#383C42]' : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>{n.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#12241C] text-[#34D399] font-medium border border-[#34D399]/25">
                              {n.subject}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                            {n.summary}
                          </p>
                          {n.keyPoints && n.keyPoints.length > 0 && (
                            <div className={`space-y-1 pl-3 border-l text-[10px] ${isDark ? 'border-[#34D399]/30 text-[#D1D5DB]' : 'border-[#34D399]/40 text-[#374151]'}`}>
                              {n.keyPoints.map((p, idx) => (
                                <div key={idx}>• {p}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* READING MODE WORKSPACE                                     */}
        {/* ========================================================== */}
        {mode === 'reading' && (
          <div
            className={`rounded-2xl border p-3.5 flex flex-col flex-1 overflow-y-auto ${
              isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-xs'
            }`}
          >
            {/* Sub-Navigation Tabs */}
            <div className={`flex items-center justify-between pb-2 mb-3 border-b ${isDark ? 'border-[#292C30]' : 'border-[#E5E7EB]'}`}>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${totalModeItemsCount})` },
                  { id: 'notes', label: `Notes (${readingData.notes.length})` },
                  { id: 'bookmarks', label: `Saved (${readingData.bookmarks.length})` },
                  { id: 'flashcards', label: `Flashcards (${readingData.flashcards.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setReadingSubTab(t.id as any)}
                    style={
                      readingSubTab === t.id
                        ? {
                            backgroundColor: `${accentColor}18`,
                            color: accentColor,
                            borderColor: `${accentColor}40`,
                          }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      readingSubTab === t.id
                        ? 'border shadow-xs'
                        : isDark
                        ? 'text-[#A7A9AD] hover:text-[#F5F5F4] hover:bg-[#111315]'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddNotesModal(true)}
                style={{ color: accentColor }}
                className="text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer ml-2 hover:opacity-80"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1">
              {/* ALL EMPTY STATE */}
              {readingSubTab === 'all' && totalModeItemsCount === 0 && (
                <div className={`py-12 px-4 rounded-xl border border-dashed text-center flex flex-col items-center justify-center ${
                  isDark ? 'border-[#292C30] bg-[#111315]/40 text-[#73767C]' : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]'
                }`}>
                  <BookOpen className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No saved items yet</p>
                  <p className="text-[10px] mt-0.5 opacity-70">Save notes, bookmarks, or flashcards while browsing to see them here.</p>
                </div>
              )}

              {/* NOTES EMPTY STATE */}
              {readingSubTab === 'notes' && readingData.notes.length === 0 && (
                <div className={`py-12 px-4 rounded-xl border border-dashed text-center flex flex-col items-center justify-center ${
                  isDark ? 'border-[#292C30] bg-[#111315]/40 text-[#73767C]' : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]'
                }`}>
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No notes created yet</p>
                  <p className="text-[10px] mt-0.5 opacity-70">Click + Add above or highlight text on any page to create study notes.</p>
                </div>
              )}

              {/* NOTES */}
              {(readingSubTab === 'all' || readingSubTab === 'notes') && (
                <div className="space-y-2">
                  {readingData.notes
                    .filter(
                      (n) =>
                        !searchQuery ||
                        n.pageTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        n.content.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border transition-colors space-y-1.5 ${
                          isDark ? 'bg-[#111315] border-[#292C30] hover:border-[#383C42]' : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                            {n.pageTitle || 'Study Note'}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium border"
                            style={{
                              backgroundColor: `${accentColor}18`,
                              borderColor: `${accentColor}35`,
                              color: accentColor,
                            }}
                          >
                            Note
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                          {n.content}
                        </p>
                        {n.tags && n.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {n.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.2 rounded border ${
                                  isDark ? 'bg-[#17191C] text-[#73767C] border-[#292C30]' : 'bg-[#FFFFFF] text-[#6B7280] border-[#E5E7EB]'
                                }`}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* BOOKMARKS EMPTY STATE */}
              {readingSubTab === 'bookmarks' && readingData.bookmarks.length === 0 && (
                <div className={`py-12 px-4 rounded-xl border border-dashed text-center flex flex-col items-center justify-center ${
                  isDark ? 'border-[#292C30] bg-[#111315]/40 text-[#73767C]' : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]'
                }`}>
                  <BookmarkIcon className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No saved articles or bookmarks</p>
                  <p className="text-[10px] mt-0.5 opacity-70">Bookmark key references or pages to easily revisit them later.</p>
                </div>
              )}

              {/* BOOKMARKS */}
              {(readingSubTab === 'all' || readingSubTab === 'bookmarks') && (
                <div className="space-y-2">
                  {readingData.bookmarks
                    .filter(
                      (b) =>
                        !searchQuery ||
                        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.url.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((b) => (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border transition-colors space-y-1.5 ${
                          isDark ? 'bg-[#111315] border-[#292C30] hover:border-[#383C42]' : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                            {b.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#12241C] text-[#34D399] font-semibold border border-[#34D399]/25">
                            Article
                          </span>
                        </div>
                        {b.snippet && (
                          <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
                            {b.snippet}
                          </p>
                        )}
                        <div className={`text-[10px] truncate ${isDark ? 'text-[#73767C]' : 'text-[#9CA3AF]'}`}>{b.url}</div>
                      </div>
                    ))}
                </div>
              )}

              {/* FLASHCARDS EMPTY STATE */}
              {readingSubTab === 'flashcards' && readingData.flashcards.length === 0 && (
                <div className={`py-12 px-4 rounded-xl border border-dashed text-center flex flex-col items-center justify-center ${
                  isDark ? 'border-[#292C30] bg-[#111315]/40 text-[#73767C]' : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]'
                }`}>
                  <Sparkles className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No flashcards created yet</p>
                  <p className="text-[10px] mt-0.5 opacity-70">Create flashcards from articles or study material to test your recall.</p>
                </div>
              )}

              {/* FLASHCARDS */}
              {(readingSubTab === 'all' || readingSubTab === 'flashcards') && (
                <div className="space-y-2">
                  {readingData.flashcards
                    .filter(
                      (fc) =>
                        !searchQuery ||
                        fc.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        fc.back.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((fc) => {
                      const isFlipped = flippedCardId === fc.id;
                      return (
                        <div
                          key={fc.id}
                          onClick={() => setFlippedCardId(isFlipped ? null : fc.id)}
                          style={isFlipped ? { borderColor: `${accentColor}60` } : undefined}
                          className={`p-3.5 rounded-xl border transition-all space-y-2 cursor-pointer group ${
                            isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB] shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: accentColor }}>
                              <Sparkles className="w-3 h-3" />
                              <span>{isFlipped ? 'Answer' : 'Question Prompt'}</span>
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                isDark ? 'bg-[#17191C] text-[#73767C] border-[#292C30]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'
                              }`}
                            >
                              Click to Flip
                            </span>
                          </div>
                          <div className={`text-xs font-semibold leading-relaxed ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                            {isFlipped ? fc.back : fc.front}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* 6. BOTTOM UTILITY & PROFILE SECTION WITH MOUNTAIN SILHOUETTE */}
      {/* ============================================================ */}
      <footer
        className={`relative mt-auto border-t z-20 ${
          isDark ? 'bg-[#0D0F10] border-[#292C30]' : 'bg-[#F4F5F7] border-[#E5E7EB]'
        }`}
      >
        {/* User Profile & Utility Icons */}
        <div className="relative z-10 px-4 py-2.5 flex items-center justify-between">
          <div
            onClick={() => {
              setTempUserName(userName);
              setShowProfileModal(true);
            }}
            title="Edit profile name"
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold relative transition-colors ${
                isDark ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4]' : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827] shadow-xs'
              }`}
            >
              <span>{userName.charAt(0).toUpperCase()}</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#73767C] absolute -bottom-0.5 -right-0.5" />
            </div>
            <span
              className={`text-xs font-semibold transition-colors truncate max-w-[140px] ${
                isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'
              }`}
            >
              {userName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowProgressModal(true)}
              title="Study Stats & Progress"
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#17191C] hover:bg-[#1D2024] border-[#292C30] text-[#A7A9AD] hover:text-[#F5F5F4]'
                  : 'bg-[#FFFFFF] hover:bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] shadow-xs'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Appearance & Settings"
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#17191C] hover:bg-[#1D2024] border-[#292C30] text-[#A7A9AD] hover:text-[#F5F5F4]'
                  : 'bg-[#FFFFFF] hover:bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] shadow-xs'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              title="Help & Shortcuts"
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#17191C] hover:bg-[#1D2024] border-[#292C30] text-[#A7A9AD] hover:text-[#F5F5F4]'
                  : 'bg-[#FFFFFF] hover:bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] shadow-xs'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 7. MODALS (SETTINGS, ADD NOTES, PROGRESS, HELP, PROFILE)       */}
      {/* ============================================================ */}

      {/* Settings & Appearance Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Settings & Appearance"
        description="Customize your theme, extension accent color, and backend AI services."
        footer={
          <>
            <button
              onClick={() => setShowSettingsModal(false)}
              className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
                isDark ? 'text-[#A7A9AD] hover:bg-[#17191C]' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingConfig}
              style={{ backgroundColor: accentColor, color: contrastText }}
              className="px-3.5 py-1.5 text-xs font-bold rounded shadow-subtle flex items-center gap-1 cursor-pointer transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Theme Mode Selector (Dark vs Light) */}
          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: isDark ? '#A7A9AD' : '#4B5563' }}
            >
              Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Dark Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={
                  theme === 'dark'
                    ? {
                        borderColor: accentColor,
                        backgroundColor: isDark ? '#17191C' : '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[1.5px] shadow-xs'
                    : isDark
                    ? 'bg-[#17191C] border-[#292C30] hover:bg-[#1D2024]'
                    : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#111315] border border-[#292C30] flex items-center justify-center text-[#F5F5F4] shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className={`font-bold text-xs ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                    Dark Mode
                  </div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-[#73767C]' : 'text-[#6B7280]'}`}>
                    Sleek dark canvas (Default)
                  </div>
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />}
              </button>

              {/* Light Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={
                  theme === 'light'
                    ? {
                        borderColor: accentColor,
                        backgroundColor: isDark ? '#17191C' : '#FFFFFF',
                      }
                    : undefined
                }
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[1.5px] shadow-xs'
                    : isDark
                    ? 'bg-[#17191C] border-[#292C30] hover:bg-[#1D2024]'
                    : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center text-[#F59E0B] shadow-xs shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className={`font-bold text-xs ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                    Light Mode
                  </div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-[#73767C]' : 'text-[#6B7280]'}`}>
                    Crisp bright paper layout
                  </div>
                </div>
                {theme === 'light' && <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />}
              </button>
            </div>
          </div>

          {/* Extension Accent Color Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-[11px] font-bold uppercase tracking-wider"
                style={{ color: isDark ? '#A7A9AD' : '#4B5563' }}
              >
                Extension Accent Color
              </label>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                {accentColor.toUpperCase()}
              </span>
            </div>

            {/* Swatches */}
            <div className="grid grid-cols-4 gap-2 mb-2.5">
              {PRESET_ACCENT_COLORS.map((preset) => {
                const isSelected = accentColor.toLowerCase() === preset.color.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAccentColor(preset.color)}
                    style={isSelected ? { borderColor: preset.color } : undefined}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-[1.5px] shadow-xs'
                        : isDark
                        ? 'bg-[#17191C] border-[#292C30] hover:bg-[#1D2024]'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                    }`}
                    title={preset.name}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs"
                      style={{ backgroundColor: preset.color }}
                    >
                      {isSelected && <Check className="w-3 h-3" style={{ color: getContrastTextColor(preset.color) }} />}
                    </div>
                    <span
                      className="text-[9px] font-semibold truncate max-w-[65px]"
                      style={{ color: isDark ? '#D1D5DB' : '#374151' }}
                    >
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input Picker */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" style={{ color: accentColor }} />
                <span className={`text-xs font-semibold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
                  Choose Custom Color:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#FF6845"
                  className="w-20 px-2 py-1 rounded font-mono text-xs text-center border focus:outline-none"
                  style={{
                    backgroundColor: isDark ? '#111315' : '#FFFFFF',
                    borderColor: isDark ? '#292C30' : '#D1D5DB',
                    color: isDark ? '#F5F5F4' : '#111827',
                  }}
                />
                <label
                  className="relative w-7 h-7 rounded-lg overflow-hidden cursor-pointer border shadow-xs shrink-0"
                  style={{ borderColor: isDark ? '#292C30' : '#D1D5DB' }}
                >
                  <input
                    type="color"
                    value={accentColor.startsWith('#') ? accentColor : '#FF6845'}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-full h-full" style={{ backgroundColor: accentColor }} />
                </label>
              </div>
            </div>
          </div>

          {/* Backend API URL */}
          <div className="pt-1 border-t space-y-2.5" style={{ borderColor: isDark ? '#292C30' : '#E5E7EB' }}>
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                Backend API URL
              </label>
              <input
                type="text"
                value={apiConfig.backendUrl || ''}
                onChange={(e) => setApiConfig({ ...apiConfig, backendUrl: e.target.value })}
                placeholder="e.g. http://localhost:8000 or https://api.anvil.study"
                className={`w-full p-2 rounded-md font-mono text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                    : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                }`}
                style={{ outlineColor: accentColor }}
              />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-[#73767C]' : 'text-[#6B7280]'}`}>
                FastAPI / server endpoint for AI question synthesis and resume parsing.
              </p>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                AI Service API Key (Optional)
              </label>
              <input
                type="password"
                value={apiConfig.apiKey || ''}
                onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                placeholder="Bearer token or API key"
                className={`w-full p-2 rounded-md font-mono text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                    : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                }`}
                style={{ outlineColor: accentColor }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Notes / Question Modal */}
      <Modal
        isOpen={showAddNotesModal}
        onClose={() => setShowAddNotesModal(false)}
        title={
          mode === 'reading'
            ? 'Add Study Note'
            : mode === 'interview'
            ? 'Add Practice Question'
            : 'Add Notes Source'
        }
        description={
          mode === 'reading'
            ? 'Create personal study notes or summaries from your reading.'
            : mode === 'interview'
            ? 'Add technical or practice interview questions to your repository.'
            : 'Create personal study notes or connect an external repository feed.'
        }
        footer={
          activeNotesTab === 'create' || mode !== 'exam' ? (
            <>
              <button
                onClick={() => setShowAddNotesModal(false)}
                className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
                  isDark ? 'text-[#A7A9AD] hover:bg-[#17191C]' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNoteSource}
                disabled={isSavingNote || !newNoteTitle.trim()}
                style={{ backgroundColor: accentColor, color: contrastText }}
                className="px-3.5 py-1.5 text-xs font-bold disabled:opacity-50 rounded shadow-subtle flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Repository</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAddNotesModal(false)}
                className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
                  isDark ? 'text-[#A7A9AD] hover:bg-[#17191C]' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeed}
                disabled={!remoteFeedUrl.trim()}
                style={{ backgroundColor: accentColor, color: contrastText }}
                className="px-3.5 py-1.5 text-xs font-bold disabled:opacity-50 rounded shadow-subtle flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Connect Source</span>
              </button>
            </>
          )
        }
      >
        <div className="space-y-3 text-xs">
          {mode === 'exam' && (
            <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-[#111315] border-[#292C30]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
              <button
                onClick={() => setActiveNotesTab('create')}
                style={activeNotesTab === 'create' ? { color: accentColor, borderColor: `${accentColor}40` } : undefined}
                className={`flex-1 py-1 text-xs font-semibold rounded ${
                  activeNotesTab === 'create'
                    ? isDark ? 'bg-[#17191C] border' : 'bg-[#FFFFFF] border shadow-xs'
                    : isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'
                }`}
              >
                Personal Study Note
              </button>
              <button
                onClick={() => setActiveNotesTab('feed')}
                style={activeNotesTab === 'feed' ? { color: accentColor, borderColor: `${accentColor}40` } : undefined}
                className={`flex-1 py-1 text-xs font-semibold rounded ${
                  activeNotesTab === 'feed'
                    ? isDark ? 'bg-[#17191C] border' : 'bg-[#FFFFFF] border shadow-xs'
                    : isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'
                }`}
              >
                Connect Repository Feed
              </button>
            </div>
          )}

          {activeNotesTab === 'create' || mode !== 'exam' ? (
            <div className="space-y-2.5">
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                  {mode === 'interview' ? 'Question Title' : 'Note Title'}
                </label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder={
                    mode === 'reading'
                      ? 'e.g. Key Takeaways: Quantum Computing Basics'
                      : mode === 'interview'
                      ? 'e.g. Implement LRU Cache with O(1) ops'
                      : 'e.g. Operating Systems: Process Scheduling'
                  }
                  className={`w-full p-2 rounded-md text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                      : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                  }`}
                  style={{ outlineColor: accentColor }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                    Subject / Category
                  </label>
                  <input
                    type="text"
                    value={newNoteSubject}
                    onChange={(e) => setNewNoteSubject(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className={`w-full p-2 rounded-md text-xs focus:outline-none border ${
                      isDark
                        ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                        : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                    }`}
                    style={{ outlineColor: accentColor }}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                    Topic Tag
                  </label>
                  <input
                    type="text"
                    value={newNoteTopic}
                    onChange={(e) => setNewNoteTopic(e.target.value)}
                    placeholder="e.g. CPU Scheduling"
                    className={`w-full p-2 rounded-md text-xs focus:outline-none border ${
                      isDark
                        ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                        : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                    }`}
                    style={{ outlineColor: accentColor }}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                  {mode === 'interview' ? 'Question Prompt / Scenario' : 'Summary / Content'}
                </label>
                <textarea
                  value={newNoteSummary}
                  onChange={(e) => setNewNoteSummary(e.target.value)}
                  placeholder="Enter detailed content..."
                  rows={3}
                  className={`w-full p-2 rounded-md text-xs focus:outline-none resize-none border ${
                    isDark
                      ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                      : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                  }`}
                  style={{ outlineColor: accentColor }}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                  {mode === 'interview' ? 'Hint / Rubrics' : 'Key Takeaways (one per line)'}
                </label>
                <textarea
                  value={newNotePoints}
                  onChange={(e) => setNewNotePoints(e.target.value)}
                  placeholder="Key point 1&#10;Key point 2"
                  rows={2}
                  className={`w-full p-2 rounded-md text-xs focus:outline-none resize-none border ${
                    isDark
                      ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                      : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                  }`}
                  style={{ outlineColor: accentColor }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
                  Remote JSON / REST Feed URL
                </label>
                <input
                  type="url"
                  value={remoteFeedUrl}
                  onChange={(e) => setRemoteFeedUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../notes.json"
                  className={`w-full p-2 rounded-md text-xs font-mono focus:outline-none border ${
                    isDark
                      ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                      : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
                  }`}
                  style={{ outlineColor: accentColor }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>



      {/* Progress & Stats Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Learning Progress & Insights"
        description="Track your study streaks, cards reviewed, and interview performance."
      >
        <Progress />
      </Modal>

      {/* Help & Shortcuts Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Anvil Guide & Shortcuts"
        description="Get the most out of Anvil Learning Assistant."
      >
        <div className="space-y-3 text-xs">
          <div className={`p-3 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB]'}`}>
            <div className="font-bold flex items-center gap-1.5" style={{ color: accentColor }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Two-Tier Operating Model</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
              This Full Side Panel provides your home navigation surface. When you choose a mode (Reading, Exam, or Interview), the corresponding floating rail activates directly on the webpage for in-context focus without blocking your view.
            </p>
          </div>

          <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#17191C] border-[#292C30]' : 'bg-[#FFFFFF] border-[#E5E7EB]'}`}>
            <div className={`font-bold ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>Keyboard Shortcuts</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}>Focus Search</span>
                <kbd className={`px-1.5 py-0.5 rounded border font-mono ${isDark ? 'bg-[#111315] border-[#292C30] text-[#F5F5F4]' : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#111827]'}`}>
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}>Close Modals</span>
                <kbd className={`px-1.5 py-0.5 rounded border font-mono ${isDark ? 'bg-[#111315] border-[#292C30] text-[#F5F5F4]' : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#111827]'}`}>
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Learner Profile"
        description="Update your display name."
        footer={
          <>
            <button
              onClick={() => setShowProfileModal(false)}
              className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
                isDark ? 'text-[#A7A9AD] hover:bg-[#17191C]' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={!tempUserName.trim()}
              style={{ backgroundColor: accentColor, color: contrastText }}
              className="px-3.5 py-1.5 text-xs font-bold rounded shadow-subtle flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Name</span>
            </button>
          </>
        }
      >
        <div className="space-y-2.5 text-xs">
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#4B5563]'}`}>
              Your Display Name
            </label>
            <input
              type="text"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              placeholder="e.g. Mayuresh or Anvil Scholar"
              className={`w-full p-2 rounded-md text-xs focus:outline-none border ${
                isDark
                  ? 'bg-[#17191C] border-[#292C30] text-[#F5F5F4] placeholder:text-[#73767C]'
                  : 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827] placeholder:text-[#9CA3AF]'
              }`}
              style={{ outlineColor: accentColor }}
            />
            <p className={`text-[10px] mt-1 ${isDark ? 'text-[#73767C]' : 'text-[#6B7280]'}`}>
              Used strictly for your local profile display. No academic or institutional tracking.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
