// Nezaret: işçinin başında durduğu istasyon hızlanıyor.
//
// Dört müdür alındıktan sonra önlükteki figürün hiçbir işi kalmıyordu.
// Oysa oyunun türdeki tek yapısal farkı o figür — PAZAR.md'deki "arcade
// idle" hattı, D1 ~%50 — ve oyunun geri kalanında dekora dönüşüyordu.
//
// Ölçülen:
//   1. Bölmenin başında durmak o istasyonun hızını tam olarak
//      SUPERVISE kadar büyütüyor
//   2. Yalnızca o istasyonu: yan bölme etkilenmiyor
//   3. Aynı anda tek istasyon
//   4. Uzaklaşınca çarpan kalkıyor
//   5. Kasaya giren para da artıyor — ekrandaki sayı değil, banka
//   6. Çevrimdışı kazanca karışmıyor: kimse kimsenin başında durmuyor
//   7. Panelde görünüyor, ve halka rengi değişiyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8633);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8633/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Çarpan');
const carpan = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 50); window.jeGiveManager(i); }
  // Önlüğün ortasına, hiçbir bölmenin menzilinde olmayan bir yere.
  window.jeTeleport(0, -5);
  window.jeStep(0.1);
  const uzak = window.jeRates();
  const uzakNez = window.jeNezaret();
  // Döküm bölmesinin başına.
  window.jeTeleport(0, window.jeBayZ()[0]);
  window.jeStep(0.1);
  return { uzak, uzakNez, yakin: window.jeRates(), yakinNez: window.jeNezaret(),
           sabit: window.jeSupervise() };
});
console.log(`     uzakta ${JSON.stringify(carpan.uzak)} (nezaret ${carpan.uzakNez})`);
console.log(`     Döküm'ün başında ${JSON.stringify(carpan.yakin)} (nezaret ${carpan.yakinNez})`);
const oran = carpan.yakin[0] / carpan.uzak[0];
console.log(`     oran ${oran.toFixed(3)} · oyunun sabiti ${carpan.sabit}`);
ok(carpan.uzakNez === -1, 'ortada dururken nezaret yok', `${carpan.uzakNez}`);
ok(carpan.yakinNez === 0, 'bölmenin başında nezaret Döküm', `${carpan.yakinNez}`);
ok(Math.abs(oran - carpan.sabit) < 0.001, 'hız tam olarak SUPERVISE kadar arttı',
   `${oran.toFixed(3)} / ${carpan.sabit}`);

console.log('\n2) Yalnızca o istasyon');
const tek = [1, 2, 3].every(i => Math.abs(carpan.yakin[i] - carpan.uzak[i]) < 1e-6);
console.log(`     diğer üçü: ${[1, 2, 3].map(i => `${carpan.uzak[i].toFixed(0)}→${carpan.yakin[i].toFixed(0)}`).join(' · ')}`);
ok(tek, 'yan bölmeler etkilenmedi');

console.log('\n3) Tek seferde tek istasyon');
const hepsi = await pg.evaluate(() => {
  const bay = window.jeBayZ();
  const out = [];
  for (let i = 0; i < bay.length; i++) {
    window.jeTeleport(0, bay[i]);
    window.jeStep(0.1);
    out.push(window.jeNezaret());
  }
  return out;
});
console.log(`     dört bölmede sırayla: ${hepsi.join(', ')}`);
ok(JSON.stringify(hepsi) === '[0,1,2,3]', 'her bölme kendi numarasını veriyor', JSON.stringify(hepsi));

console.log('\n4) Uzaklaşınca kalkıyor');
const kalk = await pg.evaluate(() => {
  const bay = window.jeBayZ();
  window.jeTeleport(0, bay[2]);
  window.jeStep(0.1);
  const icinde = window.jeNezaret();
  window.jeTeleport(0, (bay[2] + bay[3]) / 2);   // iki bölmenin tam ortası
  window.jeStep(0.1);
  return { icinde, arada: window.jeNezaret() };
});
console.log(`     bölmede ${kalk.icinde} · iki bölme arasında ${kalk.arada}`);
ok(kalk.arada === -1, 'bölmeler arasında nezaret yok', `${kalk.arada}`);

console.log('\n5) Kasaya giren para');
// Ekrandaki sayı değil, banka. Bu dosyada tekrar eden ders.
//
// İlk ölçüm dört istasyonu da aynı seviyeye koyup darboğazın başında
// durdu ve hiçbir şey değişmedi — **doğrusu da buydu**. Zincir en yavaş
// halkanın hızında akıyor; üç tanesi eşit yavaşken birini hızlandırmak
// sırayı bir sonrakine devrediyor, o kadar. Nezaretin işe yaraması için
// tek ve belirgin bir darboğaz gerekiyor, ki oyunun bütün dersi zaten o.
// İki durum da ölçülüyor.
const para = await pg.evaluate(() => {
  const bay = window.jeBayZ();
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  const kur = (tekDarbogaz) => {
    window.jeWipeProgress();
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 60); window.jeGiveManager(i); }
    // Tek darboğaz: Montaj belirgin biçimde geride.
    if (tekDarbogaz) window.jeSetLevel(2, 30);
  };
  const olc = (tekDarbogaz, z) => {
    kur(tekDarbogaz);
    window.jeTeleport(0, z);
    window.jeStep(0.1);
    const a = window.jeProbe().total;
    for (let i = 0; i < 600; i++) window.jeStep(0.1);   // bir dakika
    return window.jeProbe().total - a;
  };
  kur(true);
  const neck = AD.indexOf(window.jeProbe().neck);
  kur(false);
  const esitNeck = AD.indexOf(window.jeProbe().neck);
  return {
    neck, esitNeck,
    tekUzak: olc(true, -5), tekBasinda: olc(true, bay[neck]),
    esitUzak: olc(false, -5), esitBasinda: olc(false, bay[esitNeck]),
  };
});
console.log(`     tek darboğaz (${para.neck}): uzakta ${para.tekUzak.toFixed(0)} · başında ${para.tekBasinda.toFixed(0)} → ×${(para.tekBasinda / para.tekUzak).toFixed(3)}`);
console.log(`     eşit hatta (${para.esitNeck}): uzakta ${para.esitUzak.toFixed(0)} · başında ${para.esitBasinda.toFixed(0)} → ×${(para.esitBasinda / para.esitUzak).toFixed(3)}`);
ok(para.tekBasinda > para.tekUzak * 1.15,
   'tek darboğazın başında durmak kasayı büyüttü',
   `×${(para.tekBasinda / para.tekUzak).toFixed(3)}`);
ok(Math.abs(para.esitBasinda / para.esitUzak - 1) < 0.02,
   'eşit hatta hiçbir şey değişmiyor — zincir bir sonraki halkaya takılıyor',
   `×${(para.esitBasinda / para.esitUzak).toFixed(3)}`);

console.log('\n6) Çevrimdışına karışmıyor');
// Kapalı uygulamada kimse kimsenin başında durmuyor. Çarpan oraya
// sızarsa oyuncu yokken de nezaret ediyormuş gibi para kazanır.
const off = await pg.evaluate(() => {
  const bay = window.jeBayZ();
  const olc = z => {
    window.jeWipeProgress();
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 50); window.jeGiveManager(i); }
    window.jeTeleport(0, z);
    window.jeStep(0.1);
    const a = window.jeProbe().cash;
    window.jeOffline(3600);
    return window.jeProbe().cash - a;
  };
  return { uzak: olc(-5), bolmede: olc(bay[0]) };
});
console.log(`     bir saatlik yokluk: uzakta ${off.uzak.toFixed(0)} · bölmede ${off.bolmede.toFixed(0)}`);
ok(Math.abs(off.bolmede - off.uzak) / off.uzak < 0.001,
   'işçinin nerede durduğu çevrimdışı kazancı değiştirmiyor',
   `${off.uzak.toFixed(0)} / ${off.bolmede.toFixed(0)}`);

console.log('\n7) Ekranda görünüyor');
const ekran = await pg.evaluate(() => {
  const bay = window.jeBayZ();
  window.jeTeleport(0, bay[1]);
  window.jeStep(0.1);
  window.jeRefresh();
  const meta = [...document.querySelectorAll('.st .meta')].map(e => e.textContent.trim());
  const halka = window.jeHalkaRengi();
  window.jeTeleport(0, -5);
  window.jeStep(0.1);
  window.jeRefresh();
  return { meta, halka, halkaUzak: window.jeHalkaRengi(),
           metaUzak: [...document.querySelectorAll('.st .meta')].map(e => e.textContent.trim()) };
});
console.log(`     Pres satırı: "${ekran.meta[1]}"`);
console.log(`     halka rengi: nezarette ${ekran.halka} · uzakta ${ekran.halkaUzak}`);
ok(/SEN|YOU/.test(ekran.meta[1]), 'nezaret edilen satırda yazıyor', ekran.meta[1]);
ok(!ekran.metaUzak.some(t => /SEN ×|YOU ×/.test(t)), 'uzaklaşınca yazı kalkıyor');
ok(ekran.halka !== ekran.halkaUzak, 'halka rengi değişiyor',
   `${ekran.halka} / ${ekran.halkaUzak}`);

console.log('\n8) İpucu');
// Müdür ipucuyla aynı kalıp: bir kez, ve ancak ders anlamlı olduğunda —
// yani işçinin taşıyacak malı kalmadığı an. Daha erken söylenirse
// oyuncu taşımayı bırakır ve nezaret, elle taşımanın yerine geçen
// yanlış bir ders olur.
const ipucu = await pg.evaluate(async () => {
  window.jeWipeProgress(); window.jeTutSkip();
  const el = document.getElementById('tut');
  el.classList.remove('show');
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 40);
  // Henüz müdür yok: ipucu çıkmamalı.
  window.jeTutNezaret();
  const erken = el.classList.contains('show');
  for (let i = 0; i < 4; i++) window.jeGiveManager(i);
  window.jeTutNezaret();
  const zamani = { gorunur: el.classList.contains('show'), yazi: el.textContent.trim() };
  // İkinci kez çağırmak tekrar göstermemeli.
  el.classList.remove('show');
  window.jeTutNezaret();
  return { erken, zamani, ikinci: el.classList.contains('show') };
});
console.log(`     müdürsüzken ${ipucu.erken} · müdürler alınınca ${ipucu.zamani.gorunur}`);
console.log(`     "${ipucu.zamani.yazi.slice(0, 80)}"`);
ok(!ipucu.erken, 'taşıyacak mal varken ipucu çıkmıyor');
ok(ipucu.zamani.gorunur, 'işçi boşta kalınca çıkıyor');
ok(/1\.25/.test(ipucu.zamani.yazi), 'çarpanı oyundan alıyor', ipucu.zamani.yazi.slice(0, 40));
ok(!ipucu.ikinci, 'bir kez gösteriliyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
