// src/components/sections/SpecificationsSection.tsx
// Comprehensive Minecraft Client Interface modeled directly after the user's reference mockup.
import React, { useState } from 'react';
import { FORM } from '../../lib/store';
import { AeroWordmark } from '../AeroBrand';
import { SmokeInvertText } from '../SmokeInvertText';

export const SpecificationsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'combat' | 'ghost' | 'visuals' | 'movement' | 'utility'>('combat');

  // Interactive state for modules inside the console
  const [aimFov, setAimFov] = useState(65);
  const [aimSpeed, setAimSpeed] = useState(4.2);
  const [cpsMin, setCpsMin] = useState(10);
  const [cpsMax, setCpsMax] = useState(14);
  const [veloH, setVeloH] = useState(80);
  const [veloV, setVeloV] = useState(100);
  const [reach, setReach] = useState(3.18);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    aimAssist: true,
    autoClicker: true,
    velocity: true,
    reachToggle: true,
    esp: true,
    chams: true,
    hud: true,
    keepsprint: true,
    cleaner: true,
    autoArmor: true,
    cloudSync: true,
  });

  const toggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section
      id="specifications"
      data-scene
      data-form={FORM.HAZE}
      data-theme="light"
      className="relative min-h-[140vh] py-32 px-6 md:px-16 text-black flex flex-col justify-center"
    >
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-16">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 block mb-2">
            SECTION 05 &mdash; CLIENT INTERFACE &amp; CONTROLS
          </span>
          <SmokeInvertText
            as="h2"
            displacement={true}
            className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-[0.9]"
          >
            <span className="block split-line">
              <span className="smoke-hover-word">AERO</span> <span className="smoke-hover-word">CLIENT</span>
            </span>
            <span className="block split-line">
              <span className="smoke-hover-word">CONSOLE.</span>
            </span>
          </SmokeInvertText>
        </div>

        {/* Client Window replicating the exact UI in the user's screenshot */}
        <div className="border border-black/30 bg-[#0c0c0c] text-white shadow-2xl overflow-hidden rounded-sm">
          {/* Window Header */}
          <div className="bg-[#181818] px-6 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="font-mono text-xs text-neutral-300 ml-4 tracking-widest">
                AERO_CLIENT_V2.8.EXE
              </span>
            </div>
            <div className="font-mono text-[10px] text-neutral-400 tracking-wider">
              PROFILE: COMPETITIVE_RANKED [ACTIVE]
            </div>
          </div>

          {/* Client Body */}
          <div className="p-6 md:p-10">
            {/* Category Navigation Tabs */}
            <div className="flex flex-wrap border-b border-white/15 pb-4 mb-8 gap-4 sm:gap-8 font-mono text-xs tracking-widest uppercase">
              <button
                onClick={() => setActiveTab('combat')}
                className={`transition-colors ${
                  activeTab === 'combat' ? 'text-white border-b-2 border-white pb-4 -mb-4 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                01. COMBAT
              </button>
              <button
                onClick={() => setActiveTab('ghost')}
                className={`transition-colors ${
                  activeTab === 'ghost' ? 'text-white border-b-2 border-white pb-4 -mb-4 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                02. GHOST / LEGIT
              </button>
              <button
                onClick={() => setActiveTab('visuals')}
                className={`transition-colors ${
                  activeTab === 'visuals' ? 'text-white border-b-2 border-white pb-4 -mb-4 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                03. VISUALS
              </button>
              <button
                onClick={() => setActiveTab('movement')}
                className={`transition-colors ${
                  activeTab === 'movement' ? 'text-white border-b-2 border-white pb-4 -mb-4 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                04. MOVEMENT
              </button>
              <button
                onClick={() => setActiveTab('utility')}
                className={`transition-colors ${
                  activeTab === 'utility' ? 'text-white border-b-2 border-white pb-4 -mb-4 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                05. PROFILES &amp; UTILITY
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'combat' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                {/* Aim Assist Card */}
                <div className="p-5 border border-white/10 bg-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">AIM ASSIST</span>
                    <button
                      onClick={() => toggle('aimAssist')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.aimAssist ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.aimAssist ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Maximum Angle (FOV)</span>
                      <span>{aimFov}&deg;</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      value={aimFov}
                      onChange={(e) => setAimFov(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Smoothing Factor</span>
                      <span>{aimSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.1}
                      value={aimSpeed}
                      onChange={(e) => setAimSpeed(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Auto Clicker Card */}
                <div className="p-5 border border-white/10 bg-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">AUTO CLICKER</span>
                    <button
                      onClick={() => toggle('autoClicker')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.autoClicker ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.autoClicker ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Min CPS</span>
                      <span>{cpsMin} CPS</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={14}
                      value={cpsMin}
                      onChange={(e) => setCpsMin(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Max CPS</span>
                      <span>{cpsMax} CPS</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={20}
                      value={cpsMax}
                      onChange={(e) => setCpsMax(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Velocity Card */}
                <div className="p-5 border border-white/10 bg-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">VELOCITY REDUCTION</span>
                    <button
                      onClick={() => toggle('velocity')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.velocity ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.velocity ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Horizontal Knockback</span>
                      <span>{veloH}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={veloH}
                      onChange={(e) => setVeloH(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Vertical Knockback</span>
                      <span>{veloV}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={veloV}
                      onChange={(e) => setVeloV(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reach Card */}
                <div className="p-5 border border-white/10 bg-white/5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">REACH EXTENSION</span>
                    <button
                      onClick={() => toggle('reachToggle')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.reachToggle ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.reachToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Combat Distance</span>
                      <span>{reach.toFixed(2)} blocks</span>
                    </div>
                    <input
                      type="range"
                      min={3.0}
                      max={3.4}
                      step={0.01}
                      value={reach}
                      onChange={(e) => setReach(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-neutral-800 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-2">
                    <span>Only While Sprinting</span>
                    <span className="text-white">ENABLED</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ghost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="font-bold pb-2 border-b border-white/10">NATURAL AIM INTERPOLATION</div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Employs bezier spline trajectories rather than rigid point-to-point locking. Adjusts target lead dynamically based on target velocity.
                  </p>
                  <div className="text-[11px] text-neutral-500 pt-2">MODE: HUMAN_BEZIER_INTERPOLATION</div>
                </div>
                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="font-bold pb-2 border-b border-white/10">CLICK TIMING JITTER</div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Normal distribution curve applied to inter-click milliseconds. Simulates genuine human muscular fatigue over extended engagements.
                  </p>
                  <div className="text-[11px] text-neutral-500 pt-2">VARIANCE: GAUSSIAN_SIGMA_0.28</div>
                </div>
              </div>
            )}

            {activeTab === 'visuals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">PLAYER CHAMS &amp; ESP</span>
                    <button
                      onClick={() => toggle('chams')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.chams ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.chams ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Bounding Box Style</span>
                    <span className="text-white">2D MONOCHROME</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Occlusion Masking</span>
                    <span className="text-white">GPU_CULLING</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Health Bar Indicator</span>
                    <span className="text-white">SHOWN</span>
                  </div>
                </div>

                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">HUD OVERLAY DESIGNER</span>
                    <button
                      onClick={() => toggle('hud')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.hud ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.hud ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Active CPS Counter</span>
                    <span className="text-white">TOP_LEFT</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Coordinates &amp; Direction</span>
                    <span className="text-white">MINIMAL</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Armor Durability Gauge</span>
                    <span className="text-white">ACTIVE</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'movement' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">KEEPSPRINT</span>
                    <button
                      onClick={() => toggle('keepsprint')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.keepsprint ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.keepsprint ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Prevents packet sprint reset upon damaging an opponent, allowing fluid movement and consistent combo maintenance.
                  </p>
                </div>

                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">FASTPLACE</span>
                    <span className="text-white bg-neutral-800 px-2 py-0.5">DELAY: 1 TICK</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Eliminates the default 4-tick right-click delay for blocks and projectiles for rapid building and water-bucket placements.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'utility' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">INVENTORY MANAGER &amp; CLEANER</span>
                    <button
                      onClick={() => toggle('cleaner')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.cleaner ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.cleaner ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Automated item sorting, hotbar positioning, and junk dumping when opening chest or player inventory screens.
                  </p>
                </div>

                <div className="p-5 border border-white/10 bg-white/5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold">PROFILE EXPORT &amp; SYNC</span>
                    <button
                      onClick={() => toggle('cloudSync')}
                      className={`px-2 py-0.5 text-[10px] ${toggles.cloudSync ? 'bg-white text-black' : 'border border-white/30 text-neutral-400'}`}
                    >
                      {toggles.cloudSync ? 'CLOUD ON' : 'LOCAL ONLY'}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    Export and import your module configurations via one-click text string or JSON. Bind distinct profiles to custom hotkeys.
                  </p>
                </div>
              </div>
            )}

            {/* Console Footer */}
            <div className="mt-10 flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-white/10 gap-4">
              <div className="flex items-center gap-3">
                <AeroWordmark className="h-5 w-auto" fill="#ffffff" />
                <span className="font-mono text-[10px] text-neutral-400">
                  MINECRAFT 1.7.10 / 1.8.9 / 1.12.2 / MODERN
                </span>
              </div>
              <button
                onClick={() => alert('AERO configuration exported to clipboard.')}
                className="px-6 py-2.5 bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors font-bold"
              >
                SAVE &amp; EXPORT PROFILE
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
