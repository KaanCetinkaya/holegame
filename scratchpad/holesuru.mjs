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
async function olc(lv, korunan, uzak = 0) {
  return pg.evaluate(([lvl, kor, UZAK]) => {
    window.fruitHoleProbe(lvl);
    window.fruitHoleStartLevel();
    // Tahta **oturana** kadar bekle. `settling` true iken delik kilitli:
    // sabit bir yön verilse bile hiç kıpırdamıyor. İlk ölçüm bunu
    // bilmeden yapıldı, delik 150 karenin hiçbirinde yerinden oynamadı,
    // ve açı hesabı kayan noktalı toz üzerinden %90 "geri dönüş" saydı.
    // İki kip de aynı çıktığı için sonuç inandırıcı bile göründü.
    let bekle = 0;
    while (window.fruitHoleWhere().settling && bekle++ < 2000) window.__step(1000 / 60);
    let hedef = null;
    const yol = [];
    const uzakliklar = [];
    const basYenen = window.fruitHoleWhere().eaten;
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
          // `UZAK`: hedefin en az bu kadar ötede olma şartı. Sıfırken
          // aracın bugünkü hâli — ve en kalabalık kova çoğu zaman
          // deliğin **durduğu** kova oluyor, çünkü delik parçaların
          // içinde. Uzaklık sıfıra yakınken `dx/d` yön değil gürültü
          // veriyor ve delik yerinde titriyor.
          if (UZAK > 0 && d < UZAK) continue;
          const puan = v.n / (1 + d / 12);
          if (!en || puan > en.puan) en = { puan, x: cx, z: cz };
        }
        if (en) hedef = { x: en.x, z: en.z };
      }
      if (onceki && hedef && Math.hypot(onceki.x - hedef.x, onceki.z - hedef.z) > 1.5) hedefDegisti++;
      if (!hedef) window.fruitHoleSteer(0, 0);
      else {
        const dx = hedef.x - w.x, dz = hedef.z - w.z;
        const d = Math.hypot(dx, dz);
        if (UZAK < 0 && d < 1 && window.__sonYon) {
          window.fruitHoleSteer(window.__sonYon[0], window.__sonYon[1]);
        } else if (d > 0) {
          window.__sonYon = [dx / d, dz / d];
          window.fruitHoleSteer(dx / d, dz / d);
        }
      }
      uzakliklar.push(hedef ? Math.hypot(hedef.x - w.x, hedef.z - w.z) : 0);
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
    // Kaç karede delik gerçekten yer değiştirdi? Bu sayı düşükse açı
    // ölçümü anlamsızdır ve rapor onu saklamamalı.
    let hareket = 0;
    for (let k = 1; k < yol.length; k++)
      if (Math.hypot(yol[k][0] - yol[k - 1][0], yol[k][1] - yol[k - 1][1]) > 1e-4) hareket++;
    return { ortDeg: ort * 180 / Math.PI,
             sert: donus.filter(d => d > Math.PI / 2).length,
             n: donus.length, hedefDegisti, hareket, kare: yol.length,
             ortUzak: uzakliklar.reduce((a, b) => a + b, 0) / (uzakliklar.length || 1),
             yenen: window.fruitHoleWhere().eaten - basYenen,
             // Kat edilen toplam yol: kenara dayanıp sabit yön süren bir
             // delik "düzgün" görünüyor ama hiçbir yere gitmiyor.
             mesafe: yol.reduce((a, _, k) => k ? a + Math.hypot(yol[k][0] - yol[k-1][0], yol[k][1] - yol[k-1][1]) : 0, 0) };
  }, [lv, korunan, uzak]);
}


// İki bölüm ve 150 kare: SwiftShader'da dört bölüm × 270 kare × iki kipi
// ölçmek konteynerde zaman aşımına uğruyor. Titreşim bir tarz sorunu,
// bölüm sayısıyla değişmiyor.
const LVL = [47, 50];
// Üç şey birlikte ölçülmeli, yoksa biri düzelirken öteki bozuluyor ve
// fark edilmiyor:
//   yön değişimi — titriyor mu
//   yenen        — delik parçaların içinde mi, yoksa boşlukta mı geziyor
//   mesafe       — gerçekten gidiyor mu, yoksa kenara mı dayanmış
const KIPLER = [
  ['bugünkü (taban yok)', 0],
  ['yön tutma (d<1)', -1],
  ['taban 1.5 birim', 1.5],
  ['taban 2 birim', 2],
  ['taban 3 birim', 3],
  ['taban 4 birim', 4],
];
console.log('\n  kip                     blm   yön/kare  geri dönüş   yenen   mesafe');
console.log('  ----------------------+-----+---------+-----------+-------+--------');
const sonuc = [];
for (const [ad, u] of KIPLER) {
  const satir = [];
  for (const lv of LVL) {
    const r = await olc(lv, u !== 0, u);
    satir.push(r);
    console.log(`  ${ad.padEnd(22)} ${String(lv).padStart(3)}   ` +
      `${r.ortDeg.toFixed(1).padStart(6)}°  ${('%' + Math.round(r.sert / r.n * 100)).padStart(9)}   ` +
      `${String(r.yenen).padStart(5)}   ${r.mesafe.toFixed(1).padStart(6)}`);
  }
  sonuc.push({ ad, u, ortDeg: (satir[0].ortDeg + satir[1].ortDeg) / 2,
    yenen: satir[0].yenen + satir[1].yenen, mesafe: satir[0].mesafe + satir[1].mesafe });
}

// Aranan: yön değişimi 25°'nin altında VE yenen parça bugünküne yakın.
const bugun = sonuc[0];
const iyi = sonuc.filter(x => x.u !== 0 && x.ortDeg < 25 && x.yenen >= bugun.yenen * 0.6);
console.log(`\n  bugünkü: ${bugun.ortDeg.toFixed(1)}° · ${bugun.yenen} parça`);
console.log(`  eşiği geçen kipler: ${iyi.length ? iyi.map(x => `${x.ad} (${x.ortDeg.toFixed(1)}°, ${x.yenen} parça)`).join(' · ') : 'yok'}`);
let fail = iyi.length ? 0 : 1;

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
