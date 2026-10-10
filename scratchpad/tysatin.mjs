// Satın alınan şey teslim ediliyor mu, ve dengeye ne yapıyor?
//
// Üç ürün var: kalıcı çifte gelir, dört müdür, ve 12 saatlik üretim
// (tekrar alınabilir). Ölçülen üç şey:
//
//   1. Alınan teslim ediliyor mu — ve kalıcı olan "OWNED"a geçiyor mu.
//   2. Çifte gelir **yalnızca parayı** ikiye katlıyor mu. Üretim hızına
//      dokunursa darboğaz hesabı ve tampon doluluğu değişir, yani oyunun
//      dengesi satılan bir çarpanla yeniden şekillenir. Çarpan
//      `unitPrice()` üzerinde durmalı, `rateOf()` üzerinde değil.
//   3. Tekrar alınabilir ürün gerçekten tekrar alınabiliyor mu.
//
// Tarayıcıda eklenti yok ve `purchase()` orada true dönüyor — bilerek,
// akışın yürünebilmesi için. Yani buradan ölçülen şey **teslimat**, Play
// ile anlaşma değil; o ancak cihazda denenir.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8583);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8583/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Üç ürün');
await pg.evaluate(() => { window.jeWipeProgress(); window.jeTutSkip(); });
const sh = await pg.evaluate(() => window.jeShop());
for (const u of sh.urunler)
  console.log(`     ${u.ad.padEnd(22)} ${u.fiyat.padStart(6)}  ${u.kalici ? 'kalıcı' : 'tekrar alınabilir'}`);
ok(sh.urunler.length === 3, 'üç ürün');
ok(sh.urunler.filter(u => u.kalici).length === 2, 'ikisi kalıcı');
ok(sh.urunler.every(u => !u.sahip), 'hiçbiri başta sahipli değil');

console.log('\n2) Çifte gelir yalnızca parayı katlıyor');
const cift = await pg.evaluate(async () => {
  window.jeWipeProgress();
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const once = { hiz: window.jeRates()[0], fiyat: window.jeShop().birimFiyat,
                 gelir: window.jeProbe().income };
  await window.jeBuyProduct('motorworks_double');
  return { once, sonra: { hiz: window.jeRates()[0], fiyat: window.jeShop().birimFiyat,
                          gelir: window.jeProbe().income },
           carpan: window.jeShop().carpan };
});
console.log(`     istasyon hızı  ${cift.once.hiz} → ${cift.sonra.hiz}`);
console.log(`     birim fiyat    ${cift.once.fiyat} → ${cift.sonra.fiyat}`);
console.log(`     gelir          ${cift.once.gelir} → ${cift.sonra.gelir}`);
ok(cift.carpan === 2, 'çarpan 2');
ok(cift.sonra.hiz === cift.once.hiz, 'üretim hızı DEĞİŞMEDİ', `${cift.once.hiz} → ${cift.sonra.hiz}`);
ok(Math.abs(cift.sonra.fiyat / cift.once.fiyat - 2) < 1e-6, 'birim fiyat tam iki katı');
ok(Math.abs(cift.sonra.gelir / cift.once.gelir - 2) < 1e-6, 'gelir tam iki katı');

console.log('\n3) Sahip olunan tekrar satılmıyor');
const tekrar = await pg.evaluate(() => window.jeShop().urunler.find(u => u.id === 'motorworks_double'));
ok(tekrar.sahip, 'çifte gelir sahipli görünüyor');

console.log('\n4) Dört müdür');
const mudur = await pg.evaluate(async () => {
  window.jeWipeProgress();
  const once = window.jeProbe().mgr.filter(Boolean).length;
  await window.jeBuyProduct('motorworks_managers');
  return { once, sonra: window.jeProbe().mgr.filter(Boolean).length };
});
console.log(`     müdür sayısı ${mudur.once} → ${mudur.sonra}`);
ok(mudur.sonra === 4, 'dördü de işe alındı');

console.log('\n5) Zaman atlama tekrar alınabiliyor');
const atla = await pg.evaluate(async () => {
  window.jeWipeProgress();
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const a = window.jeProbe().cash;
  await window.jeBuyProduct('motorworks_skip12');
  const b = window.jeProbe().cash;
  await window.jeBuyProduct('motorworks_skip12');
  const c = window.jeProbe().cash;
  return { ilk: b - a, ikinci: c - b, gelir: window.jeProbe().income };
});
console.log(`     1. alım ${atla.ilk.toFixed(0)} · 2. alım ${atla.ikinci.toFixed(0)}`);
ok(atla.ilk > 0, 'ilk alım ödüyor');
ok(Math.abs(atla.ikinci - atla.ilk) < 1, 'ikinci alım da aynısını ödüyor');
// 12 saat, zincirin kendi kendine döndüğü hız üzerinden.
ok(Math.abs(atla.ilk - atla.gelir * 12 * 3600) / atla.ilk < 0.01,
   '12 saatlik üretim kadar', `${(atla.ilk / atla.gelir / 3600).toFixed(2)} saat`);

console.log('\n6) Müdürsüz oyuncuya sıfır verilmiyor');
// Zincir dönmüyorsa 12 saatlik otomatik kazanç sıfır. Para ödeyip sıfır
// almak, satılabilecek en kötü şey.
const bos = await pg.evaluate(async () => {
  window.jeWipeProgress();
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 20);
  const a = window.jeProbe().cash;
  await window.jeBuyProduct('motorworks_skip12');
  return window.jeProbe().cash - a;
});
console.log(`     müdürsüz alımda verilen: ${bos.toFixed(0)}`);
ok(bos > 0, 'sıfır vermiyor', `${bos.toFixed(0)}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
