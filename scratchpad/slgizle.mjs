// Ekran elden gidince tur duruyor mu?
//
// `requestAnimationFrame` arka planda çağrılmıyor, yani oyun orada
// "devam etmiyor". Sorun dönüşte: bıçak bırakıldığı yerde ve saniyede
// on beş birimle hareket hâlinde, ve oyuncu kendi yapmadığı bir
// hamleyle ölüyor. Telefonu kulağına götürmek, bildirime bakmak, bir
// kapı çalması — hepsi bu.
//
// Gizlenme taklit: `document.hidden` geçersiz kılınıp
// `visibilitychange` elle gönderiliyor. Başsız tarayıcıda sayfa
// gerçekten gizlenmiyor (`document.hidden` false kalıyor) ve o hâlde
// ölçüm hiçbir şey ölçmüyor — Fruit Hole'un `holehide`'ı da bu yolu
// kullanıyor.
//
// Ölçülen:
//   1. Oynarken gizlenince tur duruyor ve duraklat ekranı açılıyor
//   2. Dururken mesafe ilerlemiyor
//   3. Geri dönüş kendiliğinden oynatmıyor — oyuncu RESUME'a basıyor
//   4. Menüdeyken gizlenmek hiçbir şeyi bozmuyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8776);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8776/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => document.getElementById('dOk')?.click());

const gizle = (on) => pg.evaluate(o => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => o });
  Object.defineProperty(document, 'visibilityState',
    { configurable: true, get: () => (o ? 'hidden' : 'visible') });
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
}, on);

console.log('\n1) Oynarken gizlenmek');
await pg.evaluate(() => { window.sliceStart(5); window.sliceRun(120); });
const once = await pg.evaluate(() => window.sliceProbe());
ok(once.state === 'playing', 'tur gerçekten başlamıştı', once.state);
await gizle(true);
ok(await pg.evaluate(() => document.hidden), 'sayfa gizli sayılıyor');
await pg.waitForTimeout(250);
const gizliyken = await pg.evaluate(() => ({
  ...window.sliceProbe(),
  ekran: [...document.querySelectorAll('.screen.show')].map(s => s.id).join(','),
}));
console.log(`     ${once.state} → ${gizliyken.state} · ekran "${gizliyken.ekran}" · yol ${once.dist} → ${gizliyken.dist}`);
ok(gizliyken.state === 'paused', 'tur durdu', gizliyken.state);
ok(gizliyken.ekran === 'pause', 'duraklat ekranı açıldı', gizliyken.ekran);

console.log('\n2) Dururken ilerlemiyor');
// Oyunun kendi adımı çağrılıyor: duraklatma bir ekran değil, benzetimin
// durması olmalı.
const durgun = await pg.evaluate(() => {
  const a = window.sliceProbe().dist;
  for (let i = 0; i < 120; i++) window.sliceStep(1 / 60);
  return { a, b: window.sliceProbe().dist };
});
console.log(`     120 adımda ${durgun.a} → ${durgun.b}`);
ok(durgun.a === durgun.b, 'dururken yol almadı', `${durgun.a} → ${durgun.b}`);

console.log('\n3) Geri dönüş');
await gizle(false);
await pg.waitForTimeout(250);
const donus = await pg.evaluate(() => ({
  ...window.sliceProbe(),
  ekran: [...document.querySelectorAll('.screen.show')].map(s => s.id).join(','),
}));
console.log(`     ${donus.state} · ekran "${donus.ekran}"`);
ok(donus.state === 'paused', 'kendiliğinden devam etmedi', donus.state);
ok(donus.ekran === 'pause', 'duraklat ekranı duruyor', donus.ekran);
const devam = await pg.evaluate(() => {
  document.getElementById('resumeBtn').click();
  const a = window.sliceProbe().dist;
  for (let i = 0; i < 60; i++) { window.sliceAutoPlay(); window.sliceStep(1 / 60); }
  const p = window.sliceProbe();
  return { a, b: p.dist, state: p.state };
});
console.log(`     RESUME sonrası ${devam.a} → ${devam.b} (${devam.state})`);
ok(devam.state === 'playing' && devam.b > devam.a, 'RESUME ile tur devam etti',
   `${devam.a} → ${devam.b} (${devam.state})`);

console.log('\n4) Menüdeyken gizlenmek');
const menu = await pg.evaluate(() => {
  document.getElementById('quitBtn')?.click();
  return window.sliceProbe().state;
});
await gizle(true);
await gizle(false);
await pg.waitForTimeout(200);
const sonra = await pg.evaluate(() => ({
  ...window.sliceProbe(),
  ekran: [...document.querySelectorAll('.screen.show')].map(s => s.id).join(','),
}));
console.log(`     ${menu} → ${sonra.state} · ekran "${sonra.ekran}"`);
ok(sonra.state === 'menu' && sonra.ekran === 'menu', 'menü olduğu gibi kaldı',
   `${sonra.state} / ${sonra.ekran}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
