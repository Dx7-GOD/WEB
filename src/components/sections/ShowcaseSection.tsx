// src/components/sections/ShowcaseSection.tsx
// High-resolution Particle Laboratory Showcase featuring Plume, Burst, and Vortex.
// Implements 3D tilt cards, interactive inspection mode, and real-time particle mechanics.
import React, { useEffect, useRef, useState } from 'react';
import { device, FORM } from '../../lib/store';
import { SmokeInvertText } from '../SmokeInvertText';

interface PlateData {
  id: string;
  tag: string;
  name: string;
  type: string;
  src: string;
  metrics: {
    resolution: string;
    velocity: string;
    kinematics: string;
    particles: string;
  };
  notes: string;
}

const PLATES: PlateData[] = [
  {
    id: 'plume',
    tag: 'PLATE 01',
    name: 'PLUME',
    type: 'LAMINAR DISPERSAL',
    src: '/media/plume.jpg',
    metrics: {
      resolution: '4K MONOCHROME RAW',
      velocity: '1.4 m/s',
      kinematics: 'LAMINAR SHEAR FLOW',
      particles: '14,200 DENSITY PTS',
    },
    notes: 'Horizontal drift with delicate trailing filaments and core volumetric billow density.',
  },
  {
    id: 'burst',
    tag: 'PLATE 02',
    name: 'BURST',
    type: 'RADIAL SHOCKWAVE',
    src: '/media/burst.jpg',
    metrics: {
      resolution: 'HIGH-SPEED MICRO',
      velocity: '28.6 m/s',
      kinematics: 'EXPLOSIVE POWDER EXPANSION',
      particles: '38,000 DENSITY PTS',
    },
    notes: 'High-speed frozen impact explosion dispersing thousands of ink micro-particles outward.',
  },
  {
    id: 'vortex',
    tag: 'PLATE 03',
    name: 'VORTEX',
    type: 'TOROIDAL CIRCULATION',
    src: '/media/vortex.jpg',
    metrics: {
      resolution: 'OPTICAL MACRO RAW',
      velocity: '6.8 m/s',
      kinematics: 'HELICAL VORTICITY',
      particles: '22,500 DENSITY PTS',
    },
    notes: 'Centered vortex ring curling upon itself with filament detail and balanced angular momentum.',
  },
];

export const ShowcaseSection: React.FC = () => {
  const [activePlate, setActivePlate] = useState<number | null>(null);
  const [tilt, setTilt] = useState<Record<number, { rx: number; ry: number }>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse tilt for the 3 grid plates
  const handlePlateMouseMove = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (device.coarse || device.reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -8;
    const ry = ((x / rect.width) - 0.5) * 8;
    setTilt((prev) => ({ ...prev, [index]: { rx, ry } }));
  };

  const handlePlateMouseLeave = (index: number) => {
    setTilt((prev) => ({ ...prev, [index]: { rx: 0, ry: 0 } }));
  };

  // Canvas particle simulation inside the inspection modal
  useEffect(() => {
    if (activePlate === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const h = (canvas.height = canvas.parentElement?.clientHeight || 500);

    // Seed particles according to the selected formation
    const count = activePlate === 1 ? 260 : 180;
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (activePlate === 0 ? w * 0.45 : activePlate === 1 ? 160 : 120);
      return {
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * (activePlate === 0 ? dist * 0.25 : dist),
        vx: (Math.random() - 0.5) * (activePlate === 1 ? 3 : 1),
        vy: (Math.random() - 0.5) * (activePlate === 1 ? 3 : 1),
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
      };
    });

    let mx = w / 2;
    let my = h / 2;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let t = 0;
    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        // Formation specific particle physics
        if (activePlate === 0) {
          // Plume: horizontal laminar drift
          p.x += Math.sin(t + p.y * 0.02) * 0.8 + 0.6;
          p.y += Math.cos(t * 0.8 + p.x * 0.02) * 0.3;
          if (p.x > w + 20) p.x = -20;
        } else if (activePlate === 1) {
          // Burst: high speed radial outward expansion with spring return
          const dx = p.x - w / 2;
          const dy = p.y - h / 2;
          const dist = Math.hypot(dx, dy) || 1;
          p.x += (dx / dist) * 1.5;
          p.y += (dy / dist) * 1.5;
          if (dist > Math.max(w, h) * 0.55) {
            p.x = w / 2 + (Math.random() - 0.5) * 40;
            p.y = h / 2 + (Math.random() - 0.5) * 40;
          }
        } else {
          // Vortex: orbital swirl
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.hypot(dx, dy) || 1;
          const speed = Math.min(3, 40 / dist);
          p.x += -dy * speed * 0.05 + (Math.random() - 0.5) * 0.4;
          p.y += dx * speed * 0.05 + (Math.random() - 0.5) * 0.4;
        }

        ctx.fillStyle = `rgba(0, 0, 0, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [activePlate]);

  return (
    <section
      id="showcase"
      data-scene
      data-form={FORM.SPHERE}
      data-theme="light"
      className="relative min-h-[160vh] flex flex-col justify-center px-6 md:px-16 py-32 text-black"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 block mb-3">
            SECTION 04 &mdash; PARTICLE FORMATION LAB
          </span>
          <SmokeInvertText
            as="h2"
            displacement={true}
            className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.88] mb-6"
          >
            <span className="block split-line">
              <span className="smoke-hover-word">DISSOLVING</span>
            </span>
            <span className="block split-line">
              <span className="smoke-hover-word">MATTER.</span>
            </span>
          </SmokeInvertText>
          <p className="text-neutral-600 text-sm md:text-base font-sans leading-relaxed">
            Interactive high-speed fluid and ink dispersal mechanics. Select any plate below to enter the particle inspection laboratory.
          </p>
        </div>

        {/* 3-Plate Laboratory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
          {PLATES.map((plate, index) => {
            const cardTilt = tilt[index] || { rx: 0, ry: 0 };
            return (
              <div
                key={plate.id}
                style={{ perspective: '1000px' }}
                onClick={() => setActivePlate(index)}
                className="cursor-pointer group select-none"
              >
                <div
                  onMouseMove={(e) => handlePlateMouseMove(index, e)}
                  onMouseLeave={() => handlePlateMouseLeave(index)}
                  style={{
                    transform: `rotateX(${cardTilt.rx.toFixed(2)}deg) rotateY(${cardTilt.ry.toFixed(2)}deg) translateZ(0)`,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                  }}
                  className="border border-neutral-300 bg-white p-5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.12)] group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.22)] group-hover:border-black transition-all duration-300"
                >
                  {/* Plate Header Bar */}
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-200 font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                    <span className="font-bold text-black">{plate.tag}</span>
                    <span>{plate.type}</span>
                  </div>

                  {/* High-Resolution Media Plate with Zoom Elevation */}
                  <div className="overflow-hidden aspect-[16/10] bg-neutral-100 relative mb-4">
                    <img
                      src={plate.src}
                      alt={plate.name}
                      className="w-full h-full object-cover transform group-hover:scale-106 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* Plate Metadata */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xl font-black uppercase tracking-tight">{plate.name}</h3>
                      <span className="font-mono text-[10px] text-neutral-400">INSPECT &rarr;</span>
                    </div>
                    <p className="text-xs text-neutral-600 font-sans leading-relaxed line-clamp-2">
                      {plate.notes}
                    </p>
                    <div className="h-[1px] w-full bg-neutral-200 mt-2" />
                    <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-1">
                      <span>{plate.metrics.particles}</span>
                      <span>{plate.metrics.velocity}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enlarged Interactive Laboratory Modal / Focused Inspection Viewer */}
        {activePlate !== null && (
          <div className="mt-16 border-2 border-black bg-white p-6 md:p-10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-8 border-b border-black/15 gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  INTERACTIVE LABORATORY // SPECIMEN {PLATES[activePlate].tag}
                </span>
                <h3 className="text-3xl font-black uppercase tracking-tight mt-1">
                  {PLATES[activePlate].name} &mdash; {PLATES[activePlate].type}
                </h3>
              </div>
              <button
                onClick={() => setActivePlate(null)}
                className="px-5 py-2.5 bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                CLOSE INSPECTION &times;
              </button>
            </div>

            {/* Main Inspection View: Split Canvas & Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Interactive Particle Simulation Canvas */}
              <div className="lg:col-span-2 relative aspect-[16/10] bg-neutral-50 border border-black/20 overflow-hidden flex items-center justify-center">
                <img
                  src={PLATES[activePlate].src}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-multiply pointer-events-none"
                />
                <canvas
                  ref={canvasRef}
                  className="relative z-10 w-full h-full cursor-crosshair"
                />
                <div className="absolute bottom-3 left-4 z-20 font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  [MOVE POINTER OVER CANVAS TO DISPERSE PARTICLES]
                </div>
              </div>

              {/* Lab Telemetry Specs Panel */}
              <div className="flex flex-col justify-between font-mono text-xs space-y-6 bg-neutral-100 p-6 border border-black/10">
                <div className="space-y-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-black pb-2 border-b border-black/15">
                    SPECIMEN TELEMETRY
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">CAPTURE RESOLUTION</span>
                    <span className="font-bold text-black">{PLATES[activePlate].metrics.resolution}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">DISPERSAL VELOCITY</span>
                    <span className="font-bold text-black">{PLATES[activePlate].metrics.velocity}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">KINEMATIC PROFILE</span>
                    <span className="font-bold text-black">{PLATES[activePlate].metrics.kinematics}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">PARTICLE DENSITY</span>
                    <span className="font-bold text-black">{PLATES[activePlate].metrics.particles}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/15">
                  <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                    {PLATES[activePlate].notes}
                  </p>
                  <div className="mt-6 flex gap-2">
                    {PLATES.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePlate(i)}
                        className={`flex-1 py-1.5 font-mono text-[10px] uppercase border transition-colors ${
                          activePlate === i
                            ? 'bg-black text-white border-black font-bold'
                            : 'bg-white text-black border-black/20 hover:border-black'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
