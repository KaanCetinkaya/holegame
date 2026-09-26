// Resim tahtaları: resim resim gibi duruyor mu, ve bitirilebiliyor mu?
//
//   node build-www.mjs && node scratchpad/holepicture.mjs
//
// Neden var: resim tahtası iki ayrı şekilde sessizce bozulabiliyor.
//
//   1. **Ekrana sığmıyor.** Kamera tahtanın tamamını değil, sabit bir
//      genişliği gösteriyor. Resim tahtaya göre ölçeklenirse kenarları
//      ekranın dışında kalıyor ve tahta resim olmaktan çıkıyor — bir kez
//      öyle çıktı, dondurmanın külahı ekranı taşıyordu.
//   2. **Bitirilemiyor.** Parça sayısı beş kat arttı ama saat alana göre
//      veriliyor. Alan modeli burada doğru olabilir de olmayabilir de; tek
//      öğrenme yolu tahtayı gerçekten süpürmek.
//
// Ölçüm ikisini de sayıyla yapıyor: birincisi geometriyle, ikincisi en yakın
// meyveyi kovalayan bir botla — yeni oyuncu aşağı yukarı böyle oynuyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  let b;
  try { b = readFileSync('/home/user/holegame/www-fruithole' + p); }
  catch { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(b);
}).listen(8243);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
await pg.goto('http://localhost:8243/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.fruitHoleProbe === 'function', { timeout: 30000 });
await pg.evaluate(() => { const d = document.getElementById('dOk'); if (d) d.click(); });

const fails = [];
const check = (ok, ad, not = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${ad}${not ? '   ' + not : ''}`);
  if (!ok) fails.push(ad + (not ? ' — ' + not : ''));
};

// --- haritaların kendisi ---
console.log('haritalar');
const hars = await pg.evaluate(() => window.fruitHolePictures());
for (const p of hars.list) {
  check(p.esitSatir, `${p.name}: bütün satırlar aynı uzunlukta`, `${p.w}×${p.h}`);
  check(p.bilinmeyen === 0, `${p.name}: tanınmayan harf yok`, String(p.bilinmeyen));
  check(p.dolu / (p.w * p.h) > 0.2, `${p.name}: tahtanın beşte birinden fazlası dolu`,
        `%${Math.round((p.dolu / (p.w * p.h)) * 100)}`);
}
check(hars.list.length >= 3, 'en az üç resim var', String(hars.list.length));

// --- tahtaya inince ---
console.log('\ntahta');
for (const lv of hars.levels) {
  const r = await pg.evaluate(n => {
    const p = window.fruitHoleProbe(n);
    const c = window.fruitHoleCost();
    const w = window.fruitHoleWhere();
    const b = window.fruitHolePictureBounds();
    return { fruit: p.fruit, calls: c.calls, tri: c.triangles, sec: p.seconds,
             halfX: w.halfX, halfZ: w.halfZ, ...b };
  }, lv);
  console.log(`  bölüm ${lv}: ${r.fruit} parça · ${r.calls} çizim · ${r.tri} üçgen · ` +
              `${r.sec}s · tahta ${r.halfX.toFixed(1)}×${r.halfZ.toFixed(1)}`);
  check(r.fruit >= 600, `bölüm ${lv}: tahta kalabalık`, String(r.fruit));
  // Ekrana sığıyor mu? Kamera sabit `viewHalfX` genişlik gösteriyor.
  check(r.genisYari <= r.viewHalfX, `bölüm ${lv}: resim ekranın genişliğine sığıyor`,
        `${r.genisYari.toFixed(2)} <= ${r.viewHalfX}`);
  // Çizim çağrısı parça sayısından bağımsız olmalı — yığınların bütün mesele
  // ettiği şey bu.
  check(r.calls < 40, `bölüm ${lv}: çizim çağrısı kırkın altında`, String(r.calls));
  check(r.tri < 400000, `bölüm ${lv}: üçgen dört yüz binin altında`, String(r.tri));
}

// --- gerçekten bitiyor mu ---
//
// Bot en yakın yenebilir parçayı kovalıyor. Tarlanın tamamını süpürmesi
// gerekmiyor; ölçülen şey saatin yetip yetmediği.
console.log('\nsüpürme (bölüm ' + hars.levels[0] + ')');
const kosu = await pg.evaluate(async (lv) => {
  window.fruitHoleProbe(lv);
  window.fruitHoleStartLevel();
  const bas = window.fruitHoleWhere();
  const uyu = ms => new Promise(r => setTimeout(r, ms));
  let tur = 0;
  while (tur++ < 900) {
    const w = window.fruitHoleWhere();
    if (w.state !== 'playing') break;
    const hedef = window.fruitHoleNearest();
    if (!hedef) break;
    const dx = hedef.x - w.x, dz = hedef.z - w.z;
    const d = Math.hypot(dx, dz) || 1;
    window.fruitHoleSteer(dx / d, dz / d);
    await uyu(50);
  }
  window.fruitHoleSteer(0, 0);
  const son = window.fruitHoleWhere();
  return { toplam: bas.total, kalan: son.left, state: son.state,
           timeLeft: son.timeLeft, sure: bas.timeLeft };
}, hars.levels[0]);
console.log(`  ${kosu.toplam} parça · kalan ${kosu.kalan} · durum ${kosu.state} · ` +
            `saat ${kosu.sure} -> ${kosu.timeLeft}`);
check(kosu.state !== 'lost', 'bot saati doldurmadan bitirdi',
      `kalan ${kosu.kalan}/${kosu.toplam}`);

if (errs.length) fails.push('sayfa hatası: ' + errs[0]);
console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
process.exit(fails.length ? 1 : 0);
