// Zorluk düzgün mü artıyor, yoksa bir yerde uçurum mu var?
//
// Karışım bölümle sertleşiyor: kolay dolgu parçaları seyreliyor, karar
// gerektirenler sıklaşıyor, ve 23, 28, 36'da üç yeni parça giriyor.
// `slicewall.mjs` bunun **ölçülebilir** olduğunu gösteriyor (tur başına
// iki katından fazla demir), `slicegaps.mjs` her dizinin geçilebilir
// olduğunu. İkisi de "düzgün artıyor mu" sorusunu cevaplamıyor: bir
// bölüm ötekinin iki katı zorlaşıyorsa oyuncu orada bırakır ve iki
// ölçüm de bunu görmez.
//
// Otomatik sürücü iyi bir oyuncu değil — bir sonraki engele bakıyor,
// ondan sonrakine değil (bkz. slicer/README.md). Ama **tutarlı biçimde**
// kötü, ve burada aranan şey mutlak başarı oranı değil, oranın bölümden
// bölüme nasıl değiştiği. Deponun bu vekili kullanmak için verdiği
// gerekçe de bu.
//
// Ölçülen: her bölümde ÖRNEK tur, bitirme oranı ve kesilen oranı.
// Aranan: komşu bölümler arasında ani düşüş.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ÖRNEK = 16;

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8697);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const hata = [];
pg.on('pageerror', e => hata.push(String(e)));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8697/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', null, { timeout: 90000 });
await pg.evaluate(() => { for (const el of document.querySelectorAll('.screen')) el.classList.remove('show'); });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Nereye kadar: bütün eğrilerin durduğu bölümün iki ötesi. Elle
// yazılmış 30, `drift` 36'da girdiği anda yeni parçanın getirdiği
// basamağı hiç görmeyecekti — ve bu dosyanın tek işi basamak aramak.
const SON = await pg.evaluate(() => Math.max(
  window.sliceMix(1).bit,
  window.slicePieces().reduce((m, p) => Math.max(m, p.olgun), 0)) + 2);

const satir = [];
for (let n = 1; n <= SON; n++) {
  const r = await pg.evaluate(async ({ n, k }) => {
    let bitti = 0, oran = 0, demir = 0, mayin = 0;
    for (let t = 0; t < k; t++) {
      window.sliceStart(n);
      // `sliceRun` kare beklemiyor: `tick`'in çağırdığı benzetimin
      // aynısını sabit 1/60 adımla yürütüyor. Hem hızlı — otuz bölüm
      // yarım saat değil saniyeler — hem de **daha doğru**: kare
      // beklendiğinde bu konteynerde dt 0.05'e dayanıyor (yirmi kare),
      // oysa telefon altmış kare çeviriyor ve bıçağın hedefi takip
      // hızı dt'ye bağlı.
      const p = window.sliceRun();
      if (p.state === 'clear') bitti++;
      oran += p.total ? p.cut / p.total : 0;
      demir += window.sliceBars().length;
      mayin += (window.sliceMines ? window.sliceMines().length : 0);
    }
    return { bitti, oran: oran / k, demir: demir / k, mayin: mayin / k };
  }, { n, k: ÖRNEK });
  satir.push({ n, ...r });
}

console.log('\n blm | bitirme | kesilen | demir | mayın');
console.log(' ----+---------+---------+-------+------');
for (const s of satir)
  console.log(` ${String(s.n).padStart(3)} |   ${s.bitti}/${ÖRNEK}   |   ${(s.oran * 100).toFixed(0).padStart(3)}%  |` +
    ` ${s.demir.toFixed(1).padStart(5)} | ${s.mayin.toFixed(1).padStart(4)}`);

console.log('\n1) Kesilen oranı bölümle birlikte düşüyor (zorluk artıyor)');
const ort = (a, b) => satir.filter(s => s.n >= a && s.n <= b)
  .reduce((t, s) => t + s.oran, 0) / (b - a + 1);
const bas = ort(1, 6), orta = ort(13, 18), son = ort(25, 30);
console.log(`     1-6 %${(bas * 100).toFixed(0)} · 13-18 %${(orta * 100).toFixed(0)} · 25-30 %${(son * 100).toFixed(0)}`);
ok(son < bas, 'geç bölümler erken bölümlerden zor', `%${(bas * 100).toFixed(0)} → %${(son * 100).toFixed(0)}`);

console.log('\n2) Uçurum yok');
// Komşu pencereler arasındaki düşüş. Tek turluk gürültüyü saymamak için
// üçer bölümlük pencereler karşılaştırılıyor.
//
// Ölçü **puan farkı**, oran değil. İlk hâli göreliydi ve kuyrukta
// çöktü: oran zaten %20'ye inmişken %23'ten %11'e düşmek "−%53" yazıyor
// ve üç koşunun ikisi rastgele düşüyordu. Sıfıra yaklaşan bir büyüklükte
// göreli değişim, tanımı gereği kararsız. Oyuncunun hissettiği şey de
// zaten yüzdenin yüzdesi değil: %85'ten %42'ye inmek duvar, %23'ten
// %11'e inmek zaten zor olan bir yerde biraz daha zor.
const pencere = n => satir.filter(s => s.n >= n && s.n <= n + 2)
  .reduce((t, s) => t + s.oran, 0) / 3;
let enKotu = { n: 0, puan: 0 };
for (let n = 1; n + 5 <= SON; n++) {
  const a = pencere(n), b = pencere(n + 3);
  const puan = (a - b) * 100;
  if (puan > enKotu.puan) enKotu = { n, puan, a, b };
}
console.log(`     en sert düşüş ${enKotu.n}-${enKotu.n + 2} → ${enKotu.n + 3}-${enKotu.n + 5}: ` +
  `%${(enKotu.a * 100).toFixed(0)} → %${(enKotu.b * 100).toFixed(0)} (${enKotu.puan.toFixed(0)} puan)`);
// Eşik ölçülerek kondu, seçilerek değil: aynı yapım üç kez koşturuldu ve
// en sert düşüş 23, 26 ve 28 puan çıktı — yani örneklem gürültüsü beş
// puan civarı. 32, bunun üstünde dört puan pay bırakıyor ve düzeltmeden
// önceki gerçek duvarı (43 puan, 12. bölüm) hâlâ yakalıyor.
ok(enKotu.puan < 32, 'hiçbir yerde üç bölümde 32 puandan sert düşüş yok',
   `${enKotu.puan.toFixed(0)} puan @ ${enKotu.n}`);

console.log('\n3) Yeni parçaların girdiği bölümler ayrı bir duvar değil');
// Dokuma 23'te, kapan 28'de giriyor. Yeni bir parçanın girdiği bölüm,
// bir öncekine göre tek başına çökmemeli.
// Burada da puan farkı: tek bölümün örneklemi küçük ve oran zaten
// düşükken göreli fark gürültüden ibaret.
for (const n of [23, 28]) {
  const once = satir.find(s => s.n === n - 1).oran;
  const simdi = satir.find(s => s.n === n).oran;
  const puan = (once - simdi) * 100;
  console.log(`     ${n - 1} → ${n}: %${(once * 100).toFixed(0)} → %${(simdi * 100).toFixed(0)}` +
    ` (${puan.toFixed(0)} puan)`);
  ok(puan < 25, `${n}. bölüm tek başına çökmüyor`, `${puan.toFixed(0)} puan`);
}

console.log('\n4) Sayfa hatası');
console.log(`     ${hata.length}${hata.length ? ': ' + hata[0] : ''}`);
ok(hata.length === 0, 'otuz bölüm boyunca sayfa hatası yok');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
