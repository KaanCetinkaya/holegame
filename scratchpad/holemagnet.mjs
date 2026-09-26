// Süper mıknatıs görünüyor mu, ve gösterdiği menzil doğru mu?
//
//   node build-www.mjs && node scratchpad/holemagnet.mjs
//
// Booster'ın hiç görseli yoktu: bir zamanlayıcı kuruyor, bir satır yazı
// basıyor, sonra sekiz saniye boyunca ekranda açık olduğunu, nereye kadar
// eriştiğini ya da bittiğini söyleyen hiçbir şey olmuyordu. Meyveler
// kayıyordu, ama sıradan mıknatıs yükseltmesi de tam olarak bunu yapıyor —
// yani para verdiğin şey zaten sahip olduğun şeyden ayırt edilemiyordu.
//
// Halkanın süslemeden ibaret olmaması için ölçülen şey şu: yarıçapı gerçek
// çekim menziline eşit mi. Eşit değilse oyuncuya yalan söylüyor demektir.
//
// Aynı dosya sürüm yazısını da doğruluyor: menüde yazan numara
// app-version.json'daki numara olmalı.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const VER = JSON.parse(readFileSync('/home/user/holegame/app-version.json', 'utf8')).fruithole;

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8206);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

await pg.addInitScript(() => {
  localStorage.setItem('fruithole_level', '14');
  localStorage.setItem('fruithole_boosters', JSON.stringify({ time: 3, grow: 3, magnet: 3 }));
});
await pg.goto('http://localhost:8206/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleMagnet, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });

// ---- 1. Sürüm yazısı ----
console.log('\n1. sürüm yazısı');
const want = `v${VER.versionName} (${VER.versionCode})`;
const got = (await pg.textContent('#verTag') || '').trim();
check(got === want, 'menüdeki sürüm app-version.json ile aynı', `"${got}" / beklenen "${want}"`);
check(await pg.isVisible('#verTag'), 'görünüyor');
const vb = await pg.evaluate(() => {
  const v = document.getElementById('verTag').getBoundingClientRect();
  const p = document.getElementById('playBtn').getBoundingClientRect();
  const n = document.getElementById('menuNav').getBoundingClientRect();
  return { vTop: v.top, vBot: v.bottom, vRight: v.right, pLeft: p.left, navTop: n.top };
});
check(vb.vBot <= vb.navTop + 1, 'alt barın üstünde duruyor',
  `alt kenarı ${Math.round(vb.vBot)}px, bar ${Math.round(vb.navTop)}px'de`);
check(vb.vRight <= vb.pLeft, 'Play düğmesiyle çakışmıyor',
  `sağ kenarı ${Math.round(vb.vRight)}px, Play ${Math.round(vb.pLeft)}px'de`);

// ---- 2. Mıknatıs halkası ----
console.log('\n2. süper mıknatıs');
await pg.click('#playBtn');
await pg.waitForTimeout(2500);

const off = await pg.evaluate(() => window.fruitHoleMagnet());
check(!off.visible, 'booster kullanılmadan halka yok');

await pg.evaluate(() => window.fruitHoleUseBooster('magnet'));
await pg.waitForTimeout(400);

const on = await pg.evaluate(() => window.fruitHoleMagnet());
check(on.visible, 'booster açılınca halka çıkıyor');
check(Math.abs(on.ringR - on.reach) < 0.03, 'halkanın yarıçapı gerçek çekim menzili',
  `halka ${on.ringR} / menzil ${on.reach}`);
check(Math.abs(on.x - on.holeX) < 0.01 && Math.abs(on.z - on.holeZ) < 0.01,
  'halka deliğin üstünde duruyor');
check(on.opacity > 0.2, 'görünür bir opaklıkta', `${on.opacity}`);

// Menzil, sıradan yükseltmenin verdiğinden belirgin büyük olmalı; yoksa
// oyuncu parasını verdiği şeyle zaten sahip olduğu şeyi ayırt edemiyor.
check(on.reach - on.baseReach > 1.5, 'süper mıknatıs sıradan çekimden belirgin geniş',
  `${on.baseReach} -> ${on.reach}`);

// Son 1.5 saniyede sönerek bitiyor mu?
await pg.waitForTimeout(7000);
const dying = await pg.evaluate(() => window.fruitHoleMagnet());
check(dying.visible && dying.opacity < on.opacity, 'bitmeden önce sönüyor',
  `${on.opacity} -> ${dying.opacity}`);

await pg.waitForTimeout(1800);
const done = await pg.evaluate(() => window.fruitHoleMagnet());
check(!done.visible, 'süre dolunca kayboluyor');

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
