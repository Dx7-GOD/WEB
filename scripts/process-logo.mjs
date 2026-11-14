// scripts/process-logo.mjs
// Converts the supplied AERO logo (white background JPG) into transparent assets
// without altering the artwork: the cloud keeps its exact tonal values when
// composited on white, and the wordmark is extracted 1:1 from the source pixels.
import fs from 'node:fs';
import path from 'node:path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const SRC = process.argv[2] ?? 'scripts/aero-logo-source.jpg';
const OUT = 'public/brand';
fs.mkdirSync(OUT, { recursive: true });

const { width: W, height: H, data } = jpeg.decode(fs.readFileSync(SRC), { useTArray: true });
const N = W * H;
const L = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  L[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// 1. flood fill bright background from the borders
const BG_T = 0.55;
const bg = new Uint8Array(N);
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = y * W + x;
  if (bg[i] || L[i] < BG_T) return;
  bg[i] = 1;
  stack.push(i);
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
while (stack.length) {
  const i = stack.pop();
  const x = i % W, y = (i / W) | 0;
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

// 2. bright components enclosed by the cloud
const comp = new Int32Array(N).fill(-1);
const comps = [];
for (let i = 0; i < N; i++) {
  if (bg[i] || L[i] < BG_T || comp[i] !== -1) continue;
  const id = comps.length;
  let minx = W, miny = H, maxx = 0, maxy = 0, count = 0;
  const st = [i];
  comp[i] = id;
  while (st.length) {
    const j = st.pop();
    const x = j % W, y = (j / W) | 0;
    count++;
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const k = ny * W + nx;
      if (!bg[k] && L[k] >= BG_T && comp[k] === -1) { comp[k] = id; st.push(k); }
    }
  }
  comps.push({ id, minx, miny, maxx, maxy, count });
}
const textComps = comps.filter(
  (c) => c.count > 60 && c.miny > H * 0.3 && c.maxy < H * 0.65 && c.minx > W * 0.2 && c.maxx < W * 0.8,
);
console.log(`image ${W}x${H}, enclosed bright comps: ${comps.length}, text comps: ${textComps.length}`);
textComps.forEach((c) => console.log('  ', c));
const isText = new Uint8Array(comps.length);
textComps.forEach((c) => (isText[c.id] = 1));

// 3. text mask dilated by 2px (captures anti-aliased glyph edges)
const tm = new Uint8Array(N);
const R = 2;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  if (comp[i] < 0 || !isText[comp[i]]) continue;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < W && ny < H) tm[ny * W + nx] = 1;
  }
}

// 4. full logo: cloud as black + alpha (identical on white), wordmark opaque
const logo = new PNG({ width: W, height: H });
for (let i = 0; i < N; i++) {
  const o = i * 4;
  if (tm[i] && !bg[i]) {
    const v = Math.round(L[i] * 255);
    logo.data[o] = logo.data[o + 1] = logo.data[o + 2] = v;
    logo.data[o + 3] = 255;
  } else {
    const a = Math.min(1, Math.max(0, (1 - L[i] - 0.025) / 0.975));
    logo.data[o] = logo.data[o + 1] = logo.data[o + 2] = 0;
    logo.data[o + 3] = Math.round(a * 255);
  }
}
fs.writeFileSync(path.join(OUT, 'aero-logo.png'), PNG.sync.write(logo));

// 5. wordmark only (white + black variants), cropped
let minx = W, miny = H, maxx = 0, maxy = 0;
textComps.forEach((c) => {
  minx = Math.min(minx, c.minx); miny = Math.min(miny, c.miny);
  maxx = Math.max(maxx, c.maxx); maxy = Math.max(maxy, c.maxy);
});
const pad = 4;
minx -= pad; miny -= pad; maxx += pad; maxy += pad;
const ww = maxx - minx + 1, wh = maxy - miny + 1;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
for (const [name, col] of [['aero-wordmark-white.png', 255], ['aero-wordmark-black.png', 0]]) {
  const png = new PNG({ width: ww, height: wh });
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) {
    const si = (y + miny) * W + (x + minx);
    const o = (y * ww + x) * 4;
    const a = tm[si] ? smooth(0.12, 0.88, L[si]) : 0;
    png.data[o] = png.data[o + 1] = png.data[o + 2] = col;
    png.data[o + 3] = Math.round(a * 255);
  }
  fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png));
}
// 6. cloud only: wordmark pixels filled with the surrounding near-black so the
// wordmark can be layered back on top at the exact same coordinates.
const cloud = new PNG({ width: W, height: H });
for (let i = 0; i < N; i++) {
  const o = i * 4;
  for (let k = 0; k < 4; k++) cloud.data[o + k] = logo.data[o + k];
  if (tm[i] && !bg[i]) {
    cloud.data[o] = cloud.data[o + 1] = cloud.data[o + 2] = 6;
    cloud.data[o + 3] = 255;
  }
}
fs.writeFileSync(path.join(OUT, 'aero-cloud.png'), PNG.sync.write(cloud));
// 7. vectorise the pixel wordmark (axis-aligned runs merged into rects) so it
// stays perfectly crisp at any size and can inherit currentColor.
const runsAt = (y) => {
  const runs = [];
  let start = -1;
  for (let x = 0; x <= ww; x++) {
    const on = x < ww && tm[(y + miny) * W + (x + minx)] && smooth(0.12, 0.88, L[(y + miny) * W + (x + minx)]) >= 0.5;
    if (on && start < 0) start = x;
    if (!on && start >= 0) { runs.push([start, x]); start = -1; }
  }
  return runs;
};
const rects = [];
let active = new Map();
for (let y = 0; y <= wh; y++) {
  const runs = y < wh ? runsAt(y) : [];
  const next = new Map();
  for (const [a, b] of runs) {
    const key = `${a},${b}`;
    if (active.has(key)) { next.set(key, active.get(key)); active.delete(key); }
    else next.set(key, y);
  }
  for (const [key, y0] of active) { const [a, b] = key.split(',').map(Number); rects.push([a, y0, b - a, y - y0]); }
  active = next;
}
const d = rects.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}z`).join('');
const meta = {
  width: W, height: H,
  wordmark: { left: minx / W, top: miny / H, width: ww / W, height: wh / H, pxWidth: ww, pxHeight: wh, path: d },
};
console.log(`vector wordmark: ${rects.length} rects`);
fs.writeFileSync('src/brand-meta.json', JSON.stringify(meta, null, 2));
console.log(`wordmark ${ww}x${wh}, logo anchor (wordmark centre in logo): ${((minx + ww / 2) / W).toFixed(4)}, ${((miny + wh / 2) / H).toFixed(4)}`);
