import React from 'react';
import { MousePointerClick, LayoutGrid } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Install Anvil',
      desc: 'Add the extension to Chrome in one click.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FFFFFF" fillOpacity="0.25" />
          <path
            d="M12 2C7.03 2 2.9 5.66 2.12 10.41L7.54 19.8C6.59 17.65 6.46 15.11 7.42 12.8C8.5 10.18 10.96 8.35 13.82 8.05L12 2Z"
            fill="#EA4335"
          />
          <path
            d="M12 2C15.35 2 18.3 3.65 20.08 6.18L14.66 15.57C14.73 14.73 14.54 13.87 14.1 13.1C13.02 11.23 10.99 10.05 8.81 10.05H12V2Z"
            fill="#FBBC05"
          />
          <path
            d="M12 22C16.97 22 21.1 18.34 21.88 13.59L16.46 4.2C17.41 6.35 17.54 8.89 16.58 11.2C15.5 13.82 13.04 15.65 10.18 15.95L12 22Z"
            fill="#34A853"
          />
          <circle cx="12" cy="12" r="4.5" fill="#4285F4" />
          <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Open anywhere',
      desc: 'Use Anvil on any webpage you read, learn or practice on.',
      icon: <MousePointerClick className="w-6 h-6 text-[#FF6B5A]" />,
    },
    {
      num: '03',
      title: 'Choose your mode',
      desc: 'Switch between Reading, Exam or Interview — anytime.',
      icon: <LayoutGrid className="w-6 h-6 text-[#FF6B5A]" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="mb-16">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#737373] uppercase mb-3">
            HOW IT WORKS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#F5F5F5] tracking-tight leading-[1.1]">
            Get started <br />
            <span className="text-[#FF6B5A]">in minutes.</span>
          </h2>
        </div>

        {/* 3 Connected Step Nodes */}
        <div className="relative">
          {/* Subtle dotted connector line behind steps on desktop */}
          <div className="hidden md:block absolute top-1/2 left-16 right-16 h-[1px] border-t border-dashed border-[#2E2E2E] -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-4 p-4 rounded-xl bg-[#111111]/80 backdrop-blur-xs group transition-all"
              >
                {/* Large Number in Coral */}
                <span className="text-3xl font-extrabold text-[#FF6B5A] font-mono tracking-tight shrink-0 mt-1">
                  {step.num}
                </span>

                {/* Icon Container Squircle */}
                <div className="w-13 h-13 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center shrink-0 group-hover:border-[#FF6B5A]/50 transition-colors shadow-sm">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="space-y-1 pt-0.5">
                  <h3 className="text-base font-bold text-[#F5F5F5] tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#A7A7A7] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
