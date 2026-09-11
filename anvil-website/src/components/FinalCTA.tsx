import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
  onGetAnvil: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onGetAnvil }) => {
  return (
    <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        
        {/* Main CTA Card Container */}
        <div className="relative rounded-3xl bg-[#161616] border border-[#2A2A2A] px-5 py-10 sm:px-8 sm:py-14 md:py-20 md:px-16 overflow-hidden shadow-2xl">
          
          {/* Ambient Warm Underglow within the card */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-[#FF6B5A]/15 blur-3xl rounded-full pointer-events-none" />

          {/* Right Background Graphic: Stylized Glowing Geometric 'A' Watermark */}
          <div className="absolute right-4 sm:right-8 md:right-16 bottom-0 w-48 sm:w-64 md:w-80 h-48 sm:h-64 md:h-80 opacity-20 sm:opacity-25 pointer-events-none select-none">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-[#FF6B5A]">
              <path
                d="M100 20 L180 180 H140 L100 90 L60 180 H20 Z"
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="100" cy="50" r="16" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
            
            {/* Left Column: Mascot + Handwritten Note */}
            <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left select-none">
              <div className="relative flex flex-col items-center lg:items-start">
                {/* Handwritten Callout */}
                <div className="mb-2">
                  <p className="font-handwritten text-lg sm:text-xl md:text-2xl text-[#FF6B5A] font-bold tracking-wide -rotate-3">
                    Same browser. <br />
                    A brighter you.
                  </p>
                  <div className="flex justify-center lg:justify-start pl-0 lg:pl-6 pt-1 text-[#FF6B5A]">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 transform rotate-45"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* 3D Mascot Image */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 animate-float">
                  <img
                    src="/mascot.png"
                    alt="Anvil Study Buddy"
                    className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(255,107,90,0.25)]"
                  />
                </div>
              </div>
            </div>

            {/* Center Column: Eyebrow, Main Headline, Subtitle, CTA Button */}
            <div className="lg:col-span-6 text-center space-y-4 sm:space-y-5">
              <div className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[#737373] uppercase">
                READY TO UPGRADE YOUR BROWSER?
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#F5F5F5] tracking-tight leading-tight">
                Make your browser <br />
                <span className="text-[#FF6B5A]">work smarter.</span>
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#A7A7A7] max-w-md mx-auto leading-relaxed">
                Get Anvil and turn the web into your learning space.
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onGetAnvil}
                  className="w-full sm:w-auto justify-center inline-flex items-center gap-3 px-7 sm:px-8 py-3.5 rounded-full bg-[#FF6B5A] hover:bg-[#FF7A6A] active:bg-[#FF5A48] text-[#111111] font-bold text-base transition-all duration-200 shadow-coral hover:shadow-coralGlow hover:-translate-y-0.5 cursor-pointer"
                >
                  {/* Google Chrome Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
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
                  <span>Get Anvil for Chrome</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Right Column: Handwritten Encouragement + Curved Arrow */}
            <div className="lg:col-span-3 hidden lg:flex flex-col items-end justify-center select-none pr-4">
              <div className="text-right">
                <p className="font-handwritten text-2xl text-[#FF6B5A] font-bold tracking-wide leading-snug rotate-2">
                  Read. <br />
                  Prepare. <br />
                  Grow. <br />
                  With Anvil.
                </p>
                <div className="flex justify-end pr-6 pt-1 text-[#FF6B5A]">
                  {/* Curved arrow pointing toward center CTA */}
                  <svg
                    className="w-10 h-10 transform rotate-180 scale-x-[-1]"
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
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
