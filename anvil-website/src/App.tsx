import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ThreeModes } from './components/ThreeModes';
import { HowItWorks } from './components/HowItWorks';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { GetAnvilModal } from './components/GetAnvilModal';
import { SearchModal } from './components/SearchModal';

export const App: React.FC = () => {
  const [isGetAnvilOpen, setIsGetAnvilOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSeeHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectFeatureSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] selection:bg-[#FF6B5A]/25 selection:text-[#FF6B5A] relative">
      {/* Top Fixed Header Navbar */}
      <Navbar
        onGetAnvil={() => setIsGetAnvilOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Page Flow */}
      <main>
        {/* 1. Hero Section with 3D Browser Mockup & Mascot */}
        <Hero
          onGetAnvil={() => setIsGetAnvilOpen(true)}
          onSeeHowItWorks={handleSeeHowItWorks}
        />

        {/* 2. Three Modes Section (Reading, Exam, Interview) */}
        <ThreeModes
          onSelectMode={(modeId) => handleSelectFeatureSection(modeId)}
        />

        {/* 3. How It Works (01, 02, 03 Connected Steps) */}
        <HowItWorks />

        {/* 4. Final CTA Section with Card, Mascot, and Stylized Watermark */}
        <FinalCTA
          onGetAnvil={() => setIsGetAnvilOpen(true)}
        />
      </main>

      {/* 5. Minimal Footer */}
      <Footer />

      {/* Modals */}
      <GetAnvilModal
        isOpen={isGetAnvilOpen}
        onClose={() => setIsGetAnvilOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectFeature={handleSelectFeatureSection}
      />
    </div>
  );
};

export default App;
