// Kombo sarsıntısı: bir tekmenin profili.
//
//   node scratchpad/holeshake.mjs
//
// Önce bütün bölümü oynatarak ölçmeyi denedim; bölüm başına dakikalar
// sürüyordu ve sahte oyuncunun kombo kurabilmesine bağlıydı — ilk deneme
// karelerin %0'ında sarsıntı gördü, çünkü oyuncu yeterince hızlı yemiyordu
// ve "sarsıntı yok" gibi göründü. Ölçülmesi gereken şey aslında **tek bir
// tekmenin şekli**.
//
// Asıl "deprem" hissini veren sayı EN BÜYÜK SIÇRAMA. Genlik küçük olsa bile
// kamera bir karede tam genliğe ışınlanıyorsa göz onu sallantı değil,
// sıçrama olarak görüyor — ve eskiden tam olarak bu oluyordu, çünkü ikinci
// eksen kosinüstü ve her tekmede shakeT sıfırlanıyordu: cos(0) = 1.

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
}).listen(8163);

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.addInitScript(() => localStorage.setItem('fruithole_level', '6'));
await pg.goto('http://localhost:8163/', { waitUntil: 'load' });
await pg.waitForSelector('#dailyBtn', { state: 'visible', timeout: 15000 }).catch(() => {});
await pg.evaluate(() => { const d = document.getElementById('dailyBtn'); if (d) d.click(); });
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 15000 });
await pg.click('#playBtn');
await pg.waitForTimeout(2600);

// Başsız tarayıcı 60 FPS'de dönmüyor. Kare aralığı uzayınca sinüs ilk
// karede daha ileri gidiyor ve "ilk kare sıçraması" olduğundan büyük çıkıyor.
// Bu yüzden ölçülen kare aralığı da yazılıyor ve 60 FPS'e çevriliyor.
// Süre de duvar saatiyle ölçülemiyor: oyun dt'yi 0.05'te sınırlıyor, yani
// 3 FPS'de dönen bir tarayıcıda oyun zamanı gerçek zamandan altı kat yavaş
// akıyor ve 0.17 saniyelik bir tekme 0.9 saniye sürüyormuş gibi görünüyor.
// Bu yüzden süre, oyunun kendi saydığı gibi sayılıyor: her kare min(dt, 0.05).
//
// Genlik dünya biriminde tutuluyor ama his piksel cinsinden: görüş alanı
// ekran ne kadar geniş olursa olsun 10.8 birim, yani 1080 piksellik bir
// telefonda 1 birim = 100 piksel. Tabloya o yüzden piksel de yazılıyor.
const spec = await pg.evaluate(() => window.fruitHoleKickSpec());
console.log(`tekme eşiği: x${spec.min} ve üstü — altındaki kombolar kamerayı hiç itmiyor\n`);
console.log('kombo | tepe  |  px | ölçülen fps | ilk kare @60fps | oyun-içi süre');
console.log('------+-------+-----+-------------+-----------------+---------------');

for (const mult of [3, 4, 5]) {
  const r = await pg.evaluate(async m => {
    await new Promise(res => setTimeout(res, 500));   // önceki tekme otursun
    const path = [];
    let stop = false;
    const watch = () => {
      const s = window.fruitHoleShake();
      path.push({ shake: s.shake, x: s.camX, z: s.camZ, t: performance.now() });
      if (!stop) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
    await new Promise(res => requestAnimationFrame(res));
    const before = path.length;            // tekmeden hemen önceki kare
    const peak = window.fruitHoleKick(m);
    await new Promise(res => setTimeout(res, 700));
    stop = true;
    return { path, before, peak };
  }, mult);

  const p = r.path;
  const jump = i => Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
  const start = Math.max(1, Math.min(r.before, p.length - 1));
  const first = p.length > start ? jump(start) : 0;
  const dt = p.length > start ? (p[start].t - p[start - 1].t) / 1000 : 1 / 60;
  const fps = 1 / dt;
  // Tekmenin ilk karesindeki yer değiştirme: A * sin(w * dt). Ölçüleni
  // 60 FPS'e çevirmek için aynı formülü iki kare aralığıyla çalıştır.
  const at = d => r.peak * Math.hypot(Math.sin(20 * d), Math.sin(15 * d));
  const first60 = at(1 / 60) * (first / Math.max(1e-9, at(dt)));
  let gameSecs = 0;
  for (let i = start; i < p.length; i++) {
    if (p[i].shake <= 0) break;
    gameSecs += Math.min(0.05, (p[i].t - p[i - 1].t) / 1000);
  }
  const note = mult < spec.min ? '  (oyunda tetiklenmez)' : '';
  console.log(
    ` ${String(mult).padStart(5)} | ${r.peak.toFixed(3)} |` +
    ` ${(r.peak * 100).toFixed(1).padStart(3)} |` +
    ` ${fps.toFixed(1).padStart(11)} | ${first60.toFixed(4).padStart(15)} |` +
    ` ${gameSecs.toFixed(3).padStart(10)}sn${note}`);
}

console.log('\nhatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await b.close();
srv.close();
