// Skor tablosu katmanı, kurulmadan önce sessiz kalıyor mu?
//
// Play Console tarafı henüz kurulmadı: `LEADERBOARD_ID` boş ve
// `patch-manifest.mjs` içindeki `tycoon.gamesId` de boş. Kurulmamış bir
// özelliğin yapması gereken tek şey **hiçbir şey yapmamak** — ve bu
// kolayca ters gidiyor: açılmayacak bir 🏆 düğmesi göstermek, oyuncuya
// çalışmayan bir şey vaat etmek demek.
//
// Fruit Hole'da bu katmanın her sessiz hatası günler aldı (yanlış eklenti
// adı, büyük D'li `leaderboardID`, eksik proje kimliği) ve hepsinin
// belirtisi aynıydı: hiçbir şey olmuyor. Burada ölçülen şey, "hiçbir şey
// olmaması"nın doğru hâli.
//
// Tarayıcıda eklenti yok, yani buradan ölçülebilen şey kurulmamış
// durumdaki davranış. Gerçek giriş ancak cihazda denenebilir.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  let b = null;
  try { b = readFileSync('/home/user/holegame/www-tycoon' + p); } catch {}
  if (b) { r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(b); }
  else { r.writeHead(404); r.end('no'); }
}).listen(8582);

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
pg.on('pageerror', e => console.log('HATA ' + e));
await pg.addInitScript(() => localStorage.clear());
await pg.goto('http://localhost:8582/', { waitUntil: 'load', timeout: 90000 });
await pg.waitForFunction(() => typeof window.jeProbe === 'function', { timeout: 60000 });

let fail = 0;
const ok = (c, ad, not = '') => { if (!c) fail++; console.log(`  ${c ? 'OK  ' : 'FAIL'} ${ad}   ${not}`); };

console.log('\n1) Kurulmamışken');
const g = await pg.evaluate(() => { document.getElementById('menuBtn').click(); return window.jeGames(); });
console.log(`     eklenti: ${g.eklenti} · kimlik: "${g.kimlik}" · hazır: ${g.hazir}`);
ok(!g.hazir, 'hazır değil');
ok(!g.dugmeGorunur, '🏆 düğmesi görünmüyor');

console.log('\n2) Oyuna hiçbir şey bulaşmıyor');
// Katmanın sessiz olması, oyunun çalışmaya devam etmesi demek. Kurulmamış
// bir eklentinin atacağı bir istisna, kare döngüsünü durdurabilirdi.
const akis = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeGive(1e6);
  for (let i = 0; i < 4; i++) { window.jeSetLevel(i, 20); window.jeGiveManager(i); }
  const once = window.jeProbe().cash;
  for (let i = 0; i < 100; i++) window.jeStep(0.1);
  return { kazanc: window.jeProbe().cash - once, hata: window.jeGames().hata };
});
console.log(`     10 saniyede kazanılan: ${akis.kazanc.toFixed(0)} · katmanın hatası: "${akis.hata}"`);
ok(akis.kazanc > 0, 'fabrika çalışıyor');

console.log('\n3) Prestij skoru taşmıyor');
// Üstel bir ekonomi 64 bit tam sayıyı aşabilir ve taşan bir skor tabloyu
// kalıcı olarak bozar. Sınır kodda var; burada ölçülüyor.
const tasma = await pg.evaluate(() => {
  window.jeWipeProgress();
  window.jeSetEarned(1e30);
  return window.jeGames().skor;
});
console.log(`     1e30 kazançta gönderilecek skor: ${tasma}`);
ok(tasma <= 9.0e18, 'skor 64 bit sınırının altında', `${tasma}`);
ok(Number.isFinite(tasma), 'skor sayı');

console.log('\n4) Tek yerde toplanmış');
// Kurulumun iki ayağı var ve ikisi de tek satır. Boş olduklarını burada
// yazıyoruz ki "neden çalışmıyor" sorusu bir daha günler almasın.
console.log('     tycoon/index.html  → LEADERBOARD_ID       (boş)');
console.log('     patch-manifest.mjs → tycoon.gamesId       (boş, yorumda)');
ok(g.kimlik === '', 'kimlik henüz boş — Play Console kurulumu bekliyor');

console.log(fail ? `\n${fail} kontrol düştü` : '\nhepsi geçti');
process.exitCode = fail ? 1 : 0;
await br.close(); srv.close();
