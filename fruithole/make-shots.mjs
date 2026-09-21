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

// Sıra önemli: Play arama sonucunda ilk iki-üç görseli gösteriyor, ve
// indirme kararını çoğunlukla onlar veriyor. Bir süre ilk sırada menü
// duruyordu — başlık, bir "10. bölümde açılır" uyarısı ve bir Play düğmesi.
// Yani en değerli slot oyunun ne olduğunu hiç göstermiyordu. Oynanış öne
// alındı, menü aşağı indi.
// Oynanış görselleri bölümü **düzenin adıyla** istiyor, numarasıyla değil.
//
// Numaralar bir kez kaydı: beş yeni düzen eklenince 8. bölüm Snow Day
// olmaktan çıktı, 9. bölüm de voxel tahtası olmaktan. Dosya yine çalışıyor,
// yine sekiz resim üretiyordu — sadece "3-snow.png" artık karı göstermiyordu
// ve bunu ancak resme bakan biri fark edebilirdi. Adla arandığında düzen
// nereye taşınırsa taşınsın doğru tahta bulunuyor, bulunamazsa gürültüyle
// duruyor.
const SHOTS = [
  { name: '1-play', pattern: 'Pyramid', cap: 'Steer the hole, swallow the field',
    play: (pg, w, h) => sweep(pg, w, h, [[0, -140, 1200], [80, -100, 500]]) },
  { name: '2-grown', pattern: 'Blocks', cap: 'Eat enough and the giants are yours',
    play: async (pg, w, h) => {
      await pg.evaluate(() => window.fruitHoleSetSize(0.75));
      await sweep(pg, w, h, [[0, -120, 900], [110, -60, 900], [0, 120, 700]]);
    } },
  { name: '3-snow', pattern: 'Walls', cap: 'Every level is a shape — and a place',
    play: (pg, w, h) => sweep(pg, w, h, [[0, -140, 1300], [-90, -90, 500]]) },
  // Görev bölümü. Sekiz görselin sekizi de "tarlayı süpür" diyordu, oysa
  // oyunun beşinci bölümünden itibaren bazı bölümler başka bir şey istiyor —
  // ve mağazada görünmeyen bir şey, indirme kararında yok demektir.
  //
  // Halkalar (Orbits) buradan çıktı: metin onları zaten anlatıyor, ve Play
  // sekiz telefon görseliyle sınırlı. Bölüm 5 sipariş bölümü; üst satırda
  // "📋 STRAWBERRIES 6/47" gibi bir sayaç duruyor, yani görsel kuralı kendi
  // söylüyor.
  { name: '4-mission', level: 5, cap: 'Some levels want one fruit, not the field',
    play: (pg, w, h) => sweep(pg, w, h, [[0, -140, 1100], [70, -70, 500]]) },
  // Menü, boş bir cüzdanla değil. localStorage temizlendiği için sayaçlar
  // sıfır çıkıyordu ve mağaza görselinde sıfır, oyunun bitmemiş olduğunu
  // ima ediyor — oysa orada görülmesi gereken şey birkaç bölüm oynamış bir
  // oyuncunun gördüğü ekran.
  // Alt yazı yok: menüde ekranın altı Play düğmesi ve gezinme çubuğu, ve
  // yazı şeridi tam onların üstüne biniyordu. Menünün zaten kendi yazısı var.
  //
  // Yıldızlar da tohumlanıyor. Sadece bölüm 12 verilince menüdeki şerit
  // "0 stars collected — everything unlocked" diyordu: 12. bölümdeki bir
  // oyuncunun sıfır yıldızı olamaz, ve kendi içinde çelişen bir cümle
  // mağaza görselinde oyunun bozuk olduğunu düşündürür.
  { name: '5-menu', level: 12, menu: true,
    purse: { berry: 4820, lychee: 3960, banana: 5140, melon: 2730 },
    stars: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, i < 6 ? 3 : 2])) },
  { name: '6-skins', level: 12, screen: 'upgBtn' },
  { name: '7-levels', level: 12, screen: 'levelsBtn' },
  // Koleksiyon. 12. bölümdeki bir oyuncunun gerçekten sahip olabileceği
  // dağılımla tohumlanıyor: ilk temalar neredeyse dolu, sonrakiler boş —
  // çünkü temalar bölüm sırasına göre geliyor ve o oyuncu Orbit'i henüz
  // görmedi. Görselin anlatmak istediği şey tam olarak bu: üst sıralar
  // renkli, alt sıralar siluet, yani daha bulunacak çok şey var.
  { name: '8-collection', level: 12, screen: 'goalsBtn',
    found: [
      'starfish', 'shell', 'shades', 'flipflop', 'bucket', 'cone',
      'parasol', 'swimring', 'ball', 'lolly',
      'football', 'boot', 'marker', 'shirt', 'goal',
      'donut', 'mug', 'car', 'duck',
      'snowman', 'mitten', 'candycane', 'penguin', 'igloo',
      'bitcoin', 'euro',
    ],
    after: async pg => {
      await pg.click('#collBtn');
      // Küçük resimler tek geçişte üretiliyor; GPU'suz konteynerde bu
      // birkaç saniye sürüyor ve erken çekilen görsel boş kutular oluyor.
      await pg.waitForFunction(() => window.fruitHoleCollection().thumbs > 0, { timeout: 90000 });
      await pg.waitForTimeout(600);
    } },
];

// Düzen adı -> bölüm numarası. Oyunun kendi sırasından okunuyor.
async function levelIndex() {
  const pg = await browser.newPage({ viewport: { width: 412, height: 915 } });
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleThemeTable === 'function',
    { timeout: 25000 });
  const order = await pg.evaluate(() => window.fruitHoleThemeTable().order);
  await pg.close();
  const map = {};
  order.forEach((name, i) => { if (!(name in map)) map[name] = i + 1; });
  for (const s of SHOTS) {
    if (s.pattern && !map[s.pattern]) {
      throw new Error(`düzen bulunamadı: ${s.pattern} — oyundakiler: ${order.join(', ')}`);
    }
  }
  return map;
}
const LEVEL_OF = await levelIndex();

async function shoot(dir, width, height, scale) {
  const w = width / scale, h = height / scale;
  for (const s of SHOTS) {
    if (s.pattern) s.level = LEVEL_OF[s.pattern];
    const pg = await browser.newPage({
      viewport: { width: w, height: h }, deviceScaleFactor: scale });
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e)));
    await pg.addInitScript(a => {
      localStorage.clear();
      localStorage.setItem('fruithole_level', a.level);
      if (a.purse) localStorage.setItem('fruithole_currency', JSON.stringify(a.purse));
      if (a.stars) localStorage.setItem('fruithole_stars', JSON.stringify(a.stars));
      if (a.found) localStorage.setItem('fruithole_found', JSON.stringify(a.found));
    }, { level: String(s.level || 1), purse: s.purse || null, stars: s.stars || null,
         found: s.found || null });
    await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 25000 });
    // Günlük ödül penceresi ilk açılışta her şeyin önüne geliyor.
    await pg.waitForSelector('#dailyBtn', { state: 'visible', timeout: 8000 }).catch(() => {});
    await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
    await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
    // Sürüm yazısı geliştirici için var ("güncelleme indi mi"). Mağaza
    // görselinde işi yok: gürültü, ve çekildiği andaki numarayı sonsuza
    // kadar taşıyor — 1-menu.png aylarca "v1.8 (20)" diye durdu.
    await pg.evaluate(() => {
      const v = document.getElementById('verTag');
      if (v) v.style.display = 'none';
    });
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
      if (s.after) await s.after(pg);
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
