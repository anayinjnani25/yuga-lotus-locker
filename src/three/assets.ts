// All textures, materials and shared geometry for the box, baked once and cached.
// Ported from the reference scenes (carving bake: height map → colour + normal map).
import * as THREE from 'three';
import {
  mk, hc, heightOf, normalCanvas, grain, drawFrame, lotusMandala, chakra, torana, jaali,
  carvedPetal, rosette, drawYugaPicture, coinCanvas, innerHeight, paintInfo, fontsReady,
} from '../art/paint';
import { leafPt, petalPt } from '../art/shapes';
import { YUGAS } from '../data/yugas';

const SRGB = THREE.SRGBColorSpace;
function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = SRGB;
  t.anisotropy = 4;
  return t;
}
function normalTex(H: Float32Array, w: number, h: number, s: number) {
  return tex(normalCanvas(H, w, h, s), false);
}
interface Bake { map: THREE.Texture; normalMap: THREE.Texture }
function bakeCarving(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  opt: { base?: string; line?: string; strength?: number; paint?: (g: CanvasRenderingContext2D, w: number) => void } = {}): Bake {
  const hcv = mk(w, h), g = hcv.getContext('2d')!; draw(g, w, h);
  const H = heightOf(hcv, false, Math.max(1, Math.round(2 * w / 1024)));
  const wc = mk(w, h), wg = wc.getContext('2d')!; grain(wg, w, h, opt.base || '#6B4428', opt.line || '#2E1A0C');
  const wd = wg.getImageData(0, 0, w, h), d = wd.data;
  for (let i = 0; i < w * h; i++) {
    const hv = H[i], sh = 0.28 + 0.9 * hv, hi = hv > 0.86 ? (hv - 0.86) * 160 : 0;
    d[i * 4] = Math.min(255, d[i * 4] * sh + hi); d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] * sh + hi * 0.8); d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] * sh + hi * 0.5);
  }
  wg.putImageData(wd, 0, 0);
  if (opt.paint) { wg.save(); opt.paint(wg, w); wg.restore(); }
  return { map: tex(wc), normalMap: normalTex(H, w, h, (opt.strength || 9) * w / 1024) };
}

export const M = (c: number, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0, envMapIntensity: 0.5, ...o });
const W = (b: Bake, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ map: b.map, normalMap: b.normalMap, normalScale: new THREE.Vector2(1.5, 1.5), roughness: 0.62, envMapIntensity: 0.45, ...o });

export function sheet(nu: number, nv: number, fn: (u: number, v: number) => [number, number, number]) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nv; j++) { const v = j / nv; for (let i = 0; i <= nu; i++) { const u = i / nu * 2 - 1, p = fn(u, v); pos.push(p[0], p[1], p[2]); uv.push((u + 1) / 2, v); } }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private turns: number) { super(); }
  getPoint(t: number, o = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return o.set(this.r * Math.cos(a), t, this.r * Math.sin(a));
  }
}
const springCache = new Map<string, THREE.BufferGeometry>();
/** Unit-length coil spring along +Y (scale Y to stretch it). */
export function springGeo(r: number, turns: number, wire: number) {
  const k = `${r}|${turns}|${wire}`;
  let g = springCache.get(k);
  if (!g) { g = new THREE.TubeGeometry(new Helix(r, turns), Math.ceil(turns * 20), wire, 6, false); springCache.set(k, g); }
  return g;
}

/** Peg / socket outline shapes */
export function pegShape(kind: string, s: number) {
  const sh = new THREE.Shape();
  if (kind === 'circle') sh.absarc(0, 0, s, 0, Math.PI * 2, false);
  else if (kind === 'square') { const a = s * 0.88; sh.moveTo(-a, -a); sh.lineTo(a, -a); sh.lineTo(a, a); sh.lineTo(-a, a); sh.closePath(); }
  else if (kind === 'triangle') { for (let j = 0; j < 3; j++) { const a = Math.PI / 2 + j * Math.PI * 2 / 3; const x = Math.cos(a) * s * 1.2, y = Math.sin(a) * s * 1.2; if (j) sh.lineTo(x, y); else sh.moveTo(x, y); } sh.closePath(); }
  else { for (let j = 0; j < 10; j++) { const a = Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? s * 0.55 : s * 1.25; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (j) sh.lineTo(x, y); else sh.moveTo(x, y); } sh.closePath(); }
  return sh;
}

// ───────── dynamic LCD texture ─────────
const lcdCanvas = typeof document !== 'undefined' ? mk(512, 160) : (null as unknown as HTMLCanvasElement);
let lcdTexture: THREE.CanvasTexture | null = null;
export function drawLcd(l1: string, l2: string, on = true) {
  const g = lcdCanvas.getContext('2d')!;
  g.fillStyle = on ? '#9ED36A' : '#55704A'; g.fillRect(0, 0, 512, 160);
  g.fillStyle = 'rgba(0,0,0,.07)';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) g.fillRect(16 + c * 30, 20 + r * 66, 26, 52);
  g.fillStyle = '#1F3A10'; g.font = '700 46px "Courier New",monospace'; g.textBaseline = 'top';
  [l1, l2].forEach((l, r) => [...l.padEnd(16).slice(0, 16)].forEach((ch, c) => g.fillText(ch, 16 + c * 30, 24 + r * 66)));
  if (lcdTexture) lcdTexture.needsUpdate = true;
}

export type Assets = Awaited<ReturnType<typeof build>>;
let cached: Promise<Assets> | null = null;
export function loadAssets() {
  if (!cached) cached = fontsReady().then(() => new Promise<Assets>((res) => setTimeout(() => res(build()), 0)));
  return cached;
}

function build() {
  const t0 = performance.now();
  // shared metals and woods
  const brass = M(0xc9a04a, { metalness: 1, roughness: 0.3, envMapIntensity: 1 });
  const darkBrass = M(0x8a6a34, { metalness: 1, roughness: 0.45, envMapIntensity: 1 });
  const teakEdge = M(0x4e3020, { roughness: 0.8 }), teakIn = M(0x6e4a2e, { roughness: 0.75 });
  const springMat = M(0xbfc4c8, { metalness: 1, roughness: 0.25, envMapIntensity: 1.2 });
  const blk = M(0x151515, { roughness: 0.5 }), silver = M(0xc8ccd0, { metalness: 1, roughness: 0.3, envMapIntensity: 1 });
  const holeMat = M(0x0e0905);
  const jewel = M(0xc0303a, { roughness: 0.15, envMapIntensity: 1 });
  const ivory = M(0xf4f0e6);
  const card = M(0xd8cdb8, { side: THREE.DoubleSide });
  const tubeMat = M(0xe9e2d4, { side: THREE.DoubleSide, roughness: 0.8 });
  const tubeEdge = M(0xcfc6b4);
  const servoMat = M(0x2e62d6, { roughness: 0.35 });
  const hornMat = M(0xf4f4f4);
  const bbMat = M(0xe6e4dc);
  const capMat = M(0x1f3e8c, { roughness: 0.4 });
  const magnetMat = M(0x9aa0a8, { metalness: 1, roughness: 0.35, envMapIntensity: 1 });
  const stickMat = M(0xd9b98a, { roughness: 0.8 });
  const reedGlass = new THREE.MeshStandardMaterial({ color: 0xddf3ff, transparent: true, opacity: 0.5, roughness: 0.05, envMapIntensity: 1.5 });
  const microMat = M(0x1a1a1a);

  // carved panels
  const sz = 1024;
  const sideL = bakeCarving(sz, sz, (g, w) => { g.scale(w / 1024, w / 1024); drawFrame(g); lotusMandala(g, 512, 512, 288); });
  const sideR = bakeCarving(sz, sz, (g, w) => { g.scale(w / 1024, w / 1024); drawFrame(g); chakra(g, 512, 512, 288); });
  const front = bakeCarving(sz, sz, (g, w) => { g.scale(w / 1024, w / 1024); drawFrame(g); torana(g); });
  const lidB = bakeCarving(sz, sz, (g, w) => { g.scale(w / 1024, w / 1024); drawFrame(g); lotusMandala(g, 512, 512, 262); [[266, 266], [758, 266], [266, 758], [758, 758]].forEach((p) => chakra(g, p[0], p[1], 52)); });
  const inner = [0, 1, 2, 3].map((k) => bakeCarving(sz, sz, (g, w) => { g.scale(w / 1024, w / 1024); innerHeight(k, g); },
    { base: '#7C5334', line: '#3A2212', strength: 8, paint: (g, w) => { g.scale(w / 1024, w / 1024); paintInfo(k, g); } }));
  const bayJaali = bakeCarving(1024, 360, (g) => {
    g.fillStyle = hc(0.45); g.fillRect(0, 0, 1024, 360); g.fillStyle = hc(0.9); g.fillRect(0, 0, 1024, 26); g.fillRect(0, 334, 1024, 26);
    g.fillStyle = hc(0.12); g.fillRect(0, 26, 1024, 8); g.fillRect(0, 326, 1024, 8);
    jaali(g, 60, 52, 964, 308, false);
    rosette(g, 32, 180, 22); rosette(g, 992, 180, 22);
  }, { strength: 7 });
  const bayBand = bakeCarving(1024, 360, (g) => {
    g.fillStyle = hc(0.45); g.fillRect(0, 0, 1024, 360); g.fillStyle = hc(0.9); g.fillRect(0, 0, 1024, 26); g.fillRect(0, 334, 1024, 26);
    g.fillStyle = hc(0.12); g.fillRect(0, 26, 1024, 8); g.fillRect(0, 326, 1024, 8);
    for (let x = 26; x < 1024; x += 52) carvedPetal(g, x, 200, 46, 150, 0.68, 0.96);
    for (let x = 52; x < 1024; x += 104) rosette(g, x, 268, 30);
  }, { strength: 7 });
  const floorB = bakeCarving(512, 512, (g, w) => {
    g.scale(w / 1024, w / 1024); g.fillStyle = hc(0.5); g.fillRect(0, 0, 1024, 1024);
    g.strokeStyle = hc(0.1); g.lineWidth = 12; g.strokeRect(40, 40, 944, 944); g.strokeStyle = hc(0.9); g.lineWidth = 10; g.strokeRect(62, 62, 900, 900);
    g.save(); g.translate(512, 512); for (let j = 0; j < 28; j++) { g.rotate(Math.PI * 2 / 28); carvedPetal(g, 0, -360, 70, 90, 0.7, 0.95); } g.restore();
    [[108, 108], [916, 108], [108, 916], [916, 916]].forEach((p) => rosette(g, p[0], p[1], 34));
  }, { base: '#7C5334', line: '#3A2212' });

  const mats = {
    sideLOut: W(sideL), sideROut: W(sideR), frontOut: W(front), lidTop: W(lidB),
    inner: inner.map((b) => W(b, { normalScale: new THREE.Vector2(1.1, 1.1) })),
    bayJaali: W(bayJaali), bayBand: W(bayBand), floor: W(floorB),
  };

  // picture bands: one texture per band (top / middle / bottom strips of all four pictures)
  const bandTex = [0, 1, 2].map((row) => {
    const c = mk(1536, 128), g = c.getContext('2d')!;
    YUGAS.forEach((_, k) => {
      const big = mk(384, 384), bg = big.getContext('2d')!; drawYugaPicture(k, bg, 384, 384);
      g.drawImage(big, 0, row * 128, 384, 128, k * 384, 0, 384, 128);
    });
    g.strokeStyle = 'rgba(40,20,5,.5)'; g.lineWidth = 4;
    for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 384, 0); g.lineTo(k * 384, 128); g.stroke(); }
    const t = tex(c); t.wrapS = THREE.RepeatWrapping;
    return t;
  });

  // number wheels
  const wc = mk(512, 64), wg = wc.getContext('2d')!; grain(wg, 512, 64, '#7A5033', '#3A2212');
  wg.font = '800 34px Nunito'; wg.textAlign = 'center'; wg.textBaseline = 'middle';
  for (let i = 0; i < 10; i++) { wg.fillStyle = '#F2E2C0'; wg.fillText(String(i), 25.6 + i * 51.2, 33); wg.fillStyle = 'rgba(0,0,0,.35)'; wg.fillRect(i * 51.2, 0, 2, 64); }
  const wheelM = new THREE.MeshStandardMaterial({ map: tex(wc), roughness: 0.6 }), wheelSide = M(0x6a4428);

  // bronze leaf with verdigris
  const lc = mk(256, 512), lg = lc.getContext('2d')!; lg.fillStyle = hc(0.35); lg.fillRect(0, 0, 256, 512);
  lg.fillStyle = hc(0.85); lg.fillRect(0, 0, 10, 512); lg.fillRect(246, 0, 10, 512);
  lg.strokeStyle = hc(0.95); lg.lineCap = 'round'; lg.lineWidth = 12; lg.beginPath(); lg.moveTo(128, 512); lg.lineTo(128, 0); lg.stroke();
  for (let k = 1; k <= 7; k++) {
    const v0 = 0.05 + k * 0.1, y0 = (1 - v0) * 512, y1 = (1 - Math.min(0.98, v0 + 0.17)) * 512;
    [-1, 1].forEach((s) => { lg.lineWidth = 6; lg.strokeStyle = hc(0.82); lg.beginPath(); lg.moveTo(128, y0); lg.quadraticCurveTo(128 + s * 60, y0 - 26, 128 + s * 112, y1); lg.stroke(); });
  }
  const LH = heightOf(lc, false, 1);
  const lcc = mk(256, 512), lcg = lcc.getContext('2d')!, lim = lcg.createImageData(256, 512), ld = lim.data;
  for (let i = 0; i < 256 * 512; i++) {
    let r = 150, gg = 102, b = 56;
    const pol = Math.max(0, (LH[i] - 0.6) / 0.4); r += pol * 65; gg += pol * 52; b += pol * 34;
    const n = 0.5 + 0.5 * Math.sin(i * 0.013) * Math.sin(i * 0.00071);
    const pat = Math.min(1, Math.max(0, (0.5 - LH[i]) * 1.6) * (0.35 + n * 0.6));
    r = r * (1 - pat) + 70 * pat; gg = gg * (1 - pat) + 140 * pat; b = b * (1 - pat) + 118 * pat;
    ld[i * 4] = r; ld[i * 4 + 1] = gg; ld[i * 4 + 2] = b; ld[i * 4 + 3] = 255;
  }
  lcg.putImageData(lim, 0, 0);
  const leafMat = new THREE.MeshStandardMaterial({ map: tex(lcc), normalMap: normalTex(LH, 256, 512, 4), normalScale: new THREE.Vector2(1.2, 1.2), metalness: 0.85, roughness: 0.42, envMapIntensity: 1, side: THREE.DoubleSide });

  // copper petals
  const pc = mk(256, 512), pg = pc.getContext('2d')!; pg.fillStyle = hc(0.4); pg.fillRect(0, 0, 256, 512);
  pg.fillStyle = hc(0.92); pg.fillRect(0, 0, 12, 512); pg.fillRect(244, 0, 12, 512);
  for (let k = 1; k <= 6; k++) [-1, 1].forEach((s) => { pg.strokeStyle = hc(0.68); pg.lineWidth = 3; pg.beginPath(); pg.moveTo(128 + s * k * 17, 512); pg.lineTo(128 + s * k * 17, 20); pg.stroke(); });
  pg.strokeStyle = hc(0.9); pg.lineWidth = 8; pg.beginPath(); pg.moveTo(128, 512); pg.lineTo(128, 10); pg.stroke();
  const copper = new THREE.MeshStandardMaterial({ color: 0xd9825a, metalness: 1, roughness: 0.28, normalMap: normalTex(heightOf(pc, false, 1), 256, 512, 3.5), envMapIntensity: 1.25, side: THREE.DoubleSide });

  // coins
  const coinMats = YUGAS.map((y, k) => {
    const c = coinCanvas(k);
    return {
      face: new THREE.MeshStandardMaterial({ map: tex(c), normalMap: normalTex(heightOf(c, true, 1), 256, 256, 3), metalness: 1, roughness: y.rough, envMapIntensity: 1.2 }),
      rim: M(y.hex, { metalness: 1, roughness: y.rough, envMapIntensity: 1.2 }),
    };
  });
  const yugaMetal = YUGAS.map((y) => M(y.hex, { metalness: 1, roughness: 0.3, envMapIntensity: 1 }));

  // acrylic with soft highlight streaks
  const ac = mk(256, 256), ag = ac.getContext('2d')!; ag.fillStyle = 'rgba(255,255,255,.05)'; ag.fillRect(0, 0, 256, 256);
  ag.save(); ag.translate(128, 128); ag.rotate(-0.7);
  ([[-60, 26, 0.16], [-20, 8, 0.1], [40, 40, 0.08]] as number[][]).forEach(([x, w, a]) => { ag.fillStyle = `rgba(255,255,255,${a})`; ag.fillRect(x, -300, w, 600); });
  ag.restore();
  const acrylic = new THREE.MeshStandardMaterial({ color: 0xeaf6ff, map: tex(ac), transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0.1, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide });

  // keypad face
  const kc = mk(256, 320), kg = kc.getContext('2d')!; kg.fillStyle = '#3A2816'; kg.fillRect(0, 0, 256, 320);
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].forEach((t, j) => {
    const x = 48 + (j % 3) * 80, y = 46 + Math.floor(j / 3) * 76;
    kg.fillStyle = '#C9A04A'; kg.beginPath(); kg.arc(x, y, 30, 0, 7); kg.fill();
    kg.fillStyle = '#3A2816'; kg.textAlign = 'center'; kg.textBaseline = 'middle'; kg.font = '800 30px Nunito'; kg.fillText(t, x, y + 1);
  });
  const keypadMat = new THREE.MeshStandardMaterial({ map: tex(kc), normalMap: normalTex(heightOf(kc, false, 1), 256, 320, 3), metalness: 0.8, roughness: 0.35, envMapIntensity: 1 });

  // LCD
  lcdTexture = tex(lcdCanvas);
  drawLcd('Yuga Lotus Box', 'Code: ****');
  const lcdMat = new THREE.MeshBasicMaterial({ map: lcdTexture, toneMapped: false });

  // PCBs (seeded traces)
  let s = 3; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  function pcb(w: number, h: number, base: string, draw: (g: CanvasRenderingContext2D) => void) {
    const c = mk(w, h), g = c.getContext('2d')!; g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.25; g.strokeStyle = '#C9E2FF'; g.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) { g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 120, y); g.lineTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 80); g.stroke(); }
    g.globalAlpha = 1; draw(g);
    return new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.55 });
  }
  const unoMat = pcb(512, 400, '#0E6FA8', (g) => {
    g.fillStyle = '#F2F6FA'; g.font = '800 40px Nunito'; g.fillText('UNO', 300, 220); g.font = '700 22px Nunito'; g.fillText('ARDUINO', 300, 252);
    g.strokeStyle = '#F2F6FA'; g.lineWidth = 3; g.beginPath(); g.arc(240, 215, 26, 0, 7); g.stroke(); g.beginPath(); g.arc(190, 215, 26, 0, 7); g.stroke();
    g.fillStyle = '#E9D27A'; for (let i = 0; i < 14; i++) { g.fillRect(150 + i * 24, 18, 8, 8); g.fillRect(150 + i * 24, 372, 8, 8); }
  });
  const pcfMat = pcb(256, 112, '#2A2F8F', (g) => { g.fillStyle = '#EDEDF7'; g.font = '800 18px Nunito'; g.fillText('PCF8574', 90, 60); });
  const bc = mk(512, 340), bg2 = bc.getContext('2d')!; bg2.fillStyle = '#F2F0EA'; bg2.fillRect(0, 0, 512, 340);
  bg2.fillStyle = '#3A3A3A'; for (let x = 20; x < 500; x += 16) for (let y = 50; y < 300; y += 16) { if (y > 160 && y < 190) continue; bg2.fillRect(x, y, 5, 5); }
  bg2.fillStyle = '#D8402F'; bg2.fillRect(14, 14, 484, 3); bg2.fillRect(14, 322, 484, 3); bg2.fillStyle = '#2F5FD8'; bg2.fillRect(14, 36, 484, 3); bg2.fillRect(14, 300, 484, 3);
  bg2.fillStyle = '#DADAD2'; bg2.fillRect(0, 166, 512, 18);
  const breadboardTop = new THREE.MeshStandardMaterial({ map: tex(bc), roughness: 0.7 });

  // studio floor
  const fc = mk(512, 512), fg = fc.getContext('2d')!; const rg = fg.createRadialGradient(256, 256, 0, 256, 256, 256);
  rg.addColorStop(0, 'rgba(92,64,42,1)'); rg.addColorStop(0.6, 'rgba(40,26,16,.8)'); rg.addColorStop(1, 'rgba(17,11,7,0)');
  fg.fillStyle = rg; fg.fillRect(0, 0, 512, 512);
  const floorMat = new THREE.MeshStandardMaterial({ map: tex(fc), transparent: true, roughness: 0.9, depthWrite: false });

  // LED glow sprite
  const gc = mk(64, 64), gg2 = gc.getContext('2d')!; const gr = gg2.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gg2.fillStyle = gr; gg2.fillRect(0, 0, 64, 64);
  const glowTex = tex(gc);

  // environment for reflections
  const ec = mk(1024, 512), eg = ec.getContext('2d')!; const egr = eg.createLinearGradient(0, 0, 0, 512);
  egr.addColorStop(0, '#FFF0DC'); egr.addColorStop(0.45, '#B88A5C'); egr.addColorStop(0.55, '#4A3424'); egr.addColorStop(1, '#120B06');
  eg.fillStyle = egr; eg.fillRect(0, 0, 1024, 512);
  ([[240, 110, 120], [760, 140, 90], [520, 60, 70]] as number[][]).forEach(([x, y, rr]) => { const q = eg.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(1, 'rgba(255,255,255,0)'); eg.fillStyle = q; eg.fillRect(x - rr, y - rr, rr * 2, rr * 2); });
  const envTex = tex(ec); envTex.mapping = THREE.EquirectangularReflectionMapping;

  const geo = { leaf: sheet(24, 48, leafPt), petal: sheet(24, 48, petalPt) };
  console.info(`[yuga] textures baked in ${Math.round(performance.now() - t0)} ms`);

  return {
    brass, darkBrass, teakEdge, teakIn, springMat, blk, silver, holeMat, jewel, ivory, card, tubeMat, tubeEdge,
    servoMat, hornMat, bbMat, capMat, magnetMat, stickMat, reedGlass, microMat,
    mats, bandTex, wheelM, wheelSide, leafMat, copper, coinMats, yugaMetal, acrylic, keypadMat, lcdMat,
    unoMat, pcfMat, breadboardTop, floorMat, glowTex, envTex, geo,
  };
}
