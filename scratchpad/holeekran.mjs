// Oyuncunun **bir ekranda** gördüğü kadarında tahta neye benziyor?
//
// Kaan 107. bölümden (3. tur, Frontier · Horseshoe) ekran görüntüsü attı:
// "bu toplu dizilimleri değiştirmemiz gerekiyo, biraz daha şekilli dizmemiz
// gerekiyo". Tahtanın tamamı güzel bir nal — yay, çivi delikleri, kalın
// topuklar. Ama görüntüde nal yok: aynı meyveden dikine sütunlar var.
//
// Aradaki fark ölçülmemişti. Desenler 13x33'lük tahtanın tamamına çiziliyor,
// oyun kamerası ise onun bir parçasını gösteriyor. Bu betik üç şeyi sayıyor:
//   1. kamera kaç hücre görüyor
//   2. o pencerenin içinde kaç tür meyve var, en çoğunun payı ne
//   3. o pencerenin içinde kaç ayrı yığın yüksekliği var
//
// Üçü birden "ekranda bir şekil var mı" sorusunun ölçülebilir hâli: tek tür
// + tek yükseklik = doku; birkaç tür + birkaç yükseklik = şekil.
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
}).listen(8481);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8481/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });

const gor = await pg.evaluate(() => {
  window.fruitHoleProbe(107);
  window.fruitHoleStartLevel();
  return window.fruitHoleViewCells();
});
console.log(`\nkamera penceresi: ${gor.genisHucre} x ${gor.derinHucre} hücre`);
console.log(`tahta:            ${gor.tahtaGenis} x ${gor.tahtaDerin} hücre`);
console.log(`ekrana giren:     %${Math.round(gor.genisHucre * gor.derinHucre
  / (gor.tahtaGenis * gor.tahtaDerin) * 100)}\n`);

const W = Math.round(gor.genisHucre), D = Math.round(gor.derinHucre);

// Pencereyi tahtanın üstünde gezdirip her duruşta ne görüldüğünü sayıyor.
function pencereler(b, w, d) {
  const g = new Map();
  for (const h of b.hucre) g.set(h.r + ',' + h.c, h);
  const cikti = [];
  for (let r0 = 0; r0 + d <= b.rows; r0 += 2) {
    for (let c0 = 0; c0 + w <= b.cols; c0 += 2) {
      const icinde = [];
      for (let r = r0; r < r0 + d; r++) {
        for (let c = c0; c < c0 + w; c++) {
          const h = g.get(r + ',' + c);
          if (h && !h.prop && !h.bomb) icinde.push(h);
        }
      }
      if (icinde.length < 12) continue;
      const tur = {}, kat = {};
      for (const h of icinde) {
        tur[h.type] = (tur[h.type] || 0) + 1;
        kat[h.kat] = (kat[h.kat] || 0) + 1;
      }
      const tp = Object.values(tur).sort((a, b) => b - a);
      const kp = Object.values(kat).sort((a, b) => b - a);
      cikti.push({
        dolu: icinde.length,
        tur: tp.length,
        turPay: tp[0] / icinde.length,
        katSayi: kp.length,
        katPay: kp[0] / icinde.length,
        iri: icinde.filter(h => h.big).length / icinde.length,
      });
    }
  }
  return cikti;
}

const ort = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

console.log('  blm  düzen         ekranda tür  en çok tür  kat  en çok kat  iri');
console.log('  ----+-------------+------------+-----------+----+-----------+-----');
const hepsi = [];
const LV = [];
for (let i = 1; i <= 54; i++) LV.push(i);
for (const lv of LV) {
  const b = await pg.evaluate(async (l) => {
    window.fruitHoleSeedField(4200 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const ad = window.fruitHoleLevelName();
    const kind = window.fruitHoleProbe(l).kind;
    const o = window.fruitHoleBoardCells();
    window.fruitHoleUnseedField();
    return { ad, kind, ...o };
  }, lv);
  const p = pencereler(b, W, D);
  if (!p.length) { console.log(`  ${String(lv).padStart(3)}  ${b.ad.padEnd(12)}  — pencere sığmıyor`); continue; }
  const s = {
    lv, ad: b.ad, kind: b.kind,
    tur: ort(p.map(x => x.tur)), turPay: ort(p.map(x => x.turPay)),
    kat: ort(p.map(x => x.katSayi)), katPay: ort(p.map(x => x.katPay)),
    iri: ort(p.map(x => x.iri)),
  };
  hepsi.push(s);
  console.log(`  ${String(lv).padStart(3)}  ${b.ad.padEnd(12)}  ${s.tur.toFixed(2).padStart(10)}  ` +
    `${('%' + Math.round(s.turPay * 100)).padStart(9)}  ${s.kat.toFixed(2).padStart(3)}  ` +
    `${('%' + Math.round(s.katPay * 100)).padStart(9)}  ${('%' + Math.round(s.iri * 100)).padStart(4)}`);
}

// Eşik yalnızca ızgara tahtalarına uygulanıyor.
//
// Şerit tahtaları bilerek başka türlü: boş zeminin üstünde tek renk bir
// piramit duruyor ve yorumu "karışık renkli bir yığın piramit değil, yığın
// olur" diyor. O bir kusur değil, o tahtanın tarifi — testin onu kusur
// sayması, çalışan bir kuralı bozmak olurdu.
const izgara = hepsi.filter(x => x.kind === 'ızgara');
const kotu = izgara.filter(x => x.tur < 3 || x.turPay > 0.6);
console.log('\nekranda tek düzelik — ızgara tahtaları (tür < 3 ya da en çok tür > %60):');
for (const x of kotu.sort((a, b) => b.turPay - a.turPay)) {
  console.log(`  ${String(x.lv).padStart(3)}  ${x.ad.padEnd(12)}  ${x.tur.toFixed(1)} tür, en çok %${Math.round(x.turPay * 100)}`);
}
console.log(`  ${kotu.length ? 'FAIL' : 'OK  '} ${izgara.length - kotu.length} / ${izgara.length} ızgara tahtası tür bakımından geçti`);

// İkinci yarı: yükseklik.
//
// "Şekilli" olmanın iki ayağı var ve ilk ölçümde yalnızca biri eşiğe
// bağlandı. Tahtanın tamamı aynı renkse ekran tek renk bir kütle; tahtanın
// tamamı aynı yükseklikteyse ekran düz bir halı. İkincisi ölçülmüştü ama
// kimse eşik koymamıştı: Patches'te hücrelerin %95'i, Maze'de %89'u,
// Dial'da %90'ı aynı kat sayısında.
//
// Eşik %75: ölçülen otuz üç tahtanın ortalaması %50, yani çoğu zaten
// altında. Üstünde kalan, tek katlı bir zemine birkaç kule serpilmiş olan.
const duz = izgara.filter(x => x.katPay > 0.75);
console.log('\nekranda düzlük — en çok kat sayısı %75 üstü:');
for (const x of duz.sort((a, b) => b.katPay - a.katPay)) {
  console.log(`  ${String(x.lv).padStart(3)}  ${x.ad.padEnd(12)}  ${x.kat.toFixed(1)} ayrı kat, en çoğu %${Math.round(x.katPay * 100)}`);
}
console.log(`  ${duz.length ? 'FAIL' : 'OK  '} ${izgara.length - duz.length} / ${izgara.length} ızgara tahtası yükseklik bakımından geçti`);
process.exitCode = (kotu.length || duz.length) ? 1 : 0;

console.log('\nortalama:');
console.log(`  bir ekranda tür sayısı   ${ort(hepsi.map(x => x.tur)).toFixed(2)}`);
console.log(`  en çok türün payı        %${Math.round(ort(hepsi.map(x => x.turPay)) * 100)}`);
console.log(`  bir ekranda kat sayısı   ${ort(hepsi.map(x => x.kat)).toFixed(2)}`);
console.log(`  en çok katın payı        %${Math.round(ort(hepsi.map(x => x.katPay)) * 100)}`);
console.log(`  iri parça payı           %${Math.round(ort(hepsi.map(x => x.iri)) * 100)}`);

await br.close(); srv.close();
