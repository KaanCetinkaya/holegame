// Bozuk bir kayıt anahtarı oyunu açılmaz hâle getiriyor mu?
//
// Fruit Hole mağazada ve gerçek oyuncuları var; bu dosyanın ölçtüğü şey
// onların kaybedebileceği tek şey.
//
// Ondokuz yerde `JSON.parse(localStorage.getItem(...))` duruyordu ve
// yalnızca biri try/catch içindeydi. Ölçüldü: yarım yazılmış bir
// `currency`, `undefined` olmuş bir `stars`, `"muz"` olmuş bir
// `upgrades`, yarım bir `skins` — dördü de betiği yüklenirken
// patlatıyor ve oyun **hiç açılmıyordu**. Canvas bile oluşmuyor, ekran
// siyah kalıyor, ve kayıt her açılışta yeniden okunduğu için
// kendiliğinden düzelmiyor: oyuncunun yapabileceği tek şey uygulama
// verisini silmek, yani doksanıncı bölümdeki ilerlemeyi atmak.
//
// `fruithole_level: 'abc'` ayrı bir yoldan aynı yere çıkıyordu:
// `parseInt` NaN veriyor ve NaN bir bölüm numarası bütün alan
// kurulumunu patlatıyor.
//
// Anahtarlar ayrı tutulduğu için doğru davranış varsayılana dönmek: tek
// alan kayboluyor, ilerlemenin geri kalanı duruyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8709);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

async function ac(anahtarlar) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  const hata = [];
  pg.on('pageerror', e => hata.push(String(e).split('\n')[0]));
  await pg.addInitScript(kv => {
    localStorage.clear();
    for (const [k, v] of kv) localStorage.setItem(k, v);
  }, Object.entries(anahtarlar));
  await pg.goto('http://localhost:8709/', { waitUntil: 'load', timeout: 60000 });
  // Canvas, oyunun gerçekten kurulduğunun kanıtı: `document.body` bozuk
  // bir kayıtla da var, canvas yok.
  let canvas = false;
  try {
    await pg.waitForFunction(() => !!document.querySelector('canvas'), null, { timeout: 15000 });
    canvas = true;
  } catch (e) { }
  const d = await pg.evaluate(() => ({
    canvas: !!document.querySelector('canvas'),
    bolum: (() => { try { return window.fhLevel ? window.fhLevel() : null; } catch (e) { return null; } })(),
  }));
  await pg.close();
  return { ...d, canvas, hata };
}

const VAKALAR = [
  ['temiz kayıt',        {}],
  ['currency yarım',     { fruithole_currency: '{bozuk' }],
  ['stars undefined',    { fruithole_stars: 'undefined' }],
  ['upgrades kelime',    { fruithole_upgrades: '"muz"' }],
  ['upgrades dizi',      { fruithole_upgrades: '[1,2]' }],
  ['level sayı değil',   { fruithole_level: 'abc' }],
  ['level negatif',      { fruithole_level: '-4' }],
  ['skins yarım',        { fruithole_skins: '{"a":' }],
  ['boosters kelime',    { fruithole_boosters: '"yok"' }],
  ['found nesne',        { fruithole_found: '{}' }],
  ['daily dizi',         { fruithole_daily: '[]' }],
  ['iap null',           { fruithole_iap: 'null' }],
  ['stats sayı',         { fruithole_stats: '42' }],
  // Aşağıdaki sekizi liste **oyundan türetilince** eklendi: kayıt
  // anahtarları on sekiz, burada on biri deneniyordu. Eksik kalanlar,
  // sonradan eklenmiş olanlardı — yani en az denenmiş olanlar.
  ['ach kelime',         { fruithole_ach: '"hepsi"' }],
  ['chall dizi',         { fruithole_chall: '[]' }],
  ['gllog nesne',        { fruithole_gllog: '{}' }],
  ['muted saçma',        { fruithole_muted: 'belki' }],
  ['notif yarım',        { fruithole_notif: '{"a":' }],
  ['perf kelime',        { fruithole_perf: '"hızlı"' }],
  ['rate dizi',          { fruithole_rate: '[1,2]' }],
  ['tchest sayı',        { fruithole_tchest: '9' }],
  ['hepsi birden',       { fruithole_currency: '{bozuk', fruithole_stars: 'undefined',
                           fruithole_upgrades: '"muz"', fruithole_skins: '{"a":',
                           fruithole_level: 'abc', fruithole_daily: '[]',
                           fruithole_found: '{}', fruithole_iap: 'null',
                           fruithole_ach: '"hepsi"', fruithole_chall: '[]',
                           fruithole_notif: '{"a":', fruithole_tchest: '9' }],
];

// Oyunun kullandığı her anahtar burada deneniyor mu?
//
// Liste elle yazılıyordu ve bayatlamıştı: oyun on sekiz anahtar
// kullanıyor, bu dosya on birini deniyordu. Eksik kalanlar sonradan
// eklenenler, yani en az denenmiş olanlar — ve bu dosyanın varlık
// sebebi, tek bir bozuk anahtarın oyunu açılmaz hâle getirmesi.
// Anahtarlar artık oyunun kaynağından okunuyor; yeni bir anahtar
// eklenip buraya vaka yazılmazsa kapı düşüyor.
const KAYNAK = readFileSync('/home/user/holegame/fruithole/index.html', 'utf8');
const ANAHTARLAR = [...new Set([
  ...[...KAYNAK.matchAll(/fhOku\(\s*'(fruithole_[A-Za-z]+)'/g)].map(m => m[1]),
  ...[...KAYNAK.matchAll(/getItem\(\s*'(fruithole_[A-Za-z]+)'/g)].map(m => m[1]),
])];
const DENENEN = new Set(VAKALAR.flatMap(([, kv]) => Object.keys(kv)));
const eksikAnahtar = ANAHTARLAR.filter(k => !DENENEN.has(k));
console.log(`\n0) Oyunun ${ANAHTARLAR.length} kayıt anahtarı · denenmeyen ${eksikAnahtar.length}`);
ok(eksikAnahtar.length === 0, 'oyunun her kaydı bozuk hâliyle deneniyor',
   eksikAnahtar.join(', '));

console.log('\n1) Bozuk anahtarla oyun açılıyor mu');
const sonuc = [];
for (const [ad, k] of VAKALAR) {
  const d = await ac(k);
  sonuc.push({ ad, d });
  console.log(`     ${ad.padEnd(20)} canvas:${d.canvas ? 'E' : 'H'}` +
    (d.hata.length ? `  HATA ${d.hata[0].slice(0, 56)}` : ''));
}
ok(sonuc.every(r => r.d.canvas), 'hepsinde oyun kuruldu',
   sonuc.filter(r => !r.d.canvas).map(r => r.ad).join(', '));
ok(sonuc.every(r => !r.d.hata.length), 'hiçbirinde sayfa hatası yok',
   sonuc.filter(r => r.d.hata.length).map(r => `${r.ad}: ${r.d.hata[0].slice(0, 40)}`).join(' | '));

console.log('\n2) Sağlam kayıt yanlışlıkla atılmıyor');
// Ters hata daha pahalı: çalışan bir ilerlemeyi sıfırlamak. Temiz bir
// kayıt yazılıp geri okunuyor.
const saglam = await ac({
  fruithole_level: '37',
  fruithole_currency: '{"coins":4200}',
  fruithole_stars: '{"1":3,"2":2}',
  fruithole_upgrades: '{"speed":2}',
});
console.log(`     canvas:${saglam.canvas ? 'E' : 'H'} hata:${saglam.hata.length}`);
ok(saglam.canvas && !saglam.hata.length, 'sağlam kayıtla sorunsuz açıldı',
   saglam.hata[0] || '');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
