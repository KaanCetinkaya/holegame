// Kamera: klibin soğuk açılışı için eklenen `fruitHoleCamLook` oyunu
// bozmuyor mu, ve işini yapıyor mu?
//
//   node build-www.mjs && node scratchpad/holecam.mjs
//
// Neden var: kamerayı delikten başka bir şeye baktıran bir kanca çizim
// döngüsünün ortasına girdi — oyunun her karesinden geçen yere. `holeshake`
// zaten "kamerayı delikten başka hiçbir şey oynatmıyor" diye bekliyordu ve
// bu ekleme tam olarak o cümleyi yumuşatıyor, yani sınırının ölçülmesi
// gerekiyor: **çağrılmadıkça hiçbir şey değişmemeli.**
//
// Üç şey ölçülüyor:
//   1. Dokunulmamış oyunda kamera deliği takip ediyor (eski davranış).
//   2. Bir noktaya baktırılınca kamera oraya gidiyor ve delik uzaklaşsa bile
//      orada kalıyor.
//   3. Bırakılınca kamera deliğe geri dönüyor.
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
}).listen(8286);

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
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.addInitScript(FAKE_CLOCK);
await pg.addInitScript(() => localStorage.setItem('fruithole_level', '11'));
await pg.goto('http://localhost:8286/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });

const pump = async n => { for (let i = 0; i < n; i++) await pg.evaluate(() => window.__step(1000 / 30)); };
await pump(30);
if (await pg.isVisible('#dailyBtn')) { await pg.click('#dailyBtn'); await pump(10); }
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
await pg.click('#playBtn');
await pump(60);

const fails = [];
const uzak = (a, b) => +Math.hypot(a.camX - b.x, a.camZ - b.z).toFixed(2);

// 1. Dokunulmamış oyun: kamera deliğin üstünde.
//
// Kamera deliğin biraz arkasında duruyor (camera.position.z = camZ + 6.2), o
// yüzden ölçülen şey mesafenin sıfır olması değil, **sabit** kalması. Delik
// sürülüp kamera yetiştikten sonra fark hep aynı olmalı.
await pg.evaluate(() => window.fruitHoleSteer(1, 0));
await pump(60);
const s1 = await pg.evaluate(() => ({ ...window.fruitHoleShake(), ...window.fruitHoleWhere() }));
const d1 = uzak(s1, s1);
if (d1 > 7) fails.push(`dokunulmamış oyunda kamera delikten ${d1} birim uzakta`);

// 2. Başka bir noktaya baktır ve deliği ters yöne sür.
const hedef = { x: s1.x - 6, z: s1.z - 6 };
await pg.evaluate(h => window.fruitHoleCamLook(h.x, h.z, true), hedef);
await pg.evaluate(() => window.fruitHoleSteer(1, 0));
await pump(60);
const s2 = await pg.evaluate(() => ({ ...window.fruitHoleShake(), ...window.fruitHoleWhere() }));
const kilit = uzak(s2, hedef);
const kacti = uzak(s2, s2);
// Kamera hedefte kalmalı ve delik ondan uzaklaşmış olmalı — ikincisi olmazsa
// test hiçbir şey ölçmemiş olur (delik yerinde durduysa kamera da zaten orada
// olurdu).
if (kilit > 7) fails.push(`baktırılan noktaya kilitlenmedi: ${kilit} birim uzakta`);
if (kacti < 3) fails.push(`delik yeterince uzaklaşmadı (${kacti} birim) — ölçüm bir şey söylemiyor`);

// 3. Bırak: kamera deliğe geri dönsün.
await pg.evaluate(() => window.fruitHoleCamLook(null));
await pump(90);
const s3 = await pg.evaluate(() => ({ ...window.fruitHoleShake(), ...window.fruitHoleWhere() }));
const donus = uzak(s3, s3);
if (donus > 7) fails.push(`bırakıldıktan sonra kamera deliğe dönmedi: ${donus} birim`);

// 4. Yakınlaştırma: null oyunun kendi genişliğine dönmeli.
//
// Soğuk açılış yakın plandan normale açılıyor ve "normal"i klip dosyası
// bilmiyor — `fruitHoleZoom(null)` diyor. O yüzden null'ın gerçekten oyunun
// genişliğini geri koyduğu ölçülüyor: koymazsa klibin gövdesi yanlış
// ölçekte çekilir ve bunu ancak videoyu izleyen biri fark eder.
const z = await pg.evaluate(() => ({
  dar: window.fruitHoleZoom(2.6),
  geri: window.fruitHoleZoom(null),
}));
if (z.dar !== 2.6) fails.push(`fruitHoleZoom(2.6) genişliği ${z.dar} yaptı`);
if (Math.abs(z.geri - 5.4) > 0.01) fails.push(`fruitHoleZoom(null) 5.4'e dönmedi: ${z.geri}`);

console.log(`1. dokunulmamış   — kamera delikten ${d1} birim`);
console.log(`2. baktırılmış    — hedefe ${kilit} birim, delik ${kacti} birim ötede`);
console.log(`3. bırakılmış     — kamera delikten ${donus} birim`);
console.log(`4. yakınlaştırma  — 2.6 kuruldu, null ${z.geri}'e döndü`);
if (errs.length) fails.push('sayfa hatası: ' + errs[0]);

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
