import React, { useState, useEffect } from 'react';
import { Search, Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  onGetAnvil: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onGetAnvil, onOpenSearch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#111111]/90 backdrop-blur-md border-b border-[#222222] py-3.5 shadow-lg shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Brand Logo & Wordmark */}
        <a href="#" className="flex items-center gap-3 group focus:outline-none select-none">
          <div className="w-8 h-8 rounded-lg bg-[#1D1D1D] border border-[#2A2A2A] p-1 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
            <img
              src="/icons/a-logo.png"
              alt="Anvil Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-lg tracking-[0.15em] text-[#F5F5F5] uppercase">
            Anvil
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A7A7A7]">
          <a
            href="#features"
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Features
          </a>
          <a
            href="#reading"
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Reading
          </a>
          <a
            href="#exam"
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Exam
          </a>
          <a
            href="#interview"
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Interview
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#F5F5F5] transition-colors"
          >
            How it works
          </a>
        </nav>

        {/* Right Actions: Search & Get Anvil */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search features"
            title="Search (Ctrl+K)"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#1D1D1D] border border-transparent hover:border-[#2A2A2A] transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onGetAnvil}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#FF6B5A] hover:bg-[#FF7A6A] active:bg-[#FF5A48] text-[#111111] font-bold text-sm transition-all duration-200 shadow-coral hover:shadow-coralGlow hover:-translate-y-0.5 cursor-pointer"
          >
            {/* Chrome Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
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
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 rounded-lg bg-[#1D1D1D] border border-[#2A2A2A] flex items-center justify-center text-[#F5F5F5] cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#161616] border-b border-[#2A2A2A] px-6 py-6 space-y-4 animate-in fade-in duration-200">
          <nav className="flex flex-col gap-3.5 text-base font-medium text-[#A7A7A7]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#F5F5F5] py-1"
            >
              Features
            </a>
            <a
              href="#reading"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#F5F5F5] py-1"
            >
              Reading
            </a>
            <a
              href="#exam"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#F5F5F5] py-1"
            >
              Exam
            </a>
            <a
              href="#interview"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#F5F5F5] py-1"
            >
              Interview
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#F5F5F5] py-1"
            >
              How it works
            </a>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="w-full py-2.5 rounded-full bg-[#202020] text-[#A7A7A7] text-sm flex items-center justify-center gap-2 border border-[#2D2D2D]"
            >
              <Search className="w-4 h-4" />
              <span>Search features</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onGetAnvil();
              }}
              className="w-full py-3 rounded-full bg-[#FF6B5A] text-[#111111] font-bold text-sm flex items-center justify-center gap-2 shadow-coral"
            >
              <span>Get Anvil</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
