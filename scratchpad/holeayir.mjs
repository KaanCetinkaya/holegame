// Süre nereye gidiyor: tahtayı **kurmaya** mı, **çizmeye** mi?
//
// `holesure` altmış karenin duvar saatini ölçtü ve tuhaf çıktı: en yavaş
// tahtalar en az parçalı olanlardı (Patches 56 parça / 33 sn, Maze 343
// parça / 22,6 sn). İki kez sebep tahmin ettim, ikisi de tutmadı —
// `dropUnreachable`in BFS'i ve parça sayısı. Tahmini bırakıp ikiye
// ayırıyorum:
//
//   kurulum = fruitHoleProbe + fruitHoleStartLevel
//   çizim   = altmış kare
//
// Ayrımın önemi şu: çizimi telefondaki GPU hızlandırıyor, **kurulumu
// hızlandırmıyor**. Kurulum ağırsa oyuncu bölüme girerken bekliyor demektir
// ve bu konteynere özgü bir yavaşlık değil, gerçek bir kusur.
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
}).listen(8562);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
// Sahte saat yalnızca oyunun kendi zamanını donduruyor; Node tarafındaki
// `Date.now` ondan etkilenmiyor, yani duvar saati ölçümü geçerli.
await pg.addInitScript(() => {
  let t = 0; const q = [];
  window.__kareHata = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) cb(t); };
});
await pg.goto('http://localhost:8562/', { waitUntil: 'load', timeout: 120000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 120000 });

console.log('\n  blm  düzen          parça   kurulum   çizim   kurulum payı');
console.log('  ----+--------------+------+---------+--------+-------------');
const satir = [];
for (let lv = 1; lv <= 55; lv++) {
  const t0 = Date.now();
  const n = await pg.evaluate(l => {
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    return window.fruitHoleFruitSpots().length;
  }, lv);
  const kurulum = Date.now() - t0;

  const t1 = Date.now();
  await pg.evaluate(() => {
    window.__kareHata.length = 0;
    for (let i = 0; i < 60; i++) {
      const w = window.fruitHoleWhere();
      const nn = window.fruitHoleNearest();
      if (nn) {
        const dx = nn.x - w.x, dz = nn.z - w.z, d = Math.hypot(dx, dz) || 1;
        window.fruitHoleSteer(dx / d, dz / d);
      }
      window.__step(1000 / 30);
      if (window.__kareHata.length) break;
    }
  });
  const cizim = Date.now() - t1;

  const ad = await pg.evaluate(() => window.fruitHoleLevelName());
  const pay = kurulum / (kurulum + cizim);
  satir.push({ lv, ad, n, kurulum, cizim, pay });
  console.log(`  ${String(lv).padStart(3)}  ${ad.padEnd(12)}  ${String(n).padStart(4)}  ` +
    `${(kurulum / 1000).toFixed(1).padStart(6)}s  ${(cizim / 1000).toFixed(1).padStart(6)}s  ` +
    `${('%' + Math.round(pay * 100)).padStart(12)}`);
}

const ort = a => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`\n  ortalama kurulum  ${(ort(satir.map(s => s.kurulum)) / 1000).toFixed(1)}s`);
console.log(`  ortalama çizim    ${(ort(satir.map(s => s.cizim)) / 1000).toFixed(1)}s`);
console.log(`  kurulum payı      %${Math.round(ort(satir.map(s => s.pay)) * 100)}`);

// Eşik bir saniye: telefonda bölüme girerken bir saniyeden uzun bir
// duraklama fark ediliyor. Konteynerde GPU yok ama kurulum CPU işi, yani
// buradaki sayı telefondakine yakın olmalı.
const agir = satir.filter(s => s.kurulum > 1000).sort((a, b) => b.kurulum - a.kurulum);
console.log(`\n  kurulumu 1 saniyeyi geçen: ${agir.length} tahta`);
for (const s of agir.slice(0, 12)) {
  console.log(`  ${String(s.lv).padStart(3)}  ${s.ad.padEnd(12)}  ${s.n} parça  kurulum ${(s.kurulum / 1000).toFixed(1)}s`);
}
process.exitCode = agir.length ? 1 : 0;

await br.close(); srv.close();
