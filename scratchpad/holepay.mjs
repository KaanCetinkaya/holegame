// Dev yutulunca ödediği sayı ekranda beliriyor mu, ve arkasında çöp
// bırakıyor mu?
//
//   node build-www.mjs && node scratchpad/holepay.mjs
//
// Neden var: oyunun en önemli ekonomik gerçeği hiçbir yerde yazmıyordu — bir
// dev sıradan meyvenin **on iki katı** ödüyor. Sayıyı devin üstünde
// göstermek bunu söylüyor, ama iki şekilde sessizce bozulabiliyor:
//
//   1. Kadraj dışındaki bir dev yutulursa yansıtma kameranın arkasına düşer
//      ve sayı ekranın **ortasında** belirir — oyuncu neyin ödediğini değil,
//      ekranın ortasında bir sayı gördüğünü sanır.
//   2. Etiketler silinmezse birikir. Bir bölümde onlarca dev var ve her biri
//      ekranın üstünde kalıcı, görünmez bir katman bırakır.
//
// İkisi de gözle görünmüyor: birincisi ancak dev kadraj dışındayken,
// ikincisi ancak yüzlerce yutmadan sonra.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8302);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.setItem('fruithole_level', '14'));
await pg.goto('http://localhost:8302/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
await pg.waitForTimeout(2500);
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2500);

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// Deliği bir devin üstüne koyup yutturmak: gerçek parmakla sürmek
// konteynerde zamanlamaya bağlı olurdu ve GPU yok.
const yut = await pg.evaluate(() => window.fruitHoleEatGiant());
if (!yut) { console.log('  bu tahtada dev yok'); }
else console.log(`  dev yarıçapı ${yut.r}, ağız ${yut.agiz} -> yutuldu: ${yut.yutuldu}`);

// Oyunun kendi karesini bir süre döndür ki yeme kontrolü çalışsın.
await pg.waitForTimeout(1500);
const d = await pg.evaluate(() => ({
  etiket: document.querySelectorAll('.payup').length,
  metin: [...document.querySelectorAll('.payup')].map(e => e.textContent),
  konum: [...document.querySelectorAll('.payup')].map(e => ({
    l: parseFloat(e.style.left), t: parseFloat(e.style.top),
  })),
  w: innerWidth, h: innerHeight,
}));
console.log(`  ekranda ${d.etiket} etiket: ${d.metin.join(', ') || '-'}`);
check(d.etiket > 0, 'dev yutulunca ödeme etiketi çıkıyor');
// Sayı on iki katı olmalı: zincir çarpanı 1-5, yani 12 ile 60 arası.
const sayilar = d.metin.map(t => Number(t.replace('+', '')));
check(sayilar.every(n => n >= 12 && n <= 60), 'ödeme devin katı (12-60 arası)',
  sayilar.join(', '));
// Ekranın ortasında belirmemeli: kameranın arkasına düşen nokta oraya
// yansıyor ve bu tam olarak gizlenmesi gereken hata.
const orta = d.konum.filter(k =>
  Math.abs(k.l - d.w / 2) < 1 && Math.abs(k.t - d.h / 2) < 1);
check(orta.length === 0, 'etiket ekranın tam ortasında belirmiyor',
  `${orta.length} tane ortada`);
// Ve ekranın **içinde** olmalı. Kadrajın kenarındaki bir dev yutulunca
// yansıtılan nokta dışarı düşüyordu (ölçüldü: y = -32), yani ödeme hiç
// görünmüyordu.
const disari = d.konum.filter(k => k.l < 0 || k.t < 0 || k.l > d.w || k.t > d.h);
check(disari.length === 0, 'etiket ekranın içinde',
  disari.map(k => `(${Math.round(k.l)},${Math.round(k.t)})`).join(' '));

// Birikme: etiketler animasyon bitince kendini silmeli.
await pg.waitForTimeout(2200);
const sonra = await pg.evaluate(() => document.querySelectorAll('.payup').length);
console.log(`  2.2 saniye sonra ekranda ${sonra} etiket`);
check(sonra === 0, 'etiketler kendini siliyor (birikmiyor)', `${sonra} kaldı`);

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
