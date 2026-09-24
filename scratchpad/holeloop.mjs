// Tur 2 ve sonrası: aynı düzen ama çevrilmiş tahta, ve kayan sıra.
//
// Sorduğu şey: 24 bölüm bitince oyuncu yeni bir tahta görüyor mu, yoksa
// birebir aynısını mı? Ayna simetrik bir düzende hiçbir şey değiştirmiyor —
// bunu tahmin etmek yerine desenin kendi cevabını okuyup karşılaştırıyoruz.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8271);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await b.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8271/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleLoop === 'function', { timeout: 25000 });

const hata = [];
const order = await pg.evaluate(() => window.fruitHoleThemeTable().order);
const N = order.length;

// 1. Kablolama: hangi bölüm hangi tur, hangi çevirme, hangi düzen.
console.log('--- 1. bölüm -> tur/çevirme/düzen ---');
for (const n of [1, 13, N, N + 1, N + 2, 2 * N, 2 * N + 1, 3 * N + 1, 4 * N + 1]) {
  const r = await pg.evaluate(k => window.fruitHoleLoop(k), n);
  console.log(` ${String(n).padStart(3)} | tur ${r.loop} | ${r.twist.padEnd(7)} | ${r.pattern}`);
}
const t1 = await pg.evaluate(n => window.fruitHoleLoop(n), 1);
if (t1.twist !== 'none') hata.push('1. bölüm çevrilmiş olmamalı: ' + t1.twist);
// Tur 1 sırası oyunun kendi sırası olmalı; araçlar ve testler buna bakıyor.
for (let n = 1; n <= N; n++) {
  const r = await pg.evaluate(k => window.fruitHoleLoop(k), n);
  if (r.pattern !== order[n - 1]) hata.push(`1. turda ${n}. bölüm ${r.pattern}, olması gereken ${order[n - 1]}`);
}
// 25. bölüm başa dönmemeli.
const first2 = await pg.evaluate(n => window.fruitHoleLoop(n), N + 1);
if (first2.pattern === order[0]) hata.push('2. tur yine ' + order[0] + ' ile başlıyor');

// Kayma hiçbir düzeni atlamamalı: her tur 24 düzenin hepsini vermeli.
for (const tur of [2, 3, 4]) {
  const gorulen = new Set();
  for (let i = 0; i < N; i++) {
    const r = await pg.evaluate(k => window.fruitHoleLoop(k), (tur - 1) * N + i + 1);
    gorulen.add(r.pattern);
  }
  if (gorulen.size !== N) hata.push(`${tur}. turda ${gorulen.size} düzen görünüyor, ${N} olmalı`);
}

// 2. Ayna gerçekten tahtayı değiştiriyor mu? Düzen düzen ölç.
console.log('\n--- 2. çevirme şekli değiştiriyor mu ---');
const TW = ['mirrorX', 'mirrorZ', 'half'];
const sayim = { mirrorX: 0, mirrorZ: 0, half: 0 };
const hicbiri = [];
console.log(' düzen     | mirrorX | mirrorZ | half');
for (const name of order) {
  const base = await pg.evaluate(n => window.fruitHoleShapeSig(n, 'none'), name);
  const satir = [];
  let degisen = 0;
  for (const t of TW) {
    const s = await pg.evaluate(([n, tw]) => window.fruitHoleShapeSig(n, tw), [name, t]);
    const farkli = s.sig !== base.sig;
    if (farkli) { sayim[t]++; degisen++; }
    satir.push(farkli ? '  farklı' : '   aynı ');
  }
  if (!degisen) hicbiri.push(name);
  console.log(` ${name.padEnd(9)} | ${satir.join(' | ')}`);
}
console.log(`\n toplam: mirrorX ${sayim.mirrorX}/${N} · mirrorZ ${sayim.mirrorZ}/${N} · half ${sayim.half}/${N}`);
console.log(` hiçbir çevirmeden etkilenmeyen: ${hicbiri.length ? hicbiri.join(', ') : 'yok'}`);

// Ölçülen sabit: Orbits'in `empty` ve `type` fonksiyonları yalnızca halka
// numarasına bakıyor, açıya değil — yani açıyı yansıtmak şeklini
// değiştirmiyor. (Devlerinin yeri değişiyor: `big` açıyı okuyor. Buradaki
// imza yalnızca şekli görüyor.)
//
// Liste iki yönlü kontrol ediliyor: beklenmeyen bir düzen sabitlenirse de,
// listedeki bir düzen artık değişmeye başlarsa da hata veriyor. Tek yönlü
// olsaydı liste sessizce eskiyordu.
const BEKLENEN_SABIT = ['Orbits'];
for (const n of hicbiri) {
  if (!BEKLENEN_SABIT.includes(n)) hata.push(`${n} hiçbir çevirmeden etkilenmiyor, listede de yok`);
}
for (const n of BEKLENEN_SABIT) {
  if (!hicbiri.includes(n)) hata.push(`${n} artık çevirmeden etkileniyor — BEKLENEN_SABIT güncellensin`);
}

// 3. Çevirme dolu hücre sayısını değiştirmemeli.
//
// Izgarada ayna bir eşleme: sorulan indislerin kümesi aynı kalıyor, yalnızca
// hangi hücreye hangi cevabın gittiği değişiyor. Yani dolu hücre sayısı
// birebir aynı çıkmalı. Çıkmıyorsa indis sınırın dışına taşmıştır — `rows`
// yerine `COLS` yazmak gibi bir hata tam burada görünür ve tahtayı sessizce
// yarıya indirir.
//
// Kutupsalda bu geçerli değil ve sebebi ölçüldü: halkalar tahtanın dikdörtgen
// kenarında kesiliyor, yani daire tam değil. Açıyı yansıtmak, kesilen yerle
// dolu yerin yer değiştirmesi demek — Whirl'de 630 hücre 528'e iniyor. Bu bir
// taşma değil, desenin kendi şekli. Yine de bir sınır var: tahtanın dörtte
// biri boşalıyorsa o artık aynı bölüm değildir.
const POLAR_PAY = 0.25;
console.log('\n--- 3. dolu hücre sayısı korunuyor mu ---');
for (const name of order) {
  const base = await pg.evaluate(n => window.fruitHoleShapeSig(n, 'none'), name);
  for (const t of TW) {
    const s = await pg.evaluate(([n, tw]) => window.fruitHoleShapeSig(n, tw), [name, t]);
    const fark = Math.abs(s.filled - base.filled);
    const pay = base.polar ? Math.ceil(base.filled * POLAR_PAY) : 0;
    const yuzde = (100 * fark / Math.max(1, base.filled)).toFixed(0);
    if (fark > pay) {
      hata.push(`${name}/${t}: dolu hücre ${base.filled} -> ${s.filled} (%${yuzde})`);
      console.log(` ${name.padEnd(9)} | ${t.padEnd(7)} | ${base.filled} -> ${s.filled}  SINIR AŞILDI`);
    } else if (fark) {
      console.log(` ${name.padEnd(9)} | ${t.padEnd(7)} | ${base.filled} -> ${s.filled}  (%${yuzde}, kutupsal, sınır içinde)`);
    }
  }
}
console.log(' (ızgara düzenlerinde sayı birebir korunmalı, yazılmadıysa korunuyor)');

// Günlük koşunun çevrilmediğini `holedaily.mjs` ölçüyor: bölüm 3'teki ve
// bölüm 44'teki iki profil aynı günde birebir aynı tarlayı kuruyor mu diye
// bakıyor, ve 44 ikinci tur demek. Burada tekrarlanmıyor.

console.log('\nsayfa hataları:', errs.length ? errs : 'yok');
if (errs.length) hata.push(...errs);
console.log(hata.length ? 'hatalar:\n - ' + hata.join('\n - ') : 'hepsi geçti');
// Hata varsa çıkış kodu da söylesin.
//
// Bu dosya hatayı **basıyordu ama çıkış kodu 0 dönüyordu**, yani onu çağıran
// her şey — toplu koşu, ileride bir CI — "geçti" diye okuyordu. Tam koşuda on
// üç test böyle çıktı: hata basan ama başarı sinyali veren bir test, hiç test
// olmamasından kötü, çünkü bakılmış olduğu izlenimi veriyor.
process.exitCode = hata.length ? 1 : 0;
await b.close(); srv.close();
