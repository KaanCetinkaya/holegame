// Bir tahtanın üstten harfli haritası.
//
//   node build-www.mjs && node scratchpad/holemap.mjs 11 22 32 44
//
// Neden resme bakmak yetmiyor: `holesheet.mjs` kareleri tek sayfaya dizerken
// küçültüyor ve küçültme yalan söyleyebiliyor — bir kere zemin şeritlerini
// çapraz gösterdi, yani tam aranan hatanın taklidini üretti. Tek kare bile
// yanıltıcı olabiliyor, çünkü tahtadaki devler etrafındaki meyveyi siliyor
// ve şekil ekranda delik deşik duruyor; "düzen bozuk" sanılan şey aslında
// devin ayak izi oluyor.
//
// Harf yalan söylemiyor. Her satır tahtanın bir sırası:
//
//   #  meyve      o  nesne (dev nesneler de burada)      K  kolos
//
// House bu yüzden yazıldı: render'da tanınmıyordu, haritada çatının,
// bacanın, kapının ve pencerelerin hepsi yerli yerindeydi — eksik olan şey
// düzen değil, çatının fazla yavaş açılmasıydı.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8272);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8272/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleCellMap, { timeout: 25000 });

const LV = process.argv.slice(2).map(Number).filter(n => Number.isFinite(n) && n > 0);
if (!LV.length) LV.push(1);

for (const n of LV) {
  // Tohumlu: aynı bölüme iki kere bakınca aynı harita çıksın, yoksa
  // "düzeldi mi" sorusunun cevabı her seferinde başka bir tarla olur.
  const o = await pg.evaluate(l => {
    window.fruitHoleSeedField(7000 + l);
    const p = window.fruitHoleProbe(l);
    const g = window.fruitHoleCellMap();
    window.fruitHoleUnseedField();
    return { p, g };
  }, n);
  console.log(`\n=== ${n}  ${o.p.pattern}  (${o.p.kind})`);
  console.log(o.g);
}

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
process.exit(errs.length ? 1 : 0);
