// src/components/sections/HeroSection.tsx
import React from 'react';
import { scrollToTarget } from '../../lib/scroll';
import { FORM } from '../../lib/store';
import { AeroCloudLogo } from '../AeroBrand';
import { MagnetButton } from '../Interactive';
import { SmokeInvertText } from '../SmokeInvertText';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="hero"
      data-scene
      data-form={FORM.HERO}
      data-theme="light"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 text-center select-none"
    >
      {/* Central Hero Cloud Logo */}
      <div className="w-full max-w-2xl mb-8 transform hover:scale-[1.02] transition-transform duration-700 ease-out">
        <AeroCloudLogo className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.18)]" />
      </div>

      {/* Main Tagline & Dynamic Smoke-Inverted Editorial Headline */}
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-neutral-500">
          LOW-PROFILE PERFORMANCE CLIENT
        </p>

        <div className="relative py-2">
          <SmokeInvertText
            as="h1"
            displacement={true}
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.88]"
          >
            <span className="block split-line">
              <span className="smoke-hover-word">ENGINEERED</span>
            </span>
            <span className="block split-line mt-1">
              <span className="smoke-hover-word">BEYOND</span>{' '}
              <span className="smoke-hover-word">LIMITS.</span>
            </span>
          </SmokeInvertText>
        </div>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-neutral-600 font-sans leading-relaxed pt-2">
          A modern, modular Minecraft client engineered for precision. Experience customizable combat assistance, low-profile ghost modules, and high-performance visual overlays in a clean monochromatic interface.
        </p>
      </div>

      {/* CTAs matching Vape.gg style */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        <MagnetButton
          onClick={() => scrollToTarget('#pricing')}
          className="w-full sm:w-auto px-8 py-4 bg-black text-white text-xs font-mono tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-xl"
        >
          Get AERO Client
        </MagnetButton>
        <MagnetButton
          onClick={() => scrollToTarget('#features')}
          className="w-full sm:w-auto px-8 py-4 bg-transparent text-black text-xs font-mono tracking-[0.2em] uppercase border border-black/20 hover:border-black transition-colors"
        >
          Explore Modules
        </MagnetButton>
      </div>
    </section>
  );
};
