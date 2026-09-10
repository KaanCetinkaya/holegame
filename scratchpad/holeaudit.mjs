// Üretim öncesi geniş tarama: bir yerde hata fırlatıyor mu, bir yerde
// takılıyor mu?
//
//   node build-www.mjs && node scratchpad/holeaudit.mjs
//
// Şimdiye kadarki testler tek tek özellikleri ölçüyordu — boyut kapısı,
// reklam yerleşimi, günlük meydan okuma. Hiçbiri "her yeri gez, bir şey
// patlıyor mu" sorusunu sormuyordu. Kapalı testte 12 kişi vardı ve iki hatayı
// ancak birinin telefon fotoğrafı yakaladı; üretimde o 12 kişi milyon olabilir
// ve orada bir çökme yorum ve iade demek.
//
// Burada aranan şey doğruluk değil, **sağlamlık**: sıfırdan kurulmuş bir
// profille bütün ekranlar açılıyor mu, 19 desenin hepsi kuruluyor mu, ve
// bunların hiçbirinde konsola bir istisna düşüyor mu.

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
}).listen(8215);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const errs = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Sıfırdan kurulmuş bir telefon: hiçbir kayıt yok, hiçbir şey satın
// alınmamış, hiçbir bölüm geçilmemiş. Yeni oyuncunun gördüğü şey bu ve
// geliştirirken en az bakılan hal.
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
const pg = await ctx.newPage();
pg.on('pageerror', e => errs.push('sayfa: ' + String(e)));
// favicon hariç: tarayıcı onu kendiliğinden istiyor, oyun istemiyor, ve
// Capacitor kabuğunda böyle bir istek zaten olmuyor. Test sunucusunun
// gürültüsünü hata diye saymak, gerçek bir hata çıktığında onu görmeyi
// zorlaştırmaktan başka işe yaramaz.
pg.on('console', m => {
  if (m.type() !== 'error') return;
  if (/favicon\.ico/.test(m.text() + m.location().url)) return;
  errs.push('konsol: ' + m.text());
});
pg.on('response', r => {
  if (r.status() >= 400 && !/favicon\.ico/.test(r.url())) {
    errs.push(`HTTP ${r.status()} ${r.url()}`);
  }
});

await pg.goto('http://localhost:8215/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.waitForTimeout(1500);

// Yeni oyuncunun gördüğü ilk ekran.
//
// Eskiden burada günlük ödül ekranı vardı — oyun oynanmadan önce. "Day 1
// streak" hiçbir şeyin serisi, 35 muz henüz görülmemiş bir dükkânın parası,
// ve en üstteki yeşil düğme oyunun ilk isteğini bir reklam izlemek yapıyordu.
// Artık oyuncu bir şey bitirene kadar beklıyor; ödül kaybolmuyor, ertesi
// açılışta bir anlamı olduğu yerde duruyor.
console.log('\n1. sıfırdan kurulum');
check(!(await pg.isVisible('#daily')), 'ilk açılışta günlük ödül ekranı YOK');
check(await pg.isVisible('#playBtn'), 'doğrudan menü geliyor, Play görünüyor');
// Menü sahnesi de kurulmuş olmalı. showMenu() bir zamanlar yalnızca günlük
// ekranı kapatılınca çağrılıyordu, yani o ekranın çıkmadığı her açılışta
// menünün arkasında 1. bölümün tarlası duruyordu.
check(await pg.evaluate(() => window.fruitHoleWhere().state === 'menu'),
  'menü sahnesi kuruldu');
const ver = (await pg.textContent('#verTag') || '').trim();
check(/^v?\d/.test(ver) || ver === 'dev', 'sürüm yazısı var', ver);
const purse0 = await pg.evaluate(() => window.fruitHoleWallet());
check(Object.values(purse0).every(v => v === 0), 'yeni oyuncunun kesesi boş',
  JSON.stringify(purse0));

// Bütün ekranlar açılıp kapanıyor mu? Bir tanesi açılmazsa oyuncu orada
// sıkışır ve geri dönüş yolu yoktur.
console.log('\n2. her ekran açılıp kapanıyor');
const screens = [
  ['levelsBtn', 'levels', 'levelsClose'],
  ['upgBtn', 'upgrades', 'upgClose'],
  ['goalsBtn', 'goals', 'goalsClose'],
  ['awardsBtn', 'goals', 'goalsClose'],
];
for (const [btn, screen, close] of screens) {
  await pg.click('#' + btn);
  await pg.waitForTimeout(500);
  const open = await pg.evaluate(s => document.getElementById(s).classList.contains('show'), screen);
  await pg.evaluate(c => { const e = document.getElementById(c); if (e) e.click(); }, close);
  await pg.waitForTimeout(400);
  const shut = await pg.evaluate(s => !document.getElementById(s).classList.contains('show'), screen);
  check(open && shut, `${btn} açılıp kapanıyor`);
}
check(await pg.isVisible('#playBtn'), 'ekranlardan sonra menüye dönülüyor');

// Bütün desenler kuruluyor mu? Ondokuz desen var ve bir tanesi bir istisna
// fırlatırsa oyuncu o bölüme geldiğinde oyun duruyor — kapalı testte kimse
// 45. bölümün ötesine geçmedi, yani orası hiç görülmedi.
console.log('\n3. bütün desenler kuruluyor');
const bad = [];
const stats = [];
for (let lvl = 1; lvl <= 40; lvl++) {
  const before = errs.length;
  const r = await pg.evaluate((n) => {
    const p = window.fruitHoleProbe(n);
    const g = window.fruitHoleGrow();
    return { pattern: p.pattern, fruit: p.fruit, seconds: p.seconds, left: g.left };
  }, lvl);
  if (errs.length > before) bad.push(`${lvl} (${r.pattern})`);
  if (!r.fruit || !r.left) bad.push(`${lvl} (${r.pattern}) boş tarla`);
  if (!r.seconds || r.seconds < 20) bad.push(`${lvl} (${r.pattern}) saat ${r.seconds}sn`);
  stats.push(r);
}
check(bad.length === 0, '1-40 arası her bölüm kuruldu, tarlası ve saati var',
  bad.length ? bad.join(', ') : `${stats.length} bölüm`);

const names = [...new Set(stats.map(s => s.pattern))];
check(names.length >= 19, 'ondokuz desenin hepsi göründü', `${names.length} desen`);

// Oyunun bittiği yer yok: 200. bölüm de kurulabiliyor mu? Desenler mod ile
// döndüğü için kurulmalı, ama satır sayısı ve büyüme oranı orada da makul
// kalmalı — sonsuz bir oyunda hiç bakılmayan yer burası.
console.log('\n4. çok ileri bölümler');
for (const n of [100, 250, 999]) {
  const before = errs.length;
  const r = await pg.evaluate((lvl) => {
    const p = window.fruitHoleProbe(lvl);
    return { pattern: p.pattern, fruit: p.fruit, seconds: p.seconds };
  }, n);
  check(errs.length === before && r.fruit > 0 && r.seconds > 20,
    `${n}. bölüm kuruluyor`, `${r.pattern}, ${r.fruit} meyve, ${r.seconds}sn`);
}

// Bir bölümü baştan sona oyna: düşme, yeme, bitiş ekranı, sandık, sonraki
// bölüm. Zincirin herhangi bir halkası kopsa oyuncu ilerleyemez.
console.log('\n5. bir bölümün tam turu');
await pg.evaluate(() => { localStorage.setItem('fruithole_level', '1'); });
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
// Yalnızca ekran gerçekten açıksa tıkla. `if (d) d.click()` gizli düğmeye de
// basıyor ve işleyici ekranın görünürlüğüne bakmadan ödülü alıyordu; test
// böylece günlük ödülü sessizce tüketip sonraki bölümde "çıkmıyor" diyordu.
if (await pg.isVisible('#daily')) {
  await pg.click('#dailyBtn');
}
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2500);
check(await pg.evaluate(() => window.fruitHoleWhere().state === 'playing'), 'bölüm başladı');
await pg.evaluate(() => window.fruitHoleClear());
await pg.waitForTimeout(1500);
check(await pg.isVisible('#overlay'), 'bitiş ekranı geldi');
check(await pg.isVisible('#chest'), 'sandık düştü');
await pg.click('#chest');
await pg.waitForTimeout(800);
const purseChest = await pg.evaluate(() => window.fruitHoleWallet());
check(Object.values(purseChest).some(v => v > 0), 'sandık meyve verdi',
  JSON.stringify(purseChest));
const lvlAfter = await pg.evaluate(() => localStorage.getItem('fruithole_level'));
check(lvlAfter === '2', 'bölüm ilerledi', `bölüm ${lvlAfter}`);
await pg.evaluate(() => document.getElementById('actionBtn').click());
await pg.waitForTimeout(2500);
check(await pg.evaluate(() => window.fruitHoleWhere().state === 'playing'), 'sonraki bölüm başladı');

// Bir bölüm bitirildikten sonra: ödül artık bir anlam taşıyor ve çıkmalı.
console.log('\n6. ikinci açılış');
await pg.evaluate(() => { const b = document.getElementById('toMenuBtn'); if (b) b.click(); });
await pg.waitForTimeout(600);
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.waitForTimeout(1600);
check(await pg.isVisible('#daily'), 'oynadıktan sonraki açılışta günlük ödül çıkıyor');
const order = await pg.evaluate(() => {
  const d = document.getElementById('daily');
  const ids = [...d.querySelectorAll('button')].map(b => b.id);
  return ids;
});
check(order.indexOf('dailyBtn') < order.indexOf('daily2x'),
  'bedava olan düğme önce geliyor, reklam olan sonra', order.join(' > '));

console.log('\nhatalar: ' + (errs.length ? '\n  ' + errs.join('\n  ') : 'yok'));
console.log(fails.length || errs.length
  ? `\n${fails.length} kontrol düştü, ${errs.length} istisna`
  : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
