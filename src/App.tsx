// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { CustomCursor } from './components/Interactive';
import { IntroLoader } from './components/IntroLoader';
import { Navigation } from './components/Navigation';
import { ArchitectureSection } from './components/sections/ArchitectureSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { FinalCtaSection } from './components/sections/FinalCtaSection';
import { HeroSection } from './components/sections/HeroSection';
import { PricingSection } from './components/sections/PricingSection';
import { ShowcaseSection } from './components/sections/ShowcaseSection';
import { SpecificationsSection } from './components/sections/SpecificationsSection';
import { TunnelSection } from './components/sections/TunnelSection';
import { initScroll, measure } from './lib/scroll';
import { SmokeCanvas } from './three/SmokeCanvas';

export const App: React.FC = () => {
  const bgRef = useRef<HTMLDivElement | null>(null);
  const [, setLoaded] = useState(false);

  useEffect(() => {
    if (bgRef.current) {
      initScroll(bgRef.current);
    }
  }, []);

  const handleLoaded = () => {
    setLoaded(true);
    setTimeout(() => {
      measure();
    }, 100);
  };

  return (
    <div className="relative min-h-screen selection:bg-black selection:text-white">
      {/* Background tone interpolator */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-colors duration-300"
        style={{ backgroundColor: '#ffffff', zIndex: -10 }}
      />

      {/* Grain overlay */}
      <div className="grain" aria-hidden="true" />

      {/* 3D Smoke & Particle Engine */}
      <SmokeCanvas />

      {/* Intro sequence loader */}
      <IntroLoader onComplete={handleLoaded} />

      {/* Navigation */}
      <Navigation />

      {/* Custom magnetic cursor */}
      <CustomCursor />

      {/* Scrollable Page Experience */}
      <main className="relative w-full">
        <HeroSection />
        <TunnelSection />
        <ArchitectureSection />
        <ShowcaseSection />
        <FeaturesSection />
        <SpecificationsSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
    </div>
  );
};
