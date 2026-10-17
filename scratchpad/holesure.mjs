// Hangi tahta ağır? — altmış karenin duvar saati süresi.
//
// `holeboot`'un oynama turu bölüm başına 25 saniye veriyor ve beş bölüm
// (13, 19, 29, 33, 43) o sınıra takıldı. Ama o turda ölçülen şey "bölüm
// bitmedi" değil: döngü zaten **altmış kare** sürüyor, bitirmeye
// çalışmıyor. Yani takılan şey oyun değil, altmış karenin çizilme süresi.
//
// İki şey birbirine karışıyordu:
//   - gerçekten donan bir tahta (hata)
//   - konteynerde yavaş çizilen bir tahta (hata değil, GPU yok)
//
// Bu betik ikisini ayırıyor: sınır yok, her bölümün altmış karesi
// ölçülüyor ve süre yazılıyor. Hepsi bitiyorsa donma yok; sıralama da
// hangi tahtanın pahalı olduğunu söylüyor.
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
}).listen(8519);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => {
  let t = 0; const q = [];
  window.__kareHata = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) cb(t); };
});
await pg.goto('http://localhost:8519/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

console.log('\n  blm  düzen           parça   süre    kare başı');
console.log('  ----+---------------+-------+-------+----------');
const satir = [];
for (let lv = 1; lv <= 55; lv++) {
  const t0 = Date.now();
  const o = await pg.evaluate(l => {
    window.__kareHata.length = 0;
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const parca = window.fruitHoleBoardCells().hucre.length;
    for (let i = 0; i < 60; i++) {
      const w = window.fruitHoleWhere();
      const n = window.fruitHoleNearest();
      if (n) {
        const dx = n.x - w.x, dz = n.z - w.z, d = Math.hypot(dx, dz) || 1;
        window.fruitHoleSteer(dx / d, dz / d);
      }
      window.__step(1000 / 30);
      if (window.__kareHata.length) break;
    }
    return { ad: window.fruitHoleLevelName(), parca, hata: window.__kareHata[0] || null };
  }, lv);
  const ms = Date.now() - t0;
  satir.push({ lv, ...o, ms });
  console.log(`  ${String(lv).padStart(3)}  ${o.ad.padEnd(13)}  ${String(o.parca).padStart(5)}  ` +
    `${(ms / 1000).toFixed(1).padStart(5)}s  ${String(Math.round(ms / 60)).padStart(5)} ms` +
    (o.hata ? `   HATA ${o.hata}` : ''));
}

const hatali = satir.filter(s => s.hata);
console.log(`\n  ${hatali.length ? 'FAIL' : 'OK  '} altmış kare her bölümde hatasız çizildi` +
  (hatali.length ? `   ${hatali.map(s => s.lv).join(', ')}` : ''));

const agir = [...satir].sort((a, b) => b.ms - a.ms).slice(0, 8);
console.log('\nen ağır sekiz tahta:');
for (const s of agir) {
  console.log(`  ${String(s.lv).padStart(3)}  ${s.ad.padEnd(13)}  ${s.parca} parça  ${(s.ms / 1000).toFixed(1)}s`);
}
const top = satir.reduce((a, s) => a + s.ms, 0);
console.log(`\n  toplam ${(top / 1000).toFixed(0)}s · bölüm başına ortalama ${(top / satir.length / 1000).toFixed(1)}s`);
process.exitCode = hatali.length ? 1 : 0;

await br.close(); srv.close();
