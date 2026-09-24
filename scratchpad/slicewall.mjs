// Slice Rush kaçıncı bölümde yeni bir şey söylemeyi bırakıyor?
//
//   node build-www.mjs && node scratchpad/slicewall.mjs
//
// Neden var: bölüm üretimi sonsuz — buildCourse(n) her n için parkur
// kuruyor ve harita hep üç bölüm ileriyi gösteriyor. Ama üç ayar sonlu ve
// üçü de bir yerde duruyor:
//
//   * parça havuzu (PIECES) — en yüksek minLevel 5
//   * yuva sayısı           — Math.min(24 + n * 2, 48)
//   * hız                   — Math.min(8 + (n - 1) * 0.45, 15)
//
// Üçü de durduktan sonra 40. bölüm 20. bölümden istatistik olarak
// ayırt edilemez hâle geliyor. Oyuncunun "bu oyun bitti" dediği yer orası ve
// hiçbir yerde yazmıyordu.
//
// Ölçüm tahminle değil tahtanın kendisiyle yapılıyor: her bölüm gerçekten
// kuruluyor ve içindeki nesneler sayılıyor. Tahta rastgele olduğu için her
// bölüm ÖRNEK kadar kez kuruluyor ve ortalama alınıyor — tek bir kurulum
// gürültüyü ölçerdi.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const ÖRNEK = 5;
const SON = 30;

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-slicer' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8166);

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader'] });
const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
pg.on('console', m => {
  if (m.type() === 'error' && !m.text().includes('404')) errs.push('CONSOLE: ' + m.text());
});
await pg.goto('http://localhost:8166/', { waitUntil: 'load' });
await pg.waitForFunction(() => typeof window.sliceProbe === 'function', { timeout: 20000 });
if (await pg.isVisible('#dOk')) await pg.click('#dOk');

const satır = [];
for (let n = 1; n <= SON; n++) {
  const örnekler = [];
  for (let k = 0; k < ÖRNEK; k++) {
    örnekler.push(await pg.evaluate(lvl => {
      window.sliceStart(lvl);
      const p = window.sliceProbe();
      const demir = window.sliceBars().length;
      const mayin = window.sliceMines ? window.sliceMines().length : 0;
      return { nesne: p.items, demir, mayin, meyve: p.items - demir - mayin,
               boy: p.courseEnd };
    }, n));
  }
  const ort = k => +(örnekler.reduce((s, o) => s + o[k], 0) / ÖRNEK).toFixed(1);
  // Hız oyunun kendi formülünden; probe vermiyor ve tur sırasında ölçmek
  // zamanlamaya bağlı olurdu.
  satır.push({
    n, meyve: ort('meyve'), demir: ort('demir'), mayin: ort('mayin'), boy: ort('boy'),
    hız: +Math.min(8 + (n - 1) * 0.45, 15).toFixed(2),
  });
}

console.log(' blm | meyve | demir | mayın | parkur boyu | hız');
console.log('-----+-------+-------+-------+-------------+------');
for (const r of satır) {
  console.log(` ${String(r.n).padStart(3)} | ${String(r.meyve).padStart(5)} | ` +
    `${String(r.demir).padStart(5)} | ${String(r.mayin).padStart(5)} | ` +
    `${String(r.boy).padStart(11)} | ${r.hız.toFixed(2)}`);
}

// Duvar: bir ölçü artık kıpırdamıyorsa orada durmuş demektir. Son beş
// bölümün aralığı, o ölçünün kendi dalgalanmasının altındaysa durmuştur.
const son = satır.slice(-8);
const durdu = (k, tolerans) => {
  const v = son.map(r => r[k]);
  return Math.max(...v) - Math.min(...v) <= tolerans;
};
console.log('');
const boyDurdu = satır.find(r => r.boy >= satır[SON - 1].boy);
const hızDurdu = satır.find(r => r.hız >= 15);
console.log(`parkur boyu tavanına ${boyDurdu ? boyDurdu.n + '. bölümde' : 'hiç'} ulaşıyor`);
console.log(`hız tavanına ${hızDurdu ? hızDurdu.n + '. bölümde' : 'hiç'} ulaşıyor`);
// Havuzun ne zaman dolduğu oyundan okunuyor, elle yazılmıyor.
//
// Burada "5. bölümde doluyor" yazıyordu ve iki kez sessizce yanlış oldu:
// mayın 8. bölümde, salınım 18. bölümde havuza girdi. Bu dosyanın işi tam
// olarak "içerik ne zaman tükeniyor" sorusuna cevap vermek; cevabı sabit
// yazmak onu bozar.
const parcalar = await pg.evaluate(() => window.slicePieces());
const enGec = parcalar.reduce((m, p) => Math.max(m, p.minLevel), 0);
console.log(`parça havuzu ${enGec}. bölümde doluyor ` +
  `(${parcalar.length} parça: ` +
  parcalar.map(p => `${p.id}@${p.minLevel}`).join(', ') + ')');
console.log(`son sekiz bölümde meyve sayısı sabit mi: ${durdu('meyve', 6) ? 'EVET' : 'hayır'}`);
console.log(`son sekiz bölümde demir sayısı sabit mi: ${durdu('demir', 3) ? 'EVET' : 'hayır'}`);

console.log('\nerrors:', errs.length ? errs : 'none');
await br.close(); srv.close();
process.exitCode = errs.length ? 1 : 0;
