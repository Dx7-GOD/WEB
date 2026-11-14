// src/lib/store.ts
// Shared mutable state between the DOM/scroll layer and the WebGL layer.
// Kept outside React on purpose: it is written every frame.

export const FORM = {
  HERO: 0,
  TUNNEL: 1,
  RIVER: 2,
  BURST: 3,
  FEATURES: 4,
  BAND: 5,
  SPHERE: 6,
  HAZE: 7,
  FINAL: 8,
  FOOTER: 9,
} as const;
export type FormId = (typeof FORM)[keyof typeof FORM];

const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

const coarse = mq('(pointer: coarse)');
const small = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 700;
const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

export const device = {
  reduced: mq('(prefers-reduced-motion: reduce)'),
  coarse,
  low: coarse || small || cores <= 4,
};

export const scene = {
  /** float section index (0..n-1) at viewport focus */
  stage: 0,
  formA: FORM.HERO as number,
  formB: FORM.HERO as number,
  /** 0..1 blend between formA and formB */
  mix: 0,
  /** local progress (0..1) of the sections owning formA / formB */
  localA: 0,
  localB: 0,
  /** 0 = light world (black smoke), 1 = dark world (white smoke) */
  theme: 0,
  /** hero intro 0..1 */
  intro: 0,
  /** smoothed, normalised scroll velocity (-1..1) */
  velocity: 0,
  /** extra dispersal impulse (navigation transitions), decays to 0 */
  pulse: 0,
  pointer: { x: 0, y: 0, vx: 0, vy: 0, active: false },
  /** set by the WebGL layer once it has produced a frame */
  ready: false,
};

export function pulse(amount = 1) {
  scene.pulse = Math.min(1.5, scene.pulse + amount);
}

// pointer tracking (normalised device coords)
if (typeof window !== 'undefined') {
  let lx = 0;
  let ly = 0;
  let lt = performance.now();
  window.addEventListener(
    'pointermove',
    (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      const now = performance.now();
      const dt = Math.max(8, now - lt) / 1000;
      scene.pointer.vx = scene.pointer.vx * 0.6 + ((x - lx) / dt) * 0.4;
      scene.pointer.vy = scene.pointer.vy * 0.6 + ((y - ly) / dt) * 0.4;
      scene.pointer.x = x;
      scene.pointer.y = y;
      scene.pointer.active = true;
      lx = x;
      ly = y;
      lt = now;
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => (scene.pointer.active = false));
}
