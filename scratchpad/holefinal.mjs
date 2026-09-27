// Final bölümü nasıl görünüyor: kupa tahtanın ucunda duruyor mu?
//
//   node build-www.mjs && node scratchpad/holefinal.mjs
//
// Sayıyı `holeboss.mjs` ölçüyor (kolos var, eşyası `bigcup`, uzaklığı 17+).
// Burada ölçülen bir şey yok — tek iş resmi çıkarmak, çünkü kupanın
// **yukarıdan** nasıl okunduğu ancak bakınca görünüyor: bu dosyada dört nesne
// tam bu yüzden yanlış çıkmıştı (yandan doğru, üstten tanınmaz).

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const OUT = '/tmp/final';
mkdirSync(OUT, { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8232);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8232/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleTopDown, { timeout: 25000 });

// 9 ve 72 final (Cup Night, ızgara tahtası), 10 patron — üçü yan yana
// bakılınca finalin patrondan neyle ayrıldığı görünüyor.
// Menü ve HUD kapatılıyor: yoksa kare tahtanın kendisini değil, üstündeki
// arayüzü gösteriyor.
const ciplak = () => pg.evaluate(() => {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  for (const id of ['topbar', 'hint', 'combo', 'boosterBar', 'hud'])
    { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
});

for (const n of [9, 10, 72]) {
  await ciplak();
  const ad = await pg.evaluate(l => window.fruitHoleTopDown(l, 915 / 412), n);
  const b = await pg.evaluate(() => window.fruitHoleBoss());
  console.log(`  bölüm ${String(n).padStart(2)}  ${String(ad).padEnd(10)} ` +
    `kolos: ${b.prop || (b.boss ? 'meyve ' + b.type : 'yok')}`);
  await pg.screenshot({ path: `${OUT}/final-${n}.png` });
  // Bir de kolosun üstünden kırpılmış kare: kupanın **yukarıdan** tanınıp
  // tanınmadığı tam boy karede görünmüyor, tahta ekranın üçte birinde kalıyor.
  //
  // Kırpma kutusu sabit ve öyle olabiliyor, çünkü `fruitHoleTopDown` kamerayı
  // her bölümde aynı yere koyuyor ve kolos hep tahtanın üst ucunda.
  await pg.screenshot({
    path: `${OUT}/final-${n}-kupa.png`,
    clip: { x: 116, y: 290, width: 180, height: 180 },
  });
}
console.log(`\n  ${OUT}/`);
console.log('hatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
process.exit(errs.length ? 1 : 0);
