// Fruit Hole'un mağaza ekran görüntüleri, gerçek oynanıştan.
//
//   node build-www.mjs && node fruithole/make-shots.mjs
//   -> fruithole/store/*.png ve fruithole/store/tablet/*.png
//
// Elde çekilmiş bir set vardı ve meyveler voxel olunca hepsi bir anda oyunu
// göstermez oldu. Bunun bir betik olmasının sebebi bu: görünüm her
// değiştiğinde yedi kareyi yeniden çekmek bir komut olmalı.
//
// Kareler oyunun kendisinden alınıyor, çizilmiyor. Delik büyütülmüş kare
// için de gerçekten oynanıyor — parmak sürükleniyor, tarlada bir yol
// açılıyor — çünkü "büyümüş delik" temiz zemin demek ve temiz zemini ancak
// oynayarak elde edersin.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WWW = join(ROOT, 'www-fruithole');
const OUT = join(HERE, 'store');
const PORT = 8185;

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'tablet'), { recursive: true });

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync(join(WWW, p));
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(PORT);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

// Parmağı bir yöne bas ve tut. Oyun sanal joystick kullanıyor: basılan nokta
// merkez, sürüklenen nokta yön. Yani tek bir move yetmiyor, basılı kalması
// gerekiyor.
async function sweep(pg, w, h, legs) {
  await pg.mouse.move(w / 2, h / 2);
  await pg.mouse.down();
  for (const [dx, dy, ms] of legs) {
    await pg.mouse.move(w / 2 + dx, h / 2 + dy);
    await pg.waitForTimeout(ms);
  }
  await pg.mouse.up();
}

const SHOTS = [
  { name: '1-menu', level: 9, menu: true },
  { name: '2-play', level: 1, cap: 'Steer the hole, swallow the field',
    play: (pg, w, h) => sweep(pg, w, h, [[0, -140, 1200], [80, -100, 500]]) },
  { name: '3-grown', level: 9, cap: 'Eat enough and the giants are yours',
    play: async (pg, w, h) => {
      await pg.evaluate(() => window.fruitHoleSetSize(0.75));
      await sweep(pg, w, h, [[0, -120, 900], [110, -60, 900], [0, 120, 700]]);
    } },
  { name: '4-snow', level: 8, cap: 'Every level is a shape — and a place',
    play: (pg, w, h) => sweep(pg, w, h, [[0, -140, 1300], [-90, -90, 500]]) },
  { name: '5-rings', level: 3, cap: 'Rings that open out from where you stand',
    play: (pg, w, h) => sweep(pg, w, h, [[0, -140, 1100]]) },
  { name: '6-skins', level: 12, screen: 'upgBtn' },
  { name: '7-levels', level: 12, screen: 'levelsBtn' },
];

async function shoot(dir, width, height, scale) {
  const w = width / scale, h = height / scale;
  for (const s of SHOTS) {
    const pg = await browser.newPage({
      viewport: { width: w, height: h }, deviceScaleFactor: scale });
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e)));
    await pg.addInitScript(l => {
      localStorage.clear();
      localStorage.setItem('fruithole_level', l);
    }, String(s.level));
    await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });
    // Günlük ödül penceresi ilk açılışta her şeyin önüne geliyor.
    await pg.waitForSelector('#dailyBtn', { state: 'visible', timeout: 8000 }).catch(() => {});
    await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
    await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
    await pg.waitForTimeout(400);

    if (s.screen) {
      await pg.click('#' + s.screen);
      await pg.waitForTimeout(500);
      if (s.name === '6-skins') {
        // Görünümler yükseltmeler ekranının dibinde.
        await pg.evaluate(() => {
          const el = document.getElementById('skinShop');
          if (el) el.scrollIntoView({ block: 'center' });
        });
        await pg.waitForTimeout(300);
      }
    } else if (!s.menu) {
      await pg.click('#playBtn');
      await pg.waitForTimeout(1400);
      await pg.evaluate(() => {
        const hint = document.getElementById('hint');
        if (hint) hint.style.opacity = '0';
      });
      if (s.play) await s.play(pg, w, h);
      await pg.waitForTimeout(300);
    }

    if (s.cap) {
      await pg.evaluate(text => {
        const d = document.createElement('div');
        d.style.cssText = `position:fixed;left:0;right:0;bottom:0;z-index:99;
          padding:64px 22px calc(env(safe-area-inset-bottom,0px) + 118px);
          font-size:27px;font-weight:900;line-height:1.25;letter-spacing:-.4px;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          color:#fff;text-align:center;
          text-shadow:0 3px 14px rgba(0,0,0,.9), 0 1px 0 rgba(0,0,0,.7);
          background:linear-gradient(0deg,rgba(12,20,32,.88),rgba(12,20,32,0));
          pointer-events:none;`;
        d.textContent = text;
        document.body.appendChild(d);
      }, s.cap);
      await pg.waitForTimeout(120);
    }

    await pg.screenshot({ path: join(dir, `${s.name}.png`) });
    console.log(`  ${s.name}.png`, errs.length ? 'HATA: ' + errs[0] : '');
    await pg.close();
  }
}

console.log(`telefon 1080x1920 -> ${OUT}`);
await shoot(OUT, 1080, 1920, 2);
console.log(`tablet 1440x2560 -> ${OUT}/tablet`);
await shoot(join(OUT, 'tablet'), 1440, 2560, 2);

await browser.close();
srv.close();
