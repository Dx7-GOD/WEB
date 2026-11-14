// src/components/sections/ArchitectureSection.tsx
import React from 'react';
import { FORM } from '../../lib/store';
import { SmokeInvertText } from '../SmokeInvertText';

export const ArchitectureSection: React.FC = () => {
  return (
    <section
      id="architecture"
      data-scene
      data-form={FORM.RIVER}
      data-theme="dark"
      className="relative min-h-[140vh] flex flex-col justify-center px-6 md:px-16 py-32 text-white"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 block mb-2">
              SECTION 03 &mdash; CLIENT PHILOSOPHY
            </span>
            <SmokeInvertText
              as="h2"
              displacement={true}
              className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.88]"
            >
              <span className="block split-line">
                <span className="smoke-hover-word">LOW-PROFILE</span>
              </span>
              <span className="block split-line">
                <span className="smoke-hover-word">PHILOSOPHY.</span>
              </span>
            </SmokeInvertText>
          </div>
          <p className="max-w-sm text-xs font-mono tracking-wider text-neutral-400 leading-relaxed uppercase">
            [EXPERIENCE: UNINTRUSIVE]
            <br />
            [CONFIGURATION: FULLY_MODULAR]
            <br />
            [PERFORMANCE: HIGH_EFFICIENCY]
          </p>
        </div>

        {/* Feature Grid with high contrast borders focusing on client philosophy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="smoke-card border border-white/20 p-8 md:p-12 bg-black/60 backdrop-blur-md hover:border-white transition-colors duration-500">
            <span className="font-mono text-xs tracking-widest text-neutral-400 block mb-4">
              PHILOSOPHY 01 // DISCREET ASSISTANCE
            </span>
            <h3 className="text-3xl font-black uppercase mb-4 tracking-tight">
              CONFIGURABLE BEHAVIOR
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-sans">
              AERO is designed from the ground up for low-profile visual presentation. Each module features granular thresholds, angle bounds, and speed curves so your gameplay remains indistinguishable from natural mechanical skill.
            </p>
            <div className="h-[1px] w-full bg-white/10 mb-6" />
            <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
              <span>VISUAL IMPACT: ZERO CLUTTER</span>
              <span>BEHAVIOR: CUSTOMIZABLE</span>
            </div>
          </div>

          <div className="smoke-card border border-white/20 p-8 md:p-12 bg-black/60 backdrop-blur-md hover:border-white transition-colors duration-500">
            <span className="font-mono text-xs tracking-widest text-neutral-400 block mb-4">
              PHILOSOPHY 02 // PERFORMANCE INTEGRATION
            </span>
            <h3 className="text-3xl font-black uppercase mb-4 tracking-tight">
              PERFORMANCE-CONSCIOUS
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-sans">
              Engineered with a streamlined memory footprint and optimized rendering pipeline. AERO minimizes CPU overhead and maintains stable frame rates even during intensive multiplayer encounters.
            </p>
            <div className="h-[1px] w-full bg-white/10 mb-6" />
            <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
              <span>FRAME IMPACT: NEGLIGIBLE</span>
              <span>MEMORY USAGE: OPTIMIZED</span>
            </div>
          </div>
        </div>

        {/* Technical architecture banner */}
        <div className="mt-16 border-t border-b border-white/15 py-6 flex flex-wrap justify-between items-center font-mono text-xs text-neutral-400 gap-4">
          <div>CLIENT: AERO MODULAR v2.8</div>
          <div>INTERFACE: MONOCHROMATIC HUD</div>
          <div>PROFILES: CLOUD &amp; LOCAL</div>
          <div>STATUS: ACTIVE</div>
        </div>
      </div>
    </section>
  );
};
