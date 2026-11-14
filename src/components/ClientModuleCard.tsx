// src/components/ClientModuleCard.tsx
// High-fidelity software mockup component replicating a Minecraft client module interface.
// Features smooth 3D perspective tilt, specular surface reflection, and live interactive controls.
import React, { useRef, useState } from 'react';
import { device } from '../lib/store';

export interface ModuleControl {
  id: string;
  label: string;
  type: 'slider' | 'toggle' | 'select';
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
}

export interface ClientModuleProps {
  name: string;
  category: string;
  description: string;
  bindKey?: string;
  defaultActive?: boolean;
  controls: ModuleControl[];
  className?: string;
}

export const ClientModuleCard: React.FC<ClientModuleProps> = ({
  name,
  category,
  description,
  bindKey = 'NONE',
  defaultActive = true,
  controls: initialControls,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(defaultActive);
  const [controls, setControls] = useState<ModuleControl[]>(initialControls);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50 });

  const handleSlider = (id: string, val: number) => {
    setControls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: val } : c)),
    );
  };

  const handleToggle = (id: string) => {
    setControls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: !c.value } : c)),
    );
  };

  // Subtle 3D mouse tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (device.coarse || device.reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = ((y / rect.height) - 0.5) * -7; // max 3.5 deg
    const ry = ((x / rect.width) - 0.5) * 7;
    setTilt({ rx, ry, px, py });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, px: 50, py: 50 });
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className={`relative select-none ${className}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(0)`,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
        }}
        className="relative bg-[#0d0d0d] text-white border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2px]"
      >
        {/* Dynamic Specular Light Glare */}
        <div
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle 260px at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.06), transparent 70%)`,
          }}
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        />

        {/* Window Chrome Titlebar */}
        <div className="bg-[#161616] px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white/30" />
            <span className="w-2 h-2 rounded-full bg-white/20" />
            <span className="w-2 h-2 rounded-full bg-white/20" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-neutral-400 ml-2">
              {category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-white/20 text-neutral-400">
              BIND: {bindKey}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-neutral-600'}`} />
          </div>
        </div>

        {/* Module Header with Master Toggle */}
        <div className="p-6 md:p-7">
          <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-white/10">
            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                {name}
              </h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {description}
              </p>
            </div>
            <button
              onClick={() => setActive(!active)}
              className={`shrink-0 font-mono text-[10px] uppercase px-3.5 py-1.5 font-bold tracking-widest transition-all duration-200 border ${
                active
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                  : 'bg-transparent text-neutral-500 border-white/20 hover:border-white hover:text-white'
              }`}
            >
              {active ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* Module Settings Grid */}
          <div
            className={`space-y-4 font-mono text-xs transition-opacity duration-300 ${
              active ? 'opacity-100' : 'opacity-30 pointer-events-none'
            }`}
          >
            {controls.map((ctrl) => {
              if (ctrl.type === 'slider') {
                const val = ctrl.value as number;
                const min = ctrl.min ?? 0;
                const max = ctrl.max ?? 100;
                const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

                return (
                  <div key={ctrl.id} className="space-y-1.5 bg-white/[0.02] p-2.5 border border-white/5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-300 uppercase tracking-wider">{ctrl.label}</span>
                      <span className="font-bold text-white tracking-widest">
                        {val}
                        {ctrl.unit ? ` ${ctrl.unit}` : ''}
                      </span>
                    </div>
                    {/* Custom Styled Rail with Fill Indicator */}
                    <div className="relative w-full h-1 bg-white/15 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={ctrl.step ?? 1}
                      value={val}
                      onChange={(e) => handleSlider(ctrl.id, parseFloat(e.target.value))}
                      className="w-full opacity-0 -mt-2.5 cursor-pointer block h-4"
                    />
                  </div>
                );
              }

              if (ctrl.type === 'toggle') {
                const checked = ctrl.value as boolean;
                return (
                  <div
                    key={ctrl.id}
                    onClick={() => handleToggle(ctrl.id)}
                    className="flex items-center justify-between cursor-pointer py-2 px-2.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors select-none"
                  >
                    <span className="text-[11px] text-neutral-300 uppercase tracking-wider">
                      {ctrl.label}
                    </span>
                    <span
                      className={`w-4 h-4 flex items-center justify-center border transition-colors ${
                        checked
                          ? 'bg-white text-black border-white'
                          : 'border-white/20 bg-transparent text-transparent'
                      }`}
                    >
                      <span className="text-[9px] font-bold leading-none">✓</span>
                    </span>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
