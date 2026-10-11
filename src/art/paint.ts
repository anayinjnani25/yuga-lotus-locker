// Pure 2D-canvas painting, ported from reference/lotus-locker-3d.html and
// reference/yuga-locker-cutaway.html. No three.js here, so the Yugas page can use it too.
import { YUGAS } from '../data/yugas';
import { leafPt } from './shapes';

export const DISP = '"Yatra One",serif';
export type G = CanvasRenderingContext2D;

export function mk(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function hc(v: number) {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${c},${c},${c})`;
}
export function C(g: G, x: number, y: number, r: number, v: number) {
  g.fillStyle = hc(v); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}

// Seeded random so the baked wood grain looks the same on every load
let seed = 7;
export const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

export function blur(a: Float32Array, w: number, h: number, r: number) {
  const t = new Float32Array(a.length), o = new Float32Array(a.length), n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w; let s = 0;
    for (let x = -r; x <= r; x++) s += a[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { t[row + x] = s / n; s += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)]; }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { o[y * w + x] = s / n; s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; }
  }
  return o;
}
export function heightOf(canvas: HTMLCanvasElement, invert: boolean, r: number) {
  const w = canvas.width, h = canvas.height, d = canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
  let H = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { const l = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255; H[i] = invert ? 1 - l : l; }
  if (r) { H = blur(H, w, h, r); H = blur(H, w, h, r); }
  return H;
}
/** Height map → tangent-space normal map canvas */
export function normalCanvas(H: Float32Array, w: number, h: number, s: number) {
  const c = mk(w, h), g = c.getContext('2d')!, im = g.createImageData(w, h), d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const nx = (H[x > 0 ? i - 1 : i] - H[x < w - 1 ? i + 1 : i]) * s, ny = (H[y < h - 1 ? i + w : i] - H[y > 0 ? i - w : i]) * s;
    const l = Math.sqrt(nx * nx + ny * ny + 1);
    d[i * 4] = (nx / l * 0.5 + 0.5) * 255; d[i * 4 + 1] = (ny / l * 0.5 + 0.5) * 255; d[i * 4 + 2] = (1 / l * 0.5 + 0.5) * 255; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c;
}
export function grain(g: G, w: number, h: number, base: string, line: string) {
  g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line;
  for (let i = 0; i < 90; i++) {
    g.globalAlpha = 0.12 + rand() * 0.18; g.lineWidth = rand() * 2.2 + 0.4; g.beginPath();
    const y = rand() * h; g.moveTo(0, y);
    g.bezierCurveTo(w * 0.3, y + rand() * 24 - 12, w * 0.7, y + rand() * 24 - 12, w, y + rand() * 18 - 9); g.stroke();
  }
  g.globalAlpha = 1;
}
export function wrap(g: G, t: string, x: number, y: number, mw: number, lh: number) {
  const ws = t.split(' '); let line = '';
  for (const wd of ws) {
    const test = line ? line + ' ' + wd : wd;
    if (g.measureText(test).width > mw && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = test;
  }
  if (line) { g.fillText(line, x, y); y += lh; }
  return y;
}

// ───────── carving motifs (drawn as height maps in 1024 space) ─────────
function petalPath(g: G, x: number, yb: number, w: number, h: number) {
  g.beginPath(); g.moveTo(x - w / 2, yb);
  g.bezierCurveTo(x - w * 0.62, yb - h * 0.55, x - w * 0.2, yb - h * 0.8, x, yb - h);
  g.bezierCurveTo(x + w * 0.2, yb - h * 0.8, x + w * 0.62, yb - h * 0.55, x + w / 2, yb); g.closePath();
}
export function carvedPetal(g: G, x: number, yb: number, w: number, h: number, lo: number, hi: number) {
  g.fillStyle = hc(lo); petalPath(g, x, yb, w, h); g.fill();
  g.fillStyle = hc(hi); petalPath(g, x, yb - h * 0.1, w * 0.6, h * 0.7); g.fill();
  g.strokeStyle = hc(lo - 0.25); g.lineWidth = Math.max(2, w * 0.06);
  g.beginPath(); g.moveTo(x, yb - h * 0.12); g.lineTo(x, yb - h * 0.62); g.stroke();
}
export function rosette(g: G, x: number, y: number, r: number) {
  g.save(); g.translate(x, y); g.fillStyle = hc(0.95);
  for (let j = 0; j < 8; j++) { g.rotate(Math.PI / 4); g.beginPath(); g.ellipse(0, -r * 0.55, r * 0.2, r * 0.42, 0, 0, Math.PI * 2); g.fill(); }
  g.restore(); C(g, x, y, r * 0.28, 0.5); C(g, x, y, r * 0.14, 1);
}
function star(g: G, x: number, y: number, R: number, r: number, v: number) {
  g.fillStyle = hc(v); g.beginPath();
  for (let j = 0; j < 16; j++) { const a = j * Math.PI / 8, rr = j % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
export function drawFrame(g: G) {
  g.fillStyle = hc(0.85); g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = hc(0.1); g.fillRect(56, 56, 912, 912);
  g.fillStyle = hc(0.55); g.fillRect(66, 66, 892, 892);
  for (let t = 84; t <= 940; t += 28) [[t, 90], [t, 934], [90, t], [934, t]].forEach((p) => C(g, p[0], p[1], 10, 0.97));
  g.fillStyle = hc(0.12); g.fillRect(114, 114, 796, 796);
  g.fillStyle = hc(0.38); g.fillRect(122, 122, 780, 780);
  for (let s = 0; s < 4; s++) {
    g.save(); g.translate(512, 512); g.rotate(s * Math.PI / 2); g.translate(-512, -512);
    for (let x = 232; x <= 792; x += 44) carvedPetal(g, x, 196, 40, 68, 0.7, 0.96);
    g.restore();
  }
  [[159, 159], [865, 159], [159, 865], [865, 865]].forEach((p) => { g.fillStyle = hc(0.72); g.fillRect(p[0] - 34, p[1] - 34, 68, 68); rosette(g, p[0], p[1], 30); });
  g.fillStyle = hc(0.9); g.fillRect(196, 196, 632, 632);
  g.fillStyle = hc(0.14); g.fillRect(206, 206, 612, 612);
  g.fillStyle = hc(0.3); g.fillRect(212, 212, 600, 600);
}
export function lotusMandala(g: G, cx: number, cy: number, r: number) {
  C(g, cx, cy, r, 0.88); C(g, cx, cy, r * 0.95, 0.15);
  for (let j = 0; j < 40; j++) { const a = j * Math.PI / 20; C(g, cx + Math.cos(a) * r * 0.89, cy + Math.sin(a) * r * 0.89, r * 0.03, 0.97); }
  C(g, cx, cy, r * 0.83, 0.28);
  g.save(); g.translate(cx, cy);
  for (let j = 0; j < 16; j++) { g.rotate(Math.PI / 8); carvedPetal(g, 0, -r * 0.3, r * 0.26, r * 0.5, 0.6, 0.86); }
  g.rotate(Math.PI / 16);
  for (let j = 0; j < 8; j++) { g.rotate(Math.PI / 4); carvedPetal(g, 0, -r * 0.18, r * 0.3, r * 0.42, 0.74, 1); }
  g.restore();
  C(g, cx, cy, r * 0.24, 0.5); C(g, cx, cy, r * 0.2, 0.92);
  for (let j = 0; j < 7; j++) { const a = j * Math.PI * 2 / 7; C(g, cx + Math.cos(a) * r * 0.11, cy + Math.sin(a) * r * 0.11, r * 0.03, 0.3); }
  C(g, cx, cy, r * 0.035, 0.3);
}
export function chakra(g: G, cx: number, cy: number, r: number) {
  C(g, cx, cy, r, 0.9); C(g, cx, cy, r * 0.92, 0.22);
  for (let j = 0; j < 32; j++) { const a = j * Math.PI / 16; C(g, cx + Math.cos(a) * r * 0.96, cy + Math.sin(a) * r * 0.96, r * 0.026, 0.99); }
  C(g, cx, cy, r * 0.84, 0.88); C(g, cx, cy, r * 0.74, 0.14);
  g.save(); g.translate(cx, cy);
  for (let j = 0; j < 8; j++) { g.rotate(Math.PI / 4); g.fillStyle = hc(0.86); g.fillRect(-r * 0.05, -r * 0.75, r * 0.1, r * 0.75); }
  g.rotate(Math.PI / 8);
  for (let j = 0; j < 8; j++) { g.rotate(Math.PI / 4); g.fillStyle = hc(0.68); g.fillRect(-r * 0.02, -r * 0.75, r * 0.04, r * 0.75); }
  g.restore();
  for (let j = 0; j < 8; j++) {
    const a = j * Math.PI / 4 - Math.PI / 2;
    C(g, cx + Math.cos(a) * r * 0.47, cy + Math.sin(a) * r * 0.47, r * 0.09, 0.97);
    C(g, cx + Math.cos(a) * r * 0.47, cy + Math.sin(a) * r * 0.47, r * 0.045, 0.55);
  }
  C(g, cx, cy, r * 0.26, 0.9); rosette(g, cx, cy, r * 0.22);
}
export function torana(g: G) {
  g.fillStyle = hc(0.06); g.beginPath(); g.moveTo(292, 800); g.lineTo(292, 460);
  g.ellipse(512, 460, 220, 230, 0, Math.PI, Math.PI * 2); g.lineTo(732, 800); g.closePath(); g.fill();
  for (let j = 1; j < 8; j++) { const a = Math.PI + j * Math.PI / 8; C(g, 512 + Math.cos(a) * 220, 460 + Math.sin(a) * 230, 26, 0.06); }
  g.strokeStyle = hc(0.88); g.lineWidth = 22; g.beginPath(); g.ellipse(512, 460, 264, 272, 0, Math.PI, Math.PI * 2); g.stroke();
  g.strokeStyle = hc(1); g.lineWidth = 5; g.beginPath(); g.ellipse(512, 460, 264, 272, 0, Math.PI, Math.PI * 2); g.stroke();
  [226, 744].forEach((x) => {
    g.fillStyle = hc(0.86); g.fillRect(x, 450, 54, 340);
    g.strokeStyle = hc(0.45); g.lineWidth = 5;
    [14, 27, 40].forEach((o) => { g.beginPath(); g.moveTo(x + o, 470); g.lineTo(x + o, 770); g.stroke(); });
    g.fillStyle = hc(0.97); g.fillRect(x - 12, 428, 78, 26); g.fillRect(x - 12, 782, 78, 26);
    C(g, x + 27, 441, 10, 0.6);
  });
  rosette(g, 258, 258, 42); rosette(g, 766, 258, 42);
  for (let j = 0; j < 5; j++) carvedPetal(g, 412 + j * 50, 812, 40, 30, 0.7, 0.95);
}
export function jaali(g: G, x0 = 212, y0 = 212, x1 = 812, y1 = 812, withMandala = true) {
  g.fillStyle = hc(0.8); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let x = x0 + 30; x <= x1 - 30; x += 60) for (let y = y0 + 30; y <= y1 - 30; y += 60) {
    star(g, x, y, 24, 11, 0.08);
    if (x < x1 - 30 && y < y1 - 30) { g.save(); g.translate(x + 30, y + 30); g.rotate(Math.PI / 4); g.fillStyle = hc(0.08); g.fillRect(-7, -7, 14, 14); g.restore(); }
  }
  if (withMandala) { C(g, 512, 512, 200, 0.25); lotusMandala(g, 512, 512, 185); }
}

// ───────── painted miniatures ─────────
export function bull(g: G, cx: number, cy: number, s: number, legs: number) {
  const o = '#4A3020'; g.lineWidth = 3; g.strokeStyle = o; g.fillStyle = '#F4EEE2';
  const L = [-0.38, 0.36, -0.24, 0.48];
  for (let i = 0; i < legs; i++) { g.beginPath(); g.rect(cx + L[i] * s - 5, cy + s * 0.12, 10, s * 0.34); g.fill(); g.stroke(); }
  g.fillStyle = '#F4EEE2'; g.beginPath(); g.ellipse(cx, cy, s * 0.55, s * 0.27, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(cx - s * 0.28, cy - s * 0.24, s * 0.14, s * 0.1, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(cx - s * 0.62, cy - s * 0.08, s * 0.14, s * 0.18, -0.4, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(cx - s * 0.66, cy - s * 0.22); g.lineTo(cx - s * 0.76, cy - s * 0.4); g.moveTo(cx - s * 0.56, cy - s * 0.24); g.lineTo(cx - s * 0.5, cy - s * 0.42); g.stroke();
  g.beginPath(); g.moveTo(cx + s * 0.55, cy - s * 0.05); g.quadraticCurveTo(cx + s * 0.72, cy + s * 0.05, cx + s * 0.66, cy + s * 0.3); g.stroke();
  g.fillStyle = '#C8322A'; g.beginPath(); g.ellipse(cx + s * 0.05, cy - s * 0.12, s * 0.26, s * 0.12, 0, 0, 7); g.fill();
  g.fillStyle = '#E0B050'; for (let j = -2; j <= 2; j++) { g.beginPath(); g.arc(cx + s * 0.05 + j * s * 0.1, cy - s * 0.02, 2.5, 0, 7); g.fill(); }
}

/** Painted miniature scene with the dharma bull, framed. */
export function drawScene(k: number, g: G, x: number, y: number, w: number, h: number) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y);
  const sky = [['#FFE9A8', '#F7B64A'], ['#FFD39A', '#E4773A'], ['#D8F0EE', '#6FB5B5'], ['#CFCBC5', '#6E6A66']][k];
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const ground = ['#7FA65A', '#B8864A', '#6E9E4E', '#4A4642'][k];
  if (k === 0) {
    g.fillStyle = '#F08A1C'; g.beginPath(); g.arc(w * 0.78, h * 0.2, 26, 0, 7); g.fill(); g.strokeStyle = '#F08A1C'; g.lineWidth = 4;
    for (let j = 0; j < 12; j++) { const a = j * Math.PI / 6; g.beginPath(); g.moveTo(w * 0.78 + Math.cos(a) * 32, h * 0.2 + Math.sin(a) * 32); g.lineTo(w * 0.78 + Math.cos(a) * 42, h * 0.2 + Math.sin(a) * 42); g.stroke(); }
    g.fillStyle = '#A9C47A'; g.beginPath(); g.moveTo(0, h * 0.62); g.quadraticCurveTo(w * 0.3, h * 0.38, w * 0.55, h * 0.6); g.quadraticCurveTo(w * 0.8, h * 0.42, w, h * 0.6); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#6B4428'; g.fillRect(24, h * 0.36, 12, h * 0.46); g.fillStyle = '#4F8A3A';
    [[30, h * 0.32, 30], [14, h * 0.42, 20], [48, h * 0.42, 22]].forEach((c) => { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 7); g.fill(); });
    g.strokeStyle = '#E0B050'; g.lineWidth = 2; g.beginPath(); g.arc(w * 0.3, h * 0.5, 20, 0, 7); g.stroke();
    g.fillStyle = '#E8792B'; g.beginPath(); g.moveTo(w * 0.3 - 26, h * 0.7); g.lineTo(w * 0.3 + 26, h * 0.7); g.lineTo(w * 0.3, h * 0.52); g.fill();
    g.fillStyle = '#C88A5A'; g.beginPath(); g.arc(w * 0.3, h * 0.5, 11, 0, 7); g.fill();
  }
  if (k === 1) {
    g.fillStyle = '#B85A2E'; g.fillRect(w * 0.45, h * 0.4, w * 0.5, h * 0.3);
    [[0.52, 0.4, 16], [0.7, 0.36, 22], [0.88, 0.4, 16]].forEach((d) => { g.beginPath(); g.arc(w * d[0], h * d[1], d[2], Math.PI, 0); g.fill(); });
    g.fillStyle = '#E4A060'; for (let j = 0; j < 5; j++) g.fillRect(w * 0.5 + j * 24, h * 0.5, 8, 14);
    g.strokeStyle = '#5A2A10'; g.lineWidth = 5; g.beginPath(); g.arc(w * 0.28, h * 0.24, 40, Math.PI * 0.7, Math.PI * 1.3); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(w * 0.28 + 40 * Math.cos(Math.PI * 0.7), h * 0.24 + 40 * Math.sin(Math.PI * 0.7)); g.lineTo(w * 0.28 + 40 * Math.cos(Math.PI * 1.3), h * 0.24 + 40 * Math.sin(Math.PI * 1.3)); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.08, h * 0.24); g.lineTo(w * 0.4, h * 0.24); g.stroke(); g.fillStyle = '#5A2A10';
    g.beginPath(); g.moveTo(w * 0.44, h * 0.24); g.lineTo(w * 0.38, h * 0.2); g.lineTo(w * 0.38, h * 0.28); g.fill();
    g.fillStyle = '#9A4A2A'; g.fillRect(w * 0.08, h * 0.66, 50, 24); g.strokeStyle = '#5A2A10'; g.lineWidth = 1.5; g.strokeRect(w * 0.08, h * 0.66, 50, 24);
    ([['#E4502A', 0, 30], ['#F2A020', 8, 22], ['#FFE070', 14, 12]] as [string, number, number][]).forEach((f) => {
      g.fillStyle = f[0]; g.beginPath(); g.moveTo(w * 0.08 + f[1], h * 0.66); g.quadraticCurveTo(w * 0.08 + 25, h * 0.66 - f[2] * 2, w * 0.08 + 50 - f[1], h * 0.66); g.fill();
    });
  }
  if (k === 2) {
    g.fillStyle = '#7AA85A'; g.beginPath(); g.moveTo(w * 0.3, h * 0.72); g.quadraticCurveTo(w * 0.62, h * 0.18, w * 1.05, h * 0.72); g.fill();
    g.fillStyle = '#3F7A3A'; [[0.6, 0.4], [0.72, 0.46], [0.52, 0.5], [0.84, 0.56]].forEach((d) => { g.beginPath(); g.arc(w * d[0], h * d[1], 7, 0, 7); g.fill(); });
    g.save(); g.translate(w * 0.26, h * 0.3); g.rotate(-0.6); g.fillStyle = '#7A3E14'; g.fillRect(-60, -6, 120, 12); g.fillStyle = '#F2D6A0';
    for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(-36 + j * 16, 0, 3, 0, 7); g.fill(); } g.restore();
    g.strokeStyle = '#2F7D4F'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.14, h * 0.52); g.quadraticCurveTo(w * 0.1, h * 0.3, w * 0.16, h * 0.1); g.stroke();
    g.fillStyle = '#2F9A6A'; g.beginPath(); g.ellipse(w * 0.16, h * 0.14, 11, 20, 0.1, 0, 7); g.fill(); g.fillStyle = '#1E5AA8'; g.beginPath(); g.ellipse(w * 0.16, h * 0.14, 6, 9, 0.1, 0, 7); g.fill();
  }
  if (k === 3) {
    g.fillStyle = '#45454C'; [[0.05, 0.42, 0.18], [0.26, 0.3, 0.16], [0.46, 0.48, 0.14], [0.64, 0.36, 0.16], [0.84, 0.46, 0.16]].forEach((b) => g.fillRect(w * b[0], h * b[1], w * b[2], h * (0.84 - b[1])));
    g.fillStyle = '#F2C94C'; for (let j = 0; j < 18; j++) g.fillRect(w * (0.08 + (j % 6) * 0.15), h * (0.5 + Math.floor(j / 6) * 0.09), 6, 8);
    g.fillStyle = '#3A3A40'; g.fillRect(w * 0.3, h * 0.1, 12, h * 0.2); g.fillRect(w * 0.7, h * 0.14, 12, h * 0.22);
    g.fillStyle = 'rgba(90,90,95,.55)'; [[0.32, 0.07, 12], [0.36, 0.02, 16], [0.72, 0.1, 12], [0.77, 0.05, 15]].forEach((c) => { g.beginPath(); g.arc(w * c[0], h * c[1], c[2], 0, 7); g.fill(); });
    g.fillStyle = '#2A2C30'; g.beginPath(); for (let j = 0; j < 16; j++) { const r = j % 2 ? 18 : 24, a = j * Math.PI / 8; g.lineTo(w * 0.14 + Math.cos(a) * r, h * 0.2 + Math.sin(a) * r); } g.fill();
    g.fillStyle = sky[0]; g.beginPath(); g.arc(w * 0.14, h * 0.2, 7, 0, 7); g.fill();
  }
  g.fillStyle = ground; g.fillRect(0, h * 0.83, w, h * 0.17);
  bull(g, w * 0.62, h * 0.68, 92 * Math.min(1, w / 248), YUGAS[k].legs);
  g.restore();
  g.strokeStyle = '#A82A22'; g.lineWidth = 7; g.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  g.strokeStyle = '#E0B050'; g.lineWidth = 2; g.strokeRect(x + 9, y + 9, w - 18, h - 18);
}

/** One whole yuga picture for the puzzle bands (from the play-through tiles). */
export function drawYugaPicture(k: number, g: G, w: number, h: number) {
  const y = YUGAS[k], ink = k === 3 ? '#F0F0F0' : y.dark;
  g.fillStyle = y.bg; g.fillRect(0, 0, w, h);
  g.lineWidth = 6; g.strokeStyle = ink; g.globalAlpha = 0.5; g.strokeRect(10, 10, w - 20, h - 20); g.globalAlpha = 1;
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '50px ' + DISP; g.fillText(y.en, w / 2, 58); g.font = '800 24px Nunito'; g.fillText('Yuga', w / 2, 104);
  const cx = w / 2, cy = 192; g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'round';
  if (k === 0) {
    g.fillStyle = '#C86A00'; g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.fill(); g.strokeStyle = '#C86A00'; g.lineWidth = 7;
    for (let j = 0; j < 12; j++) { const a = j * Math.PI / 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44); g.lineTo(cx + Math.cos(a) * 58, cy + Math.sin(a) * 58); g.stroke(); }
  }
  if (k === 1) {
    g.lineWidth = 7; g.beginPath(); g.arc(cx + 40, cy, 60, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 8, cy - 56); g.lineTo(cx - 8, cy + 56); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 60, cy); g.lineTo(cx + 50, cy); g.stroke();
    g.beginPath(); g.moveTo(cx + 62, cy); g.lineTo(cx + 44, cy - 12); g.lineTo(cx + 44, cy + 12); g.fill();
  }
  if (k === 2) {
    g.save(); g.translate(cx, cy + 20); g.rotate(-0.35); g.fillStyle = '#6B3A12'; g.fillRect(-70, -9, 140, 18);
    g.fillStyle = y.bg; for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(-40 + j * 20, 0, 4, 0, 7); g.fill(); } g.restore();
    g.strokeStyle = '#2F7D4F'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 30, cy + 30); g.quadraticCurveTo(cx + 20, cy - 20, cx + 10, cy - 50); g.stroke();
    g.fillStyle = '#2F9A6A'; g.beginPath(); g.ellipse(cx + 10, cy - 44, 14, 24, 0.2, 0, 7); g.fill();
    g.fillStyle = '#1E5AA8'; g.beginPath(); g.ellipse(cx + 10, cy - 44, 7, 11, 0.2, 0, 7); g.fill();
  }
  if (k === 3) {
    g.fillStyle = '#B8BDC6'; g.beginPath(); for (let j = 0; j < 16; j++) { const r = j % 2 ? 38 : 50, a = j * Math.PI / 8; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.fill();
    g.fillStyle = y.bg; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
  }
  const by = 318; g.fillStyle = ink; g.fillRect(cx - 80, by - 44, 160, 10);
  for (let j = 0; j < y.legs; j++) { const x = cx - (y.legs - 1) * 24 + j * 48; g.fillRect(x - 7, by - 34, 14, 58); }
  g.font = '700 18px Nunito'; g.fillText('Dharma: ' + y.legs + (y.legs > 1 ? ' legs' : ' leg'), cx, 362);
}

export function coinCanvas(k: number, size = 256) {
  const y = YUGAS[k], c = mk(size, size), g = c.getContext('2d')!;
  g.scale(size / 256, size / 256);
  g.fillStyle = y.metal; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = y.dark; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 96, 0, 7); g.stroke();
  g.fillStyle = y.dark; for (let j = 0; j < 24; j++) { const a = j * Math.PI / 12; g.beginPath(); g.arc(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104, 2.6, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 50; g.font = fs + 'px ' + DISP;
  while (g.measureText(y.en.toUpperCase()).width > 160 && fs > 24) { fs -= 2; g.font = fs + 'px ' + DISP; }
  g.fillText(y.en.toUpperCase(), 128, 112);
  g.font = '800 22px Nunito'; g.fillText('YUGA', 128, 156);
  for (let j = 0; j < y.legs; j++) g.fillRect(128 - (y.legs - 1) * 11 + j * 22 - 4, 182, 8, 18);
  return c;
}

// ───────── inner wall info panels ─────────
function titleFont(g: G, t: string) {
  let s = 84; g.font = s + 'px ' + DISP;
  while (g.measureText(t).width > 620 && s > 40) { s -= 4; g.font = s + 'px ' + DISP; }
}
function plaque(g: G, x: number, y: number, w: number, h: number) { g.fillStyle = hc(0.1); g.fillRect(x - 10, y - 10, w + 20, h + 20); g.fillStyle = hc(0.7); g.fillRect(x, y, w, h); }
function ivory(g: G, x: number, y: number, w: number, h: number) {
  g.fillStyle = '#EEE0C0'; g.fillRect(x, y, w, h); g.strokeStyle = '#8A5A2B'; g.lineWidth = 3; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
  g.fillStyle = '#8A5A2B'; [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]].forEach((p) => { g.beginPath(); g.arc(p[0], p[1], 6, 0, 7); g.fill(); });
}
/** Height map for an inner wall: frame, plaques and the carved leaf seat. */
export function innerHeight(k: number, g: G) {
  g.fillStyle = hc(0.55); g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = hc(0.1); g.lineWidth = 12; g.strokeRect(40, 40, 944, 944);
  g.strokeStyle = hc(0.9); g.lineWidth = 10; g.strokeRect(62, 62, 900, 900);
  [[108, 108], [916, 108], [108, 916], [916, 916]].forEach((p) => rosette(g, p[0], p[1], 34));
  const t = YUGAS[k].en.toUpperCase() + ' YUGA';
  g.fillStyle = hc(0.97); g.textAlign = 'center'; g.textBaseline = 'middle'; titleFont(g, t); g.fillText(t, 512, 146);
  plaque(g, 86, 262, 248, 320); plaque(g, 86, 600, 248, 344); plaque(g, 690, 262, 248, 682);
  const X = (x: number) => 512 + x * 256, Y = (y: number) => (1 - (0.7 + y) / 4) * 1024;
  g.strokeStyle = hc(0.12); g.lineWidth = 18; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(-0.35)); g.stroke();
  g.beginPath(); for (let j = 0; j <= 60; j++) { const p = leafPt(-1, j / 60); g.lineTo(X(p[0]), Y(p[1])); }
  for (let j = 60; j >= 0; j--) { const p = leafPt(1, j / 60); g.lineTo(X(p[0]), Y(p[1])); } g.closePath();
  g.fillStyle = hc(0.14); g.fill(); g.strokeStyle = hc(0.92); g.lineWidth = 12; g.stroke();
}
/** Colour paint on top of the inner-wall carving: name, miniature, avatars and facts. */
export function paintInfo(k: number, g: G) {
  const Y = YUGAS[k], t = Y.en.toUpperCase() + ' YUGA';
  g.textAlign = 'center'; g.textBaseline = 'middle'; titleFont(g, t); g.fillStyle = 'rgba(232,184,86,.9)'; g.fillText(t, 512, 146);
  g.font = 'italic 700 32px Nunito'; g.fillStyle = '#F3D9A0'; g.fillText(Y.sub, 512, 214);
  drawScene(k, g, 86, 262, 248, 278);
  g.fillStyle = '#EEE0C0'; g.fillRect(86, 540, 248, 42); g.fillStyle = '#3A2414'; g.font = '700 19px Nunito';
  g.fillText('Dharma bull on ' + Y.legs + (Y.legs > 1 ? ' legs' : ' leg'), 210, 562);
  ivory(g, 86, 600, 248, 344); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#8A3A12'; g.font = '28px ' + DISP; g.fillText('Avatars', 210, 652);
  g.fillStyle = '#3A2414'; g.font = '700 21px Nunito'; let y = 688;
  Y.avatars.forEach((a) => { y = wrap(g, a, 210, y, 210, 26) + 4; });
  y += 10; g.fillStyle = '#8A3A12'; g.font = '800 18px Nunito'; g.fillText('SYMBOL', 210, y); y += 28;
  g.fillStyle = '#3A2414'; g.font = '700 21px Nunito'; y = wrap(g, Y.symbol, 210, y, 210, 26) + 8;
  g.fillStyle = '#8A3A12'; g.font = '800 18px Nunito'; g.fillText('COIN', 210, y); y += 28;
  g.fillStyle = '#3A2414'; g.font = '700 21px Nunito'; g.fillText(Y.metalName, 210, y);
  ivory(g, 690, 262, 248, 682);
  g.fillStyle = '#8A3A12'; g.font = '28px ' + DISP; g.fillText('About this age', 814, 314);
  y = 362;
  ([['LASTS', Y.years], ['DHARMA', 'Stands on ' + Y.legs + (Y.legs > 1 ? ' legs' : ' leg')], ['PEOPLE LIVED', Y.life], ['PATH TO GOD', Y.path]] as [string, string][]).forEach(([l, v]) => {
    g.fillStyle = '#8A3A12'; g.font = '800 18px Nunito'; g.fillText(l, 814, y); y += 30;
    g.fillStyle = '#3A2414'; g.font = '700 23px Nunito'; y = wrap(g, v, 814, y, 206, 28) + 14;
  });
  g.strokeStyle = '#8A5A2B'; g.lineWidth = 2; g.beginPath(); g.moveTo(740, y - 6); g.lineTo(888, y - 6); g.stroke(); y += 24;
  g.fillStyle = '#3A2414'; g.font = '400 22px Nunito'; wrap(g, Y.about, 814, y, 206, 29);
}

export async function fontsReady() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('40px "Yatra One"', 'SATYA'),
        document.fonts.load('800 20px "Nunito"', '1'),
        document.fonts.load('700 20px "Nunito"', '1'),
        document.fonts.load('400 20px "Nunito"', '1'),
        document.fonts.load('italic 700 20px "Nunito"', '1'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fall back to system fonts */ }
}
