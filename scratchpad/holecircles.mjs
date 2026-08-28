// "Bubbles" deseni: daireler gerçekten yuvarlak mı, birbirine değiyor mu,
// tarlanın kenarından taşıyor mu?
//
//   node scratchpad/holecircles.mjs
//
// Gözle bakınca "yuvarlak" görünen şey olmayabilir: tarla 13 sütun ama
// 22-34 satır, yani nx/ny ile çizilen bir çember ekranda uzun bir elips
// oluyor. Hücreler dünya uzayında kare (1.05 x 1.05), o yüzden gerçek
// daire **hücre mesafesi** demek. Bu dosya onu ölçüyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8171);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8171/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe);

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${JSON.stringify(saw)}`}`);
  if (!ok) fails.push(what);
};

// Bubbles LEVEL_ORDER'da 5. sırada, yani 5, 21, 37... bölümlerinde çıkıyor.
// 5'te 26 satır, 21'de 34 (tavan) — desenin göreceği bütün aralık bu.
for (const lvl of [5, 21, 37]) {
  const p = await pg.evaluate(l => window.fruitHoleProbe(l), lvl);
  console.log(`\nbölüm ${lvl} — ${p.pattern}, ${p.fruit} meyve, tarla ${p.fieldW.toFixed(1)}x${p.fieldH.toFixed(1)}`);
  check(p.pattern === 'Bubbles', 'desen Bubbles', p.pattern);

  const g = await pg.evaluate(() => {
    // Meyvelerin dünya konumundan daireleri geri çıkar: aynı türden ve
    // birbirine komşu olanları bir küme say.
    const pts = window.fruitHoleCircleCells();
    return pts;
  });

  // Her dairenin ölçülen genişliği ve derinliği — gerçek daire ise eşit olmalı.
  for (const k of g.circles) {
    const round = Math.abs(k.w - k.h) <= 1.05 * 1.5;   // bir buçuk hücre tolerans
    check(round, `daire ${k.i}: en ${k.w.toFixed(1)} boy ${k.h.toFixed(1)} birim`, undefined);
  }
  check(g.minGap >= 1.0, `en dar aralık ${g.minGap.toFixed(2)} hücre (>= 1 olmalı)`, undefined);
  check(g.clipped === 0, `kenardan taşan daire yok`, g.clipped);
}

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
