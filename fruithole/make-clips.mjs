// Fruit Hole'un tanıtım klipleri — gerçek oynanıştan, dikey, sessiz mp4.
//
//   node build-www.mjs && node fruithole/make-clips.mjs
//   node fruithole/make-clips.mjs --only space --seconds 12
//   -> fruithole/store/clips/*.mp4
//
// Neden var: bu tür oyunlar artık mağaza aramasından değil kısa videodan
// bulunuyor, ve indirme başına ~$0.16 değerinde bir oyun için reklam satın
// almak matematiksel olarak zarar (CPI $0.50-2.00). Yani organik video tek
// gerçekçi yol, ve klip üretmek bir komut olmalı — görünüm her değiştiğinde
// yeniden çekilebilsin diye, tıpkı make-shots.mjs gibi.
//
// ---------------------------------------------------------------------
// Neden ekran kaydı değil de kare kare
//
// Bu konteynerde GPU yok; Chromium SwiftShader'la, yani yazılımla çiziyor.
// Ölçtük: 540x960'ta 4 fps, 1080x1920'de 2 fps. Gerçek zamanlı kayıt bu
// hızda kasık bir video verirdi ve tanıtım videosunun kasması reklamın
// kendisini bozar.
//
// Çözüm: oyunun saatini ele geçirip kareyi biz ilerletiyoruz.
// `requestAnimationFrame` ve `performance.now` sahteleniyor, her adımda saat
// tam 1/30 saniye ileri gidiyor ve o karenin ekran görüntüsü alınıyor.
// Çizimin ne kadar sürdüğü sonuca yansımıyor — yalnızca üretimin ne kadar
// sürdüğüne. Çıkan video tam 30 fps ve pürüzsüz.
//
// Oyunun saatini okuduğu iki yer var (rAF'ın verdiği zaman damgası ve
// `performance.now()`), ikisi de aynı sahte saatten besleniyor; yoksa delik
// bir hızda, meyvenin düşüşü başka bir hızda ilerlerdi.
// ---------------------------------------------------------------------

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WWW = join(ROOT, 'www-fruithole');
const OUT = join(HERE, 'store', 'clips');
const TMP = '/tmp/fhclips';
const PORT = 8232;

const FPS = 30;
const CAP_W = 720, CAP_H = 1280;          // çizim boyutu
const OUT_W = 1080, OUT_H = 1920;         // sosyal medya standardı

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i === -1 ? d : process.argv[i + 1];
};
// Süre ve ısınma, ilk videonun ölçümünden geliyor.
//
// 17 Eylül'de yüklenen 15 saniyelik klip 266 izlenme aldı ve **ortalama
// izlenme 2.34 saniyede** kaldı; tamamlanma %4. Yani dağıtım sorunu yok —
// TikTok videoyu gösterdi, izleyici iki saniyede bıraktı.
//
// İki değişiklik:
//
//   * Süre 15 → 9. Tamamlanma oranı TikTok'un en ağır tarttığı sinyal ve
//     bu görüntü için 15 saniye uzun.
//   * Kayıt, koşunun başından değil **PRE saniye sonrasından** başlıyor.
//     Eski kliplerin ilk saniyelerinde delik küçüktü ve tarla henüz
//     açılmamıştı; ilk kare "ne oluyor" sorusunu cevaplamıyordu. Artık
//     kamera döndüğünde delik büyümüş ve tarlada süpürülmüş bir yol var.
//
// Isınma yalan söylemiyor: gösterilen şey oyunun gerçekten altıncı
// saniyesi, büyütülmüş bir delik değil.
const SECONDS = Number(arg('seconds', 9));
// Isınma: kaydetmeden oynanan kısım. Alt sınır deliğin büyümesi için, üst
// sınır beklemenin bir yerde bitmesi için; arada karar `fruitHoleAhead()`
// ile veriliyor.
const PRE_MIN = Number(arg('pre', 3));
const PRE_MAX = Number(arg('premax', 12));
// Deliğin kaç birim çevresine, kaç meyve. Yarıçap tahtanın yarı genişliği
// kadar (13 sütun × 1.05 ≈ 13.7 birim), yani "deliğin etrafında görünen yer".
const AHEAD_R = Number(arg('aheadr', 9));
const AHEAD_MIN = Number(arg('ahead', 50));
// Deliğin tarla kenarına en az bu kadar uzak olması isteniyor: kamera deliği
// takip ediyor, kenardaki bir delik kadrajın bir kısmını tarla dışına
// harcıyor.
const EDGE = Number(arg('edge', 2.5));
const ONLY = arg('only', null);

// Hangi bölümler?
//
// İlk seçim gözle yapılmıştı ve yanlış çıktı: Pillars seçilmişti, klibin
// yarısı boş zemindi. Ölçünce sebebi görüldü — Pillars tarladaki en seyrek
// desenlerden biri. Tanıtımda satan şey kalabalık bir tarlanın süpürülmesi;
// boş zemin izleyiciyi kaydırtıyor.
//
// **Düzen adıyla isteniyor, bölüm numarasıyla değil.** Buradaki numaralar
// bir kez kaydı: on dokuz düzen yirmi dörde çıkınca 9. bölüm voxel tahtası,
// 15. bölüm arabalı sinema, 19. bölüm yörünge olmaktan çıktı. Dosya yine
// beş video üretiyordu — sadece `shop.mp4`'te mağaza, `space.mp4`'te uzay
// yoktu, ve bunu ancak videoyu izleyen biri fark edebilirdi. Numara artık
// oyunun kendi sırasından okunuyor.
//
// Yoğunluk 24 bölüm için yeniden ölçüldü (tohumlu tarla, meyve sayısı):
//
//   24 Cross   482      11 Blocks  479      19 Ring    479
//   12 Stairs  427      14 Heart   420      10 Walls   385
//    1 Pyramid 277       7 Piles   116       4 Pillars 129
//
// Seçilenlerin temaları birbirinden farklı: altısı da kumsal olsa altı klip
// tek klip gibi izlenirdi.
const CLIPS = [
  { id: 'farm',   pattern: 'Cross',   note: 'Harvest · sürülmüş tarla, yeni tema — 482 meyve, en yoğunu' },
  { id: 'shop',   pattern: 'Blocks',  note: 'Gadget Shop · voxel tahta — 479' },
  { id: 'drive',  pattern: 'Ring',    note: 'Drive-In · arabalı sinema — 479' },
  { id: 'bar',    pattern: 'Stairs',  note: 'Happy Hour · bar tezgâhı — 427' },
  { id: 'space',  pattern: 'Heart',   note: 'Orbit · istasyon güvertesi — 420' },
  // Patron bölümü: her onuncu bölüm, tahtanın ucunda devasa bir meyve.
  // Düzen değil olay seçiliyor, o yüzden numara burada doğrudan veriliyor.
  { id: 'boss',   level: 10,          note: 'patron bölümü — 385 meyve, 9 dev' },
  // Kumsal en parlak zemin ve ikonun görünümü; yoğunluğu orta ama oyunun
  // kendini tanıttığı kare bu.
  { id: 'beach',  pattern: 'Pyramid', note: 'Beach · birinci bölüm — 277' },
];

// Oyunun saatini sahteleyen katman. Sayfadaki her şeyden önce çalışması
// gerekiyor, yoksa oyun gerçek rAF'a çoktan abone olmuş olur.
const FAKE_CLOCK = () => {
  let t = 0;
  const queue = [];
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  try {
    Object.defineProperty(window.performance, 'now', {
      configurable: true, value: () => t,
    });
  } catch (e) { window.performance.now = () => t; }
  // Bir "kare" = saati ilerlet, o an kuyrukta ne varsa çalıştır. Kuyruğu
  // kopyalayıp boşaltıyoruz: callback'ler çalışırken kendilerini yeniden
  // sıraya koyuyor, aynı turda ikinci kez çalışmasınlar.
  window.__step = ms => {
    t += ms;
    const batch = queue.splice(0, queue.length);
    for (const cb of batch) { try { cb(t); } catch (e) {} }
  };
  window.__clock = () => t;
};

const srv = createServer((q, r) => {
  const p = q.url === '/' ? '/index.html' : q.url.split('?')[0];
  try {
    const b = readFileSync(join(WWW, p));
    r.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
    r.end(b);
  } catch { r.writeHead(404); r.end('no'); }
}).listen(PORT);

if (!existsSync(join(WWW, 'index.html'))) {
  console.error('www-fruithole yok. Önce: node build-www.mjs');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const br = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const ffmpeg = existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : 'ffmpeg';

// Düzen adı -> bölüm numarası, oyunun kendi sırasından.
{
  const pg = await br.newPage({ viewport: { width: 412, height: 915 } });
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await pg.waitForFunction(() => typeof window.fruitHoleThemeTable === 'function',
    { timeout: 25000 });
  const order = await pg.evaluate(() => window.fruitHoleThemeTable().order);
  await pg.close();
  for (const c of CLIPS) {
    if (!c.pattern) continue;
    const i = order.indexOf(c.pattern);
    if (i < 0) throw new Error(`düzen bulunamadı: ${c.pattern} — oyundakiler: ${order.join(', ')}`);
    c.level = i + 1;
  }
}

const dusen = [];
for (const clip of CLIPS) {
  if (ONLY && clip.id !== ONLY) continue;
  // Bir klibin düşmesi partiyi bitirmemeli: dördü çıkmışken beşincisi
  // yüzünden hepsini baştan üretmek yirmi dakika demek.
  try {
  const t0 = Date.now();
  console.log(`\n${clip.id} — bölüm ${clip.level} — ${clip.note}`);

  const frameDir = join(TMP, clip.id);
  rmSync(frameDir, { recursive: true, force: true });
  mkdirSync(frameDir, { recursive: true });

  const pg = await br.newPage({ viewport: { width: CAP_W, height: CAP_H } });
  pg.on('pageerror', e => console.log('  SAYFA HATASI: ' + e));
  await pg.addInitScript(FAKE_CLOCK);
  await pg.addInitScript(lv => {
    localStorage.setItem('fruithole_level', String(lv));
    // Yükseltmeler kapalı: tanıtımda görülen hız ve boyut yeni oyuncunun
    // ilk günündeki hız ve boyut olsun, yoksa video yalan söyler.
    localStorage.setItem('fruithole_seen', '1');
  }, clip.level);

  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

  // Sahte saatte yükleme de adım istiyor: modüller ve ilk sahne kurulumu
  // rAF bekliyor olabilir.
  const pump = async (n, ms = 1000 / FPS) => {
    for (let i = 0; i < n; i++) await pg.evaluate(d => window.__step(d), ms);
  };
  await pg.waitForFunction(() => window.fruitHoleWhere, { timeout: 60000 });
  await pump(30);

  // Günlük meydan okuma ekranı her açılışta çıkmıyor: yeni bir profilde
  // (bölüm 1) doğrudan menü geliyor ve #dailyBtn DOM'da olduğu hâlde 0x0
  // kalıyor. `$()` onu yine buluyor, tıklamak ise otuz saniye bekleyip
  // düşüyor — varlığa değil görünürlüğe bakmak gerekiyor.
  if (await pg.isVisible('#dailyBtn')) { await pg.click('#dailyBtn'); await pump(10); }
  await pg.waitForSelector('#playBtn', { state: 'visible', timeout: 30000 });
  await pg.click('#playBtn');

  // Tarla düşerken oyun zaten oynanamıyor; o bir buçuk saniyeyi klibe
  // koymuyoruz, izleyici ilk karede oynanış görmeli.
  await pump(Math.round(1.8 * FPS));

  // Isınma: kaydetmeden oyna. Kare yakalamadığımız için bu kısım hızlı
  // geçiyor — maliyeti yalnızca çizim, ekran görüntüsü değil.
  const steer = () => pg.evaluate(() => {
    const w = window.fruitHoleWhere();
    const n = window.fruitHoleNearest();
    if (!n) { window.fruitHoleSteer(0, 0); return; }
    const dx = n.x - w.x, dz = n.z - w.z;
    const d = Math.hypot(dx, dz) || 1;
    window.fruitHoleSteer(dx / d, dz / d);
  });
  //
  // Ne zaman kaydetmeye başlanacağı sabit bir gecikme değil, **deliğin
  // çevresindeki meyve sayısı**.
  //
  // Sabit altı saniye şunu bilmiyordu: delik o an tarlanın neresinde. Ölçüm
  // tam olarak bunu gösterdi — 24. bölümün ilk karesinde ekranın alt yarısı
  // süpürülmüş boş toprak, meyve yukarıda kalmıştı. Tanıtımda ilk kare her
  // şey; 1. videonun ortalama izlenmesi 2.34 saniyeydi, yani izleyici tam
  // orada bırakıyor.
  //
  // Alt sınır delik büyüsün diye, üst sınır sonsuza kadar beklemesin diye.
  // Arada, çevresinde AHEAD_MIN meyve olan ilk kare aranıyor.
  // İkinci şart: delik tarlanın kenarında olmasın.
  //
  // Yalnızca meyve sayısına bakmak yetmedi. İlk denemede delik yoğun bir
  // öbeğe yapıştı ama öbek tarlanın sol kenarındaydı, ve kamera deliği takip
  // ettiği için karenin üçte biri tarlanın dışındaki düz yeşil zemin oldu.
  // Kalabalık bir kare istiyoruz, kalabalığın yanında boş bir şerit değil.
  const durum = () => pg.evaluate(r => {
    const w = window.fruitHoleWhere();
    return { yakin: window.fruitHoleAhead(r), x: w.x, halfX: w.halfX };
  }, AHEAD_R);
  const uygun = d => d.yakin >= AHEAD_MIN && Math.abs(d.x) <= d.halfX - EDGE;
  let warm = 0;
  for (; warm < Math.round(PRE_MIN * FPS); warm++) {
    await steer();
    await pg.evaluate(d => window.__step(d), 1000 / FPS);
  }
  const enCok = Math.round(PRE_MAX * FPS);
  let d = await durum();
  while (warm < enCok && !uygun(d)) {
    await steer();
    await pg.evaluate(dt => window.__step(dt), 1000 / FPS);
    d = await durum();
    warm++;
  }
  console.log(`  kayıt ${(warm / FPS).toFixed(1)}. saniyede başlıyor · ` +
    `çevrede ${d.yakin} meyve · kenara ${(d.halfX - Math.abs(d.x)).toFixed(1)} birim` +
    (uygun(d) ? '' : '  (şart sağlanmadı, üst sınıra dayandı)'));

  const total = Math.round(SECONDS * FPS);
  let shots = 0;
  for (let f = 0; f < total; f++) {
    // Otomatik oynayan taraf: en yakın meyveye doğru sür. Basit, ama
    // ekranda görünen şey tam olarak iyi bir oyuncunun yaptığı şey —
    // tarlayı süpüren sürekli bir yol.
    await steer();
    await pg.evaluate(d => window.__step(d), 1000 / FPS);
    await pg.screenshot({
      path: join(frameDir, String(f).padStart(5, '0') + '.png'),
      animations: 'disabled',
    });
    shots++;
    if (f % 60 === 0) {
      const w = await pg.evaluate(() => window.fruitHoleWhere());
      process.stdout.write(`  ${f}/${total} kare · yenen ${w.eaten}/${w.total} · süre ${w.timeLeft}s\r`);
    }
  }
  const son = await pg.evaluate(() => window.fruitHoleWhere());
  await pg.close();
  console.log(`  ${shots} kare · yenen ${son.eaten}/${son.total} · durum ${son.state}        `);

  // Yenen meyve sayısı sıfırsa video boş bir tarla gösteriyor demektir;
  // sessizce bir dosya bırakmaktansa söylemek daha iyi.
  if (son.eaten === 0) console.log('  UYARI: hiç meyve yenmemiş, klibe bakmadan yayınlama.');

  const mp4 = join(OUT, `${clip.id}.mp4`);
  const r = spawnSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', join(frameDir, '%05d.png'),
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-pix_fmt', 'yuv420p',          // yoksa bazı oynatıcılar hiç açmıyor
    '-movflags', '+faststart',      // yüklerken ilk kare hemen görünsün
    '-an',
    mp4,
  ], { encoding: 'utf8' });
  if (r.status !== 0) { console.log('  ffmpeg düştü:\n' + (r.stderr || '')); continue; }

  rmSync(frameDir, { recursive: true, force: true });
  console.log(`  -> ${mp4}  (${Math.round((Date.now() - t0) / 1000)} sn sürdü)`);
  } catch (e) {
    console.log(`  DÜŞTÜ: ${String(e).split('\n')[0]}`);
    dusen.push(clip.id);
  }
}

await br.close();
srv.close();
console.log(dusen.length ? `\nüretilemeyen: ${dusen.join(', ')}` : `\n${CLIPS.length} klibin hepsi çıktı`);
console.log(`klipler: ${OUT}`);
