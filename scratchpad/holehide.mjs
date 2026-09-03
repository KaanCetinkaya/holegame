// Ekran elden gidince sayaç duruyor mu?
//
//   node build-www.mjs && node scratchpad/holehide.mjs
//
// Tam ekran bir reklam, gelen bir arama ya da oyuncunun başka uygulamaya
// geçmesi — üçü de web görünümünü arka plana atıyor. Eskiden geri sayım
// arkada işlemeye devam ediyordu, yani oyuncu çoktan kaybettiği bir bölüme
// dönüyordu. Android bir de WebGL bağlamını düşürdüğü için döndüğünde
// gördüğü şey bomboş bir tarla oluyordu, üstünde hâlâ eriyen bir saatle.
// Telefondan 42. bölümde görüldü: boyanmayan bir geçiş reklamı, arkasında
// beyaz tarla, 2:02 akıp gidiyor.
//
// Buradaki gizlenme taklit: `document.hidden` geçersiz kılınıp
// `visibilitychange` elle gönderiliyor. Önce ikinci bir sayfayı öne
// getirerek gerçekten arka plana atmayı denedim, headless Chromium'da sekme
// gizli sayılmıyor — `document.hidden` false kalıyor ve test hiçbir şey
// ölçmemiş oluyor. Yani burada sınanan şey olayın kendisi değil, oyunun o
// olaya verdiği tepki. Android WebView'ın reklam açılınca bu olayı
// gerçekten gönderip göndermediği ancak telefonda görülür.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8198);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
const pg = await ctx.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

await pg.addInitScript(() => localStorage.setItem('fruithole_level', '42'));
await pg.goto('http://localhost:8198/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleProbe, { timeout: 25000 });
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2500);

const playing = await pg.evaluate(() => window.fruitHoleGrow().timeLeft);
check(playing > 0, 'bölüm başladı, saat işliyor', `${playing}sn`);

const setHidden = (pg, on) => pg.evaluate((on) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => on });
  Object.defineProperty(document, 'visibilityState',
    { configurable: true, get: () => (on ? 'hidden' : 'visible') });
  document.dispatchEvent(new Event('visibilitychange'));
}, on);

await setHidden(pg, true);
await pg.waitForTimeout(600);

check(await pg.evaluate(() => document.hidden), 'sayfa gizli sayılıyor');
check(await pg.evaluate(() => document.getElementById('pause').classList.contains('show')),
  'gizlenince oyun duraklıyor');

const t0 = await pg.evaluate(() => window.fruitHoleGrow().timeLeft);
await pg.waitForTimeout(3000);
const t1 = await pg.evaluate(() => window.fruitHoleGrow().timeLeft);
check(t1 >= t0 - 0.5, 'arka plandayken saat işlemiyor', `${t0}sn -> ${t1}sn`);

// Geri dön: duraklama paneli hâlâ durmalı, oyuncu kendi basmalı.
await setHidden(pg, false);
await pg.waitForTimeout(600);
check(await pg.evaluate(() => document.getElementById('pause').classList.contains('show')),
  'geri gelince kendiliğinden devam etmiyor, panel duruyor');

await pg.evaluate(() => document.getElementById('resumeBtn').click());
await pg.waitForTimeout(1500);
const t2 = await pg.evaluate(() => window.fruitHoleGrow().timeLeft);
check(t2 < t1, 'devam düğmesinden sonra saat yeniden işliyor', `${t1}sn -> ${t2}sn`);
check(t2 > t1 - 3, 'duraklanan saniyeler toptan yazılmıyor', `${(t1 - t2).toFixed(1)}sn düştü`);

// Menüdeyken gizlenmek hiçbir şeyi bozmamalı.
await pg.evaluate(() => document.getElementById('pauseMenu').click());
await pg.waitForTimeout(800);
await setHidden(pg, true);
await pg.waitForTimeout(400);
await setHidden(pg, false);
await pg.waitForTimeout(400);
check(await pg.isVisible('#playBtn'), 'menüde gizlenip dönmek menüyü bozmuyor');

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} HATA:\n  ` + fails.join('\n  ') : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
