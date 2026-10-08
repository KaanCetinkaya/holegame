// İşçi yürüyor mu, yoksa kayıyor mu?
//
// Figür kapsül bir gövde, küre bir kafa ve barettenti; yürürken hiçbir şeyi
// kıpırdamıyordu. Bacak ve kol eklendi, salınım **gidilen yola** bağlandı.
// Ölçülen üç şey:
//   1. yürürken uzuvlar kıpırdıyor mu
//   2. dururken duruyorlar mı (zamana bağlı olsaydı yerinde sayardı)
//   3. yük taşırken kollar yukarıda mı
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8571);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.goto('http://localhost:8571/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 30000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Yürürken');
const yuru = await pg.evaluate(() => {
  window.jeMove(0, -1);
  const kare = [];
  for (let i = 0; i < 12; i++) { window.jeStep(0.08); kare.push(window.jeLimbs()); }
  return kare;
});
const bacakAralik = Math.max(...yuru.map(k => k.bacakSol)) - Math.min(...yuru.map(k => k.bacakSol));
ok(bacakAralik > 0.5, 'bacak salınıyor', `aralık ${bacakAralik.toFixed(2)} rad`);
ok(yuru.some(k => k.y > 0.01), 'gövde yaylanıyor', `en çok ${Math.max(...yuru.map(k => k.y))}`);
ok(yuru.every(k => Math.abs(k.bacakSol + k.bacakSag) < 0.001), 'bacaklar zıt yönde');

console.log('\n2) Dururken');
const dur = await pg.evaluate(() => {
  window.jeMove(0, 0);
  const kare = [];
  for (let i = 0; i < 8; i++) { window.jeStep(0.08); kare.push(window.jeLimbs()); }
  return kare;
});
const durAralik = Math.max(...dur.map(k => k.bacakSol)) - Math.min(...dur.map(k => k.bacakSol));
ok(durAralik < 0.01, 'dururken bacak kıpırdamıyor', `aralık ${durAralik.toFixed(4)}`);
ok(dur[dur.length - 1].y < 0.005, 'dururken yaylanma yok');

console.log('\n3) Yük taşırken');
const yuk = await pg.evaluate(() => {
  window.jeGive(1e7);
  window.jeRun(60);
  window.jeWalk(0);
  window.jeMove(0, -1);
  for (let i = 0; i < 6; i++) window.jeStep(0.08);
  return window.jeLimbs();
});
console.log(`     taşınan: ${yuk.tasiyor}`);
if (yuk.tasiyor > 0) ok(yuk.kolSol < -1, 'yük taşırken kollar yukarıda', `${yuk.kolSol} rad`);
else console.log('     (yığın boş, kol şartı ölçülemedi)');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
