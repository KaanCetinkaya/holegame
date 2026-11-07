// Araç kademeleri: oyun verdiği sözü tutuyor mu?
//
// Ekranda "Sports: hepsi 220. seviyede" yazıyor. Üç saatlik bir oyun
// ölçüldü ve o söz hiç tutulmadı: altı şube devrinden sonra bile kademe
// Pickup'ta kalıyordu. Sebep iki yönlendirmenin birbirini tutmaması —
//
//   kademe kapısı **en zayıf** istasyona bakıyor,
//   oyunun yönlendirmesi ise **darboğaza**,
//
// ve ikisi aynı istasyon değil. Derya'nın +%25 döküm hızı yeteneği
// Dökümü 37 seviye geride olmasına rağmen darboğaz olmaktan çıkarıyor
// (hız 16000'e karşı 15168), oyuncu onu hiç yükseltmiyor, Döküm 200'de
// çakılıyor. Beş araç modelinden ikisi — ×34 ve ×115 çarpanlarıyla —
// ölü içerikti.
//
// Ölçülen:
//   1. Kapıyı tutan istasyon doğru bulunuyor
//   2. Ekran onu **adıyla** söylüyor
//   3. Darboğazı takip eden oyuncu takılıyor (hatanın kendisi)
//   4. Ekrandaki iki uyarıyı da takip eden oyuncu kademeleri açıyor
//   5. Uyarı gereksiz yere çıkmıyor: kapıyı tutan yoksa ya da zaten
//      darboğazsa ortalık kalabalıklaşmıyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8617);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8617/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Kapıyı tutan istasyon');
const tut = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e30);
  // Kurulum iki şartı birden sağlamalı, yoksa ölçülen şey hata değil:
  //   - diğerleri eşiğin üstünde (yoksa "tek tutan" diye bir şey yok)
  //   - Döküm darboğaz **değil** (hatanın kaynağı tam olarak bu)
  // Aradaki fark da dar olmalı: altmış seviye geride kalan Döküm
  // Derya'nın +%25'ine rağmen yeniden darboğaz oluyor.
  window.jeSetLevel(0, 205);
  for (let i = 1; i < 4; i++) window.jeSetLevel(i, 242);
  for (let i = 0; i < 4; i++) window.jeGiveManager(i);
  window.jeRefresh();
  return { t: window.jeTier(), neck: window.jeProbe().neck, hiz: window.jeRates() };
});
console.log(`     seviyeler ${JSON.stringify(tut.t.lvl)} · darboğaz ${tut.neck}`);
console.log(`     kademe ${tut.t.ad} → sonraki ${tut.t.sonraki} (${tut.t.esik}) · tutan ${JSON.stringify(tut.t.tutan)}`);
ok(JSON.stringify(tut.t.tutan) === '[0]', 'tek tutan Döküm', JSON.stringify(tut.t.tutan));
ok(tut.neck !== 'Foundry', 've Döküm darboğaz değil — hatanın kaynağı', tut.neck);

console.log('\n2) Ekran onu adıyla söylüyor');
const yazi = await pg.evaluate(() => ({
  etiket: document.getElementById('prodTag').textContent.trim(),
  satir: [...document.querySelectorAll('.st .meta')].map(e => e.textContent.trim()),
}));
console.log(`     üst etiket: "${yazi.etiket}"`);
yazi.satir.forEach((t, i) => console.log(`     satır ${i}: ${t}`));
ok(/Foundry|Döküm/.test(yazi.etiket), 'üst etiket tutan istasyonu adıyla veriyor', yazi.etiket);
ok(/HOLDING BACK|BEKLİYOR/i.test(yazi.satir[0]), 'Döküm satırında uyarı var', yazi.satir[0]);
ok(!/HOLDING BACK|BEKLİYOR/i.test(yazi.satir.slice(1).join(' ')), 'diğer satırlarda uyarı yok');

// Oyuncu taklidi: `kural` hangi istasyonun alınacağına karar veriyor.
// İkisi de **ekranda yazanı** okuyor, yani ölçülen şey oyunun verdiği
// yönlendirmenin işe yarayıp yaramadığı.
const OYNA = `(dk, kural) => {
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  window.jeAutoCarry(true);
  for (let sn = 0; sn < dk * 60; sn++) {
    window.jeRun(1);
    for (let i = 0; i < 4; i++) window.jeBuyManager(i);
    const p = window.jeProbe();
    const neck = AD.indexOf(p.neck);
    if (kural === 'darbogaz') {
      window.jeBuy(neck, 'max');
    } else {
      // Ekranda iki uyarı var: DARBOĞAZ ve "kademeyi bekletiyor".
      // Oyuncu ikisini de görüyor; para ikisine bölünüyor.
      const tutan = window.jeTier().tutan.filter(i => i !== neck);
      if (tutan.length && sn % 2 === 0) window.jeBuy(tutan[0], 'max');
      else window.jeBuy(neck, 'max');
    }
  }
  const p = window.jeProbe();
  return { lvl: [...p.lvl], tier: p.tier, urun: p.product, hiz: p.income };
}`;

async function kosu(kural, turSayisi = 4, dk = 30) {
  return pg.evaluate(async ({ OYNA, kural, turSayisi, dk }) => {
    const oyna = eval(OYNA);
    window.jeWipeProgress();
    window.jeTutSkip();
    const out = [];
    for (let t = 1; t <= turSayisi; t++) {
      out.push({ tur: t, ...oyna(dk, kural) });
      window.jePrestige();
      for (let i = 0; i < 400; i++) window.jeResBuy('line');
    }
    return out;
  }, { OYNA, kural, turSayisi, dk });
}

console.log('\n3) Yalnızca darboğazı takip eden oyuncu (yedi devir)');
const a = await kosu('darbogaz', 7);
for (const k of a)
  console.log(`     tur ${k.tur}  ${JSON.stringify(k.lvl).padEnd(24)} kademe ${k.tier} (${k.urun})`);
const aSon = a[a.length - 1];
// Döküm darboğaz olmaktan çıktığı anda bir daha hiç alınmıyor ve
// olduğu yerde kalıyor. Sports'a yetiyor, Luxury'ye yetmiyor.
console.log(`     en zayıf istasyon yedi devir boyunca: ${a.map(k => Math.min(...k.lvl)).join(' → ')}`);
ok(aSon.tier >= 3, 'Sports kademesine varıyor', `kademe ${aSon.tier}`);
ok(aSon.tier < 4, 'ama Luxury açılmıyor — en zayıf istasyon çakılı kalıyor',
   `en zayıf ${Math.min(...aSon.lvl)}`);

console.log('\n4) Ekrandaki iki uyarıyı da takip eden oyuncu (yedi devir)');
const b = await kosu('ekran', 7);
for (const k of b)
  console.log(`     tur ${k.tur}  ${JSON.stringify(k.lvl).padEnd(24)} kademe ${k.tier} (${k.urun})`);
const bSon = b[b.length - 1];
console.log(`     yedi devir sonunda: darboğaz-oyuncusu kademe ${aSon.tier}, ekran-oyuncusu kademe ${bSon.tier}`);
console.log(`     en zayıf istasyon: ${b.map(k => Math.min(...k.lvl)).join(' → ')}`);
ok(bSon.tier > aSon.tier, 'uyarıyı okuyan oyuncu daha ileri kademede',
   `${aSon.tier} → ${bSon.tier}`);
ok(bSon.tier >= 4, 'Luxury kademesi açıldı', `kademe ${bSon.tier}`);

console.log('\n5) Uyarı gereksiz yere çıkmıyor');
const temiz = await pg.evaluate(() => {
  const oku = () => [...document.querySelectorAll('.st .meta')]
    .map(e => e.textContent).filter(t => /HOLDING BACK|BEKLİYOR/i.test(t)).length;
  window.jeWipeProgress(); window.jeGive(1e30);
  // a) Hepsi eşit ve düşük: dördü de tutuyor, uyarı kalabalık yapmamalı
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 10);
  window.jeRefresh();
  const hepsi = oku();
  // b) Tutan istasyon aynı zamanda darboğaz: zaten DARBOĞAZ yazıyor
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 120);
  window.jeSetLevel(0, 40);
  window.jeRefresh();
  const darbogazda = { uyari: oku(), neck: window.jeProbe().neck, tutan: window.jeTier().tutan };
  // c) En üst kademe: sonraki yok
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 500);
  window.jeRefresh();
  const ustte = { uyari: oku(), sonraki: window.jeTier().sonraki };
  return { hepsi, darbogazda, ustte };
});
console.log(`     dördü de geride: ${temiz.hepsi} uyarı`);
console.log(`     tutan = darboğaz (${temiz.darbogazda.neck}): ${temiz.darbogazda.uyari} uyarı`);
console.log(`     en üst kademe (sonraki ${temiz.ustte.sonraki}): ${temiz.ustte.uyari} uyarı`);
ok(temiz.hepsi === 0, 'dördü de geriyken uyarı yok — söyleyecek bir şey yok');
ok(temiz.darbogazda.uyari === 0, 'tutan zaten darboğazsa ikinci uyarı yok');
ok(temiz.ustte.uyari === 0, 'en üst kademede uyarı yok');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
