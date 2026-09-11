import React, { useState } from 'react';
import {
  Lock,
  RotateCw,
  Sparkles,
  FileText,
  Languages,
  Volume2,
  Check,
  Bookmark,
  ArrowRight,
  HelpCircle,
  ArrowLeft,
  Star,
  Puzzle,
  Highlighter,
  BookOpen,
  Layers,
  VolumeX,
  X,
  Plus
} from 'lucide-react';

export const BrowserMockup: React.FC = () => {
  const [activeAction, setActiveAction] = useState<'explain' | 'summarize' | 'translate' | 'read' | null>('explain');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedCard, setSavedCard] = useState(false);

  const handleActionClick = (action: 'explain' | 'summarize' | 'translate' | 'read') => {
    setActiveAction(action);
    if (action === 'read') {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const handleSaveFlashcard = () => {
    setSavedCard(true);
    setTimeout(() => setSavedCard(false), 2500);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto lg:max-w-none">
      {/* Ambient warm coral backlight under the window */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-[#FF6B5A]/25 via-[#FF6B5A]/15 to-transparent rounded-3xl blur-2xl opacity-75 pointer-events-none" />

      {/* Main Browser Window Frame with perspective tilt */}
      <div className="relative rounded-2xl border border-[#2A2A2A] bg-[#141414] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-xl">
        
        {/* Top Browser Chrome Bar */}
        <div className="bg-[#1C1C1C] border-b border-[#2A2A2A] px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex flex-col gap-2 select-none">
          {/* Row 1: Traffic lights & Tab */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {/* Traffic lights */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block shadow-xs" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block shadow-xs" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block shadow-xs" />
              </div>

              {/* Active Tab */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#141414] border-t border-x border-[#2A2A2A] rounded-t-lg px-2 sm:px-3 py-1 text-xs text-[#F5F5F5] font-medium shadow-xs min-w-0">
                <div className="w-3.5 h-3.5 rounded-sm bg-[#FF6B5A]/20 flex items-center justify-center shrink-0">
                  <FileText className="w-2.5 h-2.5 text-[#FF6B5A]" />
                </div>
                <span className="text-xs truncate max-w-[70px] sm:max-w-none">Article</span>
                <X className="w-3 h-3 text-[#737373] hover:text-[#F5F5F5] cursor-pointer ml-1 shrink-0" />
              </div>

              {/* New Tab Button */}
              <button
                type="button"
                className="w-5 h-5 rounded hover:bg-[#2A2A2A] flex items-center justify-center text-[#737373] hover:text-[#F5F5F5] transition shrink-0"
                title="New Tab"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Top right chrome utilities */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-[#737373] shrink-0">
              <Puzzle className="w-3.5 h-3.5 hover:text-[#F5F5F5] cursor-pointer" />
              <div className="w-4 h-4 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[9px] text-[#A7A7A7] font-bold">
                A
              </div>
            </div>
          </div>

          {/* Row 2: Navigation controls & URL bar */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex items-center space-x-1 text-[#737373] shrink-0">
              <ArrowLeft className="w-3.5 h-3.5 hover:text-[#F5F5F5] cursor-pointer" />
              <ArrowRight className="w-3.5 h-3.5 hover:text-[#F5F5F5] cursor-pointer" />
              <RotateCw className="w-3 h-3 hover:text-[#F5F5F5] cursor-pointer ml-0.5" />
            </div>

            {/* URL input bar */}
            <div className="min-w-0 flex-1 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 sm:space-x-2 truncate min-w-0">
                <Lock className="w-3 h-3 text-[#27C93F] shrink-0" />
                <span className="text-[#A7A7A7] font-mono text-[10px] sm:text-[11px] truncate">
                  https://example.com
                </span>
              </div>
              <Star className="w-3 h-3 text-[#737373] hover:text-[#FFBD2E] transition cursor-pointer shrink-0 ml-1" />
            </div>
          </div>
        </div>

        {/* Browser Page Body */}
        <div className="flex bg-[#141414] min-h-[340px] sm:min-h-[360px] relative w-full overflow-hidden">
          
          {/* Main Article Content (Left) */}
          <div className="flex-1 p-3.5 sm:p-5 md:p-8 relative min-w-0">
            {/* Article Headline */}
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#F5F5F5] tracking-tight mb-3 sm:mb-4">
              The Power of Consistency
            </h3>

            {/* Article Paragraph */}
            <div className="text-xs sm:text-sm md:text-[15px] leading-relaxed text-[#A7A7A7] space-y-3 sm:space-y-4">
              <p>
                Small, consistent efforts compound into extraordinary results over time. It's not about doing everything at once, but about{' '}
                {/* Active Highlight in Blue with pill styling */}
                <span className="relative inline-block bg-[#2563EB]/25 text-[#F5F5F5] font-medium px-1.5 py-0.5 rounded border-b-2 border-[#38BDF8]">
                  showing up regularly
                </span>
                {', '}even in the smallest ways.
              </p>

              {/* Floating Action Pill Toolbar (Docked right below highlight) */}
              <div className="pt-2 max-w-full overflow-x-auto no-scrollbar py-1">
                <div className="inline-flex items-center gap-1 bg-[#1C1C1C] border border-[#2E2E2E] shadow-xl shadow-black/60 rounded-full p-1 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => handleActionClick('explain')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeAction === 'explain'
                        ? 'bg-[#FF6B5A] text-[#111111] font-semibold shadow-xs'
                        : 'text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#262626]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>Explain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionClick('summarize')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeAction === 'summarize'
                        ? 'bg-[#FF6B5A] text-[#111111] font-semibold shadow-xs'
                        : 'text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#262626]'
                    }`}
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>Summarize</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionClick('translate')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeAction === 'translate'
                        ? 'bg-[#FF6B5A] text-[#111111] font-semibold shadow-xs'
                        : 'text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#262626]'
                    }`}
                  >
                    <Languages className="w-3 h-3 shrink-0" />
                    <span>Translate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionClick('read')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeAction === 'read'
                        ? 'bg-[#FF6B5A] text-[#111111] font-semibold shadow-xs'
                        : 'text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#262626]'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <VolumeX className="w-3 h-3 text-[#111111] animate-pulse shrink-0" />
                    ) : (
                      <Volume2 className="w-3 h-3 shrink-0" />
                    )}
                    <span>Read Aloud</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Drawer/Card beneath toolbar */}
              {activeAction && (
                <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-[#1B1B1B] border border-[#2A2A2A] shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6B5A] truncate">
                      {activeAction === 'explain' && <Sparkles className="w-3.5 h-3.5 shrink-0" />}
                      {activeAction === 'summarize' && <FileText className="w-3.5 h-3.5 shrink-0" />}
                      {activeAction === 'translate' && <Languages className="w-3.5 h-3.5 shrink-0" />}
                      {activeAction === 'read' && <Volume2 className="w-3.5 h-3.5 shrink-0" />}
                      <span className="capitalize truncate">{activeAction} Mode</span>
                    </div>
                    <span className="text-[10px] text-[#737373] font-mono shrink-0 hidden sm:inline">Press Alt+A</span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-[#CCCCCC] leading-relaxed">
                    {activeAction === 'explain' && (
                      <>
                        <strong className="text-[#F5F5F5]">Habit Formation:</strong> Repeating an action creates stronger neural connections. The brain conserves energy by automating recurring behaviors into effortless daily routines.
                      </>
                    )}
                    {activeAction === 'summarize' && (
                      <>
                        <strong className="text-[#F5F5F5]">Summary:</strong> Consistency beats intensity. Micro-actions performed daily produce exponential knowledge compounding.
                      </>
                    )}
                    {activeAction === 'translate' && (
                      <>
                        <strong className="text-[#F5F5F5]">Spanish:</strong> "Aparecer con regularidad" — La persistencia cotidiana genera resultados acumulativos sin fatiga mental.
                      </>
                    )}
                    {activeAction === 'read' && (
                      <>
                        <strong className="text-[#F5F5F5]">TTS Player:</strong> Speed: 1.0x — "showing up regularly, even in the smallest ways..."
                      </>
                    )}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#262626] flex items-center justify-between text-[11px] gap-2">
                    <button
                      type="button"
                      onClick={handleSaveFlashcard}
                      className="flex items-center gap-1 text-[#A7A7A7] hover:text-[#FF6B5A] transition cursor-pointer truncate"
                    >
                      {savedCard ? <Check className="w-3 h-3 text-[#27C93F] shrink-0" /> : <Bookmark className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{savedCard ? 'Card Added to Deck!' : 'Save Flashcard'}</span>
                    </button>
                    <div className="flex items-center gap-1 text-[#737373] shrink-0">
                      <HelpCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">Auto-synced</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsed Rail (Right Edge of Browser Window - compact on mobile, expanded on desktop) */}
          <aside className="w-11 sm:w-12 md:w-32 bg-[#181818] border-l border-[#262626] p-2 sm:p-2.5 md:p-3 flex flex-col justify-between select-none shrink-0 transition-all">
            <div className="space-y-2.5 sm:space-y-3">
              {/* Rail Brand Emblem */}
              <div className="flex items-center justify-center pb-1">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#1E1E1E] border border-[#FF6B5A]/40 p-1 flex items-center justify-center shadow-xs">
                  <img src="/icons/a-logo.png" alt="Anvil" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Vertical Menu Items */}
              <nav className="space-y-1 text-xs">
                <div className="flex items-center justify-center md:justify-start gap-2 px-1 md:px-2 py-1.5 rounded-md hover:bg-[#222222] text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer" title="AI Summary">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B5A] shrink-0" />
                  <span className="hidden md:inline truncate text-[11px]">AI Summary</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 px-1 md:px-2 py-1.5 rounded-md hover:bg-[#222222] text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer" title="Annotate">
                  <Highlighter className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span className="hidden md:inline truncate text-[11px]">Annotate</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 px-1 md:px-2 py-1.5 rounded-md hover:bg-[#222222] text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer" title="Read Aloud">
                  <Volume2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span className="hidden md:inline truncate text-[11px]">Read Aloud</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 px-1 md:px-2 py-1.5 rounded-md hover:bg-[#222222] text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer" title="Meaning">
                  <BookOpen className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span className="hidden md:inline truncate text-[11px]">Meaning</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 px-1 md:px-2 py-1.5 rounded-md hover:bg-[#222222] text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer" title="Translate">
                  <Languages className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                  <span className="hidden md:inline truncate text-[11px]">Translate</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 px-1 md:px-2 py-1.5 rounded-md hover:bg-[#222222] text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer" title="Flashcards">
                  <Layers className="w-3.5 h-3.5 text-[#FF6B5A] shrink-0" />
                  <span className="hidden md:inline truncate text-[11px]">Flashcards</span>
                </div>
              </nav>
            </div>

            {/* Bottom Arrow Button */}
            <div className="pt-2 border-t border-[#262626] flex justify-center">
              <button
                type="button"
                className="w-6 h-6 rounded-full bg-[#262626] hover:bg-[#FF6B5A] hover:text-[#111111] text-[#A7A7A7] flex items-center justify-center transition cursor-pointer"
                title="Expand Anvil Rail"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mascot & Handwritten Callout Annotation (matching reference) */}
      <div className="relative mt-2 flex items-center justify-end pr-2 md:pr-4 pointer-events-none select-none">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Handwritten Coral Text with Curved Arrow */}
          <div className="text-right">
            <p className="font-handwritten text-base sm:text-xl md:text-2xl text-[#FF6B5A] font-bold tracking-wide leading-tight">
              Your<br />
              AI study<br />
              companion<br />
              in the browser.
            </p>
            <div className="flex justify-end pr-2 sm:pr-3 pt-0.5 text-[#FF6B5A]">
              {/* Hand-drawn curving arrow pointing to the mascot */}
              <svg
                className="w-5 h-5 sm:w-7 sm:h-7 transform -rotate-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12c-4 0-8 2-10 7" />
                <polyline points="12 19 9 19 9 16" />
              </svg>
            </div>
          </div>

          {/* 3D Cute Mascot Character */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 shrink-0 animate-float">
            <img
              src="/mascot.png"
              alt="Anvil Mascot"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(255,107,90,0.3)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
