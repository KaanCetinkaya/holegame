// Yeni teknoloji eşyaları: tepeden bakınca ne oldukları anlaşılıyor mu?
//
//   node build-www.mjs && node scratchpad/holetech.mjs
//
// Bu dosya bir şey ölçmüyor, resim çekiyor. Bu eşyaların tek işi yukardan
// tanınmak — televizyonun ekranı öne baksa oyuncunun gördüğü turuncu bir
// sandık olur. O yüzden karar gözle veriliyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const ROOT = '/home/user/holegame';
mkdirSync('/tmp/tech', { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8179);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8179/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.evaluate(() => window.fruitHoleHold(true));
const hide = () => pg.evaluate(() => {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  for (const id of ['hud', 'topbar', 'topBar', 'hint', 'combo', 'boosterBar'])
    { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
});

const TECH = ['tv', 'piano', 'headphones', 'hairdryer', 'radio', 'fan',
              'laptop', 'phone', 'gamepad', 'fridge', 'heli'];

await hide();
console.log(await pg.evaluate(ids => window.fruitHolePropSheet(ids), TECH));
await pg.waitForTimeout(200);
await pg.evaluate(ids => window.fruitHolePropSheet(ids), TECH);
await pg.screenshot({ path: '/tmp/tech/sheet.png' });
console.log('/tmp/tech/sheet.png');

// Ve tarlada, gerçek bir bölümde.
const wanted = ['Orbits', 'Blocks', 'Whirl'];
const shots = {};
for (let n = 1; n <= 25 && Object.keys(shots).length < wanted.length; n++) {
  const p = await pg.evaluate(l => window.fruitHoleProbe(l), n);
  if (wanted.includes(p.pattern) && !shots[p.pattern]) shots[p.pattern] = n;
}
const pg2 = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
pg2.on('pageerror', e => errs.push(String(e)));
await pg2.goto('http://localhost:8179/', { waitUntil: 'load' });
await pg2.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg2.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg2.waitForTimeout(300);
for (const [name, n] of Object.entries(shots)) {
  await pg2.evaluate(() => window.fruitHoleHold(true));
  await pg2.evaluate(([l, a]) => window.fruitHoleTopDown(l, a), [n, 960 / 540]);
  await pg2.evaluate(() => {
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
    for (const id of ['hud', 'topbar', 'topBar', 'hint', 'combo', 'boosterBar'])
      { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
  });
  await pg2.waitForTimeout(150);
  await pg2.evaluate(([l, a]) => window.fruitHoleTopDown(l, a), [n, 960 / 540]);
  await pg2.screenshot({ path: `/tmp/tech/${name}.png`,
    clip: { x: 135, y: 240, width: 270, height: 480 } });
  console.log(`/tmp/tech/${name}.png  (bölüm ${n})`);
}

console.log('hatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
