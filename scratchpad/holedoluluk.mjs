// Ekranda ne kadar boş zemin var?
//
// Kaan 95. bölümden kare attı: baştan aşağı meyve, bir karış boş zemin yok,
// ve "birbirine yapışık yapıyorsun, hızlıca küçükleri yiyorum, bitiyor"
// diyor. Rakiplerin karelerinde aralarda hep zemin görünüyor — dizilim
// dediği şey tam olarak o boşluk.
//
// Ölçü: kameranın gördüğü pencere içinde kaç hücre dolu. %100 = halı.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8512);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8512/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

const gor = await pg.evaluate(() => {
  window.fruitHoleProbe(22); window.fruitHoleStartLevel();
  return window.fruitHoleViewCells();
});
const W = Math.round(gor.genisHucre), D = Math.round(gor.derinHucre);
console.log(`\nkamera penceresi ${W} x ${D} hücre\n`);
console.log('  blm  düzen         en dolu  ort   taban(en/ort)  ekran(en/ort)');
const hepsi = [];
// İki tur birden: ilk turda gizli tahtanın (resim, şerit, bulmaca) altında
// kalan düzenler ikinci turda ızgaraya çıkıyor ve orada hiç ölçülmemiş
// oluyorlar. Kaan'ın 95. bölümden attığı kare tam öyle bir tahta — Lattice,
// ilk turda 6. bölüm, yani şerit.
const gorulen = new Set();
for (let lv = 1; lv <= 110; lv++) {
  const o = await pg.evaluate(([l, w, d]) => {
    window.fruitHoleSeedField(5300 + l);
    const p = window.fruitHoleProbe(l);
    if (p.kind !== 'ızgara') { window.fruitHoleUnseedField(); return null; }
    window.fruitHoleStartLevel();
    const b = window.fruitHoleBoardCells();
    const dolu = new Set(b.hucre.filter(h => !h.bomb).map(h => h.r + ',' + h.c));
    const hucreler = new Map(b.hucre.filter(h => !h.bomb).map(h => [h.r + ',' + h.c, h]));
    const paylar = [], kaplama = [], ekran = [];
    for (let r0 = 0; r0 + d <= b.rows; r0 += 2) {
      for (let c0 = 0; c0 + w <= b.cols; c0 += 2) {
        let n = 0, alan = 0, siluet = 0;
        for (let r = r0; r < r0 + d; r++) for (let c = c0; c < c0 + w; c++) {
          const h = hucreler.get(r + ',' + c);
          if (!h) continue;
          n++;
          // Parçanın zeminde kapladığı daire. Hücre 1.05x1.05 = 1.10 birim
          // kare; 0.46'lık bir parça 0.66 (hücrenin %60'ı), 0.72'lik 1.63
          // (%148) kaplıyor — yani hücrelerin üçte biri dolu olsa bile zemin
          // görünmeyebiliyor. "Kaç hücre dolu" ile "ne kadar zemin görünüyor"
          // ayrı sorular ve Kaan'ın gördüğü ikincisi.
          alan += Math.PI * h.yari * h.yari;
          // Ekranda kapladığı yer tabanı değil **silueti**: kamera eğik
          // (yükseklik açısı ~63°), yani k katlı bir yığının tepesi ekranda
          // arkasındaki zemini örtüyor. Bir kat 2.05 yarıçap yükseliyor ve
          // o yükseklik ekranda sin(63°) = 0.89 oranında yere yansıyor.
          // Beş katlı 0.46'lık bir yığın 4.2 birim ekran boyu kaplıyor —
          // hücre 1.05, yani tek bir yığın dört hücrelik zemini saklıyor.
          const boy = 2 * h.yari + (h.kat - 1) * h.yari * 2.05 * 0.89;
          siluet += 2 * h.yari * boy;
        }
        paylar.push(n / (w * d));
        kaplama.push(Math.min(1, alan / (w * d * b.cell * b.cell)));
        ekran.push(Math.min(1, siluet / (w * d * b.cell * b.cell)));
      }
    }
    const ad = window.fruitHoleLevelName();
    window.fruitHoleUnseedField();
    if (!paylar.length) return null;
    return { ad, en: Math.max(...paylar), ort: paylar.reduce((a, b) => a + b, 0) / paylar.length,
             kapEn: Math.max(...kaplama), kapOrt: kaplama.reduce((a, b) => a + b, 0) / kaplama.length,
             ekEn: Math.max(...ekran), ekOrt: ekran.reduce((a, b) => a + b, 0) / ekran.length };
  }, [lv, W, D]);
  if (!o) continue;
  if (gorulen.has(o.ad)) continue;
  gorulen.add(o.ad);
  hepsi.push(o);
  const bayrak = o.ekEn > 0.9 ? '  <-- zemin görünmüyor' : '';
  console.log(`  ${String(lv).padStart(3)}  ${o.ad.padEnd(12)}  ${('%' + Math.round(o.en * 100)).padStart(13)}  ${('%' + Math.round(o.ort * 100)).padStart(8)}  ${('%' + Math.round(o.kapEn * 100)).padStart(6)}  ${('%' + Math.round(o.kapOrt * 100)).padStart(6)}  ${('%' + Math.round(o.ekEn * 100)).padStart(6)}  ${('%' + Math.round(o.ekOrt * 100)).padStart(6)}${bayrak}`);
}
const ort = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\nortalama en dolu pencere  %${Math.round(ort(hepsi.map(x => x.en)) * 100)}`);
console.log(`ortalama doluluk          %${Math.round(ort(hepsi.map(x => x.ort)) * 100)}`);
console.log(`ortalama kaplama (en)     %${Math.round(ort(hepsi.map(x => x.kapEn)) * 100)}`);
console.log(`ortalama kaplama          %${Math.round(ort(hepsi.map(x => x.kapOrt)) * 100)}`);
console.log(`ekran siluet (en)         %${Math.round(ort(hepsi.map(x => x.ekEn)) * 100)}`);
console.log(`ekran siluet              %${Math.round(ort(hepsi.map(x => x.ekOrt)) * 100)}`);
console.log(`zemini görünmeyen tahta   ${hepsi.filter(x => x.ekEn > 0.9).length} / ${hepsi.length}`);
await br.close(); srv.close();
