// Donanım geri tuşu oyundan mı çıkarıyor, perdeyi mi kapatıyor?
//
// Android'de geri tuşu, WebView'ın geçmişi boşsa uygulamayı
// kapatıyor. Bu oyun tek sayfa ve hiç gezinmiyor, yani geçmiş hep
// boştu: araştırma ekranını kapatmak için geri basan oyuncu oyundan
// çıkıyordu.
//
// Burada "ev" fabrikanın kendisi — hiçbir perde açık değilken geri
// tuşu uygulamadan çıkmalı. Tarayıcıda donanım tuşu yok;
// `history.back()` onun yerine geçiyor.
//
// Ölçülen:
//   1. Perde yokken geçmişte bizim girdimiz yok
//   2. Her perde geriyle kapanıyor
//   3. Perdeyi normal yoldan kapatmak yığında çöp bırakmıyor
//   4. Dönüş ekranı geriyle kapanınca bekleyen para yanmıyor —
//      perdenin kendi düğmesi çağrıldığı için oyunun yolu aynı
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8787);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8787/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });
await pg.waitForTimeout(300);

const PERDE = ['welcome', 'daily', 'prestige', 'backup', 'research', 'goals', 'shop', 'menu'];
const durum = () => pg.evaluate(ids => ({
  perde: ids.filter(i => document.getElementById(i)?.classList.contains('show')).join(',') || '(yok)',
  uzunluk: window.history.length,
  bizim: !!(window.history.state && window.history.state.mw),
}), PERDE);
const geri = async () => { await pg.goBack({ waitUntil: 'commit' }).catch(() => {}); await pg.waitForTimeout(300); };

console.log('\n1) Perde yokken');
const bas = await durum();
console.log(`     perde ${bas.perde} · geçmiş ${bas.uzunluk} · bizim ${bas.bizim}`);
ok(bas.perde === '(yok)', 'fabrikadayız', bas.perde);
ok(!bas.bizim, 'bizim girdimiz yok — geri uygulamadan çıkar');

console.log('\n2) Perdeler geriyle kapanıyor');
for (const [ac, id] of [['menuBtn', 'menu'], ['shopBtn', 'shop'],
                        ['resBtn', 'research'], ['goalsBtn', 'goals']]) {
  const acildi = await pg.evaluate(b => {
    const e = document.getElementById(b);
    if (!e) return false;
    e.click();
    return true;
  }, ac);
  if (!acildi) { console.log(`     ${id}: açan düğme yok (${ac})`); continue; }
  await pg.waitForTimeout(300);
  const a = await durum();
  await geri();
  const b2 = await durum();
  console.log(`     ${id}: ${a.perde} (bizim ${a.bizim}) → ${b2.perde}`);
  ok(a.perde.includes(id), `${id} açıldı`, a.perde);
  ok(a.bizim, `${id} açıkken geçmişte girdimiz var`);
  ok(!b2.perde.includes(id), `${id} geriyle kapandı`, b2.perde);
  // Menü perdesi alt perdeleri açıyor; her turdan sonra temizle.
  await pg.evaluate(ids => ids.forEach(i =>
    document.getElementById(i)?.classList.remove('show')), PERDE);
  await pg.waitForTimeout(250);
}

console.log('\n3) Dönüş ekranı: geri bekleyen parayı yakmıyor');
const don = await pg.evaluate(async () => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 8); window.jeBuyManager(i); }
  window.jeRefresh();
  window.jeReklamSim(null);
  window.jeOffline(3600);
  await new Promise(r => setTimeout(r, 200));
  return { acik: window.jeDonus().acik, bekleyen: Math.round(window.jeDonus().bekleyen),
           nakit: Math.round(window.jeProbe().cash) };
});
console.log(`     ekran ${don.acik} · bekleyen ${don.bekleyen}`);
ok(don.acik && don.bekleyen > 0, 'dönüş ekranı açıldı ve para bekliyor',
   `${don.acik} / ${don.bekleyen}`);
await geri();
const don2 = await pg.evaluate(() => ({ acik: window.jeDonus().acik,
  nakit: Math.round(window.jeProbe().cash) }));
console.log(`     geriden sonra ekran ${don2.acik}`);
ok(!don2.acik, 'dönüş ekranı geriyle kapandı');
ok(don2.nakit >= don.nakit, 'kasa eksilmedi', `${don.nakit} → ${don2.nakit}`);

console.log('\n4) Normal kapatma çöp bırakmıyor');
const t0 = await durum();
for (let i = 0; i < 3; i++) {
  await pg.evaluate(() => document.getElementById('menuBtn')?.click());
  await pg.waitForTimeout(200);
  await pg.evaluate(() => document.getElementById('closeMenu')?.click());
  await pg.waitForTimeout(300);
}
const t1 = await durum();
console.log(`     geçmiş ${t0.uzunluk} → ${t1.uzunluk} · bizim ${t1.bizim}`);
ok(!t1.bizim, 'girdimiz geri alındı');
ok(t1.uzunluk <= t0.uzunluk + 1, 'geçmiş birikmedi', `${t0.uzunluk} → ${t1.uzunluk}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
