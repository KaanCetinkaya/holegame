// Ekranda yazan hız, kasaya giren parayla uyuşuyor mu?
//
// Kaan 110. seviyede ekranda `14.3K / s` gördü ve beş dakika bekledi; parası
// `1.90K`'da sabit kaldı. Sebep: ekran `chain().income` yazıyordu — zincirin
// **teorik** hızı, yani "bütün istasyonlar beslenseydi" hesabı. Müdürü
// olmayan bir fabrikada kimse kimseyi beslemiyor, yani o sayının bankayla
// hiçbir ilgisi yok.
//
// Bu, bu dosyada tekrar eden hata türünün aynısı: ekranda duran, kimsenin
// gerçekle karşılaştırmadığı bir sayı.
//
// Ölçülen:
//   1. müdürsüz, elle taşımadan bekleyen fabrikada ekran ~0 yazıyor mu
//      (teorik hız yüksekken)
//   2. müdürler alınınca ekran gerçek kazançla buluşuyor mu
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8573);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8573/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Müdürsüz, elle taşımadan bekleyen fabrika');
const bos = await pg.evaluate(() => {
  window.jeGive(1e12);
  // jeBuy(i, n): n verilmezse `bulk` undefined kalıyor ve seviyeler
  // NaN'a düşüyor — ilk koşuda tam bu oldu.
  for (let i = 0; i < 4; i++) window.jeBuy(i, 40);
  // İşçiyi avluya al: hiçbir şey taşımasın.
  window.jeTeleport(0, 8);
  window.jeMove(0, 0);
  const nakitOnce = window.jeProbe().cash;
  for (let i = 0; i < 300; i++) window.jeStep(0.05);     // 15 saniye
  const p = window.jeProbe();
  return { teorik: p.income, gosterilen: p.gosterilen, kazanc: p.cash - nakitOnce,
           mgr: p.mgr };
});
console.log(`     teorik hız ${bos.teorik} · ekranda ${bos.gosterilen} · 15 sn'de kazanılan ${bos.kazanc.toFixed(2)}`);
ok(bos.mgr.every(m => !m), 'müdür alınmadı');
ok(bos.teorik > 0, 'teorik hız sıfırdan büyük', `${bos.teorik}`);
ok(Math.abs(bos.kazanc) < 1, 'kasaya para girmedi', `${bos.kazanc.toFixed(2)}`);
ok(bos.gosterilen < bos.teorik * 0.02, 'ekran da ~0 yazıyor',
   `${bos.gosterilen} < ${(bos.teorik * 0.02).toFixed(2)}`);

console.log('\n2) Müdürler alınınca');
const dolu = await pg.evaluate(() => {
  window.jeGive(1e12);
  for (let i = 0; i < 4; i++) window.jeGiveManager(i);
  for (let i = 0; i < 200; i++) window.jeStep(0.05);     // oturması için
  const nakitOnce = window.jeProbe().cash;
  for (let i = 0; i < 200; i++) window.jeStep(0.05);     // 10 saniye
  const p = window.jeProbe();
  return { teorik: p.income, gosterilen: p.gosterilen, gercek: (p.cash - nakitOnce) / 10 };
});
console.log(`     teorik ${dolu.teorik} · ekranda ${dolu.gosterilen} · gerçek ${dolu.gercek.toFixed(2)}/s`);
ok(dolu.gercek > 0, 'kasaya para giriyor');
// Ekran gerçeğin %15'i içinde olsun: üstel ortalamanın gecikmesi var, ama
// yirmi kat sapma olmamalı — asıl yakalanmak istenen oydu.
const sapma = Math.abs(dolu.gosterilen - dolu.gercek) / Math.max(1, dolu.gercek);
ok(sapma < 0.15, 'ekran gerçekle uyuşuyor', `sapma %${(sapma * 100).toFixed(1)}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
