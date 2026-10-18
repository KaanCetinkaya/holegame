// Donanım geri tuşu oyundan mı çıkarıyor, ekranı mı kapatıyor?
//
// Android'de geri tuşu, WebView'ın geçmişi boşsa uygulamayı kapatıyor.
// Bu oyun tek sayfa ve hiç gezinmiyor, yani geçmiş hep boştu: dükkânı
// kapatmak için geri basan oyuncu **oyundan çıkıyordu**, tur
// ortasındaysa turu da gidiyordu.
//
// Tarayıcıda donanım tuşu yok; `history.back()` onun yerine geçiyor —
// WebView'ın geri tuşu da geçmiş doluysa tam olarak bunu çağırıyor.
// Yani burada ölçülen şey oyunun mantığı: geçmişte bir girdi var mı,
// ve `popstate` geldiğinde doğru ekran mı kapanıyor.
//
// Ölçülen:
//   1. Menüde fazladan geçmiş girdisi yok — oradaki geri tuşu
//      uygulamadan çıkmalı, bu Android'in beklediği şey
//   2. Dükkân/harita/hedefler açıkken geri menüye dönüyor
//   3. Oynarken geri duraklatıyor, turu bitirmiyor
//   4. Duraklatılmışken geri devam ettiriyor
//   5. Ekranı normal yoldan kapatmak yığında çöp bırakmıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8784);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8784/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => document.getElementById('dOk')?.click());
await pg.waitForTimeout(200);

const durum = () => pg.evaluate(() => ({
  ekran: [...document.querySelectorAll('.screen.show')].map(s => s.id).join(',') || '(yok)',
  state: window.sliceProbe().state,
  uzunluk: window.history.length,
  // Bizim koyduğumuz girdinin üstünde miyiz? Menüdeyken olmamalı:
  // oradaki geri tuşunun uygulamadan çıkması için imlecin oyunun ilk
  // girdisinde durması gerekiyor.
  bizim: !!(window.history.state && window.history.state.sl),
}));
// Geri tuşunun tarayıcıdaki karşılığı.
const geri = async () => { await pg.goBack({ waitUntil: 'commit' }).catch(() => {}); await pg.waitForTimeout(250); };

console.log('\n1) Menüde fazladan girdi yok');
const bas = await durum();
console.log(`     ekran ${bas.ekran} · geçmiş ${bas.uzunluk} · bizim girdimizde ${bas.bizim}`);
ok(bas.ekran === 'menu', 'menüdeyiz', bas.ekran);
ok(!bas.bizim, 'menüde bizim girdimizin üstünde değiliz — geri uygulamadan çıkar');
const temelUzunluk = bas.uzunluk;

console.log('\n2) Dükkân açıkken geri menüye dönüyor');
await pg.evaluate(() => document.getElementById('shopBtn').click());
await pg.waitForTimeout(200);
const d2a = await durum();
console.log(`     açıldı: ${d2a.ekran} · geçmiş ${d2a.uzunluk} · bizim girdimizde ${d2a.bizim}`);
ok(d2a.ekran === 'shop', 'dükkân açıldı', d2a.ekran);
ok(d2a.bizim, 'ekran açıkken bizim girdimizin üstündeyiz');
ok(d2a.uzunluk > temelUzunluk, 'geçmişe bir girdi kondu',
   `${temelUzunluk} → ${d2a.uzunluk}`);
await geri();
const d2b = await durum();
console.log(`     geriden sonra: ${d2b.ekran}`);
ok(d2b.ekran === 'menu', 'geri menüye döndü', d2b.ekran);

console.log('\n3) Harita ve hedefler');
for (const [btn, id] of [['mapBtn', 'map'], ['goalsBtn', 'goals']]) {
  await pg.evaluate(b => document.getElementById(b).click(), btn);
  await pg.waitForTimeout(200);
  const a = await durum();
  await geri();
  const b2 = await durum();
  console.log(`     ${id}: ${a.ekran} → ${b2.ekran}`);
  ok(a.ekran === id && b2.ekran === 'menu', `${id} geriyle kapandı`, `${a.ekran} → ${b2.ekran}`);
}

console.log('\n4) Oynarken geri duraklatıyor');
await pg.evaluate(() => { window.sliceStart(4); window.sliceRun(120); });
await pg.waitForTimeout(200);
const o1 = await durum();
console.log(`     tur: ${o1.state} · ekran ${o1.ekran}`);
ok(o1.state === 'playing', 'tur sürüyor', o1.state);
await geri();
const o2 = await durum();
console.log(`     geriden sonra: ${o2.state} · ekran ${o2.ekran}`);
ok(o2.state === 'paused' && o2.ekran === 'pause', 'geri turu duraklattı',
   `${o2.state} / ${o2.ekran}`);
// İkinci geri: duraklatılmışken devam ettiriyor.
await geri();
const o3 = await durum();
console.log(`     ikinci geri: ${o3.state} · ekran ${o3.ekran}`);
ok(o3.state === 'playing', 'ikinci geri devam ettirdi', o3.state);

console.log('\n5) Normal yoldan kapatmak çöp bırakmıyor');
// Menüye dönüp iki kere dükkâna girip çıkınca geçmiş uzunluğu
// birikmemeli: biriken her girdi, menüdeki geri tuşunun bir kez daha
// yutulması demek.
await pg.evaluate(() => { document.getElementById('pauseBtn').click(); });
await pg.waitForTimeout(150);
await pg.evaluate(() => { document.getElementById('quitBtn').click(); });
await pg.waitForTimeout(300);
const m0 = await durum();
for (let i = 0; i < 3; i++) {
  await pg.evaluate(() => document.getElementById('shopBtn').click());
  await pg.waitForTimeout(150);
  await pg.evaluate(() => document.getElementById('shopClose').click());
  await pg.waitForTimeout(300);
}
const m1 = await durum();
console.log(`     menü ${m0.ekran} geçmiş ${m0.uzunluk} → üç açıp kapamadan sonra ${m1.uzunluk}`);
ok(m1.ekran === 'menu', 'menüdeyiz', m1.ekran);
ok(!m1.bizim, 'menüye dönünce girdimiz geri alındı');
ok(m1.uzunluk <= m0.uzunluk + 1, 'geçmiş birikmedi',
   `${m0.uzunluk} → ${m1.uzunluk}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
