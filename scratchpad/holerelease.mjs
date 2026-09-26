// Yükleme öncesi son kontrol: paketlenmiş build açılıyor mu, bütün desenler
// makul sayıda meyveyle kuruluyor mu, konsola hata düşüyor mu, mağaza
// metnindeki sayılar hâlâ doğru mu?
//
//   node build-www.mjs && node scratchpad/holerelease.mjs
//
// Buradaki asıl mesele mağaza metni: "on beş elle yapılmış düzen" yazıyordu,
// oyunda on dokuz desen var. Sayıyı elle takip etmek yerine oyundan okuyoruz.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ROOT = '/home/user/holegame';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8177);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
const console_errs = [];
pg.on('console', m => { if (m.type() === 'error') console_errs.push(m.text()); });
await pg.goto('http://localhost:8177/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.evaluate(() => window.fruitHoleHold(true));

const fails = [];
const check = (ok, what) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}`);
  if (!ok) fails.push(what);
};

// --- her desen bir kere ---
const seen = new Map();
// Resim bölümleri bu sayımın dışında.
//
// Alt ve üst sınır, ızgara düzenlerinin tahtayı ne kadar doldurduğunu
// ölçüyor: seyrek kalan bir düzen bölümü boş gösteriyor, aşırı dolan bir
// düzen ise telefonda çizilemiyordu. Resim tahtası ikisini de başka
// kurallarla çözüyor — parçası boncuk, çizimi yığın, ve maliyeti
// `holepicture.mjs` çizim çağrısıyla üçgenden ölçüyor. 1848 parçalık bir
// mantar burada "600'ü aştı" diye düşerdi ve düşmesi hiçbir şey anlatmazdı.
const resimler = new Set(
  (await pg.evaluate(() => window.fruitHolePictures())).levels);
let lo = 1e9, hi = 0;
for (let n = 1; n <= 40; n++) {
  const p = await pg.evaluate(l => window.fruitHoleProbe(l), n);
  if (!seen.has(p.pattern)) seen.set(p.pattern, { first: n, fruit: p.fruit });
  if (resimler.has(n)) continue;
  lo = Math.min(lo, p.fruit); hi = Math.max(hi, p.fruit);
}
console.log(`\n${seen.size} desen, 40 bölümde ${lo}-${hi} meyve\n`);
for (const [name, v] of seen) console.log(`  ${String(name).padEnd(10)} bölüm ${String(v.first).padStart(2)}  ${v.fruit} meyve`);

console.log('');
const DESEN = (await pg.evaluate(() => window.fruitHoleThemeTable())).order.length;
check(seen.size === DESEN, `${DESEN} desen var (${seen.size})`);
check(lo >= 80, `en seyrek ızgara bölümü 80+ meyve (${lo})`);
check(hi <= 600, `en dolu ızgara bölümü 600'ü aşmıyor (${hi})`);

// --- eşya sayısı ---
// Metinde "elli iki nesne" yazıyordu; sayıyı elle takip etmek yerine
// oyundan okuyoruz.
const propIds = (await pg.evaluate(() => window.fruitHolePropSheet())).split(', ');
console.log(`\n  ${propIds.length} eşya`);

// --- mağaza metnindeki sayılar ---
//
// Bu blok iki kez elle bakım isteyen bir şeydi ve ikisi de eskidi. Kutupsal
// desenler "oyundan okunuyor" diye yazılmıştı ama gerçekte kodun içine
// elle yazılmış bir listeydi. Sayı-kelime karşılıkları da elle tutulan bir
// tabloydu ve 73'e gelince tablonun dışına çıkıp `undefined objects`
// aramaya başladı — yani test, ölçmesi gereken şeyi ölçemez hale geldi ve
// bunu bir hata gibi bildirdi.
//
// İkisi de artık oyundan geliyor, ve sayı kelimeye bir fonksiyonla
// çevriliyor. Ölçüm de iki yönlü: doğru sayı **yazıyor**, ve yanlış
// sayıların hiçbiri yazmıyor. Tek yönlü olsaydı eski cümle metinde unutulmuş
// halde durabilirdi.
const TABLO = await pg.evaluate(() => window.fruitHoleThemeTable());
const polar = TABLO.polar;
const listing = readFileSync(`${ROOT}/fruithole/store/listing-en.md`, 'utf8');

const BIRLER = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
  'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const ONLAR = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy',
  'Eighty', 'Ninety'];
// Yüz ve üstü de yazılıyor.
//
// Tablo doksan dokuzda bitiyordu ve eşya sayısı yüzü geçince `ONLAR[10]`
// `undefined` verdi: test "undefined-one" arayıp kendi düşmesini bir mağaza
// metni hatası diye bildirdi. Aynı şey yetmiş üçte bir kez daha olmuştu —
// o zaman tablo uzatılmıştı, yani çözüm bir sonraki sınıra kadar dayandı.
// Bu sefer sınır yok: yüzler özyinelemeyle yazılıyor.
function kelime(n) {
  if (n < 20) return BIRLER[n];
  if (n < 100) {
    const o = ONLAR[Math.floor(n / 10)], b = n % 10;
    return b ? `${o}-${BIRLER[b].toLowerCase()}` : o;
  }
  const yuz = `${BIRLER[Math.floor(n / 100)]} hundred`;
  const kalan = n % 100;
  return kalan ? `${yuz} and ${kelime(kalan).toLowerCase()}` : yuz;
}
// Metinde geçen sayı doğru mu, ve komşu sayılardan hiçbiri kalmamış mı?
function sayiKontrol(n, ne, aralik = 12) {
  const dogru = kelime(n);
  check(new RegExp(dogru, 'i').test(listing), `mağaza metni "${dogru}" (${ne}) diyor`);
  const yanlis = [];
  for (let k = Math.max(1, n - aralik); k <= n + aralik; k++) {
    if (k === n) continue;
    const w = kelime(k);
    // "Three" gibi kısa bir kelime metnin başka yerinde geçebiliyor; yalnızca
    // aynı cümlede, sayılan şeyin adının yanında geçeni arıyoruz.
    if (new RegExp(`${w}[ -](hand-built|objects|things)`, 'i').test(listing)) yanlis.push(w);
  }
  check(yanlis.length === 0,
    `eski ${ne} sayısı metinde kalmamış${yanlis.length ? ' — ' + yanlis.join(' ') : ''}`);
}
sayiKontrol(TABLO.order.length, 'desen');
sayiKontrol(propIds.length, 'eşya');
// Aranan şey **sayı**, tam cümle değil.
//
// Eskiden `/Three throw out the grid/` arıyordu ve o cümlenin ortasındaki
// kelimeleri kısaltmak (karakter sınırı için) testi düşürdü — oysa metin
// hâlâ "Three ... rings around you" diyordu, yani bağlaması gereken sayı
// yerindeydi. Cümlenin sözcüklerine bağlı bir test, metnin her düzenlemesinde
// olmayan bir hata uyduruyor; bağlanması gereken tek şey kaç tane olduğu.
const kutupsalMetin = /Three[^.]*rings around you/.test(listing);
check(kutupsalMetin === (polar.length === 3),
  `mağaza metni ${polar.length} kutupsal desen diyor`);

// --- kamera ---
// Kombo tekmesi kaldırıldı. Buna dair yapılabilecek dürüst kontrol bu: tekme
// bir daha sessizce geri gelmesin. Kameranın oynanışta sarsılmadığını gerçek
// bir turla ölçmek, sahte oyuncunun kombo kurabilmesine bağlıydı ve bir kere
// "sarsıntı yok" diye yanlış rapor verdi — o yüzden ölçüm değil, varlık
// kontrolü.
check(await pg.evaluate(() => typeof window.fruitHoleKick === 'undefined'),
  'kombo tekmesi yok (fruitHoleKick tanımsız)');

// --- reklam anahtarı ---
const src = readFileSync(`${ROOT}/fruithole/index.html`, 'utf8');
const testing = /const ADS_TESTING = (true|false)/.exec(src)[1];
console.log(`\n  ADS_TESTING = ${testing}  ${testing === 'true' ? '(test reklamları — kapalı testte doğru, üretimde false olmalı)' : '(canlı reklamlar)'}`);

console.log('\nsayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log('konsol hataları: ' + (console_errs.length ? console_errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
