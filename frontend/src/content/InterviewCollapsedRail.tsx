import React, { useState } from 'react';
import {
  ListOrdered,
  FileText,
  BarChart3,
  Bookmark,
  User,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export type InterviewFeatureId =
  | 'rounds'
  | 'resume'
  | 'stats'
  | 'bookmarks'
  | 'mock';

interface FeatureItem {
  id: InterviewFeatureId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'rounds',
    label: 'Interview Rounds',
    subtitle: 'DSA, System Design & Core',
    icon: ListOrdered,
  },
  {
    id: 'resume',
    label: 'Resume Analyzer',
    subtitle: 'Upload & match qualifications',
    icon: FileText,
  },
  {
    id: 'stats',
    label: 'Improvement Stats',
    subtitle: 'Track practice logs & scores',
    icon: BarChart3,
  },
  {
    id: 'bookmarks',
    label: 'Bookmarked Questions',
    subtitle: 'Saved interview questions',
    icon: Bookmark,
  },
  {
    id: 'mock',
    label: 'Mock Interview',
    subtitle: 'AI answer analysis',
    icon: User,
  },
];

interface InterviewCollapsedRailProps {
  activeFeature: InterviewFeatureId | null;
  onToggleFeature: (id: InterviewFeatureId) => void;
  onExpandDashboard: () => void;
  isSidePanelOpen?: boolean;
  onCycleMode?: () => void;
  nextModeName?: string;
  accentColor?: string;
}

export const InterviewCollapsedRail: React.FC<InterviewCollapsedRailProps> = ({
  activeFeature,
  onToggleFeature,
  onExpandDashboard,
  isSidePanelOpen = false,
  onCycleMode,
  nextModeName = 'Exam Mode',
  accentColor = '#38BDF8',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className="anvil-collapsed-rail"
      onMouseDown={(e) => e.stopPropagation()}
      aria-label="Anvil Interview Mode Quick Feature Rail"
    >
      {/* 1. TOP ANVIL LOGO EMBLEM */}
      <button
        type="button"
        className="anvil-rail-logo"
        onMouseEnter={() => setHoveredId('logo')}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCycleMode?.();
        }}
        title={`Anvil Interview Mode • Click 'A' to switch to ${nextModeName}`}
        aria-label={`Current: Interview Mode. Click to switch to ${nextModeName}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        >
          <path d="M4 18L12 6L20 18" />
        </svg>

        {hoveredId === 'logo' && (
          <div className="anvil-rail-tooltip" style={{ minWidth: '175px' }}>
            <div className="anvil-tooltip-title" style={{ color: accentColor }}>Interview Mode Active</div>
            <div className="anvil-tooltip-subtitle" style={{ fontWeight: 600 }}>
              Click 'A' ➔ {nextModeName}
            </div>
          </div>
        )}
      </button>

      {/* Subtle Divider */}
      <div className="anvil-rail-divider" />

      {/* 2. FEATURE ICONS */}
      {FEATURES.map((feature) => {
        const IconComponent = feature.icon;
        const isActive = activeFeature === feature.id;
        const isHovered = hoveredId === feature.id;

        return (
          <div
            key={feature.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredId(feature.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              type="button"
              onClick={() => onToggleFeature(feature.id)}
              className={`anvil-rail-btn ${isActive ? 'anvil-rail-btn-active' : ''}`}
              title={feature.label}
              aria-pressed={isActive}
            >
              <IconComponent style={{ width: 20, height: 20 }} />
            </button>

            {/* Feature Tooltip */}
            {isHovered && (
              <div className="anvil-rail-tooltip">
                <div className="anvil-tooltip-title">{feature.label}</div>
                <div className="anvil-tooltip-subtitle">{feature.subtitle}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Subtle Divider */}
      <div className="anvil-rail-divider" />

      {/* 3. EXPAND / COLLAPSE BUTTON */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setHoveredId('expand')}
        onMouseLeave={() => setHoveredId(null)}
      >
        <button
          type="button"
          onClick={onExpandDashboard}
          className={`anvil-rail-btn anvil-rail-expand-btn ${isSidePanelOpen ? 'anvil-rail-btn-active' : ''}`}
          title={isSidePanelOpen ? 'Close Side Panel' : 'Expand Dashboard'}
          aria-label={isSidePanelOpen ? 'Close Side Panel' : 'Expand Full Interview Dashboard'}
        >
          {isSidePanelOpen ? (
            <ArrowLeft style={{ width: 20, height: 20 }} />
          ) : (
            <ArrowRight style={{ width: 20, height: 20 }} />
          )}
        </button>

        {hoveredId === 'expand' && (
          <div className="anvil-rail-tooltip">
            <div className="anvil-tooltip-title">{isSidePanelOpen ? 'Collapse' : 'Expand'}</div>
            <div className="anvil-tooltip-subtitle">{isSidePanelOpen ? 'Close side panel' : 'Open full dashboard'}</div>
          </div>
        )}
      </div>
    </div>
  );
};
