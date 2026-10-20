// Çevrimdışı kazanç, açık oyunun kazandığıyla aynı mı?
//
// Oyun yokluğu adım adım oynatmıyor: kapalı geçen süreyi kapalı formülle
// hesaplıyor (`autoChain().flow × fiyat × süre`). Gerekçesi kodda yazılı
// ve doğru — dört saati saniye saniye yürütmek aynı sonucu veriyor ama
// on dört bin kat iş yapıyor.
//
// Ama "aynı sonucu veriyor" bir kere ölçülüp bırakılmış bir cümle.
// Bugün ekonominin üssüne dokunan bir araştırma eklendi (kilometre taşı
// gücü), taşıma kapasitesi değişti ve kademe eşikleri kaydı. Formülle
// gerçeğin arası açıldıysa oyuncu ya soyuluyor ya da bedava para
// alıyor, ve ikisi de ekranda görünmüyor.
//
// Var olan ölçüm (`tycoon.mjs`) çevrimdışı kazancı `income × süre` ile
// karşılaştırıyor — ikisi de aynı modelden geliyor, yani kendi kendini
// ölçüyor. Burada karşılaştırılan şey **adım adım yürütülmüş oyun**.
//
// Ölçülen:
//   1. Dört müdürlü fabrika: formül ile yirmi dakikalık gerçek üretim
//   2. Kısmi müdür: zincirin yalnızca bir parçası dönüyorken
//   3. Hiç müdür yok: kazanç tam olarak sıfır
//   4. Tavan: dört saatten uzun yokluk dört saat ödüyor
//   5. Kilometre taşı araştırması iki tarafı da aynı oranda büyütüyor
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8627);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8627/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', null, { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Aynı başlangıç durumundan iki yol: formül, ve adım adım yürütme.
// Adım adım yürütmede işçi yok (`jeAutoCarry(false)`), çünkü kapalı bir
// uygulamada da yok.
const karsilastir = async (kur, sn) => pg.evaluate(async ({ kur, sn }) => {
  const hazirla = eval('(' + kur + ')');
  // 1. yol: kapalı formül
  window.jeWipeProgress(); window.jeTutSkip(); window.jeAutoCarry(false);
  hazirla();
  const a0 = window.jeProbe().cash;
  const r = window.jeOffline(sn);
  const formul = window.jeProbe().cash - a0;
  // 2. yol: aynı durumdan adım adım
  window.jeWipeProgress(); window.jeTutSkip(); window.jeAutoCarry(false);
  hazirla();
  const b0 = window.jeProbe().cash;
  for (let i = 0; i < sn * 4; i++) window.jeStep(0.25);
  const adim = window.jeProbe().cash - b0;
  return { formul, adim, rapor: r ? r.got : 0 };
}, { kur, sn });

const yuzde = (a, b) => b === 0 ? (a === 0 ? 0 : 100) : Math.abs(a - b) / b * 100;

console.log('\n1) Dört müdür — zincirin tamamı dönüyor');
const tam = await karsilastir(`() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 40); window.jeGiveManager(i); }
}`, 20 * 60);
console.log(`     formül ${tam.formul.toFixed(0)} · adım adım ${tam.adim.toFixed(0)} · fark %${yuzde(tam.formul, tam.adim).toFixed(2)}`);
ok(yuzde(tam.formul, tam.adim) < 3, 'formül yirmi dakikalık gerçek üretimle uyuşuyor',
   `%${yuzde(tam.formul, tam.adim).toFixed(2)}`);

console.log('\n2) Kısmi müdür — zincirin ortası elle');
// Asıl riskli durum bu: iki istasyonun müdürü var, ikisinin yok.
// Formül `autoChain()` kullanıyor, yani elle işleyen bağın sıfır
// aktığını varsayıyor. Adım adım yürütme de öyle davranmalı.
// Dörtten üçünün müdürü var, biri eksik — dört olasılığın hepsi.
//
// Beklediğim şey "tek eksik müdür kazancı sıfırlar" idi ve **yanlıştı**:
// Sevkiyat müdürsüzken fabrika yine kazanıyor. Sebebi tutarlı —
// müdürün işi malı bir sonraki istasyona taşımak, Sevkiyat'ın bir
// sonrakisi yok, malı satmak zaten kendi işi. Yalnızca yarı hızda
// satıyor (müdür çarpanı ×2).
//
// Yani kural şu: **Sevkiyat dışındaki her istasyonun müdürü olmalı.**
// Oyuncunun bilmesi gereken bir şey ve hiçbir yerde yazmıyordu.
const kismi = [];
for (const eksik of [0, 1, 2, 3])
  kismi.push({ eksik, ...await karsilastir(`() => {
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) {
      window.jeSetLevel(i, 40);
      if (i !== ${eksik}) window.jeGiveManager(i);
    }
  }`, 20 * 60) });
for (const k of kismi)
  console.log(`     ${['Döküm', 'Pres', 'Montaj', 'Sevkiyat'][k.eksik].padEnd(9)} müdürsüz: formül ${k.formul.toFixed(0)} · adım adım ${k.adim.toFixed(0)}`);
const yuzdeFark = k => yuzde(k.formul, k.adim);
ok(kismi.every(k => yuzdeFark(k) < 3), 'dört durumda da iki yol uyuşuyor',
   kismi.map(k => '%' + yuzdeFark(k).toFixed(2)).join(' '));
ok(kismi.filter(k => k.eksik < 3).every(k => k.formul === 0),
   'Döküm, Pres ya da Montaj müdürsüzse kapalı fabrika hiç kazanmıyor',
   kismi.slice(0, 3).map(k => k.formul).join(' '));
ok(kismi[3].formul > 0,
   'Sevkiyat müdürsüz olsa bile satıyor — bir sonraki istasyonu yok',
   `${kismi[3].formul.toFixed(0)}`);
// Yarı hız: müdür çarpanı ×2, yani tam donanımlı fabrikanın yarısı
// kadar. Oran testin yazdığı bir sayı değil, oyunun `MGR_MULT`'ı.
// Oran 2 değil 2.24 çıktı ve bu da doğruydu: Kwame yalnızca hızı iki
// katına çıkarmıyor, araç fiyatına da +%12 ekliyor. 2 × 1.12 = 2.24.
// Beklenen değer testin yazdığı bir sayı değil, oyunun iki sabitinin
// çarpımı.
const sb = await pg.evaluate(() => window.jeProbeSabit());
const beklenen = sb.mgrMult * sb.mgrPrice;
console.log(`     Sevkiyat müdürlü/müdürsüz oranı: ${(tam.formul / kismi[3].formul).toFixed(3)} · ` +
  `beklenen MGR_MULT ${sb.mgrMult} × MGR_PRICE ${sb.mgrPrice} = ${beklenen.toFixed(3)}`);
ok(Math.abs(tam.formul / kismi[3].formul - beklenen) < 0.02,
   'eksik müdürün bedeli hız çarpanı ile fiyat yeteneğinin çarpımı',
   `${(tam.formul / kismi[3].formul).toFixed(3)} / ${beklenen.toFixed(3)}`);

console.log('\n3) Hiç müdür yok');
const yok = await karsilastir(`() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 40);
}`, 20 * 60);
console.log(`     formül ${yok.formul.toFixed(0)} · adım adım ${yok.adim.toFixed(0)}`);
ok(yok.formul === 0, 'müdürsüz fabrika kapalıyken hiç kazanmıyor', `${yok.formul}`);
ok(yok.adim === 0, 'adım adım yürütmede de sıfır', `${yok.adim}`);

console.log('\n4) Tavan');
const tavan = await pg.evaluate(() => {
  window.jeWipeProgress(); window.jeTutSkip(); window.jeAutoCarry(false);
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 40); window.jeGiveManager(i); }
  const dort = (() => { const a = window.jeProbe().cash; window.jeOffline(4 * 3600); return window.jeProbe().cash - a; })();
  const yirmi = (() => { const a = window.jeProbe().cash; window.jeOffline(20 * 3600); return window.jeProbe().cash - a; })();
  return { dort, yirmi, tavanSn: window.jeProbeSabit().offline };
});
console.log(`     4 saat ${tavan.dort.toFixed(0)} · 20 saat ${tavan.yirmi.toFixed(0)} · tavan ${tavan.tavanSn / 3600} saat`);
ok(Math.abs(tavan.yirmi - tavan.dort) / tavan.dort < 0.01,
   'yirmi saatlik yokluk dört saat ödüyor', `%${(yuzde(tavan.yirmi, tavan.dort)).toFixed(2)}`);

console.log('\n5) Kilometre taşı araştırması iki tarafı da büyütüyor');
// Yeni araştırma üsse giriyor. Formül `autoChain()`'den, adım adım
// yürütme `runFactory`'den geçiyor — ikisi de aynı `rateOf`'u
// kullanmalı. Kullanmasalardı araştırma yalnızca birini büyütürdü ve
// oyuncu ya kapalıyken ya açıkken soyulurdu.
const tas = await karsilastir(`() => {
  window.jeGive(1e9);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 120); window.jeGiveManager(i); }
  window.jeSetLifetime(1e14);
  window.jeResBuy('tas', 10);
}`, 20 * 60);
console.log(`     taş gücü açıkken: formül ${tas.formul.toExponential(3)} · adım adım ${tas.adim.toExponential(3)} · fark %${yuzde(tas.formul, tas.adim).toFixed(2)}`);
ok(yuzde(tas.formul, tas.adim) < 3, 'araştırma iki yolu da aynı oranda büyüttü',
   `%${yuzde(tas.formul, tas.adim).toFixed(2)}`);
ok(tas.formul > tam.formul * 5, 'araştırma çevrimdışı kazancı gerçekten büyüttü',
   `${tam.formul.toExponential(2)} → ${tas.formul.toExponential(2)}`);

console.log('\n6) Dönüş ekranı gerçek süreyi söylüyor');
// "Uzak kalınan süre" kesilmiş süreyi yazıyordu: yirmi saat sonra
// dönen oyuncu "4sa 0dk" görüyordu. Ekranda duran ve gerçekle
// uyuşmayan bir sayı — ve bu sefer oyuncunun kaybını gizliyordu.
const ekran = await pg.evaluate(() => {
  const olc = sn => {
    window.jeWipeProgress(); window.jeTutSkip();
    window.jeGive(1e9);
    for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 40); window.jeGiveManager(i); }
    const r = window.jeOffline(sn);
    return { sure: document.getElementById('wTime').textContent,
             alt: document.getElementById('wSub').textContent,
             gercek: Math.round(r.gercek), odenen: Math.round(r.gone),
             kesilen: Math.round(r.kesilen) };
  };
  return { kisa: olc(2 * 3600), uzun: olc(20 * 3600) };
});
for (const [ad, d] of Object.entries(ekran))
  console.log(`     ${ad.padEnd(5)} ekranda "${d.sure}" · gerçek ${d.gercek}sn · ödenen ${d.odenen}sn`);
console.log(`     uzun yokluğun alt satırı: ${ekran.uzun.alt.slice(0, 72)}`);
ok(ekran.kisa.kesilen === 0, 'tavanın altında kesilen yok');
ok(/^2/.test(ekran.kisa.sure), 'kısa yoklukta süre doğru', ekran.kisa.sure);
ok(/^20/.test(ekran.uzun.sure), 'uzun yoklukta GERÇEK süre yazıyor', ekran.uzun.sure);
ok(ekran.uzun.kesilen > 15 * 3600, 'kesilen süre hesaplanıyor', `${ekran.uzun.kesilen}sn`);
ok(ekran.uzun.alt !== ekran.kisa.alt && ekran.uzun.alt.length > 30,
   'alt satır kaybı söylüyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
