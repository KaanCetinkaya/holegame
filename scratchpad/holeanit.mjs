// Anıt yutulabiliyor mu, yoksa dekor mu?
//
// Klip çekerken dört ayrı bölümde aynı satır düştü: "dev çok büyük
// (1.82-2.27 > 1.6)". Oradaki 1.6 klibin kendi eşiği, ama altındaki soru
// oyunu ilgilendiriyor — **delik o şeye hiç yetişebiliyor mu?**
//
// Yutma kuralı: `r <= delik * 0.92`. Yani 2.0 yarıçaplı bir anıt 2.17
// ağız istiyor ve en geniş ağız 2.75. Kâğıt üstünde yetiyor. Soru, o
// boya **bu tahtada** ulaşılıp ulaşılamadığı.
//
// Ölçü bir üst sınır: tahtadaki her parça yense delik ne kadar olurdu.
//   erisilir = min(HOLE_MAX, baslangic + tahtanın verebileceği büyüme)
// Anıtların kendi katkısı düşülüyor — onları yemeden önceki boy aranıyor,
// ve bir anıtı yemek için ondan önce yeterince büyümüş olmak gerekiyor.
//
// Üst sınır bile yetmiyorsa anıt o bölümde **kesinlikle** yutulamaz. Üst
// sınır yetiyorsa "yetişilebilir" demek değil, yalnızca "imkânsız değil" —
// oyuncu tahtanın tamamını süpürmüyor ve saat var.
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
}).listen(8543);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8543/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

console.log('\n  blm  düzen          anıt  gereken  erişilir  pay   durum');
console.log('  ----+--------------+-----+--------+---------+-----+--------');

const satir = [];
for (let lv = 18; lv <= 110; lv++) {
  const o = await pg.evaluate(l => {
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    const a = window.fruitHoleLandmarks();
    const g = window.fruitHoleGrow();
    const devler = window.fruitHoleGiantList();
    // Anıtların kendi büyüme katkısı: dev çarpanı 9. Onları yemeden
    // önceki boy aranıyor, o yüzden düşülüyor.
    const anitKatki = a.sayi * 9 * g.unit;
    const erisilir = Math.min(g.max, g.r + g.kalanBuyume - anitKatki);
    return {
      ad: window.fruitHoleLevelName(), sayi: a.sayi, r: a.r,
      gereken: a.gerekenAgiz, erisilir: +erisilir.toFixed(2),
      baslangic: g.r, max: g.max, sure: g.timeLeft,
      // En iri dev (anıt olmayan da olabilir) ayrıca.
      enIriDev: devler.length ? +Math.max(...devler.map(d => d.r)).toFixed(2) : null,
    };
  }, lv);
  if (!o.sayi) continue;
  const yeter = o.erisilir >= o.gereken;
  satir.push({ lv, ...o, yeter });
  console.log(`  ${yeter ? 'OK  ' : 'FAIL'} ${String(lv).padStart(3)}  ${o.ad.padEnd(12)}  ` +
    `${String(o.r).padStart(4)}  ${String(o.gereken).padStart(6)}  ${String(o.erisilir).padStart(7)}  ` +
    `${String(o.sayi).padStart(3)}  ${yeter ? '' : 'YUTULAMAZ'}`);
}

const kotu = satir.filter(x => !x.yeter);
console.log(`\n  ${kotu.length ? 'FAIL' : 'OK  '} ${satir.length - kotu.length} / ${satir.length} ` +
  `anıtlı bölümde anıt yutulabilir`);
if (kotu.length) {
  console.log('\nyutulamayan anıtlar (tahtanın tamamı yense bile):');
  for (const x of kotu) {
    console.log(`  ${String(x.lv).padStart(3)}  ${x.ad.padEnd(12)}  anıt ${x.r} → ${x.gereken} ağız gerek, ` +
      `en fazla ${x.erisilir} (eksik ${(x.gereken - x.erisilir).toFixed(2)})`);
  }
}
process.exitCode = kotu.length ? 1 : 0;

await br.close(); srv.close();
