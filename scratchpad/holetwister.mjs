// Kasırga boosterı doğru şeyi mi siliyor, ve dört yuva ekrana sığıyor mu?
//
//   node build-www.mjs && node scratchpad/holetwister.mjs
//
// Neden var: kasırga tahtadan bir parça siliyor ve **neyi silmediği**
// tasarımın kendisi. Üçü de sessizce bozulabilir ve üçü de oynamadan
// görünmez:
//
//   1. Devi alırsa, oyunun tek büyüme kapısı 130 çileğe satılmış olur —
//      bir bölümün asıl işi deve yetişecek kadar büyümek.
//   2. Bombayı alırsa, sıkıştığın yeri boşaltmak için bastığın düğme
//      saatinden yirmi saniye götürebilir. Yardım eden bir şeyin
//      cezalandırması, en kötü türden sürpriz.
//   3. Hiçbir şey almazsa (yarıçap ya da koşul yanlışsa) düğme harcanır ve
//      ekranda hiçbir şey olmaz.
//
// Dördüncüsü yerleşim: bar artık dört yuva taşıyor ve dar bir telefonda
// taşarsa son booster ekranın dışında kalır.
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
}).listen(8304);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// --- 1. Etki -----------------------------------------------------------
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
// 35: mayın bölümü, yani tahtada bol bomba var — kasırganın onlara
// dokunmadığını ölçmenin en dolu yeri.
await pg.addInitScript(() => localStorage.setItem('fruithole_level', '35'));
await pg.goto('http://localhost:8304/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleUseBooster, { timeout: 60000 });
await pg.waitForTimeout(2500);
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2500);

console.log('kasırga:');
const r = await pg.evaluate(() => {
  // Deliği bombaların ortasına koy ve ağzı biraz aç: hem sıradan meyve hem
  // bomba hem de yutulamayacak bir dev menzilde olsun.
  const b = window.fruitHoleBombs();
  if (b.sayi) window.fruitHolePushTest(b.yerler[0].x, b.yerler[0].z, 0.9);
  window.fruitHoleBoosters();
  const once = {
    canli: window.fruitHoleWhere().left,
    bomba: window.fruitHoleBombs().sayi,
    dev: window.fruitHoleGiantList().length,
    saat: window.fruitHoleWhere().timeLeft,
    yenen: window.fruitHoleWhere().eaten,
  };
  window.fruitHoleUseBooster('twister');
  const sonra = {
    canli: window.fruitHoleWhere().left,
    bomba: window.fruitHoleBombs().sayi,
    dev: window.fruitHoleGiantList().length,
    saat: window.fruitHoleWhere().timeLeft,
    yenen: window.fruitHoleWhere().eaten,
  };
  return { once, sonra };
});
const silinen = r.once.canli - r.sonra.canli;
console.log(`  ${silinen} parça silindi · bomba ${r.once.bomba} -> ${r.sonra.bomba} · ` +
  `dev ${r.once.dev} -> ${r.sonra.dev} · saat ${r.once.saat} -> ${r.sonra.saat}`);
check(silinen > 0, 'kasırga bir şey siliyor', `${silinen} parça`);
check(r.sonra.bomba === r.once.bomba, 'kasırga bombayı almıyor',
  `${r.once.bomba} -> ${r.sonra.bomba}`);
check(Math.abs(r.sonra.saat - r.once.saat) < 0.2, 'kasırga saatten bir şey götürmüyor',
  `${r.once.saat} -> ${r.sonra.saat}`);
// Yenen sayacı silinen kadar artmalı: kasırgayla alınan parça da bölümü
// bitirmeye sayılıyor, yoksa düğme hedefi ulaşılmaz yapardı.
check(r.sonra.yenen - r.once.yenen === silinen, 'silinen parçalar hedefe sayılıyor',
  `sayaç +${r.sonra.yenen - r.once.yenen}, silinen ${silinen}`);
await pg.close();

// Devi almıyor: ağzı deve yetmeyecek kadar küçük tutup menzile bir dev koy.
const pg2 = await br.newPage({ viewport: { width: 412, height: 915 } });
await pg2.addInitScript(() => localStorage.setItem('fruithole_level', '19'));
await pg2.goto('http://localhost:8304/', { waitUntil: 'domcontentloaded' });
await pg2.waitForFunction(() => window.fruitHoleUseBooster, { timeout: 60000 });
await pg2.waitForTimeout(2500);
if (await pg2.isVisible('#dailyBtn')) await pg2.click('#dailyBtn');
await pg2.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
await pg2.click('#playBtn');
await pg2.waitForTimeout(2500);
const d = await pg2.evaluate(() => {
  const g = window.fruitHoleGiantList();
  if (!g.length) return null;
  // Deliği devin dibine koy ama ağzı ona yetmeyecek kadar dar bırak.
  window.fruitHolePushTest(g[0].x + 1, g[0].z, 0.6);
  const once = window.fruitHoleGiantList().length;
  window.fruitHoleUseBooster('twister');
  return { once, sonra: window.fruitHoleGiantList().length, devR: g[0].r };
});
if (d) {
  console.log(`  dev ${d.once} -> ${d.sonra} (yarıçap ${d.devR}, ağız 0.6)`);
  check(d.sonra === d.once, 'kasırga yutamayacağın devi almıyor');
}
await pg2.close();

// --- 2. Yerleşim: dört yuva dar ekrana sığıyor mu? ---------------------
console.log('\ndört yuva:');
for (const [w, h] of [[360, 640], [320, 568]]) {
  const p3 = await br.newPage({ viewport: { width: w, height: h } });
  // 13. bölüm: dördüncü booster açık.
  await p3.addInitScript(() => localStorage.setItem('fruithole_level', '13'));
  await p3.goto('http://localhost:8304/', { waitUntil: 'domcontentloaded' });
  await p3.waitForFunction(() => window.fruitHoleUseBooster, { timeout: 60000 });
  await p3.waitForTimeout(2500);
  if (await p3.isVisible('#dailyBtn')) await p3.click('#dailyBtn');
  await p3.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
  await p3.click('#playBtn');
  await p3.waitForTimeout(1800);
  const g = await p3.evaluate(() => {
    const s = [...document.querySelectorAll('#boosterBar .slot')];
    const r = s.map(e => e.getBoundingClientRect());
    return { n: s.length, sol: Math.min(...r.map(x => x.left)),
             sag: Math.max(...r.map(x => x.right)), w: innerWidth };
  });
  console.log(`  ${w}x${h}: ${g.n} yuva, ${Math.round(g.sol)}-${Math.round(g.sag)} px (ekran ${g.w})`);
  check(g.n === 4, `${w}px: dört yuva var`, `${g.n}`);
  check(g.sol >= 0 && g.sag <= g.w, `${w}px: yuvalar ekranın içinde`,
    `${Math.round(g.sol)}-${Math.round(g.sag)} / ${g.w}`);
  await p3.close();
}

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
