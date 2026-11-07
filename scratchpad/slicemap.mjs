// Bölüm haritası ve günlük ödül.
//
//   node scratchpad/slicemap.mjs
//
// Ölçtükleri:
//   - eski bir bölümü tekrar oynamak ilerlemeyi geri sarıyor mu
//   - haritada açık/kilitli sayısı doğru mu, yıldızlar görünüyor mu
//   - günlük ödül ardışık günde seriyi büyütüyor, atlanan günde sıfırlıyor mu
//   - aynı gün ikinci kez ödeme yapıyor mu
//   - ödül alınmadan çıkılırsa gün yanıyor mu

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const WWW = 'www-slicer';
const PORT = 8144;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

const server = createServer((req, res) => {
  const p = join(WWW, (req.url || '/').split('?')[0] === '/' ? 'index.html' : req.url.slice(1));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 412, height: 892 } });
const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${JSON.stringify(saw)}`}`);
  if (!ok) fails.push(what);
};

await page.goto(`http://127.0.0.1:${PORT}/`);
await page.waitForFunction(() => window.sliceProbe);

// --- 1. ilerleme geri sarmıyor -------------------------------------------
// Oyuncu 8. bölümde. 3'ü tekrar oynayıp bitirdiğinde kayıt 8'de kalmalı.
console.log('\n1) Eski bölümü tekrar oynamak');
await page.evaluate(() => {
  localStorage.setItem('slicerush_level', '8');
  localStorage.setItem('slicerush_stars', JSON.stringify({ 1: 3, 2: 2, 3: 1 }));
});
await page.reload();
await page.waitForFunction(() => window.sliceProbe);
check((await page.evaluate(() => sliceProbe().maxLevel)) === 8, 'kayıt 8. bölümde');

await page.evaluate(() => { sliceStart(3); });
await page.waitForTimeout(150);
// Kesmeden bitir: parkurun sonuna ışınla.
await page.evaluate(async () => {
  const t = setInterval(() => sliceAutoPlay(), 30);
  await new Promise(r => {
    const w = setInterval(() => {
      if (sliceProbe().state !== 'playing') { clearInterval(w); clearInterval(t); r(); }
    }, 60);
  });
});
let p = await page.evaluate(() => sliceProbe());
check(p.maxLevel === 8, '3. bölüm bitince kayıt hâlâ 8', p.maxLevel);
check(p.level === 3, 'oynanan bölüm 3', p.level);

// Bitiş "iyi" ise yıldız yükselmiş olabilir; kayıt geri gitmemeli.
const starsAfter = await page.evaluate(() => sliceMap().stars);
check((starsAfter[3] || 0) >= 1, '3. bölümün yıldızı korunmuş/artmış', starsAfter[3]);

// --- 2. sonraki bölüm düğmesi --------------------------------------------
console.log('\n2) Sonraki bölüm');
if (p.state === 'clear') {
  await page.evaluate(() => document.getElementById('nextBtn').click());
  await page.waitForTimeout(150);
  p = await page.evaluate(() => sliceProbe());
  check(p.level === 4, 'sonraki 4. bölüme geçti', p.level);
  check(p.maxLevel === 8, 'kayıt yine 8', p.maxLevel);
} else {
  console.log('  --   tur çarparak bitti, bu adım atlandı');
}

// --- 3. harita ------------------------------------------------------------
console.log('\n3) Harita');
await page.evaluate(() => { sliceReset(); });
await page.waitForTimeout(400);
await page.waitForFunction(() => window.sliceProbe);
await page.evaluate(() => {
  localStorage.setItem('slicerush_level', '40');
  localStorage.setItem('slicerush_stars', JSON.stringify({ 1: 3, 2: 3, 5: 1 }));
});
await page.reload();
await page.waitForFunction(() => window.sliceProbe);
await page.evaluate(() => document.getElementById('dOk')?.click());
await page.evaluate(() => document.getElementById('mapBtn').click());
await page.waitForTimeout(120);
const map = await page.evaluate(() => sliceMap());
check(map.open === 40, '40 bölüm açık', map.open);
check(map.shown === 43, '3 kilitli bölüm de görünüyor', map.shown);
check(await page.evaluate(() => document.getElementById('map').classList.contains('show')),
  'harita ekranı açıldı');
const filled = await page.evaluate(() =>
  [...document.querySelectorAll('.lv')].map(e => e.querySelectorAll('.s span:not(.off)').length));
check(filled[0] === 3 && filled[1] === 3 && filled[4] === 1 && filled[2] === 0,
  'yıldızlar doğru bölümlerde', filled.slice(0, 6));
// 40. bölümde olan biri haritayı 1. bölümde açmamalı.
const scrolled = await page.evaluate(() => document.getElementById('mapGrid').scrollTop);
check(scrolled > 0, 'harita bulunduğun bölüme kaydırdı', scrolled);

// Kilitli bir bölüme dokunmak oyunu başlatmamalı.
await page.evaluate(() => document.querySelectorAll('.lv')[41].click());
await page.waitForTimeout(120);
check((await page.evaluate(() => sliceProbe().state)) !== 'playing', 'kilitli bölüm açılmıyor');

// Açık bir bölüme dokunmak onu başlatmalı.
await page.evaluate(() => document.querySelectorAll('.lv')[4].click());
await page.waitForTimeout(200);
p = await page.evaluate(() => sliceProbe());
check(p.state === 'playing' && p.level === 5, '5. bölüme dokununca başladı', [p.state, p.level]);

// --- 4. günlük ödül -------------------------------------------------------
console.log('\n4) Günlük ödül');
await page.evaluate(() => { sliceReset(); });
await page.waitForTimeout(400);
await page.waitForFunction(() => window.sliceProbe);

let d = await page.evaluate(() => sliceDaily());
check(d.open === true, 'ilk açılışta ödül ekranı çıktı');
check(d.pending === 1, '1. gün', d.pending);
check(d.pay === 30, '30 para', d.pay);

const before = await page.evaluate(() => sliceMeta().coins);
await page.evaluate(() => document.getElementById('dOk').click());
await page.waitForTimeout(80);
check((await page.evaluate(() => sliceMeta().coins)) === before + 30, 'para yattı');
check((await page.evaluate(() => sliceDaily().open)) === false, 'ekran kapandı');

// Aynı gün ikinci kez: ödeme yok.
await page.reload();
await page.waitForFunction(() => window.sliceProbe);
check((await page.evaluate(() => sliceDaily().open)) === false, 'aynı gün tekrar ödemiyor');
check((await page.evaluate(() => sliceMeta().coins)) === before + 30, 'kasa değişmedi');

// Ertesi gün: seri büyüyor.
await page.evaluate(() => sliceSetDay(1, 1));
await page.waitForTimeout(60);
d = await page.evaluate(() => sliceDaily());
check(d.pending === 2 && d.pay === 45, 'ertesi gün 2. güne geçti', [d.pending, d.pay]);

// Ödül alınmadan çıkılırsa gün yanmamalı.
await page.reload();
await page.waitForFunction(() => window.sliceProbe);
d = await page.evaluate(() => sliceDaily());
check(d.pending === 2, 'almadan çıkınca ödül duruyor', d.pending);
await page.evaluate(() => document.getElementById('dOk').click());
await page.waitForTimeout(60);
check((await page.evaluate(() => sliceMeta().coins)) === before + 75, 'iki günün toplamı yattı');

// Gün atlanınca seri sıfırlanıyor.
await page.evaluate(() => sliceSetDay(3, 5));
await page.waitForTimeout(60);
d = await page.evaluate(() => sliceDaily());
check(d.pending === 1 && d.pay === 30, '3 gün sonra seri başa döndü', [d.pending, d.pay]);

// Yedinci günde tavan.
await page.evaluate(() => sliceSetDay(1, 7));
await page.waitForTimeout(60);
d = await page.evaluate(() => sliceDaily());
check(d.pending === 7 && d.pay === 300, '7. günde kalıyor, 300 para', [d.pending, d.pay]);

console.log('\n' + (fails.length ? `${fails.length} HATA:\n  ` + fails.join('\n  ') : 'hepsi geçti'));
await browser.close();
server.close();
process.exit(fails.length ? 1 : 0);
