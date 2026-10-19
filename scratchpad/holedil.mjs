// Fruit Hole Türkçe konuşuyor mu, ve her yerde mi?
//
//   node build-www.mjs && node scratchpad/holedil.mjs
//
// ## Neden var
//
// Oyun İngilizce yazıldı, hedef kitle ABD/Avrupa seçilmişti. 19 Ekim'de
// Play Console'a bakıldı: günlük 3-8 yüklemenin neredeyse tamamı
// **Türkiye**. Yani oyuncular oyunu kendi dillerinde görmüyordu ve bunu
// söyleyen hiçbir ölçüm yoktu.
//
// Çeviri eklendi. Bu dosya onun **bütün** olup olmadığını ölçüyor,
// çünkü yarım çeviri iki yerden bozulur ve ikisi de sessiz:
//
//   1. Tabloda eksik/boş bir karşılık — `T()` İngilizceye düşüyor ve
//      hiçbir şey patlamıyor.
//   2. Ekranda tablodan gelmeyen bir yazı — `innerHTML` ile elle
//      kurulmuş bir satır, tablo kontrolünün hiç görmediği yerde.
//
// İkincisi Motor Works'te dört yerde çıktı ve en sinsisi bir reklam
// düğmesiydi: `data-t`'si doğruydu, açılışta Türkçeydi, **bir kere
// reklam izleyince** İngilizceye dönüyordu. O yüzden burada da asıl
// kapı tabloya değil **ekrana** bakıyor: her ekran iki dilde açılıyor
// ve iki dilde aynı kalan her yazı şüpheli.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8669);

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
// Depo yalnızca **ilk** yüklemede siliniyor. `addInitScript` her
// yüklemede koşuyor ve ilk hâlinde yenilemede de siliyordu: ölçüm
// "seçim kalıcı değil" diye düşüyordu, oysa kaydı silen ölçümün
// kendisiydi. Oyunun hatasıyla ölçümün hatası aynı satır gibi görünür.
await pg.addInitScript(() => {
  try {
    if (!sessionStorage.getItem('olcumTemiz')) {
      localStorage.clear();
      sessionStorage.setItem('olcumTemiz', '1');
    }
  } catch (e) {}
});
await pg.goto('http://localhost:8669/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleDil === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(1200);
// Günlük ödül perdesi menünün önünü kapatıyor.
await pg.evaluate(() => document.getElementById('dailyBtn')?.click());
await pg.waitForTimeout(300);

console.log('\n1) Çeviri tablosu');
const t = await pg.evaluate(() => window.fruitHoleDil());
const bos = Object.entries(t.tablo).filter(([, v]) =>
  !Array.isArray(v) || v.length < 2 || !String(v[0]).trim() || !String(v[1]).trim());
console.log(`     ${t.anahtar.length} anahtar · boş karşılık ${bos.length}`);
ok(t.anahtar.length > 60, 'tablo dolu', `${t.anahtar.length} anahtar`);
ok(bos.length === 0, 'her anahtarın iki karşılığı da dolu', bos.map(b => b[0]).join(', '));

// İki karşılığı **aynı** olan anahtar, çevrilmeyi unutulmuş olabilir.
// Kasıtlı aynı olanlar beyaz listede ve hepsinin bir sebebi var.
const AYNI_SERBEST = new Set([]);
const ayni = Object.entries(t.tablo)
  .filter(([k, v]) => v[0] === v[1] && !AYNI_SERBEST.has(k)).map(([k]) => k);
console.log(`     iki dilde aynı yazan: ${ayni.length ? ayni.join(', ') : '(yok)'}`);
ok(ayni.length === 0, 'çevrilmeyi unutulmuş anahtar yok', ayni.join(', '));

console.log('\n2) Ekrandaki her işaret tabloda var');
// `data-t="yanlisAd"` sessizce anahtarın kendisini yazdırıyor: ekranda
// "notUpg" görünür ve kimse fark etmez.
const eksik = [...new Set(t.isaretli)].filter(k => !t.anahtar.includes(k));
console.log(`     ${t.isaretli.length} işaretli öğe · tabloda olmayan ${eksik.length}`);
ok(t.isaretli.length > 25, 'ekranda işaretli yazı var', `${t.isaretli.length}`);
ok(eksik.length === 0, 'her data-t tabloda karşılığını buluyor', eksik.join(', '));

console.log('\n3) Ekranlar iki dilde');
// Her ekran ve onu açan düğme. Hepsinin **dolu** olması gerekiyor: boş
// bir ekran hiçbir şey ölçmüyor ve kapı sessizce geçer.
const EKRANLAR = [
  ['menu', null],
  ['goals', 'goalsBtn'],
  ['levels', 'levelsBtn'],
  ['upgrades', 'upgBtn'],
  ['shop', 'shopBtn'],
  ['collection', 'collBtn'],
];
const topla = () => pg.evaluate(ekranlar => {
  const out = {};
  // Yalnızca **görünen** yaprak yazı: gizlenmiş bir düğme eski metnini
  // üstünde taşıyor ve onu okumak olmayan bir hata uydurmak olurdu.
  const yaprak = kok => [...kok.querySelectorAll('*')]
    .filter(el => el.children.length === 0 && el.textContent.trim()
                  && el.getClientRects().length > 0)
    .map(el => el.textContent.trim());
  for (const [id, btn] of ekranlar) {
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
    const el = document.getElementById(id);
    if (btn) { const b = document.getElementById(btn); if (b) b.click(); }
    el.classList.add('show');
    out[id] = yaprak(el);
  }
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  document.getElementById('menu').classList.add('show');
  return out;
}, EKRANLAR);

const en = await topla();
for (const [id] of EKRANLAR) console.log(`     ${id.padEnd(11)} ${en[id].length} yazı`);
ok(Object.values(en).every(v => v.length > 2), 'her ekranda ölçülecek yazı var',
  Object.entries(en).filter(([, v]) => v.length <= 2).map(([k]) => k).join(', '));

await pg.evaluate(() => document.getElementById('menuLang').click());
await pg.waitForTimeout(300);
const tr = await topla();
const dilNo = await pg.evaluate(() => window.fruitHoleDil().dil);
ok(dilNo === 1, 'dil Türkçeye döndü', `${dilNo}`);

console.log('\n4) Türkçede İngilizce kalan yazı');
// Beyaz liste: çevrilmesi **gerekmeyen** şeyler. Marka adı marka,
// rakam dilsiz, kaplama/meyve simgesi zaten resim.
const SERBEST = [
  /^[\d.,:%×+\-/\s]*[KMBT]?[\s%×]*$/,          // sayı, yüzde, çarpan
  /^[^A-Za-zĞÜŞİÖÇğüşıöç]+$/,                   // yalnız simge/emoji
  /^(Peelo|Fruit Hole)$/,                        // marka
  /^(EN|TR)$/,                                   // dil düğmesinin kendisi
  /^(dev|v[\d.]+ \(\d+\))$/,                     // derleme numarası
  // Tarla ve düzen **adları** iki dilde de aynı kalıyor, ve bu bir
  // eksik değil bir tercih: "Valley of Kings" bir yer adı, "Dial" bir
  // düzenin adı. Motor Works'te müdür adları da çevrilmiyor. Oyuncu
  // bunları ad olarak okuyor; çevirmek yirmi dört tema ve yirmi dört
  // düzeni yeniden adlandırmak olurdu ve kazancı belirsiz.
  //
  // Beyaz listeye alınan şey ad; **ada eşlik eden cümle** değil:
  // "Not played yet", "No upgrades — same hole for everyone" ve
  // "N cleared · M stars" çevrildi.
  //
  // Adlar bir kalıpla değil **oyundan okunarak** geçiliyor. İlk
  // hâlinde "en çok üç kelime, büyük harfle başlayan" diye bir kalıp
  // vardı ve o kalıp "Remove ads"i de yutuyordu: yani mağaza
  // başlıklarının çevirisi kalksa kapı yine geçerdi. Liste aşağıda
  // tablodan dolduruluyor, yani yeni bir tema eklenince kendiliğinden
  // kapsanıyor ve çevrilmemiş bir **cümle** asla kapsanmıyor.
];
// Tarla ve düzen adları oyundan okunuyor.
const adlar = await pg.evaluate(() => {
  const t = window.fruitHoleThemeTable();
  const set = new Set();
  for (const th of t.themes) {
    if (th.name) set.add(th.name);
    for (const d of th.patterns || []) set.add(d);
  }
  return [...set];
});
console.log(`     ad beyaz listesi: ${adlar.length} tarla/düzen adı oyundan okundu`);
ok(adlar.length > 20, 'ad listesi oyundan geldi', `${adlar.length}`);
// Bir yaprak yazı emoji + ad biçiminde olabiliyor ("🔴 📀 Dial").
const adIcerir = s => {
  const sade = s.replace(/[^A-Za-zĞÜŞİÖÇğüşıöç' ]/g, ' ').replace(/\s+/g, ' ').trim();
  return adlar.some(a => sade === a);
};
const serbest = s => SERBEST.some(r => r.test(s)) || adIcerir(s);
let supheli = 0;
for (const [id] of EKRANLAR) {
  const b = new Set(tr[id]);
  for (const yazi of new Set(en[id])) {
    if (!b.has(yazi) || serbest(yazi)) continue;
    supheli++;
    console.log(`     ${id.padEnd(11)} "${yazi.slice(0, 56)}"`);
  }
}
if (!supheli) console.log('     (yok)');
ok(supheli === 0, 'Türkçede İngilizce kalan yazı yok', `${supheli} tane`);

// Parçalı kaçak: İngilizce bir cümle **Türkçe bir satırın içine**
// karışırsa yukarıdaki karşılaştırma onu göremiyor — satırın tamamı iki
// dilde farklı olduğu için şüpheli saymıyor. Hata geri konarak görüldü:
// `bits.join(' · ')` ile kurulan satırda bir parça İngilizce bırakıldı
// ve kapı geçti.
//
// Bu satır tabloyu tersten kullanıyor: bir anahtarın **İngilizce**
// karşılığı Türkçe ekranda görünüyorsa, o yer çevrilmemiş demek.
console.log('\n4b) Türkçe satırın içinde kalan İngilizce parça');
const parcali = [];
for (const [k, v] of Object.entries(t.tablo)) {
  const ing = String(v[0]).replace(/\{\d\}/g, '').trim();
  // Kısa ve biçimsel karşılıklar ("EN", "MAX") yanlış alarm üretir.
  if (v[0] === v[1] || ing.length < 12) continue;
  for (const [id] of EKRANLAR) {
    for (const yazi of new Set(tr[id])) {
      if (yazi.includes(ing)) { parcali.push(`${id} · ${k} · "${ing.slice(0, 44)}"`); break; }
    }
  }
}
if (!parcali.length) console.log('     (yok)');
for (const x of parcali) console.log(`     ${x}`);
ok(parcali.length === 0, 'Türkçe satırın içinde İngilizce parça yok',
  `${parcali.length} tane`);

console.log('\n5) Seçim kalıcı');
// Bir kere Türkçeye alan oyuncu, oyunu kapatıp açınca İngilizce
// bulmamalı — ve telefonunu İngilizceye çevirince de.
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleDil === 'function', null, { timeout: 60000 });
await pg.waitForTimeout(800);
const sonra = await pg.evaluate(() => ({
  dil: window.fruitHoleDil().dil,
  oyna: document.getElementById('playBtn').textContent.trim(),
}));
console.log(`     yenilemeden sonra dil ${sonra.dil} · Play düğmesi "${sonra.oyna}"`);
ok(sonra.dil === 1, 'seçim yenilemeden sonra duruyor', `${sonra.dil}`);
ok(sonra.oyna === 'Oyna', 'ekran da Türkçe açıldı', sonra.oyna);

ok(hata.length === 0, 'sayfa hatası yok', hata[0] || '');
console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
