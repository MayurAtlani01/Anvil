import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, FileSpreadsheet, Users, Sparkles, Layers, Volume2, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeature: (targetId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectFeature,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle handled by parent
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const features = [
    {
      id: 'reading',
      title: 'Reading Mode',
      category: 'Assistant Mode',
      desc: 'Smart summaries, dictionary definitions, and in-page highlighting.',
      icon: BookOpen,
      color: '#FF6B5A',
      sectionId: 'reading',
    },
    {
      id: 'exam',
      title: 'Exam Mode',
      category: 'Assistant Mode',
      desc: 'Previous Year Questions (PYQs), Formula Bank, and revision flashcards.',
      icon: FileSpreadsheet,
      color: '#38BDF8',
      sectionId: 'exam',
    },
    {
      id: 'interview',
      title: 'Interview Mode',
      category: 'Assistant Mode',
      desc: 'Interactive mock interviews, session runner, and resume matcher.',
      icon: Users,
      color: '#34D399',
      sectionId: 'interview',
    },
    {
      id: 'flashcards',
      title: 'SuperMemo SM-2 Flashcards',
      category: 'Core System',
      desc: 'Scientifically backed spaced repetition card review queue.',
      icon: Layers,
      color: '#FF6B5A',
      sectionId: 'features',
    },
    {
      id: 'tts',
      title: 'Text-to-Speech Player',
      category: 'Tooling',
      desc: 'Listen to any webpage with customizable speeds (0.8x - 1.5x).',
      icon: Volume2,
      color: '#38BDF8',
      sectionId: 'features',
    },
    {
      id: 'workflow',
      title: 'How It Works',
      category: 'Getting Started',
      desc: 'Install Anvil, open anywhere on the web, and choose your mode.',
      icon: Sparkles,
      color: '#FF6B5A',
      sectionId: 'how-it-works',
    },
  ];

  const filtered = features.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#171717] border border-[#2D2D2D] shadow-2xl overflow-hidden text-left">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#262626] bg-[#141414]">
          <Search className="w-5 h-5 text-[#A7A7A7] shrink-0" />
          <input
            type="text"
            placeholder="Search features, modes, shortcuts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-[#737373] hover:text-[#F5F5F5]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-[#222222] hover:bg-[#2C2C2C] text-[#A7A7A7] hover:text-[#F5F5F5] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectFeature(item.sectionId);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#222222] transition group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        border: `1px solid ${item.color}30`,
                      }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#F5F5F5] group-hover:text-[#FF6B5A] transition">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#111111] text-[#737373] border border-[#262626]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#A7A7A7] line-clamp-1 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#F5F5F5] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[#737373]">
              No features found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#121212] border-t border-[#262626] flex items-center justify-between text-[11px] text-[#737373]">
          <span>Tip: Press ESC to close</span>
          <span className="font-mono">Quick Spotlight</span>
        </div>

      </div>
    </div>
  );
};
