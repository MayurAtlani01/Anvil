import React from 'react';
import { BookOpen, MessageCircle, ArrowRight, Settings, Maximize2 } from 'lucide-react';
import { useModeStore } from '@/store/useModeStore';
import { useThemeStore } from '@/store/useThemeStore';
import { sendRuntimeMessage, sendActiveTabMessage } from '@/messaging/helpers';
import logoImg from '@/assets/logo.png';

type AppMode = 'reading' | 'exam' | 'interview';

async function getActiveWebTab(): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) return null;
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(tabs && tabs.length ? tabs[0] : null);
      });
    } catch {
      resolve(null);
    }
  });
}

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

export const PopupShell: React.FC = () => {
  const { setMode } = useModeStore();
  const { theme, accentColor } = useThemeStore();
  const isDark = theme === 'dark';
  const contrastText = getContrastTextColor(accentColor);

  const handleSelectMode = async (mode: AppMode) => {
    setMode(mode);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null) {
        await chrome.runtime.sendMessage({ type: 'ACTIVATE_MODE', mode, tabId: tab.id });
      }
    } catch (err) {
      console.error('Anvil: failed to activate mode', mode, err);
    } finally {
      window.close();
    }
  };

  const handleOpenFullPanel = async () => {
    const activeMode = useModeStore.getState().mode;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.sidePanel) {
      try {
        const activeTab = await getActiveWebTab();
        if (activeTab?.id) {
          await chrome.sidePanel.open({ tabId: activeTab.id } as any);
          window.close();
          return;
        }
      } catch (err) {
        console.debug('[Anvil Popup] Error opening side panel:', err);
      }
    }
    await sendRuntimeMessage({ type: 'OPEN_SIDE_PANEL', mode: activeMode });
  };

  const handleOpenSettings = async () => {
    setMode('reading', 'notes');
    await handleOpenFullPanel();
  };

  return (
    <div
      className={`w-[360px] p-5 font-sans select-none overflow-hidden box-border transition-colors duration-200 ${
        isDark ? 'bg-[#0D0F10] text-[#F5F5F4]' : 'bg-[#F4F5F7] text-[#111827]'
      }`}
    >
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h1 className={`font-extrabold text-[22px] tracking-tight leading-none ${isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'}`}>
            Anvil
          </h1>
          <p className={`text-xs font-medium leading-tight mt-1 ${isDark ? 'text-[#A7A9AD]' : 'text-[#6B7280]'}`}>
            Learning Assistant
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenSettings}
          title="Settings"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isDark
              ? 'text-[#73767C] hover:text-[#F5F5F4] hover:bg-[#1D2024]'
              : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 2. HERO MASCOT SHOWCASE */}
      <div className="flex flex-col items-center justify-center my-1 relative">
        <div className="relative flex items-center justify-center">
          {/* Accent warm base reflection */}
          <div
            className="absolute -bottom-1 w-28 h-3 blur-md rounded-full pointer-events-none opacity-30"
            style={{ backgroundColor: accentColor }}
          />
          <img
            src={logoImg}
            alt="Anvil Mascot"
            className="w-32 h-32 object-contain select-none pointer-events-none drop-shadow-xl z-10 transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>

        {/* Section Header */}
        <div className="text-center font-bold text-[11px] tracking-wider uppercase mt-1 mb-2 select-none text-[#73767C]">
          Select Study Mode
        </div>
      </div>

      {/* 3. THREE MODE SELECTOR CARDS */}
      <div className="space-y-2.5 mb-3.5">
        {/* MODE 1: READING MODE */}
        <div
          onClick={() => handleSelectMode('reading')}
          role="button"
          tabIndex={0}
          className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group hover:-translate-y-0.5 border ${
            isDark
              ? 'border-[#292C30] bg-[#17191C] hover:bg-[#1D2024]'
              : 'border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] shadow-xs'
          }`}
          style={{ borderColor: undefined }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl border shadow-inner flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}35`,
                color: accentColor,
              }}
            >
              <BookOpen className="w-5 h-5 fill-current/20" />
            </div>
            <span
              className={`text-base tracking-tight transition-colors font-semibold group-hover:font-bold ${
                isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'
              }`}
            >
              Reading Mode
            </span>
          </div>

          <ArrowRight
            className="w-5 h-5 transition-all duration-200 group-hover:translate-x-1 shrink-0"
            style={{ color: accentColor }}
          />
        </div>

        {/* MODE 2: EXAM MODE */}
        <div
          onClick={() => handleSelectMode('exam')}
          role="button"
          tabIndex={0}
          className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group hover:-translate-y-0.5 border ${
            isDark
              ? 'border-[#292C30] bg-[#17191C] hover:bg-[#1D2024]'
              : 'border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl border shadow-inner flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}35`,
                color: accentColor,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M7 8h10" />
                <path d="M7 12h10" />
                <path d="M7 16h6" />
              </svg>
            </div>
            <span
              className={`text-base tracking-tight transition-colors font-semibold group-hover:font-bold ${
                isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'
              }`}
            >
              Exam Mode
            </span>
          </div>

          <ArrowRight
            className="w-5 h-5 transition-all duration-200 group-hover:translate-x-1 shrink-0"
            style={{ color: accentColor }}
          />
        </div>

        {/* MODE 3: INTERVIEW MODE */}
        <div
          onClick={() => handleSelectMode('interview')}
          role="button"
          tabIndex={0}
          className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group hover:-translate-y-0.5 border ${
            isDark
              ? 'border-[#292C30] bg-[#17191C] hover:bg-[#1D2024]'
              : 'border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F9FAFB] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl border shadow-inner flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}35`,
                color: accentColor,
              }}
            >
              <MessageCircle className="w-5 h-5" />
            </div>
            <span
              className={`text-base tracking-tight transition-colors font-semibold group-hover:font-bold ${
                isDark ? 'text-[#F5F5F4]' : 'text-[#111827]'
              }`}
            >
              Interview Mode
            </span>
          </div>

          <ArrowRight
            className="w-5 h-5 transition-all duration-200 group-hover:translate-x-1 shrink-0"
            style={{ color: accentColor }}
          />
        </div>
      </div>

      {/* 4. SOLID LAUNCHER BUTTON: "Open Full Panel" */}
      <button
        type="button"
        onClick={handleOpenFullPanel}
        style={{
          backgroundColor: accentColor,
          color: contrastText,
        }}
        className="w-full mt-2 py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-between shadow-md transition-all duration-150 cursor-pointer active:scale-[0.99] group"
      >
        <Maximize2 className="w-5 h-5 shrink-0" />
        <span className="font-bold text-sm tracking-wide">Open Full Panel</span>
        <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
