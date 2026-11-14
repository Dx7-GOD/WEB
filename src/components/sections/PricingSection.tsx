// src/components/sections/PricingSection.tsx
// Monochromatic membership & client distribution section with direct executable download.
import React, { useState, useRef } from 'react';
import { FORM, device } from '../../lib/store';
import { MagnetButton } from '../Interactive';
import { SmokeInvertText } from '../SmokeInvertText';
import { AERO_DOWNLOAD_CONFIG } from '../../config/download';

export const PricingSection: React.FC = () => {
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50 });
  const tacticalCardRef = useRef<HTMLDivElement | null>(null);

  const handleTacticalDownload = (e: React.MouseEvent) => {
    e.preventDefault();

    // Trigger direct browser file download of AERO executable
    const link = document.createElement('a');
    link.href = AERO_DOWNLOAD_CONFIG.url;
    link.setAttribute('download', AERO_DOWNLOAD_CONFIG.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Visual confirmation toast
    setDownloadToast('AERO CLIENT DOWNLOAD STARTED.');
    setTimeout(() => {
      setDownloadToast(null);
    }, 4500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (device.coarse || !tacticalCardRef.current) return;
    const rect = tacticalCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -6;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 6;
    setTilt({ rx, ry, px, py });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, px: 50, py: 50 });
  };

  return (
    <section
      id="pricing"
      data-scene
      data-form={FORM.BURST}
      data-theme="light"
      className="relative min-h-[140vh] py-32 px-6 md:px-12 text-black flex flex-col justify-center"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 block mb-2">
            SECTION 06 &mdash; MEMBERSHIP &amp; ACCESS
          </span>
          <SmokeInvertText
            as="h2"
            displacement={true}
            className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-[0.9]"
          >
            <span className="block split-line">
              <span className="smoke-hover-word">ACQUIRE</span>
            </span>
            <span className="block split-line">
              <span className="smoke-hover-word">ACCESS.</span>
            </span>
          </SmokeInvertText>
          <p className="mt-4 text-sm text-neutral-600 font-sans max-w-xl mx-auto">
            Choose your access tier or download the flagship Tactical edition directly. Regular client updates, cloud profiles, and uncompromised precision across all tiers.
          </p>
        </div>

        {/* Global Download Toast Notification */}
        {downloadToast && (
          <div className="fixed bottom-8 right-8 z-50 bg-black text-white border border-white/40 px-6 py-4 shadow-2xl flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
            <div className="font-mono text-xs tracking-wider">
              <span className="text-neutral-400">[RELEASE: {AERO_DOWNLOAD_CONFIG.version}]</span>{' '}
              <span className="font-bold text-white">{downloadToast}</span>
            </div>
            <button
              onClick={() => setDownloadToast(null)}
              className="text-neutral-400 hover:text-white font-mono text-xs ml-4"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        )}

        {/* Pricing & Access Tier Grid: LEFT = OPERATOR | CENTRE = TACTICAL (FEATURED) | RIGHT = LIFETIME */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* CARD 1 (LEFT): OPERATOR */}
          <div className="lg:col-span-4 smoke-card border border-black/20 p-8 flex flex-col justify-between bg-white/70 backdrop-blur-md hover:border-black transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs tracking-widest text-neutral-500">TIER 01 / QUARTERLY</span>
                <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">TIER 01</span>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight mt-1 mb-2">OPERATOR</h3>
              <p className="text-xs text-neutral-600 mb-6 font-mono leading-relaxed">
                Full-spectrum operational tier engineered for continuous competitive execution.
              </p>

              <div className="text-4xl font-mono font-bold tracking-tight mb-6 pb-6 border-b border-black/10">
                $75 <span className="text-xs font-normal text-neutral-500 tracking-wider">/ 3 MONTHS</span>
              </div>

              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
                  INCLUDED CAPABILITIES
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-neutral-700">
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Complete Module Suite</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Advanced Spline Aim Interpolation</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Full Ghost &amp; Velocity Settings</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Unlimited Cloud &amp; Local Profiles</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Version Compatibility Support</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Aim Assistance Customization</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Reach Configuration</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Visual ESP &amp; Player Overlays</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Inventory Management</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Custom Keybind Management</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Priority Discord &amp; Community Support</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-black/10">
              <MagnetButton className="w-full py-4 border border-black/30 font-mono text-xs uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all text-center block font-bold">
                SELECT OPERATOR
              </MagnetButton>
              <div className="text-center font-mono text-[10px] text-neutral-400 mt-2 uppercase tracking-wider">
                AUTO-RENEWS EVERY 90 DAYS · CANCEL ANYTIME
              </div>
            </div>
          </div>

          {/* CARD 2 (CENTRE, FEATURED): TACTICAL ($0 / FREE FOREVER) */}
          <div
            ref={tacticalCardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: tilt.rx === 0 ? 'transform 0.5s ease-out' : 'none',
            }}
            className="lg:col-span-4 relative smoke-card border-2 border-black bg-black text-white p-8 md:p-9 flex flex-col justify-between shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] md:-translate-y-4 z-10 overflow-hidden"
          >
            {/* Top Badge: MOST POPULAR */}
            <div className="absolute top-0 right-0 bg-white text-black px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase font-black shadow-md">
              MOST POPULAR
            </div>

            {/* Specular Glare Reflection */}
            <div
              className="pointer-events-none absolute inset-0 opacity-15 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 320px at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.4), transparent 70%)`,
              }}
            />

            {/* Ambient Corner Monochromatic Smoke Accent */}
            <div className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-3xl" />

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-mono text-xs tracking-widest text-neutral-400">PRIMARY DISTRIBUTION</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>

              <h3 className="text-4xl font-black uppercase tracking-tight mt-1 mb-2 text-white">TACTICAL</h3>
              <p className="text-xs text-neutral-400 mb-6 font-mono leading-relaxed">
                The primary AERO client installation. Zero cost, complete combat &amp; visual module registry, zero compromises.
              </p>

              {/* Price: $0 / FREE FOREVER */}
              <div className="mb-6 pb-6 border-b border-white/20 flex items-baseline justify-between">
                <div>
                  <span className="text-5xl font-mono font-black tracking-tight text-white">$0</span>
                  <span className="ml-3 font-mono text-xs tracking-[0.2em] uppercase text-neutral-300 font-semibold">
                    FREE FOREVER
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-white/30 text-neutral-300">
                  WINDOWS x64
                </span>
              </div>

              {/* Comprehensive Feature List (All 18 Items) */}
              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3 flex items-center justify-between">
                  <span>ALL TACTICAL CAPABILITIES</span>
                  <span className="text-neutral-500">18 MODULES</span>
                </div>
                <ul className="space-y-2 font-mono text-xs text-neutral-200">
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Complete Core Module Suite</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Combat Module Configuration</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Aim Assistance Customization</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Click Automation Settings</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Velocity Customization</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Reach Configuration</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Visual ESP &amp; Player Overlays</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Customizable HUD &amp; Interface</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Movement Customization</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Inventory Management</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Sprint Configuration</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Custom Keybind Management</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Local Configuration Profiles</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Cloud Profile Synchronization</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Performance-Optimized Client Interface</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Customizable Settings</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Full Minecraft Version Compatibility</li>
                  <li className="flex items-start"><span className="mr-2 text-white font-bold">+</span> Regular Client Updates</li>
                </ul>
              </div>
            </div>

            {/* Tactical Direct Download CTA Button */}
            <div className="pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={handleTacticalDownload}
                className="w-full py-4.5 bg-white text-black font-mono text-sm uppercase tracking-widest font-black hover:bg-neutral-200 transition-all flex items-center justify-center space-x-2 group cursor-pointer shadow-lg active:scale-[0.98]"
              >
                <span>DOWNLOAD AERO</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
              </button>
              
              <div className="text-center font-mono text-[11px] text-white/90 mt-2.5 font-bold uppercase tracking-widest">
                FREE DOWNLOAD · WINDOWS
              </div>
              <div className="text-center font-mono text-[9px] text-neutral-400 mt-1 uppercase tracking-wider">
                BUILD 2.8.4 · STANDALONE .EXE · NO INSTALLER REQUIRED
              </div>
            </div>
          </div>

          {/* CARD 3 (RIGHT): LIFETIME */}
          <div className="lg:col-span-4 smoke-card border border-black/20 p-8 flex flex-col justify-between bg-white/70 backdrop-blur-md hover:border-black transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs tracking-widest text-neutral-500">TIER 03 / PERPETUAL</span>
                <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">TIER 03</span>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight mt-1 mb-2">LIFETIME</h3>
              <p className="text-xs text-neutral-600 mb-6 font-mono leading-relaxed">
                One-time perpetual license with permanent access to current and upcoming module generations.
              </p>

              <div className="text-4xl font-mono font-bold tracking-tight mb-6 pb-6 border-b border-black/10">
                $180 <span className="text-xs font-normal text-neutral-500 tracking-wider">/ ONCE</span>
              </div>

              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
                  INCLUDED CAPABILITIES
                </div>
                <ul className="space-y-2.5 font-mono text-xs text-neutral-700">
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Permanent Client License</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> All Current &amp; Future Modules</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Priority Profile Cloud Backup</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Early Access Beta Builds</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> VIP Community Role &amp; Channel</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Direct Developer Feedback Access</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Lifetime Updates &amp; Maintenance</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Unrestricted Module Presets</li>
                  <li className="flex items-start"><span className="mr-2 text-black font-bold">+</span> Zero Subscription Fees</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-black/10">
              <MagnetButton className="w-full py-4 border border-black/30 font-mono text-xs uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all text-center block font-bold">
                SELECT LIFETIME
              </MagnetButton>
              <div className="text-center font-mono text-[10px] text-neutral-400 mt-2 uppercase tracking-wider">
                ONE-TIME PAYMENT · INSTANT KEY DISPATCH
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Technical Spec strip */}
        <div className="mt-16 pt-8 border-t border-black/10 flex flex-wrap items-center justify-between font-mono text-[10px] text-neutral-500 gap-4">
          <div>CLIENT DIRECT DOWNLOAD: {AERO_DOWNLOAD_CONFIG.filename}</div>
          <div>PLATFORM: {AERO_DOWNLOAD_CONFIG.platform}</div>
          <div>HASH: {AERO_DOWNLOAD_CONFIG.hash}</div>
        </div>
      </div>
    </section>
  );
};
