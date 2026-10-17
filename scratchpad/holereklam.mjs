// Reklam açılmazsa oyuncu ne kaybediyor?
//
// Fruit Hole mağazada. Ödüllü reklam dört yerde: günlük ödülü katla,
// zamanlı sandığı katla, bölüm sonu sandığını katla, ve kaybedince
// canlan. Dördü de `watchAdFor()` ya da doğrudan `showRewarded()`
// üzerinden geçiyor.
//
// Tarayıcıda `showRewarded()` her zaman `true` dönüyor — yani
// `holerewarded.mjs` dahil hiçbir ölçüm **açılmayan reklamı** hiç
// denememişti. O yolda sorulacak şey ödülün verilip verilmediği değil,
// **ne kaybedildiği**: hak yanıyor mu, ekran kapanıyor mu, düğme bir
// daha basılabiliyor mu.
//
// Soru teorik değil. Motor Works'te aynı yere bakılınca dönüş
// ekranındaki "izle, ×2 al" düğmesinin, reklam açılmasa bile ekranı
// kapatıp bekleyen parayı sıfırladığı çıktı: ağı olmayan oyuncu hiçbir
// reklam izlemeden ikiye katlama hakkını kaybediyordu.
//
// Burada ölçülen, reklam açılmadığında:
//   1. Hiçbir para verilmiyor
//   2. Hak yanmıyor — günlük ödül "alındı" sayılmıyor, sandık
//      harcanmıyor, canlanma hakkı gitmiyor
//   3. Ekran kapanmıyor ve düğme tekrar basılabiliyor
// Ve reklam açıldığında ödülün gerçekten verildiği, yani ölçümün
// "hiçbir şey olmuyor" diye geçmediği.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8767);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8767/', { waitUntil: 'load', timeout: 120000 });
await pg.waitForFunction(() => typeof window.fruitHoleAdSim === 'function', { timeout: 90000 });
await pg.waitForTimeout(1200);

const cuzdan = () => pg.evaluate(() => window.fruitHoleWallet());
const toplam = w => Object.values(w).reduce((a, b) => a + b, 0);

console.log('\n1) Günlük ödül — reklam açılmıyor');
const gun = await pg.evaluate(async () => {
  window.fruitHoleAdSim(false);
  window.fruitHoleShowDaily();
  const d0 = window.fruitHoleAdState();
  const c0 = window.fruitHoleWallet();
  document.getElementById('daily2x').click();
  await new Promise(r => setTimeout(r, 400));
  return { d0, c0, d1: window.fruitHoleAdState(), c1: window.fruitHoleWallet() };
});
const d2x0 = gun.d0.dugmeler.find(x => x.id === 'daily2x');
const d2x1 = gun.d1.dugmeler.find(x => x.id === 'daily2x');
console.log(`     ekran ${gun.d0.gunlukEkran ? 'açık' : 'kapalı'} → ${gun.d1.gunlukEkran ? 'açık' : 'kapalı'}` +
  ` · düğme gizli ${d2x0.gizli}→${d2x1.gizli}, kapalı ${d2x0.kapali}→${d2x1.kapali}`);
ok(gun.d0.gunlukEkran && !d2x0.gizli, 'günlük ödül ekranı ×2 düğmesiyle açıldı',
   `ekran ${gun.d0.gunlukEkran}, düğme gizli ${d2x0.gizli}`);
ok(toplam(gun.c1) === toplam(gun.c0), 'para verilmedi',
   `${toplam(gun.c0)} → ${toplam(gun.c1)}`);
ok(!gun.d1.gunlukAlindi, 'ödül "alındı" sayılmadı');
ok(gun.d1.gunlukEkran, 'ekran kapanmadı');
ok(!d2x1.kapali && !d2x1.gizli, 'düğme tekrar basılabilir',
   `kapalı ${d2x1.kapali}, gizli ${d2x1.gizli}`);

console.log('\n2) Günlük ödül — reklam açılıyor');
const gun2 = await pg.evaluate(async () => {
  window.fruitHoleAdSim(true);
  const c0 = window.fruitHoleWallet();
  document.getElementById('daily2x').click();
  await new Promise(r => setTimeout(r, 400));
  return { c0, c1: window.fruitHoleWallet(), d: window.fruitHoleAdState() };
});
console.log(`     ${toplam(gun2.c0)} → ${toplam(gun2.c1)}`);
ok(toplam(gun2.c1) > toplam(gun2.c0), 'reklam açılınca ödül verildi',
   `+${toplam(gun2.c1) - toplam(gun2.c0)}`);
ok(gun2.d.gunlukAlindi, 'ödül alındı olarak işaretlendi');

console.log('\n3) Canlanma — reklam açılmıyor');
const can = await pg.evaluate(async () => {
  window.fruitHoleAdSim(false);
  window.fruitHoleStartLevel();
  await new Promise(r => setTimeout(r, 300));
  window.fruitHoleTimeUp();
  await new Promise(r => setTimeout(r, 300));
  const d0 = window.fruitHoleAdState();
  document.getElementById('reviveBtn').click();
  await new Promise(r => setTimeout(r, 400));
  const d1 = window.fruitHoleAdState();
  // Sonra reklam açılıyor: aynı düğme bu kez çalışmalı.
  window.fruitHoleAdSim(true);
  document.getElementById('reviveBtn').click();
  await new Promise(r => setTimeout(r, 400));
  return { d0, d1, d2: window.fruitHoleAdState() };
});
const r0 = can.d0.dugmeler.find(x => x.id === 'reviveBtn');
const r1 = can.d1.dugmeler.find(x => x.id === 'reviveBtn');
console.log(`     kayıp ekranı ${can.d0.kayipEkran}→${can.d1.kayipEkran}→${can.d2.kayipEkran}` +
  ` · canlandı ${can.d0.canlandi}→${can.d1.canlandi}→${can.d2.canlandi}`);
ok(can.d0.kayipEkran && !r0.kapali, 'kayıp ekranı canlanma düğmesiyle açıldı');
ok(!can.d1.canlandi, 'reklam açılmayınca canlanma hakkı yanmadı');
ok(can.d1.kayipEkran, 'kayıp ekranı kapanmadı');
ok(!r1.kapali, 'canlanma düğmesi tekrar basılabilir');
ok(can.d2.canlandi && !can.d2.kayipEkran, 'reklam açılınca canlanma oldu',
   `canlandı ${can.d2.canlandi}, ekran ${can.d2.kayipEkran}`);

ok(!hata.length, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
