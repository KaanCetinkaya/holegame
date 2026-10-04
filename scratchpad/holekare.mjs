// Son değişikliklerin ekran görüntüsü.
//
// Oyunun kendi kare döngüsü, çekilen karenin üstüne hemen yenisini
// çiziyor — `fruitHoleTopDown` ile kurulan kamera bir sonraki karede
// kayboluyor ve ekran görüntüsünde oyunun normal görüntüsü çıkıyor. İki
// kere böyle boşa çekildi. Çözüm sahte saat: `requestAnimationFrame`
// kuyruğa alınıyor, kimse ilerletmediği sürece oyun hiç çizmiyor, yani
// kurulan kamera yerinde kalıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const CIKTI = process.argv[2] || '/home/user/holegame/scratchpad';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); } catch {}
  if (b) {
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } else { r.writeHead(404); r.end('no'); }
}).listen(8498);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => {
  let t = 0; const q = [];
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  try { Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t }); }
  catch (e) { window.performance.now = () => t; }
  window.__step = ms => { t += ms; for (const cb of q.splice(0, q.length)) cb(t); };
});
await pg.goto('http://localhost:8498/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 90000 });

// Üstten: bütün tahta tek karede. Şeklin okunup okunmadığı buradan belli.
async function ustten(lv, ad, tohum = 400) {
  await pg.evaluate(([l, t]) => {
    window.fruitHoleSeedField(t + l);
    // Önce bölümü başlat: menü bir DOM katmanı ve kameradan bağımsız, yani
    // yalnızca kamerayı çevirmek yetmiyor — ilk denemede çekilen kare
    // menünün arkasındaki tahtaydı.
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    window.fruitHoleTopDown(l, window.innerHeight / window.innerWidth, 0);
  }, [lv, tohum]);
  await pg.screenshot({ path: `${CIKTI}/kare-${ad}.png`, timeout: 120000 });
  await pg.evaluate(() => window.fruitHoleUnseedField());
  console.log(`  kare-${ad}.png  (bölüm ${lv})`);
}

// Oyun kamerasından: oyuncunun gerçekten gördüğü şey.
async function oyundan(lv, ad, adim = 40, tohum = 400) {
  await pg.evaluate(([l, t, n]) => {
    window.fruitHoleSeedField(t + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    // Birkaç kare ilerlet: kamera açılış animasyonunu bitirsin ve tahta
    // oturduğu hâliyle görünsün.
    for (let i = 0; i < n; i++) window.__step(1000 / 30);
  }, [lv, tohum, adim]);
  await pg.screenshot({ path: `${CIKTI}/kare-${ad}.png`, timeout: 120000 });
  await pg.evaluate(() => window.fruitHoleUnseedField());
  console.log(`  kare-${ad}.png  (bölüm ${lv})`);
}

console.log('');
await ustten(29, 'koridor-ustten');
await oyundan(29, 'koridor-oyundan');
await ustten(26, 'rozet-ustten');
await ustten(46, 'yildiz-ustten');
await oyundan(30, 'kule-oyundan', 40, 9100);
await oyundan(22, 'kule-oyundan-2', 40, 5500);
await ustten(14, 'blast-ustten');
await ustten(44, 'bolt-ustten');

await br.close(); srv.close();
