import React, { useState } from 'react';
import { BookOpen, FileSpreadsheet, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface ThreeModesProps {
  onSelectMode?: (mode: string) => void;
}

export const ThreeModes: React.FC<ThreeModesProps> = ({ onSelectMode }) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const modes = [
    {
      id: 'reading',
      title: 'Reading Mode',
      accentColor: '#FF6B5A',
      accentBg: 'rgba(255, 107, 90, 0.12)',
      accentBorder: 'rgba(255, 107, 90, 0.3)',
      icon: BookOpen,
      description: 'Understand, annotate, and learn from any content on the web.',
      pills: ['AI Summary', 'Meaning', 'Translate', 'Read Aloud', 'Flashcards'],
    },
    {
      id: 'exam',
      title: 'Exam Mode',
      accentColor: '#38BDF8',
      accentBg: 'rgba(56, 189, 248, 0.12)',
      accentBorder: 'rgba(56, 189, 248, 0.3)',
      icon: FileSpreadsheet,
      description: 'Access PYQs, formulas, notes and more — right in your browser.',
      pills: ['PYQs', 'Formula Bank', 'Revision Notes', 'Search', 'Flashcards'],
    },
    {
      id: 'interview',
      title: 'Interview Mode',
      accentColor: '#34D399',
      accentBg: 'rgba(52, 211, 153, 0.12)',
      accentBorder: 'rgba(52, 211, 153, 0.3)',
      icon: Users,
      description: 'Practice, analyze and improve with AI-powered tools.',
      pills: ['Mock Interviews', 'Resume Analyzer', 'Interview Rounds', 'Improvement Stats'],
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header: Eyebrow + Split Headlines */}
        <div className="space-y-4 mb-16">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#737373] uppercase">
            THREE MODES. ONE EXTENSION.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-6">
              <h2 className="text-4xl md:text-5xl font-black text-[#F5F5F5] tracking-tight leading-[1.1]">
                Built for every <br />
                stage of <span className="text-[#FF6B5A]">your journey.</span>
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-[#A7A7A7] text-base md:text-lg leading-relaxed max-w-xl">
                Whether you're reading, preparing for exams, or getting interview-ready, Anvil gives you the right tools, right where you need them.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <div
                key={mode.id}
                id={mode.id}
                className="group relative rounded-2xl bg-[#171717] border border-[#262626] p-7 flex flex-col justify-between transition-all duration-300 hover:border-[#3A3A3A] hover:-translate-y-1 hover:shadow-2xl shadow-black/40"
              >
                {/* Top Row: Icon squircle + Circular Arrow */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: mode.accentBg,
                        border: `1px solid ${mode.accentBorder}`,
                        color: mode.accentColor,
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectMode && onSelectMode(mode.id)}
                      className="w-8 h-8 rounded-full bg-[#202020] border border-[#2D2D2D] flex items-center justify-center text-[#A7A7A7] group-hover:text-[#F5F5F5] group-hover:bg-[#2A2A2A] transition cursor-pointer"
                      aria-label={`Learn more about ${mode.title}`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-xl font-bold mb-2 tracking-tight transition-colors"
                    style={{ color: mode.accentColor }}
                  >
                    {mode.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#A7A7A7] leading-relaxed mb-6 font-normal">
                    {mode.description}
                  </p>
                </div>

                {/* Pills / Tags Section */}
                <div className="pt-4 border-t border-[#222222] flex flex-wrap gap-2">
                  {mode.pills.map((pill) => {
                    const isSelected = selectedTag === pill;
                    return (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setSelectedTag(isSelected ? null : pill)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#262626] text-[#F5F5F5] border-[#FF6B5A]'
                            : 'bg-[#1C1C1C] text-[#A7A7A7] border-[#262626] hover:text-[#F5F5F5] hover:border-[#333333]'
                        }`}
                      >
                        {pill}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Tag Feedback Toast */}
        {selectedTag && (
          <div className="mt-6 flex items-center justify-center animate-in fade-in duration-200">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F1F1F] border border-[#FF6B5A]/40 text-xs text-[#F5F5F5] shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-[#FF6B5A]" />
              <span>
                Feature highlighted: <strong className="text-[#FF6B5A]">{selectedTag}</strong> — available out of the box in the Anvil sidepanel and content overlay.
              </span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
