// Takes screenshots of every section at desktop and phone size and reports console errors.
// Usage: node scripts/shots.mjs [baseUrl]   (dev server must be running)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:5173/';
const only = process.argv[3];
mkdirSync('shots', { recursive: true });
const sizes = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const pages = [
  ['explore', '#/explore', 6000],
  ['explore-part', '#/explore?part=catch-lever', 8000],
  ['explore-part2', '#/explore?part=pcf8574', 8000],
  ['how', '#/how?step=3', 9000],
  ['how1', '#/how?step=1', 9000],
  ['how2', '#/how?step=2', 8000],
  ['how4', '#/how?step=4', 12000],
  ['how5', '#/how?step=5', 12000],
  ['circuit', '#/circuit', 1500],
  ['code', '#/code', 1500],
  ['yugas', '#/yugas', 2500],
  ['mechanisms', '#/mechanisms', 2000],
  ['build', '#/build', 1500],
];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', args: (process.env.PW_ARGS || '--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --headless=new').split(' ') });
let errors = 0;
for (const [sizeName, vp] of Object.entries(sizes)) {
  for (const [name, hash, waitMs] of pages) {
    if (only && !name.startsWith(only)) continue;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: sizeName === 'phone', hasTouch: sizeName === 'phone' });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { if (m.type() === 'error') errors++; console.log(`  [${sizeName}/${name}] ${m.type()}: ${m.text().slice(0, 300)}`); } });
    page.on('pageerror', (e) => { errors++; console.log(`  [${sizeName}/${name}] pageerror: ${e.message}`); });
    await page.goto(base + hash, { waitUntil: 'load' });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: `shots/${sizeName}-${name}.png`, fullPage: !['explore', 'explore-part', 'explore-part2', 'how'].includes(name) && sizeName === 'desktop' ? false : false });
    console.log(`shot ${sizeName}-${name}`);
    await ctx.close();
  }
}
await browser.close();
console.log(errors ? `${errors} console error(s)` : 'no console errors');
