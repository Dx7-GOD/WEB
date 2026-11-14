// src/components/IntroLoader.tsx
// Sophisticated monochromatic terminal/console-style client boot sequence.
// Completely replaces the old centered logo/smoke card with a developer console.
import React, { useEffect, useRef, useState } from 'react';
import { lockScroll } from '../lib/scroll';
import { device, scene } from '../lib/store';
import { AeroWordmark } from './AeroBrand';

interface IntroLoaderProps {
  onComplete: () => void;
}

interface BootStage {
  tag: string;
  text: string;
  duration?: number;
}

const BOOT_STAGES: BootStage[] = [
  { tag: 'BOOT', text: 'Initializing AERO Client v2.8.4...', duration: 140 },
  { tag: 'CORE', text: 'Loading client environment [React 19 / Vite]...', duration: 120 },
  { tag: 'RENDER', text: 'Compiling WebGL shaders & procedural smoke pipeline...', duration: 220 },
  { tag: 'FONTS', text: 'Verifying typographic assets [Silkscreen / Archivo / Mono]...', duration: 160 },
  { tag: 'MODULES', text: 'Registering module matrix [Combat / Visuals / Movement / Utility]...', duration: 180 },
  { tag: 'CONFIG', text: 'Loading competitive profile: COMPETITIVE_RANKED.json...', duration: 140 },
  { tag: 'UI', text: 'Synchronizing hardware difference compositor & viewport buffers...', duration: 160 },
  { tag: 'SYSTEM', text: 'All subsystems verified. SYSTEM ENVIRONMENT READY.', duration: 200 },
];

export const IntroLoader: React.FC<IntroLoaderProps> = ({ onComplete }) => {
  const [completedLines, setCompletedLines] = useState<number>(0);
  const [activeText, setActiveText] = useState<string>('');
  const [status, setStatus] = useState<'INITIALIZING' | 'READY'>('INITIALIZING');
  const [showWelcome, setShowWelcome] = useState(false);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const termBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check if user already booted this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('aero_booted') === 'true') {
      scene.intro = 1;
      setDone(true);
      onComplete();
      return;
    }

    lockScroll(true);

    if (device.reduced) {
      scene.intro = 1;
      lockScroll(false);
      setDone(true);
      sessionStorage.setItem('aero_booted', 'true');
      onComplete();
      return;
    }

    let isCancelled = false;

    const runBootSequence = async () => {
      // Small initial breathing pause
      await new Promise((r) => setTimeout(r, 120));

      for (let i = 0; i < BOOT_STAGES.length; i++) {
        if (isCancelled) return;
        const stage = BOOT_STAGES[i];

        // Typing effect for the active line
        const full = `[${stage.tag}] ${stage.text}`;
        for (let c = 1; c <= full.length; c += 2) {
          if (isCancelled) return;
          setActiveText(full.slice(0, c));
          await new Promise((r) => setTimeout(r, 6));
        }
        setActiveText(full);

        // Update global scene intro progress
        scene.intro = Math.min(1, (i + 1) / BOOT_STAGES.length);

        // Pause per stage
        const waitTime = stage.duration || 140;
        await new Promise((r) => setTimeout(r, waitTime));

        setCompletedLines(i + 1);
        setActiveText('');

        // Auto-scroll terminal output
        if (termBodyRef.current) {
          termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
        }
      }

      // Final readiness verification
      setStatus('READY');
      setShowWelcome(true);
      scene.intro = 1;

      // Brief cinematic pause before dissolving into the live site
      await new Promise((r) => setTimeout(r, 480));
      if (isCancelled) return;

      setFading(true);
      sessionStorage.setItem('aero_booted', 'true');

      await new Promise((r) => setTimeout(r, 650));
      if (isCancelled) return;

      setDone(true);
      lockScroll(false);
      onComplete();
    };

    runBootSequence();

    // Fallback safeguard so the console never hangs
    const fallback = setTimeout(() => {
      if (!done) {
        scene.intro = 1;
        setFading(true);
        setTimeout(() => {
          setDone(true);
          lockScroll(false);
          onComplete();
        }, 300);
      }
    }, 4500);

    return () => {
      isCancelled = true;
      clearTimeout(fallback);
      lockScroll(false);
    };
  }, [onComplete]);

  if (done) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070707] text-[#e0e0e0] font-mono transition-opacity duration-700 ease-out p-4 sm:p-8 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Terminal Scanlines Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 z-10"
      />

      {/* Main Terminal Window Frame */}
      <div className="relative z-20 w-full max-w-3xl border border-white/20 bg-[#0c0c0c] shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="bg-[#141414] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <span className="text-[11px] font-bold tracking-widest text-white ml-2">
              AERO CLIENT &mdash; CONSOLE BOOTLOADER
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-[10px] tracking-widest px-2 py-0.5 border ${
                status === 'READY'
                  ? 'border-white text-white bg-white/10'
                  : 'border-white/30 text-neutral-400'
              }`}
            >
              STATUS: {status}
            </span>
            <AeroWordmark className="h-3.5 w-auto" fill="#ffffff" />
          </div>
        </div>

        {/* System Info Banner */}
        <div className="bg-[#0f0f0f] px-6 py-3 border-b border-white/5 text-[10px] text-neutral-400 flex flex-wrap justify-between gap-2 uppercase tracking-wider">
          <span>ADVANCED CLIENT ENVIRONMENT</span>
          <span>BUILD: 2.8.4-RELEASE</span>
          <span>ARCH: X86_64 TRANSIENT</span>
        </div>

        {/* Terminal Output Log Body */}
        <div
          ref={termBodyRef}
          className="p-6 md:p-8 space-y-2 text-xs md:text-sm text-neutral-300 min-h-[300px] max-h-[440px] overflow-y-auto leading-relaxed"
        >
          {/* Subtle ASCII Header Accent */}
          <div className="text-[10px] leading-tight text-neutral-500 mb-4 select-none pb-3 border-b border-white/5">
            <pre className="font-mono">
{`   ___    ______ ____   ____ 
  /   |  / ____// __ \\ / __ \\
 / /| | / __/  / /_/ // / / /
/ ___ |/ /___ / _, _// /_/ / 
/_/  |_/_____//_/ |_|\\____/  `}
            </pre>
            <div className="mt-1 text-[9px] tracking-widest text-neutral-400">
              AERO &middot; ENGINEERED FOR PRECISION
            </div>
          </div>

          {/* Render Completed Stages */}
          {BOOT_STAGES.slice(0, completedLines).map((stage, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-white font-bold select-none">[✓]</span>
              <span className="text-neutral-500 select-none">[{stage.tag}]</span>
              <span className="text-neutral-200">{stage.text}</span>
            </div>
          ))}

          {/* Active Typing Line with Blinking Block Cursor */}
          {activeText && (
            <div className="flex items-start gap-2.5 text-white">
              <span className="text-neutral-400 font-bold select-none">[::]</span>
              <span>
                {activeText}
                <span className="inline-block w-2 h-4 bg-white ml-1.5 align-middle blink" />
              </span>
            </div>
          )}

          {/* Final Branded Welcome Message */}
          {showWelcome && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5 text-white">
              <div className="flex items-center gap-2 font-bold tracking-widest text-xs">
                <span>&gt;&gt;</span>
                <span>SYSTEM ENVIRONMENT READY.</span>
              </div>
              <div className="text-xs tracking-wider text-neutral-400 pl-4">
                WELCOME TO AERO. LAUNCHING VIEWPORT...
                <span className="inline-block w-2 h-3.5 bg-white ml-1 align-middle blink" />
              </div>
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-[#121212] px-6 py-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-500 tracking-wider">
          <span>PORT: 4173 // LOCALHOST</span>
          <span className="hidden sm:inline">COMPLETION: {completedLines} / {BOOT_STAGES.length} STAGES</span>
          <span>SESSION: {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>
    </div>
  );
};
