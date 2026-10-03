// Delik iki katı engelin arasına sıkışıp kalabiliyor mu?
//
//   node build-www.mjs && node scratchpad/holesikis.mjs
//
// Bu dosya **bir değişikliğin kendi riskini** ölçmek için yazıldı.
//
// Mancınığın kayadan bırakacağı pay `HOLE_MAX`tan (2.75 birim)
// `CATAPULT_READ_GAP`e (1.375) indirildi, çünkü o kuralın amacı yorumunda
// yazılı ve tamamen görsel: ikisi tek bir kütle gibi okunmasın. Yerleşme
// oranı ölçüldü ve beklendiği gibi çıktı (Drive-In'de %43'ten %100'e).
//
// Ama gevşetilen bir pay ikinci bir şey yapıyor: iki katı şey artık
// birbirine yakın durabiliyor, ve `pushOutOfRocks` her katı şeyden ayrı ayrı
// itiyor. Birbirine yakın iki iticinin arasındaki delik, A'dan itilince
// B'ye, B'den itilince A'ya girebilir — yani yerinde titreyip **hiçbir yöne
// gidemeyebilir.**
//
// Bu, ulaşılabilirlik taramasının göremediği bir şey. O tarama "oraya
// varılır mı" diye soruyor ve cevabı "evet, dolaşarak" — sıkışma oraya
// varıldıktan sonra, çıkarken oluyor. `holekural` geçerken bu bozulabilir.
//
// Ölçü şöyle: tahtadaki en yakın kaya-mancınık çifti bulunuyor, delik
// ikisinin tam ortasına konuyor, ve sekiz yöne ayrı ayrı sürülüyor. Delik
// o noktadan **kaçabiliyorsa** sıkışma yok. Delik en büyük hâlinde
// deneniyor, çünkü sıkışmanın olacağı yer orası.

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
}).listen(8349);

const FAKE_CLOCK = () => {
  let t = 0;
  const queue = [];
  window.__yutulan = 0;
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => {
    t += ms;
    for (const cb of queue.splice(0, queue.length)) { try { cb(t); } catch (e) { window.__yutulan++; } }
  };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
await pg.addInitScript(FAKE_CLOCK);
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8349/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHolePushTest === 'function', { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

// Mancınığı olan ızgara bölümleri, oyunun kendi sırasından sorulacak.
const BLM = await pg.evaluate(() => {
  const ilk = window.fruitHoleCatapults().ilkBolum;
  const out = [];
  for (let l = ilk; l <= 48 && out.length < 8; l++) {
    const p = window.fruitHoleProbe(l);
    if (p.kind !== 'ızgara' || p.mission) continue;
    window.fruitHoleStartLevel();
    if (window.fruitHoleCatapults().sayi && window.fruitHoleRocks &&
        (window.fruitHoleRocks().yerler || []).length) out.push(l);
  }
  return out;
});

console.log('\ndeliğin en yakın kaya-mancınık çiftinin arasından kaçması');
console.log('\n  blm  yüzey arası  kaçabilen yön  en çok kaçış');
console.log('  ----+------------+---------------+-------------');

const YON = [[1,0],[-1,0],[0,1],[0,-1],[0.707,0.707],[-0.707,0.707],[0.707,-0.707],[-0.707,-0.707]];

for (const lv of BLM) {
  const o = await pg.evaluate(async ([l, yonler]) => {
    window.fruitHoleSeedField(9100 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 30; i++) window.__step(1000 / 30);
    const kayalar = window.fruitHoleRocks().yerler || [];
    const mancinik = window.fruitHoleCatapults().yerler || [];
    // En yakın kaya-mancınık çifti: sıkışmanın olabileceği tek yer.
    let en = null, ed = Infinity;
    for (const k of kayalar) for (const c of mancinik) {
      const d = Math.hypot(k.x - c.x, k.z - c.z) - (k.r || 0.62) - c.r;
      if (d < ed) { ed = d; en = { k, c }; }
    }
    if (!en) return null;
    const orta = { x: (en.k.x + en.c.x) / 2, z: (en.k.z + en.c.z) / 2 };
    // Delik en büyük hâlinde: sıkışma ancak orada olur.
    const R = window.fruitHoleProbe(l).holeMax;
    window.fruitHoleStartLevel();
    for (let i = 0; i < 30; i++) window.__step(1000 / 30);
    let kacan = 0, enCok = 0;
    for (const [dx, dz] of yonler) {
      // Her yön için baştan: delik ortaya konuyor, en büyük boyda.
      window.fruitHoleSetSize(R);
      window.fruitHolePushTest(orta.x, orta.z, R);
      const bas = window.fruitHoleWhere();
      window.fruitHoleHold(true);
      for (let i = 0; i < 90; i++) { window.fruitHoleSteer(dx, dz); window.__step(1000 / 30); }
      window.fruitHoleHold(false);
      const son = window.fruitHoleWhere();
      const gitti = Math.hypot(son.x - bas.x, son.z - bas.z);
      if (gitti > R) kacan++;
      if (gitti > enCok) enCok = gitti;
    }
    window.fruitHoleUnseedField();
    return { yuzey: +ed.toFixed(2), kacan, enCok: +enCok.toFixed(2), R: +R.toFixed(2),
             yutulan: window.__yutulan };
  }, [lv, YON]);
  if (!o) { console.log(`  ${String(lv).padStart(3)}  (kaya ya da mancınık yok)`); continue; }
  console.log(`  ${String(lv).padStart(3)} ${String(o.yuzey).padStart(12)} ` +
    `${String(o.kacan + '/8').padStart(15)} ${String(o.enCok).padStart(13)}`);
  // Sekiz yönün hepsinden kaçmak gerekmiyor: iki katı şeyin arasındaki
  // delik elbette ikisinin içine doğru gidemiyor. Gereken şey **bir çıkış
  // olması** — ve üç yön, "ortadaki koridor boyunca iki yana, artı bir
  // çapraz" demek, yani gerçek bir çıkış.
  check(o.kacan >= 3, `${lv}: delik çiftin arasından kaçabiliyor`,
    `${o.kacan}/8 yön · en çok ${o.enCok} birim · yüzey arası ${o.yuzey}`);
  check(!o.yutulan, `${lv}: kare içinde hata atılmıyor`, `${o.yutulan} yutulan`);
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
