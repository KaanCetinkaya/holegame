// Bıçak nasıl görünüyor? Oyundaki kameradan ve yakından.
//
//   node build-www.mjs && node scratchpad/slblade.mjs
//
// Neden var: bıçak oyuncunun yönettiği tek şey ve kamera ona arkadan,
// neredeyse tam profilden bakıyor. "Kötü duruyor" bir zevk meselesi gibi
// görünüyor ama ölçülebilir bir tarafı var: ekranda kaç piksel yer
// kaplıyor ve kaç ayrı renk taşıyor. Tek renkli birkaç piksel, bıçak değil
// çizgi demek.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ETIKET = process.argv[2] || 'once';
const OUT = '/tmp/claude-0/-home-user-holegame/69f8c7ec-ec6d-510e-8b3f-e83d17995163/scratchpad';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8181);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
await pg.goto('http://localhost:8181/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');
// Bıçağı açık havada yakala.
//
// İlk sürüm turu birkaç saniye sürüyordu ve kare her seferinde bıçağın bir
// meyvenin **içinde** olduğu ana denk geliyordu — yani değerlendirilecek şey
// görünmüyordu bile. Tur duraklatılıyor ve bıçak meyve sırasının üstüne
// çıkarılıyor; duraklama ekranı da gizleniyor, o kareye girmesin.
await pg.evaluate(() => {
  window.sliceStart(3);
});
// Nötr duruş: bıçak tırmanırken burnu yukarı kalkıyor (pitch ±0.45'e kadar)
// ve o kare bıçağın olağan hâlini göstermiyor. Hedef bulunduğu yere
// sabitleniyor.
await pg.waitForTimeout(400);
await pg.evaluate(() => window.sliceSetTarget(window.sliceProbe().bladeY));
await pg.waitForTimeout(500);
await pg.evaluate(() => {
  document.getElementById('pauseBtn').click();
  document.getElementById('pause').classList.remove('show');
  document.getElementById('hint').classList.remove('show');
  for (const id of ['hud', 'barWrap']) {
    const e = document.getElementById(id); if (e) e.style.display = 'none';
  }
});
await pg.waitForTimeout(400);
await pg.screenshot({ path: `${OUT}/blade-${ETIKET}-oyun.png` });
console.log(`blade-${ETIKET}-oyun.png`);
await br.close(); srv.close();
