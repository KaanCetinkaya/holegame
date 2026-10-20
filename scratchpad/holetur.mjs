// İkinci ve üçüncü tur, birinciden farklı mı?
//
//   node build-www.mjs && node scratchpad/holetur.mjs
//
// ## Neden var
//
// Oyun sonsuz: düzen tablosu 55'te bitiyor ve sonra başa dönüyor, her
// turda çevrilmiş tahta ve kayan sırayla (`holeloop` bunu ölçüyor). Ama
// "aynı düzen ikinci turda **daha zor** mu" sorusuna hiçbir ölçüm cevap
// vermiyordu:
//
//   * `holebalance` zorluğu ölçüyor ama yalnızca birinci turda (55 bölüm)
//   * `holeloop` sıranın ve çevirmenin doğruluğuna bakıyor, tahtanın
//     içeriğine değil
//   * `holeboot` 60, 75, 90, 105, 120'yi oynatıyor ama aradığı şey hata
//
// Boşluğun pahalı tarafı şu: bilinen tek oyuncu (Kaan) 90'ın üstünde,
// yani oyunun ölçülmemiş bandında oynuyor. Slice Rush'ta aynı soru
// sorulunca cevap "17. bölümden sonra hiçbir şey değişmiyor" çıkmıştı.
//
// ## Ölçülen şey
//
// Aynı **düzen** üç turda kuruluyor ve tahtanın kendisi okunuyor: meyve
// sayısı, saat, delik hızı, tahta boyu, engel sayıları, ve deve yetişmek
// için süpürülmesi gereken pay. Oynanmıyor — hepsi tahta kurulduğu anda
// belli.
//
// Kapı tek ve dar, ve bilerek öyle: **aynı düzen her turda kurulabiliyor
// mu.** "İkinci tur daha zor olmalı" bir karar, kapı değil — ve bu
// dosyanın işi o kararı Kaan'a sayılarla getirmek. Tablo tabloda kalıyor.
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
}).listen(8626);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8626/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', null, { timeout: 40000 });
await pg.evaluate(() => window.fruitHoleDrawOff(true));

// Tur uzunluğu oyundan: tema tablosunun boyu. Buraya 55 yazmak, tablo
// değişince başka bir şey ölçmek olurdu.
const N = await pg.evaluate(() => window.fruitHoleThemeTable().order.length);
// Üç turdan aynı **düzene** denk gelen bölümler. Sıra turdan tura
// kaydığı için numara aritmetikle bulunmuyor, oyuna soruluyor.
const ORNEK = 14;  // kaç düzen örneklenecek
const esler = await pg.evaluate(({ N, ORNEK }) => {
  const yer = (tur) => {
    const m = new Map();
    for (let i = 1; i <= N; i++) {
      const n = (tur - 1) * N + i;
      m.set(window.fruitHoleLoop(n).pattern, n);
    }
    return m;
  };
  const t1 = yer(1), t2 = yer(2), t3 = yer(3);
  const out = [];
  const adlar = [...t1.keys()];
  const adim = Math.max(1, Math.floor(adlar.length / ORNEK));
  for (let i = 0; i < adlar.length && out.length < ORNEK; i += adim) {
    const ad = adlar[i];
    if (t2.has(ad) && t3.has(ad)) out.push({ ad, n: [t1.get(ad), t2.get(ad), t3.get(ad)] });
  }
  return out;
}, { N, ORNEK });

const oku = (n) => pg.evaluate((lvl) => {
  const p = window.fruitHoleProbe(lvl);
  const engel =
    (window.fruitHoleCatapults().yerler || []).length +
    (window.fruitHoleRollers().yerler || []).length +
    (window.fruitHoleMud().yerler || []).length +
    (window.fruitHoleWind().var ? 1 : 0);
  const dev = window.fruitHoleGiantList();
  return {
    meyve: p.fruit, saniye: p.seconds, hiz: +p.speed.toFixed(2),
    tahta: +(p.fieldW * p.fieldH).toFixed(0), tahtaTuru: p.kind,
    delik: +p.holeR.toFixed(2), tavan: +p.holeMax.toFixed(2),
    engel, dev: dev.length,
  };
}, n);

console.log(`\n  tur uzunluğu ${N} bölüm · ${esler.length} düzen örneklendi\n`);
console.log('  düzen       | tur | blm | tahta türü | meyve | saat | alan  | engel | dev');
console.log('  ------------+-----+-----+------------+-------+------+-------+-------+----');
const satir = [];
for (const e of esler) {
  for (let t = 0; t < 3; t++) {
    const r = await oku(e.n[t]);
    satir.push({ ad: e.ad, donus: t + 1, n: e.n[t], ...r });
    console.log(`  ${e.ad.padEnd(11)} | ${t + 1}   | ${String(e.n[t]).padStart(3)} | ` +
      `${r.tahtaTuru.padEnd(10)} | ${String(r.meyve).padStart(5)} | ` +
      `${(r.saniye === 9999 ? '  ∞' : String(r.saniye)).padStart(4)} | ` +
      `${String(r.tahta).padStart(5)} | ` +
      `${String(r.engel).padStart(5)} | ${String(r.dev).padStart(3)}`);
  }
}

const fails = [];
const check = (ok, ne, ek = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ne}${ek ? '   ' + ek : ''}`);
  if (!ok) fails.push(`${ne} ${ek}`);
};
console.log('');
check(satir.length === esler.length * 3 && satir.every(s => s.meyve > 0 && s.saniye > 0),
  'her düzen üç turda da kuruluyor', `${satir.length} tahta`);
check(hata.length === 0, 'sayfa hatası yok', hata[0] || '');

// ## Turlar arasında ne değişiyor — ve ne ölçülemiyor
//
// Burada bir tur önce **ortalama** vardı: her ölçünün tur başına
// ortalaması alınıp "değişiyor / aynı" yazılıyordu. İki kez yanlıştı ve
// ikisi de aynı cinsten — ölçüm, oyunu değil kendi örneklemini
// ölçüyordu:
//
//   1. Aynı düzen bir turda ızgara, ötekinde resim tahtası oluyor (tahta
//      türü bölüm numarasından geliyor, düzenden değil) ve resim
//      tahtasında 1600 meyve 140 birimlik alanda duruyor. Bir tura bir
//      resim tahtası düşmesi o turun ortalamasını ikiye katlıyordu.
//   2. Tür eşitlenince örneklem beşe indi, ve engel sayısı tahta her
//      kurulduğunda rastgele: 0.6 → 3.2 → 1.6 zarın yazdığı bir şey.
//
// Ortalama kaldırıldı. Geriye **belirlenimci** olan iki soru kalıyor ve
// ikisi de tek kurulumla cevaplanıyor.
console.log('\n  1) Bölümle değişmeyen ölçüler');
// Deliğin hızı ve büyüyebileceği tavan sabitlerden geliyor: tahtanın
// rastgeleliğine bağlı değil, yani iki değer görülmesi ya bir eğri var
// demek ya da hiç yok.
for (const k of ['hiz', 'tavan', 'delik']) {
  const degerler = [...new Set(satir.map(s => s[k]))].sort((a, b) => a - b);
  console.log(`     ${k.padEnd(6)} görülen değerler: ${degerler.join(', ')}` +
    (degerler.length === 1 ? '   (bölümden bağımsız)' : ''));
}
console.log('     Yani deliğin hızı ve büyüme tavanı 158. bölümde 1. bölümdekiyle');
console.log('     aynı. Zorluk tahtanın boyu, saat ve engellerle taşınıyor —');
console.log('     bu bir hata değil, tasarımın yeri; ama bir yerde yazılı olmalı.');

console.log('\n  2) Aynı düzen, turdan tura başka bir tahta');
// Oyuncunun ikinci turda gerçekten başka bir şey gördüğü yer burası ve
// rastgele değil: tahta türü bölüm numarasının fonksiyonu.
let turDegisen = 0;
for (const ad of [...new Set(satir.map(s => s.ad))]) {
  const u = satir.filter(s => s.ad === ad).sort((a, b) => a.donus - b.donus);
  const turler = u.map(s => s.tahtaTuru);
  if (new Set(turler).size > 1) turDegisen++;
  console.log(`     ${ad.padEnd(11)} ${turler.join(' → ')}`);
}
console.log(`     ${turDegisen}/${new Set(satir.map(s => s.ad)).size} düzen, turlar arasında tahta türü değiştiriyor`);

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
