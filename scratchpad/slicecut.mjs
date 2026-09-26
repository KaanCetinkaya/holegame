// Kesimin geri bildirimi: sayı çıkıyor mu, doğru yerde mi, birikiyor mu?
//
//   node build-www.mjs && node scratchpad/slicecut.mjs
//
// Neden var: aynı şey Fruit Hole'da yapılmıştı ve iki ayrı şekilde
// bozulmuştu. İkisi de gözle görünmüyor.
//
//   1. Kadraj dışındaki bir nokta kameranın arkasına düşünce yansıması
//      ekranın **ortasına** çıkıyor. Oyuncu neyin puan verdiğini değil,
//      ekranın ortasında bir sayı belirdiğini görüyor.
//   2. Etiketler silinmezse birikiyor. Bir turda yüzlerce kesim var ve her
//      biri ekranın üstünde görünmez bir katman bırakıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8197);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
await pg.goto('http://localhost:8197/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// Kesim ve okuma **aynı çağrıda**: etiket 0.62 saniyede kendini siliyor,
// beklemek yük altında yarışı kaybediyor. Bu ders holepay.mjs'de bir kez
// bedel ödeyerek öğrenildi.
console.log('1) Kesimde sayı çıkıyor mu');
const ilk = await pg.evaluate(async () => {
  window.sliceStart(3);
  await new Promise(r => setTimeout(r, 300));
  const t0 = window.sliceProbe().cut;
  // Kesilene kadar sür.
  await new Promise(res => {
    const t = setInterval(() => {
      window.sliceAutoPlay();
      if (window.sliceProbe().cut > t0 || window.sliceProbe().state !== 'playing') {
        clearInterval(t); res();
      }
    }, 16);
    setTimeout(() => { clearInterval(t); res(); }, 15000);
  });
  const el = [...document.querySelectorAll('.cutpop')];
  return {
    kesildi: window.sliceProbe().cut,
    adet: el.length,
    metin: el.map(e => e.textContent),
    konum: el.map(e => ({ l: parseFloat(e.style.left), t: parseFloat(e.style.top) })),
    w: innerWidth, h: innerHeight,
  };
});
console.log(`  ${ilk.kesildi} kesim, ekranda ${ilk.adet} etiket: ${ilk.metin.join(', ') || '-'}`);
check(ilk.adet > 0, 'kesimde sayı beliriyor');
check(ilk.metin.every(t => /^\+\d+$/.test(t)), 'sayı "+N" biçiminde', ilk.metin.join(', '));

// Ekranın tam ortasında belirmemeli: kameranın arkasına düşen nokta oraya
// yansıyor ve gizlenmesi gereken hata tam olarak bu.
const orta = ilk.konum.filter(k =>
  Math.abs(k.l - ilk.w / 2) < 1 && Math.abs(k.t - ilk.h / 2) < 1);
check(orta.length === 0, 'etiket ekranın tam ortasında belirmiyor', `${orta.length} tane`);
const disari = ilk.konum.filter(k => k.l < 0 || k.t < 0 || k.l > ilk.w || k.t > ilk.h);
check(disari.length === 0, 'etiket ekranın içinde',
  disari.map(k => `(${Math.round(k.l)},${Math.round(k.t)})`).join(' '));

// --- birikme ---
//
// Bütün bir tur oynanıyor ve sonunda ekranda etiket kalmamalı. Tek kesimle
// bakmak birikmeyi göstermiyor: sorun yüzlerce kesimden sonra çıkıyor.
console.log('\n2) Bir tur sonunda birikme');
const tur = await pg.evaluate(async () => {
  window.sliceStart(6);
  await new Promise(res => {
    const t = setInterval(() => {
      window.sliceAutoPlay();
      if (window.sliceProbe().state !== 'playing') { clearInterval(t); res(); }
    }, 16);
    setTimeout(() => { clearInterval(t); res(); }, 40000);
  });
  return { kesildi: window.sliceProbe().cut };
});
await pg.waitForTimeout(1200);
const kalan = await pg.evaluate(() => document.querySelectorAll('.cutpop').length);
console.log(`  ${tur.kesildi} kesim yapıldı, 1.2 saniye sonra ekranda ${kalan} etiket`);
check(kalan === 0, 'etiketler kendini siliyor (birikmiyor)', `${kalan} kaldı`);

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
