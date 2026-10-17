// İşçi: yürüyor mu, alıyor mu, bırakıyor mu, müdür alınınca gerekmez mi?
//
//   node build-www.mjs && node scratchpad/tyworker.mjs
//
// Neden var: fabrikanın zinciri artık ikiye bölündü. İstasyon malını **yere**
// basıyor (`G.pile`), oradan banda (`G.buf`) ya işçi taşıyor ya o istasyonun
// müdürü. Yani zincirin ortasına elle çalışan bir halka girdi ve üç yerde
// sessizce kopabilir:
//
//   1. Yığından alınmıyorsa mal sonsuza kadar yerde birikir, fabrika durur
//      ve ekranda "üretiyor" görünmeye devam eder.
//   2. Bırakılan mal tampona yazılmazsa taşımak hiçbir şey yapmaz — oyuncu
//      koşturur, sayılar değişmez.
//   3. Müdür alındıktan sonra akış kendiliğinden olmazsa idle oyunun idle
//      tarafı yok olur: oyun elle oynanmak zorunda kalır.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-tycoon' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8201);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
await pg.goto('http://localhost:8201/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 20000 });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// --- 1. üretim yere yığılıyor mu ---
console.log('1) Müdürsüz istasyon malı yere basıyor');
let r = await pg.evaluate(() => {
  window.jeSoftReset();
  window.jeStep(6);
  return window.jeProbe();
});
console.log(`  yığın ${r.pile.map(n => n.toFixed(1)).join(', ')} · tampon ${r.buf.map(n => n.toFixed(1)).join(', ')}`);
check(r.pile[0] > 0, 'ilk istasyonun yığını doldu', String(r.pile[0]));
check(r.buf[0] === 0, 'taşınmadan tampona hiçbir şey geçmedi', String(r.buf[0]));

// --- 2. işçi alıp bırakıyor mu ---
//
// Hareket sürükleme olayıyla değil, doğrudan konum verilerek yapılıyor:
// dokunma olaylarını taklit etmek zamanlamaya bağlı olurdu ve ölçülen şey
// taşımanın kendisi, parmağın değil.
console.log('\n2) İşçi alıyor ve bırakıyor');
r = await pg.evaluate(() => {
  const önce = window.jeProbe();
  window.jeWalk(0);          // 1. bölmeye git
  window.jeStep(0.1);
  const elde = window.jeProbe().carry;
  window.jeWalk(1);          // 2. bölmeye git
  window.jeStep(0.1);
  const sonra = window.jeProbe();
  return { öncePile: önce.pile[0], elde, sonraPile: sonra.pile[0],
           sonraBuf: sonra.buf[0], sonraCarry: sonra.carry };
});
console.log(`  yığın ${r.öncePile.toFixed(1)} -> ${r.sonraPile.toFixed(1)} · elde ${r.elde} · tampon ${r.sonraBuf.toFixed(1)}`);
check(r.elde > 0, 'yığından mal aldı', String(r.elde));
check(r.sonraPile < r.öncePile, 'yığın azaldı');
check(r.sonraBuf > 0, 'tampona bıraktı', String(r.sonraBuf));
check(r.sonraCarry === 0, 'eli boşaldı', String(r.sonraCarry));

// --- 3. taşınan mal para oluyor mu ---
//
// Zincirin ucundan para çıkmıyorsa taşımak oyunun içinde bir şey ifade
// etmiyor demektir; buraya kadarki üç kontrol bunu göstermiyor.
console.log('\n3) Taşınan mal zincirin ucunda paraya dönüyor');
r = await pg.evaluate(() => {
  window.jeSoftReset();
  const nakit0 = window.jeProbe().cash;
  // Üç bölme arasında gidip gel: dört istasyonluk zincirin tamamını elle
  // besle.
  for (let tur = 0; tur < 40; tur++) {
    for (let bay = 0; bay < 4; bay++) { window.jeWalk(bay); window.jeStep(0.35); }
  }
  return { nakit0, nakit1: window.jeProbe().cash };
});
console.log(`  kasa ${r.nakit0.toFixed(1)} -> ${r.nakit1.toFixed(1)}`);
check(r.nakit1 > r.nakit0, 'elle taşıyarak para kazanılıyor');

// --- 4. müdür alınınca kendi akıyor ---
console.log('\n4) Müdür alınınca taşımaya gerek kalmıyor');
r = await pg.evaluate(() => {
  window.jeSoftReset();
  window.jeGiveManager(0);
  window.jeWalk(9);          // işçiyi bölmelerden uzağa koy
  window.jeStep(6);
  return window.jeProbe();
});
console.log(`  yığın ${r.pile[0].toFixed(1)} · tampon ${r.buf[0].toFixed(1)}`);
check(r.buf[0] > 0, 'müdürlü istasyon kendi bandına basıyor', String(r.buf[0]));

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
