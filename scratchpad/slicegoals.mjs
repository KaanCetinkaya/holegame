// Hedefler: sayıyor mu, ödüyor mu, iki kez ödüyor mu?
//
//   node build-www.mjs && node scratchpad/slicegoals.mjs
//
// Neden var: hedefler oyunun tek meta katmanı ve üç yerde sessizce
// bozulabilir.
//
//   1. Sayaç kaydedilmezse ilerleme uygulamayı kapatınca sıfırlanır — ve bu
//      ancak oyuncu geri dönüp "hani benim 900 kesimim" dediğinde görünür.
//   2. Ödül iki kez ödenirse para ekonomisi çöker; dükkânın bütün fiyatları
//      ona göre ayarlandı.
//   3. Zincirin ikinci halkası birincisi alınmadan görünürse liste dokuz
//      satırlık bir yapılacaklar listesine dönüyor — tasarımın istediği şey
//      değil.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8193);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
await pg.goto('http://localhost:8193/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceGoals === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// --- 1. sıfırdan başlıyor ---
console.log('1) Yeni oyuncu');
let g = await pg.evaluate(() => window.sliceGoals());
check(g.stats.cuts === 0 && g.stats.runs === 0, 'sayaçlar sıfır',
  JSON.stringify(g.stats));
check(g.list.every(x => !x.taken), 'hiçbiri alınmamış');
check(g.gizli.length > 0, 'zincirin ikinci halkaları gizli', g.gizli.join(', '));
check(g.nokta === false, 'alınacak bir şey yokken nokta yanmıyor');

// --- 2. oynayınca sayıyor mu ---
console.log('\n2) Bir tur oynandıktan sonra');
const once = g.stats.cuts;
await pg.evaluate(async () => {
  window.sliceStart(1);
  await new Promise(res => {
    const t = setInterval(() => {
      window.sliceAutoPlay();
      if (window.sliceProbe().state !== 'playing') { clearInterval(t); res(); }
    }, 16);
    setTimeout(() => { clearInterval(t); res(); }, 30000);
  });
});
g = await pg.evaluate(() => window.sliceGoals());
console.log(`  kesim ${g.stats.cuts}, tur ${g.stats.runs}, bitirilen ${g.stats.cleared}`);
check(g.stats.cuts > once, 'kesim sayacı arttı');
check(g.stats.runs === 1, 'tur sayacı arttı', String(g.stats.runs));

// --- 3. kayıt kalıcı mı ---
//
// Sayfa yeniden yükleniyor: kaydedilmeyen bir sayaç burada sıfıra düşer ve
// bu, oyuncunun uygulamayı kapatıp açmasıyla birebir aynı şey.
console.log('\n3) Sayfa yenilendikten sonra');
const kesimOnce = g.stats.cuts;
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceGoals === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');
g = await pg.evaluate(() => window.sliceGoals());
check(g.stats.cuts === kesimOnce, 'kesim sayacı kayıtta duruyor',
  `${g.stats.cuts} / ${kesimOnce}`);

// --- 4. hedef sağlanınca ödüyor, iki kez ödemiyor ---
console.log('\n4) Ödeme');
const ilk = await pg.evaluate(() => {
  // Bir hedefi sağlanır hâle getir: para hedefi yok, o yüzden bıçak alarak
  // `blades3`'ü değil, doğrudan kesim sayacını şişirmek gerek. En kolayı
  // kombo: rekor kaydı ayrı tutuluyor.
  localStorage.setItem('slicerush_combo', '12');
  return true;
});
await pg.reload({ waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceGoals === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');
g = await pg.evaluate(() => window.sliceGoals());
const c10 = g.list.find(x => x.id === 'combo10');
check(!!c10 && c10.claimable, 'x12 kombo ile combo10 alınabilir oldu',
  c10 ? `at ${c10.at}/${c10.goal}` : 'hedef yok');
check(g.nokta === true, 'menüdeki nokta yandı');

const kasaOnce = await pg.evaluate(() => window.sliceMeta().coins);
const sonra1 = await pg.evaluate(() => window.sliceTakeGoal('combo10'));
const kasa1 = await pg.evaluate(() => window.sliceMeta().coins);
check(kasa1 === kasaOnce + 300, 'ödül kasaya yattı', `${kasaOnce} -> ${kasa1}`);
check(sonra1.list.find(x => x.id === 'combo10').taken, 'hedef alınmış işaretlendi');

// İkinci kez: hiçbir şey olmamalı.
await pg.evaluate(() => window.sliceTakeGoal('combo10'));
const kasa2 = await pg.evaluate(() => window.sliceMeta().coins);
check(kasa2 === kasa1, 'ikinci kez ödemiyor', `${kasa1} -> ${kasa2}`);

// --- 5. ekran gerçekten açılıyor mu ---
//
// Probe'a bakmak yetmiyor: hedefler doğru sayılırken ekranın hiç
// açılmaması mümkün ve bir tur öyle oldu — `goals`, showScreen'in tanıdığı
// ekranlar listesine eklenmemişti, düğme her şeyi gizleyip hiçbir şey
// göstermiyordu. Testin DOM'a bakması şart.
console.log('\n5) Ekran');
const ekran = await pg.evaluate(() => {
  document.getElementById('goalsBtn').click();
  const el = document.getElementById('goals');
  return {
    acik: el.classList.contains('show'),
    gorunur: el.getBoundingClientRect().height > 100,
    satir: document.querySelectorAll('#goalList .goal').length,
    menuKapali: !document.getElementById('menu').classList.contains('show'),
  };
});
check(ekran.acik, 'hedef ekranı açıldı');
check(ekran.gorunur, 'ekran gerçekten çiziliyor (yüksekliği var)');
check(ekran.satir > 0, 'listede satır var', String(ekran.satir));
check(ekran.menuKapali, 'menü kapandı');

// --- 6. zincir açılıyor mu ---
console.log('\n6) Zincir');
g = await pg.evaluate(() => window.sliceGoals());
check(g.list.some(x => x.id === 'combo25'), 'combo10 alınınca combo25 göründü',
  g.gizli.join(', ') || '(gizli kalmadı)');

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
