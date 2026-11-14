// src/components/sections/FinalCtaSection.tsx
// Final dramatic composition: AERO logo emerging from a massive smoke formation,
// "EXPERIENCE AERO" headline, prominent Get Started button, and minimal footer.
import React from 'react';
import { scrollToTarget } from '../../lib/scroll';
import { FORM } from '../../lib/store';
import { AeroCloudLogo, AeroWordmark } from '../AeroBrand';
import { MagnetButton } from '../Interactive';
import { SmokeInvertText } from '../SmokeInvertText';

export const FinalCtaSection: React.FC = () => {
  return (
    <section
      id="final"
      data-scene
      data-form={FORM.FINAL}
      data-theme="light"
      className="relative min-h-[140vh] flex flex-col justify-between pt-32 pb-12 px-6 md:px-16 text-black select-none"
    >
      {/* Central Dramatic Reveal */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full text-center">
        <div className="w-full max-w-xl mb-12 transform hover:scale-105 transition-transform duration-700">
          <AeroCloudLogo className="w-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.25)]" />
        </div>

        <span className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 block mb-3">
          FINAL VERDICT
        </span>
        <SmokeInvertText
          as="h2"
          displacement={true}
          className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8"
        >
          <span className="block split-line">
            <span className="smoke-hover-word">EXPERIENCE</span>
          </span>
          <span className="block split-line">
            <span className="smoke-hover-word">AERO.</span>
          </span>
        </SmokeInvertText>
        <p className="max-w-lg text-sm sm:text-base text-neutral-600 mb-10 leading-relaxed font-sans">
          A new benchmark in modular Minecraft performance. Low-profile assistance, comprehensive module customization, and effortless execution.
        </p>

        <MagnetButton
          onClick={() => scrollToTarget('#pricing')}
          className="px-10 py-5 bg-black text-white text-xs font-mono tracking-[0.25em] uppercase hover:bg-neutral-800 transition-all shadow-2xl"
        >
          Get Started Now
        </MagnetButton>
      </div>

      {/* Vape.gg style minimal footer */}
      <footer className="w-full max-w-7xl mx-auto pt-24 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-8 text-neutral-500 font-mono text-xs">
        <div className="flex items-center gap-4">
          <AeroWordmark className="h-5 w-auto" fill="#000000" />
          <span className="tracking-widest">&copy; {new Date().getFullYear()} AERO TECHNOLOGIES INC.</span>
        </div>

        <div className="flex flex-wrap gap-6 tracking-wider uppercase">
          <button onClick={() => scrollToTarget('#hero')} className="hover:text-black transition-colors">
            Overview
          </button>
          <button onClick={() => scrollToTarget('#features')} className="hover:text-black transition-colors">
            Features
          </button>
          <button onClick={() => scrollToTarget('#specifications')} className="hover:text-black transition-colors">
            Specifications
          </button>
          <button onClick={() => scrollToTarget('#pricing')} className="hover:text-black transition-colors">
            Pricing
          </button>
          <a href="#privacy" className="hover:text-black transition-colors">
            Privacy
          </a>
          <a href="#terms" className="hover:text-black transition-colors">
            Terms
          </a>
        </div>

        <div className="text-[11px] tracking-widest text-neutral-400">
          DESIGNED FOR SUPREMACY
        </div>
      </footer>
    </section>
  );
};
