// src/components/sections/TunnelSection.tsx
import React from 'react';
import { FORM } from '../../lib/store';
import { SmokeInvertText } from '../SmokeInvertText';

export const TunnelSection: React.FC = () => {
  return (
    <section
      id="tunnel"
      data-scene
      data-form={FORM.TUNNEL}
      data-theme="light"
      className="relative min-h-[140vh] flex flex-col justify-center px-6 md:px-16 py-28 text-black"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 block mb-2">
            SECTION 02 &mdash; CORE CAPABILITIES
          </span>
          <SmokeInvertText
            as="h2"
            displacement={true}
            className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.84]"
          >
            <span className="block split-line">
              <span className="smoke-hover-word">DESIGNED</span> <span className="smoke-hover-word">FOR</span>
            </span>
            <span className="block split-line">
              <span className="smoke-hover-word">PRECISION.</span>
            </span>
          </SmokeInvertText>
        </div>

        {/* 3-column brutalist data grid focusing on real product capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black/15 bg-white/40 backdrop-blur-sm mt-16">
          <div className="smoke-card p-8 md:p-10 border-b md:border-b-0 md:border-r border-black/15 flex flex-col justify-between h-72">
            <span className="font-mono text-sm tracking-widest text-neutral-400">01 / COMBAT</span>
            <div>
              <h3 className="text-2xl font-bold uppercase mb-2">TARGET ASSISTANCE</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Fine-tuned aim assist, algorithmic click randomization, and horizontal/vertical velocity adjustment designed to emulate authentic mouse movement.
              </p>
            </div>
          </div>

          <div className="smoke-card p-8 md:p-10 border-b md:border-b-0 md:border-r border-black/15 flex flex-col justify-between h-72 bg-black text-white">
            <span className="font-mono text-sm tracking-widest text-neutral-500">02 / GHOST INTEGRATION</span>
            <div>
              <h3 className="text-2xl font-bold uppercase mb-2">LOW-PROFILE EXECUTION</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Configurable module thresholds, minimal visual interference, and clean overlay rendering to keep your gameplay natural and responsive.
              </p>
            </div>
          </div>

          <div className="smoke-card p-8 md:p-10 flex flex-col justify-between h-72">
            <span className="font-mono text-sm tracking-widest text-neutral-400">03 / UTILITY</span>
            <div>
              <h3 className="text-2xl font-bold uppercase mb-2">PROFILE MANAGEMENT</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Comprehensive configuration profiles with instant hotkey switching, custom keybind binds, and seamless configuration sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
