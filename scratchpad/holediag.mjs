// Teşhis ekranı üç sebebi birbirinden ayırabiliyor mu?
//
//   node build-www.mjs && node scratchpad/holediag.mjs
//
// Ekranın varlık sebebi tam olarak bu: cihazda "🏆 düğmesi yok" üç ayrı
// şeyden kaynaklanabiliyor ve üçü dışarıdan aynı görünüyor. Eğer ekran da
// üçüne aynı şeyi yazıyorsa hiçbir işe yaramaz — o yüzden burada üç durumu
// ayrı ayrı kurup çıktının gerçekten farklılaştığına bakıyoruz.
//
// Bir de ekranın kendisi bir risk: oyunun akışında olmayan bir kod, oyunun
// içindeki değişkenleri okuyor. Yanlış sırada tanımlanmış bir sabite dokunsa
// her açılışta patlardı (bu projede üç kez oldu: isBossLevel, BOSS_EVERY,
// iapInit). Onun için her bölümde sayfa hatası da dinleniyor.

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
}).listen(8222);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
const check = (ok, what, saw) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${saw === undefined ? '' : `   ${saw}`}`);
  if (!ok) fails.push(what);
};

// Üç durum, cihazda karşımıza çıkabilecek hâlleriyle.
const CASES = {
  // 1) Eklenti derlemeye hiç girmemiş: Capacitor native diyor ama PlayGames yok.
  'eklenti yok': `
    window.Capacitor = { isNativePlatform: () => true, Plugins: { AdMob: {} } };`,
  // 2) Eklenti var, giriş reddedildi — test kullanıcısı listesinde olmamak
  //    cihazda tam olarak böyle görünüyor.
  'giriş reddedildi': `
    window.Capacitor = { isNativePlatform: () => true, Plugins: { AdMob: {},
      PlayGames: {
        async signIn() { throw new Error('SIGN_IN_REQUIRED (4)'); },
        async showLeaderboard() { throw new Error('SIGN_IN_REQUIRED (4)'); },
      } } };`,
  // 3) Her şey yerinde.
  'çalışıyor': `
    window.Capacitor = { isNativePlatform: () => true, Plugins: { AdMob: {},
      PlayGames: {
        async signIn() { return { signedIn: true }; },
        async submitScore() { return { results: [] }; },
        async showLeaderboard() { },
      } } };`,
};

async function open(init) {
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  pg.on('pageerror', e => { console.log('  SAYFA HATASI: ' + e); fails.push(String(e)); });
  if (init) await pg.addInitScript(init);
  await pg.goto('http://localhost:8222/', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.fruitHoleDiag, { timeout: 25000 });
  await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
  await pg.waitForTimeout(700);
  return pg;
}

const seen = {};

for (const [ad, init] of Object.entries(CASES)) {
  console.log(`\n--- ${ad} ---`);
  const pg = await open(init);

  // Beş dokunuş gerçekten açıyor mu? Ekranın tek giriş yolu bu, ve
  // pointer-events kapalı kaldığı için hiç açılmaması sessiz bir kayıp olurdu.
  for (let i = 0; i < 5; i++) await pg.click('#verTag', { delay: 20 });
  await pg.waitForTimeout(250);
  const shown = await pg.evaluate(() => document.getElementById('diag').classList.contains('show'));
  check(shown, 'beş dokunuş ekranı açtı');
  if (!shown) { await pg.close(); continue; }

  const txt = await pg.evaluate(() => document.getElementById('diagBody').innerText);
  seen[ad] = txt;
  console.log(txt.split('\n').map(l => '    ' + l).join('\n'));

  if (ad === 'eklenti yok') {
    check(/PlayGames\s*hayır/.test(txt), 'PlayGames yok diyor');
    check(/eklentisi yok/.test(txt), 'sebebi "eklenti yok" olarak yazıyor');
  }
  if (ad === 'giriş reddedildi') {
    check(/PlayGames\s*evet/.test(txt), 'PlayGames var diyor');
    check(/giriş\s*hayır/.test(txt), 'giriş yapılmadı diyor');
    // Asıl kazanç bu satır: eklenti varken girişin neden düştüğünü yazıyor.
    check(/SIGN_IN_REQUIRED/.test(txt), 'Google\'ın hata metnini aynen gösteriyor');
  }
  if (ad === 'çalışıyor') {
    check(/🏆 düğme\s*evet/.test(txt), '🏆 düğmesi açık diyor');
    check(!/sebep/.test(txt), 'sebep satırı yok');
  }

  // Kapatma çalışmazsa ekran oyunun üstünde kilitli kalır.
  await pg.click('#diagClose');
  await pg.waitForTimeout(200);
  check(await pg.evaluate(() => !document.getElementById('diag').classList.contains('show')),
    'kapat düğmesi kapatıyor');
  await pg.close();
}

// Üçü birbirinden gerçekten farklı mı? Aynı metni veren iki durum varsa
// ekran hiçbir şey ayırt etmiyor demektir.
console.log('\n--- üçü ayırt ediliyor mu ---');
const vals = Object.entries(seen);
for (let i = 0; i < vals.length; i++)
  for (let j = i + 1; j < vals.length; j++)
    check(vals[i][1] !== vals[j][1], `"${vals[i][0]}" ile "${vals[j][0]}" farklı okunuyor`);

// Tarayıcıda da açılmalı: burada native yok, yani her şey "hayır" — ve
// ekranın kendisi yine de patlamadan çizilmeli.
console.log('\n--- tarayıcı (native yok) ---');
{
  const pg = await open(null);
  for (let i = 0; i < 5; i++) await pg.click('#verTag', { delay: 20 });
  await pg.waitForTimeout(250);
  const txt = await pg.evaluate(() => document.getElementById('diagBody').innerText);
  check(/native\s*hayır/.test(txt), 'native değil diyor');
  // Burada okunan www-fruithole/, yani build-www.mjs APP_VERSION'ı çoktan
  // app-version.json'daki değerle değiştirmiş durumda. 'dev' yalnızca
  // fruithole/index.html doğrudan açılınca görünüyor — bu satır ilk yazıldığında
  // onu bekliyordu ve testin kendisi yanlıştı.
  check(/sürüm\s*\d+\.\d+/.test(txt), 'sürüm damgalanmış hâliyle yazıyor',
    txt.split('\n').slice(0, 2).join(' '));
  await pg.close();
}

// Dokunuşların arası açılırsa sayaç sıfırlanmalı — yoksa gün içinde dağınık
// beş dokunuş birikip ekranı kendiliğinden açardı.
console.log('\n--- dağınık dokunuş ---');
{
  const pg = await open(null);
  for (let i = 0; i < 4; i++) { await pg.click('#verTag'); await pg.waitForTimeout(1500); }
  await pg.click('#verTag');
  await pg.waitForTimeout(250);
  check(await pg.evaluate(() => !document.getElementById('diag').classList.contains('show')),
    'arası açık beş dokunuş açmıyor');
  await pg.close();
}

console.log(fails.length ? `\n${fails.length} kontrol düştü` : '\nhepsi geçti');
await br.close();
srv.close();
process.exit(fails.length ? 1 : 0);
