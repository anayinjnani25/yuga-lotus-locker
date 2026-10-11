// Drives the Explore UI like a visitor and screenshots each state. Fails on console errors.
// Usage: node scripts/interact.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:5173/';
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', args: (process.env.PW_ARGS || '--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --headless=new').split(' ') });
let errors = 0;
const watch = (page, tag) => {
  page.on('console', (m) => { if (m.type() === 'error') { errors++; console.log(`  [${tag}] error: ${m.text().slice(0, 300)}`); } });
  page.on('pageerror', (e) => { errors++; console.log(`  [${tag}] pageerror: ${e.message}`); });
};
const step = async (page, name, fn, wait = 1800) => { await fn(); await page.waitForTimeout(wait); await page.screenshot({ path: `shots/int-${name}.png` }); console.log('ok', name); };

// desktop flow
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page, 'desktop');
  await page.goto(base + '#/explore');
  await page.waitForTimeout(5000);
  await step(page, '1-drawer-search', async () => {
    await page.getByRole('button', { name: /Parts/ }).click();
    await page.getByPlaceholder(/Search parts/).fill('servo');
  }, 600);
  await step(page, '2-select-from-list', async () => {
    await page.locator('.part-row', { hasText: 'Lotus servo' }).click();
    await page.keyboard.press('Escape'); // closes the drawer first
  }, 2200);
  await step(page, '3-hover-connection', async () => { await page.locator('.conns li').first().hover(); }, 900);
  await step(page, '4-related-part', async () => { await page.locator('.rel', { hasText: 'Push rod' }).click(); }, 2200);
  await step(page, '5-esc-home', async () => { await page.mouse.move(700, 450); await page.keyboard.press('Escape'); }, 2200);
  await step(page, '6-wiring-only', async () => { await page.getByRole('switch', { name: 'Wiring only' }).click(); }, 1200);
  await step(page, '7-exploded-mech', async () => {
    await page.getByRole('switch', { name: 'Wiring only' }).click();
    await page.getByRole('radio', { name: 'Mechanical' }).click();
    await page.locator('.slider input').fill('1');
  }, 2200);
  await step(page, '8-cutaway-off-hide-walls', async () => {
    await page.locator('.slider input').fill('0');
    await page.getByRole('switch', { name: 'Cutaway' }).click();
    await page.getByRole('switch', { name: 'Hide walls' }).click();
  }, 1800);
  await step(page, '9-hover-3d', async () => { await page.mouse.move(720, 420); await page.mouse.move(724, 424); }, 800);
  const tag = await page.locator('.hover-tag').textContent().catch(() => null);
  console.log('hover tag shows:', tag);
  await step(page, '10-click-3d', async () => { await page.mouse.click(724, 424); }, 2200);
  const title = await page.locator('.detail h2').textContent().catch(() => null);
  console.log('clicked part:', title);
  await page.close();
}
// dark theme doc page
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage(); watch(page, 'dark');
  await page.goto(base + '#/circuit'); await page.waitForTimeout(1200);
  await step(page, '11-dark-circuit-select', async () => { await page.locator('[data-c="servo-lotus"]').click(); }, 600);
  await ctx.close();
}
// reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); watch(page, 'reduced');
  await page.goto(base + '#/how?step=5'); await page.waitForTimeout(6000);
  await step(page, '12-reduced-motion-how5', async () => {}, 200);
  await ctx.close();
}
await browser.close();
console.log(errors ? `${errors} console error(s)` : 'no console errors');
process.exit(errors ? 1 : 0);
