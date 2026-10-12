// Müşteri arabası: ekranda mı, dokunulabiliyor mu, dengeyi bozuyor mu?
//
// Ölçülen:
//   1. Öğretici sürerken belirmiyor
//   2. Belirdiğinde **kadrajda** — ağaçlarda öğrenilen ders: önlüğün
//      içinde olmak ekranda olmak demek değil, izdüşüm ölçülüyor
//   3. Girişten çıkışa yolun tamamı ekranda kalıyor
//   4. Dokunuş ödüyor; yarıçap dışına dokunmak ödemiyor
//   5. İki kez ödeme yok
//   6. Ödül `totalEarned`'a yazılmıyor ve prestij puanı üretmiyor
//   7. Dokunulmazsa kendi başına gidiyor ve bir sonraki için sayaç kuruluyor
//   8. Ödül beliriş anında donuyor — bekleyen oyuncu daha çok almıyor
//   9. Boost ödülü iki katına çıkarmıyor
//  10. Sürükleme dokunuş sayılmıyor (işçiyi yürütmek ödül vermemeli)
//  11. Sahnede birikme yok: yirmi müşteriden sonra tek grup
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8591);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const W = 412, H = 915;
const pg = await br.newPage({ viewport: { width: W, height: H } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8591/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };
const ekranda = e => e && e.x > 0 && e.x < W && e.y > 0 && e.y < H;
// Açılışta günlük ödül penceresi ekranın tamamını kaplıyor ve her
// dokunuşu yutuyor. İlk ölçüm bunu atladı ve "arayüz dokunuşu engelliyor"
// diye yanlış teşhis çıktı — pencere oyuncunun ilk işi olarak kapanıyor.
const temiz = () => pg.evaluate(() => {
  const d = document.getElementById('dOk'); if (d) d.click();
  window.jeMusAdim(40);                      // ortada müşteri varsa gitsin
});

console.log('\n1) Öğretici sürerken yok');
const t1 = await pg.evaluate(() => {
  window.jeWipeProgress();
  return { tut: window.jeTut(), belirdi: window.jeMusBelir(), d: window.jeMus() };
});
console.log(`     öğretici adımı ${t1.tut.adim}/${t1.tut.toplam} · belirdi ${t1.belirdi}`);
ok(!t1.belirdi, 'öğretici bitmeden belirmedi');
ok(!t1.d.var, 'sahnede müşteri yok');

console.log('\n2) Belirdiğinde kadrajda');
await pg.evaluate(() => window.jeTutSkip());
await temiz();
const t2 = await pg.evaluate(() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const belirdi = window.jeMusBelir();
  window.jeMusAdim(2);                    // girişi tamamla
  return { belirdi, d: window.jeMus() };
});
console.log(`     belirdi ${t2.belirdi} · hal ${t2.d.hal} · x ${t2.d.x} · ekran ${JSON.stringify(t2.d.ekran)}`);
ok(t2.belirdi, 'öğretici bitince belirdi');
ok(t2.d.hal === 'bekle', 'girişi tamamladı ve bekliyor', `${t2.d.hal}`);
ok(ekranda(t2.d.ekran), `izdüşüm ${W}x${H} kadrajın içinde`,
   t2.d.ekran ? `${t2.d.ekran.x.toFixed(0)},${t2.d.ekran.y.toFixed(0)}` : 'yok');
ok(t2.d.odul > 0, 'ödülü var', `${t2.d.odul.toFixed(0)}`);

// Ekranda olmak dokunulabilir olmak değil. İlk park yeri ekranın 491.
// pikseline düşüyordu, istasyon paneli 522'de başlıyor, dokunma yarıçapı
// 64: parmağın yarısı panele iniyordu. Ölçülen şey arabanın merkezi ve
// yarıçapın dört ucu — hepsinin üstünde tuvalin kendisi olmalı.
const kapak = await pg.evaluate(r => {
  const e = window.jeMus().ekran;
  const kim = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? el.tagName + (el.id ? '#' + el.id : '') : 'yok';
  };
  return {
    merkez: kim(e.x, e.y),
    ust: kim(e.x, e.y - r * 0.6), alt: kim(e.x, e.y + r * 0.6),
    sol: kim(e.x - r * 0.6, e.y), sag: kim(e.x + r * 0.6, e.y),
  };
}, t2.d.r);
console.log(`     dokunma alanının üstündeki eleman: merkez ${kapak.merkez} · üst ${kapak.ust} · alt ${kapak.alt} · sol ${kapak.sol} · sağ ${kapak.sag}`);
ok(Object.values(kapak).every(v => v === 'CANVAS'),
   'dokunma alanını arayüz kapatmıyor', Object.entries(kapak).filter(([, v]) => v !== 'CANVAS').map(([k, v]) => `${k}=${v}`).join(' '));

console.log('\n3) Yolun tamamı ekranda');
// Girişi yarıda kalan bir araba ekranın dışından içeri süzülüyorsa
// oyuncu yalnızca son yarım saniyeyi görür.
await temiz();
const yol = await pg.evaluate(() => {
  window.jeMusBelir();
  const noktalar = [];
  for (let i = 0; i < 40; i++) { window.jeMusAdim(0.1); const d = window.jeMus(); if (d.ekran) noktalar.push([d.x, d.ekran.x, d.ekran.y, d.hal]); }
  return noktalar;
});
const parkta = yol.filter(n => n[3] === 'bekle');
console.log(`     bekleme karelerinde ekran x ${Math.min(...parkta.map(n => n[1])).toFixed(0)}-${Math.max(...parkta.map(n => n[1])).toFixed(0)} · y ${parkta[0][2].toFixed(0)}`);
console.log(`     girişte en sağ x ${Math.max(...yol.map(n => n[1])).toFixed(0)} (ekran genişliği ${W})`);
ok(parkta.length > 0, 'park ettiği kareler var');
ok(parkta.every(n => n[1] > 40 && n[1] < W - 40), 'park yeri kenarlara yapışmıyor');
ok(parkta.every(n => n[2] > 40 && n[2] < H - 40), 'dikeyde de kadrajın içinde');

console.log('\n4) Dokunma');
await temiz();
const dok = await pg.evaluate(() => {
  window.jeTutSkip();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  window.jeMusBelir(); window.jeMusAdim(2);
  const uzak = window.jeMusDokun(200, 0);        // yarıçapın çok dışı
  const nakitOnce = window.jeProbe().cash;
  const yakin = window.jeMusDokun(0, 0);         // tam üstü
  return { uzak, yakin, fark: window.jeProbe().cash - nakitOnce, d: window.jeMus() };
});
console.log(`     uzak dokunuş ${dok.uzak} · yakın ${dok.yakin.toFixed(0)} · nakit farkı ${dok.fark.toFixed(0)}`);
ok(dok.uzak === 0, 'yarıçap dışı ödemedi');
ok(dok.yakin > 0, 'üstüne dokunmak ödedi');
ok(Math.abs(dok.fark - dok.yakin) < 1, 'ödenen para kasaya girdi');
ok(dok.d.hal === 'cik', 'ödeme sonrası gidiyor', `${dok.d.hal}`);

console.log('\n5) İki kez ödeme yok');
const iki = await pg.evaluate(() => window.jeMusDokun(0, 0));
console.log(`     ikinci dokunuş ${iki}`);
ok(iki === 0, 'çıkarken dokunmak tekrar ödemedi');

console.log('\n6) Ödül kendi ölçüsünü beslemiyor');
await temiz();
const olcu = await pg.evaluate(() => {
  window.jeTutSkip();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const p0 = window.jeProbe();
  const onceToplam = p0.total, oncePuan = p0.points + p0.pending;
  let odenen = 0;
  for (let k = 0; k < 5; k++) {
    window.jeMusBelir(); window.jeMusAdim(2);
    odenen += window.jeMusDokun(0, 0);
    window.jeMusAdim(4);                 // çıkışı bitir
  }
  const p1 = window.jeProbe();
  return { odenen, toplamFark: p1.total - onceToplam,
           puanFark: (p1.points + p1.pending) - oncePuan };
});
console.log(`     beş müşteriden ${olcu.odenen.toFixed(0)} · toplam kazanç farkı ${olcu.toplamFark} · puan farkı ${olcu.puanFark}`);
ok(olcu.odenen > 0, 'beş müşteri ödedi');
ok(olcu.toplamFark === 0, 'ödül toplam kazanca yazılmadı', `${olcu.toplamFark}`);
ok(olcu.puanFark === 0, 'ödül prestij puanı üretmedi', `${olcu.puanFark}`);

console.log('\n7) Dokunulmazsa gidiyor');
const gec = await pg.evaluate(() => {
  window.jeMusBelir();
  const d0 = window.jeMus();
  window.jeMusAdim(d0.bekle + 2 * 2);     // bekleme + giriş + çıkış
  return { once: d0.var, sonra: window.jeMus() };
});
console.log(`     beliren ${gec.once} · sonra var ${gec.sonra.var} · sonraki sayaç ${gec.sonra.sayac}s`);
ok(gec.once, 'müşteri belirmişti');
ok(!gec.sonra.var, 'süre dolunca sahneden çıktı');
ok(gec.sonra.sayac > 60, 'bir sonrası için sayaç kuruldu', `${gec.sonra.sayac}s`);

console.log('\n8) Ödül donuyor');
// Ödül her okunuşta yeniden hesaplansa, beklemek kazandırırdı — hedeflerde
// ölçülen ve düzeltilen hata.
const don = await pg.evaluate(() => {
  window.jeMusBelir(); window.jeMusAdim(2);
  const once = window.jeMus().odul;
  window.jeGive(1e12);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 120);
  return { once, sonra: window.jeMus().odul, odenen: window.jeMusDokun(0, 0) };
});
console.log(`     ödül ${don.once.toFixed(0)} → ${don.sonra.toFixed(0)} · ödenen ${don.odenen.toFixed(0)}`);
ok(don.once === don.sonra, 'ölçek büyüyünce ödül sabit kaldı');
ok(Math.abs(don.odenen - don.once) < 1, 'ödenen, donmuş değer');

console.log('\n9) Boost ödülü şişirmiyor');
// `jeProbe().boost` çarpan değil, **kalan saniye**. İlk hâlinde testte
// "çarpan" diye okunuyordu ve 240 > 1 kontrolü hiçbir şey ölçmüyordu.
// Ölçülmesi gereken şey şu: boost zincirin gelirini gerçekten büyütüyor,
// ödül ise büyümüyor.
const bst = await pg.evaluate(async () => {
  window.jeMusAdim(40);
  window.jeMusBelir(); window.jeMusAdim(2);
  const sade = window.jeMus().odul, gelirSade = window.jeProbe().income;
  window.jeMusDokun(0, 0); window.jeMusAdim(4);
  await window.jeBoost();
  window.jeMusBelir(); window.jeMusAdim(2);
  return { sade, gelirSade, boostlu: window.jeMus().odul,
           gelirBoostlu: window.jeProbe().income, kalan: window.jeProbe().boost };
});
console.log(`     zincir geliri ${bst.gelirSade.toFixed(0)} → ${bst.gelirBoostlu.toFixed(0)} · ödül ${bst.sade.toFixed(0)} → ${bst.boostlu.toFixed(0)} (boost ${bst.kalan}s)`);
ok(bst.kalan > 0, 'boost açık', `${bst.kalan}s`);
ok(bst.gelirBoostlu > bst.gelirSade * 1.5, 'boost geliri gerçekten büyüttü',
   `${bst.gelirSade.toFixed(0)} → ${bst.gelirBoostlu.toFixed(0)}`);
ok(Math.abs(bst.boostlu - bst.sade) / bst.sade < 0.02, 'ödül boost ile değişmedi');

console.log('\n10) Sürükleme dokunuş değil');
// İşçiyi yürütmek ödül vermemeli: aynı yüzey hem sürükleme hem dokunuş
// taşıyor, ayrımı mesafe ve süre yapıyor.
await temiz();
await pg.evaluate(() => { window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  window.jeMusBelir(); window.jeMusAdim(2); });
const yer = await pg.evaluate(() => window.jeMus().ekran);
const nakit0 = await pg.evaluate(() => window.jeProbe().cash);
// Arabanın üstünden başlayıp sürükle: bu bir yürüme hareketi.
await pg.mouse.move(yer.x, yer.y);
await pg.mouse.down();
for (let i = 1; i <= 8; i++) await pg.mouse.move(yer.x + i * 9, yer.y + i * 5);
await pg.mouse.up();
const suruk = await pg.evaluate(() => ({ cash: window.jeProbe().cash, d: window.jeMus() }));
console.log(`     sürükleme sonrası nakit farkı ${(suruk.cash - nakit0).toFixed(0)} · hal ${suruk.d.hal}`);
ok(suruk.d.hal === 'bekle', 'araba hâlâ bekliyor', `${suruk.d.hal}`);

// Şimdi gerçek bir dokunuş: aynı yerde, kısa.
await pg.mouse.click(yer.x, yer.y, { delay: 30 });
const tik = await pg.evaluate(() => ({ cash: window.jeProbe().cash, d: window.jeMus() }));
console.log(`     kısa dokunuş sonrası hal ${tik.d.hal} · nakit arttı ${tik.cash > suruk.cash}`);
ok(tik.d.hal === 'cik', 'gerçek dokunuş ödedi', `${tik.d.hal}`);
ok(tik.cash > suruk.cash, 'para geldi');

console.log('\n11) Sahnede birikme yok');
// Her müşteri için yeni bir grup yapılsaydı ve eskisi sahneden
// çıkmasaydı, yirmi müşteri sonra önlükte yirmi araba durur ve kimse
// fark etmezdi — araba hep aynı yere park ediyor.
const birik = await pg.evaluate(() => {
  window.jeMusAdim(40);                    // ortada kalan varsa gitsin
  if (window.jeMus().var) return { hata: 'başlangıçta müşteri var' };
  const once = window.jeSahne();
  for (let k = 0; k < 20; k++) {
    window.jeMusBelir(); window.jeMusAdim(2);
    if (k % 2) window.jeMusDokun(0, 0);
    window.jeMusAdim(k % 2 ? 4 : 20);
  }
  return { once, sonra: window.jeSahne(),
           gecen: window.jeMus().gecen, alinan: window.jeMus().alinan };
});
if (birik.hata) { fail++; console.log(`  FAIL ${birik.hata}`); }
console.log(`     gelen ${birik.gecen} · dokunulan ${birik.alinan} · sahne cismi ${birik.once} → ${birik.sonra}`);
ok(birik.gecen >= 20, 'yirmiden fazla müşteri geldi', `${birik.gecen}`);
ok(birik.alinan >= 10, 'yarısına dokunuldu', `${birik.alinan}`);
ok(birik.sonra === birik.once, 'sahnedeki cisim sayısı aynı kaldı',
   `${birik.once} → ${birik.sonra}`);

console.log('\n12) Üretim bozulmadı');
const uret = await pg.evaluate(() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const once = window.jeProbe().total;
  for (let i = 0; i < 100; i++) window.jeStep(0.1);
  return window.jeProbe().total - once;
});
console.log(`     on saniyede kazanç ${uret.toFixed(0)}`);
ok(uret > 0, 'fabrika çalışıyor');

console.log('\n13) Dengeye katkısı');
// Hiç kaçırmayan bir oyuncu ne kadar fazla kazanıyor? Otuz saniyelik
// ödül, ortalama 145 saniyede bir: oranı yazıya değil ölçüme bağlamak
// gerekiyor, yoksa sabitler değişince bu sayı sessizce yaşlanır.
const denge = await pg.evaluate(() => {
  const d = window.jeMus();
  const ara = (100 + 190) / 2;
  return { sn: d.sn, bekle: d.bekle, ara, oran: d.sn / ara };
});
console.log(`     ödül ${denge.sn}sn üretim · ortalama ara ${denge.ara}sn · hiç kaçırmayan oyuncuya +%${(denge.oran * 100).toFixed(1)} gelir`);
ok(denge.oran < 0.30, 'katkı gelirin üçte birinin altında', `%${(denge.oran * 100).toFixed(1)}`);
ok(denge.oran > 0.05, 'dokunmaya değecek kadar var', `%${(denge.oran * 100).toFixed(1)}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
