// Hedef ödülleri ne kadar ödüyor, ve ne zaman aldığın fark ediyor mu?
//
// Kaan beş dakikada 177 paradan 109M'e çıktı. Sebep hedefler: her hedef
// "şu anki hızınla kaç saniye kazanırdın" olarak ödüyor
// (`goalPay = g.pay * chain().income`), ve `chain().income` zincirin
// **teorik** hızı — fabrikanın gerçekten kazandığı değil.
//
// Buradan iki şüphe çıkıyor ve ikisi de ölçülüyor:
//
//   1. Ölü fabrika ödeniyor mu? Müdürü olmayan bir fabrikanın geliri
//      sıfır. Teorik hız yine de yüksek, yani ödül de yüksek olmalı.
//      Olması gereken bu mu, ayrı mesele — önce gerçekten öyle mi.
//
//   2. Sıra fark ediyor mu? Ödül anlık hıza bağlı. Bir hedefi almak parayı
//      büyütüyor, para seviyeyi, seviye hızı, hız da **sıradaki hedefin
//      ödülünü**. Hemen almakla biriktirip sonra almak arasında kaç kat
//      fark var?
//
// Ölçüm, iki oyuncuyu aynı yolda yürütüp topladıkları ödülü karşılaştırıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8576);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8576/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };
const fmt = n => n >= 1e9 ? (n / 1e9).toFixed(2) + 'B'
  : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M'
  : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(0);

console.log('\n1) Hiçbir şey kazanmayan fabrika ödeniyor mu?');
const olu = await pg.evaluate(() => {
  window.jeWipeProgress();
  // Seviyeleri yüksek, müdür yok, işçi avluda: gerçek gelir sıfır.
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 60);
  window.jeTeleport(0, 8);
  window.jeMove(0, 0);
  const once = window.jeProbe().cash;
  for (let i = 0; i < 200; i++) window.jeStep(0.05);     // 10 saniye
  const p = window.jeProbe();
  const hedefler = window.jeGoals().filter(g => g.done && !g.taken);
  return { gercekKazanc: p.cash - once, teorik: p.income, gosterilen: p.gosterilen,
           hazir: hedefler.map(g => ({ id: g.id, pay: g.pay })) };
});
console.log(`     10 saniyede kasaya giren: ${olu.gercekKazanc.toFixed(2)}`);
console.log(`     teorik hız ${fmt(olu.teorik)}/s · ekranda ${fmt(olu.gosterilen)}/s`);
console.log(`     alınmaya hazır hedefler: ${olu.hazir.map(g => `${g.id} ${fmt(g.pay)}`).join(' · ') || 'yok'}`);
const toplamHazir = olu.hazir.reduce((a, g) => a + g.pay, 0);
ok(Math.abs(olu.gercekKazanc) < 1, 'fabrika gerçekten hiçbir şey kazanmıyor');
console.log(`     ${olu.hazir.length} hedef toplam ${fmt(toplamHazir)} ödüyor — ` +
  `fabrikanın ${fmt(toplamHazir / Math.max(1e-9, olu.gercekKazanc || 1e-9))} katı`);

// --- iki oyuncu, aynı yol ---
//
// Yol: seviyeyi kademe kademe yükselt. Tek fark hedefin ne zaman alındığı.
const YOL = [10, 20, 30, 50, 60, 80, 100, 120, 150, 200];

const kos = async (hemenAl) => pg.evaluate(({ YOL, hemenAl }) => {
  window.jeWipeProgress();
  window.jeGive(1e30);
  for (let i = 0; i < 4; i++) window.jeGiveManager(i);
  let toplam = 0;
  const alinan = [];
  for (const lv of YOL) {
    for (let i = 0; i < 4; i++) window.jeSetLevel(i, lv);
    for (let k = 0; k < 20; k++) window.jeStep(0.05);
    if (hemenAl) {
      for (const g of window.jeGoals()) {
        if (g.done && !g.taken) {
          const p = window.jeClaimGoal(g.id);
          toplam += p; alinan.push(`${g.id}@lv${lv} ${p.toFixed(0)}`);
        }
      }
    }
  }
  if (!hemenAl) {
    // Biriktiren oyuncu: en sonda, hepsini birden.
    for (const g of window.jeGoals()) {
      if (g.done && !g.taken) {
        const p = window.jeClaimGoal(g.id);
        toplam += p; alinan.push(`${g.id}@son ${p.toFixed(0)}`);
      }
    }
  }
  return { toplam, sayi: alinan.length };
}, { YOL, hemenAl });

console.log('\n2) Aynı yol, iki oyuncu');
const hemen = await kos(true);
const biriktiren = await kos(false);
console.log(`     hemen alan:      ${hemen.sayi} hedef · toplam ${fmt(hemen.toplam)}`);
console.log(`     biriktiren:      ${biriktiren.sayi} hedef · toplam ${fmt(biriktiren.toplam)}`);
const kat = biriktiren.toplam / Math.max(1, hemen.toplam);
console.log(`     biriktirmenin getirisi: ${kat.toFixed(1)} kat`);

// Eşik: ödülün ne zaman alındığına göre değişmesi kaçınılmaz (hız büyüyor),
// ama **oynama biçimini belirleyecek** kadar büyük olmamalı. Üç kat, bir
// oyuncunun "hedefleri biriktireyim" diye oynamasını gerektirmeyecek sınır.
ok(kat < 3, 'biriktirmek oyunu kırmıyor', `${kat.toFixed(1)} kat`);

// --- 3) Ödül, kendisini ölçen sayıyı besliyor mu? ---
//
// `G.totalEarned` iki şeyi besliyor: "toplam şu kadar kazan" hedeflerini ve
// prestij puanını (`pointsFor(lifetime + totalEarned)`). Hedef ödülü de o
// sayıya ekleniyor. Yani ödül, kendisini ölçen sayıyı büyütüyor.
//
// Kaan'da gözlenen tam buydu: 00:08'de menü "prestij için 2.06M daha
// kazan" diyordu, hedefleri aldıktan altı dakika sonra oyun "+1.15K puan"
// teklif ediyordu. Aradaki fark fabrikanın ürettiği bir şey değildi.
console.log('\n3) Ödül kendi ölçüsünü besliyor mu?');
const halka = await pg.evaluate(() => {
  window.jeWipeProgress();
  // Fabrika çalışmıyor: müdür yok, işçi avluda. Üretilen hiçbir şey yok.
  for (let i = 0; i < 4; i++) window.jeSetLevel(i, 60);
  window.jeTeleport(0, 8);
  window.jeMove(0, 0);
  for (let i = 0; i < 20; i++) window.jeStep(0.05);
  const once = window.jeProbe();
  let odul = 0, kez = 0;
  // Ödül yeni hedef açıyorsa döngü kendi kendine dönecek.
  for (let tur = 0; tur < 10; tur++) {
    const hazir = window.jeGoals().filter(g => g.done && !g.taken);
    if (!hazir.length) break;
    for (const g of hazir) { odul += window.jeClaimGoal(g.id); kez++; }
  }
  const sonra = window.jeProbe();
  return { oncePuan: once.points + once.pending, sonraPuan: sonra.points + sonra.pending,
           onceToplam: once.total, sonraToplam: sonra.total, odul, kez };
});
console.log(`     üretilen: 0 · alınan hedef: ${halka.kez} · ödül: ${fmt(halka.odul)}`);
console.log(`     toplam kazanç  ${fmt(halka.onceToplam)} → ${fmt(halka.sonraToplam)}`);
console.log(`     prestij puanı  ${halka.oncePuan.toFixed(0)} → ${halka.sonraPuan.toFixed(0)}`);
ok(halka.kez <= 1, 'ödül yeni hedef açmıyor', `${halka.kez} hedef alındı`);
ok(halka.sonraPuan - halka.oncePuan < 1, 'ödül prestij puanı üretmiyor',
   `+${(halka.sonraPuan - halka.oncePuan).toFixed(0)} puan`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
