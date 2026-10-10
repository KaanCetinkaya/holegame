// Şekil bir **kütle** mi yoksa bir **çizgi** mi?
//
// Kaan "etrafa saçıyorsun" diyor ve dolgu biçimlerini değiştirmek dört turdur
// cevap vermiyor. Şüphe: sorun dolgu değil siluet. Zone bir halka ve bandı
// iki hücre kalınlığında; iki hücrelik bir bandı nasıl doldurursan doldur
// ekranda dizilim değil serpinti okunuyor.
//
// Ölçü: dolu hücrelerin kaçının dört komşusu da dolu ("iç" hücre). Kalın bir
// kütlede bu oran yüksek, ince bir çizgide sıfıra yakın.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8520);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8520/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

console.log('\n  blm  düzen         dolu  iç payı');
const hepsi = [];
const gorulen = new Set();
for (let lv = 1; lv <= 110; lv++) {
  const o = await pg.evaluate(l => {
    // Siluetin kendisi ölçülüyor: dolgu biçimi kapalı.
    window.fruitHoleForceLayout('dolu');
    window.fruitHoleSeedField(5300 + l);
    const p = window.fruitHoleProbe(l);
    if (p.kind !== 'ızgara') { window.fruitHoleUnseedField(); return null; }
    window.fruitHoleStartLevel();
    const b = window.fruitHoleBoardCells();
    const dolu = new Set(b.hucre.filter(h => !h.bomb).map(h => h.r + ',' + h.c));
    let ic = 0;
    for (const k of dolu) {
      const [r, c] = k.split(',').map(Number);
      if (dolu.has((r-1)+','+c) && dolu.has((r+1)+','+c) &&
          dolu.has(r+','+(c-1)) && dolu.has(r+','+(c+1))) ic++;
    }
    const ad = window.fruitHoleLevelName();
    window.fruitHoleUnseedField();
    return { ad, dolu: dolu.size, ic };
  }, lv);
  if (!o || gorulen.has(o.ad)) continue;
  gorulen.add(o.ad);
  const pay = o.dolu ? o.ic / o.dolu : 0;
  hepsi.push({ ...o, pay });
}
hepsi.sort((a, b) => a.pay - b.pay);
for (const x of hepsi) {
  const bayrak = x.pay < 0.25 ? '  <-- çizgi' : x.pay > 0.55 ? '  (kütle)' : '';
  console.log(`  ${x.ad.padEnd(12)}  ${String(x.dolu).padStart(4)}  ${('%' + Math.round(x.pay * 100)).padStart(5)}${bayrak}`);
}
const ort = hepsi.reduce((a, x) => a + x.pay, 0) / hepsi.length;
console.log(`\nortalama iç payı  %${Math.round(ort * 100)}`);
console.log(`çizgi gibi (%25 altı)  ${hepsi.filter(x => x.pay < 0.25).length} / ${hepsi.length}`);
await br.close(); srv.close();
