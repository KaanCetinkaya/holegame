// Bölümler birbirinden farklı görünüyor mu?
//
// Bugün karışım bölümle sertleşmeye başladı: 30. bölüm 17'den ölçülebilir
// biçimde farklı **oynuyor** (`slicewall.mjs`: 4.4 demir → 9.2). Ama
// koridor her bölümde aynı mordu, yani oyuncunun ilerlediğini ilk hisseden
// yer — göz — hiçbir şey görmüyordu.
//
// Ölçülen:
//   1. Tema dört bölümde bir değişiyor, altı temadan sonra başa dönüyor
//   2. Değişen şey yalnızca bir isim değil: sis, koridorun ötesi ve ray
//      rengi gerçekten o temanın renkleri
//   3. 1. bölüm değişmedi — oyunun bilinen yüzü
//   4. Doku sızmıyor: her bölüm başında yeni bir gökyüzü üretiliyor ve
//      eskisi atılıyor. Atılmazsa bu, `sldon.mjs`'in aradığı türden
//      sessiz bir birikme olurdu.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8691);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8691/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 90000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Bölüm bölüm tema');
const tur = await pg.evaluate(() => {
  const out = [];
  for (let n = 1; n <= 28; n++) {
    window.sliceStart(n);
    const t = window.sliceTheme();
    out.push({ n, no: t.no, ad: t.ad, sis: t.sis, ray: t.ray, oteki: t.oteki, doku: t.doku });
  }
  return out;
});
for (const r of tur.filter(r => r.n <= 26 && (r.n - 1) % 4 === 0))
  console.log(`     bölüm ${String(r.n).padStart(2)} · ${r.ad.padEnd(14)} sis ${r.sis} · ray ${r.ray}`);
const sayi = await pg.evaluate(() => window.sliceTheme().sayi);
ok(tur.every(r => r.no === Math.floor((r.n - 1) / 4) % sayi),
   'tema dört bölümde bir değişiyor');
ok(new Set(tur.map(r => r.ad)).size === sayi, 'altı temanın hepsi çıkıyor',
   `${new Set(tur.map(r => r.ad)).size}/${sayi}`);
ok(tur[0].no === tur[24].no, 'yirmi dört bölümde başa dönüyor');

console.log('\n2) Renkler gerçekten değişiyor');
// Tema adının değişmesi yetmez: ekrandaki renk değişmemişse tema yoktur.
const sisler = new Set(tur.map(r => r.sis));
const raylar = new Set(tur.map(r => r.ray));
const otekiler = new Set(tur.map(r => r.oteki));
console.log(`     farklı sis ${sisler.size} · ray ${raylar.size} · öteki ${otekiler.size}`);
ok(sisler.size === sayi, 'her temanın kendi sisi var', `${sisler.size}/${sayi}`);
ok(raylar.size === sayi, 'her temanın kendi ray rengi var', `${raylar.size}/${sayi}`);
ok(otekiler.size === sayi, 'her temanın kendi zemini var', `${otekiler.size}/${sayi}`);

console.log('\n3) Birinci bölüm değişmedi');
// Oyunun bilinen yüzü. Mağaza görselleri ve klipler de bu paletten.
ok(tur[0].sis === '#6b4a7a' && tur[0].ray === '#7c5cff',
   'ilk tema eski palet', `${tur[0].sis} / ${tur[0].ray}`);

console.log('\n4) Doku sızmıyor');
// Elli bölüm açılışı: her biri yeni bir gökyüzü dokusu üretiyor.
const doku = await pg.evaluate(async () => {
  const bas = window.sliceTheme().doku;
  for (let k = 0; k < 50; k++) window.sliceStart(1 + (k % 28));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return { bas, son: window.sliceTheme().doku };
});
console.log(`     doku ${doku.bas} → ${doku.son} (50 bölüm açılışı)`);
ok(doku.son <= doku.bas + 2, 'elli açılışta doku birikmedi',
   `${doku.bas} → ${doku.son}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
