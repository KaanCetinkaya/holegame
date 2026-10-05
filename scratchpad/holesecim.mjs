// Aynı bölüm, beş ayrı dizilim — Kaan hangisini istediğini seçsin.
//
// Tarif etmek zor çıktı: her turda bir özellik ölçülüp düzeltiliyor ve cevap
// yine "bu değil" oluyor. Seçenek göstermek, tarifi karşılaştırmaya çeviriyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const CIKTI = process.argv[2];
const LV = Number(process.argv[3] || 22);
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8518);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => {
  let t = 0; const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) cb(t); };
});
await pg.goto('http://localhost:8518/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });
const stiller = ['dolu', 'halka', 'sira', 'blok', 'sutun'];
let n = 0;
for (const st of stiller) {
  n++;
  const o = await pg.evaluate(([l, s, t]) => {
    window.fruitHoleForceLayout(s);
    window.fruitHoleSeedField(t + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 40; i++) window.__step(1000 / 30);
    const w = window.fruitHoleWhere();
    window.fruitHoleUnseedField();
    return { parca: w.total };
  }, [LV, st, 5500]);
  await pg.screenshot({ path: `${CIKTI}/secim-${n}-${st}.png`, timeout: 120000 });
  console.log(`  ${n}. ${st.padEnd(6)} — ${o.parca} parça`);
}
await pg.evaluate(() => window.fruitHoleForceLayout(null));
await br.close(); srv.close();
