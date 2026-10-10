// Büyümek bir kapı mı, yoksa ekranda bir sayı mı?
//
// Delik 0.55'ten 2.75'e büyüyor. Soru şu: bu büyüme tahtanın **kilidini
// açıyor mu**? Bir parça `r <= delik * 0.92` ise yutuluyor, yani her boy
// kendi ağzını istiyor:
//
//   sıradan 0.46 -> 0.50 ağız      kule   1.05 -> 1.14
//   büyük   0.72 -> 0.78 ağız      dev    1.34 -> 1.46
//                                  kolos  1.85 -> 2.01
//
// Oyun 0.55 ile başlıyor. Yani sıradan parça baştan açık. Geri kalanı ne
// zaman açılıyor? Bu betik tahtayı gerçekten yiyor ve her adımda iki şeyi
// yazıyor: delik ne kadar, ve kalan parçaların yüzde kaçı o anda yutulabilir.
//
// Aranan şey: tahtanın **görünür bir kısmı** bir süre kapalı kalmalı.
// Hepsi baştan açıksa büyümek bir karar değil, bir sayaç.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8502);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
// Sahte saat: tahtayı gerçek sürede yemek konteynerde dakikalar sürüyor.
await pg.addInitScript(() => {
  let t = 0; const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) cb(t); };
});
await pg.goto('http://localhost:8502/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

const BOLUMLER = [1, 7, 12, 14, 20, 22, 27, 29, 30, 41, 50, 54];

console.log('\nTahtanın yüzde kaçı o anda yutulabilir — yenen parçaya göre');
console.log('  blm  düzen         başta  %25   %50   %75  bitiş  delik');
console.log('  ----+-------------+------+-----+-----+-----+------+---------');

const ort = { bas: 0, c25: 0, c50: 0, c75: 0, n: 0 };
for (const lv of BOLUMLER) {
  const o = await pg.evaluate((l) => {
    window.fruitHoleSeedField(8800 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const k = window.fruitHoleGateCurve();
    const ad = window.fruitHoleLevelName();
    window.fruitHoleUnseedField();
    return { ad, ...k };
  }, lv);
  const y = v => (v == null ? '  — ' : ('%' + Math.round(v * 100)).padStart(4));
  console.log(`  ${String(lv).padStart(3)}  ${o.ad.padEnd(12)}  ${y(o.bas)}  ${y(o.c25)}  ${y(o.c50)}  ${y(o.c75)}  ${y(o.son)}  ${o.basR} → ${o.sonR}` +
    (o.tikandi ? '   TIKANDI' : ''));
  ort.bas += o.bas; ort.c25 += o.c25 ?? 1; ort.c50 += o.c50 ?? 1; ort.c75 += o.c75 ?? 1; ort.n++;
}

console.log('\nortalama tahtanın açık payı:');
console.log(`  başta       %${Math.round(ort.bas / ort.n * 100)}`);
console.log(`  %25 yenince %${Math.round(ort.c25 / ort.n * 100)}`);
console.log(`  %50 yenince %${Math.round(ort.c50 / ort.n * 100)}`);
console.log(`  %75 yenince %${Math.round(ort.c75 / ort.n * 100)}`);

await br.close(); srv.close();
