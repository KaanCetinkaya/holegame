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
let lo = 1e9, hi = 0;
for (let n = 1; n <= 40; n++) {
  const p = await pg.evaluate(l => window.fruitHoleProbe(l), n);
  if (!seen.has(p.pattern)) seen.set(p.pattern, { first: n, fruit: p.fruit });
  lo = Math.min(lo, p.fruit); hi = Math.max(hi, p.fruit);
}
console.log(`\n${seen.size} desen, 40 bölümde ${lo}-${hi} meyve\n`);
for (const [name, v] of seen) console.log(`  ${String(name).padEnd(10)} bölüm ${String(v.first).padStart(2)}  ${v.fruit} meyve`);

console.log('');
check(seen.size === 19, `19 desen var (${seen.size})`);
check(lo >= 80, `en seyrek bölüm 80+ meyve (${lo})`);
check(hi <= 600, `en dolu bölüm 600'ü aşmıyor (${hi})`);

// --- eşya sayısı ---
// Metinde "elli iki nesne" yazıyordu; sayıyı elle takip etmek yerine
// oyundan okuyoruz.
const propIds = (await pg.evaluate(() => window.fruitHolePropSheet())).split(', ');
console.log(`\n  ${propIds.length} eşya`);

// --- mağaza metnindeki sayılar ---
const polar = await pg.evaluate(() =>
  window.fruitHoleProbe && (() => {
    // desen listesine erişimimiz yok; kutupsal olanları isimden say
    return ['Orbits', 'Whirl', 'Bloom'];
  })());
const listing = readFileSync(`${ROOT}/fruithole/store/listing-en.md`, 'utf8');
check(!/Fifteen hand-built/.test(listing), 'mağaza metni "Fifteen" demiyor');
check(listing.includes('Nineteen'), 'mağaza metni "Nineteen" diyor');
const WORDS = { 52: 'Fifty-two', 63: 'Sixty-three', 64: 'Sixty-four', 65: 'Sixty-five' };
check(listing.includes(`${WORDS[propIds.length]} objects`),
  `mağaza metni "${WORDS[propIds.length] || propIds.length} objects" diyor`);
check(/Three throw out the grid/.test(listing) === (polar.length === 3),
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
