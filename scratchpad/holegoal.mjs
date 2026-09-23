// Hedef rozeti: ne topladığını söylüyor mu, sayı doğru mu, ve oynamadığın
// zaman ekranda kalıyor mu?
//
//   node build-www.mjs && node scratchpad/holegoal.mjs
//
// Neden var: rozet oyunun "ne topluyorum" sorusuna verdiği tek net cevap.
// İlerleme çubuğu "ne kadar" diyor ama "ne" demiyor ve sayı taşımıyor.
// Üç şekilde sessizce bozulabilir:
//
//   1. Sayı yanlış kaynaktan okunursa görev bölümünde tarlanın tamamını
//      sayar ve oyuncu yarıdayım sanırken bölüm biter — ilerleme çubuğunda
//      bir kez tam olarak bu olmuştu.
//   2. Bitiş perdesi açıldığında gizlenmezse perdenin üstünde asılı kalır.
//      `updateProgressUI` o noktadan sonra bir daha çağrılmıyor, yani onu
//      gizleyecek kimse yok.
//   3. Sayı desen satırında da durursa ikisinden biri güncellenip öteki
//      unutulur. Bu yüzden desen satırında **sayı olmamalı**.
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
}).listen(8306);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

const oku = () => ({
  gorunur: getComputedStyle(document.getElementById('goalTag')).display !== 'none',
  ico: document.getElementById('goalIco').textContent,
  n: document.getElementById('goalN').textContent,
  desen: document.getElementById('patternTag').textContent,
});

async function bolum(pg, lvl) {
  await pg.evaluate(n => localStorage.setItem('fruithole_level', String(n)), lvl);
  await pg.reload({ waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
  await pg.waitForTimeout(2200);
  if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
  // Menüde rozet durmamalı.
  const menude = await pg.evaluate(oku);
  await pg.click('#playBtn');
  await pg.waitForTimeout(2200);
  return { menude, oyunda: await pg.evaluate(oku) };
}

const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8306/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });

// 4 sıradan, 5 sipariş, 15 devler, 25 hız, 35 mayın.
console.log('bölüm  rozet     desen satırı');
for (const [lvl, bekIco] of [[4, '🍇'], [5, '📋'], [15, '🍉'], [25, '⏱'], [35, '💣']]) {
  const r = await bolum(pg, lvl);
  console.log(`  ${String(lvl).padStart(2)}   ${r.oyunda.ico} ${r.oyunda.n.padEnd(9)} ${r.oyunda.desen}`);
  check(r.oyunda.gorunur, `${lvl}: rozet oyunda görünüyor`);
  check(!r.menude.gorunur, `${lvl}: rozet menüde görünmüyor`);
  check(r.oyunda.ico === bekIco, `${lvl}: simge doğru`, `${r.oyunda.ico} (beklenen ${bekIco})`);
  // Sayı "a/b" biçiminde ve hedef sıfırdan büyük.
  const m = /^(\d+)\/(\d+)$/.exec(r.oyunda.n);
  check(!!m && Number(m[2]) > 0, `${lvl}: sayı a/b biçiminde ve hedef dolu`, r.oyunda.n);
  // Desen satırında sayı kalmamalı: aynı sayının iki yerde durması, birinin
  // güncellenip ötekinin unutulacağı yer.
  check(!/\d+\/\d+/.test(r.oyunda.desen), `${lvl}: desen satırında sayı yok`,
    r.oyunda.desen);
}

// Sayı görevin kaynağından mı geliyor? Sipariş bölümünde tarlanın tamamı
// değil hedef meyve sayılmalı — ilerleme çubuğunda bir kez bu yanlış olmuştu.
console.log('\nsayı doğru kaynaktan mı:');
await bolum(pg, 5);
const kaynak = await pg.evaluate(() => {
  const o = window.fruitHoleOrder();
  return { rozet: document.getElementById('goalN').textContent,
           hedef: o.goal, done: o.done, tahta: o.total };
});
console.log(`  rozet ${kaynak.rozet} · görev hedefi ${kaynak.hedef} · tahtada ${kaynak.tahta} parça`);
check(kaynak.rozet === `${kaynak.done}/${kaynak.hedef}`,
  'rozet görev sayacını gösteriyor, tarlanın tamamını değil', kaynak.rozet);

// Bitiş perdesi: rozet gizlenmeli.
console.log('\nbitiş perdesi:');
await pg.evaluate(() => window.fruitHoleTimeUp());
await pg.waitForTimeout(700);
const son = await pg.evaluate(oku);
console.log(`  perde açıkken rozet görünür mü: ${son.gorunur ? 'evet' : 'hayır'}`);
check(!son.gorunur, 'bitiş perdesinde rozet gizleniyor');

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
