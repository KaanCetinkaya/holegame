// Banner reklamı menüyü örtüyor mu?
//
//   node build-www.mjs && node scratchpad/holead.mjs
//
// Banner native bir görünüm ve web sayfasının üstünde duruyor; sayfa ekranın
// tamamı kendisininmiş gibi yerleşiyor, reklam da altta ne varsa onu
// kapatıyor. Menüde altta duran şey navigasyon şeridiydi — Levels, Upgrades,
// Goals, Awards — yani reklamı olan bir oyuncunun o ekranlara ulaşma yolu
// yoktu. Telefonda çekilen kareyle yakalandı.
//
// Reklamlar yalnızca native kabukta var, tarayıcıda yok. O yüzden test
// reklamı taklit ediyor: --adPad'i elle kurup düğmelerin reklamın üstünde
// kalıp kalmadığına bakıyor.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ROOT = '/home/user/holegame';
const BANNER = 60;          // tipik adaptive banner yüksekliği

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(ROOT + '/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8187);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Dar ve uzun bir telefon: sıkışan ekran bu.
for (const [w, h, name] of [[412, 915, 'normal'], [360, 780, 'küçük'], [412, 732, 'kısa']]) {
  const pg = await br.newPage({ viewport: { width: w, height: h } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8187/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleAdPad, { timeout: 25000 });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });

  console.log(`\n${name} — ${w}x${h}`);
  await pg.evaluate(px => window.fruitHoleAdPad(px), BANNER);
  await pg.waitForTimeout(200);

  // Reklamın kapladığı şerit: ekranın en altındaki BANNER piksel.
  const adTop = h - BANNER;
  for (const id of ['playBtn', 'levelsBtn', 'upgBtn', 'homeBtn', 'goalsBtn', 'awardsBtn']) {
    const box = await pg.evaluate(i => {
      const el = document.getElementById(i);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom) };
    }, id);
    if (!box) { check(false, `${id} yok`); continue; }
    check(box.bottom <= adTop + 1, `${id} reklamın üstünde`,
      `alt kenarı ${box.bottom}px, reklam ${adTop}px'de başlıyor`);
  }

  // Üst üste binme: Play şeridin arkasında kalmasın, bölüm yazısı da Play'in.
  // Bu tam olarak bir kere oldu — şeridin yüksekliği ikonları yerleşmeden
  // ölçülmüştü, Play 26 piksel aşağıda kaldı ve şerit onun üstüne çizildi.
  const lay = await pg.evaluate(() => {
    const r = i => { const e = document.getElementById(i); if (!e) return null;
      const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
    return { nav: r('menuNav'), tray: r('playTray'), sub: r('menuSub') };
  });
  check(lay.tray.bottom <= lay.nav.top, 'Play şeridin üstünde duruyor',
    `Play ${lay.tray.bottom}px, şerit ${lay.nav.top}px'de başlıyor`);
  check(lay.sub.bottom <= lay.tray.top, 'bölüm yazısı Play\'in üstünde duruyor',
    `yazı ${lay.sub.bottom}px, Play ${lay.tray.top}px'de başlıyor`);

  // Reklam yokken de bozulmamalı.
  await pg.evaluate(() => window.fruitHoleAdPad(0));
  await pg.waitForTimeout(150);
  const nav = await pg.evaluate(() => {
    const b = document.getElementById('levelsBtn').getBoundingClientRect();
    return Math.round(b.bottom);
  });
  check(nav <= h, 'reklam kapalıyken menü ekrana sığıyor', `alt kenarı ${nav}px / ${h}px`);
  if (errs.length) check(false, 'sayfa hatası', errs[0]);
  // Ve gözle: reklamı gri bir şeritle taklit edip menüyü çek.
  await pg.evaluate(px => {
    window.fruitHoleAdPad(px);
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${px}px;z-index:98;
      background:#d8d8d8;color:#555;font:600 13px sans-serif;display:flex;
      align-items:center;justify-content:center;`;
    d.textContent = 'reklam';
    document.body.appendChild(d);
  }, BANNER);
  await pg.waitForTimeout(250);
  await pg.screenshot({ path: `/tmp/tech/menu-${name}.png` });
  console.log(`  /tmp/tech/menu-${name}.png`);
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
