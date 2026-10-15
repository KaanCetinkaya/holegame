// Bozuk bir kayıt anahtarı oyunu öldürüyor mu?
//
// Slice Rush ilerlemeyi dokuz ayrı anahtarda tutuyor ve okuma tek
// satırdı: `JSON.parse` patlarsa varsayılan, patlamazsa **ne gelirse**.
// Patlamamak yetmiyor — `JSON.parse('"muz"')` sorunsuz çalışıyor ve
// geriye bir kelime veriyor.
//
// Ölçüldü ve üç şey çıktı:
//
//   * `slicerush_blade: 99` → `BLADES[99]` tanımsız, oyun **hiç
//     açılmıyor**. Kayıt her açılışta yeniden okunduğu için de
//     kendiliğinden düzelmiyor: siyah ekran kalıcı ve oyuncunun
//     yapabileceği tek şey uygulamayı silmek.
//   * `slicerush_level: -5` → hiçbir parça seçilemiyor, bölüm kurma
//     patlıyor.
//   * `slicerush_coins: "muz"` → menüde "🪙 muz", ve ondan sonraki her
//     hesap NaN.
//
// Anahtarların ayrı olması bir şans: bozulan biri ötekileri
// götürmüyor, yani doğru davranış varsayılana dönmek — tek alan
// kayboluyor, ilerlemenin geri kalanı duruyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-slicer' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8703);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

// Her vaka kendi sayfasında: kayıt açılışta okunuyor, yani bozulma
// sayfa açılmadan önce yerinde olmalı.
async function dene(anahtarlar) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  const hata = [];
  pg.on('pageerror', e => hata.push(String(e)));
  await pg.addInitScript(kv => {
    localStorage.clear();
    for (const [k, v] of kv) localStorage.setItem(k, v);
  }, Object.entries(anahtarlar));
  await pg.goto('http://localhost:8703/', { waitUntil: 'load', timeout: 60000 });
  let d = { acildi: false };
  try {
    await pg.waitForFunction(() => typeof window.sliceMeta === 'function', null, { timeout: 25000 });
    d = await pg.evaluate(() => {
      const m = window.sliceMeta();
      window.sliceStart(1);
      const r = window.sliceRun();
      return {
        acildi: true, kasa: m.coins, bolum: window.sliceMap().maxLevel,
        menu: document.getElementById('mCoins').textContent,
        tur: r.state, kesilen: r.cut,
      };
    });
  } catch (e) { d.neden = String(e).slice(0, 60); }
  d.hata = hata;
  await pg.close();
  return d;
}

const VAKALAR = [
  ['bıçak aralık dışı',   { slicerush_blade: '99' }],
  ['bıçak negatif',       { slicerush_blade: '-3' }],
  ['sahip olunan bıçaklar yok olmuş', { slicerush_blades: '"hepsi"' }],
  ['sahip olunan bıçaklar aralık dışı', { slicerush_blades: '[9,9,9]' }],
  ['bölüm negatif',       { slicerush_level: '-5' }],
  ['bölüm kelime',        { slicerush_level: '"abc"' }],
  ['para kelime',         { slicerush_coins: '"muz"' }],
  ['para null',           { slicerush_coins: 'null' }],
  ['para nesne',          { slicerush_coins: '{}' }],
  ['yıldızlar dizi',      { slicerush_stars: '[1,2,3]' }],
  ['sayaçlar bozuk',      { slicerush_stats: '{"cuts":"çok"}' }],
  ['seri aralık dışı',    { slicerush_dayStreak: '900' }],
  ['hepsi birden',        { slicerush_blade: '99', slicerush_level: '-5',
                            slicerush_coins: '"muz"', slicerush_blades: 'null',
                            slicerush_stars: '7', slicerush_stats: '[]' }],
];

console.log('\n1) Bozuk anahtarla oyun açılıyor mu');
const sonuc = [];
for (const [ad, k] of VAKALAR) {
  const d = await dene(k);
  sonuc.push({ ad, d });
  console.log(`     ${ad.padEnd(34)} açıldı:${d.acildi ? 'E' : 'H'}` +
    ` kasa:${JSON.stringify(d.kasa)} menü:"${d.menu}" tur:${d.tur || '—'}` +
    (d.hata && d.hata.length ? `  HATA ${d.hata[0].slice(0, 44)}` : ''));
}
ok(sonuc.every(r => r.d.acildi), 'hepsinde oyun açıldı',
   sonuc.filter(r => !r.d.acildi).map(r => r.ad).join(', '));
ok(sonuc.every(r => !r.d.hata.length), 'hiçbirinde sayfa hatası yok',
   sonuc.filter(r => r.d.hata.length).map(r => r.ad).join(', '));

console.log('\n2) Bozuk değer oyuna sızmıyor');
// Ekranda "🪙 muz" yazması, kaydın ekrana olduğu gibi aktığının
// kanıtı — ve bir sonraki hesabın NaN olacağının.
ok(sonuc.every(r => typeof r.d.kasa === 'number' && isFinite(r.d.kasa)),
   'kasa her vakada sayı',
   sonuc.filter(r => typeof r.d.kasa !== 'number').map(r => r.ad).join(', '));
ok(sonuc.every(r => /^🪙 \d+$/.test(r.d.menu)), 'menüde sayıdan başka şey yazmıyor',
   sonuc.filter(r => !/^🪙 \d+$/.test(r.d.menu)).map(r => `${r.ad}:"${r.d.menu}"`).join(', '));

console.log('\n3) Bozuk kayıtla tur oynanabiliyor');
ok(sonuc.every(r => r.d.tur && r.d.tur !== 'playing'),
   'her vakada bir tur baştan sona yürüdü',
   sonuc.filter(r => !r.d.tur || r.d.tur === 'playing').map(r => r.ad).join(', '));

console.log('\n4) Sağlam kayıt yanlışlıkla atılmıyor');
// Ters hata daha pahalı: çalışan bir ilerlemeyi sıfırlamak.
const saglam = await dene({
  slicerush_level: '14', slicerush_coins: '2500',
  slicerush_blades: '[0,1,2]', slicerush_blade: '2',
  slicerush_stars: '{"1":3,"2":2}', slicerush_dayStreak: '4',
});
console.log(`     bölüm ${saglam.bolum} · kasa ${saglam.kasa} · menü "${saglam.menu}"`);
ok(saglam.acildi && saglam.kasa === 2500 && saglam.bolum === 14,
   'sağlam kayıt olduğu gibi korundu', `${saglam.bolum} / ${saglam.kasa}`);

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
