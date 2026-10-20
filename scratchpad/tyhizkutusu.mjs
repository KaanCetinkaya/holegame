// Hız kutusu gerçekten üç kat mı veriyor, ve ne kadar süreyle?
//
// Ekranın en büyük iddiası o: yeşil düğmenin üstünde **×3** yazıyor ve
// oyuncu bunun için reklam izliyor. Bu depoda ekranda yazan bir sayının
// bankayla uyuşmadığı birkaç kez görüldü — ve bu sefer sayının
// karşılığını oyuncu reklam izleyerek ödüyor.
//
// Ölçülen:
//   1. Kasaya giren para tam olarak BOOST_MULT katına çıkıyor
//   2. Süre `boostSecs()` kadar, ve araştırma ile Ines'in yeteneği onu
//      gerçekten uzatıyor
//   3. Süre dolunca eski hıza dönüyor
//   4. Boost sırasında alınan ödüller şişmiyor — hedef, günlük görev ve
//      müşteri, hepsi boost'a bölünüyor
//   5. Çevrimdışı kazanca karışmıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8647);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8647/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Kasaya giren para');
// Ekranda yazan çarpan değil, bankaya giren para. Aynı fabrikadan iki
// ölçüm: boost'suz bir dakika, boost'lu bir dakika.
const para = await pg.evaluate(async () => {
  const kur = () => {
    window.jeWipeProgress(); window.jeTutSkip(); window.jeAutoCarry(false);
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 45); window.jeGiveManager(i); }
    window.jeTeleport(0, 6);              // nezaret karışmasın
    window.jeStep(0.1);
  };
  kur();
  const a = window.jeProbe().total;
  for (let i = 0; i < 600; i++) window.jeStep(0.1);
  const sade = window.jeProbe().total - a;
  kur();
  await window.jeBoost();
  const b = window.jeProbe().total;
  for (let i = 0; i < 600; i++) window.jeStep(0.1);
  const boostlu = window.jeProbe().total - b;
  return { sade, boostlu, carpan: window.jeBoostMult(), kalan: window.jeProbe().boost };
});
console.log(`     bir dakikada: boost'suz ${para.sade.toFixed(0)} · boost'lu ${para.boostlu.toFixed(0)}`);
console.log(`     oran ${(para.boostlu / para.sade).toFixed(3)} · oyunun sabiti ${para.carpan}`);
ok(Math.abs(para.boostlu / para.sade - para.carpan) < 0.02,
   'banka tam olarak çarpan kadar arttı',
   `${(para.boostlu / para.sade).toFixed(3)} / ${para.carpan}`);

console.log('\n2) Süre');
const sure = await pg.evaluate(async () => {
  const olc = async kur => {
    window.jeWipeProgress(); window.jeTutSkip();
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) window.jeSetLevel(i, 45);
    kur();
    const beklenen = window.jeBoostSecs();
    await window.jeBoost();
    return { beklenen, kalan: window.jeProbe().boost };
  };
  const sade = await olc(() => {});
  const ines = await olc(() => { for (let i = 0; i < 4; i++) window.jeGiveManager(i); });
  const tam = await olc(() => {
    for (let i = 0; i < 4; i++) window.jeGiveManager(i);
    window.jeSetLifetime(1e13);
    window.jeResBuy('boost', 20);
  });
  return { sade, ines, tam };
});
for (const [ad, d] of Object.entries(sure))
  console.log(`     ${ad.padEnd(5)} beklenen ${d.beklenen}sn · kalan ${d.kalan}sn`);
ok(Math.abs(sure.sade.kalan - sure.sade.beklenen) <= 1, 'süre boostSecs() kadar',
   `${sure.sade.kalan}/${sure.sade.beklenen}`);
ok(sure.ines.beklenen > sure.sade.beklenen, 'Ines süreyi uzatıyor',
   `${sure.sade.beklenen} → ${sure.ines.beklenen}`);
ok(sure.tam.beklenen > sure.ines.beklenen, 'araştırma da uzatıyor',
   `${sure.ines.beklenen} → ${sure.tam.beklenen}`);
ok(Math.abs(sure.tam.kalan - sure.tam.beklenen) <= 1, 'uzun süre de doğru kuruluyor',
   `${sure.tam.kalan}/${sure.tam.beklenen}`);

console.log('\n3) Süre dolunca eski hıza dönüyor');
const bitis = await pg.evaluate(async () => {
  window.jeWipeProgress(); window.jeTutSkip();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 45); window.jeGiveManager(i); }
  const sade = window.jeRates()[0];
  await window.jeBoost();
  const acik = window.jeRates()[0];
  // Saati ileri al: boost `Date.now()` ile bitiyor.
  window.jeBoostBitir();
  return { sade, acik, sonra: window.jeRates()[0], carpan: window.jeBoostMult() };
});
console.log(`     hız ${bitis.sade} → ${bitis.acik} → ${bitis.sonra}`);
ok(bitis.acik === bitis.sade * bitis.carpan, 'açıkken çarpan uygulanıyor');
ok(bitis.sonra === bitis.sade, 'bitince eski hız', `${bitis.sonra} / ${bitis.sade}`);

console.log('\n4) Ödüller şişmiyor');
// Boost açıkken alınan bir ödül, boost'suz alınanla aynı olmalı. Yoksa
// oyuncu reklam izleyip bütün ödül listesini üç katına çıkarır — bu
// hedeflerde ölçülerek öğrenilen kural.
const odul = await pg.evaluate(async () => {
  const olc = async boostlu => {
    window.jeWipeProgress(); window.jeTutSkip();
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 45); window.jeGiveManager(i); }
    if (boostlu) await window.jeBoost();
    window.jeStep(0.1);
    const g = window.jeGoals().find(x => x.done && !x.taken);
    window.jeMusBelir(); window.jeMusAdim(2);
    return { hedef: g ? g.pay : null, musteri: window.jeMus().odul,
             gunluk: window.jeDaily().pay };
  };
  return { sade: await olc(false), boostlu: await olc(true) };
});
console.log(`     hedef    ${odul.sade.hedef} → ${odul.boostlu.hedef}`);
console.log(`     müşteri  ${odul.sade.musteri.toFixed(0)} → ${odul.boostlu.musteri.toFixed(0)}`);
console.log(`     günlük   ${odul.sade.gunluk} → ${odul.boostlu.gunluk}`);
ok(odul.sade.hedef === odul.boostlu.hedef, 'hedef ödülü aynı');
ok(Math.abs(odul.sade.musteri - odul.boostlu.musteri) < 1, 'müşteri ödülü aynı');
ok(odul.sade.gunluk === odul.boostlu.gunluk, 'günlük ödül aynı');

console.log('\n5) Çevrimdışıyla kesişimi');
// Kutu yokluğun üstüne binmiyor, **kesiştiği kadarıyla** sayılıyor.
//
// Eski hâli dönüş anındaki çarpanı bütün yokluğa uyguluyordu: bir
// saatlik yokluk üç katına çıkıyordu. İlk düzeltme yalnızca kutunun
// bitişine baktı ve hiçbir şeyi değiştirmedi — bitiş gelecekte, yokluk
// geçmişte, yani her saniye kutunun içinde sayılmaya devam etti.
// Kutunun başlangıcı da kaydediliyor artık.
//
// Üç pencere: yokluğun tamamen dışında, tamamen içinde, ve yarısı.
const off = await pg.evaluate(async () => {
  const kur = () => {
    window.jeWipeProgress(); window.jeTutSkip();
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 45); window.jeGiveManager(i); }
  };
  // `jeOffline(sn)` yokluğu [şimdi-sn, şimdi] aralığına koyuyor.
  // `jeBoostPencere(a, b)` kutuyu [şimdi-a, şimdi-b] aralığına.
  const olc = (sn, pencere) => {
    kur();
    if (pencere) window.jeBoostPencere(pencere[0], pencere[1]);
    const a = window.jeProbe().cash;
    window.jeOffline(sn);
    return window.jeProbe().cash - a;
  };
  const SN = 600;                               // on dakikalık yokluk
  return {
    sade:   olc(SN, null),
    disi:   olc(SN, [900e3, 700e3]),            // kutu yokluktan önce bitmiş
    icinde: olc(SN, [700e3, 0]),                // kutu yokluğun tamamını kaplıyor
    yarisi: olc(SN, [700e3, 300e3]),            // kutu yokluğun ilk yarısını kaplıyor
  };
});
const f = n => n.toExponential(3);
console.log(`     yokluk 600sn · boost'suz ${f(off.sade)}`);
console.log(`     kutu yokluktan önce bitmiş : ${f(off.disi)}   ×${(off.disi / off.sade).toFixed(3)}`);
console.log(`     kutu yokluğun tamamında    : ${f(off.icinde)}   ×${(off.icinde / off.sade).toFixed(3)}`);
console.log(`     kutu yokluğun ilk yarısında: ${f(off.yarisi)}   ×${(off.yarisi / off.sade).toFixed(3)}`);
const mult = await pg.evaluate(() => window.jeBoostMult());
ok(Math.abs(off.disi / off.sade - 1) < 0.01,
   'yokluktan önce biten kutu hiç sayılmıyor', `×${(off.disi / off.sade).toFixed(3)}`);
ok(Math.abs(off.icinde / off.sade - mult) < 0.02,
   'yokluğun tamamını kaplayan kutu tam çarpan', `×${(off.icinde / off.sade).toFixed(3)}`);
const beklenenYari = (1 + mult) / 2;
ok(Math.abs(off.yarisi / off.sade - beklenenYari) < 0.02,
   'yarısını kaplayan kutu yarı yarıya',
   `×${(off.yarisi / off.sade).toFixed(3)} beklenen ×${beklenenYari}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
