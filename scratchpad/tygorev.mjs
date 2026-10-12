// Günlük görevler gerçekten günlük mü, ve sayaçlar doğru şeyi mi sayıyor?
//
// Oyunu her gün açmak için bir sebep: havuzdan üç görev, gün dönünce
// yenileniyor. Kalıbı Fruit Hole'dan, hedefleri fabrikaya göre.
//
// Ölçülen:
//   1. Üç görev seçiliyor ve hedefleri oyuncunun ölçeğine göre
//   2. Sayaçlar doğru olayı sayıyor (sevkiyat, yükseltme, kazanç)
//   3. Hedef **donuyor** — oyuncu büyüdükçe hedef büyümüyor, yoksa görev
//      hiç bitmez
//   4. Ödül `totalEarned`'a yazılmıyor — hedeflerde ölçülerek öğrenilen
//      kural: ödül kendi ölçüsünü beslememeli
//   5. Gün dönünce liste yenileniyor ve sayaçlar sıfırlanıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8587);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8587/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Üç görev');
const g1 = await pg.evaluate(() => { window.jeWipeProgress(); return window.jeGorev(); });
for (const g of g1.liste) console.log(`     ${g.ad.replace('{n}', g.hedef)}`);
ok(g1.liste.length === 3, 'üç görev seçildi', `${g1.liste.length}`);
ok(new Set(g1.liste.map(g => g.id)).size === 3, 'üçü de farklı');
ok(g1.liste.every(g => g.hedef > 0), 'hepsinin hedefi var');
ok(g1.liste.every(g => !g.bitti), 'hiçbiri başta bitmiş değil');

console.log('\n2) Sayaçlar');
const say = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e9);
  window.jeBuy(0, 5);                       // beş yükseltme
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const once = window.jeGorev().sayac;
  for (let i = 0; i < 100; i++) window.jeStep(0.1);   // 10 saniye üretim
  return { once, sonra: window.jeGorev().sayac };
});
console.log(`     yükseltme ${say.sonra.yukseltme} · sevkiyat ${say.sonra.sevk.toFixed(0)} · kazanç ${say.sonra.kazanc.toFixed(0)}`);
ok(say.sonra.yukseltme >= 5, 'yükseltme sayılıyor', `${say.sonra.yukseltme}`);
ok(say.sonra.sevk > say.once.sevk, 'sevkiyat sayılıyor');
ok(say.sonra.kazanc > say.once.kazanc, 'kazanç sayılıyor');

console.log('\n3) Hedef donuyor');
// Hedef her okunuşta yeniden hesaplansaydı, oyuncu büyüdükçe hedef de
// büyür ve görev hiçbir zaman bitmezdi — kendi kuyruğunu kovalayan bir
// çubuk. Gün kurulurken bir kez hesaplanıp kaydediliyor.
const don = await pg.evaluate(() => {
  window.jeWipeProgress();
  const once = window.jeGorev().liste.map(g => g.hedef);
  window.jeGive(1e12);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 200); window.jeGiveManager(i); }
  return { once, sonra: window.jeGorev().liste.map(g => g.hedef) };
});
console.log(`     hedefler ${JSON.stringify(don.once)} → ${JSON.stringify(don.sonra)}`);
ok(JSON.stringify(don.once) === JSON.stringify(don.sonra), 'ölçek büyüyünce hedef sabit kaldı');

console.log('\n4) Ödül kendi ölçüsünü beslemiyor');
const odul = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  // Yükseltme görevini bitir.
  window.jeBuy(0, 60);
  const onceToplam = window.jeProbe().total;
  const oncePuan = window.jeProbe().points + window.jeProbe().pending;
  const alindi = window.jeClaimGorev();
  return { alindi, toplamFark: window.jeProbe().total - onceToplam,
           puanFark: (window.jeProbe().points + window.jeProbe().pending) - oncePuan };
});
console.log(`     alınan ödül ${odul.alindi} · toplam kazanç değişimi ${odul.toplamFark} · puan değişimi ${odul.puanFark}`);
ok(odul.alindi > 0, 'bir görev alındı');
ok(odul.toplamFark === 0, 'ödül toplam kazanca yazılmadı', `${odul.toplamFark}`);
ok(odul.puanFark === 0, 'ödül prestij puanı üretmedi', `${odul.puanFark}`);

console.log('\n5) Gün dönünce');
const gun = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e9);
  window.jeBuy(0, 5);
  const once = window.jeGorev();
  const sonra = window.jeGunGec();
  return { onceGun: once.gun, sonraGun: sonra.gun,
           onceYuk: once.sayac.yukseltme, sonraYuk: sonra.sayac.yukseltme };
});
console.log(`     gün ${gun.onceGun} → ${gun.sonraGun} · yükseltme sayacı ${gun.onceYuk} → ${gun.sonraYuk}`);
ok(gun.sonraGun === gun.onceGun, 'yeni gün bugünün numarasını alıyor');
ok(gun.sonraYuk === 0, 'sayaçlar sıfırlandı', `${gun.sonraYuk}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
