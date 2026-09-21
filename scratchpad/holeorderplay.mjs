// Sipariş bölümü gerçekten oynanabiliyor mu, ve saati doğru mu?
//
//   node build-www.mjs && node scratchpad/holeorderplay.mjs
//   node scratchpad/holeorderplay.mjs --levels 5,15
//
// `holeorder.mjs` turu **modelle** ölçüyor: en yakın komşu, düz çizgiler, tam
// hız. Gerçek oyuncu öyle oynamıyor — delik dönerken savruluyor, yoldaki
// meyveye takılıyor, büyümek için hedef dışına sapıyor. Saat o modelin bir kat
// sayısı olarak veriliyor (siparişte 2.0, devlerde 4.0) ve o kat sayı burada
// ölçülüyor: tarla gerçekten oynanıp saatin ne kadarının kullanıldığına
// bakılıyor. İki görev tipini de oynuyor.
//
// Oyun saati sahteleniyor (make-clips.mjs'deki yöntem): konteynerde GPU yok,
// gerçek zamanlı oynamak ölçümü çizim hızına bağlardı.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i === -1 ? d : process.argv[i + 1];
};
const LEVELS = String(arg('levels', '5,15,25')).split(',').map(Number);
const FPS = 30;

const srv = createServer((req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const b = readFileSync('/home/user/holegame/www-fruithole' + p);
    res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(b);
  } catch { res.writeHead(404); res.end('no'); }
}).listen(8274);

const FAKE_CLOCK = () => {
  let t = 0;
  const queue = [];
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', { configurable: true, value: () => t });
  } catch (e) { window.performance.now = () => t; }
  window.__step = ms => {
    t += ms;
    const batch = queue.splice(0, queue.length);
    for (const cb of batch) { try { cb(t); } catch (e) {} }
  };
};

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const fails = [];
// Model sayıları **oynanan tahtadan** okunuyor, ayrı bir ölçümden değil.
// Tarla her koşuda farklı kuruluyor (tohumlanmıyor), yani başka bir koşunun
// tur süresiyle bu koşunun süresini karşılaştırmak iki ayrı tahtayı
// karşılaştırmak olur. Bir kez öyle yapıldı ve model "bozuk" göründü.
console.log(' blm | hedef | saat | model | bitti mi | kullanılan | kalan | yıldız | gerçek/tur   | notu');
console.log('-----+-------+------+-------+----------+------------+-------+--------+--------------+-----');

for (const lvl of LEVELS) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.addInitScript(FAKE_CLOCK);
  await pg.addInitScript(n => {
    localStorage.setItem('fruithole_level', String(n));
    localStorage.setItem('fruithole_seen', '1');
  }, lvl);
  await pg.goto('http://localhost:8274/', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
  // Yükleme perdesi kalkana kadar bekle. `fruitHoleWhere` dosyanın ortasında
  // tanımlanıyor, perdeyi kaldıran satır ise en sonda: ikisinin arasında
  // Play düğmesi görünür ama tıklanamaz durumda, ve tıklama otuz saniye
  // deneyip düşüyor. Yük altında bu aralık büyüyor.
  await pg.waitForFunction(() => {
    const l = document.getElementById('loading');
    return !l || getComputedStyle(l).display === 'none';
  }, { timeout: 60000 });

  const pump = async n => { for (let i = 0; i < n; i++) await pg.evaluate(d => window.__step(d), 1000 / FPS); };
  await pump(30);
  if (await pg.isVisible('#dailyBtn')) { await pg.click('#dailyBtn'); await pump(10); }
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
  await pg.click('#playBtn');
  await pump(Math.round(1.8 * FPS));     // tarla düşerken oynanmıyor

  const bas = await pg.evaluate(() => window.fruitHoleOrder());
  if (!bas.mission) { fails.push(`${lvl}. bölümde sipariş yok`); await ctx.close(); continue; }

  // Otomatik oyuncu: hedef meyveye git. Hedef o an yutulamıyorsa (dev ya da
  // büyük meyve) en yakın meyveye gidip büyü — gerçek oyuncunun yaptığı da bu,
  // ve onsuz bot devin önünde takılıp kalıyor.
  const adim = () => pg.evaluate(dt => {
    const w = window.fruitHoleWhere();
    const h = window.fruitHoleOrderNearest();
    const hedef = (h && h.eatable) ? h : (window.fruitHoleNearest() || h);
    if (hedef) {
      const dx = hedef.x - w.x, dz = hedef.z - w.z;
      const d = Math.hypot(dx, dz) || 1;
      window.fruitHoleSteer(dx / d, dz / d);
    }
    window.__step(dt);
    const o = window.fruitHoleOrder();
    return { state: w.state, timeLeft: w.timeLeft, done: o.done, goal: o.goal };
  }, 1000 / FPS);

  const saat = bas.saat;
  let s = { state: 'playing', timeLeft: saat, done: 0, goal: bas.goal };
  const enCok = Math.round((saat + 5) * FPS);
  let kare = 0;
  while (kare < enCok && s.state === 'playing') { s = await adim(); kare++; }

  const bitti = s.state === 'won';
  const kullanilan = +(saat - s.timeLeft).toFixed(1);
  const oran = s.timeLeft / saat;
  const yildiz = oran >= 0.45 ? 3 : oran >= 0.2 ? 2 : 1;
  // Modelin ham tahmini: saatin kat sayıdan önceki hâli. Devler bölümünde bu
  // **tur**, büyüme değil — büyüme turun içinde oluyor, ikisini toplamak aynı
  // süreyi iki kez saymak. Sütun bir süre toplamı yazdı ve oyunun kullandığı
  // formülle uyuşmuyordu; ölçüm aracının kendi sayısını uydurması, ölçtüğü
  // şeyi bozmasının en sessiz yolu.
  const model = bas.mission === 'giants' ? bas.devTuru : null;
  console.log(` ${String(lvl).padStart(3)} | ${String(bas.goal).padStart(5)} | ${String(saat).padStart(4)} | ` +
    `${String(model ?? '-').padStart(5)} | ${(bitti ? 'bitti' : s.state).padEnd(8)} | ` +
    `${String(kullanilan).padStart(10)} | ` +
    `${String(s.timeLeft).padStart(5)} | ${bitti ? String(yildiz).padStart(6) : '     -'} | ` +
    `${String(model ? (kullanilan / model).toFixed(2) : '-').padStart(12)} | ` +
    `${s.done}/${s.goal} ${bas.mission}` +
    (model ? ` (büyüme ${bas.buyume} + tur ${bas.devTuru})` : ''));
  if (!bitti) fails.push(`${lvl}. bölüm bitirilemedi (${s.done}/${s.goal})`);
  if (errs.length) fails.push(`${lvl}. bölüm sayfa hatası: ${errs[0]}`);
  await ctx.close();
}

console.log('\n' + (fails.length ? 'hatalar:\n - ' + fails.join('\n - ') : 'hepsi geçti'));
await br.close(); srv.close();
