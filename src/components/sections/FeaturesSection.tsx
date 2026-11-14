// src/components/sections/FeaturesSection.tsx
// Rich, alternating Minecraft client feature presentations modeled after Vape.gg.
import React from 'react';
import { FORM } from '../../lib/store';
import { ClientModuleCard } from '../ClientModuleCard';
import { SmokeInvertText } from '../SmokeInvertText';

export const FeaturesSection: React.FC = () => {
  return (
    <section
      id="features"
      data-scene
      data-form={FORM.FEATURES}
      data-theme="light"
      className="relative min-h-[160vh] py-32 px-6 md:px-16 text-black"
    >
      <div className="max-w-6xl mx-auto space-y-36">
        {/* Module 1: Combat & Target Assistance */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2 space-y-6">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
              MODULE CATEGORY 01 &mdash; COMBAT
            </span>
            <SmokeInvertText
              as="h3"
              displacement={true}
              className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[0.92]"
            >
              <span className="block split-line">
                <span className="smoke-hover-word">HUMANIZED</span> <span className="smoke-hover-word">COMBAT</span>
              </span>
              <span className="block split-line">
                <span className="smoke-hover-word">ASSISTANCE.</span>
              </span>
            </SmokeInvertText>
            <p className="text-sm text-neutral-600 leading-relaxed font-sans">
              Configurable targeting algorithms designed to assist your natural aim. Features multi-bone selection, adjustable FOV radial limits, and humanized click variance that seamlessly aligns with native mouse input.
            </p>
            <div className="grid grid-cols-2 gap-4 font-mono text-xs text-neutral-700 pt-2">
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">AIM ASSIST</div>
                <div className="text-[11px] text-neutral-500">Spline curve smoothing &amp; bone prioritization</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">AUTO CLICKER</div>
                <div className="text-[11px] text-neutral-500">Dynamic CPS range with natural jitter variance</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">VELOCITY CONTROL</div>
                <div className="text-[11px] text-neutral-500">Horizontal/vertical modifier with chance filter</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">REACH ADJUSTMENT</div>
                <div className="text-[11px] text-neutral-500">Configurable reach bounds for legitimate play</div>
              </div>
            </div>
          </div>
          {/* Interactive Live Client Module Preview */}
          <div className="lg:w-1/2 w-full">
            <ClientModuleCard
              category="COMBAT MODULE"
              name="Aim Assist &amp; Clicker"
              description="Fine-tune your targeting speed, angle thresholds, and click automation for responsive, natural mechanical play."
              controls={[
                { id: 'fov', label: 'Maximum Angle (FOV)', type: 'slider', value: 75, min: 10, max: 180, unit: '°' },
                { id: 'speed', label: 'Smoothing Speed', type: 'slider', value: 4.5, min: 1, max: 10, step: 0.1 },
                { id: 'cps', label: 'Average CPS Limit', type: 'slider', value: 12.5, min: 8, max: 18, step: 0.5, unit: 'CPS' },
                { id: 'weapon', label: 'Require Weapon in Hand', type: 'toggle', value: true },
                { id: 'target_invisible', label: 'Target Invisible Entities', type: 'toggle', value: false },
              ]}
            />
          </div>
        </div>

        {/* Module 2: Visuals & Low-Profile Overlays (Inverted Layout) */}
        <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12">
          <div className="lg:w-1/2 space-y-6">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
              MODULE CATEGORY 02 &mdash; VISUALS &amp; GHOST
            </span>
            <SmokeInvertText
              as="h3"
              displacement={true}
              className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[0.92]"
            >
              <span className="block split-line">
                <span className="smoke-hover-word">LOW-PROFILE</span>
              </span>
              <span className="block split-line">
                <span className="smoke-hover-word">HUD</span> <span className="smoke-hover-word">&amp;</span> <span className="smoke-hover-word">CHAMS.</span>
              </span>
            </SmokeInvertText>
            <p className="text-sm text-neutral-600 leading-relaxed font-sans">
              Monochromatic heads-up display widgets and tactical entity chams rendered directly onto the viewport with zero frame impact. Enjoy complete situational awareness without visual obstruction.
            </p>
            <div className="grid grid-cols-2 gap-4 font-mono text-xs text-neutral-700 pt-2">
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">PLAYER ESP</div>
                <div className="text-[11px] text-neutral-500">Bounding boxes with distance &amp; health telemetry</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">CHAM SHADERS</div>
                <div className="text-[11px] text-neutral-500">Translucent monochrome model overlays</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">HUD WIDGETS</div>
                <div className="text-[11px] text-neutral-500">Coordinates, active CPS, and armor durability</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">MINIMAL NOISE</div>
                <div className="text-[11px] text-neutral-500">Clean geometric aesthetic with customizable opacity</div>
              </div>
            </div>
          </div>
          {/* Interactive Live Client Module Preview */}
          <div className="lg:w-1/2 w-full">
            <ClientModuleCard
              category="VISUAL MODULE"
              name="Player ESP &amp; Overlay"
              description="Configure entity visibility, cham shading, and HUD widgets with minimal interface distraction."
              controls={[
                { id: 'box', label: '2D Bounding Box', type: 'toggle', value: true },
                { id: 'chams', label: 'Monochrome Cham Shading', type: 'toggle', value: true },
                { id: 'opacity', label: 'Overlay Opacity', type: 'slider', value: 65, min: 20, max: 100, unit: '%' },
                { id: 'distance', label: 'Show Distance Numbers', type: 'toggle', value: true },
                { id: 'armor', label: 'Display Armor Status HUD', type: 'toggle', value: true },
              ]}
            />
          </div>
        </div>

        {/* Module 3: Movement & Utility Controls */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2 space-y-6">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
              MODULE CATEGORY 03 &mdash; MOVEMENT &amp; UTILITY
            </span>
            <SmokeInvertText
              as="h3"
              displacement={true}
              className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[0.92]"
            >
              <span className="block split-line">
                <span className="smoke-hover-word">MOMENTUM</span> <span className="smoke-hover-word">&amp;</span>
              </span>
              <span className="block split-line">
                <span className="smoke-hover-word">INVENTORY</span> <span className="smoke-hover-word">CONTROL.</span>
              </span>
            </SmokeInvertText>
            <p className="text-sm text-neutral-600 leading-relaxed font-sans">
              Streamline in-game mechanics with automated inventory organization and seamless sprint handling. Manage multiple configuration profiles and hotkey binds for instant tactical adaptation.
            </p>
            <div className="grid grid-cols-2 gap-4 font-mono text-xs text-neutral-700 pt-2">
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">KEEPSPRINT</div>
                <div className="text-[11px] text-neutral-500">Preserves sprint velocity during hit deceleration</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">INVENTORY CLEANER</div>
                <div className="text-[11px] text-neutral-500">Automated hotbar sorting with customizable item lists</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">AUTO ARMOR</div>
                <div className="text-[11px] text-neutral-500">Instant optimal armor equip during inventory state</div>
              </div>
              <div className="border border-black/10 p-3 bg-white/40">
                <div className="font-bold mb-1">PROFILE SYNC</div>
                <div className="text-[11px] text-neutral-500">Cloud &amp; local profile export with hotkey toggling</div>
              </div>
            </div>
          </div>
          {/* Interactive Live Client Module Preview */}
          <div className="lg:w-1/2 w-full">
            <ClientModuleCard
              category="UTILITY &amp; MOTION"
              name="Movement &amp; Profiles"
              description="Customize momentum preservation, automated hotbar organization, and configuration hotkeys."
              controls={[
                { id: 'sprint', label: 'KeepSprint Engine', type: 'toggle', value: true },
                { id: 'cleaner', label: 'Inventory Cleaner &amp; Sorter', type: 'toggle', value: true },
                { id: 'delay', label: 'Inventory Action Delay', type: 'slider', value: 85, min: 40, max: 200, unit: 'ms' },
                { id: 'fastplace', label: 'FastPlace Delay', type: 'slider', value: 1, min: 0, max: 4, unit: 'ticks' },
                { id: 'autoarmor', label: 'Auto Armor Switching', type: 'toggle', value: true },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
