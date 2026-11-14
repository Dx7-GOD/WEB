// src/lib/scroll.ts
// Lenis smooth scrolling wired into GSAP's ticker + ScrollTrigger, plus the
// "scene director": maps scroll position to a continuous stage index that the
// WebGL smoke uses to morph between formations and to drive the global theme.
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device, scene, pulse } from './store';

gsap.registerPlugin(ScrollTrigger);

interface Sec {
  el: HTMLElement;
  id: string;
  form: number;
  theme: number;
  top: number;
  height: number;
  hs: number;
  he: number;
}

export interface UiState {
  navTheme: 'light' | 'dark';
  active: string;
  scrolled: boolean;
}

let lenis: Lenis | null = null;
let secs: Sec[] = [];
let bgEl: HTMLElement | null = null;
let lastY = 0;
let ui: UiState = { navTheme: 'light', active: '', scrolled: false };
const listeners = new Set<(s: UiState) => void>();
let started = false;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function getLenis() {
  return lenis;
}

export function initScroll(bg: HTMLElement) {
  if (started) return;
  started = true;
  bgEl = bg;
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (!device.reduced) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  ScrollTrigger.addEventListener('refresh', measure);
  gsap.ticker.add(update);
  measure();
}

export function measure() {
  const h = window.innerHeight;
  const y = window.scrollY;
  secs = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).map((el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + y;
    const height = r.height;
    const m = Math.min(h, height) / 2;
    return {
      el,
      id: el.id,
      form: Number(el.dataset.form ?? 0),
      theme: el.dataset.theme === 'dark' ? 1 : 0,
      top,
      height,
      hs: top + m,
      he: top + height - m,
    };
  });
}

function emit(next: UiState) {
  if (next.navTheme === ui.navTheme && next.active === ui.active && next.scrolled === ui.scrolled) return;
  ui = next;
  listeners.forEach((fn) => fn(ui));
}

export function subscribeUi(fn: (s: UiState) => void) {
  listeners.add(fn);
  fn(ui);
  return () => {
    listeners.delete(fn);
  };
}

function update() {
  if (!secs.length) return;
  const y = window.scrollY;
  const h = window.innerHeight;
  const c = y + h / 2;

  // stage
  let stage = 0;
  const n = secs.length;
  if (c <= secs[0].hs) stage = 0;
  else if (c >= secs[n - 1].he) stage = n - 1;
  else {
    for (let i = 0; i < n; i++) {
      const s = secs[i];
      if (c >= s.hs && c <= s.he) {
        stage = i;
        break;
      }
      const nx = secs[i + 1];
      if (nx && c > s.he && c < nx.hs) {
        stage = i + (c - s.he) / Math.max(1, nx.hs - s.he);
        break;
      }
    }
  }
  const ia = Math.floor(stage);
  const ib = Math.min(n - 1, ia + 1);
  const frac = stage - ia;
  const local = (i: number) => {
    const s = secs[i];
    if (s.he - s.hs < 1) return c >= s.hs ? 1 : 0;
    return clamp01((c - s.hs) / (s.he - s.hs));
  };

  scene.stage = stage;
  scene.formA = secs[ia].form;
  scene.formB = secs[ib].form;
  scene.mix = frac;
  scene.localA = local(ia);
  scene.localB = local(ib);

  const theme = secs[ia].theme + (secs[ib].theme - secs[ia].theme) * smooth(0.28, 0.72, frac);
  scene.theme = theme;

  // velocity
  const raw = lenis ? lenis.velocity : y - lastY;
  lastY = y;
  const v = Math.max(-1, Math.min(1, raw / 60));
  scene.velocity += (v - scene.velocity) * 0.12;
  scene.pulse *= 0.955;

  if (bgEl) {
    const g = Math.round(255 - 250 * theme);
    bgEl.style.backgroundColor = `rgb(${g},${g},${g})`;
  }

  // nav state: theme of the section under the nav bar
  const probe = y + 36;
  let navSec = secs[0];
  for (const s of secs) if (probe >= s.top && probe < s.top + s.height) navSec = s;
  let active = '';
  for (const s of secs) if (c >= s.top && c < s.top + s.height) active = s.id;
  emit({ navTheme: navSec.theme ? 'dark' : 'light', active, scrolled: y > 40 });
}

export function scrollToTarget(target: string | number | HTMLElement, opts: { immediate?: boolean } = {}) {
  let el: HTMLElement | number | null = null;
  if (typeof target === 'string') el = document.querySelector<HTMLElement>(target);
  else el = target;
  if (el === null) return;
  pulse(0.9);
  if (lenis) {
    lenis.scrollTo(el, {
      duration: opts.immediate ? 0 : 2.0,
      immediate: !!opts.immediate,
      easing: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
    });
  } else {
    const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: device.reduced ? 'auto' : 'smooth' });
  }
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle('is-loading', locked);
}

export { gsap, ScrollTrigger };
