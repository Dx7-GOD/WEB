// src/three/PuffSystem.ts
// CPU-choreographed, GPU-shaded smoke. Each puff is a camera-facing billboard
// sampling a baked noise atlas with animated internal turbulence and lighting.
// Positions morph between scroll-driven "formations", react to the cursor with
// a damped spring (disperse + reform) and are depth-sorted every frame.
import * as THREE from 'three';
import { FORM } from '../lib/store';
import { mulberry32, noise3 } from './noise';
import { puffFrag, puffVert } from './shaders';

export type Layer = 'back' | 'front';

const STRIDE = 12;
const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const sstep = (a: number, b: number, v: number) => smooth((v - a) / (b - a));

// cumulus lobes: x, y, z, rx, ry, rz, weight, size
const LOBES: number[][] = [
  [0, 0.05, 0, 2.3, 1.25, 1.2, 3.2, 1.3],
  [-2.35, -0.1, 0.2, 1.55, 1.05, 1.0, 1.7, 1.05],
  [2.45, -0.05, -0.1, 1.65, 1.05, 1.0, 1.7, 1.05],
  [-0.95, 1.05, -0.3, 1.45, 0.95, 1.0, 1.5, 1.0],
  [1.15, 0.95, -0.2, 1.4, 0.9, 1.0, 1.4, 1.0],
  [-3.85, -0.45, 0.1, 1.0, 0.72, 0.8, 0.8, 0.82],
  [3.95, -0.35, 0.0, 1.05, 0.72, 0.8, 0.8, 0.82],
  [0.2, -1.1, 0.35, 2.2, 0.55, 0.8, 1.3, 0.85],
  [-0.5, -1.85, 0.45, 0.9, 0.6, 0.5, 0.45, 0.6],
  [0.95, -2.0, 0.25, 0.7, 0.55, 0.5, 0.35, 0.55],
];

interface Out {
  x: number;
  y: number;
  z: number;
  s: number;
  a: number;
}

export class PuffSystem {
  readonly n: number;
  readonly layer: Layer;
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  private geo: THREE.InstancedBufferGeometry;
  private seeds: Float32Array;
  private hero: Float32Array; // x,y,z,s,delay
  private px: Float32Array;
  private py: Float32Array;
  private pz: Float32Array;
  private ps: Float32Array;
  private pa: Float32Array;
  private pr: Float32Array;
  private dx: Float32Array;
  private dy: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private order: number[];
  private aOffset: THREE.InstancedBufferAttribute;
  private aData: THREE.InstancedBufferAttribute;
  private aSeed: THREE.InstancedBufferAttribute;
  private oA: Out = { x: 0, y: 0, z: 0, s: 1, a: 0 };
  private oB: Out = { x: 0, y: 0, z: 0, s: 1, a: 0 };

  constructor(n: number, layer: Layer, atlas: THREE.Texture, warp: THREE.Texture) {
    this.n = n;
    this.layer = layer;
    const rnd = mulberry32(layer === 'back' ? 7 : 99);
    this.seeds = new Float32Array(n * STRIDE);
    for (let i = 0; i < n; i++) {
      const o = i * STRIDE;
      for (let k = 0; k < 9; k++) this.seeds[o + k] = rnd();
      for (let k = 0; k < 3; k++) {
        const u1 = Math.max(1e-6, rnd());
        const u2 = rnd();
        this.seeds[o + 9 + k] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
      }
    }

    // pre-sample the hero cumulus
    this.hero = new Float32Array(n * 5);
    const wsum = LOBES.reduce((s, l) => s + l[6], 0);
    let maxD = 0;
    for (let i = 0; i < n; i++) {
      let pick = rnd() * wsum;
      let L = LOBES[0];
      for (const l of LOBES) {
        pick -= l[6];
        if (pick <= 0) {
          L = l;
          break;
        }
      }
      // uniform point in ellipsoid
      let x = 0, y = 0, z = 0;
      do {
        x = rnd() * 2 - 1;
        y = rnd() * 2 - 1;
        z = rnd() * 2 - 1;
      } while (x * x + y * y + z * z > 1);
      const hx = L[0] + x * L[3] * 0.85;
      const hy = L[1] + y * L[4] * 0.8;
      const hz = L[2] + z * L[5];
      const core = 1 - Math.min(1, Math.hypot(x, y));
      const hs = (1.15 + rnd() * 1.25) * L[7] * (0.85 + core * 0.4);
      const o = i * 5;
      this.hero[o] = hx;
      this.hero[o + 1] = hy;
      this.hero[o + 2] = hz;
      this.hero[o + 3] = hs;
      const d = Math.hypot(hx / 1.9, hy);
      this.hero[o + 4] = d;
      maxD = Math.max(maxD, d);
    }
    for (let i = 0; i < n; i++) this.hero[i * 5 + 4] = (this.hero[i * 5 + 4] / maxD) * 0.8 + this.seeds[i * STRIDE + 8] * 0.2;

    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.pz = new Float32Array(n);
    this.ps = new Float32Array(n);
    this.pa = new Float32Array(n);
    this.pr = new Float32Array(n);
    this.dx = new Float32Array(n);
    this.dy = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.order = Array.from({ length: n }, (_, i) => i);

    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    this.aOffset = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.aData = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    this.aSeed = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    this.aOffset.setUsage(THREE.DynamicDrawUsage);
    this.aData.setUsage(THREE.DynamicDrawUsage);
    this.aSeed.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iOffset', this.aOffset);
    geo.setAttribute('iData', this.aData);
    geo.setAttribute('iSeed', this.aSeed);
    geo.instanceCount = n;
    this.geo = geo;

    this.material = new THREE.ShaderMaterial({
      vertexShader: puffVert,
      fragmentShader: puffFrag,
      uniforms: {
        uAtlas: { value: atlas },
        uWarp: { value: warp },
        uTime: { value: 0 },
        uInvert: { value: 0 },
        uOpacity: { value: 1 },
        uNear: { value: layer === 'front' ? 0.6 : 0.9 },
        uLight: { value: new THREE.Vector3(-0.38, 0.72, 0.58).normalize() },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
  }

  /** formation targets for the background layer */
  private formBack(f: number, i: number, lp: number, t: number, ax: number, o: Out) {
    const s = this.seeds;
    const k = i * STRIDE;
    const r0 = s[k], r1 = s[k + 1], r2 = s[k + 2], r3 = s[k + 3], r4 = s[k + 4];
    const g0 = s[k + 9], g1 = s[k + 10], g2 = s[k + 11];
    switch (f) {
      case FORM.HERO:
      case FORM.FINAL: {
        const h = i * 5;
        const big = f === FORM.FINAL ? 1.08 : 1;
        // 28% of puffs drift lower to flow directly across the headline area
        if (i % 4 === 0) {
          const spread = (r0 - 0.5) * 5.4 * ax;
          const driftY = -1.6 - r1 * 1.1 + Math.sin(t * 0.12 + r2 * 6) * 0.25;
          o.x = spread;
          o.y = driftY * big;
          o.z = (r3 - 0.5) * 1.5;
          o.s = (1.2 + r4 * 1.6) * (0.8 + 0.2 * ax) * big;
          o.a = 0.88;
        } else {
          o.x = this.hero[h] * ax * big;
          o.y = this.hero[h + 1] * big + (f === FORM.FINAL ? 0.15 : 0.1);
          o.z = this.hero[h + 2];
          o.s = this.hero[h + 3] * (0.75 + 0.25 * ax) * big;
          o.a = 0.9;
        }
        return;
      }
      case FORM.TUNNEL: {
        const corridor = 1 - sstep(0.72, 0.96, lp);
        let x = (r0 - 0.5) * 15 * Math.max(ax, 0.75);
        let y = (r1 - 0.5) * 8.5;
        const cx = 1.9 * corridor, cy = 1.1 * corridor;
        if (Math.abs(x) < cx && Math.abs(y) < cy) {
          if (Math.abs(x) / cx > Math.abs(y) / cy) x = Math.sign(x || 1) * (cx + Math.abs(x) * 0.4);
          else y = Math.sign(y || 1) * (cy + Math.abs(y) * 0.4);
        }
        const L = 44;
        const z = (((r2 * L + lp * 84 + t * 0.75) % L) + L) % L - 34;
        o.x = x;
        o.y = y;
        o.z = z;
        o.s = 2.0 + r3 * 2.6 + (1 - corridor) * 1.5;
        o.a = (0.78 + (1 - corridor) * 0.22) * sstep(-34, -26, z);
        return;
      }
      case FORM.RIVER: {
        const u = r0 * 2 - 1;
        const off = (lp * 13 - 6.5) * ax;
        const au = Math.abs(u);
        o.x = u * 9.5 * ax + off + Math.sin(t * 0.07 + r1 * 6) * 0.3;
        o.y = Math.sin(u * 2.2 + 1.1 + t * 0.08) * 0.85 + g1 * 0.55 * (1 - au * 0.6);
        o.z = g2 * 0.9;
        o.s = (1.3 + r3 * 1.5) * (1.35 - au * 0.75);
        o.a = 0.5 + 0.45 * (1 - au);
        return;
      }
      case FORM.BURST: {
        const bx = g0 * 2.6 * ax, by = g1 * 0.8, bz = g2 * 0.8 - 0.5;
        const len = Math.hypot(bx, by * 1.6, 0.4) || 1;
        const k2 = Math.pow(lp, 1.25) * 9.5 * (0.45 + r3);
        o.x = bx + (bx / len) * k2;
        o.y = by + ((by * 1.6) / len) * k2 * 0.7 - lp * lp * r4 * 1.2;
        o.z = bz + lp * (r2 - 0.5) * 4;
        o.s = (1.5 + r4 * 1.5) * (1 + lp * 0.9);
        o.a = 0.85 * (1 - sstep(0.5, 1, lp) * 0.9);
        return;
      }
      case FORM.FEATURES: {
        // Stable, atmospheric smoke formations framing the feature modules
        const side = r0 < 0.5 ? -1 : 1;
        const drift = (0.5 - lp) * 1.2 * ax;
        o.x = (side * (2.6 + r1 * 2.2) + drift) * ax + (r3 - 0.5) * 0.8;
        o.y = (r2 - 0.5) * 7.0 + Math.sin(t * 0.06 + r4 * 6) * 0.3;
        o.z = -1.5 - r3 * 2.2;
        o.s = 1.6 + r4 * 1.6;
        o.a = 0.55;
        return;
      }
      case FORM.BAND: {
        const span = 22;
        const x = (((r0 * span - lp * 9 + t * 0.12) % span) + span) % span - span / 2;
        o.x = x * Math.max(ax, 0.7);
        o.y = -2.55 + g1 * 0.45 + Math.sin(x * 0.5 + t * 0.2) * 0.25;
        o.z = g2 * 1.2;
        o.s = 1.3 + r3 * 1.4;
        o.a = 0.55 * (1 - sstep(8, 11, Math.abs(x)));
        return;
      }
      case FORM.SPHERE: {
        o.x = (r0 - 0.5) * 18 * ax;
        o.y = (r1 - 0.5) * 9;
        o.z = -7 - r2 * 6;
        o.s = 2.5 + r3 * 2;
        o.a = 0.1;
        return;
      }
      case FORM.FOOTER: {
        const rise = (r1 + t * 0.012 * (0.5 + r4)) % 1;
        o.x = (r0 - 0.5) * 16 * ax;
        o.y = -3.7 + g1 * 0.35 + rise * 1.4;
        o.z = g2 * 1.2;
        o.s = 1.6 + r3 * 1.6;
        o.a = 0.6 * Math.sin(rise * Math.PI);
        return;
      }
      case FORM.HAZE:
      default: {
        const side = r0 < 0.5 ? -1 : 1;
        o.x = side * (5.6 + r1 * 3) * Math.max(ax, 0.8);
        o.y = (r2 - 0.5) * 7.5 + Math.sin(t * 0.05 + r4 * 9) * 0.4;
        o.z = -2 - r3 * 3;
        o.s = 1.8 + r4 * 1.8;
        o.a = 0.32;
        return;
      }
    }
  }

  /** foreground wisps (rendered above the DOM, sparse, soft) */
  private formFront(f: number, i: number, lp: number, t: number, ax: number, o: Out) {
    const s = this.seeds;
    const k = i * STRIDE;
    const r0 = s[k], r1 = s[k + 1], r2 = s[k + 2], r3 = s[k + 3], r4 = s[k + 4];
    switch (f) {
      case FORM.HERO:
      case FORM.FINAL: {
        const side = r0 < 0.5 ? -1 : 1;
        o.x = side * (3.1 + r1 * 2.8) * Math.max(ax, 0.6) + Math.sin(t * 0.06 + r2 * 6) * 0.5;
        o.y = -1.75 - r2 * 1.3;
        o.z = 4.8 + r3 * 2.0;
        o.s = 1.5 + r4 * 1.4;
        o.a = i % 2 === 0 ? 0.3 : 0;
        return;
      }
      case FORM.TUNNEL: {
        let x = (r0 - 0.5) * 8;
        const y = (r1 - 0.5) * 5;
        if (Math.abs(x) < 1.4 && Math.abs(y) < 0.9) x = Math.sign(x || 1) * (1.4 + Math.abs(x));
        const L = 15;
        const z = (((r2 * L + lp * 36 + t * 0.45) % L) + L) % L - 6;
        o.x = x;
        o.y = y;
        o.z = z;
        o.s = 1.6 + r3 * 1.6;
        o.a = 0.5 * sstep(-6, -3, z);
        return;
      }
      default: {
        o.x = (r0 - 0.5) * 10;
        o.y = (r1 - 0.5) * 6;
        o.z = 6;
        o.s = 1;
        o.a = 0;
      }
    }
  }

  update(dt: number, t: number, cam: THREE.PerspectiveCamera, st: {
    formA: number; formB: number; mix: number; localA: number; localB: number;
    intro: number; theme: number; velocity: number; pulse: number;
    pointer: { x: number; y: number; vx: number; vy: number; active: boolean };
  }, ax: number) {
    const n = this.n;
    const front = this.layer === 'front';
    const form = front ? this.formFront.bind(this) : this.formBack.bind(this);
    const A = this.oA, B = this.oB;
    const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const camZ = cam.position.z;
    const aspect = cam.aspect;
    const scatter = Math.abs(st.velocity) * 0.9 + st.pulse * 1.6;
    const intro = st.intro;
    const pAct = st.pointer.active ? 1 : 0;
    const kSpring = 2.6;
    const damp = Math.exp(-2.4 * dt);
    let visible = 0;

    for (let i = 0; i < n; i++) {
      const k = i * STRIDE;
      const s = this.seeds;
      form(st.formA, i, st.localA, t, ax, A);
      form(st.formB, i, st.localB, t, ax, B);
      const mi = smooth(st.mix * 1.5 - s[k + 5] * 0.5);
      let x = A.x + (B.x - A.x) * mi;
      let y = A.y + (B.y - A.y) * mi;
      let z = A.z + (B.z - A.z) * mi;
      let sc = A.s + (B.s - A.s) * mi;
      let al = A.a + (B.a - A.a) * mi;

      // organic drift (3D simplex flow)
      const nt = t * 0.055;
      const sx = s[k] * 40, sy = s[k + 1] * 40, sz = s[k + 2] * 40;
      const drift = front ? 0.35 : 0.28;
      x += noise3(sx, sy, nt) * drift;
      y += noise3(sy + 31.1, sz, nt) * drift * 0.8;
      z += noise3(sz + 7.7, sx, nt) * drift * 0.6;

      // dispersal swirl while morphing between formations
      const sw = Math.sin(mi * Math.PI);
      if (sw > 0.001) {
        x += noise3(sx + 3.3, nt * 2, sy) * sw * 2.2;
        y += noise3(sy + 9.1, nt * 2, sz) * sw * 1.6;
        sc *= 1 + sw * 0.25;
      }

      // scroll velocity / nav pulse push outwards
      if (scatter > 0.001) {
        const len = Math.hypot(x, y) + 0.5;
        const f = scatter * (0.4 + s[k + 6]);
        x += (x / len) * f;
        y += (y / len) * f;
      }

      // hero intro: puffs condense from the centre, nearest first
      if (intro < 1) {
        if (front) {
          al *= sstep(0.7, 1.0, intro);
        } else {
          const d = this.hero[i * 5 + 4];
          const il = smooth((intro - 0.18 - d * 0.5) / 0.32);
          x *= 0.12 + 0.88 * il;
          y *= 0.12 + 0.88 * il;
          sc *= 0.15 + 0.85 * il;
          al *= il;
        }
      }

      // cursor: damped spring displacement (smoke parts and reforms)
      const depth = camZ - z;
      if (depth > 0.2) {
        const halfH = tanH * depth;
        const mx = st.pointer.x * halfH * aspect + cam.position.x * (1 - depth / camZ);
        const my = st.pointer.y * halfH + cam.position.y * (1 - depth / camZ);
        const ex = x + this.dx[i] - mx;
        const ey = y + this.dy[i] - my;
        const d2 = ex * ex + ey * ey;
        const R = sc * 0.75 + 0.6;
        if (pAct && d2 < R * R) {
          const d = Math.sqrt(d2) + 1e-4;
          const fo = (1 - d / R) ** 2;
          const scaleW = halfH * 0.5;
          this.vx[i] += ((ex / d) * fo * 9 + st.pointer.vx * scaleW * fo * 2.2) * dt;
          this.vy[i] += ((ey / d) * fo * 9 + st.pointer.vy * scaleW * fo * 2.2) * dt;
        }
      }
      this.vx[i] = (this.vx[i] - this.dx[i] * kSpring * dt) * damp;
      this.vy[i] = (this.vy[i] - this.dy[i] * kSpring * dt) * damp;
      this.dx[i] += this.vx[i] * dt;
      this.dy[i] += this.vy[i] * dt;
      x += this.dx[i];
      y += this.dy[i];

      this.px[i] = x;
      this.py[i] = y;
      this.pz[i] = z;
      this.ps[i] = sc;
      this.pa[i] = al;
      this.pr[i] = s[k + 7] * TAU + t * (s[k + 8] - 0.5) * 0.12 + (this.dx[i] - this.dy[i]) * 0.25;
      if (al > 0.003) visible++;
    }

    // back-to-front
    const pz = this.pz;
    this.order.sort((a, b) => pz[a] - pz[b]);
    const off = this.aOffset.array as Float32Array;
    const dat = this.aData.array as Float32Array;
    const sd = this.aSeed.array as Float32Array;
    for (let j = 0; j < n; j++) {
      const i = this.order[j];
      off[j * 3] = this.px[i];
      off[j * 3 + 1] = this.py[i];
      off[j * 3 + 2] = this.pz[i];
      dat[j * 4] = this.ps[i];
      dat[j * 4 + 1] = this.pr[i];
      dat[j * 4 + 2] = this.pa[i];
      dat[j * 4 + 3] = Math.floor(this.seeds[i * STRIDE + 4] * 4) % 4;
      sd[j] = this.seeds[i * STRIDE + 3] * 7.0;
    }
    this.aOffset.needsUpdate = true;
    this.aData.needsUpdate = true;
    this.aSeed.needsUpdate = true;

    const u = this.material.uniforms;
    u.uTime.value = t;
    u.uInvert.value = st.theme;
    this.mesh.visible = visible > 0;
  }

  dispose() {
    this.geo.dispose();
    this.material.dispose();
  }
}
