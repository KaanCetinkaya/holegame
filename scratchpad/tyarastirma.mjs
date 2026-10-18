// Araştırma ekranı bir seçim mi, yoksa para yatırma kutusu mu?
//
// Ölçüldü: yedi şube devrinde oyuncunun puanı 554'ten 1.2 milyona
// çıkıyor. Ağaçtaki yedi seçeneğin altısının tavanı ise toplam **666
// puanla** doluyor — yani ikinci devirden sonra ekranda tek bir düğme
// kalıyor (hat hızı, puan başına +%2, düz bir çizgi). Geriye kalan
// yüz binlerce puanın gidebileceği başka bir yer yok.
//
// Üç yeni dal eklendi ve üçü de bir yüzdeyi değil **oyunun davranışını**
// değiştiriyor: kilometre taşının gücü, müşterinin sıklığı, işçinin
// yükü.
//
// Ölçülen:
//   1. Yeni dalların üçü de gerçekten bir şeyi değiştiriyor
//   2. Kilometre taşı gücü üsse giriyor — yani geç oyunda seviyeyi
//      yeniden ilerletebiliyor
//   3. Tavanlar toplamı, oyuncunun ikinci devirde eline geçen puana
//      göre makul
//   4. Ağaç hâlâ bir seçim: ikinci devirde her şeyi birden alamıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8623);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8623/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Kilometre taşı gücü');
// Taşlar üsse giriyor: yirmi taşı geçmiş bir fabrikada 2.5^20 ile 2^20
// arasındaki fark seksen altı kat. Geç oyunun seviyeyi yeniden
// ilerletebilen tek kolu bu — gelir çarpanı doğrusal, maliyet üstel,
// ve üstele ancak üstel cevap veriyor.
const tas = await pg.evaluate(() => {
  window.jeWipeProgress();
  // Taş sayısı seviyeye bağlı: 200. seviyede beş taş geçilmiş, 1000'de
  // dokuz. İlk ölçüm 200'de bakıp "×10 olmalı" dedi — yirmi taş
  // varmış gibi. Üs kaç taş varsa onun üstünde çalışıyor.
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 1000);
  const sade = window.jeRates()[0];
  window.jeSetLifetime(1e14);                 // puan ver
  window.jeResBuy('tas', 10);
  return { sade, tam: window.jeRates()[0], seviye: window.jeRes().lvl.tas,
           tas: window.jeTasSayisi() };
});
console.log(`     1000. seviye (${tas.tas} taş) döküm hızı: ${tas.sade.toExponential(3)} → ${tas.tam.toExponential(3)} (×${(tas.tam / tas.sade).toFixed(1)})`);
console.log(`     beklenen: (2.5/2)^${tas.tas} = ×${Math.pow(2.5 / 2, tas.tas).toFixed(1)}`);
ok(tas.seviye === 10, 'on seviye alındı', `${tas.seviye}`);
// Beklenen değer testin kendi hesabı değil, oyunun taş sayısından
// türetiliyor; sabit bir sayı yazmak oyun değişince yaşlanırdı.
ok(Math.abs(tas.tam / tas.sade - Math.pow(2.5 / 2, tas.tas)) < 0.01,
   'kazanç tam olarak taş sayısının üssü kadar',
   `×${(tas.tam / tas.sade).toFixed(2)}`);
// "On kattan fazla olsun" diye bir eşik yazmıştım; o sayının dayanağı
// yoktu. Dayanağı olan karşılaştırma şu: aynı 250 puan hat hızına
// yatırılsa ne alırdı? Hat hızı puan başına +%2, yani 250 puan ×6.
// Taş gücü dokuz taşta ×7.45 veriyor — yani ikisi yakın, ve bu bir
// tuzak değil gerçek bir seçim. Erken oyunda taş az olduğu için hat
// hızı önde, geç oyunda taş gücü.
const esdeger = 1 + 25 * 10 * 0.02;
console.log(`     aynı 250 puan hat hızına gitse: ×${esdeger}`);
ok(tas.tam / tas.sade > esdeger * 0.8,
   'taş gücü, aynı puanın hat hızındaki karşılığıyla yarışabiliyor',
   `×${(tas.tam / tas.sade).toFixed(2)} karşı ×${esdeger}`);

console.log('\n2) Satış masası');
const satis = await pg.evaluate(() => {
  window.jeWipeProgress();
  const once = window.jeMusAra();
  window.jeSetLifetime(1e14);
  window.jeResBuy('satis', 10);
  return { once, sonra: window.jeMusAra(), seviye: window.jeRes().lvl.satis };
});
console.log(`     müşteri aralığı ${satis.once[0]}-${satis.once[1]}sn → ${satis.sonra[0]}-${satis.sonra[1]}sn`);
ok(satis.seviye === 10, 'on seviye alındı', `${satis.seviye}`);
ok(satis.sonra[0] < satis.once[0] && satis.sonra[1] < satis.once[1],
   'iki sınır da indi');
ok(satis.sonra[0] > 20, 'alt sınır makul kaldı', `${satis.sonra[0]}sn`);

console.log('\n3) Taşıma arabası');
const araba = await pg.evaluate(() => {
  window.jeWipeProgress();
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 60);
  const once = window.jeCarryMax();
  window.jeSetLifetime(1e14);
  window.jeResBuy('elaraba', 10);
  return { once, sonra: window.jeCarryMax(), seviye: window.jeRes().lvl.elaraba };
});
console.log(`     taşıma kapasitesi ${JSON.stringify(araba.once)} → ${JSON.stringify(araba.sonra)}`);
ok(araba.seviye === 10, 'on seviye alındı', `${araba.seviye}`);
ok(araba.sonra[0] > araba.once[0], 'kapasite büyüdü',
   `${araba.once[0]} → ${araba.sonra[0]}`);

console.log('\n4) Ağaç hâlâ bir seçim mi');
// Yeni dallar da ucuzsa hiçbir şey değişmez: oyuncu ikinci devirde
// hepsini birden alır ve ekran yine tek düğmeye döner. Ölçülen şey
// ikinci devirde eline geçen puanla her şeyi alıp alamadığı.
const secim = await pg.evaluate(() => {
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  window.jeWipeProgress(); window.jeTutSkip(); window.jeAutoCarry(true);
  const oyna = dk => {
    for (let sn = 0; sn < dk * 60; sn++) {
      window.jeRun(1);
      for (let i = 0; i < 4; i++) window.jeBuyManager(i);
      const p = window.jeProbe();
      const neck = AD.indexOf(p.neck);
      const tutan = window.jeTier().tutan.filter(i => i !== neck);
      if (tutan.length && sn % 2 === 0) window.jeBuy(tutan[0], 'max');
      else window.jeBuy(neck, 'max');
    }
  };
  const tur = [];
  for (let t = 1; t <= 3; t++) {
    oyna(30);
    window.jePrestige();
    tur.push({ t, puan: window.jeFree() });
  }
  return { tur, tavan: window.jeResTavan() };
});
const tavanToplam = secim.tavan.reduce((a, r) => a + r.cost * (r.cap === null ? 0 : r.cap), 0);
console.log(`     devir sonrası boş puan: ${secim.tur.map(x => x.puan).join(' → ')}`);
console.log(`     bütün tavanları doldurmanın bedeli: ${tavanToplam} puan`);
for (const r of secim.tavan)
  console.log(`       ${r.id.padEnd(9)} ${String(r.cost).padStart(3)} puan × ${r.cap === null ? 'sınırsız' : r.cap}`);
ok(secim.tur[1].puan < tavanToplam,
   'ikinci devirde her şey alınamıyor — ağaç hâlâ bir seçim',
   `${secim.tur[1].puan} puan, gereken ${tavanToplam}`);
ok(secim.tavan.some(r => r.cap === null), 'puanın her zaman gidecek bir yeri var');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
