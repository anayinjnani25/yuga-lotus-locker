import { chromium } from 'playwright';
const url = process.argv[2];
const browser = await chromium.launch({ channel: 'msedge', args: (process.env.PW_ARGS || '--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --headless=new').split(' ') });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => console.log('console', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
console.log('renderer', await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); }));
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(2500);
  const r = await Promise.race([
    page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); })),
    new Promise((res) => setTimeout(() => res('timeout'), 8000)),
  ]);
  console.log('fps', r);
}
await browser.close();
