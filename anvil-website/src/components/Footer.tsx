import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1F1F1F] bg-[#111111] pt-12 pb-10 text-sm text-[#737373]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-10">
        
        {/* Top Row: Brand & Tagline on Left, Navigation in Middle, Socials on Right */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left: Logo + Brand + Tagline */}
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] p-1 flex items-center justify-center">
                <img
                  src="/icons/a-logo.png"
                  alt="Anvil Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base tracking-wider text-[#F5F5F5] uppercase">
                Anvil
              </span>
            </a>

            {/* Vertical Divider */}
            <div className="hidden sm:block w-[1px] h-4 bg-[#2C2C2C]" />

            <span className="text-xs text-[#737373] tracking-wide">
              Your learning partner. Everywhere.
            </span>
          </div>

          {/* Middle: Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#A7A7A7]">
            <a href="#features" className="hover:text-[#F5F5F5] transition-colors">
              Features
            </a>
            <a href="#reading" className="hover:text-[#F5F5F5] transition-colors">
              Reading
            </a>
            <a href="#exam" className="hover:text-[#F5F5F5] transition-colors">
              Exam
            </a>
            <a href="#interview" className="hover:text-[#F5F5F5] transition-colors">
              Interview
            </a>
            <a href="#how-it-works" className="hover:text-[#F5F5F5] transition-colors">
              How it works
            </a>
          </nav>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-4 text-[#A7A7A7]">
            {/* X / Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X (Twitter)"
              className="w-8 h-8 rounded-lg hover:bg-[#1C1C1C] border border-transparent hover:border-[#2A2A2A] flex items-center justify-center hover:text-[#F5F5F5] transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-lg hover:bg-[#1C1C1C] border border-transparent hover:border-[#2A2A2A] flex items-center justify-center hover:text-[#F5F5F5] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="w-8 h-8 rounded-lg hover:bg-[#1C1C1C] border border-transparent hover:border-[#2A2A2A] flex items-center justify-center hover:text-[#F5F5F5] transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Tag */}
        <div className="pt-6 border-t border-[#1F1F1F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#525252]">
          <p>© 2025 Anvil. All rights reserved.</p>
          <p className="font-medium text-[#737373]">Built for curious minds.</p>
        </div>

      </div>
    </footer>
  );
};
