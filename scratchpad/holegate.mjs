// Boyut kapısı gerçekten ısırıyor mu?
//
//   node build-www.mjs && node scratchpad/holegate.mjs
//   UPG=8 node scratchpad/holegate.mjs      # yükseltmesi tavana yakın oyuncu
//
// Oyun oynanmıyor, aritmetik okunuyor: bir bölümde delik nereden başlıyor,
// iri meyveyi ve devi açmak kaç meyve yemek gerekiyor, bu tarlanın yüzde kaçı.
// Cevap "sıfır" ya da "%1" çıkıyorsa kapı yok demektir — oyuncu ilk saniyeden
// her şeyi yutabiliyor ve bölüm kendini oynuyor.
//
// Asıl mesele geç bölümler: başlangıç yarıçapı bölüm başına artıyordu ve hiç
// durmuyordu, oysa tarla 34 satırda duruyor. 36. bölümde delik zaten devleri
// yutacak boyda başlıyordu.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const UPG = Number(process.env.UPG || 0);   // 'size' yükseltmesinin seviyesi

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8193);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.addInitScript(u => {
  localStorage.setItem('fruithole_upgrades', JSON.stringify({ size: Number(u) }));
}, String(UPG));
await pg.goto('http://localhost:8193/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });

console.log(`'size' yükseltmesi: ${UPG}\n`);
console.log('bölüm | meyve | başlangıç | iri için | dev için | tarlanın %si');
console.log('------+-------+-----------+----------+----------+--------------');

const fails = [];
for (const n of [1, 3, 6, 10, 15, 20, 25, 30, 36, 45]) {
  const p = await pg.evaluate(l => {
    const info = window.fruitHoleProbe(l);
    const g = window.fruitHoleGrow();
    return { ...info, ...g };
  }, n);
  // Yutma kapısı: f.r <= holeRadius * 0.92
  const need = r => r / 0.92;
  const unit = p.unit;
  const toBig = Math.max(0, Math.ceil((need(p.bigR) - p.start) / unit));
  const toGiant = Math.max(0, Math.ceil((need(p.giantR) - p.start) / unit));
  const pct = (toGiant / p.fruit) * 100;
  console.log(
    ` ${String(n).padStart(5)} | ${String(p.fruit).padStart(5)} |` +
    ` ${p.start.toFixed(2).padStart(9)} | ${String(toBig).padStart(8)} |` +
    ` ${String(toGiant).padStart(8)} | ${pct.toFixed(0).padStart(11)}%`);
  // Dört meyvenin altı "kapı yok" demek. Yükseltmesi tavandaki bir oyuncuda
  // küçük bir bölümde 6-7 çıkması normal — yükseltme kapıyı hafifletmeli.
  if (toBig < 4) fails.push(`bölüm ${n}: iri meyve ${toBig} meyvede açılıyor`);
  if (pct < 15) fails.push(`bölüm ${n}: dev tarlanın %${pct.toFixed(0)}'inde açılıyor`);
}

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} SORUN:\n  ` + fails.join('\n  ') : '\nkapı ısırıyor');
await br.close();
srv.close();
