// Kazanç ile fiyatlar arasındaki oran: oyuncu dükkânı kaçıncı bölümde
// bitiriyor?
//
//   node build-www.mjs && node scratchpad/holeecon.mjs
//
// Oyunun hiç ölçülmemiş tek yeri burasıydı. Yükseltmeler 25-30 meyveden
// başlayıp her adımda ikiye katlanıyor, yani bütün ağaç 2620 meyve; bir
// bölüm ise dört para biriminin her birinden yüzlerce veriyor. Ölçmeden önce
// bu sadece bir şüpheydi — burası onu sayıya çeviriyor.
//
// Ölçüm fruitHoleIncome() üzerinden: delik en yakın meyveye gidiyor, ağzına
// giren her şeyi aynı anda yutuyor, eatFruit()'in büyüme ve zincir kuralları
// birebir uygulanıyor. Yani çarpan tahmin edilmiyor, meyvelerin ne kadar
// sıkışık durduğundan ve deliğin ne kadar hızlı gittiğinden çıkıyor.

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
}).listen(8216);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('SAYFA HATASI: ' + e));
await pg.goto('http://localhost:8216/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleIncome, { timeout: 25000 });

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

const LEVELS = [1, 2, 3, 5, 8, 10, 13, 16, 20, 25, 30, 35, 40, 45];

console.log('\n1. bölüm başına kazanç (yutma simülasyonu)');
// Tarla tohumlanıyor. Tohumsuz bırakıldığında aynı bölüm her çalıştırmada
// farklı bir meyve dağılımı veriyordu — 20. bölüm bir seferde 240 çilek, bir
// seferde 58. Eşik koyan bir denge testinde bu, geçip geçmemenin zara
// bağlanması demek. Her bölüm kendi sabit tohumunu alıyor, yani sayılar
// çalıştırmalar arasında karşılaştırılabilir.
const rows = [];
for (const n of LEVELS) {
  const r = await pg.evaluate(lvl => {
    window.fruitHoleSeedField(1000 + lvl);
    window.fruitHoleProbe(lvl);
    const out = window.fruitHoleIncome();
    window.fruitHoleUnseedField();
    return out;
  }, n);
  rows.push(r);
  const p = r.pay;
  console.log(`  bölüm ${String(n).padStart(2)}  ${r.pattern.padEnd(11)}` +
    ` ${String(r.fruit).padStart(3)} meyve ${String(r.giants).padStart(2)} dev` +
    `  toplam ${String(r.sum).padStart(5)}` +
    `  (çil ${String(p.berry).padStart(4)} elma ${String(p.lychee).padStart(4)}` +
    ` muz ${String(p.banana).padStart(4)} karpuz ${String(p.melon).padStart(4)})` +
    `  ort×${r.avgMult}  taban ${r.floor} tavan ${r.ceiling}`);
}

// Sandık da bir gelir kaynağı: 40 + yıldız*30 + bölüm*4. Üç yıldızla oynayan
// biri için bölüm başına ortalaması bu.
const chest = n => 40 + 3 * 30 + n * 4;

console.log('\n2. dükkânın fiyatı');
const prices = await pg.evaluate(() => window.fruitHolePrices());
console.log(`  yükseltme ağacı: ${JSON.stringify(prices.tree)}  toplam ${prices.treeSum}`);
console.log(`  kaplamalar:      ${JSON.stringify(prices.skins)}  toplam ${prices.skinSum}`);

console.log('\n3. dükkân kaçıncı bölümde bitiyor?');
// Para birimi başına biriktir: her bölüm o bölümün kazancını ve sandığın
// dörtte birini (sandık rastgele bir tür veriyor) ekle.
function levelsToAfford(target, payKey) {
  const purse = {};
  let n = 0;
  for (let lvl = 1; lvl <= 300; lvl++) {
    const r = rows.reduce((a, b) => Math.abs(b.level - lvl) < Math.abs(a.level - lvl) ? b : a);
    for (const k in r.pay) purse[k] = (purse[k] || 0) + r.pay[k] + chest(lvl) / 4;
    n = lvl;
    if (Object.entries(target).every(([k, v]) => (purse[k] || 0) >= v)) return { lvl, purse };
  }
  return { lvl: null, purse };
}
const treeAt = levelsToAfford(prices.tree);
const allAt = levelsToAfford(Object.fromEntries(
  Object.keys({ ...prices.tree, ...prices.skins })
    .map(k => [k, (prices.tree[k] || 0) + (prices.skins[k] || 0)])));
console.log(`  bütün yükseltmeler: bölüm ${treeAt.lvl}`);
console.log(`  yükseltme + kaplama: bölüm ${allAt.lvl}`);

// Eşikler nereden geliyor: tarla 34 satırda, yani 13. bölümde büyümeyi
// bırakıyor ve desenler ondokuzda bir başa dönüyor, dolayısıyla oyunun
// "yeni bir şey gösterdiği" kısım 25. bölüm civarında bitiyor. Kapalı testte
// kimse 45'i geçmedi. Yükseltme ağacının o ilk kısım boyunca sürmesi
// (15'ten önce bitmemesi), her şeyin ise ancak bilinen en uzak noktaya
// yaklaşırken tamamlanması (35'ten önce değil) isteniyor. Öbür türlüsü —
// eskiden olduğu gibi 3. bölümde biten bir dükkân — dört sayacı da geri
// kalan bütün oyun boyunca süse çeviriyor.
check(treeAt.lvl >= 15, 'yükseltme ağacı en erken 15. bölümde bitiyor',
  `bölüm ${treeAt.lvl}`);
check(allAt.lvl >= 35, 'her şey en erken 35. bölümde alınıyor', `bölüm ${allAt.lvl}`);

console.log('\n4. meyve paketleri bir işe yarıyor mu?');
// Paketler dört türün her birinden aynı miktarı veriyor, ama ağacın her
// dalı aynı fiyatta değil — ortalamaya bakmak yanıltıyor. Ölçü, paketin en
// pahalı dalın ne kadarını karşıladığı: bir şeye yetmiyorsa satın alınacak
// sebep yok, her şeyi karşılıyorsa da oyunu satın alıp bitirmek demek.
const dearest = Math.max(...Object.values(prices.tree));
for (const [id, amt] of Object.entries(prices.packs)) {
  const share = amt / dearest;
  console.log(`  ${id.padEnd(24)} ${String(amt).padStart(5)}  en pahalı dalın %${Math.round(share * 100)}'i`);
  if (/pack_small/.test(id)) {
    check(share >= 0.1 && share <= 0.35, 'küçük paket bir işe yarıyor ama ağacı bitirmiyor',
      `%${Math.round(share * 100)}`);
  }
  if (/pack_large/.test(id)) {
    check(share >= 0.4 && share <= 0.9, 'büyük paket ciddi bir sıçrama ama tek başına yetmiyor',
      `%${Math.round(share * 100)}`);
  }
}

console.log('\n5. ilk yükseltme ne zaman alınabiliyor?');
// Öbür uç: eğer ilk yükseltme de uzaksa, yeni oyuncu dükkânın var olduğunu
// hiç fark etmiyor. Bir oyuncunun ilk yükseltmesini birinci ya da ikinci
// bölümün sonunda alabilmesi gerekiyor. (UPGRADES sayfa kapsamında değil,
// bu yüzden fruitHolePrices() üzerinden geliyor.)
const lvl1 = rows.find(r => r.level === 1);
let anyFirst = false;
for (const u of prices.first) {
  const after1 = lvl1.pay[u.pay] + chest(1) / 4;
  if (after1 >= u.base) anyFirst = true;
  console.log(`  ${u.id.padEnd(7)} ${String(u.base).padStart(4)}  1. bölüm sonunda ${Math.round(after1)}`);
}
check(anyFirst, 'ilk bölümün ardından en az bir yükseltme alınabiliyor');

console.log('\n6. güçlendiriciler kullanılabilir fiyatta mı?');
// Tek tekrar eden gider bunlar. Bir bölümün o türden kazancının yarısını
// geçerlerse kimse kullanmıyor, onda birinin altında kalırlarsa da bedava.
const perLevel = {};
for (const r of rows) for (const k in r.pay) perLevel[k] = (perLevel[k] || 0) + r.pay[k] / rows.length;
for (const b of prices.boosters) {
  const share = b.cost / perLevel[b.pay];
  console.log(`  ${b.id.padEnd(7)} ${String(b.cost).padStart(4)} ${b.pay}  bir bölümün %${Math.round(share * 100)}'i`);
  check(share >= 0.1 && share <= 0.5, `${b.id} makul fiyatta`, `%${Math.round(share * 100)}`);
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
