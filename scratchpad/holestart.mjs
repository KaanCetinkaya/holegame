// START_LEVEL bayrağı: test derlemesi istenen bölümden açılıyor mu, ve
// sıradan derleme bundan etkilenmiyor mu?
//
//   node scratchpad/holestart.mjs
//
// Neden var: bayrak iki yönde de tuzak. Çalışmazsa telefondaki ölçüm için
// yirmi üç bölüm oynamak gerekir; sızarsa mağazaya giden derleme herkesin
// oyununu 24. bölümden açar ve ilerlemesini kaydetmez. İkisi de sessiz
// hatalar — derleme her iki durumda da başarılı oluyor.
//
// Test bu yüzden iki derlemeyi de kendisi üretiyor ve sırayla bakıyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const KOK = '/home/user/holegame';
const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync(KOK + '/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8281);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];

// Kayıt 3. bölümde duruyor. Bayrak açıkken oyunun bunu ezmesi, kapalıyken
// buna uyması bekleniyor — tek bir "24 mü" sorusu ikisini ayırt edemezdi.
const KAYIT = 3;

async function bak(baslik, bekleniyor) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await pg.addInitScript(n => localStorage.setItem('fruithole_level', String(n)), KAYIT);
  await pg.goto('http://localhost:8281/', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => {
    const l = document.getElementById('loading');
    return !l || getComputedStyle(l).display === 'none';
  }, { timeout: 30000 });
  if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');

  const d = await pg.evaluate(() => ({
    // Oyunun o an hangi bölümde olduğunu Play düğmesinin üstündeki sayı
    // söylüyor — düğmenin kendi yazısında bölüm numarası yok.
    dugme: (document.getElementById('menuLvlN')?.textContent || '').trim(),
    // Kayda dokunulmamış olmalı: test APK'sı sonradan mağaza sürümünün
    // üstüne gelince gerçek ilerlemeyi sıçratmasın.
    kayit: localStorage.getItem('fruithole_level'),
    surum: document.body.textContent.includes('test L') ? 'test' : 'normal',
  }));
  const bulunan = parseInt((d.dugme.match(/\d+/) || [0])[0], 10);

  const ok = bulunan === bekleniyor && d.kayit === String(KAYIT) && !errs.length;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${baslik} — açılış bölümü ${bulunan} ` +
    `(beklenen ${bekleniyor}) · kayıt ${d.kayit} · sürüm yazısı ${d.surum}` +
    (errs.length ? `   ${errs[0]}` : ''));
  if (bulunan !== bekleniyor) fails.push(`${baslik}: ${bekleniyor} yerine ${bulunan}. bölümden açıldı`);
  if (d.kayit !== String(KAYIT)) fails.push(`${baslik}: kayıt ${d.kayit} olmuş, ${KAYIT} kalmalıydı`);
  if (errs.length) fails.push(`${baslik}: ${errs[0]}`);
  await ctx.close();
  return d.surum;
}

console.log('--- sıradan derleme ---');
execFileSync('node', ['build-www.mjs'], { cwd: KOK, stdio: 'pipe' });
const s1 = await bak('bayraksız', KAYIT);
if (s1 !== 'normal') fails.push('bayraksız derlemede sürüm yazısı "test" diyor');

console.log('--- START_LEVEL=24 ---');
execFileSync('node', ['build-www.mjs'], { cwd: KOK, stdio: 'pipe', env: { ...process.env, START_LEVEL: '24' } });
const s2 = await bak('START_LEVEL=24', 24);
if (s2 !== 'test') fails.push('test derlemesinde sürüm yazısı normal görünüyor — hangi APK olduğu ayırt edilemez');

// Depoyu bayraklı çıktıyla bırakma: bir sonraki `npm run aab:fruithole`
// www-fruithole/ üstüne yeniden yazıyor ama arada biri elle sync ederse
// bayrak telefona gider.
execFileSync('node', ['build-www.mjs'], { cwd: KOK, stdio: 'pipe' });

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
