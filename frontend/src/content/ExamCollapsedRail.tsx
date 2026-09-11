import React, { useState } from 'react';
import {
  FileText,
  Sigma,
  ScrollText,
  Search,
  Layers,
  BarChart2,
  PieChart,
  Bookmark,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export type ExamFeatureId =
  | 'pyqs'
  | 'formulas'
  | 'revision'
  | 'search'
  | 'flashcards'
  | 'frequent'
  | 'progress'
  | 'bookmarks';

interface FeatureItem {
  id: ExamFeatureId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'pyqs',
    label: 'Previous Year Questions',
    subtitle: 'Solve & review PYQs',
    icon: FileText,
  },
  {
    id: 'formulas',
    label: 'Formula Repository',
    subtitle: 'Equations & derivations',
    icon: Sigma,
  },
  {
    id: 'revision',
    label: 'Quick Revision Notes',
    subtitle: 'High-yield study notes',
    icon: ScrollText,
  },
  {
    id: 'search',
    label: 'Search',
    subtitle: 'Search questions & formulas',
    icon: Search,
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    subtitle: 'Review exam deck',
    icon: Layers,
  },
  {
    id: 'frequent',
    label: 'Frequently Asked',
    subtitle: 'High-yield topic radar',
    icon: BarChart2,
  },
  {
    id: 'progress',
    label: 'Progress Chart',
    subtitle: 'Track completion & mastery',
    icon: PieChart,
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    subtitle: 'Saved exam questions',
    icon: Bookmark,
  },
];

interface ExamCollapsedRailProps {
  activeFeature: ExamFeatureId | null;
  onToggleFeature: (id: ExamFeatureId) => void;
  onExpandDashboard: () => void;
  isSidePanelOpen?: boolean;
  onCycleMode?: () => void;
  nextModeName?: string;
  accentColor?: string;
}

export const ExamCollapsedRail: React.FC<ExamCollapsedRailProps> = ({
  activeFeature,
  onToggleFeature,
  onExpandDashboard,
  isSidePanelOpen = false,
  onCycleMode,
  nextModeName = 'Reading Mode',
  accentColor = '#34D399',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className="anvil-collapsed-rail"
      onMouseDown={(e) => e.stopPropagation()}
      aria-label="Anvil Exam Mode Quick Feature Rail"
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
        title={`Anvil Exam Mode • Click 'A' to switch to ${nextModeName}`}
        aria-label={`Current: Exam Mode. Click to switch to ${nextModeName}`}
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
            <div className="anvil-tooltip-title" style={{ color: accentColor }}>Exam Mode Active</div>
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
          aria-label={isSidePanelOpen ? 'Close Side Panel' : 'Expand Full Exam Dashboard'}
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
