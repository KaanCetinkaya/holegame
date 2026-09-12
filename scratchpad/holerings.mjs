// İç içe halkalar: Orbits deseni gerçekten deliğin etrafında büyüyen
// halkalar mı, kaç halka var, aralarındaki boşluk ne kadar?
//
//   node build-www.mjs fruithole && node scratchpad/holerings.mjs
//
// Kareler menü dioramasının dönüşünü yakalamasın diye önce
// fruitHoleHold(true) — bir kere tarla dönerken çekilen kareler yüzünden
// "şekil sola yatmış" diye olmayan bir hata arandı.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const ROOT = '/home/user/holegame';
mkdirSync('/tmp/rings', { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8175);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8175/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 20000 });
// Günlük ödül penceresi ilk açılışta tarlanın önüne geliyor — kapat.
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForTimeout(400);
await pg.evaluate(() => window.fruitHoleHold(true));

// Kutupsal desenlerin bölüm numaralarını kendi bul.
const POLAR = ['Orbits', 'Whirl', 'Bloom'];
const found = {};
for (let n = 1; n <= 25 && Object.keys(found).length < POLAR.length; n++) {
  const p = await pg.evaluate(l => window.fruitHoleProbe(l), n);
  if (POLAR.includes(p.pattern) && !found[p.pattern]) found[p.pattern] = { n, ...p };
}
console.log(Object.entries(found)
  .map(([k, v]) => `${k}: bölüm ${v.n}, ${v.fruit} meyve`).join('\n'));

for (const [name, info] of Object.entries(found)) {
  await pg.evaluate(() => window.fruitHoleHold(true));
  await pg.evaluate(([n, a]) => window.fruitHoleTopDown(n, a), [info.n, 960 / 540]);
  await pg.evaluate(() => {
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
    for (const id of ['hud', 'topBar', 'hint', 'combo', 'boosters'])
      { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
  });
  await pg.waitForTimeout(150);
  await pg.evaluate(([n, a]) => window.fruitHoleTopDown(n, a), [info.n, 960 / 540]);
  // fruitHoleTopDown yarım genişliği max(halfX, halfZ) alıyor; tarla dar ve
  // uzun olduğu için kare içinde ortada yarım yer kaplıyor. Ortadan kırp.
  await pg.screenshot({ path: `/tmp/rings/${name}.png`,
    clip: { x: 540 / 4, y: 960 / 4, width: 540 / 2, height: 960 / 2 } });
  console.log(`/tmp/rings/${name}.png`);
}

console.log('hatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
