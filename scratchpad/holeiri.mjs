// Tahtalar iri parçayla tıkanmış mı?
//
// Oyuncunun ilk saniyelerde yapabileceği tek şey, deliğin o anki ağzından
// küçük parçaları yemek. Tahtanın tamamı iri parçaysa delik büyüyemiyor ve
// bölüm "başlamadan kilitli" hissediyor — Bloom'da tam bu oldu (%92 iri,
// %8 yenilebilir).
//
// İki şey ölçülüyor, 55 bölümün hepsinde:
//   iri payı      — oyunun kendi `big` bayrağını taşıyan parçaların oranı
//   başta açık    — başlangıç ağzından (büyüme yarıçapı × 0.92) küçük olan
//                   parçaların oranı, yani ilk hamlede yenilebilenler
//
// **İri olmak yarıçapla ölçülmez.** İlk hâli `r > 0.5` diyordu ve 46. bölümü
// "%53 iri" diye işaretledi. Oysa Ballcourt bir şerit tahtası: 99 parçası
// 0.52 yarıçaplı boncuk, `big: false`, ve 0.52 < 0.58 olduğu için hepsi
// başlangıçta yenilebiliyor. Tahtanın %93'ü açıkken "yarısı iri" demek,
// olmayan bir kusuru iki gün kovalamak demekti.
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
}).listen(8545);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8545/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

const o = await pg.evaluate(() => {
  const out = [];
  for (let lv = 1; lv <= 55; lv++) {
    const p = window.fruitHoleProbe(lv);
    window.fruitHoleStartLevel();
    const g = window.fruitHoleGrow();
    const sp = window.fruitHoleFruitSpots();
    if (!sp.length) continue;
    const agiz = g.r * 0.92;                 // yutma kuralı: r <= ağız
    out.push({
      lv, ad: window.fruitHoleLevelName(), kutupsal: !!p.polar, n: sp.length,
      agiz: +agiz.toFixed(2),
      iriPay: sp.filter(f => f.big).length / sp.length,
      devPay: sp.filter(f => f.giant).length / sp.length,
      acikPay: sp.filter(f => f.r <= agiz).length / sp.length,
    });
  }
  return out;
});

console.log('\n  blm  düzen          parça  ağız  iri %  dev %  başta açık %');
console.log('  ----+--------------+------+-----+------+------+-------------');
for (const x of o) {
  const bayrak = x.iriPay > 0.5 || x.acikPay < 0.2 ? '!' : ' ';
  console.log(`${bayrak} ${String(x.lv).padStart(4)}  ${x.ad.padEnd(12)}  ${String(x.n).padStart(5)}  ` +
    `${x.agiz.toFixed(2)}  ${('%' + Math.round(x.iriPay * 100)).padStart(5)}  ` +
    `${('%' + Math.round(x.devPay * 100)).padStart(5)}  ` +
    `${('%' + Math.round(x.acikPay * 100)).padStart(12)}`);
}

const ort = a => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`\n  ortalama iri payı        %${Math.round(ort(o.map(x => x.iriPay)) * 100)}`);
console.log(`  ortalama başta açık pay  %${Math.round(ort(o.map(x => x.acikPay)) * 100)}`);

// Eşikler Bloom düzeltmesinden sonra ölçülen aralığa göre: hiçbir tahta
// %50'den fazla iri değil ve hiçbirinde başta açık pay %20'nin altında
// değil. İkisi birlikte "ilk hamle var mı" sorusunu cevaplıyor.
const kotu = o.filter(x => x.iriPay > 0.5);
const kapali = o.filter(x => x.acikPay < 0.2);
console.log(`\n  iri payı %50 üstü: ${kotu.length} tahta` +
  (kotu.length ? ' — ' + kotu.map(x => `${x.lv} ${x.ad} %${Math.round(x.iriPay * 100)}`).join(' · ') : ''));
console.log(`  başta %20'den az açık: ${kapali.length} tahta` +
  (kapali.length ? ' — ' + kapali.map(x => `${x.lv} ${x.ad} %${Math.round(x.acikPay * 100)}`).join(' · ') : ''));
console.log(`  ${kotu.length || kapali.length ? 'FAIL' : 'OK  '} ${o.length} tahta ölçüldü`);
process.exitCode = (kotu.length || kapali.length) ? 1 : 0;

await br.close(); srv.close();
