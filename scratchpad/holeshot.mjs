// Bir bölümün oyun içi görüntüsü — Kaan'a gösterilecek kare buradan çıkar.
//
//   node build-www.mjs && node scratchpad/holeshot.mjs 9 12 29
//   node scratchpad/holeshot.mjs --sayfa 1 2 4 5      (tek sayfaya dizer)
//
// Neden ayrı bir dosya: bu kare her seferinde elde, tek kullanımlık bir
// betikle alınıyordu ve hepsinde aynı hata vardı — **Play'e basılmıyordu.**
//
// Menü bir diorama ve dönüyor (`fieldGroup.rotation.y += dt * 0.12`).
// `fruitHoleProbe` + `fruitHoleStartLevel` tahtayı kuruyor ama oyunun
// durumunu değiştirmiyor: döngü hâlâ menüde olduğunu sanıp döndürmeye devam
// ediyor, ve kare çekilene kadar geçen yarım saniyede tahta 5-15 derece
// yatıyor. Sıralar çapraz çıkıyor, zemin çizgileri eğik duruyor.
//
// Oyunun kendisinde böyle bir şey yok: `buildField` dönüşü sıfırlıyor
// (17 Ağustos, "Reset the board's rotation when a level starts") ve gerçek
// oyuncu Play'e bastığı için o yoldan geçiyor. Mağaza görselleri ve TikTok
// klipleri de Play'e basıyor (`make-shots.mjs`, `make-clips.mjs`). Yamuk
// olan yalnızca elde alınan kareler oldu — ve Kaan onlara bakıp "bölümler
// yamuk duruyor" dedi. Haklıydı: gördüğü fotoğraflar yamuktu.
//
// O yüzden burada iki şey var: Play'e basmak, **ve** çekmeden önce açının
// gerçekten sıfır olduğunu doğrulamak. Sessizce yamuk bir kare üretmektense
// gürültüyle düşsün.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';

const OUT = '/tmp/shot';
const argv = process.argv.slice(2);
const SAYFA = argv.includes('--sayfa');
const LV = argv.map(Number).filter(n => Number.isFinite(n) && n > 0);
if (!LV.length) LV.push(1);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8254);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8254/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleLean, { timeout: 25000 });

// Günlük ödül penceresi ilk açılışta her şeyin önüne geliyor.
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
// **Asıl satır bu.** Oyunu menüden çıkarıyor; diorama dönüşü ancak burada
// duruyor.
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.click('#playBtn');
await pg.waitForTimeout(500);

let i = 0;
const fails = [];
for (const n of LV) {
  await pg.evaluate(l => {
    window.fruitHoleSeedField(7000 + l);
    window.fruitHoleProbe(l);
    window.fruitHoleStartLevel();
    window.fruitHoleUnseedField();
  }, n);
  await pg.waitForTimeout(600);
  // Çekmeden önce doğrula. Üç sayı da tahtanın ekranda düz durduğunu söylüyor:
  // dönüş sıfır, ızgaranın satırı yatay, sütunu dikey.
  const l = await pg.evaluate(() => window.fruitHoleLean());
  const duz = Math.abs(l.fieldRotY) < 1e-6
    && Math.abs(l.rowAngleDeg) < 0.5 && Math.abs(l.colAngleDeg - 90) < 0.5;
  if (!duz) fails.push(`${n}: dönüş ${l.fieldRotY.toFixed(3)} rad, ` +
    `satır ${l.rowAngleDeg}°, sütun ${l.colAngleDeg}°`);
  console.log(`  bölüm ${String(n).padStart(3)}  ${duz ? 'düz' : 'YAMUK'}  ` +
    `(dönüş ${l.fieldRotY.toFixed(3)}, satır ${l.rowAngleDeg}°)`);
  await pg.screenshot({ path: `${OUT}/${String(i++).padStart(2, '0')}.png` });
}

if (SAYFA && LV.length > 1) {
  // Sayfaya dizerken kareler küçülüyor ve zemin çizgileri o küçülmede
  // kırılıp çapraz görünüyor — tam da aranan şeyi taklit eden bir yanılsama.
  // O yüzden tek tek kareler de duruyor ve asıl bakılacak olan onlar.
  const sut = Math.ceil(Math.sqrt(LV.length));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/%02d.png`,
    '-filter_complex',
    `[0:v]scale=iw/2:ih/2[s];[s]tile=${sut}x${Math.ceil(LV.length / sut)}:padding=4:margin=4:color=black`,
    '-frames:v', '1', `${OUT}/sayfa.png`]);
  console.log(`\n  ${OUT}/sayfa.png  (küçültülmüş — çizgiler kırılır, tek tek karelere bak)`);
}
console.log(`\n  ${OUT}/`);
console.log('sayfa hataları: ' + (errs.length ? errs.join(' | ') : 'yok'));
console.log(fails.length ? `\n${fails.length} YAMUK KARE:\n  ` + fails.join('\n  ') : '\nhepsi düz');
await br.close();
srv.close();
process.exit(fails.length || errs.length ? 1 : 0);
