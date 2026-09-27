// Hangi tahta yamuk duruyor?
//
//   node build-www.mjs && node scratchpad/holeyamuk.mjs
//   node scratchpad/holeyamuk.mjs --from 35
//
// İkinci tur ayrıca bakılmalı: tahta bölümle birlikte büyüyor ve düzenler
// çevriliyor. Bloom'u yamuk yapan şey zaten buydu — erişimi sabit bir sayıyla
// yazılmıştı, tahta büyüyünce yerinde saydı.
//
// "Yamuk" gözle söylenen bir şey ve otuz dört tahtayı tek tek açmadan
// aranamıyordu. İki sayıyla aranabiliyor (`fruitHoleSpread`):
//
//   * **kayma** — parçaların ağırlık merkezi tahtanın merkezinden ne kadar
//     uzakta. Tahtanın yarı ölçüsüne oranlı, yani 0.5 demek "merkez, kenarla
//     orta arasında" demek.
//   * **kapsama** — parçaların sığdığı kutu tahtanın kaçta kaçı.
//
// Sınırlar ölçülerek kondu, tahminle değil: bütün tahtalar tarandı ve
// bugünkü en kötüleri sınırın hemen altına alındı. Amaç bugünü geçirmek
// değil, yarın biri daha kötüsünü yaptığında burada görünmesi.
//
// Ölçüm tohumlu: aynı tahtaya iki kere bakınca aynı sayı çıksın, yoksa
// "düzeldi mi" sorusunun cevabı her seferinde başka bir tarla olur.

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
}).listen(8246);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8246/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleSpread, { timeout: 25000 });

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i === -1 ? d : Number(process.argv[i + 1]);
};
const ILK = arg('from', 1), SON = ILK + arg('count', 34) - 1;
console.log('\nblm  düzen       tahta    meyve | kayma X  kayma Z | kapsama X  Z');
console.log('-----+-----------+--------+-------+---------+--------+-----------');
const rows = [];
for (let n = ILK; n <= SON; n++) {
  const r = await pg.evaluate(l => {
    window.fruitHoleSeedField(7000 + l);
    const p = window.fruitHoleProbe(l);
    const s = window.fruitHoleSpread();
    window.fruitHoleUnseedField();
    return { ...p, ...s };
  }, n);
  rows.push({ n, ...r });
  console.log(
    `${String(n).padStart(4)} ${String(r.pattern).padEnd(11)} ${r.kind.padEnd(8)} ` +
    `${String(r.fruit).padStart(5)} | ${String(r.kaymaX).padStart(7)} ` +
    `${String(r.kaymaZ).padStart(8)} | ${String(r.kapsamaX).padStart(9)} ` +
    `${String(r.kapsamaZ).padStart(5)}${r.polar ? '  (kutupsal)' : ''}`);
}

// Resim tahtası bu ölçünün dışında: çizim tahtayı doldurmak zorunda değil,
// bir mantarın sapı da gövdesinden dar. Şerit ve bulmaca tahtaları da kendi
// kurallarıyla yerleşiyor.
const izgara = rows.filter(r => r.kind === 'ızgara');

// Sınır 0.35, ve 0.30 değil: Hilal'in kütlesi kalın tarafına yatıyor
// (0.31) ve bu bir hata değil, hilalin kendisi. Ölçülen şey "şekil simetrik
// mi" değil, "şekil bir uca yığılmış mı" — Bloom 0.59'du.
const kayik = izgara.filter(r => Math.max(r.kaymaX, r.kaymaZ) > 0.35);
check(!kayik.length, 'hiçbir ızgara tahtası bir uca yığılmıyor (kayma < 0.35)',
  kayik.map(r => `${r.n} ${r.pattern} ${Math.max(r.kaymaX, r.kaymaZ)}`).join(', '));

// Kapsama sınırı gevşek, ve bilerek: bir şeklin tahtadan küçük olması hata
// değil. Piramit yukarıdan **kare** — 13 sütunluk tahtada 13 satır, yani
// 34 satırlık bir tahtada dikeyde 0.35. Mercek de iki dairenin kesişimi,
// eninde 0.54. İkisi de ortalanmış, yani boş kalan yer kenar payı oluyor,
// yamukluk değil. Burada aranan şey şeklin bir noktaya çökmesi.
const kucuk = izgara.filter(r => r.kapsamaX < 0.35 || r.kapsamaZ < 0.32);
check(!kucuk.length, 'hiçbir ızgara tahtası bir noktaya çökmüyor',
  kucuk.map(r => `${r.n} ${r.pattern} ${r.kapsamaX}×${r.kapsamaZ}`).join(', '));

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
