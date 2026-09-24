// Bir kare telefonda kaça patlıyor — **oynanırken**.
//
//   node build-www.mjs && node scratchpad/holeframe.mjs
//
// `holecost.mjs` bu soruyu bir kez soruyor ama yanlış kameradan: tahtayı
// kurup ölçüyor, ve o sırada kamera bütün tarlayı kadraja alıyor. Telefonda
// öyle bir kare yok — kamera deliği takip ediyor ve tarlanın küçük bir
// kısmını gösteriyor. Aradaki fark, kadrajın dışındakileri atan frustum
// ayıklaması; yani ölçülen sayı gerçekten çizilenden büyük.
//
// Buradaki ölçüm bölümü başlatıp gerçekten oynuyor ve kareyi oyunun kendi
// kamerasıyla sayıyor.
//
// Neden önemli: çizim çağrısı, eski Android'de kare süresini belirleyen
// şeydir. Üçgen sayısı bir yere kadar ucuz, ama her çağrı sürücüye ayrı bir
// iş demek ve orta segment bir telefon karede 200-400 çağrıdan sonra
// tökezlemeye başlıyor. Gölge geçişi sahneyi ikinci kez çiziyor, yani
// buradaki sayı ikiyle çarpılıp okunuyor.
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
}).listen(8283);

const FPS = 30;
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

// Ölçülen bölümler adla seçiliyor, numarayla değil: numara düzen listesi her
// büyüdüğünde başka bir tahtayı gösteriyor.
const ISTENEN = ['Ring', 'Blocks', 'Cross', 'Wave', 'Pyramid', 'Piles'];

const ONCE = await br.newPage();
await ONCE.goto('http://localhost:8283/', { waitUntil: 'load' });
await ONCE.waitForFunction(() => typeof window.fruitHoleThemeTable === 'function', { timeout: 25000 });
const TABLO = await ONCE.evaluate(() => window.fruitHoleThemeTable());
await ONCE.close();
const BOLUM = {};
for (const ad of ISTENEN) {
  const i = TABLO.order.indexOf(ad);
  if (i < 0) throw new Error(`düzen yok: ${ad} — oyundakiler: ${TABLO.order.join(', ')}`);
  BOLUM[ad] = i + 1;
}

const fails = [];
// Eşik: orta segment bir Android'de karede 300 çizim çağrısı, gölgeyle
// birlikte 600. Bunun üstü, oyunun kendi kamerasında bile takılma demek.
const CAGRI_SINIR = 300;

console.log(' düzen     | blm | tema       | meyve | kadrajdaki üçgen | çizim çağrısı');
console.log('-----------+-----+------------+-------+------------------+--------------');

const satirlar = [];
for (const ad of ISTENEN) {
  const lvl = BOLUM[ad];
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.addInitScript(FAKE_CLOCK);
  await pg.addInitScript(n => {
    localStorage.setItem('fruithole_level', String(n));
    localStorage.setItem('fruithole_seen', '1');
  }, lvl);
  await pg.goto('http://localhost:8283/', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
  await pg.waitForFunction(() => {
    const l = document.getElementById('loading');
    return !l || getComputedStyle(l).display === 'none';
  }, { timeout: 60000 });

  const pump = async n => { for (let i = 0; i < n; i++) await pg.evaluate(d => window.__step(d), 1000 / FPS); };
  await pump(30);
  if (await pg.isVisible('#dailyBtn')) { await pg.click('#dailyBtn'); await pump(10); }
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
  await pg.click('#playBtn');
  // Tarla düşsün ve kamera yerine otursun: düşerken kadraj da, sayı da
  // oyunun gerçek hâli değil.
  await pump(Math.round(3 * FPS));

  // En ağır kare, tek kare değil: delik tarlanın ortasına doğru sürülürken
  // kadrajdaki meyve sayısı değişiyor. On kare boyunca en kötüsü alınıyor.
  let enCok = { calls: 0, triangles: 0 };
  for (let i = 0; i < 10; i++) {
    await pg.evaluate(() => {
      const w = window.fruitHoleWhere();
      const t = window.fruitHoleNearest();
      if (t) {
        const dx = t.x - w.x, dz = t.z - w.z, d = Math.hypot(dx, dz) || 1;
        window.fruitHoleSteer(dx / d, dz / d);
      }
      window.__step(1000 / 30);
    });
    const c = await pg.evaluate(() => {
      // Oyunun kendi kamerasıyla bir kare çiz ve sayacı oku. `fruitHoleCost`
      // kendi render'ını yapıyor ama sayaç aynı sahneyi okuyor.
      return window.fruitHoleCost();
    });
    if (c.calls > enCok.calls) enCok = c;
  }
  const w = await pg.evaluate(() => window.fruitHoleWhere());
  const tema = await pg.evaluate(() => window.fruitHoleDailyState().pattern);
  void tema;
  const temaAdi = TABLO.patternThemes[BOLUM[ad] - 1];
  satirlar.push({ ad, lvl, tema: temaAdi, fruit: w.total, ...enCok });
  console.log(` ${ad.padEnd(9)} | ${String(lvl).padStart(3)} | ${temaAdi.padEnd(10)} | ` +
    `${String(w.total).padStart(5)} | ${enCok.triangles.toLocaleString('tr-TR').padStart(16)} | ` +
    `${String(enCok.calls).padStart(13)}`);
  if (errs.length) fails.push(`${ad}: ${errs[0]}`);
  await ctx.close();
}

const enAgir = satirlar.slice().sort((a, b) => b.calls - a.calls)[0];
console.log(`\n en ağır kare: ${enAgir.ad} (bölüm ${enAgir.lvl}) — ${enAgir.calls} çağrı, ` +
  `${enAgir.triangles.toLocaleString('tr-TR')} üçgen`);
// Gölge geçişi bu sayının **içinde değil**: `fruitHoleFrameSplit` aynı kareyi
// gölge açık ve kapalı çizip sayacı okuyor ve üç okuma da aynı çıkıyor, yani
// `renderer.info` yalnızca ana geçişi sayıyor. Gölgenin bedeli süreyle
// ölçüldü — 19. bölümde kare 3.42 ms'den 2.08 ms'ye iniyor, yani gölge
// karenin kabaca %40'ı. Telefonda oran başka olur, ama sıfır değil.
console.log(` gölge geçişi bu sayıya dahil değil: sahneyi ikinci kez çiziyor`);

if (enAgir.calls > CAGRI_SINIR) {
  fails.push(`en ağır kare ${enAgir.calls} çizim çağrısı — sınır ${CAGRI_SINIR}`);
}

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
// Hata varsa çıkış kodu da söylesin.
//
// Bu dosya hatayı **basıyordu ama çıkış kodu 0 dönüyordu**, yani onu çağıran
// her şey — toplu koşu, ileride bir CI — "geçti" diye okuyordu. Tam koşuda on
// üç test böyle çıktı: hata basan ama başarı sinyali veren bir test, hiç test
// olmamasından kötü, çünkü bakılmış olduğu izlenimi veriyor.
process.exitCode = fails.length ? 1 : 0;
await br.close(); srv.close();
