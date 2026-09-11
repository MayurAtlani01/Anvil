import React from 'react';
import { BookOpen, Briefcase, GraduationCap, X, ArrowRight } from 'lucide-react';

import { getAccentGlow } from '@/utils/color';

export type ActiveMode = 'reading' | 'interview' | 'exam';

interface ModeSwitchToastProps {
  mode: ActiveMode;
  nextMode: ActiveMode;
  accentColor?: string;
  onClose?: () => void;
}

const MODE_CONFIGS: Record<
  ActiveMode,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    defaultAccentColor: string;
  }
> = {
  reading: {
    title: 'Reading Mode',
    description: 'AI Summary, Smart Read Aloud & Meaning Lookup',
    icon: BookOpen,
    defaultAccentColor: '#FF6845',
  },
  interview: {
    title: 'Interview Mode',
    description: 'DSA Rounds, Resume Matching & AI Mock Practice',
    icon: Briefcase,
    defaultAccentColor: '#38BDF8',
  },
  exam: {
    title: 'Exam Mode',
    description: 'Previous Year Questions, Formulas & Revision',
    icon: GraduationCap,
    defaultAccentColor: '#34D399',
  },
};

export const ModeSwitchToast: React.FC<ModeSwitchToastProps> = ({
  mode,
  nextMode,
  accentColor,
  onClose,
}) => {
  const currentConfig = MODE_CONFIGS[mode] || MODE_CONFIGS.reading;
  const nextConfig = MODE_CONFIGS[nextMode] || MODE_CONFIGS.interview;
  const IconComponent = currentConfig.icon;

  // Use user's chosen accent color if in reading mode or if provided
  const effectiveAccent = mode === 'reading' && accentColor ? accentColor : currentConfig.defaultAccentColor;
  const effectiveGlow = getAccentGlow(effectiveAccent, 0.28);

  return (
    <div
      className="anvil-mode-toast"
      role="status"
      aria-live="polite"
      style={{
        boxShadow: `0 16px 40px -4px rgba(0, 0, 0, 0.8), 0 0 20px -2px ${effectiveGlow}`,
        borderColor: 'rgba(255, 255, 255, 0.12)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Active Badge & Close */}
      <div className="anvil-mode-toast-header">
        <div
          className="anvil-mode-toast-badge"
          style={{
            color: effectiveAccent,
            borderColor: `${effectiveAccent}40`,
            backgroundColor: `${effectiveAccent}18`,
          }}
        >
          <span
            className="anvil-mode-toast-dot"
            style={{
              backgroundColor: effectiveAccent,
              boxShadow: `0 0 6px ${effectiveAccent}`,
            }}
          />
          MODE SWITCHED
        </div>

        {onClose && (
          <button
            type="button"
            className="anvil-mode-toast-close"
            onClick={onClose}
            aria-label="Dismiss toast"
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {/* Main Mode Info */}
      <div className="anvil-mode-toast-main">
        <div
          className="anvil-mode-toast-icon-wrap"
          style={{
            color: effectiveAccent,
            borderColor: `${effectiveAccent}30`,
            backgroundColor: `${effectiveAccent}12`,
          }}
        >
          <IconComponent style={{ width: 18, height: 18 }} />
        </div>

        <div className="anvil-mode-toast-info">
          <div className="anvil-mode-toast-title">{currentConfig.title}</div>
          <div className="anvil-mode-toast-desc">{currentConfig.description}</div>
        </div>
      </div>

      {/* Cycle Hint Footer */}
      <div className="anvil-mode-toast-hint">
        <span>Click <strong>'A'</strong> to switch to {nextConfig.title}</span>
        <ArrowRight style={{ width: 11, height: 11, opacity: 0.7 }} />
      </div>
    </div>
  );
};
