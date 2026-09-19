// Beş haneli fiyatlar kartlara sığıyor mu?
//
//   node build-www.mjs && node scratchpad/holeshop.mjs
//
// Yükseltmeler 250-4000, kaplamalar 6000-11 000 oldu. Eskiden en uzun sayı
// üç haneliydi (900); şimdi beş. Dar bir telefonda fiyat rozeti kartın
// dışına taşabilir ya da adın üstüne binebilir — kod doğru olup ekran yanlış
// olabilir, ve bu yalnızca bakılarak görülür.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8217);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};
mkdirSync('/tmp/shop', { recursive: true });

// En dar yaygın telefon. Sığacaksa burada sığmalı.
for (const w of [360, 412]) {
  const pg = await br.newPage({ viewport: { width: w, height: 800 } });
  pg.on('pageerror', e => console.log('SAYFA HATASI: ' + e));
  await pg.addInitScript(() => {
    // Her şeyin alınabilir göründüğü değil, fiyatların okunduğu hal isteniyor;
    // kese dolu olursa satırlar "yeterli para var" biçiminde çizilir ve asıl
    // merak edilen uzun sayı yine orada durur.
    localStorage.setItem('fruithole_level', '30');
    localStorage.setItem('fruithole_currency',
      JSON.stringify({ berry: 12345, lychee: 12345, banana: 12345, melon: 12345 }));
  });
  await pg.goto('http://localhost:8217/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHolePrices, { timeout: 25000 });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.click('#upgBtn');
  await pg.waitForTimeout(700);

  console.log(`\n${w}px`);
  // Satırın kendi içine bakmak yetmiyordu: taşan düğme satırı da birlikte
  // genişletiyor, yani satıra göre ölçünce her şey "temiz" görünüyor ve asıl
  // taşma ancak ekranın yatay kaymasında ortaya çıkıyor. Ölçü artık satırın
  // kendi **kabına** göre.
  const over = await pg.evaluate(() => {
    const box = document.getElementById('upgrades');
    const bad = [];
    for (const row of box.querySelectorAll('.upg')) {
      const p = row.parentElement.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      if (r.right > p.right + 0.5 || r.left < p.left - 0.5) {
        bad.push(`${row.textContent.trim().slice(0, 24)}: ${Math.round(r.width)}px kap ${Math.round(p.width)}px`);
      }
    }
    return { bad, rows: box.querySelectorAll('.upg').length,
             docScroll: document.documentElement.scrollWidth, win: innerWidth };
  });
  check(over.rows >= 12, 'yükseltme, booster ve kaplama satırları çizildi', `${over.rows} satır`);
  check(over.bad.length === 0, 'hiçbir satır kabından taşmıyor',
    over.bad.slice(0, 3).join(' | ') || 'temiz');
  // Kutunun scrollWidth'ine bakmak yanlıştı: #upgrades'in 26px iç boşluğu var
  // ve Chrome sağdaki boşluğu scrollWidth'e sayıyor, yani hiçbir şey taşmasa
  // da 14px fazla okunuyordu — testin ilk hali bu yüzden "taşıyor" diyordu ve
  // taşan bir şey yoktu. Ölçülmesi gereken sayfanın kendisi.
  check(over.docScroll <= over.win + 1, 'sayfa yatay kaymıyor',
    `${over.docScroll} / ${over.win}`);

  await pg.screenshot({ path: `/tmp/shop/upg-${w}.png`, fullPage: true });
  // En pahalı şey en altta: 11 000 muz.
  await pg.evaluate(() => {
    const rows = document.querySelectorAll('#upgrades .upg');
    rows[rows.length - 1].scrollIntoView({ block: 'center' });
  });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: `/tmp/shop/skins-${w}.png` });
  console.log(`  /tmp/shop/upg-${w}.png  /tmp/shop/skins-${w}.png`);
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
