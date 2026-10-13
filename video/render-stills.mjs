// Renders the product stills for the video straight from the 3D model (render mode).
// Usage: node video/render-stills.mjs [baseUrl] [filter]   — dev server must be running.
// Output: video/images/NN-name.png at 2560×1440.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:5173/';
const only = process.argv[3];
const OUT = 'video/images';
mkdirSync(OUT, { recursive: true });

const ALL = ['rgb(255,170,0)', 'rgb(255,170,0)', 'rgb(190,200,220)', 'rgb(190,200,220)', 'rgb(230,100,40)', 'rgb(230,100,40)', 'rgb(80,90,110)', 'rgb(80,90,110)'];
const OPEN = { base: 'explore', leds: ALL, lcd: ['Collect coins!', '* to close'] };
const LOCK = { base: 'locked' };
const C = [0, 0.9, 0];
const S = (name, title, spec) => ({ name, title, ...spec });

export const SHOTS = [
  // ── exterior, box locked ──
  S('hero-front-right', 'Hero: front-right three-quarter, locked', { ...LOCK, cam: [[8.6, 4.4, 11.6], [0, 0.9, 0]] }),
  S('front', 'Front view', { ...LOCK, cam: [[0, 1, 16], C] }),
  S('rear', 'Rear view through the clear acrylic back', { ...LOCK, cam: [[0, 1.2, -16], C] }),
  S('left', 'Left side: lotus mandala', { ...LOCK, cam: [[-16, 1, 0], C] }),
  S('right', 'Right side: Konark chakra', { ...LOCK, cam: [[16, 1, 0], C] }),
  S('top', 'Top view: mandala lid', { ...LOCK, cam: [[0, 17, 0.01], C] }),
  S('bottom', 'Low view: brass plinth, feet and drawer layer', { ...LOCK, cam: [[7, -4.2, 8], [0, -1.2, 0]] }),
  S('front-left-34', 'Front-left three-quarter', { ...LOCK, cam: [[-10, 5, 11], C] }),
  S('front-right-34', 'Front-right three-quarter', { ...LOCK, cam: [[10, 5, 11], C] }),
  S('rear-left-34', 'Rear-left three-quarter', { ...LOCK, cam: [[-10, 5, -11], C] }),
  S('rear-right-34', 'Rear-right three-quarter', { ...LOCK, cam: [[10, 5, -11], C] }),
  // ── exterior close-ups ──
  S('cu-torana', 'Close-up: temple-arch carving (front)', { ...LOCK, cam: [[0, 2.3, 7.8], [0, 2.3, 2.3]] }),
  S('cu-chakra', 'Close-up: Konark chakra carving (right)', { ...LOCK, cam: [[7.8, 2.3, 0], [2.3, 2.3, 0]] }),
  S('cu-mandala', 'Close-up: lotus mandala carving (left)', { ...LOCK, cam: [[-7.8, 2.3, 0], [-2.3, 2.3, 0]] }),
  S('cu-lid', 'Close-up: lid mandala with four small wheels', { ...LOCK, cam: [[0.4, 10.5, 0.5], [0, 4.7, 0]] }),
  S('cu-keypad-lcd', 'Close-up: keypad and screen', { ...LOCK, cam: [[0, -0.4, 5.6], [-0.1, -0.95, 2.4]] }),
  S('cu-money-slot', 'Close-up: money slot in the drawer front', { ...LOCK, cam: [[0.7, -1.5, 4.6], [0, -2.1, 2.3]] }),
  S('cu-jaali', 'Close-up: jaali lattice on the base', { ...LOCK, cam: [[-5.8, -0.6, 2], [-2.3, -1.3, 0.2]] }),
  S('cu-foot', 'Close-up: brass plinth and foot', { ...LOCK, cam: [[4.4, -1.7, 4.8], [2.35, -2.6, 2.35]] }),
  S('rear-inside-locked', 'Through the acrylic back: the scrambled puzzle', { ...LOCK, cam: [[-3, 3, -9], [0, 1.2, 0]] }),
  // ── stage 1: code lock ──
  S('s1-lid-open', 'Stage 1: code accepted, lid popped up', { ...LOCK, pose: { lid: 1, lidServo: 1, wheels: 1, bolt: 1 }, lcd: ['Unlocked!', 'Open the box'], cam: [[8, 8, 10], [0, 2, 0]] }),
  S('s1-dial-lock', 'Stage 1 (mechanical): number wheels at 1-7-0-9 and the bolt', { ...LOCK, view: { mode: 'mechanical' }, pose: { lid: 1, wheels: 1, bolt: 1 }, cam: [[0.6, 5.0, -0.2], [0.2, 3.9, 1.8]] }),
  // ── stage 2: walls ──
  S('s2-walls-open', 'Stage 2: walls folded open like a flower', { ...LOCK, pose: { lid: 1, lidServo: 1, wheels: 1, bolt: 1, walls: 1 }, cam: [[-8, 11, -9], [0, 0, 0]] }),
  S('s2-panel-satya', 'Inside the front wall: the Satya Yuga panel', { ...LOCK, pose: { lid: 1, wheels: 1, bolt: 1, walls: 1 }, cam: [[0, 8.6, 4.75], [0, 0, 4.6]] }),
  S('s2-panel-kali', 'Under the lid: the Kali Yuga panel', { ...OPEN, cam: [[0, 7.6, -4], [0, 7.0, 3.2]] }),
  // ── stage 3: picture puzzle ──
  S('s3-bands-scrambled', 'Stage 3: picture bands scrambled', { ...LOCK, pose: { lid: 1, wheels: 1, bolt: 1, walls: 1 }, cam: [[1.6, 2.6, 4.8], [0, 1.8, 0]] }),
  S('s3-bands-solved', 'Stage 3: picture bands solved, pictures whole', { ...LOCK, pose: { lid: 1, wheels: 1, bolt: 1, walls: 1, bands: [0, 0, 0] }, cam: [[1.6, 2.6, 4.8], [0, 1.8, 0]] }),
  // ── stage 4: leaves and ring ──
  S('s4-sockets', 'Stage 4: the four shaped sockets', { ...LOCK, pose: { lid: 1, wheels: 1, bolt: 1, walls: 1, bands: [0, 0, 0] }, cam: [[2.4, 1.3, 2.6], [0.6, 0.43, 0.6]] }),
  S('s4-leaf', 'Stage 4: bronze peepal leaf in its socket', { ...OPEN, pose: { walls: 1 }, cam: [[3.6, 2.6, 3.8], [0.9, 1.0, 0.9]] }),
  S('s4-ring-aligned', 'Stage 4: ring hole lined up with the button', { ...OPEN, pose: { walls: 1, fire: 0 }, cam: [[3.3, 1.1, 1.5], [1.0, 0.45, 0]] }),
  // ── stage 5: trigger and lotus ──
  S('s5-trigger-cocked', 'Stage 5 (mechanical): catch holds the rod down', { ...OPEN, view: { mode: 'mechanical', hideWalls: true }, pose: { walls: 1, fire: 0, button: 0 }, leds: undefined, cam: [[0.9, 1.1, -2.7], [0.35, 0.6, 0]] }),
  S('s5-trigger-button', 'Stage 5 (mechanical): button pushes the catch lever', { ...OPEN, view: { mode: 'mechanical', hideWalls: true }, pose: { walls: 1, fire: 0, button: 1 }, leds: undefined, cam: [[0.9, 1.1, -2.7], [0.35, 0.6, 0]] }),
  S('s5-trigger-fired', 'Stage 5 (mechanical): spring shoots the rod up', { ...OPEN, view: { mode: 'mechanical', hideWalls: true }, pose: { walls: 1, fire: 1, button: 0 }, leds: undefined, cam: [[0.9, 1.1, -2.7], [0.35, 0.6, 0]] }),
  S('s5-servo', 'Stage 5 (electronic): the lotus servo lifts the rod', { ...OPEN, select: 'servo-lotus', glow: ['push-rod'], pose: { walls: 1 }, cam: [[3.4, 0.4, -3.4], [0, -0.1, 0]] }),
  S('s5-lotus-closed', 'Stage 5: copper lotus closed', { ...OPEN, pose: { walls: 1, fire: 0 }, leds: undefined, cam: [[-2.8, 4.8, -3.6], [0, 3.1, 0]] }),
  S('s5-lotus-open', 'Stage 5: lotus open, four yuga coins', { ...OPEN, pose: { walls: 1 }, cam: [[-2.8, 4.8, -3.6], [0, 3.1, 0]] }),
  S('s5-coin', 'Close-up: Satya gold coin on its petal', { ...OPEN, pose: { walls: 1 }, cam: [[2.2, 5.0, 2.4], [0.7, 3.7, 0.7]] }),
  S('s5-neopixel', 'Close-up: NeoPixel ring glowing in the yuga colours', { ...OPEN, pose: { walls: 1 }, cam: [[2.5, 3.15, -2.5], [0, 2.9, 0]] }),
  // ── piggy bank ──
  S('bank-drawer-open', 'Piggy bank: treasury drawer pushed out', { ...OPEN, pose: { walls: 1, drawer: 1 }, cam: [[5.5, 1.8, 10], [0.3, -1.6, 3.0]] }),
  S('bank-drawer-close', 'Piggy bank: coins and notes inside', { ...OPEN, pose: { walls: 1, drawer: 1 }, cam: [[4.6, -1.1, 5.4], [0.4, -2.25, 2.7]] }),
  S('bank-release', 'Piggy bank: release string lifts the drawer catch', { ...OPEN, view: { mode: 'mechanical' }, select: 'release-string', glow: ['drawer-catch', 'push-rod'], pose: { walls: 1 }, leds: undefined, cam: [[6.5, -0.3, 1.5], [0.2, -0.6, -0.3]] }),
  // ── electronics ──
  S('el-bay', 'Electronics bay through the acrylic back', { ...OPEN, cam: [[-1.5, 0.6, -6.2], [0, -1.3, -0.4]] }),
  S('el-wiring-only', 'Wiring only', { ...OPEN, view: { wiringOnly: true }, cam: [[-4.6, 3.6, -6.6], [0, 0.1, 0]] }),
  S('el-lcd', 'Close-up: the 16×2 screen during the puzzle', { ...LOCK, lcd: ['Solve the puzzle', 'Bands Y Y -'], cam: [[0.75, -0.75, 3.7], [0.7, -0.82, 2.45]] }),
  // ── exploded ──
  S('exploded-electronic', 'Exploded view: electronic version', { ...OPEN, view: { explode: 1 }, cam: [[-11, 9, -13], [0, 0.2, 0]], wait: 3000 }),
  S('exploded-mechanical', 'Exploded view: mechanical version', { ...OPEN, view: { explode: 1, mode: 'mechanical' }, cam: [[12, 8, 13], [0, 0.6, 0]], wait: 3000 }),
  // ── closing heroes ──
  S('hero-open', 'Closing hero: everything open', { ...OPEN, pose: { walls: 1, drawer: 1 }, fov: 30, cam: [[6.5, 3.0, 9], [0, 1.0, 0]] }),
  S('hero-final', 'Closing hero: the box, locked', { ...LOCK, fov: 30, cam: [[-9, 4, 12], [0, 1, 0]] }),
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--headless=new'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 4 / 3 });
let errors = 0;
page.on('console', (m) => { if (m.type() === 'error') { errors++; console.log('error:', m.text().slice(0, 200)); } });
page.on('pageerror', (e) => { errors++; console.log('pageerror:', e.message); });
await page.goto(base + '?render#/explore', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__yuga, null, { timeout: 120000 });
await page.waitForTimeout(3000);

const manifest = [];
let n = 0;
for (const s of SHOTS) {
  n++;
  const file = `${String(n).padStart(2, '0')}-${s.name}.png`;
  manifest.push({ file, title: s.title });
  if (only && !s.name.includes(only)) continue;
  const { name, title, wait, ...spec } = s;
  await page.evaluate((spec) => window.__yuga.shot(spec), spec);
  await page.waitForTimeout(wait ?? 1400);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log('rendered', file);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
await browser.close();
console.log(errors ? `${errors} console error(s)` : 'no console errors');
