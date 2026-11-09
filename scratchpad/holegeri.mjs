// Donanım geri tuşu oyundan mı çıkarıyor, ekranı mı kapatıyor?
//
// Android'de geri tuşu, WebView'ın geçmişi boşsa uygulamayı
// kapatıyor. Bu oyun tek sayfa ve hiç gezinmiyor, yani geçmiş hep
// boştu: dükkânı kapatmak için geri basan oyuncu **oyundan
// çıkıyordu**, tur ortasındaysa o turu da kaybediyordu. Oyun
// mağazada, yani bu gerçek oyuncuların başına gelen bir şey.
//
// Tarayıcıda donanım tuşu yok; `history.back()` onun yerine geçiyor —
// WebView'ın geri tuşu da geçmiş doluysa tam olarak bunu çağırıyor.
//
// Ölçülen:
//   1. Menüde fazladan geçmiş girdisi yok — oradaki geri uygulamadan
//      çıkmalı, Android'in beklediği davranış bu
//   2. Her ekran geriyle kapanıyor ve menüye dönüyor
//   3. Oynarken geri duraklatıyor, turu bitirmiyor
//   4. Duraklatılmışken geri devam ettiriyor
//   5. Ekranı normal yoldan kapatmak yığında çöp bırakmıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8786);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.addInitScript(() => { localStorage.clear(); localStorage.setItem('fruithole_level', '12'); });
await pg.goto('http://localhost:8786/', { waitUntil: 'load', timeout: 120000 });
await pg.waitForFunction(() => typeof window.fruitHoleWhere === 'function', null, { timeout: 90000 });
await pg.waitForTimeout(1500);
await pg.evaluate(() => { document.getElementById('dailyBtn')?.click(); });
await pg.waitForTimeout(400);

const EKRANLAR = ['levels', 'shop', 'goals', 'upgrades', 'collection',
                  'daily', 'tchest', 'rate', 'diag', 'pause', 'overlay'];
const durum = () => pg.evaluate(ids => ({
  ekran: ids.filter(i => document.getElementById(i)?.classList.contains('show')).join(',') || '(yok)',
  menu: !!document.getElementById('menu')?.classList.contains('show'),
  uzunluk: window.history.length,
  bizim: !!(window.history.state && window.history.state.fh),
}), EKRANLAR);
const geri = async () => { await pg.goBack({ waitUntil: 'commit' }).catch(() => {}); await pg.waitForTimeout(350); };

console.log('\n1) Menüde fazladan girdi yok');
const bas = await durum();
console.log(`     menü ${bas.menu} · ekran ${bas.ekran} · geçmiş ${bas.uzunluk} · bizim girdimizde ${bas.bizim}`);
ok(bas.menu, 'menüdeyiz');
ok(!bas.bizim, 'menüde bizim girdimizin üstünde değiliz — geri uygulamadan çıkar');

console.log('\n2) Ekranlar geriyle kapanıyor');
for (const [btn, id] of [['levelsBtn', 'levels'], ['shopBtn', 'shop'],
                         ['goalsBtn', 'goals'], ['upgBtn', 'upgrades']]) {
  await pg.evaluate(b => document.getElementById(b)?.click(), btn);
  await pg.waitForTimeout(350);
  const a = await durum();
  await geri();
  const b2 = await durum();
  console.log(`     ${id}: ${a.ekran} (bizim ${a.bizim}) → ${b2.ekran} menü ${b2.menu}`);
  ok(a.ekran === id, `${id} açıldı`, a.ekran);
  ok(a.bizim, `${id} açıkken geçmişte girdimiz var`);
  ok(b2.menu && b2.ekran === '(yok)', `${id} geriyle kapandı`, `${b2.ekran} menü ${b2.menu}`);
}

console.log('\n3) Oynarken geri duraklatıyor');
await pg.evaluate(() => { document.getElementById('playBtn').click(); });
await pg.waitForTimeout(2000);
const o1 = await pg.evaluate(() => ({ state: window.fruitHoleDailyState ? 'x' : 'x',
  oyun: document.getElementById('pause').classList.contains('show') }));
const d1 = await durum();
console.log(`     tur başladı · ekran ${d1.ekran} · bizim ${d1.bizim}`);
ok(!d1.menu, 'menü kapandı');
ok(d1.bizim, 'oynarken geçmişte girdimiz var');
await geri();
const d2 = await durum();
console.log(`     geriden sonra: ekran ${d2.ekran}`);
ok(d2.ekran === 'pause', 'geri turu duraklattı', d2.ekran);
await geri();
const d3 = await durum();
console.log(`     ikinci geri: ekran ${d3.ekran} · menü ${d3.menu}`);
ok(d3.ekran === '(yok)' && !d3.menu, 'ikinci geri devam ettirdi', `${d3.ekran} menü ${d3.menu}`);

console.log('\n4) Menüye dönüş yığını temizliyor');
await pg.evaluate(() => {
  document.getElementById('pauseBtn').click();
});
await pg.waitForTimeout(300);
await pg.evaluate(() => document.getElementById('pauseMenu')?.click());
await pg.waitForTimeout(700);
const m0 = await durum();
console.log(`     menü ${m0.menu} · bizim ${m0.bizim} · geçmiş ${m0.uzunluk}`);
ok(m0.menu, 'menüye dönüldü');
ok(!m0.bizim, 'menüye dönünce girdimiz geri alındı');

console.log('\n5) Üç kez açıp kapamak geçmişi şişirmiyor');
for (let i = 0; i < 3; i++) {
  await pg.evaluate(() => document.getElementById('shopBtn').click());
  await pg.waitForTimeout(200);
  await pg.evaluate(() => document.getElementById('shopClose').click());
  await pg.waitForTimeout(350);
}
const m1 = await durum();
console.log(`     geçmiş ${m0.uzunluk} → ${m1.uzunluk} · bizim ${m1.bizim}`);
ok(!m1.bizim, 'yine menüdeyiz ve girdimiz yok');
ok(m1.uzunluk <= m0.uzunluk + 1, 'geçmiş birikmedi', `${m0.uzunluk} → ${m1.uzunluk}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
