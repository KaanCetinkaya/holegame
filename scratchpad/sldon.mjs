// Oyun uzun oynandıkça yavaşlıyor mu?
//
// Kaan telefonda "bazen donuyor gibi" dedi. En olası sebep oyunun kendi
// tarifinde yazılı: kesilen her şey **gerçekten** ikiye ayrılıyor, yani her
// kesim yeni geometri üretiyor. Yarılar temizlenmiyorsa sahne büyümeye
// devam eder ve kare süresi uzar — donma diye hissedilen şey budur.
//
// Ölçülen üç şey, bölüm bölüm:
//   kare    — ortalama ve en kötü kare süresi
//   geo     — WebGL'de duran geometri sayısı (renderer.info.memory)
//   cagri   — kare başına çizim çağrısı
//
// Hepsi **artıyorsa** sızıntı var. Sabit kalıyorsa donma başka bir şey ve
// bunu buradan bulamayız — o zaman telefonda bakmak gerekir.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8566);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8566/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 30000 });

// Çizici bilgisi oyunun içinden okunuyor. `sliceScene` yoksa sahneyi
// gezerek sayıyoruz — ölçüm için oyuna kanca eklemek gerekmesin.
const bilgi = () => pg.evaluate(() => window.sliceCost());

console.log('\n  blm  kesilen  ort kare  en kötü  geometri  çizim  nesne');
console.log('  ----+--------+---------+--------+---------+------+------');

const satir = [];
for (const lvl of [1, 3, 5, 7, 9, 11, 13, 15]) {
  await pg.evaluate(n => window.sliceStart(n), lvl);
  await pg.waitForTimeout(300);
  const sureler = [];
  let adim = 0;
  while (adim++ < 400) {
    const t0 = Date.now();
    await pg.evaluate(() => window.sliceAutoPlay());
    await pg.waitForTimeout(16);
    sureler.push(Date.now() - t0);
    const p = await pg.evaluate(() => window.sliceProbe());
    if (p.state !== 'playing') break;
  }
  const p = await pg.evaluate(() => window.sliceProbe());
  const b = await bilgi();
  const ort = sureler.reduce((a, x) => a + x, 0) / sureler.length;
  const kotu = Math.max(...sureler);
  satir.push({ lvl, cut: p.cut, ort, kotu, ...b });
  console.log(`  ${String(lvl).padStart(3)}  ${String(p.cut).padStart(6)}  ` +
    `${ort.toFixed(0).padStart(6)}ms  ${String(kotu).padStart(5)}ms  ` +
    `${String(b.geo ?? '—').padStart(8)}  ${String(b.cagri ?? '—').padStart(5)}  ${String(b.nesne ?? '—').padStart(5)}`);
}

const ilk = satir[0], son = satir[satir.length - 1];
console.log('\nilk bölüm → son bölüm:');
console.log(`  ortalama kare  ${ilk.ort.toFixed(0)}ms → ${son.ort.toFixed(0)}ms`);
console.log(`  geometri       ${ilk.geo} → ${son.geo}`);
console.log(`  sahne nesnesi  ${ilk.nesne} → ${son.nesne}`);

// Sahne nesnesinin artması sızıntı **değil**.
//
// `buildCourse` koridora bölümle birlikte daha çok şey koyuyor
// (`slots = min(24 + n*2, 48)`): 1. bölümde 26 yuva, 15'te 48. Yani nesne
// sayısı tasarım gereği büyüyor ve onu kusur saymak çalışan bir kuralı
// bozmak olurdu. İlk ölçümde öyle sayıldı ve yanlıştı.
//
// Sızıntının işareti **geometri**: kesilen her yarım kendi kesik yüzünü
// kuruyor ve temizlenmezse GPU'da birikiyor. Düzeltmeden önce 69 → 496
// çıkıyordu; şimdi 23 → 36.
//
// Eşik kesim başına: sekiz bölümde ~230 kesim yapılıyor, yani sızıntı
// varken geometri kesim sayısıyla birlikte artar. Kesim başına 0.5'ten
// fazla geometri birikmişse sızıntı geri gelmiş demektir.
const toplamKesim = satir.reduce((a, s) => a + s.cut, 0);
const birikme = (son.geo - ilk.geo) / Math.max(1, toplamKesim);
console.log(`\n  ${toplamKesim} kesimde ${son.geo - ilk.geo} geometri birikti ` +
  `(kesim başına ${birikme.toFixed(3)})`);
const sizinti = birikme > 0.5;
console.log(`  ${sizinti ? 'FAIL kesilen yarımlar bellekten çıkmıyor' : 'OK   yarımlar temizleniyor'}`);
process.exitCode = sizinti ? 1 : 0;

await br.close(); srv.close();
