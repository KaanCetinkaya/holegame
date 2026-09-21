// Oyun her kayıtlı bölümde açılıyor mu?
//
//   node build-www.mjs && node scratchpad/holeboot.mjs
//
// Neden var: aynı hata üç kez çıktı ve üçünde de sebep aynıydı — sayfa
// açılırken çalışan bir satır, dosyanın daha aşağısında `const` ile duran bir
// şeyi okuyor. JavaScript bunu hata sayıyor, modül orada duruyor, ve yükleme
// perdesi hiç kalkmıyor. Oyun açılmıyor.
//
// Üçüncüsü gerçek bir kullanıcıya çıkacaktı: sipariş görevi tarla kurulurken
// hesaplanıyor ve deliğin hızını okuyor, hız ise dosyanın en sonunda
// tanımlıydı. Yani **kaydı 5. bölümde olan herkes** için oyun açılmıyordu.
// Birinci bölümde açılıyordu, çünkü orada görev yok — yani her zamanki
// denemeler bunu göremezdi.
//
// Test bu yüzden bölüm numarası gezdiriyor: sıradan bölüm, sipariş bölümü,
// patron bölümü, ikinci tur, ve dördüncü tur.
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
}).listen(8276);

// Sahte saat: make-clips.mjs ve holeorderplay.mjs bununla oynuyor, ve üçüncü
// hata tam olarak bu kurulumda göründü. Gerçek saatle de bakılıyor, çünkü
// ikisi açılışta farklı yollardan geçiyor.
const FAKE_CLOCK = () => {
  let t = 0;
  const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) { try { cb(t); } catch (e) {} } };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const BOLUMLER = [
  [1, 'ilk bölüm'],
  [5, 'sipariş bölümü'],
  [10, 'patron bölümü'],
  [13, 'tahtanın büyüdüğü yer'],
  [25, 'ikinci tur, çevrilmiş tahta'],
  [35, 'ikinci turun siparişi'],
  [73, 'dördüncü tur'],
];

for (const sahte of [false, true]) {
  console.log(`\n--- ${sahte ? 'sahte saatle' : 'gerçek saatle'} ---`);
  for (const [lvl, not] of BOLUMLER) {
    const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    if (sahte) await pg.addInitScript(FAKE_CLOCK);
    await pg.addInitScript(n => localStorage.setItem('fruithole_level', String(n)), lvl);
    await pg.goto('http://localhost:8276/', { waitUntil: 'domcontentloaded' });
    let acildi = true;
    try {
      // Yükleme perdesinin kalkması, modülün sonuna kadar çalıştığının tek
      // kanıtı: perdeyi kaldıran satır dosyanın en sonunda.
      await pg.waitForFunction(() => {
        const l = document.getElementById('loading');
        return !l || getComputedStyle(l).display === 'none';
      }, { timeout: 30000 });
    } catch (e) { acildi = false; }
    // Menüye kadar git. Birinci bölümdeki yeni profil doğrudan menüye
    // düşüyor, ilerlemiş bir kayıtta önce günlük meydan okuma ekranı geliyor
    // — yani "Play düğmesi görünüyor mu" sorusu, ekranı kapatmadan sorulursa
    // oyunda olmayan bir hata uydurur.
    let oynanir = false;
    if (acildi) {
      if (sahte) for (let i = 0; i < 30; i++) await pg.evaluate(() => window.__step(1000 / 30));
      if (await pg.isVisible('#dailyBtn')) {
        await pg.click('#dailyBtn');
        if (sahte) for (let i = 0; i < 10; i++) await pg.evaluate(() => window.__step(1000 / 30));
      }
      oynanir = await pg.isVisible('#playBtn');
    }
    console.log(`  ${acildi && oynanir && !errs.length ? 'OK  ' : 'FAIL'} bölüm ${String(lvl).padStart(2)} — ${not}` +
      (errs.length ? `   ${errs[0]}` : acildi ? '' : '   perde kalkmadı'));
    if (!acildi) fails.push(`bölüm ${lvl} açılmadı (${sahte ? 'sahte' : 'gerçek'} saat)`);
    if (!oynanir && acildi) fails.push(`bölüm ${lvl}: Play düğmesi yok`);
    if (errs.length) fails.push(`bölüm ${lvl}: ${errs[0]}`);
    await ctx.close();
  }
}

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
