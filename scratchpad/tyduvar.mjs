// Koşu ne zaman bitiyor, devir ne zaman açılıyor?
//
// Idle oyunun döngüsü şu: fabrika büyür, büyümesi yavaşlar, oyuncu
// devreder, daha hızlı yeniden başlar. Döngünün sağlıklı olması için
// **devir, yavaşlamadan önce** açılmalı. Sonra açılırsa aradaki süre
// ölü zaman: ekranda sayı artıyor ama yapacak hiçbir şey yok ve
// oyuncunun elinde bir düğme de yok. Kaan'ın 60. seviyede düştüğü yer
// tam olarak buydu.
//
// Ölçülen:
//   1. Koşu ne zaman yavaşlıyor (gelirin artışı dakikada %5'in altına
//      düştüğü an)
//   2. Devir ne zaman açılıyor (`canPrestige`)
//   3. İkisinin arasındaki ölü zaman
//   4. Aynı şey ikinci ve üçüncü koşuda da geçerli mi — devir eşiği
//      geçmiş kazançla büyüyor, yani her koşuda uzayabilir
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8619);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8619/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });
await pg.evaluate(() => { document.getElementById('dOk')?.click(); window.jeTutSkip(); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Oyuncu kuralı: ekranda yazan iki uyarıyı da takip ediyor — darboğaz,
// ve kademeyi bekleten istasyon. Yani oyunun kendi yönlendirmesi.
const kosular = await pg.evaluate(async () => {
  const AD = ['Foundry', 'Stamping', 'Assembly', 'Dispatch'];
  window.jeWipeProgress();
  window.jeTutSkip();
  window.jeAutoCarry(true);
  const out = [];
  for (let tur = 1; tur <= 3; tur++) {
    const dk = [];
    let devirDk = null;
    for (let sn = 1; sn <= 90 * 60; sn++) {
      window.jeRun(1);
      for (let i = 0; i < 4; i++) window.jeBuyManager(i);
      const p = window.jeProbe();
      const neck = AD.indexOf(p.neck);
      const tutan = window.jeTier().tutan.filter(i => i !== neck);
      if (tutan.length && sn % 2 === 0) window.jeBuy(tutan[0], 'max');
      else window.jeBuy(neck, 'max');
      if (devirDk === null && window.jeCanPrestige()) devirDk = sn / 60;
      if (sn % 60 === 0) dk.push(window.jeProbe().income);
    }
    // Yavaşlama: gelirin dakikalık artışı ilk kez %5'in altına düştüğü an.
    let yavasDk = null;
    for (let i = 1; i < dk.length; i++)
      if (yavasDk === null && dk[i] < dk[i - 1] * 1.05) yavasDk = i + 1;
    out.push({ tur, devirDk, yavasDk, hiz: dk, son: window.jeProbe() });
    window.jePrestige();
    for (let i = 0; i < 400; i++) window.jeResBuy('line');
  }
  return out;
});

const fmt = n => n >= 1000 ? n.toExponential(2) : n.toFixed(0);
console.log('\nKoşular (90 dakika, oyunun kendi yönlendirmesini takip eden oyuncu)');
for (const k of kosular) {
  console.log(`\n  ${k.tur}. koşu`);
  console.log(`    gelir dakika dakika: ${k.hiz.slice(0, 12).map(fmt).join(' ')} …`);
  console.log(`    yavaşlama  ${k.yavasDk === null ? 'olmadı' : k.yavasDk + '. dakika'}`);
  console.log(`    devir açıldı ${k.devirDk === null ? 'AÇILMADI' : k.devirDk.toFixed(1) + '. dakika'}`);
  if (k.yavasDk !== null && k.devirDk !== null)
    console.log(`    ölü zaman  ${(k.devirDk - k.yavasDk).toFixed(1)} dakika`);
}

console.log('\n1) Devir her koşuda açılıyor');
ok(kosular.every(k => k.devirDk !== null), 'üç koşuda da devir açıldı',
   kosular.map(k => k.devirDk === null ? 'yok' : k.devirDk.toFixed(1)).join(' · '));

console.log('\n2) Devir, yavaşlamadan önce açılıyor');
// Asıl soru bu. Devir yavaşlamadan sonra açılırsa aradaki süre ölü:
// oyuncu bekliyor, elinde yapacak bir şey yok.
for (const k of kosular) {
  if (k.yavasDk === null || k.devirDk === null) continue;
  const olu = k.devirDk - k.yavasDk;
  ok(olu <= 5, `${k.tur}. koşuda ölü zaman beş dakikanın altında`, `${olu.toFixed(1)} dk`);
}

console.log('\n3) Devir makul bir sürede geliyor');
// İlk koşu bir oturumdan uzun sürerse oyuncu devri hiç görmeden bırakır.
ok(kosular[0].devirDk !== null && kosular[0].devirDk <= 20,
   'ilk devir ilk yirmi dakikada', `${kosular[0].devirDk?.toFixed(1)} dk`);

console.log('\n4) Sonraki koşular uzamıyor');
// Devir eşiği geçmiş kazançla büyüyor. Her koşu bir öncekinden belirgin
// uzun sürerse oyun kendi kendini yavaşlatıyor demektir.
const sureler = kosular.map(k => k.devirDk).filter(d => d !== null);
console.log(`     devir süreleri: ${sureler.map(d => d.toFixed(1)).join(' → ')} dk`);
ok(sureler[sureler.length - 1] <= sureler[0] * 3 + 5,
   'üçüncü koşu birincinin üç katını geçmiyor',
   `${sureler[0].toFixed(1)} → ${sureler[sureler.length - 1].toFixed(1)}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
