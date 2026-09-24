// Grafik bağlamı kaybolunca ne oluyor?
//
//   node build-www.mjs && node scratchpad/holegl.mjs
//
// Neden var: 18 Eylül'de telefonda tahta beyaz kaldı, sebebi bilinmiyordu ve
// bir sayaç kondu. 24 Eylül'de sayaç 48. bölümde ateşledi — yani sebep
// gerçekten bağlam kaybıydı. Ama kayıptan sonra tahta bir daha gelmedi ve
// oyuncu duraklamadan çıkıp **boş bir tahtaya** döndü: Size 1, 2/137, meyve
// yok, süre akıyor. Bölüm orada kaybedildi.
//
// Üç şey sınanıyor ve üçü de o ekranın parçasıydı:
//   1. kayıpta oyun duruyor mu
//   2. bağlam yokken oyuna dönülebiliyor mu (dönülmemeli)
//   3. bağlam geri gelince çizim geri geliyor mu
//
// Kayıp gerçekten yaptırılıyor — WEBGL_lose_context ile — tahminle değil.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8173);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8173/', { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
await pg.waitForTimeout(2500);
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2500);

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

const durum = () => pg.evaluate(() => ({
  state: window.fruitHoleWhere().state,
  duraklama: document.getElementById('pause').classList.contains('show'),
  yazi: !document.getElementById('glNotice').hidden,
  resumeKapali: document.getElementById('resumeBtn').disabled,
}));

const once = await durum();
check(once.state === 'playing', 'başlangıçta oyun akıyor', once.state);

// --- kaybı yaptır ---
console.log('\n1) Bağlam kayboluyor');
const yapildi = await pg.evaluate(() => {
  const c = document.querySelector('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const ext = gl && gl.getExtension('WEBGL_lose_context');
  if (!ext) return false;
  window.__glExt = ext;
  ext.loseContext();
  return true;
});
if (!yapildi) {
  console.log('  WEBGL_lose_context yok, sınanamıyor');
  await br.close(); srv.close();
  process.exit(0);
}
// Olay tarayıcının kendi sırasında geliyor; bir kare yetiyor.
await pg.waitForFunction(() => document.getElementById('pause').classList.contains('show'),
  { timeout: 5000 }).catch(() => {});
const kayipta = await durum();
check(kayipta.state === 'paused', 'kayıpta oyun duruyor', kayipta.state);
check(kayipta.duraklama, 'duraklama ekranı açıldı');
check(kayipta.yazi, 'ekranda ne olduğunu söyleyen yazı var');
check(kayipta.resumeKapali, 'Resume düğmesi kapalı');

// --- bağlam yokken oyuna dönmeye çalış ---
console.log('\n2) Bağlam yokken oyuna dönülemiyor');
await pg.evaluate(() => {
  // Düğme kapalı olduğu için tıklama geçmez; işlevi doğrudan çağırıyoruz.
  // Sınanan şey düğmenin kapalılığı değil, oyunun kendi kuralı — telefonda
  // saat işlemeye devam ettiği için bölüm kaybediliyordu.
  document.getElementById('resumeBtn').disabled = false;
  document.getElementById('resumeBtn').click();
});
await pg.waitForTimeout(400);
const zorla = await durum();
check(zorla.state === 'paused', 'zorlansa da oyun akmıyor', zorla.state);

// --- bağlamı geri ver ---
console.log('\n3) Bağlam gelince çizim geri geliyor');
await pg.evaluate(() => window.__glExt.restoreContext());
await pg.waitForFunction(() => document.getElementById('glNotice').hidden, { timeout: 8000 })
  .catch(() => {});
await pg.waitForTimeout(600);
const sonra = await durum();
check(!sonra.yazi, 'yazı kalktı');
check(!sonra.resumeKapali, 'Resume yeniden açıldı');

// Gerçekten çiziyor mu?
//
// İlk sürüm tuvali 2D tuvale kopyalayıp renk sayıyordu ve "kare boş" diye
// düştü — ama aynı ölçüm **kayıptan önce de** boş diyordu. Sebep: WebGL
// tuvali `preserveDrawingBuffer: false` ile çalışıyor, yani kare
// bittiğinde tampon siliniyor ve drawImage siyah okuyor. Yani test
// kodu değil kendini ölçüyordu ve olmayan bir hatayı bildirdi.
//
// Doğrusu renderer'ın kendi sayacı: kaç çizim çağrısı yapıldı.
const ciz = await pg.evaluate(() => window.fruitHoleFrameSplit().golgeli);
console.log(`  ${ciz.calls} çizim çağrısı, ${ciz.triangles} üçgen`);
check(ciz.calls > 0, 'bağlam gelince yeniden çiziliyor', `${ciz.calls} çağrı`);

await pg.evaluate(() => document.getElementById('resumeBtn').click());
await pg.waitForTimeout(400);
const devam = await durum();
check(devam.state === 'playing', 'bağlam gelince oyuna dönülebiliyor', devam.state);

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
