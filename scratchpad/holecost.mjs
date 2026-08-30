// Voxel meyveler telefonda kaça patlıyor?
//
//   node build-www.mjs && node scratchpad/holecost.mjs
//
// Kutu ucuz görünür, çok kutu değildir. Bir bölümde 500'e yakın meyve var;
// meyve başına birkaç yüz üçgen fark, kareye milyonluk bir yük demek. Üstelik
// gölge geçişi sahneyi ikinci kez çiziyor, yani buradaki sayı ikiyle çarpılıp
// öyle okunmalı.
//
// Sütun yaklaşımının bütün mesele olduğu yer burası: kapalı yüzler
// atılmasaydı düz bir dilim 570 dörtgen olurdu, atılınca ~200.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ROOT = '/home/user/holegame';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8183);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8183/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleCost, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });

const one = await pg.evaluate(() => window.fruitHoleCost());
console.log('meyve başına üçgen:', JSON.stringify(one.perFruit));
console.log('dev başına üçgen  :', JSON.stringify(one.perGiant));
console.log('');
console.log('bölüm | desen     | meyve | tarla üçgeni | çizim çağrısı');
console.log('------+-----------+-------+--------------+--------------');

let worst = { tris: 0 };
for (const n of [1, 3, 9, 15, 19, 25, 33]) {
  const p = await pg.evaluate(l => window.fruitHoleProbe(l), n);
  // Oyun kamerasıyla, gerçekten çizilen kadarı: tepeden bakış bütün tarlayı
  // kadraja alıyor ve hiçbir telefonda o kadarı aynı anda görünmüyor.
  const c = await pg.evaluate(() => window.fruitHoleCost());
  if (c.triangles > worst.tris) worst = { tris: c.triangles, level: n, pattern: p.pattern };
  console.log(
    ` ${String(n).padStart(5)} | ${p.pattern.padEnd(9)} | ${String(p.fruit).padStart(5)} |` +
    ` ${c.triangles.toLocaleString('tr-TR').padStart(12)} | ${String(c.calls).padStart(13)}`);
}
console.log(`\nen ağır: bölüm ${worst.level} (${worst.pattern}), ${worst.tris.toLocaleString('tr-TR')} üçgen`);
console.log(`gölge geçişiyle birlikte kabaca ${(worst.tris * 2).toLocaleString('tr-TR')}`);
console.log('hatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
