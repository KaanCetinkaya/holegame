// Bildirim doğru anda, doğru şeyi mi söylüyor?
//
// Idle oyunun bildirimi "gel oyna" demez, **depo doldu** der. Oyun kapalıyken
// üretim sürüyor ama `offlineCap()` tavanı var; tavana değdikten sonra geçen
// her dakika kaybedilmiş üretim ve oyuncunun bunu bilmesinin başka yolu yok.
//
// İki durum ve ikisi aynı şeyi söyleyemez:
//   zincir kendi kendine dönüyorsa  → tavana değdiği an, "depo doldu"
//   dönmüyorsa (müdür yok)          → kapalıyken hiçbir şey birikmiyor,
//                                     "depo doldu" demek yalan olur
//
// Bir de izin zamanı: Android 13+ ikinci reddi kalıcı sayıyor, yani ilk
// açılışta sormak hakkı bir kere harcamak demek.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8578);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8578/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Müdürsüz oyuncu — kapalıyken hiçbir şey birikmiyor');
const bos = await pg.evaluate(() => {
  window.jeWipeProgress();
  return { n: window.jeNotif(), akis: window.jeProbe() };
});
console.log(`     "${bos.n.title}" · ${Math.round(bos.n.sonra / 60)} dk sonra`);
console.log(`     ${bos.n.body}`);
ok(!/full|waiting/i.test(bos.n.title + bos.n.body), 'dolu depo vaat etmiyor');
ok(bos.n.sonra > 0, 'geçmişe kurulmuyor', `${bos.n.sonra} sn`);
ok(bos.n.sonra <= 24 * 3600, 'bir günü geçmiyor', `${Math.round(bos.n.sonra / 3600)} saat`);

console.log('\n2) Müdürü olan oyuncu — depo doluyor');
const dolu = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e12);
  for (let i = 0; i < 4; i++) window.jeGiveManager(i);
  const p = window.jeProbe();
  return { n: window.jeNotif(), tavan: window.jeRes ? null : null, probe: p };
});
console.log(`     "${dolu.n.title}" · ${(dolu.n.sonra / 3600).toFixed(1)} saat sonra`);
console.log(`     ${dolu.n.body}`);
ok(/full/i.test(dolu.n.title), 'depo dolduğunu söylüyor');
// `offlineCap()` tabanı dört saat; araştırma yoksa tam dört olmalı.
ok(Math.abs(dolu.n.sonra - 4 * 3600) < 60, 'tam tavana değdiği an', `${(dolu.n.sonra / 3600).toFixed(2)} saat`);
ok(dolu.n.body.includes('4 hours'), 'kaç saat beklediğini yazıyor');

console.log('\n3) Gece yarısı kenarı');
// Müdürsüz plan "bugün 19:00, geçtiyse yarın" diyor. Saat 19'u geçmişken
// kurulan bir bildirim geçmişe düşerse hiç gelmez — ilk hâlinde bu hata
// yapılması çok kolay, o yüzden ölçülüyor.
const gece = await pg.evaluate(() => {
  window.jeWipeProgress();
  const out = [];
  const gercek = Date.now;
  for (const saat of [8, 18, 19, 20, 23]) {
    const d = new Date(); d.setHours(saat, 30, 0, 0);
    Date.now = () => d.getTime();
    const n = window.jeNotif();
    out.push({ saat, sonra: n.sonra });
  }
  Date.now = gercek;
  return out;
});
for (const g of gece) console.log(`     saat ${g.saat}:30 → ${(g.sonra / 3600).toFixed(1)} saat sonra`);
ok(gece.every(g => g.sonra > 0), 'hiçbir saatte geçmişe düşmüyor');

console.log('\n4) İzin ne zaman isteniyor');
const izin = await pg.evaluate(() => {
  window.jeWipeProgress();
  const yeni = window.jeNotif().hakEtti;
  window.jeGive(1e9);
  window.jeBuy(0, 12);
  const seviyeli = window.jeNotif().hakEtti;
  window.jeWipeProgress();
  window.jeGiveManager(0);
  const mudurlu = window.jeNotif().hakEtti;
  return { yeni, seviyeli, mudurlu };
});
console.log(`     yeni oyuncu: ${izin.yeni} · 10+ seviye: ${izin.seviyeli} · müdür almış: ${izin.mudurlu}`);
ok(izin.yeni === false, 'ilk açılışta sorulmuyor');
ok(izin.seviyeli === true, '10. seviyede soruluyor');
ok(izin.mudurlu === true, 'müdür alınınca soruluyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
