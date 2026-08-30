// Tek bir eşyaya yakından bak.
//
//   PROP=flipflop node scratchpad/holeprop.mjs
//
// propSheet dört sütuna diziyor, tek eşyaya bakarken kare içinde bir nokta
// kalıyor ve "Y okunuyor mu" sorusu resimden cevaplanamıyor. Bu dosya aynı
// eşyayı dört kere koyup kadrajı ona göre daraltıyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ROOT = '/home/user/holegame';
const ID = process.env.PROP || 'flipflop';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8181);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8181/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.evaluate(() => {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  for (const id of ['hud', 'topbar', 'hint', 'combo', 'boosterBar'])
    { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
});
await pg.evaluate(id => window.fruitHolePropSheet([id, id, id, id]), ID);
await pg.waitForTimeout(150);
await pg.evaluate(id => window.fruitHolePropSheet([id, id, id, id]), ID);
await pg.screenshot({ path: `/tmp/tech/${ID}.png`,
  clip: { x: 150, y: 200, width: 300, height: 220 } });
console.log(`/tmp/tech/${ID}.png`);
console.log('hatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
