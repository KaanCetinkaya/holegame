// Devler görevinde ekran dışındaki deve ok çıkıyor mu?
//
//   node build-www.mjs && node scratchpad/holedevok.mjs
//
// Bu ok bir ölçümün sonucu. Devler görevi şüpheyle açılmıştı — Kaan sekiz
// devin birini alıp kaybetti — ama saat suçlu çıkmadı: bot dokuz koşunun
// dokuzunu da kazandı, 4 ile 22 saniye artırarak.
//
// Fark botun bildiğinde: `fruitHoleGiantList()` ona her devin yerini
// anında söylüyor. Oyuncuya söyleyen bir şey yok, ve tahtanın yarısı ekran
// dışında (13.7×35.7 birimlik tahta, 10.8×24 birimlik kadraj). Sekiz dev
// oraya dağıldığında geçen süre yemek değil **arama**, ve arama saatin
// hesabında hiç yok.
//
// Ölçülen dört şey:
//
//   1. Ok yalnızca devler görevinde çıkıyor — sıradan bir bölümde yok.
//   2. Dev ekran dışındayken çıkıyor.
//   3. Dev kadraja girince **kayboluyor**: görülen şeyi işaret etmiyor.
//   4. Ok her zaman ekranın içinde duruyor — kenara sabitlenmesinin anlamı
//      bu, ve dışarı taşan bir ok hiç olmamasıyla aynı şey.

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
}).listen(8355);

const FAKE_CLOCK = () => {
  let t = 0; const q = [];
  window.__yutulan = 0;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) { try { cb(t); } catch (e) { window.__yutulan++; } } };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const W = 412, H = 915;
const pg = await br.newPage({ viewport: { width: W, height: H } });
await pg.addInitScript(FAKE_CLOCK);
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8355/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleGiantArrow === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Görev bölümlerini oyunun kendi sırasından sor: elle yazılan bir numara,
// görev sırası değiştiğinde sessizce başka bir tahtayı ölçer.
const { devBlm, duzBlm } = await pg.evaluate(() => {
  let d = null, z = null;
  for (let l = 1; l <= 60; l++) {
    const p = window.fruitHoleProbe(l);
    if (!d && p.mission === 'giants') d = l;
    if (!z && !p.mission && p.kind === 'ızgara' && l > 20) z = l;
  }
  return { devBlm: d, duzBlm: z };
});
console.log(`devler görevi: bölüm ${devBlm} · görevsiz ızgara: bölüm ${duzBlm}`);

// 1. Görevsiz bölümde ok yok.
{
  const o = await pg.evaluate(async ([l, fps]) => {
    window.fruitHoleSeedField(5500 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 60; i++) window.__step(1000 / fps);
    const a = window.fruitHoleGiantArrow();
    window.fruitHoleUnseedField();
    return a;
  }, [duzBlm, 30]);
  console.log(`\ngörevsiz bölüm ${duzBlm} · görev ${o.gorev}`);
  check(!o.gorunur, `${duzBlm}: görevsiz bölümde ok yok`, String(o.gorunur));
}

// 2-4. Devler görevi.
{
  const o = await pg.evaluate(async ([l, fps, w, h]) => {
    window.fruitHoleSeedField(5500 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    // Açılış bitsin: kadraj oyunun kendi genişliğine insin.
    for (let i = 0; i < 60; i++) window.__step(1000 / fps);
    const uzak = window.fruitHoleGiantArrow();

    // Deliği en yakın devin üstüne sür ve ok sönüyor mu bak.
    const g = window.fruitHoleGiantList()[0] || null;
    let yakin = null;
    if (g) {
      window.fruitHoleHold(true);
      for (let i = 0; i < 400; i++) {
        const w2 = window.fruitHoleWhere();
        const dx = g.x - w2.x, dz = g.z - w2.z;
        const d = Math.hypot(dx, dz) || 1;
        if (d < 2) break;
        window.fruitHoleSteer(dx / d, dz / d);
        window.__step(1000 / fps);
      }
      window.fruitHoleHold(false);
      yakin = window.fruitHoleGiantArrow();
    }
    const say = window.fruitHoleGiants().count;
    window.fruitHoleUnseedField();
    return { uzak, yakin, say, yutulan: window.__yutulan };
  }, [devBlm, 30, W, H]);

  console.log(`\ndevler görevi ${devBlm} · ${o.say} dev`);
  console.log(`  uzaktayken: ${o.uzak.gorunur ? `ok ${o.uzak.x},${o.uzak.y}` : 'ok yok'}` +
    (o.uzak.kucuk ? ' (henüz yutulamaz)' : ''));
  console.log(`  yanındayken: ${o.yakin && o.yakin.gorunur ? `ok ${o.yakin.x},${o.yakin.y}` : 'ok yok'}`);

  check(o.uzak.gorunur, `${devBlm}: ekran dışındaki deve ok çıkıyor`, String(o.uzak.gorunur));
  // Ok ekranın içinde: dışarı taşan bir ok, hiç olmamasıyla aynı şey.
  if (o.uzak.gorunur) {
    const icinde = o.uzak.x >= 0 && o.uzak.x <= W && o.uzak.y >= 0 && o.uzak.y <= H;
    check(icinde, `${devBlm}: ok ekranın içinde duruyor`, `${o.uzak.x},${o.uzak.y} · ekran ${W}×${H}`);
  }
  check(o.yakin && !o.yakin.gorunur, `${devBlm}: dev kadraja girince ok sönüyor`,
    o.yakin ? String(o.yakin.gorunur) : 'ölçülemedi');
  check(!o.yutulan, `${devBlm}: kare içinde hata atılmıyor`, `${o.yutulan} yutulan`);
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
