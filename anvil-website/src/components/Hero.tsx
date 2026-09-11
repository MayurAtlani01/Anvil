import React from 'react';
import { ArrowRight, Play, ShieldCheck, Users } from 'lucide-react';
import { BrowserMockup } from './BrowserMockup';

interface HeroProps {
  onGetAnvil: () => void;
  onSeeHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetAnvil, onSeeHowItWorks }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle radial ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#FF6B5A]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call-to-Actions */}
          <div className="lg:col-span-5 space-y-8 text-left">
            {/* Eyebrow */}
            <div className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#A7A7A7] uppercase">
              READ &nbsp;|&nbsp; LEARN &nbsp;|&nbsp; PREPARE &nbsp;|&nbsp; GROW
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#F5F5F5] tracking-tight leading-[1.05]">
              Your browser. <br />
              <span className="text-[#FF6B5A]">Sharper.</span>
            </h1>

            {/* Description */}
            <p className="text-[#A7A7A7] text-base md:text-lg leading-relaxed max-w-lg font-normal">
              Anvil brings powerful learning tools directly into your browser — for reading, exam prep and interview practice.
              <span className="block mt-1 text-[#CCCCCC]">Where you learn, we work.</span>
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary: Get Anvil Coral Pill */}
              <button
                type="button"
                onClick={onGetAnvil}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#FF6B5A] hover:bg-[#FF7A6A] active:bg-[#FF5A48] text-[#111111] font-bold text-base transition-all duration-200 shadow-coral hover:shadow-coralGlow hover:-translate-y-0.5 cursor-pointer"
              >
                {/* Google Chrome Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
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
                <span>Get Anvil</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary: See How It Works Dark Pill */}
              <button
                type="button"
                onClick={onSeeHowItWorks}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#2E2E2E] text-[#F5F5F5] font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#FF6B5A]">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>See how it works</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-[#A7A7A7]">
              {/* Chrome Badge */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#A7A7A7" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3.5" fill="#A7A7A7" />
                </svg>
                <span>Works on Chrome</span>
              </div>

              {/* Free to Use Badge */}
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF6B5A]" />
                <span>Free to use</span>
              </div>

              {/* Built for Learners Badge */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6B5A]" />
                <span>Built for learners</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Browser Mockup + Mascot */}
          <div className="lg:col-span-7">
            <BrowserMockup />
          </div>

        </div>
      </div>
    </section>
  );
};
