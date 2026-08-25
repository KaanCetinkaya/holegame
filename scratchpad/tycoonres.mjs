// Araştırma: puanlar harcanabilir mi, etkiler formüllere gerçekten giriyor mu,
// ve "hepsini hat hızına koyarsan eski eğri" iddiası doğru mu?
//
//   node scratchpad/tycoonres.mjs

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-tycoon' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8151);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 892 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
pg.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text()); });

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${JSON.stringify(saw)}`}`);
  if (!ok) fails.push(what);
};
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

await pg.goto('http://localhost:8151/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });
await pg.waitForTimeout(400);

// Puanlar ömür boyu kazançtan geliyor: 1e6 → 20 puan.
const give = pts => pg.evaluate(p => { jeSetLifetime(Math.pow(p / 20, 2) * 1e6); }, pts);

// --- 1. puan muhasebesi ---------------------------------------------------
console.log('\n1) Puan muhasebesi');
await pg.evaluate(() => jeReset());
await pg.waitForTimeout(500);
await pg.waitForFunction(() => typeof window.jeRes === 'function');
await give(100);
let r = await pg.evaluate(() => jeRes());
check(r.banked === 100 && r.free === 100 && r.spent === 0, '100 puan, hepsi boşta', [r.banked, r.free]);

await pg.evaluate(() => jeResBuy('offline', 3));       // 8 puan/seviye
r = await pg.evaluate(() => jeRes());
check(r.spent === 24 && r.free === 76, '3 seviye gece vardiyası 24 puan', [r.spent, r.free]);
check(r.offline === (4 + 3) * 3600, 'çevrimdışı 7 saat oldu', r.offline / 3600);

// Parası yetmeyen alamamalı.
await pg.evaluate(() => jeResBuy('offline', 99));
r = await pg.evaluate(() => jeRes());
check(r.lvl.offline === 12, 'tavana kadar aldı, tavanı geçmedi', r.lvl.offline);
check(r.free === 100 - 12 * 8, 'kalan puan doğru', r.free);
await pg.evaluate(() => jeResBuy('line', 999));
r = await pg.evaluate(() => jeRes());
check(r.free === 0, 'kalan her puan hatta gitti', [r.free, r.lvl.line]);
check(r.lvl.line === 4, 'dört seviye hat', r.lvl.line);

// --- 2. eski eğriyle birebir aynı mı --------------------------------------
console.log('\n2) Hepsi hat hızına → eski çarpan');
for (const pts of [50, 100, 300, 1000, 5000]) {
  await pg.evaluate(() => jeReset());
  await pg.waitForTimeout(450);
  await pg.waitForFunction(() => typeof window.jeRes === 'function');
  await give(pts);
  await pg.evaluate(() => jeResBuy('line', 99999));
  const g = await pg.evaluate(() => jeRes());
  const old = 1 + pts * 0.02;                   // eski formül
  check(near(g.mult, old) && g.free === 0,
    `${pts} puan → ×${old.toFixed(2)}`, { yeni: +g.mult.toFixed(4), eski: old, boşta: g.free });
}

// --- 3. etkiler formüllere giriyor mu -------------------------------------
console.log('\n3) Etkiler');
await pg.evaluate(() => jeReset());
await pg.waitForTimeout(450);
await pg.waitForFunction(() => typeof window.jeRes === 'function');
const base = await pg.evaluate(() => jeRes());
await give(2000);

await pg.evaluate(() => jeResBuy('price', 10));
r = await pg.evaluate(() => jeRes());
check(near(r.price, base.price * 1.5), 'ürün kalitesi ×10 → fiyat +%50',
  { önce: base.price, sonra: r.price });

await pg.evaluate(() => jeResBuy('cheap', 30));
r = await pg.evaluate(() => jeRes());
check(near(r.cheap, 0.55), 'toplu alım tam → yükseltme %45 ucuz', r.cheap);

await pg.evaluate(() => jeResBuy('mgr', 15));
r = await pg.evaluate(() => jeRes());
check(near(r.mgr0, base.mgr0 * 0.4), 'müdür tam → %60 ucuz', { önce: base.mgr0, sonra: r.mgr0 });

await pg.evaluate(() => jeResBuy('boost', 20));
r = await pg.evaluate(() => jeRes());
check(r.boost === 180 + 300, 'turbo tam → 480 sn', r.boost);

// --- 4. hazır hat: prestij sonrası seviye ---------------------------------
console.log('\n4) Hazır hat');
await pg.evaluate(() => jeResBuy('start', 4));
r = await pg.evaluate(() => jeRes());
check(r.lvl.start === 4, '4 seviye alındı', r.lvl.start);
await pg.evaluate(() => { jeSetLifetime(1e10); jeSetEarned(1e11); });
await pg.waitForTimeout(120);
await pg.evaluate(() => jePrestige());
await pg.waitForTimeout(250);
const after = await pg.evaluate(() => jeProbe());
check(after.lvl.every(l => l === 5), 'yeni şube 5. seviyeden başladı', after.lvl);

// --- 5. kayıt hayatta kalıyor mu ------------------------------------------
console.log('\n5) Kayıt');
const beforeReload = await pg.evaluate(() => jeRes());
await pg.reload();
await pg.waitForFunction(() => typeof window.jeRes === 'function');
await pg.waitForTimeout(300);
const afterReload = await pg.evaluate(() => jeRes());
check(JSON.stringify(afterReload.lvl) === JSON.stringify(beforeReload.lvl),
  'araştırma seviyeleri kaydedildi', afterReload.lvl);
check(Number.isFinite(afterReload.mult) && Number.isFinite(afterReload.price),
  'çarpanlar sonlu (NaN yok)', [afterReload.mult, afterReload.price]);

// --- 6. fabrika ilerledikçe görünüyor mu ----------------------------------
// Şube 1'de 150. seviye ile şube 6'da 230. seviye piksel piksel aynıydı:
// bütün birimler 30. seviyede açılıyor ve sonra hiçbir şey değişmiyor.
console.log('\n6) Görsel ilerleme');
await pg.evaluate(() => jeReset());
await pg.waitForTimeout(500);
await pg.waitForFunction(() => typeof window.jeLook === 'function');
let look = await pg.evaluate(() => jeLook());
check(look.tiers.every(t => t === 0), 'başlangıçta donanım demir', look.tiers);
check(look.units.every(u => u === 1), 'her istasyonda tek birim', look.units);
check(look.parked === 0, 'avlu boş', look.parked);

// 250. seviye: bütün birimler açık, donanım tavanda
await pg.evaluate(() => { jeGive(1e30); for (let i = 0; i < 4; i++) jeBuy(i, 'max'); });
await pg.waitForTimeout(400);
look = await pg.evaluate(() => jeLook());
// Sevkiyat dörtle sınırlı — tır, ocaktan büyük.
check(JSON.stringify(look.units) === '[6,6,6,4]', 'yüksek seviyede bütün birimler açık', look.units);
check(look.tiers.every(t => t >= 3), 'donanım en az kroma çıktı', look.tiers);
check(JSON.stringify(look.shown) === JSON.stringify(look.tiers),
  'sahne kademeyi uygulamış', [look.shown, look.tiers]);

// prestij avluyu dolduruyor
const b0 = look.branches;
await pg.evaluate(() => { jeSetLifetime(1e10); jeSetEarned(1e12); jePrestige(); });
await pg.waitForTimeout(400);
look = await pg.evaluate(() => jeLook());
check(look.branches === b0 + 1, 'şube sayısı arttı', look.branches);
check(look.parked === look.branches, 'avluda şube başına bir sıra', [look.parked, look.branches]);
check(look.tiers.every(t => t === 0), 'yeni şubede donanım başa döndü', look.tiers);

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
