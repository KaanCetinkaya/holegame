// Beş haneli bakiyede menünün üst satırı taşıyor mu?
//
//   node build-www.mjs && node scratchpad/holetop.mjs
//
// Telefon fotoğrafında dört sayaç (17359, 18269, 21583, 22560) ekranı
// doldurmuş, sağdaki mağaza ve ses düğmeleri kenardan taşmış, ve "Peelo"
// yazısı sayaçların altında kalmış.
//
// Bu, ekonominin dolaylı sonucu: kaplamalar 6.000-11.000 olduğu için beş
// haneli bakiye artık istisna değil, normal. Eski fiyatlarda kimse o kadar
// biriktirmiyordu, o yüzden satır hiç bu genişlikte denenmemişti.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8220);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};
mkdirSync('/tmp/top', { recursive: true });

// Kaan'ın telefonundaki gerçek bakiyeler, ve bir de daha da büyüğü: oyun
// sonsuz, biri er geç altı haneye çıkacak.
const PURSES = {
  'yeni oyuncu': { berry: 0, lychee: 0, banana: 0, melon: 0 },
  'beş hane': { berry: 17359, lychee: 18269, banana: 21583, melon: 22560 },
  'altı hane': { berry: 123456, lychee: 234567, banana: 345678, melon: 456789 },
};

for (const w of [360, 412]) {
  for (const [ad, purse] of Object.entries(PURSES)) {
    const pg = await br.newPage({ viewport: { width: w, height: 800 } });
    pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
    await pg.addInitScript(p => {
      localStorage.setItem('fruithole_level', '44');
      localStorage.setItem('fruithole_currency', JSON.stringify(p));
    }, purse);
    await pg.goto('http://localhost:8220/', { waitUntil: 'load' });
    await pg.waitForFunction(() => window.fruitHoleWallet, { timeout: 25000 });
    await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
    await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
    await pg.waitForTimeout(600);

    const m = await pg.evaluate(() => {
      const top = document.getElementById('menuTop');
      const shop = document.getElementById('shopBtn');
      const sound = document.getElementById('menuSound');
      const h1 = document.querySelector('#menu h1');
      const r = el => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), w: Math.round(b.width) }; };
      // Dört sayacın dördü de gerçekten görünüyor mu? Cüzdan taşarsa
      // kaydırılabiliyor ama kaydırılabildiği hiçbir yerde yazmıyor, yani
      // görünmeyen sayaç yok sayılır.
      const pills = [...top.querySelectorAll('#menuWallet .mw')].map(r);
      const tw = r(top);
      const shown = pills.filter(p => p.l >= tw.l - 0.5 && p.r <= r(document.getElementById('menuWallet')).r + 0.5);
      return {
        win: innerWidth,
        top: tw, shop: r(shop), sound: r(sound), h1: r(h1),
        pills: pills.length, shown: shown.length,
        shopHidden: getComputedStyle(shop).display === 'none',
      };
    });

    console.log(`\n${w}px · ${ad}`);
    // Düğmeler ekranın içinde mi?
    if (!m.shopHidden) {
      check(m.shop.r <= m.win + 0.5 && m.shop.l >= -0.5, 'mağaza düğmesi ekranın içinde',
        `${m.shop.l}-${m.shop.r} / ${m.win}`);
    } else {
      console.log('  --   mağaza düğmesi gizli (tarayıcıda IAP kapalı değil, bu beklenmez)');
    }
    check(m.sound.r <= m.win + 0.5 && m.sound.l >= -0.5, 'ses düğmesi ekranın içinde',
      `${m.sound.l}-${m.sound.r} / ${m.win}`);
    // Üst satır başlığın üstüne binmiyor mu?
    check(m.top.b <= m.h1.t + 0.5, 'üst satır başlığı örtmüyor',
      `satır ${m.top.b} / başlık ${m.h1.t}`);
    check(m.shown === 4, 'dört sayacın dördü de görünüyor', `${m.shown}/${m.pills}`);

    await pg.screenshot({ path: `/tmp/top/${w}-${ad.replace(/ /g, '_')}.png`, clip: { x: 0, y: 0, width: w, height: 320 } });
    await pg.close();
  }
}

// Oyun içindeki sayaçlar da aynı dörtlü. Menüdeki taşmayı düzeltmek onları
// düzeltmiyor: HUD kartları sabit 36px ve sayı kartın içinde, yani buradaki
// risk ekrandan taşmak değil, sayının kendi kartına sığmaması.
console.log('\n--- oyun içi HUD ---');
for (const w of [360, 412]) {
  const pg = await br.newPage({ viewport: { width: w, height: 800 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  await pg.addInitScript(() => {
    localStorage.setItem('fruithole_level', '44');
    localStorage.setItem('fruithole_currency',
      JSON.stringify({ berry: 123456, lychee: 234567, banana: 345678, melon: 456789 }));
  });
  await pg.goto('http://localhost:8220/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleWallet, { timeout: 25000 });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
  await pg.click('#playBtn');
  await pg.waitForTimeout(2200);

  const h = await pg.evaluate(() => {
    const cards = [...document.querySelectorAll('#wallet .card')];
    const over = cards.filter(c => {
      const n = c.querySelector('.n');
      return n.scrollWidth > c.clientWidth + 0.5;
    }).map(c => c.querySelector('.n').textContent);
    const box = document.getElementById('wallet').getBoundingClientRect();
    return { n: cards.length, over, right: Math.round(box.right), win: innerWidth,
             texts: cards.map(c => c.querySelector('.n').textContent) };
  });
  console.log(`\n${w}px · altı hane`);
  check(h.n === 4, 'dört sayaç da çizildi', `${h.n}`);
  check(h.over.length === 0, 'sayı kartından taşmıyor', h.over.join(', ') || h.texts.join(' '));
  check(h.right <= h.win + 0.5, 'cüzdan ekranın içinde', `${h.right} / ${h.win}`);
  await pg.screenshot({ path: `/tmp/top/hud-${w}.png`, clip: { x: 0, y: 60, width: Math.min(w, 300), height: 90 } });
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
console.log('görüntüler: /tmp/top/');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
