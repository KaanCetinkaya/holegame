// Bombalar: doğru bölümlerde, doğru sayıda, doğru yerde — ve bölümü
// bitirmeyi engellemiyorlar mı?
//
//   node build-www.mjs && node scratchpad/holebomb.mjs
//
// Neden var: bomba, tahtadaki ilk ceza. Bir cezanın üç şekilde sessizce
// bozulması mümkün ve üçü de oynamadan görünmüyor:
//
//   1. Bitirme şartına girerse, "kaçın" denen şeyi yemek zorunlu olur ve
//      bölüm hiç bitmez. `levelGoal` onu saymamalı.
//   2. Deliğin doğduğu yerin dibine düşerse, oyuncu daha hiçbir şey görmeden
//      cezalandırılır.
//   3. Yeni oyuncuya çıkarsa, oyunun ne olduğunu öğrenmeden ceza almış olur.
//
// Dördüncüsü de var ve bu testin asıl işi: bombayı yutmak gerçekten saatten
// düşüyor mu. Sayaç akarken beş saniyenin gidip gitmediği gözle
// anlaşılmıyor, o yüzden bomba sayfanın içinden yediriliyor.
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
}).listen(8296);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8296/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleBombs, { timeout: 60000 });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// 1-5: bombasız bölümler. 6 ve sonrası: bombalı.
console.log('bölüm başına bomba:');
const satir = [];
for (const n of [1, 3, 5, 6, 10, 14, 19, 24, 35]) {
  const d = await pg.evaluate(lv => {
    window.fruitHoleProbe(lv);
    return window.fruitHoleBombs();
  }, n);
  satir.push({ n, ...d });
  console.log(`  ${String(n).padStart(2)}. bölüm — ${String(d.sayi).padStart(2)} bomba / ` +
    `${String(d.toplam).padStart(3)} parça · hedef ${d.hedef} · ` +
    `doğuş yerine en yakın ${d.enYakin ?? '-'}`);
}

const erken = satir.filter(r => r.n < 6);
// 35 mayın bölümü: tahtası bilerek bomba dolu, sıradan bölümün ölçüsüyle
// bakılırsa "bomba payı %3'ün altında" kuralını düşürür.
const gec = satir.filter(r => r.n >= 6 && r.n !== 35);
const mayin = satir.find(r => r.n === 35);
check(erken.every(r => r.sayi === 0), 'ilk beş bölümde bomba yok',
  `en çok ${Math.max(...erken.map(r => r.sayi))}`);
check(gec.every(r => r.sayi > 0), '6. bölümden sonra her tahtada bomba var',
  `en az ${Math.min(...gec.map(r => r.sayi))}`);
check(satir.every(r => r.hedefDisi), 'bombalar bitirme şartına girmiyor');
check(gec.every(r => r.enYakin > 4.5), 'bomba deliğin doğduğu yerin dibinde değil',
  `en yakın ${Math.min(...gec.map(r => r.enYakin))}`);
// Sayı bir tahtada elle sayılabilecek kadar az olmalı: bomba nadir bir tehdit,
// tarlanın dokusu değil.
const pay = gec.map(r => r.sayi / r.toplam);
check(Math.max(...pay) < 0.03, 'bomba payı %3\'ün altında',
  `en yüksek %${(Math.max(...pay) * 100).toFixed(1)}`);
// Aynı hücrede iki bomba: ikisi de zemine konduğu için üst üste biniyor ve
// oyuncu tek bomba görüp iki ceza yiyor.
const cakisan = gec.filter(r => new Set(r.yerler.map(y => y.x + ',' + y.z)).size !== r.yerler.length);
check(cakisan.length === 0, 'iki bomba aynı hücrede değil',
  cakisan.length ? `${cakisan.map(r => r.n + '. bölüm').join(', ')}` : '');

// Mayın bölümü: tahta gerçekten dolu mu?
//
// Dördüncü görev tipi bomba katmanının üstüne kuruldu ve tek farkı bu oran.
// Oran sessizce sıradan seviyeye düşerse bölüm "mayın tarlası" der ve
// sıradan bir süpürme bölümü olur — üstelik saatinde dört bombalık fazladan
// payla, yani öncekinden **kolay**.
console.log('\nmayın bölümü (35):');
const mayinPay = mayin.sayi / mayin.toplam;
console.log(`  ${mayin.sayi} bomba / ${mayin.toplam} parça — %${(mayinPay * 100).toFixed(1)}`);
check(mayinPay > 0.04, 'mayın bölümünde bomba payı %4\'ün üstünde',
  `%${(mayinPay * 100).toFixed(1)}`);
check(mayin.sayi > gec.reduce((a, r) => Math.max(a, r.sayi), 0) * 2,
  'mayın bölümünde sıradan bölümün iki katından çok bomba var',
  `${mayin.sayi} karşı en çok ${gec.reduce((a, r) => Math.max(a, r.sayi), 0)}`);
check(mayin.hedefDisi, 'mayın bölümünde de bombalar hedefe girmiyor');

// Bombayı yut: saat gerçekten düşüyor mu?
console.log('\nbombayı yutmak:');
await pg.evaluate(() => { localStorage.setItem('fruithole_level', '10'); });
await pg.reload({ waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleBombs, { timeout: 60000 });
await pg.waitForTimeout(2500);
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2500);

// Olay sayfanın içinden: deliği bombanın üstüne koyup bir kare ilerletmek,
// zamanlamaya bağlı bir testten daha az kırılgan (konteynerde GPU yok).
const yut = await pg.evaluate(() => {
  const b = window.fruitHoleBombs();
  const once = window.fruitHoleWhere().timeLeft;
  const r = window.fruitHoleEatBomb();
  return { once, sonra: window.fruitHoleWhere().timeLeft, b, r };
});
const dusen = +(yut.once - yut.sonra).toFixed(1);
console.log(`  saat ${yut.once} -> ${yut.sonra} (${dusen} sn) · ` +
  `sayaç +${yut.r.sayacArtisi} · yanında ${yut.r.yanindakiler} sıradan parça gitti`);
check(yut.r.yutuldu, 'bomba yutuluyor (her boyutta yutulabilir olmalı)');
check(Math.abs(dusen - yut.b.maliyet) < 0.6, `bomba saatten ${yut.b.maliyet} sn götürüyor`,
  `${dusen} sn`);
// Sayaç yalnızca yanındaki sıradan parçalar kadar artmalı: bombanın kendi
// payı sıfır.
check(yut.r.sayacArtisi === yut.r.yanindakiler, 'bomba yenen sayacına girmiyor',
  `sayaç +${yut.r.sayacArtisi}, sıradan parça ${yut.r.yanindakiler}`);

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
