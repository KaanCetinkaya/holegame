// Bütün düzenler tek sayfada: hangi tahta yamuk duruyor?
//
//   node build-www.mjs && node scratchpad/holesheet.mjs
//   node scratchpad/holesheet.mjs --from 35 --count 34
//
// Ölçen bir test değil, **bakılan** bir test. Kaan "bir kaç bölüm yamuk
// duruyor" dedi ve bunu sayıyla bulmanın yolu yok: bir düzenin ortalanmamış
// olması, bir kenarı taşması ya da tahtanın yarısının boş kalması ancak
// yukarıdan bakınca görünüyor — oyuncunun gördüğü açı da zaten bu.
//
// Otuz dört kareyi tek tek açmak yerine ffmpeg ile tek sayfaya diziliyor.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i === -1 ? d : Number(process.argv[i + 1]);
};
const ILK = arg('from', 1), ADET = arg('count', 34);

const OUT = '/tmp/sheet';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(8244);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('http://localhost:8244/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.fruitHoleTopDown, { timeout: 25000 });
// Play'e basmak şart. Menü bir diorama ve dönüyor; oyunu menüden çıkarmadan
// çekilen her kare tahtayı eğik gösteriyor — `holeshot.mjs`'in başındaki
// uzun not bunun hikâyesi.
if (await pg.isVisible('#dailyBtn')) await pg.click('#dailyBtn');
await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 20000 });
await pg.click('#playBtn');
await pg.waitForTimeout(400);
await pg.evaluate(() => {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('show');
  for (const id of ['topbar', 'hint', 'combo', 'boosterBar', 'hud'])
    { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
});

const satir = [];
for (let i = 0; i < ADET; i++) {
  const n = ILK + i;
  // Tohum sabit: iki koşuda aynı tahtalar çıksın, yoksa "bu düzeltildi mi"
  // sorusunun cevabı her seferinde başka bir tarlaya bakmak olur.
  const p = await pg.evaluate(l => {
    window.fruitHoleSeedField(7000 + l);
    const ad = window.fruitHoleTopDown(l, 915 / 412);
    const t = window.fruitHoleTheme();
    const pr = window.fruitHoleProbe(l);
    window.fruitHoleUnseedField();
    return { ad, tema: t.theme, tahta: pr.kind, meyve: pr.fruit };
  }, n);
  // Tahtayı tekrar çizdir: probe kamerayı oynatmıyor ama tarlayı yeniden
  // kuruyor, yani son kare probe'dan önceki tahtaya ait kalırdı.
  await pg.evaluate(l => { window.fruitHoleSeedField(7000 + l);
    window.fruitHoleTopDown(l, 915 / 412); window.fruitHoleUnseedField(); }, n);
  satir.push(`${String(n).padStart(3)}  ${p.ad.padEnd(10)} ${p.tema.padEnd(12)} ` +
    `${p.tahta.padEnd(7)} ${String(p.meyve).padStart(4)} meyve`);
  console.log('  ' + satir[satir.length - 1]);
  await pg.screenshot({
    path: `${OUT}/${String(i).padStart(2, '0')}.png`,
    clip: { x: 66, y: 250, width: 280, height: 420 },
  });
}

// Tek sayfa. Sütun sayısı kareköke yakın: 34 için 6.
const sut = Math.ceil(Math.sqrt(ADET));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error',
  '-i', `${OUT}/%02d.png`,
  '-filter_complex', `tile=${sut}x${Math.ceil(ADET / sut)}:padding=4:margin=4:color=black`,
  '-frames:v', '1', `${OUT}/sayfa.png`]);

console.log(`\n  ${OUT}/sayfa.png   (${sut} sütun, soldan sağa ${ILK}..${ILK + ADET - 1})`);
console.log('hatalar: ' + (errs.length ? errs.join(' | ') : 'yok'));
await br.close();
srv.close();
process.exit(errs.length ? 1 : 0);
