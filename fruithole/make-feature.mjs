// Play Console feature graphic (1024x500), shot from the real game.
//
//   node fruithole/make-feature.mjs
//   -> fruithole/store/feature-1024x500.png
//
// The graphic used to be drawn with Pillow shapes in make-assets.py. That was
// fine when the fruit were flat discs, but the board is now stacked towers with
// lighting and shadows, and a hand-drawn version of it no longer resembles
// anything the player will see. So this loads the packaged build, plays a few
// seconds of a level, hides the interface, and lays the title over the frame in
// the same type the game itself uses.
//
// Needs www-fruithole/ (npm run build:www) and Playwright's Chromium.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, unlinkSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WWW = join(ROOT, 'www-fruithole');
const OUT = join(HERE, 'store', 'feature-1024x500.png');
const PORT = 8123;
const LEVEL = process.argv[2] || '6';        // Heart: dense, all four fruits

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const body = readFileSync(join(WWW, p));
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 2 });
await page.addInitScript(l => localStorage.setItem('fruithole_level', l), LEVEL);
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });

await page.waitForSelector('#dailyBtn', { state: 'visible', timeout: 20000 }).catch(() => {});
await page.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await page.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await page.click('#playBtn');
await page.waitForTimeout(700);

// Eat a short swathe. On a full board the hole is buried under fruit, and the
// hole is the thing the game is named after — it has to be in the picture.
await page.mouse.move(512, 250);
await page.mouse.down();
await page.mouse.move(512, 200, { steps: 8 });
await page.waitForTimeout(1100);
await page.mouse.up();
await page.waitForTimeout(600);

await page.evaluate(() => {
  for (const id of ['topbar', 'sizeTag', 'boosterBar', 'hint', 'joyBase', 'joyKnob', 'combo']) {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  }
  // Play frames a fixed 10.8-unit width; on a 1024x500 plate that is six huge
  // fruit and no shape. Pull back until the level reads as a level.
  window.fruitHoleZoom(7.4);

  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed; inset:0; z-index:99; pointer-events:none;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;
  wrap.innerHTML = `
    <div style="position:absolute; inset:0 auto 0 0; width:58%;
      background:linear-gradient(90deg, rgba(40,22,8,.62) 0%, rgba(40,22,8,.42) 45%, rgba(40,22,8,0) 100%);"></div>
    <div style="position:absolute; left:52px; top:50%; transform:translateY(-50%);">
      <div style="font-size:96px; font-weight:900; line-height:.94; letter-spacing:-1px;
        color:#fff; -webkit-text-stroke:9px #5a3410; paint-order:stroke fill;
        text-shadow:0 7px 0 #5a3410, 0 14px 22px rgba(0,0,0,.45);">FRUIT</div>
      <div style="font-size:96px; font-weight:900; line-height:.94; letter-spacing:-1px;
        color:#ffd85c; -webkit-text-stroke:9px #5a3410; paint-order:stroke fill;
        text-shadow:0 7px 0 #5a3410, 0 14px 22px rgba(0,0,0,.45);">HOLE</div>
      <div style="margin-top:22px; font-size:27px; font-weight:800; color:#fff;
        -webkit-text-stroke:5px #5a3410; paint-order:stroke fill;
        text-shadow:0 3px 0 #5a3410;">Swallow it all. Grow. Clear the field.</div>
    </div>`;
  document.body.appendChild(wrap);
});
await page.waitForTimeout(500);

// Shot at 2x for the antialiasing, then halved: Play wants exactly 1024x500.
// Pillow does the resize because make-assets.py already depends on it.
const raw = join(HERE, 'store', '.feature-2x.png');
await page.screenshot({ path: raw });
await browser.close();
srv.close();

const py = spawnSync('python3', ['-c',
  `from PIL import Image
import sys
Image.open(sys.argv[1]).resize((1024, 500), Image.LANCZOS).save(sys.argv[2])`,
  raw, OUT], { encoding: 'utf8' });
if (py.status !== 0) {
  console.error(py.stderr || 'Pillow ile küçültme başarısız.');
  console.error(`2x dosya duruyor: ${raw} — elle 1024x500'e indir.`);
  process.exit(1);
}
unlinkSync(raw);
console.log('yazıldı:', OUT);
