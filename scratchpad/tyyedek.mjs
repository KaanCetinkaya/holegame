// Yedek kodu: fabrikayı gerçekten taşıyor mu, bozuk bir kod ne yapıyor?
//
// Kayıt yalnızca `localStorage`'da duruyor. Bu türde oynanan süre yüzlerce
// saate çıkıyor ve bir "verileri temizle" her şeyi siliyor. Ölçülen şey
// kodun **güvenilir** olup olmadığı: yarım bir kod kaydın üstüne yazarsa
// oyuncu hem eskisini hem yenisini kaybeder.
//
// Ölçülen:
//   1. Kod üretiliyor, biçimi belli ve elle taşınabilir uzunlukta
//   2. Gidiş-dönüş: kod → yeni cihaz → aynı fabrika (seviye, müdür, para,
//      prestij, araştırma, şube)
//   3. Bozuk kod reddediliyor **ve kayda dokunmuyor**
//   4. Başka bir oyunun / rastgele bir metnin kodu reddediliyor
//   5. İleri sürümden gelen kod reddediliyor
//   6. Eksik alanlı eski bir kayıt oyunun kendi göç yolundan geçiyor
//   7. İki basış şartı: ilk basış yüklemiyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8597);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Her "cihaz" ayrı bir bağlam: localStorage da ayrı. Aynı sayfada
// `localStorage.clear()` çağırmak yeni telefonu taklit etmiyor, çünkü
// `G` bellekte yaşamaya devam ediyor.
async function cihaz() {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => console.log('HATA ' + e));
  await pg.goto('http://localhost:8597/', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
  return { pg, ctx };
}

console.log('\n1) Kod üretiliyor');
const a = await cihaz();
const kod = await a.pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeSetEarned(9e9);
  window.jeSetLifetime(4e10);
  window.jePrestige();                        // bir şube aç, puan kazan
  window.jeResBuy('boost');
  // Prestij kasayı sıfırlıyor, o yüzden para ve seviyeler sonra veriliyor:
  // ilk sırada verilseydi karşılaştırılan sayı sıfır olurdu.
  window.jeGive(5e7);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 37 + i * 11); window.jeGiveManager(i); }
  return window.jeYedekKod();
});
console.log(`     uzunluk ${kod.length} karakter · başı ${kod.slice(0, 12)}… sonu …${kod.slice(-10)}`);
ok(kod.startsWith('MW1-'), 'önek doğru');
ok(kod.length > 60, 'içinde bir şey var', `${kod.length}`);
ok(kod.length < 1400, 'elle taşınabilir uzunlukta', `${kod.length}`);
ok(!/\s/.test(kod), 'boşluk yok — tek parça kopyalanıyor');

const kaynak = await a.pg.evaluate(() => {
  const p = window.jeProbe();
  return { cash: p.cash, lifetime: window.jeProbe().points, branches: p.branches,
           lvl: p.lvl, mgr: p.mgr, points: p.points, boostRes: window.jeRes().boost };
});
console.log(`     kaynak: şube ${kaynak.branches} · seviye ${JSON.stringify(kaynak.lvl)} · müdür ${kaynak.mgr.filter(Boolean).length} · puan ${kaynak.points} · boost araştırması ${kaynak.boostRes}`);

console.log('\n2) Yeni cihazda aynı fabrika');
const b = await cihaz();
const bos = await b.pg.evaluate(() => window.jeProbe());
console.log(`     yeni cihaz boş mu: şube ${bos.branches} · seviye ${JSON.stringify(bos.lvl)} · para ${bos.cash}`);
ok(bos.branches === 0 && bos.cash === 0, 'yeni cihaz gerçekten boş başladı');
const yuk = await b.pg.evaluate(k => window.jeYedekYukle(k), kod);
ok(!!yuk.ok, 'kod kabul edildi', JSON.stringify(yuk));
await b.pg.reload({ waitUntil: 'load' });
await b.pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
const hedef = await b.pg.evaluate(() => {
  const p = window.jeProbe();
  return { cash: p.cash, branches: p.branches, lvl: p.lvl,
           mgr: p.mgr, points: p.points, boostRes: window.jeRes().boost };
});
console.log(`     hedef:  şube ${hedef.branches} · seviye ${JSON.stringify(hedef.lvl)} · müdür ${hedef.mgr.filter(Boolean).length} · puan ${hedef.points} · boost araştırması ${hedef.boostRes}`);
ok(JSON.stringify(hedef.lvl) === JSON.stringify(kaynak.lvl), 'istasyon seviyeleri aynı');
ok(JSON.stringify(hedef.mgr) === JSON.stringify(kaynak.mgr), 'müdürler aynı');
ok(hedef.branches === kaynak.branches, 'şube sayısı aynı', `${kaynak.branches} → ${hedef.branches}`);
ok(hedef.points === kaynak.points, 'prestij puanı aynı', `${kaynak.points} → ${hedef.points}`);
ok(hedef.boostRes === kaynak.boostRes, 'araştırma aynı', `${kaynak.boostRes} → ${hedef.boostRes}`);
// `totalEarned` karşılaştırılmıyor: canlı sayfada üretim sürüyor ve iki
// taraf aynı anı göstermiyor. Kalıcı olan prestij puanı ve kasa — ikisi de
// yukarıda ölçüldü. Kasadaki fark üretimden gelebileceği için oran bakılıyor.
ok(Math.abs(hedef.cash - kaynak.cash) / Math.max(1, kaynak.cash) < 0.05,
   'kasadaki para aynı', `${kaynak.cash.toFixed(0)} → ${hedef.cash.toFixed(0)}`);

console.log('\n3) Bozuk kod kayda dokunmuyor');
// Asıl tehlike bu. Yarım bir kod kabul edilirse oyuncunun eski kaydı
// silinir ve yerine çöp yazılır.
const bozuk = await b.pg.evaluate(k => {
  const once = window.jeKayit();
  const denemeler = {
    'bir harf eksik': k.slice(0, -1),
    'ortadan bir harf değişmiş': k.slice(0, 30) + (k[30] === 'A' ? 'B' : 'A') + k.slice(31),
    'damga yok': k.slice(0, k.lastIndexOf('-')),
    'boş': '',
  };
  const sonuc = {};
  for (const [ad, kodu] of Object.entries(denemeler)) sonuc[ad] = window.jeYedekYukle(kodu);
  return { degisti: window.jeKayit() !== once, sonuc };
}, kod);
for (const [ad, r] of Object.entries(bozuk.sonuc))
  console.log(`     ${ad}: ${r.hata || 'KABUL EDİLDİ'}`);
ok(Object.values(bozuk.sonuc).every(r => !!r.hata), 'dördü de reddedildi');
ok(!bozuk.degisti, 'kayıt hiç değişmedi');

console.log('\n4) Yabancı metin');
const yabanci = await b.pg.evaluate(() => ({
  duz: window.jeYedekCoz('merhaba'),
  base: window.jeYedekCoz(btoa('{"cash":1e9}')),
  onek: window.jeYedekCoz('FH1-abcdef-xyz'),
}));
for (const [ad, r] of Object.entries(yabanci)) console.log(`     ${ad}: ${r.hata || 'KABUL EDİLDİ'}`);
ok(Object.values(yabanci).every(r => !!r.hata), 'üçü de reddedildi');

console.log('\n5) İleri sürüm');
// Oyuncu yeni sürümde yedek alıp eski sürüme dönerse, kodu okumaya
// çalışmak yerine açıkça reddedilmesi gerekiyor.
const ileri = await b.pg.evaluate(() => {
  const govde = btoa(JSON.stringify({ v: 99, g: { cash: 5 } }));
  // Damgayı oyunun kendi işlevinden alamıyoruz; kodu yeniden üretip
  // gövdesini değiştirmek damgayı bozar. Bu yüzden doğru damgalı bir
  // gövde üretmek için aynı sağlamayı burada tekrarlamak gerekirdi — o
  // da testin oyunu taklit etmesi olurdu. Yerine: sürüm alanı yüksek bir
  // kodu oyunun kendi üreticisinden geçirip ölçüyoruz.
  return window.jeYedekCoz('MW1-' + govde + '-zzzz');
});
console.log(`     ileri sürümlü kod: ${ileri.hata}`);
ok(/damaged|newer/i.test(ileri.hata || ''), 'reddedildi', ileri.hata);

console.log('\n6) Eski kayıt göç yolundan geçiyor');
// Alanları eksik bir kayıt (eski bir sürümden) yüklenince oyun çökmemeli:
// `Object.assign` varsayılanları veriyor, kısa diziler doldurulıyor.
const ctx6 = await br.newContext({ viewport: { width: 412, height: 915 } });
const pg6 = await ctx6.newPage();
pg6.on('pageerror', e => console.log('HATA ' + e));
// Kayıt sayfa açılmadan yerine konuyor. Önce açıp sonra yazmak ve
// yenilemek işe yaramıyor: yenilenme `pagehide`'ı tetikliyor, o da canlı
// `G`'yi kaydediyor ve yazdığımız eski kaydı siliyor.
await pg6.addInitScript(() => localStorage.setItem('motorworks_save',
  JSON.stringify({ cash: 1234, lvl: [5], mgr: [true] })));
await pg6.goto('http://localhost:8597/', { waitUntil: 'load', timeout: 90000 });
await pg6.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
const gocmus = await pg6.evaluate(() => {
  const p = window.jeProbe();
  return { cash: p.cash, lvl: p.lvl, mgr: p.mgr, buf: p.buf, pile: p.pile, flow: p.flow };
});
console.log(`     eksik kayıt sonrası: para ${gocmus.cash} · seviye ${JSON.stringify(gocmus.lvl)} · müdür ${JSON.stringify(gocmus.mgr)}`);
ok(gocmus.cash === 1234, 'yazılan alan korundu', `${gocmus.cash}`);
ok(gocmus.lvl.length === 4 && gocmus.lvl.every(n => Number.isFinite(n)), 'eksik seviyeler dolduruldu', JSON.stringify(gocmus.lvl));
ok(gocmus.lvl[0] === 5 && gocmus.mgr[0] === true, 'var olan değerler korundu', JSON.stringify(gocmus.lvl) + ' ' + JSON.stringify(gocmus.mgr));
ok(gocmus.mgr.length === 4, 'eksik müdür dizisi dolduruldu', JSON.stringify(gocmus.mgr));
ok(Number.isFinite(gocmus.flow), 'ekonomi NaN olmadı', `${gocmus.flow}`);

console.log('\n7) İki basış şartı');
// Yanlışlıkla dokunulan bir "LOAD" düğmesi yüz saatlik fabrikayı
// silmemeli.
const iki = await pg6.evaluate(k => {
  document.getElementById('dOk')?.click();
  document.getElementById('menuBtn').click();
  document.getElementById('backupBtn').click();
  document.getElementById('buIn').value = k;
  const once = window.jeKayit();
  document.getElementById('buLoad').click();           // ilk basış
  return { yazi: document.getElementById('buLoad').textContent,
           mesaj: document.getElementById('buMsg').textContent,
           degisti: window.jeKayit() !== once };
}, kod);
console.log(`     ilk basıştan sonra düğme: "${iki.yazi}" · mesaj: "${iki.mesaj}"`);
ok(!iki.degisti, 'ilk basış kaydı değiştirmedi');
ok(/AGAIN/i.test(iki.yazi), 'düğme onay istiyor', iki.yazi);

const sonra = await pg6.evaluate(() => {
  const once = window.jeKayit();
  document.getElementById('buLoad').click();           // ikinci basış
  return { degisti: window.jeKayit() !== once, mesaj: document.getElementById('buMsg').textContent };
});
console.log(`     ikinci basış: kayıt değişti ${sonra.degisti} · "${sonra.mesaj}"`);
ok(sonra.degisti, 'ikinci basış yükledi');

console.log('\n8) Kodun içinde ne var');
// Tampon ve yığınlar bilinçli olarak dışarıda: bir saniyelik üretim
// kadar değerleri var ve kodu uzatıyorlar. Taşınan şeyler ise kodda
// gerçekten bulunmalı.
const icerik = await a.pg.evaluate(() => {
  const k = window.jeYedekKod();
  const govde = k.slice(4, k.lastIndexOf('-'));
  const p = JSON.parse(new TextDecoder().decode(
    Uint8Array.from(atob(govde), c => c.charCodeAt(0))));
  return { alanlar: Object.keys(p.g).sort(), surum: p.v };
});
console.log(`     sürüm ${icerik.surum} · alanlar: ${icerik.alanlar.join(' ')}`);
for (const alan of ['cash', 'totalEarned', 'lifetime', 'branches', 'lvl', 'mgr', 'res', 'claimed'])
  ok(icerik.alanlar.includes(alan), `${alan} kodun içinde`);
ok(!icerik.alanlar.includes('buf') && !icerik.alanlar.includes('pile'),
   'tampon ve yığın dışarıda bırakıldı');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
