// Kuleler ne kadar yüksek duruyor, ve yükseltince ne bozuluyor?
//
//   node build-www.mjs && node scratchpad/holepillar.mjs
//
// Kule sayısı yükseklik değil: çilek küre, karpuz dilimi ince disk. Aynı
// sayıda parça çok farklı boyda kule veriyor. O yüzden ölçüm dünya
// biriminden, `fruitHolePillars()` ile alınıyor.
//
// Yükseltmenin iki sınırı var, ikisi de burada ölçülüyor:
//   1. Aynı sıradaki kuleler ekranda üst üste binerse sütun dizisi kesintisiz
//      bir şeride dönüşüyor — aralarından geçilebildiği görünmüyor.
//   2. Kule çok uzarsa ekranın üstünden taşıyor ya da deliği kapatıyor.
//
// Kareler /tmp/pillar/ altına yazılıyor, göze de bakmak gerekiyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

mkdirSync('/tmp/pillar', { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8199);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Pillars deseni: PATTERNS[(level-1) % 19] -> 42. bölüm.
await pg.addInitScript(() => localStorage.setItem('fruithole_level', '42'));
await pg.goto('http://localhost:8199/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHolePillars, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.click('#playBtn');
await pg.waitForTimeout(3000);

const desen = await pg.evaluate(() => window.fruitHoleProbe(42).pattern);
console.log(`\ndesen: ${desen}\n`);

const lines = await pg.evaluate(() => window.fruitHolePillars());
console.log('sütun | dünya birimi | parça');
console.log('------+--------------+-------');
for (const l of lines) {
  console.log(`  ${String(l.col).padStart(3)} | ${String(l.top).padStart(12)} | ${String(l.pieces).padStart(5)}`);
}

const tops = lines.map(l => l.top);
const inner = Math.max(tops[1], tops[2]);
const outer = Math.max(tops[0], tops[3]);
console.log(`\niç sütunlar ${inner} birim, dış sütunlar ${outer} birim`);
check(inner > outer + 0.5, 'iç sütunlar dıştan belirgin yüksek', `${inner} > ${outer}`);

// Aynı sıradaki kuleler ekranda birbirine giriyor mu? Eksi = üst üste binme.
const gaps = await pg.evaluate(() => window.fruitHolePillarGaps());
console.log('\nsütun | kule | en dar boşluk (px)');
console.log('------+------+-------------------');
for (const g of gaps) {
  console.log(`  ${String(g.col).padStart(3)} | ${String(g.towers).padStart(4)} | ${String(g.minGap).padStart(17)}`);
}
const worst = Math.min(...gaps.map(g => g.minGap).filter(v => v !== null));
check(worst > 0, 'kuleler arasından zemin görünüyor (şeride dönmüyor)', `en dar ${worst}px`);

// Kule ekranda nereye kadar çıkıyor? Tepe noktası HUD'un altında kalmalı,
// yoksa kule sayaçların arkasına giriyor.
const screen = await pg.evaluate(() => {
  const r = window.fruitHoleLean();
  return { crownY: r.screenDy, foot: r.towerHeight, dx: r.screenDx };
});
console.log(`en yüksek kule ${screen.foot} birim, ekranda ${Math.abs(screen.crownY).toFixed(0)}px yukarı çıkıyor`);
check(Math.abs(screen.dx) < 2, 'kule dimdik duruyor (yana kaymıyor)', `${screen.dx}px`);
check(Math.abs(screen.crownY) < 420, 'kule HUD ile sayaçların altında kalıyor',
  `${Math.abs(screen.crownY).toFixed(0)}px / 420px sınır`);

// Delik kulelerin arkasında kaybolmamalı: deliğin durduğu yerde zeminin
// göründüğünü, üstünü bir kulenin örtmediğini istiyoruz.
await pg.screenshot({ path: '/tmp/pillar/play.png' });
console.log('\n/tmp/pillar/play.png');

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
