// Klip aracının sürüşü düzgün mü, titriyor mu?
//
// Kaan kliplere bakıp "delik cin çarpmış gibi titreşiyor" dedi. Videodan
// ölçmek yanıltıcı: takipçi en koyu bölgeyi arıyor ve gölgelerle delik
// arasında zıplayabiliyor. Burada yol **oyunun kendisinden** okunuyor.
//
// Şüphe `make-clips.mjs`'in sürüş döngüsünde: hedef `let hedef` ile
// **her karede** yeniden seçiliyor. Hedef, parçaların en kalabalık 3
// birimlik kovası; delik yedikçe kova sayıları değişiyor ve puanı
// birbirine yakın iki kova sırayla öne geçiyorsa delik her karede ters
// yöne dönüyor.
//
// Ölçülen: kare kare yön değişimi, ve 90 dereceden büyük geri dönüşlerin
// oranı. Düzgün bir sürüşte geri dönüş neredeyse hiç olmamalı.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8584);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8584/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });
await pg.waitForFunction(() => !!window.fruitHoleWhere, { timeout: 60000 });

// Sahte saat: klip aracı da böyle sürüyor, yani ölçülen şey aracın
// gerçekte ürettiği hareket.
await pg.evaluate(() => {
  let t = performance.now();
  const asil = window.requestAnimationFrame;
  window.__cbs = [];
  window.requestAnimationFrame = cb => { window.__cbs.push(cb); return 1; };
  const gercek = performance.now.bind(performance);
  performance.now = () => t;
  window.__step = ms => { t += ms; const c = window.__cbs; window.__cbs = []; for (const f of c) f(t); };
  window.__gercekNow = gercek;
  void asil;
});

const DT = 1000 / 60;

// `make-clips.mjs`'teki sürüş, birebir — ama 270 karenin tamamı **sayfanın
// içinde** dönüyor. İlk hâli her kare için ayrı bir `pg.evaluate` yapıyordu:
// 2160 gidiş-dönüş, ve ölçüm zaman aşımına uğradı.
async function olc(lv, korunan) {
  return pg.evaluate(([lvl, kor]) => {
    window.fruitHoleProbe(lvl);
    window.fruitHoleStartLevel();
    for (let i = 0; i < 30; i++) window.__step(1000 / 60);
    let hedef = null;
    const yol = [];
    let hedefDegisti = 0;
    for (let f = 0; f < 150; f++) {
      const w = window.fruitHoleWhere();
      const onceki = hedef;
      // `kor` false ise hedef her karede sıfırlanıyor — aracın bugünkü hâli.
      if (!kor) hedef = null;
      if (hedef && Math.hypot(hedef.x - w.x, hedef.z - w.z) < 2.5) hedef = null;
      if (!hedef) {
        const p = window.fruitHoleFruitSpots();
        const kova = new Map();
        for (const q of p) {
          const k = Math.round(q.x / 3) + ',' + Math.round(q.z / 3);
          const v = kova.get(k);
          if (v) { v.n++; v.x += q.x; v.z += q.z; }
          else kova.set(k, { n: 1, x: q.x, z: q.z });
        }
        let en = null;
        for (const v of kova.values()) {
          const cx = v.x / v.n, cz = v.z / v.n;
          const d = Math.hypot(cx - w.x, cz - w.z);
          const puan = v.n / (1 + d / 12);
          if (!en || puan > en.puan) en = { puan, x: cx, z: cz };
        }
        if (en) hedef = { x: en.x, z: en.z };
      }
      if (onceki && hedef && Math.hypot(onceki.x - hedef.x, onceki.z - hedef.z) > 1.5) hedefDegisti++;
      if (!hedef) window.fruitHoleSteer(0, 0);
      else {
        const dx = hedef.x - w.x, dz = hedef.z - w.z;
        const d = Math.hypot(dx, dz) || 1;
        window.fruitHoleSteer(dx / d, dz / d);
      }
      window.__step(1000 / 60);
      const u = window.fruitHoleWhere();
      yol.push([u.x, u.z]);
    }
    const donus = [];
    for (let k = 2; k < yol.length; k++) {
      const dx = yol[k][0] - yol[k - 1][0], dz = yol[k][1] - yol[k - 1][1];
      const px = yol[k - 1][0] - yol[k - 2][0], pz = yol[k - 1][1] - yol[k - 2][1];
      if (Math.hypot(dx, dz) < 1e-4 || Math.hypot(px, pz) < 1e-4) continue;
      let d = Math.abs(Math.atan2(dz, dx) - Math.atan2(pz, px));
      if (d > Math.PI) d = 2 * Math.PI - d;
      donus.push(d);
    }
    const ort = donus.reduce((x, y) => x + y, 0) / (donus.length || 1);
    return { ortDeg: ort * 180 / Math.PI,
             sert: donus.filter(d => d > Math.PI / 2).length,
             n: donus.length, hedefDegisti };
  }, [lv, korunan]);
}

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// İki bölüm ve 150 kare: SwiftShader'da dört bölüm × 270 kare × iki kipi
// ölçmek konteynerde zaman aşımına uğruyor. Titreşim bir tarz sorunu,
// bölüm sayısıyla değişmiyor.
const LVL = [47, 50];
console.log('\n  blm  hedef her karede yeniden seçiliyor (bugünkü hâli)');
console.log('  ----+-------------------------------------------------');
const eski = [];
for (const lv of LVL) {
  const r = await olc(lv, false);
  eski.push(r);
  console.log(`  ${String(lv).padStart(3)}   ort yön değişimi ${r.ortDeg.toFixed(1)}° · ` +
    `90°+ geri dönüş ${r.sert}/${r.n} (%${Math.round(r.sert / r.n * 100)}) · ` +
    `hedef ${r.hedefDegisti} kez değişti`);
}

console.log('\n  blm  hedef varılana kadar korunuyor');
console.log('  ----+-------------------------------------------------');
const yeni = [];
for (const lv of LVL) {
  const r = await olc(lv, true);
  yeni.push(r);
  console.log(`  ${String(lv).padStart(3)}   ort yön değişimi ${r.ortDeg.toFixed(1)}° · ` +
    `90°+ geri dönüş ${r.sert}/${r.n} (%${Math.round(r.sert / r.n * 100)}) · ` +
    `hedef ${r.hedefDegisti} kez değişti`);
}

const pay = a => a.reduce((s, r) => s + r.sert, 0) / a.reduce((s, r) => s + r.n, 0);
console.log(`\n  geri dönüş payı: %${Math.round(pay(eski) * 100)} → %${Math.round(pay(yeni) * 100)}`);
ok(pay(yeni) < 0.05, 'hedef korununca geri dönüş kalmıyor', `%${Math.round(pay(yeni) * 100)}`);
ok(pay(eski) > pay(yeni) * 3, 'bugünkü hâli belirgin şekilde kötü');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
